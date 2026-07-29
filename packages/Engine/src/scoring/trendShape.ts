/**
 * Trend SHAPE math — the vocabulary for "how did this member's score move over a window", as
 * opposed to `scoreTrend.ts` which answers "how far did it move between two points".
 *
 * Why this exists: selection could only ever compare two snapshots (now vs. the baseline
 * `TrendWindowDays` ago). Two points can tell you the net change, but they cannot tell you the
 * SHAPE of the path between them — and the shape is what distinguishes the three cases an
 * operator cares most about:
 *
 *   • a member who fell off a cliff last week (sudden, likely a real event)
 *   • a member who has eroded a little every cycle for months (slow, easy to miss, often the
 *     cheapest to save because nothing has broken yet)
 *   • a member who bounces around and happens to be low today (noise, not a trend — treating
 *     them wastes effort and pollutes the lift measurement with members who'd have recovered)
 *
 * Everything here is PURE (no I/O, no entity objects) so it's unit-testable and so the same
 * functions can run in the engine or, later, be pushed into SQL without rewriting the semantics.
 */

/** One score observation. `asOf` is epoch milliseconds (from ScoreHistory.AsOfDate). */
export interface TrendPoint {
    asOf: number;
    score: number;
}

/** The computed shape of one member's score path across the requested window. Every measure is
 *  null when there isn't enough history to state it honestly, rather than defaulting to 0 — a
 *  member with one snapshot has an UNKNOWN trend, not a flat one. */
export interface TrendShape {
    /** How many snapshots informed these numbers (the honesty denominator). */
    points: number;
    /** Newest score minus oldest score in the window. Negative = net decline. */
    netChange: number | null;
    /** Least-squares slope in score-points per DAY. Negative = eroding.
     *  "Least squares" = the straight line that best fits all the points (minimising the squared
     *  vertical distance to each), so a single odd reading can't swing it the way first-vs-last can. */
    slopePerDay: number | null;
    /** How many consecutive step-over-step declines end at the NEWEST point. This is the
     *  "still sliding right now" measure: a member who fell four cycles then recovered last cycle
     *  scores 0, because they are no longer sliding. */
    declineRun: number;
    /** Standard deviation of the step-to-step changes: how erratic the path is.
     *  ("Standard deviation" = typical distance from the average step. Low = smooth/steady,
     *  high = bouncing around.) Lets a rule exclude noisy series from a trend-based cohort. */
    volatility: number | null;
}

/** Movements smaller than this (in score points) are treated as no movement, so float wobble in
 *  the scoring pipeline doesn't read as a decline. Matches `scoreTrend.trendDirection`'s deadband. */
const DEFAULT_DEADBAND = 0.5;

const MS_PER_DAY = 86_400_000;

/** Oldest-first copy of the points, ignoring anything unusable. The caller's ordering is not
 *  trusted: a RunView with a different OrderBy would silently invert every measure below. */
function normalize(points: readonly TrendPoint[]): TrendPoint[] {
    return points
        .filter((p) => Number.isFinite(p.score) && Number.isFinite(p.asOf))
        .slice()
        .sort((a, b) => a.asOf - b.asOf);
}

/** Consecutive step-over-step declines counting back from the newest point (see {@link TrendShape.declineRun}). */
export function declineRun(points: readonly TrendPoint[], deadband: number = DEFAULT_DEADBAND): number {
    const p = normalize(points);
    let run = 0;
    for (let i = p.length - 1; i > 0; i--) {
        if (p[i].score - p[i - 1].score < -deadband) run++;
        else break;
    }
    return run;
}

/**
 * Collapse bursts to one point per UTC day, keeping the LAST snapshot of each day.
 *
 * Why this is not optional: ScoreHistory records a row per recompute, and recomputes happen
 * whenever someone edits a model or clicks Recompute — the demo data has ten snapshots inside a
 * single afternoon. Those are the same day's state re-observed, not ten days of member behaviour.
 * Left in, they let config churn masquerade as a trend and they wreck any per-day rate (a 1-point
 * move across two minutes reads as hundreds of points per day).
 */
