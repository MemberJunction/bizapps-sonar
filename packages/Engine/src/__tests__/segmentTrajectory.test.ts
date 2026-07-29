import { describe, it, expect } from "vitest";
import { needsTrajectory, shapeMatches, SegmentFilter } from "../orchestration/SegmentEvaluator";
import { trendShape, TrendPoint } from "../scoring/trendShape";

const DAY = 86_400_000;
const series = (...scores: number[]): TrendPoint[] =>
    scores.map((score, i) => ({ asOf: Date.UTC(2026, 0, 1) + i * DAY, score }));

/** The three archetypes a robust selection layer has to tell apart. */
const slowEroder = trendShape(series(60, 57, 54, 51, 48, 45)); // -3/day, 5-cycle run, smooth
const cliff = trendShape(series(60, 60, 60, 60, 60, 40)); // one big recent drop
const bouncer = trendShape(series(40, 70, 45, 65, 42)); // low today, no real trend
const singleSnapshot = trendShape(series(42)); // unknown trend

describe("needsTrajectory", () => {
    it("is false for the point-in-time rules that always worked in SQL", () => {
        expect(needsTrajectory({})).toBe(false);
        expect(needsTrajectory({ bandId: "b1", minScore: 10, maxDelta: -5, crossedBandOnly: true })).toBe(false);
        // A trust gate is a Score column, so it stays in layer 1.
        expect(needsTrajectory({ minDataCompleteness: 0.5 })).toBe(false);
    });

    it("is true as soon as any shape bound is set", () => {
        expect(needsTrajectory({ maxSlopePerDay: -0.1 })).toBe(true);
        expect(needsTrajectory({ minDeclineRun: 3 })).toBe(true);
        expect(needsTrajectory({ minNetDrop: 10 })).toBe(true);
        expect(needsTrajectory({ maxVolatility: 5 })).toBe(true);
        expect(needsTrajectory({ minSnapshots: 4 })).toBe(true);
    });
});

describe("shapeMatches — sustained decline", () => {
    const sliding: SegmentFilter = { minDeclineRun: 3 };

    it("catches the slow eroder that no delta threshold would catch", () => {
        expect(shapeMatches(slowEroder, sliding)).toBe(true);
        // Its individual steps are -3, so a "dropped 5+ since last run" rule misses it entirely.
        expect(slowEroder.declineRun).toBe(5);
    });

    it("does not treat one big drop as a sustained slide", () => {
        expect(shapeMatches(cliff, sliding)).toBe(false);
    });

    it("does not treat a bouncer's incidental down-step as a slide", () => {
        expect(shapeMatches(bouncer, sliding)).toBe(false);
    });
});

describe("shapeMatches — slope", () => {
    it("selects eroding members and rejects flat/rising ones", () => {
        const eroding: SegmentFilter = { maxSlopePerDay: -1 };
        expect(shapeMatches(slowEroder, eroding)).toBe(true);
        expect(shapeMatches(trendShape(series(45, 48, 51)), eroding)).toBe(false);
        expect(shapeMatches(trendShape(series(50, 50, 50)), eroding)).toBe(false);
    });

    it("supports a recovery rule via the lower bound", () => {
        const recovering: SegmentFilter = { minSlopePerDay: 1 };
        expect(shapeMatches(trendShape(series(45, 48, 51)), recovering)).toBe(true);
        expect(shapeMatches(slowEroder, recovering)).toBe(false);
    });
});

describe("shapeMatches — net drop and volatility", () => {
    it("net drop is expressed as a positive magnitude", () => {
        expect(shapeMatches(slowEroder, { minNetDrop: 15 })).toBe(true); // fell exactly 15
        expect(shapeMatches(slowEroder, { minNetDrop: 16 })).toBe(false);
        // A riser never satisfies a drop rule.
        expect(shapeMatches(trendShape(series(40, 50, 60)), { minNetDrop: 5 })).toBe(false);
    });

    it("volatility separates a genuine slide from a noisy series with the same direction", () => {
        const steadyOnly: SegmentFilter = { minNetDrop: 10, maxVolatility: 1 };
        expect(shapeMatches(slowEroder, steadyOnly)).toBe(true);
        const noisyDecline = trendShape(series(60, 20, 55, 15, 45));
        expect(noisyDecline.netChange!).toBeLessThan(-10); // it did fall…
        expect(shapeMatches(noisyDecline, steadyOnly)).toBe(false); // …but not steadily
    });
});

describe("shapeMatches — unknown is never a match", () => {
    it("excludes a member with too little history to judge", () => {
        expect(shapeMatches(singleSnapshot, { minDeclineRun: 1 })).toBe(false);
        expect(shapeMatches(singleSnapshot, { maxSlopePerDay: -0.1 })).toBe(false);
        expect(shapeMatches(singleSnapshot, { minNetDrop: 1 })).toBe(false);
        expect(shapeMatches(singleSnapshot, { maxVolatility: 100 })).toBe(false);
    });

    it("defaults to requiring 2 snapshots, and honours an explicit floor", () => {
        const twoPoints = trendShape(series(50, 40));
        expect(shapeMatches(twoPoints, { minNetDrop: 5 })).toBe(true);
        expect(shapeMatches(twoPoints, { minNetDrop: 5, minSnapshots: 4 })).toBe(false);
        expect(shapeMatches(slowEroder, { minNetDrop: 5, minSnapshots: 4 })).toBe(true);
    });

    it("a volatility ceiling excludes a series too short to measure variability", () => {
        // 2 points = 1 step = no variability to speak of; refuse rather than pass it as 0.
        expect(trendShape(series(50, 40)).volatility).toBeNull();
        expect(shapeMatches(trendShape(series(50, 40)), { maxVolatility: 5 })).toBe(false);
    });
});

describe("shapeMatches — bounds compose (AND, like the SQL layer)", () => {
    it("requires every stated bound to hold", () => {
        const rule: SegmentFilter = { minDeclineRun: 3, maxSlopePerDay: -1, minNetDrop: 10, maxVolatility: 1 };
        expect(shapeMatches(slowEroder, rule)).toBe(true);
        expect(shapeMatches(cliff, rule)).toBe(false);
        expect(shapeMatches(bouncer, rule)).toBe(false);
    });

    it("an empty trajectory rule accepts anything with the default history floor", () => {
        expect(shapeMatches(slowEroder, {})).toBe(true);
        expect(shapeMatches(singleSnapshot, {})).toBe(false); // still needs 2 snapshots
    });
});
