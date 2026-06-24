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

/** One factor's rubric binding plus its normalized results across the population. */
export interface WeightedFactor {
    factorId: string;
    /** The ModelFactor (rubric binding) row — persisted on each contribution. */
    modelFactorId: string;
    weight: number;
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
 * v1: WeightedSum only; a missing factor contributes 0 (and the denominator is the total
 * rubric weight, so missing data lowers the score) — the MissingDataPolicy refines this later.
 */
export class ScoringEngine {
    public score(
        spec: ScoringSpec,
        factors: WeightedFactor[],
    ): Map<string, ScoreResult> {
        const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
        const out = new Map<string, ScoreResult>();
        for (const anchorId of this.collectAnchorIds(factors)) {
            out.set(
                anchorId,
                this.scoreAnchor(anchorId, factors, totalWeight, spec),
            );
        }
        return out;
    }

    /** Every anchor that appears in at least one factor's results. */
    private collectAnchorIds(factors: WeightedFactor[]): Set<string> {
        const ids = new Set<string>();
        for (const f of factors) {
            for (const id of f.results.keys()) {
                ids.add(id);
            }
        }
        return ids;
    }

    private scoreAnchor(
        anchorId: string,
        factors: WeightedFactor[],
        totalWeight: number,
        spec: ScoringSpec,
    ): ScoreResult {
        const contributions = this.contributionsFor(anchorId, factors);
        const rawScore = contributions.reduce(
            (sum, c) => sum + c.weightedValue,
            0,
        );
        const normalizedScore =
            totalWeight === 0
                ? spec.scaleMin
                : spec.scaleMin +
                  (rawScore / totalWeight) * (spec.scaleMax - spec.scaleMin);
        const band = this.assignBand(spec.bands, normalizedScore);
        return {
            rawScore,
            normalizedScore,
            bandId: band?.bandId ?? null,
            bandLabel: band?.label ?? null,
            contributions,
        };
    }

    /** Build the per-factor breakdown for one anchor; factors with no data are skipped (contribute 0). */
    private contributionsFor(
        anchorId: string,
        factors: WeightedFactor[],
    ): FactorContribution[] {
        const contributions: FactorContribution[] = [];
        for (const f of factors) {
            const result = f.results.get(anchorId);
            if (!result || result.normalizedContribution === null) {
                continue;
            }
            contributions.push({
                factorId: f.factorId,
                modelFactorId: f.modelFactorId,
                weight: f.weight,
                rawValue: result.rawValue,
                normalizedContribution: result.normalizedContribution,
                weightedValue: f.weight * result.normalizedContribution,
                hadData: result.hadData,
            });
        }
        return contributions;
    }

    /**
     * The band a score falls in, using **half-open ranges** `[minScore, maxScore)`: a value on a
     * shared boundary belongs to the upper band, so adjacent bands can never both claim it — the
     * assignment is deterministic regardless of band order (it does NOT rely on the query's ORDER
     * BY). The sole exception is the top band, which includes its own maxScore so the maximum
     * possible score still bands. Matches the plan's "half-open, contiguous, non-overlapping" model.
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
