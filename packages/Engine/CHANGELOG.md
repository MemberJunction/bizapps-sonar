# @mj-biz-apps/sonar-engine

## 0.6.0

### Minor Changes

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

- eb34386: Persist recompute runs through Record Set Processing instead of hand-written SQL.

  `ScoreWriter` flushed an entire run in a handful of raw `INSERT`/`MERGE` statements via
  `provider.ExecuteSQL`. That was fast — measured 2.4s for a 2,000-member model — and it bypassed the
  save pipeline completely. Hand-written DML against MJ entity tables silently skips field validation,
  Entity Actions (including `Validate`, a real blocking gate), Record Changes, and cache invalidation.
  Nothing fails loudly, so the gap surfaces later as missing audit history or a configured workflow
  that never ran. `ScoreWriter` and its `sqlLiteral` injection guard are deleted; `ScorePersister`
  replaces them with a signature-compatible `write()`, so `RecomputeOrchestrator` and the
  `Sonar.RecomputeModel` remote operation are unchanged apart from the type import.

  **Measured cost, on the 2,000-member demo model (4 row-writes per member).** Set-based 2.4s; this
  path 78s at RSP's default `maxConcurrency` of 1, and 17-20s at 10. The persister sets concurrency
  explicitly for that reason — inheriting the default would quietly cost a minute a run with no
  benefit. Verified against the live DB: all 2,000 Score rows match the old writer field for field
  (`RawScore`, `NormalizedScore`, `BandID`, `Previous*`, `Delta`, `TrendDirection`,
  `DataCompleteness`, `IsStale`) with zero mismatches, contribution count unchanged at 4,000, and the
  run now produces what the set-based path could not: a `MJ: Process Runs` row (Completed, 2000/2000,
  batch 200), 2,000 per-record detail rows, and 6,000 Record Changes for the Scores it touched.

  **Run-level atomicity is gone, deliberately.** The old writer wrapped the whole run in one
  transaction specifically so its "DELETE every contribution for the model, then re-insert" could not
  leave the population stripped of explainability if the run died midway. RSP isolates per record with
  no run-spanning transaction, so that shape is no longer safe — a crash between delete and re-insert
  would blow away every member's breakdown with nothing to roll back. Contributions are therefore
  reconciled **in place** per member (existing rows updated, missing inserted, surplus deleted), so a
  member's breakdown is never absent, only old or new. The trade is that a failed run now leaves some
  members on new scores and some on old, which is what RSP's run tracking and resume exist to handle.
  The surplus-delete arm matters: republishing a model with fewer factors would otherwise leave stale
  rows showing a factor the current version no longer scores.

  The reconcile decisions are extracted into `scoring/contributionPlan.ts` (`planContributions`,
  `percentOfTotal`) so they're unit-testable without a database — 12 new tests. The 8 `sqlLiteral`
  tests are removed along with the inline-literal path they guarded.

  Note that the compiled-factor **read** path (`CompiledFactorEvaluator`, `factors/filter.ts`) still
  issues set-based `SELECT`s. That is by design — `FactorCompiler` exists to turn declarative factor
  definitions into one query per population — and is out of scope here, which concerns writes.

