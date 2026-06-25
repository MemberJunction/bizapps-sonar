import { Metadata, RunView, UserInfo } from "@memberjunction/core";
import { mjBizAppsSonarInterventionAssignmentEntity } from "@mj-biz-apps/sonar-entities";
import { SegmentEvaluator, SegmentFilter, SegmentMember } from "./SegmentEvaluator";

const ASSIGNMENT_ENTITY = "MJ_BizApps_Sonar: Intervention Assignments";

/** Which cohort a member lands in. Control = held back (nothing fires), the comparison baseline. */
export type Cohort = "Treatment" | "Control";

/** The MJ Action to fire + its static params (e.g. Slack WebhookURL + Message). A `{{member}}` token
 *  in any param value is replaced with the member's anchor id, so each fire names its member. */
export interface InterventionActionConfig {
    actionId: string;
    params: { name: string; value: string }[];
}

/** A run request. `preview` resolves + splits but writes/fires nothing (the dry-run gate). `cap`
 *  bounds how many members are assigned this run (a real-fire safety limit for the demo). */
export interface InterventionRunRequest {
    interventionId: string;
    modelId: string;
    segmentFilter: SegmentFilter;
    holdoutPercent: number;
    action: InterventionActionConfig;
    cap: number;
    preview: boolean;
}

/** What happened (or would happen, in preview). Counts only — the honest summary the UI shows. */
export interface InterventionRunResult {
    cohortSize: number; // total members the segment resolved
    alreadyAssigned: number; // skipped — already assigned in a prior run (idempotency)
    eligible: number; // cohort minus already-assigned
    capped: boolean; // true when eligible exceeded the cap (some left for a later run)
    treated: number;
    held: number;
    sent: number; // treated fires that succeeded (0 in preview)
    failed: number; // treated fires that failed (0 in preview)
    preview: boolean;
}

/** Fires one MJ Action with the given params. Injected (the real one wraps ActionEngineServer in
 *  interventionInvoker.ts) so the runner's planning logic stays free of the heavy Actions import. */
export type InterventionActionInvoker = (
    actionId: string,
    params: { name: string; value: string }[],
    contextUser: UserInfo,
) => Promise<{ success: boolean; message?: string }>;

// ---------------------------------------------------------------- pure planning (unit-tested)

/** Stable hash of an id → 0..99 (FNV-1a). Deterministic, so the same member always lands in the same
 *  cohort across runs — no Math.random, so the holdout split is reproducible and auditable. */
export function hashToPercent(id: string): number {
    let h = 2166136261;
    for (let i = 0; i < id.length; i++) {
        h ^= id.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0) % 100;
}

/** Treatment unless the member's stable hash falls in the bottom `holdoutPercent` band → Control. */
export function cohortFor(anchorId: string, holdoutPercent: number): Cohort {
    return hashToPercent(anchorId) < holdoutPercent ? "Control" : "Treatment";
}

/** Plan a run from the resolved cohort: drop already-assigned (idempotency), cap, then split. Pure. */
export function planAssignments(
    members: SegmentMember[],
    alreadyAssigned: ReadonlySet<string>,
    holdoutPercent: number,
    cap: number,
): { assignments: { member: SegmentMember; cohort: Cohort }[]; alreadyAssigned: number; capped: boolean } {
    const eligible = members.filter((m) => !alreadyAssigned.has(m.anchorRecordId));
    const capped = eligible.length > cap;
    const slice = eligible.slice(0, Math.max(0, cap));
    return {
        assignments: slice.map((member) => ({ member, cohort: cohortFor(member.anchorRecordId, holdoutPercent) })),
        alreadyAssigned: members.length - eligible.length,
        capped,
    };
}

/** Substitute the `{{member}}` token in each param value with the member's anchor id. */
function fillMemberToken(
    params: { name: string; value: string }[],
    anchorId: string,
): { name: string; value: string }[] {
    return params.map((p) => ({ name: p.name, value: p.value.split("{{member}}").join(anchorId) }));
}

