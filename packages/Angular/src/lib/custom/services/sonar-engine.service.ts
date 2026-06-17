import { Injectable } from "@angular/core";
import { Metadata } from "@memberjunction/core";
import { GraphQLActionClient, GraphQLDataProvider } from "@memberjunction/graphql-dataprovider";
import type { ActionParam } from "@memberjunction/actions-base";

/** Action IDs — fixed in metadata/actions/.sonar-actions.json (pushed via mj sync). */
const PREVIEW_MODEL_ACTION_ID = "5044A100-0001-4000-8000-000000000001";
const RECOMPUTE_MODEL_ACTION_ID = "5044A100-0002-4000-8000-000000000002";

/** One bar of a model's band distribution. */
export interface PreviewBand { label: string; count: number; pct: number; }
/** One factor's contribution to the sample member's score. */
export interface PreviewContribution { modelFactorId: string; factorId: string; value: number; }
/** The sample-member breakdown returned by the preview. */
export interface PreviewSample { anchorId: string; score: number; band: string | null; contributions: PreviewContribution[]; }
/** Result of previewing a whole model ("Sonar: Preview Model"). */
export interface PreviewModelResult {
    totalScored: number;
    bandDistribution: PreviewBand[];
    sampleMember: PreviewSample | null;
    errors: string[];
}
/** Result of a full recompute ("Sonar: Recompute Model"). */
export interface RecomputeResult { runId: string; status: string; recordsScored: number; errors: string[]; }

/** Result of validating/previewing a single factor (the future "Sonar: Validate Factor" Action). */
export interface ValidateFactorResult { valid: boolean; errors: string[]; matching: number; strength: number; explanation: string; }
/** Draft factor config the preview validates (the unsaved builder state). */
export interface FactorDraft {
    aggregation: string;
    sourceRelatedEntityID?: string;
    aggregateFieldName?: string;
    filterExpression?: string;
    timeWindowID?: string;
    normalizationMethod: string;
    higherIsBetter: boolean;
}

/**
 * The seam between the Sonar UI and the server-side scoring engine. The engine runs raw SQL on
 * the API tier (it cannot run in the browser), so these calls go through MJ Actions
 * (GraphQLActionClient.RunAction) wired to the engine's RecomputeOrchestrator:
 *   - previewModel → "Sonar: Preview Model"   (computeScores, no persistence)
 *   - recompute    → "Sonar: Recompute Model" (recompute, persists; needs a published model)
 *
 * validateFactor still returns an indicative sample — the "Sonar: Validate Factor" Action
 * (compiling an unsaved draft factor) is not built yet.
 */
@Injectable({ providedIn: "root" })
export class SonarEngineService {
    /** A GraphQLActionClient over the app's active data provider. */
    private actionClient(): GraphQLActionClient {
        return new GraphQLActionClient(Metadata.Provider as GraphQLDataProvider);
    }

    /** Read an output param's value off an action result and JSON-parse it. */
    private parseResult<T>(params: ActionParam[] | undefined, name: string): T | null {
        const raw = params?.find((p) => p.Name === name)?.Value;
        if (raw == null) return null;
        return (typeof raw === "string" ? JSON.parse(raw) : raw) as T;
    }

    /** Preview a model: compute scores (no persistence) and summarize into bands + a sample member. */
    public async previewModel(modelId: string): Promise<PreviewModelResult> {
        const empty: PreviewModelResult = { totalScored: 0, bandDistribution: [], sampleMember: null, errors: [] };
        const result = await this.actionClient().RunAction(PREVIEW_MODEL_ACTION_ID, [
            { Name: "ModelID", Value: modelId, Type: "Input" },
        ]);
        if (!result.Success) {
            return { ...empty, errors: [result.Message || "Preview failed."] };
        }
        const payload = this.parseResult<Omit<PreviewModelResult, "errors">>(result.Params, "Result");
        return payload ? { ...payload, errors: [] } : empty;
    }

    /** Recompute a model: compute AND persist a full run (requires a published model). */
    public async recompute(modelId: string): Promise<RecomputeResult> {
        const result = await this.actionClient().RunAction(RECOMPUTE_MODEL_ACTION_ID, [
            { Name: "ModelID", Value: modelId, Type: "Input" },
        ]);
        if (!result.Success) {
            return { runId: "", status: "Failed", recordsScored: 0, errors: [result.Message || "Recompute failed."] };
        }
        const payload = this.parseResult<{ runId: string; status: string; recordsScored: number }>(result.Params, "Result");
        return payload ? { ...payload, errors: [] } : { runId: "", status: "Unknown", recordsScored: 0, errors: [] };
    }

    /**
     * TODO wire: the "Sonar: Validate Factor" Action (compile an unsaved draft factor and
     * evaluate it on a sample). Not built yet — returns an indicative sample for the builder.
     */
    public async validateFactor(_draft: FactorDraft): Promise<ValidateFactorResult> {
        return { valid: true, errors: [], matching: 14, strength: 0.62, explanation: "14 matching records — stronger than most of the group." };
    }
}
