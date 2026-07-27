-- PostgreSQL twin of migrations/V202607271500__v0.5.x_Sync_Cohort_Play.sql: seed the first BULK
-- play, "Sonar: Sync Cohort To List" (Intervention.Kind='BulkSync'). Fires ONCE per run with the
-- whole TREATED cohort (control members deliberately excluded) and lands it on an MJ List — staff
-- work it in the Lists app, share it, or bind a connector to it. Category row re-guarded for
-- installs that skipped V202607231300. Idempotent.

INSERT INTO __mj."ActionCategory" ("ID", "Name", "Description", "Status")
SELECT '5044a100-0c00-4000-8000-00000000c0de', 'Sonar Plays',
    'Intervention plays a Sonar operator can fire on a cohort (the launch picker shows only these).', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionCategory" WHERE "ID" = '5044a100-0c00-4000-8000-00000000c0de');

INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "CodeApprovalStatus", "CodeLocked", "ForceCodeGeneration", "Status", "DriverClass", "IconClass")
SELECT '5044a100-001e-4000-8000-00000000001e', '5044a100-0c00-4000-8000-00000000c0de',
    'Sonar: Sync Cohort To List',
    'Bulk play (Kind=BulkSync): fires once per run and lands the whole treated cohort on an MJ List, with each member''s score/band/intervention in ListDetail.AdditionalData. Staff work the list in the Lists app (row status), share it, or bind a connector to it. Control members are never included. Idempotent per member — re-runs only append new names.',
    'Custom', 'Pending', false, false, 'Active', 'SonarSyncCohortToList', 'fa-solid fa-list-ul'
WHERE NOT EXISTS (SELECT 1 FROM __mj."Action" WHERE "ID" = '5044a100-001e-4000-8000-00000000001e');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-001e-4000-8000-0000000000a1', '5044a100-001e-4000-8000-00000000001e', 'CohortJSON', 'Input', 'Scalar', false, true, 'Runner-injected: JSON array of the TREATED members ({ anchorRecordId, anchorRecordKeyJSON, score, bandId }). Never includes control members.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-001e-4000-8000-0000000000a1');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-001e-4000-8000-0000000000a2', '5044a100-001e-4000-8000-00000000001e', 'ModelID', 'Input', 'Scalar', false, true, 'Runner-injected: the Score Model whose anchor entity types the list.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-001e-4000-8000-0000000000a2');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-001e-4000-8000-0000000000a3', '5044a100-001e-4000-8000-00000000001e', 'InterventionID', 'Input', 'Scalar', false, false, 'Runner-injected: names the default list ("Sonar: <intervention name>") and rides in each row''s AdditionalData.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-001e-4000-8000-0000000000a3');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-001e-4000-8000-0000000000a4', '5044a100-001e-4000-8000-00000000001e', 'ListName', 'Input', 'Scalar', false, false, 'Optional operator override for the target list''s name. The list is found-or-created by name, so re-using a name appends to that list.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-001e-4000-8000-0000000000a4');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-001e-4000-8000-0000000000a5', '5044a100-001e-4000-8000-00000000001e', 'Result', 'Both', 'Scalar', false, false, 'JSON: { listId, listName, added, alreadyOnList }.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-001e-4000-8000-0000000000a5');

INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
SELECT '5044a100-001e-4000-8000-0000000000c1', '5044a100-001e-4000-8000-00000000001e', 'SUCCESS', true, 'Cohort synced (or already fully on the list).'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionResultCode" WHERE "ID" = '5044a100-001e-4000-8000-0000000000c1');

INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
SELECT '5044a100-001e-4000-8000-0000000000c2', '5044a100-001e-4000-8000-00000000001e', 'VALIDATION_ERROR', false, 'CohortJSON/ModelID missing or malformed.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionResultCode" WHERE "ID" = '5044a100-001e-4000-8000-0000000000c2');

INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
SELECT '5044a100-001e-4000-8000-0000000000c3', '5044a100-001e-4000-8000-00000000001e', 'ERROR', false, 'The list write failed (fully or partially) — the run reports failure so a retry re-syncs; already-synced members are skipped.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionResultCode" WHERE "ID" = '5044a100-001e-4000-8000-0000000000c3');
