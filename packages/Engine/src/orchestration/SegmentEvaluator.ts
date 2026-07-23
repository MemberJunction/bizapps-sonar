import { RunView, UserInfo } from "@memberjunction/core";
import { mjBizAppsSonarScoreEntity } from "@mj-biz-apps/sonar-entities";

const SCORE_ENTITY = "MJ_BizApps_Sonar: Scores";

/**
 * A segment's membership rule, expressed over the SCORE table only (band / normalized-score range).
 * This is the score-evaluable subset of the Engagement Manager's filters — exactly what can be
 * resolved from persisted Scores without joining the anchor entity. Member-detail filters (anchor
 * fields like "renews next month") are deferred; a free-text member search is a find tool, not a
 * targeting rule, so it is intentionally NOT part of a segment.
 */
export interface SegmentFilter {
    /** Restrict to one band (ScoreBand.ID), or null/undefined for any band. */
    bandId?: string | null;
    /** Inclusive normalized-score bounds, or null/undefined for unbounded. */
    minScore?: number | null;
    maxScore?: number | null;
    /** Inclusive bounds on the last-run score DELTA — the plan's "biggest droppers" rule
     *  (e.g. maxDelta: -5 = "dropped by 5+ since the last recompute"). A first-run score has a
     *  NULL delta and never matches a delta-bounded segment. */
    minDelta?: number | null;
    maxDelta?: number | null;
}

/** One resolved cohort member — its anchor identity + the score fields that placed it in the segment. */
export interface SegmentMember {
    anchorRecordId: string;
    anchorRecordKeyJSON: string | null;
    normalizedScore: number | null;
    bandId: string | null;
}

/**
 * Resolves a ScoreSegment's members by querying the model's persisted Score rows under the segment's
 * band/score filter. Returns the full cohort (IgnoreMaxRows) so an intervention sees everyone who
 * matches, not just a page. Read-only.
 */
export class SegmentEvaluator {
    public async resolve(
        modelId: string,
        filter: SegmentFilter,
        contextUser: UserInfo,
    ): Promise<SegmentMember[]> {
        const result = await new RunView().RunView<mjBizAppsSonarScoreEntity>(
            {
                EntityName: SCORE_ENTITY,
                ExtraFilter: this.buildFilter(modelId, filter),
                OrderBy: "NormalizedScore ASC",
                IgnoreMaxRows: true,
                ResultType: "entity_object",
            },
            contextUser,
        );
        if (!result.Success) {
            return [];
        }
        return (result.Results ?? []).map((s) => ({
            anchorRecordId: s.AnchorRecordID,
            anchorRecordKeyJSON: s.AnchorRecordKeyJSON,
            normalizedScore: s.NormalizedScore,
            bandId: s.BandID,
        }));
    }

    /** Compose the ExtraFilter. ModelID + BandID are UUIDs (safe); score bounds are coerced to finite
     *  numbers (a non-numeric bound is dropped) so nothing arbitrary reaches the SQL. */
    private buildFilter(modelId: string, filter: SegmentFilter): string {
        const conds = [`ScoreModelID='${modelId}'`];
        if (filter.bandId) {
            conds.push(`BandID='${filter.bandId}'`);
        }
        if (filter.minScore != null && Number.isFinite(filter.minScore)) {
            conds.push(`NormalizedScore >= ${Number(filter.minScore)}`);
        }
        if (filter.maxScore != null && Number.isFinite(filter.maxScore)) {
            conds.push(`NormalizedScore <= ${Number(filter.maxScore)}`);
        }
        if (filter.minDelta != null && Number.isFinite(filter.minDelta)) {
            conds.push(`Delta >= ${Number(filter.minDelta)}`);
        }
        if (filter.maxDelta != null && Number.isFinite(filter.maxDelta)) {
            conds.push(`Delta <= ${Number(filter.maxDelta)}`);
        }
        return conds.join(" AND ");
    }
}
