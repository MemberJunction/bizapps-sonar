import { describe, it, expect } from "vitest";
import { IsGuid, SqlGuid } from "../sqlGuid";

/**
 * Locks down the shared GUID guard that gates every id interpolated into a RunView ExtraFilter in
 * this package (publishLock, ScoreModelEntityServer). Mirrors the SonarActionBase.isGuid test cases —
 * the two validators must stay in agreement.
 */

const GUID = "a1b2c3d4-e5f6-7890-ab12-cd34ef567890";

describe("IsGuid (strict canonical UUID)", () => {
    it("accepts a canonical 8-4-4-4-12 UUID, either case", () => {
        expect(IsGuid(GUID)).toBe(true);
        expect(IsGuid("A1B2C3D4-E5F6-7890-AB12-CD34EF567890")).toBe(true);
    });

    it("rejects junk a loose char-class would pass", () => {
        expect(IsGuid("------------------------------------")).toBe(false); // all dashes
        expect(IsGuid("not-a-guid")).toBe(false);
        expect(IsGuid("a1b2c3d4e5f67890ab12cd34ef567890")).toBe(false); // no dashes
        expect(IsGuid(`${GUID}' OR '1'='1`)).toBe(false); // injection-shaped
        expect(IsGuid("")).toBe(false);
    });

    it("rejects null/undefined without throwing", () => {
        expect(IsGuid(null)).toBe(false);
        expect(IsGuid(undefined)).toBe(false);
    });
});

describe("SqlGuid (validate-or-throw)", () => {
    it("returns a valid GUID verbatim", () => {
        expect(SqlGuid(GUID, "ScoreModelID")).toBe(GUID);
    });

    it("throws on a non-GUID, naming the offending field", () => {
        expect(() => SqlGuid("x' OR '1'='1", "BandSetID")).toThrow(/BandSetID/);
    });
});
