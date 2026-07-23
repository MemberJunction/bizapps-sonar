-- Seeds the `Sonar: Run Intervention` action — PostgreSQL twin of
-- migrations/V202607221100__v0.5.x_Run_Intervention_Action.sql. Idempotent (ON CONFLICT DO NOTHING
-- keyed on the hand-assigned IDs); category resolved by name (IDs can diverge across dialects).

INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "CodeApprovalStatus", "CodeLocked", "ForceCodeGeneration", "Status", "DriverClass", "IconClass")
SELECT
    '5044a100-001b-4000-8000-00000000001b',
    (SELECT "ID" FROM __mj."ActionCategory" WHERE "Name" = 'Business Apps' LIMIT 1),
    'Sonar: Run Intervention',
    'The action layer''s entry point: find-or-creates an ad-hoc ScoreSegment (band/score filter) and an Intervention (segment + chosen MJ Action + holdout %), then runs it. preview:true returns cohort/treated/held counts without writing or firing; preview:false writes one InterventionAssignment per member and fires the Action for each Treatment member (Control is held out). Idempotent: already-assigned members are never re-fired.',
    'Custom', 'Pending', false, false, 'Active', 'SonarRunIntervention', 'fa-solid fa-bullhorn'
WHERE NOT EXISTS (SELECT 1 FROM __mj."Action" WHERE "ID" = '5044a100-001b-4000-8000-00000000001b');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT
    '5044a100-001b-4000-8000-0000000000a1', '5044a100-001b-4000-8000-00000000001b',
    'ConfigJSON', 'Input', 'Scalar', false, true,
    'JSON: { modelId, segment:{name,filter:{bandId?,minScore?,maxScore?}}, intervention:{name,holdoutPercent}, action:{actionId,params[]}, cap, preview }.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-001b-4000-8000-0000000000a1');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT
    '5044a100-001b-4000-8000-0000000000a2', '5044a100-001b-4000-8000-00000000001b',
    'Result', 'Both', 'Scalar', false, false,
    'JSON InterventionRunResult: { cohortSize, alreadyAssigned, eligible, capped, treated, held, sent, failed, preview }.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-001b-4000-8000-0000000000a2');

INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
SELECT '5044a100-001b-4000-8000-0000000000c1', '5044a100-001b-4000-8000-00000000001b', 'SUCCESS', true, 'Intervention run (or previewed) successfully.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionResultCode" WHERE "ID" = '5044a100-001b-4000-8000-0000000000c1');

INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
SELECT '5044a100-001b-4000-8000-0000000000c2', '5044a100-001b-4000-8000-00000000001b', 'VALIDATION_ERROR', false, 'ConfigJSON missing or malformed.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionResultCode" WHERE "ID" = '5044a100-001b-4000-8000-0000000000c2');

INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
SELECT '5044a100-001b-4000-8000-0000000000c3', '5044a100-001b-4000-8000-00000000001b', 'ERROR', false, 'The run failed (segment/intervention create or engine error).'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionResultCode" WHERE "ID" = '5044a100-001b-4000-8000-0000000000c3');
