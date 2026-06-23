import type { FactorResult } from "../contracts/IFactorEvaluator";
import type { FilterValue } from "./filter";

/**
 * A compiled time window — the date bound applied to the related table's activity-date column.
 * A discriminated union so each window type carries exactly the fields it needs, and the SQL
 * builder switches on `kind`. `dateColumn` is the related-entity column we test (e.g.
 * "RegistrationDate"); the per-anchor kinds also reference an anchor boundary column.
 *
 *  - Rolling          — `(asOf − length, asOf]`; length in days OR months. Same shape for everyone.
 *  - Calendar         — the calendar period containing asOf (month/quarter/year), period-start → asOf.
 *  - SinceEvent       — `[anchorDate + offset, asOf]`; window STARTS at a per-anchor date (e.g. join date).
 *  - RenewalRelative  — `[anchorDate + offset, anchorDate]` capped at asOf; window ENDS at a per-anchor date.
 */
export type CompiledWindow =
    | { kind: "Rolling"; dateColumn: string; lengthDays: number | null; lengthMonths: number | null }
    | { kind: "Calendar"; dateColumn: string; period: "month" | "quarter" | "year" }
    | { kind: "SinceEvent"; dateColumn: string; anchorDateColumn: string; offsetDays: number }
    | { kind: "RenewalRelative"; dateColumn: string; anchorDateColumn: string; offsetDays: number };

/** Window kinds whose bounds come from a per-anchor date column (so the query must join the anchor). */
export function windowNeedsAnchorJoin(window: CompiledWindow | null): boolean {
    return window?.kind === "SinceEvent" || window?.kind === "RenewalRelative";
}

/**
 * One intermediate JOIN from the leaf (measure) table toward the anchor — a multi-hop step
 * (e.g. EmailClick → EmailSend on the way to Member). Built by FactorCompiler from
 * `ModelRelatedEntity.RelationshipPath`. Each hop follows a foreign key on the LEFT (child)
 * side to the joined parent's primary key, so every hop is many-to-one *toward* the anchor —
 * which means no row fan-out and `COUNT(*)`/`SUM` stay correct.
 */
export interface CompiledJoin {
    /** Bracket-quoted joined (parent) table, e.g. "[comm].[EmailSend]". */
    table: string;
    /** Alias for the joined table within the query, e.g. "h1". */
    alias: string;
    /** Already-qualified SQL ref of the FK column on the LEFT side
     *  (the leaf's full table name on hop 1, the previous hop's alias after that). */
    leftRef: string;
    /** Column on the joined table the FK points to (its PK), e.g. "ID". */
    rightColumn: string;
}

/**
 * A declarative factor reduced to the few SQL-ready pieces the evaluator needs. Produced
 * by the FactorCompiler (translation); consumed by CompiledFactorEvaluator (execution).
 * Runtime inputs (anchorIds, asOf) are NOT part of the spec — they are bound at run time.
 */
