import type { ChartSeries, DonutSlice } from "@memberjunction/ng-charts";
import type { BandKey, BandTrendPoint } from "../../core/services/score-read.service";
import { BAND_ORDER, type BandKeyRow } from "../../core/band-aggregate";

/**
 * Inputs for the Portfolio's three chart lenses (@memberjunction/ng-charts), built from band data
 * that is already loaded. Pure presentation mapping: no I/O, no Angular, so it is unit-tested on
 * its own (portfolio-charts.test.ts). The chart package and the MJ data services are type-only
 * imports, and band-aggregate is itself pure, so loading this file pulls in neither.
 *
 * Band rows come from aggregateByKey: one row per band key, counts summed, labels the model's own
 * band names. A series exists only for a key some band maps to, so a 3-band set gets 3 series.
 */

/** Names a key in History when the focused model's current distribution has no band for it. */
const FALLBACK_LABELS: Readonly<Record<BandKey, string>> = {
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
    Distribution: readonly BandKeyRow[];
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

function rowFor(distribution: readonly BandKeyRow[], key: BandKey): BandKeyRow | undefined {
    return distribution.find(d => d.key === key);
}

/** Overview: horizontal stacked bar, one row per model (in the given order), one series per band key. */
export function buildOverviewChart(rows: readonly OverviewRow[]): OverviewChartInput {
    const series = BAND_ORDER.flatMap(key => {
        // Models can name the same key differently; the legend lists each distinct name once.
        const labels = [...new Set(rows.flatMap(r => rowFor(r.Distribution, key)?.label ?? []))];
        if (labels.length === 0) return [];
        return [{
            Name: labels.join(" / "),
            Values: rows.map(r => rowFor(r.Distribution, key)?.count ?? 0),
            Color: bandColor(key),
        }];
    });
    const height = Math.max(OVERVIEW_MIN_PX, rows.length * OVERVIEW_ROW_PX + OVERVIEW_CHROME_PX);
    return { Categories: rows.map(r => r.Name), Series: series, Height: height };
}

/** Distribution: one donut slice per band key, with the scored-member total for the center. */
export function buildDistributionChart(distribution: readonly BandKeyRow[], scoredCount: number): DistributionChartInput {
    const slices = distribution.map(row => ({ Label: row.label, Value: row.count, Color: bandColor(row.key) }));
    return { Slices: slices, CenterValue: scoredCount.toLocaleString() };
}

/** Snapshot date as a short "Mon D" axis label. */
export function formatSnapshotDate(asOf: Date): string {
    return asOf.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * History: the band mix over the last HISTORY_POINTS snapshots. Values are raw member counts;
 * the chart's StackMode "percent" turns them into shares, so its tooltip can show both. Series are
 * named from the focused model's current bands; a key with members only in past snapshots keeps
 * its series under a generic name.
 */
export function buildHistoryChart(points: readonly BandTrendPoint[], distribution: readonly BandKeyRow[]): HistoryChartInput {
    const recent = points.slice(-HISTORY_POINTS);
    const series = BAND_ORDER.flatMap(key => {
        const current = rowFor(distribution, key);
        const values = recent.map(pt => pt.counts[key] ?? 0);
        if (!current && values.every(v => v === 0)) return [];
        return [{ Name: current?.label ?? FALLBACK_LABELS[key], Values: values, Color: bandColor(key) }];
    });
    return { Categories: recent.map(pt => formatSnapshotDate(pt.asOf)), Series: series };
}
