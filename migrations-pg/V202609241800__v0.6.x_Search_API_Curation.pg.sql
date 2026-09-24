-- =============================================================================
-- V202609241800__v0.6.x_Search_API_Curation.pg.sql
-- =============================================================================
-- PostgreSQL parity for migrations/V202609241800__v0.6.x_Search_API_Curation.sql.
--
-- Delivers the search-API curation that metadata/entities/.entities.json has carried
-- since 8c797449 (2026-09-17) but that no migration shipped: search OFF for the 13
-- score/detail entities whose generic band labels pollute results, search ON for
-- Score Models with Name matched on prefix and ID excluded.
--
-- Resolved by NATURAL KEY (Entity.Name, EntityField.Name) because these core rows are
-- CodeGen-minted per host and their IDs differ on every database.
--
-- AutoUpdate* is cleared alongside each value so the next CodeGen run does not undo it.
-- Idempotent: each UPDATE is a no-op once the target state is in place.
-- =============================================================================

-- 1. Search OFF for the 13 score/detail entities.
UPDATE __mj."Entity"
   SET "AllowUserSearchAPI"           = false,
       "AutoUpdateAllowUserSearchAPI" = false
 WHERE "Name" IN (
           'MJ_BizApps_Sonar: Factors',
           'MJ_BizApps_Sonar: Model Factors',
           'MJ_BizApps_Sonar: Model Related Entities',
           'MJ_BizApps_Sonar: Score Band Sets',
           'MJ_BizApps_Sonar: Score Band Transitions',
           'MJ_BizApps_Sonar: Score Bands',
           'MJ_BizApps_Sonar: Score Factor Contributions',
           'MJ_BizApps_Sonar: Score Histories',
           'MJ_BizApps_Sonar: Score Model Audit Events',
           'MJ_BizApps_Sonar: Score Model Versions',
           'MJ_BizApps_Sonar: Score Recompute Runs',
           'MJ_BizApps_Sonar: Scores',
           'MJ_BizApps_Sonar: Time Windows')
   AND ("AllowUserSearchAPI" IS DISTINCT FROM false
        OR "AutoUpdateAllowUserSearchAPI" IS DISTINCT FROM false);

-- 2. Search ON for Score Models.
UPDATE __mj."Entity"
   SET "AllowUserSearchAPI"           = true,
       "AutoUpdateAllowUserSearchAPI" = false
 WHERE "Name" = 'MJ_BizApps_Sonar: Score Models'
   AND ("AllowUserSearchAPI" IS DISTINCT FROM true
        OR "AutoUpdateAllowUserSearchAPI" IS DISTINCT FROM false);

-- 3. Score Models.Name is the searchable field, matched on prefix.
UPDATE __mj."EntityField" f
   SET "IncludeInUserSearchAPI"           = true,
       "AutoUpdateIncludeInUserSearchAPI" = false,
       "UserSearchPredicateAPI"           = 'BeginsWith'
  FROM __mj."Entity" e
 WHERE e."ID" = f."EntityID"
   AND e."Name" = 'MJ_BizApps_Sonar: Score Models'
   AND f."Name" = 'Name'
   AND (f."IncludeInUserSearchAPI" IS DISTINCT FROM true
        OR f."AutoUpdateIncludeInUserSearchAPI" IS DISTINCT FROM false
        OR COALESCE(f."UserSearchPredicateAPI", '') IS DISTINCT FROM 'BeginsWith');

-- 4. Score Models.ID is a GUID — never a useful search hit.
UPDATE __mj."EntityField" f
   SET "IncludeInUserSearchAPI"           = false,
       "AutoUpdateIncludeInUserSearchAPI" = false
  FROM __mj."Entity" e
 WHERE e."ID" = f."EntityID"
   AND e."Name" = 'MJ_BizApps_Sonar: Score Models'
   AND f."Name" = 'ID'
   AND (f."IncludeInUserSearchAPI" IS DISTINCT FROM false
        OR f."AutoUpdateIncludeInUserSearchAPI" IS DISTINCT FROM false);
