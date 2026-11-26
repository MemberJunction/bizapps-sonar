import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { Metadata } from "@memberjunction/core";
import { SonarEngineBase } from "@mj-biz-apps/sonar-entities";

/** Cap the payload so a blank query can't dump every model at the agent. */
const MAX_RESULTS = 30;

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
            await SonarEngineBase.Instance.Config(false, params.ContextUser);
            const query = (this.getInput(params, "NameQuery") ?? "").trim().toLowerCase();
            const matched = [...SonarEngineBase.Instance.ScoreModels]
                .filter((m) => !query || (m.Name ?? "").toLowerCase().includes(query))
                .sort((a, b) => (a.Name ?? "").localeCompare(b.Name ?? ""));

            const entities = new Metadata().Entities;
            const hits: ModelHit[] = matched.slice(0, MAX_RESULTS).map((r) => ({
                id: r.ID,
                name: r.Name,
                status: r.Status,
                anchorEntityID: r.AnchorEntityID,
                anchorName: entities.find((e) => e.ID === r.AnchorEntityID)?.Name ?? null,
            }));
            return this.ok(params, `Found ${matched.length} model${matched.length === 1 ? "" : "s"}.`, {
                models: hits,
                count: matched.length,
                truncated: matched.length > hits.length,
            });
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }
}
