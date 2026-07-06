/**
 * Entity scoping for Sonar pickers and agent tools — the ONE place that decides what counts as a
 * "business entity" worth scoring against. Anchors and data sources should be real domain tables
 * (Members, Event Registrations, Donations…), never MJ's own plumbing or Sonar's internal config/runtime
 * tables. Both the agent's "List Related Entities" action and the UI's anchor/source picker filter
 * through these so they can never drift on what's offered.
 */

/** Schemas that hold framework/Sonar plumbing, not scoreable business data. */
export const NON_BUSINESS_SCHEMAS: readonly string[] = ["__mj", "__mj_BizAppsSonar"];

/** True when `schemaName` is a real business schema (not MJ core, not Sonar's own schema). */
export function isBusinessSchema(schemaName: string | null | undefined): boolean {
    if (!schemaName) return false;
    return !NON_BUSINESS_SCHEMAS.includes(schemaName);
}

/** The minimal entity shape this module reasons about (a structural subset of MJ's EntityInfo). */
export interface ScopableEntity {
    SchemaName?: string | null;
}

/** True when an entity is a candidate anchor/source — i.e. it lives in a business schema. */
export function isBusinessEntity(entity: ScopableEntity): boolean {
    return isBusinessSchema(entity.SchemaName);
}
