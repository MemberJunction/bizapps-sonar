import { describe, expect, it } from "vitest";
import {
    BandRange,
    bandsCoverScale,
    planBandDelete,
    planBandInsert,
    planContiguousBandEdit,
} from "../band-coverage";

/**
 * The band-editing planners behind the model builder's inline band controls.
 *
 * The property that matters is the same for every operation: whatever the user does, the resulting
 * set still TILES the scale. So most of these assert on the set AFTER applying the plan, not just on
 * the plan's fields — a plan that looks right but leaves a hole is the bug we're guarding against.
 */
const SCALE = { min: 0, max: 100 };

const tiling = (): BandRange[] => [
    { id: "risk", min: 0, max: 40, label: "At Risk" },
    { id: "neutral", min: 40, max: 70, label: "Neutral" },
    { id: "healthy", min: 70, max: 100, label: "Healthy" },
];

/** Apply an edit plan to a set, the way the component does. */
function applyEdit(bands: BandRange[], plan: ReturnType<typeof planContiguousBandEdit>): BandRange[] {
    return bands.map((b) => {
        if (b.id === plan.applied.id) return { ...b, min: plan.applied.min, max: plan.applied.max };
        const n = plan.neighbours.find((x) => x.id === b.id);
        return n ? { ...b, min: n.min ?? b.min, max: n.max ?? b.max } : b;
    });
}

describe("bandsCoverScale", () => {
    it("accepts an exact tiling and rejects gaps, overlaps and short ends", () => {
        expect(bandsCoverScale(tiling(), SCALE)).toBe(true);
        expect(bandsCoverScale([], SCALE)).toBe(false);
        // gap
        expect(bandsCoverScale([{ id: "a", min: 0, max: 40 }, { id: "b", min: 50, max: 100 }], SCALE)).toBe(false);
        // overlap
        expect(bandsCoverScale([{ id: "a", min: 0, max: 60 }, { id: "b", min: 40, max: 100 }], SCALE)).toBe(false);
        // doesn't reach the top
        expect(bandsCoverScale([{ id: "a", min: 0, max: 90 }], SCALE)).toBe(false);
    });
});

describe("planContiguousBandEdit", () => {
    it("drags the neighbour with the seam when a boundary moves up", () => {
        const plan = planContiguousBandEdit(tiling(), "neutral", { min: 40, max: 80 }, SCALE);
        const after = applyEdit(tiling(), plan);
        expect(plan.clamped).toBe(false);
        expect(after.find((b) => b.id === "healthy")).toMatchObject({ min: 80, max: 100 });
        expect(bandsCoverScale(after, SCALE)).toBe(true);
    });

    it("drags the lower neighbour when a floor moves down", () => {
        const plan = planContiguousBandEdit(tiling(), "neutral", { min: 30, max: 70 }, SCALE);
        const after = applyEdit(tiling(), plan);
        expect(after.find((b) => b.id === "risk")).toMatchObject({ min: 0, max: 30 });
        expect(bandsCoverScale(after, SCALE)).toBe(true);
    });

    it("REFUSES an inverted range instead of reshaping bands the user never touched", () => {
        const plan = planContiguousBandEdit(tiling(), "neutral", { min: 80, max: 50 }, SCALE);
        expect(plan.neighbours).toHaveLength(0);
        expect(plan.clampReason).toMatch(/floor has to be below its top/i);
        expect(applyEdit(tiling(), plan)).toEqual(tiling());
    });

    it("REFUSES an out-of-scale range rather than squeezing a neighbour to nothing", () => {
        const plan = planContiguousBandEdit(tiling(), "neutral", { min: 40, max: 150 }, SCALE);
        expect(plan.neighbours).toHaveLength(0);
        expect(plan.clampReason).toMatch(/between 0 and 100/i);
        expect(applyEdit(tiling(), plan)).toEqual(tiling());
    });

    it("pins the lowest band's floor to the scale, so no hole opens at the bottom", () => {
        const plan = planContiguousBandEdit(tiling(), "risk", { min: 10, max: 40 }, SCALE);
        expect(plan.applied.min).toBe(0);
        expect(plan.clampReason).toMatch(/has to start at 0/i);
        expect(bandsCoverScale(applyEdit(tiling(), plan), SCALE)).toBe(true);
    });

    it("pins the highest band's top to the scale", () => {
        const plan = planContiguousBandEdit(tiling(), "healthy", { min: 70, max: 90 }, SCALE);
        expect(plan.applied.max).toBe(100);
        expect(plan.clampReason).toMatch(/has to end at 100/i);
        expect(bandsCoverScale(applyEdit(tiling(), plan), SCALE)).toBe(true);
    });

    it("leaves a neighbour at least 1 wide, and names it when clamping", () => {
        // 99 is in range and legal, but it squeezes Healthy to exactly the minimum width.
        const plan = planContiguousBandEdit(tiling(), "neutral", { min: 40, max: 99 }, SCALE);
        const after = applyEdit(tiling(), plan);
        expect(after.find((b) => b.id === "healthy")).toMatchObject({ min: 99, max: 100 });
        expect(bandsCoverScale(after, SCALE)).toBe(true);
    });

    it("is a no-op for a band that isn't in the set", () => {
        const plan = planContiguousBandEdit(tiling(), "ghost", { min: 0, max: 5 }, SCALE);
        expect(plan.neighbours).toHaveLength(0);
        expect(plan.clampReason).toMatch(/no longer in this set/i);
    });
});

