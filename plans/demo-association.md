# Demo Association — business data for Sonar demos & testing

**Status:** draft (agreed shape; not yet built) · **2026-06-16**

## Why
Sonar scores a **business** anchor entity, but this environment only has `__mj` (core) and
`__mj_BizAppsSonar` (Sonar's own infra) — no business-domain entities. That's why an E2E test
had to anchor on `MJ: Users` (which MJ row-filters → population 0). A small, self-contained
**demo association** gives us a realistic anchor + activity sources so we can author a *real*
scoring model and get genuine Simulate/Recompute distributions — and it's exactly the kind of
schema the (deferred) entity-picker scoping rule is meant to surface.

## Scope (agreed)
- **Lean core:** 5 entities (1 anchor + 4 single-hop sources).
- **Seed:** ~15 hand-authored members across engagement profiles (readable + verifiable).
- **Placement:** a **separate demo concern** — kept out of the main `migrations/` line so it
  never ships to a real deploy. Lives under `demo/` and is run explicitly in dev.

## Schema: `membership`
A deliberately non-`__mj`, non-`__mj_BizAppsSonar` business schema.

### `membership.Member` — the scoring anchor
| Field | Type | Notes |
|---|---|---|
| ID | uniqueidentifier PK | |
| FirstName / LastName | nvarchar | |
| Email | nvarchar | |
| MembershipType | nvarchar | Individual / Student / Corporate / Retired |
| Status | nvarchar | Active / Grace / Lapsed / Prospect |
| JoinDate | date | |
| RenewalDate | date | enables renewal-relative windows later |
| ChapterRegion | nvarchar | optional grouping |

### Single-hop sources (each FK → `Member`)
| Entity | Key fields | Feeds factor |
|---|---|---|
| **EventRegistration** | MemberID, EventName, EventDate, Attended (bit), RegistrationType | Events attended — `Count(Attended=1)`, 12mo |
| **EmailEngagement** | MemberID, ActivityType (Open/Click/Bounce/Unsubscribe), OccurredOn, CampaignName | Newsletter engagement — `Count(Open,Click)`, 90d |
| **Payment** | MemberID, Amount (decimal), PaidOn, PaymentType (Dues/Donation/EventFee), TermYear | Giving — `Sum(Amount, Donation)` all-time; Dues current — `Count(Dues)`, 12mo |
| **Certification** | MemberID, CourseName, CompletedOn, IsActive (bit), CreditHours | Continuing ed — `Count`, 12mo |

## The demo scoring model it enables
Every factor is a **single-hop Count/Sum, MinMax-normalized**, over the **already-seeded**
Time Windows, banded by the **already-seeded** "Default Health Bands" — 100% within v1 engine.

| Signal | Source | Aggregation | Window | Weight |
|---|---|---|---|---|
| Event attendance | EventRegistration (Attended) | Count | Trailing 12 Months | 0.25 |
| Newsletter engagement | EmailEngagement (Open/Click) | Count | Trailing 90 Days | 0.20 |
| Giving | Payment (Donation) | Sum(Amount) | All Time | 0.20 |
| Continuing education | Certification | Count | Trailing 12 Months | 0.20 |
| Dues current | Payment (Dues) | Count | Trailing 12 Months | 0.15 |

## Seed profiles (~15 members)
Authored so the band distribution is visibly varied (hardcoded UUIDs, no NEWID):
- **~4 Engaged → Healthy:** frequent events, regular opens/clicks, donations, active certs, dues current.
- **~4 Moderate → Neutral:** some events/opens, dues current, little giving.
- **~4 At-Risk:** sparse recent activity, dues lapsing, no recent certs.
- **~3 Lapsed/Prospect:** minimal or no activity.

## Build sequence (on approval)
1. **Schema + tables** — `demo/migrations/` SQL creating `membership` + the 5 tables (MJ
   migration conventions: named PK/FK constraints, `NEWSEQUENTIALID()` PKs, extended-property
   column descriptions, no `__mj_*` audit cols, no FK indexes — CodeGen adds those).
2. **CodeGen** — include `membership` in CodeGen so it generates MJ entity classes + entity
   metadata (makes the tables RunView-able and pick-able). *(Verify how `mj.config.cjs` selects
   schemas; add `membership` there.)*
3. **Seed** — hand-authored members + activity rows (run in dev only).
4. **Demo model** — author the model above (anchor = `membership.Member`) and Simulate/Recompute
   to confirm a real distribution.

## Forward-looking: Action-backed metrics (1–2 to plan for)
Most demo factors are **declarative** (compiled to one set-based SQL query). But the architecture
already anticipates a second kind: **Action-backed factors**, where the metric is computed by an
MJ Action behind a promotion gate. Both satisfy the same `IFactorEvaluator.evaluateBatch(anchorIds,
asOf, ctx) → Map<anchorId, FactorResult>` seam, so the rubric engine never branches on which it
holds. These are worth seeding into the demo because they show *why* Action factors exist — they
do what the declarative compiler can't.

Two candidates (both genuinely impossible declaratively in v1):

1. **Engagement Momentum** — is the member's activity *rising or falling*? A slope over their
   monthly event + email activity. v1's declarative compiler explicitly throws on `TrendSlope`,
   so this must be an Action. Output: a normalized momentum (−1 falling … +1 rising).
2. **Cross-channel Recency** — days since the member's *most recent* touch of **any** kind
   (event, email, payment, certification). Declarative factors are single-hop (one source), so a
   metric that spans all sources must be an Action. Output: recency decayed to a 0–1 freshness.

3. **Member Sentiment / Satisfaction (LLM-backed)** — read a member's *free text* (survey
   comments, community posts, support notes) and derive a satisfaction/sentiment score. Neither
   SQL nor ordinary code can read prose — only a model can. This is the top of the ladder: a
   special case of an Action factor whose Action calls an **LLM**. Output: normalized sentiment
   (0 detractor … 1 promoter), plus a one-line rationale.
   - *Needs a text-bearing source.* The lean core has no free-text entity, so building this would
     add e.g. `membership.CommunityPost` or `SurveyResponse` (member-linked text).

