# Sonar Plan Refactor — Align on Predictive Studio, Record Set Processing & Remote Operations

**Status:** Directive — supersedes the affected sections of `plan.md` (Draft v0.1, 2026-06-09)
**Why now:** `plan.md` was authored **before** three MJ platform capabilities shipped that collectively provide most of Sonar's §6 engine: **Predictive Studio (PS)**, the hardened **Record Set Processing (RSP)** substrate, and **Remote Operations (RO)**. Building the plan as written would re-implement, less well, machinery MJ now ships and maintains — and would fork correctness guarantees (as-of assembly, leakage guards, honest holdouts) that PS enforces platform-wide. This document specifies what changes, what stays, and what the punch list should build first.

Reference guides in the MJ repo: `guides/PREDICTIVE_STUDIO_GUIDE.md`, `guides/RECORD_SET_PROCESSING_GUIDE.md`, `guides/REMOTE_OPERATIONS_GUIDE.md`.

---

## 1. The one-paragraph version

Sonar's **declarative factors are Predictive Studio features** — the same count/sum/recency-over-a-related-entity-with-filter+window semantics that PS's `FeatureAssemblyExecutor` already computes with point-in-time ("as-of") correctness, a single train/serve-consistent assembly path, and leakage guards. Sonar's **recompute orchestration is a Record Set Processing job** — RSP already owns batching, bounded concurrency, rate limiting, budget gates, circuit breakers, pause/resume, and per-run audit, all of which §6 re-specifies by hand. Sonar's **holdout/lift discipline and re-weighting are PS Experiments** — the `Experiment → Session → Iteration` primitive plus the `ExperimentOrchestrator`. Sonar's **on-demand scoring and control APIs are Remote Operations** — typed, provider-routed, with progress, instead of bespoke resolvers + GraphQL clients. What remains genuinely Sonar — and it is the product — is the **declarative rubric layer** (weights/modes/gates/bands), **explainability spine** (`ScoreFactorContribution` → Explainer), **write-back policy**, **segments/interventions UX**, and the **calibration network**.

---

## 2. Section-by-section mapping

| `plan.md` section | As written | Refactored to |
|---|---|---|
| §6.1 step 2 — `FactorCompiler` (declarative factors → set-based SQL) | Bespoke compiler: anchor→related join, filter, window, aggregation, one pass per factor | **Reuse/extend PS `FeatureAssemblyExecutor`.** A declarative `Factor` maps to a PS feature definition (entity path + filter + window + aggregation). Gains for free: as-of/point-in-time assembly (no future leakage in trend/backfill scoring), the single-assembly-path anti-skew guarantee, and the leakage-guard deny-list. Sonar-specific additions (recency decay curves, rate/trend aggregations) land as **contributions to PS's aggregation vocabulary**, not a parallel compiler. |
| §6.1 step 3 — Action-backed factors (`ExecutionMode`, `MaxConcurrency`, `RateLimitPerMinute`, `CacheTTLSeconds`, `IsExpensive` budgeting, graceful degradation) | Hand-specified batching/caching/budget/rate-limit semantics on the `Factor` entity | **Register an RSP work type** (`'SonarFactor'`, alongside the existing `'ML Model'` work type). RSP's engine already provides bounded concurrency, token-bucket rate limiting, budget gates, error-rate circuit breaker, pause/cancel/resume, and per-record isolation. The `Factor` columns duplicating RSP knobs become RSP processor config; keep only `CacheTTLSeconds` (result caching is factor-semantic, not substrate). |
| §6.1 step 3 (external/propensity ML factors) | External model call via Action | **PS-trained, MJ-resident models**: train in Predictive Studio → immutable `MJ: ML Models` → score via the shipped `'ML Model'` RSP work type → bind as a factor (`Factor.MLModelID`). External calls remain possible via Action-backed factors, but the default path for "propensity as a factor" is in-platform, honest-holdout-validated, and zero-egress. |
| §6.1 steps 4–6 — normalize / combine / band | Bespoke | **Stays Sonar** (this is the rubric engine — the product). One change: population-stats computation and fitted normalization should use PS's `fitted_preprocessing` pattern (fit once on the scheduled full pass, apply everywhere, travel with the model version) rather than ad-hoc stats, so incremental runs and the UI's on-demand scores can never skew from the nightly stats. |
| §6.1 steps 7–8 — persist + `ScoreRecomputeRun` | Bespoke run record | Keep `Score`/`ScoreFactorContribution`/`ScoreHistory`/`ScoreBandTransition` as designed. `ScoreRecomputeRun` becomes a **thin wrapper referencing the RSP `MJ: Process Runs` record** (`ProcessRunID` FK) — counts/duration/cost come from the tracker; Sonar adds only model-semantic fields (stats version, calibration basis). |
| §6.2 — scheduled / incremental / on-demand strategy | Bespoke orchestration | **RSP sources + MJ Scheduling.** Scheduled full pass = RSP run over a `ViewSource`/`FilterSource` population on a schedule; incremental = RSP run over a changed-records source (MJ entity change tracking); on-demand single record = RSP `SingleRecord` scope or direct engine call. The staleness rule (incremental reuses last full-pass stats; flag `IsStale` on drift) is unchanged — it lives in the Sonar processor, not the substrate. |
| §7.5 — lift measurement / holdouts | Bespoke `ControlGroupPercent` + outcome tables | **PS Experiment primitives.** Interventions register an `Experiment`; holdout assignment and treatment/control outcome measurement ride `ExperimentSession`/`Iteration`. `InterventionAssignment`/`InterventionOutcome` stay as Sonar's domain projection, but the measurement math and "honest metrics" discipline are PS's, shared with model training — one lift methodology platform-wide, which is exactly the credibility the performance-fee model needs. |
| §8 — Recompute Orchestrator agent | Agent owns planning + running recompute within budget | **Shrinks to a planner.** RSP + Scheduling own execution; the agent's remaining job is model-level planning (which models, which cadence, budget allocation) and anomaly triage. KPI unchanged. |
| §8 — Re-weight Advisor (Phase 2+) | From outcome data, proposes weight adjustments | **Rides PS `ExperimentOrchestrator`** (leaderboard / pruning / budgeted wave loop) instead of bespoke search. Also enables an honest upgrade path: hand-set weights → PS-suggested weights → (opt-in, later) PS-trained model *as* the combine step, with the rubric retained as the explainable default. |
| §4.5 package layout — `sonar-server` resolvers + GraphQL clients | Hand-written resolver + client pairs | **Remote Operations.** "Score this record now," "run model," "pause/resume run," "preview rubric change," and the admin control surface are RO declarations (typed input/output, client+server invocation, `LongRunning` progress) — no bespoke resolver/client layer. Keep plain entity CRUD on the generated layer as-is. |

