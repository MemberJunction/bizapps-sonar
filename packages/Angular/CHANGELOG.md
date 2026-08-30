# @mj-biz-apps/sonar-ng

## 0.5.0

### Minor Changes

- c6f1599: Stop the Sonar Authoring Agent silently running on a weak model, and make sure "strongest" means strongest **LLM**.

  The agent's prompt shipped with `SelectionStrategy='Specific'` but zero `AIPromptModel` links and `RequireSpecificModels=false`. In `AIPromptRunner` that builds an empty "specific" candidate set, and because specific models aren't required it computes a fallback target power rank from the configured list — which `computeTargetPowerRank` returns as `0` for an empty list — then sorts every active model by _proximity to 0_. That is weakest-first, so it picked Llama 3.1 8b (PowerRank 2) while frontier models sat Active and keyed. `PowerPreference: 'Highest'` was dead config, because it's only read on the `ByPower` path.

  Switching to `SelectionStrategy='Default'` with `MinPowerRank=15` filters out everything below the floor and sorts PowerRank **descending**, so the strongest keyed model at or above the floor wins and a weak model can never be selected (if nothing at/above the floor has a usable key it errors loudly instead of downgrading). `Default` rather than `ByPower`+`Highest` because `MinPowerRank` is enforced only on the `Default` branch — `ByPower` routes to `sortByPowerPreference`, which never applies the floor and would re-open the same trap whenever top models lack keys.

  The floor alone isn't enough, which is the second half of this change. `PowerRank` is stamped on **every** model in the registry, not just chat models, and the candidate pool is type-filtered only when the prompt sets `AIModelTypeID` (`getModelPoolForStrategy` short-circuits on `!prompt.AIModelTypeID`). This prompt left it NULL, so sorting descending put Rerankers at the top — `rerank-v4-pro` (110), `rerank-v3.5` (100) and `rerank-v4-fast` (90) all outrank every LLM, where the strongest sits near 30 and Gemini 3.1 Pro at 26. A reranker only reorders search results; it cannot answer a prompt at all. Left unscoped, the fix would have traded a silent _downgrade_ for a silent wrong-**model-class** selection, and raising the floor couldn't help because it only trims from the bottom. Setting `AIModelTypeID` to MJ core's `LLM` type keeps rerankers, embedders, TTS and image models out of the pool entirely.

  Ships as a forward migration plus PostgreSQL twin (the v0.2.0 seed is frozen), guarded on the target values so a re-run or a prior manual hotfix is a no-op.

