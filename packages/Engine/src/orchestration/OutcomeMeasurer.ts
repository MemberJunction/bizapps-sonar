import { LogError, LogStatus, Metadata, RunView, UserInfo } from "@memberjunction/core";
import {
    mjBizAppsSonarInterventionOutcomeEntity,
    mjBizAppsSonarScoreBandEntity,
} from "@mj-biz-apps/sonar-entities";

const ASSIGNMENT_ENTITY = "MJ_BizApps_Sonar: Intervention Assignments";
const OUTCOME_ENTITY = "MJ_BizApps_Sonar: Intervention Outcomes";
const INTERVENTION_ENTITY = "MJ_BizApps_Sonar: Interventions";
const SEGMENT_ENTITY = "MJ_BizApps_Sonar: Score Segments";
const SCORE_MODEL = "MJ_BizApps_Sonar: Score Models";
const SCORE_ENTITY = "MJ_BizApps_Sonar: Scores";
const HISTORY_ENTITY = "MJ_BizApps_Sonar: Score Histories";
const BAND_ENTITY = "MJ_BizApps_Sonar: Score Bands";

/** The org-defined "what counts as success" rule (ScoreModel.OutcomeDefinitionJSON). NULL/absent →
 *  BandRecovery. AnchorField is the real escape from the score-as-target thermometer: success is a
 *  condition on the member's OWN domain record, not on Sonar's score. */
export type OutcomeDefinition =
    | { type: "BandRecovery" }
    | { type: "ReachScore"; minScore: number }
    | { type: "AnchorField"; field: string; op: "=" | "!=" | ">" | ">=" | "<" | "<="; value: string };

/** How a member moved from assignment to now, plus whether they hit the org's success definition. */
export interface MeasuredMovement {
    cohort: "Treatment" | "Control";
    scoreDelta: number;
    bandMove: -1 | 0 | 1; // -1 dropped a band, 0 same, 1 climbed (the leading indicator)
    success: boolean; // met the outcome definition (the real, org-defined win)
}

/** The honest number the whole layer exists for: treatment vs control. `successLiftPct` is the
 *  headline (did the org's defined win happen more in treatment?); score/band lift are leading
 *  indicators that move faster than the real outcome. */
export interface LiftSummary {
    treatedMeasured: number;
    controlMeasured: number;
    /** Human label of the outcome definition used (e.g. "climbed a band", "Status = Active"). */
    outcomeLabel: string;
    /** Share of each cohort that met the outcome definition. */
    successRateTreatment: number | null;
    successRateControl: number | null;
    /** successLift = treatment success rate − control success rate (percentage points) — THE number. */
    successLiftPct: number | null;
    /** Mean normalized-score movement per cohort since assignment (leading indicator). */
    avgScoreDeltaTreatment: number | null;
    avgScoreDeltaControl: number | null;
    scoreLift: number | null;
    /** Share of each cohort that climbed at least one band (leading indicator). */
    bandUpRateTreatment: number | null;
    bandUpRateControl: number | null;
    bandUpLiftPct: number | null;
}

/** Parse a stored OutcomeDefinitionJSON; anything absent/malformed → the BandRecovery default. */
export function parseOutcomeDefinition(raw: string | null | undefined): OutcomeDefinition {
    if (!raw) return { type: "BandRecovery" };
    try {
        const p: unknown = JSON.parse(raw);
        if (p && typeof p === "object") {
            const t = (p as { type?: unknown }).type;
            if (t === "ReachScore" && Number.isFinite((p as { minScore?: unknown }).minScore)) {
                return { type: "ReachScore", minScore: Number((p as { minScore: number }).minScore) };
            }
            if (t === "AnchorField") {
                const f = p as { field?: unknown; op?: unknown; value?: unknown };
                const ops = ["=", "!=", ">", ">=", "<", "<="] as const;
                const op = ops.find((o) => o === f.op);
                if (typeof f.field === "string" && op) {
                    return { type: "AnchorField", field: f.field, op, value: String(f.value ?? "") };
                }
            }
        }
    } catch {
        /* fall through to default */
    }
    return { type: "BandRecovery" };
}

