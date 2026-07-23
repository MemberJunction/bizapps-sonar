import { Injectable } from "@angular/core";
import { Metadata, RunQuery, RunView } from "@memberjunction/core";
import { sqlString } from "./sql.util";
import {
    mjBizAppsSonarScoreEntity,
    mjBizAppsSonarScoreBandEntity,
    mjBizAppsSonarScoreFactorContributionEntity,
    mjBizAppsSonarScoreHistoryEntity,
    mjBizAppsSonarScoreModelVersionEntity,
    mjBizAppsSonarFactorEntity,
} from "@mj-biz-apps/sonar-entities";

const SCORE = "MJ_BizApps_Sonar: Scores";
const SCORE_BAND = "MJ_BizApps_Sonar: Score Bands";
const CONTRIBUTION = "MJ_BizApps_Sonar: Score Factor Contributions";
const SCORE_HISTORY = "MJ_BizApps_Sonar: Score Histories";
const SCORE_MODEL_VERSION = "MJ_BizApps_Sonar: Score Model Versions";
const FACTOR = "MJ_BizApps_Sonar: Factors";

/** Trend of a score vs. its previous recompute (mirrors Score.TrendDirection). */
export type TrendDirection = "Up" | "Flat" | "Down";

/** Band identity used for color coding across every Sonar surface. */
export type BandKey = "healthy" | "watch" | "atrisk" | "critical";

/** Map an arbitrary band label to a color key (label-only fallback when no severity context exists). */
export function bandKey(label: string): BandKey {
    const l = label.toLowerCase();
    if (l.includes("healthy")) return "healthy";
    if (l.includes("critical")) return "critical";
    if (l.includes("risk")) return "atrisk";
    return "watch";
}

/** Rank-based color key — preferred over bandKey() whenever severity context is available.
 *  Pass the target band's severity and the full set of severities in the band set.
 *  Lowest severity rank → healthy (green); highest → critical (red). */
export function bandKeyFromSeverity(targetSeverity: number, allSeverities: number[]): BandKey {
    const SCALE: readonly BandKey[] = ["healthy", "watch", "atrisk", "critical"];
    const sorted = [...new Set(allSeverities)].sort((a, b) => a - b);
    const rank = sorted.indexOf(targetSeverity);
    if (rank < 0) return bandKey("");
    const idx = sorted.length <= 1 ? 0 : Math.round((rank / (sorted.length - 1)) * 3);
    return SCALE[Math.min(idx, 3)] as BandKey;
}

/** One slice of a model's persisted band distribution. */
export interface BandSlice { bandId: string | null; label: string; key: BandKey; count: number; pct: number; }
/** Population band distribution at one point in time — one per distinct AsOfDate in ScoreHistory.
 *  Drives the Overview engagement-trend chart (band mix over recomputes). */
export interface BandTrendPoint { asOf: Date; counts: Record<BandKey, number>; total: number; }
/** A cohort that changed band between two recompute snapshots (e.g. 12 members Watch → At Risk).
 *  `worse` = the move is toward the unhealthy end (drives red-vs-green treatment everywhere). */
export interface BandFlow { fromKey: BandKey; fromLabel: string; toKey: BandKey; toLabel: string; count: number; worse: boolean; }
/**
 * The Overview's trend read: band mix per snapshot day, aggregated SERVER-SIDE by the stored
 * "Sonar: Band Trend" query — the browser receives days × bands rows, never the raw history.
 * `days` (sorted yyyy-MM-dd keys, oldest → newest) index 1:1 into `points` and are the valid
 * inputs to {@link ScoreReadService.flowsBetween} / `moversBetween`.
 */
export interface OverviewTrend { points: BandTrendPoint[]; days: string[]; }
/** Full history object returned by overviewHistoryForModel — trend + raw byDay map for flows/movers. */
export interface OverviewHistory { points: BandTrendPoint[]; days: string[]; byDay: Map<string, { asOf: Date; members: Map<string, { key: BandKey; label: string; score: number }> }> }
/** One row of a window-based movers list (score change between two snapshots). */
export interface WindowMover { anchorRecordId: string; delta: number; score: number; bandKey: BandKey; bandLabel: string; }

/** Severity order for band keys (healthy end → critical end) — used to decide whether a band
 *  change is a decline or a recovery. */
const BAND_SEVERITY: Record<BandKey, number> = { healthy: 0, watch: 1, atrisk: 2, critical: 3 };
/** A scored anchor record (a persisted Score row), with its display name + band resolved. */
export interface ScoredMember {
    scoreId: string;
    anchorRecordId: string;
    name: string;
    normalizedScore: number;
    bandLabel: string;
    bandKey: BandKey;
    computedAt: Date | null;
    /** Change in normalized score since the previous recompute (rounded); null on first scoring. */
    delta: number | null;
    /** Up/Flat/Down vs. the previous recompute; null on first scoring. */
    trendDirection: TrendDirection | null;
    /** The model version that produced this score (null if unresolved) — for the "scored by vN" badge. */
    versionNumber: number | null;
}

