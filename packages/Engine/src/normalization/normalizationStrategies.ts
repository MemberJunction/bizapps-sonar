import type { FactorResult } from "../contracts/IFactorEvaluator";

/**
 * Normalization turns a factor's raw aggregate into a comparable 0..1-ish contribution
 * (plan §6.1 step 4). Two families live behind one contract:
 *  - **population-relative** (MinMax / Percentile / ZScore): need every anchor's raw value
 *    at once, so they read the whole population in a single pass;
 *  - **per-value / parameterized** (Logistic / Banded / Lookup): map each raw value through a
 *    fixed curve/table configured by `NormalizationParamsJSON` — no population stats needed.
 *
 * Every method is an `INormalizationStrategy`; `NormalizationEngine` only pre-filters and
 * dispatches by method, so adding a method is a new class + one registry entry — the tested
 * paths are never edited (roadmap "INormalizationStrategy" design note).
 */

/** The seven methods the Factor schema enumerates (Factor.NormalizationMethod). */
export type NormalizationMethod =
    | "None"
    | "MinMax"
    | "Percentile"
    | "ZScore"
    | "Logistic"
    | "Banded"
    | "Lookup";

/** Logistic (sigmoid) params: `fraction = 1 / (1 + e^(−steepness·(x − midpoint)))`. */
export interface LogisticParams {
    method: "Logistic";
    /** Raw value that maps to the 0.5 midpoint of the curve. */
    midpoint: number;
    /** Curve sharpness; larger = a steeper transition around the midpoint. */
    steepness: number;
}

/** One step of a Banded mapping. */
export interface BandedEntry {
    /** Inclusive upper bound of this band; `null` = open-ended top band (catch-all). */
    max: number | null;
    /** The 0..1 fraction assigned to raw values that fall in this band. */
    output: number;
}

/** Banded params: bucket the raw value, emit the bucket's fraction. */
export interface BandedParams {
    method: "Banded";
    bands: BandedEntry[];
}

/** One exact-match row of a Lookup table. */
export interface LookupEntry {
    value: number;
    /** The 0..1 fraction emitted when the raw value equals `value`. */
    output: number;
}

/** Lookup params: exact-match table with a fallback for unmatched values. */
export interface LookupParams {
    method: "Lookup";
    entries: LookupEntry[];
    /** 0..1 fraction for raw values absent from the table. */
    fallback: number;
}

/** The parameterized methods' config, discriminated by `method`. */
export type NormalizationParams = LogisticParams | BandedParams | LookupParams;

/**
 * Resolved normalization config for one factor (the orchestrator derives this from the Factor
 * row's NormalizationMethod / params / OutputMin / OutputMax / HigherIsBetter). `params` is
 * required for the parameterized methods and absent for the population/pure ones.
 */
export interface NormalizationSpec {
    method: NormalizationMethod;
    /** Low end of the normalized output range (e.g. 0). */
    outputMin: number;
    /** High end of the normalized output range (e.g. 1). */
    outputMax: number;
    /** When false the scale is inverted — a lower raw value yields a higher contribution. */
    higherIsBetter: boolean;
    /** Config for Logistic/Banded/Lookup; undefined for None/MinMax/Percentile/ZScore. */
    params?: NormalizationParams;
}

/** One normalization method. `withData` is pre-filtered to results with a non-null rawValue. */
export interface INormalizationStrategy {
    apply(spec: NormalizationSpec, withData: FactorResult[]): void;
}

/** Assigned when there is no basis to rank a value (flat population, or no matching band). */
const NO_SPREAD_FRACTION = 0.5;

/** ZScore: standard deviations beyond ±this are clamped before mapping to the output range. */
const Z_CLAMP = 3;

/** Apply direction (HigherIsBetter), then scale a 0..1 fraction into [outputMin, outputMax]. */
export function toOutputRange(spec: NormalizationSpec, fraction: number): number {
    const directed = spec.higherIsBetter ? fraction : 1 - fraction;
    return spec.outputMin + directed * (spec.outputMax - spec.outputMin);
}

/** Passthrough: the normalized value is the raw value, unscaled (no direction/range applied). */
class NoneStrategy implements INormalizationStrategy {
    public apply(_spec: NormalizationSpec, withData: FactorResult[]): void {
        for (const r of withData) {
            r.normalizedContribution = r.rawValue;
        }
    }
}

/** Rescale each raw value to 0..1 against the population min/max, then to the output range. */
class MinMaxStrategy implements INormalizationStrategy {
    public apply(spec: NormalizationSpec, withData: FactorResult[]): void {
        const values = withData
            .map((r) => r.rawValue)
            .filter((v): v is number => v !== null);
        // reduce rather than Math.min(...spread) — large populations would blow the call stack.
        const min = values.reduce((a, b) => Math.min(a, b));
        const max = values.reduce((a, b) => Math.max(a, b));

        for (const r of withData) {
            if (r.rawValue === null) {
                continue;
            }
            const fraction =
                max === min
                    ? NO_SPREAD_FRACTION
                    : (r.rawValue - min) / (max - min);
            r.normalizedContribution = toOutputRange(spec, fraction);
        }
    }
}

