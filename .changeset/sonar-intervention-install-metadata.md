---
"@mj-biz-apps/sonar-engine": minor
---

Make the intervention layer actually installable: fold its CodeGen metadata into a shipping migration.

`V202608011000` created the four intervention tables (`ScoreSegment`, `Intervention`, `InterventionAssignment`, `InterventionOutcome`) but never registered them with MJ, and the later `Intervention.Kind` and `ScoreModel.OutcomeDefinitionJSON` columns were likewise unregistered. That registration — `Entity`/`EntityField` rows, `EntityPermission` grants, the `vw*` views and the `spCreate`/`spUpdate`/`spDelete` procedures — is produced by `mj codegen`, which writes to `migrations/codegen/`. That folder is gitignored, so none of it ever shipped.

Since `mj app install` runs migrations only, a fresh install got the tables with no metadata, no views and no CRUD procedures: the entity layer had nothing to call. It worked on developer machines purely because each of us had run CodeGen locally against our own dev databases.

The failure was observable. With `Kind` present in the table but absent from the metadata, saving an Intervention built its INSERT without that column and threw *"Column name or number of supplied values does not match table definition"*, and one run silently persisted `Kind='Action'` on a BulkSync intervention. The v0.1 schema migration already documents the fix — its SECTION 5 folds CodeGen output in "per the bizapps migration convention" — the intervention layer just skipped that step.

The new migration is that output, generated against a scratch database where the tables existed and CodeGen had never run, so it contains only these four Sonar entities and no unrelated business schemas. Verified by applying migrations alone (no CodeGen) to a clean pre-intervention database: all four entities register with their fields and three permission grants each, the views and procedures exist, `Kind` registers as a value list of Action/TrackOnly/BulkSync, and a model → segment → BulkSync intervention round-trips through the generated procedures and reads back through the generated view, with the CHECK constraint still rejecting an invalid `Kind`.
