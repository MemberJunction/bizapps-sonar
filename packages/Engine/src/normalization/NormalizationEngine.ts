import type { FactorResult } from "../contracts/IFactorEvaluator";

/**
 * Resolved normalization config for one factor (the orchestrator derives this from the
 * Factor row's NormalizationMethod / OutputMin / OutputMax / HigherIsBetter). Supported:
 * None (passthrough), MinMax (population rescale), Percentile (population rank), and ZScore
 * (population standardization). Parameterized methods (Logistic/Banded/Lookup) land later.
 */
export interface NormalizationSpec {
    method: "None" | "MinMax" | "Percentile" | "ZScore";
    /** Low end of the normalized output range (e.g. 0). */
    outputMin: number;
    /** High end of the normalized output range (e.g. 1). */
    outputMax: number;
    /** When false the scale is inverted — a lower raw value yields a higher contribution. */
    higherIsBetter: boolean;
}

/** Assigned when the whole population shares one raw value (no spread to rank against). */
const NO_SPREAD_FRACTION = 0.5;

/** ZScore: standard deviations beyond ±this are clamped before mapping to the output range. */
const Z_CLAMP = 3;

/**
 * Fills in the normalizedContribution that the evaluators leave null (plan §6.1 step 4).
 * Population-relative methods (MinMax) need every anchor's raw value at once, which is why
 * this is a single pass over the whole population for a factor — not per record. Pure (no
 * I/O), so directly unit-testable. Mutates the FactorResult objects in place: they are the
 * carrier threaded through the pipeline, gaining fields stage by stage.
 */
export class NormalizationEngine {
    public normalize(
        spec: NormalizationSpec,
        results: Map<string, FactorResult>,
    ): void {
        // Only anchors with data get normalized; the rest keep normalizedContribution null
        // and are handled later by the model's MissingDataPolicy.
        const withData = [...results.values()].filter(
            (r) => r.hadData && r.rawValue !== null,
        );
        if (withData.length === 0) {
            return;
        }

        switch (spec.method) {
            case "None":
                this.applyNone(withData);
                break;
            case "MinMax":
                this.applyMinMax(spec, withData);
                break;
            case "Percentile":
                this.applyPercentile(spec, withData);
                break;
            case "ZScore":
                this.applyZScore(spec, withData);
                break;
        }
    }

    /** Passthrough: the normalized value is the raw value, unscaled. */
    private applyNone(results: FactorResult[]): void {
        for (const r of results) {
            r.normalizedContribution = r.rawValue;
        }
    }

    /** Rescale each raw value to 0..1 against the population min/max, then to the output range. */
    private applyMinMax(
        spec: NormalizationSpec,
        results: FactorResult[],
    ): void {
        const values = results
            .map((r) => r.rawValue)
            .filter((v): v is number => v !== null);
        // reduce rather than Math.min(...spread) — large populations would blow the call stack.
        const min = values.reduce((a, b) => Math.min(a, b));
        const max = values.reduce((a, b) => Math.max(a, b));

        for (const r of results) {
            if (r.rawValue === null) {
                continue;
            }
            const fraction =
                max === min
                    ? NO_SPREAD_FRACTION
                    : (r.rawValue - min) / (max - min);
            r.normalizedContribution = this.toOutputRange(spec, fraction);
        }
    }

    /**
     * Rank each value within the population → a 0..1 percentile, then to the output range.
     * Uses the midpoint method for ties (a value's percentile is the fraction strictly below
     * it plus half the fraction equal to it), so identical values share one fair rank. Robust
     * to outliers — one extreme value can't flatten everyone else the way MinMax does.
     */
    private applyPercentile(spec: NormalizationSpec, results: FactorResult[]): void {
        const values = results
            .map((r) => r.rawValue)
            .filter((v): v is number => v !== null);
        const n = values.length;
        const sorted = [...values].sort((a, b) => a - b);

        // One pass over sorted runs of equal values: a run starting at index i with k copies
        // has fraction (i + k/2) / n. O(n log n) overall — no per-value rescan.
        const fractionByValue = new Map<number, number>();
        let i = 0;
        while (i < sorted.length) {
            let j = i;
            while (j < sorted.length && sorted[j] === sorted[i]) j++;
            fractionByValue.set(sorted[i], (i + (j - i) / 2) / n);
            i = j;
        }

        for (const r of results) {
            if (r.rawValue === null) continue;
            const fraction = fractionByValue.get(r.rawValue) ?? NO_SPREAD_FRACTION;
            r.normalizedContribution = this.toOutputRange(spec, fraction);
        }
    }

    /**
     * Standardize each value to (x − mean) / stddev against the population, clamp to ±Z_CLAMP
     * (z-scores are unbounded), map the clamped band onto 0..1, then to the output range.
     * Rewards how far above/below the mean a record sits — useful when the spread, not the
     * raw min/max, is what matters.
     */
    private applyZScore(spec: NormalizationSpec, results: FactorResult[]): void {
        const values = results
            .map((r) => r.rawValue)
            .filter((v): v is number => v !== null);
        const n = values.length;
        const mean = values.reduce((a, b) => a + b, 0) / n;
        const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
        const stdDev = Math.sqrt(variance);

        for (const r of results) {
            if (r.rawValue === null) continue;
            let fraction: number;
            if (stdDev === 0) {
                fraction = NO_SPREAD_FRACTION;
            } else {
                const z = (r.rawValue - mean) / stdDev;
                const clamped = Math.max(-Z_CLAMP, Math.min(Z_CLAMP, z));
                fraction = (clamped + Z_CLAMP) / (2 * Z_CLAMP);
            }
            r.normalizedContribution = this.toOutputRange(spec, fraction);
        }
    }

    /** Apply direction (HigherIsBetter), then scale a 0..1 fraction into [outputMin, outputMax]. */
    private toOutputRange(spec: NormalizationSpec, fraction: number): number {
        const directed = spec.higherIsBetter ? fraction : 1 - fraction;
        return spec.outputMin + directed * (spec.outputMax - spec.outputMin);
    }
}
