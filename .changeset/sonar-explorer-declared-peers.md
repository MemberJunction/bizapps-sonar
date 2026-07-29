---
"@mj-biz-apps/sonar-ng": patch
---

Declare two unmet peer dependencies so a fresh clone can build MJExplorer.

`@memberjunction/ng-auth-services` peer-depends on `@workos-inc/authkit-js` and `@memberjunction/ng-explorer-service-worker` on `@angular/service-worker`, but nothing in this repo declared either. With `legacy-peer-deps=true` in `.npmrc` (required repo-wide for Angular 21's strict peer ranges) npm skips unmet peers entirely, so neither package was ever in the lockfile — they only existed in `node_modules` incidentally, and any `npm install` that pruned them left `ng build` failing on unresolved imports. Both are now declared in `apps/MJExplorer/package.json` at their peer ranges, making the install reproducible.

Also adds vitest to the Angular package (the `test` script was a placeholder) and excludes test files from the `ngc` build, so `dist` doesn't ship test code importing a dev-only dependency.
