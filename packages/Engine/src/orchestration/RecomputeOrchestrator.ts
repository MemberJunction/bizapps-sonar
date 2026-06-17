import { LogError, Metadata, RunView, UserInfo } from "@memberjunction/core";
import {
    mjBizAppsSonarScoreModelEntity,
    mjBizAppsSonarModelFactorEntity,
    mjBizAppsSonarFactorEntity,
    mjBizAppsSonarScoreBandEntity,
    mjBizAppsSonarScoreRecomputeRunEntity,
} from "@mj-biz-apps/sonar-entities";
import { FactorEvaluationContext } from "../contracts/IFactorEvaluator";
import { FactorCompiler } from "../factors/FactorCompiler";
import {
    NormalizationEngine,
    NormalizationSpec,
} from "../normalization/NormalizationEngine";
import {
    ScoreBandDef,
    ScoreResult,
    ScoringEngine,
    ScoringSpec,
    WeightedFactor,
} from "../scoring/ScoringEngine";
import { ScoreWriter } from "./ScoreWriter";

/** Summary of a persisted recompute run. */
export interface RecomputeRunResult {
    runId: string;
    status: "Succeeded" | "Failed";
    recordsScored: number;
}

/**
 * The conductor (plan §6.1). Wires the trusted, individually-tested stages together into
 * one run: resolve the population → compile + evaluate each factor → normalize → combine
 * into a score per anchor. This is I/O-heavy glue, not new scoring logic.
 *
 * v1 scope: computes and RETURNS scores (no persistence yet); scores from the model's live
 * config (not a published version snapshot); population is the whole anchor entity (no
 * PopulationFilter yet); WeightedSum models only. Unsupported config fails loud.
 */
export class RecomputeOrchestrator {
    private readonly compiler = new FactorCompiler();
    private readonly normalizer = new NormalizationEngine();
    private readonly scorer = new ScoringEngine();
    private readonly writer = new ScoreWriter();

    /** Compute scores for a model and RETURN them (no persistence). */
    public async computeScores(
        modelId: string,
        asOf: Date,
        contextUser: UserInfo,
    ): Promise<Map<string, ScoreResult>> {
        const model = await this.loadModel(modelId, contextUser);
        this.assertSupported(model);
        return this.computeForModel(model, asOf, contextUser);
    }

    /**
     * Compute AND persist a full run: records a ScoreRecomputeRun, upserts every Score and
     * its contributions, and marks the run Succeeded/Failed. Requires a published model — a
     * persisted Score must reference the ScoreModelVersion that produced it (schema mandates
     * ScoreModelVersionID), so we stamp the model's current version.
     */
    public async recompute(
        modelId: string,
        asOf: Date,
        contextUser: UserInfo,
    ): Promise<RecomputeRunResult> {
        const model = await this.loadModel(modelId, contextUser);
        this.assertSupported(model);
        if (!model.CurrentVersionID) {
            throw new Error(
                `RecomputeOrchestrator: model ${modelId} must be published (have a current version) before scores can be persisted.`,
            );
        }

        const run = await this.startRun(model, contextUser);
        try {
            const scores = await this.computeForModel(model, asOf, contextUser);
            const recordsScored = await this.writer.write(
                model,
                model.CurrentVersionID,
                scores,
                asOf,
                contextUser,
            );
            await this.finishRun(run, "Succeeded", recordsScored);
            return { runId: run.ID, status: "Succeeded", recordsScored };
        } catch (e: unknown) {
            await this.finishRun(
                run,
                "Failed",
                0,
                e instanceof Error ? e.message : String(e),
            );
            throw e;
        }
    }

    /** The shared pipeline: population → evaluate + normalize each factor → combine. */
    private async computeForModel(
        model: mjBizAppsSonarScoreModelEntity,
        asOf: Date,
        contextUser: UserInfo,
    ): Promise<Map<string, ScoreResult>> {
        const anchorIds = await this.resolvePopulation(model, contextUser);
        if (anchorIds.length === 0) {
            return new Map();
        }
        const ctx: FactorEvaluationContext = { contextUser };
        const factors = await this.buildWeightedFactors(
            model,
            anchorIds,
            asOf,
            ctx,
            contextUser,
        );
        const scoringSpec = await this.resolveScoringSpec(model, contextUser);
        return this.scorer.score(scoringSpec, factors);
    }

