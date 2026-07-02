/**
 * @mj-biz-apps/sonar-engine
 *
 * Stateless scoring services over the __sonar data (plan §6). The public surface
 * starts with the IFactorEvaluator contract — the single seam through which both
 * declarative (compiled-to-SQL) and Action-backed factors are evaluated, so the
 * scoring engine and explainability never branch on which kind they hold.
 */

export * from "./contracts/IFactorEvaluator";
export * from "./metadata/entityScope";
export * from "./factors/filter";
export * from "./factors/factorSql";
export * from "./factors/CompiledFactorEvaluator";
export * from "./factors/ActionFactorEvaluator";
export * from "./factors/actionRunner";
export * from "./factors/FactorCompiler";
export * from "./factors/anchorKey";
export * from "./normalization/NormalizationEngine";
export * from "./scoring/ScoringEngine";
export * from "./scoring/contributionDetail";
export * from "./scoring/scoreTrend";
export * from "./orchestration/RecomputeOrchestrator";
export * from "./orchestration/ScoreWriter";
