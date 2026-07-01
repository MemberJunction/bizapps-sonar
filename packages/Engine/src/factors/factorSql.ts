import type { FactorResult } from "../contracts/IFactorEvaluator";
import type { FilterValue } from "./filter";
import type { AnchorKey } from "./anchorKey";

/**
 * One column of the anchor's (possibly composite) key, as seen from the related side: the FK column
 * on the anchor-adjacent table + its SQL type for the OPENJSON shred. Order matches AnchorKey.values
 * and the anchor entity's primary-key order.
 */
export interface AnchorKeyColumn {
    /** FK column on the related/last-join table that points at this anchor PK column. */
    fkColumn: string;
    /** SQL type for the OPENJSON WITH declaration (e.g. "uniqueidentifier", "int", "nvarchar(450)"). */
    sqlType: string;
}

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
    /** The join condition as one-or-more column-pairs ANDed together (the FK "bundle"): for each
     *  pair, the already-qualified FK ref on the LEFT side (the leaf's full table name on hop 1,
     *  the previous hop's alias after that) matched to the joined table's referenced column. A
     *  single-column FK is one pair; a COMPOSITE FK is N — all must match, so each child row maps
     *  to exactly one parent (no fan-out). */
    on: { leftRef: string; rightColumn: string }[];
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
    /** The anchor FK column(s) the population key JOINs on — one entry for a single-column anchor,
     *  N for a composite key (ordered to match the anchor PK). On `relatedTable` for single-hop,
     *  on the last `joins` entry's table for multi-hop. */
    anchorKeyColumns: AnchorKeyColumn[];
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
 * Build the aggregation query for a compiled factor. Pure: (spec) → SQL string. The population's
 * key tuples ride in as ONE `@anchorKeys` JSON parameter (see {@link buildAnchorKeysJson}); OPENJSON
 * shreds it into an `(id, v0..vn)` rowset that the query JOINs on the anchor FK column(s). This works
 * for single- AND multi-column (composite) anchors with no ~2100-parameter / statement-size ceiling
 * and no string interpolation of values (so no injection surface). `asOf` is the `@asOf` parameter;
 * window starts are derived in-SQL via DATEADD.
 */
export function buildFactorSql(spec: CompiledFactorSpec): string {
    const joins = spec.joins ?? [];
    // The anchor FK lives on the last joined table (multi-hop) or the related table (single-hop).
    // Single-hop is qualified by the related table's full name (no alias) so the multi-hop leftRefs
    // — which reference that full name on hop 1 — keep resolving.
    const keyQualifier = joins.length ? joins[joins.length - 1].alias : spec.relatedTable;

    const withCols = [
        "id NVARCHAR(100) '$.id'",
        ...spec.anchorKeyColumns.map((c, i) => `v${i} ${c.sqlType} '$.v${i}'`),
    ].join(", ");
    const keyJoinOn = spec.anchorKeyColumns
        .map((c, i) => `${keyQualifier}.[${c.fkColumn}] = k.v${i}`)
        .join(" AND ");

    const from = [`FROM ${spec.relatedTable}`];
    for (const j of joins) {
        // AND every column-pair in the FK bundle — single-column = one pair, composite = N.
        const cond = j.on.map((p) => `${p.leftRef} = ${j.alias}.[${p.rightColumn}]`).join(" AND ");
        from.push(`JOIN ${j.table} ${j.alias} ON ${cond}`);
    }
    from.push(`JOIN OPENJSON(@anchorKeys) WITH (${withCols}) k ON ${keyJoinOn}`);
    // Per-anchor windows (SinceEvent/RenewalRelative) read a date off the anchor row, so the anchor
    // table is joined as `a` (single-column anchors only — composite + per-anchor window is unsupported
    // and rejected upstream). The FK→PK join is 1:1, so it never fans out the aggregate.
    if (windowNeedsAnchorJoin(spec.window)) {
        from.push(
            `JOIN ${spec.anchorTable} a ON a.[${spec.anchorPkColumn}] = ${keyQualifier}.[${spec.anchorKeyColumns[0].fkColumn}]`,
        );
    }

    const where = [...windowClause(spec.window)];
    if (spec.filterClause) {
        where.push(spec.filterClause);
    }
    return [
        `SELECT k.id AS anchorId, ${spec.aggregateSql} AS rawValue`,
        from.join("\n"),
        where.length ? `WHERE ${where.join(" AND ")}` : "",
        `GROUP BY k.id`,
    ]
        .filter((line) => line !== "")
        .join("\n");
}

/**
 * Serialize the population into the `@anchorKeys` JSON array OPENJSON consumes: each element is
 * `{ id, v0, v1, … }` — the canonical id (for GROUP BY + result-map key) plus the per-column key
 * values in primary-key order (for the JOIN). One parameter, regardless of population size.
 */
export function buildAnchorKeysJson(anchors: AnchorKey[]): string {
    return JSON.stringify(
        anchors.map((a) => {
            const row: Record<string, string | number> = { id: a.id };
            a.values.forEach((v, i) => {
                row[`v${i}`] = v;
            });
            return row;
        }),
    );
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
