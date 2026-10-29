import type { BandKey, BandSlice } from "./services/score-read.service";

/**
 * The one place that decides how a band distribution collapses onto the four band keys. Every
 * surface that charts or tabulates bands by key goes through here, so they cannot disagree about
 * counts or names (the Portfolio once kept only the first band per key and named keys with fixed
 * labels, while the Overview summed and kept the bands' own labels). Pure: type-only imports.
 */

/** Band-key severity order, healthy end first — drives row, series and legend order. */
export const BAND_ORDER: readonly BandKey[] = ["healthy", "watch", "atrisk", "critical"];

/** One band key's share of a distribution: summed count, and the label(s) of the bands it holds. */
export interface BandKeyRow { key: BandKey; label: string; count: number; }

/** Collapse slices sharing a band key (e.g. two labels both mapping to "watch") into one row,
 *  since trend counts are keyed by BandKey. Rows come out in severity order. */
export function aggregateByKey(slices: readonly BandSlice[]): BandKeyRow[] {
    const byKey = new Map<BandKey, BandKeyRow>();
    for (const s of slices) {
        const row = byKey.get(s.key);
        if (row) { row.count += s.count; row.label = `${row.label} / ${s.label}`; }
        else byKey.set(s.key, { key: s.key, label: s.label, count: s.count });
    }
    return BAND_ORDER.filter((k) => byKey.has(k)).map((k) => byKey.get(k)!);
}
