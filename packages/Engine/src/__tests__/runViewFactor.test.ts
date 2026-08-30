import { describe, it, expect } from "vitest";
import {
    aggregateRows,
    foldRowsToResults,
    groupRowsByAnchor,
    isSupportedAggregation,
    resolveWindowBounds,
    sqlWindowPredicate,
    toNaiveSqlLiteral,
    runViewIneligibilityReason,
    toPopulationWindow,
    type PopulationWindow,
    type RunViewFoldSpec,
} from "../factors/runViewFactor";
import type { AnchorKey } from "../factors/anchorKey";

const ASOF = new Date("2026-07-31T12:00:00Z");
const anchor = (id: string): AnchorKey => ({ id, json: `[{"FieldName":"ID","Value":"${id}"}]`, values: [id] });

describe("resolveWindowBounds", () => {
    it("returns an unbounded start for no window (AllTime)", () => {
        expect(resolveWindowBounds(null, ASOF)).toEqual({ start: null, end: ASOF });
    });

    it("subtracts days for a Rolling day window", () => {
        const b = resolveWindowBounds(
            { kind: "Rolling", dateField: "D", lengthDays: 90, lengthMonths: null },
            ASOF,
        );
        expect(b.start).toEqual(new Date(ASOF.getTime() - 90 * 86_400_000));
    });

    it("uses calendar arithmetic for a Rolling month window, not 30-day approximation", () => {
        // DATEADD(month, -1, '2026-07-31') is 2026-06-30 in T-SQL, not 2026-07-01.
        const b = resolveWindowBounds(
            { kind: "Rolling", dateField: "D", lengthMonths: 1, lengthDays: null },
            ASOF,
        );
        expect(b.start!.getTime()).not.toBe(ASOF.getTime() - 30 * 86_400_000);
        expect(b.start!.getMonth()).toBe(5); // June (0-based)
    });

    it("prefers months over days when both are set, matching the compiler's branch order", () => {
        const b = resolveWindowBounds(
            { kind: "Rolling", dateField: "D", lengthMonths: 1, lengthDays: 9999 },
            ASOF,
        );
        expect(b.start!.getMonth()).toBe(5);
    });

    it("throws on a Rolling window with neither length rather than silently widening to AllTime", () => {
        expect(() =>
            resolveWindowBounds({ kind: "Rolling", dateField: "D", lengthDays: null, lengthMonths: null }, ASOF),
        ).toThrow(/neither lengthDays nor lengthMonths/);
    });

    it("starts a Calendar month at midnight on the 1st", () => {
        const b = resolveWindowBounds({ kind: "Calendar", dateField: "D", period: "month" }, ASOF);
        expect(b.start!.getDate()).toBe(1);
        expect(b.start!.getHours()).toBe(0);
    });

    it("starts a Calendar quarter at the first month of the containing quarter", () => {
        const b = resolveWindowBounds({ kind: "Calendar", dateField: "D", period: "quarter" }, ASOF);
        expect(b.start!.getMonth()).toBe(6); // July is in Q3, which starts in July
        expect(b.start!.getDate()).toBe(1);
    });

    it("starts a Calendar year on January 1st", () => {
        const b = resolveWindowBounds({ kind: "Calendar", dateField: "D", period: "year" }, ASOF);
        expect(b.start!.getMonth()).toBe(0);
        expect(b.start!.getDate()).toBe(1);
    });
});

describe("aggregateRows", () => {
    it("counts rows for Count, including rows whose other columns are null", () => {
        expect(aggregateRows("Count", null, [{ V: 1 }, { V: null }, {}], ASOF)).toBe(3);
    });

    it("returns 1 for Exists when any row is present", () => {
        expect(aggregateRows("Exists", null, [{ V: null }], ASOF)).toBe(1);
    });

    it("sums, ignoring nulls", () => {
        expect(aggregateRows("Sum", "V", [{ V: 3 }, { V: null }, { V: 4 }], ASOF)).toBe(7);
    });

    it("averages over non-null values only — not over the row count", () => {
        // SQL: AVG ignores NULLs, so this is 8/2, not 8/3.
        expect(aggregateRows("Avg", "V", [{ V: 3 }, { V: null }, { V: 5 }], ASOF)).toBe(4);
    });

    it("returns null (not 0) when every value is null — SQL AVG/SUM of an empty set is NULL", () => {
        expect(aggregateRows("Avg", "V", [{ V: null }, { V: null }], ASOF)).toBeNull();
        expect(aggregateRows("Sum", "V", [{ V: null }], ASOF)).toBeNull();
    });

    it("takes min and max over non-null values", () => {
        expect(aggregateRows("Min", "V", [{ V: 5 }, { V: null }, { V: 2 }], ASOF)).toBe(2);
        expect(aggregateRows("Max", "V", [{ V: 5 }, { V: null }, { V: 9 }], ASOF)).toBe(9);
    });

    it("counts distinct values, ignoring nulls", () => {
        expect(aggregateRows("DistinctCount", "V", [{ V: "a" }, { V: "a" }, { V: "b" }, { V: null }], ASOF)).toBe(2);
    });

    it("coerces numeric strings, since RunView may return either", () => {
        expect(aggregateRows("Sum", "V", [{ V: "3" }, { V: "4" }], ASOF)).toBe(7);
    });

    it("treats a non-numeric string as null rather than NaN-poisoning the sum", () => {
        expect(aggregateRows("Sum", "V", [{ V: 3 }, { V: "not a number" }], ASOF)).toBe(3);
    });

    it("throws when a field-taking aggregation has no field", () => {
        expect(() => aggregateRows("Sum", null, [{ V: 1 }], ASOF)).toThrow(/requires an AggregateFieldName/);
    });

});

