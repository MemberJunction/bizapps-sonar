import { ActionResultSimple, RunActionParams, ActionParam } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { Metadata, UserInfo } from "@memberjunction/core";
import { mjBizAppsSonarFactorEntity, mjBizAppsSonarModelFactorEntity, mjBizAppsSonarScoreModelEntity } from "@mj-biz-apps/sonar-entities";

const FACTOR = "MJ_BizApps_Sonar: Factors";
const MODEL_FACTOR = "MJ_BizApps_Sonar: Model Factors";
const SCORE_MODEL = "MJ_BizApps_Sonar: Score Models";

/** Allowed enum values, declared so we can narrow JSON strings to the entity's literal unions
 *  (a validated `as` cast, never `as any`). */
const AGGREGATIONS = ["Count", "Sum", "Avg", "Min", "Max", "DistinctCount"] as const;
const NORMALIZATIONS = ["MinMax", "Percentile", "ZScore", "None", "Logistic", "Banded", "Lookup"] as const;
const WEIGHT_MODES = ["Additive", "Penalty"] as const;
type Aggregation = (typeof AGGREGATIONS)[number];
type NormalizationMethod = (typeof NORMALIZATIONS)[number];
type WeightMode = (typeof WEIGHT_MODES)[number];

/**
 * The declarative-factor spec the agent (or UI) sends in the `Spec` param. Action-backed factors go
 * through the Codesmith path (plans/agentic-authoring.md §5), NOT this action — so there are no
 * action fields here. All config is optional except `name`; sensible defaults fill the rest.
 */
interface CreateFactorSpec {
    name: string;
    sourceRelatedEntityID?: string | null;
    aggregation?: string | null;
    aggregateFieldName?: string | null;
    /** Serialized CompositeFilterDescriptor, or null for "include everything". */
    filterExpression?: string | null;
    timeWindowID?: string | null;
    /** The related-entity activity-date column the time window filters on (Factor.DateField).
     *  Required for per-anchor windows (SinceEvent/RenewalRelative) and for Rolling/Calendar windows
     *  measured on a related entity; null for AllTime / no time bound. */
    dateField?: string | null;
    normalizationMethod?: string | null;
    /** Serialized params for a fixed-shape method (Logistic/Banded/Lookup), else null. */
    normalizationParamsJSON?: string | null;
    higherIsBetter?: boolean;
    /** Rubric weight, 0..1 (default 0.25). */
    weight?: number;
    weightMode?: string;
}

/**
 * Sonar: Create Factor — the first tool in the agentic authoring surface
 * (plans/agentic-authoring.md §4a). Creates a DECLARATIVE factor and binds it into a model's rubric
 * (Model Factor) server-side, mirroring `FactorService.createAndBind` so the agent and the UI share
 * one write path. Declarative only by design; action-backed factors are authored via Codesmith.
 *
 * Input params:  ModelID (string), Spec (JSON of CreateFactorSpec)
 * Output param:  Result  (JSON: { factorID, modelFactorID })
 */
@RegisterClass(BaseAction, "SonarCreateFactor")
export class SonarCreateFactorAction extends SonarActionBase {
    /** Captured entity save-failure detail (surfaced in the ERROR result). */
    private saveError = "save returned false";

    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const modelId = this.getInput(params, "ModelID");
        const spec = this.parseJsonParam<CreateFactorSpec>(params, "Spec");
        if (!modelId || !spec) {
            return this.fail(params, "VALIDATION_ERROR", "ModelID and Spec (a JSON object or string) are required.");
        }
        if (!spec.name || spec.name.trim().length === 0) {
            return this.fail(params, "VALIDATION_ERROR", "Spec.name is required.");
        }

