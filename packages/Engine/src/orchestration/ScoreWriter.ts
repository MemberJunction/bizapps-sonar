import { uuidv4 } from "@memberjunction/global";
import { Metadata, RunView, UserInfo } from "@memberjunction/core";
import { SQLServerDataProvider } from "@memberjunction/sqlserver-dataprovider";
import {
    mjBizAppsSonarScoreModelEntity,
    mjBizAppsSonarScoreEntity,
    mjBizAppsSonarScoreHistoryEntity,
} from "@mj-biz-apps/sonar-entities";
import { ScoreResult } from "../scoring/ScoringEngine";
import { encodeContributionDetail } from "../scoring/contributionDetail";
import {
    TrendBaseline,
    computeDelta,
    dataCompleteness,
    detectBandTransition,
    latestBaselinePerAnchor,
    trendDirection,
} from "../scoring/scoreTrend";
import type { AnchorKey } from "../factors/anchorKey";

/** A SQL value we inline as a literal (no parameter binding — a bulk write has far more values than
 *  the ~2100 parameter cap allows, so we encode literals, escaping strictly). */
type SqlValue = string | number | boolean | Date | null | undefined;

/** Encode a value as an inline SQL literal. Strings are escaped (single quotes doubled) and
 *  N-prefixed for unicode safety; dates render as a datetime2 literal; booleans as bit; non-finite
 *  numbers and null/undefined as NULL. This is the ONLY injection guard on the bulk-write path (a
 *  bulk write far exceeds the ~2100 parameter cap, so values are inlined rather than bound), which
 *  makes it security-critical. Exported and unit-tested in __tests__/scoreWriterSql.test.ts. */
export function sqlLiteral(v: SqlValue): string {
    if (v === null || v === undefined) return "NULL";
    if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
    if (typeof v === "boolean") return v ? "1" : "0";
    if (v instanceof Date) return `'${v.toISOString().slice(0, 23)}'`; // 'YYYY-MM-DDTHH:mm:ss.SSS' datetime2, no tz suffix
    return `N'${v.replace(/'/g, "''")}'`;
}

/** Rows to persist for one run, pre-encoded as SQL VALUES tuples (built in memory, flushed set-based). */
interface StagedRows {
    /** Score tuples — DATA columns only (SCORE_COLS); the MERGE adds the __mj_ timestamps. */
    scores: string[];
    contributions: string[];
    history: string[];
    transitions: string[];
}

// Column orders for the bulk writes. Score is the MERGE's #stage shape (no __mj_ cols — the MERGE
// stamps those); the append tables carry __mj_CreatedAt/UpdatedAt in each tuple as SYSDATETIMEOFFSET().
const SCORE_COLS = "ID, ScoreModelID, ScoreModelVersionID, AnchorEntityID, AnchorRecordID, AnchorRecordKeyJSON, RawScore, NormalizedScore, BandID, PreviousNormalizedScore, PreviousBandID, Delta, TrendDirection, DataCompleteness, ComputedAt, AsOfDate, IsStale";
const CONTRIB_COLS = "ID, ScoreID, ModelFactorID, FactorID, RawValue, NormalizedValue, WeightedContribution, PercentOfTotal, HadData, MissingDataApplied, DetailJSON, __mj_CreatedAt, __mj_UpdatedAt";
const HISTORY_COLS = "ID, ScoreModelID, ScoreModelVersionID, AnchorEntityID, AnchorRecordID, NormalizedScore, BandID, AsOfDate, ComputedAt, DataCompleteness, ContributionsJSON, __mj_CreatedAt, __mj_UpdatedAt";
const TRANSITION_COLS = "ID, ScoreModelID, AnchorRecordID, FromBandID, ToBandID, Direction, OccurredAt, RecomputeRunID, Handled, __mj_CreatedAt, __mj_UpdatedAt";

/** Max VALUES tuples per INSERT — SQL Server caps the row-value constructor at 1000; stay well under. */
const INSERT_CHUNK = 500;

