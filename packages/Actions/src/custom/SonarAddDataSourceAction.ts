import { ActionResultSimple, RunActionParams, ActionParam } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { RegisterClass } from "@memberjunction/global";
import { Metadata, UserInfo } from "@memberjunction/core";
import { mjBizAppsSonarModelRelatedEntityEntity } from "@mj-biz-apps/sonar-entities";

const MODEL_RELATED_ENTITY = "MJ_BizApps_Sonar: Model Related Entities";

/** The data-source spec sent in the `Spec` param. */
interface AddDataSourceSpec {
    relatedEntityID: string;
    alias: string;
    /** Explicit anchor→source FK path (RelationshipPath JSON) when a tie was disambiguated; omit/""
     *  → engine auto-resolves (direct FK or unique multi-hop). */
    relationshipPath?: string;
}

/**
 * Sonar: Add Data Source — tool in the agentic authoring surface (plans/agentic-authoring.md §4a).
 * Wires a related entity into a model (a Model Related Entity, Left join) server-side, mirroring
 * `ScoreModelService.addDataSource`, so the agent and UI share one write path.
 *
 * Input params:  ModelID (string), Spec (JSON of AddDataSourceSpec)
 * Output param:  Result  (JSON: { modelRelatedEntityID })
 */
@RegisterClass(BaseAction, "SonarAddDataSource")
export class SonarAddDataSourceAction extends BaseAction {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const modelId = this.getInput(params, "ModelID");
        const specJson = this.getInput(params, "Spec");
        if (!modelId || !specJson) {
            return this.fail(params, "VALIDATION_ERROR", "ModelID and Spec are required.");
        }
        const spec = this.parseSpec(specJson);
        if (!spec) {
            return this.fail(params, "VALIDATION_ERROR", "Spec is not valid JSON.");
        }
        if (!spec.relatedEntityID || !spec.alias) {
            return this.fail(params, "VALIDATION_ERROR", "Spec.relatedEntityID and Spec.alias are required.");
        }

        try {
            const ds = await this.addSource(modelId, spec, params.ContextUser);
            if (!ds) {
                return this.fail(params, "ERROR", "Failed to wire the data source.");
            }
            return {
                Success: true,
                ResultCode: "SUCCESS",
                Message: `Wired data source '${spec.alias}' into the model.`,
                Params: [...params.Params, { Name: "Result", Value: JSON.stringify({ modelRelatedEntityID: ds.ID }), Type: "Both" }],
            };
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    /** Create + save the Model Related Entity (Left join; "[]" path = let the engine auto-resolve). */
    private async addSource(modelId: string, spec: AddDataSourceSpec, contextUser?: UserInfo): Promise<mjBizAppsSonarModelRelatedEntityEntity | null> {
        const md = new Metadata();
        const ds = await md.GetEntityObject<mjBizAppsSonarModelRelatedEntityEntity>(MODEL_RELATED_ENTITY, contextUser);
        ds.NewRecord();
        ds.ScoreModelID = modelId;
        ds.RelatedEntityID = spec.relatedEntityID;
        ds.Alias = spec.alias;
        ds.JoinType = "Left";
        ds.RelationshipPath = spec.relationshipPath && spec.relationshipPath.length > 0 ? spec.relationshipPath : "[]";
        return (await ds.Save()) ? ds : null;
    }

    private parseSpec(json: string): AddDataSourceSpec | null {
        try {
            const parsed: unknown = JSON.parse(json);
            return parsed && typeof parsed === "object" ? (parsed as AddDataSourceSpec) : null;
        } catch {
            return null;
        }
    }

    private getInput(params: RunActionParams, name: string): string | null {
        const p = params.Params.find((x: ActionParam) => x.Name === name);
        return p?.Value != null && p.Value !== "" ? String(p.Value) : null;
    }

    private fail(params: RunActionParams, code: string, message: string): ActionResultSimple {
        return { Success: false, ResultCode: code, Message: message, Params: params.Params };
    }
}
