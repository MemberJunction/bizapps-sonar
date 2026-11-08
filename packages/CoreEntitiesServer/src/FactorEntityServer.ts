import { BaseEntity, EntityDeleteOptions, EntitySaveOptions } from "@memberjunction/core";
import { RegisterClass, ValidationResult } from "@memberjunction/global";
import { mjBizAppsSonarFactorEntity } from "@mj-biz-apps/sonar-entities";
import { appendPublishLockFailure, failPublishLock, isModelConfigLocked, isModelConfigWriteBlocked } from "./publishLock";
import {
    appendPromotionGateFailure,
    boundActionApprovalState,
    BoundActionApprovalState,
    failPromotionGate,
    isPromotionApprovalTransition,
    promotionGateMessage,
} from "./promotionGate";

/**
 * Server guards on Factor:
 *
 * 1. Publish lock — a model-scoped Factor can't be created, edited, or deleted while its owning
 * model is published (Active or Paused) — see publishLock.ts for why. Shared library factors carry a null
 * ScoreModelID and are never locked (isModelConfigLocked returns false for null). The hard Save/Delete
 * path uses the *WriteBlocked* predicate (fails CLOSED on a query error); ValidateAsync's friendly
 * message uses the *Locked* predicate (fails OPEN) — see publishLock.ts query-error posture.
 *
 * 2. Promotion gate — a save that transitions PromotionState to 'Approved' on an Action-backed
 * factor (ActionID set) is refused unless the bound Action's code is approved — see
 * promotionGate.ts for the threat model (self-approval of unreviewed code the engine would then
 * execute). Same posture split: the hard Save path fails CLOSED when the Action can't be read;
 * ValidateAsync's message fails OPEN. Declarative factors (no ActionID) are untouched.
 */
@RegisterClass(BaseEntity, "MJ_BizApps_Sonar: Factors")
export class FactorEntityServer extends mjBizAppsSonarFactorEntity {
    // Opt into async validation so the guard below runs on every Save (BaseEntity skips it
    // by default).
    public override get DefaultSkipAsyncValidation(): boolean {
        return false;
    }

    // Hard invariants: enforce in Save() so they can't be bypassed via SkipAsyncValidation (which would
    // skip ValidateAsync). ValidateAsync stays below purely for the friendly messages on the normal path.
    public override async Save(options?: EntitySaveOptions): Promise<boolean> {
        if (await isModelConfigWriteBlocked(this.ScoreModelID, this.ContextCurrentUser)) {
            return failPublishLock(this, this.IsSaved ? "update" : "create");
        }
        const approval = await this.resolvePromotionApproval();
        if (approval && approval.state !== "approved") {
            // Fail CLOSED on `unknown` (couldn't read the Action): an approval we can't verify is
            // refused, matching the publish lock's hard-path posture.
            const message =
                approval.state === "blocked"
                    ? approval.message
                    : promotionGateMessage(
                          "the bound Action could not be read to verify its code approval. Retry the save.",
                      );
            return failPromotionGate(this, message, this.IsSaved ? "update" : "create");
        }
        return super.Save(options);
    }

    public override async ValidateAsync(): Promise<ValidationResult> {
        const result = await super.ValidateAsync();
        if (await isModelConfigLocked(this.ScoreModelID, this.ContextCurrentUser)) {
            appendPublishLockFailure(result, "ScoreModelID");
        }
        const approval = await this.resolvePromotionApproval();
        if (approval?.state === "blocked") {
            // Cosmetic path fails OPEN on `unknown` — Save() above is the real enforcement.
            appendPromotionGateFailure(result, approval.message);
        }
        return result;
    }

    /**
     * Run the promotion gate when (and only when) this save transitions the factor INTO
     * PromotionState = 'Approved' and the factor is Action-backed (references an Action).
     * Returns null when the gate doesn't apply to this save.
     */
    private async resolvePromotionApproval(): Promise<BoundActionApprovalState | null> {
        const field = this.GetFieldByName("PromotionState");
        const previous = typeof field?.OldValue === "string" ? field.OldValue : null;
        const transitioning = isPromotionApprovalTransition({
            isSaved: this.IsSaved,
            promotionState: this.PromotionState,
            promotionStateDirty: field?.Dirty === true,
            previousPromotionState: previous,
        });
        if (!transitioning || !this.ActionID) {
            return null; // not an approval transition, or declarative — today's behavior
        }
        return boundActionApprovalState(this.ActionID, this.ContextCurrentUser);
    }

    public override async Delete(options?: EntityDeleteOptions): Promise<boolean> {
        if (await isModelConfigWriteBlocked(this.ScoreModelID, this.ContextCurrentUser)) {
            return failPublishLock(this, "delete");
        }
        return super.Delete(options);
    }
}