/** One point in a member's score history — drives the drill-down sparkline. */
export interface ScoreHistoryPoint {
    computedAt: Date;
    asOf: Date | null;
    normalizedScore: number;
    bandLabel: string;
    bandKey: BandKey;
}
/** One line of a score's "why" breakdown — the full raw → normalized → weighted chain, so the
 *  math is traceable (a ScoreFactorContribution joined to its factor). */
export interface ScoreContribution {
    label: string;
    rawValue: number;
    /** The factor's 0–1 value after normalization. */
    normalizedValue: number;
    /** weight × normalizedValue — what this factor added to the raw score. */
    weightedValue: number;
    /** Share of the score this factor accounts for (0–1). */
    percentOfTotal: number;
    hadData: boolean;
    /** The factor's human "why" for this member (e.g. an LLM factor's reason), from the
     *  contribution's DetailJSON. Null when the factor recorded no reason. */
    explanation: string | null;
}

/** Filter / sort / paging options for the triage list (all server-side). */
export interface MemberQueryOpts {
    page?: number;
    pageSize?: number;
    /** Band filter: undefined = all bands; null/'' = unbanded; otherwise a band ID. */
    bandId?: string | null;
    /** Inclusive score bounds (0–100); null = unbounded on that end. */
    minScore?: number | null;
    maxScore?: number | null;
    /** Member-name substring search (cross-entity — needs anchorEntityId to resolve). */
    nameQuery?: string;
    /** The model's anchor entity ID — required to resolve a nameQuery. */
    anchorEntityId?: string;
    /** Pin to ONE exact anchor record (overrides nameQuery) — used when picking a suggestion. */
    anchorRecordId?: string;
    /** Score sort: 'asc' (worst-first, the triage default) or 'desc' (best-first). */
    sortDir?: "asc" | "desc";
}

/** A rich autosuggest hit — enough to disambiguate same-named members and pick the exact one. */
export interface MemberSuggestion {
    anchorRecordId: string;
    scoreId: string;
    name: string;
    /** A secondary distinguisher (e.g. email), or null. */
    secondary: string | null;
    normalizedScore: number;
    bandLabel: string;
    bandKey: BandKey;
}

/**
 * Read access to PERSISTED scores (written by the Recompute Action via ScoreWriter). Distinct
 * from {@link SonarEngineService}'s live preview, which computes without persisting. Powers the
 * Overview distribution, the Engagement Manager triage list, and the per-member explainability
 * drawer. Resolves band labels + anchor display names so callers get presentation-ready rows.
 */
interface MemberSnapshot { key: BandKey; label: string; score: number; }
interface DaySnapshot { asOf: Date; members: Map<string, MemberSnapshot>; }

@Injectable({ providedIn: "root" })
export class ScoreReadService {
    /** Persisted band distribution for a model (counts per band + percentages). */
    public async distributionForModel(modelId: string): Promise<{ slices: BandSlice[]; total: number }> {
        const scores = await this.loadAllScores(modelId);
        if (scores.length === 0) return { slices: [], total: 0 };

        const bandById = await this.loadBands(scores);
        const counts = new Map<string, number>();
        for (const s of scores) counts.set(s.BandID ?? "", (counts.get(s.BandID ?? "") ?? 0) + 1);

        const total = scores.length;
        const slices: BandSlice[] = [...counts.entries()].map(([bandId, count]) => {
            const label = bandId ? bandById.get(bandId)?.Label ?? "Unbanded" : "Unbanded";
            return { bandId: bandId || null, label, key: this.keyFromBandMap(bandId || null, bandById), count, pct: Math.round((count / total) * 100) };
        });
        slices.sort((a, b) => b.count - a.count);
        return { slices, total };
    }

    /**
     * The Overview's band-mix trend, aggregated by the stored "Sonar: Band Trend" query — SQL
     * dedupes per member per day (a same-day re-run writes twice; the later row wins) and the
     * browser receives days × bands rows, never the raw history. Points cap at `maxPoints`;
     * `days` keeps the full range so long look-back windows still have a baseline.
     */
    public async overviewTrendForModel(modelId: string, maxPoints = 12): Promise<OverviewTrend> {
        interface TrendRow { SnapshotDay: string; BandID: string | null; BandLabel: string; MemberCount: number; }
        const rows = await this.runSonarQuery<TrendRow>("Sonar: Band Trend", { ModelID: modelId });
        if (rows.length === 0) return { points: [], days: [] };
        const bandById = await this.loadBandsByIds(rows.map((r) => r.BandID));

        const byDay = new Map<string, BandTrendPoint>();
        for (const r of rows) {
            const point = byDay.get(r.SnapshotDay) ?? { asOf: this.parseDay(r.SnapshotDay), counts: this.emptyCounts(), total: 0 };
            point.counts[this.keyFromBandMap(r.BandID, bandById)] += Number(r.MemberCount);
            point.total += Number(r.MemberCount);
            byDay.set(r.SnapshotDay, point);
        }
        const days = [...byDay.keys()].sort();
        return { days, points: days.slice(-maxPoints).map((d) => byDay.get(d)!) };
    }

