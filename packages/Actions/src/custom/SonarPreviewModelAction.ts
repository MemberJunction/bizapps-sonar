import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { Metadata, RunView } from "@memberjunction/core";
import { RecomputeOrchestrator, ScoreResult } from "@mj-biz-apps/sonar-engine";
import { mjBizAppsSonarScoreModelEntity } from "@mj-biz-apps/sonar-entities";

/** One bar of the band distribution returned to the UI. */
interface BandSlice { label: string; count: number; pct: number; }
/** One factor's contribution to the sample member's score. */
interface SampleContribution { modelFactorId: string; factorId: string; value: number; explanation: string | null; }
/** The shape serialized into the `Result` output param (parsed by SonarEngineService). */
interface PreviewPayload {
    totalScored: number;
    bandDistribution: BandSlice[];
    sampleMember: { anchorId: string; score: number; band: string | null; contributions: SampleContribution[] } | null;
}

/**
 * Sonar: Preview Model — computes scores for a model WITHOUT persisting them
 * (RecomputeOrchestrator.computeScores), then summarizes them into a band distribution and a
 * sample member breakdown for the Model Builder's live preview. Read-only; safe on a draft model.
 *
 * Input param:  ModelID (string)
 * Output param: Result  (JSON string of PreviewPayload)
 */
@RegisterClass(BaseAction, "SonarPreviewModel")
export class SonarPreviewModelAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const modelId = this.getInput(params, "ModelID");
        if (!modelId) {
            return { Success: false, ResultCode: "VALIDATION_ERROR", Message: "ModelID is required.", Params: params.Params };
        }
        // Caller-facing preview: verify the caller can READ the anchor entity and every data source
        // wired into the model BEFORE computing anything — the compiled factor read path applies no
        // entity permissions on its own, so this preview must not become a cross-entity read oracle.
        const denied = await this.readPermissionError(params, modelId);
        if (denied) return denied;
        try {
            // 'runview' forces the permission-applying read path for eligible declarative factors
            // (ineligible ones fall back to compiled — which is why the read checks above exist too).
            // allowUnapprovedActions=false: a caller-facing preview must NOT execute un-approved
            // Action-backed factor code — the Approved promotion gate applies here as on persist.
            const scores = await new RecomputeOrchestrator("runview").computeScores(modelId, new Date(), params.ContextUser, false);
            const payload = this.summarize(scores);
            return {
                Success: true,
                ResultCode: "SUCCESS",
                Message: `Previewed ${payload.totalScored} record${payload.totalScored === 1 ? "" : "s"}.`,
                // Type 'Both' (not 'Output') — the MJ ActionResolver only serializes 'Both' params
                // into the GraphQL ResultData the client reads back.
                Params: [...params.Params, { Name: "Result", Value: JSON.stringify(payload), Type: "Both" }],
            };
        } catch (e: unknown) {
            return { Success: false, ResultCode: "ERROR", Message: e instanceof Error ? e.message : String(e), Params: params.Params };
        }
    }

    /** Read-permission gate for the preview: the caller must be able to read the model's anchor
     *  entity AND every data source wired into the model (each factor reads through one of them).
     *  Returns a teaching failure, or null when the caller may proceed. */
    private async readPermissionError(params: RunActionParams, modelId: string): Promise<ActionResultSimple | null> {
        const md = new Metadata();
        const model = await md.GetEntityObject<mjBizAppsSonarScoreModelEntity>("MJ_BizApps_Sonar: Score Models", params.ContextUser);
        if (!(await model.Load(modelId))) {
            return this.fail(params, "VALIDATION_ERROR", `No model found for ID '${modelId}'.`);
        }
        const anchor = md.EntityByID(model.AnchorEntityID);
        if (!anchor) {
            return this.fail(params, "ERROR", `Anchor entity ${model.AnchorEntityID} not found in metadata.`);
        }
        const anchorDenied = this.requireEntityRead(params, anchor.Name, `the model's anchor entity ('${anchor.Name}')`);
        if (anchorDenied) return anchorDenied;

        const res = await new RunView().RunView<{ RelatedEntityID: string }>(
            {
                EntityName: "MJ_BizApps_Sonar: Model Related Entities",
                ExtraFilter: `ScoreModelID='${this.sqlString(modelId)}'`,
                ResultType: "simple",
                Fields: ["RelatedEntityID"],
            },
            params.ContextUser,
        );
        if (!res.Success) {
            return this.fail(params, "ERROR", `Could not load the model's data sources: ${res.ErrorMessage ?? "unknown error"}`);
        }
        for (const row of res.Results ?? []) {
            const source = md.EntityByID(row.RelatedEntityID);
            if (!source) {
                return this.fail(params, "ERROR", `Source entity ${row.RelatedEntityID} not found in metadata.`);
            }
            const sourceDenied = this.requireEntityRead(params, source.Name, `a data source of this model ('${source.Name}')`);
            if (sourceDenied) return sourceDenied;
        }
        return null;
    }

    /** Roll a score map up into a band distribution + one sample member breakdown. */
    private summarize(scores: Map<string, ScoreResult>): PreviewPayload {
        const total = scores.size;
        return {
            totalScored: total,
            bandDistribution: this.bandDistribution(scores, total),
            sampleMember: this.sampleMember(scores),
        };
    }

    /** Count anchors per band label and convert to percentages. */
    private bandDistribution(scores: Map<string, ScoreResult>, total: number): BandSlice[] {
        const counts = new Map<string, number>();
        for (const result of scores.values()) {
            const label = result.bandLabel ?? "Unscored";
            counts.set(label, (counts.get(label) ?? 0) + 1);
        }
        return [...counts.entries()].map(([label, count]) => ({
            label,
            count,
            pct: total === 0 ? 0 : Math.round((count / total) * 100),
        }));
    }

    /** Pick the first anchor and return its score + its largest contributions. */
    private sampleMember(scores: Map<string, ScoreResult>): PreviewPayload["sampleMember"] {
        const first = scores.entries().next();
        if (first.done) return null;
        const [anchorId, result] = first.value;
        const contributions = [...result.contributions]
            .sort((a, b) => Math.abs(b.weightedValue) - Math.abs(a.weightedValue))
            .slice(0, 5)
            .map((c) => ({ modelFactorId: c.modelFactorId, factorId: c.factorId, value: Math.round(c.weightedValue * 100) / 100, explanation: c.explanation }));
        return { anchorId, score: Math.round(result.normalizedScore), band: result.bandLabel, contributions };
    }
}
