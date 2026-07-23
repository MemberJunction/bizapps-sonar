-- PostgreSQL twin of migrations/V202607231300__v0.5.x_Worklist_Play.sql: the "Sonar Plays" category
-- + the self-contained "Sonar: Add to Worklist" play. Idempotent.

INSERT INTO __mj."ActionCategory" ("ID", "Name", "Description", "Status")
SELECT '5044a100-0c00-4000-8000-00000000c0de', 'Sonar Plays',
    'Intervention plays a Sonar operator can fire on a cohort (the launch picker shows only these).', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionCategory" WHERE "ID" = '5044a100-0c00-4000-8000-00000000c0de');

INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "CodeApprovalStatus", "CodeLocked", "ForceCodeGeneration", "Status", "DriverClass", "IconClass")
SELECT '5044a100-001d-4000-8000-00000000001d', '5044a100-0c00-4000-8000-00000000c0de',
    'Sonar: Add to Worklist',
    'The zero-dependency intervention play: firing it queues a treated member onto the Sonar follow-up worklist (worked in the Interventions tab — mark Contacted/Done). The assignment row is the artifact; no external system.',
    'Custom', 'Pending', false, false, 'Active', 'SonarAddToWorklist', 'fa-solid fa-list-check'
WHERE NOT EXISTS (SELECT 1 FROM __mj."Action" WHERE "ID" = '5044a100-001d-4000-8000-00000000001d');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-001d-4000-8000-0000000000a1', '5044a100-001d-4000-8000-00000000001d', 'AnchorRecordID', 'Input', 'Scalar', false, false, 'The member being queued onto the worklist.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-001d-4000-8000-0000000000a1');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-001d-4000-8000-0000000000a2', '5044a100-001d-4000-8000-00000000001d', 'Result', 'Both', 'Scalar', false, false, 'JSON: { queued, anchorRecordId }.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-001d-4000-8000-0000000000a2');

INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
SELECT '5044a100-001d-4000-8000-0000000000c1', '5044a100-001d-4000-8000-00000000001d', 'SUCCESS', true, 'Member queued onto the worklist.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionResultCode" WHERE "ID" = '5044a100-001d-4000-8000-0000000000c1');
