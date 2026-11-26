import { describe, it, expect, beforeEach, vi } from "vitest";
import type { RunViewParams, UserInfo } from "@memberjunction/core";
import type { mjBizAppsSonarScoreModelEntity } from "@mj-biz-apps/sonar-entities";

interface RecordedRunViewsCall {
    queries: RunViewParams[];
}

const mocks = vi.hoisted(() => ({
    runViewCalls: [] as RunViewParams[],
    runViewsCalls: [] as RecordedRunViewsCall[],
    existingScores: [] as Array<{ ID: string; AnchorRecordID: string; Delete: () => Promise<boolean> }>,
    existingContributions: [] as Array<{ ScoreID: string; Delete: () => Promise<boolean> }>,
    baselineRows: [] as Array<{ AnchorRecordID: string; NormalizedScore: number | null; BandID: string | null }>,
    processResult: {
        Status: "Completed" as const,
        Processed: 1,
        Success: 1,
        Error: 0,
        Skipped: 0,
        ProcessRunID: "pr-1",
    },
}));

vi.mock("@memberjunction/core", () => ({
    LogStatus: () => undefined,
    Metadata: class {
        EntityByName() {
            return { SchemaName: "__mj_BizAppsSonar", BaseTable: "Score" };
        }
    },
    RunView: class {
        async RunView(params: RunViewParams) {
            mocks.runViewCalls.push(params);
            if (params.EntityName === "MJ_BizApps_Sonar: Scores") {
                return { Success: true, Results: mocks.existingScores };
            }
            return { Success: true, Results: [] };
        }
        async RunViews(queries: RunViewParams[]) {
            mocks.runViewsCalls.push({ queries });
            return queries.map((q) => {
                if (q.EntityName === "MJ_BizApps_Sonar: Scores") {
                    return { Success: true, Results: mocks.existingScores };
                }
                if (q.EntityName === "MJ_BizApps_Sonar: Score Histories") {
                    return { Success: true, Results: mocks.baselineRows };
                }
                if (q.EntityName === "MJ_BizApps_Sonar: Score Factor Contributions") {
                    return { Success: true, Results: mocks.existingContributions };
                }
                return { Success: true, Results: [] };
            });
        }
    },
}));

vi.mock("@memberjunction/record-set-processor", () => ({
    FunctionRecordProcessor: class {
        constructor(public readonly fn: unknown) {}
    },
    GenericProcessRunTracker: class {},
    RecordSetProcessor: {
        Instance: {
            Process: async () => mocks.processResult,
        },
    },
}));

vi.mock("@memberjunction/record-set-processor-base", () => ({
    ArraySource: class {},
}));

import { ScorePersister } from "../orchestration/ScorePersister";
import type { ScoreResult } from "../scoring/ScoringEngine";

function makeModel(overrides: Partial<mjBizAppsSonarScoreModelEntity> = {}): mjBizAppsSonarScoreModelEntity {
    return {
        ID: "11111111-1111-1111-1111-111111111111",
        AnchorEntityID: "22222222-2222-2222-2222-222222222222",
        TrendWindowDays: null,
        ...overrides,
    } as mjBizAppsSonarScoreModelEntity;
}

const USER = { ID: "user-1", Name: "Tester" } as UserInfo;

describe("ScorePersister batched RunViews & RLS-safe two-step contribution loads", () => {
    beforeEach(() => {
        mocks.runViewCalls = [];
        mocks.runViewsCalls = [];
        mocks.existingScores = [];
        mocks.existingContributions = [];
        mocks.baselineRows = [];
    });

    it("batches Scores + simple Score Histories into one RunViews call and loads contributions via chunked ScoreID IN (...) without raw SQL subqueries", async () => {
        // Seed 250 existing scores so contribution loading must chunk into 200 + 50 within one RunViews batch.
        mocks.existingScores = Array.from({ length: 250 }, (_, i) => ({
            ID: `score-${i}`,
            AnchorRecordID: `anchor-${i}`,
            Delete: async () => true,
        }));
        mocks.baselineRows = [{ AnchorRecordID: "anchor-0", NormalizedScore: 60, BandID: "b-1" }];

        const scores = new Map<string, ScoreResult>([
            [
                "anchor-0",
                {
                    rawScore: 0.75,
                    normalizedScore: 75,
                    bandId: "b-1",
                    bandLabel: "Healthy",
                    contributions: [],
                },
            ],
        ]);
        const persister = new ScorePersister();
        await persister.write(
            makeModel({ TrendWindowDays: 30 }),
            "ver-1",
            scores,
            new Date("2026-06-01T00:00:00Z"),
            USER,
        );

        // Call 1: Scores + Score Histories batched in a single RunViews call.
        expect(mocks.runViewsCalls.length).toBe(2);
        const initialBatch = mocks.runViewsCalls[0].queries;
        expect(initialBatch).toHaveLength(2);
        expect(initialBatch[0].EntityName).toBe("MJ_BizApps_Sonar: Scores");
        expect(initialBatch[1].EntityName).toBe("MJ_BizApps_Sonar: Score Histories");
        expect(initialBatch[1].ResultType).toBe("simple");
        expect(initialBatch[1].Fields).toEqual(["AnchorRecordID", "NormalizedScore", "BandID"]);

        // Call 2: Contributions loaded via 2 chunked ScoreID IN (...) queries in one RunViews batch — ZERO raw SQL subqueries.
        const contribBatch = mocks.runViewsCalls[1].queries;
        expect(contribBatch).toHaveLength(2);
        for (const q of contribBatch) {
            expect(q.EntityName).toBe("MJ_BizApps_Sonar: Score Factor Contributions");
            expect(String(q.ExtraFilter)).toMatch(/^ScoreID IN \(/);
            expect(String(q.ExtraFilter)).not.toMatch(/SELECT\s+ID\s+FROM/i);
        }
    });

    it("skips contribution queries entirely when clearing a model with no existing scores", async () => {
        mocks.existingScores = [];
        const persister = new ScorePersister();
        const count = await persister.write(
            makeModel(),
            "ver-1",
            new Map(),
            new Date("2026-06-01T00:00:00Z"),
            USER,
        );
        expect(count).toBe(0);
        expect(mocks.runViewCalls).toHaveLength(1);
        expect(mocks.runViewsCalls).toHaveLength(0);
    });
});