## 3. What stays exactly as designed (the product)

- **Configuration-as-data** and the uniform Factor contract (§4.3) — unchanged; this refactor strengthens it (factors now bind declarative-PS, RSP-Action, or PS-model backends behind the same contract).
- The **rubric engine**: `ModelFactor` weights/modes (additive/multiplier/gate/penalty/bonus), caps/floors, `TrendWeight`, `MissingDataPolicy`, `CombineStrategy`, bands, transitions.
- **Explainability spine**: `ScoreFactorContribution` + Explainer agent + `ExplanationSummary`.
- **Write-back**: `WriteBackTarget`/`Policy`/`Log`, band-change-triggered.
- **Action layer v1**: segments, interventions, drafting agents (execution unchanged; only measurement moves to PS Experiments).
- **Calibration network** (BC SaaS): `FactorArchetype`/`BenchmarkDistribution`/consent — unchanged, still the SaaS moat.
- **Authoring UX** (§7.1 three modes) and the **Model Builder agent** — unchanged; note the Model Builder should also emit PS feature definitions where factors are declarative.

## 4. Schema deltas (for the migration author)

1. `Factor`: **add** `MLModelID UNIQUEIDENTIFIER NULL` (FK → `MJ: ML Models`) and `FeatureDefinitionRef` (link/ID into PS feature assembly config); **remove** `MaxConcurrency`, `RateLimitPerMinute`, `ExecutionMode` (→ RSP processor config); **keep** `CacheTTLSeconds`, `IsExpensive` (budget hint surfaced to RSP).
2. `ScoreRecomputeRun`: **add** `ProcessRunID` FK (→ `MJ: Process Runs`); **remove** duplicated counters now sourced from the tracker; **add** `StatsVersion`/`CalibrationBasis`.
3. `Intervention`: **add** `ExperimentID` FK (→ `MJ: Experiments`); `ControlGroupPercent` remains as the configuration input PS consumes.
4. New CHECK on `Factor.FactorType`: `'Declarative' | 'ActionBacked' | 'MLModel'`.

## 5. Punch-list resequencing

1. **Spike (1–2 days):** express two representative declarative factors (event-attendance count/12mo; dues-recency) as PS feature definitions and score a 10K-anchor population through an RSP run end-to-end. This validates the two load-bearing reuse claims before anything else is built.
2. Migration v2 with §4 deltas (before CodeGen, per repo rules).
3. `SonarFactor` RSP work type + processor (normalize/combine/band/persist steps live here).
4. RO declarations for run-control + on-demand scoring.
5. Rubric compiler + explainability (unchanged scope).
6. UX + Model Builder agent (unchanged scope).

**Acceptance criteria for calling the refactor done:** no Sonar-owned code implements batching/concurrency/rate-limit/budget logic (RSP owns it); no factor computation path exists outside PS assembly or the RSP work type (single-path guarantee); nightly-vs-on-demand scores are bit-identical for unchanged inputs (fitted-stats guarantee); intervention lift numbers come from PS Experiment records (one methodology).

## 6. Open questions for review

1. Does PS's aggregation vocabulary need recency-decay and rate/trend additions upstream in MJ, or do we wrap locally first? (Preference: upstream — other apps want them.)
2. Calibrated normalization (`BenchmarkDistribution` as basis) — extend PS preprocessing or keep in the Sonar processor? (Lean: Sonar processor; it's SaaS-leg-specific.)
3. Do we rename anything user-facing? (No — this is plumbing; the §1–§3 product story is untouched.)
