# What Sonar Brings to Predictive Studio

**Audience:** an engineer working on Predictive Studio (PS) who does not know Sonar and needs to evaluate what Sonar has built that is worth pulling into PS.

**Status:** analysis, grounded in a code audit of both sides: current Sonar source (`packages/Engine`, `packages/Actions`, `packages/Entities` under this repo) and MemberJunction 5.45.0 as installed (`node_modules/@memberjunction/predictive-studio*`, `record-set-processor*`, `@memberjunction/core`). Nothing is wired between them yet.

**How to read this:** §0 is a 90-second Sonar primer and a Sonar↔PS vocabulary map. **§A is the point of the doc**: the concrete capabilities Sonar can contribute up to PS, each with how Sonar does it, the exact PS gap, where it lands in PS, and effort. §B onward is the reverse direction (what Sonar would consume from PS) and the migration mechanics, included as context.

---

## §0. Sonar in 90 seconds

Sonar is a configurable, explainable **engagement-scoring engine** (an MJ Open App on schema `__mj_BizAppsSonar`). An operator defines a scoring model entirely as data:

- an **anchor entity** (who gets scored: members, donors, chapters, learners),
- a set of **factors** (signals, e.g. "event registrations in the trailing 90 days", "days since last login"),
- a **rubric** (per-factor weights),
- **score bands** (qualitative tiers: Healthy / Watch / At Risk / Critical).

At recompute the engine resolves the population, evaluates each factor over it, normalizes each to a 0..1 contribution, combines them as a **weighted sum** into a 0..100 score, assigns a band, and persists a **per-factor contribution breakdown** so every score is explainable ("73, down 12, because cert renewals lapsed"). Scores are tracked over time (history, trend, band transitions).

Two facts make Sonar relevant to PS:

1. **A Sonar "factor" is what PS calls a "feature".** Behind one interface, `IFactorEvaluator.evaluateBatch(anchors, asOf, ctx) → Map<anchorId, FactorResult>` (`packages/Engine/src/contracts/IFactorEvaluator.ts`), there are two implementations: **declarative** (compiled to set-based SQL, `factors/FactorCompiler.ts` + `factors/factorSql.ts`) and **Action-backed** (arbitrary approved MJ Action code, `factors/ActionFactorEvaluator.ts`). `FactorResult = { rawValue, normalizedContribution, hadData, explanation }`.
2. **A Sonar "model" is a glass-box rubric** (hand-weighted, no training), where a PS model is a trained black box. Most of what Sonar can give PS flows from that difference.

Engine layout: `packages/Engine/src/` → `factors/` (compile + evaluate), `normalization/` (raw → 0..1), `scoring/` (rubric, bands, trend, explainability), `orchestration/` (population, recompute, persistence). It is cleanly split into pure (unit-tested, no I/O) and I/O-glue layers, with a real test suite in `__tests__/`.

### §0.1 Vocabulary map

| Sonar | PS equivalent | Note for a PS dev |
|---|---|---|
| Factor | Feature | a column in the feature matrix |
| Declarative factor | `select` + `DatedFeatureSpec` step | Sonar compiles to SQL; PS assembles rows in TS via `IFeatureDataAccess` |
| Action-backed factor | closest is `flow-agent` | Sonar: any Approved MJ Action satisfies the feature contract |
| Rubric (`ScoreModel`) | `MJ: ML Model` | Sonar = glass-box weighted sum, no training data; PS = trained model |
| `ModelFactor.Weight` | (none) | Sonar's weights are operator-set, not learned |
| Normalization (7 methods) | `PreprocessingOp` (impute/standardize/onehot/bin) | Sonar has a wider transform set |
| `ScoreFactorContribution` | (none) | per-record "why"; PS has only global feature importance |
| Score band / transition | (none) | qualitative tier + threshold-crossing event |
| `RecomputeOrchestrator` | `ScoreRecordSet` op over RSP | batch-score a population |
| `ScoreHistory` / trend | (none) | score-over-time trajectory |
| (none) | `ExperimentOrchestrator`, honest holdout | PS has this; Sonar does not |

---

## §A. What Sonar contributes to PS

