import { Injectable } from "@angular/core";
import { Metadata, RunView } from "@memberjunction/core";
import { ActionEngineBase } from "@memberjunction/actions-base";
import { GraphQLActionClient, GraphQLDataProvider } from "@memberjunction/graphql-dataprovider";
import { mjBizAppsSonarInterventionProposalEntity } from "@mj-biz-apps/sonar-entities";
import { extractActionResult } from "./action-result.util";
import { sqlString } from "./sql.util";

const RUN_INTERVENTION_ACTION = "Sonar: Run Intervention";
const MEASURE_OUTCOMES_ACTION = "Sonar: Measure Intervention Outcomes";
const PREVIEW_SEGMENT_ACTION = "Sonar: Preview Segment";

/** Play params the engine can fill from fire-time tokens (InterventionRunner.fillTokens). When a
 *  chosen play DECLARES one of these inputs and the operator supplied no value, the launch flow
 *  points it at its token — so a per-member play like Draft Outreach receives the real member/
 *  intervention/model ids on every fire without any param-editing UI. */
const TOKEN_PARAM_VALUES: Record<string, string> = {
    AnchorRecordID: "{{member}}",
    InterventionID: "{{interventionId}}",
    ModelID: "{{modelId}}",
};

/** The score-evaluable segment filter the launch panel builds from the current triage state
 *  (band/score range) or from the Movers view (a delta threshold — the "biggest droppers" rule). */
export interface LaunchSegmentFilter {
    bandId?: string | null;
    minScore?: number | null;
    maxScore?: number | null;
    minDelta?: number | null;
    maxDelta?: number | null;
    /** Restrict to members who changed band on the last run (the Movers "crossed a band" toggle). */
    crossedBandOnly?: boolean | null;
    // --- trust gate (evaluated in SQL by the engine) ---
    /** Minimum fraction (0–1) of signals that had real data — keeps a play off members whose low
     *  score is a data gap rather than disengagement. */
    minDataCompleteness?: number | null;
    // --- trajectory bounds (the engine reads ScoreHistory for these) ---
    /** The rule's own horizon in days, independent of the model's TrendWindowDays. */
    windowDays?: number | null;
    /** Rate of change in points per 30 days (negative = eroding), e.g. -8 = "losing 8 a month". */
    minSlopePer30Days?: number | null;
    maxSlopePer30Days?: number | null;
    /** Consecutive declines ending at the latest snapshot — "still sliding, for N+ cycles". */
    minDeclineRun?: number | null;
    /** Total points lost across the window, as a positive magnitude. */
    minNetDrop?: number | null;
    /** Ceiling on step-to-step variability — excludes erratic series from a trend cohort. */
    maxVolatility?: number | null;
    /** Snapshots required before a member is judged at all (defaults to 2 for trajectory rules). */
    minSnapshots?: number | null;
}

/** The full launch payload — mirrors SonarRunInterventionAction's ConfigJSON shape. */
export interface LaunchConfig {
    modelId: string;
    /** 'Action' fires a play per treated member; 'BulkSync' fires it ONCE with the whole treated
     *  cohort (e.g. sync to an MJ List); 'TrackOnly' just splits + measures (no play). */
    kind: "Action" | "TrackOnly" | "BulkSync";
    segment: { name: string; filter: LaunchSegmentFilter };
    intervention: { name: string; holdoutPercent: number };
    /** Omitted for TrackOnly; required for Action and BulkSync. */
    action: { actionId: string; params: { name: string; value: string }[] } | null;
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
    /** False → the chosen play isn't cleared to fire (a generated action needs approval); commit is blocked. */
    playApproved: boolean;
}

/** An MJ Action the operator can pick as the play (what fires per treated member). */
export interface FireableAction { id: string; name: string; description: string | null }

/** The trend shape the engine computed for a member, when the rule used trajectory bounds.
 *  Mirrors the engine's TrendShape (we can't import across packages, per the no-re-export rule). */
export interface MemberTrendShape {
    points: number;
    netChange: number | null;
    slopePerDay: number | null;
    declineRun: number;
    volatility: number | null;
}

/** One member as the engine resolved them, with the shape that qualified them (trajectory rules). */
export interface PreviewMember {
    scoreId: string;
    anchorRecordId: string;
    anchorRecordKeyJSON: string | null;
    normalizedScore: number | null;
    bandId: string | null;
    delta: number | null;
    shape: MemberTrendShape | null;
}

