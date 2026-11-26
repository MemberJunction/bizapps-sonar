import { describe, it, expect, beforeEach, vi } from "vitest";
import type { RunViewParams, UserInfo } from "@memberjunction/core";

const mocks = vi.hoisted(() => ({
    runViewCalls: [] as RunViewParams[],
    runViewsCalls: [] as RunViewParams[][],
    cachedModel: null as {
        ID: string;
        AnchorEntityID: string;
        PopulationFilter: string | null;
    } | null,
    totalCount: 500,
    scopedCount: 75,
}));

vi.mock("@memberjunction/core", () => ({
    LogError: () => undefined,
    LogStatus: () => undefined,
    Metadata: class {
        EntityByID(id: string) {
            if (id === "anchor-entity-1") {
                return {
                    ID: "anchor-entity-1",
                    Name: "Members",
                    PrimaryKeys: [{ Name: "ID" }],
                    Fields: [{ Name: "ID" }, { Name: "Status" }],
                };
            }
            return null;
        }
        EntityByName() {
            return null;
        }
    },
    RunView: class {
        async RunView(params: RunViewParams) {
            mocks.runViewCalls.push(params);
            return { Success: true, TotalRowCount: mocks.totalCount, Results: [] };
        }
        async RunViews(queries: RunViewParams[]) {
            mocks.runViewsCalls.push(queries);
            return queries.map((q) => ({
                Success: true,
                TotalRowCount: q.ExtraFilter ? mocks.scopedCount : mocks.totalCount,
                Results: [],
            }));
        }
    },
}));

vi.mock("@mj-biz-apps/sonar-entities", () => ({
    SonarEngineBase: {
        Instance: {
            Config: vi.fn(async () => undefined),
            GetModelById: vi.fn(() => mocks.cachedModel),
            GetModelFactorsForModel: vi.fn(() => []),
            GetFactorById: vi.fn(() => undefined),
            GetBandsForBandSet: vi.fn(() => []),
        },
    },
}));

import { RecomputeOrchestrator } from "../orchestration/RecomputeOrchestrator";

const USER = { ID: "user-1", Name: "Operator" } as UserInfo;

describe("RecomputeOrchestrator.countPopulation batching & SonarEngineBase cache", () => {
    beforeEach(() => {
        mocks.runViewCalls = [];
        mocks.runViewsCalls = [];
        mocks.cachedModel = null;
    });

    it("batches total and scoped count_only queries into a single RunViews call when PopulationFilter is set", async () => {
        mocks.cachedModel = {
            ID: "model-1",
            AnchorEntityID: "anchor-entity-1",
            PopulationFilter: JSON.stringify({
                logic: "and",
                filters: [{ field: "Status", operator: "eq", value: "Active" }],
            }),
        };

        const orchestrator = new RecomputeOrchestrator();
        const result = await orchestrator.countPopulation("model-1", USER);

        expect(result).toEqual({ scoped: 75, total: 500, filtered: true });
        expect(mocks.runViewCalls).toHaveLength(0);
        expect(mocks.runViewsCalls).toHaveLength(1);
        expect(mocks.runViewsCalls[0]).toHaveLength(2);
        expect(mocks.runViewsCalls[0][0].ResultType).toBe("count_only");
        expect(mocks.runViewsCalls[0][0].ExtraFilter).toBeUndefined();
        expect(mocks.runViewsCalls[0][1].ResultType).toBe("count_only");
        expect(mocks.runViewsCalls[0][1].ExtraFilter).toContain("Status");
    });

    it("issues a single count_only RunView when the model has no PopulationFilter", async () => {
        mocks.cachedModel = {
            ID: "model-2",
            AnchorEntityID: "anchor-entity-1",
            PopulationFilter: null,
        };

        const orchestrator = new RecomputeOrchestrator();
        const result = await orchestrator.countPopulation("model-2", USER);

        expect(result).toEqual({ scoped: 500, total: 500, filtered: false });
        expect(mocks.runViewCalls).toHaveLength(1);
        expect(mocks.runViewsCalls).toHaveLength(0);
    });
});
