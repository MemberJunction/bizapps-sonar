import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { OutcomeMeasurer } from "@mj-biz-apps/sonar-engine";

/**
 * Sonar: Measure Intervention Outcomes — fills InterventionOutcome for one intervention's
 * assignments (baseline = the member's score history at assignment; outcome = their current
 * score/band) and returns the treatment-vs-control LIFT summary. Re-runnable: already-measured
 * assignments are skipped; lift always aggregates everything measured so far. v1 outcomes are
 * engagement outcomes (score/band movement) — business outcomes (renewals from domain data) are a
 * later layer.
 *
 * Input param:  InterventionID
 * Output param: Result (JSON MeasureResult: { measured, alreadyMeasured, unmeasurable, lift })
 */
@RegisterClass(BaseAction, "SonarMeasureOutcomes")
export class SonarMeasureOutcomesAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const interventionId = this.getInput(params, "InterventionID");
        if (!interventionId) {
            return this.fail(params, "VALIDATION_ERROR", "InterventionID is required.");
        }
        try {
            const result = await new OutcomeMeasurer().measure(interventionId, params.ContextUser);
            const liftLabel = result.lift.scoreLift != null ? result.lift.scoreLift.toFixed(1) : "n/a (needs both cohorts)";
            return this.ok(params, `Measured ${result.measured} outcome(s); score lift ${liftLabel}.`, result);
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }
}
