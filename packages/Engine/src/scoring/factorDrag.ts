/**
 * WHY a member scores low, as a selectable fact.
 *
 * The scoring engine already knows this: every score decomposes into named factor contributions.
 * But selection has only ever seen the TOTAL, so a group picked by score (or by score trajectory) is
 * a mixed bag — members who stopped attending events sitting next to members who stopped opening
 * email. One message for that group has to be generic, and a generic message is a weak one. The
 * reason is the part that tells you what to actually do, so it belongs in the targeting vocabulary.
 *
 * This module is the single definition of "what's dragging this member down". It previously existed
 * twice: once in the Angular read service (for the Why column) and once privately inside the Draft
 * Outreach play. Pure, so both can use it and it can be unit-tested without a database.
 */

/**
 * One factor's contribution to a member's score AS PERSISTED in ScoreFactorContribution.
 *
 * Deliberately distinct from `ScoringEngine.FactorContribution`, which is the compute-time shape
 * (weights, weighted values, missing-data flags, per-factor explanations) produced during a run.
 * This is the smaller read-back projection: what a later query can see, and all the drag maths needs.
 */
export interface PersistedContribution {
    factorId: string;
    /** Display name of the factor ("Event Registrations"). */
    label: string;
    /** 0–1: how the member ranks on this factor vs. the population. */
    normalizedValue: number;
    /** How much of the score this factor ACTUALLY delivered for this member. Note the trap: the
     *  scorer writes 0 here when the member had no data, which is exactly when the factor is hurting
     *  them most — so this is the wrong basis for drag on its own. See `weight`. */
    percentOfTotal: number;
    /** The factor's CONFIGURED share of the rubric (ModelFactor.Weight) — how much of the score it
     *  was SUPPOSED to carry, whether or not the member had data for it. Preferred over
     *  `percentOfTotal` for drag; null when the rubric weight wasn't loaded. */
    weight?: number | null;
    /** False when the member had NO underlying records for this factor at all. */
    hadData: boolean;
}

/** How much a single factor is holding a member back, and why that number. */
export interface FactorDrag {
    factorId: string;
    label: string;
    /** percentOfTotal × shortfall. High = this factor matters a lot AND the member is weak on it. */
    drag: number;
    /** 0–1 distance from a perfect showing on this factor; a member with no data is a full 1. */
    shortfall: number;
    hadData: boolean;
}

/**
 * Rank a member's factors by how much each is dragging the score down.
 *
 * The weighting matters: being weak on a factor that carries 2% of the score is not a problem worth
 * contacting someone about, and being average on a factor that carries 70% might be. So drag is the
 * factor's SHARE of the score multiplied by how far short the member falls on it. A factor with no
 * data counts as a full shortfall, because the engine scores it as a zero either way (that is the
 * missing-data policy's doing, and it's exactly why the completeness gate exists alongside this).
 *
 * Share comes from the CONFIGURED rubric weight, not the realized `percentOfTotal`. This is the
 * subtle part and it changes answers: with a `Zero` missing-data policy, a member with no records for
 * a factor is scored zero on it, and the scorer then writes `percentOfTotal = 0` for that row. So the
 * realized share is zero *precisely* when the factor is hurting the member most, and ranking on it
 * would make a missing signal literally unnameable as the reason. Using the weight says the honest
 * thing instead: "this factor was meant to carry 26% of your score and delivered none of it."
 *
 * Returned worst-first. Factors carrying no share of the score can never be the reason, so they sort
 * to the bottom with zero drag rather than being dropped (a caller may still want to show them).
 */
export function rankFactorDrag(contributions: readonly PersistedContribution[]): FactorDrag[] {
    return contributions
        .map((c) => {
            const share = shareOf(c);
            const shortfall = c.hadData ? 1 - Math.max(0, Math.min(1, c.normalizedValue)) : 1;
            return { factorId: c.factorId, label: c.label, drag: share * shortfall, shortfall, hadData: c.hadData };
        })
        .sort((a, b) => b.drag - a.drag);
}

/** How much of the score this factor answers for: the rubric weight when we have it, else the
 *  realized percentage. Drag is only ever compared WITHIN one member, so the two scales (0–1 weights,
 *  0–1 or 0–100 percentages) never need reconciling — only their relative sizes matter. */
function shareOf(c: PersistedContribution): number {
    const weight = c.weight;
    if (weight != null && Number.isFinite(weight) && weight > 0) return Number(weight);
    return c.percentOfTotal > 0 ? c.percentOfTotal : 0;
}

