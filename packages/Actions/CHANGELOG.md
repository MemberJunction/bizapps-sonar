# @mj-biz-apps/sonar-actions

## 0.6.0

### Minor Changes

- 47bb942: Extracted server-side correctness fixes from #40: the authoring agent can finally set `ModelFactor.MissingDataPolicy` (before this, no surface ever wrote it, so every no-data anchor silently scored worst-possible on sparse signals — Zero by default), `Sonar: Bind Signal To Model` gains a `MissingDataPolicy` param, score bands must tile the model's scale to publish (band-coverage gate), and an inverted band range is rejected at save. The Angular half of #40 (builders/planner UI) is carried by #50.
- 5ab10ae: Make Sonar compatible with MemberJunction 6.1.0-edge.4.

  Every `@memberjunction/*` dependency, peer dependency and root override moves
  from `5.45.0` / `^5.45.0` to `^6.1.0-edge.4` (74 references across all
  package.json files), and `mj-app.json` `mjVersionRange` widens from
  `>=5.45.0 <6.0.0` to `>=6.1.0-edge.4 <7.0.0`.

  This unblocks tenants on MJ 6.x, where the previous pins caused `npm ci` to
  fail with ERESOLVE against the 5.x peers and `mj app install` to hard-reject
  the manifest on its version range.

  No Sonar source changes were required — the MJ 5.45 to 6.1 delta was
  additive across every API this app consumes (`Metadata`, `BaseEntity`,
  `RunView`, `actions-base`, `ng-base-forms` and the other Angular surfaces).
  All 189 unit tests and the full Turborepo build pass against 6.1.0-edge.4.

  The caret pin (`^6.1.0-edge.4`) rather than an exact pin lets tenants pick up
  6.x patch and minor releases without a Sonar republish.

### Patch Changes

- Updated dependencies [5ab10ae]
- Updated dependencies [7f1933a]
- Updated dependencies [eb34386]
- Updated dependencies [9248a13]
- Updated dependencies [2ab67b9]
  - @mj-biz-apps/sonar-engine@0.6.0
  - @mj-biz-apps/sonar-entities@0.6.0

## 0.5.0

### Minor Changes

