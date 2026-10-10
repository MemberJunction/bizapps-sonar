# Sonar Migrations

Skyway (Flyway-compatible) SQL migrations for the **`__mj_BizAppsSonar`** schema. The PostgreSQL
twins live in [`../migrations-pg/`](../migrations-pg/).

## Conventions

- Naming: `V{YYYYMMDDHHMM}__v{VERSION}.x_{DESCRIPTION}.sql` (e.g. `V202606091200__v0.1.x_Initial_Schema.sql`)
- Use `${flyway:defaultSchema}` as the schema placeholder — never hardcode `__mj_BizAppsSonar`
- Use hardcoded UUIDs for seed rows, never `NEWID()`
- Do **not** include `__mj_CreatedAt` / `__mj_UpdatedAt` columns — CodeGen adds them
- Do **not** create indexes for foreign key columns — CodeGen creates them
- Consolidate multiple column additions into a single `ALTER TABLE`
- Add `sp_addextendedproperty` descriptions for every new column (except PKs/FKs)
- CodeGen output migrations land in `migrations/codegen/` (see `mj.config.cjs` `SQLOutput`)
- **Never edit an applied migration.** It changes the Flyway checksum and aborts every upgrade.

Run with `pnpm run mj:migrate` from the repo root.

## How metadata reaches an install

**For metadata, this directory is the only thing that ships.** `mj-app.json` names a `metadata`
directory, but MJ's install engine **never reads it**: `mj app install` and upgrade run migrations
only. A record that exists only because someone ran `mj sync push` on their laptop exists only on
that laptop.

