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

import {
    isModelConfigLocked,
    isModelConfigWriteBlocked,
    isBandSetConfigLocked,
    isBandSetConfigWriteBlocked,
    isScoringEditBlocked,
    isInvalidArchiveTransition,
} from "../publishLock";

beforeEach(() => {
    mock.success = true;
    mock.rows = [];
});

// Ids must be canonical GUIDs — the guards now reject anything else BEFORE querying (SQLi guard).
const MODEL_ID = "a1b2c3d4-e5f6-7890-ab12-cd34ef567890";
const BAND_SET_ID = "b1b2c3d4-e5f6-7890-ab12-cd34ef567890";
const MISSING_ID = "00000000-0000-0000-0000-000000000000";
const INJECTION_ID = "x' OR '1'='1";

describe("isModelConfigLocked", () => {
    it("returns false for a null id without querying (library factor)", async () => {
        expect(await isModelConfigLocked(null)).toBe(false);
    });

    it("locks an Active model", async () => {
        mock.rows = [{ Status: "Active" }];
        expect(await isModelConfigLocked(MODEL_ID)).toBe(true);
    });

    it("locks a Paused model", async () => {
        mock.rows = [{ Status: "Paused" }];
        expect(await isModelConfigLocked(MODEL_ID)).toBe(true);
    });

    it("does not lock a Draft model", async () => {
        mock.rows = [{ Status: "Draft" }];
        expect(await isModelConfigLocked(MODEL_ID)).toBe(false);
    });

    it("does not lock an Archived model", async () => {
        mock.rows = [{ Status: "Archived" }];
        expect(await isModelConfigLocked(MODEL_ID)).toBe(false);
    });

    it("returns false when the model isn't found", async () => {
        mock.rows = [];
        expect(await isModelConfigLocked(MISSING_ID)).toBe(false);
    });

    it("fails OPEN (false) when the query fails — cosmetic message path stays quiet on a blip", async () => {
        mock.success = false;
        expect(await isModelConfigLocked(MODEL_ID)).toBe(false);
    });

    it("rejects a non-GUID id before querying (SQLi guard) — locked rows in the mock prove no query ran", async () => {
        mock.rows = [{ Status: "Active" }];
        expect(await isModelConfigLocked(INJECTION_ID)).toBe(false);
    });
});

/**
 * Hard enforcement path (Save/Delete). Mirrors isModelConfigLocked EXCEPT a query error resolves to
 * "blocked" — fails CLOSED on uncertainty, so a write we can't prove is safe is refused (a silent
 * drift on a published model is unrecoverable; a wrongly-blocked write just needs a retry).
 */
describe("isModelConfigWriteBlocked", () => {
    it("does not block a null id (library factor)", async () => {
        expect(await isModelConfigWriteBlocked(null)).toBe(false);
    });

    it("blocks an Active model", async () => {
        mock.rows = [{ Status: "Active" }];
        expect(await isModelConfigWriteBlocked(MODEL_ID)).toBe(true);
    });

    it("does not block a confirmed Draft model", async () => {
        mock.rows = [{ Status: "Draft" }];
        expect(await isModelConfigWriteBlocked(MODEL_ID)).toBe(false);
    });

    it("does not block a confirmed not-found model", async () => {
        mock.rows = [];
        expect(await isModelConfigWriteBlocked(MISSING_ID)).toBe(false);
    });

    it("fails CLOSED (true) when the query fails — can't confirm unlocked, so refuse the write", async () => {
        mock.success = false;
        expect(await isModelConfigWriteBlocked(MODEL_ID)).toBe(true);
    });

    it("treats a non-GUID id as unlocked WITHOUT querying (no SQL runs; the save fails on the FK)", async () => {
        mock.rows = [{ Status: "Active" }];
        expect(await isModelConfigWriteBlocked(INJECTION_ID)).toBe(false);
    });
});

describe("isBandSetConfigLocked", () => {
    it("returns false for a null id", async () => {
        expect(await isBandSetConfigLocked(null)).toBe(false);
    });

    it("locks when a published model uses the band set", async () => {
        mock.rows = [{ ID: MODEL_ID }];
        expect(await isBandSetConfigLocked(BAND_SET_ID)).toBe(true);
    });

    it("does not lock when no published model uses the band set", async () => {
        mock.rows = [];
        expect(await isBandSetConfigLocked(BAND_SET_ID)).toBe(false);
    });

    it("fails OPEN (false) when the query fails — cosmetic message path", async () => {
        mock.success = false;
        expect(await isBandSetConfigLocked(BAND_SET_ID)).toBe(false);
    });
});

