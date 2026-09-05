import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { Metadata } from "@memberjunction/core";
import { RecomputeOrchestrator, FactorPreviewDraft } from "@mj-biz-apps/sonar-engine";
import {
    mjBizAppsSonarModelRelatedEntityEntity,
    mjBizAppsSonarScoreModelEntity,
} from "@mj-biz-apps/sonar-entities";

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
export class SonarValidateFactorAction extends SonarActionBase {
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
        if (!draft.sourceRelatedEntityID) {
            return { Success: false, ResultCode: "VALIDATION_ERROR", Message: "DraftJSON.sourceRelatedEntityID is required.", Params: params.Params };
        }
        // Caller-facing preview over caller-controlled config: verify the caller can READ the
        // anchor entity and the draft's source entity BEFORE evaluating anything (the compiled
        // read path applies no entity permissions on its own).
        const denied = await this.readPermissionError(params, modelId, draft.sourceRelatedEntityID);
        if (denied) return denied;
        try {
            // 'runview' forces the permission-applying read path for eligible declarative factors,
            // so entity permissions + Row-Level Security apply to what the preview returns.
            const result = await new RecomputeOrchestrator("runview").previewFactor(modelId, draft, new Date(), params.ContextUser);
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

    /** Read-permission gate for the preview: the caller must be able to read BOTH the model's anchor
     *  entity and the draft's source entity (resolved via its Model Related Entity). Returns a
     *  teaching failure, or null when the caller may proceed. */
    private async readPermissionError(
        params: RunActionParams,
        modelId: string,
        sourceRelatedEntityId: string,
    ): Promise<ActionResultSimple | null> {
        const md = new Metadata();
        const model = await md.GetEntityObject<mjBizAppsSonarScoreModelEntity>("MJ_BizApps_Sonar: Score Models", params.ContextUser);
        if (!(await model.Load(modelId))) {
            return this.fail(params, "VALIDATION_ERROR", `No model found for ID '${modelId}'.`);
        }
        const anchor = md.EntityByID(model.AnchorEntityID);
        if (!anchor) {
            return this.fail(params, "ERROR", `Anchor entity ${model.AnchorEntityID} not found in metadata.`);
        }
        const anchorDenied = this.requireEntityRead(params, anchor.Name, `the model's anchor entity ('${anchor.Name}')`);
        if (anchorDenied) return anchorDenied;

        const mre = await md.GetEntityObject<mjBizAppsSonarModelRelatedEntityEntity>("MJ_BizApps_Sonar: Model Related Entities", params.ContextUser);
        if (!(await mre.Load(sourceRelatedEntityId))) {
            return this.fail(params, "VALIDATION_ERROR", `Data source '${sourceRelatedEntityId}' was not found (sourceRelatedEntityID must be one of the model's wired data sources).`);
        }
        const source = md.EntityByID(mre.RelatedEntityID);
        if (!source) {
            return this.fail(params, "ERROR", `Source entity ${mre.RelatedEntityID} not found in metadata.`);
        }
        return this.requireEntityRead(params, source.Name, `the factor's source entity ('${source.Name}')`);
    }
}