/** What `Sonar: Preview Segment` returns: the FULL cohort count plus the requested page. */
export interface SegmentPreview {
    total: number;
    page: number;
    pageSize: number;
    /** True when the rule needed ScoreHistory (slope / decline run / volatility / net drop). */
    usedTrajectory: boolean;
    members: PreviewMember[];
}

/** Treatment-vs-control lift for one intervention (engine's MeasureResult.lift). */
export interface LiftSummary {
    treatedMeasured: number;
    controlMeasured: number;
    /** Human label of the org's outcome definition (e.g. "climbed a band", "Status = Active"). */
    outcomeLabel: string;
    /** Share of each cohort that met the outcome definition + the headline lift (pp). */
    successRateTreatment: number | null;
    successRateControl: number | null;
    successLiftPct: number | null;
    /** Leading indicators (move faster than the real outcome). */
    avgScoreDeltaTreatment: number | null;
    avgScoreDeltaControl: number | null;
    scoreLift: number | null;
    bandUpRateTreatment: number | null;
    bandUpRateControl: number | null;
    bandUpLiftPct: number | null;
}

/** The measure action's full result. */
export interface MeasureResult { measured: number; alreadyMeasured: number; unmeasurable: number; lift: LiftSummary }

/** One configured intervention + its assignment tallies — the Interventions tab row. */
export interface InterventionSummary {
    id: string;
    name: string;
    kind: string;
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

/** What an EmailDraft proposal's PayloadJSON holds. */
export interface ProposalPayload {
    subject?: string;
    body?: string;
    recipientEmail?: string | null;
}

/** The score facts a proposal was grounded in (GroundingJSON). */
export interface ProposalGrounding {
    score?: number;
    bandName?: string | null;
    delta?: number | null;
    dominantCause?: string | null;
    factors?: { label: string; normalizedValue: number; percentOfTotal: number; hadData: boolean; explanation: string | null }[];
}

export type ProposalStatus = "Proposed" | "Approved" | "Rejected" | "Executed";

/** One reviewable proposal — an Outreach queue row (payload/grounding pre-parsed for the UI). */
export interface ProposalSummary {
    id: string;
    interventionId: string;
    interventionName: string;
    anchorRecordId: string;
    anchorName: string;
    proposalType: string;
    rationale: string | null;
    payload: ProposalPayload;
    grounding: ProposalGrounding;
    status: ProposalStatus;
    createdAt: string;
}

interface InterventionRow { ID: string; Name: string; Kind: string; ScoreSegmentID: string; TriggerType: string; ControlGroupPercent: number | null; Status: string }
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
    private readonly actionIdCache = new Map<string, string>();
    private readonly actionParamNameCache = new Map<string, string[]>();

    /** Run the launch payload through `Sonar: Run Intervention` (preview or commit). */
    public async run(config: LaunchConfig): Promise<{ ok: boolean; result?: LaunchResult; error?: string }> {
        const id = await this.resolveActionIdByName(RUN_INTERVENTION_ACTION);
        if (!id) return { ok: false, error: "The intervention action isn't available in this environment." };
        const payload = await this.withTokenParams(config);
        const res = await this.actionClient().RunAction(id, [
            { Name: "ConfigJSON", Value: JSON.stringify(payload), Type: "Input" },
        ]);
        if (!res.Success) return { ok: false, error: res.Message || "The intervention run failed." };
        const result = extractActionResult<LaunchResult>(res);
        return result ? { ok: true, result } : { ok: false, error: "The run returned no result payload." };
    }