    /** Band-change cohorts between two snapshot days, biggest first — aggregated by the stored
     *  "Sonar: Band Flows" query (one row per from→to pair, not per member). Members present at
     *  only one of the two days aren't a band CHANGE, so SQL skips them. */
    public async flowsBetween(modelId: string, fromDay: string, toDay: string): Promise<BandFlow[]> {
        interface FlowRow { FromBandID: string | null; FromBand: string; ToBandID: string | null; ToBand: string; MemberCount: number; }
        const rows = await this.runSonarQuery<FlowRow>("Sonar: Band Flows", { ModelID: modelId, FromDay: fromDay, ToDay: toDay });
        if (rows.length === 0) return [];
        const bandById = await this.loadBandsByIds(rows.flatMap((r) => [r.FromBandID, r.ToBandID]));
        return rows.map((r) => {
            const fromKey = this.keyFromBandMap(r.FromBandID, bandById);
            const toKey = this.keyFromBandMap(r.ToBandID, bandById);
            // Worse = moved toward higher severity. Compare real band severities when both bands
            // resolve; fall back to color-key rank for unbanded ends.
            const fromSev = r.FromBandID ? bandById.get(r.FromBandID)?.Severity : undefined;
            const toSev = r.ToBandID ? bandById.get(r.ToBandID)?.Severity : undefined;
            const worse = fromSev != null && toSev != null ? toSev > fromSev : BAND_SEVERITY[toKey] > BAND_SEVERITY[fromKey];
            return { fromKey, fromLabel: r.FromBand, toKey, toLabel: r.ToBand, count: Number(r.MemberCount), worse } satisfies BandFlow;
        });
    }

    /** Biggest score movers between two snapshot days: top `limit` risers and fallers by signed
     *  score change, via the stored "Sonar: Score Movers" query. Derived from history snapshots,
     *  so it works for any look-back window and doesn't depend on the stored Score.Delta (which
     *  a no-op re-run resets to zero). */
    public async moversBetween(
        modelId: string,
        fromDay: string,
        toDay: string,
        limit: number,
    ): Promise<{ risers: WindowMover[]; fallers: WindowMover[] }> {
        interface MoverRow { AnchorRecordID: string; Delta: number; CurrentScore: number; BandID: string | null; BandLabel: string; Direction: "riser" | "faller"; }
        const rows = await this.runSonarQuery<MoverRow>("Sonar: Score Movers", { ModelID: modelId, FromDay: fromDay, ToDay: toDay, MaxEach: limit });
        if (rows.length === 0) return { risers: [], fallers: [] };
        const bandById = await this.loadBandsByIds(rows.map((r) => r.BandID));
        const toMover = (r: MoverRow): WindowMover => ({
            anchorRecordId: r.AnchorRecordID,
            delta: Number(r.Delta),
            score: Number(r.CurrentScore),
            bandKey: this.keyFromBandMap(r.BandID, bandById),
            bandLabel: r.BandLabel,
        });
        // Rows arrive Delta DESC; fallers re-sort ascending so the biggest drop leads its column.
        return {
            risers: rows.filter((r) => r.Direction === "riser").map(toMover),
            fallers: rows.filter((r) => r.Direction === "faller").map(toMover).sort((a, b) => a.delta - b.delta),
        };
    }

    /** Run one of the stored Sonar queries (seeded from metadata/queries) and return its rows.
     *  Failures log and return [] — the Overview degrades to its empty states, never throws. */
    private async runSonarQuery<T>(queryName: string, parameters: Record<string, string | number>): Promise<T[]> {
        const result = await new RunQuery().RunQuery({ QueryName: queryName, Parameters: parameters });
        if (!result.Success) {
            console.error(`ScoreReadService: query "${queryName}" failed: ${result.ErrorMessage ?? "unknown"}`);
            return [];
        }
        return (result.Results ?? []) as T[];
    }

    /** A yyyy-MM-dd day key → local Date (avoids the UTC shift `new Date(string)` would apply). */
    private parseDay(day: string): Date {
        const [y, m, d] = day.split("-").map(Number);
        return new Date(y, (m ?? 1) - 1, d ?? 1);
    }

    /** Display names for a set of anchor records (single RunView, IN clause) — for lists built
     *  from history snapshots, which only carry IDs. */
    public async namesForAnchors(anchorEntityId: string, anchorRecordIds: string[]): Promise<Map<string, string>> {
        const ent = new Metadata().Entities.find((e) => e.ID === anchorEntityId);
        if (!ent || anchorRecordIds.length === 0) return new Map();
        const pk = ent.PrimaryKeys[0]?.Name ?? "ID";
        const ids = [...new Set(anchorRecordIds)].map((id) => `'${sqlString(id)}'`).join(",");
        const result = await new RunView().RunView<Record<string, unknown>>({
            EntityName: ent.Name,
            ExtraFilter: `${pk} IN (${ids})`,
            ResultType: "simple",
        });
        const nameField = ent.Fields.find((f) => f.IsNameField)?.Name ?? null;
        const names = new Map<string, string>();
        for (const row of result.Success ? result.Results ?? [] : []) {
            names.set(String(row[pk]), this.composeName(row, nameField, pk));
        }
        return names;
    }

    private emptyCounts(): Record<BandKey, number> {
        return { healthy: 0, watch: 0, atrisk: 0, critical: 0 };
    }

