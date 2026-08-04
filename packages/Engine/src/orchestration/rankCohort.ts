/**
 * Which members to work FIRST.
 *
 * A rule that matches 1,455 people is a report, not a work list. Somebody can call forty of them this
 * week, so the only question that matters is which forty. Until now the answer was always
 * worst-score-first, which quietly assumes the lowest score is the best use of an hour. It usually
 * isn't: a member three weeks from renewal who is sliding is a different job from one ten months out
 * who is equally low, and a member already at rock bottom for two years may be the least persuadable
 * person on the list.
 *
 * Ranking is deliberately a property of the RULE, not of the display. The run cap truncates the
 * resolved cohort, so the order decided here decides who actually gets treated — which is exactly the
 * point ("cap it at what my team can do this week"). A display-only sort lives on the preview action
 * instead, and must never be confused with this.
 *
 * Pure, so the weighting can be tested without a database.
 */

/** How to order a cohort. */
export type RankMode =
    /** Lowest score first. The historical behaviour, and still the default. */
    | "worstScore"
    /** Steepest decline first (needs a trajectory rule; members without a shape sort last). */
    | "fastestDecline"
    /** Largest single-run drop first. */
    | "biggestDrop"
    /** Soonest `urgencyField` date first — "who runs out of time first". */
    | "soonest"
    /** Highest `valueField` first. */
    | "highestValue"
    /** Blend of severity, urgency and value. See {@link DEFAULT_WEIGHTS}. */
    | "priority";

export interface RankSpec {
    mode: RankMode;
    /** Anchor DATE field driving 'soonest' and the urgency term of 'priority'. Sooner = higher. */
    urgencyField?: string | null;
    /** Anchor NUMBER field driving 'highestValue' and the value term of 'priority'. */
    valueField?: string | null;
    /** Override the priority blend. Missing terms are dropped and the rest renormalised. */
    weights?: { severity?: number | null; urgency?: number | null; value?: number | null } | null;
}

/**
 * Default priority weights: severity leads, urgency shapes the queue, value breaks ties.
 *
 * These are a starting opinion, not a calibrated model. Sonar measures lift but nothing yet feeds that
 * back into these numbers, so treat them as an editable default rather than a finding.
 */
export const DEFAULT_WEIGHTS = { severity: 0.5, urgency: 0.3, value: 0.2 } as const;

/** How far ahead the urgency term still distinguishes anything. A renewal 400 days out and one 200
 *  days out are equally "not yet"; inside the horizon, sooner wins. */
export const URGENCY_HORIZON_DAYS = 90;

/** The fields of a resolved member that ranking can read. Structural, so SegmentMember satisfies it
 *  without this module depending on the evaluator. */
export interface RankableMember {
    normalizedScore: number | null;
    delta: number | null;
    shape?: { slopePerDay: number | null; netChange: number | null } | null;
    /** Anchor field values read back for this member, when the rule named any. */
    anchorValues?: Readonly<Record<string, unknown>> | null;
}

/**
 * Sort a cohort in place and return it. Stable for equal keys, and an UNKNOWN key always sorts last:
 * a member we can't rank is not a member to work first.
 */
export function rankCohort<T extends RankableMember>(
    members: T[],
    spec: RankSpec | null | undefined,
    now: number,
): T[] {
    if (!spec || spec.mode === "worstScore") return members; // already resolved worst-first
    const score = scorer(spec, members, now);
    // Decorate-sort-undecorate keeps the comparator cheap and the sort stable on ties.
    return members
        .map((m, i) => ({ m, i, k: score(m) }))
        .sort((a, b) => (b.k - a.k) || (a.i - b.i))
        .map((d) => d.m);
}

/** Build a "higher is more important" key function for the mode. */
function scorer<T extends RankableMember>(spec: RankSpec, members: readonly T[], now: number): (m: T) => number {
    switch (spec.mode) {
        case "fastestDecline":
            // Steeper decline = larger positive key. No shape = unrankable.
            return (m) => {
                const s = m.shape?.slopePerDay;
                return s == null || !Number.isFinite(s) ? -Infinity : -s;
            };
        case "biggestDrop":
            return (m) => (m.delta == null || !Number.isFinite(m.delta) ? -Infinity : -m.delta);
        case "soonest":
            return (m) => {
                const days = daysUntil(m, spec.urgencyField, now);
                return days == null ? -Infinity : -days;
            };
        case "highestValue":
            return (m) => {
                const v = numberField(m, spec.valueField);
                return v == null ? -Infinity : v;
            };
        case "priority":
            return priorityScorer(spec, members, now);
        default:
            return () => 0;
    }
}

