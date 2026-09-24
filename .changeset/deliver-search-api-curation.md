---
"@mj-biz-apps/sonar-entities": minor
---

Deliver the search-API curation to installed databases

`metadata/entities/.entities.json` has carried this curation since 2026-09-17, but
`mj app install`/`upgrade` runs migrations only and never reads `metadata/`. The change
therefore reached no host except the authoring machine, where `mj sync push` applied it
by hand: every installed Sonar still had all 14 entities on their CodeGen defaults, so
generic band labels ("At Risk", "Neutral", "Healthy") polluted user search.

Adds `V202609241800__v0.6.x_Search_API_Curation` in both dialects: search OFF for the 13
score/detail entities, search ON for Score Models with `Name` matched `BeginsWith` and
`ID` excluded. Resolved by natural key (`Entity.Name`, `EntityField.Name`) because these
core rows are CodeGen-minted per host and their IDs differ on every database. Each
`AutoUpdate*` flag is cleared alongside its value so the next CodeGen run cannot silently
revert the curation.

Minor rather than patch: the release carries a new migration.
