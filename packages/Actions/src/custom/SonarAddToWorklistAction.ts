import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";

/**
 * Sonar: Add to Worklist — the zero-dependency intervention play. Firing it for a treated member
 * doesn't reach an external system; the member's assignment row IS the artifact, and the operator
 * works the list inside Sonar (the Interventions tab: mark Contacted / Done). This exists so an
 * intervention has a REAL, self-contained play to fire instead of a tracer, and so the launch picker
 * has something purpose-built to offer. External plays (email / CRM / task) slot in later as their
 * own "Sonar Plays"-category actions once a deployment names its outreach surface.
 *
 * The runner calls this once per treated member; it simply succeeds, which the runner records as the
 * assignment's delivery status (the member is now "on the worklist"). Control members are never fired.
 *
 * Input param:  AnchorRecordID (the member being queued)
 * Output param: Result (JSON: { queued: true, anchorRecordId })
 */
@RegisterClass(BaseAction, "SonarAddToWorklist")
export class SonarAddToWorklistAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const anchorRecordId = this.getInput(params, "AnchorRecordID") ?? "";
        return this.ok(params, "Added to the follow-up worklist.", { queued: true, anchorRecordId });
    }
}
