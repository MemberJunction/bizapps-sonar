import { describe, it, expect } from "vitest";
import { cohortFor, hashToPercent, planAssignments } from "../orchestration/InterventionRunner";
import type { SegmentMember } from "../orchestration/SegmentEvaluator";

const member = (id: string): SegmentMember => ({
    anchorRecordId: id,
    anchorRecordKeyJSON: null,
    normalizedScore: 50,
    bandId: "b1",
});

describe("hashToPercent / cohortFor", () => {
    it("is deterministic — same id always lands in the same cohort", () => {
        const a = cohortFor("member-123", 20);
        const b = cohortFor("member-123", 20);
        expect(a).toBe(b);
        expect(hashToPercent("member-123")).toBe(hashToPercent("member-123"));
    });

    it("0% holdout → everyone treated; 100% → everyone held", () => {
        const ids = ["a", "b", "c", "d", "e"];
        expect(ids.every((id) => cohortFor(id, 0) === "Treatment")).toBe(true);
        expect(ids.every((id) => cohortFor(id, 100) === "Control")).toBe(true);
    });

    it("splits roughly to the holdout rate over many ids", () => {
        const ids = Array.from({ length: 1000 }, (_, i) => `member-${i}`);
        const held = ids.filter((id) => cohortFor(id, 20) === "Control").length;
        expect(held).toBeGreaterThan(120); // ~20% with tolerance
        expect(held).toBeLessThan(280);
    });
});

describe("planAssignments", () => {
    const cohort = [member("m1"), member("m2"), member("m3"), member("m4")];

    it("excludes already-assigned members (idempotency — no re-fire on re-run)", () => {
        const plan = planAssignments(cohort, new Set(["m1", "m2"]), 0, 100);
        expect(plan.alreadyAssigned).toBe(2);
        expect(plan.assignments.map((a) => a.member.anchorRecordId)).toEqual(["m3", "m4"]);
    });

    it("caps the number assigned this run (leaves the rest for later)", () => {
        const plan = planAssignments(cohort, new Set(), 0, 2);
        expect(plan.capped).toBe(true);
        expect(plan.assignments).toHaveLength(2);
    });

    it("not capped when the cohort fits", () => {
        const plan = planAssignments(cohort, new Set(), 0, 10);
        expect(plan.capped).toBe(false);
        expect(plan.assignments).toHaveLength(4);
    });

    it("splits the assigned members into treatment/control by holdout", () => {
        const plan = planAssignments(cohort, new Set(), 0, 10);
        expect(plan.assignments.every((a) => a.cohort === "Treatment")).toBe(true);
    });
});
