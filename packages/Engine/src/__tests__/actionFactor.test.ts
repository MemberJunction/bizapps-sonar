import { describe, it, expect } from "vitest";
import {
    ActionFactorEvaluator,
    ActionFactorSpec,
    ActionRunner,
    parseActionParams,
} from "../factors/ActionFactorEvaluator";
import type { FactorEvaluationContext } from "../contracts/IFactorEvaluator";

const ctx = {} as FactorEvaluationContext;
const asOf = new Date("2026-06-23T00:00:00Z");

function spec(overrides: Partial<ActionFactorSpec> = {}): ActionFactorSpec {
    return {
        factorId: "fac-action",
        actionId: "act-1",
        anchorParam: "AnchorRecordID",
        outputParam: "Value",
        staticParams: [],
        maxConcurrency: 4,
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
