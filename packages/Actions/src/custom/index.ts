/**
 * Custom (hand-authored) Sonar Actions — the server-side seam the UI calls to run the engine.
 * These are NOT CodeGen output; they wrap @mj-biz-apps/sonar-engine's RecomputeOrchestrator so
 * the browser can trigger scoring (which runs raw SQL and cannot run client-side) via RunAction.
 *
 * Each class registers under a DriverClass key (@RegisterClass) that the matching __mj.Action
 * metadata record points at (created in the engine-actions migration).
 */
export * from "./SonarFactorAction";
export * from "./SonarPreviewModelAction";
export * from "./SonarRecomputeModelAction";
// Remote Operation (not an Action) — the LongRunning, progress-streaming peer of the recompute
// Action. Lives here because this package already owns the RecomputeOrchestrator dependency and is
// side-effect-imported by the server bootstrap, so its @RegisterClass fires with the rest.
export * from "./SonarRecomputeModelOperation";
export * from "./SonarValidateFactorAction";
export * from "./SonarCreateFactorAction";
export * from "./SonarCreateModelAction";
export * from "./SonarAddDataSourceAction";
export * from "./SonarSetBandSetAction";
export * from "./SonarListFactorActionsAction";
export * from "./SonarGetPromptAction";
export * from "./SonarUpdatePromptAction";
export * from "./SonarRunAuthoringAgentAction";
export * from "./SonarBuildModelAction";
export * from "./SonarDescribeModelAction";
export * from "./SonarListRelatedEntitiesAction";
export * from "./SonarAuthorFactorAction";
export * from "./SonarStartFactorJobAction";
export * from "./SonarRefineFactorActionAction";
export * from "./SonarUnpublishModelAction";
export * from "./SonarFindEntitiesAction";
export * from "./SonarFindModelsAction";
export * from "./SonarTestSignalAction";
export * from "./SonarCancelFactorJobAction";
export * from "./SonarBindSignalToModelAction";
