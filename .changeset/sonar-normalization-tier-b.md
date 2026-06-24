---
"@mj-biz-apps/sonar-engine": patch
---

Add Tier-B normalization methods (`Logistic`, `Banded`, `Lookup`) behind a strategy registry.

The four population-relative methods shipped with the engine pipeline (`None`/`MinMax`/`Percentile`/`ZScore`) cover "scale relative to the group," but some signals need a fixed, configured shape independent of the population:

- **Logistic** — squashes a raw value through a logistic curve (configurable midpoint + steepness); good for "diminishing returns" signals where the first few events matter most.
- **Banded** — maps raw-value ranges to fixed output points (a step function); good when the business defines explicit tiers.
- **Lookup** — maps discrete raw values to output points via an explicit table; good for categorical/coded inputs.

To add these without a growing `switch`, `NormalizationEngine` is refactored into a thin dispatcher over an `INormalizationStrategy` registry — each method is a self-contained strategy (population-relative ones consume the whole population in one pass; fixed-shape ones are per-record). Per-method config is parsed and validated up front (`parseNormalizationParams`), so malformed config fails loud rather than silently mis-scaling. Pure (no I/O), fully unit-tested.

The public normalization surface (`NormalizationEngine`, `NormalizationSpec`, param types, the parser) is unchanged for consumers — the registry split is internal.
