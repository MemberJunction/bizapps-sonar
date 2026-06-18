# Sonar Demo — script + sandbox

How to present the core loop, and how the demo sandbox (`Sonar_Demo`) is built. Part 1 is the live
click-path; Part 2 is the data/sandbox reference; Part 3 is forward-looking design notes.

---

## Part 1 — Demo script (internal / stakeholder)

Aim: show that scoring is configurable-as-data, explainable by construction, and runs end-to-end on
real data. Keep it to the loop; don't wander into half-built surfaces (see *Guardrails*).

### Preconditions
- **API:** demo API on `:4102` against the **`Sonar_Demo`** database.
- **UI:** Explorer on `:4302` → the **BizAppSonar** app.
- **Model state (set up before demoing):** "Demo Member Engagement" **published (Active)** with
  **two factors** so weight tuning is visibly meaningful — e.g. *Events Attended* + *Giving*.
  Recompute once so scores + the triage list are populated.
  > A single-factor model makes the live-tuning beat look flat (one factor → weight cancels out).

### Narrative (say this up front)
> "Sonar turns the data already in MemberJunction into an explainable engagement score for any
> entity — here, members. You define what engagement means as configuration, not code, and every
> score tells you *why*. Let me build one, watch it score live, then act on it."

### Act 1 — Overview (where do we stand?)
1. Open **Overview**. Point at the **model rail** (the app is model-scoped — one model at a time)
   and the single-model dashboard.
2. Call out the **stat tiles** + the **band distribution donut** — "the live picture from the last
   recompute." *Talking point:* "scores aren't comparable across models, so the whole app follows
   the model you pick here."

