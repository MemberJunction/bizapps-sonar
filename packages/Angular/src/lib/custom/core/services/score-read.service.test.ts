import { beforeEach, describe, expect, it, vi } from "vitest";

/** What the mocked RunView returns for the next call — the shape MJ gives back for a view read. */
let nextRunView: { Success: boolean; ErrorMessage?: string; Results?: unknown[] } = { Success: true, Results: [] };

vi.mock("@memberjunction/core", () => ({
    RunView: class { public async RunView() { return nextRunView; } },
    RunQuery: class {},
    Metadata: class {},
}));
vi.mock("@mj-biz-apps/sonar-entities", () => ({}));

import { ScoreReadService } from "./score-read.service";

describe("ScoreReadService.distributionForModel", () => {
    beforeEach(() => {
        nextRunView = { Success: true, Results: [] };
    });

    it("reports a model with no scores as empty", async () => {
        await expect(new ScoreReadService().distributionForModel("model-1")).resolves.toEqual({ slices: [], total: 0 });
    });

    it("rejects, naming the model and the server's message, when the Scores read reports failure", async () => {
        nextRunView = { Success: false, ErrorMessage: "Invalid column name 'BandID'.", Results: [] };
        await expect(new ScoreReadService().distributionForModel("model-1"))
            .rejects.toThrow(/model-1.*Invalid column name 'BandID'\./);
    });
});
