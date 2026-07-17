import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { ACTIONSMITH, FACTOR_BRIEF, loadActionSmith, fireActionSmithDetached } from "./actionsmith.shared";

/**
 * Sonar: Start Factor Job — the ASYNC kickoff behind the Signal Studio. Fires ActionSmith on the Sonar
 * factor brief WITHOUT awaiting it (the run continues server-side on MJAPI) and returns the AgentRunID
 * immediately via the `onAgentRunCreated` hook. The Studio then OBSERVES the run by polling
 * AIAgentRun.Status — no held connection, no frozen tab, jobs can batch. Spike-proven: the hook fires at
 * run start, the un-awaited run completes on its own, and the persisted Runtime factor-action is readable
 * once Status='Completed'. See plans/agentic-authoring.md §5/§12.
 *
 * Input params:  Description (string), Context (optional string — anchor + sources)
 * Output param:  Result (JSON: { agentRunId })
 */
@RegisterClass(BaseAction, "SonarStartFactorJob")
export class SonarStartFactorJobAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const description = this.getInput(params, "Description");
        if (!description) {
            return this.fail(params, "VALIDATION_ERROR", "Description is required (the signal to build).");
        }
        const context = this.getInput(params, "Context");

        try {
            const agent = await loadActionSmith(params.ContextUser);
            if (!agent) {
                return this.fail(params, "NOT_FOUND", `'${ACTIONSMITH}' agent not found in this environment.`);
            }
            const content = `${FACTOR_BRIEF}${description}${context ? `\n\nContext (anchor + available sources):\n${context}` : ""}`;
            const agentRunId = await fireActionSmithDetached({ agent, content, contextUser: params.ContextUser });
            if (!agentRunId) {
                return this.fail(params, "ERROR", "The job didn't start (no run id was produced).");
            }
            return this.ok(params, "Factor job started.", { agentRunId });
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }
}
