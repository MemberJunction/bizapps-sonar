-- PostgreSQL twin of migrations/V202607281100__v0.5.x_Draft_Outreach_Play.sql: seed the first
-- PER-MEMBER play, "Sonar: Draft Outreach" (Intervention.Kind='Action') — an AI prompt drafts one
-- grounded outreach email per treated member, saved as an InterventionProposal awaiting human
-- review. Sends nothing. Plus its Template/TemplateContent and the 'Sonar: Outreach Drafter'
-- AIPrompt (no model pin; host registry picks). Category row re-guarded. Idempotent.

INSERT INTO __mj."ActionCategory" ("ID", "Name", "Description", "Status")
SELECT '5044a100-0c00-4000-8000-00000000c0de', 'Sonar Plays',
    'Intervention plays a Sonar operator can fire on a cohort (the launch picker shows only these).', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionCategory" WHERE "ID" = '5044a100-0c00-4000-8000-00000000c0de');

INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "CodeApprovalStatus", "CodeLocked", "ForceCodeGeneration", "Status", "DriverClass", "IconClass")
SELECT '5044a100-0021-4000-8000-000000000021', '5044a100-0c00-4000-8000-00000000c0de',
    'Sonar: Draft Outreach',
    'Per-member play (Kind=Action): for each treated member, an AI prompt drafts a short personalized outreach email grounded ONLY in that member''s score facts (band, delta, factor contributions, dominant cause) and saves it as an Intervention Proposal awaiting human review in the Outreach queue. Sends nothing. Idempotent per (intervention, member) — a re-fire returns the existing proposal.',
    'Custom', 'Pending', false, false, 'Active', 'SonarDraftOutreach', 'fa-solid fa-envelope-open-text'
WHERE NOT EXISTS (SELECT 1 FROM __mj."Action" WHERE "ID" = '5044a100-0021-4000-8000-000000000021');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-0021-4000-8000-0000000000a1', '5044a100-0021-4000-8000-000000000021', 'AnchorRecordID', 'Input', 'Scalar', false, true, 'The treated member — set the value to the {{member}} token so the runner fills it per fire.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-0021-4000-8000-0000000000a1');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-0021-4000-8000-0000000000a2', '5044a100-0021-4000-8000-000000000021', 'InterventionID', 'Input', 'Scalar', false, true, 'The firing intervention (links the proposal back) — set the value to the {{interventionId}} token.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-0021-4000-8000-0000000000a2');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-0021-4000-8000-0000000000a3', '5044a100-0021-4000-8000-000000000021', 'ModelID', 'Input', 'Scalar', false, true, 'The score model whose facts ground the draft — set the value to the {{modelId}} token.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-0021-4000-8000-0000000000a3');

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-0021-4000-8000-0000000000a4', '5044a100-0021-4000-8000-000000000021', 'Result', 'Both', 'Scalar', false, false, 'JSON: { proposalId, existing, subject }.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-0021-4000-8000-0000000000a4');

INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
SELECT '5044a100-0021-4000-8000-0000000000c1', '5044a100-0021-4000-8000-000000000021', 'SUCCESS', true, 'Proposal drafted (or already existed for this intervention + member).'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionResultCode" WHERE "ID" = '5044a100-0021-4000-8000-0000000000c1');

INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
SELECT '5044a100-0021-4000-8000-0000000000c2', '5044a100-0021-4000-8000-000000000021', 'VALIDATION_ERROR', false, 'AnchorRecordID/InterventionID/ModelID missing or malformed.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionResultCode" WHERE "ID" = '5044a100-0021-4000-8000-0000000000c2');

INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
SELECT '5044a100-0021-4000-8000-0000000000c3', '5044a100-0021-4000-8000-000000000021', 'NOT_FOUND', false, 'The member has no score on this model (or the model/anchor is missing).'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionResultCode" WHERE "ID" = '5044a100-0021-4000-8000-0000000000c3');

INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
SELECT '5044a100-0021-4000-8000-0000000000c4', '5044a100-0021-4000-8000-000000000021', 'ERROR', false, 'Drafting failed (prompt missing/failed or the proposal row could not be saved). The runner records the member as Failed; a later re-run re-drafts only missing members.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionResultCode" WHERE "ID" = '5044a100-0021-4000-8000-0000000000c4');

INSERT INTO __mj."Template" ("ID", "Name", "Description", "UserID", "IsActive")
SELECT '5044a100-0022-4000-8000-000000000022',
    'Sonar: Outreach Drafter',
    'Instructions for the Draft Outreach play''s drafter prompt: one grounded, human-reviewable outreach email per treated member.',
    'ecafccec-6a37-ef11-86d4-000d3a4e707e', -- MJ core System user (same owner as the seeded authoring-agent template)
    true
WHERE NOT EXISTS (SELECT 1 FROM __mj."Template" WHERE "ID" = '5044a100-0022-4000-8000-000000000022');

INSERT INTO __mj."TemplateContent" ("ID", "TemplateID", "TypeID", "TemplateText", "Priority", "IsActive")
SELECT '5044a100-0023-4000-8000-000000000023',
    '5044a100-0022-4000-8000-000000000022',
    'e7afccec-6a37-ef11-86d4-000d3a4e707e', -- Template Content Type: Text
    'You are the outreach drafter for {{ modelName }}, an engagement program run by a member organization. A staff member reviews everything you write before anything is sent; nothing goes out automatically.

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
    true
WHERE NOT EXISTS (SELECT 1 FROM __mj."TemplateContent" WHERE "ID" = '5044a100-0023-4000-8000-000000000023');

INSERT INTO __mj."AIPrompt" (
    "ID", "Name", "Description", "TemplateID", "TypeID", "Status", "ResponseFormat",
    "AIModelTypeID", "MinPowerRank", "SelectionStrategy", "PowerPreference",
    "OutputType", "ValidationBehavior", "PromptRole", "PromptPosition",
    "FailoverStrategy", "FailoverMaxAttempts", "FailoverDelaySeconds"
)
SELECT '5044a100-0024-4000-8000-000000000024',
    'Sonar: Outreach Drafter',
    'Drafts one grounded outreach email per treated member for the Draft Outreach play. Returns strict JSON { subject, body, rationale }; the play parses defensively and a human approves before anything is sent.',
    '5044a100-0022-4000-8000-000000000022',
    'a6da423e-f36b-1410-8dac-00021f8b792e', -- AI Prompt Type: Chat
    'Active', 'Any',
    'e8a5ccec-6a37-ef11-86d4-000d3a4e707e', -- AI Model Type: LLM
    15, 'Default', 'Highest',
    'string', 'Warn', 'System', 'First',
    'SameModelDifferentVendor', 3, 5
WHERE NOT EXISTS (SELECT 1 FROM __mj."AIPrompt" WHERE "ID" = '5044a100-0024-4000-8000-000000000024');
