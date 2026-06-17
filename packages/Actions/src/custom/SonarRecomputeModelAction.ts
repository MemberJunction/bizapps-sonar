import { ActionResultSimple, RunActionParams, ActionParam } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { RegisterClass } from "@memberjunction/global";
import { RecomputeOrchestrator } from "@mj-biz-apps/sonar-engine";

/**
 * Sonar: Recompute Model — computes AND persists a full scoring run
 * (RecomputeOrchestrator.recompute): records a ScoreRecomputeRun, upserts every Score and its
 * contributions, marks the run Succeeded/Failed. Requires a PUBLISHED model (a persisted Score
 * must reference the ScoreModelVersion that produced it).
 *
 * Input param:  ModelID (string)
 * Output param: Result  (JSON string of { runId, status, recordsScored })
 */
@RegisterClass(BaseAction, "SonarRecomputeModel")
export class SonarRecomputeModelAction extends BaseAction {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const modelId = this.getInput(params, "ModelID");
        if (!modelId) {
            return { Success: false, ResultCode: "VALIDATION_ERROR", Message: "ModelID is required.", Params: params.Params };
        }
        try {
            const run = await new RecomputeOrchestrator().recompute(modelId, new Date(), params.ContextUser);
            return {
                Success: run.status === "Succeeded",
                ResultCode: run.status === "Succeeded" ? "SUCCESS" : "ERROR",
                Message: `Recompute ${run.status.toLowerCase()} — scored ${run.recordsScored} record${run.recordsScored === 1 ? "" : "s"}.`,
                // Type 'Both' (not 'Output') — the MJ ActionResolver only serializes 'Both' params into ResultData.
                Params: [...params.Params, { Name: "Result", Value: JSON.stringify(run), Type: "Both" }],
            };
        } catch (e: unknown) {
            return { Success: false, ResultCode: "ERROR", Message: e instanceof Error ? e.message : String(e), Params: params.Params };
        }
    }

    /** Read a single input param's value as a string (null when absent/empty). */
    private getInput(params: RunActionParams, name: string): string | null {
        const p = params.Params.find((x: ActionParam) => x.Name === name);
        return p?.Value != null && p.Value !== "" ? String(p.Value) : null;
    }
}
