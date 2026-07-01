import { ActionResultSimple, RunActionParams, ActionParam } from "@memberjunction/actions-base";
import { SonarActionBase } from "./SonarActionBase";
import { UserInfo } from "@memberjunction/core";

/**
 * The value a factor-action produces for one anchor record. `value` is the raw number the engine
 * scores (null = "no data" for this anchor — handled by the model's MissingDataPolicy, same as a
 * declarative factor that returns no row). `explanation` is an optional human "why" that flows into
 * the score's explainability waterfall — so an action factor isn't a black box at scoring time.
 */
export interface FactorValue {
    value: number | null;
    explanation?: string;
}

/**
 * Typed config a factor-action exposes to the builder (plans/factor-param-schema.md). A *toolbox*,
 * not a shape — an action declares only the params it consumes; a factor that reads no model data
 * declares no source kinds. The ONE invariant: data is referenced ONLY via `wired-source-ref`
 * (resolves to a source already wired into the model) — there is deliberately no "any-entity" kind,
 * so the foot-down rule is an unrepresentable state, not a guideline.
 *
 * This drives the builder's controls + save-time validation. It SERIALIZES DOWN to scalar
 * `ActionParamsJSON.params` entries (the engine's param contract is scalar): the builder resolves a
 * `wired-source-ref` to scalar strings (e.g. `<name>Entity`, `<name>MemberField`) and a
 * `source-fields-ref` to a JSON-array string — the action reads those via `ctx.getParam`.
 */
export type FactorParamSpec =
    // --- implemented (consumer #1 = parameterized sentiment factor) ---
    | { name: string; label?: string; kind: "wired-source-ref"; required: boolean }
    | { name: string; label?: string; kind: "source-fields-ref"; sourceParam: string; columnTypes?: Array<"text" | "date" | "number">; min?: number; max?: number; required: boolean }
    | { name: string; label?: string; kind: "number"; min?: number; max?: number; step?: number; required: boolean; default?: number }
    | { name: string; label?: string; kind: "enum"; values: string[]; required: boolean; default?: string }
    | { name: string; label?: string; kind: "boolean"; default?: boolean }
    // --- reserved (only when a consumer needs it) ---
    | { name: string; label?: string; kind: "source-text-projection"; sourceParam: string }
    | { name: string; label?: string; kind: "string"; maxLen?: number; required: boolean };

/**
 * A factor-action's self-description — the "contract" that makes it NOT a black box. Read by the
 * builder catalog and the "What this signal does" panel so an author understands the signal before
 * binding it. Mandatory: an action with no contract is not a valid factor-action.
 */
export interface FactorActionContract {
    /** One plain sentence: what this signal measures. "Longest run of consecutive active months." */
    measures: string;
    /** The entities/data this action reads. The honest flip-side of hiding the source picker:
     *  the author doesn't CHOOSE the source, but they're told what it is. e.g. ["Event Registrations"]. */
    reads: string[];
    /** What the produced number means — units, expected range, direction, an example. */
    output: {
        unit?: string;
        min?: number;
        max?: number;
        /** Hint to the author: does a higher raw value mean "more engaged"? (Pre-fills the toggle.) */
        higherIsBetter: boolean;
        sample?: number;
    };
    /** Execution profile — drives cost knobs + governance scrutiny. */
    cost: {
        /** Same inputs always yield the same value (no clock/randomness beyond AsOf). */
        deterministic: boolean;
        /** Hits an external API / model (latency, quota, spend). */
        externalCalls: boolean;
        /** Should be rate-limited / cached / budgeted when scoring a full population. */
        expensive: boolean;
    };
    /** If this is an LLM-backed factor, the registered name of the MJ AIPrompt it runs. Lets the
     *  builder offer a view/edit/test panel for the prompt (otherwise the prompt is a hidden internal).
     *  Omit for non-prompt actions. */
    promptName?: string;
    /** Typed config the builder renders + validates (see {@link FactorParamSpec}). Omit for actions
     *  with no configuration. When present, the builder uses THIS (the code contract is the source of
     *  truth) over the action's raw `MJ: Action Params` rows. */
    params?: FactorParamSpec[];
}

