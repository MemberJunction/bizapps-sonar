-- =============================================================================
-- V202610091905__v0.7.x_Search_API_Curation.pg.sql
-- =============================================================================
-- PostgreSQL parity for migrations/V202610091905__v0.7.x_Search_API_Curation.sql.
-- Delivers the search-API curation in metadata/entities/.entities.json (#76): Score Models is
-- searchable on Name (BeginsWith) and not on ID, search is OFF on the 13 runtime/rubric entities,
-- and the AutoUpdate* flags are frozen. Entities are resolved by NAME (PG registers different IDs).
-- Idempotent.
-- =============================================================================

UPDATE ${mjSchema}."Entity"
SET "AllowUserSearchAPI" = FALSE, "AutoUpdateAllowUserSearchAPI" = FALSE
WHERE "Name" IN ('MJ_BizApps_Sonar: Factors', 'MJ_BizApps_Sonar: Model Factors', 'MJ_BizApps_Sonar: Model Related Entities',
    'MJ_BizApps_Sonar: Score Band Sets', 'MJ_BizApps_Sonar: Score Band Transitions', 'MJ_BizApps_Sonar: Score Bands',
    'MJ_BizApps_Sonar: Score Factor Contributions', 'MJ_BizApps_Sonar: Score Histories',
    'MJ_BizApps_Sonar: Score Model Audit Events', 'MJ_BizApps_Sonar: Score Model Versions',
    'MJ_BizApps_Sonar: Score Recompute Runs', 'MJ_BizApps_Sonar: Scores', 'MJ_BizApps_Sonar: Time Windows');

UPDATE ${mjSchema}."Entity"
SET "AllowUserSearchAPI" = TRUE, "AutoUpdateAllowUserSearchAPI" = FALSE
WHERE "Name" = 'MJ_BizApps_Sonar: Score Models';

UPDATE ${mjSchema}."EntityField" f
SET "IncludeInUserSearchAPI" = (f."Name" = 'Name'),
    "AutoUpdateIncludeInUserSearchAPI" = FALSE,
    "UserSearchPredicateAPI" = CASE WHEN f."Name" = 'Name' THEN 'BeginsWith' ELSE f."UserSearchPredicateAPI" END
FROM ${mjSchema}."Entity" e
WHERE e."ID" = f."EntityID" AND e."Name" = 'MJ_BizApps_Sonar: Score Models' AND f."Name" IN ('Name', 'ID');
