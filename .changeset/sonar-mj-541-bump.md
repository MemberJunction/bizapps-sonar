---
"@mj-biz-apps/sonar-server": patch
"@mj-biz-apps/sonar-ng": patch
"@mj-biz-apps/sonar-actions": patch
"@mj-biz-apps/sonar-entities": patch
"@mj-biz-apps/sonar-engine": patch
"@mj-biz-apps/sonar-core-entities-server": patch
---

Align all `@memberjunction/*` dependencies to exact `5.41.0` to match the DB's core metadata version.

The Sonar_Demo DB is migrated to MJ core v5.41.x, but the packages were pinned at 5.40.2 — behind the DB. That skew broke the copilot: the 5.40.2 server GraphQL schema lacked the `AgentSessionID` field the 5.41.x DB/client expect, so messages failed to post and agent replies never linked back to the conversation. Pinning to 5.41.0 fixes it natively and drops the fragile node_modules stopgap.

- **Exact pins, not caret** — MJ publishes exact sibling versions, so a single `^` entry resolves to 5.45 and cascades the whole tree (plus nested dual-core copies). Every `@memberjunction/*` is pinned to `5.41.0`.
- **Not latest (5.45)** — 5.42–5.45 packages expect core `__mj` entities this DB lacks (e.g. `MJ: AI Agent Co Agents`), which breaks the AI-engine metadata load and the agent runtime; the core migrations to reach 5.45 aren't distributed in this repo. 5.41.0 is the newest version that matches this DB.
- **No DB migration or CodeGen needed** — the DB is already at 5.41.x and the Sonar schema is unchanged. Full monorepo build passes and the copilot is verified end-to-end at 5.41.0.
