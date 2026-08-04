import { describe, it, expect } from "vitest";
import { RankableMember, URGENCY_HORIZON_DAYS, rankCohort, rankNeedsAnchorFields } from "../orchestration/rankCohort";

const NOW = Date.parse("2026-07-30T12:00:00Z");
const inDays = (d: number) => new Date(NOW + d * 86_400_000).toISOString();

interface M extends RankableMember { id: string }

const m = (
    id: string,
    normalizedScore: number | null,
    extra: Partial<RankableMember> = {},
): M => ({ id, normalizedScore, delta: null, ...extra });

const ids = (list: M[]) => list.map((x) => x.id);

describe("rankCohort — worstScore leaves the resolved order alone", () => {
    it("does not reorder (the evaluator already returned worst-first)", () => {
        const cohort = [m("a", 10), m("b", 5), m("c", 20)];
        expect(ids(rankCohort(cohort, { mode: "worstScore" }, NOW))).toEqual(["a", "b", "c"]);
        expect(ids(rankCohort(cohort, null, NOW))).toEqual(["a", "b", "c"]);
    });
});

describe("rankCohort — fastestDecline", () => {
    it("puts the steepest slide first", () => {
        const cohort = [
            m("slow", 40, { shape: { slopePerDay: -0.1, netChange: -9 } }),
            m("fast", 60, { shape: { slopePerDay: -0.9, netChange: -81 } }),
            m("rising", 30, { shape: { slopePerDay: 0.4, netChange: 36 } }),
        ];
        expect(ids(rankCohort(cohort, { mode: "fastestDecline" }, NOW))).toEqual(["fast", "slow", "rising"]);
    });

    it("sorts members with no measurable shape last — unrankable is not urgent", () => {
        const cohort = [m("unknown", 5), m("sliding", 70, { shape: { slopePerDay: -0.2, netChange: -18 } })];
        expect(ids(rankCohort(cohort, { mode: "fastestDecline" }, NOW))).toEqual(["sliding", "unknown"]);
    });
});

describe("rankCohort — biggestDrop", () => {
    it("orders by the size of the fall, not the level", () => {
        const cohort = [m("dipped", 20, { delta: -2 }), m("plunged", 80, { delta: -30 }), m("rose", 10, { delta: 5 })];
        expect(ids(rankCohort(cohort, { mode: "biggestDrop" }, NOW))).toEqual(["plunged", "dipped", "rose"]);
    });

    it("a first-run score (null delta) sorts last", () => {
        const cohort = [m("new", 1, { delta: null }), m("fell", 50, { delta: -4 })];
        expect(ids(rankCohort(cohort, { mode: "biggestDrop" }, NOW))).toEqual(["fell", "new"]);
    });
});

describe("rankCohort — soonest (who runs out of time first)", () => {
    const spec = { mode: "soonest" as const, urgencyField: "RenewalDate" };
    it("orders by the date, ignoring the score entirely", () => {
        const cohort = [
            m("later", 5, { anchorValues: { RenewalDate: inDays(80) } }),
            m("imminent", 95, { anchorValues: { RenewalDate: inDays(3) } }),
            m("mid", 50, { anchorValues: { RenewalDate: inDays(30) } }),
        ];
        expect(ids(rankCohort(cohort, spec, NOW))).toEqual(["imminent", "mid", "later"]);
    });

    it("an already-passed date outranks a future one", () => {
        const cohort = [m("future", 50, { anchorValues: { RenewalDate: inDays(5) } }),
                        m("overdue", 50, { anchorValues: { RenewalDate: inDays(-10) } })];
        expect(ids(rankCohort(cohort, spec, NOW))).toEqual(["overdue", "future"]);
    });

    it("a missing or unparseable date sorts last", () => {
        const cohort = [
            m("none", 1, { anchorValues: {} }),
            m("junk", 1, { anchorValues: { RenewalDate: "not a date" } }),
            m("real", 90, { anchorValues: { RenewalDate: inDays(45) } }),
        ];
        expect(ids(rankCohort(cohort, spec, NOW))[0]).toBe("real");
    });
});

describe("rankCohort — highestValue", () => {
    it("orders by the named number, largest first", () => {
        const cohort = [
            m("small", 10, { anchorValues: { Dues: 50 } }),
            m("big", 60, { anchorValues: { Dues: 5000 } }),
            m("none", 5, { anchorValues: {} }),
        ];
        expect(ids(rankCohort(cohort, { mode: "highestValue", valueField: "Dues" }, NOW)))
            .toEqual(["big", "small", "none"]);
    });
});