    /** Derive a band's CSS color key from its severity rank within the full band set.
     *  Uses the same rank→SCALE mapping as the band builder, so colors stay in sync. */
    private keyFromBandMap(bandId: string | null, bandById: Map<string, mjBizAppsSonarScoreBandEntity>): BandKey {
        const SCALE: readonly BandKey[] = ["healthy", "watch", "atrisk", "critical"];
        if (!bandId) return "watch";
        const band = bandById.get(bandId);
        if (!band) return "watch";
        const sorted = [...bandById.values()].sort((a, b) => a.Severity - b.Severity);
        const rank = sorted.findIndex((b) => b.ID === bandId);
        if (rank < 0) return "watch";
        const idx = sorted.length <= 1 ? 0 : Math.round((rank / (sorted.length - 1)) * 3);
        return SCALE[Math.min(idx, 3)] as BandKey;
    }

    /**
     * A PAGE of the model's scored members, ordered by score ascending (lowest first — triage
     * order), optionally filtered to one band. Server-side paginated (StartRow/MaxRows): returns
     * the page rows plus the total match count, so the caller renders "X–Y of N" without loading
     * the whole population into the browser.
     */
    public async membersForModel(
        modelId: string,
        opts: MemberQueryOpts = {},
    ): Promise<{ members: ScoredMember[]; total: number }> {
        const pageSize = opts.pageSize ?? 50;
        const page = Math.max(0, opts.page ?? 0);
        // Name search is cross-entity: resolve matching anchor IDs first, then constrain the
        // score query to them. No matches → empty result (skip the score query entirely).
        let anchorIds: string[] | undefined;
        const query = opts.nameQuery?.trim();
        if (!opts.anchorRecordId && query && opts.anchorEntityId) {
            anchorIds = await this.resolveAnchorIdsByName(opts.anchorEntityId, query);
            if (anchorIds.length === 0) return { members: [], total: 0 };
        }
        const result = await new RunView().RunView<mjBizAppsSonarScoreEntity>({
            EntityName: SCORE,
            ExtraFilter: this.buildScoreFilter(modelId, { bandId: opts.bandId, minScore: opts.minScore, maxScore: opts.maxScore, anchorIds, anchorRecordId: opts.anchorRecordId }),
            OrderBy: `NormalizedScore ${opts.sortDir === "desc" ? "DESC" : "ASC"}`,
            StartRow: page * pageSize,
            MaxRows: pageSize,
            ResultType: "entity_object",
        });
        const scores = result.Success ? result.Results ?? [] : [];
        const total = result.TotalRowCount ?? scores.length;
        if (scores.length === 0) return { members: [], total };
        return { members: await this.toScoredMembers(scores), total };
    }

    /**
     * ALL members matching the triage filters, uncapped and unpaged — backs the cohort export, which
     * must include every filtered row, not just the visible page. Same filter/sort path as
     * {@link membersForModel} (band tile, score range, name search/pin), minus pagination.
     */
    public async allMembersForModel(modelId: string, opts: MemberQueryOpts = {}): Promise<ScoredMember[]> {
        let anchorIds: string[] | undefined;
        const query = opts.nameQuery?.trim();
        if (!opts.anchorRecordId && query && opts.anchorEntityId) {
            anchorIds = await this.resolveAnchorIdsByName(opts.anchorEntityId, query);
            if (anchorIds.length === 0) return [];
        }
        const result = await new RunView().RunView<mjBizAppsSonarScoreEntity>({
            EntityName: SCORE,
            ExtraFilter: this.buildScoreFilter(modelId, { bandId: opts.bandId, minScore: opts.minScore, maxScore: opts.maxScore, anchorIds, anchorRecordId: opts.anchorRecordId }),
            OrderBy: `NormalizedScore ${opts.sortDir === "desc" ? "DESC" : "ASC"}`,
            ResultType: "entity_object",
            IgnoreMaxRows: true,
        });
        const scores = result.Success ? result.Results ?? [] : [];
        return scores.length ? this.toScoredMembers(scores) : [];
    }

    /**
     * The biggest movers since the previous recompute, split into risers (score went up) and
     * fallers (down). Reads `Score.Delta` (set by ScoreWriter), so it's two small top-N queries —
     * no full-population scan. Members scored only once (Delta null) are excluded by `Delta <>/> 0`.
     */
    public async moversForModel(modelId: string, limit = 5): Promise<{ risers: ScoredMember[]; fallers: ScoredMember[] }> {
        const [risers, fallers] = await Promise.all([
            this.queryMovers(modelId, "desc", limit),
            this.queryMovers(modelId, "asc", limit),
        ]);
        return { risers, fallers };
    }

    /** Headline counts for the Movers view: how many dropped, climbed, and crossed a band on the
     *  last run. Three cheap counts (Delta is scannable). */
    public async moverSummary(modelId: string): Promise<{ dropped: number; climbed: number; crossed: number }> {
        const m = `ScoreModelID='${sqlString(modelId)}'`;
        const count = async (extra: string): Promise<number> => {
            const r = await new RunView().RunView({ EntityName: SCORE, ExtraFilter: `${m} AND ${extra}`, Fields: ["ID"], IgnoreMaxRows: true, ResultType: "simple" });
            return r.Success ? (r.Results?.length ?? 0) : 0;
        };
        const [dropped, climbed, crossed] = await Promise.all([
            count("Delta < 0"),
            count("Delta > 0"),
            count("PreviousBandID IS NOT NULL AND PreviousBandID <> BandID"),
        ]);
        return { dropped, climbed, crossed };
    }

