import { describe, it, expect } from "vitest";
import { AnchorCondition, anchorFieldKind, buildAnchorFilter, validRankFields } from "../orchestration/anchorConditions";

/** The demo anchor entity (AssociationDemo.Member), which is what these rules are written against. */
const FIELDS = new Map<string, string>([
    ["ID", "uniqueidentifier"],
    ["Email", "nvarchar"],
    ["Title", "nvarchar"],
    ["Industry", "nvarchar"],
    ["State", "nvarchar"],
    ["YearsInProfession", "int"],
    ["JoinDate", "date"],
    ["LastActivityDate", "datetime"],
]);

/** A fixed "now" so every date literal in these tests is predictable. */
const NOW = Date.parse("2026-07-30T12:00:00Z");
const build = (conditions: AnchorCondition[]) => buildAnchorFilter(conditions, FIELDS, NOW);

describe("anchorFieldKind", () => {
    it("classifies the types the operator rules branch on", () => {
        expect(anchorFieldKind("date")).toBe("date");
        expect(anchorFieldKind("datetime2")).toBe("date");
        expect(anchorFieldKind("datetimeoffset")).toBe("date");
        expect(anchorFieldKind("int")).toBe("number");
        expect(anchorFieldKind("decimal")).toBe("number");
        expect(anchorFieldKind("nvarchar")).toBe("text");
        expect(anchorFieldKind("bit")).toBe("boolean");
        expect(anchorFieldKind("uniqueidentifier")).toBe("other");
    });
});

describe("buildAnchorFilter — nothing asked", () => {
    it("is empty for no conditions", () => {
        expect(build([])).toEqual({ sql: "", errors: [] });
        expect(buildAnchorFilter(null, FIELDS, NOW)).toEqual({ sql: "", errors: [] });
    });
});

describe("buildAnchorFilter — an unknown field is an ERROR, never a skipped condition", () => {
    it("rejects a field the anchor entity doesn't have", () => {
        const r = build([{ field: "RenewalDate", op: "withinNextDays", value: 60 }]);
        expect(r.errors).toHaveLength(1);
        expect(r.errors[0]).toContain("RenewalDate");
        // Critically: no SQL comes back, so the caller cannot run a WIDER cohort than was asked for.
        expect(r.sql).toBe("");
    });

    it("suppresses the whole fragment when any one condition is bad", () => {
        const r = build([
            { field: "State", op: "eq", value: "TX" },
            { field: "NotAField", op: "eq", value: "x" },
        ]);
        expect(r.errors).toHaveLength(1);
        expect(r.sql).toBe("");
    });

    it("matches field names case-insensitively but emits the entity's own casing", () => {
        const r = build([{ field: "joindate", op: "olderThanDays", value: 365 }]);
        expect(r.errors).toEqual([]);
        expect(r.sql).toContain("[JoinDate]");
    });
});

describe("buildAnchorFilter — the date operators are the urgency vocabulary", () => {
    it("olderThanDays expresses tenure and dormancy", () => {
        // "a member for more than a year"
        expect(build([{ field: "JoinDate", op: "olderThanDays", value: 365 }]).sql)
            .toBe("[JoinDate] < '2025-07-30 12:00:00'");
        // "hasn't shown up in 90 days"
        expect(build([{ field: "LastActivityDate", op: "olderThanDays", value: 90 }]).sql)
            .toBe("[LastActivityDate] < '2026-05-01 12:00:00'");
    });

    it("olderThanDays and withinLastDays partition, never overlapping on the boundary", () => {
        // They are documented as complements, so exactly one must claim a record sitting on the
        // boundary. Against a `date` column SQL Server truncates the literal's time, so two inclusive
        // bounds would both match the boundary DAY and put one member in both cohorts.
        const older = build([{ field: "JoinDate", op: "olderThanDays", value: 365 }]).sql;
        const recent = build([{ field: "JoinDate", op: "withinLastDays", value: 365 }]).sql;
        expect(older).toContain("<");
        expect(older).not.toContain("<=");
        expect(recent).toContain(">=");
        // Same instant on both sides, one side exclusive.
        expect(older.match(/'([^']+)'/)![1]).toBe(recent.match(/'([^']+)'/)![1]);
    });

    it("withinLastDays expresses recency", () => {
        expect(build([{ field: "LastActivityDate", op: "withinLastDays", value: 30 }]).sql)
            .toBe("[LastActivityDate] >= '2026-06-30 12:00:00'");
    });

    it("withinNextDays brackets a future window at both ends", () => {
        const sql = build([{ field: "JoinDate", op: "withinNextDays", value: 60 }]).sql;
        expect(sql).toBe("[JoinDate] >= '2026-07-30 12:00:00' AND [JoinDate] <= '2026-09-28 12:00:00'");
    });

    it("refuses a date operator on a field that isn't a date", () => {
        const r = build([{ field: "YearsInProfession", op: "olderThanDays", value: 5 }]);
        expect(r.errors[0]).toContain("not a date");
        expect(r.sql).toBe("");
    });

    it("refuses a negative or non-numeric day count", () => {
        expect(build([{ field: "JoinDate", op: "olderThanDays", value: -5 }]).errors).toHaveLength(1);
        expect(build([{ field: "JoinDate", op: "olderThanDays", value: "soon" }]).errors).toHaveLength(1);
    });
});

