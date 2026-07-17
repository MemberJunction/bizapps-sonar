import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction, ActionEngineServer } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { Metadata } from "@memberjunction/core";
import { MJActionEntity } from "@memberjunction/core-entities";

/** MJ core action that runs Runtime-action code ephemerally (a throwaway Approved copy), so a Pending
 *  signal can be exercised WITHOUT tripping the executor's approval gate. */
const TEST_RUNTIME_ACTION = "Test Runtime Action";

/** One case fed to Test Runtime Action (its result is keyed back by `name`). */
interface RuntimeTestCase { name: string; input: Record<string, unknown> }
/** One per-case result it returns. */
interface RuntimeCaseResult { name: string; success: boolean; message: string | null; output: Record<string, unknown> }
/** What the studio renders per sample record (the factor contract: numeric Value + Explanation). */
interface SignalSampleRow { anchorRecordId: string; value: number | null; explanation: string | null; error: string | null }

/**
 * Sonar: Test Signal — runs a signal's code over a SAMPLE of anchor records and returns per-record
 * results, so the Signal Studio can test a draft BEFORE it's approved.
 *
 * Why this exists rather than the studio calling `Test Runtime Action` directly: that action returns its
 * per-case results in a Type='Output' param (`TestResults`), and MJ's GraphQL RunAction only surfaces
 * Type='Both' params to the browser — so the studio got nothing back ("No result returned"). Here we call
 * Test Runtime Action IN-PROCESS (where its Output param is fully readable), reshape the results onto the
 * factor contract (Value/Explanation/error), and hand them back in a 'Both' `Result` that DOES round-trip.
 * Bonus: running through Test Runtime Action's ephemeral path means a Pending signal is testable without
 * approving it (the executor's gate is bypassed by the throwaway Approved copy).
 *
 * Input params:  TargetActionID (string — the signal), AnchorRecordIDs (JSON string[] of sample ids),
 *                AsOf (optional ISO date; defaults to now)
 * Output param:  Result (Both, JSON: { rows: [{ anchorRecordId, value, explanation, error }] })
 */
@RegisterClass(BaseAction, "SonarTestSignal")
export class SonarTestSignalAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const targetActionId = this.getInput(params, "TargetActionID");
        if (!targetActionId) {
            return this.fail(params, "VALIDATION_ERROR", "TargetActionID is required (the signal to test).");
        }
        const anchorIds = this.parseJsonParam<string[]>(params, "AnchorRecordIDs");
        if (!anchorIds || !Array.isArray(anchorIds) || anchorIds.length === 0) {
            return this.fail(params, "VALIDATION_ERROR", "AnchorRecordIDs must be a non-empty JSON array of record ids.");
        }
        const asOf = this.getInput(params, "AsOf") ?? new Date().toISOString();

        try {
            const md = new Metadata();
            const action = await md.GetEntityObject<MJActionEntity>("MJ: Actions", params.ContextUser);
            await action.Load(targetActionId);
            if (!action.IsSaved || !action.Code) {
                return this.failWithFix(params, "NOT_FOUND",
                    `Signal '${targetActionId}' wasn't found or has no code yet.`,
                    "confirm the signal exists and ActionSmith has finished writing it.");
            }

            const engine = ActionEngineServer.Instance;
            if (!engine.Actions || engine.Actions.length === 0) {
                await engine.Config(false, params.ContextUser);
            }
            const testRuntime = engine.Actions.find((a) => a.Name === TEST_RUNTIME_ACTION);
            if (!testRuntime) {
                return this.fail(params, "NOT_FOUND", `'${TEST_RUNTIME_ACTION}' is not available in this environment.`);
            }

            // Ephemeral path: pass Code + Configuration (NOT the ActionID) so Test Runtime Action builds a
            // throwaway Approved copy — a Pending signal runs without being approved.
            const config = action.RuntimeActionConfigurationObject ?? {};
            const anchorEntityId = this.getInput(params, "AnchorEntityID") ?? undefined;
            const cases: RuntimeTestCase[] = anchorIds.map((id) => ({
                name: id,
                input: { AnchorRecordID: id, AsOf: asOf, ...(anchorEntityId ? { AnchorEntityID: anchorEntityId } : {}) },
            }));
            const result = await engine.RunAction({
                Action: testRuntime,
                ContextUser: params.ContextUser,
                Filters: [],
                Params: [
                    { Name: "Code", Type: "Input", Value: action.Code },
                    { Name: "Configuration", Type: "Input", Value: config },
                    { Name: "TestCases", Type: "Input", Value: cases },
                ],
            });
            // Read TestResults in-process (the Output param IS available here — it just doesn't cross GraphQL).
            const rows = anchorIds.map((id) => this.toRow(id, this.caseFor(result.Params, id)));
            return this.ok(params, `Tested ${rows.length} sample record${rows.length === 1 ? "" : "s"}.`, { rows });
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    /** Pull the case result for an anchor id out of Test Runtime Action's `TestResults` output param. */
    private caseFor(resultParams: RunActionParams["Params"] | undefined, anchorId: string): RuntimeCaseResult | undefined {
        const raw = resultParams?.find((p) => p.Name === "TestResults")?.Value;
        const list: unknown = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (!Array.isArray(list)) return undefined;
        return (list as RuntimeCaseResult[]).find((r) => r?.name === anchorId);
    }

    /** Map one case result onto the factor contract. */
    private toRow(anchorRecordId: string, r: RuntimeCaseResult | undefined): SignalSampleRow {
        if (!r) return { anchorRecordId, value: null, explanation: null, error: "No result returned." };
        if (!r.success) return { anchorRecordId, value: null, explanation: null, error: r.message || "The signal's code threw." };
        const raw = r.output?.["Value"];
        const value = typeof raw === "number" ? raw : raw != null ? Number(raw) : null;
        const explanation = r.output?.["Explanation"];
        return {
            anchorRecordId,
            value: value != null && !Number.isNaN(value) ? value : null,
            explanation: typeof explanation === "string" ? explanation : null,
            error: null,
        };
    }
}
