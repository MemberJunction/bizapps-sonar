import { describe, it, expect } from "vitest";
import { cohortFor, fillTokens, hashToPercent, InterventionRunner, planAssignments } from "../orchestration/InterventionRunner";
import type { SegmentMember } from "../orchestration/SegmentEvaluator";

const member = (id: string): SegmentMember => ({
    scoreId: `score-${id}`,
    anchorRecordId: id,
    anchorRecordKeyJSON: null,
    normalizedScore: 50,
    bandId: "b1",
    delta: null,
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

    it("a mid holdout produces BOTH cohorts, partitioning exactly (no member unassigned or doubled)", () => {
        const many = Array.from({ length: 200 }, (_, i) => member(`m-${i}`));
        const plan = planAssignments(many, new Set(), 50, 500);
        const treated = plan.assignments.filter((a) => a.cohort === "Treatment").length;
        const held = plan.assignments.filter((a) => a.cohort === "Control").length;
        expect(treated + held).toBe(200); // exact partition — every member in exactly one cohort
        expect(treated).toBeGreaterThan(0);
        expect(held).toBeGreaterThan(0);
    });

    it("cohort assignment is stable across replans (immutability of the split, not just the row)", () => {
        const many = Array.from({ length: 50 }, (_, i) => member(`stable-${i}`));
        const first = planAssignments(many, new Set(), 30, 500).assignments;
        const second = planAssignments(many, new Set(), 30, 500).assignments;
        expect(second.map((a) => a.cohort)).toEqual(first.map((a) => a.cohort));
    });
});

import { playApprovedFromMeta } from "../orchestration/InterventionRunner";

describe("playApprovedFromMeta (fire-time governance gate)", () => {
    it("codebase actions are inherently trusted (any non-Runtime type fires)", () => {
        expect(playApprovedFromMeta("Custom", "Pending")).toBe(true);
        expect(playApprovedFromMeta("Custom", null)).toBe(true);
    });
    it("generated Runtime actions fire ONLY when Approved", () => {
        expect(playApprovedFromMeta("Runtime", "Approved")).toBe(true);
        expect(playApprovedFromMeta("Runtime", "Pending")).toBe(false);
        expect(playApprovedFromMeta("Runtime", null)).toBe(false);
    });
});

describe("fillTokens (fire-time param substitution)", () => {
    const tokens = { member: "m-42", interventionId: "iv-7", modelId: "mod-1" };

    it("substitutes all three tokens, including several in one value", () => {
        const filled = fillTokens(
            [
                { name: "AnchorRecordID", value: "{{member}}" },
                { name: "InterventionID", value: "{{interventionId}}" },
                { name: "ModelID", value: "{{modelId}}" },
                { name: "Message", value: "member {{member}} of {{member}} (run {{interventionId}})" },
            ],
            tokens,
        );
        expect(filled).toEqual([
            { name: "AnchorRecordID", value: "m-42" },
            { name: "InterventionID", value: "iv-7" },
            { name: "ModelID", value: "mod-1" },
            { name: "Message", value: "member m-42 of m-42 (run iv-7)" },
        ]);
    });

    it("leaves values without tokens (and unrecognized tokens) untouched", () => {
        const filled = fillTokens(
            [
                { name: "WebhookURL", value: "https://example.test/hook" },
                { name: "Template", value: "hello {{name}}" },
            ],
            tokens,
        );
        expect(filled).toEqual([
            { name: "WebhookURL", value: "https://example.test/hook" },
            { name: "Template", value: "hello {{name}}" },
        ]);
    });

    it("does not mutate the input params", () => {
        const params = [{ name: "AnchorRecordID", value: "{{member}}" }];
        fillTokens(params, tokens);
        expect(params[0].value).toBe("{{member}}");
    });
});

/**
 * The dry-run gate. Preview is the promise the whole governance story rests on — "nothing is written or
 * fired until you commit" — and it used to be false: the action minted a ScoreSegment and an Intervention
 * before the runner was even told it was a preview, so the Interventions tab collected empty rows for
 * previews nobody committed.
 *
 * These run with a stubbed cohort resolver and no intervention id, which is exactly the shape of a preview
 * on a cohort that has never been run. In that shape the runner should touch no database at all, so if any
 * of this reaches RunView or Metadata the test fails by throwing rather than by asserting.
 */
describe("InterventionRunner — preview writes nothing", () => {
    const cohort = [member("m1"), member("m2"), member("m3"), member("m4")];
    /** Stands in for SegmentEvaluator: returns a fixed cohort and never touches the database. */
    const stubEvaluator = () =>
        ({ resolve: async () => cohort }) as unknown as ConstructorParameters<typeof InterventionRunner>[1];
    /** An invoker that fails the test if a play is ever fired. */
    const noFire = {
        invoke: async () => {
            throw new Error("preview fired a play");
        },
    } as unknown as ConstructorParameters<typeof InterventionRunner>[0];
    const user = {} as unknown as Parameters<InterventionRunner["run"]>[1];

    const previewRequest = {
        interventionId: null,
        modelId: "mod-1",
        segmentFilter: {},
        holdoutPercent: 25,
        kind: "TrackOnly",
        cap: 100,
        preview: true,
    } as unknown as Parameters<InterventionRunner["run"]>[0];

    it("returns real counts without an intervention to write them against", async () => {
        const runner = new InterventionRunner(noFire, stubEvaluator());
        const result = await runner.run(previewRequest, user);

        expect(result.preview).toBe(true);
        expect(result.cohortSize).toBe(4);
        expect(result.treated + result.held).toBe(4);
        // Nothing was sent or failed, because nothing was fired.
        expect(result.sent).toBe(0);
        expect(result.failed).toBe(0);
    });

    it("counts nobody as already-assigned when the intervention does not exist yet", async () => {
        const runner = new InterventionRunner(noFire, stubEvaluator());
        const result = await runner.run(previewRequest, user);
        // A null id must short-circuit the assignment lookup rather than query InterventionID='null'.
        expect(result.alreadyAssigned).toBe(0);
        expect(result.eligible).toBe(4);
    });

    it("refuses to COMMIT without an intervention rather than writing orphan assignments", async () => {
        const runner = new InterventionRunner(noFire, stubEvaluator());
        const commit = { ...previewRequest, preview: false } as Parameters<InterventionRunner["run"]>[0];
        await expect(runner.run(commit, user)).rejects.toThrow(/cannot commit without an interventionId/);
    });
});
