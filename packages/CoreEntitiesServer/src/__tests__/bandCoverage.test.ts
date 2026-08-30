import { describe, expect, it } from "vitest";
import { describeCoverageProblem, BandRangeRow } from "../bandCoverage";

/**
 * The publish gate's band-coverage rule. These lock in the invariant ScoringEngine.assignBand relies
 * on — half-open, contiguous, non-overlapping — because BOTH ways of breaking it are silent at
 * runtime: a gap gives an anchor no band at all, and an overlap hands the score to whichever band
 * happens to sort first.
 */
const SCALE = { min: 0, max: 100 };

/** The canonical healthy set: adjacent bands SHARE a boundary, because ranges are half-open. */
const tiling: BandRangeRow[] = [
    { label: "At Risk", minScore: 0, maxScore: 40 },
    { label: "Neutral", minScore: 40, maxScore: 70 },
    { label: "Healthy", minScore: 70, maxScore: 100 },
];

describe("describeCoverageProblem", () => {
    it("accepts a set that tiles the scale exactly", () => {
        expect(describeCoverageProblem(tiling, SCALE)).toBeNull();
    });

    it("accepts a single band spanning the whole scale", () => {
        expect(describeCoverageProblem([{ label: "All", minScore: 0, maxScore: 100 }], SCALE)).toBeNull();
    });

    it("is order-independent (the rule sorts, it doesn't trust input order)", () => {
        const shuffled = [tiling[2], tiling[0], tiling[1]];
        expect(describeCoverageProblem(shuffled, SCALE)).toBeNull();
    });

    it("rejects an empty set", () => {
        expect(describeCoverageProblem([], SCALE)).toMatch(/no bands/i);
    });

    it("catches an interior gap and names the unclaimed range", () => {
        const gapped: BandRangeRow[] = [
            { label: "At Risk", minScore: 0, maxScore: 40 },
            { label: "Neutral", minScore: 50, maxScore: 70 }, // 40–50 belongs to nobody
            { label: "Healthy", minScore: 70, maxScore: 100 },
        ];
        const problem = describeCoverageProblem(gapped, SCALE);
        expect(problem).toContain("40");
        expect(problem).toContain("50");
        expect(problem).toMatch(/no band/i);
    });

    it("catches an overlap, which is the silent one (lower band quietly wins)", () => {
        const overlapping: BandRangeRow[] = [
            { label: "At Risk", minScore: 0, maxScore: 40 },
            { label: "Neutral", minScore: 30, maxScore: 70 }, // 30–40 claimed twice
            { label: "Healthy", minScore: 70, maxScore: 100 },
        ];
        const problem = describeCoverageProblem(overlapping, SCALE);
        expect(problem).toMatch(/overlap/i);
        expect(problem).toContain("At Risk");
        expect(problem).toContain("Neutral");
    });

    it("catches a hole at the bottom of the scale", () => {
        const floating = tiling.map((b) => (b.label === "At Risk" ? { ...b, minScore: 10 } : b));
        expect(describeCoverageProblem(floating, SCALE)).toMatch(/lowest band must start at 0/i);
    });

    it("catches a hole at the top of the scale", () => {
        const short = tiling.map((b) => (b.label === "Healthy" ? { ...b, maxScore: 90 } : b));
        expect(describeCoverageProblem(short, SCALE)).toMatch(/highest band must end at 100/i);
    });

    it("catches an inverted band, which can never match any score", () => {
        const inverted: BandRangeRow[] = [{ label: "Broken", minScore: 80, maxScore: 20 }];
        expect(describeCoverageProblem(inverted, SCALE)).toMatch(/at or above its top/i);
    });

    it("catches a zero-width band for the same reason", () => {
        const zero: BandRangeRow[] = [
            { label: "At Risk", minScore: 0, maxScore: 50 },
            { label: "Ghost", minScore: 50, maxScore: 50 },
            { label: "Healthy", minScore: 50, maxScore: 100 },
        ];
        expect(describeCoverageProblem(zero, SCALE)).toMatch(/at or above its top/i);
    });

    it("validates against the model's OWN scale, not a hardcoded 0-100", () => {
        const onFiveHundred: BandRangeRow[] = [
            { label: "Low", minScore: 0, maxScore: 250 },
            { label: "High", minScore: 250, maxScore: 500 },
        ];
        expect(describeCoverageProblem(onFiveHundred, { min: 0, max: 500 })).toBeNull();
        // The same bands are short of a 0–1000 scale.
        expect(describeCoverageProblem(onFiveHundred, { min: 0, max: 1000 })).toMatch(/must end at 1000/i);
    });

    it("handles a non-zero scale floor", () => {
        const shifted: BandRangeRow[] = [
            { label: "Low", minScore: 10, maxScore: 55 },
            { label: "High", minScore: 55, maxScore: 100 },
        ];
        expect(describeCoverageProblem(shifted, { min: 10, max: 100 })).toBeNull();
        expect(describeCoverageProblem(shifted, { min: 0, max: 100 })).toMatch(/must start at 0/i);
    });
});
