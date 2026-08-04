-- PostgreSQL twin of migrations/V202608021500__v0.5.x_Email_Cohort_Play.sql: seed
-- "Sonar: Email Cohort", the second exit ramp for a Sonar group — hand the treated cohort to MJ
-- Communications as one message with per-recipient merge data. DryRun defaults to true and
-- TestRecipient redirects to one address, because demo anchors carry invented emails. Idempotent.

INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "CodeApprovalStatus", "CodeLocked", "ForceCodeGeneration", "Status", "DriverClass", "IconClass")
SELECT '5044a100-0026-4000-8000-000000000026', '5044a100-0c00-4000-8000-00000000c0de',
    'Sonar: Email Cohort',
    'Bulk play (Kind=BulkSync): hands the whole treated cohort to MJ Communications as one message, with each recipient''''s name and score merged in. Sonar owns no transport — the configured MJ provider sends. DryRun defaults to TRUE (resolves and renders, sends nothing); TestRecipient redirects every message to one verified address so a real send can be proven without contacting members. Control members are never included.',
    'Custom', 'Pending', false, false, 'Active', 'SonarEmailCohort', 'fa-solid fa-paper-plane'
WHERE NOT EXISTS (SELECT 1 FROM __mj."Action" WHERE "ID" = '5044a100-0026-4000-8000-000000000026');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-0026-4000-8000-0000000000a1', '5044a100-0026-4000-8000-000000000026', 'CohortJSON', 'Input', 'Scalar', false, true, 'Runner-injected: JSON array of the TREATED members ({ anchorRecordId, score, bandId }). Never includes control members.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-0026-4000-8000-0000000000a1');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-0026-4000-8000-0000000000a2', '5044a100-0026-4000-8000-000000000026', 'ModelID', 'Input', 'Scalar', false, true, 'Runner-injected: the Score Model whose anchor entity holds each member''s name and email.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-0026-4000-8000-0000000000a2');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-0026-4000-8000-0000000000a3', '5044a100-0026-4000-8000-000000000026', 'InterventionID', 'Input', 'Scalar', false, false, 'Runner-injected: the intervention this send belongs to.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-0026-4000-8000-0000000000a3');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-0026-4000-8000-0000000000a4', '5044a100-0026-4000-8000-000000000026', 'Subject', 'Input', 'Scalar', false, true, 'Subject line for the message.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-0026-4000-8000-0000000000a4');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-0026-4000-8000-0000000000a5', '5044a100-0026-4000-8000-000000000026', 'Body', 'Input', 'Scalar', false, true, 'Message body. Rendered per recipient, so merge fields can reference their ContextData: firstName, fullName, email, score.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-0026-4000-8000-0000000000a5');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-0026-4000-8000-0000000000a6', '5044a100-0026-4000-8000-000000000026', 'From', 'Input', 'Scalar', false, true, 'Sender address. Must be verified with the provider or the send is rejected.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-0026-4000-8000-0000000000a6');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-0026-4000-8000-0000000000a7', '5044a100-0026-4000-8000-000000000026', 'Provider', 'Input', 'Scalar', false, false, 'MJ Communication provider name (default ''SendGrid''). The provider must be Active AND its class imported at server startup.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-0026-4000-8000-0000000000a7');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-0026-4000-8000-0000000000a8', '5044a100-0026-4000-8000-000000000026', 'DryRun', 'Input', 'Scalar', false, false, 'Defaults to TRUE. Resolves recipients and renders every message but sends nothing. Pass ''false'' to actually send.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-0026-4000-8000-0000000000a8');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-0026-4000-8000-0000000000a9', '5044a100-0026-4000-8000-000000000026', 'TestRecipient', 'Input', 'Scalar', false, false, 'When set, every message goes to THIS address instead of the members, with each member''s real merge data — the safe way to prove a live send.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-0026-4000-8000-0000000000a9');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-0026-4000-8000-0000000000aa', '5044a100-0026-4000-8000-000000000026', 'Result', 'Both', 'Scalar', false, false, 'JSON: { dryRun, provider, attempted, delivered, failed, skippedNoEmail, redirectedTo, firstError }.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-0026-4000-8000-0000000000aa');

INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
SELECT '5044a100-0026-4000-8000-0000000000c1', '5044a100-0026-4000-8000-000000000026', 'SUCCESS', true, 'Messages previewed (dry run) or handed to the provider.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionResultCode" WHERE "ID" = '5044a100-0026-4000-8000-0000000000c1');

INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
SELECT '5044a100-0026-4000-8000-0000000000c2', '5044a100-0026-4000-8000-000000000026', 'VALIDATION_ERROR', false, 'CohortJSON/ModelID/Subject/Body/From missing or malformed.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionResultCode" WHERE "ID" = '5044a100-0026-4000-8000-0000000000c2');

INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
SELECT '5044a100-0026-4000-8000-0000000000c3', '5044a100-0026-4000-8000-000000000026', 'NOT_FOUND', false, 'The Score Model (or its anchor entity) could not be resolved.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionResultCode" WHERE "ID" = '5044a100-0026-4000-8000-0000000000c3');

INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
SELECT '5044a100-0026-4000-8000-0000000000c4', '5044a100-0026-4000-8000-000000000026', 'NO_RECIPIENTS', false, 'No member in the cohort has an email address on the anchor record — nothing to send.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionResultCode" WHERE "ID" = '5044a100-0026-4000-8000-0000000000c4');

INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
SELECT '5044a100-0026-4000-8000-0000000000c5', '5044a100-0026-4000-8000-000000000026', 'PROVIDER_UNAVAILABLE', false, 'The named provider has no Email message type registered (inactive, or its class was never imported at startup).'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionResultCode" WHERE "ID" = '5044a100-0026-4000-8000-0000000000c5');

INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
SELECT '5044a100-0026-4000-8000-0000000000c6', '5044a100-0026-4000-8000-000000000026', 'ERROR', false, 'The send failed (provider/credential error, or a query error resolving recipients).'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionResultCode" WHERE "ID" = '5044a100-0026-4000-8000-0000000000c6');
