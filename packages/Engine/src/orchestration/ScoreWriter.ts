import { LogError, Metadata, RunView, UserInfo } from "@memberjunction/core";
import { SQLServerDataProvider } from "@memberjunction/sqlserver-dataprovider";
import {
    mjBizAppsSonarScoreModelEntity,
    mjBizAppsSonarScoreEntity,
    mjBizAppsSonarScoreFactorContributionEntity,
    mjBizAppsSonarScoreHistoryEntity,
    mjBizAppsSonarScoreBandTransitionEntity,
} from "@mj-biz-apps/sonar-entities";
import { ScoreResult } from "../scoring/ScoringEngine";
import { encodeContributionDetail } from "../scoring/contributionDetail";
import {
    BandTransition,
    TrendBaseline,
    computeDelta,
    dataCompleteness,
    detectBandTransition,
    latestBaselinePerAnchor,
    trendDirection,
} from "../scoring/scoreTrend";
import type { AnchorKey } from "../factors/anchorKey";

/** Progress sink for a persist pass: called with (members persisted so far, total to persist).
 *  Throttled by the writer — see PROGRESS_EVERY. Optional; the persist path is unaffected when omitted. */
export type ScoreWriteProgress = (processed: number, total: number) => void;

/** Emit a progress tick every N members (plus the final one) so a big run streams a handful of
 *  updates instead of one per row — keeps the LongRunning progress channel from flooding. */
const PROGRESS_EVERY = 25;

/**
 * Persists a run's computed scores. Each anchor's Score is upserted (one current row per
 * model+anchor, keyed by UQ_Score_ModelAnchorRecord), and its ScoreFactorContribution rows
 * are replaced.
 *
 * v1 writes row-by-row via the MJ entity layer (clean, but one round-trip per row). The
 * scale path is NOT more workers — it is set-based writes (stage into a temp table → MERGE)
 * and, bigger still, only writing the anchors whose score actually CHANGED (diffing). Both
 * are deferred; this version is correct and readable for modest populations.
 */
export class ScoreWriter {
    public async write(
        model: mjBizAppsSonarScoreModelEntity,
        versionId: string,
        scores: Map<string, ScoreResult>,
        asOf: Date,
        contextUser: UserInfo,
        runId?: string,
        anchorKeys?: AnchorKey[],
        onProgress?: ScoreWriteProgress,
    ): Promise<number> {
        if (scores.size === 0) {
            return 0;
        }
        // id → structured key JSON, so each persisted Score records its full (possibly composite)
        // anchor key in AnchorRecordKeyJSON (type- + order-faithful round-trip).
        const keyJsonById = new Map((anchorKeys ?? []).map((k) => [k.id, k.json]));
        const existing = await this.loadExistingScores(model, contextUser);
        await this.clearOldContributions(model, contextUser);

        // Trend baseline: Delta/Trend compare the new score to the snapshot ~TrendWindowDays ago
        // (a real "change over N days", not just "since last run"). When the model has no
        // TrendWindowDays, fall back to the immediately-prior score.
        const trendDays = model.TrendWindowDays;
        const baselines =
            trendDays != null && trendDays > 0
                ? await this.loadTrendBaselines(model, this.subtractDays(asOf, trendDays), contextUser)
                : null;

        let recordsScored = 0;
        for (const [anchorRecordId, result] of scores) {
            const prior = existing.get(anchorRecordId);
            const priorBand = prior?.BandID ?? null; // immediately-prior band — for run-over-run transitions
            // Trend baseline: the window-ago snapshot, or (no window configured) the prior score.
            const baseline = baselines
                ? baselines.get(anchorRecordId) ?? null
                : prior && prior.NormalizedScore != null
                  ? { score: prior.NormalizedScore, band: prior.BandID ?? null }
                  : null;
            const prevScore = baseline?.score ?? null;
            const prevBand = baseline?.band ?? null;

            const score = prior ?? (await this.newScore(contextUser));
            const keyJson = keyJsonById.get(anchorRecordId) ?? null;
            this.applyScore(score, model, versionId, anchorRecordId, keyJson, asOf, result, prevScore, prevBand);
            if (!(await score.Save())) {
                LogError(
                    `ScoreWriter: failed to save Score for anchor ${anchorRecordId}: ${score.LatestResult?.CompleteMessage ?? "unknown"}`,
                );
                continue;
            }
            await this.insertContributions(score.ID, result, contextUser);
            await this.writeHistory(score, result, contextUser);
            // A band change is a transition measured run-over-run (vs the immediately-prior band),
            // independent of the trend window; its Direction comes from the run-over-run move.
            const lastRunDelta = prior ? computeDelta(result.normalizedScore, prior.NormalizedScore) : null;
            const transition = detectBandTransition(priorBand, result.bandId, !!prior, lastRunDelta);
            if (transition) {
                await this.writeBandTransition(model, anchorRecordId, transition, runId, contextUser);
            }
            recordsScored++;
            // Throttled progress: every Nth member. The final tick is emitted after the loop so the
            // bar always lands on 100% even when the count isn't a clean multiple of PROGRESS_EVERY.
            if (onProgress && recordsScored % PROGRESS_EVERY === 0) {
                onProgress(recordsScored, scores.size);
            }
        }
        onProgress?.(recordsScored, scores.size);
        return recordsScored;
    }