- b401fb2: Show the real scored population in the Model Builder header, instead of the anchor entity's total.

  The header ran a bare whole-entity `count_only` and printed it as the scope, so a model narrowed to 66 members still read "**2,000** in population". A previous pass reworded it to "filtered subset of 2,000" so it stopped being actively wrong, but the actual number was still unavailable to the UI.

  The reason it was unavailable is that the population filter is compiled to SQL by the engine (`RecomputeOrchestrator.compilePopulationFilter`). Counting it in the browser would mean re-implementing a security-sensitive compiler client-side and handing the client a SQL-building surface, so the count is now answered where the compiler already lives:

  - **`RecomputeOrchestrator.countPopulation()`** returns `{ scoped, total, filtered }`. Two `count_only` reads — deliberately not `resolvePopulation().length`, which pulls every primary key in the population (uncapped, `IgnoreMaxRows`) just to take a length. When there is no filter the second query is skipped and `scoped === total`.
  - **`Sonar: Count Population`** Action (`DriverClass` `SonarCountPopulation`) exposes it. Read-only, nothing scored, nothing persisted, safe on a draft. Also linked to the Sonar Authoring Agent, since "how many members does this model score?" is a question it gets asked.
  - The header now reads "**66 of 2,000** in population" when a filter narrows the scope, and plain "2,000 in population" when it doesn't. `populationIsFiltered` derives from the engine's own answer rather than the UI toggle, so it reflects what is actually persisted rather than what is on screen. The count refreshes on model load and after every filter save (cheap enough to run on each).

  Registered via a forward migration plus its PostgreSQL twin, not by editing the frozen v0.2.0 seed. The `ActionCategory` and `AIAgent` are resolved **by name** rather than by hardcoded ID, because the PostgreSQL baseline registers core metadata under different IDs than SQL Server. Every insert is guarded on its natural key, so the migration is idempotent on a fresh install, an upgrade, or a re-run (verified by applying it twice).

  Also fixes the `validate-seed-agent-tools` CI check, which this change exposed. It compared "the first `AIAgentAction` link anywhere in the stream" against "the last `Action` anywhere in the stream", so **any** Action added by a later forward migration failed it — the sanctioned way to add installed config — even when that migration seeded its own link correctly after its own Action. Dropping the agent link wouldn't have satisfied it either; the rule didn't depend on whether a new link was added. The check is now per-ActionID: an Action must appear earlier in the stream than any link referencing it, with UUIDs that only ever appear inside link statements (the link's own PK, the AgentID, Actions seeded outside these migrations) skipped as unorderable. Both original failure modes still fail as they should, verified against synthetic fixtures. The SQL Server Action pattern also now matches a plain `INSERT INTO [__mj].[Action]`, not just `spCreateAction` — hand-written forward migrations use the former, so a new Action registered that way was previously invisible to the check entirely.

- b6ec626: Fix the population filter losing the user's edits, and stop every surface serving stale data after a backend write.

  ## Population filter

  The engine was never at fault. With `City eq Seattle` set directly on the row, `computeScores` returns exactly the 66 anchors that `WHERE City='Seattle'` matches. Every defect was in the authoring UI.

  **The save raced itself.** `onPopulationFilterChange` was `async` and awaited a full `GetEntityObject` → mutate → `Save()` on every emit, and the builder emits per keystroke. Typing `gmail.com` fired nine independent read-modify-write round trips with no ordering guarantee; the row ended up holding `gmail.co` while the screen showed `gmail.com`. Intermittent, which is why it read as "not working" rather than plainly broken. Writes are now debounced (500ms) and appended to a single-flight chain, so a burst collapses to one write and two writes can never overlap. Verified: nine keystrokes now produce one mutation and the stored value matches the screen.

  **Clearing a numeric value poisoned the model.** An empty `<input type="number">` reports `valueAsNumber` as `NaN`, which is neither `undefined`, `null`, nor `""`, so it passed the completeness check and `JSON.stringify` persisted `"value": null`. The engine's `requireValue` then threw `compileFilter: operator 'eq' on 'YearsInProfession' requires a value.` and the model could not recompute at all until someone repaired the filter by hand. One backspace was enough. The completeness check now rejects non-finite numbers.

  **Opening the builder threw and ate the first condition row.** Writing the child's just-emitted tree straight back into its own `[filter]` input re-entered it mid-change-detection and threw `NG0100: ExpressionChangedAfterItHasBeenCheckedError`. Angular aborted the pass, so the row `mj-filter-group.ngOnInit` auto-adds never rendered: the panel claimed "No filters applied" with an "Add your first condition" empty state while its expression badge read 1, and there was no condition row to edit. `[filter]` is now a one-way seed, written only on a genuine reset (model load, or clearing to Everyone).

  **Failures were silent.** `setPopulationFilter` returns a boolean that the caller discarded, so a publish-lock rejection or a permissions failure was indistinguishable from success. It now surfaces a toast.

  **Two ways the screen could disagree with the stored filter.** Switching a rule's field left the previous filter live (correctly — the new one is incomplete) with nothing saying so; an inline hint now does. And switching to "Filtered subset" unconditionally reset the tree, blanking the builder on a model that already had a saved filter; it now keeps what is there.

  **The header lied.** It read a flat "2,000 in population" while the real scope was 66, because the count is a bare `count_only` over the whole anchor entity. The filter is compiled to SQL server-side and duplicating that compiler in the browser would break DRY and add an injection surface, so the header now says "filtered subset of 2,000" rather than printing the entity total as if it were the scope. An exact scoped count needs a cheap server-side count entry point — deliberately left as follow-up.

  **The lock had no explanation.** `PopulationFilter`, `AnchorEntityID` and `BandSetID` are all frozen while a model is published (`publishLock.EDITABLE_WHILE_PUBLISHED_SCORE_MODEL_FIELDS`), but the "Published & locked · Unpublish to edit" banner lived inside the Factors tab. Population, Data Sources and Score Bands each disabled their controls with no reason given and no way to unpublish — the Population tab in particular rendered as two dead buttons under a heading, which reads exactly like a broken feature. The banner now sits above the tab bodies and covers all of them.

  ## Cross-surface invalidation

  Every surface loaded its data in `ngOnInit` and on model select, and nothing else. Worse than a long-lived tab: the shell **retains** surface instances, so navigating away and back does not re-run `ngOnInit` either. Measured directly — with the row at 320 Neutral / 231 Healthy, Engagement showed 520 / 31 across a full Engagement → Models → Engagement round trip.

  `SonarDataBusService` carries no data, only a revision counter per topic (`scores:<modelId>`, `config:<modelId>`, `models`). Writers publish; readers subscribe by reading a revision inside an `effect()` and re-run their own load. Reads were never cached (`ScoreReadService` has no cache), so there was nothing to invalidate — the gap was that nobody re-read. Keeping the bus data-free leaves each surface in charge of _how_ it reloads, so filters, page and place survive.

  Publishers: recompute (`scores`), publish / unpublish / rollback / band change / factor change (`config`), create / archive (`models`). A `config` publish also bumps `models`, because a Status flip changes the chip every surface's rail renders — which is why those chips used to stay stale everywhere except the Model Builder that made the change.

  Subscribers: Portfolio, Engagement Manager, the model dashboard, and the shared model rail. Each suppresses the first sighting of a model so the bus never duplicates the surface's own initial load, and Portfolio's baseline comparison is what stops refresh → slots → effect → refresh from looping.

  Verified end to end: authoring a filter in Model Builder (a `config` publish) then returning to Engagement showed the new distribution with no manual step, where the same round trip previously stayed stale.

- 1075d61: Add an explicit **Refresh** to the Portfolio, Engagement Manager, and model-detail surfaces so a recompute's results can be pulled in without reloading the browser.

  Every Sonar surface loads its data exactly twice: once in `ngOnInit`, and again when the model rail emits `select`. `CurrentModelService` carries the current _selection_ and nothing else — there is no "scores changed" event, and no surface watches for one. MJ Explorer keeps open resource tabs mounted and `BaseResourceComponent` has no activation hook, so switching back to a tab does not re-run `ngOnInit`.

  The result: you hit Recompute in Model Builder, it writes Scores / ScoreHistory / ScoreBandTransitions, and every other open tab keeps showing pre-recompute numbers indefinitely. Band tiles, the triage list, movers, the stale-version warning, the sparkline — all frozen. Model Builder's own post-recompute `simulate()` only refreshes its right rail, and that's the _unpersisted preview_, not the run that was just written. The only escapes were re-clicking your own model in the rail (`pick()` doesn't guard same-id, so it re-emits) or a browser reload — neither of which reads as a refresh gesture.

  Refresh re-reads from the API, which was always the fresh source: `ScoreReadService` has no caching, so there is nothing to invalidate. Each surface preserves the operator's place rather than reusing its full load path:

  - **Engagement Manager** keeps the band tile, score range, name search, sort, and page. `loadModel` is deliberately not reused — it resets every filter, throwing away the cohort being worked. The selected band is re-pointed at the fresh slice with the same `bandId`, because its member count just changed and the tile renders from the held object.
  - **Portfolio** keeps the rendered slots on screen while the new reads land (`loadSlot` replaces each in place by model ID), so a refresh doesn't blank every model to a skeleton and flash the whole Marimekko. Slots for models that disappeared are dropped and new ones seeded.
  - **Model detail** keeps the operator's chosen action-card timeframe, which `loadModel` would otherwise re-derive from the model's `TrendWindowDays` and silently yank.

  This is the narrow, operator-driven fix. It does not add automatic invalidation, so the stale model-status chips in each surface's rail (every surface holds its own sidebar instance, and only Model Builder refreshes its own) are still stale until refreshed. A shared invalidation bus that removes the manual step is tracked separately.

  No new CSS — reuses the existing `.sonar-btn` primitive and `.sonar-page__actions` container, so light/dark theming is inherited by construction.

### Patch Changes

- @mj-biz-apps/sonar-entities@0.5.0

## 0.4.1

### Patch Changes

- 81dbe6d: Fix Open App install on a host that doesn't already have Sonar's dependencies.

  - `sonar-ng` imported `ng-apexcharts` (and its `apexcharts` peer) without declaring them, so the Sonar client failed to bundle in Explorer on any host that didn't already have them. Added both to `dependencies`.
  - `sonar-actions` imported `@memberjunction/ai-agents` and `@memberjunction/ai-core-plus` without declaring them. Added both to `peerDependencies` at `^5.45.0`, matching the other MemberJunction peers.
  - Declared `vitest` in `sonar-actions` devDependencies — its `test` script already invoked `vitest run` without declaring it.
  - `mj-app.json`: moved `sonar-actions` from `shared` to the `server` package list (`role: "actions"`). It is a server-only package — nothing in `sonar-ng` imports it — but as `shared` the installer wired it into the client's `dynamicPackages`, pulling server-side code (and its Node built-in imports) into the Explorer browser bundle and breaking the client build with `Could not resolve "stream"`.

- 29c6c1b: Stop the anchor and factor-source pickers from hiding other MJ business apps.

  The pickers filtered entities with a `!SchemaName.startsWith("__mj")` prefix test, which excluded every other MJ business app along with MJ core — anything under `__mj_BizApps*` (Committees, Common, Tasks, …) was silently unselectable as an anchor or a factor source.

  The scoring engine and the agent's entity-discovery actions already scoped correctly, excluding an exact list (`__mj` and Sonar's own `__mj_BizAppsSonar`), so the UI was the only place that over-filtered — despite `Engine/src/metadata/entityScope.ts` existing to keep the two from drifting. All five UI call sites now go through a client-side mirror of that helper (`custom/core/entity-scope.ts`, following the existing `entity-graph.ts` pattern, since the engine package is server-only and can't be imported into the browser bundle).

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
