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
| `test-unpublish-model.mjs`  | The `Sonar: Unpublish Model` action (Active/Paused → Draft; idempotent Draft path). |

## One-offs

| Script | What it does |
|---|---|
| `delete-stray-sonar-app.cjs` | Removes a stray duplicate Sonar app registration (cleanup utility). |

## CI / release gates (these ARE wired into CI)

Node stdlib only, so they run without `pnpm install`. Each has a `.spec.mjs` self-test that proves it
fires. The model they enforce is in [`../migrations/README.md`](../migrations/README.md).

| Script | Runs | What it checks |
|---|---|---|
| `check-distribution-seed.mjs` (`pnpm run lint:distribution`) | every PR (`distribution-gate.yml`) + `publish.yml` | Shipped SQL (both dialects + teardown) uses only placeholders `mj app install` supplies. |
| `check-release-seed-coverage.mjs` (`pnpm run check:release-seed`) | `publish.yml` only | Every `primaryKey` UUID under `metadata/` is named by some `migrations/*.sql`. |
| `check-release-seed-cadence.mjs` (`pnpm run check:seed-cadence`) | `publish.yml` only | One consolidated `Metadata_Sync` per release, owed when `metadata/` moved since the last tag, non-empty and not older than any metadata change. |
| `check-pg-parity.mjs` (`pnpm run check:pg-parity`) | build | Every `migrations/*.sql` has a valid PostgreSQL twin. |

The two release gates fail between releases by design (metadata merged on `next` waits for the build
engineer's release seed), which is why no PR workflow runs them — only their self-tests.
