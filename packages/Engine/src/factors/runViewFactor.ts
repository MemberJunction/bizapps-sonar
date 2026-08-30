import type { FactorResult } from "../contracts/IFactorEvaluator";
import type { AnchorKey } from "./anchorKey";
import type { CompiledWindow } from "./factorSql";

/**
 * The pure half of the RunView-backed factor path: window bounds, per-anchor grouping, and the
 * in-memory aggregations. No I/O, so every semantic here is unit-testable against the SQL it mirrors.
 *
 * ## Why this exists
 *
 * The declarative path compiles a factor to one set-based `SELECT` executed through
 * `provider.ExecuteSQL`. Raw SQL applies neither entity permissions nor Row-Level Security — the one
 * thing a raw read genuinely bypasses. `RunView` applies both, so this path trades the database's
 * `GROUP BY` for reading the measure rows and folding them here.
 *
 * ## Parity is the whole job
 *
 * Every function below mirrors a specific piece of `factorSql.ts`. Where SQL and JavaScript disagree
 * by default, SQL wins, because the compiled path is the incumbent and a silent divergence would
 * move real members' scores:
 *
 *  - `AVG` over an empty set is NULL, not 0 (JS `reduce` with seed 0 would give 0).
 *  - `SUM`/`AVG`/`MIN`/`MAX`/`DistinctCount` IGNORE NULLs in the aggregated column.
 *  - `COUNT(*)` counts rows, including rows whose aggregate column is NULL.
 *  - An anchor with no rows in scope is absent from the result entirely (→ `hadData: false`), which
 *    is what hands it to the model's MissingDataPolicy. It is NOT a zero.
 */

/**
 * Aggregations this path implements.
 *
 * `RatePerPeriod`/`TrendSlope` are unimplemented in BOTH paths. `Recency` is implemented in the
 * compiled path only: it is `DATEDIFF(day, MAX(date), asOf)` over naive datetimes, and the driver
 * materializes `datetime` columns in local time while `datetime2` comes back as UTC — so computing the
 * day difference here means replicating that per-column-type conversion. Measured against live data it
 * was off by the local UTC offset on boundary rows, so it stays on the compiled path.
 */
export type SupportedAggregation =
    | "Count"
    | "Exists"
    | "DistinctCount"
    | "Sum"
    | "Avg"
    | "Min"
    | "Max";

const SUPPORTED: readonly string[] = [
    "Count",
    "Exists",
    "DistinctCount",
    "Sum",
    "Avg",
    "Min",
    "Max",
];

/** True when this path can evaluate the aggregation — the selector's gate. */
export function isSupportedAggregation(aggregation: string | null): aggregation is SupportedAggregation {
    return !!aggregation && SUPPORTED.includes(aggregation);
}

/**
 * A window this path can resolve WITHOUT reading a per-anchor boundary date. `SinceEvent` and
 * `RenewalRelative` read a date column off the anchor row, so they need an extra anchor read and are
 * excluded from the first slice — the selector routes them to the compiled path.
 */
export type PopulationWindow =
    | { kind: "Rolling"; dateField: string; lengthDays: number | null; lengthMonths: number | null }
    | { kind: "Calendar"; dateField: string; period: "month" | "quarter" | "year" };

/** Inclusive-exclusive date bounds. `start === null` means unbounded (AllTime / no window). */
export interface WindowBounds {
    /** Exclusive lower bound, mirroring the compiled path's `(asOf − length, asOf]`. Null = unbounded. */
    start: Date | null;
    /** Inclusive upper bound — always `asOf`. */
    end: Date;
}

/**
 * Resolve a window to concrete date bounds.
 *
 * Rolling mirrors the SQL `(asOf − length, asOf]`: the lower bound is EXCLUSIVE. Months are handled
 * by calendar arithmetic (`setMonth`) rather than 30-day approximation, matching `DATEADD(month, …)`.
 *
 * Calendar takes the start of the period CONTAINING asOf, and that bound is INCLUSIVE — a row stamped
 * exactly at midnight on the 1st is inside "this month". The two differ deliberately; {@link
 * sqlWindowPredicate} emits `>` vs `>=` accordingly.
 */
export function resolveWindowBounds(window: PopulationWindow | null, asOf: Date): WindowBounds {
    if (!window) return { start: null, end: asOf };

    if (window.kind === "Rolling") {
        if (window.lengthMonths != null) {
            return { start: subtractMonthsClamped(asOf, window.lengthMonths), end: asOf };
        }
        if (window.lengthDays != null) {
            return { start: new Date(asOf.getTime() - window.lengthDays * 86_400_000), end: asOf };
        }
        // A Rolling window with neither length is a config error, not "unbounded" — treating it as
        // AllTime would silently widen every score rather than surfacing the bad row.
        throw new Error("resolveWindowBounds: Rolling window has neither lengthDays nor lengthMonths.");
    }

    const start = new Date(asOf.getTime());
    start.setHours(0, 0, 0, 0);
    switch (window.period) {
        case "month":
            start.setDate(1);
            break;
        case "quarter":
            start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1);
            break;
        case "year":
            start.setMonth(0, 1);
            break;
    }
    return { start, end: asOf };
}

