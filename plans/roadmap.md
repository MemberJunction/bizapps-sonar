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
| ScoreModel inert columns | 🟦 | `PopulationFilter`, `RecomputeMode/Cron`, `AsOfStrategy`, `IsCalibrated`, `TrendWindowDays`, `EffectiveFrom/To`, `CombineExpression` exist but are unused by the engine. |

### §5.2 Factors & windows
| Capability | Status | Notes |
|---|---|---|
| Declarative factors | 🟡 | `Count/Sum/Avg/Min/Max/DistinctCount` work. `Recency/RatePerPeriod/Exists/TrendSlope` ⬜. |
| `TimeWindow` | 🟡 | `Rolling` + `AllTime` compile. `Calendar/SinceEvent/RenewalRelative` ⬜. |
| `ModelFactor` weight | ✅ | Weight + live tuning work. |
| `ModelFactor.WeightMode` | 🟡 | **UI shows additive/penalty, but the engine only does additive** — "penalty/hurts" does not actually subtract yet. Multiplier/Gate/Bonus ⬜. |
| Caps/floors, `TrendWeight` | ⬜ | Columns exist; engine ignores them. |
| `MissingDataPolicy` | 🟦 | Column + UI mode exist; engine excludes no-data anchors (doesn't apply Zero/NeutralMidpoint). |
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
| `ScoringEngine` | 🟡 | WeightedSum (as weighted average) only. WeightMode/caps/TrendWeight/other CombineStrategies ⬜. |
| `RecomputeOrchestrator` | 🟡 | compute + persist work. Population = **whole anchor entity** (PopulationFilter ignored). On-demand preview ✅; scheduled/event-driven/incremental ⬜. |
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
4. **Two UI-implies-behavior honesty bugs** (decide: wire or hide):
   - **Population filter** — UI authors it; engine ignores it (scores everyone).
   - **Penalty weight mode** — UI offers "hurts the score"; engine treats it as additive.

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
| Wire **penalty** weight mode in the engine | Engine fix | MVP-ish (honesty) |
| Wire or hide the **population filter** | Engine/UI | MVP decision |
| Trend/history (`ScoreHistory`) → EM sparkline + "movers" | Engine + UI | Phase-1 |
| Plain-language AI summary (Explainer-lite) | AI | Phase-1 demo flavor |
| _(your additions go here)_ | | |

---

## Proposed sequence (impact × effort)

**Now — finish the credible demo (closes MVP bar):**
1. ✅ Done — `engine.md` (engine + factor capabilities) + `demo.md` (demo script) (workstream #2).
2. Decide population filter + penalty mode: wire the cheap one(s) or hide to stop implying behavior.
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
The rubric UI offers "Hurts the score" (Penalty) but the engine treats every factor as additive, and
the intent largely overlaps the working "more is a warning sign" direction control. Decision: **leave
the control in place but unwired for now**; demo additive-only (see `demo.md` guardrails). Revisit as
part of the `ICombineStrategy` work above, with a deliberate bounding/denominator design.
