import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { Metadata, EntityInfo } from "@memberjunction/core";

/** System schemas to hide — operators score BUSINESS entities, not MJ's own plumbing or Sonar's tables.
 *  (Matches the deferred entity-picker scoping: anchors/sources are business entities only.) */
const SYSTEM_SCHEMAS = ["__mj", "__mj_BizAppsSonar"];
/** Cap the payload so a blank query can't dump the whole catalog at the agent. */
const MAX_RESULTS = 30;

interface EntityHit { id: string; name: string; schemaName: string; description: string | null }

/**
 * Sonar: Find Entities — resolves a business entity NAME to its ID (and lists candidate anchors). The
 * Authoring Agent needs an anchorEntityID to build a NEW model, but only knew entity NAMES — so it used
 * to dead-end asking the user for a raw UUID. This closes that gap: search by name (or list all business
 * entities when no query), scoped to business schemas (system/Sonar schemas hidden). Read-only.
 *
 * Input param:  NameQuery (optional string — case-insensitive substring; omit to list business entities)
 * Output param: Result (JSON: { entities: [{ id, name, schemaName, description }], count, truncated })
 */
@RegisterClass(BaseAction, "SonarFindEntities")
export class SonarFindEntitiesAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        try {
            const query = (this.getInput(params, "NameQuery") ?? "").trim().toLowerCase();
            const all = new Metadata().Entities.filter((e) => this.isBusinessEntity(e));
            const matched = query ? all.filter((e) => e.Name.toLowerCase().includes(query)) : all;
            const sorted = matched.sort((a, b) => a.Name.localeCompare(b.Name));
            const hits: EntityHit[] = sorted.slice(0, MAX_RESULTS).map((e) => ({
                id: e.ID,
                name: e.Name,
                schemaName: e.SchemaName,
                description: e.Description?.trim() || null,
            }));
            return this.ok(params, `Found ${matched.length} business entit${matched.length === 1 ? "y" : "ies"}.`, {
                entities: hits,
                count: matched.length,
                truncated: matched.length > hits.length,
            });
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    /** A business entity = not in a system/Sonar schema. */
    private isBusinessEntity(e: EntityInfo): boolean {
        return !SYSTEM_SCHEMAS.includes(e.SchemaName);
    }
}
