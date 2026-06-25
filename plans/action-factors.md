# Sonar — Action-Backed Factors (engine harness)

**Audience:** an LLM (or engineer) picking up Action-backed factor work. Self-contained context +
decisions for the harness built in `packages/Engine`. Pairs with `engine.md` (declarative factors),
`roadmap.md` (status/backlog), `plan.md` §5.2/§7.2 (spec).

**Status (2026-06-23):** harness built, builds clean, 78/78 engine tests pass. **Uncommitted.** No
real Action bound yet (the "example" — see §8). Runs server-side (MJAPI :4102), invoked via the
existing `Sonar: Recompute Model` / `Sonar: Validate Factor` MJ Actions like the rest of the engine.

---

## 1. What an Action-backed factor IS

A factor produces, per anchor record (e.g. a member), **one number**. Declarative factors do this
with set-based SQL. An **Action-backed factor** produces the number by running an **MJ Action**
(arbitrary code) instead. It satisfies the SAME `IFactorEvaluator` contract, so scoring /
normalization / explainability never branch on factor kind.

**The dividing line is NOT "deterministic vs not" — it is "expressible as set-based SQL or not".**
Three tiers:

1. **SQL can express it** (count/sum/recency/trend, incl. multi-hop joins) → **declarative**. NOT an
   action factor. (Multi-hop + the roadmapped `Recency`/`TrendSlope`/`RatePerPeriod`/`Exists`
   aggregations keep shrinking what needs the escape hatch.)
2. **Deterministic but SQL can't express it** (e.g. longest consecutive-month streak, Gini, custom
   decay) → cheap Action, no external calls. **Best first example** (proves the seam without LLM cost
   and is durable — declarative won't absorb it).
3. **Needs the outside world / AI** (external model API, NLP sentiment) → expensive Action. Needs the
   cost machinery (see deferred items) + (eventually) the LLM-cost research.

One-line definition: *an Action-backed factor's value is produced by custom code (an MJ Action)
instead of SQL — used only when SQL can't express the signal.*

---

## 2. Schema (already exists on the `Factor` entity — no migration needed)

`packages/Entities` generated `mjBizAppsSonarFactorEntity` exposes:

- `FactorType: 'Declarative' | 'ActionBacked' | 'DerivedFromScore' | 'Constant'`
- `ActionID: string | null` — the MJ Action to run.
- `ActionParamsJSON: string | null` — the I/O contract + static params (see §3).
- `ExecutionMode: 'PerRecord' | 'Batch' | null` — only `PerRecord` implemented.
- `IsExpensive: boolean`, `MaxConcurrency: number | null`, `RateLimitPerMinute: number | null`,
  `CacheTTLSeconds: number | null` — cost knobs (only `MaxConcurrency` honored so far).
- `PromotionState: 'Draft' | 'InReview' | 'Approved' | 'Deprecated' | null` — governance gate.

Normalization/scoring fields (`OutputMin/Max`, `HigherIsBetter`, `NormalizationMethod`, weight, etc.)
work identically to declarative factors — the action just supplies the raw value.

---

## 3. The I/O contract (how code and factor talk)

The engine ↔ Action handshake is **convention + override**, parsed from `ActionParamsJSON` by
`parseActionParams` (`packages/Engine/src/factors/ActionFactorEvaluator.ts`):

```jsonc
// all optional; this is the FULL shape
{
  "anchorParam": "AnchorRecordID",   // input the engine sets to the anchor record id (default "AnchorRecordID")
  "outputParam": "Value",            // output the engine reads the number from (default "Value")
  "params": { "model": "haiku", "threshold": 0.5 }  // static inputs passed on every call (string|number|boolean)
}
```

- Empty / `{}` / null → all defaults (`AnchorRecordID` in, `Value` out, no static params).
- The engine ALSO always passes an input param named **`AsOf`** (a `Date`) so time-aware actions can
  bound their computation to the recompute's as-of instant.
- The Action returns its number in the `outputParam` output. Non-numeric / absent / non-finite →
  treated as `null` = "no data" for that anchor.
- Malformed `ActionParamsJSON` THROWS (bad JSON, non-object, `params` not an object, non-scalar
  value) — never silently mis-binds.

Example: a sentiment Action whose input is `MemberID` and output is `Sentiment` →
`ActionParamsJSON = {"anchorParam":"MemberID","outputParam":"Sentiment"}`.

---

## 4. Execution model

- **PerRecord only.** MJ's `ActionEngineServer.RunAction` is single-invocation (one call = one action
  run; no batch API). Scoring N anchors = N calls. `Batch` mode throws "not supported yet".
