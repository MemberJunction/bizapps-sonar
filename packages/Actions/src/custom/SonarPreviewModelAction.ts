import { ActionResultSimple, RunActionParams, ActionParam } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { RegisterClass } from "@memberjunction/global";
import { RecomputeOrchestrator, ScoreResult } from "@mj-biz-apps/sonar-engine";

/** One bar of the band distribution returned to the UI. */
interface BandSlice { label: string; count: number; pct: number; }
/** One factor's contribution to the sample member's score. */
interface SampleContribution { modelFactorId: string; factorId: string; value: number; }
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
export class SonarPreviewModelAction extends BaseAction {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const modelId = this.getInput(params, "ModelID");
        if (!modelId) {
            return { Success: false, ResultCode: "VALIDATION_ERROR", Message: "ModelID is required.", Params: params.Params };
        }
        try {
            const scores = await new RecomputeOrchestrator().computeScores(modelId, new Date(), params.ContextUser);
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

    /** Read a single input param's value as a string (null when absent/empty). */
    private getInput(params: RunActionParams, name: string): string | null {
        const p = params.Params.find((x: ActionParam) => x.Name === name);
        return p?.Value != null && p.Value !== "" ? String(p.Value) : null;
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
            .map((c) => ({ modelFactorId: c.modelFactorId, factorId: c.factorId, value: Math.round(c.weightedValue * 100) / 100 }));
        return { anchorId, score: Math.round(result.normalizedScore), band: result.bandLabel, contributions };
    }
}