describe("groupRowsByAnchor", () => {
    it("groups by a single FK field", () => {
        const g = groupRowsByAnchor([{ MemberID: "A" }, { MemberID: "B" }, { MemberID: "A" }], ["MemberID"]);
        expect(g.get("A")).toHaveLength(2);
        expect(g.get("B")).toHaveLength(1);
    });

    it("matches anchor ids case-insensitively — SQL Server returns uppercase GUIDs", () => {
        const g = groupRowsByAnchor([{ MemberID: "abc-123" }], ["MemberID"]);
        expect(g.get("ABC-123")).toHaveLength(1);
    });

    it("drops rows whose FK is null — they belong to no anchor", () => {
        const g = groupRowsByAnchor([{ MemberID: null }, { MemberID: "A" }], ["MemberID"]);
        expect(g.size).toBe(1);
    });

    it("joins composite keys in the given field order", () => {
        const g = groupRowsByAnchor([{ A: "1", B: "2" }], ["A", "B"]);
        expect(g.has("1|2")).toBe(true);
    });
});

describe("foldRowsToResults", () => {
    const spec = (over: Partial<RunViewFoldSpec> = {}): RunViewFoldSpec => ({
        factorId: "f1",
        factorName: "Event Registrations",
        sourceEntityName: "Event Registrations",
        aggregation: "Count",
        aggregateField: null,
        fkFields: ["MemberID"],
        window: null,
        ...over,
    });

    it("produces a result per anchor that has rows", () => {
        const out = foldRowsToResults(
            spec(),
            [anchor("A"), anchor("B")],
            [{ MemberID: "A" }, { MemberID: "A" }, { MemberID: "B" }],
            ASOF,
        );
        expect(out.get("A")!.rawValue).toBe(2);
        expect(out.get("B")!.rawValue).toBe(1);
        expect(out.get("A")!.hadData).toBe(true);
        expect(out.get("A")!.normalizedContribution).toBeNull();
    });

    it("OMITS an anchor with no rows rather than scoring it zero", () => {
        // The distinction is load-bearing: absent means "no data on file" and routes to the model's
        // MissingDataPolicy, whereas 0 would mean "genuinely disengaged".
        const out = foldRowsToResults(spec(), [anchor("A"), anchor("B")], [{ MemberID: "A" }], ASOF);
        expect(out.has("A")).toBe(true);
        expect(out.has("B")).toBe(false);
    });

    it("omits an anchor whose aggregate resolves to null", () => {
        const out = foldRowsToResults(
            spec({ aggregation: "Sum", aggregateField: "V" }),
            [anchor("A")],
            [{ MemberID: "A", V: null }],
            ASOF,
        );
        expect(out.has("A")).toBe(false);
    });

    it("does NOT filter by window — the database already did, via sqlWindowPredicate", () => {
        // Filtering here too would double-apply the window, and worse, would reintroduce the JS/SQL
        // timezone disagreement this path was changed to avoid.
        const window: PopulationWindow = { kind: "Rolling", dateField: "D", lengthDays: 10, lengthMonths: null };
        const out = foldRowsToResults(
            spec({ window }),
            [anchor("A")],
            [
                { MemberID: "A", D: new Date(ASOF.getTime() - 5 * 86_400_000) },
                { MemberID: "A", D: new Date(ASOF.getTime() - 50 * 86_400_000) },
            ],
            ASOF,
        );
        expect(out.get("A")!.rawValue).toBe(2);
    });

    it("keys results by the anchor's original id casing, not the normalized form", () => {
        const out = foldRowsToResults(spec(), [anchor("abc")], [{ MemberID: "ABC" }], ASOF);
        expect(out.has("abc")).toBe(true);
    });

    it("writes an explanation mentioning the source entity", () => {
        const out = foldRowsToResults(spec(), [anchor("A")], [{ MemberID: "A" }], ASOF);
        expect(out.get("A")!.explanation).toContain("Event Registrations");
    });
});

describe("isSupportedAggregation", () => {
    it("accepts the seven aggregations this path implements", () => {
        for (const a of ["Count", "Exists", "DistinctCount", "Sum", "Avg", "Min", "Max"]) {
            expect(isSupportedAggregation(a)).toBe(true);
        }
    });

    it("rejects Recency (compiled path only) and the two unimplemented in both, and null", () => {
        expect(isSupportedAggregation("Recency")).toBe(false);
        expect(isSupportedAggregation("RatePerPeriod")).toBe(false);
        expect(isSupportedAggregation("TrendSlope")).toBe(false);
        expect(isSupportedAggregation(null)).toBe(false);
    });
});

