import { RunView, UserInfo } from "@memberjunction/core";
import { mjBizAppsSonarScoreEntity } from "@mj-biz-apps/sonar-entities";
import { TrendPoint, TrendShape, trendShape, withinWindow } from "../scoring/trendShape";

const SCORE_ENTITY = "MJ_BizApps_Sonar: Scores";
const HISTORY_ENTITY = "MJ_BizApps_Sonar: Score Histories";

/** Keep IN(...) lists well short of SQL's parameter/expression limits on large cohorts. */
const HISTORY_CHUNK = 200;

/**
 * A segment's membership rule over persisted Scores, in two layers:
 *
 *  1. **Point-in-time** (band, score range, last-run delta, band crossing) — resolved in SQL from
 *     the Score row alone. Cheap, and how every rule worked originally.
 *  2. **Trajectory** (slope, sustained decline, net change over a horizon, volatility) — needs the
 *     member's ScoreHistory, so it runs as a second pass over the candidates from layer 1.
 *
 * Why trajectory matters: a Score row holds ONE delta (now vs. the model's `TrendWindowDays`
 * baseline). That can't tell a member who eroded steadily for months from one who dropped once and
 * held, and it can't see a member whose every single step was too small to trip a delta threshold.
 * Those are the members worth catching, so a rule has to be able to describe a SHAPE.
 *
 * The horizon lives HERE, on the rule (`windowDays`), not on the model. `ScoreModel.TrendWindowDays`
 * is one value per model and is frozen once published (deliberately — `Delta` has to stay
 * reproducible), so it cannot express "fell 10 points in a week" and "eroded 20 over six months" as
 * two different plays against the same model.
 *
 * Member-detail filters (anchor fields like "renews next month") are still deferred; a free-text
 * member search is a find tool, not a targeting rule, so it is intentionally NOT part of a segment.
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
    /** When true, restrict to members who actually CHANGED BAND on the last run (the meaningful
     *  "crossed a boundary" event, vs an in-band wiggle). A first-run score has no prior band and
     *  never matches. Combine with maxDelta<0 for "crossed down", minDelta>0 for "crossed up". */
    crossedBandOnly?: boolean | null;

    // ---------------------------------------------------------------- trust gates (SQL, layer 1)

    /** Minimum fraction (0–1) of the rubric's signals that had real data for this member.
     *  The point: with a `Zero` missing-data policy an anchor with NO data scores worst-possible,
     *  so the lowest scores in a sparse model can be data gaps rather than disengagement. Gating on
     *  completeness keeps a play off members Sonar simply doesn't know enough about. */
    minDataCompleteness?: number | null;

    // ------------------------------------------------------- trajectory (ScoreHistory, layer 2)

    /** The rule's own horizon in days: trajectory measures look only at snapshots this recent.
     *  null/undefined = use every snapshot on record. */
    windowDays?: number | null;
    /** Inclusive bounds on the fitted rate of change, in score-points per **30 days** (negative =
     *  eroding). e.g. `maxSlopePer30Days: -8` = "losing at least 8 points a month".
     *
     *  Why per-30-days and not per-day: the math is computed per day (unambiguous), but nobody
     *  authoring a rule thinks "0.27 points per day" — they think "8 points a month". Getting this
     *  unit wrong is a silent mistake: a plausible-looking per-day threshold like -1.5 matches
     *  nobody on a weekly-recompute model, because a member shedding 2 points a week is only
     *  -0.28/day. Monthly also lines up with `ScoreModel.TrendWindowDays`, which defaults to 30. */
    minSlopePer30Days?: number | null;
    maxSlopePer30Days?: number | null;
    /** Minimum consecutive step-over-step declines ending at the newest snapshot — "still sliding
     *  right now, for at least N cycles". Catches the steady eroder whose individual steps are
     *  all below any delta threshold. */
    minDeclineRun?: number | null;
    /** Minimum total points lost across the window (a positive number: 15 = "fell 15+ points"). */
    minNetDrop?: number | null;
    /** Maximum step-to-step standard deviation — excludes erratic series, so a rule can target
     *  members on a genuine slide rather than ones who happen to be low on a noisy day. */
    maxVolatility?: number | null;
    /** Minimum snapshots required before a member is judged at all. A trajectory rule on one
     *  snapshot is a guess; this makes "not enough history" an explicit exclusion instead of a
     *  silent pass or fail. Defaults to 2 whenever any trajectory bound is set. */
    minSnapshots?: number | null;
}

