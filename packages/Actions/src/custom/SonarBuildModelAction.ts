import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { Metadata, UserInfo } from "@memberjunction/core";
import { mjBizAppsSonarFactorEntity, mjBizAppsSonarModelFactorEntity, mjBizAppsSonarModelRelatedEntityEntity, mjBizAppsSonarScoreModelEntity } from "@mj-biz-apps/sonar-entities";

const FACTOR = "MJ_BizApps_Sonar: Factors";
const MODEL_FACTOR = "MJ_BizApps_Sonar: Model Factors";
const MODEL_RELATED_ENTITY = "MJ_BizApps_Sonar: Model Related Entities";
const SCORE_MODEL = "MJ_BizApps_Sonar: Score Models";

const AGGREGATIONS = ["Count", "Sum", "Avg", "Min", "Max", "DistinctCount"] as const;
const NORMALIZATIONS = ["MinMax", "Percentile", "ZScore", "None", "Logistic", "Banded", "Lookup"] as const;
const WEIGHT_MODES = ["Additive", "Penalty"] as const;
type Aggregation = (typeof AGGREGATIONS)[number];
type NormalizationMethod = (typeof NORMALIZATIONS)[number];
type WeightMode = (typeof WEIGHT_MODES)[number];

/** A data source in the build spec — `alias` is how factors reference it (no IDs to thread). */
interface SourceSpec {
    relatedEntityID: string;
    alias: string;
    relationshipPath?: string;
}
/** A declarative factor in the build spec. Reference its source by `sourceAlias` (preferred) — the
 *  action resolves it to the wired Model-Related-Entity ID, so the agent never handles those IDs. */
interface FactorSpec {
    name: string;
    sourceAlias?: string;
    sourceRelatedEntityID?: string;
    aggregation?: string;
    aggregateFieldName?: string;
    filterExpression?: string;
    timeWindowID?: string;
    dateField?: string;
    normalizationMethod?: string;
    normalizationParamsJSON?: string;
    higherIsBetter?: boolean;
    weight?: number;
    weightMode?: string;
}
/** The whole model in one payload. */
interface BuildModelSpec {
    name: string;
    anchorEntityID: string;
    sources?: SourceSpec[];
    factors?: FactorSpec[];
    bandSetId?: string;
}

/**
 * Sonar: Build Model — builds a COMPLETE draft model (model + sources + factors + band set) from one
 * spec, in one call. This exists because chaining the granular tools (Create Model → Add Data Source
 * → Create Factor → Set Band Set) is where the agent fumbles: it loses the new model's ID, re-creates,
 * hits slug collisions. Here the agent describes the whole thing declaratively — factors reference
 * sources by **alias** — and the action handles ordering + ID-threading server-side. Draft only;
 * publishing stays a human gate. The granular tools remain for incremental edits to an existing model.
 *
 * Input param:  Spec (JSON BuildModelSpec — object or string)
 * Output param: Result (JSON: { modelID, sources: {alias→id}, factors: id[], bandSetAttached })
 */
