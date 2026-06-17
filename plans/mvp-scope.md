# Sonar MVP — scope & UI roadmap

**Status:** agreed 2026-06-17. The boundary + sequencing below reflect decisions made after
verifying the core loop end-to-end against the demo sandbox.

## Target & bar
- **Audience:** internal / stakeholder **demo** (and a hand-held design-partner association).
- **Bar:** the core loop is credible + explainable end-to-end on a real rubric. Not self-serve,
  not multi-tenant-hardened. SQL/engine robustness can come later; **declarative-factor
  capabilities must be documented** (see `declarative-factors.md`) to cover ~80% of use cases.
- **Data integration:** **Pattern 1 only** — business data lives in the MJ database as a schema,
  registered via CodeGen. (Pattern 2 / in-place via organic-key joins = later.)

## Product shape: single-model focus
Scores are **per-model** — each `ScoreModel` has its own anchor entity, 0–100 scale, and band
set, so scores are **not comparable across models**. Therefore the app is **model-scoped**:
- **The model is the primary navigation context.** A shared "current model" selection drives
  every surface.
- **Overview** = the selected model's at-a-glance dashboard (not a picker).
- **Engagement Manager / Admin & Ops** = scoped to the selected model.
- **Deferred (need deliberate design):** member-360 (one member across same-anchor models),
  org-wide rollups across models.

## Information architecture (the backbone)
- **Persistent model sidebar** (collapsible): list + quick-switch + per-model status (band mix,
  Active/Draft, current version chip). Replaces the Model Builder's inline model list.
- **Shared current-model context** (a small persisted service) read by all Sonar surfaces.
- **Version history stays in the Model Builder** (publish/versions/rollback = lifecycle). The
  sidebar/Overview only **reflect** the current version (chip + deep-link), never duplicate the
  management UI. *Reflect vs. manage* is the rule that resolves the overlap.

## UI roadmap (impact × ease)

### Now — highest impact, lowest effort
1. **Live what-if tuning** — editable factor weights in the rubric; the distribution donut +
   sample re-preview (debounced) as you tune. Reuses Simulate. The authoring wow.
2. **IA backbone** — model sidebar + shared current-model context → **Overview = single-model
   dashboard + "needs attention."** Everything else rides on this.

### Next — the "view scores" loop (shared dependency: persisted, readable per-member scores)
3. **Wire Recompute to persist scores + read them back** — Recompute action exists; add a UI
   trigger (post-publish) and read persisted `Scores` / `ScoreFactorContribution`. Keystone.
4. **Engagement Manager = triage list + explainability drawer** — member work-queue
   (sorted most-at-risk-first, band chip + top driver, filterable) → click a row → drawer with
   the score, contribution **waterfall** (why), and trend. The headline "explainable" moment.
5. **Pre-publish impact preview** — "publishing v4 moves 12% of members Watch→At-Risk; here's
   who." Uses the version snapshot; turns publishing into a safe, informed action.

### Later / independent
6. **Plain-language model summary** — an **AI action** (AIPromptRunner) that writes a readable
   model summary, **refreshed on compute/publish** (cached, not per-load). Independent of the
   score backbone — pull forward anytime for demo AI-flavor.
7. **"Movers" since last run** — band transitions (needs run history / `ScoreBandTransition`).
8. **Score → Action** — fire an MJ Action from a member/band (renewal offer, assign staff) with
   holdout-measured lift. The v2 **north star**; bake the language in now, build later.

**Throughline:** one reusable "why this score" **waterfall** component, used identically in the
builder preview, the member drawer, and (later) the action context — consistency *is* the trust.

## Explicitly deferred (parked, not forgotten)
- Template **system** (in-app presets/library). MVP keeps a **seeded example model**; presets
  return when self-serve onboarding is the goal (no DB change needed — editable JSON prefills).
- Engine maturity: full `MissingDataPolicy` (only the count-zero case matters near-term),
  normalization beyond None/MinMax (Percentile/ZScore/Logistic/Banded/Lookup), Action-backed &
  LLM factors, multi-hop joins, combine strategies beyond WeightedSum.
- Pattern 2 (in-place data via organic-key joins), member-360, org rollups.
- Error toasts (needs `@memberjunction/ng-notifications` dep) — small, do alongside.
- Production hardening: auth scoping, perf at scale, RBAC on surfaces.