- **Bounded concurrency.** A fixed worker pool of `min(MaxConcurrency, N)` (default 8) pulls anchors
  off a shared cursor (`next++`, safe in single-threaded JS — no `await` between read and increment).
  Prevents hammering an LLM/external endpoint.
- **Per-record error isolation.** A throw from the Action for ONE anchor → that anchor becomes
  no-data (`null`), run continues. Systemic failures (Action missing, not Approved, bad config) throw
  and stop the run.
- **Only-data entries.** The result `Map` gets an entry ONLY for anchors with a non-null value. An
  absent anchor = "no data", handled downstream by the model's `MissingDataPolicy` — identical
  convention to the declarative evaluator (whose SQL only returns rows for members with data). A real
  `0` is data (`!== null`), preserved distinct from "couldn't compute".

---

## 5. Governance gate

In `RecomputeOrchestrator.buildWeightedFactors` (the rubric loop used by recompute AND
`computeScores`): an `ActionBacked` factor with `PromotionState !== 'Approved'` THROWS before
compiling. So **real scores require Approved code; drafts are still previewable** (the draft-preview
path, `previewFactor`, builds a transient factor and bypasses this loop). The gate lives in the
orchestrator (a scoring *policy*), not the compiler (which just builds evaluators). The full
`ActionPromotion` table (plan §5.5) is deferred; this uses the `Factor.PromotionState` field directly.

---

## 6. File map (`packages/Engine/src`)

