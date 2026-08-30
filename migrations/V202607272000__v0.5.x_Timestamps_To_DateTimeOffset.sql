-- =============================================================================
-- V202607272000__v0.5.x_Timestamps_To_DateTimeOffset.sql
-- =============================================================================
-- Converts every Sonar business timestamp column from datetime2(7) to
-- datetimeoffset(7), so a stored instant carries its own UTC offset.
--
-- WHY: datetime2 is a bare clock reading with no zone. A save -> reload -> save
-- cycle through the MJ entity layer reinterpreted ScoreRecomputeRun.StartedAt as
-- LOCAL time and rewrote it ~5h shifted, which drove CompletedAt - StartedAt
-- negative (runs displayed a negative duration). MJ's own __mj_CreatedAt /
-- __mj_UpdatedAt survived the identical cycle untouched precisely because they
-- are datetimeoffset -- Sonar's own columns were the odd ones out.
--
-- The symptom is ALREADY fixed in code (RecomputeOrchestrator.finishRun computes
-- the duration from an in-memory Date and never trusts the reloaded column), so
-- this is a robustness upgrade, not a repair: it removes the trap rather than
-- working around it, so no future writer can reintroduce the shift.
--
-- SAFETY: converting datetime2 -> datetimeoffset interprets each existing value
-- as +00:00. That is correct here because the stored values ARE already UTC --
-- the engine writes them via toISOString() and the existing column defaults are
-- getutcdate(). So no value moves; they just gain an explicit +00:00.
--
-- Three kinds of dependency have to be cleared before SQL Server will retype
-- these columns, and put back afterwards:
--
--   1. DEFAULT constraints (6 of them, all getutcdate()). Their names are
--      AUTO-GENERATED (DF__Score__ComputedA__2C201BE5) and therefore differ per
--      database, so they are dropped by LOOKUP, never by hardcoded name. They are
--      recreated with EXPLICIT names so a future migration doesn't face the same
--      problem, and with TODATETIMEOFFSET(SYSUTCDATETIME(), 0) -- the offset-aware
--      equivalent of the old getutcdate(), same instant, now self-describing.
--   2. Two non-unique indexes keyed on a converted column. Recreated with the
--      same keys/order; key sizes stay well under the 1700-byte nonclustered
--      limit (16 + 900 + 10 = 926 bytes).
--   3. Nothing else: no check constraints reference these columns and no view in
--      the schema is SCHEMABINDING.
--
-- Wrapped in one transaction. SQL Server DDL is transactional, and an earlier
-- non-transactional attempt at this left the indexes dropped and the columns
-- unconverted when the first ALTER hit an undeclared default -- exactly the
-- half-applied state a migration must never be able to produce.
--
-- Guarded on the current type of a representative column, so a re-run is a no-op.
-- =============================================================================

SET XACT_ABORT ON;
BEGIN TRY
BEGIN TRAN;

