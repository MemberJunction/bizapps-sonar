---
"@mj-biz-apps/sonar-entities": minor
"@mj-biz-apps/sonar-engine": minor
"@mj-biz-apps/sonar-core-entities-server": minor
"@mj-biz-apps/sonar-actions": minor
"@mj-biz-apps/sonar-server": minor
"@mj-biz-apps/sonar-ng": minor
---

Sonar Authoring Agent reliability: require a data source on authored factors, clearer compiler error, higher iteration limits.

- **Factor authoring requires a data source.** `Sonar: Build Model` and `Sonar: Create Factor` created declarative factors even when no data source was resolved, producing orphaned factors (`SourceRelatedEntityID = NULL`) that the engine can't compile. Both now reject a sourceless declarative factor with an actionable error (name the valid source aliases), so the agent fixes it on retry instead of shipping an uncompilable model.
- **Clearer FactorCompiler error.** A model-owned factor with no source now reports "no data source — link it to a model related entity," instead of the misleading "library factors not supported yet" (which properly refers only to shared `ScoreModelID = NULL` factors).
- **Higher agent run limits (12/18 → 36/64).** Real, MoreCheese-scale authoring legitimately exceeds 12 Loop iterations; runs were aborting at the cap mid-authoring (verified in AIAgentRun logs). Delivered as forward migrations (SQL Server + PG); the seed stays frozen.
