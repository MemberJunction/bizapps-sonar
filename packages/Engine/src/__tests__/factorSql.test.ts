import { describe, it, expect } from "vitest";
import {
    buildAggregateExpression,
    buildAnchorKeysJson,
    buildFactorSql,
    mapAggregateRows,
    CompiledFactorSpec,
} from "../factors/factorSql";

/** A rolling-window declarative-Count spec, like the "Recent Activity Count" example. */
const windowedSpec: CompiledFactorSpec = {
    factorId: "fac-100",
    relatedTable: "[CRM].[Activity]",
    anchorKeyColumns: [{ fkColumn: "MemberID", sqlType: "uniqueidentifier" }],
    window: { kind: "Rolling", dateColumn: "ActivityDate", lengthDays: 90, lengthMonths: null },
    aggregateSql: "COUNT(*)",
};

describe("buildFactorSql", () => {
    it("builds a windowed count query keyed off the OPENJSON population", () => {
        const sql = buildFactorSql(windowedSpec);

        expect(sql).toContain("SELECT k.id AS anchorId, COUNT(*) AS rawValue");
        expect(sql).toContain("FROM [CRM].[Activity]");
        // Population rides as one @anchorKeys JSON param, shredded by OPENJSON + joined on the FK —
        // no inline IN list (no ~2100-param ceiling, no value interpolation).
        expect(sql).toContain(
            "JOIN OPENJSON(@anchorKeys) WITH (id NVARCHAR(100) '$.id', v0 uniqueidentifier '$.v0') k ON [CRM].[Activity].[MemberID] = k.v0",
        );
        expect(sql).not.toContain("IN (");
        expect(sql).toContain("[ActivityDate] > DATEADD(day, -90, @asOf)");
        expect(sql).toContain("[ActivityDate] <= @asOf");
        expect(sql).toContain("GROUP BY k.id");
    });

    it("omits the date predicates (and the WHERE) when there is no window", () => {
        const noWindow: CompiledFactorSpec = { ...windowedSpec, window: null };
        const sql = buildFactorSql(noWindow);

        expect(sql).not.toContain("DATEADD");
        expect(sql).not.toContain("ActivityDate");
        expect(sql).not.toContain("WHERE");
        expect(sql).toContain("JOIN OPENJSON(@anchorKeys)");
        expect(sql).toContain("GROUP BY k.id");
    });

    it("uses DATEADD month for a rolling window measured in months", () => {
        const monthly: CompiledFactorSpec = {
            ...windowedSpec,
            window: { kind: "Rolling", dateColumn: "ActivityDate", lengthDays: null, lengthMonths: 12 },
        };
        const sql = buildFactorSql(monthly);

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
            const sql = buildFactorSql({
                ...windowedSpec,
                window: { kind: "Calendar", dateColumn: "ActivityDate", period },
            });
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
        const sql = buildFactorSql(sinceEvent);

        expect(sql).toContain("JOIN [membership].[Member] a ON a.[ID] = [CRM].[Activity].[MemberID]");
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
        const sql = buildFactorSql(renewal);

        expect(sql).toContain("JOIN [membership].[Member] a ON a.[ID] = [CRM].[Activity].[MemberID]");
        expect(sql).toContain("[ActivityDate] >= DATEADD(day, -90, a.[RenewalDate])");
        expect(sql).toContain("[ActivityDate] <= a.[RenewalDate]");
        expect(sql).toContain("[ActivityDate] <= @asOf");
    });

    it("shreds a composite (multi-column) anchor key with one OPENJSON column + JOIN clause each", () => {
        const composite: CompiledFactorSpec = {
            ...windowedSpec,
            window: null,
            anchorKeyColumns: [
                { fkColumn: "MemberID", sqlType: "int" },
                { fkColumn: "OrgID", sqlType: "int" },
            ],
        };
        const sql = buildFactorSql(composite);

        expect(sql).toContain(
            "JOIN OPENJSON(@anchorKeys) WITH (id NVARCHAR(100) '$.id', v0 int '$.v0', v1 int '$.v1') k " +
                "ON [CRM].[Activity].[MemberID] = k.v0 AND [CRM].[Activity].[OrgID] = k.v1",
        );
        expect(sql).toContain("GROUP BY k.id");
    });
});

