import { describe, it, expect } from "vitest";
import { declineRun, dedupeByDay, netChange, slopePerDay, trendShape, volatility, withinWindow, TrendPoint } from "../scoring/trendShape";

const DAY = 86_400_000;
/** Build points one day apart, oldest first, from a list of scores. */
const series = (...scores: number[]): TrendPoint[] =>
    scores.map((score, i) => ({ asOf: Date.UTC(2026, 0, 1) + i * DAY, score }));

describe("slopePerDay", () => {
    it("is negative for erosion and positive for recovery", () => {
        expect(slopePerDay(series(50, 47, 44, 41))).toBeCloseTo(-3, 6);
        expect(slopePerDay(series(41, 44, 47, 50))).toBeCloseTo(3, 6);
    });

    it("is flat for an unchanged score", () => {
        expect(slopePerDay(series(30, 30, 30))).toBeCloseTo(0, 6);
    });

    it("resists a single outlier that first-vs-last would swallow", () => {
        // Steady erosion with one bad reading at the end: net change says "recovered", the fitted
        // line still says "eroding". This is the whole reason we fit a line instead of subtracting.
        const noisyRecovery = series(50, 44, 38, 32, 52);
        expect(netChange(noisyRecovery)).toBe(2);
        expect(slopePerDay(noisyRecovery)!).toBeLessThan(0);
    });

    it("is null without at least two points, or without time spread", () => {
        expect(slopePerDay(series(42))).toBeNull();
        expect(slopePerDay([])).toBeNull();
        const sameInstant = [
            { asOf: 1000, score: 10 },
            { asOf: 1000, score: 20 },
        ];
        expect(slopePerDay(sameInstant)).toBeNull();
    });

    it("refuses a per-day rate from minutes of observation", () => {
        // The real hazard from live data: a burst of dev recomputes inside one afternoon. A 1-point
        // move across 2 minutes would otherwise read as ~-720 points/day.
        const base = Date.UTC(2026, 6, 13, 17, 0);
        const burst = [
            { asOf: base, score: 50 },
            { asOf: base + 2 * 60_000, score: 49 },
        ];
        expect(slopePerDay(burst)).toBeNull();
        // Explicitly allowing a sub-daily span is possible, but the caller has to ask for it.
        expect(slopePerDay(burst, 0)!).toBeLessThan(-100);
    });

    it("does not trust the caller's ordering", () => {
        const ascending = series(50, 47, 44);
        const shuffled = [ascending[2], ascending[0], ascending[1]];
        expect(slopePerDay(shuffled)).toBeCloseTo(slopePerDay(ascending)!, 6);
    });
});

describe("declineRun", () => {
    it("counts consecutive declines ending at the newest point", () => {
        expect(declineRun(series(50, 47, 44, 41))).toBe(3);
    });

    it("is zero once the member stops sliding, however long the prior slide was", () => {
        // Fell four cycles, then recovered last cycle: not sliding *now*.
        expect(declineRun(series(50, 45, 40, 35, 38))).toBe(0);
    });

    it("counts only the most recent unbroken stretch", () => {
        // down, down, up, down, down → the trailing run is 2, not 4.
        expect(declineRun(series(50, 45, 40, 44, 41, 38))).toBe(2);
    });

    it("ignores movement inside the deadband", () => {
        expect(declineRun(series(50, 49.8, 49.6))).toBe(0);
        expect(declineRun(series(50, 49.8, 49.6), 0.1)).toBe(2);
    });

    it("is zero for a single point (unknown, not declining)", () => {
        expect(declineRun(series(42))).toBe(0);
    });
});

describe("volatility", () => {
    it("is zero for a perfectly steady slide", () => {
        expect(volatility(series(50, 45, 40, 35))).toBeCloseTo(0, 6);
    });

    it("is larger for an erratic path than a smooth one with the same endpoints", () => {
        const smooth = volatility(series(50, 45, 40, 35))!;
        const erratic = volatility(series(50, 20, 60, 35))!;
        expect(erratic).toBeGreaterThan(smooth);
    });

    it("is null with fewer than three points (needs two steps to vary)", () => {
        expect(volatility(series(50, 40))).toBeNull();
        expect(volatility(series(50))).toBeNull();
    });
});

