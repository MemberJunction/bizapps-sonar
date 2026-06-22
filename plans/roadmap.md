# Sonar — Coverage Matrix & Roadmap

**Purpose:** an honest map of what plan.md promises vs. what the code actually does today, and a
sequenced path forward. Cross-checked against the real schema (14 tables in the initial
migration), the `sonar-engine` source, and the Angular surfaces as of this writing.

**Read alongside:** [`plan.md`](plan.md) (the requirements) and [`engine.md`](engine.md) (how the
engine + factors actually work today).

## Two reference bars (don't conflate them)

1. **MVP-now (the agreed demo bar — detailed below):** an internal/stakeholder demo of the *core
   explainable loop* — author a model → factors → simulate → publish → recompute → triage →
   explain — on Pattern-1 data, single-model focus. **Mostly met.**
2. **plan.md "Commercial-ready v1" = close of Phase 1 (§11):** the whole single-tenant product
   *including the action layer* (segments → interventions → holdout-measured lift), Action-backed
   factors + promotion gate, write-back, AI authoring agent, and one ModelTemplate. **Largely not
   started** — the action layer, which the plan insists is v1, is the biggest gap.

Status legend: ✅ built & working · 🟡 partial (works for a subset) · 🟦 schema/table exists but
unused by code · ⬜ not started.

---

## Staged PR rollout off `next`

The big integration branch (`sonar_app_nav`) is being broken into small, reviewable PRs. `sonar_app_nav` is the source of truth; each PR is path-checked out of it onto a fresh branch cut from `next`, built, and verified in isolation.

| PR | Scope | Depends on | Status |
|---|---|---|---|
| #1 | Initial schema migration + generated entities | — | ✅ merged |
| #2 | `sonar-engine` scoring pipeline (`packages/Engine`) | — (leaf) | 🟦 open |
| #3 | ScoreModel server hooks (`CoreEntitiesServer`) + seed metadata (`metadata/` minus `actions/`) | entities | 🟦 open |
| #4 | **Actions** — `packages/Actions` + `metadata/actions/` | **#2 merged** (imports engine) | ⬜ next up |
| #5 | **Angular UI** — `packages/Angular` (~41 files) + `apps/MJExplorer/index.html` + `apps/MJAPI/schema.graphql` | #2–#4 | ⬜ |
| #6 | **Docs + demo sandbox** — `plans/` (consolidated docs) + `demo/` (Pattern-1 membership schema, seed, clone/apply scripts) + `scripts/` | — | ⬜ |

**Notes:**
- **#4 is the first merge-blocked PR** — `packages/Actions` imports `@mj-biz-apps/sonar-engine`, so it can't build off `next` until #2 lands. Options: wait for #2, or stack the actions branch on `sonar_engine_pipeline`.
- **`metadata/actions/` rides with #4, not #3** — registering Action DriverClasses without the action code on `next` would create non-runnable rows. `.mj-sync.json`'s `directoryOrder` already lists `actions`, so #4 drops in with no config edit.
- Changesets are authored fresh per PR (one per published package touched); metadata and docs need none (not npm packages).
- **CI gap (deferred):** `build.yml` builds packages but runs no tests, so the engine's vitest suite isn't gated in CI. Wiring a `turbo test` task + a `build.yml` test step is an independent improvement, not yet scheduled.

---

## MVP scope & product shape (the agreed bar)

- **Audience:** internal / stakeholder **demo** (and a hand-held design-partner association).
  Not self-serve, not multi-tenant-hardened. SQL/engine robustness can come later, but the
  declarative-factor capabilities must be documented (→ [`engine.md`](engine.md)).