### Act 2 — Model Builder (configuration-as-data)
3. Switch to **Model Builder**. Walk the rubric: **data sources** ("real MJ entities — no ETL, the
   integration is already done") → **rubric** (factors + weights).
4. **Add a factor** in plain language (*Count of Event Registrations over Trailing 90 Days, more is
   a good sign*); show the **live sample preview** on the right. Save it.
5. **Live what-if tuning:** drag a weight slider → distribution donut + sample re-preview after a
   beat. "Tuning the model and seeing the population shift in real time, before committing."
6. **Simulate** — "computes the whole population *without* saving — a safe preview."
7. **Publish version** → show the **pre-publish impact preview** ("publishing would move the bands
   like this vs. what's live now"). Publish (toast confirms).
8. **Recompute** — "now I persist the scores against the published version." Toast: "Recompute
   succeeded — N members scored." *Talking point:* "every score records which version produced it,
   so results are reproducible and auditable."

### Act 3 — Engagement Manager (explainability = the payoff)
9. Switch to **Engagement Manager**. The **triage list** is worst-score-first — "the work queue."
10. Click a low scorer → the **explainability drawer**: score, band, and the **contribution
    waterfall**. "*This* is the headline — the score decomposes into the named signals that produced
    it. That narrative is what gets staff to act."
11. Click a healthy member to show the drawer updating live.

**Close:** "Configure what engagement means → score the population → see exactly why each member
scores what they do. On real data, with no code."

### Guardrails — real vs. placeholder (don't get caught)
**Safe to demo:** model CRUD, data sources, factor builder, normalization choice, live weight
tuning, simulate, publish + immutable versions, recompute + persisted scores, triage list,
explainability drawer, impact preview, toasts.

**Avoid / don't frame as working:**
- **AI authoring panel** (Model Builder) — "Phase 2+" placeholder. *("AI-first authoring is on the
  roadmap; today you build the rubric directly.")*
- **Population filter** — UI spike; engine scores everyone. Don't filter live.
- **Penalty / "hurts the score"** mode — engine treats it as additive today. Demo additive only.
- **Admin & Ops** surface — placeholder; skip.
- **Export cohort / Launch intervention** (EM) — disabled; the action layer isn't built (it's the
  honest "what's next").
- **Trend / trajectory** — no sparkline; `ScoreHistory` isn't written yet.

### Likely questions → honest answers
- *"Can it predict who'll churn?"* — Today it's a transparent weighted rubric you author, not a
  trained model. Learned weights are roadmap; the trade is explainability (the differentiator).
- *"What about acting on scores?"* — The action layer (segments → interventions → holdout-measured
  lift) is the plan's v1 centerpiece and the next big build. Today we stop at "who and why."
- *"Donors/volunteers too?"* — Yes by design; the anchor is any MJ entity, nothing hardcoded.
- *"How many factor types without code?"* — See [`engine.md`](engine.md): count/sum/avg/min/max/
  distinct over an activity, with filters + windows. Recency + renewal-window are the known gaps.

### After the demo (reset)
The demo mutates the `Sonar_Demo` model/scores. To re-run clean, restore the 2-factor published
model and Recompute. The whole sandbox is droppable (`DROP DATABASE Sonar_Demo`) and re-seedable.

---

## Part 2 — The demo sandbox

**Why it exists:** Sonar scores a *business* anchor, but this environment only has `__mj` (core) and
`__mj_BizAppsSonar` (Sonar's infra) — no business-domain entities. A small self-contained **demo
association** gives a realistic anchor + activity sources so we can author a *real* model and get
genuine Simulate/Recompute distributions. Kept under `demo/` (out of the main `migrations/` line) so
it never ships to a real deploy.

### Schema: `membership` (Pattern 1 — real tables in the demo DB)
| Entity | Role | Key fields |
|---|---|---|
| **Member** | scoring anchor | FirstName/LastName, Email, MembershipType, Status, JoinDate, RenewalDate, ChapterRegion |
| **EventRegistration** | source | MemberID, EventName, EventDate, Attended, RegistrationType |
| **EmailEngagement** | source | MemberID, ActivityType (Open/Click/Bounce/Unsub), OccurredOn, CampaignName |
| **Payment** | source | MemberID, Amount, PaidOn, PaymentType (Dues/Donation/EventFee), TermYear |
| **Certification** | source | MemberID, CourseName, CompletedOn, IsActive, CreditHours |

Each source has a real FK → `Member` (single-hop), so the v1 engine scores it unchanged.

### The demo model it enables
Every factor is a single-hop Count/Sum over the seeded Time Windows, banded by the seeded "Default
Health Bands" — 100% within v1 engine capability.

| Signal | Source | Aggregation | Window | Weight |
|---|---|---|---|---|
| Event attendance | EventRegistration (Attended) | Count | Trailing 12 Months | 0.25 |
| Newsletter engagement | EmailEngagement (Open/Click) | Count | Trailing 90 Days | 0.20 |
| Giving | Payment (Donation) | Sum(Amount) | All Time | 0.20 |
| Continuing education | Certification | Count | Trailing 12 Months | 0.20 |
| Dues current | Payment (Dues) | Count | Trailing 12 Months | 0.15 |

### Demo data — what's seeded & where to find it
All in database **`Sonar_Demo`**, schema **`membership`** (sql_server_dev @ localhost:1433). Source:
`demo/membership-seed.sql`. Member IDs are hardcoded `B1000000-0000-4000-8000-0000000000NN`
(NN = 01–15); activity rows use default sequential IDs. Surfaced to Sonar as MJ entities via
`mj codegen --skipfiles` (the anchor shows as **Members**).

| SQL table | Rows | Holds |
|---|---|---|
| `Sonar_Demo.membership.Member` | 15 | the scoring anchor |
| `Sonar_Demo.membership.EventRegistration` | 27 | event signups + `Attended` flag |
| `Sonar_Demo.membership.EmailEngagement` | 36 | Open / Click / Bounce events |
| `Sonar_Demo.membership.Payment` | 20 | Dues + Donations (`Amount`, `TermYear`) |
| `Sonar_Demo.membership.Certification` | 9 | course completions (`IsActive`) |

The 15 members, by engagement profile (counts are seeded rows; "att" = attended events):

| ID | Member | Type | Status | Profile | Events (att) | Emails | Payments | Certs (active) |
|----|--------|------|--------|---------|--------------|--------|----------|----------------|
| 01 | Ava Chen | Individual | Active | Healthy | 4 (4) | 6 | 3 · $500 | 2 (2) |
| 02 | Liam Patel | Corporate | Active | Healthy | 4 (4) | 6 | 2 · $1,500 | 1 (1) |
| 03 | Maria Gonzalez | Individual | Active | Healthy | 4 (4) | 5 | 2 · $225 | 2 (2) |
| 04 | Noah Williams | Individual | Active | Healthy | 4 (3) | 4 | 2 · $450 | 1 (1) |
| 05 | Sofia Rossi | Student | Active | Neutral | 2 (2) | 3 | 1 · $50 | 1 (1) |
| 06 | Ethan Kim | Individual | Active | Neutral | 2 (1) | 2 | 1 · $150 | 0 |
| 07 | Olivia Brown | Individual | Active | Neutral | 2 (2) | 3 | 2 · $200 | 1 (0) |
| 08 | Lucas Muller | Corporate | Active | Neutral | 2 (2) | 3 | 1 · $500 | 1 (1) |
| 09 | Emma Davis | Individual | Grace | At-Risk | 1 (1, 2025) | 1 (old) | 1 · 2025 dues | 0 |
| 10 | Mason Lee | Individual | Active | At-Risk | 1 (0) | 1 (bounce) | 1 · 2026 dues (late) | 0 |
| 11 | Isabella Nguyen | Student | Grace | At-Risk | 1 (1, 2025) | 1 (old) | 1 · 2025 dues | 0 |
| 12 | James Wilson | Individual | Active | At-Risk | 0 | 0 | 1 · 2024 dues | 0 |
| 13 | Charlotte Smith | Individual | Lapsed | Lapsed | 0 | 0 | 1 · 2024 dues | 0 |
| 14 | Benjamin Garcia | Individual | Lapsed | Lapsed | 0 | 0 | 1 · 2023 dues | 0 |
| 15 | Amelia Johnson | Prospect | Prospect | Prospect | 0 | 1 (welcome) | 0 | 0 |

**Why the engine produces what it does** (no-data members are *excluded*, not scored 0):
- **Events Attended** → members 01–11 have event rows → **11 scored** (12–15 excluded).
- **Payments** → 01–14 have payments → **14 with data**.
- **Certifications** → 01–05, 07, 08 → **7 with data**.

Quick look: `SELECT * FROM membership.Member;` (etc.) against `Sonar_Demo`.

### Running it
- **Separate DB, not a fresh one:** `Sonar_Demo` is a **clone of `Sonar_Dev`** (BACKUP/RESTORE on
  the same SQL container) so the full `__mj` + `__mj_BizAppsSonar` stack is present, then add
  `membership`. Teardown = `DROP DATABASE Sonar_Demo` (zero residue in repo or main DB).
- **Point tools at it:** the demo `.env` sets `DB_DATABASE=Sonar_Demo`; the API/Explorer/CodeGen all
  read DB settings from env, so the whole stack runs against the sandbox.
- **Build order:** clone → `CREATE SCHEMA membership` + tables → seed → `mj codegen --skipfiles`
  (registers entities + base views in `Sonar_Demo` only, **no repo file churn**) → author model →
  Simulate/Recompute.

---

## Part 3 — Design notes (forward-looking)

### Pattern 1 (now) vs Pattern 2 (real-world)
- **Pattern 1 — schema in the MJ DB** (the demo): real FKs auto-detect relationships; v1 engine
  scores it unchanged; one DB to debug. Best for *us as developers*.
- **Pattern 2 — separate DB, cross-DB views:** the association keeps its system-of-record in place;
  MJ surfaces it as read-only **virtual entities** over views, related via **soft FKs / organic
  keys**. Most real associations would prefer this. **Consequence:** the engine's soft-FK +
  organic-key join support is **on the critical path to adoptability**, not optional polish — a
  pure organic-key source (no soft FK) is a real engine gap (`FactorCompiler` resolves the join from
  FK metadata today). Promote it on the engine roadmap accordingly.

### Action-backed / LLM factor candidates (why the escape hatch exists)
Demo factors are all declarative. Seeding 1–2 **Action-backed** factors would show what the
declarative compiler *can't* do (all satisfy the same `IFactorEvaluator` seam):
1. **Engagement Momentum** — slope of monthly activity (rising/falling). v1 throws on `TrendSlope`,
   so it must be an Action.
2. **Cross-channel Recency** — days since the most recent touch of *any* kind. Declarative is
   single-hop, so spanning all sources needs an Action.
3. **Member Sentiment (LLM-backed)** — derive sentiment from free text via `AIPromptRunner`. Needs a
   text-bearing source (e.g. a `CommunityPost` entity). The LLM makes the `Factor` governance
   columns matter: `IsExpensive`/`MaxConcurrency`/`RateLimitPerMinute` (cost), `CacheTTLSeconds` +
   cache by `(memberID, content-hash)` (the biggest cost lever), value stamped into the version
   snapshot (reproducibility), rationale in `FactorResult.explanation` (explainability), and
   `PromotionState` (validate before production).

**Engine extension required for any of these:** an `ActionFactorEvaluator implements
IFactorEvaluator` whose `evaluateBatch` calls the Action set-based and maps to `FactorResult`;
`FactorCompiler.compile` then branches Declarative → `CompiledFactorEvaluator`, Action →
`ActionFactorEvaluator`. v1 ships only the declarative evaluator. (See [`roadmap.md`](roadmap.md).)
