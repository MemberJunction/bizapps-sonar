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
 * ScoreModel fields that stay EDITABLE while the model is published (Active/Paused) — an ALLOWLIST,
 * deliberately inverted from a blocklist of frozen fields. Everything NOT listed here is treated as
 * scoring config and frozen by the hub guard.
 *
 * Why inverted: it flips the failure mode from "silently editable" to "safe by default". A newly added
 * scoring column — or a typo'd entry here, which a dirty-field check would otherwise treat as
 * un-guarded — is LOCKED until someone explicitly allows it, rather than slipping through. That's the
 * right posture for an integrity guard.
 *
 * The allowlist is cosmetic/identity (Name, Slug, Description, Notes), ownership (OwnerUserID),
 * scheduling (RecomputeMode/Cron), the lifecycle window (EffectiveFrom/To), the Status toggle itself
 * (so a model can be unpublished), and system-managed fields (ID, CurrentVersionID, timestamps). The
 * frozen remainder — AnchorEntityID, ScoreScale*, Combine*, BandSetID, PopulationFilter, AsOfStrategy,
 * IsCalibrated, TrendWindowDays — is exactly the config the engine scores from (plan §6), so editing it
 * on a published model would drift the live config away from the immutable snapshot every Score cites.
 */
export const EDITABLE_WHILE_PUBLISHED_SCORE_MODEL_FIELDS = [
    "ID",
    "Name",
    "Slug",
    "Description",
    "Notes",
    "OwnerUserID",
    "RecomputeMode",
    "RecomputeCron",
    "EffectiveFrom",
    "EffectiveTo",
    "Status",
    "CurrentVersionID",
    "__mj_CreatedAt",
    "__mj_UpdatedAt",
] as const;

/**
 * Pure decision for the ScoreModel hub guard: would this save edit frozen scoring config on a
 * still-published model? Extracted as a pure function (no entity / no DB) so the whole rule — including
 * the two exemptions below — is unit-testable in isolation.
 *  - `publishing` (a → Active transition) is EXEMPT: that path re-snapshots, so the edit can't drift.
 *  - A model NOT in a locked status (Draft/Archived — including a SAME-SAVE unpublish → Draft, where
 *    this.Status has already flipped out of the locked set) is editable → false.
 *  - Otherwise: blocked iff any DIRTY field falls outside the editable allowlist (safe-by-default).
 */
export function isScoringEditBlocked(opts: {
    status: string;
    publishing: boolean;
    dirtyFields: readonly string[];
}): boolean {
    if (opts.publishing) {
        return false;
    }
    if (!LOCKED_STATUSES.includes(opts.status as (typeof LOCKED_STATUSES)[number])) {
        return false;
    }
    const editable = EDITABLE_WHILE_PUBLISHED_SCORE_MODEL_FIELDS as readonly string[];
    return opts.dirtyFields.some((f) => !editable.includes(f));
}

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
 * Three-valued lock state. `unknown` means the status query FAILED, so we genuinely can't tell whether
 * the model is published — distinct from a confirmed `unlocked` (Draft/Archived/not-found). Keeping the
 * two apart is what lets the hard enforcement path and the cosmetic message path resolve a query error
 * DIFFERENTLY (see the two wrappers below) instead of both silently treating it as "unlocked".
 */
export type ModelLockState = "locked" | "unlocked" | "unknown";

/**
 * Resolve a model's lock state via a lightweight existence query (no full hydrate). A null id (e.g. a
 * shared library Factor with no owning model) is never locked.
 */
