# @mj-biz-apps/sonar-actions

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
