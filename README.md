# Sonar — Configurable Engagement Scoring on MemberJunction

> Point Sonar at any MemberJunction entity (members, donors, volunteers, learners, chapters). Wire in the related data MJ already unifies (CRM activity, finance, LMS completions, event registrations, community posts). Define any number of concurrent engagement models, each with its own declarative rubric. Sonar produces **explainable, trending scores** and a ranked triage list of who needs attention, so a non-technical team can act before members drift away.

Sonar ships as a **MemberJunction Open App**: a versioned, installable extension that owns the `__mj_BizAppsSonar` database schema, ships as npm packages (`@mj-biz-apps/sonar-*`), and installs onto any MJ deployment with `mj app install`.

**Status:** v0.x, actively developed. The scoring engine, configuration data model, authoring agent, and the Portfolio / Engagement / Model Builder surfaces are built and in use. Write-back, holdout-measured lift, and the cross-tenant calibration network are on the roadmap (see below), not yet shipped.

## What Sonar does today

- **Models as data.** A scoring model is configuration, not code: an anchor entity, a set of factors, per-factor weights (a rubric), and score bands. Published versions are immutable and reproducible.
- **Two kinds of factor, one contract.** Declarative factors compile to set-based SQL (`Count / Sum / Avg / Min / Max / DistinctCount / Exists / Recency` over rolling or calendar windows, with filters and auto-resolved join paths). Action-backed factors run arbitrary approved code behind a promotion gate. The rubric never cares which kind it holds.
- **Explainable by construction.** Every score is a weighted sum of named, normalized factor contributions, and each contribution is persisted with its "why". Scores are tracked over time with trend, delta, and band-transition detection.
- **Fast recompute.** A model rescored over its whole population runs set-based (one MERGE plus bulk inserts) and is exposed as a long-running operation with live progress.
- **An authoring agent.** Describe a model in plain English and the agent builds a draft (anchor, data sources, declarative factors, rubric, bands). For signals SQL cannot express, it commissions a code-backed factor, tests it on a sample, and leaves it gated for review.
- **Business-facing surfaces.** A Portfolio command center (what needs attention now, with a one-click path to triage), an Engagement triage workspace (members ranked worst-first with per-member "why this score"), and a Model Builder for authoring and tuning.

## Roadmap (not yet shipped)

Write-back to source systems, an intervention / action layer with holdout-measured lift, a cross-tenant calibration/benchmark network, and model templates. See [`plans/plan.md`](./plans/plan.md) for the full design.

## Requirements

- A running MemberJunction deployment in the range `>=5.45.0 <6.0.0`.
- SQL Server, or PostgreSQL 17+ (Sonar's schema is `__mj_BizAppsSonar`).
- For the authoring agent and any LLM-backed factors: an AI provider configured in the host MJ, using a model capable of reliable **structured-JSON** output. Sonar ships model-agnostic (the agent uses your deployment's selected model), so a weak/low-cost model tier can fail the agent's JSON contract and its runs will abort. The model is chosen by your MJ deployment's model configuration (its default/fallback selection and, for the agent, the agent prompt's model settings) — so make sure that resolves to a capable model, not the cheapest available tier.

## Install (as an Open App)

Install directly from this repository with the MJ CLI:

```bash
# Sonar's schema (__mj_BizAppsSonar) uses MJ's reserved '__' prefix, so install needs the
# override flag. Pin a released version with --version (latest is v0.3.0):
mj app install https://github.com/MemberJunction/bizapps-sonar --version v0.3.0 --dangerously-ignore-dbl-underscore-schema-rule
```

This reads [`mj-app.json`](./mj-app.json) and, against your MJ instance: creates the `__mj_BizAppsSonar` schema, runs the Skyway migrations, loads the seed metadata (score bands, time windows, actions, queries, remote operations, the authoring agent), and registers the server + client bootstrap packages. Use `mj app list`, `mj app info`, `mj app upgrade`, and `mj app remove` to manage the installed app.

After install: configure an AI provider so the authoring agent and LLM-backed factors can run, then open the **Sonar** app in MJExplorer, define a model in the Model Builder (or ask the agent), publish it, and recompute.

## Using Sonar

1. **Portfolio** (landing): the most-urgent model surfaced first with an at-risk count and a "Review triage list" action.
2. **Engagement**: members ranked worst-first, each with the factor breakdown behind their score.
3. **Model Builder**: author factors (declarative or agent-commissioned), tune weights with a live preview, set bands, publish, and recompute.

## Development

```bash
npm install                # install workspace dependencies (run at repo root)
npm run mj:migrate         # apply __mj_BizAppsSonar schema migrations
npm run mj:codegen         # generate entities, resolvers, and forms
npm run build              # build all packages (Turborepo)
npm run start:api          # MJAPI on port 4102
npm run start:explorer     # MJExplorer on port 4302
```

Configuration comes from a repo-root `.env` (database, auth, AI keys); `apps/MJAPI/.env` is a symlink to it. See [`CLAUDE.md`](./CLAUDE.md) for the full development guide and the `next` -> `main` release flow.

### Repository structure

```
bizapps-sonar/
  mj-app.json          - MJ Open App manifest (schema, migrations, metadata, packages, startup exports)
  mj.config.cjs        - CodeGen configuration
  migrations/          - Skyway (Flyway-compatible) SQL migrations for __mj_BizAppsSonar
  metadata/            - mj-sync metadata (bands, windows, actions, queries, remote operations, agent)
  plans/               - Product plan, data model design, and migration analyses
  apps/
    MJAPI/             - GraphQL API server (port 4102)
    MJExplorer/        - Angular UI application (port 4302)
  packages/
    Entities/          - @mj-biz-apps/sonar-entities (CodeGen entity subclasses)
    Engine/            - @mj-biz-apps/sonar-engine (factor compiler, scoring, normalization, recompute)
    CoreEntitiesServer/- @mj-biz-apps/sonar-core-entities-server (server-side entity lifecycle hooks)
    Actions/           - @mj-biz-apps/sonar-actions (custom actions + the authoring agent tool surface)
    Server/            - @mj-biz-apps/sonar-server (server bootstrap + GraphQL resolvers)
    Angular/           - @mj-biz-apps/sonar-ng (Angular bootstrap + feature surfaces)
```

## Plans & design

The full product plan and analyses live in [`/plans`](./plans):

| Document | Contents |
|---|---|
| [`plans/README.md`](./plans/README.md) | Product overview: opportunity, wedges, architecture summary |
| [`plans/plan.md`](./plans/plan.md) | Detailed design: data model, scoring engine, authoring, roadmap, risks |
| [`plans/sonar-contributions-to-predictive-studio.md`](./plans/sonar-contributions-to-predictive-studio.md) | What Sonar could contribute to MJ Predictive Studio |

## Related repositories

- [MemberJunction/MJ](https://github.com/MemberJunction/MJ) — the platform (Open App spec + CLI)
- [MemberJunction/bizapps-common](https://github.com/MemberJunction/bizapps-common) — reference Open App and shared Person / Organization entities
