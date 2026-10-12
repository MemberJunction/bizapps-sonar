---
'@mj-biz-apps/sonar-server': patch
---

Uninstall now works on every MJ version Sonar supports (#56). The teardown scripts are generated from the FK graph of a newer MJ than the declared floor (6.1.5), so they named two tables MJ 6.1.5 does not have (`ScheduledAction`, `ScheduledActionParam`) and two columns it does not have (`ContentSource.ScheduledActionID`, `AIPromptRun.AgentRunID`), and teardown failed on 6.1.5 with "Invalid column name" / "Invalid object name". The generator now wraps every statement that names something the floor lacks in a version guard (dynamic SQL behind `OBJECT_ID`/`COL_LENGTH` on SQL Server, a `DO` block behind `information_schema` on PostgreSQL), using a committed snapshot of MJ 6.1.5's core schema. A new gate, `check:teardown-tolerance`, runs in CI and fails when a teardown statement names anything missing from the floor without a guard, or when `mjVersionRange`'s floor and the snapshot disagree.