/** The single factor most responsible for a member's low score, or null when nothing is dragging
 *  (a member doing fine on everything has no reason to be contacted about anything). */
export function dominantDrag(contributions: readonly PersistedContribution[]): FactorDrag | null {
    const ranked = rankFactorDrag(contributions);
    return ranked.length > 0 && ranked[0].drag > 0 ? ranked[0] : null;
}

/** Human label for the dominant reason, in the form the UI and a message can both use. */
export function dominantDragLabel(contributions: readonly PersistedContribution[]): string | null {
    const worst = dominantDrag(contributions);
    if (!worst) return null;
    return worst.hadData ? `Low ${worst.label}` : `No ${worst.label}`;
}

/**
 * A condition on WHY a member is low. Every field is optional and they AND together.
 *
 * Two different questions are supported deliberately, because they group differently:
 *  - `dominantFactorIds`: "this factor is the member's MAIN problem". Produces homogeneous groups
 *    (everyone here has the same primary issue), which is what makes one action fit all of them.
 *  - `weakOnFactorId` + `maxNormalizedValue`: "the member is weak on this factor", regardless of
 *    whether it's their worst. Broader, useful when the action targets one behaviour specifically.
 */
export interface ReasonCondition {
    /** Keep members whose dominant drag is one of these factors. */
    dominantFactorIds?: string[] | null;
    /** Keep members weak on this specific factor... */
    weakOnFactorId?: string | null;
    /** ...meaning their normalized value on it is at or below this (0–1). Defaults to 0.5. */
    maxNormalizedValue?: number | null;
    /** When true, keep only members with NO data at all for `weakOnFactorId`. */
    requireNoData?: boolean | null;
    /** The mirror of `requireNoData`: keep only members who DO have data for the factor.
     *
     *  Needed to make a breakdown slice reproducible. "Low Event Registrations" and "No Event
     *  Registrations" are separate slices with separate counts, but both have the same dominant
     *  factor — so selecting the "Low" slice without this would also drag in the "No" members and
     *  return more rows than the slice said it had. */
    requireData?: boolean | null;
}

/** Does this rule ask anything about the reason? */
export function hasReasonCondition(c: ReasonCondition): boolean {
    return (
        (Array.isArray(c.dominantFactorIds) && c.dominantFactorIds.length > 0) ||
        c.weakOnFactorId != null ||
        c.requireNoData === true ||
        c.requireData === true
    );
}

/**
 * Test one member's contributions against a reason condition.
 *
 * A member with NO contribution rows never matches: the reason is unknown, and unknown is not a
 * match (the same stance the trajectory bounds take). Contacting someone because we can't see why
 * they're low is the mistake this whole layer exists to avoid.
 */
export function reasonMatches(contributions: readonly PersistedContribution[], c: ReasonCondition): boolean {
    if (!hasReasonCondition(c)) return true;
    if (contributions.length === 0) return false;

    if (Array.isArray(c.dominantFactorIds) && c.dominantFactorIds.length > 0) {
        const worst = dominantDrag(contributions);
        if (!worst || !c.dominantFactorIds.includes(worst.factorId)) return false;
    }
    if (c.weakOnFactorId != null) {
        const hit = contributions.find((x) => x.factorId === c.weakOnFactorId);
        if (!hit) return false; // the factor isn't in this member's rubric at all
        return dataGateAllows(hit.hadData, c) && weakEnough(hit, c);
    }
    if (c.requireNoData === true || c.requireData === true) {
        // A data gate with no factor named applies to the member's DOMINANT factor.
        const worst = dominantDrag(contributions);
        if (!worst) return false;
        return dataGateAllows(worst.hadData, c);
    }
    return true;
}

/** The requireNoData / requireData gate. Neither set = the gate asks nothing. */
function dataGateAllows(hadData: boolean, c: ReasonCondition): boolean {
    if (c.requireNoData === true) return !hadData;
    if (c.requireData === true) return hadData;
    return true;
}

/** Is the member weak enough on this factor to count? Skipped when the condition is purely about a
 *  data gap, since a member with no records has no meaningful value to compare against a ceiling. */
function weakEnough(hit: PersistedContribution, c: ReasonCondition): boolean {
    if (c.requireNoData === true) return true;
    const ceiling = c.maxNormalizedValue != null && Number.isFinite(c.maxNormalizedValue)
        ? Number(c.maxNormalizedValue)
        : 0.5;
    // No data reads as the worst possible showing, so it satisfies a weakness ceiling.
    return (hit.hadData ? hit.normalizedValue : 0) <= ceiling;
}
