# Sonar — Agentic Authoring Layer (design / proposal)

**Audience:** an LLM or engineer picking up the "let an agent build factors/models for me" work.
Self-contained design + decisions. Pairs with `action-factors.md` (the engine harness for
action-backed factors) and `plan.md` (data model + scoring pipeline).

**Status (2026-06-25):** design only, no code. Investigated MJ's available surfaces (ActionSmith,
Runtime actions, ng-conversations/Sage) — all present in `node_modules`. This doc is the plan to
review before building.

---

## 1. Goal

Let an operator author Sonar configuration in natural language — "create a recency factor on event
registrations", "build me a churn model for members, weight recency heavily, exclude staff" — and
have an agent produce a **draft** they review and approve. One capability the agent has: trigger
**Codesmith** (MJ's code-writing agent) to author an **action-backed factor** when the signal isn't
expressible declaratively.

**Non-goals (for now):** the agent auto-publishing anything; the agent as a parallel write path that
bypasses validation/governance; replacing the visual builder (the agent *complements* it).

---

## 2. Why this isn't redundant with declarative factors

Already settled canonically in `action-factors.md` §1 (the "three tiers"):

1. **SQL can express it** (count/sum/recency/trend, incl. multi-hop) → **declarative**. Cheap,
   deterministic, one query for the whole population.
2. **Deterministic but SQL can't** (streaks, decay, Gini) → cheap action.
3. **Needs the outside world / AI** (sentiment, LLM, external API) → expensive action.

Action factors are the **escape hatch**, not a duplicate. The only redundancy *risk* is using an
action for something declarative could do (per-anchor action calls vs one set-based query). The agent
**enforces declarative-first**: if an ask is expressible declaratively, it builds a declarative
factor and never touches Codesmith. That guard makes the agent cheaper and more trustworthy than one
that mints Runtime code for everything.

---

## 3. Architecture in one picture

```
  User: "build me a churn model for members, recency-heavy, exclude staff"
        │
   ┌────▼─────────────────────────┐
   │ Sage (MJ conversation mgr)   │  ← @memberjunction/ng-conversations, already built
   └────┬─────────────────────────┘
        │ delegates (invokeSubAgent)
   ┌────▼─────────────────────────┐
   │ Sonar Authoring Agent        │  ← BaseAgent subclass we register (the only new agent)
   │  - plans: declarative first  │
   │  - calls Sonar tools         │
   └────┬─────────────────────────┘
        │ tool calls (MJ Actions)
   ┌────▼───────────────────────────────────────────────────────┐
   │ Sonar authoring tool surface (server-side MJ Actions)       │
   │  Create Model · Add Data Source · Create Factor · Set Bands │
   │  Set Weight · Validate/Preview · (escape hatch ↓)           │
   └────┬───────────────────────────────────┬────────────────────┘
        │ declarative factor                 │ not SQL-expressible
        ▼                                    ▼
   set-based SQL (FactorCompiler)      ActionSmith/Codesmith → Runtime action
                                       (Type='Runtime', CodeApprovalStatus='Pending')
        │                                    │
        └──────────────┬─────────────────────┘
                       ▼
            Draft config — human reviews + approves — THEN it scores
```

The agent drives the **same primitives** the UI drives. No parallel path.

---

## 4. The three building blocks

### 4a. Tool surface — the real foundation (server-side MJ Actions)

Today most authoring logic lives in Angular services (`score-model.service.ts`,
`factor.service.ts`). An agent can't call Angular. So lift the **write** logic into server-side MJ
Actions:

| Action | Wraps |
|---|---|
| `Sonar: Create Model` | new ScoreModel + anchor + (optional) population filter |
| `Sonar: Add Data Source` | ModelRelatedEntity (with reachability/tie resolution) |
| `Sonar: Create Factor` | declarative Factor + ModelFactor (weight/mode) |
| `Sonar: Set Factor Weight` | ModelFactor weight/combine mode |
| `Sonar: Set Band Set` | attach/switch a ScoreBandSet |
| `Sonar: Validate / Preview Model` | already exists (reuse) |

Payoff (three for one):
1. The agent gets a **safe, governed toolbox** (each Action keeps the existing validation/locks).
2. The UI can eventually sit on the **same Actions** → one write path, one source of truth.
3. Codesmith becomes **one more tool**, not a special case.

> This is the bulk of the work. The agent on top is thin.

### 4b. Sonar Authoring Agent (mostly configuration, not code)

**Key fact:** the iterate-until-done logic lives in the **Agent Type**, not the agent. MJ ships
`LoopAgentType` (`@memberjunction/ai-agents`, registered `"LoopAgentType"`) — the standard
LLM-driven loop. `BaseAgent.Execute()` pumps it; each turn it calls
`agentType.DetermineNextStep(...)`, which parses the model's JSON envelope and routes it.

So building the Sonar authoring agent is **data, not a subclass**:
- An `AIAgent` record whose Type → `LoopAgentType`.
- A **prompt** encoding: declarative-first rule, explainability ("justify every factor/weight"), and
  "produce drafts, never publish."
- **Tools** = the Sonar authoring Actions from §4a, linked to the agent.
- Allowed **sub-agents** = Codesmith.

No loop code. We'd only drop to a `BaseAgent` subclass for an ActionSmith-style "always finish in a
valid state" guarantee — not needed for v1.

**The Loop response contract** (what the model emits each turn):
```jsonc
{
  "taskComplete": false,                 // true → finish; nextStep required when false
  "reasoning": "…",                      // captured → model provenance
  "payloadChangeRequest": { … },         // mutations to the accumulating draft (the model being built)
  "nextStep": {
    "type": "Actions" | "Sub-Agent" | "Chat" | "Retry" | "ForEach" | "While" | "Pipeline",
    "actions":  [{ "name": "Sonar: Create Factor", "params": { … } }],
    "subAgent": { "name": "Codesmith", "message": "…", "terminateAfter": false }
  }
}
```
Terminates on `taskComplete: true` or a `Failed` step (plus BaseAgent's max-step / max-time guards).
The **payload** is cross-turn memory — for us, the draft model accumulating factors/sources/bands.

**Surface:** Sage delegates via `ConversationAgentService.invokeSubAgent('Sonar Authoring Agent', …)`.

**Loop vs Flow (a refinement worth noting):** the *skeleton* of model-building is deterministic
(create model → add sources → add factors → set bands) — a textbook **`FlowAgentType`** (a graph with
boolean conditions, no LLM picking steps). The *creative* parts (which factors, what weights,
declarative-vs-Codesmith) are **Loop**. A Flow spine that calls Loop sub-steps is cheaper and more
predictable than one big Loop — but start with a single Loop agent for the spike.

### 4c. Chat surface — reuse, don't build

- `@memberjunction/ng-conversations` provides `ConversationWorkspaceComponent`
  (`<mj-conversation-workspace>`) + Sage + real-time agent progress. **Not yet wired into Sonar's
  Explorer.**
- To enable: add the dep to `apps/MJExplorer`, import `ConversationsModule`, embed the workspace (a
  Sonar nav item or a docked `<mj-chat-overlay>`).
- Optionally also an **inline copilot** later (a "describe a factor" box in the builder that calls the
  same agent scoped to the open model) — but the chat surface comes first since it's nearly free.

---

## 5. Codesmith as one tool (the action-factor escape hatch)

MJ machinery, all present in `node_modules`:
- **ActionSmith** (`@memberjunction/core-actions`) — NL → contract → delegates to Codesmith for JS →
  `Test Runtime Action` → `Create Runtime Action` (persists `Type='Runtime'`,
  `CodeApprovalStatus='Pending'`).
- **RuntimeActionExecutor** (`@memberjunction/action-runtime`) — runs DB-stored JS in a sandbox,
  gated on `CodeApprovalStatus='Approved'`. No restart.

**"Agent triggers Codesmith" is just a loop branch.** Codesmith is itself a Loop agent, so our
authoring agent reaching for it = `nextStep.type: "Sub-Agent"` with `subAgent.name: "Codesmith"`. No
special plumbing — it's the native delegation path.

The **adapter work** (the only Sonar-specific pieces — also in scope from the earlier ActionSmith
investigation):
1. **Factor-action brief.** Constrain ActionSmith to emit the factor shape: input `AnchorRecordID` +
   `asOf`, output `Value` (+ `explanation`), and the `FactorActionContract` (measures/reads/output/
   cost). Otherwise you get a valid action that isn't a valid *factor*.
2. **Catalog merge.** `Sonar: List Factor Actions` currently enumerates an *import-time registry of
   compiled `SonarFactorAction` subclasses*. Runtime actions aren't compiled → invisible. Tag them
   (a "Sonar Factor Actions" category or a contract blob on the Action) and merge into the catalog.
3. **Execution already works.** `ActionFactorEvaluator` runs via an injected `ActionRunner` that wraps
   `ActionEngineServer.RunAction`, which dispatches by `Action.Type` → a Runtime factor-action runs
   through the *same* path as a compiled one. No engine change to run AI-authored factors.

---

## 6. Governance & trust model

The whole thing is safe because **agent output lands in states that already require a human**:

| Agent produces | Lands as | Gate that already exists |
|---|---|---|
| declarative factor | Draft factor | factor Draft→Approved ("only Approved scores") |
| Codesmith action factor | `CodeApprovalStatus='Pending'` | sandbox refuses to run until Approved |
| a whole model | unpublished draft | publish-lock (publishing snapshots an immutable version) |

So an agent can scaffold an entire model, but **nothing scores anyone until a human approves** — and
for action factors, a human reads the generated code first. Maps cleanly onto today's gates; no new
trust primitives needed.

---

## 7. Why this is *Sonar's* agent, not a generic one

- **Explainability is the moat.** Sonar scores are explainable by construction (named factor
  contributions). The agent must justify each factor/weight choice; that rationale becomes model
  provenance.
- **Declarative-first is a feature.** "You don't need custom code for this — here's a declarative
  factor" is cheaper and more trustworthy than minting Runtime code.

---

## 8. Build order (inverted from where the excitement is)

1. **Tool surface** — server-side Sonar authoring Actions (the foundation both UI and agent need).
2. **One agent capability** — "create a factor from a description", declarative-first, Codesmith for
   the escape hatch. The real spike: exercises the tool surface *and* the Codesmith path.
3. **Wire ng-conversations** into Explorer + register the Sonar agent as a Sage sub-agent.
4. **Compose up** — "build a model with constraints" (multi-step plan over the tools).
5. **(Later)** inline builder copilot; cost guardrails at population scale (use the contract's
   `expensive/externalCalls/deterministic` flags for rate-limit/budget).

---

## 9. Open questions / risks

- **Don't skip the tool surface.** Wiring the agent straight to services/DB for a quick demo is the
  parallel-path trap — re-introduces the two-sources-of-truth problem governance depends on avoiding.
- **Scope discipline.** "Build a model" is huge. The atomic, demoable unit is "create one factor from
  a description"; everything composes from that + the tool surface.
- **Cost & determinism.** Agent + Codesmith get expensive fast — declarative-first + the cost flags
  are the throttle. Need a budget/rate-limit story before population-scale action factors.
- **Approval UX.** Where does a human review agent/Codesmith output? Reuse the factor Draft→Approved
  surface + a code-preview for Runtime actions (Phase 3 of the ActionSmith plan).
- **Provenance / repeatability.** Record which agent + prompt produced a factor/model
  (`Action.CreatedByAgentID` exists for Runtime actions; need an equivalent for declarative ones).

---

## 10. Decisions needed before building

1. Confirm the **tool-surface-first** build order (vs a quick agent demo wired to services).
2. Confirm **chat surface = MJ ng-conversations + Sage sub-agent** (vs a bespoke Sonar chat).
3. Scope of the **first spike**: just "create one factor from a description" end-to-end?

---

## 11. Execution log

**2026-06-25 — Phase 1, step 1 (tool surface) started.**

- `Sonar: Create Factor` action — first tool in the surface. Creates a declarative Factor + binds it
  to a model's rubric (ModelFactor) server-side, mirroring `FactorService.createAndBind`. Lives at
  `packages/Actions/src/custom/SonarCreateFactorAction.ts`, registered `"SonarCreateFactor"`.
  - **Input params:** `ModelID`, `Spec` (JSON of the factor: name, source, aggregation, field,
    filter, window, normalization, higherIsBetter, weight, weightMode).
  - **Output param:** `Result` (JSON: created FactorID + ModelFactorID).
  - **Scope now:** declarative factors only (the common case). Action-backed factors come via the
    Codesmith path (§5), not this action.
  - **Not yet seeded:** the MJ Action + ActionParam metadata records (mj sync) — that step touches
    `metadata/actions/.sonar-actions.json` (shared with the parallel track) + needs the DB, so it's
    a coordination point, done after the class compiles.

Next: seed metadata for Create Factor, then add the rest of the tool surface (Add Data Source, Create
Model, Set Bands), then stand up the Loop agent over them.
