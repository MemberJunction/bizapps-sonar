import { Injectable } from "@angular/core";
import { CompositeKey, Metadata, RunView } from "@memberjunction/core";
import { mjBizAppsSonarScoreBandSetEntity, mjBizAppsSonarScoreBandEntity } from "@mj-biz-apps/sonar-entities";
import { sqlString } from "./sql.util";

const SCORE_BAND_SET = "MJ_BizApps_Sonar: Score Band Sets";
const SCORE_BAND = "MJ_BizApps_Sonar: Score Bands";

/** Fields for one band row (maps to ScoreBand). */
export interface BandInput {
    /** Present when updating an existing band; omit to create a new one. */
    id?: string;
    bandSetID: string;
    label: string;
    minScore: number;
    maxScore: number;
    severity: number;
    colorHex: string;
    isTerminal: boolean;
}

/**
 * Data access for Score Band Sets and their bands. A model references a set via
 * ScoreModel.BandSetID; at recompute the engine maps each score to the band whose
 * [MinScore, MaxScore] contains it.
 */
@Injectable({ providedIn: "root" })
export class ScoreBandService {
    private readonly md = new Metadata();

    /** All band sets (for the model's "pick a band set" dropdown). */
    public async listSets(): Promise<mjBizAppsSonarScoreBandSetEntity[]> {
        const result = await new RunView().RunView<mjBizAppsSonarScoreBandSetEntity>({
            EntityName: SCORE_BAND_SET,
            OrderBy: "Name ASC",
            ResultType: "entity_object",
        });
        return result.Success ? result.Results ?? [] : [];
    }

    /** Create or update a band set's identity (Name/Description). Returns the saved set. */
    public async saveSet(input: { id?: string; name: string; description?: string }): Promise<mjBizAppsSonarScoreBandSetEntity | null> {
        const set = input.id
            ? await this.md.GetEntityObject<mjBizAppsSonarScoreBandSetEntity>(SCORE_BAND_SET, CompositeKey.FromID(input.id))
            : await this.md.GetEntityObject<mjBizAppsSonarScoreBandSetEntity>(SCORE_BAND_SET);
        if (!input.id) set.NewRecord();
        set.Name = input.name;
        if (input.description !== undefined) set.Description = input.description;
        return (await set.Save()) ? set : null;
    }

    /** The bands in a set, low score to high. */
    public async getBands(bandSetID: string): Promise<mjBizAppsSonarScoreBandEntity[]> {
        const result = await new RunView().RunView<mjBizAppsSonarScoreBandEntity>({
            EntityName: SCORE_BAND,
            ExtraFilter: `BandSetID='${sqlString(bandSetID)}'`,
            OrderBy: "MinScore ASC",
            ResultType: "entity_object",
        });
        return result.Success ? result.Results ?? [] : [];
    }

    /** Create or update one band. */
    public async saveBand(input: BandInput): Promise<mjBizAppsSonarScoreBandEntity | null> {
        const band = input.id
            ? await this.md.GetEntityObject<mjBizAppsSonarScoreBandEntity>(SCORE_BAND, CompositeKey.FromID(input.id))
            : await this.md.GetEntityObject<mjBizAppsSonarScoreBandEntity>(SCORE_BAND);
        if (!input.id) band.NewRecord();
        band.BandSetID = input.bandSetID;
        band.Label = input.label;
        band.MinScore = input.minScore;
        band.MaxScore = input.maxScore;
        band.Severity = input.severity;
        band.ColorHex = input.colorHex;
        band.IsTerminal = input.isTerminal;
        return (await band.Save()) ? band : null;
    }

    /**
     * Update one band's label + score range — for in-context (popover) editing. Touches only those
     * fields, leaving color/severity/terminal intact.
     *
     * Returns the server's own reason on failure rather than a bare false. Band sets are SHARED
     * across models, so the most common rejection isn't a transient error at all: the backend blocks
     * the write when ANY model using this set is published (ScoreBandEntityServer /
     * isBandSetConfigWriteBlocked). Telling the user to "try again" for that would be a lie.
     */
    public async updateBand(
        bandId: string,
        label: string,
        minScore: number,
        maxScore: number,
    ): Promise<{ ok: boolean; error?: string }> {
        const band = await this.md.GetEntityObject<mjBizAppsSonarScoreBandEntity>(SCORE_BAND, CompositeKey.FromID(bandId));
        if (!band?.IsSaved) return { ok: false, error: "That band no longer exists." };
        band.Label = label;
        band.MinScore = minScore;
        band.MaxScore = maxScore;
        if (await band.Save()) return { ok: true };
        return { ok: false, error: band.LatestResult?.Message || undefined };
    }

    /**
     * Delete one band, returning the reason on failure.
     *
     * The common rejection isn't transient: Score.BandID has an FK to ScoreBand, so a band that any
     * computed score still points at cannot be removed until those scores move off it (a recompute
     * after reshaping the set). Callers need to distinguish that from a real error because it changes
     * the advice given to the user.
     */
    public async deleteBand(id: string): Promise<{ ok: boolean; error?: string }> {
        const band = await this.md.GetEntityObject<mjBizAppsSonarScoreBandEntity>(SCORE_BAND, CompositeKey.FromID(id));
        if (!band?.IsSaved) return { ok: false, error: "That band no longer exists." };
        if (await band.Delete()) return { ok: true };
        const raw = band.LatestResult?.Message ?? "";
        if (/FK_Score_Band|REFERENCE constraint/i.test(raw)) {
            return {
                ok: false,
                error: "Existing scores are still assigned to that band. Recompute the model after reshaping its bands, then delete it.",
            };
        }
        return { ok: false, error: raw || undefined };
    }
}
