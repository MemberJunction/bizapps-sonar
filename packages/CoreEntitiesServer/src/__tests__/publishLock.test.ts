import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Locks down the publish-lock predicates — the testable seam for the whole invariant. `@memberjunction/core`
 * is mocked so RunView returns a controllable result (the predicates query the ScoreModel table). The
 * mock's mutable state lives in a vi.hoisted() block so the factory can reference it despite hoisting.
 */
const mock = vi.hoisted(() => ({ success: true, rows: [] as Array<Record<string, unknown>> }));

vi.mock("@memberjunction/core", () => ({
    RunView: class {
        async RunView() {
            return { Success: mock.success, Results: mock.rows };
        }
    },
    // Values the module imports at load time but these tests don't exercise.
    BaseEntityResult: class {},
    LogError: () => undefined,
}));

import { isModelConfigLocked, isBandSetConfigLocked } from "../publishLock";

beforeEach(() => {
    mock.success = true;
    mock.rows = [];
});

describe("isModelConfigLocked", () => {
    it("returns false for a null id without querying (library factor)", async () => {
        expect(await isModelConfigLocked(null)).toBe(false);
    });

    it("locks an Active model", async () => {
        mock.rows = [{ Status: "Active" }];
        expect(await isModelConfigLocked("m1")).toBe(true);
    });

    it("locks a Paused model", async () => {
        mock.rows = [{ Status: "Paused" }];
        expect(await isModelConfigLocked("m1")).toBe(true);
    });

    it("does not lock a Draft model", async () => {
        mock.rows = [{ Status: "Draft" }];
        expect(await isModelConfigLocked("m1")).toBe(false);
    });

    it("does not lock an Archived model", async () => {
        mock.rows = [{ Status: "Archived" }];
        expect(await isModelConfigLocked("m1")).toBe(false);
    });

    it("returns false when the model isn't found", async () => {
        mock.rows = [];
        expect(await isModelConfigLocked("missing")).toBe(false);
    });

    it("fails safe (false) when the query fails", async () => {
        mock.success = false;
        expect(await isModelConfigLocked("m1")).toBe(false);
    });
});

describe("isBandSetConfigLocked", () => {
    it("returns false for a null id", async () => {
        expect(await isBandSetConfigLocked(null)).toBe(false);
    });

    it("locks when a published model uses the band set", async () => {
        mock.rows = [{ ID: "m1" }];
        expect(await isBandSetConfigLocked("b1")).toBe(true);
    });

    it("does not lock when no published model uses the band set", async () => {
        mock.rows = [];
        expect(await isBandSetConfigLocked("b1")).toBe(false);
    });

    it("fails safe (false) when the query fails", async () => {
        mock.success = false;
        expect(await isBandSetConfigLocked("b1")).toBe(false);
    });
});