/**
 * `asOf` minus N months, clamping the day to the target month's last day — T-SQL `DATEADD(month, …)`
 * semantics.
 *
 * A naive `setMonth(getMonth() - 1)` on 31 July asks for 31 June, which JavaScript OVERFLOWS to
 * 1 July — a window one day long instead of one month, silently. `DATEADD` clamps to 30 June instead,
 * so we do too. Caught by unit test, not by review.
 */
function subtractMonthsClamped(asOf: Date, months: number): Date {
    const day = asOf.getDate();
    const start = new Date(asOf.getTime());
    // Move to the 1st first, so changing the month can never overflow into the next one.
    start.setDate(1);
    start.setMonth(start.getMonth() - months);
    // Day 0 of the following month is the last day of this one.
    const lastDayOfTarget = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    start.setDate(Math.min(day, lastDayOfTarget));
    return start;
}

/** Coerce a RunView cell to a Date, or null when it isn't one. */
function toDate(value: unknown): Date | null {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value === "string" || typeof value === "number") {
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
}

/** Coerce a RunView cell to a finite number, or null. Mirrors SQL ignoring NULLs in aggregates. */
function toNumber(value: unknown): number | null {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value === "string" && value.trim() !== "") {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }
    if (value instanceof Date) return value.getTime();
    return null;
}

/**
 * Fold one anchor's in-window rows into its raw value. Returns `null` for "no value", which the
 * caller turns into `hadData: false`.
 *
 * Mirrors {@link buildAggregateExpression} case for case.
 */
export function aggregateRows(
    aggregation: SupportedAggregation,
    aggregateField: string | null,
    rows: Record<string, unknown>[],
    asOf: Date,
): number | null {
    if (aggregation === "Count") return rows.length;
    // COUNT(*) > 0 — anchors with no rows never reach here, so this is always 1 in practice; kept
    // explicit so the mapping is total and matches the SQL CASE.
    if (aggregation === "Exists") return rows.length > 0 ? 1 : 0;

    if (!aggregateField) {
        throw new Error(`aggregateRows: aggregation '${aggregation}' requires an AggregateFieldName.`);
    }


    if (aggregation === "DistinctCount") {
        const seen = new Set<string>();
        for (const row of rows) {
            const v = row[aggregateField];
            if (v === null || v === undefined) continue; // COUNT(DISTINCT col) ignores NULLs
            seen.add(v instanceof Date ? String(v.getTime()) : String(v));
        }
        return seen.size;
    }

    // Sum / Avg / Min / Max — NULLs excluded, and an all-NULL (or empty) set yields NULL, not 0.
    const values: number[] = [];
    for (const row of rows) {
        const n = toNumber(row[aggregateField]);
        if (n !== null) values.push(n);
    }
    if (values.length === 0) return null;

    switch (aggregation) {
        case "Sum":
            return values.reduce((a, b) => a + b, 0);
        case "Avg":
            return values.reduce((a, b) => a + b, 0) / values.length;
        case "Min":
            return Math.min(...values);
        case "Max":
            return Math.max(...values);
    }
}

