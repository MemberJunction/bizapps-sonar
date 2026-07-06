# Sonar — Factor-Action Param Schema (constraining the contract)

**Status:** Spec / RFC (2026-06-26). Extends [action-factors.md](action-factors.md) §11–§12. Not yet built.
**Audience:** the implementing agent/engineer.

## 1. Problem

The factor-action contract today **describes** but does not **constrain**. `FactorActionContract`
(`measures`/`reads`/`output`/`cost`/`promptName`) is a self-asserted promise; behavioral params come
from `MJ: Action Params` as untyped strings and render as text boxes. The moment we let an LLM factor
**pick a data source** (the agreed "run sentiment against *this* wired source" — action-factors.md
§11 / the option-2 decision), "trust the action" stops being enough:

- params are untyped → no validation, wrong UI control, operator types entity/column names by hand;
- `reads` is static → it lies the instant the source is configurable;
- nothing structurally stops an action declaring `EntityName`/`Filter` params and rebuilding a
  declarative factor in disguise (the foot-down rule is prose, not enforced);
- `output.{min,max}` is a hint with no teeth — a misbehaving action's value is trusted as-is.

## 2. The fix: one typed param schema, code-declared

Add a typed `params` schema to the contract, sitting beside the existing description fields. **One
schema = the UI control + the validation rule + the structural enforcement.** Mirrors MJ's
`HyperparameterSchema` pattern (typed JSON drives form *and* validation), so it pulls toward core.

[D] **Source of truth = the code contract.** Param kinds/constraints live in the action's
`contract.params` (where `measures`/`reads` already live). The `MJ: Action Params` DB rows remain a
thin shadow so the action is still a runnable MJ Action; the factor builder reads the **contract**
schema. Codegen from contract → DB rows is deferred (§6); hand-maintain the shadow until then.

### 2.1 `FactorParamSpec` — a toolbox, not a shape

[D] **The kinds are an à-la-carte toolbox each action draws from — NOT a required template.** An
action declares *only* the params it actually consumes. Sources are **zero-to-many**; an action with
no data reference (external-API, constant, derived-from-score) declares none. This is the guard
against over-correcting: we made the contract *constrained*, not *rigid*. Different factor shapes:
- text/LLM → 1 source + **several text fields** (+ knobs);
- streak → 1 source + a date field + a number (reads *rows*, not "a column");
- external-API → **no source ref at all** + an API knob;
- multi-entity → **several** source refs.

[D] Define the whole discriminated union now (cheap to *shape*), implement the kinds the first
consumer needs.

```ts
export type FactorParamSpec =
  // --- BUILD NOW (consumer #1 = parameterized sentiment factor) ---
  | { name: string; label?: string; kind: 'wired-source-ref'; required: boolean }
  | { name: string; label?: string; kind: 'source-fields-ref'; sourceParam: string;   // 1..N columns, not one
      columnTypes?: Array<'text'|'date'|'number'>; min?: number; max?: number; required: boolean }
  | { name: string; label?: string; kind: 'number'; min?: number; max?: number; step?: number; required: boolean; default?: number }
  | { name: string; label?: string; kind: 'enum'; values: string[]; required: boolean; default?: string }
  | { name: string; label?: string; kind: 'boolean'; default?: boolean }
  // --- RESERVED (only when a consumer needs it) ---
  | { name: string; label?: string; kind: 'source-text-projection'; sourceParam: string }  // a "{{Title}} — {{Body}}" template over the source's columns
  | { name: string; label?: string; kind: 'string'; maxLen?: number; required: boolean };
```

