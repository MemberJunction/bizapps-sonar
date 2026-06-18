import { ActionResultSimple, RunActionParams, ActionParam } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { RegisterClass } from "@memberjunction/global";
import { RecomputeOrchestrator, FactorPreviewDraft } from "@mj-biz-apps/sonar-engine";

/**
 * Sonar: Validate Factor — evaluates an UNSAVED draft declarative factor over the live
 * population WITHOUT persisting (RecomputeOrchestrator.previewFactor), and returns a
 * representative member's raw value + normalized strength for the factor builder's live preview.
 * Uses the exact compile→evaluate→normalize path a real recompute uses, so the preview matches
 * the eventual score. Read-only; safe on a draft model.
 *
 * Input params:  ModelID (string), DraftJSON (JSON of FactorPreviewDraft)
 * Output param:  Result  (JSON string of FactorPreviewResult)
 */
@RegisterClass(BaseAction, "SonarValidateFactor")
export class SonarValidateFactorAction extends BaseAction {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const modelId = this.getInput(params, "ModelID");
        const draftJson = this.getInput(params, "DraftJSON");
        if (!modelId || !draftJson) {
            return { Success: false, ResultCode: "VALIDATION_ERROR", Message: "ModelID and DraftJSON are required.", Params: params.Params };
        }
        let draft: FactorPreviewDraft;
        try {
            draft = JSON.parse(draftJson) as FactorPreviewDraft;
        } catch {
            return { Success: false, ResultCode: "VALIDATION_ERROR", Message: "DraftJSON is not valid JSON.", Params: params.Params };
        }
        try {
            const result = await new RecomputeOrchestrator().previewFactor(modelId, draft, new Date(), params.ContextUser);
            return {
                Success: true,
                ResultCode: "SUCCESS",
                Message: `Previewed ${result.membersWithData} member${result.membersWithData === 1 ? "" : "s"} with data.`,
                // Type 'Both' so the MJ ActionResolver serializes it into GraphQL ResultData.
                Params: [...params.Params, { Name: "Result", Value: JSON.stringify(result), Type: "Both" }],
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
