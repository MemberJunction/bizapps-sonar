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

import { compareOp, parseOutcomeDefinition, outcomeLabel } from "../orchestration/OutcomeMeasurer";

describe("parseOutcomeDefinition", () => {
    it("null/garbage → BandRecovery default", () => {
        expect(parseOutcomeDefinition(null)).toEqual({ type: "BandRecovery" });
        expect(parseOutcomeDefinition("{not json")).toEqual({ type: "BandRecovery" });
        expect(parseOutcomeDefinition('{"type":"Nonsense"}')).toEqual({ type: "BandRecovery" });
    });
    it("parses ReachScore + AnchorField, rejects bad ops", () => {
        expect(parseOutcomeDefinition('{"type":"ReachScore","minScore":70}')).toEqual({ type: "ReachScore", minScore: 70 });
        expect(parseOutcomeDefinition('{"type":"AnchorField","field":"Status","op":"=","value":"Active"}'))
            .toEqual({ type: "AnchorField", field: "Status", op: "=", value: "Active" });
        expect(parseOutcomeDefinition('{"type":"AnchorField","field":"Status","op":"LIKE","value":"x"}')).toEqual({ type: "BandRecovery" });
    });
});

describe("compareOp", () => {
    it("numeric when both sides parse as numbers", () => {
        expect(compareOp(">=", 72, "70")).toBe(true);
        expect(compareOp("<", 72, "70")).toBe(false);
    });
    it("string compare otherwise", () => {
        expect(compareOp("=", "Active", "Active")).toBe(true);
        expect(compareOp("!=", "Lapsed", "Active")).toBe(true);
    });
    it("null field value never spuriously succeeds, under ANY operator", () => {
        expect(compareOp("=", null, "Active")).toBe(false);
        expect(compareOp(">=", null, "70")).toBe(false);
        // `!=` is the one that used to leak: "no status at all" is not the same as "status is not Active",
        // and counting it as a win reports success for every member nothing is known about.
        expect(compareOp("!=", null, "Active")).toBe(false);
        expect(compareOp("!=", undefined, "Active")).toBe(false);
        expect(compareOp("<", undefined, "2026-08-01")).toBe(false);
    });

    describe("dates", () => {
        // The regression this whole block exists for: a Date stringifies as "Sat Aug 01 2026 ...", so the
        // old string fallback compared "S" against "2" and said yes to every date in history.
        it("compares a Date field against an ISO literal on the actual instant", () => {
            expect(compareOp(">=", new Date("2026-08-03T00:00:00Z"), "2026-08-01")).toBe(true);
            expect(compareOp(">=", new Date("2026-07-30T00:00:00Z"), "2026-08-01")).toBe(false);
            expect(compareOp("<", new Date("2026-07-30T00:00:00Z"), "2026-08-01")).toBe(true);
            expect(compareOp("<", new Date("2026-08-03T00:00:00Z"), "2026-08-01")).toBe(false);
        });
        it("a date BEFORE the bar is not a success (the old code said it was)", () => {
            // Every one of these returned true before the fix.
            for (const iso of ["1999-01-01", "2020-06-28", "2026-07-31T23:59:59Z"]) {
                expect(compareOp(">=", new Date(iso), "2026-08-01")).toBe(false);
            }
        });
        it("ISO strings work too, since a 'simple' RunView returns them unparsed", () => {
            expect(compareOp(">", "2026-08-03T12:00:00Z", "2026-08-01")).toBe(true);
            expect(compareOp(">", "2026-07-01", "2026-08-01")).toBe(false);
        });
        it("equality ignores the time-of-day difference between equal instants", () => {
            expect(compareOp("=", new Date("2026-08-01T00:00:00Z"), "2026-08-01T00:00:00Z")).toBe(true);
            expect(compareOp("!=", new Date("2026-08-02T00:00:00Z"), "2026-08-01T00:00:00Z")).toBe(true);
        });
        it("a date against a NON-date literal is unanswerable, not a guess", () => {
            expect(compareOp(">=", new Date("2026-08-03"), "Active")).toBe(false);
            expect(compareOp(">=", new Date("2026-08-03"), "70")).toBe(false);
            expect(compareOp("!=", new Date("2026-08-03"), "Active")).toBe(false);
        });
        it("an invalid Date matches nothing", () => {
            expect(compareOp(">=", new Date("not a date"), "2026-08-01")).toBe(false);
            expect(compareOp("!=", new Date("not a date"), "2026-08-01")).toBe(false);
        });
        it("bare numbers stay numeric — `new Date('70')` would be the year 2070", () => {
            expect(compareOp(">=", 72, "70")).toBe(true);
            expect(compareOp("=", "70", "70")).toBe(true);
        });
        it("text that merely contains digits stays a string", () => {
            expect(compareOp("=", "Tier 2026", "Tier 2026")).toBe(true);
            expect(compareOp("=", "Tier 2026", "2026-08-01")).toBe(false);
        });
    });
});

describe("computeLift success-rate", () => {
    const mv = (cohort, success) => ({ cohort, scoreDelta: 0, bandMove: 0, success });
    it("successLiftPct = treatment success rate − control success rate", () => {
        const lift = computeLift([mv("Treatment", true), mv("Treatment", true), mv("Treatment", false), mv("Treatment", false), mv("Control", true), mv("Control", false), mv("Control", false), mv("Control", false)], "Status = Active");
        expect(lift.successRateTreatment).toBeCloseTo(0.5);
        expect(lift.successRateControl).toBeCloseTo(0.25);
        expect(lift.successLiftPct).toBeCloseTo(25);
        expect(lift.outcomeLabel).toBe("Status = Active");
    });
    it("no control → null success lift (no causal claim)", () => {
        const lift = computeLift([mv("Treatment", true)], "climbed a band");
        expect(lift.successRateControl).toBeNull();
        expect(lift.successLiftPct).toBeNull();
    });
});

describe("outcomeLabel", () => {
    it("humanizes each definition", () => {
        expect(outcomeLabel({ type: "BandRecovery" })).toBe("climbed a band");
        expect(outcomeLabel({ type: "ReachScore", minScore: 70 })).toContain("70");
        expect(outcomeLabel({ type: "AnchorField", field: "Status", op: "=", value: "Active" })).toBe("Status = Active");
    });
});
