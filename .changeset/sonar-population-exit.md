---
"@mj-biz-apps/sonar-engine": patch
---

Stop members who left a model's population from lingering in the triage list with an old version's score.

`ScoreWriter`'s Score MERGE had `WHEN MATCHED` and `WHEN NOT MATCHED` arms but nothing for rows whose anchor is no longer in the population. Narrowing a model's `PopulationFilter` therefore left the dropped-out members' `Score` rows completely untouched — old value, old `ScoreModelVersionID` — and every read path filters on `ScoreModelID` alone, so they kept appearing in the Engagement list looking scored. The population filter itself was working; the leftovers just made it look like it wasn't.

The MERGE now reconciles rather than only upserting: `WHEN NOT MATCHED BY SOURCE AND t.ScoreModelID = @modelId THEN DELETE`, so `Score` means "the current scored population". Chosen over a retire-flag column because it needs no read-path changes at all — a flag would have to be filtered in every read, and missing one would silently reintroduce this exact bug.

Deleting loses nothing. `ScoreHistory` is a separate append-only table holding every snapshot with the explainability breakdown in `ContributionsJSON`, so an exited member's full trail survives. `ScoreFactorContribution` is the only FK onto `Score` (`NO_ACTION`) and the model's contributions are already cleared earlier in the same transaction, so the delete cannot violate it.

Two things worth knowing for review:

- The `AND t.ScoreModelID = @modelId` predicate on the delete arm is load-bearing. `WHEN NOT MATCHED BY SOURCE` matches every row of the target table, so without it this would delete every *other* model's scores on every recompute.
- The empty-population case is handled separately: `write()` returns early when there is nothing to stage, so the MERGE never runs. It now clears the model's scores instead of returning a no-op, otherwise a filter matching nobody would leave the whole previous population on screen. Safe to read as "nobody in scope" because a failed population query throws in `resolvePopulation` rather than returning empty.

Verified against the demo model (2,000 members): filtering to 66 dropped `Score` from 2000 to 66 while `ScoreHistory` grew 30000 → 30066 and other models stayed at 2000; clearing the filter brought all 2,000 back; a filter matching nobody left 0 scores, 0 contributions and 0 orphans, again with other models untouched.