/** A short human label for the definition (shown in the lift readout). */
export function outcomeLabel(def: OutcomeDefinition): string {
    switch (def.type) {
        case "ReachScore": return `score ≥ ${def.minScore}`;
        case "AnchorField": return `${def.field} ${def.op} ${def.value}`;
        default: return "climbed a band";
    }
}

type ComparisonOp = "=" | "!=" | ">" | ">=" | "<" | "<=";

/** Leading `YYYY-MM-DD`, optionally followed by a time. Deliberately strict: it must NOT match a bare
 *  number, because `new Date("70")` parses as the year 2070 in V8 and would turn a numeric comparison
 *  into a date one. */
const ISO_DATE_START = /^\d{4}-\d{2}-\d{2}([T ]|$)/;

/** Epoch millis if this value is unambiguously a date, else null. */
function dateMillis(v: unknown): number | null {
    if (v instanceof Date) {
        const t = v.getTime();
        return Number.isFinite(t) ? t : null;
    }
    if (typeof v === "string" && ISO_DATE_START.test(v)) {
        const t = Date.parse(v);
        return Number.isFinite(t) ? t : null;
    }
    return null;
}

function applyOp(op: ComparisonOp, l: number, r: number): boolean;
function applyOp(op: ComparisonOp, l: string, r: string): boolean;
function applyOp(op: ComparisonOp, l: number | string, r: number | string): boolean {
    switch (op) {
        case "=": return l === r;
        case "!=": return l !== r;
        case ">": return l > r;
        case ">=": return l >= r;
        case "<": return l < r;
        case "<=": return l <= r;
    }
}

/**
 * Compare a member's field value against a definition's literal, under one operator.
 *
 * Three modes, in this order, and the order is the whole point:
 *
 *  1. **Date**, when both sides are unambiguously dates. This case USED TO FALL THROUGH TO STRING and was
 *     silently, catastrophically wrong: a `Date` from the entity layer stringifies as
 *     `"Sat Aug 01 2026 00:00:00 GMT+0000"`, so `LastActivityDate >= "2026-08-01"` compared `"S"` against
 *     `"2"` and returned **true for every date that has ever existed**. In the code that decides whether
 *     an intervention worked, that reports success for the entire population.
 *  2. **Numeric**, when both sides parse as finite numbers.
 *  3. **String**, otherwise.
 *
 * Two cases are treated as UNANSWERABLE and return false for every operator, rather than guessing:
 *
 *  · **A missing value.** `null`/`undefined` means the member has no row or no value for that field, and
 *    the old code let it through the string branch — so `Status != 'Active'` counted every member with
 *    NO status as a success. Same family as the `PercentOfTotal` trap: absent data flattered the member
 *    exactly when the truth was that nothing is known about them. An empty string is NOT included here;
 *    that is a value the field actually holds.
 *  · **A date on one side only.** Guessing is what produced the bug above, and a date against a
 *    non-date literal is the shape that produced it.
 *
 * Both follow the layer's standing rule that unknown never matches: an operator nobody can evaluate must
 * not be allowed to count as a win.
 */
export function compareOp(op: ComparisonOp, left: unknown, right: string): boolean {
    if (left === null || left === undefined) return false;

    const lms = dateMillis(left);
    const rms = dateMillis(right);
    if (lms !== null || rms !== null) {
        return lms !== null && rms !== null ? applyOp(op, lms, rms) : false;
    }

    const ln = Number(left);
    const rn = Number(right);
    if (left !== "" && Number.isFinite(ln) && Number.isFinite(rn)) {
        return applyOp(op, ln, rn);
    }

    return applyOp(op, String(left), right);
}

