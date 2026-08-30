import { LogStatus, Metadata, RunView, UserInfo } from "@memberjunction/core";
import {
    FunctionRecordProcessor,
    GenericProcessRunTracker,
    RecordSetProcessor,
} from "@memberjunction/record-set-processor";
import { ArraySource } from "@memberjunction/record-set-processor-base";
import type { RecordRef, RecordResult } from "@memberjunction/record-set-processor-base";
import {
    mjBizAppsSonarScoreModelEntity,
    mjBizAppsSonarScoreEntity,
    mjBizAppsSonarScoreFactorContributionEntity,
    mjBizAppsSonarScoreHistoryEntity,
    mjBizAppsSonarScoreBandTransitionEntity,
} from "@mj-biz-apps/sonar-entities";
import { ScoreResult } from "../scoring/ScoringEngine";
import { encodeContributionDetail } from "../scoring/contributionDetail";
import { planContributions, percentOfTotal } from "../scoring/contributionPlan";
import {
    TrendBaseline,
    computeDelta,
    dataCompleteness,
    detectBandTransition,
    latestBaselinePerAnchor,
    trendDirection,
} from "../scoring/scoreTrend";
import type { AnchorKey } from "../factors/anchorKey";

/** Progress sink for a persist pass: called with (members persisted so far, total to persist).
 *  Fired once per RSP batch, so its granularity is {@link ScorePersister} batch size. Optional. */
export type ScoreWriteProgress = (processed: number, total: number) => void;

/**
 * Persists a computed run through **Record Set Processing** — MJ's substrate for looping work —
 * using `BaseEntity.Save()` per record.
 *
 * ## Why this replaced the set-based writer
 *
 * The previous `ScoreWriter` flushed a whole run in a handful of raw `INSERT`/`MERGE` statements via
 * `provider.ExecuteSQL`. That was fast, and it silently skipped everything the save pipeline does:
 * field validation, Entity Actions (including `Validate`, a real blocking gate), Record Changes, and
 * cache invalidation. Hand-written DML against MJ entity tables is an anti-pattern for exactly that
 * reason — nothing fails loudly, so the gaps surface months later as missing audit history or a
 * configured workflow that never ran.
 *
 * Going through `Save()` costs round trips. Measured on a 2,000-member model (4 row-writes each):
 * set-based ~2.5s, this path ~78s at `maxConcurrency` 1 and ~17s at 10. That is the price of a
 * correct write, and for a scheduled recompute it is the right trade — plus we now get a persisted
 * audit trail in `MJ: Process Runs`, progress, resume, pause/cancel, and per-record error isolation,
 * none of which the set-based path had.
 *
 * ## The atomicity change — read this before touching the contribution logic
 *
 * The set-based writer wrapped the entire run in ONE transaction, specifically so that its
 * "DELETE every contribution for the model, then re-insert" could not leave the population stripped
 * of explainability if the run died midway. RSP has **per-record** isolation and no run-spanning
 * transaction, so that delete-then-reinsert shape is no longer safe: a crash between the two would
 * blow away every member's contribution breakdown with nothing to roll back.
 *
 * So contributions are **reconciled in place per member** instead — existing rows updated, missing
 * ones inserted, surplus ones deleted — which means a member's breakdown is never absent, only ever
 * old or new. Run-level all-or-nothing is genuinely gone: a failed run now leaves some members on
 * new scores and some on old. That is a real behavioural change, and it is the reason RSP tracks the
 * run and supports resume. Do not "optimise" this back into a bulk delete.
 */
export class ScorePersister {
    /**
     * Records processed concurrently within a batch. RSP's own default is **1**, which on the
     * benchmark above is ~4.5x slower than 10 for no benefit — so we set it explicitly rather than
     * inherit a default that quietly costs a minute a run.
     */
    public static readonly DefaultConcurrency = 10;

    /** Records per batch. RSP checkpoints between batches, so this is also the resume granularity. */
    private static readonly BatchSize = 200;

