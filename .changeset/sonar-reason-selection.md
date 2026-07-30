---
"@mj-biz-apps/sonar-engine": minor
"@mj-biz-apps/sonar-actions": minor
"@mj-biz-apps/sonar-ng": minor
---

Select cohorts by the REASON a member is low, not just by how low they are.

A score says how disengaged someone is; it does not say what to do about them. Sonar already computed which signal drags each member down and then discarded it at selection time, so a cohort picked by score or trajectory was a mixed bag — members who stopped attending events sitting beside members who stopped opening email — and any one action had to be generic to fit.

A segment rule can now ask about the reason: `reason.dominantFactorIds` for "this signal is their MAIN problem" (a homogeneous group, which is what makes one action fit), or `reason.weakOnFactorId` for "weak on this signal at all". `Sonar: Preview Segment` returns a `breakdown` of how the whole cohort splits by main problem, and the Movers explorer renders it as clickable slices that narrow the list, the count, and the launch to one problem.

**Drag now ranks on the configured rubric weight, not the realized `PercentOfTotal`.** This changes answers. With a `Zero` missing-data policy the scorer writes `PercentOfTotal = 0` for a factor the member has no records for — which is precisely when that factor is hurting them most — so ranking on it made a missing signal impossible to name as the reason. On a 2,000-member demo model the old maths reported 1,322 members as "Low Event Registrations" and left 673 unexplained; the corrected maths reports 778 "Low Event Registrations", 677 "No Event Registrations", 544 "No Email Clicks" and nothing unexplained. About 61% of that model's low scores are missing data rather than disengagement, and the UI now says so instead of recommending outreach to those members.

Grouping distinguishes a data gap from genuine weakness on the same factor, because they need different responses (fix the integration vs. contact the member). That needed a `requireData` gate to mirror `requireNoData`: without it a "Low X" slice would also return the "No X" members and the list would contradict the count on its own chip.

**One definition of the reason, and it lives on the server.** The drag ranking existed in three places — the Triage Why column, the Movers Why column, and a private copy inside the Draft Outreach play — and they diverged the moment the calculation was corrected. That mattered most in the play, which hands the label to an LLM as fact, so the stale version would have told a member their event attendance was low when the real problem was a missing feed for a different signal.

The two server callers now share the engine's `factorDrag`. The browser no longer computes it at all: new read-only action **`Sonar: Explain Scores`** takes a set of Score ids and returns each one's reason label, so the Triage list is handed the answer as data (`Sonar: Preview Segment` already did this for rule-resolved cohorts). This is not just tidier — the ranking is what a targeting rule SELECTS on, so a browser-side copy could disagree with who a launch would actually pick. It also sends less over the wire than before, which pulled every factor contribution for all 50 listed members to derive 50 short strings.

Adds `.github/scripts/validate-client-package-boundary.sh` to the build workflow. An earlier attempt at sharing gave `sonar-ng` a dependency on `sonar-engine`, which is server-only (it peer-depends on `@memberjunction/sqlserver-dataprovider`) and has no client or shared role in `mj-app.json` — so a fresh `mj app install` would have failed to resolve it on the client even though every monorepo build passed. That is the same mistake as listing `sonar-actions` under `shared`, which once broke the Explorer build with `Could not resolve "stream"`. The check fails if anything the manifest exposes to the browser depends on a server-only MJ package, or on a first-party package the manifest does not place client-side. It runs before the build, because the build cannot detect either case.
