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

The full `__mj_BizAppsSonar` data model design is in [`/plans/plan.md` §5](../plans/plan.md).
