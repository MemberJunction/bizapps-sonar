/**
 * Custom (hand-authored) Sonar Actions — the server-side seam the UI calls to run the engine.
 * These are NOT CodeGen output; they wrap @mj-biz-apps/sonar-engine's RecomputeOrchestrator so
 * the browser can trigger scoring (which runs raw SQL and cannot run client-side) via RunAction.
 *
 * Each class registers under a DriverClass key (@RegisterClass) that the matching __mj.Action
 * metadata record points at (created in the engine-actions migration).
 */
export * from "./SonarPreviewModelAction";
export * from "./SonarRecomputeModelAction";
