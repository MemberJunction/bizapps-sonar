# Sonar — Configurable Engagement Scoring Engine on MemberJunction

**Status:** Draft v0.1 — concept design for build hand-off
**Owner:** TBD (concept by Amith Nagarajan)
**Branch:** `claude/engagement-scoring-app-vqowa1`
**Working title:** "Sonar" (trademark/focus-test pending, same as Bob)
**Last updated:** 2026-06-09

> **⚠️ REFACTOR DIRECTIVE (2026-07):** This plan predates three shipped MJ platform capabilities — **Predictive Studio**, the hardened **Record Set Processing** substrate, and **Remote Operations** — that together provide most of the §6 engine. **Read [`platform-alignment-refactor.md`](./platform-alignment-refactor.md) before building anything in §6–§8**: declarative factors ride PS feature assembly, recompute rides RSP (including the batching/concurrency/budget semantics §6.1 specifies by hand), holdout/lift and re-weighting ride PS Experiments, and the scoring/control APIs are Remote Operations. §1–§5 (product thesis, commercial model, data model) and §7's rubric/authoring design remain authoritative, with the schema deltas listed in the refactor doc.
>
> **For the engineer picking this up:** §4 (Architecture) and §5–§7 (Data Model + Engine + Authoring) are the build spine. Everything else is context and prioritization. The single most important design idea in this document is **configuration-as-data**: models, factors, rubrics, windows, bands, write-back rules, and even the action playbooks are all rows in the database, not code. Code is the *engine that interprets that data* plus the *escape-hatch Actions* for arbitrary logic. Read §4.3 before §5.

---

## 1. Executive Summary

**Sonar is a configurable engagement-scoring engine that runs on top of the MemberJunction (MJ) entity graph.** Where every other engagement-scoring product ships a fixed score over a fixed schema, Sonar lets an organization point at *any* MJ entity as an "anchor" (member, customer, employer, volunteer, donor, learner, chapter), wire in *any* number of related entities already integrated into MJ (CRM activity, finance invoices, LMS completions, community posts, event registrations, email engagement), and declaratively define **one or many concurrent scoring models** over them — each with its own rubric, time windows, weights, normalization, and bands.

The assumption Sonar is built on: **the integration work is already done.** Data is flowing into MJ from a wide variety of subsystems via the existing MJ integration architecture. Sonar does not do ETL. It is the layer that turns that unified-but-raw entity graph into **explainable, trending, actionable engagement scores** — and writes those scores back out to the source systems when asked.

Four structural commitments differentiate the product:

1. **Configuration-as-data, with a uniform Factor contract.** A scoring model is a set of rows: an anchor entity, a set of related-entity mappings, a library of factors (signals), a rubric (weights + bands), and a recompute policy. The rubric engine never branches on *how* a factor produced its number — declarative factors (count/sum/recency over a related entity) and Action-backed factors (arbitrary code, including AI) satisfy the same contract and are explained identically.
2. **Declarative core + Action plugin for arbitrary logic.** ~80% of real factors are simple aggregations and are expressed as pure config, compiled to set-based SQL and computed for the whole population in one pass. The other 20% — external propensity models, custom decay math, NLP sentiment over community posts — are MJ **Actions** (code-based, or **Runtime Actions** generated, tested, and cataloged by the **Action Builder / CodeSmith** loop). The promotion gate keeps generated code from silently moving production scores.
3. **Scoring *and acting* in v1 — the action layer is not deferred.** A score that nobody acts on is a thermometer. Sonar closes the loop from day one: scores roll up into **segments** (e.g., "At-Risk in the renewal window"), segments trigger **interventions** that fire as MJ **Actions** (draft the outreach, route to a staffer, enroll in a journey), and every intervention runs against an **automatic holdout** so reactivation/retention lift is *measured*, not assumed. This is what separates Sonar from "another dashboard," so it ships in v1, not a later phase.
4. **MJ-native in, MJ-native out, packaged as an OpenApp.** Scores are written back into MJ as first-class entities, so segments, dashboards, agents, and the existing integration write-back all consume a normal entity. The whole thing — engine, entities, starter factor library, prebuilt model templates, the config/dashboard agent, dashboards, and the action layer — ships as an **OpenApp** (MJ's application packaging substrate), installable on any MJ deployment and layerable on BC SaaS for the cross-tenant calibration network.

**Commercial model (illustrative, finalized post-discovery):** two deployment legs following the Izzy pattern — (a) **single-tenant OpenApp** installable on any MJ deployment (open-core / catalog), and (b) **multi-tenant BC SaaS** that adds the cross-tenant **calibration network** ("is a 6% community-participation rate good? — benchmarked against 200 similar associations") which a single tenant structurally cannot produce. Pricing tiered by anchor-population size and active-model count, with an optional **performance component** tied to measured retention/reactivation lift (made honest by built-in holdout discipline, §7.5).

**Investment thesis:** the category is commoditized at the *score* layer and wide open at the *act* layer. Incumbents (Association Analytics/Acumen, Nimble Predictions, Higher Logic, rasa.io for members; Gainsight/ChurnZero for CS; Culture Amp/Glint for HR) ship a number on a dashboard and leave the "so what" to an overloaded human. They also each score *one* entity type over *their own* schema. Sonar's unfair advantages are exactly the things a point tool can't copy: **MJ already unifies the signals** (the expensive part everyone else charges for as ETL), the **entity-graph generality** means one engine scores members *and* donors *and* chapters, and the **cross-tenant network** calibrates what "good" means. The honest risk — that this looks like an MJ *feature* rather than a *company* — is answered by the three things that are genuinely product-shaped: the **AI authoring experience**, the **calibration network**, and the **agentic action layer**.

---

## 2. Strategic Context

### 2.1 The engagement-scoring landscape

| Zone | Examples | What it sells | Why it leaves the gap open |
|---|---|---|---|
| **A — Association analytics/BI** | Association Analytics (Acumen), Nucleus (.orgSource), Nimble AMS Predictions | Dashboards + a packaged member-engagement score; predictive churn | ETL-heavy, single-entity (members), fixed rubric, score-only — no action loop, no per-org rubric authoring, no cross-org calibration. |
| **B — Customer success** | Gainsight, ChurnZero, Totango, Catalyst | Customer "health scores", playbooks | Off the association vertical; their own schema; no MJ data fabric; calibration is per-vendor not per-cohort. |
| **C — Marketing/lead scoring** | HubSpot, Marketo, 6sense | Lead/account scoring + intent | Sales funnel shaped, not member-lifecycle shaped; weak on non-marketing signals (cert, volunteering, dues). |
| **D — Employee engagement** | Culture Amp, Glint, Lattice, Officevibe | Survey-based engagement indices | Survey-driven not behavior-driven; surveillance-adjacent; furthest from MJ. Deliberately **out of scope** (§2.4). |
| **E — Newsletter/community engagement** | rasa.io, Higher Logic | Single-channel engagement signal | One signal, not a composite; feeds Sonar as a *factor*, doesn't compete. |
| **F — DIY (the actual incumbent)** | A staff analyst, a SQL query, a hand-tuned weighted sum in a spreadsheet, refreshed quarterly | Whoever owns retention builds an MEI by hand | The status quo for most associations. Stale, opaque, single-model, never written back, never calibrated. |

### 2.2 The wedges (each independently defensible, compounding)

**Wedge 1 — Configurable over the MJ entity graph, not a fixed score.** Anchor on any entity; wire in any related entities; run *multiple concurrent models* (Renewal Risk, Community Engagement, Sponsorship Propensity, Learning Engagement) against the same population. A member carries many scores at once; models can even consume other models' scores. No incumbent does multi-model, multi-entity, per-org-authored scoring.

**Wedge 2 — MJ as the data fabric (the integration is already done).** The expensive, fragile part of every competing product is stitching CRM + finance + LMS + community + email + web into one view. On MJ that's a precondition, not a project. Sonar reads the unified graph; competitors sell you the ETL and *then* the score.

**Wedge 3 — Explainability falls out of a declarative model.** Because a score is `Σ (weight × normalized factor)` over named factors, every score decomposes for free: "73, down 12 since March — −15 newsletter decay, −22 cert lapsed, +8 event attendance." The narrative is what makes staff act. Black-box BI scores can't hand you that cheaply.

**Wedge 4 — Cross-tenant calibration network (the moat, BC SaaS only).** "Is 6% community participation good?" is unanswerable in one tenant and *learnable* across a network of MJ tenants. Sonar offers benchmarked, calibrated risk models and transfer learning on which interventions move which decay patterns. NDAs (consultants) and lack of cohort concentration (horizontal tools) lock everyone else out.

**Wedge 5 — The action layer with honest lift (v1).** The product doesn't stop at a number — it surfaces the cohort to call, drafts the intervention, fires it via an Action, and **measures lift against an automatic holdout**. Most of the category won't hold out a control group because their numbers would look bad; doing it is both the trust-builder with skeptical EDs and the basis for performance pricing.

### 2.3 The reframe that resolves "feature vs. company"

Framed naively, "a configurable score over MJ" sounds like a platform feature. It becomes a product because of three things that are real engineering and real GTM:

- **The authoring experience** — an AI agent that introspects the MJ schema and proposes a full rubric from a sentence, plus a visual builder and a formula escape hatch.
- **The calibration network** — cross-tenant benchmarks a single install cannot produce.
- **The action layer** — segments → interventions → measured lift.

Ship those three and it is unambiguously a product. Ship only "a config screen" and it is a feature. We are building the product.

### 2.4 What we are explicitly NOT doing

- **Not doing ETL / integration.** Sonar assumes data is already in MJ. If a signal isn't an MJ entity, it's out of scope until integration lands it. (Off-MJ deployments are not a v1 target — score quality is hostage to integration depth.)
- **Not employee/HR engagement at v1.** Survey-driven, surveillance-adjacent, furthest from MJ. The engine *could* score it later; we won't lead there.
- **Not a generic BI tool.** Sonar produces *scores and the actions on them*, not arbitrary charts. The dashboards are opinionated (trajectory/cohort + explainability drill-down), not a chart builder.
- **Not a CDP / identity-resolution product.** Anchor identity and dedup are MJ's job; Sonar consumes resolved entities.
- **Not real-time sub-second scoring.** Recompute is scheduled + event-driven with minutes-to-hours latency, not streaming. (Revisit if a use case demands it.)

### 2.5 Market sizing (illustrative)

- Primary: the ~15K associations with $1M+ budgets where retention is the board-level KPI and where MJ-based AMS adoption is the on-ramp. Engagement scoring is something nearly all of them attempt and few do well.
- Same engine extends, at near-zero marginal product cost, to **donors** (major-gift propensity), **volunteers**, **learners/certificants**, **event attendees**, and **chapter/component health** — each a "second hat" on the same install.
- Adjacent (post-vertical): any MJ-on-BC-SaaS deployment scoring any entity. The OpenApp distribution + calibration network is the scalable surface.

---

## 3. Commercial Model

> Finalized after Phase 0. Numbers below are anchors for discovery, not commitments.

### 3.1 Two deployment legs (Izzy pattern)

| Leg | What it is | Who it's for | Calibration |
|---|---|---|---|
| **Sonar OpenApp (single-tenant)** | Installable MJ OpenApp: engine, entities, starter factor library, model templates, config/dashboard agent, dashboards. Runs in the customer's own MJ deployment. | Associations running their own MJ/AMS stack; MJ catalog installs. | Local population only — cannot calibrate "what's good." |
| **Sonar on BC SaaS (multi-tenant)** | The same OpenApp **plus** the cross-tenant calibration network, managed ops, and the action/lift layer. | Associations on BC SaaS; the GTM default. | Benchmarked across the network (opt-in). |

The upgrade path from OpenApp → BC SaaS *is* the moat: the calibration network is the thing a single-tenant install structurally cannot self-provide.

### 3.2 Pricing dimensions (illustrative)

Tiered on the two cost/value drivers that actually scale: **anchor population size** and **active model count**. The **action layer (segments → interventions → measured lift) is in every tier** — it's the product, not an upsell. Feature gates apply to the *network* (calibration), *generated* Runtime Actions, and scale features.

| Tier | Anchor population | Active models | Annual sub | Includes |
|---|---|---|---|---|
| **Sonar Starter** | < 10K | 1 | **$6,000** | Engine, declarative + Action-backed factors, AI authoring agent, 1 model template, scheduled recompute, dashboards, write-back to 1 target, **action layer + holdout lift** |
| **Sonar Standard** | 10K–50K | 3 | **$15,000** | + Multiple models, event-driven recompute, multi-target write-back, CodeSmith-generated Runtime Actions |
| **Sonar Pro** | 50K–250K | unlimited | **$36,000** | + Calibration network (benchmarks), Re-weight Advisor, SSO |
| **Sonar Enterprise** | 250K+ | unlimited | **$60,000+** | + Federation across affiliated orgs, dedicated calibration cohort, white-label, dedicated CSM |

- **Compute metering:** Action-backed factors and large populations consume measurable compute/token budget. Sonar meters it (see `ScoreRecomputeRun.CostUnitsConsumed`, §5) and either bundles a quota per tier or passes through transparently above quota.
- **Performance component (optional, BC SaaS only):** for customers who turn on the action layer with holdouts, an optional share of *measured* reactivation/retention lift. Only sellable because lift is measured against a real control group (§7.5).

### 3.3 Why this wins

- **vs Zone A (Association Analytics et al.):** no ETL project (MJ already unified), multi-model + multi-entity, per-org authored rubrics, explainable by construction, and an action loop they don't have. Cheaper because we're not reselling the integration.
- **vs Zone B/C (CS / marketing scoring):** vertical depth + member-lifecycle signals (dues, certs, volunteering, events) those tools don't model, on a data fabric they don't have.
- **vs Zone F (DIY spreadsheet MEI):** Sonar is the institutionalized, trending, written-back, calibrated, multi-model version of the thing a staff analyst hand-builds once and lets rot.

---

## 4. Product Architecture

### 4.1 Deployment & packaging

Sonar ships as a single **OpenApp** (MJ's application packaging substrate). One build, two legs (§3.1). The OpenApp bundles:

- **Entities + migrations** for the `__mj_BizAppsSonar` schema (§5), registered through MJ CodeGen.
- **Starter factor library** and **model templates** (`ModelTemplate`, §5.8) — Renewal Risk, Community Engagement, Learning Engagement, Donor Propensity, Chapter Health.
- **AI agents** (§8) — the Model Builder agent, the Explainer, the Dashboard Builder, the Recompute orchestrator.
- **Angular surfaces** running inside the MJ Explorer shell (§9).
- **Action bindings + write-back adapters** that reuse the MJ Action framework and the existing integration architecture.

On BC SaaS, the same OpenApp is multi-tenant and the calibration entities (§5.7) + action layer (§5.6) are switched on.

### 4.2 Surface architecture

Persona resolved at login from MJ role assignments; multi-persona users get the standard Explorer switcher.

| Surface | Persona | Core jobs |
|---|---|---|
| **Model Builder** | Data analyst / membership ops / consultant | Pick anchor, map related entities, author factors + rubric (AI-first, visual builder, formula escape hatch), publish model versions, simulate. |
| **Engagement Manager** | Membership/development/education director | The Monday briefing: who moved, who's at risk in the renewal window, factor-level *why*, cohort drill-down, and launch + track interventions (with holdout) — all v1. |
| **Admin / Ops** | Platform admin / IT | Recompute health + schedule, write-back targets + policy, Action promotion/governance, compute/cost ledger, calibration consent. |
| **Executive (read-only)** | ED / CFO / board | Portfolio of scores across the org, band distribution trend, lift achieved. |

### 4.3 The core conceptual model (read this before §5)

Five first-class objects. Each is a table (or set of tables) in `__mj_BizAppsSonar`. **Everything here is data.**

```
                     ┌─────────────────────────────────────────────────────────┐
                     │  ScoreModel  (anchor entity + rubric + recompute policy)  │
                     └─────────────────────────────────────────────────────────┘
                          │ 1                    │ 1                    │ 1
            ┌─────────────┘          ┌───────────┘            ┌─────────┘
            ▼ N                      ▼ N                       ▼ N
   ModelRelatedEntity         ModelFactor (weighting)     ScoreModelVersion (immutable)
   (anchor→related path)        │  binds                        │ produces
            ▲                    ▼ N                              ▼ N
            │ source        Factor (signal def)              Score  ──┬── ScoreFactorContribution (the "why")
            └────────────── declarative │ action-backed       (current)│
                                        │                              └── ScoreHistory (the trajectory)
                                        ▼
                              MJ Action / Runtime Action
```

1. **Anchor entity** — the MJ entity being scored (one per model). Stored as a reference to MJ's entity metadata, so the model is portable across deployments where the same logical entity has a different physical table.
2. **Factor** — one signal, computed over a *related* entity, satisfying the uniform contract `Factor(anchorRecord, asOfWindow, context) → { rawValue, normalizedContribution, explanation }`. **Declarative** (config compiled to set-based SQL) or **Action-backed** (arbitrary code/AI). Reusable across models.
3. **Rubric** — how factors combine: weights, weight-modes (additive/multiplier/gate/penalty/bonus), caps/floors, per-factor normalization, and the model-level scale + bands. Expressed as `ModelFactor` rows + `ScoreBandSet`.
4. **ScoreModel** — anchor + related-entity map + selected factors + rubric + recompute policy. **Many coexist.** Publishing a model snapshots its full config into an immutable `ScoreModelVersion` for reproducible, auditable scores.
5. **Score** — written back into MJ as a first-class entity, with per-factor contributions and full time-series history. MJ-native out: segments, dashboards, agents, and integration write-back all read normal entities.

### 4.4 Schema & conventions

- New schema: **`__mj_BizAppsSonar`**. Cross-cutting MJ metadata in `__mj`; tenant/billing in `__BCSaaS`; person/org in `bizapps`.
- UUID PKs per MJ conventions. `__mj_CreatedAt` / `__mj_UpdatedAt` are owned by CodeGen and **never** inserted in migrations.
- Migrations follow the repo convention `V{timestamp}__v{ver}.x_{desc}.sql`.
- All entities registered via MJ CodeGen so generated entity classes, the GraphQL API, and MJ Explorer pick them up automatically.

### 4.5 Package layout (proposed, Izzy / Job Board / Bob pattern)

```
engagement-scoring/                       # → graduates to bluecypress/sonar
├── mj-app.json                           # OpenApp manifest (per MJ_APP_INIT.md)
├── mj.config.cjs
├── migrations/                           # V{timestamp}__v{ver}.x_{desc}.sql
├── metadata/                             # mj sync targets
│   ├── .mj-sync.json
│   ├── entities/
│   ├── ai-agents/
│   ├── prompts/
│   ├── actions/                          # code-based factor & write-back actions
│   └── model-templates/                  # Sonar: prebuilt ScoreModel templates
├── packages/
│   ├── sonar-core/                       # contracts, types, the Factor contract
│   ├── sonar-entities/                   # generated
│   ├── sonar-entities-extended/          # hand-written
│   ├── sonar-engine/                     # ScoringEngine, NormalizationEngine, RecomputeOrchestrator, FactorCompiler
│   ├── sonar-actions/                    # Action-backed factor runtime + promotion gate
│   ├── sonar-calibration/                # cross-tenant benchmark aggregation (BC SaaS)
│   ├── sonar-writeback/                  # integration write-back adapters
│   ├── sonar-server/
│   ├── sonar-server-bootstrap/
│   ├── sonar-ng-builder/                 # Model Builder surface
│   ├── sonar-ng-manager/                 # Engagement Manager surface
│   ├── sonar-ng-admin/                   # Admin/Ops surface
│   ├── sonar-ng-common/
│   └── sonar-ng-bootstrap/
├── apps/
│   ├── MJAPI/
│   └── MJExplorer/
├── docs/
└── plans/
```

---

## 5. Data Model (detailed)

All tables in `__mj_BizAppsSonar`. UUID PKs. `__mj_CreatedAt`/`__mj_UpdatedAt` owned by CodeGen. Below, "→" denotes an FK. JSON columns are `NVARCHAR(MAX)` with documented shapes; consider extracting hot keys into columns once query patterns settle.

The model splits into seven groups:
**(5.1)** configuration · **(5.2)** factors & windows · **(5.3)** runtime output · **(5.4)** recompute/audit · **(5.5)** Action governance & write-back · **(5.6)** action layer (v1) · **(5.7)** calibration network (BC SaaS) · **(5.8)** templates & misc.

### 5.1 Configuration entities

#### `ScoreModel`
The editable definition of one scoring model. Many active per tenant.

| Column | Type | Notes |
|---|---|---|
| `ID` | uniqueidentifier | PK |
| `Name` | nvarchar(200) | "2026 Renewal Risk" |
| `Slug` | nvarchar(100) | stable handle, unique per tenant |
| `Description` | nvarchar(max) | |
| `AnchorEntityID` | uniqueidentifier | → `__mj.Entity`. The entity being scored. |
| `Status` | nvarchar(20) | `Draft` / `Active` / `Paused` / `Archived` |
| `CurrentVersionID` | uniqueidentifier | → `ScoreModelVersion` (the published version currently scoring) |
| `ScoreScaleMin` / `ScoreScaleMax` | decimal(9,4) | default 0 / 100 |
| `CombineStrategy` | nvarchar(30) | `WeightedSum` / `WeightedAvg` / `Banded` / `ZScoreComposite` / `ExpressionDriven` |
| `CombineExpression` | nvarchar(max) | nullable; for `ExpressionDriven`, references factor slugs |
| `BandSetID` | uniqueidentifier | → `ScoreBandSet` (qualitative bands) |
| `PopulationFilter` | nvarchar(max) | JSON/DSL: which anchor records are in scope (e.g., `Status = 'Active'`) |
| `RecomputeMode` | nvarchar(20) | `Scheduled` / `EventDriven` / `OnDemand` / `Hybrid` |
| `RecomputeCron` | nvarchar(100) | nullable |
| `AsOfStrategy` | nvarchar(20) | `RunTime` / `EndOfPreviousDay` / `Fixed` — defines "now" for windows |
| `IsCalibrated` | bit | consume cross-tenant benchmarks for normalization (§5.7) |
| `TrendWindowDays` | int | window used to compute the headline Delta/Trend on `Score` |
| `OwnerUserID` | uniqueidentifier | → `__mj.User` |
| `EffectiveFrom` / `EffectiveTo` | datetime2 | allows models to be active over bounded time ranges |
| `Notes` | nvarchar(max) | |

Indexes: `(AnchorEntityID, Status)`, unique `(Slug)`.

#### `ScoreModelVersion`
**Immutable** snapshot of a model's complete config at publish time. Every `Score` and `ScoreHistory` row references the version that produced it — this is what makes scores **reproducible, auditable, and back-comparable** even after the live rubric changes. Critical for lift measurement and for explaining "why did everyone's score shift on May 1?" (answer: model v3 published).

| Column | Type | Notes |
|---|---|---|
| `ID` | uniqueidentifier | PK |
| `ScoreModelID` | uniqueidentifier | → `ScoreModel` |
| `VersionNumber` | int | monotonic per model |
| `VersionLabel` | nvarchar(50) | optional human label |
| `ConfigSnapshotJSON` | nvarchar(max) | fully denormalized: anchor, related-entity map, factors, weights, windows, bands, normalization. The engine can score from this alone. |
| `ChangeSummary` | nvarchar(max) | what changed vs prior version |
| `PublishedByUserID` | uniqueidentifier | → `__mj.User` |
| `PublishedAt` | datetime2 | |
| `IsCurrent` | bit | exactly one current per model |

Index: unique `(ScoreModelID, VersionNumber)`.

#### `ModelRelatedEntity`
Declares an MJ entity wired into a model and **how to traverse from the anchor to it**. This is the "pull activity from CRM, invoices from finance, learning from LMS" mapping made explicit. Factors reference these by `Alias`.

| Column | Type | Notes |
|---|---|---|
| `ID` | uniqueidentifier | PK |
| `ScoreModelID` | uniqueidentifier | → `ScoreModel` |
| `RelatedEntityID` | uniqueidentifier | → `__mj.Entity` |
| `Alias` | nvarchar(100) | handle used by factors, e.g. `crm_activity`, `invoices`, `lms_completions` |
| `RelationshipPath` | nvarchar(max) | JSON describing the join path anchor→related. Direct FK (`{fk:"MemberID"}`) or multi-hop (`[{entity, fk}, …]`) resolved against MJ relationship metadata. |
| `JoinType` | nvarchar(10) | `Inner` / `Left` (usually Left so absence is scorable) |
| `SourceSystemTag` | nvarchar(60) | informational provenance: `Salesforce`, `Finance`, `LMS`, `Community`, `Email` |
| `Description` | nvarchar(max) | |

Index: `(ScoreModelID)`, unique `(ScoreModelID, Alias)`.

#### `ScoreBandSet` / `ScoreBand`
Qualitative banding (Healthy / Watch / At-Risk / Critical). Reusable across models.

`ScoreBandSet`: `ID`, `Name`, `AnchorEntityID` (→`__mj.Entity`, nullable for generic), `Description`.

`ScoreBand`:

| Column | Type | Notes |
|---|---|---|
| `ID` | uniqueidentifier | PK |
| `BandSetID` | uniqueidentifier | → `ScoreBandSet` |
| `Label` | nvarchar(60) | `Healthy` / `Watch` / `At-Risk` / `Critical` |
| `MinScore` / `MaxScore` | decimal(9,4) | half-open ranges, contiguous, non-overlapping (validated) |
| `Severity` | int | 0 = best; higher = worse. Drives sort + color. |
| `ColorHex` | nvarchar(7) | |
| `IsTerminal` | bit | e.g., "Lapsed" |
| `Description` | nvarchar(max) | |

### 5.2 Factors & windows

#### `Factor`
A reusable signal definition. The heart of the system. **One uniform contract, two implementations.**

| Column | Type | Notes |
|---|---|---|
| `ID` | uniqueidentifier | PK |
| `Name` / `Slug` | nvarchar | `slug` referenced by rubric + expressions |
| `Description` | nvarchar(max) | |
| `ScoreModelID` | uniqueidentifier | nullable. **null = shared library factor** reusable across models. |
| `AnchorEntityID` | uniqueidentifier | → `__mj.Entity`. For library factors, the anchor they apply to. |
| `FactorType` | nvarchar(20) | `Declarative` / `ActionBacked` / `DerivedFromScore` / `Constant` |
| **Declarative fields** | | *(used when `FactorType=Declarative`)* |
| `SourceRelatedEntityID` | uniqueidentifier | → `ModelRelatedEntity` (model-scoped) |
| `SourceEntityID` | uniqueidentifier | → `__mj.Entity` (library factors) |
| `FilterExpression` | nvarchar(max) | JSON/DSL over the related entity, e.g. `ActivityType IN ('EmailOpen','EmailClick')` |
| `Aggregation` | nvarchar(20) | `Count` / `Sum` / `Avg` / `Min` / `Max` / `DistinctCount` / `Recency` / `RatePerPeriod` / `Exists` / `TrendSlope` |
| `AggregateFieldName` | nvarchar(200) | column to sum/avg; null for Count/Exists |
| `TimeWindowID` | uniqueidentifier | → `TimeWindow` |
| `RecencyDecayHalfLifeDays` | int | nullable; recency-weighted aggregation |
| **Action-backed fields** | | *(used when `FactorType=ActionBacked`)* |
| `ActionID` | uniqueidentifier | → `__mj.Action` (code-based or Runtime Action) |
| `ActionParamsJSON` | nvarchar(max) | static params bound at config time |
| `ExecutionMode` | nvarchar(12) | `PerRecord` / `Batch` |
| `IsExpensive` | bit | surfaced in builder; gates recompute budgeting |
| `MaxConcurrency` | int | nullable |
| `RateLimitPerMinute` | int | nullable; for external-API actions |
| `CacheTTLSeconds` | int | result caching keyed by `(AnchorRecordID, AsOfDate, ActionParams hash)` |
| **DerivedFromScore fields** | | *(compose models — `FactorType=DerivedFromScore`)* |
| `SourceScoreModelID` | uniqueidentifier | → `ScoreModel` (use another model's score as a factor) |
| **Normalization (all types)** | | |
| `RawDataType` | nvarchar(12) | `Number` / `Date` / `Boolean` / `Duration` |
| `NormalizationMethod` | nvarchar(20) | `None` / `MinMax` / `Percentile` / `ZScore` / `Logistic` / `Banded` / `Lookup` |
| `NormalizationParamsJSON` | nvarchar(max) | clamps, percentile basis (`Population`/`Benchmark`), logistic midpoint/steepness, banded thresholds, lookup table |
| `OutputMin` / `OutputMax` | decimal(9,4) | normalized contribution range (e.g., 0–1) |
| `HigherIsBetter` | bit | direction (recency/days-since-login is inverted) |
| **Governance** | | |
| `PromotionState` | nvarchar(20) | `Draft` / `InReview` / `Approved` / `Deprecated` — enforced for `ActionBacked` before production use |
| `LastValidatedAt` | datetime2 | |
| `CreatedByAgent` | nvarchar(60) | nullable: `ModelBuilderAgent` / `ActionBuilder` / null |

Indexes: `(ScoreModelID)`, `(AnchorEntityID, FactorType)`, `(ActionID)`.

> **Design note — the uniform contract.** `sonar-core` defines a single TypeScript interface `IFactorEvaluator` with `evaluateBatch(anchorIds, asOf, ctx) → Map<anchorId, FactorResult>` where `FactorResult = { rawValue, normalizedContribution, hadData, explanation }`. Declarative factors are compiled to one set-based SQL query implementing this; Action-backed factors wrap the MJ Action call. The rubric engine and the explainability UI consume only `IFactorEvaluator` and never know which kind they hold. **This is the single most important seam in the codebase — keep it clean.**

#### `TimeWindow`
Reusable, first-class windows. Renewal-relative windows make "decay 47 days before renewal" a different thing from "decay 300 days out."

| Column | Type | Notes |
|---|---|---|
| `ID` | uniqueidentifier | PK |
| `Name` | nvarchar(120) | "trailing 90 days", "current term", "renewal window (−90d)" |
| `WindowType` | nvarchar(20) | `Rolling` / `Calendar` / `SinceEvent` / `RenewalRelative` / `AllTime` |
| `LengthDays` / `LengthMonths` | int | for `Rolling`/`Calendar` |
| `AnchorDateField` | nvarchar(200) | for `RenewalRelative`/`SinceEvent`: a field on the anchor (e.g. `RenewalDate`) |
| `OffsetDays` | int | window start offset from the anchor date |
| `Description` | nvarchar(max) | |

#### `ModelFactor` (the rubric binding)
Binds a `Factor` into a model with its weight and contribution rules. **The rubric is the set of these rows.**

| Column | Type | Notes |
|---|---|---|
| `ID` | uniqueidentifier | PK |
| `ScoreModelID` | uniqueidentifier | → `ScoreModel` |
| `FactorID` | uniqueidentifier | → `Factor` |
| `Weight` | decimal(9,4) | |
| `WeightMode` | nvarchar(12) | `Additive` / `Multiplier` / `Gate` / `Penalty` / `Bonus` — expressive rubrics beyond a flat weighted sum |
| `ContributionCap` / `ContributionFloor` | decimal(9,4) | clamp this factor's contribution |
| `TrendWeight` | decimal(9,4) | extra weight on the factor's *delta* vs its *level* — encodes "a falling 80 beats a steady 50" |
| `MissingDataPolicy` | nvarchar(16) | `Zero` / `NeutralMidpoint` / `Exclude` / `ModelDefault` |
| `IsRequired` | bit | if true and data missing → score flagged low-confidence |
| `DisplayLabel` | nvarchar(200) | explainability label, e.g. "Newsletter engagement" |
| `DisplayOrder` | int | |

Index: unique `(ScoreModelID, FactorID)`.

### 5.3 Runtime output entities

#### `Score`
The **current** score: one row per (model × anchor record). Written back into MJ as a first-class entity.

| Column | Type | Notes |
|---|---|---|
| `ID` | uniqueidentifier | PK |
| `ScoreModelID` | uniqueidentifier | → `ScoreModel` |
| `ScoreModelVersionID` | uniqueidentifier | → `ScoreModelVersion` (which version produced this) |
| `AnchorEntityID` | uniqueidentifier | → `__mj.Entity` |
| `AnchorRecordID` | nvarchar(100) | PK value of the scored record (string to be entity-agnostic) |
| `AnchorRecordKeyJSON` | nvarchar(max) | nullable; for composite keys |
| `RawScore` | decimal(12,4) | pre-scale combined value |
| `NormalizedScore` | decimal(9,4) | the headline 0–100 |
| `BandID` | uniqueidentifier | → `ScoreBand` |
| `PreviousNormalizedScore` | decimal(9,4) | |
| `PreviousBandID` | uniqueidentifier | |
| `Delta` | decimal(9,4) | normalized − previous, over `TrendWindowDays` |
| `TrendDirection` | nvarchar(8) | `Up` / `Down` / `Flat` |
| `TrendSlope` | decimal(12,6) | regression slope over recent history |
| `Confidence` | decimal(5,4) | 0–1, derived from data completeness |
| `DataCompleteness` | decimal(5,4) | fraction of factors that had data |
| `ComputedAt` | datetime2 | |
| `AsOfDate` | datetime2 | the "now" the windows resolved against |
| `NextRecomputeAt` | datetime2 | nullable |
| `IsStale` | bit | population stats moved but record not yet recomputed |
| `ExplanationSummary` | nvarchar(max) | cached AI natural-language "why", refreshed on material change |

Indexes: **unique** `(ScoreModelID, AnchorRecordID)`; `(ScoreModelID, BandID)`; `(ScoreModelID, NormalizedScore)`; `(ScoreModelID, TrendDirection, Delta)` for "who dropped most."

#### `ScoreFactorContribution`
Per-factor breakdown of the **current** score. The explainability spine — this is what makes the narrative free.

| Column | Type | Notes |
|---|---|---|
| `ID` | uniqueidentifier | PK |
| `ScoreID` | uniqueidentifier | → `Score` |
| `ModelFactorID` | uniqueidentifier | → `ModelFactor` |
| `FactorID` | uniqueidentifier | → `Factor` (denormalized for query convenience) |
| `RawValue` | decimal(18,6) | nullable |
| `NormalizedValue` | decimal(9,4) | the factor's 0–1 (or configured) output |
| `WeightedContribution` | decimal(12,4) | what it added to the score |
| `PercentOfTotal` | decimal(5,4) | share of the score |
| `ContributionDelta` | decimal(12,4) | change vs previous score |
| `HadData` | bit | |
| `MissingDataApplied` | bit | |
| `DetailJSON` | nvarchar(max) | nullable: sampled underlying record refs for drill-through |

Index: `(ScoreID)`, `(FactorID)`.

#### `ScoreHistory`
Time-series snapshots — **the trajectory is the asset.** Append-only.

| Column | Type | Notes |
|---|---|---|
| `ID` | uniqueidentifier | PK |
| `ScoreModelID` | uniqueidentifier | → `ScoreModel` |
| `ScoreModelVersionID` | uniqueidentifier | → `ScoreModelVersion` |
| `AnchorEntityID` | uniqueidentifier | |
| `AnchorRecordID` | nvarchar(100) | |
| `NormalizedScore` | decimal(9,4) | |
| `BandID` | uniqueidentifier | |
| `AsOfDate` | datetime2 | |
| `ComputedAt` | datetime2 | |
| `DataCompleteness` | decimal(5,4) | |
| `Confidence` | decimal(5,4) | |
| `ContributionsJSON` | nvarchar(max) | compact per-factor snapshot for point-in-time explainability without exploding row counts |

Index: `(ScoreModelID, AnchorRecordID, AsOfDate)`; consider monthly partitioning / retention policy for large populations.

> **Design note — history granularity.** Don't snapshot every record every night forever. Snapshot on **change** (score moved beyond a small epsilon, or band changed) plus a **periodic keyframe** (e.g., monthly) so trajectories are reconstructable without unbounded growth. Store the compact `ContributionsJSON` rather than per-factor rows in history.

#### `ScoreBandTransition`
First-class record of a band crossing — the event the action layer and write-back key off.

| Column | Type | Notes |
|---|---|---|
| `ID` | uniqueidentifier | PK |
| `ScoreModelID` / `AnchorRecordID` | | |
| `FromBandID` / `ToBandID` | uniqueidentifier | |
| `Direction` | nvarchar(12) | `Improving` / `Worsening` |
| `OccurredAt` | datetime2 | |
| `RecomputeRunID` | uniqueidentifier | → `ScoreRecomputeRun` |
| `Handled` | bit | picked up by write-back / intervention |

Index: `(ScoreModelID, OccurredAt)`, `(Handled)`.

### 5.4 Recompute & audit

#### `ScoreRecomputeRun`
One batch/event recompute pass. Drives the Admin health view and **compute/cost metering**.

| Column | Type | Notes |
|---|---|---|
| `ID` | uniqueidentifier | PK |
| `ScoreModelID` / `ScoreModelVersionID` | uniqueidentifier | |
| `TriggerType` | nvarchar(16) | `Scheduled` / `Event` / `Manual` / `Backfill` |
| `Scope` | nvarchar(16) | `FullPopulation` / `Incremental` / `SingleRecord` |
| `StartedAt` / `CompletedAt` | datetime2 | |
| `Status` | nvarchar(16) | `Running` / `Succeeded` / `Failed` / `PartialSuccess` |
| `RecordsScored` / `RecordsChanged` / `BandTransitions` | int | |
| `DurationMs` | bigint | |
| `CostUnitsConsumed` | decimal(12,4) | tokens/compute for Action-backed factors — feeds metering/billing |
| `ErrorsJSON` | nvarchar(max) | |

#### `ScoreModelAuditEvent`
Config-change audit — who changed which weight/factor/window when. Required for an explainable, governed scoring product.

`ID`, `ScoreModelID`, `EntityChanged` (`ScoreModel`/`Factor`/`ModelFactor`/…), `RecordID`, `ChangeType` (`Create`/`Update`/`Delete`/`Publish`), `BeforeJSON`, `AfterJSON`, `ChangedByUserID`, `ChangedAt`.

### 5.5 Action governance & write-back

#### `ActionPromotion`
Governance gate for Action-backed factors and write-back actions — the safety valve on the **Action Builder / CodeSmith** loop. A generated Runtime Action cannot be used by a *production* model until promoted to `Approved`.

| Column | Type | Notes |
|---|---|---|
| `ID` | uniqueidentifier | PK |
| `ActionID` | uniqueidentifier | → `__mj.Action` |
| `ScoreModelID` | uniqueidentifier | nullable (null = global approval) |
| `PromotionState` | nvarchar(16) | `Draft` / `InReview` / `Approved` / `Deprecated` |
| `GeneratedBy` | nvarchar(20) | `Manual` / `ActionBuilder` / `CodeSmith` |
| `TestRunID` | nvarchar(100) | link to CodeSmith test results |
| `TestsPassed` | bit | |
| `TestCoveragePercent` | decimal(5,2) | |
| `SourceArtifactURL` | nvarchar(500) | generated code / spec |
| `RequestedByUserID` / `ReviewedByUserID` | uniqueidentifier | |
| `ReviewedAt` | datetime2 | |
| `ApprovalNotes` | nvarchar(max) | |

#### `WriteBackTarget`
A destination to push scores/bands to, via the **existing MJ integration architecture**. Sonar does not reimplement connectors — it binds to an integration connection and an Action that performs the write.

| Column | Type | Notes |
|---|---|---|
| `ID` | uniqueidentifier | PK |
| `ScoreModelID` | uniqueidentifier | → `ScoreModel` |
| `Name` | nvarchar(200) | |
| `IntegrationConnectionID` | uniqueidentifier | → MJ integration/connection metadata |
| `TargetSystem` | nvarchar(60) | `Salesforce` / `HubSpot` / `Dynamics` / `MarketingCloud` / … |
| `TargetEntity` | nvarchar(200) | external object/entity |
| `WriteBackActionID` | uniqueidentifier | → `__mj.Action` performing the push |
| `FieldMapJSON` | nvarchar(max) | which Score fields → which external fields (`NormalizedScore`→`Engagement_Score__c`, `Band.Label`→`Engagement_Tier__c`, `ExplanationSummary`→note, …) |
| `IsActive` | bit | |

#### `WriteBackPolicy`
**When** to push. Push on *meaningful change*, not every nightly wiggle.

| Column | Type | Notes |
|---|---|---|
| `ID` | uniqueidentifier | PK |
| `WriteBackTargetID` | uniqueidentifier | → `WriteBackTarget` |
| `TriggerType` | nvarchar(20) | `OnBandChange` / `OnThresholdCross` / `OnEveryRecompute` / `Scheduled` |
| `ThresholdDelta` | decimal(9,4) | min normalized change to trigger |
| `BandTransitionFilter` | nvarchar(20) | `Any` / `WorseningOnly` / `ImprovingOnly` |
| `MinIntervalHours` | int | debounce |
| `LoopGuardEnabled` | bit | suppress pushes that would re-enter as a factor (circular feedback guard) |
| `IsActive` | bit | |

#### `WriteBackLog`
Audit + idempotency/reconciliation of every push.

`ID`, `WriteBackTargetID`, `ScoreID`, `AnchorRecordID`, `PushedAt`, `Status` (`Success`/`Failed`/`Skipped`), `IdempotencyKey`, `PayloadJSON`, `ExternalRecordID`, `ResponseJSON`, `ErrorMessage`, `RetryCount`. Index `(WriteBackTargetID, PushedAt)`, unique `(IdempotencyKey)`.

### 5.6 Action layer (v1)

The loop that makes Sonar more than a dashboard. **Built in Phase 1** (§11) — segment → intervention → holdout → outcome.

#### `ScoreSegment`
A saved cohort over scores (the thing you act on). E.g., "At-risk in renewal window."

`ID`, `ScoreModelID`, `Name`, `Description`, `FilterExpression` (JSON over band/score/delta/trend/window + any anchor field), `IsDynamic` (bit), `MemberCountCached` (int), `LastEvaluatedAt`.

#### `Intervention`
What to do for a segment, **with a holdout**.

| Column | Type | Notes |
|---|---|---|
| `ID` | uniqueidentifier | PK |
| `ScoreSegmentID` | uniqueidentifier | → `ScoreSegment` |
| `Name` | nvarchar(200) | |
| `TriggerType` | nvarchar(20) | `OnEnterSegment` / `Scheduled` / `Manual` |
| `ActionID` | uniqueidentifier | → `__mj.Action` (drafts outreach, routes to staff, enrolls in journey) |
| `ControlGroupPercent` | decimal(5,2) | **holdout** — % withheld for lift measurement |
| `Status` | nvarchar(16) | `Draft` / `Active` / `Paused` |

#### `InterventionAssignment` / `InterventionOutcome`
Lift measurement spine (§7.5).

`InterventionAssignment`: `ID`, `InterventionID`, `AnchorRecordID`, `Cohort` (`Treatment`/`Control`), `AssignedAt`, `ActionDeliveryStatus`.

`InterventionOutcome`: `ID`, `AssignmentID`, `OutcomeType` (`Renewed`/`Reactivated`/`Churned`/`Upgraded`/`NoChange`), `OutcomeAt`, `ScoreDeltaAfter`, `MeasuredAt`.

### 5.7 Calibration network (BC SaaS only)

De-identified, consent-gated, cross-tenant. Answers "is this score good?"

#### `FactorArchetype`
Canonical factor taxonomy so factors mean the same thing across tenants ("newsletter_open_rate_90d", "event_attendance_12m"). Tenant `Factor`s map to an archetype to participate.

`ID`, `Key`, `Name`, `Description`, `AnchorArchetype` (`Member`/`Donor`/…), `Unit`, `Direction`.

#### `BenchmarkDistribution`
Rolled-up distribution stats per archetype × org segment × period. The normalization basis for calibrated models.

`ID`, `FactorArchetypeID`, `OrgSegment` (size band × org type), `Period`, `P10`, `P25`, `P50`, `P75`, `P90`, `Mean`, `StdDev`, `SampleSize`, `ComputedAt`.

#### `CalibrationConsent`
Per-tenant opt-in with scope + revocation history. **Opt-in default** (trust beats dataset speed).

`ID`, `TenantID`, `Scope` (`ContributeOnly`/`ContributeAndConsume`), `GrantedByUserID`, `GrantedAt`, `RevokedAt`, `ArchetypeFilterJSON`.

#### `BenchmarkContribution`
The de-identified write from a tenant into the network (audit + revocation support).

`ID`, `TenantID`, `FactorArchetypeID`, `Period`, `AggregatedStatsJSON` (already aggregated/de-identified at write time — **no record-level data leaves a tenant**), `ContributedAt`.

### 5.8 Templates & misc

#### `ModelTemplate`
Prebuilt models shipped in the OpenApp. Installing a template runs the Model Builder agent to **map the template's logical factors onto the tenant's actual entities**, producing a real `ScoreModel` + `Factor`s + `ModelFactor`s.

`ID`, `Name`, `Vertical` (`Association`/`Nonprofit`/…), `AnchorArchetype`, `Description`, `TemplateConfigJSON` (logical anchor + factors + rubric + bands, in archetype terms), `Version`.

Shipped templates: **Renewal Risk**, **Community Engagement**, **Learning Engagement**, **Donor Propensity**, **Chapter/Component Health**, **Sponsor Health**.

#### Entity relationship summary

```
ScoreModel 1─┬─N ModelRelatedEntity
             ├─N ModelFactor ──N─1 Factor ──(0..1)─ TimeWindow
             ├─N ScoreModelVersion ──1─N Score ──1─N ScoreFactorContribution
             │                                  └────1─N ScoreHistory
             ├─N ScoreBandTransition            
             ├─1 ScoreBandSet ──1─N ScoreBand
             ├─N WriteBackTarget ──1─N WriteBackPolicy / WriteBackLog
             ├─N ScoreSegment ──1─N Intervention ──1─N InterventionAssignment ──1─1 InterventionOutcome
             └─N ScoreRecomputeRun / ScoreModelAuditEvent

Factor (ActionBacked) ──1─1 __mj.Action ──(governed by)── ActionPromotion
FactorArchetype ──1─N BenchmarkDistribution / BenchmarkContribution        (BC SaaS)
```

---

## 6. The Scoring Engine

> **Superseded in part — see [`platform-alignment-refactor.md`](./platform-alignment-refactor.md).** The pipeline below remains the correct *logical* specification, but steps 2–3 (factor evaluation) are implemented on Predictive Studio feature assembly + a Record Set Processing work type, steps 7–8 ride the RSP tracker (`ProcessRunID`), §6.2's orchestration rides RSP + MJ Scheduling, and the on-demand API is a Remote Operation. Do not hand-build the batching/concurrency/rate-limit/budget machinery described in step 3.

`sonar-engine`. Stateless services over the `__mj_BizAppsSonar` data, invoked by the recompute orchestrator and the on-demand API.

### 6.1 Recompute pipeline (per model, per run)

1. **Resolve population.** Apply `ScoreModel.PopulationFilter` over the anchor entity → the set of `AnchorRecordID`s in scope. For incremental runs, intersect with records whose contributing related-entity data changed since the last run (via MJ entity change tracking).
2. **Evaluate declarative factors (set-based).** The `FactorCompiler` turns each declarative factor into **one** SQL query: join anchor→related via `RelationshipPath`, apply `FilterExpression` + `TimeWindow`, `GROUP BY` anchor key, apply `Aggregation` (+ recency decay). One pass yields raw values for the whole population. Cheap, batchable.
3. **Evaluate Action-backed factors.** Honor `ExecutionMode` (Batch vs PerRecord), `MaxConcurrency`, `RateLimitPerMinute`, and `CacheTTLSeconds` (cache keyed by `(AnchorRecordID, AsOfDate, params hash)`). `IsExpensive` factors are budgeted; a model exceeding its recompute budget degrades gracefully (skip + mark stale) rather than melting down.
4. **Normalize.** For population-relative methods (`Percentile`/`ZScore`/`MinMax`), compute population stats first, then normalize each raw value. For **calibrated** models (`IsCalibrated=1`), pull `BenchmarkDistribution` as the basis (or blend local + benchmark). Direction applied via `HigherIsBetter`.
5. **Combine (rubric).** Apply `ModelFactor` weights and `WeightMode` (additive/multiplier/gate/penalty/bonus), caps/floors, `TrendWeight` (level vs delta), and `MissingDataPolicy` → `RawScore`. Scale to 0–100 via `CombineStrategy` → `NormalizedScore`.
6. **Band + trend.** Assign `BandID`; compute `Delta`/`TrendDirection`/`TrendSlope` vs prior `Score` over `TrendWindowDays`; compute `Confidence` from `DataCompleteness`.
7. **Persist.** Upsert `Score`; replace `ScoreFactorContribution`; append `ScoreHistory` (on change/keyframe); on band crossing write `ScoreBandTransition` (→ enqueues write-back + interventions).
8. **Record** `ScoreRecomputeRun` (counts, duration, `CostUnitsConsumed`).

### 6.2 Recompute strategy

- **Scheduled** full pass (e.g., nightly) recomputes population-relative normalization stats — the source of truth.
- **Event-driven** incremental recompute reacts to data changes between full passes, reusing the last full pass's normalization stats and flagging `IsStale` when stats drift materially.
- **On-demand** single-record scoring for the UI ("score this member now").
- Population-relative normalization is the reason incremental can't fully replace scheduled: stats shift as the population shifts. Recompute stats on schedule; deltas in between.

### 6.3 Explainability

Falls out of the declarative model. `ScoreFactorContribution` gives the itemized math; the **Explainer agent** (§8) renders `Score.ExplanationSummary` in natural language ("down 12 since March, driven by …") and refreshes it only on material change to keep token cost bounded.

---

## 7. Factor & Rubric Authoring

### 7.1 Three authoring modes, one underlying representation

All three produce the same `Factor` + `ModelFactor` + `ScoreBand` rows.

1. **AI-first (leads the demo).** The **Model Builder agent** introspects the MJ schema off the chosen anchor, and from a sentence ("engagement means showing up, learning, and paying us") proposes the anchor, related-entity map, a starting factor set with sensible windows/weights/normalization, and bands. The human tunes.
2. **Visual builder.** Pick anchor → see available related entities (from MJ relationship metadata) → add factors from the library or define new ones with dropdowns (entity, filter, aggregation, window, normalization) → drag weights → preview the band distribution live.
3. **Formula escape hatch.** `CombineExpression` over factor slugs for power users (`0.4*newsletter + 0.3*events + 0.3*cert - penalty(dues_lapsed)`).

### 7.2 Declarative core vs Action plugin

- **Declarative core** covers count/sum/avg/distinct/recency/rate/trend over a related entity with a filter + window + normalization. This is the 80%, all config, all set-based SQL.
- **Action plugin** is the escape hatch for arbitrary logic: external propensity model call, custom RFM decay, NLP sentiment over community posts, blended third-party signals. Code-based Actions or **Runtime Actions** generated by the Action Builder.

### 7.3 The Action Builder / CodeSmith loop

"Describe the weird factor you want" → **Action Builder** uses **CodeSmith** to generate the implementation, generate + run tests, and wrap it as a **Runtime Action** in the MJ catalog → it appears as an `ActionBacked` factor option. AI at the *extensibility* layer, not just authoring.

### 7.4 Governance gate (§5.5 `ActionPromotion`)

A generated Runtime Action is `Draft` until tests pass and a human promotes it to `Approved`. **A production `Active` model may bind only `Approved` Action-backed factors.** Draft factors run in simulation/preview only. This keeps generated code from silently moving real members' scores.

### 7.5 Lift measurement (honest performance pricing)

Every `Intervention` supports a `ControlGroupPercent` holdout. Treatment vs Control outcomes (`InterventionOutcome`) yield a **measured** lift number — the trust-builder with skeptical EDs and the only honest basis for the optional performance fee. Most competitors won't hold out a control group; doing so is a wedge, not a tax.

---

## 8. AI Agent Roster

All on MJ's agent framework, registered via the bootstrap pattern, each owning a measurable KPI.

| Agent | KPI | Description |
|---|---|---|
| **Model Builder Agent** | Time-to-first-published-model; human edits before publish | Introspects MJ schema; proposes anchor, related-entity map, factors, weights, windows, bands from a natural-language brief; maps `ModelTemplate`s onto a tenant's real entities at install. |
| **Explainer Agent** | Staff-rated usefulness of explanations; action rate on explained scores | Renders `Score.ExplanationSummary` and band-transition narratives from `ScoreFactorContribution`. |
| **Recompute Orchestrator** | Recompute success rate; cost per 1K scores; staleness | Plans and runs scheduled/incremental/on-demand recompute within budget; manages Action factor batching/caching. |
| **Dashboard Builder Agent** | Time-to-dashboard; dashboard usage | Builds the opinionated trajectory/cohort + explainability dashboards (not generic BI) from a model. |
| **Intervention Drafter** (v1) | Intervention launch rate; measured lift | Drafts segment-specific outreach / routing as Actions; wires the holdout. Ships with the v1 action layer. |
| **Re-weight Advisor** (Phase 2+) | Suggested-weight acceptance; lift vs hand-set | From accumulated outcome data, proposes weight adjustments ("your renewal data suggests +1.5× cert-lapse weight"). Needs outcome history, so it follows the action layer rather than shipping with it. Hand-set stays the transparent default. |
| **Calibration Aggregator** (BC SaaS) | Benchmark freshness; opt-in rate | De-identifies + aggregates tenant factor stats into `BenchmarkDistribution` honoring consent scope. |
| **Action Builder / CodeSmith** | Runtime Actions generated + promoted; test pass rate | Generates, tests, and catalogs custom factor logic as Runtime Actions (§7.3). |

---

## 9. Surfaces & UX (mockups)

Clickable HTML mockups under `mockups/`. Entry: `mockup.html`.

- `mockups/builder/` — **Model Builder**: AI-first authoring (chat → proposed rubric), visual factor/rubric editor over the MJ entity graph, live band-distribution preview, publish-a-version.
- `mockups/manager/` — **Engagement Manager**: the Monday briefing (who moved, who's at risk in the renewal window), score drill-down with factor-level *why*, cohort/trajectory view.
- `mockups/admin/` — **Admin/Ops**: recompute health + schedule, write-back targets + policy, Action promotion/governance, compute/cost ledger, calibration consent.

### 9.1 Model Builder
Conversational pane (Model Builder agent proposing a rubric) on one side; the declarative editor on the other — anchor selector, related-entity map (showing `SourceSystemTag` provenance), factor list with weights and windows, normalization controls, band editor, and a live histogram of the resulting population score distribution. "Add custom factor" opens the Action Builder path. "Publish" creates a `ScoreModelVersion`.

### 9.2 Engagement Manager
Top: the briefing — counts by band, biggest droppers this week, at-risk-in-renewal-window cohort. Click a member → the explainability drill-down: current score, trajectory sparkline, and the `ScoreFactorContribution` waterfall ("−22 cert lapsed, −15 newsletter decay, +8 events"). "Launch intervention" on a cohort, with the holdout shown — v1.

### 9.3 Admin / Ops
Recompute runs (status, records scored, band transitions, duration, cost units), write-back target config + policy (push-on-band-change), Action promotion queue (Draft → Approved with test results), and calibration consent toggle.

---

## 10. Phase 0: Discovery (pre-build, required)

**Output:** 3–5 design-partner LOIs, a locked v1 scope, go/no-go. (Gated by design-partner availability and the feasibility spike — not by build effort.)

**Activities:**
1. **8–10 customer-development calls** with associations that already attempt an MEI. Tests: is the *authoring + explainability + write-back* loop worth paying for over their spreadsheet? Is multi-model real demand or a nice-to-have?
2. **MJ feasibility spike** — confirm: (a) entity/relationship metadata is rich enough for the `FactorCompiler` to auto-traverse anchor→related; (b) the Action framework supports the per-record/batch + caching execution model; (c) the integration architecture exposes a write-back binding Sonar can target; (d) OpenApp packaging can ship entities + agents + surfaces together.
3. **Reference rubric** — codify one real association's MEI as a Sonar model end-to-end as the canonical template + demo.
4. **Calibration legal review** — de-identification + consent model for the network.

**Kill criteria:**
- Fewer than 3 LOIs.
- MJ metadata can't support auto-traversal *and* hand-mapping every model proves too heavy to be a product.
- Associations consistently say the spreadsheet MEI is "good enough" and won't pay for authoring/explainability/write-back.
- Write-back to source systems proves infeasible through the existing integration architecture (kills the "operational, not just visible" wedge).

---

## 11. Roadmap

Phases are **sequence and scope, not calendar.** With AI-assisted build, the binding constraints here are design-partner validation, data access, and review/governance — not engineering weeks. Ship in this order; let each phase close when its scope is done and verified, not when a date arrives.

**Phase 1 — Engine + Actions + the action layer + one template**
The whole single-tenant product, *including acting on scores.* Deliberately broad — the action layer is a v1 commitment, not a follow-on.
- `__mj_BizAppsSonar` schema + migrations + CodeGen + GraphQL (full schema incl. action-layer + write-back tables).
- `sonar-engine`: FactorCompiler (declarative → SQL), **Action-backed factor runtime** (batch/cache/budget) + `ActionPromotion` gate, NormalizationEngine, RecomputeOrchestrator (scheduled + event + on-demand), band/trend, `Score` + `ScoreFactorContribution` + `ScoreHistory` + `ScoreBandTransition`.
- Model Builder surface (visual editor) + AI authoring agent.
- Engagement Manager surface (briefing + explainability drill-down + **segments + interventions**).
- **Action layer:** `ScoreSegment` → `Intervention` → `ControlGroupPercent` holdout → `InterventionAssignment`/`InterventionOutcome` lift measurement; Intervention Drafter agent; interventions fire as MJ **Actions**.
- Renewal Risk `ModelTemplate`; reference rubric from Phase 0.
- Score write-back to ≥1 target via integration architecture (`WriteBackTarget`/`Policy`/`Log`, OnBandChange).
- OpenApp packaging (single-tenant).

> **Scope note for the fellow:** if Phase 1 needs to be split to de-risk, the cut line is **CodeSmith *generation* of Runtime Actions** (Phase 2) — *not* the action layer. Phase 1 can bind existing/approved Actions for both factors and interventions; the generate→test→catalog loop can follow. Keep segments → interventions → holdout → outcome in Phase 1; that's the product.

**Phase 2 — Multi-model + CodeSmith generation loop + admin hardening**
- Action Builder / CodeSmith generation loop for Runtime Action factors and intervention Actions (Phase 1 binds existing Actions; Phase 2 generates + tests + catalogs new ones).
- Multiple concurrent models + `DerivedFromScore` composition.
- Admin/Ops surface (recompute health, write-back policy, promotion queue, cost ledger).
- Event-driven incremental recompute at scale.
- Re-weight Advisor agent (now there's outcome history to learn from).
- Remaining templates (Community Engagement, Learning Engagement, Donor Propensity, Chapter Health).

**Phase 3 — Calibration network (BC SaaS)**
- `FactorArchetype` + `BenchmarkDistribution` + `CalibrationConsent`; Calibration Aggregator agent; calibrated normalization basis.
- Executive dashboard; performance-pricing instrumentation (lift is already measured from Phase 1 — this productizes the billing).

**Commercial-ready v1** is the close of Phase 1 — the single-tenant product *with* the action layer and measured lift. Phase 3 calibration gates the BC SaaS premium tier.

---

## 12. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **"Just another dashboard."** | High | High | The action layer ships in v1 precisely to kill this — segment → intervention → measured lift, plus write-back + explainability, *are* the product. Lead every demo with the briefing → drill-down → launch-intervention loop, never a chart. |
| **Garbage-in / shallow integration.** | Med | High | Sonar is MJ-only at v1; score quality = integration depth. `DataCompleteness`/`Confidence` surface gaps honestly rather than hiding them. |
| **Action-backed factors melt down at scale.** | Med | High | Hard seam between set-based declarative and per-record Action factors; batch + cache + `IsExpensive` + recompute budget + graceful degradation. |
| **Generated Runtime Action moves scores wrongly.** | Med | High | `ActionPromotion` gate: only `Approved`, tested Actions in production models; drafts run in simulation only. |
| **Population-relative normalization unstable on small/sparse populations.** | Med | Med | Min sample-size guards; fall back to banded/absolute normalization or benchmark basis (calibrated models); flag low confidence. |
| **Feature-not-company perception.** | Med | High | The three product-shaped pillars: authoring agent, calibration network, action layer. Don't ship "a config screen." |
| **Causal lift unprovable.** | Med | Med | Built-in holdout discipline (`ControlGroupPercent`); never claim lift without a control group. |
| **Cross-tenant data leakage.** | Low | High | Aggregate/de-identify at write time (no record-level data leaves a tenant); opt-in consent; revocation; audited. |
| **Write-back feedback loops.** | Low | Med | `LoopGuardEnabled`; push on band change not every wiggle; document that pushed scores shouldn't be re-ingested as factors. |
| **MJ metadata insufficient for auto-traversal.** | Med | High | Phase 0 spike; fall back to explicit hand-mapped `RelationshipPath` with a good editor. |
| **Over-scope at v1.** | High | High | Phase 1 deliberately includes the action layer (the product's whole point), so it's larger. The pressure valve is the **CodeSmith generation loop** (Phase 2) and **multi-model + calibration** (Phase 2–3) — not the action layer. Phase 1 stays to 1 template, ≥1 write-back target, and binding existing Actions rather than generating new ones. |

---

## 13. Open Decisions (need input)

1. **Brand.** "Sonar" is the working title; trademark/focus-test before graduation. Alternatives: Quotient, Cadence, Lumen, Tempo.
2. **Action layer in v1 or later?** **Resolved: v1.** Segments → interventions → holdout-measured lift ship in Phase 1; deferring them is the dashboard trap. The remaining call is only the Phase-1 split valve (CodeSmith generation → Phase 2), not whether to act.
3. **Authoring lead mode.** Recommendation: AI-first authoring leads the demo, visual builder underneath, formula escape hatch for power users. Confirm whether MJ already has a query/view builder to lean on rather than build.
4. **Standalone product vs MJ platform capability.** Recommendation: product, via the three pillars (authoring/calibration/action). Same fork CIT wrestles with — needs an explicit call.
5. **Calibration default.** Opt-in (recommended, trust) vs opt-out (faster dataset). Recommendation: opt-in.
6. **Normalization default.** Percentile-vs-population is the most intuitive default; ZScore for power users; banded for small populations. Confirm default.
7. **History retention.** Change+keyframe snapshotting (recommended) vs full nightly snapshots. Confirm retention window per tier.
8. **Anchor breadth at v1.** Members only at v1 (recommended) with the engine entity-agnostic, donors/volunteers/learners as fast-follow templates — or ship 2 anchors day one?
9. **Compute metering model.** Bundle a recompute-cost quota per tier (recommended) vs transparent pass-through above quota.
10. **GitHub repo on graduation.** `bluecypress/sonar` under the BC umbrella (assumed).

---

## 14. Appendix — Key Reference Files

| Topic | Reference |
|---|---|
| Repo conventions for new ideas | `/home/user/new-products/README.md` |
| Reference plan (style + depth bar) | `/home/user/new-products/bob/plan.md` |
| Reference clickable mockup index | `/home/user/new-products/bob/mockup.html` |
| MJ app / OpenApp manifest structure | `/home/user/SaaS/MJ_APP_INIT.md` |
| Migration conventions | `/home/user/SaaS/CLAUDE.md` |
| Server / client bootstrap pattern | `/home/user/SaaS/MJ_APP_INIT.md` |
| BaseEngine pattern | `/home/user/SaaS/MJ-ARCHITECTURE-ANALYSIS.md` |
| MJSERVER middle-layer plugin pattern | `/home/user/SaaS/MJSERVER_MIDDLE_LAYER_PLUGIN.md` |
| BCSaaS package catalog | `/home/user/SaaS/README.md` |
| Izzy reference implementation (confidence-gated agent pattern) | `/home/user/Izzy/` |
| MJ Actions / Runtime Actions / Action Builder / CodeSmith | *(confirm exact docs with the platform team during Phase 0 spike)* |

---

**Next step if approved:** run the Phase 0 MJ feasibility spike (metadata auto-traversal, Action execution model, integration write-back binding, OpenApp packaging) in parallel with design-partner calls. Do not scaffold the repo until the spike confirms the four feasibility questions in §10.2 and ≥3 LOIs are in hand.
