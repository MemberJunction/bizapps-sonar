---
"@mj-biz-apps/sonar-ng": minor
"@mj-biz-apps/sonar-actions": minor
---

Expose a signal's missing-data policy and a model's change window, which the schema and engine already supported but nothing could set.

`ModelFactor.MissingDataPolicy` decides what an anchor with NO data for a signal scores on it, and the engine has always honoured it — but no surface ever wrote it, so every signal fell through to the schema default, which `RecomputeOrchestrator` resolves to `Zero`. On a sparse source that silently scores every anchor with no rows as the worst possible on that signal. The factor builder's Weight step now offers the three real behaviours in plain language ("Counts as zero" / "Counts as average" / "Skipped") with a consequence hint per selection. The legacy `ModelDefault` alias isn't offered (there is no model-level default column behind it) and existing rows carrying it are left alone unless the policy actually changes, so an unrelated signal edit doesn't produce a phantom config diff.

`ScoreModel.TrendWindowDays` was write-once in the New-model wizard and then invisible: `ScoreModelService.setTrendWindowDays()` existed with zero callers. It now reads and edits inline in the model-builder header ("change window: 30 days"), locked with an explanation once the model is published — matching `publishLock.ts`, which deliberately keeps that field off the editable-while-published allowlist because Delta and the biggest-movers lists drive interventions and have to stay reproducible. Rollback also restores it now; it was captured in every version snapshot but never re-applied, so restoring v3 rebuilt v3's rubric while silently keeping today's window.

The authoring agent could do neither. `Sonar: Create Factor` gains a `missingDataPolicy` key in its Spec contract, `Sonar: Bind Signal To Model` gains a `MissingDataPolicy` input, and `Sonar: Describe Model` now reports the trend window, the score scale, and each signal's policy — previously the agent couldn't even see the knobs it was expected to advise on.
