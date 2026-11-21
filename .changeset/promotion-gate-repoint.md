---
'@mj-biz-apps/sonar-core-entities-server': patch
---

Security: the factor promotion gate now also re-runs when an already-Approved factor's ActionID is changed, closing the path where approving a factor against a code-approved Action and then re-pointing it at an unapproved one let unreviewed generated code execute in persisted recomputes.
