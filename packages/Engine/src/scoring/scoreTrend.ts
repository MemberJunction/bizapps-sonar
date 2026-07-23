/**
 * The trend math behind the ScoreHistory / ScoreBandTransition surface — pulled out of ScoreWriter
 * so it's pure (no I/O) and unit-testable. ScoreWriter does the entity plumbing; these decide the
 * numbers: how far a score moved, which way, how complete the data was, which pre-cutoff snapshot is
 * the baseline, and whether a band crossing happened. Powers the Overview trend, per-anchor
 * sparklines, and the "movers" feed.
 */

/** A prior snapshot used as the trend baseline: its normalized score + band. Either the window-ago
 *  ScoreHistory row (when the model sets TrendWindowDays) or the immediately-prior Score. */
export interface TrendBaseline {
    score: number | null;
    band: string | null;
}

/** A band crossing worth persisting (e.g. Healthy → At-Risk). Direction reads the run-over-run score
 *  move: rose (or held) = Improving, fell = Worsening. */
export interface BandTransition {
    fromBandId: string | null;
    toBandId: string | null;
    direction: "Improving" | "Worsening";
}

/** current − baseline; null when there's no comparable prior score ("not enough history yet"). */
export function computeDelta(current: number, prevScore: number | null): number | null {
    return prevScore !== null ? current - prevScore : null;
}

/** Up / Flat / Down from a score delta. A ±`deadband` band (default 0.5 on a 0–100 scale) keeps
 *  float noise from reading as movement; null when there's no prior score to compare. */
export function trendDirection(
    delta: number | null,
    deadband: number = 0.5,
): "Up" | "Flat" | "Down" | null {
    if (delta === null) return null;
    if (delta > deadband) return "Up";
    if (delta < -deadband) return "Down";
    return "Flat";
}

/** Fraction (0–1) of the counted factors that had real data for an anchor; null when nothing counted. */
export function dataCompleteness(contributions: { hadData: boolean }[]): number | null {
    if (contributions.length === 0) return null;
    return contributions.filter((c) => c.hadData).length / contributions.length;
}

/**
 * Reduce ScoreHistory rows *already ordered AsOfDate DESC* to the most recent snapshot per anchor —
 * the trend baseline lookup ("the score as of ~N days ago"). Because the rows arrive newest-first,
 * the first one seen per anchor is the one at/before the cutoff we want; later (older) rows are
 * ignored. Anchors absent from the rows get no baseline (→ null Delta upstream).
 */
export function latestBaselinePerAnchor(
    rowsNewestFirst: { AnchorRecordID: string; NormalizedScore: number | null; BandID: string | null }[],
): Map<string, TrendBaseline> {
    const byAnchor = new Map<string, TrendBaseline>();
    for (const h of rowsNewestFirst) {
        if (!byAnchor.has(h.AnchorRecordID)) {
            byAnchor.set(h.AnchorRecordID, { score: h.NormalizedScore, band: h.BandID });
        }
    }
    return byAnchor;
}

/**
 * Whether this recompute crossed a band, and which way. A transition is recorded only when the
 * anchor was already scored (`hadPrior`) AND its band actually changed — a brand-new anchor or a
 * same-band run produces none. Direction comes from the run-over-run score move (`lastRunDelta`),
 * defaulting a null delta to "held" (Improving), so a band change with no measurable prior score
 * still records a direction rather than throwing.
 */
export function detectBandTransition(
    priorBand: string | null,
    newBand: string | null,
    hadPrior: boolean,
    lastRunDelta: number | null,
): BandTransition | null {
    if (!hadPrior || priorBand === newBand) {
        return null;
    }
    return {
        fromBandId: priorBand,
        toBandId: newBand,
        direction: (lastRunDelta ?? 0) >= 0 ? "Improving" : "Worsening",
    };
}
