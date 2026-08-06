-- =============================================================================
-- V202608041000__v0.5.x_Intervention_Outcome_Field_Fix.pg.sql
-- =============================================================================
-- PostgreSQL parity for migrations/V202608041000__v0.5.x_Intervention_Outcome_Field_Fix.sql.
--
-- Bring vwInterventionOutcomes and its entity metadata back into agreement, so writes to
-- MJ_BizApps_Sonar: Intervention Outcomes work on a fresh install AND on a developer database.
--
-- V202608011800 ships the view as a plain `SELECT i.*` (eight columns) and registers eight fields, so
-- those agree and a FRESH INSTALL WAS NEVER BROKEN. CodeGen's current output adds a denormalized FK
-- display column, InterventionAssignment.AnchorRecordID AS Assignment, via an INNER JOIN, so any
-- database where codegen has since run has a nine-column view against eight-column metadata. On SQL
-- Server that is fatal: the entity layer sizes its result table from the metadata field list and every
-- write dies on a column-count mismatch, silently, because OutcomeMeasurer ignored Save()'s boolean.
--
-- This aligns both on CodeGen's CURRENT shape (add the column and register the field) rather than
-- freezing the older one, which the next codegen run would just undo.
--
-- Sweeping that same invariant across every Sonar entity turned up a SECOND instance with the halves
-- swapped: Intervention Proposals ships a 14-column view but only 13 registered fields, so a fresh
-- install could not persist a drafted proposal either. Section 3 registers it. See the SQL Server
-- header for the full account.
--
-- Hand-authored rather than machine-converted: the automatic conversion mangles the SQL Server
-- DECLARE/IF form, and the EntityID differs anyway (see below).
-- =============================================================================

-- 1. The view, as CodeGen generates it today.
--
--    CREATE OR REPLACE is enough here because the change is purely ADDITIVE: the new column is
--    appended after the existing eight, which is exactly what PG permits a replace to do. That matters:
--    the usual escape hatch for a non-additive shape change is DROP ... CASCADE, and CASCADE would take
--    the spGet/spCreate/spUpdate functions that return SETOF this view with it. Nothing here recreates
--    those, so a replace that fails should fail loudly rather than fall back to dropping them.
CREATE OR REPLACE VIEW __mj_bizappssonar."vwInterventionOutcomes"
AS
SELECT
    i.*,
    mjBizAppsSonarInterventionAssignment_AssignmentID."AnchorRecordID" AS "Assignment"
FROM
    __mj_bizappssonar."InterventionOutcome" AS i
INNER JOIN
    __mj_bizappssonar."InterventionAssignment" AS mjBizAppsSonarInterventionAssignment_AssignmentID
  ON
    i."AssignmentID" = mjBizAppsSonarInterventionAssignment_AssignmentID."ID";

GRANT SELECT ON __mj_bizappssonar."vwInterventionOutcomes" TO "cdp_UI";
GRANT SELECT ON __mj_bizappssonar."vwInterventionOutcomes" TO "cdp_Developer";
GRANT SELECT ON __mj_bizappssonar."vwInterventionOutcomes" TO "cdp_Integration";

-- 2. The matching metadata field, so the entity layer's result shape is the same width as the view.
--
--    The EntityID is resolved BY NAME, not by the SQL Server id: PG registers Sonar entities under
--    different __mj.Entity IDs (this one is 5a22356c-… there, 58011143-… on SQL Server), which is the
--    standing PG divergence for this repo. The EntityField ID below is ours and hardcoded, so it stays
--    identical across both platforms.
INSERT INTO __mj."EntityField" (
    "ID", "EntityID", "Sequence", "Name", "DisplayName", "Description",
    "Type", "Length", "AllowsNull", "IsPrimaryKey", "IsUnique",
    "IsVirtual", "DefaultInView", "AllowUpdateAPI", "AllowUpdateInView",
    "IncludeInUserSearchAPI", "IncludeInGeneratedForm", "IsNameField",
    "__mj_CreatedAt", "__mj_UpdatedAt"
)
SELECT
    '5044a100-0029-4000-8000-000000000029'::uuid,
    e."ID",
    -- Sequence 9: the eight registered fields hold 1-8, and this is the ninth column the view returns.
    9,
    'Assignment',
    'Assignment',
    'Denormalized display of the assignment this outcome belongs to (InterventionAssignment.AnchorRecordID), surfaced by vwInterventionOutcomes. Registered because the entity layer sizes its result table from this field list, so a column the view returns but the metadata omits breaks every write.',
    'nvarchar',
    -- 900 bytes = 450 characters, matching InterventionAssignment.AnchorRecordID after the
    -- composite-anchor-key widening.
    900,
    true,   -- AllowsNull: MJ marks these nullable regardless of the join
    false, false,
    true,   -- IsVirtual: it lives in the view, not the table
    false,
    false,  -- AllowUpdateAPI: read-only; a write would have nowhere to go
    false, false, false, false,
    (NOW() AT TIME ZONE 'UTC'),
    (NOW() AT TIME ZONE 'UTC')
FROM __mj."Entity" e
WHERE e."Name" = 'MJ_BizApps_Sonar: Intervention Outcomes'
  AND NOT EXISTS (
      SELECT 1 FROM __mj."EntityField" f
      WHERE f."EntityID" = e."ID" AND f."Name" = 'Assignment'
  );

-- 3. Same bug, second entity: Intervention Proposals. Its view (V202608031000) already selects
--    Intervention.Name AS Intervention, so 14 columns, but only 13 fields were registered, so a fresh
--    install cannot write a proposal. Guarded BY NAME because a codegen'd database already holds this
--    field under CodeGen's own minted id, and adding ours as well would take it to fifteen.
INSERT INTO __mj."EntityField" (
    "ID", "EntityID", "Sequence", "Name", "DisplayName", "Description",
    "Type", "Length", "AllowsNull", "IsPrimaryKey", "IsUnique",
    "IsVirtual", "DefaultInView", "AllowUpdateAPI", "AllowUpdateInView",
    "IncludeInUserSearchAPI", "IncludeInGeneratedForm", "IsNameField",
    "__mj_CreatedAt", "__mj_UpdatedAt"
)
SELECT
    '5044a100-002a-4000-8000-00000000002a'::uuid,
    e."ID",
    14,
    'Intervention',
    'Intervention',
    'Denormalized display of the intervention this proposal belongs to (Intervention.Name), surfaced by vwInterventionProposals. Registered because the entity layer sizes its result table from this field list, so a column the view returns but the metadata omits breaks every write.',
    'nvarchar',
    400,
    false,  -- AllowsNull: INNER JOIN on a non-null FK to a NOT NULL name column
    false, false,
    true,   -- IsVirtual
    false,
    false,  -- AllowUpdateAPI: read-only
    false, false, false, false,
    (NOW() AT TIME ZONE 'UTC'),
    (NOW() AT TIME ZONE 'UTC')
FROM __mj."Entity" e
WHERE e."Name" = 'MJ_BizApps_Sonar: Intervention Proposals'
  AND NOT EXISTS (
      SELECT 1 FROM __mj."EntityField" f
      WHERE f."EntityID" = e."ID" AND f."Name" = 'Intervention'
  );
