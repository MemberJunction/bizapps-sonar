# Adopting MJ's Entity Action workflow extensions

> **Status:** Tracking doc — nothing to build here yet.
> **Upstream:** MemberJunction/MJ **[#3408](https://github.com/MemberJunction/MJ/pull/3408)** · [design plan](https://github.com/MemberJunction/MJ/blob/claude/sales-deal-management-app-ueporb/plans/entity-action-workflow-extensions.md)
> **Blocked on:** that PR merging *and* its engine work landing (the PR ships schema + plan only).

---

## 1. What is changing in MJ core

`EntityAction` — MJ's generalized hook for running an Action off an entity's
create / update / delete / validate — is becoming the **workflow-hook substrate for every app on
the platform**, so no app needs to invent its own.

It already does more than its schema suggests, and this is worth knowing regardless of this PR:

| Invocation | Where it fires | Semantics |
|---|---|---|
| `Validate` | `OnValidateBeforeSave` | **A real blocking gate** — a non-`Success` result fails the save |
| `Before*` | `OnBeforeSaveExecute` | Awaited, result discarded (cannot veto) |
| `After*` | `OnAfterSaveExecute` | Fire-and-forget |

And because **`Execute Agent` is just an Action**, any binding can already run an agent — a
deterministic **flow agent** (visual editor, `Action`/`Prompt`/`Sub-Agent`/`ForEach`/`While` steps,
per-step retry and error behaviour) or a **loop agent** where judgement is genuinely needed. The
house shape is a flow agent with a `Sub-Agent` step calling a loop agent.

**What #3408 adds:**

- **`EntityAction.ScopeEntityID` + `ScopeRecordID`** — bind a workflow to *one configuration record*
  rather than to every record of an entity. This is the important one: it means **no app ever grows
  a column per type per event**, and a configuration record can surface "the workflows bound to me"
  as a real relationship instead of something buried in filter code.
- **`EntityAction.Sequence`** — deterministic ordering when several bindings share an event.
- **`EntityActionParam.ValueType = 'Entity Object Data'`** — passes `entity.GetAll()` instead of the
  live `BaseEntity`. Use it for anything that serializes, above all `Execute Agent`'s `Data` payload:
  a `BaseEntity` serializes to `{}` because its fields are getters, so the agent silently receives
  an empty payload with no error anywhere.
- Two seeded reusable `ActionFilter`s — **"field changed"** and **"field changed *to* value"** — so
  transition detection stops being hand-rolled. Without them `AfterUpdate` fires on *every* update,
  and "status *is* X" instead of "status *changed to* X" re-fires on every later save.
- `After*` routed through `QueueManager` so failures are durable and retryable rather than logged
  and swallowed.

**Authoring is pure metadata** — `metadata/entity-actions/`, with `relatedEntities` for invocations,
filters and params. No schema and no code in the consuming app.

---

## 2. What this means for Sonar

Sonar overlaps here in an interesting way, because Sonar's **action layer** and its
`ScoreBandTransition` entity are already a purpose-built version of "when this record crosses into
this state, do something."

`ScoreBandTransition` is arguably the single best `EntityAction` subject in the entire family: it is
a row that exists *because* a threshold was crossed, so there is no transition-detection problem to
solve — the row's existence **is** the transition.

## 3. Suggested bindings

| Entity + invocation | Scope | Work | Purpose |
|---|---|---|---|
| `ScoreBandTransition` · `AfterCreate` | a **`ScoreBand`** or `ScoreModel` | Flow agent | The headline case — a member drops into At Risk, run the intervention |
| `Score` · `AfterUpdate` (score crossed a threshold) | a `ScoreModel` | Action | Write-back to source systems |
| `ScoreModelVersion` · `AfterUpdate` (published) | a `ScoreModel` | Action | Notify, snapshot, kick off recompute |
| Recompute run · `AfterUpdate` (failed) | a `ScoreModel` | Action | Operational alerting |

## 4. The action-layer question

Sonar's plan already specifies an action layer with `ActionPromotion` governance and
**holdout-measured lift** — which is more than `EntityAction` provides and is genuinely differentiated
product surface, not plumbing. Nothing here should dilute that.

The question worth asking before Sonar's action layer is built: **is the dispatch mechanism
`EntityAction`, with Sonar keeping the governance and measurement on top?**

| Layer | Owner |
|---|---|
| *When* to act — band transition, threshold crossing | Sonar (it produces the transition row) |
| *Whether* an action is promoted to production | **Sonar** — `ActionPromotion` governance, no equivalent in core |
| *How* to dispatch — Action or Agent, with params | `EntityAction` (core) |
| *Did it work* — holdout, lift measurement | **Sonar** — genuinely unique, keep it |

That split lets Sonar build the two layers only it can build, and inherit dispatch. It also means a
Sonar-driven intervention and a Sales-driven one run through the same machinery, are configured the
same way, and appear in the same run history — which matters if both ever act on the same person.

**A caution specific to scoring:** `Score` is recomputed on a schedule, so `AfterUpdate` on `Score`
will fire at recompute volume. Anchor bindings on `ScoreBandTransition` — the low-volume, high-signal
row — rather than on `Score` itself, unless the binding is genuinely per-recompute.

---

## 5. What to do now

**Nothing.** This is a tracking doc so the idea is not lost and so this repo's plans reflect where
workflow hooks are going. When #3408 merges and its engine work lands:

1. Confirm the bindings in §3 are still the right ones.
2. Author them as metadata under `metadata/entity-actions/`.
3. Build the flow agents they dispatch to.
4. Delete this file, or fold it into the repo's main plan.

## 6. Two rules to carry into the design

- **Synchronous bindings should be Actions, never agents.** `Validate` and `Before*` run inside the
  caller's transaction. A loop agent's duration is unbounded and holding a transaction open for it
  is not acceptable. Agents belong on `After*`, which is async.
- **A flow agent should create human work and finish** — it should not hold a run open waiting for
  a person. Use `MJ: AI Agent Requests` when the answer resumes the same run (minutes to hours), and
  a **bizapps-tasks** Task when it is durable, assignable work someone owns (days to weeks).

---
_Generated by [Claude Code](https://claude.ai/code)_
