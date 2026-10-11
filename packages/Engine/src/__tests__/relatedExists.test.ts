import { describe, it, expect } from "vitest";
import {
    compileFilter,
    compileFilterInline,
    CompositeFilterDescriptor,
    filterHasRelatedExists,
    RelatedExistsDescriptor,
} from "../factors/filter";
import { RelatedExistsEntity, resolveRelatedExistsSource } from "../factors/relatedExists";

const person: RelatedExistsEntity = {
    ID: "P",
    Name: "People",
    SchemaName: "common",
    BaseTable: "Person",
    PrimaryKeys: [{ Name: "ID" }],
    Fields: [
        { Name: "ID", RelatedEntityID: null, IsVirtual: false },
        { Name: "Status", RelatedEntityID: null, IsVirtual: false },
    ],
};
const profile: RelatedExistsEntity = {
    ID: "MP",
    Name: "Member Profiles",
    SchemaName: "members",
    BaseTable: "MemberProfile",
    PrimaryKeys: [{ Name: "ID" }],
    Fields: [
        { Name: "ID", RelatedEntityID: null, IsVirtual: false },
        { Name: "PersonID", RelatedEntityID: "P", IsVirtual: false },
        { Name: "Segment", RelatedEntityID: null, IsVirtual: false },
        { Name: "Person", RelatedEntityID: null, IsVirtual: true },
    ],
};
const order: RelatedExistsEntity = {
    ID: "OH",
    Name: "Order Headers",
    SchemaName: "orders",
    BaseTable: "OrderHeader",
    PrimaryKeys: [{ Name: "ID" }],
    Fields: [
        { Name: "ID", RelatedEntityID: null, IsVirtual: false },
        { Name: "BillToPersonID", RelatedEntityID: "P", IsVirtual: false },
        { Name: "ShipToPersonID", RelatedEntityID: "P", IsVirtual: false },
    ],
};
const entities: Record<string, RelatedExistsEntity> = { "Member Profiles": profile, "Order Headers": order };
const relatedResolver = (node: RelatedExistsDescriptor) => resolveRelatedExistsSource(person, entities[node.relatedEntity], node);
const personColumns = person.Fields.map((f) => f.Name);
const hasProfile: RelatedExistsDescriptor = { relatedEntity: "Member Profiles", operator: "exists" };

describe("related-exists population leaves", () => {
    it("compiles 'has a related record' to an uncorrelated IN over the single FK", () => {
        const sql = compileFilterInline({ logic: "and", filters: [hasProfile] }, personColumns, { relatedResolver });
        expect(sql).toBe(
            "([ID] IN (SELECT sx0.[PersonID] FROM [members].[MemberProfile] sx0 WHERE sx0.[PersonID] IS NOT NULL))",
        );
    });

    it("compiles notexists to NOT IN with the NULL-safe guard", () => {
        const sql = compileFilterInline(
            { logic: "and", filters: [{ ...hasProfile, operator: "notexists" }] },
            personColumns,
            { relatedResolver },
        );
        expect(sql).toContain("[ID] NOT IN (SELECT sx0.[PersonID]");
        expect(sql).toContain("sx0.[PersonID] IS NOT NULL");
    });

    it("qualifies a nested filter by the subquery alias and inlines its values", () => {
        const filter: CompositeFilterDescriptor = {
            logic: "and",
            filters: [
                { field: "Status", operator: "eq", value: "Active" },
                { ...hasProfile, filter: { logic: "and", filters: [{ field: "Segment", operator: "eq", value: "Producer's" }] } },
            ],
        };
        expect(compileFilterInline(filter, personColumns, { relatedResolver })).toBe(
            "([Status] = 'Active' AND [ID] IN (SELECT sx0.[PersonID] FROM [members].[MemberProfile] sx0 " +
                "WHERE sx0.[PersonID] IS NOT NULL AND (sx0.[Segment] = 'Producer''s')))",
        );
    });

    it("keeps parameters unique across the outer tree and the nested filter", () => {
        const { clause, params } = compileFilter(
            {
                logic: "or",
                filters: [
                    { field: "Status", operator: "eq", value: "A" },
                    { ...hasProfile, filter: { logic: "and", filters: [{ field: "Segment", operator: "eq", value: "B" }] } },
                ],
            },
            personColumns,
            "",
            { relatedResolver },
        );
        expect(params).toEqual({ f0: "A", f1: "B" });
        expect(clause).toContain("sx0.[Segment] = @f1");
    });

    it("rejects a nested filter on a virtual (view-only) column of the related entity", () => {
        const filter: CompositeFilterDescriptor = {
            logic: "and",
            filters: [{ ...hasProfile, filter: { logic: "and", filters: [{ field: "Person", operator: "isnotnull" }] } }],
        };
        expect(() => compileFilterInline(filter, personColumns, { relatedResolver })).toThrow(/not a column/);
    });

    it("refuses a related leaf where no resolver is configured (a factor's FilterExpression)", () => {
        expect(() => compileFilter({ logic: "and", filters: [hasProfile] }, personColumns)).toThrow(/only supported in a model's population filter/);
    });

    it("rejects an unknown related-record operator", () => {
        const bad = { relatedEntity: "Member Profiles", operator: "eq" } as unknown as RelatedExistsDescriptor;
        expect(() => compileFilterInline({ logic: "and", filters: [bad] }, personColumns, { relatedResolver })).toThrow(/'exists' or 'notexists'/);
    });

    it("detects related leaves anywhere in the tree", () => {
        expect(filterHasRelatedExists({ logic: "and", filters: [{ field: "Status", operator: "isnull" }] })).toBe(false);
        expect(filterHasRelatedExists({ logic: "or", filters: [{ logic: "and", filters: [hasProfile] }] })).toBe(true);
        expect(filterHasRelatedExists(null)).toBe(false);
    });
});

describe("resolveRelatedExistsSource", () => {
    it("requires exactly one FK to the anchor, naming them when ambiguous", () => {
        expect(() => resolveRelatedExistsSource(person, order, { relatedEntity: "Order Headers", operator: "exists" })).toThrow(
            /exactly one foreign key .* found 2 \(BillToPersonID, ShipToPersonID\)/,
        );
    });

    it("accepts an explicit foreignKey to disambiguate (case-insensitive)", () => {
        const src = resolveRelatedExistsSource(person, order, { relatedEntity: "Order Headers", operator: "exists", foreignKey: "billtopersonid" });
        expect(src).toEqual({ table: "[orders].[OrderHeader]", fkColumn: "BillToPersonID", anchorKeyColumn: "ID", validColumns: ["ID", "BillToPersonID", "ShipToPersonID"] });
    });

    it("rejects a foreignKey that does not point at the anchor", () => {
        expect(() => resolveRelatedExistsSource(person, profile, { relatedEntity: "Member Profiles", operator: "exists", foreignKey: "Segment" })).toThrow(
            /'Segment' is not a foreign key/,
        );
    });

    it("fails loud on an unknown entity, a related entity with no FK, and a composite anchor", () => {
        expect(() => resolveRelatedExistsSource(person, undefined, { relatedEntity: "Nope", operator: "exists" })).toThrow(/'Nope' was not found/);
        expect(() => resolveRelatedExistsSource(profile, order, { relatedEntity: "Order Headers", operator: "exists" })).toThrow(/found 0/);
        const composite = { ...person, PrimaryKeys: [{ Name: "A" }, { Name: "B" }] };
        expect(() => resolveRelatedExistsSource(composite, profile, hasProfile)).toThrow(/single-column anchor key/);
    });
});
