import { describe, it, expect } from "vitest";
import { encodeContributionDetail, decodeContributionDetail } from "../scoring/contributionDetail";

describe("contributionDetail (DetailJSON codec)", () => {
    it("round-trips an explanation", () => {
        const json = encodeContributionDetail("Recent reviews highly negative.");
        expect(json).toBe('{"explanation":"Recent reviews highly negative."}');
        expect(decodeContributionDetail(json)).toBe("Recent reviews highly negative.");
    });

    it("encodes null/empty as NULL (no empty {} stored)", () => {
        expect(encodeContributionDetail(null)).toBeNull();
        expect(encodeContributionDetail(undefined)).toBeNull();
        expect(encodeContributionDetail("")).toBeNull();
    });

    it("decodes null / malformed / empty-explanation to null", () => {
        expect(decodeContributionDetail(null)).toBeNull();
        expect(decodeContributionDetail("not json")).toBeNull();
        expect(decodeContributionDetail("{}")).toBeNull();
        expect(decodeContributionDetail('{"explanation":""}')).toBeNull();
    });

    it("survives quotes/newlines in the explanation (the LLM reason is free text)", () => {
        const reason = `She said "great" — then,\nrenewed.`;
        expect(decodeContributionDetail(encodeContributionDetail(reason))).toBe(reason);
    });
});
