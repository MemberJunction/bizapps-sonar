---
"@mj-biz-apps/sonar-actions": minor
"@mj-biz-apps/sonar-core-entities-server": minor
---

Extracted server-side correctness fixes from #40: the authoring agent can finally set `ModelFactor.MissingDataPolicy` (before this, no surface ever wrote it, so every no-data anchor silently scored worst-possible on sparse signals — Zero by default), `Sonar: Bind Signal To Model` gains a `MissingDataPolicy` param, score bands must tile the model's scale to publish (band-coverage gate), and an inverted band range is rejected at save. The Angular half of #40 (builders/planner UI) is carried by #50.