/** Progress sink for a persist pass: called with (members persisted so far, total to persist).
 *  Throttled by the writer — see PROGRESS_EVERY. Optional; the persist path is unaffected when omitted. */
export type ScoreWriteProgress = (processed: number, total: number) => void;

/**
 * Persists a run's computed scores. Each anchor's Score is upserted (one current row per
 * model+anchor, keyed by UQ_Score_ModelAnchorRecord), and its ScoreFactorContribution rows
 * are replaced.
 *
 * Set-based: the trend/delta/band-transition math runs in memory (fast), then the whole run is
 * flushed in a handful of statements — one MERGE for Scores (via a session #stage temp table) and
 * one batched INSERT each for contributions / history / transitions — instead of ~4 stored-proc
 * round-trips per member. That turns a 2k-member run from thousands of round-trips into a few.
 * Bypassing BaseEntity.Save() means no per-row Record-Changes versioning, which is fine for these
 * derived outputs (ScoreHistory is the audit trail). Deferred next step: diff-only writes (only
 * persist anchors whose score actually changed).
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

        // Trend baseline: Delta/Trend compare the new score to the snapshot ~TrendWindowDays ago
        // (a real "change over N days", not just "since last run"). When the model has no
        // TrendWindowDays, fall back to the immediately-prior score.
        const trendDays = model.TrendWindowDays;
        const baselines =
            trendDays != null && trendDays > 0
                ? await this.loadTrendBaselines(model, this.subtractDays(asOf, trendDays), contextUser)
                : null;

        // Phase 1 — build every row in memory (no DB). Fast; this is where the scoring math lives.
        const staged = this.buildStagedRows(model, versionId, scores, asOf, existing, baselines, keyJsonById, runId);

        // Phase 2 — flush the whole run in ONE transaction. The DELETE of old contributions, the
        // Score MERGE, and the three appends must be atomic. Without a transaction, a failure after
        // the DELETE but before the re-insert would wipe every scored member's explainability
        // breakdown with no rollback (blast radius = the whole population, not one row). SET
        // XACT_ABORT ON + TRY/CATCH rolls back cleanly and re-raises so the orchestrator marks the
        // run Failed with the database left untouched. All statements run in one batch (one pooled
        // connection), so the #stage temp table also survives across the statements within it.
        const body = [
            this.buildClearContributionsSql(),
            this.buildScoresSql(staged.scores),
            this.buildInsertsSql("MJ_BizApps_Sonar: Score Factor Contributions", CONTRIB_COLS, staged.contributions),
            this.buildInsertsSql("MJ_BizApps_Sonar: Score Histories", HISTORY_COLS, staged.history),
            this.buildInsertsSql("MJ_BizApps_Sonar: Score Band Transitions", TRANSITION_COLS, staged.transitions),
        ].filter((s) => s.length > 0).join("\n\n");

        const sql =
            "SET XACT_ABORT ON;\nBEGIN TRY\nBEGIN TRAN;\n\n" +
            body +
            "\n\nCOMMIT TRAN;\nEND TRY\nBEGIN CATCH\nIF @@TRANCOUNT > 0 ROLLBACK TRAN;\nTHROW;\nEND CATCH;";
        const provider = Metadata.Provider as SQLServerDataProvider;
        await provider.ExecuteSQL(sql, { modelId: model.ID }, undefined, contextUser);
        onProgress?.(scores.size, scores.size);
        return scores.size;
    }

    /** Build the SQL VALUES tuples for every table from the computed scores — the scoring math
     *  (delta/trend/band-transition) lives here, then everything is flushed set-based. */
    private buildStagedRows(
        model: mjBizAppsSonarScoreModelEntity,
        versionId: string,
        scores: Map<string, ScoreResult>,
        asOf: Date,
        existing: Map<string, mjBizAppsSonarScoreEntity>,
        baselines: Map<string, TrendBaseline> | null,
        keyJsonById: Map<string, string>,
        runId?: string,
    ): StagedRows {
        const computedAt = new Date();
        const staged: StagedRows = { scores: [], contributions: [], history: [], transitions: [] };

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

            // Reuse the existing row's ID on re-score (MERGE matches on the unique key and keeps it),
            // or mint one for a new anchor so its contributions can reference it before the flush.
            const scoreId = prior?.ID ?? uuidv4();
            const keyJson = keyJsonById.get(anchorRecordId) ?? null;
            const delta = computeDelta(result.normalizedScore, prevScore);
            const completeness = dataCompleteness(result.contributions);

            staged.scores.push(this.tuple([
                scoreId, model.ID, versionId, model.AnchorEntityID, anchorRecordId, keyJson,
                result.rawScore, result.normalizedScore, result.bandId, prevScore, prevBand, delta,
                trendDirection(delta), completeness, computedAt, asOf, false,
            ]));

            for (const c of result.contributions) {
                const pct = result.rawScore !== 0 ? c.weightedValue / result.rawScore : null;
                staged.contributions.push(this.tuple([
                    uuidv4(), scoreId, c.modelFactorId, c.factorId, c.rawValue, c.normalizedContribution,
                    c.weightedValue, pct, c.hadData, c.missingDataApplied, encodeContributionDetail(c.explanation),
                ], true));
            }

            staged.history.push(this.tuple([
                uuidv4(), model.ID, versionId, model.AnchorEntityID, anchorRecordId, result.normalizedScore,
                result.bandId, asOf, computedAt, completeness, JSON.stringify(result.contributions),
            ], true));

            // A band change is a transition measured run-over-run (vs the immediately-prior band),
            // independent of the trend window; its Direction comes from the run-over-run move.
            const lastRunDelta = prior ? computeDelta(result.normalizedScore, prior.NormalizedScore) : null;
            const transition = detectBandTransition(priorBand, result.bandId, !!prior, lastRunDelta);
            if (transition) {
                staged.transitions.push(this.tuple([
                    uuidv4(), model.ID, anchorRecordId, transition.fromBandId, transition.toBandId,
                    transition.direction, computedAt, runId ?? null, false,
                ], true));
            }
        }
        return staged;
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
     * SQL fragment that deletes this model's existing contribution rows (the "replace" half of
     * replace-contributions), keyed on @modelId (bound by write() at execution). Set-based: ONE
     * DELETE…JOIN that scales to any population. Emitted INSIDE the write transaction, so a later
     * failure rolls it back rather than leaving scores stripped of their contribution breakdown.
     */
    private buildClearContributionsSql(): string {
        const md = new Metadata();
        const contrib = md.Entities.find((e) => e.Name === "MJ_BizApps_Sonar: Score Factor Contributions");
        const score = md.Entities.find((e) => e.Name === "MJ_BizApps_Sonar: Scores");
        if (!contrib || !score) {
            throw new Error("ScoreWriter: could not resolve Score/Contribution entities for the contribution clear.");
        }
        return (
            `DELETE c FROM [${contrib.SchemaName}].[${contrib.BaseTable}] c ` +
            `INNER JOIN [${score.SchemaName}].[${score.BaseTable}] s ON s.ID = c.ScoreID ` +
            `WHERE s.ScoreModelID = @modelId;`
        );
    }

    /** Encode one row as a `(v1, v2, …)` SQL VALUES tuple. With `appendTimestamps`, adds the two
     *  __mj_ audit columns as SYSDATETIMEOFFSET() — the append tables carry them per row; the Score
     *  MERGE stamps its own, so its tuples pass appendTimestamps=false. */
    private tuple(values: SqlValue[], appendTimestamps = false): string {
        const cells = values.map((v) => sqlLiteral(v));
        if (appendTimestamps) cells.push("SYSDATETIMEOFFSET()", "SYSDATETIMEOFFSET()");
        return `(${cells.join(", ")})`;
    }

    /** SQL fragment that upserts every Score in one MERGE: stage into a session #tmp (chunked
     *  INSERTs, same batch so the temp survives), then MERGE on the model+anchor unique key so
     *  matched rows update in place (ID preserved) and new ones insert. Empty string when no rows. */
    private buildScoresSql(tuples: string[]): string {
        if (tuples.length === 0) return "";
        const target = this.tableRef("MJ_BizApps_Sonar: Scores");
        const inserts = this.chunk(tuples, INSERT_CHUNK)
            .map((c) => `INSERT INTO #stage (${SCORE_COLS}) VALUES ${c.join(",")};`)
            .join("\n");
        return `
CREATE TABLE #stage (
    ID uniqueidentifier, ScoreModelID uniqueidentifier, ScoreModelVersionID uniqueidentifier,
    AnchorEntityID uniqueidentifier, AnchorRecordID nvarchar(4000), AnchorRecordKeyJSON nvarchar(max),
    RawScore decimal(38,10), NormalizedScore decimal(38,10), BandID uniqueidentifier,
    PreviousNormalizedScore decimal(38,10), PreviousBandID uniqueidentifier, Delta decimal(38,10),
    TrendDirection nvarchar(50), DataCompleteness decimal(38,10), ComputedAt datetime2, AsOfDate datetime2, IsStale bit
);
${inserts}
MERGE ${target} AS t
USING #stage AS s ON t.ScoreModelID = s.ScoreModelID AND t.AnchorRecordID = s.AnchorRecordID
WHEN MATCHED THEN UPDATE SET
    t.ScoreModelVersionID = s.ScoreModelVersionID, t.AnchorEntityID = s.AnchorEntityID,
    t.AnchorRecordKeyJSON = s.AnchorRecordKeyJSON, t.RawScore = s.RawScore, t.NormalizedScore = s.NormalizedScore,
    t.BandID = s.BandID, t.PreviousNormalizedScore = s.PreviousNormalizedScore, t.PreviousBandID = s.PreviousBandID,
    t.Delta = s.Delta, t.TrendDirection = s.TrendDirection, t.DataCompleteness = s.DataCompleteness,
    t.ComputedAt = s.ComputedAt, t.AsOfDate = s.AsOfDate, t.IsStale = s.IsStale, t.__mj_UpdatedAt = SYSDATETIMEOFFSET()
WHEN NOT MATCHED THEN INSERT (${SCORE_COLS}, __mj_CreatedAt, __mj_UpdatedAt)
    VALUES (s.ID, s.ScoreModelID, s.ScoreModelVersionID, s.AnchorEntityID, s.AnchorRecordID, s.AnchorRecordKeyJSON,
        s.RawScore, s.NormalizedScore, s.BandID, s.PreviousNormalizedScore, s.PreviousBandID, s.Delta,
        s.TrendDirection, s.DataCompleteness, s.ComputedAt, s.AsOfDate, s.IsStale, SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET());
DROP TABLE #stage;`;
    }

    /** SQL fragment that bulk-inserts append-only rows (contributions / history / transitions) as
     *  chunked multi-row INSERTs. Empty string when there are no rows. */
    private buildInsertsSql(entityName: string, cols: string, tuples: string[]): string {
        if (tuples.length === 0) return "";
        const target = this.tableRef(entityName);
        return this.chunk(tuples, INSERT_CHUNK)
            .map((c) => `INSERT INTO ${target} (${cols}) VALUES ${c.join(",")};`)
            .join("\n");
    }

    /** `[schema].[table]` for an entity, resolved from MJ metadata (no hardcoded schema). */
    private tableRef(entityName: string): string {
        const e = new Metadata().Entities.find((x) => x.Name === entityName);
        if (!e) throw new Error(`ScoreWriter: entity '${entityName}' not found in metadata.`);
        return `[${e.SchemaName}].[${e.BaseTable}]`;
    }

    /** Split an array into fixed-size chunks. */
    private chunk<T>(items: T[], size: number): T[][] {
        const out: T[][] = [];
        for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
        return out;
    }
}
