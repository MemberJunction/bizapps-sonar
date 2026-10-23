---
"@mj-biz-apps/sonar-engine": patch
"@mj-biz-apps/sonar-actions": patch
"@mj-biz-apps/sonar-core-entities-server": patch
---

Permission-gate the factor compilation and action execution paths. The compiled (raw-SQL) factor read path now verifies, before any SQL is built, that the anchor entity, every join-hop entity, and the leaf entity are business entities (the same `isBusinessEntity` scope the pickers use) AND that the calling user holds Read permission on each — the compiled path applies neither entity permissions nor RLS at query time, so the compiler is where the check must live. The engine's action runner refuses to execute a Runtime action that is not Active with Approved code, failing the factor's run loudly. `Sonar: Test Signal` now requires Update rights on `MJ: Actions`, only accepts Runtime signals, and refuses Rejected code. `Sonar: Update Prompt` verifies the target template content actually belongs to an AI prompt's template before writing. `Sonar: Cancel Factor Job` only lets the user who started a run cancel it. Interpolated-ID `ExtraFilter`s in the publish-lock helpers, `ScoreModelEntityServer`, and `ScorePersister` are now escaped, and the dev/test scripts read database credentials from `DB_*` environment variables instead of committed literals.
