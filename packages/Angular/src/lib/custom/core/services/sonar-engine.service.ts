import { Injectable } from "@angular/core";
import { Metadata } from "@memberjunction/core";
import { ActionEngineBase } from "@memberjunction/actions-base";
import { GraphQLActionClient, GraphQLDataProvider } from "@memberjunction/graphql-dataprovider";

/** Actions are invoked by their registered Name — the engine resolves the ID at runtime
 *  (RunAction needs the ID, but we key on the stable name, not a hardcoded UUID). */
const ACTION_PREVIEW_MODEL = "Sonar: Preview Model";
const ACTION_RECOMPUTE_MODEL = "Sonar: Recompute Model";
const ACTION_VALIDATE_FACTOR = "Sonar: Validate Factor";
const ACTION_RUN_INTERVENTION = "Sonar: Run Intervention";

/** One bar of a model's band distribution. */
export interface PreviewBand { label: string; count: number; pct: number; }
/** One factor's contribution to the sample member's score. */
export interface PreviewContribution { modelFactorId: string; factorId: string; value: number; explanation: string | null; }
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

/** Result of validating/previewing a single draft factor ("Sonar: Validate Factor"). */
export interface ValidateFactorResult { valid: boolean; errors: string[]; matching: number; strength: number; explanation: string; anchorId: string | null; membersWithData: number; }

/** The counts an intervention run (or preview) returns — the engine's InterventionRunResult. */
export interface InterventionRunCounts {
    cohortSize: number; alreadyAssigned: number; eligible: number; capped: boolean;
    treated: number; held: number; sent: number; failed: number; preview: boolean;
}
/** What the Engagement Manager sends to fire (or preview) an on-the-fly intervention. */
export interface RunInterventionInput {
    modelId: string;
    segmentName: string;
    /** Score-evaluable cohort filter (band + score range) — the score-only subset of the EM view. */
    filter: { bandId?: string | null; minScore?: number | null; maxScore?: number | null };
    interventionName: string;
    holdoutPercent: number;
    /** Registered name of the MJ Action to fire (e.g. "Slack Webhook"). */
    actionName: string;
    /** Static params for that action (e.g. WebhookURL + Message; "{{member}}" → each member's id). */
    actionParams: { name: string; value: string }[];
    cap: number;
}
/** Raw payload returned by the Validate Factor Action (engine FactorPreviewResult). */
interface FactorPreviewPayload { membersWithData: number; sampleAnchorId: string | null; sampleRawValue: number | null; sampleStrength: number | null; }
/** Draft factor config the preview validates (the unsaved builder state). */
export interface FactorDraft {
    aggregation: string;
    sourceRelatedEntityID?: string;
    aggregateFieldName?: string;
    filterExpression?: string;
    timeWindowID?: string;
    normalizationMethod: string;
    /** Params for a fixed-shape method (Logistic/Banded/Lookup); the engine's previewFactor reads it. */
    normalizationParamsJSON?: string;
    higherIsBetter: boolean;
}

/**
 * The seam between the Sonar UI and the server-side scoring engine. The engine runs raw SQL on
 * the API tier (it cannot run in the browser), so these calls go through MJ Actions
 * (GraphQLActionClient.RunAction) wired to the engine's RecomputeOrchestrator:
 *   - previewModel  → "Sonar: Preview Model"    (computeScores, no persistence)
 *   - recompute     → "Sonar: Recompute Model"  (recompute, persists; needs a published model)
 *   - validateFactor→ "Sonar: Validate Factor"  (previewFactor — evaluate an unsaved draft factor)
 *
 * Actions are invoked by registered Name (resolveActionId looks up the ID, cached) so nothing
 * hardcodes a UUID.
 */
@Injectable({ providedIn: "root" })
export class SonarEngineService {
    /** A GraphQLActionClient over the app's active data provider. */
    private actionClient(): GraphQLActionClient {
        return new GraphQLActionClient(Metadata.Provider as GraphQLDataProvider);
    }

    /** name → ID cache so we resolve each action's ID once. */
    private readonly actionIdCache = new Map<string, string>();

    /**
     * Resolve (and cache) an Action's ID from its registered Name. RunAction keys on the ID,
     * but we look it up by the stable Name via the cached ActionEngine catalog (MJ's idiomatic
     * pattern) so nothing hardcodes a UUID — the metadata seed owns IDs, the client owns names.
     */
    private async resolveActionId(name: string): Promise<string | null> {
        const cached = this.actionIdCache.get(name);
        if (cached) return cached;
        const provider = Metadata.Provider as GraphQLDataProvider;
        await ActionEngineBase.Instance.Config(false, provider.CurrentUser, provider);
        const action = ActionEngineBase.Instance.Actions.find((a) => a.Name === name);
        if (action) this.actionIdCache.set(name, action.ID);
        return action?.ID ?? null;
    }

    /**
     * Extract our `Result` output from an action result. MJ's RunAction returns output params
     * via GraphQL `ResultData` (surfaced as `result.Result` after JSON-parsing) — NOT via
     * `result.Params` (that's the echoed input). The server serializes params marked Type 'Both';
     * `Result` arrives either as `[{ Name:'Result', Value:<json> }]` or keyed by name — handle both.
     */
    private extractResult<T>(result: { Result?: unknown }): T | null {
        const data = result.Result;
        if (data == null) return null;
        // MJ serializes the 'Both' params either as an array or an index-keyed object
        // ({"0": {Name, Value}}); normalize to a list and pull the "Result" param's Value.
        const entries = (Array.isArray(data) ? data : typeof data === "object" ? Object.values(data) : []) as Array<{ Name?: string; Value?: unknown }>;
        const param = entries.find((p) => p && typeof p === "object" && p.Name === "Result");
        let raw: unknown = param ? param.Value : data;
        if (raw == null) return null;
        return (typeof raw === "string" ? JSON.parse(raw) : raw) as T;
    }

