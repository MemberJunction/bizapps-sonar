import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { Metadata, RunView, UserInfo } from "@memberjunction/core";
import { MJListEntity, MJListDetailEntity } from "@memberjunction/core-entities";
import { mjBizAppsSonarScoreModelEntity, mjBizAppsSonarInterventionEntity } from "@mj-biz-apps/sonar-entities";

const LIST_ENTITY = "MJ: Lists";
const LIST_DETAIL_ENTITY = "MJ: List Details";
const SCORE_MODEL = "MJ_BizApps_Sonar: Score Models";
const INTERVENTION_ENTITY = "MJ_BizApps_Sonar: Interventions";

/** One treated member as the InterventionRunner's BulkSync path serializes it into CohortJSON. */
interface CohortMember {
    anchorRecordId: string;
    anchorRecordKeyJSON?: string | null;
    score?: number | null;
    bandId?: string | null;
}

/**
 * Sonar: Sync Cohort To List — the first BULK play (Intervention.Kind='BulkSync'): one invocation
 * per run, carrying the whole TREATED cohort, not one per member. It lands the cohort on an
 * MJ **List** — the platform's native "named set of records" — because that is the one target
 * something can already act on today: the Lists app surfaces it to staff (worked row-by-row via
 * ListDetail.Status), it's shareable (Share List / Invite To List), and a connector can bind to it
 * (List.CompanyIntegrationID). Sonar builds no connector and no worklist of its own; it just
 * delivers the WHO and the WHY to MJ's doorstep.
 *
 * The runner injects CohortJSON / ModelID / InterventionID (runner-owned; operator values with
 * those names are dropped), and the payload is TREATED MEMBERS ONLY — control members must never
 * reach a place someone acts on, or the holdout comparison is contaminated.
 *
 * Idempotent per (list, member): the list is found-or-created by name and re-syncs skip records
 * already on it, so a re-run (or a next-day trigger firing on new entrants) only appends the new
 * names. Each ListDetail carries the member's score/band/intervention in AdditionalData, so the
 * person (or system) working the list sees why each name is there.
 *
 * Input params:  CohortJSON (runner-injected), ModelID (runner-injected),
 *                InterventionID (runner-injected), ListName? (operator; defaults to
 *                "Sonar: <intervention name>")
 * Output param:  Result (Both, JSON: { listId, listName, added, alreadyOnList })
 */
