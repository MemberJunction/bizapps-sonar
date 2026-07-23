# Intervention Layer — Build Plan

> Branch: `sonar_intervention_layer` (cut from `next` post-v0.4.0). Design source: [plan.md](plan.md) §5.6 (action layer), §7.5 (holdout/lift), §5.5 (governance & write-back — deferred).

## The loop

**Segment** (saved filter over scores) → **Intervention** (MJ Action + `ControlGroupPercent` holdout) → **Assignment** (Treatment/Control, stable-hash split) → **Outcome** → **measured lift** (treatment rate − control rate).

The holdout is the product wedge: lift is *measured against a real control group*, not assumed. Assignments are immutable and 1:1 per (Intervention, anchor record) — no re-assignment mid-window.

## Strategy: salvage from `sonar_app_nav`

The layer was fully built (94/94 engine tests) and parked, unmerged, on `sonar_app_nav` — a deliberate v1 scope cut, not a failed build. Salvage procedure: **merge `next` into `sonar_app_nav` first** (bring the parked branch up to current), then port the intervention pieces onto this branch, adapting to post-v0.2.0 conventions the parked code predates:

| Recovered asset (commit) | Adaptation |
|---|---|
| Migration `V202606241210__v0.1.x_Action_Layer.sql` (a380983) — 4 tables, complete FKs/checks | Renumber after current head (`V2026072x`), **add the PG twin**, keep structure |
| `SegmentEvaluator` (76 ln), `InterventionRunner` (193 ln), `interventionInvoker` (45 ln) (984fdfd) | Fit current Engine style; runner is pure/deterministic — ports cleanly |
| `SonarRunInterventionAction` (188 ln, preview/commit) (6f9f7dc) | Rebase onto today's `SonarActionBase` (permission gates); seed via **forward migration**, both dialects — never the frozen seed |
| Engine tests (94/94) | Port as-is; add holdout-math cases |

## Scope cuts (this phase)

- **Write-back (§5.5) → CP5.** Pushing scores into external systems (`WriteBackTarget`/`Policy`/`Log`, Salesforce field mapping, debounce, loop guards) shares the `ScoreBandTransition` trigger but nothing else. Separate concern, separate phase.
- **Scheduled triggers → CP5.** This phase ships `Manual` + `OnEnterSegment`.
- **Outcome measurement loop → CP4.** Tables land in CP1; the engine loop that fills them (and the lift math + results UI) is the next run.

## Checkpoints

### CP1 — Schema + entities live
1. Migration `V202607221000__v0.5.x_Intervention_Layer.sql`: `ScoreSegment`, `Intervention`, `InterventionAssignment`, `InterventionOutcome` + **PG twin**.
2. Run against dev DB → `mj:codegen` → entities/resolvers/forms.
3. **Gate:** both dialect migrations present; entities generated; full `npm run build` green.

### CP2 — Engine loop + firing action
1. Port `SegmentEvaluator` / `InterventionRunner` / `interventionInvoker` into `packages/Engine/src/orchestration/`.
2. Port + rebase `SonarRunInterventionAction` (preview = counts only; commit = write assignments + fire Treatment-only). Metadata entry + idempotent forward migration (both dialects).
3. Port tests; add holdout-split coverage (ratio honors `ControlGroupPercent`; assignment immutability).
4. **Gate:** tests pass; on the MoreCheese demo DB — preview then commit produces the right Treatment/Control ratio, action executes for Treatment only, Control untouched.

### CP3 — Trigger wiring + Engagement Manager launch flow
1. Post-recompute hook in `RecomputeOrchestrator.recompute()` (after `writer.write()`): read `ScoreBandTransition WHERE Handled=0`, fire matching `OnEnterSegment` interventions, flip `Handled=1`. Try/catch-isolated — a bad intervention never fails a recompute.
2. Engagement Manager: **Launch intervention** from the triage cohort → dialog (pick/create intervention, holdout %, preview counts) → commit. Plus an **Interventions tab** (launched interventions, assignment counts, delivery status). Shared primitives + sanctioned tokens only; Playwright light/dark verification before done.
3. **Gate:** end-to-end on the demo — launch from the UI on a real cohort, assignments land; force a band transition, `OnEnterSegment` fires.

### CP4 — Outcomes + lift (later)
Outcome measurement loop (fill `InterventionOutcome`), lift calculation (treatment − control rates), results UI ("+15pp measured lift").

### CP5 — Write-back + scheduling (later)
§5.5 entities and push pipeline; `Scheduled` trigger type; intervention tools for the authoring agent.

## Standing rules
- Frozen seed untouched; all installed config via idempotent forward migrations, **both dialects**.
- Changeset per PR; CodeGen-owned files never hand-edited.
- `sonar_app_nav` may be deleted once salvage is complete (its unique value is exhausted).
