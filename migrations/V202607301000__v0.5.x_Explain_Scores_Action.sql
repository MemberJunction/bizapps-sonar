-- =============================================================================
-- V202607301000__v0.5.x_Explain_Scores_Action.sql
-- =============================================================================
-- Seed "Sonar: Explain Scores" — for a set of Score rows, WHY each one is low.
--
-- Why this is a server action rather than a client-side calculation: ranking a member's signals by
-- how much each drags the score down depends on the factor's CONFIGURED rubric weight (the scorer
-- writes PercentOfTotal = 0 for a signal the member has no data on, which is exactly when it is
-- hurting them most), and that same ranking is what a targeting rule SELECTS on. A copy of the maths
-- in the browser is a second definition of "the reason" that can drift from the engine's — which is
-- how the Triage list, the Movers list and the outreach drafter came to disagree about the same
-- member. The reason is now computed once, server-side, and shipped as data.
--
-- `Sonar: Preview Segment` already returns the reason for a rule-resolved cohort; this covers the
-- surfaces that list members WITHOUT a rule (the Triage list), which have no cohort to preview.
--
-- Read-only: writes nothing. Category 'Business Apps' (a tool, not a play), so the launch picker does
-- not offer it. Type='Custom' → inherently trusted at the fire-time governance gate.
-- Idempotent; safe to re-run.
-- PG twin: migrations-pg/V202607301000__v0.5.x_Explain_Scores_Action.pg.sql
-- =============================================================================

IF NOT EXISTS (SELECT 1 FROM [__mj].[Action] WHERE ID = '5044A100-0027-4000-8000-000000000027')
BEGIN
    INSERT INTO [__mj].[Action] (ID, CategoryID, Name, Description, Type, CodeApprovalStatus, CodeLocked, ForceCodeGeneration, Status, DriverClass, IconClass)
    VALUES (
        '5044A100-0027-4000-8000-000000000027',
        (SELECT TOP 1 ID FROM [__mj].[ActionCategory] WHERE Name = 'Business Apps'),
        N'Sonar: Explain Scores',
        N'For a set of Score rows, returns WHY each member is low: the signal dragging them down most, as a short label ("Low Event Registrations" / "No Event Registrations"), plus the factor behind it and whether that signal had any data at all. Ranked on the rubric weight, not the realized percentage, so a MISSING signal can be named as the reason. Read-only. Backs the Why column on member lists that are not resolved from a targeting rule; use Sonar: Preview Segment when there IS a rule, which returns the same labels with the cohort.',
        N'Custom', N'Pending', 0, 0, N'Active', N'SonarExplainScores', N'fa-solid fa-circle-question'
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-0027-4000-8000-0000000000A1')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0027-4000-8000-0000000000A1', '5044A100-0027-4000-8000-000000000027', N'ScoreIDsJSON', N'Input', N'Scalar', 0, 1, N'JSON array of Score.ID values to explain (maximum 500 per call). Non-GUID entries and duplicates are ignored; an empty array succeeds with an empty result rather than failing.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-0027-4000-8000-0000000000A2')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0027-4000-8000-0000000000A2', '5044A100-0027-4000-8000-000000000027', N'Result', N'Both', N'Scalar', 0, 0, N'JSON: { reasons: [{ scoreId, reasonLabel, dominantFactorId, hadData }] }. reasonLabel is null when nothing is dragging the member down (they are doing fine on every signal) or when no contributions are on record. hadData false = that signal has NO records for the member, so the low score is a data gap to fix rather than a person to contact.');
GO

IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = '5044A100-0027-4000-8000-0000000000C1')
    INSERT INTO [__mj].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-0027-4000-8000-0000000000C1', '5044A100-0027-4000-8000-000000000027', N'SUCCESS', 1, N'Reasons resolved (including the empty-input case).');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = '5044A100-0027-4000-8000-0000000000C2')
    INSERT INTO [__mj].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-0027-4000-8000-0000000000C2', '5044A100-0027-4000-8000-000000000027', N'VALIDATION_ERROR', 0, N'ScoreIDsJSON missing, not a JSON array, or over the 500-id limit.');
GO
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionResultCode] WHERE ID = '5044A100-0027-4000-8000-0000000000C3')
    INSERT INTO [__mj].[ActionResultCode] (ID, ActionID, ResultCode, IsSuccess, Description)
    VALUES ('5044A100-0027-4000-8000-0000000000C3', '5044A100-0027-4000-8000-000000000027', N'ERROR', 0, N'A query error while reading contributions, factors, or rubric weights.');
GO
