# Sonar — Configurable Engagement Scoring Engine on MemberJunction

> Point at any MemberJunction entity. Wire in the related entities already unified in MJ — CRM activity, finance invoices, LMS completions, community posts, event registrations. Define **any number of concurrent engagement models**, each with its own declarative rubric. Sonar computes **explainable, trending scores**, writes them back to your source systems, and acts on them with holdout-measured lift — all in v1.

**Status:** Draft v0.1 — concept design for build hand-off
**Owner:** TBD (concept by Amith Nagarajan)
**Working title:** "Sonar" (trademark/focus-test pending)
**Last updated:** 2026-06-09

| | |
|---|---|
| 📄 Full plan (detailed DB design) | [`plan.md`](./plan.md) |
| 🖼️ Clickable mockup index | [`mockup.html`](./mockup.html) |
| 🎯 Maturity stage | `idea` → next gate: **Phase 0 MJ feasibility spike + ≥3 design-partner LOIs** |

---

## The opportunity in one paragraph

Engagement scoring is commoditized at the *score* layer and wide open at the *act* layer. Every incumbent — Association Analytics/Acumen, Nimble Predictions, Higher Logic for members; Gainsight/ChurnZero for CS; Culture Amp/Glint for HR — ships a number on a dashboard, over a fixed schema, for a single entity type, and leaves the "so what" to an overloaded human. Sonar inverts all of that on the MemberJunction entity graph: **configuration is data** (anchor, factors, rubric, windows, bands, write-back rules are all rows), the integration is already done (MJ unifies the signals everyone else sells as ETL), scores **decompose for free** into an explainable narrative, and the same engine scores members *and* donors *and* volunteers *and* chapters. It ships as an **OpenApp** — single-tenant on any MJ deployment, or on BC SaaS with a cross-tenant **calibration network** that answers "is this score actually good?"

## Five wedges, each independently defensible

1. **Configurable over the MJ graph.** Any anchor entity; any related entities; many concurrent models. Multi-model, multi-entity, per-org-authored scoring — nobody else does this.
2. **MJ is the data fabric.** The expensive, fragile ETL every competitor charges for is a precondition here, not a project.
3. **Explainable by construction.** A score is a weighted sum of named factors, so "73, down 12 — −15 newsletter decay, −22 cert lapsed" falls out for free.
4. **Cross-tenant calibration (BC SaaS moat).** "Is 6% community participation good?" is learnable across a network and impossible for point tools (no concentration) or consultants (NDAs) to replicate.
5. **The action layer, with honest lift (v1).** Surface the cohort, draft the outreach, fire it as an Action, and measure lift against an automatic holdout — the trust-builder and the basis for performance pricing. Ships in v1, because a score nobody acts on is just a dashboard.

## The one architectural idea

**Configuration-as-data with a uniform Factor contract.** Models, factors, rubrics, windows, bands, write-back rules, and action playbooks are all rows in `__sonar`. Code is the engine that interprets them, plus escape-hatch **Actions** for arbitrary logic.

- **Declarative factors** (count/sum/recency over a related entity + filter + window + normalization) compile to **set-based SQL** — whole population, one pass.
- **Action-backed factors** (code, or **Runtime Actions** generated/tested/cataloged by the **Action Builder / CodeSmith** loop) cover the weird 20% — external models, custom decay, NLP sentiment — behind a **promotion gate** so generated code can't silently move production scores.
- Both satisfy one `IFactorEvaluator` contract, so the rubric engine and the explainability view never branch on which kind they hold.
- **Scores are written back into MJ as first-class entities** — segments, dashboards, agents, and integration write-back all read a normal entity.

## How it ships (Izzy pattern, two legs)

- **Sonar OpenApp (single-tenant)** — engine, entities, starter factor library, model templates, config/dashboard agent, dashboards. Installable on any MJ deployment.
- **Sonar on BC SaaS (multi-tenant)** — the same OpenApp **plus** the cross-tenant calibration network, the action/lift layer, and managed ops. The upgrade path *is* the moat.

