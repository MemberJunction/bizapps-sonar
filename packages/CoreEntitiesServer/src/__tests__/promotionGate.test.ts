import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Locks down the Factor promotion gate — the testable seam for the invariant that a factor may
 * only transition into PromotionState = 'Approved' when its bound Action's code is approved.
 * `@memberjunction/core` is mocked so RunView returns a controllable result (the gate queries
 * MJ: Actions). The mock's mutable state lives in a vi.hoisted() block so the factory can
 * reference it despite hoisting.
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
    boundActionApprovalState,
    evaluateBoundActionApproval,
    isPromotionApprovalTransition,
    BoundActionApprovalRow,
} from "../promotionGate";

beforeEach(() => {
    mock.success = true;
    mock.rows = [];
});

function actionRow(overrides: Partial<BoundActionApprovalRow> = {}): BoundActionApprovalRow {
    return {
        Name: "Churn Signal",
        Type: "Runtime",
        CodeApprovalStatus: "Approved",
        CodeApprovedByUserID: "u-approver",
        ...overrides,
    };
}

/**
 * Pure transition detection: the gate fires only on a save that moves the factor INTO Approved —
 * a new row born Approved, or an existing row whose PromotionState is dirty and now Approved.
 */
describe("isPromotionApprovalTransition", () => {
    it("fires for a new record created directly as Approved", () => {
        expect(
            isPromotionApprovalTransition({
                isSaved: false,
                promotionState: "Approved",
                promotionStateDirty: true,
                previousPromotionState: null,
            }),
        ).toBe(true);
    });

    it("fires for an existing record whose PromotionState changes to Approved", () => {
        expect(
            isPromotionApprovalTransition({
                isSaved: true,
                promotionState: "Approved",
                promotionStateDirty: true,
                previousPromotionState: "Draft",
            }),
        ).toBe(true);
    });

    it("does not fire when PromotionState isn't Approved", () => {
        expect(
            isPromotionApprovalTransition({
                isSaved: true,
                promotionState: "InReview",
                promotionStateDirty: true,
                previousPromotionState: "Draft",
            }),
        ).toBe(false);
    });

    it("does not fire on an ordinary edit of an already-Approved factor (field not dirty)", () => {
        expect(
            isPromotionApprovalTransition({
                isSaved: true,
                promotionState: "Approved",
                promotionStateDirty: false,
                previousPromotionState: "Approved",
            }),
        ).toBe(false);
    });

    it("does not fire when the dirty field was already Approved (no real transition)", () => {
        expect(
            isPromotionApprovalTransition({
                isSaved: true,
                promotionState: "Approved",
                promotionStateDirty: true,
                previousPromotionState: "Approved",
            }),
        ).toBe(false);
    });
});

/**
 * Pure rule over a loaded Action row. 'Custom' actions live in the codebase (source-reviewed) and
 * pass; 'Generated'/'Runtime' actions must carry CodeApprovalStatus === 'Approved'. The
 * author-vs-approver separation check is intentionally absent: MJ: Actions has no author user
 * field, so it is not determinable (see promotionGate.ts).
 */
describe("evaluateBoundActionApproval", () => {
    it("approves a codebase ('Custom') action regardless of CodeApprovalStatus", () => {
        expect(
            evaluateBoundActionApproval(actionRow({ Type: "Custom", CodeApprovalStatus: "Pending" })).state,
        ).toBe("approved");
    });

    it("approves a Runtime action whose code is Approved", () => {
        expect(evaluateBoundActionApproval(actionRow({ Type: "Runtime" })).state).toBe("approved");
    });

    it("approves a Generated action whose code is Approved", () => {
        expect(evaluateBoundActionApproval(actionRow({ Type: "Generated" })).state).toBe("approved");
    });

    it("blocks a Runtime action whose code is Pending", () => {
        const result = evaluateBoundActionApproval(actionRow({ CodeApprovalStatus: "Pending" }));
        expect(result.state).toBe("blocked");
        if (result.state === "blocked") {
            expect(result.message).toContain("PromotionState cannot be set to Approved");
            expect(result.message).toContain("Churn Signal");
            expect(result.message).toContain("Pending");
        }
    });

    it("blocks a Generated action whose code is Rejected", () => {
        const result = evaluateBoundActionApproval(
            actionRow({ Type: "Generated", CodeApprovalStatus: "Rejected" }),
        );
        expect(result.state).toBe("blocked");
    });

    it("blocks a gated action with no CodeApprovalStatus at all", () => {
        const result = evaluateBoundActionApproval(actionRow({ CodeApprovalStatus: null }));
        expect(result.state).toBe("blocked");
    });
});

/**
 * The query wrapper. A FAILED query is `unknown` (the hard Save path fails CLOSED on it; the
 * cosmetic ValidateAsync path stays quiet) — same posture split as publishLock. A missing Action
 * is a confirmed `blocked`: there is nothing approvable to execute.
 */
describe("boundActionApprovalState", () => {
    it("approves when the bound Action's code is Approved", async () => {
        mock.rows = [{ ...actionRow() }];
        expect((await boundActionApprovalState("a1")).state).toBe("approved");
    });

    it("blocks when the bound Action's code is not Approved", async () => {
        mock.rows = [{ ...actionRow({ CodeApprovalStatus: "Pending" }) }];
        const result = await boundActionApprovalState("a1");
        expect(result.state).toBe("blocked");
    });

    it("blocks when the bound Action can't be found", async () => {
        mock.rows = [];
        const result = await boundActionApprovalState("missing");
        expect(result.state).toBe("blocked");
        if (result.state === "blocked") {
            expect(result.message).toContain("could not be found");
        }
    });

    it("returns `unknown` when the query fails — Save() fails CLOSED on it", async () => {
        mock.success = false;
        expect((await boundActionApprovalState("a1")).state).toBe("unknown");
    });
});
