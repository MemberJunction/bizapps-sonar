import { describe, expect, it } from "vitest";
import type { BandKey, BandTrendPoint } from "../../core/services/score-read.service";
import { BAND_ORDER, type BandKeyRow } from "../../core/band-aggregate";
import {
    HISTORY_POINTS, bandColor, buildDistributionChart, buildHistoryChart,
    buildOverviewChart, formatSnapshotDate,
} from "./portfolio-charts";

/** The color rule ng-charts enforces (colors.ts): anything else is replaced by a default. */
const TOKEN_COLOR = /^var\(--[A-Za-z0-9-]+\)$/;

/** A band key's aggregated row, as loadSlot stores it (aggregateByKey output). */
function band(key: BandKey, label: string, count: number): BandKeyRow {
    return { key, label, count };
}

function point(day: number, counts: Partial<Record<BandKey, number>>): BandTrendPoint {
    const full = { healthy: 0, watch: 0, atrisk: 0, critical: 0, ...counts };
    const total = Object.values(full).reduce((a, b) => a + b, 0);
    return { asOf: new Date(2026, 9, day), counts: full, total };
}

/** The seeded 3-band set: severity ranks 0/1/2 map to keys healthy/atrisk/critical. */
const THREE_BAND = [band("healthy", "Healthy", 6), band("atrisk", "Neutral", 57), band("critical", "At Risk", 371)];

describe("bandColor", () => {
    it("references the page-wide band token in the form ng-charts accepts", () => {
        for (const key of BAND_ORDER) {
            expect(bandColor(key)).toBe(`var(--sonar-${key})`);
            expect(bandColor(key)).toMatch(TOKEN_COLOR);
        }
    });
});

describe("buildOverviewChart", () => {
    const rows = [
        { Name: "Churn", Distribution: [band("healthy", "Healthy", 120), band("critical", "Critical", 4)] },
        { Name: "Renewal", Distribution: [band("watch", "Watch", 30), band("atrisk", "At Risk", 9), band("critical", "Critical", 1)] },
    ];

    it("keeps the caller's row order as the categories", () => {
        expect(buildOverviewChart(rows).Categories).toEqual(["Churn", "Renewal"]);
    });

    it("emits one series per band key some model has, in band order, with values aligned to the rows", () => {
        const { Series } = buildOverviewChart(rows);
        expect(Series.map(s => s.Name)).toEqual(["Healthy", "Watch", "At Risk", "Critical"]);
        expect(Series.map(s => s.Values)).toEqual([[120, 0], [0, 30], [0, 9], [4, 1]]);
        expect(Series.map(s => s.Color)).toEqual(BAND_ORDER.map(bandColor));
    });

    it("names each series with the bands' own labels, not a fixed vocabulary", () => {
        const { Series } = buildOverviewChart([{ Name: "App coverage", Distribution: THREE_BAND }]);
        expect(Series.map(s => [s.Name, s.Values[0]])).toEqual([["Healthy", 6], ["Neutral", 57], ["At Risk", 371]]);
    });

    it("emits no series for a band key no model has", () => {
        const { Series } = buildOverviewChart([{ Name: "App coverage", Distribution: THREE_BAND }]);
        expect(Series.some(s => s.Color === bandColor("watch"))).toBe(false);
    });

    it("joins the distinct labels models use for the same key", () => {
        const { Series } = buildOverviewChart([
            { Name: "A", Distribution: [band("atrisk", "Neutral", 5)] },
            { Name: "B", Distribution: [band("atrisk", "At Risk", 7)] },
            { Name: "C", Distribution: [band("atrisk", "Neutral", 1)] },
        ]);
        expect(Series.map(s => [s.Name, s.Values])).toEqual([["Neutral / At Risk", [5, 7, 1]]]);
    });

    it("never goes below the 180px floor and grows 52px per model", () => {
        expect(buildOverviewChart([]).Height).toBe(180);
        expect(buildOverviewChart(rows).Height).toBe(180);
        const many = Array.from({ length: 5 }, (_, i) => ({ Name: `M${i}`, Distribution: [] }));
        expect(buildOverviewChart(many).Height).toBe(5 * 52 + 60);
    });

    it("returns empty categories and no series for no models, which the chart shows as its empty state", () => {
        const { Categories, Series } = buildOverviewChart([]);
        expect(Categories).toEqual([]);
        expect(Series).toEqual([]);
    });
});

describe("buildDistributionChart", () => {
    it("emits one slice per band key present, in band order, with the band's own label", () => {
        const { Slices } = buildDistributionChart(THREE_BAND, 434);
        expect(Slices.map(s => [s.Label, s.Value])).toEqual([["Healthy", 6], ["Neutral", 57], ["At Risk", 371]]);
        expect(Slices.every(s => TOKEN_COLOR.test(s.Color ?? ""))).toBe(true);
        expect(Slices.map(s => s.Color)).toEqual([bandColor("healthy"), bandColor("atrisk"), bandColor("critical")]);
    });

    it("emits no slices for no bands, which the chart shows as 'No data'", () => {
        expect(buildDistributionChart([], 0).Slices).toEqual([]);
    });

    it("formats the scored total for the center", () => {
        expect(buildDistributionChart([], 12345).CenterValue).toBe((12345).toLocaleString());
        expect(buildDistributionChart([], 0).CenterValue).toBe("0");
    });
});

describe("buildHistoryChart", () => {
    it("passes raw member counts per band, aligned to the snapshot dates", () => {
        const { Categories, Series } = buildHistoryChart([
            point(1, { healthy: 50, critical: 5 }),
            point(8, { healthy: 40, watch: 10, critical: 5 }),
        ], []);
        expect(Categories).toEqual([formatSnapshotDate(new Date(2026, 9, 1)), formatSnapshotDate(new Date(2026, 9, 8))]);
        expect(Series.map(s => s.Values)).toEqual([[50, 40], [0, 10], [5, 5]]);
    });

    it("names series with the focused model's band labels and skips keys with no band and no members", () => {
        const { Series } = buildHistoryChart([point(1, { healthy: 36, atrisk: 175, critical: 223 })], THREE_BAND);
        expect(Series.map(s => [s.Name, s.Values[0]])).toEqual([["Healthy", 36], ["Neutral", 175], ["At Risk", 223]]);
    });

    it("keeps a key that had members in history even when the current distribution has none", () => {
        const { Series } = buildHistoryChart([point(1, { healthy: 1, watch: 4 }), point(2, { healthy: 5 })], [band("healthy", "Healthy", 5)]);
        expect(Series.map(s => [s.Name, s.Values])).toEqual([["Healthy", [1, 5]], ["Watch", [4, 0]]]);
    });

    it(`keeps only the last ${HISTORY_POINTS} snapshots`, () => {
        const points = Array.from({ length: HISTORY_POINTS + 3 }, (_, i) => point(i + 1, { healthy: i }));
        const { Categories, Series } = buildHistoryChart(points, []);
        expect(Categories).toHaveLength(HISTORY_POINTS);
        expect(Series[0].Values[0]).toBe(3);
        expect(Series[0].Values.at(-1)).toBe(HISTORY_POINTS + 2);
    });

    it("returns no categories when there is no history yet", () => {
        expect(buildHistoryChart([], THREE_BAND).Categories).toEqual([]);
    });
});

describe("formatSnapshotDate", () => {
    it("renders a short month and day", () => {
        expect(formatSnapshotDate(new Date(2026, 9, 14))).toBe("Oct 14");
    });
});
