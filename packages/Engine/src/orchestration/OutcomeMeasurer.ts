import { LogStatus, Metadata, RunView, UserInfo } from "@memberjunction/core";
import {
    mjBizAppsSonarInterventionOutcomeEntity,
    mjBizAppsSonarScoreBandEntity,
} from "@mj-biz-apps/sonar-entities";

const ASSIGNMENT_ENTITY = "MJ_BizApps_Sonar: Intervention Assignments";
const OUTCOME_ENTITY = "MJ_BizApps_Sonar: Intervention Outcomes";
const INTERVENTION_ENTITY = "MJ_BizApps_Sonar: Interventions";
const SEGMENT_ENTITY = "MJ_BizApps_Sonar: Score Segments";
const SCORE_ENTITY = "MJ_BizApps_Sonar: Scores";
const HISTORY_ENTITY = "MJ_BizApps_Sonar: Score Histories";
const BAND_ENTITY = "MJ_BizApps_Sonar: Score Bands";

/** How far a member's engagement moved from assignment to now (the measurable v1 outcome). */
export interface MeasuredMovement {
    cohort: "Treatment" | "Control";
    scoreDelta: number;
    bandMove: -1 | 0 | 1; // -1 dropped a band, 0 same, 1 climbed
}

/** The honest number the whole layer exists for: treatment vs control, engagement terms. */
export interface LiftSummary {
    treatedMeasured: number;
    controlMeasured: number;
    /** Mean normalized-score movement per cohort since assignment. */
    avgScoreDeltaTreatment: number | null;
    avgScoreDeltaControl: number | null;
    /** scoreLift = treatment mean movement − control mean movement (points). */
    scoreLift: number | null;
    /** Share of each cohort that climbed at least one band. */
    bandUpRateTreatment: number | null;
    bandUpRateControl: number | null;
    /** bandUpLift = treatment band-up rate − control band-up rate (percentage points). */
    bandUpLiftPct: number | null;
}

export interface MeasureResult {
    measured: number; // outcomes written this call
    alreadyMeasured: number; // skipped — outcome already recorded
    unmeasurable: number; // skipped — no baseline score history before assignment
    lift: LiftSummary; // over ALL measured assignments (prior + new)
}

// ---------------------------------------------------------------- pure math (unit-tested)

/** Engagement outcome from band movement. v1 outcomes are ENGAGEMENT outcomes (the system's own
 *  state), not business events: climbed a band → 'Reactivated', dropped → 'Churned', else
 *  'NoChange'. Business outcomes (Renewed/Upgraded from domain data) are a later, wired-in layer. */
export function classifyOutcome(bandMove: -1 | 0 | 1): "Reactivated" | "Churned" | "NoChange" {
    return bandMove > 0 ? "Reactivated" : bandMove < 0 ? "Churned" : "NoChange";
}

/** Compare bands by their MinScore (higher floor = better band); unknown bands compare equal. */
export function bandMove(baselineMin: number | null, currentMin: number | null): -1 | 0 | 1 {
    if (baselineMin == null || currentMin == null || baselineMin === currentMin) return 0;
    return currentMin > baselineMin ? 1 : -1;
}

/** Aggregate treatment-vs-control movements into the lift summary. Pure. */
export function computeLift(rows: MeasuredMovement[]): LiftSummary {
    const t = rows.filter((r) => r.cohort === "Treatment");
    const c = rows.filter((r) => r.cohort === "Control");
    const avg = (xs: number[]): number | null => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
    const upRate = (xs: MeasuredMovement[]): number | null => (xs.length ? xs.filter((r) => r.bandMove > 0).length / xs.length : null);
    const avgT = avg(t.map((r) => r.scoreDelta));
    const avgC = avg(c.map((r) => r.scoreDelta));
    const upT = upRate(t);
    const upC = upRate(c);
    return {
        treatedMeasured: t.length,
        controlMeasured: c.length,
        avgScoreDeltaTreatment: avgT,
        avgScoreDeltaControl: avgC,
        scoreLift: avgT != null && avgC != null ? avgT - avgC : null,
        bandUpRateTreatment: upT,
        bandUpRateControl: upC,
        bandUpLiftPct: upT != null && upC != null ? (upT - upC) * 100 : null,
    };
}

// ---------------------------------------------------------------- measurer (I/O)

interface AssignmentRow { ID: string; AnchorRecordID: string; Cohort: "Treatment" | "Control"; AssignedAt: string }
interface HistoryRow { AnchorRecordID: string; NormalizedScore: number | null; BandID: string | null; ComputedAt: string }
interface ScoreRow { AnchorRecordID: string; NormalizedScore: number | null; BandID: string | null }

