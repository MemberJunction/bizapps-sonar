import { describe, expect, it } from "vitest";
import { selectDepartedAnchors } from "../orchestration/populationExit";

describe("selectDepartedAnchors", () => {
    it("returns anchors with an existing Score that the run did not score", () => {
        expect(selectDepartedAnchors(["a", "b", "c"], new Set(["a", "c"]))).toEqual(["b"]);
    });

    it("returns nothing when every existing anchor was scored (steady state)", () => {
        expect(selectDepartedAnchors(["a", "b"], new Set(["a", "b", "newcomer"]))).toEqual([]);
    });

    it("returns every existing anchor when the run scored a disjoint population (filter rewrite)", () => {
        expect(selectDepartedAnchors(["a", "b"], new Set(["x", "y"]))).toEqual(["a", "b"]);
    });

    it("returns nothing when there were no existing Scores (first run)", () => {
        expect(selectDepartedAnchors([], new Set(["a"]))).toEqual([]);
    });

    it("preserves the iteration order of the existing set (deterministic deletes)", () => {
        expect(selectDepartedAnchors(["c", "a", "b"], new Set())).toEqual(["c", "a", "b"]);
    });
});
