import { Injectable } from "@angular/core";
import { Metadata, RunView } from "@memberjunction/core";
import { ActionEngineBase } from "@memberjunction/actions-base";
import { GraphQLActionClient, GraphQLDataProvider } from "@memberjunction/graphql-dataprovider";
import { extractActionResult } from "./action-result.util";
import { sqlString } from "./sql.util";

const RUN_INTERVENTION_ACTION = "Sonar: Run Intervention";

/** The score-evaluable segment filter the launch panel builds from the current triage state. */
export interface LaunchSegmentFilter {
    bandId?: string | null;
    minScore?: number | null;
    maxScore?: number | null;
}

/** The full launch payload — mirrors SonarRunInterventionAction's ConfigJSON shape. */
export interface LaunchConfig {
    modelId: string;
    segment: { name: string; filter: LaunchSegmentFilter };
    intervention: { name: string; holdoutPercent: number };
    action: { actionId: string; params: { name: string; value: string }[] };
    cap: number;
    preview: boolean;
}

/** The engine's honest counts for a run (preview or commit). */
export interface LaunchResult {
    cohortSize: number;
    alreadyAssigned: number;
    eligible: number;
    capped: boolean;
    treated: number;
    held: number;
    sent: number;
    failed: number;
    preview: boolean;
}

/** An MJ Action the operator can pick as the play (what fires per treated member). */
export interface FireableAction { id: string; name: string; description: string | null }

/** One configured intervention + its assignment tallies — the Interventions tab row. */
export interface InterventionSummary {
    id: string;
    name: string;
    segmentName: string;
    triggerType: string;
    holdoutPercent: number | null;
    status: string;
    treated: number;
    held: number;
    sent: number;
    failed: number;
    lastAssignedAt: string | null;
}

interface InterventionRow { ID: string; Name: string; ScoreSegmentID: string; TriggerType: string; ControlGroupPercent: number | null; Status: string }
interface SegmentRow { ID: string; Name: string; ScoreModelID: string }
interface AssignmentRow { InterventionID: string; Cohort: string; ActionDeliveryStatus: string | null; AssignedAt: string }
interface ActionRow { ID: string; Name: string; Description: string | null }

/**
 * Engagement Manager's client for the action layer (plan §5.6): launch an intervention on the
 * cohort the operator is looking at (preview → commit through `Sonar: Run Intervention`, which owns
 * the holdout split + idempotency server-side) and read back configured interventions with their
 * treatment/control tallies for the Interventions tab.
 */
@Injectable({ providedIn: "root" })
export class InterventionService {
    private runActionId: string | null = null;

    /** Run the launch payload through `Sonar: Run Intervention` (preview or commit). */
    public async run(config: LaunchConfig): Promise<{ ok: boolean; result?: LaunchResult; error?: string }> {
        const id = await this.resolveRunActionId();
        if (!id) return { ok: false, error: "The intervention action isn't available in this environment." };
        const res = await this.actionClient().RunAction(id, [
            { Name: "ConfigJSON", Value: JSON.stringify(config), Type: "Input" },
        ]);
        if (!res.Success) return { ok: false, error: res.Message || "The intervention run failed." };
        const result = extractActionResult<LaunchResult>(res);
        return result ? { ok: true, result } : { ok: false, error: "The run returned no result payload." };
    }

    /** Active, param-less-friendly plays the operator can fire — Business Apps category actions. */
    public async fireableActions(): Promise<FireableAction[]> {
        const res = await new RunView().RunView<ActionRow>({
            EntityName: "MJ: Actions",
            ExtraFilter: `Status='Active' AND Category='Business Apps'`,
            OrderBy: "Name ASC",
            Fields: ["ID", "Name", "Description"],
            ResultType: "simple",
        });
        const rows = res.Success ? res.Results ?? [] : [];
        return rows.map((r) => ({ id: r.ID, name: r.Name, description: r.Description }));
    }

