import { RunView } from "@memberjunction/core";
import {
    FactorEvaluationContext,
    FactorResult,
    IFactorEvaluator,
} from "../contracts/IFactorEvaluator";
import {
    PopulationWindow,
    RunViewFoldSpec,
    SupportedAggregation,
    foldRowsToResults,
    sqlWindowPredicate,
} from "./runViewFactor";
import type { AnchorKey } from "./anchorKey";

/**
 * A declarative factor expressed in MJ ENTITY terms rather than SQL terms — the input to
 * {@link RunViewFactorEvaluator}.
 *
 * Deliberately distinct from `CompiledFactorSpec`, which carries bracket-quoted tables, SQL aggregate
 * expressions and join conditions. This one names entities and fields, because that is the vocabulary
 * `RunView` speaks.
 */
export interface RunViewFactorSpec {
    factorId: string;
    factorName: string;
    /** MJ entity name of the measure (leaf) entity, e.g. "Event Registrations". */
    sourceEntityName: string;
    /** FK field names on the measure entity pointing at the anchor PK column(s), in anchor PK order. */
    anchorFkFields: string[];
    aggregation: SupportedAggregation;
    /** Field the aggregation operates on. Null for Count/Exists. */
    aggregateFieldName: string | null;
    /** Population-resolvable window, or null for AllTime. */
    window: PopulationWindow | null;
    /**
     * The factor's `FilterExpression`, passed through as `RunView.ExtraFilter`.
     *
     * Still a SQL `WHERE` fragment — that is what `ExtraFilter` is, and eliminating it entirely would
     * mean building a structured filter model. What changes versus the compiled path is that RunView
     * validates and entity-scopes it instead of us concatenating it into a statement we execute.
     */
    extraFilter?: string | null;
}

/**
 * Evaluates a declarative factor through `RunView` + in-memory folding, instead of compiling it to
 * one set-based `SELECT`.
 *
 * ## Why
 *
 * `provider.ExecuteSQL` applies neither entity permissions nor Row-Level Security. That is the one
 * thing a raw read genuinely bypasses (unlike raw writes, which also skip Entity Actions, Record
 * Changes and cache invalidation). `RunView` applies both, so this path exists to make factor reads
 * governed rather than trusted.
 *
 * ## The cost, honestly
 *
 * The database stops collapsing N measure rows into one number per anchor. This reads the rows and
 * folds them here, so it moves N rows into the app tier where the compiled path moved one row per
 * anchor. On a small population that is free; on a large one it is the whole tradeoff, which is why
 * both evaluators coexist behind {@link IFactorEvaluator} and the choice is per factor.
 *
 * ## Scope of this slice
 *
 * Single-hop factors (the measure entity has a direct FK to the anchor), all eight supported
 * aggregations, and AllTime / Rolling / Calendar windows. Multi-hop paths and per-anchor windows
 * (`SinceEvent` / `RenewalRelative`) route to the compiled evaluator — see the selector in
 * `FactorCompiler`. Multi-hop would need one RunView per hop plus an in-memory join; per-anchor
 * windows need an extra read of the anchor entity for the boundary date.
 */
export class RunViewFactorEvaluator implements IFactorEvaluator {
    /**
     * Anchor ids per `IN (...)` chunk. Keeps the generated `ExtraFilter` well clear of SQL Server's
     * expression limits on a large population; the fetched rows are concatenated across chunks before
     * folding, so chunking is invisible to the result.
     */
    private static readonly AnchorChunkSize = 500;

    constructor(private readonly spec: RunViewFactorSpec) {}

    public async evaluateBatch(
        anchors: AnchorKey[],
        asOf: Date,
        ctx: FactorEvaluationContext,
    ): Promise<Map<string, FactorResult>> {
        if (anchors.length === 0) return new Map();

        // Composite anchors would need the FK tuple filtered as a set of column pairs rather than a
        // single IN list. Fail loud rather than filter on the first column only and silently
        // over-count every anchor.
        if (this.spec.anchorFkFields.length !== 1) {
            throw new Error(
                `RunViewFactorEvaluator: composite anchor keys are not supported in this path yet ` +
                    `(factor ${this.spec.factorId} has ${this.spec.anchorFkFields.length} FK fields). ` +
                    `Route it to the compiled evaluator.`,
            );
        }
        const fkField = this.spec.anchorFkFields[0];
        const rows = await this.readMeasureRows(anchors, fkField, asOf, ctx);

        const fold: RunViewFoldSpec = {
            factorId: this.spec.factorId,
            factorName: this.spec.factorName,
            sourceEntityName: this.spec.sourceEntityName,
            aggregation: this.spec.aggregation,
            aggregateField: this.spec.aggregateFieldName,
            fkFields: this.spec.anchorFkFields,
            window: this.spec.window,
        };
        return foldRowsToResults(fold, anchors, rows, asOf);
    }

