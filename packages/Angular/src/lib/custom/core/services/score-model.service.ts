import { Injectable } from "@angular/core";
import { BaseEntity, CompositeKey, Metadata, RunView } from "@memberjunction/core";
import { sqlString } from "./sql.util";
import {
    mjBizAppsSonarScoreModelEntity,
    mjBizAppsSonarModelRelatedEntityEntity,
    mjBizAppsSonarFactorEntity,
    mjBizAppsSonarModelFactorEntity,
    mjBizAppsSonarScoreFactorContributionEntity,
    mjBizAppsSonarScoreModelVersionEntity,
} from "@mj-biz-apps/sonar-entities";

/** Entity names (the MJ logical names CodeGen assigned under __mj_BizAppsSonar). */
const SCORE_MODEL = "MJ_BizApps_Sonar: Score Models";
const MODEL_RELATED_ENTITY = "MJ_BizApps_Sonar: Model Related Entities";
const FACTOR = "MJ_BizApps_Sonar: Factors";
const MODEL_FACTOR = "MJ_BizApps_Sonar: Model Factors";
const CONTRIBUTION = "MJ_BizApps_Sonar: Score Factor Contributions";
const SCORE_MODEL_VERSION = "MJ_BizApps_Sonar: Score Model Versions";

/** The pieces of a ConfigSnapshotJSON the rollback re-applies (field bags from BaseEntity.GetAll()). */
interface SnapMRE { ID?: string; RelatedEntityID?: string; Alias?: string | null; RelationshipPath?: string | null; JoinType?: string | null; SourceSystemTag?: string | null; Description?: string | null; }
interface SnapFactor { ID?: string; Name?: string; Slug?: string | null; Description?: string | null; FactorType?: string; AnchorEntityID?: string; SourceRelatedEntityID?: string | null; SourceEntityID?: string | null; FilterExpression?: string | null; Aggregation?: string | null; AggregateFieldName?: string | null; TimeWindowID?: string | null; RecencyDecayHalfLifeDays?: number | null; NormalizationMethod?: string | null; NormalizationParamsJSON?: string | null; OutputMin?: number | null; OutputMax?: number | null; HigherIsBetter?: boolean | null; }
interface SnapModelFactor { FactorID?: string; Weight?: number | null; WeightMode?: string | null; ContributionCap?: number | null; ContributionFloor?: number | null; TrendWeight?: number | null; MissingDataPolicy?: string | null; IsRequired?: boolean | null; DisplayLabel?: string | null; DisplayOrder?: number | null; }
interface ConfigSnapshot { model?: { PopulationFilter?: string | null; CombineStrategy?: string | null }; relatedEntities?: SnapMRE[]; factors?: SnapFactor[]; modelFactors?: SnapModelFactor[]; }

/** Snapshot fields copied verbatim onto rows during rollback (keyof-typed so Set() stays type-safe).
 *  Excludes IDs + SourceRelatedEntityID (remapped) — those are handled explicitly. */
const MRE_FIELDS: readonly (keyof SnapMRE)[] = ["RelatedEntityID", "Alias", "RelationshipPath", "JoinType", "SourceSystemTag", "Description"];
const FACTOR_FIELDS: readonly (keyof SnapFactor)[] = ["Name", "Slug", "Description", "FactorType", "AnchorEntityID", "SourceEntityID", "FilterExpression", "Aggregation", "AggregateFieldName", "TimeWindowID", "RecencyDecayHalfLifeDays", "NormalizationMethod", "NormalizationParamsJSON", "OutputMin", "OutputMax", "HigherIsBetter"];
const BINDING_FIELDS: readonly (keyof SnapModelFactor)[] = ["Weight", "WeightMode", "ContributionCap", "ContributionFloor", "TrendWeight", "MissingDataPolicy", "IsRequired", "DisplayLabel", "DisplayOrder"];

