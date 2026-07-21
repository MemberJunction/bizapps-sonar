---
"@mj-biz-apps/sonar-entities": minor
"@mj-biz-apps/sonar-engine": minor
"@mj-biz-apps/sonar-core-entities-server": minor
"@mj-biz-apps/sonar-actions": minor
"@mj-biz-apps/sonar-server": minor
"@mj-biz-apps/sonar-ng": minor
---

Sonar Authoring Agent reliability: validate authored factors (data source + aggregate field), clearer compiler error, higher iteration limits.

- **Factor authoring is validated against the real schema.** `Sonar: Build Model` and `Sonar: Create Factor` created declarative factors even when (1) no data source was resolved — yielding orphaned factors (`SourceRelatedEntityID = NULL`) — or (2) a column-referencing field (`aggregateFieldName` or `dateField`) wasn't a real column on the source entity (weak models hallucinate names like `TotalAmount` for a `TotalGross` column, or `duration_days` for a column that doesn't exist). Both cases only surfaced at compile/recompute time. Both actions now reject them up front with actionable errors (valid source aliases / valid columns), so the agent self-corrects in-run instead of shipping an uncompilable model. (FilterExpression is free-form SQL — left to the engine, not column-parsed.)
- **Prompt hint.** The agent's system prompt now tells it to take the exact `aggregateFieldName`/`dateField` from the columns `Sonar: List Related Entities` returns, never invent one — so it leans on the new column data deliberately. Delivered as a forward migration (SQL Server + PG) patching the seeded `TemplateContent`; the frozen seed is untouched.
- **Column visibility for the agent.** `Sonar: List Related Entities` now returns each candidate source's `columns` (name + type + a `numeric` flag), so the agent picks a real `aggregateFieldName` from the list instead of guessing one — attacking the hallucination at the source (proactive), where the validation above is the reactive backstop.
- **Clearer FactorCompiler error.** A model-owned factor with no source now reports "no data source — link it to a model related entity," instead of the misleading "library factors not supported yet" (which properly refers only to shared `ScoreModelID = NULL` factors).
- **Higher agent run limits (12/18 → 36/64).** Real, MoreCheese-scale authoring legitimately exceeds 12 Loop iterations; runs were aborting at the cap mid-authoring (verified in AIAgentRun logs). Delivered as forward migrations (SQL Server + PG); the seed stays frozen.
