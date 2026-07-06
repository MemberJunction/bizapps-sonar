import { describe, it, expect } from "vitest";
import { CompositeKey } from "@memberjunction/core";
import { canonicalAnchorId, toAnchorKey } from "../factors/anchorKey";

/** Build an MJ CompositeKey from {FieldName,Value} pairs (the identity vehicle under test). */
function key(pairs: { FieldName: string; Value: string | number }[]): CompositeKey {
    return CompositeKey.FromKeyValuePairs(pairs);
}

describe("anchorKey — built on MJ CompositeKey", () => {
    it("single-column id is the bare value (back-compat with existing single-PK scores)", () => {
        expect(canonicalAnchorId(key([{ FieldName: "ID", Value: "abc-123" }]))).toBe("abc-123");
    });

    it("json preserves column order AND value type (faithful round-trip source)", () => {
        const k = toAnchorKey(
            key([{ FieldName: "MemberID", Value: 5 }, { FieldName: "OrgID", Value: 10 }]),
        );
        const parsed = JSON.parse(k.json) as { FieldName: string; Value: unknown }[];
        expect(parsed).toEqual([
            { FieldName: "MemberID", Value: 5 },
            { FieldName: "OrgID", Value: 10 },
        ]);
        // int stays int — reloads as 5, not "5"
        expect(typeof parsed[0].Value).toBe("number");
    });

    it("values are in primary-key order for the OPENJSON tuples", () => {
        const k = toAnchorKey(
            key([{ FieldName: "MemberID", Value: 5 }, { FieldName: "OrgID", Value: 10 }]),
        );
        expect(k.values).toEqual([5, 10]);
    });

    it("different composite tuples never serialize to the same id (no collision)", () => {
        // The classic boundary case: ("a","bc") vs ("ab","c").
        const left = canonicalAnchorId(key([{ FieldName: "A", Value: "a" }, { FieldName: "B", Value: "bc" }]));
        const right = canonicalAnchorId(key([{ FieldName: "A", Value: "ab" }, { FieldName: "B", Value: "c" }]));
        expect(left).not.toBe(right);
    });

    it("escapes the delimiter so a value containing it can't collide with extra columns", () => {
        // (a|b, c) must not equal (a, b, c) — a raw delimiter inside a value is escaped.
        const withDelim = canonicalAnchorId(
            key([{ FieldName: "A", Value: "a|b" }, { FieldName: "B", Value: "c" }]),
        );
        const threeCols = canonicalAnchorId(
            key([{ FieldName: "A", Value: "a" }, { FieldName: "B", Value: "b" }, { FieldName: "C", Value: "c" }]),
        );
        expect(withDelim).not.toBe(threeCols);
    });
});
