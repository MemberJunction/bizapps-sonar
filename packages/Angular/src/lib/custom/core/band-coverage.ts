/**
 * Band coverage math — pure, no Angular, no I/O.
 *
 * A band set must TILE its score scale: half-open ranges `[min, max)` that run end to end with no
 * gaps and no overlaps. The engine already assumes this (ScoringEngine.assignBand documents
 * "half-open, contiguous, non-overlapping") but nothing enforces it, and both failure modes are
 * silent:
 *
 *  - GAP ("dead zone"): a score in the hole matches no band, so assignBand returns undefined and
 *    that member ends up with no band at all — dropping out of the distribution, triage, and movers.
 *  - OVERLAP: two bands claim the score and `.find()` awards it to whichever sorts first, so the
 *    lower band quietly wins. That also breaks assignBand's "deterministic regardless of band
 *    order" guarantee, which only holds while ranges don't overlap.
 *
 * Because adjacent bands SHARE a boundary number (0–40, 40–70, 70–100), moving one band's edge is
 * really moving a seam between two bands. {@link planContiguousBandEdit} turns an edit into the
 * writes that keep the seam closed, so a UI can auto-fix instead of validating and refusing.
 */

/** A band's numeric range within a set — the only fields coverage math needs. */
export interface BandRange {
    id: string;
    min: number;
    max: number;
    /** Optional, only used to name the band in a clamp message ("…so Healthy still has room"). */
    label?: string;
}

/** The scale a band set has to tile, end to end (a model's ScoreScaleMin/Max). */
export interface BandScale {
    min: number;
    max: number;
}

/** One neighbour edge that has to move so the seam stays closed. Only the moved side is set. */
export interface BandNeighbourWrite {
    id: string;
    min?: number;
    max?: number;
}

/** The full set of writes for one band edit. */
export interface BandEditPlan {
    /** The range actually applied to the edited band — may be pulled in from what was requested. */
    applied: BandRange;
    /** Adjacent bands whose shared boundary moved with it (at most one below, one above). */
    neighbours: BandNeighbourWrite[];
    /** True when the requested numbers had to be clamped; pair with {@link clampReason} to explain. */
    clamped: boolean;
    /** Plain-language reason the edit was pulled in, or null when it applied verbatim. */
    clampReason: string | null;
}

/** Smallest width a band may be squeezed to. Keeps every band able to claim at least one score. */
export const MIN_BAND_WIDTH = 1;

/** The writes needed to remove a band without leaving its range unclaimed. */
export interface BandDeletePlan {
    /** The band to delete. */
    deleteId: string;
    /** The neighbour that absorbs the vacated range (absent when the set is left empty). */
    absorbedBy?: BandNeighbourWrite;
    /** Plain-language note on what happened to the vacated range, for the caller to surface. */
    note: string | null;
}

/** The writes needed to add a band by splitting an existing one. */
export interface BandInsertPlan {
    /** Range for the band being created. */
    newBand: { min: number; max: number };
    /** The host band, shrunk to make room (absent when the set was empty). */
    shrink?: BandNeighbourWrite;
    /** The host's label, for messaging ("takes the top of Healthy"). */
    hostLabel: string | null;
    /** Set when the requested split point had to be moved, or the request was impossible. */
    note: string | null;
    /** False when no valid insert exists (host too narrow to split). */
    possible: boolean;
}

/**
 * Do these bands tile the scale exactly — no gaps, no overlaps, ends flush with the scale?
 * The single definition of the invariant; both band editors check against this.
 */
export function bandsCoverScale(bands: readonly BandRange[], scale: BandScale): boolean {
    if (bands.length === 0) return false;
    const sorted = sortByMin(bands);
    if (sorted[0].min !== scale.min) return false;
    if (sorted[sorted.length - 1].max !== scale.max) return false;
    return sorted.every((b, i) => (i === 0 || b.min === sorted[i - 1].max) && b.min < b.max);
}

