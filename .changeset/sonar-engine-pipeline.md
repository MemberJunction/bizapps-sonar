---
"@mj-biz-apps/sonar-engine": patch
---

Add the sonar-engine scoring pipeline (compute stages, plan §6.1):

- `IFactorEvaluator` / `FactorResult` — the single contract through which every factor (declarative or Action-backed) is evaluated.
- `FactorCompiler` + `CompiledFactorEvaluator` — translate a declarative factor's config into one set-based SQL query and run it (v1: Count/Sum/Avg/Min/Max/DistinctCount aggregations with config-field validation, single-hop foreign-key join, rolling + all-time time windows).
- `compileFilter` — compiles a `FilterExpression` (Kendo-compatible filter descriptors, matching `UserView.FilterState`) into a **parameterized** WHERE fragment, validating every field against the related entity's columns (typo + injection guard).
- `NormalizationEngine` — fills `normalizedContribution`: `None` passthrough plus the population-relative `MinMax`, `Percentile` (rank with midpoint tie-handling), and `ZScore` (standardized, clamped to ±3) — with direction (`HigherIsBetter`) and output-range scaling.
- `ScoringEngine` — combines normalized contributions via rubric weights into a 0–100 score, assigns a band, and emits a per-factor contribution breakdown for explainability (v1: WeightedSum, missing-factor-as-zero).

- `RecomputeOrchestrator` + `ScoreWriter` — the conductor. `computeScores` runs the full pipeline (resolve population → evaluate + normalize each factor → combine) and returns scores; `recompute` additionally persists them: records a `ScoreRecomputeRun`, upserts each `Score` (keyed by model+anchor), and replaces its `ScoreFactorContribution` rows (requires a published model — stamps `ScoreModelVersionID`). `previewFactor` evaluates a single *unsaved draft* factor over the population without persisting, reusing the same compile→normalize path so a builder's live preview matches the eventual score.

The pure stages are unit-tested (vitest). v1 scope is deliberately narrow and fails loud outside it: WeightedSum models, full-population scoring from live config, row-by-row persistence (the scale path is set-based stage→MERGE + change-only diffing, not workers). Deferred: multi-hop joins, calendar/renewal-relative time windows, the remaining normalization methods (`Logistic`/`Banded`/`Lookup`), Action-backed/derived factors, `ScoreHistory`/`ScoreBandTransition`, scheduling.