    /** `asOf` minus N days — the trend-window cutoff date. */
    private subtractDays(asOf: Date, days: number): Date {
        return new Date(asOf.getTime() - days * 24 * 60 * 60 * 1000);
    }

    /**
     * The trend baseline per anchor: the most recent ScoreHistory snapshot at/before `cutoff`
     * (so Delta = now − "the score ~TrendWindowDays ago"). One query for the whole model
     * (IgnoreMaxRows), reduced to the latest pre-cutoff row per anchor. Anchors with no history
     * that old get no baseline → null Delta/Trend ("not enough history yet").
     * Scale note: this scans the model's pre-cutoff history; history retention (deferred) bounds it.
     */
    private async loadTrendBaselines(
        model: mjBizAppsSonarScoreModelEntity,
        cutoff: Date,
        contextUser: UserInfo,
    ): Promise<Map<string, TrendBaseline>> {
        const result = await new RunView().RunView<mjBizAppsSonarScoreHistoryEntity>(
            {
                EntityName: "MJ_BizApps_Sonar: Score Histories",
                ExtraFilter: `ScoreModelID='${model.ID}' AND AsOfDate <= '${cutoff.toISOString()}'`,
                OrderBy: "AsOfDate DESC",
                ResultType: "entity_object",
                IgnoreMaxRows: true,
            },
            contextUser,
        );
        // Ordered AsOfDate DESC → the first row seen per anchor is the most recent pre-cutoff one.
        return latestBaselinePerAnchor(result.Success ? (result.Results ?? []) : []);
    }

    /** Current Score rows for this model, keyed by AnchorRecordID (for find-or-create). */
    private async loadExistingScores(
        model: mjBizAppsSonarScoreModelEntity,
        contextUser: UserInfo,
    ): Promise<Map<string, mjBizAppsSonarScoreEntity>> {
        const rv = new RunView();
        const result = await rv.RunView<mjBizAppsSonarScoreEntity>(
            {
                EntityName: "MJ_BizApps_Sonar: Scores",
                ExtraFilter: `ScoreModelID='${model.ID}'`,
                ResultType: "entity_object",
                // One Score per anchor — must diff against ALL of them, or a re-recompute of a
                // >1000-member model would miss existing rows and double-write. (Scale path: batch.)
                IgnoreMaxRows: true,
            },
            contextUser,
        );
        const byAnchor = new Map<string, mjBizAppsSonarScoreEntity>();
        for (const score of result.Success ? (result.Results ?? []) : []) {
            byAnchor.set(score.AnchorRecordID, score);
        }
        return byAnchor;
    }

    /**
     * Delete the existing contribution rows for this model's scores (the "replace" half of
     * replace-contributions). Set-based: ONE `DELETE … JOIN Score` instead of loading N×factor
     * rows and deleting each — a recomputed model has one contribution per scored member per
     * factor, so the per-row path cost a round trip apiece. The subquery scales to any population
     * (no inlined ID list). Runs raw SQL via the SQL Server provider (engine is server-side).
     */
    private async clearOldContributions(
        model: mjBizAppsSonarScoreModelEntity,
        contextUser: UserInfo,
    ): Promise<void> {
        const md = new Metadata();
        const contrib = md.Entities.find((e) => e.Name === "MJ_BizApps_Sonar: Score Factor Contributions");
        const score = md.Entities.find((e) => e.Name === "MJ_BizApps_Sonar: Scores");
        if (!contrib || !score) {
            LogError("ScoreWriter: could not resolve Score/Contribution entities for set-based delete.");
            return;
        }
        const sql =
            `DELETE c FROM [${contrib.SchemaName}].[${contrib.BaseTable}] c ` +
            `INNER JOIN [${score.SchemaName}].[${score.BaseTable}] s ON s.ID = c.ScoreID ` +
            `WHERE s.ScoreModelID = @modelId`;
        const provider = Metadata.Provider as SQLServerDataProvider;
        await provider.ExecuteSQL(sql, { modelId: model.ID }, undefined, contextUser);
    }

    private async newScore(contextUser: UserInfo): Promise<mjBizAppsSonarScoreEntity> {
        const md = new Metadata();
        const score = await md.GetEntityObject<mjBizAppsSonarScoreEntity>(
            "MJ_BizApps_Sonar: Scores",
            contextUser,
        );
        score.NewRecord();
        return score;
    }

