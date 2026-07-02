import { CompositeKey, EntityInfo } from "@memberjunction/core";

/**
 * Anchor-record identity for the scoring pipeline, built on MJ's `CompositeKey` (the platform's
 * standard multi-column record-identity type). One `AnchorKey` is the engine's handle on a single
 * scored record, in three forms the pipeline needs:
 *
 *  - `id`     — a collision-safe canonical string: the `Map<string, …>` key threaded through the
 *               evaluators/scoring AND the persisted `Score.AnchorRecordID`. Single-column anchors
 *               keep the bare value (back-compat with every existing single-PK score); composite
 *               anchors get an escaped, ordered join so two different tuples can never collide.
 *  - `json`   — `JSON.stringify` of the CompositeKey pairs: the type- and order-faithful structured
 *               key persisted to `Score.AnchorRecordKeyJSON` and the authoritative round-trip source
 *               (a number stays a number; column order is preserved).
 *  - `values` — the per-PK-column values in anchor primary-key order, fed into the OPENJSON tuples
 *               so the set-based query can JOIN on a single- OR multi-column key uniformly.
 *
 * Why not just use `CompositeKey.ToConcatenatedString()`: MJ's built-in serializer neither escapes
 * its delimiter nor preserves value type, so it can collide on string PKs containing the delimiter
 * and reloads ints as strings. We stand on `CompositeKey` for identity but serialize `id`/`json`
 * ourselves to meet those guarantees.
 */
export interface AnchorKey {
    id: string;
    json: string;
    values: (string | number)[];
}

/** Delimiter + escape char for the multi-column canonical id (chosen to be escapable). */
const DELIM = "|";
const ESCAPE = "\\";

/** Escape the delimiter (and the escape char itself) so distinct tuples never serialize alike. */
function escapeSegment(value: string): string {
    return value.split(ESCAPE).join(ESCAPE + ESCAPE).split(DELIM).join(ESCAPE + DELIM);
}

/**
 * The canonical `AnchorRecordID`. Single-column → the bare value (so existing single-PK scores keep
 * the exact same id). Multi-column → each value escaped, joined in primary-key order — collision-free
 * and parseable.
 */
export function canonicalAnchorId(key: CompositeKey): string {
    const pairs = key.KeyValuePairs;
    if (pairs.length === 1) {
        return String(pairs[0].Value);
    }
    return pairs.map((p) => escapeSegment(String(p.Value))).join(DELIM);
}

/** Build the engine's AnchorKey (id + structured json + ordered values) from an MJ CompositeKey. */
export function toAnchorKey(key: CompositeKey): AnchorKey {
    return {
        id: canonicalAnchorId(key),
        json: JSON.stringify(key.KeyValuePairs),
        values: key.KeyValuePairs.map((p) => p.Value as string | number),
    };
}

/**
 * Build an MJ CompositeKey for an anchor record from the entity's primary-key columns + a row
 * (a RunView 'simple' result). Pairs are ordered by `entity.PrimaryKeys` so id/json/values all
 * agree on column order with the compiled spec's FK columns.
 */
export function compositeKeyForRow(
    entity: EntityInfo,
    row: Record<string, unknown>,
): CompositeKey {
    return CompositeKey.FromKeyValuePairs(
        entity.PrimaryKeys.map((pk) => ({ FieldName: pk.Name, Value: row[pk.Name] })),
    );
}
