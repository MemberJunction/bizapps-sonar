import { ActionResultSimple, RunActionParams, ActionParam } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { RegisterClass } from "@memberjunction/global";
import { Metadata, UserInfo } from "@memberjunction/core";
import { mjBizAppsSonarScoreModelEntity } from "@mj-biz-apps/sonar-entities";

const SCORE_MODEL = "MJ_BizApps_Sonar: Score Models";

/** The model spec sent in the `Spec` param. A model is born Draft — nothing scores until published. */
interface CreateModelSpec {
    name: string;
    anchorEntityID: string;
}

/**
 * Sonar: Create Model — tool in the agentic authoring surface (plans/agentic-authoring.md §4a).
 * Creates a DRAFT ScoreModel (name + anchor) server-side, mirroring `ScoreModelService.create`, so
 * the agent and the UI share one write path. Draft by design (publish is a separate, gated step).
 *
 * Input param:  Spec (JSON of CreateModelSpec)
 * Output param: Result (JSON: { modelID })
 */
@RegisterClass(BaseAction, "SonarCreateModel")
export class SonarCreateModelAction extends BaseAction {
    /** Captured entity save-failure message (surfaced in the ERROR result). */
    private saveError = "save returned false";

    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const specJson = this.getInput(params, "Spec");
        if (!specJson) {
            return this.fail(params, "VALIDATION_ERROR", "Spec is required.");
        }
        const spec = this.parseSpec(specJson);
        if (!spec) {
            return this.fail(params, "VALIDATION_ERROR", "Spec is not valid JSON.");
        }
        if (!spec.name || spec.name.trim().length === 0) {
            return this.fail(params, "VALIDATION_ERROR", "Spec.name is required.");
        }
        if (!spec.anchorEntityID) {
            return this.fail(params, "VALIDATION_ERROR", "Spec.anchorEntityID is required.");
        }

        try {
            const model = await this.createModel(spec, params.ContextUser);
            if (!model) {
                return this.fail(params, "ERROR", `Failed to save the model: ${this.saveError}`);
            }
            return {
                Success: true,
                ResultCode: "SUCCESS",
                Message: `Created draft model '${spec.name}'.`,
                Params: [...params.Params, { Name: "Result", Value: JSON.stringify({ modelID: model.ID }), Type: "Both" }],
            };
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    /** Create + save a Draft model (Slug derived from name — it's UQ + NOT NULL). */
    private async createModel(spec: CreateModelSpec, contextUser?: UserInfo): Promise<mjBizAppsSonarScoreModelEntity | null> {
        const md = new Metadata();
        const model = await md.GetEntityObject<mjBizAppsSonarScoreModelEntity>(SCORE_MODEL, contextUser);
        model.NewRecord();
        model.Name = spec.name.trim();
        model.Slug = this.slugify(spec.name);
        model.Status = "Draft";
        model.AnchorEntityID = spec.anchorEntityID;
        if (await model.Save()) return model;
        this.saveError = model.LatestResult?.Message || JSON.stringify(model.LatestResult?.Errors ?? []) || "unknown";
        return null;
    }

    private parseSpec(json: string): CreateModelSpec | null {
        try {
            const parsed: unknown = JSON.parse(json);
            return parsed && typeof parsed === "object" ? (parsed as CreateModelSpec) : null;
        } catch {
            return null;
        }
    }

    private slugify(name: string): string {
        return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }

    private getInput(params: RunActionParams, name: string): string | null {
        const p = params.Params.find((x: ActionParam) => x.Name === name);
        return p?.Value != null && p.Value !== "" ? String(p.Value) : null;
    }

    private fail(params: RunActionParams, code: string, message: string): ActionResultSimple {
        return { Success: false, ResultCode: code, Message: message, Params: params.Params };
    }
}