    /** Members matching a mover SEGMENT FILTER (delta bounds / band / crossed-a-band). Mirrors the
     *  engine's SegmentEvaluator conditions EXACTLY, so the list a user sees == who a launch on the
     *  same filter targets. `direction` only sets the sort; the delta bound does the selecting. */
    public async moverMembers(
        modelId: string,
        filter: { bandId?: string | null; minScore?: number | null; maxScore?: number | null; minDelta?: number | null; maxDelta?: number | null; crossedBandOnly?: boolean | null },
        direction: "drops" | "gains",
        limit = 50,
    ): Promise<ScoredMember[]> {
        const conds = [`ScoreModelID='${sqlString(modelId)}'`];
        if (filter.bandId) conds.push(`BandID='${sqlString(filter.bandId)}'`);
        if (filter.minScore != null && Number.isFinite(filter.minScore)) conds.push(`NormalizedScore >= ${Number(filter.minScore)}`);
        if (filter.maxScore != null && Number.isFinite(filter.maxScore)) conds.push(`NormalizedScore <= ${Number(filter.maxScore)}`);
        if (filter.minDelta != null && Number.isFinite(filter.minDelta)) conds.push(`Delta >= ${Number(filter.minDelta)}`);
        if (filter.maxDelta != null && Number.isFinite(filter.maxDelta)) conds.push(`Delta <= ${Number(filter.maxDelta)}`);
        if (filter.crossedBandOnly) conds.push(`PreviousBandID IS NOT NULL AND PreviousBandID <> BandID`);
        const result = await new RunView().RunView<mjBizAppsSonarScoreEntity>({
            EntityName: SCORE,
            ExtraFilter: conds.join(" AND "),
            OrderBy: `Delta ${direction === "gains" ? "DESC" : "ASC"}`,
            MaxRows: limit,
            ResultType: "entity_object",
        });
        const scores = result.Success ? result.Results ?? [] : [];
        return this.toScoredMembers(scores);
    }

    /** Top-N scores by signed delta: 'desc' = biggest gains (Delta > 0), 'asc' = biggest drops (< 0). */
    private async queryMovers(modelId: string, dir: "asc" | "desc", limit: number): Promise<ScoredMember[]> {
        const result = await new RunView().RunView<mjBizAppsSonarScoreEntity>({
            EntityName: SCORE,
            ExtraFilter: `ScoreModelID='${sqlString(modelId)}' AND Delta ${dir === "desc" ? "> 0" : "< 0"}`,
            OrderBy: `Delta ${dir === "desc" ? "DESC" : "ASC"}`,
            MaxRows: limit,
            ResultType: "entity_object",
        });
        const scores = result.Success ? result.Results ?? [] : [];
        return this.toScoredMembers(scores);
    }

    /**
     * A member's score history for the sparkline — every persisted ScoreHistory snapshot for this
     * model+anchor, oldest first. Uncapped: a sparkline needs the whole series, and per-member it's
     * one row per recompute (small).
     */
    public async historyForMember(modelId: string, anchorRecordId: string): Promise<ScoreHistoryPoint[]> {
        const result = await new RunView().RunView<mjBizAppsSonarScoreHistoryEntity>({
            EntityName: SCORE_HISTORY,
            ExtraFilter: `ScoreModelID='${sqlString(modelId)}' AND AnchorRecordID='${sqlString(anchorRecordId)}'`,
            // Order by the business "as of" date (the trajectory's time axis), then ComputedAt to
            // break ties — a backfill writes several rows at the same wall-clock but distinct AsOf.
            OrderBy: "AsOfDate ASC, ComputedAt ASC",
            ResultType: "entity_object",
            IgnoreMaxRows: true,
        });
        const rows = result.Success ? result.Results ?? [] : [];
        if (rows.length === 0) return [];
        const bandById = await this.loadBandsByIds(rows.map((r) => r.BandID));
        return rows.map((r) => {
            const label = r.BandID ? bandById.get(r.BandID)?.Label ?? "Unbanded" : "Unbanded";
            return {
                computedAt: r.ComputedAt,
                asOf: r.AsOfDate ?? null,
                normalizedScore: Math.round(r.NormalizedScore ?? 0),
                bandLabel: label,
                bandKey: this.keyFromBandMap(r.BandID ?? null, bandById),
            } satisfies ScoreHistoryPoint;
        });
    }

