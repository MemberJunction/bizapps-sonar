# Sonar Handoff

You're picking up Sonar. This document is the honest state of the system as of **5 August 2026**: what's built, what's verified versus merely believed, the bugs we know about, and the traps that have already bitten someone once. Read this before `plans/plan.md` — the plan says what Sonar was designed to be; this says what it actually is.

**Reading order:** this file → [`plans/README.md`](plans/README.md) (the 5-minute pitch) → [`CLAUDE.md`](CLAUDE.md) (conventions and critical rules, kept current) → [`plans/plan.md`](plans/plan.md) §5–§6 when you touch schema or engine. `PUNCH_LIST.md` is the *previous* developer's onboarding and is historical — don't work from it.

---

## What Sonar is now, in one paragraph

Sonar scores engagement for any anchor entity (models, factors, rubrics and bands are all **data**, not code), and then — the part that took most of the recent work — helps a person figure out **who actually needs intervention**: not "who scores low" but *who is sliding, why, who they are, and who to work first*. The exits are deliberately thin: put the group on an MJ List, draft AI outreach for human approval, or hand the cohort to MJ Communications as one email. Sonar decides who and why; MJ executes; Sonar measures lift against an automatic holdout.

## The selection pipeline (the core mental model)

A targeting rule (`SegmentFilter`) resolves through four layers, in this order, in
`packages/Engine/src/orchestration/SegmentEvaluator.ts`:

| Layer | Question | Reads | Notes |
|---|---|---|---|
| 1. Point-in-time | How low? Moved how much last run? | `Score` (SQL) | band, score bounds, delta, band-crossing, `minDataCompleteness` trust gate |
| 1b. Member context | Who are they? | anchor entity (SQL) | tenure/dormancy/region/segment via `anchorConditions.ts`. **Unknown field = error, never a skipped condition** |
| 2. Trajectory | What shape is the path? | `ScoreHistory` | slope per 30 days, decline runs, net drop, volatility — `trendShape.ts` |
| 3. Reason | Which signal is dragging them? | `ScoreFactorContribution` | `factorDrag.ts`; drag ranks on **rubric weight**, see traps below |
| 4. Rank | Who first? | in memory | `rankCohort.ts`. Rank is part of the RULE: the run cap truncates the cohort, so order decides who gets treated |

Three invariants worth defending:
- **Unknown never matches.** Too little history, no contributions, a NULL date — all excluded, never silently included.
- **One definition of everything selective, server-side.** The reason, the trajectory, the rule itself. The browser receives answers as data (`Sonar: Preview Segment` for rule-resolved cohorts, `Sonar: Explain Scores` for plain lists). This was violated three times historically and the copies diverged — see CLAUDE.md critical rule 7.
- **What you preview is what a launch treats.** The Movers list, the count, and `Sonar: Run Intervention` all resolve the same rule through the same evaluator.

## What is VERIFIED (not just built)

