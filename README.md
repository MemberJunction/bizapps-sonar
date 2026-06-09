# Sonar — Configurable Engagement Scoring on MemberJunction

> Point at any MemberJunction entity. Wire in the related entities already unified in MJ — CRM activity, finance invoices, LMS completions, community posts, event registrations. Define **any number of concurrent engagement models**, each with its own declarative rubric. Sonar computes **explainable, trending scores**, writes them back to your source systems, and acts on them with holdout-measured lift.

Sonar ships as a **MemberJunction Open App**: a versioned, installable extension that owns the `__sonar` database schema, ships as npm packages (`@mj-biz-apps/sonar-*`), and installs onto any MJ deployment via `mj app install`.

**Status:** Initial scaffold — schema migration and engine are next.

**New to this repo?** Start with the **[developer punch list](./PUNCH_LIST.md)** — environment setup, the migration workflow, and the build-out plan, step by step.

## Plans & design

The full product plan lives in [`/plans`](./plans):

| Document | Contents |
|---|---|
| [`plans/README.md`](./plans/README.md) | Product overview — opportunity, wedges, architecture summary, graduation criteria |
| [`plans/plan.md`](./plans/plan.md) | Detailed design — strategy, commercial model, **full `__sonar` data model**, scoring engine, factor/rubric authoring, AI agent roster, roadmap, risks |
| [`plans/mockup.html`](./plans/mockup.html) | Clickable mockup index ([Model Builder](./plans/mockups/builder/model.html) · [Engagement Manager](./plans/mockups/manager/briefing.html) · [Admin/Ops](./plans/mockups/admin/ops.html)) |

## Repository structure

```
bizapps-sonar/
  mj-app.json          - MJ Open App manifest (schema __sonar, packages, startup exports)
  mj.config.cjs        - CodeGen configuration (output paths, entity name prefix 'Sonar: ')
  migrations/          - Skyway (Flyway-compatible) SQL migrations for the __sonar schema
  metadata/            - mj-sync metadata (schema info, entity tweaks, future: agents/actions/templates)
  plans/               - Product plan, data model design, and UI mockups
  apps/
    MJAPI/             - GraphQL API server (port 4102)
    MJExplorer/        - Angular UI application (port 4302)
  packages/
    Entities/          - @mj-biz-apps/sonar-entities (CodeGen-generated entity subclasses)
    CoreEntitiesServer/- @mj-biz-apps/sonar-core-entities-server (server-side entity lifecycle hooks)
    Actions/           - @mj-biz-apps/sonar-actions (CodeGen-generated action subclasses)
    Server/            - @mj-biz-apps/sonar-server (server bootstrap + GraphQL resolvers)
    Angular/           - @mj-biz-apps/sonar-ng (Angular bootstrap + form components)
```

Additional engine packages (`sonar-engine`, `sonar-writeback`, `sonar-calibration`, surface-specific `sonar-ng-*` packages) will be added under `packages/` as the build progresses — see [`plans/plan.md` §4.5](./plans/plan.md) for the proposed layout.

## Getting started

```bash
npm install                # install workspace dependencies
npm run mj:migrate         # apply __sonar schema migrations (none yet — coming next)
npm run mj:codegen         # generate entities, resolvers, and forms
npm run build              # build all packages (Turborepo)
npm run start:api          # MJAPI on port 4102
npm run start:explorer     # MJExplorer on port 4302
```

Configuration comes from a repo-root `.env` file (database, auth) — `apps/MJAPI/.env` is a symlink to it. See [`CLAUDE.md`](./CLAUDE.md) for the full development guide.

## How it ships

- **Sonar Open App (single-tenant)** — engine, entities, starter factor library, model templates, agents, dashboards. Installable on any MJ deployment.
- **Sonar on BC SaaS (multi-tenant)** — the same Open App plus the cross-tenant calibration network and managed ops.

## Related repositories

- [MemberJunction/MJ](https://github.com/MemberJunction/MJ) — the platform (see `packages/OpenApp` for the Open App spec)
- [MemberJunction/bizapps-common](https://github.com/MemberJunction/bizapps-common) — reference Open App and shared Person/Organization entities