        try {
            const anchorEntityID = await this.resolveAnchor(modelId, params.ContextUser);
            if (!anchorEntityID) {
                return this.fail(params, "NOT_FOUND", `Score Model '${modelId}' not found (or has no anchor).`);
            }
            const factor = await this.createFactor(modelId, anchorEntityID, spec, params.ContextUser);
            if (!factor) {
                return this.fail(params, "ERROR", `Failed to save the factor: ${this.saveError}`);
            }
            const modelFactor = await this.bindToModel(modelId, factor.ID, spec, params.ContextUser);
            if (!modelFactor) {
                return this.fail(params, "ERROR", `Factor created but binding it to the model failed: ${this.saveError}`);
            }
            const result = { factorID: factor.ID, modelFactorID: modelFactor.ID };
            return {
                Success: true,
                ResultCode: "SUCCESS",
                Message: `Created factor '${spec.name}' and bound it to the model.`,
                Params: [...params.Params, { Name: "Result", Value: JSON.stringify(result), Type: "Both" }],
            };
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    /** Load the model's anchor entity — a declarative factor measures records hanging off the anchor. */
    private async resolveAnchor(modelId: string, contextUser?: UserInfo): Promise<string | null> {
        const md = new Metadata();
        const model = await md.GetEntityObject<mjBizAppsSonarScoreModelEntity>(SCORE_MODEL, contextUser);
        await model.Load(modelId);
        return model.IsSaved ? model.AnchorEntityID : null;
    }

    /** Create + save the declarative Factor row (clears any action-only fields — this path is data-only). */
    private async createFactor(
        modelId: string,
        anchorEntityID: string,
        spec: CreateFactorSpec,
        contextUser?: UserInfo,
    ): Promise<mjBizAppsSonarFactorEntity | null> {
        const md = new Metadata();
        const factor = await md.GetEntityObject<mjBizAppsSonarFactorEntity>(FACTOR, contextUser);
        factor.NewRecord();
        factor.Name = spec.name.trim();
        factor.Slug = this.slugify(spec.name);
        factor.FactorType = "Declarative";
        factor.AnchorEntityID = anchorEntityID;
        factor.ScoreModelID = modelId;
        factor.SourceRelatedEntityID = spec.sourceRelatedEntityID ?? null;
        factor.Aggregation = this.asEnum(spec.aggregation, AGGREGATIONS) ?? "Count";
        factor.AggregateFieldName = factor.Aggregation === "Count" ? null : (spec.aggregateFieldName ?? null);
        factor.FilterExpression = spec.filterExpression ?? null;
        factor.TimeWindowID = spec.timeWindowID ?? null;
        factor.DateField = spec.dateField ?? null;
        factor.NormalizationMethod = this.asEnum(spec.normalizationMethod, NORMALIZATIONS) ?? "MinMax";
        factor.NormalizationParamsJSON = spec.normalizationParamsJSON ?? null;
        factor.HigherIsBetter = spec.higherIsBetter ?? true;
        if (await factor.Save()) return factor;
        this.saveError = factor.LatestResult?.Message || JSON.stringify(factor.LatestResult?.Errors ?? []) || "unknown";
        return null;
    }

    /** Bind the factor into the model's rubric with weight + combine mode (0..1 weight). */
    private async bindToModel(
        modelId: string,
        factorId: string,
        spec: CreateFactorSpec,
        contextUser?: UserInfo,
    ): Promise<mjBizAppsSonarModelFactorEntity | null> {
        const md = new Metadata();
        const mf = await md.GetEntityObject<mjBizAppsSonarModelFactorEntity>(MODEL_FACTOR, contextUser);
        mf.NewRecord();
        mf.ScoreModelID = modelId;
        mf.FactorID = factorId;
        mf.Weight = this.clampWeight(spec.weight);
        mf.WeightMode = this.asEnum(spec.weightMode, WEIGHT_MODES) ?? "Additive";
        if (await mf.Save()) return mf;
        this.saveError = mf.LatestResult?.Message || JSON.stringify(mf.LatestResult?.Errors ?? []) || "unknown";
        return null;
    }

    /** Parse the Spec JSON into a typed object; null on malformed input (never throws). */
    private parseSpec(json: string): CreateFactorSpec | null {
        try {
            const parsed: unknown = JSON.parse(json);
            if (!parsed || typeof parsed !== "object") return null;
            return parsed as CreateFactorSpec;
        } catch {
            return null;
        }
    }

    /** Narrow a free string to one of an allowed literal set (validated cast, not `any`). */
    private asEnum<T extends string>(value: string | null | undefined, allowed: readonly T[]): T | null {
        return value != null && (allowed as readonly string[]).includes(value) ? (value as T) : null;
    }

    /** Keep weight in [0, 1]; default 0.25 when absent/invalid. */
    private clampWeight(weight: number | undefined): number {
        if (typeof weight !== "number" || Number.isNaN(weight)) return 0.25;
        return Math.min(1, Math.max(0, weight));
    }

    /** lowercase, hyphenate, strip non-alphanumerics — same shape as FactorService.slugify. */
    private slugify(name: string): string {
        return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }

    /** Build a failure result preserving the inbound params. */
}