IF EXISTS (
    SELECT 1
    FROM sys.columns c
    JOIN sys.tables t ON t.object_id = c.object_id
    JOIN sys.types ty ON ty.user_type_id = c.user_type_id
    WHERE SCHEMA_NAME(t.schema_id) = '${flyway:defaultSchema}'
      AND t.name = 'ScoreRecomputeRun' AND c.name = 'StartedAt' AND ty.name = 'datetime2'
)
BEGIN
    ----------------------------------------------------------------------------
    -- 1. Drop the auto-named DEFAULT constraints on the columns being retyped.
    ----------------------------------------------------------------------------
    DECLARE @dropDefaults NVARCHAR(MAX) = N'';
    SELECT @dropDefaults = @dropDefaults
         + N'ALTER TABLE [' + SCHEMA_NAME(t.schema_id) + N'].[' + t.name
         + N'] DROP CONSTRAINT [' + dc.name + N'];' + CHAR(13) + CHAR(10)
    FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    JOIN sys.tables t ON t.object_id = c.object_id
    JOIN sys.types ty ON ty.user_type_id = c.user_type_id
    WHERE SCHEMA_NAME(t.schema_id) = '${flyway:defaultSchema}'
      AND ty.name = 'datetime2'
      AND c.name NOT LIKE '__mj_%';
    IF LEN(@dropDefaults) > 0 EXEC sp_executesql @dropDefaults;

    ----------------------------------------------------------------------------
    -- 2. Drop the indexes keyed on a column being retyped.
    ----------------------------------------------------------------------------
    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ScoreHistory_Model_Anchor_AsOf'
               AND object_id = OBJECT_ID('${flyway:defaultSchema}.ScoreHistory'))
        DROP INDEX IX_ScoreHistory_Model_Anchor_AsOf ON ${flyway:defaultSchema}.ScoreHistory;
    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ScoreBandTransition_Model_OccurredAt'
               AND object_id = OBJECT_ID('${flyway:defaultSchema}.ScoreBandTransition'))
        DROP INDEX IX_ScoreBandTransition_Model_OccurredAt ON ${flyway:defaultSchema}.ScoreBandTransition;

    ----------------------------------------------------------------------------
    -- 3. Retype. Nullability is preserved exactly as it was.
    ----------------------------------------------------------------------------
    -- Runtime output.
    ALTER TABLE ${flyway:defaultSchema}.Score                ALTER COLUMN ComputedAt      DATETIMEOFFSET(7) NOT NULL;
    ALTER TABLE ${flyway:defaultSchema}.Score                ALTER COLUMN AsOfDate        DATETIMEOFFSET(7) NULL;
    ALTER TABLE ${flyway:defaultSchema}.Score                ALTER COLUMN NextRecomputeAt DATETIMEOFFSET(7) NULL;
    ALTER TABLE ${flyway:defaultSchema}.ScoreHistory         ALTER COLUMN ComputedAt      DATETIMEOFFSET(7) NOT NULL;
    ALTER TABLE ${flyway:defaultSchema}.ScoreHistory         ALTER COLUMN AsOfDate        DATETIMEOFFSET(7) NULL;
    ALTER TABLE ${flyway:defaultSchema}.ScoreBandTransition  ALTER COLUMN OccurredAt      DATETIMEOFFSET(7) NOT NULL;

    -- Recompute / audit.
    ALTER TABLE ${flyway:defaultSchema}.ScoreRecomputeRun    ALTER COLUMN StartedAt       DATETIMEOFFSET(7) NOT NULL;
    ALTER TABLE ${flyway:defaultSchema}.ScoreRecomputeRun    ALTER COLUMN CompletedAt     DATETIMEOFFSET(7) NULL;
    ALTER TABLE ${flyway:defaultSchema}.ScoreModelAuditEvent ALTER COLUMN ChangedAt       DATETIMEOFFSET(7) NOT NULL;

    -- Configuration.
    ALTER TABLE ${flyway:defaultSchema}.ScoreModelVersion    ALTER COLUMN PublishedAt     DATETIMEOFFSET(7) NOT NULL;
    ALTER TABLE ${flyway:defaultSchema}.ScoreModel           ALTER COLUMN EffectiveFrom   DATETIMEOFFSET(7) NULL;
    ALTER TABLE ${flyway:defaultSchema}.ScoreModel           ALTER COLUMN EffectiveTo     DATETIMEOFFSET(7) NULL;
    ALTER TABLE ${flyway:defaultSchema}.Factor               ALTER COLUMN LastValidatedAt DATETIMEOFFSET(7) NULL;

    ----------------------------------------------------------------------------
    -- 4. Put the defaults back, now offset-aware and explicitly named.
    ----------------------------------------------------------------------------
    ALTER TABLE ${flyway:defaultSchema}.Score
        ADD CONSTRAINT DF_Score_ComputedAt DEFAULT TODATETIMEOFFSET(SYSUTCDATETIME(), 0) FOR ComputedAt;
    ALTER TABLE ${flyway:defaultSchema}.ScoreHistory
        ADD CONSTRAINT DF_ScoreHistory_ComputedAt DEFAULT TODATETIMEOFFSET(SYSUTCDATETIME(), 0) FOR ComputedAt;
    ALTER TABLE ${flyway:defaultSchema}.ScoreBandTransition
        ADD CONSTRAINT DF_ScoreBandTransition_OccurredAt DEFAULT TODATETIMEOFFSET(SYSUTCDATETIME(), 0) FOR OccurredAt;
    ALTER TABLE ${flyway:defaultSchema}.ScoreRecomputeRun
        ADD CONSTRAINT DF_ScoreRecomputeRun_StartedAt DEFAULT TODATETIMEOFFSET(SYSUTCDATETIME(), 0) FOR StartedAt;
    ALTER TABLE ${flyway:defaultSchema}.ScoreModelAuditEvent
        ADD CONSTRAINT DF_ScoreModelAuditEvent_ChangedAt DEFAULT TODATETIMEOFFSET(SYSUTCDATETIME(), 0) FOR ChangedAt;
    ALTER TABLE ${flyway:defaultSchema}.ScoreModelVersion
        ADD CONSTRAINT DF_ScoreModelVersion_PublishedAt DEFAULT TODATETIMEOFFSET(SYSUTCDATETIME(), 0) FOR PublishedAt;

    ----------------------------------------------------------------------------
    -- 5. Recreate the indexes exactly as they were.
    ----------------------------------------------------------------------------
    CREATE NONCLUSTERED INDEX IX_ScoreHistory_Model_Anchor_AsOf
        ON ${flyway:defaultSchema}.ScoreHistory ([ScoreModelID], [AnchorRecordID], [AsOfDate]);
    CREATE NONCLUSTERED INDEX IX_ScoreBandTransition_Model_OccurredAt
        ON ${flyway:defaultSchema}.ScoreBandTransition ([ScoreModelID], [OccurredAt]);
