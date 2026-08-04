-- Intervention proposals (plan §5.6 / intervention-layer.md Play 3): the durable per-member
-- artifact a play produces for human review — the "Sonar did the work, you approve it" object.
--
-- Proposal-shaped, not email-shaped: ProposalType + PayloadJSON keep the payload as data, so an
-- email draft is merely the FIRST proposal type. A later play (call recommendation, event invite,
-- agent-executed fix) adds a new type + payload shape with zero schema change. The review loop is
-- generic: Proposed → Approved/Rejected → Executed.

-- ============================================================ InterventionProposal
CREATE TABLE ${flyway:defaultSchema}.InterventionProposal (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    InterventionID UNIQUEIDENTIFIER NOT NULL,
    AnchorRecordID NVARCHAR(450) NOT NULL, -- matches Score.AnchorRecordID (V202606241205 widened for composite anchor keys)
    AnchorName NVARCHAR(300) NULL,
    ProposalType NVARCHAR(30) NOT NULL DEFAULT 'EmailDraft',
    Rationale NVARCHAR(1000) NULL,
    PayloadJSON NVARCHAR(MAX) NULL,
    GroundingJSON NVARCHAR(MAX) NULL,
    Status NVARCHAR(16) NOT NULL DEFAULT 'Proposed',
    ReviewedAt DATETIME2 NULL,
    ExecutedAt DATETIME2 NULL,
    CONSTRAINT PK_InterventionProposal PRIMARY KEY (ID),
    CONSTRAINT FK_InterventionProposal_Intervention FOREIGN KEY (InterventionID) REFERENCES ${flyway:defaultSchema}.Intervention(ID),
    CONSTRAINT CK_InterventionProposal_Status CHECK (Status IN ('Proposed', 'Approved', 'Rejected', 'Executed')),
    CONSTRAINT UQ_InterventionProposal_Member UNIQUE (InterventionID, AnchorRecordID)
);
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'A concrete per-member action a play prepared for human review (e.g. a drafted outreach email) — proposal type + payload are data, so new play types need no schema change.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'InterventionProposal';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Canonical id of the anchor record this proposal is for (matches Score.AnchorRecordID).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'InterventionProposal', @level2type = N'COLUMN', @level2name = N'AnchorRecordID';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Display name of the member at draft time (denormalized so the review queue never re-resolves anchors).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'InterventionProposal', @level2type = N'COLUMN', @level2name = N'AnchorName';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'What kind of action is proposed (e.g. EmailDraft). Determines how PayloadJSON is shaped and rendered; an open set — new plays add new types.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'InterventionProposal', @level2type = N'COLUMN', @level2name = N'ProposalType';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'One-line human-readable reason this member got this proposal (shown on the review queue card).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'InterventionProposal', @level2type = N'COLUMN', @level2name = N'Rationale';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'The proposal content, shaped per ProposalType (EmailDraft: {subject, body, recipientEmail}).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'InterventionProposal', @level2type = N'COLUMN', @level2name = N'PayloadJSON';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'The score facts the proposal was grounded in ({score, bandName, delta, dominantCause, factors[]}) — the audit trail for "why this member".',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'InterventionProposal', @level2type = N'COLUMN', @level2name = N'GroundingJSON';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Review lifecycle: Proposed (awaiting review), Approved, Rejected, or Executed (carried out — for the PoC, a simulated send).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'InterventionProposal', @level2type = N'COLUMN', @level2name = N'Status';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'When a human approved or rejected the proposal.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'InterventionProposal', @level2type = N'COLUMN', @level2name = N'ReviewedAt';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'When the approved proposal was executed (PoC: the simulated send).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'InterventionProposal', @level2type = N'COLUMN', @level2name = N'ExecutedAt';
GO
