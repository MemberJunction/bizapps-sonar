-- PostgreSQL twin of migrations/V202608021300__v0.5.x_Preview_Segment_Action.sql: seed
-- "Sonar: Preview Segment", which resolves a targeting rule through the engine and returns the
-- cohort count plus one page of members (writing nothing), so the UI stops re-implementing the
-- segment rule in client-side SQL. Category 'Business Apps' (a tool, not a play). Idempotent.

INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "CodeApprovalStatus", "CodeLocked", "ForceCodeGeneration", "Status", "DriverClass", "IconClass")
SELECT '5044a100-0025-4000-8000-000000000025',
    (SELECT "ID" FROM __mj."ActionCategory" WHERE "Name" = 'Business Apps' LIMIT 1),
    'Sonar: Preview Segment',
    'Resolves a targeting rule (a SegmentFilter) through the scoring engine and returns the full cohort COUNT plus one page of members, with each member''s trend shape when the rule uses trajectory bounds. Writes nothing: no segment, intervention, or assignment rows. Read-only; the UI calls this so the cohort it displays is resolved by the same code that decides who gets treated.',
    'Custom', 'Pending', false, false, 'Active', 'SonarPreviewSegment', 'fa-solid fa-crosshairs'
WHERE NOT EXISTS (SELECT 1 FROM __mj."Action" WHERE "ID" = '5044a100-0025-4000-8000-000000000025');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-0025-4000-8000-0000000000a1', '5044a100-0025-4000-8000-000000000025', 'ModelID', 'Input', 'Scalar', false, true, 'The Score Model whose persisted scores the rule is resolved against.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-0025-4000-8000-0000000000a1');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-0025-4000-8000-0000000000a2', '5044a100-0025-4000-8000-000000000025', 'FilterJSON', 'Input', 'Scalar', false, true, 'JSON SegmentFilter. Point-in-time: { bandId?, minScore?, maxScore?, minDelta?, maxDelta?, crossedBandOnly? }. Trust gate: { minDataCompleteness? }. Trajectory (reads ScoreHistory): { windowDays?, minSlopePer30Days?, maxSlopePer30Days?, minDeclineRun?, minNetDrop?, maxVolatility?, minSnapshots? }.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-0025-4000-8000-0000000000a2');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-0025-4000-8000-0000000000a3', '5044a100-0025-4000-8000-000000000025', 'Page', 'Input', 'Scalar', false, false, '0-based page of members to return. The returned total is always the FULL cohort, not the page.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-0025-4000-8000-0000000000a3');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-0025-4000-8000-0000000000a4', '5044a100-0025-4000-8000-000000000025', 'PageSize', 'Input', 'Scalar', false, false, 'Members per page (default 50, capped at 500).'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-0025-4000-8000-0000000000a4');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-0025-4000-8000-0000000000a5', '5044a100-0025-4000-8000-000000000025', 'Result', 'Both', 'Scalar', false, false, 'JSON: { total, page, pageSize, usedTrajectory, members: [{ anchorRecordId, anchorRecordKeyJSON, normalizedScore, bandId, shape }] }. shape is null unless the rule used trajectory bounds.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-0025-4000-8000-0000000000a5');

INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
SELECT '5044a100-0025-4000-8000-0000000000c1', '5044a100-0025-4000-8000-000000000025', 'SUCCESS', true, 'Rule resolved; the count and the requested page are in Result.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionResultCode" WHERE "ID" = '5044a100-0025-4000-8000-0000000000c1');

INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
SELECT '5044a100-0025-4000-8000-0000000000c2', '5044a100-0025-4000-8000-000000000025', 'VALIDATION_ERROR', false, 'ModelID missing/not a GUID, or FilterJSON missing or not a JSON object.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionResultCode" WHERE "ID" = '5044a100-0025-4000-8000-0000000000c2');

INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
SELECT '5044a100-0025-4000-8000-0000000000c3', '5044a100-0025-4000-8000-000000000025', 'ERROR', false, 'Resolution failed (bad filter shape or a query error).'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionResultCode" WHERE "ID" = '5044a100-0025-4000-8000-0000000000c3');