export interface CompiledFactorSpec {
    /** The Factor this spec was compiled from (for explanation text / debugging). */
    factorId: string;
    /** Fully-qualified related (leaf/measure) table, already bracket-quoted, e.g. "[CRM].[Activity]". */
    relatedTable: string;
    /** The column holding the anchor FK (the GROUP BY / IN key). Single-hop: on `relatedTable`.
     *  Multi-hop: on the last `joins` entry's table (qualified by that alias). */
    anchorKeyColumn: string;
    /** Intermediate JOINs from the leaf toward the anchor (multi-hop). Empty/absent = single-hop. */
    joins?: CompiledJoin[];
    /** The compiled time window, or null for "no time bound" (AllTime / no window). */
    window: CompiledWindow | null;
    /** Anchor table (bracket-quoted) + its PK — only set when {@link windowNeedsAnchorJoin}. */
    anchorTable?: string | null;
    anchorPkColumn?: string | null;
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
    const joins = spec.joins ?? [];
    // Multi-hop: the anchor FK lives on the last joined (anchor-adjacent) table, so qualify the
    // key by that alias. Single-hop: it's a bare column on the leaf table. (Leaf columns used by
    // the aggregate/filter/window stay bare — multi-hop v1 assumes leaf column names don't
    // collide with the joined tables'; SQL Server fails loud on an ambiguous column if they do.)
    const key = joins.length
        ? `${joins[joins.length - 1].alias}.[${spec.anchorKeyColumn}]`
        : `[${spec.anchorKeyColumn}]`;
    const where = [`${key} IN (${idList})`, ...windowClause(spec.window)];
    if (spec.filterClause) {
        where.push(spec.filterClause);
    }
    const from = [`FROM ${spec.relatedTable}`];
    for (const j of joins) {
        from.push(`JOIN ${j.table} ${j.alias} ON ${j.leftRef} = ${j.alias}.[${j.rightColumn}]`);
    }
    // Per-anchor windows (SinceEvent/RenewalRelative) read a date off the anchor row, so the
    // anchor table is joined as `a`. The FK→PK join is 1:1, so it never fans out the aggregate.
    if (windowNeedsAnchorJoin(spec.window)) {
        from.push(`JOIN ${spec.anchorTable} a ON a.[${spec.anchorPkColumn}] = ${key}`);
    }
    return [
        `SELECT ${key} AS anchorId, ${spec.aggregateSql} AS rawValue`,
        from.join("\n"),
        `WHERE ${where.join(" AND ")}`,
        `GROUP BY ${key}`,
    ].join("\n");
}

/** The date predicate(s) for a window (per kind), or nothing when there is no window. */
function windowClause(window: CompiledWindow | null): string[] {
    if (!window) {
        return [];
    }
    const col = `[${window.dateColumn}]`;
    switch (window.kind) {
        case "Rolling": {
            // Months take precedence when set (DATEADD month handles variable month lengths).
            const start =
                window.lengthMonths != null
                    ? `DATEADD(month, -${window.lengthMonths}, @asOf)`
                    : `DATEADD(day, -${window.lengthDays}, @asOf)`;
            return [`${col} > ${start}`, `${col} <= @asOf`];
        }
        case "Calendar":
            return [`${col} >= ${calendarPeriodStart(window.period)}`, `${col} <= @asOf`];
        case "SinceEvent":
            return [
                `${col} >= DATEADD(day, ${window.offsetDays}, a.[${window.anchorDateColumn}])`,
                `${col} <= @asOf`,
            ];
        case "RenewalRelative":
            // Window brackets the per-anchor date; also capped at @asOf so a historical recompute
            // never counts activity dated after its as-of date.
            return [
                `${col} >= DATEADD(day, ${window.offsetDays}, a.[${window.anchorDateColumn}])`,
                `${col} <= a.[${window.anchorDateColumn}]`,
                `${col} <= @asOf`,
            ];
    }
}

/** SQL for the start of the calendar period containing @asOf (aligned to real calendar boundaries). */
function calendarPeriodStart(period: "month" | "quarter" | "year"): string {
    switch (period) {
        case "month":
            return `DATEFROMPARTS(YEAR(@asOf), MONTH(@asOf), 1)`;
        case "quarter":
            return `DATEFROMPARTS(YEAR(@asOf), (DATEPART(quarter, @asOf) - 1) * 3 + 1, 1)`;
        case "year":
            return `DATEFROMPARTS(YEAR(@asOf), 1, 1)`;
    }
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
    return `${rawValue} matching ${spec.relatedTable} record(s)${windowPhrase(spec.window)}`;
}

/** A short natural-language description of a window, for explanation text ("" when none). */
function windowPhrase(window: CompiledWindow | null): string {
    if (!window) {
        return "";
    }
    switch (window.kind) {
        case "Rolling":
            return window.lengthMonths != null
                ? ` in the last ${window.lengthMonths} months`
                : ` in the last ${window.lengthDays} days`;
        case "Calendar":
            return ` this ${window.period}`;
        case "SinceEvent":
            return ` since ${window.anchorDateColumn}`;
        case "RenewalRelative":
            return ` in the ${Math.abs(window.offsetDays)} days around ${window.anchorDateColumn}`;
    }
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
