---
"@mj-biz-apps/sonar-engine": minor
---

Persist recompute runs through Record Set Processing instead of hand-written SQL.

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
