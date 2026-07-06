/**
 * @mj-biz-apps/sonar-core-entities-server
 *
 * Server-side entity subclasses for Sonar entities. Classes here override
 * Save() and Delete() to add lifecycle hooks that only run on the server
 * (e.g. snapshotting a ScoreModel into an immutable ScoreModelVersion on
 * publish, cross-record validation via ValidateAsync, FK cleanup before
 * delete).
 *
 * Import this package from the server bootstrap (@mj-biz-apps/sonar-server)
 * to ensure @RegisterClass decorators fire at startup — it must load AFTER
 * @mj-biz-apps/sonar-entities so the server subclasses win @RegisterClass
 * priority.
 */

export * from "./ScoreModelEntityServer";
export * from "./FactorEntityServer";
export * from "./ModelFactorEntityServer";
export * from "./ModelRelatedEntityEntityServer";
export * from "./ScoreBandEntityServer";
export * from "./publishLock";

/** Marker export so importers can force-load this module (and its decorators). */
export const SONAR_CORE_ENTITIES_SERVER_LOADED = true;
