import { describe, it, expect } from "vitest";
import { PersistedContribution, dominantDrag, dominantDragLabel, hasReasonCondition, rankFactorDrag, reasonMatches } from "../scoring/factorDrag";

const EVENTS = "f-events";
const EMAIL = "f-email";
const DUES = "f-dues";

const c = (
    factorId: string,
    label: string,
    normalizedValue: number,
    percentOfTotal: number,
    hadData = true,
): PersistedContribution => ({ factorId, label, normalizedValue, percentOfTotal, hadData });

/** Someone who has stopped showing up but still reads the newsletter. */
const stoppedAttending = [c(EVENTS, "Event Registrations", 0.05, 70), c(EMAIL, "Email Clicks", 0.8, 30)];
/** Same total problem, opposite cause: reads nothing, still attends. */
const stoppedReading = [c(EVENTS, "Event Registrations", 0.85, 70), c(EMAIL, "Email Clicks", 0.02, 30)];
/** Weak on a factor that barely counts, strong on the one that does. */
const weakWhereItDoesntMatter = [c(EVENTS, "Event Registrations", 0.9, 95), c(DUES, "Dues", 0.1, 5)];
/** Never had any event records at all. */
const noEventData = [c(EVENTS, "Event Registrations", 0, 70, false), c(EMAIL, "Email Clicks", 0.7, 30)];

describe("rankFactorDrag", () => {
    it("weights the shortfall by how much of the score the factor carries", () => {
        // Weak on a 5%-of-score factor must NOT outrank being slightly off on a 95% one.
        const ranked = rankFactorDrag(weakWhereItDoesntMatter);
        expect(ranked[0].factorId).toBe(EVENTS);
        expect(ranked[0].drag).toBeCloseTo(95 * 0.1, 6);
        expect(ranked[1].drag).toBeCloseTo(5 * 0.9, 6);
    });

    it("treats no data as a full shortfall", () => {
        const ranked = rankFactorDrag(noEventData);
        expect(ranked[0].factorId).toBe(EVENTS);
        expect(ranked[0].shortfall).toBe(1);
        expect(ranked[0].hadData).toBe(false);
    });

    it("returns worst first", () => {
        const ranked = rankFactorDrag(stoppedAttending);
        expect(ranked.map((r) => r.factorId)).toEqual([EVENTS, EMAIL]);
    });
});

describe("rankFactorDrag — a missing signal has to be nameable", () => {
    /** The real-data shape: with a Zero missing-data policy the scorer writes percentOfTotal=0 for a
     *  factor the member has NO records for, which is exactly when it's hurting them most. The rubric
     *  weight is what says so. Numbers taken from the demo model (events 0.77, email 0.26). */
    const noEmailData = [
        { factorId: EVENTS, label: "Event Registrations", normalizedValue: 0.9989, percentOfTotal: 1, weight: 0.77, hadData: true },
        { factorId: EMAIL, label: "Email Clicks", normalizedValue: 0, percentOfTotal: 0, weight: 0.26, hadData: false },
    ];

    it("names the missing signal, not the near-perfect one", () => {
        // On realized share this member reads "Low Event Registrations" (they're at 0.9989!), which is
        // nonsense. On rubric weight it reads "No Email Clicks", which is the truth.
        expect(dominantDragLabel(noEmailData)).toBe("No Email Clicks");
    });

    it("still ranks a weighted shortfall above a weighted data gap when the shortfall is bigger", () => {
        const barelyAnyEvents = [
            { factorId: EVENTS, label: "Event Registrations", normalizedValue: 0.05, percentOfTotal: 1, weight: 0.77, hadData: true },
            { factorId: EMAIL, label: "Email Clicks", normalizedValue: 0, percentOfTotal: 0, weight: 0.26, hadData: false },
        ];
        // 0.77 × 0.95 = 0.73 beats 0.26 × 1 = 0.26.
        expect(dominantDragLabel(barelyAnyEvents)).toBe("Low Event Registrations");
    });

    it("falls back to the realized percentage when no rubric weight was loaded", () => {
        expect(dominantDrag(stoppedAttending)!.factorId).toBe(EVENTS);
    });

    it("ignores a zero or negative weight rather than zeroing out every factor", () => {
        const zeroWeighted = [
            { factorId: EVENTS, label: "Event Registrations", normalizedValue: 0.1, percentOfTotal: 70, weight: 0, hadData: true },
            { factorId: EMAIL, label: "Email Clicks", normalizedValue: 0.9, percentOfTotal: 30, weight: 0, hadData: true },
        ];
        expect(dominantDrag(zeroWeighted)!.factorId).toBe(EVENTS);
    });
});

describe("dominantDrag", () => {
    it("identifies the different cause behind two similar-looking members", () => {
        expect(dominantDrag(stoppedAttending)!.factorId).toBe(EVENTS);
        expect(dominantDrag(stoppedReading)!.factorId).toBe(EMAIL);
    });

    it("is null for a member doing fine on everything", () => {
        expect(dominantDrag([c(EVENTS, "Event Registrations", 1, 70), c(EMAIL, "Email Clicks", 1, 30)])).toBeNull();
    });

    it("is null with no contributions at all", () => {
        expect(dominantDrag([])).toBeNull();
    });

    it("labels a data gap differently from genuine weakness", () => {
        expect(dominantDragLabel(stoppedAttending)).toBe("Low Event Registrations");
        expect(dominantDragLabel(noEventData)).toBe("No Event Registrations");
    });
});