describe("isBandSetConfigWriteBlocked", () => {
    it("does not block a null id", async () => {
        expect(await isBandSetConfigWriteBlocked(null)).toBe(false);
    });

    it("blocks when a published model uses the band set", async () => {
        mock.rows = [{ ID: MODEL_ID }];
        expect(await isBandSetConfigWriteBlocked(BAND_SET_ID)).toBe(true);
    });

    it("does not block when no published model uses the band set", async () => {
        mock.rows = [];
        expect(await isBandSetConfigWriteBlocked(BAND_SET_ID)).toBe(false);
    });

    it("fails CLOSED (true) when the query fails — hard path refuses on uncertainty", async () => {
        mock.success = false;
        expect(await isBandSetConfigWriteBlocked(BAND_SET_ID)).toBe(true);
    });

    it("treats a non-GUID id as unlocked WITHOUT querying (no SQL runs; the save fails on the FK)", async () => {
        mock.rows = [{ ID: MODEL_ID }];
        expect(await isBandSetConfigWriteBlocked(INJECTION_ID)).toBe(false);
    });
});

/**
 * The ScoreModel hub rule (isScoringEditLocked delegates to this pure function). No DB — it's a pure
 * decision over (status, publishing, dirty field names), so the trickiest new behavior is locked down
 * here: the locked/guarded path, the publish exemption, the same-save unpublish-and-edit allowance, and
 * the safe-by-default inversion (an unknown field is frozen).
 */
describe("isScoringEditBlocked", () => {
    it("blocks a guarded scoring field on a published (Active) model", () => {
        expect(isScoringEditBlocked({ status: "Active", publishing: false, dirtyFields: ["BandSetID"] })).toBe(true);
    });

    it("blocks IsCalibrated / AsOfStrategy / TrendWindowDays (regression: scoring config stays frozen)", () => {
        expect(isScoringEditBlocked({ status: "Active", publishing: false, dirtyFields: ["IsCalibrated"] })).toBe(true);
        expect(isScoringEditBlocked({ status: "Paused", publishing: false, dirtyFields: ["AsOfStrategy"] })).toBe(true);
        expect(isScoringEditBlocked({ status: "Active", publishing: false, dirtyFields: ["TrendWindowDays"] })).toBe(true);
    });

    it("allows editing only operational/cosmetic fields while published", () => {
        expect(isScoringEditBlocked({ status: "Active", publishing: false, dirtyFields: ["Name", "Description", "RecomputeCron"] })).toBe(false);
    });

    it("is exempt during the publish transition, even with scoring fields dirty", () => {
        expect(isScoringEditBlocked({ status: "Active", publishing: true, dirtyFields: ["BandSetID", "IsCalibrated"] })).toBe(false);
    });

    it("allows a same-save unpublish-and-edit (Status → Draft while a scoring field is dirty)", () => {
        expect(isScoringEditBlocked({ status: "Draft", publishing: false, dirtyFields: ["Status", "BandSetID"] })).toBe(false);
    });

    it("does not lock a Draft or Archived model", () => {
        expect(isScoringEditBlocked({ status: "Draft", publishing: false, dirtyFields: ["BandSetID"] })).toBe(false);
        expect(isScoringEditBlocked({ status: "Archived", publishing: false, dirtyFields: ["ScoreScaleMax"] })).toBe(false);
    });

    it("locks an unknown/new field by default (safe-by-default inversion)", () => {
        expect(isScoringEditBlocked({ status: "Active", publishing: false, dirtyFields: ["SomeNewScoringColumn"] })).toBe(true);
    });

    it("ignores system-managed dirty fields (timestamps, version pointer)", () => {
        expect(isScoringEditBlocked({ status: "Active", publishing: false, dirtyFields: ["__mj_UpdatedAt", "CurrentVersionID"] })).toBe(false);
    });
});

/**
 * Pure gate: only Draft → Archived is permitted. Active/Paused → Archived is rejected
 * (config is still referenced by live Scores and snapshotted versions).
 */
describe("isInvalidArchiveTransition", () => {
    it("blocks Active → Archived", () => {
        expect(isInvalidArchiveTransition({ newStatus: "Archived", previousStatus: "Active", statusDirty: true })).toBe(true);
    });

    it("blocks Paused → Archived", () => {
        expect(isInvalidArchiveTransition({ newStatus: "Archived", previousStatus: "Paused", statusDirty: true })).toBe(true);
    });

    it("allows Draft → Archived", () => {
        expect(isInvalidArchiveTransition({ newStatus: "Archived", previousStatus: "Draft", statusDirty: true })).toBe(false);
    });

    it("does not affect non-archive status changes (statusDirty=true, target not Archived)", () => {
        expect(isInvalidArchiveTransition({ newStatus: "Active", previousStatus: "Draft", statusDirty: true })).toBe(false);
    });

    it("does not trigger when Status is not dirty (same-save non-transition)", () => {
        expect(isInvalidArchiveTransition({ newStatus: "Archived", previousStatus: "Active", statusDirty: false })).toBe(false);
    });
});