/** One resolved cohort member — its anchor identity, the score fields that placed it in the segment,
 *  and (when the rule asked for trajectory) the computed shape that qualified it. Carrying the shape
 *  out means the UI and a play's grounding can say WHY this member was picked, without recomputing. */
export interface SegmentMember {
    /** The Score row's id — what the caller needs to fetch this member's factor contributions. */
    scoreId: string;
    anchorRecordId: string;
    anchorRecordKeyJSON: string | null;
    normalizedScore: number | null;
    bandId: string | null;
    /** Last-run score change, carried out so a caller can render the cohort without re-querying. */
    delta: number | null;
    shape?: TrendShape | null;
}

/** Does this rule need ScoreHistory, or can the Score row answer it alone? */
export function needsTrajectory(filter: SegmentFilter): boolean {
    return (
        filter.minSlopePer30Days != null ||
        filter.maxSlopePer30Days != null ||
        filter.minDeclineRun != null ||
        filter.minNetDrop != null ||
        filter.maxVolatility != null ||
        filter.minSnapshots != null
    );
}

/** Days the rule's slope bounds are expressed over (see {@link SegmentFilter.maxSlopePer30Days}). */
const SLOPE_PERIOD_DAYS = 30;

/**
 * Decide whether one member's computed shape satisfies the rule's trajectory bounds. Pure, so the
 * semantics are unit-tested independently of any query.
 *
 * An UNKNOWN measure never satisfies a bound: a member with too little history to fit a slope is
 * excluded from a slope rule rather than quietly passing. Being unsure is not the same as matching.
 */
export function shapeMatches(shape: TrendShape, filter: SegmentFilter): boolean {
    const minSnapshots = filter.minSnapshots ?? 2;
    if (shape.points < minSnapshots) return false;

    // The shape is measured per day; the rule states its bound per 30 days. Scale the measure up
    // rather than the bound down, so the comparison happens in the operator's unit.
    const slopePerPeriod = shape.slopePerDay === null ? null : shape.slopePerDay * SLOPE_PERIOD_DAYS;
    if (filter.maxSlopePer30Days != null && Number.isFinite(filter.maxSlopePer30Days)) {
        if (slopePerPeriod === null || slopePerPeriod > filter.maxSlopePer30Days) return false;
    }
    if (filter.minSlopePer30Days != null && Number.isFinite(filter.minSlopePer30Days)) {
        if (slopePerPeriod === null || slopePerPeriod < filter.minSlopePer30Days) return false;
    }
    if (filter.minDeclineRun != null && Number.isFinite(filter.minDeclineRun)) {
        if (shape.declineRun < filter.minDeclineRun) return false;
    }
    if (filter.minNetDrop != null && Number.isFinite(filter.minNetDrop)) {
        // netChange is signed; a "drop of 15+" means netChange <= -15.
        if (shape.netChange === null || shape.netChange > -Math.abs(filter.minNetDrop)) return false;
    }
    if (filter.maxVolatility != null && Number.isFinite(filter.maxVolatility)) {
        if (shape.volatility === null || shape.volatility > filter.maxVolatility) return false;
    }
    return true;
}

/**
 * Resolves a ScoreSegment's members: the SQL-evaluable filter first, then (only when the rule asks
 * for it) a trajectory pass over those candidates' ScoreHistory. Returns the full cohort
 * (IgnoreMaxRows) so an intervention sees everyone who matches, not just a page. Read-only.
 *
 * Scale note: the trajectory pass loads history for the candidate set and shapes it in memory
 * (chunked IN(...) reads, one per {@link HISTORY_CHUNK} anchors). That's honest at demo/mid scale
 * and keeps the semantics in one testable place. Pushing the shape math into SQL (or into a
 * Predictive Studio feature) is the scale path, and the pure functions in `trendShape.ts` are the
 * spec it would have to reproduce.
 */
