import { BaseEntity, EntityDeleteOptions, EntitySaveOptions } from "@memberjunction/core";
import { RegisterClass, ValidationResult } from "@memberjunction/global";
import { mjBizAppsSonarFactorEntity } from "@mj-biz-apps/sonar-entities";
import { appendPublishLockFailure, failPublishLock, isModelConfigLocked, isModelConfigWriteBlocked } from "./publishLock";

/**
 * Server guard: a model-scoped Factor can't be created, edited, or deleted while its owning
 * model is published (Active or Paused) — see publishLock.ts for why. Shared library factors carry a null
 * ScoreModelID and are never locked (isModelConfigLocked returns false for null). The hard Save/Delete
 * path uses the *WriteBlocked* predicate (fails CLOSED on a query error); ValidateAsync's friendly
 * message uses the *Locked* predicate (fails OPEN) — see publishLock.ts query-error posture.
 */
@RegisterClass(BaseEntity, "MJ_BizApps_Sonar: Factors")
export class FactorEntityServer extends mjBizAppsSonarFactorEntity {
    // Opt into async validation so the guard below runs on every Save (BaseEntity skips it
    // by default).
    public override get DefaultSkipAsyncValidation(): boolean {
        return false;
    }

    // Hard invariant: enforce in Save() so it can't be bypassed via SkipAsyncValidation (which would
    // skip ValidateAsync). ValidateAsync stays below purely for the friendly message on the normal path.
    public override async Save(options?: EntitySaveOptions): Promise<boolean> {
        if (await isModelConfigWriteBlocked(this.ScoreModelID, this.ContextCurrentUser)) {
            return failPublishLock(this, this.IsSaved ? "update" : "create");
        }
        return super.Save(options);
    }

    public override async ValidateAsync(): Promise<ValidationResult> {
        const result = await super.ValidateAsync();
        if (await isModelConfigLocked(this.ScoreModelID, this.ContextCurrentUser)) {
            appendPublishLockFailure(result, "ScoreModelID");
        }
        return result;
    }

    public override async Delete(options?: EntityDeleteOptions): Promise<boolean> {
        if (await isModelConfigWriteBlocked(this.ScoreModelID, this.ContextCurrentUser)) {
            return failPublishLock(this, "delete");
        }
        return super.Delete(options);
    }
}
