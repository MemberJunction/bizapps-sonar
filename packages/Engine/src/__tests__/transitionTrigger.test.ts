import { describe, it, expect } from "vitest";
import { triggerKindFor } from "../orchestration/TransitionInterventionDispatcher";
import type { SegmentFilter } from "../orchestration/SegmentEvaluator";

/**
 * How an autonomous (OnEnterSegment) intervention decides someone just entered its segment.
 *
 * The bug these cover: the dispatcher classified watchers with an inline `isDeltaRule` boolean that tested
 * ONLY minDelta/maxDelta. Everything else fell into a "neither a band nor a delta rule — skipped" bucket,
 * so a scheduled TRAJECTORY intervention matched nobody on every run while its log line implied the segment
 * was misconfigured. Trajectory rules are recomputed from each run exactly like deltas are, so they belong
 * on the same path.
 */
describe("triggerKindFor", () => {
    const f = (partial: SegmentFilter): SegmentFilter => partial;

    it("a band rule fires off this run's transition rows", () => {
        expect(triggerKindFor(f({ bandId: "band-atrisk" }))).toBe("band");
    });

    it("band wins over everything else — the transition edge is the crispest signal available", () => {
        expect(triggerKindFor(f({ bandId: "band-atrisk", maxDelta: -5, minDeclineRun: 3 }))).toBe("band");
    });

    it("delta rules are derived (the pre-existing behaviour, still intact)", () => {
        expect(triggerKindFor(f({ maxDelta: -5 }))).toBe("derived");
        expect(triggerKindFor(f({ minDelta: 5 }))).toBe("derived");
    });

    // ── the regression this file exists for ────────────────────────────────────────────────────────
    it("TRAJECTORY rules are derived, not skipped", () => {
        expect(triggerKindFor(f({ maxSlopePer30Days: -8 }))).toBe("derived");
        expect(triggerKindFor(f({ minSlopePer30Days: 3 }))).toBe("derived");
        expect(triggerKindFor(f({ minDeclineRun: 3 }))).toBe("derived");
        expect(triggerKindFor(f({ minNetDrop: 10 }))).toBe("derived");
        expect(triggerKindFor(f({ maxVolatility: 2 }))).toBe("derived");
    });

    it("the demo's own 'slipping away' rule dispatches", () => {
        // Losing 3+ points a month over 90 days, sliding 3 cycles, steady rather than bouncing —
        // the exact shape of the Movers preset, which previously fired on nobody.
        const slippingAway = f({
            windowDays: 90,
            maxSlopePer30Days: -3,
            minDeclineRun: 3,
            maxVolatility: 4,
            minSnapshots: 3,
        });
        expect(triggerKindFor(slippingAway)).toBe("derived");
    });

    it("a band-crossing rule is derived", () => {
        expect(triggerKindFor(f({ crossedBandOnly: true }))).toBe("derived");
        // Explicitly false is not a trigger — it is the absence of a constraint.
        expect(triggerKindFor(f({ crossedBandOnly: false }))).toBe("none");
    });

    it("a reason rule is derived — the cause is re-read from this run's contributions", () => {
        expect(triggerKindFor(f({ reason: { weakOnFactorId: "fac-1" } }))).toBe("derived");
    });

    // ── genuinely unsupported: a recompute cannot change who these match ───────────────────────────
    it("a pure score range has no entry edge", () => {
        expect(triggerKindFor(f({ minScore: 0, maxScore: 40 }))).toBe("none");
    });

    it("a member-attribute rule has no entry edge — a join date does not move because scoring ran", () => {
        expect(triggerKindFor(f({ anchor: [{ field: "JoinDate", op: "olderThanDays", value: 90 }] }))).toBe("none");
    });

    it("an empty filter has no entry edge", () => {
        expect(triggerKindFor(f({}))).toBe("none");
    });

    it("qualifiers alone are not triggers", () => {
        // A horizon, a minimum-snapshot gate, a completeness gate and an ordering select nobody in
        // particular. Counting them would make virtually every segment look like a trigger.
        expect(triggerKindFor(f({ windowDays: 90 }))).toBe("none");
        expect(triggerKindFor(f({ minSnapshots: 3 }))).toBe("none");
        expect(triggerKindFor(f({ minDataCompleteness: 0.5 }))).toBe("none");
        expect(triggerKindFor(f({ rank: { mode: "worstScore" } }))).toBe("none");
    });

    it("treats explicit nulls as absent, since that is how a stored FilterExpression round-trips", () => {
        expect(triggerKindFor(f({ maxDelta: null, minDeclineRun: null, reason: null }))).toBe("none");
    });
});
