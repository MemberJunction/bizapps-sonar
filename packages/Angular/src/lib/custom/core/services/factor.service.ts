import { Injectable } from "@angular/core";
import { CompositeKey, Metadata, RunView } from "@memberjunction/core";
import { mjBizAppsSonarFactorEntity, mjBizAppsSonarModelFactorEntity, mjBizAppsSonarScoreFactorContributionEntity } from "@mj-biz-apps/sonar-entities";

const FACTOR = "MJ_BizApps_Sonar: Factors";
const MODEL_FACTOR = "MJ_BizApps_Sonar: Model Factors";
const CONTRIBUTION = "MJ_BizApps_Sonar: Score Factor Contributions";

/** Engine-supported v1 values (confirmed against sonar_engine: factorSql / NormalizationEngine). */
export type Aggregation = "Count" | "Sum" | "Avg" | "Min" | "Max" | "DistinctCount";
export type NormalizationMethod =
    | "None"
    | "MinMax"
    | "Percentile"
    | "ZScore"
    | "Logistic"
    | "Banded"
    | "Lookup";
/** Methods that read NormalizationParamsJSON for their (fixed-shape) config. */
export const PARAMETERIZED_NORMALIZATION: ReadonlySet<NormalizationMethod> = new Set([
    "Logistic",
    "Banded",
    "Lookup",
]);
/** How a factor's weight combines in the rubric. */
export type WeightMode = "Additive" | "Penalty";
/** A factor either measures data (compiled to SQL) or runs an Action for its value. */
export type FactorKind = "Declarative" | "ActionBacked";
/** Governance gate the engine checks: only 'Approved' action factors are included in real scores. */
export type PromotionState = "Draft" | "InReview" | "Approved" | "Deprecated";

/** A display row for the model's rubric (a Model Factor joined to its Factor). */
export interface RubricRow {
    modelFactorId: string;
    factorId: string;
    name: string;
    detail: string;
    /** Weight as a 0–100 percentage (stored as a 0–1 fraction; ×100 for display). */
    weight: number;
    /** Lowercased for the template's chip styling ("additive" | "penalty"). */
    mode: "additive" | "penalty";
    /** The factor's source related-entity ID — powers data-source ↔ factor lineage highlighting. */
    sourceRelatedEntityID: string | null;
}

/**
 * Fields to create/update a factor. `factorType` discriminates the two shapes:
 * - 'Declarative' uses the data fields (source/aggregation/field/filter/window).
 * - 'ActionBacked' uses the action fields (actionID/params/promotion).
 * The tail (name/normalization/higherIsBetter) applies to both. AggregateFieldName is omitted for Count.
 */
export interface CreateFactorInput {
    name: string;
    anchorEntityID: string;
    scoreModelID: string;
    factorType: FactorKind;
    // --- declarative (data) fields ---
    sourceRelatedEntityID?: string;
    aggregation?: Aggregation;
    aggregateFieldName?: string;
    /** CompositeFilterDescriptor serialized to JSON, or null for "include everything". */
    filterExpression?: string;
    timeWindowID?: string;
    // --- action-backed fields ---
    actionID?: string;
    /** Serialized `{ params: {...} }` for the action (engine I/O contract), or null. */
    actionParamsJSON?: string;
    promotionState?: PromotionState;
    // --- shared tail ---
    normalizationMethod: NormalizationMethod;
    /** Serialized params for a fixed-shape method (Logistic/Banded/Lookup), else null/undefined. */
    normalizationParamsJSON?: string;
    higherIsBetter: boolean;
}

/** The full editable state of a bound factor — loaded to pre-fill the builder for editing. */
export interface EditFactorVM {
    modelFactorId: string;
    factorId: string;
    name: string;
    factorType: FactorKind;
    sourceRelatedEntityID: string | null;
    aggregation: Aggregation;
    aggregateFieldName: string | null;
    /** Serialized CompositeFilterDescriptor, or null. */
    filterExpression: string | null;
    timeWindowID: string | null;
    // --- action-backed state ---
    actionID: string | null;
    /** The action's `params` object parsed from ActionParamsJSON, coerced to strings for the form. */
    actionParams: Record<string, string>;
    promotionState: PromotionState;
    // --- shared tail ---
    normalizationMethod: NormalizationMethod;
    /** Serialized params for a fixed-shape method (Logistic/Banded/Lookup), or null. */
    normalizationParamsJSON: string | null;
    higherIsBetter: boolean;
    /** Weight as a 0–100 percentage (stored as 0–1). */
    weightPct: number;
    weightMode: WeightMode;
}