- 9248a13: Add a RunView-backed read path for declarative factors, behind the existing `IFactorEvaluator` seam.

  Declarative factors compile to one set-based `SELECT` run through `provider.ExecuteSQL`. Raw reads
  apply neither entity permissions nor Row-Level Security — the one thing a raw read genuinely bypasses,
  unlike raw writes which also skip Entity Actions, Record Changes and cache invalidation. `RunView`
  applies both, so `RunViewFactorEvaluator` reads the measure rows and folds them in memory instead.

  Both evaluators satisfy `IFactorEvaluator`, so nothing downstream branches on the choice.
  `FactorCompiler` takes a `FactorReadPath` (`'compiled'` default, or `'runview'`), threaded from
  `RecomputeOrchestrator`. It is a setting rather than a migration deliberately: the cost is entirely a
  function of data volume, and the point is to measure the two against realistic volume before
  committing. Ineligible factors fall back to the compiled path and LOG why, so a measurement of the two
  can't be quietly meaningless.

  **Scope:** single-hop factors, seven aggregations (Count, Exists, DistinctCount, Sum, Avg, Min, Max),
  AllTime / Rolling / Calendar windows. Falls back for multi-hop (`RunView` cannot join, so it would need
  one read per hop plus an in-memory join), composite anchor keys, per-anchor windows (`SinceEvent` /
  `RenewalRelative` read a boundary date off the anchor), and factors with a `FilterExpression` (the
  compiled path parameterizes it and `ExtraFilter` takes no parameters — inlining the values would
  reintroduce the interpolation surface this path exists to reduce).

  **Verified on live data:** 2,000 anchors on a model whose Event Registrations factor routes through the
  new path, zero mismatches on raw values, `hadData` and normalized scores.

  **Two findings worth recording, both caught by measurement rather than review.**

  `Recency` stays on the compiled path. It is `DATEDIFF(day, MAX(date), asOf)` over naive datetimes, and
  the driver materializes `datetime` columns in LOCAL time while `datetime2` comes back as UTC — so
  computing the day difference here means replicating that per-column-type conversion. It measured off by
  the local UTC offset on boundary rows.

  The window is applied by the DATABASE, via a predicate in `ExtraFilter`, not in JavaScript after the
  read. The first version compared in JS and disagreed with the compiled path on 1,359 of 2,000 anchors:
  a row sitting exactly on a Rolling window's exclusive lower bound is excluded by SQL but was five hours
  past the bound once the driver had materialized it in local time, so every boundary row flipped in.
  Bounds are still computed (and unit-tested) in JS, then emitted as naive SQL literals from UTC
  components so both paths bound the window identically. Related: a naive `setMonth` for Rolling-month
  windows overflows 31 July − 1 month to 1 July, where `DATEADD` clamps to 30 June; now clamped.

  24 new unit tests cover the aggregation semantics where SQL and JavaScript disagree by default (AVG of
  an empty set is NULL not 0, NULLs excluded from SUM/AVG/MIN/MAX/DistinctCount, an anchor with no rows
  omitted rather than scored zero), the window predicate's exclusive-vs-inclusive bounds, and every
  eligibility exclusion.

