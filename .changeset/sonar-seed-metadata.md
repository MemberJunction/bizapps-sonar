---
"@mj-biz-apps/sonar-entities": minor
---

Seed starter `__sonar` metadata (mj-sync): reusable `TimeWindow`s (Trailing 30 Days / 90 Days / 12 Months, All Time, Renewal −90) and a default `ScoreBandSet` ("Default Health Bands": At Risk 0–40 / Neutral 40–70 / Healthy 70–100). Rolling windows leave `AnchorDateField` blank (the factor supplies the date column). Library factors are deferred (entity-specific, and the engine's library-factor path isn't built yet).
