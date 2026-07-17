---
"@mj-biz-apps/sonar-core-entities-server": patch
---

Enforce the publish-lock as a backend invariant on Sonar config entities.

Once a ScoreModel is published, its scoring config is frozen into an immutable ScoreModelVersion snapshot. Editing the model's factors, data sources, or bands afterward would silently drift the live config away from the snapshot every Score references. The Explorer UI already hides those edits behind an "unpublish to edit" gate, but that's a UI-only courtesy — a script, the API, or an agent can still write straight to the entities.

Four server-side entity guards (`@RegisterClass` subclasses overriding `ValidateAsync` + `Delete`) make the lock a real invariant:

- `FactorEntityServer`, `ModelFactorEntityServer`, `ModelRelatedEntityEntityServer` — create/edit/delete blocked while the owning model's config is locked (keyed on `ScoreModelID`). Shared library factors (null `ScoreModelID`) are never locked.
- `ScoreBandEntityServer` — blocked while any locked model uses the band's set (bands have no direct model link, so it keys on "is this band set used by a locked model").

"Locked" = the model has a published snapshot and isn't being actively rebuilt — Status Active or Paused. Draft (still being built) and Archived (retired) stay editable. Shared existence-query helpers live in `publishLock.ts`.