- b401fb2: Show the real scored population in the Model Builder header, instead of the anchor entity's total.

  The header ran a bare whole-entity `count_only` and printed it as the scope, so a model narrowed to 66 members still read "**2,000** in population". A previous pass reworded it to "filtered subset of 2,000" so it stopped being actively wrong, but the actual number was still unavailable to the UI.

  The reason it was unavailable is that the population filter is compiled to SQL by the engine (`RecomputeOrchestrator.compilePopulationFilter`). Counting it in the browser would mean re-implementing a security-sensitive compiler client-side and handing the client a SQL-building surface, so the count is now answered where the compiler already lives:

  - **`RecomputeOrchestrator.countPopulation()`** returns `{ scoped, total, filtered }`. Two `count_only` reads — deliberately not `resolvePopulation().length`, which pulls every primary key in the population (uncapped, `IgnoreMaxRows`) just to take a length. When there is no filter the second query is skipped and `scoped === total`.
  - **`Sonar: Count Population`** Action (`DriverClass` `SonarCountPopulation`) exposes it. Read-only, nothing scored, nothing persisted, safe on a draft. Also linked to the Sonar Authoring Agent, since "how many members does this model score?" is a question it gets asked.
  - The header now reads "**66 of 2,000** in population" when a filter narrows the scope, and plain "2,000 in population" when it doesn't. `populationIsFiltered` derives from the engine's own answer rather than the UI toggle, so it reflects what is actually persisted rather than what is on screen. The count refreshes on model load and after every filter save (cheap enough to run on each).

  Registered via a forward migration plus its PostgreSQL twin, not by editing the frozen v0.2.0 seed. The `ActionCategory` and `AIAgent` are resolved **by name** rather than by hardcoded ID, because the PostgreSQL baseline registers core metadata under different IDs than SQL Server. Every insert is guarded on its natural key, so the migration is idempotent on a fresh install, an upgrade, or a re-run (verified by applying it twice).

  Also fixes the `validate-seed-agent-tools` CI check, which this change exposed. It compared "the first `AIAgentAction` link anywhere in the stream" against "the last `Action` anywhere in the stream", so **any** Action added by a later forward migration failed it — the sanctioned way to add installed config — even when that migration seeded its own link correctly after its own Action. Dropping the agent link wouldn't have satisfied it either; the rule didn't depend on whether a new link was added. The check is now per-ActionID: an Action must appear earlier in the stream than any link referencing it, with UUIDs that only ever appear inside link statements (the link's own PK, the AgentID, Actions seeded outside these migrations) skipped as unorderable. Both original failure modes still fail as they should, verified against synthetic fixtures. The SQL Server Action pattern also now matches a plain `INSERT INTO [__mj].[Action]`, not just `spCreateAction` — hand-written forward migrations use the former, so a new Action registered that way was previously invisible to the check entirely.

### Patch Changes

- Updated dependencies [13741c9]
- Updated dependencies [b401fb2]
- Updated dependencies [7dfbd4e]
- Updated dependencies [324cbe5]
  - @mj-biz-apps/sonar-engine@0.5.0
  - @mj-biz-apps/sonar-entities@0.5.0

## 0.4.1

### Patch Changes

- 81dbe6d: Fix Open App install on a host that doesn't already have Sonar's dependencies.

  - `sonar-ng` imported `ng-apexcharts` (and its `apexcharts` peer) without declaring them, so the Sonar client failed to bundle in Explorer on any host that didn't already have them. Added both to `dependencies`.
  - `sonar-actions` imported `@memberjunction/ai-agents` and `@memberjunction/ai-core-plus` without declaring them. Added both to `peerDependencies` at `^5.45.0`, matching the other MemberJunction peers.
  - Declared `vitest` in `sonar-actions` devDependencies — its `test` script already invoked `vitest run` without declaring it.
  - `mj-app.json`: moved `sonar-actions` from `shared` to the `server` package list (`role: "actions"`). It is a server-only package — nothing in `sonar-ng` imports it — but as `shared` the installer wired it into the client's `dynamicPackages`, pulling server-side code (and its Node built-in imports) into the Explorer browser bundle and breaking the client build with `Could not resolve "stream"`.
  - @mj-biz-apps/sonar-engine@0.4.1
  - @mj-biz-apps/sonar-entities@0.4.1

## 0.4.0

### Minor Changes

- b0ec9d3: Sonar Authoring Agent reliability: validate authored factors (data source + aggregate field), clearer compiler error, higher iteration limits.

  - **Factor authoring is validated against the real schema.** `Sonar: Build Model` and `Sonar: Create Factor` created declarative factors even when (1) no data source was resolved — yielding orphaned factors (`SourceRelatedEntityID = NULL`) — or (2) a column-referencing field (`aggregateFieldName` or `dateField`) wasn't a real column on the source entity (weak models hallucinate names like `TotalAmount` for a `TotalGross` column, or `duration_days` for a column that doesn't exist). Both cases only surfaced at compile/recompute time. Both actions now reject them up front with actionable errors (valid source aliases / valid columns), so the agent self-corrects in-run instead of shipping an uncompilable model. (FilterExpression is free-form SQL — left to the engine, not column-parsed.)
  - **Prompt hint.** The agent's system prompt now tells it to take the exact `aggregateFieldName`/`dateField` from the columns `Sonar: List Related Entities` returns, never invent one — so it leans on the new column data deliberately. Delivered as a forward migration (SQL Server + PG) patching the seeded `TemplateContent`; the frozen seed is untouched.
  - **Column visibility for the agent.** `Sonar: List Related Entities` now returns each candidate source's `columns` (name + type + a `numeric` flag), so the agent picks a real `aggregateFieldName` from the list instead of guessing one — attacking the hallucination at the source (proactive), where the validation above is the reactive backstop.
  - **Clearer FactorCompiler error.** A model-owned factor with no source now reports "no data source — link it to a model related entity," instead of the misleading "library factors not supported yet" (which properly refers only to shared `ScoreModelID = NULL` factors).
  - **A bound, code-approved signal no longer blocks publishing.** `Sonar: Bind Signal To Model` only proceeds when the signal's code is Approved (or it's a trusted codebase action), but it created the ActionBacked factor at `PromotionState='Draft'` — and the model publishability gate rejects any un-Approved action factor. So a signal you fully approved in the Studio still couldn't be published, with a confusing block. The bound factor is now born `PromotionState='Approved'`, since the code approval it already required IS the factor's promotion gate.
  - **Signal Studio signals are now bound to an anchor.** Custom (code-backed) signals were commissioned with only a text description — ActionSmith never knew which entity `AnchorRecordID` belonged to, so it guessed and authored code that `Load`ed the wrong entity by the wrong key (e.g. loading Member Profiles by a Person id → null for every record). The commission form now requires picking the anchor the signal scores, and the kickoff hands ActionSmith that anchor's schema (the anchor entity, its related sources, and each one's link field + columns) as Context. The factor brief spells out the contract: `AnchorRecordID` is the anchor entity's primary key; start from the anchor and reach related data by following its foreign keys, never by loading another entity by `AnchorRecordID`.
  - **Higher agent run limits (12/18 → 36/64).** Real, MoreCheese-scale authoring legitimately exceeds 12 Loop iterations; runs were aborting at the cap mid-authoring (verified in AIAgentRun logs). Delivered as forward migrations (SQL Server + PG); the seed stays frozen.

