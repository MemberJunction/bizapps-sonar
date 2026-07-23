-- =============================================================================
-- V202607211300__v0.3.x_Agent_Prompt_Column_Hint.sql
-- =============================================================================
-- Add a one-line hint to the Sonar Authoring Agent's system prompt: pick the aggregate/
-- date field from the columns that Sonar: List Related Entities now returns, never invent
-- one. Forward migration (the seed is FROZEN) that patches the seeded TemplateContent via a
-- targeted REPLACE. Idempotent — guarded on the added phrase so a re-run is a no-op.
-- PG twin: migrations-pg/V202607211300__v0.3.x_Agent_Prompt_Column_Hint.pg.sql
-- =============================================================================

UPDATE [__mj].[TemplateContent]
SET TemplateText = REPLACE(TemplateText,
    'aggregateFieldName (a numeric/date column on the source).',
    'aggregateFieldName (a numeric/date column on the source). Take the EXACT column name from the columns Sonar: List Related Entities returns for that source; never invent one.')
WHERE ID = '094E9B12-2F3E-46EC-A9E6-D4D026F96298'
  AND TemplateText NOT LIKE '%Take the EXACT column name from the columns Sonar: List Related Entities returns%';

GO