    /** Open a ScoreRecomputeRun in the Running state. */
    private async startRun(
        model: mjBizAppsSonarScoreModelEntity,
        contextUser: UserInfo,
    ): Promise<mjBizAppsSonarScoreRecomputeRunEntity> {
        const md = new Metadata();
        const run = await md.GetEntityObject<mjBizAppsSonarScoreRecomputeRunEntity>(
            "MJ_BizApps_Sonar: Score Recompute Runs",
            contextUser,
        );
        run.NewRecord();
        run.ScoreModelID = model.ID;
        run.ScoreModelVersionID = model.CurrentVersionID;
        run.TriggerType = "Manual";
        run.Scope = "FullPopulation";
        run.StartedAt = new Date();
        run.Status = "Running";
        await run.Save();
        return run;
    }

    /** Close out a run with its final status and counts. */
    private async finishRun(
        run: mjBizAppsSonarScoreRecomputeRunEntity,
        status: "Succeeded" | "Failed",
        recordsScored: number,
        errorMessage?: string,
    ): Promise<void> {
        const completedAt = new Date();
        run.Status = status;
        run.CompletedAt = completedAt;
        run.RecordsScored = recordsScored;
        run.DurationMs = completedAt.getTime() - run.StartedAt.getTime();
        if (errorMessage) {
            run.ErrorsJSON = JSON.stringify({ message: errorMessage });
        }
        if (!(await run.Save())) {
            LogError(
                `RecomputeOrchestrator: failed to finalize run ${run.ID}: ${run.LatestResult?.CompleteMessage ?? "unknown"}`,
            );
        }
    }

    private async loadModel(
        modelId: string,
        contextUser: UserInfo,
    ): Promise<mjBizAppsSonarScoreModelEntity> {
        const md = new Metadata();
        const model = await md.GetEntityObject<mjBizAppsSonarScoreModelEntity>(
            "MJ_BizApps_Sonar: Score Models",
            contextUser,
        );
        if (!(await model.Load(modelId))) {
            throw new Error(`RecomputeOrchestrator: ScoreModel ${modelId} not found.`);
        }
        return model;
    }

    /** v1 only combines via WeightedSum; fail loud on other strategies. */
    private assertSupported(model: mjBizAppsSonarScoreModelEntity): void {
        if (model.CombineStrategy !== "WeightedSum") {
            throw new Error(
                `RecomputeOrchestrator: only the WeightedSum combine strategy is supported yet (got '${model.CombineStrategy}').`,
            );
        }
    }

    /** The set of anchor record IDs to score (v1: every record of the anchor entity). */
    private async resolvePopulation(
        model: mjBizAppsSonarScoreModelEntity,
        contextUser: UserInfo,
    ): Promise<string[]> {
        const md = new Metadata();
        const anchorEntity = md.EntityByID(model.AnchorEntityID);
        if (!anchorEntity) {
            throw new Error(
                `RecomputeOrchestrator: anchor entity ${model.AnchorEntityID} not found in metadata.`,
            );
        }
        const pk = anchorEntity.PrimaryKeys[0].Name;
        const rv = new RunView();
        const result = await rv.RunView<Record<string, string>>(
            {
                EntityName: anchorEntity.Name,
                ResultType: "simple",
                Fields: [pk],
            },
            contextUser,
        );
        return result.Success ? (result.Results ?? []).map((r) => r[pk]) : [];
    }

    /** For each rubric row: compile its factor, evaluate it over the population, normalize the results. */
    private async buildWeightedFactors(
        model: mjBizAppsSonarScoreModelEntity,
        anchorIds: string[],
        asOf: Date,
        ctx: FactorEvaluationContext,
        contextUser: UserInfo,
    ): Promise<WeightedFactor[]> {
        const modelFactors = await this.loadRubric(model, contextUser);
        if (modelFactors.length === 0) {
            return [];
        }
        const factorsById = await this.loadFactors(modelFactors, contextUser);

        const weighted: WeightedFactor[] = [];
        for (const mf of modelFactors) {
            const factor = factorsById.get(mf.FactorID);
            if (!factor) {
                throw new Error(
                    `RecomputeOrchestrator: Factor ${mf.FactorID} referenced by the rubric was not found.`,
                );
            }
            const evaluator = await this.compiler.compile(factor, contextUser);
            const results = await evaluator.evaluateBatch(anchorIds, asOf, ctx);
            this.normalizer.normalize(
                this.resolveNormalizationSpec(factor),
                results,
            );
            weighted.push({
                factorId: factor.ID,
                modelFactorId: mf.ID,
                weight: mf.Weight ?? 0,
                results,
            });
        }
        return weighted;
    }

