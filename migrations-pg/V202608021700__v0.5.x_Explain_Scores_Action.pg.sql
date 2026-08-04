-- PostgreSQL twin of migrations/V202608021700__v0.5.x_Explain_Scores_Action.sql: seed
-- "Sonar: Explain Scores", which returns WHY each of a set of Score rows is low (the signal dragging
-- the member down most, ranked on the rubric weight so a MISSING signal can be named). Computed
-- server-side on purpose: the same ranking is what a targeting rule selects on, so a browser-side
-- copy would be a second definition of the reason that could drift from the engine's.
-- Read-only. Category 'Business Apps' (a tool, not a play). Idempotent.

INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "CodeApprovalStatus", "CodeLocked", "ForceCodeGeneration", "Status", "DriverClass", "IconClass")
SELECT '5044a100-0027-4000-8000-000000000027',
    (SELECT "ID" FROM __mj."ActionCategory" WHERE "Name" = 'Business Apps' LIMIT 1),
    'Sonar: Explain Scores',
    'For a set of Score rows, returns WHY each member is low: the signal dragging them down most, as a short label ("Low Event Registrations" / "No Event Registrations"), plus the factor behind it and whether that signal had any data at all. Ranked on the rubric weight, not the realized percentage, so a MISSING signal can be named as the reason. Read-only. Backs the Why column on member lists that are not resolved from a targeting rule; use Sonar: Preview Segment when there IS a rule, which returns the same labels with the cohort.',
    'Custom', 'Pending', false, false, 'Active', 'SonarExplainScores', 'fa-solid fa-circle-question'
WHERE NOT EXISTS (SELECT 1 FROM __mj."Action" WHERE "ID" = '5044a100-0027-4000-8000-000000000027');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-0027-4000-8000-0000000000a1', '5044a100-0027-4000-8000-000000000027', 'ScoreIDsJSON', 'Input', 'Scalar', false, true, 'JSON array of Score.ID values to explain (maximum 500 per call). Non-GUID entries and duplicates are ignored; an empty array succeeds with an empty result rather than failing.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-0027-4000-8000-0000000000a1');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-0027-4000-8000-0000000000a2', '5044a100-0027-4000-8000-000000000027', 'Result', 'Both', 'Scalar', false, false, 'JSON: { reasons: [{ scoreId, reasonLabel, dominantFactorId, hadData }] }. reasonLabel is null when nothing is dragging the member down (they are doing fine on every signal) or when no contributions are on record. hadData false = that signal has NO records for the member, so the low score is a data gap to fix rather than a person to contact.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-0027-4000-8000-0000000000a2');

INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
SELECT '5044a100-0027-4000-8000-0000000000c1', '5044a100-0027-4000-8000-000000000027', 'SUCCESS', true, 'Reasons resolved (including the empty-input case).'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionResultCode" WHERE "ID" = '5044a100-0027-4000-8000-0000000000c1');

INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
SELECT '5044a100-0027-4000-8000-0000000000c2', '5044a100-0027-4000-8000-000000000027', 'VALIDATION_ERROR', false, 'ScoreIDsJSON missing, not a JSON array, or over the 500-id limit.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionResultCode" WHERE "ID" = '5044a100-0027-4000-8000-0000000000c2');

INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
SELECT '5044a100-0027-4000-8000-0000000000c3', '5044a100-0027-4000-8000-000000000027', 'ERROR', false, 'A query error while reading contributions, factors, or rubric weights.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionResultCode" WHERE "ID" = '5044a100-0027-4000-8000-0000000000c3');