describe("withinWindow", () => {
    const now = Date.UTC(2026, 0, 11); // 10 days after the first point of a 11-point series
    const eleven = series(...Array.from({ length: 11 }, (_, i) => 50 - i));

    it("keeps only snapshots inside the horizon (cutoff inclusive)", () => {
        // now = day 10, so a 3-day horizon reaches back to day 7 and keeps it: 4 daily points.
        expect(withinWindow(eleven, now, 3).map((p) => p.score)).toEqual([43, 42, 41, 40]);
    });

    it("keeps everything when no horizon is set", () => {
        expect(withinWindow(eleven, now, null).length).toBe(11);
        expect(withinWindow(eleven, now, undefined).length).toBe(11);
        expect(withinWindow(eleven, now, 0).length).toBe(11);
    });
});

describe("dedupeByDay (recompute bursts are not a trend)", () => {
    it("keeps the last snapshot of each day", () => {
        const day = Date.UTC(2026, 6, 13);
        const burst = [
            { asOf: day + 17 * 3600_000, score: 50 },
            { asOf: day + 20 * 3600_000, score: 48 },
            { asOf: day + 21 * 3600_000, score: 47 }, // settled state for the day
            { asOf: day + 86_400_000 + 3600_000, score: 45 }, // next day
        ];
        expect(dedupeByDay(burst).map((p) => p.score)).toEqual([47, 45]);
    });

    it("collapses a ten-recompute afternoon to one observation", () => {
        const day = Date.UTC(2026, 6, 13, 17, 0);
        const burst = Array.from({ length: 10 }, (_, i) => ({ asOf: day + i * 120_000, score: 50 - i }));
        expect(dedupeByDay(burst).length).toBe(1);
        // …so it cannot register as a decline run either.
        expect(trendShape(burst).declineRun).toBe(0);
    });

    it("is applied by trendShape unless the caller opts out", () => {
        const day = Date.UTC(2026, 6, 13, 17, 0);
        const burst = Array.from({ length: 5 }, (_, i) => ({ asOf: day + i * 120_000, score: 50 - i }));
        expect(trendShape(burst).points).toBe(1);
        expect(trendShape(burst, 0.5, false).points).toBe(5);
    });
});

describe("trendShape (the three cases selection must tell apart)", () => {
    const now = Date.UTC(2026, 0, 21);

    it("the slow eroder: small steps, no single alarming delta, clearly declining", () => {
        const s = trendShape(series(60, 57, 54, 51, 48, 45));
        expect(s.declineRun).toBe(5);
        expect(s.slopePerDay!).toBeLessThan(0);
        expect(s.volatility!).toBeCloseTo(0, 6);
        expect(s.netChange).toBe(-15);
    });

    it("the cliff: one big recent drop, otherwise stable", () => {
        const s = trendShape(series(60, 60, 60, 60, 60, 40));
        expect(s.declineRun).toBe(1);
        expect(s.netChange).toBe(-20);
        // Erratic relative to its own history: most steps are 0, one is -20.
        expect(s.volatility!).toBeGreaterThan(0);
    });

    it("the bouncer: low today but not trending down", () => {
        const s = trendShape(series(40, 70, 45, 65, 42));
        expect(s.declineRun).toBe(1); // last step happens to be down…
        expect(Math.abs(s.slopePerDay!)).toBeLessThan(2); // …but the fitted path is roughly flat
        expect(s.volatility!).toBeGreaterThan(10); // and it's obviously noisy
    });

    it("reports unknowns as null rather than flat when history is thin", () => {
        const s = trendShape(series(42));
        expect(s.points).toBe(1);
        expect(s.netChange).toBeNull();
        expect(s.slopePerDay).toBeNull();
        expect(s.volatility).toBeNull();
        expect(s.declineRun).toBe(0);
    });

    it("windowing then shaping is what a rule-level horizon means", () => {
        // Eroded for a month, recovered over the last 3 days. A 30-day rule sees decline;
        // a 3-day rule sees recovery. Same member, same data, different rule horizon.
        const long = series(...Array.from({ length: 21 }, (_, i) => 60 - i), 41, 45, 49);
        const asPoints = long.map((p, i) => ({ asOf: now - (long.length - 1 - i) * DAY, score: p.score }));
        expect(trendShape(withinWindow(asPoints, now, 30)).slopePerDay!).toBeLessThan(0);
        expect(trendShape(withinWindow(asPoints, now, 3)).slopePerDay!).toBeGreaterThan(0);
    });
});
