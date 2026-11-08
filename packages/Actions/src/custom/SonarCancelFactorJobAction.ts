import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass, UUIDsEqual } from "@memberjunction/global";
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
            const run = await this.loadRun(agentRunId, params.ContextUser);
            if (!run) {
                return this.ok(params, "Nothing to cancel — no such job.", { aborted: false, statusFlipped: false });
            }
            // Ownership gate: AgentRunID is caller-supplied, and cancelRun() aborts ANY in-flight run
            // this process owns — so without this check one user could kill another user's job (or
            // flip its row to Cancelled). Only the user who started the run may cancel it.
            const callerId = params.ContextUser?.ID;
            if (!callerId || !UUIDsEqual(run.UserID, callerId)) {
                return this.failWithFix(params, "UNAUTHORIZED",
                    `Agent run '${agentRunId}' was started by a different user, so you cannot cancel it.`,
                    "only the user who started a factor job can cancel it.");
            }
            const aborted = cancelRun(agentRunId);
            // A true abort lets the agent write its own terminal state; only flip the row when we couldn't.
            const statusFlipped = aborted ? false : await this.flipToCancelled(run);
            if (!aborted && !statusFlipped) {
                return this.ok(params, "Nothing to cancel — the job already finished.", { aborted, statusFlipped });
            }
            return this.ok(params, aborted ? "Job cancelled." : "Job marked cancelled.", { aborted, statusFlipped });
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    /** Load the run row (null when it doesn't exist) — the ownership gate above needs it either way. */
    private async loadRun(agentRunId: string, contextUser: UserInfo | undefined): Promise<MJAIAgentRunEntity | null> {
        const run = await new Metadata().GetEntityObject<MJAIAgentRunEntity>("MJ: AI Agent Runs", contextUser);
        await run.Load(agentRunId);
        return run.IsSaved ? run : null;
    }

    /** Flip a still-in-flight run row to Cancelled. Returns false if the run is already terminal. */
    private async flipToCancelled(run: MJAIAgentRunEntity): Promise<boolean> {
        if (!CANCELLABLE.includes(run.Status)) return false;
        run.Status = "Cancelled";
        return run.Save();
    }
}
