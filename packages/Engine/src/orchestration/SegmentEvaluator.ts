import { Metadata, RunView, UserInfo } from "@memberjunction/core";
import { mjBizAppsSonarScoreEntity } from "@mj-biz-apps/sonar-entities";
import { TrendPoint, TrendShape, trendShape, withinWindow } from "../scoring/trendShape";
import { PersistedContribution, ReasonCondition, dominantDrag, dominantDragLabel, hasReasonCondition, reasonMatches } from "../scoring/factorDrag";
import { AnchorCondition, buildAnchorFilter, validRankFields } from "./anchorConditions";
import { RankSpec, rankCohort, rankNeedsAnchorFields } from "./rankCohort";

const SCORE_ENTITY = "MJ_BizApps_Sonar: Scores";
const HISTORY_ENTITY = "MJ_BizApps_Sonar: Score Histories";
const CONTRIBUTION_ENTITY = "MJ_BizApps_Sonar: Score Factor Contributions";
const FACTOR_ENTITY = "MJ_BizApps_Sonar: Factors";
const MODEL_ENTITY = "MJ_BizApps_Sonar: Score Models";
const MODEL_FACTOR_ENTITY = "MJ_BizApps_Sonar: Model Factors";

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

    // ------------------------------------------------- member context (anchor entity, layer 1b)

    /** Conditions on the MEMBER RECORD rather than the score: tenure, dormancy, region, segment.
     *  This is what makes a cohort a work list instead of a report — a score says how disengaged
     *  someone is, and these say whether now is the moment and whether they're the kind of member you
     *  meant. AND-ed with everything else. A condition naming a field the anchor entity doesn't have
     *  is an ERROR that fails the resolve, never a silently dropped condition (dropping one would
     *  widen the cohort and contact people the rule was written to exclude). */
    anchor?: AnchorCondition[] | null;

    // ------------------------------------------------------------------------- ordering (layer 4)

    /** Which members to work FIRST. Part of the RULE, not the display: the run cap truncates the
     *  resolved cohort, so this order decides who actually gets treated. Defaults to worst-score-first,
     *  which is what the evaluator's own SQL already returns. */
    rank?: RankSpec | null;

    // -------------------------------------------- reason (ScorePersistedContribution, layer 3)

    /** A condition on WHY the member is low: which signal is dragging them down. Selecting on the
     *  reason is what makes a group homogeneous enough for one action to fit it — "stopped attending
     *  events" and "stopped opening email" are the same score and different problems. */
    reason?: ReasonCondition | null;
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
    /** Why this member is low ("Low Event Registrations"), when the rule looked at the reason.
     *  Carried out so the group arrives with its justification attached rather than as bare ids. */
    reasonLabel?: string | null;
    /** The factor behind `reasonLabel`. Carried alongside the label so a caller can turn "180 of
     *  these stopped attending events" straight back into a rule (`dominantFactorIds: [thisId]`)
     *  instead of string-matching a display label. */
    dominantFactorId?: string | null;
    /** False when the dominant factor had NO underlying records for this member — the score is a data
     *  gap, not measured disengagement. Separated from the label so a caller can act on it. */
    reasonHadData?: boolean | null;
    /** Anchor-record values the rule asked to rank on (e.g. a renewal date, a dues amount). Read back
     *  in the same query that filters on the anchor, so ranking costs no extra round trip. */
    anchorValues?: Record<string, unknown> | null;
}

/** One slice of a cohort that shares a main problem — the unit an operator actually acts on. */
export interface ReasonGroup {
    /** null = Sonar can't tell why these members are low (no contributions on record). */
    factorId: string | null;
    label: string;
    count: number;
    /** Share of the cohort, 0–100, rounded to one decimal. */
    share: number;
    /** False when this slice's problem is MISSING DATA on the factor rather than weakness in it.
     *  Kept as its own field, not just baked into the label, because it changes the rule that
     *  reproduces the slice AND the right response: fix the integration, vs contact the member. */
    hadData: boolean;
}

