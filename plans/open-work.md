# Open work, as of 6 August 2026

One place to see everything in flight, so you don't have to open nine pull requests to find out where the
project is.

> **This file lives on the `sonar_handoff` branch and is deliberately never merged.** It describes *other
> branches*, so on `next` it would be wrong within a week. Read it, act on it, then let it rot in place.
> Everything durable belongs in `CLAUDE.md`, `INSTALL.md`, `plans/how-sonar-works.md` or `plans/plan.md`
> instead.
>
> Each PR's own description is the detailed account and is generally good. This file carries what no
> individual PR can know: how they relate, what order to take them in, and one hazard they all share.

---

## The whole picture

`v0.5.0` shipped on 5 Aug. Nine PRs are open, all targeting `next`.

| PR | Branch | Size | Read this as |
|---|---|---|---|
| **#50** | `sonar_draft_outreach` | 46 ahead, **9 behind** | **The main event.** Everything below it is small by comparison. |
| #46 | `sonar_intervention_layer` | 20 | **Superseded.** Every commit is an ancestor of #50. Close it. |
| #40 | `sonar_config_ui_gaps` | 5 | **Superseded.** Same. Close it. |
| #49 | `sonar_runview_factors` | 1 | Independent, self-contained, well evidenced |
| #48 | `sonar_rsp_persistence` | 1 | Independent, self-contained, well evidenced |
| #45 | `sonar_datetimeoffset` | 1 | Independent, self-contained, well evidenced |
| #15 | `sonar_v1_housekeeping` | 1 | Dev scripts + docs, 159 files |
| #47 | `claude/sales-deal-management-app-…` | 2 | 1 file, a tracking note |
| #11 | `claude/mj-bizapps-strategy-…` | 2 | Docs only |

Plus two branches with **no PR** that need a decision, and one repo setting that is quietly wrong. Both
below.

---

## ⚠️ The hazard every small PR shares

**#45, #48, #49 and #15 all predate the `v0.5.0` release, and each carries changesets that the release
already consumed.** Merging one as-is would re-add spent changesets and **revert the published package
versions**. `#45` alone touches 31 files with ~4,700 deletions, including CHANGELOG entries.

Check any branch before merging it:

```bash
git fetch origin
git diff --name-only origin/next origin/<branch> -- .changeset/
```

Anything listed that is *not* this PR's own changeset is a leftover. As of now: 6 stale files each on #45,
#48 and #49; **13** on #15.

**The fix is the same in every case: merge `next` into the branch first**, which drops the consumed
changesets and restores the released versions. Do that before reviewing the diff, or you will be reading
noise. This applies to **#50** too, for the same reason plus the version bump.

---

## #50 · The intervention layer

**What it is.** Everything past scoring: deciding who needs attention, doing something about it, and
measuring whether it worked. Concretely, four things that don't exist on `next` at all:

- **Targeting** that reasons about *trajectory* and *cause*, not just "who scores low" (`SegmentEvaluator`,
  `trendShape`, `factorDrag`, `anchorConditions`, `rankCohort`)
- **Plays** that hand a cohort to MJ: onto a List, as one merged email, or as AI-drafted individual outreach
  a human approves
- **A randomised holdout** on every launch, so lift is measured against a real control group
- **Outcome measurement** comparing treatment against that holdout (`OutcomeMeasurer`)

**Why it's one PR and not five.** It supersedes #46 and #40 rather than stacking on them, so merge order
stopped mattering and their old conflicts are moot. The tradeoff is a 46-commit review.

**State.** CI green. 309 engine tests. The loop is verified end to end on the dev database: launch → holdout
split → AI drafts → approve/reject → send (dry run), with re-commit creating 0 duplicate rows. Lift measures
a real difference (`+37.9pp` on a score bar, `+43.5pp` on a domain outcome), and a fresh install from empty
applies all 29 migrations with 0 failures.

**Blockers.** Merge `next` in first (9 behind, incl. the v0.5.0 bump). Then it is reviewable.

**Uncommitted work sits on this branch** at time of writing: a migration fixing entity-metadata/base-view
width for two entities, the `OutcomeMeasurer` boolean-return and date-comparison fixes, and `demo-data/`.
Its `HANDOFF.md` is the document to read first.

**How to verify it yourself.** `node demo-data/rebuild-lift-story.mjs --apply` rebuilds the measured-lift
demo in one command and prints the numbers.

## #49 · RunView read path · #48 · Record-set persistence · #45 · datetimeoffset

