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
const SEND_APPROVED_ACTION = "Sonar: Send Approved Outreach";
const EXPLAIN_SCORES_ACTION = "Sonar: Explain Scores";

/** Play params the engine can fill from fire-time tokens (InterventionRunner.fillTokens). When a
 *  chosen play DECLARES one of these inputs and the operator supplied no value, the launch flow
 *  points it at its token — so a per-member play like Draft Outreach receives the real member/
 *  intervention/model ids on every fire without any param-editing UI. */
const TOKEN_PARAM_VALUES: Record<string, string> = {
    AnchorRecordID: "{{member}}",
    InterventionID: "{{interventionId}}",
    ModelID: "{{modelId}}",
};

/** Params the ENGINE supplies, so the launch panel must never ask a person for them. Token-filled
 *  params (above) plus the BulkSync cohort payload, which the runner injects with the treated members
 *  only — offering it as a text box would invite someone to hand-edit who gets contacted. */
const RUNNER_SUPPLIED_PARAMS: ReadonlySet<string> = new Set([...Object.keys(TOKEN_PARAM_VALUES), "CohortJSON"]);

/** One param a play declares that the OPERATOR has to fill (Subject, Body, From, …). */
export interface PlayParam {
    name: string;
    /** Human form of the name for the field label — "TestRecipient" reads as "Test recipient". */
    label: string;
    isRequired: boolean;
    /** The seed description — the only guidance an operator gets, so it is shown as help text. */
    description: string | null;
    defaultValue: string | null;
    /** Long-form values (a message body) want a textarea rather than a single-line input. */
    multiline: boolean;
    /** True/false params render as a switch, not a text box someone types "true" into. */
    boolean: boolean;
    /** What the action falls back to when the param is left blank — declared DefaultValue, or parsed
     *  from the description's "default 'X'" / "Defaults to TRUE" phrasing. Shown as a placeholder so
     *  an untouched field is visibly "the default", not "empty". */
    effectiveDefault: string | null;
}

/** Params whose natural reading order everyone knows (an email is Subject → Body → From). Params not
 *  listed sort after these: required before optional, then A→Z. Without this the fields land in
 *  alphabetical-accident order — Body, From, Subject — because ActionParam has no sequence column. */
const PARAM_DISPLAY_ORDER = ["To", "Subject", "Body", "From"];

/** "TestRecipient" → "Test recipient": split camelCase, keep the leading capital, lowercase the rest. */
function humanizeParamName(name: string): string {
    const spaced = name.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
    return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

/** The default an action applies when the param is omitted. Declared DefaultValue wins; otherwise the
 *  seed descriptions consistently phrase it as "default 'SendGrid'" or "Defaults to TRUE". */
function effectiveDefaultFor(defaultValue: string | null, description: string | null): string | null {
    if (defaultValue != null && defaultValue !== "") return defaultValue;
    // A "." ends the capture only as sentence punctuation (followed by whitespace/end), so a dotted
    // value like an address or hostname survives while "Defaults to TRUE." drops its period.
    const m = description?.match(/defaults? (?:to )?'?([A-Za-z0-9@.\-]+?)'?(?=[,;)\s]|\.(?:\s|$)|$)/i);
    return m ? m[1] : null;
}

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
    // --- reason (the engine reads ScoreFactorContribution for these) ---
    /** WHICH SIGNAL is dragging the member down. A cohort picked by score or trajectory is a mixed
     *  bag (stopped attending events sitting next to stopped opening email) and one action can't fit
     *  both, so this is what makes a group homogeneous enough to act on. */
    reason?: ReasonCondition | null;
    // --- member context (the engine reads the model's anchor entity for these) ---
    /** Conditions on the MEMBER RECORD rather than the score: tenure, dormancy, region, segment. What
     *  turns "these 319 are sliding" into "the first-year members in Texas who are sliding". A
     *  condition naming a field the anchor entity lacks fails the resolve rather than being ignored. */
    anchor?: AnchorCondition[] | null;
    // --- ordering ---
    /** Which members to work FIRST. Part of the RULE, not the display: the run cap truncates the
     *  resolved cohort, so this order decides who actually gets treated. */
    rank?: RankSpec | null;
}

/** One condition on the anchor record. Mirrors the engine's AnchorCondition. */
export interface AnchorCondition {
    /** A real field name on the model's anchor entity. */
    field: string;
    /** eq/neq/in/notIn/gte/lte/isNull/isNotNull/withinLastDays/olderThanDays/withinNextDays. The date
     *  operators take a number of DAYS relative to now. */
    op: string;
    value?: string | number | string[] | null;
}

