import { Injectable } from "@angular/core";

/** Result of validating/previewing a single factor (the "Sonar: Validate Factor" Action). */
export interface ValidateFactorResult {
    valid: boolean;
    errors: string[];
    matching: number;
    strength: number;
    explanation: string;
}
/** Result of previewing a whole model on a sample ("Sonar: Preview Model"). */
export interface PreviewModelResult {
    bandDistribution: { label: string; pct: number }[];
    sampleMember: { name: string; score: number; band: string; delta: number; contributions: { label: string; value: number }[] };
    errors: string[];
}
/** Result of a full recompute ("Sonar: Recompute Model"). */
export interface RecomputeResult { runId: string; status: string; recordsScored: number; errors: string[]; }
/** Result of publishing a model version ("Sonar: Publish Model"). */
export interface PublishResult { ok: boolean; versionNumber: number; errors: string[]; }

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
 * The seam between the Sonar UI and the server-side scoring engine. The engine runs raw SQL
 * on the API tier (it cannot run in the browser), so these calls will go through MJ Actions
 * (GraphQLActionClient.RunAction) once `sonar_engine` + the Action wrappers land.
 *
 * For now this is a STUB returning deterministic sample results, so the builder previews,
 * Simulate, Recompute, and Publish buttons are fully clickable. Swapping to the real
 * implementation is a one-file change — the method signatures are the contract.
 */
@Injectable({ providedIn: "root" })
export class SonarEngineService {
    /** TODO wire: RunAction("Sonar: Validate Factor", draft) once the Action exists. */
    public async validateFactor(_draft: FactorDraft): Promise<ValidateFactorResult> {
        return { valid: true, errors: [], matching: 14, strength: 0.62, explanation: "14 matching records — stronger than most of the group." };
    }

    /** TODO wire: RunAction("Sonar: Preview Model", { modelId }). */
    public async previewModel(_modelId: string): Promise<PreviewModelResult> {
        return {
            bandDistribution: [
                { label: "Healthy", pct: 61 },
                { label: "Watch", pct: 22 },
                { label: "At-Risk", pct: 12 },
                { label: "Critical", pct: 5 },
            ],
            sampleMember: {
                name: "Maria Chen", score: 73, band: "At-Risk", delta: -12,
                contributions: [
                    { label: "Cert lapsed", value: -22 },
                    { label: "Newsletter decay", value: -15 },
                    { label: "Events", value: 8 },
                    { label: "Dues on time", value: 5 },
                ],
            },
            errors: [],
        };
    }

    /** TODO wire: RunAction("Sonar: Recompute Model", { versionId }). */
    public async recompute(_versionId: string): Promise<RecomputeResult> {
        return { runId: "sample-run", status: "Succeeded", recordsScored: 38402, errors: [] };
    }

    /**
     * TODO wire: publish via the ScoreModelEntityServer snapshot hook (sonar_server_hooks)
     * or a "Sonar: Publish Model" Action. Stubbed until that lands.
     */
    public async publish(_modelId: string): Promise<PublishResult> {
        return { ok: true, versionNumber: 4, errors: [] };
    }
}
