import { BaseRemotableOperation, IMetadataProvider, RemoteOpExecMode, RemoteOpServerContext, UserInfo } from "@memberjunction/core";
import { RegisterClass } from "@memberjunction/global";
import { RecomputeOrchestrator } from "@mj-biz-apps/sonar-engine";

/** Input for `Sonar.RecomputeModel`. */
export interface SonarRecomputeModelInput {
    /** The `MJ_BizApps_Sonar: Score Models` model to recompute + persist. Must be published. */
    modelID: string;
}

/** Output of `Sonar.RecomputeModel` — the run summary. */
export interface SonarRecomputeModelOutput {
    /** ID of the persisted `MJ_BizApps_Sonar: Score Recompute Runs` row. */
    runID: string;
    /** Run-level status (`Succeeded` / `Failed`). */
    status: string;
    /** Number of members scored + persisted. */
    recordsScored: number;
    /** Run-level error detail when `status` is not `Succeeded`. */
    errorMessage?: string;
}

/**
 * Sonar.RecomputeModel — the LongRunning Remote Operation the UI calls to recompute AND persist a
 * full scoring run. Wraps the exact same RecomputeOrchestrator.recompute() the Action-based path
 * uses, but as a provider-routed Remote Operation: it streams per-member progress back to the
 * client via context.emitProgress (so the button shows "scored N of M" instead of a dead spinner),
 * and it returns a result object rather than a promise that can hang if the API dies mid-run.
 *
 * Registered under the stable key that its `MJ: Remote Operations` row declares — the server
 * resolver resolves this class by that key (last @RegisterClass wins) after its metadata gate
 * (Status=Active) and scope gate (RequiredScope=sonar:recompute) pass.
 */
@RegisterClass(BaseRemotableOperation, "Sonar.RecomputeModel")
export class SonarRecomputeModelServerOperation extends BaseRemotableOperation<SonarRecomputeModelInput, SonarRecomputeModelOutput> {
    public readonly OperationKey = "Sonar.RecomputeModel";
    public readonly ExecutionMode: RemoteOpExecMode = "LongRunning";
    public readonly RequiredScope = "sonar:recompute";

    protected async InternalExecute(
        input: SonarRecomputeModelInput,
        _provider: IMetadataProvider,
        user: UserInfo,
        context: RemoteOpServerContext,
    ): Promise<SonarRecomputeModelOutput> {
        if (!input?.modelID) {
            throw new Error("Sonar.RecomputeModel: modelID is required.");
        }
        // Same orchestrator the Action path uses; the extra arg is the progress sink threaded down
        // to ScoreWriter's per-member persist loop (throttled there — see PROGRESS_EVERY).
        const run = await new RecomputeOrchestrator().recompute(
            input.modelID,
            new Date(),
            user,
            (processed, total) =>
                context.emitProgress({
                    OperationKey: this.OperationKey,
                    Status: "Running",
                    Processed: processed,
                    Total: total,
                    Message: `Scored ${processed} of ${total} members`,
                }),
        );
        return {
            runID: run.runId,
            status: run.status,
            recordsScored: run.recordsScored,
            errorMessage: run.status === "Succeeded" ? undefined : `Recompute ${run.status.toLowerCase()}.`,
        };
    }
}