export function dedupeByDay(points: readonly TrendPoint[]): TrendPoint[] {
    const p = normalize(points);
    const byDay = new Map<number, TrendPoint>();
    for (const pt of p) {
        // Integer division to a UTC day index; later points overwrite earlier ones, so the last
        // observation of a day wins (it's the day's settled state).
        byDay.set(Math.floor(pt.asOf / MS_PER_DAY), pt);
    }
    return [...byDay.values()].sort((a, b) => a.asOf - b.asOf);
}

/** Least-squares slope in points per day; null when there are fewer than 2 points, when every
 *  snapshot shares one timestamp (no time spread means no slope, not an infinite one), or when the
 *  observed span is shorter than `minSpanDays` — you cannot state a per-DAY rate of change from a
 *  few minutes of observation, and pretending otherwise produces absurd slopes. */
export function slopePerDay(points: readonly TrendPoint[], minSpanDays: number = 1): number | null {
    const p = normalize(points);
    if (p.length < 2) return null;
    const spanDays = (p[p.length - 1].asOf - p[0].asOf) / MS_PER_DAY;
    if (spanDays < minSpanDays) return null;
    // Measure time in days from the first snapshot so the numbers stay small and readable.
    const xs = p.map((pt) => (pt.asOf - p[0].asOf) / MS_PER_DAY);
    const ys = p.map((pt) => pt.score);
    const n = p.length;
    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
        num += (xs[i] - meanX) * (ys[i] - meanY);
        den += (xs[i] - meanX) ** 2;
    }
    return den === 0 ? null : num / den;
}

/** Standard deviation of the step-to-step changes; null with fewer than 3 points (you need at
 *  least two steps before "how much do the steps vary" means anything). */
export function volatility(points: readonly TrendPoint[]): number | null {
    const p = normalize(points);
    if (p.length < 3) return null;
    const steps: number[] = [];
    for (let i = 1; i < p.length; i++) steps.push(p[i].score - p[i - 1].score);
    const mean = steps.reduce((a, b) => a + b, 0) / steps.length;
    const variance = steps.reduce((a, b) => a + (b - mean) ** 2, 0) / steps.length;
    return Math.sqrt(variance);
}

/** Newest minus oldest across the window; null with fewer than 2 points. */
export function netChange(points: readonly TrendPoint[]): number | null {
    const p = normalize(points);
    return p.length < 2 ? null : p[p.length - 1].score - p[0].score;
}

/** Keep only the snapshots at or after `windowDays` before `now` (the rule's horizon).
 *  `windowDays` null/undefined = no horizon, use everything the caller supplied. */
export function withinWindow(
    points: readonly TrendPoint[],
    now: number,
    windowDays: number | null | undefined,
): TrendPoint[] {
    const p = normalize(points);
    if (windowDays == null || !Number.isFinite(windowDays) || windowDays <= 0) return p;
    const cutoff = now - windowDays * MS_PER_DAY;
    return p.filter((pt) => pt.asOf >= cutoff);
}

/**
 * Compute every shape measure for one member over the (already windowed) points.
 *
 * Snapshots are collapsed to one per day first ({@link dedupeByDay}) so a burst of recomputes in
 * one afternoon counts as one observation, not as a trend. Pass `dedupe: false` only when the
 * caller has already done that (or genuinely wants sub-daily resolution).
 */
export function trendShape(
    points: readonly TrendPoint[],
    deadband: number = DEFAULT_DEADBAND,
    dedupe: boolean = true,
): TrendShape {
    const p = dedupe ? dedupeByDay(points) : normalize(points);
    return {
        points: p.length,
        netChange: netChange(p),
        slopePerDay: slopePerDay(p),
        declineRun: declineRun(p, deadband),
        volatility: volatility(p),
    };
}
