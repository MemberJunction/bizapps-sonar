---
"@mj-biz-apps/sonar-core-entities-server": patch
"@mj-biz-apps/sonar-actions": patch
---

Security: guard publish-lock filters against malformed (non-UUID) ids before interpolation, escape LIKE metacharacters in the model-name search, and remove the hardcoded sandbox database password from scripts.
