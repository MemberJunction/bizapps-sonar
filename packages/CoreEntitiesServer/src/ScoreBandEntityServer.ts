import { BaseEntity, EntityDeleteOptions, EntitySaveOptions } from "@memberjunction/core";
import { RegisterClass, ValidationResult } from "@memberjunction/global";
import { mjBizAppsSonarScoreBandEntity } from "@mj-biz-apps/sonar-entities";
import {
    appendPublishLockFailure,
    failPublishLock,
    isBandSetConfigLocked,
    isBandSetConfigWriteBlocked,
} from "./publishLock";

/**
 * Server guard: a ScoreBand can't be created, edited, or deleted while any published (Active or Paused)
 * model uses its band set. Bands have no direct model link (band sets are shared), so the lock
 * keys on "is this band set used by a published model" rather than a ScoreModelID. See
 * publishLock.ts.
 */
@RegisterClass(BaseEntity, "MJ_BizApps_Sonar: Score Bands")
export class ScoreBandEntityServer extends mjBizAppsSonarScoreBandEntity {
    public override get DefaultSkipAsyncValidation(): boolean {
        return false;
    }

    public override async Save(options?: EntitySaveOptions): Promise<boolean> {
        if (await isBandSetConfigWriteBlocked(this.BandSetID, this.ContextCurrentUser)) {
            return failPublishLock(this, this.IsSaved ? "update" : "create");
        }
        return super.Save(options);
    }

    public override async ValidateAsync(): Promise<ValidationResult> {
        const result = await super.ValidateAsync();
        if (await isBandSetConfigLocked(this.BandSetID, this.ContextCurrentUser)) {
            appendPublishLockFailure(result, "BandSetID");
        }
        return result;
    }

    public override async Delete(options?: EntityDeleteOptions): Promise<boolean> {
        if (await isBandSetConfigWriteBlocked(this.BandSetID, this.ContextCurrentUser)) {
            return failPublishLock(this, "delete");
        }
        return super.Delete(options);
    }
}
