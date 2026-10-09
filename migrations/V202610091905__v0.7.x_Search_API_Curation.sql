-- =============================================================================
-- V202610091905__v0.7.x_Search_API_Curation.sql
-- =============================================================================
-- Deliver the search-API curation that metadata/entities/.entities.json has carried since #76.
-- That PR changed the dev source but wrote no migration, so a stranger's install never received it.
-- The distribution gate (scripts/check-distribution-seed.mjs) has flagged it ever since.
--
--   * Score Models stays searchable on Name (BeginsWith); its ID is not searchable.
--   * Search is OFF on the 13 runtime/rubric entities, whose generic labels ("At Risk", "Healthy")
--     polluted global search.
--   * The AutoUpdate* flags are frozen so CodeGen doesn't flip these back.
--
-- Entities are resolved by NAME (their __mj.Entity IDs are CodeGen-minted per database).
-- Idempotent: plain UPDATEs of fixed values.
-- Forward migration because the v0.2.0 seed is FROZEN. See migrations/README.md.
-- PG twin: migrations-pg/V202610091905__v0.7.x_Search_API_Curation.pg.sql
-- =============================================================================

UPDATE [${mjSchema}].[Entity]
SET AllowUserSearchAPI = 0, AutoUpdateAllowUserSearchAPI = 0
WHERE Name IN ('MJ_BizApps_Sonar: Factors', 'MJ_BizApps_Sonar: Model Factors', 'MJ_BizApps_Sonar: Model Related Entities',
    'MJ_BizApps_Sonar: Score Band Sets', 'MJ_BizApps_Sonar: Score Band Transitions', 'MJ_BizApps_Sonar: Score Bands',
    'MJ_BizApps_Sonar: Score Factor Contributions', 'MJ_BizApps_Sonar: Score Histories',
    'MJ_BizApps_Sonar: Score Model Audit Events', 'MJ_BizApps_Sonar: Score Model Versions',
    'MJ_BizApps_Sonar: Score Recompute Runs', 'MJ_BizApps_Sonar: Scores', 'MJ_BizApps_Sonar: Time Windows');
GO

UPDATE [${mjSchema}].[Entity]
SET AllowUserSearchAPI = 1, AutoUpdateAllowUserSearchAPI = 0
WHERE Name = 'MJ_BizApps_Sonar: Score Models';
GO

UPDATE f
SET IncludeInUserSearchAPI = CASE WHEN f.Name = 'Name' THEN 1 ELSE 0 END,
    AutoUpdateIncludeInUserSearchAPI = 0,
    UserSearchPredicateAPI = CASE WHEN f.Name = 'Name' THEN 'BeginsWith' ELSE f.UserSearchPredicateAPI END
FROM [${mjSchema}].[EntityField] f
JOIN [${mjSchema}].[Entity] e ON e.ID = f.EntityID
WHERE e.Name = 'MJ_BizApps_Sonar: Score Models' AND f.Name IN ('Name', 'ID');
