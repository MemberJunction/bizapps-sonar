---
"@mj-biz-apps/sonar-engine": patch
---

Build against MemberJunction `next`, where `RecordSetProcessOptions` members are PascalCase. `ScorePersister` passed `source`, `processor`, `tracker`, `contextUser` and the rest in camelCase, so the engine failed to compile (TS2561 at `ScorePersister.ts:109`), and MJAPI could not load `sonar-server` from the incomplete build.
