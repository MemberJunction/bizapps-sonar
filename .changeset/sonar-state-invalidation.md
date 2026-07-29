---
"@mj-biz-apps/sonar-ng": minor
---

Fix the population filter losing the user's edits, and stop every surface serving stale data after a backend write.

## Population filter

The engine was never at fault. With `City eq Seattle` set directly on the row, `computeScores` returns exactly the 66 anchors that `WHERE City='Seattle'` matches. Every defect was in the authoring UI.

**The save raced itself.** `onPopulationFilterChange` was `async` and awaited a full `GetEntityObject` → mutate → `Save()` on every emit, and the builder emits per keystroke. Typing `gmail.com` fired nine independent read-modify-write round trips with no ordering guarantee; the row ended up holding `gmail.co` while the screen showed `gmail.com`. Intermittent, which is why it read as "not working" rather than plainly broken. Writes are now debounced (500ms) and appended to a single-flight chain, so a burst collapses to one write and two writes can never overlap. Verified: nine keystrokes now produce one mutation and the stored value matches the screen.

**Clearing a numeric value poisoned the model.** An empty `<input type="number">` reports `valueAsNumber` as `NaN`, which is neither `undefined`, `null`, nor `""`, so it passed the completeness check and `JSON.stringify` persisted `"value": null`. The engine's `requireValue` then threw `compileFilter: operator 'eq' on 'YearsInProfession' requires a value.` and the model could not recompute at all until someone repaired the filter by hand. One backspace was enough. The completeness check now rejects non-finite numbers.

**Opening the builder threw and ate the first condition row.** Writing the child's just-emitted tree straight back into its own `[filter]` input re-entered it mid-change-detection and threw `NG0100: ExpressionChangedAfterItHasBeenCheckedError`. Angular aborted the pass, so the row `mj-filter-group.ngOnInit` auto-adds never rendered: the panel claimed "No filters applied" with an "Add your first condition" empty state while its expression badge read 1, and there was no condition row to edit. `[filter]` is now a one-way seed, written only on a genuine reset (model load, or clearing to Everyone).

**Failures were silent.** `setPopulationFilter` returns a boolean that the caller discarded, so a publish-lock rejection or a permissions failure was indistinguishable from success. It now surfaces a toast.

**Two ways the screen could disagree with the stored filter.** Switching a rule's field left the previous filter live (correctly — the new one is incomplete) with nothing saying so; an inline hint now does. And switching to "Filtered subset" unconditionally reset the tree, blanking the builder on a model that already had a saved filter; it now keeps what is there.

**The header lied.** It read a flat "2,000 in population" while the real scope was 66, because the count is a bare `count_only` over the whole anchor entity. The filter is compiled to SQL server-side and duplicating that compiler in the browser would break DRY and add an injection surface, so the header now says "filtered subset of 2,000" rather than printing the entity total as if it were the scope. An exact scoped count needs a cheap server-side count entry point — deliberately left as follow-up.

**The lock had no explanation.** `PopulationFilter`, `AnchorEntityID` and `BandSetID` are all frozen while a model is published (`publishLock.EDITABLE_WHILE_PUBLISHED_SCORE_MODEL_FIELDS`), but the "Published & locked · Unpublish to edit" banner lived inside the Factors tab. Population, Data Sources and Score Bands each disabled their controls with no reason given and no way to unpublish — the Population tab in particular rendered as two dead buttons under a heading, which reads exactly like a broken feature. The banner now sits above the tab bodies and covers all of them.

## Cross-surface invalidation

Every surface loaded its data in `ngOnInit` and on model select, and nothing else. Worse than a long-lived tab: the shell **retains** surface instances, so navigating away and back does not re-run `ngOnInit` either. Measured directly — with the row at 320 Neutral / 231 Healthy, Engagement showed 520 / 31 across a full Engagement → Models → Engagement round trip.

`SonarDataBusService` carries no data, only a revision counter per topic (`scores:<modelId>`, `config:<modelId>`, `models`). Writers publish; readers subscribe by reading a revision inside an `effect()` and re-run their own load. Reads were never cached (`ScoreReadService` has no cache), so there was nothing to invalidate — the gap was that nobody re-read. Keeping the bus data-free leaves each surface in charge of *how* it reloads, so filters, page and place survive.

Publishers: recompute (`scores`), publish / unpublish / rollback / band change / factor change (`config`), create / archive (`models`). A `config` publish also bumps `models`, because a Status flip changes the chip every surface's rail renders — which is why those chips used to stay stale everywhere except the Model Builder that made the change.

Subscribers: Portfolio, Engagement Manager, the model dashboard, and the shared model rail. Each suppresses the first sighting of a model so the bus never duplicates the surface's own initial load, and Portfolio's baseline comparison is what stops refresh → slots → effect → refresh from looping.

Verified end to end: authoring a filter in Model Builder (a `config` publish) then returning to Engagement showed the new distribution with no manual step, where the same round trip previously stayed stale.
