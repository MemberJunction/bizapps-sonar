# How Sonar Works

Orientation for someone who has just been handed this repo. The goal is that after reading it you can open
any file in `packages/Engine` and know why it exists.

This is deliberately *not* the design spec. [`plan.md`](plan.md) is the spec (§5 data model, §6 pipeline) and
is the authority when the two disagree. This is the mental model you need before the spec makes sense.

---

## 1. What Sonar is

**Sonar turns activity into a 0-100 engagement score for any kind of record, and can explain every point of
it.** Point it at members, and it scores members. Point it at certifications, companies, or donors, and it
scores those. Nothing about "member" is baked in.

What makes it different from a report or a dashboard: **the scoring rules are rows in a database, not code.**
An operator defines what counts as engagement, how much each signal is worth, and where the healthy/at-risk
boundaries sit, all as configuration. The engine's job is to interpret that configuration faithfully.

What it deliberately is **not**: a query builder, a BI tool, or a campaign manager. It decides *who and why*.
Acting on that is somebody else's job (in this platform, MJ's).

## 2. The one idea that explains the whole codebase

> **Configuration is data. Code is the interpreter.**

Every design decision follows from this. When you find yourself about to write `if (factorName === 'payments')`,
you have misunderstood the architecture: that knowledge belongs in a row.

The practical consequence is that **almost nothing is hardcoded**, and the code is correspondingly abstract.
`FactorCompiler` doesn't know what a payment is. It knows how to turn "count rows in *some* related entity,
inside *some* time window, filtered by *some* expression" into SQL. That indirection is the point, and it is
why the engine can score an entity nobody thought about when it was written.

The corollary, which matters when you are debugging: **a wrong score is usually wrong configuration, not a
wrong algorithm.** Check the rows first.

## 3. Vocabulary

You cannot read the code without these six words. They are all entity names.

| Term | Plain meaning |
|---|---|
| **Anchor** | The thing being scored. A model's `AnchorEntityID` picks the entity; each scored row is an *anchor record*. |
| **Score Model** | One complete scoring definition: anchor, signals, weights, scale, bands. You can run many at once over the same data. |
| **Factor** | One signal. "How many payments", "days since last event", "did they ever renew". |
| **Time Window** | The slice of time a factor looks at. Reusable across factors. |
| **Model Factor** | The join between a model and a factor, carrying that factor's **weight** in this model. The same factor can be worth 40% in one model and 5% in another. |
| **Score Band** | A named range of the final score. "At Risk 0-40", "Healthy 70-100". Bands are what humans actually read. |

Two more worth knowing: **`ScoreFactorContribution`** stores per-factor detail for one score (this is what
makes a score explainable rather than a mystery number), and **`ScoreHistory`** is a snapshot per recompute,
which is what makes trends possible.

## 4. One score, end to end

This is the whole pipeline. Follow it once and the package layout will make sense.

```
  Score Model config (rows)
          |
          v
  1. FactorCompiler          config -> one SQL query per factor
          |
          v
  2. CompiledFactorEvaluator run it -> a RAW VALUE per anchor  (17 payments)
     ActionFactorEvaluator                                      (or: arbitrary code)
          |
          v
  3. NormalizationEngine     raw value -> 0..1 FRACTION        (17 payments -> 0.62)
          |
          v
  4. ScoringEngine           weighted combine -> 0..100 SCORE  (62.4)
          |
          v
  5. band lookup             score -> a named band            ("Neutral")
          |
          v
  6. ScoreWriter             persist Score + contributions + history
```

**Step 1 · Compile.** [`factors/FactorCompiler.ts`](../packages/Engine/src/factors/FactorCompiler.ts) turns a
`Factor` row into set-based SQL. It resolves *how to get from the anchor to the signal's table* by walking
foreign keys through MJ's entity metadata. If a `Payment` has no direct link to a `Member` but reaches one via
`Invoice`, the compiler finds that path itself. Ambiguous or unreachable paths throw rather than guess, and
`ModelRelatedEntity.RelationshipPath` is the override when you must disambiguate.

