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
 * anchorIds are inlined as a quoted UUID list (safe — they are GUIDs); asOf is passed as
 * the @asOf parameter and the window start is derived in-SQL via DATEADD so we never
 * format dates by hand.
 * TODO: swap the inline IN list for a table-valued parameter once populations are large
 * (the inline list hits SQL Server's ~2100-parameter / statement-size limits).
 */
export function buildFactorSql(
    spec: CompiledFactorSpec,
    anchorIds: string[],
): string {
    const idList = anchorIds.map((id) => `'${id}'`).join(",");
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
    if (!spec.dateColumn || spec.windowLengthDays == null) {
        return [];
    }
    const col = `[${spec.dateColumn}]`;
    return [
        `${col} > DATEADD(day, -${spec.windowLengthDays}, @asOf)`,
        `${col} <= @asOf`,
    ];
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
 * Build the SQL aggregate expression for a factor's Aggregation. `Count` needs no column;
 * Sum/Avg/Min/Max/DistinctCount aggregate a column, which MUST be a real column on the
 * related entity. We validate AggregateFieldName against `validColumns` because it is
 * config-supplied (unlike GUIDs or metadata-derived names) — this both catches typos and
 * blocks SQL injection. Unsupported aggregations (Recency, RatePerPeriod, Exists,
 * TrendSlope) throw — deferred to a later slice.
 */
export function buildAggregateExpression(
    aggregation: string | null,
    aggregateFieldName: string | null,
    validColumns: string[],
): string {
    if (!aggregation) {
        throw new Error("buildAggregateExpression: factor has no Aggregation set.");
    }
    if (aggregation === "Count") {
        return "COUNT(*)";
    }
    const column = requireValidColumn(
        aggregation,
        aggregateFieldName,
        validColumns,
    );
    if (aggregation === "DistinctCount") {
        return `COUNT(DISTINCT [${column}])`;
    }
    const fn = FIELD_AGGREGATE_FUNCTIONS[aggregation];
    if (!fn) {
        throw new Error(
            `buildAggregateExpression: unsupported aggregation '${aggregation}' (supported: Count, Sum, Avg, Min, Max, DistinctCount).`,
        );
    }
    return `${fn}([${column}])`;
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