END

COMMIT TRAN;
END TRY
BEGIN CATCH
IF @@TRANCOUNT > 0 ROLLBACK TRAN;
THROW;
END CATCH;
GO

-- ============================================================================
-- CodeGen output — regenerated views / CRUD procs / FK indexes / entity-field
-- metadata for the retyped columns. Generated by 'mj codegen' and appended per the
-- migration convention (see V202606241200 and the Initial Schema migration).
--
-- This half is not optional. The ALTERs above change the COLUMNS; without this the
-- CRUD procs keep declaring datetime2 parameters and __mj.EntityField.Type stays
-- 'datetime2', so MJ's runtime would still apply datetime2 conversion semantics to
-- datetimeoffset columns — i.e. the bug would survive its own fix.
-- ============================================================================

/* SQL text to update existing entities from schema */
EXEC [${mjSchema}].[spUpdateExistingEntitiesFromSchema] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema}';

/* SQL text to update existing entity fields from schema */
EXEC [${mjSchema}].[spUpdateExistingEntityFieldsFromSchema] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema}';

/* SQL text to set default column width where needed */
EXEC [${mjSchema}].[spSetDefaultColumnWidthWhereNeeded] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema}';

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
    mjBizAppsSonarScoreModel_ScoreModelID.[Name] AS [ScoreModel],
    MJEntity_AnchorEntityID.[Name] AS [AnchorEntity],
    MJEntity_SourceEntityID.[Name] AS [SourceEntity],
    mjBizAppsSonarTimeWindow_TimeWindowID.[Name] AS [TimeWindow],
    MJAction_ActionID.[Name] AS [Action],
    mjBizAppsSonarScoreModel_SourceScoreModelID.[Name] AS [SourceScoreModel]
FROM
    [${flyway:defaultSchema}].[Factor] AS f
LEFT OUTER JOIN
    [${flyway:defaultSchema}].[ScoreModel] AS mjBizAppsSonarScoreModel_ScoreModelID
  ON
    [f].[ScoreModelID] = mjBizAppsSonarScoreModel_ScoreModelID.[ID]
INNER JOIN
    [${mjSchema}].[Entity] AS MJEntity_AnchorEntityID
  ON
    [f].[AnchorEntityID] = MJEntity_AnchorEntityID.[ID]
