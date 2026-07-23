---
"@mj-biz-apps/sonar-entities": minor
"@mj-biz-apps/sonar-engine": minor
"@mj-biz-apps/sonar-core-entities-server": minor
"@mj-biz-apps/sonar-actions": minor
"@mj-biz-apps/sonar-server": minor
"@mj-biz-apps/sonar-ng": minor
---

The intervention layer (plan §5.6): segments → interventions fired as MJ Actions → automatic holdout, salvaged from the parked `sonar_app_nav` branch and adapted to the current line.

- **Schema (4 tables, both dialects):** `ScoreSegment` (saved cohort filter over scores), `Intervention` (segment + MJ Action + `ControlGroupPercent` holdout + trigger), `InterventionAssignment` (immutable per-member Treatment/Control split), `InterventionOutcome` (created now; engine-wired in the outcomes/lift phase). Fixed the salvage's `AnchorRecordID` width (100 → 450) to match the composite-anchor-key widening.
- **Engine:** `SegmentEvaluator` (cohort from persisted Scores), `InterventionRunner` (pure planning — deterministic FNV-1a treatment/control split so the holdout is reproducible and auditable, per-member idempotency so a re-run never re-fires anyone, per-run cap), `interventionInvoker` (the only I/O), and `TransitionInterventionDispatcher` — post-recompute, `OnEnterSegment` interventions fire on band-entry transitions (entrant-targeted, `Handled` flag consumed, failure-isolated so a broken intervention never fails a scoring run).
- **`Sonar: Run Intervention` action** (seeded via idempotent forward migrations, both dialects): find-or-creates the segment + intervention from the operator's current filter; `preview` returns honest counts without writing or firing; commit writes assignments and fires the play for Treatment only.
- **Score Movers is now a segment explorer.** Instead of a fixed top-5 leaderboard, the Movers tab is a live, tunable view: a summary line (dropped / climbed / crossed-a-band counts), a filter bar (direction toggle · "moved ≥ N pts" · "crossed a band" — the last backed by a new `crossedBandOnly` dimension on `SegmentFilter`, `PreviousBandID <> BandID`), and a full-width member list that updates as you tune. The filter IS a segment: **Launch on these** opens the launch panel scoped to the exact cohort on screen (list count == launched count), unifying "what changed" with "who to act on".
- **Engagement Manager:** a **Launch intervention** flow on the filtered triage cohort (in-context panel; preview is a hard gate before commit), a **Launch on droppers** entry in Score Movers (a declarative delta-rule segment — `Delta <= -N` — so "everyone who dropped 5+ since the last run" is a re-evaluable cohort, not a pasted list), and an **Interventions** tab tracking every launched play's treated/fired/held/failed tallies.
- **Outcomes + lift (the payoff):** `OutcomeMeasurer` fills `InterventionOutcome` per assignment — baseline is the member's score history at assignment, outcome is their current score/band movement (climbed a band → `Reactivated`, dropped → `Churned`, else `NoChange`; v1 outcomes are engagement outcomes, business events come later) — and `Sonar: Measure Intervention Outcomes` (seeded both dialects) returns the treatment-vs-control lift summary: mean score movement lift + band-up rate lift. The Interventions tab gets a **Measure** button and a lift readout per play. No control group → null lift, never a fabricated number.
- **Parameterized plays:** `Intervention.ActionParamsJSON` (schema, both dialects) persists the play's params, so autonomous fires now run parameterized actions (`{{member}}` token filled per fire); a Manual launch's params are persisted on create.
- **Delta triggers:** the dispatcher fires delta-rule segments ("dropped N+ this run") on current membership after every recompute — auto-respond to fast decay, no band crossing needed.
- v1 scope notes: outcome types are engagement-based (score/band movement); business outcomes (renewals from domain data) and scheduled triggers land later.
