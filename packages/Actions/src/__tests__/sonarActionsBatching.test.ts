import { describe, it, expect, beforeEach, vi } from "vitest";
import type { RunActionParams } from "@memberjunction/actions-base";
import type { RunViewParams, UserInfo } from "@memberjunction/core";

const mocks = vi.hoisted(() => ({
    runViewCalls: [] as RunViewParams[],
    runViewsCalls: [] as RunViewParams[][],
    configCalls: [] as boolean[],
    models: [] as Array<{
        ID: string;
        Name: string;
        Status: string;
        AnchorEntityID: string;
        TrendWindowDays?: number | null;
        ScoreScaleMin?: number | null;
        ScoreScaleMax?: number | null;
        BandSetID?: string | null;
    }>,
    relatedEntities: [] as Array<{ ID: string; ScoreModelID: string; Alias: string; RelatedEntityID: string }>,
    factors: [] as Array<{
        ID: string;
        ScoreModelID: string;
        Name: string;
        SourceRelatedEntityID: string | null;
        Aggregation: string | null;
        AggregateFieldName: string | null;
        NormalizationMethod: string | null;
        HigherIsBetter: boolean | null;
    }>,
    modelFactors: [] as Array<{ ScoreModelID: string; FactorID: string; Weight: number; MissingDataPolicy: string | null }>,
    bandSets: [] as Array<{ ID: string; Name: string }>,
    compiledActions: [] as Array<{ ID: string; Name: string; Description: string | null; DriverClass: string | null }>,
    runtimeActions: [] as Array<{
        ID: string;
        Name: string;
        Description: string | null;
        DriverClass: string | null;
        Type: string;
        CodeApprovalStatus: string | null;
    }>,
    actionParams: [] as Array<{
        ActionID: string;
        Name: string;
        Type: "Input" | "Output" | "Both";
        Description: string | null;
        IsRequired: boolean;
        DefaultValue: string | null;
    }>,
}));

vi.mock("@memberjunction/core", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@memberjunction/core")>();
    return {
        ...actual,
        Metadata: class {
            Entities = [
                { ID: "ent-members", Name: "Members" },
                { ID: "ent-events", Name: "Events" },
            ];
        },
        RunView: class {
            async RunView(params: RunViewParams) {
                mocks.runViewCalls.push(params);
                if (params.EntityName === "MJ: Action Params") {
                    return { Success: true, Results: mocks.actionParams };
                }
                return { Success: true, Results: [] };
            }
            async RunViews(queries: RunViewParams[]) {
                mocks.runViewsCalls.push(queries);
                return queries.map((q) => {
                    if (String(q.ExtraFilter).includes("DriverClass IN")) {
                        return { Success: true, Results: mocks.compiledActions };
                    }
                    if (String(q.ExtraFilter).includes("Type='Runtime'")) {
                        return { Success: true, Results: mocks.runtimeActions };
                    }
                    return { Success: true, Results: [] };
                });
            }
        },
    };
});

vi.mock("@mj-biz-apps/sonar-entities", () => ({
    SonarEngineBase: {
        Instance: {
            Config: async (forceRefresh: boolean) => {
                mocks.configCalls.push(forceRefresh);
            },
            get ScoreModels() {
                return mocks.models;
            },
            GetModelById: (id: string) =>
                mocks.models.find((m) => m.ID.toLowerCase() === id.toLowerCase()),
            GetModelByName: (name: string) =>
                mocks.models.find((m) => m.Name.toLowerCase() === name.toLowerCase()),
            GetRelatedEntitiesForModel: (modelId: string) =>
                mocks.relatedEntities.filter((r) => r.ScoreModelID === modelId),
            GetFactorsForModel: (modelId: string) =>
                mocks.factors.filter((f) => f.ScoreModelID === modelId),
            GetModelFactorsForModel: (modelId: string) =>
                mocks.modelFactors.filter((mf) => mf.ScoreModelID === modelId),
            GetBandSetById: (id: string) =>
                mocks.bandSets.find((bs) => bs.ID === id),
        },
    },
}));

import { SonarFindModelsAction } from "../custom/SonarFindModelsAction";
import { SonarDescribeModelAction } from "../custom/SonarDescribeModelAction";
import { SonarListFactorActionsAction } from "../custom/SonarListFactorActionsAction";
import type { ActionResultSimple } from "@memberjunction/actions-base";

class TestableFindModelsAction extends SonarFindModelsAction {
    public runInternal(params: RunActionParams): Promise<ActionResultSimple> {
        return this.InternalRunAction(params);
    }
}

class TestableDescribeModelAction extends SonarDescribeModelAction {
    public runInternal(params: RunActionParams): Promise<ActionResultSimple> {
        return this.InternalRunAction(params);
    }
}

class TestableListFactorActionsAction extends SonarListFactorActionsAction {
    public runInternal(params: RunActionParams): Promise<ActionResultSimple> {
        return this.InternalRunAction(params);
    }
}

