import { describe, it, expect } from "vitest";
import {
    ActionConfigError,
    ActionFactorEvaluator,
    ActionFactorSpec,
    ActionRunner,
    clampToRange,
    coerceOutput,
    parseActionParams,
} from "../factors/ActionFactorEvaluator";
import type { FactorEvaluationContext } from "../contracts/IFactorEvaluator";
import type { AnchorKey } from "../factors/anchorKey";
import { NormalizationEngine } from "../normalization/NormalizationEngine";
import { ScoringEngine, ScoringSpec, WeightedFactor } from "../scoring/ScoringEngine";

const ctx = {} as FactorEvaluationContext;
const asOf = new Date("2026-06-23T00:00:00Z");

/** Wrap bare ids as single-column AnchorKeys (id = value) for the evaluator's signature. */
const keys = (...ids: string[]): AnchorKey[] =>
    ids.map((id) => ({ id, json: JSON.stringify([{ FieldName: "ID", Value: id }]), values: [id] }));

function spec(overrides: Partial<ActionFactorSpec> = {}): ActionFactorSpec {
    return {
        factorId: "fac-action",
        actionId: "act-1",
        anchorParam: "AnchorRecordID",
        asOfParam: "AsOf",
        outputParam: "Value",
        staticParams: [],
        maxConcurrency: 4,
        outputMin: null,
        outputMax: null,
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
            keys("m1", "m2"),
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
            keys("m1", "m2", "m3"),
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
            keys("good", "bad"),
            asOf,
            ctx,
        );
        expect(out.has("good")).toBe(true);
        expect(out.has("bad")).toBe(false);
    });

    it("FAILS THE RUN on a config error (doesn't degrade to no-data for everyone)", async () => {
        const runner: ActionRunner = async () => {
            throw new ActionConfigError("'source' is required but no source is configured.");
        };
        await expect(
            new ActionFactorEvaluator(spec(), runner).evaluateBatch(keys("m1", "m2"), asOf, ctx),
        ).rejects.toThrow(/source.*required/);
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
            keys(...ids),
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

    it("clamps action values to the factor's declared output range", async () => {
        // Action misbehaves: returns 1.4 and -0.2 for a [0,1] factor (e.g. a sloppy sentiment model).
        const runner: ActionRunner = async (anchorId) => ({
            rawValue: anchorId === "hi" ? 1.4 : anchorId === "lo" ? -0.2 : 0.5,
            explanation: "",
        });
        const out = await new ActionFactorEvaluator(spec({ outputMin: 0, outputMax: 1 }), runner).evaluateBatch(
            keys("hi", "lo", "mid"),
            asOf,
            ctx,
        );
        expect(out.get("hi")?.rawValue).toBe(1);   // clamped down to max
        expect(out.get("lo")?.rawValue).toBe(0);   // clamped up to min
        expect(out.get("mid")?.rawValue).toBe(0.5); // in range, untouched
    });

    it("does not clamp when bounds are null (unbounded factor)", async () => {
        const runner: ActionRunner = async () => ({ rawValue: 999, explanation: "" });
        const out = await new ActionFactorEvaluator(spec(), runner).evaluateBatch(keys("m1"), asOf, ctx);
        expect(out.get("m1")?.rawValue).toBe(999);
    });
});

describe("clampToRange", () => {
    it("clamps below min / above max and flags drift", () => {
        expect(clampToRange(-0.2, 0, 1)).toEqual({ value: 0, clamped: true });
        expect(clampToRange(1.4, 0, 1)).toEqual({ value: 1, clamped: true });
    });
    it("passes through in-range values with no drift", () => {
        expect(clampToRange(0.5, 0, 1)).toEqual({ value: 0.5, clamped: false });
        expect(clampToRange(0, 0, 1)).toEqual({ value: 0, clamped: false });
    });
    it("treats null bounds as unbounded on that end", () => {
        expect(clampToRange(999, 0, null)).toEqual({ value: 999, clamped: false });
        expect(clampToRange(-999, null, 1)).toEqual({ value: -999, clamped: false });
        expect(clampToRange(5, null, null)).toEqual({ value: 5, clamped: false });
    });
});

/**
 * Integration: an action factor with no data for some anchors, run through the real
 * evaluate → normalize → score pipeline, asserting the MissingDataPolicy (#6). This guards the seam
 * PR #6 rewrote (`score(spec, factors, population)` + missing-data threading on WeightedFactor): a
 * careless merge that dropped the action-factor path's no-data handling would fail here.
 */
describe("integration: action factor + missing-data policy → scoring", () => {
    // Action factor: m1 produces a value, m2 returns null (no data) → the evaluator omits m2, so the
    // scorer applies m2's MissingDataPolicy. Normalized like the orchestrator (None passthrough 0..1).
    async function mixedActionResults() {
        const runner: ActionRunner = async (anchorId) => ({
            rawValue: anchorId === "m1" ? 1 : null,
            explanation: anchorId,
        });
        const results = await new ActionFactorEvaluator(spec(), runner).evaluateBatch(
            keys("m1", "m2"),
            asOf,
            ctx,
        );
        expect(results.has("m2")).toBe(false);
        new NormalizationEngine().normalize(
            { method: "None", higherIsBetter: true, outputMin: 0, outputMax: 1 },
            results,
        );
        return results;
    }

    const sSpec: ScoringSpec = {
        scaleMin: 0,
        scaleMax: 100,
        bands: [{ bandId: "all", label: "All", minScore: 0, maxScore: 100 }],
    };

    // A baseline factor with data for both members, so the population is well-defined.
    function baseline(): WeightedFactor {
        return {
            factorId: "baseline",
            modelFactorId: "mf-base",
            weight: 1,
            missingDataPolicy: "Zero",
            results: new Map([
                ["m1", { rawValue: 1, normalizedContribution: 1, hadData: true, explanation: "" }],
                ["m2", { rawValue: 1, normalizedContribution: 1, hadData: true, explanation: "" }],
            ]),
        };
    }

    it("MissingDataPolicy=Zero: fills 0 for the no-data anchor and keeps it in the denominator", async () => {
        const action: WeightedFactor = {
            factorId: "fac-action",
            modelFactorId: "mf-action",
            weight: 1,
            missingDataPolicy: "Zero",
            results: await mixedActionResults(),
        };
        const scores = new ScoringEngine().score(sSpec, [action, baseline()], ["m1", "m2"]);
        const m2Action = scores.get("m2")?.contributions.find((c) => c.factorId === "fac-action");
        expect(m2Action?.hadData).toBe(false);
        expect(m2Action?.weightedValue).toBe(0);
        // baseline 1 (w1) + action 0 (w1) over denom 2 = 0.5 → 50.
        expect(scores.get("m2")?.normalizedScore).toBe(50);
        // m1 (has data) still counts the action factor.
        expect(scores.get("m1")?.contributions.find((c) => c.factorId === "fac-action")?.hadData).toBe(true);
    });

    it("MissingDataPolicy=Exclude: drops the no-data action factor from the anchor's denominator", async () => {
        const action: WeightedFactor = {
            factorId: "fac-action",
            modelFactorId: "mf-action",
            weight: 1,
            missingDataPolicy: "Exclude",
            results: await mixedActionResults(),
        };
        const scores = new ScoringEngine().score(sSpec, [action, baseline()], ["m1", "m2"]);
        // action excluded for m2 → only baseline counts → 1/1 → 100.
        expect(scores.get("m2")?.contributions.find((c) => c.factorId === "fac-action")).toBeUndefined();
        expect(scores.get("m2")?.normalizedScore).toBe(100);
    });
});