    /** The model's rubric rows (factor bindings + weights). */
    private async loadRubric(
        model: mjBizAppsSonarScoreModelEntity,
        contextUser: UserInfo,
    ): Promise<mjBizAppsSonarModelFactorEntity[]> {
        const rv = new RunView();
        const result = await rv.RunView<mjBizAppsSonarModelFactorEntity>(
            {
                EntityName: "MJ_BizApps_Sonar: Model Factors",
                ExtraFilter: `ScoreModelID='${model.ID}'`,
                ResultType: "entity_object",
            },
            contextUser,
        );
        return result.Success ? (result.Results ?? []) : [];
    }

    /** Batch-load every Factor referenced by the rubric, keyed by ID. */
    private async loadFactors(
        modelFactors: mjBizAppsSonarModelFactorEntity[],
        contextUser: UserInfo,
    ): Promise<Map<string, mjBizAppsSonarFactorEntity>> {
        const idList = modelFactors.map((mf) => `'${mf.FactorID}'`).join(",");
        const rv = new RunView();
        const result = await rv.RunView<mjBizAppsSonarFactorEntity>(
            {
                EntityName: "MJ_BizApps_Sonar: Factors",
                ExtraFilter: `ID IN (${idList})`,
                ResultType: "entity_object",
            },
            contextUser,
        );
        const byId = new Map<string, mjBizAppsSonarFactorEntity>();
        for (const factor of result.Success ? (result.Results ?? []) : []) {
            byId.set(factor.ID, factor);
        }
        return byId;
    }

    /** Resolve a factor's normalization config; fail loud on methods we don't support yet. */
    private resolveNormalizationSpec(
        factor: mjBizAppsSonarFactorEntity,
    ): NormalizationSpec {
        const method = factor.NormalizationMethod ?? "None";
        // Supported population methods. Parameterized methods (Logistic/Banded/Lookup) read
        // NormalizationParamsJSON and aren't wired yet — fail loud rather than silently mis-score.
        if (method !== "None" && method !== "MinMax" && method !== "Percentile" && method !== "ZScore") {
            throw new Error(
                `RecomputeOrchestrator: normalization method '${method}' not supported yet (factor ${factor.ID}).`,
            );
        }
        return {
            method,
            outputMin: factor.OutputMin ?? 0,
            outputMax: factor.OutputMax ?? 1,
            higherIsBetter: factor.HigherIsBetter ?? true,
        };
    }

    /** Resolve the model's score scale + bands into a ScoringSpec. */
    private async resolveScoringSpec(
        model: mjBizAppsSonarScoreModelEntity,
        contextUser: UserInfo,
    ): Promise<ScoringSpec> {
        return {
            scaleMin: model.ScoreScaleMin,
            scaleMax: model.ScoreScaleMax,
            bands: await this.loadBands(model, contextUser),
        };
    }

    /** Load the model's bands (empty when it has no band set). */
    private async loadBands(
        model: mjBizAppsSonarScoreModelEntity,
        contextUser: UserInfo,
    ): Promise<ScoreBandDef[]> {
        if (!model.BandSetID) {
            return [];
        }
        const rv = new RunView();
        const result = await rv.RunView<mjBizAppsSonarScoreBandEntity>(
            {
                EntityName: "MJ_BizApps_Sonar: Score Bands",
                ExtraFilter: `BandSetID='${model.BandSetID}'`,
                ResultType: "entity_object",
            },
            contextUser,
        );
        return (result.Success ? (result.Results ?? []) : []).map((b) => ({
            bandId: b.ID,
            label: b.Label,
            minScore: b.MinScore,
            maxScore: b.MaxScore,
        }));
    }
}
