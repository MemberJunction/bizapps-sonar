import { describe, it, expect } from "vitest";
import {
    ActionFactorEvaluator,
    ActionFactorSpec,
    ActionRunner,
    coerceOutput,
    parseActionParams,
} from "../factors/ActionFactorEvaluator";
import type { FactorEvaluationContext } from "../contracts/IFactorEvaluator";
import { NormalizationEngine } from "../normalization/NormalizationEngine";
import { ScoringEngine, ScoringSpec, WeightedFactor } from "../scoring/ScoringEngine";

const ctx = {} as FactorEvaluationContext;
const asOf = new Date("2026-06-23T00:00:00Z");

function spec(overrides: Partial<ActionFactorSpec> = {}): ActionFactorSpec {
    return {
        factorId: "fac-action",
        actionId: "act-1",
        anchorParam: "AnchorRecordID",
        asOfParam: "AsOf",
        outputParam: "Value",
        staticParams: [],
        maxConcurrency: 4,
        ...overrides,
    };
}

describe("parseActionParams", () => {
    it("defaults anchor/asOf/output and no static params for empty config", () => {
        for (const v of [null, "", "  ", "{}"]) {
            expect(parseActionParams(v)).toEqual({
                anchorParam: "AnchorRecordID",
                asOfParam: "AsOf",
                outputParam: "Value",
                staticParams: [],
            });
        }
    });

    it("reads overrides + static params (incl. a configurable asOfParam)", () => {
        const parsed = parseActionParams(
            '{"anchorParam":"MemberID","asOfParam":"AsOfDate","outputParam":"Sentiment","params":{"model":"haiku","threshold":0.5,"strict":true}}',
        );
        expect(parsed.anchorParam).toBe("MemberID");
        expect(parsed.asOfParam).toBe("AsOfDate");
        expect(parsed.outputParam).toBe("Sentiment");
        expect(parsed.staticParams).toEqual([
            { name: "model", value: "haiku" },
            { name: "threshold", value: 0.5 },
            { name: "strict", value: true },
        ]);
    });

    it("throws on invalid JSON, non-object, bad params, and non-scalar values", () => {
        expect(() => parseActionParams("{nope")).toThrow(/not valid JSON/);
        expect(() => parseActionParams("[1,2]")).toThrow(/must be a JSON object/);
        expect(() => parseActionParams('{"params":[1]}')).toThrow(/'params' must be an object/);
        expect(() => parseActionParams('{"params":{"x":{"a":1}}}')).toThrow(/must be a string, number, or boolean/);
    });
});

describe("coerceOutput (action output → numeric raw value contract)", () => {
    it("passes finite numbers through; NaN/Infinity → null", () => {
        expect(coerceOutput(0)).toBe(0);
        expect(coerceOutput(0.8)).toBe(0.8);
        expect(coerceOutput(-3)).toBe(-3);
        expect(coerceOutput(NaN)).toBeNull();
        expect(coerceOutput(Infinity)).toBeNull();
    });

    it("maps booleans to 1/0 (Exists-style actions)", () => {
        expect(coerceOutput(true)).toBe(1);
        expect(coerceOutput(false)).toBe(0);
    });

    it("treats empty / whitespace strings as no-data (null), NOT a hard 0", () => {
        expect(coerceOutput("")).toBeNull();
        expect(coerceOutput("   ")).toBeNull();
        expect(coerceOutput("\t\n")).toBeNull();
    });

    it("coerces numeric strings; non-numeric strings → null", () => {
        expect(coerceOutput("42")).toBe(42);
        expect(coerceOutput("  1.5  ")).toBe(1.5);
        expect(coerceOutput("abc")).toBeNull();
    });

    it("maps null / undefined / objects to null (no data)", () => {
        expect(coerceOutput(null)).toBeNull();
        expect(coerceOutput(undefined)).toBeNull();
        expect(coerceOutput({})).toBeNull();
        expect(coerceOutput([1])).toBeNull();
    });
});

