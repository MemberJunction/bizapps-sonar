---
"@mj-biz-apps/sonar-engine": patch
---

Score the full population, with a per-factor missing-data policy and a model-level population filter.

The engine pipeline (#2) scored only anchors that had data for at least one factor, and a missing factor silently contributed 0. That conflates "no engagement" with "not in scope" and makes fully-inactive members vanish from the results instead of surfacing at the floor. This PR makes scoring population-complete and gives missing data an explicit, configurable meaning:

- **Full-population scoring** — `ScoringEngine.score` takes the resolved population and scores *every* anchor, not just those with data. An anchor with no countable factors returns null (nothing to score) rather than being silently dropped.
- **Missing-data policy** (per factor, from `Factor.MissingDataPolicy`): `Zero` counts an absent factor as 0, `NeutralMidpoint` as 0.5 (both keep the weight in the denominator, so missing data pulls the score), and `Exclude` drops the factor from both numerator and denominator (the anchor is scored only on the factors it has). Each contribution records whether it was measured or filled by policy, for explainability.
- **Population filter** — `ScoreModel.PopulationFilter` narrows which anchors get scored (e.g. "active members only"), compiled to a validated WHERE fragment via a new `compileFilterInline` (same field-whitelisting + parameterization guarantees as the factor filter compiler).

Pure stages stay unit-tested (`ScoringEngine` + `filter` suites). Engine-only; no schema, action, or UI changes — `Factor.MissingDataPolicy` and `ScoreModel.PopulationFilter` are existing columns this PR begins honoring.
