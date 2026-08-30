/**
 * Server-side band coverage check, used by the publish gate.
 *
 * A band set must TILE its model's score scale: half-open `[min, max)` ranges running end to end with
 * no gaps and no overlaps. ScoringEngine.assignBand assumes exactly that ("half-open, contiguous,
 * non-overlapping"), and both failure modes are silent:
 *  - GAP: assignBand returns undefined, so those anchors get NO band and vanish from the
 *    distribution, triage and movers.
 *  - OVERLAP: two bands match and `.find()` awards the score to whichever sorts first, so the lower
 *    band quietly wins and the "deterministic regardless of band order" property is void.
 *
 * WHY THIS IS CHECKED AT PUBLISH, NOT ON EVERY BAND SAVE
 * Bands are saved one row at a time, and legitimately moving a boundary means two writes (shrink one
 * band, grow its neighbour). Between those two writes the set is momentarily inconsistent. Enforcing
 * coverage per-row would therefore reject the first half of every valid edit. Publishing is the moment
 * the config gets frozen into a snapshot that scores cite, so that's where the set-level invariant has
 * to hold. Per-row sanity (min < max) is enforced separately in ScoreBandEntityServer, since that one
 * is self-contained and true at every instant.
 *
 * NOTE ON DUPLICATION: the Explorer UI has its own copy of this rule in
 * packages/Angular/src/lib/custom/core/band-coverage.ts, which additionally PLANS edits (clamping,
 * closing seams). The UI can't import this file — it's a server package, and pulling it into the
 * browser bundle would drag server dependencies along. Keep the two in step; this one is the
 * authority, the UI one is the convenience.
 */

/** A band's numeric range, plus its label for building a readable error. */
export interface BandRangeRow {
    label: string;
    minScore: number;
    maxScore: number;
}

/** The score range a band set has to cover, end to end. */
export interface ScoreScale {
    min: number;
    max: number;
}

/**
 * Describe the first coverage problem in a band set, or null when it tiles the scale cleanly.
 * Returns a message rather than a boolean so the publish failure tells the operator exactly which
 * scores are unclaimed (or double-claimed) instead of just "bands are invalid".
 */
export function describeCoverageProblem(bands: readonly BandRangeRow[], scale: ScoreScale): string | null {
    if (bands.length === 0) {
        return "The score band set has no bands.";
    }
    const sorted = [...bands].sort((a, b) => a.minScore - b.minScore);

    const inverted = sorted.find((b) => b.minScore >= b.maxScore);
    if (inverted) {
        return `Band '${inverted.label}' has a floor (${inverted.minScore}) at or above its top (${inverted.maxScore}).`;
    }
    if (sorted[0].minScore !== scale.min) {
        return `Scores between ${scale.min} and ${sorted[0].minScore} fall in no band — the lowest band must start at ${scale.min}.`;
    }
    const top = sorted[sorted.length - 1];
    if (top.maxScore !== scale.max) {
        return `Scores between ${top.maxScore} and ${scale.max} fall in no band — the highest band must end at ${scale.max}.`;
    }
    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const cur = sorted[i];
        if (cur.minScore > prev.maxScore) {
            return `Scores between ${prev.maxScore} and ${cur.minScore} fall in no band (gap between '${prev.label}' and '${cur.label}').`;
        }
        if (cur.minScore < prev.maxScore) {
            return `'${prev.label}' and '${cur.label}' overlap between ${cur.minScore} and ${prev.maxScore}, so scores there are claimed by both.`;
        }
    }
    return null;
}
