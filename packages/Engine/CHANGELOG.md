# @mj-biz-apps/sonar-engine

## 0.2.0

### Minor Changes

- b3ed75b: Open App release readiness: make Sonar cleanly installable via `mj app install`.

  - **Seed migration.** `mj app install` runs migrations only (it does not process `metadata/`), so a clean install previously got the schema but no app-level config. Added `V202607142340__v0.1.x_Seed_App_Metadata.sql` seeding all 182 app-metadata records (score band sets/bands, time windows, 23 actions + params + result codes, 3 queries, 1 remote operation, and the Sonar Authoring Agent). Verified end-to-end on a fresh core.
  - **Portable AI model.** The authoring agent ships without a pinned model (`RequireSpecificModels=0`), so it runs on whatever AI model the host has configured instead of a hardcoded vendor.
  - **Caret peer ranges.** MJ peer dependencies moved from exact `5.45.0` to `^5.45.0` across all packages, so the app installs against any compatible `5.45.x`+ host without forcing a duplicate MJ install.
  - **Honest version range.** `mjVersionRange` corrected to `>=5.45.0 <6.0.0`, the version Sonar was actually built and verified against.

- d13067b: Engine v1 feature layer + `Factor.DateField` schema.

  Adds the engine capabilities the Sonar app needs on top of the action-factor engine, plus the one v1 schema change:

  - **Composite / entity-agnostic anchor keys** — `anchorKey.ts` builds identity on MJ's `CompositeKey` (collision-safe canonical string + type-faithful JSON + per-column values for OPENJSON), so single- AND multi-column-PK anchors both score end-to-end. `resolvePopulation` drops the single-column guard; the set-based factor query stages the population via a temp table instead of an inline `IN (…)` list (kills the ~2100-value ceiling + the string-interpolation workaround); `ScoreWriter` persists `AnchorRecordKeyJSON`.
  - **`Factor.DateField`** — new nullable column (migration `V202606241200`) naming the related-entity activity-date column a windowed factor filters on. Frees `TimeWindow.AnchorDateField` to mean only the anchor boundary date; wires `SinceEvent`/`RenewalRelative` windows.
  - **Action-output clamping** (`clampToRange`) — an action factor's value is clamped to its declared output range, flagging contract drift.
  - **Explainability threading** — a factor's "why" rides `FactorResult.explanation` → contribution → persisted `ScoreFactorContribution.DetailJSON`.
  - **Score trend + history persistence** — every recompute writes an immutable `ScoreHistory` snapshot and, when an anchor's band changes, a `ScoreBandTransition` row; the current `Score` also carries `Delta` / `TrendDirection` / `DataCompleteness` vs. the trend-window baseline. This is what backs the Overview trend, per-anchor sparklines, and the "movers" feed. The trend math (delta, direction deadband, baseline reduction, band-change detection) lives in a pure, unit-tested `scoreTrend` module — `ScoreWriter` just does the entity plumbing.

  Generated entities/resolvers/forms + the GraphQL schema are regenerated for the DateField column (clean — no intervention/demo entities). The CodeGen SQL (regenerated `vwFactors` view, Factor CRUD procs, FK indexes, and the DateField EntityField metadata) is appended into the migration file per convention. Verified end-to-end: Initial + DateField migrations apply cleanly on a fresh clean-MJ database.

### Patch Changes

