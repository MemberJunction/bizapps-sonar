---
"@mj-biz-apps/sonar-ng": patch
"@mj-biz-apps/sonar-actions": patch
---

Fix Open App install on a host that doesn't already have Sonar's dependencies.

- `sonar-ng` imported `ng-apexcharts` (and its `apexcharts` peer) without declaring them, so the Sonar client failed to bundle in Explorer on any host that didn't already have them. Added both to `dependencies`.
- `sonar-actions` imported `@memberjunction/ai-agents` and `@memberjunction/ai-core-plus` without declaring them. Added both to `peerDependencies` at `^5.45.0`, matching the other MemberJunction peers.
- Declared `vitest` in `sonar-actions` devDependencies — its `test` script already invoked `vitest run` without declaring it.
- `mj-app.json`: moved `sonar-actions` from `shared` to the `server` package list (`role: "actions"`). It is a server-only package — nothing in `sonar-ng` imports it — but as `shared` the installer wired it into the client's `dynamicPackages`, pulling server-side code (and its Node built-in imports) into the Explorer browser bundle and breaking the client build with `Could not resolve "stream"`.
