import { Injectable } from "@angular/core";
import { Metadata } from "@memberjunction/core";
import { ActionEngineBase } from "@memberjunction/actions-base";
import { GraphQLActionClient, GraphQLDataProvider } from "@memberjunction/graphql-dataprovider";
import { extractActionResult, extractActionParam } from "./action-result.util";

/** Actions are invoked by their registered Name — the engine resolves the ID at runtime
 *  (RunAction needs the ID, but we key on the stable name, not a hardcoded UUID). */
const ACTION_PREVIEW_MODEL = "Sonar: Preview Model";
const ACTION_RECOMPUTE_MODEL = "Sonar: Recompute Model";
const ACTION_VALIDATE_FACTOR = "Sonar: Validate Factor";
const ACTION_GET_PROMPT = "Sonar: Get Prompt";
const ACTION_UPDATE_PROMPT = "Sonar: Update Prompt";

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

/** The editable prompt behind an LLM-backed factor-action (from "Sonar: Get Prompt"). */
export interface FactorPrompt { promptId: string | null; templateContentId: string | null; text: string; error?: string; }
/** Result of running a factor-action for one sample member (the prompt "test"). */
export interface FactorActionTest { value: number | null; explanation: string | null; error?: string; }
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

    /** Pull the `Result` output param from an action result (shared MJ-output normalization). */
    private extractResult<T>(result: { Result?: unknown }): T | null {
        return extractActionResult<T>(result);
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

    /** Load an LLM-backed factor-action's editable prompt text (via "Sonar: Get Prompt"). */
    public async getPrompt(promptName: string): Promise<FactorPrompt> {
        const empty: FactorPrompt = { promptId: null, templateContentId: null, text: "" };
        const actionId = await this.resolveActionId(ACTION_GET_PROMPT);
        if (!actionId) return { ...empty, error: `Action '${ACTION_GET_PROMPT}' not found.` };
        const result = await this.actionClient().RunAction(actionId, [
            { Name: "PromptName", Value: promptName, Type: "Input" },
        ]);
        if (!result.Success) return { ...empty, error: result.Message || "Failed to load prompt." };
        return this.extractResult<FactorPrompt>(result) ?? { ...empty, error: "No result." };
    }

    /** Save edited prompt text back to its template content (via "Sonar: Update Prompt"). */
    public async updatePrompt(templateContentId: string, text: string): Promise<{ ok: boolean; error?: string }> {
        const actionId = await this.resolveActionId(ACTION_UPDATE_PROMPT);
        if (!actionId) return { ok: false, error: `Action '${ACTION_UPDATE_PROMPT}' not found.` };
        const result = await this.actionClient().RunAction(actionId, [
            { Name: "TemplateContentID", Value: templateContentId, Type: "Input" },
            { Name: "Text", Value: text, Type: "Input" },
        ]);
        return result.Success ? { ok: true } : { ok: false, error: result.Message || "Save failed." };
    }

    /**
     * Run a factor-action for ONE sample member — the prompt "test". Invokes the factor-action by id
     * with the member as AnchorRecordID and reads back its Value + Explanation output params (the real
     * scoring path, so the test reflects exactly what a recompute would produce). Uses the saved prompt.
     */
    public async testFactorAction(actionId: string, anchorRecordId: string): Promise<FactorActionTest> {
        const result = await this.actionClient().RunAction(actionId, [
            { Name: "AnchorRecordID", Value: anchorRecordId, Type: "Input" },
            { Name: "Value", Value: null, Type: "Output" },
            { Name: "Explanation", Value: null, Type: "Output" },
        ]);
        if (!result.Success) return { value: null, explanation: null, error: result.Message || "Test run failed." };
        const value = extractActionParam(result, "Value");
        const explanation = extractActionParam(result, "Explanation");
        return {
            value: value != null && value !== "" ? Number(value) : null,
            explanation: explanation != null ? String(explanation) : null,
        };
    }
}
