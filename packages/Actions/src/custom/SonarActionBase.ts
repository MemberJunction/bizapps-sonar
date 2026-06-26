import { ActionResultSimple, RunActionParams, ActionParam } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { RunView } from "@memberjunction/core";

const SCORE_MODEL = "MJ_BizApps_Sonar: Score Models";

/**
 * Shared base for hand-authored Sonar actions. Hoists the two helpers every action re-implemented —
 * `getInput` (read one input param as a trimmed string, null when absent/blank) and `fail` (a
 * uniform error ActionResultSimple) — so the plumbing lives in ONE place. Subclasses still register
 * under `@RegisterClass(BaseAction, "DriverClass")` (ActionEngine resolves by BaseAction) and
 * implement `InternalRunAction`; being an intermediate base doesn't change registration.
 */
export abstract class SonarActionBase extends BaseAction {
    /** Read one input param's value as a string (null when absent/empty). */
    protected getInput(params: RunActionParams, name: string): string | null {
        const p = params.Params.find((x: ActionParam) => x.Name === name);
        return p?.Value != null && p.Value !== "" ? String(p.Value) : null;
    }

    /** Read a param that may arrive as a JSON STRING (the browser/UI passes that) OR an already-parsed
     *  OBJECT (an LLM agent's tool call passes the object directly — `String(obj)` would mangle it to
     *  "[object Object]" and fail JSON.parse). Tolerates a markdown ```json fence. null when
     *  absent/blank/unparseable. */
    protected parseJsonParam<T>(params: RunActionParams, name: string): T | null {
        const raw: unknown = params.Params.find((x: ActionParam) => x.Name === name)?.Value;
        if (raw == null || raw === "") return null;
        if (typeof raw === "object") return raw as T;
        if (typeof raw === "string") {
            const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
            try {
                return JSON.parse(cleaned) as T;
            } catch {
                return null;
            }
        }
        return null;
    }

    /** A uniform failure result (echoes the input params, like the rest of MJ). */
    protected fail(params: RunActionParams, code: string, message: string): ActionResultSimple {
        return { Success: false, ResultCode: code, Message: message, Params: params.Params };
    }

    /** Pull a human-readable save error off a BaseEntity result. Surface this in `fail` instead of a
     *  generic "save failed" so a CALLING AGENT can self-correct (and so logs say what actually broke). */
    protected errOf(entity: { LatestResult?: { Message?: string; Errors?: unknown } }): string {
        return entity.LatestResult?.Message || JSON.stringify(entity.LatestResult?.Errors ?? []) || "save failed";
    }

    /** Sum/Avg/Min/Max/DistinctCount aggregate a COLUMN; only Count doesn't. Returns a teaching message
     *  (problem + Next step) when an aggregation needs a field but none was supplied, else null — so the
     *  agent fixes it before saving a factor that can't compile, rather than producing a broken one. */
    protected aggregateFieldGap(aggregation: string | null | undefined, field: string | null | undefined): string | null {
        const needsField = aggregation != null && ["Sum", "Avg", "Min", "Max", "DistinctCount"].includes(aggregation);
        if (needsField && !(field && field.trim())) {
            return `aggregation '${aggregation}' aggregates a column, so it needs aggregateFieldName (a numeric/date column on the source). Only 'Count' needs no field. Next: set aggregateFieldName, or switch to Count.`;
        }
        return null;
    }

    /** A failure that TEACHES the calling agent: states the problem AND the corrective next step, in a
     *  consistent shape the LLM can act on. Use this for recoverable/dead-end states where the right
     *  move is knowable — a bare "failed" just gets retried blindly. */
    protected failWithFix(params: RunActionParams, code: string, problem: string, fix: string): ActionResultSimple {
        return this.fail(params, code, `${problem} Next: ${fix}`);
    }

    /** Guard for tools that EDIT an existing model: only Draft models are mutable (published Active/Paused
     *  models snapshot immutable config). Returns a teaching failure when the model is missing or locked,
     *  or null when it's safe to edit. Runs BEFORE any save so we never half-apply a change — and tells
     *  the agent exactly what to do instead of letting it loop on a raw "save failed". */
    protected async modelEditableError(params: RunActionParams, modelId: string): Promise<ActionResultSimple | null> {
        const res = await new RunView().RunView(
            { EntityName: SCORE_MODEL, ExtraFilter: `ID='${modelId}'`, MaxRows: 1, ResultType: "simple", Fields: ["Name", "Status"] },
            params.ContextUser,
        );
        const row = res.Success && res.Results.length ? (res.Results[0] as { Name?: string; Status?: string }) : null;
        if (!row) {
            return this.failWithFix(params, "VALIDATION_ERROR", `No model found for ID '${modelId}'.`,
                "confirm the model ID with Sonar: Describe Model, or create the model first. Do NOT retry with the same ID.");
        }
        if (row.Status !== "Draft") {
            return this.failWithFix(params, "ERROR",
                `Model '${row.Name}' is ${row.Status} (published); its scoring configuration is locked, so this change cannot be applied.`,
                `create a NEW draft model for these changes, or ask the user to unpublish '${row.Name}' to Draft first. Do NOT retry this call on the published model.`);
        }
        return null;
    }

    /** Append the `Result` output param (Type 'Both' so the resolver serializes it to GraphQL). */
    protected ok(params: RunActionParams, message: string, payload: unknown): ActionResultSimple {
        return {
            Success: true,
            ResultCode: "SUCCESS",
            Message: message,
            Params: [...params.Params, { Name: "Result", Value: JSON.stringify(payload), Type: "Both" }],
        };
    }
}