export class SegmentEvaluator {
    public async resolve(
        modelId: string,
        filter: SegmentFilter,
        contextUser: UserInfo,
        now: number = Date.now(),
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
        const candidates: SegmentMember[] = (result.Results ?? []).map((s) => ({
            scoreId: s.ID,
            anchorRecordId: s.AnchorRecordID,
            anchorRecordKeyJSON: s.AnchorRecordKeyJSON,
            normalizedScore: s.NormalizedScore,
            bandId: s.BandID,
            delta: s.Delta,
        }));
        if (candidates.length === 0 || !needsTrajectory(filter)) {
            return candidates;
        }
        return this.applyTrajectory(modelId, candidates, filter, contextUser, now);
    }

    /** Second pass: load each candidate's history, shape it over the rule's horizon, keep the
     *  members whose shape satisfies the bounds (and attach that shape as the "why"). */
    private async applyTrajectory(
        modelId: string,
        candidates: SegmentMember[],
        filter: SegmentFilter,
        contextUser: UserInfo,
        now: number,
    ): Promise<SegmentMember[]> {
        const history = await this.loadHistory(modelId, candidates.map((c) => c.anchorRecordId), contextUser);
        const kept: SegmentMember[] = [];
        for (const c of candidates) {
            const points = withinWindow(history.get(c.anchorRecordId) ?? [], now, filter.windowDays);
            const shape = trendShape(points);
            if (shapeMatches(shape, filter)) {
                kept.push({ ...c, shape });
            }
        }
        return kept;
    }

    /** ScoreHistory points per anchor for this model, chunked. Only the two columns the shape math
     *  needs are read — the snapshots carry a full ContributionsJSON we don't want to haul back. */
    private async loadHistory(
        modelId: string,
        anchorIds: string[],
        contextUser: UserInfo,
    ): Promise<Map<string, TrendPoint[]>> {
        const byAnchor = new Map<string, TrendPoint[]>();
        for (let i = 0; i < anchorIds.length; i += HISTORY_CHUNK) {
            const list = anchorIds
                .slice(i, i + HISTORY_CHUNK)
                .map((id) => `'${String(id).replace(/'/g, "''")}'`)
                .join(",");
            const res = await new RunView().RunView<{ AnchorRecordID: string; NormalizedScore: number | null; AsOfDate: string }>(
                {
                    EntityName: HISTORY_ENTITY,
                    ExtraFilter: `ScoreModelID='${modelId}' AND AnchorRecordID IN (${list})`,
                    Fields: ["AnchorRecordID", "NormalizedScore", "AsOfDate"],
                    IgnoreMaxRows: true,
                    ResultType: "simple",
                },
                contextUser,
            );
            for (const row of res.Success ? res.Results ?? [] : []) {
                if (row.NormalizedScore === null) continue;
                const asOf = new Date(row.AsOfDate).getTime();
                if (!Number.isFinite(asOf)) continue;
                const points = byAnchor.get(row.AnchorRecordID) ?? [];
                points.push({ asOf, score: row.NormalizedScore });
                byAnchor.set(row.AnchorRecordID, points);
            }
        }
        return byAnchor;
    }

    /** Compose the ExtraFilter. ModelID + BandID are UUIDs (safe); numeric bounds are coerced to
     *  finite numbers (a non-numeric bound is dropped) so nothing arbitrary reaches the SQL. */
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
        if (filter.crossedBandOnly) {
            conds.push(`PreviousBandID IS NOT NULL AND PreviousBandID <> BandID`);
        }
        if (filter.minDataCompleteness != null && Number.isFinite(filter.minDataCompleteness)) {
            conds.push(`DataCompleteness >= ${Number(filter.minDataCompleteness)}`);
        }
        return conds.join(" AND ");
    }
}
