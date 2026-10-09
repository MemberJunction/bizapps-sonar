-- =============================================================================
-- V202610091900__v0.7.x_Rename_App_To_Sonar.pg.sql
-- =============================================================================
-- PostgreSQL parity for migrations/V202610091900__v0.7.x_Rename_App_To_Sonar.sql.
--
-- Shows the app as "Sonar" instead of "BizAppSonar", pins Path to `bizappsonar` and turns
-- AutoUpdatePath off, so an entity-layer save doesn't move the app to /app/sonar. The Application
-- ID is seed-hardcoded, so it matches SQL Server. Idempotent and non-clobbering: only a row still
-- named 'BizAppSonar' is renamed, and only when no application is already named 'Sonar'.
-- =============================================================================

UPDATE __mj."Application"
SET "Name" = 'Sonar',
    "Path" = COALESCE(NULLIF("Path", ''), 'bizappsonar'),
    "AutoUpdatePath" = FALSE
WHERE "ID" = '4f9477fb-bc8b-4ca9-a4fe-c0fb45496285'
  AND "Name" = 'BizAppSonar'
  AND NOT EXISTS (SELECT 1 FROM __mj."Application" WHERE "Name" = 'Sonar');