- 2ab67b9: Convert every Sonar business timestamp column from `datetime2(7)` to `datetimeoffset(7)`, so a stored instant carries its own UTC offset.

  `datetime2` is a bare clock reading with no zone. A save → reload → save cycle through the MJ entity layer reinterpreted `ScoreRecomputeRun.StartedAt` as _local_ time and rewrote it ~5h shifted, which drove `CompletedAt − StartedAt` negative and displayed negative run durations. MJ's own `__mj_CreatedAt` / `__mj_UpdatedAt` survived the identical cycle untouched precisely because they are already `datetimeoffset` — Sonar's own columns were the odd ones out. PostgreSQL was never affected: its baseline already declares all 13 columns `timestamptz`, so this brings SQL Server to parity rather than introducing something new (hence no PG twin).

  This is a robustness upgrade, not a repair. The symptom was already worked around in code — `RecomputeOrchestrator.finishRun` computes the duration from an in-memory `Date` and never trusts the reloaded column. The value here is removing the trap instead of stepping around it, so no future writer can reintroduce the shift.

  **13 columns across 7 tables:** `Score.ComputedAt/AsOfDate/NextRecomputeAt`, `ScoreHistory.ComputedAt/AsOfDate`, `ScoreBandTransition.OccurredAt`, `ScoreRecomputeRun.StartedAt/CompletedAt`, `ScoreModelAuditEvent.ChangedAt`, `ScoreModelVersion.PublishedAt`, `ScoreModel.EffectiveFrom/EffectiveTo`, `Factor.LastValidatedAt`.

  **No value moves.** Converting `datetime2` → `datetimeoffset` reads each existing value as `+00:00`, which is correct because the stored values already _are_ UTC: the engine writes them via `toISOString()` and the old column defaults were `getutcdate()`.

  Three dependency classes had to be cleared and restored, and two of them were not obvious:

  - **6 DEFAULT constraints**, all `getutcdate()`, all **auto-named** (`DF__Score__ComputedA__2C201BE5`) and therefore different in every database — so they are dropped by lookup, never by hardcoded name. They come back with explicit names and `TODATETIMEOFFSET(SYSUTCDATETIME(), 0)`: same instant, now self-describing, and no longer auto-named for the next migration that touches them.
  - **2 non-unique indexes** keyed on a converted column (SQL Server will not retype an indexed column in place). Recreated with identical keys; key sizes stay well under the 1700-byte nonclustered limit.
  - Nothing else — no check constraints reference these columns and no view in the schema is `SCHEMABINDING`.

  The whole thing runs in one transaction. An earlier non-transactional attempt left the indexes dropped and the columns unconverted when the first `ALTER` hit an undeclared default — precisely the half-applied state a migration must not be able to produce.

  `ScoreWriter.sqlLiteral` now emits offset-aware date literals (`…T18:49:07.530+00:00`). It previously chopped the `Z` to suit `datetime2`, which left SQL Server inferring the zone for what was already a UTC instant — the exact inference this conversion exists to eliminate. Its unit test was updated to match.

  The migration carries its CodeGen output (regenerated views, CRUD procs, FK indexes, entity-field metadata) per the migration convention. That half is not optional: without it the CRUD procs keep declaring `datetime2` parameters and `__mj.EntityField.Type` stays `datetime2`, so MJ's runtime would still apply `datetime2` conversion semantics to `datetimeoffset` columns and the bug would survive its own fix.

  Verified end to end: after applying, zero `datetime2` remains anywhere in the schema — columns, stored-procedure parameters, or MJ entity-field metadata. Existing values are unshifted and run durations stay positive. A full 2,000-member recompute succeeds. And the cycle that caused the original bug — load through the entity layer, touch an unrelated field, save, twice — now leaves `StartedAt` and `CompletedAt` byte-identical. Re-applying the migration is a clean no-op.

### Patch Changes

- 7f1933a: Re-port the population-exit fix (dc7ce074) onto the RSP persister: anchors whose Score rows exist but who were absent from this run's resolved population have their Score + contributions deleted (FK order preserved), so a narrowed PopulationFilter or a genuine departure no longer leaves stale rows on the triage list. ScoreHistory keeps the trail.
- Updated dependencies [5ab10ae]
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

- 13741c9: Fix the PostgreSQL baseline failing on every PostgreSQL 16.x server.

  `migrations-pg/B202607171700__v0.2.x_Schema_and_Tables.pg.sql` was produced by `pg_dump` 17, whose header emits `SET transaction_timeout = 0`. That GUC is new in PostgreSQL 17, and an unrecognized configuration parameter is an `ERROR` rather than a warning, so the baseline aborted at its own header on every 16.x server. Sonar's PostgreSQL install was completely broken there: first migration, first statement block. Nothing in the schema needed the setting (0 is the default), so it is removed rather than guarded.

  The README claimed "PostgreSQL 17+", which described what had been tested rather than what is supported. It now says 16.x or later, verified on 16.11.

  Adds `migrations-pg/docs/PG_INSTALL_VERIFICATION.md`, a fresh-install runbook that pins the **oldest** supported major and explains why. A version-pinned test on the newest major cannot see this class of bug: dump headers are exactly the thing that varies by server version, and they fail closed.

  Ships in #52; this changeset only adds the release note, which the original PR did not include.

