import { describe, it, expect } from "vitest";
import { sqlLiteral } from "../orchestration/ScoreWriter";

// sqlLiteral is the sole injection guard on the set-based bulk-write path (values are inlined, not
// bound, because a bulk write exceeds the ~2100 parameter cap). These lock the escape contract.
describe("sqlLiteral (bulk-write injection guard)", () => {
    it("nullish becomes NULL", () => {
        expect(sqlLiteral(null)).toBe("NULL");
        expect(sqlLiteral(undefined)).toBe("NULL");
    });

    it("N-prefixes strings and doubles single quotes", () => {
        expect(sqlLiteral("plain")).toBe("N'plain'");
        expect(sqlLiteral("")).toBe("N''");
        expect(sqlLiteral("O'Brien")).toBe("N'O''Brien'"); // real composite anchor id with an apostrophe
    });

    it("neutralizes an injection attempt (the quote is doubled, so it stays a literal)", () => {
        expect(sqlLiteral("'; DROP TABLE Score;--")).toBe("N'''; DROP TABLE Score;--'");
    });

    it("passes finite numbers through and maps non-finite to NULL", () => {
        expect(sqlLiteral(42)).toBe("42");
        expect(sqlLiteral(-3.5)).toBe("-3.5");
        expect(sqlLiteral(0)).toBe("0");
        expect(sqlLiteral(NaN)).toBe("NULL");
        expect(sqlLiteral(Infinity)).toBe("NULL");
        expect(sqlLiteral(-Infinity)).toBe("NULL");
    });

    it("renders booleans as bit", () => {
        expect(sqlLiteral(true)).toBe("1");
        expect(sqlLiteral(false)).toBe("0");
    });

    // The timestamp columns are datetimeoffset(7), so a date literal has to carry its offset. The
    // old form chopped the 'Z' to suit datetime2, leaving SQL Server to infer the zone for what was
    // already a UTC instant — the exact inference the datetimeoffset conversion removes.
    it("renders a Date as an offset-aware datetimeoffset literal", () => {
        const d = new Date(Date.UTC(2026, 6, 13, 17, 42, 6, 70)); // 2026-07-13T17:42:06.070Z
        expect(sqlLiteral(d)).toBe("'2026-07-13T17:42:06.070+00:00'");
    });
});
