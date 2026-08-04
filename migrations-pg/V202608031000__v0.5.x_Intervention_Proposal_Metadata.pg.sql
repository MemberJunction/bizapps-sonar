-- ============================================================================
-- MemberJunction PostgreSQL Migration
-- Converted from SQL Server using TypeScript conversion pipeline
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Schema
CREATE SCHEMA IF NOT EXISTS __mj_BizAppsSonar;
SET search_path TO __mj_BizAppsSonar, public;

-- Ensure backslashes in string literals are treated literally (not as escape sequences)
SET standard_conforming_strings = on;

-- NOTE: Earlier converter versions made INTEGER to BOOLEAN cast implicit by
-- modifying the system catalog so SS-style INSERT INTO bool_col VALUES (1)
-- would work. That modification required pg_catalog write privileges, which
-- managed PG (RDS, Aurora, Cloud SQL, Azure) does not grant. As of v5.30 all
-- bulk INSERTs are emitted with native TRUE/FALSE values directly, so the
-- cast modification is no longer needed. Removed to support managed-PG
-- installs out of the box.


-- ===================== DDL: Tables, PKs, Indexes =====================

ALTER TABLE __mj_BizAppsSonar."InterventionProposal"
 ADD COLUMN IF NOT EXISTS "__mj_CreatedAt" TIMESTAMPTZ NULL;

/* SQL text to add special date field __mj_UpdatedAt to entity __mj_BizAppsSonar.InterventionProposal */
ALTER TABLE __mj_BizAppsSonar."InterventionProposal"
 ADD COLUMN IF NOT EXISTS "__mj_UpdatedAt" TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS "IDX_AUTO_MJ_FKEY_InterventionProposal_InterventionID" ON __mj_BizAppsSonar."InterventionProposal" ("InterventionID");


-- ===================== Views =====================

DO $do$
DECLARE
  v_target_schema CONSTANT TEXT := '__mj_BizAppsSonar';
  v_target_name CONSTANT TEXT := 'vwInterventionProposals';
  vsql CONSTANT TEXT := $vsql$CREATE OR REPLACE VIEW __mj_BizAppsSonar."vwInterventionProposals"
AS SELECT
    i.*,
    mjBizAppsSonarIntervention_InterventionID."Name" AS "Intervention"
FROM
    __mj_BizAppsSonar."InterventionProposal" AS i
INNER JOIN
    __mj_BizAppsSonar."Intervention" AS "mjBizAppsSonarIntervention_InterventionID"
  ON
    i."InterventionID" = mjBizAppsSonarIntervention_InterventionID."ID"$vsql$;
  v_target_oid OID;
  v_dep RECORD;
  v_captured JSONB[] := ARRAY[]::JSONB[];
  v_n INTEGER;
BEGIN
  EXECUTE vsql;
EXCEPTION WHEN invalid_table_definition THEN
  -- Column list changed; need CASCADE. Preserve dependent views first.
  SELECT c.oid INTO v_target_oid
  FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = v_target_schema AND c.relname = v_target_name AND c.relkind = 'v';
  IF v_target_oid IS NOT NULL THEN
    FOR v_dep IN
      WITH RECURSIVE deps AS (
        SELECT c.oid, c.relname AS name, n.nspname AS schema, 1 AS depth
        FROM pg_rewrite r
        JOIN pg_depend d ON d.objid = r.oid
        JOIN pg_class c ON c.oid = r.ev_class
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE d.refobjid = v_target_oid AND d.deptype = 'n'
          AND c.oid <> v_target_oid AND c.relkind = 'v'
        UNION
        SELECT c.oid, c.relname, n.nspname, p.depth + 1
        FROM deps p
        JOIN pg_rewrite r ON TRUE
        JOIN pg_depend d ON d.objid = r.oid AND d.refobjid = p.oid
        JOIN pg_class c ON c.oid = r.ev_class
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE c.relkind = 'v' AND c.oid <> p.oid
      )
      SELECT oid, name, schema, MAX(depth) AS max_depth,
             pg_catalog.pg_get_viewdef(oid, true) AS viewdef
      FROM deps GROUP BY oid, name, schema
      ORDER BY MAX(depth) ASC
    LOOP
      v_captured := v_captured || jsonb_build_object(
        'schema', v_dep.schema, 'name', v_dep.name, 'def', v_dep.viewdef);
    END LOOP;
  END IF;
  EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', v_target_schema, v_target_name);
  EXECUTE vsql;
  IF v_captured IS NOT NULL AND array_length(v_captured, 1) > 0 THEN
    FOR v_n IN 1..array_length(v_captured, 1) LOOP
      BEGIN
        EXECUTE format('CREATE VIEW %I.%I AS %s',
          v_captured[v_n]->>'schema', v_captured[v_n]->>'name', v_captured[v_n]->>'def');
      EXCEPTION WHEN others THEN
        RAISE WARNING 'Could not restore dependent view %.%: %',
          v_captured[v_n]->>'schema', v_captured[v_n]->>'name', SQLERRM;
      END;
    END LOOP;
  END IF;
