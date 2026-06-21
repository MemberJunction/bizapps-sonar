import { Injectable } from "@angular/core";
import { Metadata, RunView } from "@memberjunction/core";
import {
    mjBizAppsSonarScoreEntity,
    mjBizAppsSonarScoreBandEntity,
    mjBizAppsSonarScoreFactorContributionEntity,
    mjBizAppsSonarFactorEntity,
} from "@mj-biz-apps/sonar-entities";

const SCORE = "MJ_BizApps_Sonar: Scores";
const SCORE_BAND = "MJ_BizApps_Sonar: Score Bands";
const CONTRIBUTION = "MJ_BizApps_Sonar: Score Factor Contributions";
const FACTOR = "MJ_BizApps_Sonar: Factors";

/** Band identity used for color coding across every Sonar surface. */
export type BandKey = "healthy" | "watch" | "atrisk" | "critical";

/** One slice of a model's persisted band distribution. */
export interface BandSlice { bandId: string | null; label: string; key: BandKey; count: number; pct: number; }
/** A scored anchor record (a persisted Score row), with its display name + band resolved. */
export interface ScoredMember {
    scoreId: string;
    anchorRecordId: string;
    name: string;
    normalizedScore: number;
    bandLabel: string;
    bandKey: BandKey;
    computedAt: Date | null;
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
            return { bandId: bandId || null, label, key: this.bandKey(label), count, pct: Math.round((count / total) * 100) };
        });
        slices.sort((a, b) => b.count - a.count);
        return { slices, total };
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

        const bandById = await this.loadBands(scores);
        const names = await this.resolveAnchorNames(scores);
        const members = scores.map((s) => {
            const label = s.BandID ? bandById.get(s.BandID)?.Label ?? "Unbanded" : "Unbanded";
            return {
                scoreId: s.ID,
                anchorRecordId: s.AnchorRecordID,
                name: names.get(s.AnchorRecordID) ?? s.AnchorRecordID,
                normalizedScore: Math.round(s.NormalizedScore ?? 0),
                bandLabel: label,
                bandKey: this.bandKey(label),
                computedAt: s.ComputedAt ?? null,
            } satisfies ScoredMember;
        });
        return { members, total };
    }

    /** A single score's contribution breakdown (factor name + weighted value), largest first. */
    public async contributionsForScore(scoreId: string): Promise<ScoreContribution[]> {
        const result = await new RunView().RunView<mjBizAppsSonarScoreFactorContributionEntity>({
            EntityName: CONTRIBUTION,
            ExtraFilter: `ScoreID='${scoreId}'`,
            ResultType: "entity_object",
        });
        const rows = result.Success ? result.Results ?? [] : [];
        if (rows.length === 0) return [];

        const factorIds = [...new Set(rows.map((r) => `'${r.FactorID}'`))].join(",");
        const factorsResult = await new RunView().RunView<mjBizAppsSonarFactorEntity>({
            EntityName: FACTOR,
            ExtraFilter: `ID IN (${factorIds})`,
            ResultType: "entity_object",
        });
        const nameById = new Map((factorsResult.Results ?? []).map((f) => [f.ID, f.Name]));

        const round = (n: number): number => Math.round(n * 100) / 100;
        return rows
            .map((r) => ({
                label: nameById.get(r.FactorID) ?? "Signal",
                rawValue: r.RawValue ?? 0,
                normalizedValue: round(r.NormalizedValue ?? 0),
                weightedValue: round(r.WeightedContribution ?? 0),
                percentOfTotal: r.PercentOfTotal ?? 0,
                hadData: r.HadData ?? false,
            }))
            .sort((a, b) => Math.abs(b.weightedValue) - Math.abs(a.weightedValue));
    }

    /** ALL Score rows for a model (uncapped) — the band distribution is a whole-population
     *  aggregate, so it must see every row, not the first 1000. Scale path: a server-side
     *  count-per-band aggregate instead of transferring every row just to count it. */
    private async loadAllScores(modelId: string): Promise<mjBizAppsSonarScoreEntity[]> {
        const result = await new RunView().RunView<mjBizAppsSonarScoreEntity>({
            EntityName: SCORE,
            ExtraFilter: `ScoreModelID='${modelId}'`,
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
        const parts = [`ScoreModelID='${modelId}'`];
        if (opts.anchorRecordId) parts.push(`AnchorRecordID='${opts.anchorRecordId}'`);
        if (opts.bandId !== undefined) parts.push(opts.bandId === null || opts.bandId === "" ? "BandID IS NULL" : `BandID='${opts.bandId}'`);
        if (opts.minScore != null) parts.push(`NormalizedScore >= ${opts.minScore}`);
        if (opts.maxScore != null) parts.push(`NormalizedScore <= ${opts.maxScore}`);
        if (opts.anchorIds) parts.push(opts.anchorIds.length ? `AnchorRecordID IN (${opts.anchorIds.map((id) => `'${id}'`).join(",")})` : "1=0");
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
        const tokens = query.split(/\s+/).filter(Boolean).map((t) => t.replace(/'/g, "''"));
        if (tokens.length === 0) return "1=1";
        return tokens.map((tok) => `(${cols.map((c) => `${c} LIKE '%${tok}%'`).join(" OR ")})`).join(" AND ");
    }

    /** Band rows referenced by a set of scores, keyed by ID (for label lookup). */
    private async loadBands(scores: mjBizAppsSonarScoreEntity[]): Promise<Map<string, mjBizAppsSonarScoreBandEntity>> {
        const ids = [...new Set(scores.map((s) => s.BandID).filter((id): id is string => !!id))];
        if (ids.length === 0) return new Map();
        const result = await new RunView().RunView<mjBizAppsSonarScoreBandEntity>({
            EntityName: SCORE_BAND,
            ExtraFilter: `ID IN (${ids.map((id) => `'${id}'`).join(",")})`,
            ResultType: "entity_object",
        });
        return new Map((result.Results ?? []).map((b) => [b.ID, b]));
    }

    /** Batch-resolve anchor display names for a set of scores (single RunView, IN clause). */
    private async resolveAnchorNames(scores: mjBizAppsSonarScoreEntity[]): Promise<Map<string, string>> {
        const anchorEntityId = scores[0]?.AnchorEntityID;
        const ent = anchorEntityId ? new Metadata().Entities.find((e) => e.ID === anchorEntityId) : null;
        if (!ent) return new Map();

        const pk = ent.PrimaryKeys[0]?.Name ?? "ID";
        const ids = [...new Set(scores.map((s) => s.AnchorRecordID))].map((id) => `'${id}'`).join(",");
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

    /** Best display name for an anchor row: its name field, else FirstName+LastName, else Name/Email/PK. */
    private composeName(row: Record<string, unknown>, nameField: string | null, pk: string): string {
        const pick = (k: string): string | null => { const v = row[k]; return v != null && v !== "" ? String(v) : null; };
        const composed = [pick("FirstName"), pick("LastName")].filter(Boolean).join(" ");
        return (nameField ? pick(nameField) : null) || composed || pick("Name") || pick("Email") || String(row[pk]);
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
        const ids = [...byId.keys()].map((id) => `'${id}'`).join(",");
        const scoreRes = await new RunView().RunView<mjBizAppsSonarScoreEntity>({
            EntityName: SCORE,
            ExtraFilter: `ScoreModelID='${modelId}' AND AnchorRecordID IN (${ids})`,
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
                bandKey: this.bandKey(label),
            } satisfies MemberSuggestion;
        });
    }

    /** Map an arbitrary band label to a color key. */
    private bandKey(label: string): BandKey {
        const l = label.toLowerCase();
        if (l.includes("healthy")) return "healthy";
        if (l.includes("critical")) return "critical";
        if (l.includes("risk")) return "atrisk";
        return "watch";
    }
}
