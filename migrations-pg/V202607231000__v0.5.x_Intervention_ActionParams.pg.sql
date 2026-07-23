-- PostgreSQL twin of migrations/V202607231000__v0.5.x_Intervention_ActionParams.sql:
-- interventions carry their play's static params so autonomous fires can run parameterized plays.

ALTER TABLE __mj_bizappssonar."Intervention" ADD COLUMN "ActionParamsJSON" text;

COMMENT ON COLUMN __mj_bizappssonar."Intervention"."ActionParamsJSON" IS 'JSON [{name,value}] params handed to the intervention''s Action on every fire; a {{member}} token in a value is replaced with the member''s anchor id. Null = fire with no params.';