    /** Resolve bands + anchor names for a set of scores and map them to presentation-ready rows. */
    private async toScoredMembers(scores: mjBizAppsSonarScoreEntity[]): Promise<ScoredMember[]> {
        if (scores.length === 0) return [];
        const bandById = await this.loadBands(scores);
        const names = await this.resolveAnchorNames(scores);
        const versionById = await this.loadVersionNumbers(scores);
        return scores.map((s) => {
            const label = s.BandID ? bandById.get(s.BandID)?.Label ?? "Unbanded" : "Unbanded";
            return {
                scoreId: s.ID,
                anchorRecordId: s.AnchorRecordID,
                name: names.get(s.AnchorRecordID) ?? s.AnchorRecordID,
                normalizedScore: Math.round(s.NormalizedScore ?? 0),
                bandLabel: label,
                bandKey: this.keyFromBandMap(s.BandID ?? null, bandById),
                computedAt: s.ComputedAt ?? null,
                delta: s.Delta != null ? Math.round(s.Delta) : null,
                trendDirection: s.TrendDirection ?? null,
                versionNumber: s.ScoreModelVersionID ? versionById.get(s.ScoreModelVersionID) ?? null : null,
            } satisfies ScoredMember;
        });
    }

    /** The version number for one version ID (the model's current version) — to compare against
     *  each member's scored-by version and flag stale scores. */
    public async versionNumberFor(versionId: string | null): Promise<number | null> {
        if (!versionId) return null;
        const result = await new RunView().RunView<mjBizAppsSonarScoreModelVersionEntity>({
            EntityName: SCORE_MODEL_VERSION,
            ExtraFilter: `ID='${sqlString(versionId)}'`,
            ResultType: "entity_object",
        });
        const v = result.Success ? result.Results?.[0] : null;
        return v ? v.VersionNumber : null;
    }

    /** Map the ScoreModelVersionIDs referenced by a set of scores to their version numbers
     *  (one RunView, IN clause) — powers the "scored by vN" badge. */
    private async loadVersionNumbers(scores: mjBizAppsSonarScoreEntity[]): Promise<Map<string, number>> {
        const ids = [...new Set(scores.map((s) => s.ScoreModelVersionID).filter((id): id is string => !!id))];
        if (ids.length === 0) return new Map();
        const result = await new RunView().RunView<mjBizAppsSonarScoreModelVersionEntity>({
            EntityName: SCORE_MODEL_VERSION,
            ExtraFilter: `ID IN (${ids.map((id) => `'${sqlString(id)}'`).join(",")})`,
            ResultType: "entity_object",
        });
        return new Map((result.Results ?? []).map((v) => [v.ID, v.VersionNumber]));
    }

    /** A single score's contribution breakdown (factor name + weighted value), largest first. */
    public async contributionsForScore(scoreId: string): Promise<ScoreContribution[]> {
        return (await this.contributionsForScores([scoreId])).get(scoreId) ?? [];
    }

    /**
     * Contribution breakdowns for MANY scores at once → `Map<scoreId, ScoreContribution[]>` (each
     * list largest-first). One batched contribution query per chunk of score IDs, plus one factor-name
     * lookup — no N+1. Backs the cohort export's per-signal "why" columns.
     */
    public async contributionsForScores(scoreIds: string[]): Promise<Map<string, ScoreContribution[]>> {
        const byScore = new Map<string, ScoreContribution[]>();
        if (scoreIds.length === 0) return byScore;

        const CHUNK = 200; // keep the IN(...) list well under SQL limits on large cohorts
        const rows: mjBizAppsSonarScoreFactorContributionEntity[] = [];
        for (let i = 0; i < scoreIds.length; i += CHUNK) {
            const ids = scoreIds.slice(i, i + CHUNK).map((id) => `'${sqlString(id)}'`).join(",");
            const res = await new RunView().RunView<mjBizAppsSonarScoreFactorContributionEntity>({
                EntityName: CONTRIBUTION,
                ExtraFilter: `ScoreID IN (${ids})`,
                ResultType: "entity_object",
                IgnoreMaxRows: true,
            });
            if (res.Success) rows.push(...(res.Results ?? []));
        }
        if (rows.length === 0) return byScore;

        const factorIds = [...new Set(rows.map((r) => `'${sqlString(r.FactorID)}'`))].join(",");
        const factorsResult = await new RunView().RunView<mjBizAppsSonarFactorEntity>({
            EntityName: FACTOR,
            ExtraFilter: `ID IN (${factorIds})`,
            ResultType: "entity_object",
        });
        const nameById = new Map((factorsResult.Results ?? []).map((f) => [f.ID, f.Name]));

        const round = (n: number): number => Math.round(n * 100) / 100;
        for (const r of rows) {
            const list = byScore.get(r.ScoreID) ?? [];
            list.push({
                label: nameById.get(r.FactorID) ?? "Signal",
                rawValue: r.RawValue ?? 0,
                normalizedValue: round(r.NormalizedValue ?? 0),
                weightedValue: round(r.WeightedContribution ?? 0),
                percentOfTotal: r.PercentOfTotal ?? 0,
                hadData: r.HadData ?? false,
                explanation: this.parseExplanation(r.DetailJSON),
            });
            byScore.set(r.ScoreID, list);
        }
        for (const list of byScore.values()) {
            list.sort((a, b) => Math.abs(b.weightedValue) - Math.abs(a.weightedValue));
        }
        return byScore;
    }

    /** Pull the human "why" out of a contribution's DetailJSON ({"explanation":"…"}); null if absent/malformed. */
    private parseExplanation(detailJSON: string | null): string | null {
        if (!detailJSON) return null;
        try {
            const parsed: unknown = JSON.parse(detailJSON);
            const why = (parsed as { explanation?: unknown })?.explanation;
            return typeof why === "string" && why.length > 0 ? why : null;
        } catch {
            return null;
        }
    }

