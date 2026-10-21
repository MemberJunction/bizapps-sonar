import { describe, expect, it } from "vitest";
import type { BandKey, BandSlice, BandTrendPoint } from "../../core/services/score-read.service";
import {
    BAND_ORDER, HISTORY_POINTS, bandColor, buildDistributionChart, buildHistoryChart,
    buildOverviewChart, formatSnapshotDate,
} from "./portfolio-charts";

/** The color rule ng-charts enforces (colors.ts): anything else is replaced by a default. */
const TOKEN_COLOR = /^var\(--[A-Za-z0-9-]+\)$/;

function slice(key: BandKey, count: number): BandSlice {
    return { bandId: `${key}-id`, label: key, key, count, pct: 0 };
}

function point(day: number, counts: Partial<Record<BandKey, number>>): BandTrendPoint {
    const full = { healthy: 0, watch: 0, atrisk: 0, critical: 0, ...counts };
    const total = Object.values(full).reduce((a, b) => a + b, 0);
    return { asOf: new Date(2026, 9, day), counts: full, total };
}

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
        { Name: "Churn", Distribution: [slice("healthy", 120), slice("critical", 4)] },
        { Name: "Renewal", Distribution: [slice("watch", 30), slice("atrisk", 9), slice("critical", 1)] },
    ];

    it("keeps the caller's row order as the categories", () => {
        expect(buildOverviewChart(rows).Categories).toEqual(["Churn", "Renewal"]);
    });

    it("emits one series per band, in band order, with values aligned to the rows", () => {
        const { Series } = buildOverviewChart(rows);
        expect(Series.map(s => s.Name)).toEqual(["Healthy", "Watch", "At Risk", "Critical"]);
        expect(Series.map(s => s.Values)).toEqual([[120, 0], [0, 30], [0, 9], [4, 1]]);
        expect(Series.map(s => s.Color)).toEqual(BAND_ORDER.map(bandColor));
    });

    it("never goes below the 180px floor and grows 52px per model", () => {
        expect(buildOverviewChart([]).Height).toBe(180);
        expect(buildOverviewChart(rows).Height).toBe(180);
        const many = Array.from({ length: 5 }, (_, i) => ({ Name: `M${i}`, Distribution: [] }));
        expect(buildOverviewChart(many).Height).toBe(5 * 52 + 60);
    });

    it("returns empty categories for no models, which the chart shows as its empty state", () => {
        const { Categories, Series } = buildOverviewChart([]);
        expect(Categories).toEqual([]);
        expect(Series.every(s => s.Values.length === 0)).toBe(true);
    });
});

describe("buildDistributionChart", () => {
    it("emits one slice per band in band order, zero for a band with no members", () => {
        const { Slices } = buildDistributionChart([slice("critical", 7), slice("healthy", 93)], 100);
        expect(Slices.map(s => [s.Label, s.Value])).toEqual([
            ["Healthy", 93], ["Watch", 0], ["At Risk", 0], ["Critical", 7],
        ]);
        expect(Slices.every(s => TOKEN_COLOR.test(s.Color ?? ""))).toBe(true);
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
        ]);
        expect(Categories).toEqual([formatSnapshotDate(new Date(2026, 9, 1)), formatSnapshotDate(new Date(2026, 9, 8))]);
        expect(Series.map(s => s.Values)).toEqual([[50, 40], [0, 10], [0, 0], [5, 5]]);
    });

    it(`keeps only the last ${HISTORY_POINTS} snapshots`, () => {
        const points = Array.from({ length: HISTORY_POINTS + 3 }, (_, i) => point(i + 1, { healthy: i }));
        const { Categories, Series } = buildHistoryChart(points);
        expect(Categories).toHaveLength(HISTORY_POINTS);
        expect(Series[0].Values[0]).toBe(3);
        expect(Series[0].Values.at(-1)).toBe(HISTORY_POINTS + 2);
    });

    it("returns no categories when there is no history yet", () => {
        expect(buildHistoryChart([]).Categories).toEqual([]);
    });
});

describe("formatSnapshotDate", () => {
    it("renders a short month and day", () => {
        expect(formatSnapshotDate(new Date(2026, 9, 14))).toBe("Oct 14");
    });
});
