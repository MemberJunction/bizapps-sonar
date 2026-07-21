---
"@mj-biz-apps/sonar-entities": minor
"@mj-biz-apps/sonar-engine": minor
"@mj-biz-apps/sonar-core-entities-server": minor
"@mj-biz-apps/sonar-actions": minor
"@mj-biz-apps/sonar-server": minor
"@mj-biz-apps/sonar-ng": minor
---

Bring the 3 Overview stored Queries (Band Trend / Band Flows / Score Movers) to PostgreSQL, closing the parity gap documented in the PG baseline.

These queries' bodies were T-SQL and were deliberately excluded from the PG baseline (`B202607171700`), so a Postgres install had broken Overview analytics while everything else worked. New incremental migration `migrations-pg/V202607201200__v0.3.x_Overview_Queries.pg.sql` seeds all three (Query + parameters + fields + query-entities) with PostgreSQL-dialect SQL and the PostgreSQL `SQLDialectID`. Idempotent (`INSERT ... ON CONFLICT DO NOTHING`). SQL Server is unchanged.

Entity foreign keys (`QueryEntity.EntityID`, `QueryField.SourceEntityID`) are resolved by entity **Name** via subquery, not hardcoded id — the Sonar entity IDs differ between the SQL Server seed and the PG baseline (CodeGen minted fresh ids on PG), so a literal id would FK-violate on a PG install. Names are stable across both.
