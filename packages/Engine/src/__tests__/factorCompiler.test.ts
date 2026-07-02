import { describe, it, expect } from "vitest";
import {
    parseRelationshipPath,
    findAutoPathHops,
    FkGraphEntity,
} from "../factors/FactorCompiler";

/** Tiny FK-graph builder: each entity is { ID, Name, Fields:[{Name, RelatedEntityID}] }. */
function ent(
    id: string,
    fks: Array<[string, string]> = [],
): FkGraphEntity {
    return {
        ID: id,
        Name: id,
        Fields: fks.map(([Name, RelatedEntityID]) => ({ Name, RelatedEntityID })),
    };
}

describe("parseRelationshipPath", () => {
    it("treats null / empty / '[]' as no path (single-hop)", () => {
        expect(parseRelationshipPath(null)).toEqual([]);
        expect(parseRelationshipPath("")).toEqual([]);
        expect(parseRelationshipPath("  ")).toEqual([]);
        expect(parseRelationshipPath("[]")).toEqual([]);
    });

    it("parses single-column fk hops (entity optional) into a one-element fks bundle", () => {
        expect(
            parseRelationshipPath('[{"fk":"EmailSendID","entity":"Email Sends"}]'),
        ).toEqual([{ fks: ["EmailSendID"], entity: "Email Sends" }]);

        expect(parseRelationshipPath('[{"fk":"AID"},{"fk":"BID"}]')).toEqual([
            { fks: ["AID"], entity: undefined },
            { fks: ["BID"], entity: undefined },
        ]);
    });

    it("parses a composite hop given as an fks array", () => {
        expect(parseRelationshipPath('[{"fks":["TenantID","MemberID"]}]')).toEqual([
            { fks: ["TenantID", "MemberID"], entity: undefined },
        ]);
    });

    it("throws on invalid JSON, non-array, and hops missing a string fk", () => {
        expect(() => parseRelationshipPath("{not json")).toThrow(/not valid JSON/);
        expect(() => parseRelationshipPath('{"fk":"x"}')).toThrow(/must be a JSON array/);
        expect(() => parseRelationshipPath("[{}]")).toThrow(/non-empty string 'fk'/);
        expect(() => parseRelationshipPath('[{"fk":123}]')).toThrow(/non-empty string 'fk'/);
    });
});

describe("findAutoPathHops", () => {
    // Member → EmailSend → EmailClick (each child holds the FK to its parent).
    const member = ent("M");
    const emailSend = ent("S", [["MemberID", "M"]]);
    const emailClick = ent("C", [["EmailSendID", "S"]]);

    it("resolves a 2-hop chain to the leaf-side hop only (anchor FK left to resolveAnchorKeyColumn)", () => {
        const hops = findAutoPathHops([member, emailSend, emailClick], "M", "C");
        expect(hops).toEqual([{ fks: ["EmailSendID"] }]);
    });

    it("resolves a 3-hop chain in leaf→anchor order", () => {
        // M → A → B → Leaf
        const a = ent("A", [["MID", "M"]]);
        const b = ent("B", [["AID", "A"]]);
        const leaf = ent("L", [["BID", "B"]]);
        const hops = findAutoPathHops([member, a, b, leaf], "M", "L");
        expect(hops).toEqual([{ fks: ["BID"] }, { fks: ["AID"] }]);
    });

    it("coalesces a COMPOSITE FK (two columns to the same parent) into one bundled hop — no false ambiguity", () => {
        // M → J → Leaf, where Leaf reaches J by a 2-column FK (both columns point at J). Pre-fix this
        // looked like two parallel arrows → false "ambiguous"; now it's one arrow carrying both columns.
        const j = ent("J", [["MID", "M"]]);
        const leaf = ent("L", [["TenantID", "J"], ["JID", "J"]]);
        const hops = findAutoPathHops([member, j, leaf], "M", "L");
        expect(hops).toEqual([{ fks: ["TenantID", "JID"] }]);
    });

    it("returns [] for a direct child (path length 1 → single-hop)", () => {
        expect(findAutoPathHops([member, emailSend], "M", "S")).toEqual([]);
    });

    it("throws when the leaf is unreachable from the anchor", () => {
        const orphan = ent("O"); // no FK chain to M
        expect(() => findAutoPathHops([member, orphan], "M", "O")).toThrow(
            /no foreign-key path/,
        );
    });

    it("throws when two distinct shortest paths reach the leaf (ambiguous)", () => {
        // M → A → Leaf and M → B → Leaf (Leaf has an FK via each side).
        const a = ent("A", [["MID", "M"]]);
        const b = ent("B", [["MID", "M"]]);
        const leaf = ent("L", [["AID", "A"], ["BID", "B"]]);
        expect(() => findAutoPathHops([member, a, b, leaf], "M", "L")).toThrow(
            /multiple foreign-key paths/,
        );
    });

    it("honors the depth bound", () => {
        const a = ent("A", [["MID", "M"]]);
        const b = ent("B", [["AID", "A"]]);
        const leaf = ent("L", [["BID", "B"]]);
        // Leaf is 3 hops out; a maxDepth of 2 can't reach it.
        expect(() => findAutoPathHops([member, a, b, leaf], "M", "L", 2)).toThrow(
            /no foreign-key path/,
        );
    });
});