- **309 engine unit tests + 32 Angular tests**, including the pure selection, lift and comparison modules.
- **Trajectory selection against planted real data**: `minDeclineRun >= 3` found exactly the 319 seeded eroders, 0 false positives.
- **Reason round-trip on 2,000 real scored members**: every breakdown slice's rule returns exactly the count its chip advertises; "Low X" and "No X" partition their factor with no overlap (`requireData`/`requireNoData` gates).
- **Anchor conditions agree with SQL**: engine-compiled fragments produce the same counts as direct queries; complementary date conditions partition the population exactly (1644 + 356 = 2000); injection attempts in values are neutralised and in field names are unrepresentable.
- **The intervention loop end-to-end on the dev DB**: launch → holdout split → Draft Outreach proposals → approve/reject → send; idempotent re-commit creates 0 new rows.
- **Lift measures a real difference end to end.** 100 outcome rows written from a real recompute, `writeFailures: 0`, and the Engagement UI renders `+37.9 pp · lift · score ≥ 20` (43.2% treated vs 5.3% control over 81/19). Every non-responder's delta is exactly 0, which is the check that proves the normaliser isn't manufacturing the difference. Against the **domain** outcome instead of the score, the same run reports `+43.5pp` (59.3% vs 15.8%) on `LastActivityDate`, and the success counts land exactly on the seeded responder counts (48/81, 3/19) with every non-success holding a NULL. Reproducible with one command: see [`demo-data/`](demo-data/README.md). Note the cohort behaviour is **seeded**, deliberately and reversibly; the pipeline is what's verified, not member psychology.
- **A fresh install works from empty.** Every migration applied to a bare database: 31 Flyway history entries, **0 failures**, entities registered, views queryable, FKs created. Re-proved after the outcome-field fix by rolling `Sonar_FreshInstall_50` back to its pre-fix state and letting Flyway apply the new migration for real rather than hand-running the SQL.
- **`Sonar: Email Cohort` launches from the UI**, params and all. The launch panel renders whatever the chosen play declares as operator input (Body as a textarea, required ones marked, seed descriptions as help text) while hiding the runner-injected ones, and blocks Preview/Launch until the required ones are filled. A dry-run launch returned `Synced 81 · held 19`, and MJ's `ActionExecutionLog` shows `ResultCode: SUCCESS` with the typed Subject/Body/From/TestRecipient/DryRun reaching the action alongside the injected `CohortJSON`. 0 assignments marked Failed.\n- **MJ Communications send path** reaches the provider: "Previewed 1 of 1 approved draft(s) via SendGrid… redirected to qa@example.test", with the approved count unchanged (a dry run marks nothing Executed).

## What is NOT verified

- **That the rules find people who actually need help.** Everything above proves the engine selects exactly whom a rule describes, and now that it measures a difference when one exists, but against data we planted ourselves. Nobody has checked whether a member Sonar calls "slipping away" is genuinely disengaging, or whether contacting them changes anything. **This is still the single biggest open question**, and no amount of internal verification can close it. It needs one real cohort at one real association.
- **Real email delivery** (no SendGrid key, see Blocked). Every path is dry-run; nothing has ever been sent to anyone.
- **The PostgreSQL twins have never been run against a PostgreSQL database.** They exist for every migration and are checked for FK ordering in CI, but "correct by inspection" is all they have. The newest one (`V202608041000`) is hand-authored because the automatic converter mangles `DECLARE @var` + `IF` blocks. Treat converter output as a draft, always read it.
- **`fastestDecline` / `biggestDrop` ranking in the UI.** Sound in unit tests, never exercised against real rows. An earlier handoff said it was a no-op because every planted eroder shared an identical −20 delta; that is no longer true (the demo model now has 10 distinct deltas spanning −18 to +22.4), so the ordering is testable now. Nobody has tested it.

## Known bugs and gaps (fix-me list, in priority order)

