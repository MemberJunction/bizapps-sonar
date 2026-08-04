-- PostgreSQL twin of migrations/V202608011600__v0.5.x_Intervention_Kind.sql: execution Kind +
-- nullable ActionID, and retire the no-op "Add to Worklist" play.

ALTER TABLE __mj_bizappssonar."Intervention" ADD COLUMN "Kind" varchar(20) NOT NULL DEFAULT 'Action';
ALTER TABLE __mj_bizappssonar."Intervention" ADD CONSTRAINT "CK_Intervention_Kind" CHECK ("Kind" IN ('Action', 'TrackOnly', 'BulkSync'));
ALTER TABLE __mj_bizappssonar."Intervention" ALTER COLUMN "ActionID" DROP NOT NULL;

COMMENT ON COLUMN __mj_bizappssonar."Intervention"."Kind" IS 'Execution kind: Action (fires a play — the MJ Action in ActionID — per treated member), TrackOnly (no action; Sonar only splits treatment/control and measures a real-world treatment), or BulkSync (reserved). ActionID is required only for Action.';

-- Neutralize interventions that used the no-op worklist play, then DISABLE it (not delete — it may
-- carry ActionExecutionLog history; the class + metadata are gone, the disabled row is inert).
UPDATE __mj_bizappssonar."Intervention" SET "ActionID" = NULL, "Kind" = 'TrackOnly'
    WHERE "ActionID" = '5044a100-001d-4000-8000-00000000001d';

UPDATE __mj."Action" SET "Status" = 'Disabled' WHERE "ID" = '5044a100-001d-4000-8000-00000000001d';