describe("runViewIneligibilityReason", () => {
    const base = {
        aggregation: "Count",
        joinCount: 0,
        anchorKeyColumnCount: 1,
        windowKind: null,
        hasFilterExpression: false,
    } as const;

    it("returns null for an eligible factor", () => {
        expect(runViewIneligibilityReason({ ...base })).toBeNull();
    });

    it("rejects multi-hop, because RunView cannot join", () => {
        expect(runViewIneligibilityReason({ ...base, joinCount: 2 })).toMatch(/multi-hop/);
    });

    it("rejects composite anchor keys", () => {
        expect(runViewIneligibilityReason({ ...base, anchorKeyColumnCount: 2 })).toMatch(/composite anchor key/);
    });

    it("rejects per-anchor windows, which need an extra anchor read", () => {
        expect(runViewIneligibilityReason({ ...base, windowKind: "SinceEvent" })).toMatch(/per-anchor window/);
        expect(runViewIneligibilityReason({ ...base, windowKind: "RenewalRelative" })).toMatch(/per-anchor window/);
    });

    it("accepts the population-resolvable windows", () => {
        expect(runViewIneligibilityReason({ ...base, windowKind: "Rolling" })).toBeNull();
        expect(runViewIneligibilityReason({ ...base, windowKind: "Calendar" })).toBeNull();
    });

    it("rejects a FilterExpression, whose parameters ExtraFilter cannot carry", () => {
        expect(runViewIneligibilityReason({ ...base, hasFilterExpression: true })).toMatch(/parameterized/);
    });

    it("rejects unsupported aggregations", () => {
        expect(runViewIneligibilityReason({ ...base, aggregation: "TrendSlope" })).toMatch(/not supported/);
    });

    it("rejects Recency, whose day arithmetic stays on the compiled path", () => {
        expect(runViewIneligibilityReason({ ...base, aggregation: "Recency" })).toMatch(/not supported/);
    });
});

describe("toPopulationWindow", () => {
    it("maps null through as AllTime", () => {
        expect(toPopulationWindow(null)).toBeNull();
    });

    it("carries the compiled dateColumn across as dateField", () => {
        const out = toPopulationWindow({
            kind: "Rolling",
            dateColumn: "RegistrationDate",
            lengthDays: 90,
            lengthMonths: null,
        });
        expect(out).toEqual({ kind: "Rolling", dateField: "RegistrationDate", lengthDays: 90, lengthMonths: null });
    });

    it("maps a Calendar window with its period", () => {
        expect(toPopulationWindow({ kind: "Calendar", dateColumn: "D", period: "quarter" })).toEqual({
            kind: "Calendar",
            dateField: "D",
            period: "quarter",
        });
    });

    it("throws on per-anchor kinds instead of silently dropping the window", () => {
        expect(() =>
            toPopulationWindow({ kind: "SinceEvent", dateColumn: "D", anchorDateColumn: "JoinDate", offsetDays: 0 }),
        ).toThrow(/not\s+supported on the RunView path/);
    });
});

describe("toNaiveSqlLiteral", () => {
    it("formats using UTC components, so the literal is naive wall-clock", () => {
        // Must NOT shift by the local offset: the columns are datetime/datetime2 with no timezone, and
        // SQL compares them literally against whatever we emit.
        expect(toNaiveSqlLiteral(new Date("2026-05-02T00:00:00.000Z"))).toBe("2026-05-02 00:00:00.000");
    });

    it("zero-pads every component", () => {
        expect(toNaiveSqlLiteral(new Date("2026-01-02T03:04:05.006Z"))).toBe("2026-01-02 03:04:05.006");
    });
});

describe("sqlWindowPredicate", () => {
    it("emits nothing for AllTime", () => {
        expect(sqlWindowPredicate(null, ASOF)).toBeNull();
    });

    it("uses an EXCLUSIVE lower bound for Rolling, matching the compiled path", () => {
        const p = sqlWindowPredicate(
            { kind: "Rolling", dateField: "RegistrationDate", lengthDays: 90, lengthMonths: null },
            ASOF,
        );
        expect(p).toContain("[RegistrationDate] > '2026-05-02");
        expect(p).toContain("[RegistrationDate] <= '2026-07-31");
    });

    it("uses an INCLUSIVE lower bound for Calendar", () => {
        const p = sqlWindowPredicate({ kind: "Calendar", dateField: "D", period: "year" }, ASOF);
        expect(p).toContain("[D] >= '2026-01-01");
    });

    it("always caps at asOf so a historical recompute ignores later activity", () => {
        const p = sqlWindowPredicate({ kind: "Calendar", dateField: "D", period: "month" }, ASOF);
        expect(p).toContain("<= '2026-07-31");
    });
});
