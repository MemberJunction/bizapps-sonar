import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { Metadata, RunView, UserInfo } from "@memberjunction/core";
import { mjBizAppsSonarScoreModelEntity } from "@mj-biz-apps/sonar-entities";

const SCORE_MODEL = "MJ_BizApps_Sonar: Score Models";
/** Statuses that lock a model's config. Unpublishing returns any of these to Draft so it's editable. */
const PUBLISHED_STATUSES = ["Active", "Paused"];

/**
 * Sonar: Unpublish Model — moves a published model (Active/Paused) back to Draft so it can be edited.
 * This is the SAFE direction only: it never publishes or activates (that stays a human gate), it just
 * unlocks editing. The published ScoreModelVersion snapshot is left intact for audit; flipping Status to
 * Draft is what the editable-model guard (SonarActionBase.modelEditableError) checks. Gives the Authoring
 * Agent a way to actually unlock a model the user asked to edit, instead of dead-ending on the lock.
 *
 * Input params:  ModelID (string) OR ModelName (string)
 * Output param:  Result (JSON: { modelID, name, previousStatus, status })
 */
@RegisterClass(BaseAction, "SonarUnpublishModel")
export class SonarUnpublishModelAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const modelId = this.getInput(params, "ModelID");
        const modelName = this.getInput(params, "ModelName");
        if (!modelId && !modelName) {
            return this.fail(params, "VALIDATION_ERROR", "Provide ModelID or ModelName (the model to unpublish).");
        }

        try {
            const model = await this.loadModel(params.ContextUser, modelId, modelName);
            if (!model) {
                return this.failWithFix(params, "NOT_FOUND",
                    `No model found for ${modelId ? `ID '${modelId}'` : `name '${modelName}'`}.`,
                    "confirm the model with Sonar: Describe Model. Do NOT retry with the same identifier.");
            }

            const previousStatus = model.Status;
            if (previousStatus === "Draft") {
                // Already editable — report success so the agent stops re-checking and just proceeds to edit.
                return this.ok(params, `Model '${model.Name}' is already Draft (editable).`,
                    { modelID: model.ID, name: model.Name, previousStatus, status: "Draft" });
            }
            if (!PUBLISHED_STATUSES.includes(previousStatus)) {
                return this.failWithFix(params, "ERROR",
                    `Model '${model.Name}' is ${previousStatus}; only Active/Paused models can be unpublished to Draft.`,
                    "leave it as-is, or create a new draft model for these changes.");
            }

            model.Status = "Draft";
            if (!(await model.Save())) {
                return this.fail(params, "ERROR", `Failed to unpublish '${model.Name}': ${this.errOf(model)}`);
            }
            return this.ok(params, `Unpublished '${model.Name}' to Draft — it's editable now.`,
                { modelID: model.ID, name: model.Name, previousStatus, status: "Draft" });
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    /** Load the model by ID (preferred) or by exact name. */
    private async loadModel(
        contextUser: UserInfo | undefined,
        modelId: string | null,
        modelName: string | null,
    ): Promise<mjBizAppsSonarScoreModelEntity | null> {
        if (modelId) {
            const model = await new Metadata().GetEntityObject<mjBizAppsSonarScoreModelEntity>(SCORE_MODEL, contextUser);
            await model.Load(modelId);
            return model.IsSaved ? model : null;
        }
        const res = await new RunView().RunView<mjBizAppsSonarScoreModelEntity>(
            { EntityName: SCORE_MODEL, ExtraFilter: `Name='${this.sqlString(modelName ?? "")}'`, MaxRows: 1, ResultType: "entity_object" },
            contextUser,
        );
        return res.Success && res.Results.length ? res.Results[0] : null;
    }
}
