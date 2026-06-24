import { BaseEntity, EntityDeleteOptions, LogError } from "@memberjunction/core";
import { RegisterClass, ValidationResult } from "@memberjunction/global";
import { mjBizAppsSonarFactorEntity } from "@mj-biz-apps/sonar-entities";
import { appendPublishLockFailure, isModelConfigLocked } from "./publishLock";

/**
 * Server guard: a model-scoped Factor can't be created, edited, or deleted while its owning
 * model is published (Active or Paused) — see publishLock.ts for why. Shared library factors carry a null
 * ScoreModelID and are never locked (isModelConfigLocked returns false for null).
 */
@RegisterClass(BaseEntity, "MJ_BizApps_Sonar: Factors")
export class FactorEntityServer extends mjBizAppsSonarFactorEntity {
    // Opt into async validation so the guard below runs on every Save (BaseEntity skips it
    // by default).
    public override get DefaultSkipAsyncValidation(): boolean {
        return false;
    }

    public override async ValidateAsync(): Promise<ValidationResult> {
        const result = await super.ValidateAsync();
        if (await isModelConfigLocked(this.ScoreModelID, this.ContextCurrentUser)) {
            appendPublishLockFailure(result, "ScoreModelID");
        }
        return result;
    }

    public override async Delete(options?: EntityDeleteOptions): Promise<boolean> {
        if (await isModelConfigLocked(this.ScoreModelID, this.ContextCurrentUser)) {
            LogError(
                `FactorEntityServer: blocked delete of factor ${this.ID} — owning model ${this.ScoreModelID} is published.`,
            );
            return false;
        }
        return super.Delete(options);
    }
}