Aggregations available: `Count`, `DistinctCount`, `Sum`, `Avg`, `Min`, `Max`, `Exists`, `Recency`.
Window types: `Rolling`, `Calendar`, `AllTime`, `SinceEvent`, `RenewalRelative`.

**Why set-based matters:** one query per *factor*, not per anchor. Scoring 2,000 members with 2 factors is 2
queries, not 4,000. Any change that puts a query inside a per-anchor loop is a serious regression.

**Step 2 · Evaluate.** Two kinds of factor, [**one contract**](../packages/Engine/src/contracts/IFactorEvaluator.ts):

- **Declarative** ([`CompiledFactorEvaluator`](../packages/Engine/src/factors/CompiledFactorEvaluator.ts)):
  compiled to SQL as above. This is the normal case.
- **Action-backed** ([`ActionFactorEvaluator`](../packages/Engine/src/factors/ActionFactorEvaluator.ts)):
  arbitrary code behind an MJ Action, for signals SQL cannot express (call an API, run a model). Gated by a
  promotion state so untrusted code cannot silently enter a score.

The rubric never branches on which kind it holds. That is the contract's entire purpose.

**Step 3 · Normalize.** Raw values are incomparable: 17 payments and 340 days-since-login cannot be added.
[`normalizationStrategies.ts`](../packages/Engine/src/normalization/normalizationStrategies.ts) maps each raw
value to a 0..1 fraction via one of seven methods, which divide into two families that behave very differently:

- **Population-relative**: `MinMax`, `Percentile`, `ZScore`. Scored *against everyone else in this run*.
- **Absolute**: `Logistic`, `Banded`, `Lookup`, `None`. Scored against fixed configured thresholds.

**This distinction bites.** With `MinMax`, one member's raw value moving can change *everyone's* fraction,
because the population max shifted. That is either exactly what you want (relative ranking) or a source of
baffling drift (absolute health). Know which you picked. `HigherIsBetter` inverts the mapping for
signals where low is good.

**Step 4 · Combine.** [`ScoringEngine.ts`](../packages/Engine/src/scoring/ScoringEngine.ts), `WeightedSum`:

```
score = scaleMin + (Σ wᵢ · fractionᵢ / Σ wᵢ) × (scaleMax − scaleMin)
```

Note the denominator is the sum of weights *that counted*, so weights need not add to 1.

Which brings up the most consequential setting in the system. **What happens when a member has no data for a
factor?** `ModelFactor.MissingDataPolicy`:

| Policy | Effect | Meaning |
|---|---|---|
| `Zero` | counts as 0, weight stays in the denominator | "no data is bad news" |
| `NeutralMidpoint` | counts as 0.5, weight stays in | "no data neither helps nor hurts" |
| `Exclude` | dropped from numerator **and** denominator | "score them on what we do know" |

`ModelDefault` resolves to **`Zero`**, the harshest of the three. On a sparse data source that scores every
anchor with no rows as the worst possible. Choose deliberately; the default is a trap on sparse sources.

**Step 5 · Band.** The score falls into a `ScoreBand` by `MinScore`/`MaxScore`. Bands are ranges on a band
*set*, and a model points at one set, so several models can share a vocabulary.

**Step 6 · Persist.** [`ScoreWriter.ts`](../packages/Engine/src/orchestration/ScoreWriter.ts) writes three
things per anchor: the current **`Score`**, its per-factor **`ScoreFactorContribution`** rows, and a
**`ScoreHistory`** snapshot. Set-based SQL, not row-by-row.
[`RecomputeOrchestrator.ts`](../packages/Engine/src/orchestration/RecomputeOrchestrator.ts) wraps the lot in a
`ScoreRecomputeRun` for auditability, and `recompute()` is the single entry point for "score everything now".

## 5. Explainability is a feature, not a debug aid

A score nobody can defend is useless to the person acting on it. So every score keeps its working out:
`ScoreFactorContribution` holds each factor's raw value, its normalized fraction, and its weighted
contribution, and [`contributionDetail.ts`](../packages/Engine/src/scoring/contributionDetail.ts) is the
canonical decoder that turns those into human sentences.

