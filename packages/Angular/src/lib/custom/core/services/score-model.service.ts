import { Injectable } from "@angular/core";
import { CompositeKey, Metadata, RunView } from "@memberjunction/core";
import { mjBizAppsSonarScoreModelEntity, mjBizAppsSonarModelRelatedEntityEntity } from "@mj-biz-apps/sonar-entities";

/** Entity names (the MJ logical names CodeGen assigned under __mj_BizAppsSonar). */
const SCORE_MODEL = "MJ_BizApps_Sonar: Score Models";
const MODEL_RELATED_ENTITY = "MJ_BizApps_Sonar: Model Related Entities";

/** Fields needed to create a draft model. AnchorEntityID is NOT NULL in the schema. */
export interface CreateModelInput { name: string; anchorEntityID: string; }
/** Fields needed to wire a data source (related entity) into a model. */
export interface AddDataSourceInput { modelId: string; relatedEntityID: string; alias: string; }

/**
 * Data access for Score Models and their wired-in data sources (Model Related Entities).
 * Real persistence through MJ: reads via RunView, writes via GetEntityObject + Save.
 * Client-side, so no contextUser is passed — the provider knows the logged-in user.
 */
@Injectable({ providedIn: "root" })
export class ScoreModelService {
    private readonly md = new Metadata();

    /** All models, newest first (entity objects so callers can edit + save them). */
    public async list(): Promise<mjBizAppsSonarScoreModelEntity[]> {
        const result = await new RunView().RunView<mjBizAppsSonarScoreModelEntity>({
            EntityName: SCORE_MODEL,
            OrderBy: "__mj_CreatedAt DESC",
            ResultType: "entity_object",
        });
        return result.Success ? result.Results ?? [] : [];
    }

    /** Load one model by ID (or null if not found). */
    public async get(id: string): Promise<mjBizAppsSonarScoreModelEntity | null> {
        const model = await this.md.GetEntityObject<mjBizAppsSonarScoreModelEntity>(SCORE_MODEL, CompositeKey.FromID(id));
        return model?.IsSaved ? model : null;
    }

    /** Create a Draft model. Slug is derived from the name (Slug is UQ + NOT NULL). */
    public async create(input: CreateModelInput): Promise<mjBizAppsSonarScoreModelEntity | null> {
        const model = await this.md.GetEntityObject<mjBizAppsSonarScoreModelEntity>(SCORE_MODEL);
        model.NewRecord();
        model.Name = input.name;
        model.Slug = this.slugify(input.name);
        model.Status = "Draft";
        model.AnchorEntityID = input.anchorEntityID;
        return (await model.Save()) ? model : null;
    }

    /**
     * Publish a model: flip Status → 'Active' and Save(). The server-side ScoreModelEntityServer
     * hook validates publishability (ValidateAsync) and snapshots an immutable ScoreModelVersion.
     * On a blocked publish, Save() fails and the validation message comes back in LatestResult.
     */
    public async publish(modelId: string): Promise<{ ok: boolean; error?: string }> {
        const model = await this.md.GetEntityObject<mjBizAppsSonarScoreModelEntity>(SCORE_MODEL, CompositeKey.FromID(modelId));
        if (!model?.IsSaved) return { ok: false, error: "Model not found." };
        model.Status = "Active";
        const ok = await model.Save();
        return ok ? { ok: true } : { ok: false, error: model.LatestResult?.Message || "Publish was blocked — the model isn't scoreable yet." };
    }

    /** Point a model at a band set (ScoreModel.BandSetID). Returns true on save. */
    public async setBandSet(modelId: string, bandSetID: string): Promise<boolean> {
        const model = await this.md.GetEntityObject<mjBizAppsSonarScoreModelEntity>(SCORE_MODEL, CompositeKey.FromID(modelId));
        if (!model?.IsSaved) return false;
        model.BandSetID = bandSetID;
        return model.Save();
    }

    /** Persist the population filter (ScoreModel.PopulationFilter) — a CompositeFilterDescriptor
     *  JSON string, or null to clear it (score the whole anchor entity). Returns true on save. */
    public async setPopulationFilter(modelId: string, filterJson: string | null): Promise<boolean> {
        const model = await this.md.GetEntityObject<mjBizAppsSonarScoreModelEntity>(SCORE_MODEL, CompositeKey.FromID(modelId));
        if (!model?.IsSaved) return false;
        model.PopulationFilter = filterJson;
        return model.Save();
    }

    /** The data sources (related entities) wired into a model. */
    public async dataSources(modelId: string): Promise<mjBizAppsSonarModelRelatedEntityEntity[]> {
        const result = await new RunView().RunView<mjBizAppsSonarModelRelatedEntityEntity>({
            EntityName: MODEL_RELATED_ENTITY,
            ExtraFilter: `ScoreModelID='${modelId}'`,
            OrderBy: "Alias ASC",
            ResultType: "entity_object",
        });
        return result.Success ? result.Results ?? [] : [];
    }

    /** Wire a related entity into a model (default Left join, the engine's single-hop case). */
    public async addDataSource(input: AddDataSourceInput): Promise<mjBizAppsSonarModelRelatedEntityEntity | null> {
        const ds = await this.md.GetEntityObject<mjBizAppsSonarModelRelatedEntityEntity>(MODEL_RELATED_ENTITY);
        ds.NewRecord();
        ds.ScoreModelID = input.modelId;
        ds.RelatedEntityID = input.relatedEntityID;
        ds.Alias = input.alias;
        ds.JoinType = "Left";
        // RelationshipPath is NOT NULL. For v1 single-hop sources the engine resolves the
        // direct FK itself, so an empty path is valid. TODO wire: derive the real traversal
        // from MJ relationship metadata for multi-hop sources (Phase 2+).
        ds.RelationshipPath = "[]";
        return (await ds.Save()) ? ds : null;
    }

    /** Remove a wired-in data source. */
    public async removeDataSource(id: string): Promise<boolean> {
        const ds = await this.md.GetEntityObject<mjBizAppsSonarModelRelatedEntityEntity>(MODEL_RELATED_ENTITY, CompositeKey.FromID(id));
        return ds?.IsSaved ? ds.Delete() : false;
    }

    /** "Renewal Risk" -> "renewal-risk". Slugs key cross-references, so keep them clean. */
    private slugify(name: string): string {
        return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }
}
