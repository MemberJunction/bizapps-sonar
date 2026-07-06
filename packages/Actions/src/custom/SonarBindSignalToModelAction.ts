import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { Metadata, UserInfo } from "@memberjunction/core";
import { MJActionEntity } from "@memberjunction/core-entities";
import { mjBizAppsSonarFactorEntity, mjBizAppsSonarModelFactorEntity, mjBizAppsSonarScoreModelEntity } from "@mj-biz-apps/sonar-entities";

const FACTOR = "MJ_BizApps_Sonar: Factors";
const MODEL_FACTOR = "MJ_BizApps_Sonar: Model Factors";
const SCORE_MODEL = "MJ_BizApps_Sonar: Score Models";

const WEIGHT_MODES = ["Additive", "Penalty"] as const;
const NORMALIZATIONS = ["MinMax", "Percentile", "ZScore", "None", "Logistic", "Banded", "Lookup"] as const;
type WeightMode = (typeof WEIGHT_MODES)[number];

/**
 * Sonar: Bind Signal To Model — drop an APPROVED custom signal (a Runtime factor-action authored in the
 * Signal Studio) into a Draft model's rubric. Creates an ActionBacked Factor pointing at the signal's
 * action + a Model Factor binding with a weight, mirroring SonarCreateFactor's write path so the studio
 * and the model builder share one seam.
 *
 * Two governance guards, both fail-loud:
 *  - The model must be Draft (published config is immutable) — `modelEditableError`.
 *  - The signal's code must be Approved — the engine only scores approved action-factors, so binding an
 *    un-approved signal would create a factor that can never move persisted scores. We stop it up front.
 *
 * Input params:  ActionID (the approved signal), ModelID (a Draft model), Weight? (0..1), Name? (override),
 *                HigherIsBetter? (bool), NormalizationMethod? (defaults MinMax)
 * Output param:  Result (Both, JSON: { factorID, modelFactorID })
 */
@RegisterClass(BaseAction, "SonarBindSignalToModel")
export class SonarBindSignalToModelAction extends SonarActionBase {
    private saveError = "save returned false";

    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const actionId = this.getInput(params, "ActionID");
        const modelId = this.getInput(params, "ModelID");
        if (!actionId || !modelId) return this.fail(params, "VALIDATION_ERROR", "ActionID (the signal) and ModelID are required.");

        const locked = await this.modelEditableError(params, modelId);
        if (locked) return locked;

        try {
            const signal = await this.loadSignal(actionId, params.ContextUser);
            if (!signal) return this.fail(params, "NOT_FOUND", `Signal '${actionId}' wasn't found.`);
            // Code-approval gate applies only to Runtime (Codesmith-authored) signals — compiled factor-
            // actions live in the codebase and are inherently trusted, so they carry no CodeApprovalStatus.
            if (signal.Type === "Runtime" && signal.CodeApprovalStatus !== "Approved") {
                return this.failWithFix(params, "ERROR",
                    `Signal '${signal.Name}' is ${signal.CodeApprovalStatus ?? "not approved"}; the engine only scores approved signals.`,
                    "approve the signal in the Signal Studio (after testing it) before binding it into a model.");
            }

            const anchorEntityID = await this.resolveAnchor(modelId, params.ContextUser);
            if (!anchorEntityID) return this.fail(params, "NOT_FOUND", `Model '${modelId}' not found (or has no anchor).`);

            const factor = await this.createActionFactor(modelId, anchorEntityID, actionId, signal.Name, params);
            if (!factor) return this.fail(params, "ERROR", `Failed to save the factor: ${this.saveError}`);

            const mf = await this.bindToModel(modelId, factor.ID, params);
            if (!mf) return this.fail(params, "ERROR", `Factor created but binding it to the model failed: ${this.saveError}`);

            return this.ok(params, `Bound '${factor.Name}' into the model.`, { factorID: factor.ID, modelFactorID: mf.ID });
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    private async loadSignal(actionId: string, contextUser?: UserInfo): Promise<MJActionEntity | null> {
        const action = await new Metadata().GetEntityObject<MJActionEntity>("MJ: Actions", contextUser);
        await action.Load(actionId);
        return action.IsSaved ? action : null;
    }

    private async resolveAnchor(modelId: string, contextUser?: UserInfo): Promise<string | null> {
        const model = await new Metadata().GetEntityObject<mjBizAppsSonarScoreModelEntity>(SCORE_MODEL, contextUser);
        await model.Load(modelId);
        return model.IsSaved ? model.AnchorEntityID : null;
    }

    /** Create the ActionBacked Factor pointing at the signal's action (per-record execution). */
    private async createActionFactor(
        modelId: string,
        anchorEntityID: string,
        actionId: string,
        signalName: string,
        params: RunActionParams,
    ): Promise<mjBizAppsSonarFactorEntity | null> {
        const name = this.getInput(params, "Name")?.trim() || signalName;
        const md = new Metadata();
        const factor = await md.GetEntityObject<mjBizAppsSonarFactorEntity>(FACTOR, params.ContextUser);
        factor.NewRecord();
        factor.Name = name;
        factor.Slug = this.slugify(name);
        factor.FactorType = "ActionBacked";
        factor.AnchorEntityID = anchorEntityID;
        factor.ScoreModelID = modelId;
        factor.ActionID = actionId;
        factor.ExecutionMode = "PerRecord";
        factor.NormalizationMethod = this.asEnum(this.getInput(params, "NormalizationMethod"), NORMALIZATIONS) ?? "MinMax";
        factor.HigherIsBetter = this.getInput(params, "HigherIsBetter") !== "false";
        if (await factor.Save()) return factor;
        this.saveError = this.errOf(factor);
        return null;
    }

    private async bindToModel(modelId: string, factorId: string, params: RunActionParams): Promise<mjBizAppsSonarModelFactorEntity | null> {
        const md = new Metadata();
        const mf = await md.GetEntityObject<mjBizAppsSonarModelFactorEntity>(MODEL_FACTOR, params.ContextUser);
        mf.NewRecord();
        mf.ScoreModelID = modelId;
        mf.FactorID = factorId;
        mf.Weight = this.clampWeight(Number(this.getInput(params, "Weight")));
        mf.WeightMode = "Additive" as WeightMode;
        if (await mf.Save()) return mf;
        this.saveError = this.errOf(mf);
        return null;
    }

    private asEnum<T extends string>(value: string | null | undefined, allowed: readonly T[]): T | null {
        return value != null && (allowed as readonly string[]).includes(value) ? (value as T) : null;
    }

    /** Keep weight in [0, 1]; default 0.25 when absent/invalid. */
    private clampWeight(weight: number): number {
        if (!Number.isFinite(weight)) return 0.25;
        return Math.min(1, Math.max(0, weight));
    }

    private slugify(name: string): string {
        return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }
}