/** How to order a resolved cohort. Mirrors the engine's RankSpec. */
export interface RankSpec {
    mode: "worstScore" | "fastestDecline" | "biggestDrop" | "soonest" | "highestValue" | "priority";
    /** Anchor DATE field: sooner = higher priority, within the engine's 90-day horizon. */
    urgencyField?: string | null;
    /** Anchor NUMBER field to weigh. */
    valueField?: string | null;
    /** Overrides the priority blend (engine defaults: severity 0.5, urgency 0.3, value 0.2). */
    weights?: { severity?: number | null; urgency?: number | null; value?: number | null } | null;
}

/** A condition on WHY a member is low. Mirrors the engine's ReasonCondition. */
export interface ReasonCondition {
    /** Keep members whose MAIN problem is one of these factors — the homogeneous-group question. */
    dominantFactorIds?: string[] | null;
    /** Keep members weak on this factor whether or not it's their worst — the broader question. */
    weakOnFactorId?: string | null;
    /** Ceiling (0–1) that counts as "weak" for weakOnFactorId. Defaults to 0.5 in the engine. */
    maxNormalizedValue?: number | null;
    /** Keep only members with NO data at all for the factor — a gap to fix, not a person to contact. */
    requireNoData?: boolean | null;
    /** The mirror: keep only members who DO have data for the factor. Needed so a "Low X" breakdown
     *  slice doesn't also return the "No X" members, which share the same dominant factor. */
    requireData?: boolean | null;
}

/** Why one member is low, as resolved by `Sonar: Explain Scores`. */
export interface ScoreReason {
    scoreId: string;
    /** e.g. "Low Event Registrations" / "No Event Registrations"; null when nothing is dragging. */
    reasonLabel: string | null;
    dominantFactorId: string | null;
    /** False = that signal has no records for this member, so the low score is a data gap. */
    hadData: boolean | null;
}

/** One slice of a cohort that shares a main problem — the unit an operator acts on. */
export interface ReasonSlice {
    /** null = Sonar can't tell why these members are low (no contributions on record). */
    factorId: string | null;
    label: string;
    count: number;
    /** Share of the cohort, 0–100. */
    share: number;
    /** False = the problem is MISSING DATA on that signal, not weakness in it. Different fix. */
    hadData: boolean;
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

/**
 * An MJ Action the operator can pick as the play, plus which launch kinds it can actually service.
 *
 * The picker used to offer every play in the category for every kind, so "Fire a play" listed batch-only
 * plays like `Sonar: Sync Cohort to List`. Picking one fired it once per treated member with no cohort to
 * work on, and every fire came back VALIDATION_ERROR — 81 of them, in the run that found this.
 *
 * A play says which shape it wants through its declared params: `AnchorRecordID` means "call me once per
 * member", `CohortJSON` means "hand me the whole treated set at once".
 */
export interface FireableAction {
    id: string;
    name: string;
    description: string | null;
    /** Declares AnchorRecordID — fireable once per treated member (Kind='Action'). */
    perMember: boolean;
    /** Declares CohortJSON — takes the whole treated cohort in one call (Kind='BulkSync'). */
    bulk: boolean;
}

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
    /** The member's main problem ("Low Event Registrations"), resolved by the engine. */
    reasonLabel: string | null;
    /** The factor behind that label, so a slice can become a rule without matching on display text. */
    dominantFactorId: string | null;
    /** False = that signal has no records for this member, so the low score is a data gap. */
    reasonHadData: boolean | null;
}