    /** ALL Score rows for a model (uncapped) — the band distribution is a whole-population
     *  aggregate, so it must see every row, not the first 1000. Scale path: a server-side
     *  count-per-band aggregate instead of transferring every row just to count it. */
    private async loadAllScores(modelId: string): Promise<mjBizAppsSonarScoreEntity[]> {
        const result = await new RunView().RunView<mjBizAppsSonarScoreEntity>({
            EntityName: SCORE,
            ExtraFilter: `ScoreModelID='${sqlString(modelId)}'`,
            ResultType: "entity_object",
            IgnoreMaxRows: true,
        });
        return result.Success ? result.Results ?? [] : [];
    }

    /** Compose a Score ExtraFilter from the active triage filters (all AND-ed). bandId undefined →
     *  no band filter; null/'' → unbanded. anchorIds present-but-empty → match nothing (name
     *  search with no hits). */
    private buildScoreFilter(
        modelId: string,
        opts: { bandId?: string | null; minScore?: number | null; maxScore?: number | null; anchorIds?: string[]; anchorRecordId?: string },
    ): string {
        const parts = [`ScoreModelID='${sqlString(modelId)}'`];
        if (opts.anchorRecordId) parts.push(`AnchorRecordID='${sqlString(opts.anchorRecordId)}'`);
        if (opts.bandId !== undefined) parts.push(opts.bandId === null || opts.bandId === "" ? "BandID IS NULL" : `BandID='${sqlString(opts.bandId)}'`);
        if (opts.minScore != null) parts.push(`NormalizedScore >= ${opts.minScore}`);
        if (opts.maxScore != null) parts.push(`NormalizedScore <= ${opts.maxScore}`);
        if (opts.anchorIds) parts.push(opts.anchorIds.length ? `AnchorRecordID IN (${opts.anchorIds.map((id) => `'${sqlString(id)}'`).join(",")})` : "1=0");
        return parts.join(" AND ");
    }

    /** Resolve anchor record IDs whose name-ish columns match `query` (substring). Searches the
     *  anchor's name field + common name columns that actually exist on it. Capped at 500 matches
     *  (refine the search beyond that). */
    private async resolveAnchorIdsByName(anchorEntityId: string, query: string): Promise<string[]> {
        const ent = new Metadata().Entities.find((e) => e.ID === anchorEntityId);
        if (!ent) return [];
        const pk = ent.PrimaryKeys[0]?.Name ?? "ID";
        const cols = new Set(ent.Fields.map((f) => f.Name));
        const candidates = [ent.Fields.find((f) => f.IsNameField)?.Name, "FirstName", "LastName", "Email", "Name"]
            .filter((c): c is string => !!c && cols.has(c));
        const fields = [...new Set(candidates)];
        if (fields.length === 0) return [];
        const result = await new RunView().RunView<Record<string, unknown>>({
            EntityName: ent.Name,
            ExtraFilter: this.buildNameWhere(fields, query),
            Fields: [pk],
            MaxRows: 500,
            ResultType: "simple",
        });
        return result.Success ? (result.Results ?? []).map((r) => String(r[pk])) : [];
    }

    /** A WHERE over name columns: every whitespace token must appear in SOME column — so a
     *  multi-word query like "Eric Smith" matches FirstName='Eric' + LastName='Smith' (a single
     *  `col LIKE '%Eric Smith%'` never would). Quotes are escaped. */
    private buildNameWhere(cols: string[], query: string): string {
        const tokens = query.split(/\s+/).filter(Boolean).map((t) => sqlString(t));
        if (tokens.length === 0) return "1=1";
        return tokens.map((tok) => `(${cols.map((c) => `${c} LIKE '%${tok}%'`).join(" OR ")})`).join(" AND ");
    }

    /** Band rows referenced by a set of scores, keyed by ID (for label lookup). */
    private async loadBands(scores: mjBizAppsSonarScoreEntity[]): Promise<Map<string, mjBizAppsSonarScoreBandEntity>> {
        return this.loadBandsByIds(scores.map((s) => s.BandID));
    }

    /** Band rows for a set of (possibly null/duplicate) band IDs, keyed by ID.
     *  Expands to the full band set for each resolved band so rank-based color
     *  mapping always has the complete context (not just the bands present on the
     *  current page of scores). */
    private async loadBandsByIds(rawIds: (string | null)[]): Promise<Map<string, mjBizAppsSonarScoreBandEntity>> {
        const ids = [...new Set(rawIds.filter((id): id is string => !!id))];
        if (ids.length === 0) return new Map();
        const seedResult = await new RunView().RunView<mjBizAppsSonarScoreBandEntity>({
            EntityName: SCORE_BAND,
            ExtraFilter: `ID IN (${ids.map((id) => `'${sqlString(id)}'`).join(",")})`,
            ResultType: "entity_object",
        });
        const seedBands = seedResult.Results ?? [];
        const bandSetIds = [...new Set(seedBands.map((b) => b.BandSetID).filter(Boolean))];
        if (bandSetIds.length === 0) return new Map(seedBands.map((b) => [b.ID, b]));
        const fullResult = await new RunView().RunView<mjBizAppsSonarScoreBandEntity>({
            EntityName: SCORE_BAND,
            ExtraFilter: `BandSetID IN (${bandSetIds.map((id) => `'${sqlString(id)}'`).join(",")})`,
            ResultType: "entity_object",
        });
        return new Map((fullResult.Results ?? []).map((b) => [b.ID, b]));
    }

