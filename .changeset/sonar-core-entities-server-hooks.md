---
"@mj-biz-apps/sonar-core-entities-server": patch
---

Add the ScoreModel server-side lifecycle hooks (plan §5 — published versions are immutable):

- `ScoreModelEntityServer` — server subclass registered over `MJ_BizApps_Sonar: Score Models` (loads after `sonar-entities` so the server subclass wins `@RegisterClass` priority).
- **Publishable validation** (`ValidateAsync` / `validatePublishable`) — cross-record checks that run only on the server, enabled via `DefaultSkipAsyncValidation = false`: a model can't publish without bound factors and a band set.
- **Publish snapshot** (`Save` / `publishWithSnapshot`) — on the publish transition, snapshots the full model config (bound factors + rubric) into a new immutable `ScoreModelVersion`, assigns the next version number, and stamps the version so recomputed scores are reproducible and auditable.