END;
$do$;


-- ===================== Stored Procedures (sp*) =====================

-- SKIPPED: procedure (auto-conversion not supported)
-- CREATE PROCEDURE [__mj_BizAppsSonar].[spCreateInterventionProposal]
--     @ID UUID = NULL,
--     @InterventionID UUID,
--     @AnchorRecordID VARCHAR(450),
--     @AnchorName_Clear bit ...

-- SKIPPED: procedure (auto-conversion not supported)
-- CREATE PROCEDURE [__mj_BizAppsSonar].[spUpdateInterventionProposal]
--     @ID UUID,
--     @InterventionID UUID = NULL,
--     @AnchorRecordID VARCHAR(450) = NULL,
--     @AnchorName_Cle...

-- SKIPPED: procedure (auto-conversion not supported)
-- CREATE PROCEDURE [__mj_BizAppsSonar].[spDeleteInterventionProposal]
--     @ID UUID
-- AS
-- BEGIN
--     SET NOCOUNT ON;
-- 
--     DELETE FROM
--         [__mj_BizAppsSonar].[InterventionProposal]
--     WHERE
-- ...


-- ===================== Triggers =====================

-- SKIPPED: trigger (auto-conversion not supported)
-- CREATE TRIGGER [__mj_BizAppsSonar].trgUpdateInterventionProposal
ON "__mj_BizAppsSonar"."InterventionProposal"
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE
        "__mj_BizAppsSonar".[Interve


-- ===================== Data (INSERT/UPDATE/DELETE) =====================

INSERT INTO "${mjSchema}"."Entity" (
         "ID",
         "Name",
         "DisplayName",
         "Description",
         "NameSuffix",
         "BaseTable",
         "BaseView",
         "SchemaName",
         "IncludeInAPI",
         "AllowUserSearchAPI",
         "AllowCaching"
         , "TrackRecordChanges"
         , "AuditRecordAccess"
         , "AuditViewRuns"
         , "AllowAllRowsAPI"
         , "AllowCreateAPI"
         , "AllowUpdateAPI"
         , "AllowDeleteAPI"
         , "UserViewMaxRows"
         , "__mj_CreatedAt"
         , "__mj_UpdatedAt"
      )
      VALUES (
         '4dbe953d-52cc-4515-91d2-45c522c0991c',
         'MJ_BizApps_Sonar: Intervention Proposals',
         'Intervention Proposals',
         'A concrete per-member action a play prepared for human review (e.g. a drafted outreach email) — proposal type + payload are data, so new play types need no schema change.',
         NULL,
         'InterventionProposal',
         'vwInterventionProposals',
         '__mj_BizAppsSonar',
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
         , NOW()
         , NOW()
      );

/* SQL generated to add new entity MJ_BizApps_Sonar: Intervention Proposals to application ID: '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285' */

INSERT INTO "${mjSchema}"."ApplicationEntity"
                                       ("ApplicationID", "EntityID", "Sequence", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES
                                       ('4F9477FB-BC8B-4CA9-A4FE-C0FB45496285', '4dbe953d-52cc-4515-91d2-45c522c0991c', (SELECT COALESCE(MAX("Sequence"),0)+1 FROM "${mjSchema}"."ApplicationEntity" WHERE "ApplicationID" = '4F9477FB-BC8B-4CA9-A4FE-C0FB45496285'), NOW(), NOW());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Intervention Proposals for role UI */

INSERT INTO "${mjSchema}"."EntityPermission"
                                                   ("EntityID", "RoleID", "CanRead", "CanCreate", "CanUpdate", "CanDelete", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES
                                                   ('4dbe953d-52cc-4515-91d2-45c522c0991c', 'E0AFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 0, 0, 0, NOW(), NOW());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Intervention Proposals for role Developer */

INSERT INTO "${mjSchema}"."EntityPermission"
                                                   ("EntityID", "RoleID", "CanRead", "CanCreate", "CanUpdate", "CanDelete", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES
                                                   ('4dbe953d-52cc-4515-91d2-45c522c0991c', 'DEAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, NOW(), NOW());

/* SQL generated to add new permission for entity MJ_BizApps_Sonar: Intervention Proposals for role Integration */

INSERT INTO "${mjSchema}"."EntityPermission"
                                                   ("EntityID", "RoleID", "CanRead", "CanCreate", "CanUpdate", "CanDelete", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES
                                                   ('4dbe953d-52cc-4515-91d2-45c522c0991c', 'DFAFCCEC-6A37-EF11-86D4-000D3A4E707E', 1, 1, 1, 1, NOW(), NOW());

/* SQL text to update existing entities from schema */

/* SQL text to add special date field __mj_CreatedAt to entity __mj_BizAppsSonar."InterventionProposal" */
UPDATE "__mj_BizAppsSonar"."InterventionProposal" SET "__mj_CreatedAt" = NOW() WHERE "__mj_CreatedAt" IS NULL;

/* SQL text to add special date field __mj_CreatedAt to entity __mj_BizAppsSonar.InterventionProposal */
ALTER TABLE __mj_BizAppsSonar."InterventionProposal" ALTER COLUMN "__mj_CreatedAt" SET NOT NULL;

ALTER TABLE __mj_BizAppsSonar."InterventionProposal"
  ALTER COLUMN "__mj_CreatedAt" SET DEFAULT NOW();

/* SQL text to add special date field __mj_UpdatedAt to entity __mj_BizAppsSonar."InterventionProposal" */
UPDATE "__mj_BizAppsSonar"."InterventionProposal" SET "__mj_UpdatedAt" = NOW() WHERE "__mj_UpdatedAt" IS NULL;

/* SQL text to add special date field __mj_UpdatedAt to entity __mj_BizAppsSonar.InterventionProposal */
ALTER TABLE __mj_BizAppsSonar."InterventionProposal" ALTER COLUMN "__mj_UpdatedAt" SET NOT NULL;

ALTER TABLE __mj_BizAppsSonar."InterventionProposal"
  ALTER COLUMN "__mj_UpdatedAt" SET DEFAULT NOW();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "${mjSchema}"."EntityField" WHERE "ID" = 'd28cbe22-c8f9-4723-8788-75efa0fccb9a' OR ("EntityID" = '4DBE953D-52CC-4515-91D2-45C522C0991C' AND "Name" = 'ID')
    ) THEN
        INSERT INTO "${mjSchema}"."EntityField"
        (
        "ID",
        "EntityID",
        "Sequence",
        "Name",
        "DisplayName",
        "Description",
        "Type",
        "Length",
        "Precision",
        "Scale",
        "AllowsNull",
        "DefaultValue",
        "AutoIncrement",
        "AllowUpdateAPI",
        "IsVirtual",
        "IsComputed",
        "RelatedEntityID",
        "RelatedEntityFieldName",
        "IsNameField",
        "IncludeInUserSearchAPI",
        "IncludeRelatedEntityNameFieldInBaseView",
        "DefaultInView",
        "IsPrimaryKey",
        "IsUnique",
        "RelatedEntityDisplayType",
        "__mj_CreatedAt",
        "__mj_UpdatedAt"
        )
        VALUES
        (
        'd28cbe22-c8f9-4723-8788-75efa0fccb9a',
        '4DBE953D-52CC-4515-91D2-45C522C0991C', -- "Entity": "MJ_BizApps_Sonar": "Intervention" "Proposals"
        100001,
        'ID',
        'ID',
        NULL,
        'UUID',
        16,
        0,
        0,
        0,
        'gen_random_uuid()',
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
        NOW(),
        NOW()
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "${mjSchema}"."EntityField" WHERE "ID" = '826f2a6b-30a5-4da3-ae21-1d8ea996695f' OR ("EntityID" = '4DBE953D-52CC-4515-91D2-45C522C0991C' AND "Name" = 'InterventionID')
    ) THEN
        INSERT INTO "${mjSchema}"."EntityField"
        (
        "ID",
        "EntityID",
        "Sequence",
        "Name",
        "DisplayName",
        "Description",
        "Type",
        "Length",
        "Precision",
        "Scale",
        "AllowsNull",
        "DefaultValue",
        "AutoIncrement",
        "AllowUpdateAPI",
        "IsVirtual",
        "IsComputed",
        "RelatedEntityID",
        "RelatedEntityFieldName",
        "IsNameField",
        "IncludeInUserSearchAPI",
        "IncludeRelatedEntityNameFieldInBaseView",
        "DefaultInView",
        "IsPrimaryKey",
        "IsUnique",
        "RelatedEntityDisplayType",
        "__mj_CreatedAt",
        "__mj_UpdatedAt"
        )
        VALUES
        (
        '826f2a6b-30a5-4da3-ae21-1d8ea996695f',
        '4DBE953D-52CC-4515-91D2-45C522C0991C', -- "Entity": "MJ_BizApps_Sonar": "Intervention" "Proposals"
        100002,
        'InterventionID',
        'Intervention ID',
        NULL,
        'UUID',
        16,
        0,
        0,
        0,
        NULL,
        0,
        1,
        0,
        0,
        '2140617E-A375-41F2-8DD5-346E7555EC04',
        'ID',
        0,
        0,
        1,
        0,
        0,
        1,
        'Search',
        NOW(),
        NOW()
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "${mjSchema}"."EntityField" WHERE "ID" = 'af4e204f-f8c9-4d76-b346-141d04786c4a' OR ("EntityID" = '4DBE953D-52CC-4515-91D2-45C522C0991C' AND "Name" = 'AnchorRecordID')
    ) THEN
        INSERT INTO "${mjSchema}"."EntityField"
        (
        "ID",
        "EntityID",
        "Sequence",
        "Name",
        "DisplayName",
        "Description",
        "Type",
        "Length",
        "Precision",
        "Scale",
        "AllowsNull",
        "DefaultValue",
        "AutoIncrement",
        "AllowUpdateAPI",
        "IsVirtual",
        "IsComputed",
        "RelatedEntityID",
        "RelatedEntityFieldName",
        "IsNameField",
        "IncludeInUserSearchAPI",
        "IncludeRelatedEntityNameFieldInBaseView",
        "DefaultInView",
        "IsPrimaryKey",
        "IsUnique",
        "RelatedEntityDisplayType",
        "__mj_CreatedAt",
        "__mj_UpdatedAt"
        )
        VALUES
        (
        'af4e204f-f8c9-4d76-b346-141d04786c4a',
        '4DBE953D-52CC-4515-91D2-45C522C0991C', -- "Entity": "MJ_BizApps_Sonar": "Intervention" "Proposals"
        100003,
        'AnchorRecordID',
        'Anchor Record ID',
        'Canonical id of the anchor record this proposal is for (matches Score.AnchorRecordID).',
        'TEXT',
        900,
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
        NOW(),
        NOW()
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "${mjSchema}"."EntityField" WHERE "ID" = '42302142-624e-49a8-ad56-bb9ad09bdd28' OR ("EntityID" = '4DBE953D-52CC-4515-91D2-45C522C0991C' AND "Name" = 'AnchorName')
    ) THEN
        INSERT INTO "${mjSchema}"."EntityField"
        (
        "ID",
        "EntityID",
        "Sequence",
        "Name",
        "DisplayName",
        "Description",
        "Type",
        "Length",
        "Precision",
        "Scale",
        "AllowsNull",
        "DefaultValue",
        "AutoIncrement",
        "AllowUpdateAPI",
        "IsVirtual",
        "IsComputed",
        "RelatedEntityID",
        "RelatedEntityFieldName",
        "IsNameField",
        "IncludeInUserSearchAPI",
        "IncludeRelatedEntityNameFieldInBaseView",
        "DefaultInView",
        "IsPrimaryKey",
        "IsUnique",
        "RelatedEntityDisplayType",
        "__mj_CreatedAt",
        "__mj_UpdatedAt"
        )
        VALUES
        (
        '42302142-624e-49a8-ad56-bb9ad09bdd28',
        '4DBE953D-52CC-4515-91D2-45C522C0991C', -- "Entity": "MJ_BizApps_Sonar": "Intervention" "Proposals"
        100004,
        'AnchorName',
        'Anchor Name',
        'Display name of the member at draft time (denormalized so the review queue never re-resolves anchors).',
        'TEXT',
        600,
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
        NOW(),
        NOW()
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "${mjSchema}"."EntityField" WHERE "ID" = 'c929cdb0-ed6a-49ce-b4b7-fed24a133007' OR ("EntityID" = '4DBE953D-52CC-4515-91D2-45C522C0991C' AND "Name" = 'ProposalType')
    ) THEN
        INSERT INTO "${mjSchema}"."EntityField"
        (
        "ID",
        "EntityID",
        "Sequence",
        "Name",
        "DisplayName",
        "Description",
        "Type",
        "Length",
        "Precision",
        "Scale",
        "AllowsNull",
        "DefaultValue",
        "AutoIncrement",
        "AllowUpdateAPI",
        "IsVirtual",
        "IsComputed",
        "RelatedEntityID",
        "RelatedEntityFieldName",
        "IsNameField",
        "IncludeInUserSearchAPI",
        "IncludeRelatedEntityNameFieldInBaseView",
        "DefaultInView",
        "IsPrimaryKey",
        "IsUnique",
        "RelatedEntityDisplayType",
        "__mj_CreatedAt",
        "__mj_UpdatedAt"
        )
        VALUES
        (
        'c929cdb0-ed6a-49ce-b4b7-fed24a133007',
        '4DBE953D-52CC-4515-91D2-45C522C0991C', -- "Entity": "MJ_BizApps_Sonar": "Intervention" "Proposals"
        100005,
        'ProposalType',
        'Proposal Type',
        'What kind of action is proposed (e.g. EmailDraft). Determines how PayloadJSON is shaped and rendered; an open set — new plays add new types.',
        'TEXT',
        60,
        0,
        0,
        0,
        'EmailDraft',
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
        NOW(),
        NOW()
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "${mjSchema}"."EntityField" WHERE "ID" = 'ac151076-fe5d-4c66-bede-cc9c0bcb4d77' OR ("EntityID" = '4DBE953D-52CC-4515-91D2-45C522C0991C' AND "Name" = 'Rationale')
    ) THEN
        INSERT INTO "${mjSchema}"."EntityField"
        (
        "ID",
        "EntityID",
        "Sequence",
        "Name",
        "DisplayName",
        "Description",
        "Type",
        "Length",
        "Precision",
        "Scale",
        "AllowsNull",
        "DefaultValue",
        "AutoIncrement",
        "AllowUpdateAPI",
        "IsVirtual",
        "IsComputed",
        "RelatedEntityID",
        "RelatedEntityFieldName",
        "IsNameField",
        "IncludeInUserSearchAPI",
        "IncludeRelatedEntityNameFieldInBaseView",
        "DefaultInView",
        "IsPrimaryKey",
        "IsUnique",
        "RelatedEntityDisplayType",
        "__mj_CreatedAt",
        "__mj_UpdatedAt"
        )
        VALUES
        (
        'ac151076-fe5d-4c66-bede-cc9c0bcb4d77',
        '4DBE953D-52CC-4515-91D2-45C522C0991C', -- "Entity": "MJ_BizApps_Sonar": "Intervention" "Proposals"
        100006,
        'Rationale',
        'Rationale',
        'One-line human-readable reason this member got this proposal (shown on the review queue card).',
        'TEXT',
        2000,
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
        NOW(),
        NOW()
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "${mjSchema}"."EntityField" WHERE "ID" = 'b19ebe7e-1200-49c3-b3b1-df612ec0fa90' OR ("EntityID" = '4DBE953D-52CC-4515-91D2-45C522C0991C' AND "Name" = 'PayloadJSON')
    ) THEN
        INSERT INTO "${mjSchema}"."EntityField"
        (
        "ID",
        "EntityID",
        "Sequence",
        "Name",
        "DisplayName",
        "Description",
        "Type",
        "Length",
        "Precision",
        "Scale",
        "AllowsNull",
        "DefaultValue",
        "AutoIncrement",
        "AllowUpdateAPI",
        "IsVirtual",
        "IsComputed",
        "RelatedEntityID",
        "RelatedEntityFieldName",
        "IsNameField",
        "IncludeInUserSearchAPI",
        "IncludeRelatedEntityNameFieldInBaseView",
        "DefaultInView",
        "IsPrimaryKey",
        "IsUnique",
        "RelatedEntityDisplayType",
        "__mj_CreatedAt",
        "__mj_UpdatedAt"
        )
        VALUES
        (
        'b19ebe7e-1200-49c3-b3b1-df612ec0fa90',
        '4DBE953D-52CC-4515-91D2-45C522C0991C', -- "Entity": "MJ_BizApps_Sonar": "Intervention" "Proposals"
        100007,
        'PayloadJSON',
        'Payload JSON',
        'The proposal content, shaped per ProposalType (EmailDraft: {subject, body, recipientEmail}).',
        'TEXT',
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
        NOW(),
        NOW()
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "${mjSchema}"."EntityField" WHERE "ID" = '7237e1e6-51c5-45d6-af91-312b6a1da97e' OR ("EntityID" = '4DBE953D-52CC-4515-91D2-45C522C0991C' AND "Name" = 'GroundingJSON')
    ) THEN
        INSERT INTO "${mjSchema}"."EntityField"
        (
        "ID",
        "EntityID",
        "Sequence",
        "Name",
        "DisplayName",
        "Description",
        "Type",
        "Length",
        "Precision",
        "Scale",
        "AllowsNull",
        "DefaultValue",
        "AutoIncrement",
        "AllowUpdateAPI",
        "IsVirtual",
        "IsComputed",
        "RelatedEntityID",
        "RelatedEntityFieldName",
        "IsNameField",
        "IncludeInUserSearchAPI",
        "IncludeRelatedEntityNameFieldInBaseView",
        "DefaultInView",
        "IsPrimaryKey",
        "IsUnique",
        "RelatedEntityDisplayType",
        "__mj_CreatedAt",
        "__mj_UpdatedAt"
        )
        VALUES
        (
        '7237e1e6-51c5-45d6-af91-312b6a1da97e',
        '4DBE953D-52CC-4515-91D2-45C522C0991C', -- "Entity": "MJ_BizApps_Sonar": "Intervention" "Proposals"
        100008,
        'GroundingJSON',
        'Grounding JSON',
        'The score facts the proposal was grounded in ({score, bandName, delta, dominantCause, factors[]}) — the audit trail for "why this member".',
        'TEXT',
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
        NOW(),
        NOW()
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "${mjSchema}"."EntityField" WHERE "ID" = '7e993438-3bf0-4585-bb13-2220c61eb20a' OR ("EntityID" = '4DBE953D-52CC-4515-91D2-45C522C0991C' AND "Name" = 'Status')
    ) THEN
        INSERT INTO "${mjSchema}"."EntityField"
        (
        "ID",
        "EntityID",
        "Sequence",
        "Name",
        "DisplayName",
        "Description",
        "Type",
        "Length",
        "Precision",
        "Scale",
        "AllowsNull",
        "DefaultValue",
        "AutoIncrement",
        "AllowUpdateAPI",
        "IsVirtual",
        "IsComputed",
        "RelatedEntityID",
        "RelatedEntityFieldName",
        "IsNameField",
        "IncludeInUserSearchAPI",
        "IncludeRelatedEntityNameFieldInBaseView",
        "DefaultInView",
        "IsPrimaryKey",
        "IsUnique",
        "RelatedEntityDisplayType",
        "__mj_CreatedAt",
        "__mj_UpdatedAt"
        )
        VALUES
        (
        '7e993438-3bf0-4585-bb13-2220c61eb20a',
        '4DBE953D-52CC-4515-91D2-45C522C0991C', -- "Entity": "MJ_BizApps_Sonar": "Intervention" "Proposals"
        100009,
        'Status',
        'Status',
        'Review lifecycle: Proposed (awaiting review), Approved, Rejected, or Executed (carried out — for the PoC, a simulated send).',
        'TEXT',
        32,
        0,
        0,
        0,
        'Proposed',
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
        NOW(),
        NOW()
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "${mjSchema}"."EntityField" WHERE "ID" = '1e1fb41e-1ed4-4852-bae7-2f92028d050b' OR ("EntityID" = '4DBE953D-52CC-4515-91D2-45C522C0991C' AND "Name" = 'ReviewedAt')
    ) THEN
        INSERT INTO "${mjSchema}"."EntityField"
        (
        "ID",
        "EntityID",
        "Sequence",
        "Name",
        "DisplayName",
        "Description",
        "Type",
        "Length",
        "Precision",
        "Scale",
        "AllowsNull",
        "DefaultValue",
        "AutoIncrement",
        "AllowUpdateAPI",
        "IsVirtual",
        "IsComputed",
        "RelatedEntityID",
        "RelatedEntityFieldName",
        "IsNameField",
        "IncludeInUserSearchAPI",
        "IncludeRelatedEntityNameFieldInBaseView",
        "DefaultInView",
        "IsPrimaryKey",
        "IsUnique",
        "RelatedEntityDisplayType",
        "__mj_CreatedAt",
        "__mj_UpdatedAt"
        )
        VALUES
        (
        '1e1fb41e-1ed4-4852-bae7-2f92028d050b',
        '4DBE953D-52CC-4515-91D2-45C522C0991C', -- "Entity": "MJ_BizApps_Sonar": "Intervention" "Proposals"
        100010,
        'ReviewedAt',
        'Reviewed At',
        'When a human approved or rejected the proposal.',
        'TIMESTAMPTZ',
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
        NOW(),
        NOW()
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "${mjSchema}"."EntityField" WHERE "ID" = '987cf28e-3f79-4cb4-9739-b8b9de6e9286' OR ("EntityID" = '4DBE953D-52CC-4515-91D2-45C522C0991C' AND "Name" = 'ExecutedAt')
    ) THEN
        INSERT INTO "${mjSchema}"."EntityField"
        (
        "ID",
        "EntityID",
        "Sequence",
        "Name",
        "DisplayName",
        "Description",
        "Type",
        "Length",
        "Precision",
        "Scale",
        "AllowsNull",
        "DefaultValue",
        "AutoIncrement",
        "AllowUpdateAPI",
        "IsVirtual",
        "IsComputed",
        "RelatedEntityID",
        "RelatedEntityFieldName",
        "IsNameField",
        "IncludeInUserSearchAPI",
        "IncludeRelatedEntityNameFieldInBaseView",
        "DefaultInView",
        "IsPrimaryKey",
        "IsUnique",
        "RelatedEntityDisplayType",
        "__mj_CreatedAt",
        "__mj_UpdatedAt"
        )
        VALUES
        (
        '987cf28e-3f79-4cb4-9739-b8b9de6e9286',
        '4DBE953D-52CC-4515-91D2-45C522C0991C', -- "Entity": "MJ_BizApps_Sonar": "Intervention" "Proposals"
        100011,
        'ExecutedAt',
        'Executed At',
        'When the approved proposal was executed (PoC: the simulated send).',
        'TIMESTAMPTZ',
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
        NOW(),
        NOW()
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "${mjSchema}"."EntityField" WHERE "ID" = 'c534a487-0ae2-4788-a2a1-389b0c6b1b04' OR ("EntityID" = '4DBE953D-52CC-4515-91D2-45C522C0991C' AND "Name" = '__mj_CreatedAt')
    ) THEN
        INSERT INTO "${mjSchema}"."EntityField"
        (
        "ID",
        "EntityID",
        "Sequence",
        "Name",
        "DisplayName",
        "Description",
        "Type",
        "Length",
        "Precision",
        "Scale",
        "AllowsNull",
        "DefaultValue",
        "AutoIncrement",
        "AllowUpdateAPI",
        "IsVirtual",
        "IsComputed",
        "RelatedEntityID",
        "RelatedEntityFieldName",
        "IsNameField",
        "IncludeInUserSearchAPI",
        "IncludeRelatedEntityNameFieldInBaseView",
        "DefaultInView",
        "IsPrimaryKey",
        "IsUnique",
        "RelatedEntityDisplayType",
        "__mj_CreatedAt",
        "__mj_UpdatedAt"
        )
        VALUES
        (
        'c534a487-0ae2-4788-a2a1-389b0c6b1b04',
        '4DBE953D-52CC-4515-91D2-45C522C0991C', -- "Entity": "MJ_BizApps_Sonar": "Intervention" "Proposals"
        100012,
        '__mj_CreatedAt',
        'Created At',
        NULL,
        'TIMESTAMPTZ',
        10,
        34,
        7,
        0,
        'NOW()',
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
        NOW(),
        NOW()
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "${mjSchema}"."EntityField" WHERE "ID" = 'b1d87d5e-b6be-4290-b57f-b19db1553e7b' OR ("EntityID" = '4DBE953D-52CC-4515-91D2-45C522C0991C' AND "Name" = '__mj_UpdatedAt')
    ) THEN
        INSERT INTO "${mjSchema}"."EntityField"
        (
        "ID",
        "EntityID",
        "Sequence",
        "Name",
        "DisplayName",
        "Description",
        "Type",
        "Length",
        "Precision",
        "Scale",
        "AllowsNull",
        "DefaultValue",
        "AutoIncrement",
        "AllowUpdateAPI",
        "IsVirtual",
        "IsComputed",
        "RelatedEntityID",
        "RelatedEntityFieldName",
        "IsNameField",
        "IncludeInUserSearchAPI",
        "IncludeRelatedEntityNameFieldInBaseView",
        "DefaultInView",
        "IsPrimaryKey",
        "IsUnique",
        "RelatedEntityDisplayType",
        "__mj_CreatedAt",
        "__mj_UpdatedAt"
        )
        VALUES
        (
        'b1d87d5e-b6be-4290-b57f-b19db1553e7b',
        '4DBE953D-52CC-4515-91D2-45C522C0991C', -- "Entity": "MJ_BizApps_Sonar": "Intervention" "Proposals"
        100013,
        '__mj_UpdatedAt',
        'Updated At',
        NULL,
        'TIMESTAMPTZ',
        10,
        34,
        7,
        0,
        'NOW()',
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
        NOW(),
        NOW()
        );
    END IF;
END $$;

INSERT INTO "${mjSchema}"."EntityFieldValue"
                                       ("ID", "EntityFieldID", "Sequence", "Value", "Code", "__mj_CreatedAt", "__mj_UpdatedAt")
                                    VALUES
                                       ('e0dd19b0-2b2a-42b5-a52f-b6ae254ccdc3', '7E993438-3BF0-4585-BB13-2220C61EB20A', 1, 'Approved', 'Approved', NOW(), NOW());

/* SQL text to insert entity field value with ID e5ab0371-612d-47ee-a37f-182c132333a4 */

INSERT INTO "${mjSchema}"."EntityFieldValue"
                                       ("ID", "EntityFieldID", "Sequence", "Value", "Code", "__mj_CreatedAt", "__mj_UpdatedAt")
                                    VALUES
                                       ('e5ab0371-612d-47ee-a37f-182c132333a4', '7E993438-3BF0-4585-BB13-2220C61EB20A', 2, 'Executed', 'Executed', NOW(), NOW());

/* SQL text to insert entity field value with ID ee033a8f-159c-43b9-9e8d-3834710a0db2 */

INSERT INTO "${mjSchema}"."EntityFieldValue"
                                       ("ID", "EntityFieldID", "Sequence", "Value", "Code", "__mj_CreatedAt", "__mj_UpdatedAt")
                                    VALUES
                                       ('ee033a8f-159c-43b9-9e8d-3834710a0db2', '7E993438-3BF0-4585-BB13-2220C61EB20A', 3, 'Proposed', 'Proposed', NOW(), NOW());

/* SQL text to insert entity field value with ID 3b9d468b-279c-487a-84d0-d51d09cf85db */

INSERT INTO "${mjSchema}"."EntityFieldValue"
                                       ("ID", "EntityFieldID", "Sequence", "Value", "Code", "__mj_CreatedAt", "__mj_UpdatedAt")
                                    VALUES
                                       ('3b9d468b-279c-487a-84d0-d51d09cf85db', '7E993438-3BF0-4585-BB13-2220C61EB20A', 4, 'Rejected', 'Rejected', NOW(), NOW());

/* SQL text to update ValueListType for entity field ID 7E993438-3BF0-4585-BB13-2220C61EB20A */

UPDATE "${mjSchema}"."EntityField" SET "ValueListType"='List' WHERE "ID"='7E993438-3BF0-4585-BB13-2220C61EB20A';


/* Create Entity Relationship: MJ_BizApps_Sonar: Interventions -> MJ_BizApps_Sonar: Intervention Proposals (One To Many via InterventionID) */

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "${mjSchema}"."EntityRelationship" WHERE "ID" = '537aaa0a-83fb-42d2-922e-1eddf458cf05'
    ) THEN
        INSERT INTO "${mjSchema}"."EntityRelationship" ("ID", "EntityID", "RelatedEntityID", "RelatedEntityJoinField", "Type", "BundleInAPI", "DisplayInForm", "Sequence", "__mj_CreatedAt", "__mj_UpdatedAt")
        VALUES ('537aaa0a-83fb-42d2-922e-1eddf458cf05', '2140617E-A375-41F2-8DD5-346E7555EC04', '4DBE953D-52CC-4515-91D2-45C522C0991C', 'InterventionID', 'One To Many', 1, 1, 2, NOW(), NOW());
    END IF;
END $$;


-- ===================== Grants =====================

DO $$ BEGIN GRANT SELECT ON __mj_BizAppsSonar."vwInterventionProposals" TO "cdp_UI", "cdp_Developer", "cdp_Integration"; EXCEPTION WHEN others THEN NULL; END $$;
/* Base View Permissions SQL for MJ_BizApps_Sonar: Intervention Proposals */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Intervention Proposals
-- Item: Permissions for vwInterventionProposals
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------;

DO $$ BEGIN GRANT SELECT ON __mj_BizAppsSonar."vwInterventionProposals" TO "cdp_UI", "cdp_Developer", "cdp_Integration"; EXCEPTION WHEN others THEN NULL; END $$;
/* spCreate SQL for MJ_BizApps_Sonar: Intervention Proposals */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Intervention Proposals
-- Item: spCreateInterventionProposal
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- CREATE PROCEDURE FOR InterventionProposal
------------------------------------------------------------;

DO $$ BEGIN GRANT EXECUTE ON FUNCTION __mj_BizAppsSonar."spCreateInterventionProposal" TO "cdp_Developer", "cdp_Integration"; EXCEPTION WHEN others THEN NULL; END $$;
/* spCreate Permissions for MJ_BizApps_Sonar: Intervention Proposals */

DO $$ BEGIN GRANT EXECUTE ON FUNCTION __mj_BizAppsSonar."spCreateInterventionProposal" TO "cdp_Developer", "cdp_Integration"; EXCEPTION WHEN others THEN NULL; END $$;
/* spUpdate SQL for MJ_BizApps_Sonar: Intervention Proposals */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Intervention Proposals
-- Item: spUpdateInterventionProposal
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- UPDATE PROCEDURE FOR InterventionProposal
------------------------------------------------------------;

DO $$ BEGIN GRANT EXECUTE ON FUNCTION __mj_BizAppsSonar."spUpdateInterventionProposal" TO "cdp_Developer", "cdp_Integration"; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN GRANT EXECUTE ON FUNCTION __mj_BizAppsSonar."spUpdateInterventionProposal" TO "cdp_Developer", "cdp_Integration"; EXCEPTION WHEN others THEN NULL; END $$;
/* spDelete SQL for MJ_BizApps_Sonar: Intervention Proposals */
-----------------------------------------------------------------
-- SQL Code Generation
-- Entity: MJ_BizApps_Sonar: Intervention Proposals
-- Item: spDeleteInterventionProposal
--
-- This was generated by the MemberJunction CodeGen tool.
-- This file should NOT be edited by hand.
-----------------------------------------------------------------

------------------------------------------------------------
----- DELETE PROCEDURE FOR InterventionProposal
------------------------------------------------------------;

DO $$ BEGIN GRANT EXECUTE ON FUNCTION __mj_BizAppsSonar."spDeleteInterventionProposal" TO "cdp_Developer", "cdp_Integration"; EXCEPTION WHEN others THEN NULL; END $$;
/* spDelete Permissions for MJ_BizApps_Sonar: Intervention Proposals */

DO $$ BEGIN GRANT EXECUTE ON FUNCTION __mj_BizAppsSonar."spDeleteInterventionProposal" TO "cdp_Developer", "cdp_Integration"; EXCEPTION WHEN others THEN NULL; END $$;
-- ===================== Other =====================

-- =============================================================================
-- V202608031000__v0.5.x_Intervention_Proposal_Metadata.sql
-- =============================================================================
-- CODEGEN OUTPUT (auto-generated by `mj codegen`; do NOT hand-edit)
--
-- Folded in per the bizapps migration convention (see SECTION 5 of
-- V202606121005__v0.1.x_Initial_Schema.sql), the same way V202608011800 did it for the four
-- intervention-layer entities. Regenerate via `mj codegen`; do not edit here.
--
-- WHY THIS EXISTS: V202608021000 CREATED the InterventionProposal table but never registered it
-- with MJ. `mj app install` runs migrations ONLY, so on a fresh install the table existed with no
-- Entity/EntityField rows, no vwInterventionProposals view and no spCreate/spUpdate/spDelete
-- procedures. The entity layer had nothing to call, which means the Outreach approval tab — the
-- whole point of the draft-outreach slice — could not read or write a single proposal.
--
-- It worked on developer machines only because each of us had run `mj codegen` locally, which
-- quietly wrote that metadata into our own dev DBs. That is precisely the trap V202608011800
-- documents for the intervention-layer entities; this is the same gap, one entity later.
--
-- SCOPE: extracted from the CodeGen run that produced this metadata, restricted to the
-- Intervention Proposals sections. The same run also re-emitted vwInterventionOutcomes and the
-- Outcome CRUD procedures, which are deliberately EXCLUDED: V202608011800 already owns those, and
-- it records an intentional gap in them (the denormalized InterventionOutcome.Assignment display
-- column). Re-applying codegen's version here would silently overwrite that decision.
--
-- Every statement is guarded (IF NOT EXISTS for metadata rows, IF OBJECT_ID ... DROP for the view
-- and procedures), so this is safe to replay on a database that already has the objects.
-- =============================================================================

/* SQL generated to create new entity MJ_BizApps_Sonar: Intervention Proposals */

/* SQL text to insert 13 new entity field(s) */

/* spUpdate Permissions for MJ_BizApps_Sonar: Intervention Proposals */
