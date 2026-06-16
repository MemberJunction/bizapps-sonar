import { Injectable } from "@angular/core";
import { CompositeKey, Metadata, RunView } from "@memberjunction/core";
import { mjBizAppsSonarScoreBandSetEntity, mjBizAppsSonarScoreBandEntity } from "@mj-biz-apps/sonar-entities";

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

    /** The bands in a set, low score to high. */
    public async getBands(bandSetID: string): Promise<mjBizAppsSonarScoreBandEntity[]> {
        const result = await new RunView().RunView<mjBizAppsSonarScoreBandEntity>({
            EntityName: SCORE_BAND,
            ExtraFilter: `BandSetID='${bandSetID}'`,
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

    /** Delete one band. */
    public async deleteBand(id: string): Promise<boolean> {
        const band = await this.md.GetEntityObject<mjBizAppsSonarScoreBandEntity>(SCORE_BAND, CompositeKey.FromID(id));
        return band?.IsSaved ? band.Delete() : false;
    }
}