1. **Nothing guards the entity-metadata / base-view width invariant.** Two entities shipped broken because of it, and it is the most expensive trap on this list (see below). The check is a single query, printed in INSTALL.md under "Verifying the install", but it is run by hand or not at all. CI cannot run it because CI has no database, so it needs to be a post-install / post-codegen step in a release checklist, or a `postinstall` hook. Until then it re-arms every time CodeGen changes a view shape.
2. **No guard for a deleted model still being the persisted UI selection.** Delete a `ScoreModel` while it is the selected one and the Engagement surface shows `Failed to load … Score Models with key: ID=…` and no way back except clearing local storage. Bit once, during a probe.
3. **`Member.LastActivityDate` is not derived from anything.** 1,949 of the 2,000 demo members hold NULL; the other 51 were stamped by `demo-data/` for its cohort, which is enough to demo the domain outcome and not enough for anything else. So dormancy rules still can't work on the real population. The activity exists in source tables (6,851 event registrations, 6,806 payments, of which 123 are demo-seeded). Deriving last-activity from factor sources is the real fix, and it's a scoring concern, not a selection one.
4. **The shared control language is used by exactly one surface.** `.sonar-optlist`, `.sonar-switch`, `.sonar-fieldrow` and `.sonar-field__unit` appear only in `engagement-manager`. The sharpest example of the drift is *inside* that same surface: the launch panel's kind selector is a hand-rolled `.sonar-launch__kindbtn` pill trio (with its own 2 CSS rules) sitting a few lines from the `.sonar-optlist` it should be. The other surfaces don't hand-roll *pills* so much as bespoke domain widgets with their own active states: `pb-socket--active` and `sonar-norm-card--active` in model-builder, `sonar-pf-slot--selected` in portfolio, `sonar-studio__step-nd--active` in signal-studio. Decide the pill-vs-optlist-vs-switch rule, write it into `packages/Angular/CLAUDE.md`, then roll out in ONE pass: surface-by-surface is how the drift happened.
5. **The authoring agent knows nothing about the intervention layer — deliberately, for now.** Its 23
   tools and its system prompt are all authoring-side, so it cannot measure, launch, or even name an
   intervention. A measurement-only capability was built, live-verified, and **backed out on 7 Aug** as
   redundant with the UI's one-click Measure until the lift→thresholds loop exists. The full recipe
   (tool link conventions, name-resolution design, prompt-patch pattern, and the mirror-drift trap that
   bit twice) is preserved in `plans/future-features.md` §2b — update the agent WITH that loop, not before.
6. **101 open Dependabot alerts** on the default branch: 46 high, 47 medium, 8 low, 0 critical. Pre-existing and untriaged, and the count has grown (an earlier handoff said 77/32). Concentrated rather than scattered: `@angular/common` (10 high), `undici` (5), `brace-expansion` (5), `@angular/core` (4), so a handful of bumps clears most of it.

### Fixed since the last handoff

Listed so you don't go hunting for bugs that are gone:

- `TransitionInterventionDispatcher` silently skipping trajectory rules. Now `triggerKindFor()` classifies band / derived / none, with 12 tests. Verified on a real recompute: "1 intervention(s) matched, 200 assigned".
- `Sonar: Run Intervention` with `preview: true` creating ScoreSegment/Intervention rows as a side effect. `resolveSegment`/`resolveIntervention` now take a `create` flag, and the commit path throws rather than accepting a null intervention id. DB row counts verified unchanged across a preview, then changed across a commit.
- The word "member" hard-coded across the UI. The noun is now derived from the anchor entity (`core/anchor-noun.ts`, 12 tests). A model anchored on Certifications says "certifications".
- Outcome writes failing silently: see the trap below.
- **`AnchorField` outcome definitions could not compare dates.** A `Date` stringifies as `"Sat Aug 01 2026 …"`, so the string fallback compared `"S"` against `"2"` and returned true for **every date that has ever existed**, reporting success for the whole population. Dates now compare on the instant, behind a strict `YYYY-MM-DD` guard so a bare number is not read as a year. A `null` field value and a date-against-non-date comparison are now explicitly unanswerable (false for every operator); previously `Status != 'Active'` counted every member with no status as a win.

### Every claim in this file was re-checked on 5 Aug. Here is what was wrong.

The previous handoff's fix-me list was audited item by item against the code and the database. **Two
items were entirely false and four more had wrong numbers or a wrong characterisation.** Nothing was
malicious; claims were simply carried forward without being re-measured, which is what happens to a
document like this. So: treat every assertion here as a claim to verify, and if you re-check one,
correct it in place.

Entirely false, and deleted:

- *"The launch panel can't supply a play's own params, so `Sonar: Email Cohort` isn't launchable from the UI."* The generic param editor exists in both the panel and the service (`editableParamsForAction` / `PlayParam`), and Email Cohort launches. Verified end to end above. `ActionExecutionLog` shows it succeeding back on 31 July, so this was never recently true.
- *"#47 targets `main`, unlike every other feature PR."* It targets `next`, like all nine open PRs. The branch table also omitted four open PRs entirely.

