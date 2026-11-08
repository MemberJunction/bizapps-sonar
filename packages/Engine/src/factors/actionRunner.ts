import { LogError } from "@memberjunction/core";
import { ActionEngineServer } from "@memberjunction/actions";
import { ActionParam, ActionResult } from "@memberjunction/actions-base";
import { FactorEvaluationContext } from "../contracts/IFactorEvaluator";
import {
    ActionConfigError,
    ActionFactorSpec,
    ActionRunResult,
    ActionRunner,
    coerceOutput,
} from "./ActionFactorEvaluator";

/** A SonarFactorAction may emit a human "why" via this output param, used for score explainability. */
const EXPLANATION_PARAM = "Explanation";

/** The last param with the given name: an action that *appends* its result (rather than updating the
 *  pre-passed output slot in place) leaves the original null one first, so take the last. */
function readLastOutput(result: ActionResult, name: string): unknown {
    const matches = (result.Params ?? []).filter((p) => p.Name === name);
    return matches.length > 0 ? matches[matches.length - 1].Value : undefined;
}

/**
 * The real ActionRunner: invokes the bound MJ Action once per anchor via ActionEngineServer
 * (MJ has no batch RunAction). This is the only I/O in the Action-factor path — kept out of
 * ActionFactorEvaluator so that evaluator's logic stays pure + unit-testable. ActionEngineServer
 * is Config()'d lazily on first call and cached for the run.
 *
 * I/O contract: the anchor id goes in as `spec.anchorParam`; the as-of date as `spec.asOfParam`
 * (default "AsOf" — the bound Action MUST declare this input); static params as inputs; the value is
 * read from the `spec.outputParam` output and coerced via {@link coerceOutput} (non-numeric / absent /
 * empty → null = "no data" for that anchor); an optional `Explanation` output supplies the score's
 * human "why".
 */
export function createActionRunner(): ActionRunner {
    let configured = false;
    return async (
        anchorId: string,
        asOf: Date,
        spec: ActionFactorSpec,
        ctx: FactorEvaluationContext,
    ): Promise<ActionRunResult> => {
        const engine = ActionEngineServer.Instance;
        if (!configured) {
            await engine.Config(false, ctx.contextUser);
            configured = true;
        }
        const action = engine.Actions.find((a) => a.ID === spec.actionId);
        if (!action) {
            throw new Error(`ActionFactor: Action ${spec.actionId} not found in the catalog.`);
        }
        // SECURITY GATE: a Runtime action is AI/Studio-authored code, and the engine must never
        // execute it unless it is Active with APPROVED code — Factor.ActionID is configuration, so
        // without this check a factor could point at a Pending/Rejected or deactivated action and
        // the scoring engine would run that code anyway. This is a config-level condition (the same
        // for every anchor), so it raises ActionConfigError: the factor's run fails loudly with a
        // logged, user-visible error instead of degrading to no-data per anchor. Compiled (codebase)
        // actions carry no CodeApprovalStatus and are inherently trusted, so only Runtime is gated.
        if (action.Type === "Runtime" && (action.Status !== "Active" || action.CodeApprovalStatus !== "Approved")) {
            const detail = `Status '${action.Status}', CodeApprovalStatus '${action.CodeApprovalStatus ?? "(none)"}'`;
            LogError(
                `ActionFactor ${spec.factorId}: refused to run action '${action.Name}' (${spec.actionId}) — ${detail}.`,
            );
            throw new ActionConfigError(
                `ActionFactor: action '${action.Name}' is not approved to run (${detail}); a Runtime action ` +
                    `must be Active with Approved code before the engine can score with it.`,
            );
        }

        const params: ActionParam[] = [
            { Name: spec.anchorParam, Type: "Input", Value: anchorId },
            { Name: spec.asOfParam, Type: "Input", Value: asOf },
            ...spec.staticParams.map((p) => ({
                Name: p.name,
                Type: "Input" as const,
                Value: p.value,
            })),
            { Name: spec.outputParam, Type: "Output", Value: null },
        ];

        const result: ActionResult = await engine.RunAction({
            Action: action,
            ContextUser: ctx.contextUser,
            Params: params,
            Filters: [],
        });
        if (!result.Success) {
            throw new Error(result.Message ?? `Action '${action.Name}' failed.`);
        }

        const raw: unknown = readLastOutput(result, spec.outputParam);
        // A SonarFactorAction may also emit a human "why" via the `Explanation` output param — use it so
        // the score's explainability shows the action's own reasoning, not just a value dump. Falls back
        // to a generic value trace for actions that don't supply one.
        const explRaw = readLastOutput(result, EXPLANATION_PARAM);
        const actionExplanation =
            typeof explRaw === "string" && explRaw.trim().length > 0 ? explRaw.trim() : null;
        return {
            rawValue: coerceOutput(raw),
            explanation:
                actionExplanation ?? `action '${action.Name}' → ${spec.outputParam}=${String(raw)}`,
        };
    };
}
