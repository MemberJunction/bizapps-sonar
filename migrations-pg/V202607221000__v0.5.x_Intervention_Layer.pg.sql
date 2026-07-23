-- Action layer (plan §5.6): the closed loop that turns scores into outcomes. PostgreSQL twin of
-- migrations/V202607221000__v0.5.x_Intervention_Layer.sql — same four tables, PG dialect.
--   ScoreSegment           — a saved cohort over scored records (filter on band/score/delta/trend).
--   Intervention           — what to do for a segment: fire an MJ Action, with a holdout %.
--   InterventionAssignment — per-member treatment/control assignment (the holdout split).
--   InterventionOutcome    — the measured result per assignment (basis for lift).
--
-- NOTE: the PG baseline (B202607171700) is a post-CodeGen dump, so its tables carry the __mj_ audit
-- columns inline. This twin matches that shape (audit columns included) so the runtime's UpdatedAt
-- handling works without CodeGen DDL. Entity METADATA registration (__mj."Entity"/"EntityField")
-- comes from the post-install `mj codegen` step, same as SQL Server — not from this migration.

-- ============================================================ ScoreSegment
CREATE TABLE __mj_bizappssonar."ScoreSegment" (
    "ID" uuid DEFAULT gen_random_uuid() NOT NULL,
    "ScoreModelID" uuid NOT NULL,
    "Name" character varying(200) NOT NULL,
    "Description" text,
    "FilterExpression" text,
    "IsDynamic" boolean DEFAULT true NOT NULL,
    "MemberCountCached" integer,
    "LastEvaluatedAt" timestamp with time zone,
    "__mj_CreatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    "__mj_UpdatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    CONSTRAINT "PK_ScoreSegment" PRIMARY KEY ("ID"),
    CONSTRAINT "FK_ScoreSegment_ScoreModel" FOREIGN KEY ("ScoreModelID") REFERENCES __mj_bizappssonar."ScoreModel"("ID")
);

COMMENT ON TABLE __mj_bizappssonar."ScoreSegment" IS 'A saved cohort over a model''s scored records (e.g. "At-Risk in the renewal window") that interventions key off.';
COMMENT ON COLUMN __mj_bizappssonar."ScoreSegment"."Name" IS 'Display name of the segment.';
COMMENT ON COLUMN __mj_bizappssonar."ScoreSegment"."Description" IS 'Optional description of who the segment captures and why.';
COMMENT ON COLUMN __mj_bizappssonar."ScoreSegment"."FilterExpression" IS 'JSON filter over band/score/delta/trend/window + any anchor field — defines membership.';
COMMENT ON COLUMN __mj_bizappssonar."ScoreSegment"."IsDynamic" IS 'When true, membership is recomputed each run from the filter; when false, the cohort is a fixed snapshot.';
COMMENT ON COLUMN __mj_bizappssonar."ScoreSegment"."MemberCountCached" IS 'Cached count of members in the segment as of LastEvaluatedAt (display/perf only).';
COMMENT ON COLUMN __mj_bizappssonar."ScoreSegment"."LastEvaluatedAt" IS 'When the segment membership/count was last evaluated.';

-- ============================================================ Intervention
CREATE TABLE __mj_bizappssonar."Intervention" (
    "ID" uuid DEFAULT gen_random_uuid() NOT NULL,
    "ScoreSegmentID" uuid NOT NULL,
    "Name" character varying(200) NOT NULL,
    "Description" text,
    "TriggerType" character varying(20) DEFAULT 'Manual'::character varying NOT NULL,
    "ActionID" uuid NOT NULL,
    "ControlGroupPercent" numeric(5,2),
    "Status" character varying(16) DEFAULT 'Draft'::character varying NOT NULL,
    "__mj_CreatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    "__mj_UpdatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    CONSTRAINT "PK_Intervention" PRIMARY KEY ("ID"),
    CONSTRAINT "FK_Intervention_ScoreSegment" FOREIGN KEY ("ScoreSegmentID") REFERENCES __mj_bizappssonar."ScoreSegment"("ID"),
    CONSTRAINT "FK_Intervention_Action" FOREIGN KEY ("ActionID") REFERENCES __mj."Action"("ID"),
    CONSTRAINT "CK_Intervention_TriggerType" CHECK ((("TriggerType")::text = ANY ((ARRAY['OnEnterSegment'::character varying, 'Scheduled'::character varying, 'Manual'::character varying])::text[]))),
    CONSTRAINT "CK_Intervention_Status" CHECK ((("Status")::text = ANY ((ARRAY['Draft'::character varying, 'Active'::character varying, 'Paused'::character varying])::text[]))),
    CONSTRAINT "CK_Intervention_ControlGroupPercent" CHECK (("ControlGroupPercent" IS NULL) OR (("ControlGroupPercent" >= 0) AND ("ControlGroupPercent" <= 100)))
);

