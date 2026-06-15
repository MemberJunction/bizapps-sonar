import { describe, it, expect } from "vitest";
import {
    ScoringEngine,
    ScoringSpec,
    WeightedFactor,
} from "../scoring/ScoringEngine";
import type { FactorResult } from "../contracts/IFactorEvaluator";

/** A normalized FactorResult (rawValue irrelevant to scoring; only the normalized value matters). */
function norm(normalizedContribution: number | null): FactorResult {
    return {
        rawValue: null,
        normalizedContribution,
        hadData: normalizedContribution !== null,
        explanation: "",
    };
}

const spec: ScoringSpec = {
    scaleMin: 0,
    scaleMax: 100,
    bands: [
        { bandId: "b-risk", label: "At Risk", minScore: 0, maxScore: 40 },
        { bandId: "b-neutral", label: "Neutral", minScore: 40, maxScore: 70 },
        { bandId: "b-healthy", label: "Healthy", minScore: 70, maxScore: 100 },
    ],
};

/** activity (w0.6) + recency (w0.4) for two members. */
function twoFactorRubric(): WeightedFactor[] {
    return [
        {
            factorId: "activity",
            weight: 0.6,
            results: new Map([
                ["m1", norm(0.53)],
                ["m2", norm(1.0)],
            ]),
        },
        {
            factorId: "recency",
            weight: 0.4,
            results: new Map([
                ["m1", norm(0.8)],
                ["m2", norm(0.2)],
            ]),
        },
    ];
}

describe("ScoringEngine", () => {
    it("combines weighted contributions and scales to the model range", () => {
        const scores = new ScoringEngine().score(spec, twoFactorRubric());

        // m1: 0.6*0.53 + 0.4*0.8 = 0.638 raw → /1.0 *100 = 63.8
        expect(scores.get("m1")?.rawScore).toBeCloseTo(0.638);
        expect(scores.get("m1")?.normalizedScore).toBeCloseTo(63.8);
        expect(scores.get("m1")?.bandLabel).toBe("Neutral");
    });

    it("itemizes per-factor contributions for explainability", () => {
        const scores = new ScoringEngine().score(spec, twoFactorRubric());

        const contributions = scores.get("m1")?.contributions ?? [];
        expect(contributions).toHaveLength(2);
        expect(contributions.find((c) => c.factorId === "activity")).toEqual({
            factorId: "activity",
            weight: 0.6,
            normalizedContribution: 0.53,
            weightedValue: 0.6 * 0.53,
        });
    });

    it("treats a missing factor as zero (denominator stays the full rubric weight)", () => {
        const rubric: WeightedFactor[] = [
            {
                factorId: "activity",
                weight: 0.6,
                results: new Map([["m1", norm(1.0)]]),
            },
            {
                factorId: "recency",
                weight: 0.4,
                results: new Map([["m1", norm(null)]]), // no data for m1
            },
        ];

        const scores = new ScoringEngine().score(spec, rubric);

        // only activity contributes: 0.6*1.0 = 0.6 raw → /1.0 *100 = 60 (recency drags it down)
        expect(scores.get("m1")?.rawScore).toBeCloseTo(0.6);
        expect(scores.get("m1")?.normalizedScore).toBeCloseTo(60);
        expect(scores.get("m1")?.contributions).toHaveLength(1);
    });

    it("leaves band null when the score falls outside every band", () => {
        const narrowBands: ScoringSpec = {
            ...spec,
            bands: [{ bandId: "b", label: "Only", minScore: 90, maxScore: 100 }],
        };

        const scores = new ScoringEngine().score(narrowBands, twoFactorRubric());

        expect(scores.get("m1")?.bandLabel).toBeNull();
        expect(scores.get("m1")?.bandId).toBeNull();
    });

    it("returns scaleMin when the total weight is zero", () => {
        const zeroWeight: WeightedFactor[] = [
            {
                factorId: "activity",
                weight: 0,
                results: new Map([["m1", norm(1.0)]]),
            },
        ];

        const scores = new ScoringEngine().score(spec, zeroWeight);

        expect(scores.get("m1")?.normalizedScore).toBe(0);
    });
});