/** Calendar-day boundaries crossed between two instants — T-SQL `DATEDIFF(day, a, b)` semantics. */
function dayDifference(fromMs: number, toMs: number): number {
    const a = new Date(fromMs);
    const b = new Date(toMs);
    a.setHours(0, 0, 0, 0);
    b.setHours(0, 0, 0, 0);
    return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/**
 * Group measure rows by the anchor they belong to, keyed to match {@link AnchorKey.id}.
 *
 * `fkFields` are the FK field names on the measure entity pointing at the anchor's primary-key
 * columns, in anchor primary-key order — so a composite anchor's key is assembled in the same order
 * `canonicalAnchorId` uses. Rows whose FK is null belong to no anchor and are dropped.
 *
 * Keys are compared case-insensitively via {@link normalizeAnchorId} because SQL Server returns
 * uppercase GUIDs while values arriving from elsewhere may not — a case mismatch here would silently
 * report every anchor as having no data.
 */
export function groupRowsByAnchor(
    rows: Record<string, unknown>[],
    fkFields: string[],
): Map<string, Record<string, unknown>[]> {
    const byAnchor = new Map<string, Record<string, unknown>[]>();
    for (const row of rows) {
        const parts: string[] = [];
        let usable = true;
        for (const field of fkFields) {
            const v = row[field];
            if (v === null || v === undefined) {
                usable = false;
                break;
            }
            parts.push(String(v));
        }
        if (!usable) continue;
        const key = normalizeAnchorId(fkFields.length === 1 ? parts[0] : parts.join("|"));
        const list = byAnchor.get(key);
        if (list) list.push(row);
        else byAnchor.set(key, [row]);
    }
    return byAnchor;
}

/** Case-folded anchor id, so GUID casing never causes a silent no-match. */
export function normalizeAnchorId(id: string): string {
    return id.toUpperCase();
}

/** What {@link foldRowsToResults} needs to know about the factor. */
export interface RunViewFoldSpec {
    factorId: string;
    aggregation: SupportedAggregation;
    aggregateField: string | null;
    /** FK field names on the measure entity, in anchor primary-key order. */
    fkFields: string[];
    window: PopulationWindow | null;
    /** Human-readable factor name for the explanation text. */
    factorName: string;
    /** Measure entity name, for the explanation text. */
    sourceEntityName: string;
}

/**
 * Fold raw measure rows into per-anchor {@link FactorResult}s.
 *
 * Anchors present in `anchors` but with no in-window rows are OMITTED from the result — the contract
 * says an anchor with no entry produced no data, and that is what routes it to the MissingDataPolicy.
 * Emitting a zero instead would turn "no data on file" into "genuinely disengaged", which are scored
 * differently.
 */
export function foldRowsToResults(
    spec: RunViewFoldSpec,
    anchors: AnchorKey[],
    rows: Record<string, unknown>[],
    asOf: Date,
): Map<string, FactorResult> {
    // NO date filtering here. The window is applied by the DATABASE, via the window predicate this
    // path puts in RunView's ExtraFilter (see sqlWindowPredicate). That is deliberate: the driver
    // materializes `datetime` columns in local time and `datetime2` in UTC, so a JS comparison against
    // a JS boundary silently disagreed with the compiled path on rows sitting exactly on the bound.
    // Letting the database compare naive-to-naive makes the two paths agree by construction.
    const grouped = groupRowsByAnchor(rows, spec.fkFields);
    const results = new Map<string, FactorResult>();

    for (const anchor of anchors) {
        const anchorRows = grouped.get(normalizeAnchorId(anchor.id));
        if (!anchorRows || anchorRows.length === 0) continue; // no data → omitted, not zero

        const rawValue = aggregateRows(spec.aggregation, spec.aggregateField, anchorRows, asOf);
        if (rawValue === null) continue; // aggregate yielded NULL (e.g. all-NULL Sum) → no data

        results.set(anchor.id, {
            rawValue,
            normalizedContribution: null, // filled in later by the NormalizationEngine
            hadData: true,
            explanation: describeFold(spec, anchorRows.length, rawValue),
        });
    }
    return results;
}

/** The explainability line for one anchor's value. */
function describeFold(spec: RunViewFoldSpec, rowCount: number, rawValue: number): string {
    const scope = describeWindow(spec.window);
    switch (spec.aggregation) {
        case "Count":
            return `${rawValue} ${spec.sourceEntityName} record(s)${scope}`;
        case "Exists":
            return `has at least one ${spec.sourceEntityName} record${scope}`;
        case "DistinctCount":
            return `${rawValue} distinct ${spec.aggregateField}${scope} across ${rowCount} record(s)`;
        default:
            return `${spec.aggregation} of ${spec.aggregateField} = ${rawValue}${scope} across ${rowCount} record(s)`;
    }
}

/** Window phrasing for explanations — mirrors the compiled path's wording. */
function describeWindow(window: PopulationWindow | null): string {
    if (!window) return "";
    if (window.kind === "Calendar") return ` this ${window.period}`;
    return window.lengthMonths != null
        ? ` in the last ${window.lengthMonths} months`
        : ` in the last ${window.lengthDays} days`;
}

/**
 * Narrow an already-resolved {@link CompiledWindow} to the population-resolvable subset this path
 * handles. Returns null for AllTime.
 *
 * `dateColumn` on the compiled side is an EntityField name (the compiler validates it against
 * `leafEntity.Fields`), so it carries straight over as `dateField` — no translation needed.
 *
 * Throws on the per-anchor kinds. That is unreachable via {@link runViewIneligibilityReason}, which
 * excludes them; the throw is here so a future caller that skips the eligibility check fails loudly
 * instead of silently dropping the window and widening every score.
 */
export function toPopulationWindow(window: CompiledWindow | null): PopulationWindow | null {
    if (!window) return null;
    switch (window.kind) {
        case "Rolling":
            return {
                kind: "Rolling",
                dateField: window.dateColumn,
                lengthDays: window.lengthDays,
                lengthMonths: window.lengthMonths,
            };
        case "Calendar":
            return { kind: "Calendar", dateField: window.dateColumn, period: window.period };
        default:
            throw new Error(
                `toPopulationWindow: '${window.kind}' reads a per-anchor boundary date and is not ` +
                    `supported on the RunView path — check eligibility before calling.`,
            );
    }
}

/**
 * Format an instant as a naive SQL datetime literal using its UTC components.
 *
 * "Naive" is the point: the columns these are compared against are `datetime`/`datetime2` with no
 * timezone, and SQL compares them literally. Using UTC components means the literal we emit equals
 * the value the compiled path's `DATEADD(day, -N, @asOf)` produces, so both paths bound the window
 * identically.
 */
export function toNaiveSqlLiteral(d: Date): string {
    const p = (n: number, w = 2) => String(n).padStart(w, "0");
    return (
        `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ` +
        `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}.${p(d.getUTCMilliseconds(), 3)}`
    );
}

/**
 * The window as a SQL predicate for RunView's `ExtraFilter`, or null when there is nothing to bound.
 *
 * Mirrors the compiled path exactly: Rolling is `(start, asOf]` with an EXCLUSIVE lower bound,
 * Calendar is `[start, asOf]` with an inclusive one, and every window is capped at `asOf` so a
 * historical recompute never counts later activity. AllTime emits only the `asOf` cap.
 */
export function sqlWindowPredicate(window: PopulationWindow | null, asOf: Date): string | null {
    const cap = window ? `[${window.dateField}] <= '${toNaiveSqlLiteral(asOf)}'` : null;
    if (!window) return null;
    const bounds = resolveWindowBounds(window, asOf);
    if (bounds.start === null) return cap;
    const op = window.kind === "Calendar" ? ">=" : ">";
    return `[${window.dateField}] ${op} '${toNaiveSqlLiteral(bounds.start)}' AND ${cap}`;
}

/** What the RunView path needs to be true of a factor before it can evaluate it. */
export interface RunViewEligibilityInput {
    aggregation: string | null;
    /** Number of intermediate JOINs the compiled path resolved. >0 means multi-hop. */
    joinCount: number;
    /** Number of anchor FK columns. >1 means a composite anchor key. */
    anchorKeyColumnCount: number;
    /** The compiled window's discriminator, or null for AllTime / no window. */
    windowKind: "Rolling" | "Calendar" | "SinceEvent" | "RenewalRelative" | null;
    /** Whether the factor carries a FilterExpression. */
    hasFilterExpression: boolean;
}

/**
 * Why a factor can't use the RunView path, or `null` when it can.
 *
 * A nullable reason rather than a discriminated union: the caller both branches AND logs the reason,
 * and a plain string needs no narrowing to do either.
 */
export type RunViewIneligibility = string | null;

/**
 * Can this factor be evaluated through {@link RunViewFactorEvaluator}?
 *
 * Every exclusion is a capability gap in this slice, not a preference, and each falls back to the
 * compiled evaluator:
 *
 *  - **Multi-hop** — `RunView` cannot join, so a path like EmailClick → EmailSend → Member needs one
 *    read per hop plus an in-memory join.
 *  - **Composite anchor key** — the FK tuple needs filtering as column pairs, not one `IN` list.
 *  - **Per-anchor windows** — `SinceEvent`/`RenewalRelative` read a boundary date off the anchor row,
 *    so they need an extra read of the anchor entity.
 *  - **FilterExpression** — the compiled path produces a PARAMETERIZED clause, and RunView's
 *    `ExtraFilter` takes no parameters. Inlining the values would reintroduce exactly the
 *    string-interpolation surface this path exists to reduce, so these stay on the compiled path
 *    until the filter can be handed over without flattening its parameters.
 *  - **Unsupported aggregation** — `RatePerPeriod`/`TrendSlope` are unimplemented in BOTH paths.
 */
export function runViewIneligibilityReason(input: RunViewEligibilityInput): RunViewIneligibility {
    if (!isSupportedAggregation(input.aggregation)) {
        return `aggregation '${input.aggregation ?? "none"}' is not supported`;
    }
    if (input.joinCount > 0) {
        return `multi-hop path (${input.joinCount} join(s)) — RunView cannot join`;
    }
    if (input.anchorKeyColumnCount > 1) {
        return `composite anchor key (${input.anchorKeyColumnCount} columns)`;
    }
    if (input.windowKind === "SinceEvent" || input.windowKind === "RenewalRelative") {
        return `per-anchor window '${input.windowKind}' needs an anchor read`;
    }
    if (input.hasFilterExpression) {
        return "FilterExpression is parameterized and ExtraFilter takes no parameters";
    }
    return null;
}