COMMENT ON TABLE __mj_bizappssonar."Intervention" IS 'What to do for a segment: fire an MJ Action against its members, with an automatic holdout for lift measurement.';
COMMENT ON COLUMN __mj_bizappssonar."Intervention"."Name" IS 'Display name of the intervention.';
COMMENT ON COLUMN __mj_bizappssonar."Intervention"."Description" IS 'Optional description of the play and its intent.';
COMMENT ON COLUMN __mj_bizappssonar."Intervention"."TriggerType" IS 'When the intervention fires: OnEnterSegment (member newly matches), Scheduled, or Manual.';
COMMENT ON COLUMN __mj_bizappssonar."Intervention"."ControlGroupPercent" IS 'Percent of matched members withheld as a control group (holdout) so treatment-vs-control lift can be measured; null = no holdout.';
COMMENT ON COLUMN __mj_bizappssonar."Intervention"."Status" IS 'Lifecycle state: Draft (not firing), Active (firing per its trigger), or Paused.';

-- ============================================================ InterventionAssignment
CREATE TABLE __mj_bizappssonar."InterventionAssignment" (
    "ID" uuid DEFAULT gen_random_uuid() NOT NULL,
    "InterventionID" uuid NOT NULL,
    "AnchorRecordID" character varying(100) NOT NULL,
    "AnchorRecordKeyJSON" text,
    "Cohort" character varying(10) NOT NULL,
    "AssignedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    "ActionDeliveryStatus" character varying(20),
    "__mj_CreatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    "__mj_UpdatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    CONSTRAINT "PK_InterventionAssignment" PRIMARY KEY ("ID"),
    CONSTRAINT "FK_InterventionAssignment_Intervention" FOREIGN KEY ("InterventionID") REFERENCES __mj_bizappssonar."Intervention"("ID"),
    CONSTRAINT "CK_InterventionAssignment_Cohort" CHECK ((("Cohort")::text = ANY ((ARRAY['Treatment'::character varying, 'Control'::character varying])::text[])))
);

COMMENT ON TABLE __mj_bizappssonar."InterventionAssignment" IS 'One member''s enrollment in an intervention, split into treatment vs. control (the holdout) for lift measurement.';
COMMENT ON COLUMN __mj_bizappssonar."InterventionAssignment"."AnchorRecordID" IS 'Canonical id of the assigned anchor record (matches Score.AnchorRecordID).';
COMMENT ON COLUMN __mj_bizappssonar."InterventionAssignment"."AnchorRecordKeyJSON" IS 'Optional JSON of a composite anchor key (matches Score.AnchorRecordKeyJSON) for multi-column-PK anchors.';
COMMENT ON COLUMN __mj_bizappssonar."InterventionAssignment"."Cohort" IS 'Whether this member is in the Treatment cohort (the Action fires) or the Control cohort (held out).';
COMMENT ON COLUMN __mj_bizappssonar."InterventionAssignment"."AssignedAt" IS 'When the member was assigned to this intervention.';
COMMENT ON COLUMN __mj_bizappssonar."InterventionAssignment"."ActionDeliveryStatus" IS 'Delivery state of the fired Action for a Treatment member (e.g. Pending, Delivered, Failed, Skipped); null for Control.';

-- ============================================================ InterventionOutcome
CREATE TABLE __mj_bizappssonar."InterventionOutcome" (
    "ID" uuid DEFAULT gen_random_uuid() NOT NULL,
    "AssignmentID" uuid NOT NULL,
    "OutcomeType" character varying(16) NOT NULL,
    "OutcomeAt" timestamp with time zone,
    "ScoreDeltaAfter" numeric(9,4),
    "MeasuredAt" timestamp with time zone,
    "__mj_CreatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    "__mj_UpdatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    CONSTRAINT "PK_InterventionOutcome" PRIMARY KEY ("ID"),
    CONSTRAINT "FK_InterventionOutcome_Assignment" FOREIGN KEY ("AssignmentID") REFERENCES __mj_bizappssonar."InterventionAssignment"("ID"),
    CONSTRAINT "CK_InterventionOutcome_OutcomeType" CHECK ((("OutcomeType")::text = ANY ((ARRAY['Renewed'::character varying, 'Reactivated'::character varying, 'Churned'::character varying, 'Upgraded'::character varying, 'NoChange'::character varying])::text[])))
);

COMMENT ON TABLE __mj_bizappssonar."InterventionOutcome" IS 'The measured result for one intervention assignment (business outcome + score change) — the basis for treatment-vs-control lift.';
COMMENT ON COLUMN __mj_bizappssonar."InterventionOutcome"."OutcomeType" IS 'The business outcome observed: Renewed, Reactivated, Churned, Upgraded, or NoChange.';
COMMENT ON COLUMN __mj_bizappssonar."InterventionOutcome"."OutcomeAt" IS 'When the business outcome occurred.';
COMMENT ON COLUMN __mj_bizappssonar."InterventionOutcome"."ScoreDeltaAfter" IS 'Change in the member''s normalized score from assignment to measurement (engagement movement after the play).';
COMMENT ON COLUMN __mj_bizappssonar."InterventionOutcome"."MeasuredAt" IS 'When the outcome was measured/recorded.';