describe("rankCohort — priority blends severity, urgency and value", () => {
    it("a slightly less severe member who is nearly out of time outranks a worse one who isn't", () => {
        const cohort = [
            m("lowButPatient", 5, { anchorValues: { RenewalDate: inDays(365) } }),
            m("highButUrgent", 35, { anchorValues: { RenewalDate: inDays(2) } }),
        ];
        const ranked = rankCohort(cohort, { mode: "priority", urgencyField: "RenewalDate" }, NOW);
        expect(ids(ranked)).toEqual(["highButUrgent", "lowButPatient"]);
    });

    it("severity still wins when the urgency gap is small", () => {
        const cohort = [
            m("dire", 2, { anchorValues: { RenewalDate: inDays(20) } }),
            m("mild", 70, { anchorValues: { RenewalDate: inDays(18) } }),
        ];
        expect(ids(rankCohort(cohort, { mode: "priority", urgencyField: "RenewalDate" }, NOW))[0]).toBe("dire");
    });

    it("falls back to severity alone when the rule names no usable urgency or value field", () => {
        const cohort = [m("better", 60), m("worse", 10)];
        expect(ids(rankCohort(cohort, { mode: "priority" }, NOW))).toEqual(["worse", "better"]);
    });

    it("renormalises so a missing term doesn't just deflate everyone equally", () => {
        // With no urgency data, ordering must be exactly the severity ordering.
        const cohort = [m("a", 80), m("b", 40), m("c", 20)];
        const ranked = rankCohort(cohort, { mode: "priority", urgencyField: "RenewalDate" }, NOW);
        expect(ids(ranked)).toEqual(["c", "b", "a"]);
    });

    it("weights are overridable — leaning on urgency reorders the queue", () => {
        const cohort = [
            m("worstScore", 0, { anchorValues: { RenewalDate: inDays(89) } }),
            m("soonest", 55, { anchorValues: { RenewalDate: inDays(1) } }),
        ];
        const severityLed = rankCohort([...cohort], { mode: "priority", urgencyField: "RenewalDate", weights: { severity: 0.9, urgency: 0.1 } }, NOW);
        const urgencyLed = rankCohort([...cohort], { mode: "priority", urgencyField: "RenewalDate", weights: { severity: 0.1, urgency: 0.9 } }, NOW);
        expect(ids(severityLed)[0]).toBe("worstScore");
        expect(ids(urgencyLed)[0]).toBe("soonest");
    });

    it("a still-falling member outranks an equally-low but stable one", () => {
        const cohort = [
            m("stable", 20, { shape: { slopePerDay: 0, netChange: 0 } }),
            m("falling", 20, { shape: { slopePerDay: -0.8, netChange: -72 } }),
        ];
        expect(ids(rankCohort(cohort, { mode: "priority" }, NOW))).toEqual(["falling", "stable"]);
    });

    it("beyond the urgency horizon, dates stop distinguishing anything", () => {
        const far = m("far", 50, { anchorValues: { D: inDays(URGENCY_HORIZON_DAYS + 200) } });
        const alsoFar = m("alsoFar", 50, { anchorValues: { D: inDays(URGENCY_HORIZON_DAYS + 10) } });
        const ranked = rankCohort([far, alsoFar], { mode: "priority", urgencyField: "D" }, NOW);
        // Equal severity, both past the horizon, so the original order is preserved (stable sort).
        expect(ids(ranked)).toEqual(["far", "alsoFar"]);
    });
});

describe("rankCohort — stability", () => {
    it("preserves the incoming order for members that tie", () => {
        const cohort = [m("first", 30), m("second", 30), m("third", 30)];
        expect(ids(rankCohort(cohort, { mode: "priority" }, NOW))).toEqual(["first", "second", "third"]);
    });
});

describe("rankNeedsAnchorFields", () => {
    it("is true only when a mode actually reads an anchor field", () => {
        expect(rankNeedsAnchorFields({ mode: "soonest", urgencyField: "RenewalDate" })).toBe(true);
        expect(rankNeedsAnchorFields({ mode: "highestValue", valueField: "Dues" })).toBe(true);
        expect(rankNeedsAnchorFields({ mode: "priority", urgencyField: "RenewalDate" })).toBe(true);
        expect(rankNeedsAnchorFields({ mode: "priority" })).toBe(false); // severity-only needs nothing
        expect(rankNeedsAnchorFields({ mode: "worstScore" })).toBe(false);
        expect(rankNeedsAnchorFields({ mode: "fastestDecline" })).toBe(false);
        expect(rankNeedsAnchorFields(null)).toBe(false);
    });
});