Corrected numbers:

| Claim | Was | Actually |
|---|---|---|
| Dependabot alerts | 77 open, 32 high | **101 open, 46 high**, 0 critical |
| Sonar entities | 14 (INSTALL.md) | **19** |
| Sonar actions seeded | 23 (INSTALL.md) | **33** |
| Surfaces hand-rolling pill controls | "five other surfaces" | **one**, and it is the same surface that owns the primitives |
| `fastestDecline` ranking | no-op, all deltas identical at −20 | 10 distinct deltas, −18 to +22.4, so testable but untested |
| `LastActivityDate` | NULL for all 2,000 | 1,949 NULL, 51 stamped by `demo-data/` |

The two items that survived unchanged are 1 (the width invariant is genuinely unguarded: no `postinstall`
hook exists in `package.json` or `mj-app.json`, and no workflow checks it) and 2
(`CurrentModelService.read()` genuinely returns whatever localStorage holds, with no existence check).

## Blocked on externals

- **SendGrid (or MS Graph) API key + a verified From address.** Until then the email exit is dry-run only (`DryRun` defaults TRUE; `TestRecipient` redirects a live send to one address).
- Demo anchors carry **invented email addresses** — never point a live provider at them.

## Traps that have already bitten someone

These are the expensive ones. Each has bitten at least once; several are also encoded as CLAUDE.md critical rules or CI checks.

