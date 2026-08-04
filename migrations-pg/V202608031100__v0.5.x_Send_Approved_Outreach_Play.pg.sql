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


-- ===================== Data (INSERT/UPDATE/DELETE) =====================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "${mjSchema}"."Action" WHERE "ID" = '5044A100-0028-4000-8000-000000000028'
    ) THEN
        INSERT INTO "${mjSchema}"."Action" ("ID", "CategoryID", "Name", "Description", "Type", "CodeApprovalStatus", "CodeLocked", "ForceCodeGeneration", "Status", "DriverClass", "IconClass")
        VALUES (
        '5044A100-0028-4000-8000-000000000028', '5044A100-0C00-4000-8000-00000000C0DE',
        'Sonar: Send Approved Outreach',
        'Sends the APPROVED drafts for an intervention through MJ Communications, one message per proposal (each was individually written, so there is nothing to merge). DryRun defaults to TRUE (renders everything, sends nothing, marks nothing Executed); TestRecipient redirects every message to one verified address so a real send can be proven without contacting members. Only Approved rows are eligible and success moves them to Executed, so re-running cannot double-send; a failure stays Approved for retry.',
        'Custom', 'Pending', 0, 0, 'Active', 'SonarSendApprovedOutreach', 'fa-solid fa-paper-plane'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "${mjSchema}"."ActionParam" WHERE "ID" = '5044A100-0028-4000-8000-0000000000A1'
    ) THEN
        INSERT INTO "${mjSchema}"."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
        VALUES ('5044A100-0028-4000-8000-0000000000A1', '5044A100-0028-4000-8000-000000000028', 'InterventionID', 'Input', 'Scalar', 0, 1, 'The intervention whose APPROVED drafts should be sent. Proposals in any other status are ignored.');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "${mjSchema}"."ActionParam" WHERE "ID" = '5044A100-0028-4000-8000-0000000000A2'
    ) THEN
        INSERT INTO "${mjSchema}"."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
        VALUES ('5044A100-0028-4000-8000-0000000000A2', '5044A100-0028-4000-8000-000000000028', 'From', 'Input', 'Scalar', 0, 1, 'Sender address. Must be verified with the provider or the send is rejected.');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "${mjSchema}"."ActionParam" WHERE "ID" = '5044A100-0028-4000-8000-0000000000A3'
    ) THEN
        INSERT INTO "${mjSchema}"."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
        VALUES ('5044A100-0028-4000-8000-0000000000A3', '5044A100-0028-4000-8000-000000000028', 'Provider', 'Input', 'Scalar', 0, 0, 'MJ Communication provider name (default ''SendGrid''). The provider must be Active AND its class imported at server startup.');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "${mjSchema}"."ActionParam" WHERE "ID" = '5044A100-0028-4000-8000-0000000000A4'
    ) THEN
        INSERT INTO "${mjSchema}"."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
        VALUES ('5044A100-0028-4000-8000-0000000000A4', '5044A100-0028-4000-8000-000000000028', 'DryRun', 'Input', 'Scalar', 0, 0, 'Defaults to TRUE. Renders every approved draft but sends nothing and marks nothing Executed, so a later real run still has them. Pass ''false'' to actually send.');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "${mjSchema}"."ActionParam" WHERE "ID" = '5044A100-0028-4000-8000-0000000000A5'
    ) THEN
        INSERT INTO "${mjSchema}"."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
        VALUES ('5044A100-0028-4000-8000-0000000000A5', '5044A100-0028-4000-8000-000000000028', 'TestRecipient', 'Input', 'Scalar', 0, 0, 'When set, every message goes to THIS address instead of the member, carrying the real drafted subject and body — the safe way to prove a live send.');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "${mjSchema}"."ActionParam" WHERE "ID" = '5044A100-0028-4000-8000-0000000000A6'
    ) THEN
        INSERT INTO "${mjSchema}"."ActionParam" ("ID", "ActionID", "Name", "Type", "ValueType", "IsArray", "IsRequired", "Description")
        VALUES ('5044A100-0028-4000-8000-0000000000A6', '5044A100-0028-4000-8000-000000000028', 'Result', 'Both', 'Scalar', 0, 0, 'JSON: { dryRun, provider, approved, sent, failed, skippedNoEmail, redirectedTo, firstError }.');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "${mjSchema}"."ActionResultCode" WHERE "ID" = '5044A100-0028-4000-8000-0000000000C1'
    ) THEN
        INSERT INTO "${mjSchema}"."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
        VALUES ('5044A100-0028-4000-8000-0000000000C1', '5044A100-0028-4000-8000-000000000028', 'SUCCESS', 1, 'Approved drafts previewed (dry run) or handed to the provider.');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "${mjSchema}"."ActionResultCode" WHERE "ID" = '5044A100-0028-4000-8000-0000000000C2'
    ) THEN
        INSERT INTO "${mjSchema}"."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
        VALUES ('5044A100-0028-4000-8000-0000000000C2', '5044A100-0028-4000-8000-000000000028', 'VALIDATION_ERROR', 0, 'InterventionID missing/not a GUID, or From missing.');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "${mjSchema}"."ActionResultCode" WHERE "ID" = '5044A100-0028-4000-8000-0000000000C3'
    ) THEN
        INSERT INTO "${mjSchema}"."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
        VALUES ('5044A100-0028-4000-8000-0000000000C3', '5044A100-0028-4000-8000-000000000028', 'NO_RECIPIENTS', 0, 'Approved drafts exist but none carry a usable recipient address, subject and body.');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "${mjSchema}"."ActionResultCode" WHERE "ID" = '5044A100-0028-4000-8000-0000000000C4'
    ) THEN
        INSERT INTO "${mjSchema}"."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
        VALUES ('5044A100-0028-4000-8000-0000000000C4', '5044A100-0028-4000-8000-000000000028', 'PROVIDER_UNAVAILABLE', 0, 'The named provider has no Email message type registered — check it is Active in MJ and its class is imported at server startup.');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "${mjSchema}"."ActionResultCode" WHERE "ID" = '5044A100-0028-4000-8000-0000000000C5'
    ) THEN
        INSERT INTO "${mjSchema}"."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description")
        VALUES ('5044A100-0028-4000-8000-0000000000C5', '5044A100-0028-4000-8000-000000000028', 'ERROR', 0, 'Unexpected failure while loading or sending the approved drafts.');
    END IF;
END $$;