LEFT OUTER JOIN
    [${mjSchema}].[Entity] AS MJEntity_SourceEntityID
  ON
    [f].[SourceEntityID] = MJEntity_SourceEntityID.[ID]
LEFT OUTER JOIN
    [${flyway:defaultSchema}].[TimeWindow] AS mjBizAppsSonarTimeWindow_TimeWindowID
  ON
    [f].[TimeWindowID] = mjBizAppsSonarTimeWindow_TimeWindowID.[ID]
LEFT OUTER JOIN
    [${mjSchema}].[Action] AS MJAction_ActionID
  ON
    [f].[ActionID] = MJAction_ActionID.[ID]
LEFT OUTER JOIN
    [${flyway:defaultSchema}].[ScoreModel] AS mjBizAppsSonarScoreModel_SourceScoreModelID
  ON
    [f].[SourceScoreModelID] = mjBizAppsSonarScoreModel_SourceScoreModelID.[ID]
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
    @LastValidatedAt datetimeoffset = NULL,
    @CreatedByAgent_Clear bit = 0,
    @CreatedByAgent nvarchar(60) = NULL,
    @DateField_Clear bit = 0,
    @DateField nvarchar(200) = NULL
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
                [CreatedByAgent],
                [DateField]
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
                CASE WHEN @CreatedByAgent_Clear = 1 THEN NULL ELSE ISNULL(@CreatedByAgent, NULL) END,
                CASE WHEN @DateField_Clear = 1 THEN NULL ELSE ISNULL(@DateField, NULL) END
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
                [CreatedByAgent],
                [DateField]
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
                CASE WHEN @CreatedByAgent_Clear = 1 THEN NULL ELSE ISNULL(@CreatedByAgent, NULL) END,
                CASE WHEN @DateField_Clear = 1 THEN NULL ELSE ISNULL(@DateField, NULL) END
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
    @LastValidatedAt datetimeoffset = NULL,
    @CreatedByAgent_Clear bit = 0,
    @CreatedByAgent nvarchar(60) = NULL,
    @DateField_Clear bit = 0,
    @DateField nvarchar(200) = NULL
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
        [CreatedByAgent] = CASE WHEN @CreatedByAgent_Clear = 1 THEN NULL ELSE ISNULL(@CreatedByAgent, [CreatedByAgent]) END,
        [DateField] = CASE WHEN @DateField_Clear = 1 THEN NULL ELSE ISNULL(@DateField, [DateField]) END
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
    mjBizAppsSonarScoreModel_ScoreModelID.[Name] AS [ScoreModel]
FROM
    [${flyway:defaultSchema}].[ScoreBandTransition] AS s
INNER JOIN
    [${flyway:defaultSchema}].[ScoreModel] AS mjBizAppsSonarScoreModel_ScoreModelID
  ON
    [s].[ScoreModelID] = mjBizAppsSonarScoreModel_ScoreModelID.[ID]
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
    @AnchorRecordID nvarchar(450),
    @FromBandID_Clear bit = 0,
    @FromBandID uniqueidentifier = NULL,
    @ToBandID_Clear bit = 0,
    @ToBandID uniqueidentifier = NULL,
    @Direction_Clear bit = 0,
    @Direction nvarchar(12) = NULL,
    @OccurredAt datetimeoffset = NULL,
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
                ISNULL(@OccurredAt, 'todatetimeoffset(sysutcdatetime(),(0))'),
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
                ISNULL(@OccurredAt, 'todatetimeoffset(sysutcdatetime(),(0))'),
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
    @AnchorRecordID nvarchar(450) = NULL,
    @FromBandID_Clear bit = 0,
    @FromBandID uniqueidentifier = NULL,
    @ToBandID_Clear bit = 0,
    @ToBandID uniqueidentifier = NULL,
    @Direction_Clear bit = 0,
    @Direction nvarchar(12) = NULL,
    @OccurredAt datetimeoffset = NULL,
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
    mjBizAppsSonarScoreModel_ScoreModelID.[Name] AS [ScoreModel],
    MJEntity_AnchorEntityID.[Name] AS [AnchorEntity]
FROM
    [${flyway:defaultSchema}].[ScoreHistory] AS s