/**
 * Plan the writes for moving one band's edges while keeping the set contiguous.
 *
 * Rules, in the order they bind:
 *  1. The FIRST band's min is pinned to the scale floor and the LAST band's max to the ceiling —
 *     otherwise the hole just moves to the end of the scale, where it's even easier to miss.
 *  2. An edge can't cross into a neighbour far enough to leave it thinner than MIN_BAND_WIDTH, so
 *     an edit can never silently swallow the band next door. Only IMMEDIATE neighbours move; the
 *     change never cascades further down the set.
 *  3. The edited band itself keeps at least MIN_BAND_WIDTH.
 *  4. Whichever edge ends up moving, the neighbour sharing that seam follows it.
 *
 * Returns a no-op plan (clamped, with a reason) when the band isn't in the set or the set is too
 * tight to fit the edit — callers can apply the plan unconditionally.
 */
export function planContiguousBandEdit(
    bands: readonly BandRange[],
    bandId: string,
    requested: { min: number; max: number },
    scale: BandScale,
): BandEditPlan {
    const sorted = sortByMin(bands);
    const index = sorted.findIndex((b) => b.id === bandId);
    if (index < 0) {
        return noOpPlan(bandId, requested, "That band is no longer in this set.");
    }

    const current = sorted[index];

    // An inverted range is a typo, not an intent. Clamping it would be actively destructive: the
    // arithmetic "resolves" it by dragging the neighbours to meet the nonsense edges, silently
    // reshaping bands the user never touched. Refuse and change nothing instead.
    if (requested.min >= requested.max) {
        return noOpPlan(bandId, current, "A band's floor has to be below its top, so nothing was changed.");
    }

    // Out-of-scale is the same story. Clamping 150 down to "just under the top band" would technically
    // tile, but it squeezes the neighbour to the 1-point minimum — a band nobody can see or use. A
    // number outside the scale is a mistake, so say so instead of reshaping the set around it.
    if (requested.min < scale.min || requested.max > scale.max) {
        return noOpPlan(bandId, current, `Bands have to stay between ${scale.min} and ${scale.max}, so nothing was changed.`);
    }
    const below = sorted[index - 1];
    const above = sorted[index + 1];

    // Rule 1: the ends belong to the scale, not to the user.
    const floor = below ? below.min + MIN_BAND_WIDTH : scale.min;
    const ceiling = above ? above.max - MIN_BAND_WIDTH : scale.max;
    if (ceiling - floor < MIN_BAND_WIDTH) {
        return noOpPlan(bandId, current, "The neighbouring bands are too narrow to move this edge.");
    }

    // Rules 2+3: pin the ends, then clamp both edges into the room the neighbours leave.
    const wantMin = below ? requested.min : scale.min;
    const wantMax = above ? requested.max : scale.max;
    const min = clamp(wantMin, floor, ceiling - MIN_BAND_WIDTH);
    const max = clamp(wantMax, min + MIN_BAND_WIDTH, ceiling);

    // Rule 4: close both seams against the values we actually applied.
    const neighbours: BandNeighbourWrite[] = [];
    if (below && below.max !== min) neighbours.push({ id: below.id, max: min });
    if (above && above.min !== max) neighbours.push({ id: above.id, min: max });

    return {
        applied: { id: bandId, min, max },
        neighbours,
        clamped: min !== requested.min || max !== requested.max,
        clampReason: describeClamp(requested, { min, max }, { below, above, scale }),
    };
}

/** Why the requested range was pulled in, in plain language, or null when it wasn't. */
function describeClamp(
    requested: { min: number; max: number },
    applied: { min: number; max: number },
    ctx: { below?: BandRange; above?: BandRange; scale: BandScale },
): string | null {
    const minMoved = applied.min !== requested.min;
    const maxMoved = applied.max !== requested.max;
    if (!minMoved && !maxMoved) return null;
    if (minMoved && !ctx.below) return `The lowest band has to start at ${ctx.scale.min}, so nothing scores below it.`;
    if (maxMoved && !ctx.above) return `The highest band has to end at ${ctx.scale.max}, so nothing scores above it.`;
    const crowded = maxMoved ? ctx.above : ctx.below;
    return `Kept to ${applied.min}–${applied.max} so ${crowded?.label ?? "the next band"} still has room.`;
}

/** A plan that changes nothing but carries the reason, so callers need no special case. */
function noOpPlan(bandId: string, range: { min: number; max: number }, reason: string): BandEditPlan {
    return {
        applied: { id: bandId, min: range.min, max: range.max },
        neighbours: [],
        clamped: true,
        clampReason: reason,
    };
}