    /** Set the score's fields from the computed result, plus trend vs. the prior score.
     *  TrendSlope + Confidence stay null (deferred — need a history series / a calibrated model). */
    private applyScore(
        score: mjBizAppsSonarScoreEntity,
        model: mjBizAppsSonarScoreModelEntity,
        versionId: string,
        anchorRecordId: string,
        anchorRecordKeyJSON: string | null,
        asOf: Date,
        result: ScoreResult,
        prevScore: number | null,
        prevBand: string | null,
    ): void {
        score.ScoreModelID = model.ID;
        score.ScoreModelVersionID = versionId;
        score.AnchorEntityID = model.AnchorEntityID;
        score.AnchorRecordID = anchorRecordId;
        score.AnchorRecordKeyJSON = anchorRecordKeyJSON;
        score.RawScore = result.rawScore;
        score.NormalizedScore = result.normalizedScore;
        score.BandID = result.bandId;
        score.PreviousNormalizedScore = prevScore;
        score.PreviousBandID = prevBand;
        score.Delta = computeDelta(result.normalizedScore, prevScore);
        score.TrendDirection = trendDirection(score.Delta);
        score.DataCompleteness = dataCompleteness(result.contributions);
        score.ComputedAt = new Date();
        score.AsOfDate = asOf;
        score.IsStale = false;
    }

    /** Insert the fresh contribution breakdown for one score. */
    private async insertContributions(
        scoreId: string,
        result: ScoreResult,
        contextUser: UserInfo,
    ): Promise<void> {
        const md = new Metadata();
        for (const c of result.contributions) {
            const row =
                await md.GetEntityObject<mjBizAppsSonarScoreFactorContributionEntity>(
                    "MJ_BizApps_Sonar: Score Factor Contributions",
                    contextUser,
                );
            row.NewRecord();
            row.ScoreID = scoreId;
            row.ModelFactorID = c.modelFactorId;
            row.FactorID = c.factorId;
            row.RawValue = c.rawValue;
            row.NormalizedValue = c.normalizedContribution;
            row.WeightedContribution = c.weightedValue;
            row.PercentOfTotal =
                result.rawScore !== 0 ? c.weightedValue / result.rawScore : null;
            row.HadData = c.hadData;
            row.MissingDataApplied = c.missingDataApplied;
            // Freeze the factor's "why" alongside the math so a persisted score stays explainable.
            row.DetailJSON = encodeContributionDetail(c.explanation);
            if (!(await row.Save())) {
                LogError(
                    `ScoreWriter: failed to save contribution (factor ${c.factorId}) for score ${scoreId}.`,
                );
            }
        }
    }

    /**
     * Append an immutable ScoreHistory snapshot for this anchor on this recompute. The current
     * Score row is overwritten in place each run, so history is what gives us a time series
     * (sparklines, movers, "was X, now Y"). ContributionsJSON freezes the breakdown at this point
     * so a snapshot stays explainable even after the rubric changes.
     */
    private async writeHistory(
        score: mjBizAppsSonarScoreEntity,
        result: ScoreResult,
        contextUser: UserInfo,
    ): Promise<void> {
        const md = new Metadata();
        const hist = await md.GetEntityObject<mjBizAppsSonarScoreHistoryEntity>(
            "MJ_BizApps_Sonar: Score Histories",
            contextUser,
        );
        hist.NewRecord();
        hist.ScoreModelID = score.ScoreModelID;
        hist.ScoreModelVersionID = score.ScoreModelVersionID;
        hist.AnchorEntityID = score.AnchorEntityID;
        hist.AnchorRecordID = score.AnchorRecordID;
        hist.NormalizedScore = result.normalizedScore;
        hist.BandID = result.bandId;
        hist.DataCompleteness = score.DataCompleteness;
        hist.AsOfDate = score.AsOfDate;
        hist.ComputedAt = score.ComputedAt;
        hist.ContributionsJSON = JSON.stringify(result.contributions);
        if (!(await hist.Save())) {
            LogError(
                `ScoreWriter: failed to save ScoreHistory for anchor ${score.AnchorRecordID}: ${hist.LatestResult?.CompleteMessage ?? "unknown"}`,
            );
        }
    }

    /**
     * Record a band crossing (e.g. Healthy → At-Risk) so the action layer has a queue to react to.
     * Handled=false marks it un-actioned; Direction is the human read of the move. Only called with
     * a real transition (detectBandTransition already gated it on an actual band change).
     */
    private async writeBandTransition(
        model: mjBizAppsSonarScoreModelEntity,
        anchorRecordId: string,
        transition: BandTransition,
        runId: string | undefined,
        contextUser: UserInfo,
    ): Promise<void> {
        const md = new Metadata();
        const tr = await md.GetEntityObject<mjBizAppsSonarScoreBandTransitionEntity>(
            "MJ_BizApps_Sonar: Score Band Transitions",
            contextUser,
        );
        tr.NewRecord();
        tr.ScoreModelID = model.ID;
        tr.AnchorRecordID = anchorRecordId;
        tr.FromBandID = transition.fromBandId;
        tr.ToBandID = transition.toBandId;
        tr.Direction = transition.direction;
        tr.OccurredAt = new Date();
        if (runId) tr.RecomputeRunID = runId;
        tr.Handled = false;
        if (!(await tr.Save())) {
            LogError(
                `ScoreWriter: failed to save ScoreBandTransition for anchor ${anchorRecordId}: ${tr.LatestResult?.CompleteMessage ?? "unknown"}`,
            );
        }
    }
}