### What an LLM factor adds (beyond a regular Action)
Same `FactorType='Action'` seam, but the Action runs an **AI Prompt** via `AIPromptRunner.RunPrompt`
(`@memberjunction/ai-prompts`, provider-agnostic over MJ's AI vendor config; precedent: MJ's own
AI-backed core actions like *Summarize Content*). The LLM introduces governance the `Factor`
columns already cover — and which matter far more here:
- **Cost & latency** → `IsExpensive=true`, async `ExecutionMode`, `MaxConcurrency` + `RateLimitPerMinute` to throttle calls.
- **Caching** → `CacheTTLSeconds` + cache by `(memberID, content-hash)`: re-score only when the underlying text changes, not on every recompute. The single biggest cost lever.
- **Reproducibility** → Sonar prizes versioned, reproducible scores, but LLM output is non-deterministic. Resolution: the computed value is **stamped into the Score + version snapshot** and reused from cache unless content changes; pin the **model + prompt version** for audit.
- **Explainability** → put the model's rationale in `FactorResult.explanation` — fits Sonar's explainable-by-construction ethos exactly.
- **Promotion gate** → `PromotionState` matters most here: validate the LLM factor (calibrate against human labels) before promoting from sandbox to production.

### How an Action-backed factor wires (already supported by the schema)
- **Factor row:** `FactorType='Action'`, `ActionID` → a "Sonar: Compute <Metric>" Action,
  `ActionParamsJSON` for config (windows, which sources), plus the governance columns already on
  `Factor`: `ExecutionMode`, `IsExpensive`, `MaxConcurrency`, `RateLimitPerMinute`, `CacheTTLSeconds`,
  and `PromotionState` (the gate — a new Action factor starts sandboxed and is promoted after review).
- **The metric Action** takes the population in one call — `anchorIds[]`, `asOf`, params — and
  returns per-anchor values (NOT one RunAction per member; the contract is explicitly set-based).
- **Engine seam to add:** an `ActionFactorEvaluator implements IFactorEvaluator` whose
  `evaluateBatch` invokes the Action server-side (`ActionEngineServer.RunAction`) and maps the
  result into `FactorResult` (`rawValue` + `hadData` + `explanation`; normalization stays in the
  NormalizationEngine). `FactorCompiler.compile` then branches: `Declarative → CompiledFactorEvaluator`,
  `Action → ActionFactorEvaluator`. This is the one engine extension required — v1 ships only the
  declarative evaluator.
- **Reuse:** this is the same `BaseAction` + metadata pattern we already used for `Sonar: Preview
  Model` / `Sonar: Recompute Model`, so the authoring + sync path is known.

## Open considerations
- **Generated entity code ships, demo data doesn't.** CodeGen output for `membership` lands in
  the shared `packages/Entities` (committed). The *migration + seed* stay under `demo/` and run
  only in dev — that's the "separate concern" boundary.
- Keeping `membership` out of `mj:migrate`'s default path means a dedicated run command (e.g.
  `mj:migrate:demo` pointing flyway at `demo/migrations`), TBD at build time.
