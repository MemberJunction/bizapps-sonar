/**
 * The pure decisions behind reconciling a score's contribution rows. Kept out of ScorePersister so
 * they're testable without a database — the persister does the entity plumbing, these decide what
 * should happen.
 */

/**
 * How an existing set of contribution rows maps onto a freshly computed set.
 *
 * Reconciling in place (rather than delete-all-then-reinsert) is deliberate: Record Set Processing
 * isolates per record with no run-spanning transaction, so a bulk delete followed by a crash would
 * strip every member's explainability breakdown with nothing to roll back. See the atomicity note
 * on {@link ScorePersister}.
 */
export interface ContributionPlan {
    /** Rows reused in place — the first `Update` existing rows take the first `Update` new values. */
    Update: number;
    /** New rows to insert, when the computed set is larger than what exists. */
    Insert: number;
    /** Surplus existing rows to delete, when a model version dropped factors. */
    Delete: number;
}

/**
 * Partition `existingCount` existing rows against `computedCount` computed contributions.
 *
 * The `Delete` arm is the one that matters and the easiest to get wrong: republishing a model with
 * fewer factors leaves stale contribution rows behind, and a stale row is worse than a missing one
 * because the explainability waterfall would show a factor the current version no longer scores.
 */
export function planContributions(existingCount: number, computedCount: number): ContributionPlan {
    const safeExisting = Math.max(0, existingCount);
    const safeComputed = Math.max(0, computedCount);
    return {
        Update: Math.min(safeExisting, safeComputed),
        Insert: Math.max(0, safeComputed - safeExisting),
        Delete: Math.max(0, safeExisting - safeComputed),
    };
}

/**
 * A contribution's share of the score, or `null` when there is no total to take a share of.
 *
 * ⚠️ This is the `PercentOfTotal` trap documented in `factorDrag.ts`: it comes out 0 for a factor the
 * member had NO data on, which is exactly when that factor is hurting them most. Anything reasoning
 * about *why* a score is low must rank on the configured `ModelFactor.Weight`, not on this.
 */
export function percentOfTotal(weightedValue: number, rawScore: number): number | null {
    if (rawScore === 0 || !Number.isFinite(rawScore) || !Number.isFinite(weightedValue)) return null;
    return weightedValue / rawScore;
}
