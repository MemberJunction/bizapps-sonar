---
"@mj-biz-apps/sonar-ng": minor
---

Stop the Sonar Authoring Agent silently running on a weak model, and make sure "strongest" means strongest **LLM**.

The agent's prompt shipped with `SelectionStrategy='Specific'` but zero `AIPromptModel` links and `RequireSpecificModels=false`. In `AIPromptRunner` that builds an empty "specific" candidate set, and because specific models aren't required it computes a fallback target power rank from the configured list — which `computeTargetPowerRank` returns as `0` for an empty list — then sorts every active model by *proximity to 0*. That is weakest-first, so it picked Llama 3.1 8b (PowerRank 2) while frontier models sat Active and keyed. `PowerPreference: 'Highest'` was dead config, because it's only read on the `ByPower` path.

Switching to `SelectionStrategy='Default'` with `MinPowerRank=15` filters out everything below the floor and sorts PowerRank **descending**, so the strongest keyed model at or above the floor wins and a weak model can never be selected (if nothing at/above the floor has a usable key it errors loudly instead of downgrading). `Default` rather than `ByPower`+`Highest` because `MinPowerRank` is enforced only on the `Default` branch — `ByPower` routes to `sortByPowerPreference`, which never applies the floor and would re-open the same trap whenever top models lack keys.

The floor alone isn't enough, which is the second half of this change. `PowerRank` is stamped on **every** model in the registry, not just chat models, and the candidate pool is type-filtered only when the prompt sets `AIModelTypeID` (`getModelPoolForStrategy` short-circuits on `!prompt.AIModelTypeID`). This prompt left it NULL, so sorting descending put Rerankers at the top — `rerank-v4-pro` (110), `rerank-v3.5` (100) and `rerank-v4-fast` (90) all outrank every LLM, where the strongest sits near 30 and Gemini 3.1 Pro at 26. A reranker only reorders search results; it cannot answer a prompt at all. Left unscoped, the fix would have traded a silent *downgrade* for a silent wrong-**model-class** selection, and raising the floor couldn't help because it only trims from the bottom. Setting `AIModelTypeID` to MJ core's `LLM` type keeps rerankers, embedders, TTS and image models out of the pool entirely.

Ships as a forward migration plus PostgreSQL twin (the v0.2.0 seed is frozen), guarded on the target values so a re-run or a prior manual hotfix is a no-op.
