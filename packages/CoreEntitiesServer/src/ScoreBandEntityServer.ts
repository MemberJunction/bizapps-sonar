import { BaseEntity, BaseEntityResult, EntityDeleteOptions, EntitySaveOptions, LogError } from "@memberjunction/core";
import { RegisterClass, ValidationErrorInfo, ValidationErrorType, ValidationResult } from "@memberjunction/global";
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
/** Surfaced whenever a band's floor isn't below its top — a range that can never match a score. */
const INVERTED_RANGE_MESSAGE =
    "A band's minimum score must be below its maximum, otherwise no score can ever fall in it.";

@RegisterClass(BaseEntity, "MJ_BizApps_Sonar: Score Bands")
export class ScoreBandEntityServer extends mjBizAppsSonarScoreBandEntity {
    public override get DefaultSkipAsyncValidation(): boolean {
        return false;
    }

    public override async Save(options?: EntitySaveOptions): Promise<boolean> {
        if (await isBandSetConfigWriteBlocked(this.BandSetID, this.ContextCurrentUser)) {
            return failPublishLock(this, this.IsSaved ? "update" : "create");
        }
        if (this.hasInvertedRange()) {
            LogError(`ScoreBand: blocked save — MinScore (${this.MinScore}) is not below MaxScore (${this.MaxScore}).`);
            this.RegisterResultHistoryEntry(new BaseEntityResult(false, INVERTED_RANGE_MESSAGE, this.IsSaved ? "update" : "create"));
            return false;
        }
        return super.Save(options);
    }

    public override async ValidateAsync(): Promise<ValidationResult> {
        const result = await super.ValidateAsync();
        if (await isBandSetConfigLocked(this.BandSetID, this.ContextCurrentUser)) {
            appendPublishLockFailure(result, "BandSetID");
        }
        if (this.hasInvertedRange()) {
            result.Success = false;
            result.Errors.push(new ValidationErrorInfo("MinScore", INVERTED_RANGE_MESSAGE, this.MinScore, ValidationErrorType.Failure));
        }
        return result;
    }

    /**
     * A band whose floor is at or above its top can never match anything — `score >= min && score <
     * max` is unsatisfiable — so it's a silent hole in the set's coverage.
     *
     * Only this SELF-CONTAINED rule is enforced per row. Whether the set as a whole tiles the scale is
     * checked at the publish gate instead (see bandCoverage.ts): moving a boundary legitimately takes
     * two writes, and the set is briefly inconsistent between them, so a per-row coverage check would
     * reject the first half of every valid edit.
     */
    private hasInvertedRange(): boolean {
        return this.MinScore != null && this.MaxScore != null && this.MinScore >= this.MaxScore;
    }

    public override async Delete(options?: EntityDeleteOptions): Promise<boolean> {
        if (await isBandSetConfigWriteBlocked(this.BandSetID, this.ContextCurrentUser)) {
            return failPublishLock(this, "delete");
        }
        return super.Delete(options);
    }
}