Ranked by leverage: how concrete it is, and how big a PS gap it closes. Each entry: **what Sonar has** (with code), **the PS gap** (with PS symbol), **where it lands in PS**, and **effort**.

### 1. As-of time-window aggregates  ·  the single highest-leverage contribution
- **What Sonar has:** `factors/factorSql.ts:buildAggregateExpression` compiles a full aggregate set over a related entity as of a date: `Count, Sum, Avg, Min, Max, DistinctCount, Exists, Recency` (days-since-most-recent). Windows (`resolveWindow`): `Rolling` (trailing N days), `Calendar` (month/quarter/year), plus per-anchor `SinceEvent` / `RenewalRelative` (gated on a `DateField`). It runs as one set-based SQL query for the whole population, shredding the anchor keys in via `OPENJSON` (no parameter-count ceiling, composite-key safe). `RatePerPeriod` and `TrendSlope` are enum values not yet built.
- **The PS gap:** `predictive-studio/dist/feature-assembly` `DatedFeatureSpec.Aggregate` supports **exactly two** kinds: `days_since_last_activity`, `activity_count` (implemented as `daysSinceLastActivityAsOf` / `activityCountAsOf` in `feature-assembly/as-of.ts`). No sum/avg/min/max/distinct/windowed-count. This is PS's single thinnest surface.
- **Where it lands in PS:** extend the `DatedFeatureSpec.Aggregate` union and the executor's dated-source reducer with Sonar's aggregate + window vocabulary. PS assembles in TS over rows fetched through `IFeatureDataAccess.fetchRows` and clipped by `filterAsOf`, so the port is Sonar's aggregate/window *semantics* re-expressed over PS's row model (not the SQL itself). Sonar's `factorSql.ts` is the reference implementation for the exact semantics (tie handling, open-ended windows, recency = `DATEDIFF`).
- **Effort:** medium. **Why it matters most:** it is simultaneously PS's biggest feature-assembly gap *and* the load-bearing risk of any "Sonar factors become PS features" migration. Closing it de-risks the migration and improves every PS consumer at once.

### 2. A glass-box "rubric" model type
- **What Sonar has:** `scoring/ScoringEngine.ts:score()` combines weighted, normalized factor contributions as `normalizedScore = scaleMin + (Σ wᵢ·normᵢ / Σ wᵢ) × (scaleMax − scaleMin)`. It is an **interpretable, operator-authored model that needs no training data** and is explainable by construction. Weights are set by a human (or the authoring agent), not learned.
- **The PS gap:** PS only produces **trained black-box** models. The sidecar algorithm catalog (`predictive-studio-sidecar`, keyed to `MJ: ML Algorithms` `DriverClass`) is `xgboost | lightgbm | logistic_regression | random_forest | ridge | mlp`. There is no glass-box / hand-weighted scorecard model type.
- **Where it lands in PS:** add a `rubric` (linear scorecard) algorithm to the sidecar catalog whose "fit" just stores the provided weights (or, in search mode, fits a constrained linear model) and whose "predict" is the weighted sum. Because it flows through the *same* `TrainingEngine` → honest-holdout → `MLModelInferenceProcessor` path, PS's holdout, experiment, and `deriveTrustVerdict` machinery would measure a rubric exactly like an xgboost model. Bonus: **the re-weight advisor falls out for free** as an `IWaveStrategist` that proposes weight vectors, so `ExperimentOrchestrator` can *search* rubric weights against the honest holdout.
- **Effort:** medium (sidecar algorithm + a bit of wiring). **Payoff:** this expands what PS *is*, glass-box scoring for trust-sensitive / regulated domains, measured with the same rigor as the ML models.

