-- Intervention proposals — PostgreSQL twin of
-- migrations/V202607281000__v0.5.x_Intervention_Proposals.sql. Same table, PG dialect.
--
-- NOTE: the PG baseline (B202607171700) is a post-CodeGen dump, so its tables carry the __mj_ audit
-- columns inline. This twin matches that shape (audit columns included) so the runtime's UpdatedAt
-- handling works without CodeGen DDL. Entity METADATA registration (__mj."Entity"/"EntityField")
-- comes from the post-install `mj codegen` step, same as SQL Server — not from this migration.

-- ============================================================ InterventionProposal
CREATE TABLE __mj_bizappssonar."InterventionProposal" (
    "ID" uuid DEFAULT gen_random_uuid() NOT NULL,
    "InterventionID" uuid NOT NULL,
    "AnchorRecordID" character varying(450) NOT NULL, -- matches Score.AnchorRecordID (widened for composite anchor keys)
    "AnchorName" character varying(300),
    "ProposalType" character varying(30) DEFAULT 'EmailDraft'::character varying NOT NULL,
    "Rationale" character varying(1000),
    "PayloadJSON" text,
    "GroundingJSON" text,
    "Status" character varying(16) DEFAULT 'Proposed'::character varying NOT NULL,
    "ReviewedAt" timestamp with time zone,
    "ExecutedAt" timestamp with time zone,
    "__mj_CreatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    "__mj_UpdatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    CONSTRAINT "PK_InterventionProposal" PRIMARY KEY ("ID"),
    CONSTRAINT "FK_InterventionProposal_Intervention" FOREIGN KEY ("InterventionID") REFERENCES __mj_bizappssonar."Intervention"("ID"),
    CONSTRAINT "CK_InterventionProposal_Status" CHECK ((("Status")::text = ANY ((ARRAY['Proposed'::character varying, 'Approved'::character varying, 'Rejected'::character varying, 'Executed'::character varying])::text[]))),
    CONSTRAINT "UQ_InterventionProposal_Member" UNIQUE ("InterventionID", "AnchorRecordID")
);

COMMENT ON TABLE __mj_bizappssonar."InterventionProposal" IS 'A concrete per-member action a play prepared for human review (e.g. a drafted outreach email) — proposal type + payload are data, so new play types need no schema change.';
COMMENT ON COLUMN __mj_bizappssonar."InterventionProposal"."AnchorRecordID" IS 'Canonical id of the anchor record this proposal is for (matches Score.AnchorRecordID).';
COMMENT ON COLUMN __mj_bizappssonar."InterventionProposal"."AnchorName" IS 'Display name of the member at draft time (denormalized so the review queue never re-resolves anchors).';
COMMENT ON COLUMN __mj_bizappssonar."InterventionProposal"."ProposalType" IS 'What kind of action is proposed (e.g. EmailDraft). Determines how PayloadJSON is shaped and rendered; an open set — new plays add new types.';
COMMENT ON COLUMN __mj_bizappssonar."InterventionProposal"."Rationale" IS 'One-line human-readable reason this member got this proposal (shown on the review queue card).';
COMMENT ON COLUMN __mj_bizappssonar."InterventionProposal"."PayloadJSON" IS 'The proposal content, shaped per ProposalType (EmailDraft: {subject, body, recipientEmail}).';
COMMENT ON COLUMN __mj_bizappssonar."InterventionProposal"."GroundingJSON" IS 'The score facts the proposal was grounded in ({score, bandName, delta, dominantCause, factors[]}) — the audit trail for "why this member".';
COMMENT ON COLUMN __mj_bizappssonar."InterventionProposal"."Status" IS 'Review lifecycle: Proposed (awaiting review), Approved, Rejected, or Executed (carried out — for the PoC, a simulated send).';
COMMENT ON COLUMN __mj_bizappssonar."InterventionProposal"."ReviewedAt" IS 'When a human approved or rejected the proposal.';
COMMENT ON COLUMN __mj_bizappssonar."InterventionProposal"."ExecutedAt" IS 'When the approved proposal was executed (PoC: the simulated send).';