INNER JOIN
    [${flyway:defaultSchema}].[ScoreModel] AS mjBizAppsSonarScoreModel_ScoreModelID
  ON
    [s].[ScoreModelID] = mjBizAppsSonarScoreModel_ScoreModelID.[ID]
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
    @AnchorRecordID nvarchar(450),
    @NormalizedScore_Clear bit = 0,
    @NormalizedScore decimal(9, 4) = NULL,
    @BandID_Clear bit = 0,
    @BandID uniqueidentifier = NULL,
    @AsOfDate_Clear bit = 0,
    @AsOfDate datetimeoffset = NULL,
    @ComputedAt datetimeoffset = NULL,
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
                ISNULL(@ComputedAt, 'todatetimeoffset(sysutcdatetime(),(0))'),
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
                ISNULL(@ComputedAt, 'todatetimeoffset(sysutcdatetime(),(0))'),
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
    @AnchorRecordID nvarchar(450) = NULL,
    @NormalizedScore_Clear bit = 0,
    @NormalizedScore decimal(9, 4) = NULL,
    @BandID_Clear bit = 0,
    @BandID uniqueidentifier = NULL,
    @AsOfDate_Clear bit = 0,
    @AsOfDate datetimeoffset = NULL,
    @ComputedAt datetimeoffset = NULL,
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
    mjBizAppsSonarScoreModel_ScoreModelID.[Name] AS [ScoreModel],
    MJUser_ChangedByUserID.[Name] AS [ChangedByUser]
FROM
    [${flyway:defaultSchema}].[ScoreModelAuditEvent] AS s
INNER JOIN
    [${flyway:defaultSchema}].[ScoreModel] AS mjBizAppsSonarScoreModel_ScoreModelID
  ON
    [s].[ScoreModelID] = mjBizAppsSonarScoreModel_ScoreModelID.[ID]
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
    @ChangedAt datetimeoffset = NULL
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
                ISNULL(@ChangedAt, 'todatetimeoffset(sysutcdatetime(),(0))')
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
                ISNULL(@ChangedAt, 'todatetimeoffset(sysutcdatetime(),(0))')
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
    @ChangedAt datetimeoffset = NULL
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
    mjBizAppsSonarScoreModel_ScoreModelID.[Name] AS [ScoreModel],
    MJUser_PublishedByUserID.[Name] AS [PublishedByUser]
FROM
    [${flyway:defaultSchema}].[ScoreModelVersion] AS s
INNER JOIN
    [${flyway:defaultSchema}].[ScoreModel] AS mjBizAppsSonarScoreModel_ScoreModelID
  ON
    [s].[ScoreModelID] = mjBizAppsSonarScoreModel_ScoreModelID.[ID]
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
    @PublishedAt datetimeoffset = NULL,
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
                ISNULL(@PublishedAt, 'todatetimeoffset(sysutcdatetime(),(0))'),
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
                ISNULL(@PublishedAt, 'todatetimeoffset(sysutcdatetime(),(0))'),
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
    @PublishedAt datetimeoffset = NULL,
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
    mjBizAppsSonarScoreBandSet_BandSetID.[Name] AS [BandSet],
    MJUser_OwnerUserID.[Name] AS [OwnerUser]
FROM
    [${flyway:defaultSchema}].[ScoreModel] AS s
INNER JOIN
    [${mjSchema}].[Entity] AS MJEntity_AnchorEntityID
  ON
    [s].[AnchorEntityID] = MJEntity_AnchorEntityID.[ID]
LEFT OUTER JOIN
    [${flyway:defaultSchema}].[ScoreBandSet] AS mjBizAppsSonarScoreBandSet_BandSetID
  ON
    [s].[BandSetID] = mjBizAppsSonarScoreBandSet_BandSetID.[ID]
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
    @EffectiveFrom datetimeoffset = NULL,
    @EffectiveTo_Clear bit = 0,
    @EffectiveTo datetimeoffset = NULL,
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
    @EffectiveFrom datetimeoffset = NULL,
    @EffectiveTo_Clear bit = 0,
    @EffectiveTo datetimeoffset = NULL,
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
    mjBizAppsSonarScoreModel_ScoreModelID.[Name] AS [ScoreModel]
