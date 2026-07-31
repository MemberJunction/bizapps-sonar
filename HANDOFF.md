# Sonar Handoff

You're picking up Sonar. This document is the honest state of the system as of **July 2026**: what's built, what's verified versus merely believed, the bugs we know about, and the traps that have already bitten someone once. Read this before `plans/plan.md` — the plan says what Sonar was designed to be; this says what it actually is.

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

- **285+ engine unit tests** (`packages/Engine`, vitest), including the pure selection modules.
- **Trajectory selection against planted real data**: `minDeclineRun >= 3` found exactly the 319 seeded eroders, 0 false positives.
- **Reason round-trip on 2,000 real scored members**: every breakdown slice's rule returns exactly the count its chip advertises; "Low X" and "No X" partition their factor with no overlap (`requireData`/`requireNoData` gates).
- **Anchor conditions agree with SQL**: engine-compiled fragments produce the same counts as direct queries; complementary date conditions partition the population exactly (1644 + 356 = 2000); injection attempts in values are neutralised and in field names are unrepresentable.
- **The intervention loop end-to-end on the dev DB**: launch → holdout split → Draft Outreach proposals → approve/reject → simulated send; idempotent re-commit creates 0 new rows.

## What is NOT verified

- **That the rules find people who actually need help.** Everything above proves the engine selects exactly whom a rule describes — against data we planted ourselves. Nobody has checked whether a member Sonar calls "slipping away" is genuinely disengaging, or whether contacting them changes anything. The lift machinery exists precisely for this and has never been pointed at a real cohort.
- **Real email delivery** (no SendGrid key — see Blocked).
- **`fastestDecline` / `biggestDrop` ranking in the UI** — sound in unit tests, but a no-op on the demo cohort because every planted eroder has an identical −20 delta and −8.5/mo slope.

## Known bugs and gaps (fix-me list, in priority order)

1. **`TransitionInterventionDispatcher` silently skips trajectory rules.** It only understands band/delta. A scheduled trigger on a trajectory rule quietly fires on nobody. Shipped code, real bug.
2. **The launch panel can't supply a play's own params** (Subject/Body/From), so `Sonar: Email Cohort` isn't launchable from the UI. The token-param plumbing (`AnchorRecordID → {{member}}` etc.) exists in `intervention.service.ts`; a generic param editor doesn't.
3. **`Sonar: Run Intervention` with `preview: true` still creates ScoreSegment/Intervention rows** as a side effect. The newer `Sonar: Preview Segment` is clean; the launch path isn't.
4. **Demo data can't exercise dormancy**: `Member.LastActivityDate` is NULL for all 2,000 rows (a denormalized column nobody populates). The activity exists in source tables (6,851 event registrations, 6,683 payments) — deriving last-activity from factor sources is the real fix, and it's a scoring concern, not a selection one.
5. **UI control-language rollout is one pane deep.** The Movers rule pane uses the shared control primitives (`.sonar-optlist`, `.sonar-switch`, `.sonar-fieldrow`, `.sonar-field__unit`, `.sonar-token` in `sonar-shell.css`); five other surfaces still hand-roll pill controls. Decide the pill-vs-optlist-vs-switch rule, write it into `packages/Angular/CLAUDE.md`, then roll out in ONE pass — surface-by-surface is how the drift happened.
6. **77 Dependabot vulnerabilities** on the default branch (32 high) — pre-existing, untriaged.

## Blocked on externals

- **SendGrid (or MS Graph) API key + a verified From address.** Until then the email exit is dry-run only (`DryRun` defaults TRUE; `TestRecipient` redirects a live send to one address).
- Demo anchors carry **invented email addresses** — never point a live provider at them.

## Traps that have already bitten someone

These are the expensive ones. Each has bitten at least once; several are also encoded as CLAUDE.md critical rules or CI checks.

