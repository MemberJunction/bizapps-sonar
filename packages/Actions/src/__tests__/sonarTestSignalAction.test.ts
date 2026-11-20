import { describe, it, expect } from "vitest";
import type { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { SonarTestSignalAction } from "../custom/SonarTestSignalAction";

/** Subclass exposing protected InternalRunAction for direct unit testing. */
class TestableSonarTestSignalAction extends SonarTestSignalAction {
    public runInternal(params: RunActionParams): Promise<ActionResultSimple> {
        return this.InternalRunAction(params);
    }
}

function makeParams(entries: { Name: string; Value: unknown }[]): RunActionParams {
    return {
        Params: entries.map((e) => ({ Name: e.Name, Value: e.Value, Type: "Input" })),
    } as unknown as RunActionParams;
}

describe("SonarTestSignalAction input validation", () => {
    const action = new TestableSonarTestSignalAction();

    it("rejects missing TargetActionID with VALIDATION_ERROR", async () => {
        const result = await action.runInternal(makeParams([
            { Name: "AnchorRecordIDs", Value: '["00000000-0000-0000-0000-000000000001"]' },
        ]));
        expect(result.Success).toBe(false);
        expect(result.ResultCode).toBe("VALIDATION_ERROR");
    });

    it("rejects non-GUID TargetActionID up front before loading MJ: Actions", async () => {
        const result = await action.runInternal(makeParams([
            { Name: "TargetActionID", Value: "x' OR 1=1 --" },
            { Name: "AnchorRecordIDs", Value: '["00000000-0000-0000-0000-000000000001"]' },
        ]));
        expect(result.Success).toBe(false);
        expect(result.ResultCode).toBe("VALIDATION_ERROR");
        expect(result.Message).toContain("not a valid GUID");
    });
});
