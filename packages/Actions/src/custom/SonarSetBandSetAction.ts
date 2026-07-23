import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { Metadata, UserInfo } from "@memberjunction/core";
import { mjBizAppsSonarScoreModelEntity } from "@mj-biz-apps/sonar-entities";

const SCORE_MODEL = "MJ_BizApps_Sonar: Score Models";

/**
 * Sonar: Set Band Set — tool in the agentic authoring surface (plans/agentic-authoring.md §4a).
 * Points a model at a band set (ScoreModel.BandSetID) server-side, mirroring
 * `ScoreModelService.setBandSet`. The band set itself is an existing ScoreBandSet (authoring/creating
 * one is a separate tool); this just attaches it so the model becomes scoreable.
 *
 * Input params:  ModelID (string), BandSetID (string)
 * Output param:  Result  (JSON: { modelID, bandSetID })
 */
@RegisterClass(BaseAction, "SonarSetBandSet")
export class SonarSetBandSetAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const modelId = this.getInput(params, "ModelID");
        const bandSetId = this.getInput(params, "BandSetID");
        if (!modelId || !bandSetId) {
            return this.fail(params, "VALIDATION_ERROR", "ModelID and BandSetID are required.");
        }
        const locked = await this.modelEditableError(params, modelId);
        if (locked) return locked;

        try {
            const ok = await this.setBandSet(modelId, bandSetId, params.ContextUser);
            if (!ok) {
                return this.fail(params, "NOT_FOUND", `Score Model '${modelId}' not found (or save failed).`);
            }
            return {
                Success: true,
                ResultCode: "SUCCESS",
                Message: "Attached the band set to the model.",
                Params: [...params.Params, { Name: "Result", Value: JSON.stringify({ modelID: modelId, bandSetID: bandSetId }), Type: "Both" }],
            };
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    /** Load the model, point it at the band set, save. */
    private async setBandSet(modelId: string, bandSetId: string, contextUser?: UserInfo): Promise<boolean> {
        const md = new Metadata();
        const model = await md.GetEntityObject<mjBizAppsSonarScoreModelEntity>(SCORE_MODEL, contextUser);
        await model.Load(modelId);
        if (!model.IsSaved) return false;
        model.BandSetID = bandSetId;
        return model.Save();
    }

}