describe("ActionFactorEvaluator", () => {
    it("maps each anchor's action result to a FactorResult", async () => {
        const runner: ActionRunner = async (anchorId) => ({
            rawValue: anchorId === "m1" ? 10 : 20,
            explanation: `ran for ${anchorId}`,
        });
        const out = await new ActionFactorEvaluator(spec(), runner).evaluateBatch(
            ["m1", "m2"],
            asOf,
            ctx,
        );
        expect(out.get("m1")).toMatchObject({ rawValue: 10, hadData: true, normalizedContribution: null });
        expect(out.get("m2")?.rawValue).toBe(20);
    });

    it("omits anchors with a null result (no-data → handled by MissingDataPolicy downstream)", async () => {
        const runner: ActionRunner = async (anchorId) => ({
            rawValue: anchorId === "m2" ? null : 5,
            explanation: "",
        });
        const out = await new ActionFactorEvaluator(spec(), runner).evaluateBatch(
            ["m1", "m2", "m3"],
            asOf,
            ctx,
        );
        expect(out.has("m1")).toBe(true);
        expect(out.has("m2")).toBe(false);
        expect(out.has("m3")).toBe(true);
    });

    it("treats a per-record action error as no-data (doesn't kill the run)", async () => {
        const runner: ActionRunner = async (anchorId) => {
            if (anchorId === "bad") throw new Error("boom");
            return { rawValue: 1, explanation: "" };
        };
        const out = await new ActionFactorEvaluator(spec(), runner).evaluateBatch(
            ["good", "bad"],
            asOf,
            ctx,
        );
        expect(out.has("good")).toBe(true);
        expect(out.has("bad")).toBe(false);
    });

    it("processes every anchor and never exceeds the concurrency cap", async () => {
        let inFlight = 0;
        let peak = 0;
        const runner: ActionRunner = async (anchorId) => {
            inFlight++;
            peak = Math.max(peak, inFlight);
            await Promise.resolve();
            inFlight--;
            return { rawValue: Number(anchorId), explanation: "" };
        };
        const ids = Array.from({ length: 20 }, (_, i) => String(i + 1));
        const out = await new ActionFactorEvaluator(spec({ maxConcurrency: 4 }), runner).evaluateBatch(
            ids,
            asOf,
            ctx,
        );
        expect(out.size).toBe(20);
        expect(peak).toBeLessThanOrEqual(4);
    });

    it("returns empty for no anchors", async () => {
        const runner: ActionRunner = async () => ({ rawValue: 1, explanation: "" });
        const out = await new ActionFactorEvaluator(spec(), runner).evaluateBatch([], asOf, ctx);
        expect(out.size).toBe(0);
    });
});

/**
 * Integration: an action factor with no data for some anchors, run through the real
 * evaluate → normalize → score pipeline. Guards the seam PR #6 rewrites (score() signature +
 * missing-data threading on WeightedFactor): a careless conflict resolution that drops the
 * action-factor path's no-data handling would fail here. When #6's MissingDataPolicy lands, extend
 * this to assert the policy (e.g. ExcludeFromDenominator) instead of today's missing-factor-as-zero.
 */
describe("integration: action factor + missing data → scoring", () => {
    it("an action factor with no data for an anchor contributes 0, and that anchor is still scored", async () => {
        // Action factor: m1 produces a value, m2 returns null (no data) → evaluator omits m2.
        const runner: ActionRunner = async (anchorId) => ({
            rawValue: anchorId === "m1" ? 1 : null,
            explanation: anchorId,
        });
        const actionResults = await new ActionFactorEvaluator(spec(), runner).evaluateBatch(
            ["m1", "m2"],
            asOf,
            ctx,
        );
        expect(actionResults.has("m2")).toBe(false); // no-data anchor not in the action factor's map

        // Normalize like the orchestrator (None passthrough into 0..1) — m2 stays absent.
        new NormalizationEngine().normalize(
            { method: "None", higherIsBetter: true, outputMin: 0, outputMax: 1 },
            actionResults,
        );

        // A baseline factor that DOES cover m2, so m2 is part of the population.
        const baseline: WeightedFactor = {
            factorId: "baseline",
            modelFactorId: "mf-base",
            weight: 1,
            results: new Map([
                ["m1", { rawValue: 1, normalizedContribution: 1, hadData: true, explanation: "" }],
                ["m2", { rawValue: 1, normalizedContribution: 1, hadData: true, explanation: "" }],
            ]),
        };
        const action: WeightedFactor = {
            factorId: "fac-action",
            modelFactorId: "mf-action",
            weight: 1,
            results: actionResults,
        };
        const sSpec: ScoringSpec = {
            scaleMin: 0,
            scaleMax: 100,
            bands: [{ bandId: "all", label: "All", minScore: 0, maxScore: 100 }],
        };
        const scores = new ScoringEngine().score(sSpec, [action, baseline]);

        // m2 is scored despite the action factor having no data for it. The no-data factor is OMITTED
        // from the breakdown, but its weight still counts in the denominator (v1 missing-factor-as-zero),
        // so the score is dragged down rather than the anchor being dropped.
        const m2 = scores.get("m2");
        expect(m2).toBeDefined();
        expect(m2?.contributions.find((c) => c.factorId === "fac-action")).toBeUndefined();
        // baseline 1 (w1) + action absent (0, but w1 in the denominator) over total weight 2 = 0.5 → 50.
        expect(m2?.normalizedScore).toBe(50);

        // ...and m1, which had data, counts the action factor in its breakdown.
        const m1Action = scores.get("m1")?.contributions.find((c) => c.factorId === "fac-action");
        expect(m1Action?.hadData).toBe(true);
    });
});