Sonar follows MJ's release-time model, the same as MJ core and the other Open Apps
([Release Metadata Migrations Guide](https://github.com/MemberJunction/MJ/blob/next/guides/RELEASE_METADATA_MIGRATIONS_GUIDE.md),
`MJ/metadata/CLAUDE.md` §1b). The process below mirrors
[bizapps-common's `migrations/README.md`](https://github.com/MemberJunction/bizapps-common/blob/next/migrations/README.md),
itself ported from bizapps-forms.

```
your PR:      edit metadata/ (declarative JSON only)  →  commit  →  review
the release:  mj sync push against a clean DB  →  ONE consolidated Metadata_Sync  →  ship
```

**A feature PR carries no metadata SQL.** No `Metadata_Sync`, and no hand-written "forward
migration" that inserts or updates metadata rows. It carries the JSON: fields, `@lookup` / `@file` /
`@parent` references, a `primaryKey` UUID from `uuidgen`, and no `sync` block (the release push
writes that back). A metadata-only PR without a migration is **correct**, and no PR gate fails it.
The build engineer takes everything merged on `next` and generates one consolidated seed for the
release.

A migration that is not metadata is unchanged: schema DDL plus its CodeGen half ships in the feature
PR that needs it, with a `minor` changeset.

### Sonar's history: frozen, append-only

These shipped, have been applied on hosts, and are **never edited or deleted**:

| File | What it is |
|---|---|
| `V202607142340__v0.1.x_Seed_App_Metadata.sql` | The v0.1 seed (182 records), shipped in v0.2.0. Editing it broke the v0.2.0 → v0.3.0 upgrade (#29). |
| `V202607202300__v0.3.x_Agent_Tool_Surface.sql`, `…Agent_Iteration_Limits`, `…Agent_Prompt_Column_Hint`, `…v0.5.x_Agent_Model_Selection`, `…Count_Population_Action`, `…Agent_MissingDataPolicy` (+ PG twins) | Hand-written forward metadata migrations from the period when Sonar delivered every metadata change that way. That model is **retired**; do not add to it. |

The records these files create are declared under `metadata/` with the **same primaryKey** —
including the authoring agent's `AIAgentAction` links in `metadata/agents/.sonar-agent.json` — and
`check:release-seed` passes on that today (every metadata UUID is named by this chain). That is what
lets the release push diff cleanly against them: a generation database built from these migrations
already has those rows, so the push emits nothing for an unchanged record and `spUpdate*` for an
edited one. (The old warning that "regenerating the seed re-adds the agent links" was about editing
the frozen v0.1 file; a new seed generated on top of the chain does not duplicate them.) Keep it that way — a new record gets its
UUID from `uuidgen` in the JSON, not from a migration.

### The gates

| Command | Runs | Asks |
|---|---|---|
| `pnpm run lint:distribution` | every PR (`distribution-gate.yml`) and `publish.yml` | Does shipped SQL — both dialects and both teardown sets — use only placeholders `mj app install` supplies (`${flyway:defaultSchema}`, `${mjSchema}`)? It does **not** ask whether metadata is current with a seed. |
| `pnpm run check:release-seed` | `publish.yml` only | Does every `primaryKey` UUID under `metadata/` appear in some `migrations/*.sql`? Its output is the list the next seed still owes. |
| `pnpm run check:seed-cadence` | `publish.yml` only | At most one unreleased `Metadata_Sync`; not zero when `metadata/` moved since the last `v*` tag; and that seed is non-empty and not older than any later metadata change. |

The two release gates fail **between releases by design** — `metadata/` is normally ahead of the last
seed until the build engineer generates the next one — so they are not PR gates. `publish.yml` runs
them, with their self-tests, whenever there are changesets to publish, before anything is versioned,
published or tagged. A release with metadata its migrations do not carry fails there.

They see an **edited** record only by order (a record moved after the last release, or after the
seed). Neither reads the seed's SQL to confirm it carries the edit; replaying the chain on a clean
database (step 5 below) is what proves content.

**The `__v<ver>.x` in a filename is descriptive, never a claim about which release ships the file.**
Flyway orders on the `V<timestamp>` prefix. The file ships in whatever version `changeset version`
computes at release.

> **Not the same family.** CodeGen output (`Entity` / `EntityField` rows behind a schema change) also
> writes `__mj` rows, and still ships in the feature migration that needs it. The release seed covers
> only records declared under `metadata/`.

## Regenerating the metadata seed

**Release work, done once per release by the build engineer** — not in a feature PR. You push
`metadata/` against a database built from the shipped chain and ship what comes out as one new file.

Start by asking what the seed owes: `pnpm run check:release-seed` (new records) and
`pnpm run check:seed-cadence` (edited records, by file). An empty coverage list does not mean nothing
is owed: an edited record keeps its id.

Sonar has no Open App dependencies, so the generation database is **MJ core plus Sonar's migrations
only**.

```bash
# 1. Build the generation database from the SHIPPED CHAIN, not from dev work: a new, empty database
#    no other session is using. Never a copy of your dev database — it holds rows no seed shipped, so
#    the push would emit updates against rows a fresh install does not have.
#    MJ core at the floor of mj-app.json's mjVersionRange (INSTALL.md §4), then Sonar:
DB_DATABASE=<gen db> pnpm mj migrate --tag v<mjVersionRange floor>
#    ⚠️ HOLD BACK every unreleased Metadata_Sync first (check:seed-cadence names them). Its records
#    already match metadata/, so the push would emit nothing for them, and step 4 deletes the delta,
#    leaving those ids named by no migration. Move such files out of migrations/ before this:
DB_DATABASE=<gen db> pnpm run mj:migrate

# 2. Push. metadata/.mj-sync.json has sqlLogging on with formatAsMigration, so this writes the SQL.
DB_DATABASE=<gen db> pnpm mj sync push --dir metadata --ci
#    Expect a small log: records added or edited since the last release, and nothing else.

# 3. The log lands in metadata/sql_logging/ (gitignored). TWO substitutions before it can ship
#    (the same two every Open App seed makes — see the MJ guide):
#      [${flyway:defaultSchema}]  ->  [${mjSchema}]               on every CORE stored-procedure call
#      [__mj_BizAppsSonar]        ->  [${flyway:defaultSchema}]   on Sonar's own procedure calls
#    The logger writes core calls as ${flyway:defaultSchema}, which in an app migration resolves to
#    __mj_BizAppsSonar (no spCreateAction there), and writes Sonar's own procs as the literal name.

# 4. Save it as migrations/V<stamp>__v<x.y>.x__Metadata_Sync.sql — a NEW file whose stamp sorts after
#    every migration on next (changes.yml rejects one that does not). Header: what it was generated
#    against (MJ CLI version, core tag), the push counts, the substitution counts. Commit the `sync`
#    blocks the push wrote back into metadata/ with it. `git rm` any unreleased deltas held back in
#    step 1 — the new seed carries their records, and no host has run them.

# 5. Prove it on a SECOND empty database: MJ core, then the whole chain INCLUDING the new file.
#    Replaying against the generation database proves nothing — it already has the records.
DB_DATABASE=<proof db> pnpm mj migrate --tag v<mjVersionRange floor>
DB_DATABASE=<proof db> pnpm run mj:migrate
#    SELECT a record the seed creates and a field it updates. Then the static gates:
pnpm run lint:distribution && pnpm run check:release-seed && pnpm run check:seed-cadence

# 6. The PostgreSQL twin, from the converter (PG is toolchain territory — do not hand-author it):
pnpm run mj:migrate:convert
pnpm run check:pg-parity
#    Sonar's entities have different __mj.Entity IDs on PostgreSQL (see the v0.3.x Agent_Tool_Surface
#    twin), so check any EntityID the push resolved to a literal UUID.
```

Ship it as an ordinary PR into `next` with a `minor` changeset (`changes.yml` requires one for any
migration), then cut the release as usual (`next` → `main`).

**⚠️ Generation caveat — records created and then updated in ONE push.** Until the MJ version Sonar
builds against includes [MemberJunction/MJ#5297](https://github.com/MemberJunction/MJ/pull/5297)
(merged 2026-10-09), `mj sync push` cannot find a record created earlier in the same push when a later
directory updates it **by `primaryKey`**: it fails with `Name cannot be null` (with
`autoCreateMissingRecords`, which Sonar sets) or `Record not found`. `@lookup` keys are unaffected.
If it bites, run the push a second time against the same generation database: the first push creates
the record, the second applies the update. Ship both logs, in order, as the one `Metadata_Sync`.
Drop this caveat once Sonar's `@memberjunction/cli` pin includes the fix.

**A migration that is not a seed must not write a record `metadata/` also declares** — or, if it
must, update `metadata/` in the same change. `mj sync push` only compares the database with
`metadata/`; it cannot tell "stale" from "deliberately changed by a later migration", and the seed
sorts after that migration, so the seed silently reverts it. No gate catches this.

The full `__mj_BizAppsSonar` data model design is in [`/plans/plan.md` §5](../plans/plan.md).