| File | Role | Imports MJ Actions? |
|---|---|---|
| `factors/ActionFactorEvaluator.ts` | **Pure brain.** `ActionFactorSpec`, `ActionParamValue`, `ActionRunResult`, `ActionRunner` type, `parseActionParams`, `ActionFactorEvaluator` (concurrency pool, error isolation, value mapping). No I/O. | **No** |
| `factors/actionRunner.ts` | **The I/O.** `createActionRunner()` → an `ActionRunner` that wraps `ActionEngineServer.Instance` (lazy `.Config()`, `Actions.find(ID)`, assembles `ActionParam[]`, `RunAction`, reads `outputParam`, coerces to `number | null`). | **Yes** (`@memberjunction/actions`, `@memberjunction/actions-base`) |
| `factors/FactorCompiler.ts` | Dispatcher. `assertSupported` allows `Declarative`+`ActionBacked`; `compile()` branches to `compileActionFactor`; **`ActionRunner` injected via constructor** (so this module's graph stays free of the heavy Actions import). | No (runner injected) |
| `orchestration/RecomputeOrchestrator.ts` | Constructs `new FactorCompiler(createActionRunner())`; enforces the promotion gate. | via actionRunner import |
| `__tests__/actionFactor.test.ts` | 8 tests, stub runner (no DB/Action engine): parseActionParams (defaults/overrides/4 throw cases), value mapping, null→omitted, error→omitted, concurrency-cap, empty input. | No |
| `index.ts` | exports `ActionFactorEvaluator` + `actionRunner` modules. | — |
| `package.json` | adds `@memberjunction/actions` + `@memberjunction/actions-base` peer deps `^5.40.2`. | — |

**MJ Action execution API** (confirmed in `node_modules/@memberjunction/actions@5.40.2`):
`ActionEngineServer.Instance` (singleton) → `await .Config(forceRefresh?, contextUser?)` →
`.Actions: MJActionEntityExtended[]` (find by `.ID`) → `await .RunAction({ Action, ContextUser,
Params: ActionParam[], Filters: [] }): Promise<ActionResult>`. `ActionParam = { Name: string; Value:
any; Type: 'Input'|'Output'|'Both' }`. `ActionResult = { Success: boolean; Message?: string; Params?:
ActionParam[]; ... }` — read outputs from `result.Params`.

---

## 7. Key decisions & rationale

1. **Reuse `IFactorEvaluator`, add a second impl.** The escape hatch was a planned seam; adding action
   factors touched the engine's *edges* (new evaluator + one compiler branch + one gate), not the
   scoring/normalization core. Sign the abstraction holds.
2. **Pure/IO split + injected `ActionRunner`.** All logic in `ActionFactorEvaluator` (testable with a
   stub); all I/O in `actionRunner`. `FactorCompiler` takes the runner via constructor so importing it
   (e.g. in path-finding tests) doesn't drag `@memberjunction/actions` into the test graph. Only
   `RecomputeOrchestrator` (server runtime) wires the real runner.
3. **Convention + override I/O contract.** Defaults (`AnchorRecordID`/`Value`) work out-of-the-box for
   Sonar-authored actions; `ActionParamsJSON` overrides for pre-existing actions with different param
   names. Validated/throws on malformed config.
4. **PerRecord + concurrency only (cost knobs).** `MaxConcurrency` honored (default 8). Deferred:
   `CacheTTLSeconds` (cross-run caching needs a persistence store; in-run memo is near-useless since
   each anchor appears once), `RateLimitPerMinute`, `Batch`, `IsExpensive` budgeting.
5. **Error → no-data, not run-killer.** Per-record graceful degradation; systemic failures fail loud.
6. **Only-data map entries.** Parity with the declarative evaluator so `MissingDataPolicy` behaves
   identically regardless of factor kind.
7. **Gate in orchestrator, keyed on `PromotionState`.** Real scoring requires `Approved`; preview
   allows drafts. Lightweight; full `ActionPromotion` table deferred.

---

## 8. The example (next step — NOT built)

Prove end-to-end with the **tier-2** signal: a code-based MJ Action **"Member Activity Streak"**
(longest run of consecutive active months for a member — deterministic, DB-only, non-declarable),
then bind it as an `ActionBacked` factor on the cheese (`AssociationDemo`) model and recompute.

Constraints to respect:
- **Migrations are paused** (prototype) — register the Action via metadata-sync / CodeGen or a
  hardcoded-UUID seed, NOT a schema migration. Scope to whatever avoids a migration.
- The Action must follow the I/O contract: read `AnchorRecordID` (+ `AsOf`), write the number to
  `Value` (or set `outputParam`). It runs server-side and can query via the MJ data provider.
- After binding: set `Factor.FactorType='ActionBacked'`, `ActionID`, `PromotionState='Approved'`
  (else the gate blocks recompute), optionally `MaxConcurrency`.
- Rebuild Engine + **restart MJAPI (:4102)** so the running server loads the new engine/action.

---

## 9. How to extend (future)

- **Batch mode:** define a contract for passing the anchor-id set into one Action call and reading a
  per-anchor map back; add a `BatchActionRunner` + branch in the evaluator. Needed for actions that
  natively bulk-process (one external call for many members).
- **Cross-run cache (`CacheTTLSeconds`):** persist `(anchorId, asOf, paramsHash) → value`; skip
  re-running for unchanged inputs. Biggest win for LLM/expensive actions on repeat recomputes.
- **Rate limiting (`RateLimitPerMinute`):** token-bucket in the runner for external-API quotas.
- **ActionSmith/Codesmith authoring (plan §7.3, Phase 2):** today the user binds an EXISTING Approved
  Action. Later, ActionSmith (meta-agent) turns a natural-language description into a tested Runtime
  Action (Codesmith writes the sandboxed JS); human approval (this same gate) precedes use. ActionSmith
  automates *creating* the code; it does not skip approval.

---

## 10. Gotchas

- Two-port dev loop: engine changes need **Engine rebuild + MJAPI (:4102) restart**; UI changes need
  **Angular rebuild + Explorer (:4302) restart**. A stale MJAPI yields the old single-hop/no-auto
  behavior (e.g. "expected exactly one foreign key … found 0").
- The UI factor-source picker already offers reachable sources (`reachableFromAnchor`); Action factors
  aren't a "source entity" pick — they bind an Action, which the current builder UI does not yet author
  (engine-only today; binding is done via data until a builder surface exists).
- No `any`: the runner reads MJ's `ActionParam.Value` (typed `any`) into `unknown` then coerces.

---

## 11. The parameterization rule + UI surface (decided 2026-06-23)

**The foot-down rule.** An action factor is a **named, opinionated signal**, NOT a configurable query
builder. The line is the same one that defines the escape hatch: *"where to read data" (entity /
column / window / filter) is **declarative's** job; "custom logic SQL can't express" is the
**action's** job.* Therefore:

> An action factor takes the engine's fixed contract (`AnchorRecordID`, `AsOf`) plus **only
> behavioral params** — knobs that change *how it computes* (decay half-life, LLM model name,
> threshold), **never** *where it reads* (`ActivityEntity` / `MemberField` / `DateField`).
>
> **The tell:** if an action's params are mostly "point me at this table/column," it isn't really
> custom — it's a declarative factor in disguise. Make it declarative (or add the missing
> aggregation) instead.

