-- =============================================================================
-- V202610091900__v0.7.x_Rename_App_To_Sonar.sql
-- =============================================================================
-- Show the app as "Sonar" instead of "BizAppSonar". MJ Applications have no display-name column, so
-- the UI shows Name.
--
-- The URL path stays `bizappsonar`. The seed created the row with AutoUpdatePath = 1, and on a
-- server-side save MJApplicationEntityServer re-derives Path from a changed Name. Left on, the
-- next save through the entity layer would move the app to /app/sonar and break existing links,
-- bookmarks and nav state. So this pins Path and turns AutoUpdatePath off.
--
-- Idempotent and non-clobbering. It only renames a row still called 'BizAppSonar' (an operator's
-- own rename wins), and only when no other application is already named 'Sonar'.
--
-- Forward migration because the v0.2.0 seed is FROZEN; metadata/applications/.sonar-application.json
-- carries the same change as the editable dev source. See migrations/README.md.
-- PG twin: migrations-pg/V202610091900__v0.7.x_Rename_App_To_Sonar.pg.sql
-- =============================================================================

UPDATE [${mjSchema}].[Application]
SET Name = N'Sonar',
    Path = COALESCE(NULLIF(Path, N''), N'bizappsonar'),
    AutoUpdatePath = 0
WHERE ID = '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285'
  AND Name = N'BizAppSonar'
  AND NOT EXISTS (SELECT 1 FROM [${mjSchema}].[Application] WHERE Name = N'Sonar');
