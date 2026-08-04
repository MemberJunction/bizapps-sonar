---
"@mj-biz-apps/sonar-engine": minor
---

PostgreSQL parity for the intervention-layer metadata, so `mj app install` works on PG too.

Same gap as SQL Server, confirmed empirically before fixing: on a freshly provisioned PG database with MJ core plus every `migrations-pg` script applied, all four intervention tables existed and `__mj."Entity"` held zero rows for them — no metadata, no `vw*` views, no CRUD functions.

Generated NATIVELY rather than transpiled. `mj codegen` targets both platforms, so pointing it at a live PostgreSQL database (`DB_PLATFORM=postgresql`) emits PG-dialect objects directly; hand-translating generated T-SQL views and procedures into PL/pgSQL would be lossy. This is also the convention the PG baseline documents for itself ("Extracted verbatim from a post-codegen PostgreSQL database — CodeGen's fixed point"). CodeGen's `${mjSchema}` placeholder is replaced with the literal `__mj` to match every other file in `migrations-pg`.

Verified by provisioning a throwaway PG 17 container from scratch, applying MJ core and all `migrations-pg` scripts with no CodeGen step, and confirming parity with SQL Server: four entities registered with 14/10/8/11 fields and three permission grants each, `Kind` registered as a value list of Action/BulkSync/TrackOnly, 3 views and 12 CRUD functions present, and a model → segment → BulkSync intervention round-tripping through the generated functions and reading back through the generated view with its FK display column resolved.

Two platform issues found along the way, both upstream in MJ core and both documented in the migration header:

- **The v0.2.x PG baseline requires PostgreSQL 17+.** Its `pg_dump` preamble includes `SET transaction_timeout = 0`, which does not exist in PG 16, so applying `migrations-pg` to a PG 16 database fails on the baseline with "unrecognized configuration parameter".
- **`spDeleteUnneededEntityFields` is unrunnable on PG at v5.45.** It joins `__mj."vwEntities"` and filters on `e."ExternalDataSourceID"`, a column that view does not expose on PostgreSQL, so the call fails and takes the whole migration down. CodeGen emits that call, so it is removed here with an explanatory comment — the step prunes `EntityField` rows for columns that no longer exist, and a migration that only adds entities has nothing to prune.
