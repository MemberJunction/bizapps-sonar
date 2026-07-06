# Factor Filter & SQL Authoring — Design Recommendation

**Status:** Draft v0.1 — design recommendation for the Model Builder filter/expression authoring
**Author:** Barnatt (with Claude)
**Last updated:** 2026-06-16
**Related:** [`plan.md`](./plan.md) §5.2 (Factor), §6.1 (FactorCompiler), §7.1 (authoring modes), §13 decision #3

---

## 0. TL;DR

The old Kendo-styled expression UI is going away because **MemberJunction dropped its Kendo (Telerik) license** — so any Kendo-*dependent* component is deprecated. We don't need to build a SQL editor from scratch, and for most of Sonar's needs we shouldn't let users write SQL by hand at all. There are **three different authoring needs hiding under "build SQL,"** and MJ already ships a reusable, de-Kendo'd building block for the main one:

| Need | What it really is | Recommended tool |
|---|---|---|
| `Factor.FilterExpression`, `ScoreModel.PopulationFilter` | A **WHERE clause** over one entity | **`@memberjunction/ng-filter-builder`** (`<mj-filter-builder>`) |
| `ScoreModel.CombineExpression` | A **math formula** over factor slugs | A small formula editor (not a filter; out of scope for the filter builder) |
| Arbitrary / escape-hatch SQL (Action-backed factors) | Genuinely custom logic | **MJ Query Builder agent** + MJ Actions |

