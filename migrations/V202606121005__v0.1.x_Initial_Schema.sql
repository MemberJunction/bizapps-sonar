-- =============================================================================
-- Sonar — Initial __mj_BizAppsSonar Schema (v0.1.x)
-- =============================================================================
-- Configurable engagement-scoring engine on the MemberJunction entity graph.
-- This migration creates the Phase-1 core of the __mj_BizAppsSonar data model, covering
-- four of the eight groups described in plans/plan.md §5:
--
--   §5.1 Configuration  : ScoreModel, ScoreModelVersion, ModelRelatedEntity,
--                         ScoreBandSet, ScoreBand
--   §5.2 Factors/windows: Factor, TimeWindow, ModelFactor
--   §5.3 Runtime output : Score, ScoreFactorContribution, ScoreHistory,
--                         ScoreBandTransition
--   §5.4 Recompute/audit: ScoreRecomputeRun, ScoreModelAuditEvent
--
-- Deferred to follow-up migrations (still additive, pre-publish): §5.5 write-back,
-- §5.6 action layer, §5.7 calibration network, §5.8 templates.
--
-- Conventions (MJ migrations/CLAUDE.md + bizapps-sonar/migrations/README.md):
--   - ${flyway:defaultSchema} is used for all Sonar tables (resolves to __mj_BizAppsSonar);
--     never hardcode __mj_BizAppsSonar.
--   - Foreign keys into MJ core hardcode the __mj schema (e.g. __mj.Entity,
--     __mj.[User], __mj.Action) — [User] is bracketed (reserved word).
--   - UUID PKs: ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() with named
--     PK_ constraints. Named FK_/UQ_/CK_ constraints throughout.
--   - NO __mj_CreatedAt / __mj_UpdatedAt columns and NO foreign-key indexes —
--     CodeGen adds both automatically.
--   - sp_addextendedproperty descriptions on every non-PK/non-FK column drive
--     CodeGen field descriptions, form labels, and docs.
--   - ON DELETE left at default (NO ACTION) to avoid SQL Server multiple-cascade
--     paths; MJ handles cascade semantics at the application layer.
-- =============================================================================

-- =============================================================================
-- SECTION 1 — SCHEMA (create the app schema if it does not already exist)
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = '${flyway:defaultSchema}')
    EXEC('CREATE SCHEMA ${flyway:defaultSchema}');
GO

-- =============================================================================
-- SECTION 2 — TABLES (dependency order)
-- =============================================================================

---------------------------------------------------------------------------
-- ScoreBandSet — a reusable, named set of qualitative score bands (§5.1)
---------------------------------------------------------------------------
CREATE TABLE ${flyway:defaultSchema}.ScoreBandSet (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    Name NVARCHAR(200) NOT NULL,
    AnchorEntityID UNIQUEIDENTIFIER NULL,
    Description NVARCHAR(MAX) NULL,
    CONSTRAINT PK_ScoreBandSet PRIMARY KEY (ID),
    CONSTRAINT FK_ScoreBandSet_AnchorEntity FOREIGN KEY (AnchorEntityID) REFERENCES __mj.Entity(ID)
);
GO

---------------------------------------------------------------------------
-- ScoreBand — one qualitative band within a set (§5.1)
---------------------------------------------------------------------------
CREATE TABLE ${flyway:defaultSchema}.ScoreBand (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    BandSetID UNIQUEIDENTIFIER NOT NULL,
    Label NVARCHAR(60) NOT NULL,
    MinScore DECIMAL(9,4) NOT NULL,
    MaxScore DECIMAL(9,4) NOT NULL,
    Severity INT NOT NULL DEFAULT 0,
    ColorHex NVARCHAR(7) NULL,
    IsTerminal BIT NOT NULL DEFAULT 0,
    Description NVARCHAR(MAX) NULL,
    CONSTRAINT PK_ScoreBand PRIMARY KEY (ID),
    CONSTRAINT FK_ScoreBand_BandSet FOREIGN KEY (BandSetID) REFERENCES ${flyway:defaultSchema}.ScoreBandSet(ID)
);
GO

---------------------------------------------------------------------------
-- TimeWindow — reusable, first-class time windows for factor evaluation (§5.2)
---------------------------------------------------------------------------
CREATE TABLE ${flyway:defaultSchema}.TimeWindow (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    Name NVARCHAR(120) NOT NULL,
    WindowType NVARCHAR(20) NOT NULL,
    LengthDays INT NULL,
    LengthMonths INT NULL,
    AnchorDateField NVARCHAR(200) NULL,
    OffsetDays INT NULL,
    Description NVARCHAR(MAX) NULL,
    CONSTRAINT PK_TimeWindow PRIMARY KEY (ID),
    CONSTRAINT CK_TimeWindow_WindowType CHECK (WindowType IN ('Rolling', 'Calendar', 'SinceEvent', 'RenewalRelative', 'AllTime'))
);
GO

---------------------------------------------------------------------------
-- ScoreModel — the editable definition of one scoring model (§5.1)
-- CurrentVersionID FK is added after ScoreModelVersion exists (circular ref).
---------------------------------------------------------------------------
CREATE TABLE ${flyway:defaultSchema}.ScoreModel (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    Name NVARCHAR(200) NOT NULL,
    Slug NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    AnchorEntityID UNIQUEIDENTIFIER NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Draft',
    CurrentVersionID UNIQUEIDENTIFIER NULL,
    ScoreScaleMin DECIMAL(9,4) NOT NULL DEFAULT 0,
    ScoreScaleMax DECIMAL(9,4) NOT NULL DEFAULT 100,
    CombineStrategy NVARCHAR(30) NOT NULL DEFAULT 'WeightedSum',
    CombineExpression NVARCHAR(MAX) NULL,
    BandSetID UNIQUEIDENTIFIER NULL,
    PopulationFilter NVARCHAR(MAX) NULL,
    RecomputeMode NVARCHAR(20) NOT NULL DEFAULT 'Scheduled',
    RecomputeCron NVARCHAR(100) NULL,
    AsOfStrategy NVARCHAR(20) NOT NULL DEFAULT 'RunTime',
    IsCalibrated BIT NOT NULL DEFAULT 0,
    TrendWindowDays INT NULL,
    OwnerUserID UNIQUEIDENTIFIER NULL,
    EffectiveFrom DATETIME2 NULL,
    EffectiveTo DATETIME2 NULL,
    Notes NVARCHAR(MAX) NULL,
    CONSTRAINT PK_ScoreModel PRIMARY KEY (ID),
    CONSTRAINT UQ_ScoreModel_Slug UNIQUE (Slug),
    CONSTRAINT FK_ScoreModel_AnchorEntity FOREIGN KEY (AnchorEntityID) REFERENCES __mj.Entity(ID),
    CONSTRAINT FK_ScoreModel_BandSet FOREIGN KEY (BandSetID) REFERENCES ${flyway:defaultSchema}.ScoreBandSet(ID),
    CONSTRAINT FK_ScoreModel_OwnerUser FOREIGN KEY (OwnerUserID) REFERENCES __mj.[User](ID),
    CONSTRAINT CK_ScoreModel_Status CHECK (Status IN ('Draft', 'Active', 'Paused', 'Archived')),
    CONSTRAINT CK_ScoreModel_CombineStrategy CHECK (CombineStrategy IN ('WeightedSum', 'WeightedAvg', 'Banded', 'ZScoreComposite', 'ExpressionDriven')),
    CONSTRAINT CK_ScoreModel_RecomputeMode CHECK (RecomputeMode IN ('Scheduled', 'EventDriven', 'OnDemand', 'Hybrid')),
    CONSTRAINT CK_ScoreModel_AsOfStrategy CHECK (AsOfStrategy IN ('RunTime', 'EndOfPreviousDay', 'Fixed'))
);
GO

---------------------------------------------------------------------------
-- ScoreModelVersion — immutable published snapshot of a model's config (§5.1)
---------------------------------------------------------------------------
CREATE TABLE ${flyway:defaultSchema}.ScoreModelVersion (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    ScoreModelID UNIQUEIDENTIFIER NOT NULL,
    VersionNumber INT NOT NULL,
    VersionLabel NVARCHAR(50) NULL,
    ConfigSnapshotJSON NVARCHAR(MAX) NOT NULL,
    ChangeSummary NVARCHAR(MAX) NULL,
    PublishedByUserID UNIQUEIDENTIFIER NULL,
    PublishedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsCurrent BIT NOT NULL DEFAULT 0,
    CONSTRAINT PK_ScoreModelVersion PRIMARY KEY (ID),
    CONSTRAINT UQ_ScoreModelVersion_ModelVersion UNIQUE (ScoreModelID, VersionNumber),
    CONSTRAINT FK_ScoreModelVersion_ScoreModel FOREIGN KEY (ScoreModelID) REFERENCES ${flyway:defaultSchema}.ScoreModel(ID),
    CONSTRAINT FK_ScoreModelVersion_PublishedByUser FOREIGN KEY (PublishedByUserID) REFERENCES __mj.[User](ID)
);
GO

-- Circular reference: ScoreModel.CurrentVersionID -> ScoreModelVersion.ID,
-- added now that ScoreModelVersion exists.
ALTER TABLE ${flyway:defaultSchema}.ScoreModel
    ADD CONSTRAINT FK_ScoreModel_CurrentVersion FOREIGN KEY (CurrentVersionID) REFERENCES ${flyway:defaultSchema}.ScoreModelVersion(ID);
GO

---------------------------------------------------------------------------
-- ModelRelatedEntity — an MJ entity wired into a model + traversal path (§5.1)
---------------------------------------------------------------------------
CREATE TABLE ${flyway:defaultSchema}.ModelRelatedEntity (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    ScoreModelID UNIQUEIDENTIFIER NOT NULL,
    RelatedEntityID UNIQUEIDENTIFIER NOT NULL,
    Alias NVARCHAR(100) NOT NULL,
    RelationshipPath NVARCHAR(MAX) NOT NULL,
    JoinType NVARCHAR(10) NOT NULL DEFAULT 'Left',
    SourceSystemTag NVARCHAR(60) NULL,
    Description NVARCHAR(MAX) NULL,
    CONSTRAINT PK_ModelRelatedEntity PRIMARY KEY (ID),
    CONSTRAINT UQ_ModelRelatedEntity_ModelAlias UNIQUE (ScoreModelID, Alias),
    CONSTRAINT FK_ModelRelatedEntity_ScoreModel FOREIGN KEY (ScoreModelID) REFERENCES ${flyway:defaultSchema}.ScoreModel(ID),
    CONSTRAINT FK_ModelRelatedEntity_RelatedEntity FOREIGN KEY (RelatedEntityID) REFERENCES __mj.Entity(ID),
    CONSTRAINT CK_ModelRelatedEntity_JoinType CHECK (JoinType IN ('Inner', 'Left'))
);
GO

---------------------------------------------------------------------------
-- Factor — a reusable signal definition; one contract, multiple kinds (§5.2)
---------------------------------------------------------------------------
CREATE TABLE ${flyway:defaultSchema}.Factor (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    Name NVARCHAR(200) NOT NULL,
    Slug NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    ScoreModelID UNIQUEIDENTIFIER NULL,
    AnchorEntityID UNIQUEIDENTIFIER NOT NULL,
    FactorType NVARCHAR(20) NOT NULL,
    SourceRelatedEntityID UNIQUEIDENTIFIER NULL,
    SourceEntityID UNIQUEIDENTIFIER NULL,
    FilterExpression NVARCHAR(MAX) NULL,
    Aggregation NVARCHAR(20) NULL,
    AggregateFieldName NVARCHAR(200) NULL,
    TimeWindowID UNIQUEIDENTIFIER NULL,
    RecencyDecayHalfLifeDays INT NULL,
    ActionID UNIQUEIDENTIFIER NULL,
    ActionParamsJSON NVARCHAR(MAX) NULL,
    ExecutionMode NVARCHAR(12) NULL,
    IsExpensive BIT NOT NULL DEFAULT 0,
    MaxConcurrency INT NULL,
    RateLimitPerMinute INT NULL,
    CacheTTLSeconds INT NULL,
    SourceScoreModelID UNIQUEIDENTIFIER NULL,
    RawDataType NVARCHAR(12) NULL,
    NormalizationMethod NVARCHAR(20) NULL,
    NormalizationParamsJSON NVARCHAR(MAX) NULL,
    OutputMin DECIMAL(9,4) NULL,
    OutputMax DECIMAL(9,4) NULL,
    HigherIsBetter BIT NOT NULL DEFAULT 1,
    PromotionState NVARCHAR(20) NULL,
    LastValidatedAt DATETIME2 NULL,
    CreatedByAgent NVARCHAR(60) NULL,
    CONSTRAINT PK_Factor PRIMARY KEY (ID),
    CONSTRAINT FK_Factor_ScoreModel FOREIGN KEY (ScoreModelID) REFERENCES ${flyway:defaultSchema}.ScoreModel(ID),
    CONSTRAINT FK_Factor_AnchorEntity FOREIGN KEY (AnchorEntityID) REFERENCES __mj.Entity(ID),
    CONSTRAINT FK_Factor_SourceRelatedEntity FOREIGN KEY (SourceRelatedEntityID) REFERENCES ${flyway:defaultSchema}.ModelRelatedEntity(ID),
    CONSTRAINT FK_Factor_SourceEntity FOREIGN KEY (SourceEntityID) REFERENCES __mj.Entity(ID),
    CONSTRAINT FK_Factor_TimeWindow FOREIGN KEY (TimeWindowID) REFERENCES ${flyway:defaultSchema}.TimeWindow(ID),
    CONSTRAINT FK_Factor_Action FOREIGN KEY (ActionID) REFERENCES __mj.Action(ID),
    CONSTRAINT FK_Factor_SourceScoreModel FOREIGN KEY (SourceScoreModelID) REFERENCES ${flyway:defaultSchema}.ScoreModel(ID),
    CONSTRAINT CK_Factor_FactorType CHECK (FactorType IN ('Declarative', 'ActionBacked', 'DerivedFromScore', 'Constant')),
    CONSTRAINT CK_Factor_Aggregation CHECK (Aggregation IN ('Count', 'Sum', 'Avg', 'Min', 'Max', 'DistinctCount', 'Recency', 'RatePerPeriod', 'Exists', 'TrendSlope')),
    CONSTRAINT CK_Factor_ExecutionMode CHECK (ExecutionMode IN ('PerRecord', 'Batch')),
    CONSTRAINT CK_Factor_RawDataType CHECK (RawDataType IN ('Number', 'Date', 'Boolean', 'Duration')),
    CONSTRAINT CK_Factor_NormalizationMethod CHECK (NormalizationMethod IN ('None', 'MinMax', 'Percentile', 'ZScore', 'Logistic', 'Banded', 'Lookup')),
    CONSTRAINT CK_Factor_PromotionState CHECK (PromotionState IN ('Draft', 'InReview', 'Approved', 'Deprecated'))
);
GO

---------------------------------------------------------------------------
-- ModelFactor — binds a Factor into a model with weight + rules (rubric) (§5.2)
---------------------------------------------------------------------------
CREATE TABLE ${flyway:defaultSchema}.ModelFactor (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    ScoreModelID UNIQUEIDENTIFIER NOT NULL,
    FactorID UNIQUEIDENTIFIER NOT NULL,
    Weight DECIMAL(9,4) NOT NULL DEFAULT 1,
    WeightMode NVARCHAR(12) NOT NULL DEFAULT 'Additive',
    ContributionCap DECIMAL(9,4) NULL,
    ContributionFloor DECIMAL(9,4) NULL,
    TrendWeight DECIMAL(9,4) NULL,
    MissingDataPolicy NVARCHAR(16) NOT NULL DEFAULT 'ModelDefault',
    IsRequired BIT NOT NULL DEFAULT 0,
    DisplayLabel NVARCHAR(200) NULL,
    DisplayOrder INT NULL,
    CONSTRAINT PK_ModelFactor PRIMARY KEY (ID),
    CONSTRAINT UQ_ModelFactor_ModelFactor UNIQUE (ScoreModelID, FactorID),
    CONSTRAINT FK_ModelFactor_ScoreModel FOREIGN KEY (ScoreModelID) REFERENCES ${flyway:defaultSchema}.ScoreModel(ID),
    CONSTRAINT FK_ModelFactor_Factor FOREIGN KEY (FactorID) REFERENCES ${flyway:defaultSchema}.Factor(ID),
    CONSTRAINT CK_ModelFactor_WeightMode CHECK (WeightMode IN ('Additive', 'Multiplier', 'Gate', 'Penalty', 'Bonus')),
    CONSTRAINT CK_ModelFactor_MissingDataPolicy CHECK (MissingDataPolicy IN ('Zero', 'NeutralMidpoint', 'Exclude', 'ModelDefault'))
);
GO

---------------------------------------------------------------------------
-- Score — the current score: one row per (model x anchor record) (§5.3)
---------------------------------------------------------------------------
CREATE TABLE ${flyway:defaultSchema}.Score (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    ScoreModelID UNIQUEIDENTIFIER NOT NULL,
    ScoreModelVersionID UNIQUEIDENTIFIER NOT NULL,
    AnchorEntityID UNIQUEIDENTIFIER NOT NULL,
    AnchorRecordID NVARCHAR(100) NOT NULL,
    AnchorRecordKeyJSON NVARCHAR(MAX) NULL,
    RawScore DECIMAL(12,4) NULL,
    NormalizedScore DECIMAL(9,4) NULL,
    BandID UNIQUEIDENTIFIER NULL,
    PreviousNormalizedScore DECIMAL(9,4) NULL,
    PreviousBandID UNIQUEIDENTIFIER NULL,
    Delta DECIMAL(9,4) NULL,
    TrendDirection NVARCHAR(8) NULL,
    TrendSlope DECIMAL(12,6) NULL,
    Confidence DECIMAL(5,4) NULL,
    DataCompleteness DECIMAL(5,4) NULL,
    ComputedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    AsOfDate DATETIME2 NULL,
    NextRecomputeAt DATETIME2 NULL,
    IsStale BIT NOT NULL DEFAULT 0,
    ExplanationSummary NVARCHAR(MAX) NULL,
    CONSTRAINT PK_Score PRIMARY KEY (ID),
    CONSTRAINT UQ_Score_ModelAnchorRecord UNIQUE (ScoreModelID, AnchorRecordID),
    CONSTRAINT FK_Score_ScoreModel FOREIGN KEY (ScoreModelID) REFERENCES ${flyway:defaultSchema}.ScoreModel(ID),
    CONSTRAINT FK_Score_ScoreModelVersion FOREIGN KEY (ScoreModelVersionID) REFERENCES ${flyway:defaultSchema}.ScoreModelVersion(ID),
    CONSTRAINT FK_Score_AnchorEntity FOREIGN KEY (AnchorEntityID) REFERENCES __mj.Entity(ID),
    CONSTRAINT FK_Score_Band FOREIGN KEY (BandID) REFERENCES ${flyway:defaultSchema}.ScoreBand(ID),
    CONSTRAINT FK_Score_PreviousBand FOREIGN KEY (PreviousBandID) REFERENCES ${flyway:defaultSchema}.ScoreBand(ID),
    CONSTRAINT CK_Score_TrendDirection CHECK (TrendDirection IN ('Up', 'Down', 'Flat'))
);
GO

---------------------------------------------------------------------------
-- ScoreFactorContribution — per-factor breakdown of the current score (§5.3)
---------------------------------------------------------------------------
CREATE TABLE ${flyway:defaultSchema}.ScoreFactorContribution (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    ScoreID UNIQUEIDENTIFIER NOT NULL,
    ModelFactorID UNIQUEIDENTIFIER NOT NULL,
    FactorID UNIQUEIDENTIFIER NOT NULL,
    RawValue DECIMAL(18,6) NULL,
    NormalizedValue DECIMAL(9,4) NULL,
    WeightedContribution DECIMAL(12,4) NULL,
    PercentOfTotal DECIMAL(5,4) NULL,
    ContributionDelta DECIMAL(12,4) NULL,
    HadData BIT NOT NULL DEFAULT 0,
    MissingDataApplied BIT NOT NULL DEFAULT 0,
    DetailJSON NVARCHAR(MAX) NULL,
    CONSTRAINT PK_ScoreFactorContribution PRIMARY KEY (ID),
    CONSTRAINT FK_ScoreFactorContribution_Score FOREIGN KEY (ScoreID) REFERENCES ${flyway:defaultSchema}.Score(ID),
    CONSTRAINT FK_ScoreFactorContribution_ModelFactor FOREIGN KEY (ModelFactorID) REFERENCES ${flyway:defaultSchema}.ModelFactor(ID),
    CONSTRAINT FK_ScoreFactorContribution_Factor FOREIGN KEY (FactorID) REFERENCES ${flyway:defaultSchema}.Factor(ID)
);
GO

---------------------------------------------------------------------------
-- ScoreHistory — append-only time-series snapshots of scores (§5.3)
---------------------------------------------------------------------------
CREATE TABLE ${flyway:defaultSchema}.ScoreHistory (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    ScoreModelID UNIQUEIDENTIFIER NOT NULL,
    ScoreModelVersionID UNIQUEIDENTIFIER NOT NULL,
    AnchorEntityID UNIQUEIDENTIFIER NOT NULL,
    AnchorRecordID NVARCHAR(100) NOT NULL,
    NormalizedScore DECIMAL(9,4) NULL,
    BandID UNIQUEIDENTIFIER NULL,
    AsOfDate DATETIME2 NULL,
    ComputedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    DataCompleteness DECIMAL(5,4) NULL,
    Confidence DECIMAL(5,4) NULL,
    ContributionsJSON NVARCHAR(MAX) NULL,
    CONSTRAINT PK_ScoreHistory PRIMARY KEY (ID),
    CONSTRAINT FK_ScoreHistory_ScoreModel FOREIGN KEY (ScoreModelID) REFERENCES ${flyway:defaultSchema}.ScoreModel(ID),
    CONSTRAINT FK_ScoreHistory_ScoreModelVersion FOREIGN KEY (ScoreModelVersionID) REFERENCES ${flyway:defaultSchema}.ScoreModelVersion(ID),
    CONSTRAINT FK_ScoreHistory_AnchorEntity FOREIGN KEY (AnchorEntityID) REFERENCES __mj.Entity(ID),
    CONSTRAINT FK_ScoreHistory_Band FOREIGN KEY (BandID) REFERENCES ${flyway:defaultSchema}.ScoreBand(ID)
);
GO

---------------------------------------------------------------------------
-- ScoreRecomputeRun — one batch/event recompute pass; drives cost metering (§5.4)
---------------------------------------------------------------------------
CREATE TABLE ${flyway:defaultSchema}.ScoreRecomputeRun (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    ScoreModelID UNIQUEIDENTIFIER NOT NULL,
    ScoreModelVersionID UNIQUEIDENTIFIER NULL,
    TriggerType NVARCHAR(16) NOT NULL,
    Scope NVARCHAR(16) NOT NULL,
    StartedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CompletedAt DATETIME2 NULL,
    Status NVARCHAR(16) NOT NULL DEFAULT 'Running',
    RecordsScored INT NULL,
    RecordsChanged INT NULL,
    BandTransitions INT NULL,
    DurationMs BIGINT NULL,
    CostUnitsConsumed DECIMAL(12,4) NULL,
    ErrorsJSON NVARCHAR(MAX) NULL,
    CONSTRAINT PK_ScoreRecomputeRun PRIMARY KEY (ID),
    CONSTRAINT FK_ScoreRecomputeRun_ScoreModel FOREIGN KEY (ScoreModelID) REFERENCES ${flyway:defaultSchema}.ScoreModel(ID),
    CONSTRAINT FK_ScoreRecomputeRun_ScoreModelVersion FOREIGN KEY (ScoreModelVersionID) REFERENCES ${flyway:defaultSchema}.ScoreModelVersion(ID),
    CONSTRAINT CK_ScoreRecomputeRun_TriggerType CHECK (TriggerType IN ('Scheduled', 'Event', 'Manual', 'Backfill')),
    CONSTRAINT CK_ScoreRecomputeRun_Scope CHECK (Scope IN ('FullPopulation', 'Incremental', 'SingleRecord')),
    CONSTRAINT CK_ScoreRecomputeRun_Status CHECK (Status IN ('Running', 'Succeeded', 'Failed', 'PartialSuccess'))
);
GO

---------------------------------------------------------------------------
-- ScoreBandTransition — first-class record of a band crossing (§5.3)
---------------------------------------------------------------------------
CREATE TABLE ${flyway:defaultSchema}.ScoreBandTransition (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    ScoreModelID UNIQUEIDENTIFIER NOT NULL,
    AnchorRecordID NVARCHAR(100) NOT NULL,
    FromBandID UNIQUEIDENTIFIER NULL,
    ToBandID UNIQUEIDENTIFIER NULL,
    Direction NVARCHAR(12) NULL,
    OccurredAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    RecomputeRunID UNIQUEIDENTIFIER NULL,
    Handled BIT NOT NULL DEFAULT 0,
    CONSTRAINT PK_ScoreBandTransition PRIMARY KEY (ID),
    CONSTRAINT FK_ScoreBandTransition_ScoreModel FOREIGN KEY (ScoreModelID) REFERENCES ${flyway:defaultSchema}.ScoreModel(ID),
    CONSTRAINT FK_ScoreBandTransition_FromBand FOREIGN KEY (FromBandID) REFERENCES ${flyway:defaultSchema}.ScoreBand(ID),
    CONSTRAINT FK_ScoreBandTransition_ToBand FOREIGN KEY (ToBandID) REFERENCES ${flyway:defaultSchema}.ScoreBand(ID),
    CONSTRAINT FK_ScoreBandTransition_RecomputeRun FOREIGN KEY (RecomputeRunID) REFERENCES ${flyway:defaultSchema}.ScoreRecomputeRun(ID),
    CONSTRAINT CK_ScoreBandTransition_Direction CHECK (Direction IN ('Improving', 'Worsening'))
);
GO

---------------------------------------------------------------------------
-- ScoreModelAuditEvent — config-change audit for a model (§5.4)
---------------------------------------------------------------------------
CREATE TABLE ${flyway:defaultSchema}.ScoreModelAuditEvent (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    ScoreModelID UNIQUEIDENTIFIER NOT NULL,
    EntityChanged NVARCHAR(100) NOT NULL,
    RecordID NVARCHAR(100) NULL,
    ChangeType NVARCHAR(20) NOT NULL,
    BeforeJSON NVARCHAR(MAX) NULL,
    AfterJSON NVARCHAR(MAX) NULL,
    ChangedByUserID UNIQUEIDENTIFIER NULL,
    ChangedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_ScoreModelAuditEvent PRIMARY KEY (ID),
    CONSTRAINT FK_ScoreModelAuditEvent_ScoreModel FOREIGN KEY (ScoreModelID) REFERENCES ${flyway:defaultSchema}.ScoreModel(ID),
    CONSTRAINT FK_ScoreModelAuditEvent_ChangedByUser FOREIGN KEY (ChangedByUserID) REFERENCES __mj.[User](ID),
    CONSTRAINT CK_ScoreModelAuditEvent_ChangeType CHECK (ChangeType IN ('Create', 'Update', 'Delete', 'Publish'))
);
GO

-- =============================================================================
-- SECTION 3 — INDEXES (composite / non-FK only)
-- CodeGen creates single-column FK indexes (IDX_AUTO_MJ_FKEY_*); these are the
-- composite and non-FK indexes from plan §5 that CodeGen does NOT generate.
-- =============================================================================

-- ScoreModel: active-model lookup by anchor entity
CREATE INDEX IX_ScoreModel_AnchorEntity_Status
    ON ${flyway:defaultSchema}.ScoreModel (AnchorEntityID, Status);
GO

-- Factor: builder filtering by anchor + kind
CREATE INDEX IX_Factor_AnchorEntity_FactorType
    ON ${flyway:defaultSchema}.Factor (AnchorEntityID, FactorType);
GO

-- Score: band rollups
CREATE INDEX IX_Score_Model_Band
    ON ${flyway:defaultSchema}.Score (ScoreModelID, BandID);
GO

-- Score: ranking by score
CREATE INDEX IX_Score_Model_NormalizedScore
    ON ${flyway:defaultSchema}.Score (ScoreModelID, NormalizedScore);
GO

-- Score: "who dropped the most"
CREATE INDEX IX_Score_Model_Trend_Delta
    ON ${flyway:defaultSchema}.Score (ScoreModelID, TrendDirection, Delta);
GO

-- ScoreHistory: trajectory reads for one record over time
CREATE INDEX IX_ScoreHistory_Model_Anchor_AsOf
    ON ${flyway:defaultSchema}.ScoreHistory (ScoreModelID, AnchorRecordID, AsOfDate);
GO

-- ScoreBandTransition: time-ordered transitions per model
CREATE INDEX IX_ScoreBandTransition_Model_OccurredAt
    ON ${flyway:defaultSchema}.ScoreBandTransition (ScoreModelID, OccurredAt);
GO

-- ScoreBandTransition: the action-layer queue (find unhandled)
CREATE INDEX IX_ScoreBandTransition_Handled
    ON ${flyway:defaultSchema}.ScoreBandTransition (Handled);
GO

-- =============================================================================
-- SECTION 4 — EXTENDED PROPERTIES (table + non-PK/non-FK column descriptions)
-- =============================================================================

---------------------------------------------------------------------------
-- ScoreBandSet
---------------------------------------------------------------------------
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'A reusable, named set of qualitative score bands (e.g. Healthy / Watch / At-Risk / Critical) that can be shared across scoring models.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreBandSet';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Display name of the band set.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreBandSet', @level2type = N'COLUMN', @level2name = N'Name';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Optional description of the band set and its intended use.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreBandSet', @level2type = N'COLUMN', @level2name = N'Description';
GO

---------------------------------------------------------------------------
-- ScoreBand
---------------------------------------------------------------------------
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'One qualitative band within a band set, defined by a half-open score range with a severity and color for sorting and display.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreBand';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Display label for the band, e.g. Healthy, Watch, At-Risk, Critical.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreBand', @level2type = N'COLUMN', @level2name = N'Label';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Inclusive lower bound of the band score range.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreBand', @level2type = N'COLUMN', @level2name = N'MinScore';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Exclusive upper bound of the band score range (half-open; ranges are contiguous and non-overlapping).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreBand', @level2type = N'COLUMN', @level2name = N'MaxScore';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Severity rank where 0 is best and higher numbers are worse; drives sort order and color.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreBand', @level2type = N'COLUMN', @level2name = N'Severity';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Hex color code (e.g. #2E7D32) used to render the band in the UI.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreBand', @level2type = N'COLUMN', @level2name = N'ColorHex';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Indicates a terminal band (e.g. Lapsed) that represents an end state rather than a point on the continuum.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreBand', @level2type = N'COLUMN', @level2name = N'IsTerminal';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Optional description of what this band means.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreBand', @level2type = N'COLUMN', @level2name = N'Description';
GO

---------------------------------------------------------------------------
-- TimeWindow
---------------------------------------------------------------------------
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'A reusable, first-class time window used when evaluating factors (e.g. trailing 90 days, current term, renewal window -90d).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'TimeWindow';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Display name of the time window.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'TimeWindow', @level2type = N'COLUMN', @level2name = N'Name';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Window type: Rolling, Calendar, SinceEvent, RenewalRelative, or AllTime.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'TimeWindow', @level2type = N'COLUMN', @level2name = N'WindowType';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Window length in days, for Rolling/Calendar windows.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'TimeWindow', @level2type = N'COLUMN', @level2name = N'LengthDays';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Window length in months, for Rolling/Calendar windows.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'TimeWindow', @level2type = N'COLUMN', @level2name = N'LengthMonths';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'For RenewalRelative/SinceEvent windows, the date field on the anchor record the window is measured from (e.g. RenewalDate).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'TimeWindow', @level2type = N'COLUMN', @level2name = N'AnchorDateField';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Offset in days applied to the window start relative to the anchor date.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'TimeWindow', @level2type = N'COLUMN', @level2name = N'OffsetDays';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Optional description of the time window.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'TimeWindow', @level2type = N'COLUMN', @level2name = N'Description';
GO

---------------------------------------------------------------------------
-- ScoreModel
---------------------------------------------------------------------------
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'The editable definition of one scoring model: anchor entity, scale, combine strategy, recompute policy, and bands. Many models can be active per tenant.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModel';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Human-readable name of the model, e.g. "2026 Renewal Risk".',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModel', @level2type = N'COLUMN', @level2name = N'Name';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Stable, unique handle for the model used in expressions and references.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModel', @level2type = N'COLUMN', @level2name = N'Slug';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Optional description of what the model scores and why.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModel', @level2type = N'COLUMN', @level2name = N'Description';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Lifecycle status of the model: Draft, Active, Paused, or Archived.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModel', @level2type = N'COLUMN', @level2name = N'Status';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Minimum value of the output score scale (default 0).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModel', @level2type = N'COLUMN', @level2name = N'ScoreScaleMin';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Maximum value of the output score scale (default 100).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModel', @level2type = N'COLUMN', @level2name = N'ScoreScaleMax';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'How factor contributions combine into a score: WeightedSum, WeightedAvg, Banded, ZScoreComposite, or ExpressionDriven.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModel', @level2type = N'COLUMN', @level2name = N'CombineStrategy';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'For ExpressionDriven models, the formula over factor slugs used to combine contributions.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModel', @level2type = N'COLUMN', @level2name = N'CombineExpression';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'JSON/DSL filter defining which anchor records are in scope for scoring (e.g. Status = Active).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModel', @level2type = N'COLUMN', @level2name = N'PopulationFilter';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'When scores recompute: Scheduled, EventDriven, OnDemand, or Hybrid.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModel', @level2type = N'COLUMN', @level2name = N'RecomputeMode';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Cron expression controlling scheduled recompute, when RecomputeMode includes a schedule.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModel', @level2type = N'COLUMN', @level2name = N'RecomputeCron';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Defines what "now" means when resolving time windows: RunTime, EndOfPreviousDay, or Fixed.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModel', @level2type = N'COLUMN', @level2name = N'AsOfStrategy';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'When set, the model consumes cross-tenant benchmark distributions for normalization (calibration network).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModel', @level2type = N'COLUMN', @level2name = N'IsCalibrated';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Number of days used to compute the headline Delta and trend on each score.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModel', @level2type = N'COLUMN', @level2name = N'TrendWindowDays';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Start of the bounded time range during which the model is active (optional).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModel', @level2type = N'COLUMN', @level2name = N'EffectiveFrom';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'End of the bounded time range during which the model is active (optional).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModel', @level2type = N'COLUMN', @level2name = N'EffectiveTo';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Freeform notes about the model.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModel', @level2type = N'COLUMN', @level2name = N'Notes';
GO

---------------------------------------------------------------------------
-- ScoreModelVersion
---------------------------------------------------------------------------
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'An immutable snapshot of a model''s complete configuration at publish time. Every Score and ScoreHistory row references the version that produced it, making scores reproducible and auditable.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModelVersion';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Monotonic version number within the model.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModelVersion', @level2type = N'COLUMN', @level2name = N'VersionNumber';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Optional human-readable label for the version.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModelVersion', @level2type = N'COLUMN', @level2name = N'VersionLabel';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Fully denormalized JSON snapshot (anchor, related-entity map, factors, weights, windows, bands, normalization) the engine can score from on its own.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModelVersion', @level2type = N'COLUMN', @level2name = N'ConfigSnapshotJSON';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Summary of what changed versus the prior version.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModelVersion', @level2type = N'COLUMN', @level2name = N'ChangeSummary';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'UTC timestamp at which this version was published.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModelVersion', @level2type = N'COLUMN', @level2name = N'PublishedAt';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Indicates the single current version that is actively scoring for the model.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModelVersion', @level2type = N'COLUMN', @level2name = N'IsCurrent';
GO

---------------------------------------------------------------------------
-- ModelRelatedEntity
---------------------------------------------------------------------------
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Declares an MJ entity wired into a model and how to traverse from the anchor to it. Factors reference these by Alias.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ModelRelatedEntity';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Handle used by factors to reference this related entity, e.g. crm_activity, invoices, lms_completions.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ModelRelatedEntity', @level2type = N'COLUMN', @level2name = N'Alias';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'JSON describing the join path from the anchor to the related entity (direct FK or multi-hop), resolved against MJ relationship metadata.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ModelRelatedEntity', @level2type = N'COLUMN', @level2name = N'RelationshipPath';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Join type from anchor to related entity: Inner or Left (usually Left so absence of related data is itself scorable).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ModelRelatedEntity', @level2type = N'COLUMN', @level2name = N'JoinType';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Informational provenance tag for the source system (e.g. Salesforce, Finance, LMS, Community, Email).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ModelRelatedEntity', @level2type = N'COLUMN', @level2name = N'SourceSystemTag';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Optional description of the related-entity mapping.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ModelRelatedEntity', @level2type = N'COLUMN', @level2name = N'Description';
GO

---------------------------------------------------------------------------
-- Factor
---------------------------------------------------------------------------
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'A reusable signal definition that satisfies one uniform contract. Declarative factors compile to set-based SQL; ActionBacked factors wrap an MJ Action; DerivedFromScore factors consume another model''s score.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Factor';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Human-readable name of the factor.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Factor', @level2type = N'COLUMN', @level2name = N'Name';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Stable handle for the factor, referenced by the rubric and combine expressions.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Factor', @level2type = N'COLUMN', @level2name = N'Slug';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Optional description of the signal the factor measures.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Factor', @level2type = N'COLUMN', @level2name = N'Description';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Factor kind: Declarative, ActionBacked, DerivedFromScore, or Constant. The rubric engine never branches on this.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Factor', @level2type = N'COLUMN', @level2name = N'FactorType';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'For declarative factors, the JSON/DSL filter applied to the source related entity (e.g. ActivityType IN (EmailOpen, EmailClick)).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Factor', @level2type = N'COLUMN', @level2name = N'FilterExpression';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Aggregation applied to the filtered source rows: Count, Sum, Avg, Min, Max, DistinctCount, Recency, RatePerPeriod, Exists, or TrendSlope.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Factor', @level2type = N'COLUMN', @level2name = N'Aggregation';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Column on the source entity to sum or average; null for Count/Exists aggregations.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Factor', @level2type = N'COLUMN', @level2name = N'AggregateFieldName';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Optional half-life in days for recency-weighted aggregation.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Factor', @level2type = N'COLUMN', @level2name = N'RecencyDecayHalfLifeDays';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'For ActionBacked factors, static parameters (JSON) bound to the Action at config time.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Factor', @level2type = N'COLUMN', @level2name = N'ActionParamsJSON';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Execution mode for ActionBacked factors: PerRecord or Batch.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Factor', @level2type = N'COLUMN', @level2name = N'ExecutionMode';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Marks the factor as expensive to evaluate; surfaced in the builder and used for recompute budgeting.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Factor', @level2type = N'COLUMN', @level2name = N'IsExpensive';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Optional maximum concurrency for evaluating an ActionBacked factor.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Factor', @level2type = N'COLUMN', @level2name = N'MaxConcurrency';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Optional rate limit per minute for external-API-backed Actions.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Factor', @level2type = N'COLUMN', @level2name = N'RateLimitPerMinute';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Result cache time-to-live in seconds, keyed by (anchor record, as-of date, params hash).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Factor', @level2type = N'COLUMN', @level2name = N'CacheTTLSeconds';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Raw data type produced by the factor before normalization: Number, Date, Boolean, or Duration.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Factor', @level2type = N'COLUMN', @level2name = N'RawDataType';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Normalization method mapping the raw value to a contribution: None, MinMax, Percentile, ZScore, Logistic, Banded, or Lookup.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Factor', @level2type = N'COLUMN', @level2name = N'NormalizationMethod';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'JSON parameters for the normalization method (clamps, percentile basis, logistic midpoint/steepness, banded thresholds, lookup table).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Factor', @level2type = N'COLUMN', @level2name = N'NormalizationParamsJSON';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Lower bound of the normalized contribution range (e.g. 0).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Factor', @level2type = N'COLUMN', @level2name = N'OutputMin';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Upper bound of the normalized contribution range (e.g. 1).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Factor', @level2type = N'COLUMN', @level2name = N'OutputMax';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Direction of the signal; when false, higher raw values are worse (e.g. days since last login).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Factor', @level2type = N'COLUMN', @level2name = N'HigherIsBetter';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Governance state, enforced for ActionBacked factors before production use: Draft, InReview, Approved, or Deprecated.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Factor', @level2type = N'COLUMN', @level2name = N'PromotionState';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'UTC timestamp of the most recent validation of the factor.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Factor', @level2type = N'COLUMN', @level2name = N'LastValidatedAt';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Name of the AI agent that created the factor, if any (e.g. ModelBuilderAgent, ActionBuilder).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Factor', @level2type = N'COLUMN', @level2name = N'CreatedByAgent';
GO

---------------------------------------------------------------------------
-- ModelFactor
---------------------------------------------------------------------------
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Binds a Factor into a model with its weight and contribution rules. The rubric is the set of these rows.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ModelFactor';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Weight applied to this factor''s normalized contribution.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ModelFactor', @level2type = N'COLUMN', @level2name = N'Weight';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'How the weight is applied: Additive, Multiplier, Gate, Penalty, or Bonus.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ModelFactor', @level2type = N'COLUMN', @level2name = N'WeightMode';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Optional upper clamp on this factor''s contribution.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ModelFactor', @level2type = N'COLUMN', @level2name = N'ContributionCap';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Optional lower clamp on this factor''s contribution.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ModelFactor', @level2type = N'COLUMN', @level2name = N'ContributionFloor';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Extra weight placed on the factor''s delta versus its level (encodes "a falling 80 beats a steady 50").',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ModelFactor', @level2type = N'COLUMN', @level2name = N'TrendWeight';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Policy when the factor has no data: Zero, NeutralMidpoint, Exclude, or ModelDefault.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ModelFactor', @level2type = N'COLUMN', @level2name = N'MissingDataPolicy';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'When true and data is missing, the resulting score is flagged low-confidence.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ModelFactor', @level2type = N'COLUMN', @level2name = N'IsRequired';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Label shown for this factor in explainability views, e.g. "Newsletter engagement".',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ModelFactor', @level2type = N'COLUMN', @level2name = N'DisplayLabel';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Sort order for displaying this factor in the rubric and explainability views.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ModelFactor', @level2type = N'COLUMN', @level2name = N'DisplayOrder';
GO

---------------------------------------------------------------------------
-- Score
---------------------------------------------------------------------------
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'The current score for one anchor record under one model. Written back into MJ as a first-class entity.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Score';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Primary-key value of the scored anchor record, stored as a string to stay entity-agnostic.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Score', @level2type = N'COLUMN', @level2name = N'AnchorRecordID';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Optional JSON representation of a composite anchor key.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Score', @level2type = N'COLUMN', @level2name = N'AnchorRecordKeyJSON';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Pre-scale combined value before mapping to the output scale.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Score', @level2type = N'COLUMN', @level2name = N'RawScore';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'The headline score on the model''s output scale (e.g. 0-100).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Score', @level2type = N'COLUMN', @level2name = N'NormalizedScore';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'The normalized score from the previous computation, for delta/trend.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Score', @level2type = N'COLUMN', @level2name = N'PreviousNormalizedScore';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Change in normalized score versus the previous value over the trend window.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Score', @level2type = N'COLUMN', @level2name = N'Delta';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Direction of recent movement: Up, Down, or Flat.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Score', @level2type = N'COLUMN', @level2name = N'TrendDirection';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Regression slope of the score over recent history.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Score', @level2type = N'COLUMN', @level2name = N'TrendSlope';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Confidence in the score (0-1), derived from data completeness.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Score', @level2type = N'COLUMN', @level2name = N'Confidence';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Fraction of factors that had data when the score was computed (0-1).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Score', @level2type = N'COLUMN', @level2name = N'DataCompleteness';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'UTC timestamp at which this score was computed.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Score', @level2type = N'COLUMN', @level2name = N'ComputedAt';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'The "now" the time windows resolved against for this score.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Score', @level2type = N'COLUMN', @level2name = N'AsOfDate';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Optional scheduled time for the next recompute of this score.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Score', @level2type = N'COLUMN', @level2name = N'NextRecomputeAt';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Indicates population statistics moved but this record has not yet been recomputed.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Score', @level2type = N'COLUMN', @level2name = N'IsStale';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Cached natural-language explanation of the score, refreshed on material change.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'Score', @level2type = N'COLUMN', @level2name = N'ExplanationSummary';
GO

---------------------------------------------------------------------------
-- ScoreFactorContribution
---------------------------------------------------------------------------
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Per-factor breakdown of a current score; the explainability spine that makes the score narrative free.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreFactorContribution';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Raw value the factor produced before normalization.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreFactorContribution', @level2type = N'COLUMN', @level2name = N'RawValue';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'The factor''s normalized output (e.g. 0-1 or configured range).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreFactorContribution', @level2type = N'COLUMN', @level2name = N'NormalizedValue';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Amount this factor added to the score after weighting.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreFactorContribution', @level2type = N'COLUMN', @level2name = N'WeightedContribution';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Share of the total score attributable to this factor.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreFactorContribution', @level2type = N'COLUMN', @level2name = N'PercentOfTotal';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Change in this factor''s contribution versus the previous score.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreFactorContribution', @level2type = N'COLUMN', @level2name = N'ContributionDelta';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Indicates whether the factor had data for this record.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreFactorContribution', @level2type = N'COLUMN', @level2name = N'HadData';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Indicates whether a missing-data policy was applied for this factor.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreFactorContribution', @level2type = N'COLUMN', @level2name = N'MissingDataApplied';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Optional JSON with sampled underlying record references for drill-through.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreFactorContribution', @level2type = N'COLUMN', @level2name = N'DetailJSON';
GO

---------------------------------------------------------------------------
-- ScoreHistory
---------------------------------------------------------------------------
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Append-only time-series snapshots of scores; the trajectory is the asset. Snapshot on change plus periodic keyframes.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreHistory';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Primary-key value of the scored anchor record, stored as a string to stay entity-agnostic.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreHistory', @level2type = N'COLUMN', @level2name = N'AnchorRecordID';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'The headline normalized score at this point in time.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreHistory', @level2type = N'COLUMN', @level2name = N'NormalizedScore';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'The "now" the time windows resolved against for this snapshot.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreHistory', @level2type = N'COLUMN', @level2name = N'AsOfDate';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'UTC timestamp at which this snapshot was computed.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreHistory', @level2type = N'COLUMN', @level2name = N'ComputedAt';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Fraction of factors that had data at this point in time (0-1).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreHistory', @level2type = N'COLUMN', @level2name = N'DataCompleteness';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Confidence in the score at this point in time (0-1).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreHistory', @level2type = N'COLUMN', @level2name = N'Confidence';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Compact per-factor snapshot (JSON) for point-in-time explainability without exploding row counts.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreHistory', @level2type = N'COLUMN', @level2name = N'ContributionsJSON';
GO

---------------------------------------------------------------------------
-- ScoreRecomputeRun
---------------------------------------------------------------------------
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'One batch or event recompute pass; drives the admin health view and compute/cost metering.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreRecomputeRun';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'What triggered the run: Scheduled, Event, Manual, or Backfill.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreRecomputeRun', @level2type = N'COLUMN', @level2name = N'TriggerType';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Scope of the run: FullPopulation, Incremental, or SingleRecord.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreRecomputeRun', @level2type = N'COLUMN', @level2name = N'Scope';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'UTC timestamp when the run started.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreRecomputeRun', @level2type = N'COLUMN', @level2name = N'StartedAt';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'UTC timestamp when the run completed.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreRecomputeRun', @level2type = N'COLUMN', @level2name = N'CompletedAt';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Run status: Running, Succeeded, Failed, or PartialSuccess.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreRecomputeRun', @level2type = N'COLUMN', @level2name = N'Status';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Number of records scored in the run.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreRecomputeRun', @level2type = N'COLUMN', @level2name = N'RecordsScored';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Number of records whose score changed in the run.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreRecomputeRun', @level2type = N'COLUMN', @level2name = N'RecordsChanged';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Number of band transitions recorded during the run.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreRecomputeRun', @level2type = N'COLUMN', @level2name = N'BandTransitions';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Total run duration in milliseconds.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreRecomputeRun', @level2type = N'COLUMN', @level2name = N'DurationMs';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Tokens/compute units consumed by ActionBacked factors; feeds metering and billing.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreRecomputeRun', @level2type = N'COLUMN', @level2name = N'CostUnitsConsumed';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'JSON capturing any errors encountered during the run.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreRecomputeRun', @level2type = N'COLUMN', @level2name = N'ErrorsJSON';
GO

---------------------------------------------------------------------------
-- ScoreBandTransition
---------------------------------------------------------------------------
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'First-class record of a band crossing; the event the action layer and write-back key off.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreBandTransition';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Primary-key value of the anchor record that crossed bands, stored as a string to stay entity-agnostic.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreBandTransition', @level2type = N'COLUMN', @level2name = N'AnchorRecordID';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Direction of the crossing: Improving or Worsening.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreBandTransition', @level2type = N'COLUMN', @level2name = N'Direction';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'UTC timestamp at which the band crossing occurred.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreBandTransition', @level2type = N'COLUMN', @level2name = N'OccurredAt';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Indicates whether the transition has been picked up by write-back or an intervention.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreBandTransition', @level2type = N'COLUMN', @level2name = N'Handled';
GO

---------------------------------------------------------------------------
-- ScoreModelAuditEvent
---------------------------------------------------------------------------
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Config-change audit: who changed which weight, factor, or window and when. Required for an explainable, governed scoring product.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModelAuditEvent';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Name of the configuration entity that changed (e.g. ScoreModel, Factor, ModelFactor).',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModelAuditEvent', @level2type = N'COLUMN', @level2name = N'EntityChanged';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Identifier of the specific record that changed, stored as a string to stay entity-agnostic.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModelAuditEvent', @level2type = N'COLUMN', @level2name = N'RecordID';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Kind of change: Create, Update, Delete, or Publish.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModelAuditEvent', @level2type = N'COLUMN', @level2name = N'ChangeType';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'JSON snapshot of the record before the change.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModelAuditEvent', @level2type = N'COLUMN', @level2name = N'BeforeJSON';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'JSON snapshot of the record after the change.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModelAuditEvent', @level2type = N'COLUMN', @level2name = N'AfterJSON';
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'UTC timestamp at which the change occurred.',
    @level0type = N'SCHEMA', @level0name = N'${flyway:defaultSchema}', @level1type = N'TABLE', @level1name = N'ScoreModelAuditEvent', @level2type = N'COLUMN', @level2name = N'ChangedAt';
GO

-- =============================================================================
-- SECTION 5 — CODEGEN OUTPUT (auto-generated by `mj codegen`; do NOT hand-edit)
-- Folded in per the bizapps migration convention so the entity views, CRUD stored
-- procedures, system columns, FK indexes, and metadata sync for the __mj_BizAppsSonar
-- entities are part of the build/replay. Regenerate via `mj codegen`, do not edit here.
-- =============================================================================

/* SQL generated to create new entity MJ_BizApps_Sonar: Model Related Entities */

      INSERT INTO [${mjSchema}].[Entity] (
         [ID],
         [Name],
         [DisplayName],
         [Description],
         [NameSuffix],
         [BaseTable],
         [BaseView],
         [SchemaName],
         [IncludeInAPI],
         [AllowUserSearchAPI],
         [AllowCaching]
         , [TrackRecordChanges]
         , [AuditRecordAccess]
         , [AuditViewRuns]
         , [AllowAllRowsAPI]
         , [AllowCreateAPI]
         , [AllowUpdateAPI]
         , [AllowDeleteAPI]
         , [UserViewMaxRows]
         , [__mj_CreatedAt]
         , [__mj_UpdatedAt]
      )
      VALUES (
         '710b4c24-c185-4693-b958-2525655e3d20',
         'MJ_BizApps_Sonar: Model Related Entities',
         'Model Related Entities',
         'Declares an MJ entity wired into a model and how to traverse from the anchor to it. Factors reference these by Alias.',
         NULL,
         'ModelRelatedEntity',
         'vwModelRelatedEntities',
         '${flyway:defaultSchema}',
         1,
         1,
         0
         , 1
         , 0
         , 0
         , 0
         , 1
         , 1
         , 1
         , 1000
         , GETUTCDATE()
         , GETUTCDATE()
      );

/* SQL generated to create new application ${flyway:defaultSchema} */
INSERT INTO [${mjSchema}].[Application] (ID, Name, Description, SchemaAutoAddNewEntities, Path, AutoUpdatePath)
                       VALUES ('4f9477fb-bc8b-4ca9-a4fe-c0fb45496285', '${flyway:defaultSchema}', 'Generated for schema', '${flyway:defaultSchema}', 'sonar', 1);

/* Adding role UI to application ${flyway:defaultSchema} */
INSERT INTO [${mjSchema}].[ApplicationRole]
                                 ([ApplicationID], [RoleID], [CanAccess], [CanAdmin]) VALUES
                                 ('4f9477fb-bc8b-4ca9-a4fe-c0fb45496285', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0);

/* Adding role Developer to application ${flyway:defaultSchema} */
INSERT INTO [${mjSchema}].[ApplicationRole]
                                 ([ApplicationID], [RoleID], [CanAccess], [CanAdmin]) VALUES
                                 ('4f9477fb-bc8b-4ca9-a4fe-c0fb45496285', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1);

/* Adding role Integration to application ${flyway:defaultSchema} */
INSERT INTO [${mjSchema}].[ApplicationRole]
                                 ([ApplicationID], [RoleID], [CanAccess], [CanAdmin]) VALUES
                                 ('4f9477fb-bc8b-4ca9-a4fe-c0fb45496285', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0);

/* SQL generated to add new entity MJ_BizApps_Sonar: Model Related Entities to application ID: '4f9477fb-bc8b-4ca9-a4fe-c0fb45496285' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('4f9477fb-bc8b-4ca9-a4fe-c0fb45496285', '710b4c24-c185-4693-b958-2525655e3d20', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '4f9477fb-bc8b-4ca9-a4fe-c0fb45496285'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Model Related Entities for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('710b4c24-c185-4693-b958-2525655e3d20', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Model Related Entities for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('710b4c24-c185-4693-b958-2525655e3d20', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Model Related Entities for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('710b4c24-c185-4693-b958-2525655e3d20', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to create new entity MJ_BizApps_Sonar: Factors */

      INSERT INTO [${mjSchema}].[Entity] (
         [ID],
         [Name],
         [DisplayName],
         [Description],
         [NameSuffix],
         [BaseTable],
         [BaseView],
         [SchemaName],
         [IncludeInAPI],
         [AllowUserSearchAPI],
         [AllowCaching]
         , [TrackRecordChanges]
         , [AuditRecordAccess]
         , [AuditViewRuns]
         , [AllowAllRowsAPI]
         , [AllowCreateAPI]
         , [AllowUpdateAPI]
         , [AllowDeleteAPI]
         , [UserViewMaxRows]
         , [__mj_CreatedAt]
         , [__mj_UpdatedAt]
      )
      VALUES (
         '01bc22be-e8c3-4c17-912b-fc2af1e2dc03',
         'MJ_BizApps_Sonar: Factors',
         'Factors',
         'A reusable signal definition that satisfies one uniform contract. Declarative factors compile to set-based SQL; ActionBacked factors wrap an MJ Action; DerivedFromScore factors consume another model''s score.',
         NULL,
         'Factor',
         'vwFactors',
         '${flyway:defaultSchema}',
         1,
         1,
         0
         , 1
         , 0
         , 0
         , 0
         , 1
         , 1
         , 1
         , 1000
         , GETUTCDATE()
         , GETUTCDATE()
      );

/* SQL generated to add new entity MJ_BizApps_Sonar: Factors to application ID: '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('4F9477FB-BC8B-4CA9-A4FE-C0FB45496285', '01bc22be-e8c3-4c17-912b-fc2af1e2dc03', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Factors for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('01bc22be-e8c3-4c17-912b-fc2af1e2dc03', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Factors for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('01bc22be-e8c3-4c17-912b-fc2af1e2dc03', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Factors for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('01bc22be-e8c3-4c17-912b-fc2af1e2dc03', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to create new entity MJ_BizApps_Sonar: Model Factors */

      INSERT INTO [${mjSchema}].[Entity] (
         [ID],
         [Name],
         [DisplayName],
         [Description],
         [NameSuffix],
         [BaseTable],
         [BaseView],
         [SchemaName],
         [IncludeInAPI],
         [AllowUserSearchAPI],
         [AllowCaching]
         , [TrackRecordChanges]
         , [AuditRecordAccess]
         , [AuditViewRuns]
         , [AllowAllRowsAPI]
         , [AllowCreateAPI]
         , [AllowUpdateAPI]
         , [AllowDeleteAPI]
         , [UserViewMaxRows]
         , [__mj_CreatedAt]
         , [__mj_UpdatedAt]
      )
      VALUES (
         'afa51fa5-b85b-49de-8905-d60b23d07dfa',
         'MJ_BizApps_Sonar: Model Factors',
         'Model Factors',
         'Binds a Factor into a model with its weight and contribution rules. The rubric is the set of these rows.',
         NULL,
         'ModelFactor',
         'vwModelFactors',
         '${flyway:defaultSchema}',
         1,
         1,
         0
         , 1
         , 0
         , 0
         , 0
         , 1
         , 1
         , 1
         , 1000
         , GETUTCDATE()
         , GETUTCDATE()
      );

/* SQL generated to add new entity MJ_BizApps_Sonar: Model Factors to application ID: '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('4F9477FB-BC8B-4CA9-A4FE-C0FB45496285', 'afa51fa5-b85b-49de-8905-d60b23d07dfa', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Model Factors for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('afa51fa5-b85b-49de-8905-d60b23d07dfa', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Model Factors for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('afa51fa5-b85b-49de-8905-d60b23d07dfa', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Model Factors for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('afa51fa5-b85b-49de-8905-d60b23d07dfa', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to create new entity MJ_BizApps_Sonar: Scores */

      INSERT INTO [${mjSchema}].[Entity] (
         [ID],
         [Name],
         [DisplayName],
         [Description],
         [NameSuffix],
         [BaseTable],
         [BaseView],
         [SchemaName],
         [IncludeInAPI],
         [AllowUserSearchAPI],
         [AllowCaching]
         , [TrackRecordChanges]
         , [AuditRecordAccess]
         , [AuditViewRuns]
         , [AllowAllRowsAPI]
         , [AllowCreateAPI]
         , [AllowUpdateAPI]
         , [AllowDeleteAPI]
         , [UserViewMaxRows]
         , [__mj_CreatedAt]
         , [__mj_UpdatedAt]
      )
      VALUES (
         '32f2a760-5bfc-4af6-bb18-11ef10dd254c',
         'MJ_BizApps_Sonar: Scores',
         'Scores',
         'The current score for one anchor record under one model. Written back into MJ as a first-class entity.',
         NULL,
         'Score',
         'vwScores',
         '${flyway:defaultSchema}',
         1,
         1,
         0
         , 1
         , 0
         , 0
         , 0
         , 1
         , 1
         , 1
         , 1000
         , GETUTCDATE()
         , GETUTCDATE()
      );

/* SQL generated to add new entity MJ_BizApps_Sonar: Scores to application ID: '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('4F9477FB-BC8B-4CA9-A4FE-C0FB45496285', '32f2a760-5bfc-4af6-bb18-11ef10dd254c', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Scores for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('32f2a760-5bfc-4af6-bb18-11ef10dd254c', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Scores for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('32f2a760-5bfc-4af6-bb18-11ef10dd254c', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Scores for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('32f2a760-5bfc-4af6-bb18-11ef10dd254c', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to create new entity MJ_BizApps_Sonar: Score Factor Contributions */

      INSERT INTO [${mjSchema}].[Entity] (
         [ID],
         [Name],
         [DisplayName],
         [Description],
         [NameSuffix],
         [BaseTable],
         [BaseView],
         [SchemaName],
         [IncludeInAPI],
         [AllowUserSearchAPI],
         [AllowCaching]
         , [TrackRecordChanges]
         , [AuditRecordAccess]
         , [AuditViewRuns]
         , [AllowAllRowsAPI]
         , [AllowCreateAPI]
         , [AllowUpdateAPI]
         , [AllowDeleteAPI]
         , [UserViewMaxRows]
         , [__mj_CreatedAt]
         , [__mj_UpdatedAt]
      )
      VALUES (
         '5b986a39-e155-4eb8-9afd-c1bd6a43548c',
         'MJ_BizApps_Sonar: Score Factor Contributions',
         'Score Factor Contributions',
         'Per-factor breakdown of a current score; the explainability spine that makes the score narrative free.',
         NULL,
         'ScoreFactorContribution',
         'vwScoreFactorContributions',
         '${flyway:defaultSchema}',
         1,
         1,
         0
         , 1
         , 0
         , 0
         , 0
         , 1
         , 1
         , 1
         , 1000
         , GETUTCDATE()
         , GETUTCDATE()
      );

/* SQL generated to add new entity MJ_BizApps_Sonar: Score Factor Contributions to application ID: '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('4F9477FB-BC8B-4CA9-A4FE-C0FB45496285', '5b986a39-e155-4eb8-9afd-c1bd6a43548c', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Factor Contributions for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('5b986a39-e155-4eb8-9afd-c1bd6a43548c', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Factor Contributions for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('5b986a39-e155-4eb8-9afd-c1bd6a43548c', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Factor Contributions for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('5b986a39-e155-4eb8-9afd-c1bd6a43548c', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to create new entity MJ_BizApps_Sonar: Score Histories */

      INSERT INTO [${mjSchema}].[Entity] (
         [ID],
         [Name],
         [DisplayName],
         [Description],
         [NameSuffix],
         [BaseTable],
         [BaseView],
         [SchemaName],
         [IncludeInAPI],
         [AllowUserSearchAPI],
         [AllowCaching]
         , [TrackRecordChanges]
         , [AuditRecordAccess]
         , [AuditViewRuns]
         , [AllowAllRowsAPI]
         , [AllowCreateAPI]
         , [AllowUpdateAPI]
         , [AllowDeleteAPI]
         , [UserViewMaxRows]
         , [__mj_CreatedAt]
         , [__mj_UpdatedAt]
      )
      VALUES (
         '1f1cba7e-f548-420e-9b71-30891e454c42',
         'MJ_BizApps_Sonar: Score Histories',
         'Score Histories',
         'Append-only time-series snapshots of scores; the trajectory is the asset. Snapshot on change plus periodic keyframes.',
         NULL,
         'ScoreHistory',
         'vwScoreHistories',
         '${flyway:defaultSchema}',
         1,
         1,
         0
         , 1
         , 0
         , 0
         , 0
         , 1
         , 1
         , 1
         , 1000
         , GETUTCDATE()
         , GETUTCDATE()
      );

/* SQL generated to add new entity MJ_BizApps_Sonar: Score Histories to application ID: '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('4F9477FB-BC8B-4CA9-A4FE-C0FB45496285', '1f1cba7e-f548-420e-9b71-30891e454c42', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Histories for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('1f1cba7e-f548-420e-9b71-30891e454c42', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Histories for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('1f1cba7e-f548-420e-9b71-30891e454c42', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Histories for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('1f1cba7e-f548-420e-9b71-30891e454c42', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to create new entity MJ_BizApps_Sonar: Score Recompute Runs */

      INSERT INTO [${mjSchema}].[Entity] (
         [ID],
         [Name],
         [DisplayName],
         [Description],
         [NameSuffix],
         [BaseTable],
         [BaseView],
         [SchemaName],
         [IncludeInAPI],
         [AllowUserSearchAPI],
         [AllowCaching]
         , [TrackRecordChanges]
         , [AuditRecordAccess]
         , [AuditViewRuns]
         , [AllowAllRowsAPI]
         , [AllowCreateAPI]
         , [AllowUpdateAPI]
         , [AllowDeleteAPI]
         , [UserViewMaxRows]
         , [__mj_CreatedAt]
         , [__mj_UpdatedAt]
      )
      VALUES (
         'e9029a00-c998-4b76-b347-70f935e9797d',
         'MJ_BizApps_Sonar: Score Recompute Runs',
         'Score Recompute Runs',
         'One batch or event recompute pass; drives the admin health view and compute/cost metering.',
         NULL,
         'ScoreRecomputeRun',
         'vwScoreRecomputeRuns',
         '${flyway:defaultSchema}',
         1,
         1,
         0
         , 1
         , 0
         , 0
         , 0
         , 1
         , 1
         , 1
         , 1000
         , GETUTCDATE()
         , GETUTCDATE()
      );

/* SQL generated to add new entity MJ_BizApps_Sonar: Score Recompute Runs to application ID: '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('4F9477FB-BC8B-4CA9-A4FE-C0FB45496285', 'e9029a00-c998-4b76-b347-70f935e9797d', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Recompute Runs for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('e9029a00-c998-4b76-b347-70f935e9797d', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Recompute Runs for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('e9029a00-c998-4b76-b347-70f935e9797d', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Recompute Runs for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('e9029a00-c998-4b76-b347-70f935e9797d', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to create new entity MJ_BizApps_Sonar: Score Band Transitions */

      INSERT INTO [${mjSchema}].[Entity] (
         [ID],
         [Name],
         [DisplayName],
         [Description],
         [NameSuffix],
         [BaseTable],
         [BaseView],
         [SchemaName],
         [IncludeInAPI],
         [AllowUserSearchAPI],
         [AllowCaching]
         , [TrackRecordChanges]
         , [AuditRecordAccess]
         , [AuditViewRuns]
         , [AllowAllRowsAPI]
         , [AllowCreateAPI]
         , [AllowUpdateAPI]
         , [AllowDeleteAPI]
         , [UserViewMaxRows]
         , [__mj_CreatedAt]
         , [__mj_UpdatedAt]
      )
      VALUES (
         '52ba9a19-c7ff-47ea-affd-a398bb8ad3b2',
         'MJ_BizApps_Sonar: Score Band Transitions',
         'Score Band Transitions',
         'First-class record of a band crossing; the event the action layer and write-back key off.',
         NULL,
         'ScoreBandTransition',
         'vwScoreBandTransitions',
         '${flyway:defaultSchema}',
         1,
         1,
         0
         , 1
         , 0
         , 0
         , 0
         , 1
         , 1
         , 1
         , 1000
         , GETUTCDATE()
         , GETUTCDATE()
      );

/* SQL generated to add new entity MJ_BizApps_Sonar: Score Band Transitions to application ID: '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('4F9477FB-BC8B-4CA9-A4FE-C0FB45496285', '52ba9a19-c7ff-47ea-affd-a398bb8ad3b2', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Band Transitions for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('52ba9a19-c7ff-47ea-affd-a398bb8ad3b2', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Band Transitions for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('52ba9a19-c7ff-47ea-affd-a398bb8ad3b2', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Band Transitions for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('52ba9a19-c7ff-47ea-affd-a398bb8ad3b2', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to create new entity MJ_BizApps_Sonar: Score Model Audit Events */

      INSERT INTO [${mjSchema}].[Entity] (
         [ID],
         [Name],
         [DisplayName],
         [Description],
         [NameSuffix],
         [BaseTable],
         [BaseView],
         [SchemaName],
         [IncludeInAPI],
         [AllowUserSearchAPI],
         [AllowCaching]
         , [TrackRecordChanges]
         , [AuditRecordAccess]
         , [AuditViewRuns]
         , [AllowAllRowsAPI]
         , [AllowCreateAPI]
         , [AllowUpdateAPI]
         , [AllowDeleteAPI]
         , [UserViewMaxRows]
         , [__mj_CreatedAt]
         , [__mj_UpdatedAt]
      )
      VALUES (
         '524a22ac-73ee-4fee-a2bf-d89e66aa4f41',
         'MJ_BizApps_Sonar: Score Model Audit Events',
         'Score Model Audit Events',
         'Config-change audit: who changed which weight, factor, or window and when. Required for an explainable, governed scoring product.',
         NULL,
         'ScoreModelAuditEvent',
         'vwScoreModelAuditEvents',
         '${flyway:defaultSchema}',
         1,
         1,
         0
         , 1
         , 0
         , 0
         , 0
         , 1
         , 1
         , 1
         , 1000
         , GETUTCDATE()
         , GETUTCDATE()
      );

/* SQL generated to add new entity MJ_BizApps_Sonar: Score Model Audit Events to application ID: '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('4F9477FB-BC8B-4CA9-A4FE-C0FB45496285', '524a22ac-73ee-4fee-a2bf-d89e66aa4f41', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Model Audit Events for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('524a22ac-73ee-4fee-a2bf-d89e66aa4f41', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Model Audit Events for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('524a22ac-73ee-4fee-a2bf-d89e66aa4f41', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Model Audit Events for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('524a22ac-73ee-4fee-a2bf-d89e66aa4f41', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to create new entity MJ_BizApps_Sonar: Score Band Sets */

      INSERT INTO [${mjSchema}].[Entity] (
         [ID],
         [Name],
         [DisplayName],
         [Description],
         [NameSuffix],
         [BaseTable],
         [BaseView],
         [SchemaName],
         [IncludeInAPI],
         [AllowUserSearchAPI],
         [AllowCaching]
         , [TrackRecordChanges]
         , [AuditRecordAccess]
         , [AuditViewRuns]
         , [AllowAllRowsAPI]
         , [AllowCreateAPI]
         , [AllowUpdateAPI]
         , [AllowDeleteAPI]
         , [UserViewMaxRows]
         , [__mj_CreatedAt]
         , [__mj_UpdatedAt]
      )
      VALUES (
         'ef29d394-6120-4356-baea-a66d36f6580b',
         'MJ_BizApps_Sonar: Score Band Sets',
         'Score Band Sets',
         'A reusable, named set of qualitative score bands (e.g. Healthy / Watch / At-Risk / Critical) that can be shared across scoring models.',
         NULL,
         'ScoreBandSet',
         'vwScoreBandSets',
         '${flyway:defaultSchema}',
         1,
         1,
         0
         , 1
         , 0
         , 0
         , 0
         , 1
         , 1
         , 1
         , 1000
         , GETUTCDATE()
         , GETUTCDATE()
      );

/* SQL generated to add new entity MJ_BizApps_Sonar: Score Band Sets to application ID: '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('4F9477FB-BC8B-4CA9-A4FE-C0FB45496285', 'ef29d394-6120-4356-baea-a66d36f6580b', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Band Sets for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('ef29d394-6120-4356-baea-a66d36f6580b', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Band Sets for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('ef29d394-6120-4356-baea-a66d36f6580b', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Band Sets for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('ef29d394-6120-4356-baea-a66d36f6580b', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to create new entity MJ_BizApps_Sonar: Score Bands */

      INSERT INTO [${mjSchema}].[Entity] (
         [ID],
         [Name],
         [DisplayName],
         [Description],
         [NameSuffix],
         [BaseTable],
         [BaseView],
         [SchemaName],
         [IncludeInAPI],
         [AllowUserSearchAPI],
         [AllowCaching]
         , [TrackRecordChanges]
         , [AuditRecordAccess]
         , [AuditViewRuns]
         , [AllowAllRowsAPI]
         , [AllowCreateAPI]
         , [AllowUpdateAPI]
         , [AllowDeleteAPI]
         , [UserViewMaxRows]
         , [__mj_CreatedAt]
         , [__mj_UpdatedAt]
      )
      VALUES (
         '25aaf1b7-f32b-44be-a815-d9f1d9a71a0a',
         'MJ_BizApps_Sonar: Score Bands',
         'Score Bands',
         'One qualitative band within a band set, defined by a half-open score range with a severity and color for sorting and display.',
         NULL,
         'ScoreBand',
         'vwScoreBands',
         '${flyway:defaultSchema}',
         1,
         1,
         0
         , 1
         , 0
         , 0
         , 0
         , 1
         , 1
         , 1
         , 1000
         , GETUTCDATE()
         , GETUTCDATE()
      );

/* SQL generated to add new entity MJ_BizApps_Sonar: Score Bands to application ID: '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('4F9477FB-BC8B-4CA9-A4FE-C0FB45496285', '25aaf1b7-f32b-44be-a815-d9f1d9a71a0a', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Bands for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('25aaf1b7-f32b-44be-a815-d9f1d9a71a0a', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Bands for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('25aaf1b7-f32b-44be-a815-d9f1d9a71a0a', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Bands for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('25aaf1b7-f32b-44be-a815-d9f1d9a71a0a', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to create new entity MJ_BizApps_Sonar: Time Windows */

      INSERT INTO [${mjSchema}].[Entity] (
         [ID],
         [Name],
         [DisplayName],
         [Description],
         [NameSuffix],
         [BaseTable],
         [BaseView],
         [SchemaName],
         [IncludeInAPI],
         [AllowUserSearchAPI],
         [AllowCaching]
         , [TrackRecordChanges]
         , [AuditRecordAccess]
         , [AuditViewRuns]
         , [AllowAllRowsAPI]
         , [AllowCreateAPI]
         , [AllowUpdateAPI]
         , [AllowDeleteAPI]
         , [UserViewMaxRows]
         , [__mj_CreatedAt]
         , [__mj_UpdatedAt]
      )
      VALUES (
         '77581bab-4f3c-4d59-82b6-a8e04a03cc2c',
         'MJ_BizApps_Sonar: Time Windows',
         'Time Windows',
         'A reusable, first-class time window used when evaluating factors (e.g. trailing 90 days, current term, renewal window -90d).',
         NULL,
         'TimeWindow',
         'vwTimeWindows',
         '${flyway:defaultSchema}',
         1,
         1,
         0
         , 1
         , 0
         , 0
         , 0
         , 1
         , 1
         , 1
         , 1000
         , GETUTCDATE()
         , GETUTCDATE()
      );

/* SQL generated to add new entity MJ_BizApps_Sonar: Time Windows to application ID: '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('4F9477FB-BC8B-4CA9-A4FE-C0FB45496285', '77581bab-4f3c-4d59-82b6-a8e04a03cc2c', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Time Windows for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('77581bab-4f3c-4d59-82b6-a8e04a03cc2c', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Time Windows for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('77581bab-4f3c-4d59-82b6-a8e04a03cc2c', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Time Windows for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('77581bab-4f3c-4d59-82b6-a8e04a03cc2c', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to create new entity MJ_BizApps_Sonar: Score Models */

      INSERT INTO [${mjSchema}].[Entity] (
         [ID],
         [Name],
         [DisplayName],
         [Description],
         [NameSuffix],
         [BaseTable],
         [BaseView],
         [SchemaName],
         [IncludeInAPI],
         [AllowUserSearchAPI],
         [AllowCaching]
         , [TrackRecordChanges]
         , [AuditRecordAccess]
         , [AuditViewRuns]
         , [AllowAllRowsAPI]
         , [AllowCreateAPI]
         , [AllowUpdateAPI]
         , [AllowDeleteAPI]
         , [UserViewMaxRows]
         , [__mj_CreatedAt]
         , [__mj_UpdatedAt]
      )
      VALUES (
         '46b1f5fe-9aec-4511-88fe-8fde062e76ba',
         'MJ_BizApps_Sonar: Score Models',
         'Score Models',
         'The editable definition of one scoring model: anchor entity, scale, combine strategy, recompute policy, and bands. Many models can be active per tenant.',
         NULL,
         'ScoreModel',
         'vwScoreModels',
         '${flyway:defaultSchema}',
         1,
         1,
         0
         , 1
         , 0
         , 0
         , 0
         , 1
         , 1
         , 1
         , 1000
         , GETUTCDATE()
         , GETUTCDATE()
      );

/* SQL generated to add new entity MJ_BizApps_Sonar: Score Models to application ID: '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('4F9477FB-BC8B-4CA9-A4FE-C0FB45496285', '46b1f5fe-9aec-4511-88fe-8fde062e76ba', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Models for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('46b1f5fe-9aec-4511-88fe-8fde062e76ba', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Models for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('46b1f5fe-9aec-4511-88fe-8fde062e76ba', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Models for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('46b1f5fe-9aec-4511-88fe-8fde062e76ba', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to create new entity MJ_BizApps_Sonar: Score Model Versions */

      INSERT INTO [${mjSchema}].[Entity] (
         [ID],
         [Name],
         [DisplayName],
         [Description],
         [NameSuffix],
         [BaseTable],
         [BaseView],
         [SchemaName],
         [IncludeInAPI],
         [AllowUserSearchAPI],
         [AllowCaching]
         , [TrackRecordChanges]
         , [AuditRecordAccess]
         , [AuditViewRuns]
         , [AllowAllRowsAPI]
         , [AllowCreateAPI]
         , [AllowUpdateAPI]
         , [AllowDeleteAPI]
         , [UserViewMaxRows]
         , [__mj_CreatedAt]
         , [__mj_UpdatedAt]
      )
      VALUES (
         'd9590bbc-23df-4571-ab80-dd3c651abc16',
         'MJ_BizApps_Sonar: Score Model Versions',
         'Score Model Versions',
         'An immutable snapshot of a model''s complete configuration at publish time. Every Score and ScoreHistory row references the version that produced it, making scores reproducible and auditable.',
         NULL,
         'ScoreModelVersion',
         'vwScoreModelVersions',
         '${flyway:defaultSchema}',
         1,
         1,
         0
         , 1
         , 0
         , 0
         , 0
         , 1
         , 1
         , 1
         , 1000
         , GETUTCDATE()
         , GETUTCDATE()
      );

/* SQL generated to add new entity MJ_BizApps_Sonar: Score Model Versions to application ID: '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285' */
INSERT INTO [${mjSchema}].[ApplicationEntity]
                                       ([ApplicationID], [EntityID], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                       ('4F9477FB-BC8B-4CA9-A4FE-C0FB45496285', 'd9590bbc-23df-4571-ab80-dd3c651abc16', (SELECT COALESCE(MAX([Sequence]),0)+1 FROM [${mjSchema}].[ApplicationEntity] WHERE [ApplicationID] = '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285'), GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Model Versions for role UI */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('d9590bbc-23df-4571-ab80-dd3c651abc16', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Model Versions for role Developer */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('d9590bbc-23df-4571-ab80-dd3c651abc16', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Score Model Versions for role Integration */
INSERT INTO [${mjSchema}].[EntityPermission]
                                                   ([EntityID], [RoleID], [CanRead], [CanCreate], [CanUpdate], [CanDelete], [__mj_CreatedAt], [__mj_UpdatedAt]) VALUES
                                                   ('d9590bbc-23df-4571-ab80-dd3c651abc16', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, GETUTCDATE(), GETUTCDATE());

/* SQL text to update existing entities from schema */
EXEC [${mjSchema}].[spUpdateExistingEntitiesFromSchema] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema}';

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.Score */
ALTER TABLE [${flyway:defaultSchema}].[Score] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.Score */
UPDATE [${flyway:defaultSchema}].[Score] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.Score */
ALTER TABLE [${flyway:defaultSchema}].[Score] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.Score */
ALTER TABLE [${flyway:defaultSchema}].[Score] ADD CONSTRAINT [DF___mj_BizAppsSonar_Score___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.Score */
ALTER TABLE [${flyway:defaultSchema}].[Score] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.Score */
UPDATE [${flyway:defaultSchema}].[Score] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.Score */
ALTER TABLE [${flyway:defaultSchema}].[Score] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.Score */
ALTER TABLE [${flyway:defaultSchema}].[Score] ADD CONSTRAINT [DF___mj_BizAppsSonar_Score___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ModelRelatedEntity */
ALTER TABLE [${flyway:defaultSchema}].[ModelRelatedEntity] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ModelRelatedEntity */
UPDATE [${flyway:defaultSchema}].[ModelRelatedEntity] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ModelRelatedEntity */
ALTER TABLE [${flyway:defaultSchema}].[ModelRelatedEntity] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ModelRelatedEntity */
ALTER TABLE [${flyway:defaultSchema}].[ModelRelatedEntity] ADD CONSTRAINT [DF___mj_BizAppsSonar_ModelRelatedEntity___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ModelRelatedEntity */
ALTER TABLE [${flyway:defaultSchema}].[ModelRelatedEntity] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ModelRelatedEntity */
UPDATE [${flyway:defaultSchema}].[ModelRelatedEntity] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ModelRelatedEntity */
ALTER TABLE [${flyway:defaultSchema}].[ModelRelatedEntity] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ModelRelatedEntity */
ALTER TABLE [${flyway:defaultSchema}].[ModelRelatedEntity] ADD CONSTRAINT [DF___mj_BizAppsSonar_ModelRelatedEntity___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreHistory */
ALTER TABLE [${flyway:defaultSchema}].[ScoreHistory] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreHistory */
UPDATE [${flyway:defaultSchema}].[ScoreHistory] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreHistory */
ALTER TABLE [${flyway:defaultSchema}].[ScoreHistory] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreHistory */
ALTER TABLE [${flyway:defaultSchema}].[ScoreHistory] ADD CONSTRAINT [DF___mj_BizAppsSonar_ScoreHistory___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreHistory */
ALTER TABLE [${flyway:defaultSchema}].[ScoreHistory] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreHistory */
UPDATE [${flyway:defaultSchema}].[ScoreHistory] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreHistory */
ALTER TABLE [${flyway:defaultSchema}].[ScoreHistory] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreHistory */
ALTER TABLE [${flyway:defaultSchema}].[ScoreHistory] ADD CONSTRAINT [DF___mj_BizAppsSonar_ScoreHistory___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreRecomputeRun */
ALTER TABLE [${flyway:defaultSchema}].[ScoreRecomputeRun] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreRecomputeRun */
UPDATE [${flyway:defaultSchema}].[ScoreRecomputeRun] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreRecomputeRun */
ALTER TABLE [${flyway:defaultSchema}].[ScoreRecomputeRun] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreRecomputeRun */
ALTER TABLE [${flyway:defaultSchema}].[ScoreRecomputeRun] ADD CONSTRAINT [DF___mj_BizAppsSonar_ScoreRecomputeRun___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreRecomputeRun */
ALTER TABLE [${flyway:defaultSchema}].[ScoreRecomputeRun] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreRecomputeRun */
UPDATE [${flyway:defaultSchema}].[ScoreRecomputeRun] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreRecomputeRun */
ALTER TABLE [${flyway:defaultSchema}].[ScoreRecomputeRun] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreRecomputeRun */
ALTER TABLE [${flyway:defaultSchema}].[ScoreRecomputeRun] ADD CONSTRAINT [DF___mj_BizAppsSonar_ScoreRecomputeRun___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreModel */
ALTER TABLE [${flyway:defaultSchema}].[ScoreModel] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreModel */
UPDATE [${flyway:defaultSchema}].[ScoreModel] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreModel */
ALTER TABLE [${flyway:defaultSchema}].[ScoreModel] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreModel */
ALTER TABLE [${flyway:defaultSchema}].[ScoreModel] ADD CONSTRAINT [DF___mj_BizAppsSonar_ScoreModel___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreModel */
ALTER TABLE [${flyway:defaultSchema}].[ScoreModel] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreModel */
UPDATE [${flyway:defaultSchema}].[ScoreModel] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreModel */
ALTER TABLE [${flyway:defaultSchema}].[ScoreModel] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreModel */
ALTER TABLE [${flyway:defaultSchema}].[ScoreModel] ADD CONSTRAINT [DF___mj_BizAppsSonar_ScoreModel___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreBandTransition */
ALTER TABLE [${flyway:defaultSchema}].[ScoreBandTransition] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreBandTransition */
UPDATE [${flyway:defaultSchema}].[ScoreBandTransition] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreBandTransition */
ALTER TABLE [${flyway:defaultSchema}].[ScoreBandTransition] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreBandTransition */
ALTER TABLE [${flyway:defaultSchema}].[ScoreBandTransition] ADD CONSTRAINT [DF___mj_BizAppsSonar_ScoreBandTransition___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreBandTransition */
ALTER TABLE [${flyway:defaultSchema}].[ScoreBandTransition] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreBandTransition */
UPDATE [${flyway:defaultSchema}].[ScoreBandTransition] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreBandTransition */
ALTER TABLE [${flyway:defaultSchema}].[ScoreBandTransition] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreBandTransition */
ALTER TABLE [${flyway:defaultSchema}].[ScoreBandTransition] ADD CONSTRAINT [DF___mj_BizAppsSonar_ScoreBandTransition___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreBandSet */
ALTER TABLE [${flyway:defaultSchema}].[ScoreBandSet] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreBandSet */
UPDATE [${flyway:defaultSchema}].[ScoreBandSet] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreBandSet */
ALTER TABLE [${flyway:defaultSchema}].[ScoreBandSet] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreBandSet */
ALTER TABLE [${flyway:defaultSchema}].[ScoreBandSet] ADD CONSTRAINT [DF___mj_BizAppsSonar_ScoreBandSet___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreBandSet */
ALTER TABLE [${flyway:defaultSchema}].[ScoreBandSet] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreBandSet */
UPDATE [${flyway:defaultSchema}].[ScoreBandSet] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreBandSet */
ALTER TABLE [${flyway:defaultSchema}].[ScoreBandSet] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreBandSet */
ALTER TABLE [${flyway:defaultSchema}].[ScoreBandSet] ADD CONSTRAINT [DF___mj_BizAppsSonar_ScoreBandSet___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.TimeWindow */
ALTER TABLE [${flyway:defaultSchema}].[TimeWindow] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.TimeWindow */
UPDATE [${flyway:defaultSchema}].[TimeWindow] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.TimeWindow */
ALTER TABLE [${flyway:defaultSchema}].[TimeWindow] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.TimeWindow */
ALTER TABLE [${flyway:defaultSchema}].[TimeWindow] ADD CONSTRAINT [DF___mj_BizAppsSonar_TimeWindow___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.TimeWindow */
ALTER TABLE [${flyway:defaultSchema}].[TimeWindow] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.TimeWindow */
UPDATE [${flyway:defaultSchema}].[TimeWindow] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.TimeWindow */
ALTER TABLE [${flyway:defaultSchema}].[TimeWindow] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.TimeWindow */
ALTER TABLE [${flyway:defaultSchema}].[TimeWindow] ADD CONSTRAINT [DF___mj_BizAppsSonar_TimeWindow___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreFactorContribution */
ALTER TABLE [${flyway:defaultSchema}].[ScoreFactorContribution] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreFactorContribution */
UPDATE [${flyway:defaultSchema}].[ScoreFactorContribution] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreFactorContribution */
ALTER TABLE [${flyway:defaultSchema}].[ScoreFactorContribution] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreFactorContribution */
ALTER TABLE [${flyway:defaultSchema}].[ScoreFactorContribution] ADD CONSTRAINT [DF___mj_BizAppsSonar_ScoreFactorContribution___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreFactorContribution */
ALTER TABLE [${flyway:defaultSchema}].[ScoreFactorContribution] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreFactorContribution */
UPDATE [${flyway:defaultSchema}].[ScoreFactorContribution] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreFactorContribution */
ALTER TABLE [${flyway:defaultSchema}].[ScoreFactorContribution] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreFactorContribution */
ALTER TABLE [${flyway:defaultSchema}].[ScoreFactorContribution] ADD CONSTRAINT [DF___mj_BizAppsSonar_ScoreFactorContribution___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ModelFactor */
ALTER TABLE [${flyway:defaultSchema}].[ModelFactor] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ModelFactor */
UPDATE [${flyway:defaultSchema}].[ModelFactor] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ModelFactor */
ALTER TABLE [${flyway:defaultSchema}].[ModelFactor] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ModelFactor */
ALTER TABLE [${flyway:defaultSchema}].[ModelFactor] ADD CONSTRAINT [DF___mj_BizAppsSonar_ModelFactor___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ModelFactor */
ALTER TABLE [${flyway:defaultSchema}].[ModelFactor] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ModelFactor */
UPDATE [${flyway:defaultSchema}].[ModelFactor] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ModelFactor */
ALTER TABLE [${flyway:defaultSchema}].[ModelFactor] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ModelFactor */
ALTER TABLE [${flyway:defaultSchema}].[ModelFactor] ADD CONSTRAINT [DF___mj_BizAppsSonar_ModelFactor___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreModelAuditEvent */
ALTER TABLE [${flyway:defaultSchema}].[ScoreModelAuditEvent] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreModelAuditEvent */
UPDATE [${flyway:defaultSchema}].[ScoreModelAuditEvent] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreModelAuditEvent */
ALTER TABLE [${flyway:defaultSchema}].[ScoreModelAuditEvent] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreModelAuditEvent */
ALTER TABLE [${flyway:defaultSchema}].[ScoreModelAuditEvent] ADD CONSTRAINT [DF___mj_BizAppsSonar_ScoreModelAuditEvent___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreModelAuditEvent */
ALTER TABLE [${flyway:defaultSchema}].[ScoreModelAuditEvent] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreModelAuditEvent */
UPDATE [${flyway:defaultSchema}].[ScoreModelAuditEvent] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreModelAuditEvent */
ALTER TABLE [${flyway:defaultSchema}].[ScoreModelAuditEvent] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreModelAuditEvent */
ALTER TABLE [${flyway:defaultSchema}].[ScoreModelAuditEvent] ADD CONSTRAINT [DF___mj_BizAppsSonar_ScoreModelAuditEvent___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreBand */
ALTER TABLE [${flyway:defaultSchema}].[ScoreBand] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreBand */
UPDATE [${flyway:defaultSchema}].[ScoreBand] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreBand */
ALTER TABLE [${flyway:defaultSchema}].[ScoreBand] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreBand */
ALTER TABLE [${flyway:defaultSchema}].[ScoreBand] ADD CONSTRAINT [DF___mj_BizAppsSonar_ScoreBand___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreBand */
ALTER TABLE [${flyway:defaultSchema}].[ScoreBand] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreBand */
UPDATE [${flyway:defaultSchema}].[ScoreBand] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreBand */
ALTER TABLE [${flyway:defaultSchema}].[ScoreBand] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreBand */
ALTER TABLE [${flyway:defaultSchema}].[ScoreBand] ADD CONSTRAINT [DF___mj_BizAppsSonar_ScoreBand___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreModelVersion */
ALTER TABLE [${flyway:defaultSchema}].[ScoreModelVersion] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreModelVersion */
UPDATE [${flyway:defaultSchema}].[ScoreModelVersion] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreModelVersion */
ALTER TABLE [${flyway:defaultSchema}].[ScoreModelVersion] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.ScoreModelVersion */
ALTER TABLE [${flyway:defaultSchema}].[ScoreModelVersion] ADD CONSTRAINT [DF___mj_BizAppsSonar_ScoreModelVersion___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreModelVersion */
ALTER TABLE [${flyway:defaultSchema}].[ScoreModelVersion] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreModelVersion */
UPDATE [${flyway:defaultSchema}].[ScoreModelVersion] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreModelVersion */
ALTER TABLE [${flyway:defaultSchema}].[ScoreModelVersion] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.ScoreModelVersion */
ALTER TABLE [${flyway:defaultSchema}].[ScoreModelVersion] ADD CONSTRAINT [DF___mj_BizAppsSonar_ScoreModelVersion___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.Factor */
ALTER TABLE [${flyway:defaultSchema}].[Factor] ADD [__mj_CreatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.Factor */
UPDATE [${flyway:defaultSchema}].[Factor] SET [__mj_CreatedAt] = GETUTCDATE() WHERE [__mj_CreatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.Factor */
ALTER TABLE [${flyway:defaultSchema}].[Factor] ALTER COLUMN [__mj_CreatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_CreatedAt to entity ${flyway:defaultSchema}.Factor */
ALTER TABLE [${flyway:defaultSchema}].[Factor] ADD CONSTRAINT [DF___mj_BizAppsSonar_Factor___mj_CreatedAt] DEFAULT GETUTCDATE() FOR [__mj_CreatedAt];
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.Factor */
ALTER TABLE [${flyway:defaultSchema}].[Factor] ADD [__mj_UpdatedAt] DATETIMEOFFSET NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.Factor */
UPDATE [${flyway:defaultSchema}].[Factor] SET [__mj_UpdatedAt] = GETUTCDATE() WHERE [__mj_UpdatedAt] IS NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.Factor */
ALTER TABLE [${flyway:defaultSchema}].[Factor] ALTER COLUMN [__mj_UpdatedAt] DATETIMEOFFSET NOT NULL;
GO

/* SQL text to add special date field __mj_UpdatedAt to entity ${flyway:defaultSchema}.Factor */
ALTER TABLE [${flyway:defaultSchema}].[Factor] ADD CONSTRAINT [DF___mj_BizAppsSonar_Factor___mj_UpdatedAt] DEFAULT GETUTCDATE() FOR [__mj_UpdatedAt];
GO

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'df2f7b3b-2140-44a6-a0ae-6bdc715cf5be' OR (EntityID = '32F2A760-5BFC-4AF6-BB18-11EF10DD254C' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'df2f7b3b-2140-44a6-a0ae-6bdc715cf5be',
            '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', -- Entity: MJ_BizApps_Sonar: Scores
            100001,
            'ID',
            'ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            'newsequentialid()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            1,
            0,
            0,
            1,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6439b064-b2c5-48a7-8989-5f37584354f5' OR (EntityID = '32F2A760-5BFC-4AF6-BB18-11EF10DD254C' AND Name = 'ScoreModelID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '6439b064-b2c5-48a7-8989-5f37584354f5',
            '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', -- Entity: MJ_BizApps_Sonar: Scores
            100002,
            'ScoreModelID',
            'Score Model ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA',
            'ID',
            0,
            0,
            1,
            0,
            0,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'c5653c0b-9be9-4652-bcd2-193d93045217' OR (EntityID = '32F2A760-5BFC-4AF6-BB18-11EF10DD254C' AND Name = 'ScoreModelVersionID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'c5653c0b-9be9-4652-bcd2-193d93045217',
            '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', -- Entity: MJ_BizApps_Sonar: Scores
            100003,
            'ScoreModelVersionID',
            'Score Model Version ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            'D9590BBC-23DF-4571-AB80-DD3C651ABC16',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b5b36175-241d-43c0-8fa7-c8720ebcdf3d' OR (EntityID = '32F2A760-5BFC-4AF6-BB18-11EF10DD254C' AND Name = 'AnchorEntityID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'b5b36175-241d-43c0-8fa7-c8720ebcdf3d',
            '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', -- Entity: MJ_BizApps_Sonar: Scores
            100004,
            'AnchorEntityID',
            'Anchor Entity ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            'E0238F34-2837-EF11-86D4-6045BDEE16E6',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '1317ea27-7bea-4383-a80f-0564dd2b72cc' OR (EntityID = '32F2A760-5BFC-4AF6-BB18-11EF10DD254C' AND Name = 'AnchorRecordID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '1317ea27-7bea-4383-a80f-0564dd2b72cc',
            '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', -- Entity: MJ_BizApps_Sonar: Scores
            100005,
            'AnchorRecordID',
            'Anchor Record ID',
            'Primary-key value of the scored anchor record, stored as a string to stay entity-agnostic.',
            'nvarchar',
            200,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '4c8c5e3e-6083-4043-bfdf-ed14537aefc1' OR (EntityID = '32F2A760-5BFC-4AF6-BB18-11EF10DD254C' AND Name = 'AnchorRecordKeyJSON')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '4c8c5e3e-6083-4043-bfdf-ed14537aefc1',
            '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', -- Entity: MJ_BizApps_Sonar: Scores
            100006,
            'AnchorRecordKeyJSON',
            'Anchor Record Key JSON',
            'Optional JSON representation of a composite anchor key.',
            'nvarchar',
            -1,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '054ae38a-6c09-4376-beaf-c3555464dae5' OR (EntityID = '32F2A760-5BFC-4AF6-BB18-11EF10DD254C' AND Name = 'RawScore')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '054ae38a-6c09-4376-beaf-c3555464dae5',
            '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', -- Entity: MJ_BizApps_Sonar: Scores
            100007,
            'RawScore',
            'Raw Score',
            'Pre-scale combined value before mapping to the output scale.',
            'decimal',
            9,
            12,
            4,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '11ff073e-3f8e-47c9-b4a3-f87cf303621e' OR (EntityID = '32F2A760-5BFC-4AF6-BB18-11EF10DD254C' AND Name = 'NormalizedScore')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '11ff073e-3f8e-47c9-b4a3-f87cf303621e',
            '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', -- Entity: MJ_BizApps_Sonar: Scores
            100008,
            'NormalizedScore',
            'Normalized Score',
            'The headline score on the model''s output scale (e.g. 0-100).',
            'decimal',
            5,
            9,
            4,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '44cc4f1f-3202-4928-a036-c95d79a368bc' OR (EntityID = '32F2A760-5BFC-4AF6-BB18-11EF10DD254C' AND Name = 'BandID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '44cc4f1f-3202-4928-a036-c95d79a368bc',
            '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', -- Entity: MJ_BizApps_Sonar: Scores
            100009,
            'BandID',
            'Band ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '68e2a450-2ab8-4241-9520-231c9c9860d2' OR (EntityID = '32F2A760-5BFC-4AF6-BB18-11EF10DD254C' AND Name = 'PreviousNormalizedScore')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '68e2a450-2ab8-4241-9520-231c9c9860d2',
            '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', -- Entity: MJ_BizApps_Sonar: Scores
            100010,
            'PreviousNormalizedScore',
            'Previous Normalized Score',
            'The normalized score from the previous computation, for delta/trend.',
            'decimal',
            5,
            9,
            4,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'cb2e9693-123e-4e18-9ebe-07c81f375814' OR (EntityID = '32F2A760-5BFC-4AF6-BB18-11EF10DD254C' AND Name = 'PreviousBandID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'cb2e9693-123e-4e18-9ebe-07c81f375814',
            '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', -- Entity: MJ_BizApps_Sonar: Scores
            100011,
            'PreviousBandID',
            'Previous Band ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '1651f1e6-54d3-408d-a78c-de572a2ddf59' OR (EntityID = '32F2A760-5BFC-4AF6-BB18-11EF10DD254C' AND Name = 'Delta')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '1651f1e6-54d3-408d-a78c-de572a2ddf59',
            '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', -- Entity: MJ_BizApps_Sonar: Scores
            100012,
            'Delta',
            'Delta',
            'Change in normalized score versus the previous value over the trend window.',
            'decimal',
            5,
            9,
            4,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '666ebac5-0ccd-4738-8100-ce8300cf26fe' OR (EntityID = '32F2A760-5BFC-4AF6-BB18-11EF10DD254C' AND Name = 'TrendDirection')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '666ebac5-0ccd-4738-8100-ce8300cf26fe',
            '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', -- Entity: MJ_BizApps_Sonar: Scores
            100013,
            'TrendDirection',
            'Trend Direction',
            'Direction of recent movement: Up, Down, or Flat.',
            'nvarchar',
            16,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'c7897777-7eb4-4cbf-932d-d980a2fe24d4' OR (EntityID = '32F2A760-5BFC-4AF6-BB18-11EF10DD254C' AND Name = 'TrendSlope')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'c7897777-7eb4-4cbf-932d-d980a2fe24d4',
            '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', -- Entity: MJ_BizApps_Sonar: Scores
            100014,
            'TrendSlope',
            'Trend Slope',
            'Regression slope of the score over recent history.',
            'decimal',
            9,
            12,
            6,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3e261499-cc8e-449f-9e65-c70dff998ea7' OR (EntityID = '32F2A760-5BFC-4AF6-BB18-11EF10DD254C' AND Name = 'Confidence')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3e261499-cc8e-449f-9e65-c70dff998ea7',
            '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', -- Entity: MJ_BizApps_Sonar: Scores
            100015,
            'Confidence',
            'Confidence',
            'Confidence in the score (0-1), derived from data completeness.',
            'decimal',
            5,
            5,
            4,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '91c3c118-c9ba-4abf-89e4-610b4e12e7d1' OR (EntityID = '32F2A760-5BFC-4AF6-BB18-11EF10DD254C' AND Name = 'DataCompleteness')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '91c3c118-c9ba-4abf-89e4-610b4e12e7d1',
            '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', -- Entity: MJ_BizApps_Sonar: Scores
            100016,
            'DataCompleteness',
            'Data Completeness',
            'Fraction of factors that had data when the score was computed (0-1).',
            'decimal',
            5,
            5,
            4,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '1548b2ec-2a98-472d-95f0-9d1764514efe' OR (EntityID = '32F2A760-5BFC-4AF6-BB18-11EF10DD254C' AND Name = 'ComputedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '1548b2ec-2a98-472d-95f0-9d1764514efe',
            '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', -- Entity: MJ_BizApps_Sonar: Scores
            100017,
            'ComputedAt',
            'Computed At',
            'UTC timestamp at which this score was computed.',
            'datetime2',
            8,
            27,
            7,
            0,
            'getutcdate()',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ebd0db43-a59c-49bf-abdb-06f08ef1a6b5' OR (EntityID = '32F2A760-5BFC-4AF6-BB18-11EF10DD254C' AND Name = 'AsOfDate')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ebd0db43-a59c-49bf-abdb-06f08ef1a6b5',
            '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', -- Entity: MJ_BizApps_Sonar: Scores
            100018,
            'AsOfDate',
            'As Of Date',
            'The "now" the time windows resolved against for this score.',
            'datetime2',
            8,
            27,
            7,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '97579e1e-1d1a-4697-acd6-5618da3646e9' OR (EntityID = '32F2A760-5BFC-4AF6-BB18-11EF10DD254C' AND Name = 'NextRecomputeAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '97579e1e-1d1a-4697-acd6-5618da3646e9',
            '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', -- Entity: MJ_BizApps_Sonar: Scores
            100019,
            'NextRecomputeAt',
            'Next Recompute At',
            'Optional scheduled time for the next recompute of this score.',
            'datetime2',
            8,
            27,
            7,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6af23b1b-faf1-4875-bb19-86404ec5871f' OR (EntityID = '32F2A760-5BFC-4AF6-BB18-11EF10DD254C' AND Name = 'IsStale')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '6af23b1b-faf1-4875-bb19-86404ec5871f',
            '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', -- Entity: MJ_BizApps_Sonar: Scores
            100020,
            'IsStale',
            'Is Stale',
            'Indicates population statistics moved but this record has not yet been recomputed.',
            'bit',
            1,
            1,
            0,
            0,
            '(0)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '1ad1bc59-7694-4943-8a93-eabca0b80763' OR (EntityID = '32F2A760-5BFC-4AF6-BB18-11EF10DD254C' AND Name = 'ExplanationSummary')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '1ad1bc59-7694-4943-8a93-eabca0b80763',
            '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', -- Entity: MJ_BizApps_Sonar: Scores
            100021,
            'ExplanationSummary',
            'Explanation Summary',
            'Cached natural-language explanation of the score, refreshed on material change.',
            'nvarchar',
            -1,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '4bbfdbe7-f3e7-4eb7-be1d-ebb753eb5b92' OR (EntityID = '32F2A760-5BFC-4AF6-BB18-11EF10DD254C' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '4bbfdbe7-f3e7-4eb7-be1d-ebb753eb5b92',
            '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', -- Entity: MJ_BizApps_Sonar: Scores
            100022,
            '__mj_CreatedAt',
            'Created At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2a1b58fe-578f-4600-b925-27b743b8f407' OR (EntityID = '32F2A760-5BFC-4AF6-BB18-11EF10DD254C' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '2a1b58fe-578f-4600-b925-27b743b8f407',
            '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', -- Entity: MJ_BizApps_Sonar: Scores
            100023,
            '__mj_UpdatedAt',
            'Updated At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd7ff6fd9-2f59-48bf-94bd-69ac930a73ec' OR (EntityID = '710B4C24-C185-4693-B958-2525655E3D20' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'd7ff6fd9-2f59-48bf-94bd-69ac930a73ec',
            '710B4C24-C185-4693-B958-2525655E3D20', -- Entity: MJ_BizApps_Sonar: Model Related Entities
            100001,
            'ID',
            'ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            'newsequentialid()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            1,
            0,
            0,
            1,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'fc346460-3867-4abe-ba2a-f3b33798acbe' OR (EntityID = '710B4C24-C185-4693-B958-2525655E3D20' AND Name = 'ScoreModelID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'fc346460-3867-4abe-ba2a-f3b33798acbe',
            '710B4C24-C185-4693-B958-2525655E3D20', -- Entity: MJ_BizApps_Sonar: Model Related Entities
            100002,
            'ScoreModelID',
            'Score Model ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA',
            'ID',
            0,
            0,
            1,
            0,
            0,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6d548153-c2d2-4c8c-8c35-640f8f64c1a1' OR (EntityID = '710B4C24-C185-4693-B958-2525655E3D20' AND Name = 'RelatedEntityID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '6d548153-c2d2-4c8c-8c35-640f8f64c1a1',
            '710B4C24-C185-4693-B958-2525655E3D20', -- Entity: MJ_BizApps_Sonar: Model Related Entities
            100003,
            'RelatedEntityID',
            'Related Entity ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            'E0238F34-2837-EF11-86D4-6045BDEE16E6',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '100b00e4-b0a4-44dc-8f60-42a9e57404ab' OR (EntityID = '710B4C24-C185-4693-B958-2525655E3D20' AND Name = 'Alias')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '100b00e4-b0a4-44dc-8f60-42a9e57404ab',
            '710B4C24-C185-4693-B958-2525655E3D20', -- Entity: MJ_BizApps_Sonar: Model Related Entities
            100004,
            'Alias',
            'Alias',
            'Handle used by factors to reference this related entity, e.g. crm_activity, invoices, lms_completions.',
            'nvarchar',
            200,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '14a1e6e2-0507-4c52-aa80-6a91d8ea264c' OR (EntityID = '710B4C24-C185-4693-B958-2525655E3D20' AND Name = 'RelationshipPath')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '14a1e6e2-0507-4c52-aa80-6a91d8ea264c',
            '710B4C24-C185-4693-B958-2525655E3D20', -- Entity: MJ_BizApps_Sonar: Model Related Entities
            100005,
            'RelationshipPath',
            'Relationship Path',
            'JSON describing the join path from the anchor to the related entity (direct FK or multi-hop), resolved against MJ relationship metadata.',
            'nvarchar',
            -1,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2a109a1c-692a-4320-b9fd-e5e3de67c4d6' OR (EntityID = '710B4C24-C185-4693-B958-2525655E3D20' AND Name = 'JoinType')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '2a109a1c-692a-4320-b9fd-e5e3de67c4d6',
            '710B4C24-C185-4693-B958-2525655E3D20', -- Entity: MJ_BizApps_Sonar: Model Related Entities
            100006,
            'JoinType',
            'Join Type',
            'Join type from anchor to related entity: Inner or Left (usually Left so absence of related data is itself scorable).',
            'nvarchar',
            20,
            0,
            0,
            0,
            'Left',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '16136b26-666d-439f-a1c9-0694c6cc4b54' OR (EntityID = '710B4C24-C185-4693-B958-2525655E3D20' AND Name = 'SourceSystemTag')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '16136b26-666d-439f-a1c9-0694c6cc4b54',
            '710B4C24-C185-4693-B958-2525655E3D20', -- Entity: MJ_BizApps_Sonar: Model Related Entities
            100007,
            'SourceSystemTag',
            'Source System Tag',
            'Informational provenance tag for the source system (e.g. Salesforce, Finance, LMS, Community, Email).',
            'nvarchar',
            120,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '4461e8f4-81b3-4d41-b2ef-ced85b5df36d' OR (EntityID = '710B4C24-C185-4693-B958-2525655E3D20' AND Name = 'Description')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '4461e8f4-81b3-4d41-b2ef-ced85b5df36d',
            '710B4C24-C185-4693-B958-2525655E3D20', -- Entity: MJ_BizApps_Sonar: Model Related Entities
            100008,
            'Description',
            'Description',
            'Optional description of the related-entity mapping.',
            'nvarchar',
            -1,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b0a58b9d-5a3c-488b-b18e-9cd12b3cbac2' OR (EntityID = '710B4C24-C185-4693-B958-2525655E3D20' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'b0a58b9d-5a3c-488b-b18e-9cd12b3cbac2',
            '710B4C24-C185-4693-B958-2525655E3D20', -- Entity: MJ_BizApps_Sonar: Model Related Entities
            100009,
            '__mj_CreatedAt',
            'Created At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '9f2739c1-3274-4c09-8ea2-88313da0b7b1' OR (EntityID = '710B4C24-C185-4693-B958-2525655E3D20' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '9f2739c1-3274-4c09-8ea2-88313da0b7b1',
            '710B4C24-C185-4693-B958-2525655E3D20', -- Entity: MJ_BizApps_Sonar: Model Related Entities
            100010,
            '__mj_UpdatedAt',
            'Updated At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '00b41ffb-77bf-40a4-87dd-ba5174fe491b' OR (EntityID = '1F1CBA7E-F548-420E-9B71-30891E454C42' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '00b41ffb-77bf-40a4-87dd-ba5174fe491b',
            '1F1CBA7E-F548-420E-9B71-30891E454C42', -- Entity: MJ_BizApps_Sonar: Score Histories
            100001,
            'ID',
            'ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            'newsequentialid()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            1,
            0,
            0,
            1,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a70cbc88-15e2-49eb-b05e-5169fc0546b1' OR (EntityID = '1F1CBA7E-F548-420E-9B71-30891E454C42' AND Name = 'ScoreModelID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'a70cbc88-15e2-49eb-b05e-5169fc0546b1',
            '1F1CBA7E-F548-420E-9B71-30891E454C42', -- Entity: MJ_BizApps_Sonar: Score Histories
            100002,
            'ScoreModelID',
            'Score Model ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '68e9aa39-fe85-4cd4-8a7c-7ee5b22914d5' OR (EntityID = '1F1CBA7E-F548-420E-9B71-30891E454C42' AND Name = 'ScoreModelVersionID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '68e9aa39-fe85-4cd4-8a7c-7ee5b22914d5',
            '1F1CBA7E-F548-420E-9B71-30891E454C42', -- Entity: MJ_BizApps_Sonar: Score Histories
            100003,
            'ScoreModelVersionID',
            'Score Model Version ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            'D9590BBC-23DF-4571-AB80-DD3C651ABC16',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '13af8ad0-d49e-439d-a30b-8eac8521c498' OR (EntityID = '1F1CBA7E-F548-420E-9B71-30891E454C42' AND Name = 'AnchorEntityID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '13af8ad0-d49e-439d-a30b-8eac8521c498',
            '1F1CBA7E-F548-420E-9B71-30891E454C42', -- Entity: MJ_BizApps_Sonar: Score Histories
            100004,
            'AnchorEntityID',
            'Anchor Entity ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            'E0238F34-2837-EF11-86D4-6045BDEE16E6',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8ef187d5-2c16-4785-b9ac-0fd3a93dacce' OR (EntityID = '1F1CBA7E-F548-420E-9B71-30891E454C42' AND Name = 'AnchorRecordID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '8ef187d5-2c16-4785-b9ac-0fd3a93dacce',
            '1F1CBA7E-F548-420E-9B71-30891E454C42', -- Entity: MJ_BizApps_Sonar: Score Histories
            100005,
            'AnchorRecordID',
            'Anchor Record ID',
            'Primary-key value of the scored anchor record, stored as a string to stay entity-agnostic.',
            'nvarchar',
            200,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3ac248d2-3cfe-44a6-a6bf-b3c1f8c594ec' OR (EntityID = '1F1CBA7E-F548-420E-9B71-30891E454C42' AND Name = 'NormalizedScore')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3ac248d2-3cfe-44a6-a6bf-b3c1f8c594ec',
            '1F1CBA7E-F548-420E-9B71-30891E454C42', -- Entity: MJ_BizApps_Sonar: Score Histories
            100006,
            'NormalizedScore',
            'Normalized Score',
            'The headline normalized score at this point in time.',
            'decimal',
            5,
            9,
            4,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd68875f1-a3b6-4d3b-affa-ff716dea609c' OR (EntityID = '1F1CBA7E-F548-420E-9B71-30891E454C42' AND Name = 'BandID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'd68875f1-a3b6-4d3b-affa-ff716dea609c',
            '1F1CBA7E-F548-420E-9B71-30891E454C42', -- Entity: MJ_BizApps_Sonar: Score Histories
            100007,
            'BandID',
            'Band ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '159b57d6-0137-482d-843d-3c2a9145e291' OR (EntityID = '1F1CBA7E-F548-420E-9B71-30891E454C42' AND Name = 'AsOfDate')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '159b57d6-0137-482d-843d-3c2a9145e291',
            '1F1CBA7E-F548-420E-9B71-30891E454C42', -- Entity: MJ_BizApps_Sonar: Score Histories
            100008,
            'AsOfDate',
            'As Of Date',
            'The "now" the time windows resolved against for this snapshot.',
            'datetime2',
            8,
            27,
            7,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'dfdcca63-53f6-47fc-8c6c-c931b21a8475' OR (EntityID = '1F1CBA7E-F548-420E-9B71-30891E454C42' AND Name = 'ComputedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'dfdcca63-53f6-47fc-8c6c-c931b21a8475',
            '1F1CBA7E-F548-420E-9B71-30891E454C42', -- Entity: MJ_BizApps_Sonar: Score Histories
            100009,
            'ComputedAt',
            'Computed At',
            'UTC timestamp at which this snapshot was computed.',
            'datetime2',
            8,
            27,
            7,
            0,
            'getutcdate()',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '03951822-0d93-43a4-9db7-59c090e945ec' OR (EntityID = '1F1CBA7E-F548-420E-9B71-30891E454C42' AND Name = 'DataCompleteness')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '03951822-0d93-43a4-9db7-59c090e945ec',
            '1F1CBA7E-F548-420E-9B71-30891E454C42', -- Entity: MJ_BizApps_Sonar: Score Histories
            100010,
            'DataCompleteness',
            'Data Completeness',
            'Fraction of factors that had data at this point in time (0-1).',
            'decimal',
            5,
            5,
            4,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b4c3fd77-8831-4f17-825d-2f94f27e42d0' OR (EntityID = '1F1CBA7E-F548-420E-9B71-30891E454C42' AND Name = 'Confidence')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'b4c3fd77-8831-4f17-825d-2f94f27e42d0',
            '1F1CBA7E-F548-420E-9B71-30891E454C42', -- Entity: MJ_BizApps_Sonar: Score Histories
            100011,
            'Confidence',
            'Confidence',
            'Confidence in the score at this point in time (0-1).',
            'decimal',
            5,
            5,
            4,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a17c5cdc-a7a4-406d-9032-8b679d5c85a7' OR (EntityID = '1F1CBA7E-F548-420E-9B71-30891E454C42' AND Name = 'ContributionsJSON')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'a17c5cdc-a7a4-406d-9032-8b679d5c85a7',
            '1F1CBA7E-F548-420E-9B71-30891E454C42', -- Entity: MJ_BizApps_Sonar: Score Histories
            100012,
            'ContributionsJSON',
            'Contributions JSON',
            'Compact per-factor snapshot (JSON) for point-in-time explainability without exploding row counts.',
            'nvarchar',
            -1,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a7a31155-36c0-4348-8b86-13b943cb86b3' OR (EntityID = '1F1CBA7E-F548-420E-9B71-30891E454C42' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'a7a31155-36c0-4348-8b86-13b943cb86b3',
            '1F1CBA7E-F548-420E-9B71-30891E454C42', -- Entity: MJ_BizApps_Sonar: Score Histories
            100013,
            '__mj_CreatedAt',
            'Created At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '0bfaa997-86ad-42b5-aaec-03cf227b185f' OR (EntityID = '1F1CBA7E-F548-420E-9B71-30891E454C42' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '0bfaa997-86ad-42b5-aaec-03cf227b185f',
            '1F1CBA7E-F548-420E-9B71-30891E454C42', -- Entity: MJ_BizApps_Sonar: Score Histories
            100014,
            '__mj_UpdatedAt',
            'Updated At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '25a2045a-66e6-44a6-806d-694ce007db25' OR (EntityID = 'E9029A00-C998-4B76-B347-70F935E9797D' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '25a2045a-66e6-44a6-806d-694ce007db25',
            'E9029A00-C998-4B76-B347-70F935E9797D', -- Entity: MJ_BizApps_Sonar: Score Recompute Runs
            100001,
            'ID',
            'ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            'newsequentialid()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            1,
            0,
            0,
            1,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '05646884-8cfd-45b9-9d70-477346d54e93' OR (EntityID = 'E9029A00-C998-4B76-B347-70F935E9797D' AND Name = 'ScoreModelID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '05646884-8cfd-45b9-9d70-477346d54e93',
            'E9029A00-C998-4B76-B347-70F935E9797D', -- Entity: MJ_BizApps_Sonar: Score Recompute Runs
            100002,
            'ScoreModelID',
            'Score Model ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '9ee7bc25-1a3c-465b-aae7-60dc85ff66b1' OR (EntityID = 'E9029A00-C998-4B76-B347-70F935E9797D' AND Name = 'ScoreModelVersionID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '9ee7bc25-1a3c-465b-aae7-60dc85ff66b1',
            'E9029A00-C998-4B76-B347-70F935E9797D', -- Entity: MJ_BizApps_Sonar: Score Recompute Runs
            100003,
            'ScoreModelVersionID',
            'Score Model Version ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            'D9590BBC-23DF-4571-AB80-DD3C651ABC16',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3427cd85-8f18-41bf-9251-a1d872752ca7' OR (EntityID = 'E9029A00-C998-4B76-B347-70F935E9797D' AND Name = 'TriggerType')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3427cd85-8f18-41bf-9251-a1d872752ca7',
            'E9029A00-C998-4B76-B347-70F935E9797D', -- Entity: MJ_BizApps_Sonar: Score Recompute Runs
            100004,
            'TriggerType',
            'Trigger Type',
            'What triggered the run: Scheduled, Event, Manual, or Backfill.',
            'nvarchar',
            32,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f42c3bb0-336c-4a3e-b4d2-a4be8c5ed930' OR (EntityID = 'E9029A00-C998-4B76-B347-70F935E9797D' AND Name = 'Scope')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'f42c3bb0-336c-4a3e-b4d2-a4be8c5ed930',
            'E9029A00-C998-4B76-B347-70F935E9797D', -- Entity: MJ_BizApps_Sonar: Score Recompute Runs
            100005,
            'Scope',
            'Scope',
            'Scope of the run: FullPopulation, Incremental, or SingleRecord.',
            'nvarchar',
            32,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'c8ac3224-91b9-4ba4-9123-54d88064f805' OR (EntityID = 'E9029A00-C998-4B76-B347-70F935E9797D' AND Name = 'StartedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'c8ac3224-91b9-4ba4-9123-54d88064f805',
            'E9029A00-C998-4B76-B347-70F935E9797D', -- Entity: MJ_BizApps_Sonar: Score Recompute Runs
            100006,
            'StartedAt',
            'Started At',
            'UTC timestamp when the run started.',
            'datetime2',
            8,
            27,
            7,
            0,
            'getutcdate()',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3a7d5b4e-9b94-489f-b3d0-e8d5fc08cd52' OR (EntityID = 'E9029A00-C998-4B76-B347-70F935E9797D' AND Name = 'CompletedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3a7d5b4e-9b94-489f-b3d0-e8d5fc08cd52',
            'E9029A00-C998-4B76-B347-70F935E9797D', -- Entity: MJ_BizApps_Sonar: Score Recompute Runs
            100007,
            'CompletedAt',
            'Completed At',
            'UTC timestamp when the run completed.',
            'datetime2',
            8,
            27,
            7,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '52a2b243-d228-4745-8c1a-9edeef3feef7' OR (EntityID = 'E9029A00-C998-4B76-B347-70F935E9797D' AND Name = 'Status')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '52a2b243-d228-4745-8c1a-9edeef3feef7',
            'E9029A00-C998-4B76-B347-70F935E9797D', -- Entity: MJ_BizApps_Sonar: Score Recompute Runs
            100008,
            'Status',
            'Status',
            'Run status: Running, Succeeded, Failed, or PartialSuccess.',
            'nvarchar',
            32,
            0,
            0,
            0,
            'Running',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a9c0b6b8-5afc-4d92-acf4-aef9e637b62b' OR (EntityID = 'E9029A00-C998-4B76-B347-70F935E9797D' AND Name = 'RecordsScored')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'a9c0b6b8-5afc-4d92-acf4-aef9e637b62b',
            'E9029A00-C998-4B76-B347-70F935E9797D', -- Entity: MJ_BizApps_Sonar: Score Recompute Runs
            100009,
            'RecordsScored',
            'Records Scored',
            'Number of records scored in the run.',
            'int',
            4,
            10,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '266c600d-5543-4482-b523-2c65abf32c41' OR (EntityID = 'E9029A00-C998-4B76-B347-70F935E9797D' AND Name = 'RecordsChanged')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '266c600d-5543-4482-b523-2c65abf32c41',
            'E9029A00-C998-4B76-B347-70F935E9797D', -- Entity: MJ_BizApps_Sonar: Score Recompute Runs
            100010,
            'RecordsChanged',
            'Records Changed',
            'Number of records whose score changed in the run.',
            'int',
            4,
            10,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6e41099c-1ee2-425b-9ae1-6c386b9a2908' OR (EntityID = 'E9029A00-C998-4B76-B347-70F935E9797D' AND Name = 'BandTransitions')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '6e41099c-1ee2-425b-9ae1-6c386b9a2908',
            'E9029A00-C998-4B76-B347-70F935E9797D', -- Entity: MJ_BizApps_Sonar: Score Recompute Runs
            100011,
            'BandTransitions',
            'Band Transitions',
            'Number of band transitions recorded during the run.',
            'int',
            4,
            10,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '80f25eca-504b-4f18-bba5-d31d28ef7949' OR (EntityID = 'E9029A00-C998-4B76-B347-70F935E9797D' AND Name = 'DurationMs')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '80f25eca-504b-4f18-bba5-d31d28ef7949',
            'E9029A00-C998-4B76-B347-70F935E9797D', -- Entity: MJ_BizApps_Sonar: Score Recompute Runs
            100012,
            'DurationMs',
            'Duration Ms',
            'Total run duration in milliseconds.',
            'bigint',
            8,
            19,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '763e77cc-9043-43d5-b3dd-bd1f1e7a4f56' OR (EntityID = 'E9029A00-C998-4B76-B347-70F935E9797D' AND Name = 'CostUnitsConsumed')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '763e77cc-9043-43d5-b3dd-bd1f1e7a4f56',
            'E9029A00-C998-4B76-B347-70F935E9797D', -- Entity: MJ_BizApps_Sonar: Score Recompute Runs
            100013,
            'CostUnitsConsumed',
            'Cost Units Consumed',
            'Tokens/compute units consumed by ActionBacked factors; feeds metering and billing.',
            'decimal',
            9,
            12,
            4,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f295761f-df64-4e1d-abdb-e1fcb28e0972' OR (EntityID = 'E9029A00-C998-4B76-B347-70F935E9797D' AND Name = 'ErrorsJSON')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'f295761f-df64-4e1d-abdb-e1fcb28e0972',
            'E9029A00-C998-4B76-B347-70F935E9797D', -- Entity: MJ_BizApps_Sonar: Score Recompute Runs
            100014,
            'ErrorsJSON',
            'Errors JSON',
            'JSON capturing any errors encountered during the run.',
            'nvarchar',
            -1,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '822757ae-f0f1-4b0b-9438-75157348fb23' OR (EntityID = 'E9029A00-C998-4B76-B347-70F935E9797D' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '822757ae-f0f1-4b0b-9438-75157348fb23',
            'E9029A00-C998-4B76-B347-70F935E9797D', -- Entity: MJ_BizApps_Sonar: Score Recompute Runs
            100015,
            '__mj_CreatedAt',
            'Created At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '182b68e8-7b6e-41dc-be84-96f2722241b8' OR (EntityID = 'E9029A00-C998-4B76-B347-70F935E9797D' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '182b68e8-7b6e-41dc-be84-96f2722241b8',
            'E9029A00-C998-4B76-B347-70F935E9797D', -- Entity: MJ_BizApps_Sonar: Score Recompute Runs
            100016,
            '__mj_UpdatedAt',
            'Updated At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '86df417b-fd45-4bb2-8ec8-6a7320fb929f' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '86df417b-fd45-4bb2-8ec8-6a7320fb929f',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100001,
            'ID',
            'ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            'newsequentialid()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            1,
            0,
            0,
            1,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '96c45e6a-328b-44b2-9a2f-1cd3784275fc' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = 'Name')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '96c45e6a-328b-44b2-9a2f-1cd3784275fc',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100002,
            'Name',
            'Name',
            'Human-readable name of the model, e.g. "2026 Renewal Risk".',
            'nvarchar',
            400,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            1,
            1,
            0,
            1,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '57a9e20f-2bdb-4f8f-8eb6-81d0efaeafa5' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = 'Slug')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '57a9e20f-2bdb-4f8f-8eb6-81d0efaeafa5',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100003,
            'Slug',
            'Slug',
            'Stable, unique handle for the model used in expressions and references.',
            'nvarchar',
            200,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '618ea0ba-1b1d-4b1b-a41a-a558e69f698b' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = 'Description')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '618ea0ba-1b1d-4b1b-a41a-a558e69f698b',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100004,
            'Description',
            'Description',
            'Optional description of what the model scores and why.',
            'nvarchar',
            -1,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '08c543a9-e221-41e8-b425-51de32275bd8' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = 'AnchorEntityID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '08c543a9-e221-41e8-b425-51de32275bd8',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100005,
            'AnchorEntityID',
            'Anchor Entity ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            'E0238F34-2837-EF11-86D4-6045BDEE16E6',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '557e7ed6-275d-4cc5-9f34-ed67c7e5f113' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = 'Status')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '557e7ed6-275d-4cc5-9f34-ed67c7e5f113',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100006,
            'Status',
            'Status',
            'Lifecycle status of the model: Draft, Active, Paused, or Archived.',
            'nvarchar',
            40,
            0,
            0,
            0,
            'Draft',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'cf9bf062-d98c-43c1-9d22-844771acc5f6' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = 'CurrentVersionID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'cf9bf062-d98c-43c1-9d22-844771acc5f6',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100007,
            'CurrentVersionID',
            'Current Version ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            'D9590BBC-23DF-4571-AB80-DD3C651ABC16',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e53e1599-83e8-475a-89f4-b6bbda541a05' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = 'ScoreScaleMin')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'e53e1599-83e8-475a-89f4-b6bbda541a05',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100008,
            'ScoreScaleMin',
            'Score Scale Min',
            'Minimum value of the output score scale (default 0).',
            'decimal',
            5,
            9,
            4,
            0,
            '(0)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ace9dab7-a312-42f7-96f2-50bacda15298' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = 'ScoreScaleMax')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ace9dab7-a312-42f7-96f2-50bacda15298',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100009,
            'ScoreScaleMax',
            'Score Scale Max',
            'Maximum value of the output score scale (default 100).',
            'decimal',
            5,
            9,
            4,
            0,
            '(100)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '337318e5-909a-4bf0-bbeb-a636fa40297d' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = 'CombineStrategy')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '337318e5-909a-4bf0-bbeb-a636fa40297d',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100010,
            'CombineStrategy',
            'Combine Strategy',
            'How factor contributions combine into a score: WeightedSum, WeightedAvg, Banded, ZScoreComposite, or ExpressionDriven.',
            'nvarchar',
            60,
            0,
            0,
            0,
            'WeightedSum',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'cdee08d4-a300-486e-9ed4-d9ba9ab95f6d' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = 'CombineExpression')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'cdee08d4-a300-486e-9ed4-d9ba9ab95f6d',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100011,
            'CombineExpression',
            'Combine Expression',
            'For ExpressionDriven models, the formula over factor slugs used to combine contributions.',
            'nvarchar',
            -1,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '868e9cdd-3795-43dc-8bac-2d0e389557e2' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = 'BandSetID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '868e9cdd-3795-43dc-8bac-2d0e389557e2',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100012,
            'BandSetID',
            'Band Set ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            'EF29D394-6120-4356-BAEA-A66D36F6580B',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'de732fcb-cb89-4991-b473-a02e6c6ccf08' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = 'PopulationFilter')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'de732fcb-cb89-4991-b473-a02e6c6ccf08',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100013,
            'PopulationFilter',
            'Population Filter',
            'JSON/DSL filter defining which anchor records are in scope for scoring (e.g. Status = Active).',
            'nvarchar',
            -1,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '498ab9b6-66ab-4476-8176-f1707242695a' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = 'RecomputeMode')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '498ab9b6-66ab-4476-8176-f1707242695a',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100014,
            'RecomputeMode',
            'Recompute Mode',
            'When scores recompute: Scheduled, EventDriven, OnDemand, or Hybrid.',
            'nvarchar',
            40,
            0,
            0,
            0,
            'Scheduled',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '66e186d3-909d-4270-aa93-8c05842905b6' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = 'RecomputeCron')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '66e186d3-909d-4270-aa93-8c05842905b6',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100015,
            'RecomputeCron',
            'Recompute Cron',
            'Cron expression controlling scheduled recompute, when RecomputeMode includes a schedule.',
            'nvarchar',
            200,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3e3c2ed9-7c47-4dcf-a233-9911cffabb46' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = 'AsOfStrategy')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3e3c2ed9-7c47-4dcf-a233-9911cffabb46',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100016,
            'AsOfStrategy',
            'As Of Strategy',
            'Defines what "now" means when resolving time windows: RunTime, EndOfPreviousDay, or Fixed.',
            'nvarchar',
            40,
            0,
            0,
            0,
            'RunTime',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '818e6ddd-104e-4a65-8784-f42ed26310b2' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = 'IsCalibrated')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '818e6ddd-104e-4a65-8784-f42ed26310b2',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100017,
            'IsCalibrated',
            'Is Calibrated',
            'When set, the model consumes cross-tenant benchmark distributions for normalization (calibration network).',
            'bit',
            1,
            1,
            0,
            0,
            '(0)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f6d81606-0d64-4bae-99af-bfc4de243b86' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = 'TrendWindowDays')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'f6d81606-0d64-4bae-99af-bfc4de243b86',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100018,
            'TrendWindowDays',
            'Trend Window Days',
            'Number of days used to compute the headline Delta and trend on each score.',
            'int',
            4,
            10,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '16cb8706-7ae4-40b3-b030-0885e1b2398b' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = 'OwnerUserID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '16cb8706-7ae4-40b3-b030-0885e1b2398b',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100019,
            'OwnerUserID',
            'Owner User ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            'E1238F34-2837-EF11-86D4-6045BDEE16E6',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2bd1c228-4950-453d-a355-5dca68436c3d' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = 'EffectiveFrom')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '2bd1c228-4950-453d-a355-5dca68436c3d',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100020,
            'EffectiveFrom',
            'Effective From',
            'Start of the bounded time range during which the model is active (optional).',
            'datetime2',
            8,
            27,
            7,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a3203ab3-8df4-40c7-b71f-1024f8b1fb78' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = 'EffectiveTo')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'a3203ab3-8df4-40c7-b71f-1024f8b1fb78',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100021,
            'EffectiveTo',
            'Effective To',
            'End of the bounded time range during which the model is active (optional).',
            'datetime2',
            8,
            27,
            7,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '65cbe4d0-37be-4929-9b51-80a68ff23b09' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = 'Notes')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '65cbe4d0-37be-4929-9b51-80a68ff23b09',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100022,
            'Notes',
            'Notes',
            'Freeform notes about the model.',
            'nvarchar',
            -1,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '313cb75f-caa1-404b-be50-c4c877df0c97' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '313cb75f-caa1-404b-be50-c4c877df0c97',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100023,
            '__mj_CreatedAt',
            'Created At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '9a8d3517-89aa-409b-b983-28f492c7dcd6' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '9a8d3517-89aa-409b-b983-28f492c7dcd6',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100024,
            '__mj_UpdatedAt',
            'Updated At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '56cf8daf-43bb-47f1-b0e5-aa93bf5f95ff' OR (EntityID = '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '56cf8daf-43bb-47f1-b0e5-aa93bf5f95ff',
            '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2', -- Entity: MJ_BizApps_Sonar: Score Band Transitions
            100001,
            'ID',
            'ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            'newsequentialid()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            1,
            0,
            0,
            1,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '54501bd9-4c52-4080-9bf4-34f2ed3d443c' OR (EntityID = '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2' AND Name = 'ScoreModelID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '54501bd9-4c52-4080-9bf4-34f2ed3d443c',
            '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2', -- Entity: MJ_BizApps_Sonar: Score Band Transitions
            100002,
            'ScoreModelID',
            'Score Model ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e4433d67-9fc6-45f3-a471-1a4f640dbb3f' OR (EntityID = '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2' AND Name = 'AnchorRecordID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'e4433d67-9fc6-45f3-a471-1a4f640dbb3f',
            '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2', -- Entity: MJ_BizApps_Sonar: Score Band Transitions
            100003,
            'AnchorRecordID',
            'Anchor Record ID',
            'Primary-key value of the anchor record that crossed bands, stored as a string to stay entity-agnostic.',
            'nvarchar',
            200,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'c0488a94-651a-4514-971e-9127465a5d23' OR (EntityID = '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2' AND Name = 'FromBandID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'c0488a94-651a-4514-971e-9127465a5d23',
            '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2', -- Entity: MJ_BizApps_Sonar: Score Band Transitions
            100004,
            'FromBandID',
            'From Band ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '7dd1beb4-95cf-49ce-a065-61b62a94daee' OR (EntityID = '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2' AND Name = 'ToBandID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '7dd1beb4-95cf-49ce-a065-61b62a94daee',
            '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2', -- Entity: MJ_BizApps_Sonar: Score Band Transitions
            100005,
            'ToBandID',
            'To Band ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f5682771-4957-4849-a445-fa3b57c263f7' OR (EntityID = '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2' AND Name = 'Direction')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'f5682771-4957-4849-a445-fa3b57c263f7',
            '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2', -- Entity: MJ_BizApps_Sonar: Score Band Transitions
            100006,
            'Direction',
            'Direction',
            'Direction of the crossing: Improving or Worsening.',
            'nvarchar',
            24,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '7163313d-e4bf-4cbe-aa37-514b4bff5dc6' OR (EntityID = '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2' AND Name = 'OccurredAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '7163313d-e4bf-4cbe-aa37-514b4bff5dc6',
            '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2', -- Entity: MJ_BizApps_Sonar: Score Band Transitions
            100007,
            'OccurredAt',
            'Occurred At',
            'UTC timestamp at which the band crossing occurred.',
            'datetime2',
            8,
            27,
            7,
            0,
            'getutcdate()',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd2c6a03b-ce2c-4f24-b11b-48985cd414cb' OR (EntityID = '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2' AND Name = 'RecomputeRunID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'd2c6a03b-ce2c-4f24-b11b-48985cd414cb',
            '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2', -- Entity: MJ_BizApps_Sonar: Score Band Transitions
            100008,
            'RecomputeRunID',
            'Recompute Run ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            'E9029A00-C998-4B76-B347-70F935E9797D',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'eead9486-8bf4-4137-994b-fa44485f0059' OR (EntityID = '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2' AND Name = 'Handled')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'eead9486-8bf4-4137-994b-fa44485f0059',
            '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2', -- Entity: MJ_BizApps_Sonar: Score Band Transitions
            100009,
            'Handled',
            'Handled',
            'Indicates whether the transition has been picked up by write-back or an intervention.',
            'bit',
            1,
            1,
            0,
            0,
            '(0)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '7e3347a4-c234-4dfd-b467-5d90ec48790a' OR (EntityID = '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '7e3347a4-c234-4dfd-b467-5d90ec48790a',
            '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2', -- Entity: MJ_BizApps_Sonar: Score Band Transitions
            100010,
            '__mj_CreatedAt',
            'Created At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '01ef5878-9a96-4398-83fd-1fc8e971eef3' OR (EntityID = '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '01ef5878-9a96-4398-83fd-1fc8e971eef3',
            '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2', -- Entity: MJ_BizApps_Sonar: Score Band Transitions
            100011,
            '__mj_UpdatedAt',
            'Updated At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e1c660dc-874a-41be-a175-131e0fc5b499' OR (EntityID = 'EF29D394-6120-4356-BAEA-A66D36F6580B' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'e1c660dc-874a-41be-a175-131e0fc5b499',
            'EF29D394-6120-4356-BAEA-A66D36F6580B', -- Entity: MJ_BizApps_Sonar: Score Band Sets
            100001,
            'ID',
            'ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            'newsequentialid()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            1,
            0,
            0,
            1,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '9954b3da-ba89-4464-b746-6ea9dc0e45b7' OR (EntityID = 'EF29D394-6120-4356-BAEA-A66D36F6580B' AND Name = 'Name')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '9954b3da-ba89-4464-b746-6ea9dc0e45b7',
            'EF29D394-6120-4356-BAEA-A66D36F6580B', -- Entity: MJ_BizApps_Sonar: Score Band Sets
            100002,
            'Name',
            'Name',
            'Display name of the band set.',
            'nvarchar',
            400,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            1,
            1,
            0,
            1,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '79945f71-6d7f-4109-967a-2c12fbedbc92' OR (EntityID = 'EF29D394-6120-4356-BAEA-A66D36F6580B' AND Name = 'AnchorEntityID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '79945f71-6d7f-4109-967a-2c12fbedbc92',
            'EF29D394-6120-4356-BAEA-A66D36F6580B', -- Entity: MJ_BizApps_Sonar: Score Band Sets
            100003,
            'AnchorEntityID',
            'Anchor Entity ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            'E0238F34-2837-EF11-86D4-6045BDEE16E6',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '15c08617-3c0d-480b-b7b6-98d84842a95d' OR (EntityID = 'EF29D394-6120-4356-BAEA-A66D36F6580B' AND Name = 'Description')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '15c08617-3c0d-480b-b7b6-98d84842a95d',
            'EF29D394-6120-4356-BAEA-A66D36F6580B', -- Entity: MJ_BizApps_Sonar: Score Band Sets
            100004,
            'Description',
            'Description',
            'Optional description of the band set and its intended use.',
            'nvarchar',
            -1,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e9b38b76-86a5-4f61-932a-8dbd0cee4d0a' OR (EntityID = 'EF29D394-6120-4356-BAEA-A66D36F6580B' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'e9b38b76-86a5-4f61-932a-8dbd0cee4d0a',
            'EF29D394-6120-4356-BAEA-A66D36F6580B', -- Entity: MJ_BizApps_Sonar: Score Band Sets
            100005,
            '__mj_CreatedAt',
            'Created At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3e2b4ae0-86bb-426f-be2a-7f4a0422cd8e' OR (EntityID = 'EF29D394-6120-4356-BAEA-A66D36F6580B' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3e2b4ae0-86bb-426f-be2a-7f4a0422cd8e',
            'EF29D394-6120-4356-BAEA-A66D36F6580B', -- Entity: MJ_BizApps_Sonar: Score Band Sets
            100006,
            '__mj_UpdatedAt',
            'Updated At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6aa9932d-41d2-43a2-9970-1cb0f5733703' OR (EntityID = '77581BAB-4F3C-4D59-82B6-A8E04A03CC2C' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '6aa9932d-41d2-43a2-9970-1cb0f5733703',
            '77581BAB-4F3C-4D59-82B6-A8E04A03CC2C', -- Entity: MJ_BizApps_Sonar: Time Windows
            100001,
            'ID',
            'ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            'newsequentialid()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            1,
            0,
            0,
            1,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '4968154f-c135-49da-aa2f-b00a075976e2' OR (EntityID = '77581BAB-4F3C-4D59-82B6-A8E04A03CC2C' AND Name = 'Name')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '4968154f-c135-49da-aa2f-b00a075976e2',
            '77581BAB-4F3C-4D59-82B6-A8E04A03CC2C', -- Entity: MJ_BizApps_Sonar: Time Windows
            100002,
            'Name',
            'Name',
            'Display name of the time window.',
            'nvarchar',
            240,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            1,
            1,
            0,
            1,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b61e2f94-7057-468b-8676-8356c7c41488' OR (EntityID = '77581BAB-4F3C-4D59-82B6-A8E04A03CC2C' AND Name = 'WindowType')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'b61e2f94-7057-468b-8676-8356c7c41488',
            '77581BAB-4F3C-4D59-82B6-A8E04A03CC2C', -- Entity: MJ_BizApps_Sonar: Time Windows
            100003,
            'WindowType',
            'Window Type',
            'Window type: Rolling, Calendar, SinceEvent, RenewalRelative, or AllTime.',
            'nvarchar',
            40,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd634e331-6d3a-4718-a531-01854f8f0aab' OR (EntityID = '77581BAB-4F3C-4D59-82B6-A8E04A03CC2C' AND Name = 'LengthDays')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'd634e331-6d3a-4718-a531-01854f8f0aab',
            '77581BAB-4F3C-4D59-82B6-A8E04A03CC2C', -- Entity: MJ_BizApps_Sonar: Time Windows
            100004,
            'LengthDays',
            'Length Days',
            'Window length in days, for Rolling/Calendar windows.',
            'int',
            4,
            10,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '29b87287-063c-4ac0-803d-4cf98b73fdd7' OR (EntityID = '77581BAB-4F3C-4D59-82B6-A8E04A03CC2C' AND Name = 'LengthMonths')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '29b87287-063c-4ac0-803d-4cf98b73fdd7',
            '77581BAB-4F3C-4D59-82B6-A8E04A03CC2C', -- Entity: MJ_BizApps_Sonar: Time Windows
            100005,
            'LengthMonths',
            'Length Months',
            'Window length in months, for Rolling/Calendar windows.',
            'int',
            4,
            10,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '7296cb82-e7bd-4a36-a628-e3ecee93f2d3' OR (EntityID = '77581BAB-4F3C-4D59-82B6-A8E04A03CC2C' AND Name = 'AnchorDateField')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '7296cb82-e7bd-4a36-a628-e3ecee93f2d3',
            '77581BAB-4F3C-4D59-82B6-A8E04A03CC2C', -- Entity: MJ_BizApps_Sonar: Time Windows
            100006,
            'AnchorDateField',
            'Anchor Date Field',
            'For RenewalRelative/SinceEvent windows, the date field on the anchor record the window is measured from (e.g. RenewalDate).',
            'nvarchar',
            400,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '968736a9-4527-4318-aaf3-a9e480780fcf' OR (EntityID = '77581BAB-4F3C-4D59-82B6-A8E04A03CC2C' AND Name = 'OffsetDays')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '968736a9-4527-4318-aaf3-a9e480780fcf',
            '77581BAB-4F3C-4D59-82B6-A8E04A03CC2C', -- Entity: MJ_BizApps_Sonar: Time Windows
            100007,
            'OffsetDays',
            'Offset Days',
            'Offset in days applied to the window start relative to the anchor date.',
            'int',
            4,
            10,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2a265fbc-c9fb-46fc-95c9-b38d03c4cb91' OR (EntityID = '77581BAB-4F3C-4D59-82B6-A8E04A03CC2C' AND Name = 'Description')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '2a265fbc-c9fb-46fc-95c9-b38d03c4cb91',
            '77581BAB-4F3C-4D59-82B6-A8E04A03CC2C', -- Entity: MJ_BizApps_Sonar: Time Windows
            100008,
            'Description',
            'Description',
            'Optional description of the time window.',
            'nvarchar',
            -1,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '0d913ea1-209c-4254-a0b2-7d0724f5de04' OR (EntityID = '77581BAB-4F3C-4D59-82B6-A8E04A03CC2C' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '0d913ea1-209c-4254-a0b2-7d0724f5de04',
            '77581BAB-4F3C-4D59-82B6-A8E04A03CC2C', -- Entity: MJ_BizApps_Sonar: Time Windows
            100009,
            '__mj_CreatedAt',
            'Created At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ec27ed85-a708-4796-ab2c-599dc910b2ee' OR (EntityID = '77581BAB-4F3C-4D59-82B6-A8E04A03CC2C' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ec27ed85-a708-4796-ab2c-599dc910b2ee',
            '77581BAB-4F3C-4D59-82B6-A8E04A03CC2C', -- Entity: MJ_BizApps_Sonar: Time Windows
            100010,
            '__mj_UpdatedAt',
            'Updated At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '5d74a8f6-f872-47d6-a297-0cfd1e464aa2' OR (EntityID = '5B986A39-E155-4EB8-9AFD-C1BD6A43548C' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '5d74a8f6-f872-47d6-a297-0cfd1e464aa2',
            '5B986A39-E155-4EB8-9AFD-C1BD6A43548C', -- Entity: MJ_BizApps_Sonar: Score Factor Contributions
            100001,
            'ID',
            'ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            'newsequentialid()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            1,
            0,
            0,
            1,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f5bbe344-3c0a-46cf-ab87-f4a27be8a438' OR (EntityID = '5B986A39-E155-4EB8-9AFD-C1BD6A43548C' AND Name = 'ScoreID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'f5bbe344-3c0a-46cf-ab87-f4a27be8a438',
            '5B986A39-E155-4EB8-9AFD-C1BD6A43548C', -- Entity: MJ_BizApps_Sonar: Score Factor Contributions
            100002,
            'ScoreID',
            'Score ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            '32F2A760-5BFC-4AF6-BB18-11EF10DD254C',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ece37c52-f7d4-4c2b-8118-eb99c695c4b7' OR (EntityID = '5B986A39-E155-4EB8-9AFD-C1BD6A43548C' AND Name = 'ModelFactorID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ece37c52-f7d4-4c2b-8118-eb99c695c4b7',
            '5B986A39-E155-4EB8-9AFD-C1BD6A43548C', -- Entity: MJ_BizApps_Sonar: Score Factor Contributions
            100003,
            'ModelFactorID',
            'Model Factor ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            'AFA51FA5-B85B-49DE-8905-D60B23D07DFA',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'fdaec25e-0988-44e7-8db7-1df1ee5619cf' OR (EntityID = '5B986A39-E155-4EB8-9AFD-C1BD6A43548C' AND Name = 'FactorID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'fdaec25e-0988-44e7-8db7-1df1ee5619cf',
            '5B986A39-E155-4EB8-9AFD-C1BD6A43548C', -- Entity: MJ_BizApps_Sonar: Score Factor Contributions
            100004,
            'FactorID',
            'Factor ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b25b95fe-09fa-46ba-aabe-f7539b9b85f5' OR (EntityID = '5B986A39-E155-4EB8-9AFD-C1BD6A43548C' AND Name = 'RawValue')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'b25b95fe-09fa-46ba-aabe-f7539b9b85f5',
            '5B986A39-E155-4EB8-9AFD-C1BD6A43548C', -- Entity: MJ_BizApps_Sonar: Score Factor Contributions
            100005,
            'RawValue',
            'Raw Value',
            'Raw value the factor produced before normalization.',
            'decimal',
            9,
            18,
            6,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6833b86e-01eb-4953-822c-693f60f29a73' OR (EntityID = '5B986A39-E155-4EB8-9AFD-C1BD6A43548C' AND Name = 'NormalizedValue')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '6833b86e-01eb-4953-822c-693f60f29a73',
            '5B986A39-E155-4EB8-9AFD-C1BD6A43548C', -- Entity: MJ_BizApps_Sonar: Score Factor Contributions
            100006,
            'NormalizedValue',
            'Normalized Value',
            'The factor''s normalized output (e.g. 0-1 or configured range).',
            'decimal',
            5,
            9,
            4,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'bf25c890-be1e-4789-81a4-bc5a253008cd' OR (EntityID = '5B986A39-E155-4EB8-9AFD-C1BD6A43548C' AND Name = 'WeightedContribution')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'bf25c890-be1e-4789-81a4-bc5a253008cd',
            '5B986A39-E155-4EB8-9AFD-C1BD6A43548C', -- Entity: MJ_BizApps_Sonar: Score Factor Contributions
            100007,
            'WeightedContribution',
            'Weighted Contribution',
            'Amount this factor added to the score after weighting.',
            'decimal',
            9,
            12,
            4,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'df8a1f4e-f5cf-495c-a067-c5e7ee8b6199' OR (EntityID = '5B986A39-E155-4EB8-9AFD-C1BD6A43548C' AND Name = 'PercentOfTotal')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'df8a1f4e-f5cf-495c-a067-c5e7ee8b6199',
            '5B986A39-E155-4EB8-9AFD-C1BD6A43548C', -- Entity: MJ_BizApps_Sonar: Score Factor Contributions
            100008,
            'PercentOfTotal',
            'Percent Of Total',
            'Share of the total score attributable to this factor.',
            'decimal',
            5,
            5,
            4,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '648b7cb7-cb90-4135-b1e2-85b1705a64c9' OR (EntityID = '5B986A39-E155-4EB8-9AFD-C1BD6A43548C' AND Name = 'ContributionDelta')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '648b7cb7-cb90-4135-b1e2-85b1705a64c9',
            '5B986A39-E155-4EB8-9AFD-C1BD6A43548C', -- Entity: MJ_BizApps_Sonar: Score Factor Contributions
            100009,
            'ContributionDelta',
            'Contribution Delta',
            'Change in this factor''s contribution versus the previous score.',
            'decimal',
            9,
            12,
            4,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3f8f5b3a-3d25-48ad-a722-859afd3b5565' OR (EntityID = '5B986A39-E155-4EB8-9AFD-C1BD6A43548C' AND Name = 'HadData')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3f8f5b3a-3d25-48ad-a722-859afd3b5565',
            '5B986A39-E155-4EB8-9AFD-C1BD6A43548C', -- Entity: MJ_BizApps_Sonar: Score Factor Contributions
            100010,
            'HadData',
            'Had Data',
            'Indicates whether the factor had data for this record.',
            'bit',
            1,
            1,
            0,
            0,
            '(0)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '9ef97dc5-0901-423c-8186-1ced36fd52b1' OR (EntityID = '5B986A39-E155-4EB8-9AFD-C1BD6A43548C' AND Name = 'MissingDataApplied')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '9ef97dc5-0901-423c-8186-1ced36fd52b1',
            '5B986A39-E155-4EB8-9AFD-C1BD6A43548C', -- Entity: MJ_BizApps_Sonar: Score Factor Contributions
            100011,
            'MissingDataApplied',
            'Missing Data Applied',
            'Indicates whether a missing-data policy was applied for this factor.',
            'bit',
            1,
            1,
            0,
            0,
            '(0)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '17e47032-78d9-45e1-9070-1f8af44459ab' OR (EntityID = '5B986A39-E155-4EB8-9AFD-C1BD6A43548C' AND Name = 'DetailJSON')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '17e47032-78d9-45e1-9070-1f8af44459ab',
            '5B986A39-E155-4EB8-9AFD-C1BD6A43548C', -- Entity: MJ_BizApps_Sonar: Score Factor Contributions
            100012,
            'DetailJSON',
            'Detail JSON',
            'Optional JSON with sampled underlying record references for drill-through.',
            'nvarchar',
            -1,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '53c2bf16-66f5-4e71-84a7-4b0f27e650e5' OR (EntityID = '5B986A39-E155-4EB8-9AFD-C1BD6A43548C' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '53c2bf16-66f5-4e71-84a7-4b0f27e650e5',
            '5B986A39-E155-4EB8-9AFD-C1BD6A43548C', -- Entity: MJ_BizApps_Sonar: Score Factor Contributions
            100013,
            '__mj_CreatedAt',
            'Created At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ec0c1bce-079e-4eb0-b61e-2d2c5bf68d55' OR (EntityID = '5B986A39-E155-4EB8-9AFD-C1BD6A43548C' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ec0c1bce-079e-4eb0-b61e-2d2c5bf68d55',
            '5B986A39-E155-4EB8-9AFD-C1BD6A43548C', -- Entity: MJ_BizApps_Sonar: Score Factor Contributions
            100014,
            '__mj_UpdatedAt',
            'Updated At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '24b04b22-3fb7-408f-bc16-e0a2b85141c6' OR (EntityID = 'AFA51FA5-B85B-49DE-8905-D60B23D07DFA' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '24b04b22-3fb7-408f-bc16-e0a2b85141c6',
            'AFA51FA5-B85B-49DE-8905-D60B23D07DFA', -- Entity: MJ_BizApps_Sonar: Model Factors
            100001,
            'ID',
            'ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            'newsequentialid()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            1,
            0,
            0,
            1,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '771da076-bc63-4f40-937b-e518de5be2dc' OR (EntityID = 'AFA51FA5-B85B-49DE-8905-D60B23D07DFA' AND Name = 'ScoreModelID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '771da076-bc63-4f40-937b-e518de5be2dc',
            'AFA51FA5-B85B-49DE-8905-D60B23D07DFA', -- Entity: MJ_BizApps_Sonar: Model Factors
            100002,
            'ScoreModelID',
            'Score Model ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA',
            'ID',
            0,
            0,
            1,
            0,
            0,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '859eb4c3-d2a9-468a-b160-34727816b46e' OR (EntityID = 'AFA51FA5-B85B-49DE-8905-D60B23D07DFA' AND Name = 'FactorID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '859eb4c3-d2a9-468a-b160-34727816b46e',
            'AFA51FA5-B85B-49DE-8905-D60B23D07DFA', -- Entity: MJ_BizApps_Sonar: Model Factors
            100003,
            'FactorID',
            'Factor ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03',
            'ID',
            0,
            0,
            1,
            0,
            0,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '23fe5143-9ec0-4f9e-bf4e-a9e18155364c' OR (EntityID = 'AFA51FA5-B85B-49DE-8905-D60B23D07DFA' AND Name = 'Weight')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '23fe5143-9ec0-4f9e-bf4e-a9e18155364c',
            'AFA51FA5-B85B-49DE-8905-D60B23D07DFA', -- Entity: MJ_BizApps_Sonar: Model Factors
            100004,
            'Weight',
            'Weight',
            'Weight applied to this factor''s normalized contribution.',
            'decimal',
            5,
            9,
            4,
            0,
            '(1)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '1a2114e1-670e-416d-b78b-69ae0270cdf6' OR (EntityID = 'AFA51FA5-B85B-49DE-8905-D60B23D07DFA' AND Name = 'WeightMode')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '1a2114e1-670e-416d-b78b-69ae0270cdf6',
            'AFA51FA5-B85B-49DE-8905-D60B23D07DFA', -- Entity: MJ_BizApps_Sonar: Model Factors
            100005,
            'WeightMode',
            'Weight Mode',
            'How the weight is applied: Additive, Multiplier, Gate, Penalty, or Bonus.',
            'nvarchar',
            24,
            0,
            0,
            0,
            'Additive',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '516ff684-50bc-4e30-8c22-0c2db8a51ef3' OR (EntityID = 'AFA51FA5-B85B-49DE-8905-D60B23D07DFA' AND Name = 'ContributionCap')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '516ff684-50bc-4e30-8c22-0c2db8a51ef3',
            'AFA51FA5-B85B-49DE-8905-D60B23D07DFA', -- Entity: MJ_BizApps_Sonar: Model Factors
            100006,
            'ContributionCap',
            'Contribution Cap',
            'Optional upper clamp on this factor''s contribution.',
            'decimal',
            5,
            9,
            4,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '1045eddd-98aa-49a5-afd9-31cc01d74096' OR (EntityID = 'AFA51FA5-B85B-49DE-8905-D60B23D07DFA' AND Name = 'ContributionFloor')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '1045eddd-98aa-49a5-afd9-31cc01d74096',
            'AFA51FA5-B85B-49DE-8905-D60B23D07DFA', -- Entity: MJ_BizApps_Sonar: Model Factors
            100007,
            'ContributionFloor',
            'Contribution Floor',
            'Optional lower clamp on this factor''s contribution.',
            'decimal',
            5,
            9,
            4,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6c80700f-ed04-4362-9547-692dfafee9e4' OR (EntityID = 'AFA51FA5-B85B-49DE-8905-D60B23D07DFA' AND Name = 'TrendWeight')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '6c80700f-ed04-4362-9547-692dfafee9e4',
            'AFA51FA5-B85B-49DE-8905-D60B23D07DFA', -- Entity: MJ_BizApps_Sonar: Model Factors
            100008,
            'TrendWeight',
            'Trend Weight',
            'Extra weight placed on the factor''s delta versus its level (encodes "a falling 80 beats a steady 50").',
            'decimal',
            5,
            9,
            4,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3716bf4b-d1c6-412c-9e8a-c456f9b4ffc2' OR (EntityID = 'AFA51FA5-B85B-49DE-8905-D60B23D07DFA' AND Name = 'MissingDataPolicy')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3716bf4b-d1c6-412c-9e8a-c456f9b4ffc2',
            'AFA51FA5-B85B-49DE-8905-D60B23D07DFA', -- Entity: MJ_BizApps_Sonar: Model Factors
            100009,
            'MissingDataPolicy',
            'Missing Data Policy',
            'Policy when the factor has no data: Zero, NeutralMidpoint, Exclude, or ModelDefault.',
            'nvarchar',
            32,
            0,
            0,
            0,
            'ModelDefault',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'fdf0a48e-8b27-40bb-86b5-92a64b251f94' OR (EntityID = 'AFA51FA5-B85B-49DE-8905-D60B23D07DFA' AND Name = 'IsRequired')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'fdf0a48e-8b27-40bb-86b5-92a64b251f94',
            'AFA51FA5-B85B-49DE-8905-D60B23D07DFA', -- Entity: MJ_BizApps_Sonar: Model Factors
            100010,
            'IsRequired',
            'Is Required',
            'When true and data is missing, the resulting score is flagged low-confidence.',
            'bit',
            1,
            1,
            0,
            0,
            '(0)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '47f7634f-3e51-402d-99e4-2cc041a28254' OR (EntityID = 'AFA51FA5-B85B-49DE-8905-D60B23D07DFA' AND Name = 'DisplayLabel')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '47f7634f-3e51-402d-99e4-2cc041a28254',
            'AFA51FA5-B85B-49DE-8905-D60B23D07DFA', -- Entity: MJ_BizApps_Sonar: Model Factors
            100011,
            'DisplayLabel',
            'Display Label',
            'Label shown for this factor in explainability views, e.g. "Newsletter engagement".',
            'nvarchar',
            400,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '519ce51e-f449-42ba-81aa-84a98c8cd2d0' OR (EntityID = 'AFA51FA5-B85B-49DE-8905-D60B23D07DFA' AND Name = 'DisplayOrder')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '519ce51e-f449-42ba-81aa-84a98c8cd2d0',
            'AFA51FA5-B85B-49DE-8905-D60B23D07DFA', -- Entity: MJ_BizApps_Sonar: Model Factors
            100012,
            'DisplayOrder',
            'Display Order',
            'Sort order for displaying this factor in the rubric and explainability views.',
            'int',
            4,
            10,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8387e421-adca-4b83-8cfa-0327a85bc34d' OR (EntityID = 'AFA51FA5-B85B-49DE-8905-D60B23D07DFA' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '8387e421-adca-4b83-8cfa-0327a85bc34d',
            'AFA51FA5-B85B-49DE-8905-D60B23D07DFA', -- Entity: MJ_BizApps_Sonar: Model Factors
            100013,
            '__mj_CreatedAt',
            'Created At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a6a64d7c-1725-49de-a648-07bd9e717896' OR (EntityID = 'AFA51FA5-B85B-49DE-8905-D60B23D07DFA' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'a6a64d7c-1725-49de-a648-07bd9e717896',
            'AFA51FA5-B85B-49DE-8905-D60B23D07DFA', -- Entity: MJ_BizApps_Sonar: Model Factors
            100014,
            '__mj_UpdatedAt',
            'Updated At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '244f4ded-153a-4b17-bd7e-81c099db2932' OR (EntityID = '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '244f4ded-153a-4b17-bd7e-81c099db2932',
            '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41', -- Entity: MJ_BizApps_Sonar: Score Model Audit Events
            100001,
            'ID',
            'ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            'newsequentialid()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            1,
            0,
            0,
            1,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '0640b1b2-7ab6-4a64-98c3-04e85487e695' OR (EntityID = '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41' AND Name = 'ScoreModelID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '0640b1b2-7ab6-4a64-98c3-04e85487e695',
            '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41', -- Entity: MJ_BizApps_Sonar: Score Model Audit Events
            100002,
            'ScoreModelID',
            'Score Model ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '08b6aa25-9537-487b-92e7-778812e653b7' OR (EntityID = '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41' AND Name = 'EntityChanged')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '08b6aa25-9537-487b-92e7-778812e653b7',
            '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41', -- Entity: MJ_BizApps_Sonar: Score Model Audit Events
            100003,
            'EntityChanged',
            'Entity Changed',
            'Name of the configuration entity that changed (e.g. ScoreModel, Factor, ModelFactor).',
            'nvarchar',
            200,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '72f3db33-719d-4120-a168-361388171c63' OR (EntityID = '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41' AND Name = 'RecordID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '72f3db33-719d-4120-a168-361388171c63',
            '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41', -- Entity: MJ_BizApps_Sonar: Score Model Audit Events
            100004,
            'RecordID',
            'Record ID',
            'Identifier of the specific record that changed, stored as a string to stay entity-agnostic.',
            'nvarchar',
            200,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '79679e18-2360-4316-af26-f15f9fc50163' OR (EntityID = '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41' AND Name = 'ChangeType')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '79679e18-2360-4316-af26-f15f9fc50163',
            '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41', -- Entity: MJ_BizApps_Sonar: Score Model Audit Events
            100005,
            'ChangeType',
            'Change Type',
            'Kind of change: Create, Update, Delete, or Publish.',
            'nvarchar',
            40,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '5763593b-006b-4371-9484-b094dd136044' OR (EntityID = '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41' AND Name = 'BeforeJSON')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '5763593b-006b-4371-9484-b094dd136044',
            '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41', -- Entity: MJ_BizApps_Sonar: Score Model Audit Events
            100006,
            'BeforeJSON',
            'Before JSON',
            'JSON snapshot of the record before the change.',
            'nvarchar',
            -1,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '14ac46c1-41ed-4510-9a36-da6191e03335' OR (EntityID = '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41' AND Name = 'AfterJSON')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '14ac46c1-41ed-4510-9a36-da6191e03335',
            '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41', -- Entity: MJ_BizApps_Sonar: Score Model Audit Events
            100007,
            'AfterJSON',
            'After JSON',
            'JSON snapshot of the record after the change.',
            'nvarchar',
            -1,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f959108c-40b9-4a15-a880-1be1e2e64ba3' OR (EntityID = '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41' AND Name = 'ChangedByUserID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'f959108c-40b9-4a15-a880-1be1e2e64ba3',
            '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41', -- Entity: MJ_BizApps_Sonar: Score Model Audit Events
            100008,
            'ChangedByUserID',
            'Changed By User ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            'E1238F34-2837-EF11-86D4-6045BDEE16E6',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3be1ab38-e4bd-4082-8657-1460a46b179a' OR (EntityID = '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41' AND Name = 'ChangedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3be1ab38-e4bd-4082-8657-1460a46b179a',
            '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41', -- Entity: MJ_BizApps_Sonar: Score Model Audit Events
            100009,
            'ChangedAt',
            'Changed At',
            'UTC timestamp at which the change occurred.',
            'datetime2',
            8,
            27,
            7,
            0,
            'getutcdate()',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '9debb5e2-3248-4969-8b9c-9f73ce78e883' OR (EntityID = '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '9debb5e2-3248-4969-8b9c-9f73ce78e883',
            '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41', -- Entity: MJ_BizApps_Sonar: Score Model Audit Events
            100010,
            '__mj_CreatedAt',
            'Created At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd9caf441-44c4-4bf9-93f8-1439cff3a6a2' OR (EntityID = '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'd9caf441-44c4-4bf9-93f8-1439cff3a6a2',
            '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41', -- Entity: MJ_BizApps_Sonar: Score Model Audit Events
            100011,
            '__mj_UpdatedAt',
            'Updated At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '957a5c59-b32f-42c5-aba1-6f3d75f0838f' OR (EntityID = '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '957a5c59-b32f-42c5-aba1-6f3d75f0838f',
            '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A', -- Entity: MJ_BizApps_Sonar: Score Bands
            100001,
            'ID',
            'ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            'newsequentialid()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            1,
            0,
            0,
            1,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '80527846-bb27-48c6-b4ce-6a97ff6e79b2' OR (EntityID = '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A' AND Name = 'BandSetID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '80527846-bb27-48c6-b4ce-6a97ff6e79b2',
            '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A', -- Entity: MJ_BizApps_Sonar: Score Bands
            100002,
            'BandSetID',
            'Band Set ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            'EF29D394-6120-4356-BAEA-A66D36F6580B',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '50bdf739-3c97-420c-b005-dd570706d062' OR (EntityID = '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A' AND Name = 'Label')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '50bdf739-3c97-420c-b005-dd570706d062',
            '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A', -- Entity: MJ_BizApps_Sonar: Score Bands
            100003,
            'Label',
            'Label',
            'Display label for the band, e.g. Healthy, Watch, At-Risk, Critical.',
            'nvarchar',
            120,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e6737178-5b67-407c-8dc2-09d2709409dd' OR (EntityID = '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A' AND Name = 'MinScore')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'e6737178-5b67-407c-8dc2-09d2709409dd',
            '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A', -- Entity: MJ_BizApps_Sonar: Score Bands
            100004,
            'MinScore',
            'Min Score',
            'Inclusive lower bound of the band score range.',
            'decimal',
            5,
            9,
            4,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'dcdb1299-0bb0-4430-94b0-85fd0f5b03cf' OR (EntityID = '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A' AND Name = 'MaxScore')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'dcdb1299-0bb0-4430-94b0-85fd0f5b03cf',
            '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A', -- Entity: MJ_BizApps_Sonar: Score Bands
            100005,
            'MaxScore',
            'Max Score',
            'Exclusive upper bound of the band score range (half-open; ranges are contiguous and non-overlapping).',
            'decimal',
            5,
            9,
            4,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '617a26ff-52a1-48ea-8ad1-8439d2fe104f' OR (EntityID = '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A' AND Name = 'Severity')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '617a26ff-52a1-48ea-8ad1-8439d2fe104f',
            '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A', -- Entity: MJ_BizApps_Sonar: Score Bands
            100006,
            'Severity',
            'Severity',
            'Severity rank where 0 is best and higher numbers are worse; drives sort order and color.',
            'int',
            4,
            10,
            0,
            0,
            '(0)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '29268a85-baea-4ef9-a92c-027d1fc5eff7' OR (EntityID = '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A' AND Name = 'ColorHex')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '29268a85-baea-4ef9-a92c-027d1fc5eff7',
            '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A', -- Entity: MJ_BizApps_Sonar: Score Bands
            100007,
            'ColorHex',
            'Color Hex',
            'Hex color code (e.g. #2E7D32) used to render the band in the UI.',
            'nvarchar',
            14,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a99bd185-2a87-4b23-8766-1ad3bbb5b4c5' OR (EntityID = '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A' AND Name = 'IsTerminal')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'a99bd185-2a87-4b23-8766-1ad3bbb5b4c5',
            '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A', -- Entity: MJ_BizApps_Sonar: Score Bands
            100008,
            'IsTerminal',
            'Is Terminal',
            'Indicates a terminal band (e.g. Lapsed) that represents an end state rather than a point on the continuum.',
            'bit',
            1,
            1,
            0,
            0,
            '(0)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd122a815-cfe4-48e2-9770-206b57545631' OR (EntityID = '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A' AND Name = 'Description')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'd122a815-cfe4-48e2-9770-206b57545631',
            '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A', -- Entity: MJ_BizApps_Sonar: Score Bands
            100009,
            'Description',
            'Description',
            'Optional description of what this band means.',
            'nvarchar',
            -1,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'c758abea-52d5-48d8-a597-2036ce8a5d5a' OR (EntityID = '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'c758abea-52d5-48d8-a597-2036ce8a5d5a',
            '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A', -- Entity: MJ_BizApps_Sonar: Score Bands
            100010,
            '__mj_CreatedAt',
            'Created At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '5636db91-c5c7-4c34-a873-e1cf00ef581b' OR (EntityID = '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '5636db91-c5c7-4c34-a873-e1cf00ef581b',
            '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A', -- Entity: MJ_BizApps_Sonar: Score Bands
            100011,
            '__mj_UpdatedAt',
            'Updated At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '24db1952-d11d-4b83-ad3c-984430b6da12' OR (EntityID = 'D9590BBC-23DF-4571-AB80-DD3C651ABC16' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '24db1952-d11d-4b83-ad3c-984430b6da12',
            'D9590BBC-23DF-4571-AB80-DD3C651ABC16', -- Entity: MJ_BizApps_Sonar: Score Model Versions
            100001,
            'ID',
            'ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            'newsequentialid()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            1,
            0,
            0,
            1,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '5a016a29-2c1a-4da6-bcbf-8ef6004901a0' OR (EntityID = 'D9590BBC-23DF-4571-AB80-DD3C651ABC16' AND Name = 'ScoreModelID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '5a016a29-2c1a-4da6-bcbf-8ef6004901a0',
            'D9590BBC-23DF-4571-AB80-DD3C651ABC16', -- Entity: MJ_BizApps_Sonar: Score Model Versions
            100002,
            'ScoreModelID',
            'Score Model ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA',
            'ID',
            0,
            0,
            1,
            0,
            0,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '9484b2dc-db93-420f-af6e-94075a22d871' OR (EntityID = 'D9590BBC-23DF-4571-AB80-DD3C651ABC16' AND Name = 'VersionNumber')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '9484b2dc-db93-420f-af6e-94075a22d871',
            'D9590BBC-23DF-4571-AB80-DD3C651ABC16', -- Entity: MJ_BizApps_Sonar: Score Model Versions
            100003,
            'VersionNumber',
            'Version Number',
            'Monotonic version number within the model.',
            'int',
            4,
            10,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '94676b4c-3477-4abc-b7c6-ce9d8d249e0b' OR (EntityID = 'D9590BBC-23DF-4571-AB80-DD3C651ABC16' AND Name = 'VersionLabel')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '94676b4c-3477-4abc-b7c6-ce9d8d249e0b',
            'D9590BBC-23DF-4571-AB80-DD3C651ABC16', -- Entity: MJ_BizApps_Sonar: Score Model Versions
            100004,
            'VersionLabel',
            'Version Label',
            'Optional human-readable label for the version.',
            'nvarchar',
            100,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '0dc5b6b0-96b7-4e61-ba8e-871473274564' OR (EntityID = 'D9590BBC-23DF-4571-AB80-DD3C651ABC16' AND Name = 'ConfigSnapshotJSON')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '0dc5b6b0-96b7-4e61-ba8e-871473274564',
            'D9590BBC-23DF-4571-AB80-DD3C651ABC16', -- Entity: MJ_BizApps_Sonar: Score Model Versions
            100005,
            'ConfigSnapshotJSON',
            'Config Snapshot JSON',
            'Fully denormalized JSON snapshot (anchor, related-entity map, factors, weights, windows, bands, normalization) the engine can score from on its own.',
            'nvarchar',
            -1,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3b2c429b-ac84-42b4-a5fd-288f699ba440' OR (EntityID = 'D9590BBC-23DF-4571-AB80-DD3C651ABC16' AND Name = 'ChangeSummary')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3b2c429b-ac84-42b4-a5fd-288f699ba440',
            'D9590BBC-23DF-4571-AB80-DD3C651ABC16', -- Entity: MJ_BizApps_Sonar: Score Model Versions
            100006,
            'ChangeSummary',
            'Change Summary',
            'Summary of what changed versus the prior version.',
            'nvarchar',
            -1,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'bd4e9e55-b077-4f79-a78d-6eb63893e5d1' OR (EntityID = 'D9590BBC-23DF-4571-AB80-DD3C651ABC16' AND Name = 'PublishedByUserID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'bd4e9e55-b077-4f79-a78d-6eb63893e5d1',
            'D9590BBC-23DF-4571-AB80-DD3C651ABC16', -- Entity: MJ_BizApps_Sonar: Score Model Versions
            100007,
            'PublishedByUserID',
            'Published By User ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            'E1238F34-2837-EF11-86D4-6045BDEE16E6',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a8a7b143-8004-403b-b889-2f3f6796a72b' OR (EntityID = 'D9590BBC-23DF-4571-AB80-DD3C651ABC16' AND Name = 'PublishedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'a8a7b143-8004-403b-b889-2f3f6796a72b',
            'D9590BBC-23DF-4571-AB80-DD3C651ABC16', -- Entity: MJ_BizApps_Sonar: Score Model Versions
            100008,
            'PublishedAt',
            'Published At',
            'UTC timestamp at which this version was published.',
            'datetime2',
            8,
            27,
            7,
            0,
            'getutcdate()',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '1da817e6-e85a-4820-9b6d-13b21dcd53e0' OR (EntityID = 'D9590BBC-23DF-4571-AB80-DD3C651ABC16' AND Name = 'IsCurrent')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '1da817e6-e85a-4820-9b6d-13b21dcd53e0',
            'D9590BBC-23DF-4571-AB80-DD3C651ABC16', -- Entity: MJ_BizApps_Sonar: Score Model Versions
            100009,
            'IsCurrent',
            'Is Current',
            'Indicates the single current version that is actively scoring for the model.',
            'bit',
            1,
            1,
            0,
            0,
            '(0)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f7313c57-c011-4c37-8c5f-5dbfd1db1ea6' OR (EntityID = 'D9590BBC-23DF-4571-AB80-DD3C651ABC16' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'f7313c57-c011-4c37-8c5f-5dbfd1db1ea6',
            'D9590BBC-23DF-4571-AB80-DD3C651ABC16', -- Entity: MJ_BizApps_Sonar: Score Model Versions
            100010,
            '__mj_CreatedAt',
            'Created At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8f405ae7-47cb-4619-9dda-41b09d61ec52' OR (EntityID = 'D9590BBC-23DF-4571-AB80-DD3C651ABC16' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '8f405ae7-47cb-4619-9dda-41b09d61ec52',
            'D9590BBC-23DF-4571-AB80-DD3C651ABC16', -- Entity: MJ_BizApps_Sonar: Score Model Versions
            100011,
            '__mj_UpdatedAt',
            'Updated At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'afc67bf8-be32-4376-a123-686936b05b0e' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'ID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'afc67bf8-be32-4376-a123-686936b05b0e',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100001,
            'ID',
            'ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            'newsequentialid()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            1,
            0,
            0,
            1,
            1,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd4f136b0-a6b2-4b42-bc2f-1db56a449ca6' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'Name')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'd4f136b0-a6b2-4b42-bc2f-1db56a449ca6',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100002,
            'Name',
            'Name',
            'Human-readable name of the factor.',
            'nvarchar',
            400,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            1,
            1,
            0,
            1,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '7c502b02-3fff-4c2b-b2c3-a9683693909a' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'Slug')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '7c502b02-3fff-4c2b-b2c3-a9683693909a',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100003,
            'Slug',
            'Slug',
            'Stable handle for the factor, referenced by the rubric and combine expressions.',
            'nvarchar',
            200,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '893709b8-37a7-444d-bf1c-b73126bc6e21' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'Description')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '893709b8-37a7-444d-bf1c-b73126bc6e21',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100004,
            'Description',
            'Description',
            'Optional description of the signal the factor measures.',
            'nvarchar',
            -1,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '76d14198-90e7-4b05-b922-cec26bcd46d3' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'ScoreModelID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '76d14198-90e7-4b05-b922-cec26bcd46d3',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100005,
            'ScoreModelID',
            'Score Model ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '48c777ec-0d9e-4724-b078-c214194a5561' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'AnchorEntityID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '48c777ec-0d9e-4724-b078-c214194a5561',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100006,
            'AnchorEntityID',
            'Anchor Entity ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            'E0238F34-2837-EF11-86D4-6045BDEE16E6',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '2f659474-8ce5-4395-ac06-6f1b2c9b0ab2' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'FactorType')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '2f659474-8ce5-4395-ac06-6f1b2c9b0ab2',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100007,
            'FactorType',
            'Factor Type',
            'Factor kind: Declarative, ActionBacked, DerivedFromScore, or Constant. The rubric engine never branches on this.',
            'nvarchar',
            40,
            0,
            0,
            0,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ea7d8feb-8d05-4845-bad1-5c5172bbd04b' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'SourceRelatedEntityID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ea7d8feb-8d05-4845-bad1-5c5172bbd04b',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100008,
            'SourceRelatedEntityID',
            'Source Related Entity ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            '710B4C24-C185-4693-B958-2525655E3D20',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e4e72670-d9b0-445b-81b6-74ec723b96ca' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'SourceEntityID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'e4e72670-d9b0-445b-81b6-74ec723b96ca',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100009,
            'SourceEntityID',
            'Source Entity ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            'E0238F34-2837-EF11-86D4-6045BDEE16E6',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '8a792809-5e2e-478f-9e6c-53ee3db34998' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'FilterExpression')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '8a792809-5e2e-478f-9e6c-53ee3db34998',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100010,
            'FilterExpression',
            'Filter Expression',
            'For declarative factors, the JSON/DSL filter applied to the source related entity (e.g. ActivityType IN (EmailOpen, EmailClick)).',
            'nvarchar',
            -1,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'dbd1460c-6f9a-4aef-a8ba-59b1519e299d' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'Aggregation')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'dbd1460c-6f9a-4aef-a8ba-59b1519e299d',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100011,
            'Aggregation',
            'Aggregation',
            'Aggregation applied to the filtered source rows: Count, Sum, Avg, Min, Max, DistinctCount, Recency, RatePerPeriod, Exists, or TrendSlope.',
            'nvarchar',
            40,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '7fa60c02-d531-4b52-a88b-f8ed67c8ec90' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'AggregateFieldName')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '7fa60c02-d531-4b52-a88b-f8ed67c8ec90',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100012,
            'AggregateFieldName',
            'Aggregate Field Name',
            'Column on the source entity to sum or average; null for Count/Exists aggregations.',
            'nvarchar',
            400,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'bca42c54-005e-414d-86a8-aef13be670f5' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'TimeWindowID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'bca42c54-005e-414d-86a8-aef13be670f5',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100013,
            'TimeWindowID',
            'Time Window ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            '77581BAB-4F3C-4D59-82B6-A8E04A03CC2C',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '416db393-f1e2-4de5-9b8e-ce8396f83b13' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'RecencyDecayHalfLifeDays')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '416db393-f1e2-4de5-9b8e-ce8396f83b13',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100014,
            'RecencyDecayHalfLifeDays',
            'Recency Decay Half Life Days',
            'Optional half-life in days for recency-weighted aggregation.',
            'int',
            4,
            10,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3a1a964d-a3b3-414f-b43b-c99876b8c306' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'ActionID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3a1a964d-a3b3-414f-b43b-c99876b8c306',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100015,
            'ActionID',
            'Action ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            '38248F34-2837-EF11-86D4-6045BDEE16E6',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'e69c832d-00eb-4fea-b9e0-c69333a594d3' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'ActionParamsJSON')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'e69c832d-00eb-4fea-b9e0-c69333a594d3',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100016,
            'ActionParamsJSON',
            'Action Params JSON',
            'For ActionBacked factors, static parameters (JSON) bound to the Action at config time.',
            'nvarchar',
            -1,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '83dfc6dd-f598-4404-920c-d91dd9598ca3' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'ExecutionMode')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '83dfc6dd-f598-4404-920c-d91dd9598ca3',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100017,
            'ExecutionMode',
            'Execution Mode',
            'Execution mode for ActionBacked factors: PerRecord or Batch.',
            'nvarchar',
            24,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '59c3e92f-49a5-4f15-8338-93d398f65de5' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'IsExpensive')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '59c3e92f-49a5-4f15-8338-93d398f65de5',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100018,
            'IsExpensive',
            'Is Expensive',
            'Marks the factor as expensive to evaluate; surfaced in the builder and used for recompute budgeting.',
            'bit',
            1,
            1,
            0,
            0,
            '(0)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a725f65a-60c6-4dcc-8158-b5e7fb7daf53' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'MaxConcurrency')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'a725f65a-60c6-4dcc-8158-b5e7fb7daf53',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100019,
            'MaxConcurrency',
            'Max Concurrency',
            'Optional maximum concurrency for evaluating an ActionBacked factor.',
            'int',
            4,
            10,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd8b7a755-e5da-4c7c-b6e3-927775ab34fe' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'RateLimitPerMinute')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'd8b7a755-e5da-4c7c-b6e3-927775ab34fe',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100020,
            'RateLimitPerMinute',
            'Rate Limit Per Minute',
            'Optional rate limit per minute for external-API-backed Actions.',
            'int',
            4,
            10,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '09197180-c8cf-490b-8f31-c2994a90c29c' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'CacheTTLSeconds')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '09197180-c8cf-490b-8f31-c2994a90c29c',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100021,
            'CacheTTLSeconds',
            'Cache TTL Seconds',
            'Result cache time-to-live in seconds, keyed by (anchor record, as-of date, params hash).',
            'int',
            4,
            10,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '049e70e5-0506-4422-80da-6834681b22c6' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'SourceScoreModelID')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '049e70e5-0506-4422-80da-6834681b22c6',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100022,
            'SourceScoreModelID',
            'Source Score Model ID',
            NULL,
            'uniqueidentifier',
            16,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA',
            'ID',
            0,
            0,
            1,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a9e4da7b-1798-41c7-8e52-39284aa32bea' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'RawDataType')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'a9e4da7b-1798-41c7-8e52-39284aa32bea',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100023,
            'RawDataType',
            'Raw Data Type',
            'Raw data type produced by the factor before normalization: Number, Date, Boolean, or Duration.',
            'nvarchar',
            24,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '62406be6-ae62-4c00-87cb-6e274a6a0c4b' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'NormalizationMethod')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '62406be6-ae62-4c00-87cb-6e274a6a0c4b',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100024,
            'NormalizationMethod',
            'Normalization Method',
            'Normalization method mapping the raw value to a contribution: None, MinMax, Percentile, ZScore, Logistic, Banded, or Lookup.',
            'nvarchar',
            40,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '7bf114bb-9439-4744-aa2e-81d491a4a959' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'NormalizationParamsJSON')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '7bf114bb-9439-4744-aa2e-81d491a4a959',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100025,
            'NormalizationParamsJSON',
            'Normalization Params JSON',
            'JSON parameters for the normalization method (clamps, percentile basis, logistic midpoint/steepness, banded thresholds, lookup table).',
            'nvarchar',
            -1,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'dba4f54c-7cc9-459e-b0a4-b25c0bf791ba' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'OutputMin')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'dba4f54c-7cc9-459e-b0a4-b25c0bf791ba',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100026,
            'OutputMin',
            'Output Min',
            'Lower bound of the normalized contribution range (e.g. 0).',
            'decimal',
            5,
            9,
            4,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '1c58de95-ca25-4dfe-9844-18a995160e7d' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'OutputMax')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '1c58de95-ca25-4dfe-9844-18a995160e7d',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100027,
            'OutputMax',
            'Output Max',
            'Upper bound of the normalized contribution range (e.g. 1).',
            'decimal',
            5,
            9,
            4,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '0368c1b5-1ef7-42b8-b798-b4e8b90dd324' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'HigherIsBetter')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '0368c1b5-1ef7-42b8-b798-b4e8b90dd324',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100028,
            'HigherIsBetter',
            'Higher Is Better',
            'Direction of the signal; when false, higher raw values are worse (e.g. days since last login).',
            'bit',
            1,
            1,
            0,
            0,
            '(1)',
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'b2ded539-7b7e-4177-b6da-239a7466af49' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'PromotionState')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'b2ded539-7b7e-4177-b6da-239a7466af49',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100029,
            'PromotionState',
            'Promotion State',
            'Governance state, enforced for ActionBacked factors before production use: Draft, InReview, Approved, or Deprecated.',
            'nvarchar',
            40,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd41235de-c181-4a33-90a1-171840c582a0' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'LastValidatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'd41235de-c181-4a33-90a1-171840c582a0',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100030,
            'LastValidatedAt',
            'Last Validated At',
            'UTC timestamp of the most recent validation of the factor.',
            'datetime2',
            8,
            27,
            7,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '7da3cec0-18db-40a8-8b53-3255a231f5d6' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'CreatedByAgent')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '7da3cec0-18db-40a8-8b53-3255a231f5d6',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100031,
            'CreatedByAgent',
            'Created By Agent',
            'Name of the AI agent that created the factor, if any (e.g. ModelBuilderAgent, ActionBuilder).',
            'nvarchar',
            120,
            0,
            0,
            1,
            NULL,
            0,
            1,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ad12db40-f522-4d3b-bb28-e95ff932199e' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = '__mj_CreatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ad12db40-f522-4d3b-bb28-e95ff932199e',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100032,
            '__mj_CreatedAt',
            'Created At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'c0f8b9b7-18cd-4073-a4b9-801efecdc889' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = '__mj_UpdatedAt')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'c0f8b9b7-18cd-4073-a4b9-801efecdc889',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100033,
            '__mj_UpdatedAt',
            'Updated At',
            NULL,
            'datetimeoffset',
            10,
            34,
            7,
            0,
            'getutcdate()',
            0,
            0,
            0,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to update existing entity fields from schema */
EXEC [${mjSchema}].[spUpdateExistingEntityFieldsFromSchema] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema}';

/* SQL text to set default column width where needed */
EXEC [${mjSchema}].[spSetDefaultColumnWidthWhereNeeded] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema}';

/* SQL text to insert entity field value with ID 989252b4-ae52-4004-9f89-0d837cdf10e2 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('989252b4-ae52-4004-9f89-0d837cdf10e2', '2A109A1C-692A-4320-B9FD-E5E3DE67C4D6', 1, 'Inner', 'Inner', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID e826c460-6562-4b5c-8269-613281ad1b14 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('e826c460-6562-4b5c-8269-613281ad1b14', '2A109A1C-692A-4320-B9FD-E5E3DE67C4D6', 2, 'Left', 'Left', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 2A109A1C-692A-4320-B9FD-E5E3DE67C4D6 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='2A109A1C-692A-4320-B9FD-E5E3DE67C4D6';

/* SQL text to insert entity field value with ID 6c77ffe2-c4c2-491a-be5e-b8b721d2aa67 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('6c77ffe2-c4c2-491a-be5e-b8b721d2aa67', '2F659474-8CE5-4395-AC06-6F1B2C9B0AB2', 1, 'ActionBacked', 'ActionBacked', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 0c4b5707-a288-4ba6-96f6-45008054abc0 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('0c4b5707-a288-4ba6-96f6-45008054abc0', '2F659474-8CE5-4395-AC06-6F1B2C9B0AB2', 2, 'Constant', 'Constant', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 04d15c59-f7d6-44fc-ac47-a54a162d7d67 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('04d15c59-f7d6-44fc-ac47-a54a162d7d67', '2F659474-8CE5-4395-AC06-6F1B2C9B0AB2', 3, 'Declarative', 'Declarative', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 818ed922-d2ec-49bf-a9d9-79b6621acd5f */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('818ed922-d2ec-49bf-a9d9-79b6621acd5f', '2F659474-8CE5-4395-AC06-6F1B2C9B0AB2', 4, 'DerivedFromScore', 'DerivedFromScore', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 2F659474-8CE5-4395-AC06-6F1B2C9B0AB2 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='2F659474-8CE5-4395-AC06-6F1B2C9B0AB2';

/* SQL text to insert entity field value with ID a266383c-4364-4bb2-9c0a-3618068f6dfb */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('a266383c-4364-4bb2-9c0a-3618068f6dfb', 'DBD1460C-6F9A-4AEF-A8BA-59B1519E299D', 1, 'Avg', 'Avg', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID cdc03d22-a274-4d08-a8d8-b7260922d6d7 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('cdc03d22-a274-4d08-a8d8-b7260922d6d7', 'DBD1460C-6F9A-4AEF-A8BA-59B1519E299D', 2, 'Count', 'Count', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 733ccb39-22b2-4921-9516-cfabee266804 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('733ccb39-22b2-4921-9516-cfabee266804', 'DBD1460C-6F9A-4AEF-A8BA-59B1519E299D', 3, 'DistinctCount', 'DistinctCount', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID fe48ffbe-c037-4337-b4ea-929f9b95484b */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('fe48ffbe-c037-4337-b4ea-929f9b95484b', 'DBD1460C-6F9A-4AEF-A8BA-59B1519E299D', 4, 'Exists', 'Exists', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID a34b08c1-5ff6-42c8-ace0-5727c3f86208 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('a34b08c1-5ff6-42c8-ace0-5727c3f86208', 'DBD1460C-6F9A-4AEF-A8BA-59B1519E299D', 5, 'Max', 'Max', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 4a187249-695d-4232-a977-8e03d2752c5e */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('4a187249-695d-4232-a977-8e03d2752c5e', 'DBD1460C-6F9A-4AEF-A8BA-59B1519E299D', 6, 'Min', 'Min', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 7e8e8c1d-533c-4e8b-8953-9f5b7ff75c78 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('7e8e8c1d-533c-4e8b-8953-9f5b7ff75c78', 'DBD1460C-6F9A-4AEF-A8BA-59B1519E299D', 7, 'RatePerPeriod', 'RatePerPeriod', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID e54df935-9819-4e0a-8510-129f37c9552c */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('e54df935-9819-4e0a-8510-129f37c9552c', 'DBD1460C-6F9A-4AEF-A8BA-59B1519E299D', 8, 'Recency', 'Recency', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 3f70ce80-24fe-40c5-b91b-94fee53ea856 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('3f70ce80-24fe-40c5-b91b-94fee53ea856', 'DBD1460C-6F9A-4AEF-A8BA-59B1519E299D', 9, 'Sum', 'Sum', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 665402a9-fdef-4e5d-8385-1b7644d8936f */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('665402a9-fdef-4e5d-8385-1b7644d8936f', 'DBD1460C-6F9A-4AEF-A8BA-59B1519E299D', 10, 'TrendSlope', 'TrendSlope', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID DBD1460C-6F9A-4AEF-A8BA-59B1519E299D */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='DBD1460C-6F9A-4AEF-A8BA-59B1519E299D';

/* SQL text to insert entity field value with ID 3037d63b-6113-4693-861a-344d51cfe334 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('3037d63b-6113-4693-861a-344d51cfe334', '83DFC6DD-F598-4404-920C-D91DD9598CA3', 1, 'Batch', 'Batch', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 2cbb1877-90fe-4522-ad25-dfe63b3b6e71 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('2cbb1877-90fe-4522-ad25-dfe63b3b6e71', '83DFC6DD-F598-4404-920C-D91DD9598CA3', 2, 'PerRecord', 'PerRecord', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 83DFC6DD-F598-4404-920C-D91DD9598CA3 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='83DFC6DD-F598-4404-920C-D91DD9598CA3';

/* SQL text to insert entity field value with ID 9192afda-8a5d-4e39-a7d8-bcf4792d1e80 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('9192afda-8a5d-4e39-a7d8-bcf4792d1e80', 'A9E4DA7B-1798-41C7-8E52-39284AA32BEA', 1, 'Boolean', 'Boolean', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID e67fd957-36b2-476f-97f7-8c9be5ee1950 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('e67fd957-36b2-476f-97f7-8c9be5ee1950', 'A9E4DA7B-1798-41C7-8E52-39284AA32BEA', 2, 'Date', 'Date', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID c4690bf0-f42d-4599-a908-e1762e6831f6 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('c4690bf0-f42d-4599-a908-e1762e6831f6', 'A9E4DA7B-1798-41C7-8E52-39284AA32BEA', 3, 'Duration', 'Duration', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID f9a47962-370d-4b56-98f8-1c966f79ae77 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('f9a47962-370d-4b56-98f8-1c966f79ae77', 'A9E4DA7B-1798-41C7-8E52-39284AA32BEA', 4, 'Number', 'Number', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID A9E4DA7B-1798-41C7-8E52-39284AA32BEA */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='A9E4DA7B-1798-41C7-8E52-39284AA32BEA';

/* SQL text to insert entity field value with ID 9aa28737-e20a-43e8-989d-e326e18db01f */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('9aa28737-e20a-43e8-989d-e326e18db01f', '62406BE6-AE62-4C00-87CB-6E274A6A0C4B', 1, 'Banded', 'Banded', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID e417b7cc-f533-4832-afb2-32a6473fb745 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('e417b7cc-f533-4832-afb2-32a6473fb745', '62406BE6-AE62-4C00-87CB-6E274A6A0C4B', 2, 'Logistic', 'Logistic', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID bd9aaffa-e52d-4977-9625-831664176549 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('bd9aaffa-e52d-4977-9625-831664176549', '62406BE6-AE62-4C00-87CB-6E274A6A0C4B', 3, 'Lookup', 'Lookup', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 09622ab4-41ae-4128-9c5b-277899c51292 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('09622ab4-41ae-4128-9c5b-277899c51292', '62406BE6-AE62-4C00-87CB-6E274A6A0C4B', 4, 'MinMax', 'MinMax', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 2121671d-2695-4c96-a8dc-24b4dd81f3ba */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('2121671d-2695-4c96-a8dc-24b4dd81f3ba', '62406BE6-AE62-4C00-87CB-6E274A6A0C4B', 5, 'None', 'None', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 84277d87-3d0d-4440-b16e-dc7dbc98753e */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('84277d87-3d0d-4440-b16e-dc7dbc98753e', '62406BE6-AE62-4C00-87CB-6E274A6A0C4B', 6, 'Percentile', 'Percentile', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID db9e2063-cbea-4701-bc11-a6335283fb6f */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('db9e2063-cbea-4701-bc11-a6335283fb6f', '62406BE6-AE62-4C00-87CB-6E274A6A0C4B', 7, 'ZScore', 'ZScore', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 62406BE6-AE62-4C00-87CB-6E274A6A0C4B */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='62406BE6-AE62-4C00-87CB-6E274A6A0C4B';

/* SQL text to insert entity field value with ID 287b0188-afed-49b5-8fc7-4797221c9559 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('287b0188-afed-49b5-8fc7-4797221c9559', 'B2DED539-7B7E-4177-B6DA-239A7466AF49', 1, 'Approved', 'Approved', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 07334f74-73b3-4543-8b9e-00dab75bd8dd */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('07334f74-73b3-4543-8b9e-00dab75bd8dd', 'B2DED539-7B7E-4177-B6DA-239A7466AF49', 2, 'Deprecated', 'Deprecated', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 10c2c374-1e18-433b-a167-341e13e45726 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('10c2c374-1e18-433b-a167-341e13e45726', 'B2DED539-7B7E-4177-B6DA-239A7466AF49', 3, 'Draft', 'Draft', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 7289645b-4e21-46dc-a11a-49d69d19916f */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('7289645b-4e21-46dc-a11a-49d69d19916f', 'B2DED539-7B7E-4177-B6DA-239A7466AF49', 4, 'InReview', 'InReview', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID B2DED539-7B7E-4177-B6DA-239A7466AF49 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='B2DED539-7B7E-4177-B6DA-239A7466AF49';

/* SQL text to insert entity field value with ID 48cd2732-fa8c-413d-afc4-ebcec5ec5386 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('48cd2732-fa8c-413d-afc4-ebcec5ec5386', '1A2114E1-670E-416D-B78B-69AE0270CDF6', 1, 'Additive', 'Additive', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 2c96a43c-2cc1-4d50-a6bd-c9aa6e27dc21 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('2c96a43c-2cc1-4d50-a6bd-c9aa6e27dc21', '1A2114E1-670E-416D-B78B-69AE0270CDF6', 2, 'Bonus', 'Bonus', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 78ab0e66-a625-4431-b275-751e804f123f */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('78ab0e66-a625-4431-b275-751e804f123f', '1A2114E1-670E-416D-B78B-69AE0270CDF6', 3, 'Gate', 'Gate', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 4abc13e8-ade5-4984-a5aa-d7cb5c04ecd1 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('4abc13e8-ade5-4984-a5aa-d7cb5c04ecd1', '1A2114E1-670E-416D-B78B-69AE0270CDF6', 4, 'Multiplier', 'Multiplier', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 1f5beaac-0302-4552-8860-f11f3e12a824 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('1f5beaac-0302-4552-8860-f11f3e12a824', '1A2114E1-670E-416D-B78B-69AE0270CDF6', 5, 'Penalty', 'Penalty', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 1A2114E1-670E-416D-B78B-69AE0270CDF6 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='1A2114E1-670E-416D-B78B-69AE0270CDF6';

/* SQL text to insert entity field value with ID d8123b51-a6dd-4c9c-af8c-e2b5d3cfb117 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('d8123b51-a6dd-4c9c-af8c-e2b5d3cfb117', '3716BF4B-D1C6-412C-9E8A-C456F9B4FFC2', 1, 'Exclude', 'Exclude', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID a99f4671-a5df-420d-8d03-4ee2dd5a4ab5 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('a99f4671-a5df-420d-8d03-4ee2dd5a4ab5', '3716BF4B-D1C6-412C-9E8A-C456F9B4FFC2', 2, 'ModelDefault', 'ModelDefault', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID ec169023-b99e-482e-a292-c44ac0bf047f */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('ec169023-b99e-482e-a292-c44ac0bf047f', '3716BF4B-D1C6-412C-9E8A-C456F9B4FFC2', 3, 'NeutralMidpoint', 'NeutralMidpoint', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 09381a33-b374-41f5-9f9e-32cb15a76e0d */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('09381a33-b374-41f5-9f9e-32cb15a76e0d', '3716BF4B-D1C6-412C-9E8A-C456F9B4FFC2', 4, 'Zero', 'Zero', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 3716BF4B-D1C6-412C-9E8A-C456F9B4FFC2 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='3716BF4B-D1C6-412C-9E8A-C456F9B4FFC2';

/* SQL text to insert entity field value with ID 98bf3eb2-3b0b-4e14-89b5-5d270cabe9d1 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('98bf3eb2-3b0b-4e14-89b5-5d270cabe9d1', '666EBAC5-0CCD-4738-8100-CE8300CF26FE', 1, 'Down', 'Down', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 78989c2e-15b7-4088-9650-e41231f8d308 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('78989c2e-15b7-4088-9650-e41231f8d308', '666EBAC5-0CCD-4738-8100-CE8300CF26FE', 2, 'Flat', 'Flat', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID dfbd8e58-1fc6-471a-8056-c2446f03757f */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('dfbd8e58-1fc6-471a-8056-c2446f03757f', '666EBAC5-0CCD-4738-8100-CE8300CF26FE', 3, 'Up', 'Up', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 666EBAC5-0CCD-4738-8100-CE8300CF26FE */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='666EBAC5-0CCD-4738-8100-CE8300CF26FE';

/* SQL text to insert entity field value with ID 50d81c68-ad41-4f7f-8823-3a6cde0a9078 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('50d81c68-ad41-4f7f-8823-3a6cde0a9078', '3427CD85-8F18-41BF-9251-A1D872752CA7', 1, 'Backfill', 'Backfill', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 4c799d1d-92df-421c-b6ac-0103df1b3427 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('4c799d1d-92df-421c-b6ac-0103df1b3427', '3427CD85-8F18-41BF-9251-A1D872752CA7', 2, 'Event', 'Event', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 2093f7a0-9279-4509-8e09-9c61697098f5 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('2093f7a0-9279-4509-8e09-9c61697098f5', '3427CD85-8F18-41BF-9251-A1D872752CA7', 3, 'Manual', 'Manual', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 0c374a40-78a9-40f9-8166-fd10a448d3bd */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('0c374a40-78a9-40f9-8166-fd10a448d3bd', '3427CD85-8F18-41BF-9251-A1D872752CA7', 4, 'Scheduled', 'Scheduled', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 3427CD85-8F18-41BF-9251-A1D872752CA7 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='3427CD85-8F18-41BF-9251-A1D872752CA7';

/* SQL text to insert entity field value with ID ee1a7106-b9b9-43fd-acac-4b0812e21b68 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('ee1a7106-b9b9-43fd-acac-4b0812e21b68', 'F42C3BB0-336C-4A3E-B4D2-A4BE8C5ED930', 1, 'FullPopulation', 'FullPopulation', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 67db60a4-3b90-4847-ac6e-ad2c38877703 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('67db60a4-3b90-4847-ac6e-ad2c38877703', 'F42C3BB0-336C-4A3E-B4D2-A4BE8C5ED930', 2, 'Incremental', 'Incremental', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID ad9fd11c-9087-4e60-94a3-0943f623508f */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('ad9fd11c-9087-4e60-94a3-0943f623508f', 'F42C3BB0-336C-4A3E-B4D2-A4BE8C5ED930', 3, 'SingleRecord', 'SingleRecord', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID F42C3BB0-336C-4A3E-B4D2-A4BE8C5ED930 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='F42C3BB0-336C-4A3E-B4D2-A4BE8C5ED930';

/* SQL text to insert entity field value with ID 1799fcda-ae66-43ac-871c-392c88718eed */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('1799fcda-ae66-43ac-871c-392c88718eed', '52A2B243-D228-4745-8C1A-9EDEEF3FEEF7', 1, 'Failed', 'Failed', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID dd817630-41af-4c0b-86c4-c3b3524946e5 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('dd817630-41af-4c0b-86c4-c3b3524946e5', '52A2B243-D228-4745-8C1A-9EDEEF3FEEF7', 2, 'PartialSuccess', 'PartialSuccess', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID a2eabb18-0e21-493f-8e47-66706953d6d4 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('a2eabb18-0e21-493f-8e47-66706953d6d4', '52A2B243-D228-4745-8C1A-9EDEEF3FEEF7', 3, 'Running', 'Running', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 2b8beadb-9e9d-473f-a18a-0d1ddd5ce11c */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('2b8beadb-9e9d-473f-a18a-0d1ddd5ce11c', '52A2B243-D228-4745-8C1A-9EDEEF3FEEF7', 4, 'Succeeded', 'Succeeded', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 52A2B243-D228-4745-8C1A-9EDEEF3FEEF7 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='52A2B243-D228-4745-8C1A-9EDEEF3FEEF7';

/* SQL text to insert entity field value with ID cbf11191-3e1e-4d10-a020-0d6b6ca06f8e */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('cbf11191-3e1e-4d10-a020-0d6b6ca06f8e', 'F5682771-4957-4849-A445-FA3B57C263F7', 1, 'Improving', 'Improving', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID b520db9a-d44c-46f5-8369-3a8d27ccb50e */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('b520db9a-d44c-46f5-8369-3a8d27ccb50e', 'F5682771-4957-4849-A445-FA3B57C263F7', 2, 'Worsening', 'Worsening', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID F5682771-4957-4849-A445-FA3B57C263F7 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='F5682771-4957-4849-A445-FA3B57C263F7';

/* SQL text to insert entity field value with ID e38298b4-8c09-4114-a82b-14811c512549 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('e38298b4-8c09-4114-a82b-14811c512549', '79679E18-2360-4316-AF26-F15F9FC50163', 1, 'Create', 'Create', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 6dc2d119-e1af-41b0-9efc-8bfa21cc6046 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('6dc2d119-e1af-41b0-9efc-8bfa21cc6046', '79679E18-2360-4316-AF26-F15F9FC50163', 2, 'Delete', 'Delete', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 2a1382be-ed8b-4025-8641-a9362b8b4996 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('2a1382be-ed8b-4025-8641-a9362b8b4996', '79679E18-2360-4316-AF26-F15F9FC50163', 3, 'Publish', 'Publish', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID f04bc306-e43e-44a3-b47d-1529e279f80e */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('f04bc306-e43e-44a3-b47d-1529e279f80e', '79679E18-2360-4316-AF26-F15F9FC50163', 4, 'Update', 'Update', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 79679E18-2360-4316-AF26-F15F9FC50163 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='79679E18-2360-4316-AF26-F15F9FC50163';

/* SQL text to insert entity field value with ID e40d7fb9-8435-4320-844d-6d87cfc58ee0 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('e40d7fb9-8435-4320-844d-6d87cfc58ee0', 'B61E2F94-7057-468B-8676-8356C7C41488', 1, 'AllTime', 'AllTime', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID d35c8784-f10d-41ca-aa8a-8dc7554f04b4 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('d35c8784-f10d-41ca-aa8a-8dc7554f04b4', 'B61E2F94-7057-468B-8676-8356C7C41488', 2, 'Calendar', 'Calendar', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 6ecb53f0-436f-4b35-9457-3f19ea8c4e4c */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('6ecb53f0-436f-4b35-9457-3f19ea8c4e4c', 'B61E2F94-7057-468B-8676-8356C7C41488', 3, 'RenewalRelative', 'RenewalRelative', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID c67672e1-81c9-4ed4-9582-503461278701 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('c67672e1-81c9-4ed4-9582-503461278701', 'B61E2F94-7057-468B-8676-8356C7C41488', 4, 'Rolling', 'Rolling', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 4bf3e604-2a80-49d9-8b82-c6f222fd5df1 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('4bf3e604-2a80-49d9-8b82-c6f222fd5df1', 'B61E2F94-7057-468B-8676-8356C7C41488', 5, 'SinceEvent', 'SinceEvent', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID B61E2F94-7057-468B-8676-8356C7C41488 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='B61E2F94-7057-468B-8676-8356C7C41488';

/* SQL text to insert entity field value with ID 7282fb48-0571-45f5-a175-bb149ad063a6 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('7282fb48-0571-45f5-a175-bb149ad063a6', '557E7ED6-275D-4CC5-9F34-ED67C7E5F113', 1, 'Active', 'Active', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID c17b4458-53fc-4e6e-819b-47d755076739 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('c17b4458-53fc-4e6e-819b-47d755076739', '557E7ED6-275D-4CC5-9F34-ED67C7E5F113', 2, 'Archived', 'Archived', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 8240b9f3-e3db-44de-8d94-94e581c8a8d0 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('8240b9f3-e3db-44de-8d94-94e581c8a8d0', '557E7ED6-275D-4CC5-9F34-ED67C7E5F113', 3, 'Draft', 'Draft', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 4cce8e75-afa9-4d35-ae34-f390a1e775e7 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('4cce8e75-afa9-4d35-ae34-f390a1e775e7', '557E7ED6-275D-4CC5-9F34-ED67C7E5F113', 4, 'Paused', 'Paused', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 557E7ED6-275D-4CC5-9F34-ED67C7E5F113 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='557E7ED6-275D-4CC5-9F34-ED67C7E5F113';

/* SQL text to insert entity field value with ID 4257c42f-68cd-441e-8949-c05d68028fde */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('4257c42f-68cd-441e-8949-c05d68028fde', '337318E5-909A-4BF0-BBEB-A636FA40297D', 1, 'Banded', 'Banded', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 92e71883-3151-4cbb-b064-282a4b08021e */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('92e71883-3151-4cbb-b064-282a4b08021e', '337318E5-909A-4BF0-BBEB-A636FA40297D', 2, 'ExpressionDriven', 'ExpressionDriven', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID d1d68be5-3498-400f-a078-e6bf242e72d6 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('d1d68be5-3498-400f-a078-e6bf242e72d6', '337318E5-909A-4BF0-BBEB-A636FA40297D', 3, 'WeightedAvg', 'WeightedAvg', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 7c830178-dd3f-40e1-8377-862d9474d959 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('7c830178-dd3f-40e1-8377-862d9474d959', '337318E5-909A-4BF0-BBEB-A636FA40297D', 4, 'WeightedSum', 'WeightedSum', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 58e94bef-a5b8-4545-96d0-92ff9a2db6c9 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('58e94bef-a5b8-4545-96d0-92ff9a2db6c9', '337318E5-909A-4BF0-BBEB-A636FA40297D', 5, 'ZScoreComposite', 'ZScoreComposite', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 337318E5-909A-4BF0-BBEB-A636FA40297D */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='337318E5-909A-4BF0-BBEB-A636FA40297D';

/* SQL text to insert entity field value with ID 2c43d675-d565-428e-99e2-38e30818b3b9 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('2c43d675-d565-428e-99e2-38e30818b3b9', '498AB9B6-66AB-4476-8176-F1707242695A', 1, 'EventDriven', 'EventDriven', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 404e76fc-35f0-40eb-8c40-b19d377ac29b */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('404e76fc-35f0-40eb-8c40-b19d377ac29b', '498AB9B6-66AB-4476-8176-F1707242695A', 2, 'Hybrid', 'Hybrid', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID 7cc7c0c8-68aa-462e-8caf-fe4b87733dee */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('7cc7c0c8-68aa-462e-8caf-fe4b87733dee', '498AB9B6-66AB-4476-8176-F1707242695A', 3, 'OnDemand', 'OnDemand', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID f672b294-4223-435a-8269-895589e12dd9 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('f672b294-4223-435a-8269-895589e12dd9', '498AB9B6-66AB-4476-8176-F1707242695A', 4, 'Scheduled', 'Scheduled', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 498AB9B6-66AB-4476-8176-F1707242695A */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='498AB9B6-66AB-4476-8176-F1707242695A';

/* SQL text to insert entity field value with ID 98d327c5-6373-4f34-9c47-b70ce7e0502e */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('98d327c5-6373-4f34-9c47-b70ce7e0502e', '3E3C2ED9-7C47-4DCF-A233-9911CFFABB46', 1, 'EndOfPreviousDay', 'EndOfPreviousDay', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID f6ae856d-c0dd-4469-b2bf-92b1b889ac89 */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('f6ae856d-c0dd-4469-b2bf-92b1b889ac89', '3E3C2ED9-7C47-4DCF-A233-9911CFFABB46', 2, 'Fixed', 'Fixed', GETUTCDATE(), GETUTCDATE());

/* SQL text to insert entity field value with ID aa2843bc-d806-432b-9dc1-93aa2510615f */
INSERT INTO [${mjSchema}].[EntityFieldValue]
                                       ([ID], [EntityFieldID], [Sequence], [Value], [Code], [__mj_CreatedAt], [__mj_UpdatedAt])
                                    VALUES
                                       ('aa2843bc-d806-432b-9dc1-93aa2510615f', '3E3C2ED9-7C47-4DCF-A233-9911CFFABB46', 3, 'RunTime', 'RunTime', GETUTCDATE(), GETUTCDATE());

/* SQL text to update ValueListType for entity field ID 3E3C2ED9-7C47-4DCF-A233-9911CFFABB46 */
UPDATE [${mjSchema}].[EntityField] SET ValueListType='List' WHERE ID='3E3C2ED9-7C47-4DCF-A233-9911CFFABB46';


/* Create Entity Relationship: MJ_BizApps_Sonar: Scores -> MJ_BizApps_Sonar: Score Factor Contributions (One To Many via ScoreID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'cbb24a6e-d8e4-4678-a03e-075733f73865'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('cbb24a6e-d8e4-4678-a03e-075733f73865', '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', '5B986A39-E155-4EB8-9AFD-C1BD6A43548C', 'ScoreID', 'One To Many', 1, 1, 1, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Sonar: Model Related Entities -> MJ_BizApps_Sonar: Factors (One To Many via SourceRelatedEntityID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '8e369687-13f1-4133-96f6-190ab62807e9'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('8e369687-13f1-4133-96f6-190ab62807e9', '710B4C24-C185-4693-B958-2525655E3D20', '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', 'SourceRelatedEntityID', 'One To Many', 1, 1, 1, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ: Entities -> MJ_BizApps_Sonar: Score Models (One To Many via AnchorEntityID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '2ca42b56-a74b-425b-89c3-2356fe5bb1ac'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('2ca42b56-a74b-425b-89c3-2356fe5bb1ac', 'E0238F34-2837-EF11-86D4-6045BDEE16E6', '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', 'AnchorEntityID', 'One To Many', 1, 1, 63, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ: Entities -> MJ_BizApps_Sonar: Score Band Sets (One To Many via AnchorEntityID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '5df5995f-1822-4ca9-bafd-c8e0acef8ee3'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('5df5995f-1822-4ca9-bafd-c8e0acef8ee3', 'E0238F34-2837-EF11-86D4-6045BDEE16E6', 'EF29D394-6120-4356-BAEA-A66D36F6580B', 'AnchorEntityID', 'One To Many', 1, 1, 64, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ: Entities -> MJ_BizApps_Sonar: Factors (One To Many via AnchorEntityID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '2defe391-54a0-4fb4-9070-43adb7896a3e'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('2defe391-54a0-4fb4-9070-43adb7896a3e', 'E0238F34-2837-EF11-86D4-6045BDEE16E6', '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', 'AnchorEntityID', 'One To Many', 1, 1, 65, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ: Entities -> MJ_BizApps_Sonar: Factors (One To Many via SourceEntityID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'e1932076-61b3-47d2-b220-d714f8412840'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('e1932076-61b3-47d2-b220-d714f8412840', 'E0238F34-2837-EF11-86D4-6045BDEE16E6', '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', 'SourceEntityID', 'One To Many', 1, 1, 66, GETUTCDATE(), GETUTCDATE())
   END;


/* Create Entity Relationship: MJ: Entities -> MJ_BizApps_Sonar: Scores (One To Many via AnchorEntityID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'ceed3639-c11e-41b9-bda7-851a73449060'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('ceed3639-c11e-41b9-bda7-851a73449060', 'E0238F34-2837-EF11-86D4-6045BDEE16E6', '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', 'AnchorEntityID', 'One To Many', 1, 1, 67, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ: Entities -> MJ_BizApps_Sonar: Model Related Entities (One To Many via RelatedEntityID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'cb8f1a57-b817-4f36-97d8-9d6b265bcd38'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('cb8f1a57-b817-4f36-97d8-9d6b265bcd38', 'E0238F34-2837-EF11-86D4-6045BDEE16E6', '710B4C24-C185-4693-B958-2525655E3D20', 'RelatedEntityID', 'One To Many', 1, 1, 68, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ: Entities -> MJ_BizApps_Sonar: Score Histories (One To Many via AnchorEntityID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '5a58f862-25df-422d-8862-acc07399a485'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('5a58f862-25df-422d-8862-acc07399a485', 'E0238F34-2837-EF11-86D4-6045BDEE16E6', '1F1CBA7E-F548-420E-9B71-30891E454C42', 'AnchorEntityID', 'One To Many', 1, 1, 69, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ: Users -> MJ_BizApps_Sonar: Score Model Versions (One To Many via PublishedByUserID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'cd09043e-4b26-42c6-bfc5-629607c2b6e9'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('cd09043e-4b26-42c6-bfc5-629607c2b6e9', 'E1238F34-2837-EF11-86D4-6045BDEE16E6', 'D9590BBC-23DF-4571-AB80-DD3C651ABC16', 'PublishedByUserID', 'One To Many', 1, 1, 103, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ: Users -> MJ_BizApps_Sonar: Score Model Audit Events (One To Many via ChangedByUserID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '59c7f147-8da8-4dda-bf97-66303a9415ac'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('59c7f147-8da8-4dda-bf97-66303a9415ac', 'E1238F34-2837-EF11-86D4-6045BDEE16E6', '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41', 'ChangedByUserID', 'One To Many', 1, 1, 104, GETUTCDATE(), GETUTCDATE())
   END;


/* Create Entity Relationship: MJ: Users -> MJ_BizApps_Sonar: Score Models (One To Many via OwnerUserID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '62b81399-9845-4700-980b-ccc5cf1157fc'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('62b81399-9845-4700-980b-ccc5cf1157fc', 'E1238F34-2837-EF11-86D4-6045BDEE16E6', '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', 'OwnerUserID', 'One To Many', 1, 1, 105, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ: Actions -> MJ_BizApps_Sonar: Factors (One To Many via ActionID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '629ed9f6-71ce-49a1-aca9-2629d1ac5a28'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('629ed9f6-71ce-49a1-aca9-2629d1ac5a28', '38248F34-2837-EF11-86D4-6045BDEE16E6', '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', 'ActionID', 'One To Many', 1, 1, 13, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Sonar: Score Recompute Runs -> MJ_BizApps_Sonar: Score Band Transitions (One To Many via RecomputeRunID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '9a5bb43f-31a4-4a56-a373-a7d88077d339'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('9a5bb43f-31a4-4a56-a373-a7d88077d339', 'E9029A00-C998-4B76-B347-70F935E9797D', '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2', 'RecomputeRunID', 'One To Many', 1, 1, 1, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Sonar: Score Models -> MJ_BizApps_Sonar: Score Histories (One To Many via ScoreModelID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '716974af-6eb4-4bb9-b1e8-fac952121c9f'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('716974af-6eb4-4bb9-b1e8-fac952121c9f', '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', '1F1CBA7E-F548-420E-9B71-30891E454C42', 'ScoreModelID', 'One To Many', 1, 1, 1, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Sonar: Score Models -> MJ_BizApps_Sonar: Score Band Transitions (One To Many via ScoreModelID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'af2c63d6-13e4-4ccc-a737-833aa233521d'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('af2c63d6-13e4-4ccc-a737-833aa233521d', '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2', 'ScoreModelID', 'One To Many', 1, 1, 2, GETUTCDATE(), GETUTCDATE())
   END;


/* Create Entity Relationship: MJ_BizApps_Sonar: Score Models -> MJ_BizApps_Sonar: Score Recompute Runs (One To Many via ScoreModelID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '6d9b8471-98a3-44fb-b1f3-c2129dbc4b5e'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('6d9b8471-98a3-44fb-b1f3-c2129dbc4b5e', '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', 'E9029A00-C998-4B76-B347-70F935E9797D', 'ScoreModelID', 'One To Many', 1, 1, 3, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Sonar: Score Models -> MJ_BizApps_Sonar: Scores (One To Many via ScoreModelID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '562d7f68-e745-462b-8c89-8461a95ebfa0'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('562d7f68-e745-462b-8c89-8461a95ebfa0', '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', 'ScoreModelID', 'One To Many', 1, 1, 4, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Sonar: Score Models -> MJ_BizApps_Sonar: Score Model Audit Events (One To Many via ScoreModelID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '28cedb79-baff-4e64-8ef5-6e9d3464318f'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('28cedb79-baff-4e64-8ef5-6e9d3464318f', '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41', 'ScoreModelID', 'One To Many', 1, 1, 5, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Sonar: Score Models -> MJ_BizApps_Sonar: Factors (One To Many via ScoreModelID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'b3f1c39d-289e-43a3-9cff-baadbe8c4844'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('b3f1c39d-289e-43a3-9cff-baadbe8c4844', '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', 'ScoreModelID', 'One To Many', 1, 1, 6, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Sonar: Score Models -> MJ_BizApps_Sonar: Factors (One To Many via SourceScoreModelID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '115d2b93-d241-4f3c-bd9b-ae49ca178e44'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('115d2b93-d241-4f3c-bd9b-ae49ca178e44', '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', 'SourceScoreModelID', 'One To Many', 1, 1, 7, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Sonar: Score Models -> MJ_BizApps_Sonar: Model Factors (One To Many via ScoreModelID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'bc9c1d56-4298-4b04-b94b-204ba2f200a0'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('bc9c1d56-4298-4b04-b94b-204ba2f200a0', '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', 'AFA51FA5-B85B-49DE-8905-D60B23D07DFA', 'ScoreModelID', 'One To Many', 1, 1, 8, GETUTCDATE(), GETUTCDATE())
   END;


/* Create Entity Relationship: MJ_BizApps_Sonar: Score Models -> MJ_BizApps_Sonar: Score Model Versions (One To Many via ScoreModelID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'f7671edc-1bd6-43d2-ade9-8479b59bc423'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('f7671edc-1bd6-43d2-ade9-8479b59bc423', '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', 'D9590BBC-23DF-4571-AB80-DD3C651ABC16', 'ScoreModelID', 'One To Many', 1, 1, 9, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Sonar: Score Models -> MJ_BizApps_Sonar: Model Related Entities (One To Many via ScoreModelID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '7144532e-350b-4b6e-9e9a-ebd603a5417f'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('7144532e-350b-4b6e-9e9a-ebd603a5417f', '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', '710B4C24-C185-4693-B958-2525655E3D20', 'ScoreModelID', 'One To Many', 1, 1, 10, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Sonar: Score Band Sets -> MJ_BizApps_Sonar: Score Bands (One To Many via BandSetID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '382d85e0-b08d-4d41-90de-e5da88c55d4d'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('382d85e0-b08d-4d41-90de-e5da88c55d4d', 'EF29D394-6120-4356-BAEA-A66D36F6580B', '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A', 'BandSetID', 'One To Many', 1, 1, 1, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Sonar: Score Band Sets -> MJ_BizApps_Sonar: Score Models (One To Many via BandSetID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '918d9143-ae3b-40c2-849c-58914054da6f'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('918d9143-ae3b-40c2-849c-58914054da6f', 'EF29D394-6120-4356-BAEA-A66D36F6580B', '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', 'BandSetID', 'One To Many', 1, 1, 2, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Sonar: Time Windows -> MJ_BizApps_Sonar: Factors (One To Many via TimeWindowID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '1fafd5bd-d189-4a0b-99dc-e55fe5363454'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('1fafd5bd-d189-4a0b-99dc-e55fe5363454', '77581BAB-4F3C-4D59-82B6-A8E04A03CC2C', '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', 'TimeWindowID', 'One To Many', 1, 1, 1, GETUTCDATE(), GETUTCDATE())
   END;


/* Create Entity Relationship: MJ_BizApps_Sonar: Model Factors -> MJ_BizApps_Sonar: Score Factor Contributions (One To Many via ModelFactorID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '68669bd7-951f-45d2-8694-f10e46d304b6'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('68669bd7-951f-45d2-8694-f10e46d304b6', 'AFA51FA5-B85B-49DE-8905-D60B23D07DFA', '5B986A39-E155-4EB8-9AFD-C1BD6A43548C', 'ModelFactorID', 'One To Many', 1, 1, 1, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Sonar: Score Bands -> MJ_BizApps_Sonar: Scores (One To Many via BandID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'dcdc84a1-0b9d-47f7-a296-3fc1aa6c9807'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('dcdc84a1-0b9d-47f7-a296-3fc1aa6c9807', '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A', '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', 'BandID', 'One To Many', 1, 1, 1, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Sonar: Score Bands -> MJ_BizApps_Sonar: Scores (One To Many via PreviousBandID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '6b105a33-a1a4-42c6-beb2-8d4fd36dd3a4'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('6b105a33-a1a4-42c6-beb2-8d4fd36dd3a4', '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A', '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', 'PreviousBandID', 'One To Many', 1, 1, 2, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Sonar: Score Bands -> MJ_BizApps_Sonar: Score Histories (One To Many via BandID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'aa8ee743-9970-45eb-8e07-e898d5151353'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('aa8ee743-9970-45eb-8e07-e898d5151353', '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A', '1F1CBA7E-F548-420E-9B71-30891E454C42', 'BandID', 'One To Many', 1, 1, 3, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Sonar: Score Bands -> MJ_BizApps_Sonar: Score Band Transitions (One To Many via FromBandID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '0e681162-3c95-4a61-91d0-178e2783dfbd'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('0e681162-3c95-4a61-91d0-178e2783dfbd', '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A', '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2', 'FromBandID', 'One To Many', 1, 1, 4, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Sonar: Score Bands -> MJ_BizApps_Sonar: Score Band Transitions (One To Many via ToBandID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'c61b8e84-53bd-4278-8059-32f916783c23'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('c61b8e84-53bd-4278-8059-32f916783c23', '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A', '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2', 'ToBandID', 'One To Many', 1, 1, 5, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Sonar: Score Model Versions -> MJ_BizApps_Sonar: Score Recompute Runs (One To Many via ScoreModelVersionID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '827a042d-391d-4486-9267-b4e607a3ff60'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('827a042d-391d-4486-9267-b4e607a3ff60', 'D9590BBC-23DF-4571-AB80-DD3C651ABC16', 'E9029A00-C998-4B76-B347-70F935E9797D', 'ScoreModelVersionID', 'One To Many', 1, 1, 1, GETUTCDATE(), GETUTCDATE())
   END;


/* Create Entity Relationship: MJ_BizApps_Sonar: Score Model Versions -> MJ_BizApps_Sonar: Scores (One To Many via ScoreModelVersionID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '11df2a6c-1859-4fe5-8c2c-ad28e5b4c68a'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('11df2a6c-1859-4fe5-8c2c-ad28e5b4c68a', 'D9590BBC-23DF-4571-AB80-DD3C651ABC16', '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', 'ScoreModelVersionID', 'One To Many', 1, 1, 2, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Sonar: Score Model Versions -> MJ_BizApps_Sonar: Score Histories (One To Many via ScoreModelVersionID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = 'c655207e-46ba-417f-a221-5c220752ed21'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('c655207e-46ba-417f-a221-5c220752ed21', 'D9590BBC-23DF-4571-AB80-DD3C651ABC16', '1F1CBA7E-F548-420E-9B71-30891E454C42', 'ScoreModelVersionID', 'One To Many', 1, 1, 3, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Sonar: Score Model Versions -> MJ_BizApps_Sonar: Score Models (One To Many via CurrentVersionID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '5a78e203-7bc7-46c6-88bc-22ac7fb2efdd'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('5a78e203-7bc7-46c6-88bc-22ac7fb2efdd', 'D9590BBC-23DF-4571-AB80-DD3C651ABC16', '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', 'CurrentVersionID', 'One To Many', 1, 1, 4, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Sonar: Factors -> MJ_BizApps_Sonar: Model Factors (One To Many via FactorID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '064c8c95-a171-4559-9bd8-cc51a0b430c0'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('064c8c95-a171-4559-9bd8-cc51a0b430c0', '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', 'AFA51FA5-B85B-49DE-8905-D60B23D07DFA', 'FactorID', 'One To Many', 1, 1, 1, GETUTCDATE(), GETUTCDATE())
   END;
                    
/* Create Entity Relationship: MJ_BizApps_Sonar: Factors -> MJ_BizApps_Sonar: Score Factor Contributions (One To Many via FactorID) */
   IF NOT EXISTS (
      SELECT 1 FROM [${mjSchema}].[EntityRelationship] WHERE [ID] = '5e385083-a922-45de-9099-1a7998dd1f0e'
   )
   BEGIN
      INSERT INTO [${mjSchema}].[EntityRelationship] ([ID], [EntityID], [RelatedEntityID], [RelatedEntityJoinField], [Type], [BundleInAPI], [DisplayInForm], [Sequence], [__mj_CreatedAt], [__mj_UpdatedAt])
                    VALUES ('5e385083-a922-45de-9099-1a7998dd1f0e', '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', '5B986A39-E155-4EB8-9AFD-C1BD6A43548C', 'FactorID', 'One To Many', 1, 1, 2, GETUTCDATE(), GETUTCDATE())
   END;

/* SQL text to sync schema info from database schemas */
EXEC [${mjSchema}].[spUpdateSchemaInfoFromDatabase] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema}';

/* Index for Foreign Keys for Factor */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Factors
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------
-- Index for foreign key ScoreModelID in table Factor
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_Factor_ScoreModelID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[Factor]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_Factor_ScoreModelID ON [${flyway:defaultSchema}].[Factor] ([ScoreModelID]);

-- Index for foreign key AnchorEntityID in table Factor
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_Factor_AnchorEntityID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[Factor]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_Factor_AnchorEntityID ON [${flyway:defaultSchema}].[Factor] ([AnchorEntityID]);

-- Index for foreign key SourceRelatedEntityID in table Factor
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_Factor_SourceRelatedEntityID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[Factor]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_Factor_SourceRelatedEntityID ON [${flyway:defaultSchema}].[Factor] ([SourceRelatedEntityID]);

-- Index for foreign key SourceEntityID in table Factor
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_Factor_SourceEntityID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[Factor]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_Factor_SourceEntityID ON [${flyway:defaultSchema}].[Factor] ([SourceEntityID]);

-- Index for foreign key TimeWindowID in table Factor
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_Factor_TimeWindowID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[Factor]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_Factor_TimeWindowID ON [${flyway:defaultSchema}].[Factor] ([TimeWindowID]);

-- Index for foreign key ActionID in table Factor
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_Factor_ActionID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[Factor]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_Factor_ActionID ON [${flyway:defaultSchema}].[Factor] ([ActionID]);

-- Index for foreign key SourceScoreModelID in table Factor
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_Factor_SourceScoreModelID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[Factor]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_Factor_SourceScoreModelID ON [${flyway:defaultSchema}].[Factor] ([SourceScoreModelID]);

/* SQL text to update entity field related entity name field map for entity field ID 76D14198-90E7-4B05-B922-CEC26BCD46D3 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='76D14198-90E7-4B05-B922-CEC26BCD46D3', @RelatedEntityNameFieldMap='ScoreModel';

/* Index for Foreign Keys for ModelFactor */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Model Factors
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------
-- Index for foreign key ScoreModelID in table ModelFactor
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ModelFactor_ScoreModelID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ModelFactor]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ModelFactor_ScoreModelID ON [${flyway:defaultSchema}].[ModelFactor] ([ScoreModelID]);

-- Index for foreign key FactorID in table ModelFactor
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ModelFactor_FactorID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ModelFactor]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ModelFactor_FactorID ON [${flyway:defaultSchema}].[ModelFactor] ([FactorID]);

/* SQL text to update entity field related entity name field map for entity field ID 771DA076-BC63-4F40-937B-E518DE5BE2DC */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='771DA076-BC63-4F40-937B-E518DE5BE2DC', @RelatedEntityNameFieldMap='ScoreModel';

/* Index for Foreign Keys for ModelRelatedEntity */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Model Related Entities
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------
-- Index for foreign key ScoreModelID in table ModelRelatedEntity
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ModelRelatedEntity_ScoreModelID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ModelRelatedEntity]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ModelRelatedEntity_ScoreModelID ON [${flyway:defaultSchema}].[ModelRelatedEntity] ([ScoreModelID]);

-- Index for foreign key RelatedEntityID in table ModelRelatedEntity
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ModelRelatedEntity_RelatedEntityID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ModelRelatedEntity]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ModelRelatedEntity_RelatedEntityID ON [${flyway:defaultSchema}].[ModelRelatedEntity] ([RelatedEntityID]);

/* SQL text to update entity field related entity name field map for entity field ID FC346460-3867-4ABE-BA2A-F3B33798ACBE */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='FC346460-3867-4ABE-BA2A-F3B33798ACBE', @RelatedEntityNameFieldMap='ScoreModel';

/* Index for Foreign Keys for ScoreBandSet */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Band Sets
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------
-- Index for foreign key AnchorEntityID in table ScoreBandSet
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ScoreBandSet_AnchorEntityID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ScoreBandSet]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ScoreBandSet_AnchorEntityID ON [${flyway:defaultSchema}].[ScoreBandSet] ([AnchorEntityID]);

/* SQL text to update entity field related entity name field map for entity field ID 79945F71-6D7F-4109-967A-2C12FBEDBC92 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='79945F71-6D7F-4109-967A-2C12FBEDBC92', @RelatedEntityNameFieldMap='AnchorEntity';

/* Index for Foreign Keys for ScoreBandTransition */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Band Transitions
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------
-- Index for foreign key ScoreModelID in table ScoreBandTransition
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ScoreBandTransition_ScoreModelID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ScoreBandTransition]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ScoreBandTransition_ScoreModelID ON [${flyway:defaultSchema}].[ScoreBandTransition] ([ScoreModelID]);

-- Index for foreign key FromBandID in table ScoreBandTransition
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ScoreBandTransition_FromBandID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ScoreBandTransition]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ScoreBandTransition_FromBandID ON [${flyway:defaultSchema}].[ScoreBandTransition] ([FromBandID]);

-- Index for foreign key ToBandID in table ScoreBandTransition
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ScoreBandTransition_ToBandID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ScoreBandTransition]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ScoreBandTransition_ToBandID ON [${flyway:defaultSchema}].[ScoreBandTransition] ([ToBandID]);

-- Index for foreign key RecomputeRunID in table ScoreBandTransition
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ScoreBandTransition_RecomputeRunID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ScoreBandTransition]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ScoreBandTransition_RecomputeRunID ON [${flyway:defaultSchema}].[ScoreBandTransition] ([RecomputeRunID]);

/* SQL text to update entity field related entity name field map for entity field ID 54501BD9-4C52-4080-9BF4-34F2ED3D443C */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='54501BD9-4C52-4080-9BF4-34F2ED3D443C', @RelatedEntityNameFieldMap='ScoreModel';

/* SQL text to update entity field related entity name field map for entity field ID 48C777EC-0D9E-4724-B078-C214194A5561 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='48C777EC-0D9E-4724-B078-C214194A5561', @RelatedEntityNameFieldMap='AnchorEntity';

/* SQL text to update entity field related entity name field map for entity field ID 859EB4C3-D2A9-468A-B160-34727816B46E */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='859EB4C3-D2A9-468A-B160-34727816B46E', @RelatedEntityNameFieldMap='Factor';

/* Base View SQL for MJ_BizApps_Sonar: Score Band Sets */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Band Sets
-- Item: vwScoreBandSets
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MJ_BizApps_Sonar: Score Band Sets
-----               SCHEMA:      ${flyway:defaultSchema}
-----               BASE TABLE:  ScoreBandSet
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[vwScoreBandSets]', 'V') IS NOT NULL
    DROP VIEW [${flyway:defaultSchema}].[vwScoreBandSets];
GO

CREATE VIEW [${flyway:defaultSchema}].[vwScoreBandSets]
AS
SELECT
    s.*,
    MJEntity_AnchorEntityID.[Name] AS [AnchorEntity]
FROM
    [${flyway:defaultSchema}].[ScoreBandSet] AS s
LEFT OUTER JOIN
    [${mjSchema}].[Entity] AS MJEntity_AnchorEntityID
  ON
    [s].[AnchorEntityID] = MJEntity_AnchorEntityID.[ID]
GO
GRANT SELECT ON [${flyway:defaultSchema}].[vwScoreBandSets] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MJ_BizApps_Sonar: Score Band Sets */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Band Sets
-- Item: Permissions for vwScoreBandSets
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [${flyway:defaultSchema}].[vwScoreBandSets] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MJ_BizApps_Sonar: Score Band Sets */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Band Sets
-- Item: spCreateScoreBandSet
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR ScoreBandSet
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spCreateScoreBandSet]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spCreateScoreBandSet];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spCreateScoreBandSet]
    @ID uniqueidentifier = NULL,
    @Name nvarchar(200),
    @AnchorEntityID_Clear bit = 0,
    @AnchorEntityID uniqueidentifier = NULL,
    @Description_Clear bit = 0,
    @Description nvarchar(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)
    
    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [${flyway:defaultSchema}].[ScoreBandSet]
            (
                [ID],
                [Name],
                [AnchorEntityID],
                [Description]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @Name,
                CASE WHEN @AnchorEntityID_Clear = 1 THEN NULL ELSE ISNULL(@AnchorEntityID, NULL) END,
                CASE WHEN @Description_Clear = 1 THEN NULL ELSE ISNULL(@Description, NULL) END
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [${flyway:defaultSchema}].[ScoreBandSet]
            (
                [Name],
                [AnchorEntityID],
                [Description]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @Name,
                CASE WHEN @AnchorEntityID_Clear = 1 THEN NULL ELSE ISNULL(@AnchorEntityID, NULL) END,
                CASE WHEN @Description_Clear = 1 THEN NULL ELSE ISNULL(@Description, NULL) END
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [${flyway:defaultSchema}].[vwScoreBandSets] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateScoreBandSet] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MJ_BizApps_Sonar: Score Band Sets */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateScoreBandSet] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MJ_BizApps_Sonar: Score Band Sets */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Band Sets
-- Item: spUpdateScoreBandSet
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR ScoreBandSet
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spUpdateScoreBandSet]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spUpdateScoreBandSet];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spUpdateScoreBandSet]
    @ID uniqueidentifier,
    @Name nvarchar(200) = NULL,
    @AnchorEntityID_Clear bit = 0,
    @AnchorEntityID uniqueidentifier = NULL,
    @Description_Clear bit = 0,
    @Description nvarchar(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[ScoreBandSet]
    SET
        [Name] = ISNULL(@Name, [Name]),
        [AnchorEntityID] = CASE WHEN @AnchorEntityID_Clear = 1 THEN NULL ELSE ISNULL(@AnchorEntityID, [AnchorEntityID]) END,
        [Description] = CASE WHEN @Description_Clear = 1 THEN NULL ELSE ISNULL(@Description, [Description]) END
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [${flyway:defaultSchema}].[vwScoreBandSets] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [${flyway:defaultSchema}].[vwScoreBandSets]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateScoreBandSet] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the ScoreBandSet table
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[trgUpdateScoreBandSet]', 'TR') IS NOT NULL
    DROP TRIGGER [${flyway:defaultSchema}].[trgUpdateScoreBandSet];
GO
CREATE TRIGGER [${flyway:defaultSchema}].trgUpdateScoreBandSet
ON [${flyway:defaultSchema}].[ScoreBandSet]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[ScoreBandSet]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [${flyway:defaultSchema}].[ScoreBandSet] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MJ_BizApps_Sonar: Score Band Sets */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateScoreBandSet] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MJ_BizApps_Sonar: Score Band Sets */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Band Sets
-- Item: spDeleteScoreBandSet
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR ScoreBandSet
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spDeleteScoreBandSet]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spDeleteScoreBandSet];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spDeleteScoreBandSet]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [${flyway:defaultSchema}].[ScoreBandSet]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteScoreBandSet] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MJ_BizApps_Sonar: Score Band Sets */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteScoreBandSet] TO [cdp_Developer], [cdp_Integration];

/* Base View SQL for MJ_BizApps_Sonar: Score Band Transitions */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Band Transitions
-- Item: vwScoreBandTransitions
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MJ_BizApps_Sonar: Score Band Transitions
-----               SCHEMA:      ${flyway:defaultSchema}
-----               BASE TABLE:  ScoreBandTransition
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[vwScoreBandTransitions]', 'V') IS NOT NULL
    DROP VIEW [${flyway:defaultSchema}].[vwScoreBandTransitions];
GO

CREATE VIEW [${flyway:defaultSchema}].[vwScoreBandTransitions]
AS
SELECT
    s.*,
    sonarScoreModel_ScoreModelID.[Name] AS [ScoreModel]
FROM
    [${flyway:defaultSchema}].[ScoreBandTransition] AS s
INNER JOIN
    [${flyway:defaultSchema}].[ScoreModel] AS sonarScoreModel_ScoreModelID
  ON
    [s].[ScoreModelID] = sonarScoreModel_ScoreModelID.[ID]
GO
GRANT SELECT ON [${flyway:defaultSchema}].[vwScoreBandTransitions] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MJ_BizApps_Sonar: Score Band Transitions */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Band Transitions
-- Item: Permissions for vwScoreBandTransitions
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [${flyway:defaultSchema}].[vwScoreBandTransitions] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MJ_BizApps_Sonar: Score Band Transitions */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Band Transitions
-- Item: spCreateScoreBandTransition
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR ScoreBandTransition
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spCreateScoreBandTransition]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spCreateScoreBandTransition];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spCreateScoreBandTransition]
    @ID uniqueidentifier = NULL,
    @ScoreModelID uniqueidentifier,
    @AnchorRecordID nvarchar(100),
    @FromBandID_Clear bit = 0,
    @FromBandID uniqueidentifier = NULL,
    @ToBandID_Clear bit = 0,
    @ToBandID uniqueidentifier = NULL,
    @Direction_Clear bit = 0,
    @Direction nvarchar(12) = NULL,
    @OccurredAt datetime2 = NULL,
    @RecomputeRunID_Clear bit = 0,
    @RecomputeRunID uniqueidentifier = NULL,
    @Handled bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)
    
    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [${flyway:defaultSchema}].[ScoreBandTransition]
            (
                [ID],
                [ScoreModelID],
                [AnchorRecordID],
                [FromBandID],
                [ToBandID],
                [Direction],
                [OccurredAt],
                [RecomputeRunID],
                [Handled]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @ScoreModelID,
                @AnchorRecordID,
                CASE WHEN @FromBandID_Clear = 1 THEN NULL ELSE ISNULL(@FromBandID, NULL) END,
                CASE WHEN @ToBandID_Clear = 1 THEN NULL ELSE ISNULL(@ToBandID, NULL) END,
                CASE WHEN @Direction_Clear = 1 THEN NULL ELSE ISNULL(@Direction, NULL) END,
                ISNULL(@OccurredAt, getutcdate()),
                CASE WHEN @RecomputeRunID_Clear = 1 THEN NULL ELSE ISNULL(@RecomputeRunID, NULL) END,
                ISNULL(@Handled, 0)
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [${flyway:defaultSchema}].[ScoreBandTransition]
            (
                [ScoreModelID],
                [AnchorRecordID],
                [FromBandID],
                [ToBandID],
                [Direction],
                [OccurredAt],
                [RecomputeRunID],
                [Handled]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ScoreModelID,
                @AnchorRecordID,
                CASE WHEN @FromBandID_Clear = 1 THEN NULL ELSE ISNULL(@FromBandID, NULL) END,
                CASE WHEN @ToBandID_Clear = 1 THEN NULL ELSE ISNULL(@ToBandID, NULL) END,
                CASE WHEN @Direction_Clear = 1 THEN NULL ELSE ISNULL(@Direction, NULL) END,
                ISNULL(@OccurredAt, getutcdate()),
                CASE WHEN @RecomputeRunID_Clear = 1 THEN NULL ELSE ISNULL(@RecomputeRunID, NULL) END,
                ISNULL(@Handled, 0)
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [${flyway:defaultSchema}].[vwScoreBandTransitions] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateScoreBandTransition] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MJ_BizApps_Sonar: Score Band Transitions */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateScoreBandTransition] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MJ_BizApps_Sonar: Score Band Transitions */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Band Transitions
-- Item: spUpdateScoreBandTransition
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR ScoreBandTransition
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spUpdateScoreBandTransition]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spUpdateScoreBandTransition];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spUpdateScoreBandTransition]
    @ID uniqueidentifier,
    @ScoreModelID uniqueidentifier = NULL,
    @AnchorRecordID nvarchar(100) = NULL,
    @FromBandID_Clear bit = 0,
    @FromBandID uniqueidentifier = NULL,
    @ToBandID_Clear bit = 0,
    @ToBandID uniqueidentifier = NULL,
    @Direction_Clear bit = 0,
    @Direction nvarchar(12) = NULL,
    @OccurredAt datetime2 = NULL,
    @RecomputeRunID_Clear bit = 0,
    @RecomputeRunID uniqueidentifier = NULL,
    @Handled bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[ScoreBandTransition]
    SET
        [ScoreModelID] = ISNULL(@ScoreModelID, [ScoreModelID]),
        [AnchorRecordID] = ISNULL(@AnchorRecordID, [AnchorRecordID]),
        [FromBandID] = CASE WHEN @FromBandID_Clear = 1 THEN NULL ELSE ISNULL(@FromBandID, [FromBandID]) END,
        [ToBandID] = CASE WHEN @ToBandID_Clear = 1 THEN NULL ELSE ISNULL(@ToBandID, [ToBandID]) END,
        [Direction] = CASE WHEN @Direction_Clear = 1 THEN NULL ELSE ISNULL(@Direction, [Direction]) END,
        [OccurredAt] = ISNULL(@OccurredAt, [OccurredAt]),
        [RecomputeRunID] = CASE WHEN @RecomputeRunID_Clear = 1 THEN NULL ELSE ISNULL(@RecomputeRunID, [RecomputeRunID]) END,
        [Handled] = ISNULL(@Handled, [Handled])
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [${flyway:defaultSchema}].[vwScoreBandTransitions] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [${flyway:defaultSchema}].[vwScoreBandTransitions]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateScoreBandTransition] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the ScoreBandTransition table
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[trgUpdateScoreBandTransition]', 'TR') IS NOT NULL
    DROP TRIGGER [${flyway:defaultSchema}].[trgUpdateScoreBandTransition];
GO
CREATE TRIGGER [${flyway:defaultSchema}].trgUpdateScoreBandTransition
ON [${flyway:defaultSchema}].[ScoreBandTransition]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[ScoreBandTransition]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [${flyway:defaultSchema}].[ScoreBandTransition] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MJ_BizApps_Sonar: Score Band Transitions */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateScoreBandTransition] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MJ_BizApps_Sonar: Score Band Transitions */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Band Transitions
-- Item: spDeleteScoreBandTransition
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR ScoreBandTransition
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spDeleteScoreBandTransition]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spDeleteScoreBandTransition];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spDeleteScoreBandTransition]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [${flyway:defaultSchema}].[ScoreBandTransition]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteScoreBandTransition] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MJ_BizApps_Sonar: Score Band Transitions */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteScoreBandTransition] TO [cdp_Developer], [cdp_Integration];

/* SQL text to update entity field related entity name field map for entity field ID 6D548153-C2D2-4C8C-8C35-640F8F64C1A1 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='6D548153-C2D2-4C8C-8C35-640F8F64C1A1', @RelatedEntityNameFieldMap='RelatedEntity';

/* SQL text to update entity field related entity name field map for entity field ID E4E72670-D9B0-445B-81B6-74EC723B96CA */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='E4E72670-D9B0-445B-81B6-74EC723B96CA', @RelatedEntityNameFieldMap='SourceEntity';

/* Base View SQL for MJ_BizApps_Sonar: Model Factors */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Model Factors
-- Item: vwModelFactors
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MJ_BizApps_Sonar: Model Factors
-----               SCHEMA:      ${flyway:defaultSchema}
-----               BASE TABLE:  ModelFactor
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[vwModelFactors]', 'V') IS NOT NULL
    DROP VIEW [${flyway:defaultSchema}].[vwModelFactors];
GO

CREATE VIEW [${flyway:defaultSchema}].[vwModelFactors]
AS
SELECT
    m.*,
    sonarScoreModel_ScoreModelID.[Name] AS [ScoreModel],
    sonarFactor_FactorID.[Name] AS [Factor]
FROM
    [${flyway:defaultSchema}].[ModelFactor] AS m
INNER JOIN
    [${flyway:defaultSchema}].[ScoreModel] AS sonarScoreModel_ScoreModelID
  ON
    [m].[ScoreModelID] = sonarScoreModel_ScoreModelID.[ID]
INNER JOIN
    [${flyway:defaultSchema}].[Factor] AS sonarFactor_FactorID
  ON
    [m].[FactorID] = sonarFactor_FactorID.[ID]
GO
GRANT SELECT ON [${flyway:defaultSchema}].[vwModelFactors] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MJ_BizApps_Sonar: Model Factors */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Model Factors
-- Item: Permissions for vwModelFactors
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [${flyway:defaultSchema}].[vwModelFactors] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MJ_BizApps_Sonar: Model Factors */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Model Factors
-- Item: spCreateModelFactor
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR ModelFactor
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spCreateModelFactor]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spCreateModelFactor];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spCreateModelFactor]
    @ID uniqueidentifier = NULL,
    @ScoreModelID uniqueidentifier,
    @FactorID uniqueidentifier,
    @Weight decimal(9, 4) = NULL,
    @WeightMode nvarchar(12) = NULL,
    @ContributionCap_Clear bit = 0,
    @ContributionCap decimal(9, 4) = NULL,
    @ContributionFloor_Clear bit = 0,
    @ContributionFloor decimal(9, 4) = NULL,
    @TrendWeight_Clear bit = 0,
    @TrendWeight decimal(9, 4) = NULL,
    @MissingDataPolicy nvarchar(16) = NULL,
    @IsRequired bit = NULL,
    @DisplayLabel_Clear bit = 0,
    @DisplayLabel nvarchar(200) = NULL,
    @DisplayOrder_Clear bit = 0,
    @DisplayOrder int = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)
    
    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [${flyway:defaultSchema}].[ModelFactor]
            (
                [ID],
                [ScoreModelID],
                [FactorID],
                [Weight],
                [WeightMode],
                [ContributionCap],
                [ContributionFloor],
                [TrendWeight],
                [MissingDataPolicy],
                [IsRequired],
                [DisplayLabel],
                [DisplayOrder]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @ScoreModelID,
                @FactorID,
                ISNULL(@Weight, 1),
                ISNULL(@WeightMode, 'Additive'),
                CASE WHEN @ContributionCap_Clear = 1 THEN NULL ELSE ISNULL(@ContributionCap, NULL) END,
                CASE WHEN @ContributionFloor_Clear = 1 THEN NULL ELSE ISNULL(@ContributionFloor, NULL) END,
                CASE WHEN @TrendWeight_Clear = 1 THEN NULL ELSE ISNULL(@TrendWeight, NULL) END,
                ISNULL(@MissingDataPolicy, 'ModelDefault'),
                ISNULL(@IsRequired, 0),
                CASE WHEN @DisplayLabel_Clear = 1 THEN NULL ELSE ISNULL(@DisplayLabel, NULL) END,
                CASE WHEN @DisplayOrder_Clear = 1 THEN NULL ELSE ISNULL(@DisplayOrder, NULL) END
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [${flyway:defaultSchema}].[ModelFactor]
            (
                [ScoreModelID],
                [FactorID],
                [Weight],
                [WeightMode],
                [ContributionCap],
                [ContributionFloor],
                [TrendWeight],
                [MissingDataPolicy],
                [IsRequired],
                [DisplayLabel],
                [DisplayOrder]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ScoreModelID,
                @FactorID,
                ISNULL(@Weight, 1),
                ISNULL(@WeightMode, 'Additive'),
                CASE WHEN @ContributionCap_Clear = 1 THEN NULL ELSE ISNULL(@ContributionCap, NULL) END,
                CASE WHEN @ContributionFloor_Clear = 1 THEN NULL ELSE ISNULL(@ContributionFloor, NULL) END,
                CASE WHEN @TrendWeight_Clear = 1 THEN NULL ELSE ISNULL(@TrendWeight, NULL) END,
                ISNULL(@MissingDataPolicy, 'ModelDefault'),
                ISNULL(@IsRequired, 0),
                CASE WHEN @DisplayLabel_Clear = 1 THEN NULL ELSE ISNULL(@DisplayLabel, NULL) END,
                CASE WHEN @DisplayOrder_Clear = 1 THEN NULL ELSE ISNULL(@DisplayOrder, NULL) END
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [${flyway:defaultSchema}].[vwModelFactors] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateModelFactor] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MJ_BizApps_Sonar: Model Factors */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateModelFactor] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MJ_BizApps_Sonar: Model Factors */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Model Factors
-- Item: spUpdateModelFactor
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR ModelFactor
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spUpdateModelFactor]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spUpdateModelFactor];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spUpdateModelFactor]
    @ID uniqueidentifier,
    @ScoreModelID uniqueidentifier = NULL,
    @FactorID uniqueidentifier = NULL,
    @Weight decimal(9, 4) = NULL,
    @WeightMode nvarchar(12) = NULL,
    @ContributionCap_Clear bit = 0,
    @ContributionCap decimal(9, 4) = NULL,
    @ContributionFloor_Clear bit = 0,
    @ContributionFloor decimal(9, 4) = NULL,
    @TrendWeight_Clear bit = 0,
    @TrendWeight decimal(9, 4) = NULL,
    @MissingDataPolicy nvarchar(16) = NULL,
    @IsRequired bit = NULL,
    @DisplayLabel_Clear bit = 0,
    @DisplayLabel nvarchar(200) = NULL,
    @DisplayOrder_Clear bit = 0,
    @DisplayOrder int = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[ModelFactor]
    SET
        [ScoreModelID] = ISNULL(@ScoreModelID, [ScoreModelID]),
        [FactorID] = ISNULL(@FactorID, [FactorID]),
        [Weight] = ISNULL(@Weight, [Weight]),
        [WeightMode] = ISNULL(@WeightMode, [WeightMode]),
        [ContributionCap] = CASE WHEN @ContributionCap_Clear = 1 THEN NULL ELSE ISNULL(@ContributionCap, [ContributionCap]) END,
        [ContributionFloor] = CASE WHEN @ContributionFloor_Clear = 1 THEN NULL ELSE ISNULL(@ContributionFloor, [ContributionFloor]) END,
        [TrendWeight] = CASE WHEN @TrendWeight_Clear = 1 THEN NULL ELSE ISNULL(@TrendWeight, [TrendWeight]) END,
        [MissingDataPolicy] = ISNULL(@MissingDataPolicy, [MissingDataPolicy]),
        [IsRequired] = ISNULL(@IsRequired, [IsRequired]),
        [DisplayLabel] = CASE WHEN @DisplayLabel_Clear = 1 THEN NULL ELSE ISNULL(@DisplayLabel, [DisplayLabel]) END,
        [DisplayOrder] = CASE WHEN @DisplayOrder_Clear = 1 THEN NULL ELSE ISNULL(@DisplayOrder, [DisplayOrder]) END
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [${flyway:defaultSchema}].[vwModelFactors] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [${flyway:defaultSchema}].[vwModelFactors]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateModelFactor] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the ModelFactor table
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[trgUpdateModelFactor]', 'TR') IS NOT NULL
    DROP TRIGGER [${flyway:defaultSchema}].[trgUpdateModelFactor];
GO
CREATE TRIGGER [${flyway:defaultSchema}].trgUpdateModelFactor
ON [${flyway:defaultSchema}].[ModelFactor]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[ModelFactor]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [${flyway:defaultSchema}].[ModelFactor] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MJ_BizApps_Sonar: Model Factors */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateModelFactor] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MJ_BizApps_Sonar: Model Factors */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Model Factors
-- Item: spDeleteModelFactor
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR ModelFactor
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spDeleteModelFactor]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spDeleteModelFactor];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spDeleteModelFactor]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [${flyway:defaultSchema}].[ModelFactor]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteModelFactor] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MJ_BizApps_Sonar: Model Factors */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteModelFactor] TO [cdp_Developer], [cdp_Integration];

/* Base View SQL for MJ_BizApps_Sonar: Model Related Entities */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Model Related Entities
-- Item: vwModelRelatedEntities
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MJ_BizApps_Sonar: Model Related Entities
-----               SCHEMA:      ${flyway:defaultSchema}
-----               BASE TABLE:  ModelRelatedEntity
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[vwModelRelatedEntities]', 'V') IS NOT NULL
    DROP VIEW [${flyway:defaultSchema}].[vwModelRelatedEntities];
GO

CREATE VIEW [${flyway:defaultSchema}].[vwModelRelatedEntities]
AS
SELECT
    m.*,
    sonarScoreModel_ScoreModelID.[Name] AS [ScoreModel],
    MJEntity_RelatedEntityID.[Name] AS [RelatedEntity]
FROM
    [${flyway:defaultSchema}].[ModelRelatedEntity] AS m
INNER JOIN
    [${flyway:defaultSchema}].[ScoreModel] AS sonarScoreModel_ScoreModelID
  ON
    [m].[ScoreModelID] = sonarScoreModel_ScoreModelID.[ID]
INNER JOIN
    [${mjSchema}].[Entity] AS MJEntity_RelatedEntityID
  ON
    [m].[RelatedEntityID] = MJEntity_RelatedEntityID.[ID]
GO
GRANT SELECT ON [${flyway:defaultSchema}].[vwModelRelatedEntities] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MJ_BizApps_Sonar: Model Related Entities */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Model Related Entities
-- Item: Permissions for vwModelRelatedEntities
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [${flyway:defaultSchema}].[vwModelRelatedEntities] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MJ_BizApps_Sonar: Model Related Entities */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Model Related Entities
-- Item: spCreateModelRelatedEntity
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR ModelRelatedEntity
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spCreateModelRelatedEntity]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spCreateModelRelatedEntity];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spCreateModelRelatedEntity]
    @ID uniqueidentifier = NULL,
    @ScoreModelID uniqueidentifier,
    @RelatedEntityID uniqueidentifier,
    @Alias nvarchar(100),
    @RelationshipPath nvarchar(MAX),
    @JoinType nvarchar(10) = NULL,
    @SourceSystemTag_Clear bit = 0,
    @SourceSystemTag nvarchar(60) = NULL,
    @Description_Clear bit = 0,
    @Description nvarchar(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)
    
    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [${flyway:defaultSchema}].[ModelRelatedEntity]
            (
                [ID],
                [ScoreModelID],
                [RelatedEntityID],
                [Alias],
                [RelationshipPath],
                [JoinType],
                [SourceSystemTag],
                [Description]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @ScoreModelID,
                @RelatedEntityID,
                @Alias,
                @RelationshipPath,
                ISNULL(@JoinType, 'Left'),
                CASE WHEN @SourceSystemTag_Clear = 1 THEN NULL ELSE ISNULL(@SourceSystemTag, NULL) END,
                CASE WHEN @Description_Clear = 1 THEN NULL ELSE ISNULL(@Description, NULL) END
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [${flyway:defaultSchema}].[ModelRelatedEntity]
            (
                [ScoreModelID],
                [RelatedEntityID],
                [Alias],
                [RelationshipPath],
                [JoinType],
                [SourceSystemTag],
                [Description]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ScoreModelID,
                @RelatedEntityID,
                @Alias,
                @RelationshipPath,
                ISNULL(@JoinType, 'Left'),
                CASE WHEN @SourceSystemTag_Clear = 1 THEN NULL ELSE ISNULL(@SourceSystemTag, NULL) END,
                CASE WHEN @Description_Clear = 1 THEN NULL ELSE ISNULL(@Description, NULL) END
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [${flyway:defaultSchema}].[vwModelRelatedEntities] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateModelRelatedEntity] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MJ_BizApps_Sonar: Model Related Entities */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateModelRelatedEntity] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MJ_BizApps_Sonar: Model Related Entities */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Model Related Entities
-- Item: spUpdateModelRelatedEntity
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR ModelRelatedEntity
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spUpdateModelRelatedEntity]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spUpdateModelRelatedEntity];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spUpdateModelRelatedEntity]
    @ID uniqueidentifier,
    @ScoreModelID uniqueidentifier = NULL,
    @RelatedEntityID uniqueidentifier = NULL,
    @Alias nvarchar(100) = NULL,
    @RelationshipPath nvarchar(MAX) = NULL,
    @JoinType nvarchar(10) = NULL,
    @SourceSystemTag_Clear bit = 0,
    @SourceSystemTag nvarchar(60) = NULL,
    @Description_Clear bit = 0,
    @Description nvarchar(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[ModelRelatedEntity]
    SET
        [ScoreModelID] = ISNULL(@ScoreModelID, [ScoreModelID]),
        [RelatedEntityID] = ISNULL(@RelatedEntityID, [RelatedEntityID]),
        [Alias] = ISNULL(@Alias, [Alias]),
        [RelationshipPath] = ISNULL(@RelationshipPath, [RelationshipPath]),
        [JoinType] = ISNULL(@JoinType, [JoinType]),
        [SourceSystemTag] = CASE WHEN @SourceSystemTag_Clear = 1 THEN NULL ELSE ISNULL(@SourceSystemTag, [SourceSystemTag]) END,
        [Description] = CASE WHEN @Description_Clear = 1 THEN NULL ELSE ISNULL(@Description, [Description]) END
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [${flyway:defaultSchema}].[vwModelRelatedEntities] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [${flyway:defaultSchema}].[vwModelRelatedEntities]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateModelRelatedEntity] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the ModelRelatedEntity table
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[trgUpdateModelRelatedEntity]', 'TR') IS NOT NULL
    DROP TRIGGER [${flyway:defaultSchema}].[trgUpdateModelRelatedEntity];
GO
CREATE TRIGGER [${flyway:defaultSchema}].trgUpdateModelRelatedEntity
ON [${flyway:defaultSchema}].[ModelRelatedEntity]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[ModelRelatedEntity]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [${flyway:defaultSchema}].[ModelRelatedEntity] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MJ_BizApps_Sonar: Model Related Entities */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateModelRelatedEntity] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MJ_BizApps_Sonar: Model Related Entities */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Model Related Entities
-- Item: spDeleteModelRelatedEntity
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR ModelRelatedEntity
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spDeleteModelRelatedEntity]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spDeleteModelRelatedEntity];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spDeleteModelRelatedEntity]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [${flyway:defaultSchema}].[ModelRelatedEntity]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteModelRelatedEntity] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MJ_BizApps_Sonar: Model Related Entities */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteModelRelatedEntity] TO [cdp_Developer], [cdp_Integration];

/* SQL text to update entity field related entity name field map for entity field ID BCA42C54-005E-414D-86A8-AEF13BE670F5 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='BCA42C54-005E-414D-86A8-AEF13BE670F5', @RelatedEntityNameFieldMap='TimeWindow';

/* SQL text to update entity field related entity name field map for entity field ID 3A1A964D-A3B3-414F-B43B-C99876B8C306 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='3A1A964D-A3B3-414F-B43B-C99876B8C306', @RelatedEntityNameFieldMap='Action';

/* SQL text to update entity field related entity name field map for entity field ID 049E70E5-0506-4422-80DA-6834681B22C6 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='049E70E5-0506-4422-80DA-6834681B22C6', @RelatedEntityNameFieldMap='SourceScoreModel';

/* Base View SQL for MJ_BizApps_Sonar: Factors */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Factors
-- Item: vwFactors
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MJ_BizApps_Sonar: Factors
-----               SCHEMA:      ${flyway:defaultSchema}
-----               BASE TABLE:  Factor
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[vwFactors]', 'V') IS NOT NULL
    DROP VIEW [${flyway:defaultSchema}].[vwFactors];
GO

CREATE VIEW [${flyway:defaultSchema}].[vwFactors]
AS
SELECT
    f.*,
    sonarScoreModel_ScoreModelID.[Name] AS [ScoreModel],
    MJEntity_AnchorEntityID.[Name] AS [AnchorEntity],
    MJEntity_SourceEntityID.[Name] AS [SourceEntity],
    sonarTimeWindow_TimeWindowID.[Name] AS [TimeWindow],
    MJAction_ActionID.[Name] AS [Action],
    sonarScoreModel_SourceScoreModelID.[Name] AS [SourceScoreModel]
FROM
    [${flyway:defaultSchema}].[Factor] AS f
LEFT OUTER JOIN
    [${flyway:defaultSchema}].[ScoreModel] AS sonarScoreModel_ScoreModelID
  ON
    [f].[ScoreModelID] = sonarScoreModel_ScoreModelID.[ID]
INNER JOIN
    [${mjSchema}].[Entity] AS MJEntity_AnchorEntityID
  ON
    [f].[AnchorEntityID] = MJEntity_AnchorEntityID.[ID]
LEFT OUTER JOIN
    [${mjSchema}].[Entity] AS MJEntity_SourceEntityID
  ON
    [f].[SourceEntityID] = MJEntity_SourceEntityID.[ID]
LEFT OUTER JOIN
    [${flyway:defaultSchema}].[TimeWindow] AS sonarTimeWindow_TimeWindowID
  ON
    [f].[TimeWindowID] = sonarTimeWindow_TimeWindowID.[ID]
LEFT OUTER JOIN
    [${mjSchema}].[Action] AS MJAction_ActionID
  ON
    [f].[ActionID] = MJAction_ActionID.[ID]
LEFT OUTER JOIN
    [${flyway:defaultSchema}].[ScoreModel] AS sonarScoreModel_SourceScoreModelID
  ON
    [f].[SourceScoreModelID] = sonarScoreModel_SourceScoreModelID.[ID]
GO
GRANT SELECT ON [${flyway:defaultSchema}].[vwFactors] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MJ_BizApps_Sonar: Factors */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Factors
-- Item: Permissions for vwFactors
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [${flyway:defaultSchema}].[vwFactors] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MJ_BizApps_Sonar: Factors */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Factors
-- Item: spCreateFactor
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR Factor
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spCreateFactor]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spCreateFactor];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spCreateFactor]
    @ID uniqueidentifier = NULL,
    @Name nvarchar(200),
    @Slug nvarchar(100),
    @Description_Clear bit = 0,
    @Description nvarchar(MAX) = NULL,
    @ScoreModelID_Clear bit = 0,
    @ScoreModelID uniqueidentifier = NULL,
    @AnchorEntityID uniqueidentifier,
    @FactorType nvarchar(20),
    @SourceRelatedEntityID_Clear bit = 0,
    @SourceRelatedEntityID uniqueidentifier = NULL,
    @SourceEntityID_Clear bit = 0,
    @SourceEntityID uniqueidentifier = NULL,
    @FilterExpression_Clear bit = 0,
    @FilterExpression nvarchar(MAX) = NULL,
    @Aggregation_Clear bit = 0,
    @Aggregation nvarchar(20) = NULL,
    @AggregateFieldName_Clear bit = 0,
    @AggregateFieldName nvarchar(200) = NULL,
    @TimeWindowID_Clear bit = 0,
    @TimeWindowID uniqueidentifier = NULL,
    @RecencyDecayHalfLifeDays_Clear bit = 0,
    @RecencyDecayHalfLifeDays int = NULL,
    @ActionID_Clear bit = 0,
    @ActionID uniqueidentifier = NULL,
    @ActionParamsJSON_Clear bit = 0,
    @ActionParamsJSON nvarchar(MAX) = NULL,
    @ExecutionMode_Clear bit = 0,
    @ExecutionMode nvarchar(12) = NULL,
    @IsExpensive bit = NULL,
    @MaxConcurrency_Clear bit = 0,
    @MaxConcurrency int = NULL,
    @RateLimitPerMinute_Clear bit = 0,
    @RateLimitPerMinute int = NULL,
    @CacheTTLSeconds_Clear bit = 0,
    @CacheTTLSeconds int = NULL,
    @SourceScoreModelID_Clear bit = 0,
    @SourceScoreModelID uniqueidentifier = NULL,
    @RawDataType_Clear bit = 0,
    @RawDataType nvarchar(12) = NULL,
    @NormalizationMethod_Clear bit = 0,
    @NormalizationMethod nvarchar(20) = NULL,
    @NormalizationParamsJSON_Clear bit = 0,
    @NormalizationParamsJSON nvarchar(MAX) = NULL,
    @OutputMin_Clear bit = 0,
    @OutputMin decimal(9, 4) = NULL,
    @OutputMax_Clear bit = 0,
    @OutputMax decimal(9, 4) = NULL,
    @HigherIsBetter bit = NULL,
    @PromotionState_Clear bit = 0,
    @PromotionState nvarchar(20) = NULL,
    @LastValidatedAt_Clear bit = 0,
    @LastValidatedAt datetime2 = NULL,
    @CreatedByAgent_Clear bit = 0,
    @CreatedByAgent nvarchar(60) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)
    
    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [${flyway:defaultSchema}].[Factor]
            (
                [ID],
                [Name],
                [Slug],
                [Description],
                [ScoreModelID],
                [AnchorEntityID],
                [FactorType],
                [SourceRelatedEntityID],
                [SourceEntityID],
                [FilterExpression],
                [Aggregation],
                [AggregateFieldName],
                [TimeWindowID],
                [RecencyDecayHalfLifeDays],
                [ActionID],
                [ActionParamsJSON],
                [ExecutionMode],
                [IsExpensive],
                [MaxConcurrency],
                [RateLimitPerMinute],
                [CacheTTLSeconds],
                [SourceScoreModelID],
                [RawDataType],
                [NormalizationMethod],
                [NormalizationParamsJSON],
                [OutputMin],
                [OutputMax],
                [HigherIsBetter],
                [PromotionState],
                [LastValidatedAt],
                [CreatedByAgent]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @Name,
                @Slug,
                CASE WHEN @Description_Clear = 1 THEN NULL ELSE ISNULL(@Description, NULL) END,
                CASE WHEN @ScoreModelID_Clear = 1 THEN NULL ELSE ISNULL(@ScoreModelID, NULL) END,
                @AnchorEntityID,
                @FactorType,
                CASE WHEN @SourceRelatedEntityID_Clear = 1 THEN NULL ELSE ISNULL(@SourceRelatedEntityID, NULL) END,
                CASE WHEN @SourceEntityID_Clear = 1 THEN NULL ELSE ISNULL(@SourceEntityID, NULL) END,
                CASE WHEN @FilterExpression_Clear = 1 THEN NULL ELSE ISNULL(@FilterExpression, NULL) END,
                CASE WHEN @Aggregation_Clear = 1 THEN NULL ELSE ISNULL(@Aggregation, NULL) END,
                CASE WHEN @AggregateFieldName_Clear = 1 THEN NULL ELSE ISNULL(@AggregateFieldName, NULL) END,
                CASE WHEN @TimeWindowID_Clear = 1 THEN NULL ELSE ISNULL(@TimeWindowID, NULL) END,
                CASE WHEN @RecencyDecayHalfLifeDays_Clear = 1 THEN NULL ELSE ISNULL(@RecencyDecayHalfLifeDays, NULL) END,
                CASE WHEN @ActionID_Clear = 1 THEN NULL ELSE ISNULL(@ActionID, NULL) END,
                CASE WHEN @ActionParamsJSON_Clear = 1 THEN NULL ELSE ISNULL(@ActionParamsJSON, NULL) END,
                CASE WHEN @ExecutionMode_Clear = 1 THEN NULL ELSE ISNULL(@ExecutionMode, NULL) END,
                ISNULL(@IsExpensive, 0),
                CASE WHEN @MaxConcurrency_Clear = 1 THEN NULL ELSE ISNULL(@MaxConcurrency, NULL) END,
                CASE WHEN @RateLimitPerMinute_Clear = 1 THEN NULL ELSE ISNULL(@RateLimitPerMinute, NULL) END,
                CASE WHEN @CacheTTLSeconds_Clear = 1 THEN NULL ELSE ISNULL(@CacheTTLSeconds, NULL) END,
                CASE WHEN @SourceScoreModelID_Clear = 1 THEN NULL ELSE ISNULL(@SourceScoreModelID, NULL) END,
                CASE WHEN @RawDataType_Clear = 1 THEN NULL ELSE ISNULL(@RawDataType, NULL) END,
                CASE WHEN @NormalizationMethod_Clear = 1 THEN NULL ELSE ISNULL(@NormalizationMethod, NULL) END,
                CASE WHEN @NormalizationParamsJSON_Clear = 1 THEN NULL ELSE ISNULL(@NormalizationParamsJSON, NULL) END,
                CASE WHEN @OutputMin_Clear = 1 THEN NULL ELSE ISNULL(@OutputMin, NULL) END,
                CASE WHEN @OutputMax_Clear = 1 THEN NULL ELSE ISNULL(@OutputMax, NULL) END,
                ISNULL(@HigherIsBetter, 1),
                CASE WHEN @PromotionState_Clear = 1 THEN NULL ELSE ISNULL(@PromotionState, NULL) END,
                CASE WHEN @LastValidatedAt_Clear = 1 THEN NULL ELSE ISNULL(@LastValidatedAt, NULL) END,
                CASE WHEN @CreatedByAgent_Clear = 1 THEN NULL ELSE ISNULL(@CreatedByAgent, NULL) END
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [${flyway:defaultSchema}].[Factor]
            (
                [Name],
                [Slug],
                [Description],
                [ScoreModelID],
                [AnchorEntityID],
                [FactorType],
                [SourceRelatedEntityID],
                [SourceEntityID],
                [FilterExpression],
                [Aggregation],
                [AggregateFieldName],
                [TimeWindowID],
                [RecencyDecayHalfLifeDays],
                [ActionID],
                [ActionParamsJSON],
                [ExecutionMode],
                [IsExpensive],
                [MaxConcurrency],
                [RateLimitPerMinute],
                [CacheTTLSeconds],
                [SourceScoreModelID],
                [RawDataType],
                [NormalizationMethod],
                [NormalizationParamsJSON],
                [OutputMin],
                [OutputMax],
                [HigherIsBetter],
                [PromotionState],
                [LastValidatedAt],
                [CreatedByAgent]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @Name,
                @Slug,
                CASE WHEN @Description_Clear = 1 THEN NULL ELSE ISNULL(@Description, NULL) END,
                CASE WHEN @ScoreModelID_Clear = 1 THEN NULL ELSE ISNULL(@ScoreModelID, NULL) END,
                @AnchorEntityID,
                @FactorType,
                CASE WHEN @SourceRelatedEntityID_Clear = 1 THEN NULL ELSE ISNULL(@SourceRelatedEntityID, NULL) END,
                CASE WHEN @SourceEntityID_Clear = 1 THEN NULL ELSE ISNULL(@SourceEntityID, NULL) END,
                CASE WHEN @FilterExpression_Clear = 1 THEN NULL ELSE ISNULL(@FilterExpression, NULL) END,
                CASE WHEN @Aggregation_Clear = 1 THEN NULL ELSE ISNULL(@Aggregation, NULL) END,
                CASE WHEN @AggregateFieldName_Clear = 1 THEN NULL ELSE ISNULL(@AggregateFieldName, NULL) END,
                CASE WHEN @TimeWindowID_Clear = 1 THEN NULL ELSE ISNULL(@TimeWindowID, NULL) END,
                CASE WHEN @RecencyDecayHalfLifeDays_Clear = 1 THEN NULL ELSE ISNULL(@RecencyDecayHalfLifeDays, NULL) END,
                CASE WHEN @ActionID_Clear = 1 THEN NULL ELSE ISNULL(@ActionID, NULL) END,
                CASE WHEN @ActionParamsJSON_Clear = 1 THEN NULL ELSE ISNULL(@ActionParamsJSON, NULL) END,
                CASE WHEN @ExecutionMode_Clear = 1 THEN NULL ELSE ISNULL(@ExecutionMode, NULL) END,
                ISNULL(@IsExpensive, 0),
                CASE WHEN @MaxConcurrency_Clear = 1 THEN NULL ELSE ISNULL(@MaxConcurrency, NULL) END,
                CASE WHEN @RateLimitPerMinute_Clear = 1 THEN NULL ELSE ISNULL(@RateLimitPerMinute, NULL) END,
                CASE WHEN @CacheTTLSeconds_Clear = 1 THEN NULL ELSE ISNULL(@CacheTTLSeconds, NULL) END,
                CASE WHEN @SourceScoreModelID_Clear = 1 THEN NULL ELSE ISNULL(@SourceScoreModelID, NULL) END,
                CASE WHEN @RawDataType_Clear = 1 THEN NULL ELSE ISNULL(@RawDataType, NULL) END,
                CASE WHEN @NormalizationMethod_Clear = 1 THEN NULL ELSE ISNULL(@NormalizationMethod, NULL) END,
                CASE WHEN @NormalizationParamsJSON_Clear = 1 THEN NULL ELSE ISNULL(@NormalizationParamsJSON, NULL) END,
                CASE WHEN @OutputMin_Clear = 1 THEN NULL ELSE ISNULL(@OutputMin, NULL) END,
                CASE WHEN @OutputMax_Clear = 1 THEN NULL ELSE ISNULL(@OutputMax, NULL) END,
                ISNULL(@HigherIsBetter, 1),
                CASE WHEN @PromotionState_Clear = 1 THEN NULL ELSE ISNULL(@PromotionState, NULL) END,
                CASE WHEN @LastValidatedAt_Clear = 1 THEN NULL ELSE ISNULL(@LastValidatedAt, NULL) END,
                CASE WHEN @CreatedByAgent_Clear = 1 THEN NULL ELSE ISNULL(@CreatedByAgent, NULL) END
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [${flyway:defaultSchema}].[vwFactors] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateFactor] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MJ_BizApps_Sonar: Factors */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateFactor] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MJ_BizApps_Sonar: Factors */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Factors
-- Item: spUpdateFactor
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR Factor
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spUpdateFactor]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spUpdateFactor];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spUpdateFactor]
    @ID uniqueidentifier,
    @Name nvarchar(200) = NULL,
    @Slug nvarchar(100) = NULL,
    @Description_Clear bit = 0,
    @Description nvarchar(MAX) = NULL,
    @ScoreModelID_Clear bit = 0,
    @ScoreModelID uniqueidentifier = NULL,
    @AnchorEntityID uniqueidentifier = NULL,
    @FactorType nvarchar(20) = NULL,
    @SourceRelatedEntityID_Clear bit = 0,
    @SourceRelatedEntityID uniqueidentifier = NULL,
    @SourceEntityID_Clear bit = 0,
    @SourceEntityID uniqueidentifier = NULL,
    @FilterExpression_Clear bit = 0,
    @FilterExpression nvarchar(MAX) = NULL,
    @Aggregation_Clear bit = 0,
    @Aggregation nvarchar(20) = NULL,
    @AggregateFieldName_Clear bit = 0,
    @AggregateFieldName nvarchar(200) = NULL,
    @TimeWindowID_Clear bit = 0,
    @TimeWindowID uniqueidentifier = NULL,
    @RecencyDecayHalfLifeDays_Clear bit = 0,
    @RecencyDecayHalfLifeDays int = NULL,
    @ActionID_Clear bit = 0,
    @ActionID uniqueidentifier = NULL,
    @ActionParamsJSON_Clear bit = 0,
    @ActionParamsJSON nvarchar(MAX) = NULL,
    @ExecutionMode_Clear bit = 0,
    @ExecutionMode nvarchar(12) = NULL,
    @IsExpensive bit = NULL,
    @MaxConcurrency_Clear bit = 0,
    @MaxConcurrency int = NULL,
    @RateLimitPerMinute_Clear bit = 0,
    @RateLimitPerMinute int = NULL,
    @CacheTTLSeconds_Clear bit = 0,
    @CacheTTLSeconds int = NULL,
    @SourceScoreModelID_Clear bit = 0,
    @SourceScoreModelID uniqueidentifier = NULL,
    @RawDataType_Clear bit = 0,
    @RawDataType nvarchar(12) = NULL,
    @NormalizationMethod_Clear bit = 0,
    @NormalizationMethod nvarchar(20) = NULL,
    @NormalizationParamsJSON_Clear bit = 0,
    @NormalizationParamsJSON nvarchar(MAX) = NULL,
    @OutputMin_Clear bit = 0,
    @OutputMin decimal(9, 4) = NULL,
    @OutputMax_Clear bit = 0,
    @OutputMax decimal(9, 4) = NULL,
    @HigherIsBetter bit = NULL,
    @PromotionState_Clear bit = 0,
    @PromotionState nvarchar(20) = NULL,
    @LastValidatedAt_Clear bit = 0,
    @LastValidatedAt datetime2 = NULL,
    @CreatedByAgent_Clear bit = 0,
    @CreatedByAgent nvarchar(60) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[Factor]
    SET
        [Name] = ISNULL(@Name, [Name]),
        [Slug] = ISNULL(@Slug, [Slug]),
        [Description] = CASE WHEN @Description_Clear = 1 THEN NULL ELSE ISNULL(@Description, [Description]) END,
        [ScoreModelID] = CASE WHEN @ScoreModelID_Clear = 1 THEN NULL ELSE ISNULL(@ScoreModelID, [ScoreModelID]) END,
        [AnchorEntityID] = ISNULL(@AnchorEntityID, [AnchorEntityID]),
        [FactorType] = ISNULL(@FactorType, [FactorType]),
        [SourceRelatedEntityID] = CASE WHEN @SourceRelatedEntityID_Clear = 1 THEN NULL ELSE ISNULL(@SourceRelatedEntityID, [SourceRelatedEntityID]) END,
        [SourceEntityID] = CASE WHEN @SourceEntityID_Clear = 1 THEN NULL ELSE ISNULL(@SourceEntityID, [SourceEntityID]) END,
        [FilterExpression] = CASE WHEN @FilterExpression_Clear = 1 THEN NULL ELSE ISNULL(@FilterExpression, [FilterExpression]) END,
        [Aggregation] = CASE WHEN @Aggregation_Clear = 1 THEN NULL ELSE ISNULL(@Aggregation, [Aggregation]) END,
        [AggregateFieldName] = CASE WHEN @AggregateFieldName_Clear = 1 THEN NULL ELSE ISNULL(@AggregateFieldName, [AggregateFieldName]) END,
        [TimeWindowID] = CASE WHEN @TimeWindowID_Clear = 1 THEN NULL ELSE ISNULL(@TimeWindowID, [TimeWindowID]) END,
        [RecencyDecayHalfLifeDays] = CASE WHEN @RecencyDecayHalfLifeDays_Clear = 1 THEN NULL ELSE ISNULL(@RecencyDecayHalfLifeDays, [RecencyDecayHalfLifeDays]) END,
        [ActionID] = CASE WHEN @ActionID_Clear = 1 THEN NULL ELSE ISNULL(@ActionID, [ActionID]) END,
        [ActionParamsJSON] = CASE WHEN @ActionParamsJSON_Clear = 1 THEN NULL ELSE ISNULL(@ActionParamsJSON, [ActionParamsJSON]) END,
        [ExecutionMode] = CASE WHEN @ExecutionMode_Clear = 1 THEN NULL ELSE ISNULL(@ExecutionMode, [ExecutionMode]) END,
        [IsExpensive] = ISNULL(@IsExpensive, [IsExpensive]),
        [MaxConcurrency] = CASE WHEN @MaxConcurrency_Clear = 1 THEN NULL ELSE ISNULL(@MaxConcurrency, [MaxConcurrency]) END,
        [RateLimitPerMinute] = CASE WHEN @RateLimitPerMinute_Clear = 1 THEN NULL ELSE ISNULL(@RateLimitPerMinute, [RateLimitPerMinute]) END,
        [CacheTTLSeconds] = CASE WHEN @CacheTTLSeconds_Clear = 1 THEN NULL ELSE ISNULL(@CacheTTLSeconds, [CacheTTLSeconds]) END,
        [SourceScoreModelID] = CASE WHEN @SourceScoreModelID_Clear = 1 THEN NULL ELSE ISNULL(@SourceScoreModelID, [SourceScoreModelID]) END,
        [RawDataType] = CASE WHEN @RawDataType_Clear = 1 THEN NULL ELSE ISNULL(@RawDataType, [RawDataType]) END,
        [NormalizationMethod] = CASE WHEN @NormalizationMethod_Clear = 1 THEN NULL ELSE ISNULL(@NormalizationMethod, [NormalizationMethod]) END,
        [NormalizationParamsJSON] = CASE WHEN @NormalizationParamsJSON_Clear = 1 THEN NULL ELSE ISNULL(@NormalizationParamsJSON, [NormalizationParamsJSON]) END,
        [OutputMin] = CASE WHEN @OutputMin_Clear = 1 THEN NULL ELSE ISNULL(@OutputMin, [OutputMin]) END,
        [OutputMax] = CASE WHEN @OutputMax_Clear = 1 THEN NULL ELSE ISNULL(@OutputMax, [OutputMax]) END,
        [HigherIsBetter] = ISNULL(@HigherIsBetter, [HigherIsBetter]),
        [PromotionState] = CASE WHEN @PromotionState_Clear = 1 THEN NULL ELSE ISNULL(@PromotionState, [PromotionState]) END,
        [LastValidatedAt] = CASE WHEN @LastValidatedAt_Clear = 1 THEN NULL ELSE ISNULL(@LastValidatedAt, [LastValidatedAt]) END,
        [CreatedByAgent] = CASE WHEN @CreatedByAgent_Clear = 1 THEN NULL ELSE ISNULL(@CreatedByAgent, [CreatedByAgent]) END
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [${flyway:defaultSchema}].[vwFactors] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [${flyway:defaultSchema}].[vwFactors]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateFactor] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the Factor table
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[trgUpdateFactor]', 'TR') IS NOT NULL
    DROP TRIGGER [${flyway:defaultSchema}].[trgUpdateFactor];
GO
CREATE TRIGGER [${flyway:defaultSchema}].trgUpdateFactor
ON [${flyway:defaultSchema}].[Factor]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[Factor]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [${flyway:defaultSchema}].[Factor] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MJ_BizApps_Sonar: Factors */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateFactor] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MJ_BizApps_Sonar: Factors */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Factors
-- Item: spDeleteFactor
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR Factor
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spDeleteFactor]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spDeleteFactor];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spDeleteFactor]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [${flyway:defaultSchema}].[Factor]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteFactor] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MJ_BizApps_Sonar: Factors */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteFactor] TO [cdp_Developer], [cdp_Integration];

/* Index for Foreign Keys for ScoreBand */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Bands
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------
-- Index for foreign key BandSetID in table ScoreBand
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ScoreBand_BandSetID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ScoreBand]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ScoreBand_BandSetID ON [${flyway:defaultSchema}].[ScoreBand] ([BandSetID]);

/* SQL text to update entity field related entity name field map for entity field ID 80527846-BB27-48C6-B4CE-6A97FF6E79B2 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='80527846-BB27-48C6-B4CE-6A97FF6E79B2', @RelatedEntityNameFieldMap='BandSet';

/* Index for Foreign Keys for ScoreFactorContribution */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Factor Contributions
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------
-- Index for foreign key ScoreID in table ScoreFactorContribution
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ScoreFactorContribution_ScoreID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ScoreFactorContribution]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ScoreFactorContribution_ScoreID ON [${flyway:defaultSchema}].[ScoreFactorContribution] ([ScoreID]);

-- Index for foreign key ModelFactorID in table ScoreFactorContribution
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ScoreFactorContribution_ModelFactorID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ScoreFactorContribution]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ScoreFactorContribution_ModelFactorID ON [${flyway:defaultSchema}].[ScoreFactorContribution] ([ModelFactorID]);

-- Index for foreign key FactorID in table ScoreFactorContribution
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ScoreFactorContribution_FactorID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ScoreFactorContribution]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ScoreFactorContribution_FactorID ON [${flyway:defaultSchema}].[ScoreFactorContribution] ([FactorID]);

/* SQL text to update entity field related entity name field map for entity field ID FDAEC25E-0988-44E7-8DB7-1DF1EE5619CF */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='FDAEC25E-0988-44E7-8DB7-1DF1EE5619CF', @RelatedEntityNameFieldMap='Factor';

/* Index for Foreign Keys for ScoreHistory */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Histories
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------
-- Index for foreign key ScoreModelID in table ScoreHistory
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ScoreHistory_ScoreModelID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ScoreHistory]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ScoreHistory_ScoreModelID ON [${flyway:defaultSchema}].[ScoreHistory] ([ScoreModelID]);

-- Index for foreign key ScoreModelVersionID in table ScoreHistory
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ScoreHistory_ScoreModelVersionID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ScoreHistory]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ScoreHistory_ScoreModelVersionID ON [${flyway:defaultSchema}].[ScoreHistory] ([ScoreModelVersionID]);

-- Index for foreign key AnchorEntityID in table ScoreHistory
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ScoreHistory_AnchorEntityID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ScoreHistory]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ScoreHistory_AnchorEntityID ON [${flyway:defaultSchema}].[ScoreHistory] ([AnchorEntityID]);

-- Index for foreign key BandID in table ScoreHistory
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ScoreHistory_BandID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ScoreHistory]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ScoreHistory_BandID ON [${flyway:defaultSchema}].[ScoreHistory] ([BandID]);

/* SQL text to update entity field related entity name field map for entity field ID A70CBC88-15E2-49EB-B05E-5169FC0546B1 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='A70CBC88-15E2-49EB-B05E-5169FC0546B1', @RelatedEntityNameFieldMap='ScoreModel';

/* Index for Foreign Keys for ScoreModelAuditEvent */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Model Audit Events
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------
-- Index for foreign key ScoreModelID in table ScoreModelAuditEvent
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ScoreModelAuditEvent_ScoreModelID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ScoreModelAuditEvent]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ScoreModelAuditEvent_ScoreModelID ON [${flyway:defaultSchema}].[ScoreModelAuditEvent] ([ScoreModelID]);

-- Index for foreign key ChangedByUserID in table ScoreModelAuditEvent
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ScoreModelAuditEvent_ChangedByUserID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ScoreModelAuditEvent]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ScoreModelAuditEvent_ChangedByUserID ON [${flyway:defaultSchema}].[ScoreModelAuditEvent] ([ChangedByUserID]);

/* SQL text to update entity field related entity name field map for entity field ID 0640B1B2-7AB6-4A64-98C3-04E85487E695 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='0640B1B2-7AB6-4A64-98C3-04E85487E695', @RelatedEntityNameFieldMap='ScoreModel';

/* Index for Foreign Keys for ScoreModelVersion */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Model Versions
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------
-- Index for foreign key ScoreModelID in table ScoreModelVersion
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ScoreModelVersion_ScoreModelID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ScoreModelVersion]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ScoreModelVersion_ScoreModelID ON [${flyway:defaultSchema}].[ScoreModelVersion] ([ScoreModelID]);

-- Index for foreign key PublishedByUserID in table ScoreModelVersion
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ScoreModelVersion_PublishedByUserID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ScoreModelVersion]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ScoreModelVersion_PublishedByUserID ON [${flyway:defaultSchema}].[ScoreModelVersion] ([PublishedByUserID]);

/* SQL text to update entity field related entity name field map for entity field ID 5A016A29-2C1A-4DA6-BCBF-8EF6004901A0 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='5A016A29-2C1A-4DA6-BCBF-8EF6004901A0', @RelatedEntityNameFieldMap='ScoreModel';

/* SQL text to update entity field related entity name field map for entity field ID F959108C-40B9-4A15-A880-1BE1E2E64BA3 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='F959108C-40B9-4A15-A880-1BE1E2E64BA3', @RelatedEntityNameFieldMap='ChangedByUser';

/* SQL text to update entity field related entity name field map for entity field ID 13AF8AD0-D49E-439D-A30B-8EAC8521C498 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='13AF8AD0-D49E-439D-A30B-8EAC8521C498', @RelatedEntityNameFieldMap='AnchorEntity';

/* Base View SQL for MJ_BizApps_Sonar: Score Factor Contributions */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Factor Contributions
-- Item: vwScoreFactorContributions
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MJ_BizApps_Sonar: Score Factor Contributions
-----               SCHEMA:      ${flyway:defaultSchema}
-----               BASE TABLE:  ScoreFactorContribution
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[vwScoreFactorContributions]', 'V') IS NOT NULL
    DROP VIEW [${flyway:defaultSchema}].[vwScoreFactorContributions];
GO

CREATE VIEW [${flyway:defaultSchema}].[vwScoreFactorContributions]
AS
SELECT
    s.*,
    sonarFactor_FactorID.[Name] AS [Factor]
FROM
    [${flyway:defaultSchema}].[ScoreFactorContribution] AS s
INNER JOIN
    [${flyway:defaultSchema}].[Factor] AS sonarFactor_FactorID
  ON
    [s].[FactorID] = sonarFactor_FactorID.[ID]
GO
GRANT SELECT ON [${flyway:defaultSchema}].[vwScoreFactorContributions] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MJ_BizApps_Sonar: Score Factor Contributions */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Factor Contributions
-- Item: Permissions for vwScoreFactorContributions
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [${flyway:defaultSchema}].[vwScoreFactorContributions] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MJ_BizApps_Sonar: Score Factor Contributions */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Factor Contributions
-- Item: spCreateScoreFactorContribution
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR ScoreFactorContribution
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spCreateScoreFactorContribution]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spCreateScoreFactorContribution];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spCreateScoreFactorContribution]
    @ID uniqueidentifier = NULL,
    @ScoreID uniqueidentifier,
    @ModelFactorID uniqueidentifier,
    @FactorID uniqueidentifier,
    @RawValue_Clear bit = 0,
    @RawValue decimal(18, 6) = NULL,
    @NormalizedValue_Clear bit = 0,
    @NormalizedValue decimal(9, 4) = NULL,
    @WeightedContribution_Clear bit = 0,
    @WeightedContribution decimal(12, 4) = NULL,
    @PercentOfTotal_Clear bit = 0,
    @PercentOfTotal decimal(5, 4) = NULL,
    @ContributionDelta_Clear bit = 0,
    @ContributionDelta decimal(12, 4) = NULL,
    @HadData bit = NULL,
    @MissingDataApplied bit = NULL,
    @DetailJSON_Clear bit = 0,
    @DetailJSON nvarchar(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)
    
    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [${flyway:defaultSchema}].[ScoreFactorContribution]
            (
                [ID],
                [ScoreID],
                [ModelFactorID],
                [FactorID],
                [RawValue],
                [NormalizedValue],
                [WeightedContribution],
                [PercentOfTotal],
                [ContributionDelta],
                [HadData],
                [MissingDataApplied],
                [DetailJSON]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @ScoreID,
                @ModelFactorID,
                @FactorID,
                CASE WHEN @RawValue_Clear = 1 THEN NULL ELSE ISNULL(@RawValue, NULL) END,
                CASE WHEN @NormalizedValue_Clear = 1 THEN NULL ELSE ISNULL(@NormalizedValue, NULL) END,
                CASE WHEN @WeightedContribution_Clear = 1 THEN NULL ELSE ISNULL(@WeightedContribution, NULL) END,
                CASE WHEN @PercentOfTotal_Clear = 1 THEN NULL ELSE ISNULL(@PercentOfTotal, NULL) END,
                CASE WHEN @ContributionDelta_Clear = 1 THEN NULL ELSE ISNULL(@ContributionDelta, NULL) END,
                ISNULL(@HadData, 0),
                ISNULL(@MissingDataApplied, 0),
                CASE WHEN @DetailJSON_Clear = 1 THEN NULL ELSE ISNULL(@DetailJSON, NULL) END
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [${flyway:defaultSchema}].[ScoreFactorContribution]
            (
                [ScoreID],
                [ModelFactorID],
                [FactorID],
                [RawValue],
                [NormalizedValue],
                [WeightedContribution],
                [PercentOfTotal],
                [ContributionDelta],
                [HadData],
                [MissingDataApplied],
                [DetailJSON]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ScoreID,
                @ModelFactorID,
                @FactorID,
                CASE WHEN @RawValue_Clear = 1 THEN NULL ELSE ISNULL(@RawValue, NULL) END,
                CASE WHEN @NormalizedValue_Clear = 1 THEN NULL ELSE ISNULL(@NormalizedValue, NULL) END,
                CASE WHEN @WeightedContribution_Clear = 1 THEN NULL ELSE ISNULL(@WeightedContribution, NULL) END,
                CASE WHEN @PercentOfTotal_Clear = 1 THEN NULL ELSE ISNULL(@PercentOfTotal, NULL) END,
                CASE WHEN @ContributionDelta_Clear = 1 THEN NULL ELSE ISNULL(@ContributionDelta, NULL) END,
                ISNULL(@HadData, 0),
                ISNULL(@MissingDataApplied, 0),
                CASE WHEN @DetailJSON_Clear = 1 THEN NULL ELSE ISNULL(@DetailJSON, NULL) END
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [${flyway:defaultSchema}].[vwScoreFactorContributions] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateScoreFactorContribution] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MJ_BizApps_Sonar: Score Factor Contributions */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateScoreFactorContribution] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MJ_BizApps_Sonar: Score Factor Contributions */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Factor Contributions
-- Item: spUpdateScoreFactorContribution
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR ScoreFactorContribution
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spUpdateScoreFactorContribution]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spUpdateScoreFactorContribution];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spUpdateScoreFactorContribution]
    @ID uniqueidentifier,
    @ScoreID uniqueidentifier = NULL,
    @ModelFactorID uniqueidentifier = NULL,
    @FactorID uniqueidentifier = NULL,
    @RawValue_Clear bit = 0,
    @RawValue decimal(18, 6) = NULL,
    @NormalizedValue_Clear bit = 0,
    @NormalizedValue decimal(9, 4) = NULL,
    @WeightedContribution_Clear bit = 0,
    @WeightedContribution decimal(12, 4) = NULL,
    @PercentOfTotal_Clear bit = 0,
    @PercentOfTotal decimal(5, 4) = NULL,
    @ContributionDelta_Clear bit = 0,
    @ContributionDelta decimal(12, 4) = NULL,
    @HadData bit = NULL,
    @MissingDataApplied bit = NULL,
    @DetailJSON_Clear bit = 0,
    @DetailJSON nvarchar(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[ScoreFactorContribution]
    SET
        [ScoreID] = ISNULL(@ScoreID, [ScoreID]),
        [ModelFactorID] = ISNULL(@ModelFactorID, [ModelFactorID]),
        [FactorID] = ISNULL(@FactorID, [FactorID]),
        [RawValue] = CASE WHEN @RawValue_Clear = 1 THEN NULL ELSE ISNULL(@RawValue, [RawValue]) END,
        [NormalizedValue] = CASE WHEN @NormalizedValue_Clear = 1 THEN NULL ELSE ISNULL(@NormalizedValue, [NormalizedValue]) END,
        [WeightedContribution] = CASE WHEN @WeightedContribution_Clear = 1 THEN NULL ELSE ISNULL(@WeightedContribution, [WeightedContribution]) END,
        [PercentOfTotal] = CASE WHEN @PercentOfTotal_Clear = 1 THEN NULL ELSE ISNULL(@PercentOfTotal, [PercentOfTotal]) END,
        [ContributionDelta] = CASE WHEN @ContributionDelta_Clear = 1 THEN NULL ELSE ISNULL(@ContributionDelta, [ContributionDelta]) END,
        [HadData] = ISNULL(@HadData, [HadData]),
        [MissingDataApplied] = ISNULL(@MissingDataApplied, [MissingDataApplied]),
        [DetailJSON] = CASE WHEN @DetailJSON_Clear = 1 THEN NULL ELSE ISNULL(@DetailJSON, [DetailJSON]) END
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [${flyway:defaultSchema}].[vwScoreFactorContributions] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [${flyway:defaultSchema}].[vwScoreFactorContributions]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateScoreFactorContribution] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the ScoreFactorContribution table
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[trgUpdateScoreFactorContribution]', 'TR') IS NOT NULL
    DROP TRIGGER [${flyway:defaultSchema}].[trgUpdateScoreFactorContribution];
GO
CREATE TRIGGER [${flyway:defaultSchema}].trgUpdateScoreFactorContribution
ON [${flyway:defaultSchema}].[ScoreFactorContribution]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[ScoreFactorContribution]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [${flyway:defaultSchema}].[ScoreFactorContribution] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MJ_BizApps_Sonar: Score Factor Contributions */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateScoreFactorContribution] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MJ_BizApps_Sonar: Score Factor Contributions */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Factor Contributions
-- Item: spDeleteScoreFactorContribution
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR ScoreFactorContribution
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spDeleteScoreFactorContribution]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spDeleteScoreFactorContribution];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spDeleteScoreFactorContribution]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [${flyway:defaultSchema}].[ScoreFactorContribution]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteScoreFactorContribution] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MJ_BizApps_Sonar: Score Factor Contributions */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteScoreFactorContribution] TO [cdp_Developer], [cdp_Integration];

/* Base View SQL for MJ_BizApps_Sonar: Score Bands */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Bands
-- Item: vwScoreBands
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MJ_BizApps_Sonar: Score Bands
-----               SCHEMA:      ${flyway:defaultSchema}
-----               BASE TABLE:  ScoreBand
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[vwScoreBands]', 'V') IS NOT NULL
    DROP VIEW [${flyway:defaultSchema}].[vwScoreBands];
GO

CREATE VIEW [${flyway:defaultSchema}].[vwScoreBands]
AS
SELECT
    s.*,
    sonarScoreBandSet_BandSetID.[Name] AS [BandSet]
FROM
    [${flyway:defaultSchema}].[ScoreBand] AS s
INNER JOIN
    [${flyway:defaultSchema}].[ScoreBandSet] AS sonarScoreBandSet_BandSetID
  ON
    [s].[BandSetID] = sonarScoreBandSet_BandSetID.[ID]
GO
GRANT SELECT ON [${flyway:defaultSchema}].[vwScoreBands] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MJ_BizApps_Sonar: Score Bands */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Bands
-- Item: Permissions for vwScoreBands
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [${flyway:defaultSchema}].[vwScoreBands] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MJ_BizApps_Sonar: Score Bands */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Bands
-- Item: spCreateScoreBand
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR ScoreBand
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spCreateScoreBand]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spCreateScoreBand];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spCreateScoreBand]
    @ID uniqueidentifier = NULL,
    @BandSetID uniqueidentifier,
    @Label nvarchar(60),
    @MinScore decimal(9, 4),
    @MaxScore decimal(9, 4),
    @Severity int = NULL,
    @ColorHex_Clear bit = 0,
    @ColorHex nvarchar(7) = NULL,
    @IsTerminal bit = NULL,
    @Description_Clear bit = 0,
    @Description nvarchar(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)
    
    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [${flyway:defaultSchema}].[ScoreBand]
            (
                [ID],
                [BandSetID],
                [Label],
                [MinScore],
                [MaxScore],
                [Severity],
                [ColorHex],
                [IsTerminal],
                [Description]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @BandSetID,
                @Label,
                @MinScore,
                @MaxScore,
                ISNULL(@Severity, 0),
                CASE WHEN @ColorHex_Clear = 1 THEN NULL ELSE ISNULL(@ColorHex, NULL) END,
                ISNULL(@IsTerminal, 0),
                CASE WHEN @Description_Clear = 1 THEN NULL ELSE ISNULL(@Description, NULL) END
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [${flyway:defaultSchema}].[ScoreBand]
            (
                [BandSetID],
                [Label],
                [MinScore],
                [MaxScore],
                [Severity],
                [ColorHex],
                [IsTerminal],
                [Description]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @BandSetID,
                @Label,
                @MinScore,
                @MaxScore,
                ISNULL(@Severity, 0),
                CASE WHEN @ColorHex_Clear = 1 THEN NULL ELSE ISNULL(@ColorHex, NULL) END,
                ISNULL(@IsTerminal, 0),
                CASE WHEN @Description_Clear = 1 THEN NULL ELSE ISNULL(@Description, NULL) END
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [${flyway:defaultSchema}].[vwScoreBands] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateScoreBand] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MJ_BizApps_Sonar: Score Bands */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateScoreBand] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MJ_BizApps_Sonar: Score Bands */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Bands
-- Item: spUpdateScoreBand
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR ScoreBand
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spUpdateScoreBand]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spUpdateScoreBand];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spUpdateScoreBand]
    @ID uniqueidentifier,
    @BandSetID uniqueidentifier = NULL,
    @Label nvarchar(60) = NULL,
    @MinScore decimal(9, 4) = NULL,
    @MaxScore decimal(9, 4) = NULL,
    @Severity int = NULL,
    @ColorHex_Clear bit = 0,
    @ColorHex nvarchar(7) = NULL,
    @IsTerminal bit = NULL,
    @Description_Clear bit = 0,
    @Description nvarchar(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[ScoreBand]
    SET
        [BandSetID] = ISNULL(@BandSetID, [BandSetID]),
        [Label] = ISNULL(@Label, [Label]),
        [MinScore] = ISNULL(@MinScore, [MinScore]),
        [MaxScore] = ISNULL(@MaxScore, [MaxScore]),
        [Severity] = ISNULL(@Severity, [Severity]),
        [ColorHex] = CASE WHEN @ColorHex_Clear = 1 THEN NULL ELSE ISNULL(@ColorHex, [ColorHex]) END,
        [IsTerminal] = ISNULL(@IsTerminal, [IsTerminal]),
        [Description] = CASE WHEN @Description_Clear = 1 THEN NULL ELSE ISNULL(@Description, [Description]) END
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [${flyway:defaultSchema}].[vwScoreBands] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [${flyway:defaultSchema}].[vwScoreBands]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateScoreBand] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the ScoreBand table
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[trgUpdateScoreBand]', 'TR') IS NOT NULL
    DROP TRIGGER [${flyway:defaultSchema}].[trgUpdateScoreBand];
GO
CREATE TRIGGER [${flyway:defaultSchema}].trgUpdateScoreBand
ON [${flyway:defaultSchema}].[ScoreBand]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[ScoreBand]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [${flyway:defaultSchema}].[ScoreBand] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MJ_BizApps_Sonar: Score Bands */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateScoreBand] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MJ_BizApps_Sonar: Score Bands */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Bands
-- Item: spDeleteScoreBand
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR ScoreBand
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spDeleteScoreBand]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spDeleteScoreBand];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spDeleteScoreBand]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [${flyway:defaultSchema}].[ScoreBand]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteScoreBand] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MJ_BizApps_Sonar: Score Bands */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteScoreBand] TO [cdp_Developer], [cdp_Integration];

/* SQL text to update entity field related entity name field map for entity field ID BD4E9E55-B077-4F79-A78D-6EB63893E5D1 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='BD4E9E55-B077-4F79-A78D-6EB63893E5D1', @RelatedEntityNameFieldMap='PublishedByUser';

/* Base View SQL for MJ_BizApps_Sonar: Score Model Audit Events */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Model Audit Events
-- Item: vwScoreModelAuditEvents
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MJ_BizApps_Sonar: Score Model Audit Events
-----               SCHEMA:      ${flyway:defaultSchema}
-----               BASE TABLE:  ScoreModelAuditEvent
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[vwScoreModelAuditEvents]', 'V') IS NOT NULL
    DROP VIEW [${flyway:defaultSchema}].[vwScoreModelAuditEvents];
GO

CREATE VIEW [${flyway:defaultSchema}].[vwScoreModelAuditEvents]
AS
SELECT
    s.*,
    sonarScoreModel_ScoreModelID.[Name] AS [ScoreModel],
    MJUser_ChangedByUserID.[Name] AS [ChangedByUser]
FROM
    [${flyway:defaultSchema}].[ScoreModelAuditEvent] AS s
INNER JOIN
    [${flyway:defaultSchema}].[ScoreModel] AS sonarScoreModel_ScoreModelID
  ON
    [s].[ScoreModelID] = sonarScoreModel_ScoreModelID.[ID]
LEFT OUTER JOIN
    [${mjSchema}].[User] AS MJUser_ChangedByUserID
  ON
    [s].[ChangedByUserID] = MJUser_ChangedByUserID.[ID]
GO
GRANT SELECT ON [${flyway:defaultSchema}].[vwScoreModelAuditEvents] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MJ_BizApps_Sonar: Score Model Audit Events */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Model Audit Events
-- Item: Permissions for vwScoreModelAuditEvents
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [${flyway:defaultSchema}].[vwScoreModelAuditEvents] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MJ_BizApps_Sonar: Score Model Audit Events */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Model Audit Events
-- Item: spCreateScoreModelAuditEvent
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR ScoreModelAuditEvent
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spCreateScoreModelAuditEvent]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spCreateScoreModelAuditEvent];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spCreateScoreModelAuditEvent]
    @ID uniqueidentifier = NULL,
    @ScoreModelID uniqueidentifier,
    @EntityChanged nvarchar(100),
    @RecordID_Clear bit = 0,
    @RecordID nvarchar(100) = NULL,
    @ChangeType nvarchar(20),
    @BeforeJSON_Clear bit = 0,
    @BeforeJSON nvarchar(MAX) = NULL,
    @AfterJSON_Clear bit = 0,
    @AfterJSON nvarchar(MAX) = NULL,
    @ChangedByUserID_Clear bit = 0,
    @ChangedByUserID uniqueidentifier = NULL,
    @ChangedAt datetime2 = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)
    
    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [${flyway:defaultSchema}].[ScoreModelAuditEvent]
            (
                [ID],
                [ScoreModelID],
                [EntityChanged],
                [RecordID],
                [ChangeType],
                [BeforeJSON],
                [AfterJSON],
                [ChangedByUserID],
                [ChangedAt]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @ScoreModelID,
                @EntityChanged,
                CASE WHEN @RecordID_Clear = 1 THEN NULL ELSE ISNULL(@RecordID, NULL) END,
                @ChangeType,
                CASE WHEN @BeforeJSON_Clear = 1 THEN NULL ELSE ISNULL(@BeforeJSON, NULL) END,
                CASE WHEN @AfterJSON_Clear = 1 THEN NULL ELSE ISNULL(@AfterJSON, NULL) END,
                CASE WHEN @ChangedByUserID_Clear = 1 THEN NULL ELSE ISNULL(@ChangedByUserID, NULL) END,
                ISNULL(@ChangedAt, getutcdate())
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [${flyway:defaultSchema}].[ScoreModelAuditEvent]
            (
                [ScoreModelID],
                [EntityChanged],
                [RecordID],
                [ChangeType],
                [BeforeJSON],
                [AfterJSON],
                [ChangedByUserID],
                [ChangedAt]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ScoreModelID,
                @EntityChanged,
                CASE WHEN @RecordID_Clear = 1 THEN NULL ELSE ISNULL(@RecordID, NULL) END,
                @ChangeType,
                CASE WHEN @BeforeJSON_Clear = 1 THEN NULL ELSE ISNULL(@BeforeJSON, NULL) END,
                CASE WHEN @AfterJSON_Clear = 1 THEN NULL ELSE ISNULL(@AfterJSON, NULL) END,
                CASE WHEN @ChangedByUserID_Clear = 1 THEN NULL ELSE ISNULL(@ChangedByUserID, NULL) END,
                ISNULL(@ChangedAt, getutcdate())
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [${flyway:defaultSchema}].[vwScoreModelAuditEvents] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateScoreModelAuditEvent] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MJ_BizApps_Sonar: Score Model Audit Events */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateScoreModelAuditEvent] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MJ_BizApps_Sonar: Score Model Audit Events */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Model Audit Events
-- Item: spUpdateScoreModelAuditEvent
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR ScoreModelAuditEvent
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spUpdateScoreModelAuditEvent]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spUpdateScoreModelAuditEvent];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spUpdateScoreModelAuditEvent]
    @ID uniqueidentifier,
    @ScoreModelID uniqueidentifier = NULL,
    @EntityChanged nvarchar(100) = NULL,
    @RecordID_Clear bit = 0,
    @RecordID nvarchar(100) = NULL,
    @ChangeType nvarchar(20) = NULL,
    @BeforeJSON_Clear bit = 0,
    @BeforeJSON nvarchar(MAX) = NULL,
    @AfterJSON_Clear bit = 0,
    @AfterJSON nvarchar(MAX) = NULL,
    @ChangedByUserID_Clear bit = 0,
    @ChangedByUserID uniqueidentifier = NULL,
    @ChangedAt datetime2 = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[ScoreModelAuditEvent]
    SET
        [ScoreModelID] = ISNULL(@ScoreModelID, [ScoreModelID]),
        [EntityChanged] = ISNULL(@EntityChanged, [EntityChanged]),
        [RecordID] = CASE WHEN @RecordID_Clear = 1 THEN NULL ELSE ISNULL(@RecordID, [RecordID]) END,
        [ChangeType] = ISNULL(@ChangeType, [ChangeType]),
        [BeforeJSON] = CASE WHEN @BeforeJSON_Clear = 1 THEN NULL ELSE ISNULL(@BeforeJSON, [BeforeJSON]) END,
        [AfterJSON] = CASE WHEN @AfterJSON_Clear = 1 THEN NULL ELSE ISNULL(@AfterJSON, [AfterJSON]) END,
        [ChangedByUserID] = CASE WHEN @ChangedByUserID_Clear = 1 THEN NULL ELSE ISNULL(@ChangedByUserID, [ChangedByUserID]) END,
        [ChangedAt] = ISNULL(@ChangedAt, [ChangedAt])
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [${flyway:defaultSchema}].[vwScoreModelAuditEvents] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [${flyway:defaultSchema}].[vwScoreModelAuditEvents]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateScoreModelAuditEvent] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the ScoreModelAuditEvent table
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[trgUpdateScoreModelAuditEvent]', 'TR') IS NOT NULL
    DROP TRIGGER [${flyway:defaultSchema}].[trgUpdateScoreModelAuditEvent];
GO
CREATE TRIGGER [${flyway:defaultSchema}].trgUpdateScoreModelAuditEvent
ON [${flyway:defaultSchema}].[ScoreModelAuditEvent]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[ScoreModelAuditEvent]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [${flyway:defaultSchema}].[ScoreModelAuditEvent] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MJ_BizApps_Sonar: Score Model Audit Events */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateScoreModelAuditEvent] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MJ_BizApps_Sonar: Score Model Audit Events */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Model Audit Events
-- Item: spDeleteScoreModelAuditEvent
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR ScoreModelAuditEvent
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spDeleteScoreModelAuditEvent]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spDeleteScoreModelAuditEvent];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spDeleteScoreModelAuditEvent]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [${flyway:defaultSchema}].[ScoreModelAuditEvent]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteScoreModelAuditEvent] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MJ_BizApps_Sonar: Score Model Audit Events */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteScoreModelAuditEvent] TO [cdp_Developer], [cdp_Integration];

/* Base View SQL for MJ_BizApps_Sonar: Score Histories */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Histories
-- Item: vwScoreHistories
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MJ_BizApps_Sonar: Score Histories
-----               SCHEMA:      ${flyway:defaultSchema}
-----               BASE TABLE:  ScoreHistory
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[vwScoreHistories]', 'V') IS NOT NULL
    DROP VIEW [${flyway:defaultSchema}].[vwScoreHistories];
GO

CREATE VIEW [${flyway:defaultSchema}].[vwScoreHistories]
AS
SELECT
    s.*,
    sonarScoreModel_ScoreModelID.[Name] AS [ScoreModel],
    MJEntity_AnchorEntityID.[Name] AS [AnchorEntity]
FROM
    [${flyway:defaultSchema}].[ScoreHistory] AS s
INNER JOIN
    [${flyway:defaultSchema}].[ScoreModel] AS sonarScoreModel_ScoreModelID
  ON
    [s].[ScoreModelID] = sonarScoreModel_ScoreModelID.[ID]
INNER JOIN
    [${mjSchema}].[Entity] AS MJEntity_AnchorEntityID
  ON
    [s].[AnchorEntityID] = MJEntity_AnchorEntityID.[ID]
GO
GRANT SELECT ON [${flyway:defaultSchema}].[vwScoreHistories] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MJ_BizApps_Sonar: Score Histories */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Histories
-- Item: Permissions for vwScoreHistories
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [${flyway:defaultSchema}].[vwScoreHistories] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MJ_BizApps_Sonar: Score Histories */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Histories
-- Item: spCreateScoreHistory
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR ScoreHistory
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spCreateScoreHistory]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spCreateScoreHistory];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spCreateScoreHistory]
    @ID uniqueidentifier = NULL,
    @ScoreModelID uniqueidentifier,
    @ScoreModelVersionID uniqueidentifier,
    @AnchorEntityID uniqueidentifier,
    @AnchorRecordID nvarchar(100),
    @NormalizedScore_Clear bit = 0,
    @NormalizedScore decimal(9, 4) = NULL,
    @BandID_Clear bit = 0,
    @BandID uniqueidentifier = NULL,
    @AsOfDate_Clear bit = 0,
    @AsOfDate datetime2 = NULL,
    @ComputedAt datetime2 = NULL,
    @DataCompleteness_Clear bit = 0,
    @DataCompleteness decimal(5, 4) = NULL,
    @Confidence_Clear bit = 0,
    @Confidence decimal(5, 4) = NULL,
    @ContributionsJSON_Clear bit = 0,
    @ContributionsJSON nvarchar(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)
    
    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [${flyway:defaultSchema}].[ScoreHistory]
            (
                [ID],
                [ScoreModelID],
                [ScoreModelVersionID],
                [AnchorEntityID],
                [AnchorRecordID],
                [NormalizedScore],
                [BandID],
                [AsOfDate],
                [ComputedAt],
                [DataCompleteness],
                [Confidence],
                [ContributionsJSON]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @ScoreModelID,
                @ScoreModelVersionID,
                @AnchorEntityID,
                @AnchorRecordID,
                CASE WHEN @NormalizedScore_Clear = 1 THEN NULL ELSE ISNULL(@NormalizedScore, NULL) END,
                CASE WHEN @BandID_Clear = 1 THEN NULL ELSE ISNULL(@BandID, NULL) END,
                CASE WHEN @AsOfDate_Clear = 1 THEN NULL ELSE ISNULL(@AsOfDate, NULL) END,
                ISNULL(@ComputedAt, getutcdate()),
                CASE WHEN @DataCompleteness_Clear = 1 THEN NULL ELSE ISNULL(@DataCompleteness, NULL) END,
                CASE WHEN @Confidence_Clear = 1 THEN NULL ELSE ISNULL(@Confidence, NULL) END,
                CASE WHEN @ContributionsJSON_Clear = 1 THEN NULL ELSE ISNULL(@ContributionsJSON, NULL) END
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [${flyway:defaultSchema}].[ScoreHistory]
            (
                [ScoreModelID],
                [ScoreModelVersionID],
                [AnchorEntityID],
                [AnchorRecordID],
                [NormalizedScore],
                [BandID],
                [AsOfDate],
                [ComputedAt],
                [DataCompleteness],
                [Confidence],
                [ContributionsJSON]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ScoreModelID,
                @ScoreModelVersionID,
                @AnchorEntityID,
                @AnchorRecordID,
                CASE WHEN @NormalizedScore_Clear = 1 THEN NULL ELSE ISNULL(@NormalizedScore, NULL) END,
                CASE WHEN @BandID_Clear = 1 THEN NULL ELSE ISNULL(@BandID, NULL) END,
                CASE WHEN @AsOfDate_Clear = 1 THEN NULL ELSE ISNULL(@AsOfDate, NULL) END,
                ISNULL(@ComputedAt, getutcdate()),
                CASE WHEN @DataCompleteness_Clear = 1 THEN NULL ELSE ISNULL(@DataCompleteness, NULL) END,
                CASE WHEN @Confidence_Clear = 1 THEN NULL ELSE ISNULL(@Confidence, NULL) END,
                CASE WHEN @ContributionsJSON_Clear = 1 THEN NULL ELSE ISNULL(@ContributionsJSON, NULL) END
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [${flyway:defaultSchema}].[vwScoreHistories] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateScoreHistory] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MJ_BizApps_Sonar: Score Histories */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateScoreHistory] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MJ_BizApps_Sonar: Score Histories */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Histories
-- Item: spUpdateScoreHistory
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR ScoreHistory
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spUpdateScoreHistory]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spUpdateScoreHistory];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spUpdateScoreHistory]
    @ID uniqueidentifier,
    @ScoreModelID uniqueidentifier = NULL,
    @ScoreModelVersionID uniqueidentifier = NULL,
    @AnchorEntityID uniqueidentifier = NULL,
    @AnchorRecordID nvarchar(100) = NULL,
    @NormalizedScore_Clear bit = 0,
    @NormalizedScore decimal(9, 4) = NULL,
    @BandID_Clear bit = 0,
    @BandID uniqueidentifier = NULL,
    @AsOfDate_Clear bit = 0,
    @AsOfDate datetime2 = NULL,
    @ComputedAt datetime2 = NULL,
    @DataCompleteness_Clear bit = 0,
    @DataCompleteness decimal(5, 4) = NULL,
    @Confidence_Clear bit = 0,
    @Confidence decimal(5, 4) = NULL,
    @ContributionsJSON_Clear bit = 0,
    @ContributionsJSON nvarchar(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[ScoreHistory]
    SET
        [ScoreModelID] = ISNULL(@ScoreModelID, [ScoreModelID]),
        [ScoreModelVersionID] = ISNULL(@ScoreModelVersionID, [ScoreModelVersionID]),
        [AnchorEntityID] = ISNULL(@AnchorEntityID, [AnchorEntityID]),
        [AnchorRecordID] = ISNULL(@AnchorRecordID, [AnchorRecordID]),
        [NormalizedScore] = CASE WHEN @NormalizedScore_Clear = 1 THEN NULL ELSE ISNULL(@NormalizedScore, [NormalizedScore]) END,
        [BandID] = CASE WHEN @BandID_Clear = 1 THEN NULL ELSE ISNULL(@BandID, [BandID]) END,
        [AsOfDate] = CASE WHEN @AsOfDate_Clear = 1 THEN NULL ELSE ISNULL(@AsOfDate, [AsOfDate]) END,
        [ComputedAt] = ISNULL(@ComputedAt, [ComputedAt]),
        [DataCompleteness] = CASE WHEN @DataCompleteness_Clear = 1 THEN NULL ELSE ISNULL(@DataCompleteness, [DataCompleteness]) END,
        [Confidence] = CASE WHEN @Confidence_Clear = 1 THEN NULL ELSE ISNULL(@Confidence, [Confidence]) END,
        [ContributionsJSON] = CASE WHEN @ContributionsJSON_Clear = 1 THEN NULL ELSE ISNULL(@ContributionsJSON, [ContributionsJSON]) END
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [${flyway:defaultSchema}].[vwScoreHistories] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [${flyway:defaultSchema}].[vwScoreHistories]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateScoreHistory] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the ScoreHistory table
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[trgUpdateScoreHistory]', 'TR') IS NOT NULL
    DROP TRIGGER [${flyway:defaultSchema}].[trgUpdateScoreHistory];
GO
CREATE TRIGGER [${flyway:defaultSchema}].trgUpdateScoreHistory
ON [${flyway:defaultSchema}].[ScoreHistory]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[ScoreHistory]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [${flyway:defaultSchema}].[ScoreHistory] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MJ_BizApps_Sonar: Score Histories */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateScoreHistory] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MJ_BizApps_Sonar: Score Histories */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Histories
-- Item: spDeleteScoreHistory
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR ScoreHistory
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spDeleteScoreHistory]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spDeleteScoreHistory];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spDeleteScoreHistory]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [${flyway:defaultSchema}].[ScoreHistory]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteScoreHistory] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MJ_BizApps_Sonar: Score Histories */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteScoreHistory] TO [cdp_Developer], [cdp_Integration];

/* Base View SQL for MJ_BizApps_Sonar: Score Model Versions */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Model Versions
-- Item: vwScoreModelVersions
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MJ_BizApps_Sonar: Score Model Versions
-----               SCHEMA:      ${flyway:defaultSchema}
-----               BASE TABLE:  ScoreModelVersion
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[vwScoreModelVersions]', 'V') IS NOT NULL
    DROP VIEW [${flyway:defaultSchema}].[vwScoreModelVersions];
GO

CREATE VIEW [${flyway:defaultSchema}].[vwScoreModelVersions]
AS
SELECT
    s.*,
    sonarScoreModel_ScoreModelID.[Name] AS [ScoreModel],
    MJUser_PublishedByUserID.[Name] AS [PublishedByUser]
FROM
    [${flyway:defaultSchema}].[ScoreModelVersion] AS s
INNER JOIN
    [${flyway:defaultSchema}].[ScoreModel] AS sonarScoreModel_ScoreModelID
  ON
    [s].[ScoreModelID] = sonarScoreModel_ScoreModelID.[ID]
LEFT OUTER JOIN
    [${mjSchema}].[User] AS MJUser_PublishedByUserID
  ON
    [s].[PublishedByUserID] = MJUser_PublishedByUserID.[ID]
GO
GRANT SELECT ON [${flyway:defaultSchema}].[vwScoreModelVersions] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MJ_BizApps_Sonar: Score Model Versions */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Model Versions
-- Item: Permissions for vwScoreModelVersions
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [${flyway:defaultSchema}].[vwScoreModelVersions] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MJ_BizApps_Sonar: Score Model Versions */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Model Versions
-- Item: spCreateScoreModelVersion
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR ScoreModelVersion
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spCreateScoreModelVersion]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spCreateScoreModelVersion];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spCreateScoreModelVersion]
    @ID uniqueidentifier = NULL,
    @ScoreModelID uniqueidentifier,
    @VersionNumber int,
    @VersionLabel_Clear bit = 0,
    @VersionLabel nvarchar(50) = NULL,
    @ConfigSnapshotJSON nvarchar(MAX),
    @ChangeSummary_Clear bit = 0,
    @ChangeSummary nvarchar(MAX) = NULL,
    @PublishedByUserID_Clear bit = 0,
    @PublishedByUserID uniqueidentifier = NULL,
    @PublishedAt datetime2 = NULL,
    @IsCurrent bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)
    
    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [${flyway:defaultSchema}].[ScoreModelVersion]
            (
                [ID],
                [ScoreModelID],
                [VersionNumber],
                [VersionLabel],
                [ConfigSnapshotJSON],
                [ChangeSummary],
                [PublishedByUserID],
                [PublishedAt],
                [IsCurrent]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @ScoreModelID,
                @VersionNumber,
                CASE WHEN @VersionLabel_Clear = 1 THEN NULL ELSE ISNULL(@VersionLabel, NULL) END,
                @ConfigSnapshotJSON,
                CASE WHEN @ChangeSummary_Clear = 1 THEN NULL ELSE ISNULL(@ChangeSummary, NULL) END,
                CASE WHEN @PublishedByUserID_Clear = 1 THEN NULL ELSE ISNULL(@PublishedByUserID, NULL) END,
                ISNULL(@PublishedAt, getutcdate()),
                ISNULL(@IsCurrent, 0)
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [${flyway:defaultSchema}].[ScoreModelVersion]
            (
                [ScoreModelID],
                [VersionNumber],
                [VersionLabel],
                [ConfigSnapshotJSON],
                [ChangeSummary],
                [PublishedByUserID],
                [PublishedAt],
                [IsCurrent]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ScoreModelID,
                @VersionNumber,
                CASE WHEN @VersionLabel_Clear = 1 THEN NULL ELSE ISNULL(@VersionLabel, NULL) END,
                @ConfigSnapshotJSON,
                CASE WHEN @ChangeSummary_Clear = 1 THEN NULL ELSE ISNULL(@ChangeSummary, NULL) END,
                CASE WHEN @PublishedByUserID_Clear = 1 THEN NULL ELSE ISNULL(@PublishedByUserID, NULL) END,
                ISNULL(@PublishedAt, getutcdate()),
                ISNULL(@IsCurrent, 0)
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [${flyway:defaultSchema}].[vwScoreModelVersions] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateScoreModelVersion] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MJ_BizApps_Sonar: Score Model Versions */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateScoreModelVersion] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MJ_BizApps_Sonar: Score Model Versions */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Model Versions
-- Item: spUpdateScoreModelVersion
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR ScoreModelVersion
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spUpdateScoreModelVersion]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spUpdateScoreModelVersion];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spUpdateScoreModelVersion]
    @ID uniqueidentifier,
    @ScoreModelID uniqueidentifier = NULL,
    @VersionNumber int = NULL,
    @VersionLabel_Clear bit = 0,
    @VersionLabel nvarchar(50) = NULL,
    @ConfigSnapshotJSON nvarchar(MAX) = NULL,
    @ChangeSummary_Clear bit = 0,
    @ChangeSummary nvarchar(MAX) = NULL,
    @PublishedByUserID_Clear bit = 0,
    @PublishedByUserID uniqueidentifier = NULL,
    @PublishedAt datetime2 = NULL,
    @IsCurrent bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[ScoreModelVersion]
    SET
        [ScoreModelID] = ISNULL(@ScoreModelID, [ScoreModelID]),
        [VersionNumber] = ISNULL(@VersionNumber, [VersionNumber]),
        [VersionLabel] = CASE WHEN @VersionLabel_Clear = 1 THEN NULL ELSE ISNULL(@VersionLabel, [VersionLabel]) END,
        [ConfigSnapshotJSON] = ISNULL(@ConfigSnapshotJSON, [ConfigSnapshotJSON]),
        [ChangeSummary] = CASE WHEN @ChangeSummary_Clear = 1 THEN NULL ELSE ISNULL(@ChangeSummary, [ChangeSummary]) END,
        [PublishedByUserID] = CASE WHEN @PublishedByUserID_Clear = 1 THEN NULL ELSE ISNULL(@PublishedByUserID, [PublishedByUserID]) END,
        [PublishedAt] = ISNULL(@PublishedAt, [PublishedAt]),
        [IsCurrent] = ISNULL(@IsCurrent, [IsCurrent])
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [${flyway:defaultSchema}].[vwScoreModelVersions] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [${flyway:defaultSchema}].[vwScoreModelVersions]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateScoreModelVersion] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the ScoreModelVersion table
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[trgUpdateScoreModelVersion]', 'TR') IS NOT NULL
    DROP TRIGGER [${flyway:defaultSchema}].[trgUpdateScoreModelVersion];
GO
CREATE TRIGGER [${flyway:defaultSchema}].trgUpdateScoreModelVersion
ON [${flyway:defaultSchema}].[ScoreModelVersion]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[ScoreModelVersion]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [${flyway:defaultSchema}].[ScoreModelVersion] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MJ_BizApps_Sonar: Score Model Versions */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateScoreModelVersion] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MJ_BizApps_Sonar: Score Model Versions */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Model Versions
-- Item: spDeleteScoreModelVersion
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR ScoreModelVersion
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spDeleteScoreModelVersion]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spDeleteScoreModelVersion];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spDeleteScoreModelVersion]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [${flyway:defaultSchema}].[ScoreModelVersion]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteScoreModelVersion] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MJ_BizApps_Sonar: Score Model Versions */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteScoreModelVersion] TO [cdp_Developer], [cdp_Integration];

/* Index for Foreign Keys for ScoreModel */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Models
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------
-- Index for foreign key AnchorEntityID in table ScoreModel
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ScoreModel_AnchorEntityID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ScoreModel]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ScoreModel_AnchorEntityID ON [${flyway:defaultSchema}].[ScoreModel] ([AnchorEntityID]);

-- Index for foreign key CurrentVersionID in table ScoreModel
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ScoreModel_CurrentVersionID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ScoreModel]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ScoreModel_CurrentVersionID ON [${flyway:defaultSchema}].[ScoreModel] ([CurrentVersionID]);

-- Index for foreign key BandSetID in table ScoreModel
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ScoreModel_BandSetID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ScoreModel]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ScoreModel_BandSetID ON [${flyway:defaultSchema}].[ScoreModel] ([BandSetID]);

-- Index for foreign key OwnerUserID in table ScoreModel
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ScoreModel_OwnerUserID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ScoreModel]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ScoreModel_OwnerUserID ON [${flyway:defaultSchema}].[ScoreModel] ([OwnerUserID]);

/* SQL text to update entity field related entity name field map for entity field ID 08C543A9-E221-41E8-B425-51DE32275BD8 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='08C543A9-E221-41E8-B425-51DE32275BD8', @RelatedEntityNameFieldMap='AnchorEntity';

/* Index for Foreign Keys for ScoreRecomputeRun */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Recompute Runs
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------
-- Index for foreign key ScoreModelID in table ScoreRecomputeRun
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ScoreRecomputeRun_ScoreModelID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ScoreRecomputeRun]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ScoreRecomputeRun_ScoreModelID ON [${flyway:defaultSchema}].[ScoreRecomputeRun] ([ScoreModelID]);

-- Index for foreign key ScoreModelVersionID in table ScoreRecomputeRun
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_ScoreRecomputeRun_ScoreModelVersionID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[ScoreRecomputeRun]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_ScoreRecomputeRun_ScoreModelVersionID ON [${flyway:defaultSchema}].[ScoreRecomputeRun] ([ScoreModelVersionID]);

/* SQL text to update entity field related entity name field map for entity field ID 05646884-8CFD-45B9-9D70-477346D54E93 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='05646884-8CFD-45B9-9D70-477346D54E93', @RelatedEntityNameFieldMap='ScoreModel';

/* Index for Foreign Keys for Score */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Scores
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------
-- Index for foreign key ScoreModelID in table Score
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_Score_ScoreModelID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[Score]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_Score_ScoreModelID ON [${flyway:defaultSchema}].[Score] ([ScoreModelID]);

-- Index for foreign key ScoreModelVersionID in table Score
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_Score_ScoreModelVersionID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[Score]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_Score_ScoreModelVersionID ON [${flyway:defaultSchema}].[Score] ([ScoreModelVersionID]);

-- Index for foreign key AnchorEntityID in table Score
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_Score_AnchorEntityID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[Score]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_Score_AnchorEntityID ON [${flyway:defaultSchema}].[Score] ([AnchorEntityID]);

-- Index for foreign key BandID in table Score
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_Score_BandID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[Score]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_Score_BandID ON [${flyway:defaultSchema}].[Score] ([BandID]);

-- Index for foreign key PreviousBandID in table Score
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IDX_AUTO_MJ_FKEY_Score_PreviousBandID' 
    AND object_id = OBJECT_ID('[${flyway:defaultSchema}].[Score]')
)
CREATE INDEX IDX_AUTO_MJ_FKEY_Score_PreviousBandID ON [${flyway:defaultSchema}].[Score] ([PreviousBandID]);

/* SQL text to update entity field related entity name field map for entity field ID 6439B064-B2C5-48A7-8989-5F37584354F5 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='6439B064-B2C5-48A7-8989-5F37584354F5', @RelatedEntityNameFieldMap='ScoreModel';

/* Index for Foreign Keys for TimeWindow */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Time Windows
-- Item: Index for Foreign Keys
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------;

/* Base View SQL for MJ_BizApps_Sonar: Time Windows */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Time Windows
-- Item: vwTimeWindows
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MJ_BizApps_Sonar: Time Windows
-----               SCHEMA:      ${flyway:defaultSchema}
-----               BASE TABLE:  TimeWindow
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[vwTimeWindows]', 'V') IS NOT NULL
    DROP VIEW [${flyway:defaultSchema}].[vwTimeWindows];
GO

CREATE VIEW [${flyway:defaultSchema}].[vwTimeWindows]
AS
SELECT
    t.*
FROM
    [${flyway:defaultSchema}].[TimeWindow] AS t
GO
GRANT SELECT ON [${flyway:defaultSchema}].[vwTimeWindows] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MJ_BizApps_Sonar: Time Windows */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Time Windows
-- Item: Permissions for vwTimeWindows
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [${flyway:defaultSchema}].[vwTimeWindows] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MJ_BizApps_Sonar: Time Windows */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Time Windows
-- Item: spCreateTimeWindow
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR TimeWindow
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spCreateTimeWindow]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spCreateTimeWindow];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spCreateTimeWindow]
    @ID uniqueidentifier = NULL,
    @Name nvarchar(120),
    @WindowType nvarchar(20),
    @LengthDays_Clear bit = 0,
    @LengthDays int = NULL,
    @LengthMonths_Clear bit = 0,
    @LengthMonths int = NULL,
    @AnchorDateField_Clear bit = 0,
    @AnchorDateField nvarchar(200) = NULL,
    @OffsetDays_Clear bit = 0,
    @OffsetDays int = NULL,
    @Description_Clear bit = 0,
    @Description nvarchar(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)
    
    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [${flyway:defaultSchema}].[TimeWindow]
            (
                [ID],
                [Name],
                [WindowType],
                [LengthDays],
                [LengthMonths],
                [AnchorDateField],
                [OffsetDays],
                [Description]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @Name,
                @WindowType,
                CASE WHEN @LengthDays_Clear = 1 THEN NULL ELSE ISNULL(@LengthDays, NULL) END,
                CASE WHEN @LengthMonths_Clear = 1 THEN NULL ELSE ISNULL(@LengthMonths, NULL) END,
                CASE WHEN @AnchorDateField_Clear = 1 THEN NULL ELSE ISNULL(@AnchorDateField, NULL) END,
                CASE WHEN @OffsetDays_Clear = 1 THEN NULL ELSE ISNULL(@OffsetDays, NULL) END,
                CASE WHEN @Description_Clear = 1 THEN NULL ELSE ISNULL(@Description, NULL) END
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [${flyway:defaultSchema}].[TimeWindow]
            (
                [Name],
                [WindowType],
                [LengthDays],
                [LengthMonths],
                [AnchorDateField],
                [OffsetDays],
                [Description]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @Name,
                @WindowType,
                CASE WHEN @LengthDays_Clear = 1 THEN NULL ELSE ISNULL(@LengthDays, NULL) END,
                CASE WHEN @LengthMonths_Clear = 1 THEN NULL ELSE ISNULL(@LengthMonths, NULL) END,
                CASE WHEN @AnchorDateField_Clear = 1 THEN NULL ELSE ISNULL(@AnchorDateField, NULL) END,
                CASE WHEN @OffsetDays_Clear = 1 THEN NULL ELSE ISNULL(@OffsetDays, NULL) END,
                CASE WHEN @Description_Clear = 1 THEN NULL ELSE ISNULL(@Description, NULL) END
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [${flyway:defaultSchema}].[vwTimeWindows] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateTimeWindow] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MJ_BizApps_Sonar: Time Windows */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateTimeWindow] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MJ_BizApps_Sonar: Time Windows */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Time Windows
-- Item: spUpdateTimeWindow
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR TimeWindow
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spUpdateTimeWindow]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spUpdateTimeWindow];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spUpdateTimeWindow]
    @ID uniqueidentifier,
    @Name nvarchar(120) = NULL,
    @WindowType nvarchar(20) = NULL,
    @LengthDays_Clear bit = 0,
    @LengthDays int = NULL,
    @LengthMonths_Clear bit = 0,
    @LengthMonths int = NULL,
    @AnchorDateField_Clear bit = 0,
    @AnchorDateField nvarchar(200) = NULL,
    @OffsetDays_Clear bit = 0,
    @OffsetDays int = NULL,
    @Description_Clear bit = 0,
    @Description nvarchar(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[TimeWindow]
    SET
        [Name] = ISNULL(@Name, [Name]),
        [WindowType] = ISNULL(@WindowType, [WindowType]),
        [LengthDays] = CASE WHEN @LengthDays_Clear = 1 THEN NULL ELSE ISNULL(@LengthDays, [LengthDays]) END,
        [LengthMonths] = CASE WHEN @LengthMonths_Clear = 1 THEN NULL ELSE ISNULL(@LengthMonths, [LengthMonths]) END,
        [AnchorDateField] = CASE WHEN @AnchorDateField_Clear = 1 THEN NULL ELSE ISNULL(@AnchorDateField, [AnchorDateField]) END,
        [OffsetDays] = CASE WHEN @OffsetDays_Clear = 1 THEN NULL ELSE ISNULL(@OffsetDays, [OffsetDays]) END,
        [Description] = CASE WHEN @Description_Clear = 1 THEN NULL ELSE ISNULL(@Description, [Description]) END
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [${flyway:defaultSchema}].[vwTimeWindows] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [${flyway:defaultSchema}].[vwTimeWindows]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateTimeWindow] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the TimeWindow table
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[trgUpdateTimeWindow]', 'TR') IS NOT NULL
    DROP TRIGGER [${flyway:defaultSchema}].[trgUpdateTimeWindow];
GO
CREATE TRIGGER [${flyway:defaultSchema}].trgUpdateTimeWindow
ON [${flyway:defaultSchema}].[TimeWindow]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[TimeWindow]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [${flyway:defaultSchema}].[TimeWindow] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MJ_BizApps_Sonar: Time Windows */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateTimeWindow] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MJ_BizApps_Sonar: Time Windows */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Time Windows
-- Item: spDeleteTimeWindow
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR TimeWindow
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spDeleteTimeWindow]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spDeleteTimeWindow];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spDeleteTimeWindow]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [${flyway:defaultSchema}].[TimeWindow]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteTimeWindow] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MJ_BizApps_Sonar: Time Windows */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteTimeWindow] TO [cdp_Developer], [cdp_Integration];

/* SQL text to update entity field related entity name field map for entity field ID 868E9CDD-3795-43DC-8BAC-2D0E389557E2 */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='868E9CDD-3795-43DC-8BAC-2D0E389557E2', @RelatedEntityNameFieldMap='BandSet';

/* SQL text to update entity field related entity name field map for entity field ID B5B36175-241D-43C0-8FA7-C8720EBCDF3D */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='B5B36175-241D-43C0-8FA7-C8720EBCDF3D', @RelatedEntityNameFieldMap='AnchorEntity';

/* Base View SQL for MJ_BizApps_Sonar: Score Recompute Runs */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Recompute Runs
-- Item: vwScoreRecomputeRuns
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MJ_BizApps_Sonar: Score Recompute Runs
-----               SCHEMA:      ${flyway:defaultSchema}
-----               BASE TABLE:  ScoreRecomputeRun
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[vwScoreRecomputeRuns]', 'V') IS NOT NULL
    DROP VIEW [${flyway:defaultSchema}].[vwScoreRecomputeRuns];
GO

CREATE VIEW [${flyway:defaultSchema}].[vwScoreRecomputeRuns]
AS
SELECT
    s.*,
    sonarScoreModel_ScoreModelID.[Name] AS [ScoreModel]
FROM
    [${flyway:defaultSchema}].[ScoreRecomputeRun] AS s
INNER JOIN
    [${flyway:defaultSchema}].[ScoreModel] AS sonarScoreModel_ScoreModelID
  ON
    [s].[ScoreModelID] = sonarScoreModel_ScoreModelID.[ID]
GO
GRANT SELECT ON [${flyway:defaultSchema}].[vwScoreRecomputeRuns] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MJ_BizApps_Sonar: Score Recompute Runs */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Recompute Runs
-- Item: Permissions for vwScoreRecomputeRuns
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [${flyway:defaultSchema}].[vwScoreRecomputeRuns] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MJ_BizApps_Sonar: Score Recompute Runs */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Recompute Runs
-- Item: spCreateScoreRecomputeRun
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR ScoreRecomputeRun
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spCreateScoreRecomputeRun]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spCreateScoreRecomputeRun];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spCreateScoreRecomputeRun]
    @ID uniqueidentifier = NULL,
    @ScoreModelID uniqueidentifier,
    @ScoreModelVersionID_Clear bit = 0,
    @ScoreModelVersionID uniqueidentifier = NULL,
    @TriggerType nvarchar(16),
    @Scope nvarchar(16),
    @StartedAt datetime2 = NULL,
    @CompletedAt_Clear bit = 0,
    @CompletedAt datetime2 = NULL,
    @Status nvarchar(16) = NULL,
    @RecordsScored_Clear bit = 0,
    @RecordsScored int = NULL,
    @RecordsChanged_Clear bit = 0,
    @RecordsChanged int = NULL,
    @BandTransitions_Clear bit = 0,
    @BandTransitions int = NULL,
    @DurationMs_Clear bit = 0,
    @DurationMs bigint = NULL,
    @CostUnitsConsumed_Clear bit = 0,
    @CostUnitsConsumed decimal(12, 4) = NULL,
    @ErrorsJSON_Clear bit = 0,
    @ErrorsJSON nvarchar(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)
    
    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [${flyway:defaultSchema}].[ScoreRecomputeRun]
            (
                [ID],
                [ScoreModelID],
                [ScoreModelVersionID],
                [TriggerType],
                [Scope],
                [StartedAt],
                [CompletedAt],
                [Status],
                [RecordsScored],
                [RecordsChanged],
                [BandTransitions],
                [DurationMs],
                [CostUnitsConsumed],
                [ErrorsJSON]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @ScoreModelID,
                CASE WHEN @ScoreModelVersionID_Clear = 1 THEN NULL ELSE ISNULL(@ScoreModelVersionID, NULL) END,
                @TriggerType,
                @Scope,
                ISNULL(@StartedAt, getutcdate()),
                CASE WHEN @CompletedAt_Clear = 1 THEN NULL ELSE ISNULL(@CompletedAt, NULL) END,
                ISNULL(@Status, 'Running'),
                CASE WHEN @RecordsScored_Clear = 1 THEN NULL ELSE ISNULL(@RecordsScored, NULL) END,
                CASE WHEN @RecordsChanged_Clear = 1 THEN NULL ELSE ISNULL(@RecordsChanged, NULL) END,
                CASE WHEN @BandTransitions_Clear = 1 THEN NULL ELSE ISNULL(@BandTransitions, NULL) END,
                CASE WHEN @DurationMs_Clear = 1 THEN NULL ELSE ISNULL(@DurationMs, NULL) END,
                CASE WHEN @CostUnitsConsumed_Clear = 1 THEN NULL ELSE ISNULL(@CostUnitsConsumed, NULL) END,
                CASE WHEN @ErrorsJSON_Clear = 1 THEN NULL ELSE ISNULL(@ErrorsJSON, NULL) END
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [${flyway:defaultSchema}].[ScoreRecomputeRun]
            (
                [ScoreModelID],
                [ScoreModelVersionID],
                [TriggerType],
                [Scope],
                [StartedAt],
                [CompletedAt],
                [Status],
                [RecordsScored],
                [RecordsChanged],
                [BandTransitions],
                [DurationMs],
                [CostUnitsConsumed],
                [ErrorsJSON]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ScoreModelID,
                CASE WHEN @ScoreModelVersionID_Clear = 1 THEN NULL ELSE ISNULL(@ScoreModelVersionID, NULL) END,
                @TriggerType,
                @Scope,
                ISNULL(@StartedAt, getutcdate()),
                CASE WHEN @CompletedAt_Clear = 1 THEN NULL ELSE ISNULL(@CompletedAt, NULL) END,
                ISNULL(@Status, 'Running'),
                CASE WHEN @RecordsScored_Clear = 1 THEN NULL ELSE ISNULL(@RecordsScored, NULL) END,
                CASE WHEN @RecordsChanged_Clear = 1 THEN NULL ELSE ISNULL(@RecordsChanged, NULL) END,
                CASE WHEN @BandTransitions_Clear = 1 THEN NULL ELSE ISNULL(@BandTransitions, NULL) END,
                CASE WHEN @DurationMs_Clear = 1 THEN NULL ELSE ISNULL(@DurationMs, NULL) END,
                CASE WHEN @CostUnitsConsumed_Clear = 1 THEN NULL ELSE ISNULL(@CostUnitsConsumed, NULL) END,
                CASE WHEN @ErrorsJSON_Clear = 1 THEN NULL ELSE ISNULL(@ErrorsJSON, NULL) END
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [${flyway:defaultSchema}].[vwScoreRecomputeRuns] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateScoreRecomputeRun] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MJ_BizApps_Sonar: Score Recompute Runs */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateScoreRecomputeRun] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MJ_BizApps_Sonar: Score Recompute Runs */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Recompute Runs
-- Item: spUpdateScoreRecomputeRun
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR ScoreRecomputeRun
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spUpdateScoreRecomputeRun]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spUpdateScoreRecomputeRun];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spUpdateScoreRecomputeRun]
    @ID uniqueidentifier,
    @ScoreModelID uniqueidentifier = NULL,
    @ScoreModelVersionID_Clear bit = 0,
    @ScoreModelVersionID uniqueidentifier = NULL,
    @TriggerType nvarchar(16) = NULL,
    @Scope nvarchar(16) = NULL,
    @StartedAt datetime2 = NULL,
    @CompletedAt_Clear bit = 0,
    @CompletedAt datetime2 = NULL,
    @Status nvarchar(16) = NULL,
    @RecordsScored_Clear bit = 0,
    @RecordsScored int = NULL,
    @RecordsChanged_Clear bit = 0,
    @RecordsChanged int = NULL,
    @BandTransitions_Clear bit = 0,
    @BandTransitions int = NULL,
    @DurationMs_Clear bit = 0,
    @DurationMs bigint = NULL,
    @CostUnitsConsumed_Clear bit = 0,
    @CostUnitsConsumed decimal(12, 4) = NULL,
    @ErrorsJSON_Clear bit = 0,
    @ErrorsJSON nvarchar(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[ScoreRecomputeRun]
    SET
        [ScoreModelID] = ISNULL(@ScoreModelID, [ScoreModelID]),
        [ScoreModelVersionID] = CASE WHEN @ScoreModelVersionID_Clear = 1 THEN NULL ELSE ISNULL(@ScoreModelVersionID, [ScoreModelVersionID]) END,
        [TriggerType] = ISNULL(@TriggerType, [TriggerType]),
        [Scope] = ISNULL(@Scope, [Scope]),
        [StartedAt] = ISNULL(@StartedAt, [StartedAt]),
        [CompletedAt] = CASE WHEN @CompletedAt_Clear = 1 THEN NULL ELSE ISNULL(@CompletedAt, [CompletedAt]) END,
        [Status] = ISNULL(@Status, [Status]),
        [RecordsScored] = CASE WHEN @RecordsScored_Clear = 1 THEN NULL ELSE ISNULL(@RecordsScored, [RecordsScored]) END,
        [RecordsChanged] = CASE WHEN @RecordsChanged_Clear = 1 THEN NULL ELSE ISNULL(@RecordsChanged, [RecordsChanged]) END,
        [BandTransitions] = CASE WHEN @BandTransitions_Clear = 1 THEN NULL ELSE ISNULL(@BandTransitions, [BandTransitions]) END,
        [DurationMs] = CASE WHEN @DurationMs_Clear = 1 THEN NULL ELSE ISNULL(@DurationMs, [DurationMs]) END,
        [CostUnitsConsumed] = CASE WHEN @CostUnitsConsumed_Clear = 1 THEN NULL ELSE ISNULL(@CostUnitsConsumed, [CostUnitsConsumed]) END,
        [ErrorsJSON] = CASE WHEN @ErrorsJSON_Clear = 1 THEN NULL ELSE ISNULL(@ErrorsJSON, [ErrorsJSON]) END
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [${flyway:defaultSchema}].[vwScoreRecomputeRuns] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [${flyway:defaultSchema}].[vwScoreRecomputeRuns]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateScoreRecomputeRun] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the ScoreRecomputeRun table
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[trgUpdateScoreRecomputeRun]', 'TR') IS NOT NULL
    DROP TRIGGER [${flyway:defaultSchema}].[trgUpdateScoreRecomputeRun];
GO
CREATE TRIGGER [${flyway:defaultSchema}].trgUpdateScoreRecomputeRun
ON [${flyway:defaultSchema}].[ScoreRecomputeRun]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[ScoreRecomputeRun]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [${flyway:defaultSchema}].[ScoreRecomputeRun] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MJ_BizApps_Sonar: Score Recompute Runs */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateScoreRecomputeRun] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MJ_BizApps_Sonar: Score Recompute Runs */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Recompute Runs
-- Item: spDeleteScoreRecomputeRun
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR ScoreRecomputeRun
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spDeleteScoreRecomputeRun]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spDeleteScoreRecomputeRun];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spDeleteScoreRecomputeRun]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [${flyway:defaultSchema}].[ScoreRecomputeRun]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteScoreRecomputeRun] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MJ_BizApps_Sonar: Score Recompute Runs */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteScoreRecomputeRun] TO [cdp_Developer], [cdp_Integration];

/* Base View SQL for MJ_BizApps_Sonar: Scores */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Scores
-- Item: vwScores
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MJ_BizApps_Sonar: Scores
-----               SCHEMA:      ${flyway:defaultSchema}
-----               BASE TABLE:  Score
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[vwScores]', 'V') IS NOT NULL
    DROP VIEW [${flyway:defaultSchema}].[vwScores];
GO

CREATE VIEW [${flyway:defaultSchema}].[vwScores]
AS
SELECT
    s.*,
    sonarScoreModel_ScoreModelID.[Name] AS [ScoreModel],
    MJEntity_AnchorEntityID.[Name] AS [AnchorEntity]
FROM
    [${flyway:defaultSchema}].[Score] AS s
INNER JOIN
    [${flyway:defaultSchema}].[ScoreModel] AS sonarScoreModel_ScoreModelID
  ON
    [s].[ScoreModelID] = sonarScoreModel_ScoreModelID.[ID]
INNER JOIN
    [${mjSchema}].[Entity] AS MJEntity_AnchorEntityID
  ON
    [s].[AnchorEntityID] = MJEntity_AnchorEntityID.[ID]
GO
GRANT SELECT ON [${flyway:defaultSchema}].[vwScores] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MJ_BizApps_Sonar: Scores */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Scores
-- Item: Permissions for vwScores
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [${flyway:defaultSchema}].[vwScores] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MJ_BizApps_Sonar: Scores */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Scores
-- Item: spCreateScore
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR Score
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spCreateScore]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spCreateScore];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spCreateScore]
    @ID uniqueidentifier = NULL,
    @ScoreModelID uniqueidentifier,
    @ScoreModelVersionID uniqueidentifier,
    @AnchorEntityID uniqueidentifier,
    @AnchorRecordID nvarchar(100),
    @AnchorRecordKeyJSON_Clear bit = 0,
    @AnchorRecordKeyJSON nvarchar(MAX) = NULL,
    @RawScore_Clear bit = 0,
    @RawScore decimal(12, 4) = NULL,
    @NormalizedScore_Clear bit = 0,
    @NormalizedScore decimal(9, 4) = NULL,
    @BandID_Clear bit = 0,
    @BandID uniqueidentifier = NULL,
    @PreviousNormalizedScore_Clear bit = 0,
    @PreviousNormalizedScore decimal(9, 4) = NULL,
    @PreviousBandID_Clear bit = 0,
    @PreviousBandID uniqueidentifier = NULL,
    @Delta_Clear bit = 0,
    @Delta decimal(9, 4) = NULL,
    @TrendDirection_Clear bit = 0,
    @TrendDirection nvarchar(8) = NULL,
    @TrendSlope_Clear bit = 0,
    @TrendSlope decimal(12, 6) = NULL,
    @Confidence_Clear bit = 0,
    @Confidence decimal(5, 4) = NULL,
    @DataCompleteness_Clear bit = 0,
    @DataCompleteness decimal(5, 4) = NULL,
    @ComputedAt datetime2 = NULL,
    @AsOfDate_Clear bit = 0,
    @AsOfDate datetime2 = NULL,
    @NextRecomputeAt_Clear bit = 0,
    @NextRecomputeAt datetime2 = NULL,
    @IsStale bit = NULL,
    @ExplanationSummary_Clear bit = 0,
    @ExplanationSummary nvarchar(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)
    
    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [${flyway:defaultSchema}].[Score]
            (
                [ID],
                [ScoreModelID],
                [ScoreModelVersionID],
                [AnchorEntityID],
                [AnchorRecordID],
                [AnchorRecordKeyJSON],
                [RawScore],
                [NormalizedScore],
                [BandID],
                [PreviousNormalizedScore],
                [PreviousBandID],
                [Delta],
                [TrendDirection],
                [TrendSlope],
                [Confidence],
                [DataCompleteness],
                [ComputedAt],
                [AsOfDate],
                [NextRecomputeAt],
                [IsStale],
                [ExplanationSummary]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @ScoreModelID,
                @ScoreModelVersionID,
                @AnchorEntityID,
                @AnchorRecordID,
                CASE WHEN @AnchorRecordKeyJSON_Clear = 1 THEN NULL ELSE ISNULL(@AnchorRecordKeyJSON, NULL) END,
                CASE WHEN @RawScore_Clear = 1 THEN NULL ELSE ISNULL(@RawScore, NULL) END,
                CASE WHEN @NormalizedScore_Clear = 1 THEN NULL ELSE ISNULL(@NormalizedScore, NULL) END,
                CASE WHEN @BandID_Clear = 1 THEN NULL ELSE ISNULL(@BandID, NULL) END,
                CASE WHEN @PreviousNormalizedScore_Clear = 1 THEN NULL ELSE ISNULL(@PreviousNormalizedScore, NULL) END,
                CASE WHEN @PreviousBandID_Clear = 1 THEN NULL ELSE ISNULL(@PreviousBandID, NULL) END,
                CASE WHEN @Delta_Clear = 1 THEN NULL ELSE ISNULL(@Delta, NULL) END,
                CASE WHEN @TrendDirection_Clear = 1 THEN NULL ELSE ISNULL(@TrendDirection, NULL) END,
                CASE WHEN @TrendSlope_Clear = 1 THEN NULL ELSE ISNULL(@TrendSlope, NULL) END,
                CASE WHEN @Confidence_Clear = 1 THEN NULL ELSE ISNULL(@Confidence, NULL) END,
                CASE WHEN @DataCompleteness_Clear = 1 THEN NULL ELSE ISNULL(@DataCompleteness, NULL) END,
                ISNULL(@ComputedAt, getutcdate()),
                CASE WHEN @AsOfDate_Clear = 1 THEN NULL ELSE ISNULL(@AsOfDate, NULL) END,
                CASE WHEN @NextRecomputeAt_Clear = 1 THEN NULL ELSE ISNULL(@NextRecomputeAt, NULL) END,
                ISNULL(@IsStale, 0),
                CASE WHEN @ExplanationSummary_Clear = 1 THEN NULL ELSE ISNULL(@ExplanationSummary, NULL) END
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [${flyway:defaultSchema}].[Score]
            (
                [ScoreModelID],
                [ScoreModelVersionID],
                [AnchorEntityID],
                [AnchorRecordID],
                [AnchorRecordKeyJSON],
                [RawScore],
                [NormalizedScore],
                [BandID],
                [PreviousNormalizedScore],
                [PreviousBandID],
                [Delta],
                [TrendDirection],
                [TrendSlope],
                [Confidence],
                [DataCompleteness],
                [ComputedAt],
                [AsOfDate],
                [NextRecomputeAt],
                [IsStale],
                [ExplanationSummary]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ScoreModelID,
                @ScoreModelVersionID,
                @AnchorEntityID,
                @AnchorRecordID,
                CASE WHEN @AnchorRecordKeyJSON_Clear = 1 THEN NULL ELSE ISNULL(@AnchorRecordKeyJSON, NULL) END,
                CASE WHEN @RawScore_Clear = 1 THEN NULL ELSE ISNULL(@RawScore, NULL) END,
                CASE WHEN @NormalizedScore_Clear = 1 THEN NULL ELSE ISNULL(@NormalizedScore, NULL) END,
                CASE WHEN @BandID_Clear = 1 THEN NULL ELSE ISNULL(@BandID, NULL) END,
                CASE WHEN @PreviousNormalizedScore_Clear = 1 THEN NULL ELSE ISNULL(@PreviousNormalizedScore, NULL) END,
                CASE WHEN @PreviousBandID_Clear = 1 THEN NULL ELSE ISNULL(@PreviousBandID, NULL) END,
                CASE WHEN @Delta_Clear = 1 THEN NULL ELSE ISNULL(@Delta, NULL) END,
                CASE WHEN @TrendDirection_Clear = 1 THEN NULL ELSE ISNULL(@TrendDirection, NULL) END,
                CASE WHEN @TrendSlope_Clear = 1 THEN NULL ELSE ISNULL(@TrendSlope, NULL) END,
                CASE WHEN @Confidence_Clear = 1 THEN NULL ELSE ISNULL(@Confidence, NULL) END,
                CASE WHEN @DataCompleteness_Clear = 1 THEN NULL ELSE ISNULL(@DataCompleteness, NULL) END,
                ISNULL(@ComputedAt, getutcdate()),
                CASE WHEN @AsOfDate_Clear = 1 THEN NULL ELSE ISNULL(@AsOfDate, NULL) END,
                CASE WHEN @NextRecomputeAt_Clear = 1 THEN NULL ELSE ISNULL(@NextRecomputeAt, NULL) END,
                ISNULL(@IsStale, 0),
                CASE WHEN @ExplanationSummary_Clear = 1 THEN NULL ELSE ISNULL(@ExplanationSummary, NULL) END
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [${flyway:defaultSchema}].[vwScores] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateScore] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MJ_BizApps_Sonar: Scores */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateScore] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MJ_BizApps_Sonar: Scores */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Scores
-- Item: spUpdateScore
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR Score
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spUpdateScore]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spUpdateScore];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spUpdateScore]
    @ID uniqueidentifier,
    @ScoreModelID uniqueidentifier = NULL,
    @ScoreModelVersionID uniqueidentifier = NULL,
    @AnchorEntityID uniqueidentifier = NULL,
    @AnchorRecordID nvarchar(100) = NULL,
    @AnchorRecordKeyJSON_Clear bit = 0,
    @AnchorRecordKeyJSON nvarchar(MAX) = NULL,
    @RawScore_Clear bit = 0,
    @RawScore decimal(12, 4) = NULL,
    @NormalizedScore_Clear bit = 0,
    @NormalizedScore decimal(9, 4) = NULL,
    @BandID_Clear bit = 0,
    @BandID uniqueidentifier = NULL,
    @PreviousNormalizedScore_Clear bit = 0,
    @PreviousNormalizedScore decimal(9, 4) = NULL,
    @PreviousBandID_Clear bit = 0,
    @PreviousBandID uniqueidentifier = NULL,
    @Delta_Clear bit = 0,
    @Delta decimal(9, 4) = NULL,
    @TrendDirection_Clear bit = 0,
    @TrendDirection nvarchar(8) = NULL,
    @TrendSlope_Clear bit = 0,
    @TrendSlope decimal(12, 6) = NULL,
    @Confidence_Clear bit = 0,
    @Confidence decimal(5, 4) = NULL,
    @DataCompleteness_Clear bit = 0,
    @DataCompleteness decimal(5, 4) = NULL,
    @ComputedAt datetime2 = NULL,
    @AsOfDate_Clear bit = 0,
    @AsOfDate datetime2 = NULL,
    @NextRecomputeAt_Clear bit = 0,
    @NextRecomputeAt datetime2 = NULL,
    @IsStale bit = NULL,
    @ExplanationSummary_Clear bit = 0,
    @ExplanationSummary nvarchar(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[Score]
    SET
        [ScoreModelID] = ISNULL(@ScoreModelID, [ScoreModelID]),
        [ScoreModelVersionID] = ISNULL(@ScoreModelVersionID, [ScoreModelVersionID]),
        [AnchorEntityID] = ISNULL(@AnchorEntityID, [AnchorEntityID]),
        [AnchorRecordID] = ISNULL(@AnchorRecordID, [AnchorRecordID]),
        [AnchorRecordKeyJSON] = CASE WHEN @AnchorRecordKeyJSON_Clear = 1 THEN NULL ELSE ISNULL(@AnchorRecordKeyJSON, [AnchorRecordKeyJSON]) END,
        [RawScore] = CASE WHEN @RawScore_Clear = 1 THEN NULL ELSE ISNULL(@RawScore, [RawScore]) END,
        [NormalizedScore] = CASE WHEN @NormalizedScore_Clear = 1 THEN NULL ELSE ISNULL(@NormalizedScore, [NormalizedScore]) END,
        [BandID] = CASE WHEN @BandID_Clear = 1 THEN NULL ELSE ISNULL(@BandID, [BandID]) END,
        [PreviousNormalizedScore] = CASE WHEN @PreviousNormalizedScore_Clear = 1 THEN NULL ELSE ISNULL(@PreviousNormalizedScore, [PreviousNormalizedScore]) END,
        [PreviousBandID] = CASE WHEN @PreviousBandID_Clear = 1 THEN NULL ELSE ISNULL(@PreviousBandID, [PreviousBandID]) END,
        [Delta] = CASE WHEN @Delta_Clear = 1 THEN NULL ELSE ISNULL(@Delta, [Delta]) END,
        [TrendDirection] = CASE WHEN @TrendDirection_Clear = 1 THEN NULL ELSE ISNULL(@TrendDirection, [TrendDirection]) END,
        [TrendSlope] = CASE WHEN @TrendSlope_Clear = 1 THEN NULL ELSE ISNULL(@TrendSlope, [TrendSlope]) END,
        [Confidence] = CASE WHEN @Confidence_Clear = 1 THEN NULL ELSE ISNULL(@Confidence, [Confidence]) END,
        [DataCompleteness] = CASE WHEN @DataCompleteness_Clear = 1 THEN NULL ELSE ISNULL(@DataCompleteness, [DataCompleteness]) END,
        [ComputedAt] = ISNULL(@ComputedAt, [ComputedAt]),
        [AsOfDate] = CASE WHEN @AsOfDate_Clear = 1 THEN NULL ELSE ISNULL(@AsOfDate, [AsOfDate]) END,
        [NextRecomputeAt] = CASE WHEN @NextRecomputeAt_Clear = 1 THEN NULL ELSE ISNULL(@NextRecomputeAt, [NextRecomputeAt]) END,
        [IsStale] = ISNULL(@IsStale, [IsStale]),
        [ExplanationSummary] = CASE WHEN @ExplanationSummary_Clear = 1 THEN NULL ELSE ISNULL(@ExplanationSummary, [ExplanationSummary]) END
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [${flyway:defaultSchema}].[vwScores] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [${flyway:defaultSchema}].[vwScores]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateScore] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the Score table
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[trgUpdateScore]', 'TR') IS NOT NULL
    DROP TRIGGER [${flyway:defaultSchema}].[trgUpdateScore];
GO
CREATE TRIGGER [${flyway:defaultSchema}].trgUpdateScore
ON [${flyway:defaultSchema}].[Score]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[Score]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [${flyway:defaultSchema}].[Score] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MJ_BizApps_Sonar: Scores */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateScore] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MJ_BizApps_Sonar: Scores */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Scores
-- Item: spDeleteScore
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR Score
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spDeleteScore]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spDeleteScore];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spDeleteScore]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [${flyway:defaultSchema}].[Score]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteScore] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MJ_BizApps_Sonar: Scores */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteScore] TO [cdp_Developer], [cdp_Integration];

/* SQL text to update entity field related entity name field map for entity field ID 16CB8706-7AE4-40B3-B030-0885E1B2398B */
EXEC [${mjSchema}].[spUpdateEntityFieldRelatedEntityNameFieldMap] @EntityFieldID='16CB8706-7AE4-40B3-B030-0885E1B2398B', @RelatedEntityNameFieldMap='OwnerUser';

/* Base View SQL for MJ_BizApps_Sonar: Score Models */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Models
-- Item: vwScoreModels
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- BASE VIEW FOR ENTITY:      MJ_BizApps_Sonar: Score Models
-----               SCHEMA:      ${flyway:defaultSchema}
-----               BASE TABLE:  ScoreModel
-----               PRIMARY KEY: ID
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[vwScoreModels]', 'V') IS NOT NULL
    DROP VIEW [${flyway:defaultSchema}].[vwScoreModels];
GO

CREATE VIEW [${flyway:defaultSchema}].[vwScoreModels]
AS
SELECT
    s.*,
    MJEntity_AnchorEntityID.[Name] AS [AnchorEntity],
    sonarScoreBandSet_BandSetID.[Name] AS [BandSet],
    MJUser_OwnerUserID.[Name] AS [OwnerUser]
FROM
    [${flyway:defaultSchema}].[ScoreModel] AS s
INNER JOIN
    [${mjSchema}].[Entity] AS MJEntity_AnchorEntityID
  ON
    [s].[AnchorEntityID] = MJEntity_AnchorEntityID.[ID]
LEFT OUTER JOIN
    [${flyway:defaultSchema}].[ScoreBandSet] AS sonarScoreBandSet_BandSetID
  ON
    [s].[BandSetID] = sonarScoreBandSet_BandSetID.[ID]
LEFT OUTER JOIN
    [${mjSchema}].[User] AS MJUser_OwnerUserID
  ON
    [s].[OwnerUserID] = MJUser_OwnerUserID.[ID]
GO
GRANT SELECT ON [${flyway:defaultSchema}].[vwScoreModels] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* Base View Permissions SQL for MJ_BizApps_Sonar: Score Models */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Models
-- Item: Permissions for vwScoreModels
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

GRANT SELECT ON [${flyway:defaultSchema}].[vwScoreModels] TO [cdp_UI], [cdp_Developer], [cdp_Integration];

/* spCreate SQL for MJ_BizApps_Sonar: Score Models */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Models
-- Item: spCreateScoreModel
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR ScoreModel
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spCreateScoreModel]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spCreateScoreModel];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spCreateScoreModel]
    @ID uniqueidentifier = NULL,
    @Name nvarchar(200),
    @Slug nvarchar(100),
    @Description_Clear bit = 0,
    @Description nvarchar(MAX) = NULL,
    @AnchorEntityID uniqueidentifier,
    @Status nvarchar(20) = NULL,
    @CurrentVersionID_Clear bit = 0,
    @CurrentVersionID uniqueidentifier = NULL,
    @ScoreScaleMin decimal(9, 4) = NULL,
    @ScoreScaleMax decimal(9, 4) = NULL,
    @CombineStrategy nvarchar(30) = NULL,
    @CombineExpression_Clear bit = 0,
    @CombineExpression nvarchar(MAX) = NULL,
    @BandSetID_Clear bit = 0,
    @BandSetID uniqueidentifier = NULL,
    @PopulationFilter_Clear bit = 0,
    @PopulationFilter nvarchar(MAX) = NULL,
    @RecomputeMode nvarchar(20) = NULL,
    @RecomputeCron_Clear bit = 0,
    @RecomputeCron nvarchar(100) = NULL,
    @AsOfStrategy nvarchar(20) = NULL,
    @IsCalibrated bit = NULL,
    @TrendWindowDays_Clear bit = 0,
    @TrendWindowDays int = NULL,
    @OwnerUserID_Clear bit = 0,
    @OwnerUserID uniqueidentifier = NULL,
    @EffectiveFrom_Clear bit = 0,
    @EffectiveFrom datetime2 = NULL,
    @EffectiveTo_Clear bit = 0,
    @EffectiveTo datetime2 = NULL,
    @Notes_Clear bit = 0,
    @Notes nvarchar(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InsertedRow TABLE ([ID] UNIQUEIDENTIFIER)
    
    IF @ID IS NOT NULL
    BEGIN
        -- User provided a value, use it
        INSERT INTO [${flyway:defaultSchema}].[ScoreModel]
            (
                [ID],
                [Name],
                [Slug],
                [Description],
                [AnchorEntityID],
                [Status],
                [CurrentVersionID],
                [ScoreScaleMin],
                [ScoreScaleMax],
                [CombineStrategy],
                [CombineExpression],
                [BandSetID],
                [PopulationFilter],
                [RecomputeMode],
                [RecomputeCron],
                [AsOfStrategy],
                [IsCalibrated],
                [TrendWindowDays],
                [OwnerUserID],
                [EffectiveFrom],
                [EffectiveTo],
                [Notes]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @ID,
                @Name,
                @Slug,
                CASE WHEN @Description_Clear = 1 THEN NULL ELSE ISNULL(@Description, NULL) END,
                @AnchorEntityID,
                ISNULL(@Status, 'Draft'),
                CASE WHEN @CurrentVersionID_Clear = 1 THEN NULL ELSE ISNULL(@CurrentVersionID, NULL) END,
                ISNULL(@ScoreScaleMin, 0),
                ISNULL(@ScoreScaleMax, 100),
                ISNULL(@CombineStrategy, 'WeightedSum'),
                CASE WHEN @CombineExpression_Clear = 1 THEN NULL ELSE ISNULL(@CombineExpression, NULL) END,
                CASE WHEN @BandSetID_Clear = 1 THEN NULL ELSE ISNULL(@BandSetID, NULL) END,
                CASE WHEN @PopulationFilter_Clear = 1 THEN NULL ELSE ISNULL(@PopulationFilter, NULL) END,
                ISNULL(@RecomputeMode, 'Scheduled'),
                CASE WHEN @RecomputeCron_Clear = 1 THEN NULL ELSE ISNULL(@RecomputeCron, NULL) END,
                ISNULL(@AsOfStrategy, 'RunTime'),
                ISNULL(@IsCalibrated, 0),
                CASE WHEN @TrendWindowDays_Clear = 1 THEN NULL ELSE ISNULL(@TrendWindowDays, NULL) END,
                CASE WHEN @OwnerUserID_Clear = 1 THEN NULL ELSE ISNULL(@OwnerUserID, NULL) END,
                CASE WHEN @EffectiveFrom_Clear = 1 THEN NULL ELSE ISNULL(@EffectiveFrom, NULL) END,
                CASE WHEN @EffectiveTo_Clear = 1 THEN NULL ELSE ISNULL(@EffectiveTo, NULL) END,
                CASE WHEN @Notes_Clear = 1 THEN NULL ELSE ISNULL(@Notes, NULL) END
            )
    END
    ELSE
    BEGIN
        -- No value provided, let database use its default (e.g., NEWSEQUENTIALID())
        INSERT INTO [${flyway:defaultSchema}].[ScoreModel]
            (
                [Name],
                [Slug],
                [Description],
                [AnchorEntityID],
                [Status],
                [CurrentVersionID],
                [ScoreScaleMin],
                [ScoreScaleMax],
                [CombineStrategy],
                [CombineExpression],
                [BandSetID],
                [PopulationFilter],
                [RecomputeMode],
                [RecomputeCron],
                [AsOfStrategy],
                [IsCalibrated],
                [TrendWindowDays],
                [OwnerUserID],
                [EffectiveFrom],
                [EffectiveTo],
                [Notes]
            )
        OUTPUT INSERTED.[ID] INTO @InsertedRow
        VALUES
            (
                @Name,
                @Slug,
                CASE WHEN @Description_Clear = 1 THEN NULL ELSE ISNULL(@Description, NULL) END,
                @AnchorEntityID,
                ISNULL(@Status, 'Draft'),
                CASE WHEN @CurrentVersionID_Clear = 1 THEN NULL ELSE ISNULL(@CurrentVersionID, NULL) END,
                ISNULL(@ScoreScaleMin, 0),
                ISNULL(@ScoreScaleMax, 100),
                ISNULL(@CombineStrategy, 'WeightedSum'),
                CASE WHEN @CombineExpression_Clear = 1 THEN NULL ELSE ISNULL(@CombineExpression, NULL) END,
                CASE WHEN @BandSetID_Clear = 1 THEN NULL ELSE ISNULL(@BandSetID, NULL) END,
                CASE WHEN @PopulationFilter_Clear = 1 THEN NULL ELSE ISNULL(@PopulationFilter, NULL) END,
                ISNULL(@RecomputeMode, 'Scheduled'),
                CASE WHEN @RecomputeCron_Clear = 1 THEN NULL ELSE ISNULL(@RecomputeCron, NULL) END,
                ISNULL(@AsOfStrategy, 'RunTime'),
                ISNULL(@IsCalibrated, 0),
                CASE WHEN @TrendWindowDays_Clear = 1 THEN NULL ELSE ISNULL(@TrendWindowDays, NULL) END,
                CASE WHEN @OwnerUserID_Clear = 1 THEN NULL ELSE ISNULL(@OwnerUserID, NULL) END,
                CASE WHEN @EffectiveFrom_Clear = 1 THEN NULL ELSE ISNULL(@EffectiveFrom, NULL) END,
                CASE WHEN @EffectiveTo_Clear = 1 THEN NULL ELSE ISNULL(@EffectiveTo, NULL) END,
                CASE WHEN @Notes_Clear = 1 THEN NULL ELSE ISNULL(@Notes, NULL) END
            )
    END
    -- return the new record from the base view, which might have some calculated fields
    SELECT * FROM [${flyway:defaultSchema}].[vwScoreModels] WHERE [ID] = (SELECT [ID] FROM @InsertedRow)
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateScoreModel] TO [cdp_Developer], [cdp_Integration];

/* spCreate Permissions for MJ_BizApps_Sonar: Score Models */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spCreateScoreModel] TO [cdp_Developer], [cdp_Integration];

/* spUpdate SQL for MJ_BizApps_Sonar: Score Models */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Models
-- Item: spUpdateScoreModel
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR ScoreModel
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spUpdateScoreModel]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spUpdateScoreModel];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spUpdateScoreModel]
    @ID uniqueidentifier,
    @Name nvarchar(200) = NULL,
    @Slug nvarchar(100) = NULL,
    @Description_Clear bit = 0,
    @Description nvarchar(MAX) = NULL,
    @AnchorEntityID uniqueidentifier = NULL,
    @Status nvarchar(20) = NULL,
    @CurrentVersionID_Clear bit = 0,
    @CurrentVersionID uniqueidentifier = NULL,
    @ScoreScaleMin decimal(9, 4) = NULL,
    @ScoreScaleMax decimal(9, 4) = NULL,
    @CombineStrategy nvarchar(30) = NULL,
    @CombineExpression_Clear bit = 0,
    @CombineExpression nvarchar(MAX) = NULL,
    @BandSetID_Clear bit = 0,
    @BandSetID uniqueidentifier = NULL,
    @PopulationFilter_Clear bit = 0,
    @PopulationFilter nvarchar(MAX) = NULL,
    @RecomputeMode nvarchar(20) = NULL,
    @RecomputeCron_Clear bit = 0,
    @RecomputeCron nvarchar(100) = NULL,
    @AsOfStrategy nvarchar(20) = NULL,
    @IsCalibrated bit = NULL,
    @TrendWindowDays_Clear bit = 0,
    @TrendWindowDays int = NULL,
    @OwnerUserID_Clear bit = 0,
    @OwnerUserID uniqueidentifier = NULL,
    @EffectiveFrom_Clear bit = 0,
    @EffectiveFrom datetime2 = NULL,
    @EffectiveTo_Clear bit = 0,
    @EffectiveTo datetime2 = NULL,
    @Notes_Clear bit = 0,
    @Notes nvarchar(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[ScoreModel]
    SET
        [Name] = ISNULL(@Name, [Name]),
        [Slug] = ISNULL(@Slug, [Slug]),
        [Description] = CASE WHEN @Description_Clear = 1 THEN NULL ELSE ISNULL(@Description, [Description]) END,
        [AnchorEntityID] = ISNULL(@AnchorEntityID, [AnchorEntityID]),
        [Status] = ISNULL(@Status, [Status]),
        [CurrentVersionID] = CASE WHEN @CurrentVersionID_Clear = 1 THEN NULL ELSE ISNULL(@CurrentVersionID, [CurrentVersionID]) END,
        [ScoreScaleMin] = ISNULL(@ScoreScaleMin, [ScoreScaleMin]),
        [ScoreScaleMax] = ISNULL(@ScoreScaleMax, [ScoreScaleMax]),
        [CombineStrategy] = ISNULL(@CombineStrategy, [CombineStrategy]),
        [CombineExpression] = CASE WHEN @CombineExpression_Clear = 1 THEN NULL ELSE ISNULL(@CombineExpression, [CombineExpression]) END,
        [BandSetID] = CASE WHEN @BandSetID_Clear = 1 THEN NULL ELSE ISNULL(@BandSetID, [BandSetID]) END,
        [PopulationFilter] = CASE WHEN @PopulationFilter_Clear = 1 THEN NULL ELSE ISNULL(@PopulationFilter, [PopulationFilter]) END,
        [RecomputeMode] = ISNULL(@RecomputeMode, [RecomputeMode]),
        [RecomputeCron] = CASE WHEN @RecomputeCron_Clear = 1 THEN NULL ELSE ISNULL(@RecomputeCron, [RecomputeCron]) END,
        [AsOfStrategy] = ISNULL(@AsOfStrategy, [AsOfStrategy]),
        [IsCalibrated] = ISNULL(@IsCalibrated, [IsCalibrated]),
        [TrendWindowDays] = CASE WHEN @TrendWindowDays_Clear = 1 THEN NULL ELSE ISNULL(@TrendWindowDays, [TrendWindowDays]) END,
        [OwnerUserID] = CASE WHEN @OwnerUserID_Clear = 1 THEN NULL ELSE ISNULL(@OwnerUserID, [OwnerUserID]) END,
        [EffectiveFrom] = CASE WHEN @EffectiveFrom_Clear = 1 THEN NULL ELSE ISNULL(@EffectiveFrom, [EffectiveFrom]) END,
        [EffectiveTo] = CASE WHEN @EffectiveTo_Clear = 1 THEN NULL ELSE ISNULL(@EffectiveTo, [EffectiveTo]) END,
        [Notes] = CASE WHEN @Notes_Clear = 1 THEN NULL ELSE ISNULL(@Notes, [Notes]) END
    WHERE
        [ID] = @ID

    -- Check if the update was successful
    IF @@ROWCOUNT = 0
        -- Nothing was updated, return no rows, but column structure from base view intact, semantically correct this way.
        SELECT TOP 0 * FROM [${flyway:defaultSchema}].[vwScoreModels] WHERE 1=0
    ELSE
        -- Return the updated record so the caller can see the updated values and any calculated fields
        SELECT
                                        *
                                    FROM
                                        [${flyway:defaultSchema}].[vwScoreModels]
                                    WHERE
                                        [ID] = @ID
                                    
END
GO

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateScoreModel] TO [cdp_Developer], [cdp_Integration]
GO

------------------------------------------------------------
----- TRIGGER FOR __mj_UpdatedAt field for the ScoreModel table
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[trgUpdateScoreModel]', 'TR') IS NOT NULL
    DROP TRIGGER [${flyway:defaultSchema}].[trgUpdateScoreModel];
GO
CREATE TRIGGER [${flyway:defaultSchema}].trgUpdateScoreModel
ON [${flyway:defaultSchema}].[ScoreModel]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        [${flyway:defaultSchema}].[ScoreModel]
    SET
        __mj_UpdatedAt = GETUTCDATE()
    FROM
        [${flyway:defaultSchema}].[ScoreModel] AS _organicTable
    INNER JOIN
        INSERTED AS I ON
        _organicTable.[ID] = I.[ID];
END;
GO

/* spUpdate Permissions for MJ_BizApps_Sonar: Score Models */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spUpdateScoreModel] TO [cdp_Developer], [cdp_Integration];

/* spDelete SQL for MJ_BizApps_Sonar: Score Models */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Score Models
-- Item: spDeleteScoreModel
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR ScoreModel
------------------------------------------------------------
IF OBJECT_ID('[${flyway:defaultSchema}].[spDeleteScoreModel]', 'P') IS NOT NULL
    DROP PROCEDURE [${flyway:defaultSchema}].[spDeleteScoreModel];
GO

CREATE PROCEDURE [${flyway:defaultSchema}].[spDeleteScoreModel]
    @ID uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM
        [${flyway:defaultSchema}].[ScoreModel]
    WHERE
        [ID] = @ID


    -- Check if the delete was successful
    IF @@ROWCOUNT = 0
        SELECT NULL AS [ID] -- Return NULL for all primary key fields to indicate no record was deleted
    ELSE
        SELECT @ID AS [ID] -- Return the primary key values to indicate we successfully deleted the record
END
GO
GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteScoreModel] TO [cdp_Developer], [cdp_Integration];

/* spDelete Permissions for MJ_BizApps_Sonar: Score Models */

GRANT EXECUTE ON [${flyway:defaultSchema}].[spDeleteScoreModel] TO [cdp_Developer], [cdp_Integration];

/* SQL text to delete unneeded entity fields (14 scoped entities) */
EXEC [${mjSchema}].[spDeleteUnneededEntityFields] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema}', @EntityIDs='710B4C24-C185-4693-B958-2525655E3D20,01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03,AFA51FA5-B85B-49DE-8905-D60B23D07DFA,32F2A760-5BFC-4AF6-BB18-11EF10DD254C,5B986A39-E155-4EB8-9AFD-C1BD6A43548C,1F1CBA7E-F548-420E-9B71-30891E454C42,E9029A00-C998-4B76-B347-70F935E9797D,52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2,524A22AC-73EE-4FEE-A2BF-D89E66AA4F41,EF29D394-6120-4356-BAEA-A66D36F6580B,25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A,77581BAB-4F3C-4D59-82B6-A8E04A03CC2C,46B1F5FE-9AEC-4511-88FE-8FDE062E76BA,D9590BBC-23DF-4571-AB80-DD3C651ABC16';

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'dcc3a92d-721d-4d0b-a8ea-33b18d4f1799' OR (EntityID = '32F2A760-5BFC-4AF6-BB18-11EF10DD254C' AND Name = 'ScoreModel')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'dcc3a92d-721d-4d0b-a8ea-33b18d4f1799',
            '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', -- Entity: MJ_BizApps_Sonar: Scores
            100047,
            'ScoreModel',
            'Score Model',
            NULL,
            'nvarchar',
            400,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'bcbba722-de0b-47f8-904f-64c379c5bf16' OR (EntityID = '32F2A760-5BFC-4AF6-BB18-11EF10DD254C' AND Name = 'AnchorEntity')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'bcbba722-de0b-47f8-904f-64c379c5bf16',
            '32F2A760-5BFC-4AF6-BB18-11EF10DD254C', -- Entity: MJ_BizApps_Sonar: Scores
            100048,
            'AnchorEntity',
            'Anchor Entity',
            NULL,
            'nvarchar',
            510,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '51aed7a3-e482-4cc9-baf6-7e369c267360' OR (EntityID = '710B4C24-C185-4693-B958-2525655E3D20' AND Name = 'ScoreModel')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '51aed7a3-e482-4cc9-baf6-7e369c267360',
            '710B4C24-C185-4693-B958-2525655E3D20', -- Entity: MJ_BizApps_Sonar: Model Related Entities
            100021,
            'ScoreModel',
            'Score Model',
            NULL,
            'nvarchar',
            400,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '49e2244e-03cc-4197-a711-a15a89bb6a74' OR (EntityID = '710B4C24-C185-4693-B958-2525655E3D20' AND Name = 'RelatedEntity')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '49e2244e-03cc-4197-a711-a15a89bb6a74',
            '710B4C24-C185-4693-B958-2525655E3D20', -- Entity: MJ_BizApps_Sonar: Model Related Entities
            100022,
            'RelatedEntity',
            'Related Entity',
            NULL,
            'nvarchar',
            510,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ac9a6125-db8d-4b8d-8976-cc900fdc46ae' OR (EntityID = '1F1CBA7E-F548-420E-9B71-30891E454C42' AND Name = 'ScoreModel')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ac9a6125-db8d-4b8d-8976-cc900fdc46ae',
            '1F1CBA7E-F548-420E-9B71-30891E454C42', -- Entity: MJ_BizApps_Sonar: Score Histories
            100029,
            'ScoreModel',
            'Score Model',
            NULL,
            'nvarchar',
            400,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '23a0e0a0-5c46-4006-936b-16af62bde001' OR (EntityID = '1F1CBA7E-F548-420E-9B71-30891E454C42' AND Name = 'AnchorEntity')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '23a0e0a0-5c46-4006-936b-16af62bde001',
            '1F1CBA7E-F548-420E-9B71-30891E454C42', -- Entity: MJ_BizApps_Sonar: Score Histories
            100030,
            'AnchorEntity',
            'Anchor Entity',
            NULL,
            'nvarchar',
            510,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '70ecf097-ec06-4fb8-8269-b9cdf1ae1582' OR (EntityID = 'E9029A00-C998-4B76-B347-70F935E9797D' AND Name = 'ScoreModel')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '70ecf097-ec06-4fb8-8269-b9cdf1ae1582',
            'E9029A00-C998-4B76-B347-70F935E9797D', -- Entity: MJ_BizApps_Sonar: Score Recompute Runs
            100033,
            'ScoreModel',
            'Score Model',
            NULL,
            'nvarchar',
            400,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6d2c52a1-9680-4e5f-b7c9-115fd9d1eeaa' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = 'AnchorEntity')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '6d2c52a1-9680-4e5f-b7c9-115fd9d1eeaa',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100049,
            'AnchorEntity',
            'Anchor Entity',
            NULL,
            'nvarchar',
            510,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '0a9fbf40-0bdf-4a57-ad26-9c11dd06e7bf' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = 'BandSet')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '0a9fbf40-0bdf-4a57-ad26-9c11dd06e7bf',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100050,
            'BandSet',
            'Band Set',
            NULL,
            'nvarchar',
            400,
            0,
            0,
            1,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'ee79b790-29ce-468c-af8d-6550d66701bb' OR (EntityID = '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA' AND Name = 'OwnerUser')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'ee79b790-29ce-468c-af8d-6550d66701bb',
            '46B1F5FE-9AEC-4511-88FE-8FDE062E76BA', -- Entity: MJ_BizApps_Sonar: Score Models
            100051,
            'OwnerUser',
            'Owner User',
            NULL,
            'nvarchar',
            200,
            0,
            0,
            1,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'c61ca474-a076-40e0-96cc-a37434781f78' OR (EntityID = '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2' AND Name = 'ScoreModel')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'c61ca474-a076-40e0-96cc-a37434781f78',
            '52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2', -- Entity: MJ_BizApps_Sonar: Score Band Transitions
            100023,
            'ScoreModel',
            'Score Model',
            NULL,
            'nvarchar',
            400,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '6cd57a2e-84e7-4f10-bcf1-453ced77f6f1' OR (EntityID = 'EF29D394-6120-4356-BAEA-A66D36F6580B' AND Name = 'AnchorEntity')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '6cd57a2e-84e7-4f10-bcf1-453ced77f6f1',
            'EF29D394-6120-4356-BAEA-A66D36F6580B', -- Entity: MJ_BizApps_Sonar: Score Band Sets
            100013,
            'AnchorEntity',
            'Anchor Entity',
            NULL,
            'nvarchar',
            510,
            0,
            0,
            1,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '13c80e63-8a4d-405f-b5d2-b497db7d3f0b' OR (EntityID = '5B986A39-E155-4EB8-9AFD-C1BD6A43548C' AND Name = 'Factor')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '13c80e63-8a4d-405f-b5d2-b497db7d3f0b',
            '5B986A39-E155-4EB8-9AFD-C1BD6A43548C', -- Entity: MJ_BizApps_Sonar: Score Factor Contributions
            100029,
            'Factor',
            'Factor',
            NULL,
            'nvarchar',
            400,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a8dff37c-ae67-40a3-9136-6c4770ead3a3' OR (EntityID = 'AFA51FA5-B85B-49DE-8905-D60B23D07DFA' AND Name = 'ScoreModel')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'a8dff37c-ae67-40a3-9136-6c4770ead3a3',
            'AFA51FA5-B85B-49DE-8905-D60B23D07DFA', -- Entity: MJ_BizApps_Sonar: Model Factors
            100029,
            'ScoreModel',
            'Score Model',
            NULL,
            'nvarchar',
            400,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '4718a303-ce9d-4a76-91c6-7864e0c456ac' OR (EntityID = 'AFA51FA5-B85B-49DE-8905-D60B23D07DFA' AND Name = 'Factor')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '4718a303-ce9d-4a76-91c6-7864e0c456ac',
            'AFA51FA5-B85B-49DE-8905-D60B23D07DFA', -- Entity: MJ_BizApps_Sonar: Model Factors
            100030,
            'Factor',
            'Factor',
            NULL,
            'nvarchar',
            400,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '56f5f5a2-862b-4dde-9fad-ef1b199d262a' OR (EntityID = '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41' AND Name = 'ScoreModel')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '56f5f5a2-862b-4dde-9fad-ef1b199d262a',
            '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41', -- Entity: MJ_BizApps_Sonar: Score Model Audit Events
            100023,
            'ScoreModel',
            'Score Model',
            NULL,
            'nvarchar',
            400,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'a8ba9a43-e65e-40fa-b004-00656f82aca4' OR (EntityID = '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41' AND Name = 'ChangedByUser')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'a8ba9a43-e65e-40fa-b004-00656f82aca4',
            '524A22AC-73EE-4FEE-A2BF-D89E66AA4F41', -- Entity: MJ_BizApps_Sonar: Score Model Audit Events
            100024,
            'ChangedByUser',
            'Changed By User',
            NULL,
            'nvarchar',
            200,
            0,
            0,
            1,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '4ef68f35-ccf8-41db-b826-f76ea275f880' OR (EntityID = '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A' AND Name = 'BandSet')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '4ef68f35-ccf8-41db-b826-f76ea275f880',
            '25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A', -- Entity: MJ_BizApps_Sonar: Score Bands
            100023,
            'BandSet',
            'Band Set',
            NULL,
            'nvarchar',
            400,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '0a0cbf4d-d0cb-4efe-8838-0ed37a0566fd' OR (EntityID = 'D9590BBC-23DF-4571-AB80-DD3C651ABC16' AND Name = 'ScoreModel')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '0a0cbf4d-d0cb-4efe-8838-0ed37a0566fd',
            'D9590BBC-23DF-4571-AB80-DD3C651ABC16', -- Entity: MJ_BizApps_Sonar: Score Model Versions
            100023,
            'ScoreModel',
            'Score Model',
            NULL,
            'nvarchar',
            400,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'd24dbe47-6028-4e6e-89fb-7812edc89e93' OR (EntityID = 'D9590BBC-23DF-4571-AB80-DD3C651ABC16' AND Name = 'PublishedByUser')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'd24dbe47-6028-4e6e-89fb-7812edc89e93',
            'D9590BBC-23DF-4571-AB80-DD3C651ABC16', -- Entity: MJ_BizApps_Sonar: Score Model Versions
            100024,
            'PublishedByUser',
            'Published By User',
            NULL,
            'nvarchar',
            200,
            0,
            0,
            1,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '4ee70f79-23c8-464f-be51-2e402546f8d1' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'ScoreModel')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '4ee70f79-23c8-464f-be51-2e402546f8d1',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100067,
            'ScoreModel',
            'Score Model',
            NULL,
            'nvarchar',
            400,
            0,
            0,
            1,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '32260e42-edd3-4182-b3aa-a31baff2538f' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'AnchorEntity')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '32260e42-edd3-4182-b3aa-a31baff2538f',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100068,
            'AnchorEntity',
            'Anchor Entity',
            NULL,
            'nvarchar',
            510,
            0,
            0,
            0,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f752728b-4a4a-4c29-8b8c-b054f56db801' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'SourceEntity')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'f752728b-4a4a-4c29-8b8c-b054f56db801',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100069,
            'SourceEntity',
            'Source Entity',
            NULL,
            'nvarchar',
            510,
            0,
            0,
            1,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = 'f50a0fbb-16ec-4717-8094-4f5d93b6e4de' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'TimeWindow')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            'f50a0fbb-16ec-4717-8094-4f5d93b6e4de',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100070,
            'TimeWindow',
            'Time Window',
            NULL,
            'nvarchar',
            240,
            0,
            0,
            1,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '3e931aa4-a826-46f9-a134-1ca2865a6462' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'Action')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '3e931aa4-a826-46f9-a134-1ca2865a6462',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100071,
            'Action',
            'Action',
            NULL,
            'nvarchar',
            850,
            0,
            0,
            1,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to insert new entity field */

      IF NOT EXISTS (SELECT 1 FROM [${mjSchema}].[EntityField] WHERE ID = '9bd64acc-87da-47e9-a134-b9519bd268a6' OR (EntityID = '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03' AND Name = 'SourceScoreModel')) BEGIN
         INSERT INTO [${mjSchema}].[EntityField]
         (
            [ID],
            [EntityID],
            [Sequence],
            [Name],
            [DisplayName],
            [Description],
            [Type],
            [Length],
            [Precision],
            [Scale],
            [AllowsNull],
            [DefaultValue],
            [AutoIncrement],
            [AllowUpdateAPI],
            [IsVirtual],
            [IsComputed],
            [RelatedEntityID],
            [RelatedEntityFieldName],
            [IsNameField],
            [IncludeInUserSearchAPI],
            [IncludeRelatedEntityNameFieldInBaseView],
            [DefaultInView],
            [IsPrimaryKey],
            [IsUnique],
            [RelatedEntityDisplayType],
            [__mj_CreatedAt],
            [__mj_UpdatedAt]
         )
         VALUES
         (
            '9bd64acc-87da-47e9-a134-b9519bd268a6',
            '01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03', -- Entity: MJ_BizApps_Sonar: Factors
            100072,
            'SourceScoreModel',
            'Source Score Model',
            NULL,
            'nvarchar',
            400,
            0,
            0,
            1,
            NULL,
            0,
            0,
            1,
            0,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            'Search',
            GETUTCDATE(),
            GETUTCDATE()
         )
      END;

/* SQL text to update existing entity fields from schema (14 scoped entities) */
EXEC [${mjSchema}].[spUpdateExistingEntityFieldsFromSchema] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema}', @EntityIDs='710B4C24-C185-4693-B958-2525655E3D20,01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03,AFA51FA5-B85B-49DE-8905-D60B23D07DFA,32F2A760-5BFC-4AF6-BB18-11EF10DD254C,5B986A39-E155-4EB8-9AFD-C1BD6A43548C,1F1CBA7E-F548-420E-9B71-30891E454C42,E9029A00-C998-4B76-B347-70F935E9797D,52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2,524A22AC-73EE-4FEE-A2BF-D89E66AA4F41,EF29D394-6120-4356-BAEA-A66D36F6580B,25AAF1B7-F32B-44BE-A815-D9F1D9A71A0A,77581BAB-4F3C-4D59-82B6-A8E04A03CC2C,46B1F5FE-9AEC-4511-88FE-8FDE062E76BA,D9590BBC-23DF-4571-AB80-DD3C651ABC16';

/* SQL text to set default column width where needed */
EXEC [${mjSchema}].[spSetDefaultColumnWidthWhereNeeded] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema}';

