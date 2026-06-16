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
 *
 * No server-side subclasses exist yet — they will be added once the initial
 * __mj_BizAppsSonar schema migration has run and CodeGen has produced the base entity
 * classes.
 */

/** Marker export so this module is non-empty until subclasses are added. */
export const SONAR_CORE_ENTITIES_SERVER_LOADED = true;
