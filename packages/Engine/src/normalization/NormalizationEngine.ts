import type { FactorResult } from "../contracts/IFactorEvaluator";

/**
 * Resolved normalization config for one factor (the orchestrator derives this from the
 * Factor row's NormalizationMethod / OutputMin / OutputMax / HigherIsBetter). v1 supports
 * None (passthrough) and MinMax (population rescale); other methods land here later.
 */
export interface NormalizationSpec {
    method: "None" | "MinMax";
    /** Low end of the normalized output range (e.g. 0). */
    outputMin: number;
    /** High end of the normalized output range (e.g. 1). */
    outputMax: number;
    /** When false the scale is inverted — a lower raw value yields a higher contribution. */
    higherIsBetter: boolean;
}

/** Assigned when the whole population shares one raw value (no spread to rank against). */
const NO_SPREAD_FRACTION = 0.5;

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

    /** Apply direction (HigherIsBetter), then scale a 0..1 fraction into [outputMin, outputMax]. */
    private toOutputRange(spec: NormalizationSpec, fraction: number): number {
        const directed = spec.higherIsBetter ? fraction : 1 - fraction;
        return spec.outputMin + directed * (spec.outputMax - spec.outputMin);
    }
}
