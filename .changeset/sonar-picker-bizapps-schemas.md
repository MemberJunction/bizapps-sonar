---
"@mj-biz-apps/sonar-ng": patch
---

Stop the anchor and factor-source pickers from hiding other MJ business apps.

The pickers filtered entities with a `!SchemaName.startsWith("__mj")` prefix test, which excluded every other MJ business app along with MJ core — anything under `__mj_BizApps*` (Committees, Common, Tasks, …) was silently unselectable as an anchor or a factor source.

The scoring engine and the agent's entity-discovery actions already scoped correctly, excluding an exact list (`__mj` and Sonar's own `__mj_BizAppsSonar`), so the UI was the only place that over-filtered — despite `Engine/src/metadata/entityScope.ts` existing to keep the two from drifting. All five UI call sites now go through a client-side mirror of that helper (`custom/core/entity-scope.ts`, following the existing `entity-graph.ts` pattern, since the engine package is server-only and can't be imported into the browser bundle).