**Known deviation to fix:** `SonarMemberActivityStreak` (§8) currently exposes
`ActivityEntity`/`MemberField`/`DateField` data-source params — a violation of the rule. They're
*temporarily useful* for the first live test (bind to the real AssociationDemo entity without
knowing its MJ name in code), but the action should be **re-cast source-specific** (drop those
params; hardcode the source; rename to match, e.g. "Event Engagement Streak") once tested — OR
swapped for a truly-custom first example (LLM sentiment), which wouldn't tempt data-source params at
all. Streak is borderline tier-2 (a single-entity consecutive-period count arguably wants to be a
declarative aggregation eventually), so it's an imperfect exemplar of the rule.

**Two conventions that make the UI trivial:**
1. **Identify factor-actions** so only they populate the builder catalog. Either a dedicated Action
   **category** (`"Sonar: Factor Actions"`) or, simpler (no new metadata record), detect the
   contract: an action that declares an `AnchorRecordID` input + a `Value` output IS a factor-action.
2. **Standardize the contract param names** — every factor-action uses `AnchorRecordID` (in), `AsOf`
   (in), `Value` (out). The builder hides those three; the *rest* of the declared params are the
   config form. (The engine's per-factor `anchorParam`/`outputParam` override stays as an escape
   hatch for binding pre-existing third-party actions — not the everyday path.)

**UI surface (for the rebuild to target).** Adding a factor forks into two modes:
- **Measure from data** = today's declarative builder (entity → aggregation → field → window).
- **Custom signal (action)** = (a) pick a factor-action from the catalog; (b) a param form
  **generated from the action's `MJ: Action Params` metadata** (each non-injected input → a labeled
  field, `Description` = help, `IsRequired` enforced; values saved to `Factor.ActionParamsJSON.params`);
  (c) the shared tail — direction / normalization / weight, identical to declarative.

  **Crucially, action mode has NO entity/aggregation/window pickers** — their absence *is* the rule
  made visible. The action's own param metadata is the form schema, so "it's all custom" never means
  "I can't build a form."

**Governance in the UI:** show `PromotionState` as a badge; a `Draft` action is selectable for
preview/simulate but blocks publish/recompute (mirrors the engine gate, §5). Catalog defaults to
Approved-only with a "show drafts" toggle for authors.

---

## 12. The factor-action interface (`SonarFactorAction`) — decided 2026-06-24

**Why.** Until now a factor-action was just a naming convention (`AnchorRecordID` in, `Value` out)
that each action re-implemented by hand. Nothing forced an action to say *what it is* — so in the
builder it read as a black box: raw param names, no sense of what it measures, reads, or produces.
The fix is a real interface every factor-action implements, with a **mandatory self-description**.

**The base class.** `packages/Actions/src/custom/SonarFactorAction.ts` — abstract, extends MJ's
`BaseAction`. It owns the plumbing (input parse/validate, output write, error→fail mapping) so no
action drifts from the contract. A subclass implements exactly **two** members:

