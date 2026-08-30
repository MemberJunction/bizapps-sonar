-- =============================================================================
-- V202607211200__v0.3.x_Agent_Iteration_Limits.sql
-- =============================================================================
-- Raise the Sonar Authoring Agent's per-run limits 12/18 -> 36/64.
-- Real, MoreCheese-scale authoring (many entities, multi-factor models) legitimately
-- needs more Loop iterations than 12; runs were aborting at the cap mid-authoring
-- (verified in AIAgentRun logs). Forward migration — the seed (V202607142340) is FROZEN,
-- so we UPDATE the created agent here rather than editing the seed. Idempotent.
-- PG twin: migrations-pg/V202607211200__v0.3.x_Agent_Iteration_Limits.pg.sql
-- =============================================================================

UPDATE [__mj].[AIAgent]
SET MaxIterationsPerRun = 36, MaxExecutionsPerRun = 64
WHERE ID = 'CF1D58BA-451E-4515-89BD-AC3F16A19534';

GO
