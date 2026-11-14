---
"@mj-biz-apps/sonar-engine": patch
"@mj-biz-apps/sonar-core-entities-server": patch
---

Close two permission/injection gaps the earlier security pass missed. The Factor promotion gate now GUID-gates and escapes the client-supplied `ActionID` before interpolating it into the `MJ: Actions` lookup's `ExtraFilter` — the gate runs in `Save()`/`ValidateAsync` before field-type validation, so a crafted non-GUID value could previously reach the filter text verbatim; a non-GUID ActionID is now a confirmed `blocked` without any query (same posture as publishLock). And a population filter's related-exists leaf now passes the same security gate the factor compiler applies to every table its SQL can touch: the related entity must be a business entity (never `__mj`/Sonar-internal) and the calling user must hold Read permission on it, because the subquery reads the related BASE TABLE inside a RunView `ExtraFilter`, where RunView enforces permissions only on the anchor entity.
