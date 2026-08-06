-- =============================================================================
-- V202608041000__v0.5.x_Intervention_Outcome_Field_Fix.sql
-- =============================================================================
-- Bring vwInterventionOutcomes and its entity metadata back into agreement, so writes to
-- MJ_BizApps_Sonar: Intervention Outcomes work on BOTH a fresh install and a developer database.
--
-- ## The failure
--
-- MJ's entity layer sizes a @ResultTable from the ENTITY METADATA field list, then runs
-- `INSERT INTO @ResultTable EXEC spCreateInterventionOutcome ...`. The procedure returns a row from
-- vwInterventionOutcomes. If the view returns a different number of columns than the metadata
-- declares, every write dies on "Column name or number of supplied values does not match table
-- definition", and it died SILENTLY, because OutcomeMeasurer ignored the boolean Save() returns and
-- counted the attempt anyway. `Sonar: Measure Intervention Outcomes` reported "Measured 100
-- outcome(s)" against a table holding zero rows.
--
-- ## Which environment was actually broken (this matters, and is easy to get backwards)
--
-- V202608011800 ships the view as a plain `SELECT i.*`: eight columns, no join. Metadata declares
-- eight. Those agree, so A FRESH INSTALL WAS NEVER BROKEN.
--
-- CodeGen's current output for this entity is different: it adds a denormalized FK display column,
-- `InterventionAssignment.AnchorRecordID AS [Assignment]`, via an INNER JOIN, so nine columns. Any
-- database where `mj codegen` has been run locally therefore has a nine-column view against
-- eight-column metadata, which is why outcomes never persisted on developer machines while the
-- shipped path was fine.
--
-- So this is drift between a frozen view in a migration and what CodeGen now generates, not a defect
-- in either one alone.
--
-- ## The fix, and why this direction
--
-- Align both on CodeGen's CURRENT shape rather than freezing the older one: recreate the view with the
-- join (verbatim from what CodeGen generated) and register the matching EntityField. A fresh install
-- moves 8/8 -> 9/9; a codegen'd developer database moves 9/8 -> 9/9. Reverting the view instead would
-- be undone by the next `mj codegen` and the drift would come straight back.
--
-- V202608011800 calls this omission a "KNOWN COSMETIC GAP … Harmless: nothing references it". It is
-- not harmless once the view and the metadata disagree, and its stated cause is wrong too: it blames
-- the field sync running before the view exists, but that migration creates the view (~line 3206)
-- BEFORE its second spUpdateExistingEntityFieldsFromSchema call (~line 7126). Running that procedure
-- by hand against a fully installed database, scoped to this entity, still does not add the column
-- (8 fields before, 8 after): it does not register view-only display columns at all. That comment
-- cannot be corrected in place because the migration is applied; this header supersedes it.
--
-- The EntityField values are copied from a working sibling of the same shape (ChangedByUser on
-- MJ_BizApps_Sonar: Score Model Audit Events, a virtual nvarchar FK display sourced from a join)
-- rather than invented. Only EntityID, Name and Type lack table defaults.
--
-- ## A SECOND instance, found by sweeping for the invariant instead of trusting the one report
--
-- The query that proves this one fixed also generalises: for every Sonar entity, does the registered
-- field count equal its base view's column count? Running it turned up MJ_BizApps_Sonar: Intervention
-- Proposals sitting at 13 fields against a 14-column view ON A FRESH INSTALL. That is the drafted-outreach table, so a fresh
-- install could not have persisted a single proposal either: `Sonar: Draft Outreach` would have failed
-- on every member.
--
-- It is the same drift with the halves swapped. For Outcomes the migration's view and metadata agreed
-- (both eight) and the developer database was the odd one out. For Proposals the migration's view
-- ALREADY selects the denormalized `Intervention` column but its metadata never registered it. The
-- field only exists in a developer database because `mj codegen` minted it there, live, and that row
-- (3E75E2BE-…) was never captured into any migration. Section 3 registers it so a fresh install
-- reaches 14/14 too. Guarded by NAME, not by id, precisely because a codegen'd database already holds
-- it under CodeGen's own id and a second row would take that database to fifteen.
--
-- Afterwards the invariant holds for all 19 registered Sonar entities in both a fresh install and a
-- codegen'd developer database, and their full field lists are identical (294 fields each, zero
-- differences). INSTALL.md carries the query that re-runs that sweep.
--
-- Idempotent. PG twin: migrations-pg/V202608041000__v0.5.x_Intervention_Outcome_Field_Fix.pg.sql
-- =============================================================================

-- 1. The view, as CodeGen generates it today. Guarded so a replay is safe.
IF OBJECT_ID('[${flyway:defaultSchema}].[vwInterventionOutcomes]', 'V') IS NOT NULL
    DROP VIEW [${flyway:defaultSchema}].[vwInterventionOutcomes];
GO