async function modelConfigLockState(
    modelId: string | null,
    contextUser?: UserInfo,
): Promise<ModelLockState> {
    if (!modelId) {
        // Library factors (ScoreModelID = null) are exempt — correctly, with no future guard needed. A
        // pure/shared library factor is non-viable under Sonar's anchor→source FK constraint, so the only
        // viable form is a copy-on-add TEMPLATE (instantiated into a normal model-owned factor), which has
        // no shared live row to drift a published model. Reasoning: plans/library-factors.md.
        return "unlocked";
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
    if (!result.Success) {
        return "unknown"; // query failed — caller decides how to treat the uncertainty
    }
    const status = result.Results?.[0]?.Status;
    if (status === undefined) {
        return "unlocked"; // model not found → genuinely not locked (≠ couldn't read)
    }
    return LOCKED_STATUSES.includes(status as (typeof LOCKED_STATUSES)[number]) ? "locked" : "unlocked";
}

/**
 * Resolve whether any locked (Active/Paused) model uses the given band set. Band sets are shared across
 * models, so a ScoreBand has no direct model link — but editing one can still mutate a published model's
 * rubric. `unknown` = the query failed (couldn't confirm), distinct from a confirmed `unlocked`.
 */
async function bandSetConfigLockState(
    bandSetId: string | null,
    contextUser?: UserInfo,
): Promise<ModelLockState> {
    if (!bandSetId) {
        return "unlocked";
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
    if (!result.Success) {
        return "unknown";
    }
    return (result.Results?.length ?? 0) > 0 ? "locked" : "unlocked";
}

/*
 * Query-error posture (the accepted, asymmetric resolution).
 *
 * A status query can fail (transient DB error). We resolve that `unknown` DIFFERENTLY on the two paths,
 * because their costs are asymmetric:
 *  - HARD path (Save/Delete, the *is…WriteBlocked* wrappers) fails CLOSED — `unknown` blocks the write.
 *    Allowing a write we can't prove is safe risks a SILENT, UNRECOVERABLE config drift on a published
 *    model (its snapshotted scores stop being reproducible). A wrongly-blocked write is RECOVERABLE — the
 *    caller sees a failure and retries — and in practice the write hits the same erroring DB and would
 *    fail anyway. Safe-by-default, matching the guarded-field allowlist above.
 *  - COSMETIC path (ValidateAsync message, the *is…Locked* wrappers) fails OPEN — `unknown` shows no lock
 *    message. The hard path is the real enforcement; surfacing "unpublish to edit" on a transient blip
 *    would just mislead the user. Worst case the friendly message is briefly absent; the write is still
 *    guarded.
 */

/** Cosmetic/message path: locked only when CONFIRMED locked (fails OPEN on a query error). */
export async function isModelConfigLocked(modelId: string | null, contextUser?: UserInfo): Promise<boolean> {
    return (await modelConfigLockState(modelId, contextUser)) === "locked";
}

/** Hard enforcement path (Save/Delete): block unless CONFIRMED unlocked (fails CLOSED on a query error). */
export async function isModelConfigWriteBlocked(modelId: string | null, contextUser?: UserInfo): Promise<boolean> {
    return (await modelConfigLockState(modelId, contextUser)) !== "unlocked";
}

/** Cosmetic/message path for band sets: locked only when CONFIRMED (fails OPEN on a query error). */
export async function isBandSetConfigLocked(bandSetId: string | null, contextUser?: UserInfo): Promise<boolean> {
    return (await bandSetConfigLockState(bandSetId, contextUser)) === "locked";
}

/** Hard enforcement path for band sets: block unless CONFIRMED unlocked (fails CLOSED on a query error). */
export async function isBandSetConfigWriteBlocked(bandSetId: string | null, contextUser?: UserInfo): Promise<boolean> {
    return (await bandSetConfigLockState(bandSetId, contextUser)) !== "unlocked";
}

/**
 * Pure decision for the archive transition gate: is this save an invalid attempt to archive
 * a non-Draft model? Only Draft → Archived is allowed; Active/Paused → Archived must route
 * through Draft first (Active/Paused config is still referenced by live Scores).
 * Extracted as a pure function (no entity / no DB) so the rule is unit-testable in isolation.
 */
export function isInvalidArchiveTransition(opts: {
    newStatus: string;
    previousStatus: string;
    statusDirty: boolean;
}): boolean {
    if (!opts.statusDirty || opts.newStatus !== "Archived") return false;
    return opts.previousStatus !== "Draft";
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
