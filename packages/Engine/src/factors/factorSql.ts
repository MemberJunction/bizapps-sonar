import type { FactorResult } from "../contracts/IFactorEvaluator";
import type { FilterValue } from "./filter";

/**
 * A declarative factor reduced to the few SQL-ready pieces the evaluator needs. Produced
 * by the FactorCompiler (translation); consumed by CompiledFactorEvaluator (execution).
 * Runtime inputs (anchorIds, asOf) are NOT part of the spec — they are bound at run time.
 */
export interface CompiledFactorSpec {
    /** The Factor this spec was compiled from (for explanation text / debugging). */
    factorId: string;
    /** Fully-qualified related table, already bracket-quoted, e.g. "[CRM].[Activity]". */
    relatedTable: string;
    /** Column on the related table that points at the anchor (the GROUP BY / IN key). */
    anchorKeyColumn: string;
    /** Date column the time window filters on (TimeWindow.AnchorDateField); null = no window. */
    dateColumn: string | null;
    /** Rolling window length in days; null = no window (count everything). */
    windowLengthDays: number | null;
    /** Rolling window length in months; takes precedence over days when set (uses DATEADD month
     *  so variable month lengths are exact). undefined/null = not month-based. */
    windowLengthMonths?: number | null;
    /** The SQL aggregate expression, e.g. "COUNT(*)". The compiler picks this per Aggregation. */
    aggregateSql: string;
    /** Optional parameterized WHERE fragment from the factor's FilterExpression (null = no filter). */
    filterClause?: string | null;
    /** Parameters referenced by filterClause, passed to ExecuteSQL alongside @asOf. */
    filterParams?: Record<string, FilterValue>;
}

/** One result row shape coming back from the compiled query. */
export interface AggregateRow {
    anchorId: string;
    rawValue: number;
}

/**
 * Build the aggregation query for a compiled factor. Pure: (spec, anchorIds) → SQL string.
 * asOf is passed as the @asOf parameter and the window start is derived in-SQL via DATEADD so
 * we never format dates by hand.
 *
 * Anchor IDs are inlined into the IN list (SQL Server has no native array parameter without a
 * TVP). Single quotes are doubled so a string/varchar anchor PK can't break out of the literal;
 * GUID/int PKs are unaffected. A single-column PK is asserted upstream (resolvePopulation).
 * TODO: swap the inline IN list for a table-valued parameter — fixes the ~2100-param / statement-
 * size limit at scale AND removes string-interpolation entirely (parameterizing the values, and
 * making the Record<string,string> typing honest for non-UUID PKs). See roadmap.
 */
export function buildFactorSql(
    spec: CompiledFactorSpec,
    anchorIds: string[],
): string {
    const idList = anchorIds.map((id) => `'${String(id).replace(/'/g, "''")}'`).join(",");
    const key = `[${spec.anchorKeyColumn}]`;
    const where = [`${key} IN (${idList})`, ...windowClause(spec)];
    if (spec.filterClause) {
        where.push(spec.filterClause);
    }
    return [
        `SELECT ${key} AS anchorId, ${spec.aggregateSql} AS rawValue`,
        `FROM ${spec.relatedTable}`,
        `WHERE ${where.join(" AND ")}`,
        `GROUP BY ${key}`,
    ].join("\n");
}

/** The two date predicates for a rolling window, or nothing when there is no window. */
function windowClause(spec: CompiledFactorSpec): string[] {
    // No date column, or no length in either unit → no time bound.
    if (
        !spec.dateColumn ||
        (spec.windowLengthDays == null && spec.windowLengthMonths == null)
    ) {
        return [];
    }
    const col = `[${spec.dateColumn}]`;
    // Months take precedence when set (DATEADD month handles variable month lengths).
    const start =
        spec.windowLengthMonths != null
            ? `DATEADD(month, -${spec.windowLengthMonths}, @asOf)`
            : `DATEADD(day, -${spec.windowLengthDays}, @asOf)`;
    return [`${col} > ${start}`, `${col} <= @asOf`];
}

/**
 * Map query rows into FactorResults. Pure: (spec, rows) → map. Only anchors that produced
 * a row appear; an absent anchor means "no contributing data" (the caller's
 * MissingDataPolicy decides what that becomes). normalizedContribution is left null — the
 * NormalizationEngine fills it later.
 */
