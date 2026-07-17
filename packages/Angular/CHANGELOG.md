# @mj-biz-apps/sonar-ng

## 0.2.0

### Minor Changes

- b3ed75b: Open App release readiness: make Sonar cleanly installable via `mj app install`.

  - **Seed migration.** `mj app install` runs migrations only (it does not process `metadata/`), so a clean install previously got the schema but no app-level config. Added `V202607142340__v0.1.x_Seed_App_Metadata.sql` seeding all 182 app-metadata records (score band sets/bands, time windows, 23 actions + params + result codes, 3 queries, 1 remote operation, and the Sonar Authoring Agent). Verified end-to-end on a fresh core.
  - **Portable AI model.** The authoring agent ships without a pinned model (`RequireSpecificModels=0`), so it runs on whatever AI model the host has configured instead of a hardcoded vendor.
  - **Caret peer ranges.** MJ peer dependencies moved from exact `5.45.0` to `^5.45.0` across all packages, so the app installs against any compatible `5.45.x`+ host without forcing a duplicate MJ install.
  - **Honest version range.** `mjVersionRange` corrected to `>=5.45.0 <6.0.0`, the version Sonar was actually built and verified against.

- d13067b: Engine v1 feature layer + `Factor.DateField` schema.

  Adds the engine capabilities the Sonar app needs on top of the action-factor engine, plus the one v1 schema change:

  - **Composite / entity-agnostic anchor keys** — `anchorKey.ts` builds identity on MJ's `CompositeKey` (collision-safe canonical string + type-faithful JSON + per-column values for OPENJSON), so single- AND multi-column-PK anchors both score end-to-end. `resolvePopulation` drops the single-column guard; the set-based factor query stages the population via a temp table instead of an inline `IN (…)` list (kills the ~2100-value ceiling + the string-interpolation workaround); `ScoreWriter` persists `AnchorRecordKeyJSON`.
  - **`Factor.DateField`** — new nullable column (migration `V202606241200`) naming the related-entity activity-date column a windowed factor filters on. Frees `TimeWindow.AnchorDateField` to mean only the anchor boundary date; wires `SinceEvent`/`RenewalRelative` windows.
  - **Action-output clamping** (`clampToRange`) — an action factor's value is clamped to its declared output range, flagging contract drift.
  - **Explainability threading** — a factor's "why" rides `FactorResult.explanation` → contribution → persisted `ScoreFactorContribution.DetailJSON`.
  - **Score trend + history persistence** — every recompute writes an immutable `ScoreHistory` snapshot and, when an anchor's band changes, a `ScoreBandTransition` row; the current `Score` also carries `Delta` / `TrendDirection` / `DataCompleteness` vs. the trend-window baseline. This is what backs the Overview trend, per-anchor sparklines, and the "movers" feed. The trend math (delta, direction deadband, baseline reduction, band-change detection) lives in a pure, unit-tested `scoreTrend` module — `ScoreWriter` just does the entity plumbing.

  Generated entities/resolvers/forms + the GraphQL schema are regenerated for the DateField column (clean — no intervention/demo entities). The CodeGen SQL (regenerated `vwFactors` view, Factor CRUD procs, FK indexes, and the DateField EntityField metadata) is appended into the migration file per convention. Verified end-to-end: Initial + DateField migrations apply cleanly on a fresh clean-MJ database.

- 46626d1: Engagement Manager, Admin & Ops, and the Copilot assistant.

  Three more Sonar surfaces on top of the Angular foundation (Overview + Model Builder):

  - **Engagement Manager** (`SonarEngagementManagerResource`) — score triage (worst-first), explainability drawer, per-member sparkline, movers, and cohort CSV export. The intervention/playbook layer is out of v1; a dead `.sonar-holdout-*` CSS block left from that removal was dropped.
  - **Admin & Ops** (`SonarAdminOpsResource`) — two tabs: Run Health (recompute-run stats + recent runs) and Governance (version history + config-snapshot diffs). The Phase-2 "Future Phases" tab, mock metering, and "Run now" were already stripped for v1.
  - **Copilot** — the floating `SonarCopilotLauncherComponent` (embedded on every surface via `<sonar-copilot-launcher>`, re-added to Overview + Model Builder) backed by a `providedIn: 'root'` conversation-state service. Embeds MJ's native `<mj-conversation-chat-area>` in overlay mode, so token streaming / rendering / persistence come from `ConversationsModule`.

  `ConversationsModule` (`@memberjunction/ng-conversations`) is the one new module import; all three surfaces are declared in `CustomFormsModule`. Nav entries for Engagement + Admin already exist in the application metadata. Signal Studio (the "Signals" surface) is a separate follow-up PR.

- 4f4dc84: Angular foundation + first two UI surfaces (Overview, Model Builder).

  **Foundation**

  - **core/services** — app-wide singletons (`providedIn: 'root'`): score model / factor / band / read services, the current-model store, engine + factor-smith services, action catalog, toast, plus CSV / anchor-name / action-result utilities and the entity-graph helper.
  - **shared/** — reusable, business-agnostic primitives (all `standalone: false`): the filter bar (`sonar-filter-bar` + search / range / toggle controls), the model sidebar rail, and the multiselect (chips over `<mj-combobox>`).
  - **shared/styles/sonar-shell.css** — the shared stylesheet, anchored to MJ's `--mj-*` theme tokens with the local `--sonar-*` accent/band tokens (native light/dark compliance).

  **Surfaces**

  - **Overview** (`SonarOverviewResource`) — band distribution, trend, movers, attention items.
  - **Model Builder** (`SonarModelBuilderResource`) with its hosted builders — model setup, factor builder (+ prompt editor), score-band builder, publish snapshot, version history — opened via in-feature view switching. Uses `<mj-filter-builder>` for the population filter.

  `CustomFormsModule` is the single coordination point; this PR declares the shared primitives + these two surfaces. Engagement, Admin, Signal Studio, and the Copilot launcher land in the next UI PR — the copilot embed is stubbed out in these two templates until then. Nav entries for both surfaces already exist in the application metadata.

- c4abc31: Signal Studio surface.

  `SonarSignalStudioResource` — the Codesmith signal-authoring surface: describe a scoring signal in plain language, an agent writes the code, and you review / test / approve it before it can bind to a model. Shows the authoring pipeline (in-flight, for-review, library) and a commission panel with starter templates.

  Self-contained — no new dependencies (its imports were already declared for the other surfaces) and no shared-primitive usage. Declared in `CustomFormsModule`. Adds the **Signals** nav entry to the application metadata, which lights up the previously-dead nav item (the `SonarSignalStudioResource` not-registered console error is now resolved).

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

- Updated dependencies [86a6697]
- Updated dependencies [069db79]
- Updated dependencies [b3ed75b]
- Updated dependencies [d13067b]
  - @mj-biz-apps/sonar-entities@0.2.0
