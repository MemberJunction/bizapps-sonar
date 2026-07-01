import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { Metadata, RunView, UserInfo } from "@memberjunction/core";
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
export class SonarAddDataSourceAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const modelId = this.getInput(params, "ModelID");
        const spec = this.parseJsonParam<AddDataSourceSpec>(params, "Spec");
        if (!modelId || !spec) {
            return this.fail(params, "VALIDATION_ERROR", "ModelID and Spec (a JSON object or string) are required.");
        }
        if (!spec.relatedEntityID || !spec.alias) {
            return this.fail(params, "VALIDATION_ERROR", "Spec.relatedEntityID and Spec.alias are required.");
        }
        const locked = await this.modelEditableError(params, modelId);
        if (locked) return locked;
        if (await this.aliasInUse(modelId, spec.alias, params.ContextUser)) {
            return this.failWithFix(params, "VALIDATION_ERROR", `Alias '${spec.alias}' is already used by a source on this model.`,
                "pick a different alias, or reuse the existing source (call Sonar: Describe Model to see current aliases). Do NOT re-add the same source.");
        }

        try {
            const ds = await this.addSource(modelId, spec, params.ContextUser);
            if (ds instanceof Error) {
                return this.fail(params, "ERROR", `Could not wire data source '${spec.alias}': ${ds.message}`);
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

    /** Create + save the Model Related Entity (Left join). Returns the row, or an Error with the real
     *  save message so a calling agent can self-correct. */
    private async addSource(modelId: string, spec: AddDataSourceSpec, contextUser?: UserInfo): Promise<mjBizAppsSonarModelRelatedEntityEntity | Error> {
        const md = new Metadata();
        const ds = await md.GetEntityObject<mjBizAppsSonarModelRelatedEntityEntity>(MODEL_RELATED_ENTITY, contextUser);
        ds.NewRecord();
        ds.ScoreModelID = modelId;
        ds.RelatedEntityID = spec.relatedEntityID;
        ds.Alias = spec.alias;
        ds.JoinType = "Left";
        ds.RelationshipPath = this.normalizeRelationshipPath(spec.relationshipPath);
        return (await ds.Save()) ? ds : new Error(this.errOf(ds));
    }

    /** Is this alias already wired into the model? (case-insensitive — aliases are identifiers.) */
    private async aliasInUse(modelId: string, alias: string, contextUser?: UserInfo): Promise<boolean> {
        const res = await new RunView().RunView<mjBizAppsSonarModelRelatedEntityEntity>(
            { EntityName: MODEL_RELATED_ENTITY, ExtraFilter: `ScoreModelID='${modelId}' AND LOWER(Alias)='${alias.trim().toLowerCase().replace(/'/g, "''")}'`, MaxRows: 1, ResultType: "simple" },
            contextUser,
        );
        return res.Success && res.Results.length > 0;
    }

    /** RelationshipPath must be a JSON array. Agents tend to invent dotted/SQL strings
     *  ("a.b.MemberID = c.ID") which fail validation — those mean "just auto-resolve", so coerce any
     *  non-JSON-array value to "[]" (the engine then resolves the direct FK itself). */
    private normalizeRelationshipPath(path: string | undefined): string {
        if (!path || path.trim().length === 0) return "[]";
        try {
            return Array.isArray(JSON.parse(path)) ? path : "[]";
        } catch {
            return "[]";
        }
    }
}
