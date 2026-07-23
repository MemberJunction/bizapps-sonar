import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { Metadata, RunView, UserInfo } from "@memberjunction/core";
import {
    mjBizAppsSonarFactorEntity,
    mjBizAppsSonarModelFactorEntity,
    mjBizAppsSonarModelRelatedEntityEntity,
    mjBizAppsSonarScoreModelEntity,
} from "@mj-biz-apps/sonar-entities";

const SCORE_MODEL = "MJ_BizApps_Sonar: Score Models";
const MODEL_RELATED_ENTITY = "MJ_BizApps_Sonar: Model Related Entities";
const FACTOR = "MJ_BizApps_Sonar: Factors";
const MODEL_FACTOR = "MJ_BizApps_Sonar: Model Factors";
const BAND_SET = "MJ_BizApps_Sonar: Score Band Sets";

/** Resolved snapshot of a model the agent (or UI) can reason about. */
interface ModelDescription {
    modelID: string;
    name: string;
    status: string;
    anchorEntityID: string;
    anchorEntityName: string | null;
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
            const description = await this.describe(model, params.ContextUser);
            return this.ok(params, `Described model '${description.name}' (${description.factors.length} factor(s), ${description.sources.length} source(s)).`, description);
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    /** Load the model by ID (preferred) or exact name. */
    private async loadModel(modelID: string | null, name: string | null, user?: UserInfo): Promise<mjBizAppsSonarScoreModelEntity | null> {
        const filter = modelID ? `ID='${this.sqlString(modelID)}'` : `Name='${this.sqlString(name ?? "")}'`;
        const res = await new RunView().RunView<mjBizAppsSonarScoreModelEntity>(
            { EntityName: SCORE_MODEL, ExtraFilter: filter, MaxRows: 1, ResultType: "entity_object" },
            user,
        );
        return res.Success && res.Results.length ? res.Results[0] : null;
    }

    /** Resolve a model into the full description (sources, factors, names). */
    private async describe(model: mjBizAppsSonarScoreModelEntity, user?: UserInfo): Promise<ModelDescription> {
        const [sources, factors, modelFactors] = await this.loadChildren(model.ID, user);
        const aliasBySourceId = new Map(sources.map((s) => [s.ID, s.Alias]));
        const weightByFactorId = new Map(modelFactors.map((mf) => [mf.FactorID, mf.Weight]));

        return {
            modelID: model.ID,
            name: model.Name,
            status: model.Status,
            anchorEntityID: model.AnchorEntityID,
            anchorEntityName: this.entityName(model.AnchorEntityID),
            bandSet: model.BandSetID ? { id: model.BandSetID, name: await this.bandSetName(model.BandSetID, user) } : null,
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
            })),
        };
    }

    /** Batch-load the model's sources, factors, and model-factor weights. */
    private async loadChildren(
        modelID: string,
        user?: UserInfo,
    ): Promise<[mjBizAppsSonarModelRelatedEntityEntity[], mjBizAppsSonarFactorEntity[], mjBizAppsSonarModelFactorEntity[]]> {
        const [src, fac, mf] = await new RunView().RunViews(
            [
                { EntityName: MODEL_RELATED_ENTITY, ExtraFilter: `ScoreModelID='${this.sqlString(modelID)}'`, ResultType: "entity_object" },
                { EntityName: FACTOR, ExtraFilter: `ScoreModelID='${this.sqlString(modelID)}'`, ResultType: "entity_object" },
                { EntityName: MODEL_FACTOR, ExtraFilter: `ScoreModelID='${this.sqlString(modelID)}'`, ResultType: "entity_object" },
            ],
            user,
        );
        return [
            (src.Results ?? []) as mjBizAppsSonarModelRelatedEntityEntity[],
            (fac.Results ?? []) as mjBizAppsSonarFactorEntity[],
            (mf.Results ?? []) as mjBizAppsSonarModelFactorEntity[],
        ];
    }

    /** Entity display name from cached MJ metadata (no query). */
    private entityName(entityID: string | null | undefined): string | null {
        if (!entityID) return null;
        return new Metadata().Entities.find((e) => e.ID === entityID)?.Name ?? null;
    }

    private async bandSetName(bandSetID: string, user?: UserInfo): Promise<string | null> {
        const res = await new RunView().RunView(
            { EntityName: BAND_SET, ExtraFilter: `ID='${this.sqlString(bandSetID)}'`, MaxRows: 1, ResultType: "simple", Fields: ["Name"] },
            user,
        );
        const row = res.Success && res.Results.length ? (res.Results[0] as { Name?: unknown }) : null;
        return row && typeof row.Name === "string" ? row.Name : null;
    }
}