- **`PercentOfTotal` is a lie for missing data.** The scorer writes 0 for a factor the member has no records for — exactly when that factor is hurting them most. Anything reasoning about *why* must rank on `ModelFactor.Weight` (`factorDrag.ts`). The old maths left 673 of 2,000 members "unexplained"; the corrected maths shows **61% of the demo population's low scores are data gaps, not disengagement**.
- **Angular's emulated encapsulation makes parent-styles-child silently dead CSS.** Four separate incidents in one week. If you're styling anything inside a `<sonar-*>` tag from a consuming component's stylesheet, it does nothing. Fix: style in the child's own `styles`/CSS, or add an explicit input (see `sonar-member-filter`'s `dense`).
- **The monorepo build proves nothing about a fresh `mj app install`.** A browser package depending on a server-only package builds fine locally and breaks on install. `.github/scripts/validate-client-package-boundary.sh` now guards this in CI (it has caught both historical incidents in tests); domain logic belongs server-side anyway (CLAUDE.md rule 7).
- **Never edit an applied migration** — checksum change aborts every upgrade (broke v0.2.0→v0.3.0 once). New forward migration, idempotent inserts, PG twin, and remember `metadata/` is dual-sourced (install runs migrations only).
- **Date-column comparisons truncate the literal's time** on SQL Server, so an inclusive boundary can double-count (it did: 2,001 members in two "complementary" cohorts of a 2,000 population). `olderThanDays` is strictly-before for this reason.
- **`sonar-shell.css` puts `height: 100%` on every component host.** Any component inside a flex row will stretch into dead space until you pin `:host { height: auto }`.
- **Slope from dev recompute bursts**: N recomputes minutes apart make slopePerDay explode; `dedupeByDay` + `minSpanDays` in `trendShape.ts` exist for this. Don't remove them.
- **The `5044A100-00XX-…` ID space is hand-allocated and SHARED**, not Action-only: Actions, ActionParams, ActionResultCodes, ActionCategories, AIAgentActions, AIPrompts, Templates and Remote Operations all draw from it. **High-water mark at handoff: `0x30`. Free: `04`, `06`, `07`, `28`–`2F`.** Take the next free slot and grep before you commit — there has already been one collision (Count Population vs Run Intervention, resolved by renumbering to `001F`). Note that `metadata/sql_logging/` holds `mj sync push` audit logs containing old IDs; it is **not** an allocation source, so exclude it when checking (`--exclude-dir=sql_logging`) or you will read freed slots as taken.
- **Metadata mirrors drift.** Action descriptions live in migrations AND `metadata/actions/.sonar-actions.json`. When updating, generate the JSON from the migration text (see the pattern in recent migrations) so they can't disagree.

## The dev loop

- DB: dev runs against a **clone** (`Sonar_Demo_Slice`) with `outOfOrder: true`; `.env` points at it.
- `npm run mj:migrate` → `npm run mj:codegen` (schema changes only) → build affected packages **in the package dir** → restart.
- **API restart required** after seeds/codegen/action changes; **Angular rebuild + Explorer restart** after UI changes. `npm start` runs both (4102 API / 4302 Explorer).
- UI verification is not optional: Playwright, both themes, 1440px and 1075px (`packages/Angular/CLAUDE.md` §6).
- Scratch validators in the repo root (`_sa.mjs` = raw SQL; `_validate_reason.mjs`, `_validate_anchor_rank.mjs`, `_validate_traj.mjs` = compiled-engine-vs-SQL checks against real rows). Untracked on purpose; they're how the "verified" claims above were made. Keep them alive.

## Branch state at handoff

- Everything recent is on **`sonar_draft_outreach`** (pushed, 31 commits), which **contains the work of both open PRs**: #40 (`sonar_config_ui_gaps`) and #46 (`sonar_intervention_layer`, the intervention spine). Those two are **siblings, not a stack** — neither is an ancestor of the other, so either can merge first. Merging both before opening a PR from this branch is what keeps that PR reviewable; otherwise it presents all 31 commits at once.
- **#46 is the only blocked one**: 2 conflicts against `next`, both collisions with work that already landed — `metadata/actions/.sonar-actions.json` (the Count Population entry vs the new intervention actions) and `sonar-engagement-manager-resource.component.ts` (Refresh + bus subscriber vs the intervention UI). Both want **combining, not picking** — same shape as the resolved #40 conflict. #40 and #45 are clean.
- Release flow: features → `next`, single coordinating PR `next` → `main` publishes. Changesets: the reason/context/rank work has one; the UI craft pass doesn't.

## Where to go next

[`plans/future-features.md`](plans/future-features.md) is the ranked idea list with rationale and code pointers. [`plans/remote-operations.md`](plans/remote-operations.md) covers the Remote Operations story (what's already using it, what should). The one-sentence steer: **the highest-value next step is making selection answer the membership lead's real question** — "who's slipping AND about to renew, ranked, capped at what my team can do this week" — which needs the one-hop related-entity slice (RenewalDate lives on `Membership`, not `Member`), and then closing the loop by feeding measured lift back into the thresholds that are currently just sensible guesses.