- 7dfbd4e: Stop members who left a model's population from lingering in the triage list with an old version's score.

  `ScoreWriter`'s Score MERGE had `WHEN MATCHED` and `WHEN NOT MATCHED` arms but nothing for rows whose anchor is no longer in the population. Narrowing a model's `PopulationFilter` therefore left the dropped-out members' `Score` rows completely untouched — old value, old `ScoreModelVersionID` — and every read path filters on `ScoreModelID` alone, so they kept appearing in the Engagement list looking scored. The population filter itself was working; the leftovers just made it look like it wasn't.

  The MERGE now reconciles rather than only upserting: `WHEN NOT MATCHED BY SOURCE AND t.ScoreModelID = @modelId THEN DELETE`, so `Score` means "the current scored population". Chosen over a retire-flag column because it needs no read-path changes at all — a flag would have to be filtered in every read, and missing one would silently reintroduce this exact bug.

  Deleting loses nothing. `ScoreHistory` is a separate append-only table holding every snapshot with the explainability breakdown in `ContributionsJSON`, so an exited member's full trail survives. `ScoreFactorContribution` is the only FK onto `Score` (`NO_ACTION`) and the model's contributions are already cleared earlier in the same transaction, so the delete cannot violate it.

  Two things worth knowing for review:

  - The `AND t.ScoreModelID = @modelId` predicate on the delete arm is load-bearing. `WHEN NOT MATCHED BY SOURCE` matches every row of the target table, so without it this would delete every _other_ model's scores on every recompute.
  - The empty-population case is handled separately: `write()` returns early when there is nothing to stage, so the MERGE never runs. It now clears the model's scores instead of returning a no-op, otherwise a filter matching nobody would leave the whole previous population on screen. Safe to read as "nobody in scope" because a failed population query throws in `resolvePopulation` rather than returning empty.

  Verified against the demo model (2,000 members): filtering to 66 dropped `Score` from 2000 to 66 while `ScoreHistory` grew 30000 → 30066 and other models stayed at 2000; clearing the filter brought all 2,000 back; a filter matching nobody left 0 scores, 0 contributions and 0 orphans, again with other models untouched.

- 324cbe5: Uninstall now removes Sonar's rows from MemberJunction's shared core schema, instead of orphaning them.

  Sonar's migrations seed ~225 rows into `__mj` (24 Actions, the authoring Agent with its Prompt and Template, the 3 Overview Queries and their fields/params). Those rows have no foreign-key path back to Sonar's own entities, so the engine's FK-graph walk cannot reach them and `mj app remove` left every one of them in the customer's database. A later reinstall then collided with them under the same hardcoded GUIDs. Fixes #51.

  The fix is a `migrations.teardownDirectory` in `mj-app.json`, which `@memberjunction/open-app-engine` runs on remove and on the compensation path when an install fails partway.

  **Three things turned out to be bigger than the issue described**, all of them found by running the teardown against a real database rather than reading the migrations:

  - **Seed-only deletion is not enough.** Sonar's Actions and Agent accumulate runtime rows the moment they are _used_ — `ActionExecutionLog`, `AIAgentRun` and its steps, `AIPromptRun`, `AIResultCache`, `AIAgentSession`, `QuerySQL`. `ActionExecutionLog.ActionID` is `NOT NULL`, so one Action run is enough to make `DELETE FROM Action` fail with FK 547, and since the engine runs the whole teardown in one transaction, that means nothing is cleaned up at all. An install that was never exercised tears down fine, which is why an install-then-remove test cannot see this. The verified run removes 3,996 `ActionExecutionLog` rows and 508 `AIAgentRunStep` rows alongside the 225 seeded ones.

  - **PostgreSQL needs its own directory.** The engine prefers `<teardownDirectory>-pg/` and falls back to the SQL Server one if it is absent. These scripts use `[bracket]` quoting, so the fallback would abort a PostgreSQL uninstall on its first statement. `migrations-teardown-pg/` ships alongside. It is also genuinely a different script, not a transliteration: the `QueryEntity` / `QueryField` / `QueryParameter` rows carry **different GUIDs** on the two platforms.

  - **Child rows must be scoped by parent, not by literal ID.** Deleting `ActionParam` by the 63 IDs the seed wrote breaks as soon as any later migration adds a param to an existing Action, leaving a row that blocks the parent DELETE. Open PR #40 does exactly that, which is why the verified run deletes 64. Scoping by `ActionID IN (<Sonar's Actions>)` is still bounded by Sonar's hardcoded GUIDs, and it makes the `Query` children immune to the cross-platform GUID divergence.

  **Safety.** The scripts split on FK nullability. A `NULL`-able reference into a Sonar row means the referencing row is valid without Sonar and is usually the customer's own — a `Conversation` whose default agent was Sonar's, a `Task` assigned to it — so phase 1 nulls the pointer and leaves the row standing. Only `NOT NULL` dependants, which cannot exist without Sonar, are deleted. Nothing matches on name or prefix; every predicate resolves to Sonar's hardcoded seed GUIDs directly or through a subquery chain.

  Verified on SQL Server 2022 by running the full teardown inside a transaction and rolling back, diffing row counts for **every** table in `__mj`: 84 statements, 4,826 rows removed, no FK error, and no change to `Conversation`, `Task` or `EntityDocument`. The PostgreSQL twin was executed against a real PostgreSQL 16 instance to confirm its syntax and identifier quoting.

  The scripts are generated, not hand-written — `ci/generate_teardown.mjs` reads the FK graph from a live `__mj` and topologically sorts it, and `ci/extract_ids*.py` pull the seeded GUIDs out of the migrations. Regeneration instructions are in `migrations-teardown/README.md`.

  - @mj-biz-apps/sonar-entities@0.5.0