/**
 * Rank each value within the population → a 0..1 percentile, then to the output range.
 * Uses the midpoint method for ties (a value's percentile is the fraction strictly below
 * it plus half the fraction equal to it), so identical values share one fair rank. Robust
 * to outliers — one extreme value can't flatten everyone else the way MinMax does.
 */
class PercentileStrategy implements INormalizationStrategy {
    public apply(spec: NormalizationSpec, withData: FactorResult[]): void {
        const values = withData
            .map((r) => r.rawValue)
            .filter((v): v is number => v !== null);
        const n = values.length;
        const sorted = [...values].sort((a, b) => a - b);

        // One pass over sorted runs of equal values: a run starting at index i with k copies
        // has fraction (i + k/2) / n. O(n log n) overall — no per-value rescan.
        const fractionByValue = new Map<number, number>();
        let i = 0;
        while (i < sorted.length) {
            let j = i;
            while (j < sorted.length && sorted[j] === sorted[i]) j++;
            fractionByValue.set(sorted[i], (i + (j - i) / 2) / n);
            i = j;
        }

        for (const r of withData) {
            if (r.rawValue === null) continue;
            const fraction = fractionByValue.get(r.rawValue) ?? NO_SPREAD_FRACTION;
            r.normalizedContribution = toOutputRange(spec, fraction);
        }
    }
}

/**
 * Standardize each value to (x − mean) / stddev against the population, clamp to ±Z_CLAMP
 * (z-scores are unbounded), map the clamped band onto 0..1, then to the output range.
 * Rewards how far above/below the mean a record sits — useful when the spread, not the
 * raw min/max, is what matters.
 */
class ZScoreStrategy implements INormalizationStrategy {
    public apply(spec: NormalizationSpec, withData: FactorResult[]): void {
        const values = withData
            .map((r) => r.rawValue)
            .filter((v): v is number => v !== null);
        const n = values.length;
        const mean = values.reduce((a, b) => a + b, 0) / n;
        const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
        const stdDev = Math.sqrt(variance);

        for (const r of withData) {
            if (r.rawValue === null) continue;
            let fraction: number;
            if (stdDev === 0) {
                fraction = NO_SPREAD_FRACTION;
            } else {
                const z = (r.rawValue - mean) / stdDev;
                const clamped = Math.max(-Z_CLAMP, Math.min(Z_CLAMP, z));
                fraction = (clamped + Z_CLAMP) / (2 * Z_CLAMP);
            }
            r.normalizedContribution = toOutputRange(spec, fraction);
        }
    }
}

/**
 * Map each raw value through a logistic (sigmoid) curve set by midpoint + steepness, then to
 * the output range. Per-value (NOT population-relative): a value at the midpoint → 0.5, far
 * above → ~1, far below → ~0. Good for "diminishing returns" signals where the first units of
 * activity matter most.
 */
class LogisticStrategy implements INormalizationStrategy {
    public apply(spec: NormalizationSpec, withData: FactorResult[]): void {
        const p = spec.params;
        if (!p || p.method !== "Logistic") {
            throw new Error(
                "NormalizationEngine: 'Logistic' requires Logistic params (NormalizationParamsJSON: { midpoint, steepness }).",
            );
        }
        for (const r of withData) {
            if (r.rawValue === null) continue;
            const fraction =
                1 / (1 + Math.exp(-p.steepness * (r.rawValue - p.midpoint)));
            r.normalizedContribution = toOutputRange(spec, fraction);
        }
    }
}

/**
 * Bucket each raw value into a configured band and emit that band's fraction, then to the
 * output range. Per-value. Bands are matched by ascending `max` (a `null` max is the
 * open-ended top); a value above every finite band with no open top falls back to neutral.
 */
class BandedStrategy implements INormalizationStrategy {
    public apply(spec: NormalizationSpec, withData: FactorResult[]): void {
        const p = spec.params;
        if (!p || p.method !== "Banded") {
            throw new Error(
                "NormalizationEngine: 'Banded' requires Banded params (NormalizationParamsJSON: { bands: [{ max, output }] }).",
            );
        }
        const bands = [...p.bands].sort(byMaxAscending);
        for (const r of withData) {
            if (r.rawValue === null) continue;
            const value = r.rawValue;
            const band = bands.find((b) => b.max === null || value <= b.max);
            const fraction = band ? band.output : NO_SPREAD_FRACTION;
            r.normalizedContribution = toOutputRange(spec, fraction);
        }
    }
}

/** Sort bands by upper bound ascending; an open-ended (`null`) top band sorts last. */
function byMaxAscending(a: BandedEntry, b: BandedEntry): number {
    const am = a.max === null ? Infinity : a.max;
    const bm = b.max === null ? Infinity : b.max;
    return am - bm;
}

