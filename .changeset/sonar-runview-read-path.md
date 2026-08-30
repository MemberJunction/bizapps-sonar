---
"@mj-biz-apps/sonar-engine": minor
---

Add a RunView-backed read path for declarative factors, behind the existing `IFactorEvaluator` seam.

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
