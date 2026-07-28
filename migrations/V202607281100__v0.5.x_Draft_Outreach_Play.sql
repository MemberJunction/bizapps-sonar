-- =============================================================================
-- V202607281100__v0.5.x_Draft_Outreach_Play.sql
-- =============================================================================
-- Seed "Sonar: Draft Outreach" — the first PER-MEMBER play (Intervention.Kind='Action') that
-- produces a reviewable artifact: for each treated member, an AI Prompt drafts a short outreach
-- email grounded in that member's score facts, persisted as an InterventionProposal
-- (Status='Proposed') awaiting human review in the Outreach queue. The play sends NOTHING.
--
-- Three pieces, in FK order:
--   1. The play (Action 0021, category 'Sonar Plays', Type='Custom' → inherently trusted at the
--      fire-time governance gate). Its params are pointed at runner tokens by the launch flow:
--      AnchorRecordID='{{member}}', InterventionID='{{interventionId}}', ModelID='{{modelId}}'.
--   2. The prompt's Template + TemplateContent (0022/0023) — the drafter's instructions.
--   3. The AIPrompt row (0024, 'Sonar: Outreach Drafter') the play executes via AIPromptRunner.
--      Model selection mirrors the authoring agent's prompt: no pin, host registry picks
--      (SelectionStrategy='Default', MinPowerRank 15, PowerPreference 'Highest').
--
-- Idempotent (guarded per row); safe to re-run. Also re-guards the 'Sonar Plays' category.
-- PG twin: migrations-pg/V202607281100__v0.5.x_Draft_Outreach_Play.pg.sql
-- =============================================================================

-- ============================================================ 1. The play
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionCategory] WHERE ID = '5044A100-0C00-4000-8000-00000000C0DE')
BEGIN
    INSERT INTO [__mj].[ActionCategory] (ID, Name, Description, Status)
    VALUES ('5044A100-0C00-4000-8000-00000000C0DE', N'Sonar Plays', N'Intervention plays a Sonar operator can fire on a cohort (the launch picker shows only these).', N'Active');
END
GO

IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = '5044A100-0021-4000-8000-000000000021')
BEGIN
    INSERT INTO [__mj].[Action] (ID, CategoryID, Name, Description, Type, CodeApprovalStatus, CodeLocked, ForceCodeGeneration, Status, DriverClass, IconClass)
    VALUES (
        '5044A100-0021-4000-8000-000000000021', '5044A100-0C00-4000-8000-00000000C0DE',
        N'Sonar: Draft Outreach',
        N'Per-member play (Kind=Action): for each treated member, an AI prompt drafts a short personalized outreach email grounded ONLY in that member''s score facts (band, delta, factor contributions, dominant cause) and saves it as an Intervention Proposal awaiting human review in the Outreach queue. Sends nothing. Idempotent per (intervention, member) — a re-fire returns the existing proposal.',
        N'Custom', N'Pending', 0, 0, N'Active', N'SonarDraftOutreach', N'fa-solid fa-envelope-open-text'
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-0021-4000-8000-0000000000A1')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0021-4000-8000-0000000000A1', '5044A100-0021-4000-8000-000000000021', N'AnchorRecordID', N'Input', N'Scalar', 0, 1, N'The treated member — set the value to the {{member}} token so the runner fills it per fire.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-0021-4000-8000-0000000000A2')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0021-4000-8000-0000000000A2', '5044A100-0021-4000-8000-000000000021', N'InterventionID', N'Input', N'Scalar', 0, 1, N'The firing intervention (links the proposal back) — set the value to the {{interventionId}} token.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-0021-4000-8000-0000000000A3')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0021-4000-8000-0000000000A3', '5044A100-0021-4000-8000-000000000021', N'ModelID', N'Input', N'Scalar', 0, 1, N'The score model whose facts ground the draft — set the value to the {{modelId}} token.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-0021-4000-8000-0000000000A4')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0021-4000-8000-0000000000A4', '5044A100-0021-4000-8000-000000000021', N'Result', N'Both', N'Scalar', 0, 0, N'JSON: { proposalId, existing, subject }.');
GO

IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = '5044A100-0021-4000-8000-0000000000C1')
    INSERT INTO [__mj].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-0021-4000-8000-0000000000C1', '5044A100-0021-4000-8000-000000000021', N'SUCCESS', 1, N'Proposal drafted (or already existed for this intervention + member).');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = '5044A100-0021-4000-8000-0000000000C2')
    INSERT INTO [__mj].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-0021-4000-8000-0000000000C2', '5044A100-0021-4000-8000-000000000021', N'VALIDATION_ERROR', 0, N'AnchorRecordID/InterventionID/ModelID missing or malformed.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = '5044A100-0021-4000-8000-0000000000C3')
    INSERT INTO [__mj].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-0021-4000-8000-0000000000C3', '5044A100-0021-4000-8000-000000000021', N'NOT_FOUND', 0, N'The member has no score on this model (or the model/anchor is missing).');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = '5044A100-0021-4000-8000-0000000000C4')
    INSERT INTO [__mj].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-0021-4000-8000-0000000000C4', '5044A100-0021-4000-8000-000000000021', N'ERROR', 0, N'Drafting failed (prompt missing/failed or the proposal row could not be saved). The runner records the member as Failed; a later re-run re-drafts only missing members.');
GO

-- ============================================================ 2. Template + content
IF NOT EXISTS (SELECT 1 FROM [__mj].[Template] WHERE ID = '5044A100-0022-4000-8000-000000000022')
BEGIN
    INSERT INTO [__mj].[Template] (ID, Name, Description, UserID, IsActive)
    VALUES (
        '5044A100-0022-4000-8000-000000000022',
        N'Sonar: Outreach Drafter',
        N'Instructions for the Draft Outreach play''s drafter prompt: one grounded, human-reviewable outreach email per treated member.',
        'ECAFCCEC-6A37-EF11-86D4-000D3A4E707E', -- MJ core System user (same owner as the seeded authoring-agent template)
        1
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM [__mj].[TemplateContent] WHERE ID = '5044A100-0023-4000-8000-000000000023')
BEGIN
    INSERT INTO [__mj].[TemplateContent] (ID, TemplateID, TypeID, TemplateText, Priority, IsActive)
    VALUES (
        '5044A100-0023-4000-8000-000000000023',
        '5044A100-0022-4000-8000-000000000022',
        'E7AFCCEC-6A37-EF11-86D4-000D3A4E707E', -- Template Content Type: Text
        N'You are the outreach drafter for {{ modelName }}, an engagement program run by a member organization. A staff member reviews everything you write before anything is sent; nothing goes out automatically.

Write a short, warm, personal outreach email to {{ memberName }}. It must read like a colleague wrote it: plain language, no marketing tone, no exclamation marks, roughly 100-130 words.

Ground the message in ONLY these facts. Never invent offers, discounts, events, dates, or any other detail:
- Engagement standing: {{ bandName }} band, score {{ score }}/100, recent change {{ delta }}
- Main driver: {{ dominantCause }}
- Factor detail:
{{ factorLines }}

Guidance:
- Reference the main driver naturally (for example lapsed event attendance). Never mention scores, bands, data, monitoring, systems, or AI.
- Make the member feel noticed and invite ONE concrete low-effort next step (a reply, a quick call, a look at upcoming programming) chosen to fit the main driver.

Answer with STRICT JSON only - no markdown fence, no commentary:
{"subject": "<email subject>", "body": "<email body, use \n for line breaks>", "rationale": "<one sentence for the reviewing staff member: why this member and why this angle>"}',
        1,
        1
    );
END
GO

-- ============================================================ 3. The AI Prompt
IF NOT EXISTS (SELECT 1 FROM [__mj].[AIPrompt] WHERE ID = '5044A100-0024-4000-8000-000000000024')
BEGIN
    INSERT INTO [__mj].[AIPrompt] (
        ID, Name, Description, TemplateID, TypeID, Status, ResponseFormat,
        AIModelTypeID, MinPowerRank, SelectionStrategy, PowerPreference,
        OutputType, ValidationBehavior, PromptRole, PromptPosition,
        FailoverStrategy, FailoverMaxAttempts, FailoverDelaySeconds
    )
    VALUES (
        '5044A100-0024-4000-8000-000000000024',
        N'Sonar: Outreach Drafter',
        N'Drafts one grounded outreach email per treated member for the Draft Outreach play. Returns strict JSON { subject, body, rationale }; the play parses defensively and a human approves before anything is sent.',
        '5044A100-0022-4000-8000-000000000022',
        'A6DA423E-F36B-1410-8DAC-00021F8B792E', -- AI Prompt Type: Chat
        N'Active', N'Any',
        'E8A5CCEC-6A37-EF11-86D4-000D3A4E707E', -- AI Model Type: LLM
        15, N'Default', N'Highest',
        N'string', N'Warn', N'System', N'First',
        N'SameModelDifferentVendor', 3, 5
    );
END
GO
