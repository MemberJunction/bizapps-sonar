# Demo sandbox — `Sonar_Demo`

A **throwaway sandbox database** for demoing/testing Sonar against realistic third-party
association data — and, because it's a full clone, a real-data **dev environment you can point
the stack at** whenever that's useful. Fully isolated from the working `Sonar_Dev` DB and
`DROP`-able at any time. See [../plans/demo.md](../plans/demo.md) for the design + demo script.

- **`Sonar_Demo`** = a clone of `Sonar_Dev` (full MJ + Sonar stack) on the same `sql_server_dev`
  container, plus a `membership` business schema (Pattern 1: data lives in the MJ DB).
- Runs on its **own port (API 4112)** so it coexists with the `Sonar_Dev` stack (API 4102 /
  Explorer 4302) — nothing to stop.
- **Nothing here ships:** the `membership` schema, data, and generated entity *metadata* live only
  in `Sonar_Demo`; no demo entity code is committed to `packages/`. Not part of `mj:migrate`.
- **Teardown = `DROP DATABASE Sonar_Demo`** — zero residue in the main repo or DB.

## Reproducible setup (from repo root)
All scripts read DB creds from the root `.env`; none contain secrets.
```bash
npm run demo:db:clone     # BACKUP Sonar_Dev → RESTORE AS Sonar_Demo (needs a sysadmin login)
npm run demo:db:load      # apply membership-schema.sql + membership-seed.sql to Sonar_Demo
npm run mj:codegen:demo   # register membership tables as MJ entities in Sonar_Demo (--skipfiles: no repo churn)
npm run start:api:demo    # run the API against Sonar_Demo on :4112 (coexists with Dev on :4102)
```

## Files
- `clone-db.cjs` — clones `Sonar_Dev` → `Sonar_Demo` (BACKUP/RESTORE, same instance). Env-driven.
- `membership-schema.sql` — the `membership` schema + 5 tables (Member anchor + EventRegistration, EmailEngagement, Payment, Certification), with FK constraints.
- `membership-seed.sql` — ~15 members across Healthy/Neutral/At-Risk/Lapsed profiles + activity.
- `apply-to-demo.cjs` — applies GO-batched `.sql` file(s) to `Sonar_Demo`. Env-driven.
- `demo.env` — env overlay (`DB_DATABASE=Sonar_Demo`, `GRAPHQL_PORT=4112`); no secrets.
- `codegen/mj.config.cjs` — sandbox CodeGen config (post-codegen hooks + SQLOutput disabled).
- `codegen/run.sh` — loads `.env` + `demo.env`, runs `mj codegen --skipfiles` with the sandbox config.

## How the env precedence works
The `*:demo` scripts pre-seed `DB_DATABASE=Sonar_Demo` (+ `GRAPHQL_PORT=4112`) into the
environment *before* the app loads the root `.env`. Since `dotenv` won't overwrite an
already-set var, the demo values win while everything else still comes from `.env` — we overlay
two keys, not the whole file. `start:api:demo` invokes MJAPI directly (not via `turbo start`,
whose strict env mode would filter the override out).

## Not done yet
- **UI against the sandbox:** a demo Explorer on its own port pointing at the :4112 API (Angular
  env change) — part of "run the full stack," deferred.
- **Verify scoring end-to-end:** author the demo model (anchor = `Members`) and Simulate/Recompute.

## Teardown
```sql
DROP DATABASE Sonar_Demo;   -- on sql_server_dev
```
