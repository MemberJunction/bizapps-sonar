import { describe, expect, it } from "vitest";
import type { BandKey, BandSlice } from "./services/score-read.service";
import { BAND_ORDER, aggregateByKey } from "./band-aggregate";

function slice(key: BandKey, label: string, count: number): BandSlice {
    return { bandId: `${label}-id`, label, key, count, pct: 0 };
}

describe("aggregateByKey", () => {
    it("keeps one row per key present, in band order, with the band's own label", () => {
        const rows = aggregateByKey([slice("critical", "At Risk", 371), slice("healthy", "Healthy", 6), slice("atrisk", "Neutral", 57)]);
        expect(rows).toEqual([
            { key: "healthy", label: "Healthy", count: 6 },
            { key: "atrisk", label: "Neutral", count: 57 },
            { key: "critical", label: "At Risk", count: 371 },
        ]);
    });

    it("sums the counts of slices that share a key and joins their labels", () => {
        const rows = aggregateByKey([slice("atrisk", "Poor", 40), slice("atrisk", "Fair", 30), slice("healthy", "Great", 10)]);
        expect(rows).toEqual([
            { key: "healthy", label: "Great", count: 10 },
            { key: "atrisk", label: "Poor / Fair", count: 70 },
        ]);
    });

    it("returns no rows for no slices", () => {
        expect(aggregateByKey([])).toEqual([]);
    });
});

describe("BAND_ORDER", () => {
    it("runs from the healthy end to the critical end", () => {
        expect(BAND_ORDER).toEqual(["healthy", "watch", "atrisk", "critical"]);
    });
});
