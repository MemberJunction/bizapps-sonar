/**
 * Escape a value for safe interpolation into a single-quoted SQL literal inside a RunView
 * `ExtraFilter`. `RunView.ExtraFilter` is raw SQL — MJ does not parameterize it — so every id spliced
 * into a filter must have embedded quotes doubled.
 *
 * Client-side mirror of the server `SonarActionBase.sqlString`. Severity is lower here (ids come from
 * the app's own bound data, within the user's permission scope — not free-text agent input), but it's
 * a real correctness fix, not just a consistency nit: with composite anchor keys, `AnchorRecordID`
 * can be a canonical id derived from a string PK that contains a `'` (e.g. `O'Brien-key`), which would
 * otherwise break the query on legitimate data. Apply to every id interpolated into an ExtraFilter.
 */
export function sqlString(value: string | number): string {
    return String(value).replace(/'/g, "''");
}
