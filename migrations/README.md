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

**The `metadata/` dirs remain the editable, round-trippable source of truth.** The seed
migration is a point-in-time snapshot. This means:

- **If you edit any config in `metadata/` (bands, windows, actions, queries, agent,
  prompt, template, remote ops), you MUST regenerate the seed migration**, or a fresh
  install ships stale config while dev (via push) shows the new. The exact regen steps
  are in the header of `V202607142340__v0.1.x_Seed_App_Metadata.sql`.
- The seed guards every `spCreate` with `IF NOT EXISTS`, so it is idempotent and safe to
  run against a dev DB already loaded via `mj sync push` (no PK violations).

The full `__mj_BizAppsSonar` data model design is in [`/plans/plan.md` §5](../plans/plan.md).
