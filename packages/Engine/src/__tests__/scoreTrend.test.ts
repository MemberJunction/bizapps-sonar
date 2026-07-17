import { describe, it, expect } from "vitest";
import {
    computeDelta,
    dataCompleteness,
    detectBandTransition,
    latestBaselinePerAnchor,
    trendDirection,
} from "../scoring/scoreTrend";

describe("computeDelta", () => {
    it("is current − baseline when a prior score exists", () => {
        expect(computeDelta(72, 60)).toBe(12);
        expect(computeDelta(55, 80)).toBe(-25);
    });

    it("is null when there's no prior score (not enough history)", () => {
        expect(computeDelta(72, null)).toBeNull();
    });

    it("treats a 0 baseline as a real comparison, not 'missing'", () => {
        expect(computeDelta(5, 0)).toBe(5);
    });
});

describe("trendDirection", () => {
    it("reads Up / Down past the deadband and Flat within it", () => {
        expect(trendDirection(0.6)).toBe("Up");
        expect(trendDirection(-0.6)).toBe("Down");
        expect(trendDirection(0.4)).toBe("Flat");
        expect(trendDirection(-0.4)).toBe("Flat");
    });

    it("holds the deadband boundary itself as Flat (strict >)", () => {
        expect(trendDirection(0.5)).toBe("Flat");
        expect(trendDirection(-0.5)).toBe("Flat");
    });

    it("is null when there's no delta to read", () => {
        expect(trendDirection(null)).toBeNull();
    });

    it("honors a custom deadband", () => {
        expect(trendDirection(3, 5)).toBe("Flat");
        expect(trendDirection(6, 5)).toBe("Up");
    });
});

describe("dataCompleteness", () => {
    it("is the fraction of counted factors that had data", () => {
        expect(
            dataCompleteness([{ hadData: true }, { hadData: false }, { hadData: true }, { hadData: false }]),
        ).toBe(0.5);
        expect(dataCompleteness([{ hadData: true }, { hadData: true }])).toBe(1);
    });

    it("is null when nothing counted (avoids 0/0)", () => {
        expect(dataCompleteness([])).toBeNull();
    });
});

describe("latestBaselinePerAnchor", () => {
    it("keeps the most recent snapshot per anchor from DESC-ordered rows", () => {
        // Rows arrive newest-first; the first seen per anchor wins, older ones are ignored.
        const rows = [
            { AnchorRecordID: "m1", NormalizedScore: 70, BandID: "b-healthy" }, // newest for m1
            { AnchorRecordID: "m2", NormalizedScore: 40, BandID: "b-watch" }, // newest for m2
            { AnchorRecordID: "m1", NormalizedScore: 55, BandID: "b-watch" }, // older m1 — ignored
        ];
        const baselines = latestBaselinePerAnchor(rows);

        expect(baselines.get("m1")).toEqual({ score: 70, band: "b-healthy" });
        expect(baselines.get("m2")).toEqual({ score: 40, band: "b-watch" });
        expect(baselines.size).toBe(2);
    });

    it("is empty when there are no rows", () => {
        expect(latestBaselinePerAnchor([]).size).toBe(0);
    });
});

describe("detectBandTransition", () => {
    it("records a crossing when an already-scored anchor changes band", () => {
        expect(detectBandTransition("b-healthy", "b-atrisk", true, -12)).toEqual({
            fromBandId: "b-healthy",
            toBandId: "b-atrisk",
            direction: "Worsening",
        });
    });

    it("reads a rising move as Improving", () => {
        expect(detectBandTransition("b-atrisk", "b-healthy", true, 12)).toEqual({
            fromBandId: "b-atrisk",
            toBandId: "b-healthy",
            direction: "Improving",
        });
    });

    it("does not record when the band is unchanged", () => {
        expect(detectBandTransition("b-healthy", "b-healthy", true, 3)).toBeNull();
    });

    it("does not record for a brand-new anchor (no prior)", () => {
        expect(detectBandTransition(null, "b-healthy", false, null)).toBeNull();
    });

    it("records a first-time band assignment as a transition once a prior score exists", () => {
        // Prior score with no band (null) → now banded: that's a real crossing.
        expect(detectBandTransition(null, "b-watch", true, 5)).toEqual({
            fromBandId: null,
            toBandId: "b-watch",
            direction: "Improving",
        });
    });

    it("defaults a null run-over-run delta to Improving (held), never throws", () => {
        expect(detectBandTransition("b-watch", "b-healthy", true, null)?.direction).toBe("Improving");
    });
});
