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
        const scores = await this.loadScores(modelId);
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
     * The model's scored members as presentation-ready rows, ordered by score ascending
     * (lowest first — the triage order). `limit` caps the rows resolved (default 100).
     */
    public async membersForModel(modelId: string, limit = 100): Promise<ScoredMember[]> {
        const scores = await this.loadScores(modelId, limit);
        if (scores.length === 0) return [];

        const bandById = await this.loadBands(scores);
        const names = await this.resolveAnchorNames(scores);
        return scores.map((s) => {
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

    /** Current Score rows for a model, ordered lowest-score-first (triage order). */
    private async loadScores(modelId: string, limit?: number): Promise<mjBizAppsSonarScoreEntity[]> {
        const result = await new RunView().RunView<mjBizAppsSonarScoreEntity>({
            EntityName: SCORE,
            ExtraFilter: `ScoreModelID='${modelId}'`,
            OrderBy: "NormalizedScore ASC",
            MaxRows: limit,
            ResultType: "entity_object",
        });
        return result.Success ? result.Results ?? [] : [];
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
        const nameField = ent.Fields.find((f) => f.IsNameField)?.Name;
        const names = new Map<string, string>();
        for (const row of result.Success ? result.Results ?? [] : []) {
            const pick = (k: string): string | null => { const v = row[k]; return v != null && v !== "" ? String(v) : null; };
            const composed = [pick("FirstName"), pick("LastName")].filter(Boolean).join(" ");
            const display = (nameField ? pick(nameField) : null) || composed || pick("Name") || pick("Email") || String(row[pk]);
            names.set(String(row[pk]), display);
        }
        return names;
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
