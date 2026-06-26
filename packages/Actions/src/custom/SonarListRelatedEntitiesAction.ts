import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { EntityInfo, Metadata } from "@memberjunction/core";
import { isBusinessEntity } from "@mj-biz-apps/sonar-engine";

/** One entity joinable to the anchor, with the field that links them. */
interface RelatedEntityOption {
    entityID: string;
    entityName: string;
    schemaName: string | null;
    viaField: string;
}

/**
 * Sonar: List Related Entities — the agent's READ tool for "what can I join to this anchor?". Given an
 * anchorEntityID it returns the BUSINESS entities that reference the anchor via a foreign key (the
 * one-to-many sources Sonar factors aggregate over — e.g. Members ← Event Registrations). Scoping comes
 * from the shared `isBusinessEntity` helper in sonar-engine, the SAME predicate the UI anchor/source
 * picker uses, so the agent and the picker never disagree on what's offered. Pure metadata read — no DB
 * query (walks MJ's cached entity graph).
 *
 * Input param:  AnchorEntityID
 * Output param: Result (JSON: { anchorEntityID, anchorEntityName, related: RelatedEntityOption[] })
 */
@RegisterClass(BaseAction, "SonarListRelatedEntities")
export class SonarListRelatedEntitiesAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const anchorEntityID = this.getInput(params, "AnchorEntityID");
        if (!anchorEntityID) {
            return this.fail(params, "VALIDATION_ERROR", "AnchorEntityID is required.");
        }

        try {
            const md = new Metadata();
            const anchor = md.Entities.find((e) => e.ID === anchorEntityID);
            if (!anchor) {
                return this.fail(params, "NOT_FOUND", `No entity found for ID '${anchorEntityID}'.`);
            }
            const related = this.relatedBusinessEntities(md.Entities, anchorEntityID);
            return this.ok(params, `Found ${related.length} business entity(ies) joinable to '${anchor.Name}'.`, {
                anchorEntityID,
                anchorEntityName: anchor.Name,
                related,
            });
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    /** Business entities with a foreign key pointing at the anchor (one-to-many sources), deduped. */
    private relatedBusinessEntities(entities: EntityInfo[], anchorEntityID: string): RelatedEntityOption[] {
        const options: RelatedEntityOption[] = [];
        for (const entity of entities) {
            if (entity.ID === anchorEntityID || !isBusinessEntity(entity)) continue;
            const linkField = entity.Fields.find((f) => f.RelatedEntityID === anchorEntityID);
            if (!linkField) continue;
            options.push({
                entityID: entity.ID,
                entityName: entity.Name,
                schemaName: entity.SchemaName,
                viaField: linkField.Name,
            });
        }
        return options.sort((a, b) => a.entityName.localeCompare(b.entityName));
    }
}
