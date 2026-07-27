---
"@mj-biz-apps/sonar-engine": minor
"@mj-biz-apps/sonar-actions": minor
"@mj-biz-apps/sonar-ng": minor
---

Show the real scored population in the Model Builder header, instead of the anchor entity's total.

The header ran a bare whole-entity `count_only` and printed it as the scope, so a model narrowed to 66 members still read "**2,000** in population". A previous pass reworded it to "filtered subset of 2,000" so it stopped being actively wrong, but the actual number was still unavailable to the UI.

The reason it was unavailable is that the population filter is compiled to SQL by the engine (`RecomputeOrchestrator.compilePopulationFilter`). Counting it in the browser would mean re-implementing a security-sensitive compiler client-side and handing the client a SQL-building surface, so the count is now answered where the compiler already lives:

- **`RecomputeOrchestrator.countPopulation()`** returns `{ scoped, total, filtered }`. Two `count_only` reads — deliberately not `resolvePopulation().length`, which pulls every primary key in the population (uncapped, `IgnoreMaxRows`) just to take a length. When there is no filter the second query is skipped and `scoped === total`.
- **`Sonar: Count Population`** Action (`DriverClass` `SonarCountPopulation`) exposes it. Read-only, nothing scored, nothing persisted, safe on a draft. Also linked to the Sonar Authoring Agent, since "how many members does this model score?" is a question it gets asked.
- The header now reads "**66 of 2,000** in population" when a filter narrows the scope, and plain "2,000 in population" when it doesn't. `populationIsFiltered` derives from the engine's own answer rather than the UI toggle, so it reflects what is actually persisted rather than what is on screen. The count refreshes on model load and after every filter save (cheap enough to run on each).

Registered via a forward migration plus its PostgreSQL twin, not by editing the frozen v0.2.0 seed. The `ActionCategory` and `AIAgent` are resolved **by name** rather than by hardcoded ID, because the PostgreSQL baseline registers core metadata under different IDs than SQL Server. Every insert is guarded on its natural key, so the migration is idempotent on a fresh install, an upgrade, or a re-run (verified by applying it twice).