FROM
    [${flyway:defaultSchema}].[ScoreRecomputeRun] AS s
INNER JOIN
    [${flyway:defaultSchema}].[ScoreModel] AS mjBizAppsSonarScoreModel_ScoreModelID
  ON
    [s].[ScoreModelID] = mjBizAppsSonarScoreModel_ScoreModelID.[ID]
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
    @StartedAt datetimeoffset = NULL,
    @CompletedAt_Clear bit = 0,
    @CompletedAt datetimeoffset = NULL,
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
                ISNULL(@StartedAt, 'todatetimeoffset(sysutcdatetime(),(0))'),
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
                ISNULL(@StartedAt, 'todatetimeoffset(sysutcdatetime(),(0))'),
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
    @StartedAt datetimeoffset = NULL,
    @CompletedAt_Clear bit = 0,
    @CompletedAt datetimeoffset = NULL,
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
    mjBizAppsSonarScoreModel_ScoreModelID.[Name] AS [ScoreModel],
    MJEntity_AnchorEntityID.[Name] AS [AnchorEntity]
FROM
    [${flyway:defaultSchema}].[Score] AS s
INNER JOIN
    [${flyway:defaultSchema}].[ScoreModel] AS mjBizAppsSonarScoreModel_ScoreModelID
  ON
    [s].[ScoreModelID] = mjBizAppsSonarScoreModel_ScoreModelID.[ID]
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
    @AnchorRecordID nvarchar(450),
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
    @ComputedAt datetimeoffset = NULL,
    @AsOfDate_Clear bit = 0,
    @AsOfDate datetimeoffset = NULL,
    @NextRecomputeAt_Clear bit = 0,
    @NextRecomputeAt datetimeoffset = NULL,
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
                ISNULL(@ComputedAt, 'todatetimeoffset(sysutcdatetime(),(0))'),
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
                ISNULL(@ComputedAt, 'todatetimeoffset(sysutcdatetime(),(0))'),
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
    @AnchorRecordID nvarchar(450) = NULL,
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
    @ComputedAt datetimeoffset = NULL,
    @AsOfDate_Clear bit = 0,
    @AsOfDate datetimeoffset = NULL,
    @NextRecomputeAt_Clear bit = 0,
    @NextRecomputeAt datetimeoffset = NULL,
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

/* SQL text to delete unneeded entity fields (8 scoped entities) */
EXEC [${mjSchema}].[spDeleteUnneededEntityFields] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema}', @EntityIDs='01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03,52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2,1F1CBA7E-F548-420E-9B71-30891E454C42,524A22AC-73EE-4FEE-A2BF-D89E66AA4F41,46B1F5FE-9AEC-4511-88FE-8FDE062E76BA,D9590BBC-23DF-4571-AB80-DD3C651ABC16,E9029A00-C998-4B76-B347-70F935E9797D,32F2A760-5BFC-4AF6-BB18-11EF10DD254C';

/* SQL text to update existing entity fields from schema (8 scoped entities) */
EXEC [${mjSchema}].[spUpdateExistingEntityFieldsFromSchema] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema}', @EntityIDs='01BC22BE-E8C3-4C17-912B-FC2AF1E2DC03,52BA9A19-C7FF-47EA-AFFD-A398BB8AD3B2,1F1CBA7E-F548-420E-9B71-30891E454C42,524A22AC-73EE-4FEE-A2BF-D89E66AA4F41,46B1F5FE-9AEC-4511-88FE-8FDE062E76BA,D9590BBC-23DF-4571-AB80-DD3C651ABC16,E9029A00-C998-4B76-B347-70F935E9797D,32F2A760-5BFC-4AF6-BB18-11EF10DD254C';

/* SQL text to set default column width where needed */
EXEC [${mjSchema}].[spSetDefaultColumnWidthWhereNeeded] @ExcludedSchemaNames='sys,staging,dbo,${mjSchema}';

