-- Seeds `Sonar: Measure Intervention Outcomes` (block 001C) — fills InterventionOutcome and returns
-- the treatment-vs-control lift summary. Idempotent (guarded per row); safe to re-run.

DECLARE @CategoryID UNIQUEIDENTIFIER = (SELECT TOP 1 ID FROM [__mj].[ActionCategory] WHERE Name = 'Business Apps');
DECLARE @ActionID UNIQUEIDENTIFIER = '5044A100-001C-4000-8000-00000000001C';

IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = @ActionID)
BEGIN
    INSERT INTO [__mj].[Action] (ID, CategoryID, Name, Description, Type, CodeApprovalStatus, CodeLocked, ForceCodeGeneration, Status, DriverClass, IconClass)
    VALUES (
        @ActionID, @CategoryID,
        N'Sonar: Measure Intervention Outcomes',
        N'Fills InterventionOutcome for one intervention''s assignments (baseline = the member''s score history at assignment; outcome = current score/band movement) and returns the treatment-vs-control lift summary. Re-runnable: measured assignments are skipped; lift aggregates everything measured so far. v1 outcomes are engagement outcomes (score/band movement); business outcomes come later.',
        N'Custom', N'Pending', 0, 0, N'Active', N'SonarMeasureOutcomes', N'fa-solid fa-scale-balanced'
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-001C-4000-8000-0000000000A1')
BEGIN
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-001C-4000-8000-0000000000A1', '5044A100-001C-4000-8000-00000000001C',
        N'InterventionID', N'Input', N'Scalar', 0, 1, N'The Intervention whose assignments to measure.');
END
GO

IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-001C-4000-8000-0000000000A2')
BEGIN
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-001C-4000-8000-0000000000A2', '5044A100-001C-4000-8000-00000000001C',
        N'Result', N'Both', N'Scalar', 0, 0, N'JSON MeasureResult: { measured, alreadyMeasured, unmeasurable, lift: { scoreLift, bandUpLiftPct, ... } }.');
END
GO

IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = '5044A100-001C-4000-8000-0000000000C1')
BEGIN
    INSERT INTO [__mj].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-001C-4000-8000-0000000000C1', '5044A100-001C-4000-8000-00000000001C', N'SUCCESS', 1, N'Outcomes measured; lift summary returned.');
END
GO

IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = '5044A100-001C-4000-8000-0000000000C2')
BEGIN
    INSERT INTO [__mj].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-001C-4000-8000-0000000000C2', '5044A100-001C-4000-8000-00000000001C', N'VALIDATION_ERROR', 0, N'InterventionID missing.');
END
GO

IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = '5044A100-001C-4000-8000-0000000000C3')
BEGIN
    INSERT INTO [__mj].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-001C-4000-8000-0000000000C3', '5044A100-001C-4000-8000-00000000001C', N'ERROR', 0, N'Measurement failed (intervention/segment not found or write error).');
END
GO