    /**
     * Resolve a targeting rule through the ENGINE and get the cohort count + one page of members.
     *
     * Use this instead of re-expressing a rule as a client-side score query. Trajectory bounds
     * (slope, sustained decline, volatility) are computed from ScoreHistory inside the engine and
     * cannot be written as a single Score filter, so a client mirror can't evaluate them — and even
     * for the simple rules, two implementations of "who is in this cohort" drift apart. Writes
     * nothing.
     */
    public async previewSegment(
        modelId: string,
        filter: LaunchSegmentFilter,
        page = 0,
        pageSize = 50,
    ): Promise<{ ok: boolean; result?: SegmentPreview; error?: string }> {
        const id = await this.resolveActionIdByName(PREVIEW_SEGMENT_ACTION);
        if (!id) return { ok: false, error: "The segment preview action isn't available in this environment." };
        const res = await this.actionClient().RunAction(id, [
            { Name: "ModelID", Value: modelId, Type: "Input" },
            { Name: "FilterJSON", Value: JSON.stringify(filter), Type: "Input" },
            { Name: "Page", Value: String(page), Type: "Input" },
            { Name: "PageSize", Value: String(pageSize), Type: "Input" },
        ]);
        if (!res.Success) return { ok: false, error: res.Message || "Resolving the segment failed." };
        const result = extractActionResult<SegmentPreview>(res);
        return result ? { ok: true, result } : { ok: false, error: "The preview returned no result payload." };
    }

    /** Measure one intervention's outcomes (baseline vs now) and get the lift summary. */
    public async measure(interventionId: string): Promise<{ ok: boolean; result?: MeasureResult; error?: string }> {
        const id = await this.resolveActionIdByName(MEASURE_OUTCOMES_ACTION);
        if (!id) return { ok: false, error: "The measure action isn't available in this environment." };
        const res = await this.actionClient().RunAction(id, [
            { Name: "InterventionID", Value: interventionId, Type: "Input" },
        ]);
        if (!res.Success) return { ok: false, error: res.Message || "Measuring outcomes failed." };
        const result = extractActionResult<MeasureResult>(res);
        return result ? { ok: true, result } : { ok: false, error: "The measure run returned no result payload." };
    }

