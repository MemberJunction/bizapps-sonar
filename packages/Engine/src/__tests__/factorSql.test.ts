import { describe, it, expect } from "vitest";
import {
    buildAggregateExpression,
    buildFactorSql,
    mapAggregateRows,
    CompiledFactorSpec,
} from "../factors/factorSql";

/** A rolling-window declarative-Count spec, like the "Recent Activity Count" example. */
const windowedSpec: CompiledFactorSpec = {
    factorId: "fac-100",
    relatedTable: "[CRM].[Activity]",
    anchorKeyColumn: "MemberID",
    window: { kind: "Rolling", dateColumn: "ActivityDate", lengthDays: 90, lengthMonths: null },
    aggregateSql: "COUNT(*)",
};

describe("buildFactorSql", () => {
    it("builds a windowed count query with inlined anchor ids", () => {
        const sql = buildFactorSql(windowedSpec, ["m1", "m2"]);

        expect(sql).toContain(
            "SELECT [MemberID] AS anchorId, COUNT(*) AS rawValue",
        );
        expect(sql).toContain("FROM [CRM].[Activity]");
        expect(sql).toContain("[MemberID] IN ('m1','m2')");
        expect(sql).toContain("[ActivityDate] > DATEADD(day, -90, @asOf)");
        expect(sql).toContain("[ActivityDate] <= @asOf");
        expect(sql).toContain("GROUP BY [MemberID]");
        // No per-anchor window → no anchor join.
        expect(sql).not.toContain("JOIN");
    });

    it("omits the date predicates when there is no window", () => {
        const noWindow: CompiledFactorSpec = { ...windowedSpec, window: null };
        const sql = buildFactorSql(noWindow, ["m1"]);

        expect(sql).not.toContain("DATEADD");
        expect(sql).not.toContain("ActivityDate");
        expect(sql).toContain("[MemberID] IN ('m1')");
    });

    it("uses DATEADD month for a rolling window measured in months", () => {
        const monthly: CompiledFactorSpec = {
            ...windowedSpec,
            window: { kind: "Rolling", dateColumn: "ActivityDate", lengthDays: null, lengthMonths: 12 },
        };
        const sql = buildFactorSql(monthly, ["m1"]);

        expect(sql).toContain("[ActivityDate] > DATEADD(month, -12, @asOf)");
        expect(sql).toContain("[ActivityDate] <= @asOf");
    });

    it("bounds a calendar window from the period start to @asOf", () => {
        const cases: Array<[("month" | "quarter" | "year"), string]> = [
            ["month", "DATEFROMPARTS(YEAR(@asOf), MONTH(@asOf), 1)"],
            ["quarter", "DATEFROMPARTS(YEAR(@asOf), (DATEPART(quarter, @asOf) - 1) * 3 + 1, 1)"],
            ["year", "DATEFROMPARTS(YEAR(@asOf), 1, 1)"],
        ];
        for (const [period, start] of cases) {
            const sql = buildFactorSql(
                { ...windowedSpec, window: { kind: "Calendar", dateColumn: "ActivityDate", period } },
                ["m1"],
            );
            expect(sql).toContain(`[ActivityDate] >= ${start}`);
            expect(sql).toContain("[ActivityDate] <= @asOf");
        }
    });

    it("joins the anchor and bounds from a per-anchor date for SinceEvent", () => {
        const sinceEvent: CompiledFactorSpec = {
            ...windowedSpec,
            window: { kind: "SinceEvent", dateColumn: "ActivityDate", anchorDateColumn: "JoinDate", offsetDays: 0 },
            anchorTable: "[membership].[Member]",
            anchorPkColumn: "ID",
        };
        const sql = buildFactorSql(sinceEvent, ["m1"]);

        expect(sql).toContain("JOIN [membership].[Member] a ON a.[ID] = [MemberID]");
        expect(sql).toContain("[ActivityDate] >= DATEADD(day, 0, a.[JoinDate])");
        expect(sql).toContain("[ActivityDate] <= @asOf");
    });

    it("brackets the per-anchor date and caps at @asOf for RenewalRelative", () => {
        const renewal: CompiledFactorSpec = {
            ...windowedSpec,
            window: { kind: "RenewalRelative", dateColumn: "ActivityDate", anchorDateColumn: "RenewalDate", offsetDays: -90 },
            anchorTable: "[membership].[Member]",
            anchorPkColumn: "ID",
        };
        const sql = buildFactorSql(renewal, ["m1"]);

        expect(sql).toContain("JOIN [membership].[Member] a ON a.[ID] = [MemberID]");
        expect(sql).toContain("[ActivityDate] >= DATEADD(day, -90, a.[RenewalDate])");
        expect(sql).toContain("[ActivityDate] <= a.[RenewalDate]");
        expect(sql).toContain("[ActivityDate] <= @asOf");
    });
});

describe("buildAggregateExpression", () => {
    const columns = ["ID", "Amount", "ActivityType"];

    it("maps Count to COUNT(*) with no field needed", () => {
        expect(buildAggregateExpression("Count", null, columns)).toBe(
            "COUNT(*)",
        );
    });

    it("maps Sum/Avg/Min/Max onto the column", () => {
        expect(buildAggregateExpression("Sum", "Amount", columns)).toBe(
            "SUM([Amount])",
        );
        expect(buildAggregateExpression("Avg", "Amount", columns)).toBe(
            "AVG([Amount])",
        );
    });

    it("maps DistinctCount", () => {
        expect(
            buildAggregateExpression("DistinctCount", "ActivityType", columns),
        ).toBe("COUNT(DISTINCT [ActivityType])");
    });

    it("normalizes the column to its canonical casing", () => {
        expect(buildAggregateExpression("Sum", "amount", columns)).toBe(
            "SUM([Amount])",
        );
    });

    it("throws when a field-based aggregation has no AggregateFieldName", () => {
        expect(() => buildAggregateExpression("Sum", null, columns)).toThrow(
            /requires an AggregateFieldName/,
        );
    });

    it("throws when the field is not a real column (typo / injection guard)", () => {
        expect(() =>
            buildAggregateExpression("Sum", "Amount; DROP TABLE", columns),
        ).toThrow(/not a column/);
    });

    it("throws on a deferred aggregation", () => {
        expect(() =>
            buildAggregateExpression("TrendSlope", "Amount", columns),
        ).toThrow(/unsupported aggregation/);
    });
});

describe("mapAggregateRows", () => {
    it("maps each row to a FactorResult and leaves normalization null", () => {
        const map = mapAggregateRows(windowedSpec, [
            { anchorId: "m1", rawValue: 12 },
            { anchorId: "m2", rawValue: 3 },
        ]);

        expect(map.size).toBe(2);
        expect(map.get("m1")).toEqual({
            rawValue: 12,
            normalizedContribution: null,
            hadData: true,
            explanation:
                "12 matching [CRM].[Activity] record(s) in the last 90 days",
        });
    });

    it("omits anchors that produced no row (treated as no data)", () => {
        const map = mapAggregateRows(windowedSpec, [
            { anchorId: "m1", rawValue: 5 },
        ]);

        expect(map.has("m1")).toBe(true);
        expect(map.has("m2")).toBe(false);
    });
});
