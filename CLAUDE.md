# GENERAL RULE
Don't say "You're absolutely right" each time I correct you. Mix it up, that's so boring!

# Sonar Development Guide

This repository is **Sonar**, a configurable engagement-scoring engine built as a **MemberJunction Open App** on top of the [MemberJunction](https://github.com/MemberJunction/MJ) platform. It owns the `__mj_BizAppsSonar` database schema and lets operators define any number of concurrent scoring models — anchor entity, factors, rubric, bands — entirely as data, with explainable score output and an action layer.

**Read [`/plans/plan.md`](plans/plan.md) before doing schema or engine work** — it contains the full data model design (§5), the scoring engine pipeline (§6), and the package layout (§4.5). [`/plans/README.md`](plans/README.md) is the executive summary.

## Packages

| Package | Tier | Holds |
|---|---|---|
| `sonar-engine` | server | ScoringEngine, FactorCompiler, NormalizationEngine, RecomputeOrchestrator |
| `sonar-actions` | server | Hand-authored Actions (the seam the UI and agents call) + CodeGen'd action subclasses |
| `sonar-server` | server | GraphQL resolvers, class registrations, server bootstrap |
| `sonar-entities` | shared | CodeGen'd entity subclasses + Zod schemas. **Fully generated — never hand-edit** |
| `sonar-ng` | client | Angular surfaces (Overview, Model Builder, Signal Studio, Engagement Manager) |

`mj-app.json` declares which tier each package installs into. That declaration is load-bearing — see CRITICAL RULE 7.

---

## CRITICAL RULES - VIOLATIONS ARE UNACCEPTABLE

### 1. NO COMMITS WITHOUT EXPLICIT APPROVAL
- **NEVER run `git commit` without the user explicitly asking you to**
- **Each commit requires ONE-TIME explicit approval** - don't assume ongoing permission
- **NEVER ask to commit** - wait for the user to request it
- **ONLY commit what is staged** - never modify or add to staged changes
- **NEVER commit work-in-progress** that isn't staged by the user

### 2. NO `any` TYPES - EVER
- **NEVER use `any` types in TypeScript code**: no `as any`, no `: any`, no `<any>`, no `unknown` as a lazy alternative
- **ALWAYS ask the user** if you think you need one
- **Why**: MemberJunction has strong typing throughout — there's always a proper type available

### 3. NO MODIFICATIONS TO MERGED PRs
- **NEVER update title/description of merged PRs** without explicit approval each time

### 4. ANGULAR COMPONENTS
- **Follow the pattern already used in the package you're editing.** Sonar's UI is NgModule-declared in `custom/custom-forms.module.ts`, so those components must set `standalone: false` explicitly (Angular 21 defaults to standalone).
- Standalone is fine for genuinely new leaf components (dialogs, small widgets) and lazy-loaded routes; declare their deps in `imports`.
- **Never mix within a single component** — it is either standalone or module-declared.
- **New code uses `@if`/`@for`/`@switch`** (not `*ngIf`/`*ngFor`) and **`inject()`** (not constructor injection).
- Any user-facing UI work is additionally governed by [`packages/Angular/CLAUDE.md`](packages/Angular/CLAUDE.md).

### 5. NO RE-EXPORTS BETWEEN PACKAGES
- **NEVER re-export types, classes, or interfaces from other packages**
- **ALWAYS** import directly from the source package that defines them

### 6. USE BaseSingleton FOR ALL SINGLETONS
- **NEVER use manual `static _instance` singleton patterns** — always extend `BaseSingleton<T>` from `@memberjunction/global`

### 7. DOMAIN LOGIC RUNS SERVER-SIDE, AND TRAVELS AS DATA
- **Anything a score, a targeting rule, or a play acts on is domain logic. Compute it on the server and return the ANSWER.** The browser gets a label, a count, a resolved cohort — never the maths.
- **The client computes presentation only**: formatting, sorting/filtering already-loaded rows, chart geometry.
- **The test**: if two implementations could disagree, and one of them decides *who gets contacted* or *what gets written*, it is domain logic. Ship one implementation, server-side.
- **"Fetch the data, then compute in the browser" is not an exception** — the round trip already happened, so ask the server the real question instead. Returning one label per row is also less traffic than returning every input row it was derived from.
- **Never widen a server package's audience to share domain logic with the client.** Add or extend a read-only Action that returns the answer (this is what the Action layer is for). If the browser genuinely must compute something, it goes in a package with no dependencies and no MJ peers, declared `shared` in `mj-app.json`.
- **Why this is a critical rule**: "which signal is dragging this record down" once existed in three places at once, two UI columns and a private copy inside a play. They silently diverged when the calculation was corrected to rank on the rubric weight. The play handed its label to an LLM as fact, so the stale copy would have asserted something false in a message to a real person.
- `.github/scripts/validate-client-package-boundary.sh` enforces the packaging half of this in CI. It cannot see a browser package that fetches rows and computes a rule on them, so that part is on you.

---

## Git & Branching

- **Before starting new work, check the current branch.** Feature branches are cut from `next` (integration), never from `main` (release). If you aren't already on an appropriately-named feature branch tracking `origin/<same-name>`, ask before creating one.
- **Feature branches MUST track a remote branch of the SAME name** — never `main`. `git checkout -b <name> && git push -u origin <name>`. Verify with `git branch -vv` before every push; a branch cut from `main` tracks `origin/main` by default, which is dangerous.
- **Flow**: feature → PR into `next` (`changes.yml` + `build.yml` validate) → merge. Release is a single coordinating PR `next` → `main`; pushing `main` triggers `publish.yml` (version, publish to npm, tag, then auto-merge back into `next` with an updated lockfile).
- **Never commit directly to `main`.** Hotfixes still go through a PR to `main`; the publish workflow's merge-back handles reconciliation.
- **Never hand-author the `chore: Update package-lock.json with vX.Y.Z dependencies` commit on `next`** — the publish workflow creates it. Wanting to write one by hand means something upstream is wrong.
- Repo: https://github.com/MemberJunction/bizapps-sonar

---

## Build & Environment

- **Build one package**: `npm run build` **in that package's directory**. Root builds run through Turborepo.
- **After any code change, build the affected package** and fix all TypeScript errors before moving on.
- **Adding a dependency**: declare it in the individual package's `package.json`, then run `npm install` **at the repo root**. Never `npm install` inside a package.
- **Ports**: MJAPI GraphQL **4102**, MJExplorer **4302** (chosen to avoid clashing with other MJ dev environments).
- **Config**: the repo-root `.env` holds everything (DB, auth, AI keys). `apps/MJAPI/.env` is a **symlink** to it — don't create a separate file. Angular env files live in `apps/MJExplorer/src/environments/`.
- **UI dev loop**: a change under `packages/Angular` needs that package rebuilt *and* the Explorer dev server restarted. Seeds/CodeGen need the API restarted.
- Launch configs (MJAPI, MJExplorer, attach, Full Stack compound) are in `.vscode/launch.json`. Source maps are scoped to local packages only.

**Parallelize**: when you need to spin up tasks that are neither interactive nor interdependent, ALWAYS run them in parallel. **NEVER** process parallelizable work sequentially.

---

## Sonar Domain Conventions

- **Schema**: all Sonar tables live in **`__mj_BizAppsSonar`**. Migrations use `${flyway:defaultSchema}` as the placeholder.
- **Entity name prefix**: CodeGen names new entities `MJ_BizApps_Sonar: <Name>` (configured in `mj.config.cjs` `newEntityDefaults`).
- **Configuration is data**: models, factors, rubrics, windows, bands, write-back rules, and playbooks are all rows — code is the engine that interprets them. Don't hardcode scoring logic that belongs in configuration entities.
- **Data model groups** (plan §5): configuration (`ScoreModel`, `ScoreModelVersion`, `ModelRelatedEntity`, `ScoreBandSet`/`ScoreBand`) · factors & windows (`Factor`, `TimeWindow`, `ModelFactor`) · runtime output (`Score`, `ScoreFactorContribution`, `ScoreHistory`, `ScoreBandTransition`) · recompute/audit · Action governance & write-back · action layer · calibration network · templates.
- **Published model versions are immutable** — publishing snapshots full config into `ScoreModelVersion` for reproducible, auditable scores.
- **Factors satisfy one contract** (`IFactorEvaluator`): declarative (compiled to set-based SQL) or Action-backed (arbitrary code behind a promotion gate). The rubric engine never branches on which kind it holds.
- **`PercentOfTotal` is a trap.** The scorer writes it as 0 for a factor the member had no data on — exactly when that factor is hurting them most. Anything reasoning about *why* a score is low must rank on the configured `ModelFactor.Weight` instead, never on `PercentOfTotal`.

---

## CodeGen

Generated output lives in `packages/Entities/`, `packages/Actions/`, `packages/Server/src/generated/`, and `packages/Angular/src/lib/generated/`.

- **Never manually edit files in generated directories** — CodeGen overwrites them.
- **Always run CodeGen after schema changes**: `npm run mj:codegen` from the repo root.

---

## Database Migrations

Run `npm run mj:migrate` from the repo root. Migrations live in `/migrations` and target `__mj_BizAppsSonar` via `${flyway:defaultSchema}`.

- **Never include `__mj_CreatedAt`/`__mj_UpdatedAt` in CREATE TABLE** — CodeGen handles them.
- **Never create indexes for foreign key columns** — CodeGen creates them automatically.
- **Use hardcoded UUIDs in seed/metadata migrations, never `NEWID()`.**
- **Never edit an APPLIED migration.** Changing it changes its Flyway checksum, which aborts every upgrade — and Flyway won't re-run an applied version, so the edit wouldn't land anyway. Write a NEW forward migration with idempotent inserts (`IF NOT EXISTS` / `WHERE NOT EXISTS`), placed after the rows it FK-references.
- **⚠️ `V202607142340__…_Seed_App_Metadata.sql` is FROZEN — it shipped in v0.2.0.** Editing it is what broke the v0.2.0 → v0.3.0 upgrade (PR #29). The old "regenerate the seed after editing `metadata/`" workflow is retired; it is now a footgun.
- **Every migration needs a PostgreSQL twin** in `migrations-pg/V<same>__….pg.sql`. Template: `V202607202300__v0.3.x_Agent_Tool_Surface.sql` and its twin. PG registers Sonar entities under different `__mj.Entity` IDs, so resolve entity FKs **by Name** there, not by hardcoded id.
- **App config in `metadata/` is dual-sourced.** `mj app install` runs migrations only, so anything `metadata/` holds (bands, windows, actions, queries, remote ops, the authoring agent) must ALSO reach the DB via a migration. `metadata/` stays the editable dev source of truth and round-trips via `mj sync`. Caveat: `metadata/agents/.sonar-agent.json` still describes the agent's `AIAgentAction` links, but forward migrations seed them — a naive seed regen would re-add them and re-break upgrades.
- See [`migrations/README.md`](migrations/README.md).

---

## Code Style

- TypeScript strict mode, explicit typing.
- Always use MJ's generated `BaseEntity` subclasses for data work.
- Prefer union types over enums (better package exports). Prefer object shorthand.
- Naming: PascalCase for classes/interfaces **and public class members** (properties, methods, `@Input()`, `@Output()`); camelCase for private/protected members, locals, and parameters. Descriptive names, no abbreviations.
- Group imports by type (external, internal, relative).
- **NEVER use dynamic `require()`/`import()`** — static imports at the top of the file, unless explicitly requested.
- Errors: try/catch with meaningful messages.

### Functional decomposition is mandatory
- **NEVER** write long monolithic functions that do several things.
- **MAXIMUM** ~30-40 lines per function (excluding comments).
- If a function is getting long, STOP and refactor it immediately.

---

## MemberJunction Data Access

- **Never instantiate `BaseEntity` subclasses directly.** Use `const md = new Metadata(); await md.GetEntityObject<T>('MJ_BizApps_Sonar: Score Models', contextUser)`.
- **Server-side, ALWAYS pass `contextUser`** to `GetEntityObject` and `RunView`.
- **Never spread a `BaseEntity`** — `{ ...entity }` silently loses everything. Use `{ ...entity.GetAll() }`.
- **`RunView` does NOT throw.** Check `result.Success` and read `result.ErrorMessage`; `result.Results` may be undefined.
- **`ResultType`**: `entity_object` when you need to mutate and save; `simple` + `Fields` when you only read. `Fields` is ignored with `entity_object`.
- **Use `RunViews` (plural) for multiple independent queries** — one batch, not N calls.
- **NEVER call `RunView` inside a loop.** Load once (chunk large `IN (...)` lists), then process in memory.
- **Prefer denormalized view fields** over a second lookup query; most MJ views already include them.

---

## Angular Practices

- Inject `ChangeDetectorRef` and call `cdr.detectChanges()` after programmatic changes. Prefer `Promise.resolve().then()` over `setTimeout` for microtask timing.
- Use getter/setter `@Input()`s when a change needs to trigger work, so the trigger is explicit.
- **ALWAYS** use `<mj-loading>` from `@memberjunction/ng-shared-generic`. **NEVER** hand-roll a spinner.
- **Confirm/Submit buttons go LEFT**, Cancel RIGHT.
- Icons: Font Awesome (already included).

---

## Purpose

See [`/plans/plan.md`](plans/plan.md) for the complete design and roadmap.