/**
 * Plan the removal of a band so its range doesn't become a dead zone.
 *
 * Deleting a band vacates its slice of the scale, and SOMETHING has to claim it. The band BELOW
 * stretches up to cover it (or, when deleting the lowest band, the one above stretches down to keep
 * the floor covered).
 *
 * Below-extends-up is deliberate, not arbitrary: it lands the orphaned members in the LOWER band.
 * On an engagement/risk score the lower band is the more cautious answer — deleting "Neutral" makes
 * those people "At Risk" (they keep getting attention) instead of silently promoting them to
 * "Healthy", which would quietly drop them out of every intervention that targets the unhealthy end.
 */
export function planBandDelete(bands: readonly BandRange[], bandId: string, scale: BandScale): BandDeletePlan {
    const sorted = sortByMin(bands);
    const index = sorted.findIndex((b) => b.id === bandId);
    if (index < 0) return { deleteId: bandId, note: null };

    const doomed = sorted[index];
    const below = sorted[index - 1];
    const above = sorted[index + 1];

    if (below) {
        return {
            deleteId: bandId,
            absorbedBy: { id: below.id, max: doomed.max },
            note: `${below.label ?? "The band below"} now covers ${below.min}–${doomed.max}.`,
        };
    }
    if (above) {
        // Deleting the lowest band: the next one up has to take the floor, or scores below it band nowhere.
        return {
            deleteId: bandId,
            absorbedBy: { id: above.id, min: scale.min },
            note: `${above.label ?? "The band above"} now starts at ${scale.min}.`,
        };
    }
    // Last band standing — the set is simply empty afterwards, which the UI already handles.
    return { deleteId: bandId, note: "That was the last band, so this model has no bands until you add one." };
}

/**
 * Plan a new band as a SPLIT of an existing one, which is the only way to add a band without
 * either leaving a hole or overlapping something. The new band takes the TOP of its host, so the
 * caller only has to choose one number (where to split) instead of a min AND a max that have to
 * happen to line up with their neighbours.
 *
 * `splitAt` omitted → split the widest band down the middle, which is the least disruptive default.
 */
export function planBandInsert(
    bands: readonly BandRange[],
    scale: BandScale,
    splitAt?: number,
): BandInsertPlan {
    const sorted = sortByMin(bands);
    if (sorted.length === 0) {
        // No bands yet: the first one has to cover the whole scale, or everything else is a dead zone.
        return { newBand: { min: scale.min, max: scale.max }, hostLabel: null, note: null, possible: true };
    }

    // Pick the HOST band. A supplied split point already says which band the user means — it's the one
    // that contains it — so honour that. Dragging their number into a different band entirely (which
    // picking "the widest" unconditionally would do) puts the new band nowhere near where they asked.
    // With no split point there's nothing to infer from, so fall back to the band with the most room
    // to give, which keeps the default from squeezing an already-tight band.
    const widest = sorted.reduce((w, b) => (b.max - b.min > w.max - w.min ? b : w), sorted[0]);
    const containing = splitAt === undefined
        ? undefined
        : sorted.find((b) => splitAt >= b.min && splitAt < b.max) ?? (splitAt >= sorted[sorted.length - 1].max ? sorted[sorted.length - 1] : undefined);
    const host = containing ?? widest;
    const room = host.max - host.min;
    if (room < MIN_BAND_WIDTH * 2) {
        return {
            newBand: { min: host.min, max: host.max },
            hostLabel: host.label ?? null,
            note: `Every band is too narrow to split. Widen one first, then add.`,
            possible: false,
        };
    }

    const lo = host.min + MIN_BAND_WIDTH;
    const hi = host.max - MIN_BAND_WIDTH;
    const wanted = splitAt ?? Math.round((host.min + host.max) / 2);
    const point = clamp(wanted, lo, hi);

    return {
        newBand: { min: point, max: host.max },
        shrink: { id: host.id, max: point },
        hostLabel: host.label ?? null,
        note: splitAt !== undefined && point !== splitAt
            ? `Split moved to ${point} so both halves of ${host.label ?? "that band"} stay usable.`
            : null,
        possible: true,
    };
}

function sortByMin(bands: readonly BandRange[]): BandRange[] {
    return [...bands].sort((a, b) => a.min - b.min);
}

function clamp(value: number, low: number, high: number): number {
    return Math.min(Math.max(value, low), high);
}
