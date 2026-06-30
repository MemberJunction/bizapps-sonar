---
"@mj-biz-apps/sonar-core-entities-server": patch
---

Add the ScoreModel server-side lifecycle hooks (plan §5 — published versions are immutable):

- `ScoreModelEntityServer` — server subclass registered over `MJ_BizApps_Sonar: Score Models` (loads after `sonar-entities` so the server subclass wins `@RegisterClass` priority).
- **Publishable validation** (`ValidateAsync` / `validatePublishable`) — cross-record checks that run only on the server, enabled via `DefaultSkipAsyncValidation = false`: a model can't publish without bound factors and a band set.
- **Publish snapshot** (`Save` / `publishWithSnapshot`) — on the publish transition, snapshots the full model config (bound factors + rubric) into a new immutable `ScoreModelVersion`, assigns the next version number, and stamps the version so recomputed scores are reproducible and auditable.

**Review follow-up:** make the publish path's validation genuinely gate the commit. `publishWithSnapshot` now calls `ValidateAsync()` **up front** (before building the snapshot or queuing any version rows) and bails on failure, and the final `super.Save()` result is **checked** so `tg.Submit()` only runs when the model actually saved — removing the partial-commit hazard (queued demote/version insert committing despite a failed/invalid model save) and matching the documented "validate before snapshot" behavior.

**Publish-lock hardening (re-review follow-up):**

- The ScoreModel hub guard is now an **editable-while-published allowlist** rather than a frozen-field blocklist (`EDITABLE_WHILE_PUBLISHED_SCORE_MODEL_FIELDS` in `publishLock.ts`). Any field not on the allowlist — including `IsCalibrated`, `AsOfStrategy`, `TrendWindowDays`, and any scoring column added later — is locked by default while a model is Active/Paused, flipping the failure mode from "silently editable" to "safe by default". The decision is extracted into a pure, unit-tested `isScoringEditBlocked()`.
- **Query-error posture made asymmetric (the better resolution).** A status query can fail transiently; the predicate now distinguishes a confirmed `unlocked` from an `unknown` (query-failed) and resolves them per call site: the **hard `Save()`/`Delete()` path fails CLOSED** (`isModelConfigWriteBlocked` / `isBandSetConfigWriteBlocked` — `unknown` blocks the write, since a silent config drift on a published model is unrecoverable while a wrongly-blocked write is a recoverable retry), and the **cosmetic `ValidateAsync` message path stays fail-OPEN** (`isModelConfigLocked` / `isBandSetConfigLocked` — `unknown` shows no lock message, so a transient blip never flashes a misleading "unpublish to edit"). Rationale recorded inline at the predicate; both paths unit-tested.
