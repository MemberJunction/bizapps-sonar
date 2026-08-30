---
"@mj-biz-apps/sonar-engine": patch
---

Re-port the population-exit fix (dc7ce074) onto the RSP persister: anchors whose Score rows exist but who were absent from this run's resolved population have their Score + contributions deleted (FK order preserved), so a narrowed PopulationFilter or a genuine departure no longer leaves stale rows on the triage list. ScoreHistory keeps the trail.
