-- The first real intervention play + a "Sonar Plays" action category so the launch picker offers
-- only purpose-built plays (not every Sonar action). "Sonar: Add to Worklist" is self-contained:
-- firing it queues a treated member onto the in-Sonar follow-up worklist (worked in the Interventions
-- tab). Idempotent (guarded per row); safe to re-run.

DECLARE @CatID UNIQUEIDENTIFIER = '5044A100-0C00-4000-8000-00000000C0DE';
DECLARE @ActionID UNIQUEIDENTIFIER = '5044A100-001D-4000-8000-00000000001D';

IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionCategory] WHERE ID = @CatID)
BEGIN
    INSERT INTO [__mj].[ActionCategory] (ID, Name, Description, Status)
    VALUES (@CatID, N'Sonar Plays', N'Intervention plays a Sonar operator can fire on a cohort (the launch picker shows only these).', N'Active');
END
GO

IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = '5044A100-001D-4000-8000-00000000001D')
BEGIN
    INSERT INTO [__mj].[Action] (ID, CategoryID, Name, Description, Type, CodeApprovalStatus, CodeLocked, ForceCodeGeneration, Status, DriverClass, IconClass)
    VALUES (
        '5044A100-001D-4000-8000-00000000001D', '5044A100-0C00-4000-8000-00000000C0DE',
        N'Sonar: Add to Worklist',
        N'The zero-dependency intervention play: firing it queues a treated member onto the Sonar follow-up worklist (worked in the Interventions tab — mark Contacted/Done). The assignment row is the artifact; no external system.',
        N'Custom', N'Pending', 0, 0, N'Active', N'SonarAddToWorklist', N'fa-solid fa-list-check'
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-001D-4000-8000-0000000000A1')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-001D-4000-8000-0000000000A1', '5044A100-001D-4000-8000-00000000001D', N'AnchorRecordID', N'Input', N'Scalar', 0, 0, N'The member being queued onto the worklist.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-001D-4000-8000-0000000000A2')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-001D-4000-8000-0000000000A2', '5044A100-001D-4000-8000-00000000001D', N'Result', N'Both', N'Scalar', 0, 0, N'JSON: { queued, anchorRecordId }.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = '5044A100-001D-4000-8000-0000000000C1')
    INSERT INTO [__mj].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-001D-4000-8000-0000000000C1', '5044A100-001D-4000-8000-00000000001D', N'SUCCESS', 1, N'Member queued onto the worklist.');
GO
