/**
 * Client-side entity scoping for the anchor and factor-source pickers.
 *
 * Mirrors the scoring engine's `entityScope.ts` so the UI offers exactly the entities the engine
 * and the agent's "Find Entities" / "List Related Entities" actions consider scoreable. The engine
 * package is server-only (its barrel pulls in SQLServerDataProvider), so it can't be imported into
 * the browser bundle — hence this small, deliberate mirror, same as `entity-graph.ts`.
 * Keep the two in sync; `packages/Engine/src/metadata/entityScope.ts` is the source of truth.
 *
 * Note the exclusion is an EXACT schema match, not a `__mj` prefix test. Other MJ business apps
 * live under `__mj_BizApps*` (Committees, Common, …) and are perfectly good anchors and factor
 * sources; a prefix test would silently hide all of them.
 */

/** Schemas that hold framework/Sonar plumbing, not scoreable business data. */
export const NON_BUSINESS_SCHEMAS: readonly string[] = ["__mj", "__mj_BizAppsSonar"];

/** True when `schemaName` is a real business schema (not MJ core, not Sonar's own schema). */
export function IsBusinessSchema(schemaName: string | null | undefined): boolean {
    if (!schemaName) return false;
    return !NON_BUSINESS_SCHEMAS.includes(schemaName);
}

/** The minimal entity shape this module reasons about (a structural subset of MJ's EntityInfo). */
export interface ScopableEntity {
    SchemaName?: string | null;
}

/** True when an entity is a candidate anchor/source — i.e. it lives in a business schema. */
export function IsBusinessEntity(entity: ScopableEntity): boolean {
    return IsBusinessSchema(entity.SchemaName);
}