    /**
     * Read the measure rows for the population, chunked. Only the fields the fold needs are requested
     * — `ResultType: 'simple'` with an explicit `Fields` list, since we never mutate these rows and
     * narrowing the projection is the only lever this path has on data volume.
     */
    private async readMeasureRows(
        anchors: AnchorKey[],
        fkField: string,
        asOf: Date,
        ctx: FactorEvaluationContext,
    ): Promise<Record<string, unknown>[]> {
        const fields = this.projection(fkField);
        // No provider argument: RunView's ctor takes IRunViewProvider, which IMetadataProvider is not
        // assignable to, and casting across them would need an `unknown` hop. Every other RunView call
        // in this package does the same, so the configured provider is used consistently.
        const rv = new RunView();
        const all: Record<string, unknown>[] = [];

        for (let i = 0; i < anchors.length; i += RunViewFactorEvaluator.AnchorChunkSize) {
            const chunk = anchors.slice(i, i + RunViewFactorEvaluator.AnchorChunkSize);
            const result = await rv.RunView<Record<string, unknown>>(
                {
                    EntityName: this.spec.sourceEntityName,
                    ExtraFilter: this.buildFilter(fkField, chunk, asOf),
                    Fields: fields,
                    ResultType: "simple",
                    // The population's measure rows are the whole point — a default row cap would
                    // silently truncate them and under-report every anchor past the cut.
                    IgnoreMaxRows: true,
                },
                ctx.contextUser,
            );
            // RunView does not throw; a swallowed failure here would look exactly like "nobody had
            // any data", which the MissingDataPolicy would then quietly score.
            if (!result.Success) {
                throw new Error(
                    `RunViewFactorEvaluator: RunView failed on '${this.spec.sourceEntityName}' ` +
                        `for factor ${this.spec.factorId}: ${result.ErrorMessage ?? "unknown error"}`,
                );
            }
            all.push(...(result.Results ?? []));
        }
        return all;
    }

    /** Fields the fold reads: the FK, the window date, and the aggregate column. */
    private projection(fkField: string): string[] {
        const fields = new Set<string>([fkField]);
        if (this.spec.window?.dateField) fields.add(this.spec.window.dateField);
        if (this.spec.aggregateFieldName) fields.add(this.spec.aggregateFieldName);
        return [...fields];
    }

    /**
     * `FK IN (...)` for this chunk, ANDed with the window predicate and the factor's own filter.
     *
     * The window IS pushed into the filter so the DATABASE evaluates it. An earlier version compared
     * dates in JavaScript after the read, which measured wrong against live data: the driver
     * materializes `datetime` columns in local time and `datetime2` in UTC, so a row sitting exactly on
     * an exclusive bound was excluded by SQL but included by JS, shifting counts by one on every
     * boundary row. Comparing naive-to-naive in the database makes both paths agree by construction.
     */
    private buildFilter(fkField: string, chunk: AnchorKey[], asOf: Date): string {
        const list = chunk.map((a) => `'${escapeSqlString(String(a.values[0]))}'`).join(",");
        const clauses = [`[${fkField}] IN (${list})`];
        const window = sqlWindowPredicate(this.spec.window, asOf);
        if (window) clauses.push(window);
        const own = this.spec.extraFilter?.trim();
        if (own) clauses.push(own);
        return clauses.map((c) => `(${c})`).join(" AND ");
    }
}

/**
 * Escape a value for safe interpolation into a single-quoted SQL literal (e.g. an `IN (...)` list
 * or a RunView ExtraFilter).
 *
 * Values like anchor primary keys and model ids came from our own queries, not user input, but they
 * are still interpolated into a filter string — so they are escaped rather than trusted. Doubling the
 * quote is the SQL Server escape; a stray quote in a string value would otherwise break the filter or
 * worse. Exported so every id the Engine splices into a filter goes through the SAME helper
 * (RecomputeOrchestrator and ScorePersister import it) instead of ad-hoc interpolation.
 */
export function escapeSqlString(value: string): string {
    return value.split("'").join("''");
}