- 7faa852: Add Action-backed factors to the engine (the escape hatch, plan §5.2/§7.2): a factor whose value is produced by an MJ Action instead of set-based SQL, behind the same `IFactorEvaluator` seam so scoring/normalization/explainability never branch on factor kind. Plus the `Exists` / `Recency` declarative aggregations.

  - `ActionFactorEvaluator` (pure, unit-tested via an injected `ActionRunner`) — PerRecord execution with a bounded-concurrency pool and per-record error isolation (a per-anchor failure = no-data, not a dead run). `actionRunner.ts` is the one I/O seam (wraps `ActionEngineServer`).
  - Promotion gate: an Action-backed factor must be `PromotionState='Approved'` to move PERSISTED scores (recompute); a no-persist preview runs un-approved drafts so authors can test first.

  **⚠ SCALE CEILING — read before running action factors on real populations.** An Action-backed factor fires **one Action call per anchor** (PerRecord; MJ has no batch RunAction). Once full-population scoring is in, a model with an LLM-/external-API-backed factor makes **N = entire population** calls per recompute (10k members ⇒ 10k calls). The concurrency cap bounds _parallelism only_ — **not total cost or latency**. Cross-run result caching (`CacheTTLSeconds`), `IsExpensive` budgeting, and rate limiting are **NOT implemented yet**. The orchestrator now emits a loud `LogStatus` when a single action factor's fan-out exceeds `ACTION_FACTOR_POPULATION_SOFT_CAP` (1000), so an expensive run can't happen silently — but treat that as a warning, not a guard. **Do not run external-API/LLM action factors against large non-demo populations until a real budget/cache guard lands.** (Combined with the inline-`IN`-list ceiling from the scoring-pipeline PR, an action-backed model has two independent scale limits to clear before it's production-safe.)

  **Review follow-ups (this revision):**

  - **Publish-time governance gate (#2):** `ScoreModelEntityServer.validatePublishable` now blocks publishing a model whose rubric contains a non-Approved Action-backed factor. Previously such a model could publish and then throw on _every_ persisted recompute (the engine requires Approved action factors), surfacing the failure at run time instead of publish time. This keeps the two consistent: if it published, a recompute won't fail the whole run on an un-promoted action factor. **All-or-nothing is intentional** (matches the engine) — silently excluding an un-approved factor would change the model's scoring behind the operator's back; the gate is loud, not lossy.
  - **Configurable `asOfParam` (#4):** the as-of input name is no longer hardcoded `"AsOf"` — it's read from `ActionParamsJSON.asOfParam` (default `"AsOf"`), alongside `anchorParam`/`outputParam`. A bound Action must declare this input.
  - **Output coercion contract (#5):** the Action output → numeric raw value mapping is now an explicit, unit-tested `coerceOutput`: number passthrough (NaN/Infinity → null), boolean → 1/0 (Exists-style), **empty/whitespace string → null = no-data** (not a hard 0 — it now falls to the missing-data policy), other non-numeric → null.
  - **Merge-order coordination with the full-population scoring PR (#3):** that PR changed `score(spec, factors)` → `score(spec, factors, population)` and added missing-data fields to `WeightedFactor`, editing the same `buildWeightedFactors`/`computeForModel` this PR touches. Merged `next` in: the resolution preserves BOTH the missing-data threading (per-factor `missingDataPolicy`/`outputMin`/`outputMax`, 3-arg `score`) AND this PR's `requireApprovedActionFactors` gate + cost-ceiling warning in the same loop. The integration test (`actionFactor.test.ts` → "action factor + missing-data policy → scoring") now asserts the actual `MissingDataPolicy` (Zero fills 0 in-denominator; Exclude drops the factor from the anchor's denominator).

- b0508e8: Add the sonar-engine scoring pipeline (compute stages, plan §6.1):

  - `IFactorEvaluator` / `FactorResult` — the single contract through which every factor (declarative or Action-backed) is evaluated.
  - `FactorCompiler` + `CompiledFactorEvaluator` — translate a declarative factor's config into one set-based SQL query and run it (v1: Count/Sum/Avg/Min/Max/DistinctCount aggregations with config-field validation, single-hop foreign-key join, rolling + all-time time windows).
  - `compileFilter` — compiles a `FilterExpression` (Kendo-compatible filter descriptors, matching `UserView.FilterState`) into a **parameterized** WHERE fragment, validating every field against the related entity's columns (typo + injection guard).
  - `NormalizationEngine` — fills `normalizedContribution`: `None` passthrough plus the population-relative `MinMax`, `Percentile` (rank with midpoint tie-handling), and `ZScore` (standardized, clamped to ±3) — with direction (`HigherIsBetter`) and output-range scaling.
  - `ScoringEngine` — combines normalized contributions via rubric weights into a 0–100 score, assigns a band, and emits a per-factor contribution breakdown for explainability (v1: WeightedSum, missing-factor-as-zero).

  - `RecomputeOrchestrator` + `ScoreWriter` — the conductor. `computeScores` runs the full pipeline (resolve population → evaluate + normalize each factor → combine) and returns scores; `recompute` additionally persists them: records a `ScoreRecomputeRun`, upserts each `Score` (keyed by model+anchor), and replaces its `ScoreFactorContribution` rows (requires a published model — stamps `ScoreModelVersionID`). `previewFactor` evaluates a single _unsaved draft_ factor over the population without persisting, reusing the same compile→normalize path so a builder's live preview matches the eventual score.

  The pure stages are unit-tested (vitest). v1 scope is deliberately narrow and fails loud outside it: WeightedSum models, full-population scoring from live config, row-by-row persistence (the scale path is set-based stage→MERGE + change-only diffing, not workers). Deferred: multi-hop joins, calendar/renewal-relative time windows, the remaining normalization methods (`Logistic`/`Banded`/`Lookup`), Action-backed/derived factors, `ScoreHistory`/`ScoreBandTransition`, scheduling.

  **Review follow-ups (this revision):**

  - Band assignment is now deterministic at shared boundaries: `ScoringEngine.assignBand` uses half-open ranges `[min, max)` with the top band inclusive, so a score on an adjacent-band edge always resolves to the upper band regardless of band query order (`loadBands` also orders `MinScore ASC`).
  - `resolvePopulation` explicitly rejects composite (multi-column) primary-key anchors rather than silently truncating to the first PK column.
  - Anchor IDs inlined into the `IN (…)` list are single-quote-escaped, closing a SQL-injection surface for string/varchar anchor PKs. (The full table-valued-parameter swap — true parameterization, honest non-UUID-PK typing, and the ~2100-parameter limit — remains a follow-up, as does computing from the immutable version snapshot rather than live config.)
  - Rolling windows now accept a length in **months** (`LengthMonths`), not just days: when set, the predicate uses `DATEADD(month, -N, @asOf)` and months take precedence over days. It uses `DATEADD(month)` rather than an `N×30`-day approximation, so a "Trailing 12 Months" window lands on the exact calendar date regardless of how long the intervening months are. Previously a month-based window threw (the code only read `LengthDays`). NOTE: this is only the window _length_ — _which date column_ a Rolling window filters on is the separate `Factor.DateField` decision, roadmapped for the next major migration (the `AnchorDateField` bridge is the interim).

- ea53114: Score the full population, with a per-factor missing-data policy and a model-level population filter.

  The engine pipeline (#2) scored only anchors that had data for at least one factor, and a missing factor silently contributed 0. That conflates "no engagement" with "not in scope" and makes fully-inactive members vanish from the results instead of surfacing at the floor. This PR makes scoring population-complete and gives missing data an explicit, configurable meaning:

  - **Full-population scoring** — `ScoringEngine.score` takes the resolved population and scores _every_ anchor, not just those with data. An anchor with no countable factors returns null (nothing to score) rather than being silently dropped.
  - **Missing-data policy** (per factor, from `Factor.MissingDataPolicy`): `Zero` counts an absent factor as 0, `NeutralMidpoint` as 0.5 (both keep the weight in the denominator, so missing data pulls the score), and `Exclude` drops the factor from both numerator and denominator (the anchor is scored only on the factors it has). Each contribution records whether it was measured or filled by policy, for explainability.
  - **Population filter** — `ScoreModel.PopulationFilter` narrows which anchors get scored (e.g. "active members only"), compiled to a validated WHERE fragment via a new `compileFilterInline` (same field-whitelisting + parameterization guarantees as the factor filter compiler).

  Pure stages stay unit-tested (`ScoringEngine` + `filter` suites). Engine-only; no schema, action, or UI changes — `Factor.MissingDataPolicy` and `ScoreModel.PopulationFilter` are existing columns this PR begins honoring.

- 069db79: Upgrade all `@memberjunction/*` dependencies to exact `5.45.0` (latest), moving Sonar onto the current MemberJunction platform.

  **Requires the database core to be at MJ 5.45.** Packages and the `__mj` core schema must match — the server generates its GraphQL from DB metadata and the AI engine reads agent config from core tables. Bring a database up with:

  ```
  mj migrate --tag v5.45.0        # __mj core -> 5.45 (Skyway baseline + delta)
  mj migrate --schema __mj_BizAppsSonar --dir ./migrations   # Sonar app schema
  mj codegen                      # register entities, build views/sprocs
  ```

  Notes:

  - **Exact pins, not caret** — MJ publishes exact sibling versions, so a single `^` cascades the whole tree (and creates nested dual-core copies). Every `@memberjunction/*` is `"5.45.0"`.
  - Verified end-to-end against a freshly-provisioned 5.45 database (clean boot with no metadata skew, all surfaces render, copilot agent runs and replies).
  - Supersedes the interim 5.41.0 alignment (which matched an older demo DB). 5.45 is the current platform; the DB is migrated forward to match rather than pinning packages back.

- e0ae207: Add Tier-B normalization methods (`Logistic`, `Banded`, `Lookup`) behind a strategy registry.

  The four population-relative methods shipped with the engine pipeline (`None`/`MinMax`/`Percentile`/`ZScore`) cover "scale relative to the group," but some signals need a fixed, configured shape independent of the population:

  - **Logistic** — squashes a raw value through a logistic curve (configurable midpoint + steepness); good for "diminishing returns" signals where the first few events matter most.
  - **Banded** — maps raw-value ranges to fixed output points (a step function); good when the business defines explicit tiers.
  - **Lookup** — maps discrete raw values to output points via an explicit table; good for categorical/coded inputs.

  To add these without a growing `switch`, `NormalizationEngine` is refactored into a thin dispatcher over an `INormalizationStrategy` registry — each method is a self-contained strategy (population-relative ones consume the whole population in one pass; fixed-shape ones are per-record). Per-method config is parsed and validated up front (`parseNormalizationParams`), so malformed config fails loud rather than silently mis-scaling. Pure (no I/O), fully unit-tested.

  The public normalization surface (`NormalizationEngine`, `NormalizationSpec`, param types, the parser) is unchanged for consumers — the registry split is internal.

- Updated dependencies [86a6697]
- Updated dependencies [069db79]
- Updated dependencies [b3ed75b]
- Updated dependencies [d13067b]
  - @mj-biz-apps/sonar-entities@0.2.0
