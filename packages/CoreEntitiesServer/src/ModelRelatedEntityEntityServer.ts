import { BaseEntity, EntityDeleteOptions, EntitySaveOptions } from "@memberjunction/core";
import { RegisterClass, ValidationResult } from "@memberjunction/global";
import { mjBizAppsSonarModelRelatedEntityEntity } from "@mj-biz-apps/sonar-entities";
import { appendPublishLockFailure, failPublishLock, isModelConfigLocked } from "./publishLock";

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

    public override async Save(options?: EntitySaveOptions): Promise<boolean> {
        if (await isModelConfigLocked(this.ScoreModelID, this.ContextCurrentUser)) {
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
        if (await isModelConfigLocked(this.ScoreModelID, this.ContextCurrentUser)) {
            return failPublishLock(this, "delete");
        }
        return super.Delete(options);
    }
}