describe("buildAnchorFilter — segments and bounds", () => {
    it("ANDs everything together", () => {
        const r = build([
            { field: "State", op: "in", value: ["TX", "OK"] },
            { field: "YearsInProfession", op: "gte", value: 5 },
        ]);
        expect(r.errors).toEqual([]);
        expect(r.sql).toBe("[State] IN ('TX','OK') AND [YearsInProfession] >= 5");
    });

    it("handles notIn, null tests and booleans", () => {
        expect(build([{ field: "Industry", op: "notIn", value: ["Retail"] }]).sql).toBe("[Industry] NOT IN ('Retail')");
        expect(build([{ field: "Title", op: "isNull" }]).sql).toBe("[Title] IS NULL");
        expect(build([{ field: "LastActivityDate", op: "isNotNull" }]).sql).toBe("[LastActivityDate] IS NOT NULL");
    });

    it("rejects an empty in-list rather than emitting IN ()", () => {
        expect(build([{ field: "State", op: "in", value: [] }]).errors).toHaveLength(1);
    });

    it("rejects a list where a single value belongs, and vice versa", () => {
        expect(build([{ field: "State", op: "eq", value: ["TX", "OK"] }]).errors[0]).toContain("in/notIn");
        expect(build([{ field: "YearsInProfession", op: "eq", value: null }]).errors[0]).toContain("isNull");
    });

    it("rejects ordering comparisons on text, which are almost always a mistake", () => {
        expect(build([{ field: "Title", op: "gte", value: "M" }]).errors[0]).toContain("isn't meaningful");
    });

    it("rejects a non-numeric value for a numeric field", () => {
        expect(build([{ field: "YearsInProfession", op: "gte", value: "many" }]).errors).toHaveLength(1);
    });
});

describe("buildAnchorFilter — nothing arbitrary reaches the SQL", () => {
    it("escapes quotes in a text value instead of letting them close the literal", () => {
        const r = build([{ field: "State", op: "eq", value: "O'Brien" }]);
        expect(r.errors).toEqual([]);
        expect(r.sql).toBe("[State] = 'O''Brien'");
    });

    it("neutralises an injection attempt in a value", () => {
        const r = build([{ field: "State", op: "eq", value: "TX' OR 1=1 --" }]);
        expect(r.sql).toBe("[State] = 'TX'' OR 1=1 --'");
        expect(r.sql).not.toMatch(/OR 1=1 --$/); // the payload is inside the literal, not beside it
    });

    it("an injection attempt in a FIELD name cannot reach the SQL at all", () => {
        // Field names are never escaped — they are matched against the real field list, so anything
        // that isn't a genuine column simply has nowhere to go.
        const r = build([{ field: "State] = 'TX' OR [1", op: "eq", value: "x" }]);
        expect(r.sql).toBe("");
        expect(r.errors).toHaveLength(1);
    });

    it("keeps numeric values numeric rather than quoting attacker text", () => {
        const r = build([{ field: "YearsInProfession", op: "gte", value: "5; DROP TABLE Member" }]);
        expect(r.sql).toBe("");
        expect(r.errors).toHaveLength(1);
    });
});

describe("validRankFields", () => {
    it("keeps real fields, in the entity's casing, deduped", () => {
        expect(validRankFields(["joindate", "JoinDate", "YearsInProfession"], FIELDS).sort())
            .toEqual(["JoinDate", "YearsInProfession"]);
    });

    it("drops unknown and empty names — ranking degrades, it does not widen a cohort", () => {
        expect(validRankFields(["RenewalDate", null, undefined, ""], FIELDS)).toEqual([]);
    });
});