/**
 * Fills InterventionOutcome (plan §5.6/§7.5): for each assignment, the baseline is the member's
 * ScoreHistory row nearest BEFORE assignment; the outcome is their CURRENT score/band. Writes
 * ScoreDeltaAfter + a band-movement OutcomeType, then aggregates treatment-vs-control into the
 * lift summary — measured, not assumed. Re-runnable: already-measured assignments are skipped,
 * and lift always aggregates over everything measured so far.
 */
export class OutcomeMeasurer {
    public async measure(interventionId: string, contextUser: UserInfo): Promise<MeasureResult> {
        const modelId = await this.modelForIntervention(interventionId, contextUser);
        const assignments = await this.loadAssignments(interventionId, contextUser);
        const measuredByAssignment = await this.loadExistingOutcomes(assignments.map((a) => a.ID), contextUser);
        const bands = await this.bandFloors(contextUser);
        const anchorIds = assignments.map((a) => a.AnchorRecordID);
        const current = await this.currentScores(modelId, anchorIds, contextUser);
        const history = await this.historyFor(modelId, anchorIds, contextUser);

        const movements: MeasuredMovement[] = [];
        let measured = 0;
        let unmeasurable = 0;
        for (const a of assignments) {
            const existing = measuredByAssignment.get(a.ID);
            if (existing) {
                movements.push(existing);
                continue;
            }
            const baseline = this.baselineFor(history.get(a.AnchorRecordID) ?? [], a.AssignedAt);
            const now = current.get(a.AnchorRecordID);
            if (!baseline || baseline.NormalizedScore == null || !now || now.NormalizedScore == null) {
                unmeasurable++;
                continue;
            }
            const move = bandMove(bands.get(baseline.BandID ?? "") ?? null, bands.get(now.BandID ?? "") ?? null);
            const scoreDelta = now.NormalizedScore - baseline.NormalizedScore;
            await this.writeOutcome(a.ID, classifyOutcome(move), scoreDelta, contextUser);
            movements.push({ cohort: a.Cohort, scoreDelta, bandMove: move });
            measured++;
        }
        const lift = computeLift(movements);
        LogStatus(
            `Sonar: measured ${measured} outcome(s) for intervention ${interventionId} ` +
                `(already ${measuredByAssignment.size}, unmeasurable ${unmeasurable}); ` +
                `score lift ${lift.scoreLift?.toFixed(2) ?? "n/a"}, band-up lift ${lift.bandUpLiftPct?.toFixed(1) ?? "n/a"}pp.`,
        );
        return { measured, alreadyMeasured: measuredByAssignment.size, unmeasurable, lift };
    }

    /** Intervention → its segment's ScoreModelID (scores/history are per-model). */
    private async modelForIntervention(interventionId: string, contextUser: UserInfo): Promise<string> {
        const rv = new RunView();
        const iv = await rv.RunView<{ ScoreSegmentID: string }>(
            { EntityName: INTERVENTION_ENTITY, ExtraFilter: `ID='${interventionId}'`, Fields: ["ScoreSegmentID"], MaxRows: 1, ResultType: "simple" },
            contextUser,
        );
        const segId = iv.Results?.[0]?.ScoreSegmentID;
        if (!segId) throw new Error(`OutcomeMeasurer: intervention ${interventionId} not found.`);
        const seg = await rv.RunView<{ ScoreModelID: string }>(
            { EntityName: SEGMENT_ENTITY, ExtraFilter: `ID='${segId}'`, Fields: ["ScoreModelID"], MaxRows: 1, ResultType: "simple" },
            contextUser,
        );
        const modelId = seg.Results?.[0]?.ScoreModelID;
        if (!modelId) throw new Error(`OutcomeMeasurer: segment ${segId} not found.`);
        return modelId;
    }

    private async loadAssignments(interventionId: string, contextUser: UserInfo): Promise<AssignmentRow[]> {
        const res = await new RunView().RunView<AssignmentRow>(
            {
                EntityName: ASSIGNMENT_ENTITY,
                ExtraFilter: `InterventionID='${interventionId}'`,
                Fields: ["ID", "AnchorRecordID", "Cohort", "AssignedAt"],
                IgnoreMaxRows: true,
                ResultType: "simple",
            },
            contextUser,
        );
        return res.Success ? (res.Results ?? []) : [];
    }

