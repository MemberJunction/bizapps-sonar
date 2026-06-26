import { ActionResultSimple, RunActionParams, ActionParam } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";

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
