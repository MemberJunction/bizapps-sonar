import { EntityInfo, LogError, Metadata, RunView, UserInfo } from "@memberjunction/core";
import {
    compileFilterInline,
    CompositeFilterDescriptor,
} from "../factors/filter";
import {
    mjBizAppsSonarScoreModelEntity,
    mjBizAppsSonarModelFactorEntity,
    mjBizAppsSonarFactorEntity,
    mjBizAppsSonarScoreBandEntity,
    mjBizAppsSonarScoreRecomputeRunEntity,
} from "@mj-biz-apps/sonar-entities";
import { FactorEvaluationContext, FactorResult } from "../contracts/IFactorEvaluator";
import { FactorCompiler } from "../factors/FactorCompiler";
import { AnchorKey, compositeKeyForRow, toAnchorKey } from "../factors/anchorKey";
import { createActionRunner } from "../factors/actionRunner";
import {
    NormalizationEngine,
    NormalizationSpec,
    parseNormalizationParams,
} from "../normalization/NormalizationEngine";
import {
    EffectiveMissingDataPolicy,
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
    /** NormalizationParamsJSON for parameterized methods (Logistic/Banded/Lookup). */
    normalizationParamsJSON?: string;
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
    private readonly compiler = new FactorCompiler(createActionRunner());
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
        return (await this.computeForModel(model, asOf, contextUser)).scores;
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
        const anchors = await this.resolvePopulation(model, contextUser);
        if (anchors.length === 0) return empty;

        const factor = await this.buildDraftFactor(model, draft, contextUser);
        const evaluator = await this.compiler.compile(factor, contextUser);
        const results = await evaluator.evaluateBatch(anchors, asOf, { contextUser });
        this.normalizer.normalize(this.resolveNormalizationSpec(factor), results);
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
        if (draft.normalizationParamsJSON) factor.NormalizationParamsJSON = draft.normalizationParamsJSON;
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
            const { scores, anchorKeys } = await this.computeForModel(model, asOf, contextUser);
            const recordsScored = await this.writer.write(
                model,
                model.CurrentVersionID,
                scores,
                asOf,
                contextUser,
                run.ID,
                anchorKeys,
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

    /** The shared pipeline: population → evaluate + normalize each factor → combine. Returns the
     *  scores AND the resolved AnchorKeys (so the writer can persist AnchorRecordKeyJSON). */
    private async computeForModel(
        model: mjBizAppsSonarScoreModelEntity,
        asOf: Date,
        contextUser: UserInfo,
    ): Promise<{ scores: Map<string, ScoreResult>; anchorKeys: AnchorKey[] }> {
        const anchorKeys = await this.resolvePopulation(model, contextUser);
        if (anchorKeys.length === 0) {
            return { scores: new Map(), anchorKeys };
        }
        const ctx: FactorEvaluationContext = { contextUser };
        const factors = await this.buildWeightedFactors(
            model,
            anchorKeys,
            asOf,
            ctx,
            contextUser,
        );
        const scoringSpec = await this.resolveScoringSpec(model, contextUser);
        const scores = this.scorer.score(scoringSpec, factors, anchorKeys.map((a) => a.id));
        return { scores, anchorKeys };
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

    /** The population to score (v1: every record of the anchor entity), each as an AnchorKey built
     *  from the anchor's full primary key — so single- AND composite-PK anchors are both supported. */
    private async resolvePopulation(
        model: mjBizAppsSonarScoreModelEntity,
        contextUser: UserInfo,
    ): Promise<AnchorKey[]> {
        const md = new Metadata();
        const anchorEntity = md.EntityByID(model.AnchorEntityID);
        if (!anchorEntity) {
            throw new Error(
                `RecomputeOrchestrator: anchor entity ${model.AnchorEntityID} not found in metadata.`,
            );
        }
        const pkFields = anchorEntity.PrimaryKeys.map((pk) => pk.Name);
        const extraFilter = this.compilePopulationFilter(model, anchorEntity);
        const rv = new RunView();
        // Record<string, unknown> (not string): an anchor PK can be int/uuid/string, and CompositeKey
        // preserves each value's type — so the row map must not pre-coerce everything to string.
        const result = await rv.RunView<Record<string, unknown>>(
            {
                EntityName: anchorEntity.Name,
                ResultType: "simple",
                Fields: pkFields,
                ExtraFilter: extraFilter ?? undefined,
                // Score the WHOLE population — RunView otherwise caps at the entity's
                // UserViewMaxRows (1000), which would silently leave most members unscored.
                // (A future scale path batches/paginates; for now we resolve all anchor keys.)
                IgnoreMaxRows: true,
            },
            contextUser,
        );
        if (!result.Success) {
            return [];
        }
        return (result.Results ?? []).map((row) =>
            toAnchorKey(compositeKeyForRow(anchorEntity, row)),
        );
    }

    /** Compile ScoreModel.PopulationFilter (a Kendo filter JSON over the anchor's own fields) into
     *  a RunView ExtraFilter. Reuses compileFilter for field validation + structure, then inlines
     *  the parameters as escaped literals because RunView's ExtraFilter has no parameter binding.
     *  Returns null when the model has no population filter (the whole anchor entity is scored). */
    private compilePopulationFilter(
        model: mjBizAppsSonarScoreModelEntity,
        anchorEntity: EntityInfo,
    ): string | null {
        const raw = model.PopulationFilter;
        if (!raw || raw.trim().length === 0) {
            return null;
        }
        let parsed: CompositeFilterDescriptor;
        try {
            parsed = JSON.parse(raw) as CompositeFilterDescriptor;
        } catch {
            throw new Error(
                `RecomputeOrchestrator: ScoreModel ${model.ID} has an invalid PopulationFilter (not valid JSON).`,
            );
        }
        const validColumns = anchorEntity.Fields.map((f) => f.Name);
        return compileFilterInline(parsed, validColumns);
    }

    /** For each rubric row: compile its factor, evaluate it over the population, normalize the results. */
    private async buildWeightedFactors(
        model: mjBizAppsSonarScoreModelEntity,
        anchors: AnchorKey[],
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
            // Governance gate: an Action-backed factor runs arbitrary code, so it must be promoted
            // to Approved before it can move real scores. (Drafts can still be tried in preview.)
            if (factor.FactorType === "ActionBacked" && factor.PromotionState !== "Approved") {
                throw new Error(
                    `RecomputeOrchestrator: Action-backed factor '${factor.Name}' must be Approved before scoring (PromotionState is '${factor.PromotionState ?? "Draft"}').`,
                );
            }
            const evaluator = await this.compiler.compile(factor, contextUser);
            const results = await evaluator.evaluateBatch(anchors, asOf, ctx);
            this.normalizer.normalize(
                this.resolveNormalizationSpec(factor),
                results,
            );
            weighted.push({
                factorId: factor.ID,
                modelFactorId: mf.ID,
                weight: mf.Weight ?? 0,
                missingDataPolicy: this.resolveMissingDataPolicy(mf),
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

    /** Resolve a factor's normalization config. Parameterized methods (Logistic/Banded/Lookup)
     *  read + validate NormalizationParamsJSON; the pure methods take no params. parse* throws
     *  loud on missing/malformed config rather than letting a bad shape mis-score. */
    private resolveNormalizationSpec(
        factor: mjBizAppsSonarFactorEntity,
    ): NormalizationSpec {
        const method = factor.NormalizationMethod ?? "None";
        return {
            method,
            outputMin: factor.OutputMin ?? 0,
            outputMax: factor.OutputMax ?? 1,
            higherIsBetter: factor.HigherIsBetter ?? true,
            params: parseNormalizationParams(method, factor.NormalizationParamsJSON),
        };
    }

    /** Resolve a factor's missing-data policy. The schema default "ModelDefault" resolves to
     *  "Zero": no data on an engagement signal means genuinely zero activity, so it should pull
     *  the score down — and fully-missing members still surface at the floor rather than
     *  vanishing from the run. Per-factor "Exclude"/"NeutralMidpoint" override this. */
    private resolveMissingDataPolicy(
        modelFactor: mjBizAppsSonarModelFactorEntity,
    ): EffectiveMissingDataPolicy {
        const policy = modelFactor.MissingDataPolicy ?? "ModelDefault";
        return policy === "ModelDefault" ? "Zero" : policy;
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
