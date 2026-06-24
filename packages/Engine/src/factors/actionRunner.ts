import { ActionEngineServer } from "@memberjunction/actions";
import { ActionParam, ActionResult } from "@memberjunction/actions-base";
import { FactorEvaluationContext } from "../contracts/IFactorEvaluator";
import {
    ActionFactorSpec,
    ActionRunResult,
    ActionRunner,
} from "./ActionFactorEvaluator";

/**
 * The real ActionRunner: invokes the bound MJ Action once per anchor via ActionEngineServer
 * (MJ has no batch RunAction). This is the only I/O in the Action-factor path — kept out of
 * ActionFactorEvaluator so that evaluator's logic stays pure + unit-testable. ActionEngineServer
 * is Config()'d lazily on first call and cached for the run.
 *
 * I/O contract: the anchor id goes in as `spec.anchorParam`; the as-of date as `AsOf`; static
 * params as inputs; the result is read from the `spec.outputParam` output and coerced to a number
 * (non-numeric / absent → null = "no data" for that anchor).
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

        const params: ActionParam[] = [
            { Name: spec.anchorParam, Type: "Input", Value: anchorId },
            { Name: "AsOf", Type: "Input", Value: asOf },
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

        // Read the LAST param with the output name: an action that *appends* its result (rather
        // than updating the pre-passed output slot in place) leaves the original null one first.
        const outs = (result.Params ?? []).filter((p) => p.Name === spec.outputParam);
        const raw: unknown = outs.length > 0 ? outs[outs.length - 1].Value : undefined;
        const num = typeof raw === "number" ? raw : raw == null ? null : Number(raw);
        const rawValue = num !== null && Number.isFinite(num) ? num : null;
        return {
            rawValue,
            explanation: `action '${action.Name}' → ${spec.outputParam}=${String(raw)}`,
        };
    };
}
