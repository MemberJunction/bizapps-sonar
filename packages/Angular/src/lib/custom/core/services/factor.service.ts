import { Injectable } from "@angular/core";
import { CompositeKey, Metadata, RunView } from "@memberjunction/core";
import { mjBizAppsSonarFactorEntity, mjBizAppsSonarModelFactorEntity, mjBizAppsSonarScoreFactorContributionEntity } from "@mj-biz-apps/sonar-entities";

const FACTOR = "MJ_BizApps_Sonar: Factors";
const MODEL_FACTOR = "MJ_BizApps_Sonar: Model Factors";
const CONTRIBUTION = "MJ_BizApps_Sonar: Score Factor Contributions";

/** Engine-supported v1 values (confirmed against sonar_engine: factorSql / NormalizationEngine). */
export type Aggregation = "Count" | "Sum" | "Avg" | "Min" | "Max" | "DistinctCount";
export type NormalizationMethod = "None" | "MinMax" | "Percentile" | "ZScore";
/** How a factor's weight combines in the rubric. */
export type WeightMode = "Additive" | "Penalty";

/** A display row for the model's rubric (a Model Factor joined to its Factor). */
export interface RubricRow {
    modelFactorId: string;
    name: string;
    detail: string;
    /** Weight as a 0–100 percentage (stored as a 0–1 fraction; ×100 for display). */
    weight: number;
    /** Lowercased for the template's chip styling ("additive" | "penalty"). */
    mode: "additive" | "penalty";
}

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

    /** The model's rubric as display rows: each Model Factor joined to its Factor. */
    public async rubricForModel(modelId: string): Promise<RubricRow[]> {
        const modelFactors = await this.listForModel(modelId);
        if (modelFactors.length === 0) return [];

        const ids = modelFactors.map((m) => `'${m.FactorID}'`).join(",");
        const factorsResult = await new RunView().RunView<mjBizAppsSonarFactorEntity>({
            EntityName: FACTOR,
            ExtraFilter: `ID IN (${ids})`,
            ResultType: "entity_object",
        });
        const factorById = new Map((factorsResult.Results ?? []).map((f) => [f.ID, f]));

        return modelFactors.map((mf) => {
            const f = factorById.get(mf.FactorID);
            return {
                modelFactorId: mf.ID,
                name: f?.Name ?? "(factor)",
                detail: this.describeFactor(f),
                weight: Math.round((mf.Weight ?? 0) * 100),
                mode: (mf.WeightMode ?? "Additive").toLowerCase() === "penalty" ? "penalty" : "additive",
            } satisfies RubricRow;
        });
    }

    /** Plain one-line description of a factor's measure (for the rubric row). */
    private describeFactor(f?: mjBizAppsSonarFactorEntity): string {
        if (!f) return "";
        const measure = f.Aggregation === "Count" || !f.AggregateFieldName
            ? f.Aggregation ?? "Count"
            : `${f.Aggregation}(${f.AggregateFieldName})`;
        return `${measure} · ${f.NormalizationMethod ?? "None"}`;
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

    /** Update a rubric binding's weight (0–1 fraction). For live what-if tuning. */
    public async updateWeight(modelFactorId: string, weight: number): Promise<boolean> {
        const mf = await this.md.GetEntityObject<mjBizAppsSonarModelFactorEntity>(MODEL_FACTOR, CompositeKey.FromID(modelFactorId));
        if (!mf?.IsSaved) return false;
        mf.Weight = weight;
        return mf.Save();
    }

    /**
     * Remove a factor from a model's rubric (deletes the binding, not the underlying factor).
     * Persisted ScoreFactorContribution rows reference the ModelFactor via a no-cascade FK, so
     * once a model has been recomputed the binding can't be deleted until its contributions are
     * cleared first — otherwise the DB throws FK_ScoreFactorContribution_ModelFactor.
     *
     * The model's existing Scores were computed *with* this factor, so they're left stale until
     * the next recompute (the caller should re-run). TODO: wrap both deletes in a Metadata
     * TransactionGroup so a failed binding-delete rolls back the contribution cleanup.
     */
    public async unbind(modelFactorId: string): Promise<boolean> {
        await this.clearContributions(modelFactorId);
        const mf = await this.md.GetEntityObject<mjBizAppsSonarModelFactorEntity>(MODEL_FACTOR, CompositeKey.FromID(modelFactorId));
        return mf?.IsSaved ? mf.Delete() : false;
    }

    /** Delete every persisted contribution row that references a ModelFactor (frees the FK). */
    private async clearContributions(modelFactorId: string): Promise<void> {
        const result = await new RunView().RunView<mjBizAppsSonarScoreFactorContributionEntity>({
            EntityName: CONTRIBUTION,
            ExtraFilter: `ModelFactorID='${modelFactorId}'`,
            ResultType: "entity_object",
        });
        for (const row of result.Success ? result.Results ?? [] : []) {
            await row.Delete();
        }
    }

    private slugify(name: string): string {
        return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }
}
