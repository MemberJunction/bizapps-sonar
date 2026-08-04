-- PostgreSQL twin of migrations/V202608021400__v0.5.x_Preview_Segment_OrderBy.sql: add the OrderBy
-- input to "Sonar: Preview Segment" so the Score Movers view can read biggest-mover-first without
-- changing the evaluator's worst-score-first order (which is a real run's cap policy).

INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
SELECT '5044a100-0025-4000-8000-0000000000a6', '5044a100-0025-4000-8000-000000000025', 'OrderBy', 'Input', 'Scalar', false, false, 'Display order for the returned page: ''BiggestDrop'' or ''BiggestGain'' sort by last-run delta; omitted (or anything else) keeps the engine''s worst-score-first order. Affects the response only, never which members a run would treat.'
WHERE NOT EXISTS (SELECT 1 FROM __mj."ActionParam" WHERE "ID" = '5044a100-0025-4000-8000-0000000000a6');