    /** Batch-resolve anchor display names for a set of scores (single RunView, IN clause). */
    private async resolveAnchorNames(scores: mjBizAppsSonarScoreEntity[]): Promise<Map<string, string>> {
        const anchorEntityId = scores[0]?.AnchorEntityID;
        const ent = anchorEntityId ? new Metadata().Entities.find((e) => e.ID === anchorEntityId) : null;
        if (!ent) return new Map();

        const pk = ent.PrimaryKeys[0]?.Name ?? "ID";
        const ids = [...new Set(scores.map((s) => s.AnchorRecordID))].map((id) => `'${sqlString(id)}'`).join(",");
        const result = await new RunView().RunView<Record<string, unknown>>({
            EntityName: ent.Name,
            ExtraFilter: `${pk} IN (${ids})`,
            ResultType: "simple",
        });
        const nameField = ent.Fields.find((f) => f.IsNameField)?.Name ?? null;
        const names = new Map<string, string>();
        for (const row of result.Success ? result.Results ?? [] : []) {
            names.set(String(row[pk]), this.composeName(row, nameField, pk));
        }
        return names;
    }

    /** Best display name for an anchor row: FirstName+LastName when both present, else nameField, else Name/Email/PK. */
    private composeName(row: Record<string, unknown>, nameField: string | null, pk: string): string {
        const pick = (k: string): string | null => { const v = row[k]; return v != null && v !== "" ? String(v) : null; };
        const firstName = pick("FirstName");
        const lastName = pick("LastName");
        if (firstName && lastName) return `${firstName} ${lastName}`;
        const named = nameField ? pick(nameField) : null;
        return named || firstName || lastName || pick("Name") || pick("Email") || String(row[pk]);
    }

    /** Up to `limit` SCORED members matching `query`, each with name + score + band so same-named
     *  members are distinguishable and a pick targets one exact record. Worst-first (triage order). */
    public async suggestMembers(modelId: string, anchorEntityId: string, query: string, limit = 8): Promise<MemberSuggestion[]> {
        const q = query.trim();
        if (q.length < 2) return [];
        const ent = new Metadata().Entities.find((e) => e.ID === anchorEntityId);
        if (!ent) return [];
        const pk = ent.PrimaryKeys[0]?.Name ?? "ID";
        const nameField = ent.Fields.find((f) => f.IsNameField)?.Name ?? null;
        const cols = new Set(ent.Fields.map((f) => f.Name));
        const hasEmail = cols.has("Email");
        const searchCols = [...new Set([nameField, "FirstName", "LastName", "Email", "Name"].filter((c): c is string => !!c && cols.has(c)))];
        if (searchCols.length === 0) return [];

        // 1) Anchor records matching the name (display name + email for disambiguation).
        const anchorRes = await new RunView().RunView<Record<string, unknown>>({
            EntityName: ent.Name,
            ExtraFilter: this.buildNameWhere(searchCols, q),
            Fields: [...new Set([pk, ...searchCols])],
            MaxRows: 50,
            ResultType: "simple",
        });
        const anchorRows = anchorRes.Success ? anchorRes.Results ?? [] : [];
        if (anchorRows.length === 0) return [];
        const byId = new Map(anchorRows.map((r) => [String(r[pk]), {
            name: this.composeName(r, nameField, pk),
            email: hasEmail && r["Email"] != null && r["Email"] !== "" ? String(r["Email"]) : null,
        }]));

        // 2) Their persisted scores for this model (worst-first, limited).
        const ids = [...byId.keys()].map((id) => `'${sqlString(id)}'`).join(",");
        const scoreRes = await new RunView().RunView<mjBizAppsSonarScoreEntity>({
            EntityName: SCORE,
            ExtraFilter: `ScoreModelID='${sqlString(modelId)}' AND AnchorRecordID IN (${ids})`,
            OrderBy: "NormalizedScore ASC",
            MaxRows: limit,
            ResultType: "entity_object",
        });
        const scores = scoreRes.Success ? scoreRes.Results ?? [] : [];
        if (scores.length === 0) return [];
        const bandById = await this.loadBands(scores);
        return scores.map((s) => {
            const a = byId.get(s.AnchorRecordID);
            const label = s.BandID ? bandById.get(s.BandID)?.Label ?? "Unbanded" : "Unbanded";
            return {
                anchorRecordId: s.AnchorRecordID,
                scoreId: s.ID,
                name: a?.name ?? s.AnchorRecordID,
                secondary: a?.email ?? null,
                normalizedScore: Math.round(s.NormalizedScore ?? 0),
                bandLabel: label,
                bandKey: this.keyFromBandMap(s.BandID ?? null, bandById),
            } satisfies MemberSuggestion;
        });
    }
}