**The one invariant** (everything else about shape is the action's choice): *if* an action references
data, it does so through `wired-source-ref` — there is deliberately **no `entity-ref-to-anything`
kind**, so the foot-down rule is an unrepresentable state, not a guideline. `source-fields-ref` /
`source-text-projection` reference only the columns of a `wired-source-ref` source (vetted), never
another table.

## 3. The kinds (build-now slice)

Reminder: à la carte — an action declares only the ones it uses. A factor with no data reference
declares none of the source kinds.

### `wired-source-ref` — load-bearing, but optional per-action
Resolves to a **`ModelRelatedEntity`** the model has already wired (reachability + join path vetted
declaratively; `__mj`/`__mj_BizAppsSonar` system schemas already excluded — the entity-picker-scoping
guardrail becomes load-bearing here). Builder control = a dropdown of the model's `factorSources`.
The action receives the **resolved concrete strings** (`entityName`, `memberFKColumn`) as param
values — it never introspects the model at runtime (the engine only hands the action
`AnchorRecordID`/`AsOf`/params; the builder resolves at save time). An action may declare **zero, one,
or several** of these — it is not mandatory.

### `source-fields-ref` — pick **1..N** fields on a source (not one column)
The fields on the source chosen by `sourceParam`. **Multi-select on purpose:** an LLM factor usually
feeds the model several fields together (title + body, plus rating/date for context); one column is
too thin. Builder control = **reuse the declarative builder's source-scoped column picker**
(`aggregateFieldName`), made multi-select and filtered by `columnTypes`. The only new wire is making
the field list depend on the selected `wired-source-ref`. A richer future option is
`source-text-projection` (a `"{{Title}} — {{Body}}"` template over the same vetted columns) — reserved
until a consumer needs composition beyond concatenation.

### `number` / `enum` / `boolean` — cheap scalar knobs
Bounded input / dropdown / checkbox. Validated on save. Include only the ones consumer #1 actually
declares (e.g. a "min reviews" number); don't add an `enum` if nothing is an enum yet.

## 4. Enforcement points (where the contract grows teeth)

1. **Builder (save-time):** validate every param value against its spec; render the right control;
   `wired-source-ref` only offers wired sources; `source-fields-ref` only offers fields on the chosen source. Block save on a missing required / out-of-range value.
2. **Engine (run-time):** before evaluating, validate the resolved param values against the schema
   (fail the factor with a clear message, not a deep crash). **Output clamp:** clamp/validate the
   action's raw value against the Factor's declared `OutputMin`/`OutputMax` before normalization, and
   flag drift if an action repeatedly returns out-of-range. This is the cheapest immediate guardrail
   and catches a misbehaving action regardless of params — it can ship first, on its own.

## 5. `reads` stays honest — template-vague, instance-precise

When the source is a `wired-source-ref`, the **catalog** (un-configured) entry's `reads` reads "the
configured source"; a **configured factor instance** resolves it back to the real name
("reads: Resource Reviews"). Specificity is preserved where an operator actually sees it — only the
template is generic. (A minor, named trade, not a blanket loss.)

## 6. Build sequence

| Build now | Defer until a consumer needs it |
|---|---|
| `wired-source-ref` (structural foot-down + scoping) | **codegen** contract→`MJ: Action Params` — hand-maintain the DB shadow meanwhile; contract drives the builder |
| `source-fields-ref` (reuse declarative column picker — consumer #1 needs the text fields) | `string` kind (no consumer yet) |
| `number`/`enum`/`boolean` (only the ones consumer #1 declares) | richer cross-param validation |
| Engine **output [min,max] clamp** (cheapest guardrail; ships independently) | |

## 7. Sibling task (separate surface — do NOT fold in) — BUILT (2026-06-26)

The `Add Data Source` tool-surface action's `relationshipPath` is a **different param surface** (a
declarative authoring action, not a factor-action contract). `FactorParamSpec` does not touch it. It
needs its **own** typed join-path (a structured `{ fks: string[] }[]` hop list, not a free string) —
same principle ("typed > prose"), separate teeth. Tracked separately so it doesn't ride this schema's
coattails and get forgotten.

**Shipped:** the free-text join path is now a structured picker. `core/entity-graph.ts` gained
`candidatePaths` (enumerate all equal-length FK routes leaf→anchor), `toRelationshipPath` (serialize a
route to the engine's `{ fks: [...] }[]` JSON), and a shared `describePath` (render a route as
`anchor → … → leaf`). The model builder defers an **ambiguous** source (≥2 shortest routes) to a
`pendingSourceTie` tie-picker; `confirmSourcePath` commits the chosen route's `RelationshipPath`. A
single-route source still auto-resolves (no picker). The same `describePath` backs the factor builder's
source tie-picker too, so a route reads identically everywhere. (No demo model currently has an
ambiguous source, so it was verified via the path math on a synthetic graph + injecting a realistic tie
object into the live component — rendered clean in both themes.)

## 8. Data flow (end to end)

```
contract.params (code)  →  Sonar: List Factor Actions (catalog surfaces the schema)
   →  factor builder renders typed controls + validates; resolves wired-source-ref/column-ref to
      concrete strings  →  Factor.ActionParamsJSON.params  →  computeValue via ctx.getParam(name)
   ↘  engine validates param values + clamps output to Factor.OutputMin/Max
```

## 9. Acceptance criteria

- An LLM factor can declare `wired-source-ref` + `source-fields-ref`; the builder offers only the
  model's wired sources and that source.s fields; saving an arbitrary entity/column is
  impossible (not just discouraged).
- `computeValue` reads the resolved source/column via `ctx.getParam`; the action never names a table.
- The engine rejects an out-of-schema param value with a clear message and clamps an out-of-range
  output to `[OutputMin, OutputMax]`, flagging drift.
- A configured sentiment factor's `reads` shows the real source name; the catalog entry shows the
  generic template.
- `npm run check:action-ids` still green; no `any`; engine tests cover the validate + clamp paths.

## 10. Touch points

- `packages/Actions/src/custom/SonarFactorAction.ts` — `FactorParamSpec` union on `FactorActionContract`.
- `packages/Actions/src/custom/SonarReviewSentimentAction.ts` — declare the source/column params; read via `ctx.getParam`; derive `reads`.
- `packages/Actions/src/custom/SonarListFactorActionsAction.ts` — surface `contract.params` in the catalog.
- `packages/Angular/.../factor-builder/` — new param-kind controls (reuse the column picker); save-time validation. ⚠ actively edited by another agent — land after it settles.
- `packages/Engine/src/factors/ActionFactorEvaluator.ts` (+ FactorCompiler) — param validation + output clamp against `Factor.OutputMin/Max`; tests.

## 11. Implementation notes for the builder/contract phase (review feedback)

Captured from sign-off review — these are builder/telemetry concerns, not clamp concerns; the engine
clamp (§4.2) shipped independently of them.

1. **Reactive dependency tree in the builder.** `source-fields-ref` depends on its `sourceParam`.
   Treat the form controls as a tree: changing a parent `wired-source-ref` must **wipe + reset**
   downstream dependent values (and their loading/validation state), so a stale/orphaned field
   selection from the old source can never slip into the save payload.

2. **Focus management on conditionally-injected rows.** Selecting a source dynamically injects the
   field-picker row(s) (label-left/control-right law). The injection must NOT break the native Tab
   order — the next tab stop after choosing a source must land in the newly-revealed field picker,
   not skip past it.

3. **Resolve `reads` early enough for telemetry.** The generic catalog token ("the configured
   source") → real name ("Resource Reviews") resolution must happen early in the run so logs, error
   alerts, and stack traces capture the **resolved** asset name, not the opaque token. A production
   crash needs to show *which* table the factor failed to read. (The engine output-clamp drift log in
   §4.2 already names the factor id; extend the same discipline to the resolved source when the
   source-param work lands.)

## 12. Status

- §4.2 **engine output clamp + drift log: BUILT** (2026-06-26) — `clampToRange` + `ActionFactorSpec.outputMin/Max`, wired in `FactorCompiler.compileActionFactor`, applied in `ActionFactorEvaluator.evaluateBatch` with a per-batch drift summary. Engine 107 tests pass. Decoupled from UI/contract.
- `FactorParamSpec` types + `Sonar: List Factor Actions` surfacing + builder controls: pending the other agent's workspace settling (avoid collision on the actively-edited factor builder), then build in one clean pass.

## 13. Resolved-value serialization (builder ↔ action) — DECIDED

`FactorParamSpec` is builder-facing; the engine's saved `ActionParamsJSON.params` is **scalar-only**
(`parseActionParams` rejects non-scalars). So the builder *resolves* the typed params down to scalar
entries, and the action reads those scalars via `ctx.getParam` (it never sees the model). Convention
for a param named `<n>`:

| Kind | Saved scalar(s) in `ActionParamsJSON.params` | Round-trip key |
|---|---|---|
| `wired-source-ref` | `<n>` = ModelRelatedEntity **ID** (round-trip), `<n>Entity` = resolved entity name, `<n>MemberField` = resolved anchor-FK column | `<n>` (match the wired source by id) |
| `source-fields-ref` | `<n>` = **JSON-array string** of column names, e.g. `'["Review","Title"]'` | `<n>` (parse the array) |
| `number`/`enum`/`boolean`/`string` | `<n>` = the scalar value | `<n>` |

- The builder owns resolution (it has the model's wired sources + their entity/FK metadata via
  `factorSources`); the action stays context-free — it just reads `<n>Entity` / `<n>MemberField` /
  `JSON.parse(<n>)`. This keeps the engine's scalar param contract intact and round-trip simple.
- For consumer #1 (sentiment), `computeValue` reads `sourceEntity` + `memberField` + the `fields`
  array instead of the hardcoded `"Resource Reviews"` / `MemberID` / `Review`.

## 14. Status (updated)

- §4.2 engine output clamp: **BUILT + tested live** (2026-06-26) — `clampToRange`, spec bounds wired
  through `FactorCompiler`, per-batch drift log; verified end-to-end (tightened sentiment bounds →
  every value clamped, drift logged, bounds restored).
- `FactorParamSpec` union + `FactorActionContract.params`: **BUILT** in both the engine-side contract
  (`SonarFactorAction.ts`) and the Angular mirror (`action-catalog.service.ts`); the catalog surfaces
  it via the whole-contract passthrough. Both packages build clean.
- **NEXT (one focused pass, Playwright freed):** builder controls per kind (§3) using the §13
  serialization, the reactive dependency tree + tab-order (§11), save-time validation, then wire the
  sentiment action to declare + read the source param (drop its hardcoded source). Run the visual gate.

## 15. Status (2026-06-26 — slice shipped + verified)

Everything in §14's "NEXT" is **BUILT + visually verified** (light + dark):

- **Typed param controls** in the factor builder (`sonar-factor-builder.component`): a `@switch (p.kind)`
  renders `wired-source-ref` (dropdown of the model's wired sources only), `source-fields-ref` (field
  checkboxes scoped to the chosen source), and `number`/`enum`/`boolean`. Reactive dependency tree
  (§11.1) — changing the parent source wipes dependent field picks. Save gated by `actionConfigValid`.
- **Runtime enforcement = fail loud (§4).** `SonarFactorAction.validateParams` rejects a misconfigured
  factor with a `VALIDATION_ERROR`; `actionRunner` maps that to an `ActionConfigError` the evaluator
  **re-throws** (stops the whole run) instead of degrading to per-anchor no-data. An *un*-configured
  (legacy) factor still falls back to the action's documented defaults. Verified live (invalid config →
  run fails with "'Text source' is required …"; restored → 15/15 score). 108 engine tests pass.
- **Sentiment action wired (§13 serialization).** `SonarReviewSentimentAction` declares `source`
  (wired-source-ref) + `fields` (source-fields-ref) and reads the resolved scalars
  (`sourceEntity`/`sourceMemberField`/`fields`) via `ctx.getParam`, with the old hardcoded
  Resource-Reviews values as the unconfigured fallback. Its `reads` stays the generic template token.
- **Custom-signal builder layout fix.** The action panel now reads top-down **action → contract →
  Configure (source/fields) → Prompt editor → Governance**. The params — the primary "point it at data"
  step — sit directly under the contract, above the tall prompt view/edit/test panel, instead of buried
  below it.
- **Sibling join-path picker (§7): BUILT** (see §7).
