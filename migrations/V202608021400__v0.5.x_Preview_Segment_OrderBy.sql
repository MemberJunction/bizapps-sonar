-- Add the OrderBy input to "Sonar: Preview Segment".
--
-- Why: the evaluator returns a cohort worst-score-first, which is also the CAP policy for a real
-- run (when a run is capped at N, those are the N that get treated). The Score Movers view wants
-- biggest-mover-first instead, and a display preference must not change who a run would pick — so
-- the sort is applied to the preview response only, and has to be asked for explicitly.
-- PG twin: migrations-pg/V202608021400__v0.5.x_Preview_Segment_OrderBy.pg.sql

IF NOT EXISTS (SELECT 1 FROM [__mj].[ActionParam] WHERE ID = '5044A100-0025-4000-8000-0000000000A6')
    INSERT INTO [__mj].[ActionParam] (ID, ActionID, Name, Type, ValueType, IsArray, IsRequired, Description)
    VALUES ('5044A100-0025-4000-8000-0000000000A6', '5044A100-0025-4000-8000-000000000025', N'OrderBy', N'Input', N'Scalar', 0, 0, N'Display order for the returned page: ''BiggestDrop'' or ''BiggestGain'' sort by last-run delta; omitted (or anything else) keeps the engine''s worst-score-first order. Affects the response only, never which members a run would treat.');
GO
