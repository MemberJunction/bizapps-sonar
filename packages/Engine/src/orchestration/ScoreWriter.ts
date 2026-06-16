import { LogError, Metadata, RunView, UserInfo } from "@memberjunction/core";
import {
    mjBizAppsSonarScoreModelEntity,
    mjBizAppsSonarScoreEntity,
    mjBizAppsSonarScoreFactorContributionEntity,
} from "@mj-biz-apps/sonar-entities";
import { ScoreResult } from "../scoring/ScoringEngine";

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
    ): Promise<number> {
        if (scores.size === 0) {
            return 0;
        }
        const existing = await this.loadExistingScores(model, contextUser);
        await this.clearOldContributions(existing, contextUser);

        let recordsScored = 0;
        for (const [anchorRecordId, result] of scores) {
            const score =
                existing.get(anchorRecordId) ??
                (await this.newScore(contextUser));
            this.applyScore(score, model, versionId, anchorRecordId, asOf, result);
            if (!(await score.Save())) {
                LogError(
                    `ScoreWriter: failed to save Score for anchor ${anchorRecordId}: ${score.LatestResult?.CompleteMessage ?? "unknown"}`,
                );
                continue;
            }
            await this.insertContributions(score.ID, result, contextUser);
            recordsScored++;
        }
        return recordsScored;
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
     * Delete the existing contribution rows for every score we are about to rewrite
     * (the "replace" half of replace-contributions). One RunView + per-row deletes — fine
     * at modest scale; the bulk path collapses this into a set-based delete.
     */
    private async clearOldContributions(
        existing: Map<string, mjBizAppsSonarScoreEntity>,
        contextUser: UserInfo,
    ): Promise<void> {
        const scoreIds = [...existing.values()].map((s) => `'${s.ID}'`);
        if (scoreIds.length === 0) {
            return;
        }
        const rv = new RunView();
        const result = await rv.RunView<mjBizAppsSonarScoreFactorContributionEntity>(
            {
                EntityName: "MJ_BizApps_Sonar: Score Factor Contributions",
                ExtraFilter: `ScoreID IN (${scoreIds.join(",")})`,
                ResultType: "entity_object",
            },
            contextUser,
        );
        for (const row of result.Success ? (result.Results ?? []) : []) {
            if (!(await row.Delete())) {
                LogError(
                    `ScoreWriter: failed to delete stale contribution ${row.ID}.`,
                );
            }
        }
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

    /** Set the score's fields from the computed result. Trend/confidence fields stay null in v1. */
    private applyScore(
        score: mjBizAppsSonarScoreEntity,
        model: mjBizAppsSonarScoreModelEntity,
        versionId: string,
        anchorRecordId: string,
        asOf: Date,
        result: ScoreResult,
    ): void {
        score.ScoreModelID = model.ID;
        score.ScoreModelVersionID = versionId;
        score.AnchorEntityID = model.AnchorEntityID;
        score.AnchorRecordID = anchorRecordId;
        score.RawScore = result.rawScore;
        score.NormalizedScore = result.normalizedScore;
        score.BandID = result.bandId;
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
            row.MissingDataApplied = false;
            if (!(await row.Save())) {
                LogError(
                    `ScoreWriter: failed to save contribution (factor ${c.factorId}) for score ${scoreId}.`,
                );
            }
        }
    }
}
