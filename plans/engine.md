# The Scoring Engine & Declarative Factors

How Sonar turns raw activity data into an explainable 0–100 score, and what you can express as a
factor without writing code. Describes *what actually runs today* (not the full plan.md design).
Source: `packages/Engine/src`.

> **One-line mental model:** for each member, pull some activity counts → put each count on a 0–1
> scale by comparing members to each other → blend those into one number → drop it into a labelled
> band. Every step is recorded, so the final score decomposes into "why."

---

## Part 1 — How a score is computed

### The pipeline (one model, one run)
`RecomputeOrchestrator` runs these stages. Stages marked ⚠️ are simplified vs. plan.md §6.1.

1. **Resolve population** — who gets scored. ⚠️ Today this is *every* record of the anchor entity
   (e.g. all Members). `ScoreModel.PopulationFilter` is ignored.
2. **Evaluate factors** — for each factor, run one SQL query over the whole population that joins
   the anchor to a related entity, applies the filter + time window, and aggregates
   (`FactorCompiler` → `CompiledFactorEvaluator`). Output per member: a `rawValue` (e.g. "7 events
   attended") and `hadData`.
3. **Normalize** — convert each raw value to a 0–1 `normalizedContribution` by comparing members
   to one another (`NormalizationEngine`). The step most people underestimate — see Concept 2.
4. **Combine** — blend the normalized factors into one score using the rubric weights, then scale
   to 0–100 (`ScoringEngine`).
5. **Band** — find the first band whose `[min, max]` range contains the score → "Healthy",
   "At-Risk", etc.
6. **Persist** — write a `Score` row + one `ScoreFactorContribution` row per factor (`ScoreWriter`).
   ⚠️ `ScoreHistory` and `ScoreBandTransition` are *not* written yet, so there's no trend/trajectory.

The engine has three entry points (all on `RecomputeOrchestrator`):
- **Preview/Simulate** (`computeScores`) — stages 1–5 for the whole model, returns scores *without*
  persisting. Backs the Model Builder distribution + Simulate.
- **Recompute** (`recompute`) — stages 1–6, persists `Score` + contributions + a `ScoreRecomputeRun`
  (requires a published model). Backs the Recompute button.
- **Factor preview** (`previewFactor`) — stages 1–3 for a *single unsaved draft factor* over the
  population, returning a representative member's real raw value + normalized strength. Powers the
  factor builder's live sample; reuses the exact compile→evaluate→normalize path, so the preview
  matches what the factor will actually do. Exposed via the *Sonar: Validate Factor* Action.

### Concept 1 — Factors (the raw signal)
A **factor** measures one thing about each member by aggregating a related entity over a window:

> *Count of Event Registrations, all time* → member A: 7, member B: 0, member C: 3 …

That's a raw number — not yet a score. A raw count of 7 means nothing until you know how 7 compares
to everyone else. That's normalization's job. A member with no matching records is treated as **no
data** and is currently *excluded* from scoring, not scored as 0 (so a 15-member population can
produce only 11 scores).

### Concept 2 — Normalization (raw value → 0–1) — the important part
Normalization maps each raw value onto a common 0–1 scale so factors with different magnitudes are
comparable. **Seven methods work today, in two families.** *Population-relative* methods rank/scale a
member **against the other members** (so a member's score depends on the cohort). *Per-value
(parameterized)* methods map each value through a fixed curve or table from `NormalizationParamsJSON`,
**independent of the population** (the same raw value always yields the same result). Every method is
an `INormalizationStrategy` behind a registry, so the rubric and explainability never branch on which
one ran.

**Population-relative** (need the whole population in one pass; `None` is a plain passthrough):

| Method | What it does | Good when | Watch out |
|---|---|---|---|
| **None** | Pass the raw value through unchanged | The raw number is already 0–1 | Big-magnitude factors will dominate |
| **MinMax** | `(x − min) / (max − min)` across the population | Simple, intuitive default | One outlier (a "whale") flattens everyone else toward 0 |
| **Percentile** | Member's *rank* within the population (0–1) | Robust to outliers; "top 20%" framing | The top member can't reach exactly 1.0 (see below) |
| **ZScore** | Standard deviations from the mean, clamped to ±3 then mapped to 0–1 | When spread/variance is what matters | Needs enough spread; flat populations collapse to 0.5 |

**Per-value / parameterized** (read `NormalizationParamsJSON`; each member scored on a fixed rule, not vs. the cohort):

| Method | What it does | Params | Good when |
|---|---|---|---|
| **Logistic** | Sigmoid curve `1 / (1 + e^(−steepness·(x − midpoint)))` → 0–1 | `{ midpoint, steepness }` | Diminishing returns — the first units of activity matter most; you have a fixed "what's healthy" target rather than a cohort to rank against |
| **Banded** | Bucket the value by ascending thresholds, emit each band's 0–1 `output` | `{ bands: [{ max, output }] }` (`max: null` = open top) | Explicit business cutoffs ("≥3 events = strong"). A value above all finite bands with no open top → neutral 0.5 |
| **Lookup** | Exact-match table `value → output`, else `fallback` | `{ entries: [{ value, output }], fallback }` | Discrete coded signals (status code → strength). Exact match only — no ranges/nearest |

**Picking a method — start from the question you're asking:**

| You want… | Use |
|---|---|
| Rank a member against the cohort | `Percentile` (robust) / `ZScore` (spread-sensitive) |
| Linear scale against the cohort's min/max | `MinMax` |
| A fixed "healthy target" with diminishing returns | `Logistic` |
| Explicit tiers / business cutoffs | `Banded` |
| A category-code → strength mapping | `Lookup` |
| The raw value is already 0–1 | `None` |

The split that matters: the first three are **population-relative** (the answer changes as the cohort changes); the last three are **per-value** (a fixed rule, same answer regardless of who else is scored).

**MinMax vs Percentile, concretely.** Take event counts `[0,0,0,7,7,20]`:
- **MinMax** maps the max (20) → 1.0 and everyone relative to it; the two 7s land at `7/20 = 0.35`,
  and the 20 looks dramatically better than the 7s.
- **Percentile** maps by *rank*: the 20 is on top, the two 7s share a high-but-not-top rank, the
  zeros share the bottom. Magnitude stops mattering, *order* does.

This is why a single member's score can change a lot just by switching the method — it's a different
question ("how big?" vs "how high-ranked?").

**Why the top member isn't 100 under Percentile.** Percentile uses the *midpoint method* for ties:
a member's rank is `(members below + half the members tied) / total`. Even the single highest
distinct value lands at `(n − 0.5)/n` — with 11 members the ceiling is `10.5/11 ≈ 0.95`, and ties
pull values further toward the middle. So "most events" becomes "near the top of the pack," not
"perfect." (If the whole population shares one value, everyone gets **0.5** — nothing to rank
against.)

`HigherIsBetter` (UI: "where more is a good sign / a warning sign") flips the direction: when false,
a higher raw value yields a *lower* contribution (e.g. "days since last login").

**All seven share the same tail.** Whatever 0–1 fraction a method produces still passes through
`HigherIsBetter` (direction) and `OutputMin`/`OutputMax` (scaling) — so a Banded `output` of 0.2 with
`higherIsBetter: false` on a 0–100 scale lands at 80. The three parameterized methods are validated
when the factor is resolved: a missing or malformed `NormalizationParamsJSON` throws a clear,
field-level error rather than silently mis-scoring.

### Concept 3 — The rubric (combine into one score)
The score is a **weighted average of the normalized factors, scaled to 0–100** (`ScoringEngine`):

```
rawScore        = Σ (weightᵢ × normalizedᵢ)          # over factors that had data
normalizedScore = scaleMin + (rawScore / Σ weightᵢ) × (scaleMax − scaleMin)
```

With a 0–100 scale that's `score = (Σ wᵢ·normᵢ / Σ wᵢ) × 100`.

**Gotcha:** with a *single* factor the weight cancels (`w·norm / w = norm`), so a 0.20 weight does
**not** cap the score at 20 — the score is just `norm × 100`. Weights only matter *relative to each
other*, i.e. once you have ≥2 factors. (That's also why live weight-tuning looks flat on a
one-factor model.) ⚠️ **Only additive weighting works today** — the rubric UI offers a "penalty /
hurts the score" mode, but the engine treats everything as additive; penalties don't subtract yet.

### Concept 4 — Bands
Bands turn the number into a label: a list of contiguous ranges (e.g. Healthy 67–100, Neutral 34–66,
At-Risk 0–33). The engine assigns the **first** band whose `[minScore, maxScore]` contains the
score. Bands drive every color and the distribution donut.

### Worked example — why Ava Chen scored 82
Model: one factor, *Count of Event Registrations*, **Percentile**, weight 0.20, scale 0–100, 11
scored.
1. Ava's raw count puts her near the top → percentile rank ≈ **0.82** (above ~8 of 11, tied with at
   least one → `9.0/11 = 0.818`).
2. Single factor → weight cancels → `0.818 × 100 = 81.8` → **82**.
3. 82 falls in the Healthy range → **Healthy**.

Under **MinMax** she'd score **100** (she held the max raw count → 1.0). Percentile says "near the
top of the pack," MinMax says "the biggest number." Same data, different question — both correct.

### Concept 5 — Explainability (the "why" is free)
Because the score is a sum of named contributions, each is stored as a `ScoreFactorContribution`
row (`weightedContribution`, `rawValue`, `hadData`). The Engagement Manager drawer and the Model
Builder preview read these to render the waterfall ("Events Attended +0.16 …"). Nothing extra is
computed — explainability falls out of the math.

---

## Part 2 — Declarative factor capabilities

A **declarative factor** is pure configuration — no code — compiled by `FactorCompiler` into one
set-based SQL query over the whole population. This documents what it can express (the MVP bar's
"~80% of factors" claim).

### The shape
> **`<aggregation>` of `<field?>` in `<related entity>` over `<time window>`, where `<filter?>`, and
> more-is-`<a good sign | a warning sign>`, normalized by `<method>`, weighted `<weight>`.**

Example: *Count of records in Event Registrations over Trailing 90 Days, where Status='Attended',
more is a good sign, normalized by Percentile, weight 0.30.* Every clause is a column on the
`Factor` / `ModelFactor` row.

### Supported today
| Dimension | Supported values |
|---|---|
| **Aggregation** | `Count`, `Sum`, `Avg`, `Min`, `Max`, `DistinctCount` (Sum/Avg/Min/Max need a numeric field) |
| **Source** | One related entity — **single or multi-hop** via `RelationshipPath` (e.g. Member → EmailSend → EmailClick) |
| **Filter** | A condition tree over the related entity (`mj-filter-builder`); empty = include all |
| **Time window** | `Rolling` (trailing N days) and `AllTime` |
| **Direction** | `HigherIsBetter` true/false |
| **Normalization** | `None`, `MinMax`, `Percentile`, `ZScore` (population-relative) + `Logistic`, `Banded`, `Lookup` (per-value, from `NormalizationParamsJSON`) |
| **Weight** | 0–1 fraction (additive; relative to other factors) |

**What that covers:** most engagement signals are "how much / how many of some activity" — event
participation, giving (Sum of payments), learning (DistinctCount of completions), email engagement,
active certifications, and lapse signals (same shape, direction flipped). Combine 3–6 with weights +
a band set → a credible Renewal-Risk-style rubric, entirely as config.

### Filter authoring (why `mj-filter-builder`)
MemberJunction dropped its Kendo license, so the old Kendo expression UI is deprecated. Filters
(`Factor.FilterExpression`, `ScoreModel.PopulationFilter`) are authored with the de-Kendo'd
**`<mj-filter-builder>`**, stored as MJ's standard `CompositeFilterDescriptor` JSON, and translated
to a SQL `WHERE` by `FactorCompiler` at compute time. Genuinely-arbitrary logic (the ~20%) is
reserved for the Action escape hatch, not hand-written SQL.

### The declarative ↔ Action line
- **Declarative** = aggregate one related entity with a filter + window, then rank/scale it. Fast,
  set-based, explainable for free. Everything in *Supported* above.
- **Action-backed** (escape hatch, not yet built) = arbitrary code (external propensity model, RFM
  decay, NLP sentiment). Satisfies the same `IFactorEvaluator` contract, so the rubric and
  explainability treat it identically.

**Honest read:** the declarative core covers the common factors well *once recency + renewal-window
gaps close*. Today it's closer to **~60–70%** of the ideal set, because recency and
renewal-relative-window factors — both common in real MEIs — aren't compiled yet. Closing those two
is the highest-leverage way to actually earn the 80% claim.

---

## What's NOT in the engine yet (so you don't over-promise)
| Gap | Detail |
|---|---|
| Population filter | Authored in UI, ignored by engine (scores everyone) |
| Penalty / multiplier / gate weight modes, caps, floors, trend-weight | Engine is additive-only |
| `MissingDataPolicy` | No-data members excluded, not scored Zero/NeutralMidpoint |
| Trend / history / confidence | `ScoreHistory`, `ScoreBandTransition`, Delta, TrendDirection, Confidence unwritten |
| Aggregations: Recency, RatePerPeriod, Exists, TrendSlope; recency decay | Not compiled |
| Windows: Calendar / SinceEvent / **RenewalRelative** | Only Rolling + AllTime (renewal-window is a flagship plan.md example — notable gap) |
| Action-backed / DerivedFromScore / Constant factors | Only Declarative; the `IFactorEvaluator` seam is ready for the rest |
| Calibrated (cross-tenant benchmark) normalization | Not built |

See [`roadmap.md`](roadmap.md) for where each gap sits in the plan.
