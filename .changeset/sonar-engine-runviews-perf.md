---
"@mj-biz-apps/sonar-entities": patch
"@mj-biz-apps/sonar-engine": patch
"@mj-biz-apps/sonar-actions": patch
"@mj-biz-apps/sonar-core-entities-server": patch
"@mj-biz-apps/sonar-ng": patch
---

Add shared `SonarEngineBase` (`BaseEngine` + `BaseSingleton` + `@RegisterForStartup`) for bounded Sonar configuration/taxonomy caching with active `ProviderToUse`, RLS-aware `CacheLocal`, `CanRead` gating, `ObserveProperty` streams, and O(1) lookup helpers; collapse unbatched `RunView` waterfalls and N+1 loops into `RunViews` batches with `ResultType: 'simple'` + `Fields`; replace raw SQL subquery in `ScorePersister` with RLS-safe two-step chunked reads; and document the 5-Rule BizApps Performance & Caching Standard in `CLAUDE.md` and `AGENTS.md`.