/**
 * The blend. Each available term is normalised to 0..1, weighted, and the weights renormalised over
 * whichever terms the rule can actually supply — so naming no urgency field yields severity-and-value
 * rather than a silently deflated score.
 */
function priorityScorer<T extends RankableMember>(
    spec: RankSpec,
    members: readonly T[],
    now: number,
): (m: T) => number {
    const w = {
        severity: pickWeight(spec.weights?.severity, DEFAULT_WEIGHTS.severity),
        urgency: pickWeight(spec.weights?.urgency, DEFAULT_WEIGHTS.urgency),
        value: pickWeight(spec.weights?.value, DEFAULT_WEIGHTS.value),
    };
    const hasUrgency = !!spec.urgencyField && members.some((m) => daysUntil(m, spec.urgencyField, now) != null);
    const hasValue = !!spec.valueField && members.some((m) => numberField(m, spec.valueField) != null);
    // Largest value in the cohort sets the value scale; ranking is relative within one cohort anyway.
    const maxValue = hasValue
        ? Math.max(...members.map((m) => numberField(m, spec.valueField) ?? 0).filter((n) => Number.isFinite(n)))
        : 0;

    const total = w.severity + (hasUrgency ? w.urgency : 0) + (hasValue ? w.value : 0);
    if (total <= 0) return () => 0;

    return (m) => {
        let sum = w.severity * severityTerm(m);
        if (hasUrgency) sum += w.urgency * urgencyTerm(m, spec.urgencyField, now);
        if (hasValue && maxValue > 0) sum += w.value * clamp01((numberField(m, spec.valueField) ?? 0) / maxValue);
        return sum / total;
    };
}

function pickWeight(v: number | null | undefined, fallback: number): number {
    return v != null && Number.isFinite(v) && v >= 0 ? Number(v) : fallback;
}

/** How much of the distance from "this low" to "as bad as it gets" an active slide closes. */
const DECLINE_LIFT = 0.5;

/**
 * 0..1 how bad it is: how low the score is, LIFTED by how fast it is still falling.
 *
 * Decline is applied as a lift toward 1 rather than blended with the level, because a blend can pull a
 * falling member BELOW an identical stable one whenever the slide term is smaller than the level term
 * — so "still falling" would have demoted them, which is backwards. Written this way the term is
 * monotone in both inputs: a slide can only ever raise severity, and never past the maximum.
 */
function severityTerm(m: RankableMember): number {
    const low = 1 - clamp01((m.normalizedScore ?? 0) / 100);
    const slope = m.shape?.slopePerDay;
    if (slope == null || !Number.isFinite(slope) || slope >= 0) return low;
    // A slide of a point a day or worse counts as the full lift.
    const falling = clamp01(-slope);
    return clamp01(low + (1 - low) * DECLINE_LIFT * falling);
}

/** 0..1 how soon: 1 = out of time now, 0 = beyond the horizon (or unknown). */
function urgencyTerm(m: RankableMember, field: string | null | undefined, now: number): number {
    const days = daysUntil(m, field, now);
    if (days == null) return 0;
    if (days <= 0) return 1; // already past the date — maximally urgent
    return clamp01(1 - days / URGENCY_HORIZON_DAYS);
}

/** Days from now until the member's urgency date; null when absent or unparseable. */
function daysUntil(m: RankableMember, field: string | null | undefined, now: number): number | null {
    if (!field) return null;
    const raw = m.anchorValues?.[field];
    if (raw === null || raw === undefined || raw === "") return null;
    const ms = raw instanceof Date ? raw.getTime() : Date.parse(String(raw));
    if (!Number.isFinite(ms)) return null;
    return (ms - now) / 86_400_000;
}

function numberField(m: RankableMember, field: string | null | undefined): number | null {
    if (!field) return null;
    const raw = m.anchorValues?.[field];
    if (raw === null || raw === undefined || raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
}

function clamp01(n: number): number {
    return n < 0 ? 0 : n > 1 ? 1 : n;
}

/** Does this rule need anchor values read back to rank? */
export function rankNeedsAnchorFields(spec: RankSpec | null | undefined): boolean {
    if (!spec) return false;
    if (spec.mode === "soonest" || spec.mode === "highestValue" || spec.mode === "priority") {
        return !!spec.urgencyField || !!spec.valueField;
    }
    return false;
}
