-- =============================================================================
-- V202610110200__v0.7.x__Metadata_Sync.pg.sql  (PostgreSQL)
-- =============================================================================
-- PostgreSQL twin of migrations/V202610110200__v0.7.x__Metadata_Sync.sql, Sonar's v0.7.x
-- release metadata seed. Same end state, written by hand.
--
-- WHY HAND-WRITTEN, NOT CONVERTED: the SQL Server seed is 18 `mj sync push` log blocks, each a
-- DECLARE/SET/EXEC of a core spUpdate* proc that passes the WHOLE row (every column, plus
-- `_Clear = 1` for each NULL). `mj migrate convert` (CLI 6.1.5) skips all 18 blocks and emits an
-- empty file. A literal port would not be safe either: those blocks address Entity and
-- EntityField rows by their SQL Server IDs, and the PG baseline (B202607171700) registered
-- Sonar's entities under different, CodeGen-minted IDs. Replaying a full row would also
-- overwrite every column with its SQL Server value.
--
-- So each call becomes one plain UPDATE that sets only the columns whose values differ from what
-- the shipped PG chain (MJ core 6.1.5 PG + B202607171700 .. V202607291200) leaves. The differences
-- were measured on a real install of that chain, not read off the files. Every other column the
-- SQL Server calls pass, including all 372 `_Clear = 1` columns, already holds the same value on
-- PG, so nothing is lost by leaving them out.
--
-- ADDRESSING: Entity rows by "Name", EntityField rows by (entity Name, field Name). Neither uses
-- a SQL Server ID. The Application (4F9477FB…) and the Count Population Action (5044A100-001B…)
-- are seed-hardcoded IDs, inserted with the same literal by B202607171700 and V202607271900, so
-- they are identical across dialects and are addressed by ID.
--
-- IDEMPOTENT: each UPDATE is guarded with IS DISTINCT FROM on its target values, so a re-run
-- matches 0 rows and leaves __mj_UpdatedAt alone.
--
-- Core tables are written as literal __mj, like every other file in migrations-pg/: committed
-- .pg.sql files carry literal schemas (MJ's converter resolves ${mjSchema} rather than relying
-- on placeholder substitution for PostgreSQL).
-- =============================================================================

-- 1. 13 x spUpdateEntity: turn user search OFF, and stop CodeGen auto-updating that choice.
--    Shipped chain: AllowUserSearchAPI = true, AutoUpdateAllowUserSearchAPI = true on all 13.
UPDATE __mj."Entity"
SET "AllowUserSearchAPI" = false,
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
    'MJ_BizApps_Sonar: Time Windows'
  )
  AND ("AllowUserSearchAPI" IS DISTINCT FROM false
       OR "AutoUpdateAllowUserSearchAPI" IS DISTINCT FROM false);

-- 2. 1 x spUpdateEntity, Score Models: user search stays ON (AllowUserSearchAPI is already true
--    on the shipped chain, so it is not rewritten); only the AutoUpdate flag changes.
UPDATE __mj."Entity"
SET "AutoUpdateAllowUserSearchAPI" = false
WHERE "Name" = 'MJ_BizApps_Sonar: Score Models'
  AND "AutoUpdateAllowUserSearchAPI" IS DISTINCT FROM false;

-- 3. spUpdateEntityField, Score Models.Name: search by prefix, and keep CodeGen from changing
--    whether it is searched. IncludeInUserSearchAPI is already true on the shipped chain.
--    Shipped chain: UserSearchPredicateAPI = 'Contains', AutoUpdateIncludeInUserSearchAPI = true.
UPDATE __mj."EntityField"
SET "UserSearchPredicateAPI" = 'BeginsWith',
    "AutoUpdateIncludeInUserSearchAPI" = false
WHERE "EntityID" = (SELECT "ID" FROM __mj."Entity" WHERE "Name" = 'MJ_BizApps_Sonar: Score Models')
  AND "Name" = 'Name'
  AND ("UserSearchPredicateAPI" IS DISTINCT FROM 'BeginsWith'
       OR "AutoUpdateIncludeInUserSearchAPI" IS DISTINCT FROM false);

-- 4. spUpdateEntityField, Score Models.ID: take the primary key out of user search, and keep it out.
--    Shipped chain: IncludeInUserSearchAPI = true, AutoUpdateIncludeInUserSearchAPI = true.
UPDATE __mj."EntityField"
SET "IncludeInUserSearchAPI" = false,
    "AutoUpdateIncludeInUserSearchAPI" = false
WHERE "EntityID" = (SELECT "ID" FROM __mj."Entity" WHERE "Name" = 'MJ_BizApps_Sonar: Score Models')
  AND "Name" = 'ID'
  AND ("IncludeInUserSearchAPI" IS DISTINCT FROM false
       OR "AutoUpdateIncludeInUserSearchAPI" IS DISTINCT FROM false);

-- 5. spUpdateApplication: rename 'BizAppSonar' -> 'Sonar' and pin the Path ('bizappsonar', unchanged)
--    so a later rename cannot move the URL. Shipped chain: Name = 'BizAppSonar', AutoUpdatePath = true.
--    Application.Name is UNIQUE: on a host that already has another app named 'Sonar' this fails
--    loudly instead of being skipped, the same as on SQL Server.
UPDATE __mj."Application"
SET "Name" = 'Sonar',
    "AutoUpdatePath" = false
WHERE "ID" = '4f9477fb-bc8b-4ca9-a4fe-c0fb45496285'
  AND ("Name" IS DISTINCT FROM 'Sonar'
       OR "AutoUpdatePath" IS DISTINCT FROM false);

-- 6. spUpdateAction, Sonar: Count Population: the description metadata/ now carries. V202607271900
--    seeded an earlier, shorter wording (it ended "...whether a filter narrowed it. Read-only.").
UPDATE __mj."Action"
SET "Description" = 'Counts the anchor records a scoring model actually scores, with its population filter applied. Returns the scoped count, the unfiltered entity total, and whether a filter narrowed it. Two count_only reads; nothing is scored or persisted. Read-only; safe on a draft model.'
WHERE "ID" = '5044a100-001b-4000-8000-00000000001b'
  AND "Description" IS DISTINCT FROM 'Counts the anchor records a scoring model actually scores, with its population filter applied. Returns the scoped count, the unfiltered entity total, and whether a filter narrowed it. Two count_only reads; nothing is scored or persisted. Read-only; safe on a draft model.';
