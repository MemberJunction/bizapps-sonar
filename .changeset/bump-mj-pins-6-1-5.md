---
"@mj-biz-apps/sonar-actions": patch
"@mj-biz-apps/sonar-ng": patch
"@mj-biz-apps/sonar-core-entities-server": patch
"@mj-biz-apps/sonar-engine": patch
"@mj-biz-apps/sonar-entities": patch
"@mj-biz-apps/sonar-server": patch
---

Require MemberJunction `^6.1.5` (was `^6.1.0-edge.4`). The lockfile pinned `@memberjunction/ng-filter-builder@6.1.0-edge.5`, which predates the `CreateEmptyFilter` / `IsCompositeFilter` exports the model builder uses, so `build-only` failed on `next`. `mj-app.json`'s `mjVersionRange` moves to `>=6.1.5 <7.0.0` to match.
