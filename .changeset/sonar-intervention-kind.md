---
"@mj-biz-apps/sonar-engine": minor
"@mj-biz-apps/sonar-actions": minor
"@mj-biz-apps/sonar-ng": minor
---

Split an intervention's *execution* from its *measurement*, and retire the fake worklist play.

Every intervention previously had to point at an MJ Action, because `Intervention.ActionID` was NOT NULL. That forced a play to exist even when there was nothing to fire, which is how the no-op "Add to Worklist" action came about: it wrote a row, called nothing, and existed only to satisfy the column. That in turn grew an in-Sonar worklist UI, which is a small CRM Sonar has no business owning (MJ Tasks already does it).

`Intervention.Kind` makes the distinction explicit and `ActionID` becomes nullable:

- **`Action`** — fire a play (the MJ Action in `ActionID`) once per treated member. `ActionID` required.
- **`TrackOnly`** — fire nothing. Sonar still resolves the cohort, splits treatment/control on the deterministic holdout, and measures lift on a treatment that happened *outside* the system (a call campaign, an event, a mailing). This is the case the old shape couldn't express at all.
- **`BulkSync`** — reserved: push the set to another platform.

The invariant that matters is unchanged and now applies to both kinds: cohort, holdout split, and intent-to-treat measurement. Only "how you act" varies, which is the whole point of the re-anchored plan (`plans/intervention-layer.md`) — Sonar decides who/why/when and measures the lift; MJ executes.

The launch panel gains a kind toggle ("Fire a play" / "Track only"), the play picker only appears for `Action`, and counts read honestly per kind ("Would treat" vs "Would track", "Fired N" vs "Tracking N"). The worklist drill-in and its service methods are gone, and the `Sonar: Add to Worklist` action is deleted from the codebase.

The migration disables that action rather than deleting its row: it may already carry `ActionExecutionLog` history, and a hard delete violates `FK_ActionExecutionLog_Action` on any database where it was ever fired. The class and metadata are gone, so the disabled row is inert and drops out of the picker. Interventions that pointed at it are neutralized to `TrackOnly` with a null `ActionID`, which is exactly what they always were.
