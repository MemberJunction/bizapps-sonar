-- =============================================================================
-- V202607271500__v0.5.x_Sync_Cohort_Play.sql
-- =============================================================================
-- Seed "Sonar: Sync Cohort To List" — the first BULK play (Intervention.Kind='BulkSync').
--
-- Unlike a per-member play, a bulk play fires ONCE per run and receives the whole TREATED cohort
-- (runner-injected CohortJSON; control members are deliberately excluded so the holdout comparison
-- stays clean). This one lands the cohort on an MJ List — the platform's native "named set of
-- records": staff work it in the Lists app via ListDetail.Status, it's shareable, and a connector
-- can bind to it. Sonar builds no connector and no worklist of its own.
--
-- Goes in the 'Sonar Plays' category so the launch picker offers it (the category row was seeded by
-- V202607231300 and is re-guarded here for installs that skipped it). Type='Custom' (code in the
-- repo), so the fire-time governance gate treats it as inherently trusted — its PR review is its
-- review. Idempotent (guarded per row); safe to re-run.
-- PG twin: migrations-pg/V202607271500__v0.5.x_Sync_Cohort_Play.pg.sql
-- =============================================================================

IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionCategory] WHERE ID = '5044A100-0C00-4000-8000-00000000C0DE')
BEGIN
    INSERT INTO [__mj].[ActionCategory] (ID, Name, Description, Status)
    VALUES ('5044A100-0C00-4000-8000-00000000C0DE', N'Sonar Plays', N'Intervention plays a Sonar operator can fire on a cohort (the launch picker shows only these).', N'Active');
END
GO

IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = '5044A100-001E-4000-8000-00000000001E')
BEGIN
    INSERT INTO [__mj].[Action] (ID, CategoryID, Name, Description, Type, CodeApprovalStatus, CodeLocked, ForceCodeGeneration, Status, DriverClass, IconClass)
    VALUES (
        '5044A100-001E-4000-8000-00000000001E', '5044A100-0C00-4000-8000-00000000C0DE',
        N'Sonar: Sync Cohort To List',
        N'Bulk play (Kind=BulkSync): fires once per run and lands the whole treated cohort on an MJ List, with each member''s score/band/intervention in ListDetail.AdditionalData. Staff work the list in the Lists app (row status), share it, or bind a connector to it. Control members are never included. Idempotent per member — re-runs only append new names.',
        N'Custom', N'Pending', 0, 0, N'Active', N'SonarSyncCohortToList', N'fa-solid fa-list-ul'
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-001E-4000-8000-0000000000A1')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-001E-4000-8000-0000000000A1', '5044A100-001E-4000-8000-00000000001E', N'CohortJSON', N'Input', N'Scalar', 0, 1, N'Runner-injected: JSON array of the TREATED members ({ anchorRecordId, anchorRecordKeyJSON, score, bandId }). Never includes control members.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-001E-4000-8000-0000000000A2')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-001E-4000-8000-0000000000A2', '5044A100-001E-4000-8000-00000000001E', N'ModelID', N'Input', N'Scalar', 0, 1, N'Runner-injected: the Score Model whose anchor entity types the list.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-001E-4000-8000-0000000000A3')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-001E-4000-8000-0000000000A3', '5044A100-001E-4000-8000-00000000001E', N'InterventionID', N'Input', N'Scalar', 0, 0, N'Runner-injected: names the default list ("Sonar: <intervention name>") and rides in each row''s AdditionalData.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-001E-4000-8000-0000000000A4')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-001E-4000-8000-0000000000A4', '5044A100-001E-4000-8000-00000000001E', N'ListName', N'Input', N'Scalar', 0, 0, N'Optional operator override for the target list''s name. The list is found-or-created by name, so re-using a name appends to that list.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-001E-4000-8000-0000000000A5')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-001E-4000-8000-0000000000A5', '5044A100-001E-4000-8000-00000000001E', N'Result', N'Both', N'Scalar', 0, 0, N'JSON: { listId, listName, added, alreadyOnList }.');
GO

IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = '5044A100-001E-4000-8000-0000000000C1')
    INSERT INTO [__mj].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-001E-4000-8000-0000000000C1', '5044A100-001E-4000-8000-00000000001E', N'SUCCESS', 1, N'Cohort synced (or already fully on the list).');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = '5044A100-001E-4000-8000-0000000000C2')
    INSERT INTO [__mj].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-001E-4000-8000-0000000000C2', '5044A100-001E-4000-8000-00000000001E', N'VALIDATION_ERROR', 0, N'CohortJSON/ModelID missing or malformed.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = '5044A100-001E-4000-8000-0000000000C3')
    INSERT INTO [__mj].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-001E-4000-8000-0000000000C3', '5044A100-001E-4000-8000-00000000001E', N'ERROR', 0, N'The list write failed (fully or partially) — the run reports failure so a retry re-syncs; already-synced members are skipped.');
GO
