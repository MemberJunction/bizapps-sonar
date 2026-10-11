# Verifying Sonar on PostgreSQL (one-shot install, no CodeGen)

This runbook simulates what `mj app install` does to a PostgreSQL database and
verifies Sonar is **fully functional without ever running `mj codegen`**.

## 0. Fresh PostgreSQL — use the OLDEST version we support

```bash
docker run -d --name sonar-pg-test \
  -e POSTGRES_USER=mj_admin -e POSTGRES_PASSWORD=<pw> \
  -e POSTGRES_DB=SONAR_Test -p 5436:5432 postgres:16.11
```

**Test on 16.x, not 17.** This is not a style preference — it caught a real
outage. `migrations-pg/B202607171700` was produced by `pg_dump` 17, whose header
emits `SET transaction_timeout = 0`. That GUC is **new in PostgreSQL 17**, and an
unrecognized configuration parameter is an `ERROR`, not a warning — so the entire
baseline failed at its own header on every 16.x server, while passing on 17. A
version-pinned test on the newest major is a test that cannot see this class of
bug.

When you regenerate the baseline, run `pg_dump` from the **oldest** supported
major. Then re-run this runbook on it.

MJ core's migrations `GRANT` to three roles that do not exist on a virgin
cluster; create them first, or migration 1 fails with
`role "cdp_Developer" does not exist`:

```bash
for r in cdp_Developer cdp_Integration cdp_UI; do
  psql -h localhost -p 5436 -U mj_admin -d postgres -c "CREATE ROLE \"$r\";"
done
```

## 1. Point the MJ CLI at it

```bash
export DB_PLATFORM=postgresql DB_HOST=localhost DB_PORT=5436 \
  DB_DATABASE=SONAR_Test DB_USERNAME=mj_admin DB_PASSWORD=<pw> \
  CODEGEN_DB_USERNAME=mj_admin CODEGEN_DB_PASSWORD=<pw> DB_ENCRYPT=false
```

`CODEGEN_DB_*` is required even for migrate — the CLI opens its admin connection
with those credentials.

## 2. Platform install

```bash
pnpm mj migrate --tag v5.51.0        # expect: 25 applied on a virgin DB
```

Do **not** run plain `pnpm mj migrate` — without `--tag` it uses this repo's local
migrations directory, not MJ core's.

## 3. Simulate `mj app install`

```bash
psql -h localhost -p 5436 -U mj_admin -d SONAR_Test \
  -c 'CREATE SCHEMA IF NOT EXISTS __mj_bizappssonar;'

pnpm mj migrate --schema __mj_BizAppsSonar --dir ./migrations-pg   # expect: 7 applied
```

**Do not run codegen. That is the point of the test.**

## 4. Verify

```sql
SELECT 'tables' AS check, count(*)::text AS n FROM information_schema.tables
  WHERE table_schema='__mj_bizappssonar' AND table_type='BASE TABLE'
UNION ALL SELECT 'base views', count(*)::text FROM information_schema.views
  WHERE table_schema='__mj_bizappssonar'
UNION ALL SELECT 'crud functions', count(*)::text FROM pg_proc p
  JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='__mj_bizappssonar' AND p.proname LIKE 'sp%'
UNION ALL SELECT 'entities registered', count(*)::text FROM __mj."Entity"
  WHERE LOWER("SchemaName")='__mj_bizappssonar'
UNION ALL SELECT 'entity fields', count(*)::text FROM __mj."EntityField" f
  JOIN __mj."Entity" e ON e."ID"=f."EntityID" WHERE LOWER(e."SchemaName")='__mj_bizappssonar'
UNION ALL SELECT 'Sonar actions', count(*)::text FROM __mj."Action" WHERE "Name" LIKE 'Sonar%';
```

Expected on a fresh install (measured on PostgreSQL 16.11, MJ 5.51.0, CLI 5.51.0):

| check | n |
|---|---|
| tables | 14 |
| base views | 14 |
| crud functions | 42 |
| entities registered | 14 |
| entity fields | 235 |
| Sonar actions | 24 |

## 5. Prove codegen is a no-op

```bash
pnpm mj codegen
```

Then diff a snapshot of Sonar's entity / field / relationship / permission
metadata plus `pg_proc` and `information_schema.views` from before and after: it
must be **empty**. Measured: 0 lines.

Afterwards, restore what codegen rewrote:

```bash
git checkout -- packages apps
git clean -fd packages apps     # codegen emits forms for every app sharing the DB
rm -rf temp_sql_scripts
```

## Things that look wrong but aren't

- **`pnpm mj codegen` exits 1 with "No suitable model found for prompt CodeGen:
  Check Constraint Parser"** if the environment has no AI provider credentials.
  That is CodeGen's LLM-backed constraint parser, not a database problem — the
  metadata diff is still empty.
- **Codegen writes form components for other apps** sharing the test database
  (Caliber, Common, …). It is not schema-scoped by default; `git clean` them.

## Maintenance contract

When a future schema change regenerates any CRUD function, view, or trigger, the
new definition must be captured into the corresponding PG migration — otherwise a
fresh PG install silently ships the stale one. **The no-op check in step 5 is the
regression test for this**, and step 0's version choice is the regression test for
dump-header portability.