/**
 * Map each raw value through an exact-match lookup table, falling back to the configured
 * fallback for unmatched values, then to the output range. Per-value. Suited to discrete
 * coded signals (e.g. a status code → a fixed strength).
 */
class LookupStrategy implements INormalizationStrategy {
    public apply(spec: NormalizationSpec, withData: FactorResult[]): void {
        const p = spec.params;
        if (!p || p.method !== "Lookup") {
            throw new Error(
                "NormalizationEngine: 'Lookup' requires Lookup params (NormalizationParamsJSON: { entries: [{ value, output }], fallback }).",
            );
        }
        const table = new Map(p.entries.map((e) => [e.value, e.output]));
        for (const r of withData) {
            if (r.rawValue === null) continue;
            const fraction = table.has(r.rawValue)
                ? (table.get(r.rawValue) as number)
                : p.fallback;
            r.normalizedContribution = toOutputRange(spec, fraction);
        }
    }
}

/** Build the method → strategy registry the engine dispatches through. */
export function createNormalizationRegistry(): Map<
    NormalizationMethod,
    INormalizationStrategy
> {
    return new Map<NormalizationMethod, INormalizationStrategy>([
        ["None", new NoneStrategy()],
        ["MinMax", new MinMaxStrategy()],
        ["Percentile", new PercentileStrategy()],
        ["ZScore", new ZScoreStrategy()],
        ["Logistic", new LogisticStrategy()],
        ["Banded", new BandedStrategy()],
        ["Lookup", new LookupStrategy()],
    ]);
}

/**
 * Parse + validate a factor's `NormalizationParamsJSON` for the parameterized methods. Returns
 * undefined for the pure methods (which take no params). Throws a clear error on missing or
 * malformed config rather than letting a bad shape mis-score silently. Pure + unit-testable.
 */
export function parseNormalizationParams(
    method: NormalizationMethod,
    json: string | null,
): NormalizationParams | undefined {
    if (method !== "Logistic" && method !== "Banded" && method !== "Lookup") {
        return undefined;
    }
    if (!json || json.trim().length === 0) {
        throw new Error(
            `NormalizationEngine: method '${method}' requires NormalizationParamsJSON.`,
        );
    }
    let parsed: unknown;
    try {
        parsed = JSON.parse(json);
    } catch {
        throw new Error(
            `NormalizationEngine: NormalizationParamsJSON for '${method}' is not valid JSON.`,
        );
    }
    switch (method) {
        case "Logistic":
            return parseLogistic(parsed);
        case "Banded":
            return parseBanded(parsed);
        case "Lookup":
            return parseLookup(parsed);
    }
}

/** True for a non-null object (so its keys can be read as unknown). */
function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
}

/** Assert a value is a finite number, with a field-name in the error for debuggability. */
function requireNumber(v: unknown, field: string): number {
    if (typeof v !== "number" || Number.isNaN(v)) {
        throw new Error(`NormalizationEngine: ${field} must be a number.`);
    }
    return v;
}

function parseLogistic(v: unknown): LogisticParams {
    if (!isRecord(v)) {
        throw new Error("NormalizationEngine: Logistic params must be an object.");
    }
    return {
        method: "Logistic",
        midpoint: requireNumber(v.midpoint, "Logistic.midpoint"),
        steepness: requireNumber(v.steepness, "Logistic.steepness"),
    };
}

function parseBanded(v: unknown): BandedParams {
    if (!isRecord(v) || !Array.isArray(v.bands)) {
        throw new Error(
            "NormalizationEngine: Banded params must have a 'bands' array.",
        );
    }
    const bands = v.bands.map((b, i): BandedEntry => {
        if (!isRecord(b)) {
            throw new Error(`NormalizationEngine: Banded.bands[${i}] must be an object.`);
        }
        return {
            max: b.max === null ? null : requireNumber(b.max, `Banded.bands[${i}].max`),
            output: requireNumber(b.output, `Banded.bands[${i}].output`),
        };
    });
    if (bands.length === 0) {
        throw new Error("NormalizationEngine: Banded params need at least one band.");
    }
    return { method: "Banded", bands };
}

function parseLookup(v: unknown): LookupParams {
    if (!isRecord(v) || !Array.isArray(v.entries)) {
        throw new Error(
            "NormalizationEngine: Lookup params must have an 'entries' array.",
        );
    }
    const entries = v.entries.map((e, i): LookupEntry => {
        if (!isRecord(e)) {
            throw new Error(`NormalizationEngine: Lookup.entries[${i}] must be an object.`);
        }
        return {
            value: requireNumber(e.value, `Lookup.entries[${i}].value`),
            output: requireNumber(e.output, `Lookup.entries[${i}].output`),
        };
    });
    return { method: "Lookup", entries, fallback: requireNumber(v.fallback, "Lookup.fallback") };
}
