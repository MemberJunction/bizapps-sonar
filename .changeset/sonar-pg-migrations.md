---
"@mj-biz-apps/sonar-entities": minor
"@mj-biz-apps/sonar-engine": minor
"@mj-biz-apps/sonar-core-entities-server": minor
"@mj-biz-apps/sonar-actions": minor
"@mj-biz-apps/sonar-server": minor
"@mj-biz-apps/sonar-ng": minor
---

Add PostgreSQL install support, following the bizapps family convention (bizapps-common, issues, tasks, forms all ship `migrations-pg/`).

- **`migrations-pg/B202607142340...` one-shot baseline** (`B…__Schema_and_Tables.pg.sql`): the full `__mj_BizAppsSonar` schema + CRUD functions + views + triggers + entity registration + app-level seed (score bands, time windows, 23 actions, remote op, authoring agent), extracted from a post-codegen + post-seed PostgreSQL database (CodeGen's fixed point). Installs one-shot via `mj migrate` alone — verified on a fresh PG core (14 tables, 42 functions, 14 views, 14 registered entities, full seed) with no `mj codegen` step.
- **`mj:migrate:convert` / `mj:migrate:pg`** scripts wired into package.json.
- **Known gap:** the 3 Sonar Overview stored Queries are T-SQL and are not yet ported to PostgreSQL (documented in the baseline header); PG rewrites are a follow-up.