### Patch Changes

- Updated dependencies [b0ec9d3]
  - @mj-biz-apps/sonar-entities@0.4.0
  - @mj-biz-apps/sonar-engine@0.4.0

## 0.3.0

### Minor Changes

- 744778a: Move the Sonar Authoring Agent tool-surface seed (AIAgentAction links) out of the released seed migration and into a new forward migration, to fix the v0.2.0 -> v0.3.0 upgrade path.

  The agent-tools fix (#24) and its ordering fix (#27) had edited `V202607142340__…_Seed_App_Metadata.sql`, which shipped in v0.2.0. Editing an applied migration changes its Flyway checksum: a fresh install works, but a v0.2.0 -> v0.3.0 upgrade fails validation (checksum mismatch) — and even relaxed, Flyway never re-runs an applied version, so the links would never reach the upgraded install. The seed is now restored byte-for-byte to its v0.2.0 content, and the idempotent AIAgentAction block lives in `V202607202300__v0.3.x_Agent_Tool_Surface.sql`. Running after the seed, the Actions it FK-references already exist (no ordering hazard), and `WHERE NOT EXISTS` makes it safe for fresh installs, upgrades, and re-runs. The seed-lint now checks links across all migrations in execution order.

- 2ca57ac: Wire the Sonar Authoring Agent to its action tool surface so fresh `mj app install` seeds a working agent.

  The agent shipped with zero `AIAgentAction` links, so the Loop runtime built an empty toolbox and every action call (e.g. `Sonar: Find Models`) reported "unavailable". Root cause: `metadata/agents/.mj-sync.json` allow-listed only `MJ: AI Agent Prompts` under `pull.relatedEntities`, so mj-sync silently dropped the agent's action links; the empty snapshot generated an empty seed, and `mj app install` (migrations only, never `metadata/`) shipped the gap to every installer.

  - **`.mj-sync.json`:** add `MJ: AI Agent Actions` to the capture allowlist (root cause fix).
  - **`.sonar-agent.json`:** restore the 22 action links (all Sonar tools except `Run Authoring Agent`) to the agent snapshot.
  - **Seed migration:** idempotent `INSERT ... WHERE NOT EXISTS` so fresh installs seed the agent's tools.

- a38ee7c: PostgreSQL parity for the Sonar Authoring Agent tool surface.

  The PG baseline seeds the agent and all 23 actions but zero AIAgentAction links, so a Postgres install got a toolless agent — the same bug #24 fixed for SQL Server, on the other platform. Adds `migrations-pg/V202607202301__v0.3.x_Agent_Tool_Surface.pg.sql` with the 22 links (agent + action IDs are seed-hardcoded, identical across dialects; idempotent WHERE NOT EXISTS; runs after the baseline so the FK-referenced actions exist). The seed-lint now validates BOTH migrations/ (SQL Server) and migrations-pg/ (PostgreSQL). Verified end-to-end on a fresh MJ-core-on-Postgres-17: full baseline + queries + agent-tools applied clean, agent has 22 tools, 0 orphan FK links.

- 7c38f38: Bring the 3 Overview stored Queries (Band Trend / Band Flows / Score Movers) to PostgreSQL, closing the parity gap documented in the PG baseline.

  These queries' bodies were T-SQL and were deliberately excluded from the PG baseline (`B202607171700`), so a Postgres install had broken Overview analytics while everything else worked. New incremental migration `migrations-pg/V202607201200__v0.3.x_Overview_Queries.pg.sql` seeds all three (Query + parameters + fields + query-entities) with PostgreSQL-dialect SQL and the PostgreSQL `SQLDialectID`. Idempotent (`INSERT ... ON CONFLICT DO NOTHING`). SQL Server is unchanged.

  Entity foreign keys (`QueryEntity.EntityID`, `QueryField.SourceEntityID`) are resolved by entity **Name** via subquery, not hardcoded id — the Sonar entity IDs differ between the SQL Server seed and the PG baseline (CodeGen minted fresh ids on PG), so a literal id would FK-violate on a PG install. Names are stable across both.

- e0894b0: Fix a fresh-install failure introduced by the agent tool-surface seed (#24): the `AIAgentAction` insert block was placed right after the agent/prompt seeding, but the `Sonar:` Action rows it references (via the enforced `ActionID` foreign key) aren't created until later in the same migration. On an already-populated dev DB the actions existed so it passed, but on a clean `mj app install` the block ran first and hit a FK violation, aborting the whole seed.

  Moved the block to the end of the seed migration (after all agents and actions are created) with a placement-guard comment. Verified: a from-scratch FK-ordering repro fails in the old order and succeeds in the new order.

- 8c46c2b: Add PostgreSQL install support, following the bizapps family convention (bizapps-common, issues, tasks, forms all ship `migrations-pg/`).

  - **`migrations-pg/B202607142340...` one-shot baseline** (`B…__Schema_and_Tables.pg.sql`): the full `__mj_BizAppsSonar` schema + CRUD functions + views + triggers + entity registration + app-level seed (score bands, time windows, 23 actions, remote op, authoring agent), extracted from a post-codegen + post-seed PostgreSQL database (CodeGen's fixed point). Installs one-shot via `mj migrate` alone — verified on a fresh PG core (14 tables, 42 functions, 14 views, 14 registered entities, full seed) with no `mj codegen` step.
  - **`mj:migrate:convert` / `mj:migrate:pg`** scripts wired into package.json.
  - **Known gap:** the 3 Sonar Overview stored Queries are T-SQL and are not yet ported to PostgreSQL (documented in the baseline header); PG rewrites are a follow-up.

### Patch Changes

- Updated dependencies [744778a]
- Updated dependencies [2ca57ac]
- Updated dependencies [a38ee7c]
- Updated dependencies [7c38f38]
- Updated dependencies [e0894b0]
- Updated dependencies [8c46c2b]
  - @mj-biz-apps/sonar-entities@0.3.0
  - @mj-biz-apps/sonar-engine@0.3.0

## 0.2.0

### Minor Changes

- b3ed75b: Open App release readiness: make Sonar cleanly installable via `mj app install`.

  - **Seed migration.** `mj app install` runs migrations only (it does not process `metadata/`), so a clean install previously got the schema but no app-level config. Added `V202607142340__v0.1.x_Seed_App_Metadata.sql` seeding all 182 app-metadata records (score band sets/bands, time windows, 23 actions + params + result codes, 3 queries, 1 remote operation, and the Sonar Authoring Agent). Verified end-to-end on a fresh core.
  - **Portable AI model.** The authoring agent ships without a pinned model (`RequireSpecificModels=0`), so it runs on whatever AI model the host has configured instead of a hardcoded vendor.
  - **Caret peer ranges.** MJ peer dependencies moved from exact `5.45.0` to `^5.45.0` across all packages, so the app installs against any compatible `5.45.x`+ host without forcing a duplicate MJ install.
  - **Honest version range.** `mjVersionRange` corrected to `>=5.45.0 <6.0.0`, the version Sonar was actually built and verified against.

- 2decde6: Sonar Actions layer — the agent-callable / UI-callable server seam.

  Adds the hand-authored Sonar actions (`packages/Actions/src/custom`) + their metadata (`.sonar-actions.json`) and the Server bootstrap that registers them and loads the action-runtime-host:

  - **Engine wrappers:** Preview Model, Recompute Model, Validate Factor, Create Factor, Create Model, Add Data Source, Set Band Set, Describe Model, Build Model, List Related Entities.
  - **Agentic authoring surface:** Author Factor, Run Authoring Agent, Start Factor Job, Refine Factor Action, Cancel Factor Job, Test Signal, Bind Signal To Model, Find Entities, Find Models, List Factor Actions, Unpublish Model, Get Prompt, Update Prompt.

  `SonarActionBase` (shared helpers) and `SonarFactorAction` (the factor-action base + contract registry, consumed by List Factor Actions) ship as the substrate. The two _example_ hand-authored factor-actions (Member Activity Streak, Resource Review Sentiment) are intentionally excluded from v1 — factor-actions are authored via Codesmith (Runtime) in the Signal Studio.

### Patch Changes

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

- Updated dependencies [7faa852]
- Updated dependencies [b0508e8]
- Updated dependencies [86a6697]
- Updated dependencies [ea53114]
- Updated dependencies [069db79]
- Updated dependencies [e0ae207]
- Updated dependencies [b3ed75b]
- Updated dependencies [d13067b]
  - @mj-biz-apps/sonar-engine@0.2.0
  - @mj-biz-apps/sonar-entities@0.2.0
