# Remote Operations in Sonar

What MJ Remote Operations is, how Sonar already uses it, and which of Sonar's server calls should move to it next. Written at handoff (July 2026), grounded in MJ **5.45+** (`@memberjunction/core`'s `BaseRemotableOperation`) and Sonar's one live operation.

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

1. **Intervention commit** (`Sonar: Run Intervention`, Kind=`Action`) — the strongest case. **Note the sequencing: this is the code in PR #46**, so the conversion is actionable the moment #46 lands and pointless before it (you would be converting a moving target). Read #46 first. A commit fires the play per treated member *sequentially inside one Action call*; with an LLM play like Draft Outreach that's seconds-per-member, which is why the demo caps at ~15. As `Sonar.RunIntervention` (LongRunning): per-member progress ("drafted 12 of 40"), a much higher safe cap, and no zombie half-committed runs on a dropped connection — idempotency already makes resume safe (existing assignments/proposals are skipped). Keep the Action for the governance gate and agent surface; move the long loop behind the operation, exactly the recompute pattern.
2. **Outcome measurement** (`Sonar: Measure Intervention Outcomes`) — same shape at scale: per-assignment reads that will outgrow one request on real cohort sizes. Low urgency at demo scale.
3. **Bulk email** (`Sonar: Email Cohort`) — only once a real provider key exists and real sends begin; a `detached` send with pollable status is the natural form for "hand 500 messages to SendGrid".

**Not** candidates: `Preview Segment` / `Explain Scores` (fast reads — Sync-shaped, and the Action form is fine), and anything an agent calls as a tool (agents consume ActionParam contracts).

## If you add one, the checklist

Copy the recompute pattern end-to-end — it is the worked example:

1. Class in `packages/Actions/src/custom/`, exported from `custom/index.ts` (so bootstrap registers it).
2. `MJ: Remote Operations` metadata row: **forward migration + PG twin + `metadata/` mirror** (never edit applied migrations; PG resolves entity FKs by Name).
3. A `RequiredScope` per operation (`sonar:<verb>`), matching how `sonar:recompute` gates today.
4. Client calls through the provider (see how the Model Builder invokes recompute), choosing `attached` for button-with-progress UX, `detached` + status sibling for fire-and-check.
5. `emitProgress` at a human cadence (per member / per chunk), not per row.
6. API restart to pick up the registration — same as Actions.

## Caveats known at handoff

- Prior research (PR #11 evaluation) confirmed Remote Ops works at MJ 5.45 without a platform bump, and that it fixes the recompute hang — but it does **not** fix row-by-row write performance; that's ScoreWriter's set-based SQL territory, a separate concern.
- The metadata gate means an operation that "isn't found" is usually a Status/scope/registration problem, not a code problem — check the `MJ: Remote Operations` row and that the server actually imported the class (same failure smell as "Unknown type …Input" for unloaded action packages).