describe("hasReasonCondition", () => {
    it("is false for an empty or absent condition", () => {
        expect(hasReasonCondition({})).toBe(false);
        expect(hasReasonCondition({ dominantFactorIds: [] })).toBe(false);
        expect(hasReasonCondition({ maxNormalizedValue: 0.3 })).toBe(false); // a ceiling with no factor asks nothing
    });

    it("is true once a reason is actually named", () => {
        expect(hasReasonCondition({ dominantFactorIds: [EVENTS] })).toBe(true);
        expect(hasReasonCondition({ weakOnFactorId: EMAIL })).toBe(true);
        expect(hasReasonCondition({ requireNoData: true })).toBe(true);
    });
});

describe("reasonMatches — grouping by the main problem", () => {
    it("splits members who share a score but not a cause", () => {
        const rule = { dominantFactorIds: [EVENTS] };
        expect(reasonMatches(stoppedAttending, rule)).toBe(true);
        expect(reasonMatches(stoppedReading, rule)).toBe(false);
    });

    it("accepts any of several named causes", () => {
        const rule = { dominantFactorIds: [EVENTS, EMAIL] };
        expect(reasonMatches(stoppedAttending, rule)).toBe(true);
        expect(reasonMatches(stoppedReading, rule)).toBe(true);
    });

    it("an empty condition matches everyone (it asks nothing)", () => {
        expect(reasonMatches(stoppedReading, {})).toBe(true);
    });
});

describe("reasonMatches — weakness on a specific signal", () => {
    it("matches a member below the ceiling on the named factor, dominant or not", () => {
        // Email is NOT this member's main problem, but they are weak on it.
        expect(reasonMatches(stoppedReading, { weakOnFactorId: EMAIL, maxNormalizedValue: 0.1 })).toBe(true);
        expect(reasonMatches(stoppedAttending, { weakOnFactorId: EMAIL, maxNormalizedValue: 0.1 })).toBe(false);
    });

    it("defaults the ceiling to half", () => {
        expect(reasonMatches(stoppedAttending, { weakOnFactorId: EVENTS })).toBe(true); // 0.05
        expect(reasonMatches(stoppedReading, { weakOnFactorId: EVENTS })).toBe(false); // 0.85
    });

    it("does not match when the factor isn't part of this member's rubric", () => {
        expect(reasonMatches(stoppedAttending, { weakOnFactorId: DUES })).toBe(false);
    });

    it("treats no data as the worst possible showing", () => {
        expect(reasonMatches(noEventData, { weakOnFactorId: EVENTS, maxNormalizedValue: 0.2 })).toBe(true);
    });

    it("can require a genuine data gap rather than mere weakness", () => {
        expect(reasonMatches(noEventData, { weakOnFactorId: EVENTS, requireNoData: true })).toBe(true);
        expect(reasonMatches(stoppedAttending, { weakOnFactorId: EVENTS, requireNoData: true })).toBe(false);
    });
});

describe("reasonMatches — a breakdown slice returns exactly its own members", () => {
    // The breakdown shows "Low Event Registrations · 2" and "No Event Registrations · 1" as separate
    // slices, but both members have EVENTS as their dominant factor. Without the data gates, clicking
    // either slice would return all three and the list would contradict the count on the chip.
    const lowEvents = { dominantFactorIds: [EVENTS], requireData: true };
    const noEvents = { dominantFactorIds: [EVENTS], requireNoData: true };

    it("the low slice excludes the data-gap members", () => {
        expect(reasonMatches(stoppedAttending, lowEvents)).toBe(true);
        expect(reasonMatches(noEventData, lowEvents)).toBe(false);
    });

    it("the data-gap slice excludes the merely-weak members", () => {
        expect(reasonMatches(noEventData, noEvents)).toBe(true);
        expect(reasonMatches(stoppedAttending, noEvents)).toBe(false);
    });

    it("neither slice picks up a member whose main problem is a different signal", () => {
        expect(reasonMatches(stoppedReading, lowEvents)).toBe(false);
        expect(reasonMatches(stoppedReading, noEvents)).toBe(false);
    });

    it("the two slices partition the factor: every member lands in exactly one", () => {
        for (const member of [stoppedAttending, noEventData]) {
            const hits = [lowEvents, noEvents].filter((rule) => reasonMatches(member, rule));
            expect(hits).toHaveLength(1);
        }
    });

    it("requireData alone is a real condition, not an empty one", () => {
        expect(hasReasonCondition({ requireData: true })).toBe(true);
    });
});

describe("reasonMatches — unknown is never a match", () => {
    it("excludes a member whose reason we cannot see", () => {
        // No contributions recorded: contacting someone because we can't tell why they're low is
        // exactly the mistake this layer exists to prevent.
        expect(reasonMatches([], { dominantFactorIds: [EVENTS] })).toBe(false);
        expect(reasonMatches([], { weakOnFactorId: EVENTS })).toBe(false);
        expect(reasonMatches([], { requireNoData: true })).toBe(false);
    });
});