CREATE VIEW [${flyway:defaultSchema}].[vwInterventionOutcomes]
AS
SELECT
    i.*,
    mjBizAppsSonarInterventionAssignment_AssignmentID.[AnchorRecordID] AS [Assignment]
FROM
    [${flyway:defaultSchema}].[InterventionOutcome] AS i
INNER JOIN
    [${flyway:defaultSchema}].[InterventionAssignment] AS mjBizAppsSonarInterventionAssignment_AssignmentID
  ON
    [i].[AssignmentID] = mjBizAppsSonarInterventionAssignment_AssignmentID.[ID]
GO

GRANT SELECT ON [${flyway:defaultSchema}].[vwInterventionOutcomes] TO [cdp_UI], [cdp_Developer], [cdp_Integration];
GO

-- 2. The matching metadata field, so the entity layer's result table is the same width as the view.
DECLARE @OutcomeEntityID UNIQUEIDENTIFIER = '58011143-158F-4F35-B294-0446C89A2D50';

IF EXISTS (SELECT 1 FROM [${mjSchema}].[Entity] WHERE [ID] = @OutcomeEntityID)
   AND NOT EXISTS (
        SELECT 1 FROM [${mjSchema}].[EntityField]
        WHERE [EntityID] = @OutcomeEntityID AND [Name] = 'Assignment'
   )
BEGIN
    INSERT INTO [${mjSchema}].[EntityField] (
        [ID], [EntityID], [Sequence], [Name], [DisplayName], [Description],
        [Type], [Length], [AllowsNull], [IsPrimaryKey], [IsUnique],
        [IsVirtual], [DefaultInView], [AllowUpdateAPI], [AllowUpdateInView],
        [IncludeInUserSearchAPI], [IncludeInGeneratedForm], [IsNameField]
    )
    VALUES (
        '5044A100-0029-4000-8000-000000000029', @OutcomeEntityID,
        -- Sequence 9: the eight registered fields hold 1-8, and this is the ninth column the view
        -- returns, so metadata order follows the view's column order.
        9, 'Assignment', 'Assignment',
        N'Denormalized display of the assignment this outcome belongs to (InterventionAssignment.AnchorRecordID), surfaced by vwInterventionOutcomes. Registered because the entity layer sizes its result table from this field list, so a column the view returns but the metadata omits breaks every write.',
        'nvarchar',
        -- 900 bytes = nvarchar(450), matching InterventionAssignment.AnchorRecordID after the
        -- composite-anchor-key widening.
        900,
        1,  -- AllowsNull: MJ marks these nullable regardless of the join
        0, 0,
        1,  -- IsVirtual: it lives in the view, not the table
        0,
        0,  -- AllowUpdateAPI: read-only; a write would have nowhere to go
        0, 0, 0, 0
    );
END
GO

-- 3. Same bug, second entity: Intervention Proposals. Its view (V202608031000, ~line 1055) already
--    selects Intervention.Name AS [Intervention], so 14 columns, but only 13 fields were registered, so
--    a fresh install cannot write a proposal. Values taken from the column the view actually returns:
--    nvarchar(400), NOT NULL (the join is INNER on a non-null FK, and Intervention.Name is NOT NULL).
DECLARE @ProposalEntityID UNIQUEIDENTIFIER = '4DBE953D-52CC-4515-91D2-45C522C0991C';

IF EXISTS (SELECT 1 FROM [${mjSchema}].[Entity] WHERE [ID] = @ProposalEntityID)
   AND NOT EXISTS (
        -- BY NAME, not by id: a codegen'd developer database already has this field under CodeGen's
        -- own minted id, and inserting ours as well would push it to fifteen and break the very
        -- thing this migration repairs.
        SELECT 1 FROM [${mjSchema}].[EntityField]
        WHERE [EntityID] = @ProposalEntityID AND [Name] = 'Intervention'
   )
BEGIN
    INSERT INTO [${mjSchema}].[EntityField] (
        [ID], [EntityID], [Sequence], [Name], [DisplayName], [Description],
        [Type], [Length], [AllowsNull], [IsPrimaryKey], [IsUnique],
        [IsVirtual], [DefaultInView], [AllowUpdateAPI], [AllowUpdateInView],
        [IncludeInUserSearchAPI], [IncludeInGeneratedForm], [IsNameField]
    )
    VALUES (
        '5044A100-002A-4000-8000-00000000002A', @ProposalEntityID,
        14, 'Intervention', 'Intervention',
        N'Denormalized display of the intervention this proposal belongs to (Intervention.Name), surfaced by vwInterventionProposals. Registered because the entity layer sizes its result table from this field list, so a column the view returns but the metadata omits breaks every write.',
        'nvarchar', 400,
        0,  -- AllowsNull: INNER JOIN on a non-null FK to a NOT NULL name column
        0, 0,
        1,  -- IsVirtual
        0,
        0,  -- AllowUpdateAPI: read-only
        0, 0, 0, 0
    );
END
GO
