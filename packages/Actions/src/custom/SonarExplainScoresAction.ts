import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { RunView } from "@memberjunction/core";
import { PersistedContribution, dominantDrag, dominantDragLabel } from "@mj-biz-apps/sonar-engine";

const CONTRIBUTION = "MJ_BizApps_Sonar: Score Factor Contributions";
const FACTOR = "MJ_BizApps_Sonar: Factors";
const MODEL_FACTOR = "MJ_BizApps_Sonar: Model Factors";

/** Keep IN(...) lists well short of SQL's parameter/expression limits. */
const CHUNK = 200;
/** Ceiling on one request, so a caller can't ask for the whole population's reasons at once. */
const MAX_SCORES = 500;

/**
 * Sonar: Explain Scores — for a set of Score rows, WHY each one is low.
 *
 * The reason is computed here rather than in the browser, deliberately. It is not a display
 * formatting choice: ranking a member's factors by drag depends on the rubric weight (a factor with
 * no data gets `PercentOfTotal = 0` from the scorer even though that is exactly when it is hurting
 * the member most), and the same ranking decides who a targeting rule SELECTS. A client-side copy of
 * that maths is a second definition of the reason that can drift from the one the engine selects on
 * — which is what previously let the Triage list, the Movers list and the Draft Outreach play give
 * three different answers about the same member.
 *
 * So the rule is: the reason is computed once, server-side, and shipped as data. `Sonar: Preview
 * Segment` already returns it for a rule-resolved cohort; this action covers the surfaces that list
 * members WITHOUT a rule (the Triage list), which have no cohort to preview.
 *
 * It is also less data over the wire than the client-side version it replaces: that pulled every
 * factor contribution for every listed member in order to derive one short string each.
 *
 * Read-only; writes nothing.
 *
 * Input params:  ScoreIDsJSON (req — JSON array of Score.ID, max 500)
 * Output param:  Result (JSON: { reasons: [{ scoreId, reasonLabel, dominantFactorId, hadData }] })
 */
@RegisterClass(BaseAction, "SonarExplainScores")
export class SonarExplainScoresAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const ids = this.parseJsonParam<string[]>(params, "ScoreIDsJSON");
        if (!Array.isArray(ids)) {
            return this.fail(params, "VALIDATION_ERROR", "ScoreIDsJSON is required and must be a JSON array of Score IDs.");
        }
        const scoreIds = [...new Set(ids.filter((id) => typeof id === "string" && this.isGuid(id)))];
        if (scoreIds.length === 0) {
            // An empty ask is not an error — a list with no rows has no reasons to explain.
            return this.ok(params, "No score IDs to explain.", { reasons: [] });
        }
        if (scoreIds.length > MAX_SCORES) {
            return this.fail(params, "VALIDATION_ERROR", `Too many score IDs (${scoreIds.length}); the maximum is ${MAX_SCORES}.`);
        }

        try {
            const byScore = await this.loadContributions(scoreIds, params);
            const reasons = scoreIds.map((scoreId) => {
                const contributions = byScore.get(scoreId) ?? [];
                const worst = dominantDrag(contributions);
                return {
                    scoreId,
                    reasonLabel: dominantDragLabel(contributions),
                    dominantFactorId: worst?.factorId ?? null,
                    // False = the signal has NO records for this member, so the low score is a data
                    // gap rather than measured disengagement. Different problem, different fix.
                    hadData: worst ? worst.hadData : null,
                };
            });
            return this.ok(params, `Explained ${reasons.filter((r) => r.reasonLabel).length} of ${reasons.length} score(s).`, { reasons });
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    /** Contributions per score, with factor names and RUBRIC WEIGHTS resolved (the weight is what
     *  drag is measured against — see the engine's rankFactorDrag). */
    private async loadContributions(
        scoreIds: string[],
        params: RunActionParams,
    ): Promise<Map<string, PersistedContribution[]>> {
        const rows = await this.loadContributionRows(scoreIds, params);
        const [names, weights] = await Promise.all([
            this.lookup(FACTOR, [...new Set(rows.map((r) => r.FactorID))], "Name", params),
            this.lookup(MODEL_FACTOR, [...new Set(rows.map((r) => r.ModelFactorID).filter((id): id is string => !!id))], "Weight", params),
        ]);
        const byScore = new Map<string, PersistedContribution[]>();
        for (const r of rows) {
            const list = byScore.get(r.ScoreID) ?? [];
            const weight = r.ModelFactorID ? Number(weights.get(r.ModelFactorID)) : NaN;
            list.push({
                factorId: r.FactorID,
                label: String(names.get(r.FactorID) ?? "Signal"),
                normalizedValue: r.NormalizedValue ?? 0,
                percentOfTotal: r.PercentOfTotal ?? 0,
                weight: Number.isFinite(weight) ? weight : null,
                hadData: r.HadData ?? false,
            });
            byScore.set(r.ScoreID, list);
        }
        return byScore;
    }

    private async loadContributionRows(
        scoreIds: string[],
        params: RunActionParams,
    ): Promise<{ ScoreID: string; FactorID: string; ModelFactorID: string | null; NormalizedValue: number | null; PercentOfTotal: number | null; HadData: boolean | null }[]> {
        const rows: Awaited<ReturnType<SonarExplainScoresAction["loadContributionRows"]>> = [];
        for (let i = 0; i < scoreIds.length; i += CHUNK) {
            const list = scoreIds.slice(i, i + CHUNK).map((id) => `'${this.sqlString(id)}'`).join(",");
            const res = await new RunView().RunView<typeof rows[number]>(
                {
                    EntityName: CONTRIBUTION,
                    ExtraFilter: `ScoreID IN (${list})`,
                    Fields: ["ScoreID", "FactorID", "ModelFactorID", "NormalizedValue", "PercentOfTotal", "HadData"],
                    IgnoreMaxRows: true,
                    ResultType: "simple",
                },
                params.ContextUser,
            );
            if (res.Success) rows.push(...(res.Results ?? []));
        }
        return rows;
    }

    /** One id -> one column lookup. A rubric has a handful of factors, so this stays small however
     *  many members are being explained. */
    private async lookup(
        entityName: string,
        ids: string[],
        field: string,
        params: RunActionParams,
    ): Promise<Map<string, unknown>> {
        if (ids.length === 0) return new Map();
        const list = ids.map((id) => `'${this.sqlString(id)}'`).join(",");
        const res = await new RunView().RunView<Record<string, unknown>>(
            { EntityName: entityName, ExtraFilter: `ID IN (${list})`, Fields: ["ID", field], IgnoreMaxRows: true, ResultType: "simple" },
            params.ContextUser,
        );
        return new Map((res.Success ? res.Results ?? [] : []).map((r) => [String(r["ID"]), r[field]]));
    }
}
