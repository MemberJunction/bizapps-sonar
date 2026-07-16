-- =============================================================================
-- Sonar - Application Metadata Seed (v0.1.x)
-- =============================================================================
-- Seeds the app-level configuration metadata that mj-sync manages in dev but
-- that `mj app install` does NOT load from metadata/ (install runs migrations
-- only). Runs AFTER the schema migrations, which already create the schema,
-- register the 14 Sonar entities in __mj.Entity, and seed the Application +
-- ApplicationEntity rows.
--
-- Contents (182 records): Score Band Sets/Bands, Time Windows, 23 Actions
-- (+ params + result codes), 3 stored Queries, 1 Remote Operation, Schema Info,
-- and the Sonar Authoring Agent (Template + TemplateContent + AI Prompt + AI
-- Agent + AI Agent Prompt). The agent ships WITHOUT a pinned model
-- (RequireSpecificModels = 0), so it runs on whatever AI model the host has
-- configured (see README requirements).
--
-- Schema conventions (matching the schema migrations):
--   - ${flyway:defaultSchema}  = the Sonar schema (resolves to __mj_BizAppsSonar)
--   - __mj                     = the MemberJunction core schema (always __mj)
--
-- SOURCE OF TRUTH / REGEN --------------------------------------------------
-- This file is a GENERATED SNAPSHOT. The editable, round-trippable source is
-- the mj-sync metadata under metadata/ (score-band-sets, score-bands,
-- time-windows, actions, queries, remote-operations, templates, prompts,
-- agents). Those dirs stay the place you author config. This migration only
-- exists because `mj app install` does not process metadata/.
--
-- If you change any of those records, you MUST regenerate this file, or a
-- fresh install ships stale config while dev (mj sync push) shows the new:
--   1. In metadata/.mj-sync.json set sqlLogging.formatAsMigration = true
--   2. `mj sync push` against a CLEAN MJ core (fresh DB, core migrated) to
--      emit metadata/sql_logging/MetadataSync_Push_*.sql
--   3. Schema-swap it: __mj_BizAppsSonar -> ${flyway:defaultSchema} and the
--      core placeholder -> literal __mj (mj-sync emits the inverse convention:
--      core as the placeholder, Sonar schema hardcoded)
--   4. Re-add the IF NOT EXISTS guard around every spCreate (see below)
--   5. Set formatAsMigration back to false
--
-- IDEMPOTENCY --------------------------------------------------------------
-- Every spCreate is wrapped in `IF NOT EXISTS (... WHERE ID = @id)` so this
-- migration is safe to run against a dev DB already loaded via `mj sync push`
-- (the documented dev flow). Without the guard, re-running spCreate with the
-- hardcoded IDs throws PK violations. spUpdate calls are left unguarded (an
-- update on an existing row is already idempotent). A clean install has none
-- of these records, so every guard passes and all rows are created.
-- =============================================================================

-- Save MJ: Schema Info (core SP call only)
DECLARE @ID_e7e3967e UNIQUEIDENTIFIER,
@SchemaName_e7e3967e NVARCHAR(50),
@EntityIDMin_e7e3967e INT,
@EntityIDMax_e7e3967e INT,
@Comments_e7e3967e NVARCHAR(MAX),
@Description_e7e3967e NVARCHAR(MAX),
@EntityNamePrefix_e7e3967e NVARCHAR(25),
@EntityNameSuffix_e7e3967e NVARCHAR(25),
@CanonicalSchemaName_e7e3967e NVARCHAR(50)
SET
  @ID_e7e3967e = '005DDE0A-555D-4F40-AA93-3AA64E444C19'
SET
  @SchemaName_e7e3967e = N'__sonar'
SET
  @EntityIDMin_e7e3967e = 1
SET
  @EntityIDMax_e7e3967e = 1000000
SET
  @Description_e7e3967e = N'Sonar: Configurable engagement scoring engine'
SET
  @EntityNamePrefix_e7e3967e = N'Sonar: ' IF NOT EXISTS (SELECT 1 FROM [__mj].[SchemaInfo] WHERE ID = @ID_e7e3967e)
EXEC [__mj].spCreateSchemaInfo @ID = @ID_e7e3967e,
  @SchemaName = @SchemaName_e7e3967e,
  @EntityIDMin = @EntityIDMin_e7e3967e,
  @EntityIDMax = @EntityIDMax_e7e3967e,
  @Comments = @Comments_e7e3967e,
  @Comments_Clear = 1,
  @Description = @Description_e7e3967e,
  @EntityNamePrefix = @EntityNamePrefix_e7e3967e,
  @EntityNameSuffix = @EntityNameSuffix_e7e3967e,
  @EntityNameSuffix_Clear = 1,
  @CanonicalSchemaName = @CanonicalSchemaName_e7e3967e,
  @CanonicalSchemaName_Clear = 1;

GO

-- Save MJ: Applications (core SP call only)
DECLARE @Name_6f1aa540 NVARCHAR(100),
@Description_6f1aa540 NVARCHAR(MAX),
@Icon_6f1aa540 NVARCHAR(500),
@DefaultForNewUser_6f1aa540 BIT,
@SchemaAutoAddNewEntities_6f1aa540 NVARCHAR(MAX),
@Color_6f1aa540 NVARCHAR(20),
@DefaultNavItems_6f1aa540 NVARCHAR(MAX),
@ClassName_6f1aa540 NVARCHAR(255),
@DefaultSequence_6f1aa540 INT,
@Status_6f1aa540 NVARCHAR(20),
@NavigationStyle_6f1aa540 NVARCHAR(20),
@TopNavLocation_6f1aa540 NVARCHAR(30),
@HideNavBarIconWhenActive_6f1aa540 BIT,
@Path_6f1aa540 NVARCHAR(100),
@AutoUpdatePath_6f1aa540 BIT,
@AgentSettings_6f1aa540 NVARCHAR(MAX),
@ID_6f1aa540 UNIQUEIDENTIFIER
SET
  @Name_6f1aa540 = N'BizAppSonar'
SET
  @Description_6f1aa540 = N'Configurable engagement scoring — models, factors, and explainable scores.'
SET
  @Icon_6f1aa540 = N'fa-solid fa-wave-square'
SET
  @DefaultForNewUser_6f1aa540 = 0
SET
  @SchemaAutoAddNewEntities_6f1aa540 = N'${flyway:defaultSchema}'
SET
  @Color_6f1aa540 = N'#6366F1'
SET
  @DefaultNavItems_6f1aa540 = N'[
  {
    "Label": "Overview",
    "Icon": "fa-solid fa-wave-square",
    "ResourceType": "Custom",
    "DriverClass": "SonarOverviewResource",
    "isDefault": true
  },
  {
    "Label": "Models",
    "Icon": "fa-solid fa-sliders",
    "ResourceType": "Custom",
    "DriverClass": "SonarModelBuilderResource",
    "isDefault": false
  },
  {
    "Label": "Signals",
    "Icon": "fa-solid fa-hammer",
    "ResourceType": "Custom",
    "DriverClass": "SonarSignalStudioResource",
    "isDefault": false
  },
  {
    "Label": "Engagement",
    "Icon": "fa-solid fa-chart-line",
    "ResourceType": "Custom",
    "DriverClass": "SonarEngagementManagerResource",
    "isDefault": false
  },
  {
    "Label": "Admin",
    "Icon": "fa-solid fa-gauge-high",
    "ResourceType": "Custom",
    "DriverClass": "SonarAdminOpsResource",
    "isDefault": false
  }
]'
SET
  @DefaultSequence_6f1aa540 = 2000
SET
  @Status_6f1aa540 = N'Active'
SET
  @NavigationStyle_6f1aa540 = N'App Switcher'
SET
  @HideNavBarIconWhenActive_6f1aa540 = 0
SET
  @Path_6f1aa540 = N'bizappsonar'
SET
  @AutoUpdatePath_6f1aa540 = 1
SET
  @ID_6f1aa540 = '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285' EXEC [__mj].spUpdateApplication @Name = @Name_6f1aa540,
  @Description = @Description_6f1aa540,
  @Icon = @Icon_6f1aa540,
  @DefaultForNewUser = @DefaultForNewUser_6f1aa540,
  @SchemaAutoAddNewEntities = @SchemaAutoAddNewEntities_6f1aa540,
  @Color = @Color_6f1aa540,
  @DefaultNavItems = @DefaultNavItems_6f1aa540,
  @ClassName = @ClassName_6f1aa540,
  @ClassName_Clear = 1,
  @DefaultSequence = @DefaultSequence_6f1aa540,
  @Status = @Status_6f1aa540,
  @NavigationStyle = @NavigationStyle_6f1aa540,
  @TopNavLocation = @TopNavLocation_6f1aa540,
  @TopNavLocation_Clear = 1,
  @HideNavBarIconWhenActive = @HideNavBarIconWhenActive_6f1aa540,
  @Path = @Path_6f1aa540,
  @AutoUpdatePath = @AutoUpdatePath_6f1aa540,
  @AgentSettings = @AgentSettings_6f1aa540,
  @AgentSettings_Clear = 1,
  @ID = @ID_6f1aa540;

GO

-- Save MJ: Templates (core SP call only)
DECLARE @ID_2661cd2b UNIQUEIDENTIFIER,
@Name_2661cd2b NVARCHAR(255),
@Description_2661cd2b NVARCHAR(MAX),
@CategoryID_2661cd2b UNIQUEIDENTIFIER,
@UserPrompt_2661cd2b NVARCHAR(MAX),
@UserID_2661cd2b UNIQUEIDENTIFIER,
@ActiveAt_2661cd2b DATETIMEOFFSET,
@DisabledAt_2661cd2b DATETIMEOFFSET,
@IsActive_2661cd2b BIT
SET
  @ID_2661cd2b = '40F49DD4-0712-4263-8785-5346F023FFA1'
SET
  @Name_2661cd2b = N'Sonar Authoring Agent'
SET
  @Description_2661cd2b = N'Sonar Authoring Agent — system/instruction prompt.'
SET
  @UserID_2661cd2b = 'ECAFCCEC-6A37-EF11-86D4-000D3A4E707E'
SET
  @IsActive_2661cd2b = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[Template] WHERE ID = @ID_2661cd2b)
EXEC [__mj].spCreateTemplate @ID = @ID_2661cd2b,
  @Name = @Name_2661cd2b,
  @Description = @Description_2661cd2b,
  @CategoryID = @CategoryID_2661cd2b,
  @CategoryID_Clear = 1,
  @UserPrompt = @UserPrompt_2661cd2b,
  @UserPrompt_Clear = 1,
  @UserID = @UserID_2661cd2b,
  @ActiveAt = @ActiveAt_2661cd2b,
  @ActiveAt_Clear = 1,
  @DisabledAt = @DisabledAt_2661cd2b,
  @DisabledAt_Clear = 1,
  @IsActive = @IsActive_2661cd2b;

GO

-- Save MJ: Template Contents (core SP call only)
DECLARE @ID_7897d46c UNIQUEIDENTIFIER,
@TemplateID_7897d46c UNIQUEIDENTIFIER,
@TypeID_7897d46c UNIQUEIDENTIFIER,
@TemplateText_7897d46c NVARCHAR(MAX),
@Priority_7897d46c INT,
@IsActive_7897d46c BIT
SET
  @ID_7897d46c = '094E9B12-2F3E-46EC-A9E6-D4D026F96298'
SET
  @TemplateID_7897d46c = '40F49DD4-0712-4263-8785-5346F023FFA1'
SET
  @TypeID_7897d46c = 'E7AFCCEC-6A37-EF11-86D4-000D3A4E707E'
SET
  @TemplateText_7897d46c = N'You are the Sonar Authoring Agent. You help an operator build engagement-scoring
configuration — score models, factors, band sets — by calling tools. You produce DRAFTS for a human to
review; you NEVER publish or activate anything.

## Building a NEW model — use ONE tool
To build a new model, call **Sonar: Build Model** ONCE with the whole spec. Do NOT chain Create Model /
Add Data Source / Create Factor for a new build — that single call wires everything up for you. Spec:
{
  "name": "...",
  "anchorEntityID": "<entity id>",
  "sources": [ { "relatedEntityID": "<entity id>", "alias": "events" } ],
  "factors": [ { "name": "Event Count", "sourceAlias": "events", "aggregation": "Count",
                 "normalizationMethod": "MinMax", "higherIsBetter": true, "weight": 1 } ],
  "bandSetId": "<band set id, optional>"
}
- Factors reference a source by its **alias** (never an ID).
- aggregation ∈ Count|Sum|Avg|Min|Max|DistinctCount. Count needs NO aggregateFieldName; EVERY other
  aggregation REQUIRES aggregateFieldName (a numeric/date column on the source).
- normalizationMethod ∈ MinMax|Percentile|ZScore|None|Logistic|Banded|Lookup (MinMax is a safe default).
- It returns { modelID, ... }; the model is a DRAFT.

## Editing an EXISTING model — granular tools
For incremental changes to a model that already exists: Sonar: Add Data Source, Sonar: Create Factor
(its sourceRelatedEntityID = the modelRelatedEntityID returned by Add Data Source), Sonar: Set Band Set.
- Add Data Source Spec = { relatedEntityID, alias }. Do NOT set relationshipPath — omit it and the engine
  auto-resolves the foreign key. (A dotted/SQL string there is invalid and will be ignored.)
- If a tool returns an error message, READ it and fix that specific thing; do NOT retry the same call
  unchanged or invent new variations of a field that already failed.

## PICK THE RIGHT MODEL — match the user''s intent
When the user refers to a model loosely ("cheese", "the engagement one"), call **Sonar: Find Models**
(NameQuery="cheese") to fuzzy-match it by partial name — do NOT assume the current model or give up. Use
Find Models (no query) to enumerate what exists when asked "what models do I have?". Once resolved, edit
that model if it''s EDITABLE (Draft). Do NOT grab an unrelated model (e.g. a "Test Model") just because it
shares an anchor entity — the name match is the signal. If several match, ask the user to pick by name.

## LOCKED models — unlock, don''t loop
Only DRAFT models can be edited; Active/Paused models are LOCKED. When the target you should edit is
locked:
1. If a matching EDITABLE Draft already exists, just use it.
2. Otherwise, OFFER to unlock it: "This model is Active (locked). Want me to unpublish it to Draft so I
   can edit it, or create a new draft instead?" If the user says unlock it, call **Sonar: Unpublish
   Model** (ModelID or ModelName) yourself — it moves Active/Paused → Draft (it NEVER publishes), then
   proceed with the edit in the SAME turn.
- Never tell the user to go unpublish it manually, and never re-run the same status check hoping it
  changed — YOU have the unpublish tool; use it or pivot to a new draft. Do not loop.

## LOOK BEFORE YOU ASK — read tools
You can SEE existing state. Use these BEFORE asking the user to re-state things you can look up:
- **Sonar: Describe Model** (by Name or ModelID) → returns a model''s anchor, sources (with aliases),
  factors, and band set. When asked to suggest changes to, or answer questions about, a NAMED model,
  Describe it FIRST — don''t ask the user what its anchor or sources are.
- **Sonar: List Related Entities** (AnchorEntityID) → the business entities joinable to an anchor (the
  candidate data sources). Use this to ground factor/source suggestions in data that ACTUALLY exists —
  never invent generic factors ("login frequency") that have no backing source on this anchor.
- Suggesting factors = Describe the model → List Related Entities on its anchor → propose declarative
  factors over real sources, then ask the user to confirm before you build.

## RESOLVE ENTITY IDs YOURSELF — never ask the user for a UUID
To build a NEW model you need an anchorEntityID. When the user names the anchor in plain English
("Members", "Donors"), call **Sonar: Find Entities** (NameQuery="Members") to resolve it to its ID —
do NOT ask the user to paste a UUID. If several match, ask the user to pick by NAME. Use the resolved id
as anchorEntityID in Build Model. (Related sources on an existing anchor still come from List Related
Entities.)

## Rules
- DECLARATIVE-FIRST: build signals as declarative factors (count/sum/avg over a source, with a window/
  filter). For a signal SQL CAN''T express (streaks, decay/recency, sentiment, cross-source ratios), use
  **Sonar: Author Factor Action** — describe the signal plainly and it authors a custom code factor via
  ActionSmith. It returns a Runtime action at CodeApprovalStatus=''Pending'' (a human approves the code
  before it scores). Reach for it ONLY when declarative genuinely can''t express the signal; never
  approximate a code-signal with a wrong aggregation.
- FINISH the whole request in one go. If you cannot complete every requested part, state exactly what is
  missing — NEVER claim you are done when you are not.
- VERIFY before claiming: only report a source/factor as added if its tool call returned success. If
  unsure what a model contains, call Sonar: Describe Model to check. Never report a step that errored.
- EXPLAIN your choices (why each factor and weight) in your reasoning.
- DRAFTS ONLY: never publish or activate. Leave the model Draft for human review.
- IDs: if you don''t know an anchorEntityID or a bandSetId, first try the read tools; only ASK the user
  when you genuinely can''t look it up — never guess UUIDs.'
SET
  @Priority_7897d46c = 1
SET
  @IsActive_7897d46c = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[TemplateContent] WHERE ID = @ID_7897d46c)
EXEC [__mj].spCreateTemplateContent @ID = @ID_7897d46c,
  @TemplateID = @TemplateID_7897d46c,
  @TypeID = @TypeID_7897d46c,
  @TemplateText = @TemplateText_7897d46c,
  @Priority = @Priority_7897d46c,
  @IsActive = @IsActive_7897d46c;

GO

-- Save MJ: AI Prompts (core SP call only)
DECLARE @ID_ab0ca827 UNIQUEIDENTIFIER,
@Name_ab0ca827 NVARCHAR(255),
@Description_ab0ca827 NVARCHAR(MAX),
@TemplateID_ab0ca827 UNIQUEIDENTIFIER,
@CategoryID_ab0ca827 UNIQUEIDENTIFIER,
@TypeID_ab0ca827 UNIQUEIDENTIFIER,
@Status_ab0ca827 NVARCHAR(50),
@ResponseFormat_ab0ca827 NVARCHAR(20),
@ModelSpecificResponseFormat_ab0ca827 NVARCHAR(MAX),
@AIModelTypeID_ab0ca827 UNIQUEIDENTIFIER,
@MinPowerRank_ab0ca827 INT,
@SelectionStrategy_ab0ca827 NVARCHAR(20),
@PowerPreference_ab0ca827 NVARCHAR(20),
@ParallelizationMode_ab0ca827 NVARCHAR(20),
@ParallelCount_ab0ca827 INT,
@ParallelConfigParam_ab0ca827 NVARCHAR(100),
@OutputType_ab0ca827 NVARCHAR(50),
@OutputExample_ab0ca827 NVARCHAR(MAX),
@ValidationBehavior_ab0ca827 NVARCHAR(50),
@MaxRetries_ab0ca827 INT,
@RetryDelayMS_ab0ca827 INT,
@RetryStrategy_ab0ca827 NVARCHAR(20),
@ResultSelectorPromptID_ab0ca827 UNIQUEIDENTIFIER,
@EnableCaching_ab0ca827 BIT,
@CacheTTLSeconds_ab0ca827 INT,
@CacheMatchType_ab0ca827 NVARCHAR(20),
@CacheSimilarityThreshold_ab0ca827 FLOAT(53),
@CacheMustMatchModel_ab0ca827 BIT,
@CacheMustMatchVendor_ab0ca827 BIT,
@CacheMustMatchAgent_ab0ca827 BIT,
@CacheMustMatchConfig_ab0ca827 BIT,
@PromptRole_ab0ca827 NVARCHAR(20),
@PromptPosition_ab0ca827 NVARCHAR(20),
@Temperature_ab0ca827 DECIMAL(3, 2),
@TopP_ab0ca827 DECIMAL(3, 2),
@TopK_ab0ca827 INT,
@MinP_ab0ca827 DECIMAL(3, 2),
@FrequencyPenalty_ab0ca827 DECIMAL(3, 2),
@PresencePenalty_ab0ca827 DECIMAL(3, 2),
@Seed_ab0ca827 INT,
@StopSequences_ab0ca827 NVARCHAR(1000),
@IncludeLogProbs_ab0ca827 BIT,
@TopLogProbs_ab0ca827 INT,
@FailoverStrategy_ab0ca827 NVARCHAR(50),
@FailoverMaxAttempts_ab0ca827 INT,
@FailoverDelaySeconds_ab0ca827 INT,
@FailoverModelStrategy_ab0ca827 NVARCHAR(50),
@FailoverErrorScope_ab0ca827 NVARCHAR(50),
@EffortLevel_ab0ca827 INT,
@AssistantPrefill_ab0ca827 NVARCHAR(MAX),
@PrefillFallbackMode_ab0ca827 NVARCHAR(20),
@RequireSpecificModels_ab0ca827 BIT
SET
  @ID_ab0ca827 = '3A70C8FF-B823-4491-8B3D-3BC258C82AEB'
SET
  @Name_ab0ca827 = N'Sonar Authoring Agent'
SET
  @Description_ab0ca827 = N'Instructions for the Sonar Authoring Agent (declarative-first, drafts-only).'
SET
  @TemplateID_ab0ca827 = '40F49DD4-0712-4263-8785-5346F023FFA1'
SET
  @TypeID_ab0ca827 = 'A6DA423E-F36B-1410-8DAC-00021F8B792E'
SET
  @Status_ab0ca827 = N'Active'
SET
  @ResponseFormat_ab0ca827 = N'Any'
SET
  @MinPowerRank_ab0ca827 = 0
SET
  @SelectionStrategy_ab0ca827 = N'Specific'
SET
  @PowerPreference_ab0ca827 = N'Highest'
SET
  @ParallelizationMode_ab0ca827 = N'None'
SET
  @OutputType_ab0ca827 = N'string'
SET
  @ValidationBehavior_ab0ca827 = N'Warn'
SET
  @MaxRetries_ab0ca827 = 0
SET
  @RetryDelayMS_ab0ca827 = 0
SET
  @RetryStrategy_ab0ca827 = N'Fixed'
SET
  @EnableCaching_ab0ca827 = 0
SET
  @CacheMatchType_ab0ca827 = N'Exact'
SET
  @CacheMustMatchModel_ab0ca827 = 1
SET
  @CacheMustMatchVendor_ab0ca827 = 1
SET
  @CacheMustMatchAgent_ab0ca827 = 0
SET
  @CacheMustMatchConfig_ab0ca827 = 0
SET
  @PromptRole_ab0ca827 = N'System'
SET
  @PromptPosition_ab0ca827 = N'First'
SET
  @IncludeLogProbs_ab0ca827 = 0
SET
  @FailoverStrategy_ab0ca827 = N'SameModelDifferentVendor'
SET
  @FailoverMaxAttempts_ab0ca827 = 3
SET
  @FailoverDelaySeconds_ab0ca827 = 5
SET
  @FailoverModelStrategy_ab0ca827 = N'PreferSameModel'
SET
  @FailoverErrorScope_ab0ca827 = N'All'
SET
  @PrefillFallbackMode_ab0ca827 = N'Ignore'
SET
  @RequireSpecificModels_ab0ca827 = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[AIPrompt] WHERE ID = @ID_ab0ca827)
EXEC [__mj].spCreateAIPrompt @ID = @ID_ab0ca827,
  @Name = @Name_ab0ca827,
  @Description = @Description_ab0ca827,
  @TemplateID = @TemplateID_ab0ca827,
  @CategoryID = @CategoryID_ab0ca827,
  @CategoryID_Clear = 1,
  @TypeID = @TypeID_ab0ca827,
  @Status = @Status_ab0ca827,
  @ResponseFormat = @ResponseFormat_ab0ca827,
  @ModelSpecificResponseFormat = @ModelSpecificResponseFormat_ab0ca827,
  @ModelSpecificResponseFormat_Clear = 1,
  @AIModelTypeID = @AIModelTypeID_ab0ca827,
  @AIModelTypeID_Clear = 1,
  @MinPowerRank = @MinPowerRank_ab0ca827,
  @SelectionStrategy = @SelectionStrategy_ab0ca827,
  @PowerPreference = @PowerPreference_ab0ca827,
  @ParallelizationMode = @ParallelizationMode_ab0ca827,
  @ParallelCount = @ParallelCount_ab0ca827,
  @ParallelCount_Clear = 1,
  @ParallelConfigParam = @ParallelConfigParam_ab0ca827,
  @ParallelConfigParam_Clear = 1,
  @OutputType = @OutputType_ab0ca827,
  @OutputExample = @OutputExample_ab0ca827,
  @OutputExample_Clear = 1,
  @ValidationBehavior = @ValidationBehavior_ab0ca827,
  @MaxRetries = @MaxRetries_ab0ca827,
  @RetryDelayMS = @RetryDelayMS_ab0ca827,
  @RetryStrategy = @RetryStrategy_ab0ca827,
  @ResultSelectorPromptID = @ResultSelectorPromptID_ab0ca827,
  @ResultSelectorPromptID_Clear = 1,
  @EnableCaching = @EnableCaching_ab0ca827,
  @CacheTTLSeconds = @CacheTTLSeconds_ab0ca827,
  @CacheTTLSeconds_Clear = 1,
  @CacheMatchType = @CacheMatchType_ab0ca827,
  @CacheSimilarityThreshold = @CacheSimilarityThreshold_ab0ca827,
  @CacheSimilarityThreshold_Clear = 1,
  @CacheMustMatchModel = @CacheMustMatchModel_ab0ca827,
  @CacheMustMatchVendor = @CacheMustMatchVendor_ab0ca827,
  @CacheMustMatchAgent = @CacheMustMatchAgent_ab0ca827,
  @CacheMustMatchConfig = @CacheMustMatchConfig_ab0ca827,
  @PromptRole = @PromptRole_ab0ca827,
  @PromptPosition = @PromptPosition_ab0ca827,
  @Temperature = @Temperature_ab0ca827,
  @Temperature_Clear = 1,
  @TopP = @TopP_ab0ca827,
  @TopP_Clear = 1,
  @TopK = @TopK_ab0ca827,
  @TopK_Clear = 1,
  @MinP = @MinP_ab0ca827,
  @MinP_Clear = 1,
  @FrequencyPenalty = @FrequencyPenalty_ab0ca827,
  @FrequencyPenalty_Clear = 1,
  @PresencePenalty = @PresencePenalty_ab0ca827,
  @PresencePenalty_Clear = 1,
  @Seed = @Seed_ab0ca827,
  @Seed_Clear = 1,
  @StopSequences = @StopSequences_ab0ca827,
  @StopSequences_Clear = 1,
  @IncludeLogProbs = @IncludeLogProbs_ab0ca827,
  @TopLogProbs = @TopLogProbs_ab0ca827,
  @TopLogProbs_Clear = 1,
  @FailoverStrategy = @FailoverStrategy_ab0ca827,
  @FailoverMaxAttempts = @FailoverMaxAttempts_ab0ca827,
  @FailoverDelaySeconds = @FailoverDelaySeconds_ab0ca827,
  @FailoverModelStrategy = @FailoverModelStrategy_ab0ca827,
  @FailoverErrorScope = @FailoverErrorScope_ab0ca827,
  @EffortLevel = @EffortLevel_ab0ca827,
  @EffortLevel_Clear = 1,
  @AssistantPrefill = @AssistantPrefill_ab0ca827,
  @AssistantPrefill_Clear = 1,
  @PrefillFallbackMode = @PrefillFallbackMode_ab0ca827,
  @RequireSpecificModels = @RequireSpecificModels_ab0ca827;

GO

-- Save MJ: AI Agents (core SP call only)
DECLARE @ID_d5081f3c UNIQUEIDENTIFIER,
@Name_d5081f3c NVARCHAR(255),
@Description_d5081f3c NVARCHAR(MAX),
@LogoURL_d5081f3c NVARCHAR(255),
@ParentID_d5081f3c UNIQUEIDENTIFIER,
@ExposeAsAction_d5081f3c BIT,
@ExecutionOrder_d5081f3c INT,
@ExecutionMode_d5081f3c NVARCHAR(20),
@EnableContextCompression_d5081f3c BIT,
@ContextCompressionMessageThreshold_d5081f3c INT,
@ContextCompressionPromptID_d5081f3c UNIQUEIDENTIFIER,
@ContextCompressionMessageRetentionCount_d5081f3c INT,
@TypeID_d5081f3c UNIQUEIDENTIFIER,
@Status_d5081f3c NVARCHAR(20),
@DriverClass_d5081f3c NVARCHAR(255),
@IconClass_d5081f3c NVARCHAR(100),
@ModelSelectionMode_d5081f3c NVARCHAR(50),
@PayloadDownstreamPaths_d5081f3c NVARCHAR(MAX),
@PayloadUpstreamPaths_d5081f3c NVARCHAR(MAX),
@PayloadSelfReadPaths_d5081f3c NVARCHAR(MAX),
@PayloadSelfWritePaths_d5081f3c NVARCHAR(MAX),
@PayloadScope_d5081f3c NVARCHAR(MAX),
@FinalPayloadValidation_d5081f3c NVARCHAR(MAX),
@FinalPayloadValidationMode_d5081f3c NVARCHAR(25),
@FinalPayloadValidationMaxRetries_d5081f3c INT,
@MaxCostPerRun_d5081f3c DECIMAL(10, 4),
@MaxTokensPerRun_d5081f3c INT,
@MaxIterationsPerRun_d5081f3c INT,
@MaxTimePerRun_d5081f3c INT,
@MinExecutionsPerRun_d5081f3c INT,
@MaxExecutionsPerRun_d5081f3c INT,
@StartingPayloadValidation_d5081f3c NVARCHAR(MAX),
@StartingPayloadValidationMode_d5081f3c NVARCHAR(25),
@DefaultPromptEffortLevel_d5081f3c INT,
@ChatHandlingOption_d5081f3c NVARCHAR(30),
@DefaultArtifactTypeID_d5081f3c UNIQUEIDENTIFIER,
@OwnerUserID_d5081f3c UNIQUEIDENTIFIER,
@InvocationMode_d5081f3c NVARCHAR(20),
@ArtifactCreationMode_d5081f3c NVARCHAR(20),
@FunctionalRequirements_d5081f3c NVARCHAR(MAX),
@TechnicalDesign_d5081f3c NVARCHAR(MAX),
@InjectNotes_d5081f3c BIT,
@MaxNotesToInject_d5081f3c INT,
@NoteInjectionStrategy_d5081f3c NVARCHAR(20),
@InjectExamples_d5081f3c BIT,
@MaxExamplesToInject_d5081f3c INT,
@ExampleInjectionStrategy_d5081f3c NVARCHAR(20),
@IsRestricted_d5081f3c BIT,
@MessageMode_d5081f3c NVARCHAR(50),
@MaxMessages_d5081f3c INT,
@AttachmentStorageProviderID_d5081f3c UNIQUEIDENTIFIER,
@AttachmentRootPath_d5081f3c NVARCHAR(500),
@InlineStorageThresholdBytes_d5081f3c INT,
@AgentTypePromptParams_d5081f3c NVARCHAR(MAX),
@ScopeConfig_d5081f3c NVARCHAR(MAX),
@NoteRetentionDays_d5081f3c INT,
@ExampleRetentionDays_d5081f3c INT,
@AutoArchiveEnabled_d5081f3c BIT,
@RerankerConfiguration_d5081f3c NVARCHAR(MAX),
@CategoryID_d5081f3c UNIQUEIDENTIFIER,
@AllowEphemeralClientTools_d5081f3c BIT,
@DefaultStorageAccountID_d5081f3c UNIQUEIDENTIFIER,
@SearchScopeAccess_d5081f3c NVARCHAR(20),
@AcceptUnregisteredFiles_d5081f3c BIT,
@DefaultCoAgentID_d5081f3c UNIQUEIDENTIFIER,
@TypeConfiguration_d5081f3c NVARCHAR(MAX),
@AllowMemoryWrite_d5081f3c BIT,
@RecordingDefault_d5081f3c NVARCHAR(20),
@RecordingStorageProviderID_d5081f3c UNIQUEIDENTIFIER,
@DefaultMediaCollectionID_d5081f3c UNIQUEIDENTIFIER,
@SupportsPlanMode_d5081f3c BIT,
@AcceptsSkills_d5081f3c NVARCHAR(20),
@SkillActivationMode_d5081f3c NVARCHAR(20),
@RequirePlanMode_d5081f3c BIT
SET
  @ID_d5081f3c = 'CF1D58BA-451E-4515-89BD-AC3F16A19534'
SET
  @Name_d5081f3c = N'Sonar Authoring Agent'
SET
  @Description_d5081f3c = N'Builds Sonar scoring config (models/factors/bands) from natural language via the tool surface. Declarative-first; produces drafts for human review.'
SET
  @ExposeAsAction_d5081f3c = 0
SET
  @ExecutionOrder_d5081f3c = 0
SET
  @ExecutionMode_d5081f3c = N'Sequential'
SET
  @EnableContextCompression_d5081f3c = 0
SET
  @TypeID_d5081f3c = 'F7926101-5099-4FA5-836A-479D9707C818'
SET
  @Status_d5081f3c = N'Active'
SET
  @IconClass_d5081f3c = N'fa-solid fa-wand-magic-sparkles'
SET
  @ModelSelectionMode_d5081f3c = N'Agent'
SET
  @PayloadDownstreamPaths_d5081f3c = N'["*"]'
SET
  @PayloadUpstreamPaths_d5081f3c = N'["*"]'
SET
  @FinalPayloadValidationMode_d5081f3c = N'Retry'
SET
  @FinalPayloadValidationMaxRetries_d5081f3c = 3
SET
  @MaxIterationsPerRun_d5081f3c = 12
SET
  @MaxExecutionsPerRun_d5081f3c = 18
SET
  @StartingPayloadValidationMode_d5081f3c = N'Fail'
SET
  @OwnerUserID_d5081f3c = 'ECAFCCEC-6A37-EF11-86D4-000D3A4E707E'
SET
  @InvocationMode_d5081f3c = N'Any'
SET
  @ArtifactCreationMode_d5081f3c = N'Always'
SET
  @InjectNotes_d5081f3c = 1
SET
  @MaxNotesToInject_d5081f3c = 5
SET
  @NoteInjectionStrategy_d5081f3c = N'Relevant'
SET
  @InjectExamples_d5081f3c = 0
SET
  @MaxExamplesToInject_d5081f3c = 3
SET
  @ExampleInjectionStrategy_d5081f3c = N'Semantic'
SET
  @IsRestricted_d5081f3c = 0
SET
  @MessageMode_d5081f3c = N'None'
SET
  @NoteRetentionDays_d5081f3c = 90
SET
  @ExampleRetentionDays_d5081f3c = 180
SET
  @AutoArchiveEnabled_d5081f3c = 1
SET
  @AllowEphemeralClientTools_d5081f3c = 1
SET
  @SearchScopeAccess_d5081f3c = N'None'
SET
  @AcceptUnregisteredFiles_d5081f3c = 0
SET
  @AllowMemoryWrite_d5081f3c = 1
SET
  @SupportsPlanMode_d5081f3c = 1
SET
  @AcceptsSkills_d5081f3c = N'None'
SET
  @SkillActivationMode_d5081f3c = N'RequestedOnly'
SET
  @RequirePlanMode_d5081f3c = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[AIAgent] WHERE ID = @ID_d5081f3c)
EXEC [__mj].spCreateAIAgent @ID = @ID_d5081f3c,
  @Name = @Name_d5081f3c,
  @Description = @Description_d5081f3c,
  @LogoURL = @LogoURL_d5081f3c,
  @LogoURL_Clear = 1,
  @ParentID = @ParentID_d5081f3c,
  @ParentID_Clear = 1,
  @ExposeAsAction = @ExposeAsAction_d5081f3c,
  @ExecutionOrder = @ExecutionOrder_d5081f3c,
  @ExecutionMode = @ExecutionMode_d5081f3c,
  @EnableContextCompression = @EnableContextCompression_d5081f3c,
  @ContextCompressionMessageThreshold = @ContextCompressionMessageThreshold_d5081f3c,
  @ContextCompressionMessageThreshold_Clear = 1,
  @ContextCompressionPromptID = @ContextCompressionPromptID_d5081f3c,
  @ContextCompressionPromptID_Clear = 1,
  @ContextCompressionMessageRetentionCount = @ContextCompressionMessageRetentionCount_d5081f3c,
  @ContextCompressionMessageRetentionCount_Clear = 1,
  @TypeID = @TypeID_d5081f3c,
  @Status = @Status_d5081f3c,
  @DriverClass = @DriverClass_d5081f3c,
  @DriverClass_Clear = 1,
  @IconClass = @IconClass_d5081f3c,
  @ModelSelectionMode = @ModelSelectionMode_d5081f3c,
  @PayloadDownstreamPaths = @PayloadDownstreamPaths_d5081f3c,
  @PayloadUpstreamPaths = @PayloadUpstreamPaths_d5081f3c,
  @PayloadSelfReadPaths = @PayloadSelfReadPaths_d5081f3c,
  @PayloadSelfReadPaths_Clear = 1,
  @PayloadSelfWritePaths = @PayloadSelfWritePaths_d5081f3c,
  @PayloadSelfWritePaths_Clear = 1,
  @PayloadScope = @PayloadScope_d5081f3c,
  @PayloadScope_Clear = 1,
  @FinalPayloadValidation = @FinalPayloadValidation_d5081f3c,
  @FinalPayloadValidation_Clear = 1,
  @FinalPayloadValidationMode = @FinalPayloadValidationMode_d5081f3c,
  @FinalPayloadValidationMaxRetries = @FinalPayloadValidationMaxRetries_d5081f3c,
  @MaxCostPerRun = @MaxCostPerRun_d5081f3c,
  @MaxCostPerRun_Clear = 1,
  @MaxTokensPerRun = @MaxTokensPerRun_d5081f3c,
  @MaxTokensPerRun_Clear = 1,
  @MaxIterationsPerRun = @MaxIterationsPerRun_d5081f3c,
  @MaxTimePerRun = @MaxTimePerRun_d5081f3c,
  @MaxTimePerRun_Clear = 1,
  @MinExecutionsPerRun = @MinExecutionsPerRun_d5081f3c,
  @MinExecutionsPerRun_Clear = 1,
  @MaxExecutionsPerRun = @MaxExecutionsPerRun_d5081f3c,
  @StartingPayloadValidation = @StartingPayloadValidation_d5081f3c,
  @StartingPayloadValidation_Clear = 1,
  @StartingPayloadValidationMode = @StartingPayloadValidationMode_d5081f3c,
  @DefaultPromptEffortLevel = @DefaultPromptEffortLevel_d5081f3c,
  @DefaultPromptEffortLevel_Clear = 1,
  @ChatHandlingOption = @ChatHandlingOption_d5081f3c,
  @ChatHandlingOption_Clear = 1,
  @DefaultArtifactTypeID = @DefaultArtifactTypeID_d5081f3c,
  @DefaultArtifactTypeID_Clear = 1,
  @OwnerUserID = @OwnerUserID_d5081f3c,
  @InvocationMode = @InvocationMode_d5081f3c,
  @ArtifactCreationMode = @ArtifactCreationMode_d5081f3c,
  @FunctionalRequirements = @FunctionalRequirements_d5081f3c,
  @FunctionalRequirements_Clear = 1,
  @TechnicalDesign = @TechnicalDesign_d5081f3c,
  @TechnicalDesign_Clear = 1,
  @InjectNotes = @InjectNotes_d5081f3c,
  @MaxNotesToInject = @MaxNotesToInject_d5081f3c,
  @NoteInjectionStrategy = @NoteInjectionStrategy_d5081f3c,
  @InjectExamples = @InjectExamples_d5081f3c,
  @MaxExamplesToInject = @MaxExamplesToInject_d5081f3c,
  @ExampleInjectionStrategy = @ExampleInjectionStrategy_d5081f3c,
  @IsRestricted = @IsRestricted_d5081f3c,
  @MessageMode = @MessageMode_d5081f3c,
  @MaxMessages = @MaxMessages_d5081f3c,
  @MaxMessages_Clear = 1,
  @AttachmentStorageProviderID = @AttachmentStorageProviderID_d5081f3c,
  @AttachmentStorageProviderID_Clear = 1,
  @AttachmentRootPath = @AttachmentRootPath_d5081f3c,
  @AttachmentRootPath_Clear = 1,
  @InlineStorageThresholdBytes = @InlineStorageThresholdBytes_d5081f3c,
  @InlineStorageThresholdBytes_Clear = 1,
  @AgentTypePromptParams = @AgentTypePromptParams_d5081f3c,
  @AgentTypePromptParams_Clear = 1,
  @ScopeConfig = @ScopeConfig_d5081f3c,
  @ScopeConfig_Clear = 1,
  @NoteRetentionDays = @NoteRetentionDays_d5081f3c,
  @ExampleRetentionDays = @ExampleRetentionDays_d5081f3c,
  @AutoArchiveEnabled = @AutoArchiveEnabled_d5081f3c,
  @RerankerConfiguration = @RerankerConfiguration_d5081f3c,
  @RerankerConfiguration_Clear = 1,
  @CategoryID = @CategoryID_d5081f3c,
  @CategoryID_Clear = 1,
  @AllowEphemeralClientTools = @AllowEphemeralClientTools_d5081f3c,
  @DefaultStorageAccountID = @DefaultStorageAccountID_d5081f3c,
  @DefaultStorageAccountID_Clear = 1,
  @SearchScopeAccess = @SearchScopeAccess_d5081f3c,
  @AcceptUnregisteredFiles = @AcceptUnregisteredFiles_d5081f3c,
  @DefaultCoAgentID = @DefaultCoAgentID_d5081f3c,
  @DefaultCoAgentID_Clear = 1,
  @TypeConfiguration = @TypeConfiguration_d5081f3c,
  @TypeConfiguration_Clear = 1,
  @AllowMemoryWrite = @AllowMemoryWrite_d5081f3c,
  @RecordingDefault = @RecordingDefault_d5081f3c,
  @RecordingDefault_Clear = 1,
  @RecordingStorageProviderID = @RecordingStorageProviderID_d5081f3c,
  @RecordingStorageProviderID_Clear = 1,
  @DefaultMediaCollectionID = @DefaultMediaCollectionID_d5081f3c,
  @DefaultMediaCollectionID_Clear = 1,
  @SupportsPlanMode = @SupportsPlanMode_d5081f3c,
  @AcceptsSkills = @AcceptsSkills_d5081f3c,
  @SkillActivationMode = @SkillActivationMode_d5081f3c,
  @RequirePlanMode = @RequirePlanMode_d5081f3c;

GO

-- Save MJ: AI Agent Prompts (core SP call only)
DECLARE @ID_030265e4 UNIQUEIDENTIFIER,
@AgentID_030265e4 UNIQUEIDENTIFIER,
@PromptID_030265e4 UNIQUEIDENTIFIER,
@Purpose_030265e4 NVARCHAR(MAX),
@ExecutionOrder_030265e4 INT,
@ConfigurationID_030265e4 UNIQUEIDENTIFIER,
@Status_030265e4 NVARCHAR(20),
@ContextBehavior_030265e4 NVARCHAR(50),
@ContextMessageCount_030265e4 INT
SET
  @ID_030265e4 = '50583FD9-19F9-4ED8-9B22-2DF9D4733D3F'
SET
  @AgentID_030265e4 = 'CF1D58BA-451E-4515-89BD-AC3F16A19534'
SET
  @PromptID_030265e4 = '3A70C8FF-B823-4491-8B3D-3BC258C82AEB'
SET
  @ExecutionOrder_030265e4 = 1
SET
  @Status_030265e4 = N'Active'
SET
  @ContextBehavior_030265e4 = N'Complete' IF NOT EXISTS (SELECT 1 FROM [__mj].[AIAgentPrompt] WHERE ID = @ID_030265e4)
EXEC [__mj].spCreateAIAgentPrompt @ID = @ID_030265e4,
  @AgentID = @AgentID_030265e4,
  @PromptID = @PromptID_030265e4,
  @Purpose = @Purpose_030265e4,
  @Purpose_Clear = 1,
  @ExecutionOrder = @ExecutionOrder_030265e4,
  @ConfigurationID = @ConfigurationID_030265e4,
  @ConfigurationID_Clear = 1,
  @Status = @Status_030265e4,
  @ContextBehavior = @ContextBehavior_030265e4,
  @ContextMessageCount = @ContextMessageCount_030265e4,
  @ContextMessageCount_Clear = 1;

GO

-- Save MJ_BizApps_Sonar: Time Windows (core SP call only)
DECLARE @ID_7b83edbc UNIQUEIDENTIFIER,
@Name_7b83edbc NVARCHAR(120),
@WindowType_7b83edbc NVARCHAR(20),
@LengthDays_7b83edbc INT,
@LengthMonths_7b83edbc INT,
@AnchorDateField_7b83edbc NVARCHAR(200),
@OffsetDays_7b83edbc INT,
@Description_7b83edbc NVARCHAR(MAX)
SET
  @ID_7b83edbc = 'BCFC53F6-D749-4E6A-B868-6B4FB46D49E5'
SET
  @Name_7b83edbc = N'Trailing 30 Days'
SET
  @WindowType_7b83edbc = N'Rolling'
SET
  @LengthDays_7b83edbc = 30
SET
  @Description_7b83edbc = N'Rolling 30-day window ending at the as-of date. Short-term recency signals (recent logins, recent opens).' IF NOT EXISTS (SELECT 1 FROM [${flyway:defaultSchema}].[TimeWindow] WHERE ID = @ID_7b83edbc)
EXEC [${flyway:defaultSchema}].spCreateTimeWindow @ID = @ID_7b83edbc,
  @Name = @Name_7b83edbc,
  @WindowType = @WindowType_7b83edbc,
  @LengthDays = @LengthDays_7b83edbc,
  @LengthMonths = @LengthMonths_7b83edbc,
  @LengthMonths_Clear = 1,
  @AnchorDateField = @AnchorDateField_7b83edbc,
  @AnchorDateField_Clear = 1,
  @OffsetDays = @OffsetDays_7b83edbc,
  @OffsetDays_Clear = 1,
  @Description = @Description_7b83edbc;

GO

-- Save MJ_BizApps_Sonar: Time Windows (core SP call only)
DECLARE @ID_a7b594f4 UNIQUEIDENTIFIER,
@Name_a7b594f4 NVARCHAR(120),
@WindowType_a7b594f4 NVARCHAR(20),
@LengthDays_a7b594f4 INT,
@LengthMonths_a7b594f4 INT,
@AnchorDateField_a7b594f4 NVARCHAR(200),
@OffsetDays_a7b594f4 INT,
@Description_a7b594f4 NVARCHAR(MAX)
SET
  @ID_a7b594f4 = '9F60606A-3F7D-4707-A852-813B302C5DB9'
SET
  @Name_a7b594f4 = N'Trailing 90 Days'
SET
  @WindowType_a7b594f4 = N'Rolling'
SET
  @LengthDays_a7b594f4 = 90
SET
  @Description_a7b594f4 = N'Rolling 90-day window ending at the as-of date. The default window for most engagement factors.' IF NOT EXISTS (SELECT 1 FROM [${flyway:defaultSchema}].[TimeWindow] WHERE ID = @ID_a7b594f4)
EXEC [${flyway:defaultSchema}].spCreateTimeWindow @ID = @ID_a7b594f4,
  @Name = @Name_a7b594f4,
  @WindowType = @WindowType_a7b594f4,
  @LengthDays = @LengthDays_a7b594f4,
  @LengthMonths = @LengthMonths_a7b594f4,
  @LengthMonths_Clear = 1,
  @AnchorDateField = @AnchorDateField_a7b594f4,
  @AnchorDateField_Clear = 1,
  @OffsetDays = @OffsetDays_a7b594f4,
  @OffsetDays_Clear = 1,
  @Description = @Description_a7b594f4;

GO

-- Save MJ_BizApps_Sonar: Time Windows (core SP call only)
DECLARE @ID_00007096 UNIQUEIDENTIFIER,
@Name_00007096 NVARCHAR(120),
@WindowType_00007096 NVARCHAR(20),
@LengthDays_00007096 INT,
@LengthMonths_00007096 INT,
@AnchorDateField_00007096 NVARCHAR(200),
@OffsetDays_00007096 INT,
@Description_00007096 NVARCHAR(MAX)
SET
  @ID_00007096 = '2349024A-8961-41E7-AAAE-DD19E3C47A6E'
SET
  @Name_00007096 = N'Trailing 12 Months'
SET
  @WindowType_00007096 = N'Rolling'
SET
  @LengthMonths_00007096 = 12
SET
  @Description_00007096 = N'Rolling 12-month window ending at the as-of date. Annual-cadence signals (event attendance, dues, certifications).' IF NOT EXISTS (SELECT 1 FROM [${flyway:defaultSchema}].[TimeWindow] WHERE ID = @ID_00007096)
EXEC [${flyway:defaultSchema}].spCreateTimeWindow @ID = @ID_00007096,
  @Name = @Name_00007096,
  @WindowType = @WindowType_00007096,
  @LengthDays = @LengthDays_00007096,
  @LengthDays_Clear = 1,
  @LengthMonths = @LengthMonths_00007096,
  @AnchorDateField = @AnchorDateField_00007096,
  @AnchorDateField_Clear = 1,
  @OffsetDays = @OffsetDays_00007096,
  @OffsetDays_Clear = 1,
  @Description = @Description_00007096;

GO

-- Save MJ_BizApps_Sonar: Time Windows (core SP call only)
DECLARE @ID_cfbca076 UNIQUEIDENTIFIER,
@Name_cfbca076 NVARCHAR(120),
@WindowType_cfbca076 NVARCHAR(20),
@LengthDays_cfbca076 INT,
@LengthMonths_cfbca076 INT,
@AnchorDateField_cfbca076 NVARCHAR(200),
@OffsetDays_cfbca076 INT,
@Description_cfbca076 NVARCHAR(MAX)
SET
  @ID_cfbca076 = '0AA0E059-2CBB-417D-8C37-4D15B6E5D0CA'
SET
  @Name_cfbca076 = N'All Time'
SET
  @WindowType_cfbca076 = N'AllTime'
SET
  @Description_cfbca076 = N'No time bound; aggregates over the entire history of the related entity (e.g. lifetime giving, total certifications earned).' IF NOT EXISTS (SELECT 1 FROM [${flyway:defaultSchema}].[TimeWindow] WHERE ID = @ID_cfbca076)
EXEC [${flyway:defaultSchema}].spCreateTimeWindow @ID = @ID_cfbca076,
  @Name = @Name_cfbca076,
  @WindowType = @WindowType_cfbca076,
  @LengthDays = @LengthDays_cfbca076,
  @LengthDays_Clear = 1,
  @LengthMonths = @LengthMonths_cfbca076,
  @LengthMonths_Clear = 1,
  @AnchorDateField = @AnchorDateField_cfbca076,
  @AnchorDateField_Clear = 1,
  @OffsetDays = @OffsetDays_cfbca076,
  @OffsetDays_Clear = 1,
  @Description = @Description_cfbca076;

GO

-- Save MJ_BizApps_Sonar: Time Windows (core SP call only)
DECLARE @ID_ed112abc UNIQUEIDENTIFIER,
@Name_ed112abc NVARCHAR(120),
@WindowType_ed112abc NVARCHAR(20),
@LengthDays_ed112abc INT,
@LengthMonths_ed112abc INT,
@AnchorDateField_ed112abc NVARCHAR(200),
@OffsetDays_ed112abc INT,
@Description_ed112abc NVARCHAR(MAX)
SET
  @ID_ed112abc = 'D7DCA423-036F-4DF0-98DC-A3B43855FDA0'
SET
  @Name_ed112abc = N'Renewal Window (-90 days)'
SET
  @WindowType_ed112abc = N'RenewalRelative'
SET
  @AnchorDateField_ed112abc = N'RenewalDate'
SET
  @OffsetDays_ed112abc = -90
SET
  @Description_ed112abc = N'The 90 days leading up to each member''s renewal date. Lets decay close to renewal be weighted differently from decay far out.' IF NOT EXISTS (SELECT 1 FROM [${flyway:defaultSchema}].[TimeWindow] WHERE ID = @ID_ed112abc)
EXEC [${flyway:defaultSchema}].spCreateTimeWindow @ID = @ID_ed112abc,
  @Name = @Name_ed112abc,
  @WindowType = @WindowType_ed112abc,
  @LengthDays = @LengthDays_ed112abc,
  @LengthDays_Clear = 1,
  @LengthMonths = @LengthMonths_ed112abc,
  @LengthMonths_Clear = 1,
  @AnchorDateField = @AnchorDateField_ed112abc,
  @OffsetDays = @OffsetDays_ed112abc,
  @Description = @Description_ed112abc;

GO

-- Save MJ_BizApps_Sonar: Score Band Sets (core SP call only)
DECLARE @ID_85bb09a0 UNIQUEIDENTIFIER,
@Name_85bb09a0 NVARCHAR(200),
@AnchorEntityID_85bb09a0 UNIQUEIDENTIFIER,
@Description_85bb09a0 NVARCHAR(MAX)
SET
  @ID_85bb09a0 = '7E3B9C42-0A1D-4E58-9B6F-2C4D8A1F0B30'
SET
  @Name_85bb09a0 = N'Default Health Bands'
SET
  @Description_85bb09a0 = N'Starter three-band rubric on a 0–100 scale: At Risk / Neutral / Healthy. A generic default operators can clone and tune per model.' IF NOT EXISTS (SELECT 1 FROM [${flyway:defaultSchema}].[ScoreBandSet] WHERE ID = @ID_85bb09a0)
EXEC [${flyway:defaultSchema}].spCreateScoreBandSet @ID = @ID_85bb09a0,
  @Name = @Name_85bb09a0,
  @AnchorEntityID = @AnchorEntityID_85bb09a0,
  @AnchorEntityID_Clear = 1,
  @Description = @Description_85bb09a0;

GO

-- Save MJ_BizApps_Sonar: Score Bands (core SP call only)
DECLARE @ID_385c40db UNIQUEIDENTIFIER,
@BandSetID_385c40db UNIQUEIDENTIFIER,
@Label_385c40db NVARCHAR(60),
@MinScore_385c40db DECIMAL(9, 4),
@MaxScore_385c40db DECIMAL(9, 4),
@Severity_385c40db INT,
@ColorHex_385c40db NVARCHAR(7),
@IsTerminal_385c40db BIT,
@Description_385c40db NVARCHAR(MAX)
SET
  @ID_385c40db = '7E3B9C42-0A1D-4E58-9B6F-2C4D8A1F0B31'
SET
  @BandSetID_385c40db = '7E3B9C42-0A1D-4E58-9B6F-2C4D8A1F0B30'
SET
  @Label_385c40db = N'At Risk'
SET
  @MinScore_385c40db = 0
SET
  @MaxScore_385c40db = 40
SET
  @Severity_385c40db = 3
SET
  @ColorHex_385c40db = N'#DC2626'
SET
  @IsTerminal_385c40db = 0
SET
  @Description_385c40db = N'Low engagement — needs intervention.' IF NOT EXISTS (SELECT 1 FROM [${flyway:defaultSchema}].[ScoreBand] WHERE ID = @ID_385c40db)
EXEC [${flyway:defaultSchema}].spCreateScoreBand @ID = @ID_385c40db,
  @BandSetID = @BandSetID_385c40db,
  @Label = @Label_385c40db,
  @MinScore = @MinScore_385c40db,
  @MaxScore = @MaxScore_385c40db,
  @Severity = @Severity_385c40db,
  @ColorHex = @ColorHex_385c40db,
  @IsTerminal = @IsTerminal_385c40db,
  @Description = @Description_385c40db;

GO

-- Save MJ_BizApps_Sonar: Score Bands (core SP call only)
DECLARE @ID_060a643c UNIQUEIDENTIFIER,
@BandSetID_060a643c UNIQUEIDENTIFIER,
@Label_060a643c NVARCHAR(60),
@MinScore_060a643c DECIMAL(9, 4),
@MaxScore_060a643c DECIMAL(9, 4),
@Severity_060a643c INT,
@ColorHex_060a643c NVARCHAR(7),
@IsTerminal_060a643c BIT,
@Description_060a643c NVARCHAR(MAX)
SET
  @ID_060a643c = '7E3B9C42-0A1D-4E58-9B6F-2C4D8A1F0B32'
SET
  @BandSetID_060a643c = '7E3B9C42-0A1D-4E58-9B6F-2C4D8A1F0B30'
SET
  @Label_060a643c = N'Neutral'
SET
  @MinScore_060a643c = 40
SET
  @MaxScore_060a643c = 70
SET
  @Severity_060a643c = 2
SET
  @ColorHex_060a643c = N'#F59E0B'
SET
  @IsTerminal_060a643c = 0
SET
  @Description_060a643c = N'Moderate engagement — monitor.' IF NOT EXISTS (SELECT 1 FROM [${flyway:defaultSchema}].[ScoreBand] WHERE ID = @ID_060a643c)
EXEC [${flyway:defaultSchema}].spCreateScoreBand @ID = @ID_060a643c,
  @BandSetID = @BandSetID_060a643c,
  @Label = @Label_060a643c,
  @MinScore = @MinScore_060a643c,
  @MaxScore = @MaxScore_060a643c,
  @Severity = @Severity_060a643c,
  @ColorHex = @ColorHex_060a643c,
  @IsTerminal = @IsTerminal_060a643c,
  @Description = @Description_060a643c;

GO

-- Save MJ_BizApps_Sonar: Score Bands (core SP call only)
DECLARE @ID_2bc54717 UNIQUEIDENTIFIER,
@BandSetID_2bc54717 UNIQUEIDENTIFIER,
@Label_2bc54717 NVARCHAR(60),
@MinScore_2bc54717 DECIMAL(9, 4),
@MaxScore_2bc54717 DECIMAL(9, 4),
@Severity_2bc54717 INT,
@ColorHex_2bc54717 NVARCHAR(7),
@IsTerminal_2bc54717 BIT,
@Description_2bc54717 NVARCHAR(MAX)
SET
  @ID_2bc54717 = '7E3B9C42-0A1D-4E58-9B6F-2C4D8A1F0B33'
SET
  @BandSetID_2bc54717 = '7E3B9C42-0A1D-4E58-9B6F-2C4D8A1F0B30'
SET
  @Label_2bc54717 = N'Healthy'
SET
  @MinScore_2bc54717 = 70
SET
  @MaxScore_2bc54717 = 100
SET
  @Severity_2bc54717 = 1
SET
  @ColorHex_2bc54717 = N'#16A34A'
SET
  @IsTerminal_2bc54717 = 0
SET
  @Description_2bc54717 = N'Strong engagement.' IF NOT EXISTS (SELECT 1 FROM [${flyway:defaultSchema}].[ScoreBand] WHERE ID = @ID_2bc54717)
EXEC [${flyway:defaultSchema}].spCreateScoreBand @ID = @ID_2bc54717,
  @BandSetID = @BandSetID_2bc54717,
  @Label = @Label_2bc54717,
  @MinScore = @MinScore_2bc54717,
  @MaxScore = @MaxScore_2bc54717,
  @Severity = @Severity_2bc54717,
  @ColorHex = @ColorHex_2bc54717,
  @IsTerminal = @IsTerminal_2bc54717,
  @Description = @Description_2bc54717;

GO

-- Save MJ: Actions (core SP call only)
DECLARE @ID_8f390e6b UNIQUEIDENTIFIER,
@CategoryID_8f390e6b UNIQUEIDENTIFIER,
@Name_8f390e6b NVARCHAR(425),
@Description_8f390e6b NVARCHAR(MAX),
@Type_8f390e6b NVARCHAR(20),
@UserPrompt_8f390e6b NVARCHAR(MAX),
@UserComments_8f390e6b NVARCHAR(MAX),
@Code_8f390e6b NVARCHAR(MAX),
@CodeComments_8f390e6b NVARCHAR(MAX),
@CodeApprovalStatus_8f390e6b NVARCHAR(20),
@CodeApprovalComments_8f390e6b NVARCHAR(MAX),
@CodeApprovedByUserID_8f390e6b UNIQUEIDENTIFIER,
@CodeApprovedAt_8f390e6b DATETIMEOFFSET,
@CodeLocked_8f390e6b BIT,
@ForceCodeGeneration_8f390e6b BIT,
@RetentionPeriod_8f390e6b INT,
@Status_8f390e6b NVARCHAR(20),
@DriverClass_8f390e6b NVARCHAR(255),
@ParentID_8f390e6b UNIQUEIDENTIFIER,
@IconClass_8f390e6b NVARCHAR(100),
@DefaultCompactPromptID_8f390e6b UNIQUEIDENTIFIER,
@Config_8f390e6b NVARCHAR(MAX),
@RuntimeActionConfiguration_8f390e6b NVARCHAR(MAX),
@MaxExecutionTimeMS_8f390e6b INT,
@CreatedByAgentID_8f390e6b UNIQUEIDENTIFIER
SET
  @ID_8f390e6b = '5044A100-0001-4000-8000-000000000001'
SET
  @CategoryID_8f390e6b = '0DC7433E-F36B-1410-8DB6-00021F8B792E'
SET
  @Name_8f390e6b = N'Sonar: Preview Model'
SET
  @Description_8f390e6b = N'Computes engagement scores for a Sonar model WITHOUT persisting them and returns a band distribution + a sample-member breakdown. Read-only; safe on a draft model. Backs the Model Builder live preview / Simulate.'
SET
  @Type_8f390e6b = N'Custom'
SET
  @CodeApprovalStatus_8f390e6b = N'Pending'
SET
  @CodeLocked_8f390e6b = 0
SET
  @ForceCodeGeneration_8f390e6b = 0
SET
  @Status_8f390e6b = N'Active'
SET
  @DriverClass_8f390e6b = N'SonarPreviewModel'
SET
  @IconClass_8f390e6b = N'fa-solid fa-wave-square' IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = @ID_8f390e6b)
EXEC [__mj].spCreateAction @ID = @ID_8f390e6b,
  @CategoryID = @CategoryID_8f390e6b,
  @Name = @Name_8f390e6b,
  @Description = @Description_8f390e6b,
  @Type = @Type_8f390e6b,
  @UserPrompt = @UserPrompt_8f390e6b,
  @UserPrompt_Clear = 1,
  @UserComments = @UserComments_8f390e6b,
  @UserComments_Clear = 1,
  @Code = @Code_8f390e6b,
  @Code_Clear = 1,
  @CodeComments = @CodeComments_8f390e6b,
  @CodeComments_Clear = 1,
  @CodeApprovalStatus = @CodeApprovalStatus_8f390e6b,
  @CodeApprovalComments = @CodeApprovalComments_8f390e6b,
  @CodeApprovalComments_Clear = 1,
  @CodeApprovedByUserID = @CodeApprovedByUserID_8f390e6b,
  @CodeApprovedByUserID_Clear = 1,
  @CodeApprovedAt = @CodeApprovedAt_8f390e6b,
  @CodeApprovedAt_Clear = 1,
  @CodeLocked = @CodeLocked_8f390e6b,
  @ForceCodeGeneration = @ForceCodeGeneration_8f390e6b,
  @RetentionPeriod = @RetentionPeriod_8f390e6b,
  @RetentionPeriod_Clear = 1,
  @Status = @Status_8f390e6b,
  @DriverClass = @DriverClass_8f390e6b,
  @ParentID = @ParentID_8f390e6b,
  @ParentID_Clear = 1,
  @IconClass = @IconClass_8f390e6b,
  @DefaultCompactPromptID = @DefaultCompactPromptID_8f390e6b,
  @DefaultCompactPromptID_Clear = 1,
  @Config = @Config_8f390e6b,
  @Config_Clear = 1,
  @RuntimeActionConfiguration = @RuntimeActionConfiguration_8f390e6b,
  @RuntimeActionConfiguration_Clear = 1,
  @MaxExecutionTimeMS = @MaxExecutionTimeMS_8f390e6b,
  @MaxExecutionTimeMS_Clear = 1,
  @CreatedByAgentID = @CreatedByAgentID_8f390e6b,
  @CreatedByAgentID_Clear = 1;

GO

-- Save MJ: Actions (core SP call only)
DECLARE @ID_ba09e796 UNIQUEIDENTIFIER,
@CategoryID_ba09e796 UNIQUEIDENTIFIER,
@Name_ba09e796 NVARCHAR(425),
@Description_ba09e796 NVARCHAR(MAX),
@Type_ba09e796 NVARCHAR(20),
@UserPrompt_ba09e796 NVARCHAR(MAX),
@UserComments_ba09e796 NVARCHAR(MAX),
@Code_ba09e796 NVARCHAR(MAX),
@CodeComments_ba09e796 NVARCHAR(MAX),
@CodeApprovalStatus_ba09e796 NVARCHAR(20),
@CodeApprovalComments_ba09e796 NVARCHAR(MAX),
@CodeApprovedByUserID_ba09e796 UNIQUEIDENTIFIER,
@CodeApprovedAt_ba09e796 DATETIMEOFFSET,
@CodeLocked_ba09e796 BIT,
@ForceCodeGeneration_ba09e796 BIT,
@RetentionPeriod_ba09e796 INT,
@Status_ba09e796 NVARCHAR(20),
@DriverClass_ba09e796 NVARCHAR(255),
@ParentID_ba09e796 UNIQUEIDENTIFIER,
@IconClass_ba09e796 NVARCHAR(100),
@DefaultCompactPromptID_ba09e796 UNIQUEIDENTIFIER,
@Config_ba09e796 NVARCHAR(MAX),
@RuntimeActionConfiguration_ba09e796 NVARCHAR(MAX),
@MaxExecutionTimeMS_ba09e796 INT,
@CreatedByAgentID_ba09e796 UNIQUEIDENTIFIER
SET
  @ID_ba09e796 = '5044A100-0002-4000-8000-000000000002'
SET
  @CategoryID_ba09e796 = '0DC7433E-F36B-1410-8DB6-00021F8B792E'
SET
  @Name_ba09e796 = N'Sonar: Recompute Model'
SET
  @Description_ba09e796 = N'Computes AND persists a full scoring run for a Sonar model (records a ScoreRecomputeRun, upserts Scores + contributions). Requires a published model (a Score must reference the version that produced it).'
SET
  @Type_ba09e796 = N'Custom'
SET
  @CodeApprovalStatus_ba09e796 = N'Pending'
SET
  @CodeLocked_ba09e796 = 0
SET
  @ForceCodeGeneration_ba09e796 = 0
SET
  @Status_ba09e796 = N'Active'
SET
  @DriverClass_ba09e796 = N'SonarRecomputeModel'
SET
  @IconClass_ba09e796 = N'fa-solid fa-rotate' IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = @ID_ba09e796)
EXEC [__mj].spCreateAction @ID = @ID_ba09e796,
  @CategoryID = @CategoryID_ba09e796,
  @Name = @Name_ba09e796,
  @Description = @Description_ba09e796,
  @Type = @Type_ba09e796,
  @UserPrompt = @UserPrompt_ba09e796,
  @UserPrompt_Clear = 1,
  @UserComments = @UserComments_ba09e796,
  @UserComments_Clear = 1,
  @Code = @Code_ba09e796,
  @Code_Clear = 1,
  @CodeComments = @CodeComments_ba09e796,
  @CodeComments_Clear = 1,
  @CodeApprovalStatus = @CodeApprovalStatus_ba09e796,
  @CodeApprovalComments = @CodeApprovalComments_ba09e796,
  @CodeApprovalComments_Clear = 1,
  @CodeApprovedByUserID = @CodeApprovedByUserID_ba09e796,
  @CodeApprovedByUserID_Clear = 1,
  @CodeApprovedAt = @CodeApprovedAt_ba09e796,
  @CodeApprovedAt_Clear = 1,
  @CodeLocked = @CodeLocked_ba09e796,
  @ForceCodeGeneration = @ForceCodeGeneration_ba09e796,
  @RetentionPeriod = @RetentionPeriod_ba09e796,
  @RetentionPeriod_Clear = 1,
  @Status = @Status_ba09e796,
  @DriverClass = @DriverClass_ba09e796,
  @ParentID = @ParentID_ba09e796,
  @ParentID_Clear = 1,
  @IconClass = @IconClass_ba09e796,
  @DefaultCompactPromptID = @DefaultCompactPromptID_ba09e796,
  @DefaultCompactPromptID_Clear = 1,
  @Config = @Config_ba09e796,
  @Config_Clear = 1,
  @RuntimeActionConfiguration = @RuntimeActionConfiguration_ba09e796,
  @RuntimeActionConfiguration_Clear = 1,
  @MaxExecutionTimeMS = @MaxExecutionTimeMS_ba09e796,
  @MaxExecutionTimeMS_Clear = 1,
  @CreatedByAgentID = @CreatedByAgentID_ba09e796,
  @CreatedByAgentID_Clear = 1;

GO

-- Save MJ: Actions (core SP call only)
DECLARE @ID_e7c4b868 UNIQUEIDENTIFIER,
@CategoryID_e7c4b868 UNIQUEIDENTIFIER,
@Name_e7c4b868 NVARCHAR(425),
@Description_e7c4b868 NVARCHAR(MAX),
@Type_e7c4b868 NVARCHAR(20),
@UserPrompt_e7c4b868 NVARCHAR(MAX),
@UserComments_e7c4b868 NVARCHAR(MAX),
@Code_e7c4b868 NVARCHAR(MAX),
@CodeComments_e7c4b868 NVARCHAR(MAX),
@CodeApprovalStatus_e7c4b868 NVARCHAR(20),
@CodeApprovalComments_e7c4b868 NVARCHAR(MAX),
@CodeApprovedByUserID_e7c4b868 UNIQUEIDENTIFIER,
@CodeApprovedAt_e7c4b868 DATETIMEOFFSET,
@CodeLocked_e7c4b868 BIT,
@ForceCodeGeneration_e7c4b868 BIT,
@RetentionPeriod_e7c4b868 INT,
@Status_e7c4b868 NVARCHAR(20),
@DriverClass_e7c4b868 NVARCHAR(255),
@ParentID_e7c4b868 UNIQUEIDENTIFIER,
@IconClass_e7c4b868 NVARCHAR(100),
@DefaultCompactPromptID_e7c4b868 UNIQUEIDENTIFIER,
@Config_e7c4b868 NVARCHAR(MAX),
@RuntimeActionConfiguration_e7c4b868 NVARCHAR(MAX),
@MaxExecutionTimeMS_e7c4b868 INT,
@CreatedByAgentID_e7c4b868 UNIQUEIDENTIFIER
SET
  @ID_e7c4b868 = '5044A100-0003-4000-8000-000000000003'
SET
  @CategoryID_e7c4b868 = '0DC7433E-F36B-1410-8DB6-00021F8B792E'
SET
  @Name_e7c4b868 = N'Sonar: Validate Factor'
SET
  @Description_e7c4b868 = N'Evaluates an unsaved draft declarative factor over the live population WITHOUT persisting, returning a representative member''s raw value + normalized strength. Backs the Factor Builder live preview; read-only, safe on a draft model.'
SET
  @Type_e7c4b868 = N'Custom'
SET
  @CodeApprovalStatus_e7c4b868 = N'Pending'
SET
  @CodeLocked_e7c4b868 = 0
SET
  @ForceCodeGeneration_e7c4b868 = 0
SET
  @Status_e7c4b868 = N'Active'
SET
  @DriverClass_e7c4b868 = N'SonarValidateFactor'
SET
  @IconClass_e7c4b868 = N'fa-solid fa-flask' IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = @ID_e7c4b868)
EXEC [__mj].spCreateAction @ID = @ID_e7c4b868,
  @CategoryID = @CategoryID_e7c4b868,
  @Name = @Name_e7c4b868,
  @Description = @Description_e7c4b868,
  @Type = @Type_e7c4b868,
  @UserPrompt = @UserPrompt_e7c4b868,
  @UserPrompt_Clear = 1,
  @UserComments = @UserComments_e7c4b868,
  @UserComments_Clear = 1,
  @Code = @Code_e7c4b868,
  @Code_Clear = 1,
  @CodeComments = @CodeComments_e7c4b868,
  @CodeComments_Clear = 1,
  @CodeApprovalStatus = @CodeApprovalStatus_e7c4b868,
  @CodeApprovalComments = @CodeApprovalComments_e7c4b868,
  @CodeApprovalComments_Clear = 1,
  @CodeApprovedByUserID = @CodeApprovedByUserID_e7c4b868,
  @CodeApprovedByUserID_Clear = 1,
  @CodeApprovedAt = @CodeApprovedAt_e7c4b868,
  @CodeApprovedAt_Clear = 1,
  @CodeLocked = @CodeLocked_e7c4b868,
  @ForceCodeGeneration = @ForceCodeGeneration_e7c4b868,
  @RetentionPeriod = @RetentionPeriod_e7c4b868,
  @RetentionPeriod_Clear = 1,
  @Status = @Status_e7c4b868,
  @DriverClass = @DriverClass_e7c4b868,
  @ParentID = @ParentID_e7c4b868,
  @ParentID_Clear = 1,
  @IconClass = @IconClass_e7c4b868,
  @DefaultCompactPromptID = @DefaultCompactPromptID_e7c4b868,
  @DefaultCompactPromptID_Clear = 1,
  @Config = @Config_e7c4b868,
  @Config_Clear = 1,
  @RuntimeActionConfiguration = @RuntimeActionConfiguration_e7c4b868,
  @RuntimeActionConfiguration_Clear = 1,
  @MaxExecutionTimeMS = @MaxExecutionTimeMS_e7c4b868,
  @MaxExecutionTimeMS_Clear = 1,
  @CreatedByAgentID = @CreatedByAgentID_e7c4b868,
  @CreatedByAgentID_Clear = 1;

GO

-- Save MJ: Actions (core SP call only)
DECLARE @ID_ca53e85f UNIQUEIDENTIFIER,
@CategoryID_ca53e85f UNIQUEIDENTIFIER,
@Name_ca53e85f NVARCHAR(425),
@Description_ca53e85f NVARCHAR(MAX),
@Type_ca53e85f NVARCHAR(20),
@UserPrompt_ca53e85f NVARCHAR(MAX),
@UserComments_ca53e85f NVARCHAR(MAX),
@Code_ca53e85f NVARCHAR(MAX),
@CodeComments_ca53e85f NVARCHAR(MAX),
@CodeApprovalStatus_ca53e85f NVARCHAR(20),
@CodeApprovalComments_ca53e85f NVARCHAR(MAX),
@CodeApprovedByUserID_ca53e85f UNIQUEIDENTIFIER,
@CodeApprovedAt_ca53e85f DATETIMEOFFSET,
@CodeLocked_ca53e85f BIT,
@ForceCodeGeneration_ca53e85f BIT,
@RetentionPeriod_ca53e85f INT,
@Status_ca53e85f NVARCHAR(20),
@DriverClass_ca53e85f NVARCHAR(255),
@ParentID_ca53e85f UNIQUEIDENTIFIER,
@IconClass_ca53e85f NVARCHAR(100),
@DefaultCompactPromptID_ca53e85f UNIQUEIDENTIFIER,
@Config_ca53e85f NVARCHAR(MAX),
@RuntimeActionConfiguration_ca53e85f NVARCHAR(MAX),
@MaxExecutionTimeMS_ca53e85f INT,
@CreatedByAgentID_ca53e85f UNIQUEIDENTIFIER
SET
  @ID_ca53e85f = '5044A100-0005-4000-8000-000000000005'
SET
  @CategoryID_ca53e85f = '0DC7433E-F36B-1410-8DB6-00021F8B792E'
SET
  @Name_ca53e85f = N'Sonar: List Factor Actions'
SET
  @Description_ca53e85f = N'Returns the catalog of factor-actions (MJ Actions following the Sonar factor contract) with each action''s self-described contract — what it measures, the entities it reads, its output meaning, and cost profile — plus its configurable params. Backs the Model Builder ''custom signal'' picker. Read-only.'
SET
  @Type_ca53e85f = N'Custom'
SET
  @CodeApprovalStatus_ca53e85f = N'Pending'
SET
  @CodeLocked_ca53e85f = 0
SET
  @ForceCodeGeneration_ca53e85f = 0
SET
  @Status_ca53e85f = N'Active'
SET
  @DriverClass_ca53e85f = N'SonarListFactorActions'
SET
  @IconClass_ca53e85f = N'fa-solid fa-list-check' IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = @ID_ca53e85f)
EXEC [__mj].spCreateAction @ID = @ID_ca53e85f,
  @CategoryID = @CategoryID_ca53e85f,
  @Name = @Name_ca53e85f,
  @Description = @Description_ca53e85f,
  @Type = @Type_ca53e85f,
  @UserPrompt = @UserPrompt_ca53e85f,
  @UserPrompt_Clear = 1,
  @UserComments = @UserComments_ca53e85f,
  @UserComments_Clear = 1,
  @Code = @Code_ca53e85f,
  @Code_Clear = 1,
  @CodeComments = @CodeComments_ca53e85f,
  @CodeComments_Clear = 1,
  @CodeApprovalStatus = @CodeApprovalStatus_ca53e85f,
  @CodeApprovalComments = @CodeApprovalComments_ca53e85f,
  @CodeApprovalComments_Clear = 1,
  @CodeApprovedByUserID = @CodeApprovedByUserID_ca53e85f,
  @CodeApprovedByUserID_Clear = 1,
  @CodeApprovedAt = @CodeApprovedAt_ca53e85f,
  @CodeApprovedAt_Clear = 1,
  @CodeLocked = @CodeLocked_ca53e85f,
  @ForceCodeGeneration = @ForceCodeGeneration_ca53e85f,
  @RetentionPeriod = @RetentionPeriod_ca53e85f,
  @RetentionPeriod_Clear = 1,
  @Status = @Status_ca53e85f,
  @DriverClass = @DriverClass_ca53e85f,
  @ParentID = @ParentID_ca53e85f,
  @ParentID_Clear = 1,
  @IconClass = @IconClass_ca53e85f,
  @DefaultCompactPromptID = @DefaultCompactPromptID_ca53e85f,
  @DefaultCompactPromptID_Clear = 1,
  @Config = @Config_ca53e85f,
  @Config_Clear = 1,
  @RuntimeActionConfiguration = @RuntimeActionConfiguration_ca53e85f,
  @RuntimeActionConfiguration_Clear = 1,
  @MaxExecutionTimeMS = @MaxExecutionTimeMS_ca53e85f,
  @MaxExecutionTimeMS_Clear = 1,
  @CreatedByAgentID = @CreatedByAgentID_ca53e85f,
  @CreatedByAgentID_Clear = 1;

GO

-- Save MJ: Actions (core SP call only)
DECLARE @ID_9ed9ada7 UNIQUEIDENTIFIER,
@CategoryID_9ed9ada7 UNIQUEIDENTIFIER,
@Name_9ed9ada7 NVARCHAR(425),
@Description_9ed9ada7 NVARCHAR(MAX),
@Type_9ed9ada7 NVARCHAR(20),
@UserPrompt_9ed9ada7 NVARCHAR(MAX),
@UserComments_9ed9ada7 NVARCHAR(MAX),
@Code_9ed9ada7 NVARCHAR(MAX),
@CodeComments_9ed9ada7 NVARCHAR(MAX),
@CodeApprovalStatus_9ed9ada7 NVARCHAR(20),
@CodeApprovalComments_9ed9ada7 NVARCHAR(MAX),
@CodeApprovedByUserID_9ed9ada7 UNIQUEIDENTIFIER,
@CodeApprovedAt_9ed9ada7 DATETIMEOFFSET,
@CodeLocked_9ed9ada7 BIT,
@ForceCodeGeneration_9ed9ada7 BIT,
@RetentionPeriod_9ed9ada7 INT,
@Status_9ed9ada7 NVARCHAR(20),
@DriverClass_9ed9ada7 NVARCHAR(255),
@ParentID_9ed9ada7 UNIQUEIDENTIFIER,
@IconClass_9ed9ada7 NVARCHAR(100),
@DefaultCompactPromptID_9ed9ada7 UNIQUEIDENTIFIER,
@Config_9ed9ada7 NVARCHAR(MAX),
@RuntimeActionConfiguration_9ed9ada7 NVARCHAR(MAX),
@MaxExecutionTimeMS_9ed9ada7 INT,
@CreatedByAgentID_9ed9ada7 UNIQUEIDENTIFIER
SET
  @ID_9ed9ada7 = '5044A100-0008-4000-8000-000000000008'
SET
  @CategoryID_9ed9ada7 = '0DC7433E-F36B-1410-8DB6-00021F8B792E'
SET
  @Name_9ed9ada7 = N'Sonar: Create Factor'
SET
  @Description_9ed9ada7 = N'Creates a declarative factor and binds it into a model''s rubric (Model Factor). First write tool of the agentic authoring surface; action-backed factors are authored via Codesmith, not here.'
SET
  @Type_9ed9ada7 = N'Custom'
SET
  @CodeApprovalStatus_9ed9ada7 = N'Pending'
SET
  @CodeLocked_9ed9ada7 = 0
SET
  @ForceCodeGeneration_9ed9ada7 = 0
SET
  @Status_9ed9ada7 = N'Active'
SET
  @DriverClass_9ed9ada7 = N'SonarCreateFactor'
SET
  @IconClass_9ed9ada7 = N'fa-solid fa-wave-square' IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = @ID_9ed9ada7)
EXEC [__mj].spCreateAction @ID = @ID_9ed9ada7,
  @CategoryID = @CategoryID_9ed9ada7,
  @Name = @Name_9ed9ada7,
  @Description = @Description_9ed9ada7,
  @Type = @Type_9ed9ada7,
  @UserPrompt = @UserPrompt_9ed9ada7,
  @UserPrompt_Clear = 1,
  @UserComments = @UserComments_9ed9ada7,
  @UserComments_Clear = 1,
  @Code = @Code_9ed9ada7,
  @Code_Clear = 1,
  @CodeComments = @CodeComments_9ed9ada7,
  @CodeComments_Clear = 1,
  @CodeApprovalStatus = @CodeApprovalStatus_9ed9ada7,
  @CodeApprovalComments = @CodeApprovalComments_9ed9ada7,
  @CodeApprovalComments_Clear = 1,
  @CodeApprovedByUserID = @CodeApprovedByUserID_9ed9ada7,
  @CodeApprovedByUserID_Clear = 1,
  @CodeApprovedAt = @CodeApprovedAt_9ed9ada7,
  @CodeApprovedAt_Clear = 1,
  @CodeLocked = @CodeLocked_9ed9ada7,
  @ForceCodeGeneration = @ForceCodeGeneration_9ed9ada7,
  @RetentionPeriod = @RetentionPeriod_9ed9ada7,
  @RetentionPeriod_Clear = 1,
  @Status = @Status_9ed9ada7,
  @DriverClass = @DriverClass_9ed9ada7,
  @ParentID = @ParentID_9ed9ada7,
  @ParentID_Clear = 1,
  @IconClass = @IconClass_9ed9ada7,
  @DefaultCompactPromptID = @DefaultCompactPromptID_9ed9ada7,
  @DefaultCompactPromptID_Clear = 1,
  @Config = @Config_9ed9ada7,
  @Config_Clear = 1,
  @RuntimeActionConfiguration = @RuntimeActionConfiguration_9ed9ada7,
  @RuntimeActionConfiguration_Clear = 1,
  @MaxExecutionTimeMS = @MaxExecutionTimeMS_9ed9ada7,
  @MaxExecutionTimeMS_Clear = 1,
  @CreatedByAgentID = @CreatedByAgentID_9ed9ada7,
  @CreatedByAgentID_Clear = 1;

GO

-- Save MJ: Actions (core SP call only)
DECLARE @ID_d8f709e7 UNIQUEIDENTIFIER,
@CategoryID_d8f709e7 UNIQUEIDENTIFIER,
@Name_d8f709e7 NVARCHAR(425),
@Description_d8f709e7 NVARCHAR(MAX),
@Type_d8f709e7 NVARCHAR(20),
@UserPrompt_d8f709e7 NVARCHAR(MAX),
@UserComments_d8f709e7 NVARCHAR(MAX),
@Code_d8f709e7 NVARCHAR(MAX),
@CodeComments_d8f709e7 NVARCHAR(MAX),
@CodeApprovalStatus_d8f709e7 NVARCHAR(20),
@CodeApprovalComments_d8f709e7 NVARCHAR(MAX),
@CodeApprovedByUserID_d8f709e7 UNIQUEIDENTIFIER,
@CodeApprovedAt_d8f709e7 DATETIMEOFFSET,
@CodeLocked_d8f709e7 BIT,
@ForceCodeGeneration_d8f709e7 BIT,
@RetentionPeriod_d8f709e7 INT,
@Status_d8f709e7 NVARCHAR(20),
@DriverClass_d8f709e7 NVARCHAR(255),
@ParentID_d8f709e7 UNIQUEIDENTIFIER,
@IconClass_d8f709e7 NVARCHAR(100),
@DefaultCompactPromptID_d8f709e7 UNIQUEIDENTIFIER,
@Config_d8f709e7 NVARCHAR(MAX),
@RuntimeActionConfiguration_d8f709e7 NVARCHAR(MAX),
@MaxExecutionTimeMS_d8f709e7 INT,
@CreatedByAgentID_d8f709e7 UNIQUEIDENTIFIER
SET
  @ID_d8f709e7 = '5044A100-0009-4000-8000-000000000009'
SET
  @CategoryID_d8f709e7 = '0DC7433E-F36B-1410-8DB6-00021F8B792E'
SET
  @Name_d8f709e7 = N'Sonar: Add Data Source'
SET
  @Description_d8f709e7 = N'Wires a related entity into a model as a data source (Model Related Entity, Left join). Agentic authoring tool surface.'
SET
  @Type_d8f709e7 = N'Custom'
SET
  @CodeApprovalStatus_d8f709e7 = N'Pending'
SET
  @CodeLocked_d8f709e7 = 0
SET
  @ForceCodeGeneration_d8f709e7 = 0
SET
  @Status_d8f709e7 = N'Active'
SET
  @DriverClass_d8f709e7 = N'SonarAddDataSource'
SET
  @IconClass_d8f709e7 = N'fa-solid fa-diagram-project' IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = @ID_d8f709e7)
EXEC [__mj].spCreateAction @ID = @ID_d8f709e7,
  @CategoryID = @CategoryID_d8f709e7,
  @Name = @Name_d8f709e7,
  @Description = @Description_d8f709e7,
  @Type = @Type_d8f709e7,
  @UserPrompt = @UserPrompt_d8f709e7,
  @UserPrompt_Clear = 1,
  @UserComments = @UserComments_d8f709e7,
  @UserComments_Clear = 1,
  @Code = @Code_d8f709e7,
  @Code_Clear = 1,
  @CodeComments = @CodeComments_d8f709e7,
  @CodeComments_Clear = 1,
  @CodeApprovalStatus = @CodeApprovalStatus_d8f709e7,
  @CodeApprovalComments = @CodeApprovalComments_d8f709e7,
  @CodeApprovalComments_Clear = 1,
  @CodeApprovedByUserID = @CodeApprovedByUserID_d8f709e7,
  @CodeApprovedByUserID_Clear = 1,
  @CodeApprovedAt = @CodeApprovedAt_d8f709e7,
  @CodeApprovedAt_Clear = 1,
  @CodeLocked = @CodeLocked_d8f709e7,
  @ForceCodeGeneration = @ForceCodeGeneration_d8f709e7,
  @RetentionPeriod = @RetentionPeriod_d8f709e7,
  @RetentionPeriod_Clear = 1,
  @Status = @Status_d8f709e7,
  @DriverClass = @DriverClass_d8f709e7,
  @ParentID = @ParentID_d8f709e7,
  @ParentID_Clear = 1,
  @IconClass = @IconClass_d8f709e7,
  @DefaultCompactPromptID = @DefaultCompactPromptID_d8f709e7,
  @DefaultCompactPromptID_Clear = 1,
  @Config = @Config_d8f709e7,
  @Config_Clear = 1,
  @RuntimeActionConfiguration = @RuntimeActionConfiguration_d8f709e7,
  @RuntimeActionConfiguration_Clear = 1,
  @MaxExecutionTimeMS = @MaxExecutionTimeMS_d8f709e7,
  @MaxExecutionTimeMS_Clear = 1,
  @CreatedByAgentID = @CreatedByAgentID_d8f709e7,
  @CreatedByAgentID_Clear = 1;

GO

-- Save MJ: Actions (core SP call only)
DECLARE @ID_a2ba58c7 UNIQUEIDENTIFIER,
@CategoryID_a2ba58c7 UNIQUEIDENTIFIER,
@Name_a2ba58c7 NVARCHAR(425),
@Description_a2ba58c7 NVARCHAR(MAX),
@Type_a2ba58c7 NVARCHAR(20),
@UserPrompt_a2ba58c7 NVARCHAR(MAX),
@UserComments_a2ba58c7 NVARCHAR(MAX),
@Code_a2ba58c7 NVARCHAR(MAX),
@CodeComments_a2ba58c7 NVARCHAR(MAX),
@CodeApprovalStatus_a2ba58c7 NVARCHAR(20),
@CodeApprovalComments_a2ba58c7 NVARCHAR(MAX),
@CodeApprovedByUserID_a2ba58c7 UNIQUEIDENTIFIER,
@CodeApprovedAt_a2ba58c7 DATETIMEOFFSET,
@CodeLocked_a2ba58c7 BIT,
@ForceCodeGeneration_a2ba58c7 BIT,
@RetentionPeriod_a2ba58c7 INT,
@Status_a2ba58c7 NVARCHAR(20),
@DriverClass_a2ba58c7 NVARCHAR(255),
@ParentID_a2ba58c7 UNIQUEIDENTIFIER,
@IconClass_a2ba58c7 NVARCHAR(100),
@DefaultCompactPromptID_a2ba58c7 UNIQUEIDENTIFIER,
@Config_a2ba58c7 NVARCHAR(MAX),
@RuntimeActionConfiguration_a2ba58c7 NVARCHAR(MAX),
@MaxExecutionTimeMS_a2ba58c7 INT,
@CreatedByAgentID_a2ba58c7 UNIQUEIDENTIFIER
SET
  @ID_a2ba58c7 = '5044A100-000A-4000-8000-00000000000A'
SET
  @CategoryID_a2ba58c7 = '0DC7433E-F36B-1410-8DB6-00021F8B792E'
SET
  @Name_a2ba58c7 = N'Sonar: Create Model'
SET
  @Description_a2ba58c7 = N'Creates a draft ScoreModel (name + anchor entity). Draft by design; publishing is a separate, gated step. Agentic authoring tool surface.'
SET
  @Type_a2ba58c7 = N'Custom'
SET
  @CodeApprovalStatus_a2ba58c7 = N'Pending'
SET
  @CodeLocked_a2ba58c7 = 0
SET
  @ForceCodeGeneration_a2ba58c7 = 0
SET
  @Status_a2ba58c7 = N'Active'
SET
  @DriverClass_a2ba58c7 = N'SonarCreateModel'
SET
  @IconClass_a2ba58c7 = N'fa-solid fa-sliders' IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = @ID_a2ba58c7)
EXEC [__mj].spCreateAction @ID = @ID_a2ba58c7,
  @CategoryID = @CategoryID_a2ba58c7,
  @Name = @Name_a2ba58c7,
  @Description = @Description_a2ba58c7,
  @Type = @Type_a2ba58c7,
  @UserPrompt = @UserPrompt_a2ba58c7,
  @UserPrompt_Clear = 1,
  @UserComments = @UserComments_a2ba58c7,
  @UserComments_Clear = 1,
  @Code = @Code_a2ba58c7,
  @Code_Clear = 1,
  @CodeComments = @CodeComments_a2ba58c7,
  @CodeComments_Clear = 1,
  @CodeApprovalStatus = @CodeApprovalStatus_a2ba58c7,
  @CodeApprovalComments = @CodeApprovalComments_a2ba58c7,
  @CodeApprovalComments_Clear = 1,
  @CodeApprovedByUserID = @CodeApprovedByUserID_a2ba58c7,
  @CodeApprovedByUserID_Clear = 1,
  @CodeApprovedAt = @CodeApprovedAt_a2ba58c7,
  @CodeApprovedAt_Clear = 1,
  @CodeLocked = @CodeLocked_a2ba58c7,
  @ForceCodeGeneration = @ForceCodeGeneration_a2ba58c7,
  @RetentionPeriod = @RetentionPeriod_a2ba58c7,
  @RetentionPeriod_Clear = 1,
  @Status = @Status_a2ba58c7,
  @DriverClass = @DriverClass_a2ba58c7,
  @ParentID = @ParentID_a2ba58c7,
  @ParentID_Clear = 1,
  @IconClass = @IconClass_a2ba58c7,
  @DefaultCompactPromptID = @DefaultCompactPromptID_a2ba58c7,
  @DefaultCompactPromptID_Clear = 1,
  @Config = @Config_a2ba58c7,
  @Config_Clear = 1,
  @RuntimeActionConfiguration = @RuntimeActionConfiguration_a2ba58c7,
  @RuntimeActionConfiguration_Clear = 1,
  @MaxExecutionTimeMS = @MaxExecutionTimeMS_a2ba58c7,
  @MaxExecutionTimeMS_Clear = 1,
  @CreatedByAgentID = @CreatedByAgentID_a2ba58c7,
  @CreatedByAgentID_Clear = 1;

GO

-- Save MJ: Actions (core SP call only)
DECLARE @ID_00821672 UNIQUEIDENTIFIER,
@CategoryID_00821672 UNIQUEIDENTIFIER,
@Name_00821672 NVARCHAR(425),
@Description_00821672 NVARCHAR(MAX),
@Type_00821672 NVARCHAR(20),
@UserPrompt_00821672 NVARCHAR(MAX),
@UserComments_00821672 NVARCHAR(MAX),
@Code_00821672 NVARCHAR(MAX),
@CodeComments_00821672 NVARCHAR(MAX),
@CodeApprovalStatus_00821672 NVARCHAR(20),
@CodeApprovalComments_00821672 NVARCHAR(MAX),
@CodeApprovedByUserID_00821672 UNIQUEIDENTIFIER,
@CodeApprovedAt_00821672 DATETIMEOFFSET,
@CodeLocked_00821672 BIT,
@ForceCodeGeneration_00821672 BIT,
@RetentionPeriod_00821672 INT,
@Status_00821672 NVARCHAR(20),
@DriverClass_00821672 NVARCHAR(255),
@ParentID_00821672 UNIQUEIDENTIFIER,
@IconClass_00821672 NVARCHAR(100),
@DefaultCompactPromptID_00821672 UNIQUEIDENTIFIER,
@Config_00821672 NVARCHAR(MAX),
@RuntimeActionConfiguration_00821672 NVARCHAR(MAX),
@MaxExecutionTimeMS_00821672 INT,
@CreatedByAgentID_00821672 UNIQUEIDENTIFIER
SET
  @ID_00821672 = '5044A100-000B-4000-8000-00000000000B'
SET
  @CategoryID_00821672 = '0DC7433E-F36B-1410-8DB6-00021F8B792E'
SET
  @Name_00821672 = N'Sonar: Set Band Set'
SET
  @Description_00821672 = N'Points a model at an existing Score Band Set (ScoreModel.BandSetID) so it becomes scoreable. Agentic authoring tool surface.'
SET
  @Type_00821672 = N'Custom'
SET
  @CodeApprovalStatus_00821672 = N'Pending'
SET
  @CodeLocked_00821672 = 0
SET
  @ForceCodeGeneration_00821672 = 0
SET
  @Status_00821672 = N'Active'
SET
  @DriverClass_00821672 = N'SonarSetBandSet'
SET
  @IconClass_00821672 = N'fa-solid fa-layer-group' IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = @ID_00821672)
EXEC [__mj].spCreateAction @ID = @ID_00821672,
  @CategoryID = @CategoryID_00821672,
  @Name = @Name_00821672,
  @Description = @Description_00821672,
  @Type = @Type_00821672,
  @UserPrompt = @UserPrompt_00821672,
  @UserPrompt_Clear = 1,
  @UserComments = @UserComments_00821672,
  @UserComments_Clear = 1,
  @Code = @Code_00821672,
  @Code_Clear = 1,
  @CodeComments = @CodeComments_00821672,
  @CodeComments_Clear = 1,
  @CodeApprovalStatus = @CodeApprovalStatus_00821672,
  @CodeApprovalComments = @CodeApprovalComments_00821672,
  @CodeApprovalComments_Clear = 1,
  @CodeApprovedByUserID = @CodeApprovedByUserID_00821672,
  @CodeApprovedByUserID_Clear = 1,
  @CodeApprovedAt = @CodeApprovedAt_00821672,
  @CodeApprovedAt_Clear = 1,
  @CodeLocked = @CodeLocked_00821672,
  @ForceCodeGeneration = @ForceCodeGeneration_00821672,
  @RetentionPeriod = @RetentionPeriod_00821672,
  @RetentionPeriod_Clear = 1,
  @Status = @Status_00821672,
  @DriverClass = @DriverClass_00821672,
  @ParentID = @ParentID_00821672,
  @ParentID_Clear = 1,
  @IconClass = @IconClass_00821672,
  @DefaultCompactPromptID = @DefaultCompactPromptID_00821672,
  @DefaultCompactPromptID_Clear = 1,
  @Config = @Config_00821672,
  @Config_Clear = 1,
  @RuntimeActionConfiguration = @RuntimeActionConfiguration_00821672,
  @RuntimeActionConfiguration_Clear = 1,
  @MaxExecutionTimeMS = @MaxExecutionTimeMS_00821672,
  @MaxExecutionTimeMS_Clear = 1,
  @CreatedByAgentID = @CreatedByAgentID_00821672,
  @CreatedByAgentID_Clear = 1;

GO

-- Save MJ: Actions (core SP call only)
DECLARE @ID_3e863fdc UNIQUEIDENTIFIER,
@CategoryID_3e863fdc UNIQUEIDENTIFIER,
@Name_3e863fdc NVARCHAR(425),
@Description_3e863fdc NVARCHAR(MAX),
@Type_3e863fdc NVARCHAR(20),
@UserPrompt_3e863fdc NVARCHAR(MAX),
@UserComments_3e863fdc NVARCHAR(MAX),
@Code_3e863fdc NVARCHAR(MAX),
@CodeComments_3e863fdc NVARCHAR(MAX),
@CodeApprovalStatus_3e863fdc NVARCHAR(20),
@CodeApprovalComments_3e863fdc NVARCHAR(MAX),
@CodeApprovedByUserID_3e863fdc UNIQUEIDENTIFIER,
@CodeApprovedAt_3e863fdc DATETIMEOFFSET,
@CodeLocked_3e863fdc BIT,
@ForceCodeGeneration_3e863fdc BIT,
@RetentionPeriod_3e863fdc INT,
@Status_3e863fdc NVARCHAR(20),
@DriverClass_3e863fdc NVARCHAR(255),
@ParentID_3e863fdc UNIQUEIDENTIFIER,
@IconClass_3e863fdc NVARCHAR(100),
@DefaultCompactPromptID_3e863fdc UNIQUEIDENTIFIER,
@Config_3e863fdc NVARCHAR(MAX),
@RuntimeActionConfiguration_3e863fdc NVARCHAR(MAX),
@MaxExecutionTimeMS_3e863fdc INT,
@CreatedByAgentID_3e863fdc UNIQUEIDENTIFIER
SET
  @ID_3e863fdc = '5044A100-000C-4000-8000-000000000008'
SET
  @CategoryID_3e863fdc = '0DC7433E-F36B-1410-8DB6-00021F8B792E'
SET
  @Name_3e863fdc = N'Sonar: Get Prompt'
SET
  @Description_3e863fdc = N'Reads an MJ AIPrompt''s editable text (resolved via name → template → active template content) for the factor builder''s prompt panel. Returns the text plus the ids the editor needs to save back. Read-only.'
SET
  @Type_3e863fdc = N'Custom'
SET
  @CodeApprovalStatus_3e863fdc = N'Pending'
SET
  @CodeLocked_3e863fdc = 0
SET
  @ForceCodeGeneration_3e863fdc = 0
SET
  @Status_3e863fdc = N'Active'
SET
  @DriverClass_3e863fdc = N'SonarGetPrompt'
SET
  @IconClass_3e863fdc = N'fa-solid fa-file-lines' IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = @ID_3e863fdc)
EXEC [__mj].spCreateAction @ID = @ID_3e863fdc,
  @CategoryID = @CategoryID_3e863fdc,
  @Name = @Name_3e863fdc,
  @Description = @Description_3e863fdc,
  @Type = @Type_3e863fdc,
  @UserPrompt = @UserPrompt_3e863fdc,
  @UserPrompt_Clear = 1,
  @UserComments = @UserComments_3e863fdc,
  @UserComments_Clear = 1,
  @Code = @Code_3e863fdc,
  @Code_Clear = 1,
  @CodeComments = @CodeComments_3e863fdc,
  @CodeComments_Clear = 1,
  @CodeApprovalStatus = @CodeApprovalStatus_3e863fdc,
  @CodeApprovalComments = @CodeApprovalComments_3e863fdc,
  @CodeApprovalComments_Clear = 1,
  @CodeApprovedByUserID = @CodeApprovedByUserID_3e863fdc,
  @CodeApprovedByUserID_Clear = 1,
  @CodeApprovedAt = @CodeApprovedAt_3e863fdc,
  @CodeApprovedAt_Clear = 1,
  @CodeLocked = @CodeLocked_3e863fdc,
  @ForceCodeGeneration = @ForceCodeGeneration_3e863fdc,
  @RetentionPeriod = @RetentionPeriod_3e863fdc,
  @RetentionPeriod_Clear = 1,
  @Status = @Status_3e863fdc,
  @DriverClass = @DriverClass_3e863fdc,
  @ParentID = @ParentID_3e863fdc,
  @ParentID_Clear = 1,
  @IconClass = @IconClass_3e863fdc,
  @DefaultCompactPromptID = @DefaultCompactPromptID_3e863fdc,
  @DefaultCompactPromptID_Clear = 1,
  @Config = @Config_3e863fdc,
  @Config_Clear = 1,
  @RuntimeActionConfiguration = @RuntimeActionConfiguration_3e863fdc,
  @RuntimeActionConfiguration_Clear = 1,
  @MaxExecutionTimeMS = @MaxExecutionTimeMS_3e863fdc,
  @MaxExecutionTimeMS_Clear = 1,
  @CreatedByAgentID = @CreatedByAgentID_3e863fdc,
  @CreatedByAgentID_Clear = 1;

GO

-- Save MJ: Actions (core SP call only)
DECLARE @ID_4ce0b34a UNIQUEIDENTIFIER,
@CategoryID_4ce0b34a UNIQUEIDENTIFIER,
@Name_4ce0b34a NVARCHAR(425),
@Description_4ce0b34a NVARCHAR(MAX),
@Type_4ce0b34a NVARCHAR(20),
@UserPrompt_4ce0b34a NVARCHAR(MAX),
@UserComments_4ce0b34a NVARCHAR(MAX),
@Code_4ce0b34a NVARCHAR(MAX),
@CodeComments_4ce0b34a NVARCHAR(MAX),
@CodeApprovalStatus_4ce0b34a NVARCHAR(20),
@CodeApprovalComments_4ce0b34a NVARCHAR(MAX),
@CodeApprovedByUserID_4ce0b34a UNIQUEIDENTIFIER,
@CodeApprovedAt_4ce0b34a DATETIMEOFFSET,
@CodeLocked_4ce0b34a BIT,
@ForceCodeGeneration_4ce0b34a BIT,
@RetentionPeriod_4ce0b34a INT,
@Status_4ce0b34a NVARCHAR(20),
@DriverClass_4ce0b34a NVARCHAR(255),
@ParentID_4ce0b34a UNIQUEIDENTIFIER,
@IconClass_4ce0b34a NVARCHAR(100),
@DefaultCompactPromptID_4ce0b34a UNIQUEIDENTIFIER,
@Config_4ce0b34a NVARCHAR(MAX),
@RuntimeActionConfiguration_4ce0b34a NVARCHAR(MAX),
@MaxExecutionTimeMS_4ce0b34a INT,
@CreatedByAgentID_4ce0b34a UNIQUEIDENTIFIER
SET
  @ID_4ce0b34a = '5044A100-000D-4000-8000-000000000009'
SET
  @CategoryID_4ce0b34a = '0DC7433E-F36B-1410-8DB6-00021F8B792E'
SET
  @Name_4ce0b34a = N'Sonar: Update Prompt'
SET
  @Description_4ce0b34a = N'Saves edited LLM prompt text from the factor builder onto the AIPrompt''s TemplateContent row (by TemplateContentID from Sonar: Get Prompt). NOTE: an AIPrompt is shared — editing affects every factor/use that references it.'
SET
  @Type_4ce0b34a = N'Custom'
SET
  @CodeApprovalStatus_4ce0b34a = N'Pending'
SET
  @CodeLocked_4ce0b34a = 0
SET
  @ForceCodeGeneration_4ce0b34a = 0
SET
  @Status_4ce0b34a = N'Active'
SET
  @DriverClass_4ce0b34a = N'SonarUpdatePrompt'
SET
  @IconClass_4ce0b34a = N'fa-solid fa-floppy-disk' IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = @ID_4ce0b34a)
EXEC [__mj].spCreateAction @ID = @ID_4ce0b34a,
  @CategoryID = @CategoryID_4ce0b34a,
  @Name = @Name_4ce0b34a,
  @Description = @Description_4ce0b34a,
  @Type = @Type_4ce0b34a,
  @UserPrompt = @UserPrompt_4ce0b34a,
  @UserPrompt_Clear = 1,
  @UserComments = @UserComments_4ce0b34a,
  @UserComments_Clear = 1,
  @Code = @Code_4ce0b34a,
  @Code_Clear = 1,
  @CodeComments = @CodeComments_4ce0b34a,
  @CodeComments_Clear = 1,
  @CodeApprovalStatus = @CodeApprovalStatus_4ce0b34a,
  @CodeApprovalComments = @CodeApprovalComments_4ce0b34a,
  @CodeApprovalComments_Clear = 1,
  @CodeApprovedByUserID = @CodeApprovedByUserID_4ce0b34a,
  @CodeApprovedByUserID_Clear = 1,
  @CodeApprovedAt = @CodeApprovedAt_4ce0b34a,
  @CodeApprovedAt_Clear = 1,
  @CodeLocked = @CodeLocked_4ce0b34a,
  @ForceCodeGeneration = @ForceCodeGeneration_4ce0b34a,
  @RetentionPeriod = @RetentionPeriod_4ce0b34a,
  @RetentionPeriod_Clear = 1,
  @Status = @Status_4ce0b34a,
  @DriverClass = @DriverClass_4ce0b34a,
  @ParentID = @ParentID_4ce0b34a,
  @ParentID_Clear = 1,
  @IconClass = @IconClass_4ce0b34a,
  @DefaultCompactPromptID = @DefaultCompactPromptID_4ce0b34a,
  @DefaultCompactPromptID_Clear = 1,
  @Config = @Config_4ce0b34a,
  @Config_Clear = 1,
  @RuntimeActionConfiguration = @RuntimeActionConfiguration_4ce0b34a,
  @RuntimeActionConfiguration_Clear = 1,
  @MaxExecutionTimeMS = @MaxExecutionTimeMS_4ce0b34a,
  @MaxExecutionTimeMS_Clear = 1,
  @CreatedByAgentID = @CreatedByAgentID_4ce0b34a,
  @CreatedByAgentID_Clear = 1;

GO

-- Save MJ: Actions (core SP call only)
DECLARE @ID_0bb170c6 UNIQUEIDENTIFIER,
@CategoryID_0bb170c6 UNIQUEIDENTIFIER,
@Name_0bb170c6 NVARCHAR(425),
@Description_0bb170c6 NVARCHAR(MAX),
@Type_0bb170c6 NVARCHAR(20),
@UserPrompt_0bb170c6 NVARCHAR(MAX),
@UserComments_0bb170c6 NVARCHAR(MAX),
@Code_0bb170c6 NVARCHAR(MAX),
@CodeComments_0bb170c6 NVARCHAR(MAX),
@CodeApprovalStatus_0bb170c6 NVARCHAR(20),
@CodeApprovalComments_0bb170c6 NVARCHAR(MAX),
@CodeApprovedByUserID_0bb170c6 UNIQUEIDENTIFIER,
@CodeApprovedAt_0bb170c6 DATETIMEOFFSET,
@CodeLocked_0bb170c6 BIT,
@ForceCodeGeneration_0bb170c6 BIT,
@RetentionPeriod_0bb170c6 INT,
@Status_0bb170c6 NVARCHAR(20),
@DriverClass_0bb170c6 NVARCHAR(255),
@ParentID_0bb170c6 UNIQUEIDENTIFIER,
@IconClass_0bb170c6 NVARCHAR(100),
@DefaultCompactPromptID_0bb170c6 UNIQUEIDENTIFIER,
@Config_0bb170c6 NVARCHAR(MAX),
@RuntimeActionConfiguration_0bb170c6 NVARCHAR(MAX),
@MaxExecutionTimeMS_0bb170c6 INT,
@CreatedByAgentID_0bb170c6 UNIQUEIDENTIFIER
SET
  @ID_0bb170c6 = '5044A100-000E-4000-8000-00000000000E'
SET
  @CategoryID_0bb170c6 = '0DC7433E-F36B-1410-8DB6-00021F8B792E'
SET
  @Name_0bb170c6 = N'Sonar: Run Authoring Agent'
SET
  @Description_0bb170c6 = N'Runs the Sonar Authoring Agent (Loop) server-side via AgentRunner and returns its reply. The seam the Assistant panel calls so the agent runs in MJAPI (where model/LLM/tools live), bypassing the client-side conversation stack. Produces drafts only.'
SET
  @Type_0bb170c6 = N'Custom'
SET
  @CodeApprovalStatus_0bb170c6 = N'Pending'
SET
  @CodeLocked_0bb170c6 = 0
SET
  @ForceCodeGeneration_0bb170c6 = 0
SET
  @Status_0bb170c6 = N'Active'
SET
  @DriverClass_0bb170c6 = N'SonarRunAuthoringAgent'
SET
  @IconClass_0bb170c6 = N'fa-solid fa-wand-magic-sparkles' IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = @ID_0bb170c6)
EXEC [__mj].spCreateAction @ID = @ID_0bb170c6,
  @CategoryID = @CategoryID_0bb170c6,
  @Name = @Name_0bb170c6,
  @Description = @Description_0bb170c6,
  @Type = @Type_0bb170c6,
  @UserPrompt = @UserPrompt_0bb170c6,
  @UserPrompt_Clear = 1,
  @UserComments = @UserComments_0bb170c6,
  @UserComments_Clear = 1,
  @Code = @Code_0bb170c6,
  @Code_Clear = 1,
  @CodeComments = @CodeComments_0bb170c6,
  @CodeComments_Clear = 1,
  @CodeApprovalStatus = @CodeApprovalStatus_0bb170c6,
  @CodeApprovalComments = @CodeApprovalComments_0bb170c6,
  @CodeApprovalComments_Clear = 1,
  @CodeApprovedByUserID = @CodeApprovedByUserID_0bb170c6,
  @CodeApprovedByUserID_Clear = 1,
  @CodeApprovedAt = @CodeApprovedAt_0bb170c6,
  @CodeApprovedAt_Clear = 1,
  @CodeLocked = @CodeLocked_0bb170c6,
  @ForceCodeGeneration = @ForceCodeGeneration_0bb170c6,
  @RetentionPeriod = @RetentionPeriod_0bb170c6,
  @RetentionPeriod_Clear = 1,
  @Status = @Status_0bb170c6,
  @DriverClass = @DriverClass_0bb170c6,
  @ParentID = @ParentID_0bb170c6,
  @ParentID_Clear = 1,
  @IconClass = @IconClass_0bb170c6,
  @DefaultCompactPromptID = @DefaultCompactPromptID_0bb170c6,
  @DefaultCompactPromptID_Clear = 1,
  @Config = @Config_0bb170c6,
  @Config_Clear = 1,
  @RuntimeActionConfiguration = @RuntimeActionConfiguration_0bb170c6,
  @RuntimeActionConfiguration_Clear = 1,
  @MaxExecutionTimeMS = @MaxExecutionTimeMS_0bb170c6,
  @MaxExecutionTimeMS_Clear = 1,
  @CreatedByAgentID = @CreatedByAgentID_0bb170c6,
  @CreatedByAgentID_Clear = 1;

GO

-- Save MJ: Actions (core SP call only)
DECLARE @ID_1c8e97de UNIQUEIDENTIFIER,
@CategoryID_1c8e97de UNIQUEIDENTIFIER,
@Name_1c8e97de NVARCHAR(425),
@Description_1c8e97de NVARCHAR(MAX),
@Type_1c8e97de NVARCHAR(20),
@UserPrompt_1c8e97de NVARCHAR(MAX),
@UserComments_1c8e97de NVARCHAR(MAX),
@Code_1c8e97de NVARCHAR(MAX),
@CodeComments_1c8e97de NVARCHAR(MAX),
@CodeApprovalStatus_1c8e97de NVARCHAR(20),
@CodeApprovalComments_1c8e97de NVARCHAR(MAX),
@CodeApprovedByUserID_1c8e97de UNIQUEIDENTIFIER,
@CodeApprovedAt_1c8e97de DATETIMEOFFSET,
@CodeLocked_1c8e97de BIT,
@ForceCodeGeneration_1c8e97de BIT,
@RetentionPeriod_1c8e97de INT,
@Status_1c8e97de NVARCHAR(20),
@DriverClass_1c8e97de NVARCHAR(255),
@ParentID_1c8e97de UNIQUEIDENTIFIER,
@IconClass_1c8e97de NVARCHAR(100),
@DefaultCompactPromptID_1c8e97de UNIQUEIDENTIFIER,
@Config_1c8e97de NVARCHAR(MAX),
@RuntimeActionConfiguration_1c8e97de NVARCHAR(MAX),
@MaxExecutionTimeMS_1c8e97de INT,
@CreatedByAgentID_1c8e97de UNIQUEIDENTIFIER
SET
  @ID_1c8e97de = '5044A100-000F-4000-8000-00000000000F'
SET
  @CategoryID_1c8e97de = '0DC7433E-F36B-1410-8DB6-00021F8B792E'
SET
  @Name_1c8e97de = N'Sonar: Build Model'
SET
  @Description_1c8e97de = N'Builds a COMPLETE draft model (model + sources + factors + band set) from one spec in a single call — factors reference sources by alias; the action threads the IDs. Use this for building a new model; the granular tools (Create Factor / Add Data Source) are for incremental edits. Draft only.'
SET
  @Type_1c8e97de = N'Custom'
SET
  @CodeApprovalStatus_1c8e97de = N'Pending'
SET
  @CodeLocked_1c8e97de = 0
SET
  @ForceCodeGeneration_1c8e97de = 0
SET
  @Status_1c8e97de = N'Active'
SET
  @DriverClass_1c8e97de = N'SonarBuildModel'
SET
  @IconClass_1c8e97de = N'fa-solid fa-cubes' IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = @ID_1c8e97de)
EXEC [__mj].spCreateAction @ID = @ID_1c8e97de,
  @CategoryID = @CategoryID_1c8e97de,
  @Name = @Name_1c8e97de,
  @Description = @Description_1c8e97de,
  @Type = @Type_1c8e97de,
  @UserPrompt = @UserPrompt_1c8e97de,
  @UserPrompt_Clear = 1,
  @UserComments = @UserComments_1c8e97de,
  @UserComments_Clear = 1,
  @Code = @Code_1c8e97de,
  @Code_Clear = 1,
  @CodeComments = @CodeComments_1c8e97de,
  @CodeComments_Clear = 1,
  @CodeApprovalStatus = @CodeApprovalStatus_1c8e97de,
  @CodeApprovalComments = @CodeApprovalComments_1c8e97de,
  @CodeApprovalComments_Clear = 1,
  @CodeApprovedByUserID = @CodeApprovedByUserID_1c8e97de,
  @CodeApprovedByUserID_Clear = 1,
  @CodeApprovedAt = @CodeApprovedAt_1c8e97de,
  @CodeApprovedAt_Clear = 1,
  @CodeLocked = @CodeLocked_1c8e97de,
  @ForceCodeGeneration = @ForceCodeGeneration_1c8e97de,
  @RetentionPeriod = @RetentionPeriod_1c8e97de,
  @RetentionPeriod_Clear = 1,
  @Status = @Status_1c8e97de,
  @DriverClass = @DriverClass_1c8e97de,
  @ParentID = @ParentID_1c8e97de,
  @ParentID_Clear = 1,
  @IconClass = @IconClass_1c8e97de,
  @DefaultCompactPromptID = @DefaultCompactPromptID_1c8e97de,
  @DefaultCompactPromptID_Clear = 1,
  @Config = @Config_1c8e97de,
  @Config_Clear = 1,
  @RuntimeActionConfiguration = @RuntimeActionConfiguration_1c8e97de,
  @RuntimeActionConfiguration_Clear = 1,
  @MaxExecutionTimeMS = @MaxExecutionTimeMS_1c8e97de,
  @MaxExecutionTimeMS_Clear = 1,
  @CreatedByAgentID = @CreatedByAgentID_1c8e97de,
  @CreatedByAgentID_Clear = 1;

GO

-- Save MJ: Actions (core SP call only)
DECLARE @ID_23caf30a UNIQUEIDENTIFIER,
@CategoryID_23caf30a UNIQUEIDENTIFIER,
@Name_23caf30a NVARCHAR(425),
@Description_23caf30a NVARCHAR(MAX),
@Type_23caf30a NVARCHAR(20),
@UserPrompt_23caf30a NVARCHAR(MAX),
@UserComments_23caf30a NVARCHAR(MAX),
@Code_23caf30a NVARCHAR(MAX),
@CodeComments_23caf30a NVARCHAR(MAX),
@CodeApprovalStatus_23caf30a NVARCHAR(20),
@CodeApprovalComments_23caf30a NVARCHAR(MAX),
@CodeApprovedByUserID_23caf30a UNIQUEIDENTIFIER,
@CodeApprovedAt_23caf30a DATETIMEOFFSET,
@CodeLocked_23caf30a BIT,
@ForceCodeGeneration_23caf30a BIT,
@RetentionPeriod_23caf30a INT,
@Status_23caf30a NVARCHAR(20),
@DriverClass_23caf30a NVARCHAR(255),
@ParentID_23caf30a UNIQUEIDENTIFIER,
@IconClass_23caf30a NVARCHAR(100),
@DefaultCompactPromptID_23caf30a UNIQUEIDENTIFIER,
@Config_23caf30a NVARCHAR(MAX),
@RuntimeActionConfiguration_23caf30a NVARCHAR(MAX),
@MaxExecutionTimeMS_23caf30a INT,
@CreatedByAgentID_23caf30a UNIQUEIDENTIFIER
SET
  @ID_23caf30a = '5044A100-0010-4000-8000-000000000010'
SET
  @CategoryID_23caf30a = '0DC7433E-F36B-1410-8DB6-00021F8B792E'
SET
  @Name_23caf30a = N'Sonar: Describe Model'
SET
  @Description_23caf30a = N'Reads an existing Sonar model (by ID or name) and returns its resolved config: anchor entity, data sources (alias + entity name), factors (with source alias, aggregation, normalization, weight), and band set. The authoring agent''s READ tool so it can answer questions about / suggest changes to a model it can otherwise only write to.'
SET
  @Type_23caf30a = N'Custom'
SET
  @CodeApprovalStatus_23caf30a = N'Pending'
SET
  @CodeLocked_23caf30a = 0
SET
  @ForceCodeGeneration_23caf30a = 0
SET
  @Status_23caf30a = N'Active'
SET
  @DriverClass_23caf30a = N'SonarDescribeModel'
SET
  @IconClass_23caf30a = N'fa-solid fa-magnifying-glass' IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = @ID_23caf30a)
EXEC [__mj].spCreateAction @ID = @ID_23caf30a,
  @CategoryID = @CategoryID_23caf30a,
  @Name = @Name_23caf30a,
  @Description = @Description_23caf30a,
  @Type = @Type_23caf30a,
  @UserPrompt = @UserPrompt_23caf30a,
  @UserPrompt_Clear = 1,
  @UserComments = @UserComments_23caf30a,
  @UserComments_Clear = 1,
  @Code = @Code_23caf30a,
  @Code_Clear = 1,
  @CodeComments = @CodeComments_23caf30a,
  @CodeComments_Clear = 1,
  @CodeApprovalStatus = @CodeApprovalStatus_23caf30a,
  @CodeApprovalComments = @CodeApprovalComments_23caf30a,
  @CodeApprovalComments_Clear = 1,
  @CodeApprovedByUserID = @CodeApprovedByUserID_23caf30a,
  @CodeApprovedByUserID_Clear = 1,
  @CodeApprovedAt = @CodeApprovedAt_23caf30a,
  @CodeApprovedAt_Clear = 1,
  @CodeLocked = @CodeLocked_23caf30a,
  @ForceCodeGeneration = @ForceCodeGeneration_23caf30a,
  @RetentionPeriod = @RetentionPeriod_23caf30a,
  @RetentionPeriod_Clear = 1,
  @Status = @Status_23caf30a,
  @DriverClass = @DriverClass_23caf30a,
  @ParentID = @ParentID_23caf30a,
  @ParentID_Clear = 1,
  @IconClass = @IconClass_23caf30a,
  @DefaultCompactPromptID = @DefaultCompactPromptID_23caf30a,
  @DefaultCompactPromptID_Clear = 1,
  @Config = @Config_23caf30a,
  @Config_Clear = 1,
  @RuntimeActionConfiguration = @RuntimeActionConfiguration_23caf30a,
  @RuntimeActionConfiguration_Clear = 1,
  @MaxExecutionTimeMS = @MaxExecutionTimeMS_23caf30a,
  @MaxExecutionTimeMS_Clear = 1,
  @CreatedByAgentID = @CreatedByAgentID_23caf30a,
  @CreatedByAgentID_Clear = 1;

GO

-- Save MJ: Actions (core SP call only)
DECLARE @ID_8cf702cb UNIQUEIDENTIFIER,
@CategoryID_8cf702cb UNIQUEIDENTIFIER,
@Name_8cf702cb NVARCHAR(425),
@Description_8cf702cb NVARCHAR(MAX),
@Type_8cf702cb NVARCHAR(20),
@UserPrompt_8cf702cb NVARCHAR(MAX),
@UserComments_8cf702cb NVARCHAR(MAX),
@Code_8cf702cb NVARCHAR(MAX),
@CodeComments_8cf702cb NVARCHAR(MAX),
@CodeApprovalStatus_8cf702cb NVARCHAR(20),
@CodeApprovalComments_8cf702cb NVARCHAR(MAX),
@CodeApprovedByUserID_8cf702cb UNIQUEIDENTIFIER,
@CodeApprovedAt_8cf702cb DATETIMEOFFSET,
@CodeLocked_8cf702cb BIT,
@ForceCodeGeneration_8cf702cb BIT,
@RetentionPeriod_8cf702cb INT,
@Status_8cf702cb NVARCHAR(20),
@DriverClass_8cf702cb NVARCHAR(255),
@ParentID_8cf702cb UNIQUEIDENTIFIER,
@IconClass_8cf702cb NVARCHAR(100),
@DefaultCompactPromptID_8cf702cb UNIQUEIDENTIFIER,
@Config_8cf702cb NVARCHAR(MAX),
@RuntimeActionConfiguration_8cf702cb NVARCHAR(MAX),
@MaxExecutionTimeMS_8cf702cb INT,
@CreatedByAgentID_8cf702cb UNIQUEIDENTIFIER
SET
  @ID_8cf702cb = '5044A100-0011-4000-8000-000000000011'
SET
  @CategoryID_8cf702cb = '0DC7433E-F36B-1410-8DB6-00021F8B792E'
SET
  @Name_8cf702cb = N'Sonar: List Related Entities'
SET
  @Description_8cf702cb = N'Given an anchor entity ID, returns the BUSINESS entities that reference it via a foreign key (the one-to-many data sources Sonar factors aggregate over, e.g. Members <- Event Registrations). Scoped to business schemas (excludes MJ core and the Sonar schema). The authoring agent''s READ tool for grounding factor/source suggestions in data that actually exists.'
SET
  @Type_8cf702cb = N'Custom'
SET
  @CodeApprovalStatus_8cf702cb = N'Pending'
SET
  @CodeLocked_8cf702cb = 0
SET
  @ForceCodeGeneration_8cf702cb = 0
SET
  @Status_8cf702cb = N'Active'
SET
  @DriverClass_8cf702cb = N'SonarListRelatedEntities'
SET
  @IconClass_8cf702cb = N'fa-solid fa-diagram-project' IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = @ID_8cf702cb)
EXEC [__mj].spCreateAction @ID = @ID_8cf702cb,
  @CategoryID = @CategoryID_8cf702cb,
  @Name = @Name_8cf702cb,
  @Description = @Description_8cf702cb,
  @Type = @Type_8cf702cb,
  @UserPrompt = @UserPrompt_8cf702cb,
  @UserPrompt_Clear = 1,
  @UserComments = @UserComments_8cf702cb,
  @UserComments_Clear = 1,
  @Code = @Code_8cf702cb,
  @Code_Clear = 1,
  @CodeComments = @CodeComments_8cf702cb,
  @CodeComments_Clear = 1,
  @CodeApprovalStatus = @CodeApprovalStatus_8cf702cb,
  @CodeApprovalComments = @CodeApprovalComments_8cf702cb,
  @CodeApprovalComments_Clear = 1,
  @CodeApprovedByUserID = @CodeApprovedByUserID_8cf702cb,
  @CodeApprovedByUserID_Clear = 1,
  @CodeApprovedAt = @CodeApprovedAt_8cf702cb,
  @CodeApprovedAt_Clear = 1,
  @CodeLocked = @CodeLocked_8cf702cb,
  @ForceCodeGeneration = @ForceCodeGeneration_8cf702cb,
  @RetentionPeriod = @RetentionPeriod_8cf702cb,
  @RetentionPeriod_Clear = 1,
  @Status = @Status_8cf702cb,
  @DriverClass = @DriverClass_8cf702cb,
  @ParentID = @ParentID_8cf702cb,
  @ParentID_Clear = 1,
  @IconClass = @IconClass_8cf702cb,
  @DefaultCompactPromptID = @DefaultCompactPromptID_8cf702cb,
  @DefaultCompactPromptID_Clear = 1,
  @Config = @Config_8cf702cb,
  @Config_Clear = 1,
  @RuntimeActionConfiguration = @RuntimeActionConfiguration_8cf702cb,
  @RuntimeActionConfiguration_Clear = 1,
  @MaxExecutionTimeMS = @MaxExecutionTimeMS_8cf702cb,
  @MaxExecutionTimeMS_Clear = 1,
  @CreatedByAgentID = @CreatedByAgentID_8cf702cb,
  @CreatedByAgentID_Clear = 1;

GO

-- Save MJ: Actions (core SP call only)
DECLARE @ID_0cc8a1f9 UNIQUEIDENTIFIER,
@CategoryID_0cc8a1f9 UNIQUEIDENTIFIER,
@Name_0cc8a1f9 NVARCHAR(425),
@Description_0cc8a1f9 NVARCHAR(MAX),
@Type_0cc8a1f9 NVARCHAR(20),
@UserPrompt_0cc8a1f9 NVARCHAR(MAX),
@UserComments_0cc8a1f9 NVARCHAR(MAX),
@Code_0cc8a1f9 NVARCHAR(MAX),
@CodeComments_0cc8a1f9 NVARCHAR(MAX),
@CodeApprovalStatus_0cc8a1f9 NVARCHAR(20),
@CodeApprovalComments_0cc8a1f9 NVARCHAR(MAX),
@CodeApprovedByUserID_0cc8a1f9 UNIQUEIDENTIFIER,
@CodeApprovedAt_0cc8a1f9 DATETIMEOFFSET,
@CodeLocked_0cc8a1f9 BIT,
@ForceCodeGeneration_0cc8a1f9 BIT,
@RetentionPeriod_0cc8a1f9 INT,
@Status_0cc8a1f9 NVARCHAR(20),
@DriverClass_0cc8a1f9 NVARCHAR(255),
@ParentID_0cc8a1f9 UNIQUEIDENTIFIER,
@IconClass_0cc8a1f9 NVARCHAR(100),
@DefaultCompactPromptID_0cc8a1f9 UNIQUEIDENTIFIER,
@Config_0cc8a1f9 NVARCHAR(MAX),
@RuntimeActionConfiguration_0cc8a1f9 NVARCHAR(MAX),
@MaxExecutionTimeMS_0cc8a1f9 INT,
@CreatedByAgentID_0cc8a1f9 UNIQUEIDENTIFIER
SET
  @ID_0cc8a1f9 = '5044A100-0012-4000-8000-000000000012'
SET
  @CategoryID_0cc8a1f9 = '0DC7433E-F36B-1410-8DB6-00021F8B792E'
SET
  @Name_0cc8a1f9 = N'Sonar: Author Factor Action'
SET
  @Description_0cc8a1f9 = N'The §5 escape hatch: when a signal can''t be a declarative factor (streaks, decay, sentiment, cross-source ratios), hands a Sonar factor-action brief + the description to the stock ActionSmith agent and returns the Runtime action it authored (CodeApprovalStatus=''Pending'', a human approves before it scores). ActionSmith is reused untouched.'
SET
  @Type_0cc8a1f9 = N'Custom'
SET
  @CodeApprovalStatus_0cc8a1f9 = N'Pending'
SET
  @CodeLocked_0cc8a1f9 = 0
SET
  @ForceCodeGeneration_0cc8a1f9 = 0
SET
  @Status_0cc8a1f9 = N'Active'
SET
  @DriverClass_0cc8a1f9 = N'SonarAuthorFactorAction'
SET
  @IconClass_0cc8a1f9 = N'fa-solid fa-hammer' IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = @ID_0cc8a1f9)
EXEC [__mj].spCreateAction @ID = @ID_0cc8a1f9,
  @CategoryID = @CategoryID_0cc8a1f9,
  @Name = @Name_0cc8a1f9,
  @Description = @Description_0cc8a1f9,
  @Type = @Type_0cc8a1f9,
  @UserPrompt = @UserPrompt_0cc8a1f9,
  @UserPrompt_Clear = 1,
  @UserComments = @UserComments_0cc8a1f9,
  @UserComments_Clear = 1,
  @Code = @Code_0cc8a1f9,
  @Code_Clear = 1,
  @CodeComments = @CodeComments_0cc8a1f9,
  @CodeComments_Clear = 1,
  @CodeApprovalStatus = @CodeApprovalStatus_0cc8a1f9,
  @CodeApprovalComments = @CodeApprovalComments_0cc8a1f9,
  @CodeApprovalComments_Clear = 1,
  @CodeApprovedByUserID = @CodeApprovedByUserID_0cc8a1f9,
  @CodeApprovedByUserID_Clear = 1,
  @CodeApprovedAt = @CodeApprovedAt_0cc8a1f9,
  @CodeApprovedAt_Clear = 1,
  @CodeLocked = @CodeLocked_0cc8a1f9,
  @ForceCodeGeneration = @ForceCodeGeneration_0cc8a1f9,
  @RetentionPeriod = @RetentionPeriod_0cc8a1f9,
  @RetentionPeriod_Clear = 1,
  @Status = @Status_0cc8a1f9,
  @DriverClass = @DriverClass_0cc8a1f9,
  @ParentID = @ParentID_0cc8a1f9,
  @ParentID_Clear = 1,
  @IconClass = @IconClass_0cc8a1f9,
  @DefaultCompactPromptID = @DefaultCompactPromptID_0cc8a1f9,
  @DefaultCompactPromptID_Clear = 1,
  @Config = @Config_0cc8a1f9,
  @Config_Clear = 1,
  @RuntimeActionConfiguration = @RuntimeActionConfiguration_0cc8a1f9,
  @RuntimeActionConfiguration_Clear = 1,
  @MaxExecutionTimeMS = @MaxExecutionTimeMS_0cc8a1f9,
  @MaxExecutionTimeMS_Clear = 1,
  @CreatedByAgentID = @CreatedByAgentID_0cc8a1f9,
  @CreatedByAgentID_Clear = 1;

GO

-- Save MJ: Actions (core SP call only)
DECLARE @ID_2fe7395c UNIQUEIDENTIFIER,
@CategoryID_2fe7395c UNIQUEIDENTIFIER,
@Name_2fe7395c NVARCHAR(425),
@Description_2fe7395c NVARCHAR(MAX),
@Type_2fe7395c NVARCHAR(20),
@UserPrompt_2fe7395c NVARCHAR(MAX),
@UserComments_2fe7395c NVARCHAR(MAX),
@Code_2fe7395c NVARCHAR(MAX),
@CodeComments_2fe7395c NVARCHAR(MAX),
@CodeApprovalStatus_2fe7395c NVARCHAR(20),
@CodeApprovalComments_2fe7395c NVARCHAR(MAX),
@CodeApprovedByUserID_2fe7395c UNIQUEIDENTIFIER,
@CodeApprovedAt_2fe7395c DATETIMEOFFSET,
@CodeLocked_2fe7395c BIT,
@ForceCodeGeneration_2fe7395c BIT,
@RetentionPeriod_2fe7395c INT,
@Status_2fe7395c NVARCHAR(20),
@DriverClass_2fe7395c NVARCHAR(255),
@ParentID_2fe7395c UNIQUEIDENTIFIER,
@IconClass_2fe7395c NVARCHAR(100),
@DefaultCompactPromptID_2fe7395c UNIQUEIDENTIFIER,
@Config_2fe7395c NVARCHAR(MAX),
@RuntimeActionConfiguration_2fe7395c NVARCHAR(MAX),
@MaxExecutionTimeMS_2fe7395c INT,
@CreatedByAgentID_2fe7395c UNIQUEIDENTIFIER
SET
  @ID_2fe7395c = '5044A100-0013-4000-8000-000000000013'
SET
  @CategoryID_2fe7395c = '0DC7433E-F36B-1410-8DB6-00021F8B792E'
SET
  @Name_2fe7395c = N'Sonar: Start Factor Job'
SET
  @Description_2fe7395c = N'Async kickoff behind the Signal Studio: fires ActionSmith on the Sonar factor brief WITHOUT awaiting it and returns the AgentRunID immediately (via onAgentRunCreated). The run continues server-side; the Studio observes it by polling AIAgentRun.Status. Enables batched, fire-and-forget factor authoring.'
SET
  @Type_2fe7395c = N'Custom'
SET
  @CodeApprovalStatus_2fe7395c = N'Pending'
SET
  @CodeLocked_2fe7395c = 0
SET
  @ForceCodeGeneration_2fe7395c = 0
SET
  @Status_2fe7395c = N'Active'
SET
  @DriverClass_2fe7395c = N'SonarStartFactorJob'
SET
  @IconClass_2fe7395c = N'fa-solid fa-bolt' IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = @ID_2fe7395c)
EXEC [__mj].spCreateAction @ID = @ID_2fe7395c,
  @CategoryID = @CategoryID_2fe7395c,
  @Name = @Name_2fe7395c,
  @Description = @Description_2fe7395c,
  @Type = @Type_2fe7395c,
  @UserPrompt = @UserPrompt_2fe7395c,
  @UserPrompt_Clear = 1,
  @UserComments = @UserComments_2fe7395c,
  @UserComments_Clear = 1,
  @Code = @Code_2fe7395c,
  @Code_Clear = 1,
  @CodeComments = @CodeComments_2fe7395c,
  @CodeComments_Clear = 1,
  @CodeApprovalStatus = @CodeApprovalStatus_2fe7395c,
  @CodeApprovalComments = @CodeApprovalComments_2fe7395c,
  @CodeApprovalComments_Clear = 1,
  @CodeApprovedByUserID = @CodeApprovedByUserID_2fe7395c,
  @CodeApprovedByUserID_Clear = 1,
  @CodeApprovedAt = @CodeApprovedAt_2fe7395c,
  @CodeApprovedAt_Clear = 1,
  @CodeLocked = @CodeLocked_2fe7395c,
  @ForceCodeGeneration = @ForceCodeGeneration_2fe7395c,
  @RetentionPeriod = @RetentionPeriod_2fe7395c,
  @RetentionPeriod_Clear = 1,
  @Status = @Status_2fe7395c,
  @DriverClass = @DriverClass_2fe7395c,
  @ParentID = @ParentID_2fe7395c,
  @ParentID_Clear = 1,
  @IconClass = @IconClass_2fe7395c,
  @DefaultCompactPromptID = @DefaultCompactPromptID_2fe7395c,
  @DefaultCompactPromptID_Clear = 1,
  @Config = @Config_2fe7395c,
  @Config_Clear = 1,
  @RuntimeActionConfiguration = @RuntimeActionConfiguration_2fe7395c,
  @RuntimeActionConfiguration_Clear = 1,
  @MaxExecutionTimeMS = @MaxExecutionTimeMS_2fe7395c,
  @MaxExecutionTimeMS_Clear = 1,
  @CreatedByAgentID = @CreatedByAgentID_2fe7395c,
  @CreatedByAgentID_Clear = 1;

GO

-- Save MJ: Actions (core SP call only)
DECLARE @ID_8b56c63b UNIQUEIDENTIFIER,
@CategoryID_8b56c63b UNIQUEIDENTIFIER,
@Name_8b56c63b NVARCHAR(425),
@Description_8b56c63b NVARCHAR(MAX),
@Type_8b56c63b NVARCHAR(20),
@UserPrompt_8b56c63b NVARCHAR(MAX),
@UserComments_8b56c63b NVARCHAR(MAX),
@Code_8b56c63b NVARCHAR(MAX),
@CodeComments_8b56c63b NVARCHAR(MAX),
@CodeApprovalStatus_8b56c63b NVARCHAR(20),
@CodeApprovalComments_8b56c63b NVARCHAR(MAX),
@CodeApprovedByUserID_8b56c63b UNIQUEIDENTIFIER,
@CodeApprovedAt_8b56c63b DATETIMEOFFSET,
@CodeLocked_8b56c63b BIT,
@ForceCodeGeneration_8b56c63b BIT,
@RetentionPeriod_8b56c63b INT,
@Status_8b56c63b NVARCHAR(20),
@DriverClass_8b56c63b NVARCHAR(255),
@ParentID_8b56c63b UNIQUEIDENTIFIER,
@IconClass_8b56c63b NVARCHAR(100),
@DefaultCompactPromptID_8b56c63b UNIQUEIDENTIFIER,
@Config_8b56c63b NVARCHAR(MAX),
@RuntimeActionConfiguration_8b56c63b NVARCHAR(MAX),
@MaxExecutionTimeMS_8b56c63b INT,
@CreatedByAgentID_8b56c63b UNIQUEIDENTIFIER
SET
  @ID_8b56c63b = '5044A100-0014-4000-8000-000000000014'
SET
  @CategoryID_8b56c63b = '0DC7433E-F36B-1410-8DB6-00021F8B792E'
SET
  @Name_8b56c63b = N'Sonar: Refine Factor Action'
SET
  @Description_8b56c63b = N'AI ''improve this signal'' loop behind the Signal Studio: fires ActionSmith with the current code + the reviewer''s feedback (async, like the commission flow), then transplants the improved+self-tested code back onto the ORIGINAL signal (→ Pending for re-review) and disables the agent''s scratch row. The approval gate is never bypassed.'
SET
  @Type_8b56c63b = N'Custom'
SET
  @CodeApprovalStatus_8b56c63b = N'Pending'
SET
  @CodeLocked_8b56c63b = 0
SET
  @ForceCodeGeneration_8b56c63b = 0
SET
  @Status_8b56c63b = N'Active'
SET
  @DriverClass_8b56c63b = N'SonarRefineFactorAction'
SET
  @IconClass_8b56c63b = N'fa-solid fa-wand-magic-sparkles' IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = @ID_8b56c63b)
EXEC [__mj].spCreateAction @ID = @ID_8b56c63b,
  @CategoryID = @CategoryID_8b56c63b,
  @Name = @Name_8b56c63b,
  @Description = @Description_8b56c63b,
  @Type = @Type_8b56c63b,
  @UserPrompt = @UserPrompt_8b56c63b,
  @UserPrompt_Clear = 1,
  @UserComments = @UserComments_8b56c63b,
  @UserComments_Clear = 1,
  @Code = @Code_8b56c63b,
  @Code_Clear = 1,
  @CodeComments = @CodeComments_8b56c63b,
  @CodeComments_Clear = 1,
  @CodeApprovalStatus = @CodeApprovalStatus_8b56c63b,
  @CodeApprovalComments = @CodeApprovalComments_8b56c63b,
  @CodeApprovalComments_Clear = 1,
  @CodeApprovedByUserID = @CodeApprovedByUserID_8b56c63b,
  @CodeApprovedByUserID_Clear = 1,
  @CodeApprovedAt = @CodeApprovedAt_8b56c63b,
  @CodeApprovedAt_Clear = 1,
  @CodeLocked = @CodeLocked_8b56c63b,
  @ForceCodeGeneration = @ForceCodeGeneration_8b56c63b,
  @RetentionPeriod = @RetentionPeriod_8b56c63b,
  @RetentionPeriod_Clear = 1,
  @Status = @Status_8b56c63b,
  @DriverClass = @DriverClass_8b56c63b,
  @ParentID = @ParentID_8b56c63b,
  @ParentID_Clear = 1,
  @IconClass = @IconClass_8b56c63b,
  @DefaultCompactPromptID = @DefaultCompactPromptID_8b56c63b,
  @DefaultCompactPromptID_Clear = 1,
  @Config = @Config_8b56c63b,
  @Config_Clear = 1,
  @RuntimeActionConfiguration = @RuntimeActionConfiguration_8b56c63b,
  @RuntimeActionConfiguration_Clear = 1,
  @MaxExecutionTimeMS = @MaxExecutionTimeMS_8b56c63b,
  @MaxExecutionTimeMS_Clear = 1,
  @CreatedByAgentID = @CreatedByAgentID_8b56c63b,
  @CreatedByAgentID_Clear = 1;

GO

-- Save MJ: Actions (core SP call only)
DECLARE @ID_aec79711 UNIQUEIDENTIFIER,
@CategoryID_aec79711 UNIQUEIDENTIFIER,
@Name_aec79711 NVARCHAR(425),
@Description_aec79711 NVARCHAR(MAX),
@Type_aec79711 NVARCHAR(20),
@UserPrompt_aec79711 NVARCHAR(MAX),
@UserComments_aec79711 NVARCHAR(MAX),
@Code_aec79711 NVARCHAR(MAX),
@CodeComments_aec79711 NVARCHAR(MAX),
@CodeApprovalStatus_aec79711 NVARCHAR(20),
@CodeApprovalComments_aec79711 NVARCHAR(MAX),
@CodeApprovedByUserID_aec79711 UNIQUEIDENTIFIER,
@CodeApprovedAt_aec79711 DATETIMEOFFSET,
@CodeLocked_aec79711 BIT,
@ForceCodeGeneration_aec79711 BIT,
@RetentionPeriod_aec79711 INT,
@Status_aec79711 NVARCHAR(20),
@DriverClass_aec79711 NVARCHAR(255),
@ParentID_aec79711 UNIQUEIDENTIFIER,
@IconClass_aec79711 NVARCHAR(100),
@DefaultCompactPromptID_aec79711 UNIQUEIDENTIFIER,
@Config_aec79711 NVARCHAR(MAX),
@RuntimeActionConfiguration_aec79711 NVARCHAR(MAX),
@MaxExecutionTimeMS_aec79711 INT,
@CreatedByAgentID_aec79711 UNIQUEIDENTIFIER
SET
  @ID_aec79711 = '5044A100-0015-4000-8000-000000000015'
SET
  @CategoryID_aec79711 = '0DC7433E-F36B-1410-8DB6-00021F8B792E'
SET
  @Name_aec79711 = N'Sonar: Unpublish Model'
SET
  @Description_aec79711 = N'Moves a published model (Active/Paused) back to Draft so it can be edited. SAFE direction only — never publishes or activates. Lets the Authoring Agent unlock a model the user asked to edit instead of dead-ending on the lock.'
SET
  @Type_aec79711 = N'Custom'
SET
  @CodeApprovalStatus_aec79711 = N'Pending'
SET
  @CodeLocked_aec79711 = 0
SET
  @ForceCodeGeneration_aec79711 = 0
SET
  @Status_aec79711 = N'Active'
SET
  @DriverClass_aec79711 = N'SonarUnpublishModel'
SET
  @IconClass_aec79711 = N'fa-solid fa-lock-open' IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = @ID_aec79711)
EXEC [__mj].spCreateAction @ID = @ID_aec79711,
  @CategoryID = @CategoryID_aec79711,
  @Name = @Name_aec79711,
  @Description = @Description_aec79711,
  @Type = @Type_aec79711,
  @UserPrompt = @UserPrompt_aec79711,
  @UserPrompt_Clear = 1,
  @UserComments = @UserComments_aec79711,
  @UserComments_Clear = 1,
  @Code = @Code_aec79711,
  @Code_Clear = 1,
  @CodeComments = @CodeComments_aec79711,
  @CodeComments_Clear = 1,
  @CodeApprovalStatus = @CodeApprovalStatus_aec79711,
  @CodeApprovalComments = @CodeApprovalComments_aec79711,
  @CodeApprovalComments_Clear = 1,
  @CodeApprovedByUserID = @CodeApprovedByUserID_aec79711,
  @CodeApprovedByUserID_Clear = 1,
  @CodeApprovedAt = @CodeApprovedAt_aec79711,
  @CodeApprovedAt_Clear = 1,
  @CodeLocked = @CodeLocked_aec79711,
  @ForceCodeGeneration = @ForceCodeGeneration_aec79711,
  @RetentionPeriod = @RetentionPeriod_aec79711,
  @RetentionPeriod_Clear = 1,
  @Status = @Status_aec79711,
  @DriverClass = @DriverClass_aec79711,
  @ParentID = @ParentID_aec79711,
  @ParentID_Clear = 1,
  @IconClass = @IconClass_aec79711,
  @DefaultCompactPromptID = @DefaultCompactPromptID_aec79711,
  @DefaultCompactPromptID_Clear = 1,
  @Config = @Config_aec79711,
  @Config_Clear = 1,
  @RuntimeActionConfiguration = @RuntimeActionConfiguration_aec79711,
  @RuntimeActionConfiguration_Clear = 1,
  @MaxExecutionTimeMS = @MaxExecutionTimeMS_aec79711,
  @MaxExecutionTimeMS_Clear = 1,
  @CreatedByAgentID = @CreatedByAgentID_aec79711,
  @CreatedByAgentID_Clear = 1;

GO

-- Save MJ: Actions (core SP call only)
DECLARE @ID_df7fd51a UNIQUEIDENTIFIER,
@CategoryID_df7fd51a UNIQUEIDENTIFIER,
@Name_df7fd51a NVARCHAR(425),
@Description_df7fd51a NVARCHAR(MAX),
@Type_df7fd51a NVARCHAR(20),
@UserPrompt_df7fd51a NVARCHAR(MAX),
@UserComments_df7fd51a NVARCHAR(MAX),
@Code_df7fd51a NVARCHAR(MAX),
@CodeComments_df7fd51a NVARCHAR(MAX),
@CodeApprovalStatus_df7fd51a NVARCHAR(20),
@CodeApprovalComments_df7fd51a NVARCHAR(MAX),
@CodeApprovedByUserID_df7fd51a UNIQUEIDENTIFIER,
@CodeApprovedAt_df7fd51a DATETIMEOFFSET,
@CodeLocked_df7fd51a BIT,
@ForceCodeGeneration_df7fd51a BIT,
@RetentionPeriod_df7fd51a INT,
@Status_df7fd51a NVARCHAR(20),
@DriverClass_df7fd51a NVARCHAR(255),
@ParentID_df7fd51a UNIQUEIDENTIFIER,
@IconClass_df7fd51a NVARCHAR(100),
@DefaultCompactPromptID_df7fd51a UNIQUEIDENTIFIER,
@Config_df7fd51a NVARCHAR(MAX),
@RuntimeActionConfiguration_df7fd51a NVARCHAR(MAX),
@MaxExecutionTimeMS_df7fd51a INT,
@CreatedByAgentID_df7fd51a UNIQUEIDENTIFIER
SET
  @ID_df7fd51a = '5044A100-0016-4000-8000-000000000016'
SET
  @CategoryID_df7fd51a = '0DC7433E-F36B-1410-8DB6-00021F8B792E'
SET
  @Name_df7fd51a = N'Sonar: Find Entities'
SET
  @Description_df7fd51a = N'Resolves a business entity NAME to its ID (and lists candidate anchors), scoped to business schemas (MJ/Sonar system schemas hidden). Lets the Authoring Agent get an anchorEntityID for a new model instead of dead-ending on a raw UUID. Read-only.'
SET
  @Type_df7fd51a = N'Custom'
SET
  @CodeApprovalStatus_df7fd51a = N'Pending'
SET
  @CodeLocked_df7fd51a = 0
SET
  @ForceCodeGeneration_df7fd51a = 0
SET
  @Status_df7fd51a = N'Active'
SET
  @DriverClass_df7fd51a = N'SonarFindEntities'
SET
  @IconClass_df7fd51a = N'fa-solid fa-magnifying-glass' IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = @ID_df7fd51a)
EXEC [__mj].spCreateAction @ID = @ID_df7fd51a,
  @CategoryID = @CategoryID_df7fd51a,
  @Name = @Name_df7fd51a,
  @Description = @Description_df7fd51a,
  @Type = @Type_df7fd51a,
  @UserPrompt = @UserPrompt_df7fd51a,
  @UserPrompt_Clear = 1,
  @UserComments = @UserComments_df7fd51a,
  @UserComments_Clear = 1,
  @Code = @Code_df7fd51a,
  @Code_Clear = 1,
  @CodeComments = @CodeComments_df7fd51a,
  @CodeComments_Clear = 1,
  @CodeApprovalStatus = @CodeApprovalStatus_df7fd51a,
  @CodeApprovalComments = @CodeApprovalComments_df7fd51a,
  @CodeApprovalComments_Clear = 1,
  @CodeApprovedByUserID = @CodeApprovedByUserID_df7fd51a,
  @CodeApprovedByUserID_Clear = 1,
  @CodeApprovedAt = @CodeApprovedAt_df7fd51a,
  @CodeApprovedAt_Clear = 1,
  @CodeLocked = @CodeLocked_df7fd51a,
  @ForceCodeGeneration = @ForceCodeGeneration_df7fd51a,
  @RetentionPeriod = @RetentionPeriod_df7fd51a,
  @RetentionPeriod_Clear = 1,
  @Status = @Status_df7fd51a,
  @DriverClass = @DriverClass_df7fd51a,
  @ParentID = @ParentID_df7fd51a,
  @ParentID_Clear = 1,
  @IconClass = @IconClass_df7fd51a,
  @DefaultCompactPromptID = @DefaultCompactPromptID_df7fd51a,
  @DefaultCompactPromptID_Clear = 1,
  @Config = @Config_df7fd51a,
  @Config_Clear = 1,
  @RuntimeActionConfiguration = @RuntimeActionConfiguration_df7fd51a,
  @RuntimeActionConfiguration_Clear = 1,
  @MaxExecutionTimeMS = @MaxExecutionTimeMS_df7fd51a,
  @MaxExecutionTimeMS_Clear = 1,
  @CreatedByAgentID = @CreatedByAgentID_df7fd51a,
  @CreatedByAgentID_Clear = 1;

GO

-- Save MJ: Actions (core SP call only)
DECLARE @ID_f916bff7 UNIQUEIDENTIFIER,
@CategoryID_f916bff7 UNIQUEIDENTIFIER,
@Name_f916bff7 NVARCHAR(425),
@Description_f916bff7 NVARCHAR(MAX),
@Type_f916bff7 NVARCHAR(20),
@UserPrompt_f916bff7 NVARCHAR(MAX),
@UserComments_f916bff7 NVARCHAR(MAX),
@Code_f916bff7 NVARCHAR(MAX),
@CodeComments_f916bff7 NVARCHAR(MAX),
@CodeApprovalStatus_f916bff7 NVARCHAR(20),
@CodeApprovalComments_f916bff7 NVARCHAR(MAX),
@CodeApprovedByUserID_f916bff7 UNIQUEIDENTIFIER,
@CodeApprovedAt_f916bff7 DATETIMEOFFSET,
@CodeLocked_f916bff7 BIT,
@ForceCodeGeneration_f916bff7 BIT,
@RetentionPeriod_f916bff7 INT,
@Status_f916bff7 NVARCHAR(20),
@DriverClass_f916bff7 NVARCHAR(255),
@ParentID_f916bff7 UNIQUEIDENTIFIER,
@IconClass_f916bff7 NVARCHAR(100),
@DefaultCompactPromptID_f916bff7 UNIQUEIDENTIFIER,
@Config_f916bff7 NVARCHAR(MAX),
@RuntimeActionConfiguration_f916bff7 NVARCHAR(MAX),
@MaxExecutionTimeMS_f916bff7 INT,
@CreatedByAgentID_f916bff7 UNIQUEIDENTIFIER
SET
  @ID_f916bff7 = '5044A100-0017-4000-8000-000000000017'
SET
  @CategoryID_f916bff7 = '0DC7433E-F36B-1410-8DB6-00021F8B792E'
SET
  @Name_f916bff7 = N'Sonar: Find Models'
SET
  @Description_f916bff7 = N'Resolves a score model by PARTIAL name (and lists existing models) → id/name/status/anchor. Lets the Authoring Agent fuzzy-match a vague model reference and enumerate models, instead of needing a near-exact name for Describe Model. Read-only.'
SET
  @Type_f916bff7 = N'Custom'
SET
  @CodeApprovalStatus_f916bff7 = N'Pending'
SET
  @CodeLocked_f916bff7 = 0
SET
  @ForceCodeGeneration_f916bff7 = 0
SET
  @Status_f916bff7 = N'Active'
SET
  @DriverClass_f916bff7 = N'SonarFindModels'
SET
  @IconClass_f916bff7 = N'fa-solid fa-layer-group' IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = @ID_f916bff7)
EXEC [__mj].spCreateAction @ID = @ID_f916bff7,
  @CategoryID = @CategoryID_f916bff7,
  @Name = @Name_f916bff7,
  @Description = @Description_f916bff7,
  @Type = @Type_f916bff7,
  @UserPrompt = @UserPrompt_f916bff7,
  @UserPrompt_Clear = 1,
  @UserComments = @UserComments_f916bff7,
  @UserComments_Clear = 1,
  @Code = @Code_f916bff7,
  @Code_Clear = 1,
  @CodeComments = @CodeComments_f916bff7,
  @CodeComments_Clear = 1,
  @CodeApprovalStatus = @CodeApprovalStatus_f916bff7,
  @CodeApprovalComments = @CodeApprovalComments_f916bff7,
  @CodeApprovalComments_Clear = 1,
  @CodeApprovedByUserID = @CodeApprovedByUserID_f916bff7,
  @CodeApprovedByUserID_Clear = 1,
  @CodeApprovedAt = @CodeApprovedAt_f916bff7,
  @CodeApprovedAt_Clear = 1,
  @CodeLocked = @CodeLocked_f916bff7,
  @ForceCodeGeneration = @ForceCodeGeneration_f916bff7,
  @RetentionPeriod = @RetentionPeriod_f916bff7,
  @RetentionPeriod_Clear = 1,
  @Status = @Status_f916bff7,
  @DriverClass = @DriverClass_f916bff7,
  @ParentID = @ParentID_f916bff7,
  @ParentID_Clear = 1,
  @IconClass = @IconClass_f916bff7,
  @DefaultCompactPromptID = @DefaultCompactPromptID_f916bff7,
  @DefaultCompactPromptID_Clear = 1,
  @Config = @Config_f916bff7,
  @Config_Clear = 1,
  @RuntimeActionConfiguration = @RuntimeActionConfiguration_f916bff7,
  @RuntimeActionConfiguration_Clear = 1,
  @MaxExecutionTimeMS = @MaxExecutionTimeMS_f916bff7,
  @MaxExecutionTimeMS_Clear = 1,
  @CreatedByAgentID = @CreatedByAgentID_f916bff7,
  @CreatedByAgentID_Clear = 1;

GO

-- Save MJ: Actions (core SP call only)
DECLARE @ID_0c1a3051 UNIQUEIDENTIFIER,
@CategoryID_0c1a3051 UNIQUEIDENTIFIER,
@Name_0c1a3051 NVARCHAR(425),
@Description_0c1a3051 NVARCHAR(MAX),
@Type_0c1a3051 NVARCHAR(20),
@UserPrompt_0c1a3051 NVARCHAR(MAX),
@UserComments_0c1a3051 NVARCHAR(MAX),
@Code_0c1a3051 NVARCHAR(MAX),
@CodeComments_0c1a3051 NVARCHAR(MAX),
@CodeApprovalStatus_0c1a3051 NVARCHAR(20),
@CodeApprovalComments_0c1a3051 NVARCHAR(MAX),
@CodeApprovedByUserID_0c1a3051 UNIQUEIDENTIFIER,
@CodeApprovedAt_0c1a3051 DATETIMEOFFSET,
@CodeLocked_0c1a3051 BIT,
@ForceCodeGeneration_0c1a3051 BIT,
@RetentionPeriod_0c1a3051 INT,
@Status_0c1a3051 NVARCHAR(20),
@DriverClass_0c1a3051 NVARCHAR(255),
@ParentID_0c1a3051 UNIQUEIDENTIFIER,
@IconClass_0c1a3051 NVARCHAR(100),
@DefaultCompactPromptID_0c1a3051 UNIQUEIDENTIFIER,
@Config_0c1a3051 NVARCHAR(MAX),
@RuntimeActionConfiguration_0c1a3051 NVARCHAR(MAX),
@MaxExecutionTimeMS_0c1a3051 INT,
@CreatedByAgentID_0c1a3051 UNIQUEIDENTIFIER
SET
  @ID_0c1a3051 = '5044A100-0018-4000-8000-000000000018'
SET
  @CategoryID_0c1a3051 = '0DC7433E-F36B-1410-8DB6-00021F8B792E'
SET
  @Name_0c1a3051 = N'Sonar: Test Signal'
SET
  @Description_0c1a3051 = N'Runs a signal''s code over a sample of anchor records and returns per-record { value, explanation, error } in a Both Result. Runs through Test Runtime Action''s ephemeral path so a Pending signal can be tested before approval; reads its results in-process so they round-trip to the browser (unlike Test Runtime Action''s Output-only result). Powers the Signal Studio''s Run Test.'
SET
  @Type_0c1a3051 = N'Custom'
SET
  @CodeApprovalStatus_0c1a3051 = N'Pending'
SET
  @CodeLocked_0c1a3051 = 0
SET
  @ForceCodeGeneration_0c1a3051 = 0
SET
  @Status_0c1a3051 = N'Active'
SET
  @DriverClass_0c1a3051 = N'SonarTestSignal'
SET
  @IconClass_0c1a3051 = N'fa-solid fa-flask' IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = @ID_0c1a3051)
EXEC [__mj].spCreateAction @ID = @ID_0c1a3051,
  @CategoryID = @CategoryID_0c1a3051,
  @Name = @Name_0c1a3051,
  @Description = @Description_0c1a3051,
  @Type = @Type_0c1a3051,
  @UserPrompt = @UserPrompt_0c1a3051,
  @UserPrompt_Clear = 1,
  @UserComments = @UserComments_0c1a3051,
  @UserComments_Clear = 1,
  @Code = @Code_0c1a3051,
  @Code_Clear = 1,
  @CodeComments = @CodeComments_0c1a3051,
  @CodeComments_Clear = 1,
  @CodeApprovalStatus = @CodeApprovalStatus_0c1a3051,
  @CodeApprovalComments = @CodeApprovalComments_0c1a3051,
  @CodeApprovalComments_Clear = 1,
  @CodeApprovedByUserID = @CodeApprovedByUserID_0c1a3051,
  @CodeApprovedByUserID_Clear = 1,
  @CodeApprovedAt = @CodeApprovedAt_0c1a3051,
  @CodeApprovedAt_Clear = 1,
  @CodeLocked = @CodeLocked_0c1a3051,
  @ForceCodeGeneration = @ForceCodeGeneration_0c1a3051,
  @RetentionPeriod = @RetentionPeriod_0c1a3051,
  @RetentionPeriod_Clear = 1,
  @Status = @Status_0c1a3051,
  @DriverClass = @DriverClass_0c1a3051,
  @ParentID = @ParentID_0c1a3051,
  @ParentID_Clear = 1,
  @IconClass = @IconClass_0c1a3051,
  @DefaultCompactPromptID = @DefaultCompactPromptID_0c1a3051,
  @DefaultCompactPromptID_Clear = 1,
  @Config = @Config_0c1a3051,
  @Config_Clear = 1,
  @RuntimeActionConfiguration = @RuntimeActionConfiguration_0c1a3051,
  @RuntimeActionConfiguration_Clear = 1,
  @MaxExecutionTimeMS = @MaxExecutionTimeMS_0c1a3051,
  @MaxExecutionTimeMS_Clear = 1,
  @CreatedByAgentID = @CreatedByAgentID_0c1a3051,
  @CreatedByAgentID_Clear = 1;

GO

-- Save MJ: Actions (core SP call only)
DECLARE @ID_ef434b5e UNIQUEIDENTIFIER,
@CategoryID_ef434b5e UNIQUEIDENTIFIER,
@Name_ef434b5e NVARCHAR(425),
@Description_ef434b5e NVARCHAR(MAX),
@Type_ef434b5e NVARCHAR(20),
@UserPrompt_ef434b5e NVARCHAR(MAX),
@UserComments_ef434b5e NVARCHAR(MAX),
@Code_ef434b5e NVARCHAR(MAX),
@CodeComments_ef434b5e NVARCHAR(MAX),
@CodeApprovalStatus_ef434b5e NVARCHAR(20),
@CodeApprovalComments_ef434b5e NVARCHAR(MAX),
@CodeApprovedByUserID_ef434b5e UNIQUEIDENTIFIER,
@CodeApprovedAt_ef434b5e DATETIMEOFFSET,
@CodeLocked_ef434b5e BIT,
@ForceCodeGeneration_ef434b5e BIT,
@RetentionPeriod_ef434b5e INT,
@Status_ef434b5e NVARCHAR(20),
@DriverClass_ef434b5e NVARCHAR(255),
@ParentID_ef434b5e UNIQUEIDENTIFIER,
@IconClass_ef434b5e NVARCHAR(100),
@DefaultCompactPromptID_ef434b5e UNIQUEIDENTIFIER,
@Config_ef434b5e NVARCHAR(MAX),
@RuntimeActionConfiguration_ef434b5e NVARCHAR(MAX),
@MaxExecutionTimeMS_ef434b5e INT,
@CreatedByAgentID_ef434b5e UNIQUEIDENTIFIER
SET
  @ID_ef434b5e = '5044A100-0019-4000-8000-000000000019'
SET
  @CategoryID_ef434b5e = '0DC7433E-F36B-1410-8DB6-00021F8B792E'
SET
  @Name_ef434b5e = N'Sonar: Cancel Factor Job'
SET
  @Description_ef434b5e = N'Stops an in-flight ActionSmith run (a commission or refine) from the Signal Studio. Aborts the run''s cancellation token when this process owns it (a true cancel — the agent loop stops and a refine never transplants), else flips the AIAgentRun row to Cancelled so it leaves the in-flight feed. Powers the Studio''s per-job Cancel button.'
SET
  @Type_ef434b5e = N'Custom'
SET
  @CodeApprovalStatus_ef434b5e = N'Pending'
SET
  @CodeLocked_ef434b5e = 0
SET
  @ForceCodeGeneration_ef434b5e = 0
SET
  @Status_ef434b5e = N'Active'
SET
  @DriverClass_ef434b5e = N'SonarCancelFactorJob'
SET
  @IconClass_ef434b5e = N'fa-solid fa-stop' IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = @ID_ef434b5e)
EXEC [__mj].spCreateAction @ID = @ID_ef434b5e,
  @CategoryID = @CategoryID_ef434b5e,
  @Name = @Name_ef434b5e,
  @Description = @Description_ef434b5e,
  @Type = @Type_ef434b5e,
  @UserPrompt = @UserPrompt_ef434b5e,
  @UserPrompt_Clear = 1,
  @UserComments = @UserComments_ef434b5e,
  @UserComments_Clear = 1,
  @Code = @Code_ef434b5e,
  @Code_Clear = 1,
  @CodeComments = @CodeComments_ef434b5e,
  @CodeComments_Clear = 1,
  @CodeApprovalStatus = @CodeApprovalStatus_ef434b5e,
  @CodeApprovalComments = @CodeApprovalComments_ef434b5e,
  @CodeApprovalComments_Clear = 1,
  @CodeApprovedByUserID = @CodeApprovedByUserID_ef434b5e,
  @CodeApprovedByUserID_Clear = 1,
  @CodeApprovedAt = @CodeApprovedAt_ef434b5e,
  @CodeApprovedAt_Clear = 1,
  @CodeLocked = @CodeLocked_ef434b5e,
  @ForceCodeGeneration = @ForceCodeGeneration_ef434b5e,
  @RetentionPeriod = @RetentionPeriod_ef434b5e,
  @RetentionPeriod_Clear = 1,
  @Status = @Status_ef434b5e,
  @DriverClass = @DriverClass_ef434b5e,
  @ParentID = @ParentID_ef434b5e,
  @ParentID_Clear = 1,
  @IconClass = @IconClass_ef434b5e,
  @DefaultCompactPromptID = @DefaultCompactPromptID_ef434b5e,
  @DefaultCompactPromptID_Clear = 1,
  @Config = @Config_ef434b5e,
  @Config_Clear = 1,
  @RuntimeActionConfiguration = @RuntimeActionConfiguration_ef434b5e,
  @RuntimeActionConfiguration_Clear = 1,
  @MaxExecutionTimeMS = @MaxExecutionTimeMS_ef434b5e,
  @MaxExecutionTimeMS_Clear = 1,
  @CreatedByAgentID = @CreatedByAgentID_ef434b5e,
  @CreatedByAgentID_Clear = 1;

GO

-- Save MJ: Actions (core SP call only)
DECLARE @ID_0da79fbb UNIQUEIDENTIFIER,
@CategoryID_0da79fbb UNIQUEIDENTIFIER,
@Name_0da79fbb NVARCHAR(425),
@Description_0da79fbb NVARCHAR(MAX),
@Type_0da79fbb NVARCHAR(20),
@UserPrompt_0da79fbb NVARCHAR(MAX),
@UserComments_0da79fbb NVARCHAR(MAX),
@Code_0da79fbb NVARCHAR(MAX),
@CodeComments_0da79fbb NVARCHAR(MAX),
@CodeApprovalStatus_0da79fbb NVARCHAR(20),
@CodeApprovalComments_0da79fbb NVARCHAR(MAX),
@CodeApprovedByUserID_0da79fbb UNIQUEIDENTIFIER,
@CodeApprovedAt_0da79fbb DATETIMEOFFSET,
@CodeLocked_0da79fbb BIT,
@ForceCodeGeneration_0da79fbb BIT,
@RetentionPeriod_0da79fbb INT,
@Status_0da79fbb NVARCHAR(20),
@DriverClass_0da79fbb NVARCHAR(255),
@ParentID_0da79fbb UNIQUEIDENTIFIER,
@IconClass_0da79fbb NVARCHAR(100),
@DefaultCompactPromptID_0da79fbb UNIQUEIDENTIFIER,
@Config_0da79fbb NVARCHAR(MAX),
@RuntimeActionConfiguration_0da79fbb NVARCHAR(MAX),
@MaxExecutionTimeMS_0da79fbb INT,
@CreatedByAgentID_0da79fbb UNIQUEIDENTIFIER
SET
  @ID_0da79fbb = '5044A100-001A-4000-8000-00000000001A'
SET
  @CategoryID_0da79fbb = '0DC7433E-F36B-1410-8DB6-00021F8B792E'
SET
  @Name_0da79fbb = N'Sonar: Bind Signal To Model'
SET
  @Description_0da79fbb = N'Binds an approved custom signal (a Runtime factor-action) into a Draft model''s rubric — creates an ActionBacked Factor pointing at the signal + a Model Factor with a weight. Guards: the model must be Draft and the signal''s code must be Approved. Powers the Signal Studio''s ''Add to a model''.'
SET
  @Type_0da79fbb = N'Custom'
SET
  @CodeApprovalStatus_0da79fbb = N'Pending'
SET
  @CodeLocked_0da79fbb = 0
SET
  @ForceCodeGeneration_0da79fbb = 0
SET
  @Status_0da79fbb = N'Active'
SET
  @DriverClass_0da79fbb = N'SonarBindSignalToModel'
SET
  @IconClass_0da79fbb = N'fa-solid fa-link' IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = @ID_0da79fbb)
EXEC [__mj].spCreateAction @ID = @ID_0da79fbb,
  @CategoryID = @CategoryID_0da79fbb,
  @Name = @Name_0da79fbb,
  @Description = @Description_0da79fbb,
  @Type = @Type_0da79fbb,
  @UserPrompt = @UserPrompt_0da79fbb,
  @UserPrompt_Clear = 1,
  @UserComments = @UserComments_0da79fbb,
  @UserComments_Clear = 1,
  @Code = @Code_0da79fbb,
  @Code_Clear = 1,
  @CodeComments = @CodeComments_0da79fbb,
  @CodeComments_Clear = 1,
  @CodeApprovalStatus = @CodeApprovalStatus_0da79fbb,
  @CodeApprovalComments = @CodeApprovalComments_0da79fbb,
  @CodeApprovalComments_Clear = 1,
  @CodeApprovedByUserID = @CodeApprovedByUserID_0da79fbb,
  @CodeApprovedByUserID_Clear = 1,
  @CodeApprovedAt = @CodeApprovedAt_0da79fbb,
  @CodeApprovedAt_Clear = 1,
  @CodeLocked = @CodeLocked_0da79fbb,
  @ForceCodeGeneration = @ForceCodeGeneration_0da79fbb,
  @RetentionPeriod = @RetentionPeriod_0da79fbb,
  @RetentionPeriod_Clear = 1,
  @Status = @Status_0da79fbb,
  @DriverClass = @DriverClass_0da79fbb,
  @ParentID = @ParentID_0da79fbb,
  @ParentID_Clear = 1,
  @IconClass = @IconClass_0da79fbb,
  @DefaultCompactPromptID = @DefaultCompactPromptID_0da79fbb,
  @DefaultCompactPromptID_Clear = 1,
  @Config = @Config_0da79fbb,
  @Config_Clear = 1,
  @RuntimeActionConfiguration = @RuntimeActionConfiguration_0da79fbb,
  @RuntimeActionConfiguration_Clear = 1,
  @MaxExecutionTimeMS = @MaxExecutionTimeMS_0da79fbb,
  @MaxExecutionTimeMS_Clear = 1,
  @CreatedByAgentID = @CreatedByAgentID_0da79fbb,
  @CreatedByAgentID_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_b3ac618f UNIQUEIDENTIFIER,
@ActionID_b3ac618f UNIQUEIDENTIFIER,
@Name_b3ac618f NVARCHAR(255),
@DefaultValue_b3ac618f NVARCHAR(MAX),
@Type_b3ac618f NCHAR(10),
@ValueType_b3ac618f NVARCHAR(30),
@IsArray_b3ac618f BIT,
@Description_b3ac618f NVARCHAR(MAX),
@IsRequired_b3ac618f BIT,
@MediaModality_b3ac618f NVARCHAR(20)
SET
  @ID_b3ac618f = '5044A100-0001-4000-8000-0000000000A1'
SET
  @ActionID_b3ac618f = '5044A100-0001-4000-8000-000000000001'
SET
  @Name_b3ac618f = N'ModelID'
SET
  @Type_b3ac618f = N'Input'
SET
  @ValueType_b3ac618f = N'Scalar'
SET
  @IsArray_b3ac618f = 0
SET
  @Description_b3ac618f = N'The ScoreModel ID to preview.'
SET
  @IsRequired_b3ac618f = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_b3ac618f)
EXEC [__mj].spCreateActionParam @ID = @ID_b3ac618f,
  @ActionID = @ActionID_b3ac618f,
  @Name = @Name_b3ac618f,
  @DefaultValue = @DefaultValue_b3ac618f,
  @DefaultValue_Clear = 1,
  @Type = @Type_b3ac618f,
  @ValueType = @ValueType_b3ac618f,
  @IsArray = @IsArray_b3ac618f,
  @Description = @Description_b3ac618f,
  @IsRequired = @IsRequired_b3ac618f,
  @MediaModality = @MediaModality_b3ac618f,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_7833ae8c UNIQUEIDENTIFIER,
@ActionID_7833ae8c UNIQUEIDENTIFIER,
@Name_7833ae8c NVARCHAR(255),
@DefaultValue_7833ae8c NVARCHAR(MAX),
@Type_7833ae8c NCHAR(10),
@ValueType_7833ae8c NVARCHAR(30),
@IsArray_7833ae8c BIT,
@Description_7833ae8c NVARCHAR(MAX),
@IsRequired_7833ae8c BIT,
@MediaModality_7833ae8c NVARCHAR(20)
SET
  @ID_7833ae8c = '5044A100-0001-4000-8000-0000000000A2'
SET
  @ActionID_7833ae8c = '5044A100-0001-4000-8000-000000000001'
SET
  @Name_7833ae8c = N'Result'
SET
  @Type_7833ae8c = N'Both'
SET
  @ValueType_7833ae8c = N'Scalar'
SET
  @IsArray_7833ae8c = 0
SET
  @Description_7833ae8c = N'JSON: { totalScored, bandDistribution[], sampleMember }.'
SET
  @IsRequired_7833ae8c = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_7833ae8c)
EXEC [__mj].spCreateActionParam @ID = @ID_7833ae8c,
  @ActionID = @ActionID_7833ae8c,
  @Name = @Name_7833ae8c,
  @DefaultValue = @DefaultValue_7833ae8c,
  @DefaultValue_Clear = 1,
  @Type = @Type_7833ae8c,
  @ValueType = @ValueType_7833ae8c,
  @IsArray = @IsArray_7833ae8c,
  @Description = @Description_7833ae8c,
  @IsRequired = @IsRequired_7833ae8c,
  @MediaModality = @MediaModality_7833ae8c,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_22c3f6a2 UNIQUEIDENTIFIER,
@ActionID_22c3f6a2 UNIQUEIDENTIFIER,
@ResultCode_22c3f6a2 NVARCHAR(255),
@IsSuccess_22c3f6a2 BIT,
@Description_22c3f6a2 NVARCHAR(MAX)
SET
  @ID_22c3f6a2 = '5044A100-0001-4000-8000-0000000000C1'
SET
  @ActionID_22c3f6a2 = '5044A100-0001-4000-8000-000000000001'
SET
  @ResultCode_22c3f6a2 = N'SUCCESS'
SET
  @IsSuccess_22c3f6a2 = 1
SET
  @Description_22c3f6a2 = N'Preview computed.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_22c3f6a2)
EXEC [__mj].spCreateActionResultCode @ID = @ID_22c3f6a2,
  @ActionID = @ActionID_22c3f6a2,
  @ResultCode = @ResultCode_22c3f6a2,
  @IsSuccess = @IsSuccess_22c3f6a2,
  @Description = @Description_22c3f6a2;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_78fa0653 UNIQUEIDENTIFIER,
@ActionID_78fa0653 UNIQUEIDENTIFIER,
@ResultCode_78fa0653 NVARCHAR(255),
@IsSuccess_78fa0653 BIT,
@Description_78fa0653 NVARCHAR(MAX)
SET
  @ID_78fa0653 = '5044A100-0001-4000-8000-0000000000C2'
SET
  @ActionID_78fa0653 = '5044A100-0001-4000-8000-000000000001'
SET
  @ResultCode_78fa0653 = N'VALIDATION_ERROR'
SET
  @IsSuccess_78fa0653 = 0
SET
  @Description_78fa0653 = N'A required input was missing or invalid.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_78fa0653)
EXEC [__mj].spCreateActionResultCode @ID = @ID_78fa0653,
  @ActionID = @ActionID_78fa0653,
  @ResultCode = @ResultCode_78fa0653,
  @IsSuccess = @IsSuccess_78fa0653,
  @Description = @Description_78fa0653;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_b2f13440 UNIQUEIDENTIFIER,
@ActionID_b2f13440 UNIQUEIDENTIFIER,
@ResultCode_b2f13440 NVARCHAR(255),
@IsSuccess_b2f13440 BIT,
@Description_b2f13440 NVARCHAR(MAX)
SET
  @ID_b2f13440 = '5044A100-0001-4000-8000-0000000000C3'
SET
  @ActionID_b2f13440 = '5044A100-0001-4000-8000-000000000001'
SET
  @ResultCode_b2f13440 = N'ERROR'
SET
  @IsSuccess_b2f13440 = 0
SET
  @Description_b2f13440 = N'The engine failed to compute scores.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_b2f13440)
EXEC [__mj].spCreateActionResultCode @ID = @ID_b2f13440,
  @ActionID = @ActionID_b2f13440,
  @ResultCode = @ResultCode_b2f13440,
  @IsSuccess = @IsSuccess_b2f13440,
  @Description = @Description_b2f13440;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_4529f73d UNIQUEIDENTIFIER,
@ActionID_4529f73d UNIQUEIDENTIFIER,
@Name_4529f73d NVARCHAR(255),
@DefaultValue_4529f73d NVARCHAR(MAX),
@Type_4529f73d NCHAR(10),
@ValueType_4529f73d NVARCHAR(30),
@IsArray_4529f73d BIT,
@Description_4529f73d NVARCHAR(MAX),
@IsRequired_4529f73d BIT,
@MediaModality_4529f73d NVARCHAR(20)
SET
  @ID_4529f73d = '5044A100-0002-4000-8000-0000000000A1'
SET
  @ActionID_4529f73d = '5044A100-0002-4000-8000-000000000002'
SET
  @Name_4529f73d = N'ModelID'
SET
  @Type_4529f73d = N'Input'
SET
  @ValueType_4529f73d = N'Scalar'
SET
  @IsArray_4529f73d = 0
SET
  @Description_4529f73d = N'The ScoreModel ID to recompute (must be published).'
SET
  @IsRequired_4529f73d = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_4529f73d)
EXEC [__mj].spCreateActionParam @ID = @ID_4529f73d,
  @ActionID = @ActionID_4529f73d,
  @Name = @Name_4529f73d,
  @DefaultValue = @DefaultValue_4529f73d,
  @DefaultValue_Clear = 1,
  @Type = @Type_4529f73d,
  @ValueType = @ValueType_4529f73d,
  @IsArray = @IsArray_4529f73d,
  @Description = @Description_4529f73d,
  @IsRequired = @IsRequired_4529f73d,
  @MediaModality = @MediaModality_4529f73d,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_d8cf6cef UNIQUEIDENTIFIER,
@ActionID_d8cf6cef UNIQUEIDENTIFIER,
@Name_d8cf6cef NVARCHAR(255),
@DefaultValue_d8cf6cef NVARCHAR(MAX),
@Type_d8cf6cef NCHAR(10),
@ValueType_d8cf6cef NVARCHAR(30),
@IsArray_d8cf6cef BIT,
@Description_d8cf6cef NVARCHAR(MAX),
@IsRequired_d8cf6cef BIT,
@MediaModality_d8cf6cef NVARCHAR(20)
SET
  @ID_d8cf6cef = '5044A100-0002-4000-8000-0000000000A2'
SET
  @ActionID_d8cf6cef = '5044A100-0002-4000-8000-000000000002'
SET
  @Name_d8cf6cef = N'Result'
SET
  @Type_d8cf6cef = N'Both'
SET
  @ValueType_d8cf6cef = N'Scalar'
SET
  @IsArray_d8cf6cef = 0
SET
  @Description_d8cf6cef = N'JSON: { runId, status, recordsScored }.'
SET
  @IsRequired_d8cf6cef = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_d8cf6cef)
EXEC [__mj].spCreateActionParam @ID = @ID_d8cf6cef,
  @ActionID = @ActionID_d8cf6cef,
  @Name = @Name_d8cf6cef,
  @DefaultValue = @DefaultValue_d8cf6cef,
  @DefaultValue_Clear = 1,
  @Type = @Type_d8cf6cef,
  @ValueType = @ValueType_d8cf6cef,
  @IsArray = @IsArray_d8cf6cef,
  @Description = @Description_d8cf6cef,
  @IsRequired = @IsRequired_d8cf6cef,
  @MediaModality = @MediaModality_d8cf6cef,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_6d48ce2b UNIQUEIDENTIFIER,
@ActionID_6d48ce2b UNIQUEIDENTIFIER,
@ResultCode_6d48ce2b NVARCHAR(255),
@IsSuccess_6d48ce2b BIT,
@Description_6d48ce2b NVARCHAR(MAX)
SET
  @ID_6d48ce2b = '5044A100-0002-4000-8000-0000000000C1'
SET
  @ActionID_6d48ce2b = '5044A100-0002-4000-8000-000000000002'
SET
  @ResultCode_6d48ce2b = N'SUCCESS'
SET
  @IsSuccess_6d48ce2b = 1
SET
  @Description_6d48ce2b = N'Recompute succeeded.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_6d48ce2b)
EXEC [__mj].spCreateActionResultCode @ID = @ID_6d48ce2b,
  @ActionID = @ActionID_6d48ce2b,
  @ResultCode = @ResultCode_6d48ce2b,
  @IsSuccess = @IsSuccess_6d48ce2b,
  @Description = @Description_6d48ce2b;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_e00a10cc UNIQUEIDENTIFIER,
@ActionID_e00a10cc UNIQUEIDENTIFIER,
@ResultCode_e00a10cc NVARCHAR(255),
@IsSuccess_e00a10cc BIT,
@Description_e00a10cc NVARCHAR(MAX)
SET
  @ID_e00a10cc = '5044A100-0002-4000-8000-0000000000C2'
SET
  @ActionID_e00a10cc = '5044A100-0002-4000-8000-000000000002'
SET
  @ResultCode_e00a10cc = N'VALIDATION_ERROR'
SET
  @IsSuccess_e00a10cc = 0
SET
  @Description_e00a10cc = N'A required input was missing or invalid.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_e00a10cc)
EXEC [__mj].spCreateActionResultCode @ID = @ID_e00a10cc,
  @ActionID = @ActionID_e00a10cc,
  @ResultCode = @ResultCode_e00a10cc,
  @IsSuccess = @IsSuccess_e00a10cc,
  @Description = @Description_e00a10cc;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_9b581f49 UNIQUEIDENTIFIER,
@ActionID_9b581f49 UNIQUEIDENTIFIER,
@ResultCode_9b581f49 NVARCHAR(255),
@IsSuccess_9b581f49 BIT,
@Description_9b581f49 NVARCHAR(MAX)
SET
  @ID_9b581f49 = '5044A100-0002-4000-8000-0000000000C3'
SET
  @ActionID_9b581f49 = '5044A100-0002-4000-8000-000000000002'
SET
  @ResultCode_9b581f49 = N'ERROR'
SET
  @IsSuccess_9b581f49 = 0
SET
  @Description_9b581f49 = N'The recompute run failed (e.g. model not published).' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_9b581f49)
EXEC [__mj].spCreateActionResultCode @ID = @ID_9b581f49,
  @ActionID = @ActionID_9b581f49,
  @ResultCode = @ResultCode_9b581f49,
  @IsSuccess = @IsSuccess_9b581f49,
  @Description = @Description_9b581f49;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_affd0e7c UNIQUEIDENTIFIER,
@ActionID_affd0e7c UNIQUEIDENTIFIER,
@Name_affd0e7c NVARCHAR(255),
@DefaultValue_affd0e7c NVARCHAR(MAX),
@Type_affd0e7c NCHAR(10),
@ValueType_affd0e7c NVARCHAR(30),
@IsArray_affd0e7c BIT,
@Description_affd0e7c NVARCHAR(MAX),
@IsRequired_affd0e7c BIT,
@MediaModality_affd0e7c NVARCHAR(20)
SET
  @ID_affd0e7c = '5044A100-0003-4000-8000-0000000000A1'
SET
  @ActionID_affd0e7c = '5044A100-0003-4000-8000-000000000003'
SET
  @Name_affd0e7c = N'ModelID'
SET
  @Type_affd0e7c = N'Input'
SET
  @ValueType_affd0e7c = N'Scalar'
SET
  @IsArray_affd0e7c = 0
SET
  @Description_affd0e7c = N'The ScoreModel ID the draft factor belongs to.'
SET
  @IsRequired_affd0e7c = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_affd0e7c)
EXEC [__mj].spCreateActionParam @ID = @ID_affd0e7c,
  @ActionID = @ActionID_affd0e7c,
  @Name = @Name_affd0e7c,
  @DefaultValue = @DefaultValue_affd0e7c,
  @DefaultValue_Clear = 1,
  @Type = @Type_affd0e7c,
  @ValueType = @ValueType_affd0e7c,
  @IsArray = @IsArray_affd0e7c,
  @Description = @Description_affd0e7c,
  @IsRequired = @IsRequired_affd0e7c,
  @MediaModality = @MediaModality_affd0e7c,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_3bca1e13 UNIQUEIDENTIFIER,
@ActionID_3bca1e13 UNIQUEIDENTIFIER,
@Name_3bca1e13 NVARCHAR(255),
@DefaultValue_3bca1e13 NVARCHAR(MAX),
@Type_3bca1e13 NCHAR(10),
@ValueType_3bca1e13 NVARCHAR(30),
@IsArray_3bca1e13 BIT,
@Description_3bca1e13 NVARCHAR(MAX),
@IsRequired_3bca1e13 BIT,
@MediaModality_3bca1e13 NVARCHAR(20)
SET
  @ID_3bca1e13 = '5044A100-0003-4000-8000-0000000000A3'
SET
  @ActionID_3bca1e13 = '5044A100-0003-4000-8000-000000000003'
SET
  @Name_3bca1e13 = N'DraftJSON'
SET
  @Type_3bca1e13 = N'Input'
SET
  @ValueType_3bca1e13 = N'Scalar'
SET
  @IsArray_3bca1e13 = 0
SET
  @Description_3bca1e13 = N'JSON of the draft factor: { sourceRelatedEntityID, aggregation, aggregateFieldName?, filterExpression?, timeWindowID?, normalizationMethod, higherIsBetter }.'
SET
  @IsRequired_3bca1e13 = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_3bca1e13)
EXEC [__mj].spCreateActionParam @ID = @ID_3bca1e13,
  @ActionID = @ActionID_3bca1e13,
  @Name = @Name_3bca1e13,
  @DefaultValue = @DefaultValue_3bca1e13,
  @DefaultValue_Clear = 1,
  @Type = @Type_3bca1e13,
  @ValueType = @ValueType_3bca1e13,
  @IsArray = @IsArray_3bca1e13,
  @Description = @Description_3bca1e13,
  @IsRequired = @IsRequired_3bca1e13,
  @MediaModality = @MediaModality_3bca1e13,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_1d3b8483 UNIQUEIDENTIFIER,
@ActionID_1d3b8483 UNIQUEIDENTIFIER,
@Name_1d3b8483 NVARCHAR(255),
@DefaultValue_1d3b8483 NVARCHAR(MAX),
@Type_1d3b8483 NCHAR(10),
@ValueType_1d3b8483 NVARCHAR(30),
@IsArray_1d3b8483 BIT,
@Description_1d3b8483 NVARCHAR(MAX),
@IsRequired_1d3b8483 BIT,
@MediaModality_1d3b8483 NVARCHAR(20)
SET
  @ID_1d3b8483 = '5044A100-0003-4000-8000-0000000000A2'
SET
  @ActionID_1d3b8483 = '5044A100-0003-4000-8000-000000000003'
SET
  @Name_1d3b8483 = N'Result'
SET
  @Type_1d3b8483 = N'Both'
SET
  @ValueType_1d3b8483 = N'Scalar'
SET
  @IsArray_1d3b8483 = 0
SET
  @Description_1d3b8483 = N'JSON: { membersWithData, sampleAnchorId, sampleRawValue, sampleStrength }.'
SET
  @IsRequired_1d3b8483 = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_1d3b8483)
EXEC [__mj].spCreateActionParam @ID = @ID_1d3b8483,
  @ActionID = @ActionID_1d3b8483,
  @Name = @Name_1d3b8483,
  @DefaultValue = @DefaultValue_1d3b8483,
  @DefaultValue_Clear = 1,
  @Type = @Type_1d3b8483,
  @ValueType = @ValueType_1d3b8483,
  @IsArray = @IsArray_1d3b8483,
  @Description = @Description_1d3b8483,
  @IsRequired = @IsRequired_1d3b8483,
  @MediaModality = @MediaModality_1d3b8483,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_05a0878b UNIQUEIDENTIFIER,
@ActionID_05a0878b UNIQUEIDENTIFIER,
@ResultCode_05a0878b NVARCHAR(255),
@IsSuccess_05a0878b BIT,
@Description_05a0878b NVARCHAR(MAX)
SET
  @ID_05a0878b = '5044A100-0003-4000-8000-0000000000C1'
SET
  @ActionID_05a0878b = '5044A100-0003-4000-8000-000000000003'
SET
  @ResultCode_05a0878b = N'SUCCESS'
SET
  @IsSuccess_05a0878b = 1
SET
  @Description_05a0878b = N'Preview computed.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_05a0878b)
EXEC [__mj].spCreateActionResultCode @ID = @ID_05a0878b,
  @ActionID = @ActionID_05a0878b,
  @ResultCode = @ResultCode_05a0878b,
  @IsSuccess = @IsSuccess_05a0878b,
  @Description = @Description_05a0878b;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_b2f04360 UNIQUEIDENTIFIER,
@ActionID_b2f04360 UNIQUEIDENTIFIER,
@ResultCode_b2f04360 NVARCHAR(255),
@IsSuccess_b2f04360 BIT,
@Description_b2f04360 NVARCHAR(MAX)
SET
  @ID_b2f04360 = '5044A100-0003-4000-8000-0000000000C2'
SET
  @ActionID_b2f04360 = '5044A100-0003-4000-8000-000000000003'
SET
  @ResultCode_b2f04360 = N'VALIDATION_ERROR'
SET
  @IsSuccess_b2f04360 = 0
SET
  @Description_b2f04360 = N'A required input was missing or invalid.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_b2f04360)
EXEC [__mj].spCreateActionResultCode @ID = @ID_b2f04360,
  @ActionID = @ActionID_b2f04360,
  @ResultCode = @ResultCode_b2f04360,
  @IsSuccess = @IsSuccess_b2f04360,
  @Description = @Description_b2f04360;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_2631d5f0 UNIQUEIDENTIFIER,
@ActionID_2631d5f0 UNIQUEIDENTIFIER,
@ResultCode_2631d5f0 NVARCHAR(255),
@IsSuccess_2631d5f0 BIT,
@Description_2631d5f0 NVARCHAR(MAX)
SET
  @ID_2631d5f0 = '5044A100-0003-4000-8000-0000000000C3'
SET
  @ActionID_2631d5f0 = '5044A100-0003-4000-8000-000000000003'
SET
  @ResultCode_2631d5f0 = N'ERROR'
SET
  @IsSuccess_2631d5f0 = 0
SET
  @Description_2631d5f0 = N'The engine failed to evaluate the draft factor.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_2631d5f0)
EXEC [__mj].spCreateActionResultCode @ID = @ID_2631d5f0,
  @ActionID = @ActionID_2631d5f0,
  @ResultCode = @ResultCode_2631d5f0,
  @IsSuccess = @IsSuccess_2631d5f0,
  @Description = @Description_2631d5f0;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_09c59f77 UNIQUEIDENTIFIER,
@ActionID_09c59f77 UNIQUEIDENTIFIER,
@Name_09c59f77 NVARCHAR(255),
@DefaultValue_09c59f77 NVARCHAR(MAX),
@Type_09c59f77 NCHAR(10),
@ValueType_09c59f77 NVARCHAR(30),
@IsArray_09c59f77 BIT,
@Description_09c59f77 NVARCHAR(MAX),
@IsRequired_09c59f77 BIT,
@MediaModality_09c59f77 NVARCHAR(20)
SET
  @ID_09c59f77 = '5044A100-0005-4000-8000-0000000000A1'
SET
  @ActionID_09c59f77 = '5044A100-0005-4000-8000-000000000005'
SET
  @Name_09c59f77 = N'Result'
SET
  @Type_09c59f77 = N'Both'
SET
  @ValueType_09c59f77 = N'Scalar'
SET
  @IsArray_09c59f77 = 0
SET
  @Description_09c59f77 = N'JSON array of factor-actions: { actionId, name, description, contract, params[] }.'
SET
  @IsRequired_09c59f77 = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_09c59f77)
EXEC [__mj].spCreateActionParam @ID = @ID_09c59f77,
  @ActionID = @ActionID_09c59f77,
  @Name = @Name_09c59f77,
  @DefaultValue = @DefaultValue_09c59f77,
  @DefaultValue_Clear = 1,
  @Type = @Type_09c59f77,
  @ValueType = @ValueType_09c59f77,
  @IsArray = @IsArray_09c59f77,
  @Description = @Description_09c59f77,
  @IsRequired = @IsRequired_09c59f77,
  @MediaModality = @MediaModality_09c59f77,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_2cfd837c UNIQUEIDENTIFIER,
@ActionID_2cfd837c UNIQUEIDENTIFIER,
@ResultCode_2cfd837c NVARCHAR(255),
@IsSuccess_2cfd837c BIT,
@Description_2cfd837c NVARCHAR(MAX)
SET
  @ID_2cfd837c = '5044A100-0005-4000-8000-0000000000C1'
SET
  @ActionID_2cfd837c = '5044A100-0005-4000-8000-000000000005'
SET
  @ResultCode_2cfd837c = N'SUCCESS'
SET
  @IsSuccess_2cfd837c = 1
SET
  @Description_2cfd837c = N'Catalog returned.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_2cfd837c)
EXEC [__mj].spCreateActionResultCode @ID = @ID_2cfd837c,
  @ActionID = @ActionID_2cfd837c,
  @ResultCode = @ResultCode_2cfd837c,
  @IsSuccess = @IsSuccess_2cfd837c,
  @Description = @Description_2cfd837c;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_44c70a69 UNIQUEIDENTIFIER,
@ActionID_44c70a69 UNIQUEIDENTIFIER,
@ResultCode_44c70a69 NVARCHAR(255),
@IsSuccess_44c70a69 BIT,
@Description_44c70a69 NVARCHAR(MAX)
SET
  @ID_44c70a69 = '5044A100-0005-4000-8000-0000000000C2'
SET
  @ActionID_44c70a69 = '5044A100-0005-4000-8000-000000000005'
SET
  @ResultCode_44c70a69 = N'ERROR'
SET
  @IsSuccess_44c70a69 = 0
SET
  @Description_44c70a69 = N'Failed to build the factor-action catalog.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_44c70a69)
EXEC [__mj].spCreateActionResultCode @ID = @ID_44c70a69,
  @ActionID = @ActionID_44c70a69,
  @ResultCode = @ResultCode_44c70a69,
  @IsSuccess = @IsSuccess_44c70a69,
  @Description = @Description_44c70a69;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_e745e40f UNIQUEIDENTIFIER,
@ActionID_e745e40f UNIQUEIDENTIFIER,
@Name_e745e40f NVARCHAR(255),
@DefaultValue_e745e40f NVARCHAR(MAX),
@Type_e745e40f NCHAR(10),
@ValueType_e745e40f NVARCHAR(30),
@IsArray_e745e40f BIT,
@Description_e745e40f NVARCHAR(MAX),
@IsRequired_e745e40f BIT,
@MediaModality_e745e40f NVARCHAR(20)
SET
  @ID_e745e40f = '5044A100-0008-4000-8000-0000000000A1'
SET
  @ActionID_e745e40f = '5044A100-0008-4000-8000-000000000008'
SET
  @Name_e745e40f = N'ModelID'
SET
  @Type_e745e40f = N'Input'
SET
  @ValueType_e745e40f = N'Scalar'
SET
  @IsArray_e745e40f = 0
SET
  @Description_e745e40f = N'The ScoreModel to add the factor to.'
SET
  @IsRequired_e745e40f = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_e745e40f)
EXEC [__mj].spCreateActionParam @ID = @ID_e745e40f,
  @ActionID = @ActionID_e745e40f,
  @Name = @Name_e745e40f,
  @DefaultValue = @DefaultValue_e745e40f,
  @DefaultValue_Clear = 1,
  @Type = @Type_e745e40f,
  @ValueType = @ValueType_e745e40f,
  @IsArray = @IsArray_e745e40f,
  @Description = @Description_e745e40f,
  @IsRequired = @IsRequired_e745e40f,
  @MediaModality = @MediaModality_e745e40f,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_b20f2421 UNIQUEIDENTIFIER,
@ActionID_b20f2421 UNIQUEIDENTIFIER,
@Name_b20f2421 NVARCHAR(255),
@DefaultValue_b20f2421 NVARCHAR(MAX),
@Type_b20f2421 NCHAR(10),
@ValueType_b20f2421 NVARCHAR(30),
@IsArray_b20f2421 BIT,
@Description_b20f2421 NVARCHAR(MAX),
@IsRequired_b20f2421 BIT,
@MediaModality_b20f2421 NVARCHAR(20)
SET
  @ID_b20f2421 = '5044A100-0008-4000-8000-0000000000A2'
SET
  @ActionID_b20f2421 = '5044A100-0008-4000-8000-000000000008'
SET
  @Name_b20f2421 = N'Spec'
SET
  @Type_b20f2421 = N'Input'
SET
  @ValueType_b20f2421 = N'Scalar'
SET
  @IsArray_b20f2421 = 0
SET
  @Description_b20f2421 = N'JSON CreateFactorSpec: name, sourceRelatedEntityID, aggregation, aggregateFieldName, filterExpression, timeWindowID, normalizationMethod, normalizationParamsJSON, higherIsBetter, weight, weightMode.'
SET
  @IsRequired_b20f2421 = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_b20f2421)
EXEC [__mj].spCreateActionParam @ID = @ID_b20f2421,
  @ActionID = @ActionID_b20f2421,
  @Name = @Name_b20f2421,
  @DefaultValue = @DefaultValue_b20f2421,
  @DefaultValue_Clear = 1,
  @Type = @Type_b20f2421,
  @ValueType = @ValueType_b20f2421,
  @IsArray = @IsArray_b20f2421,
  @Description = @Description_b20f2421,
  @IsRequired = @IsRequired_b20f2421,
  @MediaModality = @MediaModality_b20f2421,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_24fd1fe5 UNIQUEIDENTIFIER,
@ActionID_24fd1fe5 UNIQUEIDENTIFIER,
@Name_24fd1fe5 NVARCHAR(255),
@DefaultValue_24fd1fe5 NVARCHAR(MAX),
@Type_24fd1fe5 NCHAR(10),
@ValueType_24fd1fe5 NVARCHAR(30),
@IsArray_24fd1fe5 BIT,
@Description_24fd1fe5 NVARCHAR(MAX),
@IsRequired_24fd1fe5 BIT,
@MediaModality_24fd1fe5 NVARCHAR(20)
SET
  @ID_24fd1fe5 = '5044A100-0008-4000-8000-0000000000A3'
SET
  @ActionID_24fd1fe5 = '5044A100-0008-4000-8000-000000000008'
SET
  @Name_24fd1fe5 = N'Result'
SET
  @Type_24fd1fe5 = N'Both'
SET
  @ValueType_24fd1fe5 = N'Scalar'
SET
  @IsArray_24fd1fe5 = 0
SET
  @Description_24fd1fe5 = N'JSON: { factorID, modelFactorID }.'
SET
  @IsRequired_24fd1fe5 = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_24fd1fe5)
EXEC [__mj].spCreateActionParam @ID = @ID_24fd1fe5,
  @ActionID = @ActionID_24fd1fe5,
  @Name = @Name_24fd1fe5,
  @DefaultValue = @DefaultValue_24fd1fe5,
  @DefaultValue_Clear = 1,
  @Type = @Type_24fd1fe5,
  @ValueType = @ValueType_24fd1fe5,
  @IsArray = @IsArray_24fd1fe5,
  @Description = @Description_24fd1fe5,
  @IsRequired = @IsRequired_24fd1fe5,
  @MediaModality = @MediaModality_24fd1fe5,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_f227730c UNIQUEIDENTIFIER,
@ActionID_f227730c UNIQUEIDENTIFIER,
@ResultCode_f227730c NVARCHAR(255),
@IsSuccess_f227730c BIT,
@Description_f227730c NVARCHAR(MAX)
SET
  @ID_f227730c = '5044A100-0008-4000-8000-0000000000C1'
SET
  @ActionID_f227730c = '5044A100-0008-4000-8000-000000000008'
SET
  @ResultCode_f227730c = N'SUCCESS'
SET
  @IsSuccess_f227730c = 1
SET
  @Description_f227730c = N'Factor created and bound.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_f227730c)
EXEC [__mj].spCreateActionResultCode @ID = @ID_f227730c,
  @ActionID = @ActionID_f227730c,
  @ResultCode = @ResultCode_f227730c,
  @IsSuccess = @IsSuccess_f227730c,
  @Description = @Description_f227730c;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_c6470cfa UNIQUEIDENTIFIER,
@ActionID_c6470cfa UNIQUEIDENTIFIER,
@ResultCode_c6470cfa NVARCHAR(255),
@IsSuccess_c6470cfa BIT,
@Description_c6470cfa NVARCHAR(MAX)
SET
  @ID_c6470cfa = '5044A100-0008-4000-8000-0000000000C2'
SET
  @ActionID_c6470cfa = '5044A100-0008-4000-8000-000000000008'
SET
  @ResultCode_c6470cfa = N'VALIDATION_ERROR'
SET
  @IsSuccess_c6470cfa = 0
SET
  @Description_c6470cfa = N'A required input was missing or invalid.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_c6470cfa)
EXEC [__mj].spCreateActionResultCode @ID = @ID_c6470cfa,
  @ActionID = @ActionID_c6470cfa,
  @ResultCode = @ResultCode_c6470cfa,
  @IsSuccess = @IsSuccess_c6470cfa,
  @Description = @Description_c6470cfa;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_ee7142d0 UNIQUEIDENTIFIER,
@ActionID_ee7142d0 UNIQUEIDENTIFIER,
@ResultCode_ee7142d0 NVARCHAR(255),
@IsSuccess_ee7142d0 BIT,
@Description_ee7142d0 NVARCHAR(MAX)
SET
  @ID_ee7142d0 = '5044A100-0008-4000-8000-0000000000C3'
SET
  @ActionID_ee7142d0 = '5044A100-0008-4000-8000-000000000008'
SET
  @ResultCode_ee7142d0 = N'NOT_FOUND'
SET
  @IsSuccess_ee7142d0 = 0
SET
  @Description_ee7142d0 = N'The model was not found.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_ee7142d0)
EXEC [__mj].spCreateActionResultCode @ID = @ID_ee7142d0,
  @ActionID = @ActionID_ee7142d0,
  @ResultCode = @ResultCode_ee7142d0,
  @IsSuccess = @IsSuccess_ee7142d0,
  @Description = @Description_ee7142d0;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_626c8a64 UNIQUEIDENTIFIER,
@ActionID_626c8a64 UNIQUEIDENTIFIER,
@ResultCode_626c8a64 NVARCHAR(255),
@IsSuccess_626c8a64 BIT,
@Description_626c8a64 NVARCHAR(MAX)
SET
  @ID_626c8a64 = '5044A100-0008-4000-8000-0000000000C4'
SET
  @ActionID_626c8a64 = '5044A100-0008-4000-8000-000000000008'
SET
  @ResultCode_626c8a64 = N'ERROR'
SET
  @IsSuccess_626c8a64 = 0
SET
  @Description_626c8a64 = N'Saving the factor or binding failed.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_626c8a64)
EXEC [__mj].spCreateActionResultCode @ID = @ID_626c8a64,
  @ActionID = @ActionID_626c8a64,
  @ResultCode = @ResultCode_626c8a64,
  @IsSuccess = @IsSuccess_626c8a64,
  @Description = @Description_626c8a64;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_a84b2658 UNIQUEIDENTIFIER,
@ActionID_a84b2658 UNIQUEIDENTIFIER,
@Name_a84b2658 NVARCHAR(255),
@DefaultValue_a84b2658 NVARCHAR(MAX),
@Type_a84b2658 NCHAR(10),
@ValueType_a84b2658 NVARCHAR(30),
@IsArray_a84b2658 BIT,
@Description_a84b2658 NVARCHAR(MAX),
@IsRequired_a84b2658 BIT,
@MediaModality_a84b2658 NVARCHAR(20)
SET
  @ID_a84b2658 = '5044A100-0009-4000-8000-0000000000A1'
SET
  @ActionID_a84b2658 = '5044A100-0009-4000-8000-000000000009'
SET
  @Name_a84b2658 = N'ModelID'
SET
  @Type_a84b2658 = N'Input'
SET
  @ValueType_a84b2658 = N'Scalar'
SET
  @IsArray_a84b2658 = 0
SET
  @Description_a84b2658 = N'The ScoreModel to wire the source into.'
SET
  @IsRequired_a84b2658 = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_a84b2658)
EXEC [__mj].spCreateActionParam @ID = @ID_a84b2658,
  @ActionID = @ActionID_a84b2658,
  @Name = @Name_a84b2658,
  @DefaultValue = @DefaultValue_a84b2658,
  @DefaultValue_Clear = 1,
  @Type = @Type_a84b2658,
  @ValueType = @ValueType_a84b2658,
  @IsArray = @IsArray_a84b2658,
  @Description = @Description_a84b2658,
  @IsRequired = @IsRequired_a84b2658,
  @MediaModality = @MediaModality_a84b2658,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_eca4a482 UNIQUEIDENTIFIER,
@ActionID_eca4a482 UNIQUEIDENTIFIER,
@Name_eca4a482 NVARCHAR(255),
@DefaultValue_eca4a482 NVARCHAR(MAX),
@Type_eca4a482 NCHAR(10),
@ValueType_eca4a482 NVARCHAR(30),
@IsArray_eca4a482 BIT,
@Description_eca4a482 NVARCHAR(MAX),
@IsRequired_eca4a482 BIT,
@MediaModality_eca4a482 NVARCHAR(20)
SET
  @ID_eca4a482 = '5044A100-0009-4000-8000-0000000000A2'
SET
  @ActionID_eca4a482 = '5044A100-0009-4000-8000-000000000009'
SET
  @Name_eca4a482 = N'Spec'
SET
  @Type_eca4a482 = N'Input'
SET
  @ValueType_eca4a482 = N'Scalar'
SET
  @IsArray_eca4a482 = 0
SET
  @Description_eca4a482 = N'JSON AddDataSourceSpec: relatedEntityID, alias, relationshipPath (optional explicit FK path).'
SET
  @IsRequired_eca4a482 = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_eca4a482)
EXEC [__mj].spCreateActionParam @ID = @ID_eca4a482,
  @ActionID = @ActionID_eca4a482,
  @Name = @Name_eca4a482,
  @DefaultValue = @DefaultValue_eca4a482,
  @DefaultValue_Clear = 1,
  @Type = @Type_eca4a482,
  @ValueType = @ValueType_eca4a482,
  @IsArray = @IsArray_eca4a482,
  @Description = @Description_eca4a482,
  @IsRequired = @IsRequired_eca4a482,
  @MediaModality = @MediaModality_eca4a482,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_509e5289 UNIQUEIDENTIFIER,
@ActionID_509e5289 UNIQUEIDENTIFIER,
@Name_509e5289 NVARCHAR(255),
@DefaultValue_509e5289 NVARCHAR(MAX),
@Type_509e5289 NCHAR(10),
@ValueType_509e5289 NVARCHAR(30),
@IsArray_509e5289 BIT,
@Description_509e5289 NVARCHAR(MAX),
@IsRequired_509e5289 BIT,
@MediaModality_509e5289 NVARCHAR(20)
SET
  @ID_509e5289 = '5044A100-0009-4000-8000-0000000000A3'
SET
  @ActionID_509e5289 = '5044A100-0009-4000-8000-000000000009'
SET
  @Name_509e5289 = N'Result'
SET
  @Type_509e5289 = N'Both'
SET
  @ValueType_509e5289 = N'Scalar'
SET
  @IsArray_509e5289 = 0
SET
  @Description_509e5289 = N'JSON: { modelRelatedEntityID }.'
SET
  @IsRequired_509e5289 = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_509e5289)
EXEC [__mj].spCreateActionParam @ID = @ID_509e5289,
  @ActionID = @ActionID_509e5289,
  @Name = @Name_509e5289,
  @DefaultValue = @DefaultValue_509e5289,
  @DefaultValue_Clear = 1,
  @Type = @Type_509e5289,
  @ValueType = @ValueType_509e5289,
  @IsArray = @IsArray_509e5289,
  @Description = @Description_509e5289,
  @IsRequired = @IsRequired_509e5289,
  @MediaModality = @MediaModality_509e5289,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_448741cf UNIQUEIDENTIFIER,
@ActionID_448741cf UNIQUEIDENTIFIER,
@ResultCode_448741cf NVARCHAR(255),
@IsSuccess_448741cf BIT,
@Description_448741cf NVARCHAR(MAX)
SET
  @ID_448741cf = '5044A100-0009-4000-8000-0000000000C1'
SET
  @ActionID_448741cf = '5044A100-0009-4000-8000-000000000009'
SET
  @ResultCode_448741cf = N'SUCCESS'
SET
  @IsSuccess_448741cf = 1
SET
  @Description_448741cf = N'Data source wired.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_448741cf)
EXEC [__mj].spCreateActionResultCode @ID = @ID_448741cf,
  @ActionID = @ActionID_448741cf,
  @ResultCode = @ResultCode_448741cf,
  @IsSuccess = @IsSuccess_448741cf,
  @Description = @Description_448741cf;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_55089cf0 UNIQUEIDENTIFIER,
@ActionID_55089cf0 UNIQUEIDENTIFIER,
@ResultCode_55089cf0 NVARCHAR(255),
@IsSuccess_55089cf0 BIT,
@Description_55089cf0 NVARCHAR(MAX)
SET
  @ID_55089cf0 = '5044A100-0009-4000-8000-0000000000C2'
SET
  @ActionID_55089cf0 = '5044A100-0009-4000-8000-000000000009'
SET
  @ResultCode_55089cf0 = N'VALIDATION_ERROR'
SET
  @IsSuccess_55089cf0 = 0
SET
  @Description_55089cf0 = N'A required input was missing or invalid.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_55089cf0)
EXEC [__mj].spCreateActionResultCode @ID = @ID_55089cf0,
  @ActionID = @ActionID_55089cf0,
  @ResultCode = @ResultCode_55089cf0,
  @IsSuccess = @IsSuccess_55089cf0,
  @Description = @Description_55089cf0;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_34afe362 UNIQUEIDENTIFIER,
@ActionID_34afe362 UNIQUEIDENTIFIER,
@ResultCode_34afe362 NVARCHAR(255),
@IsSuccess_34afe362 BIT,
@Description_34afe362 NVARCHAR(MAX)
SET
  @ID_34afe362 = '5044A100-0009-4000-8000-0000000000C3'
SET
  @ActionID_34afe362 = '5044A100-0009-4000-8000-000000000009'
SET
  @ResultCode_34afe362 = N'ERROR'
SET
  @IsSuccess_34afe362 = 0
SET
  @Description_34afe362 = N'Saving the data source failed.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_34afe362)
EXEC [__mj].spCreateActionResultCode @ID = @ID_34afe362,
  @ActionID = @ActionID_34afe362,
  @ResultCode = @ResultCode_34afe362,
  @IsSuccess = @IsSuccess_34afe362,
  @Description = @Description_34afe362;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_38b2c076 UNIQUEIDENTIFIER,
@ActionID_38b2c076 UNIQUEIDENTIFIER,
@Name_38b2c076 NVARCHAR(255),
@DefaultValue_38b2c076 NVARCHAR(MAX),
@Type_38b2c076 NCHAR(10),
@ValueType_38b2c076 NVARCHAR(30),
@IsArray_38b2c076 BIT,
@Description_38b2c076 NVARCHAR(MAX),
@IsRequired_38b2c076 BIT,
@MediaModality_38b2c076 NVARCHAR(20)
SET
  @ID_38b2c076 = '5044A100-000A-4000-8000-0000000000A1'
SET
  @ActionID_38b2c076 = '5044A100-000A-4000-8000-00000000000A'
SET
  @Name_38b2c076 = N'Spec'
SET
  @Type_38b2c076 = N'Input'
SET
  @ValueType_38b2c076 = N'Scalar'
SET
  @IsArray_38b2c076 = 0
SET
  @Description_38b2c076 = N'JSON CreateModelSpec: name, anchorEntityID.'
SET
  @IsRequired_38b2c076 = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_38b2c076)
EXEC [__mj].spCreateActionParam @ID = @ID_38b2c076,
  @ActionID = @ActionID_38b2c076,
  @Name = @Name_38b2c076,
  @DefaultValue = @DefaultValue_38b2c076,
  @DefaultValue_Clear = 1,
  @Type = @Type_38b2c076,
  @ValueType = @ValueType_38b2c076,
  @IsArray = @IsArray_38b2c076,
  @Description = @Description_38b2c076,
  @IsRequired = @IsRequired_38b2c076,
  @MediaModality = @MediaModality_38b2c076,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_d2a54a45 UNIQUEIDENTIFIER,
@ActionID_d2a54a45 UNIQUEIDENTIFIER,
@Name_d2a54a45 NVARCHAR(255),
@DefaultValue_d2a54a45 NVARCHAR(MAX),
@Type_d2a54a45 NCHAR(10),
@ValueType_d2a54a45 NVARCHAR(30),
@IsArray_d2a54a45 BIT,
@Description_d2a54a45 NVARCHAR(MAX),
@IsRequired_d2a54a45 BIT,
@MediaModality_d2a54a45 NVARCHAR(20)
SET
  @ID_d2a54a45 = '5044A100-000A-4000-8000-0000000000A2'
SET
  @ActionID_d2a54a45 = '5044A100-000A-4000-8000-00000000000A'
SET
  @Name_d2a54a45 = N'Result'
SET
  @Type_d2a54a45 = N'Both'
SET
  @ValueType_d2a54a45 = N'Scalar'
SET
  @IsArray_d2a54a45 = 0
SET
  @Description_d2a54a45 = N'JSON: { modelID }.'
SET
  @IsRequired_d2a54a45 = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_d2a54a45)
EXEC [__mj].spCreateActionParam @ID = @ID_d2a54a45,
  @ActionID = @ActionID_d2a54a45,
  @Name = @Name_d2a54a45,
  @DefaultValue = @DefaultValue_d2a54a45,
  @DefaultValue_Clear = 1,
  @Type = @Type_d2a54a45,
  @ValueType = @ValueType_d2a54a45,
  @IsArray = @IsArray_d2a54a45,
  @Description = @Description_d2a54a45,
  @IsRequired = @IsRequired_d2a54a45,
  @MediaModality = @MediaModality_d2a54a45,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_81388e3c UNIQUEIDENTIFIER,
@ActionID_81388e3c UNIQUEIDENTIFIER,
@ResultCode_81388e3c NVARCHAR(255),
@IsSuccess_81388e3c BIT,
@Description_81388e3c NVARCHAR(MAX)
SET
  @ID_81388e3c = '5044A100-000A-4000-8000-0000000000C1'
SET
  @ActionID_81388e3c = '5044A100-000A-4000-8000-00000000000A'
SET
  @ResultCode_81388e3c = N'SUCCESS'
SET
  @IsSuccess_81388e3c = 1
SET
  @Description_81388e3c = N'Draft model created.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_81388e3c)
EXEC [__mj].spCreateActionResultCode @ID = @ID_81388e3c,
  @ActionID = @ActionID_81388e3c,
  @ResultCode = @ResultCode_81388e3c,
  @IsSuccess = @IsSuccess_81388e3c,
  @Description = @Description_81388e3c;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_51d406a9 UNIQUEIDENTIFIER,
@ActionID_51d406a9 UNIQUEIDENTIFIER,
@ResultCode_51d406a9 NVARCHAR(255),
@IsSuccess_51d406a9 BIT,
@Description_51d406a9 NVARCHAR(MAX)
SET
  @ID_51d406a9 = '5044A100-000A-4000-8000-0000000000C2'
SET
  @ActionID_51d406a9 = '5044A100-000A-4000-8000-00000000000A'
SET
  @ResultCode_51d406a9 = N'VALIDATION_ERROR'
SET
  @IsSuccess_51d406a9 = 0
SET
  @Description_51d406a9 = N'A required input was missing or invalid.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_51d406a9)
EXEC [__mj].spCreateActionResultCode @ID = @ID_51d406a9,
  @ActionID = @ActionID_51d406a9,
  @ResultCode = @ResultCode_51d406a9,
  @IsSuccess = @IsSuccess_51d406a9,
  @Description = @Description_51d406a9;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_d7839369 UNIQUEIDENTIFIER,
@ActionID_d7839369 UNIQUEIDENTIFIER,
@ResultCode_d7839369 NVARCHAR(255),
@IsSuccess_d7839369 BIT,
@Description_d7839369 NVARCHAR(MAX)
SET
  @ID_d7839369 = '5044A100-000A-4000-8000-0000000000C3'
SET
  @ActionID_d7839369 = '5044A100-000A-4000-8000-00000000000A'
SET
  @ResultCode_d7839369 = N'ERROR'
SET
  @IsSuccess_d7839369 = 0
SET
  @Description_d7839369 = N'Saving the model failed.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_d7839369)
EXEC [__mj].spCreateActionResultCode @ID = @ID_d7839369,
  @ActionID = @ActionID_d7839369,
  @ResultCode = @ResultCode_d7839369,
  @IsSuccess = @IsSuccess_d7839369,
  @Description = @Description_d7839369;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_210a9018 UNIQUEIDENTIFIER,
@ActionID_210a9018 UNIQUEIDENTIFIER,
@Name_210a9018 NVARCHAR(255),
@DefaultValue_210a9018 NVARCHAR(MAX),
@Type_210a9018 NCHAR(10),
@ValueType_210a9018 NVARCHAR(30),
@IsArray_210a9018 BIT,
@Description_210a9018 NVARCHAR(MAX),
@IsRequired_210a9018 BIT,
@MediaModality_210a9018 NVARCHAR(20)
SET
  @ID_210a9018 = '5044A100-000B-4000-8000-0000000000A1'
SET
  @ActionID_210a9018 = '5044A100-000B-4000-8000-00000000000B'
SET
  @Name_210a9018 = N'ModelID'
SET
  @Type_210a9018 = N'Input'
SET
  @ValueType_210a9018 = N'Scalar'
SET
  @IsArray_210a9018 = 0
SET
  @Description_210a9018 = N'The ScoreModel to attach the band set to.'
SET
  @IsRequired_210a9018 = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_210a9018)
EXEC [__mj].spCreateActionParam @ID = @ID_210a9018,
  @ActionID = @ActionID_210a9018,
  @Name = @Name_210a9018,
  @DefaultValue = @DefaultValue_210a9018,
  @DefaultValue_Clear = 1,
  @Type = @Type_210a9018,
  @ValueType = @ValueType_210a9018,
  @IsArray = @IsArray_210a9018,
  @Description = @Description_210a9018,
  @IsRequired = @IsRequired_210a9018,
  @MediaModality = @MediaModality_210a9018,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_92e49946 UNIQUEIDENTIFIER,
@ActionID_92e49946 UNIQUEIDENTIFIER,
@Name_92e49946 NVARCHAR(255),
@DefaultValue_92e49946 NVARCHAR(MAX),
@Type_92e49946 NCHAR(10),
@ValueType_92e49946 NVARCHAR(30),
@IsArray_92e49946 BIT,
@Description_92e49946 NVARCHAR(MAX),
@IsRequired_92e49946 BIT,
@MediaModality_92e49946 NVARCHAR(20)
SET
  @ID_92e49946 = '5044A100-000B-4000-8000-0000000000A2'
SET
  @ActionID_92e49946 = '5044A100-000B-4000-8000-00000000000B'
SET
  @Name_92e49946 = N'BandSetID'
SET
  @Type_92e49946 = N'Input'
SET
  @ValueType_92e49946 = N'Scalar'
SET
  @IsArray_92e49946 = 0
SET
  @Description_92e49946 = N'The ScoreBandSet to attach.'
SET
  @IsRequired_92e49946 = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_92e49946)
EXEC [__mj].spCreateActionParam @ID = @ID_92e49946,
  @ActionID = @ActionID_92e49946,
  @Name = @Name_92e49946,
  @DefaultValue = @DefaultValue_92e49946,
  @DefaultValue_Clear = 1,
  @Type = @Type_92e49946,
  @ValueType = @ValueType_92e49946,
  @IsArray = @IsArray_92e49946,
  @Description = @Description_92e49946,
  @IsRequired = @IsRequired_92e49946,
  @MediaModality = @MediaModality_92e49946,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_d142e828 UNIQUEIDENTIFIER,
@ActionID_d142e828 UNIQUEIDENTIFIER,
@Name_d142e828 NVARCHAR(255),
@DefaultValue_d142e828 NVARCHAR(MAX),
@Type_d142e828 NCHAR(10),
@ValueType_d142e828 NVARCHAR(30),
@IsArray_d142e828 BIT,
@Description_d142e828 NVARCHAR(MAX),
@IsRequired_d142e828 BIT,
@MediaModality_d142e828 NVARCHAR(20)
SET
  @ID_d142e828 = '5044A100-000B-4000-8000-0000000000A3'
SET
  @ActionID_d142e828 = '5044A100-000B-4000-8000-00000000000B'
SET
  @Name_d142e828 = N'Result'
SET
  @Type_d142e828 = N'Both'
SET
  @ValueType_d142e828 = N'Scalar'
SET
  @IsArray_d142e828 = 0
SET
  @Description_d142e828 = N'JSON: { modelID, bandSetID }.'
SET
  @IsRequired_d142e828 = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_d142e828)
EXEC [__mj].spCreateActionParam @ID = @ID_d142e828,
  @ActionID = @ActionID_d142e828,
  @Name = @Name_d142e828,
  @DefaultValue = @DefaultValue_d142e828,
  @DefaultValue_Clear = 1,
  @Type = @Type_d142e828,
  @ValueType = @ValueType_d142e828,
  @IsArray = @IsArray_d142e828,
  @Description = @Description_d142e828,
  @IsRequired = @IsRequired_d142e828,
  @MediaModality = @MediaModality_d142e828,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_d8dd6056 UNIQUEIDENTIFIER,
@ActionID_d8dd6056 UNIQUEIDENTIFIER,
@ResultCode_d8dd6056 NVARCHAR(255),
@IsSuccess_d8dd6056 BIT,
@Description_d8dd6056 NVARCHAR(MAX)
SET
  @ID_d8dd6056 = '5044A100-000B-4000-8000-0000000000C1'
SET
  @ActionID_d8dd6056 = '5044A100-000B-4000-8000-00000000000B'
SET
  @ResultCode_d8dd6056 = N'SUCCESS'
SET
  @IsSuccess_d8dd6056 = 1
SET
  @Description_d8dd6056 = N'Band set attached.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_d8dd6056)
EXEC [__mj].spCreateActionResultCode @ID = @ID_d8dd6056,
  @ActionID = @ActionID_d8dd6056,
  @ResultCode = @ResultCode_d8dd6056,
  @IsSuccess = @IsSuccess_d8dd6056,
  @Description = @Description_d8dd6056;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_e7a2821e UNIQUEIDENTIFIER,
@ActionID_e7a2821e UNIQUEIDENTIFIER,
@ResultCode_e7a2821e NVARCHAR(255),
@IsSuccess_e7a2821e BIT,
@Description_e7a2821e NVARCHAR(MAX)
SET
  @ID_e7a2821e = '5044A100-000B-4000-8000-0000000000C2'
SET
  @ActionID_e7a2821e = '5044A100-000B-4000-8000-00000000000B'
SET
  @ResultCode_e7a2821e = N'VALIDATION_ERROR'
SET
  @IsSuccess_e7a2821e = 0
SET
  @Description_e7a2821e = N'A required input was missing or invalid.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_e7a2821e)
EXEC [__mj].spCreateActionResultCode @ID = @ID_e7a2821e,
  @ActionID = @ActionID_e7a2821e,
  @ResultCode = @ResultCode_e7a2821e,
  @IsSuccess = @IsSuccess_e7a2821e,
  @Description = @Description_e7a2821e;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_aecb00ec UNIQUEIDENTIFIER,
@ActionID_aecb00ec UNIQUEIDENTIFIER,
@ResultCode_aecb00ec NVARCHAR(255),
@IsSuccess_aecb00ec BIT,
@Description_aecb00ec NVARCHAR(MAX)
SET
  @ID_aecb00ec = '5044A100-000B-4000-8000-0000000000C3'
SET
  @ActionID_aecb00ec = '5044A100-000B-4000-8000-00000000000B'
SET
  @ResultCode_aecb00ec = N'NOT_FOUND'
SET
  @IsSuccess_aecb00ec = 0
SET
  @Description_aecb00ec = N'The model was not found.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_aecb00ec)
EXEC [__mj].spCreateActionResultCode @ID = @ID_aecb00ec,
  @ActionID = @ActionID_aecb00ec,
  @ResultCode = @ResultCode_aecb00ec,
  @IsSuccess = @IsSuccess_aecb00ec,
  @Description = @Description_aecb00ec;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_86db0362 UNIQUEIDENTIFIER,
@ActionID_86db0362 UNIQUEIDENTIFIER,
@ResultCode_86db0362 NVARCHAR(255),
@IsSuccess_86db0362 BIT,
@Description_86db0362 NVARCHAR(MAX)
SET
  @ID_86db0362 = '5044A100-000B-4000-8000-0000000000C4'
SET
  @ActionID_86db0362 = '5044A100-000B-4000-8000-00000000000B'
SET
  @ResultCode_86db0362 = N'ERROR'
SET
  @IsSuccess_86db0362 = 0
SET
  @Description_86db0362 = N'Saving the model failed.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_86db0362)
EXEC [__mj].spCreateActionResultCode @ID = @ID_86db0362,
  @ActionID = @ActionID_86db0362,
  @ResultCode = @ResultCode_86db0362,
  @IsSuccess = @IsSuccess_86db0362,
  @Description = @Description_86db0362;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_ebe0ea5e UNIQUEIDENTIFIER,
@ActionID_ebe0ea5e UNIQUEIDENTIFIER,
@Name_ebe0ea5e NVARCHAR(255),
@DefaultValue_ebe0ea5e NVARCHAR(MAX),
@Type_ebe0ea5e NCHAR(10),
@ValueType_ebe0ea5e NVARCHAR(30),
@IsArray_ebe0ea5e BIT,
@Description_ebe0ea5e NVARCHAR(MAX),
@IsRequired_ebe0ea5e BIT,
@MediaModality_ebe0ea5e NVARCHAR(20)
SET
  @ID_ebe0ea5e = '5044A100-000C-4000-8000-0000000000A1'
SET
  @ActionID_ebe0ea5e = '5044A100-000C-4000-8000-000000000008'
SET
  @Name_ebe0ea5e = N'PromptName'
SET
  @Type_ebe0ea5e = N'Input'
SET
  @ValueType_ebe0ea5e = N'Scalar'
SET
  @IsArray_ebe0ea5e = 0
SET
  @Description_ebe0ea5e = N'The registered AIPrompt Name to read (e.g. a factor-action''s contract.promptName).'
SET
  @IsRequired_ebe0ea5e = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_ebe0ea5e)
EXEC [__mj].spCreateActionParam @ID = @ID_ebe0ea5e,
  @ActionID = @ActionID_ebe0ea5e,
  @Name = @Name_ebe0ea5e,
  @DefaultValue = @DefaultValue_ebe0ea5e,
  @DefaultValue_Clear = 1,
  @Type = @Type_ebe0ea5e,
  @ValueType = @ValueType_ebe0ea5e,
  @IsArray = @IsArray_ebe0ea5e,
  @Description = @Description_ebe0ea5e,
  @IsRequired = @IsRequired_ebe0ea5e,
  @MediaModality = @MediaModality_ebe0ea5e,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_7b39a6b8 UNIQUEIDENTIFIER,
@ActionID_7b39a6b8 UNIQUEIDENTIFIER,
@Name_7b39a6b8 NVARCHAR(255),
@DefaultValue_7b39a6b8 NVARCHAR(MAX),
@Type_7b39a6b8 NCHAR(10),
@ValueType_7b39a6b8 NVARCHAR(30),
@IsArray_7b39a6b8 BIT,
@Description_7b39a6b8 NVARCHAR(MAX),
@IsRequired_7b39a6b8 BIT,
@MediaModality_7b39a6b8 NVARCHAR(20)
SET
  @ID_7b39a6b8 = '5044A100-000C-4000-8000-0000000000A2'
SET
  @ActionID_7b39a6b8 = '5044A100-000C-4000-8000-000000000008'
SET
  @Name_7b39a6b8 = N'Result'
SET
  @Type_7b39a6b8 = N'Both'
SET
  @ValueType_7b39a6b8 = N'Scalar'
SET
  @IsArray_7b39a6b8 = 0
SET
  @Description_7b39a6b8 = N'JSON: { promptId, templateContentId, text } (or { error }).'
SET
  @IsRequired_7b39a6b8 = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_7b39a6b8)
EXEC [__mj].spCreateActionParam @ID = @ID_7b39a6b8,
  @ActionID = @ActionID_7b39a6b8,
  @Name = @Name_7b39a6b8,
  @DefaultValue = @DefaultValue_7b39a6b8,
  @DefaultValue_Clear = 1,
  @Type = @Type_7b39a6b8,
  @ValueType = @ValueType_7b39a6b8,
  @IsArray = @IsArray_7b39a6b8,
  @Description = @Description_7b39a6b8,
  @IsRequired = @IsRequired_7b39a6b8,
  @MediaModality = @MediaModality_7b39a6b8,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_2a4a1a01 UNIQUEIDENTIFIER,
@ActionID_2a4a1a01 UNIQUEIDENTIFIER,
@ResultCode_2a4a1a01 NVARCHAR(255),
@IsSuccess_2a4a1a01 BIT,
@Description_2a4a1a01 NVARCHAR(MAX)
SET
  @ID_2a4a1a01 = '5044A100-000C-4000-8000-0000000000C1'
SET
  @ActionID_2a4a1a01 = '5044A100-000C-4000-8000-000000000008'
SET
  @ResultCode_2a4a1a01 = N'SUCCESS'
SET
  @IsSuccess_2a4a1a01 = 1
SET
  @Description_2a4a1a01 = N'Prompt text returned.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_2a4a1a01)
EXEC [__mj].spCreateActionResultCode @ID = @ID_2a4a1a01,
  @ActionID = @ActionID_2a4a1a01,
  @ResultCode = @ResultCode_2a4a1a01,
  @IsSuccess = @IsSuccess_2a4a1a01,
  @Description = @Description_2a4a1a01;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_94747f5d UNIQUEIDENTIFIER,
@ActionID_94747f5d UNIQUEIDENTIFIER,
@ResultCode_94747f5d NVARCHAR(255),
@IsSuccess_94747f5d BIT,
@Description_94747f5d NVARCHAR(MAX)
SET
  @ID_94747f5d = '5044A100-000C-4000-8000-0000000000C2'
SET
  @ActionID_94747f5d = '5044A100-000C-4000-8000-000000000008'
SET
  @ResultCode_94747f5d = N'VALIDATION_ERROR'
SET
  @IsSuccess_94747f5d = 0
SET
  @Description_94747f5d = N'PromptName was missing.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_94747f5d)
EXEC [__mj].spCreateActionResultCode @ID = @ID_94747f5d,
  @ActionID = @ActionID_94747f5d,
  @ResultCode = @ResultCode_94747f5d,
  @IsSuccess = @IsSuccess_94747f5d,
  @Description = @Description_94747f5d;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_921f6ff0 UNIQUEIDENTIFIER,
@ActionID_921f6ff0 UNIQUEIDENTIFIER,
@ResultCode_921f6ff0 NVARCHAR(255),
@IsSuccess_921f6ff0 BIT,
@Description_921f6ff0 NVARCHAR(MAX)
SET
  @ID_921f6ff0 = '5044A100-000C-4000-8000-0000000000C3'
SET
  @ActionID_921f6ff0 = '5044A100-000C-4000-8000-000000000008'
SET
  @ResultCode_921f6ff0 = N'ERROR'
SET
  @IsSuccess_921f6ff0 = 0
SET
  @Description_921f6ff0 = N'Failed to read the prompt.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_921f6ff0)
EXEC [__mj].spCreateActionResultCode @ID = @ID_921f6ff0,
  @ActionID = @ActionID_921f6ff0,
  @ResultCode = @ResultCode_921f6ff0,
  @IsSuccess = @IsSuccess_921f6ff0,
  @Description = @Description_921f6ff0;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_730edf12 UNIQUEIDENTIFIER,
@ActionID_730edf12 UNIQUEIDENTIFIER,
@Name_730edf12 NVARCHAR(255),
@DefaultValue_730edf12 NVARCHAR(MAX),
@Type_730edf12 NCHAR(10),
@ValueType_730edf12 NVARCHAR(30),
@IsArray_730edf12 BIT,
@Description_730edf12 NVARCHAR(MAX),
@IsRequired_730edf12 BIT,
@MediaModality_730edf12 NVARCHAR(20)
SET
  @ID_730edf12 = '5044A100-000D-4000-8000-0000000000A1'
SET
  @ActionID_730edf12 = '5044A100-000D-4000-8000-000000000009'
SET
  @Name_730edf12 = N'TemplateContentID'
SET
  @Type_730edf12 = N'Input'
SET
  @ValueType_730edf12 = N'Scalar'
SET
  @IsArray_730edf12 = 0
SET
  @Description_730edf12 = N'The MJ Template Content row id whose text to overwrite (from Sonar: Get Prompt).'
SET
  @IsRequired_730edf12 = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_730edf12)
EXEC [__mj].spCreateActionParam @ID = @ID_730edf12,
  @ActionID = @ActionID_730edf12,
  @Name = @Name_730edf12,
  @DefaultValue = @DefaultValue_730edf12,
  @DefaultValue_Clear = 1,
  @Type = @Type_730edf12,
  @ValueType = @ValueType_730edf12,
  @IsArray = @IsArray_730edf12,
  @Description = @Description_730edf12,
  @IsRequired = @IsRequired_730edf12,
  @MediaModality = @MediaModality_730edf12,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_47e31f85 UNIQUEIDENTIFIER,
@ActionID_47e31f85 UNIQUEIDENTIFIER,
@Name_47e31f85 NVARCHAR(255),
@DefaultValue_47e31f85 NVARCHAR(MAX),
@Type_47e31f85 NCHAR(10),
@ValueType_47e31f85 NVARCHAR(30),
@IsArray_47e31f85 BIT,
@Description_47e31f85 NVARCHAR(MAX),
@IsRequired_47e31f85 BIT,
@MediaModality_47e31f85 NVARCHAR(20)
SET
  @ID_47e31f85 = '5044A100-000D-4000-8000-0000000000A2'
SET
  @ActionID_47e31f85 = '5044A100-000D-4000-8000-000000000009'
SET
  @Name_47e31f85 = N'Text'
SET
  @Type_47e31f85 = N'Input'
SET
  @ValueType_47e31f85 = N'Scalar'
SET
  @IsArray_47e31f85 = 0
SET
  @Description_47e31f85 = N'The new prompt text.'
SET
  @IsRequired_47e31f85 = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_47e31f85)
EXEC [__mj].spCreateActionParam @ID = @ID_47e31f85,
  @ActionID = @ActionID_47e31f85,
  @Name = @Name_47e31f85,
  @DefaultValue = @DefaultValue_47e31f85,
  @DefaultValue_Clear = 1,
  @Type = @Type_47e31f85,
  @ValueType = @ValueType_47e31f85,
  @IsArray = @IsArray_47e31f85,
  @Description = @Description_47e31f85,
  @IsRequired = @IsRequired_47e31f85,
  @MediaModality = @MediaModality_47e31f85,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_07e6bee6 UNIQUEIDENTIFIER,
@ActionID_07e6bee6 UNIQUEIDENTIFIER,
@Name_07e6bee6 NVARCHAR(255),
@DefaultValue_07e6bee6 NVARCHAR(MAX),
@Type_07e6bee6 NCHAR(10),
@ValueType_07e6bee6 NVARCHAR(30),
@IsArray_07e6bee6 BIT,
@Description_07e6bee6 NVARCHAR(MAX),
@IsRequired_07e6bee6 BIT,
@MediaModality_07e6bee6 NVARCHAR(20)
SET
  @ID_07e6bee6 = '5044A100-000D-4000-8000-0000000000A3'
SET
  @ActionID_07e6bee6 = '5044A100-000D-4000-8000-000000000009'
SET
  @Name_07e6bee6 = N'Result'
SET
  @Type_07e6bee6 = N'Both'
SET
  @ValueType_07e6bee6 = N'Scalar'
SET
  @IsArray_07e6bee6 = 0
SET
  @Description_07e6bee6 = N'JSON: { templateContentId, saved }.'
SET
  @IsRequired_07e6bee6 = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_07e6bee6)
EXEC [__mj].spCreateActionParam @ID = @ID_07e6bee6,
  @ActionID = @ActionID_07e6bee6,
  @Name = @Name_07e6bee6,
  @DefaultValue = @DefaultValue_07e6bee6,
  @DefaultValue_Clear = 1,
  @Type = @Type_07e6bee6,
  @ValueType = @ValueType_07e6bee6,
  @IsArray = @IsArray_07e6bee6,
  @Description = @Description_07e6bee6,
  @IsRequired = @IsRequired_07e6bee6,
  @MediaModality = @MediaModality_07e6bee6,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_0fb11d58 UNIQUEIDENTIFIER,
@ActionID_0fb11d58 UNIQUEIDENTIFIER,
@ResultCode_0fb11d58 NVARCHAR(255),
@IsSuccess_0fb11d58 BIT,
@Description_0fb11d58 NVARCHAR(MAX)
SET
  @ID_0fb11d58 = '5044A100-000D-4000-8000-0000000000C1'
SET
  @ActionID_0fb11d58 = '5044A100-000D-4000-8000-000000000009'
SET
  @ResultCode_0fb11d58 = N'SUCCESS'
SET
  @IsSuccess_0fb11d58 = 1
SET
  @Description_0fb11d58 = N'Prompt updated.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_0fb11d58)
EXEC [__mj].spCreateActionResultCode @ID = @ID_0fb11d58,
  @ActionID = @ActionID_0fb11d58,
  @ResultCode = @ResultCode_0fb11d58,
  @IsSuccess = @IsSuccess_0fb11d58,
  @Description = @Description_0fb11d58;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_cb3b6735 UNIQUEIDENTIFIER,
@ActionID_cb3b6735 UNIQUEIDENTIFIER,
@ResultCode_cb3b6735 NVARCHAR(255),
@IsSuccess_cb3b6735 BIT,
@Description_cb3b6735 NVARCHAR(MAX)
SET
  @ID_cb3b6735 = '5044A100-000D-4000-8000-0000000000C2'
SET
  @ActionID_cb3b6735 = '5044A100-000D-4000-8000-000000000009'
SET
  @ResultCode_cb3b6735 = N'VALIDATION_ERROR'
SET
  @IsSuccess_cb3b6735 = 0
SET
  @Description_cb3b6735 = N'TemplateContentID was missing.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_cb3b6735)
EXEC [__mj].spCreateActionResultCode @ID = @ID_cb3b6735,
  @ActionID = @ActionID_cb3b6735,
  @ResultCode = @ResultCode_cb3b6735,
  @IsSuccess = @IsSuccess_cb3b6735,
  @Description = @Description_cb3b6735;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_11ea8113 UNIQUEIDENTIFIER,
@ActionID_11ea8113 UNIQUEIDENTIFIER,
@ResultCode_11ea8113 NVARCHAR(255),
@IsSuccess_11ea8113 BIT,
@Description_11ea8113 NVARCHAR(MAX)
SET
  @ID_11ea8113 = '5044A100-000D-4000-8000-0000000000C3'
SET
  @ActionID_11ea8113 = '5044A100-000D-4000-8000-000000000009'
SET
  @ResultCode_11ea8113 = N'NOT_FOUND'
SET
  @IsSuccess_11ea8113 = 0
SET
  @Description_11ea8113 = N'Template content row not found.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_11ea8113)
EXEC [__mj].spCreateActionResultCode @ID = @ID_11ea8113,
  @ActionID = @ActionID_11ea8113,
  @ResultCode = @ResultCode_11ea8113,
  @IsSuccess = @IsSuccess_11ea8113,
  @Description = @Description_11ea8113;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_550795ae UNIQUEIDENTIFIER,
@ActionID_550795ae UNIQUEIDENTIFIER,
@ResultCode_550795ae NVARCHAR(255),
@IsSuccess_550795ae BIT,
@Description_550795ae NVARCHAR(MAX)
SET
  @ID_550795ae = '5044A100-000D-4000-8000-0000000000C4'
SET
  @ActionID_550795ae = '5044A100-000D-4000-8000-000000000009'
SET
  @ResultCode_550795ae = N'ERROR'
SET
  @IsSuccess_550795ae = 0
SET
  @Description_550795ae = N'Failed to save the prompt.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_550795ae)
EXEC [__mj].spCreateActionResultCode @ID = @ID_550795ae,
  @ActionID = @ActionID_550795ae,
  @ResultCode = @ResultCode_550795ae,
  @IsSuccess = @IsSuccess_550795ae,
  @Description = @Description_550795ae;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_81e030b0 UNIQUEIDENTIFIER,
@ActionID_81e030b0 UNIQUEIDENTIFIER,
@Name_81e030b0 NVARCHAR(255),
@DefaultValue_81e030b0 NVARCHAR(MAX),
@Type_81e030b0 NCHAR(10),
@ValueType_81e030b0 NVARCHAR(30),
@IsArray_81e030b0 BIT,
@Description_81e030b0 NVARCHAR(MAX),
@IsRequired_81e030b0 BIT,
@MediaModality_81e030b0 NVARCHAR(20)
SET
  @ID_81e030b0 = '5044A100-000E-4000-8000-0000000000A1'
SET
  @ActionID_81e030b0 = '5044A100-000E-4000-8000-00000000000E'
SET
  @Name_81e030b0 = N'Prompt'
SET
  @Type_81e030b0 = N'Input'
SET
  @ValueType_81e030b0 = N'Scalar'
SET
  @IsArray_81e030b0 = 0
SET
  @Description_81e030b0 = N'The natural-language instruction for the authoring agent.'
SET
  @IsRequired_81e030b0 = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_81e030b0)
EXEC [__mj].spCreateActionParam @ID = @ID_81e030b0,
  @ActionID = @ActionID_81e030b0,
  @Name = @Name_81e030b0,
  @DefaultValue = @DefaultValue_81e030b0,
  @DefaultValue_Clear = 1,
  @Type = @Type_81e030b0,
  @ValueType = @ValueType_81e030b0,
  @IsArray = @IsArray_81e030b0,
  @Description = @Description_81e030b0,
  @IsRequired = @IsRequired_81e030b0,
  @MediaModality = @MediaModality_81e030b0,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_23a09cdb UNIQUEIDENTIFIER,
@ActionID_23a09cdb UNIQUEIDENTIFIER,
@Name_23a09cdb NVARCHAR(255),
@DefaultValue_23a09cdb NVARCHAR(MAX),
@Type_23a09cdb NCHAR(10),
@ValueType_23a09cdb NVARCHAR(30),
@IsArray_23a09cdb BIT,
@Description_23a09cdb NVARCHAR(MAX),
@IsRequired_23a09cdb BIT,
@MediaModality_23a09cdb NVARCHAR(20)
SET
  @ID_23a09cdb = '5044A100-000E-4000-8000-0000000000A2'
SET
  @ActionID_23a09cdb = '5044A100-000E-4000-8000-00000000000E'
SET
  @Name_23a09cdb = N'ContextNote'
SET
  @Type_23a09cdb = N'Input'
SET
  @ValueType_23a09cdb = N'Scalar'
SET
  @IsArray_23a09cdb = 0
SET
  @Description_23a09cdb = N'Optional context (e.g. the model the user is viewing), prepended to the prompt.'
SET
  @IsRequired_23a09cdb = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_23a09cdb)
EXEC [__mj].spCreateActionParam @ID = @ID_23a09cdb,
  @ActionID = @ActionID_23a09cdb,
  @Name = @Name_23a09cdb,
  @DefaultValue = @DefaultValue_23a09cdb,
  @DefaultValue_Clear = 1,
  @Type = @Type_23a09cdb,
  @ValueType = @ValueType_23a09cdb,
  @IsArray = @IsArray_23a09cdb,
  @Description = @Description_23a09cdb,
  @IsRequired = @IsRequired_23a09cdb,
  @MediaModality = @MediaModality_23a09cdb,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_31ecd17d UNIQUEIDENTIFIER,
@ActionID_31ecd17d UNIQUEIDENTIFIER,
@Name_31ecd17d NVARCHAR(255),
@DefaultValue_31ecd17d NVARCHAR(MAX),
@Type_31ecd17d NCHAR(10),
@ValueType_31ecd17d NVARCHAR(30),
@IsArray_31ecd17d BIT,
@Description_31ecd17d NVARCHAR(MAX),
@IsRequired_31ecd17d BIT,
@MediaModality_31ecd17d NVARCHAR(20)
SET
  @ID_31ecd17d = '5044A100-000E-4000-8000-0000000000A3'
SET
  @ActionID_31ecd17d = '5044A100-000E-4000-8000-00000000000E'
SET
  @Name_31ecd17d = N'Reply'
SET
  @Type_31ecd17d = N'Both'
SET
  @ValueType_31ecd17d = N'Scalar'
SET
  @IsArray_31ecd17d = 0
SET
  @Description_31ecd17d = N'The agent''s human-readable summary of what it built.'
SET
  @IsRequired_31ecd17d = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_31ecd17d)
EXEC [__mj].spCreateActionParam @ID = @ID_31ecd17d,
  @ActionID = @ActionID_31ecd17d,
  @Name = @Name_31ecd17d,
  @DefaultValue = @DefaultValue_31ecd17d,
  @DefaultValue_Clear = 1,
  @Type = @Type_31ecd17d,
  @ValueType = @ValueType_31ecd17d,
  @IsArray = @IsArray_31ecd17d,
  @Description = @Description_31ecd17d,
  @IsRequired = @IsRequired_31ecd17d,
  @MediaModality = @MediaModality_31ecd17d,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_ca245cb6 UNIQUEIDENTIFIER,
@ActionID_ca245cb6 UNIQUEIDENTIFIER,
@ResultCode_ca245cb6 NVARCHAR(255),
@IsSuccess_ca245cb6 BIT,
@Description_ca245cb6 NVARCHAR(MAX)
SET
  @ID_ca245cb6 = '5044A100-000E-4000-8000-0000000000C1'
SET
  @ActionID_ca245cb6 = '5044A100-000E-4000-8000-00000000000E'
SET
  @ResultCode_ca245cb6 = N'SUCCESS'
SET
  @IsSuccess_ca245cb6 = 1
SET
  @Description_ca245cb6 = N'Agent completed.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_ca245cb6)
EXEC [__mj].spCreateActionResultCode @ID = @ID_ca245cb6,
  @ActionID = @ActionID_ca245cb6,
  @ResultCode = @ResultCode_ca245cb6,
  @IsSuccess = @IsSuccess_ca245cb6,
  @Description = @Description_ca245cb6;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_189e9f23 UNIQUEIDENTIFIER,
@ActionID_189e9f23 UNIQUEIDENTIFIER,
@ResultCode_189e9f23 NVARCHAR(255),
@IsSuccess_189e9f23 BIT,
@Description_189e9f23 NVARCHAR(MAX)
SET
  @ID_189e9f23 = '5044A100-000E-4000-8000-0000000000C2'
SET
  @ActionID_189e9f23 = '5044A100-000E-4000-8000-00000000000E'
SET
  @ResultCode_189e9f23 = N'VALIDATION_ERROR'
SET
  @IsSuccess_189e9f23 = 0
SET
  @Description_189e9f23 = N'A required input was missing.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_189e9f23)
EXEC [__mj].spCreateActionResultCode @ID = @ID_189e9f23,
  @ActionID = @ActionID_189e9f23,
  @ResultCode = @ResultCode_189e9f23,
  @IsSuccess = @IsSuccess_189e9f23,
  @Description = @Description_189e9f23;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_213dbf3f UNIQUEIDENTIFIER,
@ActionID_213dbf3f UNIQUEIDENTIFIER,
@ResultCode_213dbf3f NVARCHAR(255),
@IsSuccess_213dbf3f BIT,
@Description_213dbf3f NVARCHAR(MAX)
SET
  @ID_213dbf3f = '5044A100-000E-4000-8000-0000000000C3'
SET
  @ActionID_213dbf3f = '5044A100-000E-4000-8000-00000000000E'
SET
  @ResultCode_213dbf3f = N'NOT_FOUND'
SET
  @IsSuccess_213dbf3f = 0
SET
  @Description_213dbf3f = N'The authoring agent was not found.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_213dbf3f)
EXEC [__mj].spCreateActionResultCode @ID = @ID_213dbf3f,
  @ActionID = @ActionID_213dbf3f,
  @ResultCode = @ResultCode_213dbf3f,
  @IsSuccess = @IsSuccess_213dbf3f,
  @Description = @Description_213dbf3f;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_c5c8764b UNIQUEIDENTIFIER,
@ActionID_c5c8764b UNIQUEIDENTIFIER,
@ResultCode_c5c8764b NVARCHAR(255),
@IsSuccess_c5c8764b BIT,
@Description_c5c8764b NVARCHAR(MAX)
SET
  @ID_c5c8764b = '5044A100-000E-4000-8000-0000000000C4'
SET
  @ActionID_c5c8764b = '5044A100-000E-4000-8000-00000000000E'
SET
  @ResultCode_c5c8764b = N'ERROR'
SET
  @IsSuccess_c5c8764b = 0
SET
  @Description_c5c8764b = N'The agent run failed.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_c5c8764b)
EXEC [__mj].spCreateActionResultCode @ID = @ID_c5c8764b,
  @ActionID = @ActionID_c5c8764b,
  @ResultCode = @ResultCode_c5c8764b,
  @IsSuccess = @IsSuccess_c5c8764b,
  @Description = @Description_c5c8764b;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_182c6542 UNIQUEIDENTIFIER,
@ActionID_182c6542 UNIQUEIDENTIFIER,
@Name_182c6542 NVARCHAR(255),
@DefaultValue_182c6542 NVARCHAR(MAX),
@Type_182c6542 NCHAR(10),
@ValueType_182c6542 NVARCHAR(30),
@IsArray_182c6542 BIT,
@Description_182c6542 NVARCHAR(MAX),
@IsRequired_182c6542 BIT,
@MediaModality_182c6542 NVARCHAR(20)
SET
  @ID_182c6542 = '5044A100-000F-4000-8000-0000000000A1'
SET
  @ActionID_182c6542 = '5044A100-000F-4000-8000-00000000000F'
SET
  @Name_182c6542 = N'Spec'
SET
  @Type_182c6542 = N'Input'
SET
  @ValueType_182c6542 = N'Scalar'
SET
  @IsArray_182c6542 = 0
SET
  @Description_182c6542 = N'JSON BuildModelSpec: { name, anchorEntityID, sources:[{relatedEntityID, alias, relationshipPath?}], factors:[{name, sourceAlias, aggregation, aggregateFieldName?, filterExpression?, timeWindowID?, dateField?, normalizationMethod?, higherIsBetter?, weight?, weightMode?}], bandSetId? }.'
SET
  @IsRequired_182c6542 = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_182c6542)
EXEC [__mj].spCreateActionParam @ID = @ID_182c6542,
  @ActionID = @ActionID_182c6542,
  @Name = @Name_182c6542,
  @DefaultValue = @DefaultValue_182c6542,
  @DefaultValue_Clear = 1,
  @Type = @Type_182c6542,
  @ValueType = @ValueType_182c6542,
  @IsArray = @IsArray_182c6542,
  @Description = @Description_182c6542,
  @IsRequired = @IsRequired_182c6542,
  @MediaModality = @MediaModality_182c6542,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_55f7d5cf UNIQUEIDENTIFIER,
@ActionID_55f7d5cf UNIQUEIDENTIFIER,
@Name_55f7d5cf NVARCHAR(255),
@DefaultValue_55f7d5cf NVARCHAR(MAX),
@Type_55f7d5cf NCHAR(10),
@ValueType_55f7d5cf NVARCHAR(30),
@IsArray_55f7d5cf BIT,
@Description_55f7d5cf NVARCHAR(MAX),
@IsRequired_55f7d5cf BIT,
@MediaModality_55f7d5cf NVARCHAR(20)
SET
  @ID_55f7d5cf = '5044A100-000F-4000-8000-0000000000A2'
SET
  @ActionID_55f7d5cf = '5044A100-000F-4000-8000-00000000000F'
SET
  @Name_55f7d5cf = N'Result'
SET
  @Type_55f7d5cf = N'Both'
SET
  @ValueType_55f7d5cf = N'Scalar'
SET
  @IsArray_55f7d5cf = 0
SET
  @Description_55f7d5cf = N'JSON: { modelID, sources:{alias→id}, factors:[id], bandSetAttached }.'
SET
  @IsRequired_55f7d5cf = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_55f7d5cf)
EXEC [__mj].spCreateActionParam @ID = @ID_55f7d5cf,
  @ActionID = @ActionID_55f7d5cf,
  @Name = @Name_55f7d5cf,
  @DefaultValue = @DefaultValue_55f7d5cf,
  @DefaultValue_Clear = 1,
  @Type = @Type_55f7d5cf,
  @ValueType = @ValueType_55f7d5cf,
  @IsArray = @IsArray_55f7d5cf,
  @Description = @Description_55f7d5cf,
  @IsRequired = @IsRequired_55f7d5cf,
  @MediaModality = @MediaModality_55f7d5cf,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_82b6cada UNIQUEIDENTIFIER,
@ActionID_82b6cada UNIQUEIDENTIFIER,
@ResultCode_82b6cada NVARCHAR(255),
@IsSuccess_82b6cada BIT,
@Description_82b6cada NVARCHAR(MAX)
SET
  @ID_82b6cada = '5044A100-000F-4000-8000-0000000000C1'
SET
  @ActionID_82b6cada = '5044A100-000F-4000-8000-00000000000F'
SET
  @ResultCode_82b6cada = N'SUCCESS'
SET
  @IsSuccess_82b6cada = 1
SET
  @Description_82b6cada = N'Draft model built.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_82b6cada)
EXEC [__mj].spCreateActionResultCode @ID = @ID_82b6cada,
  @ActionID = @ActionID_82b6cada,
  @ResultCode = @ResultCode_82b6cada,
  @IsSuccess = @IsSuccess_82b6cada,
  @Description = @Description_82b6cada;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_63eef9d6 UNIQUEIDENTIFIER,
@ActionID_63eef9d6 UNIQUEIDENTIFIER,
@ResultCode_63eef9d6 NVARCHAR(255),
@IsSuccess_63eef9d6 BIT,
@Description_63eef9d6 NVARCHAR(MAX)
SET
  @ID_63eef9d6 = '5044A100-000F-4000-8000-0000000000C2'
SET
  @ActionID_63eef9d6 = '5044A100-000F-4000-8000-00000000000F'
SET
  @ResultCode_63eef9d6 = N'VALIDATION_ERROR'
SET
  @IsSuccess_63eef9d6 = 0
SET
  @Description_63eef9d6 = N'Spec missing required fields.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_63eef9d6)
EXEC [__mj].spCreateActionResultCode @ID = @ID_63eef9d6,
  @ActionID = @ActionID_63eef9d6,
  @ResultCode = @ResultCode_63eef9d6,
  @IsSuccess = @IsSuccess_63eef9d6,
  @Description = @Description_63eef9d6;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_2d571076 UNIQUEIDENTIFIER,
@ActionID_2d571076 UNIQUEIDENTIFIER,
@ResultCode_2d571076 NVARCHAR(255),
@IsSuccess_2d571076 BIT,
@Description_2d571076 NVARCHAR(MAX)
SET
  @ID_2d571076 = '5044A100-000F-4000-8000-0000000000C3'
SET
  @ActionID_2d571076 = '5044A100-000F-4000-8000-00000000000F'
SET
  @ResultCode_2d571076 = N'ERROR'
SET
  @IsSuccess_2d571076 = 0
SET
  @Description_2d571076 = N'A step failed; the partial draft is reported.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_2d571076)
EXEC [__mj].spCreateActionResultCode @ID = @ID_2d571076,
  @ActionID = @ActionID_2d571076,
  @ResultCode = @ResultCode_2d571076,
  @IsSuccess = @IsSuccess_2d571076,
  @Description = @Description_2d571076;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_f1184999 UNIQUEIDENTIFIER,
@ActionID_f1184999 UNIQUEIDENTIFIER,
@Name_f1184999 NVARCHAR(255),
@DefaultValue_f1184999 NVARCHAR(MAX),
@Type_f1184999 NCHAR(10),
@ValueType_f1184999 NVARCHAR(30),
@IsArray_f1184999 BIT,
@Description_f1184999 NVARCHAR(MAX),
@IsRequired_f1184999 BIT,
@MediaModality_f1184999 NVARCHAR(20)
SET
  @ID_f1184999 = '5044A100-0010-4000-8000-0000000000A1'
SET
  @ActionID_f1184999 = '5044A100-0010-4000-8000-000000000010'
SET
  @Name_f1184999 = N'ModelID'
SET
  @Type_f1184999 = N'Input'
SET
  @ValueType_f1184999 = N'Scalar'
SET
  @IsArray_f1184999 = 0
SET
  @Description_f1184999 = N'The ScoreModel ID to describe (preferred). Provide this or Name.'
SET
  @IsRequired_f1184999 = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_f1184999)
EXEC [__mj].spCreateActionParam @ID = @ID_f1184999,
  @ActionID = @ActionID_f1184999,
  @Name = @Name_f1184999,
  @DefaultValue = @DefaultValue_f1184999,
  @DefaultValue_Clear = 1,
  @Type = @Type_f1184999,
  @ValueType = @ValueType_f1184999,
  @IsArray = @IsArray_f1184999,
  @Description = @Description_f1184999,
  @IsRequired = @IsRequired_f1184999,
  @MediaModality = @MediaModality_f1184999,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_d53ca87f UNIQUEIDENTIFIER,
@ActionID_d53ca87f UNIQUEIDENTIFIER,
@Name_d53ca87f NVARCHAR(255),
@DefaultValue_d53ca87f NVARCHAR(MAX),
@Type_d53ca87f NCHAR(10),
@ValueType_d53ca87f NVARCHAR(30),
@IsArray_d53ca87f BIT,
@Description_d53ca87f NVARCHAR(MAX),
@IsRequired_d53ca87f BIT,
@MediaModality_d53ca87f NVARCHAR(20)
SET
  @ID_d53ca87f = '5044A100-0010-4000-8000-0000000000A2'
SET
  @ActionID_d53ca87f = '5044A100-0010-4000-8000-000000000010'
SET
  @Name_d53ca87f = N'Name'
SET
  @Type_d53ca87f = N'Input'
SET
  @ValueType_d53ca87f = N'Scalar'
SET
  @IsArray_d53ca87f = 0
SET
  @Description_d53ca87f = N'The exact model name to describe (used when ModelID is absent).'
SET
  @IsRequired_d53ca87f = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_d53ca87f)
EXEC [__mj].spCreateActionParam @ID = @ID_d53ca87f,
  @ActionID = @ActionID_d53ca87f,
  @Name = @Name_d53ca87f,
  @DefaultValue = @DefaultValue_d53ca87f,
  @DefaultValue_Clear = 1,
  @Type = @Type_d53ca87f,
  @ValueType = @ValueType_d53ca87f,
  @IsArray = @IsArray_d53ca87f,
  @Description = @Description_d53ca87f,
  @IsRequired = @IsRequired_d53ca87f,
  @MediaModality = @MediaModality_d53ca87f,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_6860a3c1 UNIQUEIDENTIFIER,
@ActionID_6860a3c1 UNIQUEIDENTIFIER,
@Name_6860a3c1 NVARCHAR(255),
@DefaultValue_6860a3c1 NVARCHAR(MAX),
@Type_6860a3c1 NCHAR(10),
@ValueType_6860a3c1 NVARCHAR(30),
@IsArray_6860a3c1 BIT,
@Description_6860a3c1 NVARCHAR(MAX),
@IsRequired_6860a3c1 BIT,
@MediaModality_6860a3c1 NVARCHAR(20)
SET
  @ID_6860a3c1 = '5044A100-0010-4000-8000-0000000000A3'
SET
  @ActionID_6860a3c1 = '5044A100-0010-4000-8000-000000000010'
SET
  @Name_6860a3c1 = N'Result'
SET
  @Type_6860a3c1 = N'Both'
SET
  @ValueType_6860a3c1 = N'Scalar'
SET
  @IsArray_6860a3c1 = 0
SET
  @Description_6860a3c1 = N'JSON ModelDescription: { modelID, name, status, anchorEntityID, anchorEntityName, bandSet, sources[], factors[] }.'
SET
  @IsRequired_6860a3c1 = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_6860a3c1)
EXEC [__mj].spCreateActionParam @ID = @ID_6860a3c1,
  @ActionID = @ActionID_6860a3c1,
  @Name = @Name_6860a3c1,
  @DefaultValue = @DefaultValue_6860a3c1,
  @DefaultValue_Clear = 1,
  @Type = @Type_6860a3c1,
  @ValueType = @ValueType_6860a3c1,
  @IsArray = @IsArray_6860a3c1,
  @Description = @Description_6860a3c1,
  @IsRequired = @IsRequired_6860a3c1,
  @MediaModality = @MediaModality_6860a3c1,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_f3064c8a UNIQUEIDENTIFIER,
@ActionID_f3064c8a UNIQUEIDENTIFIER,
@ResultCode_f3064c8a NVARCHAR(255),
@IsSuccess_f3064c8a BIT,
@Description_f3064c8a NVARCHAR(MAX)
SET
  @ID_f3064c8a = '5044A100-0010-4000-8000-0000000000C1'
SET
  @ActionID_f3064c8a = '5044A100-0010-4000-8000-000000000010'
SET
  @ResultCode_f3064c8a = N'SUCCESS'
SET
  @IsSuccess_f3064c8a = 1
SET
  @Description_f3064c8a = N'Model described.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_f3064c8a)
EXEC [__mj].spCreateActionResultCode @ID = @ID_f3064c8a,
  @ActionID = @ActionID_f3064c8a,
  @ResultCode = @ResultCode_f3064c8a,
  @IsSuccess = @IsSuccess_f3064c8a,
  @Description = @Description_f3064c8a;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_a8d3ed4b UNIQUEIDENTIFIER,
@ActionID_a8d3ed4b UNIQUEIDENTIFIER,
@ResultCode_a8d3ed4b NVARCHAR(255),
@IsSuccess_a8d3ed4b BIT,
@Description_a8d3ed4b NVARCHAR(MAX)
SET
  @ID_a8d3ed4b = '5044A100-0010-4000-8000-0000000000C2'
SET
  @ActionID_a8d3ed4b = '5044A100-0010-4000-8000-000000000010'
SET
  @ResultCode_a8d3ed4b = N'VALIDATION_ERROR'
SET
  @IsSuccess_a8d3ed4b = 0
SET
  @Description_a8d3ed4b = N'Neither ModelID nor Name was provided.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_a8d3ed4b)
EXEC [__mj].spCreateActionResultCode @ID = @ID_a8d3ed4b,
  @ActionID = @ActionID_a8d3ed4b,
  @ResultCode = @ResultCode_a8d3ed4b,
  @IsSuccess = @IsSuccess_a8d3ed4b,
  @Description = @Description_a8d3ed4b;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_0d0d7e11 UNIQUEIDENTIFIER,
@ActionID_0d0d7e11 UNIQUEIDENTIFIER,
@ResultCode_0d0d7e11 NVARCHAR(255),
@IsSuccess_0d0d7e11 BIT,
@Description_0d0d7e11 NVARCHAR(MAX)
SET
  @ID_0d0d7e11 = '5044A100-0010-4000-8000-0000000000C3'
SET
  @ActionID_0d0d7e11 = '5044A100-0010-4000-8000-000000000010'
SET
  @ResultCode_0d0d7e11 = N'NOT_FOUND'
SET
  @IsSuccess_0d0d7e11 = 0
SET
  @Description_0d0d7e11 = N'No model matched the given ID or name.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_0d0d7e11)
EXEC [__mj].spCreateActionResultCode @ID = @ID_0d0d7e11,
  @ActionID = @ActionID_0d0d7e11,
  @ResultCode = @ResultCode_0d0d7e11,
  @IsSuccess = @IsSuccess_0d0d7e11,
  @Description = @Description_0d0d7e11;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_0fb5d124 UNIQUEIDENTIFIER,
@ActionID_0fb5d124 UNIQUEIDENTIFIER,
@ResultCode_0fb5d124 NVARCHAR(255),
@IsSuccess_0fb5d124 BIT,
@Description_0fb5d124 NVARCHAR(MAX)
SET
  @ID_0fb5d124 = '5044A100-0010-4000-8000-0000000000C4'
SET
  @ActionID_0fb5d124 = '5044A100-0010-4000-8000-000000000010'
SET
  @ResultCode_0fb5d124 = N'ERROR'
SET
  @IsSuccess_0fb5d124 = 0
SET
  @Description_0fb5d124 = N'An unexpected error occurred while reading the model.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_0fb5d124)
EXEC [__mj].spCreateActionResultCode @ID = @ID_0fb5d124,
  @ActionID = @ActionID_0fb5d124,
  @ResultCode = @ResultCode_0fb5d124,
  @IsSuccess = @IsSuccess_0fb5d124,
  @Description = @Description_0fb5d124;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_c67c1a19 UNIQUEIDENTIFIER,
@ActionID_c67c1a19 UNIQUEIDENTIFIER,
@Name_c67c1a19 NVARCHAR(255),
@DefaultValue_c67c1a19 NVARCHAR(MAX),
@Type_c67c1a19 NCHAR(10),
@ValueType_c67c1a19 NVARCHAR(30),
@IsArray_c67c1a19 BIT,
@Description_c67c1a19 NVARCHAR(MAX),
@IsRequired_c67c1a19 BIT,
@MediaModality_c67c1a19 NVARCHAR(20)
SET
  @ID_c67c1a19 = '5044A100-0011-4000-8000-0000000000A1'
SET
  @ActionID_c67c1a19 = '5044A100-0011-4000-8000-000000000011'
SET
  @Name_c67c1a19 = N'AnchorEntityID'
SET
  @Type_c67c1a19 = N'Input'
SET
  @ValueType_c67c1a19 = N'Scalar'
SET
  @IsArray_c67c1a19 = 0
SET
  @Description_c67c1a19 = N'The anchor entity ID to find joinable business sources for.'
SET
  @IsRequired_c67c1a19 = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_c67c1a19)
EXEC [__mj].spCreateActionParam @ID = @ID_c67c1a19,
  @ActionID = @ActionID_c67c1a19,
  @Name = @Name_c67c1a19,
  @DefaultValue = @DefaultValue_c67c1a19,
  @DefaultValue_Clear = 1,
  @Type = @Type_c67c1a19,
  @ValueType = @ValueType_c67c1a19,
  @IsArray = @IsArray_c67c1a19,
  @Description = @Description_c67c1a19,
  @IsRequired = @IsRequired_c67c1a19,
  @MediaModality = @MediaModality_c67c1a19,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_d9744c0f UNIQUEIDENTIFIER,
@ActionID_d9744c0f UNIQUEIDENTIFIER,
@Name_d9744c0f NVARCHAR(255),
@DefaultValue_d9744c0f NVARCHAR(MAX),
@Type_d9744c0f NCHAR(10),
@ValueType_d9744c0f NVARCHAR(30),
@IsArray_d9744c0f BIT,
@Description_d9744c0f NVARCHAR(MAX),
@IsRequired_d9744c0f BIT,
@MediaModality_d9744c0f NVARCHAR(20)
SET
  @ID_d9744c0f = '5044A100-0011-4000-8000-0000000000A2'
SET
  @ActionID_d9744c0f = '5044A100-0011-4000-8000-000000000011'
SET
  @Name_d9744c0f = N'Result'
SET
  @Type_d9744c0f = N'Both'
SET
  @ValueType_d9744c0f = N'Scalar'
SET
  @IsArray_d9744c0f = 0
SET
  @Description_d9744c0f = N'JSON: { anchorEntityID, anchorEntityName, related: [{ entityID, entityName, schemaName, viaField }] }.'
SET
  @IsRequired_d9744c0f = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_d9744c0f)
EXEC [__mj].spCreateActionParam @ID = @ID_d9744c0f,
  @ActionID = @ActionID_d9744c0f,
  @Name = @Name_d9744c0f,
  @DefaultValue = @DefaultValue_d9744c0f,
  @DefaultValue_Clear = 1,
  @Type = @Type_d9744c0f,
  @ValueType = @ValueType_d9744c0f,
  @IsArray = @IsArray_d9744c0f,
  @Description = @Description_d9744c0f,
  @IsRequired = @IsRequired_d9744c0f,
  @MediaModality = @MediaModality_d9744c0f,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_8939fc05 UNIQUEIDENTIFIER,
@ActionID_8939fc05 UNIQUEIDENTIFIER,
@ResultCode_8939fc05 NVARCHAR(255),
@IsSuccess_8939fc05 BIT,
@Description_8939fc05 NVARCHAR(MAX)
SET
  @ID_8939fc05 = '5044A100-0011-4000-8000-0000000000C1'
SET
  @ActionID_8939fc05 = '5044A100-0011-4000-8000-000000000011'
SET
  @ResultCode_8939fc05 = N'SUCCESS'
SET
  @IsSuccess_8939fc05 = 1
SET
  @Description_8939fc05 = N'Related business entities listed.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_8939fc05)
EXEC [__mj].spCreateActionResultCode @ID = @ID_8939fc05,
  @ActionID = @ActionID_8939fc05,
  @ResultCode = @ResultCode_8939fc05,
  @IsSuccess = @IsSuccess_8939fc05,
  @Description = @Description_8939fc05;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_ed038967 UNIQUEIDENTIFIER,
@ActionID_ed038967 UNIQUEIDENTIFIER,
@ResultCode_ed038967 NVARCHAR(255),
@IsSuccess_ed038967 BIT,
@Description_ed038967 NVARCHAR(MAX)
SET
  @ID_ed038967 = '5044A100-0011-4000-8000-0000000000C2'
SET
  @ActionID_ed038967 = '5044A100-0011-4000-8000-000000000011'
SET
  @ResultCode_ed038967 = N'VALIDATION_ERROR'
SET
  @IsSuccess_ed038967 = 0
SET
  @Description_ed038967 = N'AnchorEntityID was missing.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_ed038967)
EXEC [__mj].spCreateActionResultCode @ID = @ID_ed038967,
  @ActionID = @ActionID_ed038967,
  @ResultCode = @ResultCode_ed038967,
  @IsSuccess = @IsSuccess_ed038967,
  @Description = @Description_ed038967;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_593758aa UNIQUEIDENTIFIER,
@ActionID_593758aa UNIQUEIDENTIFIER,
@ResultCode_593758aa NVARCHAR(255),
@IsSuccess_593758aa BIT,
@Description_593758aa NVARCHAR(MAX)
SET
  @ID_593758aa = '5044A100-0011-4000-8000-0000000000C3'
SET
  @ActionID_593758aa = '5044A100-0011-4000-8000-000000000011'
SET
  @ResultCode_593758aa = N'NOT_FOUND'
SET
  @IsSuccess_593758aa = 0
SET
  @Description_593758aa = N'No entity matched the given anchor ID.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_593758aa)
EXEC [__mj].spCreateActionResultCode @ID = @ID_593758aa,
  @ActionID = @ActionID_593758aa,
  @ResultCode = @ResultCode_593758aa,
  @IsSuccess = @IsSuccess_593758aa,
  @Description = @Description_593758aa;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_ad11d881 UNIQUEIDENTIFIER,
@ActionID_ad11d881 UNIQUEIDENTIFIER,
@ResultCode_ad11d881 NVARCHAR(255),
@IsSuccess_ad11d881 BIT,
@Description_ad11d881 NVARCHAR(MAX)
SET
  @ID_ad11d881 = '5044A100-0011-4000-8000-0000000000C4'
SET
  @ActionID_ad11d881 = '5044A100-0011-4000-8000-000000000011'
SET
  @ResultCode_ad11d881 = N'ERROR'
SET
  @IsSuccess_ad11d881 = 0
SET
  @Description_ad11d881 = N'An unexpected error occurred while walking the entity graph.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_ad11d881)
EXEC [__mj].spCreateActionResultCode @ID = @ID_ad11d881,
  @ActionID = @ActionID_ad11d881,
  @ResultCode = @ResultCode_ad11d881,
  @IsSuccess = @IsSuccess_ad11d881,
  @Description = @Description_ad11d881;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_90827393 UNIQUEIDENTIFIER,
@ActionID_90827393 UNIQUEIDENTIFIER,
@Name_90827393 NVARCHAR(255),
@DefaultValue_90827393 NVARCHAR(MAX),
@Type_90827393 NCHAR(10),
@ValueType_90827393 NVARCHAR(30),
@IsArray_90827393 BIT,
@Description_90827393 NVARCHAR(MAX),
@IsRequired_90827393 BIT,
@MediaModality_90827393 NVARCHAR(20)
SET
  @ID_90827393 = '5044A100-0012-4000-8000-0000000000A1'
SET
  @ActionID_90827393 = '5044A100-0012-4000-8000-000000000012'
SET
  @Name_90827393 = N'Description'
SET
  @Type_90827393 = N'Input'
SET
  @ValueType_90827393 = N'Scalar'
SET
  @IsArray_90827393 = 0
SET
  @Description_90827393 = N'The signal to build, in plain English (e.g. ''longest streak of consecutive months with an event registration'').'
SET
  @IsRequired_90827393 = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_90827393)
EXEC [__mj].spCreateActionParam @ID = @ID_90827393,
  @ActionID = @ActionID_90827393,
  @Name = @Name_90827393,
  @DefaultValue = @DefaultValue_90827393,
  @DefaultValue_Clear = 1,
  @Type = @Type_90827393,
  @ValueType = @ValueType_90827393,
  @IsArray = @IsArray_90827393,
  @Description = @Description_90827393,
  @IsRequired = @IsRequired_90827393,
  @MediaModality = @MediaModality_90827393,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_50ea3ec0 UNIQUEIDENTIFIER,
@ActionID_50ea3ec0 UNIQUEIDENTIFIER,
@Name_50ea3ec0 NVARCHAR(255),
@DefaultValue_50ea3ec0 NVARCHAR(MAX),
@Type_50ea3ec0 NCHAR(10),
@ValueType_50ea3ec0 NVARCHAR(30),
@IsArray_50ea3ec0 BIT,
@Description_50ea3ec0 NVARCHAR(MAX),
@IsRequired_50ea3ec0 BIT,
@MediaModality_50ea3ec0 NVARCHAR(20)
SET
  @ID_50ea3ec0 = '5044A100-0012-4000-8000-0000000000A2'
SET
  @ActionID_50ea3ec0 = '5044A100-0012-4000-8000-000000000012'
SET
  @Name_50ea3ec0 = N'Context'
SET
  @Type_50ea3ec0 = N'Input'
SET
  @ValueType_50ea3ec0 = N'Scalar'
SET
  @IsArray_50ea3ec0 = 0
SET
  @Description_50ea3ec0 = N'Optional grounding: the anchor entity and available data sources, so the generated code targets real data.'
SET
  @IsRequired_50ea3ec0 = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_50ea3ec0)
EXEC [__mj].spCreateActionParam @ID = @ID_50ea3ec0,
  @ActionID = @ActionID_50ea3ec0,
  @Name = @Name_50ea3ec0,
  @DefaultValue = @DefaultValue_50ea3ec0,
  @DefaultValue_Clear = 1,
  @Type = @Type_50ea3ec0,
  @ValueType = @ValueType_50ea3ec0,
  @IsArray = @IsArray_50ea3ec0,
  @Description = @Description_50ea3ec0,
  @IsRequired = @IsRequired_50ea3ec0,
  @MediaModality = @MediaModality_50ea3ec0,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_e22b0dcd UNIQUEIDENTIFIER,
@ActionID_e22b0dcd UNIQUEIDENTIFIER,
@Name_e22b0dcd NVARCHAR(255),
@DefaultValue_e22b0dcd NVARCHAR(MAX),
@Type_e22b0dcd NCHAR(10),
@ValueType_e22b0dcd NVARCHAR(30),
@IsArray_e22b0dcd BIT,
@Description_e22b0dcd NVARCHAR(MAX),
@IsRequired_e22b0dcd BIT,
@MediaModality_e22b0dcd NVARCHAR(20)
SET
  @ID_e22b0dcd = '5044A100-0012-4000-8000-0000000000A3'
SET
  @ActionID_e22b0dcd = '5044A100-0012-4000-8000-000000000012'
SET
  @Name_e22b0dcd = N'Result'
SET
  @Type_e22b0dcd = N'Both'
SET
  @ValueType_e22b0dcd = N'Scalar'
SET
  @IsArray_e22b0dcd = 0
SET
  @Description_e22b0dcd = N'JSON: { actionId, approvalStatus, name, message }.'
SET
  @IsRequired_e22b0dcd = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_e22b0dcd)
EXEC [__mj].spCreateActionParam @ID = @ID_e22b0dcd,
  @ActionID = @ActionID_e22b0dcd,
  @Name = @Name_e22b0dcd,
  @DefaultValue = @DefaultValue_e22b0dcd,
  @DefaultValue_Clear = 1,
  @Type = @Type_e22b0dcd,
  @ValueType = @ValueType_e22b0dcd,
  @IsArray = @IsArray_e22b0dcd,
  @Description = @Description_e22b0dcd,
  @IsRequired = @IsRequired_e22b0dcd,
  @MediaModality = @MediaModality_e22b0dcd,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_a40172b3 UNIQUEIDENTIFIER,
@ActionID_a40172b3 UNIQUEIDENTIFIER,
@ResultCode_a40172b3 NVARCHAR(255),
@IsSuccess_a40172b3 BIT,
@Description_a40172b3 NVARCHAR(MAX)
SET
  @ID_a40172b3 = '5044A100-0012-4000-8000-0000000000C1'
SET
  @ActionID_a40172b3 = '5044A100-0012-4000-8000-000000000012'
SET
  @ResultCode_a40172b3 = N'SUCCESS'
SET
  @IsSuccess_a40172b3 = 1
SET
  @Description_a40172b3 = N'ActionSmith authored a Runtime factor-action (Pending approval).' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_a40172b3)
EXEC [__mj].spCreateActionResultCode @ID = @ID_a40172b3,
  @ActionID = @ActionID_a40172b3,
  @ResultCode = @ResultCode_a40172b3,
  @IsSuccess = @IsSuccess_a40172b3,
  @Description = @Description_a40172b3;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_5df5d6cd UNIQUEIDENTIFIER,
@ActionID_5df5d6cd UNIQUEIDENTIFIER,
@ResultCode_5df5d6cd NVARCHAR(255),
@IsSuccess_5df5d6cd BIT,
@Description_5df5d6cd NVARCHAR(MAX)
SET
  @ID_5df5d6cd = '5044A100-0012-4000-8000-0000000000C2'
SET
  @ActionID_5df5d6cd = '5044A100-0012-4000-8000-000000000012'
SET
  @ResultCode_5df5d6cd = N'VALIDATION_ERROR'
SET
  @IsSuccess_5df5d6cd = 0
SET
  @Description_5df5d6cd = N'Description was missing.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_5df5d6cd)
EXEC [__mj].spCreateActionResultCode @ID = @ID_5df5d6cd,
  @ActionID = @ActionID_5df5d6cd,
  @ResultCode = @ResultCode_5df5d6cd,
  @IsSuccess = @IsSuccess_5df5d6cd,
  @Description = @Description_5df5d6cd;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_185159c9 UNIQUEIDENTIFIER,
@ActionID_185159c9 UNIQUEIDENTIFIER,
@ResultCode_185159c9 NVARCHAR(255),
@IsSuccess_185159c9 BIT,
@Description_185159c9 NVARCHAR(MAX)
SET
  @ID_185159c9 = '5044A100-0012-4000-8000-0000000000C3'
SET
  @ActionID_185159c9 = '5044A100-0012-4000-8000-000000000012'
SET
  @ResultCode_185159c9 = N'NOT_FOUND'
SET
  @IsSuccess_185159c9 = 0
SET
  @Description_185159c9 = N'The ActionSmith agent is not present in this environment.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_185159c9)
EXEC [__mj].spCreateActionResultCode @ID = @ID_185159c9,
  @ActionID = @ActionID_185159c9,
  @ResultCode = @ResultCode_185159c9,
  @IsSuccess = @IsSuccess_185159c9,
  @Description = @Description_185159c9;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_a6382d48 UNIQUEIDENTIFIER,
@ActionID_a6382d48 UNIQUEIDENTIFIER,
@ResultCode_a6382d48 NVARCHAR(255),
@IsSuccess_a6382d48 BIT,
@Description_a6382d48 NVARCHAR(MAX)
SET
  @ID_a6382d48 = '5044A100-0012-4000-8000-0000000000C4'
SET
  @ActionID_a6382d48 = '5044A100-0012-4000-8000-000000000012'
SET
  @ResultCode_a6382d48 = N'ERROR'
SET
  @IsSuccess_a6382d48 = 0
SET
  @Description_a6382d48 = N'ActionSmith did not complete (or errored) — message carries the reason.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_a6382d48)
EXEC [__mj].spCreateActionResultCode @ID = @ID_a6382d48,
  @ActionID = @ActionID_a6382d48,
  @ResultCode = @ResultCode_a6382d48,
  @IsSuccess = @IsSuccess_a6382d48,
  @Description = @Description_a6382d48;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_1531693d UNIQUEIDENTIFIER,
@ActionID_1531693d UNIQUEIDENTIFIER,
@Name_1531693d NVARCHAR(255),
@DefaultValue_1531693d NVARCHAR(MAX),
@Type_1531693d NCHAR(10),
@ValueType_1531693d NVARCHAR(30),
@IsArray_1531693d BIT,
@Description_1531693d NVARCHAR(MAX),
@IsRequired_1531693d BIT,
@MediaModality_1531693d NVARCHAR(20)
SET
  @ID_1531693d = '5044A100-0013-4000-8000-0000000000A1'
SET
  @ActionID_1531693d = '5044A100-0013-4000-8000-000000000013'
SET
  @Name_1531693d = N'Description'
SET
  @Type_1531693d = N'Input'
SET
  @ValueType_1531693d = N'Scalar'
SET
  @IsArray_1531693d = 0
SET
  @Description_1531693d = N'The signal to build, in plain English.'
SET
  @IsRequired_1531693d = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_1531693d)
EXEC [__mj].spCreateActionParam @ID = @ID_1531693d,
  @ActionID = @ActionID_1531693d,
  @Name = @Name_1531693d,
  @DefaultValue = @DefaultValue_1531693d,
  @DefaultValue_Clear = 1,
  @Type = @Type_1531693d,
  @ValueType = @ValueType_1531693d,
  @IsArray = @IsArray_1531693d,
  @Description = @Description_1531693d,
  @IsRequired = @IsRequired_1531693d,
  @MediaModality = @MediaModality_1531693d,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_5b50038f UNIQUEIDENTIFIER,
@ActionID_5b50038f UNIQUEIDENTIFIER,
@Name_5b50038f NVARCHAR(255),
@DefaultValue_5b50038f NVARCHAR(MAX),
@Type_5b50038f NCHAR(10),
@ValueType_5b50038f NVARCHAR(30),
@IsArray_5b50038f BIT,
@Description_5b50038f NVARCHAR(MAX),
@IsRequired_5b50038f BIT,
@MediaModality_5b50038f NVARCHAR(20)
SET
  @ID_5b50038f = '5044A100-0013-4000-8000-0000000000A2'
SET
  @ActionID_5b50038f = '5044A100-0013-4000-8000-000000000013'
SET
  @Name_5b50038f = N'Context'
SET
  @Type_5b50038f = N'Input'
SET
  @ValueType_5b50038f = N'Scalar'
SET
  @IsArray_5b50038f = 0
SET
  @Description_5b50038f = N'Optional grounding: the anchor entity and available data sources.'
SET
  @IsRequired_5b50038f = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_5b50038f)
EXEC [__mj].spCreateActionParam @ID = @ID_5b50038f,
  @ActionID = @ActionID_5b50038f,
  @Name = @Name_5b50038f,
  @DefaultValue = @DefaultValue_5b50038f,
  @DefaultValue_Clear = 1,
  @Type = @Type_5b50038f,
  @ValueType = @ValueType_5b50038f,
  @IsArray = @IsArray_5b50038f,
  @Description = @Description_5b50038f,
  @IsRequired = @IsRequired_5b50038f,
  @MediaModality = @MediaModality_5b50038f,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_61ace377 UNIQUEIDENTIFIER,
@ActionID_61ace377 UNIQUEIDENTIFIER,
@Name_61ace377 NVARCHAR(255),
@DefaultValue_61ace377 NVARCHAR(MAX),
@Type_61ace377 NCHAR(10),
@ValueType_61ace377 NVARCHAR(30),
@IsArray_61ace377 BIT,
@Description_61ace377 NVARCHAR(MAX),
@IsRequired_61ace377 BIT,
@MediaModality_61ace377 NVARCHAR(20)
SET
  @ID_61ace377 = '5044A100-0013-4000-8000-0000000000A3'
SET
  @ActionID_61ace377 = '5044A100-0013-4000-8000-000000000013'
SET
  @Name_61ace377 = N'Result'
SET
  @Type_61ace377 = N'Both'
SET
  @ValueType_61ace377 = N'Scalar'
SET
  @IsArray_61ace377 = 0
SET
  @Description_61ace377 = N'JSON: { agentRunId } — poll AIAgentRun for status/result.'
SET
  @IsRequired_61ace377 = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_61ace377)
EXEC [__mj].spCreateActionParam @ID = @ID_61ace377,
  @ActionID = @ActionID_61ace377,
  @Name = @Name_61ace377,
  @DefaultValue = @DefaultValue_61ace377,
  @DefaultValue_Clear = 1,
  @Type = @Type_61ace377,
  @ValueType = @ValueType_61ace377,
  @IsArray = @IsArray_61ace377,
  @Description = @Description_61ace377,
  @IsRequired = @IsRequired_61ace377,
  @MediaModality = @MediaModality_61ace377,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_90fb96e8 UNIQUEIDENTIFIER,
@ActionID_90fb96e8 UNIQUEIDENTIFIER,
@ResultCode_90fb96e8 NVARCHAR(255),
@IsSuccess_90fb96e8 BIT,
@Description_90fb96e8 NVARCHAR(MAX)
SET
  @ID_90fb96e8 = '5044A100-0013-4000-8000-0000000000C1'
SET
  @ActionID_90fb96e8 = '5044A100-0013-4000-8000-000000000013'
SET
  @ResultCode_90fb96e8 = N'SUCCESS'
SET
  @IsSuccess_90fb96e8 = 1
SET
  @Description_90fb96e8 = N'Job started; AgentRunID returned.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_90fb96e8)
EXEC [__mj].spCreateActionResultCode @ID = @ID_90fb96e8,
  @ActionID = @ActionID_90fb96e8,
  @ResultCode = @ResultCode_90fb96e8,
  @IsSuccess = @IsSuccess_90fb96e8,
  @Description = @Description_90fb96e8;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_247431e7 UNIQUEIDENTIFIER,
@ActionID_247431e7 UNIQUEIDENTIFIER,
@ResultCode_247431e7 NVARCHAR(255),
@IsSuccess_247431e7 BIT,
@Description_247431e7 NVARCHAR(MAX)
SET
  @ID_247431e7 = '5044A100-0013-4000-8000-0000000000C2'
SET
  @ActionID_247431e7 = '5044A100-0013-4000-8000-000000000013'
SET
  @ResultCode_247431e7 = N'VALIDATION_ERROR'
SET
  @IsSuccess_247431e7 = 0
SET
  @Description_247431e7 = N'Description was missing.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_247431e7)
EXEC [__mj].spCreateActionResultCode @ID = @ID_247431e7,
  @ActionID = @ActionID_247431e7,
  @ResultCode = @ResultCode_247431e7,
  @IsSuccess = @IsSuccess_247431e7,
  @Description = @Description_247431e7;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_c95e9a6d UNIQUEIDENTIFIER,
@ActionID_c95e9a6d UNIQUEIDENTIFIER,
@ResultCode_c95e9a6d NVARCHAR(255),
@IsSuccess_c95e9a6d BIT,
@Description_c95e9a6d NVARCHAR(MAX)
SET
  @ID_c95e9a6d = '5044A100-0013-4000-8000-0000000000C3'
SET
  @ActionID_c95e9a6d = '5044A100-0013-4000-8000-000000000013'
SET
  @ResultCode_c95e9a6d = N'NOT_FOUND'
SET
  @IsSuccess_c95e9a6d = 0
SET
  @Description_c95e9a6d = N'ActionSmith agent not present in this environment.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_c95e9a6d)
EXEC [__mj].spCreateActionResultCode @ID = @ID_c95e9a6d,
  @ActionID = @ActionID_c95e9a6d,
  @ResultCode = @ResultCode_c95e9a6d,
  @IsSuccess = @IsSuccess_c95e9a6d,
  @Description = @Description_c95e9a6d;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_2f2da92a UNIQUEIDENTIFIER,
@ActionID_2f2da92a UNIQUEIDENTIFIER,
@ResultCode_2f2da92a NVARCHAR(255),
@IsSuccess_2f2da92a BIT,
@Description_2f2da92a NVARCHAR(MAX)
SET
  @ID_2f2da92a = '5044A100-0013-4000-8000-0000000000C4'
SET
  @ActionID_2f2da92a = '5044A100-0013-4000-8000-000000000013'
SET
  @ResultCode_2f2da92a = N'ERROR'
SET
  @IsSuccess_2f2da92a = 0
SET
  @Description_2f2da92a = N'The job didn''t start.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_2f2da92a)
EXEC [__mj].spCreateActionResultCode @ID = @ID_2f2da92a,
  @ActionID = @ActionID_2f2da92a,
  @ResultCode = @ResultCode_2f2da92a,
  @IsSuccess = @IsSuccess_2f2da92a,
  @Description = @Description_2f2da92a;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_1b535e6c UNIQUEIDENTIFIER,
@ActionID_1b535e6c UNIQUEIDENTIFIER,
@Name_1b535e6c NVARCHAR(255),
@DefaultValue_1b535e6c NVARCHAR(MAX),
@Type_1b535e6c NCHAR(10),
@ValueType_1b535e6c NVARCHAR(30),
@IsArray_1b535e6c BIT,
@Description_1b535e6c NVARCHAR(MAX),
@IsRequired_1b535e6c BIT,
@MediaModality_1b535e6c NVARCHAR(20)
SET
  @ID_1b535e6c = '5044A100-0014-4000-8000-0000000000A1'
SET
  @ActionID_1b535e6c = '5044A100-0014-4000-8000-000000000014'
SET
  @Name_1b535e6c = N'TargetActionID'
SET
  @Type_1b535e6c = N'Input'
SET
  @ValueType_1b535e6c = N'Scalar'
SET
  @IsArray_1b535e6c = 0
SET
  @Description_1b535e6c = N'The existing signal (Runtime action) to improve.'
SET
  @IsRequired_1b535e6c = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_1b535e6c)
EXEC [__mj].spCreateActionParam @ID = @ID_1b535e6c,
  @ActionID = @ActionID_1b535e6c,
  @Name = @Name_1b535e6c,
  @DefaultValue = @DefaultValue_1b535e6c,
  @DefaultValue_Clear = 1,
  @Type = @Type_1b535e6c,
  @ValueType = @ValueType_1b535e6c,
  @IsArray = @IsArray_1b535e6c,
  @Description = @Description_1b535e6c,
  @IsRequired = @IsRequired_1b535e6c,
  @MediaModality = @MediaModality_1b535e6c,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_a71baf22 UNIQUEIDENTIFIER,
@ActionID_a71baf22 UNIQUEIDENTIFIER,
@Name_a71baf22 NVARCHAR(255),
@DefaultValue_a71baf22 NVARCHAR(MAX),
@Type_a71baf22 NCHAR(10),
@ValueType_a71baf22 NVARCHAR(30),
@IsArray_a71baf22 BIT,
@Description_a71baf22 NVARCHAR(MAX),
@IsRequired_a71baf22 BIT,
@MediaModality_a71baf22 NVARCHAR(20)
SET
  @ID_a71baf22 = '5044A100-0014-4000-8000-0000000000A2'
SET
  @ActionID_a71baf22 = '5044A100-0014-4000-8000-000000000014'
SET
  @Name_a71baf22 = N'Feedback'
SET
  @Type_a71baf22 = N'Input'
SET
  @ValueType_a71baf22 = N'Scalar'
SET
  @IsArray_a71baf22 = 0
SET
  @Description_a71baf22 = N'What to change or improve, in plain English.'
SET
  @IsRequired_a71baf22 = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_a71baf22)
EXEC [__mj].spCreateActionParam @ID = @ID_a71baf22,
  @ActionID = @ActionID_a71baf22,
  @Name = @Name_a71baf22,
  @DefaultValue = @DefaultValue_a71baf22,
  @DefaultValue_Clear = 1,
  @Type = @Type_a71baf22,
  @ValueType = @ValueType_a71baf22,
  @IsArray = @IsArray_a71baf22,
  @Description = @Description_a71baf22,
  @IsRequired = @IsRequired_a71baf22,
  @MediaModality = @MediaModality_a71baf22,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_bf7c830d UNIQUEIDENTIFIER,
@ActionID_bf7c830d UNIQUEIDENTIFIER,
@Name_bf7c830d NVARCHAR(255),
@DefaultValue_bf7c830d NVARCHAR(MAX),
@Type_bf7c830d NCHAR(10),
@ValueType_bf7c830d NVARCHAR(30),
@IsArray_bf7c830d BIT,
@Description_bf7c830d NVARCHAR(MAX),
@IsRequired_bf7c830d BIT,
@MediaModality_bf7c830d NVARCHAR(20)
SET
  @ID_bf7c830d = '5044A100-0014-4000-8000-0000000000A3'
SET
  @ActionID_bf7c830d = '5044A100-0014-4000-8000-000000000014'
SET
  @Name_bf7c830d = N'Result'
SET
  @Type_bf7c830d = N'Both'
SET
  @ValueType_bf7c830d = N'Scalar'
SET
  @IsArray_bf7c830d = 0
SET
  @Description_bf7c830d = N'JSON: { agentRunId } — poll AIAgentRun for status; the signal updates in place when it completes.'
SET
  @IsRequired_bf7c830d = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_bf7c830d)
EXEC [__mj].spCreateActionParam @ID = @ID_bf7c830d,
  @ActionID = @ActionID_bf7c830d,
  @Name = @Name_bf7c830d,
  @DefaultValue = @DefaultValue_bf7c830d,
  @DefaultValue_Clear = 1,
  @Type = @Type_bf7c830d,
  @ValueType = @ValueType_bf7c830d,
  @IsArray = @IsArray_bf7c830d,
  @Description = @Description_bf7c830d,
  @IsRequired = @IsRequired_bf7c830d,
  @MediaModality = @MediaModality_bf7c830d,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_11833474 UNIQUEIDENTIFIER,
@ActionID_11833474 UNIQUEIDENTIFIER,
@ResultCode_11833474 NVARCHAR(255),
@IsSuccess_11833474 BIT,
@Description_11833474 NVARCHAR(MAX)
SET
  @ID_11833474 = '5044A100-0014-4000-8000-0000000000C1'
SET
  @ActionID_11833474 = '5044A100-0014-4000-8000-000000000014'
SET
  @ResultCode_11833474 = N'SUCCESS'
SET
  @IsSuccess_11833474 = 1
SET
  @Description_11833474 = N'Refine job started; AgentRunID returned.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_11833474)
EXEC [__mj].spCreateActionResultCode @ID = @ID_11833474,
  @ActionID = @ActionID_11833474,
  @ResultCode = @ResultCode_11833474,
  @IsSuccess = @IsSuccess_11833474,
  @Description = @Description_11833474;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_5a4daca9 UNIQUEIDENTIFIER,
@ActionID_5a4daca9 UNIQUEIDENTIFIER,
@ResultCode_5a4daca9 NVARCHAR(255),
@IsSuccess_5a4daca9 BIT,
@Description_5a4daca9 NVARCHAR(MAX)
SET
  @ID_5a4daca9 = '5044A100-0014-4000-8000-0000000000C2'
SET
  @ActionID_5a4daca9 = '5044A100-0014-4000-8000-000000000014'
SET
  @ResultCode_5a4daca9 = N'VALIDATION_ERROR'
SET
  @IsSuccess_5a4daca9 = 0
SET
  @Description_5a4daca9 = N'TargetActionID or Feedback was missing.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_5a4daca9)
EXEC [__mj].spCreateActionResultCode @ID = @ID_5a4daca9,
  @ActionID = @ActionID_5a4daca9,
  @ResultCode = @ResultCode_5a4daca9,
  @IsSuccess = @IsSuccess_5a4daca9,
  @Description = @Description_5a4daca9;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_80ae3c0b UNIQUEIDENTIFIER,
@ActionID_80ae3c0b UNIQUEIDENTIFIER,
@ResultCode_80ae3c0b NVARCHAR(255),
@IsSuccess_80ae3c0b BIT,
@Description_80ae3c0b NVARCHAR(MAX)
SET
  @ID_80ae3c0b = '5044A100-0014-4000-8000-0000000000C3'
SET
  @ActionID_80ae3c0b = '5044A100-0014-4000-8000-000000000014'
SET
  @ResultCode_80ae3c0b = N'NOT_FOUND'
SET
  @IsSuccess_80ae3c0b = 0
SET
  @Description_80ae3c0b = N'Target action or ActionSmith agent not found.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_80ae3c0b)
EXEC [__mj].spCreateActionResultCode @ID = @ID_80ae3c0b,
  @ActionID = @ActionID_80ae3c0b,
  @ResultCode = @ResultCode_80ae3c0b,
  @IsSuccess = @IsSuccess_80ae3c0b,
  @Description = @Description_80ae3c0b;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_b18190f1 UNIQUEIDENTIFIER,
@ActionID_b18190f1 UNIQUEIDENTIFIER,
@ResultCode_b18190f1 NVARCHAR(255),
@IsSuccess_b18190f1 BIT,
@Description_b18190f1 NVARCHAR(MAX)
SET
  @ID_b18190f1 = '5044A100-0014-4000-8000-0000000000C4'
SET
  @ActionID_b18190f1 = '5044A100-0014-4000-8000-000000000014'
SET
  @ResultCode_b18190f1 = N'ERROR'
SET
  @IsSuccess_b18190f1 = 0
SET
  @Description_b18190f1 = N'The refine job didn''t start.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_b18190f1)
EXEC [__mj].spCreateActionResultCode @ID = @ID_b18190f1,
  @ActionID = @ActionID_b18190f1,
  @ResultCode = @ResultCode_b18190f1,
  @IsSuccess = @IsSuccess_b18190f1,
  @Description = @Description_b18190f1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_2e1eabd4 UNIQUEIDENTIFIER,
@ActionID_2e1eabd4 UNIQUEIDENTIFIER,
@Name_2e1eabd4 NVARCHAR(255),
@DefaultValue_2e1eabd4 NVARCHAR(MAX),
@Type_2e1eabd4 NCHAR(10),
@ValueType_2e1eabd4 NVARCHAR(30),
@IsArray_2e1eabd4 BIT,
@Description_2e1eabd4 NVARCHAR(MAX),
@IsRequired_2e1eabd4 BIT,
@MediaModality_2e1eabd4 NVARCHAR(20)
SET
  @ID_2e1eabd4 = '5044A100-0015-4000-8000-0000000000A1'
SET
  @ActionID_2e1eabd4 = '5044A100-0015-4000-8000-000000000015'
SET
  @Name_2e1eabd4 = N'ModelID'
SET
  @Type_2e1eabd4 = N'Input'
SET
  @ValueType_2e1eabd4 = N'Scalar'
SET
  @IsArray_2e1eabd4 = 0
SET
  @Description_2e1eabd4 = N'The model to unpublish (preferred). Provide this or ModelName.'
SET
  @IsRequired_2e1eabd4 = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_2e1eabd4)
EXEC [__mj].spCreateActionParam @ID = @ID_2e1eabd4,
  @ActionID = @ActionID_2e1eabd4,
  @Name = @Name_2e1eabd4,
  @DefaultValue = @DefaultValue_2e1eabd4,
  @DefaultValue_Clear = 1,
  @Type = @Type_2e1eabd4,
  @ValueType = @ValueType_2e1eabd4,
  @IsArray = @IsArray_2e1eabd4,
  @Description = @Description_2e1eabd4,
  @IsRequired = @IsRequired_2e1eabd4,
  @MediaModality = @MediaModality_2e1eabd4,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_818a52d8 UNIQUEIDENTIFIER,
@ActionID_818a52d8 UNIQUEIDENTIFIER,
@Name_818a52d8 NVARCHAR(255),
@DefaultValue_818a52d8 NVARCHAR(MAX),
@Type_818a52d8 NCHAR(10),
@ValueType_818a52d8 NVARCHAR(30),
@IsArray_818a52d8 BIT,
@Description_818a52d8 NVARCHAR(MAX),
@IsRequired_818a52d8 BIT,
@MediaModality_818a52d8 NVARCHAR(20)
SET
  @ID_818a52d8 = '5044A100-0015-4000-8000-0000000000A2'
SET
  @ActionID_818a52d8 = '5044A100-0015-4000-8000-000000000015'
SET
  @Name_818a52d8 = N'ModelName'
SET
  @Type_818a52d8 = N'Input'
SET
  @ValueType_818a52d8 = N'Scalar'
SET
  @IsArray_818a52d8 = 0
SET
  @Description_818a52d8 = N'Exact model name, if the ID isn''t known.'
SET
  @IsRequired_818a52d8 = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_818a52d8)
EXEC [__mj].spCreateActionParam @ID = @ID_818a52d8,
  @ActionID = @ActionID_818a52d8,
  @Name = @Name_818a52d8,
  @DefaultValue = @DefaultValue_818a52d8,
  @DefaultValue_Clear = 1,
  @Type = @Type_818a52d8,
  @ValueType = @ValueType_818a52d8,
  @IsArray = @IsArray_818a52d8,
  @Description = @Description_818a52d8,
  @IsRequired = @IsRequired_818a52d8,
  @MediaModality = @MediaModality_818a52d8,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_5a5212a4 UNIQUEIDENTIFIER,
@ActionID_5a5212a4 UNIQUEIDENTIFIER,
@Name_5a5212a4 NVARCHAR(255),
@DefaultValue_5a5212a4 NVARCHAR(MAX),
@Type_5a5212a4 NCHAR(10),
@ValueType_5a5212a4 NVARCHAR(30),
@IsArray_5a5212a4 BIT,
@Description_5a5212a4 NVARCHAR(MAX),
@IsRequired_5a5212a4 BIT,
@MediaModality_5a5212a4 NVARCHAR(20)
SET
  @ID_5a5212a4 = '5044A100-0015-4000-8000-0000000000A3'
SET
  @ActionID_5a5212a4 = '5044A100-0015-4000-8000-000000000015'
SET
  @Name_5a5212a4 = N'Result'
SET
  @Type_5a5212a4 = N'Both'
SET
  @ValueType_5a5212a4 = N'Scalar'
SET
  @IsArray_5a5212a4 = 0
SET
  @Description_5a5212a4 = N'JSON: { modelID, name, previousStatus, status }.'
SET
  @IsRequired_5a5212a4 = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_5a5212a4)
EXEC [__mj].spCreateActionParam @ID = @ID_5a5212a4,
  @ActionID = @ActionID_5a5212a4,
  @Name = @Name_5a5212a4,
  @DefaultValue = @DefaultValue_5a5212a4,
  @DefaultValue_Clear = 1,
  @Type = @Type_5a5212a4,
  @ValueType = @ValueType_5a5212a4,
  @IsArray = @IsArray_5a5212a4,
  @Description = @Description_5a5212a4,
  @IsRequired = @IsRequired_5a5212a4,
  @MediaModality = @MediaModality_5a5212a4,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_84d3e13c UNIQUEIDENTIFIER,
@ActionID_84d3e13c UNIQUEIDENTIFIER,
@ResultCode_84d3e13c NVARCHAR(255),
@IsSuccess_84d3e13c BIT,
@Description_84d3e13c NVARCHAR(MAX)
SET
  @ID_84d3e13c = '5044A100-0015-4000-8000-0000000000C1'
SET
  @ActionID_84d3e13c = '5044A100-0015-4000-8000-000000000015'
SET
  @ResultCode_84d3e13c = N'SUCCESS'
SET
  @IsSuccess_84d3e13c = 1
SET
  @Description_84d3e13c = N'Model unpublished to Draft (or already Draft).' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_84d3e13c)
EXEC [__mj].spCreateActionResultCode @ID = @ID_84d3e13c,
  @ActionID = @ActionID_84d3e13c,
  @ResultCode = @ResultCode_84d3e13c,
  @IsSuccess = @IsSuccess_84d3e13c,
  @Description = @Description_84d3e13c;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_f23b9e52 UNIQUEIDENTIFIER,
@ActionID_f23b9e52 UNIQUEIDENTIFIER,
@ResultCode_f23b9e52 NVARCHAR(255),
@IsSuccess_f23b9e52 BIT,
@Description_f23b9e52 NVARCHAR(MAX)
SET
  @ID_f23b9e52 = '5044A100-0015-4000-8000-0000000000C2'
SET
  @ActionID_f23b9e52 = '5044A100-0015-4000-8000-000000000015'
SET
  @ResultCode_f23b9e52 = N'VALIDATION_ERROR'
SET
  @IsSuccess_f23b9e52 = 0
SET
  @Description_f23b9e52 = N'Neither ModelID nor ModelName was provided.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_f23b9e52)
EXEC [__mj].spCreateActionResultCode @ID = @ID_f23b9e52,
  @ActionID = @ActionID_f23b9e52,
  @ResultCode = @ResultCode_f23b9e52,
  @IsSuccess = @IsSuccess_f23b9e52,
  @Description = @Description_f23b9e52;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_8615d1eb UNIQUEIDENTIFIER,
@ActionID_8615d1eb UNIQUEIDENTIFIER,
@ResultCode_8615d1eb NVARCHAR(255),
@IsSuccess_8615d1eb BIT,
@Description_8615d1eb NVARCHAR(MAX)
SET
  @ID_8615d1eb = '5044A100-0015-4000-8000-0000000000C3'
SET
  @ActionID_8615d1eb = '5044A100-0015-4000-8000-000000000015'
SET
  @ResultCode_8615d1eb = N'NOT_FOUND'
SET
  @IsSuccess_8615d1eb = 0
SET
  @Description_8615d1eb = N'No model matched the identifier.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_8615d1eb)
EXEC [__mj].spCreateActionResultCode @ID = @ID_8615d1eb,
  @ActionID = @ActionID_8615d1eb,
  @ResultCode = @ResultCode_8615d1eb,
  @IsSuccess = @IsSuccess_8615d1eb,
  @Description = @Description_8615d1eb;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_aec12f4b UNIQUEIDENTIFIER,
@ActionID_aec12f4b UNIQUEIDENTIFIER,
@ResultCode_aec12f4b NVARCHAR(255),
@IsSuccess_aec12f4b BIT,
@Description_aec12f4b NVARCHAR(MAX)
SET
  @ID_aec12f4b = '5044A100-0015-4000-8000-0000000000C4'
SET
  @ActionID_aec12f4b = '5044A100-0015-4000-8000-000000000015'
SET
  @ResultCode_aec12f4b = N'ERROR'
SET
  @IsSuccess_aec12f4b = 0
SET
  @Description_aec12f4b = N'Unpublish failed or the model is in a non-unpublishable state.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_aec12f4b)
EXEC [__mj].spCreateActionResultCode @ID = @ID_aec12f4b,
  @ActionID = @ActionID_aec12f4b,
  @ResultCode = @ResultCode_aec12f4b,
  @IsSuccess = @IsSuccess_aec12f4b,
  @Description = @Description_aec12f4b;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_2f232688 UNIQUEIDENTIFIER,
@ActionID_2f232688 UNIQUEIDENTIFIER,
@Name_2f232688 NVARCHAR(255),
@DefaultValue_2f232688 NVARCHAR(MAX),
@Type_2f232688 NCHAR(10),
@ValueType_2f232688 NVARCHAR(30),
@IsArray_2f232688 BIT,
@Description_2f232688 NVARCHAR(MAX),
@IsRequired_2f232688 BIT,
@MediaModality_2f232688 NVARCHAR(20)
SET
  @ID_2f232688 = '5044A100-0016-4000-8000-0000000000A1'
SET
  @ActionID_2f232688 = '5044A100-0016-4000-8000-000000000016'
SET
  @Name_2f232688 = N'NameQuery'
SET
  @Type_2f232688 = N'Input'
SET
  @ValueType_2f232688 = N'Scalar'
SET
  @IsArray_2f232688 = 0
SET
  @Description_2f232688 = N'Case-insensitive substring of the entity name. Omit to list all business entities.'
SET
  @IsRequired_2f232688 = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_2f232688)
EXEC [__mj].spCreateActionParam @ID = @ID_2f232688,
  @ActionID = @ActionID_2f232688,
  @Name = @Name_2f232688,
  @DefaultValue = @DefaultValue_2f232688,
  @DefaultValue_Clear = 1,
  @Type = @Type_2f232688,
  @ValueType = @ValueType_2f232688,
  @IsArray = @IsArray_2f232688,
  @Description = @Description_2f232688,
  @IsRequired = @IsRequired_2f232688,
  @MediaModality = @MediaModality_2f232688,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_064642a4 UNIQUEIDENTIFIER,
@ActionID_064642a4 UNIQUEIDENTIFIER,
@Name_064642a4 NVARCHAR(255),
@DefaultValue_064642a4 NVARCHAR(MAX),
@Type_064642a4 NCHAR(10),
@ValueType_064642a4 NVARCHAR(30),
@IsArray_064642a4 BIT,
@Description_064642a4 NVARCHAR(MAX),
@IsRequired_064642a4 BIT,
@MediaModality_064642a4 NVARCHAR(20)
SET
  @ID_064642a4 = '5044A100-0016-4000-8000-0000000000A2'
SET
  @ActionID_064642a4 = '5044A100-0016-4000-8000-000000000016'
SET
  @Name_064642a4 = N'Result'
SET
  @Type_064642a4 = N'Both'
SET
  @ValueType_064642a4 = N'Scalar'
SET
  @IsArray_064642a4 = 0
SET
  @Description_064642a4 = N'JSON: { entities: [{ id, name, schemaName, description }], count, truncated }.'
SET
  @IsRequired_064642a4 = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_064642a4)
EXEC [__mj].spCreateActionParam @ID = @ID_064642a4,
  @ActionID = @ActionID_064642a4,
  @Name = @Name_064642a4,
  @DefaultValue = @DefaultValue_064642a4,
  @DefaultValue_Clear = 1,
  @Type = @Type_064642a4,
  @ValueType = @ValueType_064642a4,
  @IsArray = @IsArray_064642a4,
  @Description = @Description_064642a4,
  @IsRequired = @IsRequired_064642a4,
  @MediaModality = @MediaModality_064642a4,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_0361b216 UNIQUEIDENTIFIER,
@ActionID_0361b216 UNIQUEIDENTIFIER,
@ResultCode_0361b216 NVARCHAR(255),
@IsSuccess_0361b216 BIT,
@Description_0361b216 NVARCHAR(MAX)
SET
  @ID_0361b216 = '5044A100-0016-4000-8000-0000000000C1'
SET
  @ActionID_0361b216 = '5044A100-0016-4000-8000-000000000016'
SET
  @ResultCode_0361b216 = N'SUCCESS'
SET
  @IsSuccess_0361b216 = 1
SET
  @Description_0361b216 = N'Returned matching business entities.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_0361b216)
EXEC [__mj].spCreateActionResultCode @ID = @ID_0361b216,
  @ActionID = @ActionID_0361b216,
  @ResultCode = @ResultCode_0361b216,
  @IsSuccess = @IsSuccess_0361b216,
  @Description = @Description_0361b216;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_9b7dafea UNIQUEIDENTIFIER,
@ActionID_9b7dafea UNIQUEIDENTIFIER,
@ResultCode_9b7dafea NVARCHAR(255),
@IsSuccess_9b7dafea BIT,
@Description_9b7dafea NVARCHAR(MAX)
SET
  @ID_9b7dafea = '5044A100-0016-4000-8000-0000000000C2'
SET
  @ActionID_9b7dafea = '5044A100-0016-4000-8000-000000000016'
SET
  @ResultCode_9b7dafea = N'ERROR'
SET
  @IsSuccess_9b7dafea = 0
SET
  @Description_9b7dafea = N'Lookup failed.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_9b7dafea)
EXEC [__mj].spCreateActionResultCode @ID = @ID_9b7dafea,
  @ActionID = @ActionID_9b7dafea,
  @ResultCode = @ResultCode_9b7dafea,
  @IsSuccess = @IsSuccess_9b7dafea,
  @Description = @Description_9b7dafea;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_3f470485 UNIQUEIDENTIFIER,
@ActionID_3f470485 UNIQUEIDENTIFIER,
@Name_3f470485 NVARCHAR(255),
@DefaultValue_3f470485 NVARCHAR(MAX),
@Type_3f470485 NCHAR(10),
@ValueType_3f470485 NVARCHAR(30),
@IsArray_3f470485 BIT,
@Description_3f470485 NVARCHAR(MAX),
@IsRequired_3f470485 BIT,
@MediaModality_3f470485 NVARCHAR(20)
SET
  @ID_3f470485 = '5044A100-0017-4000-8000-0000000000A1'
SET
  @ActionID_3f470485 = '5044A100-0017-4000-8000-000000000017'
SET
  @Name_3f470485 = N'NameQuery'
SET
  @Type_3f470485 = N'Input'
SET
  @ValueType_3f470485 = N'Scalar'
SET
  @IsArray_3f470485 = 0
SET
  @Description_3f470485 = N'Case-insensitive substring of the model name. Omit to list all models.'
SET
  @IsRequired_3f470485 = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_3f470485)
EXEC [__mj].spCreateActionParam @ID = @ID_3f470485,
  @ActionID = @ActionID_3f470485,
  @Name = @Name_3f470485,
  @DefaultValue = @DefaultValue_3f470485,
  @DefaultValue_Clear = 1,
  @Type = @Type_3f470485,
  @ValueType = @ValueType_3f470485,
  @IsArray = @IsArray_3f470485,
  @Description = @Description_3f470485,
  @IsRequired = @IsRequired_3f470485,
  @MediaModality = @MediaModality_3f470485,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_1f598b0a UNIQUEIDENTIFIER,
@ActionID_1f598b0a UNIQUEIDENTIFIER,
@Name_1f598b0a NVARCHAR(255),
@DefaultValue_1f598b0a NVARCHAR(MAX),
@Type_1f598b0a NCHAR(10),
@ValueType_1f598b0a NVARCHAR(30),
@IsArray_1f598b0a BIT,
@Description_1f598b0a NVARCHAR(MAX),
@IsRequired_1f598b0a BIT,
@MediaModality_1f598b0a NVARCHAR(20)
SET
  @ID_1f598b0a = '5044A100-0017-4000-8000-0000000000A2'
SET
  @ActionID_1f598b0a = '5044A100-0017-4000-8000-000000000017'
SET
  @Name_1f598b0a = N'Result'
SET
  @Type_1f598b0a = N'Both'
SET
  @ValueType_1f598b0a = N'Scalar'
SET
  @IsArray_1f598b0a = 0
SET
  @Description_1f598b0a = N'JSON: { models: [{ id, name, status, anchorEntityID, anchorName }], count, truncated }.'
SET
  @IsRequired_1f598b0a = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_1f598b0a)
EXEC [__mj].spCreateActionParam @ID = @ID_1f598b0a,
  @ActionID = @ActionID_1f598b0a,
  @Name = @Name_1f598b0a,
  @DefaultValue = @DefaultValue_1f598b0a,
  @DefaultValue_Clear = 1,
  @Type = @Type_1f598b0a,
  @ValueType = @ValueType_1f598b0a,
  @IsArray = @IsArray_1f598b0a,
  @Description = @Description_1f598b0a,
  @IsRequired = @IsRequired_1f598b0a,
  @MediaModality = @MediaModality_1f598b0a,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_23b0e534 UNIQUEIDENTIFIER,
@ActionID_23b0e534 UNIQUEIDENTIFIER,
@ResultCode_23b0e534 NVARCHAR(255),
@IsSuccess_23b0e534 BIT,
@Description_23b0e534 NVARCHAR(MAX)
SET
  @ID_23b0e534 = '5044A100-0017-4000-8000-0000000000C1'
SET
  @ActionID_23b0e534 = '5044A100-0017-4000-8000-000000000017'
SET
  @ResultCode_23b0e534 = N'SUCCESS'
SET
  @IsSuccess_23b0e534 = 1
SET
  @Description_23b0e534 = N'Returned matching models.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_23b0e534)
EXEC [__mj].spCreateActionResultCode @ID = @ID_23b0e534,
  @ActionID = @ActionID_23b0e534,
  @ResultCode = @ResultCode_23b0e534,
  @IsSuccess = @IsSuccess_23b0e534,
  @Description = @Description_23b0e534;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_0509f84c UNIQUEIDENTIFIER,
@ActionID_0509f84c UNIQUEIDENTIFIER,
@ResultCode_0509f84c NVARCHAR(255),
@IsSuccess_0509f84c BIT,
@Description_0509f84c NVARCHAR(MAX)
SET
  @ID_0509f84c = '5044A100-0017-4000-8000-0000000000C2'
SET
  @ActionID_0509f84c = '5044A100-0017-4000-8000-000000000017'
SET
  @ResultCode_0509f84c = N'ERROR'
SET
  @IsSuccess_0509f84c = 0
SET
  @Description_0509f84c = N'Lookup failed.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_0509f84c)
EXEC [__mj].spCreateActionResultCode @ID = @ID_0509f84c,
  @ActionID = @ActionID_0509f84c,
  @ResultCode = @ResultCode_0509f84c,
  @IsSuccess = @IsSuccess_0509f84c,
  @Description = @Description_0509f84c;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_7f6f064f UNIQUEIDENTIFIER,
@ActionID_7f6f064f UNIQUEIDENTIFIER,
@Name_7f6f064f NVARCHAR(255),
@DefaultValue_7f6f064f NVARCHAR(MAX),
@Type_7f6f064f NCHAR(10),
@ValueType_7f6f064f NVARCHAR(30),
@IsArray_7f6f064f BIT,
@Description_7f6f064f NVARCHAR(MAX),
@IsRequired_7f6f064f BIT,
@MediaModality_7f6f064f NVARCHAR(20)
SET
  @ID_7f6f064f = '5044A100-0018-4000-8000-0000000000A1'
SET
  @ActionID_7f6f064f = '5044A100-0018-4000-8000-000000000018'
SET
  @Name_7f6f064f = N'TargetActionID'
SET
  @Type_7f6f064f = N'Input'
SET
  @ValueType_7f6f064f = N'Scalar'
SET
  @IsArray_7f6f064f = 0
SET
  @Description_7f6f064f = N'The signal (Runtime action) to test.'
SET
  @IsRequired_7f6f064f = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_7f6f064f)
EXEC [__mj].spCreateActionParam @ID = @ID_7f6f064f,
  @ActionID = @ActionID_7f6f064f,
  @Name = @Name_7f6f064f,
  @DefaultValue = @DefaultValue_7f6f064f,
  @DefaultValue_Clear = 1,
  @Type = @Type_7f6f064f,
  @ValueType = @ValueType_7f6f064f,
  @IsArray = @IsArray_7f6f064f,
  @Description = @Description_7f6f064f,
  @IsRequired = @IsRequired_7f6f064f,
  @MediaModality = @MediaModality_7f6f064f,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_3e6f63b9 UNIQUEIDENTIFIER,
@ActionID_3e6f63b9 UNIQUEIDENTIFIER,
@Name_3e6f63b9 NVARCHAR(255),
@DefaultValue_3e6f63b9 NVARCHAR(MAX),
@Type_3e6f63b9 NCHAR(10),
@ValueType_3e6f63b9 NVARCHAR(30),
@IsArray_3e6f63b9 BIT,
@Description_3e6f63b9 NVARCHAR(MAX),
@IsRequired_3e6f63b9 BIT,
@MediaModality_3e6f63b9 NVARCHAR(20)
SET
  @ID_3e6f63b9 = '5044A100-0018-4000-8000-0000000000A2'
SET
  @ActionID_3e6f63b9 = '5044A100-0018-4000-8000-000000000018'
SET
  @Name_3e6f63b9 = N'AnchorRecordIDs'
SET
  @Type_3e6f63b9 = N'Input'
SET
  @ValueType_3e6f63b9 = N'Scalar'
SET
  @IsArray_3e6f63b9 = 0
SET
  @Description_3e6f63b9 = N'JSON array of sample anchor record ids to test the signal against.'
SET
  @IsRequired_3e6f63b9 = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_3e6f63b9)
EXEC [__mj].spCreateActionParam @ID = @ID_3e6f63b9,
  @ActionID = @ActionID_3e6f63b9,
  @Name = @Name_3e6f63b9,
  @DefaultValue = @DefaultValue_3e6f63b9,
  @DefaultValue_Clear = 1,
  @Type = @Type_3e6f63b9,
  @ValueType = @ValueType_3e6f63b9,
  @IsArray = @IsArray_3e6f63b9,
  @Description = @Description_3e6f63b9,
  @IsRequired = @IsRequired_3e6f63b9,
  @MediaModality = @MediaModality_3e6f63b9,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_27ec62ff UNIQUEIDENTIFIER,
@ActionID_27ec62ff UNIQUEIDENTIFIER,
@Name_27ec62ff NVARCHAR(255),
@DefaultValue_27ec62ff NVARCHAR(MAX),
@Type_27ec62ff NCHAR(10),
@ValueType_27ec62ff NVARCHAR(30),
@IsArray_27ec62ff BIT,
@Description_27ec62ff NVARCHAR(MAX),
@IsRequired_27ec62ff BIT,
@MediaModality_27ec62ff NVARCHAR(20)
SET
  @ID_27ec62ff = '5044A100-0018-4000-8000-0000000000A3'
SET
  @ActionID_27ec62ff = '5044A100-0018-4000-8000-000000000018'
SET
  @Name_27ec62ff = N'AsOf'
SET
  @Type_27ec62ff = N'Input'
SET
  @ValueType_27ec62ff = N'Scalar'
SET
  @IsArray_27ec62ff = 0
SET
  @Description_27ec62ff = N'ISO date to compute the signal as of. Defaults to now.'
SET
  @IsRequired_27ec62ff = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_27ec62ff)
EXEC [__mj].spCreateActionParam @ID = @ID_27ec62ff,
  @ActionID = @ActionID_27ec62ff,
  @Name = @Name_27ec62ff,
  @DefaultValue = @DefaultValue_27ec62ff,
  @DefaultValue_Clear = 1,
  @Type = @Type_27ec62ff,
  @ValueType = @ValueType_27ec62ff,
  @IsArray = @IsArray_27ec62ff,
  @Description = @Description_27ec62ff,
  @IsRequired = @IsRequired_27ec62ff,
  @MediaModality = @MediaModality_27ec62ff,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_15a2340e UNIQUEIDENTIFIER,
@ActionID_15a2340e UNIQUEIDENTIFIER,
@Name_15a2340e NVARCHAR(255),
@DefaultValue_15a2340e NVARCHAR(MAX),
@Type_15a2340e NCHAR(10),
@ValueType_15a2340e NVARCHAR(30),
@IsArray_15a2340e BIT,
@Description_15a2340e NVARCHAR(MAX),
@IsRequired_15a2340e BIT,
@MediaModality_15a2340e NVARCHAR(20)
SET
  @ID_15a2340e = '5044A100-0018-4000-8000-0000000000A4'
SET
  @ActionID_15a2340e = '5044A100-0018-4000-8000-000000000018'
SET
  @Name_15a2340e = N'Result'
SET
  @Type_15a2340e = N'Both'
SET
  @ValueType_15a2340e = N'Scalar'
SET
  @IsArray_15a2340e = 0
SET
  @Description_15a2340e = N'JSON: { rows: [{ anchorRecordId, value, explanation, error }] }.'
SET
  @IsRequired_15a2340e = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_15a2340e)
EXEC [__mj].spCreateActionParam @ID = @ID_15a2340e,
  @ActionID = @ActionID_15a2340e,
  @Name = @Name_15a2340e,
  @DefaultValue = @DefaultValue_15a2340e,
  @DefaultValue_Clear = 1,
  @Type = @Type_15a2340e,
  @ValueType = @ValueType_15a2340e,
  @IsArray = @IsArray_15a2340e,
  @Description = @Description_15a2340e,
  @IsRequired = @IsRequired_15a2340e,
  @MediaModality = @MediaModality_15a2340e,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_475559eb UNIQUEIDENTIFIER,
@ActionID_475559eb UNIQUEIDENTIFIER,
@ResultCode_475559eb NVARCHAR(255),
@IsSuccess_475559eb BIT,
@Description_475559eb NVARCHAR(MAX)
SET
  @ID_475559eb = '5044A100-0018-4000-8000-0000000000C1'
SET
  @ActionID_475559eb = '5044A100-0018-4000-8000-000000000018'
SET
  @ResultCode_475559eb = N'SUCCESS'
SET
  @IsSuccess_475559eb = 1
SET
  @Description_475559eb = N'Returned per-record test results.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_475559eb)
EXEC [__mj].spCreateActionResultCode @ID = @ID_475559eb,
  @ActionID = @ActionID_475559eb,
  @ResultCode = @ResultCode_475559eb,
  @IsSuccess = @IsSuccess_475559eb,
  @Description = @Description_475559eb;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_8aa5a0e7 UNIQUEIDENTIFIER,
@ActionID_8aa5a0e7 UNIQUEIDENTIFIER,
@ResultCode_8aa5a0e7 NVARCHAR(255),
@IsSuccess_8aa5a0e7 BIT,
@Description_8aa5a0e7 NVARCHAR(MAX)
SET
  @ID_8aa5a0e7 = '5044A100-0018-4000-8000-0000000000C2'
SET
  @ActionID_8aa5a0e7 = '5044A100-0018-4000-8000-000000000018'
SET
  @ResultCode_8aa5a0e7 = N'VALIDATION_ERROR'
SET
  @IsSuccess_8aa5a0e7 = 0
SET
  @Description_8aa5a0e7 = N'TargetActionID or AnchorRecordIDs missing/invalid.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_8aa5a0e7)
EXEC [__mj].spCreateActionResultCode @ID = @ID_8aa5a0e7,
  @ActionID = @ActionID_8aa5a0e7,
  @ResultCode = @ResultCode_8aa5a0e7,
  @IsSuccess = @IsSuccess_8aa5a0e7,
  @Description = @Description_8aa5a0e7;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_1b423471 UNIQUEIDENTIFIER,
@ActionID_1b423471 UNIQUEIDENTIFIER,
@ResultCode_1b423471 NVARCHAR(255),
@IsSuccess_1b423471 BIT,
@Description_1b423471 NVARCHAR(MAX)
SET
  @ID_1b423471 = '5044A100-0018-4000-8000-0000000000C3'
SET
  @ActionID_1b423471 = '5044A100-0018-4000-8000-000000000018'
SET
  @ResultCode_1b423471 = N'NOT_FOUND'
SET
  @IsSuccess_1b423471 = 0
SET
  @Description_1b423471 = N'Signal or Test Runtime Action not found.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_1b423471)
EXEC [__mj].spCreateActionResultCode @ID = @ID_1b423471,
  @ActionID = @ActionID_1b423471,
  @ResultCode = @ResultCode_1b423471,
  @IsSuccess = @IsSuccess_1b423471,
  @Description = @Description_1b423471;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_6754f0f8 UNIQUEIDENTIFIER,
@ActionID_6754f0f8 UNIQUEIDENTIFIER,
@ResultCode_6754f0f8 NVARCHAR(255),
@IsSuccess_6754f0f8 BIT,
@Description_6754f0f8 NVARCHAR(MAX)
SET
  @ID_6754f0f8 = '5044A100-0018-4000-8000-0000000000C4'
SET
  @ActionID_6754f0f8 = '5044A100-0018-4000-8000-000000000018'
SET
  @ResultCode_6754f0f8 = N'ERROR'
SET
  @IsSuccess_6754f0f8 = 0
SET
  @Description_6754f0f8 = N'Test run failed.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_6754f0f8)
EXEC [__mj].spCreateActionResultCode @ID = @ID_6754f0f8,
  @ActionID = @ActionID_6754f0f8,
  @ResultCode = @ResultCode_6754f0f8,
  @IsSuccess = @IsSuccess_6754f0f8,
  @Description = @Description_6754f0f8;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_42d15a3f UNIQUEIDENTIFIER,
@ActionID_42d15a3f UNIQUEIDENTIFIER,
@Name_42d15a3f NVARCHAR(255),
@DefaultValue_42d15a3f NVARCHAR(MAX),
@Type_42d15a3f NCHAR(10),
@ValueType_42d15a3f NVARCHAR(30),
@IsArray_42d15a3f BIT,
@Description_42d15a3f NVARCHAR(MAX),
@IsRequired_42d15a3f BIT,
@MediaModality_42d15a3f NVARCHAR(20)
SET
  @ID_42d15a3f = '5044A100-0019-4000-8000-0000000000A1'
SET
  @ActionID_42d15a3f = '5044A100-0019-4000-8000-000000000019'
SET
  @Name_42d15a3f = N'AgentRunID'
SET
  @Type_42d15a3f = N'Input'
SET
  @ValueType_42d15a3f = N'Scalar'
SET
  @IsArray_42d15a3f = 0
SET
  @Description_42d15a3f = N'The AIAgentRun id of the in-flight job to cancel.'
SET
  @IsRequired_42d15a3f = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_42d15a3f)
EXEC [__mj].spCreateActionParam @ID = @ID_42d15a3f,
  @ActionID = @ActionID_42d15a3f,
  @Name = @Name_42d15a3f,
  @DefaultValue = @DefaultValue_42d15a3f,
  @DefaultValue_Clear = 1,
  @Type = @Type_42d15a3f,
  @ValueType = @ValueType_42d15a3f,
  @IsArray = @IsArray_42d15a3f,
  @Description = @Description_42d15a3f,
  @IsRequired = @IsRequired_42d15a3f,
  @MediaModality = @MediaModality_42d15a3f,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_e773d7f2 UNIQUEIDENTIFIER,
@ActionID_e773d7f2 UNIQUEIDENTIFIER,
@Name_e773d7f2 NVARCHAR(255),
@DefaultValue_e773d7f2 NVARCHAR(MAX),
@Type_e773d7f2 NCHAR(10),
@ValueType_e773d7f2 NVARCHAR(30),
@IsArray_e773d7f2 BIT,
@Description_e773d7f2 NVARCHAR(MAX),
@IsRequired_e773d7f2 BIT,
@MediaModality_e773d7f2 NVARCHAR(20)
SET
  @ID_e773d7f2 = '5044A100-0019-4000-8000-0000000000A2'
SET
  @ActionID_e773d7f2 = '5044A100-0019-4000-8000-000000000019'
SET
  @Name_e773d7f2 = N'Result'
SET
  @Type_e773d7f2 = N'Both'
SET
  @ValueType_e773d7f2 = N'Scalar'
SET
  @IsArray_e773d7f2 = 0
SET
  @Description_e773d7f2 = N'JSON: { aborted, statusFlipped }.'
SET
  @IsRequired_e773d7f2 = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_e773d7f2)
EXEC [__mj].spCreateActionParam @ID = @ID_e773d7f2,
  @ActionID = @ActionID_e773d7f2,
  @Name = @Name_e773d7f2,
  @DefaultValue = @DefaultValue_e773d7f2,
  @DefaultValue_Clear = 1,
  @Type = @Type_e773d7f2,
  @ValueType = @ValueType_e773d7f2,
  @IsArray = @IsArray_e773d7f2,
  @Description = @Description_e773d7f2,
  @IsRequired = @IsRequired_e773d7f2,
  @MediaModality = @MediaModality_e773d7f2,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_59096f02 UNIQUEIDENTIFIER,
@ActionID_59096f02 UNIQUEIDENTIFIER,
@ResultCode_59096f02 NVARCHAR(255),
@IsSuccess_59096f02 BIT,
@Description_59096f02 NVARCHAR(MAX)
SET
  @ID_59096f02 = '5044A100-0019-4000-8000-0000000000C1'
SET
  @ActionID_59096f02 = '5044A100-0019-4000-8000-000000000019'
SET
  @ResultCode_59096f02 = N'SUCCESS'
SET
  @IsSuccess_59096f02 = 1
SET
  @Description_59096f02 = N'Job cancelled (or already finished).' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_59096f02)
EXEC [__mj].spCreateActionResultCode @ID = @ID_59096f02,
  @ActionID = @ActionID_59096f02,
  @ResultCode = @ResultCode_59096f02,
  @IsSuccess = @IsSuccess_59096f02,
  @Description = @Description_59096f02;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_456f118b UNIQUEIDENTIFIER,
@ActionID_456f118b UNIQUEIDENTIFIER,
@ResultCode_456f118b NVARCHAR(255),
@IsSuccess_456f118b BIT,
@Description_456f118b NVARCHAR(MAX)
SET
  @ID_456f118b = '5044A100-0019-4000-8000-0000000000C2'
SET
  @ActionID_456f118b = '5044A100-0019-4000-8000-000000000019'
SET
  @ResultCode_456f118b = N'VALIDATION_ERROR'
SET
  @IsSuccess_456f118b = 0
SET
  @Description_456f118b = N'AgentRunID missing.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_456f118b)
EXEC [__mj].spCreateActionResultCode @ID = @ID_456f118b,
  @ActionID = @ActionID_456f118b,
  @ResultCode = @ResultCode_456f118b,
  @IsSuccess = @IsSuccess_456f118b,
  @Description = @Description_456f118b;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_2e27233a UNIQUEIDENTIFIER,
@ActionID_2e27233a UNIQUEIDENTIFIER,
@ResultCode_2e27233a NVARCHAR(255),
@IsSuccess_2e27233a BIT,
@Description_2e27233a NVARCHAR(MAX)
SET
  @ID_2e27233a = '5044A100-0019-4000-8000-0000000000C3'
SET
  @ActionID_2e27233a = '5044A100-0019-4000-8000-000000000019'
SET
  @ResultCode_2e27233a = N'ERROR'
SET
  @IsSuccess_2e27233a = 0
SET
  @Description_2e27233a = N'Cancel failed.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_2e27233a)
EXEC [__mj].spCreateActionResultCode @ID = @ID_2e27233a,
  @ActionID = @ActionID_2e27233a,
  @ResultCode = @ResultCode_2e27233a,
  @IsSuccess = @IsSuccess_2e27233a,
  @Description = @Description_2e27233a;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_db5cb31f UNIQUEIDENTIFIER,
@ActionID_db5cb31f UNIQUEIDENTIFIER,
@Name_db5cb31f NVARCHAR(255),
@DefaultValue_db5cb31f NVARCHAR(MAX),
@Type_db5cb31f NCHAR(10),
@ValueType_db5cb31f NVARCHAR(30),
@IsArray_db5cb31f BIT,
@Description_db5cb31f NVARCHAR(MAX),
@IsRequired_db5cb31f BIT,
@MediaModality_db5cb31f NVARCHAR(20)
SET
  @ID_db5cb31f = '5044A100-001A-4000-8000-0000000000A1'
SET
  @ActionID_db5cb31f = '5044A100-001A-4000-8000-00000000001A'
SET
  @Name_db5cb31f = N'ActionID'
SET
  @Type_db5cb31f = N'Input'
SET
  @ValueType_db5cb31f = N'Scalar'
SET
  @IsArray_db5cb31f = 0
SET
  @Description_db5cb31f = N'The approved signal (Runtime action) to bind.'
SET
  @IsRequired_db5cb31f = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_db5cb31f)
EXEC [__mj].spCreateActionParam @ID = @ID_db5cb31f,
  @ActionID = @ActionID_db5cb31f,
  @Name = @Name_db5cb31f,
  @DefaultValue = @DefaultValue_db5cb31f,
  @DefaultValue_Clear = 1,
  @Type = @Type_db5cb31f,
  @ValueType = @ValueType_db5cb31f,
  @IsArray = @IsArray_db5cb31f,
  @Description = @Description_db5cb31f,
  @IsRequired = @IsRequired_db5cb31f,
  @MediaModality = @MediaModality_db5cb31f,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_fcb32ded UNIQUEIDENTIFIER,
@ActionID_fcb32ded UNIQUEIDENTIFIER,
@Name_fcb32ded NVARCHAR(255),
@DefaultValue_fcb32ded NVARCHAR(MAX),
@Type_fcb32ded NCHAR(10),
@ValueType_fcb32ded NVARCHAR(30),
@IsArray_fcb32ded BIT,
@Description_fcb32ded NVARCHAR(MAX),
@IsRequired_fcb32ded BIT,
@MediaModality_fcb32ded NVARCHAR(20)
SET
  @ID_fcb32ded = '5044A100-001A-4000-8000-0000000000A2'
SET
  @ActionID_fcb32ded = '5044A100-001A-4000-8000-00000000001A'
SET
  @Name_fcb32ded = N'ModelID'
SET
  @Type_fcb32ded = N'Input'
SET
  @ValueType_fcb32ded = N'Scalar'
SET
  @IsArray_fcb32ded = 0
SET
  @Description_fcb32ded = N'The Draft model to bind the signal into.'
SET
  @IsRequired_fcb32ded = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_fcb32ded)
EXEC [__mj].spCreateActionParam @ID = @ID_fcb32ded,
  @ActionID = @ActionID_fcb32ded,
  @Name = @Name_fcb32ded,
  @DefaultValue = @DefaultValue_fcb32ded,
  @DefaultValue_Clear = 1,
  @Type = @Type_fcb32ded,
  @ValueType = @ValueType_fcb32ded,
  @IsArray = @IsArray_fcb32ded,
  @Description = @Description_fcb32ded,
  @IsRequired = @IsRequired_fcb32ded,
  @MediaModality = @MediaModality_fcb32ded,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_988dfe36 UNIQUEIDENTIFIER,
@ActionID_988dfe36 UNIQUEIDENTIFIER,
@Name_988dfe36 NVARCHAR(255),
@DefaultValue_988dfe36 NVARCHAR(MAX),
@Type_988dfe36 NCHAR(10),
@ValueType_988dfe36 NVARCHAR(30),
@IsArray_988dfe36 BIT,
@Description_988dfe36 NVARCHAR(MAX),
@IsRequired_988dfe36 BIT,
@MediaModality_988dfe36 NVARCHAR(20)
SET
  @ID_988dfe36 = '5044A100-001A-4000-8000-0000000000A3'
SET
  @ActionID_988dfe36 = '5044A100-001A-4000-8000-00000000001A'
SET
  @Name_988dfe36 = N'Weight'
SET
  @Type_988dfe36 = N'Input'
SET
  @ValueType_988dfe36 = N'Scalar'
SET
  @IsArray_988dfe36 = 0
SET
  @Description_988dfe36 = N'Rubric weight 0..1 (default 0.25).'
SET
  @IsRequired_988dfe36 = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_988dfe36)
EXEC [__mj].spCreateActionParam @ID = @ID_988dfe36,
  @ActionID = @ActionID_988dfe36,
  @Name = @Name_988dfe36,
  @DefaultValue = @DefaultValue_988dfe36,
  @DefaultValue_Clear = 1,
  @Type = @Type_988dfe36,
  @ValueType = @ValueType_988dfe36,
  @IsArray = @IsArray_988dfe36,
  @Description = @Description_988dfe36,
  @IsRequired = @IsRequired_988dfe36,
  @MediaModality = @MediaModality_988dfe36,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_cf7b957e UNIQUEIDENTIFIER,
@ActionID_cf7b957e UNIQUEIDENTIFIER,
@Name_cf7b957e NVARCHAR(255),
@DefaultValue_cf7b957e NVARCHAR(MAX),
@Type_cf7b957e NCHAR(10),
@ValueType_cf7b957e NVARCHAR(30),
@IsArray_cf7b957e BIT,
@Description_cf7b957e NVARCHAR(MAX),
@IsRequired_cf7b957e BIT,
@MediaModality_cf7b957e NVARCHAR(20)
SET
  @ID_cf7b957e = '5044A100-001A-4000-8000-0000000000A4'
SET
  @ActionID_cf7b957e = '5044A100-001A-4000-8000-00000000001A'
SET
  @Name_cf7b957e = N'Name'
SET
  @Type_cf7b957e = N'Input'
SET
  @ValueType_cf7b957e = N'Scalar'
SET
  @IsArray_cf7b957e = 0
SET
  @Description_cf7b957e = N'Factor name override (defaults to the signal''s name).'
SET
  @IsRequired_cf7b957e = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_cf7b957e)
EXEC [__mj].spCreateActionParam @ID = @ID_cf7b957e,
  @ActionID = @ActionID_cf7b957e,
  @Name = @Name_cf7b957e,
  @DefaultValue = @DefaultValue_cf7b957e,
  @DefaultValue_Clear = 1,
  @Type = @Type_cf7b957e,
  @ValueType = @ValueType_cf7b957e,
  @IsArray = @IsArray_cf7b957e,
  @Description = @Description_cf7b957e,
  @IsRequired = @IsRequired_cf7b957e,
  @MediaModality = @MediaModality_cf7b957e,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Params (core SP call only)
DECLARE @ID_e65752aa UNIQUEIDENTIFIER,
@ActionID_e65752aa UNIQUEIDENTIFIER,
@Name_e65752aa NVARCHAR(255),
@DefaultValue_e65752aa NVARCHAR(MAX),
@Type_e65752aa NCHAR(10),
@ValueType_e65752aa NVARCHAR(30),
@IsArray_e65752aa BIT,
@Description_e65752aa NVARCHAR(MAX),
@IsRequired_e65752aa BIT,
@MediaModality_e65752aa NVARCHAR(20)
SET
  @ID_e65752aa = '5044A100-001A-4000-8000-0000000000A5'
SET
  @ActionID_e65752aa = '5044A100-001A-4000-8000-00000000001A'
SET
  @Name_e65752aa = N'Result'
SET
  @Type_e65752aa = N'Both'
SET
  @ValueType_e65752aa = N'Scalar'
SET
  @IsArray_e65752aa = 0
SET
  @Description_e65752aa = N'JSON: { factorID, modelFactorID }.'
SET
  @IsRequired_e65752aa = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = @ID_e65752aa)
EXEC [__mj].spCreateActionParam @ID = @ID_e65752aa,
  @ActionID = @ActionID_e65752aa,
  @Name = @Name_e65752aa,
  @DefaultValue = @DefaultValue_e65752aa,
  @DefaultValue_Clear = 1,
  @Type = @Type_e65752aa,
  @ValueType = @ValueType_e65752aa,
  @IsArray = @IsArray_e65752aa,
  @Description = @Description_e65752aa,
  @IsRequired = @IsRequired_e65752aa,
  @MediaModality = @MediaModality_e65752aa,
  @MediaModality_Clear = 1;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_472a8a8f UNIQUEIDENTIFIER,
@ActionID_472a8a8f UNIQUEIDENTIFIER,
@ResultCode_472a8a8f NVARCHAR(255),
@IsSuccess_472a8a8f BIT,
@Description_472a8a8f NVARCHAR(MAX)
SET
  @ID_472a8a8f = '5044A100-001A-4000-8000-0000000000C1'
SET
  @ActionID_472a8a8f = '5044A100-001A-4000-8000-00000000001A'
SET
  @ResultCode_472a8a8f = N'SUCCESS'
SET
  @IsSuccess_472a8a8f = 1
SET
  @Description_472a8a8f = N'Signal bound into the model.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_472a8a8f)
EXEC [__mj].spCreateActionResultCode @ID = @ID_472a8a8f,
  @ActionID = @ActionID_472a8a8f,
  @ResultCode = @ResultCode_472a8a8f,
  @IsSuccess = @IsSuccess_472a8a8f,
  @Description = @Description_472a8a8f;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_13ff3382 UNIQUEIDENTIFIER,
@ActionID_13ff3382 UNIQUEIDENTIFIER,
@ResultCode_13ff3382 NVARCHAR(255),
@IsSuccess_13ff3382 BIT,
@Description_13ff3382 NVARCHAR(MAX)
SET
  @ID_13ff3382 = '5044A100-001A-4000-8000-0000000000C2'
SET
  @ActionID_13ff3382 = '5044A100-001A-4000-8000-00000000001A'
SET
  @ResultCode_13ff3382 = N'VALIDATION_ERROR'
SET
  @IsSuccess_13ff3382 = 0
SET
  @Description_13ff3382 = N'ActionID or ModelID missing.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_13ff3382)
EXEC [__mj].spCreateActionResultCode @ID = @ID_13ff3382,
  @ActionID = @ActionID_13ff3382,
  @ResultCode = @ResultCode_13ff3382,
  @IsSuccess = @IsSuccess_13ff3382,
  @Description = @Description_13ff3382;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_0b5c7371 UNIQUEIDENTIFIER,
@ActionID_0b5c7371 UNIQUEIDENTIFIER,
@ResultCode_0b5c7371 NVARCHAR(255),
@IsSuccess_0b5c7371 BIT,
@Description_0b5c7371 NVARCHAR(MAX)
SET
  @ID_0b5c7371 = '5044A100-001A-4000-8000-0000000000C3'
SET
  @ActionID_0b5c7371 = '5044A100-001A-4000-8000-00000000001A'
SET
  @ResultCode_0b5c7371 = N'NOT_FOUND'
SET
  @IsSuccess_0b5c7371 = 0
SET
  @Description_0b5c7371 = N'Signal or model not found.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_0b5c7371)
EXEC [__mj].spCreateActionResultCode @ID = @ID_0b5c7371,
  @ActionID = @ActionID_0b5c7371,
  @ResultCode = @ResultCode_0b5c7371,
  @IsSuccess = @IsSuccess_0b5c7371,
  @Description = @Description_0b5c7371;

GO

-- Save MJ: Action Result Codes (core SP call only)
DECLARE @ID_e3ac760e UNIQUEIDENTIFIER,
@ActionID_e3ac760e UNIQUEIDENTIFIER,
@ResultCode_e3ac760e NVARCHAR(255),
@IsSuccess_e3ac760e BIT,
@Description_e3ac760e NVARCHAR(MAX)
SET
  @ID_e3ac760e = '5044A100-001A-4000-8000-0000000000C4'
SET
  @ActionID_e3ac760e = '5044A100-001A-4000-8000-00000000001A'
SET
  @ResultCode_e3ac760e = N'ERROR'
SET
  @IsSuccess_e3ac760e = 0
SET
  @Description_e3ac760e = N'Model not Draft, signal not Approved, or save failed.' IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = @ID_e3ac760e)
EXEC [__mj].spCreateActionResultCode @ID = @ID_e3ac760e,
  @ActionID = @ActionID_e3ac760e,
  @ResultCode = @ResultCode_e3ac760e,
  @IsSuccess = @IsSuccess_e3ac760e,
  @Description = @Description_e3ac760e;

GO

-- Save MJ: Remote Operations (core SP call only)
DECLARE @ID_32432c1c UNIQUEIDENTIFIER,
@Name_32432c1c NVARCHAR(255),
@OperationKey_32432c1c NVARCHAR(255),
@CategoryID_32432c1c UNIQUEIDENTIFIER,
@Description_32432c1c NVARCHAR(MAX),
@InputTypeName_32432c1c NVARCHAR(255),
@InputTypeDefinition_32432c1c NVARCHAR(MAX),
@InputTypeIsArray_32432c1c BIT,
@OutputTypeName_32432c1c NVARCHAR(255),
@OutputTypeDefinition_32432c1c NVARCHAR(MAX),
@OutputTypeIsArray_32432c1c BIT,
@ExecutionMode_32432c1c NVARCHAR(20),
@RequiredScope_32432c1c NVARCHAR(255),
@RequiresSystemUser_32432c1c BIT,
@GenerationType_32432c1c NVARCHAR(20),
@Code_32432c1c NVARCHAR(MAX),
@CodeApprovalStatus_32432c1c NVARCHAR(20),
@CodeApprovedByUserID_32432c1c UNIQUEIDENTIFIER,
@CodeApprovedAt_32432c1c DATETIMEOFFSET,
@ContractFingerprint_32432c1c NVARCHAR(100),
@Status_32432c1c NVARCHAR(20),
@CacheTTLSeconds_32432c1c INT,
@TimeoutMS_32432c1c INT,
@MaxConcurrency_32432c1c INT,
@CodeLocked_32432c1c BIT,
@CodeComments_32432c1c NVARCHAR(MAX),
@Libraries_32432c1c NVARCHAR(MAX)
SET
  @ID_32432c1c = '5044A100-0030-4000-8000-000000000001'
SET
  @Name_32432c1c = N'Recompute Score Model'
SET
  @OperationKey_32432c1c = N'Sonar.RecomputeModel'
SET
  @Description_32432c1c = N'Recompute AND persist a full run for a published Score Model (RecomputeOrchestrator.recompute): records a ScoreRecomputeRun, upserts every Score + contributions + history, and streams member-scored progress. LongRunning. Implemented by SonarRecomputeModelServerOperation in @mj-biz-apps/sonar-server (registered via @RegisterClass).'
SET
  @InputTypeName_32432c1c = N'SonarRecomputeModelInput'
SET
  @InputTypeDefinition_32432c1c = N'/** Input for `Sonar.RecomputeModel`. */
export interface SonarRecomputeModelInput {
    /** The `MJ_BizApps_Sonar: Score Models` model to recompute + persist. Must be published (have a current version). */
    modelID: string;
}
'
SET
  @InputTypeIsArray_32432c1c = 0
SET
  @OutputTypeName_32432c1c = N'SonarRecomputeModelOutput'
SET
  @OutputTypeDefinition_32432c1c = N'/** Output of `Sonar.RecomputeModel` — the run summary. */
export interface SonarRecomputeModelOutput {
    /** ID of the persisted `MJ_BizApps_Sonar: Score Recompute Runs` row. */
    runID: string;
    /** Run-level status (`Succeeded` / `Failed`). */
    status: string;
    /** Number of members scored + persisted. */
    recordsScored: number;
    /** Run-level error detail when `status` is not `Succeeded`. */
    errorMessage?: string;
}
'
SET
  @OutputTypeIsArray_32432c1c = 0
SET
  @ExecutionMode_32432c1c = N'LongRunning'
SET
  @RequiredScope_32432c1c = N'sonar:recompute'
SET
  @RequiresSystemUser_32432c1c = 0
SET
  @GenerationType_32432c1c = N'Manual'
SET
  @CodeApprovalStatus_32432c1c = N'Approved'
SET
  @Status_32432c1c = N'Active'
SET
  @CodeLocked_32432c1c = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[RemoteOperation] WHERE ID = @ID_32432c1c)
EXEC [__mj].spCreateRemoteOperation @ID = @ID_32432c1c,
  @Name = @Name_32432c1c,
  @OperationKey = @OperationKey_32432c1c,
  @CategoryID = @CategoryID_32432c1c,
  @CategoryID_Clear = 1,
  @Description = @Description_32432c1c,
  @InputTypeName = @InputTypeName_32432c1c,
  @InputTypeDefinition = @InputTypeDefinition_32432c1c,
  @InputTypeIsArray = @InputTypeIsArray_32432c1c,
  @OutputTypeName = @OutputTypeName_32432c1c,
  @OutputTypeDefinition = @OutputTypeDefinition_32432c1c,
  @OutputTypeIsArray = @OutputTypeIsArray_32432c1c,
  @ExecutionMode = @ExecutionMode_32432c1c,
  @RequiredScope = @RequiredScope_32432c1c,
  @RequiresSystemUser = @RequiresSystemUser_32432c1c,
  @GenerationType = @GenerationType_32432c1c,
  @Code = @Code_32432c1c,
  @Code_Clear = 1,
  @CodeApprovalStatus = @CodeApprovalStatus_32432c1c,
  @CodeApprovedByUserID = @CodeApprovedByUserID_32432c1c,
  @CodeApprovedByUserID_Clear = 1,
  @CodeApprovedAt = @CodeApprovedAt_32432c1c,
  @CodeApprovedAt_Clear = 1,
  @ContractFingerprint = @ContractFingerprint_32432c1c,
  @ContractFingerprint_Clear = 1,
  @Status = @Status_32432c1c,
  @CacheTTLSeconds = @CacheTTLSeconds_32432c1c,
  @CacheTTLSeconds_Clear = 1,
  @TimeoutMS = @TimeoutMS_32432c1c,
  @TimeoutMS_Clear = 1,
  @MaxConcurrency = @MaxConcurrency_32432c1c,
  @MaxConcurrency_Clear = 1,
  @CodeLocked = @CodeLocked_32432c1c,
  @CodeComments = @CodeComments_32432c1c,
  @CodeComments_Clear = 1,
  @Libraries = @Libraries_32432c1c,
  @Libraries_Clear = 1;

GO

-- Save MJ: Queries (core SP call only)
DECLARE @ID_d4afd73a UNIQUEIDENTIFIER,
@Name_d4afd73a NVARCHAR(255),
@CategoryID_d4afd73a UNIQUEIDENTIFIER,
@UserQuestion_d4afd73a NVARCHAR(MAX),
@Description_d4afd73a NVARCHAR(MAX),
@SQL_d4afd73a NVARCHAR(MAX),
@TechnicalDescription_d4afd73a NVARCHAR(MAX),
@OriginalSQL_d4afd73a NVARCHAR(MAX),
@Feedback_d4afd73a NVARCHAR(MAX),
@Status_d4afd73a NVARCHAR(15),
@QualityRank_d4afd73a INT,
@ExecutionCostRank_d4afd73a INT,
@UsesTemplate_d4afd73a BIT,
@AuditQueryRuns_d4afd73a BIT,
@CacheEnabled_d4afd73a BIT,
@CacheTTLMinutes_d4afd73a INT,
@CacheMaxSize_d4afd73a INT,
@EmbeddingVector_d4afd73a NVARCHAR(MAX),
@EmbeddingModelID_d4afd73a UNIQUEIDENTIFIER,
@CacheValidationSQL_d4afd73a NVARCHAR(MAX),
@SQLDialectID_d4afd73a UNIQUEIDENTIFIER,
@Reusable_d4afd73a BIT,
@ExternalDataSourceID_d4afd73a UNIQUEIDENTIFIER
SET
  @ID_d4afd73a = '5044A100-0020-4000-8000-000000000001'
SET
  @Name_d4afd73a = N'Sonar: Band Trend'
SET
  @Description_d4afd73a = N'Per-recompute band mix for a model: one row per (snapshot day, band) with the member count. Deduped per member per day (a same-day re-run writes two history rows; the later one wins). Powers the Overview trend chart and its list of comparable snapshot days.'
SET
  @SQL_d4afd73a = N'WITH snap AS (
    SELECT h.AnchorRecordID, h.BandID,
        CONVERT(date, COALESCE(h.AsOfDate, h.ComputedAt)) AS SnapshotDay,
        ROW_NUMBER() OVER (PARTITION BY h.AnchorRecordID, CONVERT(date, COALESCE(h.AsOfDate, h.ComputedAt)) ORDER BY h.AsOfDate DESC, h.ComputedAt DESC) AS rn
    FROM [${flyway:defaultSchema}].[ScoreHistory] h
    WHERE h.ScoreModelID = {{ ModelID | sqlString }}
)
SELECT CONVERT(varchar(10), s.SnapshotDay, 23) AS SnapshotDay,
       CONVERT(varchar(36), s.BandID) AS BandID,
       ISNULL(b.Label, ''Unbanded'') AS BandLabel,
       COUNT(*) AS MemberCount
FROM snap s
LEFT JOIN [${flyway:defaultSchema}].[ScoreBand] b ON b.ID = s.BandID
WHERE s.rn = 1
GROUP BY s.SnapshotDay, s.BandID, ISNULL(b.Label, ''Unbanded'')
ORDER BY s.SnapshotDay ASC'
SET
  @Status_d4afd73a = N'Approved'
SET
  @QualityRank_d4afd73a = 0
SET
  @UsesTemplate_d4afd73a = 0
SET
  @AuditQueryRuns_d4afd73a = 0
SET
  @CacheEnabled_d4afd73a = 0
SET
  @EmbeddingVector_d4afd73a = N'[-0.04499358311295509,0.02223694510757923,-0.043631527572870255,-0.0894920751452446,-0.01469550933688879,-0.03649837151169777,0.031651780009269714,-0.018571166321635246,-0.025727907195687294,0.07517273724079132,0.02343270555138588,-0.014207972213625908,-0.017487403005361557,0.07822726666927338,-0.007705961354076862,-0.029204977676272392,0.02946588024497032,-0.01829756610095501,-0.048085544258356094,-0.0012328047305345535,-0.018219413235783577,-0.0378682017326355,0.0012555266730487347,-0.033443696796894073,-0.0029276476707309484,-0.0034676529467105865,-0.04038979485630989,0.011583720333874226,0.015196426771581173,-0.1321246325969696,0.00029387083486653864,0.0517391711473465,0.00944662094116211,0.030322087928652763,0.0000020721445253002457,0.0050923763774335384,-0.023870088160037994,0.0023439882788807154,-0.035780102014541626,0.022235669195652008,0.04435989633202553,-0.005222524981945753,-0.036947108805179596,-0.018021397292613983,0.0055703273974359035,0.024029426276683807,-0.0610242635011673,-0.022077417001128197,0.028173351660370827,-0.032707326114177704,0.021984437480568886,-0.03414269536733627,-0.07897893339395523,0.009177367202937603,0.03962290287017822,0.01629055105149746,0.022883014753460884,0.025090111419558525,0.020137395709753036,-0.021437563002109528,0.019065432250499725,0.040391698479652405,0.02624114416539669,-0.04907722771167755,0.08357906341552734,0.027850085869431496,0.07756968587636948,-0.02098703384399414,-0.0105372229591012,0.028517303988337517,0.07226328551769257,0.009568988345563412,-0.001829613815061748,0.004109742119908333,-0.0094442218542099,-0.09093531966209412,-0.024124925956130028,-0.001956600695848465,0.014884348027408123,-0.015212233178317547,-0.040783196687698364,0.06273026764392853,-0.009244410321116447,0.006652131676673889,-0.02518174797296524,-0.0328875407576561,-0.0006778253591619432,-0.024665631353855133,-0.014482580125331879,-0.017550373449921608,0.07688526809215546,0.03227026388049126,-0.02032036893069744,0.02520751766860485,-0.036024805158376694,0.031276874244213104,0.05049922689795494,-0.041683413088321686,0.011370306834578514,0.013334015384316444,0.07090247422456741,0.00671397102996707,0.02261117286980152,0.05072203651070595,0.05410937964916229,-0.08531035482883453,0.008429818786680698,-0.07296503335237503,0.00986519269645214,0.009156347252428532,0.004232861567288637,0.011076388880610466,0.017775598913431168,0.022335315123200417,0.09325893223285675,0.005261177197098732,-0.044137585908174515,-0.00021400925470516086,-0.008710958994925022,0.005935311783105135,0.04404689371585846,-0.02373533882200718,-0.0391019731760025,0.03476991876959801,0.04787188023328781,0.013434822671115398,-0.009341242723166943,-0.01534743420779705,0.05374257639050484,-0.00005591209264821373,-0.022056834772229195,-0.05009075254201889,0.0006155537557788193,-0.0011566565372049809,-0.0227312371134758,-0.06157240271568298,0.021887246519327164,0.018191127106547356,-0.09207547456026077,-0.0475817508995533,0.011478128843009472,-0.007340249605476856,-0.053755536675453186,0.011460142210125923,-0.0023141151759773493,-0.058378469198942184,-0.02411964163184166,0.08282962441444397,-0.003586038714274764,-0.00003350398765178397,0.024823693558573723,0.011187554337084293,-0.043663281947374344,0.04102875664830208,0.0009061082964763045,0.009873001836240292,0.03512058034539223,0.027032120153307915,-0.039389774203300476,0.032011933624744415,-0.01791461557149887,-0.01318297442048788,-0.0354568287730217,0.004796766210347414,0.012373109348118305,-0.027349818497896194,-0.14767105877399445,-0.03716021031141281,-0.0732913389801979,-0.041622258722782135,0.013018250465393066,-0.061623748391866684,-0.031988851726055145,0.024435659870505333,0.006756221875548363,-0.03728857636451721,0.10486865043640137,0.06517021358013153,-0.059356652200222015,-0.07733021676540375,-0.008047672919929028,-0.1074720248579979,-0.0035968092270195484,0.022324997931718826,-0.000030728122510481626,0.013864506036043167,-0.02489476092159748,0.02141740918159485,-0.022336240857839584,0.0291232168674469,0.026950763538479805,0.021481135860085487,-0.02430325746536255,0.01650453545153141,-0.0009577841265127063,0.012589543126523495,0.06621825695037842,-0.044020090252161026,0.04868664592504501,-0.02131844311952591,-0.05444076657295227,-0.004350126720964909,0.06949208676815033,0.03704918548464775,0.021444298326969147,-0.045530859380960464,0.012501031160354614,-0.010716517455875874,0.01742527261376381,0.008372814394533634,0.010807683691382408,0.021386081352829933,-0.01076126005500555,0.02256506308913231,-0.02509375847876072,0.06320362538099289,0.004644936881959438,0.048300717025995255,-0.016512341797351837,-0.009859164245426655,-0.049996111541986465,-0.016478687524795532,-0.005474255420267582,-0.0072583300061523914,0.0927080288529396,0.04820491373538971,0.009089960716664791,-0.028038276359438896,0.05178573727607727,0.017812563106417656,-0.022127922624349594,-0.01776575855910778,0.046835269778966904,-0.014179280027747154,0.030178707093000412,0.037364229559898376,0.009105757810175419,-0.040992964059114456,-0.02754019759595394,0.041384514421224594,-0.0010377926519140601,-0.05803270265460014,-0.05411895737051964,-0.0008191830129362643,0.03259176015853882,-0.030328981578350067,-0.0914270356297493,-0.008712898939847946,-0.02290964126586914,-0.003283883212134242,-0.0017666368512436748,0.03317198529839516,0.05303165689110756,-0.01552744023501873,-0.03157323971390724,0.02078934758901596,-0.01319525483995676,-0.008084548637270927,-0.02312668226659298,0.08310084044933319,0.02314786985516548,-0.018661411479115486,-0.01181891467422247,-0.00437273271381855,0.0005827481509186327,-0.02629474736750126,0.041501499712467194,0.03888650983572006,-0.020833665505051613,0.005283166654407978,0.027922004461288452,-0.0003735240316018462,-0.009507589042186737,0.006361981388181448,-0.016559090465307236,0.01947234570980072,-0.04813266918063164,0.015176436863839626,0.004784830845892429,-0.011832197196781635,-0.02502601407468319,-0.029484903439879417,-0.010136990807950497,0.015786198899149895,0.017672574147582054,0.007395042572170496,0.017344191670417786,-0.031575944274663925,-0.026316337287425995,-0.05929289758205414,-0.021069273352622986,-0.04524148628115654,0.003235160605981946,-0.024726323783397675,-0.015455173328518867,0.002564928960055113,0.008980543352663517,0.09914818406105042,0.0427258126437664,0.06405572593212128,0.01410409901291132,0.0033631627447903156,-0.008825022727251053,-0.0015072595560923219,-0.017785057425498962,0.0653381422162056,0.012024391442537308,-0.030184032395482063,-0.020614756271243095,0.07010402530431747,0.013804430142045021,-0.007156015373766422,0.03477239981293678,0.017924675717949867,0.018922904506325722,-0.028784766793251038,0.003546101273968816,0.024904172867536545,-0.03004305250942707,0.048692308366298676,0.01922910287976265,-0.011605020612478256,-0.013327350839972496,0.09308793395757675,-0.025849007070064545,-0.011236224323511124,-0.050688713788986206,0.0056694610975682735,-0.06020320579409599,-0.050812557339668274,0.037156444042921066,-0.03639103099703789,-0.004475165158510208,0.022026140242815018,-0.08978170156478882,-0.021605610847473145,-0.07642557471990585,-0.04711632803082466,-0.013784567825496197,0.008049502037465572,0.007190842647105455,0.022485755383968353,-0.021884549409151077,0.008582382462918758,0.025346051901578903,0.013523370958864689,-0.03175212815403938,0.02733100950717926,-0.03156498074531555,0.018158933147788048,0.04445721209049225,-0.034825071692466736,0.002851594937965274,-0.02569941058754921,0.0014540591510012746,-0.010827752761542797,-0.04859573021531105,0.013579285703599453,-0.026147687807679176,-0.05775734782218933,0.06740251183509827,0.01934518851339817,0.10629105567932129,0.058758776634931564,-0.02720494195818901,0.025307077914476395,-0.02337515354156494,0.02865186519920826,0.03803086653351784,-0.013471422716975212,-0.0005747135728597641,0.012940428219735622,0.029955927282571793,0.008395973592996597,-0.0014511494664475322,-0.09832531958818436,0.009307182393968105,0.010117906145751476,0.0791916623711586,0.01603448949754238,-0.013742185197770596,0.024421347305178642,0.03286898136138916,-0.01740550994873047,0.0191029142588377,-0.018940705806016922,-0.012424525804817677,-0.05151620879769325,-0.027343492954969406,0.017089517787098885,0.02607446350157261,-0.03336569294333458,0.07116687297821045,-0.021923379972577095,-0.023006239905953407,-0.0037928964011371136,-0.03984099254012108,0.050658583641052246,0.004324117209762335,0.013413256965577602,0.02631084993481636,0.0007848410750739276,0.004667613189667463,0.037766747176647186,-0.00020871995366178453,-0.019826501607894897,0.033783067017793655,0.020086340606212616,-0.006656428333371878,-0.025456422939896584,-0.015639035031199455,-0.09754692763090134,0.007797672413289547,-0.015191031619906425,0.02775290608406067,-0.0033729621209204197,-0.00274819228798151,-0.01358336303383112,0.019418055191636086,0.002973339054733515,0.03745521232485771,0.010285748168826103,0.01548957172781229,0.024621915072202682,0.04064935818314552,-0.01985679380595684,0.03410523757338524,-0.03515934571623802,0.0014842196833342314,0.0256021860986948,0.022825444117188454,0.002511525060981512,-0.0048813484609127045,0.08853163570165634,-0.06433387845754623,-0.015915540978312492,0.005157014355063438,-0.030536765232682228,0.02092563919723034,0.021061010658740997,-0.006730417255312204,0.007868332788348198,0.11424322426319122,-0.028906099498271942,0.04444442316889763,-0.008141306228935719,-0.02615867182612419,-0.02447568252682686,-0.04030686989426613,-0.007173620164394379,0.05256499722599983,0.040262460708618164,-0.0498175211250782,-0.05391300097107887,0.03267081826925278,-0.023904699832201004,0.03184963017702103,-0.08031246066093445,-0.016745170578360558,0.034696999937295914,-0.026171069592237473,0.04684576392173767,-0.04632885009050369,0.0030988187063485384,0.025373460724949837,0.005937081295996904,-0.014925415627658367,0.03625720739364624,0.010011788457632065,-0.025027327239513397,0.021046310663223267,-0.025310110300779343,-0.00699690543115139,0.0034799939021468163,0.03809276595711708,0.017054589465260506,0.003663897980004549,0.015872836112976074,0.03627735376358032,-0.011592994444072247,-0.027048593387007713,-0.024255072697997093,0.019140955060720444,-0.053910400718450546,0.022101158276200294,0.012926668860018253,-0.024331891909241676,0.013371079228818417,-0.02136007696390152,0.006407419219613075,0.015467880293726921,-0.0696134865283966,-0.025372860953211784,0.07028792798519135,-0.005294439848512411,0.0050978101789951324,-0.004228594712913036,-0.03326766937971115,-0.010108415968716145,-0.040688406676054,-0.03697884455323219,0.03191026672720909,-0.016849348321557045,-0.014953319914638996,0.007275713607668877,0.033933818340301514,0.04898073524236679,-0.006841834634542465,0.00876732636243105,-0.02135133184492588,0.01761908084154129,0.009760706685483456,-0.060612864792346954,-0.022922899574041367,0.06696996092796326,-0.06620363891124725,-0.02317516691982746,0.05628727376461029,0.02501060627400875,0.011073588393628597,0.005872813984751701,0.005922976415604353,0.056604839861392975,-0.02152622863650322,0.08621344715356827,-0.012002727016806602,0.03229862079024315,-0.0003857486299239099,0.03426790609955788,0.0610676072537899,0.03144071251153946,-0.0148477703332901,-0.017921818420290947,0.03695942461490631,-0.011326191015541553,0.03140319883823395,-0.013571690768003464,0.0006433348171412945,0.019890516996383667,-0.06383984535932541,-0.06150129809975624,0.01415419951081276,0.020511861890554428,-0.027472633868455887,0.0012024571187794209,-0.02643297053873539,-0.014136544428765774,0.025035029277205467,-0.008568945340812206,-0.007751251105219126,0.04579103738069534,-0.016259677708148956,-0.06682436913251877,-0.04153076559305191,0.006908342242240906,-7.175406331199344e-33,-0.04673270136117935,0.018874723464250565,-0.026549750939011574,-0.12783320248126984,-0.06271219998598099,-0.0222685057669878,-0.01331544853746891,-0.04940859228372574,0.0007116260821931064,-0.009645997546613216,-0.029057813808321953,0.013027852401137352,0.019729554653167725,-0.017042411491274834,0.014620890840888023,0.030782397836446762,0.04475584626197815,-0.009691552259027958,0.020473169162869453,0.06190819665789604,-0.014193069189786911,0.04153542220592499,0.004350028466433287,0.033120542764663696,-0.09934540838003159,0.05564813315868378,-0.0060498397797346115,0.020832661539316177,-0.03476545587182045,-0.02947065606713295,0.017155226320028305,-0.019003121182322502,-0.015766113996505737,0.024321576580405235,-0.029699252918362617,-0.08660967648029327,-0.019328253343701363,-0.003829215420410037,-0.02609666809439659,-0.056053902953863144,0.02150142379105091,0.05449250340461731,0.00569661520421505,-0.0161835178732872,-0.03282252326607704,-0.024583833292126656,0.011345389299094677,-0.014071150682866573,-0.05315246433019638,-0.015812557190656662,0.040755726397037506,0.043383676558732986,0.008095278404653072,0.017963431775569916,-0.002921642269939184,0.006627376191318035,-0.01197062898427248,0.04422468692064285,-0.07117432355880737,0.06075766310095787,0.07569319754838943,0.007193181663751602,-0.008736872114241123,0.008354333229362965,0.0366927795112133,0.0008346003596670926,0.050967808812856674,0.06506034731864929,0.025671452283859253,-0.009223850443959236,-0.04050741717219353,0.04517515003681183,-0.02199459820985794,-0.018885303288698196,0.09686286002397537,-0.008218186907470226,0.034606385976076126,-0.02019800804555416,0.05717996507883072,0.013009333051741123,0.00811844877898693,0.03350169211626053,0.015866944566369057,0.0335971862077713,0.015424012206494808,-0.045755550265312195,-0.005362277384847403,-0.03429333493113518,0.019417747855186462,0.03096618503332138,-0.03871266171336174,0.012360737659037113,-0.02320784702897072,0.010711831040680408,-0.02405654639005661,0.012009527534246445,0.00680952426046133,0.01903003640472889,-0.0005273522692732513,-0.03233317285776138,0.003202673979103565,0.02489476092159748,0.05953948199748993,0.05152785778045654,-0.0035549842286854982,0.012112442404031754,0.04219021275639534,0.009106586687266827,-0.0547214113175869,-0.00037931380211375654,0.015606662258505821,0.0004991173627786338,-0.03135068342089653,-0.02498914860188961,0.0007141280802898109,-0.030379487201571465,0.006746768020093441,0.010552973486483097,0.018225625157356262,0.02568933740258217,0.0008377857157029212,0.02415899559855461,-0.01735753007233143,0.06338678300380707,0.036571282893419266,-0.0035651312209665775,0.0025750193744897842,-0.08335933834314346,-0.013751435093581676,0.0092075290158391,0.011931662447750568,0.012726487591862679,3.058386823795445e-7,-0.02537277340888977,-0.008900976739823818,0.003465465735644102,0.01679450273513794,0.06282977014780045,-0.009169276803731918,-0.019363336265087128,-0.016290754079818726,-0.021671025082468987,-0.03961572051048279,0.004480724222958088,0.000009374640285386704,0.03281242400407791,0.02166086807847023,0.06495463848114014,-0.050644613802433014,-0.006566966883838177,-0.046838775277137756,-0.05861819535493851,-0.018148373812437057,0.041393931955099106,0.01022091880440712,0.013824304565787315,-0.03443422168493271,0.026329323649406433,0.003927086479961872,-0.006957832258194685,0.017735881730914116,-0.0329701229929924,-0.010464868508279324,0.10191001743078232,-0.06724780052900314,-0.03230087831616402,-0.03360844776034355,0.0012317484943196177,0.019257642328739166,-0.058838918805122375,-0.04279037192463875,-0.0363953672349453,-0.005311829969286919,0.008069640956819057,0.04931756481528282,-0.015852417796850204,-0.030243080109357834,0.025513440370559692,0.0369114950299263,-0.006626969203352928,-0.06481538712978363,-0.02811513841152191,-0.013159221969544888,0.029708847403526306,-0.0016280935378745198,-0.015541551634669304,-0.0180392786860466,0.015069659799337387,0.007072230335325003,-0.025984587147831917,0.005155818071216345,0.0035786498337984085,0.00890388060361147,-0.0025427481159567833,-0.034448325634002686,0.01029171422123909,0.08140765130519867,0.04078991711139679,-0.03826852887868881,-0.009067234583199024,3.3531403392262886e-34,0.05601724982261658,0.028111321851611137,-0.004324944224208593,0.035038162022829056,0.005648627411574125,-0.01326349750161171,0.02565905824303627,-0.023969730362296104,-0.0072279563173651695,-0.0492689423263073,-0.013827841728925705]'
SET
  @EmbeddingModelID_d4afd73a = '1D45AA65-41EC-4572-9ECD-AB2826C9B059'
SET
  @Reusable_d4afd73a = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[Query] WHERE ID = @ID_d4afd73a)
EXEC [__mj].spCreateQuery @ID = @ID_d4afd73a,
  @Name = @Name_d4afd73a,
  @CategoryID = @CategoryID_d4afd73a,
  @CategoryID_Clear = 1,
  @UserQuestion = @UserQuestion_d4afd73a,
  @UserQuestion_Clear = 1,
  @Description = @Description_d4afd73a,
  @SQL = @SQL_d4afd73a,
  @TechnicalDescription = @TechnicalDescription_d4afd73a,
  @TechnicalDescription_Clear = 1,
  @OriginalSQL = @OriginalSQL_d4afd73a,
  @OriginalSQL_Clear = 1,
  @Feedback = @Feedback_d4afd73a,
  @Feedback_Clear = 1,
  @Status = @Status_d4afd73a,
  @QualityRank = @QualityRank_d4afd73a,
  @ExecutionCostRank = @ExecutionCostRank_d4afd73a,
  @ExecutionCostRank_Clear = 1,
  @UsesTemplate = @UsesTemplate_d4afd73a,
  @AuditQueryRuns = @AuditQueryRuns_d4afd73a,
  @CacheEnabled = @CacheEnabled_d4afd73a,
  @CacheTTLMinutes = @CacheTTLMinutes_d4afd73a,
  @CacheTTLMinutes_Clear = 1,
  @CacheMaxSize = @CacheMaxSize_d4afd73a,
  @CacheMaxSize_Clear = 1,
  @EmbeddingVector = @EmbeddingVector_d4afd73a,
  @EmbeddingModelID = @EmbeddingModelID_d4afd73a,
  @CacheValidationSQL = @CacheValidationSQL_d4afd73a,
  @CacheValidationSQL_Clear = 1,
  @SQLDialectID = @SQLDialectID_d4afd73a,
  @Reusable = @Reusable_d4afd73a,
  @ExternalDataSourceID = @ExternalDataSourceID_d4afd73a,
  @ExternalDataSourceID_Clear = 1;

GO

-- Save MJ: Queries (core SP call only)
DECLARE @ID_7d70f031 UNIQUEIDENTIFIER,
@Name_7d70f031 NVARCHAR(255),
@CategoryID_7d70f031 UNIQUEIDENTIFIER,
@UserQuestion_7d70f031 NVARCHAR(MAX),
@Description_7d70f031 NVARCHAR(MAX),
@SQL_7d70f031 NVARCHAR(MAX),
@TechnicalDescription_7d70f031 NVARCHAR(MAX),
@OriginalSQL_7d70f031 NVARCHAR(MAX),
@Feedback_7d70f031 NVARCHAR(MAX),
@Status_7d70f031 NVARCHAR(15),
@QualityRank_7d70f031 INT,
@ExecutionCostRank_7d70f031 INT,
@UsesTemplate_7d70f031 BIT,
@AuditQueryRuns_7d70f031 BIT,
@CacheEnabled_7d70f031 BIT,
@CacheTTLMinutes_7d70f031 INT,
@CacheMaxSize_7d70f031 INT,
@EmbeddingVector_7d70f031 NVARCHAR(MAX),
@EmbeddingModelID_7d70f031 UNIQUEIDENTIFIER,
@CacheValidationSQL_7d70f031 NVARCHAR(MAX),
@SQLDialectID_7d70f031 UNIQUEIDENTIFIER,
@Reusable_7d70f031 BIT,
@ExternalDataSourceID_7d70f031 UNIQUEIDENTIFIER
SET
  @ID_7d70f031 = '5044A100-0020-4000-8000-000000000002'
SET
  @Name_7d70f031 = N'Sonar: Band Flows'
SET
  @Description_7d70f031 = N'Band-change cohorts between two snapshot days for a model: one row per (from band, to band) with the member count, biggest first. Members present at only one of the two days are skipped (not a band CHANGE). Powers the Overview migration ribbons and the ''who needs action'' cohort chips at any look-back window.'
SET
  @SQL_7d70f031 = N'WITH snap AS (
    SELECT h.AnchorRecordID, h.BandID,
        CONVERT(date, COALESCE(h.AsOfDate, h.ComputedAt)) AS SnapshotDay,
        ROW_NUMBER() OVER (PARTITION BY h.AnchorRecordID, CONVERT(date, COALESCE(h.AsOfDate, h.ComputedAt)) ORDER BY h.AsOfDate DESC, h.ComputedAt DESC) AS rn
    FROM [${flyway:defaultSchema}].[ScoreHistory] h
    WHERE h.ScoreModelID = {{ ModelID | sqlString }}
      AND CONVERT(date, COALESCE(h.AsOfDate, h.ComputedAt)) IN ({{ FromDay | sqlString }}, {{ ToDay | sqlString }})
)
SELECT CONVERT(varchar(36), f.BandID) AS FromBandID,
       ISNULL(fb.Label, ''Unbanded'') AS FromBand,
       CONVERT(varchar(36), t.BandID) AS ToBandID,
       ISNULL(tb.Label, ''Unbanded'') AS ToBand,
       COUNT(*) AS MemberCount
FROM snap f
JOIN snap t ON t.AnchorRecordID = f.AnchorRecordID AND t.SnapshotDay = {{ ToDay | sqlString }} AND t.rn = 1
LEFT JOIN [${flyway:defaultSchema}].[ScoreBand] fb ON fb.ID = f.BandID
LEFT JOIN [${flyway:defaultSchema}].[ScoreBand] tb ON tb.ID = t.BandID
WHERE f.SnapshotDay = {{ FromDay | sqlString }} AND f.rn = 1
  AND ISNULL(CONVERT(varchar(36), f.BandID), '''') <> ISNULL(CONVERT(varchar(36), t.BandID), '''')
GROUP BY f.BandID, ISNULL(fb.Label, ''Unbanded''), t.BandID, ISNULL(tb.Label, ''Unbanded'')
ORDER BY COUNT(*) DESC'
SET
  @Status_7d70f031 = N'Approved'
SET
  @QualityRank_7d70f031 = 0
SET
  @UsesTemplate_7d70f031 = 0
SET
  @AuditQueryRuns_7d70f031 = 0
SET
  @CacheEnabled_7d70f031 = 0
SET
  @EmbeddingVector_7d70f031 = N'[-0.035168152302503586,0.057255085557699203,-0.03535761684179306,-0.0870850533246994,-0.018599221482872963,-0.03515934944152832,0.01971188373863697,-0.02948172576725483,-0.036064859479665756,0.06130122393369675,0.020216254517436028,-0.05750184506177902,-0.025721093639731407,0.09995430707931519,-0.003691047430038452,-0.006001697387546301,0.028358856216073036,-0.046645838767290115,-0.03955191373825073,-0.0038083207327872515,-0.04567950963973999,-0.03539252653717995,-0.009553148411214352,-0.02801625430583954,0.06146895885467529,-0.015806013718247414,-0.0709313452243805,0.050916992127895355,0.03714022412896156,-0.07783268392086029,0.02208700403571129,0.05821825936436653,-0.004252105485647917,0.02053455263376236,0.0000022510978396894643,-0.0108199967071414,-0.026441359892487526,-0.003958967048674822,-0.03788106516003609,0.0034750024788081646,0.019602365791797638,-0.013578495942056179,-0.019451841711997986,-0.020192457363009453,0.01221682783216238,0.08169449120759964,-0.06513894349336624,-0.06570569425821304,0.05045684054493904,0.0018431282369419932,0.005740662571042776,0.04441307857632637,-0.06481757014989853,-0.0033013292122632265,0.04073517024517059,-0.02509496547281742,0.011619355529546738,-0.02413441799581051,0.025068897753953934,-0.06311232596635818,0.007277501747012138,0.04511597752571106,0.014500021934509277,-0.08248715847730637,0.10871385782957077,0.01711863838136196,-0.020399028435349464,-0.03547268360853195,-0.00615588529035449,0.00808884296566248,0.11529547721147537,0.005465428810566664,0.00040173326851800084,-0.0058307466097176075,-0.01738670840859413,-0.030967844650149345,-0.0015059452271088958,-0.027642514556646347,0.028866328299045563,-0.014296476729214191,-0.07303096354007721,0.06497660279273987,-0.015772756189107895,0.010814680717885494,-0.05179964005947113,-0.019607214257121086,-0.0015499228611588478,-0.008966636843979359,-0.026550784707069397,-0.005948518868535757,0.07709290832281113,0.03496115282177925,0.005889606196433306,0.023015670478343964,-0.06856518238782883,-0.006327150855213404,0.04525763541460037,0.021527212113142014,0.003892440814524889,0.011285373009741306,0.04492839053273201,-0.01691320165991783,-0.024857744574546814,0.07111816853284836,0.016075415536761284,-0.052431870251894,0.007457233965396881,-0.007586151361465454,-0.027574708685278893,0.004221578128635883,0.013091685250401497,0.0068971202708780766,-0.009041204117238522,-0.010533981956541538,0.02096475474536419,-0.007363896816968918,-0.004595830570906401,0.006026037968695164,-0.017324674874544144,-0.005417478270828724,0.06523982435464859,0.0019066011300310493,-0.0287912767380476,0.04576828330755234,0.047356266528367996,0.027108680456876755,0.007170119788497686,-0.0043579894118011,0.029317565262317657,0.02795545943081379,-0.0392431803047657,-0.029979370534420013,0.007082834839820862,0.0029495402704924345,-0.041047945618629456,-0.01827501505613327,0.00867944024503231,0.0364694744348526,-0.022605065256357193,-0.02003007009625435,0.02880181558430195,-0.015531420707702637,-0.023009194061160088,0.015229441225528717,0.009690380655229092,-0.02471916936337948,0.003154436592012644,0.07442698627710342,0.008091947063803673,-0.005023130215704441,-0.028612803667783737,0.010991874150931835,-0.0309466402977705,0.04387161508202553,-0.03347514569759369,0.00795554555952549,0.04697081446647644,0.047038789838552475,0.008228731341660023,-0.01749008148908615,0.0008671386749483645,0.02015444077551365,-0.03659878298640251,0.00876569002866745,-0.02075369842350483,0.003597034839913249,-0.06430888921022415,-0.04495611414313316,-0.023785483092069626,-0.005310786422342062,0.039378803223371506,-0.057129886001348495,-0.01678045466542244,-0.02245980314910412,-0.013434775173664093,-0.037302166223526,0.08335726708173752,0.011458368971943855,-0.02626267448067665,-0.075564444065094,-0.04741629585623741,-0.11040541529655457,-0.017104782164096832,0.018894771113991737,0.006535120774060488,-0.033632487058639526,-0.02485089935362339,0.024632278829813004,-0.01638803631067276,0.05476885661482811,0.027584882453083992,0.020444544032216072,-0.06108390912413597,-0.016630657017230988,0.012714573182165623,-0.004316434264183044,0.04872305318713188,-0.025980019941926003,0.048998765647411346,-0.00357423210516572,-0.028178870677947998,0.014871195890009403,-0.006219116970896721,0.049235906451940536,0.02849237248301506,-0.03895289823412895,-0.03821360692381859,0.001375567982904613,0.08179377764463425,0.00043198250932618976,0.06700941175222397,0.026103639975190163,-0.0448492132127285,0.012664024718105793,0.014255553483963013,0.08293597400188446,-0.02109825238585472,0.014177508652210236,-0.045712508261203766,-0.018071956932544708,-0.04378205165266991,-0.00008899979729903862,-0.034917209297418594,0.0029149523470550776,0.027500437572598457,0.08530815690755844,0.008972592651844025,-0.027183249592781067,0.02435288392007351,-0.018515964969992638,-0.012116451747715473,-0.02797870524227619,0.03279461711645126,0.023671824485063553,0.06565355509519577,0.04815499112010002,-0.015628913417458534,-0.04424678161740303,-0.033476367592811584,0.07458961755037308,0.017854947596788406,-0.05472712963819504,-0.053791824728250504,0.02116180583834648,0.012799606658518314,0.013466349802911282,-0.14667674899101257,0.00880159717053175,0.02789807878434658,0.009356576018035412,0.0006023072637617588,0.02381892502307892,0.021616371348500252,0.016910357400774956,-0.017015263438224792,-0.020238757133483887,-0.005162127315998077,-0.025014083832502365,-0.05370069667696953,0.1017620861530304,0.03173157572746277,-0.017590360715985298,-0.042001381516456604,0.0017600393621250987,0.004601513035595417,-0.030241692438721657,0.02788371779024601,0.03818773850798607,0.004319891799241304,0.010046465322375298,0.03934837505221367,0.010160082951188087,-0.010131200775504112,-0.009914655238389969,0.02166030928492546,-0.0007577625219710171,-0.034106459468603134,0.01853199303150177,-0.00893513485789299,-0.038017164915800095,-0.01871776022017002,-0.019924169406294823,-0.006023481488227844,0.03335298225283623,-0.012250742875039577,0.030696652829647064,0.04574323073029518,-0.1263437569141388,-0.03761547803878784,-0.10374867171049118,-0.01183012779802084,-0.05347071960568428,-0.008092992939054966,-0.006565697491168976,-0.031157538294792175,-0.018917266279459,0.013513794168829918,0.0606553815305233,0.02597176656126976,0.09130436927080154,0.01542650256305933,-0.004888000898063183,-0.0016059133922681212,0.021368782967329025,-0.023847689852118492,0.049746185541152954,-0.019271505996584892,-0.022978398948907852,-0.0027046119794249535,0.037737563252449036,-0.021675242111086845,0.0010420046746730804,0.04275135323405266,-0.00213016290217638,0.004763604141771793,-0.01775015890598297,-0.005414419807493687,-0.020746462047100067,-0.03071744367480278,0.051955897361040115,-0.0025529740378260612,0.02141147293150425,-0.022565335035324097,0.08000791817903519,-0.02988201193511486,-0.010764503851532936,-0.06361962854862213,0.021421682089567184,-0.04792674258351326,-0.01511301752179861,0.046441610902547836,0.0247552078217268,-0.001996951876208186,-0.013449670746922493,-0.039344772696495056,-0.05537872388958931,-0.033001407980918884,-0.09014637768268585,-0.01726481504738331,0.017540981993079185,-0.002632684540003538,0.006480127107352018,-0.01593111827969551,0.04015112668275833,0.052911654114723206,0.05137479305267334,-0.05949580296874046,-0.0009286770946346223,-0.03405870869755745,0.0008208692888729274,-0.00829055905342102,-0.007584244478493929,-0.028451647609472275,-0.020669888705015182,-0.009798306971788406,0.026425937190651894,-0.03398669511079788,0.04695696756243706,0.003299988806247711,-0.07611390203237534,0.07288946956396103,-0.014476952143013477,0.10692945867776871,0.03270530700683594,0.0169890895485878,0.02913503162562847,-0.010037456639111042,-0.017671527341008186,0.024020615965127945,-0.03728434070944786,0.04737626761198044,0.030188461765646935,-0.027433887124061584,0.016762997955083847,0.01044644508510828,-0.10037722438573837,0.02700030244886875,-0.029963800683617592,0.0671108141541481,0.01374028529971838,-0.014551100321114063,0.04448872059583664,0.038357168436050415,0.013427558355033398,0.019436292350292206,-0.024980762973427773,-0.015299683436751366,-0.04165356233716011,0.01751692406833172,0.028176145628094673,0.034094877541065216,-0.02764279581606388,0.10048148036003113,-0.00780765013769269,-0.011454794555902481,0.0100153973326087,-0.08028645813465118,0.042186520993709564,0.0007445783703587949,-0.010656450875103474,0.014123535715043545,0.013318907469511032,0.04460914060473442,0.03929910063743591,0.021244097501039505,0.01342302467674017,-0.011405114084482193,0.0015012405347079039,-0.008380035869777203,-0.023794498294591904,0.04177543520927429,-0.05832992121577263,0.020387493073940277,0.008931626565754414,0.0180195365101099,0.0000037611860079778126,0.014281703159213066,-0.0014740385813638568,-0.00330290081910789,-0.011094309389591217,0.004700344055891037,0.030241023749113083,0.042699284851551056,0.01807546615600586,0.006382645107805729,-0.03385644406080246,0.04288361966609955,-0.02901598811149597,-0.0020880508236587048,0.0063103497959673405,-0.0077070388942956924,0.027787309139966965,0.00842645950615406,0.06701285392045975,-0.0861993059515953,-0.033293526619672775,0.003536737058311701,0.004988859407603741,-0.009143056347966194,0.009232920594513416,-0.010957845486700535,0.00888044387102127,0.11500141024589539,-0.05149656906723976,0.04668864235281944,-0.0055451830849051476,-0.030765408650040627,0.005847868975251913,0.007573072332888842,-0.06347528100013733,0.04770539328455925,-0.010641169734299183,-0.0690273642539978,-0.040495701134204865,0.06360699236392975,-0.04657917842268944,-0.000016514433809788898,-0.058259930461645126,-0.042616941034793854,0.0014402033993974328,-0.047891467809677124,0.04873953387141228,-0.026986978948116302,-0.03460625559091568,0.05345434322953224,0.00041811575647443533,0.0013451435370370746,0.0028132572770118713,0.005904754623770714,-0.03594980016350746,-0.016135821118950844,-0.04176391661167145,-0.011206447146832943,-0.009002053178846836,0.02132362686097622,0.007507548667490482,0.04856434464454651,0.01711675524711609,0.042731620371341705,-0.005511170718818903,-0.03417406231164932,-0.01807299070060253,0.038452088832855225,-0.06853124499320984,0.004609772935509682,0.0393974743783474,-0.0020923707634210587,0.01608411967754364,-0.01292870007455349,-0.010818934999406338,-0.0028630876913666725,-0.044427864253520966,-0.011701751500368118,0.020559923723340034,-0.006003460381180048,-0.03829379752278328,0.004468570929020643,0.009577958844602108,0.03970092162489891,0.02829616703093052,-0.019554030150175095,0.025328869000077248,0.01685408689081669,-0.03183777630329132,0.026189927011728287,0.018273578956723213,0.02441984973847866,0.005167121533304453,0.00955368485301733,0.0054819826036691666,-0.007593243382871151,-0.020067857578396797,-0.05548733100295067,-0.03245990723371506,0.021306727081537247,-0.03634224832057953,-0.05429127812385559,0.07218680530786514,0.0209320317953825,0.019803453236818314,0.001094531617127359,-0.00842232909053564,0.01464299950748682,-0.0009072624379768968,0.01538438443094492,-0.023675620555877686,0.032251860946416855,0.016668764874339104,0.05860336124897003,0.04992017149925232,0.050808608531951904,0.00680717034265399,-0.030942412093281746,0.034538693726062775,0.0021720901131629944,0.014283396303653717,0.04872417449951172,-0.037752725183963776,0.025604108348488808,-0.022110726684331894,-0.04512631148099899,0.04396278038620949,0.00671282596886158,-0.02970344014465809,0.018548304215073586,-0.03054380975663662,-0.000878085964359343,-0.017201866954565048,-0.00889206025749445,0.017069177702069283,0.03526792302727699,-0.046911027282476425,-0.037268903106451035,-0.011917047202587128,0.015889300033450127,-7.788458961247814e-33,-0.055699124932289124,-0.0026415581814944744,-0.011614958755671978,-0.09921141713857651,-0.06862102448940277,-0.04841464012861252,-0.028431247919797897,-0.060223184525966644,-0.025145577266812325,-0.02870824746787548,-0.008427930064499378,-0.0019410847453400493,0.01794455759227276,-0.015088343061506748,0.016596611589193344,0.04717574641108513,0.029591994360089302,0.0065000420436263084,-0.02015085518360138,0.07905565947294235,-0.022909896448254585,0.020039541646838188,-0.022632673382759094,0.053670067340135574,-0.056131865829229355,0.04333827644586563,-0.000534570834133774,0.037984319031238556,-0.05590606853365898,-0.05761994048953056,0.019917109981179237,-0.025952190160751343,-0.015284334309399128,0.04133594408631325,-0.006913446821272373,-0.0751992017030716,-0.007628364488482475,-0.014486298896372318,-0.033884447067976,-0.016957661136984825,0.0448247566819191,0.01604662835597992,0.007609700784087181,0.008154635317623615,-0.00533099751919508,-0.02586086094379425,0.016466950997710228,0.0035343256313353777,-0.04004562273621559,-0.02621598355472088,-0.037004243582487106,0.016955647617578506,-0.026286613196134567,0.03221408277750015,-0.026854772120714188,0.044014643877744675,-0.015214542858302593,0.030236855149269104,-0.04690473899245262,0.0308533962816,0.11510993540287018,0.02394280396401882,-0.01818561926484108,-0.001206676010042429,0.006542480085045099,0.002912393305450678,-0.008799262344837189,0.03988172113895416,0.06337001919746399,0.040854692459106445,-0.007232926320284605,0.04963446781039238,-0.03459739685058594,-0.08878673613071442,0.0351296104490757,-0.0019927877001464367,0.003170620882883668,-0.018753904849290848,-0.003121723188087344,0.021427178755402565,0.028028516098856926,0.030290234833955765,0.03594290837645531,0.053385622799396515,-0.010249810293316841,-0.06970883905887604,-0.0029745567589998245,-0.026691505685448647,0.015914006158709526,0.016468023881316185,-0.033598776906728745,-0.00493394723162055,-0.00874021090567112,0.03275427222251892,-0.035924848169088364,-0.006248485762625933,0.03024951182305813,0.019729116931557655,-0.007928570732474327,-0.0027358673978596926,0.003675785381346941,0.004930681549012661,0.0642717257142067,0.02211795747280121,0.008867641910910606,0.007035518065094948,0.07822103053331375,0.0028624949045479298,-0.0386175811290741,0.01143663376569748,0.01343371719121933,-0.00717733521014452,-0.020467864349484444,-0.030543264001607895,-0.00660896860063076,-0.018578533083200455,0.005454564467072487,-0.03579827398061752,-0.0034431046806275845,0.0025669001042842865,-0.016686376184225082,0.035038240253925323,-0.04591481015086174,0.060693297535181046,-0.02289189025759697,0.0031844419427216053,-0.01635824516415596,0.008411344140768051,-0.01990020088851452,0.02725815214216709,0.0025580748915672302,0.037028633058071136,3.155527110720868e-7,-0.02848268859088421,0.01116104330867529,-0.026363568380475044,-0.033329546451568604,0.03983846306800842,-0.0437285415828228,-0.04720398783683777,-0.00988412369042635,0.03455989807844162,-0.02551991492509842,0.006204292178153992,0.027702778577804565,0.012033806182444096,-0.010333766229450703,0.00565391406416893,0.0011968706967309117,0.07305699586868286,0.004085898865014315,-0.06333045661449432,-0.03473827987909317,0.03239424154162407,0.021994033828377724,0.014569483697414398,-0.003045141464099288,0.02628207579255104,0.0007220978150144219,-0.0016221866244450212,-0.01706981100142002,-0.025748595595359802,-0.0025227514561265707,0.031181875616312027,-0.08371172845363617,-0.047470033168792725,-0.02837930992245674,0.008630115538835526,0.04963663965463638,-0.03729011490941048,-0.08692768961191177,-0.03501085564494133,0.02889907732605934,-0.00908717792481184,0.050098858773708344,0.013549991883337498,0.025100747123360634,0.020138157531619072,-0.010816805064678192,-0.00911678746342659,-0.01322650071233511,-0.03825479373335838,-0.020217426121234894,0.015171428211033344,0.05236032232642174,-0.0313153937458992,0.00019404535123612732,0.023459644988179207,0.02066124975681305,-0.006111981347203255,-0.011986887082457542,0.039926473051309586,0.02180831879377365,0.01741299405694008,-0.038534268736839294,0.0018283601384609938,0.10796574503183365,0.01795654371380806,-0.03589273989200592,0.01442108117043972,3.6153192013203337e-34,0.04274861887097359,0.03859667107462883,0.019998867064714432,0.04797469452023506,0.037721212953329086,-0.01488164346665144,0.004923148546367884,-0.0062334900721907616,0.015500135719776154,-0.028451593592762947,-0.01937568001449108]'
SET
  @EmbeddingModelID_7d70f031 = '1D45AA65-41EC-4572-9ECD-AB2826C9B059'
SET
  @Reusable_7d70f031 = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[Query] WHERE ID = @ID_7d70f031)
EXEC [__mj].spCreateQuery @ID = @ID_7d70f031,
  @Name = @Name_7d70f031,
  @CategoryID = @CategoryID_7d70f031,
  @CategoryID_Clear = 1,
  @UserQuestion = @UserQuestion_7d70f031,
  @UserQuestion_Clear = 1,
  @Description = @Description_7d70f031,
  @SQL = @SQL_7d70f031,
  @TechnicalDescription = @TechnicalDescription_7d70f031,
  @TechnicalDescription_Clear = 1,
  @OriginalSQL = @OriginalSQL_7d70f031,
  @OriginalSQL_Clear = 1,
  @Feedback = @Feedback_7d70f031,
  @Feedback_Clear = 1,
  @Status = @Status_7d70f031,
  @QualityRank = @QualityRank_7d70f031,
  @ExecutionCostRank = @ExecutionCostRank_7d70f031,
  @ExecutionCostRank_Clear = 1,
  @UsesTemplate = @UsesTemplate_7d70f031,
  @AuditQueryRuns = @AuditQueryRuns_7d70f031,
  @CacheEnabled = @CacheEnabled_7d70f031,
  @CacheTTLMinutes = @CacheTTLMinutes_7d70f031,
  @CacheTTLMinutes_Clear = 1,
  @CacheMaxSize = @CacheMaxSize_7d70f031,
  @CacheMaxSize_Clear = 1,
  @EmbeddingVector = @EmbeddingVector_7d70f031,
  @EmbeddingModelID = @EmbeddingModelID_7d70f031,
  @CacheValidationSQL = @CacheValidationSQL_7d70f031,
  @CacheValidationSQL_Clear = 1,
  @SQLDialectID = @SQLDialectID_7d70f031,
  @Reusable = @Reusable_7d70f031,
  @ExternalDataSourceID = @ExternalDataSourceID_7d70f031,
  @ExternalDataSourceID_Clear = 1;

GO

-- Save MJ: Queries (core SP call only)
DECLARE @ID_6a4f31b5 UNIQUEIDENTIFIER,
@Name_6a4f31b5 NVARCHAR(255),
@CategoryID_6a4f31b5 UNIQUEIDENTIFIER,
@UserQuestion_6a4f31b5 NVARCHAR(MAX),
@Description_6a4f31b5 NVARCHAR(MAX),
@SQL_6a4f31b5 NVARCHAR(MAX),
@TechnicalDescription_6a4f31b5 NVARCHAR(MAX),
@OriginalSQL_6a4f31b5 NVARCHAR(MAX),
@Feedback_6a4f31b5 NVARCHAR(MAX),
@Status_6a4f31b5 NVARCHAR(15),
@QualityRank_6a4f31b5 INT,
@ExecutionCostRank_6a4f31b5 INT,
@UsesTemplate_6a4f31b5 BIT,
@AuditQueryRuns_6a4f31b5 BIT,
@CacheEnabled_6a4f31b5 BIT,
@CacheTTLMinutes_6a4f31b5 INT,
@CacheMaxSize_6a4f31b5 INT,
@EmbeddingVector_6a4f31b5 NVARCHAR(MAX),
@EmbeddingModelID_6a4f31b5 UNIQUEIDENTIFIER,
@CacheValidationSQL_6a4f31b5 NVARCHAR(MAX),
@SQLDialectID_6a4f31b5 UNIQUEIDENTIFIER,
@Reusable_6a4f31b5 BIT,
@ExternalDataSourceID_6a4f31b5 UNIQUEIDENTIFIER
SET
  @ID_6a4f31b5 = '5044A100-0020-4000-8000-000000000003'
SET
  @Name_6a4f31b5 = N'Sonar: Score Movers'
SET
  @Description_6a4f31b5 = N'Biggest individual score movers between two snapshot days for a model: the top N risers and top N fallers by signed score change, with each member''s current score and band. Derived from history snapshots (not the stored Score.Delta, which a no-op re-run resets to zero). Powers the Overview ''biggest drops / gains'' lists at any look-back window.'
SET
  @SQL_6a4f31b5 = N'WITH snap AS (
    SELECT h.AnchorRecordID, h.BandID, h.NormalizedScore,
        CONVERT(date, COALESCE(h.AsOfDate, h.ComputedAt)) AS SnapshotDay,
        ROW_NUMBER() OVER (PARTITION BY h.AnchorRecordID, CONVERT(date, COALESCE(h.AsOfDate, h.ComputedAt)) ORDER BY h.AsOfDate DESC, h.ComputedAt DESC) AS rn
    FROM [${flyway:defaultSchema}].[ScoreHistory] h
    WHERE h.ScoreModelID = {{ ModelID | sqlString }}
      AND CONVERT(date, COALESCE(h.AsOfDate, h.ComputedAt)) IN ({{ FromDay | sqlString }}, {{ ToDay | sqlString }})
), diff AS (
    SELECT f.AnchorRecordID,
        ROUND(t.NormalizedScore, 0) - ROUND(f.NormalizedScore, 0) AS Delta,
        ROUND(t.NormalizedScore, 0) AS CurrentScore,
        t.BandID
    FROM snap f
    JOIN snap t ON t.AnchorRecordID = f.AnchorRecordID AND t.SnapshotDay = {{ ToDay | sqlString }} AND t.rn = 1
    WHERE f.SnapshotDay = {{ FromDay | sqlString }} AND f.rn = 1
      AND ROUND(t.NormalizedScore, 0) <> ROUND(f.NormalizedScore, 0)
), ranked AS (
    SELECT AnchorRecordID, Delta, CurrentScore, BandID,
        CASE WHEN Delta > 0 THEN ''riser'' ELSE ''faller'' END AS Direction,
        ROW_NUMBER() OVER (PARTITION BY CASE WHEN Delta > 0 THEN 1 ELSE 0 END ORDER BY ABS(Delta) DESC) AS rk
    FROM diff
)
SELECT r.AnchorRecordID, r.Delta, r.CurrentScore,
       CONVERT(varchar(36), r.BandID) AS BandID,
       ISNULL(b.Label, ''Unbanded'') AS BandLabel, r.Direction
FROM ranked r
LEFT JOIN [${flyway:defaultSchema}].[ScoreBand] b ON b.ID = r.BandID
WHERE r.rk <= {{ MaxEach | sqlNumber }}
ORDER BY r.Delta DESC'
SET
  @Status_6a4f31b5 = N'Approved'
SET
  @QualityRank_6a4f31b5 = 0
SET
  @UsesTemplate_6a4f31b5 = 0
SET
  @AuditQueryRuns_6a4f31b5 = 0
SET
  @CacheEnabled_6a4f31b5 = 0
SET
  @EmbeddingVector_6a4f31b5 = N'[-0.07814165204763412,0.027957571670413017,-0.020988311618566513,-0.032721441239118576,-0.010201364755630493,-0.056624844670295715,-0.003168276511132717,-0.012210643850266933,0.013591418042778969,0.03493879362940788,0.029180927202105522,0.020590417087078094,-0.006021822802722454,0.14358969032764435,-0.046741124242544174,-0.02604283019900322,0.011314067989587784,0.0005797886406071484,-0.08138532936573029,-0.018735423684120178,-0.037534311413764954,-0.0064993323758244514,-0.007929295301437378,-0.014233376830816269,0.03247394040226936,-0.01646789163351059,-0.019130749627947807,0.036886896938085556,0.03987092897295952,-0.09392222762107849,-0.0076062302105128765,0.015122112818062305,-0.024286776781082153,0.06090736389160156,0.0000024436369585600914,-0.003948078490793705,-0.023130342364311218,0.012373620644211769,-0.01668713428080082,0.009920496493577957,-0.00826574582606554,0.02968127653002739,-0.024472065269947052,-0.007964977994561195,-0.01707543432712555,0.006574944593012333,-0.07116974145174026,-0.08325149118900299,0.04122167080640793,0.009690292179584503,0.021000875160098076,-0.01881481520831585,-0.06793121993541718,-0.0008896910585463047,0.05035342276096344,-0.03191586956381798,0.015857193619012833,0.04918104037642479,-0.006714115850627422,-0.024831406772136688,-0.024194402620196342,0.010153407230973244,0.015870848670601845,-0.07299420237541199,0.0753428041934967,0.04521561786532402,0.023268792778253555,-0.0008179527358151972,-0.006193362642079592,0.006564496550709009,0.08189170807600021,0.025500299409031868,0.01429035048931837,-0.02648969553411007,-0.02488100528717041,-0.08127151429653168,-0.02201572060585022,-0.033838123083114624,0.002817584667354822,-0.026543455198407173,-0.050218015909194946,0.11177597939968109,-0.015552207827568054,0.005695707630366087,-0.053208157420158386,0.00731796957552433,-0.005606069695204496,-0.016054527834057808,0.0025697164237499237,-0.037371501326560974,0.035868898034095764,-0.0012899171561002731,-0.006123242434114218,-0.008239606395363808,-0.05802333727478981,0.016028882935643196,0.0557049922645092,-0.022484876215457916,0.014378254301846027,-0.013632016256451607,0.026818757876753807,-0.018007827922701836,0.007181903813034296,0.0531381331384182,0.017816072329878807,-0.008662240579724312,0.02695225365459919,-0.047422170639038086,-0.02490907348692417,0.06471510976552963,-0.00006735744682373479,-0.010118729434907436,0.07148703932762146,0.01968630962073803,0.033317361027002335,0.009975182823836803,-0.054394662380218506,-0.008832907304167747,-0.02924244850873947,-0.016866834834218025,0.07117267698049545,-0.0011551290517672896,-0.017554592341184616,0.028060991317033768,0.05985111743211746,0.0572129525244236,-0.00814872793853283,-0.04075778275728226,0.07275650650262833,0.010782315395772457,-0.013370048254728317,-0.037705980241298676,0.006046631373465061,0.004441858269274235,0.007162798196077347,-0.04575420916080475,0.01664016768336296,0.021042194217443466,0.03671986237168312,-0.013234666548669338,0.02608473226428032,-0.012013494968414307,-0.055402882397174835,0.022205183282494545,-0.019057011231780052,-0.03469797596335411,-0.016702478751540184,0.03937551751732826,0.0008626162307336926,0.017688719555735588,0.0024541299790143967,0.02348969876766205,0.0043408554047346115,0.011822621338069439,0.014241109602153301,0.014573459513485432,-0.026771416887640953,0.02014906518161297,0.010673017241060734,0.021919112652540207,0.006714743562042713,-0.026156531646847725,-0.06950899213552475,0.014266440644860268,-0.0003527210501488298,-0.023912711068987846,-0.09833455830812454,-0.03191700950264931,-0.03822891786694527,-0.015866892412304878,-0.004691327456384897,-0.04679922014474869,-0.004989457316696644,-0.003092583967372775,0.034303855150938034,0.003902875818312168,0.030991749837994576,0.030818400904536247,-0.04230574890971184,-0.054819732904434204,-0.05274206027388573,-0.11676186323165894,-0.010422978550195694,-0.008879190310835838,0.014654119499027729,-0.013720076531171799,-0.026401378214359283,-0.0007496149046346545,-0.010312727652490139,0.016340618953108788,0.017070919275283813,0.014068656601011753,-0.03905155137181282,0.022804714739322662,-0.0021256492473185062,0.014837277121841908,0.004986136220395565,0.0386299267411232,0.01631193235516548,0.012279687449336052,0.011949907056987286,-0.024958182126283646,-0.010910384356975555,-0.012812331318855286,0.026649409905076027,-0.0634814128279686,0.03719967231154442,0.0003419301356188953,-0.017931051552295685,-0.004279200453311205,0.02626541070640087,0.040047891438007355,-0.05311965569853783,-0.011487641371786594,0.0021893715020269156,0.08599348366260529,0.002294332953169942,0.009929032064974308,-0.0756777748465538,0.01461645308881998,-0.016272597014904022,-0.005735038314014673,-0.0690252035856247,-0.008322115056216717,0.06556683778762817,0.07485596835613251,0.020955685526132584,-0.0411161370575428,0.008477599360048771,0.016182733699679375,0.01738368719816208,0.008164291270077229,0.046956174075603485,0.005085775163024664,-0.018249228596687317,0.0335867665708065,0.0231582373380661,0.03958722949028015,-0.012126530520617962,0.061651572585105896,0.027533071115612984,0.011303936131298542,-0.056660931557416916,0.021667568013072014,0.034504424780607224,0.014606750570237637,-0.13641883432865143,0.016870848834514618,-0.0019768071360886097,0.008488046005368233,-0.020531805232167244,0.02894170582294464,0.07422980666160583,-0.03438796475529671,0.012462368234992027,-0.0885068029165268,0.0009863708401098847,-0.014495923183858395,-0.0019220984540879726,0.07409361749887466,0.05194791406393051,-0.029901575297117233,-0.03734990209341049,-0.013571885414421558,0.018425319343805313,-0.04181760177016258,0.026688227429986,-0.006921643391251564,0.0015642833895981312,0.008698702789843082,0.06236798316240311,-0.025089722126722336,0.016003398224711418,0.014015312306582928,0.01843101717531681,0.023785993456840515,-0.07969669997692108,0.0092964181676507,-0.00038559158565476537,-0.015070692636072636,-0.0021402048878371716,0.000181120092747733,-0.019798196852207184,-0.0005989862838760018,0.014665164053440094,0.0316491536796093,0.07573391497135162,-0.026552127674221992,-0.03216366842389107,-0.03858843073248863,-0.05274840444326401,-0.05130947008728981,-0.02207077108323574,-0.014254821464419365,0.002686762250959873,-0.008416101336479187,0.02294241264462471,0.11895105987787247,0.051527757197618484,0.09904303401708603,-0.005153435282409191,-0.004808012396097183,-0.01148989051580429,-0.005361668299883604,-0.02605605684220791,0.016518861055374146,-0.021431785076856613,-0.0446474514901638,-0.01756708323955536,0.09642602503299713,0.00019147180137224495,0.015067939646542072,0.01972384564578533,-0.02066914178431034,-0.035821497440338135,-0.03541945666074753,0.007270136848092079,0.019790954887866974,-0.09337277710437775,0.03948060795664787,0.023774422705173492,-0.0066739642061293125,-0.02971273846924305,0.08753412961959839,-0.0056341784074902534,-0.016412915661931038,-0.007147841155529022,-0.028177058324217796,-0.002417505020275712,-0.025111623108386993,0.02488437108695507,-0.008112992160022259,-0.03452632948756218,0.042166586965322495,-0.058881476521492004,-0.004490239080041647,-0.07284267991781235,-0.06649498641490936,-0.020200764760375023,0.02616400085389614,-0.017374036833643913,-0.017749909311532974,0.02530297264456749,-0.005219009704887867,0.01661156304180622,-0.0026379269547760487,-0.026372548192739487,0.018967757001519203,-0.02434578910470009,-0.00461365794762969,0.008168297819793224,-0.009768562391400337,-0.026739204302430153,-0.019276471808552742,-0.016406415030360222,-0.0031526219099760056,-0.027838746085762978,-0.014448408968746662,-0.011662749573588371,-0.0691460445523262,0.020104963332414627,0.016900990158319473,0.10270784050226212,0.023638738319277763,-0.003696173196658492,0.001247267471626401,0.008157022297382355,-0.020840097218751907,0.024626068770885468,-0.013194025494158268,0.015140306204557419,-0.005568855907768011,0.021221144124865532,0.021220918744802475,-0.006394128315150738,-0.008515526540577412,0.019036494195461273,0.02027522586286068,0.05011461675167084,0.006341839209198952,-0.0016484103398397565,-0.005328724160790443,0.05583120882511139,-0.026425443589687347,0.05666026100516319,-0.020017843693494797,-0.04948023334145546,-0.03345565125346184,-0.02904656156897545,0.05657117813825607,0.014716501347720623,-0.01762312650680542,0.07951677590608597,-0.00451395520940423,-0.0003594198205973953,-0.0400485023856163,-0.06409134715795517,0.008746203035116196,0.004574289545416832,0.010114850476384163,0.032384902238845825,0.05125490203499794,0.03571266308426857,0.041094597429037094,-0.016352860257029533,-0.028013935312628746,0.028934555128216743,0.028520524501800537,-0.03727157041430473,0.03344260901212692,-0.008472518064081669,-0.04355023056268692,0.01610802300274372,-0.03554752469062805,0.013425314798951149,-0.00020956939260941,-0.0003066783829126507,0.0030903101433068514,0.002345920540392399,0.013266527093946934,0.062241096049547195,0.020300716161727905,0.024284901097416878,0.0367150641977787,-0.004197343718260527,-0.004893436562269926,0.03650201857089996,-0.044574663043022156,0.010493435896933079,-0.008878448978066444,0.012864219956099987,0.041324082762002945,-0.003580109216272831,0.08447016030550003,-0.01723748818039894,-0.08776036649942398,-0.0121019147336483,0.026482196524739265,0.018786191940307617,-0.003148297779262066,-0.01831122860312462,-0.03215406835079193,0.06481802463531494,-0.03911072015762329,0.046206261962652206,-0.02460022084414959,-0.0376613475382328,0.004103115759789944,-0.028851205483078957,-0.03110634721815586,0.025903748348355293,0.026304807513952255,0.006543823983520269,0.044836319983005524,0.053664665669202805,-0.02708570472896099,-0.03137893229722977,-0.05691446736454964,-0.016121644526720047,0.013766508549451828,0.034726060926914215,0.04239260032773018,-0.058336175978183746,0.0210413821041584,0.04464433342218399,0.01308000460267067,0.022601762786507607,0.05182703956961632,0.011121946386992931,-0.035075947642326355,-0.026440216228365898,-0.034213416278362274,-0.015339183621108532,-0.029994066804647446,0.033369243144989014,-0.0008828329155221581,0.012664847075939178,0.013658362440764904,0.05083389952778816,-0.007416100241243839,-0.020835136994719505,-0.014679309912025928,0.020576633512973785,-0.056194182485342026,-0.010033986531198025,0.037591602653265,-0.052088428288698196,0.002246548654511571,-0.01171904057264328,0.010233372449874878,0.031082957983016968,-0.04522855207324028,-0.04702676460146904,0.06862308830022812,-0.0007281260332092643,0.010364177636802197,-0.06331790238618851,0.025304429233074188,-0.0030532788950949907,0.03365449979901314,-0.011478190310299397,0.009691281244158745,-0.024290062487125397,-0.05622302368283272,0.026927392929792404,0.05071815103292465,0.05452585220336914,-0.006773484870791435,0.02780153602361679,-0.0029546674340963364,0.009834765456616879,0.0009742274996824563,-0.018201062455773354,-0.036211445927619934,0.00805160403251648,-0.08770433068275452,-0.042750973254442215,0.08996130526065826,0.04327669367194176,0.030626831576228142,0.009898485615849495,-0.01667446829378605,-0.0025592204183340073,0.013962887227535248,0.029074640944600105,-0.040930069983005524,0.031054310500621796,0.013671636581420898,0.061343833804130554,0.02914835326373577,-0.004025958012789488,0.007541360799223185,0.006312129553407431,0.03720152750611305,-0.0050317975692451,0.01346913818269968,-0.03104294277727604,-0.01747625321149826,0.0460503026843071,-0.0446496345102787,-0.09103980660438538,0.014431298710405827,0.04179265350103378,0.011340058408677578,0.056803639978170395,0.02015557326376438,0.01981045864522457,-0.04041634127497673,0.003052414394915104,0.03732611984014511,0.02683766931295395,-0.03598688170313835,-0.13353200256824493,-0.035083673894405365,-0.031177956610918045,-7.915945731698307e-33,-0.056661415845155716,-0.016883041709661484,-0.030352987349033356,-0.013023676350712776,-0.07671540230512619,0.014121706597507,-0.009213089942932129,-0.07156898826360703,-0.017661670222878456,-0.03231560066342354,-0.009439006447792053,0.02196948044002056,0.038233209401369095,-0.021241145208477974,0.03759414330124855,-0.0007474917219951749,0.028392497450113297,-0.03635188192129135,-0.0006325055728666484,0.0470842681825161,-0.0018528301734477282,0.042397793382406235,0.010722546838223934,0.014308277517557144,-0.014342489652335644,0.0024690204299986362,-0.052475836127996445,0.015303360298275948,-0.055601879954338074,-0.03673817217350006,0.050009649246931076,-0.0015441718278452754,-0.0074634975753724575,-0.002166472841054201,0.0038048934657126665,-0.11386559158563614,-0.02498687617480755,-0.0009863954037427902,-0.011019169352948666,-0.031856469810009,0.04947681725025177,0.03752424567937851,0.006860966328531504,0.000046605244278907776,-0.0026937639340758324,-0.06431149691343307,0.020481051877141,0.016988353803753853,-0.04804046079516411,-0.051801830530166626,0.02619774639606476,0.02211286500096321,-0.019086046144366264,0.04516300559043884,-0.04879153147339821,-0.013520434498786926,0.030149273574352264,0.02217772789299488,-0.0028580185025930405,0.019744278863072395,0.07165589928627014,0.0446130596101284,-0.0018111167009919882,0.037077222019433975,0.01287496741861105,0.03137325122952461,0.04251498356461525,0.04766689985990524,0.13775435090065002,-0.05609570071101189,-0.02481016330420971,0.030720459297299385,-0.03258785232901573,-0.04627396538853645,0.06494191288948059,0.002431461587548256,-0.0029877335764467716,-0.010939119383692741,0.07181008160114288,0.0008080489933490753,-0.008447971194982529,0.016159292310476303,-0.022318828850984573,0.03267216309905052,-0.010096072219312191,-0.0683586373925209,-0.024361152201890945,-0.04725842550396919,0.016644267365336418,0.031228454783558846,-0.024201851338148117,0.01531094778329134,-0.02770387940108776,0.023409787565469742,-0.020807571709156036,-0.018381692469120026,0.06104276701807976,0.02752275951206684,-0.03797841817140579,-0.028706975281238556,0.042906615883111954,0.018372323364019394,0.06165038049221039,-0.001529046567156911,0.016884248703718185,0.0035808344837278128,-0.018955010920763016,0.015280770137906075,-0.010220130905508995,0.0017331764101982117,0.030270373448729515,-0.009949211031198502,-0.029286371544003487,-0.012365134432911873,0.019188184291124344,-0.03659328073263168,-0.013918424025177956,0.026975523680448532,0.0336906835436821,0.07260508090257645,-0.016272516921162605,0.04527156054973602,-0.006220237817615271,0.052985597401857376,0.00027394553762860596,-0.0007989104487933218,0.04979478195309639,-0.0098827313631773,-0.03322383016347885,0.018872134387493134,-0.02365201711654663,0.014885465614497662,3.332397113808838e-7,0.00801370944827795,0.03757912665605545,-0.0034487168304622173,0.00952430721372366,0.049233097583055496,0.026367710903286934,-0.018684087321162224,-0.002579574240371585,0.0586080439388752,-0.004087838344275951,0.0001822798658395186,-0.017172742635011673,0.031932324171066284,0.010168618522584438,0.014814559370279312,-0.0005332056898623705,0.01588503085076809,-0.05106295272707939,-0.05366622284054756,-0.045254942029714584,0.06364622712135315,-0.03257359564304352,0.017132841050624847,-0.01760324276983738,-0.021208498626947403,-0.008718336932361126,0.009823013097047806,-0.02387511357665062,-0.04705829545855522,-0.02942885458469391,0.058885782957077026,-0.07618112862110138,-0.03749985620379448,-0.0363655611872673,0.005159576423466206,0.029067497700452805,0.00035255809780210257,-0.05203040689229965,-0.013420727103948593,-0.004847170785069466,-0.026688730344176292,0.06232810392975807,-0.009091775864362717,0.011034581810235977,0.012788467109203339,-0.04953351616859436,-0.039037223905324936,-0.034121107310056686,-0.10217417031526566,-0.042598906904459,0.01232677698135376,0.006328181829303503,-0.019834909588098526,0.041624076664447784,0.0032727255020290613,0.016173189505934715,-0.009796162135899067,0.007657953538000584,0.0003065454075112939,-0.019442623481154442,-0.007314969319850206,-0.03447738289833069,0.012869356200098991,0.06263856589794159,-0.025545326992869377,-0.016602544113993645,-0.02370450086891651,3.4702051124775435e-34,0.0268695205450058,0.012560085393488407,0.006013844162225723,0.029891375452280045,0.021649718284606934,0.005094739142805338,-0.017859749495983124,0.00012860741117037833,-0.009504236280918121,-0.019271664321422577,-0.02921247109770775]'
SET
  @EmbeddingModelID_6a4f31b5 = '1D45AA65-41EC-4572-9ECD-AB2826C9B059'
SET
  @Reusable_6a4f31b5 = 0
IF NOT EXISTS (SELECT 1 FROM [__mj].[Query] WHERE ID = @ID_6a4f31b5)
EXEC [__mj].spCreateQuery @ID = @ID_6a4f31b5,
  @Name = @Name_6a4f31b5,
  @CategoryID = @CategoryID_6a4f31b5,
  @CategoryID_Clear = 1,
  @UserQuestion = @UserQuestion_6a4f31b5,
  @UserQuestion_Clear = 1,
  @Description = @Description_6a4f31b5,
  @SQL = @SQL_6a4f31b5,
  @TechnicalDescription = @TechnicalDescription_6a4f31b5,
  @TechnicalDescription_Clear = 1,
  @OriginalSQL = @OriginalSQL_6a4f31b5,
  @OriginalSQL_Clear = 1,
  @Feedback = @Feedback_6a4f31b5,
  @Feedback_Clear = 1,
  @Status = @Status_6a4f31b5,
  @QualityRank = @QualityRank_6a4f31b5,
  @ExecutionCostRank = @ExecutionCostRank_6a4f31b5,
  @ExecutionCostRank_Clear = 1,
  @UsesTemplate = @UsesTemplate_6a4f31b5,
  @AuditQueryRuns = @AuditQueryRuns_6a4f31b5,
  @CacheEnabled = @CacheEnabled_6a4f31b5,
  @CacheTTLMinutes = @CacheTTLMinutes_6a4f31b5,
  @CacheTTLMinutes_Clear = 1,
  @CacheMaxSize = @CacheMaxSize_6a4f31b5,
  @CacheMaxSize_Clear = 1,
  @EmbeddingVector = @EmbeddingVector_6a4f31b5,
  @EmbeddingModelID = @EmbeddingModelID_6a4f31b5,
  @CacheValidationSQL = @CacheValidationSQL_6a4f31b5,
  @CacheValidationSQL_Clear = 1,
  @SQLDialectID = @SQLDialectID_6a4f31b5,
  @Reusable = @Reusable_6a4f31b5,
  @ExternalDataSourceID = @ExternalDataSourceID_6a4f31b5,
  @ExternalDataSourceID_Clear = 1;

GO

-- Save MJ: Query Parameters (core SP call only)
DECLARE @ID_db384856 UNIQUEIDENTIFIER,
@QueryID_db384856 UNIQUEIDENTIFIER,
@Name_db384856 NVARCHAR(255),
@Type_db384856 NVARCHAR(50),
@IsRequired_db384856 BIT,
@DefaultValue_db384856 NVARCHAR(MAX),
@Description_db384856 NVARCHAR(MAX),
@SampleValue_db384856 NVARCHAR(MAX),
@ValidationFilters_db384856 NVARCHAR(MAX),
@DetectionMethod_db384856 NVARCHAR(50),
@AutoDetectConfidenceScore_db384856 DECIMAL(3, 2)
SET
  @ID_db384856 = '5b4067c2-4383-4133-9475-e9e108ff2253'
SET
  @QueryID_db384856 = '5044A100-0020-4000-8000-000000000001'
SET
  @Name_db384856 = N'ModelID'
SET
  @Type_db384856 = N'string'
SET
  @IsRequired_db384856 = 1
SET
  @Description_db384856 = N'The unique identifier of the Score Model to filter the score history records.'
SET
  @SampleValue_db384856 = N'e4f8d2b1-6c3a-4f9e-8d7c-2b1a5c3d4e5f'
SET
  @DetectionMethod_db384856 = N'AI' IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryParameter] WHERE ID = @ID_db384856)
EXEC [__mj].spCreateQueryParameter @ID = @ID_db384856,
  @QueryID = @QueryID_db384856,
  @Name = @Name_db384856,
  @Type = @Type_db384856,
  @IsRequired = @IsRequired_db384856,
  @DefaultValue = @DefaultValue_db384856,
  @DefaultValue_Clear = 1,
  @Description = @Description_db384856,
  @SampleValue = @SampleValue_db384856,
  @ValidationFilters = @ValidationFilters_db384856,
  @ValidationFilters_Clear = 1,
  @DetectionMethod = @DetectionMethod_db384856,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_db384856,
  @AutoDetectConfidenceScore_Clear = 1;

GO

-- Save MJ: Query Entities (core SP call only)
DECLARE @ID_b4c64d4f UNIQUEIDENTIFIER,
@QueryID_b4c64d4f UNIQUEIDENTIFIER,
@EntityID_b4c64d4f UNIQUEIDENTIFIER,
@DetectionMethod_b4c64d4f NVARCHAR(50),
@AutoDetectConfidenceScore_b4c64d4f DECIMAL(3, 2)
SET
  @ID_b4c64d4f = '3882cef0-cbe6-4f05-a431-b5d829a34d6c'
SET
  @QueryID_b4c64d4f = '5044A100-0020-4000-8000-000000000001'
SET
  @EntityID_b4c64d4f = '1F1CBA7E-F548-420E-9B71-30891E454C42'
SET
  @DetectionMethod_b4c64d4f = N'AI'
SET
  @AutoDetectConfidenceScore_b4c64d4f = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryEntity] WHERE ID = @ID_b4c64d4f)
EXEC [__mj].spCreateQueryEntity @ID = @ID_b4c64d4f,
  @QueryID = @QueryID_b4c64d4f,
  @EntityID = @EntityID_b4c64d4f,
  @DetectionMethod = @DetectionMethod_b4c64d4f,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_b4c64d4f;

GO

-- Save MJ: Query Entities (core SP call only)
DECLARE @ID_9df1634a UNIQUEIDENTIFIER,
@QueryID_9df1634a UNIQUEIDENTIFIER,
@EntityID_9df1634a UNIQUEIDENTIFIER,
@DetectionMethod_9df1634a NVARCHAR(50),
@AutoDetectConfidenceScore_9df1634a DECIMAL(3, 2)
SET
  @ID_9df1634a = 'fb58b767-1fc1-44b1-8465-0a04918d072f'
SET
  @QueryID_9df1634a = '5044A100-0020-4000-8000-000000000001'
SET
  @EntityID_9df1634a = '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A'
SET
  @DetectionMethod_9df1634a = N'AI'
SET
  @AutoDetectConfidenceScore_9df1634a = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryEntity] WHERE ID = @ID_9df1634a)
EXEC [__mj].spCreateQueryEntity @ID = @ID_9df1634a,
  @QueryID = @QueryID_9df1634a,
  @EntityID = @EntityID_9df1634a,
  @DetectionMethod = @DetectionMethod_9df1634a,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_9df1634a;

GO

-- Save MJ: Query Fields (core SP call only)
DECLARE @ID_0cdf4d29 UNIQUEIDENTIFIER,
@QueryID_0cdf4d29 UNIQUEIDENTIFIER,
@Name_0cdf4d29 NVARCHAR(255),
@Description_0cdf4d29 NVARCHAR(MAX),
@Sequence_0cdf4d29 INT,
@SQLBaseType_0cdf4d29 NVARCHAR(50),
@SQLFullType_0cdf4d29 NVARCHAR(100),
@SourceEntityID_0cdf4d29 UNIQUEIDENTIFIER,
@SourceFieldName_0cdf4d29 NVARCHAR(255),
@IsComputed_0cdf4d29 BIT,
@ComputationDescription_0cdf4d29 NVARCHAR(MAX),
@IsSummary_0cdf4d29 BIT,
@SummaryDescription_0cdf4d29 NVARCHAR(MAX),
@DetectionMethod_0cdf4d29 NVARCHAR(50),
@AutoDetectConfidenceScore_0cdf4d29 DECIMAL(3, 2)
SET
  @ID_0cdf4d29 = '8f96315f-b532-4ced-af9a-4ef0ecb8b320'
SET
  @QueryID_0cdf4d29 = '5044A100-0020-4000-8000-000000000001'
SET
  @Name_0cdf4d29 = N'SnapshotDay'
SET
  @Description_0cdf4d29 = N'The date of the score history snapshot formatted as YYYY-MM-DD.'
SET
  @Sequence_0cdf4d29 = 1
SET
  @SQLBaseType_0cdf4d29 = N'nvarchar'
SET
  @SQLFullType_0cdf4d29 = N'nvarchar(MAX)'
SET
  @IsComputed_0cdf4d29 = 1
SET
  @ComputationDescription_0cdf4d29 = N'CONVERT(varchar(10), COALESCE(h.AsOfDate, h.ComputedAt), 23) to extract and format the snapshot date.'
SET
  @IsSummary_0cdf4d29 = 0
SET
  @DetectionMethod_0cdf4d29 = N'Manual' IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryField] WHERE ID = @ID_0cdf4d29)
EXEC [__mj].spCreateQueryField @ID = @ID_0cdf4d29,
  @QueryID = @QueryID_0cdf4d29,
  @Name = @Name_0cdf4d29,
  @Description = @Description_0cdf4d29,
  @Sequence = @Sequence_0cdf4d29,
  @SQLBaseType = @SQLBaseType_0cdf4d29,
  @SQLFullType = @SQLFullType_0cdf4d29,
  @SourceEntityID = @SourceEntityID_0cdf4d29,
  @SourceEntityID_Clear = 1,
  @SourceFieldName = @SourceFieldName_0cdf4d29,
  @SourceFieldName_Clear = 1,
  @IsComputed = @IsComputed_0cdf4d29,
  @ComputationDescription = @ComputationDescription_0cdf4d29,
  @IsSummary = @IsSummary_0cdf4d29,
  @SummaryDescription = @SummaryDescription_0cdf4d29,
  @SummaryDescription_Clear = 1,
  @DetectionMethod = @DetectionMethod_0cdf4d29,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_0cdf4d29,
  @AutoDetectConfidenceScore_Clear = 1;

GO

-- Save MJ: Query Fields (core SP call only)
DECLARE @ID_202386c2 UNIQUEIDENTIFIER,
@QueryID_202386c2 UNIQUEIDENTIFIER,
@Name_202386c2 NVARCHAR(255),
@Description_202386c2 NVARCHAR(MAX),
@Sequence_202386c2 INT,
@SQLBaseType_202386c2 NVARCHAR(50),
@SQLFullType_202386c2 NVARCHAR(100),
@SourceEntityID_202386c2 UNIQUEIDENTIFIER,
@SourceFieldName_202386c2 NVARCHAR(255),
@IsComputed_202386c2 BIT,
@ComputationDescription_202386c2 NVARCHAR(MAX),
@IsSummary_202386c2 BIT,
@SummaryDescription_202386c2 NVARCHAR(MAX),
@DetectionMethod_202386c2 NVARCHAR(50),
@AutoDetectConfidenceScore_202386c2 DECIMAL(3, 2)
SET
  @ID_202386c2 = '8ef95a05-407a-4df7-a969-0ae04286195f'
SET
  @QueryID_202386c2 = '5044A100-0020-4000-8000-000000000001'
SET
  @Name_202386c2 = N'BandID'
SET
  @Description_202386c2 = N'The string representation of the Score Band''s uniqueidentifier.'
SET
  @Sequence_202386c2 = 2
SET
  @SQLBaseType_202386c2 = N'uniqueidentifier'
SET
  @SQLFullType_202386c2 = N'uniqueidentifier'
SET
  @SourceEntityID_202386c2 = '1F1CBA7E-F548-420E-9B71-30891E454C42'
SET
  @SourceFieldName_202386c2 = N'BandID'
SET
  @IsComputed_202386c2 = 1
SET
  @ComputationDescription_202386c2 = N'CONVERT(varchar(36), s.BandID) to cast the uniqueidentifier to a string format.'
SET
  @IsSummary_202386c2 = 0
SET
  @DetectionMethod_202386c2 = N'Manual' IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryField] WHERE ID = @ID_202386c2)
EXEC [__mj].spCreateQueryField @ID = @ID_202386c2,
  @QueryID = @QueryID_202386c2,
  @Name = @Name_202386c2,
  @Description = @Description_202386c2,
  @Sequence = @Sequence_202386c2,
  @SQLBaseType = @SQLBaseType_202386c2,
  @SQLFullType = @SQLFullType_202386c2,
  @SourceEntityID = @SourceEntityID_202386c2,
  @SourceFieldName = @SourceFieldName_202386c2,
  @IsComputed = @IsComputed_202386c2,
  @ComputationDescription = @ComputationDescription_202386c2,
  @IsSummary = @IsSummary_202386c2,
  @SummaryDescription = @SummaryDescription_202386c2,
  @SummaryDescription_Clear = 1,
  @DetectionMethod = @DetectionMethod_202386c2,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_202386c2,
  @AutoDetectConfidenceScore_Clear = 1;

GO

-- Save MJ: Query Fields (core SP call only)
DECLARE @ID_173eade0 UNIQUEIDENTIFIER,
@QueryID_173eade0 UNIQUEIDENTIFIER,
@Name_173eade0 NVARCHAR(255),
@Description_173eade0 NVARCHAR(MAX),
@Sequence_173eade0 INT,
@SQLBaseType_173eade0 NVARCHAR(50),
@SQLFullType_173eade0 NVARCHAR(100),
@SourceEntityID_173eade0 UNIQUEIDENTIFIER,
@SourceFieldName_173eade0 NVARCHAR(255),
@IsComputed_173eade0 BIT,
@ComputationDescription_173eade0 NVARCHAR(MAX),
@IsSummary_173eade0 BIT,
@SummaryDescription_173eade0 NVARCHAR(MAX),
@DetectionMethod_173eade0 NVARCHAR(50),
@AutoDetectConfidenceScore_173eade0 DECIMAL(3, 2)
SET
  @ID_173eade0 = 'eb21510f-282c-4a28-b2a3-249144f5d638'
SET
  @QueryID_173eade0 = '5044A100-0020-4000-8000-000000000001'
SET
  @Name_173eade0 = N'BandLabel'
SET
  @Description_173eade0 = N'The descriptive label of the score band, defaulting to ''Unbanded'' if no matching band is found.'
SET
  @Sequence_173eade0 = 3
SET
  @SQLBaseType_173eade0 = N'nvarchar'
SET
  @SQLFullType_173eade0 = N'nvarchar(MAX)'
SET
  @IsComputed_173eade0 = 1
SET
  @ComputationDescription_173eade0 = N'ISNULL(b.Label, ''Unbanded'') to handle null values from the LEFT JOIN.'
SET
  @IsSummary_173eade0 = 0
SET
  @DetectionMethod_173eade0 = N'Manual' IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryField] WHERE ID = @ID_173eade0)
EXEC [__mj].spCreateQueryField @ID = @ID_173eade0,
  @QueryID = @QueryID_173eade0,
  @Name = @Name_173eade0,
  @Description = @Description_173eade0,
  @Sequence = @Sequence_173eade0,
  @SQLBaseType = @SQLBaseType_173eade0,
  @SQLFullType = @SQLFullType_173eade0,
  @SourceEntityID = @SourceEntityID_173eade0,
  @SourceEntityID_Clear = 1,
  @SourceFieldName = @SourceFieldName_173eade0,
  @SourceFieldName_Clear = 1,
  @IsComputed = @IsComputed_173eade0,
  @ComputationDescription = @ComputationDescription_173eade0,
  @IsSummary = @IsSummary_173eade0,
  @SummaryDescription = @SummaryDescription_173eade0,
  @SummaryDescription_Clear = 1,
  @DetectionMethod = @DetectionMethod_173eade0,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_173eade0,
  @AutoDetectConfidenceScore_Clear = 1;

GO

-- Save MJ: Query Fields (core SP call only)
DECLARE @ID_b3c7321f UNIQUEIDENTIFIER,
@QueryID_b3c7321f UNIQUEIDENTIFIER,
@Name_b3c7321f NVARCHAR(255),
@Description_b3c7321f NVARCHAR(MAX),
@Sequence_b3c7321f INT,
@SQLBaseType_b3c7321f NVARCHAR(50),
@SQLFullType_b3c7321f NVARCHAR(100),
@SourceEntityID_b3c7321f UNIQUEIDENTIFIER,
@SourceFieldName_b3c7321f NVARCHAR(255),
@IsComputed_b3c7321f BIT,
@ComputationDescription_b3c7321f NVARCHAR(MAX),
@IsSummary_b3c7321f BIT,
@SummaryDescription_b3c7321f NVARCHAR(MAX),
@DetectionMethod_b3c7321f NVARCHAR(50),
@AutoDetectConfidenceScore_b3c7321f DECIMAL(3, 2)
SET
  @ID_b3c7321f = '8adfea1f-8669-45ac-afcd-d305b71639f7'
SET
  @QueryID_b3c7321f = '5044A100-0020-4000-8000-000000000001'
SET
  @Name_b3c7321f = N'MemberCount'
SET
  @Description_b3c7321f = N'The total number of members belonging to this score band on the snapshot day.'
SET
  @Sequence_b3c7321f = 4
SET
  @SQLBaseType_b3c7321f = N'decimal'
SET
  @SQLFullType_b3c7321f = N'decimal(18,2)'
SET
  @IsComputed_b3c7321f = 1
SET
  @ComputationDescription_b3c7321f = N'COUNT(*) aggregate counting all records in each group.'
SET
  @IsSummary_b3c7321f = 1
SET
  @DetectionMethod_b3c7321f = N'Manual' IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryField] WHERE ID = @ID_b3c7321f)
EXEC [__mj].spCreateQueryField @ID = @ID_b3c7321f,
  @QueryID = @QueryID_b3c7321f,
  @Name = @Name_b3c7321f,
  @Description = @Description_b3c7321f,
  @Sequence = @Sequence_b3c7321f,
  @SQLBaseType = @SQLBaseType_b3c7321f,
  @SQLFullType = @SQLFullType_b3c7321f,
  @SourceEntityID = @SourceEntityID_b3c7321f,
  @SourceEntityID_Clear = 1,
  @SourceFieldName = @SourceFieldName_b3c7321f,
  @SourceFieldName_Clear = 1,
  @IsComputed = @IsComputed_b3c7321f,
  @ComputationDescription = @ComputationDescription_b3c7321f,
  @IsSummary = @IsSummary_b3c7321f,
  @SummaryDescription = @SummaryDescription_b3c7321f,
  @SummaryDescription_Clear = 1,
  @DetectionMethod = @DetectionMethod_b3c7321f,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_b3c7321f,
  @AutoDetectConfidenceScore_Clear = 1;

GO

-- Save MJ: Queries (core SP call only)
DECLARE @Name_0dbef766 NVARCHAR(255),
@CategoryID_0dbef766 UNIQUEIDENTIFIER,
@UserQuestion_0dbef766 NVARCHAR(MAX),
@Description_0dbef766 NVARCHAR(MAX),
@SQL_0dbef766 NVARCHAR(MAX),
@TechnicalDescription_0dbef766 NVARCHAR(MAX),
@OriginalSQL_0dbef766 NVARCHAR(MAX),
@Feedback_0dbef766 NVARCHAR(MAX),
@Status_0dbef766 NVARCHAR(15),
@QualityRank_0dbef766 INT,
@ExecutionCostRank_0dbef766 INT,
@UsesTemplate_0dbef766 BIT,
@AuditQueryRuns_0dbef766 BIT,
@CacheEnabled_0dbef766 BIT,
@CacheTTLMinutes_0dbef766 INT,
@CacheMaxSize_0dbef766 INT,
@EmbeddingVector_0dbef766 NVARCHAR(MAX),
@EmbeddingModelID_0dbef766 UNIQUEIDENTIFIER,
@CacheValidationSQL_0dbef766 NVARCHAR(MAX),
@SQLDialectID_0dbef766 UNIQUEIDENTIFIER,
@Reusable_0dbef766 BIT,
@ExternalDataSourceID_0dbef766 UNIQUEIDENTIFIER,
@ID_0dbef766 UNIQUEIDENTIFIER
SET
  @Name_0dbef766 = N'Sonar: Band Trend'
SET
  @Description_0dbef766 = N'Per-recompute band mix for a model: one row per (snapshot day, band) with the member count. Deduped per member per day (a same-day re-run writes two history rows; the later one wins). Powers the Overview trend chart and its list of comparable snapshot days.'
SET
  @SQL_0dbef766 = N'WITH snap AS (
    SELECT h.AnchorRecordID, h.BandID,
        CONVERT(date, COALESCE(h.AsOfDate, h.ComputedAt)) AS SnapshotDay,
        ROW_NUMBER() OVER (PARTITION BY h.AnchorRecordID, CONVERT(date, COALESCE(h.AsOfDate, h.ComputedAt)) ORDER BY h.AsOfDate DESC, h.ComputedAt DESC) AS rn
    FROM [${flyway:defaultSchema}].[ScoreHistory] h
    WHERE h.ScoreModelID = {{ ModelID | sqlString }}
)
SELECT CONVERT(varchar(10), s.SnapshotDay, 23) AS SnapshotDay,
       CONVERT(varchar(36), s.BandID) AS BandID,
       ISNULL(b.Label, ''Unbanded'') AS BandLabel,
       COUNT(*) AS MemberCount
FROM snap s
LEFT JOIN [${flyway:defaultSchema}].[ScoreBand] b ON b.ID = s.BandID
WHERE s.rn = 1
GROUP BY s.SnapshotDay, s.BandID, ISNULL(b.Label, ''Unbanded'')
ORDER BY s.SnapshotDay ASC'
SET
  @Status_0dbef766 = N'Approved'
SET
  @QualityRank_0dbef766 = 0
SET
  @UsesTemplate_0dbef766 = 1
SET
  @AuditQueryRuns_0dbef766 = 0
SET
  @CacheEnabled_0dbef766 = 0
SET
  @EmbeddingVector_0dbef766 = N'[-0.04499358311295509,0.02223694510757923,-0.043631527572870255,-0.0894920751452446,-0.01469550933688879,-0.03649837151169777,0.031651780009269714,-0.018571166321635246,-0.025727907195687294,0.07517273724079132,0.02343270555138588,-0.014207972213625908,-0.017487403005361557,0.07822726666927338,-0.007705961354076862,-0.029204977676272392,0.02946588024497032,-0.01829756610095501,-0.048085544258356094,-0.0012328047305345535,-0.018219413235783577,-0.0378682017326355,0.0012555266730487347,-0.033443696796894073,-0.0029276476707309484,-0.0034676529467105865,-0.04038979485630989,0.011583720333874226,0.015196426771581173,-0.1321246325969696,0.00029387083486653864,0.0517391711473465,0.00944662094116211,0.030322087928652763,0.0000020721445253002457,0.0050923763774335384,-0.023870088160037994,0.0023439882788807154,-0.035780102014541626,0.022235669195652008,0.04435989633202553,-0.005222524981945753,-0.036947108805179596,-0.018021397292613983,0.0055703273974359035,0.024029426276683807,-0.0610242635011673,-0.022077417001128197,0.028173351660370827,-0.032707326114177704,0.021984437480568886,-0.03414269536733627,-0.07897893339395523,0.009177367202937603,0.03962290287017822,0.01629055105149746,0.022883014753460884,0.025090111419558525,0.020137395709753036,-0.021437563002109528,0.019065432250499725,0.040391698479652405,0.02624114416539669,-0.04907722771167755,0.08357906341552734,0.027850085869431496,0.07756968587636948,-0.02098703384399414,-0.0105372229591012,0.028517303988337517,0.07226328551769257,0.009568988345563412,-0.001829613815061748,0.004109742119908333,-0.0094442218542099,-0.09093531966209412,-0.024124925956130028,-0.001956600695848465,0.014884348027408123,-0.015212233178317547,-0.040783196687698364,0.06273026764392853,-0.009244410321116447,0.006652131676673889,-0.02518174797296524,-0.0328875407576561,-0.0006778253591619432,-0.024665631353855133,-0.014482580125331879,-0.017550373449921608,0.07688526809215546,0.03227026388049126,-0.02032036893069744,0.02520751766860485,-0.036024805158376694,0.031276874244213104,0.05049922689795494,-0.041683413088321686,0.011370306834578514,0.013334015384316444,0.07090247422456741,0.00671397102996707,0.02261117286980152,0.05072203651070595,0.05410937964916229,-0.08531035482883453,0.008429818786680698,-0.07296503335237503,0.00986519269645214,0.009156347252428532,0.004232861567288637,0.011076388880610466,0.017775598913431168,0.022335315123200417,0.09325893223285675,0.005261177197098732,-0.044137585908174515,-0.00021400925470516086,-0.008710958994925022,0.005935311783105135,0.04404689371585846,-0.02373533882200718,-0.0391019731760025,0.03476991876959801,0.04787188023328781,0.013434822671115398,-0.009341242723166943,-0.01534743420779705,0.05374257639050484,-0.00005591209264821373,-0.022056834772229195,-0.05009075254201889,0.0006155537557788193,-0.0011566565372049809,-0.0227312371134758,-0.06157240271568298,0.021887246519327164,0.018191127106547356,-0.09207547456026077,-0.0475817508995533,0.011478128843009472,-0.007340249605476856,-0.053755536675453186,0.011460142210125923,-0.0023141151759773493,-0.058378469198942184,-0.02411964163184166,0.08282962441444397,-0.003586038714274764,-0.00003350398765178397,0.024823693558573723,0.011187554337084293,-0.043663281947374344,0.04102875664830208,0.0009061082964763045,0.009873001836240292,0.03512058034539223,0.027032120153307915,-0.039389774203300476,0.032011933624744415,-0.01791461557149887,-0.01318297442048788,-0.0354568287730217,0.004796766210347414,0.012373109348118305,-0.027349818497896194,-0.14767105877399445,-0.03716021031141281,-0.0732913389801979,-0.041622258722782135,0.013018250465393066,-0.061623748391866684,-0.031988851726055145,0.024435659870505333,0.006756221875548363,-0.03728857636451721,0.10486865043640137,0.06517021358013153,-0.059356652200222015,-0.07733021676540375,-0.008047672919929028,-0.1074720248579979,-0.0035968092270195484,0.022324997931718826,-0.000030728122510481626,0.013864506036043167,-0.02489476092159748,0.02141740918159485,-0.022336240857839584,0.0291232168674469,0.026950763538479805,0.021481135860085487,-0.02430325746536255,0.01650453545153141,-0.0009577841265127063,0.012589543126523495,0.06621825695037842,-0.044020090252161026,0.04868664592504501,-0.02131844311952591,-0.05444076657295227,-0.004350126720964909,0.06949208676815033,0.03704918548464775,0.021444298326969147,-0.045530859380960464,0.012501031160354614,-0.010716517455875874,0.01742527261376381,0.008372814394533634,0.010807683691382408,0.021386081352829933,-0.01076126005500555,0.02256506308913231,-0.02509375847876072,0.06320362538099289,0.004644936881959438,0.048300717025995255,-0.016512341797351837,-0.009859164245426655,-0.049996111541986465,-0.016478687524795532,-0.005474255420267582,-0.0072583300061523914,0.0927080288529396,0.04820491373538971,0.009089960716664791,-0.028038276359438896,0.05178573727607727,0.017812563106417656,-0.022127922624349594,-0.01776575855910778,0.046835269778966904,-0.014179280027747154,0.030178707093000412,0.037364229559898376,0.009105757810175419,-0.040992964059114456,-0.02754019759595394,0.041384514421224594,-0.0010377926519140601,-0.05803270265460014,-0.05411895737051964,-0.0008191830129362643,0.03259176015853882,-0.030328981578350067,-0.0914270356297493,-0.008712898939847946,-0.02290964126586914,-0.003283883212134242,-0.0017666368512436748,0.03317198529839516,0.05303165689110756,-0.01552744023501873,-0.03157323971390724,0.02078934758901596,-0.01319525483995676,-0.008084548637270927,-0.02312668226659298,0.08310084044933319,0.02314786985516548,-0.018661411479115486,-0.01181891467422247,-0.00437273271381855,0.0005827481509186327,-0.02629474736750126,0.041501499712467194,0.03888650983572006,-0.020833665505051613,0.005283166654407978,0.027922004461288452,-0.0003735240316018462,-0.009507589042186737,0.006361981388181448,-0.016559090465307236,0.01947234570980072,-0.04813266918063164,0.015176436863839626,0.004784830845892429,-0.011832197196781635,-0.02502601407468319,-0.029484903439879417,-0.010136990807950497,0.015786198899149895,0.017672574147582054,0.007395042572170496,0.017344191670417786,-0.031575944274663925,-0.026316337287425995,-0.05929289758205414,-0.021069273352622986,-0.04524148628115654,0.003235160605981946,-0.024726323783397675,-0.015455173328518867,0.002564928960055113,0.008980543352663517,0.09914818406105042,0.0427258126437664,0.06405572593212128,0.01410409901291132,0.0033631627447903156,-0.008825022727251053,-0.0015072595560923219,-0.017785057425498962,0.0653381422162056,0.012024391442537308,-0.030184032395482063,-0.020614756271243095,0.07010402530431747,0.013804430142045021,-0.007156015373766422,0.03477239981293678,0.017924675717949867,0.018922904506325722,-0.028784766793251038,0.003546101273968816,0.024904172867536545,-0.03004305250942707,0.048692308366298676,0.01922910287976265,-0.011605020612478256,-0.013327350839972496,0.09308793395757675,-0.025849007070064545,-0.011236224323511124,-0.050688713788986206,0.0056694610975682735,-0.06020320579409599,-0.050812557339668274,0.037156444042921066,-0.03639103099703789,-0.004475165158510208,0.022026140242815018,-0.08978170156478882,-0.021605610847473145,-0.07642557471990585,-0.04711632803082466,-0.013784567825496197,0.008049502037465572,0.007190842647105455,0.022485755383968353,-0.021884549409151077,0.008582382462918758,0.025346051901578903,0.013523370958864689,-0.03175212815403938,0.02733100950717926,-0.03156498074531555,0.018158933147788048,0.04445721209049225,-0.034825071692466736,0.002851594937965274,-0.02569941058754921,0.0014540591510012746,-0.010827752761542797,-0.04859573021531105,0.013579285703599453,-0.026147687807679176,-0.05775734782218933,0.06740251183509827,0.01934518851339817,0.10629105567932129,0.058758776634931564,-0.02720494195818901,0.025307077914476395,-0.02337515354156494,0.02865186519920826,0.03803086653351784,-0.013471422716975212,-0.0005747135728597641,0.012940428219735622,0.029955927282571793,0.008395973592996597,-0.0014511494664475322,-0.09832531958818436,0.009307182393968105,0.010117906145751476,0.0791916623711586,0.01603448949754238,-0.013742185197770596,0.024421347305178642,0.03286898136138916,-0.01740550994873047,0.0191029142588377,-0.018940705806016922,-0.012424525804817677,-0.05151620879769325,-0.027343492954969406,0.017089517787098885,0.02607446350157261,-0.03336569294333458,0.07116687297821045,-0.021923379972577095,-0.023006239905953407,-0.0037928964011371136,-0.03984099254012108,0.050658583641052246,0.004324117209762335,0.013413256965577602,0.02631084993481636,0.0007848410750739276,0.004667613189667463,0.037766747176647186,-0.00020871995366178453,-0.019826501607894897,0.033783067017793655,0.020086340606212616,-0.006656428333371878,-0.025456422939896584,-0.015639035031199455,-0.09754692763090134,0.007797672413289547,-0.015191031619906425,0.02775290608406067,-0.0033729621209204197,-0.00274819228798151,-0.01358336303383112,0.019418055191636086,0.002973339054733515,0.03745521232485771,0.010285748168826103,0.01548957172781229,0.024621915072202682,0.04064935818314552,-0.01985679380595684,0.03410523757338524,-0.03515934571623802,0.0014842196833342314,0.0256021860986948,0.022825444117188454,0.002511525060981512,-0.0048813484609127045,0.08853163570165634,-0.06433387845754623,-0.015915540978312492,0.005157014355063438,-0.030536765232682228,0.02092563919723034,0.021061010658740997,-0.006730417255312204,0.007868332788348198,0.11424322426319122,-0.028906099498271942,0.04444442316889763,-0.008141306228935719,-0.02615867182612419,-0.02447568252682686,-0.04030686989426613,-0.007173620164394379,0.05256499722599983,0.040262460708618164,-0.0498175211250782,-0.05391300097107887,0.03267081826925278,-0.023904699832201004,0.03184963017702103,-0.08031246066093445,-0.016745170578360558,0.034696999937295914,-0.026171069592237473,0.04684576392173767,-0.04632885009050369,0.0030988187063485384,0.025373460724949837,0.005937081295996904,-0.014925415627658367,0.03625720739364624,0.010011788457632065,-0.025027327239513397,0.021046310663223267,-0.025310110300779343,-0.00699690543115139,0.0034799939021468163,0.03809276595711708,0.017054589465260506,0.003663897980004549,0.015872836112976074,0.03627735376358032,-0.011592994444072247,-0.027048593387007713,-0.024255072697997093,0.019140955060720444,-0.053910400718450546,0.022101158276200294,0.012926668860018253,-0.024331891909241676,0.013371079228818417,-0.02136007696390152,0.006407419219613075,0.015467880293726921,-0.0696134865283966,-0.025372860953211784,0.07028792798519135,-0.005294439848512411,0.0050978101789951324,-0.004228594712913036,-0.03326766937971115,-0.010108415968716145,-0.040688406676054,-0.03697884455323219,0.03191026672720909,-0.016849348321557045,-0.014953319914638996,0.007275713607668877,0.033933818340301514,0.04898073524236679,-0.006841834634542465,0.00876732636243105,-0.02135133184492588,0.01761908084154129,0.009760706685483456,-0.060612864792346954,-0.022922899574041367,0.06696996092796326,-0.06620363891124725,-0.02317516691982746,0.05628727376461029,0.02501060627400875,0.011073588393628597,0.005872813984751701,0.005922976415604353,0.056604839861392975,-0.02152622863650322,0.08621344715356827,-0.012002727016806602,0.03229862079024315,-0.0003857486299239099,0.03426790609955788,0.0610676072537899,0.03144071251153946,-0.0148477703332901,-0.017921818420290947,0.03695942461490631,-0.011326191015541553,0.03140319883823395,-0.013571690768003464,0.0006433348171412945,0.019890516996383667,-0.06383984535932541,-0.06150129809975624,0.01415419951081276,0.020511861890554428,-0.027472633868455887,0.0012024571187794209,-0.02643297053873539,-0.014136544428765774,0.025035029277205467,-0.008568945340812206,-0.007751251105219126,0.04579103738069534,-0.016259677708148956,-0.06682436913251877,-0.04153076559305191,0.006908342242240906,-7.175406331199344e-33,-0.04673270136117935,0.018874723464250565,-0.026549750939011574,-0.12783320248126984,-0.06271219998598099,-0.0222685057669878,-0.01331544853746891,-0.04940859228372574,0.0007116260821931064,-0.009645997546613216,-0.029057813808321953,0.013027852401137352,0.019729554653167725,-0.017042411491274834,0.014620890840888023,0.030782397836446762,0.04475584626197815,-0.009691552259027958,0.020473169162869453,0.06190819665789604,-0.014193069189786911,0.04153542220592499,0.004350028466433287,0.033120542764663696,-0.09934540838003159,0.05564813315868378,-0.0060498397797346115,0.020832661539316177,-0.03476545587182045,-0.02947065606713295,0.017155226320028305,-0.019003121182322502,-0.015766113996505737,0.024321576580405235,-0.029699252918362617,-0.08660967648029327,-0.019328253343701363,-0.003829215420410037,-0.02609666809439659,-0.056053902953863144,0.02150142379105091,0.05449250340461731,0.00569661520421505,-0.0161835178732872,-0.03282252326607704,-0.024583833292126656,0.011345389299094677,-0.014071150682866573,-0.05315246433019638,-0.015812557190656662,0.040755726397037506,0.043383676558732986,0.008095278404653072,0.017963431775569916,-0.002921642269939184,0.006627376191318035,-0.01197062898427248,0.04422468692064285,-0.07117432355880737,0.06075766310095787,0.07569319754838943,0.007193181663751602,-0.008736872114241123,0.008354333229362965,0.0366927795112133,0.0008346003596670926,0.050967808812856674,0.06506034731864929,0.025671452283859253,-0.009223850443959236,-0.04050741717219353,0.04517515003681183,-0.02199459820985794,-0.018885303288698196,0.09686286002397537,-0.008218186907470226,0.034606385976076126,-0.02019800804555416,0.05717996507883072,0.013009333051741123,0.00811844877898693,0.03350169211626053,0.015866944566369057,0.0335971862077713,0.015424012206494808,-0.045755550265312195,-0.005362277384847403,-0.03429333493113518,0.019417747855186462,0.03096618503332138,-0.03871266171336174,0.012360737659037113,-0.02320784702897072,0.010711831040680408,-0.02405654639005661,0.012009527534246445,0.00680952426046133,0.01903003640472889,-0.0005273522692732513,-0.03233317285776138,0.003202673979103565,0.02489476092159748,0.05953948199748993,0.05152785778045654,-0.0035549842286854982,0.012112442404031754,0.04219021275639534,0.009106586687266827,-0.0547214113175869,-0.00037931380211375654,0.015606662258505821,0.0004991173627786338,-0.03135068342089653,-0.02498914860188961,0.0007141280802898109,-0.030379487201571465,0.006746768020093441,0.010552973486483097,0.018225625157356262,0.02568933740258217,0.0008377857157029212,0.02415899559855461,-0.01735753007233143,0.06338678300380707,0.036571282893419266,-0.0035651312209665775,0.0025750193744897842,-0.08335933834314346,-0.013751435093581676,0.0092075290158391,0.011931662447750568,0.012726487591862679,3.058386823795445e-7,-0.02537277340888977,-0.008900976739823818,0.003465465735644102,0.01679450273513794,0.06282977014780045,-0.009169276803731918,-0.019363336265087128,-0.016290754079818726,-0.021671025082468987,-0.03961572051048279,0.004480724222958088,0.000009374640285386704,0.03281242400407791,0.02166086807847023,0.06495463848114014,-0.050644613802433014,-0.006566966883838177,-0.046838775277137756,-0.05861819535493851,-0.018148373812437057,0.041393931955099106,0.01022091880440712,0.013824304565787315,-0.03443422168493271,0.026329323649406433,0.003927086479961872,-0.006957832258194685,0.017735881730914116,-0.0329701229929924,-0.010464868508279324,0.10191001743078232,-0.06724780052900314,-0.03230087831616402,-0.03360844776034355,0.0012317484943196177,0.019257642328739166,-0.058838918805122375,-0.04279037192463875,-0.0363953672349453,-0.005311829969286919,0.008069640956819057,0.04931756481528282,-0.015852417796850204,-0.030243080109357834,0.025513440370559692,0.0369114950299263,-0.006626969203352928,-0.06481538712978363,-0.02811513841152191,-0.013159221969544888,0.029708847403526306,-0.0016280935378745198,-0.015541551634669304,-0.0180392786860466,0.015069659799337387,0.007072230335325003,-0.025984587147831917,0.005155818071216345,0.0035786498337984085,0.00890388060361147,-0.0025427481159567833,-0.034448325634002686,0.01029171422123909,0.08140765130519867,0.04078991711139679,-0.03826852887868881,-0.009067234583199024,3.3531403392262886e-34,0.05601724982261658,0.028111321851611137,-0.004324944224208593,0.035038162022829056,0.005648627411574125,-0.01326349750161171,0.02565905824303627,-0.023969730362296104,-0.0072279563173651695,-0.0492689423263073,-0.013827841728925705]'
SET
  @EmbeddingModelID_0dbef766 = '1D45AA65-41EC-4572-9ECD-AB2826C9B059'
SET
  @SQLDialectID_0dbef766 = '1F203987-A37B-4BC1-85B3-BA50DC33C3E0'
SET
  @Reusable_0dbef766 = 0
SET
  @ID_0dbef766 = '5044A100-0020-4000-8000-000000000001' EXEC [__mj].spUpdateQuery @Name = @Name_0dbef766,
  @CategoryID = @CategoryID_0dbef766,
  @CategoryID_Clear = 1,
  @UserQuestion = @UserQuestion_0dbef766,
  @UserQuestion_Clear = 1,
  @Description = @Description_0dbef766,
  @SQL = @SQL_0dbef766,
  @TechnicalDescription = @TechnicalDescription_0dbef766,
  @TechnicalDescription_Clear = 1,
  @OriginalSQL = @OriginalSQL_0dbef766,
  @OriginalSQL_Clear = 1,
  @Feedback = @Feedback_0dbef766,
  @Feedback_Clear = 1,
  @Status = @Status_0dbef766,
  @QualityRank = @QualityRank_0dbef766,
  @ExecutionCostRank = @ExecutionCostRank_0dbef766,
  @ExecutionCostRank_Clear = 1,
  @UsesTemplate = @UsesTemplate_0dbef766,
  @AuditQueryRuns = @AuditQueryRuns_0dbef766,
  @CacheEnabled = @CacheEnabled_0dbef766,
  @CacheTTLMinutes = @CacheTTLMinutes_0dbef766,
  @CacheTTLMinutes_Clear = 1,
  @CacheMaxSize = @CacheMaxSize_0dbef766,
  @CacheMaxSize_Clear = 1,
  @EmbeddingVector = @EmbeddingVector_0dbef766,
  @EmbeddingModelID = @EmbeddingModelID_0dbef766,
  @CacheValidationSQL = @CacheValidationSQL_0dbef766,
  @CacheValidationSQL_Clear = 1,
  @SQLDialectID = @SQLDialectID_0dbef766,
  @Reusable = @Reusable_0dbef766,
  @ExternalDataSourceID = @ExternalDataSourceID_0dbef766,
  @ExternalDataSourceID_Clear = 1,
  @ID = @ID_0dbef766;

GO

-- Save MJ: Query Entities (core SP call only)
DECLARE @ID_8304fb7d UNIQUEIDENTIFIER,
@QueryID_8304fb7d UNIQUEIDENTIFIER,
@EntityID_8304fb7d UNIQUEIDENTIFIER,
@DetectionMethod_8304fb7d NVARCHAR(50),
@AutoDetectConfidenceScore_8304fb7d DECIMAL(3, 2)
SET
  @ID_8304fb7d = 'e0493400-649f-44ce-bb3d-d6e886bb113e'
SET
  @QueryID_8304fb7d = '5044A100-0020-4000-8000-000000000003'
SET
  @EntityID_8304fb7d = '1F1CBA7E-F548-420E-9B71-30891E454C42'
SET
  @DetectionMethod_8304fb7d = N'AI'
SET
  @AutoDetectConfidenceScore_8304fb7d = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryEntity] WHERE ID = @ID_8304fb7d)
EXEC [__mj].spCreateQueryEntity @ID = @ID_8304fb7d,
  @QueryID = @QueryID_8304fb7d,
  @EntityID = @EntityID_8304fb7d,
  @DetectionMethod = @DetectionMethod_8304fb7d,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_8304fb7d;

GO

-- Save MJ: Query Entities (core SP call only)
DECLARE @ID_bcdea7fa UNIQUEIDENTIFIER,
@QueryID_bcdea7fa UNIQUEIDENTIFIER,
@EntityID_bcdea7fa UNIQUEIDENTIFIER,
@DetectionMethod_bcdea7fa NVARCHAR(50),
@AutoDetectConfidenceScore_bcdea7fa DECIMAL(3, 2)
SET
  @ID_bcdea7fa = '726d6a5b-6ae4-4174-afad-1c00d04d423f'
SET
  @QueryID_bcdea7fa = '5044A100-0020-4000-8000-000000000003'
SET
  @EntityID_bcdea7fa = '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A'
SET
  @DetectionMethod_bcdea7fa = N'AI'
SET
  @AutoDetectConfidenceScore_bcdea7fa = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryEntity] WHERE ID = @ID_bcdea7fa)
EXEC [__mj].spCreateQueryEntity @ID = @ID_bcdea7fa,
  @QueryID = @QueryID_bcdea7fa,
  @EntityID = @EntityID_bcdea7fa,
  @DetectionMethod = @DetectionMethod_bcdea7fa,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_bcdea7fa;

GO

-- Save MJ: Query Parameters (core SP call only)
DECLARE @ID_13333c51 UNIQUEIDENTIFIER,
@QueryID_13333c51 UNIQUEIDENTIFIER,
@Name_13333c51 NVARCHAR(255),
@Type_13333c51 NVARCHAR(50),
@IsRequired_13333c51 BIT,
@DefaultValue_13333c51 NVARCHAR(MAX),
@Description_13333c51 NVARCHAR(MAX),
@SampleValue_13333c51 NVARCHAR(MAX),
@ValidationFilters_13333c51 NVARCHAR(MAX),
@DetectionMethod_13333c51 NVARCHAR(50),
@AutoDetectConfidenceScore_13333c51 DECIMAL(3, 2)
SET
  @ID_13333c51 = 'fee4b7bb-96b3-4333-a5e7-3cd6c444ecdb'
SET
  @QueryID_13333c51 = '5044A100-0020-4000-8000-000000000003'
SET
  @Name_13333c51 = N'ModelID'
SET
  @Type_13333c51 = N'string'
SET
  @IsRequired_13333c51 = 1
SET
  @Description_13333c51 = N'The unique identifier (UUID) of the Score Model to analyze'
SET
  @SampleValue_13333c51 = N'00000000-0000-0000-0000-000000000001'
SET
  @DetectionMethod_13333c51 = N'AI' IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryParameter] WHERE ID = @ID_13333c51)
EXEC [__mj].spCreateQueryParameter @ID = @ID_13333c51,
  @QueryID = @QueryID_13333c51,
  @Name = @Name_13333c51,
  @Type = @Type_13333c51,
  @IsRequired = @IsRequired_13333c51,
  @DefaultValue = @DefaultValue_13333c51,
  @DefaultValue_Clear = 1,
  @Description = @Description_13333c51,
  @SampleValue = @SampleValue_13333c51,
  @ValidationFilters = @ValidationFilters_13333c51,
  @ValidationFilters_Clear = 1,
  @DetectionMethod = @DetectionMethod_13333c51,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_13333c51,
  @AutoDetectConfidenceScore_Clear = 1;

GO

-- Save MJ: Query Parameters (core SP call only)
DECLARE @ID_9fdf415c UNIQUEIDENTIFIER,
@QueryID_9fdf415c UNIQUEIDENTIFIER,
@Name_9fdf415c NVARCHAR(255),
@Type_9fdf415c NVARCHAR(50),
@IsRequired_9fdf415c BIT,
@DefaultValue_9fdf415c NVARCHAR(MAX),
@Description_9fdf415c NVARCHAR(MAX),
@SampleValue_9fdf415c NVARCHAR(MAX),
@ValidationFilters_9fdf415c NVARCHAR(MAX),
@DetectionMethod_9fdf415c NVARCHAR(50),
@AutoDetectConfidenceScore_9fdf415c DECIMAL(3, 2)
SET
  @ID_9fdf415c = '3b0abdfa-0767-447a-816c-5b6cbcb361b7'
SET
  @QueryID_9fdf415c = '5044A100-0020-4000-8000-000000000003'
SET
  @Name_9fdf415c = N'FromDay'
SET
  @Type_9fdf415c = N'string'
SET
  @IsRequired_9fdf415c = 1
SET
  @Description_9fdf415c = N'The starting snapshot date for comparison'
SET
  @SampleValue_9fdf415c = N'2023-10-01'
SET
  @DetectionMethod_9fdf415c = N'AI' IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryParameter] WHERE ID = @ID_9fdf415c)
EXEC [__mj].spCreateQueryParameter @ID = @ID_9fdf415c,
  @QueryID = @QueryID_9fdf415c,
  @Name = @Name_9fdf415c,
  @Type = @Type_9fdf415c,
  @IsRequired = @IsRequired_9fdf415c,
  @DefaultValue = @DefaultValue_9fdf415c,
  @DefaultValue_Clear = 1,
  @Description = @Description_9fdf415c,
  @SampleValue = @SampleValue_9fdf415c,
  @ValidationFilters = @ValidationFilters_9fdf415c,
  @ValidationFilters_Clear = 1,
  @DetectionMethod = @DetectionMethod_9fdf415c,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_9fdf415c,
  @AutoDetectConfidenceScore_Clear = 1;

GO

-- Save MJ: Query Parameters (core SP call only)
DECLARE @ID_0f4d0130 UNIQUEIDENTIFIER,
@QueryID_0f4d0130 UNIQUEIDENTIFIER,
@Name_0f4d0130 NVARCHAR(255),
@Type_0f4d0130 NVARCHAR(50),
@IsRequired_0f4d0130 BIT,
@DefaultValue_0f4d0130 NVARCHAR(MAX),
@Description_0f4d0130 NVARCHAR(MAX),
@SampleValue_0f4d0130 NVARCHAR(MAX),
@ValidationFilters_0f4d0130 NVARCHAR(MAX),
@DetectionMethod_0f4d0130 NVARCHAR(50),
@AutoDetectConfidenceScore_0f4d0130 DECIMAL(3, 2)
SET
  @ID_0f4d0130 = 'ef7634b0-f7f7-4e71-bf1c-0623facbb1dc'
SET
  @QueryID_0f4d0130 = '5044A100-0020-4000-8000-000000000003'
SET
  @Name_0f4d0130 = N'ToDay'
SET
  @Type_0f4d0130 = N'string'
SET
  @IsRequired_0f4d0130 = 1
SET
  @Description_0f4d0130 = N'The ending snapshot date for comparison'
SET
  @SampleValue_0f4d0130 = N'2023-10-31'
SET
  @DetectionMethod_0f4d0130 = N'AI' IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryParameter] WHERE ID = @ID_0f4d0130)
EXEC [__mj].spCreateQueryParameter @ID = @ID_0f4d0130,
  @QueryID = @QueryID_0f4d0130,
  @Name = @Name_0f4d0130,
  @Type = @Type_0f4d0130,
  @IsRequired = @IsRequired_0f4d0130,
  @DefaultValue = @DefaultValue_0f4d0130,
  @DefaultValue_Clear = 1,
  @Description = @Description_0f4d0130,
  @SampleValue = @SampleValue_0f4d0130,
  @ValidationFilters = @ValidationFilters_0f4d0130,
  @ValidationFilters_Clear = 1,
  @DetectionMethod = @DetectionMethod_0f4d0130,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_0f4d0130,
  @AutoDetectConfidenceScore_Clear = 1;

GO

-- Save MJ: Query Parameters (core SP call only)
DECLARE @ID_bdc8506b UNIQUEIDENTIFIER,
@QueryID_bdc8506b UNIQUEIDENTIFIER,
@Name_bdc8506b NVARCHAR(255),
@Type_bdc8506b NVARCHAR(50),
@IsRequired_bdc8506b BIT,
@DefaultValue_bdc8506b NVARCHAR(MAX),
@Description_bdc8506b NVARCHAR(MAX),
@SampleValue_bdc8506b NVARCHAR(MAX),
@ValidationFilters_bdc8506b NVARCHAR(MAX),
@DetectionMethod_bdc8506b NVARCHAR(50),
@AutoDetectConfidenceScore_bdc8506b DECIMAL(3, 2)
SET
  @ID_bdc8506b = '94f0a508-8daf-48cb-a389-cf16d8316f9d'
SET
  @QueryID_bdc8506b = '5044A100-0020-4000-8000-000000000003'
SET
  @Name_bdc8506b = N'MaxEach'
SET
  @Type_bdc8506b = N'number'
SET
  @IsRequired_bdc8506b = 1
SET
  @Description_bdc8506b = N'The maximum number of risers and fallers to return'
SET
  @SampleValue_bdc8506b = N'10'
SET
  @DetectionMethod_bdc8506b = N'AI' IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryParameter] WHERE ID = @ID_bdc8506b)
EXEC [__mj].spCreateQueryParameter @ID = @ID_bdc8506b,
  @QueryID = @QueryID_bdc8506b,
  @Name = @Name_bdc8506b,
  @Type = @Type_bdc8506b,
  @IsRequired = @IsRequired_bdc8506b,
  @DefaultValue = @DefaultValue_bdc8506b,
  @DefaultValue_Clear = 1,
  @Description = @Description_bdc8506b,
  @SampleValue = @SampleValue_bdc8506b,
  @ValidationFilters = @ValidationFilters_bdc8506b,
  @ValidationFilters_Clear = 1,
  @DetectionMethod = @DetectionMethod_bdc8506b,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_bdc8506b,
  @AutoDetectConfidenceScore_Clear = 1;

GO

-- Save MJ: Query Fields (core SP call only)
DECLARE @ID_f89b4e65 UNIQUEIDENTIFIER,
@QueryID_f89b4e65 UNIQUEIDENTIFIER,
@Name_f89b4e65 NVARCHAR(255),
@Description_f89b4e65 NVARCHAR(MAX),
@Sequence_f89b4e65 INT,
@SQLBaseType_f89b4e65 NVARCHAR(50),
@SQLFullType_f89b4e65 NVARCHAR(100),
@SourceEntityID_f89b4e65 UNIQUEIDENTIFIER,
@SourceFieldName_f89b4e65 NVARCHAR(255),
@IsComputed_f89b4e65 BIT,
@ComputationDescription_f89b4e65 NVARCHAR(MAX),
@IsSummary_f89b4e65 BIT,
@SummaryDescription_f89b4e65 NVARCHAR(MAX),
@DetectionMethod_f89b4e65 NVARCHAR(50),
@AutoDetectConfidenceScore_f89b4e65 DECIMAL(3, 2)
SET
  @ID_f89b4e65 = 'c41f55cf-699a-49a7-b23c-23e20dd8a555'
SET
  @QueryID_f89b4e65 = '5044A100-0020-4000-8000-000000000003'
SET
  @Name_f89b4e65 = N'AnchorRecordID'
SET
  @Description_f89b4e65 = N'The ID of the anchor record associated with the score'
SET
  @Sequence_f89b4e65 = 1
SET
  @SQLBaseType_f89b4e65 = N'nvarchar'
SET
  @SQLFullType_f89b4e65 = N'nvarchar(450)'
SET
  @SourceEntityID_f89b4e65 = '1F1CBA7E-F548-420E-9B71-30891E454C42'
SET
  @SourceFieldName_f89b4e65 = N'AnchorRecordID'
SET
  @IsComputed_f89b4e65 = 0
SET
  @IsSummary_f89b4e65 = 0
SET
  @DetectionMethod_f89b4e65 = N'Manual' IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryField] WHERE ID = @ID_f89b4e65)
EXEC [__mj].spCreateQueryField @ID = @ID_f89b4e65,
  @QueryID = @QueryID_f89b4e65,
  @Name = @Name_f89b4e65,
  @Description = @Description_f89b4e65,
  @Sequence = @Sequence_f89b4e65,
  @SQLBaseType = @SQLBaseType_f89b4e65,
  @SQLFullType = @SQLFullType_f89b4e65,
  @SourceEntityID = @SourceEntityID_f89b4e65,
  @SourceFieldName = @SourceFieldName_f89b4e65,
  @IsComputed = @IsComputed_f89b4e65,
  @ComputationDescription = @ComputationDescription_f89b4e65,
  @ComputationDescription_Clear = 1,
  @IsSummary = @IsSummary_f89b4e65,
  @SummaryDescription = @SummaryDescription_f89b4e65,
  @SummaryDescription_Clear = 1,
  @DetectionMethod = @DetectionMethod_f89b4e65,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_f89b4e65,
  @AutoDetectConfidenceScore_Clear = 1;

GO

-- Save MJ: Query Fields (core SP call only)
DECLARE @ID_8702a5e0 UNIQUEIDENTIFIER,
@QueryID_8702a5e0 UNIQUEIDENTIFIER,
@Name_8702a5e0 NVARCHAR(255),
@Description_8702a5e0 NVARCHAR(MAX),
@Sequence_8702a5e0 INT,
@SQLBaseType_8702a5e0 NVARCHAR(50),
@SQLFullType_8702a5e0 NVARCHAR(100),
@SourceEntityID_8702a5e0 UNIQUEIDENTIFIER,
@SourceFieldName_8702a5e0 NVARCHAR(255),
@IsComputed_8702a5e0 BIT,
@ComputationDescription_8702a5e0 NVARCHAR(MAX),
@IsSummary_8702a5e0 BIT,
@SummaryDescription_8702a5e0 NVARCHAR(MAX),
@DetectionMethod_8702a5e0 NVARCHAR(50),
@AutoDetectConfidenceScore_8702a5e0 DECIMAL(3, 2)
SET
  @ID_8702a5e0 = '6725290e-1018-4a81-a4ab-948d8a0769c9'
SET
  @QueryID_8702a5e0 = '5044A100-0020-4000-8000-000000000003'
SET
  @Name_8702a5e0 = N'Delta'
SET
  @Description_8702a5e0 = N'The change in score between FromDay and ToDay'
SET
  @Sequence_8702a5e0 = 2
SET
  @SQLBaseType_8702a5e0 = N'nvarchar'
SET
  @SQLFullType_8702a5e0 = N'nvarchar(MAX)'
SET
  @SourceFieldName_8702a5e0 = N'Delta'
SET
  @IsComputed_8702a5e0 = 0
SET
  @ComputationDescription_8702a5e0 = N'ROUND(t.NormalizedScore, 0) - ROUND(f.NormalizedScore, 0)'
SET
  @IsSummary_8702a5e0 = 0
SET
  @DetectionMethod_8702a5e0 = N'Manual' IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryField] WHERE ID = @ID_8702a5e0)
EXEC [__mj].spCreateQueryField @ID = @ID_8702a5e0,
  @QueryID = @QueryID_8702a5e0,
  @Name = @Name_8702a5e0,
  @Description = @Description_8702a5e0,
  @Sequence = @Sequence_8702a5e0,
  @SQLBaseType = @SQLBaseType_8702a5e0,
  @SQLFullType = @SQLFullType_8702a5e0,
  @SourceEntityID = @SourceEntityID_8702a5e0,
  @SourceEntityID_Clear = 1,
  @SourceFieldName = @SourceFieldName_8702a5e0,
  @IsComputed = @IsComputed_8702a5e0,
  @ComputationDescription = @ComputationDescription_8702a5e0,
  @IsSummary = @IsSummary_8702a5e0,
  @SummaryDescription = @SummaryDescription_8702a5e0,
  @SummaryDescription_Clear = 1,
  @DetectionMethod = @DetectionMethod_8702a5e0,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_8702a5e0,
  @AutoDetectConfidenceScore_Clear = 1;

GO

-- Save MJ: Query Fields (core SP call only)
DECLARE @ID_e1325c52 UNIQUEIDENTIFIER,
@QueryID_e1325c52 UNIQUEIDENTIFIER,
@Name_e1325c52 NVARCHAR(255),
@Description_e1325c52 NVARCHAR(MAX),
@Sequence_e1325c52 INT,
@SQLBaseType_e1325c52 NVARCHAR(50),
@SQLFullType_e1325c52 NVARCHAR(100),
@SourceEntityID_e1325c52 UNIQUEIDENTIFIER,
@SourceFieldName_e1325c52 NVARCHAR(255),
@IsComputed_e1325c52 BIT,
@ComputationDescription_e1325c52 NVARCHAR(MAX),
@IsSummary_e1325c52 BIT,
@SummaryDescription_e1325c52 NVARCHAR(MAX),
@DetectionMethod_e1325c52 NVARCHAR(50),
@AutoDetectConfidenceScore_e1325c52 DECIMAL(3, 2)
SET
  @ID_e1325c52 = '8c9aa9a6-8eae-4048-acce-87eaed1e6d29'
SET
  @QueryID_e1325c52 = '5044A100-0020-4000-8000-000000000003'
SET
  @Name_e1325c52 = N'CurrentScore'
SET
  @Description_e1325c52 = N'The score on the ToDay snapshot date'
SET
  @Sequence_e1325c52 = 3
SET
  @SQLBaseType_e1325c52 = N'nvarchar'
SET
  @SQLFullType_e1325c52 = N'nvarchar(MAX)'
SET
  @SourceFieldName_e1325c52 = N'CurrentScore'
SET
  @IsComputed_e1325c52 = 0
SET
  @ComputationDescription_e1325c52 = N'ROUND(t.NormalizedScore, 0)'
SET
  @IsSummary_e1325c52 = 0
SET
  @DetectionMethod_e1325c52 = N'Manual' IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryField] WHERE ID = @ID_e1325c52)
EXEC [__mj].spCreateQueryField @ID = @ID_e1325c52,
  @QueryID = @QueryID_e1325c52,
  @Name = @Name_e1325c52,
  @Description = @Description_e1325c52,
  @Sequence = @Sequence_e1325c52,
  @SQLBaseType = @SQLBaseType_e1325c52,
  @SQLFullType = @SQLFullType_e1325c52,
  @SourceEntityID = @SourceEntityID_e1325c52,
  @SourceEntityID_Clear = 1,
  @SourceFieldName = @SourceFieldName_e1325c52,
  @IsComputed = @IsComputed_e1325c52,
  @ComputationDescription = @ComputationDescription_e1325c52,
  @IsSummary = @IsSummary_e1325c52,
  @SummaryDescription = @SummaryDescription_e1325c52,
  @SummaryDescription_Clear = 1,
  @DetectionMethod = @DetectionMethod_e1325c52,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_e1325c52,
  @AutoDetectConfidenceScore_Clear = 1;

GO

-- Save MJ: Query Fields (core SP call only)
DECLARE @ID_5d514d6f UNIQUEIDENTIFIER,
@QueryID_5d514d6f UNIQUEIDENTIFIER,
@Name_5d514d6f NVARCHAR(255),
@Description_5d514d6f NVARCHAR(MAX),
@Sequence_5d514d6f INT,
@SQLBaseType_5d514d6f NVARCHAR(50),
@SQLFullType_5d514d6f NVARCHAR(100),
@SourceEntityID_5d514d6f UNIQUEIDENTIFIER,
@SourceFieldName_5d514d6f NVARCHAR(255),
@IsComputed_5d514d6f BIT,
@ComputationDescription_5d514d6f NVARCHAR(MAX),
@IsSummary_5d514d6f BIT,
@SummaryDescription_5d514d6f NVARCHAR(MAX),
@DetectionMethod_5d514d6f NVARCHAR(50),
@AutoDetectConfidenceScore_5d514d6f DECIMAL(3, 2)
SET
  @ID_5d514d6f = '3074a237-49be-454a-b7d6-014a813f2d18'
SET
  @QueryID_5d514d6f = '5044A100-0020-4000-8000-000000000003'
SET
  @Name_5d514d6f = N'BandID'
SET
  @Description_5d514d6f = N'The unique identifier of the score band on the ToDay snapshot date'
SET
  @Sequence_5d514d6f = 4
SET
  @SQLBaseType_5d514d6f = N'uniqueidentifier'
SET
  @SQLFullType_5d514d6f = N'uniqueidentifier'
SET
  @SourceEntityID_5d514d6f = '1F1CBA7E-F548-420E-9B71-30891E454C42'
SET
  @SourceFieldName_5d514d6f = N'BandID'
SET
  @IsComputed_5d514d6f = 1
SET
  @ComputationDescription_5d514d6f = N'CONVERT(varchar(36), r.BandID)'
SET
  @IsSummary_5d514d6f = 0
SET
  @DetectionMethod_5d514d6f = N'Manual' IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryField] WHERE ID = @ID_5d514d6f)
EXEC [__mj].spCreateQueryField @ID = @ID_5d514d6f,
  @QueryID = @QueryID_5d514d6f,
  @Name = @Name_5d514d6f,
  @Description = @Description_5d514d6f,
  @Sequence = @Sequence_5d514d6f,
  @SQLBaseType = @SQLBaseType_5d514d6f,
  @SQLFullType = @SQLFullType_5d514d6f,
  @SourceEntityID = @SourceEntityID_5d514d6f,
  @SourceFieldName = @SourceFieldName_5d514d6f,
  @IsComputed = @IsComputed_5d514d6f,
  @ComputationDescription = @ComputationDescription_5d514d6f,
  @IsSummary = @IsSummary_5d514d6f,
  @SummaryDescription = @SummaryDescription_5d514d6f,
  @SummaryDescription_Clear = 1,
  @DetectionMethod = @DetectionMethod_5d514d6f,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_5d514d6f,
  @AutoDetectConfidenceScore_Clear = 1;

GO

-- Save MJ: Query Fields (core SP call only)
DECLARE @ID_ff454928 UNIQUEIDENTIFIER,
@QueryID_ff454928 UNIQUEIDENTIFIER,
@Name_ff454928 NVARCHAR(255),
@Description_ff454928 NVARCHAR(MAX),
@Sequence_ff454928 INT,
@SQLBaseType_ff454928 NVARCHAR(50),
@SQLFullType_ff454928 NVARCHAR(100),
@SourceEntityID_ff454928 UNIQUEIDENTIFIER,
@SourceFieldName_ff454928 NVARCHAR(255),
@IsComputed_ff454928 BIT,
@ComputationDescription_ff454928 NVARCHAR(MAX),
@IsSummary_ff454928 BIT,
@SummaryDescription_ff454928 NVARCHAR(MAX),
@DetectionMethod_ff454928 NVARCHAR(50),
@AutoDetectConfidenceScore_ff454928 DECIMAL(3, 2)
SET
  @ID_ff454928 = 'db8694d4-7aaa-42a4-88d6-8553298c5409'
SET
  @QueryID_ff454928 = '5044A100-0020-4000-8000-000000000003'
SET
  @Name_ff454928 = N'BandLabel'
SET
  @Description_ff454928 = N'The label of the score band, defaulting to ''Unbanded'' if null'
SET
  @Sequence_ff454928 = 5
SET
  @SQLBaseType_ff454928 = N'nvarchar'
SET
  @SQLFullType_ff454928 = N'nvarchar(MAX)'
SET
  @IsComputed_ff454928 = 1
SET
  @ComputationDescription_ff454928 = N'ISNULL(b.Label, ''Unbanded'')'
SET
  @IsSummary_ff454928 = 0
SET
  @DetectionMethod_ff454928 = N'Manual' IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryField] WHERE ID = @ID_ff454928)
EXEC [__mj].spCreateQueryField @ID = @ID_ff454928,
  @QueryID = @QueryID_ff454928,
  @Name = @Name_ff454928,
  @Description = @Description_ff454928,
  @Sequence = @Sequence_ff454928,
  @SQLBaseType = @SQLBaseType_ff454928,
  @SQLFullType = @SQLFullType_ff454928,
  @SourceEntityID = @SourceEntityID_ff454928,
  @SourceEntityID_Clear = 1,
  @SourceFieldName = @SourceFieldName_ff454928,
  @SourceFieldName_Clear = 1,
  @IsComputed = @IsComputed_ff454928,
  @ComputationDescription = @ComputationDescription_ff454928,
  @IsSummary = @IsSummary_ff454928,
  @SummaryDescription = @SummaryDescription_ff454928,
  @SummaryDescription_Clear = 1,
  @DetectionMethod = @DetectionMethod_ff454928,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_ff454928,
  @AutoDetectConfidenceScore_Clear = 1;

GO

-- Save MJ: Query Fields (core SP call only)
DECLARE @ID_0d75cc79 UNIQUEIDENTIFIER,
@QueryID_0d75cc79 UNIQUEIDENTIFIER,
@Name_0d75cc79 NVARCHAR(255),
@Description_0d75cc79 NVARCHAR(MAX),
@Sequence_0d75cc79 INT,
@SQLBaseType_0d75cc79 NVARCHAR(50),
@SQLFullType_0d75cc79 NVARCHAR(100),
@SourceEntityID_0d75cc79 UNIQUEIDENTIFIER,
@SourceFieldName_0d75cc79 NVARCHAR(255),
@IsComputed_0d75cc79 BIT,
@ComputationDescription_0d75cc79 NVARCHAR(MAX),
@IsSummary_0d75cc79 BIT,
@SummaryDescription_0d75cc79 NVARCHAR(MAX),
@DetectionMethod_0d75cc79 NVARCHAR(50),
@AutoDetectConfidenceScore_0d75cc79 DECIMAL(3, 2)
SET
  @ID_0d75cc79 = '5b7f8289-c462-4af6-a7a3-e3a5049a06e5'
SET
  @QueryID_0d75cc79 = '5044A100-0020-4000-8000-000000000003'
SET
  @Name_0d75cc79 = N'Direction'
SET
  @Description_0d75cc79 = N'Indicates whether the score went up (''riser'') or down (''faller'')'
SET
  @Sequence_0d75cc79 = 6
SET
  @SQLBaseType_0d75cc79 = N'nvarchar'
SET
  @SQLFullType_0d75cc79 = N'nvarchar(MAX)'
SET
  @SourceFieldName_0d75cc79 = N'Direction'
SET
  @IsComputed_0d75cc79 = 0
SET
  @ComputationDescription_0d75cc79 = N'CASE WHEN Delta > 0 THEN ''riser'' ELSE ''faller'' END'
SET
  @IsSummary_0d75cc79 = 0
SET
  @DetectionMethod_0d75cc79 = N'Manual' IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryField] WHERE ID = @ID_0d75cc79)
EXEC [__mj].spCreateQueryField @ID = @ID_0d75cc79,
  @QueryID = @QueryID_0d75cc79,
  @Name = @Name_0d75cc79,
  @Description = @Description_0d75cc79,
  @Sequence = @Sequence_0d75cc79,
  @SQLBaseType = @SQLBaseType_0d75cc79,
  @SQLFullType = @SQLFullType_0d75cc79,
  @SourceEntityID = @SourceEntityID_0d75cc79,
  @SourceEntityID_Clear = 1,
  @SourceFieldName = @SourceFieldName_0d75cc79,
  @IsComputed = @IsComputed_0d75cc79,
  @ComputationDescription = @ComputationDescription_0d75cc79,
  @IsSummary = @IsSummary_0d75cc79,
  @SummaryDescription = @SummaryDescription_0d75cc79,
  @SummaryDescription_Clear = 1,
  @DetectionMethod = @DetectionMethod_0d75cc79,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_0d75cc79,
  @AutoDetectConfidenceScore_Clear = 1;

GO

-- Save MJ: Queries (core SP call only)
DECLARE @Name_a712e52b NVARCHAR(255),
@CategoryID_a712e52b UNIQUEIDENTIFIER,
@UserQuestion_a712e52b NVARCHAR(MAX),
@Description_a712e52b NVARCHAR(MAX),
@SQL_a712e52b NVARCHAR(MAX),
@TechnicalDescription_a712e52b NVARCHAR(MAX),
@OriginalSQL_a712e52b NVARCHAR(MAX),
@Feedback_a712e52b NVARCHAR(MAX),
@Status_a712e52b NVARCHAR(15),
@QualityRank_a712e52b INT,
@ExecutionCostRank_a712e52b INT,
@UsesTemplate_a712e52b BIT,
@AuditQueryRuns_a712e52b BIT,
@CacheEnabled_a712e52b BIT,
@CacheTTLMinutes_a712e52b INT,
@CacheMaxSize_a712e52b INT,
@EmbeddingVector_a712e52b NVARCHAR(MAX),
@EmbeddingModelID_a712e52b UNIQUEIDENTIFIER,
@CacheValidationSQL_a712e52b NVARCHAR(MAX),
@SQLDialectID_a712e52b UNIQUEIDENTIFIER,
@Reusable_a712e52b BIT,
@ExternalDataSourceID_a712e52b UNIQUEIDENTIFIER,
@ID_a712e52b UNIQUEIDENTIFIER
SET
  @Name_a712e52b = N'Sonar: Score Movers'
SET
  @Description_a712e52b = N'Biggest individual score movers between two snapshot days for a model: the top N risers and top N fallers by signed score change, with each member''s current score and band. Derived from history snapshots (not the stored Score.Delta, which a no-op re-run resets to zero). Powers the Overview ''biggest drops / gains'' lists at any look-back window.'
SET
  @SQL_a712e52b = N'WITH snap AS (
    SELECT h.AnchorRecordID, h.BandID, h.NormalizedScore,
        CONVERT(date, COALESCE(h.AsOfDate, h.ComputedAt)) AS SnapshotDay,
        ROW_NUMBER() OVER (PARTITION BY h.AnchorRecordID, CONVERT(date, COALESCE(h.AsOfDate, h.ComputedAt)) ORDER BY h.AsOfDate DESC, h.ComputedAt DESC) AS rn
    FROM [${flyway:defaultSchema}].[ScoreHistory] h
    WHERE h.ScoreModelID = {{ ModelID | sqlString }}
      AND CONVERT(date, COALESCE(h.AsOfDate, h.ComputedAt)) IN ({{ FromDay | sqlString }}, {{ ToDay | sqlString }})
), diff AS (
    SELECT f.AnchorRecordID,
        ROUND(t.NormalizedScore, 0) - ROUND(f.NormalizedScore, 0) AS Delta,
        ROUND(t.NormalizedScore, 0) AS CurrentScore,
        t.BandID
    FROM snap f
    JOIN snap t ON t.AnchorRecordID = f.AnchorRecordID AND t.SnapshotDay = {{ ToDay | sqlString }} AND t.rn = 1
    WHERE f.SnapshotDay = {{ FromDay | sqlString }} AND f.rn = 1
      AND ROUND(t.NormalizedScore, 0) <> ROUND(f.NormalizedScore, 0)
), ranked AS (
    SELECT AnchorRecordID, Delta, CurrentScore, BandID,
        CASE WHEN Delta > 0 THEN ''riser'' ELSE ''faller'' END AS Direction,
        ROW_NUMBER() OVER (PARTITION BY CASE WHEN Delta > 0 THEN 1 ELSE 0 END ORDER BY ABS(Delta) DESC) AS rk
    FROM diff
)
SELECT r.AnchorRecordID, r.Delta, r.CurrentScore,
       CONVERT(varchar(36), r.BandID) AS BandID,
       ISNULL(b.Label, ''Unbanded'') AS BandLabel, r.Direction
FROM ranked r
LEFT JOIN [${flyway:defaultSchema}].[ScoreBand] b ON b.ID = r.BandID
WHERE r.rk <= {{ MaxEach | sqlNumber }}
ORDER BY r.Delta DESC'
SET
  @Status_a712e52b = N'Approved'
SET
  @QualityRank_a712e52b = 0
SET
  @UsesTemplate_a712e52b = 1
SET
  @AuditQueryRuns_a712e52b = 0
SET
  @CacheEnabled_a712e52b = 0
SET
  @EmbeddingVector_a712e52b = N'[-0.07814165204763412,0.027957571670413017,-0.020988311618566513,-0.032721441239118576,-0.010201364755630493,-0.056624844670295715,-0.003168276511132717,-0.012210643850266933,0.013591418042778969,0.03493879362940788,0.029180927202105522,0.020590417087078094,-0.006021822802722454,0.14358969032764435,-0.046741124242544174,-0.02604283019900322,0.011314067989587784,0.0005797886406071484,-0.08138532936573029,-0.018735423684120178,-0.037534311413764954,-0.0064993323758244514,-0.007929295301437378,-0.014233376830816269,0.03247394040226936,-0.01646789163351059,-0.019130749627947807,0.036886896938085556,0.03987092897295952,-0.09392222762107849,-0.0076062302105128765,0.015122112818062305,-0.024286776781082153,0.06090736389160156,0.0000024436369585600914,-0.003948078490793705,-0.023130342364311218,0.012373620644211769,-0.01668713428080082,0.009920496493577957,-0.00826574582606554,0.02968127653002739,-0.024472065269947052,-0.007964977994561195,-0.01707543432712555,0.006574944593012333,-0.07116974145174026,-0.08325149118900299,0.04122167080640793,0.009690292179584503,0.021000875160098076,-0.01881481520831585,-0.06793121993541718,-0.0008896910585463047,0.05035342276096344,-0.03191586956381798,0.015857193619012833,0.04918104037642479,-0.006714115850627422,-0.024831406772136688,-0.024194402620196342,0.010153407230973244,0.015870848670601845,-0.07299420237541199,0.0753428041934967,0.04521561786532402,0.023268792778253555,-0.0008179527358151972,-0.006193362642079592,0.006564496550709009,0.08189170807600021,0.025500299409031868,0.01429035048931837,-0.02648969553411007,-0.02488100528717041,-0.08127151429653168,-0.02201572060585022,-0.033838123083114624,0.002817584667354822,-0.026543455198407173,-0.050218015909194946,0.11177597939968109,-0.015552207827568054,0.005695707630366087,-0.053208157420158386,0.00731796957552433,-0.005606069695204496,-0.016054527834057808,0.0025697164237499237,-0.037371501326560974,0.035868898034095764,-0.0012899171561002731,-0.006123242434114218,-0.008239606395363808,-0.05802333727478981,0.016028882935643196,0.0557049922645092,-0.022484876215457916,0.014378254301846027,-0.013632016256451607,0.026818757876753807,-0.018007827922701836,0.007181903813034296,0.0531381331384182,0.017816072329878807,-0.008662240579724312,0.02695225365459919,-0.047422170639038086,-0.02490907348692417,0.06471510976552963,-0.00006735744682373479,-0.010118729434907436,0.07148703932762146,0.01968630962073803,0.033317361027002335,0.009975182823836803,-0.054394662380218506,-0.008832907304167747,-0.02924244850873947,-0.016866834834218025,0.07117267698049545,-0.0011551290517672896,-0.017554592341184616,0.028060991317033768,0.05985111743211746,0.0572129525244236,-0.00814872793853283,-0.04075778275728226,0.07275650650262833,0.010782315395772457,-0.013370048254728317,-0.037705980241298676,0.006046631373465061,0.004441858269274235,0.007162798196077347,-0.04575420916080475,0.01664016768336296,0.021042194217443466,0.03671986237168312,-0.013234666548669338,0.02608473226428032,-0.012013494968414307,-0.055402882397174835,0.022205183282494545,-0.019057011231780052,-0.03469797596335411,-0.016702478751540184,0.03937551751732826,0.0008626162307336926,0.017688719555735588,0.0024541299790143967,0.02348969876766205,0.0043408554047346115,0.011822621338069439,0.014241109602153301,0.014573459513485432,-0.026771416887640953,0.02014906518161297,0.010673017241060734,0.021919112652540207,0.006714743562042713,-0.026156531646847725,-0.06950899213552475,0.014266440644860268,-0.0003527210501488298,-0.023912711068987846,-0.09833455830812454,-0.03191700950264931,-0.03822891786694527,-0.015866892412304878,-0.004691327456384897,-0.04679922014474869,-0.004989457316696644,-0.003092583967372775,0.034303855150938034,0.003902875818312168,0.030991749837994576,0.030818400904536247,-0.04230574890971184,-0.054819732904434204,-0.05274206027388573,-0.11676186323165894,-0.010422978550195694,-0.008879190310835838,0.014654119499027729,-0.013720076531171799,-0.026401378214359283,-0.0007496149046346545,-0.010312727652490139,0.016340618953108788,0.017070919275283813,0.014068656601011753,-0.03905155137181282,0.022804714739322662,-0.0021256492473185062,0.014837277121841908,0.004986136220395565,0.0386299267411232,0.01631193235516548,0.012279687449336052,0.011949907056987286,-0.024958182126283646,-0.010910384356975555,-0.012812331318855286,0.026649409905076027,-0.0634814128279686,0.03719967231154442,0.0003419301356188953,-0.017931051552295685,-0.004279200453311205,0.02626541070640087,0.040047891438007355,-0.05311965569853783,-0.011487641371786594,0.0021893715020269156,0.08599348366260529,0.002294332953169942,0.009929032064974308,-0.0756777748465538,0.01461645308881998,-0.016272597014904022,-0.005735038314014673,-0.0690252035856247,-0.008322115056216717,0.06556683778762817,0.07485596835613251,0.020955685526132584,-0.0411161370575428,0.008477599360048771,0.016182733699679375,0.01738368719816208,0.008164291270077229,0.046956174075603485,0.005085775163024664,-0.018249228596687317,0.0335867665708065,0.0231582373380661,0.03958722949028015,-0.012126530520617962,0.061651572585105896,0.027533071115612984,0.011303936131298542,-0.056660931557416916,0.021667568013072014,0.034504424780607224,0.014606750570237637,-0.13641883432865143,0.016870848834514618,-0.0019768071360886097,0.008488046005368233,-0.020531805232167244,0.02894170582294464,0.07422980666160583,-0.03438796475529671,0.012462368234992027,-0.0885068029165268,0.0009863708401098847,-0.014495923183858395,-0.0019220984540879726,0.07409361749887466,0.05194791406393051,-0.029901575297117233,-0.03734990209341049,-0.013571885414421558,0.018425319343805313,-0.04181760177016258,0.026688227429986,-0.006921643391251564,0.0015642833895981312,0.008698702789843082,0.06236798316240311,-0.025089722126722336,0.016003398224711418,0.014015312306582928,0.01843101717531681,0.023785993456840515,-0.07969669997692108,0.0092964181676507,-0.00038559158565476537,-0.015070692636072636,-0.0021402048878371716,0.000181120092747733,-0.019798196852207184,-0.0005989862838760018,0.014665164053440094,0.0316491536796093,0.07573391497135162,-0.026552127674221992,-0.03216366842389107,-0.03858843073248863,-0.05274840444326401,-0.05130947008728981,-0.02207077108323574,-0.014254821464419365,0.002686762250959873,-0.008416101336479187,0.02294241264462471,0.11895105987787247,0.051527757197618484,0.09904303401708603,-0.005153435282409191,-0.004808012396097183,-0.01148989051580429,-0.005361668299883604,-0.02605605684220791,0.016518861055374146,-0.021431785076856613,-0.0446474514901638,-0.01756708323955536,0.09642602503299713,0.00019147180137224495,0.015067939646542072,0.01972384564578533,-0.02066914178431034,-0.035821497440338135,-0.03541945666074753,0.007270136848092079,0.019790954887866974,-0.09337277710437775,0.03948060795664787,0.023774422705173492,-0.0066739642061293125,-0.02971273846924305,0.08753412961959839,-0.0056341784074902534,-0.016412915661931038,-0.007147841155529022,-0.028177058324217796,-0.002417505020275712,-0.025111623108386993,0.02488437108695507,-0.008112992160022259,-0.03452632948756218,0.042166586965322495,-0.058881476521492004,-0.004490239080041647,-0.07284267991781235,-0.06649498641490936,-0.020200764760375023,0.02616400085389614,-0.017374036833643913,-0.017749909311532974,0.02530297264456749,-0.005219009704887867,0.01661156304180622,-0.0026379269547760487,-0.026372548192739487,0.018967757001519203,-0.02434578910470009,-0.00461365794762969,0.008168297819793224,-0.009768562391400337,-0.026739204302430153,-0.019276471808552742,-0.016406415030360222,-0.0031526219099760056,-0.027838746085762978,-0.014448408968746662,-0.011662749573588371,-0.0691460445523262,0.020104963332414627,0.016900990158319473,0.10270784050226212,0.023638738319277763,-0.003696173196658492,0.001247267471626401,0.008157022297382355,-0.020840097218751907,0.024626068770885468,-0.013194025494158268,0.015140306204557419,-0.005568855907768011,0.021221144124865532,0.021220918744802475,-0.006394128315150738,-0.008515526540577412,0.019036494195461273,0.02027522586286068,0.05011461675167084,0.006341839209198952,-0.0016484103398397565,-0.005328724160790443,0.05583120882511139,-0.026425443589687347,0.05666026100516319,-0.020017843693494797,-0.04948023334145546,-0.03345565125346184,-0.02904656156897545,0.05657117813825607,0.014716501347720623,-0.01762312650680542,0.07951677590608597,-0.00451395520940423,-0.0003594198205973953,-0.0400485023856163,-0.06409134715795517,0.008746203035116196,0.004574289545416832,0.010114850476384163,0.032384902238845825,0.05125490203499794,0.03571266308426857,0.041094597429037094,-0.016352860257029533,-0.028013935312628746,0.028934555128216743,0.028520524501800537,-0.03727157041430473,0.03344260901212692,-0.008472518064081669,-0.04355023056268692,0.01610802300274372,-0.03554752469062805,0.013425314798951149,-0.00020956939260941,-0.0003066783829126507,0.0030903101433068514,0.002345920540392399,0.013266527093946934,0.062241096049547195,0.020300716161727905,0.024284901097416878,0.0367150641977787,-0.004197343718260527,-0.004893436562269926,0.03650201857089996,-0.044574663043022156,0.010493435896933079,-0.008878448978066444,0.012864219956099987,0.041324082762002945,-0.003580109216272831,0.08447016030550003,-0.01723748818039894,-0.08776036649942398,-0.0121019147336483,0.026482196524739265,0.018786191940307617,-0.003148297779262066,-0.01831122860312462,-0.03215406835079193,0.06481802463531494,-0.03911072015762329,0.046206261962652206,-0.02460022084414959,-0.0376613475382328,0.004103115759789944,-0.028851205483078957,-0.03110634721815586,0.025903748348355293,0.026304807513952255,0.006543823983520269,0.044836319983005524,0.053664665669202805,-0.02708570472896099,-0.03137893229722977,-0.05691446736454964,-0.016121644526720047,0.013766508549451828,0.034726060926914215,0.04239260032773018,-0.058336175978183746,0.0210413821041584,0.04464433342218399,0.01308000460267067,0.022601762786507607,0.05182703956961632,0.011121946386992931,-0.035075947642326355,-0.026440216228365898,-0.034213416278362274,-0.015339183621108532,-0.029994066804647446,0.033369243144989014,-0.0008828329155221581,0.012664847075939178,0.013658362440764904,0.05083389952778816,-0.007416100241243839,-0.020835136994719505,-0.014679309912025928,0.020576633512973785,-0.056194182485342026,-0.010033986531198025,0.037591602653265,-0.052088428288698196,0.002246548654511571,-0.01171904057264328,0.010233372449874878,0.031082957983016968,-0.04522855207324028,-0.04702676460146904,0.06862308830022812,-0.0007281260332092643,0.010364177636802197,-0.06331790238618851,0.025304429233074188,-0.0030532788950949907,0.03365449979901314,-0.011478190310299397,0.009691281244158745,-0.024290062487125397,-0.05622302368283272,0.026927392929792404,0.05071815103292465,0.05452585220336914,-0.006773484870791435,0.02780153602361679,-0.0029546674340963364,0.009834765456616879,0.0009742274996824563,-0.018201062455773354,-0.036211445927619934,0.00805160403251648,-0.08770433068275452,-0.042750973254442215,0.08996130526065826,0.04327669367194176,0.030626831576228142,0.009898485615849495,-0.01667446829378605,-0.0025592204183340073,0.013962887227535248,0.029074640944600105,-0.040930069983005524,0.031054310500621796,0.013671636581420898,0.061343833804130554,0.02914835326373577,-0.004025958012789488,0.007541360799223185,0.006312129553407431,0.03720152750611305,-0.0050317975692451,0.01346913818269968,-0.03104294277727604,-0.01747625321149826,0.0460503026843071,-0.0446496345102787,-0.09103980660438538,0.014431298710405827,0.04179265350103378,0.011340058408677578,0.056803639978170395,0.02015557326376438,0.01981045864522457,-0.04041634127497673,0.003052414394915104,0.03732611984014511,0.02683766931295395,-0.03598688170313835,-0.13353200256824493,-0.035083673894405365,-0.031177956610918045,-7.915945731698307e-33,-0.056661415845155716,-0.016883041709661484,-0.030352987349033356,-0.013023676350712776,-0.07671540230512619,0.014121706597507,-0.009213089942932129,-0.07156898826360703,-0.017661670222878456,-0.03231560066342354,-0.009439006447792053,0.02196948044002056,0.038233209401369095,-0.021241145208477974,0.03759414330124855,-0.0007474917219951749,0.028392497450113297,-0.03635188192129135,-0.0006325055728666484,0.0470842681825161,-0.0018528301734477282,0.042397793382406235,0.010722546838223934,0.014308277517557144,-0.014342489652335644,0.0024690204299986362,-0.052475836127996445,0.015303360298275948,-0.055601879954338074,-0.03673817217350006,0.050009649246931076,-0.0015441718278452754,-0.0074634975753724575,-0.002166472841054201,0.0038048934657126665,-0.11386559158563614,-0.02498687617480755,-0.0009863954037427902,-0.011019169352948666,-0.031856469810009,0.04947681725025177,0.03752424567937851,0.006860966328531504,0.000046605244278907776,-0.0026937639340758324,-0.06431149691343307,0.020481051877141,0.016988353803753853,-0.04804046079516411,-0.051801830530166626,0.02619774639606476,0.02211286500096321,-0.019086046144366264,0.04516300559043884,-0.04879153147339821,-0.013520434498786926,0.030149273574352264,0.02217772789299488,-0.0028580185025930405,0.019744278863072395,0.07165589928627014,0.0446130596101284,-0.0018111167009919882,0.037077222019433975,0.01287496741861105,0.03137325122952461,0.04251498356461525,0.04766689985990524,0.13775435090065002,-0.05609570071101189,-0.02481016330420971,0.030720459297299385,-0.03258785232901573,-0.04627396538853645,0.06494191288948059,0.002431461587548256,-0.0029877335764467716,-0.010939119383692741,0.07181008160114288,0.0008080489933490753,-0.008447971194982529,0.016159292310476303,-0.022318828850984573,0.03267216309905052,-0.010096072219312191,-0.0683586373925209,-0.024361152201890945,-0.04725842550396919,0.016644267365336418,0.031228454783558846,-0.024201851338148117,0.01531094778329134,-0.02770387940108776,0.023409787565469742,-0.020807571709156036,-0.018381692469120026,0.06104276701807976,0.02752275951206684,-0.03797841817140579,-0.028706975281238556,0.042906615883111954,0.018372323364019394,0.06165038049221039,-0.001529046567156911,0.016884248703718185,0.0035808344837278128,-0.018955010920763016,0.015280770137906075,-0.010220130905508995,0.0017331764101982117,0.030270373448729515,-0.009949211031198502,-0.029286371544003487,-0.012365134432911873,0.019188184291124344,-0.03659328073263168,-0.013918424025177956,0.026975523680448532,0.0336906835436821,0.07260508090257645,-0.016272516921162605,0.04527156054973602,-0.006220237817615271,0.052985597401857376,0.00027394553762860596,-0.0007989104487933218,0.04979478195309639,-0.0098827313631773,-0.03322383016347885,0.018872134387493134,-0.02365201711654663,0.014885465614497662,3.332397113808838e-7,0.00801370944827795,0.03757912665605545,-0.0034487168304622173,0.00952430721372366,0.049233097583055496,0.026367710903286934,-0.018684087321162224,-0.002579574240371585,0.0586080439388752,-0.004087838344275951,0.0001822798658395186,-0.017172742635011673,0.031932324171066284,0.010168618522584438,0.014814559370279312,-0.0005332056898623705,0.01588503085076809,-0.05106295272707939,-0.05366622284054756,-0.045254942029714584,0.06364622712135315,-0.03257359564304352,0.017132841050624847,-0.01760324276983738,-0.021208498626947403,-0.008718336932361126,0.009823013097047806,-0.02387511357665062,-0.04705829545855522,-0.02942885458469391,0.058885782957077026,-0.07618112862110138,-0.03749985620379448,-0.0363655611872673,0.005159576423466206,0.029067497700452805,0.00035255809780210257,-0.05203040689229965,-0.013420727103948593,-0.004847170785069466,-0.026688730344176292,0.06232810392975807,-0.009091775864362717,0.011034581810235977,0.012788467109203339,-0.04953351616859436,-0.039037223905324936,-0.034121107310056686,-0.10217417031526566,-0.042598906904459,0.01232677698135376,0.006328181829303503,-0.019834909588098526,0.041624076664447784,0.0032727255020290613,0.016173189505934715,-0.009796162135899067,0.007657953538000584,0.0003065454075112939,-0.019442623481154442,-0.007314969319850206,-0.03447738289833069,0.012869356200098991,0.06263856589794159,-0.025545326992869377,-0.016602544113993645,-0.02370450086891651,3.4702051124775435e-34,0.0268695205450058,0.012560085393488407,0.006013844162225723,0.029891375452280045,0.021649718284606934,0.005094739142805338,-0.017859749495983124,0.00012860741117037833,-0.009504236280918121,-0.019271664321422577,-0.02921247109770775]'
SET
  @EmbeddingModelID_a712e52b = '1D45AA65-41EC-4572-9ECD-AB2826C9B059'
SET
  @SQLDialectID_a712e52b = '1F203987-A37B-4BC1-85B3-BA50DC33C3E0'
SET
  @Reusable_a712e52b = 0
SET
  @ID_a712e52b = '5044A100-0020-4000-8000-000000000003' EXEC [__mj].spUpdateQuery @Name = @Name_a712e52b,
  @CategoryID = @CategoryID_a712e52b,
  @CategoryID_Clear = 1,
  @UserQuestion = @UserQuestion_a712e52b,
  @UserQuestion_Clear = 1,
  @Description = @Description_a712e52b,
  @SQL = @SQL_a712e52b,
  @TechnicalDescription = @TechnicalDescription_a712e52b,
  @TechnicalDescription_Clear = 1,
  @OriginalSQL = @OriginalSQL_a712e52b,
  @OriginalSQL_Clear = 1,
  @Feedback = @Feedback_a712e52b,
  @Feedback_Clear = 1,
  @Status = @Status_a712e52b,
  @QualityRank = @QualityRank_a712e52b,
  @ExecutionCostRank = @ExecutionCostRank_a712e52b,
  @ExecutionCostRank_Clear = 1,
  @UsesTemplate = @UsesTemplate_a712e52b,
  @AuditQueryRuns = @AuditQueryRuns_a712e52b,
  @CacheEnabled = @CacheEnabled_a712e52b,
  @CacheTTLMinutes = @CacheTTLMinutes_a712e52b,
  @CacheTTLMinutes_Clear = 1,
  @CacheMaxSize = @CacheMaxSize_a712e52b,
  @CacheMaxSize_Clear = 1,
  @EmbeddingVector = @EmbeddingVector_a712e52b,
  @EmbeddingModelID = @EmbeddingModelID_a712e52b,
  @CacheValidationSQL = @CacheValidationSQL_a712e52b,
  @CacheValidationSQL_Clear = 1,
  @SQLDialectID = @SQLDialectID_a712e52b,
  @Reusable = @Reusable_a712e52b,
  @ExternalDataSourceID = @ExternalDataSourceID_a712e52b,
  @ExternalDataSourceID_Clear = 1,
  @ID = @ID_a712e52b;

GO

-- Save MJ: Query Entities (core SP call only)
DECLARE @ID_aaddafca UNIQUEIDENTIFIER,
@QueryID_aaddafca UNIQUEIDENTIFIER,
@EntityID_aaddafca UNIQUEIDENTIFIER,
@DetectionMethod_aaddafca NVARCHAR(50),
@AutoDetectConfidenceScore_aaddafca DECIMAL(3, 2)
SET
  @ID_aaddafca = '89b4655d-af04-4fd0-a70f-c281651ebe15'
SET
  @QueryID_aaddafca = '5044A100-0020-4000-8000-000000000002'
SET
  @EntityID_aaddafca = '1F1CBA7E-F548-420E-9B71-30891E454C42'
SET
  @DetectionMethod_aaddafca = N'AI'
SET
  @AutoDetectConfidenceScore_aaddafca = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryEntity] WHERE ID = @ID_aaddafca)
EXEC [__mj].spCreateQueryEntity @ID = @ID_aaddafca,
  @QueryID = @QueryID_aaddafca,
  @EntityID = @EntityID_aaddafca,
  @DetectionMethod = @DetectionMethod_aaddafca,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_aaddafca;

GO

-- Save MJ: Query Entities (core SP call only)
DECLARE @ID_78aed961 UNIQUEIDENTIFIER,
@QueryID_78aed961 UNIQUEIDENTIFIER,
@EntityID_78aed961 UNIQUEIDENTIFIER,
@DetectionMethod_78aed961 NVARCHAR(50),
@AutoDetectConfidenceScore_78aed961 DECIMAL(3, 2)
SET
  @ID_78aed961 = '9b26f334-f1a7-442d-9b9b-4ee6e690937d'
SET
  @QueryID_78aed961 = '5044A100-0020-4000-8000-000000000002'
SET
  @EntityID_78aed961 = '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A'
SET
  @DetectionMethod_78aed961 = N'AI'
SET
  @AutoDetectConfidenceScore_78aed961 = 1
IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryEntity] WHERE ID = @ID_78aed961)
EXEC [__mj].spCreateQueryEntity @ID = @ID_78aed961,
  @QueryID = @QueryID_78aed961,
  @EntityID = @EntityID_78aed961,
  @DetectionMethod = @DetectionMethod_78aed961,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_78aed961;

GO

-- Save MJ: Query Parameters (core SP call only)
DECLARE @ID_48bd2217 UNIQUEIDENTIFIER,
@QueryID_48bd2217 UNIQUEIDENTIFIER,
@Name_48bd2217 NVARCHAR(255),
@Type_48bd2217 NVARCHAR(50),
@IsRequired_48bd2217 BIT,
@DefaultValue_48bd2217 NVARCHAR(MAX),
@Description_48bd2217 NVARCHAR(MAX),
@SampleValue_48bd2217 NVARCHAR(MAX),
@ValidationFilters_48bd2217 NVARCHAR(MAX),
@DetectionMethod_48bd2217 NVARCHAR(50),
@AutoDetectConfidenceScore_48bd2217 DECIMAL(3, 2)
SET
  @ID_48bd2217 = '4d6ec235-b0e2-4a90-a24e-e87b6bbd4ab1'
SET
  @QueryID_48bd2217 = '5044A100-0020-4000-8000-000000000002'
SET
  @Name_48bd2217 = N'ModelID'
SET
  @Type_48bd2217 = N'string'
SET
  @IsRequired_48bd2217 = 1
SET
  @Description_48bd2217 = N'The unique identifier of the Score Model to filter score histories.'
SET
  @SampleValue_48bd2217 = N'e2a4b8c1-1234-5678-90ab-cdef12345678'
SET
  @DetectionMethod_48bd2217 = N'AI' IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryParameter] WHERE ID = @ID_48bd2217)
EXEC [__mj].spCreateQueryParameter @ID = @ID_48bd2217,
  @QueryID = @QueryID_48bd2217,
  @Name = @Name_48bd2217,
  @Type = @Type_48bd2217,
  @IsRequired = @IsRequired_48bd2217,
  @DefaultValue = @DefaultValue_48bd2217,
  @DefaultValue_Clear = 1,
  @Description = @Description_48bd2217,
  @SampleValue = @SampleValue_48bd2217,
  @ValidationFilters = @ValidationFilters_48bd2217,
  @ValidationFilters_Clear = 1,
  @DetectionMethod = @DetectionMethod_48bd2217,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_48bd2217,
  @AutoDetectConfidenceScore_Clear = 1;

GO

-- Save MJ: Query Parameters (core SP call only)
DECLARE @ID_71f03252 UNIQUEIDENTIFIER,
@QueryID_71f03252 UNIQUEIDENTIFIER,
@Name_71f03252 NVARCHAR(255),
@Type_71f03252 NVARCHAR(50),
@IsRequired_71f03252 BIT,
@DefaultValue_71f03252 NVARCHAR(MAX),
@Description_71f03252 NVARCHAR(MAX),
@SampleValue_71f03252 NVARCHAR(MAX),
@ValidationFilters_71f03252 NVARCHAR(MAX),
@DetectionMethod_71f03252 NVARCHAR(50),
@AutoDetectConfidenceScore_71f03252 DECIMAL(3, 2)
SET
  @ID_71f03252 = 'd8495562-9800-4e92-aef9-351bd39d5098'
SET
  @QueryID_71f03252 = '5044A100-0020-4000-8000-000000000002'
SET
  @Name_71f03252 = N'FromDay'
SET
  @Type_71f03252 = N'string'
SET
  @IsRequired_71f03252 = 1
SET
  @Description_71f03252 = N'The starting snapshot date for the band transition analysis.'
SET
  @SampleValue_71f03252 = N'2023-10-01'
SET
  @DetectionMethod_71f03252 = N'AI' IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryParameter] WHERE ID = @ID_71f03252)
EXEC [__mj].spCreateQueryParameter @ID = @ID_71f03252,
  @QueryID = @QueryID_71f03252,
  @Name = @Name_71f03252,
  @Type = @Type_71f03252,
  @IsRequired = @IsRequired_71f03252,
  @DefaultValue = @DefaultValue_71f03252,
  @DefaultValue_Clear = 1,
  @Description = @Description_71f03252,
  @SampleValue = @SampleValue_71f03252,
  @ValidationFilters = @ValidationFilters_71f03252,
  @ValidationFilters_Clear = 1,
  @DetectionMethod = @DetectionMethod_71f03252,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_71f03252,
  @AutoDetectConfidenceScore_Clear = 1;

GO

-- Save MJ: Query Parameters (core SP call only)
DECLARE @ID_ce4e8f55 UNIQUEIDENTIFIER,
@QueryID_ce4e8f55 UNIQUEIDENTIFIER,
@Name_ce4e8f55 NVARCHAR(255),
@Type_ce4e8f55 NVARCHAR(50),
@IsRequired_ce4e8f55 BIT,
@DefaultValue_ce4e8f55 NVARCHAR(MAX),
@Description_ce4e8f55 NVARCHAR(MAX),
@SampleValue_ce4e8f55 NVARCHAR(MAX),
@ValidationFilters_ce4e8f55 NVARCHAR(MAX),
@DetectionMethod_ce4e8f55 NVARCHAR(50),
@AutoDetectConfidenceScore_ce4e8f55 DECIMAL(3, 2)
SET
  @ID_ce4e8f55 = '32fb0dda-e203-4251-ada8-98d13fc0825a'
SET
  @QueryID_ce4e8f55 = '5044A100-0020-4000-8000-000000000002'
SET
  @Name_ce4e8f55 = N'ToDay'
SET
  @Type_ce4e8f55 = N'string'
SET
  @IsRequired_ce4e8f55 = 1
SET
  @Description_ce4e8f55 = N'The ending snapshot date for the band transition analysis.'
SET
  @SampleValue_ce4e8f55 = N'2023-10-31'
SET
  @DetectionMethod_ce4e8f55 = N'AI' IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryParameter] WHERE ID = @ID_ce4e8f55)
EXEC [__mj].spCreateQueryParameter @ID = @ID_ce4e8f55,
  @QueryID = @QueryID_ce4e8f55,
  @Name = @Name_ce4e8f55,
  @Type = @Type_ce4e8f55,
  @IsRequired = @IsRequired_ce4e8f55,
  @DefaultValue = @DefaultValue_ce4e8f55,
  @DefaultValue_Clear = 1,
  @Description = @Description_ce4e8f55,
  @SampleValue = @SampleValue_ce4e8f55,
  @ValidationFilters = @ValidationFilters_ce4e8f55,
  @ValidationFilters_Clear = 1,
  @DetectionMethod = @DetectionMethod_ce4e8f55,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_ce4e8f55,
  @AutoDetectConfidenceScore_Clear = 1;

GO

-- Save MJ: Query Fields (core SP call only)
DECLARE @ID_6b90d42b UNIQUEIDENTIFIER,
@QueryID_6b90d42b UNIQUEIDENTIFIER,
@Name_6b90d42b NVARCHAR(255),
@Description_6b90d42b NVARCHAR(MAX),
@Sequence_6b90d42b INT,
@SQLBaseType_6b90d42b NVARCHAR(50),
@SQLFullType_6b90d42b NVARCHAR(100),
@SourceEntityID_6b90d42b UNIQUEIDENTIFIER,
@SourceFieldName_6b90d42b NVARCHAR(255),
@IsComputed_6b90d42b BIT,
@ComputationDescription_6b90d42b NVARCHAR(MAX),
@IsSummary_6b90d42b BIT,
@SummaryDescription_6b90d42b NVARCHAR(MAX),
@DetectionMethod_6b90d42b NVARCHAR(50),
@AutoDetectConfidenceScore_6b90d42b DECIMAL(3, 2)
SET
  @ID_6b90d42b = '4a2f4aff-efc3-4cb3-a13f-d1bde583c476'
SET
  @QueryID_6b90d42b = '5044A100-0020-4000-8000-000000000002'
SET
  @Name_6b90d42b = N'FromBandID'
SET
  @Description_6b90d42b = N'The unique identifier of the starting score band.'
SET
  @Sequence_6b90d42b = 1
SET
  @SQLBaseType_6b90d42b = N'nvarchar'
SET
  @SQLFullType_6b90d42b = N'nvarchar(MAX)'
SET
  @SourceEntityID_6b90d42b = '1F1CBA7E-F548-420E-9B71-30891E454C42'
SET
  @IsComputed_6b90d42b = 1
SET
  @ComputationDescription_6b90d42b = N'CONVERT(varchar(36), f.BandID) to cast the uniqueidentifier to a string representation.'
SET
  @IsSummary_6b90d42b = 0
SET
  @DetectionMethod_6b90d42b = N'Manual' IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryField] WHERE ID = @ID_6b90d42b)
EXEC [__mj].spCreateQueryField @ID = @ID_6b90d42b,
  @QueryID = @QueryID_6b90d42b,
  @Name = @Name_6b90d42b,
  @Description = @Description_6b90d42b,
  @Sequence = @Sequence_6b90d42b,
  @SQLBaseType = @SQLBaseType_6b90d42b,
  @SQLFullType = @SQLFullType_6b90d42b,
  @SourceEntityID = @SourceEntityID_6b90d42b,
  @SourceFieldName = @SourceFieldName_6b90d42b,
  @SourceFieldName_Clear = 1,
  @IsComputed = @IsComputed_6b90d42b,
  @ComputationDescription = @ComputationDescription_6b90d42b,
  @IsSummary = @IsSummary_6b90d42b,
  @SummaryDescription = @SummaryDescription_6b90d42b,
  @SummaryDescription_Clear = 1,
  @DetectionMethod = @DetectionMethod_6b90d42b,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_6b90d42b,
  @AutoDetectConfidenceScore_Clear = 1;

GO

-- Save MJ: Query Fields (core SP call only)
DECLARE @ID_40d62c35 UNIQUEIDENTIFIER,
@QueryID_40d62c35 UNIQUEIDENTIFIER,
@Name_40d62c35 NVARCHAR(255),
@Description_40d62c35 NVARCHAR(MAX),
@Sequence_40d62c35 INT,
@SQLBaseType_40d62c35 NVARCHAR(50),
@SQLFullType_40d62c35 NVARCHAR(100),
@SourceEntityID_40d62c35 UNIQUEIDENTIFIER,
@SourceFieldName_40d62c35 NVARCHAR(255),
@IsComputed_40d62c35 BIT,
@ComputationDescription_40d62c35 NVARCHAR(MAX),
@IsSummary_40d62c35 BIT,
@SummaryDescription_40d62c35 NVARCHAR(MAX),
@DetectionMethod_40d62c35 NVARCHAR(50),
@AutoDetectConfidenceScore_40d62c35 DECIMAL(3, 2)
SET
  @ID_40d62c35 = '972d7a0c-ade1-470c-9d76-8bbab682be9c'
SET
  @QueryID_40d62c35 = '5044A100-0020-4000-8000-000000000002'
SET
  @Name_40d62c35 = N'FromBand'
SET
  @Description_40d62c35 = N'The label of the starting score band, defaulting to ''Unbanded'' if null.'
SET
  @Sequence_40d62c35 = 2
SET
  @SQLBaseType_40d62c35 = N'nvarchar'
SET
  @SQLFullType_40d62c35 = N'nvarchar(MAX)'
SET
  @SourceEntityID_40d62c35 = '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A'
SET
  @IsComputed_40d62c35 = 1
SET
  @ComputationDescription_40d62c35 = N'ISNULL(fb.Label, ''Unbanded'') to handle null values for unbanded records.'
SET
  @IsSummary_40d62c35 = 0
SET
  @DetectionMethod_40d62c35 = N'Manual' IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryField] WHERE ID = @ID_40d62c35)
EXEC [__mj].spCreateQueryField @ID = @ID_40d62c35,
  @QueryID = @QueryID_40d62c35,
  @Name = @Name_40d62c35,
  @Description = @Description_40d62c35,
  @Sequence = @Sequence_40d62c35,
  @SQLBaseType = @SQLBaseType_40d62c35,
  @SQLFullType = @SQLFullType_40d62c35,
  @SourceEntityID = @SourceEntityID_40d62c35,
  @SourceFieldName = @SourceFieldName_40d62c35,
  @SourceFieldName_Clear = 1,
  @IsComputed = @IsComputed_40d62c35,
  @ComputationDescription = @ComputationDescription_40d62c35,
  @IsSummary = @IsSummary_40d62c35,
  @SummaryDescription = @SummaryDescription_40d62c35,
  @SummaryDescription_Clear = 1,
  @DetectionMethod = @DetectionMethod_40d62c35,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_40d62c35,
  @AutoDetectConfidenceScore_Clear = 1;

GO

-- Save MJ: Query Fields (core SP call only)
DECLARE @ID_25fe64ae UNIQUEIDENTIFIER,
@QueryID_25fe64ae UNIQUEIDENTIFIER,
@Name_25fe64ae NVARCHAR(255),
@Description_25fe64ae NVARCHAR(MAX),
@Sequence_25fe64ae INT,
@SQLBaseType_25fe64ae NVARCHAR(50),
@SQLFullType_25fe64ae NVARCHAR(100),
@SourceEntityID_25fe64ae UNIQUEIDENTIFIER,
@SourceFieldName_25fe64ae NVARCHAR(255),
@IsComputed_25fe64ae BIT,
@ComputationDescription_25fe64ae NVARCHAR(MAX),
@IsSummary_25fe64ae BIT,
@SummaryDescription_25fe64ae NVARCHAR(MAX),
@DetectionMethod_25fe64ae NVARCHAR(50),
@AutoDetectConfidenceScore_25fe64ae DECIMAL(3, 2)
SET
  @ID_25fe64ae = '53ecb234-46d3-4bc1-84d9-6f4cfb04caff'
SET
  @QueryID_25fe64ae = '5044A100-0020-4000-8000-000000000002'
SET
  @Name_25fe64ae = N'ToBandID'
SET
  @Description_25fe64ae = N'The unique identifier of the ending score band.'
SET
  @Sequence_25fe64ae = 3
SET
  @SQLBaseType_25fe64ae = N'nvarchar'
SET
  @SQLFullType_25fe64ae = N'nvarchar(MAX)'
SET
  @SourceEntityID_25fe64ae = '1F1CBA7E-F548-420E-9B71-30891E454C42'
SET
  @IsComputed_25fe64ae = 1
SET
  @ComputationDescription_25fe64ae = N'CONVERT(varchar(36), t.BandID) to cast the uniqueidentifier to a string representation.'
SET
  @IsSummary_25fe64ae = 0
SET
  @DetectionMethod_25fe64ae = N'Manual' IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryField] WHERE ID = @ID_25fe64ae)
EXEC [__mj].spCreateQueryField @ID = @ID_25fe64ae,
  @QueryID = @QueryID_25fe64ae,
  @Name = @Name_25fe64ae,
  @Description = @Description_25fe64ae,
  @Sequence = @Sequence_25fe64ae,
  @SQLBaseType = @SQLBaseType_25fe64ae,
  @SQLFullType = @SQLFullType_25fe64ae,
  @SourceEntityID = @SourceEntityID_25fe64ae,
  @SourceFieldName = @SourceFieldName_25fe64ae,
  @SourceFieldName_Clear = 1,
  @IsComputed = @IsComputed_25fe64ae,
  @ComputationDescription = @ComputationDescription_25fe64ae,
  @IsSummary = @IsSummary_25fe64ae,
  @SummaryDescription = @SummaryDescription_25fe64ae,
  @SummaryDescription_Clear = 1,
  @DetectionMethod = @DetectionMethod_25fe64ae,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_25fe64ae,
  @AutoDetectConfidenceScore_Clear = 1;

GO

-- Save MJ: Query Fields (core SP call only)
DECLARE @ID_2217c823 UNIQUEIDENTIFIER,
@QueryID_2217c823 UNIQUEIDENTIFIER,
@Name_2217c823 NVARCHAR(255),
@Description_2217c823 NVARCHAR(MAX),
@Sequence_2217c823 INT,
@SQLBaseType_2217c823 NVARCHAR(50),
@SQLFullType_2217c823 NVARCHAR(100),
@SourceEntityID_2217c823 UNIQUEIDENTIFIER,
@SourceFieldName_2217c823 NVARCHAR(255),
@IsComputed_2217c823 BIT,
@ComputationDescription_2217c823 NVARCHAR(MAX),
@IsSummary_2217c823 BIT,
@SummaryDescription_2217c823 NVARCHAR(MAX),
@DetectionMethod_2217c823 NVARCHAR(50),
@AutoDetectConfidenceScore_2217c823 DECIMAL(3, 2)
SET
  @ID_2217c823 = '880b24ae-2d66-4fe0-b82c-bf9a4c3de418'
SET
  @QueryID_2217c823 = '5044A100-0020-4000-8000-000000000002'
SET
  @Name_2217c823 = N'ToBand'
SET
  @Description_2217c823 = N'The label of the ending score band, defaulting to ''Unbanded'' if null.'
SET
  @Sequence_2217c823 = 4
SET
  @SQLBaseType_2217c823 = N'nvarchar'
SET
  @SQLFullType_2217c823 = N'nvarchar(MAX)'
SET
  @SourceEntityID_2217c823 = '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A'
SET
  @IsComputed_2217c823 = 1
SET
  @ComputationDescription_2217c823 = N'ISNULL(tb.Label, ''Unbanded'') to handle null values for unbanded records.'
SET
  @IsSummary_2217c823 = 0
SET
  @DetectionMethod_2217c823 = N'Manual' IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryField] WHERE ID = @ID_2217c823)
EXEC [__mj].spCreateQueryField @ID = @ID_2217c823,
  @QueryID = @QueryID_2217c823,
  @Name = @Name_2217c823,
  @Description = @Description_2217c823,
  @Sequence = @Sequence_2217c823,
  @SQLBaseType = @SQLBaseType_2217c823,
  @SQLFullType = @SQLFullType_2217c823,
  @SourceEntityID = @SourceEntityID_2217c823,
  @SourceFieldName = @SourceFieldName_2217c823,
  @SourceFieldName_Clear = 1,
  @IsComputed = @IsComputed_2217c823,
  @ComputationDescription = @ComputationDescription_2217c823,
  @IsSummary = @IsSummary_2217c823,
  @SummaryDescription = @SummaryDescription_2217c823,
  @SummaryDescription_Clear = 1,
  @DetectionMethod = @DetectionMethod_2217c823,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_2217c823,
  @AutoDetectConfidenceScore_Clear = 1;

GO

-- Save MJ: Query Fields (core SP call only)
DECLARE @ID_21ed5b5e UNIQUEIDENTIFIER,
@QueryID_21ed5b5e UNIQUEIDENTIFIER,
@Name_21ed5b5e NVARCHAR(255),
@Description_21ed5b5e NVARCHAR(MAX),
@Sequence_21ed5b5e INT,
@SQLBaseType_21ed5b5e NVARCHAR(50),
@SQLFullType_21ed5b5e NVARCHAR(100),
@SourceEntityID_21ed5b5e UNIQUEIDENTIFIER,
@SourceFieldName_21ed5b5e NVARCHAR(255),
@IsComputed_21ed5b5e BIT,
@ComputationDescription_21ed5b5e NVARCHAR(MAX),
@IsSummary_21ed5b5e BIT,
@SummaryDescription_21ed5b5e NVARCHAR(MAX),
@DetectionMethod_21ed5b5e NVARCHAR(50),
@AutoDetectConfidenceScore_21ed5b5e DECIMAL(3, 2)
SET
  @ID_21ed5b5e = 'f0439af0-b7a8-4704-b26e-4bcd26c55956'
SET
  @QueryID_21ed5b5e = '5044A100-0020-4000-8000-000000000002'
SET
  @Name_21ed5b5e = N'MemberCount'
SET
  @Description_21ed5b5e = N'The number of members who transitioned from FromBand to ToBand.'
SET
  @Sequence_21ed5b5e = 5
SET
  @SQLBaseType_21ed5b5e = N'decimal'
SET
  @SQLFullType_21ed5b5e = N'decimal(18,2)'
SET
  @IsComputed_21ed5b5e = 1
SET
  @ComputationDescription_21ed5b5e = N'COUNT(*) aggregate of transitioned members.'
SET
  @IsSummary_21ed5b5e = 1
SET
  @DetectionMethod_21ed5b5e = N'Manual' IF NOT EXISTS (SELECT 1 FROM [__mj].[QueryField] WHERE ID = @ID_21ed5b5e)
EXEC [__mj].spCreateQueryField @ID = @ID_21ed5b5e,
  @QueryID = @QueryID_21ed5b5e,
  @Name = @Name_21ed5b5e,
  @Description = @Description_21ed5b5e,
  @Sequence = @Sequence_21ed5b5e,
  @SQLBaseType = @SQLBaseType_21ed5b5e,
  @SQLFullType = @SQLFullType_21ed5b5e,
  @SourceEntityID = @SourceEntityID_21ed5b5e,
  @SourceEntityID_Clear = 1,
  @SourceFieldName = @SourceFieldName_21ed5b5e,
  @SourceFieldName_Clear = 1,
  @IsComputed = @IsComputed_21ed5b5e,
  @ComputationDescription = @ComputationDescription_21ed5b5e,
  @IsSummary = @IsSummary_21ed5b5e,
  @SummaryDescription = @SummaryDescription_21ed5b5e,
  @SummaryDescription_Clear = 1,
  @DetectionMethod = @DetectionMethod_21ed5b5e,
  @AutoDetectConfidenceScore = @AutoDetectConfidenceScore_21ed5b5e,
  @AutoDetectConfidenceScore_Clear = 1;

GO

-- Save MJ: Queries (core SP call only)
DECLARE @Name_ed04dea1 NVARCHAR(255),
@CategoryID_ed04dea1 UNIQUEIDENTIFIER,
@UserQuestion_ed04dea1 NVARCHAR(MAX),
@Description_ed04dea1 NVARCHAR(MAX),
@SQL_ed04dea1 NVARCHAR(MAX),
@TechnicalDescription_ed04dea1 NVARCHAR(MAX),
@OriginalSQL_ed04dea1 NVARCHAR(MAX),
@Feedback_ed04dea1 NVARCHAR(MAX),
@Status_ed04dea1 NVARCHAR(15),
@QualityRank_ed04dea1 INT,
@ExecutionCostRank_ed04dea1 INT,
@UsesTemplate_ed04dea1 BIT,
@AuditQueryRuns_ed04dea1 BIT,
@CacheEnabled_ed04dea1 BIT,
@CacheTTLMinutes_ed04dea1 INT,
@CacheMaxSize_ed04dea1 INT,
@EmbeddingVector_ed04dea1 NVARCHAR(MAX),
@EmbeddingModelID_ed04dea1 UNIQUEIDENTIFIER,
@CacheValidationSQL_ed04dea1 NVARCHAR(MAX),
@SQLDialectID_ed04dea1 UNIQUEIDENTIFIER,
@Reusable_ed04dea1 BIT,
@ExternalDataSourceID_ed04dea1 UNIQUEIDENTIFIER,
@ID_ed04dea1 UNIQUEIDENTIFIER
SET
  @Name_ed04dea1 = N'Sonar: Band Flows'
SET
  @Description_ed04dea1 = N'Band-change cohorts between two snapshot days for a model: one row per (from band, to band) with the member count, biggest first. Members present at only one of the two days are skipped (not a band CHANGE). Powers the Overview migration ribbons and the ''who needs action'' cohort chips at any look-back window.'
SET
  @SQL_ed04dea1 = N'WITH snap AS (
    SELECT h.AnchorRecordID, h.BandID,
        CONVERT(date, COALESCE(h.AsOfDate, h.ComputedAt)) AS SnapshotDay,
        ROW_NUMBER() OVER (PARTITION BY h.AnchorRecordID, CONVERT(date, COALESCE(h.AsOfDate, h.ComputedAt)) ORDER BY h.AsOfDate DESC, h.ComputedAt DESC) AS rn
    FROM [${flyway:defaultSchema}].[ScoreHistory] h
    WHERE h.ScoreModelID = {{ ModelID | sqlString }}
      AND CONVERT(date, COALESCE(h.AsOfDate, h.ComputedAt)) IN ({{ FromDay | sqlString }}, {{ ToDay | sqlString }})
)
SELECT CONVERT(varchar(36), f.BandID) AS FromBandID,
       ISNULL(fb.Label, ''Unbanded'') AS FromBand,
       CONVERT(varchar(36), t.BandID) AS ToBandID,
       ISNULL(tb.Label, ''Unbanded'') AS ToBand,
       COUNT(*) AS MemberCount
FROM snap f
JOIN snap t ON t.AnchorRecordID = f.AnchorRecordID AND t.SnapshotDay = {{ ToDay | sqlString }} AND t.rn = 1
LEFT JOIN [${flyway:defaultSchema}].[ScoreBand] fb ON fb.ID = f.BandID
LEFT JOIN [${flyway:defaultSchema}].[ScoreBand] tb ON tb.ID = t.BandID
WHERE f.SnapshotDay = {{ FromDay | sqlString }} AND f.rn = 1
  AND ISNULL(CONVERT(varchar(36), f.BandID), '''') <> ISNULL(CONVERT(varchar(36), t.BandID), '''')
GROUP BY f.BandID, ISNULL(fb.Label, ''Unbanded''), t.BandID, ISNULL(tb.Label, ''Unbanded'')
ORDER BY COUNT(*) DESC'
SET
  @Status_ed04dea1 = N'Approved'
SET
  @QualityRank_ed04dea1 = 0
SET
  @UsesTemplate_ed04dea1 = 1
SET
  @AuditQueryRuns_ed04dea1 = 0
SET
  @CacheEnabled_ed04dea1 = 0
SET
  @EmbeddingVector_ed04dea1 = N'[-0.035168152302503586,0.057255085557699203,-0.03535761684179306,-0.0870850533246994,-0.018599221482872963,-0.03515934944152832,0.01971188373863697,-0.02948172576725483,-0.036064859479665756,0.06130122393369675,0.020216254517436028,-0.05750184506177902,-0.025721093639731407,0.09995430707931519,-0.003691047430038452,-0.006001697387546301,0.028358856216073036,-0.046645838767290115,-0.03955191373825073,-0.0038083207327872515,-0.04567950963973999,-0.03539252653717995,-0.009553148411214352,-0.02801625430583954,0.06146895885467529,-0.015806013718247414,-0.0709313452243805,0.050916992127895355,0.03714022412896156,-0.07783268392086029,0.02208700403571129,0.05821825936436653,-0.004252105485647917,0.02053455263376236,0.0000022510978396894643,-0.0108199967071414,-0.026441359892487526,-0.003958967048674822,-0.03788106516003609,0.0034750024788081646,0.019602365791797638,-0.013578495942056179,-0.019451841711997986,-0.020192457363009453,0.01221682783216238,0.08169449120759964,-0.06513894349336624,-0.06570569425821304,0.05045684054493904,0.0018431282369419932,0.005740662571042776,0.04441307857632637,-0.06481757014989853,-0.0033013292122632265,0.04073517024517059,-0.02509496547281742,0.011619355529546738,-0.02413441799581051,0.025068897753953934,-0.06311232596635818,0.007277501747012138,0.04511597752571106,0.014500021934509277,-0.08248715847730637,0.10871385782957077,0.01711863838136196,-0.020399028435349464,-0.03547268360853195,-0.00615588529035449,0.00808884296566248,0.11529547721147537,0.005465428810566664,0.00040173326851800084,-0.0058307466097176075,-0.01738670840859413,-0.030967844650149345,-0.0015059452271088958,-0.027642514556646347,0.028866328299045563,-0.014296476729214191,-0.07303096354007721,0.06497660279273987,-0.015772756189107895,0.010814680717885494,-0.05179964005947113,-0.019607214257121086,-0.0015499228611588478,-0.008966636843979359,-0.026550784707069397,-0.005948518868535757,0.07709290832281113,0.03496115282177925,0.005889606196433306,0.023015670478343964,-0.06856518238782883,-0.006327150855213404,0.04525763541460037,0.021527212113142014,0.003892440814524889,0.011285373009741306,0.04492839053273201,-0.01691320165991783,-0.024857744574546814,0.07111816853284836,0.016075415536761284,-0.052431870251894,0.007457233965396881,-0.007586151361465454,-0.027574708685278893,0.004221578128635883,0.013091685250401497,0.0068971202708780766,-0.009041204117238522,-0.010533981956541538,0.02096475474536419,-0.007363896816968918,-0.004595830570906401,0.006026037968695164,-0.017324674874544144,-0.005417478270828724,0.06523982435464859,0.0019066011300310493,-0.0287912767380476,0.04576828330755234,0.047356266528367996,0.027108680456876755,0.007170119788497686,-0.0043579894118011,0.029317565262317657,0.02795545943081379,-0.0392431803047657,-0.029979370534420013,0.007082834839820862,0.0029495402704924345,-0.041047945618629456,-0.01827501505613327,0.00867944024503231,0.0364694744348526,-0.022605065256357193,-0.02003007009625435,0.02880181558430195,-0.015531420707702637,-0.023009194061160088,0.015229441225528717,0.009690380655229092,-0.02471916936337948,0.003154436592012644,0.07442698627710342,0.008091947063803673,-0.005023130215704441,-0.028612803667783737,0.010991874150931835,-0.0309466402977705,0.04387161508202553,-0.03347514569759369,0.00795554555952549,0.04697081446647644,0.047038789838552475,0.008228731341660023,-0.01749008148908615,0.0008671386749483645,0.02015444077551365,-0.03659878298640251,0.00876569002866745,-0.02075369842350483,0.003597034839913249,-0.06430888921022415,-0.04495611414313316,-0.023785483092069626,-0.005310786422342062,0.039378803223371506,-0.057129886001348495,-0.01678045466542244,-0.02245980314910412,-0.013434775173664093,-0.037302166223526,0.08335726708173752,0.011458368971943855,-0.02626267448067665,-0.075564444065094,-0.04741629585623741,-0.11040541529655457,-0.017104782164096832,0.018894771113991737,0.006535120774060488,-0.033632487058639526,-0.02485089935362339,0.024632278829813004,-0.01638803631067276,0.05476885661482811,0.027584882453083992,0.020444544032216072,-0.06108390912413597,-0.016630657017230988,0.012714573182165623,-0.004316434264183044,0.04872305318713188,-0.025980019941926003,0.048998765647411346,-0.00357423210516572,-0.028178870677947998,0.014871195890009403,-0.006219116970896721,0.049235906451940536,0.02849237248301506,-0.03895289823412895,-0.03821360692381859,0.001375567982904613,0.08179377764463425,0.00043198250932618976,0.06700941175222397,0.026103639975190163,-0.0448492132127285,0.012664024718105793,0.014255553483963013,0.08293597400188446,-0.02109825238585472,0.014177508652210236,-0.045712508261203766,-0.018071956932544708,-0.04378205165266991,-0.00008899979729903862,-0.034917209297418594,0.0029149523470550776,0.027500437572598457,0.08530815690755844,0.008972592651844025,-0.027183249592781067,0.02435288392007351,-0.018515964969992638,-0.012116451747715473,-0.02797870524227619,0.03279461711645126,0.023671824485063553,0.06565355509519577,0.04815499112010002,-0.015628913417458534,-0.04424678161740303,-0.033476367592811584,0.07458961755037308,0.017854947596788406,-0.05472712963819504,-0.053791824728250504,0.02116180583834648,0.012799606658518314,0.013466349802911282,-0.14667674899101257,0.00880159717053175,0.02789807878434658,0.009356576018035412,0.0006023072637617588,0.02381892502307892,0.021616371348500252,0.016910357400774956,-0.017015263438224792,-0.020238757133483887,-0.005162127315998077,-0.025014083832502365,-0.05370069667696953,0.1017620861530304,0.03173157572746277,-0.017590360715985298,-0.042001381516456604,0.0017600393621250987,0.004601513035595417,-0.030241692438721657,0.02788371779024601,0.03818773850798607,0.004319891799241304,0.010046465322375298,0.03934837505221367,0.010160082951188087,-0.010131200775504112,-0.009914655238389969,0.02166030928492546,-0.0007577625219710171,-0.034106459468603134,0.01853199303150177,-0.00893513485789299,-0.038017164915800095,-0.01871776022017002,-0.019924169406294823,-0.006023481488227844,0.03335298225283623,-0.012250742875039577,0.030696652829647064,0.04574323073029518,-0.1263437569141388,-0.03761547803878784,-0.10374867171049118,-0.01183012779802084,-0.05347071960568428,-0.008092992939054966,-0.006565697491168976,-0.031157538294792175,-0.018917266279459,0.013513794168829918,0.0606553815305233,0.02597176656126976,0.09130436927080154,0.01542650256305933,-0.004888000898063183,-0.0016059133922681212,0.021368782967329025,-0.023847689852118492,0.049746185541152954,-0.019271505996584892,-0.022978398948907852,-0.0027046119794249535,0.037737563252449036,-0.021675242111086845,0.0010420046746730804,0.04275135323405266,-0.00213016290217638,0.004763604141771793,-0.01775015890598297,-0.005414419807493687,-0.020746462047100067,-0.03071744367480278,0.051955897361040115,-0.0025529740378260612,0.02141147293150425,-0.022565335035324097,0.08000791817903519,-0.02988201193511486,-0.010764503851532936,-0.06361962854862213,0.021421682089567184,-0.04792674258351326,-0.01511301752179861,0.046441610902547836,0.0247552078217268,-0.001996951876208186,-0.013449670746922493,-0.039344772696495056,-0.05537872388958931,-0.033001407980918884,-0.09014637768268585,-0.01726481504738331,0.017540981993079185,-0.002632684540003538,0.006480127107352018,-0.01593111827969551,0.04015112668275833,0.052911654114723206,0.05137479305267334,-0.05949580296874046,-0.0009286770946346223,-0.03405870869755745,0.0008208692888729274,-0.00829055905342102,-0.007584244478493929,-0.028451647609472275,-0.020669888705015182,-0.009798306971788406,0.026425937190651894,-0.03398669511079788,0.04695696756243706,0.003299988806247711,-0.07611390203237534,0.07288946956396103,-0.014476952143013477,0.10692945867776871,0.03270530700683594,0.0169890895485878,0.02913503162562847,-0.010037456639111042,-0.017671527341008186,0.024020615965127945,-0.03728434070944786,0.04737626761198044,0.030188461765646935,-0.027433887124061584,0.016762997955083847,0.01044644508510828,-0.10037722438573837,0.02700030244886875,-0.029963800683617592,0.0671108141541481,0.01374028529971838,-0.014551100321114063,0.04448872059583664,0.038357168436050415,0.013427558355033398,0.019436292350292206,-0.024980762973427773,-0.015299683436751366,-0.04165356233716011,0.01751692406833172,0.028176145628094673,0.034094877541065216,-0.02764279581606388,0.10048148036003113,-0.00780765013769269,-0.011454794555902481,0.0100153973326087,-0.08028645813465118,0.042186520993709564,0.0007445783703587949,-0.010656450875103474,0.014123535715043545,0.013318907469511032,0.04460914060473442,0.03929910063743591,0.021244097501039505,0.01342302467674017,-0.011405114084482193,0.0015012405347079039,-0.008380035869777203,-0.023794498294591904,0.04177543520927429,-0.05832992121577263,0.020387493073940277,0.008931626565754414,0.0180195365101099,0.0000037611860079778126,0.014281703159213066,-0.0014740385813638568,-0.00330290081910789,-0.011094309389591217,0.004700344055891037,0.030241023749113083,0.042699284851551056,0.01807546615600586,0.006382645107805729,-0.03385644406080246,0.04288361966609955,-0.02901598811149597,-0.0020880508236587048,0.0063103497959673405,-0.0077070388942956924,0.027787309139966965,0.00842645950615406,0.06701285392045975,-0.0861993059515953,-0.033293526619672775,0.003536737058311701,0.004988859407603741,-0.009143056347966194,0.009232920594513416,-0.010957845486700535,0.00888044387102127,0.11500141024589539,-0.05149656906723976,0.04668864235281944,-0.0055451830849051476,-0.030765408650040627,0.005847868975251913,0.007573072332888842,-0.06347528100013733,0.04770539328455925,-0.010641169734299183,-0.0690273642539978,-0.040495701134204865,0.06360699236392975,-0.04657917842268944,-0.000016514433809788898,-0.058259930461645126,-0.042616941034793854,0.0014402033993974328,-0.047891467809677124,0.04873953387141228,-0.026986978948116302,-0.03460625559091568,0.05345434322953224,0.00041811575647443533,0.0013451435370370746,0.0028132572770118713,0.005904754623770714,-0.03594980016350746,-0.016135821118950844,-0.04176391661167145,-0.011206447146832943,-0.009002053178846836,0.02132362686097622,0.007507548667490482,0.04856434464454651,0.01711675524711609,0.042731620371341705,-0.005511170718818903,-0.03417406231164932,-0.01807299070060253,0.038452088832855225,-0.06853124499320984,0.004609772935509682,0.0393974743783474,-0.0020923707634210587,0.01608411967754364,-0.01292870007455349,-0.010818934999406338,-0.0028630876913666725,-0.044427864253520966,-0.011701751500368118,0.020559923723340034,-0.006003460381180048,-0.03829379752278328,0.004468570929020643,0.009577958844602108,0.03970092162489891,0.02829616703093052,-0.019554030150175095,0.025328869000077248,0.01685408689081669,-0.03183777630329132,0.026189927011728287,0.018273578956723213,0.02441984973847866,0.005167121533304453,0.00955368485301733,0.0054819826036691666,-0.007593243382871151,-0.020067857578396797,-0.05548733100295067,-0.03245990723371506,0.021306727081537247,-0.03634224832057953,-0.05429127812385559,0.07218680530786514,0.0209320317953825,0.019803453236818314,0.001094531617127359,-0.00842232909053564,0.01464299950748682,-0.0009072624379768968,0.01538438443094492,-0.023675620555877686,0.032251860946416855,0.016668764874339104,0.05860336124897003,0.04992017149925232,0.050808608531951904,0.00680717034265399,-0.030942412093281746,0.034538693726062775,0.0021720901131629944,0.014283396303653717,0.04872417449951172,-0.037752725183963776,0.025604108348488808,-0.022110726684331894,-0.04512631148099899,0.04396278038620949,0.00671282596886158,-0.02970344014465809,0.018548304215073586,-0.03054380975663662,-0.000878085964359343,-0.017201866954565048,-0.00889206025749445,0.017069177702069283,0.03526792302727699,-0.046911027282476425,-0.037268903106451035,-0.011917047202587128,0.015889300033450127,-7.788458961247814e-33,-0.055699124932289124,-0.0026415581814944744,-0.011614958755671978,-0.09921141713857651,-0.06862102448940277,-0.04841464012861252,-0.028431247919797897,-0.060223184525966644,-0.025145577266812325,-0.02870824746787548,-0.008427930064499378,-0.0019410847453400493,0.01794455759227276,-0.015088343061506748,0.016596611589193344,0.04717574641108513,0.029591994360089302,0.0065000420436263084,-0.02015085518360138,0.07905565947294235,-0.022909896448254585,0.020039541646838188,-0.022632673382759094,0.053670067340135574,-0.056131865829229355,0.04333827644586563,-0.000534570834133774,0.037984319031238556,-0.05590606853365898,-0.05761994048953056,0.019917109981179237,-0.025952190160751343,-0.015284334309399128,0.04133594408631325,-0.006913446821272373,-0.0751992017030716,-0.007628364488482475,-0.014486298896372318,-0.033884447067976,-0.016957661136984825,0.0448247566819191,0.01604662835597992,0.007609700784087181,0.008154635317623615,-0.00533099751919508,-0.02586086094379425,0.016466950997710228,0.0035343256313353777,-0.04004562273621559,-0.02621598355472088,-0.037004243582487106,0.016955647617578506,-0.026286613196134567,0.03221408277750015,-0.026854772120714188,0.044014643877744675,-0.015214542858302593,0.030236855149269104,-0.04690473899245262,0.0308533962816,0.11510993540287018,0.02394280396401882,-0.01818561926484108,-0.001206676010042429,0.006542480085045099,0.002912393305450678,-0.008799262344837189,0.03988172113895416,0.06337001919746399,0.040854692459106445,-0.007232926320284605,0.04963446781039238,-0.03459739685058594,-0.08878673613071442,0.0351296104490757,-0.0019927877001464367,0.003170620882883668,-0.018753904849290848,-0.003121723188087344,0.021427178755402565,0.028028516098856926,0.030290234833955765,0.03594290837645531,0.053385622799396515,-0.010249810293316841,-0.06970883905887604,-0.0029745567589998245,-0.026691505685448647,0.015914006158709526,0.016468023881316185,-0.033598776906728745,-0.00493394723162055,-0.00874021090567112,0.03275427222251892,-0.035924848169088364,-0.006248485762625933,0.03024951182305813,0.019729116931557655,-0.007928570732474327,-0.0027358673978596926,0.003675785381346941,0.004930681549012661,0.0642717257142067,0.02211795747280121,0.008867641910910606,0.007035518065094948,0.07822103053331375,0.0028624949045479298,-0.0386175811290741,0.01143663376569748,0.01343371719121933,-0.00717733521014452,-0.020467864349484444,-0.030543264001607895,-0.00660896860063076,-0.018578533083200455,0.005454564467072487,-0.03579827398061752,-0.0034431046806275845,0.0025669001042842865,-0.016686376184225082,0.035038240253925323,-0.04591481015086174,0.060693297535181046,-0.02289189025759697,0.0031844419427216053,-0.01635824516415596,0.008411344140768051,-0.01990020088851452,0.02725815214216709,0.0025580748915672302,0.037028633058071136,3.155527110720868e-7,-0.02848268859088421,0.01116104330867529,-0.026363568380475044,-0.033329546451568604,0.03983846306800842,-0.0437285415828228,-0.04720398783683777,-0.00988412369042635,0.03455989807844162,-0.02551991492509842,0.006204292178153992,0.027702778577804565,0.012033806182444096,-0.010333766229450703,0.00565391406416893,0.0011968706967309117,0.07305699586868286,0.004085898865014315,-0.06333045661449432,-0.03473827987909317,0.03239424154162407,0.021994033828377724,0.014569483697414398,-0.003045141464099288,0.02628207579255104,0.0007220978150144219,-0.0016221866244450212,-0.01706981100142002,-0.025748595595359802,-0.0025227514561265707,0.031181875616312027,-0.08371172845363617,-0.047470033168792725,-0.02837930992245674,0.008630115538835526,0.04963663965463638,-0.03729011490941048,-0.08692768961191177,-0.03501085564494133,0.02889907732605934,-0.00908717792481184,0.050098858773708344,0.013549991883337498,0.025100747123360634,0.020138157531619072,-0.010816805064678192,-0.00911678746342659,-0.01322650071233511,-0.03825479373335838,-0.020217426121234894,0.015171428211033344,0.05236032232642174,-0.0313153937458992,0.00019404535123612732,0.023459644988179207,0.02066124975681305,-0.006111981347203255,-0.011986887082457542,0.039926473051309586,0.02180831879377365,0.01741299405694008,-0.038534268736839294,0.0018283601384609938,0.10796574503183365,0.01795654371380806,-0.03589273989200592,0.01442108117043972,3.6153192013203337e-34,0.04274861887097359,0.03859667107462883,0.019998867064714432,0.04797469452023506,0.037721212953329086,-0.01488164346665144,0.004923148546367884,-0.0062334900721907616,0.015500135719776154,-0.028451593592762947,-0.01937568001449108]'
SET
  @EmbeddingModelID_ed04dea1 = '1D45AA65-41EC-4572-9ECD-AB2826C9B059'
SET
  @SQLDialectID_ed04dea1 = '1F203987-A37B-4BC1-85B3-BA50DC33C3E0'
SET
  @Reusable_ed04dea1 = 0
SET
  @ID_ed04dea1 = '5044A100-0020-4000-8000-000000000002' EXEC [__mj].spUpdateQuery @Name = @Name_ed04dea1,
  @CategoryID = @CategoryID_ed04dea1,
  @CategoryID_Clear = 1,
  @UserQuestion = @UserQuestion_ed04dea1,
  @UserQuestion_Clear = 1,
  @Description = @Description_ed04dea1,
  @SQL = @SQL_ed04dea1,
  @TechnicalDescription = @TechnicalDescription_ed04dea1,
  @TechnicalDescription_Clear = 1,
  @OriginalSQL = @OriginalSQL_ed04dea1,
  @OriginalSQL_Clear = 1,
  @Feedback = @Feedback_ed04dea1,
  @Feedback_Clear = 1,
  @Status = @Status_ed04dea1,
  @QualityRank = @QualityRank_ed04dea1,
  @ExecutionCostRank = @ExecutionCostRank_ed04dea1,
  @ExecutionCostRank_Clear = 1,
  @UsesTemplate = @UsesTemplate_ed04dea1,
  @AuditQueryRuns = @AuditQueryRuns_ed04dea1,
  @CacheEnabled = @CacheEnabled_ed04dea1,
  @CacheTTLMinutes = @CacheTTLMinutes_ed04dea1,
  @CacheTTLMinutes_Clear = 1,
  @CacheMaxSize = @CacheMaxSize_ed04dea1,
  @CacheMaxSize_Clear = 1,
  @EmbeddingVector = @EmbeddingVector_ed04dea1,
  @EmbeddingModelID = @EmbeddingModelID_ed04dea1,
  @CacheValidationSQL = @CacheValidationSQL_ed04dea1,
  @CacheValidationSQL_Clear = 1,
  @SQLDialectID = @SQLDialectID_ed04dea1,
  @Reusable = @Reusable_ed04dea1,
  @ExternalDataSourceID = @ExternalDataSourceID_ed04dea1,
  @ExternalDataSourceID_Clear = 1,
  @ID = @ID_ed04dea1;

GO


-- End of SQL Logging Session
-- Session ID: 920786b4-fdfd-4763-84c0-592fe74d7238
-- Completed: 2026-07-14T23:35:07.061Z
-- Duration: 39041ms
-- Total Statements: 214
