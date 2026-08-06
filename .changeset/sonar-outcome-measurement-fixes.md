---
"@mj-biz-apps/sonar-engine": patch
---

Fix intervention outcomes never persisting, and fix date comparison in outcome definitions.

**Outcome writes failed silently.** MJ's entity layer sizes a `@ResultTable` from the entity metadata
field list, then runs `INSERT INTO @ResultTable EXEC spCreate…`, and the procedure returns a row from the
base view. `Intervention Outcomes` and `Intervention Proposals` both had base views one column wider than
their registered metadata, so every write died on "Column name or number of supplied values does not match
table definition". Nobody noticed because `OutcomeMeasurer.writeOutcome` ignored the boolean `Save()`
returns and its caller counted the attempt anyway: `Sonar: Measure Intervention Outcomes` reported
"Measured 100 outcome(s)" against a table holding zero rows, and lift computed as 0.0 either way.

`writeOutcome` now returns whether the row actually persisted, logs the failure, drops it from the lift
aggregation, and `MeasureResult` gained `writeFailures` so a caller can tell a measurement from a failed
run. Migration `V202608041000` registers the two missing fields and aligns the view.

The two entities drifted in opposite directions, which is what made this hard to diagnose: the shipped
migration and a codegen'd developer database each looked correct from the other's point of view. A fresh
install could never persist a drafted proposal; a developer database could never persist an outcome.

**`AnchorField` outcome definitions could not compare dates.** `compareOp` tried numeric, then fell back
to string. A `Date` stringifies as `"Sat Aug 01 2026 …"`, so `LastActivityDate >= '2026-08-01'` compared
`"S"` against `"2"` and returned **true for every date that has ever existed**, reporting success for the
entire population in the code that decides whether an intervention worked. Dates are now compared on the
actual instant, with a strict `YYYY-MM-DD` guard so a bare number is not misread as a year.

Two comparisons are now explicitly unanswerable and return false for every operator, rather than guessing:
a `null`/`undefined` field value (previously `Status != 'Active'` counted every member with no status as a
success) and a date against a non-date literal. Both follow the rule that unknown never matches.

INSTALL.md now carries the query that detects this class of failure across every Sonar entity. Nothing runs
it automatically, so it belongs in a release checklist.