/**
 * Runs an intervention against its segment: resolve the cohort → exclude already-assigned (so a
 * re-click never re-fires) → cap → deterministically split treated/held → in preview, stop and
 * return counts; on commit, write an InterventionAssignment per member and fire the action for each
 * treated member (its delivery status recorded). Held-back (Control) members get a row but no fire —
 * the honest comparison baseline. Outcomes/lift are NOT written here.
 */
export class InterventionRunner {
    private readonly segments = new SegmentEvaluator();

    constructor(private readonly invoker?: InterventionActionInvoker) {}

    public async run(req: InterventionRunRequest, contextUser: UserInfo): Promise<InterventionRunResult> {
        const members = await this.segments.resolve(req.modelId, req.segmentFilter, contextUser);
        const assigned = await this.loadAssignedAnchorIds(req.interventionId, contextUser);
        const plan = planAssignments(members, assigned, req.holdoutPercent, req.cap);

        const base: InterventionRunResult = {
            cohortSize: members.length,
            alreadyAssigned: plan.alreadyAssigned,
            eligible: members.length - plan.alreadyAssigned,
            capped: plan.capped,
            treated: plan.assignments.filter((a) => a.cohort === "Treatment").length,
            held: plan.assignments.filter((a) => a.cohort === "Control").length,
            sent: 0,
            failed: 0,
            preview: req.preview,
        };
        if (req.preview) {
            return base;
        }

        let sent = 0;
        let failed = 0;
        for (const { member, cohort } of plan.assignments) {
            let deliveryStatus: string | null = null;
            if (cohort === "Treatment") {
                const fired = await this.fire(req.action, member.anchorRecordId, contextUser);
                deliveryStatus = fired ? "Sent" : "Failed";
                fired ? sent++ : failed++;
            }
            await this.writeAssignment(req.interventionId, member, cohort, deliveryStatus, contextUser);
        }
        return { ...base, sent, failed };
    }

    /** Fire the action for one treated member (token-filled params); a throw/failure → false, never
     *  aborts the run (one bad send shouldn't strand the rest). */
    private async fire(
        action: InterventionActionConfig,
        anchorId: string,
        contextUser: UserInfo,
    ): Promise<boolean> {
        if (!this.invoker) {
            throw new Error("InterventionRunner: no action invoker configured — cannot fire interventions.");
        }
        try {
            const res = await this.invoker(action.actionId, fillMemberToken(action.params, anchorId), contextUser);
            return res.success;
        } catch {
            return false;
        }
    }

    /** Anchor ids already assigned to this intervention (idempotency — never re-fire them). */
    private async loadAssignedAnchorIds(interventionId: string, contextUser: UserInfo): Promise<Set<string>> {
        const res = await new RunView().RunView<{ AnchorRecordID: string }>(
            {
                EntityName: ASSIGNMENT_ENTITY,
                ExtraFilter: `InterventionID='${interventionId}'`,
                Fields: ["AnchorRecordID"],
                IgnoreMaxRows: true,
                ResultType: "simple",
            },
            contextUser,
        );
        return new Set(res.Success ? (res.Results ?? []).map((r) => r.AnchorRecordID) : []);
    }

    /** Persist one assignment row (treated/held + delivery status). */
    private async writeAssignment(
        interventionId: string,
        member: SegmentMember,
        cohort: Cohort,
        deliveryStatus: string | null,
        contextUser: UserInfo,
    ): Promise<void> {
        const md = new Metadata();
        const row = await md.GetEntityObject<mjBizAppsSonarInterventionAssignmentEntity>(
            ASSIGNMENT_ENTITY,
            contextUser,
        );
        row.NewRecord();
        row.InterventionID = interventionId;
        row.AnchorRecordID = member.anchorRecordId;
        if (member.anchorRecordKeyJSON) row.AnchorRecordKeyJSON = member.anchorRecordKeyJSON;
        row.Cohort = cohort;
        if (deliveryStatus) row.ActionDeliveryStatus = deliveryStatus;
        await row.Save();
    }
}
