import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { Metadata, UserInfo } from "@memberjunction/core";
import {
    mjBizAppsSonarScoreModelEntity,
    SonarEngineBase,
} from "@mj-biz-apps/sonar-entities";

/** Resolved snapshot of a model the agent (or UI) can reason about. */
interface ModelDescription {
    modelID: string;
    name: string;
    status: string;
    anchorEntityID: string;
    anchorEntityName: string | null;
    /** Days the headline Delta/trend looks back; null = "since the previous recompute". Reported so the
     *  agent can explain (and reason about) how "change" is measured for this model. */
    trendWindowDays: number | null;
    /** The score range the model's bands have to tile. */
    scoreScale: { min: number | null; max: number | null };
    bandSet: { id: string; name: string | null } | null;
    sources: { id: string; alias: string; relatedEntityID: string; relatedEntityName: string | null }[];
    factors: {
        id: string;
        name: string;
        sourceAlias: string | null;
        aggregation: string | null;
        aggregateFieldName: string | null;
        normalizationMethod: string | null;
        higherIsBetter: boolean | null;
        weight: number | null;
        /** What an anchor with no data for this factor scores on it. 'ModelDefault' means nobody chose,
         *  and the engine treats it as Zero — worth surfacing, because on a sparse source that silently
         *  scores every anchor with no rows as the worst possible. */
        missingDataPolicy: string | null;
    }[];
}

/**
 * Sonar: Describe Model — the agent's READ tool for an existing model. Give it a model name or ID and
 * it returns the resolved config: anchor (with entity name), data sources (alias + entity name), factors
 * (with their source alias + weight), and band set. This exists because the authoring agent was
 * write-only — asked "suggest factors for model X" it had no way to SEE X, so it punted to the user.
 * The UI doesn't need this (it reads the same rows via RunView directly); it's purely the agent's eyes.
 *
 * Input params: ModelID (optional) and/or Name (optional) — at least one required.
 * Output param: Result (JSON ModelDescription)
 */
@RegisterClass(BaseAction, "SonarDescribeModel")
export class SonarDescribeModelAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const modelID = this.getInput(params, "ModelID");
        const name = this.getInput(params, "Name");
        if (!modelID && !name) {
            return this.fail(params, "VALIDATION_ERROR", "Provide ModelID or Name.");
        }
        if (modelID && !this.isGuid(modelID)) {
            return this.failWithFix(params, "VALIDATION_ERROR", `ModelID '${modelID}' is not a valid GUID.`,
                "pass the model's GUID id, or look it up by Name instead.");
        }

        try {
            const model = await this.loadModel(modelID, name, params.ContextUser);
            if (!model) {
                return this.fail(params, "NOT_FOUND", `No model found for ${modelID ? `ID '${modelID}'` : `name '${name}'`}.`);
            }
            const description = this.describe(model);
            return this.ok(params, `Described model '${description.name}' (${description.factors.length} factor(s), ${description.sources.length} source(s)).`, description);
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    /** Load the model by ID (preferred) or exact name from SonarEngineBase (with one force-refresh fallback). */
    private async loadModel(modelID: string | null, name: string | null, user?: UserInfo): Promise<mjBizAppsSonarScoreModelEntity | null> {
        await SonarEngineBase.Instance.Config(false, user);
        const lookup = (): mjBizAppsSonarScoreModelEntity | undefined =>
            modelID ? SonarEngineBase.Instance.GetModelById(modelID) : SonarEngineBase.Instance.GetModelByName(name);
        let model = lookup();
        if (!model) {
            await SonarEngineBase.Instance.Config(true, user);
            model = lookup();
        }
        return model ?? null;
    }

    /** Resolve a model into the full description synchronously from SonarEngineBase cache. */
    private describe(model: mjBizAppsSonarScoreModelEntity): ModelDescription {
        const sources = SonarEngineBase.Instance.GetRelatedEntitiesForModel(model.ID);
        const factors = SonarEngineBase.Instance.GetFactorsForModel(model.ID);
        const modelFactors = SonarEngineBase.Instance.GetModelFactorsForModel(model.ID);
        const aliasBySourceId = new Map(sources.map((s) => [s.ID, s.Alias]));
        const weightByFactorId = new Map(modelFactors.map((mf) => [mf.FactorID, mf.Weight]));
        const missingByFactorId = new Map(modelFactors.map((mf) => [mf.FactorID, mf.MissingDataPolicy]));
        const bandSet = model.BandSetID ? SonarEngineBase.Instance.GetBandSetById(model.BandSetID) : undefined;

        return {
            modelID: model.ID,
            name: model.Name,
            status: model.Status,
            anchorEntityID: model.AnchorEntityID,
            anchorEntityName: this.entityName(model.AnchorEntityID),
            trendWindowDays: model.TrendWindowDays ?? null,
            scoreScale: { min: model.ScoreScaleMin ?? null, max: model.ScoreScaleMax ?? null },
            bandSet: model.BandSetID ? { id: model.BandSetID, name: bandSet?.Name ?? null } : null,
            sources: sources.map((s) => ({
                id: s.ID,
                alias: s.Alias,
                relatedEntityID: s.RelatedEntityID,
                relatedEntityName: this.entityName(s.RelatedEntityID),
            })),
            factors: factors.map((f) => ({
                id: f.ID,
                name: f.Name,
                sourceAlias: f.SourceRelatedEntityID ? aliasBySourceId.get(f.SourceRelatedEntityID) ?? null : null,
                aggregation: f.Aggregation,
                aggregateFieldName: f.AggregateFieldName,
                normalizationMethod: f.NormalizationMethod,
                higherIsBetter: f.HigherIsBetter,
                weight: weightByFactorId.get(f.ID) ?? null,
                missingDataPolicy: missingByFactorId.get(f.ID) ?? null,
            })),
        };
    }

    /** Entity display name from cached MJ metadata (no query). */
    private entityName(entityID: string | null | undefined): string | null {
        if (!entityID) return null;
        return new Metadata().Entities.find((e) => e.ID === entityID)?.Name ?? null;
    }
}
