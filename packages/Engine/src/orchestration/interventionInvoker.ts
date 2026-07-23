import { UserInfo } from "@memberjunction/core";
import { ActionEngineServer } from "@memberjunction/actions";
import { ActionParam } from "@memberjunction/actions-base";
import { InterventionActionInvoker } from "./InterventionRunner";

/**
 * The real InterventionActionInvoker: fires an arbitrary MJ Action (the chosen intervention — a Slack
 * webhook, an email send, an HTTP call) with its configured params, via ActionEngineServer. This is
 * the only I/O in the intervention path — kept out of InterventionRunner so the planning/split logic
 * stays pure + unit-testable. ActionEngineServer is Config()'d lazily and cached for the run.
 *
 * Safety note: WHERE the message goes is entirely the action's own params (a fixed Slack channel URL,
 * or a test recipient) — the runner never derives a recipient from member data, so a run can only
 * reach the single destination the author configured, never blast every member's real contact.
 */
export function createInterventionInvoker(): InterventionActionInvoker {
    let configured = false;
    return async (
        actionId: string,
        params: { name: string; value: string }[],
        contextUser: UserInfo,
    ): Promise<{ success: boolean; message?: string }> => {
        const engine = ActionEngineServer.Instance;
        if (!configured) {
            await engine.Config(false, contextUser);
            configured = true;
        }
        const action = engine.Actions.find((a) => a.ID === actionId);
        if (!action) {
            throw new Error(`InterventionRunner: Action ${actionId} not found in the catalog.`);
        }
        const actionParams: ActionParam[] = params.map((p) => ({
            Name: p.name,
            Type: "Input",
            Value: p.value,
        }));
        const result = await engine.RunAction({
            Action: action,
            ContextUser: contextUser,
            Params: actionParams,
            Filters: [],
        });
        return { success: result.Success, message: result.Message };
    };
}