/** What `Sonar: Preview Segment` returns: the FULL cohort count plus the requested page. */
export interface SegmentPreview {
    total: number;
    page: number;
    pageSize: number;
    /** True when the rule needed ScoreHistory (slope / decline run / volatility / net drop). */
    usedTrajectory: boolean;
    /** How the WHOLE cohort splits by main problem, biggest slice first. Covers every member, not
     *  just the returned page — which is the difference between "what's driving this group" and
     *  "what's driving these 50 rows". */
    breakdown: ReasonSlice[];
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
/** What `Sonar: Send Approved Outreach` reports back. */
export interface SendOutreachResult {
    dryRun: boolean;
    provider: string;
    approved: number;
    sent: number;
    failed: number;
    skippedNoEmail: number;
    redirectedTo: string | null;
    firstError: string | null;
}

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
    private readonly editableParamCache = new Map<string, PlayParam[]>();
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
     * Hand one intervention's APPROVED drafts to MJ Communications.
     *
     * `dryRun` defaults to true and the caller has to opt out deliberately: past this point the worst
     * case stops being a wrong row and becomes real mail to real members. The action itself also
     * defaults to a dry run, so a missing param cannot send by accident.
     *
     * Only Approved proposals are eligible, and a real send moves them to Executed — so a re-run
     * cannot double-send, and a dry run deliberately leaves them Approved for the real one.
     */
    public async sendApprovedOutreach(
        interventionId: string,
        from: string,
        opts: { dryRun?: boolean; provider?: string; testRecipient?: string } = {},
    ): Promise<{ ok: boolean; result?: SendOutreachResult; error?: string }> {
        const id = await this.resolveActionIdByName(SEND_APPROVED_ACTION);
        if (!id) {
            return { ok: false, error: "The send action isn't available in this environment. Restart the API after migrating." };
        }
        const params: Parameters<GraphQLActionClient["RunAction"]>[1] = [
            { Name: "InterventionID", Value: interventionId, Type: "Input" },
            { Name: "From", Value: from, Type: "Input" },
            { Name: "DryRun", Value: String(opts.dryRun !== false), Type: "Input" },
        ];
        if (opts.provider) params.push({ Name: "Provider", Value: opts.provider, Type: "Input" });
        if (opts.testRecipient) params.push({ Name: "TestRecipient", Value: opts.testRecipient, Type: "Input" });

        const res = await this.actionClient().RunAction(id, params);
        if (!res.Success) return { ok: false, error: res.Message || "The send failed." };
        const result = extractActionResult<SendOutreachResult>(res);
        return result ? { ok: true, result } : { ok: false, error: "The send returned no result payload." };
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
        /** Display order only. Never changes which members a real run would treat. */
        orderBy?: "BiggestDrop" | "BiggestGain",
    ): Promise<{ ok: boolean; result?: SegmentPreview; error?: string }> {
        const id = await this.resolveActionIdByName(PREVIEW_SEGMENT_ACTION);
        if (!id) return { ok: false, error: "The segment preview action isn't available in this environment." };
        const res = await this.actionClient().RunAction(id, [
            { Name: "ModelID", Value: modelId, Type: "Input" },
            { Name: "FilterJSON", Value: JSON.stringify(filter), Type: "Input" },
            { Name: "Page", Value: String(page), Type: "Input" },
            { Name: "PageSize", Value: String(pageSize), Type: "Input" },
            ...(orderBy ? [{ Name: "OrderBy", Value: orderBy, Type: "Input" as const }] : []),
        ]);
        if (!res.Success) return { ok: false, error: res.Message || "Resolving the segment failed." };
        const result = extractActionResult<SegmentPreview>(res);
        return result ? { ok: true, result } : { ok: false, error: "The preview returned no result payload." };
    }

