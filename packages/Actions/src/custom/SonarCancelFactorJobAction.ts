import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { Metadata, UserInfo } from "@memberjunction/core";
import { MJAIAgentRunEntity } from "@memberjunction/core-entities";
import { cancelRun } from "./actionsmith.shared";

/** Run states that can still be cancelled — once Completed/Failed/Cancelled there's nothing to stop. */
const CANCELLABLE = ["Running", "AwaitingFeedback", "Paused"];

/**
 * Sonar: Cancel Factor Job — stop an in-flight ActionSmith run (a commission or a refine) from the Signal
 * Studio. Two cooperating mechanisms:
 *  1. {@link cancelRun} aborts the run's AbortController IF this MJAPI process owns it — a TRUE cancel: the
 *     agent loop stops and the (skipped) refine transplant never fires.
 *  2. Fallback — if no live controller is found (run owned by another instance, or already past the abort
 *     check), flip the AIAgentRun row to Cancelled so it leaves the Studio's in-flight feed and reads as
 *     cancelled in history. The watchdog reconciles any process that's still grinding.
 *
 * Input param:  AgentRunID (string — the run to cancel)
 * Output param: Result (JSON: { aborted: boolean, statusFlipped: boolean })
 */
@RegisterClass(BaseAction, "SonarCancelFactorJob")
export class SonarCancelFactorJobAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const agentRunId = this.getInput(params, "AgentRunID");
        if (!agentRunId) return this.fail(params, "VALIDATION_ERROR", "AgentRunID is required (the run to cancel).");

        try {
            const aborted = cancelRun(agentRunId);
            // A true abort lets the agent write its own terminal state; only flip the row when we couldn't.
            const statusFlipped = aborted ? false : await this.flipToCancelled(agentRunId, params.ContextUser);
            if (!aborted && !statusFlipped) {
                return this.ok(params, "Nothing to cancel — the job already finished.", { aborted, statusFlipped });
            }
            return this.ok(params, aborted ? "Job cancelled." : "Job marked cancelled.", { aborted, statusFlipped });
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    /** Flip a still-in-flight run row to Cancelled. Returns false if the run is missing or already terminal. */
    private async flipToCancelled(agentRunId: string, contextUser: UserInfo | undefined): Promise<boolean> {
        const run = await new Metadata().GetEntityObject<MJAIAgentRunEntity>("MJ: AI Agent Runs", contextUser);
        await run.Load(agentRunId);
        if (!run.IsSaved || !CANCELLABLE.includes(run.Status)) return false;
        run.Status = "Cancelled";
        return run.Save();
    }
}
