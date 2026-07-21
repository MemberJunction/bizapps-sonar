# @mj-biz-apps/sonar-core-entities-server

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

## 0.2.0

### Minor Changes

- b3ed75b: Open App release readiness: make Sonar cleanly installable via `mj app install`.

  - **Seed migration.** `mj app install` runs migrations only (it does not process `metadata/`), so a clean install previously got the schema but no app-level config. Added `V202607142340__v0.1.x_Seed_App_Metadata.sql` seeding all 182 app-metadata records (score band sets/bands, time windows, 23 actions + params + result codes, 3 queries, 1 remote operation, and the Sonar Authoring Agent). Verified end-to-end on a fresh core.
  - **Portable AI model.** The authoring agent ships without a pinned model (`RequireSpecificModels=0`), so it runs on whatever AI model the host has configured instead of a hardcoded vendor.
  - **Caret peer ranges.** MJ peer dependencies moved from exact `5.45.0` to `^5.45.0` across all packages, so the app installs against any compatible `5.45.x`+ host without forcing a duplicate MJ install.
  - **Honest version range.** `mjVersionRange` corrected to `>=5.45.0 <6.0.0`, the version Sonar was actually built and verified against.

### Patch Changes

- 7faa852: Add Action-backed factors to the engine (the escape hatch, plan §5.2/§7.2): a factor whose value is produced by an MJ Action instead of set-based SQL, behind the same `IFactorEvaluator` seam so scoring/normalization/explainability never branch on factor kind. Plus the `Exists` / `Recency` declarative aggregations.

  - `ActionFactorEvaluator` (pure, unit-tested via an injected `ActionRunner`) — PerRecord execution with a bounded-concurrency pool and per-record error isolation (a per-anchor failure = no-data, not a dead run). `actionRunner.ts` is the one I/O seam (wraps `ActionEngineServer`).
  - Promotion gate: an Action-backed factor must be `PromotionState='Approved'` to move PERSISTED scores (recompute); a no-persist preview runs un-approved drafts so authors can test first.

  **⚠ SCALE CEILING — read before running action factors on real populations.** An Action-backed factor fires **one Action call per anchor** (PerRecord; MJ has no batch RunAction). Once full-population scoring is in, a model with an LLM-/external-API-backed factor makes **N = entire population** calls per recompute (10k members ⇒ 10k calls). The concurrency cap bounds _parallelism only_ — **not total cost or latency**. Cross-run result caching (`CacheTTLSeconds`), `IsExpensive` budgeting, and rate limiting are **NOT implemented yet**. The orchestrator now emits a loud `LogStatus` when a single action factor's fan-out exceeds `ACTION_FACTOR_POPULATION_SOFT_CAP` (1000), so an expensive run can't happen silently — but treat that as a warning, not a guard. **Do not run external-API/LLM action factors against large non-demo populations until a real budget/cache guard lands.** (Combined with the inline-`IN`-list ceiling from the scoring-pipeline PR, an action-backed model has two independent scale limits to clear before it's production-safe.)

  **Review follow-ups (this revision):**

  - **Publish-time governance gate (#2):** `ScoreModelEntityServer.validatePublishable` now blocks publishing a model whose rubric contains a non-Approved Action-backed factor. Previously such a model could publish and then throw on _every_ persisted recompute (the engine requires Approved action factors), surfacing the failure at run time instead of publish time. This keeps the two consistent: if it published, a recompute won't fail the whole run on an un-promoted action factor. **All-or-nothing is intentional** (matches the engine) — silently excluding an un-approved factor would change the model's scoring behind the operator's back; the gate is loud, not lossy.
  - **Configurable `asOfParam` (#4):** the as-of input name is no longer hardcoded `"AsOf"` — it's read from `ActionParamsJSON.asOfParam` (default `"AsOf"`), alongside `anchorParam`/`outputParam`. A bound Action must declare this input.
  - **Output coercion contract (#5):** the Action output → numeric raw value mapping is now an explicit, unit-tested `coerceOutput`: number passthrough (NaN/Infinity → null), boolean → 1/0 (Exists-style), **empty/whitespace string → null = no-data** (not a hard 0 — it now falls to the missing-data policy), other non-numeric → null.
  - **Merge-order coordination with the full-population scoring PR (#3):** that PR changed `score(spec, factors)` → `score(spec, factors, population)` and added missing-data fields to `WeightedFactor`, editing the same `buildWeightedFactors`/`computeForModel` this PR touches. Merged `next` in: the resolution preserves BOTH the missing-data threading (per-factor `missingDataPolicy`/`outputMin`/`outputMax`, 3-arg `score`) AND this PR's `requireApprovedActionFactors` gate + cost-ceiling warning in the same loop. The integration test (`actionFactor.test.ts` → "action factor + missing-data policy → scoring") now asserts the actual `MissingDataPolicy` (Zero fills 0 in-denominator; Exclude drops the factor from the anchor's denominator).

- d6b2726: Add the ScoreModel server-side lifecycle hooks (plan §5 — published versions are immutable):

  - `ScoreModelEntityServer` — server subclass registered over `MJ_BizApps_Sonar: Score Models` (loads after `sonar-entities` so the server subclass wins `@RegisterClass` priority).
  - **Publishable validation** (`ValidateAsync` / `validatePublishable`) — cross-record checks that run only on the server, enabled via `DefaultSkipAsyncValidation = false`: a model can't publish without bound factors and a band set.
  - **Publish snapshot** (`Save` / `publishWithSnapshot`) — on the publish transition, snapshots the full model config (bound factors + rubric) into a new immutable `ScoreModelVersion`, assigns the next version number, and stamps the version so recomputed scores are reproducible and auditable.

  **Review follow-up:** make the publish path's validation genuinely gate the commit. `publishWithSnapshot` now calls `ValidateAsync()` **up front** (before building the snapshot or queuing any version rows) and bails on failure, and the final `super.Save()` result is **checked** so `tg.Submit()` only runs when the model actually saved — removing the partial-commit hazard (queued demote/version insert committing despite a failed/invalid model save) and matching the documented "validate before snapshot" behavior.

  **Publish-lock hardening (re-review follow-up):**

  - The ScoreModel hub guard is now an **editable-while-published allowlist** rather than a frozen-field blocklist (`EDITABLE_WHILE_PUBLISHED_SCORE_MODEL_FIELDS` in `publishLock.ts`). Any field not on the allowlist — including `IsCalibrated`, `AsOfStrategy`, `TrendWindowDays`, and any scoring column added later — is locked by default while a model is Active/Paused, flipping the failure mode from "silently editable" to "safe by default". The decision is extracted into a pure, unit-tested `isScoringEditBlocked()`.
  - **Query-error posture made asymmetric (the better resolution).** A status query can fail transiently; the predicate now distinguishes a confirmed `unlocked` from an `unknown` (query-failed) and resolves them per call site: the **hard `Save()`/`Delete()` path fails CLOSED** (`isModelConfigWriteBlocked` / `isBandSetConfigWriteBlocked` — `unknown` blocks the write, since a silent config drift on a published model is unrecoverable while a wrongly-blocked write is a recoverable retry), and the **cosmetic `ValidateAsync` message path stays fail-OPEN** (`isModelConfigLocked` / `isBandSetConfigLocked` — `unknown` shows no lock message, so a transient blip never flashes a misleading "unpublish to edit"). Rationale recorded inline at the predicate; both paths unit-tested.

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

- a17f774: Enforce the publish-lock as a backend invariant on Sonar config entities.

  Once a ScoreModel is published, its scoring config is frozen into an immutable ScoreModelVersion snapshot. Editing the model's factors, data sources, or bands afterward would silently drift the live config away from the snapshot every Score references. The Explorer UI already hides those edits behind an "unpublish to edit" gate, but that's a UI-only courtesy — a script, the API, or an agent can still write straight to the entities.

  Four server-side entity guards (`@RegisterClass` subclasses overriding `ValidateAsync` + `Delete`) make the lock a real invariant:

  - `FactorEntityServer`, `ModelFactorEntityServer`, `ModelRelatedEntityEntityServer` — create/edit/delete blocked while the owning model's config is locked (keyed on `ScoreModelID`). Shared library factors (null `ScoreModelID`) are never locked.
  - `ScoreBandEntityServer` — blocked while any locked model uses the band's set (bands have no direct model link, so it keys on "is this band set used by a locked model").

  "Locked" = the model has a published snapshot and isn't being actively rebuilt — Status Active or Paused. Draft (still being built) and Archived (retired) stay editable. Shared existence-query helpers live in `publishLock.ts`.

- Updated dependencies [86a6697]
- Updated dependencies [069db79]
- Updated dependencies [b3ed75b]
- Updated dependencies [d13067b]
  - @mj-biz-apps/sonar-entities@0.2.0
