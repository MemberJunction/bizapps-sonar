/**
 * Strict GUID validation for values interpolated into RunView ExtraFilter strings.
 *
 * MJ does NOT parameterize ExtraFilter, so every id spliced into a filter is an injection surface.
 * The publish-lock guards run BEFORE super.Save() — i.e. before the DB ever gets a chance to reject
 * a non-uniqueidentifier FK — which makes a crafted ScoreModelID/BandSetID string a server-side SQL
 * injection primitive unless it is validated here first. Mirrors SonarActionBase.isGuid (canonical
 * 8-4-4-4-12 hex; unlike a loose char-class, it won't pass junk like all-dashes).
 */

const GUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/** True when the value is a canonical 8-4-4-4-12 hex GUID. */
export function IsGuid(value: string | null | undefined): boolean {
    return value != null && GUID_PATTERN.test(value);
}

/**
 * Return the value verbatim when it is a valid GUID; throw (naming the offending field) otherwise.
 * Use at interpolation sites where a non-GUID is a programming error to fail loudly on, rather than
 * a state to absorb — callers that can degrade gracefully should branch on {@link IsGuid} instead.
 */
export function SqlGuid(value: string, field: string): string {
    if (!GUID_PATTERN.test(value)) {
        throw new Error(`${field} '${value}' is not a valid GUID and cannot be used in a SQL filter.`);
    }
    return value;
}
