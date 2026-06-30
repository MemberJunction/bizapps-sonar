import {
    FactorEvaluationContext,
    FactorResult,
    IFactorEvaluator,
} from "../contracts/IFactorEvaluator";

/**
 * Action-backed factors — the escape hatch (plan §5.2, §7.2). When a signal can't be expressed
 * as set-based SQL (bespoke math, an external model, AI/NLP), the factor's value is produced by an
 * MJ Action instead. This evaluator satisfies the SAME IFactorEvaluator contract as the declarative
 * one, so scoring/normalization/explainability never branch on which kind they hold.
 *
 * The actual Action call is an injected `ActionRunner` (the real one wraps ActionEngineServer in
 * actionRunner.ts) — so all the logic here (param assembly via parseActionParams, output→number
 * mapping, bounded concurrency, per-record error isolation) is pure and unit-testable with a stub.
 *
 * v1 scope: PerRecord execution (one Action call per anchor — MJ has no batch RunAction) with a
 * concurrency cap. Cross-run result caching (CacheTTLSeconds), rate limiting, Batch mode, and
 * IsExpensive budgeting are deferred.
 */

/** A static input bound at config time (from Factor.ActionParamsJSON `params`). */
export interface ActionParamValue {
    name: string;
    value: string | number | boolean;
}

/** A compiled Action-backed factor — the few pieces the runner needs, bound at config time. */
export interface ActionFactorSpec {
    factorId: string;
    /** The MJ Action to invoke (Factor.ActionID). */
    actionId: string;
    /** Input param the engine sets to each anchor's record id. */
    anchorParam: string;
    /** Input param the engine sets to the recompute's as-of date. Configurable (default "AsOf") so a
     *  bound Action can name it differently; the Action MUST declare this input. */
    asOfParam: string;
    /** Output param the engine reads the numeric result from. */
    outputParam: string;
    /** Static inputs passed on every call. */
    staticParams: ActionParamValue[];
    /** Max Action calls in flight at once. */
    maxConcurrency: number;
}

/** One Action invocation's outcome for one anchor. `rawValue` is null when no value was produced. */
export interface ActionRunResult {
    rawValue: number | null;
    explanation: string;
}

/** Runs the bound Action once for one anchor → its numeric result. Injected so the evaluator is
 *  testable without MJ's Action engine or a database. */
export type ActionRunner = (
    anchorId: string,
    asOf: Date,
    spec: ActionFactorSpec,
    ctx: FactorEvaluationContext,
) => Promise<ActionRunResult>;

const DEFAULT_ANCHOR_PARAM = "AnchorRecordID";
const DEFAULT_ASOF_PARAM = "AsOf";
const DEFAULT_OUTPUT_PARAM = "Value";
export const DEFAULT_MAX_CONCURRENCY = 8;

/**
 * ⚠ SCALE CEILING (deferred mitigations — see the changeset). An Action-backed factor fires ONE Action
 * call per anchor (PerRecord). Against a full population that's N calls per recompute — 10k members ⇒
 * 10k calls — and the concurrency cap only bounds *parallelism*, not total cost/latency. Cross-run
 * result caching (CacheTTLSeconds), IsExpensive budgeting, and rate limiting are NOT implemented yet.
 * The orchestrator emits a loud LogStatus when a single action factor's population exceeds this soft
 * cap, so an expensive run can't happen silently. Raise/replace with a real budget guard before running
 * external-API / LLM action factors against large non-demo populations.
 */
export const ACTION_FACTOR_POPULATION_SOFT_CAP = 1000;

/**
 * Parse Factor.ActionParamsJSON into the I/O contract: which input carries the anchor id
 * (`anchorParam`, default "AnchorRecordID"), which input carries the as-of date (`asOfParam`, default
 * "AsOf"), which output holds the result (`outputParam`, default "Value"), and any static `params`.
 * Empty/`{}`/null → all defaults. Malformed config throws rather than mis-binding. Pure + unit-testable.
 */
