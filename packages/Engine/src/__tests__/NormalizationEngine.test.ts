import { describe, it, expect } from "vitest";
import {
    NormalizationEngine,
    NormalizationSpec,
    parseNormalizationParams,
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

describe("NormalizationEngine — Percentile", () => {
    const pct: NormalizationSpec = { ...minMax01, method: "Percentile" };

    it("ranks each value within the population (midpoint method)", () => {
        const results = new Map<string, FactorResult>([
            ["m1", raw(3)],
            ["m2", raw(20)],
            ["m3", raw(12)],
            ["m4", raw(7)],
        ]);

        new NormalizationEngine().normalize(pct, results);

        // sorted [3,7,12,20] → (i + 0.5) / 4
        expect(results.get("m1")?.normalizedContribution).toBeCloseTo(0.125);
        expect(results.get("m4")?.normalizedContribution).toBeCloseTo(0.375);
        expect(results.get("m3")?.normalizedContribution).toBeCloseTo(0.625);
        expect(results.get("m2")?.normalizedContribution).toBeCloseTo(0.875);
    });

    it("gives tied values one shared rank, and resists outliers", () => {
        // MinMax would crush the two 5s to ~0; percentile keeps them at their rank.
        const results = new Map<string, FactorResult>([
            ["a", raw(5)],
            ["b", raw(5)],
            ["c", raw(20)],
        ]);

        new NormalizationEngine().normalize(pct, results);

        // run [5,5] at i=0,k=2 → (0+1)/3; [20] at i=2 → (2+0.5)/3
        expect(results.get("a")?.normalizedContribution).toBeCloseTo(1 / 3);
        expect(results.get("b")?.normalizedContribution).toBeCloseTo(1 / 3);
        expect(results.get("c")?.normalizedContribution).toBeCloseTo(0.8333, 3);
    });
});

describe("NormalizationEngine — ZScore", () => {
    const zspec: NormalizationSpec = { ...minMax01, method: "ZScore" };

    it("maps the mean to the midpoint and is symmetric around it", () => {
        const results = new Map<string, FactorResult>([
            ["lo", raw(10)],
            ["mid", raw(20)],
            ["hi", raw(30)],
        ]);

        new NormalizationEngine().normalize(zspec, results);

        const lo = results.get("lo")!.normalizedContribution!;
        const hi = results.get("hi")!.normalizedContribution!;
        expect(results.get("mid")?.normalizedContribution).toBeCloseTo(0.5);
        expect(lo).toBeLessThan(0.5);
        expect(hi).toBeGreaterThan(0.5);
        expect(lo + hi).toBeCloseTo(1); // symmetric about the mean
    });

    it("clamps extreme outliers to the output bounds (z beyond ±3)", () => {
        // 10 zeros + one large value → the outlier's z exceeds 3 and clamps to the ceiling.
        const results = new Map<string, FactorResult>(
            Array.from({ length: 10 }, (_, i) => [`z${i}`, raw(0)] as const).concat([
                ["out", raw(1000)],
            ]),
        );

        new NormalizationEngine().normalize(zspec, results);

        for (const r of results.values()) {
            const v = r.normalizedContribution!;
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(1);
        }
        expect(results.get("out")?.normalizedContribution).toBeCloseTo(1);
    });

    it("assigns the midpoint when the population has no spread", () => {
        const results = new Map<string, FactorResult>([
            ["a", raw(7)],
            ["b", raw(7)],
        ]);

        new NormalizationEngine().normalize(zspec, results);

        expect(results.get("a")?.normalizedContribution).toBeCloseTo(0.5);
    });
});

describe("NormalizationEngine — Logistic", () => {
    const logistic: NormalizationSpec = {
        method: "Logistic",
        outputMin: 0,
        outputMax: 1,
        higherIsBetter: true,
        params: { method: "Logistic", midpoint: 10, steepness: 1 },
    };

    it("maps the midpoint to 0.5 and saturates away from it", () => {
        const results = new Map<string, FactorResult>([
            ["mid", raw(10)],
            ["high", raw(100)],
            ["low", raw(-100)],
        ]);

        new NormalizationEngine().normalize(logistic, results);

        expect(results.get("mid")?.normalizedContribution).toBeCloseTo(0.5);
        expect(results.get("high")?.normalizedContribution).toBeCloseTo(1, 4);
        expect(results.get("low")?.normalizedContribution).toBeCloseTo(0, 4);
    });

    it("is per-value, not population-relative (one member scores the same alone or in a crowd)", () => {
        const alone = new Map<string, FactorResult>([["m", raw(10)]]);
        const crowd = new Map<string, FactorResult>([
            ["m", raw(10)],
            ["x", raw(0)],
            ["y", raw(1000)],
        ]);

        const engine = new NormalizationEngine();
        engine.normalize(logistic, alone);
        engine.normalize(logistic, crowd);

        expect(alone.get("m")?.normalizedContribution).toBeCloseTo(
            crowd.get("m")!.normalizedContribution!,
        );
    });

    it("throws when params are missing", () => {
        const noParams: NormalizationSpec = { ...logistic, params: undefined };
        expect(() =>
            new NormalizationEngine().normalize(
                noParams,
                new Map([["m", raw(10)]]),
            ),
        ).toThrow(/Logistic/);
    });
});

describe("NormalizationEngine — Banded", () => {
    const banded: NormalizationSpec = {
        method: "Banded",
        outputMin: 0,
        outputMax: 1,
        higherIsBetter: true,
        params: {
            method: "Banded",
            bands: [
                { max: 5, output: 0.2 },
                { max: 10, output: 0.6 },
                { max: null, output: 1 },
            ],
        },
    };

    it("buckets each value into its band (inclusive upper bound; null = open top)", () => {
        const results = new Map<string, FactorResult>([
            ["lowEdge", raw(5)], // <= 5 → first band
            ["mid", raw(8)], // <= 10 → second band
            ["top", raw(50)], // open-ended band
        ]);

        new NormalizationEngine().normalize(banded, results);

        expect(results.get("lowEdge")?.normalizedContribution).toBeCloseTo(0.2);
        expect(results.get("mid")?.normalizedContribution).toBeCloseTo(0.6);
        expect(results.get("top")?.normalizedContribution).toBeCloseTo(1);
    });

    it("orders bands by upper bound regardless of config order", () => {
        const shuffled: NormalizationSpec = {
            ...banded,
            params: {
                method: "Banded",
                bands: [
                    { max: null, output: 1 },
                    { max: 10, output: 0.6 },
                    { max: 5, output: 0.2 },
                ],
            },
        };
        const results = new Map<string, FactorResult>([["mid", raw(8)]]);

        new NormalizationEngine().normalize(shuffled, results);

        expect(results.get("mid")?.normalizedContribution).toBeCloseTo(0.6);
    });
});

describe("NormalizationEngine — Lookup", () => {
    const lookup: NormalizationSpec = {
        method: "Lookup",
        outputMin: 0,
        outputMax: 1,
        higherIsBetter: true,
        params: {
            method: "Lookup",
            entries: [
                { value: 1, output: 0.1 },
                { value: 2, output: 0.9 },
            ],
            fallback: 0.5,
        },
    };

    it("maps exact matches and falls back otherwise", () => {
        const results = new Map<string, FactorResult>([
            ["one", raw(1)],
            ["two", raw(2)],
            ["other", raw(7)],
        ]);

        new NormalizationEngine().normalize(lookup, results);

        expect(results.get("one")?.normalizedContribution).toBeCloseTo(0.1);
        expect(results.get("two")?.normalizedContribution).toBeCloseTo(0.9);
        expect(results.get("other")?.normalizedContribution).toBeCloseTo(0.5);
    });
});

describe("NormalizationEngine — direction + output range still apply to parameterized methods", () => {
    it("inverts a Banded fraction when higherIsBetter is false and scales to 0..100", () => {
        const spec: NormalizationSpec = {
            method: "Banded",
            outputMin: 0,
            outputMax: 100,
            higherIsBetter: false,
            params: { method: "Banded", bands: [{ max: null, output: 0.2 }] },
        };
        const results = new Map<string, FactorResult>([["m", raw(3)]]);

        new NormalizationEngine().normalize(spec, results);

        // fraction 0.2 → inverted 0.8 → scaled to 0..100 = 80
        expect(results.get("m")?.normalizedContribution).toBeCloseTo(80);
    });
});

describe("parseNormalizationParams", () => {
    it("returns undefined for the pure (param-less) methods", () => {
        expect(parseNormalizationParams("MinMax", null)).toBeUndefined();
        expect(parseNormalizationParams("None", null)).toBeUndefined();
    });

    it("parses valid Logistic / Banded / Lookup JSON", () => {
        expect(
            parseNormalizationParams("Logistic", '{"midpoint":10,"steepness":2}'),
        ).toEqual({ method: "Logistic", midpoint: 10, steepness: 2 });

        expect(
            parseNormalizationParams("Banded", '{"bands":[{"max":5,"output":0.3}]}'),
        ).toEqual({ method: "Banded", bands: [{ max: 5, output: 0.3 }] });

        expect(
            parseNormalizationParams(
                "Lookup",
                '{"entries":[{"value":1,"output":0.5}],"fallback":0}',
            ),
        ).toEqual({
            method: "Lookup",
            entries: [{ value: 1, output: 0.5 }],
            fallback: 0,
        });
    });

    it("throws on missing JSON, malformed JSON, and wrong-typed fields", () => {
        expect(() => parseNormalizationParams("Logistic", null)).toThrow(/requires/);
        expect(() => parseNormalizationParams("Logistic", "{not json")).toThrow(/valid JSON/);
        expect(() =>
            parseNormalizationParams("Logistic", '{"midpoint":"x","steepness":1}'),
        ).toThrow(/must be a number/);
        expect(() => parseNormalizationParams("Banded", '{"bands":[]}')).toThrow(
            /at least one band/,
        );
    });
});
