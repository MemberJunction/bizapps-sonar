/**
 * Targeting on the MEMBER, not just on the score.
 *
 * A score says how disengaged someone is. It says nothing about whether now is the moment to act, or
 * whether this is even the kind of member you meant. Both of those live on the anchor record and have
 * been invisible to selection: tenure (`JoinDate`), dormancy (`LastActivityDate`), region (`State`),
 * segment (`Industry`, `Title`), experience (`YearsInProfession`). Without them a rule can only say
 * "these 319 are sliding", which is a report. With them it can say "the first-year members in Texas
 * who are sliding and haven't shown up in 90 days", which is a work list.
 *
 * Anchor entities are arbitrary (each model picks its own), so conditions are expressed against field
 * NAMES and compiled here against the entity's real field list. A named field that does not exist is
 * an ERROR, never a silently dropped condition: dropping one quietly widens the cohort, and a wider
 * cohort means contacting people the rule was written to exclude.
 *
 * Pure — no data access — so the field validation, the type rules, and the date arithmetic are all
 * unit-testable without a database.
 */

/** What a condition can ask. Dates are expressed in DAYS relative to now, because that is how urgency
 *  is actually spoken ("hasn't shown up in 90 days", "joined under a year ago"). */
export type AnchorOperator =
    | "eq"
    | "neq"
    | "in"
    | "notIn"
    | "gte"
    | "lte"
    | "isNull"
    | "isNotNull"
    /** Date within the last N days (recent). `LastActivityDate withinLastDays 30` = active lately. */
    | "withinLastDays"
    /** Date strictly before N days ago. `JoinDate olderThanDays 365` = a member for over a year;
     *  `LastActivityDate olderThanDays 90` = dormant for a quarter. Exclusive at the boundary so it
     *  and `withinLastDays` partition cleanly — see the note on {@link buildAnchorFilter}. */
    | "olderThanDays"
    /** Date between now and N days from now — the renewal-urgency shape. Included even though no
     *  demo anchor has a future-dated field, because it costs nothing and is what urgency needs. */
    | "withinNextDays";

export interface AnchorCondition {
    /** Field name on the model's anchor entity. Validated against the real field list. */
    field: string;
    op: AnchorOperator;
    /** Omitted for isNull/isNotNull. An array only for in/notIn. A number of DAYS for the date ops. */
    value?: string | number | readonly (string | number)[] | null;
}

/** The field types the compiler needs to tell apart, mapped from MJ's EntityFieldInfo.Type. */
export type AnchorFieldKind = "text" | "number" | "date" | "boolean" | "other";

/** Map an MJ SQL type name onto the kind the operator rules care about. */
export function anchorFieldKind(sqlType: string): AnchorFieldKind {
    const t = (sqlType || "").toLowerCase();
    if (/^(date|datetime|datetime2|smalldatetime|datetimeoffset|timestamp)/.test(t)) return "date";
    if (/^(int|bigint|smallint|tinyint|decimal|numeric|float|real|money|smallmoney)/.test(t)) return "number";
    if (/^(bit|boolean)/.test(t)) return "boolean";
    if (/(char|text)/.test(t)) return "text";
    return "other";
}

const DATE_OPS: readonly AnchorOperator[] = ["withinLastDays", "olderThanDays", "withinNextDays"];
const LIST_OPS: readonly AnchorOperator[] = ["in", "notIn"];
const NO_VALUE_OPS: readonly AnchorOperator[] = ["isNull", "isNotNull"];

/** Escape a string for a single-quoted SQL literal. */
function sqlText(v: string): string {
    return `'${String(v).replace(/'/g, "''")}'`;
}

/**
 * A date literal the provider will accept on either dialect. Computed here rather than with SQL date
 * functions so the fragment stays dialect-neutral (and so "now" is the caller's, hence testable).
 *
 * Careful: compared against a `date` COLUMN, SQL Server converts this literal to `date` and discards
 * the time. So the boundary effectively lands at midnight for date columns and at the exact instant for
 * datetime ones. That is why `olderThanDays` is strictly-before rather than at-or-before: with both
 * sides inclusive, a member whose date equalled the boundary DAY matched both it and `withinLastDays`,
 * putting one member in two cohorts that are documented as complements — and doing so only for date
 * columns, so it would not have shown up on a datetime field.
 */
function sqlDate(ms: number): string {
    return `'${new Date(ms).toISOString().slice(0, 19).replace("T", " ")}'`;
}

const DAY_MS = 86_400_000;

/** The result of compiling a rule's anchor conditions. */
export interface AnchorFilterResult {
    /** SQL fragment for the anchor entity's view, or "" when there was nothing to ask. */
    sql: string;
    /** Non-empty means the rule is INVALID and must not run — see the module note on why a bad
     *  condition can't be skipped. */
    errors: string[];
}

/**
 * Compile conditions into one SQL fragment against the anchor entity.
 *
 * `fields` is the anchor entity's real field list (name -> SQL type). Every named field must be in it.
 * `now` is injected so date arithmetic is deterministic in tests.
 */