    /**
     * Compute → persist. Signature-compatible with the retired `ScoreWriter.write` so callers
     * (RecomputeOrchestrator) are unaffected.
     *
     * @returns the number of members persisted.
     */
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
            await this.clearModel(model, contextUser);
            onProgress?.(0, 0);
            return 0;
        }

        const context = await this.loadContext(model, versionId, scores, asOf, anchorKeys, contextUser);

        const refs: RecordRef[] = [...scores.keys()].map((anchorRecordId) => ({
            EntityID: model.AnchorEntityID,
            RecordID: anchorRecordId,
            Record: scores.get(anchorRecordId),
        }));

        const result = await RecordSetProcessor.Instance.Process({
            source: new ArraySource(refs, model.AnchorEntityID),
            processor: new FunctionRecordProcessor((record) => this.persistMember(record, context, runId, contextUser)),
            tracker: new GenericProcessRunTracker(),
            contextUser,
            entityID: model.AnchorEntityID,
            batchSize: ScorePersister.BatchSize,
            maxConcurrency: ScorePersister.DefaultConcurrency,
            resume: false,
            onAfterBatch: async (_batch, processed) => {
                onProgress?.(processed, scores.size);
                return null;
            },
        });

        // RSP never throws on logical failure — a caller that ignores Status silently accepts a
        // half-written population, which is exactly how a benchmark once reported a circuit-breaker
        // abort as a fast run.
        if (result.Status !== "Completed") {
            throw new Error(
                `ScorePersister: run did not complete (Status=${result.Status}, ` +
                    `processed=${result.Processed}, ok=${result.Success}, failed=${result.Error}, ` +
                    `skipped=${result.Skipped}). ` +
                    `ProcessRunID=${result.ProcessRunID ?? "none"} has the per-record detail.` +
                    (result.ErrorMessage ? ` Run error: ${result.ErrorMessage}` : ""),
            );
        }

        LogStatus(`ScorePersister: persisted ${scores.size} members · ProcessRunID=${result.ProcessRunID ?? "none"}`);
        onProgress?.(scores.size, scores.size);
        return scores.size;
    }

    /** Everything the per-record work needs, loaded once up front so no record does an N+1 read. */
    private async loadContext(
        model: mjBizAppsSonarScoreModelEntity,
        versionId: string,
        scores: Map<string, ScoreResult>,
        asOf: Date,
        anchorKeys: AnchorKey[] | undefined,
        contextUser: UserInfo,
    ): Promise<PersistContext> {
        const trendDays = model.TrendWindowDays;
        const [existing, contributions, baselines] = await Promise.all([
            this.loadExistingScores(model, contextUser),
            this.loadExistingContributions(model, contextUser),
            trendDays != null && trendDays > 0
                ? this.loadTrendBaselines(model, this.subtractDays(asOf, trendDays), contextUser)
                : Promise.resolve(null),
        ]);

        const keyJsonById = new Map<string, string>();
        for (const k of anchorKeys ?? []) keyJsonById.set(k.id, k.json);

        return {
            model,
            versionId,
            asOf,
            // ONE timestamp for the whole run, matching the set-based writer: every row of a run
            // shares a ComputedAt, so a run is identifiable by it.
            computedAt: new Date(),
            existing,
            contributions,
            baselines,
            keyJsonById,
        };
    }

    /** The per-member write: Score upsert → contribution reconcile → history append → transition. */
    private async persistMember(
        record: RecordRef,
        ctx: PersistContext,
        runId: string | undefined,
        contextUser: UserInfo,
    ): Promise<RecordResult> {
        const anchorRecordId = record.RecordID;
        const result = record.Record as ScoreResult;
        const md = new Metadata();

        const prior = ctx.existing.get(anchorRecordId);
        const priorBand = prior?.BandID ?? null;
        const baseline = ctx.baselines
            ? (ctx.baselines.get(anchorRecordId) ?? null)
            : prior && prior.NormalizedScore != null
              ? { score: prior.NormalizedScore, band: prior.BandID ?? null }
              : null;
        const prevScore = baseline?.score ?? null;
        const prevBand = baseline?.band ?? null;
        const delta = computeDelta(result.normalizedScore, prevScore);
        const completeness = dataCompleteness(result.contributions);

        // 1 — Score upsert. Reuse the existing row so its ID (and anything referencing it) survives.
        const score =
            prior ?? (await md.GetEntityObject<mjBizAppsSonarScoreEntity>("MJ_BizApps_Sonar: Scores", contextUser));
        if (!prior) {
            score.NewRecord();
            score.ScoreModelID = ctx.model.ID;
            score.AnchorEntityID = ctx.model.AnchorEntityID;
            score.AnchorRecordID = anchorRecordId;
            score.AnchorRecordKeyJSON = ctx.keyJsonById.get(anchorRecordId) ?? null;
        }
        score.ScoreModelVersionID = ctx.versionId;
        score.RawScore = result.rawScore;
        score.NormalizedScore = result.normalizedScore;
        score.BandID = result.bandId;
        score.PreviousNormalizedScore = prevScore;
        score.PreviousBandID = prevBand;
        score.Delta = delta;
        score.TrendDirection = trendDirection(delta);
        score.DataCompleteness = completeness;
        score.ComputedAt = ctx.computedAt;
        score.AsOfDate = ctx.asOf;
        score.IsStale = false;
        if (!(await score.Save())) {
            return this.failed(`Score (anchor ${anchorRecordId})`, score.LatestResult?.CompleteMessage);
        }

        // 2 — Contributions, reconciled in place. See the atomicity note in the class doc: this is
        // deliberately NOT delete-all-then-reinsert.
        const reconcile = await this.reconcileContributions(score, result, ctx, contextUser);
        if (reconcile) return reconcile;

        // 3 — History append.
        const history = await md.GetEntityObject<mjBizAppsSonarScoreHistoryEntity>(
            "MJ_BizApps_Sonar: Score Histories",
            contextUser,
        );
        history.NewRecord();
        history.ScoreModelID = ctx.model.ID;
        history.ScoreModelVersionID = ctx.versionId;
        history.AnchorEntityID = ctx.model.AnchorEntityID;
        history.AnchorRecordID = anchorRecordId;
        history.NormalizedScore = result.normalizedScore;
        history.BandID = result.bandId;
        history.AsOfDate = ctx.asOf;
        history.ComputedAt = ctx.computedAt;
        history.DataCompleteness = completeness;
        history.ContributionsJSON = JSON.stringify(result.contributions);
        if (!(await history.Save())) {
            return this.failed(`ScoreHistory (anchor ${anchorRecordId})`, history.LatestResult?.CompleteMessage);
        }

        // 4 — Band transition, measured run-over-run against the immediately-prior band (independent
        // of the trend window), so its Direction comes from the run-over-run move.
        const lastRunDelta = prior ? computeDelta(result.normalizedScore, prior.NormalizedScore) : null;
        const transition = detectBandTransition(priorBand, result.bandId, !!prior, lastRunDelta);
        if (transition) {
            const row = await md.GetEntityObject<mjBizAppsSonarScoreBandTransitionEntity>(
                "MJ_BizApps_Sonar: Score Band Transitions",
                contextUser,
            );
            row.NewRecord();
            row.ScoreModelID = ctx.model.ID;
            row.AnchorRecordID = anchorRecordId;
            row.FromBandID = transition.fromBandId;
            row.ToBandID = transition.toBandId;
            row.Direction = transition.direction;
            row.OccurredAt = ctx.computedAt;
            row.RecomputeRunID = runId ?? null;
            row.Handled = false;
            if (!(await row.Save())) {
                return this.failed(`ScoreBandTransition (anchor ${anchorRecordId})`, row.LatestResult?.CompleteMessage);
            }
        }

        return { Status: "Succeeded" };
    }

    /**
     * Bring this score's contribution rows in line with the computed set: update the ones that
     * exist, insert what's missing, delete what's surplus. Returns a failure result, or `undefined`
     * when everything saved.
     */
    private async reconcileContributions(
        score: mjBizAppsSonarScoreEntity,
        result: ScoreResult,
        ctx: PersistContext,
        contextUser: UserInfo,
    ): Promise<RecordResult | undefined> {
        const md = new Metadata();
        const existing = ctx.contributions.get(score.ID) ?? [];
        const plan = planContributions(existing.length, result.contributions.length);
        let i = 0;

        for (const c of result.contributions) {
            const row =
                existing[i++] ??
                (await md.GetEntityObject<mjBizAppsSonarScoreFactorContributionEntity>(
                    "MJ_BizApps_Sonar: Score Factor Contributions",
                    contextUser,
                ));
            if (!row.IsSaved) {
                row.NewRecord();
                row.ScoreID = score.ID;
            }
            row.ModelFactorID = c.modelFactorId;
            row.FactorID = c.factorId;
            row.RawValue = c.rawValue;
            row.NormalizedValue = c.normalizedContribution;
            row.WeightedContribution = c.weightedValue;
            // PercentOfTotal is 0/null when the member had no data for the factor — see the trap
            // documented in scoring/factorDrag.ts before reasoning about "why" off this column.
            row.PercentOfTotal = percentOfTotal(c.weightedValue, result.rawScore);
            row.HadData = c.hadData;
            row.MissingDataApplied = c.missingDataApplied;
            row.DetailJSON = encodeContributionDetail(c.explanation);
            if (!(await row.Save())) {
                return this.failed(`Contribution (score ${score.ID})`, row.LatestResult?.CompleteMessage);
            }
        }

        // Surplus rows from a previous version with more factors than the current one.
        for (const stale of existing.slice(existing.length - plan.Delete)) {
            if (!(await stale.Delete())) {
                return this.failed(`Contribution delete (score ${score.ID})`, stale.LatestResult?.CompleteMessage);
            }
        }
        return undefined;
    }

    private failed(what: string, message: string | undefined): RecordResult {
        return { Status: "Failed", ErrorMessage: `${what}: ${message ?? "unknown error"}` };
    }

    /**
     * The empty-population case: remove this model's Scores and their contributions. Contributions
     * go first — they are the only FK onto Score and it is NO_ACTION, so the reverse order violates
     * it. Per-record, like everything else here.
     */
    private async clearModel(model: mjBizAppsSonarScoreModelEntity, contextUser: UserInfo): Promise<void> {
        const [scores, contributions] = await Promise.all([
            this.loadExistingScores(model, contextUser),
            this.loadExistingContributions(model, contextUser),
        ]);
        for (const rows of contributions.values()) {
            for (const row of rows) await row.Delete();
        }
        for (const score of scores.values()) await score.Delete();
    }

    /** Current Score rows for this model, keyed by AnchorRecordID (for find-or-create). */
    private async loadExistingScores(
        model: mjBizAppsSonarScoreModelEntity,
        contextUser: UserInfo,
    ): Promise<Map<string, mjBizAppsSonarScoreEntity>> {
        const result = await new RunView().RunView<mjBizAppsSonarScoreEntity>(
            {
                EntityName: "MJ_BizApps_Sonar: Scores",
                ExtraFilter: `ScoreModelID='${model.ID}'`,
                ResultType: "entity_object",
                // MUST be IgnoreMaxRows. RunView's default cap would silently return a subset, every
                // missed anchor would be treated as new, and the insert would collide with the
                // existing row's unique key.
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

    /** Current contribution rows for this model, grouped by ScoreID. Same IgnoreMaxRows reasoning. */
    private async loadExistingContributions(
        model: mjBizAppsSonarScoreModelEntity,
        contextUser: UserInfo,
    ): Promise<Map<string, mjBizAppsSonarScoreFactorContributionEntity[]>> {
        const md = new Metadata();
        const score = md.EntityByName("MJ_BizApps_Sonar: Scores");
        if (!score) throw new Error("ScorePersister: could not resolve the Scores entity.");

        const result = await new RunView().RunView<mjBizAppsSonarScoreFactorContributionEntity>(
            {
                EntityName: "MJ_BizApps_Sonar: Score Factor Contributions",
                ExtraFilter:
                    `ScoreID IN (SELECT ID FROM [${score.SchemaName}].[${score.BaseTable}] ` +
                    `WHERE ScoreModelID='${model.ID}')`,
                ResultType: "entity_object",
                IgnoreMaxRows: true,
            },
            contextUser,
        );
        const byScore = new Map<string, mjBizAppsSonarScoreFactorContributionEntity[]>();
        for (const row of result.Success ? (result.Results ?? []) : []) {
            const list = byScore.get(row.ScoreID);
            if (list) list.push(row);
            else byScore.set(row.ScoreID, [row]);
        }
        return byScore;
    }

    /**
     * The trend baseline per anchor: the most recent ScoreHistory snapshot at/before `cutoff`, so
     * Delta = now − "the score ~TrendWindowDays ago". Anchors with no history that old get no
     * baseline → null Delta/Trend ("not enough history yet").
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

    /** `asOf` minus N days — the trend-window cutoff date. */
    private subtractDays(asOf: Date, days: number): Date {
        return new Date(asOf.getTime() - days * 24 * 60 * 60 * 1000);
    }
}

/** Everything loaded once up front, shared by every record in the run. */
interface PersistContext {
    model: mjBizAppsSonarScoreModelEntity;
    versionId: string;
    asOf: Date;
    computedAt: Date;
    existing: Map<string, mjBizAppsSonarScoreEntity>;
    contributions: Map<string, mjBizAppsSonarScoreFactorContributionEntity[]>;
    baselines: Map<string, TrendBaseline> | null;
    keyJsonById: Map<string, string>;
}
