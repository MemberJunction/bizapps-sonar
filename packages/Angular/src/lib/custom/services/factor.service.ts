import { Injectable } from "@angular/core";
import { CompositeKey, Metadata, RunView } from "@memberjunction/core";
import { mjBizAppsSonarFactorEntity, mjBizAppsSonarModelFactorEntity } from "@mj-biz-apps/sonar-entities";

const FACTOR = "MJ_BizApps_Sonar: Factors";
const MODEL_FACTOR = "MJ_BizApps_Sonar: Model Factors";

/** Engine-supported v1 values (confirmed against sonar_engine: factorSql / NormalizationEngine). */
export type Aggregation = "Count" | "Sum" | "Avg" | "Min" | "Max" | "DistinctCount";
export type NormalizationMethod = "None" | "MinMax";
/** How a factor's weight combines in the rubric. */
export type WeightMode = "Additive" | "Penalty";

/** Fields to create a Declarative factor. AggregateFieldName is omitted for Count. */
export interface CreateFactorInput {
    name: string;
    anchorEntityID: string;
    scoreModelID: string;
    sourceRelatedEntityID: string;
    aggregation: Aggregation;
    aggregateFieldName?: string;
    /** CompositeFilterDescriptor serialized to JSON, or null for "include everything". */
    filterExpression?: string;
    timeWindowID?: string;
    normalizationMethod: NormalizationMethod;
    higherIsBetter: boolean;
}

/**
 * Data access for Factors (the signals) and their bindings into a model's rubric
 * (Model Factors). Declarative factors only in v1 — FactorType is pinned to 'Declarative'.
 */
@Injectable({ providedIn: "root" })
export class FactorService {
    private readonly md = new Metadata();

    /** The rubric: Model Factor rows bound into a model (entity objects, editable). */
    public async listForModel(modelId: string): Promise<mjBizAppsSonarModelFactorEntity[]> {
        const result = await new RunView().RunView<mjBizAppsSonarModelFactorEntity>({
            EntityName: MODEL_FACTOR,
            ExtraFilter: `ScoreModelID='${modelId}'`,
            OrderBy: "DisplayOrder ASC",
            ResultType: "entity_object",
        });
        return result.Success ? result.Results ?? [] : [];
    }

    /** Create a Declarative factor row (not yet bound to a model's rubric). */
    public async create(input: CreateFactorInput): Promise<mjBizAppsSonarFactorEntity | null> {
        const factor = await this.md.GetEntityObject<mjBizAppsSonarFactorEntity>(FACTOR);
        factor.NewRecord();
        factor.Name = input.name;
        factor.Slug = this.slugify(input.name);
        factor.FactorType = "Declarative";
        factor.AnchorEntityID = input.anchorEntityID;
        factor.ScoreModelID = input.scoreModelID;
        factor.SourceRelatedEntityID = input.sourceRelatedEntityID;
        factor.Aggregation = input.aggregation;
        if (input.aggregateFieldName) factor.AggregateFieldName = input.aggregateFieldName;
        if (input.filterExpression) factor.FilterExpression = input.filterExpression;
        if (input.timeWindowID) factor.TimeWindowID = input.timeWindowID;
        factor.NormalizationMethod = input.normalizationMethod;
        factor.HigherIsBetter = input.higherIsBetter;
        return (await factor.Save()) ? factor : null;
    }

    /** Bind an existing factor into a model's rubric with a weight + mode. */
    public async bindToModel(modelId: string, factorId: string, weight: number, weightMode: WeightMode): Promise<mjBizAppsSonarModelFactorEntity | null> {
        const mf = await this.md.GetEntityObject<mjBizAppsSonarModelFactorEntity>(MODEL_FACTOR);
        mf.NewRecord();
        mf.ScoreModelID = modelId;
        mf.FactorID = factorId;
        mf.Weight = weight;
        mf.WeightMode = weightMode;
        return (await mf.Save()) ? mf : null;
    }

    /**
     * Create a factor and bind it into the model's rubric in one call.
     * TODO atomic: wrap both saves in a Metadata TransactionGroup so a failed bind rolls
     * back the factor. Two-step for now (acceptable for the scaffold).
     */
    public async createAndBind(input: CreateFactorInput, weight: number, weightMode: WeightMode): Promise<boolean> {
        const factor = await this.create(input);
        if (!factor) return false;
        const binding = await this.bindToModel(input.scoreModelID, factor.ID, weight, weightMode);
        return binding !== null;
    }

    /** Remove a factor from a model's rubric (deletes the binding, not the factor). */
    public async unbind(modelFactorId: string): Promise<boolean> {
        const mf = await this.md.GetEntityObject<mjBizAppsSonarModelFactorEntity>(MODEL_FACTOR, CompositeKey.FromID(modelFactorId));
        return mf?.IsSaved ? mf.Delete() : false;
    }

    private slugify(name: string): string {
        return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }
}
