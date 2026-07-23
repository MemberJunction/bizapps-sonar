-- PostgreSQL twin of migrations/V202607231100__v0.5.x_Measure_Outcomes_Action.sql. Idempotent;
-- category resolved by name (IDs can diverge across dialects).

INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "CodeApprovalStatus", "CodeLocked", "ForceCodeGeneration", "Status", "DriverClass", "IconClass")
SELECT
    '5044a100-001c-4000-8000-00000000001c',
    (SELECT "ID" FROM __mj."ActionCategory" WHERE "Name" = 'Business Apps' LIMIT 1),
    'Sonar: Measure Intervention Outcomes',
    'Fills InterventionOutcome for one intervention''s assignments (baseline = the member''s score history at assignment; outcome = current score/band movement) and returns the treatment-vs-control lift summary. Re-runnable: measured assignments are skipped; lift aggregates everything measured so far. v1 outcomes are engagement outcomes (score/band movement); business outcomes come later.',
    'Custom', 'Pending', false, false, 'Active', 'SonarMeasureOutcomes', 'fa-solid fa-scale-balanced'
WHERE NOT EXISTS (SELECT 1 FROM __mj."Action" WHERE "ID" = '5044a100-001c-4000-8000-00000000001c');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-001c-4000-8000-0000000000a1', '5044a100-001c-4000-8000-00000000001c',
    'InterventionID', 'Input', 'Scalar', false, true, 'The Intervention whose assignments to measure.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-001c-4000-8000-0000000000a1');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-001c-4000-8000-0000000000a2', '5044a100-001c-4000-8000-00000000001c',
    'Result', 'Both', 'Scalar', false, false, 'JSON MeasureResult: { measured, alreadyMeasured, unmeasurable, lift: { scoreLift, bandUpLiftPct, ... } }.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-001c-4000-8000-0000000000a2');

INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
SELECT '5044a100-001c-4000-8000-0000000000c1', '5044a100-001c-4000-8000-00000000001c', 'SUCCESS', true, 'Outcomes measured; lift summary returned.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionResultCode" WHERE "ID" = '5044a100-001c-4000-8000-0000000000c1');

INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
SELECT '5044a100-001c-4000-8000-0000000000c2', '5044a100-001c-4000-8000-00000000001c', 'VALIDATION_ERROR', false, 'InterventionID missing.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionResultCode" WHERE "ID" = '5044a100-001c-4000-8000-0000000000c2');

INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
SELECT '5044a100-001c-4000-8000-0000000000c3', '5044a100-001c-4000-8000-00000000001c', 'ERROR', false, 'Measurement failed (intervention/segment not found or write error).'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionResultCode" WHERE "ID" = '5044a100-001c-4000-8000-0000000000c3');
