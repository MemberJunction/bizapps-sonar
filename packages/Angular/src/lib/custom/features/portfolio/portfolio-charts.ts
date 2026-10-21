import type { ChartSeries, DonutSlice } from "@memberjunction/ng-charts";
import type { BandKey, BandSlice, BandTrendPoint } from "../../core/services/score-read.service";

/**
 * Inputs for the Portfolio's three chart lenses (@memberjunction/ng-charts), built from band data
 * that is already loaded. Pure presentation mapping: no I/O, no Angular, so it is unit-tested on
 * its own (portfolio-charts.test.ts). Imports above are type-only, so loading this file pulls in
 * neither the chart package nor the MJ data services.
 */

/** Every band chart stacks and lists bands in this order. */
export const BAND_ORDER: readonly BandKey[] = ["healthy", "watch", "atrisk", "critical"];

export const BAND_LABELS: Readonly<Record<BandKey, string>> = {
    healthy:  "Healthy",
    watch:    "Watch",
    atrisk:   "At Risk",
    critical: "Critical",
};

/** The History lens shows this many of the most recent recompute snapshots. */
export const HISTORY_POINTS = 8;

/** Overview height: one row per model plus room for the axis and legend, with a floor. */
const OVERVIEW_ROW_PX = 52;
const OVERVIEW_CHROME_PX = 60;
const OVERVIEW_MIN_PX = 180;

/**
 * The color for a band, as a reference to its page-wide token (sonar-shell.css). ng-charts accepts
 * only `var(--token)` colors, and a page-wide token is what lets the chart tooltip, which renders
 * outside the Sonar component, resolve the same color.
 */
export function bandColor(key: BandKey): string {
    return `var(--sonar-${key})`;
}

/** One model row in the Overview lens. */
export interface OverviewRow {
    Name: string;
    Distribution: readonly BandSlice[];
}

export interface OverviewChartInput {
    Categories: string[];
    Series: ChartSeries[];
    Height: number;
}

export interface DistributionChartInput {
    Slices: DonutSlice[];
    CenterValue: string;
}

export interface HistoryChartInput {
    Categories: string[];
    Series: ChartSeries[];
}

function bandCount(distribution: readonly BandSlice[], key: BandKey): number {
    return distribution.find(d => d.key === key)?.count ?? 0;
}

/** Overview: horizontal stacked bar, one row per model (in the given order), one series per band. */
export function buildOverviewChart(rows: readonly OverviewRow[]): OverviewChartInput {
    const series = BAND_ORDER.map(key => ({
        Name: BAND_LABELS[key],
        Values: rows.map(r => bandCount(r.Distribution, key)),
        Color: bandColor(key),
    }));
    const height = Math.max(OVERVIEW_MIN_PX, rows.length * OVERVIEW_ROW_PX + OVERVIEW_CHROME_PX);
    return { Categories: rows.map(r => r.Name), Series: series, Height: height };
}

/** Distribution: one donut slice per band, with the scored-member total for the center. */
export function buildDistributionChart(distribution: readonly BandSlice[], scoredCount: number): DistributionChartInput {
    const slices = BAND_ORDER.map(key => ({
        Label: BAND_LABELS[key],
        Value: bandCount(distribution, key),
        Color: bandColor(key),
    }));
    return { Slices: slices, CenterValue: scoredCount.toLocaleString() };
}

/** Snapshot date as a short "Mon D" axis label. */
export function formatSnapshotDate(asOf: Date): string {
    return asOf.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * History: the band mix over the last HISTORY_POINTS snapshots. Values are raw member counts;
 * the chart's StackMode "percent" turns them into shares, so its tooltip can show both.
 */
export function buildHistoryChart(points: readonly BandTrendPoint[]): HistoryChartInput {
    const recent = points.slice(-HISTORY_POINTS);
    const series = BAND_ORDER.map(key => ({
        Name: BAND_LABELS[key],
        Values: recent.map(pt => pt.counts[key] ?? 0),
        Color: bandColor(key),
    }));
    return { Categories: recent.map(pt => formatSnapshotDate(pt.asOf)), Series: series };
}
