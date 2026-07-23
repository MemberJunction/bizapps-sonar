-- Action layer (plan §5.6): the closed loop that turns scores into outcomes.
--   ScoreSegment           — a saved cohort over scored records (filter on band/score/delta/trend).
--   Intervention           — what to do for a segment: fire an MJ Action, with a holdout %.
--   InterventionAssignment — per-member treatment/control assignment (the holdout split).
--   InterventionOutcome    — the measured result per assignment (basis for lift).
--
-- This phase wires the thin slice (segment → intervention → fire → record assignment); the
-- measurement table (InterventionOutcome) is created here but engine-wired in a later checkpoint
-- (outcome loop + lift math). Write-back (§5.5 WriteBackTarget/Policy/Log) is a separate phase.
-- Salvaged from the parked sonar_app_nav branch (V202606241210), renumbered for the v0.4.0+ line.

-- ============================================================ ScoreSegment
CREATE TABLE ${flyway:defaultSchema}.ScoreSegment (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    ScoreModelID UNIQUEIDENTIFIER NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    FilterExpression NVARCHAR(MAX) NULL,
    IsDynamic BIT NOT NULL DEFAULT 1,
    MemberCountCached INT NULL,
    LastEvaluatedAt DATETIME2 NULL,
    CONSTRAINT PK_ScoreSegment PRIMARY KEY (ID),
    CONSTRAINT FK_ScoreSegment_ScoreModel FOREIGN KEY (ScoreModelID) REFERENCES ${flyway:defaultSchema}.ScoreModel(ID)
);
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'A saved cohort over a model''s scored records (e.g. "At-Risk in the renewal window") that interventions key off.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreSegment';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Display name of the segment.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreSegment', @level2type = N'COLUMN', @level2name = N'Name';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Optional description of who the segment captures and why.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreSegment', @level2type = N'COLUMN', @level2name = N'Description';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'JSON filter (Kendo-compatible) over band/score/delta/trend/window + any anchor field — defines membership.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreSegment', @level2type = N'COLUMN', @level2name = N'FilterExpression';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'When 1, membership is recomputed each run from the filter; when 0, the cohort is a fixed snapshot.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreSegment', @level2type = N'COLUMN', @level2name = N'IsDynamic';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Cached count of members in the segment as of LastEvaluatedAt (display/perf only).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreSegment', @level2type = N'COLUMN', @level2name = N'MemberCountCached';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'When the segment membership/count was last evaluated.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreSegment', @level2type = N'COLUMN', @level2name = N'LastEvaluatedAt';
GO

-- ============================================================ Intervention
CREATE TABLE ${flyway:defaultSchema}.Intervention (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    ScoreSegmentID UNIQUEIDENTIFIER NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    TriggerType NVARCHAR(20) NOT NULL DEFAULT 'Manual',
    ActionID UNIQUEIDENTIFIER NOT NULL,
    ControlGroupPercent DECIMAL(5,2) NULL,
    Status NVARCHAR(16) NOT NULL DEFAULT 'Draft',
    CONSTRAINT PK_Intervention PRIMARY KEY (ID),
    CONSTRAINT FK_Intervention_ScoreSegment FOREIGN KEY (ScoreSegmentID) REFERENCES ${flyway:defaultSchema}.ScoreSegment(ID),
    CONSTRAINT FK_Intervention_Action FOREIGN KEY (ActionID) REFERENCES __mj.Action(ID),
    CONSTRAINT CK_Intervention_TriggerType CHECK (TriggerType IN ('OnEnterSegment', 'Scheduled', 'Manual')),
    CONSTRAINT CK_Intervention_Status CHECK (Status IN ('Draft', 'Active', 'Paused')),
    CONSTRAINT CK_Intervention_ControlGroupPercent CHECK (ControlGroupPercent IS NULL OR (ControlGroupPercent >= 0 AND ControlGroupPercent <= 100))
);
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'What to do for a segment: fire an MJ Action against its members, with an automatic holdout for lift measurement.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Intervention';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Display name of the intervention.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Intervention', @level2type = N'COLUMN', @level2name = N'Name';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Optional description of the play and its intent.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Intervention', @level2type = N'COLUMN', @level2name = N'Description';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'When the intervention fires: OnEnterSegment (member newly matches), Scheduled, or Manual.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Intervention', @level2type = N'COLUMN', @level2name = N'TriggerType';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Percent of matched members withheld as a control group (holdout) so treatment-vs-control lift can be measured; null = no holdout.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Intervention', @level2type = N'COLUMN', @level2name = N'ControlGroupPercent';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Lifecycle state: Draft (not firing), Active (firing per its trigger), or Paused.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Intervention', @level2type = N'COLUMN', @level2name = N'Status';
GO