describe("buildAnchorKeysJson", () => {
    it("serializes each anchor to { id, v0..vn } in key order (single + composite)", () => {
        const json = buildAnchorKeysJson([
            { id: "m1", json: '[{"FieldName":"ID","Value":"m1"}]', values: ["m1"] },
            { id: "5|10", json: '[{"FieldName":"MemberID","Value":5},{"FieldName":"OrgID","Value":10}]', values: [5, 10] },
        ]);

        expect(JSON.parse(json)).toEqual([
            { id: "m1", v0: "m1" },
            { id: "5|10", v0: 5, v1: 10 },
        ]);
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

    it("maps Exists to a 1/0 presence flag with no field needed", () => {
        expect(buildAggregateExpression("Exists", null, columns)).toBe(
            "CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END",
        );
    });

    it("maps Recency to days-since-most-recent (at/before @asOf, future rows ignored)", () => {
        expect(buildAggregateExpression("Recency", "ActivityDate", ["ID", "ActivityDate"])).toBe(
            "DATEDIFF(day, MAX(CASE WHEN [ActivityDate] <= @asOf THEN [ActivityDate] END), @asOf)",
        );
    });

    it("throws when Recency has no date field", () => {
        expect(() => buildAggregateExpression("Recency", null, columns)).toThrow(
            /requires an AggregateFieldName/,
        );
    });

    it("still throws on the not-yet-supported aggregations", () => {
        expect(() => buildAggregateExpression("TrendSlope", "Amount", columns)).toThrow(
            /TrendSlope not yet/,
        );
        expect(() => buildAggregateExpression("RatePerPeriod", "Amount", columns)).toThrow(
            /RatePerPeriod and TrendSlope not yet/,
        );
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

describe("buildFactorSql — multi-hop joins", () => {
    // "Email clicks per member" = Member → EmailSend → EmailClick. The leaf (EmailClick) has no
    // FK to Member; it reaches the anchor through EmailSend, whose MemberID is the anchor key.
    const emailClicks: CompiledFactorSpec = {
        factorId: "fac-mh",
        relatedTable: "[comm].[EmailClick]",
        anchorKeyColumns: [{ fkColumn: "MemberID", sqlType: "uniqueidentifier" }],
        joins: [
            {
                table: "[comm].[EmailSend]",
                alias: "h1",
                on: [{ leftRef: "[comm].[EmailClick].[EmailSendID]", rightColumn: "ID" }],
            },
        ],
        window: null,
        aggregateSql: "COUNT(*)",
    };

    it("emits the intervening JOIN and keys the population off the last hop's alias", () => {
        const sql = buildFactorSql(emailClicks);

        expect(sql).toContain("SELECT k.id AS anchorId, COUNT(*) AS rawValue");
        expect(sql).toContain("FROM [comm].[EmailClick]");
        expect(sql).toContain(
            "JOIN [comm].[EmailSend] h1 ON [comm].[EmailClick].[EmailSendID] = h1.[ID]",
        );
        expect(sql).toContain(
            "JOIN OPENJSON(@anchorKeys) WITH (id NVARCHAR(100) '$.id', v0 uniqueidentifier '$.v0') k ON h1.[MemberID] = k.v0",
        );
        expect(sql).toContain("GROUP BY k.id");
    });

    it("chains hops: each later hop joins off the previous alias, key on the last", () => {
        const twoHop: CompiledFactorSpec = {
            ...emailClicks,
            joins: [
                {
                    table: "[comm].[EmailSend]",
                    alias: "h1",
                    on: [{ leftRef: "[comm].[EmailClick].[EmailSendID]", rightColumn: "ID" }],
                },
                {
                    table: "[comm].[Campaign]",
                    alias: "h2",
                    on: [{ leftRef: "h1.[CampaignID]", rightColumn: "ID" }],
                },
            ],
            anchorKeyColumns: [{ fkColumn: "OwnerMemberID", sqlType: "uniqueidentifier" }],
        };
        const sql = buildFactorSql(twoHop);

        expect(sql).toContain("JOIN [comm].[EmailSend] h1 ON [comm].[EmailClick].[EmailSendID] = h1.[ID]");
        expect(sql).toContain("JOIN [comm].[Campaign] h2 ON h1.[CampaignID] = h2.[ID]");
        expect(sql).toContain("ON h2.[OwnerMemberID] = k.v0");
        expect(sql).toContain("GROUP BY k.id");
    });

    it("ANDs every column-pair of a COMPOSITE intermediate FK in one hop's ON clause", () => {
        // A junction/tenant entity with a 2-column PK: the hop joins on BOTH columns, so each child
        // row maps to exactly one parent (no fan-out). The bundle is one arrow, two pairs.
        const compositeHop: CompiledFactorSpec = {
            ...emailClicks,
            joins: [
                {
                    table: "[crm].[TenantMember]",
                    alias: "h1",
                    on: [
                        { leftRef: "[comm].[EmailClick].[TenantID]", rightColumn: "TenantID" },
                        { leftRef: "[comm].[EmailClick].[MemberID]", rightColumn: "MemberID" },
                    ],
                },
            ],
        };
        const sql = buildFactorSql(compositeHop);

        expect(sql).toContain(
            "JOIN [crm].[TenantMember] h1 ON [comm].[EmailClick].[TenantID] = h1.[TenantID] AND " +
                "[comm].[EmailClick].[MemberID] = h1.[MemberID]",
        );
    });
});