/**
 * Split a resolved cohort by main problem, biggest group first.
 *
 * This is the answer to "who do I act on": a cohort picked by score or trajectory is a mixed bag, and
 * the breakdown is what turns it into candidate groups that one action can actually fit. The
 * "Unknown" bucket is deliberately kept rather than dropped — members Sonar can't explain are a real
 * and important slice (usually a data gap), and hiding them would overstate how well the rest is
 * understood.
 */
export function groupByReason(members: readonly SegmentMember[]): ReasonGroup[] {
    const groups = new Map<string, ReasonGroup>();
    for (const m of members) {
        const hadData = m.reasonHadData !== false;
        // Keyed on factor AND whether there was data: "no event records at all" and "few event
        // records" are the same factor but different problems, and merging them would label half the
        // slice wrongly and suggest the wrong fix for it.
        const key = `${m.dominantFactorId ?? ""}|${hadData ? "low" : "gap"}`;
        const existing = groups.get(key);
        if (existing) {
            existing.count++;
            continue;
        }
        groups.set(key, {
            factorId: m.dominantFactorId ?? null,
            label: m.reasonLabel ?? "Reason unknown",
            count: 1,
            share: 0,
            hadData,
        });
    }
    const total = members.length || 1;
    return [...groups.values()]
        .map((g) => ({ ...g, share: Math.round((g.count / total) * 1000) / 10 }))
        .sort((a, b) => b.count - a.count);
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
        if (candidates.length === 0) return candidates;
        // Member-context pass runs EARLY and deliberately: it is one cheap indexed query on the anchor
        // entity, so narrowing here means the expensive history and contribution reads below only run
        // for members who already passed it.
        const afterAnchor = await this.applyAnchor(modelId, candidates, filter, contextUser, now);
        if (afterAnchor.length === 0) return afterAnchor;
        const afterTrajectory = needsTrajectory(filter)
            ? await this.applyTrajectory(modelId, afterAnchor, filter, contextUser, now)
            : afterAnchor;
        const afterReason = afterTrajectory.length === 0 || !filter.reason || !hasReasonCondition(filter.reason)
            ? afterTrajectory
            : await this.applyReason(afterTrajectory, filter.reason, contextUser);
        // Ordering last, over the final cohort: the run cap truncates this list, so this is the
        // decision about who gets treated when a team can only work N of them.
        return rankCohort(afterReason, filter.rank, now);
    }

    /**
     * Pass 1b: conditions on the MEMBER RECORD, plus the anchor values the rule wants to rank on.
     *
     * Field names reach SQL here, so they are compiled against the anchor entity's REAL field list and
     * anything unrecognised throws rather than being dropped — a silently ignored condition widens the
     * cohort, which is the one failure mode that gets the wrong people contacted.
     *
     * Returns the candidates untouched when the rule asks nothing of the member record and needs no
     * values for ranking, so the common case costs no query at all.
     */
    private async applyAnchor(
        modelId: string,
        candidates: SegmentMember[],
        filter: SegmentFilter,
        contextUser: UserInfo,
        now: number,
    ): Promise<SegmentMember[]> {
        const asks = (filter.anchor?.length ?? 0) > 0;
        const ranks = rankNeedsAnchorFields(filter.rank);
        if (!asks && !ranks) return candidates;

        const entity = await this.anchorEntityName(modelId, contextUser);
        if (!entity) {
            throw new Error("This model's anchor entity could not be resolved, so member conditions cannot be applied.");
        }
        const fields = await this.anchorFieldTypes(entity);
        const { sql, errors } = buildAnchorFilter(filter.anchor, fields, now);
        if (errors.length > 0) {
            throw new Error(`Invalid member condition(s): ${errors.join(" ")}`);
        }
        const rankFields = validRankFields([filter.rank?.urgencyField, filter.rank?.valueField], fields);
        const values = await this.loadAnchorRows(entity, candidates, sql, rankFields, contextUser);

        const kept: SegmentMember[] = [];
        for (const c of candidates) {
            const row = values.get(c.anchorRecordId);
            if (!row) continue; // filtered out by the member conditions (or no such anchor record)
            kept.push(rankFields.length > 0 ? { ...c, anchorValues: row } : c);
        }
        return kept;
    }

    /** The anchor entity's NAME for a model, or null when unresolvable. */
    private async anchorEntityName(modelId: string, contextUser: UserInfo): Promise<string | null> {
        const res = await new RunView().RunView<{ AnchorEntityID: string | null }>(
            { EntityName: MODEL_ENTITY, ExtraFilter: `ID='${String(modelId).replace(/'/g, "''")}'`, Fields: ["AnchorEntityID"], MaxRows: 1, ResultType: "simple" },
            contextUser,
        );
        const id = res.Success ? res.Results?.[0]?.AnchorEntityID ?? null : null;
        if (!id) return null;
        return new Metadata().Entities.find((e) => e.ID === id)?.Name ?? null;
    }

    /** field name -> SQL type for the anchor entity, from MJ metadata (never from a schema query). */
    private async anchorFieldTypes(entityName: string): Promise<Map<string, string>> {
        const info = new Metadata().Entities.find((e) => e.Name === entityName);
        const out = new Map<string, string>();
        for (const f of info?.Fields ?? []) out.set(f.Name, f.Type);
        return out;
    }

    /** Anchor rows that pass the conditions, keyed by record id, carrying any rank fields. Chunked. */
    private async loadAnchorRows(
        entityName: string,
        candidates: SegmentMember[],
        conditionSql: string,
        rankFields: string[],
        contextUser: UserInfo,
    ): Promise<Map<string, Record<string, unknown>>> {
        const out = new Map<string, Record<string, unknown>>();
        const ids = candidates.map((c) => c.anchorRecordId);
        for (let i = 0; i < ids.length; i += HISTORY_CHUNK) {
            const list = ids.slice(i, i + HISTORY_CHUNK).map((id) => `'${String(id).replace(/'/g, "''")}'`).join(",");
            const scoped = `ID IN (${list})${conditionSql ? ` AND (${conditionSql})` : ""}`;
            const res = await new RunView().RunView<Record<string, unknown>>(
                {
                    EntityName: entityName,
                    ExtraFilter: scoped,
                    Fields: ["ID", ...rankFields],
                    IgnoreMaxRows: true,
                    ResultType: "simple",
                },
                contextUser,
            );
            if (!res.Success) {
                throw new Error(`Reading the member records failed: ${res.ErrorMessage ?? "unknown error"}`);
            }
            for (const row of res.Results ?? []) {
                const id = row["ID"];
                if (id != null) out.set(String(id), row);
            }
        }
        return out;
    }

    /**
     * Resolve a rule AND explain the result: every member labelled with its main problem, plus the
     * cohort's breakdown by that problem.
     *
     * Separate from `resolve()` on purpose. Labelling costs an extra read of every member's factor
     * contributions, which is worth it for a human staring at a preview and pure overhead on the
     * run path — so `resolve()` stays lean and only reads contributions when the RULE asks about the
     * reason. A caller that wants the explanation opts in here.
     */
    public async resolveWithReasons(
        modelId: string,
        filter: SegmentFilter,
        contextUser: UserInfo,
        now: number = Date.now(),
    ): Promise<{ members: SegmentMember[]; breakdown: ReasonGroup[] }> {
        const members = await this.resolve(modelId, filter, contextUser, now);
        // resolve() already labelled them if the rule filtered on the reason; don't pay twice.
        const labelled = members.some((m) => m.reasonLabel !== undefined)
            ? members
            : await this.applyReason(members, null, contextUser);
        return { members: labelled, breakdown: groupByReason(labelled) };
    }

    /**
     * Third pass: label each member with its failing signal, and (when `reason` is non-null) drop the
     * members whose signal doesn't match the rule. Runs after the trajectory pass so contributions are
     * only read for members still in play.
     *
     * A null `reason` means "explain, don't filter" — the preview path, where the operator wants to
     * see how the group splits before committing to one slice of it.
     */
    private async applyReason(
        candidates: SegmentMember[],
        reason: ReasonCondition | null,
        contextUser: UserInfo,
    ): Promise<SegmentMember[]> {
        if (candidates.length === 0) return candidates;
        const byScore = await this.loadContributions(candidates.map((c) => c.scoreId), contextUser);
        const kept: SegmentMember[] = [];
        for (const c of candidates) {
            const contributions = byScore.get(c.scoreId) ?? [];
            if (reason && !reasonMatches(contributions, reason)) continue;
            const worst = dominantDrag(contributions);
            kept.push({
                ...c,
                reasonLabel: dominantDragLabel(contributions),
                dominantFactorId: worst?.factorId ?? null,
                reasonHadData: worst ? worst.hadData : null,
            });
        }
        return kept;
    }

    /** Factor contributions per score, with factor names resolved. Chunked, and the factor-name
     *  lookup is one query for the whole set rather than one per member. */
    private async loadContributions(
        scoreIds: string[],
        contextUser: UserInfo,
    ): Promise<Map<string, PersistedContribution[]>> {
        const rows: { ScoreID: string; FactorID: string; ModelFactorID: string | null; NormalizedValue: number | null; PercentOfTotal: number | null; HadData: boolean | null }[] = [];
        for (let i = 0; i < scoreIds.length; i += HISTORY_CHUNK) {
            const list = scoreIds
                .slice(i, i + HISTORY_CHUNK)
                .map((id) => `'${String(id).replace(/'/g, "''")}'`)
                .join(",");
            const res = await new RunView().RunView<typeof rows[number]>(
                {
                    EntityName: CONTRIBUTION_ENTITY,
                    ExtraFilter: `ScoreID IN (${list})`,
                    Fields: ["ScoreID", "FactorID", "ModelFactorID", "NormalizedValue", "PercentOfTotal", "HadData"],
                    IgnoreMaxRows: true,
                    ResultType: "simple",
                },
                contextUser,
            );
            if (res.Success) rows.push(...(res.Results ?? []));
        }
        const [names, weights] = await Promise.all([
            this.loadFactorNames([...new Set(rows.map((r) => r.FactorID))], contextUser),
            // The rubric weight, which is what drag is actually measured against — see rankFactorDrag.
            this.loadFactorWeights([...new Set(rows.map((r) => r.ModelFactorID).filter((id): id is string => !!id))], contextUser),
        ]);
        const byScore = new Map<string, PersistedContribution[]>();
        for (const r of rows) {
            const list = byScore.get(r.ScoreID) ?? [];
            list.push({
                factorId: r.FactorID,
                label: names.get(r.FactorID) ?? "Signal",
                normalizedValue: r.NormalizedValue ?? 0,
                percentOfTotal: r.PercentOfTotal ?? 0,
                weight: r.ModelFactorID ? weights.get(r.ModelFactorID) ?? null : null,
                hadData: r.HadData ?? false,
            });
            byScore.set(r.ScoreID, list);
        }
        return byScore;
    }

    /** Configured rubric weight per ModelFactor. One query for the whole set — a rubric has a handful
     *  of factors, so this is a couple of rows however big the cohort is. */
    private async loadFactorWeights(modelFactorIds: string[], contextUser: UserInfo): Promise<Map<string, number>> {
        if (modelFactorIds.length === 0) return new Map();
        const list = modelFactorIds.map((id) => `'${String(id).replace(/'/g, "''")}'`).join(",");
        const res = await new RunView().RunView<{ ID: string; Weight: number | null }>(
            { EntityName: MODEL_FACTOR_ENTITY, ExtraFilter: `ID IN (${list})`, Fields: ["ID", "Weight"], IgnoreMaxRows: true, ResultType: "simple" },
            contextUser,
        );
        const out = new Map<string, number>();
        for (const r of res.Success ? res.Results ?? [] : []) {
            if (r.Weight != null && Number.isFinite(r.Weight)) out.set(r.ID, Number(r.Weight));
        }
        return out;
    }

    private async loadFactorNames(factorIds: string[], contextUser: UserInfo): Promise<Map<string, string>> {
        if (factorIds.length === 0) return new Map();
        const list = factorIds.map((id) => `'${String(id).replace(/'/g, "''")}'`).join(",");
        const res = await new RunView().RunView<{ ID: string; Name: string }>(
            { EntityName: FACTOR_ENTITY, ExtraFilter: `ID IN (${list})`, Fields: ["ID", "Name"], ResultType: "simple" },
            contextUser,
        );
        return new Map((res.Success ? res.Results ?? [] : []).map((f) => [f.ID, f.Name]));
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