export interface MeasureResult {
    measured: number; // outcomes written this call
    alreadyMeasured: number; // skipped — outcome already recorded
    unmeasurable: number; // skipped — no baseline score history before assignment
    /** Rows that could NOT be persisted. Non-zero means the reported lift is incomplete, and the
     *  caller should treat the run as partially failed rather than as a measurement. */
    writeFailures: number;
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
export function computeLift(rows: MeasuredMovement[], label = "climbed a band"): LiftSummary {
    const t = rows.filter((r) => r.cohort === "Treatment");
    const c = rows.filter((r) => r.cohort === "Control");
    const avg = (xs: number[]): number | null => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
    const rate = (xs: MeasuredMovement[], pred: (r: MeasuredMovement) => boolean): number | null => (xs.length ? xs.filter(pred).length / xs.length : null);
    const avgT = avg(t.map((r) => r.scoreDelta));
    const avgC = avg(c.map((r) => r.scoreDelta));
    const upT = rate(t, (r) => r.bandMove > 0);
    const upC = rate(c, (r) => r.bandMove > 0);
    const sucT = rate(t, (r) => r.success);
    const sucC = rate(c, (r) => r.success);
    return {
        treatedMeasured: t.length,
        controlMeasured: c.length,
        outcomeLabel: label,
        successRateTreatment: sucT,
        successRateControl: sucC,
        successLiftPct: sucT != null && sucC != null ? (sucT - sucC) * 100 : null,
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
        const { modelId, anchorEntityId, definition } = await this.modelForIntervention(interventionId, contextUser);
        const assignments = await this.loadAssignments(interventionId, contextUser);
        const measuredByAssignment = await this.loadExistingOutcomes(assignments.map((a) => a.ID), contextUser);
        const bands = await this.bandFloors(contextUser);
        const anchorIds = assignments.map((a) => a.AnchorRecordID);
        const current = await this.currentScores(modelId, anchorIds, contextUser);
        const history = await this.historyFor(modelId, anchorIds, contextUser);
        // Only pay for the anchor-record read when the definition actually needs a domain field.
        const fieldValues = definition.type === "AnchorField"
            ? await this.anchorFieldValues(anchorEntityId, definition.field, anchorIds, contextUser)
            : new Map<string, unknown>();

        const movements: MeasuredMovement[] = [];
        let measured = 0;
        let unmeasurable = 0;
        let writeFailures = 0;
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
            const success = this.evalSuccess(definition, move, now.NormalizedScore, fieldValues.get(a.AnchorRecordID));
            // Persist the win as 'Reactivated', a band drop as 'Churned', else 'NoChange'.
            const outcomeType = success ? "Reactivated" : move < 0 ? "Churned" : "NoChange";
            // A failed write is NOT a measurement: counting it produced a report of work that did not
            // exist. It is also excluded from the lift movements, so lift is only ever computed from
            // outcomes that are actually on record.
            if (!(await this.writeOutcome(a.ID, outcomeType, scoreDelta, contextUser))) {
                writeFailures++;
                continue;
            }
            movements.push({ cohort: a.Cohort, scoreDelta, bandMove: move, success });
            measured++;
        }
        const lift = computeLift(movements, outcomeLabel(definition));
        if (writeFailures > 0) {
            LogError(
                `Sonar: ${writeFailures} outcome row(s) could not be written for intervention ` +
                    `${interventionId}. Lift covers only the ${measured} that persisted.`,
            );
        }
        LogStatus(
            `Sonar: measured ${measured} outcome(s) for intervention ${interventionId} ` +
                `(already ${measuredByAssignment.size}, unmeasurable ${unmeasurable}); outcome "${lift.outcomeLabel}" ` +
                `success lift ${lift.successLiftPct?.toFixed(1) ?? "n/a"}pp, score lift ${lift.scoreLift?.toFixed(2) ?? "n/a"}.`,
        );
        return { measured, alreadyMeasured: measuredByAssignment.size, unmeasurable, writeFailures, lift };
    }

