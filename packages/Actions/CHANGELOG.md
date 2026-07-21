# @mj-biz-apps/sonar-actions

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