## Surfaces & mockups

- [`mockup.html`](./mockup.html) — clickable index
- [Model Builder — AI authoring + visual rubric editor + live band distribution](./mockups/builder/model.html)
- [Engagement Manager — the Monday briefing + factor-level explainability drill-down](./mockups/manager/briefing.html)
- [Admin / Ops — recompute health + cost, write-back policy, Action promotion, calibration consent](./mockups/admin/ops.html)

## What's in `plan.md`

| Section | What you'll find |
|---|---|
| §1 Executive Summary | Thesis, four commitments (incl. scoring *and acting* in v1), commercial model, investment thesis. |
| §2 Strategic Context | Six competing zones, five wedges, the feature-vs-company reframe, what we're explicitly **not** doing, market sizing. |
| §3 Commercial Model | Two deployment legs, pricing dimensions (population × model count), optional lift-based performance fee. |
| §4 Product Architecture | Deployment/OpenApp packaging, surfaces, **the core conceptual model**, schema conventions, package layout. |
| §5 Data Model (detailed) | **Full `__sonar` schema** — configuration, factors & windows, runtime output, recompute/audit, Action governance & write-back, action layer (v1), calibration network, templates — with columns, types, FKs, indexes, and design notes. |
| §6 Scoring Engine | Recompute pipeline, recompute strategy, explainability. |
| §7 Factor & Rubric Authoring | Three authoring modes, declarative core vs Action plugin, the CodeSmith loop, governance gate, lift measurement. |
| §8 AI Agent Roster | Model Builder, Explainer, Recompute Orchestrator, Dashboard Builder, Re-weight Advisor, Intervention Drafter, Calibration Aggregator, Action Builder. |
| §9 Surfaces & UX | Persona-by-persona description (mockups linked above). |
| §10 Phase 0 | Discovery + MJ feasibility spike + kill criteria. |
| §11 Roadmap | Phase 1 engine + Actions + **action layer** + 1 template → Phase 2 multi-model + CodeSmith generation + admin → Phase 3 calibration network. |
| §12 Risks | 11 named risks with mitigations. |
| §13 Open Decisions | 10 decisions needing input (brand, action-layer timing, authoring lead mode, feature-vs-product, calibration default, normalization default, history retention, anchor breadth, metering, repo). |
| §14 Appendix | MJ/BC architecture references. |

## What we are explicitly **not** doing

- **Not doing ETL/integration.** Sonar assumes data is already in MJ.
- **Not employee/HR engagement at v1.** Survey-driven, surveillance-adjacent, furthest from MJ.
- **Not a generic BI tool.** Opinionated trajectory/cohort + explainability views, not a chart builder.
- **Not a CDP / identity resolution product.** Anchor identity and dedup are MJ's job.
- **Not real-time sub-second scoring.** Scheduled + event-driven recompute, minutes-to-hours latency.

## Open questions (full list in `plan.md §13`)

The action-layer timing question is **resolved: it's in v1** (segments → interventions → holdout-measured lift). The decisions still most worth an early call: **standalone product vs MJ platform capability** (recommend product, via the authoring/calibration/action pillars), **calibration opt-in vs opt-out** (recommend opt-in), and **anchor breadth at v1** (recommend members-only with an entity-agnostic engine, donors/volunteers/learners as fast-follow templates).

## Graduation criteria

Per repo convention, this idea graduates into its own repository (`bluecypress/sonar`) when it has:

- ✅ Phase 0 MJ feasibility spike passed: metadata auto-traversal, Action execution model, integration write-back binding, and OpenApp packaging all confirmed.
- ✅ ≥3 design-partner LOIs.
- ✅ A reference rubric (a real association's MEI) reproduced end-to-end in Sonar.
- ✅ A **named owner** willing to staff and ship it.
- ✅ A **kill criterion** — what would have to be true to shut it down at 6 / 12 / 18 months.

Until then, it lives here.
