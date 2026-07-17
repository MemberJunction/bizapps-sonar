---
"@mj-biz-apps/sonar-engine": minor
"@mj-biz-apps/sonar-entities": minor
"@mj-biz-apps/sonar-server": minor
"@mj-biz-apps/sonar-ng": minor
---

Engine v1 feature layer + `Factor.DateField` schema.

Adds the engine capabilities the Sonar app needs on top of the action-factor engine, plus the one v1 schema change:

- **Composite / entity-agnostic anchor keys** — `anchorKey.ts` builds identity on MJ's `CompositeKey` (collision-safe canonical string + type-faithful JSON + per-column values for OPENJSON), so single- AND multi-column-PK anchors both score end-to-end. `resolvePopulation` drops the single-column guard; the set-based factor query stages the population via a temp table instead of an inline `IN (…)` list (kills the ~2100-value ceiling + the string-interpolation workaround); `ScoreWriter` persists `AnchorRecordKeyJSON`.
- **`Factor.DateField`** — new nullable column (migration `V202606241200`) naming the related-entity activity-date column a windowed factor filters on. Frees `TimeWindow.AnchorDateField` to mean only the anchor boundary date; wires `SinceEvent`/`RenewalRelative` windows.
- **Action-output clamping** (`clampToRange`) — an action factor's value is clamped to its declared output range, flagging contract drift.
- **Explainability threading** — a factor's "why" rides `FactorResult.explanation` → contribution → persisted `ScoreFactorContribution.DetailJSON`.
- **Score trend + history persistence** — every recompute writes an immutable `ScoreHistory` snapshot and, when an anchor's band changes, a `ScoreBandTransition` row; the current `Score` also carries `Delta` / `TrendDirection` / `DataCompleteness` vs. the trend-window baseline. This is what backs the Overview trend, per-anchor sparklines, and the "movers" feed. The trend math (delta, direction deadband, baseline reduction, band-change detection) lives in a pure, unit-tested `scoreTrend` module — `ScoreWriter` just does the entity plumbing.

Generated entities/resolvers/forms + the GraphQL schema are regenerated for the DateField column (clean — no intervention/demo entities). The CodeGen SQL (regenerated `vwFactors` view, Factor CRUD procs, FK indexes, and the DateField EntityField metadata) is appended into the migration file per convention. Verified end-to-end: Initial + DateField migrations apply cleanly on a fresh clean-MJ database.