**One trap, and it has caused a real bug.** `PercentOfTotal` on a contribution is **0 when the member had no
data for that factor**, precisely when that factor is hurting them most. So anything reasoning about *why* a
score is low must rank on the configured `ModelFactor.Weight`, never on `PercentOfTotal`. Use the canonical
decoder rather than recomputing this yourself; there is a documented history of copies diverging.

## 6. Versioning: why published models are frozen

A score is a claim about a member at a point in time. If the rules that produced it can change underneath it,
the claim is unfalsifiable and the audit trail is fiction.

So **publishing a model snapshots its entire configuration into `ScoreModelVersion`**, and every persisted
`Score` references the version that produced it. Old scores stay reproducible. This is also why editing a
published model is a deliberate ceremony rather than a text edit.

## 7. Where the seams are

What you actually came here to find out.

| To do this | Go here |
|---|---|
| Add a signal to a model | Rows, not code: a `Factor` + a `ModelFactor` with its weight. The UI (Model Builder / Signal Studio) writes them. |
| Add a new **kind** of signal | Implement `IFactorEvaluator`. Both existing evaluators are the worked examples. |
| Add an aggregation or window type | `factors/factorSql.ts`, then the enum on the `Factor` entity. |
| Add a normalization method | `normalization/normalizationStrategies.ts`, one class + a registry entry. |
| Change how the final score combines | `scoring/ScoringEngine.ts`. Be careful: this changes every historical comparison. |
| Expose something to the UI or an agent | An MJ **Action** in `packages/Actions`. Never widen a server package for the browser. |
| Long-running server work with progress | A **Remote Operation**. See [`remote-operations.md`](remote-operations.md). |

Two rules that are not negotiable, both in [`CLAUDE.md`](../CLAUDE.md):

1. **Domain logic runs server-side and travels as data.** The browser gets a label, a count, an answer, never
   the maths. Two implementations of the same rule will diverge, and one of them decides who gets contacted.
2. **`packages/Entities` is fully generated.** Never hand-edit it. Same for the other generated directories.

## 8. Seeing it run

```bash
npm run mj:migrate     # schema
npm run mj:codegen     # regenerate entities after any schema change
npm start              # API on 4102, Explorer on 4302
```

Then open Sonar in MJExplorer and hit recompute on a model. `INSTALL.md` covers a cold start, including a
verification query worth running after any codegen.

The fastest debug loop is **not** the UI. Bootstrap the engine in a standalone script and call it directly:

```js
await setupSQLServerClient(new SQLServerProviderConfigData(pool, "__mj"));
const user = UserCache.Instance.GetSystemUser();
await new RecomputeOrchestrator().recompute(modelId, new Date(), user);
```

That skips the API restart cycle entirely and is how most engine behaviour here has been verified.

## 9. Things that will surprise you

- **A wrong score is usually wrong configuration.** Read the `ModelFactor` rows before you read the engine.
- **`MissingDataPolicy` defaults to the harshest option.** On a sparse source, everyone with no rows scores 0.
- **`MinMax` is population-relative.** One outlier can move everyone. `Percentile` is the outlier-robust choice.
- **`PercentOfTotal` lies for missing data** (§5). Rank on configured weight.
- **Never put a query in a per-anchor loop.** The whole design is set-based; a loop silently makes it O(n) round trips.
- **Repeated recomputes minutes apart** produce near-identical `ScoreHistory` snapshots, which flattens any
  trend maths downstream. Dev burst-recomputes are a known source of nonsense slopes.
- **`strictNullChecks` is off repo-wide.** The compiler will not catch a null for you. Guard by hand.

## 10. What is not on this branch

This document covers **scoring**: turning activity into an explainable number. That is the half of Sonar that
lives here.

The other half decides **who needs attention and whether contacting them worked**: targeting rules over
trajectory and cause, ranked cohorts, a randomised holdout, plays that hand a cohort to MJ, and
treatment-versus-control measurement. That layer lands separately and brings its own documentation. If you are
reading a reference to `SegmentEvaluator`, `InterventionRunner` or `OutcomeMeasurer` and cannot find the file,
that is why.
