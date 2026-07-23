import { describe, it, expect } from "vitest";
import { bandMove, classifyOutcome, computeLift, MeasuredMovement } from "../orchestration/OutcomeMeasurer";

describe("bandMove / classifyOutcome", () => {
    it("compares bands by MinScore (higher floor = better)", () => {
        expect(bandMove(0, 40)).toBe(1);   // climbed
        expect(bandMove(40, 0)).toBe(-1);  // dropped
        expect(bandMove(40, 40)).toBe(0);  // same
    });
    it("unknown bands compare equal (no false movement)", () => {
        expect(bandMove(null, 40)).toBe(0);
        expect(bandMove(40, null)).toBe(0);
    });
    it("maps movement to engagement outcomes", () => {
        expect(classifyOutcome(1)).toBe("Reactivated");
        expect(classifyOutcome(-1)).toBe("Churned");
        expect(classifyOutcome(0)).toBe("NoChange");
    });
});

describe("computeLift", () => {
    const mv = (cohort: "Treatment" | "Control", scoreDelta: number, bandMove: -1 | 0 | 1): MeasuredMovement => ({ cohort, scoreDelta, bandMove });

    it("score lift = treatment mean movement minus control mean movement", () => {
        const lift = computeLift([mv("Treatment", 6, 1), mv("Treatment", 2, 0), mv("Control", 1, 0), mv("Control", -1, 0)]);
        expect(lift.avgScoreDeltaTreatment).toBe(4);
        expect(lift.avgScoreDeltaControl).toBe(0);
        expect(lift.scoreLift).toBe(4);
    });

    it("band-up lift in percentage points", () => {
        const lift = computeLift([mv("Treatment", 5, 1), mv("Treatment", 5, 1), mv("Treatment", 0, 0), mv("Treatment", 0, 0), mv("Control", 0, 0), mv("Control", 4, 1)]);
        expect(lift.bandUpRateTreatment).toBeCloseTo(0.5);
        expect(lift.bandUpRateControl).toBeCloseTo(0.5);
        expect(lift.bandUpLiftPct).toBeCloseTo(0);
    });

    it("an empty cohort yields null lift, never NaN — no control group means no causal claim", () => {
        const lift = computeLift([mv("Treatment", 9, 1)]);
        expect(lift.avgScoreDeltaControl).toBeNull();
        expect(lift.scoreLift).toBeNull();
        expect(lift.bandUpLiftPct).toBeNull();
    });
});
