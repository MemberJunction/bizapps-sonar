import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { Metadata, RunView, UserInfo } from "@memberjunction/core";
import { MJActionEntity } from "@memberjunction/core-entities";
import { ACTIONSMITH, FACTOR_BRIEF, loadActionSmith, fireActionSmithDetached } from "./actionsmith.shared";

/** How far back to widen the "freshly authored" window, to absorb clock skew between us and the DB. */
const CLOCK_SKEW_MS = 5000;

/**
 * Sonar: Refine Factor Action — the AI "improve this signal" loop behind the Signal Studio. Fires
 * ActionSmith with the CURRENT code + the reviewer's feedback (same factor brief), detached like the
 * commission flow. ActionSmith always authors a NEW Runtime action row, so once it finishes we
 * TRANSPLANT the improved (and agent-self-tested) code back onto the ORIGINAL signal — dropping it to
 * Pending for re-review — and DISABLE the agent's scratch row so the catalog stays one-signal-per-idea.
 * The approval gate is never bypassed: the refined code lands Pending, exactly like a manual edit.
 *
 * Input params:  TargetActionID (string — the signal to improve), Feedback (string — what to change)
 * Output param:  Result (JSON: { agentRunId })
 */
@RegisterClass(BaseAction, "SonarRefineFactorAction")
export class SonarRefineFactorActionAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const targetActionId = this.getInput(params, "TargetActionID");
        const feedback = this.getInput(params, "Feedback");
        if (!targetActionId) return this.fail(params, "VALIDATION_ERROR", "TargetActionID is required (the signal to improve).");
        if (!this.isGuid(targetActionId)) {
            return this.failWithFix(params, "VALIDATION_ERROR", `TargetActionID '${targetActionId}' is not a valid GUID.`,
                "pass the action's GUID id (from Sonar: List Factor Actions).");
        }
        if (!feedback) return this.fail(params, "VALIDATION_ERROR", "Feedback is required (what to change).");

        try {
            const target = await this.loadAction(targetActionId, params.ContextUser);
            if (!target) return this.fail(params, "NOT_FOUND", `No action found for ID '${targetActionId}'.`);

            const agent = await loadActionSmith(params.ContextUser);
            if (!agent) return this.fail(params, "NOT_FOUND", `'${ACTIONSMITH}' agent not found in this environment.`);

            const content = this.buildRevisionPrompt(target.Name, target.Code ?? "", feedback);
            // Capture the cutoff BEFORE firing — the scratch row the agent authors is created after this.
            const sinceIso = new Date(Date.now() - CLOCK_SKEW_MS).toISOString();

            const agentRunId = await fireActionSmithDetached({
                agent,
                content,
                contextUser: params.ContextUser,
                onComplete: () => this.transplant(targetActionId, sinceIso, params.ContextUser),
            });
            if (!agentRunId) return this.fail(params, "ERROR", "The refine job didn't start (no run id was produced).");
            return this.ok(params, "Refine job started.", { agentRunId });
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    /** The revision brief: the factor contract + the existing code + the requested change. */
    private buildRevisionPrompt(name: string, currentCode: string, feedback: string): string {
        return `${FACTOR_BRIEF}Improve the EXISTING signal "${name}". Keep the same input/output contract; \
return the full, corrected code (not a diff).

Requested change:
${feedback}

Current code:
\`\`\`javascript
${currentCode}
\`\`\``;
    }

    /**
     * After the agent finishes: find the Runtime action it just authored, copy its code onto the original
     * signal (→ Pending), and disable the scratch row. Best-effort — if nothing matches (agent failed),
     * leave the original untouched; the failed run already tells the user.
     */
    private async transplant(targetActionId: string, sinceIso: string, contextUser: UserInfo | undefined): Promise<void> {
        const scratch = await this.findFreshlyAuthored(targetActionId, sinceIso, contextUser);
        if (!scratch || !scratch.Code) return;

        const target = await this.loadAction(targetActionId, contextUser);
        if (!target) return;
        target.Code = scratch.Code;
        target.CodeApprovalStatus = "Pending";
        target.CodeApprovedByUserID = null;
        target.CodeApprovedAt = null;
        if (!(await target.Save())) return;

        // Hide the agent's scratch row from the catalog (it only surfaces Active Runtime actions).
        scratch.Status = "Disabled";
        await scratch.Save();
    }

    /** The newest Active Runtime action authored since the cutoff, other than the target itself. */
    private async findFreshlyAuthored(
        targetActionId: string,
        sinceIso: string,
        contextUser: UserInfo | undefined,
    ): Promise<MJActionEntity | null> {
        const res = await new RunView().RunView<MJActionEntity>(
            {
                EntityName: "MJ: Actions",
                ExtraFilter: `Type='Runtime' AND Status='Active' AND ID<>'${this.sqlString(targetActionId)}' AND __mj_CreatedAt>='${sinceIso}'`,
                OrderBy: "__mj_CreatedAt DESC",
                MaxRows: 1,
                ResultType: "entity_object",
            },
            contextUser,
        );
        return res.Success && res.Results.length ? res.Results[0] : null;
    }

    private async loadAction(actionId: string, contextUser: UserInfo | undefined): Promise<MJActionEntity | null> {
        const action = await new Metadata().GetEntityObject<MJActionEntity>("MJ: Actions", contextUser);
        await action.Load(actionId);
        return action.IsSaved ? action : null;
    }
}