describe("planBandDelete", () => {
    it("hands the vacated range to the band BELOW (the cautious direction)", () => {
        const plan = planBandDelete(tiling(), "neutral", SCALE);
        // Neutral's 40-70 goes to At Risk, so those members stay in the worse band rather than
        // being silently promoted to Healthy and dropping out of interventions.
        expect(plan.absorbedBy).toMatchObject({ id: "risk", max: 70 });
        const after = tiling()
            .filter((b) => b.id !== "neutral")
            .map((b) => (b.id === "risk" ? { ...b, max: 70 } : b));
        expect(bandsCoverScale(after, SCALE)).toBe(true);
    });

    it("stretches the band ABOVE down to the floor when the lowest band goes", () => {
        const plan = planBandDelete(tiling(), "risk", SCALE);
        expect(plan.absorbedBy).toMatchObject({ id: "neutral", min: 0 });
        const after = tiling()
            .filter((b) => b.id !== "risk")
            .map((b) => (b.id === "neutral" ? { ...b, min: 0 } : b));
        expect(bandsCoverScale(after, SCALE)).toBe(true);
    });

    it("stretches the band below up to the ceiling when the highest band goes", () => {
        const plan = planBandDelete(tiling(), "healthy", SCALE);
        expect(plan.absorbedBy).toMatchObject({ id: "neutral", max: 100 });
    });

    it("says so when deleting the last remaining band", () => {
        const plan = planBandDelete([{ id: "only", min: 0, max: 100 }], "only", SCALE);
        expect(plan.absorbedBy).toBeUndefined();
        expect(plan.note).toMatch(/last band/i);
    });
});

describe("planBandInsert", () => {
    it("covers the whole scale when there are no bands yet", () => {
        const plan = planBandInsert([], SCALE);
        expect(plan.newBand).toEqual({ min: 0, max: 100 });
        expect(plan.shrink).toBeUndefined();
        expect(bandsCoverScale([{ id: "new", ...plan.newBand }], SCALE)).toBe(true);
    });

    it("splits the WIDEST band by default, so it never squeezes an already-tight one", () => {
        const uneven: BandRange[] = [
            { id: "narrow", min: 0, max: 10, label: "Narrow" },
            { id: "wide", min: 10, max: 100, label: "Wide" },
        ];
        const plan = planBandInsert(uneven, SCALE);
        expect(plan.shrink?.id).toBe("wide");
        expect(plan.hostLabel).toBe("Wide");
    });

    it("keeps the set tiling after the split is applied", () => {
        const plan = planBandInsert(tiling(), SCALE, 55);
        const after = tiling()
            .map((b) => (b.id === plan.shrink?.id ? { ...b, max: plan.shrink!.max ?? b.max } : b))
            .concat({ id: "new", ...plan.newBand });
        expect(bandsCoverScale(after, SCALE)).toBe(true);
    });

    it("takes the TOP of its host, so the new band's max is the host's old max", () => {
        const plan = planBandInsert(tiling(), SCALE, 80);
        expect(plan.newBand).toEqual({ min: 80, max: 100 });
        expect(plan.shrink).toMatchObject({ id: "healthy", max: 80 });
    });

    it("splits whichever band CONTAINS the point, not just the widest one", () => {
        // At Risk (0-40) is the widest band here, but 80 sits in Healthy — the point picks the host.
        const plan = planBandInsert(tiling(), SCALE, 80);
        expect(plan.shrink?.id).toBe("healthy");
        expect(plan.hostLabel).toBe("Healthy");
        // ...and a point inside the widest band still splits that one.
        expect(planBandInsert(tiling(), SCALE, 20).shrink?.id).toBe("risk");
    });

    it("nudges a split point that lands exactly on a boundary, and says so", () => {
        // 40 is the seam between At Risk and Neutral; splitting there would make a zero-width band.
        const plan = planBandInsert(tiling(), SCALE, 40);
        expect(plan.possible).toBe(true);
        expect(plan.note).toMatch(/split moved/i);
        const after = tiling()
            .map((b) => (b.id === plan.shrink?.id ? { ...b, max: plan.shrink!.max ?? b.max } : b))
            .concat({ id: "new", ...plan.newBand });
        expect(bandsCoverScale(after, SCALE)).toBe(true);
    });

    it("reports impossible when every band is too narrow to split", () => {
        const cramped: BandRange[] = [
            { id: "a", min: 0, max: 1, label: "A" },
            { id: "b", min: 1, max: 2, label: "B" },
        ];
        const plan = planBandInsert(cramped, { min: 0, max: 2 });
        expect(plan.possible).toBe(false);
        expect(plan.note).toMatch(/too narrow/i);
    });
});