    /** All interventions on this model's segments, each with its assignment tallies. */
    public async summaries(modelId: string): Promise<InterventionSummary[]> {
        const segRes = await new RunView().RunView<SegmentRow>({
            EntityName: "MJ_BizApps_Sonar: Score Segments",
            ExtraFilter: `ScoreModelID='${sqlString(modelId)}'`,
            Fields: ["ID", "Name", "ScoreModelID"],
            ResultType: "simple",
        });
        const segments = segRes.Success ? segRes.Results ?? [] : [];
        if (!segments.length) return [];
        const segNames = new Map(segments.map((s) => [s.ID, s.Name]));
        const segList = segments.map((s) => `'${s.ID}'`).join(",");

        const ivRes = await new RunView().RunView<InterventionRow>({
            EntityName: "MJ_BizApps_Sonar: Interventions",
            ExtraFilter: `ScoreSegmentID IN (${segList})`,
            OrderBy: "__mj_CreatedAt DESC",
            Fields: ["ID", "Name", "ScoreSegmentID", "TriggerType", "ControlGroupPercent", "Status"],
            ResultType: "simple",
        });
        const interventions = ivRes.Success ? ivRes.Results ?? [] : [];
        if (!interventions.length) return [];

        const tallies = await this.assignmentTallies(interventions.map((i) => i.ID));
        return interventions.map((i) => ({
            id: i.ID,
            name: i.Name,
            segmentName: segNames.get(i.ScoreSegmentID) ?? "(segment)",
            triggerType: i.TriggerType,
            holdoutPercent: i.ControlGroupPercent,
            status: i.Status,
            ...(tallies.get(i.ID) ?? { treated: 0, held: 0, sent: 0, failed: 0, lastAssignedAt: null }),
        }));
    }

    /** Aggregate assignment counts per intervention (client-side — assignment volumes are capped). */
    private async assignmentTallies(
        interventionIds: string[],
    ): Promise<Map<string, { treated: number; held: number; sent: number; failed: number; lastAssignedAt: string | null }>> {
        const map = new Map<string, { treated: number; held: number; sent: number; failed: number; lastAssignedAt: string | null }>();
        if (!interventionIds.length) return map;
        const idList = interventionIds.map((id) => `'${sqlString(id)}'`).join(",");
        const res = await new RunView().RunView<AssignmentRow>({
            EntityName: "MJ_BizApps_Sonar: Intervention Assignments",
            ExtraFilter: `InterventionID IN (${idList})`,
            Fields: ["InterventionID", "Cohort", "ActionDeliveryStatus", "AssignedAt"],
            IgnoreMaxRows: true,
            ResultType: "simple",
        });
        for (const r of res.Success ? res.Results ?? [] : []) {
            const t = map.get(r.InterventionID) ?? { treated: 0, held: 0, sent: 0, failed: 0, lastAssignedAt: null };
            if (r.Cohort === "Treatment") {
                t.treated++;
                if (r.ActionDeliveryStatus === "Sent") t.sent++;
                if (r.ActionDeliveryStatus === "Failed") t.failed++;
            } else {
                t.held++;
            }
            if (!t.lastAssignedAt || r.AssignedAt > t.lastAssignedAt) t.lastAssignedAt = r.AssignedAt;
            map.set(r.InterventionID, t);
        }
        return map;
    }

    private actionClient(): GraphQLActionClient {
        return new GraphQLActionClient(Metadata.Provider as GraphQLDataProvider);
    }

    private async resolveRunActionId(): Promise<string | null> {
        if (this.runActionId) return this.runActionId;
        const provider = Metadata.Provider as GraphQLDataProvider;
        await ActionEngineBase.Instance.Config(false, provider.CurrentUser, provider);
        let action = ActionEngineBase.Instance.Actions.find((a) => a.Name === RUN_INTERVENTION_ACTION);
        if (!action) {
            await ActionEngineBase.Instance.Config(true, provider.CurrentUser, provider);
            action = ActionEngineBase.Instance.Actions.find((a) => a.Name === RUN_INTERVENTION_ACTION);
        }
        this.runActionId = action?.ID ?? null;
        return this.runActionId;
    }
}
