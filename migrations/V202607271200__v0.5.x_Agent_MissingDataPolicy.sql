-- =============================================================================
-- V202607271200__v0.5.x_Agent_MissingDataPolicy.sql
-- =============================================================================
-- Teach the authoring agent about a factor's missing-data policy.
--
-- ModelFactor.MissingDataPolicy decides what an anchor with NO data for a factor scores on it, and
-- the UI now exposes it. The agent path couldn't: `Sonar: Create Factor` never mentioned the key in
-- its Spec contract and `Sonar: Bind Signal To Model` had no param for it, so every agent-authored
-- signal silently landed on the schema default (which the engine resolves to Zero — the harshest of
-- the three options, and wrong whenever a gap merely means "not measured yet").
--
-- Two changes, both idempotent:
--   1. Extend the Create Factor `Spec` param description with the new key (that description IS the
--      contract the agent reads).
--   2. Add a `MissingDataPolicy` input param to Bind Signal To Model.
--
-- Forward migration because the v0.2.0 seed is FROZEN; metadata/actions/.sonar-actions.json carries
-- the same change as the editable dev source. See migrations/README.md.
-- PG twin: migrations-pg/V202607271200__v0.5.x_Agent_MissingDataPolicy.pg.sql
-- =============================================================================

-- 1. Create Factor: add missingDataPolicy to the Spec contract the agent reads.
UPDATE [__mj].[ActionParam]
SET Description = N'JSON CreateFactorSpec: name, sourceRelatedEntityID, aggregation, aggregateFieldName, filterExpression, timeWindowID, normalizationMethod, normalizationParamsJSON, higherIsBetter, weight, weightMode, missingDataPolicy. missingDataPolicy is Zero|NeutralMidpoint|Exclude and decides what an anchor with NO data for this factor scores on it: Zero counts as zero and still weighs against them, NeutralMidpoint fills the factor''s own midpoint so it neither helps nor hurts, Exclude drops it from that anchor''s total. Omit it only when you have no view; the default behaves as Zero, which on a sparse source scores every anchor with no rows as the worst possible.'
WHERE ID = '5044A100-0008-4000-8000-0000000000A2'
  AND Description NOT LIKE '%missingDataPolicy%';
GO

-- 2. Bind Signal To Model: a new optional input for the same choice.
IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-001A-4000-8000-0000000000A6')
    EXEC [__mj].spCreateActionParam
        @ID = '5044A100-001A-4000-8000-0000000000A6',
        @ActionID = '5044A100-001A-4000-8000-00000000001A',
        @Name = N'MissingDataPolicy',
        @DefaultValue = NULL,
        @DefaultValue_Clear = 1,
        @Type = N'Input',
        @ValueType = N'Scalar',
        @IsArray = 0,
        @Description = N'Zero|NeutralMidpoint|Exclude — what an anchor with NO data for this signal scores on it. Zero counts as zero and still weighs against them; NeutralMidpoint fills the midpoint so it neither helps nor hurts; Exclude drops it from that anchor''s total. Omit to leave the default, which behaves as Zero.',
        @IsRequired = 0,
        @MediaModality = NULL,
        @MediaModality_Clear = 1;
GO
