---
"@mj-biz-apps/sonar-core-entities-server": patch
"@mj-biz-apps/sonar-actions": patch
---

Security hardening: GUID-validate `ScoreModelID`/`BandSetID` before they are interpolated into publish-lock and band-set `ExtraFilter` strings (a crafted FK string was a server-side SQL injection primitive — the guards run before the DB could reject the non-GUID), and scope `Sonar: Update Prompt` so it only writes Template Content rows whose template is referenced by an AI Prompt (closes a confused-deputy path that let prompt-update rights rewrite arbitrary template content).
