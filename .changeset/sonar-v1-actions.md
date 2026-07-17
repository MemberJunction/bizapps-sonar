---
"@mj-biz-apps/sonar-actions": minor
"@mj-biz-apps/sonar-server": minor
---

Sonar Actions layer — the agent-callable / UI-callable server seam.

Adds the hand-authored Sonar actions (`packages/Actions/src/custom`) + their metadata (`.sonar-actions.json`) and the Server bootstrap that registers them and loads the action-runtime-host:

- **Engine wrappers:** Preview Model, Recompute Model, Validate Factor, Create Factor, Create Model, Add Data Source, Set Band Set, Describe Model, Build Model, List Related Entities.
- **Agentic authoring surface:** Author Factor, Run Authoring Agent, Start Factor Job, Refine Factor Action, Cancel Factor Job, Test Signal, Bind Signal To Model, Find Entities, Find Models, List Factor Actions, Unpublish Model, Get Prompt, Update Prompt.

`SonarActionBase` (shared helpers) and `SonarFactorAction` (the factor-action base + contract registry, consumed by List Factor Actions) ship as the substrate. The two *example* hand-authored factor-actions (Member Activity Streak, Resource Review Sentiment) are intentionally excluded from v1 — factor-actions are authored via Codesmith (Runtime) in the Signal Studio.
