import { describe, it, expect } from "vitest";
import {
    buildAggregateExpression,
    buildFactorSql,
    mapAggregateRows,
    CompiledFactorSpec,
} from "../factors/factorSql";

/** A windowed declarative-Count spec, like the "Recent Activity Count" example. */
const windowedSpec: CompiledFactorSpec = {
    factorId: "fac-100",
    relatedTable: "[CRM].[Activity]",
    anchorKeyColumn: "MemberID",
    dateColumn: "ActivityDate",
    windowLengthDays: 90,
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
    });

    it("uses DATEADD(month) for a month-based rolling window (precedence over days)", () => {
        const monthsSpec: CompiledFactorSpec = {
            ...windowedSpec,
            windowLengthDays: null,
            windowLengthMonths: 12,
        };
        const sql = buildFactorSql(monthsSpec, ["m1"]);

        expect(sql).toContain("[ActivityDate] > DATEADD(month, -12, @asOf)");
        expect(sql).toContain("[ActivityDate] <= @asOf");
        expect(sql).not.toContain("DATEADD(day");
    });

    it("omits the date predicates when there is no window", () => {
        const noWindow: CompiledFactorSpec = {
            ...windowedSpec,
            dateColumn: null,
            windowLengthDays: null,
        };
        const sql = buildFactorSql(noWindow, ["m1"]);

        expect(sql).not.toContain("DATEADD");
        expect(sql).not.toContain("ActivityDate");
        expect(sql).toContain("[MemberID] IN ('m1')");
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
