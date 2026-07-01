/**
 * Kendo-compatible filter descriptors — the same shape MJ stores in UserView.FilterState
 * and that the Angular filter-builder UI emits. We re-declare the types here (rather than
 * depend on the UI package) so the engine stays server-only. `compileFilter` turns this
 * data into a PARAMETERIZED SQL WHERE fragment — values never touch the SQL string, which
 * is our injection-safety upgrade over MJ's inline GenerateWhereClause.
 */

export type FilterLogic = "and" | "or";

export type FilterOperator =
    | "eq"
    | "neq"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "contains"
    | "doesnotcontain"
    | "startswith"
    | "endswith"
    | "isnull"
    | "isnotnull"
    | "isempty"
    | "isnotempty";

/** A filter value as it arrives from JSON (dates come through as ISO strings). */
export type FilterValue = string | number | boolean | null;

/** A single leaf condition: compare one column to a value. */
export interface FilterDescriptor {
    field: string;
    operator: FilterOperator;
    value?: FilterValue;
}

/** A group of conditions combined with and/or; nestable to any depth. */
export interface CompositeFilterDescriptor {
    logic: FilterLogic;
    filters: Array<FilterDescriptor | CompositeFilterDescriptor>;
}

/** The output of compiling a filter: a WHERE fragment plus the parameters it references. */
export interface CompiledFilter {
    /** Parenthesized WHERE fragment, or null when there is no filter. */
    clause: string | null;
    /** Parameter name → value, passed to ExecuteSQL alongside @asOf. */
    params: Record<string, FilterValue>;
}

const COMPARISON_SQL: Record<string, string> = {
    eq: "=",
    neq: "<>",
    gt: ">",
    gte: ">=",
    lt: "<",
    lte: "<=",
};
const NULL_OPERATORS = new Set(["isnull", "isnotnull", "isempty", "isnotempty"]);
const LIKE_OPERATORS = new Set([
    "contains",
    "doesnotcontain",
    "startswith",
    "endswith",
]);

/** Mutable accumulator threaded through the recursive walk so parameter names stay unique. */
interface BuildContext {
    validColumns: string[];
    params: Record<string, FilterValue>;
    counter: { next: number };
}

/**
 * Compile a Kendo filter tree into a parameterized WHERE fragment. Every field is validated
 * against the related entity's real columns (typo + injection guard) and every value is
 * parameterized. Returns a null clause when there is no filter.
 */
export function compileFilter(
    filter: CompositeFilterDescriptor | null,
    validColumns: string[],
): CompiledFilter {
    if (!filter) {
        return { clause: null, params: {} };
    }
    // Fail loud on a malformed descriptor (valid JSON but wrong shape) instead of crashing with a
    // cryptic TypeError on `.filters.length` deeper in.
    if (!Array.isArray(filter.filters)) {
        throw new Error("compileFilter: filter must have a 'filters' array.");
    }
    if (filter.filters.length === 0) {
        return { clause: null, params: {} };
    }
    const ctx: BuildContext = { validColumns, params: {}, counter: { next: 0 } };
    return { clause: buildGroup(filter, ctx), params: ctx.params };
}

/**
 * Compile a filter to an INLINE WHERE string (escaped literals, no parameters). Use this only
 * where parameter binding isn't available — e.g. RunView.ExtraFilter; prefer `compileFilter` +
 * params for set-based SQL. Field names are still validated by `compileFilter`; values are
 * escaped here (strings single-quoted with doubled quotes, booleans as 1/0). Returns null when
 * there is no filter.
 */
export function compileFilterInline(
    filter: CompositeFilterDescriptor | null,
    validColumns: string[],
): string | null {
    const { clause, params } = compileFilter(filter, validColumns);
    if (!clause) {
        return null;
    }
    return clause.replace(/@f\d+/g, (placeholder) =>
        sqlLiteral(params[placeholder.slice(1)]),
    );
}

/** Render a filter value as an escaped SQL literal for inline use. */
function sqlLiteral(value: FilterValue | undefined): string {
    if (value === null || value === undefined) {
        return "NULL";
    }
    if (typeof value === "number") {
        if (!Number.isFinite(value)) {
            throw new Error(`compileFilter: numeric filter value must be finite (got ${value}).`);
        }
        return String(value);
    }
    if (typeof value === "boolean") {
        return value ? "1" : "0";
    }
    return `'${String(value).replace(/'/g, "''")}'`;
}

function isComposite(
    node: FilterDescriptor | CompositeFilterDescriptor,
): node is CompositeFilterDescriptor {
    return "logic" in node && "filters" in node;
}

/** Combine a group's children with AND/OR, wrapped in parentheses to preserve precedence. */
function buildGroup(group: CompositeFilterDescriptor, ctx: BuildContext): string {
    if (group.filters.length === 0) {
        throw new Error("compileFilter: empty filter group.");
    }
    const parts = group.filters.map((node) =>
        isComposite(node) ? buildGroup(node, ctx) : buildLeaf(node, ctx),
    );
    const joiner = group.logic === "or" ? " OR " : " AND ";
    return `(${parts.join(joiner)})`;
}

/** Translate one leaf condition into a SQL predicate, registering any parameter it needs. */
function buildLeaf(leaf: FilterDescriptor, ctx: BuildContext): string {
    const column = `[${requireColumn(leaf.field, ctx.validColumns)}]`;

    if (NULL_OPERATORS.has(leaf.operator)) {
        const negated =
            leaf.operator === "isnotnull" || leaf.operator === "isnotempty";
        return `${column} IS ${negated ? "NOT " : ""}NULL`;
    }

    if (LIKE_OPERATORS.has(leaf.operator)) {
        const param = addParam(ctx, likePattern(leaf));
        const not = leaf.operator === "doesnotcontain" ? "NOT " : "";
        return `${column} ${not}LIKE ${param}`;
    }

    const sqlOp = COMPARISON_SQL[leaf.operator];
    if (!sqlOp) {
        throw new Error(
            `compileFilter: unsupported operator '${leaf.operator}'.`,
        );
    }
    return `${column} ${sqlOp} ${addParam(ctx, requireValue(leaf))}`;
}

/** Register a value as the next @fN parameter and return its placeholder. */
function addParam(ctx: BuildContext, value: FilterValue): string {
    const name = `f${ctx.counter.next++}`;
    ctx.params[name] = value;
    return `@${name}`;
}

/** Resolve a field name to a real column (case-insensitive), preserving canonical casing. */
function requireColumn(field: string, validColumns: string[]): string {
    const match = validColumns.find(
        (c) => c.toLowerCase() === field.toLowerCase(),
    );
    if (!match) {
        throw new Error(
            `compileFilter: field '${field}' is not a column on the related entity.`,
        );
    }
    return match;
}

/** A value-taking operator must have a non-null value. */
function requireValue(leaf: FilterDescriptor): FilterValue {
    if (leaf.value === undefined || leaf.value === null) {
        throw new Error(
            `compileFilter: operator '${leaf.operator}' on '${leaf.field}' requires a value.`,
        );
    }
    return leaf.value;
}

/** Build the LIKE pattern string (the wildcards live in the parameter value, not the SQL). */
function likePattern(leaf: FilterDescriptor): string {
    const value = requireValue(leaf);
    if (typeof value !== "string") {
        throw new Error(
            `compileFilter: operator '${leaf.operator}' on '${leaf.field}' requires a string value.`,
        );
    }
    switch (leaf.operator) {
        case "startswith":
            return `${value}%`;
        case "endswith":
            return `%${value}`;
        default: // contains / doesnotcontain
            return `%${value}%`;
    }
}
