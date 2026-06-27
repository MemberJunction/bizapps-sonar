import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { Metadata, RunView } from "@memberjunction/core";

const SCORE_MODEL = "MJ_BizApps_Sonar: Score Models";
/** Cap the payload so a blank query can't dump every model at the agent. */
const MAX_RESULTS = 30;

interface ModelRow { ID: string; Name: string; Status: string; AnchorEntityID: string }
interface ModelHit { id: string; name: string; status: string; anchorEntityID: string; anchorName: string | null }

/**
 * Sonar: Find Models — resolves a model by PARTIAL name (and lists existing models). The Authoring Agent
 * could `Describe Model` only with a near-exact name and had no way to enumerate/fuzzy-match — so a vague
 * reference ("the cheese model") didn't resolve to "Cheese Member Engagement". This closes that gap:
 * substring search over model names → id/name/status/anchor, so the agent can pick the right model to edit
 * (and answer "what models do I have?"). Mirrors Sonar: Find Entities. Read-only.
 *
 * Input param:  NameQuery (optional string — case-insensitive substring; omit to list all models)
 * Output param: Result (JSON: { models: [{ id, name, status, anchorEntityID, anchorName }], count, truncated })
 */
@RegisterClass(BaseAction, "SonarFindModels")
export class SonarFindModelsAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        try {
            const query = (this.getInput(params, "NameQuery") ?? "").trim();
            const filter = query ? `Name LIKE '%${query.replace(/'/g, "''")}%'` : "";
            const res = await new RunView().RunView<ModelRow>(
                {
                    EntityName: SCORE_MODEL,
                    ExtraFilter: filter,
                    OrderBy: "Name ASC",
                    Fields: ["ID", "Name", "Status", "AnchorEntityID"],
                    ResultType: "simple",
                },
                params.ContextUser,
            );
            if (!res.Success) return this.fail(params, "ERROR", res.ErrorMessage || "Could not list models.");

            const rows = res.Results ?? [];
            const entities = new Metadata().Entities;
            const hits: ModelHit[] = rows.slice(0, MAX_RESULTS).map((r) => ({
                id: r.ID,
                name: r.Name,
                status: r.Status,
                anchorEntityID: r.AnchorEntityID,
                anchorName: entities.find((e) => e.ID === r.AnchorEntityID)?.Name ?? null,
            }));
            return this.ok(params, `Found ${rows.length} model${rows.length === 1 ? "" : "s"}.`, {
                models: hits,
                count: rows.length,
                truncated: rows.length > hits.length,
            });
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }
}