export function buildAnchorFilter(
    conditions: readonly AnchorCondition[] | null | undefined,
    fields: ReadonlyMap<string, string>,
    now: number,
): AnchorFilterResult {
    if (!conditions || conditions.length === 0) return { sql: "", errors: [] };

    const errors: string[] = [];
    const clauses: string[] = [];
    // Case-insensitive field lookup that still emits the entity's OWN casing into the SQL.
    const canonical = new Map<string, string>();
    for (const name of fields.keys()) canonical.set(name.toLowerCase(), name);

    for (const c of conditions) {
        const real = canonical.get(String(c.field ?? "").toLowerCase());
        if (!real) {
            errors.push(`Unknown field '${c.field}' on the anchor entity.`);
            continue;
        }
        const kind = anchorFieldKind(fields.get(real) ?? "");
        const clause = compileOne(real, kind, c, now, errors);
        if (clause) clauses.push(clause);
    }
    return { sql: errors.length > 0 ? "" : clauses.join(" AND "), errors };
}

/** Compile one condition, pushing a message and returning null when it doesn't make sense. */
function compileOne(
    field: string,
    kind: AnchorFieldKind,
    c: AnchorCondition,
    now: number,
    errors: string[],
): string | null {
    const col = `[${field}]`;

    if (NO_VALUE_OPS.includes(c.op)) {
        return c.op === "isNull" ? `${col} IS NULL` : `${col} IS NOT NULL`;
    }

    if (DATE_OPS.includes(c.op)) {
        if (kind !== "date") {
            errors.push(`Field '${field}' is not a date, so '${c.op}' cannot apply to it.`);
            return null;
        }
        const days = Number(c.value);
        if (!Number.isFinite(days) || days < 0) {
            errors.push(`'${c.op}' on '${field}' needs a non-negative number of days.`);
            return null;
        }
        const offset = days * DAY_MS;
        if (c.op === "withinLastDays") return `${col} >= ${sqlDate(now - offset)}`;
        // Strictly before: see sqlDate's note on why this side must be exclusive.
        if (c.op === "olderThanDays") return `${col} < ${sqlDate(now - offset)}`;
        return `${col} >= ${sqlDate(now)} AND ${col} <= ${sqlDate(now + offset)}`;
    }

    if (LIST_OPS.includes(c.op)) {
        const raw = Array.isArray(c.value) ? c.value : [c.value];
        const list = raw.filter((v) => v !== null && v !== undefined && v !== "");
        if (list.length === 0) {
            errors.push(`'${c.op}' on '${field}' needs at least one value.`);
            return null;
        }
        const rendered = list.map((v) => (kind === "number" ? renderNumber(v, field, errors) : sqlText(String(v))));
        if (rendered.some((r) => r === null)) return null;
        return `${col} ${c.op === "in" ? "IN" : "NOT IN"} (${rendered.join(",")})`;
    }

    // eq / neq / gte / lte
    if (c.value === null || c.value === undefined) {
        errors.push(`'${c.op}' on '${field}' needs a value (use isNull/isNotNull to test for empty).`);
        return null;
    }
    if (Array.isArray(c.value)) {
        errors.push(`'${c.op}' on '${field}' takes a single value, not a list (use in/notIn).`);
        return null;
    }
    const op = c.op === "eq" ? "=" : c.op === "neq" ? "<>" : c.op === "gte" ? ">=" : "<=";
    if (kind === "number") {
        const n = renderNumber(c.value, field, errors);
        return n === null ? null : `${col} ${op} ${n}`;
    }
    if (kind === "date") {
        const ms = Date.parse(String(c.value));
        if (!Number.isFinite(ms)) {
            errors.push(`'${c.value}' is not a date that '${field}' can be compared against.`);
            return null;
        }
        return `${col} ${op} ${sqlDate(ms)}`;
    }
    if (kind === "boolean") {
        const b = String(c.value).toLowerCase();
        if (b !== "true" && b !== "false" && b !== "0" && b !== "1") {
            errors.push(`'${c.value}' is not a true/false value for '${field}'.`);
            return null;
        }
        return `${col} ${op} ${b === "true" || b === "1" ? 1 : 0}`;
    }
    // Ordering text is legal in SQL but almost always a mistake in a targeting rule.
    if (c.op === "gte" || c.op === "lte") {
        errors.push(`'${c.op}' on the text field '${field}' isn't meaningful; use eq/neq/in.`);
        return null;
    }
    return `${col} ${op} ${sqlText(String(c.value))}`;
}

/** A finite number literal, or null (with a message) when the value isn't one. */
function renderNumber(v: unknown, field: string, errors: string[]): string | null {
    const n = Number(v);
    if (!Number.isFinite(n)) {
        errors.push(`'${String(v)}' is not a number for '${field}'.`);
        return null;
    }
    return String(n);
}

/** Field names a rule needs read back for ranking (urgency/value), deduped and validated the same
 *  way conditions are. Unknown names are dropped here rather than raised: ranking degrades to the
 *  terms it can compute, whereas a dropped FILTER would silently change who is in the cohort. */
export function validRankFields(
    names: readonly (string | null | undefined)[],
    fields: ReadonlyMap<string, string>,
): string[] {
    const canonical = new Map<string, string>();
    for (const name of fields.keys()) canonical.set(name.toLowerCase(), name);
    const out = new Set<string>();
    for (const n of names) {
        const real = n ? canonical.get(String(n).toLowerCase()) : undefined;
        if (real) out.add(real);
    }
    return [...out];
}