**Recommendation:** store filters as `CompositeFilterDescriptor` JSON (MJ's standard filter shape), author them with `<mj-filter-builder>`, and have Sonar's engine `FactorCompiler` translate that JSON into SQL at compute time. Reserve the AI/agent path for the genuinely-arbitrary 20%.

---

## 1. Background: why we're here

The Sonar plan ([`plan.md`](./plan.md) §7.1) describes three authoring modes for scoring models: AI-first, a visual builder, and a formula escape hatch. Several entity fields are stored as free-form text today and need real authoring UX:

- **`Factor.FilterExpression`** — a filter applied to a *related* entity when computing a declarative factor, e.g. "only CRM activities where `ActivityType IN ('EmailOpen','EmailClick')`". (plan §5.2)
- **`ScoreModel.PopulationFilter`** — which anchor records are in scope for the model, e.g. "members where `Status = 'Active'`". (plan §5.1)
- **`ScoreModel.CombineExpression`** — a formula combining factor outputs, e.g. `0.4*newsletter + 0.3*events - penalty(dues_lapsed)`. (plan §5.1)

The team's earlier idea was a "Kendo-styled expression builder." **That's deprecated** — not because the UX was wrong, but because **MJ no longer licenses Kendo (Telerik)**, so MJ is removing Kendo-dependent UI across the platform. (MJ's own Angular guide now says "All UI components should use the MJ UI components package — NOT Kendo," and "NEVER use Kendo icons.")

The good news: MJ already rebuilt the filter-building UX *without* a Kendo dependency, and it's reusable.

> **Jargon check.** *Kendo / Telerik* = a commercial Angular component library MJ used to license. *Deprecated* = still works for now, but don't build new things on it; it's on the way out. *WHERE clause* = the part of a SQL query that filters rows (`WHERE Status = 'Active'`).

---

## 2. The key insight: three different problems, not one

It's tempting to think "we need to build SQL." But "build SQL" conflates three very different jobs, and conflating them leads to building the wrong tool:

### 2a. Filters (`FilterExpression`, `PopulationFilter`) — a WHERE clause
This is a set of conditions joined by AND/OR: `field operator value`. It is **not** arbitrary SQL — it's a structured, constrained thing. A visual rule builder fits perfectly, and the user never types SQL. **This is ~80% of the authoring need.**

### 2b. The combine formula (`CombineExpression`) — arithmetic, not a filter
`0.4*newsletter + 0.3*events` is math over named factor outputs. It has nothing to do with filtering rows, so a filter builder is the *wrong* tool. This needs either a small expression/formula editor or, for v1, a plain validated textarea. **Don't force this into the filter builder.**

### 2c. Genuinely arbitrary SQL (the escape hatch) — Action-backed factors
The plan's "Action-backed factors" (plan §5.2, §7.3) are the ~20% that can't be expressed declaratively: external propensity models, NLP sentiment, custom decay math. These are implemented as MJ **Actions** (code, sometimes AI-generated). *This* is where a text-to-SQL agent earns its keep — not the 80% declarative case.

> **Why this matters for a new engineer:** the most common mistake here would be to build a general "SQL editor" component. Most of what Sonar needs is a *constrained filter builder* (safer, no SQL-injection surface, easier UX) plus the engine doing the SQL generation. Hand-written SQL is the exception, not the rule.

---

## 3. The MJ building blocks (inventory)

Everything below already exists in the `MJ/` repo and is installable. Paths are relative to the workspace root.

### 3a. `<mj-filter-builder>` — the visual filter builder ✅ primary recommendation
- **Package:** `@memberjunction/ng-filter-builder`
- **Path:** `MJ/packages/Angular/Generic/filter-builder/`
- **What it is:** a visual AND/OR rule builder (field → operator → value, with nested groups). Already in Sonar's `node_modules` as a transitive dependency of `ng-entity-viewer`.
- **Not Kendo-dependent.** It uses the Kendo *data shape* (`CompositeFilterDescriptor`) for interoperability but imports **zero** Kendo libraries — exactly the de-Kendo'd replacement we want.
- **Inputs/outputs** (from `filter-builder.component.ts`):
  - `@Input() fields: FilterFieldInfo[]` — the columns the user can filter on (name, displayName, type, optional value list).
  - `@Input() filter: CompositeFilterDescriptor` — the current filter (two-way-ish; emits changes).
  - `@Output() filterChange` / `apply` — emit the updated `CompositeFilterDescriptor`.
  - `@Input() showSummary` — renders a human-readable summary ("Newsletter engagement contains …").

> **Jargon check.** `CompositeFilterDescriptor` is a small JSON object: `{ logic: 'and' | 'or', filters: [...] }`, where each entry is either a rule `{ field, operator, value }` or another nested group. It's MJ's standard, serializable filter format.

### 3b. `<mj-view-config-panel>` — the pattern to copy for AI + manual
- **Package:** `@memberjunction/ng-entity-viewer` (already a Sonar dependency)
- **Path:** `MJ/packages/Angular/Generic/entity-viewer/`
- **Why it matters:** its Filter tab has **two modes** — a *Smart Filter* (an AI text prompt) and a *Traditional Filter* (the rule builder from 3a). That's exactly the "AI-first authoring + visual builder underneath" pairing the Sonar plan calls for (§7.1). We don't have to invent the interaction model — we can mirror it.
- It also shows the precedent that a saved MJ **User View** stores *both* the filter JSON (`FilterState`) *and* a SQL `WhereClause` — proof that MJ already translates a visual filter into SQL somewhere in its view pipeline.

### 3c. MJ **Query Builder agent** — for the arbitrary-SQL / Action path
- **Definition:** `MJ/metadata/agents/.query-builder-agent.json`; driver class `MJ/packages/AI/Agents/src/query-builder-agent.ts`
- **What it is:** a natural-language → SQL agent. A business-facing orchestrator delegates to a **Query Strategist** sub-agent that explores the schema, writes SQL, **tests it live against the DB**, and returns a structured result. The generated SQL is carried in the agent's result payload (`payload.metadata.sql`), and it can optionally be saved as a reusable **`MJ: Queries`** record (with parameters, caching, and audit logging for free).
- **How to run it from server code:** `new AgentRunner().RunAgent({ agent, conversationMessages, contextUser })` → `result.payload`.
- **Safety:** the underlying "Run Ad-hoc Query" Action enforces **SELECT-only** execution and blocks dangerous SQL via a shared `SQLExpressionValidator`, so an authoring/preview loop is safe to expose.

### 3d. Supporting pieces (know they exist)
- **`QueryGen`** (`MJ/packages/QueryGen/`) — a *programmatic* (CLI/library) text-to-SQL pipeline for bulk-bootstrapping a query catalog. Not interactive UI; useful later if we want to seed many factor queries.
- **`RunQuery`** (`MJ/packages/MJCore/src/generic/runQuery.ts`) — executes a stored `MJ: Queries` record with Nunjucks parameters + caching. This is the in-code way to run a saved query (no Action overhead), per MJ's "call services directly for code-to-code" rule.
- **MJ Actions framework** (`ActionEngineServer.RunAction(...)`) — how Action-backed factors get invoked at the *boundary* (agents/workflows). For Sonar's own engine-to-engine calls, MJ guidance is to call the underlying service class directly.

---

## 4. Recommended architecture (per field)

| Field | Stored as | Authoring UI | How it becomes SQL |
|---|---|---|---|
| `Factor.FilterExpression` | `CompositeFilterDescriptor` JSON | `<mj-filter-builder>` scoped to the **related** entity's fields | Sonar `FactorCompiler` translates the JSON into a `WHERE` fragment when it builds the factor's set-based SQL (plan §6.1) |
| `ScoreModel.PopulationFilter` | `CompositeFilterDescriptor` JSON | `<mj-filter-builder>` scoped to the **anchor** entity's fields | Same translator, applied to the anchor population query |
| `ScoreModel.CombineExpression` | formula string | Small formula editor or validated textarea (v1) | Parsed by the engine's combine step; **not** a filter |
| Declarative factor definition (entity + aggregation + window + normalization) | structured columns | Dropdowns/form (per the [builder mockup](./mockups/builder/model.html)) | `FactorCompiler` assembles the full query |
| Action-backed factor | `ActionID` + params | "Add custom factor" → MJ **Query Builder agent** / Action Builder | Agent generates & tests SQL; promoted Action runs at compute time |

This lines up with the plan, which already specifies `FilterExpression` as "JSON/DSL over the related entity" (§5.2) and a `FactorCompiler` that "applies `FilterExpression`" when generating SQL (§6.1). Storing `CompositeFilterDescriptor` JSON *is* the JSON/DSL the plan anticipated.

### Data flow (filter authoring)

```
User picks rules in <mj-filter-builder>
        │  (field / operator / value, AND/OR groups)
        ▼
CompositeFilterDescriptor  (JSON)
        │  saved onto Factor.FilterExpression / ScoreModel.PopulationFilter
        ▼
Stored in __mj_BizAppsSonar  (nvarchar(max) JSON)
        │  at recompute time
        ▼
Sonar FactorCompiler  →  SQL WHERE fragment  →  one set-based query per factor
```

The browser never sends SQL; it sends structured JSON. SQL is generated server-side by code we control. That's safer and matches MJ's model.

---

## 5. What we reuse vs. build

**Reuse (don't rebuild):**
- `<mj-filter-builder>` for all filter authoring (the de-Kendo'd component).
- The `<mj-view-config-panel>` interaction model (AI prompt + manual rules side by side) as the template for Sonar's AI-first authoring.
- The MJ **Query Builder agent**, `MJ: Queries` entity, `RunQuery`, and the SQL-safety validators for the Action-backed/escape-hatch path.

**Build (Sonar-specific):**
- The **`CompositeFilterDescriptor` → SQL translator** inside `FactorCompiler`. MJ's `GenerateWhereClause` (see Q1) is the reference implementation — small and bounded (recurse the AND/OR tree, map operators to SQL) — but it's `protected` and unparameterized, so Sonar ports the logic and **parameterizes values**.
- The wiring of `<mj-filter-builder>` into the **Model Builder** surface, fed with the chosen entity's real field metadata (`FilterFieldInfo[]` built from MJ entity metadata).
- A small **formula editor** (or validated textarea for v1) for `CombineExpression`.
- Sonar's own thin **factor-evaluator Actions** for Action-backed factors (per plan §5.2/§7.3), invoked by the recompute orchestrator.

---

## 6. Open questions (confirm before/while building)

- **Q1 — Reusing MJ's filter → SQL converter.** *Resolved (mostly).* MJ already converts a `CompositeFilterDescriptor` to a SQL `WHERE` clause: `GenerateWhereClause(FilterState, entityInfo)` on `MJUserViewEntityExtended` (`MJ/packages/MJCoreEntities/src/custom/MJUserViewEntityExtended.ts:634`), via `processFilterGroup` (recurses the AND/OR tree) and `convertFilterToSQL` (maps `eq/neq/gt/contains/isnull/…` to SQL — the same operator set `<mj-filter-builder>` emits). Two caveats: (1) it's **`protected`** on the UserView entity, so it's not directly importable — Sonar would either port the ~70-line logic into `FactorCompiler`, or ask the MJ team to expose it as a public static utility; (2) it **interpolates string/LIKE values directly** into the SQL (fine for trusted view config, but Sonar's `FactorCompiler` should **parameterize values** to avoid an injection surface). Net: the translation is small, well-understood, and low-risk — recommend porting + parameterizing in `FactorCompiler`, and raising the "expose it publicly" ask with Madhav.
- **Q2 — AI authoring: reuse the Query Builder agent, or build Sonar's own Model Builder agent?** The plan defines a Sonar **Model Builder agent** (§8) that proposes a *whole rubric*, which is broader than the Query Builder agent's "produce one query." Likely answer: build Sonar's Model Builder agent for rubric authoring, but have it (and the Action-backed-factor path) **reuse the Query Builder agent / Query Strategist** for the actual SQL generation step. Confirm with Amith.
- **Q3 — `CombineExpression` editor scope for v1.** Full formula editor with autocomplete over factor slugs, or a validated textarea to start? Recommend textarea for v1; revisit.
- **Q4 — Schema reality.** Per [`PUNCH_LIST.md`](../PUNCH_LIST.md), the `__mj_BizAppsSonar` schema **doesn't exist yet** and the Model Builder runs on simulated data. So a prototype can only be a **UI spike** (filter builder with sample fields, no persistence) until the schema migration + CodeGen land. That's fine for proving the UX.

---

## 7. Prototype plan (UI spike)

Goal: prove the authoring UX in the real Model Builder surface, with no backend dependency.

1. Add `@memberjunction/ng-filter-builder` as a **direct** dependency of `@mj-biz-apps/sonar-ng` (it's already in `node_modules` transitively).
2. Import `FilterBuilderModule` into `CustomFormsModule`.
3. In the Model Builder component, add a sample `FilterFieldInfo[]` (shaped like a member/CRM-activity entity) and a `CompositeFilterDescriptor` model, and drop `<mj-filter-builder [fields] [filter] (filterChange) [showSummary]>` into a new "Population filter" card.
4. Build `@mj-biz-apps/sonar-ng` to confirm it compiles. No persistence, no engine — purely the authoring interaction.

This demonstrates the replacement for the deprecated Kendo idea and de-risks the eventual real wiring once the schema exists.
