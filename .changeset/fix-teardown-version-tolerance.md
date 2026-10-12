---
'@mj-biz-apps/sonar-server': patch
---

Make teardown scripts version-tolerant for MJ 6.1.5 support

Teardown scripts now check if columns exist before referencing them, preventing failures when uninstalling Sonar 0.7.0 on MJ 6.1.5. The fix wraps three problematic columns (AIPromptRun.AgentRunID, ContentSource.ScheduledActionID, ScheduledActionParam.ScheduledActionID) added after 6.1.5 with conditional guards using COL_LENGTH in T-SQL and information_schema in PostgreSQL.

Adds check:teardown-tolerance npm script to validate teardown scripts remain version-tolerant in future changes.

Fixes #56.
