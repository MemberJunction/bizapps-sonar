---
"@mj-biz-apps/sonar-entities": minor
---

Initial `__mj_BizAppsSonar` schema (plan §5.1–§5.4): 14 tables across configuration (ScoreModel, ScoreModelVersion, ModelRelatedEntity, ScoreBandSet, ScoreBand), factors & windows (Factor, TimeWindow, ModelFactor), runtime output (Score, ScoreFactorContribution, ScoreHistory, ScoreBandTransition), and recompute/audit (ScoreRecomputeRun, ScoreModelAuditEvent) — with generated entity classes, GraphQL resolvers, and Angular forms. Includes the schema-creation guard, composite/non-FK indexes, and folded CodeGen SQL. Also bumps the MemberJunction framework to 5.40.2.
