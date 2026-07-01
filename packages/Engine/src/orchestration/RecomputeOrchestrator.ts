import { LogError, Metadata, RunView, UserInfo } from "@memberjunction/core";
import {
    mjBizAppsSonarScoreModelEntity,
    mjBizAppsSonarModelFactorEntity,
    mjBizAppsSonarFactorEntity,
    mjBizAppsSonarScoreBandEntity,
    mjBizAppsSonarScoreRecomputeRunEntity,
} from "@mj-biz-apps/sonar-entities";
import { FactorEvaluationContext, FactorResult } from "../contracts/IFactorEvaluator";
import { FactorCompiler } from "../factors/FactorCompiler";
import {
    NormalizationEngine,
    resolveNormalizationSpec,
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

/** A draft (unsaved) declarative factor to preview — the factor builder's live config.
 *  Enum fields reuse the Factor entity's own types so they line up on assignment. */
export interface FactorPreviewDraft {
    sourceRelatedEntityID: string;
    aggregation: mjBizAppsSonarFactorEntity["Aggregation"];
    aggregateFieldName?: string;
    filterExpression?: string;
    timeWindowID?: string;
    normalizationMethod: mjBizAppsSonarFactorEntity["NormalizationMethod"];
    higherIsBetter: boolean;
}

/** Result of previewing a draft factor over the live population (no persistence). */
export interface FactorPreviewResult {
    /** Members in the population that had data for this factor. */
    membersWithData: number;
    /** A representative member (the highest raw value), or null if none had data. */
    sampleAnchorId: string | null;
    /** That member's raw aggregate ("matching records"), or null. */
    sampleRawValue: number | null;
    /** That member's normalized contribution (0–1 strength), or null. */
    sampleStrength: number | null;
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
     * Preview an UNSAVED draft factor over the live population without persisting anything —
     * powers the factor builder's live sample. Builds a transient Factor, then compiles +
     * evaluates + normalizes it through the exact same path a real recompute uses (so the
     * preview matches the eventual score), and returns a representative member's raw value +
     * normalized strength.
     */
    public async previewFactor(
        modelId: string,
        draft: FactorPreviewDraft,
        asOf: Date,
        contextUser: UserInfo,
    ): Promise<FactorPreviewResult> {
        const empty: FactorPreviewResult = { membersWithData: 0, sampleAnchorId: null, sampleRawValue: null, sampleStrength: null };
        const model = await this.loadModel(modelId, contextUser);
        const anchorIds = await this.resolvePopulation(model, contextUser);
        if (anchorIds.length === 0) return empty;

        const factor = await this.buildDraftFactor(model, draft, contextUser);
        const evaluator = await this.compiler.compile(factor, contextUser);
        const results = await evaluator.evaluateBatch(anchorIds, asOf, { contextUser });
        this.normalizer.normalize(resolveNormalizationSpec(factor), results);
        return this.summarizeFactorPreview(results);
    }

    /** Build a transient (unsaved) Declarative Factor from the draft config for ad-hoc compile. */
    private async buildDraftFactor(
        model: mjBizAppsSonarScoreModelEntity,
        draft: FactorPreviewDraft,
        contextUser: UserInfo,
    ): Promise<mjBizAppsSonarFactorEntity> {
        const md = new Metadata();
        const factor = await md.GetEntityObject<mjBizAppsSonarFactorEntity>(
            "MJ_BizApps_Sonar: Factors",
            contextUser,
        );
        factor.NewRecord();
        factor.Name = "(preview)";
        factor.FactorType = "Declarative";
        factor.AnchorEntityID = model.AnchorEntityID;
        factor.ScoreModelID = model.ID;
        factor.SourceRelatedEntityID = draft.sourceRelatedEntityID;
        factor.Aggregation = draft.aggregation;
        if (draft.aggregateFieldName) factor.AggregateFieldName = draft.aggregateFieldName;
        if (draft.filterExpression) factor.FilterExpression = draft.filterExpression;
        if (draft.timeWindowID) factor.TimeWindowID = draft.timeWindowID;
        factor.NormalizationMethod = draft.normalizationMethod;
        factor.OutputMin = 0;
        factor.OutputMax = 1;
        factor.HigherIsBetter = draft.higherIsBetter;
        return factor;
    }

    /** Pick the highest-raw-value member with data as the representative sample. */
    private summarizeFactorPreview(results: Map<string, FactorResult>): FactorPreviewResult {
        let sampleId: string | null = null;
        let sampleRaw: number | null = null;
        let sampleStrength: number | null = null;
        let withData = 0;
        for (const [anchorId, r] of results) {
            if (!r.hadData || r.rawValue === null) continue;
            withData++;
            if (sampleRaw === null || r.rawValue > sampleRaw) {
                sampleId = anchorId;
                sampleRaw = r.rawValue;
                sampleStrength = r.normalizedContribution ?? 0;
            }
        }
        return { membersWithData: withData, sampleAnchorId: sampleId, sampleRawValue: sampleRaw, sampleStrength };
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
        // Single-column PK only: the population must be a set of single-column identifiers.
        // Reject composite keys here, where the limitation originates, rather than letting them
        // truncate to PrimaryKeys[0] and surface obscurely later.
        if (anchorEntity.PrimaryKeys.length !== 1) {
            throw new Error(
                `RecomputeOrchestrator: anchor entity '${anchorEntity.Name}' has a ${anchorEntity.PrimaryKeys.length}-column primary key; only single-column primary keys are supported.`,
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
                resolveNormalizationSpec(factor),
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
                // Tidy lowest-first ordering. Boundary determinism is NOT load-bearing here —
                // it's enforced in ScoringEngine.assignBand (half-open ranges), independent of order.
                OrderBy: "MinScore ASC",
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
