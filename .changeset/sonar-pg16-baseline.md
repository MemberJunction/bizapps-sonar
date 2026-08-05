---
"@mj-biz-apps/sonar-engine": patch
---

Fix the PostgreSQL baseline failing on every PostgreSQL 16.x server.

`migrations-pg/B202607171700__v0.2.x_Schema_and_Tables.pg.sql` was produced by `pg_dump` 17, whose header emits `SET transaction_timeout = 0`. That GUC is new in PostgreSQL 17, and an unrecognized configuration parameter is an `ERROR` rather than a warning, so the baseline aborted at its own header on every 16.x server. Sonar's PostgreSQL install was completely broken there: first migration, first statement block. Nothing in the schema needed the setting (0 is the default), so it is removed rather than guarded.

The README claimed "PostgreSQL 17+", which described what had been tested rather than what is supported. It now says 16.x or later, verified on 16.11.

Adds `migrations-pg/docs/PG_INSTALL_VERIFICATION.md`, a fresh-install runbook that pins the **oldest** supported major and explains why. A version-pinned test on the newest major cannot see this class of bug: dump headers are exactly the thing that varies by server version, and they fail closed.

Ships in #52; this changeset only adds the release note, which the original PR did not include.