- **`PercentOfTotal` is a lie for missing data.** The scorer writes 0 for a factor the member has no records for — exactly when that factor is hurting them most. Anything reasoning about *why* must rank on `ModelFactor.Weight` (`factorDrag.ts`). The old maths left 673 of 2,000 members "unexplained"; the corrected maths shows **61% of the demo population's low scores are data gaps, not disengagement**.
- **Angular's emulated encapsulation makes parent-styles-child silently dead CSS.** Four separate incidents in one week. If you're styling anything inside a `<sonar-*>` tag from a consuming component's stylesheet, it does nothing. Fix: style in the child's own `styles`/CSS, or add an explicit input (see `sonar-member-filter`'s `dense`).
- **The monorepo build proves nothing about a fresh `mj app install`.** A browser package depending on a server-only package builds fine locally and breaks on install. `.github/scripts/validate-client-package-boundary.sh` now guards this in CI (it has caught both historical incidents in tests); domain logic belongs server-side anyway (CLAUDE.md rule 7).
- **Never edit an applied migration** — checksum change aborts every upgrade (broke v0.2.0→v0.3.0 once). New forward migration, idempotent inserts, PG twin, and remember `metadata/` is dual-sourced (install runs migrations only).
- **A base view wider than its entity metadata breaks every write to that entity, silently.** The
  most expensive trap on this list. MJ's entity layer sizes a `@ResultTable` from the **entity metadata
  field list**, then runs `INSERT INTO @ResultTable EXEC spCreate…`, and the procedure returns a row
  from the base view. One extra column in the view and every save dies on "Column name or number of
  supplied values does not match table definition." Two entities shipped this way:
  `Intervention Outcomes` and `Intervention Proposals`, so nothing was ever measurable and no drafted
  proposal could persist on a fresh install. Both are fixed in `V202608041000`.
  Three things make it nasty:
  - **CodeGen adds denormalized FK display columns to views** (`Intervention.Name AS [Intervention]`)
    but `spUpdateExistingEntityFieldsFromSchema` does **not** register view-only columns. Running that
    procedure by hand against a fully installed database changes nothing (8 fields before, 8 after). The
    field has to be inserted explicitly.
  - **A local `mj codegen` mints those field rows straight into your dev database**, where they are never
    captured into a migration. So dev and a fresh install drift in *opposite* directions, and "works on
    my machine" and "works on install" can each be true while the other is false. Diagnose which
    environment is actually broken before writing the fix; the first attempt here fixed dev and would
    have broken the working install path.
  - It was invisible because `OutcomeMeasurer` ignored the boolean `Save()` returns and counted the
    attempt anyway: **"Measured 100 outcome(s)" against a table holding zero rows.** `BaseEntity.Save()`
    returns `false`, it does not throw. Check it, every time.
  Sweep for it with the query in **INSTALL.md, "Verifying the install"**: for every Sonar entity, does
  `COUNT(EntityField)` equal the base view's `COUNT(sys.columns)`? Anything it returns is a broken write
  path, and the DIRECTION tells you which side drifted. Run it after `mj app install`, after `mj:migrate`,
  and after any `mj codegen` that touched a Sonar entity.
- **Date-column comparisons truncate the literal's time** on SQL Server, so an inclusive boundary can double-count (it did: 2,001 members in two "complementary" cohorts of a 2,000 population). `olderThanDays` is strictly-before for this reason.
- **`sonar-shell.css` puts `height: 100%` on every component host.** Any component inside a flex row will stretch into dead space until you pin `:host { height: auto }`.
- **The holdout hash is load-bearing: never reuse it unsalted.** The split is
  `hashToPercent(anchorRecordId) < holdoutPercent -> Control` (FNV-1a, deliberately no `Math.random`
  so a member's cohort is reproducible). Anything else that hashes the bare anchor id therefore
  correlates with treatment/control. This bit hard: `_seed_traj.mjs` classified demo archetypes with
  the same hash, defining "eroder" as `hash < 15` — entirely inside a 20% holdout. Every eroder was
  guaranteed to be Control, so **every trajectory rule held back 100% of its cohort and fired on
  nobody**, presenting in the UI as `Would sync 0 · hold 100`. Nothing in the product was wrong; four
  layers were verified innocent before the seed script turned out to be the cause. Fixed by salting
  (`hash100('archetype:' + anchorId)`) and re-seeding. If you add deterministic sampling, A/B variants
  or bucketing of any kind, **salt it**.
- **Slope from dev recompute bursts**: N recomputes minutes apart make slopePerDay explode; `dedupeByDay` + `minSpanDays` in `trendShape.ts` exist for this. Don't remove them.
- **The `5044A100-00XX-…` ID space is hand-allocated and SHARED**, not Action-only: Actions, ActionParams, ActionResultCodes, ActionCategories, AIAgentActions, AIPrompts, Templates and Remote Operations all draw from it. **High-water mark at handoff: `0x30`. Free: `04`, `06`, `07`, `2B`–`2F`** (`28` = Send Approved Outreach; `29` and `2A` = the two EntityField rows added by `V202608041000`, which is itself a reminder that the space is not Action-only). Take the next free slot and grep before you commit; there has already been one collision (Count Population vs Run Intervention, resolved by renumbering to `001F`). Note that `metadata/sql_logging/` holds `mj sync push` audit logs containing old IDs; it is **not** an allocation source, so exclude it when checking (`--exclude-dir=sql_logging`) or you will read freed slots as taken.
- **Metadata mirrors drift.** Action descriptions live in migrations AND `metadata/actions/.sonar-actions.json`. When updating, generate the JSON from the migration text (see the pattern in recent migrations) so they can't disagree.

## The dev loop

- DB: dev runs against a **clone** (`Sonar_Demo_Slice`) with `outOfOrder: true`; `.env` points at it.
- **⚠️ `npm run mj:migrate` will FAIL against the dev database.** Eighteen migrations were renumbered to
  fix an FK-ordering break (`Intervention_Proposals` referenced a table created later), so the dev clone's
  Flyway history no longer matches the files. Apply new migrations there by hand: substitute
  `${flyway:defaultSchema}` → `__mj_BizAppsSonar` and `${mjSchema}` → `__mj` and run the SQL, or rebuild
  the clone. `Sonar_FreshInstall_50` is the scratch database used to prove real installs and can be
  dropped.
- `npm run mj:migrate` → `npm run mj:codegen` (schema changes only) → build affected packages **in the package dir** → restart.
- **API restart required** after seeds/codegen/action changes; **Angular rebuild + Explorer restart** after UI changes. `npm start` runs both (4102 API / 4302 Explorer).
- UI verification is not optional: Playwright, both themes, 1440px and 1075px (`packages/Angular/CLAUDE.md` §6).
- Scratch validators in the repo root (`_sa.mjs` = raw SQL; `_validate_reason.mjs`, `_validate_anchor_rank.mjs`, `_validate_traj.mjs` = compiled-engine-vs-SQL checks against real rows). Untracked on purpose; they're how the "verified" claims above were made. Keep them alive.
- [`demo-data/`](demo-data/README.md) is the **tracked** counterpart: scripts whose output ends up in
  front of stakeholders, so they have to be reproducible. `rebuild-lift-story.mjs --apply` rebuilds the
  measured-lift demo in one command. It also shows the pattern for running the engine standalone
  (`setupSQLServerClient` + `UserCache.Instance.GetSystemUser()`), which is far faster to iterate on than
  restarting the API to poke an Action.

## Branch state, and the rest of the in-flight work

**Not here on purpose.** Branch and PR state goes stale within days, so keeping it in this file meant editing
this file every time anything merged. It now lives in **`plans/open-work.md` on the `sonar_handoff` branch**,
which is never merged precisely because it is temporary.

That document covers: all nine open PRs and how they relate, which two are superseded and safe to close, a
suggested running order, two branches with no PR that need a decision, and one repo setting that is quietly
wrong (the GitHub default branch points at a stale branch from 9 June, which is also what Dependabot scans).

The one thing worth repeating here, because it will bite whoever merges anything: **every branch that predates
the `v0.5.0` release carries changesets the release already consumed**, so merging one as-is re-adds spent
changesets and reverts the published package versions. Merge `next` into the branch first. Check with:

```bash
git diff --name-only origin/next origin/<branch> -- .changeset/
```

**Uncommitted on this branch** at handoff, unstaged so a human reads it before it lands:

- `migrations/V202608041000__…_Intervention_Outcome_Field_Fix.sql` + its PG twin: the entity-metadata /
  base-view width fix for the two affected entities. Verified on a fresh install and on the dev database.
- `packages/Engine/src/orchestration/OutcomeMeasurer.ts`: `writeOutcome` now returns whether the row
  persisted, and `compareOp` handles dates and missing values. Tests for both.
- `demo-data/`: the lift-story rebuild script and its README.
- `.changeset/sonar-outcome-measurement-fixes.md` covers all of it.

**Also note:** `schema.graphql` regenerates with ~4,500 deletions on some builds. It is a regression, not a
real change. Keep it out of commits.

## Where to go next

[`plans/future-features.md`](plans/future-features.md) is the ranked idea list with rationale and code pointers. [`plans/remote-operations.md`](plans/remote-operations.md) covers the Remote Operations story (what's already using it, what should). The one-sentence steer: **the highest-value next step is making selection answer the membership lead's real question** — "who's slipping AND about to renew, ranked, capped at what my team can do this week" — which needs the one-hop related-entity slice (RenewalDate lives on `Membership`, not `Member`), and then closing the loop by feeding measured lift back into the thresholds that are currently just sensible guesses.

Three things worth doing early, in whatever order suits you:

1. **Merge #50 and close the stale PRs** (table above). Everything else is easier from one branch.
2. **Get a SendGrid key and send one real email to an address you own.** It is the last unproven link in
   the chain, the guards are already built (`DryRun` defaults TRUE, `TestRecipient` redirects), and it is
   an hour of work that removes the biggest "does this actually do anything" objection.
3. **Point it at one real association's data.** Everything in the "NOT verified" list above collapses to
   this. Internal verification has gone about as far as it usefully can.
