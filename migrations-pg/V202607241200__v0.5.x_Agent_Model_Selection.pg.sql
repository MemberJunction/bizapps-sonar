-- =============================================================================
-- V202607241200__v0.5.x_Agent_Model_Selection.pg.sql  (PostgreSQL)
-- Fix the silent model downgrade on the Sonar Authoring Agent prompt: it shipped
-- with SelectionStrategy='Specific' but no AIPromptModel links, so MJ's runner
-- fell back to a weakest-model selection (Llama 3.1 8b / Groq) and never honored
-- PowerPreference='Highest'. Switch to 'Default' + a MinPowerRank floor so the
-- strongest keyed model at/above the floor is chosen and a weak model can never
-- be selected (MinPowerRank is enforced on 'Default' but not on 'ByPower').
--
-- ALSO scopes the prompt to LLMs. PowerRank is stamped on every model in the registry, not just chat
-- models, and the candidate pool is type-filtered only when AIModelTypeID is set. With it NULL,
-- sorting by PowerRank descending put Rerankers on top (rerank-v4-pro 110, rerank-v3.5 100) above
-- every LLM (strongest ~30), and a reranker can't answer a prompt at all — so the fix would have
-- traded a silent downgrade for a silent wrong-model-class pick. The floor can't fix that; it trims
-- from the bottom. E8A5CCEC-... is MJ core's 'LLM' AIModelType (fixed seed id, same on every install).
--
-- Forward migration (seed frozen); idempotent (guarded on the target values).
-- SQL Server twin: migrations/V202607241200__v0.5.x_Agent_Model_Selection.sql
-- =============================================================================
UPDATE __mj."AIPrompt"
SET "SelectionStrategy" = 'Default',
    "MinPowerRank"      = 15,
    "AIModelTypeID"     = 'e8a5ccec-6a37-ef11-86d4-000d3a4e707e'
WHERE "ID" = '3a70c8ff-b823-4491-8b3d-3bc258c82aeb'
  AND ("SelectionStrategy" <> 'Default'
       OR "MinPowerRank" <> 15
       OR "AIModelTypeID" IS NULL
       OR "AIModelTypeID" <> 'e8a5ccec-6a37-ef11-86d4-000d3a4e707e');
