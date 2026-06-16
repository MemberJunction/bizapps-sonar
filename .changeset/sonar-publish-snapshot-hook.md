---
"@mj-biz-apps/sonar-core-entities-server": patch
---

Add the `ScoreModelEntityServer` publish-snapshot hook. When a `ScoreModel` transitions to `Status='Active'`, its full configuration (model fields, related-entity map, factors, rubric, and bands) is frozen into a new immutable `ScoreModelVersion`, the prior current version is demoted, and `ScoreModel.CurrentVersionID` is repointed at the new version — all within a single transaction group so the publish, the snapshot, and the back-pointer commit atomically or not at all. `CurrentVersionID` is the source of truth for "which version is live"; `IsCurrent` is maintained as a denormalized mirror for version-table read locality.