## 0.4.1

### Patch Changes

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

- b0508e8: Add the sonar-engine scoring pipeline (compute stages, plan §6.1):

  - `IFactorEvaluator` / `FactorResult` — the single contract through which every factor (declarative or Action-backed) is evaluated.
  - `FactorCompiler` + `CompiledFactorEvaluator` — translate a declarative factor's config into one set-based SQL query and run it (v1: Count/Sum/Avg/Min/Max/DistinctCount aggregations with config-field validation, single-hop foreign-key join, rolling + all-time time windows).
  - `compileFilter` — compiles a `FilterExpression` (Kendo-compatible filter descriptors, matching `UserView.FilterState`) into a **parameterized** WHERE fragment, validating every field against the related entity's columns (typo + injection guard).
  - `NormalizationEngine` — fills `normalizedContribution`: `None` passthrough plus the population-relative `MinMax`, `Percentile` (rank with midpoint tie-handling), and `ZScore` (standardized, clamped to ±3) — with direction (`HigherIsBetter`) and output-range scaling.
  - `ScoringEngine` — combines normalized contributions via rubric weights into a 0–100 score, assigns a band, and emits a per-factor contribution breakdown for explainability (v1: WeightedSum, missing-factor-as-zero).

  - `RecomputeOrchestrator` + `ScoreWriter` — the conductor. `computeScores` runs the full pipeline (resolve population → evaluate + normalize each factor → combine) and returns scores; `recompute` additionally persists them: records a `ScoreRecomputeRun`, upserts each `Score` (keyed by model+anchor), and replaces its `ScoreFactorContribution` rows (requires a published model — stamps `ScoreModelVersionID`). `previewFactor` evaluates a single _unsaved draft_ factor over the population without persisting, reusing the same compile→normalize path so a builder's live preview matches the eventual score.

  The pure stages are unit-tested (vitest). v1 scope is deliberately narrow and fails loud outside it: WeightedSum models, full-population scoring from live config, row-by-row persistence (the scale path is set-based stage→MERGE + change-only diffing, not workers). Deferred: multi-hop joins, calendar/renewal-relative time windows, the remaining normalization methods (`Logistic`/`Banded`/`Lookup`), Action-backed/derived factors, `ScoreHistory`/`ScoreBandTransition`, scheduling.

  **Review follow-ups (this revision):**

  - Band assignment is now deterministic at shared boundaries: `ScoringEngine.assignBand` uses half-open ranges `[min, max)` with the top band inclusive, so a score on an adjacent-band edge always resolves to the upper band regardless of band query order (`loadBands` also orders `MinScore ASC`).
  - `resolvePopulation` explicitly rejects composite (multi-column) primary-key anchors rather than silently truncating to the first PK column.
  - Anchor IDs inlined into the `IN (…)` list are single-quote-escaped, closing a SQL-injection surface for string/varchar anchor PKs. (The full table-valued-parameter swap — true parameterization, honest non-UUID-PK typing, and the ~2100-parameter limit — remains a follow-up, as does computing from the immutable version snapshot rather than live config.)
  - Rolling windows now accept a length in **months** (`LengthMonths`), not just days: when set, the predicate uses `DATEADD(month, -N, @asOf)` and months take precedence over days. It uses `DATEADD(month)` rather than an `N×30`-day approximation, so a "Trailing 12 Months" window lands on the exact calendar date regardless of how long the intervening months are. Previously a month-based window threw (the code only read `LengthDays`). NOTE: this is only the window _length_ — _which date column_ a Rolling window filters on is the separate `Factor.DateField` decision, roadmapped for the next major migration (the `AnchorDateField` bridge is the interim).