/** One registered factor-action: its @RegisterClass key (= the MJ Action's DriverClass, so the
 *  describe-endpoint can resolve the Action record) paired with its declared contract. */
export interface RegisteredFactorAction {
    driverClass: string;
    contract: FactorActionContract;
}

/**
 * Process-wide registry of factor-actions, populated as each subclass module loads (the subclass
 * calls `registerFactorAction` at import time). This lets the describe-endpoint
 * (`Sonar: List Factor Actions`) enumerate factor-actions + their contracts WITHOUT instantiating
 * every registered MJ Action just to test `instanceof`.
 */
const FACTOR_ACTION_REGISTRY: RegisteredFactorAction[] = [];

/** Register a factor-action by its DriverClass key + contract (idempotent per key). */
export function registerFactorAction(driverClass: string, contract: FactorActionContract): void {
    if (!FACTOR_ACTION_REGISTRY.some((r) => r.driverClass === driverClass)) {
        FACTOR_ACTION_REGISTRY.push({ driverClass, contract });
    }
}

/** All registered factor-actions (for the describe-endpoint). */
export function getRegisteredFactorActions(): readonly RegisteredFactorAction[] {
    return FACTOR_ACTION_REGISTRY;
}

/** What the engine hands a factor-action for one anchor; `getParam` reads declared behavioral params. */
export interface FactorComputeContext {
    /** The anchor record being scored (e.g. a member id). */
    anchorRecordID: string;
    /** The recompute's as-of instant — time-aware actions bound their computation to this. */
    asOf: Date;
    /** Server context user for RunView / data access. */
    contextUser?: UserInfo;
    /** Read one declared config (behavioral) param by name; null if absent/blank. */
    getParam(name: string): string | null;
}

/**
 * Base class for every Sonar factor-action (plans/action-factors.md §12). It standardizes the
 * engine ↔ action contract so no action re-implements the plumbing or drifts from it:
 *
 *  - INPUTS: the engine always provides `AnchorRecordID` + `AsOf`; the base parses/validates them.
 *    Any other declared params are the action's *behavioral* config (the foot-down rule: behavioral
 *    knobs only — never "which table/column"; that's declarative's job).
 *  - OUTPUT: the subclass returns a FactorValue (or a bare number); the base writes the `Value`
 *    output param the engine reads, plus an optional `Explanation` param.
 *  - DESCRIBE: the subclass declares a mandatory `contract` so the UI can show what it does/reads.
 *
 * A subclass implements exactly two things: `contract` and `computeValue`. Errors thrown from
 * `computeValue` become a failed ActionResult — the engine treats that anchor as no-data and
 * continues (per-record isolation).
 */
export abstract class SonarFactorAction extends SonarActionBase {
    /** Mandatory self-description — see FactorActionContract. */
    public abstract readonly contract: FactorActionContract;

    /** Compute the raw value (and optional explanation) for one anchor record. */
    protected abstract computeValue(ctx: FactorComputeContext): Promise<FactorValue | number | null>;

    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const anchorRecordID = this.getInput(params, "AnchorRecordID");
        if (!anchorRecordID || !this.isGuid(anchorRecordID)) {
            return this.fail(params, "VALIDATION_ERROR", "AnchorRecordID is required and must be a GUID.");
        }
        const asOf = this.parseAsOf(this.getInput(params, "AsOf"));
        if (!asOf) {
            return this.fail(params, "VALIDATION_ERROR", "AsOf must be a valid date.");
        }
        // Enforce the typed param contract at run time (the rule, not just a builder hint). A
        // configured factor with missing/invalid params fails clean here instead of silently
        // scoring on the wrong/default source.
        const paramError = this.validateParams(params);
        if (paramError) {
            return this.fail(params, "VALIDATION_ERROR", paramError);
        }

