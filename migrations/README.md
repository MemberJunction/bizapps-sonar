# Sonar Migrations

Skyway (Flyway-compatible) SQL migrations for the **`__mj_BizAppsSonar`** schema.

## Conventions

- Naming: `V{YYYYMMDDHHMM}__v{VERSION}.x_{DESCRIPTION}.sql` (e.g. `V202606091200__v0.1.x_Initial_Schema.sql`)
- Use `${flyway:defaultSchema}` as the schema placeholder — never hardcode `__mj_BizAppsSonar`
- Use hardcoded UUIDs for seed rows, never `NEWID()`
- Do **not** include `__mj_CreatedAt` / `__mj_UpdatedAt` columns — CodeGen adds them
- Do **not** create indexes for foreign key columns — CodeGen creates them
- Consolidate multiple column additions into a single `ALTER TABLE`
- Add `sp_addextendedproperty` descriptions for every new column (except PKs/FKs)
- CodeGen output migrations land in `migrations/codegen/` (see `mj.config.cjs` `SQLOutput`)

Run with `npm run mj:migrate` from the repo root.

## Generated seed metadata (`V…__Seed_App_Metadata.sql`)

`mj app install` runs migrations only — it does **not** process `metadata/`. So the
app-level config that `mj sync push` loads in dev (score bands, time windows, actions,
queries, remote operations, and the authoring agent) is also baked into a **generated
seed migration** so a clean install gets it.

### ⚠️ The seed is FROZEN — do NOT regenerate it

`V202607142340__v0.1.x_Seed_App_Metadata.sql` **shipped in v0.2.0.** It is a released,
immutable migration. **Never edit or regenerate it.** Changing a released migration
changes its Flyway checksum, which aborts every upgrade (validation failure) — and Flyway
never re-runs an already-applied version, so the change wouldn't land anyway. Regenerating
this seed is exactly what broke the v0.2.0 → v0.3.0 upgrade (see PR #29).

**The old "if you edit `metadata/`, regenerate the seed" workflow is retired.** To add or
change installed config, write a **NEW forward migration** — never touch the seed:

- SQL Server: `migrations/V<newer timestamp>__v<ver>.x_<desc>.sql`
- PostgreSQL parity: `migrations-pg/V<newer>__v<ver>.x_<desc>.pg.sql` (don't forget this —
  a SQL-Server-only fix leaves PG shipping the old config)
- Make inserts idempotent (`IF NOT EXISTS` / `WHERE NOT EXISTS`) and place them AFTER any
  rows they FK-reference (a forward migration runs after the seed, so seed rows exist).
- Template: `V202607202300__v0.3.x_Agent_Tool_Surface.sql` + its `.pg.sql` twin.

**`metadata/` remains the editable dev source of truth** (round-trips via `mj sync`), but
it no longer drives the seed. Caveat: `metadata/agents/.sonar-agent.json` still describes
the agent's 22 `AIAgentAction` links — those are now seeded by the forward migrations
above, NOT the seed. A naive "regenerate the seed from metadata" would wrongly re-add them
to the frozen seed and re-break upgrades.

The full `__mj_BizAppsSonar` data model design is in [`/plans/plan.md` §5](../plans/plan.md).
