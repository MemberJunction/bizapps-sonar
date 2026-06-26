# Sonar dev/test scripts

Hand-written Node scripts for seeding demo data and live-testing engine/action paths against the
local **Sonar_Demo** sandbox. These are **developer utilities, not part of the build or CI** — run
them manually. They are not the product; the equivalent capabilities ship as MJ Actions.

## Running

Load the repo `.env` first (DB creds), then run from the repo root:

```bash
set -a && . ./.env && set +a && node scripts/<name>.mjs
```

Connection plumbing (mssql connect + `setupSQLServerClient` + `UserCache`) is shared in
[`lib/bootstrap.mjs`](lib/bootstrap.mjs) — `const { pool, user } = await bootstrap();`. Domain
side-effect imports (`@mj-biz-apps/sonar-actions`, `@memberjunction/ai-gemini`, etc.) stay per-script.

## Seeds (idempotent — safe to re-run)

| Script | What it does |
|---|---|
| `seed-sentiment-prompt.mjs` | Seeds the "Sonar: Resource Review Sentiment" AIPrompt (Template + content + Gemini pin) behind the LLM factor. |
| `seed-authoring-agent.mjs`  | Seeds the agentic-authoring tool-surface agent. |

## Live tests (hit the real DB / real Gemini)

| Script | What it verifies |
|---|---|
| `test-sentiment-factor.mjs` | The LLM sentiment factor end-to-end (load reviews → Gemini → score+reason) per member. |
| `test-preview-llm.mjs`      | The real engine preview path (`computeScores`) over a membership model incl. the action factor. |
| `recompute-llm-model.mjs`   | Recompute (persist) a model so `ScoreFactorContribution.DetailJSON` (the triage reasons) is populated. |
| `test-get-prompt.mjs`       | The `Sonar: Get Prompt` action returns editable prompt text. |
| `test-time-windows.mjs`     | Window-kind compilation (Rolling/Calendar/SinceEvent/RenewalRelative). |
| `test-tool-surface.mjs` / `test-authoring-agent.mjs` | The agent authoring tool-surface actions. |
| `streak-livetest.mjs`       | The Member Activity Streak factor-action. |
| `composite-sql-smoke.mjs`   | Composite (multi-column) anchor-key SQL building. |

## One-offs

| Script | What it does |
|---|---|
| `delete-stray-sonar-app.cjs` | Removes a stray duplicate Sonar app registration (cleanup utility). |
