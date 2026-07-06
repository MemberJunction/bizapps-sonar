---
"@mj-biz-apps/sonar-ng": minor
---

Engagement Manager, Admin & Ops, and the Copilot assistant.

Three more Sonar surfaces on top of the Angular foundation (Overview + Model Builder):

- **Engagement Manager** (`SonarEngagementManagerResource`) — score triage (worst-first), explainability drawer, per-member sparkline, movers, and cohort CSV export. The intervention/playbook layer is out of v1; a dead `.sonar-holdout-*` CSS block left from that removal was dropped.
- **Admin & Ops** (`SonarAdminOpsResource`) — two tabs: Run Health (recompute-run stats + recent runs) and Governance (version history + config-snapshot diffs). The Phase-2 "Future Phases" tab, mock metering, and "Run now" were already stripped for v1.
- **Copilot** — the floating `SonarCopilotLauncherComponent` (embedded on every surface via `<sonar-copilot-launcher>`, re-added to Overview + Model Builder) backed by a `providedIn: 'root'` conversation-state service. Embeds MJ's native `<mj-conversation-chat-area>` in overlay mode, so token streaming / rendering / persistence come from `ConversationsModule`.

`ConversationsModule` (`@memberjunction/ng-conversations`) is the one new module import; all three surfaces are declared in `CustomFormsModule`. Nav entries for Engagement + Admin already exist in the application metadata. Signal Studio (the "Signals" surface) is a separate follow-up PR.
