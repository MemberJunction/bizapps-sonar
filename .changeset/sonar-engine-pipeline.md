---
"@mj-biz-apps/sonar-engine": patch
---

Add the sonar-engine scoring pipeline (compute stages, plan §6.1):

- `IFactorEvaluator` / `FactorResult` — the single contract through which every factor (declarative or Action-backed) is evaluated.
- `FactorCompiler` + `CompiledFactorEvaluator` — translate a declarative factor's config into one set-based SQL query and run it (v1: Count aggregation, single-hop foreign-key join, rolling time window).
- `NormalizationEngine` — fills `normalizedContribution` (v1: `None` passthrough and population `MinMax`, with direction and output-range scaling).
- `ScoringEngine` — combines normalized contributions via rubric weights into a 0–100 score, assigns a band, and emits a per-factor contribution breakdown for explainability (v1: WeightedSum, missing-factor-as-zero).

All stages are pure and unit-tested (vitest). The `RecomputeOrchestrator` that wires these to live data and persistence is not yet included.
