import { describe, it, expect } from "vitest";
import type { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { SonarActionBase } from "../custom/SonarActionBase";

/**
 * Pure-logic tests for the SonarActionBase substrate — the helpers with real logic that every
 * hand-authored action leans on. `sqlString` (ExtraFilter injection escape) and `isGuid` (the id
 * validity gate) are security-relevant, so they're locked here; `parseJsonParam` and
 * `aggregateFieldGap` carry the tricky input-shape / teaching logic.
 */

/** Minimal concrete subclass exposing the protected helpers for direct testing. */
class Probe extends SonarActionBase {
    protected async InternalRunAction(): Promise<ActionResultSimple> {
        throw new Error("not used in these tests");
    }
    public sql(v: string): string { return this.sqlString(v); }
    public guid(v: string): boolean { return this.isGuid(v); }
    public json<T>(params: RunActionParams, name: string): T | null { return this.parseJsonParam<T>(params, name); }
    public aggGap(agg: string | null | undefined, field: string | null | undefined): string | null {
        return this.aggregateFieldGap(agg, field);
    }
}

/** Build a RunActionParams carrying just the input params these helpers read. */
function withParams(params: { Name: string; Value: unknown }[]): RunActionParams {
    return { Params: params } as unknown as RunActionParams;
}

const probe = new Probe();
const GUID = "a1b2c3d4-e5f6-7890-ab12-cd34ef567890";

describe("sqlString (ExtraFilter injection escape)", () => {
    it("doubles single quotes so a value can't break out of the literal", () => {
        expect(probe.sql("O'Brien")).toBe("O''Brien");
        // A classic break-out attempt is neutralized — the quote is escaped, not terminating.
        expect(probe.sql("x' OR '1'='1")).toBe("x'' OR ''1''=''1");
    });

    it("leaves a clean GUID untouched (no quotes to escape)", () => {
        expect(probe.sql(GUID)).toBe(GUID);
    });

    it("coerces non-strings rather than throwing", () => {
        expect(probe.sql(123 as unknown as string)).toBe("123");
    });
});

describe("isGuid (strict canonical UUID)", () => {
    it("accepts a canonical 8-4-4-4-12 UUID", () => {
        expect(probe.guid(GUID)).toBe(true);
        expect(probe.guid("A1B2C3D4-E5F6-7890-AB12-CD34EF567890")).toBe(true);
    });

    it("rejects the junk the old loose char-class let through", () => {
        expect(probe.guid("------------------------------------")).toBe(false); // all dashes
        expect(probe.guid("not-a-guid")).toBe(false);
        expect(probe.guid("a1b2c3d4e5f67890ab12cd34ef567890")).toBe(false); // no dashes
        expect(probe.guid(`${GUID}' OR '1'='1`)).toBe(false); // injection-shaped
        expect(probe.guid("")).toBe(false);
    });
});

describe("parseJsonParam (string OR object OR fenced)", () => {
    it("parses a JSON string", () => {
        expect(probe.json(withParams([{ Name: "Spec", Value: '{"a":1}' }]), "Spec")).toEqual({ a: 1 });
    });

    it("passes through an already-parsed object (agent tool-call shape)", () => {
        const obj = { a: 1, nested: { b: 2 } };
        expect(probe.json(withParams([{ Name: "Spec", Value: obj }]), "Spec")).toBe(obj);
    });

    it("tolerates a ```json markdown fence", () => {
        expect(probe.json(withParams([{ Name: "Spec", Value: '```json\n{"a":1}\n```' }]), "Spec")).toEqual({ a: 1 });
    });

    it("returns null for absent / blank / unparseable", () => {
        expect(probe.json(withParams([]), "Spec")).toBeNull();
        expect(probe.json(withParams([{ Name: "Spec", Value: "" }]), "Spec")).toBeNull();
        expect(probe.json(withParams([{ Name: "Spec", Value: "{not json" }]), "Spec")).toBeNull();
    });
});

describe("aggregateFieldGap (teaching gap for field-taking aggregations)", () => {
    it("flags a column aggregation with no field", () => {
        const msg = probe.aggGap("Sum", null);
        expect(msg).toMatch(/needs aggregateFieldName/);
        expect(probe.aggGap("Avg", "  ")).toMatch(/aggregates a column/); // whitespace-only field
    });

    it("is silent when the field is present, or when Count needs none", () => {
        expect(probe.aggGap("Sum", "Amount")).toBeNull();
        expect(probe.aggGap("Count", null)).toBeNull();
        expect(probe.aggGap(null, null)).toBeNull();
    });
});
