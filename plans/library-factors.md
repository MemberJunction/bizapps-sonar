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

## Why a "pure" (shared) library factor is incoherent here

A factor reads its source through an **anchor → source relationship path** — FK hops, resolved per model and stored on `Factor.SourceRelatedEntityID → ModelRelatedEntity → (RelatedEntityID + RelationshipPath)`. The key fact: **that path is anchor-specific.** Sonar deliberately constrains a model to only the data its anchor can FK-hop to.

A pure library factor would be one shared `Factor` row that many models reference. That breaks on the anchor constraint, not just on tidiness:

- **Across different anchors → incoherent.** "Count of Event Registrations" is meaningless for an anchor that can't reach Event Registrations, and where two anchors *can* reach it, the FK path differs. One shared definition cannot carry one correct path. There is no universal library factor.
- **Within a single anchor → possible but pointless.** Same anchor ⇒ same reachable set ⇒ same path, so it's coherent — but Sonar binds sources per *model* (`ModelRelatedEntity`), so a shared factor would still have to reference the raw entity and re-resolve per model. At that point you've taken on the live-edit **drift** problem (editing the shared row changes every published model that binds it, since the engine scores from live config) for essentially no gain.

So a shared library factor is **non-viable by construction** — incoherent across anchors, not worth it within one. It is not a design Sonar should adopt.

## The only viable form: a copy-on-add template

A library factor as a **template**: it carries the *intent* (aggregation, window, normalization, a hint at the kind of source) — **not** a baked-in path. Adding it to a model resolves the source against **that model's** FK-reachable entities (the existing constrained picker), producing a normal model-owned factor with a real `ModelRelatedEntity`. The path is resolved per model, within the anchor's reach, at add-time. The schema already has the breadcrumb: `Factor.SourceScoreModelID` (nullable) is a "copied-from" pointer.

- Needs **zero** changes to the model-scoped data-source model — once instantiated it's just a regular model-owned factor.
- Drift-free by construction: there is no shared live row, so nothing can drift a published model.

## Consequence for the publish-lock

Because the only viable form is a copy-on-add template (no shared live row), the `ScoreModelID = null` exemption in `publishLock.ts` (`isModelConfigLocked`) is **correct as-is and needs no future guard** — the reverse-lookup lock and snapshot-scoring alternatives only matter for the shared-live-row design, which Sonar isn't taking. The null branch is exempt simply because a model-less factor is never a live, model-affecting row.
