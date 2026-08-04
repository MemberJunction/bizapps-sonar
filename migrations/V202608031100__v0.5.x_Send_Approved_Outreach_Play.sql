-- =============================================================================
-- V202608031100__v0.5.x_Send_Approved_Outreach_Play.sql
-- =============================================================================
-- Seed "Sonar: Send Approved Outreach" — the last step of the draft-outreach loop, through MJ
-- Communications.
--
-- Until now the Outreach tab's "Send approved" only flipped a status and called itself simulated.
-- This action actually hands each approved draft to CommunicationEngine.
--
-- WHY NOT REUSE 'Sonar: Email Cohort' (0026): that play sends ONE subject and body across many
-- recipients with merge fields, which is the shape of a campaign. These drafts are the opposite — an
-- LLM wrote each one from that member's own score story, so every proposal carries its own subject
-- and body and there is nothing to merge. This one calls SendSingleMessage per proposal instead.
--
-- SAFE BY DEFAULT, and deliberately so: this is the first Sonar code path that can reach a real
-- person. Everything before it could at worst write a wrong row.
--   * DryRun defaults to TRUE (the framework's own previewOnly path) — renders everything, sends
--     nothing, and marks nothing Executed.
--   * TestRecipient redirects every message to one verified address, so a live send can be proven
--     without contacting a member. Demo anchors carry invented addresses, so a careless live run
--     would fire bounces at a real sending reputation.
--   * Only Status='Approved' rows are eligible, so a draft nobody reviewed cannot be sent, and
--     success moves the row to 'Executed' — which is what makes a re-run unable to double-send.
--     Idempotency comes from the status filter, not from bookkeeping this action has to get right.
--   * A failed send leaves the row Approved on purpose so a retry picks it up.
--
-- Control members never had a proposal drafted (the runner excludes them), so the holdout cannot be
-- contacted by construction.
--
-- Category 'Sonar Plays'. Type='Custom' → inherently trusted at the fire-time governance gate.
-- Idempotent; safe to re-run.
-- PG twin: migrations-pg/V202608031100__v0.5.x_Send_Approved_Outreach_Play.pg.sql
-- =============================================================================

IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[Action] WHERE ID = '5044A100-0028-4000-8000-000000000028')
BEGIN
    INSERT INTO [${mjSchema}].[Action] (ID, CategoryID, Name, Description, Type, CodeApprovalStatus, CodeLocked, ForceCodeGeneration, Status, DriverClass, IconClass)
    VALUES (
        '5044A100-0028-4000-8000-000000000028', '5044A100-0C00-4000-8000-00000000C0DE',
        N'Sonar: Send Approved Outreach',
        N'Sends the APPROVED drafts for an intervention through MJ Communications, one message per proposal (each was individually written, so there is nothing to merge). DryRun defaults to TRUE (renders everything, sends nothing, marks nothing Executed); TestRecipient redirects every message to one verified address so a real send can be proven without contacting members. Only Approved rows are eligible and success moves them to Executed, so re-running cannot double-send; a failure stays Approved for retry.',
        N'Custom', N'Pending', 0, 0, N'Active', N'SonarSendApprovedOutreach', N'fa-solid fa-paper-plane'
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[ActionParam] WHERE ID = '5044A100-0028-4000-8000-0000000000A1')
    INSERT INTO [${mjSchema}].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0028-4000-8000-0000000000A1', '5044A100-0028-4000-8000-000000000028', N'InterventionID', N'Input', N'Scalar', 0, 1, N'The intervention whose APPROVED drafts should be sent. Proposals in any other status are ignored.');
GO
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[ActionParam] WHERE ID = '5044A100-0028-4000-8000-0000000000A2')
    INSERT INTO [${mjSchema}].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0028-4000-8000-0000000000A2', '5044A100-0028-4000-8000-000000000028', N'From', N'Input', N'Scalar', 0, 1, N'Sender address. Must be verified with the provider or the send is rejected.');
GO
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[ActionParam] WHERE ID = '5044A100-0028-4000-8000-0000000000A3')
    INSERT INTO [${mjSchema}].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0028-4000-8000-0000000000A3', '5044A100-0028-4000-8000-000000000028', N'Provider', N'Input', N'Scalar', 0, 0, N'MJ Communication provider name (default ''SendGrid''). The provider must be Active AND its class imported at server startup.');
GO
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[ActionParam] WHERE ID = '5044A100-0028-4000-8000-0000000000A4')
    INSERT INTO [${mjSchema}].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0028-4000-8000-0000000000A4', '5044A100-0028-4000-8000-000000000028', N'DryRun', N'Input', N'Scalar', 0, 0, N'Defaults to TRUE. Renders every approved draft but sends nothing and marks nothing Executed, so a later real run still has them. Pass ''false'' to actually send.');
GO
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[ActionParam] WHERE ID = '5044A100-0028-4000-8000-0000000000A5')
    INSERT INTO [${mjSchema}].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0028-4000-8000-0000000000A5', '5044A100-0028-4000-8000-000000000028', N'TestRecipient', N'Input', N'Scalar', 0, 0, N'When set, every message goes to THIS address instead of the member, carrying the real drafted subject and body — the safe way to prove a live send.');
GO
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[ActionParam] WHERE ID = '5044A100-0028-4000-8000-0000000000A6')
    INSERT INTO [${mjSchema}].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0028-4000-8000-0000000000A6', '5044A100-0028-4000-8000-000000000028', N'Result', N'Both', N'Scalar', 0, 0, N'JSON: { dryRun, provider, approved, sent, failed, skippedNoEmail, redirectedTo, firstError }.');
GO

IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[ActionResultCode] WHERE ID = '5044A100-0028-4000-8000-0000000000C1')
    INSERT INTO [${mjSchema}].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-0028-4000-8000-0000000000C1', '5044A100-0028-4000-8000-000000000028', N'SUCCESS', 1, N'Approved drafts previewed (dry run) or handed to the provider.');
GO
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[ActionResultCode] WHERE ID = '5044A100-0028-4000-8000-0000000000C2')
    INSERT INTO [${mjSchema}].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-0028-4000-8000-0000000000C2', '5044A100-0028-4000-8000-000000000028', N'VALIDATION_ERROR', 0, N'InterventionID missing/not a GUID, or From missing.');
GO
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[ActionResultCode] WHERE ID = '5044A100-0028-4000-8000-0000000000C3')
    INSERT INTO [${mjSchema}].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-0028-4000-8000-0000000000C3', '5044A100-0028-4000-8000-000000000028', N'NO_RECIPIENTS', 0, N'Approved drafts exist but none carry a usable recipient address, subject and body.');
GO
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[ActionResultCode] WHERE ID = '5044A100-0028-4000-8000-0000000000C4')
    INSERT INTO [${mjSchema}].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-0028-4000-8000-0000000000C4', '5044A100-0028-4000-8000-000000000028', N'PROVIDER_UNAVAILABLE', 0, N'The named provider has no Email message type registered — check it is Active in MJ and its class is imported at server startup.');
GO
IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[ActionResultCode] WHERE ID = '5044A100-0028-4000-8000-0000000000C5')
    INSERT INTO [${mjSchema}].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-0028-4000-8000-0000000000C5', '5044A100-0028-4000-8000-000000000028', N'ERROR', 0, N'Unexpected failure while loading or sending the approved drafts.');
GO
