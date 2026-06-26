import { describe, it, expect } from "vitest";
import {
    ActionConfigError,
    ActionFactorEvaluator,
    ActionFactorSpec,
    ActionRunner,
    clampToRange,
    parseActionParams,
} from "../factors/ActionFactorEvaluator";
import type { FactorEvaluationContext } from "../contracts/IFactorEvaluator";
import type { AnchorKey } from "../factors/anchorKey";

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
        outputParam: "Value",
        staticParams: [],
        maxConcurrency: 4,
        outputMin: null,
        outputMax: null,
        ...overrides,
    };
}

describe("parseActionParams", () => {
    it("defaults anchor/output and no static params for empty config", () => {
        for (const v of [null, "", "  ", "{}"]) {
            expect(parseActionParams(v)).toEqual({
                anchorParam: "AnchorRecordID",
                outputParam: "Value",
                staticParams: [],
            });
        }
    });

    it("reads overrides + static params", () => {
        const parsed = parseActionParams(
            '{"anchorParam":"MemberID","outputParam":"Sentiment","params":{"model":"haiku","threshold":0.5,"strict":true}}',
        );
        expect(parsed.anchorParam).toBe("MemberID");
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
