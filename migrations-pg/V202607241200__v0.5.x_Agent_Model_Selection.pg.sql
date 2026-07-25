-- =============================================================================
-- V202607241200__v0.5.x_Agent_Model_Selection.pg.sql  (PostgreSQL)
-- Fix the silent model downgrade on the Sonar Authoring Agent prompt: it shipped
-- with SelectionStrategy='Specific' but no AIPromptModel links, so MJ's runner
-- fell back to a weakest-model selection (Llama 3.1 8b / Groq) and never honored
-- PowerPreference='Highest'. Switch to 'Default' + a MinPowerRank floor so the
-- strongest keyed model at/above the floor is chosen and a weak model can never
-- be selected (MinPowerRank is enforced on 'Default' but not on 'ByPower').
-- Forward migration (seed frozen); idempotent (guarded on the target values).
-- SQL Server twin: migrations/V202607241200__v0.5.x_Agent_Model_Selection.sql
-- =============================================================================
UPDATE __mj."AIPrompt"
SET "SelectionStrategy" = 'Default',
    "MinPowerRank"      = 15
WHERE "ID" = '3a70c8ff-b823-4491-8b3d-3bc258c82aeb'
  AND ("SelectionStrategy" <> 'Default' OR "MinPowerRank" <> 15);