### 3. Per-record explainability
- **What Sonar has:** every score persists a `ScoreFactorContribution` per factor (`rawValue`, `normalizedContribution`, `weightedValue`, `hadData`, `missingDataApplied`, `explanation`), and `ScoreHistory` freezes the breakdown as `ContributionsJSON` so a past score stays explainable even after the rubric changes. The single (de)serializer is `scoring/contributionDetail.ts`.
- **The PS gap:** `MLModelInferenceProcessor`'s payload is `{ modelId, target, problemType, score, class?, scoredAt }`, a raw score with **no per-record contribution breakdown**. PS has global `FeatureImportance` on the model, but nothing that says "*this* record scored 0.82 because feature X contributed +0.30".
- **Where it lands in PS:** define a per-record contributions array on the inference payload and populate it. For the rubric model type (#2) it is free (`wᵢ·featureᵢ`); for linear/logistic it is trivial; for tree models it needs a SHAP-style pass. Sonar's `ScoreFactorContribution` shape + the "freeze the why at score time" pattern is the reference output contract.
- **Effort:** low for linear/rubric, higher for trees. Ship it first for the model types where it is cheap.

### 4. Auto join-path resolution
- **What Sonar has:** `factors/FactorCompiler.ts` (`findAutoPathHops`, `resolveJoinPath`, `resolveFkPairs`) resolves the path from anchor entity to a related entity automatically: explicit path JSON, else a single-hop FK, else a BFS outward over reverse-FK edges in MJ relationship metadata, failing loud on unreachable (>5 hops) or ambiguous (≥2 shortest paths). It is composite-FK and composite-PK aware at every hop.
- **The PS gap:** PS `SourceBinding`s are specified by hand; there is no "figure out how this related entity joins to the target" helper.
- **Where it lands in PS:** a feature-authoring assist (design-time, not runtime) that proposes `SourceBinding`s from `{ targetEntity, relatedEntity }`. Reuses the same MJ relationship metadata PS already has access to.
- **Effort:** low-medium. Quality-of-life for PS feature authoring; pairs naturally with an authoring UI or agent.

### 5. Richer normalization / transform library
- **What Sonar has:** `normalization/normalizationStrategies.ts`, 7 strategies with param validation and a direction flag (`HigherIsBetter`), plus `toOutputRange`. Population-relative: `MinMax`, `Percentile` (midpoint tie handling), `ZScore` (±3σ clamp). Per-value: `Logistic` (sigmoid), `Banded` (bucket → fraction), `Lookup` (table + fallback). Plus `None`.
- **The PS gap:** PS `PreprocessingOp` is `impute | standardize | onehot | bin`, fitted in the Python sidecar. No percentile/minmax-to-range/logistic/banded/lookup.
- **Where it lands in PS:** the population-relative ones (`Percentile`, `MinMax`, `ZScore`) fit PS's fit-once/apply-everywhere model perfectly, add them as sidecar preprocessing ops that fit their stats (min/max, percentile table, mean/std) at train and apply at score. The per-value ones (`Logistic`, `Banded`, `Lookup`) are stateless and can be TS-side steps or sidecar ops. Sonar's strategy classes are the reference math.
- **Effort:** low-medium per op. Incremental; adopt the ones PS users ask for.

### 6. Bands, qualitative tiers, and transition detection
- **What Sonar has:** `ScoreBandSet`/`ScoreBand` entities (half-open `[min,max)` tiers, `Severity`, `ColorHex`, `IsTerminal`), `ScoringEngine.assignBand` (order-independent, top band inclusive), and `scoring/scoreTrend.ts:detectBandTransition` (Improving/Worsening vs the prior band, with a deadband). A score becomes an actionable **state**, and a threshold crossing becomes an **event**.
- **The PS gap:** PS emits a raw float. There is no tiering or "crossed a threshold since last run" concept.
- **Where it lands in PS:** an output-shaping option on a `ScoringBinding` (band thresholds → tier + a transition event against the previous stored score). This makes model output directly actionable and pairs with `MaintenanceEngine`'s scheduled re-scoring (transitions become the events a downstream action layer reacts to).
- **Effort:** low-medium. Optional per binding.

### 7. Missing-data nuance (`hadData`)
- **What Sonar has:** `FactorResult.hadData` deliberately separates a **real zero** (member is disengaged) from **absence** (no signal at all), and `ScoringEngine` applies a per-factor policy: `Zero` (counts as 0, stays in the denominator, a floor penalty), `NeutralMidpoint` (range-aware fill), or `Exclude` (dropped from numerator and denominator).
- **The PS gap:** PS `impute` is `mean|median|mode|constant`, absence silently becomes a value, with no "was this present?" signal and no policy beyond fill.
- **Where it lands in PS:** carry a per-column "present" mask through assembly and add a missing-data policy to the feature/preprocessing spec beyond simple impute. Reference: `IFactorEvaluator.ts` (`hadData`) + `ScoringEngine` policy resolution.
- **Effort:** medium (touches the assembly contract). High correctness value for engagement-style data where "no data" is common and meaningful.

### 8. Code-as-feature contract + promotion gate
- **What Sonar has:** `ActionFactorEvaluator.ts` lets an arbitrary MJ Action satisfy the **same** `IFactorEvaluator` contract as declarative SQL, behind a governance gate: an Action-backed factor must be `PromotionState='Approved'` before it can move persisted scores (`RecomputeOrchestrator.buildWeightedFactors`). The Action I/O contract is bound from `ActionParamsJSON` (which input is the anchor id, which is `AsOf`, which output is the value/explanation), with output coercion, range clamping + drift logging, and per-record error isolation.
- **The PS gap:** PS feature steps are a fixed set of kinds. `flow-agent` (agent-as-feature) is the closest, but there is no general "arbitrary approved code is just another feature, safety-gated" step.
- **Where it lands in PS:** a new `FeatureStepKind` (`action` / `custom-code`) that runs an Approved MJ Action per row or per batch, mirroring Sonar's contract + promotion gate. Adjacent to the existing `flow-agent` machinery, so much of the plumbing exists.
- **Effort:** medium. Extensibility unlock: lets PS users add a feature that SQL/standard steps cannot express, without forking the platform.

### 9. Author-a-feature-from-plain-English loop
- **What Sonar has:** `SonarAuthorFactorAction` + `actionsmith.shared.ts`, a working single-feature commissioning loop. It hands a Sonar `FACTOR_BRIEF` + the operator's plain-English description to MJ's stock ActionSmith agent, which writes, tests, and persists a `Runtime` MJ Action with `CodeApprovalStatus='Pending'`. There is an async variant (fire-and-poll via `AIAgentRun.Status`, cancellable) and a refine loop (`SonarRefineFactorActionAction`) and a sample-based test (`SonarTestSignalAction`).
- **The PS gap:** PS has `ModelingPlanSpec` + `PredictiveStudioPipelineBuilder` for plan-level authoring, but no per-feature "describe it in English → generate → test on a sample → promotion-gate" loop for a single custom feature.
- **Where it lands in PS:** adopt Sonar's generate→test→gate loop for the custom-code / flow-agent feature steps (pairs with #8). The `FACTOR_BRIEF`-over-ActionSmith pattern is the reference; the only PS-specific piece is the brief.
- **Effort:** medium. Depends on #8 existing.

### 10. Score-trajectory layer
- **What Sonar has:** `ScoreHistory` (append-only snapshot per recompute) + `scoring/scoreTrend.ts` (`computeDelta`, `trendDirection` with a deadband, `latestBaselinePerAnchor` for a window-ago baseline). A score is a time series, not a point.
- **The PS gap:** PS scores point-in-time; there is no first-class score-over-time / delta / trend concept.
- **Where it lands in PS:** a scoring-binding option that appends a history row and computes delta/trend against the prior score. `MaintenanceEngine` already re-scores on a schedule, so the trajectory is a natural add on top of it.
- **Effort:** low-medium.

### If only two things get upstreamed
**#1 (as-of aggregates)** and **#2 (glass-box rubric model type).** #1 closes PS's thinnest gap and de-risks the migration's load-bearing claim in one move; #2 expands what PS is. Everything else is incremental polish on top of those two.

---

## §B. The reverse direction: what Sonar would consume from PS

Context for the PS dev: here is why Sonar wants PS at all, i.e. the PS capabilities Sonar has *no* equivalent for and would adopt.

- **Honest / locked holdout** (carved in TS before any split, scored once), Sonar has no holdout or lift measurement. This underwrites a performance-fee commercial model.
- **Point-in-time / leakage protection**, `AsOfStrategy` + `filterAsOf` + `LeakageGuardEnforcer` + single-feature-dominance detection. Sonar has as-of factor windows but no leakage guard.
- **Experiments / backtesting**, `ExperimentOrchestrator` wave search with a budget gate. Sonar has nothing here.
- **`MaintenanceEngine`**, drift / retrain / challenger-vs-incumbent recommendations. (Caveat: the shipped drift detector is a row-count proxy; the `IDriftDetector` seam is there for a real one.)
- **`deriveTrustVerdict`**, grades a model and gates publish + business actions off an unmeasured model. Exactly the guardrail a performance-fee product needs.
- **Batch ML scoring** via the `'ML Model'` RSP work type, and **embedding / LLM / vision** feature steps.
- **Not available in either system:** probability calibration (no Platt/isotonic in PS). Net-new if wanted.

---

## §C. Migration mechanics (for whoever wires it)

The three sibling capabilities and how Sonar concepts map onto them. Only the first is Predictive Studio proper.

- **PS:** declarative factors → PS features (via #1 above); a rubric → the glass-box model type (#2); lift/re-weight → `ExperimentOrchestrator`.
- **RSP (Record Set Processing):** the Action-backed factor fan-out → a custom `SonarFactor` work type registered via `RecordProcessorRegistry.Instance.Register`. **Caveat:** RSP's write path is per-record `BaseEntity.Save()` and rejects composite-PK write-back, it is an orchestration substrate, not a bulk-write engine. Keep Sonar's set-based `ScoreWriter` (already built, see §D) for persistence.
- **Remote Operations:** `BaseRemotableOperation` (Sync / LongRunning with streamed progress) for the scoring/run-control surface. Sonar already ships one (`Sonar.RecomputeModel`, §D).

**No version bump required:** all three exist and are callable at 5.45.0 (latest 5.47.0). A bump only buys PS hardening.

---

## §D. Already built on the Sonar side (relevant to a PS dev)

- **`Sonar.RecomputeModel`**, a LongRunning `BaseRemotableOperation` with streamed progress (`packages/Actions/src/custom/SonarRecomputeModelOperation.ts`). A working reference for the Remote Operations pattern.
- **Set-based `ScoreWriter`**, MERGE + bulk insert for persistence (`packages/Engine/src/orchestration/ScoreWriter.ts`). This is the write-speed fix RSP does *not* provide; keep it regardless of RSP adoption.

---

## §E. Maturity reality (both sides)

**Sonar:** the rubric is **WeightedSum only** today (per-factor `WeightMode` / caps / floors / `TrendWeight` are schema fields the scorer does not yet consume). Aggregations built: Count/Sum/Avg/Min/Max/DistinctCount/Exists/Recency (RatePerPeriod/TrendSlope not). No calibration basis. Recompute is full-population Manual only (no incremental/scheduled yet). ~14 of the originally-planned ~30 tables exist; write-back, the intervention/action layer, calibration, and templates were specced but **never built**.

**PS:** the engine package self-describes as a "scaffold" and carries a stale internal version constant (`PredictiveStudioEngineVersion = "5.43.0"` in a 5.45.0 package, don't assert against it), but the training / scoring / experiment / maintenance subsystems under that banner are implemented and test-covered. Localized gaps, each with a seam: artifact storage is **local disk** (`LocalArtifactLoader`, not multi-host); drift is a **row-count proxy**; the `embedding` step returns null without a vector-store binding and `flow-agent` reads a persisted attribute rather than invoking live; `ComputeCost` is hardcoded 0.

---

## §F. Open questions for the PS dev

- Do Sonar's window aggregates (#1) best land as new `DatedFeatureSpec.Aggregate` kinds implemented in the TS row-reducer, or as an optional SQL-backed dated-source path in `IFeatureDataAccess`?
- For the rubric model type (#2): fit-stores-weights only, or also allow `ExperimentOrchestrator` to *search* weights (the re-weight advisor as an `IWaveStrategist`)?
- Does per-record explainability (#3) belong on the inference payload for all model types, or only where it is cheap (linear/rubric) with SHAP deferred for trees?
- Where should the "present" mask (#7) live in the assembly contract without bloating the common path?