    /** Already-recorded outcomes → their movements (so lift covers prior measurements too). */
    private async loadExistingOutcomes(
        assignmentIds: string[],
        contextUser: UserInfo,
    ): Promise<Map<string, MeasuredMovement>> {
        const map = new Map<string, MeasuredMovement>();
        if (!assignmentIds.length) return map;
        const idList = assignmentIds.map((id) => `'${id}'`).join(",");
        const res = await new RunView().RunView<{ AssignmentID: string; OutcomeType: string; ScoreDeltaAfter: number | null }>(
            { EntityName: OUTCOME_ENTITY, ExtraFilter: `AssignmentID IN (${idList})`, Fields: ["AssignmentID", "OutcomeType", "ScoreDeltaAfter"], IgnoreMaxRows: true, ResultType: "simple" },
            contextUser,
        );
        // Cohort isn't on the outcome row; the caller re-joins it. To keep this single-pass we fetch
        // cohorts once here.
        const cohorts = await new RunView().RunView<{ ID: string; Cohort: "Treatment" | "Control" }>(
            { EntityName: ASSIGNMENT_ENTITY, ExtraFilter: `ID IN (${idList})`, Fields: ["ID", "Cohort"], IgnoreMaxRows: true, ResultType: "simple" },
            contextUser,
        );
        const cohortById = new Map((cohorts.Results ?? []).map((c) => [c.ID, c.Cohort]));
        for (const o of res.Success ? (res.Results ?? []) : []) {
            const cohort = cohortById.get(o.AssignmentID);
            if (!cohort) continue;
            map.set(o.AssignmentID, {
                cohort,
                scoreDelta: o.ScoreDeltaAfter ?? 0,
                bandMove: o.OutcomeType === "Reactivated" ? 1 : o.OutcomeType === "Churned" ? -1 : 0,
            });
        }
        return map;
    }

    /** BandID → MinScore across all bands (band "height" for movement comparison). */
    private async bandFloors(contextUser: UserInfo): Promise<Map<string, number | null>> {
        const res = await new RunView().RunView<mjBizAppsSonarScoreBandEntity>(
            { EntityName: BAND_ENTITY, IgnoreMaxRows: true, ResultType: "entity_object" },
            contextUser,
        );
        return new Map((res.Results ?? []).map((b) => [b.ID, b.MinScore]));
    }

    private async currentScores(modelId: string, anchorIds: string[], contextUser: UserInfo): Promise<Map<string, ScoreRow>> {
        if (!anchorIds.length) return new Map();
        const idList = anchorIds.map((id) => `'${id.replace(/'/g, "''")}'`).join(",");
        const res = await new RunView().RunView<ScoreRow>(
            { EntityName: SCORE_ENTITY, ExtraFilter: `ScoreModelID='${modelId}' AND AnchorRecordID IN (${idList})`, Fields: ["AnchorRecordID", "NormalizedScore", "BandID"], IgnoreMaxRows: true, ResultType: "simple" },
            contextUser,
        );
        return new Map((res.Results ?? []).map((s) => [s.AnchorRecordID, s]));
    }

    /** All history rows for the members, grouped per member (newest first). */
    private async historyFor(modelId: string, anchorIds: string[], contextUser: UserInfo): Promise<Map<string, HistoryRow[]>> {
        const map = new Map<string, HistoryRow[]>();
        if (!anchorIds.length) return map;
        const idList = anchorIds.map((id) => `'${id.replace(/'/g, "''")}'`).join(",");
        const res = await new RunView().RunView<HistoryRow>(
            {
                EntityName: HISTORY_ENTITY,
                ExtraFilter: `ScoreModelID='${modelId}' AND AnchorRecordID IN (${idList})`,
                Fields: ["AnchorRecordID", "NormalizedScore", "BandID", "ComputedAt"],
                OrderBy: "ComputedAt DESC",
                IgnoreMaxRows: true,
                ResultType: "simple",
            },
            contextUser,
        );
        for (const h of res.Success ? (res.Results ?? []) : []) {
            const list = map.get(h.AnchorRecordID) ?? [];
            list.push(h);
            map.set(h.AnchorRecordID, list);
        }
        return map;
    }

    /** The member's newest history row at-or-before assignment — their state when the play fired. */
    private baselineFor(history: HistoryRow[], assignedAt: string): HistoryRow | null {
        const cutoff = new Date(assignedAt).getTime();
        for (const h of history) {
            if (new Date(h.ComputedAt).getTime() <= cutoff) return h; // newest-first → first hit wins
        }
        return null;
    }

    private async writeOutcome(
        assignmentId: string,
        outcomeType: "Reactivated" | "Churned" | "NoChange",
        scoreDelta: number,
        contextUser: UserInfo,
    ): Promise<void> {
        const md = new Metadata();
        const row = await md.GetEntityObject<mjBizAppsSonarInterventionOutcomeEntity>(OUTCOME_ENTITY, contextUser);
        row.NewRecord();
        row.AssignmentID = assignmentId;
        row.OutcomeType = outcomeType;
        row.OutcomeAt = new Date();
        row.ScoreDeltaAfter = Math.round(scoreDelta * 10000) / 10000; // decimal(9,4)
        row.MeasuredAt = new Date();
        await row.Save();
    }
}