- **Data integration:** **Pattern 1 only** — business data lives in the MJ database as a schema,
  registered via CodeGen. (Pattern 2 / in-place via organic-key joins is deferred — and, per the
  demo notes, is on the *critical path to real-world adoptability*, so it's a notable roadmap item.)
- **Single-model focus.** Scores are **per-model** (own anchor, 0–100 scale, band set) and **not
  comparable across models**, so the app is model-scoped: the model is the primary navigation
  context, a shared "current model" drives every surface, and Overview is the selected model's
  dashboard (not a picker). Member-360 and org-wide rollups are deferred (need deliberate design).
- **Reflect vs. manage.** Version history *lives in* the Model Builder (publish/rollback =
  lifecycle); the sidebar/Overview only **reflect** the current version, never duplicate the
  management UI. This rule resolves surface overlap.
- **Explicitly deferred (parked, not forgotten):** template *system* (MVP keeps a seeded example
  model), engine maturity (full MissingDataPolicy, normalization beyond None/MinMax/Percentile/
  ZScore, Action-backed & LLM factors, multi-hop joins, combine strategies beyond WeightedSum),
  Pattern 2 / member-360 / org rollups, and production hardening (auth scoping, perf, RBAC).

---

## Coverage matrix (by plan.md section)

### §5.1 Configuration entities
| Capability | Status | Notes |
|---|---|---|
| `ScoreModel` | ✅ | CRUD via UI; create/publish/setBandSet/data-sources all work. |
| `ScoreModelVersion` (immutable snapshot) | 🟡 | Created on publish + listed in publish modal. `ConfigSnapshotJSON`, rollback, version-diff not built. |
| `ModelRelatedEntity` | ✅ | Add/remove data sources wired. `RelationshipPath` is empty (single-hop only). |
| `ScoreBandSet` / `ScoreBand` | ✅ | Band builder works; bands drive distribution + colors. |
| `PopulationFilter` | ✅ | Authored in the builder (real anchor columns), persisted on the model, and applied by the engine (compiled to a SQL `WHERE` over the full anchor entity). |
| ScoreModel inert columns | 🟦 | `RecomputeMode/Cron`, `AsOfStrategy`, `IsCalibrated`, `TrendWindowDays`, `EffectiveFrom/To`, `CombineExpression` exist but are unused by the engine. |

### §5.2 Factors & windows
| Capability | Status | Notes |
|---|---|---|
| Declarative factors | 🟡 | `Count/Sum/Avg/Min/Max/DistinctCount` work. `Recency/RatePerPeriod/Exists/TrendSlope` ⬜. |
| `TimeWindow` | 🟡 | `Rolling` + `AllTime` compile. `Calendar/SinceEvent/RenewalRelative` ⬜. |
| `ModelFactor` weight | ✅ | Weight + live tuning work. |
| `ModelFactor.WeightMode` | 🟡 | Penalty **hidden in the UI** (additive-only) so it no longer implies behavior the engine lacks; engine is WeightedSum only. Penalty/Multiplier/Gate/Bonus deferred to the `ICombineStrategy` work; field retained. |
| Caps/floors, `TrendWeight` | ⬜ | Columns exist; engine ignores them. |
| `MissingDataPolicy` | ✅ | Engine honors it per `ModelFactor`: **Zero** (count 0, keep weight — default via `ModelDefault`), **NeutralMidpoint** (0.5), **Exclude** (drop from numerator + denominator). Full population scored so no-data members surface at the floor; `MissingDataApplied` persisted. |
| Normalization | 🟡 | `None/MinMax/Percentile/ZScore` ✅. `Logistic/Banded/Lookup` ⬜ (storage `NormalizationParamsJSON` ready). |
| ActionBacked / DerivedFromScore / Constant factors | ⬜ | Only `Declarative` implemented. The uniform `IFactorEvaluator` contract exists, so the seam is ready. |

### §5.3 Runtime output
| Capability | Status | Notes |
|---|---|---|
| `Score` | 🟡 | Persisted on recompute. Trend/`Delta`/`Confidence`/`DataCompleteness`/`PreviousScore`/`ExplanationSummary` left null. |
| `ScoreFactorContribution` | ✅ | Written + read (powers the explainability waterfall). |
| `ScoreHistory` | 🟦 | Table exists; **never written** → no trajectory/trend anywhere. |
| `ScoreBandTransition` | 🟦 | Table exists; **never written** → no "movers" / band-crossing events. |

### §5.4 Recompute & audit
| Capability | Status | Notes |
|---|---|---|
| `ScoreRecomputeRun` | ✅ | Written per recompute (status, counts, duration). |
| `ScoreModelAuditEvent` | 🟦 | Table exists; config changes are not audited. |

### §5.5–5.8 (action governance, action layer, calibration, templates)
| Capability | Status | Notes |
|---|---|---|
| Action governance + write-back (`ActionPromotion`, `WriteBackTarget/Policy/Log`) | ⬜ | No tables, not built. |
| **Action layer** (`ScoreSegment` → `Intervention` → holdout → `InterventionOutcome`) | ⬜ | No tables, not built. **This is plan.md's v1 "product" and the biggest gap.** |
| Calibration network (`FactorArchetype`, `BenchmarkDistribution`, `CalibrationConsent`) | ⬜ | Phase 3; not built. |
| `ModelTemplate` system | ⬜ | No template entity; we have one *seeded example* model in the demo sandbox instead. |

### §6 Scoring engine (`sonar-engine`)
| Capability | Status | Notes |
|---|---|---|
| `FactorCompiler` (declarative → set-based SQL) | 🟡 | Single-hop joins, Rolling+AllTime windows, filter pruning. Multi-hop + recency decay ⬜. |
| `NormalizationEngine` | 🟡 | 4 of 7 methods (see §5.2). Calibrated/benchmark basis ⬜. |
| `ScoringEngine` | 🟡 | WeightedSum (weighted average) with a **per-anchor denominator** + **MissingDataPolicy** (Zero/NeutralMidpoint/Exclude) applied. WeightMode/caps/TrendWeight/other CombineStrategies ⬜. |
| `RecomputeOrchestrator` | 🟡 | compute + persist work. Population applies **`PopulationFilter`** (compiled to inline SQL) over the **full** anchor entity (`IgnoreMaxRows` — RunView otherwise caps at the entity's `UserViewMaxRows`=1000). On-demand preview ✅; scheduled/event-driven/incremental ⬜. |
| `ScoreWriter` | 🟡 | Writes Score + contributions row-by-row. Does **not** write ScoreHistory/ScoreBandTransition; no diff/bulk path. |
| Band + trend + confidence | 🟡 | Band assignment ✅. Trend/delta/confidence ⬜. |

### §7 Authoring
| Capability | Status | Notes |
|---|---|---|
| Visual builder | ✅ | Anchor, data sources, rubric, bands, population-filter UI (spike), simulate, recompute, publish, impact preview. |
| Formula escape hatch (`ExpressionDriven`) | ⬜ | Not built; `CombineExpression` inert. |
| AI-first authoring (Model Builder agent) | ⬜ | Phase 2+ placeholder panel only. |
| Action Builder / CodeSmith loop + promotion gate | ⬜ | Not built. |

### §8 AI agents
All ⬜ — Model Builder, Explainer, Recompute Orchestrator (as an agent), Dashboard Builder,
Intervention Drafter, Re-weight Advisor, Calibration Aggregator, Action Builder. None built.

### §9 Surfaces
| Surface | Status | Notes |
|---|---|---|
| Model Builder | ✅ | Rich; the strongest surface. |
| Engagement Manager | 🟡 | Live triage list + explainability drawer. No trend sparkline (needs ScoreHistory), no per-row top-driver, no filter, no segments/interventions. |
| Admin / Ops | 🟡 | Surface shell exists (~111 lines); content needs verification — likely placeholder, not wired to recompute/cost/promotion data. |
| Executive (read-only) | ⬜ | Not built. |

### Built *beyond* the plan (this session's additions)
IA backbone (model rail + shared current-model context), Overview single-model dashboard,
pre-publish impact preview, toast notifications, and the Core-Shared-Feature folder structure
(`custom/README.md`). These extend §9's intent; none conflict with the plan.

---

## Gaps to *close the MVP-now bar* (small, near-term)
1. **Capability docs — ✅ done.** [`engine.md`](engine.md) documents the scoring engine + declarative-factor capabilities (the MVP-bar requirement); [`demo.md`](demo.md) holds the demo script.
2. **Engagement Manager #4 polish** — per-row top-driver label + a band/score filter on the triage list. (Trend is out — needs ScoreHistory.)
3. **Shared "why this score" waterfall component** — currently duplicated in the builder preview and the EM drawer; the plan calls for one reusable component.
4. **Two UI-implies-behavior honesty bugs — ✅ resolved:**
   - **Population filter — wired.** Builder authors real anchor fields → persisted to `ScoreModel.PopulationFilter` → engine compiles + applies it (verified: 2,000 → 442 on `Industry contains "Cheese Production"`).
   - **Penalty weight mode — hidden.** "Hurts the score" removed from the UI; engine stays additive (penalty deferred to `ICombineStrategy`). *(Also fixed in passing: missing-data policy wired with a Zero default, and a RunView 1,000-row population cap.)*
5. **Schema scoping on the entity pickers** — exclude `__mj*` (MJ system + Sonar-infra) entities
   from the anchor / data-source pickers by default, with a config override. Today both pickers load
   *every* registered entity unfiltered, so system tables (`MJ: Users`, `Sonar: Score Models`) are
   selectable as factor sources — produces garbage / fails at query time, and becomes acute the
   moment a richer demo population lands. Mirrors the existing field-level `__mj_` filter in the
   factor builder. (Design note below.)

## Gaps to reach *plan.md Phase-1 "commercial v1"* (large, the real roadmap)
- **Action layer** (segments → interventions → holdout → measured lift) + Intervention Drafter agent — the headline v1 commitment.
- **Action-backed factors** runtime + `ActionPromotion` gate (the 20% escape hatch).
- **Write-back** (`WriteBackTarget/Policy/Log`) to ≥1 target.
- **AI Model Builder agent** (authoring from a sentence) + **Explainer agent** (`ExplanationSummary`).
- **Trend & history**: write `ScoreHistory` + `ScoreBandTransition`; compute Delta/TrendDirection/Confidence.
- **One real `ModelTemplate`** (Renewal Risk) + the template-install flow.
- **Recompute modes**: scheduled + event-driven/incremental (today: on-demand only).

---

## Wishlist / additions (yours + discussed — confirm & prioritize)
| Item | Type | Bar |
|---|---|---|
| ✅ Engine + factor-capability docs (your "explain the hard parts" add **and** the MVP-bar spec) | Doc (#2) | Done → [`engine.md`](engine.md) |
| Normalization Tier B (Logistic/Banded/Lookup) | Engine | Post-MVP |
| ✅ Population filter — wired (real anchor fields → persisted → engine applies) | Engine/UI | Done |
| ✅ Missing-data policy — wired (`ModelDefault`→Zero; Neutral/Exclude per-factor) | Engine | Done |
| Penalty weight mode — **hidden** in UI; engine wiring deferred to `ICombineStrategy` | Engine | Deferred (honesty kept) |
| Trend/history (`ScoreHistory`) → EM sparkline + "movers" | Engine + UI | Phase-1 |
| Plain-language AI summary (Explainer-lite) | AI | Phase-1 demo flavor |
| Exclude `__mj*` schemas from entity / factor-source pickers (+ config override) | UI + Engine | MVP-ish (demo data makes it acute) |
| ✅ Adopt MJ `AssociationDB` (American Cheese Industry Assoc.) as the **default** demo population | Demo/data | Done → installed + registered in `Sonar_Demo` (`--skipfiles`, no repo churn); now the default (see [`demo.md`](demo.md)) |
| **AI-generated custom Actions** — describe an action in natural language → **Action Builder** uses **CodeSmith** (MJ's codegen) to generate + test it → wrapped as a `Draft` **Runtime Action**, gated to `Approved` by `ActionPromotion` before a live model can use it. Plan frames this for `ActionBacked` *factors*; the brainstorm extends it to *intervention* actions too (mint "send re-engagement email", "create follow-up task", etc. on demand instead of binding a fixed catalog). | AI + Actions | Phase 2 (plan §7.3) — rides on the hand-bound action layer working first |

---

## Proposed sequence (impact × effort)

**Now — finish the credible demo (closes MVP bar):**
1. ✅ Done — `engine.md` (engine + factor capabilities) + `demo.md` (demo script) (workstream #2).
2. ✅ Done — population filter wired, missing-data policy wired (Zero default), penalty hidden; RunView 1,000-row population cap fixed.
3. EM top-driver + filter; extract the shared waterfall component.

**Next — the "trajectory" tier (unlocks several plan promises at once):**
4. Write `ScoreHistory` + `ScoreBandTransition` in `ScoreWriter`; compute Delta/Trend/Confidence.
5. EM trend sparkline + a "movers since last run" view (rides #4).
6. Normalization Tier B + remaining aggregations (Recency/Rate/Exists) — widen factor coverage.

**Later — the plan's v1 "product" (the defensible part):**
7. Action layer: `ScoreSegment` → `Intervention` → holdout → `InterventionOutcome` + lift; Intervention Drafter.
8. Action-backed factors + `ActionPromotion` gate.
9. Write-back to ≥1 target.
10. AI authoring agent + Explainer agent.
11. Admin/Ops wired to real recompute/cost/promotion data; Executive surface.

**Deferred (plan Phase 2–3):** CodeSmith generation, multi-model/`DerivedFromScore`, calibration
network, full templates.

---

## Score & outcome history — build plan (Phase A done; B–D pending)

The "trajectory tier" (sequence #4–5) and the prerequisite for the **action layer** (gives the
score-based outcome signal + trend/delta segments). **No migration needed** — `ScoreHistory`,
`ScoreBandTransition`, and `Score`'s `PreviousNormalizedScore`/`Delta`/`TrendDirection`/
`DataCompleteness` columns all already exist; this is pure engine + UI wiring.

**Phase A — engine (`ScoreWriter` + orchestrator).** ✅ *done (build clean, 44/44 tests pass)*
- Trend on `Score`: from the existing row (already loaded for diffing) set `PreviousNormalizedScore`,
  `PreviousBandID`, `Delta = new − prev`, `TrendDirection` (Up/Flat/Down, ±0.5 deadband),
  `DataCompleteness` (fraction of counted factors with real data). `TrendDirection`/`Delta` null on
  first-ever scoring (no prior).
- `ScoreHistory` snapshot per scored anchor each recompute. **Schema note:** the real `ScoreHistory`
  has no `ScoreID`/`RawScore`/`Delta` — it's the leaner set `ScoreModelID`/`ScoreModelVersionID`/
  `AnchorEntityID`/`AnchorRecordID`/`NormalizedScore`/`BandID`/`AsOfDate`/`ComputedAt`/
  `DataCompleteness`/`Confidence` + `ContributionsJSON`. `Delta` lives on `Score` only and is
  re-derivable from consecutive history rows, so no loss.
- `ScoreBandTransition` when `BandID` changes on an already-scored anchor. **Schema note:** real
  fields are `ScoreModelID`/`AnchorRecordID`/`FromBandID`/`ToBandID`/`Direction`/`OccurredAt`/
  `RecomputeRunID`/`Handled` — no `AnchorEntityID`/`Delta` column; `Direction` from `Delta` sign
  (≥0 = Improving), `Handled=false`. Run ID threaded through `ScoreWriter.write(…, runId)`.
- Deferred: `TrendSlope` (needs ≥2 history points), `Confidence` (needs a model) — left null.

**Phase B — read service.** ✅ *done (build clean)* `ScoredMember` gains `delta`/`trendDirection`
(from `Score.Delta`/`TrendDirection`, populated via a shared `toScoredMembers` mapper);
`historyForMember(modelId, anchorRecordId)` (oldest-first `ScoreHistory` series for a sparkline,
uncapped); `moversForModel(modelId, limit)` → `{ risers, fallers }` via two top-N `Delta` queries
(`> 0` / `< 0`), so no full scan. Movers read `Score.Delta` rather than `ScoreBandTransition` — the
transition table stays reserved for the action-layer queue.

**Phase C — EM UI.** ✅ *done (build clean)* Per-row delta indicator + trend arrow on triage rows
(↑/↓ + signed delta, green rise / red drop, hidden when flat or first-scored); inline SVG sparkline
in the drill-down header (120×28, Y-scaled to the member's own min/max, band-colored, "first
snapshot" hint when only one point); collapsible "Movers since last run" card (biggest drops /
biggest gains, click-to-drill). Pure SVG + signals — no charting lib. Surfaces stay empty/flat
until history accrues (Phase D).

**Phase D — demo enablement.** ✅ *done (verified live in the EM).* The cheese factor was repointed
from AllTime to a **Rolling-90d window on `RegistrationDate`** (via the AnchorDateField bridge — see
Time windows), then recomputed at four `asOf` dates (2026-03-23 / 04-22 / 05-22 / 06-22) via a
standalone orchestrator script (`setupSQLServerClient` against Sonar_Demo — no GraphQL/auth). Result:
4 distinct `ScoreHistory` snapshots × 2000 members, avg score climbing 26.6 → 33.9 → 34.9 → 35.0;
movers = 600 risers / 1043 fallers (swings to +93 / −97). The Recompute action's optional `AsOf` param
(✅) and `historyForMember` ordering by `AsOfDate` (✅) support the backfill. Verified in the
Engagement Manager: per-row trend deltas (↓ −33 …), the **Movers since last run** panel (drops/gains),
and the drill-down **sparkline** + "↑ +93 since last run" all render against the live data.

**Demo-state note:** the cheese model now scores on Rolling-90d registrations (was AllTime). The bridge
TimeWindow row `EBEE0EF7-…` carries `AnchorDateField='RegistrationDate'` as the related date column —
to be migrated onto `Factor.DateField` when that lands (the published version snapshot still reflects
the old AllTime config, but recompute reads live config, so scoring is correct).

**Decisions:** `ScoreBandTransition.Direction` from `Delta` sign (higher = Improving); a history row
per recompute per scored anchor (change-only diffing is the deferred scale path); `TrendSlope`/
`Confidence` deferred.

---

## Time windows — status & follow-ups

The engine now models all five `TimeWindow` types. The SQL layer (`factorSql.ts`) is complete and
unit-tested for **Rolling** (days + months), **Calendar** (month/quarter/year), **SinceEvent**, and
**RenewalRelative** (`AllTime` = no bound). `CompiledWindow` is a discriminated union; per-anchor
windows (SinceEvent/RenewalRelative) emit a 1:1 anchor JOIN and read a bound off the anchor row.
48/48 engine tests pass.

**Done now (no migration):** `FactorCompiler` wires **Rolling** and **Calendar**. `SinceEvent`/
`RenewalRelative` are SQL-complete but throw a clear "not yet configurable" error — they need a
*second* date column (related activity date AND a distinct anchor boundary date), which the schema
can't express today.

**The schema gap.** Nothing in config names the **related-entity activity-date column** (e.g.
`RegistrationDate` — the "when did it happen" column every windowed type filters on). It's not on
`TimeWindow` (which must stay reusable/entity-agnostic), `Factor`, or `ModelRelatedEntity`. The
current engine reading it from `TimeWindow.AnchorDateField` is a latent bug: a Rolling window with
`AnchorDateField=null` (as the seeds have) silently counts everything. Masked only because the live
cheese factor is AllTime.

**Follow-ups (deferred — migration paused by request):**
1. **Add `Factor.DateField`** (nullable nvarchar) — the related activity-date column. Migration + codegen.
   It's intrinsic to the factor's data definition, keeps `TimeWindow` reusable.
2. **Flip the bridge:** `resolveWindow` currently sources the related date column from
   `TimeWindow.AnchorDateField` as a TEMPORARY bridge (emits the predicate only when set, so nothing
   regresses). Once `Factor.DateField` exists, read it from there and free `AnchorDateField` to mean
   only the anchor boundary date.
3. **Wire `SinceEvent`/`RenewalRelative`** in `FactorCompiler` (related date = `Factor.DateField`,
   anchor boundary = `TimeWindow.AnchorDateField`); remove the throw.
4. **Factor-builder UI:** expose `DateField` (a dropdown of the related entity's date columns) so an
   operator sets it explicitly — wrong-but-silent is the worst failure for an explainable scorer.
5. **Calendar:** org-specific "terms" (beyond month/quarter/year) need a calendar/term table — deferred.

**Unblocks Phase D.** Once a Rolling-90d-on-`RegistrationDate` factor is configurable, point the cheese
model at it, republish, and run the `AsOf` backfill. (Interim option: the AnchorDateField bridge can
already make a Rolling window filter on `RegistrationDate` without the migration, at the cost of
overloading that field.)

---

## Backlog — factors, relationships, demo data

**Multi-hop factors (via `RelationshipPath`).** The `FactorCompiler` is single-hop today —
`resolveAnchorKeyColumn` requires the related entity to have exactly one direct FK to the anchor.
Signals that reach the anchor through an intermediate (e.g. *email clicks per member* =
`Member → EmailSend → EmailClick`) can't be expressed. `ModelRelatedEntity.RelationshipPath` exists
for this (currently `"[]"`, ignored). Work: resolve a join path (auto = BFS over MJ's FK graph, or
explicit when ambiguous) → emit the intervening JOINs → guard fan-out (`COUNT(DISTINCT …)` on
one-to-many hops). Surfaced by the "Email Engagements"/"Email Clicks" attempts on the cheese model.

**Factor editing UI (in progress).** Rubric rows are weight-slider + remove only; no way to edit a
factor's definition without delete/re-add. Building: click-to-edit (pencil) that reopens the factor
builder pre-loaded, saving back to the existing Factor/ModelFactor. Plus **filter the source-entity
dropdown to entities with a direct FK to the anchor** (would have hidden the wrong-dataset "Email
Engagements" entirely) and **hide window types the engine can't run yet** (RenewalRelative/SinceEvent
currently selectable → fail at recompute). Editing a factor leaves prior scores stale until recompute.

**Deferred: full purge of the `membership` (old dummy) dataset.** Decided to defer. When done:
delete the 2 old Sonar models (Demo Member Engagement — Active w/ version+scores; Context Test Model —
Draft) + dependents, **keeping band set `7E3B9C42` (shared with the cheese model)**; then remove the
5 `membership` entities + tables (Members 15, EmailEngagement 36, EventRegistration 27, Certification
9, Payment 20 = 107 rows). Do the model deletes via the entity layer (cascade/integrity), and remove
the entities via **drop-tables-then-CodeGen-reconcile** — NOT hand-deleted `__mj.Entity` rows (would
leave metadata inconsistent and can break the demo). Already done: removed the stray
`email_engagements` ModelRelatedEntity link from the cheese model.

---

## Design notes

### `ICombineStrategy` — the combine-layer Strategy seam (do it on the 2nd strategy)
**What:** mirror `IFactorEvaluator` one layer up. Today `ScoringEngine` *is* the weighted-sum;
instead it should *delegate* to a strategy looked up by `ScoreModel.CombineStrategy`. The schema
already enumerates five (`WeightedSum / WeightedAvg / Banded / ZScoreComposite / ExpressionDriven`),
but the engine implements one and `RecomputeOrchestrator.assertSupported` throws on the rest.

**Why it's worth it:**
- **Open/closed on a known growth axis.** Each new strategy is an additive class + one registry
  entry; the tested WeightedSum path is never edited — so adding "Banded" can't regress the scores
  customers already depend on. Score regressions (silently moving real members) are the scariest
  bug class here, so "physically can't touch the tested path" is the real payoff.
- **Consistency.** It's the same proven pattern as `IFactorEvaluator` — `ScoringEngine` becomes a
  thin dispatcher, not "the weighted sum." One pattern to learn.
- **Makes the enum honest.** `CombineStrategy` becomes a real dispatch table instead of a 5-value
  column the engine mostly rejects.
- **Isolated tests + uniform explainability.** Each strategy is a small pure unit (like the
  normalization methods); as long as each emits the same contribution breakdown, the waterfall UI
  works for all of them unchanged.

**Two constraints when building it (learned by pressure-testing the 5 cases):**
1. **Extract on the second strategy, not now.** With one implementation you'd be guessing the
   interface. The math is already isolated in `scoreAnchor`/`contributionsFor`, so waiting costs
   nothing — lift WeightedSum verbatim into a class when WeightedAvg/Banded is scheduled.
2. **Model it population-scoped** (`combine(Map<anchor, contributions>, spec) → Map<anchor, rawScore>`),
   not per-anchor — because `ZScoreComposite` standardizes each member against the *whole
   population* (two-pass, like `NormalizationEngine`). A per-anchor `combine()` can't express it.

**Weight modes fold in here, not as a separate seam.** `WeightMode` (Penalty/Gate/…) is *deferred*
(see below) and is **not** cleanly orthogonal to combine: a Gate that zeroes the whole score and a
Penalty's denominator handling are combine-level decisions, not per-contribution transforms. When
weight modes are built, build them inside the relevant `ICombineStrategy`, not as a function beside it.

### Other strategy-seam candidates (same pattern, marked for later)
The engine has a recurring shape — *a schema enum + a dispatch that handles a subset and throws on
the rest* — which is where the `IFactorEvaluator`/`ICombineStrategy` pattern pays off. The two
strongest beyond combine:

1. **`INormalizationStrategy` — normalization.** `NormalizationEngine.normalize` is already a
   `switch` over None/MinMax/Percentile/ZScore (population-scoped `(spec, Map) → void`), with three
   more in the schema (Logistic/Banded/Lookup). Those three are **parameterized** (read
   `NormalizationParamsJSON` — midpoint/steepness, thresholds, lookup table), and that per-method
   config is what would clutter the switch. **Convert the switch to a registry when you add the
   parameterized three** — the four pure methods are fine as a switch until then.
2. **`IWindowResolver` — time windows.** `FactorCompiler.resolveWindow` handles AllTime/Rolling and
   throws on Calendar/SinceEvent/**RenewalRelative**. RenewalRelative ("90 days before renewal") is
   a flagship plan example with genuinely different mechanics (reads an anchor date field + offset).
   **Add the seam when the first anchor-relative window lands.**

The seam *signature* is stage-specific — factor eval is batch (`evaluateBatch`), normalize/combine
are population-scoped (`Map`), window resolution returns a per-factor SQL fragment. Same pattern,
different shapes.

**Where it's overkill (keep as a switch/function):** `MissingDataPolicy` (Zero/NeutralMidpoint/
Exclude — one-liner behaviors) and `AsOfStrategy` (trivial date selection). The discriminator:
a seam earns its keep only when variants diverge in *mechanics/config/dependencies*, not just in a
value — and convert on the **second divergent case**, never speculatively.

### Penalty / WeightMode — deferred (agreed)
Penalty would need a deliberate denominator/bounding design, and its intent largely overlaps the
working "more is a warning sign" direction control. Decision: **the "Hurts the score" control is now
hidden** (the UI is additive-only, so it no longer implies behavior the engine lacks); the `WeightMode`
field is retained for the future. Revisit as
part of the `ICombineStrategy` work above, with a deliberate bounding/denominator design.

### Entity-picker schema scoping — rule once, enforce server-side
**What:** exclude internal MJ schemas (`__mj*` — covers both `__mj` and Sonar's own
`__mj_BizAppsSonar`) from the anchor + related-entity pickers so only business entities are
selectable as factor sources. Config-driven so a deployment can override.

**Why split client + server (the architecture call):**
- The full entity metadata is **already shipped to the browser** (`Metadata().Entities`), so the
  **picker filter is client-side** — a server roundtrip buys nothing for display. Same shape as the
  existing field-level `!Name.startsWith("__mj_")` filter in the factor builder.
- But a client filter only *hides* bad choices; it doesn't *prevent* them. The **authoritative gate
  is a `ValidateAsync` override on the `ModelRelatedEntity` server entity** (same pattern as the
  `ScoreModel` publish/validate hooks in `CoreEntitiesServer`) that rejects an excluded-schema
  source at persistence — catching the UI, the API, *and* the future server-side AI Model Builder
  agent (which would bypass a client-only filter) in one place.
- The exclusion list lives **once, server-side** (an MJ EntitySetting or Sonar config). That single
  source is also the override hook — edit the setting, no code change.

**MJ precedent (reuse, don't reinvent):** `excludeSchemas` in `mj.config.cjs` is **build-time only**
(controls CodeGen generation; does *not* filter the runtime picker — `Metadata().Entities` returns
all registered entities regardless). At runtime `EntityInfo` exposes `SchemaName` (authoritative),
`Status`, `IncludeInAPI`, and a `ScopeDefault` hint — but none enforce picker visibility, so the
rule is ours to add on top of `SchemaName`.

**Open call:** whether to also exclude `__mj_BizAppsSonar` (Sonar's own `Score`/`ScoreModel`). Lean:
exclude from the default declarative picker but keep the override — model-on-model composition
(`DerivedFromScore`) is a deliberate advanced path, not everyday-list material.