- ea53114: Score the full population, with a per-factor missing-data policy and a model-level population filter.

  The engine pipeline (#2) scored only anchors that had data for at least one factor, and a missing factor silently contributed 0. That conflates "no engagement" with "not in scope" and makes fully-inactive members vanish from the results instead of surfacing at the floor. This PR makes scoring population-complete and gives missing data an explicit, configurable meaning:

  - **Full-population scoring** — `ScoringEngine.score` takes the resolved population and scores _every_ anchor, not just those with data. An anchor with no countable factors returns null (nothing to score) rather than being silently dropped.
  - **Missing-data policy** (per factor, from `Factor.MissingDataPolicy`): `Zero` counts an absent factor as 0, `NeutralMidpoint` as 0.5 (both keep the weight in the denominator, so missing data pulls the score), and `Exclude` drops the factor from both numerator and denominator (the anchor is scored only on the factors it has). Each contribution records whether it was measured or filled by policy, for explainability.
  - **Population filter** — `ScoreModel.PopulationFilter` narrows which anchors get scored (e.g. "active members only"), compiled to a validated WHERE fragment via a new `compileFilterInline` (same field-whitelisting + parameterization guarantees as the factor filter compiler).

  Pure stages stay unit-tested (`ScoringEngine` + `filter` suites). Engine-only; no schema, action, or UI changes — `Factor.MissingDataPolicy` and `ScoreModel.PopulationFilter` are existing columns this PR begins honoring.

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

- e0ae207: Add Tier-B normalization methods (`Logistic`, `Banded`, `Lookup`) behind a strategy registry.

  The four population-relative methods shipped with the engine pipeline (`None`/`MinMax`/`Percentile`/`ZScore`) cover "scale relative to the group," but some signals need a fixed, configured shape independent of the population:

  - **Logistic** — squashes a raw value through a logistic curve (configurable midpoint + steepness); good for "diminishing returns" signals where the first few events matter most.
  - **Banded** — maps raw-value ranges to fixed output points (a step function); good when the business defines explicit tiers.
  - **Lookup** — maps discrete raw values to output points via an explicit table; good for categorical/coded inputs.

  To add these without a growing `switch`, `NormalizationEngine` is refactored into a thin dispatcher over an `INormalizationStrategy` registry — each method is a self-contained strategy (population-relative ones consume the whole population in one pass; fixed-shape ones are per-record). Per-method config is parsed and validated up front (`parseNormalizationParams`), so malformed config fails loud rather than silently mis-scaling. Pure (no I/O), fully unit-tested.

  The public normalization surface (`NormalizationEngine`, `NormalizationSpec`, param types, the parser) is unchanged for consumers — the registry split is internal.

- Updated dependencies [86a6697]
- Updated dependencies [069db79]
- Updated dependencies [b3ed75b]
- Updated dependencies [d13067b]
  - @mj-biz-apps/sonar-entities@0.2.0
