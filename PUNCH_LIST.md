# Sonar Developer Punch List

Welcome @BarnattW-BC! This is your step-by-step guide for taking Sonar from the current scaffold to a working engine. @MS-BC (Madhav) is helping you — pull him in whenever you're blocked, especially on database access and MJ platform questions.

**Where we are:** This repo is a fully scaffolded MemberJunction **Open App** (modeled on [bizapps-common](https://github.com/MemberJunction/bizapps-common)). Everything compiles, but the `__sonar` schema doesn't exist yet — every `generated/` directory contains placeholders waiting for CodeGen. **Your first major deliverable is the initial schema migration (Step 5).**

**Read these before writing any code:**

| Doc | Why |
|---|---|
| [`plans/README.md`](plans/README.md) | What Sonar is, in 5 minutes |
| [`plans/plan.md`](plans/plan.md) | The full design — **§5 is the data model you'll be building**, §6 the engine, §11 the roadmap |
| [`CLAUDE.md`](CLAUDE.md) | Repo conventions, critical rules, MJ data-access patterns |
| MJ repo: `packages/OpenApp/README.md` | How Open Apps work (manifest, migrations, packages, install lifecycle) |
| MJ repo: `migrations/CLAUDE.md` | **MJ migration authoring rules — required reading before Step 5** |

---

## Step 0 — Set up your Claude Code workspace (do this first)

We build with Claude Code, and **the quality of its output depends entirely on what repos it can see.** Set up a workspace (folder) containing local clones of:

```
~/dev/
  bizapps-sonar/      # this repo — your working repo
  MJ/                 # github.com/MemberJunction/MJ — REQUIRED
  bizapps-common/     # github.com/MemberJunction/bizapps-common — strongly recommended
```

Why this matters:

- **`MJ/`** contains the conventions Claude must follow: `migrations/CLAUDE.md` (migration rules), `packages/OpenApp/README.md` (the Open App spec), `/guides/` (caching, forms, transport-layer architecture), and `packages/MJCoreEntities` (the canonical entity patterns). **Never author a migration in a Claude session that can't read the MJ repo** — it will miss rules like "no `__mj_*` columns" and "no FK indexes" that are enforced by CodeGen, and you'll spend a day untangling the conflicts.
- **`bizapps-common/`** is the working reference Open App. When you're unsure how something should look here (a server entity subclass, a custom form, metadata files), look at how common does it.

Start Claude Code from `~/dev/` (the parent folder) so all three repos are in scope, or add them as additional working directories.

## Step 1 — Local environment prerequisites

- [ ] Node.js ≥ 18 and npm ≥ 10 (`node -v`, `npm -v`)
- [ ] Access to a **SQL Server database with MemberJunction v5.33+ installed** (the `__mj` core schema). Sonar is an Open App — it runs *on top of* an existing MJ database. Ask Madhav which dev database to point at (shared dev server vs. your own local MJ install).
- [ ] Git access to this repo and the MJ repo

## Step 2 — Clone, configure, install

- [ ] Clone this repo and create the root `.env` file (it's gitignored — get a template from Madhav or copy from a bizapps-common dev setup). Required values:
  ```bash
  # Database
  DB_HOST=...
  DB_PORT=1433
  DB_DATABASE=...
  DB_USERNAME=...
  DB_PASSWORD=...
  DB_TRUST_SERVER_CERTIFICATE=Y
  MJ_CORE_SCHEMA=__mj

  # Server — Sonar uses 4102 (MJ uses 4001, bizapps-common 4101)
  GRAPHQL_PORT=4102

  # Auth (MSAL or Auth0 — match what the dev MJ database is configured for)
  TENANT_ID=...
  WEB_CLIENT_ID=...
  ```
- [ ] Symlink the API env file (the API reads the repo-root `.env`):
  ```bash
  ln -s ../../.env apps/MJAPI/.env
  ```
- [ ] `npm install` from the **repo root** (never inside package directories)
- [ ] Verify the scaffold builds: `npm run build` — all packages and MJAPI should pass. (MJExplorer needs internet access to inline Google Fonts during prod builds; `npm run start:explorer` for dev doesn't.)

## Step 3 — Learn the repo layout

```
mj-app.json          ← Open App manifest: schema __sonar, packages, startup exports
mj.config.cjs        ← CodeGen config: 'Sonar: ' entity prefix, output paths
migrations/          ← YOUR migrations (Skyway/Flyway) — empty today, see its README
metadata/            ← mj-sync metadata (schema-info is set up; more comes later)
apps/MJAPI           ← GraphQL server, port 4102
apps/MJExplorer      ← Angular Explorer shell, port 4302
packages/
  Entities/            ← CodeGen output: entity subclasses (placeholder today)
  Actions/             ← CodeGen output: action subclasses (placeholder today)
  Server/              ← server bootstrap + CodeGen resolvers (placeholder today)
  CoreEntitiesServer/  ← hand-written server-side entity lifecycle hooks (empty today)
  Angular/             ← client bootstrap + CodeGen forms (placeholder today)
```

The flow that makes this all real: **migration → `mj:migrate` → `mj:codegen` → placeholders replaced with generated code → build → run**. CodeGen is the engine of this repo; you never hand-write entity classes, resolvers, or CRUD forms.

## Step 4 — Branch setup (one-time, with Madhav)

This repo follows the `next` → `main` two-tier model (see CLAUDE.md "Branching Model"):

- [ ] Create `main` from the scaffold branch (`claude/upbeat-hopper-rrgep9`) via PR or admin push
- [ ] Create `next` from `main`; set `main` as the GitHub default branch
- [ ] From then on: **all feature branches cut from `next`**, PRs target `next`, releases are a single `next` → `main` PR
- [ ] Every feature branch must track a same-named remote: `git push -u origin <branch>` and verify with `git branch -vv`

## Step 5 — THE BIG ONE: the initial `__sonar` schema migration

This is the foundation everything else builds on. The full data model is specified in [`plans/plan.md` §5](plans/plan.md) — table by table, with columns, FKs, and design notes.

**Scope decision first (talk to Madhav/Amith):** §5 defines ~25 tables across 8 groups. The roadmap (§11 Phase 1) doesn't need all of them on day one. Recommended initial migration scope:

1. **Configuration** (§5.1): `ScoreModel`, `ScoreModelVersion`, `ModelRelatedEntity`, `ScoreBandSet`, `ScoreBand`
2. **Factors & windows** (§5.2): `Factor`, `TimeWindow`, `ModelFactor`
3. **Runtime output** (§5.3): `Score`, `ScoreFactorContribution`, `ScoreHistory`, `ScoreBandTransition`
4. **Recompute & audit** (§5.4): `ScoreRecomputeRun`, `ScoreModelAuditEvent`

Defer write-back (§5.5), action layer (§5.6), calibration (§5.7), and templates (§5.8) to follow-up migrations — additive migrations are cheap; the publish-then-no-breaking-changes policy (MJ repo, `packages/OpenApp/PUBLISH_NO_BREAK_POLICY.md`) only bites after we publish.

**How to author it — use a Claude session with the MJ repo in scope (Step 0):**

- [ ] Open a Claude Code session that can read `MJ/migrations/CLAUDE.md` and this repo. Ask it to read both, plus `plans/plan.md` §5, before generating anything.
- [ ] File name: `migrations/V202606DDHHMM__v0.1.x_Initial_Schema.sql` (timestamp format `VYYYYMMDDHHMM`, double underscore, see `migrations/README.md`)
- [ ] The non-negotiable MJ migration rules (CodeGen owns the rest):
  - Use `${flyway:defaultSchema}` everywhere — never hardcode `__sonar`
  - UUID PKs: `ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID()` with named `PK_` constraints
  - **NO `__mj_CreatedAt` / `__mj_UpdatedAt` columns** — CodeGen adds them
  - **NO indexes on foreign key columns** — CodeGen creates them
  - Named constraints for FKs (`FK_Table_Column`) and CHECKs (`CK_Table_Column`)
  - `sp_addextendedproperty` description on **every column** (except PKs/FKs) — CodeGen turns these into entity field descriptions, form labels, and docs
  - Hardcoded UUIDs for any seed rows, never `NEWID()`
  - One `CREATE TABLE` per table; if altering, one consolidated `ALTER TABLE` per table
- [ ] Get the migration reviewed (Madhav) **before** running it — schema mistakes are cheap now, expensive after CodeGen has run
- [ ] Apply it: `npm run mj:migrate`

## Step 6 — Run CodeGen and absorb the output

- [ ] `npm run mj:codegen` — this connects to the database, discovers the new `__sonar` tables, and:
  - Replaces `packages/Entities/src/generated/entity_subclasses.ts` with real `Sonar: `-prefixed entity classes (Zod schemas, typed getters/setters)
  - Replaces `packages/Server/src/generated/generated.ts` with TypeGraphQL resolvers
  - Generates Angular CRUD forms into `packages/Angular/src/lib/generated/`
  - Writes views/sprocs/FK-indexes to the DB and logs SQL to `migrations/codegen/`
  - Builds the packages (configured in `mj.config.cjs` `commands`)
- [ ] Review the diff. Generated entity names should read `Sonar: Score Models`, `Sonar: Factors`, etc. If prefixes are wrong, check `mj.config.cjs` `newEntityDefaults` before going further.
- [ ] Push the metadata baseline: `npx mj-sync push --dir=metadata` (schema-info first — it's already ordered in `metadata/.mj-sync.json`)
- [ ] `npm run build` from root — everything must compile with the real generated code
- [ ] Commit migration + CodeGen output + metadata together on your feature branch, PR → `next`

## Step 7 — Verify the running stack

- [ ] `npm run start:api` → MJAPI on http://localhost:4102, watch for clean startup and `LoadSonarServer` registration
- [ ] `npm run start:explorer` → Explorer on http://localhost:4302, log in
- [ ] In Explorer, confirm the Sonar entities appear and the generated forms open (create a test `ScoreModel` row end-to-end)

## Step 8 — After the schema: the build-out (in roadmap order)

Each of these is its own feature branch / PR. Details in `plans/plan.md` §6–§9.

- [ ] **Server-side entity hooks** (`packages/CoreEntitiesServer`): e.g. `ScoreModelEntityServer` — snapshot config into an immutable `ScoreModelVersion` on publish. Pattern reference: `PersonEntityServer` in bizapps-common, and MJ repo `guides/BASE_ENTITY_SERVER_PATTERNS.md`.
- [ ] **`sonar-engine` package** (new, under `packages/`): `IFactorEvaluator` contract, `FactorCompiler` (declarative factor → set-based SQL), `ScoringEngine`, `RecomputeOrchestrator` (plan §6). Follow MJ's engine → resolver → GraphQL client → thin UI layering (MJ repo `guides/TRANSPORT_LAYER_ARCHITECTURE_GUIDE.md`).
- [ ] **Seed data as metadata**: starter `TimeWindow` rows, factor library, model templates — authored under `metadata/` with mj-sync (never SQL INSERTs in migrations).
- [ ] **Application + nav items metadata**: a `.sonar-application.json` under `metadata/applications/` with `DefaultNavItems` pointing at `BaseResourceComponent` driver classes — this is what puts Sonar in the Explorer nav.
- [ ] **Surfaces** (Angular, in `packages/Angular` or new `sonar-ng-*` packages): Model Builder → Engagement Manager → Admin/Ops (mockups in `plans/mockups/`).
- [ ] **Follow-up migrations**: write-back (§5.5), action layer (§5.6), templates (§5.8) when their features land.

## Working rules (the ones people actually trip on)

1. **Never edit anything in a `generated/` directory** — CodeGen will overwrite it. Custom behavior goes in subclasses (`CoreEntitiesServer`, `custom/` forms).
2. **No `any` types. Ever.** See CLAUDE.md.
3. **Migration → migrate → CodeGen → then write code** that uses the new fields. Never code against fields that haven't been generated yet.
4. After changing any package: `cd packages/<Pkg> && npm run build` before moving on.
5. `npm install` only at repo root.
6. Entity access always via `md.GetEntityObject<T>('Sonar: ...')` / `RunView` — never `new SomeEntity()`. Server-side code always passes `contextUser`.
7. Branch from `next`, push with `-u origin <same-name>`, verify `git branch -vv`.

Questions: design/architecture → Amith; database, MJ platform, day-to-day unblocking → @MS-BC.
