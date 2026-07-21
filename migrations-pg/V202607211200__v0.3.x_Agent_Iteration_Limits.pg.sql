-- =============================================================================
-- V202607211200__v0.3.x_Agent_Iteration_Limits.pg.sql  (PostgreSQL)
-- Raise the Sonar Authoring Agent's per-run limits 12/18 -> 36/64. Forward migration
-- (seed is frozen); idempotent. SQL Server twin: migrations/V202607211200__….sql
-- =============================================================================
UPDATE __mj."AIAgent"
SET "MaxIterationsPerRun" = 36, "MaxExecutionsPerRun" = 64
WHERE "ID" = 'cf1d58ba-451e-4515-89bd-ac3f16a19534';