/** Fields needed to create a draft model. AnchorEntityID is NOT NULL in the schema. */
export interface CreateModelInput { name: string; anchorEntityID: string; }
/** Fields needed to wire a data source (related entity) into a model. */
export interface AddDataSourceInput {
    modelId: string;
    relatedEntityID: string;
    alias: string;
    /** Explicit anchor→source FK path (RelationshipPath JSON), set when the user disambiguates a
     *  tie. Omit/"" → let the engine auto-resolve (direct FK or unique multi-hop). */
    relationshipPath?: string;
}

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

    /**
     * Unpublish a model back to Draft so its rubric can be edited again. Published models are
     * locked (their scores must stay reproducible against the current version); editing requires
     * dropping to Draft, making changes, then publishing a NEW version. This is a plain status
     * change (Draft is not a publish transition, so no snapshot is taken); the existing version
     * row + CurrentVersionID are left intact until the next publish supersedes them.
     */
    public async unpublishToDraft(modelId: string): Promise<boolean> {
        const model = await this.md.GetEntityObject<mjBizAppsSonarScoreModelEntity>(SCORE_MODEL, CompositeKey.FromID(modelId));
        if (!model?.IsSaved) return false;
        model.Status = "Draft";
        return model.Save();
    }

    /**
     * Roll a model back to a prior version's configuration. Rollback is modeled as a NEW forward
     * version (history stays intact): re-apply the target version's frozen config to the LIVE
     * rubric — because the engine scores from live config, not the snapshot — then publish, which
     * snapshots the restored config as a new current version labeled "Rollback of vN".
     *
     * Bands are intentionally left untouched (band sets can be shared across models). The re-apply
     * is a DIFF, not a teardown: factors present in both are updated in place (keeping their IDs and
     * existing contribution rows), missing ones are created, and only factors the target no longer
     * has are deleted (clearing just their contributions). So a small change costs a couple of row
     * updates, not thousands of deletes. Updated factors' scores are stale until the next recompute.
     */
    public async restoreVersion(modelId: string, versionId: string): Promise<{ ok: boolean; error?: string; newVersionNumber?: number }> {
        const version = await this.md.GetEntityObject<mjBizAppsSonarScoreModelVersionEntity>(SCORE_MODEL_VERSION, CompositeKey.FromID(versionId));
        if (!version?.IsSaved) return { ok: false, error: "Version not found." };
        const targetNumber = version.VersionNumber;
        let cfg: ConfigSnapshot;
        try {
            cfg = JSON.parse(version.ConfigSnapshotJSON ?? "") as ConfigSnapshot;
        } catch {
            return { ok: false, error: "That version's snapshot couldn't be read." };
        }

        // 1) Drop to Draft and re-apply the version's model-level scoring settings.
        const model = await this.md.GetEntityObject<mjBizAppsSonarScoreModelEntity>(SCORE_MODEL, CompositeKey.FromID(modelId));
        if (!model?.IsSaved) return { ok: false, error: "Model not found." };
        model.Status = "Draft";
        if (cfg.model) {
            model.PopulationFilter = cfg.model.PopulationFilter ?? null;
            if (cfg.model.CombineStrategy) model.Set("CombineStrategy", cfg.model.CombineStrategy);
        }
        if (!(await model.Save())) return { ok: false, error: "Couldn't open the model for rollback." };

        // 2) Reconcile the live rubric to the snapshot — apply only what differs.
        await this.reconcileRubric(modelId, cfg);

        // 3) Publish — the server hook snapshots the now-restored live config as a new version.
        const fresh = await this.md.GetEntityObject<mjBizAppsSonarScoreModelEntity>(SCORE_MODEL, CompositeKey.FromID(modelId));
        fresh.Status = "Active";
        if (!(await fresh.Save())) return { ok: false, error: fresh.LatestResult?.Message || "Publish of the restored version was blocked." };

        // 4) Label the new current version as a rollback.
        const nv = await this.md.GetEntityObject<mjBizAppsSonarScoreModelVersionEntity>(SCORE_MODEL_VERSION, CompositeKey.FromID(fresh.CurrentVersionID));
        if (nv?.IsSaved) {
            nv.VersionLabel = `Rollback of v${targetNumber}`;
            nv.Set("ChangeSummary", `Restored configuration from version ${targetNumber}.`);
            await nv.Save();
        }
        return { ok: true, newVersionNumber: nv?.VersionNumber };
    }

    /**
     * Reconcile the live rubric to a snapshot by applying ONLY the differences (the surgical
     * rollback). Matched factors (by name — IDs aren't stable across versions) are updated in place,
     * keeping their IDs + existing contribution rows; missing factors/sources are created; and only
     * factors absent from the snapshot are deleted (clearing just their own contributions). A small
     * change (e.g. one window) is a couple of row updates, not a mass delete.
     */
    private async reconcileRubric(modelId: string, cfg: ConfigSnapshot): Promise<void> {
        const liveMREs = await this.loadRows<mjBizAppsSonarModelRelatedEntityEntity>(MODEL_RELATED_ENTITY, `ScoreModelID='${modelId}'`);
        const liveFactors = await this.loadRows<mjBizAppsSonarFactorEntity>(FACTOR, `ScoreModelID='${modelId}'`);
        const liveBindings = await this.loadRows<mjBizAppsSonarModelFactorEntity>(MODEL_FACTOR, `ScoreModelID='${modelId}'`);
        const bindingByFactorId = new Map(liveBindings.map((b) => [b.FactorID, b]));

        // Data sources: match by the related entity they map; keep existing, create missing. Build a
        // snapshot-MRE-ID → live-MRE-ID map so factor source references resolve to live rows.
        const liveMreByEntity = new Map(liveMREs.map((m) => [m.RelatedEntityID, m]));
        const snapMreIdToLive = new Map<string, string>();
        const keptEntityIds = new Set<string>();
        for (const sm of cfg.relatedEntities ?? []) {
            if (!sm.RelatedEntityID) continue;
            keptEntityIds.add(sm.RelatedEntityID);
            let live = liveMreByEntity.get(sm.RelatedEntityID);
            if (!live) {
                live = await this.md.GetEntityObject<mjBizAppsSonarModelRelatedEntityEntity>(MODEL_RELATED_ENTITY);
                live.NewRecord();
                live.ScoreModelID = modelId;
                for (const k of MRE_FIELDS) { const v = sm[k]; if (v != null) live.Set(k, v); }
                if (!(await live.Save())) continue;
                liveMreByEntity.set(sm.RelatedEntityID, live);
            }
            if (sm.ID) snapMreIdToLive.set(sm.ID, live.ID);
        }

        // Factors: match by name → update in place (keeps ID + contributions); else create.
        const liveFactorByName = new Map(liveFactors.map((f) => [f.Name, f]));
        const snapFactorNames = new Set<string>();
        const snapBindingByFactorId = new Map((cfg.modelFactors ?? []).map((mf) => [mf.FactorID, mf]));
        for (const sf of cfg.factors ?? []) {
            if (sf.Name) snapFactorNames.add(sf.Name);
            let factor = sf.Name ? liveFactorByName.get(sf.Name) : undefined;
            if (!factor) {
                factor = await this.md.GetEntityObject<mjBizAppsSonarFactorEntity>(FACTOR);
                factor.NewRecord();
                factor.ScoreModelID = modelId;
            }
            for (const k of FACTOR_FIELDS) { const v = sf[k]; if (v != null) factor.Set(k, v); }
            factor.SourceRelatedEntityID = sf.SourceRelatedEntityID ? snapMreIdToLive.get(sf.SourceRelatedEntityID) ?? null : null;
            if (!(await factor.Save())) continue;

            // Binding: update this factor's existing ModelFactor, or create it.
            let binding = bindingByFactorId.get(factor.ID);
            if (!binding) {
                binding = await this.md.GetEntityObject<mjBizAppsSonarModelFactorEntity>(MODEL_FACTOR);
                binding.NewRecord();
                binding.ScoreModelID = modelId;
                binding.FactorID = factor.ID;
            }
            const snapBinding = sf.ID ? snapBindingByFactorId.get(sf.ID) : undefined;
            if (snapBinding) for (const k of BINDING_FIELDS) { const v = snapBinding[k]; if (v != null) binding.Set(k, v); }
            await binding.Save();
        }

        // Remove live factors the snapshot no longer has (and only THEIR contributions).
        for (const lf of liveFactors) {
            if (snapFactorNames.has(lf.Name)) continue;
            const binding = bindingByFactorId.get(lf.ID);
            if (binding) {
                await this.deleteRows<mjBizAppsSonarScoreFactorContributionEntity>(CONTRIBUTION, `ModelFactorID='${binding.ID}'`);
                await binding.Delete();
            }
            await lf.Delete();
        }
        // Remove data sources the snapshot no longer references (after their factors are gone).
        for (const lm of liveMREs) {
            if (!keptEntityIds.has(lm.RelatedEntityID)) await lm.Delete();
        }
    }

    /** Load all rows of an entity matching a filter (entity objects, uncapped). */
    private async loadRows<T extends BaseEntity>(entityName: string, extraFilter: string): Promise<T[]> {
        const result = await new RunView().RunView<T>({ EntityName: entityName, ExtraFilter: extraFilter, ResultType: "entity_object", IgnoreMaxRows: true });
        return result.Success ? result.Results ?? [] : [];
    }

    /** Delete all rows of an entity matching a filter. */
    private async deleteRows<T extends BaseEntity>(entityName: string, extraFilter: string): Promise<void> {
        for (const row of await this.loadRows<T>(entityName, extraFilter)) await row.Delete();
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
            ExtraFilter: `ScoreModelID='${sqlString(modelId)}'`,
            OrderBy: "Alias ASC",
            ResultType: "entity_object",
        });
        return result.Success ? result.Results ?? [] : [];
    }

    /** Wire a related entity into a model (default Left join). */
    public async addDataSource(input: AddDataSourceInput): Promise<mjBizAppsSonarModelRelatedEntityEntity | null> {
        const ds = await this.md.GetEntityObject<mjBizAppsSonarModelRelatedEntityEntity>(MODEL_RELATED_ENTITY);
        ds.NewRecord();
        ds.ScoreModelID = input.modelId;
        ds.RelatedEntityID = input.relatedEntityID;
        ds.Alias = input.alias;
        ds.JoinType = "Left";
        // RelationshipPath: an explicit anchor→source path when the user disambiguated a tie
        // (several FK routes existed); otherwise "[]" = let the engine resolve it (a direct FK, or
        // a unique auto-resolved multi-hop path via findAutoPathHops).
        ds.RelationshipPath = input.relationshipPath && input.relationshipPath.length > 0
            ? input.relationshipPath
            : "[]";
        return (await ds.Save()) ? ds : null;
    }

    /** Set a wired source's explicit anchor→source FK path (RelationshipPath JSON) — used when the
     *  user disambiguates a tie. ""/"[]" reverts to engine auto-resolution. */
    public async setSourcePath(modelRelatedEntityId: string, relationshipPath: string): Promise<boolean> {
        const ds = await this.md.GetEntityObject<mjBizAppsSonarModelRelatedEntityEntity>(MODEL_RELATED_ENTITY, CompositeKey.FromID(modelRelatedEntityId));
        if (!ds?.IsSaved) return false;
        ds.RelationshipPath = relationshipPath && relationshipPath.length > 0 ? relationshipPath : "[]";
        return ds.Save();
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
