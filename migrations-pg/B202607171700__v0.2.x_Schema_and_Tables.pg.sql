-- ============================================================================
-- Sonar — PostgreSQL Baseline (v0.2.x): schema + CodeGen objects + seed
-- ============================================================================
-- One-shot PG install (no `mj codegen` needed): the __mj_BizAppsSonar tables,
-- CRUD functions, views, and triggers, plus entity registration (in __mj) and
-- the app-level seed (score bands, time windows, 23 actions + params + result
-- codes, remote operation, and the authoring agent). Extracted verbatim from a
-- post-codegen + post-seed PostgreSQL database (CodeGen's fixed point), mirroring
-- the bizapps-common PG baseline convention.
--
-- NOT included: the 3 Sonar Overview stored Queries — their SQL is T-SQL and does
-- not run on PostgreSQL; they need PG rewrites (tracked as a follow-up).
--
-- Regenerate: build a post-codegen+seed PG DB (mj migrate --tag; apply the
-- transpiled DDL; mj codegen; mj sync push --exclude queries), then
-- pg_dump -n __mj_bizappssonar --inserts + extract the Sonar __mj rows.
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE SCHEMA IF NOT EXISTS __mj_bizappssonar;
SET standard_conforming_strings = on;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.10 (Debian 17.10-1.pgdg13+1)
-- Dumped by pg_dump version 17.10 (Debian 17.10-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: __mj_bizappssonar; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS __mj_bizappssonar;


--
-- Name: fn_trg_update_factor(); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar.fn_trg_update_factor() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW."__mj_UpdatedAt" := NOW() AT TIME ZONE 'UTC';
    RETURN NEW;
END;
$$;


--
-- Name: fn_trg_update_model_factor(); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar.fn_trg_update_model_factor() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW."__mj_UpdatedAt" := NOW() AT TIME ZONE 'UTC';
    RETURN NEW;
END;
$$;


--
-- Name: fn_trg_update_model_related_entity(); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar.fn_trg_update_model_related_entity() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW."__mj_UpdatedAt" := NOW() AT TIME ZONE 'UTC';
    RETURN NEW;
END;
$$;


--
-- Name: fn_trg_update_score(); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar.fn_trg_update_score() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW."__mj_UpdatedAt" := NOW() AT TIME ZONE 'UTC';
    RETURN NEW;
END;
$$;


--
-- Name: fn_trg_update_score_band(); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar.fn_trg_update_score_band() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW."__mj_UpdatedAt" := NOW() AT TIME ZONE 'UTC';
    RETURN NEW;
END;
$$;


--
-- Name: fn_trg_update_score_band_set(); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar.fn_trg_update_score_band_set() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW."__mj_UpdatedAt" := NOW() AT TIME ZONE 'UTC';
    RETURN NEW;
END;
$$;


--
-- Name: fn_trg_update_score_band_transition(); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar.fn_trg_update_score_band_transition() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW."__mj_UpdatedAt" := NOW() AT TIME ZONE 'UTC';
    RETURN NEW;
END;
$$;


--
-- Name: fn_trg_update_score_factor_contribution(); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar.fn_trg_update_score_factor_contribution() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW."__mj_UpdatedAt" := NOW() AT TIME ZONE 'UTC';
    RETURN NEW;
END;
$$;


--
-- Name: fn_trg_update_score_history(); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar.fn_trg_update_score_history() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW."__mj_UpdatedAt" := NOW() AT TIME ZONE 'UTC';
    RETURN NEW;
END;
$$;


--
-- Name: fn_trg_update_score_model(); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar.fn_trg_update_score_model() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW."__mj_UpdatedAt" := NOW() AT TIME ZONE 'UTC';
    RETURN NEW;
END;
$$;


--
-- Name: fn_trg_update_score_model_audit_event(); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar.fn_trg_update_score_model_audit_event() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW."__mj_UpdatedAt" := NOW() AT TIME ZONE 'UTC';
    RETURN NEW;
END;
$$;


--
-- Name: fn_trg_update_score_model_version(); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar.fn_trg_update_score_model_version() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW."__mj_UpdatedAt" := NOW() AT TIME ZONE 'UTC';
    RETURN NEW;
END;
$$;


--
-- Name: fn_trg_update_score_recompute_run(); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar.fn_trg_update_score_recompute_run() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW."__mj_UpdatedAt" := NOW() AT TIME ZONE 'UTC';
    RETURN NEW;
END;
$$;


--
-- Name: fn_trg_update_time_window(); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar.fn_trg_update_time_window() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW."__mj_UpdatedAt" := NOW() AT TIME ZONE 'UTC';
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Factor; Type: TABLE; Schema: __mj_bizappssonar; Owner: -
--

CREATE TABLE __mj_bizappssonar."Factor" (
    "ID" uuid DEFAULT gen_random_uuid() NOT NULL,
    "Name" character varying(200) NOT NULL,
    "Slug" character varying(100) NOT NULL,
    "Description" text,
    "ScoreModelID" uuid,
    "AnchorEntityID" uuid NOT NULL,
    "FactorType" character varying(20) NOT NULL,
    "SourceRelatedEntityID" uuid,
    "SourceEntityID" uuid,
    "FilterExpression" text,
    "Aggregation" character varying(20),
    "AggregateFieldName" character varying(200),
    "TimeWindowID" uuid,
    "RecencyDecayHalfLifeDays" integer,
    "ActionID" uuid,
    "ActionParamsJSON" text,
    "ExecutionMode" character varying(12),
    "IsExpensive" boolean DEFAULT false NOT NULL,
    "MaxConcurrency" integer,
    "RateLimitPerMinute" integer,
    "CacheTTLSeconds" integer,
    "SourceScoreModelID" uuid,
    "RawDataType" character varying(12),
    "NormalizationMethod" character varying(20),
    "NormalizationParamsJSON" text,
    "OutputMin" numeric(9,4),
    "OutputMax" numeric(9,4),
    "HigherIsBetter" boolean DEFAULT true NOT NULL,
    "PromotionState" character varying(20),
    "LastValidatedAt" timestamp with time zone,
    "CreatedByAgent" character varying(60),
    "DateField" character varying(200),
    "__mj_CreatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    "__mj_UpdatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    CONSTRAINT "CK_Factor_Aggregation" CHECK ((("Aggregation")::text = ANY ((ARRAY['Count'::character varying, 'Sum'::character varying, 'Avg'::character varying, 'Min'::character varying, 'Max'::character varying, 'DistinctCount'::character varying, 'Recency'::character varying, 'RatePerPeriod'::character varying, 'Exists'::character varying, 'TrendSlope'::character varying])::text[]))),
    CONSTRAINT "CK_Factor_ExecutionMode" CHECK ((("ExecutionMode")::text = ANY ((ARRAY['PerRecord'::character varying, 'Batch'::character varying])::text[]))),
    CONSTRAINT "CK_Factor_FactorType" CHECK ((("FactorType")::text = ANY ((ARRAY['Declarative'::character varying, 'ActionBacked'::character varying, 'DerivedFromScore'::character varying, 'Constant'::character varying])::text[]))),
    CONSTRAINT "CK_Factor_NormalizationMethod" CHECK ((("NormalizationMethod")::text = ANY ((ARRAY['None'::character varying, 'MinMax'::character varying, 'Percentile'::character varying, 'ZScore'::character varying, 'Logistic'::character varying, 'Banded'::character varying, 'Lookup'::character varying])::text[]))),
    CONSTRAINT "CK_Factor_PromotionState" CHECK ((("PromotionState")::text = ANY ((ARRAY['Draft'::character varying, 'InReview'::character varying, 'Approved'::character varying, 'Deprecated'::character varying])::text[]))),
    CONSTRAINT "CK_Factor_RawDataType" CHECK ((("RawDataType")::text = ANY ((ARRAY['Number'::character varying, 'Date'::character varying, 'Boolean'::character varying, 'Duration'::character varying])::text[])))
);


--
-- Name: TABLE "Factor"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON TABLE __mj_bizappssonar."Factor" IS 'A reusable signal definition that satisfies one uniform contract. Declarative factors compile to set-based SQL; ActionBacked factors wrap an MJ Action; DerivedFromScore factors consume another model''s score.';


--
-- Name: COLUMN "Factor"."Name"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Factor"."Name" IS 'Human-readable name of the factor.';


--
-- Name: COLUMN "Factor"."Slug"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Factor"."Slug" IS 'Stable handle for the factor, referenced by the rubric and combine expressions.';


--
-- Name: COLUMN "Factor"."Description"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Factor"."Description" IS 'Optional description of the signal the factor measures.';


--
-- Name: COLUMN "Factor"."FactorType"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Factor"."FactorType" IS 'Factor kind: Declarative, ActionBacked, DerivedFromScore, or Constant. The rubric engine never branches on this.';


--
-- Name: COLUMN "Factor"."FilterExpression"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Factor"."FilterExpression" IS 'For declarative factors, the JSON/DSL filter applied to the source related entity (e.g. ActivityType IN (EmailOpen, EmailClick)).';


--
-- Name: COLUMN "Factor"."Aggregation"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Factor"."Aggregation" IS 'Aggregation applied to the filtered source rows: Count, Sum, Avg, Min, Max, DistinctCount, Recency, RatePerPeriod, Exists, or TrendSlope.';


--
-- Name: COLUMN "Factor"."AggregateFieldName"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Factor"."AggregateFieldName" IS 'Column on the source entity to sum or average; null for Count/Exists aggregations.';


--
-- Name: COLUMN "Factor"."RecencyDecayHalfLifeDays"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Factor"."RecencyDecayHalfLifeDays" IS 'Optional half-life in days for recency-weighted aggregation.';


--
-- Name: COLUMN "Factor"."ActionParamsJSON"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Factor"."ActionParamsJSON" IS 'For ActionBacked factors, static parameters (JSON) bound to the Action at config time.';


--
-- Name: COLUMN "Factor"."ExecutionMode"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Factor"."ExecutionMode" IS 'Execution mode for ActionBacked factors: PerRecord or Batch.';


--
-- Name: COLUMN "Factor"."IsExpensive"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Factor"."IsExpensive" IS 'Marks the factor as expensive to evaluate; surfaced in the builder and used for recompute budgeting.';


--
-- Name: COLUMN "Factor"."MaxConcurrency"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Factor"."MaxConcurrency" IS 'Optional maximum concurrency for evaluating an ActionBacked factor.';


--
-- Name: COLUMN "Factor"."RateLimitPerMinute"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Factor"."RateLimitPerMinute" IS 'Optional rate limit per minute for external-API-backed Actions.';


--
-- Name: COLUMN "Factor"."CacheTTLSeconds"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Factor"."CacheTTLSeconds" IS 'Result cache time-to-live in seconds, keyed by (anchor record, as-of date, params hash).';


--
-- Name: COLUMN "Factor"."RawDataType"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Factor"."RawDataType" IS 'Raw data type produced by the factor before normalization: Number, Date, Boolean, or Duration.';


--
-- Name: COLUMN "Factor"."NormalizationMethod"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Factor"."NormalizationMethod" IS 'Normalization method mapping the raw value to a contribution: None, MinMax, Percentile, ZScore, Logistic, Banded, or Lookup.';


--
-- Name: COLUMN "Factor"."NormalizationParamsJSON"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Factor"."NormalizationParamsJSON" IS 'JSON parameters for the normalization method (clamps, percentile basis, logistic midpoint/steepness, banded thresholds, lookup table).';


--
-- Name: COLUMN "Factor"."OutputMin"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Factor"."OutputMin" IS 'Lower bound of the normalized contribution range (e.g. 0).';


--
-- Name: COLUMN "Factor"."OutputMax"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Factor"."OutputMax" IS 'Upper bound of the normalized contribution range (e.g. 1).';


--
-- Name: COLUMN "Factor"."HigherIsBetter"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Factor"."HigherIsBetter" IS 'Direction of the signal; when false, higher raw values are worse (e.g. days since last login).';


--
-- Name: COLUMN "Factor"."PromotionState"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Factor"."PromotionState" IS 'Governance state, enforced for ActionBacked factors before production use: Draft, InReview, Approved, or Deprecated.';


--
-- Name: COLUMN "Factor"."LastValidatedAt"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Factor"."LastValidatedAt" IS 'UTC timestamp of the most recent validation of the factor.';


--
-- Name: COLUMN "Factor"."CreatedByAgent"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Factor"."CreatedByAgent" IS 'Name of the AI agent that created the factor, if any (e.g. ModelBuilderAgent, ActionBuilder).';


--
-- Name: COLUMN "Factor"."DateField"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Factor"."DateField" IS 'The date column on the factor''s related (source) entity that a time window filters on — the "when did it happen" column (e.g. RegistrationDate). Used by Rolling/Calendar/SinceEvent windows; null = no date filter (count everything in scope).';


--
-- Name: ScoreModel; Type: TABLE; Schema: __mj_bizappssonar; Owner: -
--

CREATE TABLE __mj_bizappssonar."ScoreModel" (
    "ID" uuid DEFAULT gen_random_uuid() NOT NULL,
    "Name" character varying(200) NOT NULL,
    "Slug" character varying(100) NOT NULL,
    "Description" text,
    "AnchorEntityID" uuid NOT NULL,
    "Status" character varying(20) DEFAULT 'Draft'::character varying NOT NULL,
    "CurrentVersionID" uuid,
    "ScoreScaleMin" numeric(9,4) DEFAULT 0 NOT NULL,
    "ScoreScaleMax" numeric(9,4) DEFAULT 100 NOT NULL,
    "CombineStrategy" character varying(30) DEFAULT 'WeightedSum'::character varying NOT NULL,
    "CombineExpression" text,
    "BandSetID" uuid,
    "PopulationFilter" text,
    "RecomputeMode" character varying(20) DEFAULT 'Scheduled'::character varying NOT NULL,
    "RecomputeCron" character varying(100),
    "AsOfStrategy" character varying(20) DEFAULT 'RunTime'::character varying NOT NULL,
    "IsCalibrated" boolean DEFAULT false NOT NULL,
    "TrendWindowDays" integer,
    "OwnerUserID" uuid,
    "EffectiveFrom" timestamp with time zone,
    "EffectiveTo" timestamp with time zone,
    "Notes" text,
    "__mj_CreatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    "__mj_UpdatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    CONSTRAINT "CK_ScoreModel_AsOfStrategy" CHECK ((("AsOfStrategy")::text = ANY ((ARRAY['RunTime'::character varying, 'EndOfPreviousDay'::character varying, 'Fixed'::character varying])::text[]))),
    CONSTRAINT "CK_ScoreModel_CombineStrategy" CHECK ((("CombineStrategy")::text = ANY ((ARRAY['WeightedSum'::character varying, 'WeightedAvg'::character varying, 'Banded'::character varying, 'ZScoreComposite'::character varying, 'ExpressionDriven'::character varying])::text[]))),
    CONSTRAINT "CK_ScoreModel_RecomputeMode" CHECK ((("RecomputeMode")::text = ANY ((ARRAY['Scheduled'::character varying, 'EventDriven'::character varying, 'OnDemand'::character varying, 'Hybrid'::character varying])::text[]))),
    CONSTRAINT "CK_ScoreModel_Status" CHECK ((("Status")::text = ANY ((ARRAY['Draft'::character varying, 'Active'::character varying, 'Paused'::character varying, 'Archived'::character varying])::text[])))
);


--
-- Name: TABLE "ScoreModel"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON TABLE __mj_bizappssonar."ScoreModel" IS 'The editable definition of one scoring model: anchor entity, scale, combine strategy, recompute policy, and bands. Many models can be active per tenant.';


--
-- Name: COLUMN "ScoreModel"."Name"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModel"."Name" IS 'Human-readable name of the model, e.g. "2026 Renewal Risk".';


--
-- Name: COLUMN "ScoreModel"."Slug"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModel"."Slug" IS 'Stable, unique handle for the model used in expressions and references.';


--
-- Name: COLUMN "ScoreModel"."Description"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModel"."Description" IS 'Optional description of what the model scores and why.';


--
-- Name: COLUMN "ScoreModel"."Status"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModel"."Status" IS 'Lifecycle status of the model: Draft, Active, Paused, or Archived.';


--
-- Name: COLUMN "ScoreModel"."ScoreScaleMin"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModel"."ScoreScaleMin" IS 'Minimum value of the output score scale (default 0).';


--
-- Name: COLUMN "ScoreModel"."ScoreScaleMax"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModel"."ScoreScaleMax" IS 'Maximum value of the output score scale (default 100).';


--
-- Name: COLUMN "ScoreModel"."CombineStrategy"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModel"."CombineStrategy" IS 'How factor contributions combine into a score: WeightedSum, WeightedAvg, Banded, ZScoreComposite, or ExpressionDriven.';


--
-- Name: COLUMN "ScoreModel"."CombineExpression"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModel"."CombineExpression" IS 'For ExpressionDriven models, the formula over factor slugs used to combine contributions.';


--
-- Name: COLUMN "ScoreModel"."PopulationFilter"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModel"."PopulationFilter" IS 'JSON/DSL filter defining which anchor records are in scope for scoring (e.g. Status = Active).';


--
-- Name: COLUMN "ScoreModel"."RecomputeMode"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModel"."RecomputeMode" IS 'When scores recompute: Scheduled, EventDriven, OnDemand, or Hybrid.';


--
-- Name: COLUMN "ScoreModel"."RecomputeCron"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModel"."RecomputeCron" IS 'Cron expression controlling scheduled recompute, when RecomputeMode includes a schedule.';


--
-- Name: COLUMN "ScoreModel"."AsOfStrategy"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModel"."AsOfStrategy" IS 'Defines what "now" means when resolving time windows: RunTime, EndOfPreviousDay, or Fixed.';


--
-- Name: COLUMN "ScoreModel"."IsCalibrated"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModel"."IsCalibrated" IS 'When set, the model consumes cross-tenant benchmark distributions for normalization (calibration network).';


--
-- Name: COLUMN "ScoreModel"."TrendWindowDays"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModel"."TrendWindowDays" IS 'Number of days used to compute the headline Delta and trend on each score.';


--
-- Name: COLUMN "ScoreModel"."EffectiveFrom"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModel"."EffectiveFrom" IS 'Start of the bounded time range during which the model is active (optional).';


--
-- Name: COLUMN "ScoreModel"."EffectiveTo"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModel"."EffectiveTo" IS 'End of the bounded time range during which the model is active (optional).';


--
-- Name: COLUMN "ScoreModel"."Notes"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModel"."Notes" IS 'Freeform notes about the model.';


--
-- Name: TimeWindow; Type: TABLE; Schema: __mj_bizappssonar; Owner: -
--

CREATE TABLE __mj_bizappssonar."TimeWindow" (
    "ID" uuid DEFAULT gen_random_uuid() NOT NULL,
    "Name" character varying(120) NOT NULL,
    "WindowType" character varying(20) NOT NULL,
    "LengthDays" integer,
    "LengthMonths" integer,
    "AnchorDateField" character varying(200),
    "OffsetDays" integer,
    "Description" text,
    "__mj_CreatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    "__mj_UpdatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    CONSTRAINT "CK_TimeWindow_WindowType" CHECK ((("WindowType")::text = ANY ((ARRAY['Rolling'::character varying, 'Calendar'::character varying, 'SinceEvent'::character varying, 'RenewalRelative'::character varying, 'AllTime'::character varying])::text[])))
);


--
-- Name: TABLE "TimeWindow"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON TABLE __mj_bizappssonar."TimeWindow" IS 'A reusable, first-class time window used when evaluating factors (e.g. trailing 90 days, current term, renewal window -90d).';


--
-- Name: COLUMN "TimeWindow"."Name"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."TimeWindow"."Name" IS 'Display name of the time window.';


--
-- Name: COLUMN "TimeWindow"."WindowType"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."TimeWindow"."WindowType" IS 'Window type: Rolling, Calendar, SinceEvent, RenewalRelative, or AllTime.';


--
-- Name: COLUMN "TimeWindow"."LengthDays"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."TimeWindow"."LengthDays" IS 'Window length in days, for Rolling/Calendar windows.';


--
-- Name: COLUMN "TimeWindow"."LengthMonths"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."TimeWindow"."LengthMonths" IS 'Window length in months, for Rolling/Calendar windows.';


--
-- Name: COLUMN "TimeWindow"."AnchorDateField"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."TimeWindow"."AnchorDateField" IS 'For RenewalRelative/SinceEvent windows, the date field on the anchor record the window is measured from (e.g. RenewalDate).';


--
-- Name: COLUMN "TimeWindow"."OffsetDays"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."TimeWindow"."OffsetDays" IS 'Offset in days applied to the window start relative to the anchor date.';


--
-- Name: COLUMN "TimeWindow"."Description"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."TimeWindow"."Description" IS 'Optional description of the time window.';


--
-- Name: vwFactors; Type: VIEW; Schema: __mj_bizappssonar; Owner: -
--

CREATE VIEW __mj_bizappssonar."vwFactors" AS
 SELECT f."ID",
    f."Name",
    f."Slug",
    f."Description",
    f."ScoreModelID",
    f."AnchorEntityID",
    f."FactorType",
    f."SourceRelatedEntityID",
    f."SourceEntityID",
    f."FilterExpression",
    f."Aggregation",
    f."AggregateFieldName",
    f."TimeWindowID",
    f."RecencyDecayHalfLifeDays",
    f."ActionID",
    f."ActionParamsJSON",
    f."ExecutionMode",
    f."IsExpensive",
    f."MaxConcurrency",
    f."RateLimitPerMinute",
    f."CacheTTLSeconds",
    f."SourceScoreModelID",
    f."RawDataType",
    f."NormalizationMethod",
    f."NormalizationParamsJSON",
    f."OutputMin",
    f."OutputMax",
    f."HigherIsBetter",
    f."PromotionState",
    f."LastValidatedAt",
    f."CreatedByAgent",
    f."DateField",
    f."__mj_CreatedAt",
    f."__mj_UpdatedAt",
    mjbizappssonarscoremodel_scoremodelid."Name" AS "ScoreModel",
    mjentity_anchorentityid."Name" AS "AnchorEntity",
    mjentity_sourceentityid."Name" AS "SourceEntity",
    mjbizappssonartimewindow_timewindowid."Name" AS "TimeWindow",
    mjaction_actionid."Name" AS "Action",
    mjbizappssonarscoremodel_sourcescoremodelid."Name" AS "SourceScoreModel"
   FROM ((((((__mj_bizappssonar."Factor" f
     LEFT JOIN __mj_bizappssonar."ScoreModel" mjbizappssonarscoremodel_scoremodelid ON ((f."ScoreModelID" = mjbizappssonarscoremodel_scoremodelid."ID")))
     JOIN __mj."Entity" mjentity_anchorentityid ON ((f."AnchorEntityID" = mjentity_anchorentityid."ID")))
     LEFT JOIN __mj."Entity" mjentity_sourceentityid ON ((f."SourceEntityID" = mjentity_sourceentityid."ID")))
     LEFT JOIN __mj_bizappssonar."TimeWindow" mjbizappssonartimewindow_timewindowid ON ((f."TimeWindowID" = mjbizappssonartimewindow_timewindowid."ID")))
     LEFT JOIN __mj."Action" mjaction_actionid ON ((f."ActionID" = mjaction_actionid."ID")))
     LEFT JOIN __mj_bizappssonar."ScoreModel" mjbizappssonarscoremodel_sourcescoremodelid ON ((f."SourceScoreModelID" = mjbizappssonarscoremodel_sourcescoremodelid."ID")));


--
-- Name: spCreateFactor(uuid, character varying, character varying, boolean, text, boolean, uuid, uuid, character varying, boolean, uuid, boolean, uuid, boolean, text, boolean, character varying, boolean, character varying, boolean, uuid, boolean, integer, boolean, uuid, boolean, text, boolean, character varying, boolean, boolean, integer, boolean, integer, boolean, integer, boolean, uuid, boolean, character varying, boolean, character varying, boolean, text, boolean, numeric, boolean, numeric, boolean, boolean, character varying, boolean, timestamp with time zone, boolean, character varying, boolean, character varying); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spCreateFactor"(p_id uuid DEFAULT NULL::uuid, p_name character varying DEFAULT NULL::character varying, p_slug character varying DEFAULT NULL::character varying, p_description_clear boolean DEFAULT false, p_description text DEFAULT NULL::text, p_scoremodelid_clear boolean DEFAULT false, p_scoremodelid uuid DEFAULT NULL::uuid, p_anchorentityid uuid DEFAULT NULL::uuid, p_factortype character varying DEFAULT NULL::character varying, p_sourcerelatedentityid_clear boolean DEFAULT false, p_sourcerelatedentityid uuid DEFAULT NULL::uuid, p_sourceentityid_clear boolean DEFAULT false, p_sourceentityid uuid DEFAULT NULL::uuid, p_filterexpression_clear boolean DEFAULT false, p_filterexpression text DEFAULT NULL::text, p_aggregation_clear boolean DEFAULT false, p_aggregation character varying DEFAULT NULL::character varying, p_aggregatefieldname_clear boolean DEFAULT false, p_aggregatefieldname character varying DEFAULT NULL::character varying, p_timewindowid_clear boolean DEFAULT false, p_timewindowid uuid DEFAULT NULL::uuid, p_recencydecayhalflifedays_clear boolean DEFAULT false, p_recencydecayhalflifedays integer DEFAULT NULL::integer, p_actionid_clear boolean DEFAULT false, p_actionid uuid DEFAULT NULL::uuid, p_actionparamsjson_clear boolean DEFAULT false, p_actionparamsjson text DEFAULT NULL::text, p_executionmode_clear boolean DEFAULT false, p_executionmode character varying DEFAULT NULL::character varying, p_isexpensive boolean DEFAULT NULL::boolean, p_maxconcurrency_clear boolean DEFAULT false, p_maxconcurrency integer DEFAULT NULL::integer, p_ratelimitperminute_clear boolean DEFAULT false, p_ratelimitperminute integer DEFAULT NULL::integer, p_cachettlseconds_clear boolean DEFAULT false, p_cachettlseconds integer DEFAULT NULL::integer, p_sourcescoremodelid_clear boolean DEFAULT false, p_sourcescoremodelid uuid DEFAULT NULL::uuid, p_rawdatatype_clear boolean DEFAULT false, p_rawdatatype character varying DEFAULT NULL::character varying, p_normalizationmethod_clear boolean DEFAULT false, p_normalizationmethod character varying DEFAULT NULL::character varying, p_normalizationparamsjson_clear boolean DEFAULT false, p_normalizationparamsjson text DEFAULT NULL::text, p_outputmin_clear boolean DEFAULT false, p_outputmin numeric DEFAULT NULL::numeric, p_outputmax_clear boolean DEFAULT false, p_outputmax numeric DEFAULT NULL::numeric, p_higherisbetter boolean DEFAULT NULL::boolean, p_promotionstate_clear boolean DEFAULT false, p_promotionstate character varying DEFAULT NULL::character varying, p_lastvalidatedat_clear boolean DEFAULT false, p_lastvalidatedat timestamp with time zone DEFAULT NULL::timestamp with time zone, p_createdbyagent_clear boolean DEFAULT false, p_createdbyagent character varying DEFAULT NULL::character varying, p_datefield_clear boolean DEFAULT false, p_datefield character varying DEFAULT NULL::character varying) RETURNS SETOF __mj_bizappssonar."vwFactors"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_new_id UUID;
BEGIN
    v_new_id := COALESCE(p_id, gen_random_uuid());
    INSERT INTO __mj_bizappssonar."Factor"
        (
            "ID",
            "Name",
                "Slug",
                "Description",
                "ScoreModelID",
                "AnchorEntityID",
                "FactorType",
                "SourceRelatedEntityID",
                "SourceEntityID",
                "FilterExpression",
                "Aggregation",
                "AggregateFieldName",
                "TimeWindowID",
                "RecencyDecayHalfLifeDays",
                "ActionID",
                "ActionParamsJSON",
                "ExecutionMode",
                "IsExpensive",
                "MaxConcurrency",
                "RateLimitPerMinute",
                "CacheTTLSeconds",
                "SourceScoreModelID",
                "RawDataType",
                "NormalizationMethod",
                "NormalizationParamsJSON",
                "OutputMin",
                "OutputMax",
                "HigherIsBetter",
                "PromotionState",
                "LastValidatedAt",
                "CreatedByAgent",
                "DateField"
        )
    VALUES
        (
            v_new_id,
            p_name,
                p_slug,
                CASE WHEN p_description_clear = true THEN NULL ELSE COALESCE(p_description, NULL) END,
                CASE WHEN p_scoremodelid_clear = true THEN NULL ELSE COALESCE(p_scoremodelid, NULL) END,
                p_anchorentityid,
                p_factortype,
                CASE WHEN p_sourcerelatedentityid_clear = true THEN NULL ELSE COALESCE(p_sourcerelatedentityid, NULL) END,
                CASE WHEN p_sourceentityid_clear = true THEN NULL ELSE COALESCE(p_sourceentityid, NULL) END,
                CASE WHEN p_filterexpression_clear = true THEN NULL ELSE COALESCE(p_filterexpression, NULL) END,
                CASE WHEN p_aggregation_clear = true THEN NULL ELSE COALESCE(p_aggregation, NULL) END,
                CASE WHEN p_aggregatefieldname_clear = true THEN NULL ELSE COALESCE(p_aggregatefieldname, NULL) END,
                CASE WHEN p_timewindowid_clear = true THEN NULL ELSE COALESCE(p_timewindowid, NULL) END,
                CASE WHEN p_recencydecayhalflifedays_clear = true THEN NULL ELSE COALESCE(p_recencydecayhalflifedays, NULL) END,
                CASE WHEN p_actionid_clear = true THEN NULL ELSE COALESCE(p_actionid, NULL) END,
                CASE WHEN p_actionparamsjson_clear = true THEN NULL ELSE COALESCE(p_actionparamsjson, NULL) END,
                CASE WHEN p_executionmode_clear = true THEN NULL ELSE COALESCE(p_executionmode, NULL) END,
                COALESCE(p_isexpensive, FALSE),
                CASE WHEN p_maxconcurrency_clear = true THEN NULL ELSE COALESCE(p_maxconcurrency, NULL) END,
                CASE WHEN p_ratelimitperminute_clear = true THEN NULL ELSE COALESCE(p_ratelimitperminute, NULL) END,
                CASE WHEN p_cachettlseconds_clear = true THEN NULL ELSE COALESCE(p_cachettlseconds, NULL) END,
                CASE WHEN p_sourcescoremodelid_clear = true THEN NULL ELSE COALESCE(p_sourcescoremodelid, NULL) END,
                CASE WHEN p_rawdatatype_clear = true THEN NULL ELSE COALESCE(p_rawdatatype, NULL) END,
                CASE WHEN p_normalizationmethod_clear = true THEN NULL ELSE COALESCE(p_normalizationmethod, NULL) END,
                CASE WHEN p_normalizationparamsjson_clear = true THEN NULL ELSE COALESCE(p_normalizationparamsjson, NULL) END,
                CASE WHEN p_outputmin_clear = true THEN NULL ELSE COALESCE(p_outputmin, NULL) END,
                CASE WHEN p_outputmax_clear = true THEN NULL ELSE COALESCE(p_outputmax, NULL) END,
                COALESCE(p_higherisbetter, TRUE),
                CASE WHEN p_promotionstate_clear = true THEN NULL ELSE COALESCE(p_promotionstate, NULL) END,
                CASE WHEN p_lastvalidatedat_clear = true THEN NULL ELSE COALESCE(p_lastvalidatedat, NULL) END,
                CASE WHEN p_createdbyagent_clear = true THEN NULL ELSE COALESCE(p_createdbyagent, NULL) END,
                CASE WHEN p_datefield_clear = true THEN NULL ELSE COALESCE(p_datefield, NULL) END
        )
    ;

    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwFactors"
    WHERE "ID" = v_new_id;
END;
$$;


--
-- Name: ModelFactor; Type: TABLE; Schema: __mj_bizappssonar; Owner: -
--

CREATE TABLE __mj_bizappssonar."ModelFactor" (
    "ID" uuid DEFAULT gen_random_uuid() NOT NULL,
    "ScoreModelID" uuid NOT NULL,
    "FactorID" uuid NOT NULL,
    "Weight" numeric(9,4) DEFAULT 1 NOT NULL,
    "WeightMode" character varying(12) DEFAULT 'Additive'::character varying NOT NULL,
    "ContributionCap" numeric(9,4),
    "ContributionFloor" numeric(9,4),
    "TrendWeight" numeric(9,4),
    "MissingDataPolicy" character varying(16) DEFAULT 'ModelDefault'::character varying NOT NULL,
    "IsRequired" boolean DEFAULT false NOT NULL,
    "DisplayLabel" character varying(200),
    "DisplayOrder" integer,
    "__mj_CreatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    "__mj_UpdatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    CONSTRAINT "CK_ModelFactor_MissingDataPolicy" CHECK ((("MissingDataPolicy")::text = ANY ((ARRAY['Zero'::character varying, 'NeutralMidpoint'::character varying, 'Exclude'::character varying, 'ModelDefault'::character varying])::text[]))),
    CONSTRAINT "CK_ModelFactor_WeightMode" CHECK ((("WeightMode")::text = ANY ((ARRAY['Additive'::character varying, 'Multiplier'::character varying, 'Gate'::character varying, 'Penalty'::character varying, 'Bonus'::character varying])::text[])))
);


--
-- Name: TABLE "ModelFactor"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON TABLE __mj_bizappssonar."ModelFactor" IS 'Binds a Factor into a model with its weight and contribution rules. The rubric is the set of these rows.';


--
-- Name: COLUMN "ModelFactor"."Weight"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ModelFactor"."Weight" IS 'Weight applied to this factor''s normalized contribution.';


--
-- Name: COLUMN "ModelFactor"."WeightMode"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ModelFactor"."WeightMode" IS 'How the weight is applied: Additive, Multiplier, Gate, Penalty, or Bonus.';


--
-- Name: COLUMN "ModelFactor"."ContributionCap"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ModelFactor"."ContributionCap" IS 'Optional upper clamp on this factor''s contribution.';


--
-- Name: COLUMN "ModelFactor"."ContributionFloor"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ModelFactor"."ContributionFloor" IS 'Optional lower clamp on this factor''s contribution.';


--
-- Name: COLUMN "ModelFactor"."TrendWeight"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ModelFactor"."TrendWeight" IS 'Extra weight placed on the factor''s delta versus its level (encodes "a falling 80 beats a steady 50").';


--
-- Name: COLUMN "ModelFactor"."MissingDataPolicy"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ModelFactor"."MissingDataPolicy" IS 'Policy when the factor has no data: Zero, NeutralMidpoint, Exclude, or ModelDefault.';


--
-- Name: COLUMN "ModelFactor"."IsRequired"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ModelFactor"."IsRequired" IS 'When true and data is missing, the resulting score is flagged low-confidence.';


--
-- Name: COLUMN "ModelFactor"."DisplayLabel"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ModelFactor"."DisplayLabel" IS 'Label shown for this factor in explainability views, e.g. "Newsletter engagement".';


--
-- Name: COLUMN "ModelFactor"."DisplayOrder"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ModelFactor"."DisplayOrder" IS 'Sort order for displaying this factor in the rubric and explainability views.';


--
-- Name: vwModelFactors; Type: VIEW; Schema: __mj_bizappssonar; Owner: -
--

CREATE VIEW __mj_bizappssonar."vwModelFactors" AS
 SELECT m."ID",
    m."ScoreModelID",
    m."FactorID",
    m."Weight",
    m."WeightMode",
    m."ContributionCap",
    m."ContributionFloor",
    m."TrendWeight",
    m."MissingDataPolicy",
    m."IsRequired",
    m."DisplayLabel",
    m."DisplayOrder",
    m."__mj_CreatedAt",
    m."__mj_UpdatedAt",
    mjbizappssonarscoremodel_scoremodelid."Name" AS "ScoreModel",
    mjbizappssonarfactor_factorid."Name" AS "Factor"
   FROM ((__mj_bizappssonar."ModelFactor" m
     JOIN __mj_bizappssonar."ScoreModel" mjbizappssonarscoremodel_scoremodelid ON ((m."ScoreModelID" = mjbizappssonarscoremodel_scoremodelid."ID")))
     JOIN __mj_bizappssonar."Factor" mjbizappssonarfactor_factorid ON ((m."FactorID" = mjbizappssonarfactor_factorid."ID")));


--
-- Name: spCreateModelFactor(uuid, uuid, uuid, numeric, character varying, boolean, numeric, boolean, numeric, boolean, numeric, character varying, boolean, boolean, character varying, boolean, integer); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spCreateModelFactor"(p_id uuid DEFAULT NULL::uuid, p_scoremodelid uuid DEFAULT NULL::uuid, p_factorid uuid DEFAULT NULL::uuid, p_weight numeric DEFAULT NULL::numeric, p_weightmode character varying DEFAULT NULL::character varying, p_contributioncap_clear boolean DEFAULT false, p_contributioncap numeric DEFAULT NULL::numeric, p_contributionfloor_clear boolean DEFAULT false, p_contributionfloor numeric DEFAULT NULL::numeric, p_trendweight_clear boolean DEFAULT false, p_trendweight numeric DEFAULT NULL::numeric, p_missingdatapolicy character varying DEFAULT NULL::character varying, p_isrequired boolean DEFAULT NULL::boolean, p_displaylabel_clear boolean DEFAULT false, p_displaylabel character varying DEFAULT NULL::character varying, p_displayorder_clear boolean DEFAULT false, p_displayorder integer DEFAULT NULL::integer) RETURNS SETOF __mj_bizappssonar."vwModelFactors"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_new_id UUID;
BEGIN
    v_new_id := COALESCE(p_id, gen_random_uuid());
    INSERT INTO __mj_bizappssonar."ModelFactor"
        (
            "ID",
            "ScoreModelID",
                "FactorID",
                "Weight",
                "WeightMode",
                "ContributionCap",
                "ContributionFloor",
                "TrendWeight",
                "MissingDataPolicy",
                "IsRequired",
                "DisplayLabel",
                "DisplayOrder"
        )
    VALUES
        (
            v_new_id,
            p_scoremodelid,
                p_factorid,
                COALESCE(p_weight, 1),
                COALESCE(p_weightmode, 'Additive'),
                CASE WHEN p_contributioncap_clear = true THEN NULL ELSE COALESCE(p_contributioncap, NULL) END,
                CASE WHEN p_contributionfloor_clear = true THEN NULL ELSE COALESCE(p_contributionfloor, NULL) END,
                CASE WHEN p_trendweight_clear = true THEN NULL ELSE COALESCE(p_trendweight, NULL) END,
                COALESCE(p_missingdatapolicy, 'ModelDefault'),
                COALESCE(p_isrequired, FALSE),
                CASE WHEN p_displaylabel_clear = true THEN NULL ELSE COALESCE(p_displaylabel, NULL) END,
                CASE WHEN p_displayorder_clear = true THEN NULL ELSE COALESCE(p_displayorder, NULL) END
        )
    ;

    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwModelFactors"
    WHERE "ID" = v_new_id;
END;
$$;


--
-- Name: ModelRelatedEntity; Type: TABLE; Schema: __mj_bizappssonar; Owner: -
--

CREATE TABLE __mj_bizappssonar."ModelRelatedEntity" (
    "ID" uuid DEFAULT gen_random_uuid() NOT NULL,
    "ScoreModelID" uuid NOT NULL,
    "RelatedEntityID" uuid NOT NULL,
    "Alias" character varying(100) NOT NULL,
    "RelationshipPath" text NOT NULL,
    "JoinType" character varying(10) DEFAULT 'Left'::character varying NOT NULL,
    "SourceSystemTag" character varying(60),
    "Description" text,
    "__mj_CreatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    "__mj_UpdatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    CONSTRAINT "CK_ModelRelatedEntity_JoinType" CHECK ((("JoinType")::text = ANY ((ARRAY['Inner'::character varying, 'Left'::character varying])::text[])))
);


--
-- Name: TABLE "ModelRelatedEntity"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON TABLE __mj_bizappssonar."ModelRelatedEntity" IS 'Declares an MJ entity wired into a model and how to traverse from the anchor to it. Factors reference these by Alias.';


--
-- Name: COLUMN "ModelRelatedEntity"."Alias"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ModelRelatedEntity"."Alias" IS 'Handle used by factors to reference this related entity, e.g. crm_activity, invoices, lms_completions.';


--
-- Name: COLUMN "ModelRelatedEntity"."RelationshipPath"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ModelRelatedEntity"."RelationshipPath" IS 'JSON describing the join path from the anchor to the related entity (direct FK or multi-hop), resolved against MJ relationship metadata.';


--
-- Name: COLUMN "ModelRelatedEntity"."JoinType"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ModelRelatedEntity"."JoinType" IS 'Join type from anchor to related entity: Inner or Left (usually Left so absence of related data is itself scorable).';


--
-- Name: COLUMN "ModelRelatedEntity"."SourceSystemTag"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ModelRelatedEntity"."SourceSystemTag" IS 'Informational provenance tag for the source system (e.g. Salesforce, Finance, LMS, Community, Email).';


--
-- Name: COLUMN "ModelRelatedEntity"."Description"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ModelRelatedEntity"."Description" IS 'Optional description of the related-entity mapping.';


--
-- Name: vwModelRelatedEntities; Type: VIEW; Schema: __mj_bizappssonar; Owner: -
--

CREATE VIEW __mj_bizappssonar."vwModelRelatedEntities" AS
 SELECT m."ID",
    m."ScoreModelID",
    m."RelatedEntityID",
    m."Alias",
    m."RelationshipPath",
    m."JoinType",
    m."SourceSystemTag",
    m."Description",
    m."__mj_CreatedAt",
    m."__mj_UpdatedAt",
    mjbizappssonarscoremodel_scoremodelid."Name" AS "ScoreModel",
    mjentity_relatedentityid."Name" AS "RelatedEntity"
   FROM ((__mj_bizappssonar."ModelRelatedEntity" m
     JOIN __mj_bizappssonar."ScoreModel" mjbizappssonarscoremodel_scoremodelid ON ((m."ScoreModelID" = mjbizappssonarscoremodel_scoremodelid."ID")))
     JOIN __mj."Entity" mjentity_relatedentityid ON ((m."RelatedEntityID" = mjentity_relatedentityid."ID")));


--
-- Name: spCreateModelRelatedEntity(uuid, uuid, uuid, character varying, text, character varying, boolean, character varying, boolean, text); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spCreateModelRelatedEntity"(p_id uuid DEFAULT NULL::uuid, p_scoremodelid uuid DEFAULT NULL::uuid, p_relatedentityid uuid DEFAULT NULL::uuid, p_alias character varying DEFAULT NULL::character varying, p_relationshippath text DEFAULT NULL::text, p_jointype character varying DEFAULT NULL::character varying, p_sourcesystemtag_clear boolean DEFAULT false, p_sourcesystemtag character varying DEFAULT NULL::character varying, p_description_clear boolean DEFAULT false, p_description text DEFAULT NULL::text) RETURNS SETOF __mj_bizappssonar."vwModelRelatedEntities"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_new_id UUID;
BEGIN
    v_new_id := COALESCE(p_id, gen_random_uuid());
    INSERT INTO __mj_bizappssonar."ModelRelatedEntity"
        (
            "ID",
            "ScoreModelID",
                "RelatedEntityID",
                "Alias",
                "RelationshipPath",
                "JoinType",
                "SourceSystemTag",
                "Description"
        )
    VALUES
        (
            v_new_id,
            p_scoremodelid,
                p_relatedentityid,
                p_alias,
                p_relationshippath,
                COALESCE(p_jointype, 'Left'),
                CASE WHEN p_sourcesystemtag_clear = true THEN NULL ELSE COALESCE(p_sourcesystemtag, NULL) END,
                CASE WHEN p_description_clear = true THEN NULL ELSE COALESCE(p_description, NULL) END
        )
    ;

    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwModelRelatedEntities"
    WHERE "ID" = v_new_id;
END;
$$;


--
-- Name: Score; Type: TABLE; Schema: __mj_bizappssonar; Owner: -
--

CREATE TABLE __mj_bizappssonar."Score" (
    "ID" uuid DEFAULT gen_random_uuid() NOT NULL,
    "ScoreModelID" uuid NOT NULL,
    "ScoreModelVersionID" uuid NOT NULL,
    "AnchorEntityID" uuid NOT NULL,
    "AnchorRecordID" character varying(450) NOT NULL,
    "AnchorRecordKeyJSON" text,
    "RawScore" numeric(12,4),
    "NormalizedScore" numeric(9,4),
    "BandID" uuid,
    "PreviousNormalizedScore" numeric(9,4),
    "PreviousBandID" uuid,
    "Delta" numeric(9,4),
    "TrendDirection" character varying(8),
    "TrendSlope" numeric(12,6),
    "Confidence" numeric(5,4),
    "DataCompleteness" numeric(5,4),
    "ComputedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "AsOfDate" timestamp with time zone,
    "NextRecomputeAt" timestamp with time zone,
    "IsStale" boolean DEFAULT false NOT NULL,
    "ExplanationSummary" text,
    "__mj_CreatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    "__mj_UpdatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    CONSTRAINT "CK_Score_TrendDirection" CHECK ((("TrendDirection")::text = ANY ((ARRAY['Up'::character varying, 'Down'::character varying, 'Flat'::character varying])::text[])))
);


--
-- Name: TABLE "Score"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON TABLE __mj_bizappssonar."Score" IS 'The current score for one anchor record under one model. Written back into MJ as a first-class entity.';


--
-- Name: COLUMN "Score"."AnchorRecordID"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Score"."AnchorRecordID" IS 'Primary-key value of the scored anchor record, stored as a string to stay entity-agnostic.';


--
-- Name: COLUMN "Score"."AnchorRecordKeyJSON"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Score"."AnchorRecordKeyJSON" IS 'Optional JSON representation of a composite anchor key.';


--
-- Name: COLUMN "Score"."RawScore"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Score"."RawScore" IS 'Pre-scale combined value before mapping to the output scale.';


--
-- Name: COLUMN "Score"."NormalizedScore"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Score"."NormalizedScore" IS 'The headline score on the model''s output scale (e.g. 0-100).';


--
-- Name: COLUMN "Score"."PreviousNormalizedScore"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Score"."PreviousNormalizedScore" IS 'The normalized score from the previous computation, for delta/trend.';


--
-- Name: COLUMN "Score"."Delta"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Score"."Delta" IS 'Change in normalized score versus the previous value over the trend window.';


--
-- Name: COLUMN "Score"."TrendDirection"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Score"."TrendDirection" IS 'Direction of recent movement: Up, Down, or Flat.';


--
-- Name: COLUMN "Score"."TrendSlope"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Score"."TrendSlope" IS 'Regression slope of the score over recent history.';


--
-- Name: COLUMN "Score"."Confidence"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Score"."Confidence" IS 'Confidence in the score (0-1), derived from data completeness.';


--
-- Name: COLUMN "Score"."DataCompleteness"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Score"."DataCompleteness" IS 'Fraction of factors that had data when the score was computed (0-1).';


--
-- Name: COLUMN "Score"."ComputedAt"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Score"."ComputedAt" IS 'UTC timestamp at which this score was computed.';


--
-- Name: COLUMN "Score"."AsOfDate"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Score"."AsOfDate" IS 'The "now" the time windows resolved against for this score.';


--
-- Name: COLUMN "Score"."NextRecomputeAt"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Score"."NextRecomputeAt" IS 'Optional scheduled time for the next recompute of this score.';


--
-- Name: COLUMN "Score"."IsStale"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Score"."IsStale" IS 'Indicates population statistics moved but this record has not yet been recomputed.';


--
-- Name: COLUMN "Score"."ExplanationSummary"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."Score"."ExplanationSummary" IS 'Cached natural-language explanation of the score, refreshed on material change.';


--
-- Name: vwScores; Type: VIEW; Schema: __mj_bizappssonar; Owner: -
--

CREATE VIEW __mj_bizappssonar."vwScores" AS
 SELECT s."ID",
    s."ScoreModelID",
    s."ScoreModelVersionID",
    s."AnchorEntityID",
    s."AnchorRecordID",
    s."AnchorRecordKeyJSON",
    s."RawScore",
    s."NormalizedScore",
    s."BandID",
    s."PreviousNormalizedScore",
    s."PreviousBandID",
    s."Delta",
    s."TrendDirection",
    s."TrendSlope",
    s."Confidence",
    s."DataCompleteness",
    s."ComputedAt",
    s."AsOfDate",
    s."NextRecomputeAt",
    s."IsStale",
    s."ExplanationSummary",
    s."__mj_CreatedAt",
    s."__mj_UpdatedAt",
    mjbizappssonarscoremodel_scoremodelid."Name" AS "ScoreModel",
    mjentity_anchorentityid."Name" AS "AnchorEntity"
   FROM ((__mj_bizappssonar."Score" s
     JOIN __mj_bizappssonar."ScoreModel" mjbizappssonarscoremodel_scoremodelid ON ((s."ScoreModelID" = mjbizappssonarscoremodel_scoremodelid."ID")))
     JOIN __mj."Entity" mjentity_anchorentityid ON ((s."AnchorEntityID" = mjentity_anchorentityid."ID")));


--
-- Name: spCreateScore(uuid, uuid, uuid, uuid, character varying, boolean, text, boolean, numeric, boolean, numeric, boolean, uuid, boolean, numeric, boolean, uuid, boolean, numeric, boolean, character varying, boolean, numeric, boolean, numeric, boolean, numeric, timestamp with time zone, boolean, timestamp with time zone, boolean, timestamp with time zone, boolean, boolean, text); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spCreateScore"(p_id uuid DEFAULT NULL::uuid, p_scoremodelid uuid DEFAULT NULL::uuid, p_scoremodelversionid uuid DEFAULT NULL::uuid, p_anchorentityid uuid DEFAULT NULL::uuid, p_anchorrecordid character varying DEFAULT NULL::character varying, p_anchorrecordkeyjson_clear boolean DEFAULT false, p_anchorrecordkeyjson text DEFAULT NULL::text, p_rawscore_clear boolean DEFAULT false, p_rawscore numeric DEFAULT NULL::numeric, p_normalizedscore_clear boolean DEFAULT false, p_normalizedscore numeric DEFAULT NULL::numeric, p_bandid_clear boolean DEFAULT false, p_bandid uuid DEFAULT NULL::uuid, p_previousnormalizedscore_clear boolean DEFAULT false, p_previousnormalizedscore numeric DEFAULT NULL::numeric, p_previousbandid_clear boolean DEFAULT false, p_previousbandid uuid DEFAULT NULL::uuid, p_delta_clear boolean DEFAULT false, p_delta numeric DEFAULT NULL::numeric, p_trenddirection_clear boolean DEFAULT false, p_trenddirection character varying DEFAULT NULL::character varying, p_trendslope_clear boolean DEFAULT false, p_trendslope numeric DEFAULT NULL::numeric, p_confidence_clear boolean DEFAULT false, p_confidence numeric DEFAULT NULL::numeric, p_datacompleteness_clear boolean DEFAULT false, p_datacompleteness numeric DEFAULT NULL::numeric, p_computedat timestamp with time zone DEFAULT NULL::timestamp with time zone, p_asofdate_clear boolean DEFAULT false, p_asofdate timestamp with time zone DEFAULT NULL::timestamp with time zone, p_nextrecomputeat_clear boolean DEFAULT false, p_nextrecomputeat timestamp with time zone DEFAULT NULL::timestamp with time zone, p_isstale boolean DEFAULT NULL::boolean, p_explanationsummary_clear boolean DEFAULT false, p_explanationsummary text DEFAULT NULL::text) RETURNS SETOF __mj_bizappssonar."vwScores"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_new_id UUID;
BEGIN
    v_new_id := COALESCE(p_id, gen_random_uuid());
    INSERT INTO __mj_bizappssonar."Score"
        (
            "ID",
            "ScoreModelID",
                "ScoreModelVersionID",
                "AnchorEntityID",
                "AnchorRecordID",
                "AnchorRecordKeyJSON",
                "RawScore",
                "NormalizedScore",
                "BandID",
                "PreviousNormalizedScore",
                "PreviousBandID",
                "Delta",
                "TrendDirection",
                "TrendSlope",
                "Confidence",
                "DataCompleteness",
                "ComputedAt",
                "AsOfDate",
                "NextRecomputeAt",
                "IsStale",
                "ExplanationSummary"
        )
    VALUES
        (
            v_new_id,
            p_scoremodelid,
                p_scoremodelversionid,
                p_anchorentityid,
                p_anchorrecordid,
                CASE WHEN p_anchorrecordkeyjson_clear = true THEN NULL ELSE COALESCE(p_anchorrecordkeyjson, NULL) END,
                CASE WHEN p_rawscore_clear = true THEN NULL ELSE COALESCE(p_rawscore, NULL) END,
                CASE WHEN p_normalizedscore_clear = true THEN NULL ELSE COALESCE(p_normalizedscore, NULL) END,
                CASE WHEN p_bandid_clear = true THEN NULL ELSE COALESCE(p_bandid, NULL) END,
                CASE WHEN p_previousnormalizedscore_clear = true THEN NULL ELSE COALESCE(p_previousnormalizedscore, NULL) END,
                CASE WHEN p_previousbandid_clear = true THEN NULL ELSE COALESCE(p_previousbandid, NULL) END,
                CASE WHEN p_delta_clear = true THEN NULL ELSE COALESCE(p_delta, NULL) END,
                CASE WHEN p_trenddirection_clear = true THEN NULL ELSE COALESCE(p_trenddirection, NULL) END,
                CASE WHEN p_trendslope_clear = true THEN NULL ELSE COALESCE(p_trendslope, NULL) END,
                CASE WHEN p_confidence_clear = true THEN NULL ELSE COALESCE(p_confidence, NULL) END,
                CASE WHEN p_datacompleteness_clear = true THEN NULL ELSE COALESCE(p_datacompleteness, NULL) END,
                COALESCE(p_computedat, NOW() AT TIME ZONE 'UTC'),
                CASE WHEN p_asofdate_clear = true THEN NULL ELSE COALESCE(p_asofdate, NULL) END,
                CASE WHEN p_nextrecomputeat_clear = true THEN NULL ELSE COALESCE(p_nextrecomputeat, NULL) END,
                COALESCE(p_isstale, FALSE),
                CASE WHEN p_explanationsummary_clear = true THEN NULL ELSE COALESCE(p_explanationsummary, NULL) END
        )
    ;

    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwScores"
    WHERE "ID" = v_new_id;
END;
$$;


--
-- Name: ScoreBand; Type: TABLE; Schema: __mj_bizappssonar; Owner: -
--

CREATE TABLE __mj_bizappssonar."ScoreBand" (
    "ID" uuid DEFAULT gen_random_uuid() NOT NULL,
    "BandSetID" uuid NOT NULL,
    "Label" character varying(60) NOT NULL,
    "MinScore" numeric(9,4) NOT NULL,
    "MaxScore" numeric(9,4) NOT NULL,
    "Severity" integer DEFAULT 0 NOT NULL,
    "ColorHex" character varying(7),
    "IsTerminal" boolean DEFAULT false NOT NULL,
    "Description" text,
    "__mj_CreatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    "__mj_UpdatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL
);


--
-- Name: TABLE "ScoreBand"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON TABLE __mj_bizappssonar."ScoreBand" IS 'One qualitative band within a band set, defined by a half-open score range with a severity and color for sorting and display.';


--
-- Name: COLUMN "ScoreBand"."Label"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreBand"."Label" IS 'Display label for the band, e.g. Healthy, Watch, At-Risk, Critical.';


--
-- Name: COLUMN "ScoreBand"."MinScore"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreBand"."MinScore" IS 'Inclusive lower bound of the band score range.';


--
-- Name: COLUMN "ScoreBand"."MaxScore"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreBand"."MaxScore" IS 'Exclusive upper bound of the band score range (half-open; ranges are contiguous and non-overlapping).';


--
-- Name: COLUMN "ScoreBand"."Severity"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreBand"."Severity" IS 'Severity rank where 0 is best and higher numbers are worse; drives sort order and color.';


--
-- Name: COLUMN "ScoreBand"."ColorHex"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreBand"."ColorHex" IS 'Hex color code (e.g. #2E7D32) used to render the band in the UI.';


--
-- Name: COLUMN "ScoreBand"."IsTerminal"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreBand"."IsTerminal" IS 'Indicates a terminal band (e.g. Lapsed) that represents an end state rather than a point on the continuum.';


--
-- Name: COLUMN "ScoreBand"."Description"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreBand"."Description" IS 'Optional description of what this band means.';


--
-- Name: ScoreBandSet; Type: TABLE; Schema: __mj_bizappssonar; Owner: -
--

CREATE TABLE __mj_bizappssonar."ScoreBandSet" (
    "ID" uuid DEFAULT gen_random_uuid() NOT NULL,
    "Name" character varying(200) NOT NULL,
    "AnchorEntityID" uuid,
    "Description" text,
    "__mj_CreatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    "__mj_UpdatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL
);


--
-- Name: TABLE "ScoreBandSet"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON TABLE __mj_bizappssonar."ScoreBandSet" IS 'A reusable, named set of qualitative score bands (e.g. Healthy / Watch / At-Risk / Critical) that can be shared across scoring models.';


--
-- Name: COLUMN "ScoreBandSet"."Name"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreBandSet"."Name" IS 'Display name of the band set.';


--
-- Name: COLUMN "ScoreBandSet"."Description"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreBandSet"."Description" IS 'Optional description of the band set and its intended use.';


--
-- Name: vwScoreBands; Type: VIEW; Schema: __mj_bizappssonar; Owner: -
--

CREATE VIEW __mj_bizappssonar."vwScoreBands" AS
 SELECT s."ID",
    s."BandSetID",
    s."Label",
    s."MinScore",
    s."MaxScore",
    s."Severity",
    s."ColorHex",
    s."IsTerminal",
    s."Description",
    s."__mj_CreatedAt",
    s."__mj_UpdatedAt",
    mjbizappssonarscorebandset_bandsetid."Name" AS "BandSet"
   FROM (__mj_bizappssonar."ScoreBand" s
     JOIN __mj_bizappssonar."ScoreBandSet" mjbizappssonarscorebandset_bandsetid ON ((s."BandSetID" = mjbizappssonarscorebandset_bandsetid."ID")));


--
-- Name: spCreateScoreBand(uuid, uuid, character varying, numeric, numeric, integer, boolean, character varying, boolean, boolean, text); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spCreateScoreBand"(p_id uuid DEFAULT NULL::uuid, p_bandsetid uuid DEFAULT NULL::uuid, p_label character varying DEFAULT NULL::character varying, p_minscore numeric DEFAULT NULL::numeric, p_maxscore numeric DEFAULT NULL::numeric, p_severity integer DEFAULT NULL::integer, p_colorhex_clear boolean DEFAULT false, p_colorhex character varying DEFAULT NULL::character varying, p_isterminal boolean DEFAULT NULL::boolean, p_description_clear boolean DEFAULT false, p_description text DEFAULT NULL::text) RETURNS SETOF __mj_bizappssonar."vwScoreBands"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_new_id UUID;
BEGIN
    v_new_id := COALESCE(p_id, gen_random_uuid());
    INSERT INTO __mj_bizappssonar."ScoreBand"
        (
            "ID",
            "BandSetID",
                "Label",
                "MinScore",
                "MaxScore",
                "Severity",
                "ColorHex",
                "IsTerminal",
                "Description"
        )
    VALUES
        (
            v_new_id,
            p_bandsetid,
                p_label,
                p_minscore,
                p_maxscore,
                COALESCE(p_severity, 0),
                CASE WHEN p_colorhex_clear = true THEN NULL ELSE COALESCE(p_colorhex, NULL) END,
                COALESCE(p_isterminal, FALSE),
                CASE WHEN p_description_clear = true THEN NULL ELSE COALESCE(p_description, NULL) END
        )
    ;

    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwScoreBands"
    WHERE "ID" = v_new_id;
END;
$$;


--
-- Name: vwScoreBandSets; Type: VIEW; Schema: __mj_bizappssonar; Owner: -
--

CREATE VIEW __mj_bizappssonar."vwScoreBandSets" AS
 SELECT s."ID",
    s."Name",
    s."AnchorEntityID",
    s."Description",
    s."__mj_CreatedAt",
    s."__mj_UpdatedAt",
    mjentity_anchorentityid."Name" AS "AnchorEntity"
   FROM (__mj_bizappssonar."ScoreBandSet" s
     LEFT JOIN __mj."Entity" mjentity_anchorentityid ON ((s."AnchorEntityID" = mjentity_anchorentityid."ID")));


--
-- Name: spCreateScoreBandSet(uuid, character varying, boolean, uuid, boolean, text); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spCreateScoreBandSet"(p_id uuid DEFAULT NULL::uuid, p_name character varying DEFAULT NULL::character varying, p_anchorentityid_clear boolean DEFAULT false, p_anchorentityid uuid DEFAULT NULL::uuid, p_description_clear boolean DEFAULT false, p_description text DEFAULT NULL::text) RETURNS SETOF __mj_bizappssonar."vwScoreBandSets"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_new_id UUID;
BEGIN
    v_new_id := COALESCE(p_id, gen_random_uuid());
    INSERT INTO __mj_bizappssonar."ScoreBandSet"
        (
            "ID",
            "Name",
                "AnchorEntityID",
                "Description"
        )
    VALUES
        (
            v_new_id,
            p_name,
                CASE WHEN p_anchorentityid_clear = true THEN NULL ELSE COALESCE(p_anchorentityid, NULL) END,
                CASE WHEN p_description_clear = true THEN NULL ELSE COALESCE(p_description, NULL) END
        )
    ;

    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwScoreBandSets"
    WHERE "ID" = v_new_id;
END;
$$;


--
-- Name: ScoreBandTransition; Type: TABLE; Schema: __mj_bizappssonar; Owner: -
--

CREATE TABLE __mj_bizappssonar."ScoreBandTransition" (
    "ID" uuid DEFAULT gen_random_uuid() NOT NULL,
    "ScoreModelID" uuid NOT NULL,
    "AnchorRecordID" character varying(450) NOT NULL,
    "FromBandID" uuid,
    "ToBandID" uuid,
    "Direction" character varying(12),
    "OccurredAt" timestamp with time zone DEFAULT now() NOT NULL,
    "RecomputeRunID" uuid,
    "Handled" boolean DEFAULT false NOT NULL,
    "__mj_CreatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    "__mj_UpdatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    CONSTRAINT "CK_ScoreBandTransition_Direction" CHECK ((("Direction")::text = ANY ((ARRAY['Improving'::character varying, 'Worsening'::character varying])::text[])))
);


--
-- Name: TABLE "ScoreBandTransition"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON TABLE __mj_bizappssonar."ScoreBandTransition" IS 'First-class record of a band crossing; the event the action layer and write-back key off.';


--
-- Name: COLUMN "ScoreBandTransition"."AnchorRecordID"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreBandTransition"."AnchorRecordID" IS 'Primary-key value of the anchor record that crossed bands, stored as a string to stay entity-agnostic.';


--
-- Name: COLUMN "ScoreBandTransition"."Direction"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreBandTransition"."Direction" IS 'Direction of the crossing: Improving or Worsening.';


--
-- Name: COLUMN "ScoreBandTransition"."OccurredAt"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreBandTransition"."OccurredAt" IS 'UTC timestamp at which the band crossing occurred.';


--
-- Name: COLUMN "ScoreBandTransition"."Handled"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreBandTransition"."Handled" IS 'Indicates whether the transition has been picked up by write-back or an intervention.';


--
-- Name: vwScoreBandTransitions; Type: VIEW; Schema: __mj_bizappssonar; Owner: -
--

CREATE VIEW __mj_bizappssonar."vwScoreBandTransitions" AS
 SELECT s."ID",
    s."ScoreModelID",
    s."AnchorRecordID",
    s."FromBandID",
    s."ToBandID",
    s."Direction",
    s."OccurredAt",
    s."RecomputeRunID",
    s."Handled",
    s."__mj_CreatedAt",
    s."__mj_UpdatedAt",
    mjbizappssonarscoremodel_scoremodelid."Name" AS "ScoreModel"
   FROM (__mj_bizappssonar."ScoreBandTransition" s
     JOIN __mj_bizappssonar."ScoreModel" mjbizappssonarscoremodel_scoremodelid ON ((s."ScoreModelID" = mjbizappssonarscoremodel_scoremodelid."ID")));


--
-- Name: spCreateScoreBandTransition(uuid, uuid, character varying, boolean, uuid, boolean, uuid, boolean, character varying, timestamp with time zone, boolean, uuid, boolean); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spCreateScoreBandTransition"(p_id uuid DEFAULT NULL::uuid, p_scoremodelid uuid DEFAULT NULL::uuid, p_anchorrecordid character varying DEFAULT NULL::character varying, p_frombandid_clear boolean DEFAULT false, p_frombandid uuid DEFAULT NULL::uuid, p_tobandid_clear boolean DEFAULT false, p_tobandid uuid DEFAULT NULL::uuid, p_direction_clear boolean DEFAULT false, p_direction character varying DEFAULT NULL::character varying, p_occurredat timestamp with time zone DEFAULT NULL::timestamp with time zone, p_recomputerunid_clear boolean DEFAULT false, p_recomputerunid uuid DEFAULT NULL::uuid, p_handled boolean DEFAULT NULL::boolean) RETURNS SETOF __mj_bizappssonar."vwScoreBandTransitions"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_new_id UUID;
BEGIN
    v_new_id := COALESCE(p_id, gen_random_uuid());
    INSERT INTO __mj_bizappssonar."ScoreBandTransition"
        (
            "ID",
            "ScoreModelID",
                "AnchorRecordID",
                "FromBandID",
                "ToBandID",
                "Direction",
                "OccurredAt",
                "RecomputeRunID",
                "Handled"
        )
    VALUES
        (
            v_new_id,
            p_scoremodelid,
                p_anchorrecordid,
                CASE WHEN p_frombandid_clear = true THEN NULL ELSE COALESCE(p_frombandid, NULL) END,
                CASE WHEN p_tobandid_clear = true THEN NULL ELSE COALESCE(p_tobandid, NULL) END,
                CASE WHEN p_direction_clear = true THEN NULL ELSE COALESCE(p_direction, NULL) END,
                COALESCE(p_occurredat, NOW() AT TIME ZONE 'UTC'),
                CASE WHEN p_recomputerunid_clear = true THEN NULL ELSE COALESCE(p_recomputerunid, NULL) END,
                COALESCE(p_handled, FALSE)
        )
    ;

    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwScoreBandTransitions"
    WHERE "ID" = v_new_id;
END;
$$;


--
-- Name: ScoreFactorContribution; Type: TABLE; Schema: __mj_bizappssonar; Owner: -
--

CREATE TABLE __mj_bizappssonar."ScoreFactorContribution" (
    "ID" uuid DEFAULT gen_random_uuid() NOT NULL,
    "ScoreID" uuid NOT NULL,
    "ModelFactorID" uuid NOT NULL,
    "FactorID" uuid NOT NULL,
    "RawValue" numeric(18,6),
    "NormalizedValue" numeric(9,4),
    "WeightedContribution" numeric(12,4),
    "PercentOfTotal" numeric(5,4),
    "ContributionDelta" numeric(12,4),
    "HadData" boolean DEFAULT false NOT NULL,
    "MissingDataApplied" boolean DEFAULT false NOT NULL,
    "DetailJSON" text,
    "__mj_CreatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    "__mj_UpdatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL
);


--
-- Name: TABLE "ScoreFactorContribution"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON TABLE __mj_bizappssonar."ScoreFactorContribution" IS 'Per-factor breakdown of a current score; the explainability spine that makes the score narrative free.';


--
-- Name: COLUMN "ScoreFactorContribution"."RawValue"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreFactorContribution"."RawValue" IS 'Raw value the factor produced before normalization.';


--
-- Name: COLUMN "ScoreFactorContribution"."NormalizedValue"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreFactorContribution"."NormalizedValue" IS 'The factor''s normalized output (e.g. 0-1 or configured range).';


--
-- Name: COLUMN "ScoreFactorContribution"."WeightedContribution"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreFactorContribution"."WeightedContribution" IS 'Amount this factor added to the score after weighting.';


--
-- Name: COLUMN "ScoreFactorContribution"."PercentOfTotal"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreFactorContribution"."PercentOfTotal" IS 'Share of the total score attributable to this factor.';


--
-- Name: COLUMN "ScoreFactorContribution"."ContributionDelta"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreFactorContribution"."ContributionDelta" IS 'Change in this factor''s contribution versus the previous score.';


--
-- Name: COLUMN "ScoreFactorContribution"."HadData"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreFactorContribution"."HadData" IS 'Indicates whether the factor had data for this record.';


--
-- Name: COLUMN "ScoreFactorContribution"."MissingDataApplied"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreFactorContribution"."MissingDataApplied" IS 'Indicates whether a missing-data policy was applied for this factor.';


--
-- Name: COLUMN "ScoreFactorContribution"."DetailJSON"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreFactorContribution"."DetailJSON" IS 'Optional JSON with sampled underlying record references for drill-through.';


--
-- Name: vwScoreFactorContributions; Type: VIEW; Schema: __mj_bizappssonar; Owner: -
--

CREATE VIEW __mj_bizappssonar."vwScoreFactorContributions" AS
 SELECT s."ID",
    s."ScoreID",
    s."ModelFactorID",
    s."FactorID",
    s."RawValue",
    s."NormalizedValue",
    s."WeightedContribution",
    s."PercentOfTotal",
    s."ContributionDelta",
    s."HadData",
    s."MissingDataApplied",
    s."DetailJSON",
    s."__mj_CreatedAt",
    s."__mj_UpdatedAt",
    mjbizappssonarfactor_factorid."Name" AS "Factor"
   FROM (__mj_bizappssonar."ScoreFactorContribution" s
     JOIN __mj_bizappssonar."Factor" mjbizappssonarfactor_factorid ON ((s."FactorID" = mjbizappssonarfactor_factorid."ID")));


--
-- Name: spCreateScoreFactorContribution(uuid, uuid, uuid, uuid, boolean, numeric, boolean, numeric, boolean, numeric, boolean, numeric, boolean, numeric, boolean, boolean, boolean, text); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spCreateScoreFactorContribution"(p_id uuid DEFAULT NULL::uuid, p_scoreid uuid DEFAULT NULL::uuid, p_modelfactorid uuid DEFAULT NULL::uuid, p_factorid uuid DEFAULT NULL::uuid, p_rawvalue_clear boolean DEFAULT false, p_rawvalue numeric DEFAULT NULL::numeric, p_normalizedvalue_clear boolean DEFAULT false, p_normalizedvalue numeric DEFAULT NULL::numeric, p_weightedcontribution_clear boolean DEFAULT false, p_weightedcontribution numeric DEFAULT NULL::numeric, p_percentoftotal_clear boolean DEFAULT false, p_percentoftotal numeric DEFAULT NULL::numeric, p_contributiondelta_clear boolean DEFAULT false, p_contributiondelta numeric DEFAULT NULL::numeric, p_haddata boolean DEFAULT NULL::boolean, p_missingdataapplied boolean DEFAULT NULL::boolean, p_detailjson_clear boolean DEFAULT false, p_detailjson text DEFAULT NULL::text) RETURNS SETOF __mj_bizappssonar."vwScoreFactorContributions"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_new_id UUID;
BEGIN
    v_new_id := COALESCE(p_id, gen_random_uuid());
    INSERT INTO __mj_bizappssonar."ScoreFactorContribution"
        (
            "ID",
            "ScoreID",
                "ModelFactorID",
                "FactorID",
                "RawValue",
                "NormalizedValue",
                "WeightedContribution",
                "PercentOfTotal",
                "ContributionDelta",
                "HadData",
                "MissingDataApplied",
                "DetailJSON"
        )
    VALUES
        (
            v_new_id,
            p_scoreid,
                p_modelfactorid,
                p_factorid,
                CASE WHEN p_rawvalue_clear = true THEN NULL ELSE COALESCE(p_rawvalue, NULL) END,
                CASE WHEN p_normalizedvalue_clear = true THEN NULL ELSE COALESCE(p_normalizedvalue, NULL) END,
                CASE WHEN p_weightedcontribution_clear = true THEN NULL ELSE COALESCE(p_weightedcontribution, NULL) END,
                CASE WHEN p_percentoftotal_clear = true THEN NULL ELSE COALESCE(p_percentoftotal, NULL) END,
                CASE WHEN p_contributiondelta_clear = true THEN NULL ELSE COALESCE(p_contributiondelta, NULL) END,
                COALESCE(p_haddata, FALSE),
                COALESCE(p_missingdataapplied, FALSE),
                CASE WHEN p_detailjson_clear = true THEN NULL ELSE COALESCE(p_detailjson, NULL) END
        )
    ;

    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwScoreFactorContributions"
    WHERE "ID" = v_new_id;
END;
$$;


--
-- Name: ScoreHistory; Type: TABLE; Schema: __mj_bizappssonar; Owner: -
--

CREATE TABLE __mj_bizappssonar."ScoreHistory" (
    "ID" uuid DEFAULT gen_random_uuid() NOT NULL,
    "ScoreModelID" uuid NOT NULL,
    "ScoreModelVersionID" uuid NOT NULL,
    "AnchorEntityID" uuid NOT NULL,
    "AnchorRecordID" character varying(450) NOT NULL,
    "NormalizedScore" numeric(9,4),
    "BandID" uuid,
    "AsOfDate" timestamp with time zone,
    "ComputedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "DataCompleteness" numeric(5,4),
    "Confidence" numeric(5,4),
    "ContributionsJSON" text,
    "__mj_CreatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    "__mj_UpdatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL
);


--
-- Name: TABLE "ScoreHistory"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON TABLE __mj_bizappssonar."ScoreHistory" IS 'Append-only time-series snapshots of scores; the trajectory is the asset. Snapshot on change plus periodic keyframes.';


--
-- Name: COLUMN "ScoreHistory"."AnchorRecordID"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreHistory"."AnchorRecordID" IS 'Primary-key value of the scored anchor record, stored as a string to stay entity-agnostic.';


--
-- Name: COLUMN "ScoreHistory"."NormalizedScore"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreHistory"."NormalizedScore" IS 'The headline normalized score at this point in time.';


--
-- Name: COLUMN "ScoreHistory"."AsOfDate"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreHistory"."AsOfDate" IS 'The "now" the time windows resolved against for this snapshot.';


--
-- Name: COLUMN "ScoreHistory"."ComputedAt"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreHistory"."ComputedAt" IS 'UTC timestamp at which this snapshot was computed.';


--
-- Name: COLUMN "ScoreHistory"."DataCompleteness"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreHistory"."DataCompleteness" IS 'Fraction of factors that had data at this point in time (0-1).';


--
-- Name: COLUMN "ScoreHistory"."Confidence"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreHistory"."Confidence" IS 'Confidence in the score at this point in time (0-1).';


--
-- Name: COLUMN "ScoreHistory"."ContributionsJSON"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreHistory"."ContributionsJSON" IS 'Compact per-factor snapshot (JSON) for point-in-time explainability without exploding row counts.';


--
-- Name: vwScoreHistories; Type: VIEW; Schema: __mj_bizappssonar; Owner: -
--

CREATE VIEW __mj_bizappssonar."vwScoreHistories" AS
 SELECT s."ID",
    s."ScoreModelID",
    s."ScoreModelVersionID",
    s."AnchorEntityID",
    s."AnchorRecordID",
    s."NormalizedScore",
    s."BandID",
    s."AsOfDate",
    s."ComputedAt",
    s."DataCompleteness",
    s."Confidence",
    s."ContributionsJSON",
    s."__mj_CreatedAt",
    s."__mj_UpdatedAt",
    mjbizappssonarscoremodel_scoremodelid."Name" AS "ScoreModel",
    mjentity_anchorentityid."Name" AS "AnchorEntity"
   FROM ((__mj_bizappssonar."ScoreHistory" s
     JOIN __mj_bizappssonar."ScoreModel" mjbizappssonarscoremodel_scoremodelid ON ((s."ScoreModelID" = mjbizappssonarscoremodel_scoremodelid."ID")))
     JOIN __mj."Entity" mjentity_anchorentityid ON ((s."AnchorEntityID" = mjentity_anchorentityid."ID")));


--
-- Name: spCreateScoreHistory(uuid, uuid, uuid, uuid, character varying, boolean, numeric, boolean, uuid, boolean, timestamp with time zone, timestamp with time zone, boolean, numeric, boolean, numeric, boolean, text); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spCreateScoreHistory"(p_id uuid DEFAULT NULL::uuid, p_scoremodelid uuid DEFAULT NULL::uuid, p_scoremodelversionid uuid DEFAULT NULL::uuid, p_anchorentityid uuid DEFAULT NULL::uuid, p_anchorrecordid character varying DEFAULT NULL::character varying, p_normalizedscore_clear boolean DEFAULT false, p_normalizedscore numeric DEFAULT NULL::numeric, p_bandid_clear boolean DEFAULT false, p_bandid uuid DEFAULT NULL::uuid, p_asofdate_clear boolean DEFAULT false, p_asofdate timestamp with time zone DEFAULT NULL::timestamp with time zone, p_computedat timestamp with time zone DEFAULT NULL::timestamp with time zone, p_datacompleteness_clear boolean DEFAULT false, p_datacompleteness numeric DEFAULT NULL::numeric, p_confidence_clear boolean DEFAULT false, p_confidence numeric DEFAULT NULL::numeric, p_contributionsjson_clear boolean DEFAULT false, p_contributionsjson text DEFAULT NULL::text) RETURNS SETOF __mj_bizappssonar."vwScoreHistories"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_new_id UUID;
BEGIN
    v_new_id := COALESCE(p_id, gen_random_uuid());
    INSERT INTO __mj_bizappssonar."ScoreHistory"
        (
            "ID",
            "ScoreModelID",
                "ScoreModelVersionID",
                "AnchorEntityID",
                "AnchorRecordID",
                "NormalizedScore",
                "BandID",
                "AsOfDate",
                "ComputedAt",
                "DataCompleteness",
                "Confidence",
                "ContributionsJSON"
        )
    VALUES
        (
            v_new_id,
            p_scoremodelid,
                p_scoremodelversionid,
                p_anchorentityid,
                p_anchorrecordid,
                CASE WHEN p_normalizedscore_clear = true THEN NULL ELSE COALESCE(p_normalizedscore, NULL) END,
                CASE WHEN p_bandid_clear = true THEN NULL ELSE COALESCE(p_bandid, NULL) END,
                CASE WHEN p_asofdate_clear = true THEN NULL ELSE COALESCE(p_asofdate, NULL) END,
                COALESCE(p_computedat, NOW() AT TIME ZONE 'UTC'),
                CASE WHEN p_datacompleteness_clear = true THEN NULL ELSE COALESCE(p_datacompleteness, NULL) END,
                CASE WHEN p_confidence_clear = true THEN NULL ELSE COALESCE(p_confidence, NULL) END,
                CASE WHEN p_contributionsjson_clear = true THEN NULL ELSE COALESCE(p_contributionsjson, NULL) END
        )
    ;

    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwScoreHistories"
    WHERE "ID" = v_new_id;
END;
$$;


--
-- Name: vwScoreModels; Type: VIEW; Schema: __mj_bizappssonar; Owner: -
--

CREATE VIEW __mj_bizappssonar."vwScoreModels" AS
 SELECT s."ID",
    s."Name",
    s."Slug",
    s."Description",
    s."AnchorEntityID",
    s."Status",
    s."CurrentVersionID",
    s."ScoreScaleMin",
    s."ScoreScaleMax",
    s."CombineStrategy",
    s."CombineExpression",
    s."BandSetID",
    s."PopulationFilter",
    s."RecomputeMode",
    s."RecomputeCron",
    s."AsOfStrategy",
    s."IsCalibrated",
    s."TrendWindowDays",
    s."OwnerUserID",
    s."EffectiveFrom",
    s."EffectiveTo",
    s."Notes",
    s."__mj_CreatedAt",
    s."__mj_UpdatedAt",
    mjentity_anchorentityid."Name" AS "AnchorEntity",
    mjbizappssonarscorebandset_bandsetid."Name" AS "BandSet",
    mjuser_owneruserid."Name" AS "OwnerUser"
   FROM (((__mj_bizappssonar."ScoreModel" s
     JOIN __mj."Entity" mjentity_anchorentityid ON ((s."AnchorEntityID" = mjentity_anchorentityid."ID")))
     LEFT JOIN __mj_bizappssonar."ScoreBandSet" mjbizappssonarscorebandset_bandsetid ON ((s."BandSetID" = mjbizappssonarscorebandset_bandsetid."ID")))
     LEFT JOIN __mj."User" mjuser_owneruserid ON ((s."OwnerUserID" = mjuser_owneruserid."ID")));


--
-- Name: spCreateScoreModel(uuid, character varying, character varying, boolean, text, uuid, character varying, boolean, uuid, numeric, numeric, character varying, boolean, text, boolean, uuid, boolean, text, character varying, boolean, character varying, character varying, boolean, boolean, integer, boolean, uuid, boolean, timestamp with time zone, boolean, timestamp with time zone, boolean, text); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spCreateScoreModel"(p_id uuid DEFAULT NULL::uuid, p_name character varying DEFAULT NULL::character varying, p_slug character varying DEFAULT NULL::character varying, p_description_clear boolean DEFAULT false, p_description text DEFAULT NULL::text, p_anchorentityid uuid DEFAULT NULL::uuid, p_status character varying DEFAULT NULL::character varying, p_currentversionid_clear boolean DEFAULT false, p_currentversionid uuid DEFAULT NULL::uuid, p_scorescalemin numeric DEFAULT NULL::numeric, p_scorescalemax numeric DEFAULT NULL::numeric, p_combinestrategy character varying DEFAULT NULL::character varying, p_combineexpression_clear boolean DEFAULT false, p_combineexpression text DEFAULT NULL::text, p_bandsetid_clear boolean DEFAULT false, p_bandsetid uuid DEFAULT NULL::uuid, p_populationfilter_clear boolean DEFAULT false, p_populationfilter text DEFAULT NULL::text, p_recomputemode character varying DEFAULT NULL::character varying, p_recomputecron_clear boolean DEFAULT false, p_recomputecron character varying DEFAULT NULL::character varying, p_asofstrategy character varying DEFAULT NULL::character varying, p_iscalibrated boolean DEFAULT NULL::boolean, p_trendwindowdays_clear boolean DEFAULT false, p_trendwindowdays integer DEFAULT NULL::integer, p_owneruserid_clear boolean DEFAULT false, p_owneruserid uuid DEFAULT NULL::uuid, p_effectivefrom_clear boolean DEFAULT false, p_effectivefrom timestamp with time zone DEFAULT NULL::timestamp with time zone, p_effectiveto_clear boolean DEFAULT false, p_effectiveto timestamp with time zone DEFAULT NULL::timestamp with time zone, p_notes_clear boolean DEFAULT false, p_notes text DEFAULT NULL::text) RETURNS SETOF __mj_bizappssonar."vwScoreModels"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_new_id UUID;
BEGIN
    v_new_id := COALESCE(p_id, gen_random_uuid());
    INSERT INTO __mj_bizappssonar."ScoreModel"
        (
            "ID",
            "Name",
                "Slug",
                "Description",
                "AnchorEntityID",
                "Status",
                "CurrentVersionID",
                "ScoreScaleMin",
                "ScoreScaleMax",
                "CombineStrategy",
                "CombineExpression",
                "BandSetID",
                "PopulationFilter",
                "RecomputeMode",
                "RecomputeCron",
                "AsOfStrategy",
                "IsCalibrated",
                "TrendWindowDays",
                "OwnerUserID",
                "EffectiveFrom",
                "EffectiveTo",
                "Notes"
        )
    VALUES
        (
            v_new_id,
            p_name,
                p_slug,
                CASE WHEN p_description_clear = true THEN NULL ELSE COALESCE(p_description, NULL) END,
                p_anchorentityid,
                COALESCE(p_status, 'Draft'),
                CASE WHEN p_currentversionid_clear = true THEN NULL ELSE COALESCE(p_currentversionid, NULL) END,
                COALESCE(p_scorescalemin, 0),
                COALESCE(p_scorescalemax, 100),
                COALESCE(p_combinestrategy, 'WeightedSum'),
                CASE WHEN p_combineexpression_clear = true THEN NULL ELSE COALESCE(p_combineexpression, NULL) END,
                CASE WHEN p_bandsetid_clear = true THEN NULL ELSE COALESCE(p_bandsetid, NULL) END,
                CASE WHEN p_populationfilter_clear = true THEN NULL ELSE COALESCE(p_populationfilter, NULL) END,
                COALESCE(p_recomputemode, 'Scheduled'),
                CASE WHEN p_recomputecron_clear = true THEN NULL ELSE COALESCE(p_recomputecron, NULL) END,
                COALESCE(p_asofstrategy, 'RunTime'),
                COALESCE(p_iscalibrated, FALSE),
                CASE WHEN p_trendwindowdays_clear = true THEN NULL ELSE COALESCE(p_trendwindowdays, NULL) END,
                CASE WHEN p_owneruserid_clear = true THEN NULL ELSE COALESCE(p_owneruserid, NULL) END,
                CASE WHEN p_effectivefrom_clear = true THEN NULL ELSE COALESCE(p_effectivefrom, NULL) END,
                CASE WHEN p_effectiveto_clear = true THEN NULL ELSE COALESCE(p_effectiveto, NULL) END,
                CASE WHEN p_notes_clear = true THEN NULL ELSE COALESCE(p_notes, NULL) END
        )
    ;

    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwScoreModels"
    WHERE "ID" = v_new_id;
END;
$$;


--
-- Name: ScoreModelAuditEvent; Type: TABLE; Schema: __mj_bizappssonar; Owner: -
--

CREATE TABLE __mj_bizappssonar."ScoreModelAuditEvent" (
    "ID" uuid DEFAULT gen_random_uuid() NOT NULL,
    "ScoreModelID" uuid NOT NULL,
    "EntityChanged" character varying(100) NOT NULL,
    "RecordID" character varying(100),
    "ChangeType" character varying(20) NOT NULL,
    "BeforeJSON" text,
    "AfterJSON" text,
    "ChangedByUserID" uuid,
    "ChangedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "__mj_CreatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    "__mj_UpdatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    CONSTRAINT "CK_ScoreModelAuditEvent_ChangeType" CHECK ((("ChangeType")::text = ANY ((ARRAY['Create'::character varying, 'Update'::character varying, 'Delete'::character varying, 'Publish'::character varying])::text[])))
);


--
-- Name: TABLE "ScoreModelAuditEvent"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON TABLE __mj_bizappssonar."ScoreModelAuditEvent" IS 'Config-change audit: who changed which weight, factor, or window and when. Required for an explainable, governed scoring product.';


--
-- Name: COLUMN "ScoreModelAuditEvent"."EntityChanged"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModelAuditEvent"."EntityChanged" IS 'Name of the configuration entity that changed (e.g. ScoreModel, Factor, ModelFactor).';


--
-- Name: COLUMN "ScoreModelAuditEvent"."RecordID"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModelAuditEvent"."RecordID" IS 'Identifier of the specific record that changed, stored as a string to stay entity-agnostic.';


--
-- Name: COLUMN "ScoreModelAuditEvent"."ChangeType"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModelAuditEvent"."ChangeType" IS 'Kind of change: Create, Update, Delete, or Publish.';


--
-- Name: COLUMN "ScoreModelAuditEvent"."BeforeJSON"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModelAuditEvent"."BeforeJSON" IS 'JSON snapshot of the record before the change.';


--
-- Name: COLUMN "ScoreModelAuditEvent"."AfterJSON"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModelAuditEvent"."AfterJSON" IS 'JSON snapshot of the record after the change.';


--
-- Name: COLUMN "ScoreModelAuditEvent"."ChangedAt"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModelAuditEvent"."ChangedAt" IS 'UTC timestamp at which the change occurred.';


--
-- Name: vwScoreModelAuditEvents; Type: VIEW; Schema: __mj_bizappssonar; Owner: -
--

CREATE VIEW __mj_bizappssonar."vwScoreModelAuditEvents" AS
 SELECT s."ID",
    s."ScoreModelID",
    s."EntityChanged",
    s."RecordID",
    s."ChangeType",
    s."BeforeJSON",
    s."AfterJSON",
    s."ChangedByUserID",
    s."ChangedAt",
    s."__mj_CreatedAt",
    s."__mj_UpdatedAt",
    mjbizappssonarscoremodel_scoremodelid."Name" AS "ScoreModel",
    mjuser_changedbyuserid."Name" AS "ChangedByUser"
   FROM ((__mj_bizappssonar."ScoreModelAuditEvent" s
     JOIN __mj_bizappssonar."ScoreModel" mjbizappssonarscoremodel_scoremodelid ON ((s."ScoreModelID" = mjbizappssonarscoremodel_scoremodelid."ID")))
     LEFT JOIN __mj."User" mjuser_changedbyuserid ON ((s."ChangedByUserID" = mjuser_changedbyuserid."ID")));


--
-- Name: spCreateScoreModelAuditEvent(uuid, uuid, character varying, boolean, character varying, character varying, boolean, text, boolean, text, boolean, uuid, timestamp with time zone); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spCreateScoreModelAuditEvent"(p_id uuid DEFAULT NULL::uuid, p_scoremodelid uuid DEFAULT NULL::uuid, p_entitychanged character varying DEFAULT NULL::character varying, p_recordid_clear boolean DEFAULT false, p_recordid character varying DEFAULT NULL::character varying, p_changetype character varying DEFAULT NULL::character varying, p_beforejson_clear boolean DEFAULT false, p_beforejson text DEFAULT NULL::text, p_afterjson_clear boolean DEFAULT false, p_afterjson text DEFAULT NULL::text, p_changedbyuserid_clear boolean DEFAULT false, p_changedbyuserid uuid DEFAULT NULL::uuid, p_changedat timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS SETOF __mj_bizappssonar."vwScoreModelAuditEvents"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_new_id UUID;
BEGIN
    v_new_id := COALESCE(p_id, gen_random_uuid());
    INSERT INTO __mj_bizappssonar."ScoreModelAuditEvent"
        (
            "ID",
            "ScoreModelID",
                "EntityChanged",
                "RecordID",
                "ChangeType",
                "BeforeJSON",
                "AfterJSON",
                "ChangedByUserID",
                "ChangedAt"
        )
    VALUES
        (
            v_new_id,
            p_scoremodelid,
                p_entitychanged,
                CASE WHEN p_recordid_clear = true THEN NULL ELSE COALESCE(p_recordid, NULL) END,
                p_changetype,
                CASE WHEN p_beforejson_clear = true THEN NULL ELSE COALESCE(p_beforejson, NULL) END,
                CASE WHEN p_afterjson_clear = true THEN NULL ELSE COALESCE(p_afterjson, NULL) END,
                CASE WHEN p_changedbyuserid_clear = true THEN NULL ELSE COALESCE(p_changedbyuserid, NULL) END,
                COALESCE(p_changedat, NOW() AT TIME ZONE 'UTC')
        )
    ;

    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwScoreModelAuditEvents"
    WHERE "ID" = v_new_id;
END;
$$;


--
-- Name: ScoreModelVersion; Type: TABLE; Schema: __mj_bizappssonar; Owner: -
--

CREATE TABLE __mj_bizappssonar."ScoreModelVersion" (
    "ID" uuid DEFAULT gen_random_uuid() NOT NULL,
    "ScoreModelID" uuid NOT NULL,
    "VersionNumber" integer NOT NULL,
    "VersionLabel" character varying(50),
    "ConfigSnapshotJSON" text NOT NULL,
    "ChangeSummary" text,
    "PublishedByUserID" uuid,
    "PublishedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "IsCurrent" boolean DEFAULT false NOT NULL,
    "__mj_CreatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    "__mj_UpdatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL
);


--
-- Name: TABLE "ScoreModelVersion"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON TABLE __mj_bizappssonar."ScoreModelVersion" IS 'An immutable snapshot of a model''s complete configuration at publish time. Every Score and ScoreHistory row references the version that produced it, making scores reproducible and auditable.';


--
-- Name: COLUMN "ScoreModelVersion"."VersionNumber"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModelVersion"."VersionNumber" IS 'Monotonic version number within the model.';


--
-- Name: COLUMN "ScoreModelVersion"."VersionLabel"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModelVersion"."VersionLabel" IS 'Optional human-readable label for the version.';


--
-- Name: COLUMN "ScoreModelVersion"."ConfigSnapshotJSON"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModelVersion"."ConfigSnapshotJSON" IS 'Fully denormalized JSON snapshot (anchor, related-entity map, factors, weights, windows, bands, normalization) the engine can score from on its own.';


--
-- Name: COLUMN "ScoreModelVersion"."ChangeSummary"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModelVersion"."ChangeSummary" IS 'Summary of what changed versus the prior version.';


--
-- Name: COLUMN "ScoreModelVersion"."PublishedAt"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModelVersion"."PublishedAt" IS 'UTC timestamp at which this version was published.';


--
-- Name: COLUMN "ScoreModelVersion"."IsCurrent"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreModelVersion"."IsCurrent" IS 'Indicates the single current version that is actively scoring for the model.';


--
-- Name: vwScoreModelVersions; Type: VIEW; Schema: __mj_bizappssonar; Owner: -
--

CREATE VIEW __mj_bizappssonar."vwScoreModelVersions" AS
 SELECT s."ID",
    s."ScoreModelID",
    s."VersionNumber",
    s."VersionLabel",
    s."ConfigSnapshotJSON",
    s."ChangeSummary",
    s."PublishedByUserID",
    s."PublishedAt",
    s."IsCurrent",
    s."__mj_CreatedAt",
    s."__mj_UpdatedAt",
    mjbizappssonarscoremodel_scoremodelid."Name" AS "ScoreModel",
    mjuser_publishedbyuserid."Name" AS "PublishedByUser"
   FROM ((__mj_bizappssonar."ScoreModelVersion" s
     JOIN __mj_bizappssonar."ScoreModel" mjbizappssonarscoremodel_scoremodelid ON ((s."ScoreModelID" = mjbizappssonarscoremodel_scoremodelid."ID")))
     LEFT JOIN __mj."User" mjuser_publishedbyuserid ON ((s."PublishedByUserID" = mjuser_publishedbyuserid."ID")));


--
-- Name: spCreateScoreModelVersion(uuid, uuid, integer, boolean, character varying, text, boolean, text, boolean, uuid, timestamp with time zone, boolean); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spCreateScoreModelVersion"(p_id uuid DEFAULT NULL::uuid, p_scoremodelid uuid DEFAULT NULL::uuid, p_versionnumber integer DEFAULT NULL::integer, p_versionlabel_clear boolean DEFAULT false, p_versionlabel character varying DEFAULT NULL::character varying, p_configsnapshotjson text DEFAULT NULL::text, p_changesummary_clear boolean DEFAULT false, p_changesummary text DEFAULT NULL::text, p_publishedbyuserid_clear boolean DEFAULT false, p_publishedbyuserid uuid DEFAULT NULL::uuid, p_publishedat timestamp with time zone DEFAULT NULL::timestamp with time zone, p_iscurrent boolean DEFAULT NULL::boolean) RETURNS SETOF __mj_bizappssonar."vwScoreModelVersions"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_new_id UUID;
BEGIN
    v_new_id := COALESCE(p_id, gen_random_uuid());
    INSERT INTO __mj_bizappssonar."ScoreModelVersion"
        (
            "ID",
            "ScoreModelID",
                "VersionNumber",
                "VersionLabel",
                "ConfigSnapshotJSON",
                "ChangeSummary",
                "PublishedByUserID",
                "PublishedAt",
                "IsCurrent"
        )
    VALUES
        (
            v_new_id,
            p_scoremodelid,
                p_versionnumber,
                CASE WHEN p_versionlabel_clear = true THEN NULL ELSE COALESCE(p_versionlabel, NULL) END,
                p_configsnapshotjson,
                CASE WHEN p_changesummary_clear = true THEN NULL ELSE COALESCE(p_changesummary, NULL) END,
                CASE WHEN p_publishedbyuserid_clear = true THEN NULL ELSE COALESCE(p_publishedbyuserid, NULL) END,
                COALESCE(p_publishedat, NOW() AT TIME ZONE 'UTC'),
                COALESCE(p_iscurrent, FALSE)
        )
    ;

    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwScoreModelVersions"
    WHERE "ID" = v_new_id;
END;
$$;


--
-- Name: ScoreRecomputeRun; Type: TABLE; Schema: __mj_bizappssonar; Owner: -
--

CREATE TABLE __mj_bizappssonar."ScoreRecomputeRun" (
    "ID" uuid DEFAULT gen_random_uuid() NOT NULL,
    "ScoreModelID" uuid NOT NULL,
    "ScoreModelVersionID" uuid,
    "TriggerType" character varying(16) NOT NULL,
    "Scope" character varying(16) NOT NULL,
    "StartedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "CompletedAt" timestamp with time zone,
    "Status" character varying(16) DEFAULT 'Running'::character varying NOT NULL,
    "RecordsScored" integer,
    "RecordsChanged" integer,
    "BandTransitions" integer,
    "DurationMs" bigint,
    "CostUnitsConsumed" numeric(12,4),
    "ErrorsJSON" text,
    "__mj_CreatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    "__mj_UpdatedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
    CONSTRAINT "CK_ScoreRecomputeRun_Scope" CHECK ((("Scope")::text = ANY ((ARRAY['FullPopulation'::character varying, 'Incremental'::character varying, 'SingleRecord'::character varying])::text[]))),
    CONSTRAINT "CK_ScoreRecomputeRun_Status" CHECK ((("Status")::text = ANY ((ARRAY['Running'::character varying, 'Succeeded'::character varying, 'Failed'::character varying, 'PartialSuccess'::character varying])::text[]))),
    CONSTRAINT "CK_ScoreRecomputeRun_TriggerType" CHECK ((("TriggerType")::text = ANY ((ARRAY['Scheduled'::character varying, 'Event'::character varying, 'Manual'::character varying, 'Backfill'::character varying])::text[])))
);


--
-- Name: TABLE "ScoreRecomputeRun"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON TABLE __mj_bizappssonar."ScoreRecomputeRun" IS 'One batch or event recompute pass; drives the admin health view and compute/cost metering.';


--
-- Name: COLUMN "ScoreRecomputeRun"."TriggerType"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreRecomputeRun"."TriggerType" IS 'What triggered the run: Scheduled, Event, Manual, or Backfill.';


--
-- Name: COLUMN "ScoreRecomputeRun"."Scope"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreRecomputeRun"."Scope" IS 'Scope of the run: FullPopulation, Incremental, or SingleRecord.';


--
-- Name: COLUMN "ScoreRecomputeRun"."StartedAt"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreRecomputeRun"."StartedAt" IS 'UTC timestamp when the run started.';


--
-- Name: COLUMN "ScoreRecomputeRun"."CompletedAt"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreRecomputeRun"."CompletedAt" IS 'UTC timestamp when the run completed.';


--
-- Name: COLUMN "ScoreRecomputeRun"."Status"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreRecomputeRun"."Status" IS 'Run status: Running, Succeeded, Failed, or PartialSuccess.';


--
-- Name: COLUMN "ScoreRecomputeRun"."RecordsScored"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreRecomputeRun"."RecordsScored" IS 'Number of records scored in the run.';


--
-- Name: COLUMN "ScoreRecomputeRun"."RecordsChanged"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreRecomputeRun"."RecordsChanged" IS 'Number of records whose score changed in the run.';


--
-- Name: COLUMN "ScoreRecomputeRun"."BandTransitions"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreRecomputeRun"."BandTransitions" IS 'Number of band transitions recorded during the run.';


--
-- Name: COLUMN "ScoreRecomputeRun"."DurationMs"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreRecomputeRun"."DurationMs" IS 'Total run duration in milliseconds.';


--
-- Name: COLUMN "ScoreRecomputeRun"."CostUnitsConsumed"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreRecomputeRun"."CostUnitsConsumed" IS 'Tokens/compute units consumed by ActionBacked factors; feeds metering and billing.';


--
-- Name: COLUMN "ScoreRecomputeRun"."ErrorsJSON"; Type: COMMENT; Schema: __mj_bizappssonar; Owner: -
--

COMMENT ON COLUMN __mj_bizappssonar."ScoreRecomputeRun"."ErrorsJSON" IS 'JSON capturing any errors encountered during the run.';


--
-- Name: vwScoreRecomputeRuns; Type: VIEW; Schema: __mj_bizappssonar; Owner: -
--

CREATE VIEW __mj_bizappssonar."vwScoreRecomputeRuns" AS
 SELECT s."ID",
    s."ScoreModelID",
    s."ScoreModelVersionID",
    s."TriggerType",
    s."Scope",
    s."StartedAt",
    s."CompletedAt",
    s."Status",
    s."RecordsScored",
    s."RecordsChanged",
    s."BandTransitions",
    s."DurationMs",
    s."CostUnitsConsumed",
    s."ErrorsJSON",
    s."__mj_CreatedAt",
    s."__mj_UpdatedAt",
    mjbizappssonarscoremodel_scoremodelid."Name" AS "ScoreModel"
   FROM (__mj_bizappssonar."ScoreRecomputeRun" s
     JOIN __mj_bizappssonar."ScoreModel" mjbizappssonarscoremodel_scoremodelid ON ((s."ScoreModelID" = mjbizappssonarscoremodel_scoremodelid."ID")));


--
-- Name: spCreateScoreRecomputeRun(uuid, uuid, boolean, uuid, character varying, character varying, timestamp with time zone, boolean, timestamp with time zone, character varying, boolean, integer, boolean, integer, boolean, integer, boolean, bigint, boolean, numeric, boolean, text); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spCreateScoreRecomputeRun"(p_id uuid DEFAULT NULL::uuid, p_scoremodelid uuid DEFAULT NULL::uuid, p_scoremodelversionid_clear boolean DEFAULT false, p_scoremodelversionid uuid DEFAULT NULL::uuid, p_triggertype character varying DEFAULT NULL::character varying, p_scope character varying DEFAULT NULL::character varying, p_startedat timestamp with time zone DEFAULT NULL::timestamp with time zone, p_completedat_clear boolean DEFAULT false, p_completedat timestamp with time zone DEFAULT NULL::timestamp with time zone, p_status character varying DEFAULT NULL::character varying, p_recordsscored_clear boolean DEFAULT false, p_recordsscored integer DEFAULT NULL::integer, p_recordschanged_clear boolean DEFAULT false, p_recordschanged integer DEFAULT NULL::integer, p_bandtransitions_clear boolean DEFAULT false, p_bandtransitions integer DEFAULT NULL::integer, p_durationms_clear boolean DEFAULT false, p_durationms bigint DEFAULT NULL::bigint, p_costunitsconsumed_clear boolean DEFAULT false, p_costunitsconsumed numeric DEFAULT NULL::numeric, p_errorsjson_clear boolean DEFAULT false, p_errorsjson text DEFAULT NULL::text) RETURNS SETOF __mj_bizappssonar."vwScoreRecomputeRuns"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_new_id UUID;
BEGIN
    v_new_id := COALESCE(p_id, gen_random_uuid());
    INSERT INTO __mj_bizappssonar."ScoreRecomputeRun"
        (
            "ID",
            "ScoreModelID",
                "ScoreModelVersionID",
                "TriggerType",
                "Scope",
                "StartedAt",
                "CompletedAt",
                "Status",
                "RecordsScored",
                "RecordsChanged",
                "BandTransitions",
                "DurationMs",
                "CostUnitsConsumed",
                "ErrorsJSON"
        )
    VALUES
        (
            v_new_id,
            p_scoremodelid,
                CASE WHEN p_scoremodelversionid_clear = true THEN NULL ELSE COALESCE(p_scoremodelversionid, NULL) END,
                p_triggertype,
                p_scope,
                COALESCE(p_startedat, NOW() AT TIME ZONE 'UTC'),
                CASE WHEN p_completedat_clear = true THEN NULL ELSE COALESCE(p_completedat, NULL) END,
                COALESCE(p_status, 'Running'),
                CASE WHEN p_recordsscored_clear = true THEN NULL ELSE COALESCE(p_recordsscored, NULL) END,
                CASE WHEN p_recordschanged_clear = true THEN NULL ELSE COALESCE(p_recordschanged, NULL) END,
                CASE WHEN p_bandtransitions_clear = true THEN NULL ELSE COALESCE(p_bandtransitions, NULL) END,
                CASE WHEN p_durationms_clear = true THEN NULL ELSE COALESCE(p_durationms, NULL) END,
                CASE WHEN p_costunitsconsumed_clear = true THEN NULL ELSE COALESCE(p_costunitsconsumed, NULL) END,
                CASE WHEN p_errorsjson_clear = true THEN NULL ELSE COALESCE(p_errorsjson, NULL) END
        )
    ;

    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwScoreRecomputeRuns"
    WHERE "ID" = v_new_id;
END;
$$;


--
-- Name: vwTimeWindows; Type: VIEW; Schema: __mj_bizappssonar; Owner: -
--

CREATE VIEW __mj_bizappssonar."vwTimeWindows" AS
 SELECT "ID",
    "Name",
    "WindowType",
    "LengthDays",
    "LengthMonths",
    "AnchorDateField",
    "OffsetDays",
    "Description",
    "__mj_CreatedAt",
    "__mj_UpdatedAt"
   FROM __mj_bizappssonar."TimeWindow" t;


--
-- Name: spCreateTimeWindow(uuid, character varying, character varying, boolean, integer, boolean, integer, boolean, character varying, boolean, integer, boolean, text); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spCreateTimeWindow"(p_id uuid DEFAULT NULL::uuid, p_name character varying DEFAULT NULL::character varying, p_windowtype character varying DEFAULT NULL::character varying, p_lengthdays_clear boolean DEFAULT false, p_lengthdays integer DEFAULT NULL::integer, p_lengthmonths_clear boolean DEFAULT false, p_lengthmonths integer DEFAULT NULL::integer, p_anchordatefield_clear boolean DEFAULT false, p_anchordatefield character varying DEFAULT NULL::character varying, p_offsetdays_clear boolean DEFAULT false, p_offsetdays integer DEFAULT NULL::integer, p_description_clear boolean DEFAULT false, p_description text DEFAULT NULL::text) RETURNS SETOF __mj_bizappssonar."vwTimeWindows"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_new_id UUID;
BEGIN
    v_new_id := COALESCE(p_id, gen_random_uuid());
    INSERT INTO __mj_bizappssonar."TimeWindow"
        (
            "ID",
            "Name",
                "WindowType",
                "LengthDays",
                "LengthMonths",
                "AnchorDateField",
                "OffsetDays",
                "Description"
        )
    VALUES
        (
            v_new_id,
            p_name,
                p_windowtype,
                CASE WHEN p_lengthdays_clear = true THEN NULL ELSE COALESCE(p_lengthdays, NULL) END,
                CASE WHEN p_lengthmonths_clear = true THEN NULL ELSE COALESCE(p_lengthmonths, NULL) END,
                CASE WHEN p_anchordatefield_clear = true THEN NULL ELSE COALESCE(p_anchordatefield, NULL) END,
                CASE WHEN p_offsetdays_clear = true THEN NULL ELSE COALESCE(p_offsetdays, NULL) END,
                CASE WHEN p_description_clear = true THEN NULL ELSE COALESCE(p_description, NULL) END
        )
    ;

    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwTimeWindows"
    WHERE "ID" = v_new_id;
END;
$$;


--
-- Name: spDeleteFactor(uuid); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spDeleteFactor"(p_id uuid) RETURNS TABLE("ID" uuid)
    LANGUAGE plpgsql
    AS $$
#variable_conflict use_column
DECLARE
    v_affected_count INTEGER;
BEGIN

    DELETE FROM __mj_bizappssonar."Factor"
    WHERE "ID" = p_id;

    GET DIAGNOSTICS v_affected_count = ROW_COUNT;

    IF v_affected_count = 0 THEN
        RETURN QUERY SELECT NULL::UUID AS "ID";
    ELSE
        RETURN QUERY SELECT p_id AS "ID";
    END IF;
END;
$$;


--
-- Name: spDeleteModelFactor(uuid); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spDeleteModelFactor"(p_id uuid) RETURNS TABLE("ID" uuid)
    LANGUAGE plpgsql
    AS $$
#variable_conflict use_column
DECLARE
    v_affected_count INTEGER;
BEGIN

    DELETE FROM __mj_bizappssonar."ModelFactor"
    WHERE "ID" = p_id;

    GET DIAGNOSTICS v_affected_count = ROW_COUNT;

    IF v_affected_count = 0 THEN
        RETURN QUERY SELECT NULL::UUID AS "ID";
    ELSE
        RETURN QUERY SELECT p_id AS "ID";
    END IF;
END;
$$;


--
-- Name: spDeleteModelRelatedEntity(uuid); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spDeleteModelRelatedEntity"(p_id uuid) RETURNS TABLE("ID" uuid)
    LANGUAGE plpgsql
    AS $$
#variable_conflict use_column
DECLARE
    v_affected_count INTEGER;
BEGIN

    DELETE FROM __mj_bizappssonar."ModelRelatedEntity"
    WHERE "ID" = p_id;

    GET DIAGNOSTICS v_affected_count = ROW_COUNT;

    IF v_affected_count = 0 THEN
        RETURN QUERY SELECT NULL::UUID AS "ID";
    ELSE
        RETURN QUERY SELECT p_id AS "ID";
    END IF;
END;
$$;


--
-- Name: spDeleteScore(uuid); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spDeleteScore"(p_id uuid) RETURNS TABLE("ID" uuid)
    LANGUAGE plpgsql
    AS $$
#variable_conflict use_column
DECLARE
    v_affected_count INTEGER;
BEGIN

    DELETE FROM __mj_bizappssonar."Score"
    WHERE "ID" = p_id;

    GET DIAGNOSTICS v_affected_count = ROW_COUNT;

    IF v_affected_count = 0 THEN
        RETURN QUERY SELECT NULL::UUID AS "ID";
    ELSE
        RETURN QUERY SELECT p_id AS "ID";
    END IF;
END;
$$;


--
-- Name: spDeleteScoreBand(uuid); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spDeleteScoreBand"(p_id uuid) RETURNS TABLE("ID" uuid)
    LANGUAGE plpgsql
    AS $$
#variable_conflict use_column
DECLARE
    v_affected_count INTEGER;
BEGIN

    DELETE FROM __mj_bizappssonar."ScoreBand"
    WHERE "ID" = p_id;

    GET DIAGNOSTICS v_affected_count = ROW_COUNT;

    IF v_affected_count = 0 THEN
        RETURN QUERY SELECT NULL::UUID AS "ID";
    ELSE
        RETURN QUERY SELECT p_id AS "ID";
    END IF;
END;
$$;


--
-- Name: spDeleteScoreBandSet(uuid); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spDeleteScoreBandSet"(p_id uuid) RETURNS TABLE("ID" uuid)
    LANGUAGE plpgsql
    AS $$
#variable_conflict use_column
DECLARE
    v_affected_count INTEGER;
BEGIN

    DELETE FROM __mj_bizappssonar."ScoreBandSet"
    WHERE "ID" = p_id;

    GET DIAGNOSTICS v_affected_count = ROW_COUNT;

    IF v_affected_count = 0 THEN
        RETURN QUERY SELECT NULL::UUID AS "ID";
    ELSE
        RETURN QUERY SELECT p_id AS "ID";
    END IF;
END;
$$;


--
-- Name: spDeleteScoreBandTransition(uuid); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spDeleteScoreBandTransition"(p_id uuid) RETURNS TABLE("ID" uuid)
    LANGUAGE plpgsql
    AS $$
#variable_conflict use_column
DECLARE
    v_affected_count INTEGER;
BEGIN

    DELETE FROM __mj_bizappssonar."ScoreBandTransition"
    WHERE "ID" = p_id;

    GET DIAGNOSTICS v_affected_count = ROW_COUNT;

    IF v_affected_count = 0 THEN
        RETURN QUERY SELECT NULL::UUID AS "ID";
    ELSE
        RETURN QUERY SELECT p_id AS "ID";
    END IF;
END;
$$;


--
-- Name: spDeleteScoreFactorContribution(uuid); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spDeleteScoreFactorContribution"(p_id uuid) RETURNS TABLE("ID" uuid)
    LANGUAGE plpgsql
    AS $$
#variable_conflict use_column
DECLARE
    v_affected_count INTEGER;
BEGIN

    DELETE FROM __mj_bizappssonar."ScoreFactorContribution"
    WHERE "ID" = p_id;

    GET DIAGNOSTICS v_affected_count = ROW_COUNT;

    IF v_affected_count = 0 THEN
        RETURN QUERY SELECT NULL::UUID AS "ID";
    ELSE
        RETURN QUERY SELECT p_id AS "ID";
    END IF;
END;
$$;


--
-- Name: spDeleteScoreHistory(uuid); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spDeleteScoreHistory"(p_id uuid) RETURNS TABLE("ID" uuid)
    LANGUAGE plpgsql
    AS $$
#variable_conflict use_column
DECLARE
    v_affected_count INTEGER;
BEGIN

    DELETE FROM __mj_bizappssonar."ScoreHistory"
    WHERE "ID" = p_id;

    GET DIAGNOSTICS v_affected_count = ROW_COUNT;

    IF v_affected_count = 0 THEN
        RETURN QUERY SELECT NULL::UUID AS "ID";
    ELSE
        RETURN QUERY SELECT p_id AS "ID";
    END IF;
END;
$$;


--
-- Name: spDeleteScoreModel(uuid); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spDeleteScoreModel"(p_id uuid) RETURNS TABLE("ID" uuid)
    LANGUAGE plpgsql
    AS $$
#variable_conflict use_column
DECLARE
    v_affected_count INTEGER;
BEGIN

    DELETE FROM __mj_bizappssonar."ScoreModel"
    WHERE "ID" = p_id;

    GET DIAGNOSTICS v_affected_count = ROW_COUNT;

    IF v_affected_count = 0 THEN
        RETURN QUERY SELECT NULL::UUID AS "ID";
    ELSE
        RETURN QUERY SELECT p_id AS "ID";
    END IF;
END;
$$;


--
-- Name: spDeleteScoreModelAuditEvent(uuid); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spDeleteScoreModelAuditEvent"(p_id uuid) RETURNS TABLE("ID" uuid)
    LANGUAGE plpgsql
    AS $$
#variable_conflict use_column
DECLARE
    v_affected_count INTEGER;
BEGIN

    DELETE FROM __mj_bizappssonar."ScoreModelAuditEvent"
    WHERE "ID" = p_id;

    GET DIAGNOSTICS v_affected_count = ROW_COUNT;

    IF v_affected_count = 0 THEN
        RETURN QUERY SELECT NULL::UUID AS "ID";
    ELSE
        RETURN QUERY SELECT p_id AS "ID";
    END IF;
END;
$$;


--
-- Name: spDeleteScoreModelVersion(uuid); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spDeleteScoreModelVersion"(p_id uuid) RETURNS TABLE("ID" uuid)
    LANGUAGE plpgsql
    AS $$
#variable_conflict use_column
DECLARE
    v_affected_count INTEGER;
BEGIN

    DELETE FROM __mj_bizappssonar."ScoreModelVersion"
    WHERE "ID" = p_id;

    GET DIAGNOSTICS v_affected_count = ROW_COUNT;

    IF v_affected_count = 0 THEN
        RETURN QUERY SELECT NULL::UUID AS "ID";
    ELSE
        RETURN QUERY SELECT p_id AS "ID";
    END IF;
END;
$$;


--
-- Name: spDeleteScoreRecomputeRun(uuid); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spDeleteScoreRecomputeRun"(p_id uuid) RETURNS TABLE("ID" uuid)
    LANGUAGE plpgsql
    AS $$
#variable_conflict use_column
DECLARE
    v_affected_count INTEGER;
BEGIN

    DELETE FROM __mj_bizappssonar."ScoreRecomputeRun"
    WHERE "ID" = p_id;

    GET DIAGNOSTICS v_affected_count = ROW_COUNT;

    IF v_affected_count = 0 THEN
        RETURN QUERY SELECT NULL::UUID AS "ID";
    ELSE
        RETURN QUERY SELECT p_id AS "ID";
    END IF;
END;
$$;


--
-- Name: spDeleteTimeWindow(uuid); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spDeleteTimeWindow"(p_id uuid) RETURNS TABLE("ID" uuid)
    LANGUAGE plpgsql
    AS $$
#variable_conflict use_column
DECLARE
    v_affected_count INTEGER;
BEGIN

    DELETE FROM __mj_bizappssonar."TimeWindow"
    WHERE "ID" = p_id;

    GET DIAGNOSTICS v_affected_count = ROW_COUNT;

    IF v_affected_count = 0 THEN
        RETURN QUERY SELECT NULL::UUID AS "ID";
    ELSE
        RETURN QUERY SELECT p_id AS "ID";
    END IF;
END;
$$;


--
-- Name: spUpdateFactor(uuid, character varying, character varying, boolean, text, boolean, uuid, uuid, character varying, boolean, uuid, boolean, uuid, boolean, text, boolean, character varying, boolean, character varying, boolean, uuid, boolean, integer, boolean, uuid, boolean, text, boolean, character varying, boolean, boolean, integer, boolean, integer, boolean, integer, boolean, uuid, boolean, character varying, boolean, character varying, boolean, text, boolean, numeric, boolean, numeric, boolean, boolean, character varying, boolean, timestamp with time zone, boolean, character varying, boolean, character varying); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spUpdateFactor"(p_id uuid, p_name character varying DEFAULT NULL::character varying, p_slug character varying DEFAULT NULL::character varying, p_description_clear boolean DEFAULT false, p_description text DEFAULT NULL::text, p_scoremodelid_clear boolean DEFAULT false, p_scoremodelid uuid DEFAULT NULL::uuid, p_anchorentityid uuid DEFAULT NULL::uuid, p_factortype character varying DEFAULT NULL::character varying, p_sourcerelatedentityid_clear boolean DEFAULT false, p_sourcerelatedentityid uuid DEFAULT NULL::uuid, p_sourceentityid_clear boolean DEFAULT false, p_sourceentityid uuid DEFAULT NULL::uuid, p_filterexpression_clear boolean DEFAULT false, p_filterexpression text DEFAULT NULL::text, p_aggregation_clear boolean DEFAULT false, p_aggregation character varying DEFAULT NULL::character varying, p_aggregatefieldname_clear boolean DEFAULT false, p_aggregatefieldname character varying DEFAULT NULL::character varying, p_timewindowid_clear boolean DEFAULT false, p_timewindowid uuid DEFAULT NULL::uuid, p_recencydecayhalflifedays_clear boolean DEFAULT false, p_recencydecayhalflifedays integer DEFAULT NULL::integer, p_actionid_clear boolean DEFAULT false, p_actionid uuid DEFAULT NULL::uuid, p_actionparamsjson_clear boolean DEFAULT false, p_actionparamsjson text DEFAULT NULL::text, p_executionmode_clear boolean DEFAULT false, p_executionmode character varying DEFAULT NULL::character varying, p_isexpensive boolean DEFAULT NULL::boolean, p_maxconcurrency_clear boolean DEFAULT false, p_maxconcurrency integer DEFAULT NULL::integer, p_ratelimitperminute_clear boolean DEFAULT false, p_ratelimitperminute integer DEFAULT NULL::integer, p_cachettlseconds_clear boolean DEFAULT false, p_cachettlseconds integer DEFAULT NULL::integer, p_sourcescoremodelid_clear boolean DEFAULT false, p_sourcescoremodelid uuid DEFAULT NULL::uuid, p_rawdatatype_clear boolean DEFAULT false, p_rawdatatype character varying DEFAULT NULL::character varying, p_normalizationmethod_clear boolean DEFAULT false, p_normalizationmethod character varying DEFAULT NULL::character varying, p_normalizationparamsjson_clear boolean DEFAULT false, p_normalizationparamsjson text DEFAULT NULL::text, p_outputmin_clear boolean DEFAULT false, p_outputmin numeric DEFAULT NULL::numeric, p_outputmax_clear boolean DEFAULT false, p_outputmax numeric DEFAULT NULL::numeric, p_higherisbetter boolean DEFAULT NULL::boolean, p_promotionstate_clear boolean DEFAULT false, p_promotionstate character varying DEFAULT NULL::character varying, p_lastvalidatedat_clear boolean DEFAULT false, p_lastvalidatedat timestamp with time zone DEFAULT NULL::timestamp with time zone, p_createdbyagent_clear boolean DEFAULT false, p_createdbyagent character varying DEFAULT NULL::character varying, p_datefield_clear boolean DEFAULT false, p_datefield character varying DEFAULT NULL::character varying) RETURNS SETOF __mj_bizappssonar."vwFactors"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE __mj_bizappssonar."Factor"
    SET
        "Name" = COALESCE(p_name, "Name"),
        "Slug" = COALESCE(p_slug, "Slug"),
        "Description" = CASE WHEN p_description_clear = true THEN NULL ELSE COALESCE(p_description, "Description") END,
        "ScoreModelID" = CASE WHEN p_scoremodelid_clear = true THEN NULL ELSE COALESCE(p_scoremodelid, "ScoreModelID") END,
        "AnchorEntityID" = COALESCE(p_anchorentityid, "AnchorEntityID"),
        "FactorType" = COALESCE(p_factortype, "FactorType"),
        "SourceRelatedEntityID" = CASE WHEN p_sourcerelatedentityid_clear = true THEN NULL ELSE COALESCE(p_sourcerelatedentityid, "SourceRelatedEntityID") END,
        "SourceEntityID" = CASE WHEN p_sourceentityid_clear = true THEN NULL ELSE COALESCE(p_sourceentityid, "SourceEntityID") END,
        "FilterExpression" = CASE WHEN p_filterexpression_clear = true THEN NULL ELSE COALESCE(p_filterexpression, "FilterExpression") END,
        "Aggregation" = CASE WHEN p_aggregation_clear = true THEN NULL ELSE COALESCE(p_aggregation, "Aggregation") END,
        "AggregateFieldName" = CASE WHEN p_aggregatefieldname_clear = true THEN NULL ELSE COALESCE(p_aggregatefieldname, "AggregateFieldName") END,
        "TimeWindowID" = CASE WHEN p_timewindowid_clear = true THEN NULL ELSE COALESCE(p_timewindowid, "TimeWindowID") END,
        "RecencyDecayHalfLifeDays" = CASE WHEN p_recencydecayhalflifedays_clear = true THEN NULL ELSE COALESCE(p_recencydecayhalflifedays, "RecencyDecayHalfLifeDays") END,
        "ActionID" = CASE WHEN p_actionid_clear = true THEN NULL ELSE COALESCE(p_actionid, "ActionID") END,
        "ActionParamsJSON" = CASE WHEN p_actionparamsjson_clear = true THEN NULL ELSE COALESCE(p_actionparamsjson, "ActionParamsJSON") END,
        "ExecutionMode" = CASE WHEN p_executionmode_clear = true THEN NULL ELSE COALESCE(p_executionmode, "ExecutionMode") END,
        "IsExpensive" = COALESCE(p_isexpensive, "IsExpensive"),
        "MaxConcurrency" = CASE WHEN p_maxconcurrency_clear = true THEN NULL ELSE COALESCE(p_maxconcurrency, "MaxConcurrency") END,
        "RateLimitPerMinute" = CASE WHEN p_ratelimitperminute_clear = true THEN NULL ELSE COALESCE(p_ratelimitperminute, "RateLimitPerMinute") END,
        "CacheTTLSeconds" = CASE WHEN p_cachettlseconds_clear = true THEN NULL ELSE COALESCE(p_cachettlseconds, "CacheTTLSeconds") END,
        "SourceScoreModelID" = CASE WHEN p_sourcescoremodelid_clear = true THEN NULL ELSE COALESCE(p_sourcescoremodelid, "SourceScoreModelID") END,
        "RawDataType" = CASE WHEN p_rawdatatype_clear = true THEN NULL ELSE COALESCE(p_rawdatatype, "RawDataType") END,
        "NormalizationMethod" = CASE WHEN p_normalizationmethod_clear = true THEN NULL ELSE COALESCE(p_normalizationmethod, "NormalizationMethod") END,
        "NormalizationParamsJSON" = CASE WHEN p_normalizationparamsjson_clear = true THEN NULL ELSE COALESCE(p_normalizationparamsjson, "NormalizationParamsJSON") END,
        "OutputMin" = CASE WHEN p_outputmin_clear = true THEN NULL ELSE COALESCE(p_outputmin, "OutputMin") END,
        "OutputMax" = CASE WHEN p_outputmax_clear = true THEN NULL ELSE COALESCE(p_outputmax, "OutputMax") END,
        "HigherIsBetter" = COALESCE(p_higherisbetter, "HigherIsBetter"),
        "PromotionState" = CASE WHEN p_promotionstate_clear = true THEN NULL ELSE COALESCE(p_promotionstate, "PromotionState") END,
        "LastValidatedAt" = CASE WHEN p_lastvalidatedat_clear = true THEN NULL ELSE COALESCE(p_lastvalidatedat, "LastValidatedAt") END,
        "CreatedByAgent" = CASE WHEN p_createdbyagent_clear = true THEN NULL ELSE COALESCE(p_createdbyagent, "CreatedByAgent") END,
        "DateField" = CASE WHEN p_datefield_clear = true THEN NULL ELSE COALESCE(p_datefield, "DateField") END
    WHERE
        "ID" = p_id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    IF v_updated_count = 0 THEN
        -- Nothing was updated, return empty result set
        RETURN;
    END IF;

    -- Return the updated record from the base view
    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwFactors"
    WHERE "ID" = p_id;
END;
$$;


--
-- Name: spUpdateModelFactor(uuid, uuid, uuid, numeric, character varying, boolean, numeric, boolean, numeric, boolean, numeric, character varying, boolean, boolean, character varying, boolean, integer); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spUpdateModelFactor"(p_id uuid, p_scoremodelid uuid DEFAULT NULL::uuid, p_factorid uuid DEFAULT NULL::uuid, p_weight numeric DEFAULT NULL::numeric, p_weightmode character varying DEFAULT NULL::character varying, p_contributioncap_clear boolean DEFAULT false, p_contributioncap numeric DEFAULT NULL::numeric, p_contributionfloor_clear boolean DEFAULT false, p_contributionfloor numeric DEFAULT NULL::numeric, p_trendweight_clear boolean DEFAULT false, p_trendweight numeric DEFAULT NULL::numeric, p_missingdatapolicy character varying DEFAULT NULL::character varying, p_isrequired boolean DEFAULT NULL::boolean, p_displaylabel_clear boolean DEFAULT false, p_displaylabel character varying DEFAULT NULL::character varying, p_displayorder_clear boolean DEFAULT false, p_displayorder integer DEFAULT NULL::integer) RETURNS SETOF __mj_bizappssonar."vwModelFactors"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE __mj_bizappssonar."ModelFactor"
    SET
        "ScoreModelID" = COALESCE(p_scoremodelid, "ScoreModelID"),
        "FactorID" = COALESCE(p_factorid, "FactorID"),
        "Weight" = COALESCE(p_weight, "Weight"),
        "WeightMode" = COALESCE(p_weightmode, "WeightMode"),
        "ContributionCap" = CASE WHEN p_contributioncap_clear = true THEN NULL ELSE COALESCE(p_contributioncap, "ContributionCap") END,
        "ContributionFloor" = CASE WHEN p_contributionfloor_clear = true THEN NULL ELSE COALESCE(p_contributionfloor, "ContributionFloor") END,
        "TrendWeight" = CASE WHEN p_trendweight_clear = true THEN NULL ELSE COALESCE(p_trendweight, "TrendWeight") END,
        "MissingDataPolicy" = COALESCE(p_missingdatapolicy, "MissingDataPolicy"),
        "IsRequired" = COALESCE(p_isrequired, "IsRequired"),
        "DisplayLabel" = CASE WHEN p_displaylabel_clear = true THEN NULL ELSE COALESCE(p_displaylabel, "DisplayLabel") END,
        "DisplayOrder" = CASE WHEN p_displayorder_clear = true THEN NULL ELSE COALESCE(p_displayorder, "DisplayOrder") END
    WHERE
        "ID" = p_id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    IF v_updated_count = 0 THEN
        -- Nothing was updated, return empty result set
        RETURN;
    END IF;

    -- Return the updated record from the base view
    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwModelFactors"
    WHERE "ID" = p_id;
END;
$$;


--
-- Name: spUpdateModelRelatedEntity(uuid, uuid, uuid, character varying, text, character varying, boolean, character varying, boolean, text); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spUpdateModelRelatedEntity"(p_id uuid, p_scoremodelid uuid DEFAULT NULL::uuid, p_relatedentityid uuid DEFAULT NULL::uuid, p_alias character varying DEFAULT NULL::character varying, p_relationshippath text DEFAULT NULL::text, p_jointype character varying DEFAULT NULL::character varying, p_sourcesystemtag_clear boolean DEFAULT false, p_sourcesystemtag character varying DEFAULT NULL::character varying, p_description_clear boolean DEFAULT false, p_description text DEFAULT NULL::text) RETURNS SETOF __mj_bizappssonar."vwModelRelatedEntities"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE __mj_bizappssonar."ModelRelatedEntity"
    SET
        "ScoreModelID" = COALESCE(p_scoremodelid, "ScoreModelID"),
        "RelatedEntityID" = COALESCE(p_relatedentityid, "RelatedEntityID"),
        "Alias" = COALESCE(p_alias, "Alias"),
        "RelationshipPath" = COALESCE(p_relationshippath, "RelationshipPath"),
        "JoinType" = COALESCE(p_jointype, "JoinType"),
        "SourceSystemTag" = CASE WHEN p_sourcesystemtag_clear = true THEN NULL ELSE COALESCE(p_sourcesystemtag, "SourceSystemTag") END,
        "Description" = CASE WHEN p_description_clear = true THEN NULL ELSE COALESCE(p_description, "Description") END
    WHERE
        "ID" = p_id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    IF v_updated_count = 0 THEN
        -- Nothing was updated, return empty result set
        RETURN;
    END IF;

    -- Return the updated record from the base view
    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwModelRelatedEntities"
    WHERE "ID" = p_id;
END;
$$;


--
-- Name: spUpdateScore(uuid, uuid, uuid, uuid, character varying, boolean, text, boolean, numeric, boolean, numeric, boolean, uuid, boolean, numeric, boolean, uuid, boolean, numeric, boolean, character varying, boolean, numeric, boolean, numeric, boolean, numeric, timestamp with time zone, boolean, timestamp with time zone, boolean, timestamp with time zone, boolean, boolean, text); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spUpdateScore"(p_id uuid, p_scoremodelid uuid DEFAULT NULL::uuid, p_scoremodelversionid uuid DEFAULT NULL::uuid, p_anchorentityid uuid DEFAULT NULL::uuid, p_anchorrecordid character varying DEFAULT NULL::character varying, p_anchorrecordkeyjson_clear boolean DEFAULT false, p_anchorrecordkeyjson text DEFAULT NULL::text, p_rawscore_clear boolean DEFAULT false, p_rawscore numeric DEFAULT NULL::numeric, p_normalizedscore_clear boolean DEFAULT false, p_normalizedscore numeric DEFAULT NULL::numeric, p_bandid_clear boolean DEFAULT false, p_bandid uuid DEFAULT NULL::uuid, p_previousnormalizedscore_clear boolean DEFAULT false, p_previousnormalizedscore numeric DEFAULT NULL::numeric, p_previousbandid_clear boolean DEFAULT false, p_previousbandid uuid DEFAULT NULL::uuid, p_delta_clear boolean DEFAULT false, p_delta numeric DEFAULT NULL::numeric, p_trenddirection_clear boolean DEFAULT false, p_trenddirection character varying DEFAULT NULL::character varying, p_trendslope_clear boolean DEFAULT false, p_trendslope numeric DEFAULT NULL::numeric, p_confidence_clear boolean DEFAULT false, p_confidence numeric DEFAULT NULL::numeric, p_datacompleteness_clear boolean DEFAULT false, p_datacompleteness numeric DEFAULT NULL::numeric, p_computedat timestamp with time zone DEFAULT NULL::timestamp with time zone, p_asofdate_clear boolean DEFAULT false, p_asofdate timestamp with time zone DEFAULT NULL::timestamp with time zone, p_nextrecomputeat_clear boolean DEFAULT false, p_nextrecomputeat timestamp with time zone DEFAULT NULL::timestamp with time zone, p_isstale boolean DEFAULT NULL::boolean, p_explanationsummary_clear boolean DEFAULT false, p_explanationsummary text DEFAULT NULL::text) RETURNS SETOF __mj_bizappssonar."vwScores"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE __mj_bizappssonar."Score"
    SET
        "ScoreModelID" = COALESCE(p_scoremodelid, "ScoreModelID"),
        "ScoreModelVersionID" = COALESCE(p_scoremodelversionid, "ScoreModelVersionID"),
        "AnchorEntityID" = COALESCE(p_anchorentityid, "AnchorEntityID"),
        "AnchorRecordID" = COALESCE(p_anchorrecordid, "AnchorRecordID"),
        "AnchorRecordKeyJSON" = CASE WHEN p_anchorrecordkeyjson_clear = true THEN NULL ELSE COALESCE(p_anchorrecordkeyjson, "AnchorRecordKeyJSON") END,
        "RawScore" = CASE WHEN p_rawscore_clear = true THEN NULL ELSE COALESCE(p_rawscore, "RawScore") END,
        "NormalizedScore" = CASE WHEN p_normalizedscore_clear = true THEN NULL ELSE COALESCE(p_normalizedscore, "NormalizedScore") END,
        "BandID" = CASE WHEN p_bandid_clear = true THEN NULL ELSE COALESCE(p_bandid, "BandID") END,
        "PreviousNormalizedScore" = CASE WHEN p_previousnormalizedscore_clear = true THEN NULL ELSE COALESCE(p_previousnormalizedscore, "PreviousNormalizedScore") END,
        "PreviousBandID" = CASE WHEN p_previousbandid_clear = true THEN NULL ELSE COALESCE(p_previousbandid, "PreviousBandID") END,
        "Delta" = CASE WHEN p_delta_clear = true THEN NULL ELSE COALESCE(p_delta, "Delta") END,
        "TrendDirection" = CASE WHEN p_trenddirection_clear = true THEN NULL ELSE COALESCE(p_trenddirection, "TrendDirection") END,
        "TrendSlope" = CASE WHEN p_trendslope_clear = true THEN NULL ELSE COALESCE(p_trendslope, "TrendSlope") END,
        "Confidence" = CASE WHEN p_confidence_clear = true THEN NULL ELSE COALESCE(p_confidence, "Confidence") END,
        "DataCompleteness" = CASE WHEN p_datacompleteness_clear = true THEN NULL ELSE COALESCE(p_datacompleteness, "DataCompleteness") END,
        "ComputedAt" = COALESCE(p_computedat, "ComputedAt"),
        "AsOfDate" = CASE WHEN p_asofdate_clear = true THEN NULL ELSE COALESCE(p_asofdate, "AsOfDate") END,
        "NextRecomputeAt" = CASE WHEN p_nextrecomputeat_clear = true THEN NULL ELSE COALESCE(p_nextrecomputeat, "NextRecomputeAt") END,
        "IsStale" = COALESCE(p_isstale, "IsStale"),
        "ExplanationSummary" = CASE WHEN p_explanationsummary_clear = true THEN NULL ELSE COALESCE(p_explanationsummary, "ExplanationSummary") END
    WHERE
        "ID" = p_id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    IF v_updated_count = 0 THEN
        -- Nothing was updated, return empty result set
        RETURN;
    END IF;

    -- Return the updated record from the base view
    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwScores"
    WHERE "ID" = p_id;
END;
$$;


--
-- Name: spUpdateScoreBand(uuid, uuid, character varying, numeric, numeric, integer, boolean, character varying, boolean, boolean, text); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spUpdateScoreBand"(p_id uuid, p_bandsetid uuid DEFAULT NULL::uuid, p_label character varying DEFAULT NULL::character varying, p_minscore numeric DEFAULT NULL::numeric, p_maxscore numeric DEFAULT NULL::numeric, p_severity integer DEFAULT NULL::integer, p_colorhex_clear boolean DEFAULT false, p_colorhex character varying DEFAULT NULL::character varying, p_isterminal boolean DEFAULT NULL::boolean, p_description_clear boolean DEFAULT false, p_description text DEFAULT NULL::text) RETURNS SETOF __mj_bizappssonar."vwScoreBands"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE __mj_bizappssonar."ScoreBand"
    SET
        "BandSetID" = COALESCE(p_bandsetid, "BandSetID"),
        "Label" = COALESCE(p_label, "Label"),
        "MinScore" = COALESCE(p_minscore, "MinScore"),
        "MaxScore" = COALESCE(p_maxscore, "MaxScore"),
        "Severity" = COALESCE(p_severity, "Severity"),
        "ColorHex" = CASE WHEN p_colorhex_clear = true THEN NULL ELSE COALESCE(p_colorhex, "ColorHex") END,
        "IsTerminal" = COALESCE(p_isterminal, "IsTerminal"),
        "Description" = CASE WHEN p_description_clear = true THEN NULL ELSE COALESCE(p_description, "Description") END
    WHERE
        "ID" = p_id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    IF v_updated_count = 0 THEN
        -- Nothing was updated, return empty result set
        RETURN;
    END IF;

    -- Return the updated record from the base view
    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwScoreBands"
    WHERE "ID" = p_id;
END;
$$;


--
-- Name: spUpdateScoreBandSet(uuid, character varying, boolean, uuid, boolean, text); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spUpdateScoreBandSet"(p_id uuid, p_name character varying DEFAULT NULL::character varying, p_anchorentityid_clear boolean DEFAULT false, p_anchorentityid uuid DEFAULT NULL::uuid, p_description_clear boolean DEFAULT false, p_description text DEFAULT NULL::text) RETURNS SETOF __mj_bizappssonar."vwScoreBandSets"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE __mj_bizappssonar."ScoreBandSet"
    SET
        "Name" = COALESCE(p_name, "Name"),
        "AnchorEntityID" = CASE WHEN p_anchorentityid_clear = true THEN NULL ELSE COALESCE(p_anchorentityid, "AnchorEntityID") END,
        "Description" = CASE WHEN p_description_clear = true THEN NULL ELSE COALESCE(p_description, "Description") END
    WHERE
        "ID" = p_id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    IF v_updated_count = 0 THEN
        -- Nothing was updated, return empty result set
        RETURN;
    END IF;

    -- Return the updated record from the base view
    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwScoreBandSets"
    WHERE "ID" = p_id;
END;
$$;


--
-- Name: spUpdateScoreBandTransition(uuid, uuid, character varying, boolean, uuid, boolean, uuid, boolean, character varying, timestamp with time zone, boolean, uuid, boolean); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spUpdateScoreBandTransition"(p_id uuid, p_scoremodelid uuid DEFAULT NULL::uuid, p_anchorrecordid character varying DEFAULT NULL::character varying, p_frombandid_clear boolean DEFAULT false, p_frombandid uuid DEFAULT NULL::uuid, p_tobandid_clear boolean DEFAULT false, p_tobandid uuid DEFAULT NULL::uuid, p_direction_clear boolean DEFAULT false, p_direction character varying DEFAULT NULL::character varying, p_occurredat timestamp with time zone DEFAULT NULL::timestamp with time zone, p_recomputerunid_clear boolean DEFAULT false, p_recomputerunid uuid DEFAULT NULL::uuid, p_handled boolean DEFAULT NULL::boolean) RETURNS SETOF __mj_bizappssonar."vwScoreBandTransitions"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE __mj_bizappssonar."ScoreBandTransition"
    SET
        "ScoreModelID" = COALESCE(p_scoremodelid, "ScoreModelID"),
        "AnchorRecordID" = COALESCE(p_anchorrecordid, "AnchorRecordID"),
        "FromBandID" = CASE WHEN p_frombandid_clear = true THEN NULL ELSE COALESCE(p_frombandid, "FromBandID") END,
        "ToBandID" = CASE WHEN p_tobandid_clear = true THEN NULL ELSE COALESCE(p_tobandid, "ToBandID") END,
        "Direction" = CASE WHEN p_direction_clear = true THEN NULL ELSE COALESCE(p_direction, "Direction") END,
        "OccurredAt" = COALESCE(p_occurredat, "OccurredAt"),
        "RecomputeRunID" = CASE WHEN p_recomputerunid_clear = true THEN NULL ELSE COALESCE(p_recomputerunid, "RecomputeRunID") END,
        "Handled" = COALESCE(p_handled, "Handled")
    WHERE
        "ID" = p_id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    IF v_updated_count = 0 THEN
        -- Nothing was updated, return empty result set
        RETURN;
    END IF;

    -- Return the updated record from the base view
    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwScoreBandTransitions"
    WHERE "ID" = p_id;
END;
$$;


--
-- Name: spUpdateScoreFactorContribution(uuid, uuid, uuid, uuid, boolean, numeric, boolean, numeric, boolean, numeric, boolean, numeric, boolean, numeric, boolean, boolean, boolean, text); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spUpdateScoreFactorContribution"(p_id uuid, p_scoreid uuid DEFAULT NULL::uuid, p_modelfactorid uuid DEFAULT NULL::uuid, p_factorid uuid DEFAULT NULL::uuid, p_rawvalue_clear boolean DEFAULT false, p_rawvalue numeric DEFAULT NULL::numeric, p_normalizedvalue_clear boolean DEFAULT false, p_normalizedvalue numeric DEFAULT NULL::numeric, p_weightedcontribution_clear boolean DEFAULT false, p_weightedcontribution numeric DEFAULT NULL::numeric, p_percentoftotal_clear boolean DEFAULT false, p_percentoftotal numeric DEFAULT NULL::numeric, p_contributiondelta_clear boolean DEFAULT false, p_contributiondelta numeric DEFAULT NULL::numeric, p_haddata boolean DEFAULT NULL::boolean, p_missingdataapplied boolean DEFAULT NULL::boolean, p_detailjson_clear boolean DEFAULT false, p_detailjson text DEFAULT NULL::text) RETURNS SETOF __mj_bizappssonar."vwScoreFactorContributions"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE __mj_bizappssonar."ScoreFactorContribution"
    SET
        "ScoreID" = COALESCE(p_scoreid, "ScoreID"),
        "ModelFactorID" = COALESCE(p_modelfactorid, "ModelFactorID"),
        "FactorID" = COALESCE(p_factorid, "FactorID"),
        "RawValue" = CASE WHEN p_rawvalue_clear = true THEN NULL ELSE COALESCE(p_rawvalue, "RawValue") END,
        "NormalizedValue" = CASE WHEN p_normalizedvalue_clear = true THEN NULL ELSE COALESCE(p_normalizedvalue, "NormalizedValue") END,
        "WeightedContribution" = CASE WHEN p_weightedcontribution_clear = true THEN NULL ELSE COALESCE(p_weightedcontribution, "WeightedContribution") END,
        "PercentOfTotal" = CASE WHEN p_percentoftotal_clear = true THEN NULL ELSE COALESCE(p_percentoftotal, "PercentOfTotal") END,
        "ContributionDelta" = CASE WHEN p_contributiondelta_clear = true THEN NULL ELSE COALESCE(p_contributiondelta, "ContributionDelta") END,
        "HadData" = COALESCE(p_haddata, "HadData"),
        "MissingDataApplied" = COALESCE(p_missingdataapplied, "MissingDataApplied"),
        "DetailJSON" = CASE WHEN p_detailjson_clear = true THEN NULL ELSE COALESCE(p_detailjson, "DetailJSON") END
    WHERE
        "ID" = p_id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    IF v_updated_count = 0 THEN
        -- Nothing was updated, return empty result set
        RETURN;
    END IF;

    -- Return the updated record from the base view
    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwScoreFactorContributions"
    WHERE "ID" = p_id;
END;
$$;


--
-- Name: spUpdateScoreHistory(uuid, uuid, uuid, uuid, character varying, boolean, numeric, boolean, uuid, boolean, timestamp with time zone, timestamp with time zone, boolean, numeric, boolean, numeric, boolean, text); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spUpdateScoreHistory"(p_id uuid, p_scoremodelid uuid DEFAULT NULL::uuid, p_scoremodelversionid uuid DEFAULT NULL::uuid, p_anchorentityid uuid DEFAULT NULL::uuid, p_anchorrecordid character varying DEFAULT NULL::character varying, p_normalizedscore_clear boolean DEFAULT false, p_normalizedscore numeric DEFAULT NULL::numeric, p_bandid_clear boolean DEFAULT false, p_bandid uuid DEFAULT NULL::uuid, p_asofdate_clear boolean DEFAULT false, p_asofdate timestamp with time zone DEFAULT NULL::timestamp with time zone, p_computedat timestamp with time zone DEFAULT NULL::timestamp with time zone, p_datacompleteness_clear boolean DEFAULT false, p_datacompleteness numeric DEFAULT NULL::numeric, p_confidence_clear boolean DEFAULT false, p_confidence numeric DEFAULT NULL::numeric, p_contributionsjson_clear boolean DEFAULT false, p_contributionsjson text DEFAULT NULL::text) RETURNS SETOF __mj_bizappssonar."vwScoreHistories"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE __mj_bizappssonar."ScoreHistory"
    SET
        "ScoreModelID" = COALESCE(p_scoremodelid, "ScoreModelID"),
        "ScoreModelVersionID" = COALESCE(p_scoremodelversionid, "ScoreModelVersionID"),
        "AnchorEntityID" = COALESCE(p_anchorentityid, "AnchorEntityID"),
        "AnchorRecordID" = COALESCE(p_anchorrecordid, "AnchorRecordID"),
        "NormalizedScore" = CASE WHEN p_normalizedscore_clear = true THEN NULL ELSE COALESCE(p_normalizedscore, "NormalizedScore") END,
        "BandID" = CASE WHEN p_bandid_clear = true THEN NULL ELSE COALESCE(p_bandid, "BandID") END,
        "AsOfDate" = CASE WHEN p_asofdate_clear = true THEN NULL ELSE COALESCE(p_asofdate, "AsOfDate") END,
        "ComputedAt" = COALESCE(p_computedat, "ComputedAt"),
        "DataCompleteness" = CASE WHEN p_datacompleteness_clear = true THEN NULL ELSE COALESCE(p_datacompleteness, "DataCompleteness") END,
        "Confidence" = CASE WHEN p_confidence_clear = true THEN NULL ELSE COALESCE(p_confidence, "Confidence") END,
        "ContributionsJSON" = CASE WHEN p_contributionsjson_clear = true THEN NULL ELSE COALESCE(p_contributionsjson, "ContributionsJSON") END
    WHERE
        "ID" = p_id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    IF v_updated_count = 0 THEN
        -- Nothing was updated, return empty result set
        RETURN;
    END IF;

    -- Return the updated record from the base view
    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwScoreHistories"
    WHERE "ID" = p_id;
END;
$$;


--
-- Name: spUpdateScoreModel(uuid, character varying, character varying, boolean, text, uuid, character varying, boolean, uuid, numeric, numeric, character varying, boolean, text, boolean, uuid, boolean, text, character varying, boolean, character varying, character varying, boolean, boolean, integer, boolean, uuid, boolean, timestamp with time zone, boolean, timestamp with time zone, boolean, text); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spUpdateScoreModel"(p_id uuid, p_name character varying DEFAULT NULL::character varying, p_slug character varying DEFAULT NULL::character varying, p_description_clear boolean DEFAULT false, p_description text DEFAULT NULL::text, p_anchorentityid uuid DEFAULT NULL::uuid, p_status character varying DEFAULT NULL::character varying, p_currentversionid_clear boolean DEFAULT false, p_currentversionid uuid DEFAULT NULL::uuid, p_scorescalemin numeric DEFAULT NULL::numeric, p_scorescalemax numeric DEFAULT NULL::numeric, p_combinestrategy character varying DEFAULT NULL::character varying, p_combineexpression_clear boolean DEFAULT false, p_combineexpression text DEFAULT NULL::text, p_bandsetid_clear boolean DEFAULT false, p_bandsetid uuid DEFAULT NULL::uuid, p_populationfilter_clear boolean DEFAULT false, p_populationfilter text DEFAULT NULL::text, p_recomputemode character varying DEFAULT NULL::character varying, p_recomputecron_clear boolean DEFAULT false, p_recomputecron character varying DEFAULT NULL::character varying, p_asofstrategy character varying DEFAULT NULL::character varying, p_iscalibrated boolean DEFAULT NULL::boolean, p_trendwindowdays_clear boolean DEFAULT false, p_trendwindowdays integer DEFAULT NULL::integer, p_owneruserid_clear boolean DEFAULT false, p_owneruserid uuid DEFAULT NULL::uuid, p_effectivefrom_clear boolean DEFAULT false, p_effectivefrom timestamp with time zone DEFAULT NULL::timestamp with time zone, p_effectiveto_clear boolean DEFAULT false, p_effectiveto timestamp with time zone DEFAULT NULL::timestamp with time zone, p_notes_clear boolean DEFAULT false, p_notes text DEFAULT NULL::text) RETURNS SETOF __mj_bizappssonar."vwScoreModels"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE __mj_bizappssonar."ScoreModel"
    SET
        "Name" = COALESCE(p_name, "Name"),
        "Slug" = COALESCE(p_slug, "Slug"),
        "Description" = CASE WHEN p_description_clear = true THEN NULL ELSE COALESCE(p_description, "Description") END,
        "AnchorEntityID" = COALESCE(p_anchorentityid, "AnchorEntityID"),
        "Status" = COALESCE(p_status, "Status"),
        "CurrentVersionID" = CASE WHEN p_currentversionid_clear = true THEN NULL ELSE COALESCE(p_currentversionid, "CurrentVersionID") END,
        "ScoreScaleMin" = COALESCE(p_scorescalemin, "ScoreScaleMin"),
        "ScoreScaleMax" = COALESCE(p_scorescalemax, "ScoreScaleMax"),
        "CombineStrategy" = COALESCE(p_combinestrategy, "CombineStrategy"),
        "CombineExpression" = CASE WHEN p_combineexpression_clear = true THEN NULL ELSE COALESCE(p_combineexpression, "CombineExpression") END,
        "BandSetID" = CASE WHEN p_bandsetid_clear = true THEN NULL ELSE COALESCE(p_bandsetid, "BandSetID") END,
        "PopulationFilter" = CASE WHEN p_populationfilter_clear = true THEN NULL ELSE COALESCE(p_populationfilter, "PopulationFilter") END,
        "RecomputeMode" = COALESCE(p_recomputemode, "RecomputeMode"),
        "RecomputeCron" = CASE WHEN p_recomputecron_clear = true THEN NULL ELSE COALESCE(p_recomputecron, "RecomputeCron") END,
        "AsOfStrategy" = COALESCE(p_asofstrategy, "AsOfStrategy"),
        "IsCalibrated" = COALESCE(p_iscalibrated, "IsCalibrated"),
        "TrendWindowDays" = CASE WHEN p_trendwindowdays_clear = true THEN NULL ELSE COALESCE(p_trendwindowdays, "TrendWindowDays") END,
        "OwnerUserID" = CASE WHEN p_owneruserid_clear = true THEN NULL ELSE COALESCE(p_owneruserid, "OwnerUserID") END,
        "EffectiveFrom" = CASE WHEN p_effectivefrom_clear = true THEN NULL ELSE COALESCE(p_effectivefrom, "EffectiveFrom") END,
        "EffectiveTo" = CASE WHEN p_effectiveto_clear = true THEN NULL ELSE COALESCE(p_effectiveto, "EffectiveTo") END,
        "Notes" = CASE WHEN p_notes_clear = true THEN NULL ELSE COALESCE(p_notes, "Notes") END
    WHERE
        "ID" = p_id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    IF v_updated_count = 0 THEN
        -- Nothing was updated, return empty result set
        RETURN;
    END IF;

    -- Return the updated record from the base view
    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwScoreModels"
    WHERE "ID" = p_id;
END;
$$;


--
-- Name: spUpdateScoreModelAuditEvent(uuid, uuid, character varying, boolean, character varying, character varying, boolean, text, boolean, text, boolean, uuid, timestamp with time zone); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spUpdateScoreModelAuditEvent"(p_id uuid, p_scoremodelid uuid DEFAULT NULL::uuid, p_entitychanged character varying DEFAULT NULL::character varying, p_recordid_clear boolean DEFAULT false, p_recordid character varying DEFAULT NULL::character varying, p_changetype character varying DEFAULT NULL::character varying, p_beforejson_clear boolean DEFAULT false, p_beforejson text DEFAULT NULL::text, p_afterjson_clear boolean DEFAULT false, p_afterjson text DEFAULT NULL::text, p_changedbyuserid_clear boolean DEFAULT false, p_changedbyuserid uuid DEFAULT NULL::uuid, p_changedat timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS SETOF __mj_bizappssonar."vwScoreModelAuditEvents"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE __mj_bizappssonar."ScoreModelAuditEvent"
    SET
        "ScoreModelID" = COALESCE(p_scoremodelid, "ScoreModelID"),
        "EntityChanged" = COALESCE(p_entitychanged, "EntityChanged"),
        "RecordID" = CASE WHEN p_recordid_clear = true THEN NULL ELSE COALESCE(p_recordid, "RecordID") END,
        "ChangeType" = COALESCE(p_changetype, "ChangeType"),
        "BeforeJSON" = CASE WHEN p_beforejson_clear = true THEN NULL ELSE COALESCE(p_beforejson, "BeforeJSON") END,
        "AfterJSON" = CASE WHEN p_afterjson_clear = true THEN NULL ELSE COALESCE(p_afterjson, "AfterJSON") END,
        "ChangedByUserID" = CASE WHEN p_changedbyuserid_clear = true THEN NULL ELSE COALESCE(p_changedbyuserid, "ChangedByUserID") END,
        "ChangedAt" = COALESCE(p_changedat, "ChangedAt")
    WHERE
        "ID" = p_id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    IF v_updated_count = 0 THEN
        -- Nothing was updated, return empty result set
        RETURN;
    END IF;

    -- Return the updated record from the base view
    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwScoreModelAuditEvents"
    WHERE "ID" = p_id;
END;
$$;


--
-- Name: spUpdateScoreModelVersion(uuid, uuid, integer, boolean, character varying, text, boolean, text, boolean, uuid, timestamp with time zone, boolean); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spUpdateScoreModelVersion"(p_id uuid, p_scoremodelid uuid DEFAULT NULL::uuid, p_versionnumber integer DEFAULT NULL::integer, p_versionlabel_clear boolean DEFAULT false, p_versionlabel character varying DEFAULT NULL::character varying, p_configsnapshotjson text DEFAULT NULL::text, p_changesummary_clear boolean DEFAULT false, p_changesummary text DEFAULT NULL::text, p_publishedbyuserid_clear boolean DEFAULT false, p_publishedbyuserid uuid DEFAULT NULL::uuid, p_publishedat timestamp with time zone DEFAULT NULL::timestamp with time zone, p_iscurrent boolean DEFAULT NULL::boolean) RETURNS SETOF __mj_bizappssonar."vwScoreModelVersions"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE __mj_bizappssonar."ScoreModelVersion"
    SET
        "ScoreModelID" = COALESCE(p_scoremodelid, "ScoreModelID"),
        "VersionNumber" = COALESCE(p_versionnumber, "VersionNumber"),
        "VersionLabel" = CASE WHEN p_versionlabel_clear = true THEN NULL ELSE COALESCE(p_versionlabel, "VersionLabel") END,
        "ConfigSnapshotJSON" = COALESCE(p_configsnapshotjson, "ConfigSnapshotJSON"),
        "ChangeSummary" = CASE WHEN p_changesummary_clear = true THEN NULL ELSE COALESCE(p_changesummary, "ChangeSummary") END,
        "PublishedByUserID" = CASE WHEN p_publishedbyuserid_clear = true THEN NULL ELSE COALESCE(p_publishedbyuserid, "PublishedByUserID") END,
        "PublishedAt" = COALESCE(p_publishedat, "PublishedAt"),
        "IsCurrent" = COALESCE(p_iscurrent, "IsCurrent")
    WHERE
        "ID" = p_id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    IF v_updated_count = 0 THEN
        -- Nothing was updated, return empty result set
        RETURN;
    END IF;

    -- Return the updated record from the base view
    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwScoreModelVersions"
    WHERE "ID" = p_id;
END;
$$;


--
-- Name: spUpdateScoreRecomputeRun(uuid, uuid, boolean, uuid, character varying, character varying, timestamp with time zone, boolean, timestamp with time zone, character varying, boolean, integer, boolean, integer, boolean, integer, boolean, bigint, boolean, numeric, boolean, text); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spUpdateScoreRecomputeRun"(p_id uuid, p_scoremodelid uuid DEFAULT NULL::uuid, p_scoremodelversionid_clear boolean DEFAULT false, p_scoremodelversionid uuid DEFAULT NULL::uuid, p_triggertype character varying DEFAULT NULL::character varying, p_scope character varying DEFAULT NULL::character varying, p_startedat timestamp with time zone DEFAULT NULL::timestamp with time zone, p_completedat_clear boolean DEFAULT false, p_completedat timestamp with time zone DEFAULT NULL::timestamp with time zone, p_status character varying DEFAULT NULL::character varying, p_recordsscored_clear boolean DEFAULT false, p_recordsscored integer DEFAULT NULL::integer, p_recordschanged_clear boolean DEFAULT false, p_recordschanged integer DEFAULT NULL::integer, p_bandtransitions_clear boolean DEFAULT false, p_bandtransitions integer DEFAULT NULL::integer, p_durationms_clear boolean DEFAULT false, p_durationms bigint DEFAULT NULL::bigint, p_costunitsconsumed_clear boolean DEFAULT false, p_costunitsconsumed numeric DEFAULT NULL::numeric, p_errorsjson_clear boolean DEFAULT false, p_errorsjson text DEFAULT NULL::text) RETURNS SETOF __mj_bizappssonar."vwScoreRecomputeRuns"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE __mj_bizappssonar."ScoreRecomputeRun"
    SET
        "ScoreModelID" = COALESCE(p_scoremodelid, "ScoreModelID"),
        "ScoreModelVersionID" = CASE WHEN p_scoremodelversionid_clear = true THEN NULL ELSE COALESCE(p_scoremodelversionid, "ScoreModelVersionID") END,
        "TriggerType" = COALESCE(p_triggertype, "TriggerType"),
        "Scope" = COALESCE(p_scope, "Scope"),
        "StartedAt" = COALESCE(p_startedat, "StartedAt"),
        "CompletedAt" = CASE WHEN p_completedat_clear = true THEN NULL ELSE COALESCE(p_completedat, "CompletedAt") END,
        "Status" = COALESCE(p_status, "Status"),
        "RecordsScored" = CASE WHEN p_recordsscored_clear = true THEN NULL ELSE COALESCE(p_recordsscored, "RecordsScored") END,
        "RecordsChanged" = CASE WHEN p_recordschanged_clear = true THEN NULL ELSE COALESCE(p_recordschanged, "RecordsChanged") END,
        "BandTransitions" = CASE WHEN p_bandtransitions_clear = true THEN NULL ELSE COALESCE(p_bandtransitions, "BandTransitions") END,
        "DurationMs" = CASE WHEN p_durationms_clear = true THEN NULL ELSE COALESCE(p_durationms, "DurationMs") END,
        "CostUnitsConsumed" = CASE WHEN p_costunitsconsumed_clear = true THEN NULL ELSE COALESCE(p_costunitsconsumed, "CostUnitsConsumed") END,
        "ErrorsJSON" = CASE WHEN p_errorsjson_clear = true THEN NULL ELSE COALESCE(p_errorsjson, "ErrorsJSON") END
    WHERE
        "ID" = p_id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    IF v_updated_count = 0 THEN
        -- Nothing was updated, return empty result set
        RETURN;
    END IF;

    -- Return the updated record from the base view
    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwScoreRecomputeRuns"
    WHERE "ID" = p_id;
END;
$$;


--
-- Name: spUpdateTimeWindow(uuid, character varying, character varying, boolean, integer, boolean, integer, boolean, character varying, boolean, integer, boolean, text); Type: FUNCTION; Schema: __mj_bizappssonar; Owner: -
--

CREATE FUNCTION __mj_bizappssonar."spUpdateTimeWindow"(p_id uuid, p_name character varying DEFAULT NULL::character varying, p_windowtype character varying DEFAULT NULL::character varying, p_lengthdays_clear boolean DEFAULT false, p_lengthdays integer DEFAULT NULL::integer, p_lengthmonths_clear boolean DEFAULT false, p_lengthmonths integer DEFAULT NULL::integer, p_anchordatefield_clear boolean DEFAULT false, p_anchordatefield character varying DEFAULT NULL::character varying, p_offsetdays_clear boolean DEFAULT false, p_offsetdays integer DEFAULT NULL::integer, p_description_clear boolean DEFAULT false, p_description text DEFAULT NULL::text) RETURNS SETOF __mj_bizappssonar."vwTimeWindows"
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE __mj_bizappssonar."TimeWindow"
    SET
        "Name" = COALESCE(p_name, "Name"),
        "WindowType" = COALESCE(p_windowtype, "WindowType"),
        "LengthDays" = CASE WHEN p_lengthdays_clear = true THEN NULL ELSE COALESCE(p_lengthdays, "LengthDays") END,
        "LengthMonths" = CASE WHEN p_lengthmonths_clear = true THEN NULL ELSE COALESCE(p_lengthmonths, "LengthMonths") END,
        "AnchorDateField" = CASE WHEN p_anchordatefield_clear = true THEN NULL ELSE COALESCE(p_anchordatefield, "AnchorDateField") END,
        "OffsetDays" = CASE WHEN p_offsetdays_clear = true THEN NULL ELSE COALESCE(p_offsetdays, "OffsetDays") END,
        "Description" = CASE WHEN p_description_clear = true THEN NULL ELSE COALESCE(p_description, "Description") END
    WHERE
        "ID" = p_id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    IF v_updated_count = 0 THEN
        -- Nothing was updated, return empty result set
        RETURN;
    END IF;

    -- Return the updated record from the base view
    RETURN QUERY
    SELECT * FROM __mj_bizappssonar."vwTimeWindows"
    WHERE "ID" = p_id;
END;
$$;


--
-- Data for Name: Factor; Type: TABLE DATA; Schema: __mj_bizappssonar; Owner: -
--



--
-- Data for Name: ModelFactor; Type: TABLE DATA; Schema: __mj_bizappssonar; Owner: -
--



--
-- Data for Name: ModelRelatedEntity; Type: TABLE DATA; Schema: __mj_bizappssonar; Owner: -
--



--
-- Data for Name: Score; Type: TABLE DATA; Schema: __mj_bizappssonar; Owner: -
--



--
-- Data for Name: ScoreBand; Type: TABLE DATA; Schema: __mj_bizappssonar; Owner: -
--

INSERT INTO __mj_bizappssonar."ScoreBand" VALUES ('7e3b9c42-0a1d-4e58-9b6f-2c4d8a1f0b31', '7e3b9c42-0a1d-4e58-9b6f-2c4d8a1f0b30', 'At Risk', 0.0000, 40.0000, 3, '#DC2626', false, 'Low engagement — needs intervention.', '2026-07-17 21:21:44.233155+00', '2026-07-17 21:21:44.233155+00');
INSERT INTO __mj_bizappssonar."ScoreBand" VALUES ('7e3b9c42-0a1d-4e58-9b6f-2c4d8a1f0b32', '7e3b9c42-0a1d-4e58-9b6f-2c4d8a1f0b30', 'Neutral', 40.0000, 70.0000, 2, '#F59E0B', false, 'Moderate engagement — monitor.', '2026-07-17 21:21:44.233155+00', '2026-07-17 21:21:44.233155+00');
INSERT INTO __mj_bizappssonar."ScoreBand" VALUES ('7e3b9c42-0a1d-4e58-9b6f-2c4d8a1f0b33', '7e3b9c42-0a1d-4e58-9b6f-2c4d8a1f0b30', 'Healthy', 70.0000, 100.0000, 1, '#16A34A', false, 'Strong engagement.', '2026-07-17 21:21:44.233155+00', '2026-07-17 21:21:44.233155+00');


--
-- Data for Name: ScoreBandSet; Type: TABLE DATA; Schema: __mj_bizappssonar; Owner: -
--

INSERT INTO __mj_bizappssonar."ScoreBandSet" VALUES ('7e3b9c42-0a1d-4e58-9b6f-2c4d8a1f0b30', 'Default Health Bands', NULL, 'Starter three-band rubric on a 0–100 scale: At Risk / Neutral / Healthy. A generic default operators can clone and tune per model.', '2026-07-17 21:21:44.233155+00', '2026-07-17 21:21:44.233155+00');


--
-- Data for Name: ScoreBandTransition; Type: TABLE DATA; Schema: __mj_bizappssonar; Owner: -
--



--
-- Data for Name: ScoreFactorContribution; Type: TABLE DATA; Schema: __mj_bizappssonar; Owner: -
--



--
-- Data for Name: ScoreHistory; Type: TABLE DATA; Schema: __mj_bizappssonar; Owner: -
--



--
-- Data for Name: ScoreModel; Type: TABLE DATA; Schema: __mj_bizappssonar; Owner: -
--



--
-- Data for Name: ScoreModelAuditEvent; Type: TABLE DATA; Schema: __mj_bizappssonar; Owner: -
--



--
-- Data for Name: ScoreModelVersion; Type: TABLE DATA; Schema: __mj_bizappssonar; Owner: -
--



--
-- Data for Name: ScoreRecomputeRun; Type: TABLE DATA; Schema: __mj_bizappssonar; Owner: -
--



--
-- Data for Name: TimeWindow; Type: TABLE DATA; Schema: __mj_bizappssonar; Owner: -
--

INSERT INTO __mj_bizappssonar."TimeWindow" VALUES ('bcfc53f6-d749-4e6a-b868-6b4fb46d49e5', 'Trailing 30 Days', 'Rolling', 30, NULL, NULL, NULL, 'Rolling 30-day window ending at the as-of date. Short-term recency signals (recent logins, recent opens).', '2026-07-17 21:21:44.233155+00', '2026-07-17 21:21:44.233155+00');
INSERT INTO __mj_bizappssonar."TimeWindow" VALUES ('9f60606a-3f7d-4707-a852-813b302c5db9', 'Trailing 90 Days', 'Rolling', 90, NULL, NULL, NULL, 'Rolling 90-day window ending at the as-of date. The default window for most engagement factors.', '2026-07-17 21:21:44.233155+00', '2026-07-17 21:21:44.233155+00');
INSERT INTO __mj_bizappssonar."TimeWindow" VALUES ('2349024a-8961-41e7-aaae-dd19e3c47a6e', 'Trailing 12 Months', 'Rolling', NULL, 12, NULL, NULL, 'Rolling 12-month window ending at the as-of date. Annual-cadence signals (event attendance, dues, certifications).', '2026-07-17 21:21:44.233155+00', '2026-07-17 21:21:44.233155+00');
INSERT INTO __mj_bizappssonar."TimeWindow" VALUES ('0aa0e059-2cbb-417d-8c37-4d15b6e5d0ca', 'All Time', 'AllTime', NULL, NULL, NULL, NULL, 'No time bound; aggregates over the entire history of the related entity (e.g. lifetime giving, total certifications earned).', '2026-07-17 21:21:44.233155+00', '2026-07-17 21:21:44.233155+00');
INSERT INTO __mj_bizappssonar."TimeWindow" VALUES ('d7dca423-036f-4df0-98dc-a3b43855fda0', 'Renewal Window (-90 days)', 'RenewalRelative', NULL, NULL, 'RenewalDate', -90, 'The 90 days leading up to each member''s renewal date. Lets decay close to renewal be weighted differently from decay far out.', '2026-07-17 21:21:44.233155+00', '2026-07-17 21:21:44.233155+00');


--
-- Name: Factor PK_Factor; Type: CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."Factor"
    ADD CONSTRAINT "PK_Factor" PRIMARY KEY ("ID");


--
-- Name: ModelFactor PK_ModelFactor; Type: CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ModelFactor"
    ADD CONSTRAINT "PK_ModelFactor" PRIMARY KEY ("ID");


--
-- Name: ModelRelatedEntity PK_ModelRelatedEntity; Type: CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ModelRelatedEntity"
    ADD CONSTRAINT "PK_ModelRelatedEntity" PRIMARY KEY ("ID");


--
-- Name: Score PK_Score; Type: CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."Score"
    ADD CONSTRAINT "PK_Score" PRIMARY KEY ("ID");


--
-- Name: ScoreBand PK_ScoreBand; Type: CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreBand"
    ADD CONSTRAINT "PK_ScoreBand" PRIMARY KEY ("ID");


--
-- Name: ScoreBandSet PK_ScoreBandSet; Type: CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreBandSet"
    ADD CONSTRAINT "PK_ScoreBandSet" PRIMARY KEY ("ID");


--
-- Name: ScoreBandTransition PK_ScoreBandTransition; Type: CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreBandTransition"
    ADD CONSTRAINT "PK_ScoreBandTransition" PRIMARY KEY ("ID");


--
-- Name: ScoreFactorContribution PK_ScoreFactorContribution; Type: CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreFactorContribution"
    ADD CONSTRAINT "PK_ScoreFactorContribution" PRIMARY KEY ("ID");


--
-- Name: ScoreHistory PK_ScoreHistory; Type: CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreHistory"
    ADD CONSTRAINT "PK_ScoreHistory" PRIMARY KEY ("ID");


--
-- Name: ScoreModel PK_ScoreModel; Type: CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreModel"
    ADD CONSTRAINT "PK_ScoreModel" PRIMARY KEY ("ID");


--
-- Name: ScoreModelAuditEvent PK_ScoreModelAuditEvent; Type: CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreModelAuditEvent"
    ADD CONSTRAINT "PK_ScoreModelAuditEvent" PRIMARY KEY ("ID");


--
-- Name: ScoreModelVersion PK_ScoreModelVersion; Type: CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreModelVersion"
    ADD CONSTRAINT "PK_ScoreModelVersion" PRIMARY KEY ("ID");


--
-- Name: ScoreRecomputeRun PK_ScoreRecomputeRun; Type: CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreRecomputeRun"
    ADD CONSTRAINT "PK_ScoreRecomputeRun" PRIMARY KEY ("ID");


--
-- Name: TimeWindow PK_TimeWindow; Type: CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."TimeWindow"
    ADD CONSTRAINT "PK_TimeWindow" PRIMARY KEY ("ID");


--
-- Name: ModelFactor UQ_ModelFactor_ModelFactor; Type: CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ModelFactor"
    ADD CONSTRAINT "UQ_ModelFactor_ModelFactor" UNIQUE ("ScoreModelID", "FactorID");


--
-- Name: ModelRelatedEntity UQ_ModelRelatedEntity_ModelAlias; Type: CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ModelRelatedEntity"
    ADD CONSTRAINT "UQ_ModelRelatedEntity_ModelAlias" UNIQUE ("ScoreModelID", "Alias");


--
-- Name: ScoreModelVersion UQ_ScoreModelVersion_ModelVersion; Type: CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreModelVersion"
    ADD CONSTRAINT "UQ_ScoreModelVersion_ModelVersion" UNIQUE ("ScoreModelID", "VersionNumber");


--
-- Name: ScoreModel UQ_ScoreModel_Slug; Type: CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreModel"
    ADD CONSTRAINT "UQ_ScoreModel_Slug" UNIQUE ("Slug");


--
-- Name: Score UQ_Score_ModelAnchorRecord; Type: CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."Score"
    ADD CONSTRAINT "UQ_Score_ModelAnchorRecord" UNIQUE ("ScoreModelID", "AnchorRecordID");


--
-- Name: IX_Factor_AnchorEntity_FactorType; Type: INDEX; Schema: __mj_bizappssonar; Owner: -
--

CREATE INDEX "IX_Factor_AnchorEntity_FactorType" ON __mj_bizappssonar."Factor" USING btree ("AnchorEntityID", "FactorType");


--
-- Name: IX_ScoreBandTransition_Handled; Type: INDEX; Schema: __mj_bizappssonar; Owner: -
--

CREATE INDEX "IX_ScoreBandTransition_Handled" ON __mj_bizappssonar."ScoreBandTransition" USING btree ("Handled");


--
-- Name: IX_ScoreBandTransition_Model_OccurredAt; Type: INDEX; Schema: __mj_bizappssonar; Owner: -
--

CREATE INDEX "IX_ScoreBandTransition_Model_OccurredAt" ON __mj_bizappssonar."ScoreBandTransition" USING btree ("ScoreModelID", "OccurredAt");


--
-- Name: IX_ScoreHistory_Model_Anchor_AsOf; Type: INDEX; Schema: __mj_bizappssonar; Owner: -
--

CREATE INDEX "IX_ScoreHistory_Model_Anchor_AsOf" ON __mj_bizappssonar."ScoreHistory" USING btree ("ScoreModelID", "AnchorRecordID", "AsOfDate");


--
-- Name: IX_ScoreModel_AnchorEntity_Status; Type: INDEX; Schema: __mj_bizappssonar; Owner: -
--

CREATE INDEX "IX_ScoreModel_AnchorEntity_Status" ON __mj_bizappssonar."ScoreModel" USING btree ("AnchorEntityID", "Status");


--
-- Name: IX_Score_Model_Band; Type: INDEX; Schema: __mj_bizappssonar; Owner: -
--

CREATE INDEX "IX_Score_Model_Band" ON __mj_bizappssonar."Score" USING btree ("ScoreModelID", "BandID");


--
-- Name: IX_Score_Model_NormalizedScore; Type: INDEX; Schema: __mj_bizappssonar; Owner: -
--

CREATE INDEX "IX_Score_Model_NormalizedScore" ON __mj_bizappssonar."Score" USING btree ("ScoreModelID", "NormalizedScore");


--
-- Name: IX_Score_Model_Trend_Delta; Type: INDEX; Schema: __mj_bizappssonar; Owner: -
--

CREATE INDEX "IX_Score_Model_Trend_Delta" ON __mj_bizappssonar."Score" USING btree ("ScoreModelID", "TrendDirection", "Delta");


--
-- Name: Factor trg_update_factor; Type: TRIGGER; Schema: __mj_bizappssonar; Owner: -
--

CREATE TRIGGER trg_update_factor BEFORE UPDATE ON __mj_bizappssonar."Factor" FOR EACH ROW EXECUTE FUNCTION __mj_bizappssonar.fn_trg_update_factor();


--
-- Name: ModelFactor trg_update_model_factor; Type: TRIGGER; Schema: __mj_bizappssonar; Owner: -
--

CREATE TRIGGER trg_update_model_factor BEFORE UPDATE ON __mj_bizappssonar."ModelFactor" FOR EACH ROW EXECUTE FUNCTION __mj_bizappssonar.fn_trg_update_model_factor();


--
-- Name: ModelRelatedEntity trg_update_model_related_entity; Type: TRIGGER; Schema: __mj_bizappssonar; Owner: -
--

CREATE TRIGGER trg_update_model_related_entity BEFORE UPDATE ON __mj_bizappssonar."ModelRelatedEntity" FOR EACH ROW EXECUTE FUNCTION __mj_bizappssonar.fn_trg_update_model_related_entity();


--
-- Name: Score trg_update_score; Type: TRIGGER; Schema: __mj_bizappssonar; Owner: -
--

CREATE TRIGGER trg_update_score BEFORE UPDATE ON __mj_bizappssonar."Score" FOR EACH ROW EXECUTE FUNCTION __mj_bizappssonar.fn_trg_update_score();


--
-- Name: ScoreBand trg_update_score_band; Type: TRIGGER; Schema: __mj_bizappssonar; Owner: -
--

CREATE TRIGGER trg_update_score_band BEFORE UPDATE ON __mj_bizappssonar."ScoreBand" FOR EACH ROW EXECUTE FUNCTION __mj_bizappssonar.fn_trg_update_score_band();


--
-- Name: ScoreBandSet trg_update_score_band_set; Type: TRIGGER; Schema: __mj_bizappssonar; Owner: -
--

CREATE TRIGGER trg_update_score_band_set BEFORE UPDATE ON __mj_bizappssonar."ScoreBandSet" FOR EACH ROW EXECUTE FUNCTION __mj_bizappssonar.fn_trg_update_score_band_set();


--
-- Name: ScoreBandTransition trg_update_score_band_transition; Type: TRIGGER; Schema: __mj_bizappssonar; Owner: -
--

CREATE TRIGGER trg_update_score_band_transition BEFORE UPDATE ON __mj_bizappssonar."ScoreBandTransition" FOR EACH ROW EXECUTE FUNCTION __mj_bizappssonar.fn_trg_update_score_band_transition();


--
-- Name: ScoreFactorContribution trg_update_score_factor_contribution; Type: TRIGGER; Schema: __mj_bizappssonar; Owner: -
--

CREATE TRIGGER trg_update_score_factor_contribution BEFORE UPDATE ON __mj_bizappssonar."ScoreFactorContribution" FOR EACH ROW EXECUTE FUNCTION __mj_bizappssonar.fn_trg_update_score_factor_contribution();


--
-- Name: ScoreHistory trg_update_score_history; Type: TRIGGER; Schema: __mj_bizappssonar; Owner: -
--

CREATE TRIGGER trg_update_score_history BEFORE UPDATE ON __mj_bizappssonar."ScoreHistory" FOR EACH ROW EXECUTE FUNCTION __mj_bizappssonar.fn_trg_update_score_history();


--
-- Name: ScoreModel trg_update_score_model; Type: TRIGGER; Schema: __mj_bizappssonar; Owner: -
--

CREATE TRIGGER trg_update_score_model BEFORE UPDATE ON __mj_bizappssonar."ScoreModel" FOR EACH ROW EXECUTE FUNCTION __mj_bizappssonar.fn_trg_update_score_model();


--
-- Name: ScoreModelAuditEvent trg_update_score_model_audit_event; Type: TRIGGER; Schema: __mj_bizappssonar; Owner: -
--

CREATE TRIGGER trg_update_score_model_audit_event BEFORE UPDATE ON __mj_bizappssonar."ScoreModelAuditEvent" FOR EACH ROW EXECUTE FUNCTION __mj_bizappssonar.fn_trg_update_score_model_audit_event();


--
-- Name: ScoreModelVersion trg_update_score_model_version; Type: TRIGGER; Schema: __mj_bizappssonar; Owner: -
--

CREATE TRIGGER trg_update_score_model_version BEFORE UPDATE ON __mj_bizappssonar."ScoreModelVersion" FOR EACH ROW EXECUTE FUNCTION __mj_bizappssonar.fn_trg_update_score_model_version();


--
-- Name: ScoreRecomputeRun trg_update_score_recompute_run; Type: TRIGGER; Schema: __mj_bizappssonar; Owner: -
--

CREATE TRIGGER trg_update_score_recompute_run BEFORE UPDATE ON __mj_bizappssonar."ScoreRecomputeRun" FOR EACH ROW EXECUTE FUNCTION __mj_bizappssonar.fn_trg_update_score_recompute_run();


--
-- Name: TimeWindow trg_update_time_window; Type: TRIGGER; Schema: __mj_bizappssonar; Owner: -
--

CREATE TRIGGER trg_update_time_window BEFORE UPDATE ON __mj_bizappssonar."TimeWindow" FOR EACH ROW EXECUTE FUNCTION __mj_bizappssonar.fn_trg_update_time_window();


--
-- Name: Factor FK_Factor_Action; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."Factor"
    ADD CONSTRAINT "FK_Factor_Action" FOREIGN KEY ("ActionID") REFERENCES __mj."Action"("ID");


--
-- Name: Factor FK_Factor_AnchorEntity; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."Factor"
    ADD CONSTRAINT "FK_Factor_AnchorEntity" FOREIGN KEY ("AnchorEntityID") REFERENCES __mj."Entity"("ID");


--
-- Name: Factor FK_Factor_ScoreModel; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."Factor"
    ADD CONSTRAINT "FK_Factor_ScoreModel" FOREIGN KEY ("ScoreModelID") REFERENCES __mj_bizappssonar."ScoreModel"("ID");


--
-- Name: Factor FK_Factor_SourceEntity; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."Factor"
    ADD CONSTRAINT "FK_Factor_SourceEntity" FOREIGN KEY ("SourceEntityID") REFERENCES __mj."Entity"("ID");


--
-- Name: Factor FK_Factor_SourceRelatedEntity; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."Factor"
    ADD CONSTRAINT "FK_Factor_SourceRelatedEntity" FOREIGN KEY ("SourceRelatedEntityID") REFERENCES __mj_bizappssonar."ModelRelatedEntity"("ID");


--
-- Name: Factor FK_Factor_SourceScoreModel; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."Factor"
    ADD CONSTRAINT "FK_Factor_SourceScoreModel" FOREIGN KEY ("SourceScoreModelID") REFERENCES __mj_bizappssonar."ScoreModel"("ID");


--
-- Name: Factor FK_Factor_TimeWindow; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."Factor"
    ADD CONSTRAINT "FK_Factor_TimeWindow" FOREIGN KEY ("TimeWindowID") REFERENCES __mj_bizappssonar."TimeWindow"("ID");


--
-- Name: ModelFactor FK_ModelFactor_Factor; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ModelFactor"
    ADD CONSTRAINT "FK_ModelFactor_Factor" FOREIGN KEY ("FactorID") REFERENCES __mj_bizappssonar."Factor"("ID");


--
-- Name: ModelFactor FK_ModelFactor_ScoreModel; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ModelFactor"
    ADD CONSTRAINT "FK_ModelFactor_ScoreModel" FOREIGN KEY ("ScoreModelID") REFERENCES __mj_bizappssonar."ScoreModel"("ID");


--
-- Name: ModelRelatedEntity FK_ModelRelatedEntity_RelatedEntity; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ModelRelatedEntity"
    ADD CONSTRAINT "FK_ModelRelatedEntity_RelatedEntity" FOREIGN KEY ("RelatedEntityID") REFERENCES __mj."Entity"("ID");


--
-- Name: ModelRelatedEntity FK_ModelRelatedEntity_ScoreModel; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ModelRelatedEntity"
    ADD CONSTRAINT "FK_ModelRelatedEntity_ScoreModel" FOREIGN KEY ("ScoreModelID") REFERENCES __mj_bizappssonar."ScoreModel"("ID");


--
-- Name: ScoreBandSet FK_ScoreBandSet_AnchorEntity; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreBandSet"
    ADD CONSTRAINT "FK_ScoreBandSet_AnchorEntity" FOREIGN KEY ("AnchorEntityID") REFERENCES __mj."Entity"("ID");


--
-- Name: ScoreBandTransition FK_ScoreBandTransition_FromBand; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreBandTransition"
    ADD CONSTRAINT "FK_ScoreBandTransition_FromBand" FOREIGN KEY ("FromBandID") REFERENCES __mj_bizappssonar."ScoreBand"("ID");


--
-- Name: ScoreBandTransition FK_ScoreBandTransition_RecomputeRun; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreBandTransition"
    ADD CONSTRAINT "FK_ScoreBandTransition_RecomputeRun" FOREIGN KEY ("RecomputeRunID") REFERENCES __mj_bizappssonar."ScoreRecomputeRun"("ID");


--
-- Name: ScoreBandTransition FK_ScoreBandTransition_ScoreModel; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreBandTransition"
    ADD CONSTRAINT "FK_ScoreBandTransition_ScoreModel" FOREIGN KEY ("ScoreModelID") REFERENCES __mj_bizappssonar."ScoreModel"("ID");


--
-- Name: ScoreBandTransition FK_ScoreBandTransition_ToBand; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreBandTransition"
    ADD CONSTRAINT "FK_ScoreBandTransition_ToBand" FOREIGN KEY ("ToBandID") REFERENCES __mj_bizappssonar."ScoreBand"("ID");


--
-- Name: ScoreBand FK_ScoreBand_BandSet; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreBand"
    ADD CONSTRAINT "FK_ScoreBand_BandSet" FOREIGN KEY ("BandSetID") REFERENCES __mj_bizappssonar."ScoreBandSet"("ID");


--
-- Name: ScoreFactorContribution FK_ScoreFactorContribution_Factor; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreFactorContribution"
    ADD CONSTRAINT "FK_ScoreFactorContribution_Factor" FOREIGN KEY ("FactorID") REFERENCES __mj_bizappssonar."Factor"("ID");


--
-- Name: ScoreFactorContribution FK_ScoreFactorContribution_ModelFactor; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreFactorContribution"
    ADD CONSTRAINT "FK_ScoreFactorContribution_ModelFactor" FOREIGN KEY ("ModelFactorID") REFERENCES __mj_bizappssonar."ModelFactor"("ID");


--
-- Name: ScoreFactorContribution FK_ScoreFactorContribution_Score; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreFactorContribution"
    ADD CONSTRAINT "FK_ScoreFactorContribution_Score" FOREIGN KEY ("ScoreID") REFERENCES __mj_bizappssonar."Score"("ID");


--
-- Name: ScoreHistory FK_ScoreHistory_AnchorEntity; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreHistory"
    ADD CONSTRAINT "FK_ScoreHistory_AnchorEntity" FOREIGN KEY ("AnchorEntityID") REFERENCES __mj."Entity"("ID");


--
-- Name: ScoreHistory FK_ScoreHistory_Band; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreHistory"
    ADD CONSTRAINT "FK_ScoreHistory_Band" FOREIGN KEY ("BandID") REFERENCES __mj_bizappssonar."ScoreBand"("ID");


--
-- Name: ScoreHistory FK_ScoreHistory_ScoreModel; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreHistory"
    ADD CONSTRAINT "FK_ScoreHistory_ScoreModel" FOREIGN KEY ("ScoreModelID") REFERENCES __mj_bizappssonar."ScoreModel"("ID");


--
-- Name: ScoreHistory FK_ScoreHistory_ScoreModelVersion; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreHistory"
    ADD CONSTRAINT "FK_ScoreHistory_ScoreModelVersion" FOREIGN KEY ("ScoreModelVersionID") REFERENCES __mj_bizappssonar."ScoreModelVersion"("ID");


--
-- Name: ScoreModelAuditEvent FK_ScoreModelAuditEvent_ChangedByUser; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreModelAuditEvent"
    ADD CONSTRAINT "FK_ScoreModelAuditEvent_ChangedByUser" FOREIGN KEY ("ChangedByUserID") REFERENCES __mj."User"("ID");


--
-- Name: ScoreModelAuditEvent FK_ScoreModelAuditEvent_ScoreModel; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreModelAuditEvent"
    ADD CONSTRAINT "FK_ScoreModelAuditEvent_ScoreModel" FOREIGN KEY ("ScoreModelID") REFERENCES __mj_bizappssonar."ScoreModel"("ID");


--
-- Name: ScoreModelVersion FK_ScoreModelVersion_PublishedByUser; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreModelVersion"
    ADD CONSTRAINT "FK_ScoreModelVersion_PublishedByUser" FOREIGN KEY ("PublishedByUserID") REFERENCES __mj."User"("ID");


--
-- Name: ScoreModelVersion FK_ScoreModelVersion_ScoreModel; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreModelVersion"
    ADD CONSTRAINT "FK_ScoreModelVersion_ScoreModel" FOREIGN KEY ("ScoreModelID") REFERENCES __mj_bizappssonar."ScoreModel"("ID");


--
-- Name: ScoreModel FK_ScoreModel_AnchorEntity; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreModel"
    ADD CONSTRAINT "FK_ScoreModel_AnchorEntity" FOREIGN KEY ("AnchorEntityID") REFERENCES __mj."Entity"("ID");


--
-- Name: ScoreModel FK_ScoreModel_BandSet; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreModel"
    ADD CONSTRAINT "FK_ScoreModel_BandSet" FOREIGN KEY ("BandSetID") REFERENCES __mj_bizappssonar."ScoreBandSet"("ID");


--
-- Name: ScoreModel FK_ScoreModel_CurrentVersion; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreModel"
    ADD CONSTRAINT "FK_ScoreModel_CurrentVersion" FOREIGN KEY ("CurrentVersionID") REFERENCES __mj_bizappssonar."ScoreModelVersion"("ID");


--
-- Name: ScoreModel FK_ScoreModel_OwnerUser; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreModel"
    ADD CONSTRAINT "FK_ScoreModel_OwnerUser" FOREIGN KEY ("OwnerUserID") REFERENCES __mj."User"("ID");


--
-- Name: ScoreRecomputeRun FK_ScoreRecomputeRun_ScoreModel; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreRecomputeRun"
    ADD CONSTRAINT "FK_ScoreRecomputeRun_ScoreModel" FOREIGN KEY ("ScoreModelID") REFERENCES __mj_bizappssonar."ScoreModel"("ID");


--
-- Name: ScoreRecomputeRun FK_ScoreRecomputeRun_ScoreModelVersion; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."ScoreRecomputeRun"
    ADD CONSTRAINT "FK_ScoreRecomputeRun_ScoreModelVersion" FOREIGN KEY ("ScoreModelVersionID") REFERENCES __mj_bizappssonar."ScoreModelVersion"("ID");


--
-- Name: Score FK_Score_AnchorEntity; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."Score"
    ADD CONSTRAINT "FK_Score_AnchorEntity" FOREIGN KEY ("AnchorEntityID") REFERENCES __mj."Entity"("ID");


--
-- Name: Score FK_Score_Band; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."Score"
    ADD CONSTRAINT "FK_Score_Band" FOREIGN KEY ("BandID") REFERENCES __mj_bizappssonar."ScoreBand"("ID");


--
-- Name: Score FK_Score_PreviousBand; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."Score"
    ADD CONSTRAINT "FK_Score_PreviousBand" FOREIGN KEY ("PreviousBandID") REFERENCES __mj_bizappssonar."ScoreBand"("ID");


--
-- Name: Score FK_Score_ScoreModel; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."Score"
    ADD CONSTRAINT "FK_Score_ScoreModel" FOREIGN KEY ("ScoreModelID") REFERENCES __mj_bizappssonar."ScoreModel"("ID");


--
-- Name: Score FK_Score_ScoreModelVersion; Type: FK CONSTRAINT; Schema: __mj_bizappssonar; Owner: -
--

ALTER TABLE ONLY __mj_bizappssonar."Score"
    ADD CONSTRAINT "FK_Score_ScoreModelVersion" FOREIGN KEY ("ScoreModelVersionID") REFERENCES __mj_bizappssonar."ScoreModelVersion"("ID");


--
-- PostgreSQL database dump complete
--



-- ===================== Sonar __mj (core-schema) metadata: entity registration + seed =====================
-- Entity: 14 rows
INSERT INTO __mj."Entity" ("ID", "ParentID", "Name", "NameSuffix", "Description", "AutoUpdateDescription", "BaseTable", "BaseView", "BaseViewGenerated", "SchemaName", "VirtualEntity", "TrackRecordChanges", "AuditRecordAccess", "AuditViewRuns", "IncludeInAPI", "AllowAllRowsAPI", "AllowUpdateAPI", "AllowCreateAPI", "AllowDeleteAPI", "CustomResolverAPI", "AllowUserSearchAPI", "FullTextSearchEnabled", "FullTextCatalog", "FullTextCatalogGenerated", "FullTextIndex", "FullTextIndexGenerated", "FullTextSearchFunction", "FullTextSearchFunctionGenerated", "UserViewMaxRows", "spCreate", "spUpdate", "spDelete", "spCreateGenerated", "spUpdateGenerated", "spDeleteGenerated", "CascadeDeletes", "DeleteType", "AllowRecordMerge", "spMatch", "RelationshipDefaultDisplayType", "UserFormGenerated", "EntityObjectSubclassName", "EntityObjectSubclassImport", "PreferredCommunicationField", "Icon", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "RowsToPackWithSchema", "RowsToPackSampleMethod", "RowsToPackSampleCount", "RowsToPackSampleOrder", "AutoRowCountFrequency", "RowCount", "RowCountRunAt", "Status", "DisplayName", "AllowMultipleSubtypes", "AutoUpdateFullTextSearch", "AutoUpdateAllowUserSearchAPI", "TrustServerCacheCompletely", "SupportsGeoCoding", "AutoUpdateSupportsGeoCoding", "AllowCaching", "DetectExternalChanges", "ExternalDataSourceID", "ExternalObjectName") VALUES ('a04276fd-7619-4652-9f81-5e77d576cd05', NULL, 'MJ_BizApps_Sonar: Score Band Sets', NULL, 'A reusable, named set of qualitative score bands (e.g. Healthy / Watch / At-Risk / Critical) that can be shared across scoring models.', TRUE, 'ScoreBandSet', 'vwScoreBandSets', TRUE, '__mj_bizappssonar', FALSE, TRUE, FALSE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, NULL, TRUE, NULL, TRUE, NULL, TRUE, 1000, NULL, NULL, NULL, TRUE, TRUE, TRUE, FALSE, 'Hard', FALSE, NULL, 'Search', TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.393Z', '2026-07-17T21:18:07.393Z', NULL, 'None', 'random', 0, NULL, NULL, NULL, NULL, 'Active', 'Score Band Sets', FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, FALSE, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Entity" ("ID", "ParentID", "Name", "NameSuffix", "Description", "AutoUpdateDescription", "BaseTable", "BaseView", "BaseViewGenerated", "SchemaName", "VirtualEntity", "TrackRecordChanges", "AuditRecordAccess", "AuditViewRuns", "IncludeInAPI", "AllowAllRowsAPI", "AllowUpdateAPI", "AllowCreateAPI", "AllowDeleteAPI", "CustomResolverAPI", "AllowUserSearchAPI", "FullTextSearchEnabled", "FullTextCatalog", "FullTextCatalogGenerated", "FullTextIndex", "FullTextIndexGenerated", "FullTextSearchFunction", "FullTextSearchFunctionGenerated", "UserViewMaxRows", "spCreate", "spUpdate", "spDelete", "spCreateGenerated", "spUpdateGenerated", "spDeleteGenerated", "CascadeDeletes", "DeleteType", "AllowRecordMerge", "spMatch", "RelationshipDefaultDisplayType", "UserFormGenerated", "EntityObjectSubclassName", "EntityObjectSubclassImport", "PreferredCommunicationField", "Icon", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "RowsToPackWithSchema", "RowsToPackSampleMethod", "RowsToPackSampleCount", "RowsToPackSampleOrder", "AutoRowCountFrequency", "RowCount", "RowCountRunAt", "Status", "DisplayName", "AllowMultipleSubtypes", "AutoUpdateFullTextSearch", "AutoUpdateAllowUserSearchAPI", "TrustServerCacheCompletely", "SupportsGeoCoding", "AutoUpdateSupportsGeoCoding", "AllowCaching", "DetectExternalChanges", "ExternalDataSourceID", "ExternalObjectName") VALUES ('0bc33b83-3ac7-4e09-a7c6-7768454fa868', NULL, 'MJ_BizApps_Sonar: Score Bands', NULL, 'One qualitative band within a band set, defined by a half-open score range with a severity and color for sorting and display.', TRUE, 'ScoreBand', 'vwScoreBands', TRUE, '__mj_bizappssonar', FALSE, TRUE, FALSE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, NULL, TRUE, NULL, TRUE, NULL, TRUE, 1000, NULL, NULL, NULL, TRUE, TRUE, TRUE, FALSE, 'Hard', FALSE, NULL, 'Search', TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.969Z', '2026-07-17T21:18:07.969Z', NULL, 'None', 'random', 0, NULL, NULL, NULL, NULL, 'Active', 'Score Bands', FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, FALSE, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Entity" ("ID", "ParentID", "Name", "NameSuffix", "Description", "AutoUpdateDescription", "BaseTable", "BaseView", "BaseViewGenerated", "SchemaName", "VirtualEntity", "TrackRecordChanges", "AuditRecordAccess", "AuditViewRuns", "IncludeInAPI", "AllowAllRowsAPI", "AllowUpdateAPI", "AllowCreateAPI", "AllowDeleteAPI", "CustomResolverAPI", "AllowUserSearchAPI", "FullTextSearchEnabled", "FullTextCatalog", "FullTextCatalogGenerated", "FullTextIndex", "FullTextIndexGenerated", "FullTextSearchFunction", "FullTextSearchFunctionGenerated", "UserViewMaxRows", "spCreate", "spUpdate", "spDelete", "spCreateGenerated", "spUpdateGenerated", "spDeleteGenerated", "CascadeDeletes", "DeleteType", "AllowRecordMerge", "spMatch", "RelationshipDefaultDisplayType", "UserFormGenerated", "EntityObjectSubclassName", "EntityObjectSubclassImport", "PreferredCommunicationField", "Icon", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "RowsToPackWithSchema", "RowsToPackSampleMethod", "RowsToPackSampleCount", "RowsToPackSampleOrder", "AutoRowCountFrequency", "RowCount", "RowCountRunAt", "Status", "DisplayName", "AllowMultipleSubtypes", "AutoUpdateFullTextSearch", "AutoUpdateAllowUserSearchAPI", "TrustServerCacheCompletely", "SupportsGeoCoding", "AutoUpdateSupportsGeoCoding", "AllowCaching", "DetectExternalChanges", "ExternalDataSourceID", "ExternalObjectName") VALUES ('4b11c1e2-0840-4473-91dd-659e5fd11ccd', NULL, 'MJ_BizApps_Sonar: Score Models', NULL, 'The editable definition of one scoring model: anchor entity, scale, combine strategy, recompute policy, and bands. Many models can be active per tenant.', TRUE, 'ScoreModel', 'vwScoreModels', TRUE, '__mj_bizappssonar', FALSE, TRUE, FALSE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, NULL, TRUE, NULL, TRUE, NULL, TRUE, 1000, NULL, NULL, NULL, TRUE, TRUE, TRUE, FALSE, 'Hard', FALSE, NULL, 'Search', TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.975Z', '2026-07-17T21:18:07.975Z', NULL, 'None', 'random', 0, NULL, NULL, NULL, NULL, 'Active', 'Score Models', FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, FALSE, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Entity" ("ID", "ParentID", "Name", "NameSuffix", "Description", "AutoUpdateDescription", "BaseTable", "BaseView", "BaseViewGenerated", "SchemaName", "VirtualEntity", "TrackRecordChanges", "AuditRecordAccess", "AuditViewRuns", "IncludeInAPI", "AllowAllRowsAPI", "AllowUpdateAPI", "AllowCreateAPI", "AllowDeleteAPI", "CustomResolverAPI", "AllowUserSearchAPI", "FullTextSearchEnabled", "FullTextCatalog", "FullTextCatalogGenerated", "FullTextIndex", "FullTextIndexGenerated", "FullTextSearchFunction", "FullTextSearchFunctionGenerated", "UserViewMaxRows", "spCreate", "spUpdate", "spDelete", "spCreateGenerated", "spUpdateGenerated", "spDeleteGenerated", "CascadeDeletes", "DeleteType", "AllowRecordMerge", "spMatch", "RelationshipDefaultDisplayType", "UserFormGenerated", "EntityObjectSubclassName", "EntityObjectSubclassImport", "PreferredCommunicationField", "Icon", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "RowsToPackWithSchema", "RowsToPackSampleMethod", "RowsToPackSampleCount", "RowsToPackSampleOrder", "AutoRowCountFrequency", "RowCount", "RowCountRunAt", "Status", "DisplayName", "AllowMultipleSubtypes", "AutoUpdateFullTextSearch", "AutoUpdateAllowUserSearchAPI", "TrustServerCacheCompletely", "SupportsGeoCoding", "AutoUpdateSupportsGeoCoding", "AllowCaching", "DetectExternalChanges", "ExternalDataSourceID", "ExternalObjectName") VALUES ('b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', NULL, 'MJ_BizApps_Sonar: Score Model Versions', NULL, 'An immutable snapshot of a model''s complete configuration at publish time. Every Score and ScoreHistory row references the version that produced it, making scores reproducible and auditable.', TRUE, 'ScoreModelVersion', 'vwScoreModelVersions', TRUE, '__mj_bizappssonar', FALSE, TRUE, FALSE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, NULL, TRUE, NULL, TRUE, NULL, TRUE, 1000, NULL, NULL, NULL, TRUE, TRUE, TRUE, FALSE, 'Hard', FALSE, NULL, 'Search', TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.980Z', '2026-07-17T21:18:07.980Z', NULL, 'None', 'random', 0, NULL, NULL, NULL, NULL, 'Active', 'Score Model Versions', FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, FALSE, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Entity" ("ID", "ParentID", "Name", "NameSuffix", "Description", "AutoUpdateDescription", "BaseTable", "BaseView", "BaseViewGenerated", "SchemaName", "VirtualEntity", "TrackRecordChanges", "AuditRecordAccess", "AuditViewRuns", "IncludeInAPI", "AllowAllRowsAPI", "AllowUpdateAPI", "AllowCreateAPI", "AllowDeleteAPI", "CustomResolverAPI", "AllowUserSearchAPI", "FullTextSearchEnabled", "FullTextCatalog", "FullTextCatalogGenerated", "FullTextIndex", "FullTextIndexGenerated", "FullTextSearchFunction", "FullTextSearchFunctionGenerated", "UserViewMaxRows", "spCreate", "spUpdate", "spDelete", "spCreateGenerated", "spUpdateGenerated", "spDeleteGenerated", "CascadeDeletes", "DeleteType", "AllowRecordMerge", "spMatch", "RelationshipDefaultDisplayType", "UserFormGenerated", "EntityObjectSubclassName", "EntityObjectSubclassImport", "PreferredCommunicationField", "Icon", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "RowsToPackWithSchema", "RowsToPackSampleMethod", "RowsToPackSampleCount", "RowsToPackSampleOrder", "AutoRowCountFrequency", "RowCount", "RowCountRunAt", "Status", "DisplayName", "AllowMultipleSubtypes", "AutoUpdateFullTextSearch", "AutoUpdateAllowUserSearchAPI", "TrustServerCacheCompletely", "SupportsGeoCoding", "AutoUpdateSupportsGeoCoding", "AllowCaching", "DetectExternalChanges", "ExternalDataSourceID", "ExternalObjectName") VALUES ('febf5f19-11c1-457a-be6a-fa5788c9664f', NULL, 'MJ_BizApps_Sonar: Model Related Entities', NULL, 'Declares an MJ entity wired into a model and how to traverse from the anchor to it. Factors reference these by Alias.', TRUE, 'ModelRelatedEntity', 'vwModelRelatedEntities', TRUE, '__mj_bizappssonar', FALSE, TRUE, FALSE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, NULL, TRUE, NULL, TRUE, NULL, TRUE, 1000, NULL, NULL, NULL, TRUE, TRUE, TRUE, FALSE, 'Hard', FALSE, NULL, 'Search', TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.984Z', '2026-07-17T21:18:07.984Z', NULL, 'None', 'random', 0, NULL, NULL, NULL, NULL, 'Active', 'Model Related Entities', FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, FALSE, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Entity" ("ID", "ParentID", "Name", "NameSuffix", "Description", "AutoUpdateDescription", "BaseTable", "BaseView", "BaseViewGenerated", "SchemaName", "VirtualEntity", "TrackRecordChanges", "AuditRecordAccess", "AuditViewRuns", "IncludeInAPI", "AllowAllRowsAPI", "AllowUpdateAPI", "AllowCreateAPI", "AllowDeleteAPI", "CustomResolverAPI", "AllowUserSearchAPI", "FullTextSearchEnabled", "FullTextCatalog", "FullTextCatalogGenerated", "FullTextIndex", "FullTextIndexGenerated", "FullTextSearchFunction", "FullTextSearchFunctionGenerated", "UserViewMaxRows", "spCreate", "spUpdate", "spDelete", "spCreateGenerated", "spUpdateGenerated", "spDeleteGenerated", "CascadeDeletes", "DeleteType", "AllowRecordMerge", "spMatch", "RelationshipDefaultDisplayType", "UserFormGenerated", "EntityObjectSubclassName", "EntityObjectSubclassImport", "PreferredCommunicationField", "Icon", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "RowsToPackWithSchema", "RowsToPackSampleMethod", "RowsToPackSampleCount", "RowsToPackSampleOrder", "AutoRowCountFrequency", "RowCount", "RowCountRunAt", "Status", "DisplayName", "AllowMultipleSubtypes", "AutoUpdateFullTextSearch", "AutoUpdateAllowUserSearchAPI", "TrustServerCacheCompletely", "SupportsGeoCoding", "AutoUpdateSupportsGeoCoding", "AllowCaching", "DetectExternalChanges", "ExternalDataSourceID", "ExternalObjectName") VALUES ('5681aa78-18a8-41ef-974d-27cf8f54d818', NULL, 'MJ_BizApps_Sonar: Factors', NULL, 'A reusable signal definition that satisfies one uniform contract. Declarative factors compile to set-based SQL; ActionBacked factors wrap an MJ Action; DerivedFromScore factors consume another model''s score.', TRUE, 'Factor', 'vwFactors', TRUE, '__mj_bizappssonar', FALSE, TRUE, FALSE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, NULL, TRUE, NULL, TRUE, NULL, TRUE, 1000, NULL, NULL, NULL, TRUE, TRUE, TRUE, FALSE, 'Hard', FALSE, NULL, 'Search', TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.988Z', '2026-07-17T21:18:07.988Z', NULL, 'None', 'random', 0, NULL, NULL, NULL, NULL, 'Active', 'Factors', FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, FALSE, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Entity" ("ID", "ParentID", "Name", "NameSuffix", "Description", "AutoUpdateDescription", "BaseTable", "BaseView", "BaseViewGenerated", "SchemaName", "VirtualEntity", "TrackRecordChanges", "AuditRecordAccess", "AuditViewRuns", "IncludeInAPI", "AllowAllRowsAPI", "AllowUpdateAPI", "AllowCreateAPI", "AllowDeleteAPI", "CustomResolverAPI", "AllowUserSearchAPI", "FullTextSearchEnabled", "FullTextCatalog", "FullTextCatalogGenerated", "FullTextIndex", "FullTextIndexGenerated", "FullTextSearchFunction", "FullTextSearchFunctionGenerated", "UserViewMaxRows", "spCreate", "spUpdate", "spDelete", "spCreateGenerated", "spUpdateGenerated", "spDeleteGenerated", "CascadeDeletes", "DeleteType", "AllowRecordMerge", "spMatch", "RelationshipDefaultDisplayType", "UserFormGenerated", "EntityObjectSubclassName", "EntityObjectSubclassImport", "PreferredCommunicationField", "Icon", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "RowsToPackWithSchema", "RowsToPackSampleMethod", "RowsToPackSampleCount", "RowsToPackSampleOrder", "AutoRowCountFrequency", "RowCount", "RowCountRunAt", "Status", "DisplayName", "AllowMultipleSubtypes", "AutoUpdateFullTextSearch", "AutoUpdateAllowUserSearchAPI", "TrustServerCacheCompletely", "SupportsGeoCoding", "AutoUpdateSupportsGeoCoding", "AllowCaching", "DetectExternalChanges", "ExternalDataSourceID", "ExternalObjectName") VALUES ('395aba56-2927-4651-924c-869db1cfaebd', NULL, 'MJ_BizApps_Sonar: Time Windows', NULL, 'A reusable, first-class time window used when evaluating factors (e.g. trailing 90 days, current term, renewal window -90d).', TRUE, 'TimeWindow', 'vwTimeWindows', TRUE, '__mj_bizappssonar', FALSE, TRUE, FALSE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, NULL, TRUE, NULL, TRUE, NULL, TRUE, 1000, NULL, NULL, NULL, TRUE, TRUE, TRUE, FALSE, 'Hard', FALSE, NULL, 'Search', TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.991Z', '2026-07-17T21:18:07.991Z', NULL, 'None', 'random', 0, NULL, NULL, NULL, NULL, 'Active', 'Time Windows', FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, FALSE, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Entity" ("ID", "ParentID", "Name", "NameSuffix", "Description", "AutoUpdateDescription", "BaseTable", "BaseView", "BaseViewGenerated", "SchemaName", "VirtualEntity", "TrackRecordChanges", "AuditRecordAccess", "AuditViewRuns", "IncludeInAPI", "AllowAllRowsAPI", "AllowUpdateAPI", "AllowCreateAPI", "AllowDeleteAPI", "CustomResolverAPI", "AllowUserSearchAPI", "FullTextSearchEnabled", "FullTextCatalog", "FullTextCatalogGenerated", "FullTextIndex", "FullTextIndexGenerated", "FullTextSearchFunction", "FullTextSearchFunctionGenerated", "UserViewMaxRows", "spCreate", "spUpdate", "spDelete", "spCreateGenerated", "spUpdateGenerated", "spDeleteGenerated", "CascadeDeletes", "DeleteType", "AllowRecordMerge", "spMatch", "RelationshipDefaultDisplayType", "UserFormGenerated", "EntityObjectSubclassName", "EntityObjectSubclassImport", "PreferredCommunicationField", "Icon", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "RowsToPackWithSchema", "RowsToPackSampleMethod", "RowsToPackSampleCount", "RowsToPackSampleOrder", "AutoRowCountFrequency", "RowCount", "RowCountRunAt", "Status", "DisplayName", "AllowMultipleSubtypes", "AutoUpdateFullTextSearch", "AutoUpdateAllowUserSearchAPI", "TrustServerCacheCompletely", "SupportsGeoCoding", "AutoUpdateSupportsGeoCoding", "AllowCaching", "DetectExternalChanges", "ExternalDataSourceID", "ExternalObjectName") VALUES ('85e49c38-32df-4340-84fe-6cae307c424f', NULL, 'MJ_BizApps_Sonar: Model Factors', NULL, 'Binds a Factor into a model with its weight and contribution rules. The rubric is the set of these rows.', TRUE, 'ModelFactor', 'vwModelFactors', TRUE, '__mj_bizappssonar', FALSE, TRUE, FALSE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, NULL, TRUE, NULL, TRUE, NULL, TRUE, 1000, NULL, NULL, NULL, TRUE, TRUE, TRUE, FALSE, 'Hard', FALSE, NULL, 'Search', TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.993Z', '2026-07-17T21:18:07.993Z', NULL, 'None', 'random', 0, NULL, NULL, NULL, NULL, 'Active', 'Model Factors', FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, FALSE, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Entity" ("ID", "ParentID", "Name", "NameSuffix", "Description", "AutoUpdateDescription", "BaseTable", "BaseView", "BaseViewGenerated", "SchemaName", "VirtualEntity", "TrackRecordChanges", "AuditRecordAccess", "AuditViewRuns", "IncludeInAPI", "AllowAllRowsAPI", "AllowUpdateAPI", "AllowCreateAPI", "AllowDeleteAPI", "CustomResolverAPI", "AllowUserSearchAPI", "FullTextSearchEnabled", "FullTextCatalog", "FullTextCatalogGenerated", "FullTextIndex", "FullTextIndexGenerated", "FullTextSearchFunction", "FullTextSearchFunctionGenerated", "UserViewMaxRows", "spCreate", "spUpdate", "spDelete", "spCreateGenerated", "spUpdateGenerated", "spDeleteGenerated", "CascadeDeletes", "DeleteType", "AllowRecordMerge", "spMatch", "RelationshipDefaultDisplayType", "UserFormGenerated", "EntityObjectSubclassName", "EntityObjectSubclassImport", "PreferredCommunicationField", "Icon", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "RowsToPackWithSchema", "RowsToPackSampleMethod", "RowsToPackSampleCount", "RowsToPackSampleOrder", "AutoRowCountFrequency", "RowCount", "RowCountRunAt", "Status", "DisplayName", "AllowMultipleSubtypes", "AutoUpdateFullTextSearch", "AutoUpdateAllowUserSearchAPI", "TrustServerCacheCompletely", "SupportsGeoCoding", "AutoUpdateSupportsGeoCoding", "AllowCaching", "DetectExternalChanges", "ExternalDataSourceID", "ExternalObjectName") VALUES ('47138f1f-e3a2-4c5f-9b02-0424f4bb9042', NULL, 'MJ_BizApps_Sonar: Scores', NULL, 'The current score for one anchor record under one model. Written back into MJ as a first-class entity.', TRUE, 'Score', 'vwScores', TRUE, '__mj_bizappssonar', FALSE, TRUE, FALSE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, NULL, TRUE, NULL, TRUE, NULL, TRUE, 1000, NULL, NULL, NULL, TRUE, TRUE, TRUE, FALSE, 'Hard', FALSE, NULL, 'Search', TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.996Z', '2026-07-17T21:18:07.996Z', NULL, 'None', 'random', 0, NULL, NULL, NULL, NULL, 'Active', 'Scores', FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, FALSE, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Entity" ("ID", "ParentID", "Name", "NameSuffix", "Description", "AutoUpdateDescription", "BaseTable", "BaseView", "BaseViewGenerated", "SchemaName", "VirtualEntity", "TrackRecordChanges", "AuditRecordAccess", "AuditViewRuns", "IncludeInAPI", "AllowAllRowsAPI", "AllowUpdateAPI", "AllowCreateAPI", "AllowDeleteAPI", "CustomResolverAPI", "AllowUserSearchAPI", "FullTextSearchEnabled", "FullTextCatalog", "FullTextCatalogGenerated", "FullTextIndex", "FullTextIndexGenerated", "FullTextSearchFunction", "FullTextSearchFunctionGenerated", "UserViewMaxRows", "spCreate", "spUpdate", "spDelete", "spCreateGenerated", "spUpdateGenerated", "spDeleteGenerated", "CascadeDeletes", "DeleteType", "AllowRecordMerge", "spMatch", "RelationshipDefaultDisplayType", "UserFormGenerated", "EntityObjectSubclassName", "EntityObjectSubclassImport", "PreferredCommunicationField", "Icon", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "RowsToPackWithSchema", "RowsToPackSampleMethod", "RowsToPackSampleCount", "RowsToPackSampleOrder", "AutoRowCountFrequency", "RowCount", "RowCountRunAt", "Status", "DisplayName", "AllowMultipleSubtypes", "AutoUpdateFullTextSearch", "AutoUpdateAllowUserSearchAPI", "TrustServerCacheCompletely", "SupportsGeoCoding", "AutoUpdateSupportsGeoCoding", "AllowCaching", "DetectExternalChanges", "ExternalDataSourceID", "ExternalObjectName") VALUES ('4c50b6c8-6b44-49ba-bd29-e9aca1ae23d7', NULL, 'MJ_BizApps_Sonar: Score Factor Contributions', NULL, 'Per-factor breakdown of a current score; the explainability spine that makes the score narrative free.', TRUE, 'ScoreFactorContribution', 'vwScoreFactorContributions', TRUE, '__mj_bizappssonar', FALSE, TRUE, FALSE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, NULL, TRUE, NULL, TRUE, NULL, TRUE, 1000, NULL, NULL, NULL, TRUE, TRUE, TRUE, FALSE, 'Hard', FALSE, NULL, 'Search', TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.998Z', '2026-07-17T21:18:07.998Z', NULL, 'None', 'random', 0, NULL, NULL, NULL, NULL, 'Active', 'Score Factor Contributions', FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, FALSE, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Entity" ("ID", "ParentID", "Name", "NameSuffix", "Description", "AutoUpdateDescription", "BaseTable", "BaseView", "BaseViewGenerated", "SchemaName", "VirtualEntity", "TrackRecordChanges", "AuditRecordAccess", "AuditViewRuns", "IncludeInAPI", "AllowAllRowsAPI", "AllowUpdateAPI", "AllowCreateAPI", "AllowDeleteAPI", "CustomResolverAPI", "AllowUserSearchAPI", "FullTextSearchEnabled", "FullTextCatalog", "FullTextCatalogGenerated", "FullTextIndex", "FullTextIndexGenerated", "FullTextSearchFunction", "FullTextSearchFunctionGenerated", "UserViewMaxRows", "spCreate", "spUpdate", "spDelete", "spCreateGenerated", "spUpdateGenerated", "spDeleteGenerated", "CascadeDeletes", "DeleteType", "AllowRecordMerge", "spMatch", "RelationshipDefaultDisplayType", "UserFormGenerated", "EntityObjectSubclassName", "EntityObjectSubclassImport", "PreferredCommunicationField", "Icon", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "RowsToPackWithSchema", "RowsToPackSampleMethod", "RowsToPackSampleCount", "RowsToPackSampleOrder", "AutoRowCountFrequency", "RowCount", "RowCountRunAt", "Status", "DisplayName", "AllowMultipleSubtypes", "AutoUpdateFullTextSearch", "AutoUpdateAllowUserSearchAPI", "TrustServerCacheCompletely", "SupportsGeoCoding", "AutoUpdateSupportsGeoCoding", "AllowCaching", "DetectExternalChanges", "ExternalDataSourceID", "ExternalObjectName") VALUES ('7f52f45a-2a22-4cdb-adb2-9aac713a5ac2', NULL, 'MJ_BizApps_Sonar: Score Histories', NULL, 'Append-only time-series snapshots of scores; the trajectory is the asset. Snapshot on change plus periodic keyframes.', TRUE, 'ScoreHistory', 'vwScoreHistories', TRUE, '__mj_bizappssonar', FALSE, TRUE, FALSE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, NULL, TRUE, NULL, TRUE, NULL, TRUE, 1000, NULL, NULL, NULL, TRUE, TRUE, TRUE, FALSE, 'Hard', FALSE, NULL, 'Search', TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:08.001Z', '2026-07-17T21:18:08.001Z', NULL, 'None', 'random', 0, NULL, NULL, NULL, NULL, 'Active', 'Score Histories', FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, FALSE, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Entity" ("ID", "ParentID", "Name", "NameSuffix", "Description", "AutoUpdateDescription", "BaseTable", "BaseView", "BaseViewGenerated", "SchemaName", "VirtualEntity", "TrackRecordChanges", "AuditRecordAccess", "AuditViewRuns", "IncludeInAPI", "AllowAllRowsAPI", "AllowUpdateAPI", "AllowCreateAPI", "AllowDeleteAPI", "CustomResolverAPI", "AllowUserSearchAPI", "FullTextSearchEnabled", "FullTextCatalog", "FullTextCatalogGenerated", "FullTextIndex", "FullTextIndexGenerated", "FullTextSearchFunction", "FullTextSearchFunctionGenerated", "UserViewMaxRows", "spCreate", "spUpdate", "spDelete", "spCreateGenerated", "spUpdateGenerated", "spDeleteGenerated", "CascadeDeletes", "DeleteType", "AllowRecordMerge", "spMatch", "RelationshipDefaultDisplayType", "UserFormGenerated", "EntityObjectSubclassName", "EntityObjectSubclassImport", "PreferredCommunicationField", "Icon", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "RowsToPackWithSchema", "RowsToPackSampleMethod", "RowsToPackSampleCount", "RowsToPackSampleOrder", "AutoRowCountFrequency", "RowCount", "RowCountRunAt", "Status", "DisplayName", "AllowMultipleSubtypes", "AutoUpdateFullTextSearch", "AutoUpdateAllowUserSearchAPI", "TrustServerCacheCompletely", "SupportsGeoCoding", "AutoUpdateSupportsGeoCoding", "AllowCaching", "DetectExternalChanges", "ExternalDataSourceID", "ExternalObjectName") VALUES ('799802fa-c709-46dd-a8fc-86024fae149a', NULL, 'MJ_BizApps_Sonar: Score Recompute Runs', NULL, 'One batch or event recompute pass; drives the admin health view and compute/cost metering.', TRUE, 'ScoreRecomputeRun', 'vwScoreRecomputeRuns', TRUE, '__mj_bizappssonar', FALSE, TRUE, FALSE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, NULL, TRUE, NULL, TRUE, NULL, TRUE, 1000, NULL, NULL, NULL, TRUE, TRUE, TRUE, FALSE, 'Hard', FALSE, NULL, 'Search', TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:08.003Z', '2026-07-17T21:18:08.003Z', NULL, 'None', 'random', 0, NULL, NULL, NULL, NULL, 'Active', 'Score Recompute Runs', FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, FALSE, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Entity" ("ID", "ParentID", "Name", "NameSuffix", "Description", "AutoUpdateDescription", "BaseTable", "BaseView", "BaseViewGenerated", "SchemaName", "VirtualEntity", "TrackRecordChanges", "AuditRecordAccess", "AuditViewRuns", "IncludeInAPI", "AllowAllRowsAPI", "AllowUpdateAPI", "AllowCreateAPI", "AllowDeleteAPI", "CustomResolverAPI", "AllowUserSearchAPI", "FullTextSearchEnabled", "FullTextCatalog", "FullTextCatalogGenerated", "FullTextIndex", "FullTextIndexGenerated", "FullTextSearchFunction", "FullTextSearchFunctionGenerated", "UserViewMaxRows", "spCreate", "spUpdate", "spDelete", "spCreateGenerated", "spUpdateGenerated", "spDeleteGenerated", "CascadeDeletes", "DeleteType", "AllowRecordMerge", "spMatch", "RelationshipDefaultDisplayType", "UserFormGenerated", "EntityObjectSubclassName", "EntityObjectSubclassImport", "PreferredCommunicationField", "Icon", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "RowsToPackWithSchema", "RowsToPackSampleMethod", "RowsToPackSampleCount", "RowsToPackSampleOrder", "AutoRowCountFrequency", "RowCount", "RowCountRunAt", "Status", "DisplayName", "AllowMultipleSubtypes", "AutoUpdateFullTextSearch", "AutoUpdateAllowUserSearchAPI", "TrustServerCacheCompletely", "SupportsGeoCoding", "AutoUpdateSupportsGeoCoding", "AllowCaching", "DetectExternalChanges", "ExternalDataSourceID", "ExternalObjectName") VALUES ('88f3e05a-97d6-480d-ad73-8243a0a155e2', NULL, 'MJ_BizApps_Sonar: Score Band Transitions', NULL, 'First-class record of a band crossing; the event the action layer and write-back key off.', TRUE, 'ScoreBandTransition', 'vwScoreBandTransitions', TRUE, '__mj_bizappssonar', FALSE, TRUE, FALSE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, NULL, TRUE, NULL, TRUE, NULL, TRUE, 1000, NULL, NULL, NULL, TRUE, TRUE, TRUE, FALSE, 'Hard', FALSE, NULL, 'Search', TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:08.005Z', '2026-07-17T21:18:08.005Z', NULL, 'None', 'random', 0, NULL, NULL, NULL, NULL, 'Active', 'Score Band Transitions', FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, FALSE, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Entity" ("ID", "ParentID", "Name", "NameSuffix", "Description", "AutoUpdateDescription", "BaseTable", "BaseView", "BaseViewGenerated", "SchemaName", "VirtualEntity", "TrackRecordChanges", "AuditRecordAccess", "AuditViewRuns", "IncludeInAPI", "AllowAllRowsAPI", "AllowUpdateAPI", "AllowCreateAPI", "AllowDeleteAPI", "CustomResolverAPI", "AllowUserSearchAPI", "FullTextSearchEnabled", "FullTextCatalog", "FullTextCatalogGenerated", "FullTextIndex", "FullTextIndexGenerated", "FullTextSearchFunction", "FullTextSearchFunctionGenerated", "UserViewMaxRows", "spCreate", "spUpdate", "spDelete", "spCreateGenerated", "spUpdateGenerated", "spDeleteGenerated", "CascadeDeletes", "DeleteType", "AllowRecordMerge", "spMatch", "RelationshipDefaultDisplayType", "UserFormGenerated", "EntityObjectSubclassName", "EntityObjectSubclassImport", "PreferredCommunicationField", "Icon", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "RowsToPackWithSchema", "RowsToPackSampleMethod", "RowsToPackSampleCount", "RowsToPackSampleOrder", "AutoRowCountFrequency", "RowCount", "RowCountRunAt", "Status", "DisplayName", "AllowMultipleSubtypes", "AutoUpdateFullTextSearch", "AutoUpdateAllowUserSearchAPI", "TrustServerCacheCompletely", "SupportsGeoCoding", "AutoUpdateSupportsGeoCoding", "AllowCaching", "DetectExternalChanges", "ExternalDataSourceID", "ExternalObjectName") VALUES ('625c01e7-4dcc-40b8-b7b5-42d6a04757ca', NULL, 'MJ_BizApps_Sonar: Score Model Audit Events', NULL, 'Config-change audit: who changed which weight, factor, or window and when. Required for an explainable, governed scoring product.', TRUE, 'ScoreModelAuditEvent', 'vwScoreModelAuditEvents', TRUE, '__mj_bizappssonar', FALSE, TRUE, FALSE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, NULL, TRUE, NULL, TRUE, NULL, TRUE, 1000, NULL, NULL, NULL, TRUE, TRUE, TRUE, FALSE, 'Hard', FALSE, NULL, 'Search', TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:08.008Z', '2026-07-17T21:18:08.008Z', NULL, 'None', 'random', 0, NULL, NULL, NULL, NULL, 'Active', 'Score Model Audit Events', FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, FALSE, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
-- EntityField: 235 rows
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('ef6fe839-9bea-4d5d-8689-6a4f9ecaa5b6', 'a04276fd-7619-4652-9f81-5e77d576cd05', 1, 'ID', 'ID', NULL, TRUE, TRUE, TRUE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, '(newsequentialid())', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, TRUE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.037Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('c2a96554-3084-4f7c-8bad-199fcef306d9', 'a04276fd-7619-4652-9f81-5e77d576cd05', 2, 'Name', 'Name', 'Display name of the band set.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 400, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, TRUE, NULL, 150, TRUE, TRUE, TRUE, FALSE, NULL, TRUE, 'Details', FALSE, TRUE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.037Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('a3e760b7-7381-4af1-bf55-d3a45c25a707', 'a04276fd-7619-4652-9f81-5e77d576cd05', 3, 'AnchorEntityID', 'Anchor Entity ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, 'e0238f34-2837-ef11-86d4-6045bdee16e6', 'ID', TRUE, 'AnchorEntity', 'Search', NULL, '2026-07-17T21:18:09.037Z', '2026-07-17T21:19:19.551Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('9d43f822-553a-45e5-986f-810eea662a71', 'a04276fd-7619-4652-9f81-5e77d576cd05', 4, 'Description', 'Description', 'Optional description of the band set and its intended use.', TRUE, FALSE, FALSE, NULL, 'nvarchar', -1, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.038Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('9b0baff3-bd9e-4dca-9550-8da45668280c', 'a04276fd-7619-4652-9f81-5e77d576cd05', 5, '__mj_CreatedAt', 'Created At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.038Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('288e1536-d7ec-46d7-ab69-9f0fb1c9a24d', 'a04276fd-7619-4652-9f81-5e77d576cd05', 6, '__mj_UpdatedAt', 'Updated At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.038Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('e827674f-32e8-4351-808e-210280ab7f6e', 'a04276fd-7619-4652-9f81-5e77d576cd05', 7, 'AnchorEntity', 'Anchor Entity', NULL, TRUE, FALSE, FALSE, NULL, 'nvarchar', 510, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', TRUE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:19:20.141Z', '2026-07-17T21:19:24.171Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('9d7ecca4-2cfb-433c-98b5-7410c9ad65de', '0bc33b83-3ac7-4e09-a7c6-7768454fa868', 12, 'BandSet', 'Band Set', NULL, TRUE, FALSE, FALSE, NULL, 'nvarchar', 400, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', TRUE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:19:20.130Z', '2026-07-17T21:19:24.171Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('66010cd1-d39c-4f7d-9f30-20bea6dda571', '0bc33b83-3ac7-4e09-a7c6-7768454fa868', 1, 'ID', 'ID', NULL, TRUE, TRUE, TRUE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, '(newsequentialid())', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, TRUE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.958Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('8a422b15-e1e1-4291-8e0b-27679b90e11a', '0bc33b83-3ac7-4e09-a7c6-7768454fa868', 2, 'BandSetID', 'Band Set ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, 'a04276fd-7619-4652-9f81-5e77d576cd05', 'ID', TRUE, 'BandSet', 'Search', NULL, '2026-07-17T21:18:08.964Z', '2026-07-17T21:19:19.569Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('f68dda4f-3b6d-45e4-99cf-77ba3502d3b4', '0bc33b83-3ac7-4e09-a7c6-7768454fa868', 3, 'Label', 'Label', 'Display label for the band, e.g. Healthy, Watch, At-Risk, Critical.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 120, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.964Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('2571649f-674b-45c7-8b9a-fcf036b309cf', '0bc33b83-3ac7-4e09-a7c6-7768454fa868', 4, 'MinScore', 'Min Score', 'Inclusive lower bound of the band score range.', TRUE, FALSE, FALSE, NULL, 'decimal', 5, 9, 4, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.965Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('3b9665a0-9895-41d4-8c41-5da168418f53', '0bc33b83-3ac7-4e09-a7c6-7768454fa868', 5, 'MaxScore', 'Max Score', 'Exclusive upper bound of the band score range (half-open; ranges are contiguous and non-overlapping).', TRUE, FALSE, FALSE, NULL, 'decimal', 5, 9, 4, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.965Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('088aa801-db2a-4643-af14-e396834f6d82', '0bc33b83-3ac7-4e09-a7c6-7768454fa868', 6, 'Severity', 'Severity', 'Severity rank where 0 is best and higher numbers are worse; drives sort order and color.', TRUE, FALSE, FALSE, NULL, 'int', 4, 10, 0, FALSE, '((0))', FALSE, 'None', NULL, NULL, FALSE, NULL, 50, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.966Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('988599ff-d079-456c-8e6c-80ceaa021bce', '0bc33b83-3ac7-4e09-a7c6-7768454fa868', 7, 'ColorHex', 'Color Hex', 'Hex color code (e.g. #2E7D32) used to render the band in the UI.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 14, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.966Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('7c567418-7797-43cc-9441-f25b19da3dea', '0bc33b83-3ac7-4e09-a7c6-7768454fa868', 8, 'IsTerminal', 'Is Terminal', 'Indicates a terminal band (e.g. Lapsed) that represents an end state rather than a point on the continuum.', TRUE, FALSE, FALSE, NULL, 'bit', 1, 1, 0, FALSE, '((0))', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.967Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('c8d2c1b6-36f1-4da2-9ee9-da537612ebed', '0bc33b83-3ac7-4e09-a7c6-7768454fa868', 9, 'Description', 'Description', 'Optional description of what this band means.', TRUE, FALSE, FALSE, NULL, 'nvarchar', -1, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.967Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('33ea1dca-610e-4137-b6f7-1e905d64ff07', '0bc33b83-3ac7-4e09-a7c6-7768454fa868', 10, '__mj_CreatedAt', 'Created At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.968Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('7e9f47f6-f03e-4192-bf16-c537e17c56d1', '0bc33b83-3ac7-4e09-a7c6-7768454fa868', 11, '__mj_UpdatedAt', 'Updated At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.968Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('c29dbc99-0afc-4845-9703-e75957df34dd', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 24, '__mj_UpdatedAt', 'Updated At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.992Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('b2a2f843-8550-4c69-8860-f92a3d62804d', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 22, 'Notes', 'Notes', 'Freeform notes about the model.', TRUE, FALSE, FALSE, NULL, 'nvarchar', -1, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.991Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('cb471c65-3ba8-4faf-ab42-2783990a6820', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 23, '__mj_CreatedAt', 'Created At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.991Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('defc8843-2ba8-42a5-847c-4bd8f170044a', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 1, 'ID', 'ID', NULL, TRUE, TRUE, TRUE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, '(newsequentialid())', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, TRUE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.983Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('9d1cf3b8-4d07-4d22-b610-268df7c4fd83', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 2, 'Name', 'Name', 'Human-readable name of the model, e.g. "2026 Renewal Risk".', TRUE, FALSE, FALSE, NULL, 'nvarchar', 400, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, TRUE, NULL, 150, TRUE, TRUE, TRUE, FALSE, NULL, TRUE, 'Details', FALSE, TRUE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.983Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('60d92ae0-1c1a-4dcc-9f02-27596bfe28d4', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 3, 'Slug', 'Slug', 'Stable, unique handle for the model used in expressions and references.', TRUE, FALSE, TRUE, NULL, 'nvarchar', 200, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.984Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('02420329-a246-45bd-bde0-61fb5723a175', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 4, 'Description', 'Description', 'Optional description of what the model scores and why.', TRUE, FALSE, FALSE, NULL, 'nvarchar', -1, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.984Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('5c7f6972-65f6-4f8a-9172-80e58b1243d9', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 5, 'AnchorEntityID', 'Anchor Entity ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, 'e0238f34-2837-ef11-86d4-6045bdee16e6', 'ID', TRUE, 'AnchorEntity', 'Search', NULL, '2026-07-17T21:18:08.984Z', '2026-07-17T21:19:19.615Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('2dcec77d-67c1-4f45-b4e2-dea20cd28f2c', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 6, 'Status', 'Status', 'Lifecycle status of the model: Draft, Active, Paused, or Archived.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 40, 0, 0, FALSE, '(N''Draft'')', FALSE, 'List', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.985Z', '2026-07-17T21:19:18.543Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('f528ab0a-44de-4d45-8041-331e3d35cc1c', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 7, 'CurrentVersionID', 'Current Version ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, 'b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', 'ID', TRUE, NULL, 'Search', NULL, '2026-07-17T21:18:08.985Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('6c58b1ad-0bfb-4969-b375-0211a427fdb5', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 8, 'ScoreScaleMin', 'Score Scale Min', 'Minimum value of the output score scale (default 0).', TRUE, FALSE, FALSE, NULL, 'decimal', 5, 9, 4, FALSE, '((0))', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.986Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('bd339454-9621-456f-8861-d5b809a32851', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 9, 'ScoreScaleMax', 'Score Scale Max', 'Maximum value of the output score scale (default 100).', TRUE, FALSE, FALSE, NULL, 'decimal', 5, 9, 4, FALSE, '((100))', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.986Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('50063413-41e7-48e6-ada1-1d25217e4f80', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 11, 'CombineExpression', 'Combine Expression', 'For ExpressionDriven models, the formula over factor slugs used to combine contributions.', TRUE, FALSE, FALSE, NULL, 'nvarchar', -1, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.987Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('d3e78a1a-98a0-46af-a9bd-e4b1d1425a7a', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 12, 'BandSetID', 'Band Set ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, 'a04276fd-7619-4652-9f81-5e77d576cd05', 'ID', TRUE, 'BandSet', 'Search', NULL, '2026-07-17T21:18:08.987Z', '2026-07-17T21:19:19.615Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('01c2e4c6-6991-43a5-b623-345f4edf0402', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 13, 'PopulationFilter', 'Population Filter', 'JSON/DSL filter defining which anchor records are in scope for scoring (e.g. Status = Active).', TRUE, FALSE, FALSE, NULL, 'nvarchar', -1, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.987Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('835ec9bb-db1d-410d-bd5f-104aae00e221', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 14, 'RecomputeMode', 'Recompute Mode', 'When scores recompute: Scheduled, EventDriven, OnDemand, or Hybrid.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 40, 0, 0, FALSE, '(N''Scheduled'')', FALSE, 'List', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.988Z', '2026-07-17T21:19:18.540Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('e1fc4a49-8d0e-4ca3-a7a5-4ed5e5377e00', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 15, 'RecomputeCron', 'Recompute Cron', 'Cron expression controlling scheduled recompute, when RecomputeMode includes a schedule.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 200, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.988Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('68ae7d4f-d255-4339-b057-f83f975cfeac', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 17, 'IsCalibrated', 'Is Calibrated', 'When set, the model consumes cross-tenant benchmark distributions for normalization (calibration network).', TRUE, FALSE, FALSE, NULL, 'bit', 1, 1, 0, FALSE, '((0))', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.989Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('936d4c9d-c989-42eb-b461-dca1f593204e', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 18, 'TrendWindowDays', 'Trend Window Days', 'Number of days used to compute the headline Delta and trend on each score.', TRUE, FALSE, FALSE, NULL, 'int', 4, 10, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 50, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.990Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('a9f0ab2e-c3c1-42ff-8451-a03a4f20f2c9', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 19, 'OwnerUserID', 'Owner User ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, 'e1238f34-2837-ef11-86d4-6045bdee16e6', 'ID', TRUE, 'OwnerUser', 'Search', NULL, '2026-07-17T21:18:08.990Z', '2026-07-17T21:19:19.616Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('2213566c-a830-4a8e-9d3d-07df1021a8f7', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 20, 'EffectiveFrom', 'Effective From', 'Start of the bounded time range during which the model is active (optional).', TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 100, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.990Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('94206ef7-aa05-49cd-aa5b-c1c85dc5e74f', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 21, 'EffectiveTo', 'Effective To', 'End of the bounded time range during which the model is active (optional).', TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 100, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.991Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('1b779c4d-02ce-4d54-87c3-a4033f51dbff', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 16, 'AsOfStrategy', 'As Of Strategy', 'Defines what "now" means when resolving time windows: RunTime, EndOfPreviousDay, or Fixed.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 40, 0, 0, FALSE, '(N''RunTime'')', FALSE, 'List', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.989Z', '2026-07-17T21:19:18.535Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('f76f5d41-75b7-4a61-9f60-d46c3220a41a', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 10, 'CombineStrategy', 'Combine Strategy', 'How factor contributions combine into a score: WeightedSum, WeightedAvg, Banded, ZScoreComposite, or ExpressionDriven.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 60, 0, 0, FALSE, '(N''WeightedSum'')', FALSE, 'List', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.986Z', '2026-07-17T21:19:18.538Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('b554c98f-3b17-4910-9d8a-4aec062cc561', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 25, 'AnchorEntity', 'Anchor Entity', NULL, TRUE, FALSE, FALSE, NULL, 'nvarchar', 510, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', TRUE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:19:20.132Z', '2026-07-17T21:19:24.171Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('a2259afe-d1cd-4eab-8b55-56bfcec40949', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 26, 'BandSet', 'Band Set', NULL, TRUE, FALSE, FALSE, NULL, 'nvarchar', 400, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', TRUE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:19:20.133Z', '2026-07-17T21:19:24.171Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('490f3fe6-0bcf-4b8c-8cc4-52a749a24d2a', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 27, 'OwnerUser', 'Owner User', NULL, TRUE, FALSE, FALSE, NULL, 'nvarchar', 200, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', TRUE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:19:20.133Z', '2026-07-17T21:19:24.171Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('3fd4253c-c08a-4aa5-a5ba-d8b1338c5059', 'b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', 1, 'ID', 'ID', NULL, TRUE, TRUE, TRUE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, '(newsequentialid())', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, TRUE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.039Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('893eae45-1878-4c43-aaf6-69603484575e', 'b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', 2, 'ScoreModelID', 'Score Model ID', NULL, TRUE, FALSE, TRUE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 'ID', TRUE, 'ScoreModel', 'Search', NULL, '2026-07-17T21:18:09.039Z', '2026-07-17T21:19:19.605Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('93162546-6645-408b-aab9-c21dc87b8bf8', 'b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', 3, 'VersionNumber', 'Version Number', 'Monotonic version number within the model.', TRUE, FALSE, TRUE, NULL, 'int', 4, 10, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 50, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.039Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('aaa43f24-898f-4582-962e-e37c6c481628', 'b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', 4, 'VersionLabel', 'Version Label', 'Optional human-readable label for the version.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 100, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.040Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('26cd3706-0661-48eb-8793-e54c14d510fd', 'b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', 5, 'ConfigSnapshotJSON', 'Config Snapshot JSON', 'Fully denormalized JSON snapshot (anchor, related-entity map, factors, weights, windows, bands, normalization) the engine can score from on its own.', TRUE, FALSE, FALSE, NULL, 'nvarchar', -1, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.040Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('fd08e938-dd46-460a-b899-513ed2e5b7b9', 'b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', 6, 'ChangeSummary', 'Change Summary', 'Summary of what changed versus the prior version.', TRUE, FALSE, FALSE, NULL, 'nvarchar', -1, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.041Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('14d722d4-97d6-445a-8440-b3383622bdf0', 'b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', 7, 'PublishedByUserID', 'Published By User ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, 'e1238f34-2837-ef11-86d4-6045bdee16e6', 'ID', TRUE, 'PublishedByUser', 'Search', NULL, '2026-07-17T21:18:09.041Z', '2026-07-17T21:19:19.605Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('a838921a-5e46-4242-95cd-4815e0cffb48', 'b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', 8, 'PublishedAt', 'Published At', 'UTC timestamp at which this version was published.', TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(sysdatetimeoffset())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.041Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('e3414f43-fe7e-4ade-a12e-2d9ea6dd0c54', 'b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', 9, 'IsCurrent', 'Is Current', 'Indicates the single current version that is actively scoring for the model.', TRUE, FALSE, FALSE, NULL, 'bit', 1, 1, 0, FALSE, '((0))', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.042Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('6baab1d2-985f-4dc0-a732-896c3e758003', 'b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', 10, '__mj_CreatedAt', 'Created At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.042Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('b0b1a9da-7d82-43e4-9925-2cd2ca79feb5', 'b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', 11, '__mj_UpdatedAt', 'Updated At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.042Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('c1ec0e53-10ff-4f2e-a593-ac1acc6cd9fe', 'b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', 12, 'ScoreModel', 'Score Model', NULL, TRUE, FALSE, FALSE, NULL, 'nvarchar', 400, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', TRUE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:19:20.142Z', '2026-07-17T21:19:24.171Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('7c0906dc-92d0-4481-b934-45986607c489', 'b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', 13, 'PublishedByUser', 'Published By User', NULL, TRUE, FALSE, FALSE, NULL, 'nvarchar', 200, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', TRUE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:19:20.142Z', '2026-07-17T21:19:24.171Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('189e7a40-225e-48e8-a0c4-1f5e6f4020bb', 'febf5f19-11c1-457a-be6a-fa5788c9664f', 4, 'Alias', 'Alias', 'Handle used by factors to reference this related entity, e.g. crm_activity, invoices, lms_completions.', TRUE, FALSE, TRUE, NULL, 'nvarchar', 200, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.044Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('92b5f316-535c-4fc9-a405-fb6a39fbc1e1', 'febf5f19-11c1-457a-be6a-fa5788c9664f', 5, 'RelationshipPath', 'Relationship Path', 'JSON describing the join path from the anchor to the related entity (direct FK or multi-hop), resolved against MJ relationship metadata.', TRUE, FALSE, FALSE, NULL, 'nvarchar', -1, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.045Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('4cd22992-eea6-41b2-8768-7a7c2fd4d3e1', 'febf5f19-11c1-457a-be6a-fa5788c9664f', 6, 'JoinType', 'Join Type', 'Join type from anchor to related entity: Inner or Left (usually Left so absence of related data is itself scorable).', TRUE, FALSE, FALSE, NULL, 'nvarchar', 20, 0, 0, FALSE, '(N''Left'')', FALSE, 'List', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.045Z', '2026-07-17T21:19:18.545Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('015b9a96-0588-44d4-bc56-26430506b623', 'febf5f19-11c1-457a-be6a-fa5788c9664f', 7, 'SourceSystemTag', 'Source System Tag', 'Informational provenance tag for the source system (e.g. Salesforce, Finance, LMS, Community, Email).', TRUE, FALSE, FALSE, NULL, 'nvarchar', 120, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.045Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('b299544e-f422-4bd7-bbc7-93a4178feaa8', 'febf5f19-11c1-457a-be6a-fa5788c9664f', 8, 'Description', 'Description', 'Optional description of the related-entity mapping.', TRUE, FALSE, FALSE, NULL, 'nvarchar', -1, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.046Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('53411061-eac0-420d-ade6-94ae2a858817', 'febf5f19-11c1-457a-be6a-fa5788c9664f', 9, '__mj_CreatedAt', 'Created At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.046Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('ea287dc2-5da3-4f88-8eef-637b987f68cf', 'febf5f19-11c1-457a-be6a-fa5788c9664f', 10, '__mj_UpdatedAt', 'Updated At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.046Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('abab02bd-7b0c-4f8e-b432-258f9c07f6a3', 'febf5f19-11c1-457a-be6a-fa5788c9664f', 1, 'ID', 'ID', NULL, TRUE, TRUE, TRUE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, '(newsequentialid())', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, TRUE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.043Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('0b2597a2-2575-46f5-813d-6d7b4d901daf', 'febf5f19-11c1-457a-be6a-fa5788c9664f', 2, 'ScoreModelID', 'Score Model ID', NULL, TRUE, FALSE, TRUE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 'ID', TRUE, 'ScoreModel', 'Search', NULL, '2026-07-17T21:18:09.043Z', '2026-07-17T21:19:19.541Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('984bc727-ee10-4db7-aef9-acff70a323b8', 'febf5f19-11c1-457a-be6a-fa5788c9664f', 3, 'RelatedEntityID', 'Related Entity ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, 'e0238f34-2837-ef11-86d4-6045bdee16e6', 'ID', TRUE, 'RelatedEntity', 'Search', NULL, '2026-07-17T21:18:09.044Z', '2026-07-17T21:19:19.542Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('35944374-667f-42cd-b345-402da44f287f', 'febf5f19-11c1-457a-be6a-fa5788c9664f', 11, 'ScoreModel', 'Score Model', NULL, TRUE, FALSE, FALSE, NULL, 'nvarchar', 400, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', TRUE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:19:20.143Z', '2026-07-17T21:19:24.171Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('3e4394f4-03ff-4975-bdbe-48c29d851c72', 'febf5f19-11c1-457a-be6a-fa5788c9664f', 12, 'RelatedEntity', 'Related Entity', NULL, TRUE, FALSE, FALSE, NULL, 'nvarchar', 510, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', TRUE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:19:20.143Z', '2026-07-17T21:19:24.171Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('cce1dcf5-be80-470d-a5c0-ac93067507df', '5681aa78-18a8-41ef-974d-27cf8f54d818', 1, 'ID', 'ID', NULL, TRUE, TRUE, TRUE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, '(newsequentialid())', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, TRUE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.998Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('ba9688d9-d274-4fbc-a937-d7cde2c45420', '5681aa78-18a8-41ef-974d-27cf8f54d818', 2, 'Name', 'Name', 'Human-readable name of the factor.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 400, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, TRUE, NULL, 150, TRUE, TRUE, TRUE, FALSE, NULL, TRUE, 'Details', FALSE, TRUE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.998Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('0d6d5fec-091a-44c1-82cd-258e686e5f6b', '5681aa78-18a8-41ef-974d-27cf8f54d818', 3, 'Slug', 'Slug', 'Stable handle for the factor, referenced by the rubric and combine expressions.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 200, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.998Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('bab1cd52-daed-4b54-832a-fc4dba58d19b', '5681aa78-18a8-41ef-974d-27cf8f54d818', 4, 'Description', 'Description', 'Optional description of the signal the factor measures.', TRUE, FALSE, FALSE, NULL, 'nvarchar', -1, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.999Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('a3514d8d-906c-496a-9a96-3f01b045d875', '5681aa78-18a8-41ef-974d-27cf8f54d818', 5, 'ScoreModelID', 'Score Model ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 'ID', TRUE, 'ScoreModel', 'Search', NULL, '2026-07-17T21:18:08.999Z', '2026-07-17T21:19:19.503Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('3dcff3cd-7a21-4bb2-9964-de5d4c5c1421', '5681aa78-18a8-41ef-974d-27cf8f54d818', 6, 'AnchorEntityID', 'Anchor Entity ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, 'e0238f34-2837-ef11-86d4-6045bdee16e6', 'ID', TRUE, 'AnchorEntity', 'Search', NULL, '2026-07-17T21:18:09.000Z', '2026-07-17T21:19:19.510Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('ed6922d6-0955-40c3-887f-92dabddf7716', '5681aa78-18a8-41ef-974d-27cf8f54d818', 7, 'FactorType', 'Factor Type', 'Factor kind: Declarative, ActionBacked, DerivedFromScore, or Constant. The rubric engine never branches on this.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 40, 0, 0, FALSE, NULL, FALSE, 'List', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.000Z', '2026-07-17T21:19:18.553Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('3a792a64-a7a7-45e2-acdb-1c77f1d0ef6b', '5681aa78-18a8-41ef-974d-27cf8f54d818', 8, 'SourceRelatedEntityID', 'Source Related Entity ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, 'febf5f19-11c1-457a-be6a-fa5788c9664f', 'ID', TRUE, NULL, 'Search', NULL, '2026-07-17T21:18:09.000Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('6806c247-fe72-43ac-9aec-3dc1897446e1', '5681aa78-18a8-41ef-974d-27cf8f54d818', 9, 'SourceEntityID', 'Source Entity ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, 'e0238f34-2837-ef11-86d4-6045bdee16e6', 'ID', TRUE, 'SourceEntity', 'Search', NULL, '2026-07-17T21:18:09.001Z', '2026-07-17T21:19:19.511Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('ae0a15d7-7dc0-4772-bc2b-4c09f918d223', '5681aa78-18a8-41ef-974d-27cf8f54d818', 10, 'FilterExpression', 'Filter Expression', 'For declarative factors, the JSON/DSL filter applied to the source related entity (e.g. ActivityType IN (EmailOpen, EmailClick)).', TRUE, FALSE, FALSE, NULL, 'nvarchar', -1, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.001Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('a655b9d7-d34d-47fb-972f-aea6655f9341', '5681aa78-18a8-41ef-974d-27cf8f54d818', 12, 'AggregateFieldName', 'Aggregate Field Name', 'Column on the source entity to sum or average; null for Count/Exists aggregations.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 400, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.002Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('4f765536-dd0c-4625-b73c-39897eaa2e29', '5681aa78-18a8-41ef-974d-27cf8f54d818', 13, 'TimeWindowID', 'Time Window ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, '395aba56-2927-4651-924c-869db1cfaebd', 'ID', TRUE, 'TimeWindow', 'Search', NULL, '2026-07-17T21:18:09.002Z', '2026-07-17T21:19:19.512Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('17ec3b13-6345-467a-8a8c-0336743b9370', '5681aa78-18a8-41ef-974d-27cf8f54d818', 14, 'RecencyDecayHalfLifeDays', 'Recency Decay Half Life Days', 'Optional half-life in days for recency-weighted aggregation.', TRUE, FALSE, FALSE, NULL, 'int', 4, 10, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 50, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.003Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('235724ef-6233-4c64-9ab1-efa80ceb54e7', '5681aa78-18a8-41ef-974d-27cf8f54d818', 15, 'ActionID', 'Action ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, '38248f34-2837-ef11-86d4-6045bdee16e6', 'ID', TRUE, 'Action', 'Search', NULL, '2026-07-17T21:18:09.003Z', '2026-07-17T21:19:19.512Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('cd90bc29-3084-4d8d-9a41-ca6122e4577d', '5681aa78-18a8-41ef-974d-27cf8f54d818', 16, 'ActionParamsJSON', 'Action Params JSON', 'For ActionBacked factors, static parameters (JSON) bound to the Action at config time.', TRUE, FALSE, FALSE, NULL, 'nvarchar', -1, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.003Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('2519b3b4-4a67-4734-ae77-a693c728828a', '5681aa78-18a8-41ef-974d-27cf8f54d818', 17, 'ExecutionMode', 'Execution Mode', 'Execution mode for ActionBacked factors: PerRecord or Batch.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 24, 0, 0, TRUE, NULL, FALSE, 'List', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.004Z', '2026-07-17T21:19:18.551Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('57812e1e-1c41-4d2b-ad08-3ca644cc125b', '5681aa78-18a8-41ef-974d-27cf8f54d818', 18, 'IsExpensive', 'Is Expensive', 'Marks the factor as expensive to evaluate; surfaced in the builder and used for recompute budgeting.', TRUE, FALSE, FALSE, NULL, 'bit', 1, 1, 0, FALSE, '((0))', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.004Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('0a75b89c-21fb-4e27-818c-0ae5fa77337d', '5681aa78-18a8-41ef-974d-27cf8f54d818', 19, 'MaxConcurrency', 'Max Concurrency', 'Optional maximum concurrency for evaluating an ActionBacked factor.', TRUE, FALSE, FALSE, NULL, 'int', 4, 10, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 50, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.004Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('14c60ff4-10e7-4a0c-a2bc-363f70c7b804', '5681aa78-18a8-41ef-974d-27cf8f54d818', 20, 'RateLimitPerMinute', 'Rate Limit Per Minute', 'Optional rate limit per minute for external-API-backed Actions.', TRUE, FALSE, FALSE, NULL, 'int', 4, 10, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 50, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.005Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('b34fa03f-95ca-41bf-969f-d1569796da4b', '5681aa78-18a8-41ef-974d-27cf8f54d818', 21, 'CacheTTLSeconds', 'Cache TTL Seconds', 'Result cache time-to-live in seconds, keyed by (anchor record, as-of date, params hash).', TRUE, FALSE, FALSE, NULL, 'int', 4, 10, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 50, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.005Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('b73ebbf0-d754-4ca7-a9fe-21640a7b8044', '5681aa78-18a8-41ef-974d-27cf8f54d818', 22, 'SourceScoreModelID', 'Source Score Model ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 'ID', TRUE, 'SourceScoreModel', 'Search', NULL, '2026-07-17T21:18:09.006Z', '2026-07-17T21:19:19.513Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('1095daac-fe07-4e2d-8e95-3ab7440c682f', '5681aa78-18a8-41ef-974d-27cf8f54d818', 23, 'RawDataType', 'Raw Data Type', 'Raw data type produced by the factor before normalization: Number, Date, Boolean, or Duration.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 24, 0, 0, TRUE, NULL, FALSE, 'List', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.006Z', '2026-07-17T21:19:18.560Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('6942b9ba-1c1e-4a38-84be-1f05cd6bf86f', '5681aa78-18a8-41ef-974d-27cf8f54d818', 25, 'NormalizationParamsJSON', 'Normalization Params JSON', 'JSON parameters for the normalization method (clamps, percentile basis, logistic midpoint/steepness, banded thresholds, lookup table).', TRUE, FALSE, FALSE, NULL, 'nvarchar', -1, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.007Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('d3795a09-f802-4663-beac-6366b1c3707e', '5681aa78-18a8-41ef-974d-27cf8f54d818', 26, 'OutputMin', 'Output Min', 'Lower bound of the normalized contribution range (e.g. 0).', TRUE, FALSE, FALSE, NULL, 'decimal', 5, 9, 4, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.008Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('29caaeca-ac9b-4f37-862a-61ec9ab0e3f5', '5681aa78-18a8-41ef-974d-27cf8f54d818', 27, 'OutputMax', 'Output Max', 'Upper bound of the normalized contribution range (e.g. 1).', TRUE, FALSE, FALSE, NULL, 'decimal', 5, 9, 4, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.008Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('c23aa89e-7c55-4a99-8e70-1cd87124371b', '5681aa78-18a8-41ef-974d-27cf8f54d818', 28, 'HigherIsBetter', 'Higher Is Better', 'Direction of the signal; when false, higher raw values are worse (e.g. days since last login).', TRUE, FALSE, FALSE, NULL, 'bit', 1, 1, 0, FALSE, '((1))', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.009Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('4d503153-8691-428c-8228-04d8dacfab41', '5681aa78-18a8-41ef-974d-27cf8f54d818', 29, 'PromotionState', 'Promotion State', 'Governance state, enforced for ActionBacked factors before production use: Draft, InReview, Approved, or Deprecated.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 40, 0, 0, TRUE, NULL, FALSE, 'List', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.009Z', '2026-07-17T21:19:18.558Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('8d071cba-e9be-4030-80b3-cb644bc3321f', '5681aa78-18a8-41ef-974d-27cf8f54d818', 30, 'LastValidatedAt', 'Last Validated At', 'UTC timestamp of the most recent validation of the factor.', TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 100, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.009Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('fa688bd0-b53c-4224-9cfa-b616cc26adc1', '5681aa78-18a8-41ef-974d-27cf8f54d818', 31, 'CreatedByAgent', 'Created By Agent', 'Name of the AI agent that created the factor, if any (e.g. ModelBuilderAgent, ActionBuilder).', TRUE, FALSE, FALSE, NULL, 'nvarchar', 120, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.010Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('0637a2fa-dd17-4d22-b41b-d097d71bbd7c', '5681aa78-18a8-41ef-974d-27cf8f54d818', 32, 'DateField', 'Date Field', 'The date column on the factor''s related (source) entity that a time window filters on — the "when did it happen" column (e.g. RegistrationDate). Used by Rolling/Calendar/SinceEvent windows; null = no date filter (count everything in scope).', TRUE, FALSE, FALSE, NULL, 'nvarchar', 400, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.010Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('1101412e-d807-4ec9-81f2-d3f1fb6bd812', '5681aa78-18a8-41ef-974d-27cf8f54d818', 33, '__mj_CreatedAt', 'Created At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.010Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('dc9e0c64-5e25-44e4-950d-5f4d05a0c961', '5681aa78-18a8-41ef-974d-27cf8f54d818', 34, '__mj_UpdatedAt', 'Updated At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.011Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('e8e1c503-bebf-4be3-a4ee-a0b131168829', '5681aa78-18a8-41ef-974d-27cf8f54d818', 11, 'Aggregation', 'Aggregation', 'Aggregation applied to the filtered source rows: Count, Sum, Avg, Min, Max, DistinctCount, Recency, RatePerPeriod, Exists, or TrendSlope.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 40, 0, 0, TRUE, NULL, FALSE, 'List', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.001Z', '2026-07-17T21:19:18.550Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('a44c3309-30fa-4511-bfca-dbb3301d6839', '5681aa78-18a8-41ef-974d-27cf8f54d818', 24, 'NormalizationMethod', 'Normalization Method', 'Normalization method mapping the raw value to a contribution: None, MinMax, Percentile, ZScore, Logistic, Banded, or Lookup.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 40, 0, 0, TRUE, NULL, FALSE, 'List', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.007Z', '2026-07-17T21:19:18.556Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('601844bb-bc8f-4219-b3b0-4652881054d9', '5681aa78-18a8-41ef-974d-27cf8f54d818', 35, 'ScoreModel', 'Score Model', NULL, TRUE, FALSE, FALSE, NULL, 'nvarchar', 400, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', TRUE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:19:20.134Z', '2026-07-17T21:19:24.171Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('308e2998-31ab-4725-9354-76d92a795432', '5681aa78-18a8-41ef-974d-27cf8f54d818', 36, 'AnchorEntity', 'Anchor Entity', NULL, TRUE, FALSE, FALSE, NULL, 'nvarchar', 510, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', TRUE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:19:20.135Z', '2026-07-17T21:19:24.171Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('6e283dbd-d0b1-49b0-93d1-27e885975db4', '5681aa78-18a8-41ef-974d-27cf8f54d818', 37, 'SourceEntity', 'Source Entity', NULL, TRUE, FALSE, FALSE, NULL, 'nvarchar', 510, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', TRUE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:19:20.135Z', '2026-07-17T21:19:24.171Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('603cb822-156b-4cf3-a90d-b42bb0df7070', '5681aa78-18a8-41ef-974d-27cf8f54d818', 38, 'TimeWindow', 'Time Window', NULL, TRUE, FALSE, FALSE, NULL, 'nvarchar', 240, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', TRUE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:19:20.136Z', '2026-07-17T21:19:24.171Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('85db68e5-fcbd-4810-a045-947959680d42', '5681aa78-18a8-41ef-974d-27cf8f54d818', 39, 'Action', 'Action', NULL, TRUE, FALSE, FALSE, NULL, 'nvarchar', 850, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', TRUE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:19:20.136Z', '2026-07-17T21:19:24.171Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('25349561-587f-400f-8981-6fb43c311e27', '5681aa78-18a8-41ef-974d-27cf8f54d818', 40, 'SourceScoreModel', 'Source Score Model', NULL, TRUE, FALSE, FALSE, NULL, 'nvarchar', 400, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', TRUE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:19:20.137Z', '2026-07-17T21:19:24.171Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('8e97f443-fb71-4997-a424-a8c472fb0ded', '395aba56-2927-4651-924c-869db1cfaebd', 4, 'LengthDays', 'Length Days', 'Window length in days, for Rolling/Calendar windows.', TRUE, FALSE, FALSE, NULL, 'int', 4, 10, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 50, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.970Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('2451508f-48b0-4472-a466-20d0f767cdfd', '395aba56-2927-4651-924c-869db1cfaebd', 5, 'LengthMonths', 'Length Months', 'Window length in months, for Rolling/Calendar windows.', TRUE, FALSE, FALSE, NULL, 'int', 4, 10, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 50, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.971Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('7e7a640e-d132-4351-a191-5b188bbc8d27', '395aba56-2927-4651-924c-869db1cfaebd', 8, 'Description', 'Description', 'Optional description of the time window.', TRUE, FALSE, FALSE, NULL, 'nvarchar', -1, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.972Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('7612b02e-dafd-44bf-ae9e-7f1ffbf16c2f', '395aba56-2927-4651-924c-869db1cfaebd', 1, 'ID', 'ID', NULL, TRUE, TRUE, TRUE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, '(newsequentialid())', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, TRUE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.969Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('82a400e3-f3ac-4184-8767-27e2a65fb77e', '395aba56-2927-4651-924c-869db1cfaebd', 2, 'Name', 'Name', 'Display name of the time window.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 240, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, TRUE, NULL, 150, TRUE, TRUE, TRUE, FALSE, NULL, TRUE, 'Details', FALSE, TRUE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.969Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('df92a570-f6b3-4ad9-a433-84a1b4d9d256', '395aba56-2927-4651-924c-869db1cfaebd', 3, 'WindowType', 'Window Type', 'Window type: Rolling, Calendar, SinceEvent, RenewalRelative, or AllTime.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 40, 0, 0, FALSE, NULL, FALSE, 'List', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.970Z', '2026-07-17T21:19:18.566Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('ad88c9a0-5f81-40cd-a584-19295f5ce5d0', '395aba56-2927-4651-924c-869db1cfaebd', 6, 'AnchorDateField', 'Anchor Date Field', 'For RenewalRelative/SinceEvent windows, the date field on the anchor record the window is measured from (e.g. RenewalDate).', TRUE, FALSE, FALSE, NULL, 'nvarchar', 400, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.971Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('e55eed8d-cb8a-46d5-bb18-6a4bd741b231', '395aba56-2927-4651-924c-869db1cfaebd', 7, 'OffsetDays', 'Offset Days', 'Offset in days applied to the window start relative to the anchor date.', TRUE, FALSE, FALSE, NULL, 'int', 4, 10, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 50, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.972Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('fed5588b-bdac-444c-b586-de3dbb72ffd4', '395aba56-2927-4651-924c-869db1cfaebd', 9, '__mj_CreatedAt', 'Created At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.972Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('8a914e7a-f224-4b3b-9be2-188aa75ec023', '395aba56-2927-4651-924c-869db1cfaebd', 10, '__mj_UpdatedAt', 'Updated At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.973Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('cbaa2955-9d74-4076-aade-cb708b4963c1', '85e49c38-32df-4340-84fe-6cae307c424f', 1, 'ID', 'ID', NULL, TRUE, TRUE, TRUE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, '(newsequentialid())', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, TRUE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.027Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('e02cf7cb-8a25-4dc8-82ca-927952ebf126', '85e49c38-32df-4340-84fe-6cae307c424f', 2, 'ScoreModelID', 'Score Model ID', NULL, TRUE, FALSE, TRUE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 'ID', TRUE, 'ScoreModel', 'Search', NULL, '2026-07-17T21:18:09.027Z', '2026-07-17T21:19:19.532Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('3689d60c-166f-4f46-99db-85765d63d64f', '85e49c38-32df-4340-84fe-6cae307c424f', 3, 'FactorID', 'Factor ID', NULL, TRUE, FALSE, TRUE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, '5681aa78-18a8-41ef-974d-27cf8f54d818', 'ID', TRUE, 'Factor', 'Search', NULL, '2026-07-17T21:18:09.028Z', '2026-07-17T21:19:19.532Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('8b48fa43-3f0d-41c5-a2f4-6c041ed26e64', '85e49c38-32df-4340-84fe-6cae307c424f', 4, 'Weight', 'Weight', 'Weight applied to this factor''s normalized contribution.', TRUE, FALSE, FALSE, NULL, 'decimal', 5, 9, 4, FALSE, '((1))', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.028Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('b2516b32-ff82-4ed2-babf-5ea4d60a34f7', '85e49c38-32df-4340-84fe-6cae307c424f', 5, 'WeightMode', 'Weight Mode', 'How the weight is applied: Additive, Multiplier, Gate, Penalty, or Bonus.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 24, 0, 0, FALSE, '(N''Additive'')', FALSE, 'List', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.028Z', '2026-07-17T21:19:18.564Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('ea472bfa-bfe8-4cf9-b965-3f4b9b910379', '85e49c38-32df-4340-84fe-6cae307c424f', 6, 'ContributionCap', 'Contribution Cap', 'Optional upper clamp on this factor''s contribution.', TRUE, FALSE, FALSE, NULL, 'decimal', 5, 9, 4, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.029Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('eb3dbaeb-acf0-4df2-8c62-23032f36eb5a', '85e49c38-32df-4340-84fe-6cae307c424f', 7, 'ContributionFloor', 'Contribution Floor', 'Optional lower clamp on this factor''s contribution.', TRUE, FALSE, FALSE, NULL, 'decimal', 5, 9, 4, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.029Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('09a7dd5e-abb9-4dc1-94c5-c4caa1a0d737', '85e49c38-32df-4340-84fe-6cae307c424f', 8, 'TrendWeight', 'Trend Weight', 'Extra weight placed on the factor''s delta versus its level (encodes "a falling 80 beats a steady 50").', TRUE, FALSE, FALSE, NULL, 'decimal', 5, 9, 4, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.030Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('030f3666-1eff-419f-a28a-6caa280f3570', '85e49c38-32df-4340-84fe-6cae307c424f', 10, 'IsRequired', 'Is Required', 'When true and data is missing, the resulting score is flagged low-confidence.', TRUE, FALSE, FALSE, NULL, 'bit', 1, 1, 0, FALSE, '((0))', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.030Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('890f9deb-1e63-4e41-8123-5d85a62a8128', '85e49c38-32df-4340-84fe-6cae307c424f', 11, 'DisplayLabel', 'Display Label', 'Label shown for this factor in explainability views, e.g. "Newsletter engagement".', TRUE, FALSE, FALSE, NULL, 'nvarchar', 400, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.031Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('d7aeb940-86cf-4de6-8eb7-8093dbf0bdb2', '85e49c38-32df-4340-84fe-6cae307c424f', 12, 'DisplayOrder', 'Display Order', 'Sort order for displaying this factor in the rubric and explainability views.', TRUE, FALSE, FALSE, NULL, 'int', 4, 10, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 50, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.031Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('e030af90-63f8-470a-a22b-a5d87ba53d7e', '85e49c38-32df-4340-84fe-6cae307c424f', 13, '__mj_CreatedAt', 'Created At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.032Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('51b02c13-152a-4cba-b1bb-af396f85ff25', '85e49c38-32df-4340-84fe-6cae307c424f', 14, '__mj_UpdatedAt', 'Updated At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.032Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('9270e05c-381c-4acc-8afc-f346b924ddc0', '85e49c38-32df-4340-84fe-6cae307c424f', 9, 'MissingDataPolicy', 'Missing Data Policy', 'Policy when the factor has no data: Zero, NeutralMidpoint, Exclude, or ModelDefault.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 32, 0, 0, FALSE, '(N''ModelDefault'')', FALSE, 'List', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.030Z', '2026-07-17T21:19:18.562Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('51a27347-1059-47e7-83fb-9802624b411e', '85e49c38-32df-4340-84fe-6cae307c424f', 16, 'Factor', 'Factor', NULL, TRUE, FALSE, FALSE, NULL, 'nvarchar', 400, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', TRUE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:19:20.140Z', '2026-07-17T21:19:24.171Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('ad2f77d0-c5c3-4184-8475-6eefa8f5f373', '85e49c38-32df-4340-84fe-6cae307c424f', 15, 'ScoreModel', 'Score Model', NULL, TRUE, FALSE, FALSE, NULL, 'nvarchar', 400, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', TRUE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:19:20.140Z', '2026-07-17T21:19:24.171Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('be352d72-19a4-4eb9-810a-299b65cdd036', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 1, 'ID', 'ID', NULL, TRUE, TRUE, TRUE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, '(newsequentialid())', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, TRUE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.973Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('0390b67d-706c-459f-92a1-7cde617693d0', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 2, 'ScoreModelID', 'Score Model ID', NULL, TRUE, FALSE, TRUE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 'ID', TRUE, 'ScoreModel', 'Search', NULL, '2026-07-17T21:18:08.974Z', '2026-07-17T21:19:19.635Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('9d430953-4a4b-4e70-aab4-e251867d5458', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 3, 'ScoreModelVersionID', 'Score Model Version ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, 'b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', 'ID', TRUE, NULL, 'Search', NULL, '2026-07-17T21:18:08.974Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('93013afc-4d71-4965-9c51-417ee9e48ccb', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 4, 'AnchorEntityID', 'Anchor Entity ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, 'e0238f34-2837-ef11-86d4-6045bdee16e6', 'ID', TRUE, 'AnchorEntity', 'Search', NULL, '2026-07-17T21:18:08.975Z', '2026-07-17T21:19:19.636Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('d8e9872b-8516-4303-a95f-c1f154e1079c', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 5, 'AnchorRecordID', 'Anchor Record ID', 'Primary-key value of the scored anchor record, stored as a string to stay entity-agnostic.', TRUE, FALSE, TRUE, NULL, 'nvarchar', 900, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.975Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('d4503159-6b57-4f18-aa24-fc8a6357b839', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 6, 'AnchorRecordKeyJSON', 'Anchor Record Key JSON', 'Optional JSON representation of a composite anchor key.', TRUE, FALSE, FALSE, NULL, 'nvarchar', -1, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.975Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('80693a6c-0611-4ff5-a3dd-145c50ac4513', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 7, 'RawScore', 'Raw Score', 'Pre-scale combined value before mapping to the output scale.', TRUE, FALSE, FALSE, NULL, 'decimal', 9, 12, 4, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.976Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('f5e33284-531a-4f8b-a11e-6ecb1215fa9c', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 8, 'NormalizedScore', 'Normalized Score', 'The headline score on the model''s output scale (e.g. 0-100).', TRUE, FALSE, FALSE, NULL, 'decimal', 5, 9, 4, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.976Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('821eb27f-0782-4632-92ae-eabbdafb4c03', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 9, 'BandID', 'Band ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, '0bc33b83-3ac7-4e09-a7c6-7768454fa868', 'ID', TRUE, NULL, 'Search', NULL, '2026-07-17T21:18:08.977Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('120e0c3a-094b-4a63-bca9-857f2826671f', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 10, 'PreviousNormalizedScore', 'Previous Normalized Score', 'The normalized score from the previous computation, for delta/trend.', TRUE, FALSE, FALSE, NULL, 'decimal', 5, 9, 4, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.977Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('fa0e8656-0f68-4e1b-9e56-260e8b210a21', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 11, 'PreviousBandID', 'Previous Band ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, '0bc33b83-3ac7-4e09-a7c6-7768454fa868', 'ID', TRUE, NULL, 'Search', NULL, '2026-07-17T21:18:08.978Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('399e8896-558e-4702-b62a-449dc9c7e60f', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 12, 'Delta', 'Delta', 'Change in normalized score versus the previous value over the trend window.', TRUE, FALSE, FALSE, NULL, 'decimal', 5, 9, 4, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.978Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('79b91a33-1a6e-4945-9ad4-f9d9bc370fde', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 14, 'TrendSlope', 'Trend Slope', 'Regression slope of the score over recent history.', TRUE, FALSE, FALSE, NULL, 'decimal', 9, 12, 6, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.979Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('328d425f-e9e1-4d98-a93c-84c570acb06f', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 15, 'Confidence', 'Confidence', 'Confidence in the score (0-1), derived from data completeness.', TRUE, FALSE, FALSE, NULL, 'decimal', 5, 5, 4, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.979Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('078f99bb-ec82-4f7b-977b-2a795633c063', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 16, 'DataCompleteness', 'Data Completeness', 'Fraction of factors that had data when the score was computed (0-1).', TRUE, FALSE, FALSE, NULL, 'decimal', 5, 5, 4, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.980Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('6e0d3e26-b6f8-4e93-bb09-f268aeaaf0ab', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 17, 'ComputedAt', 'Computed At', 'UTC timestamp at which this score was computed.', TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(sysdatetimeoffset())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.980Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('87178417-002f-40ee-8f1d-f7a272c5ab09', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 18, 'AsOfDate', 'As Of Date', 'The "now" the time windows resolved against for this score.', TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 100, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.980Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('cbb6f121-fbd2-4f70-9098-75fa0358b9d2', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 19, 'NextRecomputeAt', 'Next Recompute At', 'Optional scheduled time for the next recompute of this score.', TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 100, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.981Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('74ee0fcb-8de6-4a44-a8f8-dbbf9d99dcc4', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 20, 'IsStale', 'Is Stale', 'Indicates population statistics moved but this record has not yet been recomputed.', TRUE, FALSE, FALSE, NULL, 'bit', 1, 1, 0, FALSE, '((0))', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.981Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('2f1dc40a-20ac-4844-ada6-9b83aae83760', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 21, 'ExplanationSummary', 'Explanation Summary', 'Cached natural-language explanation of the score, refreshed on material change.', TRUE, FALSE, FALSE, NULL, 'nvarchar', -1, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.982Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('fa246adc-39c2-4194-9f2b-3ad721ca533f', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 22, '__mj_CreatedAt', 'Created At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.982Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('b30bca7b-783a-419a-9965-207cf5541405', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 23, '__mj_UpdatedAt', 'Updated At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.982Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('612480cc-7423-48dc-8b86-f005b3d6112d', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 13, 'TrendDirection', 'Trend Direction', 'Direction of recent movement: Up, Down, or Flat.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 16, 0, 0, TRUE, NULL, FALSE, 'List', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.978Z', '2026-07-17T21:19:18.568Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('ceb2772e-acc5-4220-b477-a315ae79f3da', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 24, 'ScoreModel', 'Score Model', NULL, TRUE, FALSE, FALSE, NULL, 'nvarchar', 400, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', TRUE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:19:20.131Z', '2026-07-17T21:19:24.171Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('a4b3ce52-91e9-4ac4-ab0c-ee6ff47aa049', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 25, 'AnchorEntity', 'Anchor Entity', NULL, TRUE, FALSE, FALSE, NULL, 'nvarchar', 510, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', TRUE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:19:20.132Z', '2026-07-17T21:19:24.171Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('c857121a-427e-4b49-8788-69bfed5e034c', '4c50b6c8-6b44-49ba-bd29-e9aca1ae23d7', 6, 'NormalizedValue', 'Normalized Value', 'The factor''s normalized output (e.g. 0-1 or configured range).', TRUE, FALSE, FALSE, NULL, 'decimal', 5, 9, 4, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.994Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('f90e5bb9-886f-4663-b1a8-fe6c5625fcec', '4c50b6c8-6b44-49ba-bd29-e9aca1ae23d7', 7, 'WeightedContribution', 'Weighted Contribution', 'Amount this factor added to the score after weighting.', TRUE, FALSE, FALSE, NULL, 'decimal', 9, 12, 4, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.994Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('442525ab-0f99-431c-a6b2-b2d4ae9a4cca', '4c50b6c8-6b44-49ba-bd29-e9aca1ae23d7', 8, 'PercentOfTotal', 'Percent Of Total', 'Share of the total score attributable to this factor.', TRUE, FALSE, FALSE, NULL, 'decimal', 5, 5, 4, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.995Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('cb2e7dd3-7dd9-4585-b6ed-cd6547e3615f', '4c50b6c8-6b44-49ba-bd29-e9aca1ae23d7', 1, 'ID', 'ID', NULL, TRUE, TRUE, TRUE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, '(newsequentialid())', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, TRUE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.992Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('8dc35d21-0d0b-47bc-8bcc-45ae3891f6ce', '4c50b6c8-6b44-49ba-bd29-e9aca1ae23d7', 2, 'ScoreID', 'Score ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 'ID', TRUE, NULL, 'Search', NULL, '2026-07-17T21:18:08.993Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('218fa068-8331-49d8-8603-02ce10142f6c', '4c50b6c8-6b44-49ba-bd29-e9aca1ae23d7', 3, 'ModelFactorID', 'Model Factor ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, '85e49c38-32df-4340-84fe-6cae307c424f', 'ID', TRUE, NULL, 'Search', NULL, '2026-07-17T21:18:08.993Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('25bf9a07-2a42-4fe2-bf5c-84a62a6f025a', '4c50b6c8-6b44-49ba-bd29-e9aca1ae23d7', 5, 'RawValue', 'Raw Value', 'Raw value the factor produced before normalization.', TRUE, FALSE, FALSE, NULL, 'decimal', 9, 18, 6, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.994Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('554548d0-4ade-46ec-949a-868334a32dfa', '4c50b6c8-6b44-49ba-bd29-e9aca1ae23d7', 9, 'ContributionDelta', 'Contribution Delta', 'Change in this factor''s contribution versus the previous score.', TRUE, FALSE, FALSE, NULL, 'decimal', 9, 12, 4, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.995Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('f8774f8a-9f37-4dc6-a0d9-19e488175d57', '4c50b6c8-6b44-49ba-bd29-e9aca1ae23d7', 10, 'HadData', 'Had Data', 'Indicates whether the factor had data for this record.', TRUE, FALSE, FALSE, NULL, 'bit', 1, 1, 0, FALSE, '((0))', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.996Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('66ed2b23-c720-4058-a644-8a2847aacc52', '4c50b6c8-6b44-49ba-bd29-e9aca1ae23d7', 11, 'MissingDataApplied', 'Missing Data Applied', 'Indicates whether a missing-data policy was applied for this factor.', TRUE, FALSE, FALSE, NULL, 'bit', 1, 1, 0, FALSE, '((0))', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.996Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('63a4b592-ce21-4391-b189-90ee0e15dfc0', '4c50b6c8-6b44-49ba-bd29-e9aca1ae23d7', 12, 'DetailJSON', 'Detail JSON', 'Optional JSON with sampled underlying record references for drill-through.', TRUE, FALSE, FALSE, NULL, 'nvarchar', -1, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.997Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('2a868c74-a08e-432d-80ec-a437c8b1d891', '4c50b6c8-6b44-49ba-bd29-e9aca1ae23d7', 13, '__mj_CreatedAt', 'Created At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.997Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('515ca78b-756b-4f8e-963c-60aceb14ea46', '4c50b6c8-6b44-49ba-bd29-e9aca1ae23d7', 14, '__mj_UpdatedAt', 'Updated At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:08.997Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('6514028c-d014-4a54-b1bf-636ca4d50414', '4c50b6c8-6b44-49ba-bd29-e9aca1ae23d7', 4, 'FactorID', 'Factor ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, '5681aa78-18a8-41ef-974d-27cf8f54d818', 'ID', TRUE, 'Factor', 'Search', NULL, '2026-07-17T21:18:08.993Z', '2026-07-17T21:19:19.577Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('d7b77c77-e0a9-4d47-b2f4-2223e8e34468', '4c50b6c8-6b44-49ba-bd29-e9aca1ae23d7', 15, 'Factor', 'Factor', NULL, TRUE, FALSE, FALSE, NULL, 'nvarchar', 400, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', TRUE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:19:20.134Z', '2026-07-17T21:19:24.171Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('34abc54c-03f8-492c-8e3e-0d4ce1878251', '7f52f45a-2a22-4cdb-adb2-9aac713a5ac2', 1, 'ID', 'ID', NULL, TRUE, TRUE, TRUE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, '(newsequentialid())', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, TRUE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.022Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('96c841f1-500a-4825-8c58-600c12f0b210', '7f52f45a-2a22-4cdb-adb2-9aac713a5ac2', 2, 'ScoreModelID', 'Score Model ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 'ID', TRUE, 'ScoreModel', 'Search', NULL, '2026-07-17T21:18:09.022Z', '2026-07-17T21:19:19.586Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('22ff9453-dcab-49b2-a483-142651511610', '7f52f45a-2a22-4cdb-adb2-9aac713a5ac2', 3, 'ScoreModelVersionID', 'Score Model Version ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, 'b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', 'ID', TRUE, NULL, 'Search', NULL, '2026-07-17T21:18:09.022Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('19003202-12f6-468b-8a05-82547a08d6f6', '7f52f45a-2a22-4cdb-adb2-9aac713a5ac2', 4, 'AnchorEntityID', 'Anchor Entity ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, 'e0238f34-2837-ef11-86d4-6045bdee16e6', 'ID', TRUE, 'AnchorEntity', 'Search', NULL, '2026-07-17T21:18:09.023Z', '2026-07-17T21:19:19.587Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('1d697f96-06a4-4a4c-8131-06d5e6c44a03', '7f52f45a-2a22-4cdb-adb2-9aac713a5ac2', 5, 'AnchorRecordID', 'Anchor Record ID', 'Primary-key value of the scored anchor record, stored as a string to stay entity-agnostic.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 900, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.023Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('711ee684-54e2-4773-b83b-7246ed940082', '7f52f45a-2a22-4cdb-adb2-9aac713a5ac2', 6, 'NormalizedScore', 'Normalized Score', 'The headline normalized score at this point in time.', TRUE, FALSE, FALSE, NULL, 'decimal', 5, 9, 4, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.023Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('f4c2ce07-d347-4834-94bd-05a568fb95b8', '7f52f45a-2a22-4cdb-adb2-9aac713a5ac2', 7, 'BandID', 'Band ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, '0bc33b83-3ac7-4e09-a7c6-7768454fa868', 'ID', TRUE, NULL, 'Search', NULL, '2026-07-17T21:18:09.024Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('22c24b9b-5333-4d8c-9098-4560e9f86079', '7f52f45a-2a22-4cdb-adb2-9aac713a5ac2', 8, 'AsOfDate', 'As Of Date', 'The "now" the time windows resolved against for this snapshot.', TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 100, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.024Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('cf5e425d-221d-4e6e-8547-ac3935bd12ba', '7f52f45a-2a22-4cdb-adb2-9aac713a5ac2', 9, 'ComputedAt', 'Computed At', 'UTC timestamp at which this snapshot was computed.', TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(sysdatetimeoffset())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.025Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('b71eabe7-926d-4f74-bfa0-e7fd5fd8d5e6', '7f52f45a-2a22-4cdb-adb2-9aac713a5ac2', 10, 'DataCompleteness', 'Data Completeness', 'Fraction of factors that had data at this point in time (0-1).', TRUE, FALSE, FALSE, NULL, 'decimal', 5, 5, 4, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.025Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('850fad76-0d3b-4230-b5bf-f68782e970fb', '7f52f45a-2a22-4cdb-adb2-9aac713a5ac2', 11, 'Confidence', 'Confidence', 'Confidence in the score at this point in time (0-1).', TRUE, FALSE, FALSE, NULL, 'decimal', 5, 5, 4, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.025Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('823ae2b7-4875-4112-aa30-777427cb220a', '7f52f45a-2a22-4cdb-adb2-9aac713a5ac2', 12, 'ContributionsJSON', 'Contributions JSON', 'Compact per-factor snapshot (JSON) for point-in-time explainability without exploding row counts.', TRUE, FALSE, FALSE, NULL, 'nvarchar', -1, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.026Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('f6e58149-1c8b-4fc0-bf20-da09860d40d6', '7f52f45a-2a22-4cdb-adb2-9aac713a5ac2', 13, '__mj_CreatedAt', 'Created At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.026Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('f26029fb-50cc-4a83-9836-f009a0c31fa4', '7f52f45a-2a22-4cdb-adb2-9aac713a5ac2', 14, '__mj_UpdatedAt', 'Updated At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.027Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('3617c6b8-ac94-48a6-839d-185e25a436cf', '7f52f45a-2a22-4cdb-adb2-9aac713a5ac2', 15, 'ScoreModel', 'Score Model', NULL, TRUE, FALSE, FALSE, NULL, 'nvarchar', 400, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', TRUE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:19:20.139Z', '2026-07-17T21:19:24.171Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('e4b56df9-cb66-4e50-9d88-5880b1abe56a', '7f52f45a-2a22-4cdb-adb2-9aac713a5ac2', 16, 'AnchorEntity', 'Anchor Entity', NULL, TRUE, FALSE, FALSE, NULL, 'nvarchar', 510, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', TRUE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:19:20.139Z', '2026-07-17T21:19:24.171Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('2a45446a-3b7b-4f4c-b09a-f77ffde9ba36', '799802fa-c709-46dd-a8fc-86024fae149a', 1, 'ID', 'ID', NULL, TRUE, TRUE, TRUE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, '(newsequentialid())', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, TRUE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.016Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('d12ffb59-5d72-482f-aad5-fc46e3bc52bb', '799802fa-c709-46dd-a8fc-86024fae149a', 2, 'ScoreModelID', 'Score Model ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 'ID', TRUE, 'ScoreModel', 'Search', NULL, '2026-07-17T21:18:09.016Z', '2026-07-17T21:19:19.626Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('cc963fa3-10cf-407d-bb9d-8a00069e124e', '799802fa-c709-46dd-a8fc-86024fae149a', 3, 'ScoreModelVersionID', 'Score Model Version ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, 'b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', 'ID', TRUE, NULL, 'Search', NULL, '2026-07-17T21:18:09.016Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('8094c4b7-2603-4ab7-a9a7-f3e7e28aeae8', '799802fa-c709-46dd-a8fc-86024fae149a', 4, 'TriggerType', 'Trigger Type', 'What triggered the run: Scheduled, Event, Manual, or Backfill.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 32, 0, 0, FALSE, NULL, FALSE, 'List', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.017Z', '2026-07-17T21:19:18.573Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('42c7eb9f-b4c1-46f5-be82-f7edb7afa616', '799802fa-c709-46dd-a8fc-86024fae149a', 6, 'StartedAt', 'Started At', 'UTC timestamp when the run started.', TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(sysdatetimeoffset())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.017Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('0d3889dc-254e-4266-ba22-cfd94dd23921', '799802fa-c709-46dd-a8fc-86024fae149a', 7, 'CompletedAt', 'Completed At', 'UTC timestamp when the run completed.', TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 100, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.018Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('115a1b4c-c6a2-4e93-a0ce-8eaa971ba103', '799802fa-c709-46dd-a8fc-86024fae149a', 8, 'Status', 'Status', 'Run status: Running, Succeeded, Failed, or PartialSuccess.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 32, 0, 0, FALSE, '(N''Running'')', FALSE, 'List', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.018Z', '2026-07-17T21:19:18.571Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('a4d1223c-3c3f-4a75-9c0d-8a4e09811080', '799802fa-c709-46dd-a8fc-86024fae149a', 9, 'RecordsScored', 'Records Scored', 'Number of records scored in the run.', TRUE, FALSE, FALSE, NULL, 'int', 4, 10, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 50, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.019Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('9cef828b-4060-43ea-b192-144fbb8b0db9', '799802fa-c709-46dd-a8fc-86024fae149a', 10, 'RecordsChanged', 'Records Changed', 'Number of records whose score changed in the run.', TRUE, FALSE, FALSE, NULL, 'int', 4, 10, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 50, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.019Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('a839a836-11f9-41e2-82d2-97580401b1b6', '799802fa-c709-46dd-a8fc-86024fae149a', 11, 'BandTransitions', 'Band Transitions', 'Number of band transitions recorded during the run.', TRUE, FALSE, FALSE, NULL, 'int', 4, 10, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 50, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.019Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('d53ad66b-1c85-4a8e-8916-bad0f4d78510', '799802fa-c709-46dd-a8fc-86024fae149a', 12, 'DurationMs', 'Duration Ms', 'Total run duration in milliseconds.', TRUE, FALSE, FALSE, NULL, 'bigint', 8, 19, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.020Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('bbc2dd4d-7f3a-43b6-885b-778aec45614c', '799802fa-c709-46dd-a8fc-86024fae149a', 13, 'CostUnitsConsumed', 'Cost Units Consumed', 'Tokens/compute units consumed by ActionBacked factors; feeds metering and billing.', TRUE, FALSE, FALSE, NULL, 'decimal', 9, 12, 4, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.020Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('a0d2968b-e99d-42f0-a2c9-296d74fc7165', '799802fa-c709-46dd-a8fc-86024fae149a', 14, 'ErrorsJSON', 'Errors JSON', 'JSON capturing any errors encountered during the run.', TRUE, FALSE, FALSE, NULL, 'nvarchar', -1, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.020Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('c23b0171-6474-4806-848c-97614f5a6062', '799802fa-c709-46dd-a8fc-86024fae149a', 15, '__mj_CreatedAt', 'Created At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.021Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('1619c136-a4b1-4de4-8ce0-bceda47c23c1', '799802fa-c709-46dd-a8fc-86024fae149a', 16, '__mj_UpdatedAt', 'Updated At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.021Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('bdede265-87d8-467b-86bf-79fc84c111b2', '799802fa-c709-46dd-a8fc-86024fae149a', 5, 'Scope', 'Scope', 'Scope of the run: FullPopulation, Incremental, or SingleRecord.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 32, 0, 0, FALSE, NULL, FALSE, 'List', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.017Z', '2026-07-17T21:19:18.570Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('f9c50847-ee50-4f00-a4d8-10fec67050ce', '799802fa-c709-46dd-a8fc-86024fae149a', 17, 'ScoreModel', 'Score Model', NULL, TRUE, FALSE, FALSE, NULL, 'nvarchar', 400, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', TRUE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:19:20.138Z', '2026-07-17T21:19:24.171Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('79364c72-1c8d-4ce7-ba3b-b38dc18d6342', '88f3e05a-97d6-480d-ad73-8243a0a155e2', 1, 'ID', 'ID', NULL, TRUE, TRUE, TRUE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, '(newsequentialid())', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, TRUE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.032Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('d8098fbd-ae83-4099-bcc7-492973581cae', '88f3e05a-97d6-480d-ad73-8243a0a155e2', 2, 'ScoreModelID', 'Score Model ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 'ID', TRUE, 'ScoreModel', 'Search', NULL, '2026-07-17T21:18:09.033Z', '2026-07-17T21:19:19.560Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('4e2108e4-363c-4026-9e9e-7eb2ac999325', '88f3e05a-97d6-480d-ad73-8243a0a155e2', 3, 'AnchorRecordID', 'Anchor Record ID', 'Primary-key value of the anchor record that crossed bands, stored as a string to stay entity-agnostic.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 900, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.033Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('ae986f5d-40b9-497c-834d-91e2f154a94e', '88f3e05a-97d6-480d-ad73-8243a0a155e2', 4, 'FromBandID', 'From Band ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, '0bc33b83-3ac7-4e09-a7c6-7768454fa868', 'ID', TRUE, NULL, 'Search', NULL, '2026-07-17T21:18:09.033Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('259296ec-d61b-4223-925f-c6043dfe734a', '88f3e05a-97d6-480d-ad73-8243a0a155e2', 5, 'ToBandID', 'To Band ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, '0bc33b83-3ac7-4e09-a7c6-7768454fa868', 'ID', TRUE, NULL, 'Search', NULL, '2026-07-17T21:18:09.034Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('f595a9fc-117b-470c-99d2-644fe3834af5', '88f3e05a-97d6-480d-ad73-8243a0a155e2', 7, 'OccurredAt', 'Occurred At', 'UTC timestamp at which the band crossing occurred.', TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(sysdatetimeoffset())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.035Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('cc34a448-7a61-48a2-9543-7e16a2802665', '88f3e05a-97d6-480d-ad73-8243a0a155e2', 8, 'RecomputeRunID', 'Recompute Run ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, '799802fa-c709-46dd-a8fc-86024fae149a', 'ID', TRUE, NULL, 'Search', NULL, '2026-07-17T21:18:09.035Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('51cf3bcf-1aa0-4714-a46f-843956f96dc4', '88f3e05a-97d6-480d-ad73-8243a0a155e2', 9, 'Handled', 'Handled', 'Indicates whether the transition has been picked up by write-back or an intervention.', TRUE, FALSE, FALSE, NULL, 'bit', 1, 1, 0, FALSE, '((0))', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.035Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('46d6e994-433d-49f6-857b-1a54551114f7', '88f3e05a-97d6-480d-ad73-8243a0a155e2', 10, '__mj_CreatedAt', 'Created At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.036Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('0fdedf61-72f9-4a3a-a831-f8352a2e7b93', '88f3e05a-97d6-480d-ad73-8243a0a155e2', 11, '__mj_UpdatedAt', 'Updated At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.036Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('74e18767-2dfb-480d-828e-6905e57477e2', '88f3e05a-97d6-480d-ad73-8243a0a155e2', 6, 'Direction', 'Direction', 'Direction of the crossing: Improving or Worsening.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 24, 0, 0, TRUE, NULL, FALSE, 'List', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.034Z', '2026-07-17T21:19:18.575Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('1ecb11db-6128-4671-873f-be357b3a3868', '88f3e05a-97d6-480d-ad73-8243a0a155e2', 12, 'ScoreModel', 'Score Model', NULL, TRUE, FALSE, FALSE, NULL, 'nvarchar', 400, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', TRUE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:19:20.141Z', '2026-07-17T21:19:24.171Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('23990bca-7a6e-4e2e-b71e-d4ed8b498e81', '625c01e7-4dcc-40b8-b7b5-42d6a04757ca', 3, 'EntityChanged', 'Entity Changed', 'Name of the configuration entity that changed (e.g. ScoreModel, Factor, ModelFactor).', TRUE, FALSE, FALSE, NULL, 'nvarchar', 200, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.012Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('b9071266-0fed-468a-a4d7-227c5872b90b', '625c01e7-4dcc-40b8-b7b5-42d6a04757ca', 4, 'RecordID', 'Record ID', 'Identifier of the specific record that changed, stored as a string to stay entity-agnostic.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 200, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.012Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('41fb2182-258c-4723-b61b-6f939816684c', '625c01e7-4dcc-40b8-b7b5-42d6a04757ca', 5, 'ChangeType', 'Change Type', 'Kind of change: Create, Update, Delete, or Publish.', TRUE, FALSE, FALSE, NULL, 'nvarchar', 40, 0, 0, FALSE, NULL, FALSE, 'List', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.013Z', '2026-07-17T21:19:18.576Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('0e903569-a20f-4f9f-9968-c6fec6917558', '625c01e7-4dcc-40b8-b7b5-42d6a04757ca', 1, 'ID', 'ID', NULL, TRUE, TRUE, TRUE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, '(newsequentialid())', FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, TRUE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.011Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('56af3c35-c282-4150-af4a-bf3ba6a2e403', '625c01e7-4dcc-40b8-b7b5-42d6a04757ca', 2, 'ScoreModelID', 'Score Model ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 'ID', TRUE, 'ScoreModel', 'Search', NULL, '2026-07-17T21:18:09.011Z', '2026-07-17T21:19:19.596Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('c90ffff1-4d71-4d9c-80b3-4316ec7e965b', '625c01e7-4dcc-40b8-b7b5-42d6a04757ca', 6, 'BeforeJSON', 'Before JSON', 'JSON snapshot of the record before the change.', TRUE, FALSE, FALSE, NULL, 'nvarchar', -1, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.013Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('21bb5103-926e-4593-8e35-48549a9d8e55', '625c01e7-4dcc-40b8-b7b5-42d6a04757ca', 7, 'AfterJSON', 'After JSON', 'JSON snapshot of the record after the change.', TRUE, FALSE, FALSE, NULL, 'nvarchar', -1, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.013Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('9777ca30-03e3-4437-8c6e-4e72ec8b96f2', '625c01e7-4dcc-40b8-b7b5-42d6a04757ca', 8, 'ChangedByUserID', 'Changed By User ID', NULL, TRUE, FALSE, FALSE, NULL, 'uniqueidentifier', 16, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, 'e1238f34-2837-ef11-86d4-6045bdee16e6', 'ID', TRUE, 'ChangedByUser', 'Search', NULL, '2026-07-17T21:18:09.014Z', '2026-07-17T21:19:19.596Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('5df3c9aa-c33f-4917-b8ef-d6507c86d454', '625c01e7-4dcc-40b8-b7b5-42d6a04757ca', 9, 'ChangedAt', 'Changed At', 'UTC timestamp at which the change occurred.', TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(sysdatetimeoffset())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.014Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('8ad16294-46ba-4d1e-bcc8-07f48d8e6886', '625c01e7-4dcc-40b8-b7b5-42d6a04757ca', 10, '__mj_CreatedAt', 'Created At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.015Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('c5ca8a1b-bc31-400d-bf99-cf998d280724', '625c01e7-4dcc-40b8-b7b5-42d6a04757ca', 11, '__mj_UpdatedAt', 'Updated At', NULL, TRUE, FALSE, FALSE, NULL, 'datetimeoffset', 10, 34, 7, FALSE, '(getutcdate())', FALSE, 'None', NULL, NULL, FALSE, NULL, 100, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:18:09.015Z', '2026-07-17T21:19:18.069Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('4f23e2f4-cfec-4aa8-8638-a683f8b6ef9b', '625c01e7-4dcc-40b8-b7b5-42d6a04757ca', 12, 'ScoreModel', 'Score Model', NULL, TRUE, FALSE, FALSE, NULL, 'nvarchar', 400, 0, 0, FALSE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', TRUE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:19:20.137Z', '2026-07-17T21:19:24.171Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityField" ("ID", "EntityID", "Sequence", "Name", "DisplayName", "Description", "AutoUpdateDescription", "IsPrimaryKey", "IsUnique", "Category", "Type", "Length", "Precision", "Scale", "AllowsNull", "DefaultValue", "AutoIncrement", "ValueListType", "ExtendedType", "CodeType", "DefaultInView", "ViewCellTemplate", "DefaultColumnWidth", "AllowUpdateAPI", "AllowUpdateInView", "IncludeInUserSearchAPI", "FullTextSearchEnabled", "UserSearchParamFormatAPI", "IncludeInGeneratedForm", "GeneratedFormSection", "IsVirtual", "IsNameField", "RelatedEntityID", "RelatedEntityFieldName", "IncludeRelatedEntityNameFieldInBaseView", "RelatedEntityNameFieldMap", "RelatedEntityDisplayType", "EntityIDFieldName", "__mj_CreatedAt", "__mj_UpdatedAt", "ScopeDefault", "AutoUpdateRelatedEntityInfo", "ValuesToPackWithSchema", "Status", "AutoUpdateIsNameField", "AutoUpdateDefaultInView", "AutoUpdateCategory", "AutoUpdateDisplayName", "AutoUpdateIncludeInUserSearchAPI", "Encrypt", "EncryptionKeyID", "AllowDecryptInAPI", "SendEncryptedValue", "IsSoftPrimaryKey", "IsSoftForeignKey", "RelatedEntityJoinFields", "JSONType", "JSONTypeIsArray", "JSONTypeDefinition", "UserSearchPredicateAPI", "AutoUpdateUserSearchPredicate", "AutoUpdateFullTextSearch", "AutoUpdateExtendedType", "IsComputed") VALUES ('b0de983e-f6e3-4cdf-ab0d-3469ae8168e2', '625c01e7-4dcc-40b8-b7b5-42d6a04757ca', 13, 'ChangedByUser', 'Changed By User', NULL, TRUE, FALSE, FALSE, NULL, 'nvarchar', 200, 0, 0, TRUE, NULL, FALSE, 'None', NULL, NULL, FALSE, NULL, 150, FALSE, TRUE, FALSE, FALSE, NULL, TRUE, 'Details', TRUE, FALSE, NULL, NULL, FALSE, NULL, 'Search', NULL, '2026-07-17T21:19:20.138Z', '2026-07-17T21:19:24.171Z', NULL, TRUE, 'Auto', 'Active', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, FALSE, FALSE, FALSE, FALSE, NULL, NULL, FALSE, NULL, 'Contains', TRUE, TRUE, TRUE, FALSE) ON CONFLICT ("ID") DO NOTHING;
-- EntityFieldValue: 83 rows
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('0f5ad442-aa15-482c-b609-5966063e759e', 'df92a570-f6b3-4ad9-a433-84a1b4d9d256', 1, 'AllTime', 'AllTime', NULL, '2026-07-17T21:19:18.565Z', '2026-07-17T21:19:18.565Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('6e34b1f8-cde8-4272-bb75-8260c11ac9d3', 'df92a570-f6b3-4ad9-a433-84a1b4d9d256', 2, 'Calendar', 'Calendar', NULL, '2026-07-17T21:19:18.565Z', '2026-07-17T21:19:18.565Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('933431b0-06ba-484d-8c6c-8b1302f2971d', 'df92a570-f6b3-4ad9-a433-84a1b4d9d256', 3, 'RenewalRelative', 'RenewalRelative', NULL, '2026-07-17T21:19:18.565Z', '2026-07-17T21:19:18.565Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('411e85d6-8f5f-408a-8360-d72da125ab16', 'df92a570-f6b3-4ad9-a433-84a1b4d9d256', 4, 'Rolling', 'Rolling', NULL, '2026-07-17T21:19:18.565Z', '2026-07-17T21:19:18.565Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('b4081468-efc5-4979-8465-55c3f3130c2d', 'df92a570-f6b3-4ad9-a433-84a1b4d9d256', 5, 'SinceEvent', 'SinceEvent', NULL, '2026-07-17T21:19:18.566Z', '2026-07-17T21:19:18.566Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('77ddaf59-de0c-4dce-b64e-6e1ab8a2927c', '2519b3b4-4a67-4734-ae77-a693c728828a', 1, 'Batch', 'Batch', NULL, '2026-07-17T21:19:18.550Z', '2026-07-17T21:19:18.550Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('69991d88-a920-468a-8324-fcbc61d875ed', '2519b3b4-4a67-4734-ae77-a693c728828a', 2, 'PerRecord', 'PerRecord', NULL, '2026-07-17T21:19:18.551Z', '2026-07-17T21:19:18.551Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('061e0cbf-d1ba-4c01-a039-73ecb507072e', '41fb2182-258c-4723-b61b-6f939816684c', 1, 'Create', 'Create', NULL, '2026-07-17T21:19:18.575Z', '2026-07-17T21:19:18.575Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('f36a4a4d-d093-4ccd-ad63-3fb282523ae6', '41fb2182-258c-4723-b61b-6f939816684c', 2, 'Delete', 'Delete', NULL, '2026-07-17T21:19:18.575Z', '2026-07-17T21:19:18.575Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('e404757d-12d2-47c8-a9af-8412702c4e81', '41fb2182-258c-4723-b61b-6f939816684c', 3, 'Publish', 'Publish', NULL, '2026-07-17T21:19:18.576Z', '2026-07-17T21:19:18.576Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('cba70cf9-3484-4081-9592-29c381226202', '41fb2182-258c-4723-b61b-6f939816684c', 4, 'Update', 'Update', NULL, '2026-07-17T21:19:18.576Z', '2026-07-17T21:19:18.576Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('c69e2cdd-32f5-4990-af60-132d0d76907f', '74e18767-2dfb-480d-828e-6905e57477e2', 1, 'Improving', 'Improving', NULL, '2026-07-17T21:19:18.574Z', '2026-07-17T21:19:18.574Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('d0f73390-6b57-4341-b4d0-c23e80cebce5', '74e18767-2dfb-480d-828e-6905e57477e2', 2, 'Worsening', 'Worsening', NULL, '2026-07-17T21:19:18.574Z', '2026-07-17T21:19:18.574Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('54c0f3c4-594b-4c8a-ab74-11a109ade07f', '4d503153-8691-428c-8228-04d8dacfab41', 1, 'Approved', 'Approved', NULL, '2026-07-17T21:19:18.557Z', '2026-07-17T21:19:18.557Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('14f2287d-06d8-4fd0-a771-11a923c1ac53', '4d503153-8691-428c-8228-04d8dacfab41', 2, 'Deprecated', 'Deprecated', NULL, '2026-07-17T21:19:18.557Z', '2026-07-17T21:19:18.557Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('6b243f72-05bc-4e4b-8e26-760be7d01b19', '4d503153-8691-428c-8228-04d8dacfab41', 3, 'Draft', 'Draft', NULL, '2026-07-17T21:19:18.557Z', '2026-07-17T21:19:18.557Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5958578c-682a-479d-b2f5-1ad07949fd8d', '4d503153-8691-428c-8228-04d8dacfab41', 4, 'InReview', 'InReview', NULL, '2026-07-17T21:19:18.558Z', '2026-07-17T21:19:18.558Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('b52db618-2c3c-4fca-ae1d-2bea3ad82de2', 'a44c3309-30fa-4511-bfca-dbb3301d6839', 1, 'Banded', 'Banded', NULL, '2026-07-17T21:19:18.554Z', '2026-07-17T21:19:18.554Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('81ffdc3a-0424-47ee-8706-e7d0a3b824df', 'a44c3309-30fa-4511-bfca-dbb3301d6839', 2, 'Logistic', 'Logistic', NULL, '2026-07-17T21:19:18.554Z', '2026-07-17T21:19:18.554Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('e6a6a322-7275-49b6-b7e1-87f5f9ed2324', 'a44c3309-30fa-4511-bfca-dbb3301d6839', 3, 'Lookup', 'Lookup', NULL, '2026-07-17T21:19:18.555Z', '2026-07-17T21:19:18.555Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('c5472414-384e-4f35-b5be-f900c763c375', 'a44c3309-30fa-4511-bfca-dbb3301d6839', 4, 'MinMax', 'MinMax', NULL, '2026-07-17T21:19:18.555Z', '2026-07-17T21:19:18.555Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('b7668f5f-1d33-4709-a328-8463a0f2979a', 'a44c3309-30fa-4511-bfca-dbb3301d6839', 5, 'None', 'None', NULL, '2026-07-17T21:19:18.555Z', '2026-07-17T21:19:18.555Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('b5abe605-e678-4b31-a605-19e7a11ad223', 'a44c3309-30fa-4511-bfca-dbb3301d6839', 6, 'Percentile', 'Percentile', NULL, '2026-07-17T21:19:18.555Z', '2026-07-17T21:19:18.555Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('23d1941a-de18-4220-9c19-7b3171989b68', 'a44c3309-30fa-4511-bfca-dbb3301d6839', 7, 'ZScore', 'ZScore', NULL, '2026-07-17T21:19:18.556Z', '2026-07-17T21:19:18.556Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('2b7fa016-8a8d-44c7-93fc-112bd4baa6f8', 'ed6922d6-0955-40c3-887f-92dabddf7716', 1, 'ActionBacked', 'ActionBacked', NULL, '2026-07-17T21:19:18.552Z', '2026-07-17T21:19:18.552Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('87a5184e-d123-4c49-9fc3-b24e472adb1d', 'ed6922d6-0955-40c3-887f-92dabddf7716', 2, 'Constant', 'Constant', NULL, '2026-07-17T21:19:18.552Z', '2026-07-17T21:19:18.552Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('f15d7b60-b08e-4a87-a435-0bf7c58dc011', 'ed6922d6-0955-40c3-887f-92dabddf7716', 3, 'Declarative', 'Declarative', NULL, '2026-07-17T21:19:18.553Z', '2026-07-17T21:19:18.553Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('0e5d65a1-0159-4788-b967-c75c6da6aca6', 'ed6922d6-0955-40c3-887f-92dabddf7716', 4, 'DerivedFromScore', 'DerivedFromScore', NULL, '2026-07-17T21:19:18.553Z', '2026-07-17T21:19:18.553Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('0eac809f-004e-49ec-90a1-a07fd2628e64', 'e8e1c503-bebf-4be3-a4ee-a0b131168829', 1, 'Avg', 'Avg', NULL, '2026-07-17T21:19:18.545Z', '2026-07-17T21:19:18.545Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('3b7c93a3-a97e-4e9f-9106-7465a5fc3809', 'e8e1c503-bebf-4be3-a4ee-a0b131168829', 2, 'Count', 'Count', NULL, '2026-07-17T21:19:18.546Z', '2026-07-17T21:19:18.546Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('48ef6646-4c51-46c8-84fb-deb9a87f9322', 'e8e1c503-bebf-4be3-a4ee-a0b131168829', 3, 'DistinctCount', 'DistinctCount', NULL, '2026-07-17T21:19:18.546Z', '2026-07-17T21:19:18.546Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('c4081d99-4d44-4244-a3ad-76e510db2459', 'e8e1c503-bebf-4be3-a4ee-a0b131168829', 4, 'Exists', 'Exists', NULL, '2026-07-17T21:19:18.547Z', '2026-07-17T21:19:18.547Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('beb2cb5c-83cf-4064-8327-052aa196799d', 'e8e1c503-bebf-4be3-a4ee-a0b131168829', 5, 'Max', 'Max', NULL, '2026-07-17T21:19:18.547Z', '2026-07-17T21:19:18.547Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('25f0761a-7a32-4e2d-93fd-47785ba039a4', 'e8e1c503-bebf-4be3-a4ee-a0b131168829', 6, 'Min', 'Min', NULL, '2026-07-17T21:19:18.548Z', '2026-07-17T21:19:18.548Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('09e2f26b-cde8-4b5f-8873-82f904f50369', 'e8e1c503-bebf-4be3-a4ee-a0b131168829', 7, 'RatePerPeriod', 'RatePerPeriod', NULL, '2026-07-17T21:19:18.548Z', '2026-07-17T21:19:18.548Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('12e4b233-b884-4235-ad22-8783b6e621b9', 'e8e1c503-bebf-4be3-a4ee-a0b131168829', 8, 'Recency', 'Recency', NULL, '2026-07-17T21:19:18.548Z', '2026-07-17T21:19:18.548Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('4da2f68d-9fe0-42fe-9551-abda22687a99', 'e8e1c503-bebf-4be3-a4ee-a0b131168829', 9, 'Sum', 'Sum', NULL, '2026-07-17T21:19:18.549Z', '2026-07-17T21:19:18.549Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('2321220c-e412-421e-902f-b498c29638d3', 'e8e1c503-bebf-4be3-a4ee-a0b131168829', 10, 'TrendSlope', 'TrendSlope', NULL, '2026-07-17T21:19:18.549Z', '2026-07-17T21:19:18.549Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('647cb623-aade-4453-9840-b7b287b04f59', '1b779c4d-02ce-4d54-87c3-a4033f51dbff', 1, 'EndOfPreviousDay', 'EndOfPreviousDay', NULL, '2026-07-17T21:19:18.533Z', '2026-07-17T21:19:18.533Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('bf4fb9de-d8dc-4950-b90e-7f464d1a3ac5', '1b779c4d-02ce-4d54-87c3-a4033f51dbff', 2, 'Fixed', 'Fixed', NULL, '2026-07-17T21:19:18.534Z', '2026-07-17T21:19:18.534Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('02da1730-83af-4048-9c82-50d0e66a9511', '1b779c4d-02ce-4d54-87c3-a4033f51dbff', 3, 'RunTime', 'RunTime', NULL, '2026-07-17T21:19:18.534Z', '2026-07-17T21:19:18.534Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('d493aa1c-e578-4ee8-9aef-c1aa905e7953', 'bdede265-87d8-467b-86bf-79fc84c111b2', 1, 'FullPopulation', 'FullPopulation', NULL, '2026-07-17T21:19:18.568Z', '2026-07-17T21:19:18.568Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('53287c7e-059a-4c4b-b68f-b028ae4bf71b', 'bdede265-87d8-467b-86bf-79fc84c111b2', 2, 'Incremental', 'Incremental', NULL, '2026-07-17T21:19:18.569Z', '2026-07-17T21:19:18.569Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('3922b78b-c522-4205-a57f-7914ecc04a4f', 'bdede265-87d8-467b-86bf-79fc84c111b2', 3, 'SingleRecord', 'SingleRecord', NULL, '2026-07-17T21:19:18.569Z', '2026-07-17T21:19:18.569Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('66e002d5-bb22-4505-b61a-aefaf38c3ed2', 'f76f5d41-75b7-4a61-9f60-d46c3220a41a', 1, 'Banded', 'Banded', NULL, '2026-07-17T21:19:18.536Z', '2026-07-17T21:19:18.536Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('09ba4247-7e10-4b7c-bdf5-e657f2fd1e1a', 'f76f5d41-75b7-4a61-9f60-d46c3220a41a', 2, 'ExpressionDriven', 'ExpressionDriven', NULL, '2026-07-17T21:19:18.536Z', '2026-07-17T21:19:18.536Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('21e0a5e7-3bb2-4a7e-8f0f-9c0e298ca1d3', 'f76f5d41-75b7-4a61-9f60-d46c3220a41a', 3, 'WeightedAvg', 'WeightedAvg', NULL, '2026-07-17T21:19:18.537Z', '2026-07-17T21:19:18.537Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('ba6df694-ff52-4524-9552-d3d2e9c385c2', 'f76f5d41-75b7-4a61-9f60-d46c3220a41a', 4, 'WeightedSum', 'WeightedSum', NULL, '2026-07-17T21:19:18.537Z', '2026-07-17T21:19:18.537Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('d78c3517-ac24-4844-a35e-7f3a9de47c55', 'f76f5d41-75b7-4a61-9f60-d46c3220a41a', 5, 'ZScoreComposite', 'ZScoreComposite', NULL, '2026-07-17T21:19:18.537Z', '2026-07-17T21:19:18.537Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('d0ff807a-0ca3-48c4-952e-fcc82b2da0a5', '835ec9bb-db1d-410d-bd5f-104aae00e221', 1, 'EventDriven', 'EventDriven', NULL, '2026-07-17T21:19:18.539Z', '2026-07-17T21:19:18.539Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('58637de3-0bcd-49d5-98de-b3976707e233', '835ec9bb-db1d-410d-bd5f-104aae00e221', 2, 'Hybrid', 'Hybrid', NULL, '2026-07-17T21:19:18.539Z', '2026-07-17T21:19:18.539Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('7d26da12-79bc-42c6-937c-774355ecc8f5', '835ec9bb-db1d-410d-bd5f-104aae00e221', 3, 'OnDemand', 'OnDemand', NULL, '2026-07-17T21:19:18.539Z', '2026-07-17T21:19:18.539Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('250ae703-90c8-456c-acf7-9bba7f171c2e', '835ec9bb-db1d-410d-bd5f-104aae00e221', 4, 'Scheduled', 'Scheduled', NULL, '2026-07-17T21:19:18.540Z', '2026-07-17T21:19:18.540Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('d0c5289d-7e26-4c1e-b9f2-48a194e3c8f1', '115a1b4c-c6a2-4e93-a0ce-8eaa971ba103', 1, 'Failed', 'Failed', NULL, '2026-07-17T21:19:18.570Z', '2026-07-17T21:19:18.570Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('1f52a103-4ad5-4a6c-9b52-92536169dca3', '115a1b4c-c6a2-4e93-a0ce-8eaa971ba103', 2, 'PartialSuccess', 'PartialSuccess', NULL, '2026-07-17T21:19:18.570Z', '2026-07-17T21:19:18.570Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('0d89c5a5-ce04-4425-925e-67cfa3665682', '115a1b4c-c6a2-4e93-a0ce-8eaa971ba103', 3, 'Running', 'Running', NULL, '2026-07-17T21:19:18.571Z', '2026-07-17T21:19:18.571Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('322037ba-6451-4e6c-8e7c-1820d82ce07f', '115a1b4c-c6a2-4e93-a0ce-8eaa971ba103', 4, 'Succeeded', 'Succeeded', NULL, '2026-07-17T21:19:18.571Z', '2026-07-17T21:19:18.571Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('e63c0fd9-c525-4f6a-8316-d345564bbcbd', '4cd22992-eea6-41b2-8768-7a7c2fd4d3e1', 1, 'Inner', 'Inner', NULL, '2026-07-17T21:19:18.544Z', '2026-07-17T21:19:18.544Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('af2640bd-4f05-43b9-8219-abdc7118a3e2', '4cd22992-eea6-41b2-8768-7a7c2fd4d3e1', 2, 'Left', 'Left', NULL, '2026-07-17T21:19:18.544Z', '2026-07-17T21:19:18.544Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('68b24456-441f-435d-ae27-fbc08acdd762', '1095daac-fe07-4e2d-8e95-3ab7440c682f', 1, 'Boolean', 'Boolean', NULL, '2026-07-17T21:19:18.559Z', '2026-07-17T21:19:18.559Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('3171f887-d981-47c8-9ecf-42a542517b2f', '1095daac-fe07-4e2d-8e95-3ab7440c682f', 2, 'Date', 'Date', NULL, '2026-07-17T21:19:18.559Z', '2026-07-17T21:19:18.559Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('15d53877-8ed6-4fa3-b3fb-7a7faa4d7c0c', '1095daac-fe07-4e2d-8e95-3ab7440c682f', 3, 'Duration', 'Duration', NULL, '2026-07-17T21:19:18.559Z', '2026-07-17T21:19:18.559Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('957d0201-23d1-4866-bc86-99b9a5184ad0', '1095daac-fe07-4e2d-8e95-3ab7440c682f', 4, 'Number', 'Number', NULL, '2026-07-17T21:19:18.560Z', '2026-07-17T21:19:18.560Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('b4709c5b-69e1-45d4-b225-c19275d2460a', '2dcec77d-67c1-4f45-b4e2-dea20cd28f2c', 1, 'Active', 'Active', NULL, '2026-07-17T21:19:18.541Z', '2026-07-17T21:19:18.541Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('7b45da78-9615-47a1-ab94-f7b04705f2a9', '2dcec77d-67c1-4f45-b4e2-dea20cd28f2c', 2, 'Archived', 'Archived', NULL, '2026-07-17T21:19:18.541Z', '2026-07-17T21:19:18.541Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('1a7c3326-42ce-4333-abe6-336e74041da0', '2dcec77d-67c1-4f45-b4e2-dea20cd28f2c', 3, 'Draft', 'Draft', NULL, '2026-07-17T21:19:18.542Z', '2026-07-17T21:19:18.542Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('82b72f85-8d54-4484-aad5-a2bfe2aa5d07', '2dcec77d-67c1-4f45-b4e2-dea20cd28f2c', 4, 'Paused', 'Paused', NULL, '2026-07-17T21:19:18.542Z', '2026-07-17T21:19:18.542Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('c043b201-4b2e-4349-85bf-f64f4667af92', '9270e05c-381c-4acc-8afc-f346b924ddc0', 1, 'Exclude', 'Exclude', NULL, '2026-07-17T21:19:18.561Z', '2026-07-17T21:19:18.561Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('6f55cbec-4c2b-4d19-9a87-2d05858e36a4', '9270e05c-381c-4acc-8afc-f346b924ddc0', 2, 'ModelDefault', 'ModelDefault', NULL, '2026-07-17T21:19:18.561Z', '2026-07-17T21:19:18.561Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('d52bfbad-5ae1-4759-ad9d-711fd1a92abf', '9270e05c-381c-4acc-8afc-f346b924ddc0', 3, 'NeutralMidpoint', 'NeutralMidpoint', NULL, '2026-07-17T21:19:18.561Z', '2026-07-17T21:19:18.561Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('556bb767-2b14-4e6a-aff7-428bd95ea473', '9270e05c-381c-4acc-8afc-f346b924ddc0', 4, 'Zero', 'Zero', NULL, '2026-07-17T21:19:18.562Z', '2026-07-17T21:19:18.562Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('0a730598-3af5-4928-a1da-a024369fca42', 'b2516b32-ff82-4ed2-babf-5ea4d60a34f7', 1, 'Additive', 'Additive', NULL, '2026-07-17T21:19:18.563Z', '2026-07-17T21:19:18.563Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('d8f6b72d-d49b-4b71-bc6c-b13c7e32e792', 'b2516b32-ff82-4ed2-babf-5ea4d60a34f7', 2, 'Bonus', 'Bonus', NULL, '2026-07-17T21:19:18.563Z', '2026-07-17T21:19:18.563Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('680d7ab2-f589-47d7-b7b6-37a1d6396d97', 'b2516b32-ff82-4ed2-babf-5ea4d60a34f7', 3, 'Gate', 'Gate', NULL, '2026-07-17T21:19:18.563Z', '2026-07-17T21:19:18.563Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('c8dbcd3a-e5a6-4c13-b95e-2aa1855907e4', 'b2516b32-ff82-4ed2-babf-5ea4d60a34f7', 4, 'Multiplier', 'Multiplier', NULL, '2026-07-17T21:19:18.563Z', '2026-07-17T21:19:18.563Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('301843f4-76b2-46dd-aee4-a0fdcf640668', 'b2516b32-ff82-4ed2-babf-5ea4d60a34f7', 5, 'Penalty', 'Penalty', NULL, '2026-07-17T21:19:18.564Z', '2026-07-17T21:19:18.564Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('3899f814-a01d-4326-a049-317c45249c5e', '8094c4b7-2603-4ab7-a9a7-f3e7e28aeae8', 1, 'Backfill', 'Backfill', NULL, '2026-07-17T21:19:18.572Z', '2026-07-17T21:19:18.572Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('9df976bf-3d6c-4751-9fc0-b60e2c577dd8', '8094c4b7-2603-4ab7-a9a7-f3e7e28aeae8', 2, 'Event', 'Event', NULL, '2026-07-17T21:19:18.572Z', '2026-07-17T21:19:18.572Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('589af8d8-1904-45c3-9479-d76f6e78bab4', '8094c4b7-2603-4ab7-a9a7-f3e7e28aeae8', 3, 'Manual', 'Manual', NULL, '2026-07-17T21:19:18.572Z', '2026-07-17T21:19:18.572Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('44d07e06-fa61-4b5f-9654-1d73dbce5f2c', '8094c4b7-2603-4ab7-a9a7-f3e7e28aeae8', 4, 'Scheduled', 'Scheduled', NULL, '2026-07-17T21:19:18.573Z', '2026-07-17T21:19:18.573Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('2ccaeda8-ff7a-4222-8856-c228f733d3e3', '612480cc-7423-48dc-8b86-f005b3d6112d', 1, 'Down', 'Down', NULL, '2026-07-17T21:19:18.567Z', '2026-07-17T21:19:18.567Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('3f20012c-5d4f-4eb8-9951-caec2663696e', '612480cc-7423-48dc-8b86-f005b3d6112d', 2, 'Flat', 'Flat', NULL, '2026-07-17T21:19:18.567Z', '2026-07-17T21:19:18.567Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityFieldValue" ("ID", "EntityFieldID", "Sequence", "Value", "Code", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5f5f3053-7d1e-405d-8c28-abfa3310fdf4', '612480cc-7423-48dc-8b86-f005b3d6112d', 3, 'Up', 'Up', NULL, '2026-07-17T21:19:18.567Z', '2026-07-17T21:19:18.567Z') ON CONFLICT ("ID") DO NOTHING;
-- EntityRelationship: 39 rows
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('24fff322-bb6e-4fd4-8f43-d4cf9eb24ff2', '0bc33b83-3ac7-4e09-a7c6-7768454fa868', 1, '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', TRUE, FALSE, 'One To Many         ', NULL, 'PreviousBandID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.752Z', '2026-07-17T21:19:18.752Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('b6e053db-f4f3-4860-8569-97861b4ed1a7', '0bc33b83-3ac7-4e09-a7c6-7768454fa868', 2, '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', TRUE, FALSE, 'One To Many         ', NULL, 'BandID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.752Z', '2026-07-17T21:19:18.752Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('9ec86627-4292-4fab-9724-e26b71e8c3e2', '0bc33b83-3ac7-4e09-a7c6-7768454fa868', 3, '7f52f45a-2a22-4cdb-adb2-9aac713a5ac2', TRUE, FALSE, 'One To Many         ', NULL, 'BandID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.752Z', '2026-07-17T21:19:18.752Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('d128be49-544b-4ac3-885a-6c49a763e792', '0bc33b83-3ac7-4e09-a7c6-7768454fa868', 4, '88f3e05a-97d6-480d-ad73-8243a0a155e2', TRUE, FALSE, 'One To Many         ', NULL, 'ToBandID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.752Z', '2026-07-17T21:19:18.752Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('2d02e1d6-bef5-4572-94be-274201ef1fbb', '0bc33b83-3ac7-4e09-a7c6-7768454fa868', 5, '88f3e05a-97d6-480d-ad73-8243a0a155e2', TRUE, FALSE, 'One To Many         ', NULL, 'FromBandID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.752Z', '2026-07-17T21:19:18.752Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('e160cf60-cb7f-4df0-97e0-57688447ca6d', '38248f34-2837-ef11-86d4-6045bdee16e6', 15, '5681aa78-18a8-41ef-974d-27cf8f54d818', TRUE, FALSE, 'One To Many         ', NULL, 'ActionID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.752Z', '2026-07-17T21:19:18.752Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('e266bed1-a50b-49ba-935d-c3a5d554e7cd', '395aba56-2927-4651-924c-869db1cfaebd', 1, '5681aa78-18a8-41ef-974d-27cf8f54d818', TRUE, FALSE, 'One To Many         ', NULL, 'TimeWindowID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.752Z', '2026-07-17T21:19:18.752Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('859d1a05-b994-4d5f-bfa7-8510d1263036', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 1, '4c50b6c8-6b44-49ba-bd29-e9aca1ae23d7', TRUE, FALSE, 'One To Many         ', NULL, 'ScoreID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.753Z', '2026-07-17T21:19:18.753Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('6ed26c59-0cdf-43a6-b4bb-c62a33eb591b', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 1, '7f52f45a-2a22-4cdb-adb2-9aac713a5ac2', TRUE, FALSE, 'One To Many         ', NULL, 'ScoreModelID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.753Z', '2026-07-17T21:19:18.753Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('72c70ca9-ac6c-4405-a65f-84babc67ca9a', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 2, 'b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', TRUE, FALSE, 'One To Many         ', NULL, 'ScoreModelID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.753Z', '2026-07-17T21:19:18.753Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('ec5fe235-45ba-4928-9011-7eef6ae2e4b6', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 3, '799802fa-c709-46dd-a8fc-86024fae149a', TRUE, FALSE, 'One To Many         ', NULL, 'ScoreModelID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.753Z', '2026-07-17T21:19:18.753Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('4a271dd3-d43a-42c5-9b8b-16bd7f9bdb91', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 4, '88f3e05a-97d6-480d-ad73-8243a0a155e2', TRUE, FALSE, 'One To Many         ', NULL, 'ScoreModelID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.753Z', '2026-07-17T21:19:18.753Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('d723943e-859b-4c34-926d-66bbe8ef49a3', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 5, 'febf5f19-11c1-457a-be6a-fa5788c9664f', TRUE, FALSE, 'One To Many         ', NULL, 'ScoreModelID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.754Z', '2026-07-17T21:19:18.754Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('5ce1a56a-4b44-42b2-add7-05caa5d4fc32', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 6, '5681aa78-18a8-41ef-974d-27cf8f54d818', TRUE, FALSE, 'One To Many         ', NULL, 'ScoreModelID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.754Z', '2026-07-17T21:19:18.754Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('3dbbb578-fa88-49aa-ad60-2db4c352b4f7', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 7, '5681aa78-18a8-41ef-974d-27cf8f54d818', TRUE, FALSE, 'One To Many         ', NULL, 'SourceScoreModelID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.754Z', '2026-07-17T21:19:18.754Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('84bb0754-3a9e-428b-a500-e111d90996c7', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 8, '85e49c38-32df-4340-84fe-6cae307c424f', TRUE, FALSE, 'One To Many         ', NULL, 'ScoreModelID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.754Z', '2026-07-17T21:19:18.754Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('81afb95a-5fec-4ce1-9ae9-345e0a788e3f', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 9, '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', TRUE, FALSE, 'One To Many         ', NULL, 'ScoreModelID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.754Z', '2026-07-17T21:19:18.754Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('30c06c1a-0a4e-4438-b975-b048b6d9a447', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 10, '625c01e7-4dcc-40b8-b7b5-42d6a04757ca', TRUE, FALSE, 'One To Many         ', NULL, 'ScoreModelID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.754Z', '2026-07-17T21:19:18.754Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('b60c2e19-d888-4324-ac30-60883bd4fc66', '5681aa78-18a8-41ef-974d-27cf8f54d818', 1, '85e49c38-32df-4340-84fe-6cae307c424f', TRUE, FALSE, 'One To Many         ', NULL, 'FactorID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.755Z', '2026-07-17T21:19:18.755Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('9e18f010-b33f-4ded-9639-4038cfcc7371', '5681aa78-18a8-41ef-974d-27cf8f54d818', 2, '4c50b6c8-6b44-49ba-bd29-e9aca1ae23d7', TRUE, FALSE, 'One To Many         ', NULL, 'FactorID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.755Z', '2026-07-17T21:19:18.755Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('6e6db785-f430-4a5a-a8b5-4fbad51b8492', '799802fa-c709-46dd-a8fc-86024fae149a', 1, '88f3e05a-97d6-480d-ad73-8243a0a155e2', TRUE, FALSE, 'One To Many         ', NULL, 'RecomputeRunID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.755Z', '2026-07-17T21:19:18.755Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('33a6c1f0-eead-4da4-afd8-f1f1abd39211', '85e49c38-32df-4340-84fe-6cae307c424f', 1, '4c50b6c8-6b44-49ba-bd29-e9aca1ae23d7', TRUE, FALSE, 'One To Many         ', NULL, 'ModelFactorID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.755Z', '2026-07-17T21:19:18.755Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('f3890df4-2483-4040-ae1b-f6fcabbff812', 'a04276fd-7619-4652-9f81-5e77d576cd05', 1, '0bc33b83-3ac7-4e09-a7c6-7768454fa868', TRUE, FALSE, 'One To Many         ', NULL, 'BandSetID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.755Z', '2026-07-17T21:19:18.755Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('e7aacf53-e6fd-4023-a497-cc1e37abd50f', 'a04276fd-7619-4652-9f81-5e77d576cd05', 2, '4b11c1e2-0840-4473-91dd-659e5fd11ccd', TRUE, FALSE, 'One To Many         ', NULL, 'BandSetID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.756Z', '2026-07-17T21:19:18.756Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('fecea436-6ac4-4fff-a545-f7119510bc04', 'b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', 1, '7f52f45a-2a22-4cdb-adb2-9aac713a5ac2', TRUE, FALSE, 'One To Many         ', NULL, 'ScoreModelVersionID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.756Z', '2026-07-17T21:19:18.756Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('b2c40f9b-8338-4465-9f80-9f00cf57ade6', 'b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', 2, '4b11c1e2-0840-4473-91dd-659e5fd11ccd', TRUE, FALSE, 'One To Many         ', NULL, 'CurrentVersionID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.756Z', '2026-07-17T21:19:18.756Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('86e1878f-42ec-4e5f-a7f3-0c94e1de8625', 'b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', 3, '799802fa-c709-46dd-a8fc-86024fae149a', TRUE, FALSE, 'One To Many         ', NULL, 'ScoreModelVersionID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.756Z', '2026-07-17T21:19:18.756Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('45157d68-1471-4047-af78-c645ba9c50de', 'b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', 4, '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', TRUE, FALSE, 'One To Many         ', NULL, 'ScoreModelVersionID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.756Z', '2026-07-17T21:19:18.756Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('b20bcf5e-7a26-4fe9-b87a-b0a779904802', 'e0238f34-2837-ef11-86d4-6045bdee16e6', 72, 'a04276fd-7619-4652-9f81-5e77d576cd05', TRUE, FALSE, 'One To Many         ', NULL, 'AnchorEntityID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.757Z', '2026-07-17T21:19:18.757Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('b254f9ac-d266-47ba-b0ee-f13ee226da33', 'e0238f34-2837-ef11-86d4-6045bdee16e6', 73, '4b11c1e2-0840-4473-91dd-659e5fd11ccd', TRUE, FALSE, 'One To Many         ', NULL, 'AnchorEntityID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.757Z', '2026-07-17T21:19:18.757Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('ba1bec64-299e-4917-bfd7-f2ed73f6118d', 'e0238f34-2837-ef11-86d4-6045bdee16e6', 74, 'febf5f19-11c1-457a-be6a-fa5788c9664f', TRUE, FALSE, 'One To Many         ', NULL, 'RelatedEntityID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.757Z', '2026-07-17T21:19:18.757Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('e564fba2-b1aa-498f-9995-f3f99f5d07ba', 'e0238f34-2837-ef11-86d4-6045bdee16e6', 75, '5681aa78-18a8-41ef-974d-27cf8f54d818', TRUE, FALSE, 'One To Many         ', NULL, 'AnchorEntityID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.757Z', '2026-07-17T21:19:18.757Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('cba236d2-5b1e-4bea-9c62-48a11480777c', 'e0238f34-2837-ef11-86d4-6045bdee16e6', 76, '5681aa78-18a8-41ef-974d-27cf8f54d818', TRUE, FALSE, 'One To Many         ', NULL, 'SourceEntityID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.757Z', '2026-07-17T21:19:18.757Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('a9f0c36f-5b3b-4b27-9f16-e263cb33c8c2', 'e0238f34-2837-ef11-86d4-6045bdee16e6', 77, '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', TRUE, FALSE, 'One To Many         ', NULL, 'AnchorEntityID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.757Z', '2026-07-17T21:19:18.757Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('504e290b-1d67-4a50-946e-7ab684a8e338', 'e0238f34-2837-ef11-86d4-6045bdee16e6', 78, '7f52f45a-2a22-4cdb-adb2-9aac713a5ac2', TRUE, FALSE, 'One To Many         ', NULL, 'AnchorEntityID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.758Z', '2026-07-17T21:19:18.758Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('65f94acc-c6d9-45f0-84ed-e387263183d2', 'e1238f34-2837-ef11-86d4-6045bdee16e6', 110, 'b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', TRUE, FALSE, 'One To Many         ', NULL, 'PublishedByUserID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.758Z', '2026-07-17T21:19:18.758Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('baee5668-752e-4dd2-9c24-5b3dda9dc5b8', 'e1238f34-2837-ef11-86d4-6045bdee16e6', 111, '4b11c1e2-0840-4473-91dd-659e5fd11ccd', TRUE, FALSE, 'One To Many         ', NULL, 'OwnerUserID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.758Z', '2026-07-17T21:19:18.758Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('be0c716d-bb6d-414b-821e-175276b136cf', 'e1238f34-2837-ef11-86d4-6045bdee16e6', 112, '625c01e7-4dcc-40b8-b7b5-42d6a04757ca', TRUE, FALSE, 'One To Many         ', NULL, 'ChangedByUserID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.758Z', '2026-07-17T21:19:18.758Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityRelationship" ("ID", "EntityID", "Sequence", "RelatedEntityID", "BundleInAPI", "IncludeInParentAllQuery", "Type", "EntityKeyField", "RelatedEntityJoinField", "JoinView", "JoinEntityJoinField", "JoinEntityInverseJoinField", "DisplayInForm", "DisplayLocation", "DisplayName", "DisplayIconType", "DisplayIcon", "DisplayUserViewID", "DisplayComponentID", "DisplayComponentConfiguration", "__mj_CreatedAt", "__mj_UpdatedAt", "AutoUpdateFromSchema", "AdditionalFieldsToInclude", "AutoUpdateAdditionalFieldsToInclude") VALUES ('59cba17b-e04c-47fd-9d48-6985bf2f1f27', 'febf5f19-11c1-457a-be6a-fa5788c9664f', 1, '5681aa78-18a8-41ef-974d-27cf8f54d818', TRUE, FALSE, 'One To Many         ', NULL, 'SourceRelatedEntityID', NULL, NULL, NULL, TRUE, 'After Field Tabs', NULL, 'Related Entity Icon', NULL, NULL, NULL, NULL, '2026-07-17T21:19:18.758Z', '2026-07-17T21:19:18.758Z', TRUE, NULL, TRUE) ON CONFLICT ("ID") DO NOTHING;
-- EntityPermission: 42 rows
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('2dfc7341-7d16-46e7-944a-721a6b68e1d8', 'a04276fd-7619-4652-9f81-5e77d576cd05', 'e0afccec-6a37-ef11-86d4-000d3a4e707e', FALSE, TRUE, FALSE, FALSE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.964Z', '2026-07-17T21:18:07.964Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('734be5e7-3367-4882-859b-1efac481bfca', 'a04276fd-7619-4652-9f81-5e77d576cd05', 'deafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.965Z', '2026-07-17T21:18:07.965Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('f8157c55-1f94-46c5-af64-c4508ba5028e', 'a04276fd-7619-4652-9f81-5e77d576cd05', 'dfafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.966Z', '2026-07-17T21:18:07.966Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('785746ab-0d86-45a2-83b8-c25133f13d38', '0bc33b83-3ac7-4e09-a7c6-7768454fa868', 'e0afccec-6a37-ef11-86d4-000d3a4e707e', FALSE, TRUE, FALSE, FALSE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.971Z', '2026-07-17T21:18:07.971Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('6c44bade-f482-43de-976a-a43a6a06609d', '0bc33b83-3ac7-4e09-a7c6-7768454fa868', 'deafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.972Z', '2026-07-17T21:18:07.972Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('4cb7fc27-b8be-4246-8451-129d79def5f9', '0bc33b83-3ac7-4e09-a7c6-7768454fa868', 'dfafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.973Z', '2026-07-17T21:18:07.973Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('a1c19d4f-3efc-4f3e-9a38-7b1eb8fbf528', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 'e0afccec-6a37-ef11-86d4-000d3a4e707e', FALSE, TRUE, FALSE, FALSE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.977Z', '2026-07-17T21:18:07.977Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('24b72108-d06c-4776-95e7-a0585aceb7ab', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 'deafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.978Z', '2026-07-17T21:18:07.978Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('1c52ef49-cdc6-4c43-a528-706fc5d384dc', '4b11c1e2-0840-4473-91dd-659e5fd11ccd', 'dfafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.979Z', '2026-07-17T21:18:07.979Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('6e9b1f9b-992b-4a56-babc-123b873dd3cb', 'b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', 'e0afccec-6a37-ef11-86d4-000d3a4e707e', FALSE, TRUE, FALSE, FALSE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.982Z', '2026-07-17T21:18:07.982Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('a8691258-0fb0-4a81-bd74-54e3cf0bb302', 'b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', 'deafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.982Z', '2026-07-17T21:18:07.982Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('166231d0-7b86-4ceb-b136-088e928583bb', 'b5e18cb9-99e0-4cc7-8d7d-22379f096fe9', 'dfafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.983Z', '2026-07-17T21:18:07.983Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('4132bffa-f03e-494f-941b-9ff192e4d4b3', 'febf5f19-11c1-457a-be6a-fa5788c9664f', 'e0afccec-6a37-ef11-86d4-000d3a4e707e', FALSE, TRUE, FALSE, FALSE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.986Z', '2026-07-17T21:18:07.986Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('452887c1-508f-49a7-9ca6-8c9063d16468', 'febf5f19-11c1-457a-be6a-fa5788c9664f', 'deafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.986Z', '2026-07-17T21:18:07.986Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('672599f8-b850-4c02-8fed-2c23202b60ac', 'febf5f19-11c1-457a-be6a-fa5788c9664f', 'dfafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.986Z', '2026-07-17T21:18:07.986Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('3165f27b-f62a-4722-af93-dcad13bd30de', '5681aa78-18a8-41ef-974d-27cf8f54d818', 'e0afccec-6a37-ef11-86d4-000d3a4e707e', FALSE, TRUE, FALSE, FALSE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.989Z', '2026-07-17T21:18:07.989Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('818aef00-7fe0-4aba-9d3c-240101c52d04', '5681aa78-18a8-41ef-974d-27cf8f54d818', 'deafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.989Z', '2026-07-17T21:18:07.989Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('3b3b4d6d-6905-4e5a-a3f0-0f536f0e8914', '5681aa78-18a8-41ef-974d-27cf8f54d818', 'dfafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.989Z', '2026-07-17T21:18:07.989Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('3fd2464e-81ca-46d9-943f-2e8515b3fe1b', '395aba56-2927-4651-924c-869db1cfaebd', 'e0afccec-6a37-ef11-86d4-000d3a4e707e', FALSE, TRUE, FALSE, FALSE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.992Z', '2026-07-17T21:18:07.992Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('8d20c5f1-5727-4ccc-9f28-92a7fee846a0', '395aba56-2927-4651-924c-869db1cfaebd', 'deafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.992Z', '2026-07-17T21:18:07.992Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('6ca6db72-1f05-4fa2-943c-7020e83e8c06', '395aba56-2927-4651-924c-869db1cfaebd', 'dfafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.992Z', '2026-07-17T21:18:07.992Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('ee60e3ee-e99c-4ae3-a0ea-482fecab4ea5', '85e49c38-32df-4340-84fe-6cae307c424f', 'e0afccec-6a37-ef11-86d4-000d3a4e707e', FALSE, TRUE, FALSE, FALSE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.994Z', '2026-07-17T21:18:07.994Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('36bed605-0682-455a-869a-ced5438ff349', '85e49c38-32df-4340-84fe-6cae307c424f', 'deafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.994Z', '2026-07-17T21:18:07.994Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('9035fc66-e832-49df-aad0-a527cad784fb', '85e49c38-32df-4340-84fe-6cae307c424f', 'dfafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.995Z', '2026-07-17T21:18:07.995Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('5d0468b5-06fd-4798-b9e5-4321bf2802f0', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 'e0afccec-6a37-ef11-86d4-000d3a4e707e', FALSE, TRUE, FALSE, FALSE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.996Z', '2026-07-17T21:18:07.996Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('615c43c6-4faf-453a-9250-02882a94daf5', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 'deafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.997Z', '2026-07-17T21:18:07.997Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('13b88416-a5b0-4bab-aeba-7dbe2d7cc4f4', '47138f1f-e3a2-4c5f-9b02-0424f4bb9042', 'dfafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.997Z', '2026-07-17T21:18:07.997Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('31100f04-565d-4d1e-b9e7-825b3d40df1b', '4c50b6c8-6b44-49ba-bd29-e9aca1ae23d7', 'e0afccec-6a37-ef11-86d4-000d3a4e707e', FALSE, TRUE, FALSE, FALSE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.999Z', '2026-07-17T21:18:07.999Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('a1f73b12-0bf9-4bf4-bb12-ec06358f13b2', '4c50b6c8-6b44-49ba-bd29-e9aca1ae23d7', 'deafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:07.999Z', '2026-07-17T21:18:07.999Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('91a92593-a9e5-40c0-90df-55dc862e4aa9', '4c50b6c8-6b44-49ba-bd29-e9aca1ae23d7', 'dfafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:08.000Z', '2026-07-17T21:18:08.000Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('5d3be1ce-e4e7-4fe6-a31a-0f8cc3b15a55', '7f52f45a-2a22-4cdb-adb2-9aac713a5ac2', 'e0afccec-6a37-ef11-86d4-000d3a4e707e', FALSE, TRUE, FALSE, FALSE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:08.002Z', '2026-07-17T21:18:08.002Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('7161d8e8-f636-46fd-81ab-58e88f4396d3', '7f52f45a-2a22-4cdb-adb2-9aac713a5ac2', 'deafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:08.002Z', '2026-07-17T21:18:08.002Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('33ee9ead-5bbe-4048-a3df-ebeca95d99d1', '7f52f45a-2a22-4cdb-adb2-9aac713a5ac2', 'dfafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:08.002Z', '2026-07-17T21:18:08.002Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('84555a3b-dfc1-48e8-9149-ed737412b758', '799802fa-c709-46dd-a8fc-86024fae149a', 'e0afccec-6a37-ef11-86d4-000d3a4e707e', FALSE, TRUE, FALSE, FALSE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:08.004Z', '2026-07-17T21:18:08.004Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('31d4190d-f7e7-4f02-937b-97d21fa010e4', '799802fa-c709-46dd-a8fc-86024fae149a', 'deafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:08.004Z', '2026-07-17T21:18:08.004Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('56bfacef-dad4-4c05-98da-e05b49e394a3', '799802fa-c709-46dd-a8fc-86024fae149a', 'dfafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:08.005Z', '2026-07-17T21:18:08.005Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('ba1a00ee-57fb-408f-a1d9-7218f32ea8d9', '88f3e05a-97d6-480d-ad73-8243a0a155e2', 'e0afccec-6a37-ef11-86d4-000d3a4e707e', FALSE, TRUE, FALSE, FALSE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:08.006Z', '2026-07-17T21:18:08.006Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('89eaef85-535f-4cb1-9346-f7b0be9eddc9', '88f3e05a-97d6-480d-ad73-8243a0a155e2', 'deafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:08.007Z', '2026-07-17T21:18:08.007Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('87ee6b79-e951-4558-97fd-67e895bed6fb', '88f3e05a-97d6-480d-ad73-8243a0a155e2', 'dfafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:08.007Z', '2026-07-17T21:18:08.007Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('6625a318-e4ed-4efc-8b11-db416fa65671', '625c01e7-4dcc-40b8-b7b5-42d6a04757ca', 'e0afccec-6a37-ef11-86d4-000d3a4e707e', FALSE, TRUE, FALSE, FALSE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:08.009Z', '2026-07-17T21:18:08.009Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('b3577156-60b5-42c2-bb55-00e6fdfeb80c', '625c01e7-4dcc-40b8-b7b5-42d6a04757ca', 'deafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:08.009Z', '2026-07-17T21:18:08.009Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."EntityPermission" ("ID", "EntityID", "RoleID", "CanCreate", "CanRead", "CanUpdate", "CanDelete", "ReadRLSFilterID", "CreateRLSFilterID", "UpdateRLSFilterID", "DeleteRLSFilterID", "__mj_CreatedAt", "__mj_UpdatedAt", "Type") VALUES ('fa382956-31d6-4fbf-a7c1-e0d728d158fe', '625c01e7-4dcc-40b8-b7b5-42d6a04757ca', 'dfafccec-6a37-ef11-86d4-000d3a4e707e', TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, '2026-07-17T21:18:08.009Z', '2026-07-17T21:18:08.009Z', 'Allow') ON CONFLICT ("ID") DO NOTHING;
-- Application: 1 rows
INSERT INTO __mj."Application" ("ID", "Name", "Description", "Icon", "DefaultForNewUser", "__mj_CreatedAt", "__mj_UpdatedAt", "SchemaAutoAddNewEntities", "Color", "DefaultNavItems", "ClassName", "DefaultSequence", "Status", "NavigationStyle", "TopNavLocation", "HideNavBarIconWhenActive", "Path", "AutoUpdatePath", "AgentSettings") VALUES ('4f9477fb-bc8b-4ca9-a4fe-c0fb45496285', 'BizAppSonar', 'Configurable engagement scoring — models, factors, and explainable scores.', 'fa-solid fa-wave-square', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL, '#6366F1', '[
  {
    "Label": "Overview",
    "Icon": "fa-solid fa-wave-square",
    "ResourceType": "Custom",
    "DriverClass": "SonarOverviewResource",
    "isDefault": true
  },
  {
    "Label": "Models",
    "Icon": "fa-solid fa-sliders",
    "ResourceType": "Custom",
    "DriverClass": "SonarModelBuilderResource",
    "isDefault": false
  },
  {
    "Label": "Signals",
    "Icon": "fa-solid fa-hammer",
    "ResourceType": "Custom",
    "DriverClass": "SonarSignalStudioResource",
    "isDefault": false
  },
  {
    "Label": "Engagement",
    "Icon": "fa-solid fa-chart-line",
    "ResourceType": "Custom",
    "DriverClass": "SonarEngagementManagerResource",
    "isDefault": false
  },
  {
    "Label": "Admin",
    "Icon": "fa-solid fa-gauge-high",
    "ResourceType": "Custom",
    "DriverClass": "SonarAdminOpsResource",
    "isDefault": false
  }
]', NULL, 2000, 'Active', 'App Switcher', NULL, FALSE, 'bizappsonar', TRUE, NULL) ON CONFLICT ("ID") DO NOTHING;
-- ApplicationEntity: 0 rows
-- Action: 23 rows
INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "UserPrompt", "UserComments", "Code", "CodeComments", "CodeApprovalStatus", "CodeApprovalComments", "CodeApprovedByUserID", "CodeApprovedAt", "CodeLocked", "ForceCodeGeneration", "RetentionPeriod", "Status", "__mj_CreatedAt", "__mj_UpdatedAt", "DriverClass", "ParentID", "IconClass", "DefaultCompactPromptID", "Config", "RuntimeActionConfiguration", "MaxExecutionTimeMS", "CreatedByAgentID") VALUES ('5044a100-0001-4000-8000-000000000001', '0dc7433e-f36b-1410-8db6-00021f8b792e', 'Sonar: Preview Model', 'Computes engagement scores for a Sonar model WITHOUT persisting them and returns a band distribution + a sample-member breakdown. Read-only; safe on a draft model. Backs the Model Builder live preview / Simulate.', 'Custom', NULL, NULL, NULL, NULL, 'Pending', NULL, NULL, NULL, FALSE, FALSE, NULL, 'Active', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', 'SonarPreviewModel', NULL, 'fa-solid fa-wave-square', NULL, NULL, NULL, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "UserPrompt", "UserComments", "Code", "CodeComments", "CodeApprovalStatus", "CodeApprovalComments", "CodeApprovedByUserID", "CodeApprovedAt", "CodeLocked", "ForceCodeGeneration", "RetentionPeriod", "Status", "__mj_CreatedAt", "__mj_UpdatedAt", "DriverClass", "ParentID", "IconClass", "DefaultCompactPromptID", "Config", "RuntimeActionConfiguration", "MaxExecutionTimeMS", "CreatedByAgentID") VALUES ('5044a100-0002-4000-8000-000000000002', '0dc7433e-f36b-1410-8db6-00021f8b792e', 'Sonar: Recompute Model', 'Computes AND persists a full scoring run for a Sonar model (records a ScoreRecomputeRun, upserts Scores + contributions). Requires a published model (a Score must reference the version that produced it).', 'Custom', NULL, NULL, NULL, NULL, 'Pending', NULL, NULL, NULL, FALSE, FALSE, NULL, 'Active', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', 'SonarRecomputeModel', NULL, 'fa-solid fa-rotate', NULL, NULL, NULL, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "UserPrompt", "UserComments", "Code", "CodeComments", "CodeApprovalStatus", "CodeApprovalComments", "CodeApprovedByUserID", "CodeApprovedAt", "CodeLocked", "ForceCodeGeneration", "RetentionPeriod", "Status", "__mj_CreatedAt", "__mj_UpdatedAt", "DriverClass", "ParentID", "IconClass", "DefaultCompactPromptID", "Config", "RuntimeActionConfiguration", "MaxExecutionTimeMS", "CreatedByAgentID") VALUES ('5044a100-0003-4000-8000-000000000003', '0dc7433e-f36b-1410-8db6-00021f8b792e', 'Sonar: Validate Factor', 'Evaluates an unsaved draft declarative factor over the live population WITHOUT persisting, returning a representative member''s raw value + normalized strength. Backs the Factor Builder live preview; read-only, safe on a draft model.', 'Custom', NULL, NULL, NULL, NULL, 'Pending', NULL, NULL, NULL, FALSE, FALSE, NULL, 'Active', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', 'SonarValidateFactor', NULL, 'fa-solid fa-flask', NULL, NULL, NULL, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "UserPrompt", "UserComments", "Code", "CodeComments", "CodeApprovalStatus", "CodeApprovalComments", "CodeApprovedByUserID", "CodeApprovedAt", "CodeLocked", "ForceCodeGeneration", "RetentionPeriod", "Status", "__mj_CreatedAt", "__mj_UpdatedAt", "DriverClass", "ParentID", "IconClass", "DefaultCompactPromptID", "Config", "RuntimeActionConfiguration", "MaxExecutionTimeMS", "CreatedByAgentID") VALUES ('5044a100-0005-4000-8000-000000000005', '0dc7433e-f36b-1410-8db6-00021f8b792e', 'Sonar: List Factor Actions', 'Returns the catalog of factor-actions (MJ Actions following the Sonar factor contract) with each action''s self-described contract — what it measures, the entities it reads, its output meaning, and cost profile — plus its configurable params. Backs the Model Builder ''custom signal'' picker. Read-only.', 'Custom', NULL, NULL, NULL, NULL, 'Pending', NULL, NULL, NULL, FALSE, FALSE, NULL, 'Active', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', 'SonarListFactorActions', NULL, 'fa-solid fa-list-check', NULL, NULL, NULL, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "UserPrompt", "UserComments", "Code", "CodeComments", "CodeApprovalStatus", "CodeApprovalComments", "CodeApprovedByUserID", "CodeApprovedAt", "CodeLocked", "ForceCodeGeneration", "RetentionPeriod", "Status", "__mj_CreatedAt", "__mj_UpdatedAt", "DriverClass", "ParentID", "IconClass", "DefaultCompactPromptID", "Config", "RuntimeActionConfiguration", "MaxExecutionTimeMS", "CreatedByAgentID") VALUES ('5044a100-0008-4000-8000-000000000008', '0dc7433e-f36b-1410-8db6-00021f8b792e', 'Sonar: Create Factor', 'Creates a declarative factor and binds it into a model''s rubric (Model Factor). First write tool of the agentic authoring surface; action-backed factors are authored via Codesmith, not here.', 'Custom', NULL, NULL, NULL, NULL, 'Pending', NULL, NULL, NULL, FALSE, FALSE, NULL, 'Active', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', 'SonarCreateFactor', NULL, 'fa-solid fa-wave-square', NULL, NULL, NULL, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "UserPrompt", "UserComments", "Code", "CodeComments", "CodeApprovalStatus", "CodeApprovalComments", "CodeApprovedByUserID", "CodeApprovedAt", "CodeLocked", "ForceCodeGeneration", "RetentionPeriod", "Status", "__mj_CreatedAt", "__mj_UpdatedAt", "DriverClass", "ParentID", "IconClass", "DefaultCompactPromptID", "Config", "RuntimeActionConfiguration", "MaxExecutionTimeMS", "CreatedByAgentID") VALUES ('5044a100-0009-4000-8000-000000000009', '0dc7433e-f36b-1410-8db6-00021f8b792e', 'Sonar: Add Data Source', 'Wires a related entity into a model as a data source (Model Related Entity, Left join). Agentic authoring tool surface.', 'Custom', NULL, NULL, NULL, NULL, 'Pending', NULL, NULL, NULL, FALSE, FALSE, NULL, 'Active', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', 'SonarAddDataSource', NULL, 'fa-solid fa-diagram-project', NULL, NULL, NULL, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "UserPrompt", "UserComments", "Code", "CodeComments", "CodeApprovalStatus", "CodeApprovalComments", "CodeApprovedByUserID", "CodeApprovedAt", "CodeLocked", "ForceCodeGeneration", "RetentionPeriod", "Status", "__mj_CreatedAt", "__mj_UpdatedAt", "DriverClass", "ParentID", "IconClass", "DefaultCompactPromptID", "Config", "RuntimeActionConfiguration", "MaxExecutionTimeMS", "CreatedByAgentID") VALUES ('5044a100-000a-4000-8000-00000000000a', '0dc7433e-f36b-1410-8db6-00021f8b792e', 'Sonar: Create Model', 'Creates a draft ScoreModel (name + anchor entity). Draft by design; publishing is a separate, gated step. Agentic authoring tool surface.', 'Custom', NULL, NULL, NULL, NULL, 'Pending', NULL, NULL, NULL, FALSE, FALSE, NULL, 'Active', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', 'SonarCreateModel', NULL, 'fa-solid fa-sliders', NULL, NULL, NULL, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "UserPrompt", "UserComments", "Code", "CodeComments", "CodeApprovalStatus", "CodeApprovalComments", "CodeApprovedByUserID", "CodeApprovedAt", "CodeLocked", "ForceCodeGeneration", "RetentionPeriod", "Status", "__mj_CreatedAt", "__mj_UpdatedAt", "DriverClass", "ParentID", "IconClass", "DefaultCompactPromptID", "Config", "RuntimeActionConfiguration", "MaxExecutionTimeMS", "CreatedByAgentID") VALUES ('5044a100-000b-4000-8000-00000000000b', '0dc7433e-f36b-1410-8db6-00021f8b792e', 'Sonar: Set Band Set', 'Points a model at an existing Score Band Set (ScoreModel.BandSetID) so it becomes scoreable. Agentic authoring tool surface.', 'Custom', NULL, NULL, NULL, NULL, 'Pending', NULL, NULL, NULL, FALSE, FALSE, NULL, 'Active', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', 'SonarSetBandSet', NULL, 'fa-solid fa-layer-group', NULL, NULL, NULL, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "UserPrompt", "UserComments", "Code", "CodeComments", "CodeApprovalStatus", "CodeApprovalComments", "CodeApprovedByUserID", "CodeApprovedAt", "CodeLocked", "ForceCodeGeneration", "RetentionPeriod", "Status", "__mj_CreatedAt", "__mj_UpdatedAt", "DriverClass", "ParentID", "IconClass", "DefaultCompactPromptID", "Config", "RuntimeActionConfiguration", "MaxExecutionTimeMS", "CreatedByAgentID") VALUES ('5044a100-000c-4000-8000-000000000008', '0dc7433e-f36b-1410-8db6-00021f8b792e', 'Sonar: Get Prompt', 'Reads an MJ AIPrompt''s editable text (resolved via name → template → active template content) for the factor builder''s prompt panel. Returns the text plus the ids the editor needs to save back. Read-only.', 'Custom', NULL, NULL, NULL, NULL, 'Pending', NULL, NULL, NULL, FALSE, FALSE, NULL, 'Active', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', 'SonarGetPrompt', NULL, 'fa-solid fa-file-lines', NULL, NULL, NULL, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "UserPrompt", "UserComments", "Code", "CodeComments", "CodeApprovalStatus", "CodeApprovalComments", "CodeApprovedByUserID", "CodeApprovedAt", "CodeLocked", "ForceCodeGeneration", "RetentionPeriod", "Status", "__mj_CreatedAt", "__mj_UpdatedAt", "DriverClass", "ParentID", "IconClass", "DefaultCompactPromptID", "Config", "RuntimeActionConfiguration", "MaxExecutionTimeMS", "CreatedByAgentID") VALUES ('5044a100-000d-4000-8000-000000000009', '0dc7433e-f36b-1410-8db6-00021f8b792e', 'Sonar: Update Prompt', 'Saves edited LLM prompt text from the factor builder onto the AIPrompt''s TemplateContent row (by TemplateContentID from Sonar: Get Prompt). NOTE: an AIPrompt is shared — editing affects every factor/use that references it.', 'Custom', NULL, NULL, NULL, NULL, 'Pending', NULL, NULL, NULL, FALSE, FALSE, NULL, 'Active', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', 'SonarUpdatePrompt', NULL, 'fa-solid fa-floppy-disk', NULL, NULL, NULL, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "UserPrompt", "UserComments", "Code", "CodeComments", "CodeApprovalStatus", "CodeApprovalComments", "CodeApprovedByUserID", "CodeApprovedAt", "CodeLocked", "ForceCodeGeneration", "RetentionPeriod", "Status", "__mj_CreatedAt", "__mj_UpdatedAt", "DriverClass", "ParentID", "IconClass", "DefaultCompactPromptID", "Config", "RuntimeActionConfiguration", "MaxExecutionTimeMS", "CreatedByAgentID") VALUES ('5044a100-000e-4000-8000-00000000000e', '0dc7433e-f36b-1410-8db6-00021f8b792e', 'Sonar: Run Authoring Agent', 'Runs the Sonar Authoring Agent (Loop) server-side via AgentRunner and returns its reply. The seam the Assistant panel calls so the agent runs in MJAPI (where model/LLM/tools live), bypassing the client-side conversation stack. Produces drafts only.', 'Custom', NULL, NULL, NULL, NULL, 'Pending', NULL, NULL, NULL, FALSE, FALSE, NULL, 'Active', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', 'SonarRunAuthoringAgent', NULL, 'fa-solid fa-wand-magic-sparkles', NULL, NULL, NULL, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "UserPrompt", "UserComments", "Code", "CodeComments", "CodeApprovalStatus", "CodeApprovalComments", "CodeApprovedByUserID", "CodeApprovedAt", "CodeLocked", "ForceCodeGeneration", "RetentionPeriod", "Status", "__mj_CreatedAt", "__mj_UpdatedAt", "DriverClass", "ParentID", "IconClass", "DefaultCompactPromptID", "Config", "RuntimeActionConfiguration", "MaxExecutionTimeMS", "CreatedByAgentID") VALUES ('5044a100-000f-4000-8000-00000000000f', '0dc7433e-f36b-1410-8db6-00021f8b792e', 'Sonar: Build Model', 'Builds a COMPLETE draft model (model + sources + factors + band set) from one spec in a single call — factors reference sources by alias; the action threads the IDs. Use this for building a new model; the granular tools (Create Factor / Add Data Source) are for incremental edits. Draft only.', 'Custom', NULL, NULL, NULL, NULL, 'Pending', NULL, NULL, NULL, FALSE, FALSE, NULL, 'Active', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', 'SonarBuildModel', NULL, 'fa-solid fa-cubes', NULL, NULL, NULL, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "UserPrompt", "UserComments", "Code", "CodeComments", "CodeApprovalStatus", "CodeApprovalComments", "CodeApprovedByUserID", "CodeApprovedAt", "CodeLocked", "ForceCodeGeneration", "RetentionPeriod", "Status", "__mj_CreatedAt", "__mj_UpdatedAt", "DriverClass", "ParentID", "IconClass", "DefaultCompactPromptID", "Config", "RuntimeActionConfiguration", "MaxExecutionTimeMS", "CreatedByAgentID") VALUES ('5044a100-0010-4000-8000-000000000010', '0dc7433e-f36b-1410-8db6-00021f8b792e', 'Sonar: Describe Model', 'Reads an existing Sonar model (by ID or name) and returns its resolved config: anchor entity, data sources (alias + entity name), factors (with source alias, aggregation, normalization, weight), and band set. The authoring agent''s READ tool so it can answer questions about / suggest changes to a model it can otherwise only write to.', 'Custom', NULL, NULL, NULL, NULL, 'Pending', NULL, NULL, NULL, FALSE, FALSE, NULL, 'Active', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', 'SonarDescribeModel', NULL, 'fa-solid fa-magnifying-glass', NULL, NULL, NULL, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "UserPrompt", "UserComments", "Code", "CodeComments", "CodeApprovalStatus", "CodeApprovalComments", "CodeApprovedByUserID", "CodeApprovedAt", "CodeLocked", "ForceCodeGeneration", "RetentionPeriod", "Status", "__mj_CreatedAt", "__mj_UpdatedAt", "DriverClass", "ParentID", "IconClass", "DefaultCompactPromptID", "Config", "RuntimeActionConfiguration", "MaxExecutionTimeMS", "CreatedByAgentID") VALUES ('5044a100-0011-4000-8000-000000000011', '0dc7433e-f36b-1410-8db6-00021f8b792e', 'Sonar: List Related Entities', 'Given an anchor entity ID, returns the BUSINESS entities that reference it via a foreign key (the one-to-many data sources Sonar factors aggregate over, e.g. Members <- Event Registrations). Scoped to business schemas (excludes MJ core and the Sonar schema). The authoring agent''s READ tool for grounding factor/source suggestions in data that actually exists.', 'Custom', NULL, NULL, NULL, NULL, 'Pending', NULL, NULL, NULL, FALSE, FALSE, NULL, 'Active', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', 'SonarListRelatedEntities', NULL, 'fa-solid fa-diagram-project', NULL, NULL, NULL, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "UserPrompt", "UserComments", "Code", "CodeComments", "CodeApprovalStatus", "CodeApprovalComments", "CodeApprovedByUserID", "CodeApprovedAt", "CodeLocked", "ForceCodeGeneration", "RetentionPeriod", "Status", "__mj_CreatedAt", "__mj_UpdatedAt", "DriverClass", "ParentID", "IconClass", "DefaultCompactPromptID", "Config", "RuntimeActionConfiguration", "MaxExecutionTimeMS", "CreatedByAgentID") VALUES ('5044a100-0012-4000-8000-000000000012', '0dc7433e-f36b-1410-8db6-00021f8b792e', 'Sonar: Author Factor Action', 'The §5 escape hatch: when a signal can''t be a declarative factor (streaks, decay, sentiment, cross-source ratios), hands a Sonar factor-action brief + the description to the stock ActionSmith agent and returns the Runtime action it authored (CodeApprovalStatus=''Pending'', a human approves before it scores). ActionSmith is reused untouched.', 'Custom', NULL, NULL, NULL, NULL, 'Pending', NULL, NULL, NULL, FALSE, FALSE, NULL, 'Active', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', 'SonarAuthorFactorAction', NULL, 'fa-solid fa-hammer', NULL, NULL, NULL, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "UserPrompt", "UserComments", "Code", "CodeComments", "CodeApprovalStatus", "CodeApprovalComments", "CodeApprovedByUserID", "CodeApprovedAt", "CodeLocked", "ForceCodeGeneration", "RetentionPeriod", "Status", "__mj_CreatedAt", "__mj_UpdatedAt", "DriverClass", "ParentID", "IconClass", "DefaultCompactPromptID", "Config", "RuntimeActionConfiguration", "MaxExecutionTimeMS", "CreatedByAgentID") VALUES ('5044a100-0013-4000-8000-000000000013', '0dc7433e-f36b-1410-8db6-00021f8b792e', 'Sonar: Start Factor Job', 'Async kickoff behind the Signal Studio: fires ActionSmith on the Sonar factor brief WITHOUT awaiting it and returns the AgentRunID immediately (via onAgentRunCreated). The run continues server-side; the Studio observes it by polling AIAgentRun.Status. Enables batched, fire-and-forget factor authoring.', 'Custom', NULL, NULL, NULL, NULL, 'Pending', NULL, NULL, NULL, FALSE, FALSE, NULL, 'Active', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', 'SonarStartFactorJob', NULL, 'fa-solid fa-bolt', NULL, NULL, NULL, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "UserPrompt", "UserComments", "Code", "CodeComments", "CodeApprovalStatus", "CodeApprovalComments", "CodeApprovedByUserID", "CodeApprovedAt", "CodeLocked", "ForceCodeGeneration", "RetentionPeriod", "Status", "__mj_CreatedAt", "__mj_UpdatedAt", "DriverClass", "ParentID", "IconClass", "DefaultCompactPromptID", "Config", "RuntimeActionConfiguration", "MaxExecutionTimeMS", "CreatedByAgentID") VALUES ('5044a100-0014-4000-8000-000000000014', '0dc7433e-f36b-1410-8db6-00021f8b792e', 'Sonar: Refine Factor Action', 'AI ''improve this signal'' loop behind the Signal Studio: fires ActionSmith with the current code + the reviewer''s feedback (async, like the commission flow), then transplants the improved+self-tested code back onto the ORIGINAL signal (→ Pending for re-review) and disables the agent''s scratch row. The approval gate is never bypassed.', 'Custom', NULL, NULL, NULL, NULL, 'Pending', NULL, NULL, NULL, FALSE, FALSE, NULL, 'Active', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', 'SonarRefineFactorAction', NULL, 'fa-solid fa-wand-magic-sparkles', NULL, NULL, NULL, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "UserPrompt", "UserComments", "Code", "CodeComments", "CodeApprovalStatus", "CodeApprovalComments", "CodeApprovedByUserID", "CodeApprovedAt", "CodeLocked", "ForceCodeGeneration", "RetentionPeriod", "Status", "__mj_CreatedAt", "__mj_UpdatedAt", "DriverClass", "ParentID", "IconClass", "DefaultCompactPromptID", "Config", "RuntimeActionConfiguration", "MaxExecutionTimeMS", "CreatedByAgentID") VALUES ('5044a100-0015-4000-8000-000000000015', '0dc7433e-f36b-1410-8db6-00021f8b792e', 'Sonar: Unpublish Model', 'Moves a published model (Active/Paused) back to Draft so it can be edited. SAFE direction only — never publishes or activates. Lets the Authoring Agent unlock a model the user asked to edit instead of dead-ending on the lock.', 'Custom', NULL, NULL, NULL, NULL, 'Pending', NULL, NULL, NULL, FALSE, FALSE, NULL, 'Active', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', 'SonarUnpublishModel', NULL, 'fa-solid fa-lock-open', NULL, NULL, NULL, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "UserPrompt", "UserComments", "Code", "CodeComments", "CodeApprovalStatus", "CodeApprovalComments", "CodeApprovedByUserID", "CodeApprovedAt", "CodeLocked", "ForceCodeGeneration", "RetentionPeriod", "Status", "__mj_CreatedAt", "__mj_UpdatedAt", "DriverClass", "ParentID", "IconClass", "DefaultCompactPromptID", "Config", "RuntimeActionConfiguration", "MaxExecutionTimeMS", "CreatedByAgentID") VALUES ('5044a100-0016-4000-8000-000000000016', '0dc7433e-f36b-1410-8db6-00021f8b792e', 'Sonar: Find Entities', 'Resolves a business entity NAME to its ID (and lists candidate anchors), scoped to business schemas (MJ/Sonar system schemas hidden). Lets the Authoring Agent get an anchorEntityID for a new model instead of dead-ending on a raw UUID. Read-only.', 'Custom', NULL, NULL, NULL, NULL, 'Pending', NULL, NULL, NULL, FALSE, FALSE, NULL, 'Active', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', 'SonarFindEntities', NULL, 'fa-solid fa-magnifying-glass', NULL, NULL, NULL, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "UserPrompt", "UserComments", "Code", "CodeComments", "CodeApprovalStatus", "CodeApprovalComments", "CodeApprovedByUserID", "CodeApprovedAt", "CodeLocked", "ForceCodeGeneration", "RetentionPeriod", "Status", "__mj_CreatedAt", "__mj_UpdatedAt", "DriverClass", "ParentID", "IconClass", "DefaultCompactPromptID", "Config", "RuntimeActionConfiguration", "MaxExecutionTimeMS", "CreatedByAgentID") VALUES ('5044a100-0017-4000-8000-000000000017', '0dc7433e-f36b-1410-8db6-00021f8b792e', 'Sonar: Find Models', 'Resolves a score model by PARTIAL name (and lists existing models) → id/name/status/anchor. Lets the Authoring Agent fuzzy-match a vague model reference and enumerate models, instead of needing a near-exact name for Describe Model. Read-only.', 'Custom', NULL, NULL, NULL, NULL, 'Pending', NULL, NULL, NULL, FALSE, FALSE, NULL, 'Active', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', 'SonarFindModels', NULL, 'fa-solid fa-layer-group', NULL, NULL, NULL, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "UserPrompt", "UserComments", "Code", "CodeComments", "CodeApprovalStatus", "CodeApprovalComments", "CodeApprovedByUserID", "CodeApprovedAt", "CodeLocked", "ForceCodeGeneration", "RetentionPeriod", "Status", "__mj_CreatedAt", "__mj_UpdatedAt", "DriverClass", "ParentID", "IconClass", "DefaultCompactPromptID", "Config", "RuntimeActionConfiguration", "MaxExecutionTimeMS", "CreatedByAgentID") VALUES ('5044a100-0018-4000-8000-000000000018', '0dc7433e-f36b-1410-8db6-00021f8b792e', 'Sonar: Test Signal', 'Runs a signal''s code over a sample of anchor records and returns per-record { value, explanation, error } in a Both Result. Runs through Test Runtime Action''s ephemeral path so a Pending signal can be tested before approval; reads its results in-process so they round-trip to the browser (unlike Test Runtime Action''s Output-only result). Powers the Signal Studio''s Run Test.', 'Custom', NULL, NULL, NULL, NULL, 'Pending', NULL, NULL, NULL, FALSE, FALSE, NULL, 'Active', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', 'SonarTestSignal', NULL, 'fa-solid fa-flask', NULL, NULL, NULL, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "UserPrompt", "UserComments", "Code", "CodeComments", "CodeApprovalStatus", "CodeApprovalComments", "CodeApprovedByUserID", "CodeApprovedAt", "CodeLocked", "ForceCodeGeneration", "RetentionPeriod", "Status", "__mj_CreatedAt", "__mj_UpdatedAt", "DriverClass", "ParentID", "IconClass", "DefaultCompactPromptID", "Config", "RuntimeActionConfiguration", "MaxExecutionTimeMS", "CreatedByAgentID") VALUES ('5044a100-0019-4000-8000-000000000019', '0dc7433e-f36b-1410-8db6-00021f8b792e', 'Sonar: Cancel Factor Job', 'Stops an in-flight ActionSmith run (a commission or refine) from the Signal Studio. Aborts the run''s cancellation token when this process owns it (a true cancel — the agent loop stops and a refine never transplants), else flips the AIAgentRun row to Cancelled so it leaves the in-flight feed. Powers the Studio''s per-job Cancel button.', 'Custom', NULL, NULL, NULL, NULL, 'Pending', NULL, NULL, NULL, FALSE, FALSE, NULL, 'Active', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', 'SonarCancelFactorJob', NULL, 'fa-solid fa-stop', NULL, NULL, NULL, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."Action" ("ID", "CategoryID", "Name", "Description", "Type", "UserPrompt", "UserComments", "Code", "CodeComments", "CodeApprovalStatus", "CodeApprovalComments", "CodeApprovedByUserID", "CodeApprovedAt", "CodeLocked", "ForceCodeGeneration", "RetentionPeriod", "Status", "__mj_CreatedAt", "__mj_UpdatedAt", "DriverClass", "ParentID", "IconClass", "DefaultCompactPromptID", "Config", "RuntimeActionConfiguration", "MaxExecutionTimeMS", "CreatedByAgentID") VALUES ('5044a100-001a-4000-8000-00000000001a', '0dc7433e-f36b-1410-8db6-00021f8b792e', 'Sonar: Bind Signal To Model', 'Binds an approved custom signal (a Runtime factor-action) into a Draft model''s rubric — creates an ActionBacked Factor pointing at the signal + a Model Factor with a weight. Guards: the model must be Draft and the signal''s code must be Approved. Powers the Signal Studio''s ''Add to a model''.', 'Custom', NULL, NULL, NULL, NULL, 'Pending', NULL, NULL, NULL, FALSE, FALSE, NULL, 'Active', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', 'SonarBindSignalToModel', NULL, 'fa-solid fa-link', NULL, NULL, NULL, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
-- ActionParam: 61 rows
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0001-4000-8000-0000000000a1', '5044a100-0001-4000-8000-000000000001', 'ModelID', NULL, 'Input     ', 'Scalar', FALSE, 'The ScoreModel ID to preview.', TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0001-4000-8000-0000000000a2', '5044a100-0001-4000-8000-000000000001', 'Result', NULL, 'Both      ', 'Scalar', FALSE, 'JSON: { totalScored, bandDistribution[], sampleMember }.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0002-4000-8000-0000000000a1', '5044a100-0002-4000-8000-000000000002', 'ModelID', NULL, 'Input     ', 'Scalar', FALSE, 'The ScoreModel ID to recompute (must be published).', TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0002-4000-8000-0000000000a2', '5044a100-0002-4000-8000-000000000002', 'Result', NULL, 'Both      ', 'Scalar', FALSE, 'JSON: { runId, status, recordsScored }.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0003-4000-8000-0000000000a1', '5044a100-0003-4000-8000-000000000003', 'ModelID', NULL, 'Input     ', 'Scalar', FALSE, 'The ScoreModel ID the draft factor belongs to.', TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0003-4000-8000-0000000000a3', '5044a100-0003-4000-8000-000000000003', 'DraftJSON', NULL, 'Input     ', 'Scalar', FALSE, 'JSON of the draft factor: { sourceRelatedEntityID, aggregation, aggregateFieldName?, filterExpression?, timeWindowID?, normalizationMethod, higherIsBetter }.', TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0003-4000-8000-0000000000a2', '5044a100-0003-4000-8000-000000000003', 'Result', NULL, 'Both      ', 'Scalar', FALSE, 'JSON: { membersWithData, sampleAnchorId, sampleRawValue, sampleStrength }.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0005-4000-8000-0000000000a1', '5044a100-0005-4000-8000-000000000005', 'Result', NULL, 'Both      ', 'Scalar', FALSE, 'JSON array of factor-actions: { actionId, name, description, contract, params[] }.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0008-4000-8000-0000000000a1', '5044a100-0008-4000-8000-000000000008', 'ModelID', NULL, 'Input     ', 'Scalar', FALSE, 'The ScoreModel to add the factor to.', TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0008-4000-8000-0000000000a2', '5044a100-0008-4000-8000-000000000008', 'Spec', NULL, 'Input     ', 'Scalar', FALSE, 'JSON CreateFactorSpec: name, sourceRelatedEntityID, aggregation, aggregateFieldName, filterExpression, timeWindowID, normalizationMethod, normalizationParamsJSON, higherIsBetter, weight, weightMode.', TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0008-4000-8000-0000000000a3', '5044a100-0008-4000-8000-000000000008', 'Result', NULL, 'Both      ', 'Scalar', FALSE, 'JSON: { factorID, modelFactorID }.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0009-4000-8000-0000000000a1', '5044a100-0009-4000-8000-000000000009', 'ModelID', NULL, 'Input     ', 'Scalar', FALSE, 'The ScoreModel to wire the source into.', TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0009-4000-8000-0000000000a2', '5044a100-0009-4000-8000-000000000009', 'Spec', NULL, 'Input     ', 'Scalar', FALSE, 'JSON AddDataSourceSpec: relatedEntityID, alias, relationshipPath (optional explicit FK path).', TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0009-4000-8000-0000000000a3', '5044a100-0009-4000-8000-000000000009', 'Result', NULL, 'Both      ', 'Scalar', FALSE, 'JSON: { modelRelatedEntityID }.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-000a-4000-8000-0000000000a1', '5044a100-000a-4000-8000-00000000000a', 'Spec', NULL, 'Input     ', 'Scalar', FALSE, 'JSON CreateModelSpec: name, anchorEntityID.', TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-000a-4000-8000-0000000000a2', '5044a100-000a-4000-8000-00000000000a', 'Result', NULL, 'Both      ', 'Scalar', FALSE, 'JSON: { modelID }.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-000b-4000-8000-0000000000a1', '5044a100-000b-4000-8000-00000000000b', 'ModelID', NULL, 'Input     ', 'Scalar', FALSE, 'The ScoreModel to attach the band set to.', TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-000b-4000-8000-0000000000a2', '5044a100-000b-4000-8000-00000000000b', 'BandSetID', NULL, 'Input     ', 'Scalar', FALSE, 'The ScoreBandSet to attach.', TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-000b-4000-8000-0000000000a3', '5044a100-000b-4000-8000-00000000000b', 'Result', NULL, 'Both      ', 'Scalar', FALSE, 'JSON: { modelID, bandSetID }.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-000c-4000-8000-0000000000a1', '5044a100-000c-4000-8000-000000000008', 'PromptName', NULL, 'Input     ', 'Scalar', FALSE, 'The registered AIPrompt Name to read (e.g. a factor-action''s contract.promptName).', TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-000c-4000-8000-0000000000a2', '5044a100-000c-4000-8000-000000000008', 'Result', NULL, 'Both      ', 'Scalar', FALSE, 'JSON: { promptId, templateContentId, text } (or { error }).', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-000d-4000-8000-0000000000a1', '5044a100-000d-4000-8000-000000000009', 'TemplateContentID', NULL, 'Input     ', 'Scalar', FALSE, 'The MJ Template Content row id whose text to overwrite (from Sonar: Get Prompt).', TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-000d-4000-8000-0000000000a2', '5044a100-000d-4000-8000-000000000009', 'Text', NULL, 'Input     ', 'Scalar', FALSE, 'The new prompt text.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-000d-4000-8000-0000000000a3', '5044a100-000d-4000-8000-000000000009', 'Result', NULL, 'Both      ', 'Scalar', FALSE, 'JSON: { templateContentId, saved }.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-000e-4000-8000-0000000000a1', '5044a100-000e-4000-8000-00000000000e', 'Prompt', NULL, 'Input     ', 'Scalar', FALSE, 'The natural-language instruction for the authoring agent.', TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-000e-4000-8000-0000000000a2', '5044a100-000e-4000-8000-00000000000e', 'ContextNote', NULL, 'Input     ', 'Scalar', FALSE, 'Optional context (e.g. the model the user is viewing), prepended to the prompt.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-000e-4000-8000-0000000000a3', '5044a100-000e-4000-8000-00000000000e', 'Reply', NULL, 'Both      ', 'Scalar', FALSE, 'The agent''s human-readable summary of what it built.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-000f-4000-8000-0000000000a1', '5044a100-000f-4000-8000-00000000000f', 'Spec', NULL, 'Input     ', 'Scalar', FALSE, 'JSON BuildModelSpec: { name, anchorEntityID, sources:[{relatedEntityID, alias, relationshipPath?}], factors:[{name, sourceAlias, aggregation, aggregateFieldName?, filterExpression?, timeWindowID?, dateField?, normalizationMethod?, higherIsBetter?, weight?, weightMode?}], bandSetId? }.', TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-000f-4000-8000-0000000000a2', '5044a100-000f-4000-8000-00000000000f', 'Result', NULL, 'Both      ', 'Scalar', FALSE, 'JSON: { modelID, sources:{alias→id}, factors:[id], bandSetAttached }.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0010-4000-8000-0000000000a1', '5044a100-0010-4000-8000-000000000010', 'ModelID', NULL, 'Input     ', 'Scalar', FALSE, 'The ScoreModel ID to describe (preferred). Provide this or Name.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0010-4000-8000-0000000000a2', '5044a100-0010-4000-8000-000000000010', 'Name', NULL, 'Input     ', 'Scalar', FALSE, 'The exact model name to describe (used when ModelID is absent).', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0010-4000-8000-0000000000a3', '5044a100-0010-4000-8000-000000000010', 'Result', NULL, 'Both      ', 'Scalar', FALSE, 'JSON ModelDescription: { modelID, name, status, anchorEntityID, anchorEntityName, bandSet, sources[], factors[] }.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0011-4000-8000-0000000000a1', '5044a100-0011-4000-8000-000000000011', 'AnchorEntityID', NULL, 'Input     ', 'Scalar', FALSE, 'The anchor entity ID to find joinable business sources for.', TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0011-4000-8000-0000000000a2', '5044a100-0011-4000-8000-000000000011', 'Result', NULL, 'Both      ', 'Scalar', FALSE, 'JSON: { anchorEntityID, anchorEntityName, related: [{ entityID, entityName, schemaName, viaField }] }.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0012-4000-8000-0000000000a1', '5044a100-0012-4000-8000-000000000012', 'Description', NULL, 'Input     ', 'Scalar', FALSE, 'The signal to build, in plain English (e.g. ''longest streak of consecutive months with an event registration'').', TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0012-4000-8000-0000000000a2', '5044a100-0012-4000-8000-000000000012', 'Context', NULL, 'Input     ', 'Scalar', FALSE, 'Optional grounding: the anchor entity and available data sources, so the generated code targets real data.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0012-4000-8000-0000000000a3', '5044a100-0012-4000-8000-000000000012', 'Result', NULL, 'Both      ', 'Scalar', FALSE, 'JSON: { actionId, approvalStatus, name, message }.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0013-4000-8000-0000000000a1', '5044a100-0013-4000-8000-000000000013', 'Description', NULL, 'Input     ', 'Scalar', FALSE, 'The signal to build, in plain English.', TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0013-4000-8000-0000000000a2', '5044a100-0013-4000-8000-000000000013', 'Context', NULL, 'Input     ', 'Scalar', FALSE, 'Optional grounding: the anchor entity and available data sources.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0013-4000-8000-0000000000a3', '5044a100-0013-4000-8000-000000000013', 'Result', NULL, 'Both      ', 'Scalar', FALSE, 'JSON: { agentRunId } — poll AIAgentRun for status/result.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0014-4000-8000-0000000000a1', '5044a100-0014-4000-8000-000000000014', 'TargetActionID', NULL, 'Input     ', 'Scalar', FALSE, 'The existing signal (Runtime action) to improve.', TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0014-4000-8000-0000000000a2', '5044a100-0014-4000-8000-000000000014', 'Feedback', NULL, 'Input     ', 'Scalar', FALSE, 'What to change or improve, in plain English.', TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0014-4000-8000-0000000000a3', '5044a100-0014-4000-8000-000000000014', 'Result', NULL, 'Both      ', 'Scalar', FALSE, 'JSON: { agentRunId } — poll AIAgentRun for status; the signal updates in place when it completes.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0015-4000-8000-0000000000a1', '5044a100-0015-4000-8000-000000000015', 'ModelID', NULL, 'Input     ', 'Scalar', FALSE, 'The model to unpublish (preferred). Provide this or ModelName.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0015-4000-8000-0000000000a2', '5044a100-0015-4000-8000-000000000015', 'ModelName', NULL, 'Input     ', 'Scalar', FALSE, 'Exact model name, if the ID isn''t known.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0015-4000-8000-0000000000a3', '5044a100-0015-4000-8000-000000000015', 'Result', NULL, 'Both      ', 'Scalar', FALSE, 'JSON: { modelID, name, previousStatus, status }.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0016-4000-8000-0000000000a1', '5044a100-0016-4000-8000-000000000016', 'NameQuery', NULL, 'Input     ', 'Scalar', FALSE, 'Case-insensitive substring of the entity name. Omit to list all business entities.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0016-4000-8000-0000000000a2', '5044a100-0016-4000-8000-000000000016', 'Result', NULL, 'Both      ', 'Scalar', FALSE, 'JSON: { entities: [{ id, name, schemaName, description }], count, truncated }.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0017-4000-8000-0000000000a1', '5044a100-0017-4000-8000-000000000017', 'NameQuery', NULL, 'Input     ', 'Scalar', FALSE, 'Case-insensitive substring of the model name. Omit to list all models.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0017-4000-8000-0000000000a2', '5044a100-0017-4000-8000-000000000017', 'Result', NULL, 'Both      ', 'Scalar', FALSE, 'JSON: { models: [{ id, name, status, anchorEntityID, anchorName }], count, truncated }.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0018-4000-8000-0000000000a1', '5044a100-0018-4000-8000-000000000018', 'TargetActionID', NULL, 'Input     ', 'Scalar', FALSE, 'The signal (Runtime action) to test.', TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0018-4000-8000-0000000000a2', '5044a100-0018-4000-8000-000000000018', 'AnchorRecordIDs', NULL, 'Input     ', 'Scalar', FALSE, 'JSON array of sample anchor record ids to test the signal against.', TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0018-4000-8000-0000000000a3', '5044a100-0018-4000-8000-000000000018', 'AsOf', NULL, 'Input     ', 'Scalar', FALSE, 'ISO date to compute the signal as of. Defaults to now.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0018-4000-8000-0000000000a4', '5044a100-0018-4000-8000-000000000018', 'Result', NULL, 'Both      ', 'Scalar', FALSE, 'JSON: { rows: [{ anchorRecordId, value, explanation, error }] }.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0019-4000-8000-0000000000a1', '5044a100-0019-4000-8000-000000000019', 'AgentRunID', NULL, 'Input     ', 'Scalar', FALSE, 'The AIAgentRun id of the in-flight job to cancel.', TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-0019-4000-8000-0000000000a2', '5044a100-0019-4000-8000-000000000019', 'Result', NULL, 'Both      ', 'Scalar', FALSE, 'JSON: { aborted, statusFlipped }.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-001a-4000-8000-0000000000a1', '5044a100-001a-4000-8000-00000000001a', 'ActionID', NULL, 'Input     ', 'Scalar', FALSE, 'The approved signal (Runtime action) to bind.', TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-001a-4000-8000-0000000000a2', '5044a100-001a-4000-8000-00000000001a', 'ModelID', NULL, 'Input     ', 'Scalar', FALSE, 'The Draft model to bind the signal into.', TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-001a-4000-8000-0000000000a3', '5044a100-001a-4000-8000-00000000001a', 'Weight', NULL, 'Input     ', 'Scalar', FALSE, 'Rubric weight 0..1 (default 0.25).', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-001a-4000-8000-0000000000a4', '5044a100-001a-4000-8000-00000000001a', 'Name', NULL, 'Input     ', 'Scalar', FALSE, 'Factor name override (defaults to the signal''s name).', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionParam" ("ID", "ActionID", "Name", "DefaultValue", "Type", "ValueType", "IsArray", "Description", "IsRequired", "__mj_CreatedAt", "__mj_UpdatedAt", "MediaModality") VALUES ('5044a100-001a-4000-8000-0000000000a5', '5044a100-001a-4000-8000-00000000001a', 'Result', NULL, 'Both      ', 'Scalar', FALSE, 'JSON: { factorID, modelFactorID }.', FALSE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL) ON CONFLICT ("ID") DO NOTHING;
-- ActionResultCode: 78 rows
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0001-4000-8000-0000000000c1', '5044a100-0001-4000-8000-000000000001', 'SUCCESS', TRUE, 'Preview computed.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0001-4000-8000-0000000000c2', '5044a100-0001-4000-8000-000000000001', 'VALIDATION_ERROR', FALSE, 'A required input was missing or invalid.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0001-4000-8000-0000000000c3', '5044a100-0001-4000-8000-000000000001', 'ERROR', FALSE, 'The engine failed to compute scores.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0002-4000-8000-0000000000c1', '5044a100-0002-4000-8000-000000000002', 'SUCCESS', TRUE, 'Recompute succeeded.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0002-4000-8000-0000000000c2', '5044a100-0002-4000-8000-000000000002', 'VALIDATION_ERROR', FALSE, 'A required input was missing or invalid.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0002-4000-8000-0000000000c3', '5044a100-0002-4000-8000-000000000002', 'ERROR', FALSE, 'The recompute run failed (e.g. model not published).', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0003-4000-8000-0000000000c1', '5044a100-0003-4000-8000-000000000003', 'SUCCESS', TRUE, 'Preview computed.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0003-4000-8000-0000000000c2', '5044a100-0003-4000-8000-000000000003', 'VALIDATION_ERROR', FALSE, 'A required input was missing or invalid.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0003-4000-8000-0000000000c3', '5044a100-0003-4000-8000-000000000003', 'ERROR', FALSE, 'The engine failed to evaluate the draft factor.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0005-4000-8000-0000000000c1', '5044a100-0005-4000-8000-000000000005', 'SUCCESS', TRUE, 'Catalog returned.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0005-4000-8000-0000000000c2', '5044a100-0005-4000-8000-000000000005', 'ERROR', FALSE, 'Failed to build the factor-action catalog.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0008-4000-8000-0000000000c1', '5044a100-0008-4000-8000-000000000008', 'SUCCESS', TRUE, 'Factor created and bound.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0008-4000-8000-0000000000c2', '5044a100-0008-4000-8000-000000000008', 'VALIDATION_ERROR', FALSE, 'A required input was missing or invalid.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0008-4000-8000-0000000000c3', '5044a100-0008-4000-8000-000000000008', 'NOT_FOUND', FALSE, 'The model was not found.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0008-4000-8000-0000000000c4', '5044a100-0008-4000-8000-000000000008', 'ERROR', FALSE, 'Saving the factor or binding failed.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0009-4000-8000-0000000000c1', '5044a100-0009-4000-8000-000000000009', 'SUCCESS', TRUE, 'Data source wired.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0009-4000-8000-0000000000c2', '5044a100-0009-4000-8000-000000000009', 'VALIDATION_ERROR', FALSE, 'A required input was missing or invalid.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0009-4000-8000-0000000000c3', '5044a100-0009-4000-8000-000000000009', 'ERROR', FALSE, 'Saving the data source failed.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-000a-4000-8000-0000000000c1', '5044a100-000a-4000-8000-00000000000a', 'SUCCESS', TRUE, 'Draft model created.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-000a-4000-8000-0000000000c2', '5044a100-000a-4000-8000-00000000000a', 'VALIDATION_ERROR', FALSE, 'A required input was missing or invalid.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-000a-4000-8000-0000000000c3', '5044a100-000a-4000-8000-00000000000a', 'ERROR', FALSE, 'Saving the model failed.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-000b-4000-8000-0000000000c1', '5044a100-000b-4000-8000-00000000000b', 'SUCCESS', TRUE, 'Band set attached.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-000b-4000-8000-0000000000c2', '5044a100-000b-4000-8000-00000000000b', 'VALIDATION_ERROR', FALSE, 'A required input was missing or invalid.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-000b-4000-8000-0000000000c3', '5044a100-000b-4000-8000-00000000000b', 'NOT_FOUND', FALSE, 'The model was not found.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-000b-4000-8000-0000000000c4', '5044a100-000b-4000-8000-00000000000b', 'ERROR', FALSE, 'Saving the model failed.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-000c-4000-8000-0000000000c1', '5044a100-000c-4000-8000-000000000008', 'SUCCESS', TRUE, 'Prompt text returned.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-000c-4000-8000-0000000000c2', '5044a100-000c-4000-8000-000000000008', 'VALIDATION_ERROR', FALSE, 'PromptName was missing.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-000c-4000-8000-0000000000c3', '5044a100-000c-4000-8000-000000000008', 'ERROR', FALSE, 'Failed to read the prompt.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-000d-4000-8000-0000000000c1', '5044a100-000d-4000-8000-000000000009', 'SUCCESS', TRUE, 'Prompt updated.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-000d-4000-8000-0000000000c2', '5044a100-000d-4000-8000-000000000009', 'VALIDATION_ERROR', FALSE, 'TemplateContentID was missing.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-000d-4000-8000-0000000000c3', '5044a100-000d-4000-8000-000000000009', 'NOT_FOUND', FALSE, 'Template content row not found.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-000d-4000-8000-0000000000c4', '5044a100-000d-4000-8000-000000000009', 'ERROR', FALSE, 'Failed to save the prompt.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-000e-4000-8000-0000000000c1', '5044a100-000e-4000-8000-00000000000e', 'SUCCESS', TRUE, 'Agent completed.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-000e-4000-8000-0000000000c2', '5044a100-000e-4000-8000-00000000000e', 'VALIDATION_ERROR', FALSE, 'A required input was missing.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-000e-4000-8000-0000000000c3', '5044a100-000e-4000-8000-00000000000e', 'NOT_FOUND', FALSE, 'The authoring agent was not found.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-000e-4000-8000-0000000000c4', '5044a100-000e-4000-8000-00000000000e', 'ERROR', FALSE, 'The agent run failed.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-000f-4000-8000-0000000000c1', '5044a100-000f-4000-8000-00000000000f', 'SUCCESS', TRUE, 'Draft model built.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-000f-4000-8000-0000000000c2', '5044a100-000f-4000-8000-00000000000f', 'VALIDATION_ERROR', FALSE, 'Spec missing required fields.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-000f-4000-8000-0000000000c3', '5044a100-000f-4000-8000-00000000000f', 'ERROR', FALSE, 'A step failed; the partial draft is reported.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0010-4000-8000-0000000000c1', '5044a100-0010-4000-8000-000000000010', 'SUCCESS', TRUE, 'Model described.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0010-4000-8000-0000000000c2', '5044a100-0010-4000-8000-000000000010', 'VALIDATION_ERROR', FALSE, 'Neither ModelID nor Name was provided.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0010-4000-8000-0000000000c3', '5044a100-0010-4000-8000-000000000010', 'NOT_FOUND', FALSE, 'No model matched the given ID or name.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0010-4000-8000-0000000000c4', '5044a100-0010-4000-8000-000000000010', 'ERROR', FALSE, 'An unexpected error occurred while reading the model.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0011-4000-8000-0000000000c1', '5044a100-0011-4000-8000-000000000011', 'SUCCESS', TRUE, 'Related business entities listed.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0011-4000-8000-0000000000c2', '5044a100-0011-4000-8000-000000000011', 'VALIDATION_ERROR', FALSE, 'AnchorEntityID was missing.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0011-4000-8000-0000000000c3', '5044a100-0011-4000-8000-000000000011', 'NOT_FOUND', FALSE, 'No entity matched the given anchor ID.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0011-4000-8000-0000000000c4', '5044a100-0011-4000-8000-000000000011', 'ERROR', FALSE, 'An unexpected error occurred while walking the entity graph.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0012-4000-8000-0000000000c1', '5044a100-0012-4000-8000-000000000012', 'SUCCESS', TRUE, 'ActionSmith authored a Runtime factor-action (Pending approval).', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0012-4000-8000-0000000000c2', '5044a100-0012-4000-8000-000000000012', 'VALIDATION_ERROR', FALSE, 'Description was missing.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0012-4000-8000-0000000000c3', '5044a100-0012-4000-8000-000000000012', 'NOT_FOUND', FALSE, 'The ActionSmith agent is not present in this environment.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0012-4000-8000-0000000000c4', '5044a100-0012-4000-8000-000000000012', 'ERROR', FALSE, 'ActionSmith did not complete (or errored) — message carries the reason.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0013-4000-8000-0000000000c1', '5044a100-0013-4000-8000-000000000013', 'SUCCESS', TRUE, 'Job started; AgentRunID returned.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0013-4000-8000-0000000000c2', '5044a100-0013-4000-8000-000000000013', 'VALIDATION_ERROR', FALSE, 'Description was missing.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0013-4000-8000-0000000000c3', '5044a100-0013-4000-8000-000000000013', 'NOT_FOUND', FALSE, 'ActionSmith agent not present in this environment.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0013-4000-8000-0000000000c4', '5044a100-0013-4000-8000-000000000013', 'ERROR', FALSE, 'The job didn''t start.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0014-4000-8000-0000000000c1', '5044a100-0014-4000-8000-000000000014', 'SUCCESS', TRUE, 'Refine job started; AgentRunID returned.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0014-4000-8000-0000000000c2', '5044a100-0014-4000-8000-000000000014', 'VALIDATION_ERROR', FALSE, 'TargetActionID or Feedback was missing.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0014-4000-8000-0000000000c3', '5044a100-0014-4000-8000-000000000014', 'NOT_FOUND', FALSE, 'Target action or ActionSmith agent not found.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0014-4000-8000-0000000000c4', '5044a100-0014-4000-8000-000000000014', 'ERROR', FALSE, 'The refine job didn''t start.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0015-4000-8000-0000000000c1', '5044a100-0015-4000-8000-000000000015', 'SUCCESS', TRUE, 'Model unpublished to Draft (or already Draft).', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0015-4000-8000-0000000000c2', '5044a100-0015-4000-8000-000000000015', 'VALIDATION_ERROR', FALSE, 'Neither ModelID nor ModelName was provided.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0015-4000-8000-0000000000c3', '5044a100-0015-4000-8000-000000000015', 'NOT_FOUND', FALSE, 'No model matched the identifier.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0015-4000-8000-0000000000c4', '5044a100-0015-4000-8000-000000000015', 'ERROR', FALSE, 'Unpublish failed or the model is in a non-unpublishable state.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0016-4000-8000-0000000000c1', '5044a100-0016-4000-8000-000000000016', 'SUCCESS', TRUE, 'Returned matching business entities.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0016-4000-8000-0000000000c2', '5044a100-0016-4000-8000-000000000016', 'ERROR', FALSE, 'Lookup failed.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0017-4000-8000-0000000000c1', '5044a100-0017-4000-8000-000000000017', 'SUCCESS', TRUE, 'Returned matching models.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0017-4000-8000-0000000000c2', '5044a100-0017-4000-8000-000000000017', 'ERROR', FALSE, 'Lookup failed.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0018-4000-8000-0000000000c1', '5044a100-0018-4000-8000-000000000018', 'SUCCESS', TRUE, 'Returned per-record test results.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0018-4000-8000-0000000000c2', '5044a100-0018-4000-8000-000000000018', 'VALIDATION_ERROR', FALSE, 'TargetActionID or AnchorRecordIDs missing/invalid.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0018-4000-8000-0000000000c3', '5044a100-0018-4000-8000-000000000018', 'NOT_FOUND', FALSE, 'Signal or Test Runtime Action not found.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0018-4000-8000-0000000000c4', '5044a100-0018-4000-8000-000000000018', 'ERROR', FALSE, 'Test run failed.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0019-4000-8000-0000000000c1', '5044a100-0019-4000-8000-000000000019', 'SUCCESS', TRUE, 'Job cancelled (or already finished).', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0019-4000-8000-0000000000c2', '5044a100-0019-4000-8000-000000000019', 'VALIDATION_ERROR', FALSE, 'AgentRunID missing.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-0019-4000-8000-0000000000c3', '5044a100-0019-4000-8000-000000000019', 'ERROR', FALSE, 'Cancel failed.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-001a-4000-8000-0000000000c1', '5044a100-001a-4000-8000-00000000001a', 'SUCCESS', TRUE, 'Signal bound into the model.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-001a-4000-8000-0000000000c2', '5044a100-001a-4000-8000-00000000001a', 'VALIDATION_ERROR', FALSE, 'ActionID or ModelID missing.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-001a-4000-8000-0000000000c3', '5044a100-001a-4000-8000-00000000001a', 'NOT_FOUND', FALSE, 'Signal or model not found.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
INSERT INTO __mj."ActionResultCode" ("ID", "ActionID", "ResultCode", "IsSuccess", "Description", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('5044a100-001a-4000-8000-0000000000c4', '5044a100-001a-4000-8000-00000000001a', 'ERROR', FALSE, 'Model not Draft, signal not Approved, or save failed.', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
-- Template: 1 rows
INSERT INTO __mj."Template" ("ID", "Name", "Description", "CategoryID", "UserPrompt", "UserID", "ActiveAt", "DisabledAt", "IsActive", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('40f49dd4-0712-4263-8785-5346f023ffa1', 'Sonar Authoring Agent', 'Sonar Authoring Agent — system/instruction prompt.', NULL, NULL, 'ecafccec-6a37-ef11-86d4-000d3a4e707e', NULL, NULL, TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
-- TemplateContent: 1 rows
INSERT INTO __mj."TemplateContent" ("ID", "TemplateID", "TypeID", "TemplateText", "Priority", "IsActive", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('094e9b12-2f3e-46ec-a9e6-d4d026f96298', '40f49dd4-0712-4263-8785-5346f023ffa1', 'e7afccec-6a37-ef11-86d4-000d3a4e707e', 'You are the Sonar Authoring Agent. You help an operator build engagement-scoring
configuration — score models, factors, band sets — by calling tools. You produce DRAFTS for a human to
review; you NEVER publish or activate anything.

## Building a NEW model — use ONE tool
To build a new model, call **Sonar: Build Model** ONCE with the whole spec. Do NOT chain Create Model /
Add Data Source / Create Factor for a new build — that single call wires everything up for you. Spec:
{
  "name": "...",
  "anchorEntityID": "<entity id>",
  "sources": [ { "relatedEntityID": "<entity id>", "alias": "events" } ],
  "factors": [ { "name": "Event Count", "sourceAlias": "events", "aggregation": "Count",
                 "normalizationMethod": "MinMax", "higherIsBetter": true, "weight": 1 } ],
  "bandSetId": "<band set id, optional>"
}
- Factors reference a source by its **alias** (never an ID).
- aggregation ∈ Count|Sum|Avg|Min|Max|DistinctCount. Count needs NO aggregateFieldName; EVERY other
  aggregation REQUIRES aggregateFieldName (a numeric/date column on the source).
- normalizationMethod ∈ MinMax|Percentile|ZScore|None|Logistic|Banded|Lookup (MinMax is a safe default).
- It returns { modelID, ... }; the model is a DRAFT.

## Editing an EXISTING model — granular tools
For incremental changes to a model that already exists: Sonar: Add Data Source, Sonar: Create Factor
(its sourceRelatedEntityID = the modelRelatedEntityID returned by Add Data Source), Sonar: Set Band Set.
- Add Data Source Spec = { relatedEntityID, alias }. Do NOT set relationshipPath — omit it and the engine
  auto-resolves the foreign key. (A dotted/SQL string there is invalid and will be ignored.)
- If a tool returns an error message, READ it and fix that specific thing; do NOT retry the same call
  unchanged or invent new variations of a field that already failed.

## PICK THE RIGHT MODEL — match the user''s intent
When the user refers to a model loosely ("cheese", "the engagement one"), call **Sonar: Find Models**
(NameQuery="cheese") to fuzzy-match it by partial name — do NOT assume the current model or give up. Use
Find Models (no query) to enumerate what exists when asked "what models do I have?". Once resolved, edit
that model if it''s EDITABLE (Draft). Do NOT grab an unrelated model (e.g. a "Test Model") just because it
shares an anchor entity — the name match is the signal. If several match, ask the user to pick by name.

## LOCKED models — unlock, don''t loop
Only DRAFT models can be edited; Active/Paused models are LOCKED. When the target you should edit is
locked:
1. If a matching EDITABLE Draft already exists, just use it.
2. Otherwise, OFFER to unlock it: "This model is Active (locked). Want me to unpublish it to Draft so I
   can edit it, or create a new draft instead?" If the user says unlock it, call **Sonar: Unpublish
   Model** (ModelID or ModelName) yourself — it moves Active/Paused → Draft (it NEVER publishes), then
   proceed with the edit in the SAME turn.
- Never tell the user to go unpublish it manually, and never re-run the same status check hoping it
  changed — YOU have the unpublish tool; use it or pivot to a new draft. Do not loop.

## LOOK BEFORE YOU ASK — read tools
You can SEE existing state. Use these BEFORE asking the user to re-state things you can look up:
- **Sonar: Describe Model** (by Name or ModelID) → returns a model''s anchor, sources (with aliases),
  factors, and band set. When asked to suggest changes to, or answer questions about, a NAMED model,
  Describe it FIRST — don''t ask the user what its anchor or sources are.
- **Sonar: List Related Entities** (AnchorEntityID) → the business entities joinable to an anchor (the
  candidate data sources). Use this to ground factor/source suggestions in data that ACTUALLY exists —
  never invent generic factors ("login frequency") that have no backing source on this anchor.
- Suggesting factors = Describe the model → List Related Entities on its anchor → propose declarative
  factors over real sources, then ask the user to confirm before you build.

## RESOLVE ENTITY IDs YOURSELF — never ask the user for a UUID
To build a NEW model you need an anchorEntityID. When the user names the anchor in plain English
("Members", "Donors"), call **Sonar: Find Entities** (NameQuery="Members") to resolve it to its ID —
do NOT ask the user to paste a UUID. If several match, ask the user to pick by NAME. Use the resolved id
as anchorEntityID in Build Model. (Related sources on an existing anchor still come from List Related
Entities.)

## Rules
- DECLARATIVE-FIRST: build signals as declarative factors (count/sum/avg over a source, with a window/
  filter). For a signal SQL CAN''T express (streaks, decay/recency, sentiment, cross-source ratios), use
  **Sonar: Author Factor Action** — describe the signal plainly and it authors a custom code factor via
  ActionSmith. It returns a Runtime action at CodeApprovalStatus=''Pending'' (a human approves the code
  before it scores). Reach for it ONLY when declarative genuinely can''t express the signal; never
  approximate a code-signal with a wrong aggregation.
- FINISH the whole request in one go. If you cannot complete every requested part, state exactly what is
  missing — NEVER claim you are done when you are not.
- VERIFY before claiming: only report a source/factor as added if its tool call returned success. If
  unsure what a model contains, call Sonar: Describe Model to check. Never report a step that errored.
- EXPLAIN your choices (why each factor and weight) in your reasoning.
- DRAFTS ONLY: never publish or activate. Leave the model Draft for human review.
- IDs: if you don''t know an anchorEntityID or a bandSetId, first try the read tools; only ASK the user
  when you genuinely can''t look it up — never guess UUIDs.', 1, TRUE, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
-- AIPrompt: 1 rows
INSERT INTO __mj."AIPrompt" ("ID", "Name", "Description", "TemplateID", "CategoryID", "TypeID", "Status", "__mj_CreatedAt", "__mj_UpdatedAt", "ResponseFormat", "ModelSpecificResponseFormat", "AIModelTypeID", "MinPowerRank", "SelectionStrategy", "PowerPreference", "ParallelizationMode", "ParallelCount", "ParallelConfigParam", "OutputType", "OutputExample", "ValidationBehavior", "MaxRetries", "RetryDelayMS", "RetryStrategy", "ResultSelectorPromptID", "EnableCaching", "CacheTTLSeconds", "CacheMatchType", "CacheSimilarityThreshold", "CacheMustMatchModel", "CacheMustMatchVendor", "CacheMustMatchAgent", "CacheMustMatchConfig", "PromptRole", "PromptPosition", "Temperature", "TopP", "TopK", "MinP", "FrequencyPenalty", "PresencePenalty", "Seed", "StopSequences", "IncludeLogProbs", "TopLogProbs", "FailoverStrategy", "FailoverMaxAttempts", "FailoverDelaySeconds", "FailoverModelStrategy", "FailoverErrorScope", "EffortLevel", "AssistantPrefill", "PrefillFallbackMode", "RequireSpecificModels") VALUES ('3a70c8ff-b823-4491-8b3d-3bc258c82aeb', 'Sonar Authoring Agent', 'Instructions for the Sonar Authoring Agent (declarative-first, drafts-only).', '40f49dd4-0712-4263-8785-5346f023ffa1', NULL, 'a6da423e-f36b-1410-8dac-00021f8b792e', 'Active', '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', 'Any', NULL, NULL, 0, 'Specific', 'Highest', 'None', NULL, NULL, 'string', NULL, 'Warn', 0, 0, 'Fixed', NULL, FALSE, NULL, 'Exact', NULL, TRUE, TRUE, FALSE, FALSE, 'System', 'First', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, 'SameModelDifferentVendor', 3, 5, 'PreferSameModel', 'All', NULL, NULL, 'Ignore', FALSE) ON CONFLICT ("ID") DO NOTHING;
-- AIAgent: 1 rows
INSERT INTO __mj."AIAgent" ("ID", "Name", "Description", "LogoURL", "__mj_CreatedAt", "__mj_UpdatedAt", "ParentID", "ExposeAsAction", "ExecutionOrder", "ExecutionMode", "EnableContextCompression", "ContextCompressionMessageThreshold", "ContextCompressionPromptID", "ContextCompressionMessageRetentionCount", "TypeID", "Status", "DriverClass", "IconClass", "ModelSelectionMode", "PayloadDownstreamPaths", "PayloadUpstreamPaths", "PayloadSelfReadPaths", "PayloadSelfWritePaths", "PayloadScope", "FinalPayloadValidation", "FinalPayloadValidationMode", "FinalPayloadValidationMaxRetries", "MaxCostPerRun", "MaxTokensPerRun", "MaxIterationsPerRun", "MaxTimePerRun", "MinExecutionsPerRun", "MaxExecutionsPerRun", "StartingPayloadValidation", "StartingPayloadValidationMode", "DefaultPromptEffortLevel", "ChatHandlingOption", "DefaultArtifactTypeID", "OwnerUserID", "InvocationMode", "ArtifactCreationMode", "FunctionalRequirements", "TechnicalDesign", "InjectNotes", "MaxNotesToInject", "NoteInjectionStrategy", "InjectExamples", "MaxExamplesToInject", "ExampleInjectionStrategy", "IsRestricted", "MessageMode", "MaxMessages", "AttachmentStorageProviderID", "AttachmentRootPath", "InlineStorageThresholdBytes", "AgentTypePromptParams", "ScopeConfig", "NoteRetentionDays", "ExampleRetentionDays", "AutoArchiveEnabled", "RerankerConfiguration", "CategoryID", "AllowEphemeralClientTools", "DefaultStorageAccountID", "SearchScopeAccess", "AcceptUnregisteredFiles", "DefaultCoAgentID", "TypeConfiguration", "AllowMemoryWrite", "RecordingDefault", "RecordingStorageProviderID", "DefaultMediaCollectionID", "SupportsPlanMode", "AcceptsSkills", "SkillActivationMode", "RequirePlanMode") VALUES ('cf1d58ba-451e-4515-89bd-ac3f16a19534', 'Sonar Authoring Agent', 'Builds Sonar scoring config (models/factors/bands) from natural language via the tool surface. Declarative-first; produces drafts for human review.', NULL, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', NULL, FALSE, 0, 'Sequential', FALSE, NULL, NULL, NULL, 'f7926101-5099-4fa5-836a-479d9707c818', 'Active', NULL, 'fa-solid fa-wand-magic-sparkles', 'Agent', '["*"]', '["*"]', NULL, NULL, NULL, NULL, 'Retry', 3, NULL, NULL, 12, NULL, NULL, 18, NULL, 'Fail', NULL, NULL, NULL, 'ecafccec-6a37-ef11-86d4-000d3a4e707e', 'Any', 'Always', NULL, NULL, TRUE, 5, 'Relevant', FALSE, 3, 'Semantic', FALSE, 'None', NULL, NULL, NULL, NULL, NULL, NULL, 90, 180, TRUE, NULL, NULL, TRUE, NULL, 'None', FALSE, NULL, NULL, TRUE, NULL, NULL, NULL, TRUE, 'None', 'RequestedOnly', FALSE) ON CONFLICT ("ID") DO NOTHING;
-- AIAgentPrompt: 1 rows
INSERT INTO __mj."AIAgentPrompt" ("ID", "AgentID", "PromptID", "Purpose", "ExecutionOrder", "ConfigurationID", "Status", "ContextBehavior", "ContextMessageCount", "__mj_CreatedAt", "__mj_UpdatedAt") VALUES ('50583fd9-19f9-4ed8-9b22-2df9d4733d3f', 'cf1d58ba-451e-4515-89bd-ac3f16a19534', '3a70c8ff-b823-4491-8b3d-3bc258c82aeb', NULL, 1, NULL, 'Active', 'Complete', NULL, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z') ON CONFLICT ("ID") DO NOTHING;
-- RemoteOperation: 1 rows
INSERT INTO __mj."RemoteOperation" ("ID", "Name", "OperationKey", "CategoryID", "Description", "InputTypeName", "InputTypeDefinition", "InputTypeIsArray", "OutputTypeName", "OutputTypeDefinition", "OutputTypeIsArray", "ExecutionMode", "RequiredScope", "RequiresSystemUser", "GenerationType", "Code", "CodeApprovalStatus", "CodeApprovedByUserID", "CodeApprovedAt", "ContractFingerprint", "Status", "CacheTTLSeconds", "TimeoutMS", "MaxConcurrency", "__mj_CreatedAt", "__mj_UpdatedAt", "CodeLocked", "CodeComments", "Libraries") VALUES ('5044a100-0030-4000-8000-000000000001', 'Recompute Score Model', 'Sonar.RecomputeModel', NULL, 'Recompute AND persist a full run for a published Score Model (RecomputeOrchestrator.recompute): records a ScoreRecomputeRun, upserts every Score + contributions + history, and streams member-scored progress. LongRunning. Implemented by SonarRecomputeModelServerOperation in @mj-biz-apps/sonar-server (registered via @RegisterClass).', 'SonarRecomputeModelInput', '/** Input for `Sonar.RecomputeModel`. */
export interface SonarRecomputeModelInput {
    /** The `MJ_BizApps_Sonar: Score Models` model to recompute + persist. Must be published (have a current version). */
    modelID: string;
}
', FALSE, 'SonarRecomputeModelOutput', '/** Output of `Sonar.RecomputeModel` — the run summary. */
export interface SonarRecomputeModelOutput {
    /** ID of the persisted `MJ_BizApps_Sonar: Score Recompute Runs` row. */
    runID: string;
    /** Run-level status (`Succeeded` / `Failed`). */
    status: string;
    /** Number of members scored + persisted. */
    recordsScored: number;
    /** Run-level error detail when `status` is not `Succeeded`. */
    errorMessage?: string;
}
', FALSE, 'LongRunning', 'sonar:recompute', FALSE, 'Manual', NULL, 'Approved', NULL, NULL, NULL, 'Active', NULL, NULL, NULL, '2026-07-17T21:21:44.233Z', '2026-07-17T21:21:44.233Z', FALSE, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
-- SchemaInfo: 1 rows
INSERT INTO __mj."SchemaInfo" ("ID", "SchemaName", "EntityIDMin", "EntityIDMax", "Comments", "__mj_CreatedAt", "__mj_UpdatedAt", "Description", "EntityNamePrefix", "EntityNameSuffix", "CanonicalSchemaName") VALUES ('c19ab59f-f9ea-44d7-855e-e4e99557a26d', '__mj_bizappssonar', 1, 999999999, 'Auto-created by CodeGen. Please update EntityIDMin and EntityIDMax to appropriate values for this schema.', '2026-07-17T21:19:18.760Z', '2026-07-17T21:19:18.760Z', NULL, NULL, NULL, NULL) ON CONFLICT ("ID") DO NOTHING;