    /**
     * WHY each of these scores is low, resolved SERVER-SIDE.
     *
     * The browser deliberately does not compute this. Ranking a member's signals by how much each
     * drags the score down depends on the rubric weight, and the same ranking is what a targeting rule
     * SELECTS on — so a client-side copy is a second definition of "the reason" that can drift from
     * the engine's. It did drift once, which is how the Triage list, the Movers list and the outreach
     * drafter came to disagree about the same member.
     *
     * `previewSegment` already returns the reason for a rule-resolved cohort; this covers the lists
     * that show members WITHOUT a rule (Triage), which have no cohort to preview. Returns an empty map
     * rather than an error when the action is unavailable, so a Why column degrades to blank instead
     * of failing the whole list.
     */
    public async reasonsForScores(scoreIds: string[]): Promise<Map<string, ScoreReason>> {
        const out = new Map<string, ScoreReason>();
        if (scoreIds.length === 0) return out;
        const id = await this.resolveActionIdByName(EXPLAIN_SCORES_ACTION);
        if (!id) return out;
        const res = await this.actionClient().RunAction(id, [
            { Name: "ScoreIDsJSON", Value: JSON.stringify(scoreIds), Type: "Input" },
        ]);
        if (!res.Success) return out;
        const result = extractActionResult<{ reasons: ScoreReason[] }>(res);
        for (const r of result?.reasons ?? []) {
            if (r.reasonLabel) out.set(r.scoreId, r);
        }
        return out;
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
     *  so the picker isn't polluted with the authoring/utility actions. Each is tagged with the launch
     *  kinds it can service, read from its declared params (see {@link FireableAction}). */
    public async fireableActions(): Promise<FireableAction[]> {
        const res = await new RunView().RunView<ActionRow>({
            EntityName: "MJ: Actions",
            ExtraFilter: `Status='Active' AND Category='Sonar Plays'`,
            OrderBy: "Name ASC",
            Fields: ["ID", "Name", "Description"],
            ResultType: "simple",
        });
        const rows = res.Success ? res.Results ?? [] : [];
        if (rows.length === 0) return [];

        const declared = await this.declaredParamsByAction(rows.map((r) => r.ID));
        return rows.map((r) => {
            const names = declared.get(r.ID) ?? [];
            const perMember = names.includes("AnchorRecordID");
            const bulk = names.includes("CohortJSON");
            // A play declaring NEITHER is left usable for both kinds on purpose. It takes no cohort input
            // at all, so it cannot be mis-shaped by the choice — and hiding a working play would be a
            // worse bug than the one being fixed here.
            const unshaped = !perMember && !bulk;
            return {
                id: r.ID,
                name: r.Name,
                description: r.Description,
                perMember: perMember || unshaped,
                bulk: bulk || unshaped,
            };
        });
    }

    /**
     * Input param names for several plays in ONE read, keyed by action id.
     *
     * Batched because the picker needs this for every play just to render, and a query per play would put
     * N round trips in front of opening the launch panel. Also warms the single-action cache.
     */
    private async declaredParamsByAction(actionIds: string[]): Promise<Map<string, string[]>> {
        const byAction = new Map<string, string[]>(actionIds.map((id) => [id, []]));
        const ids = actionIds.map((id) => `'${sqlString(id)}'`).join(",");
        const res = await new RunView().RunView<{ ActionID: string; Name: string }>({
            EntityName: "MJ: Action Params",
            ExtraFilter: `ActionID IN (${ids}) AND Type='Input'`,
            Fields: ["ActionID", "Name"],
            ResultType: "simple",
        });
        for (const row of res.Success ? res.Results ?? [] : []) {
            byAction.get(row.ActionID)?.push(row.Name);
        }
        for (const [id, names] of byAction) {
            if (!this.actionParamNameCache.has(id)) this.actionParamNameCache.set(id, names);
        }
        return byAction;
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
        const rows = interventions.map((i) => ({
            id: i.ID,
            name: i.Name,
            kind: i.Kind,
            segmentName: segNames.get(i.ScoreSegmentID) ?? "(segment)",
            triggerType: i.TriggerType,
            holdoutPercent: i.ControlGroupPercent,
            status: i.Status,
            ...(tallies.get(i.ID) ?? { treated: 0, held: 0, sent: 0, failed: 0, lastAssignedAt: null }),
        }));
        // Real runs first, most recent activity on top; never-ran rows (preview leftovers, aborted
        // launches) sink below them in creation order. Mixing the two by creation date buried live
        // experiments under ghosts that all read "0 treated".
        return rows.sort((a, b) => {
            const aRan = a.treated + a.held > 0 ? 1 : 0;
            const bRan = b.treated + b.held > 0 ? 1 : 0;
            if (aRan !== bRan) return bRan - aRan;
            return (b.lastAssignedAt ?? "").localeCompare(a.lastAssignedAt ?? "");
        });
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

    /**
     * The params a play declares that a PERSON must fill — everything it takes as Input minus what the
     * engine supplies per fire. This is what makes a parameterised play launchable without the panel
     * knowing anything about the specific play: `Sonar: Email Cohort` needs Subject/Body/From, and any
     * future play gets the same treatment for free.
     */
    public async editableParamsForAction(actionId: string): Promise<PlayParam[]> {
        const cached = this.editableParamCache.get(actionId);
        if (cached) return cached;
        const res = await new RunView().RunView<{ Name: string; IsRequired: boolean | null; Description: string | null; DefaultValue: string | null }>({
            EntityName: "MJ: Action Params",
            ExtraFilter: `ActionID='${sqlString(actionId)}' AND Type='Input'`,
            Fields: ["Name", "IsRequired", "Description", "DefaultValue"],
            OrderBy: "IsRequired DESC, Name ASC",
            ResultType: "simple",
        });
        const rows = res.Success ? res.Results ?? [] : [];
        const params = rows
            .filter((r) => !RUNNER_SUPPLIED_PARAMS.has(r.Name))
            .map((r) => {
                const effectiveDefault = effectiveDefaultFor(r.DefaultValue ?? null, r.Description ?? null);
                return {
                    name: r.Name,
                    label: humanizeParamName(r.Name),
                    isRequired: !!r.IsRequired,
                    description: r.Description ?? null,
                    defaultValue: r.DefaultValue ?? null,
                    // Heuristics on name/default, not type: ActionParam's ValueType is 'Scalar' for
                    // everything, so it can't tell prose from a flag. Body is the name that reliably
                    // holds prose, and a true/false default is what marks a flag.
                    multiline: /body|message|content/i.test(r.Name),
                    boolean: /^(true|false)$/i.test(effectiveDefault ?? ""),
                    effectiveDefault,
                };
            })
            .sort((a, b) => this.paramDisplayRank(a) - this.paramDisplayRank(b) || a.name.localeCompare(b.name));
        this.editableParamCache.set(actionId, params);
        return params;
    }

    /** Sort key for the launch panel's param fields: the well-known names in reading order, then
     *  remaining required ones, then optional. */
    private paramDisplayRank(p: PlayParam): number {
        const known = PARAM_DISPLAY_ORDER.indexOf(p.name);
        if (known >= 0) return known;
        return p.isRequired ? PARAM_DISPLAY_ORDER.length : PARAM_DISPLAY_ORDER.length + 1;
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
