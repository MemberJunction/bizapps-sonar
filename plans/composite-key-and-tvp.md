# Deferred: entity-agnostic / composite anchor keys (`CompositeKey`) + the TVP swap

**Status:** deferred, defined task. v1 keeps the **single-column-PK rejection guard**
(`RecomputeOrchestrator.resolvePopulation` throws on `PrimaryKeys.length !== 1`). This file records
the gap so "single-column PK only" is an *acknowledged* limitation, not a silent one — it's currently
absent from the engine's "what it can't do yet" notes.

**Why a separate doc:** this branch has no `roadmap.md` (that lives on `sonar_app_nav`); this travels
with the engine PR. Fold it into `roadmap.md` when the branches reconcile.

## The gap (engine vs. the designed-in plan/schema)

The plan + schema were built for **any** anchor primary-key shape — single UUID, single int (e.g. a
CDP table), or **composite (multi-column)**. The engine narrowed that to a single scalar string and
assumes UUIDs.

- **Plan §5 (Score):** `AnchorRecordID nvarchar(100)` — "PK value of the scored record (string *to be
  entity-agnostic*)"; `AnchorRecordKeyJSON nvarchar(max)` — "nullable; *for composite keys*".
- **Schema** (`V202606121005__…_Initial_Schema.sql`, Score table): both columns exist
  (`AnchorRecordID NVARCHAR(100) NOT NULL`, `AnchorRecordKeyJSON NVARCHAR(MAX) NULL`), with CodeGen'd
  EntityField metadata + `spUpdateScore` params.

So the data model deliberately (a) made `AnchorRecordID` a string to hold int/string/UUID values, and
(b) provisioned `AnchorRecordKeyJSON` for composites. The engine keys on a scalar string, assumes
UUIDs, and **never writes `AnchorRecordKeyJSON`**.

## The fix: adopt MJ's `CompositeKey`

MJ ships `CompositeKey` (a list of `{ FieldName, Value }` pairs + canonical string serialization) as
the platform's standard record-identity type — built so features don't bake in the single-scalar
assumption. It maps onto the two columns:
- serialized canonical string → `AnchorRecordID` (map keys, the population list);
- structured form (JSON) → `AnchorRecordKeyJSON`.

## Scope — 5 seams (tagged in code review)

1. **Identity type** — thread `CompositeKey` (serialized to its canonical string for map keys) through
   the `FactorResult` maps, `ScoringEngine.collectAnchorIds`, and `ScoreWriter`, instead of a bare
   `string`.
2. **Population resolution** (`RecomputeOrchestrator.resolvePopulation`) — build a `CompositeKey` from
   **all** `anchorEntity.PrimaryKeys` per row (not `PrimaryKeys[0]`); **drop the single-column guard**.
   Also fixes the dishonest `RunView<Record<string,string>>` typing for non-UUID/int PKs.
3. **Related-entity FK** (`FactorCompiler.resolveAnchorKeyColumn`) — a composite anchor is referenced
   by a **multi-column** FK. Resolve the full set of FK fields → anchor PK columns (via MJ FK metadata,
   e.g. `RelatedEntityFieldName`) and feed that column-pair mapping into seam 4. (Today's `!== 1` throw
   is the interim guard.)
4. **The set-based query** (`factorSql.buildFactorSql`) — scalar `[key] IN ('a','b',…)` can't express
   a multi-column key (SQL Server has no row-value-constructor `IN`). Stage the population's key tuples
   into a **temp table / TVP** and `JOIN` the related table on all key columns with a multi-column
   `GROUP BY`. **This IS the already-TODO'd TVP swap** — do them together.
5. **Persistence** (`ScoreWriter`) — populate `AnchorRecordKeyJSON` (+ the serialized `AnchorRecordID`)
   so write-back / drill-through can round-trip the key.

## Why bundle with the TVP swap

Seam 4 *is* the TVP migration. Doing composite-key support as part of it kills three birds at once:
- the inline `IN (…)` **~2100-parameter / statement-size ceiling** at large populations,
- the **string-interpolation/injection** workaround on the anchor-ID list (currently escaped as a
  band-aid),
- the **single-column restriction**.

Seams 3–4 are the bulk of the work and share that migration — sequence them as one task, not two passes.

## Acceptance criteria

- An **int-PK anchor** (e.g. a CDP table) scores end-to-end.
- A **2-column-PK anchor** scores end-to-end.
- `AnchorRecordKeyJSON` is populated on persisted `Score` rows.
- A **round-trip test** through `ScoreWriter` → reload recovers the original key.

## References

- Code-review seams: `RecomputeOrchestrator.resolvePopulation` (1, 2), `factorSql.buildFactorSql` (4),
  `FactorCompiler.resolveAnchorKeyColumn` (3).
- Related deferred item: the version-snapshot read (compute from `ConfigSnapshotJSON` rather than live
  config) — separate concern, also in the engine changeset's follow-ups.