export function mapAggregateRows(
    spec: CompiledFactorSpec,
    rows: AggregateRow[],
): Map<string, FactorResult> {
    const results = new Map<string, FactorResult>();
    for (const row of rows ?? []) {
        results.set(row.anchorId, {
            rawValue: row.rawValue,
            normalizedContribution: null,
            hadData: true,
            explanation: explain(spec, row.rawValue),
        });
    }
    return results;
}

/** Human-readable derivation for the explainability layer. */
function explain(spec: CompiledFactorSpec, rawValue: number): string {
    const window =
        spec.windowLengthDays != null
            ? ` in the last ${spec.windowLengthDays} days`
            : "";
    return `${rawValue} matching ${spec.relatedTable} record(s)${window}`;
}

/** SQL aggregate functions keyed by Factor.Aggregation — the ones that take a column. */
const FIELD_AGGREGATE_FUNCTIONS: Record<string, string> = {
    Sum: "SUM",
    Avg: "AVG",
    Min: "MIN",
    Max: "MAX",
};

/**
 * Build the SQL aggregate expression for a factor's Aggregation — the bit between SELECT and the
 * GROUP BY in {@link buildFactorSql}. Field-taking aggregations (Sum/Avg/Min/Max/DistinctCount and
 * the Recency date column) validate AggregateFieldName against `validColumns` — it is config-supplied
 * (unlike GUIDs / metadata-derived names), so this both catches typos and blocks SQL injection.
 *
 * Supported: Count, Sum, Avg, Min, Max, DistinctCount, **Exists**, **Recency**. RatePerPeriod and
 * TrendSlope are NOT here — they need extra query context (window length / a per-period CTE) and
 * are handled (or deferred) by the compiler, not this single-expression builder.
 */
export function buildAggregateExpression(
    aggregation: string | null,
    aggregateFieldName: string | null,
    validColumns: string[],
): string {
    if (!aggregation) {
        throw new Error("buildAggregateExpression: factor has no Aggregation set.");
    }
    switch (aggregation) {
        case "Count":
            return "COUNT(*)";
        // 1 when any matching row exists in scope; anchors with none aren't returned at all
        // (= "no data" → the model's MissingDataPolicy, which defaults to 0). So this is the "did
        // it ever happen" signal without a separate 0-row branch.
        case "Exists":
            return "CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END";
        // Days since the most recent matching record at/before @asOf. Future-dated rows are ignored
        // (so a historical recompute is correct even without a window); if none qualify, MAX is NULL
        // → NULL rawValue → no data. Lower = more recent, so factors usually set HigherIsBetter=false.
        case "Recency": {
            const col = requireValidColumn(aggregation, aggregateFieldName, validColumns);
            return `DATEDIFF(day, MAX(CASE WHEN [${col}] <= @asOf THEN [${col}] END), @asOf)`;
        }
        case "DistinctCount": {
            const col = requireValidColumn(aggregation, aggregateFieldName, validColumns);
            return `COUNT(DISTINCT [${col}])`;
        }
        case "Sum":
        case "Avg":
        case "Min":
        case "Max": {
            const col = requireValidColumn(aggregation, aggregateFieldName, validColumns);
            return `${FIELD_AGGREGATE_FUNCTIONS[aggregation]}([${col}])`;
        }
        default:
            throw new Error(
                `buildAggregateExpression: unsupported aggregation '${aggregation}' ` +
                    `(supported: Count, Sum, Avg, Min, Max, DistinctCount, Exists, Recency; ` +
                    `RatePerPeriod and TrendSlope not yet).`,
            );
    }
}

/** Resolve AggregateFieldName to a real column on the related entity (case-insensitive), or throw. */
function requireValidColumn(
    aggregation: string,
    aggregateFieldName: string | null,
    validColumns: string[],
): string {
    if (!aggregateFieldName) {
        throw new Error(
            `buildAggregateExpression: aggregation '${aggregation}' requires an AggregateFieldName.`,
        );
    }
    const match = validColumns.find(
        (c) => c.toLowerCase() === aggregateFieldName.toLowerCase(),
    );
    if (!match) {
        throw new Error(
            `buildAggregateExpression: AggregateFieldName '${aggregateFieldName}' is not a column on the related entity.`,
        );
    }
    return match;
}