@RegisterClass(BaseAction, "SonarSyncCohortToList")
export class SonarSyncCohortToListAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const cohort = this.parseJsonParam<CohortMember[]>(params, "CohortJSON");
        const modelId = this.getInput(params, "ModelID");
        if (!cohort || !Array.isArray(cohort) || !modelId) {
            return this.fail(params, "VALIDATION_ERROR", "CohortJSON (an array) and ModelID are required.");
        }
        const bad = cohort.find((m) => !m || typeof m.anchorRecordId !== "string" || m.anchorRecordId.length === 0);
        if (bad !== undefined) {
            return this.fail(params, "VALIDATION_ERROR", "Every cohort entry needs a non-empty anchorRecordId.");
        }

        try {
            const anchorEntityID = await this.resolveAnchor(modelId, params.ContextUser);
            if (!anchorEntityID) {
                return this.fail(params, "NOT_FOUND", `Score Model '${modelId}' not found (or has no anchor).`);
            }
            const listName = await this.resolveListName(params);
            const list = await this.findOrCreateList(listName, anchorEntityID, params.ContextUser);
            if (!list) {
                return this.fail(params, "ERROR", `Couldn't create or load the list '${listName}'.`);
            }

            const existing = await this.recordIdsOnList(list.ID, params.ContextUser);
            const fresh = cohort.filter((m) => !existing.has(m.anchorRecordId));
            const interventionId = this.getInput(params, "InterventionID");
            let added = 0;
            for (const member of fresh) {
                if (await this.addToList(list.ID, member, interventionId, params.ContextUser)) added++;
            }
            // Partial writes are a real failure: the runner treats a non-success as "nothing
            // happened" and will retry the WHOLE batch — which is safe here (already-added rows are
            // skipped) but only honest if we report the shortfall loudly.
            if (added < fresh.length) {
                return this.fail(
                    params,
                    "ERROR",
                    `Only ${added} of ${fresh.length} record(s) could be written to '${listName}' — the run will retry; already-synced members are skipped.`,
                );
            }
            return this.ok(params, `Synced ${added} record(s) to '${listName}' (${existing.size} already on it).`, {
                listId: list.ID,
                listName,
                added,
                alreadyOnList: existing.size,
            });
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    /** The model's anchor entity — an MJ List is entity-typed, so the list must be typed to it. */
    private async resolveAnchor(modelId: string, contextUser?: UserInfo): Promise<string | null> {
        const model = await new Metadata().GetEntityObject<mjBizAppsSonarScoreModelEntity>(SCORE_MODEL, contextUser);
        await model.Load(modelId);
        return model.IsSaved ? model.AnchorEntityID : null;
    }

    /** Operator's ListName, else "Sonar: <intervention name>", else a safe constant. */
    private async resolveListName(params: RunActionParams): Promise<string> {
        const explicit = this.getInput(params, "ListName")?.trim();
        if (explicit) return explicit;
        const interventionId = this.getInput(params, "InterventionID");
        if (interventionId) {
            const iv = await new Metadata().GetEntityObject<mjBizAppsSonarInterventionEntity>(
                INTERVENTION_ENTITY,
                params.ContextUser,
            );
            await iv.Load(interventionId);
            if (iv.IsSaved && iv.Name) return `Sonar: ${iv.Name}`;
        }
        return "Sonar: Synced cohort";
    }

    /** Find the target list by exact name + anchor entity (so re-runs append), else create it. */
    private async findOrCreateList(name: string, anchorEntityID: string, contextUser?: UserInfo): Promise<MJListEntity | null> {
        const found = await new RunView().RunView<MJListEntity>(
            {
                EntityName: LIST_ENTITY,
                ExtraFilter: `Name='${this.sqlString(name)}' AND EntityID='${this.sqlString(anchorEntityID)}'`,
                MaxRows: 1,
                ResultType: "entity_object",
            },
            contextUser,
        );
        if (found.Success && found.Results?.[0]) return found.Results[0];

        const md = new Metadata();
        const list = await md.GetEntityObject<MJListEntity>(LIST_ENTITY, contextUser);
        list.NewRecord();
        list.Name = name;
        list.EntityID = anchorEntityID;
        list.Description = "Cohort synced by a Sonar intervention (treated records only — the holdout control group is deliberately excluded).";
        if (contextUser?.ID) list.UserID = contextUser.ID;
        return (await list.Save()) ? list : null;
    }

    /** RecordIDs already on the list — the per-member idempotency guard. */
    private async recordIdsOnList(listId: string, contextUser?: UserInfo): Promise<Set<string>> {
        const res = await new RunView().RunView<{ RecordID: string }>(
            {
                EntityName: LIST_DETAIL_ENTITY,
                ExtraFilter: `ListID='${this.sqlString(listId)}'`,
                Fields: ["RecordID"],
                IgnoreMaxRows: true,
                ResultType: "simple",
            },
            contextUser,
        );
        return new Set(res.Success ? (res.Results ?? []).map((r) => r.RecordID) : []);
    }

    /** One ListDetail row: the member, Pending (not yet worked), and the WHY in AdditionalData. */
    private async addToList(
        listId: string,
        member: CohortMember,
        interventionId: string | null,
        contextUser?: UserInfo,
    ): Promise<boolean> {
        const md = new Metadata();
        const row = await md.GetEntityObject<MJListDetailEntity>(LIST_DETAIL_ENTITY, contextUser);
        row.NewRecord();
        row.ListID = listId;
        row.RecordID = member.anchorRecordId;
        row.Status = "Pending";
        row.AdditionalData = JSON.stringify({
            source: "Sonar",
            interventionId: interventionId ?? null,
            score: member.score ?? null,
            bandId: member.bandId ?? null,
        });
        return row.Save();
    }
}
