---
"@mj-biz-apps/sonar-ng": patch
"@mj-biz-apps/sonar-actions": patch
---

Declare missing dependencies.

- `sonar-ng` imported `ng-apexcharts` (and its `apexcharts` peer) without declaring them, so the Sonar client failed to bundle in Explorer on any host that didn't already have them. Added both to `dependencies`.
- `sonar-actions` imported `@memberjunction/ai-agents` and `@memberjunction/ai-core-plus` without declaring them. Added both to `peerDependencies` at `^5.45.0`, matching the other MemberJunction peers.
- Declared `vitest` in `sonar-actions` devDependencies — its `test` script already invoked `vitest run` without declaring it.
