---
"@mj-biz-apps/sonar-ng": minor
---

Add an explicit **Refresh** to the Portfolio, Engagement Manager, and model-detail surfaces so a recompute's results can be pulled in without reloading the browser.

Every Sonar surface loads its data exactly twice: once in `ngOnInit`, and again when the model rail emits `select`. `CurrentModelService` carries the current *selection* and nothing else — there is no "scores changed" event, and no surface watches for one. MJ Explorer keeps open resource tabs mounted and `BaseResourceComponent` has no activation hook, so switching back to a tab does not re-run `ngOnInit`.

The result: you hit Recompute in Model Builder, it writes Scores / ScoreHistory / ScoreBandTransitions, and every other open tab keeps showing pre-recompute numbers indefinitely. Band tiles, the triage list, movers, the stale-version warning, the sparkline — all frozen. Model Builder's own post-recompute `simulate()` only refreshes its right rail, and that's the *unpersisted preview*, not the run that was just written. The only escapes were re-clicking your own model in the rail (`pick()` doesn't guard same-id, so it re-emits) or a browser reload — neither of which reads as a refresh gesture.

Refresh re-reads from the API, which was always the fresh source: `ScoreReadService` has no caching, so there is nothing to invalidate. Each surface preserves the operator's place rather than reusing its full load path:

- **Engagement Manager** keeps the band tile, score range, name search, sort, and page. `loadModel` is deliberately not reused — it resets every filter, throwing away the cohort being worked. The selected band is re-pointed at the fresh slice with the same `bandId`, because its member count just changed and the tile renders from the held object.
- **Portfolio** keeps the rendered slots on screen while the new reads land (`loadSlot` replaces each in place by model ID), so a refresh doesn't blank every model to a skeleton and flash the whole Marimekko. Slots for models that disappeared are dropped and new ones seeded.
- **Model detail** keeps the operator's chosen action-card timeframe, which `loadModel` would otherwise re-derive from the model's `TrendWindowDays` and silently yank.

This is the narrow, operator-driven fix. It does not add automatic invalidation, so the stale model-status chips in each surface's rail (every surface holds its own sidebar instance, and only Model Builder refreshes its own) are still stale until refreshed. A shared invalidation bus that removes the manual step is tracked separately.

No new CSS — reuses the existing `.sonar-btn` primitive and `.sonar-page__actions` container, so light/dark theming is inherited by construction.
