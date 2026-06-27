import { RunView, UserInfo, BaseEntity, BaseEntityResult, LogError } from "@memberjunction/core";
import {
    ValidationResult,
    ValidationErrorInfo,
    ValidationErrorType,
} from "@memberjunction/global";

/**
 * Publish-lock helpers shared by the Sonar config-entity server guards.
 *
 * Once a ScoreModel is published its scoring config is frozen into an immutable
 * ScoreModelVersion snapshot (see ScoreModelEntityServer). Editing the model's factors / data
 * sources / bands after that point would silently drift the live config away from the snapshot
 * every Score references — breaking reproducibility.
 *
 * "Locked" = the model has a published snapshot and isn't being actively rebuilt. That's any
 * model whose Status is Active (live) or Paused (was live, temporarily not scoring — its
 * snapshot still stands). Draft (still being built) and Archived (retired) stay editable.
 *
 * The Explorer UI already hides those edits behind an "unpublish to edit" gate, but that's a
 * UI-only courtesy: a script, the API, or an agent can still write straight to the entities.
 * These guards make the lock a real backend invariant, enforced wherever a save/delete flows.
 */

const SCORE_MODEL_ENTITY = "MJ_BizApps_Sonar: Score Models";

/** Statuses whose config is frozen. Kept as a const so the model + band-set queries agree. */
const LOCKED_STATUSES = ["Active", "Paused"] as const;

/** The single message every guard surfaces, so the lock reads consistently across entities. */
export const PUBLISH_LOCK_MESSAGE =
    "This model is published (Active or Paused) — its scoring configuration is locked. Unpublish " +
    "it to Draft before editing its factors, data sources, or bands.";

/**
 * ScoreModel's own scoring-config fields. Editing any of these while the model is Active/Paused would
 * drift the live config away from the published snapshot, so they're frozen by the hub guard. Operational
 * / cosmetic fields (Name, Description, Status, Owner, RecomputeMode/Cron, Notes, …) stay editable.
 */
export const GUARDED_SCORE_MODEL_FIELDS = [
    "AnchorEntityID",
    "ScoreScaleMin",
    "ScoreScaleMax",
    "CombineStrategy",
    "CombineExpression",
    "BandSetID",
    "PopulationFilter",
] as const;

/**
 * Hard-block a save/delete on a published model: log it, surface PUBLISH_LOCK_MESSAGE on the entity's
 * result (so the caller sees a reason, not a bare false), and return false. Used by the Save()/Delete()
 * OVERRIDES — unlike a ValidateAsync-only check, this can't be bypassed with SkipAsyncValidation, which
 * is exactly the escape hatch a script/API/agent (the threat model) would use.
 */
export function failPublishLock(entity: BaseEntity, op: "create" | "update" | "delete"): false {
    LogError(`${entity.EntityInfo?.Name ?? "entity"}: blocked ${op} — owning model is published (config locked).`);
    entity.RegisterResultHistoryEntry(new BaseEntityResult(false, PUBLISH_LOCK_MESSAGE, op));
    return false;
}

/**
 * True when `modelId` names a model whose config is locked (Status Active or Paused).
 * A null id (e.g. a shared library Factor with no owning model) is never locked → false.
 * Uses a lightweight existence query rather than hydrating the full entity.
 */
export async function isModelConfigLocked(
    modelId: string | null,
    contextUser?: UserInfo,
): Promise<boolean> {
    if (!modelId) {
        // Library factors (ScoreModelID = null) are exempt — correctly, with no future guard needed. A
        // pure/shared library factor is non-viable under Sonar's anchor→source FK constraint, so the only
        // viable form is a copy-on-add TEMPLATE (instantiated into a normal model-owned factor), which has
        // no shared live row to drift a published model. Reasoning: plans/library-factors.md.
        return false;
    }
    const rv = new RunView();
    const result = await rv.RunView<{ Status: string }>(
        {
            EntityName: SCORE_MODEL_ENTITY,
            ExtraFilter: `ID='${modelId}'`,
            Fields: ["Status"],
            MaxRows: 1,
            ResultType: "simple",
        },
        contextUser,
    );
    const status = result.Success ? result.Results?.[0]?.Status : undefined;
    return status !== undefined && LOCKED_STATUSES.includes(status as (typeof LOCKED_STATUSES)[number]);
}

/**
 * True when any locked (Active/Paused) model uses the given band set. Band sets are shared across
 * models, so a ScoreBand has no direct model link — but editing one can still mutate a published
 * model's rubric. This finds whether at least one locked model points at the set.
 */
export async function isBandSetConfigLocked(
    bandSetId: string | null,
    contextUser?: UserInfo,
): Promise<boolean> {
    if (!bandSetId) {
        return false;
    }
    const statusList = LOCKED_STATUSES.map((s) => `'${s}'`).join(",");
    const rv = new RunView();
    const result = await rv.RunView<{ ID: string }>(
        {
            EntityName: SCORE_MODEL_ENTITY,
            ExtraFilter: `BandSetID='${bandSetId}' AND Status IN (${statusList})`,
            Fields: ["ID"],
            MaxRows: 1,
            ResultType: "simple",
        },
        contextUser,
    );
    return result.Success && (result.Results?.length ?? 0) > 0;
}

/** Mark a validation result failed with the standard publish-lock error on the given field. */
export function appendPublishLockFailure(
    result: ValidationResult,
    source: string,
): void {
    result.Success = false;
    result.Errors.push(
        new ValidationErrorInfo(
            source,
            PUBLISH_LOCK_MESSAGE,
            null,
            ValidationErrorType.Failure,
        ),
    );
}
