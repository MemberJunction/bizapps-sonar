-- =============================================================================
-- V202607291800__v0.5.x_Email_Cohort_Play.sql
-- =============================================================================
-- Seed "Sonar: Email Cohort" — the second exit ramp for a Sonar group: hand the whole treated
-- cohort to MJ Communications as ONE message with per-recipient merge data.
--
-- Sonar decides who needs attention and why; sending belongs to MJ. So this play owns no transport,
-- queue or retry logic — it resolves addresses off the anchor entity and calls CommunicationEngine.
-- One message to many (not one bespoke message each), because that is the shape of a campaign and
-- MJ renders the template per recipient from their ContextData.
--
-- SAFE BY DEFAULT: DryRun defaults to true (the framework's own previewOnly path), and TestRecipient
-- redirects every message to one verified address. Both matter because demo anchors carry invented
-- addresses, so a careless live run would fire hundreds of bounces at a real sending reputation.
--
-- Kind=BulkSync, so control members are never in the payload and the holdout cannot be contacted.
-- Category 'Sonar Plays' (the launch picker offers it). Type='Custom' → inherently trusted at the
-- fire-time governance gate. Idempotent; safe to re-run.
-- PG twin: migrations-pg/V202607291800__v0.5.x_Email_Cohort_Play.pg.sql
-- =============================================================================

IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = '5044A100-0026-4000-8000-000000000026')
BEGIN
    INSERT INTO [__mj].[Action] (ID, CategoryID, Name, Description, Type, CodeApprovalStatus, CodeLocked, ForceCodeGeneration, Status, DriverClass, IconClass)
    VALUES (
        '5044A100-0026-4000-8000-000000000026', '5044A100-0C00-4000-8000-00000000C0DE',
        N'Sonar: Email Cohort',
        N'Bulk play (Kind=BulkSync): hands the whole treated cohort to MJ Communications as one message, with each recipient''s name and score merged in. Sonar owns no transport — the configured MJ provider sends. DryRun defaults to TRUE (resolves and renders, sends nothing); TestRecipient redirects every message to one verified address so a real send can be proven without contacting members. Control members are never included.',
        N'Custom', N'Pending', 0, 0, N'Active', N'SonarEmailCohort', N'fa-solid fa-paper-plane'
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-0026-4000-8000-0000000000A1')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0026-4000-8000-0000000000A1', '5044A100-0026-4000-8000-000000000026', N'CohortJSON', N'Input', N'Scalar', 0, 1, N'Runner-injected: JSON array of the TREATED members ({ anchorRecordId, score, bandId }). Never includes control members.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-0026-4000-8000-0000000000A2')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0026-4000-8000-0000000000A2', '5044A100-0026-4000-8000-000000000026', N'ModelID', N'Input', N'Scalar', 0, 1, N'Runner-injected: the Score Model whose anchor entity holds each member''s name and email.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-0026-4000-8000-0000000000A3')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0026-4000-8000-0000000000A3', '5044A100-0026-4000-8000-000000000026', N'InterventionID', N'Input', N'Scalar', 0, 0, N'Runner-injected: the intervention this send belongs to.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-0026-4000-8000-0000000000A4')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0026-4000-8000-0000000000A4', '5044A100-0026-4000-8000-000000000026', N'Subject', N'Input', N'Scalar', 0, 1, N'Subject line for the message.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-0026-4000-8000-0000000000A5')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0026-4000-8000-0000000000A5', '5044A100-0026-4000-8000-000000000026', N'Body', N'Input', N'Scalar', 0, 1, N'Message body. Rendered per recipient, so merge fields can reference their ContextData: firstName, fullName, email, score.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-0026-4000-8000-0000000000A6')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0026-4000-8000-0000000000A6', '5044A100-0026-4000-8000-000000000026', N'From', N'Input', N'Scalar', 0, 1, N'Sender address. Must be verified with the provider or the send is rejected.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-0026-4000-8000-0000000000A7')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0026-4000-8000-0000000000A7', '5044A100-0026-4000-8000-000000000026', N'Provider', N'Input', N'Scalar', 0, 0, N'MJ Communication provider name (default ''SendGrid''). The provider must be Active AND its class imported at server startup.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-0026-4000-8000-0000000000A8')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0026-4000-8000-0000000000A8', '5044A100-0026-4000-8000-000000000026', N'DryRun', N'Input', N'Scalar', 0, 0, N'Defaults to TRUE. Resolves recipients and renders every message but sends nothing. Pass ''false'' to actually send.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-0026-4000-8000-0000000000A9')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0026-4000-8000-0000000000A9', '5044A100-0026-4000-8000-000000000026', N'TestRecipient', N'Input', N'Scalar', 0, 0, N'When set, every message goes to THIS address instead of the members, with each member''s real merge data — the safe way to prove a live send.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-0026-4000-8000-0000000000AA')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0026-4000-8000-0000000000AA', '5044A100-0026-4000-8000-000000000026', N'Result', N'Both', N'Scalar', 0, 0, N'JSON: { dryRun, provider, attempted, delivered, failed, skippedNoEmail, redirectedTo, firstError }.');
GO

IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = '5044A100-0026-4000-8000-0000000000C1')
    INSERT INTO [__mj].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-0026-4000-8000-0000000000C1', '5044A100-0026-4000-8000-000000000026', N'SUCCESS', 1, N'Messages previewed (dry run) or handed to the provider.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = '5044A100-0026-4000-8000-0000000000C2')
    INSERT INTO [__mj].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-0026-4000-8000-0000000000C2', '5044A100-0026-4000-8000-000000000026', N'VALIDATION_ERROR', 0, N'CohortJSON/ModelID/Subject/Body/From missing or malformed.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = '5044A100-0026-4000-8000-0000000000C3')
    INSERT INTO [__mj].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-0026-4000-8000-0000000000C3', '5044A100-0026-4000-8000-000000000026', N'NOT_FOUND', 0, N'The Score Model (or its anchor entity) could not be resolved.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = '5044A100-0026-4000-8000-0000000000C4')
    INSERT INTO [__mj].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-0026-4000-8000-0000000000C4', '5044A100-0026-4000-8000-000000000026', N'NO_RECIPIENTS', 0, N'No member in the cohort has an email address on the anchor record — nothing to send.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = '5044A100-0026-4000-8000-0000000000C5')
    INSERT INTO [__mj].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-0026-4000-8000-0000000000C5', '5044A100-0026-4000-8000-000000000026', N'PROVIDER_UNAVAILABLE', 0, N'The named provider has no Email message type registered (inactive, or its class was never imported at startup).');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = '5044A100-0026-4000-8000-0000000000C6')
    INSERT INTO [__mj].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-0026-4000-8000-0000000000C6', '5044A100-0026-4000-8000-000000000026', N'ERROR', 0, N'The send failed (provider/credential error, or a query error resolving recipients).');
GO
