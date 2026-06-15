/**
 * @mj-biz-apps/sonar-engine
 *
 * Stateless scoring services over the __sonar data (plan §6). The public surface
 * starts with the IFactorEvaluator contract — the single seam through which both
 * declarative (compiled-to-SQL) and Action-backed factors are evaluated, so the
 * scoring engine and explainability never branch on which kind they hold.
 */

export * from "./contracts/IFactorEvaluator";
export * from "./factors/factorSql";
export * from "./factors/CompiledFactorEvaluator";
export * from "./factors/FactorCompiler";
export * from "./normalization/NormalizationEngine";
export * from "./scoring/ScoringEngine";
