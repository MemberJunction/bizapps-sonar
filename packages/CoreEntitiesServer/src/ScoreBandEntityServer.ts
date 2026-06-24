import { BaseEntity, EntityDeleteOptions, LogError } from "@memberjunction/core";
import { RegisterClass, ValidationResult } from "@memberjunction/global";
import { mjBizAppsSonarScoreBandEntity } from "@mj-biz-apps/sonar-entities";
import {
    appendPublishLockFailure,
    isBandSetConfigLocked,
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

    public override async ValidateAsync(): Promise<ValidationResult> {
        const result = await super.ValidateAsync();
        if (await isBandSetConfigLocked(this.BandSetID, this.ContextCurrentUser)) {
            appendPublishLockFailure(result, "BandSetID");
        }
        return result;
    }

    public override async Delete(options?: EntityDeleteOptions): Promise<boolean> {
        if (await isBandSetConfigLocked(this.BandSetID, this.ContextCurrentUser)) {
            LogError(
                `ScoreBandEntityServer: blocked delete of band ${this.ID} — band set ${this.BandSetID} is used by a published model.`,
            );
            return false;
        }
        return super.Delete(options);
    }
}