    /** Did the member meet the org's success definition? BandRecovery = climbed; ReachScore = current
     *  score at/above the target; AnchorField = the member's own domain field satisfies the condition. */
    private evalSuccess(def: OutcomeDefinition, move: -1 | 0 | 1, currentScore: number, fieldValue: unknown): boolean {
        switch (def.type) {
            case "ReachScore": return currentScore >= def.minScore;
            case "AnchorField": return compareOp(def.op, fieldValue, def.value);
            default: return move > 0;
        }
    }

    /** Intervention → its model context: id, anchor entity, and the org's outcome definition. */
    private async modelForIntervention(
        interventionId: string,
        contextUser: UserInfo,
    ): Promise<{ modelId: string; anchorEntityId: string | null; definition: OutcomeDefinition }> {
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
        const model = await rv.RunView<{ AnchorEntityID: string | null; OutcomeDefinitionJSON: string | null }>(
            { EntityName: SCORE_MODEL, ExtraFilter: `ID='${modelId}'`, Fields: ["AnchorEntityID", "OutcomeDefinitionJSON"], MaxRows: 1, ResultType: "simple" },
            contextUser,
        );
        const row = model.Results?.[0];
        return { modelId, anchorEntityId: row?.AnchorEntityID ?? null, definition: parseOutcomeDefinition(row?.OutcomeDefinitionJSON) };
    }

    /** Current value of a domain FIELD on the anchor record, per member — for AnchorField outcomes.
     *  Reads the member's OWN entity (People, etc.), the honest non-thermometer success signal. */
    private async anchorFieldValues(
        anchorEntityId: string | null,
        field: string,
        anchorIds: string[],
        contextUser: UserInfo,
    ): Promise<Map<string, unknown>> {
        const map = new Map<string, unknown>();
        if (!anchorEntityId || !anchorIds.length) return map;
        const entity = new Metadata().Entities.find((e) => e.ID === anchorEntityId);
        if (!entity || !entity.Fields.some((f) => f.Name === field)) return map; // unknown field → no one succeeds
        const pk = entity.FirstPrimaryKey?.Name ?? "ID";
        const inList = anchorIds.map((id) => `'${id.replace(/'/g, "''")}'`).join(",");
        const res = await new RunView().RunView(
            { EntityName: entity.Name, ExtraFilter: `${pk} IN (${inList})`, Fields: [pk, field], IgnoreMaxRows: true, ResultType: "simple" },
            contextUser,
        );
        for (const r of res.Success ? (res.Results ?? []) : []) {
            const rec = r as Record<string, unknown>;
            map.set(String(rec[pk]), rec[field]);
        }
        return map;
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
                // Persisted convention: a met outcome is written as 'Reactivated'. So success is
                // recoverable from the stored OutcomeType when re-aggregating prior measurements.
                success: o.OutcomeType === "Reactivated",
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

    /** @returns true only when the row actually persisted. */
    private async writeOutcome(
        assignmentId: string,
        outcomeType: "Reactivated" | "Churned" | "NoChange",
        scoreDelta: number,
        contextUser: UserInfo,
    ): Promise<boolean> {
        const md = new Metadata();
        const row = await md.GetEntityObject<mjBizAppsSonarInterventionOutcomeEntity>(OUTCOME_ENTITY, contextUser);
        row.NewRecord();
        row.AssignmentID = assignmentId;
        row.OutcomeType = outcomeType;
        row.OutcomeAt = new Date();
        row.ScoreDeltaAfter = Math.round(scoreDelta * 10000) / 10000; // decimal(9,4)
        row.MeasuredAt = new Date();
        // The boolean MATTERS. Ignoring it is how "Measured 100 outcome(s)" was reported against a table
        // holding zero rows: every save was failing on an entity-metadata mismatch and nothing noticed.
        if (await row.Save()) return true;
        LogError(
            `Sonar: failed to write outcome for assignment ${assignmentId}: ` +
                `${row.LatestResult?.Message ?? "unknown"}`,
        );
        return false;
    }
}
