import { BaseEntity, EntityDeleteOptions, LogError } from "@memberjunction/core";
import { RegisterClass, ValidationResult } from "@memberjunction/global";
import { mjBizAppsSonarModelRelatedEntityEntity } from "@mj-biz-apps/sonar-entities";
import { appendPublishLockFailure, isModelConfigLocked } from "./publishLock";

/**
 * Server guard: a ModelRelatedEntity (a data-source / relationship-path row the model's factors
 * read through) can't be created, edited, or deleted while its owning model is published
 * (Active or Paused). See publishLock.ts.
 */
@RegisterClass(BaseEntity, "MJ_BizApps_Sonar: Model Related Entities")
export class ModelRelatedEntityEntityServer extends mjBizAppsSonarModelRelatedEntityEntity {
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
                `ModelRelatedEntityEntityServer: blocked delete of related entity ${this.ID} — owning model ${this.ScoreModelID} is published.`,
            );
            return false;
        }
        return super.Delete(options);
    }
}
