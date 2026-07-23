-- Seeds the `Sonar: Run Intervention` action (the action layer's entry point) so installed
-- deployments get it via migrations — metadata/ is the dev source of truth but `mj app install`
-- runs migrations only. Idempotent (guarded per row); safe to re-run.
-- Block 001B in the Sonar action ID convention (5044A100-00NN…, params …A1/A2, codes …C1..C3).

DECLARE @CategoryID UNIQUEIDENTIFIER = (SELECT TOP 1 ID FROM [__mj].[ActionCategory] WHERE Name = 'Business Apps');
DECLARE @ActionID UNIQUEIDENTIFIER = '5044A100-001B-4000-8000-00000000001B';

IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = @ActionID)
BEGIN
    INSERT INTO [__mj].[Action] (ID, CategoryID, Name, Description, Type, CodeApprovalStatus, CodeLocked, ForceCodeGeneration, Status, DriverClass, IconClass)
    VALUES (
        @ActionID, @CategoryID,
        N'Sonar: Run Intervention',
        N'The action layer''s entry point: find-or-creates an ad-hoc ScoreSegment (band/score filter) and an Intervention (segment + chosen MJ Action + holdout %), then runs it. preview:true returns cohort/treated/held counts without writing or firing; preview:false writes one InterventionAssignment per member and fires the Action for each Treatment member (Control is held out). Idempotent: already-assigned members are never re-fired.',
        N'Custom', N'Pending', 0, 0, N'Active', N'SonarRunIntervention', N'fa-solid fa-bullhorn'
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-001B-4000-8000-0000000000A1')
BEGIN
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-001B-4000-8000-0000000000A1', '5044A100-001B-4000-8000-00000000001B',
        N'ConfigJSON', N'Input', N'Scalar', 0, 1,
        N'JSON: { modelId, segment:{name,filter:{bandId?,minScore?,maxScore?}}, intervention:{name,holdoutPercent}, action:{actionId,params[]}, cap, preview }.');
END
GO

IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-001B-4000-8000-0000000000A2')
BEGIN
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-001B-4000-8000-0000000000A2', '5044A100-001B-4000-8000-00000000001B',
        N'Result', N'Both', N'Scalar', 0, 0,
        N'JSON InterventionRunResult: { cohortSize, alreadyAssigned, eligible, capped, treated, held, sent, failed, preview }.');
END
GO

IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = '5044A100-001B-4000-8000-0000000000C1')
BEGIN
    INSERT INTO [__mj].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-001B-4000-8000-0000000000C1', '5044A100-001B-4000-8000-00000000001B', N'SUCCESS', 1, N'Intervention run (or previewed) successfully.');
END
GO

IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = '5044A100-001B-4000-8000-0000000000C2')
BEGIN
    INSERT INTO [__mj].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-001B-4000-8000-0000000000C2', '5044A100-001B-4000-8000-00000000001B', N'VALIDATION_ERROR', 0, N'ConfigJSON missing or malformed.');
END
GO

IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = '5044A100-001B-4000-8000-0000000000C3')
BEGIN
    INSERT INTO [__mj].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-001B-4000-8000-0000000000C3', '5044A100-001B-4000-8000-00000000001B', N'ERROR', 0, N'The run failed (segment/intervention create or engine error).');
END
GO
