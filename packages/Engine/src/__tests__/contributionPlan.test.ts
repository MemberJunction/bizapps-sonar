import { describe, it, expect } from "vitest";
import { planContributions, percentOfTotal } from "../scoring/contributionPlan";

// The persist path reconciles contribution rows in place rather than deleting the model's rows and
// re-inserting, because Record Set Processing has no run-spanning transaction to roll a bulk delete
// back. These are the decisions that reconcile makes.
describe("planContributions", () => {
    it("reuses every row when the counts match", () => {
        expect(planContributions(2, 2)).toEqual({ Update: 2, Insert: 0, Delete: 0 });
    });

    it("inserts the shortfall when the model gained factors", () => {
        expect(planContributions(2, 5)).toEqual({ Update: 2, Insert: 3, Delete: 0 });
    });

    it("deletes the surplus when a republished version dropped factors", () => {
        // The arm that matters: a leftover row would show a factor the current version no longer
        // scores, which is worse than showing nothing.
        expect(planContributions(5, 2)).toEqual({ Update: 2, Insert: 0, Delete: 3 });
    });

    it("inserts everything for an anchor scored for the first time", () => {
        expect(planContributions(0, 3)).toEqual({ Update: 0, Insert: 3, Delete: 0 });
    });

    it("deletes everything when an anchor computes no contributions", () => {
        expect(planContributions(3, 0)).toEqual({ Update: 0, Insert: 0, Delete: 3 });
    });

    it("is a no-op for an empty-to-empty reconcile", () => {
        expect(planContributions(0, 0)).toEqual({ Update: 0, Insert: 0, Delete: 0 });
    });

    it("treats negative counts as zero rather than emitting negative work", () => {
        expect(planContributions(-1, -1)).toEqual({ Update: 0, Insert: 0, Delete: 0 });
    });
});

describe("percentOfTotal", () => {
    it("divides the weighted value by the raw score", () => {
        expect(percentOfTotal(2.5, 10)).toBe(0.25);
    });

    it("returns null when the raw score is zero rather than dividing by it", () => {
        // Guards the Infinity/NaN that a naive divide would persist into PercentOfTotal.
        expect(percentOfTotal(2.5, 0)).toBeNull();
    });

    it("handles a negative raw score without special-casing the sign", () => {
        expect(percentOfTotal(-2, -8)).toBe(0.25);
    });

    it("returns null for non-finite inputs", () => {
        expect(percentOfTotal(1, NaN)).toBeNull();
        expect(percentOfTotal(1, Infinity)).toBeNull();
        expect(percentOfTotal(NaN, 10)).toBeNull();
        expect(percentOfTotal(Infinity, 10)).toBeNull();
    });

    it("is zero for a factor the member had no data on — the documented trap", () => {
        // A missing factor contributes 0, so its share reads 0 exactly when the factor is hurting
        // the member most. Callers reasoning about "why" must rank on ModelFactor.Weight instead.
        expect(percentOfTotal(0, 42)).toBe(0);
    });
});
