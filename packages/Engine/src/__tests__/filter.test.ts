import { describe, it, expect } from "vitest";
import {
    compileFilter,
    compileFilterInline,
    CompositeFilterDescriptor,
} from "../factors/filter";

const columns = ["ActivityType", "Amount", "Notes"];

/** Sugar for a top-level group. */
function group(
    logic: "and" | "or",
    ...filters: CompositeFilterDescriptor["filters"]
): CompositeFilterDescriptor {
    return { logic, filters };
}

describe("compileFilter", () => {
    it("returns a null clause for no / empty filter", () => {
        expect(compileFilter(null, columns)).toEqual({ clause: null, params: {} });
        expect(compileFilter(group("and"), columns)).toEqual({
            clause: null,
            params: {},
        });
    });

    it("compiles a single equality leaf with a parameter", () => {
        const { clause, params } = compileFilter(
            group("and", { field: "ActivityType", operator: "eq", value: "EmailOpen" }),
            columns,
        );
        expect(clause).toBe("([ActivityType] = @f0)");
        expect(params).toEqual({ f0: "EmailOpen" });
    });

    it("combines leaves with AND and numbers each parameter uniquely", () => {
        const { clause, params } = compileFilter(
            group(
                "and",
                { field: "ActivityType", operator: "eq", value: "EmailOpen" },
                { field: "Amount", operator: "gt", value: 0 },
            ),
            columns,
        );
        expect(clause).toBe("([ActivityType] = @f0 AND [Amount] > @f1)");
        expect(params).toEqual({ f0: "EmailOpen", f1: 0 });
    });

    it("supports OR and nested groups", () => {
        const { clause } = compileFilter(
            group(
                "or",
                { field: "Amount", operator: "gte", value: 100 },
                group(
                    "and",
                    { field: "ActivityType", operator: "eq", value: "Gift" },
                    { field: "Amount", operator: "lt", value: 10 },
                ),
            ),
            columns,
        );
        expect(clause).toBe(
            "([Amount] >= @f0 OR ([ActivityType] = @f1 AND [Amount] < @f2))",
        );
    });

    it("maps contains to a parameterized LIKE (wildcards in the value)", () => {
        const { clause, params } = compileFilter(
            group("and", { field: "Notes", operator: "contains", value: "vip" }),
            columns,
        );
        expect(clause).toBe("([Notes] LIKE @f0)");
        expect(params).toEqual({ f0: "%vip%" });
    });

    it("maps null operators to IS [NOT] NULL with no parameter", () => {
        expect(
            compileFilter(
                group("and", { field: "Notes", operator: "isnull" }),
                columns,
            ).clause,
        ).toBe("([Notes] IS NULL)");
        expect(
            compileFilter(
                group("and", { field: "Notes", operator: "isnotempty" }),
                columns,
            ).clause,
        ).toBe("([Notes] IS NOT NULL)");
    });

    it("matches fields case-insensitively and uses canonical casing", () => {
        const { clause } = compileFilter(
            group("and", { field: "amount", operator: "gt", value: 0 }),
            columns,
        );
        expect(clause).toBe("([Amount] > @f0)");
    });

    it("throws on an unknown field (typo / injection guard)", () => {
        expect(() =>
            compileFilter(
                group("and", {
                    field: "Amount; DROP TABLE",
                    operator: "gt",
                    value: 0,
                }),
                columns,
            ),
        ).toThrow(/not a column/);
    });

    it("throws when a value-taking operator has no value", () => {
        expect(() =>
            compileFilter(
                group("and", { field: "Amount", operator: "gt" }),
                columns,
            ),
        ).toThrow(/requires a value/);
    });

    it("throws a clear error on a malformed descriptor (no filters array)", () => {
        expect(() =>
            compileFilter({ logic: "and" } as unknown as CompositeFilterDescriptor, columns),
        ).toThrow(/'filters' array/);
    });
});

describe("compileFilterInline", () => {
    it("returns null for no / empty filter", () => {
        expect(compileFilterInline(null, columns)).toBeNull();
        expect(compileFilterInline(group("and"), columns)).toBeNull();
    });

    it("inlines a string value with single quotes doubled (injection-safe)", () => {
        const sql = compileFilterInline(
            group("and", { field: "Notes", operator: "eq", value: "O'Brien" }),
            columns,
        );
        expect(sql).toBe("([Notes] = 'O''Brien')");
    });

    it("inlines numbers bare and combines a group", () => {
        const sql = compileFilterInline(
            group(
                "and",
                { field: "Amount", operator: "gte", value: 100 },
                { field: "ActivityType", operator: "eq", value: "Event" },
            ),
            columns,
        );
        expect(sql).toBe("([Amount] >= 100 AND [ActivityType] = 'Event')");
    });

    it("still validates field names (delegates to compileFilter)", () => {
        expect(() =>
            compileFilterInline(
                group("and", { field: "DROP TABLE", operator: "eq", value: "x" }),
                columns,
            ),
        ).toThrow(/not a column/);
    });

    it("rejects a non-finite numeric value instead of emitting invalid SQL", () => {
        expect(() =>
            compileFilterInline(
                group("and", { field: "Amount", operator: "gt", value: 1e400 }),
                columns,
            ),
        ).toThrow(/must be finite/);
    });
});
