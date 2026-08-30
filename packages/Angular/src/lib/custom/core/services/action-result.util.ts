/**
 * Shared parsing for MJ Action output params. MJ's RunAction returns output params (those marked
 * Type 'Both') via GraphQL `ResultData`, surfaced as `result.Result` — either a JSON array
 * `[{ Name, Value }]` or an index-keyed object `{ "0": { Name, Value } }`. Both the engine and the
 * catalog services need to pull values out of that, so the normalization lives here once.
 */

/** Normalize `result.Result` (array OR index-keyed object) into a flat list of name/value params. */
function paramEntries(result: { Result?: unknown }): Array<{ Name?: string; Value?: unknown }> {
    const data = result.Result;
    if (data == null) return [];
    return (Array.isArray(data) ? data : typeof data === "object" ? Object.values(data) : []) as Array<{
        Name?: string;
        Value?: unknown;
    }>;
}

/** Pull the `Result` output param and JSON-parse it into T (falls back to the raw payload). */
export function extractActionResult<T>(result: { Result?: unknown }): T | null {
    const param = paramEntries(result).find((p) => p && typeof p === "object" && p.Name === "Result");
    const raw: unknown = param ? param.Value : result.Result;
    if (raw == null) return null;
    return (typeof raw === "string" ? JSON.parse(raw) : raw) as T;
}

/** Pull a single named output param's raw value (e.g. a factor-action's "Value" / "Explanation"). */
export function extractActionParam(result: { Result?: unknown }, name: string): unknown {
    return paramEntries(result).find((p) => p && typeof p === "object" && p.Name === name)?.Value ?? null;
}
