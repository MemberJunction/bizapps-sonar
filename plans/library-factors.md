# Library factors — design note (deferred feature)

> Status: **deferred / not built.** Captured during the publish-lock PR review, when a reviewer flagged
> that a shared library factor could slip the lock. Recording the reasoning so whoever builds the feature
> inherits the constraint instead of rediscovering it.

## What a library factor is (and isn't)

Two independent axes — don't conflate them:

- **Ownership:** model-owned (`Factor.ScoreModelID` set) vs **library** (`ScoreModelID = NULL`, shared / not owned by one model).
- **Implementation:** declarative (compiles to SQL) vs action-backed (a Runtime Action computes it).

A **library factor is the shared one** — it can be *either* declarative or action-backed. "Library" ≠ "action".

## Current state: unreachable

- **Schema allows it** — `Factor.ScoreModelID` is nullable.
- **No authoring surface creates one** — every factor-creation path attaches the factor to a model.
- **The engine refuses to score one** — `FactorCompiler.resolveSource` throws `"library factors not supported yet"` (it requires `SourceRelatedEntityID`, which a model-less factor can't have).

So it's a schema affordance + a planned-for-later idea (the "starter factor library"), not a usable feature.

## The real design tension: data sources are model-scoped

A factor's data source lives on a **per-model** row: `Factor.SourceRelatedEntityID → ModelRelatedEntity → (RelatedEntityID + RelationshipPath)`. The source entity, its alias, and the anchor→source join path are all model-scoped (this is the nav-branch data-source constraint).

A library factor has **no model → no `ModelRelatedEntity`** to point at. So it can't express "what do I read" the normal way. That leaves two designs:

### (A) Shared live row
One `Factor` row that many models reference. It would need a *direct* `SourceEntityID` (a raw entity, not a model alias), and the engine would resolve the anchor→entity path **per binding model** at compile time.
- Fights the model-scoped data-source model.
- Only works for anchors that can actually reach that entity.
- **Creates a publish-lock gap:** editing the shared row drifts *every* published model that binds it (the engine scores from live config). To stay safe, the lock would have to block a library factor while it's bound to any locked model (reverse lookup through `ModelFactor`), **or** the engine would have to score published models from the `ScoreModelVersion` snapshot.

### (B) Copy-on-add template ✅ recommended
A library factor is a *blueprint*; adding it to a model **copies** it into a normal model-owned factor, wired to that model's `ModelRelatedEntity` at add-time. The schema already hints at this: `Factor.SourceScoreModelID` (nullable) is a "copied-from" pointer.
- Needs **zero** changes to the model-scoped data-source model — once instantiated it's just a regular model-owned factor.
- **The publish-lock gap disappears:** there's no shared live row, so nothing can drift a published model. The `ScoreModelID = null` exemption in `publishLock.ts` stays correct with no further work.

## Decision

Lean **(B) copy-on-add**. It fits the existing constraints and is drift-free by construction. If (A) is ever chosen instead, the publish-lock must gain the reverse-lookup guard (or the engine must move to snapshot-based scoring for published models) — see `publishLock.ts` `isModelConfigLocked` null branch.
