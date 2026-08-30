---
"@mj-biz-apps/sonar-actions": minor
"@mj-biz-apps/sonar-core-entities-server": minor
"@mj-biz-apps/sonar-engine": minor
"@mj-biz-apps/sonar-entities": minor
"@mj-biz-apps/sonar-ng": minor
"@mj-biz-apps/sonar-server": minor
---

Make Sonar compatible with MemberJunction 6.1.0-edge.4.

Every `@memberjunction/*` dependency, peer dependency and root override moves
from `5.45.0` / `^5.45.0` to `^6.1.0-edge.4` (74 references across all
package.json files), and `mj-app.json` `mjVersionRange` widens from
`>=5.45.0 <6.0.0` to `>=6.1.0-edge.4 <7.0.0`.

This unblocks tenants on MJ 6.x, where the previous pins caused `npm ci` to
fail with ERESOLVE against the 5.x peers and `mj app install` to hard-reject
the manifest on its version range.

No Sonar source changes were required — the MJ 5.45 to 6.1 delta was
additive across every API this app consumes (`Metadata`, `BaseEntity`,
`RunView`, `actions-base`, `ng-base-forms` and the other Angular surfaces).
All 189 unit tests and the full Turborepo build pass against 6.1.0-edge.4.

The caret pin (`^6.1.0-edge.4`) rather than an exact pin lets tenants pick up
6.x patch and minor releases without a Sonar republish.
