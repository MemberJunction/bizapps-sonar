-- =============================================================================
-- V202608021300__v0.5.x_Preview_Segment_Action.sql
-- =============================================================================
-- Seed "Sonar: Preview Segment" — resolve a targeting rule through the real engine and return the
-- cohort count plus one page of members, writing nothing.
--
-- Why: the Engagement Manager re-implemented the segment rule in client-side SQL (score-read's
-- moverMembers, which promised in a comment to mirror SegmentEvaluator "EXACTLY"). Two copies of a
-- selection rule drift, and it stopped being possible at all once rules gained TRAJECTORY bounds
-- (slope / sustained-decline / volatility are computed from ScoreHistory in the engine, not from a
-- single Score query). This action lets the UI ask the engine, so the list an operator sees is
-- resolved by the same code that picks who gets treated.
--
-- Category is 'Business Apps' (a utility/tool surface), NOT 'Sonar Plays' — this is not something an
-- operator fires at members, and the launch picker must not offer it.
-- Type='Custom' (code in the repo), so the fire-time governance gate trusts it inherently.
-- Idempotent (guarded per row); safe to re-run.
-- PG twin: migrations-pg/V202608021300__v0.5.x_Preview_Segment_Action.pg.sql
-- =============================================================================

DECLARE @CategoryID UNIQUEIDENTIFIER = (SELECT TOP 1 ID FROM [__mj].[ActionCategory] WHERE Name = 'Business Apps');

IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = '5044A100-0025-4000-8000-000000000025')
BEGIN
    INSERT INTO [__mj].[Action] (ID, CategoryID, Name, Description, Type, CodeApprovalStatus, CodeLocked, ForceCodeGeneration, Status, DriverClass, IconClass)
    VALUES (
        '5044A100-0025-4000-8000-000000000025', @CategoryID,
        N'Sonar: Preview Segment',
        N'Resolves a targeting rule (a SegmentFilter) through the scoring engine and returns the full cohort COUNT plus one page of members, with each member''s trend shape when the rule uses trajectory bounds. Writes nothing: no segment, intervention, or assignment rows. Read-only; the UI calls this so the cohort it displays is resolved by the same code that decides who gets treated.',
        N'Custom', N'Pending', 0, 0, N'Active', N'SonarPreviewSegment', N'fa-solid fa-crosshairs'
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-0025-4000-8000-0000000000A1')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0025-4000-8000-0000000000A1', '5044A100-0025-4000-8000-000000000025', N'ModelID', N'Input', N'Scalar', 0, 1, N'The Score Model whose persisted scores the rule is resolved against.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-0025-4000-8000-0000000000A2')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0025-4000-8000-0000000000A2', '5044A100-0025-4000-8000-000000000025', N'FilterJSON', N'Input', N'Scalar', 0, 1, N'JSON SegmentFilter. Point-in-time: { bandId?, minScore?, maxScore?, minDelta?, maxDelta?, crossedBandOnly? }. Trust gate: { minDataCompleteness? }. Trajectory (reads ScoreHistory): { windowDays?, minSlopePer30Days?, maxSlopePer30Days?, minDeclineRun?, minNetDrop?, maxVolatility?, minSnapshots? }.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-0025-4000-8000-0000000000A3')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0025-4000-8000-0000000000A3', '5044A100-0025-4000-8000-000000000025', N'Page', N'Input', N'Scalar', 0, 0, N'0-based page of members to return. The returned total is always the FULL cohort, not the page.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-0025-4000-8000-0000000000A4')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0025-4000-8000-0000000000A4', '5044A100-0025-4000-8000-000000000025', N'PageSize', N'Input', N'Scalar', 0, 0, N'Members per page (default 50, capped at 500).');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-0025-4000-8000-0000000000A5')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0025-4000-8000-0000000000A5', '5044A100-0025-4000-8000-000000000025', N'Result', N'Both', N'Scalar', 0, 0, N'JSON: { total, page, pageSize, usedTrajectory, members: [{ anchorRecordId, anchorRecordKeyJSON, normalizedScore, bandId, shape }] }. shape is null unless the rule used trajectory bounds.');
GO

IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = '5044A100-0025-4000-8000-0000000000C1')
    INSERT INTO [__mj].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-0025-4000-8000-0000000000C1', '5044A100-0025-4000-8000-000000000025', N'SUCCESS', 1, N'Rule resolved; the count and the requested page are in Result.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = '5044A100-0025-4000-8000-0000000000C2')
    INSERT INTO [__mj].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-0025-4000-8000-0000000000C2', '5044A100-0025-4000-8000-000000000025', N'VALIDATION_ERROR', 0, N'ModelID missing/not a GUID, or FilterJSON missing or not a JSON object.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = '5044A100-0025-4000-8000-0000000000C3')
    INSERT INTO [__mj].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-0025-4000-8000-0000000000C3', '5044A100-0025-4000-8000-000000000025', N'ERROR', 0, N'Resolution failed (bad filter shape or a query error).');
GO
