---
"@mj-biz-apps/sonar-entities": minor
"@mj-biz-apps/sonar-engine": minor
"@mj-biz-apps/sonar-core-entities-server": minor
"@mj-biz-apps/sonar-actions": minor
"@mj-biz-apps/sonar-server": minor
"@mj-biz-apps/sonar-ng": minor
---

PostgreSQL parity for the Sonar Authoring Agent tool surface.

The PG baseline seeds the agent and all 23 actions but zero AIAgentAction links, so a Postgres install got a toolless agent — the same bug #24 fixed for SQL Server, on the other platform. Adds `migrations-pg/V202607202301__v0.3.x_Agent_Tool_Surface.pg.sql` with the 22 links (agent + action IDs are seed-hardcoded, identical across dialects; idempotent WHERE NOT EXISTS; runs after the baseline so the FK-referenced actions exist). The seed-lint now validates BOTH migrations/ (SQL Server) and migrations-pg/ (PostgreSQL). Verified end-to-end on a fresh MJ-core-on-Postgres-17: full baseline + queries + agent-tools applied clean, agent has 22 tools, 0 orphan FK links.
