---
"@mj-biz-apps/sonar-entities": patch
---

Register the Intervention Proposals entity in a forward migration.

The table was created by a migration but its MJ metadata — Entity, EntityField, permissions, the
vwInterventionProposals view and the CRUD procedures — existed only in a CodeGen output that Flyway
does not apply. A fresh `mj app install` therefore got the table with no entity registration, so the
Outreach approval tab could not read or write a proposal. It worked on developer machines only
because each of us had run `mj codegen` locally.
