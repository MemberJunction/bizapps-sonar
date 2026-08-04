-- =============================================================================
-- V202608021200__v0.5.x_Agent_MissingDataPolicy.pg.sql
-- =============================================================================
-- PostgreSQL parity for migrations/V202608021200__v0.5.x_Agent_MissingDataPolicy.sql.
--
-- Teaches the authoring agent about ModelFactor.MissingDataPolicy: extends the Create Factor `Spec`
-- contract with the new key and adds a MissingDataPolicy input param to Bind Signal To Model. Without
-- it, every agent-authored signal silently lands on the schema default, which the engine resolves to
-- Zero — the harshest of the three options.
--
-- Action + param IDs are seed-hardcoded (not CodeGen-minted), so they match SQL Server exactly and can
-- be referenced by id. Idempotent: the UPDATE is guarded on the phrase, the INSERT on the id.
-- =============================================================================

-- 1. Create Factor: add missingDataPolicy to the Spec contract the agent reads.
UPDATE __mj."ActionParam"
SET "Description" = 'JSON CreateFactorSpec: name, sourceRelatedEntityID, aggregation, aggregateFieldName, filterExpression, timeWindowID, normalizationMethod, normalizationParamsJSON, higherIsBetter, weight, weightMode, missingDataPolicy. missingDataPolicy is Zero|NeutralMidpoint|Exclude and decides what an anchor with NO data for this factor scores on it: Zero counts as zero and still weighs against them, NeutralMidpoint fills the factor''s own midpoint so it neither helps nor hurts, Exclude drops it from that anchor''s total. Omit it only when you have no view; the default behaves as Zero, which on a sparse source scores every anchor with no rows as the worst possible.'
WHERE "ID" = '5044a100-0008-4000-8000-0000000000a2'
  AND "Description" NOT LIKE '%missingDataPolicy%';

-- 2. Bind Signal To Model: a new optional input for the same choice.
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-001a-4000-8000-0000000000a6'::uuid,
       '5044a100-001a-4000-8000-00000000001a'::uuid,
       'MissingDataPolicy',
       'Input',
       'Scalar',
       false,
       false,
       'Zero|NeutralMidpoint|Exclude — what an anchor with NO data for this signal scores on it. Zero counts as zero and still weighs against them; NeutralMidpoint fills the midpoint so it neither helps nor hurts; Exclude drops it from that anchor''s total. Omit to leave the default, which behaves as Zero.'
WHERE NOT EXISTS (
    SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-001a-4000-8000-0000000000a6'
);