```ts
abstract class SonarFactorAction extends BaseAction {
  abstract readonly contract: FactorActionContract;                       // DESCRIBE
  protected abstract computeValue(ctx: FactorComputeContext):             // COMPUTE
    Promise<FactorValue | number | null>;
}
```

Three slots:

1. **Describe** — `contract` (mandatory): `measures` (one sentence), `reads` (entities it touches),
   `output` (`unit`/`min`/`max`/`higherIsBetter`/`sample`), `cost` (`deterministic`/`externalCalls`/
   `expensive`). This is what the builder's "What this signal does" panel renders. **No contract →
   not a valid factor-action → not in the catalog.** The interface *enforces* transparency.
   - `reads` is the honest flip-side of the foot-down rule (§11): the author doesn't *choose* the
     source, but is *told* what it is. Hidden, not secret.
2. **Inputs** — the base always provides `AnchorRecordID` + `AsOf` (parsed/validated). Any other
   declared params are **behavioral** config only (§11 foot-down rule); `ctx.getParam(name)` reads them.
3. **Output** — `computeValue` returns a `FactorValue = { value: number｜null; explanation?: string }`
   (a bare `number｜null` is accepted and normalized). The base writes the `Value` output param the
   engine reads, plus an optional `Explanation` param. `value: null` = "no data" (MissingDataPolicy
   handles it, same as a declarative factor with no row).

**Key decisions:**
- **Output is object-shaped (`{value, explanation}`)** even though only `value` is filled at first.
  The black-box problem isn't only at authoring time — at *scoring* time a bare number can't explain
  *why*. `explanation` flows into the explainability waterfall so an action factor is legible there too.
- **Contract reaches the UI via a server describe-endpoint** (`Sonar: List Factor Actions`, step 4),
  which enumerates registered `SonarFactorAction` subclasses and returns their contracts. Code is the
  single source of truth; **no migration**; the catalog stops reverse-engineering the contract from
  `MJ: Action Params` rows. (A metadata table is the eventual clean home — roadmap when migrations
  resume.)
- **Contract is mandatory** — guarantees no black boxes ever reach the catalog.

**Build sequence (status 2026-06-24):**
1. ✅ `SonarFactorAction` base + types (`FactorValue`, `FactorActionContract`, `FactorComputeContext`) — builds clean.
2. ✅ Engine carries `explanation`: `actionRunner` reads the optional `Explanation` output (falls back to a value trace) → `FactorResult.explanation` (already wired through to the score). 81/81 engine tests pass.
3. ✅ Re-cast `SonarMemberActivityStreak` onto the base: declares `contract`, implements `computeValue`, and **drops the ActivityEntity/MemberField/DateField data-source params** (source now baked in — §11's "known deviation" is fixed). Reference implementation.
4. ✅ `Sonar: List Factor Actions` describe-endpoint (`SonarListFactorActionsAction`): subclasses self-register via `registerFactorAction` (avoids instantiating all ~517 MJ actions); the endpoint joins registered contracts with their Active MJ Action records + behavioral params and returns a JSON catalog. Action seeded in `.sonar-actions.json` (`mj sync push`). Verified live server-side.
5. ✅ UI: `ActionCatalogService` calls the endpoint (with a one-time `Config(true)` refresh so a just-synced action resolves without an app reload); builder renders the **"What this signal does"** panel (measures/reads/output/profile) + pre-fills direction from `contract.output.higherIsBetter`. Verified in Explorer, light + dark.

**Stale-param cleanup (done):** the streak's dropped data-source params (`ActivityEntity`/`MemberField`/`DateField`)
were deleted from `MJ: Action Params` in both DBs and pruned from `.sonar-actions.json`, so the catalog
shows the streak with **zero** config fields (just its contract). A running MJAPI caches action-param
metadata, so it shows the old fields until its next restart — source of truth is clean.

**Lessons (re: adding/changing actions live):** a `Custom` (compiled) action needs a build + MJAPI
restart. A new action also needs the client `ActionEngine` cache refreshed (handled by the
`Config(true)`-on-miss in `ActionCatalogService`) AND the server-side metadata cache refreshed for
param changes to show. A `Runtime` action (DB-stored code, via ActionSmith) avoids the *code* restart.
