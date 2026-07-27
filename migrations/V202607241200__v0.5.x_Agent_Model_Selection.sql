-- =============================================================================
-- V202607241200__v0.5.x_Agent_Model_Selection.sql
-- =============================================================================
-- Fix the silent model downgrade on the Sonar Authoring Agent prompt.
--
-- SYMPTOM: In deployed environments the agent ran on Llama 3.1 8b (Groq) instead
-- of a capable model, even though the prompt declared PowerPreference='Highest'.
--
-- ROOT CAUSE: The prompt shipped with SelectionStrategy='Specific' but ZERO
-- AIPromptModel links and RequireSpecificModels=0. In MJ's AIPromptRunner that
-- combination builds an EMPTY "specific" candidate set, then (RequireSpecificModels
-- false) computes a fallback TARGET power rank from the configured models -- which
-- is 0 for an empty list -- and sorts every active model by proximity to 0. That
-- biases selection to the WEAKEST keyed model, landing on Llama 3.1 8b / Groq.
-- PowerPreference is never consulted on the 'Specific' path, so 'Highest' was
-- dead config.
--
-- FIX: Switch to SelectionStrategy='Default' with a MinPowerRank floor. The
-- 'Default' branch filters out models below the floor, then sorts by PowerRank
-- DESCENDING -> it selects the strongest keyed model at/above the floor and can
-- NEVER slide to a weak model (if nothing at/above the floor has a usable key it
-- errors loudly instead of downgrading). NOTE: MinPowerRank is honored on
-- 'Default' but NOT on 'ByPower', which is why we use 'Default' here, not
-- 'ByPower'+'Highest'. Floor of 15 keeps roughly Gemini-2.5-Pro class and above;
-- adjust if a deployment's keyed models sit lower. The floor is only half the fix --
-- see the AIModelTypeID note above the UPDATE for why scoping to LLMs is required.
--
-- WHY A FORWARD MIGRATION (not a seed edit): the seed V202607142340 shipped in
-- v0.2.0 and is FROZEN -- editing it changes its Flyway checksum and breaks
-- upgrades. This forward migration reaches fresh installs AND upgraders, and runs
-- after the seed that created the AIPrompt row. Idempotent: guarded on the target
-- values so a re-run (or a prior manual hotfix) is a no-op.
-- PG twin: migrations-pg/V202607241200__v0.5.x_Agent_Model_Selection.pg.sql
-- =============================================================================

-- ALSO SCOPE TO LLMs: MinPowerRank alone can't do this job. PowerRank is stamped on EVERY model in
-- the registry, not just chat models, and the pool is only type-filtered when the prompt sets
-- AIModelTypeID (see AIPromptRunner.getModelPoolForStrategy: `!prompt.AIModelTypeID || ...`). This
-- prompt left it NULL, so "sort by PowerRank descending" put Rerankers at the top — rerank-v4-pro
-- (110), rerank-v3.5 (100), rerank-v4-fast (90) all outrank every LLM, where the strongest sits near
-- 30 and Gemini 3.1 Pro at 26. A reranker only reorders search results; it cannot answer a prompt at
-- all. So without this, the fix would trade a silent downgrade for a silent wrong-MODEL-CLASS pick.
-- The floor can't help: it trims from the bottom, and the problem is at the top.
-- E8A5CCEC-... is MJ core's 'LLM' AIModelType (a fixed seed id, identical across installs).
UPDATE [__mj].[AIPrompt]
SET SelectionStrategy = N'Default',
    MinPowerRank      = 15,
    AIModelTypeID     = 'E8A5CCEC-6A37-EF11-86D4-000D3A4E707E'
WHERE ID = '3A70C8FF-B823-4491-8B3D-3BC258C82AEB'
  AND (SelectionStrategy <> N'Default'
       OR MinPowerRank <> 15
       OR AIModelTypeID IS NULL
       OR AIModelTypeID <> 'E8A5CCEC-6A37-EF11-86D4-000D3A4E707E');

GO
