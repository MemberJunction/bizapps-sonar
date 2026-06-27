import type { FactorResult } from "../contracts/IFactorEvaluator";

/** One band of a model's rubric — a labelled score range, e.g. 40–70 "Neutral". */
export interface ScoreBandDef {
    bandId: string;
    label: string;
    minScore: number;
    maxScore: number;
}

/** Resolved combine config for a model (the orchestrator derives this from the ScoreModel + its bands). */
export interface ScoringSpec {
    /** Low end of the final score scale (ScoreModel.ScoreScaleMin, e.g. 0). */
    scaleMin: number;
    /** High end of the final score scale (ScoreModel.ScoreScaleMax, e.g. 100). */
    scaleMax: number;
    /** The model's bands; assignment picks the first one whose range contains the score. */
    bands: ScoreBandDef[];
}

/** How an anchor missing a factor's data is scored on it. Resolved from Factor.MissingDataPolicy
 *  upstream ("ModelDefault" resolves to "Zero"). */
export type EffectiveMissingDataPolicy = "Zero" | "NeutralMidpoint" | "Exclude";

/** One factor's rubric binding plus its normalized results across the population. */
export interface WeightedFactor {
    factorId: string;
    /** The ModelFactor (rubric binding) row — persisted on each contribution. */
    modelFactorId: string;
    weight: number;
    /** What to do for anchors with no data for this factor (default "Zero"). */
    missingDataPolicy: EffectiveMissingDataPolicy;
    /** The factor's normalized output range — missing-data fills are expressed relative to it, since a
     *  contribution lives on [outputMin, outputMax] (direction already applied). Optional; defaults to
     *  the standard [0,1] normalized scale, so callers on that scale need not set it. */
    outputMin?: number;
    outputMax?: number;
    results: Map<string, FactorResult>;
}

/** The itemized math behind one factor's part of a score (powers explainability + persistence). */
export interface FactorContribution {
    factorId: string;
    modelFactorId: string;
    weight: number;
    rawValue: number | null;
    normalizedContribution: number;
    weightedValue: number;
    hadData: boolean;
    /** True when the anchor had no data and this contribution was filled in by a missing-data
     *  policy (Zero/NeutralMidpoint) rather than measured. */
    missingDataApplied: boolean;
    /** The factor's human "why" for this anchor (e.g. an LLM factor's reason, or a declarative
     *  factor's window/aggregation summary). Null when the anchor had no data. Powers the
     *  explainability waterfall. */
    explanation: string | null;
}

/** The combined score for one anchor. */
export interface ScoreResult {
    rawScore: number;
    normalizedScore: number;
    bandId: string | null;
    bandLabel: string | null;
    contributions: FactorContribution[];
}

/**
 * Combines each anchor's normalized factor contributions into one score (plan §6.1 steps
 * 5–6): weighted sum → scale to the model range → assign a band. Pure (no I/O), so directly
 * unit-testable.
 *
 * WeightedSum: normalizedScore = scaleMin + (Σ wᵢ·normᵢ / Σ wᵢ) × (scaleMax−scaleMin), over the
 * factors that COUNT for the anchor. MissingDataPolicy decides what an absent factor does:
 * Zero counts it as 0 and NeutralMidpoint as 0.5 (both keep the weight in the denominator, so
 * they pull the score), while Exclude drops it from numerator AND denominator (the anchor is
 * scored only on the factors it has). An anchor with no countable factors is left unscored.
 */
export class ScoringEngine {
    /** Score every anchor in `population` — not just those with data — so fully-missing anchors
     *  still surface (e.g. at the floor under the Zero policy) instead of silently vanishing. */
    public score(
        spec: ScoringSpec,
        factors: WeightedFactor[],
        population: Iterable<string>,
    ): Map<string, ScoreResult> {
        const out = new Map<string, ScoreResult>();
        for (const anchorId of population) {
            const result = this.scoreAnchor(anchorId, factors, spec);
            if (result) {
                out.set(anchorId, result);
            }
        }
        return out;
    }

    /** Score one anchor, applying each factor's MissingDataPolicy. Returns null when no factor
     *  counts (all missing under Exclude) — there is nothing to score. */
    private scoreAnchor(
        anchorId: string,
        factors: WeightedFactor[],
        spec: ScoringSpec,
    ): ScoreResult | null {
        const contributions = this.contributionsFor(anchorId, factors);
        const denominator = contributions.reduce((sum, c) => sum + c.weight, 0);
        if (denominator === 0) {
            return null;
        }
        const rawScore = contributions.reduce((sum, c) => sum + c.weightedValue, 0);
        const normalizedScore =
            spec.scaleMin + (rawScore / denominator) * (spec.scaleMax - spec.scaleMin);
        const band = this.assignBand(spec.bands, normalizedScore);
        return {
            rawScore,
            normalizedScore,
            bandId: band?.bandId ?? null,
            bandLabel: band?.label ?? null,
            contributions,
        };
    }

    /** Per-factor breakdown for one anchor. Factors with data contribute their normalized value;
     *  missing factors are filled per policy (Zero→0, NeutralMidpoint→0.5) or dropped (Exclude).
     *  Only the factors that appear here count toward the score's denominator. */
    private contributionsFor(
        anchorId: string,
        factors: WeightedFactor[],
    ): FactorContribution[] {
        const contributions: FactorContribution[] = [];
        for (const f of factors) {
            const result = f.results.get(anchorId);
            const hasData = !!result && result.normalizedContribution !== null;

            let normalized: number;
            let rawValue: number | null;
            let missingApplied: boolean;
            let explanation: string | null;
            if (hasData) {
                normalized = result!.normalizedContribution!;
                rawValue = result!.rawValue;
                missingApplied = false;
                explanation = result!.explanation || null;
            } else if (f.missingDataPolicy === "Exclude") {
                continue; // out of both numerator and denominator
            } else {
                // NeutralMidpoint = the MIDPOINT of the factor's output range, so a factor with a custom
                // range (e.g. 0..100) fills 50 — not a hardcoded 0.5 that would read as the floor. On the
                // standard [0,1] scale this is 0.5, unchanged. Zero stays a literal 0 (its namesake — a
                // hard zero contribution / deliberate penalty for missing data), independent of range.
                const lo = f.outputMin ?? 0;
                const hi = f.outputMax ?? 1;
                normalized = f.missingDataPolicy === "NeutralMidpoint" ? (lo + hi) / 2 : 0;
                rawValue = null;
                missingApplied = true;
                explanation = null; // nothing measured for this anchor
            }

            contributions.push({
                factorId: f.factorId,
                modelFactorId: f.modelFactorId,
                weight: f.weight,
                rawValue,
                normalizedContribution: normalized,
                weightedValue: f.weight * normalized,
                hadData: hasData,
                missingDataApplied: missingApplied,
                explanation,
            });
        }
        return contributions;
    }

    /**
     * The band a score falls in, using **half-open ranges** `[minScore, maxScore)`: a value on a
     * shared boundary belongs to the upper band, so adjacent bands can never both claim it — the
     * assignment is deterministic regardless of band order. The sole exception is the top band,
     * which includes its own maxScore so the maximum possible score still bands. Matches the plan's
     * "half-open, contiguous, non-overlapping" model.
     */
    private assignBand(
        bands: ScoreBandDef[],
        score: number,
    ): ScoreBandDef | undefined {
        if (bands.length === 0) {
            return undefined;
        }
        const topMax = Math.max(...bands.map((b) => b.maxScore));
        return bands.find(
            (b) =>
                score >= b.minScore &&
                (score < b.maxScore || (score === b.maxScore && b.maxScore === topMax)),
        );
    }
}
