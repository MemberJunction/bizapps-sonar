-- =============================================================================
-- V202607211300__v0.3.x_Agent_Prompt_Column_Hint.pg.sql  (PostgreSQL)
-- Add the "pick columns from List Related Entities" hint to the agent prompt's
-- TemplateContent. Forward migration (seed frozen); idempotent (guarded on the phrase).
-- SQL Server twin: migrations/V202607211300__v0.3.x_Agent_Prompt_Column_Hint.sql
-- =============================================================================
UPDATE __mj."TemplateContent"
SET "TemplateText" = REPLACE("TemplateText",
    'aggregateFieldName (a numeric/date column on the source).',
    'aggregateFieldName (a numeric/date column on the source). Take the EXACT column name from the columns Sonar: List Related Entities returns for that source; never invent one.')
WHERE "ID" = '094e9b12-2f3e-46ec-a9e6-d4d026f96298'
  AND "TemplateText" NOT LIKE '%Take the EXACT column name from the columns Sonar: List Related Entities returns%';