export function parseActionParams(json: string | null): {
    anchorParam: string;
    asOfParam: string;
    outputParam: string;
    staticParams: ActionParamValue[];
} {
    const defaults = {
        anchorParam: DEFAULT_ANCHOR_PARAM,
        asOfParam: DEFAULT_ASOF_PARAM,
        outputParam: DEFAULT_OUTPUT_PARAM,
        staticParams: [] as ActionParamValue[],
    };
    if (!json || json.trim() === "" || json.trim() === "{}") {
        return defaults;
    }
    let parsed: unknown;
    try {
        parsed = JSON.parse(json);
    } catch {
        throw new Error("ActionFactor: ActionParamsJSON is not valid JSON.");
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error("ActionFactor: ActionParamsJSON must be a JSON object.");
    }
    const rec = parsed as Record<string, unknown>;
    const anchorParam =
        typeof rec.anchorParam === "string" && rec.anchorParam.length > 0
            ? rec.anchorParam
            : DEFAULT_ANCHOR_PARAM;
    const asOfParam =
        typeof rec.asOfParam === "string" && rec.asOfParam.length > 0
            ? rec.asOfParam
            : DEFAULT_ASOF_PARAM;
    const outputParam =
        typeof rec.outputParam === "string" && rec.outputParam.length > 0
            ? rec.outputParam
            : DEFAULT_OUTPUT_PARAM;

    const staticParams: ActionParamValue[] = [];
    if (rec.params !== undefined) {
        if (typeof rec.params !== "object" || rec.params === null || Array.isArray(rec.params)) {
            throw new Error("ActionFactor: ActionParamsJSON 'params' must be an object of name→value.");
        }
        for (const [name, value] of Object.entries(rec.params as Record<string, unknown>)) {
            if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
                throw new Error(`ActionFactor: param '${name}' must be a string, number, or boolean.`);
            }
            staticParams.push({ name, value });
        }
    }
    return { anchorParam, asOfParam, outputParam, staticParams };
}

/**
 * Coerce an Action's raw output param value to a factor's numeric raw value, or null = "no data" for
 * that anchor (so the model's MissingDataPolicy handles it, same as a declarative factor with no row).
 * The contract is intentionally explicit because the edge cases differ in MEANING:
 *   - number            → itself (NaN / Infinity → null).
 *   - boolean           → 1 / 0 (so an Exists-style action returning true/false scores as a real value).
 *   - "" or whitespace  → null (NO DATA). An action returning empty means "nothing", which must fall to
 *                         the missing-data policy — NOT a hard 0 contribution (what `Number("")` gives).
 *   - other string      → Number(it) if finite, else null.
 *   - null / undefined / anything else → null.
 * Pure + unit-tested; lives here (not in actionRunner) so it stays free of the MJ Action I/O imports.
 */
export function coerceOutput(raw: unknown): number | null {
    if (typeof raw === "number") {
        return Number.isFinite(raw) ? raw : null;
    }
    if (typeof raw === "boolean") {
        return raw ? 1 : 0;
    }
    if (typeof raw === "string") {
        if (raw.trim() === "") {
            return null; // empty / whitespace = no data, never a hard 0
        }
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}

export class ActionFactorEvaluator implements IFactorEvaluator {
    constructor(
        private readonly spec: ActionFactorSpec,
        private readonly runner: ActionRunner,
    ) {}

    public async evaluateBatch(
        anchorIds: string[],
        asOf: Date,
        ctx: FactorEvaluationContext,
    ): Promise<Map<string, FactorResult>> {
        const out = new Map<string, FactorResult>();
        if (anchorIds.length === 0) {
            return out;
        }
        // Bounded fan-out: a fixed pool of workers pulls anchors off a shared cursor. (next++ is
        // safe — JS is single-threaded and there's no await between read and increment.)
        const limit = Math.max(1, this.spec.maxConcurrency);
        let next = 0;
        const worker = async (): Promise<void> => {
            while (next < anchorIds.length) {
                const anchorId = anchorIds[next++];
                const result = await this.evaluateOne(anchorId, asOf, ctx);
                // Only anchors with a value get an entry; an absent anchor = "no data", handled by
                // the model's MissingDataPolicy — same convention as the declarative evaluator.
                if (result.rawValue !== null) {
                    out.set(anchorId, {
                        rawValue: result.rawValue,
                        normalizedContribution: null,
                        hadData: true,
                        explanation: result.explanation,
                    });
                }
            }
        };
        await Promise.all(
            Array.from({ length: Math.min(limit, anchorIds.length) }, worker),
        );
        return out;
    }

    /** One anchor. A per-record Action failure becomes "no data" (null) rather than failing the
     *  whole run — graceful degradation per the plan. */
    private async evaluateOne(
        anchorId: string,
        asOf: Date,
        ctx: FactorEvaluationContext,
    ): Promise<ActionRunResult> {
        try {
            return await this.runner(anchorId, asOf, this.spec, ctx);
        } catch (e: unknown) {
            return {
                rawValue: null,
                explanation: `action error: ${e instanceof Error ? e.message : String(e)}`,
            };
        }
    }
}
