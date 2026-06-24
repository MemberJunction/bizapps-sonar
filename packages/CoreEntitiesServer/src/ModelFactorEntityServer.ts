import { BaseEntity, EntityDeleteOptions, LogError } from "@memberjunction/core";
import { RegisterClass, ValidationResult } from "@memberjunction/global";
import { mjBizAppsSonarModelFactorEntity } from "@mj-biz-apps/sonar-entities";
import { appendPublishLockFailure, isModelConfigLocked } from "./publishLock";

/**
 * Server guard: a ModelFactor (a row of the model's rubric — which factor, what weight) can't be
 * created, edited, or deleted while its owning model is published (Active or Paused). See publishLock.ts.
 */
@RegisterClass(BaseEntity, "MJ_BizApps_Sonar: Model Factors")
export class ModelFactorEntityServer extends mjBizAppsSonarModelFactorEntity {
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
                `ModelFactorEntityServer: blocked delete of model factor ${this.ID} — owning model ${this.ScoreModelID} is published.`,
            );
            return false;
        }
        return super.Delete(options);
    }
}
