import { describe, it, expect } from "vitest";
import {
    NormalizationEngine,
    NormalizationSpec,
} from "../normalization/NormalizationEngine";
import type { FactorResult } from "../contracts/IFactorEvaluator";

/** Build a raw (un-normalized) FactorResult, as an evaluator would emit it. */
function raw(rawValue: number | null, hadData = true): FactorResult {
    return { rawValue, normalizedContribution: null, hadData, explanation: "" };
}

const minMax01: NormalizationSpec = {
    method: "MinMax",
    outputMin: 0,
    outputMax: 1,
    higherIsBetter: true,
};

describe("NormalizationEngine — MinMax", () => {
    it("rescales raw values to 0..1 against the population min/max", () => {
        const results = new Map<string, FactorResult>([
            ["m1", raw(3)], // population min
            ["m2", raw(20)], // population max
            ["m3", raw(12)],
        ]);

        new NormalizationEngine().normalize(minMax01, results);

        expect(results.get("m1")?.normalizedContribution).toBeCloseTo(0);
        expect(results.get("m2")?.normalizedContribution).toBeCloseTo(1);
        expect(results.get("m3")?.normalizedContribution).toBeCloseTo(
            (12 - 3) / (20 - 3),
        );
    });

    it("inverts the scale when higherIsBetter is false", () => {
        const inverted: NormalizationSpec = { ...minMax01, higherIsBetter: false };
        const results = new Map<string, FactorResult>([
            ["low", raw(3)],
            ["high", raw(20)],
        ]);

        new NormalizationEngine().normalize(inverted, results);

        // lowest raw value becomes the best contribution, highest becomes the worst
        expect(results.get("low")?.normalizedContribution).toBeCloseTo(1);
        expect(results.get("high")?.normalizedContribution).toBeCloseTo(0);
    });

    it("assigns the midpoint when the population has no spread", () => {
        const results = new Map<string, FactorResult>([
            ["a", raw(7)],
            ["b", raw(7)],
        ]);

        new NormalizationEngine().normalize(minMax01, results);

        expect(results.get("a")?.normalizedContribution).toBeCloseTo(0.5);
        expect(results.get("b")?.normalizedContribution).toBeCloseTo(0.5);
    });

    it("scales into a non-0..1 output range", () => {
        const range: NormalizationSpec = { ...minMax01, outputMax: 100 };
        const results = new Map<string, FactorResult>([
            ["m1", raw(3)],
            ["m2", raw(20)],
        ]);

        new NormalizationEngine().normalize(range, results);

        expect(results.get("m1")?.normalizedContribution).toBeCloseTo(0);
        expect(results.get("m2")?.normalizedContribution).toBeCloseTo(100);
    });

    it("leaves no-data anchors null and ignores them in the min/max", () => {
        const results = new Map<string, FactorResult>([
            ["m1", raw(3)],
            ["m2", raw(20)],
            ["m3", raw(null, false)], // no data
        ]);

        new NormalizationEngine().normalize(minMax01, results);

        expect(results.get("m3")?.normalizedContribution).toBeNull();
        expect(results.get("m1")?.normalizedContribution).toBeCloseTo(0);
    });
});

describe("NormalizationEngine — None", () => {
    it("passes the raw value through unscaled", () => {
        const none: NormalizationSpec = { ...minMax01, method: "None" };
        const results = new Map<string, FactorResult>([["m1", raw(42)]]);

        new NormalizationEngine().normalize(none, results);

        expect(results.get("m1")?.normalizedContribution).toBe(42);
    });
});