    /** Preview a model: compute scores (no persistence) and summarize into bands + a sample member. */
    public async previewModel(modelId: string): Promise<PreviewModelResult> {
        const empty: PreviewModelResult = { totalScored: 0, bandDistribution: [], sampleMember: null, errors: [] };
        const actionId = await this.resolveActionId(ACTION_PREVIEW_MODEL);
        if (!actionId) return { ...empty, errors: [`Action '${ACTION_PREVIEW_MODEL}' not found.`] };
        const result = await this.actionClient().RunAction(actionId, [
            { Name: "ModelID", Value: modelId, Type: "Input" },
        ]);
        if (!result.Success) {
            return { ...empty, errors: [result.Message || "Preview failed."] };
        }
        const payload = this.extractResult<Omit<PreviewModelResult, "errors">>(result);
        return payload ? { ...payload, errors: [] } : empty;
    }

    /** Recompute a model: compute AND persist a full run (requires a published model). */
    public async recompute(modelId: string): Promise<RecomputeResult> {
        const actionId = await this.resolveActionId(ACTION_RECOMPUTE_MODEL);
        if (!actionId) return { runId: "", status: "Failed", recordsScored: 0, errors: [`Action '${ACTION_RECOMPUTE_MODEL}' not found.`] };
        const result = await this.actionClient().RunAction(actionId, [
            { Name: "ModelID", Value: modelId, Type: "Input" },
        ]);
        if (!result.Success) {
            return { runId: "", status: "Failed", recordsScored: 0, errors: [result.Message || "Recompute failed."] };
        }
        const payload = this.extractResult<{ runId: string; status: string; recordsScored: number }>(result);
        return payload ? { ...payload, errors: [] } : { runId: "", status: "Unknown", recordsScored: 0, errors: [] };
    }

    /**
     * Preview a draft factor on the live population via the "Sonar: Validate Factor" Action
     * (engine previewFactor — same compile→evaluate→normalize path as a real recompute, so the
     * numbers match the eventual score). Returns a representative member's matching count +
     * normalized strength. `draft` must include `sourceRelatedEntityID`.
     */
    public async validateFactor(modelId: string, draft: FactorDraft): Promise<ValidateFactorResult> {
        const empty: ValidateFactorResult = { valid: false, errors: [], matching: 0, strength: 0, explanation: "", anchorId: null, membersWithData: 0 };
        const actionId = await this.resolveActionId(ACTION_VALIDATE_FACTOR);
        if (!actionId) return { ...empty, errors: [`Action '${ACTION_VALIDATE_FACTOR}' not found.`] };
        const result = await this.actionClient().RunAction(actionId, [
            { Name: "ModelID", Value: modelId, Type: "Input" },
            { Name: "DraftJSON", Value: JSON.stringify(draft), Type: "Input" },
        ]);
        if (!result.Success) {
            return { ...empty, errors: [result.Message || "Preview failed."] };
        }
        const payload = this.extractResult<FactorPreviewPayload>(result);
        if (!payload || payload.sampleRawValue === null) {
            return { ...empty, valid: true, explanation: "No members have data for this signal yet." };
        }
        const strength = Math.round((payload.sampleStrength ?? 0) * 100) / 100;
        return {
            valid: true,
            errors: [],
            matching: payload.sampleRawValue,
            strength,
            explanation: `Across ${payload.membersWithData} member${payload.membersWithData === 1 ? "" : "s"} with data, the strongest measures ${payload.sampleRawValue}.`,
            anchorId: payload.sampleAnchorId,
            membersWithData: payload.membersWithData,
        };
    }

    /**
     * Run (or preview) an on-the-fly intervention via "Sonar: Run Intervention". `preview: true`
     * resolves the cohort + treated/held split and fires NOTHING (the dry-run gate); `preview: false`
     * commits — writes assignments + fires the chosen action for treated members. Resolves both the
     * Run-Intervention action and the chosen messaging action (e.g. Slack Webhook) by name.
     */
    public async runIntervention(
        input: RunInterventionInput,
        preview: boolean,
    ): Promise<{ counts: InterventionRunCounts | null; errors: string[] }> {
        const runId = await this.resolveActionId(ACTION_RUN_INTERVENTION);
        if (!runId) return { counts: null, errors: [`Action '${ACTION_RUN_INTERVENTION}' not found.`] };
        const actionId = await this.resolveActionId(input.actionName);
        if (!actionId) return { counts: null, errors: [`Action '${input.actionName}' not found.`] };

        const config = {
            modelId: input.modelId,
            segment: { name: input.segmentName, filter: input.filter },
            intervention: { name: input.interventionName, holdoutPercent: input.holdoutPercent },
            action: { actionId, params: input.actionParams },
            cap: input.cap,
            preview,
        };
        const result = await this.actionClient().RunAction(runId, [
            { Name: "ConfigJSON", Value: JSON.stringify(config), Type: "Input" },
        ]);
        if (!result.Success) {
            return { counts: null, errors: [result.Message || "Intervention run failed."] };
        }
        return { counts: this.extractResult<InterventionRunCounts>(result), errors: [] };
    }
}
