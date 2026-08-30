import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { RecomputeOrchestrator } from "@mj-biz-apps/sonar-engine";

/** The shape serialized into the `Result` output param (parsed by SonarEngineService). */
interface CountPopulationPayload {
    /** Anchor records this model actually scores (population filter applied). */
    scoped: number;
    /** Anchor records in the whole entity, so the UI can say "66 of 2,000". */
    total: number;
    /** Whether a population filter narrowed the scope at all. */
    filtered: boolean;
}

/**
 * Sonar: Count Population — how many anchor records a model actually scores, with its
 * PopulationFilter applied (RecomputeOrchestrator.countPopulation). Two `count_only` reads; no keys
 * materialized, nothing scored, nothing persisted. Safe on a draft model.
 *
 * Why an Action rather than counting client-side: the population filter is compiled to SQL by the
 * engine (`compilePopulationFilter`), so answering "how many are in scope?" in the browser would mean
 * duplicating a security-sensitive compiler and giving the client a SQL-building surface. The count is
 * answered where the compiler already lives. Also usable as an agent tool — "how many members does
 * this model score?" is a question the authoring agent gets asked.
 *
 * Input param:  ModelID (string)
 * Output param: Result  (JSON string of CountPopulationPayload)
 */
@RegisterClass(BaseAction, "SonarCountPopulation")
export class SonarCountPopulationAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const modelId = this.getInput(params, "ModelID");
        if (!modelId) {
            return { Success: false, ResultCode: "VALIDATION_ERROR", Message: "ModelID is required.", Params: params.Params };
        }
        try {
            const payload: CountPopulationPayload = await new RecomputeOrchestrator().countPopulation(
                modelId,
                params.ContextUser,
            );
            return {
                Success: true,
                ResultCode: "SUCCESS",
                Message: payload.filtered
                    ? `${payload.scoped} of ${payload.total} record${payload.total === 1 ? "" : "s"} in scope.`
                    : `${payload.total} record${payload.total === 1 ? "" : "s"} in scope (no population filter).`,
                // Type 'Both' (not 'Output') — the MJ ActionResolver only serializes 'Both' params
                // into the GraphQL ResultData the client reads back.
                Params: [...params.Params, { Name: "Result", Value: JSON.stringify(payload), Type: "Both" }],
            };
        } catch (e: unknown) {
            return { Success: false, ResultCode: "ERROR", Message: e instanceof Error ? e.message : String(e), Params: params.Params };
        }
    }
}
