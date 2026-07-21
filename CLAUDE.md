# GENERAL RULE
Don't say "You're absolutely right" each time I correct you. Mix it up, that's so boring!

# Sonar Development Guide

This repository is **Sonar**, a configurable engagement-scoring engine built as a **MemberJunction Open App** on top of the [MemberJunction](https://github.com/MemberJunction/MJ) platform. It owns the `__mj_BizAppsSonar` database schema and lets operators define any number of concurrent scoring models — anchor entity, factors, rubric, bands — entirely as data, with explainable score output and an action layer.

**Read [`/plans/plan.md`](plans/plan.md) before doing schema or engine work** — it contains the full data model design (§5), the scoring engine pipeline (§6), and the package layout (§4.5). [`/plans/README.md`](plans/README.md) is the executive summary.

## Repository Structure

```
bizapps-sonar/
  mj-app.json          - MJ Open App manifest (schema __mj_BizAppsSonar, packages, startup exports)
  mj.config.cjs        - CodeGen configuration (entity name prefix 'Sonar: ')
  migrations/          - Skyway SQL migrations for the __mj_BizAppsSonar schema
  metadata/            - mj-sync metadata (schema-info, entities; later: agents, actions, templates)
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

Future packages (per plan §4.5): `sonar-engine` (ScoringEngine, FactorCompiler, RecomputeOrchestrator), `sonar-writeback`, `sonar-calibration`, and surface-specific `sonar-ng-*` packages.

---

## CRITICAL RULES - VIOLATIONS ARE UNACCEPTABLE

### 1. NO COMMITS WITHOUT EXPLICIT APPROVAL
- **NEVER run `git commit` without the user explicitly asking you to**
- **Each commit requires ONE-TIME explicit approval** - don't assume ongoing permission
- **NEVER ask to commit** - wait for the user to request it
- **ONLY commit what is staged** - never modify or add to staged changes
- **NEVER commit work-in-progress** that isn't staged by the user

### 2. NO `any` TYPES - EVER
- **NEVER use `any` types in TypeScript code**
- **ALWAYS ask the user** if you think you need to use `any`
- This includes: No `as any`, No `: any`, No `<any>`, No `unknown` as a lazy alternative
- **Why**: MemberJunction has strong typing throughout - there's always a proper type available

### 3. NO MODIFICATIONS TO MERGED PRs
- **NEVER update title/description of merged PRs** without explicit approval each time

### 4. ANGULAR COMPONENT & MODULE STRATEGY
MemberJunction supports both standalone and NgModule-declared components. Choose the right approach for each situation:

#### When to Use Standalone Components (Preferred for New Components)
- **New leaf components** (dialogs, panels, small widgets) that don't need to share a module
- **Lazy-loaded route components** - standalone enables direct `loadComponent()` without wrapper modules
- **Simple, self-contained components** with clear dependency lists

#### When to Use NgModules
- **Feature modules** grouping many related components
- **Shared modules** providing common functionality to multiple consumers
- **Existing module-declared components** - don't migrate just for the sake of it

#### Rules for Both Approaches
- **Standalone components**: declare all dependencies in the component's `imports` array
- **NgModule components**: must use `standalone: false` explicitly (Angular 21 defaults to standalone)
- **Never mix within a single component** - a component is either standalone or module-declared
- When adding to an existing package, **follow the pattern already used in that package**

#### Modern Template Syntax (Required for New Code)
- **Use `@if`/`@for`/`@switch`** block syntax instead of `*ngIf`/`*ngFor`/`*ngSwitch`
- **Use `inject()` function** instead of constructor injection for new components

### 5. NO RE-EXPORTS BETWEEN PACKAGES
- **NEVER re-export types, classes, or interfaces from other packages**
- **ALWAYS** import directly from the source package that defines them

### 6. USE BaseSingleton FOR ALL SINGLETONS
- **NEVER use manual `static _instance` singleton patterns** - always extend `BaseSingleton<T>` from `@memberjunction/global`
- See MJ documentation for the pattern

---

## IMPORTANT
- Before starting a new line of work always check the local branch we're on. Feature branches should be cut from `next` (the integration branch), not from `main` (the release branch). If we aren't already in an appropriately-named, empty feature branch tracking `origin/<same-name>`, ask before creating a new one. See "Branching Model" below for the full release flow.

**VERY IMPORTANT** We want you to be a high performance agent. Therefore whenever you need to spin up tasks - if they do not require interaction with the user and if they are not interdependent in any way, ALWAYS spin up multiple parallel tasks to work together for faster responses. **NEVER** process tasks sequentially if they are candidates for parallelization

## Git Branch Tracking Rules

### Feature Branches MUST Track Same-Named Remote Branches
When creating or working with feature branches, **ALWAYS** ensure the local branch tracks a remote branch **with the same name**. Never track `main` or other permanent branches.

```bash
# CORRECT
git checkout -b my-feature-branch
git push -u origin my-feature-branch

# WRONG - Branch created from main will track origin/main by default!
git checkout main
git checkout -b my-feature-branch
# Now my-feature-branch tracks origin/main - DANGEROUS!
```

### Before Every Push
1. Run `git branch -vv` to verify tracking
2. Ensure your branch tracks `origin/<same-branch-name>`
3. If tracking is wrong, fix it before pushing

### Branching Model: `next` → `main` Release Flow
This repo uses a two-tier branching model (matching bizapps-common, BCSaaS, and MJ):

- **`next`** — integration branch. All feature work merges here.
- **`main`** — release branch. Only updated by a single coordinating PR from `next`. Pushes to `main` trigger the publish workflow.

**Feature work flow:**
1. Cut feature branch from `next` (not from `main`): `git checkout next && git pull && git checkout -b <feature-name>`
2. Make changes, commit, push, open PR → `next`
3. `changes.yml` + `build.yml` run validation on the PR
4. Merge to `next`

**Release flow:**
1. Open a single PR from `next` → `main` ("Release vX.Y.Z" coordinating PR)
2. Merge to `main` triggers `publish.yml`:
   - Validates, builds, runs `changeset version`, publishes to npm, tags the release, commits the version bump back to `main`
   - Then automatically: checks out `next`, merges main into it, runs `npm install --package-lock-only`, commits the updated lockfile as `chore: Update package-lock.json with vX.Y.Z dependencies`, and pushes to `next`
3. `next` is now ready for the next round of feature work, with a lockfile matching the just-published versions

**Rules:**
- **Never commit directly to `main`.** Always go through `next` first (except for the release coordinating PR itself).
- **Never hand-author the `chore: Update package-lock.json with vX.Y.Z dependencies` commit on `next`.** That commit is created automatically by the publish workflow. If you find yourself wanting to write one manually, something is wrong upstream.
- **Hotfixes that genuinely must bypass `next`** still go through a PR to `main`, but the next release-coordinating PR from `next` will need to merge main's hotfix commit back into next before merging next → main again. The publish workflow's automated merge-back handles this for you; you should rarely need to do it manually.

---

## Build Commands
- Build all packages: `npm run build` (from repo root, uses Turborepo)
- Build generated packages: `npm run build:generated`
- Build API only: `npm run build:api`
- Build Explorer only: `npm run build:explorer`
- Start API server: `npm run start:api` (port 4102)
- Start Explorer UI: `npm run start:explorer` (port 4302)
- Build specific package: `cd packages/PackageName && npm run build`
- **IMPORTANT**: When building individual packages for testing/compilation, always use `npm run build` in the specific package directory

### Build Pipeline
- MJExplorer uses the Angular `application` builder powered by ESBuild and Vite
- Dev server uses Vite with HMR for fast iteration
- Source maps are configured for full debugging support including local packages

### NPM Workspace Management
- This is an NPM workspace monorepo
- **IMPORTANT**: To add dependencies to a specific package:
  - Define dependencies in the individual package's package.json
  - Run `npm install` at the repository root (NOT within the package directory)
  - Never run `npm install` inside individual package directories

## Development Workflow
- **CRITICAL**: After making code changes, always compile the affected package by running `npm run build` in that package's directory to check for TypeScript errors
- Fix all compilation errors before proceeding with additional changes
- **Tasks**: whenever you need to spin up tasks - if they do not require interaction with the user and if they are not interdependent in any way, ALWAYS spin up multiple parallel tasks to work together for faster responses

## Ports
- MJAPI GraphQL server: **4102** (configured via `GRAPHQL_PORT` in `.env`)
- MJExplorer Angular app: **4302** (configured in MJExplorer start script)
- These avoid conflicts with other MJ dev environments (MJ uses 4001/4201, bizapps-common uses 4101/4301)

## Environment Configuration
- The repo root `.env` file contains all configuration (DB, auth, AI keys, etc.)
- `apps/MJAPI/.env` is a **symlink** to `../../.env` - do not create a separate file there
- Angular environment files are in `apps/MJExplorer/src/environments/`

---

## Sonar Domain Conventions

- **Schema**: all Sonar tables live in **`__mj_BizAppsSonar`**. Migrations use `${flyway:defaultSchema}` as the schema placeholder.
- **Entity name prefix**: CodeGen names new `__mj_BizAppsSonar` entities `Sonar: <Name>` (configured in `mj.config.cjs` `newEntityDefaults`).
- **Configuration is data**: models, factors, rubrics, windows, bands, write-back rules, and playbooks are all rows — code is the engine that interprets them. Don't hardcode scoring logic that belongs in configuration entities.
- **Data model groups** (plan §5): configuration (`ScoreModel`, `ScoreModelVersion`, `ModelRelatedEntity`, `ScoreBandSet`/`ScoreBand`) · factors & windows (`Factor`, `TimeWindow`, `ModelFactor`) · runtime output (`Score`, `ScoreFactorContribution`, `ScoreHistory`, `ScoreBandTransition`) · recompute/audit · Action governance & write-back · action layer · calibration network · templates.
- **Published model versions are immutable** — publishing snapshots full config into `ScoreModelVersion` for reproducible, auditable scores.
- **Factors satisfy one contract** (`IFactorEvaluator`): declarative (compiled to set-based SQL) or Action-backed (arbitrary code behind a promotion gate). The rubric engine never branches on which kind it holds.

---

## Code Style Guide
- Use TypeScript strict mode and explicit typing
- Always use MemberJunction generated `BaseEntity` sub-classes for all data work for strong typing
- No explicit `any` types - see CRITICAL RULES section above
- Prefer union types over enums for better package exports
- Prefer object shorthand syntax
- Follow existing naming conventions:
  - PascalCase for classes and interfaces
  - **PascalCase for public class members** (properties, methods, `@Input()`, `@Output()`)
  - **camelCase for private/protected class members**
  - camelCase for local variables and function parameters
  - Use descriptive names and avoid abbreviations
- Imports: group imports by type (external, internal, relative)
- Error handling: use try/catch blocks and provide meaningful error messages
- Keep functions focused and concise
- **NEVER use dynamic require() or import() statements** - always use static imports at the top of files unless explicitly requested

### Functional Decomposition Is Mandatory
- **NEVER** write long, monolithic functions that do multiple things
- **ALWAYS** decompose complex operations into smaller, well-named helper functions
- **MAXIMUM** function length should be ~30-40 lines (excluding comments)
- If a function is getting long, STOP and refactor it immediately

---

## MemberJunction Entity and Data Access Patterns

### Entity Object Creation
**Never directly instantiate BaseEntity subclasses** - always use the Metadata system:

```typescript
// WRONG - bypasses MJ class system
const entity = new ScoreModelEntity();

// CORRECT - uses MJ metadata system
const md = new Metadata();
const entity = await md.GetEntityObject<ScoreModelEntity>('Sonar: Score Models');
```

### BaseEntity Spread Operator Limitation
**CRITICAL**: Never use the spread operator (`...`) directly on BaseEntity-derived classes. Use `GetAll()` instead:

```typescript
// WRONG
const data = { ...myEntity, extraField: 'value' };

// CORRECT
const data = { ...myEntity.GetAll(), extraField: 'value' };
```

### Server-Side Context User Requirements
When working on server-side code, **ALWAYS** pass `contextUser` to `GetEntityObject` and `RunView` methods:

```typescript
// WRONG - missing contextUser on server
const entity = await md.GetEntityObject<SomeEntity>('Entity Name');

// CORRECT - includes contextUser for server-side operations
const entity = await md.GetEntityObject<SomeEntity>('Entity Name', contextUser);
```

### Loading Records with RunView
```typescript
const rv = new RunView();
const results = await rv.RunView<ScoreModelEntity>({
    EntityName: 'Sonar: Score Models',
    ExtraFilter: `Status='Published'`,
    OrderBy: 'Name ASC',
    ResultType: 'entity_object'  // Returns actual entity objects
});
```

### RunView Error Handling
**Important**: RunView does NOT throw exceptions. Check `Success` property:

```typescript
const result = await rv.RunView<SomeEntity>({...});
if (result.Success) {
    const items = result.Results || [];
} else {
    console.error('Failed:', result.ErrorMessage);
}
```

### ResultType: entity_object vs simple
- Use `entity_object` when you need to **mutate and save** records
- Use `simple` with `Fields` parameter when you only need to **read/display** data
- **DO NOT** use `Fields` parameter with `entity_object` - it is automatically ignored

### Batch Queries with RunViews
Use `RunViews` (plural) for multiple independent queries:

```typescript
const rv = new RunView();
const [models, factors] = await rv.RunViews([
    { EntityName: 'Sonar: Score Models', ExtraFilter: '', ResultType: 'entity_object' },
    { EntityName: 'Sonar: Factors', ExtraFilter: '', ResultType: 'entity_object' }
]);
```

---

## Angular Development Best Practices

### Change Detection
- Add `ChangeDetectorRef` and use `cdr.detectChanges()` after programmatic changes
- Replace `setTimeout` with `Promise.resolve().then()` for microtask timing

### Input Properties - Use Getter/Setters
```typescript
// GOOD - Precise control with getter/setter
private _myInput: string | null = null;

@Input()
set myInput(value: string | null) {
    const prev = this._myInput;
    this._myInput = value;
    if (value && value !== prev) this.onMyInputChanged(value);
}
get myInput(): string | null { return this._myInput; }
```

### Loading Indicators
- **ALWAYS** use the `<mj-loading>` component from `@memberjunction/ng-shared-generic`
- **NEVER** create custom spinners

### Dialog Button Placement
- **Confirm/Submit buttons go on the LEFT**, Cancel buttons on the RIGHT

### Icon Libraries
- **Primary**: Font Awesome (already included)

---

## CodeGen

This repo uses MemberJunction's CodeGen system to generate entity and action subclasses. The generated code lives in:
- `packages/Entities/` - Entity TypeScript classes with Zod schemas
- `packages/Actions/` - Action TypeScript classes
- `packages/Server/src/generated/` - GraphQL resolvers and class registrations
- `packages/Angular/src/lib/generated/` - Angular form components and module

**Key rules:**
- Never manually edit files in generated directories - CodeGen will overwrite them
- Always run CodeGen after database schema changes
- Run `npm run mj:codegen` from repo root to regenerate

## Database Migrations
- Run `npm run mj:migrate` from repo root
- Migrations live in `/migrations` and run against the `__mj_BizAppsSonar` schema via `${flyway:defaultSchema}`
- See MJ documentation for migration file format and conventions
- Never include `__mj_CreatedAt`/`__mj_UpdatedAt` columns in CREATE TABLE - CodeGen handles them
- Never create indexes for foreign key columns - CodeGen creates them automatically
- Use hardcoded UUIDs in seed/metadata migrations, never NEWID()
- **App config in `metadata/` is dual-sourced.** `mj app install` runs migrations only (not `metadata/`), so the config those dirs hold (bands, windows, actions, queries, remote ops, the authoring agent) must also reach the DB via migrations. `metadata/` stays the editable dev source of truth (round-trips via `mj sync`).
- **⚠️ The seed migration `V202607142340__…_Seed_App_Metadata.sql` is FROZEN — it shipped in v0.2.0. Never edit or regenerate it.** Changing a released migration changes its Flyway checksum, which aborts every upgrade (and Flyway never re-runs an applied version, so the change wouldn't land anyway). This is exactly what broke the v0.2.0 → v0.3.0 upgrade (PR #29). The old "if you edit `metadata/`, regenerate the seed" workflow is retired — it is now a footgun.
- **To add or change installed config, write a NEW forward migration** with idempotent inserts (`IF NOT EXISTS` / `WHERE NOT EXISTS`), placed after the rows it FK-references: `migrations/V<newer>__….sql` **and, for PostgreSQL parity, `migrations-pg/V<newer>__….pg.sql`**. See `V202607202300__v0.3.x_Agent_Tool_Surface.sql` (+ the `.pg.sql` twin) as the template. Caveat: `metadata/agents/.sonar-agent.json` still describes the agent's 22 `AIAgentAction` links, but those are seeded by those forward migrations, NOT the frozen seed — a naive seed regen would wrongly re-add them and re-break upgrades. See [`migrations/README.md`](migrations/README.md).

---

## Debugging

### VSCode Launch Configurations
- **MJAPI**: Node.js debugger with source maps for local packages
- **MJExplorer**: Chrome debugger (port 4302) with source maps
- **MJExplorer (attach)**: Attach to existing Chrome on port 9222
- **Full Stack**: Compound configuration running both MJAPI + MJExplorer

### Source Map Scoping
Source maps are scoped to local packages only (`apps/MJAPI/**`, `packages/Entities/**`, `packages/Actions/**`, `packages/Server/**`, `packages/Angular/**`). Third-party packages and node_modules are excluded to avoid noise.

---

## Performance Best Practices

### Batch Database Operations
- Use `RunViews` (plural) instead of multiple `RunView` calls
- Group related queries together in a single batch operation

### Avoid Per-Item Queries in Loops
- **NEVER** make RunView calls inside loops
- Load all data once, then process client-side

### Use View Fields Instead of Lookups
- Most MJ views include denormalized fields from related entities
- Use the denormalized field directly instead of a separate lookup query

---

## GitHub Repository
- Repository: https://github.com/MemberJunction/bizapps-sonar
- Default branch: `main` (release branch — publishes on push)
- Integration branch: `next` (where feature PRs land)
- Feature PRs target `next`. Release PRs target `main`.
- See "Branching Model" section above for the full flow.

## Purpose

Sonar is a standalone product (working title) built as an MJ Open App. It scores engagement for **any anchor entity** on the MemberJunction graph — members, donors, volunteers, learners, chapters — using operator-authored models whose configuration lives entirely in the `__mj_BizAppsSonar` schema. Scores are explainable by construction (weighted sums of named factor contributions), tracked over time, written back to source systems, and acted on through MJ Actions with holdout-measured lift.

See [`/plans/plan.md`](plans/plan.md) for the complete design and roadmap.
