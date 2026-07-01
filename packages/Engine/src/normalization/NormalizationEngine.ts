import type { FactorResult } from "../contracts/IFactorEvaluator";
import {
    createNormalizationRegistry,
    INormalizationStrategy,
    NormalizationMethod,
    NormalizationSpec,
} from "./normalizationStrategies";

// Re-export the contract + param types + parser so consumers keep importing them from this
// module path (the public normalization surface), unchanged by the registry split.
export * from "./normalizationStrategies";

/**
 * Fills in the normalizedContribution that the evaluators leave null (plan §6.1 step 4).
 * Pre-filters to anchors that have data, then dispatches to the method's strategy. The
 * population-relative strategies (MinMax/Percentile/ZScore) consume the whole population in
 * one pass — never per record. Pure (no I/O), so directly unit-testable. Mutates the
 * FactorResult objects in place: they are the carrier threaded through the pipeline, gaining
 * fields stage by stage.
 */
export class NormalizationEngine {
    private readonly strategies: Map<NormalizationMethod, INormalizationStrategy> =
        createNormalizationRegistry();

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

        const strategy = this.strategies.get(spec.method);
        if (!strategy) {
            throw new Error(
                `NormalizationEngine: no strategy registered for method '${spec.method}'.`,
            );
        }
        strategy.apply(spec, withData);
    }
}
