---
"@mj-biz-apps/sonar-engine": minor
---

Convert every Sonar business timestamp column from `datetime2(7)` to `datetimeoffset(7)`, so a stored instant carries its own UTC offset.

`datetime2` is a bare clock reading with no zone. A save → reload → save cycle through the MJ entity layer reinterpreted `ScoreRecomputeRun.StartedAt` as *local* time and rewrote it ~5h shifted, which drove `CompletedAt − StartedAt` negative and displayed negative run durations. MJ's own `__mj_CreatedAt` / `__mj_UpdatedAt` survived the identical cycle untouched precisely because they are already `datetimeoffset` — Sonar's own columns were the odd ones out. PostgreSQL was never affected: its baseline already declares all 13 columns `timestamptz`, so this brings SQL Server to parity rather than introducing something new (hence no PG twin).

This is a robustness upgrade, not a repair. The symptom was already worked around in code — `RecomputeOrchestrator.finishRun` computes the duration from an in-memory `Date` and never trusts the reloaded column. The value here is removing the trap instead of stepping around it, so no future writer can reintroduce the shift.

**13 columns across 7 tables:** `Score.ComputedAt/AsOfDate/NextRecomputeAt`, `ScoreHistory.ComputedAt/AsOfDate`, `ScoreBandTransition.OccurredAt`, `ScoreRecomputeRun.StartedAt/CompletedAt`, `ScoreModelAuditEvent.ChangedAt`, `ScoreModelVersion.PublishedAt`, `ScoreModel.EffectiveFrom/EffectiveTo`, `Factor.LastValidatedAt`.

**No value moves.** Converting `datetime2` → `datetimeoffset` reads each existing value as `+00:00`, which is correct because the stored values already *are* UTC: the engine writes them via `toISOString()` and the old column defaults were `getutcdate()`.

Three dependency classes had to be cleared and restored, and two of them were not obvious:

- **6 DEFAULT constraints**, all `getutcdate()`, all **auto-named** (`DF__Score__ComputedA__2C201BE5`) and therefore different in every database — so they are dropped by lookup, never by hardcoded name. They come back with explicit names and `TODATETIMEOFFSET(SYSUTCDATETIME(), 0)`: same instant, now self-describing, and no longer auto-named for the next migration that touches them.
- **2 non-unique indexes** keyed on a converted column (SQL Server will not retype an indexed column in place). Recreated with identical keys; key sizes stay well under the 1700-byte nonclustered limit.
- Nothing else — no check constraints reference these columns and no view in the schema is `SCHEMABINDING`.

The whole thing runs in one transaction. An earlier non-transactional attempt left the indexes dropped and the columns unconverted when the first `ALTER` hit an undeclared default — precisely the half-applied state a migration must not be able to produce.

`ScoreWriter.sqlLiteral` now emits offset-aware date literals (`…T18:49:07.530+00:00`). It previously chopped the `Z` to suit `datetime2`, which left SQL Server inferring the zone for what was already a UTC instant — the exact inference this conversion exists to eliminate. Its unit test was updated to match.

The migration carries its CodeGen output (regenerated views, CRUD procs, FK indexes, entity-field metadata) per the migration convention. That half is not optional: without it the CRUD procs keep declaring `datetime2` parameters and `__mj.EntityField.Type` stays `datetime2`, so MJ's runtime would still apply `datetime2` conversion semantics to `datetimeoffset` columns and the bug would survive its own fix.

Verified end to end: after applying, zero `datetime2` remains anywhere in the schema — columns, stored-procedure parameters, or MJ entity-field metadata. Existing values are unshifted and run durations stay positive. A full 2,000-member recompute succeeds. And the cycle that caused the original bug — load through the entity layer, touch an unrelated field, save, twice — now leaves `StartedAt` and `CompletedAt` byte-identical. Re-applying the migration is a clean no-op.
