import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { RecomputeOrchestrator } from "@mj-biz-apps/sonar-engine";

/**
 * Sonar: Recompute Model — computes AND persists a full scoring run
 * (RecomputeOrchestrator.recompute): records a ScoreRecomputeRun, upserts every Score and its
 * contributions, marks the run Succeeded/Failed. Requires a PUBLISHED model (a persisted Score
 * must reference the ScoreModelVersion that produced it).
 *
 * Input params: ModelID (string), AsOf (optional ISO date string — the "as of" business date the
 *               windowed factors are evaluated against; defaults to now). AsOf lets an operator
 *               backfill a trajectory by recomputing at several past dates.
 * Output param: Result  (JSON string of { runId, status, recordsScored })
 */
@RegisterClass(BaseAction, "SonarRecomputeModel")
export class SonarRecomputeModelAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const modelId = this.getInput(params, "ModelID");
        if (!modelId) {
            return { Success: false, ResultCode: "VALIDATION_ERROR", Message: "ModelID is required.", Params: params.Params };
        }
        const asOf = this.resolveAsOf(params);
        if (asOf === "invalid") {
            return { Success: false, ResultCode: "VALIDATION_ERROR", Message: "AsOf must be a valid date string.", Params: params.Params };
        }
        try {
            const run = await new RecomputeOrchestrator().recompute(modelId, asOf, params.ContextUser);
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

    /** The as-of date for this run: the AsOf param if given+valid, else now. "invalid" on a bad string. */
    private resolveAsOf(params: RunActionParams): Date | "invalid" {
        const raw = this.getInput(params, "AsOf");
        if (!raw) return new Date();
        const d = new Date(raw);
        return Number.isNaN(d.getTime()) ? "invalid" : d;
    }
}
