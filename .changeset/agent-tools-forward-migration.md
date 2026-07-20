---
"@mj-biz-apps/sonar-entities": minor
"@mj-biz-apps/sonar-engine": minor
"@mj-biz-apps/sonar-core-entities-server": minor
"@mj-biz-apps/sonar-actions": minor
"@mj-biz-apps/sonar-server": minor
"@mj-biz-apps/sonar-ng": minor
---

Move the Sonar Authoring Agent tool-surface seed (AIAgentAction links) out of the released seed migration and into a new forward migration, to fix the v0.2.0 -> v0.3.0 upgrade path.

The agent-tools fix (#24) and its ordering fix (#27) had edited `V202607142340__…_Seed_App_Metadata.sql`, which shipped in v0.2.0. Editing an applied migration changes its Flyway checksum: a fresh install works, but a v0.2.0 -> v0.3.0 upgrade fails validation (checksum mismatch) — and even relaxed, Flyway never re-runs an applied version, so the links would never reach the upgraded install. The seed is now restored byte-for-byte to its v0.2.0 content, and the idempotent AIAgentAction block lives in `V202607202300__v0.3.x_Agent_Tool_Surface.sql`. Running after the seed, the Actions it FK-references already exist (no ordering hazard), and `WHERE NOT EXISTS` makes it safe for fresh installs, upgrades, and re-runs. The seed-lint now checks links across all migrations in execution order.
