---
"@mj-biz-apps/sonar-actions": patch
"@mj-biz-apps/sonar-ng": patch
"@mj-biz-apps/sonar-core-entities-server": patch
"@mj-biz-apps/sonar-engine": patch
"@mj-biz-apps/sonar-entities": patch
"@mj-biz-apps/sonar-server": patch
---

Ship metadata the way MJ and the other Open Apps do: PRs carry declarative JSON under `metadata/` only, and the build engineer generates one consolidated `Metadata_Sync` migration per release. The per-PR content-hash manifest (`migrations/metadata-seed.manifest.json`, `pnpm run seed:manifest`) and the `changes.yml` metadata↔migration tripwire are retired, so metadata-only PRs are no longer red. `publish.yml` now runs the release-readiness gates ported from bizapps-common (`check:release-seed`, `check:seed-cadence`), so a release whose metadata is ahead of its seed fails before anything is published. The distribution gate keeps its placeholder check for both dialects and teardown. Tooling and docs only; no runtime code in the published packages changes.