Grouped because they share a shape: **each is one commit, independently mergeable, and already documented to
a standard this file cannot improve on.** Read the PR bodies. All three came from review feedback on #47 and
each was verified against the live 2,000-anchor database rather than by inspection.

- **#48** removes the last raw-SQL *write* in Sonar, so scores now go through `BaseEntity.Save()` and stop
  silently skipping field validation, Entity Actions, Record Changes and cache invalidation. Verified: 2,000
  rows compared, **0 field mismatches**, and 6,000 Record Change rows that previously did not exist.
- **#49** does the same for the *read* side behind `IFactorEvaluator`, opt-in per run so it can be measured
  against real volume before committing. Verified: 0 mismatches on 2,000 anchors. Its two findings are worth
  reading beyond the PR, because both are timezone bugs in disguise.
- **#45** converts 13 timestamp columns to `datetimeoffset`. Explicitly insurance, not a repair: nothing is
  broken today because `finishRun` never trusts the reloaded column. No PG twin, because PostgreSQL was
  never affected.

**Suggested order: #48, then #49** (the read path is the follow-up to the write path). #45 is independent of
both.

## #15 · Housekeeping · #47 · Entity Action tracking · #11 · Strategy docs

- **#15** brings dev/test scripts and design docs, 159 files. Carries the most changeset drift (13 files).
  Worth confirming it is the intended home for `sonar_app_nav`'s scripts before deciding (see below).
- **#47** is a single-file tracking note about MJ Entity Action workflow extensions. Its own last commit says
  the blocker moved: the upstream PR merged and the gate is now MJ 6.x.
- **#11** is documentation only, refactoring the plan onto Predictive Studio / Record Set Processing /
  Remote Operations. Oldest open PR (6 July). Worth asking whether that direction is still live before
  spending review time.

---

## Two branches with no PR, both needing a human decision

**`sonar_population_exit`**: PR #44 was **closed, not merged**, so its single commit is *not* on `next`. It
is a genuine bug fix:

> `ScoreWriter`'s Score MERGE had `WHEN MATCHED` and `WHEN NOT MATCHED` arms but nothing for rows whose
> anchor is no longer in the population. Narrowing a model's `PopulationFilter` left the dropped members'
> Score rows untouched, so they kept appearing in the Engagement list looking scored.

Deleting the branch loses that fix. It reads like something to reopen, but note it may interact with #48,
which rewrites `ScoreWriter`'s persistence entirely.

**`sonar_app_nav`**: 64 commits ahead, no PR, untouched since 22 July. The 64 reach back to "initial app
wiring", so the *product* code all reached `next` long ago via squash merges (Signal Studio and portfolio are
both there). What is genuinely unique is **190 files of dev tooling**: `scripts/test-*.mjs`, the `demo/`
directory, old changesets. PR #15 already carries 30 of those same files. Confirm #15 is the intended vehicle
and this branch can go.

---

## ⚠️ The repo's default branch is wrong

**GitHub's default branch is `claude/upbeat-hopper-rrgep9`**, a stale branch last touched **9 June** whose
tip commit is "Add developer punch list for initial Sonar build-out". It is the one merged branch that cannot
be deleted (`refusing to delete the current branch`).

This is not cosmetic:

- **Dependabot scans the default branch.** So the currently-reported **101 open alerts (46 high)** describe a
  9 June dependency tree, not `main` or `next`. That number is measuring a two-month-old snapshot.
- GitHub's compare view, the default PR base, and the repo landing page all point at it.

Repointing it at `main` is a settings change and takes a minute. Probably the highest value-per-effort item
on this page.

---

## If you want a running order

1. **Repoint the default branch** off the stale June branch, then re-read the Dependabot numbers. They may be
   very different.
2. **Close #46 and #40** and delete their branches. Verified redundant, and it takes the open count from 9 to 7.
3. **Merge `next` into #50**, then review and merge it. Everything else is small next to this, and several
   items only become actionable once it lands.
4. **#48, then #49, then #45** — each small, each independently verified. Merge `next` in first.
5. **Decide on `sonar_population_exit`** (reopen the fix?) and `sonar_app_nav` (is #15 the vehicle?).
6. **#15, #47, #11** last, and for #11 ask whether the direction still holds before reviewing.

## Decisions this file cannot make for you

- Reopen `sonar_population_exit`'s bug fix, or let it go?
- Is #15 the intended home for `sonar_app_nav`'s dev scripts?
- Is #11's Predictive Studio direction still live?
- Repoint the default branch to `main`, or to `next`?
