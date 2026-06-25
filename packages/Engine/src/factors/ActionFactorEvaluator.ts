import {
    FactorEvaluationContext,
    FactorResult,
    IFactorEvaluator,
} from "../contracts/IFactorEvaluator";
import type { AnchorKey } from "./anchorKey";

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
const DEFAULT_OUTPUT_PARAM = "Value";
export const DEFAULT_MAX_CONCURRENCY = 8;

/**
 * Parse Factor.ActionParamsJSON into the I/O contract: which input carries the anchor id
 * (`anchorParam`, default "AnchorRecordID"), which output holds the result (`outputParam`,
 * default "Value"), and any static `params`. Empty/`{}`/null → all defaults. Malformed config
 * throws rather than mis-binding. Pure + unit-testable.
 */
export function parseActionParams(json: string | null): {
    anchorParam: string;
    outputParam: string;
    staticParams: ActionParamValue[];
} {
    const defaults = {
        anchorParam: DEFAULT_ANCHOR_PARAM,
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
    return { anchorParam, outputParam, staticParams };
}

export class ActionFactorEvaluator implements IFactorEvaluator {
    constructor(
        private readonly spec: ActionFactorSpec,
        private readonly runner: ActionRunner,
    ) {}

    public async evaluateBatch(
        anchors: AnchorKey[],
        asOf: Date,
        ctx: FactorEvaluationContext,
    ): Promise<Map<string, FactorResult>> {
        const out = new Map<string, FactorResult>();
        if (anchors.length === 0) {
            return out;
        }
        // Bounded fan-out: a fixed pool of workers pulls anchors off a shared cursor. (next++ is
        // safe — JS is single-threaded and there's no await between read and increment.)
        const limit = Math.max(1, this.spec.maxConcurrency);
        let next = 0;
        const worker = async (): Promise<void> => {
            while (next < anchors.length) {
                // The Action's anchor param is the canonical id (single-column = the bare value).
                const anchorId = anchors[next++].id;
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
            Array.from({ length: Math.min(limit, anchors.length) }, worker),
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
