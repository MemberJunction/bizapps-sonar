import { describe, it, expect } from "vitest";
import {
    EffectiveMissingDataPolicy,
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

const POP = ["m1", "m2"];

/** activity (w0.6) + recency (w0.4) for two members; both default to the Zero policy. */
function twoFactorRubric(): WeightedFactor[] {
    return [
        {
            factorId: "activity",
            modelFactorId: "mf-activity",
            weight: 0.6,
            missingDataPolicy: "Zero",
            results: new Map([
                ["m1", norm(0.53)],
                ["m2", norm(1.0)],
            ]),
        },
        {
            factorId: "recency",
            modelFactorId: "mf-recency",
            weight: 0.4,
            missingDataPolicy: "Zero",
            results: new Map([
                ["m1", norm(0.8)],
                ["m2", norm(0.2)],
            ]),
        },
    ];
}

/** activity has data for m1; recency is missing for everyone, under the given policy. */
function oneMissingRubric(recencyPolicy: EffectiveMissingDataPolicy): WeightedFactor[] {
    return [
        {
            factorId: "activity",
            modelFactorId: "mf-activity",
            weight: 0.6,
            missingDataPolicy: "Zero",
            results: new Map([["m1", norm(1.0)]]),
        },
        {
            factorId: "recency",
            modelFactorId: "mf-recency",
            weight: 0.4,
            missingDataPolicy: recencyPolicy,
            results: new Map(), // missing for all members
        },
    ];
}

describe("ScoringEngine", () => {
    it("combines weighted contributions and scales to the model range", () => {
        const scores = new ScoringEngine().score(spec, twoFactorRubric(), POP);

        // m1: 0.6*0.53 + 0.4*0.8 = 0.638 raw → /1.0 *100 = 63.8
        expect(scores.get("m1")?.rawScore).toBeCloseTo(0.638);
        expect(scores.get("m1")?.normalizedScore).toBeCloseTo(63.8);
        expect(scores.get("m1")?.bandLabel).toBe("Neutral");
    });

    it("itemizes per-factor contributions for explainability", () => {
        const scores = new ScoringEngine().score(spec, twoFactorRubric(), POP);

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
            missingDataApplied: false,
        });
    });

    it("Zero policy: a missing factor counts as 0 but keeps its weight (drags the score)", () => {
        const scores = new ScoringEngine().score(spec, oneMissingRubric("Zero"), ["m1"]);

        // activity 0.6*1.0 + recency 0.4*0 = 0.6 raw → /1.0 *100 = 60 (recency drags it)
        expect(scores.get("m1")?.normalizedScore).toBeCloseTo(60);
        const recency = scores.get("m1")?.contributions.find((c) => c.factorId === "recency");
        expect(recency).toMatchObject({ normalizedContribution: 0, hadData: false, missingDataApplied: true });
    });

    it("Exclude policy: a missing factor drops out of numerator AND denominator (no drag)", () => {
        const scores = new ScoringEngine().score(spec, oneMissingRubric("Exclude"), ["m1"]);

        // only activity counts: 0.6*1.0 / 0.6 *100 = 100 — recency doesn't drag
        expect(scores.get("m1")?.normalizedScore).toBeCloseTo(100);
        expect(scores.get("m1")?.contributions).toHaveLength(1);
    });

    it("NeutralMidpoint policy: a missing factor counts as 0.5", () => {
        const scores = new ScoringEngine().score(spec, oneMissingRubric("NeutralMidpoint"), ["m1"]);

        // activity 0.6*1.0 + recency 0.4*0.5 = 0.8 → /1.0 *100 = 80
        expect(scores.get("m1")?.normalizedScore).toBeCloseTo(80);
    });

    it("NeutralMidpoint fills the factor's OWN range midpoint, not a hardcoded 0.5", () => {
        const rubric: WeightedFactor[] = [
            {
                factorId: "ranged",
                modelFactorId: "mf-ranged",
                weight: 1,
                missingDataPolicy: "NeutralMidpoint",
                outputMin: 0,
                outputMax: 100, // custom output range
                results: new Map(), // missing for all
            },
        ];
        const contrib = new ScoringEngine().score(spec, rubric, ["m1"]).get("m1")?.contributions[0];
        expect(contrib?.normalizedContribution).toBe(50); // (0 + 100) / 2, not 0.5
        expect(contrib?.missingDataApplied).toBe(true);
    });

    it("Zero stays a literal 0 regardless of the factor's output range", () => {
        const rubric: WeightedFactor[] = [
            {
                factorId: "ranged",
                modelFactorId: "mf-ranged",
                weight: 1,
                missingDataPolicy: "Zero",
                outputMin: 0.2,
                outputMax: 1,
                results: new Map(),
            },
        ];
        const contrib = new ScoringEngine().score(spec, rubric, ["m1"]).get("m1")?.contributions[0];
        expect(contrib?.normalizedContribution).toBe(0);
    });

    it("scores a member with no data in any factor (Zero → floor) so the disengaged still surface", () => {
        // population includes m2, but no factor has data for it → all missing
        const scores = new ScoringEngine().score(spec, oneMissingRubric("Zero"), ["m1", "m2"]);

        expect(scores.get("m2")?.normalizedScore).toBe(0);
        expect(scores.get("m2")?.bandLabel).toBe("At Risk");
    });

    it("leaves a member unscored when every factor it's missing is Excluded (nothing to score)", () => {
        const rubric = oneMissingRubric("Exclude");
        rubric[0].missingDataPolicy = "Exclude"; // activity also Exclude
        const scores = new ScoringEngine().score(spec, rubric, ["m1", "m2"]);

        // m1 has activity data → scored; m2 has no data and both factors Exclude → denominator 0
        expect(scores.get("m1")?.normalizedScore).toBeCloseTo(100);
        expect(scores.has("m2")).toBe(false);
    });

    it("leaves band null when the score falls outside every band", () => {
        const narrowBands: ScoringSpec = {
            ...spec,
            bands: [{ bandId: "b", label: "Only", minScore: 90, maxScore: 100 }],
        };

        const scores = new ScoringEngine().score(narrowBands, twoFactorRubric(), POP);

        expect(scores.get("m1")?.bandLabel).toBeNull();
        expect(scores.get("m1")?.bandId).toBeNull();
    });

    it("leaves a member unscored when the total effective weight is zero", () => {
        const zeroWeight: WeightedFactor[] = [
            {
                factorId: "activity",
                modelFactorId: "mf-activity",
                weight: 0,
                missingDataPolicy: "Zero",
                results: new Map([["m1", norm(1.0)]]),
            },
        ];

        const scores = new ScoringEngine().score(spec, zeroWeight, ["m1"]);

        expect(scores.has("m1")).toBe(false);
    });
});
