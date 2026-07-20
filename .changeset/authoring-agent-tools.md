---
"@mj-biz-apps/sonar-entities": major
"@mj-biz-apps/sonar-engine": major
"@mj-biz-apps/sonar-core-entities-server": major
"@mj-biz-apps/sonar-actions": major
"@mj-biz-apps/sonar-server": major
"@mj-biz-apps/sonar-ng": major
---

Wire the Sonar Authoring Agent to its action tool surface so fresh `mj app install` seeds a working agent.

The agent shipped with zero `AIAgentAction` links, so the Loop runtime built an empty toolbox and every action call (e.g. `Sonar: Find Models`) reported "unavailable". Root cause: `metadata/agents/.mj-sync.json` allow-listed only `MJ: AI Agent Prompts` under `pull.relatedEntities`, so mj-sync silently dropped the agent's action links; the empty snapshot generated an empty seed, and `mj app install` (migrations only, never `metadata/`) shipped the gap to every installer.

- **`.mj-sync.json`:** add `MJ: AI Agent Actions` to the capture allowlist (root cause fix).
- **`.sonar-agent.json`:** restore the 22 action links (all Sonar tools except `Run Authoring Agent`) to the agent snapshot.
- **Seed migration:** idempotent `INSERT ... WHERE NOT EXISTS` so fresh installs seed the agent's tools.
