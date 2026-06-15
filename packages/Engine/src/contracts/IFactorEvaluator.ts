import { UserInfo, IMetadataProvider } from "@memberjunction/core";

/**
 * Shared per-run context for factor evaluation — how an evaluator reaches data on the
 * server. Kept minimal; a factor's own config is bound at construction, not passed here.
 */
export interface FactorEvaluationContext {
    /** Context user for server-side data access (RunView / Metadata). */
    contextUser: UserInfo;
    /** Explicit provider for multi-provider safety; defaults to the global provider. */
    provider?: IMetadataProvider;
}

/**
 * One factor's value for one anchor record. The evaluator fills `rawValue` + `hadData`;
 * `normalizedContribution` is populated later by the NormalizationEngine (plan §6.1 step 4).
 */
export interface FactorResult {
    /** Aggregated raw signal (e.g. 12 email opens). Null when hadData is false. */
    rawValue: number | null;
    /**
     * Raw value rescaled into the factor's output range so it is comparable across factors.
     * Null until normalized — population-relative methods need the whole population first.
     */
    normalizedContribution: number | null;
    /**
     * Whether any contributing data existed. Separates a genuine zero ("disengaged") from
     * absence ("no data on file"), which the model's MissingDataPolicy treats differently.
     */
    hadData: boolean;
    /** Itemized, human-readable derivation of the value, for explainability. */
    explanation: string;
}

/**
 * The single most important seam in the codebase (plan §5.2): the one interface through
 * which the engine evaluates a factor. Two (or more) implementations sit behind it —
 * declarative factors compile to one set-based SQL query, Action-backed factors wrap an
 * MJ Action — and the rubric engine and explainability layer never branch on which kind
 * they hold. A factor's config is bound at construction, so evaluateBatch takes only the
 * runtime inputs.
 */
export interface IFactorEvaluator {
    /**
     * Evaluate the factor across the whole population in a single set-based pass — never
     * per-record in a loop (plan §6.1 step 2).
     *
     * @param anchorIds The anchor record UUIDs in scope for this run.
     * @param asOf      The as-of instant for time-windowed evaluation.
     * @param ctx       Shared per-run context (data access, provider).
     * @returns anchorId → FactorResult; an anchor with no entry produced no data.
     */
    evaluateBatch(
        anchorIds: string[],
        asOf: Date,
        ctx: FactorEvaluationContext,
    ): Promise<Map<string, FactorResult>>;
}