function runParams(entries: Array<{ Name: string; Value: unknown }>): RunActionParams {
    return {
        Params: entries,
        ContextUser: { ID: "user-1", Name: "Agent" } as UserInfo,
    } as unknown as RunActionParams;
}

describe("Sonar Actions caching & batched RunViews", () => {
    beforeEach(() => {
        mocks.runViewCalls = [];
        mocks.runViewsCalls = [];
        mocks.configCalls = [];
        mocks.models = [
            {
                ID: "11111111-1111-1111-1111-111111111111",
                Name: "Member Engagement",
                Status: "Active",
                AnchorEntityID: "ent-members",
                TrendWindowDays: 30,
                ScoreScaleMin: 0,
                ScoreScaleMax: 100,
                BandSetID: "bs-1",
            },
            {
                ID: "22222222-2222-2222-2222-222222222222",
                Name: "Partner Health",
                Status: "Draft",
                AnchorEntityID: "ent-members",
            },
        ];
        mocks.relatedEntities = [
            {
                ID: "mre-1",
                ScoreModelID: "11111111-1111-1111-1111-111111111111",
                Alias: "Events",
                RelatedEntityID: "ent-events",
            },
        ];
        mocks.factors = [
            {
                ID: "fac-1",
                ScoreModelID: "11111111-1111-1111-1111-111111111111",
                Name: "Event Count",
                SourceRelatedEntityID: "mre-1",
                Aggregation: "Count",
                AggregateFieldName: null,
                NormalizationMethod: "MinMax",
                HigherIsBetter: true,
            },
        ];
        mocks.modelFactors = [
            {
                ScoreModelID: "11111111-1111-1111-1111-111111111111",
                FactorID: "fac-1",
                Weight: 0.5,
                MissingDataPolicy: "Zero",
            },
        ];
        mocks.bandSets = [{ ID: "bs-1", Name: "Default Health Bands" }];
        mocks.compiledActions = [];
        mocks.runtimeActions = [
            {
                ID: "act-rt-1",
                Name: "Activity Streak",
                Description: "Counts consecutive active months.",
                DriverClass: null,
                Type: "Runtime",
                CodeApprovalStatus: "Approved",
            },
        ];
        mocks.actionParams = [
            { ActionID: "act-rt-1", Name: "AnchorRecordID", Type: "Input", Description: null, IsRequired: true, DefaultValue: null },
            { ActionID: "act-rt-1", Name: "Value", Type: "Output", Description: null, IsRequired: false, DefaultValue: null },
            { ActionID: "act-rt-1", Name: "LookbackMonths", Type: "Input", Description: "Window", IsRequired: false, DefaultValue: "6" },
        ];
    });

    it("SonarFindModelsAction resolves models from SonarEngineBase with zero RunView calls", async () => {
        const action = new TestableFindModelsAction();
        const res = await action.runInternal(runParams([{ Name: "NameQuery", Value: "member" }]));

        expect(res.Success).toBe(true);
        expect(mocks.configCalls).toEqual([false]);
        expect(mocks.runViewCalls).toHaveLength(0);
        expect(mocks.runViewsCalls).toHaveLength(0);
        const payload = JSON.parse(String(res.Params?.find((p) => p.Name === "Result")?.Value));
        expect(payload.count).toBe(1);
        expect(payload.models[0].name).toBe("Member Engagement");
        expect(payload.models[0].anchorName).toBe("Members");
    });

    it("SonarDescribeModelAction describes model, sources, factors, and band set from SonarEngineBase with zero RunView calls", async () => {
        const action = new TestableDescribeModelAction();
        const res = await action.runInternal(
            runParams([{ Name: "ModelID", Value: "11111111-1111-1111-1111-111111111111" }]),
        );

        expect(res.Success).toBe(true);
        expect(mocks.configCalls).toEqual([false]);
        expect(mocks.runViewCalls).toHaveLength(0);
        expect(mocks.runViewsCalls).toHaveLength(0);
        const payload = JSON.parse(String(res.Params?.find((p) => p.Name === "Result")?.Value));
        expect(payload.name).toBe("Member Engagement");
        expect(payload.bandSet).toEqual({ id: "bs-1", name: "Default Health Bands" });
        expect(payload.sources).toHaveLength(1);
        expect(payload.factors).toHaveLength(1);
        expect(payload.factors[0].weight).toBe(0.5);
    });

    it("SonarListFactorActionsAction batches candidate action queries in RunViews and loads params once", async () => {
        const action = new TestableListFactorActionsAction();
        const res = await action.runInternal(runParams([]));

        expect(res.Success).toBe(true);
        expect(mocks.runViewsCalls).toHaveLength(1);
        expect(mocks.runViewCalls).toHaveLength(1);
        expect(mocks.runViewCalls[0].EntityName).toBe("MJ: Action Params");
        const payload = JSON.parse(String(res.Params?.find((p) => p.Name === "Result")?.Value));
        expect(payload).toHaveLength(1);
        expect(payload[0].name).toBe("Activity Streak");
        expect(payload[0].params.map((p: { name: string }) => p.name)).toEqual(["LookbackMonths"]);
    });
});
