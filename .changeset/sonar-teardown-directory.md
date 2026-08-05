---
"@mj-biz-apps/sonar-engine": patch
---

Uninstall now removes Sonar's rows from MemberJunction's shared core schema, instead of orphaning them.

Sonar's migrations seed ~225 rows into `__mj` (24 Actions, the authoring Agent with its Prompt and Template, the 3 Overview Queries and their fields/params). Those rows have no foreign-key path back to Sonar's own entities, so the engine's FK-graph walk cannot reach them and `mj app remove` left every one of them in the customer's database. A later reinstall then collided with them under the same hardcoded GUIDs. Fixes #51.

The fix is a `migrations.teardownDirectory` in `mj-app.json`, which `@memberjunction/open-app-engine` runs on remove and on the compensation path when an install fails partway.

**Three things turned out to be bigger than the issue described**, all of them found by running the teardown against a real database rather than reading the migrations:

- **Seed-only deletion is not enough.** Sonar's Actions and Agent accumulate runtime rows the moment they are *used* — `ActionExecutionLog`, `AIAgentRun` and its steps, `AIPromptRun`, `AIResultCache`, `AIAgentSession`, `QuerySQL`. `ActionExecutionLog.ActionID` is `NOT NULL`, so one Action run is enough to make `DELETE FROM Action` fail with FK 547, and since the engine runs the whole teardown in one transaction, that means nothing is cleaned up at all. An install that was never exercised tears down fine, which is why an install-then-remove test cannot see this. The verified run removes 3,996 `ActionExecutionLog` rows and 508 `AIAgentRunStep` rows alongside the 225 seeded ones.

- **PostgreSQL needs its own directory.** The engine prefers `<teardownDirectory>-pg/` and falls back to the SQL Server one if it is absent. These scripts use `[bracket]` quoting, so the fallback would abort a PostgreSQL uninstall on its first statement. `migrations-teardown-pg/` ships alongside. It is also genuinely a different script, not a transliteration: the `QueryEntity` / `QueryField` / `QueryParameter` rows carry **different GUIDs** on the two platforms.

- **Child rows must be scoped by parent, not by literal ID.** Deleting `ActionParam` by the 63 IDs the seed wrote breaks as soon as any later migration adds a param to an existing Action, leaving a row that blocks the parent DELETE. Open PR #40 does exactly that, which is why the verified run deletes 64. Scoping by `ActionID IN (<Sonar's Actions>)` is still bounded by Sonar's hardcoded GUIDs, and it makes the `Query` children immune to the cross-platform GUID divergence.

**Safety.** The scripts split on FK nullability. A `NULL`-able reference into a Sonar row means the referencing row is valid without Sonar and is usually the customer's own — a `Conversation` whose default agent was Sonar's, a `Task` assigned to it — so phase 1 nulls the pointer and leaves the row standing. Only `NOT NULL` dependants, which cannot exist without Sonar, are deleted. Nothing matches on name or prefix; every predicate resolves to Sonar's hardcoded seed GUIDs directly or through a subquery chain.

Verified on SQL Server 2022 by running the full teardown inside a transaction and rolling back, diffing row counts for **every** table in `__mj`: 84 statements, 4,826 rows removed, no FK error, and no change to `Conversation`, `Task` or `EntityDocument`. The PostgreSQL twin was executed against a real PostgreSQL 16 instance to confirm its syntax and identifier quoting.

The scripts are generated, not hand-written — `ci/generate_teardown.mjs` reads the FK graph from a live `__mj` and topologically sorts it, and `ci/extract_ids*.py` pull the seeded GUIDs out of the migrations. Regeneration instructions are in `migrations-teardown/README.md`.
