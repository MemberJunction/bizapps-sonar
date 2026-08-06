# Remote Operations in Sonar

What MJ Remote Operations is, how Sonar already uses it, and which of Sonar's server calls should move to it next. Grounded in MJ **5.45+** (`@memberjunction/core`'s `BaseRemotableOperation`) and Sonar's one live operation.

> **Scope note.** This describes what is on this branch. The ranked conversion candidates below deliberately
> stay generic, because the strongest ones sit in the selection/intervention layer, which lands separately.

## The framework, in short

A Remote Operation is a provider-routed server operation with a stable key, resolved through MJ metadata rather than GraphQL codegen:

- **Contract:** subclass `BaseRemotableOperation<TInput, TOutput>`, declare `OperationKey`, `ExecutionMode: 'Sync' | 'LongRunning'`, optional `RequiredScope`. Register with `@RegisterClass(BaseRemotableOperation, "<key>")`; a `MJ: Remote Operations` metadata row (Status gate + scope gate) makes it callable.
- **`LongRunning`** is the point: the operation gets `context.emitProgress(...)`, and the caller chooses how to consume it — **`attached`** (promise pends; progress streams to `onProgress`) or **`detached`** (returns a handle immediately; completion arrives out-of-band; status is pollable via a sibling status operation).
- **Why it beats an Action for long work:** an Action invocation is one GraphQL request — no progress channel, and a promise that can hang forever if the API dies mid-run. This is not hypothetical; it is exactly why recompute was converted (the "recompute hang").

What Actions still do better: appear in the launch-panel play picker, carry ActionParam/ResultCode metadata that agents read as a tool contract, and flow through the fire-time governance gate. **Rule of thumb: plays and agent tools are Actions; long machine work with progress is a Remote Operation.** The two can wrap the same engine code — recompute has both faces today.

## What Sonar runs on it today

**`Sonar.RecomputeModel`** — `packages/Actions/src/custom/SonarRecomputeModelOperation.ts` (lives in the Actions package deliberately: it shares the `RecomputeOrchestrator` dependency and rides the same side-effect import that fires `@RegisterClass` at server bootstrap).

- `ExecutionMode: 'LongRunning'`, `RequiredScope: 'sonar:recompute'`.
- Streams per-member progress ("scored N of M") to the recompute button instead of a dead spinner, and returns a result object rather than a hangable promise.
- Wraps the *same* `RecomputeOrchestrator.recompute()` as the Action path — one engine, two transports.
- Seeded via forward migration + `metadata/` mirror (dual-sourced, like Actions).

## Conversion candidates, in order

1. **Any play that fires per member inside one Action call** — the strongest case, and the shape to watch for.
   A per-member loop runs *sequentially inside a single Action invocation*; with an LLM-backed play that is
   seconds per member, which forces an artificially low cap. Converted to `LongRunning`, the same loop gets
   per-member progress ("drafted 12 of 40"), a far higher safe cap, and no zombie half-finished run when a
   connection drops. Keep the Action for the governance gate and the agent tool surface; move the long loop
   behind the operation. Exactly the recompute pattern. **Convert after the code settles, not during** —
   converting a moving target wastes the work twice.
2. **Bulk measurement reads** — same shape at scale: per-record reads that outgrow one request on real
   population sizes. Low urgency at demo scale.
3. **Bulk outbound messaging** — only once a real provider key exists and real sends begin. A `detached`
   send with pollable status is the natural form for "hand 500 messages to a provider".

**Not** candidates: fast reads (Sync-shaped, and the Action form is fine), and anything an agent calls as a
tool, since agents consume ActionParam contracts.

## If you add one, the checklist

Copy the recompute pattern end-to-end — it is the worked example:

1. Class in `packages/Actions/src/custom/`, exported from `custom/index.ts` (so bootstrap registers it).
2. `MJ: Remote Operations` metadata row: **forward migration + PG twin + `metadata/` mirror** (never edit applied migrations; PG resolves entity FKs by Name).
3. A `RequiredScope` per operation (`sonar:<verb>`), matching how `sonar:recompute` gates today.
4. Client calls through the provider (see how the Model Builder invokes recompute), choosing `attached` for button-with-progress UX, `detached` + status sibling for fire-and-check.
5. `emitProgress` at a human cadence (per member / per chunk), not per row.
6. API restart to pick up the registration — same as Actions.

## Caveats known at handoff

- Prior research confirmed Remote Ops works at MJ 5.45 without a platform bump, and that it fixes the
  recompute hang. It does **not** fix row-by-row write performance; that is `ScoreWriter`'s set-based SQL
  territory, a separate concern.
- The metadata gate means an operation that "isn't found" is usually a Status/scope/registration problem, not a code problem — check the `MJ: Remote Operations` row and that the server actually imported the class (same failure smell as "Unknown type …Input" for unloaded action packages).
