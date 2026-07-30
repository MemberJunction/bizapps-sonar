import { describe, it, expect } from "vitest";
import { SegmentMember, groupByReason } from "../orchestration/SegmentEvaluator";

/** A resolved cohort member, reduced to the fields the breakdown reads. */
const m = (id: string, factorId: string | null, label: string | null, hadData = true): SegmentMember => ({
    scoreId: `s-${id}`,
    anchorRecordId: id,
    anchorRecordKeyJSON: null,
    normalizedScore: 30,
    bandId: null,
    delta: null,
    reasonLabel: label,
    dominantFactorId: factorId,
    reasonHadData: hadData,
});

const EVENTS = "f-events";
const EMAIL = "f-email";

describe("groupByReason", () => {
    it("splits a cohort that looks uniform by score into its actual problems", () => {
        const cohort = [
            m("a", EVENTS, "Low Event Registrations"),
            m("b", EMAIL, "Low Email Clicks"),
            m("c", EVENTS, "Low Event Registrations"),
            m("d", EVENTS, "Low Event Registrations"),
        ];
        const groups = groupByReason(cohort);
        expect(groups).toHaveLength(2);
        expect(groups[0]).toMatchObject({ factorId: EVENTS, count: 3, share: 75 });
        expect(groups[1]).toMatchObject({ factorId: EMAIL, count: 1, share: 25 });
    });

    it("puts the biggest group first, because that's the one worth acting on", () => {
        const cohort = [m("a", EMAIL, "Low Email Clicks"), m("b", EVENTS, "Low Event Registrations"), m("c", EVENTS, "Low Event Registrations")];
        expect(groupByReason(cohort).map((g) => g.factorId)).toEqual([EVENTS, EMAIL]);
    });

    it("keeps members whose reason is unknown as their own visible slice", () => {
        // Dropping them would overstate how much of the cohort Sonar can actually explain.
        const groups = groupByReason([m("a", EVENTS, "Low Event Registrations"), m("b", null, null)]);
        const unknown = groups.find((g) => g.factorId === null);
        expect(unknown).toMatchObject({ count: 1, label: "Reason unknown" });
    });

    it("keeps a data gap separate from genuine weakness on the same factor", () => {
        // Both are "the events signal is dragging them down", but one needs the integration fixed and
        // the other needs a person contacted. Merging them would label half the slice wrongly.
        const groups = groupByReason([
            m("a", EVENTS, "No Event Registrations", false),
            m("b", EVENTS, "Low Event Registrations"),
            m("c", EVENTS, "Low Event Registrations"),
        ]);
        expect(groups).toHaveLength(2);
        expect(groups[0]).toMatchObject({ label: "Low Event Registrations", count: 2, hadData: true });
        expect(groups[1]).toMatchObject({ label: "No Event Registrations", count: 1, hadData: false });
    });

    it("shares sum to about 100 and survive an awkward divide", () => {
        const cohort = [m("a", EVENTS, "Low Event Registrations"), m("b", EMAIL, "Low Email Clicks"), m("c", EMAIL, "Low Email Clicks")];
        const total = groupByReason(cohort).reduce((sum, g) => sum + g.share, 0);
        expect(total).toBeGreaterThan(99.8);
        expect(total).toBeLessThan(100.2);
    });

    it("is empty for an empty cohort rather than dividing by zero", () => {
        expect(groupByReason([])).toEqual([]);
    });
});