-- ============================================================ InterventionAssignment
CREATE TABLE ${flyway:defaultSchema}.InterventionAssignment (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    InterventionID UNIQUEIDENTIFIER NOT NULL,
    AnchorRecordID NVARCHAR(100) NOT NULL,
    AnchorRecordKeyJSON NVARCHAR(MAX) NULL,
    Cohort NVARCHAR(10) NOT NULL,
    AssignedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ActionDeliveryStatus NVARCHAR(20) NULL,
    CONSTRAINT PK_InterventionAssignment PRIMARY KEY (ID),
    CONSTRAINT FK_InterventionAssignment_Intervention FOREIGN KEY (InterventionID) REFERENCES ${flyway:defaultSchema}.Intervention(ID),
    CONSTRAINT CK_InterventionAssignment_Cohort CHECK (Cohort IN ('Treatment', 'Control'))
);
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'One member''s enrollment in an intervention, split into treatment vs. control (the holdout) for lift measurement.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'InterventionAssignment';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Canonical id of the assigned anchor record (matches Score.AnchorRecordID).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'InterventionAssignment', @level2type = N'COLUMN', @level2name = N'AnchorRecordID';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Optional JSON of a composite anchor key (matches Score.AnchorRecordKeyJSON) for multi-column-PK anchors.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'InterventionAssignment', @level2type = N'COLUMN', @level2name = N'AnchorRecordKeyJSON';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Whether this member is in the Treatment cohort (the Action fires) or the Control cohort (held out).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'InterventionAssignment', @level2type = N'COLUMN', @level2name = N'Cohort';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'When the member was assigned to this intervention.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'InterventionAssignment', @level2type = N'COLUMN', @level2name = N'AssignedAt';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Delivery state of the fired Action for a Treatment member (e.g. Pending, Delivered, Failed, Skipped); null for Control.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'InterventionAssignment', @level2type = N'COLUMN', @level2name = N'ActionDeliveryStatus';
GO

-- ============================================================ InterventionOutcome
CREATE TABLE ${flyway:defaultSchema}.InterventionOutcome (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    AssignmentID UNIQUEIDENTIFIER NOT NULL,
    OutcomeType NVARCHAR(16) NOT NULL,
    OutcomeAt DATETIME2 NULL,
    ScoreDeltaAfter DECIMAL(9,4) NULL,
    MeasuredAt DATETIME2 NULL,
    CONSTRAINT PK_InterventionOutcome PRIMARY KEY (ID),
    CONSTRAINT FK_InterventionOutcome_Assignment FOREIGN KEY (AssignmentID) REFERENCES ${flyway:defaultSchema}.InterventionAssignment(ID),
    CONSTRAINT CK_InterventionOutcome_OutcomeType CHECK (OutcomeType IN ('Renewed', 'Reactivated', 'Churned', 'Upgraded', 'NoChange'))
);
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'The measured result for one intervention assignment (business outcome + score change) — the basis for treatment-vs-control lift.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'InterventionOutcome';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'The business outcome observed: Renewed, Reactivated, Churned, Upgraded, or NoChange.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'InterventionOutcome', @level2type = N'COLUMN', @level2name = N'OutcomeType';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'When the business outcome occurred.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'InterventionOutcome', @level2type = N'COLUMN', @level2name = N'OutcomeAt';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Change in the member''s normalized score from assignment to measurement (engagement movement after the play).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'InterventionOutcome', @level2type = N'COLUMN', @level2name = N'ScoreDeltaAfter';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'When the outcome was measured/recorded.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'InterventionOutcome', @level2type = N'COLUMN', @level2name = N'MeasuredAt';
GO
