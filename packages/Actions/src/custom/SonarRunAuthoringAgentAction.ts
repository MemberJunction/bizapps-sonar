import { ActionResultSimple, RunActionParams, ActionParam } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { RegisterClass } from "@memberjunction/global";
import { RunView } from "@memberjunction/core";
import { AgentRunner } from "@memberjunction/ai-agents";
import { MJAIAgentEntityExtended } from "@memberjunction/ai-core-plus";

const AGENT_NAME = "Sonar Authoring Agent";

/**
 * Sonar: Run Authoring Agent — runs the Sonar Authoring Agent (Loop) SERVER-SIDE via AgentRunner and
 * returns its reply. This is the seam the Assistant panel calls (via GraphQL RunAction) so the agent
 * runs in MJAPI — where the model/LLM/tools all live — instead of fighting the client-side
 * conversation/agent stack (which is version-skewed in this deployment). The agent's own tools are
 * the Sonar tool-surface actions (Create Model / Add Data Source / Create Factor / Set Band Set);
 * it produces DRAFTS only. See plans/agentic-authoring.md §4c.
 *
 * Input params:  Prompt (string), ContextNote (optional string — what the user is looking at)
 * Output param:  Reply (the agent's human-readable summary)
 */
@RegisterClass(BaseAction, "SonarRunAuthoringAgent")
export class SonarRunAuthoringAgentAction extends BaseAction {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const prompt = this.getInput(params, "Prompt");
        if (!prompt) {
            return this.fail(params, "VALIDATION_ERROR", "Prompt is required.");
        }
        const contextNote = this.getInput(params, "ContextNote");

        try {
            const agent = await this.loadAgent(params);
            if (!agent) {
                return this.fail(params, "NOT_FOUND", `Agent '${AGENT_NAME}' not found (seeded?).`);
            }
            const content = contextNote ? `${contextNote}\n\n${prompt}` : prompt;
            const result = await new AgentRunner().RunAgent({
                agent,
                conversationMessages: [{ role: "user", content }],
                contextUser: params.ContextUser,
            });
            if (!result?.success) {
                return this.fail(params, "ERROR", this.errorOf(result) ?? "The agent did not complete successfully.");
            }
            return {
                Success: true,
                ResultCode: "SUCCESS",
                Message: "Agent completed.",
                Params: [...params.Params, { Name: "Reply", Value: this.replyOf(result), Type: "Both" }],
            };
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    /** Load the agent entity; disable note/example injection (semantic search needs embeddings that
     *  may be unconfigured) so the run is robust. In-memory only — not saved. */
    private async loadAgent(params: RunActionParams): Promise<MJAIAgentEntityExtended | null> {
        const rv = await new RunView().RunView<MJAIAgentEntityExtended>(
            { EntityName: "MJ: AI Agents", ExtraFilter: `Name='${AGENT_NAME}'`, ResultType: "entity_object" },
            params.ContextUser,
        );
        const agent = rv.Success ? rv.Results?.[0] : undefined;
        if (!agent) return null;
        agent.InjectNotes = false;
        agent.InjectExamples = false;
        return agent;
    }

    /** Pull a human-readable reply out of the ExecuteAgentResult (its shape varies by agent type). */
    private replyOf(result: unknown): string {
        const r = result as { agentRun?: { Message?: unknown }; payload?: { message?: unknown } };
        const m = r.agentRun?.Message ?? r.payload?.message;
        return typeof m === "string" && m.trim() ? m : "Done — your draft is ready. Open the Model Builder to review it.";
    }

    /** Best-effort error message from a failed result. */
    private errorOf(result: unknown): string | null {
        const r = result as { agentRun?: { ErrorMessage?: unknown } };
        const e = r?.agentRun?.ErrorMessage;
        return typeof e === "string" && e.trim() ? e : null;
    }

    private getInput(params: RunActionParams, name: string): string | null {
        const p = params.Params.find((x: ActionParam) => x.Name === name);
        return p?.Value != null && p.Value !== "" ? String(p.Value) : null;
    }

    private fail(params: RunActionParams, code: string, message: string): ActionResultSimple {
        return { Success: false, ResultCode: code, Message: message, Params: params.Params };
    }
}
