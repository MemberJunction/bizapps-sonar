---
"@mj-biz-apps/sonar-server": patch
"@mj-biz-apps/sonar-ng": patch
"@mj-biz-apps/sonar-actions": patch
"@mj-biz-apps/sonar-entities": patch
"@mj-biz-apps/sonar-engine": patch
"@mj-biz-apps/sonar-core-entities-server": patch
---

Upgrade all `@memberjunction/*` dependencies to exact `5.45.0` (latest), moving Sonar onto the current MemberJunction platform.

**Requires the database core to be at MJ 5.45.** Packages and the `__mj` core schema must match — the server generates its GraphQL from DB metadata and the AI engine reads agent config from core tables. Bring a database up with:

```
mj migrate --tag v5.45.0        # __mj core -> 5.45 (Skyway baseline + delta)
mj migrate --schema __mj_BizAppsSonar --dir ./migrations   # Sonar app schema
mj codegen                      # register entities, build views/sprocs
```

Notes:
- **Exact pins, not caret** — MJ publishes exact sibling versions, so a single `^` cascades the whole tree (and creates nested dual-core copies). Every `@memberjunction/*` is `"5.45.0"`.
- Verified end-to-end against a freshly-provisioned 5.45 database (clean boot with no metadata skew, all surfaces render, copilot agent runs and replies).
- Supersedes the interim 5.41.0 alignment (which matched an older demo DB). 5.45 is the current platform; the DB is migrated forward to match rather than pinning packages back.
