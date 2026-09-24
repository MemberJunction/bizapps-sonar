-- =============================================================================
-- V202609241800__v0.6.x_Search_API_Curation.sql
-- =============================================================================
-- Deliver the search-API curation that metadata/entities/.entities.json has carried
-- since 8c797449 (2026-09-17) but that no migration ever shipped.
--
-- `mj app install`/`upgrade` runs migrations ONLY — it never reads metadata/. So the
-- curation applied on the authoring machine by `mj sync push` reached no other host:
-- every installed Sonar has all 14 entities still on their CodeGen defaults, which is
-- why generic band labels ('At Risk', 'Neutral', 'Healthy') pollute user search. The
-- distribution gate (scripts/check-distribution-seed.mjs) caught it on the 0.6.1
-- release; this migration is the delivery half.
--
-- Forward migration because the v0.1 seed is FROZEN (see migrations/README.md).
-- PG twin: migrations-pg/V202609241800__v0.6.x_Search_API_Curation.pg.sql
--
-- NATURAL KEY, NOT LITERAL IDs. These are core [__mj].[Entity] / [__mj].[EntityField]
-- rows minted by CodeGen on each host, so their IDs differ per database. Resolving by
-- Entity.Name (and EntityField.Name within it) is the only form that works anywhere —
-- a captured ID would FK-violate on every host but the one it came from.
--
-- AutoUpdate* is set to 0 alongside each value so the next CodeGen run does not
-- recompute the flag back to its default and silently undo the curation.
--
-- Idempotent: each UPDATE is a no-op once the target state is already in place.
-- =============================================================================

-- 1. Search OFF for the 13 score/detail entities. Their user-visible text is generic
--    band and factor labels, which drown real results.
UPDATE e
   SET [AllowUserSearchAPI]           = 0,
       [AutoUpdateAllowUserSearchAPI] = 0
  FROM [__mj].[Entity] e
 WHERE e.[Name] IN (
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
   AND (e.[AllowUserSearchAPI] <> 0 OR e.[AutoUpdateAllowUserSearchAPI] <> 0);
GO

-- 2. Search ON for Score Models — the one entity a user actually looks up by name.
UPDATE e
   SET [AllowUserSearchAPI]           = 1,
       [AutoUpdateAllowUserSearchAPI] = 0
  FROM [__mj].[Entity] e
 WHERE e.[Name] = 'MJ_BizApps_Sonar: Score Models'
   AND (e.[AllowUserSearchAPI] <> 1 OR e.[AutoUpdateAllowUserSearchAPI] <> 0);
GO

-- 3. Score Models.Name is the searchable field, matched on prefix.
UPDATE f
   SET [IncludeInUserSearchAPI]           = 1,
       [AutoUpdateIncludeInUserSearchAPI] = 0,
       [UserSearchPredicateAPI]           = N'BeginsWith'
  FROM [__mj].[EntityField] f
  JOIN [__mj].[Entity]      e ON e.[ID] = f.[EntityID]
 WHERE e.[Name] = 'MJ_BizApps_Sonar: Score Models'
   AND f.[Name] = 'Name'
   AND (f.[IncludeInUserSearchAPI] <> 1
        OR f.[AutoUpdateIncludeInUserSearchAPI] <> 0
        OR ISNULL(f.[UserSearchPredicateAPI], N'') <> N'BeginsWith');
GO

-- 4. Score Models.ID is a GUID — never a useful search hit.
UPDATE f
   SET [IncludeInUserSearchAPI]           = 0,
       [AutoUpdateIncludeInUserSearchAPI] = 0
  FROM [__mj].[EntityField] f
  JOIN [__mj].[Entity]      e ON e.[ID] = f.[EntityID]
 WHERE e.[Name] = 'MJ_BizApps_Sonar: Score Models'
   AND f.[Name] = 'ID'
   AND (f.[IncludeInUserSearchAPI] <> 0 OR f.[AutoUpdateIncludeInUserSearchAPI] <> 0);
GO
