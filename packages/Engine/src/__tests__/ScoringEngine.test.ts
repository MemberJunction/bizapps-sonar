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
            modelFactorId: "mf-activity",
            weight: 0.6,
            results: new Map([
                ["m1", norm(0.53)],
                ["m2", norm(1.0)],
            ]),
        },
        {
            factorId: "recency",
            modelFactorId: "mf-recency",
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
            modelFactorId: "mf-activity",
            weight: 0.6,
            rawValue: null,
            normalizedContribution: 0.53,
            weightedValue: 0.6 * 0.53,
            hadData: true,
        });
    });

    it("treats a missing factor as zero (denominator stays the full rubric weight)", () => {
        const rubric: WeightedFactor[] = [
            {
                factorId: "activity",
                modelFactorId: "mf-activity",
                weight: 0.6,
                results: new Map([["m1", norm(1.0)]]),
            },
            {
                factorId: "recency",
                modelFactorId: "mf-recency",
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
                modelFactorId: "mf-activity",
                weight: 0,
                results: new Map([["m1", norm(1.0)]]),
            },
        ];

        const scores = new ScoringEngine().score(spec, zeroWeight);

        expect(scores.get("m1")?.normalizedScore).toBe(0);
    });
});

describe("ScoringEngine — band boundaries (half-open, order-independent)", () => {
    // One factor, weight 1, scale 0–100 → normalizedScore = normalizedContribution × 100.
    function bandFor(normalized: number, bands: ScoringSpec["bands"]): string | null {
        const s: ScoringSpec = { scaleMin: 0, scaleMax: 100, bands };
        const rubric: WeightedFactor[] = [
            { factorId: "f", modelFactorId: "mf", weight: 1, results: new Map([["m", norm(normalized)]]) },
        ];
        return new ScoringEngine().score(s, rubric).get("m")?.bandLabel ?? null;
    }

    it("assigns a shared-boundary score to the UPPER band", () => {
        expect(bandFor(0.40, spec.bands)).toBe("Neutral"); // 40 → [40,70), not [0,40)
        expect(bandFor(0.70, spec.bands)).toBe("Healthy"); // 70 → [70,100]
    });

    it("includes the maximum score in the top band", () => {
        expect(bandFor(1.0, spec.bands)).toBe("Healthy"); // 100 → top band, inclusive
    });

    it("gives the same band regardless of band order", () => {
        const reversed = [...spec.bands].reverse();
        expect(bandFor(0.40, reversed)).toBe("Neutral");
        expect(bandFor(1.0, reversed)).toBe("Healthy");
        expect(bandFor(0.20, reversed)).toBe("At Risk");
    });
});
