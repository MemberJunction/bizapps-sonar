---
"@mj-biz-apps/sonar-actions": patch
"@mj-biz-apps/sonar-ng": patch
"@mj-biz-apps/sonar-core-entities-server": patch
"@mj-biz-apps/sonar-engine": patch
"@mj-biz-apps/sonar-entities": patch
"@mj-biz-apps/sonar-server": patch
---

Migrate the repository to pnpm (pnpm@10.33.0, pnpm-lock.yaml, pnpm-aware CI and release scripts) and remove the private MJAPI/MJExplorer dev harness, matching the bizapps family baseline. No runtime code in the published packages changes.