        try {
            const ctx: FactorComputeContext = {
                anchorRecordID,
                asOf,
                contextUser: params.ContextUser,
                getParam: (name) => this.getInput(params, name),
            };
            const { value, explanation } = this.normalize(await this.computeValue(ctx));
            // UPDATE the engine's pre-passed output params in place — never append duplicates, or the
            // reader could hit the original null first.
            this.setOutput(params, "Value", value);
            if (explanation != null) {
                this.setOutput(params, "Explanation", explanation);
            }
            return {
                Success: true,
                ResultCode: "SUCCESS",
                Message: explanation ?? `Value: ${value ?? "(no data)"}`,
                Params: params.Params,
            };
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    /**
     * Validate the incoming params against the contract's typed `params` schema — the run-time half of
     * the enforcement (the builder enforces at save; this guarantees it regardless of how the factor's
     * ActionParamsJSON got set: an agent, a hand-edit, a stale record). Returns an error message or
     * null. Backward-compatible: a factor that provides NO typed config at all is left to the action's
     * documented fallback (legacy/un-parameterized factors keep working). A `wired-source-ref` is
     * checked via its resolved `<name>Entity` scalar (§13 serialization).
     */
    private validateParams(params: RunActionParams): string | null {
        const specs = this.contract.params;
        if (!specs || specs.length === 0) return null;
        // Did this factor provide any typed config? (else: fallback path, not enforced)
        const configured = specs.some((s) => {
            if (this.getInput(params, s.name) != null) return true;
            return s.kind === "wired-source-ref" && this.getInput(params, `${s.name}Entity`) != null;
        });
        if (!configured) return null;

        for (const s of specs) {
            const required = "required" in s && s.required === true;
            switch (s.kind) {
                case "wired-source-ref": {
                    if (required && !this.getInput(params, `${s.name}Entity`)) {
                        return `'${s.label ?? s.name}' is required but no source is configured.`;
                    }
                    break;
                }
                case "source-fields-ref": {
                    if (required && this.parseStringArray(this.getInput(params, s.name)).length === 0) {
                        return `'${s.label ?? s.name}' requires at least one field.`;
                    }
                    break;
                }
                case "number": {
                    const v = this.getInput(params, s.name);
                    if (required && v == null) return `'${s.label ?? s.name}' is required.`;
                    if (v != null) {
                        const n = Number(v);
                        if (!Number.isFinite(n)) return `'${s.label ?? s.name}' must be a number.`;
                        if (s.min != null && n < s.min) return `'${s.label ?? s.name}' must be ≥ ${s.min}.`;
                        if (s.max != null && n > s.max) return `'${s.label ?? s.name}' must be ≤ ${s.max}.`;
                    }
                    break;
                }
                case "enum": {
                    const v = this.getInput(params, s.name);
                    if (required && v == null) return `'${s.label ?? s.name}' is required.`;
                    if (v != null && !s.values.includes(v)) {
                        return `'${s.label ?? s.name}' must be one of: ${s.values.join(", ")}.`;
                    }
                    break;
                }
                // boolean / string / source-text-projection: no constraint to enforce yet.
            }
        }
        return null;
    }

    /** Parse a JSON-array-string param value (e.g. a source-fields-ref) into string[]; [] on failure. */
    private parseStringArray(raw: string | null): string[] {
        if (!raw) return [];
        try {
            const v: unknown = JSON.parse(raw);
            return Array.isArray(v) ? v.map(String) : [];
        } catch {
            return [];
        }
    }

    /** Accept either the rich FactorValue or a bare number/null and normalize to the rich shape. */
    private normalize(result: FactorValue | number | null): FactorValue {
        if (typeof result === "number") return { value: result };
        if (result === null) return { value: null };
        return { value: result.value, explanation: result.explanation };
    }

    /** Set an output param's value in place (Type 'Both' so it round-trips), or add it if absent. */
    protected setOutput(params: RunActionParams, name: string, value: number | string | null): void {
        const existing = params.Params.find((x: ActionParam) => x.Name === name);
        if (existing) {
            existing.Value = value;
            existing.Type = "Both";
        } else {
            params.Params.push({ Name: name, Value: value, Type: "Both" });
        }
    }

    /** AsOf defaults to "now" when not supplied; invalid strings are rejected (null). */
    protected parseAsOf(raw: string | null): Date | null {
        const d = raw ? new Date(raw) : new Date();
        return Number.isNaN(d.getTime()) ? null : d;
    }

    protected isGuid(v: string): boolean {
        return /^[0-9a-fA-F-]{32,36}$/.test(v);
    }
}