@RegisterClass(BaseAction, "SonarBuildModel")
export class SonarBuildModelAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const spec = this.parseJsonParam<BuildModelSpec>(params, "Spec");
        if (!spec) {
            return this.fail(params, "VALIDATION_ERROR", "Spec is required (a JSON object or string).");
        }
        if (!spec.name?.trim() || !spec.anchorEntityID) {
            return this.fail(params, "VALIDATION_ERROR", "Spec.name and Spec.anchorEntityID are required.");
        }

        try {
            const model = await this.createModel(spec, params.ContextUser);
            if (!model) return this.fail(params, "ERROR", `Failed to create the model: ${this.lastError}`);

            const sourceIds = await this.addSources(model.ID, spec.sources ?? [], params.ContextUser);
            if (sourceIds instanceof Error) {
                return this.fail(params, "ERROR", `Model '${model.ID}' created, but a data source failed: ${sourceIds.message}`);
            }

            const factorIds = await this.addFactors(model.ID, spec.anchorEntityID, spec.factors ?? [], sourceIds, params.ContextUser);
            if (factorIds instanceof Error) {
                return this.fail(params, "ERROR", `Model '${model.ID}' + sources created, but a factor failed: ${factorIds.message}`);
            }

            let bandSetAttached = false;
            if (spec.bandSetId) {
                bandSetAttached = await this.attachBandSet(model, spec.bandSetId);
                if (!bandSetAttached) {
                    return this.fail(params, "ERROR", `Model built, but attaching the band set failed: ${this.lastError}`);
                }
            }

            return this.ok(params, `Built draft model '${spec.name}' (${factorIds.length} factor(s), ${Object.keys(sourceIds).length} source(s)).`, {
                modelID: model.ID,
                sources: sourceIds,
                factors: factorIds,
                bandSetAttached,
            });
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    private lastError = "unknown";

    /** Create the Draft model. */
    private async createModel(spec: BuildModelSpec, user?: UserInfo): Promise<mjBizAppsSonarScoreModelEntity | null> {
        const md = new Metadata();
        const model = await md.GetEntityObject<mjBizAppsSonarScoreModelEntity>(SCORE_MODEL, user);
        model.NewRecord();
        model.Name = spec.name.trim();
        model.Slug = this.slugify(spec.name);
        model.Status = "Draft";
        model.AnchorEntityID = spec.anchorEntityID;
        if (await model.Save()) return model;
        this.lastError = this.errOf(model);
        return null;
    }

    /** Wire each source; return alias→ModelRelatedEntity.ID (or the first Error). */
    private async addSources(modelId: string, sources: SourceSpec[], user?: UserInfo): Promise<Record<string, string> | Error> {
        const md = new Metadata();
        const map: Record<string, string> = {};
        for (const s of sources) {
            if (!s.relatedEntityID || !s.alias) return new Error("each source needs relatedEntityID and alias");
            const ds = await md.GetEntityObject<mjBizAppsSonarModelRelatedEntityEntity>(MODEL_RELATED_ENTITY, user);
            ds.NewRecord();
            ds.ScoreModelID = modelId;
            ds.RelatedEntityID = s.relatedEntityID;
            ds.Alias = s.alias;
            ds.JoinType = "Left";
            ds.RelationshipPath = s.relationshipPath && s.relationshipPath.length > 0 ? s.relationshipPath : "[]";
            if (!(await ds.Save())) return new Error(this.errOf(ds));
            map[s.alias] = ds.ID;
        }
        return map;
    }

    /** Create each factor + rubric binding; resolve sourceAlias → wired source ID. Returns factor IDs. */
    private async addFactors(
        modelId: string,
        anchorEntityID: string,
        factors: FactorSpec[],
        sourceIds: Record<string, string>,
        user?: UserInfo,
    ): Promise<string[] | Error> {
        const md = new Metadata();
        const ids: string[] = [];
        for (const f of factors) {
            if (!f.name?.trim()) return new Error("each factor needs a name");
            const aggGap = this.aggregateFieldGap(f.aggregation, f.aggregateFieldName);
            if (aggGap) return new Error(`factor '${f.name}': ${aggGap}`);
            const sourceRelatedEntityID = f.sourceAlias ? sourceIds[f.sourceAlias] : f.sourceRelatedEntityID ?? null;
            if (f.sourceAlias && !sourceRelatedEntityID) {
                const valid = Object.keys(sourceIds);
                return new Error(`factor '${f.name}' references unknown source alias '${f.sourceAlias}'. Valid aliases (from this spec's sources): ${valid.length ? valid.join(", ") : "(none — add the source to spec.sources first)"}.`);
            }

            const factor = await md.GetEntityObject<mjBizAppsSonarFactorEntity>(FACTOR, user);
            factor.NewRecord();
            factor.Name = f.name.trim();
            factor.Slug = this.slugify(f.name);
            factor.FactorType = "Declarative";
            factor.AnchorEntityID = anchorEntityID;
            factor.ScoreModelID = modelId;
            factor.SourceRelatedEntityID = sourceRelatedEntityID;
            factor.Aggregation = this.asEnum(f.aggregation, AGGREGATIONS) ?? "Count";
            factor.AggregateFieldName = factor.Aggregation === "Count" ? null : (f.aggregateFieldName ?? null);
            factor.FilterExpression = f.filterExpression ?? null;
            factor.TimeWindowID = f.timeWindowID ?? null;
            factor.DateField = f.dateField ?? null;
            factor.NormalizationMethod = this.asEnum(f.normalizationMethod, NORMALIZATIONS) ?? "MinMax";
            factor.NormalizationParamsJSON = f.normalizationParamsJSON ?? null;
            factor.HigherIsBetter = f.higherIsBetter ?? true;
            if (!(await factor.Save())) return new Error(this.errOf(factor));

            const mf = await md.GetEntityObject<mjBizAppsSonarModelFactorEntity>(MODEL_FACTOR, user);
            mf.NewRecord();
            mf.ScoreModelID = modelId;
            mf.FactorID = factor.ID;
            mf.Weight = this.clampWeight(f.weight);
            mf.WeightMode = this.asEnum(f.weightMode, WEIGHT_MODES) ?? "Additive";
            if (!(await mf.Save())) return new Error(this.errOf(mf));
            ids.push(factor.ID);
        }
        return ids;
    }

    private async attachBandSet(model: mjBizAppsSonarScoreModelEntity, bandSetId: string): Promise<boolean> {
        model.BandSetID = bandSetId;
        if (await model.Save()) return true;
        this.lastError = this.errOf(model);
        return false;
    }

    private asEnum<T extends string>(value: string | null | undefined, allowed: readonly T[]): T | null {
        return value != null && (allowed as readonly string[]).includes(value) ? (value as T) : null;
    }
    private clampWeight(weight: number | undefined): number {
        if (typeof weight !== "number" || Number.isNaN(weight)) return 0.25;
        return Math.min(1, Math.max(0, weight));
    }
    private slugify(name: string): string {
        return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }
}