/**
 * Data access for Factors (the signals) and their bindings into a model's rubric
 * (Model Factors). Supports both factor kinds — declarative (data → SQL) and action-backed
 * (an MJ Action supplies the value); see CreateFactorInput.factorType.
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
                factorId: mf.FactorID,
                name: f?.Name ?? "(factor)",
                detail: this.describeFactor(f),
                weight: Math.round((mf.Weight ?? 0) * 100),
                mode: (mf.WeightMode ?? "Additive").toLowerCase() === "penalty" ? "penalty" : "additive",
                sourceRelatedEntityID: f?.SourceRelatedEntityID ?? null,
            } satisfies RubricRow;
        });
    }

    /** Plain one-line description of a factor's measure (for the rubric row). */
    private describeFactor(f?: mjBizAppsSonarFactorEntity): string {
        if (!f) return "";
        if (f.FactorType === "ActionBacked") {
            return `Custom signal (action) · ${f.PromotionState ?? "Draft"}`;
        }
        const measure = f.Aggregation === "Count" || !f.AggregateFieldName
            ? f.Aggregation ?? "Count"
            : `${f.Aggregation}(${f.AggregateFieldName})`;
        return `${measure} · ${f.NormalizationMethod ?? "None"}`;
    }

    /** Create a factor row (not yet bound to a model's rubric) — declarative or action-backed. */
    public async create(input: CreateFactorInput): Promise<mjBizAppsSonarFactorEntity | null> {
        const factor = await this.md.GetEntityObject<mjBizAppsSonarFactorEntity>(FACTOR);
        factor.NewRecord();
        factor.Name = input.name;
        factor.Slug = this.slugify(input.name);
        factor.FactorType = input.factorType;
        factor.AnchorEntityID = input.anchorEntityID;
        factor.ScoreModelID = input.scoreModelID;
        this.applyTypeFields(factor, input);
        factor.NormalizationMethod = input.normalizationMethod;
        factor.NormalizationParamsJSON = input.normalizationParamsJSON ?? null;
        factor.HigherIsBetter = input.higherIsBetter;
        return (await factor.Save()) ? factor : null;
    }

    /**
     * Write the kind-specific fields and NULL the other kind's, so a factor never carries stale
     * config from the mode it isn't in (e.g. an ActionBacked factor must not keep an old Aggregation).
     * Shared on both create and update.
     */
    private applyTypeFields(factor: mjBizAppsSonarFactorEntity, input: CreateFactorInput): void {
        if (input.factorType === "ActionBacked") {
            factor.ActionID = input.actionID ?? null;
            factor.ActionParamsJSON = input.actionParamsJSON ?? null;
            factor.PromotionState = input.promotionState ?? "Draft";
            factor.ExecutionMode = "PerRecord";
            // clear declarative fields
            factor.SourceRelatedEntityID = null;
            factor.Aggregation = null;
            factor.AggregateFieldName = null;
            factor.FilterExpression = null;
            factor.TimeWindowID = null;
        } else {
            factor.SourceRelatedEntityID = input.sourceRelatedEntityID ?? null;
            factor.Aggregation = input.aggregation ?? null;
            factor.AggregateFieldName = input.aggregateFieldName ?? null;
            factor.FilterExpression = input.filterExpression ?? null;
            factor.TimeWindowID = input.timeWindowID ?? null;
            // clear action fields
            factor.ActionID = null;
            factor.ActionParamsJSON = null;
            factor.PromotionState = null;
            factor.ExecutionMode = null;
        }
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

    /** Load a bound factor's full editable state (Model Factor + its Factor) for the edit dialog. */
    public async loadFactorForEdit(modelFactorId: string): Promise<EditFactorVM | null> {
        const mf = await this.md.GetEntityObject<mjBizAppsSonarModelFactorEntity>(MODEL_FACTOR, CompositeKey.FromID(modelFactorId));
        if (!mf?.IsSaved) return null;
        const factor = await this.md.GetEntityObject<mjBizAppsSonarFactorEntity>(FACTOR, CompositeKey.FromID(mf.FactorID));
        if (!factor?.IsSaved) return null;
        return {
            modelFactorId: mf.ID,
            factorId: factor.ID,
            name: factor.Name ?? "",
            factorType: factor.FactorType === "ActionBacked" ? "ActionBacked" : "Declarative",
            sourceRelatedEntityID: factor.SourceRelatedEntityID ?? null,
            aggregation: (factor.Aggregation ?? "Count") as Aggregation,
            aggregateFieldName: factor.AggregateFieldName ?? null,
            filterExpression: factor.FilterExpression ?? null,
            timeWindowID: factor.TimeWindowID ?? null,
            actionID: factor.ActionID ?? null,
            actionParams: this.parseActionParams(factor.ActionParamsJSON),
            promotionState: (factor.PromotionState ?? "Draft") as PromotionState,
            normalizationMethod: (factor.NormalizationMethod ?? "MinMax") as NormalizationMethod,
            normalizationParamsJSON: factor.NormalizationParamsJSON ?? null,
            higherIsBetter: factor.HigherIsBetter ?? true,
            weightPct: Math.round((mf.Weight ?? 0) * 100),
            weightMode: (mf.WeightMode ?? "Additive") === "Penalty" ? "Penalty" : "Additive",
        };
    }

    /** Pull the `params` object out of a stored ActionParamsJSON, coercing each value to a string
     *  for the form inputs. Tolerates null/blank/malformed JSON (→ empty), never throws. */
    private parseActionParams(json: string | null): Record<string, string> {
        if (!json) return {};
        try {
            const parsed: unknown = JSON.parse(json);
            const params = (parsed as { params?: unknown })?.params;
            if (!params || typeof params !== "object") return {};
            const out: Record<string, string> = {};
            for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
                if (value !== null && value !== undefined) out[key] = String(value);
            }
            return out;
        } catch {
            return {};
        }
    }

    /**
     * Update an existing factor's definition and its rubric binding's weight/mode. Clears the
     * fields that no longer apply (e.g. AggregateFieldName when switching to Count) so stale
     * config can't linger. The model's existing Scores were computed with the OLD definition, so
     * they're left stale until the next recompute (the caller should re-run).
     */
    public async updateFactor(modelFactorId: string, factorId: string, input: CreateFactorInput, weight: number, weightMode: WeightMode): Promise<boolean> {
        const factor = await this.md.GetEntityObject<mjBizAppsSonarFactorEntity>(FACTOR, CompositeKey.FromID(factorId));
        if (!factor?.IsSaved) return false;
        factor.Name = input.name;
        factor.Slug = this.slugify(input.name);
        factor.FactorType = input.factorType;
        this.applyTypeFields(factor, input);
        factor.NormalizationMethod = input.normalizationMethod;
        factor.NormalizationParamsJSON = input.normalizationParamsJSON ?? null;
        factor.HigherIsBetter = input.higherIsBetter;
        if (!(await factor.Save())) return false;

        const mf = await this.md.GetEntityObject<mjBizAppsSonarModelFactorEntity>(MODEL_FACTOR, CompositeKey.FromID(modelFactorId));
        if (!mf?.IsSaved) return false;
        mf.Weight = weight;
        mf.WeightMode = weightMode;
        return mf.Save();
    }

    /** Update a rubric binding's weight (0–1 fraction). For live what-if tuning. */
    public async updateWeight(modelFactorId: string, weight: number): Promise<boolean> {
        const mf = await this.md.GetEntityObject<mjBizAppsSonarModelFactorEntity>(MODEL_FACTOR, CompositeKey.FromID(modelFactorId));
        if (!mf?.IsSaved) return false;
        mf.Weight = weight;
        return mf.Save();
    }

    /** Wire (or unwire) a factor to a specific source entity. relatedEntityId=null clears the source. */
    public async setFactorSource(factorId: string, relatedEntityId: string | null): Promise<boolean> {
        const factor = await this.md.GetEntityObject<mjBizAppsSonarFactorEntity>(FACTOR, CompositeKey.FromID(factorId));
        if (!factor?.IsSaved) return false;
        factor.SourceRelatedEntityID = relatedEntityId;
        return factor.Save();
    }

    /** Persist a new rubric order: write each binding's DisplayOrder to its position in the list.
     *  Driven by drag-and-drop; the caller reorders optimistically and calls this to sync. */
    public async reorder(orderedModelFactorIds: string[]): Promise<boolean> {
        let ok = true;
        for (let i = 0; i < orderedModelFactorIds.length; i++) {
            const mf = await this.md.GetEntityObject<mjBizAppsSonarModelFactorEntity>(MODEL_FACTOR, CompositeKey.FromID(orderedModelFactorIds[i]));
            if (mf?.IsSaved) {
                mf.DisplayOrder = i;
                if (!(await mf.Save())) ok = false;
            }
        }
        return ok;
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
