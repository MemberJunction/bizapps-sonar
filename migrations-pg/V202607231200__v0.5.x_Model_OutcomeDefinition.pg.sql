-- PostgreSQL twin of migrations/V202607231200__v0.5.x_Model_OutcomeDefinition.sql: a model defines
-- what "success" means for its interventions (org-agnostic outcome), NULL = default band recovery.

ALTER TABLE __mj_bizappssonar."ScoreModel" ADD COLUMN "OutcomeDefinitionJSON" text;

COMMENT ON COLUMN __mj_bizappssonar."ScoreModel"."OutcomeDefinitionJSON" IS 'Declarative rule defining what "success" means when measuring an intervention''s lift on this model''s members (BandRecovery | ReachScore | AnchorField). NULL = default band recovery. Keeps outcomes org-defined, not hardcoded.';
