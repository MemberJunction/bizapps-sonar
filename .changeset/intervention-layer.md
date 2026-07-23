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
- **Engagement Manager:** a **Launch intervention** flow on the filtered triage cohort (in-context panel; preview is a hard gate before commit), a **Launch on droppers** entry in Score Movers (a declarative delta-rule segment — `Delta <= -N` — so "everyone who dropped 5+ since the last run" is a re-evaluable cohort, not a pasted list), and an **Interventions** tab tracking every launched play's treated/fired/held/failed tallies.
- v1 scope notes: `OnEnterSegment` matches band-entry only; autonomous fires pass no action params (a persisted params column is a flagged follow-up); outcome measurement + lift math land next.
