import type { FactorResult } from "../contracts/IFactorEvaluator";

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