    /** The plays an operator can fire — ONLY the "Sonar Plays" category (purpose-built interventions),
     *  so the picker isn't polluted with the authoring/utility actions. */
    public async fireableActions(): Promise<FireableAction[]> {
        const res = await new RunView().RunView<ActionRow>({
            EntityName: "MJ: Actions",
            ExtraFilter: `Status='Active' AND Category='Sonar Plays'`,
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
            Fields: ["ID", "Name", "Kind", "ScoreSegmentID", "TriggerType", "ControlGroupPercent", "Status"],
            ResultType: "simple",
        });
        const interventions = ivRes.Success ? ivRes.Results ?? [] : [];
        if (!interventions.length) return [];

        const tallies = await this.assignmentTallies(interventions.map((i) => i.ID));
        return interventions.map((i) => ({
            id: i.ID,
            name: i.Name,
            kind: i.Kind,
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

    /** All proposals across this model's interventions — the Outreach queue, newest first. */
    public async proposalsForModel(modelId: string): Promise<ProposalSummary[]> {
        const segRes = await new RunView().RunView<SegmentRow>({
            EntityName: "MJ_BizApps_Sonar: Score Segments",
            ExtraFilter: `ScoreModelID='${sqlString(modelId)}'`,
            Fields: ["ID", "Name", "ScoreModelID"],
            ResultType: "simple",
        });
        const segments = segRes.Success ? segRes.Results ?? [] : [];
        if (!segments.length) return [];

        const ivRes = await new RunView().RunView<InterventionRow>({
            EntityName: "MJ_BizApps_Sonar: Interventions",
            ExtraFilter: `ScoreSegmentID IN (${segments.map((s) => `'${s.ID}'`).join(",")})`,
            Fields: ["ID", "Name", "Kind", "ScoreSegmentID", "TriggerType", "ControlGroupPercent", "Status"],
            ResultType: "simple",
        });
        const interventions = ivRes.Success ? ivRes.Results ?? [] : [];
        if (!interventions.length) return [];
        const ivNames = new Map(interventions.map((i) => [i.ID, i.Name]));

        const rowRes = await new RunView().RunView<{
            ID: string; InterventionID: string; AnchorRecordID: string; AnchorName: string | null;
            ProposalType: string; Rationale: string | null; PayloadJSON: string | null;
            GroundingJSON: string | null; Status: string; __mj_CreatedAt: string;
        }>({
            EntityName: "MJ_BizApps_Sonar: Intervention Proposals",
            ExtraFilter: `InterventionID IN (${interventions.map((i) => `'${sqlString(i.ID)}'`).join(",")})`,
            Fields: ["ID", "InterventionID", "AnchorRecordID", "AnchorName", "ProposalType", "Rationale", "PayloadJSON", "GroundingJSON", "Status", "__mj_CreatedAt"],
            OrderBy: "__mj_CreatedAt DESC",
            IgnoreMaxRows: true,
            ResultType: "simple",
        });
        return (rowRes.Success ? rowRes.Results ?? [] : []).map((r) => ({
            id: r.ID,
            interventionId: r.InterventionID,
            interventionName: ivNames.get(r.InterventionID) ?? "(intervention)",
            anchorRecordId: r.AnchorRecordID,
            anchorName: r.AnchorName ?? r.AnchorRecordID,
            proposalType: r.ProposalType,
            rationale: r.Rationale,
            payload: this.parseJson<ProposalPayload>(r.PayloadJSON) ?? {},
            grounding: this.parseJson<ProposalGrounding>(r.GroundingJSON) ?? {},
            status: (r.Status as ProposalStatus) ?? "Proposed",
            createdAt: r.__mj_CreatedAt,
        }));
    }

    /** Persist a review decision (and any operator edits to the payload). Approve/Reject stamp
     *  ReviewedAt; Executed stamps ExecutedAt (the PoC's simulated send). */
    public async saveProposalReview(
        proposalId: string,
        status: ProposalStatus,
        payload?: ProposalPayload,
    ): Promise<{ ok: boolean; error?: string }> {
        const row = await new Metadata().GetEntityObject<mjBizAppsSonarInterventionProposalEntity>(
            "MJ_BizApps_Sonar: Intervention Proposals",
        );
        await row.Load(proposalId);
        if (!row.IsSaved) return { ok: false, error: "Proposal not found." };
        if (payload) row.PayloadJSON = JSON.stringify(payload);
        row.Status = status;
        if (status === "Approved" || status === "Rejected") row.ReviewedAt = new Date();
        if (status === "Executed") row.ExecutedAt = new Date();
        const saved = await row.Save();
        return saved ? { ok: true } : { ok: false, error: row.LatestResult?.Message ?? "The proposal could not be saved." };
    }

    private parseJson<T>(raw: string | null): T | null {
        if (!raw) return null;
        try {
            return JSON.parse(raw) as T;
        } catch {
            return null;
        }
    }

    /** Point any token-fillable params the chosen play declares (and the operator didn't set) at
     *  their fire-time tokens. No-op for TrackOnly and for plays declaring none of them. */
    private async withTokenParams(config: LaunchConfig): Promise<LaunchConfig> {
        if (!config.action) return config;
        const declared = await this.declaredInputParamNames(config.action.actionId);
        const supplied = new Set(config.action.params.map((p) => p.name));
        const tokenParams = declared
            .filter((name) => name in TOKEN_PARAM_VALUES && !supplied.has(name))
            .map((name) => ({ name, value: TOKEN_PARAM_VALUES[name] }));
        if (tokenParams.length === 0) return config;
        return { ...config, action: { ...config.action, params: [...config.action.params, ...tokenParams] } };
    }

    /** The play's declared Input param names (cached — the catalog is static per session). */
    private async declaredInputParamNames(actionId: string): Promise<string[]> {
        const cached = this.actionParamNameCache.get(actionId);
        if (cached) return cached;
        const res = await new RunView().RunView<{ Name: string }>({
            EntityName: "MJ: Action Params",
            ExtraFilter: `ActionID='${sqlString(actionId)}' AND Type='Input'`,
            Fields: ["Name"],
            ResultType: "simple",
        });
        const names = res.Success ? (res.Results ?? []).map((r) => r.Name) : [];
        this.actionParamNameCache.set(actionId, names);
        return names;
    }

    private actionClient(): GraphQLActionClient {
        return new GraphQLActionClient(Metadata.Provider as GraphQLDataProvider);
    }

    private async resolveActionIdByName(name: string): Promise<string | null> {
        const cached = this.actionIdCache.get(name);
        if (cached) return cached;
        const provider = Metadata.Provider as GraphQLDataProvider;
        await ActionEngineBase.Instance.Config(false, provider.CurrentUser, provider);
        let action = ActionEngineBase.Instance.Actions.find((a) => a.Name === name);
        if (!action) {
            await ActionEngineBase.Instance.Config(true, provider.CurrentUser, provider);
            action = ActionEngineBase.Instance.Actions.find((a) => a.Name === name);
        }
        if (action) this.actionIdCache.set(name, action.ID);
        return action?.ID ?? null;
    }
}
