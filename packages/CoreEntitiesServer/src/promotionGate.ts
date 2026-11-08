import { RunView, UserInfo, BaseEntity, BaseEntityResult, LogError } from "@memberjunction/core";
import {
    ValidationResult,
    ValidationErrorInfo,
    ValidationErrorType,
} from "@memberjunction/global";

/**
 * Promotion-gate helpers for the Factor server guard.
 *
 * Factor.PromotionState is the ONLY runtime gate the scoring engine checks before executing an
 * Action-backed factor's code during a persisted recompute (RecomputeOrchestrator skips any
 * factor whose PromotionState !== 'Approved'). Without a server guard the column is ordinary
 * writable data, so anyone with Update on Factors could mark an UNREVIEWED Action-backed factor
 * Approved and have the engine execute its generated code — self-approval of unreviewed code.
 *
 * The intended promotion path (SonarBindSignalToModelAction) checks the bound Action's
 * CodeApprovalStatus before creating a factor born Approved. These helpers make that same rule a
 * backend invariant on EVERY save that transitions a factor into Approved, wherever it flows from
 * (UI, API, script, agent). Declarative factors (no bound Action) carry no executable code and
 * keep today's behavior.
 */

const ACTION_ENTITY = "MJ: Actions";

/**
 * Action types whose code is machine-generated (Codesmith/Runtime signals, CodeGen'd actions) and
 * therefore must pass code review before a factor bound to them may be Approved. 'Custom' actions
 * live in the codebase and are inherently trusted (they went through PR review), mirroring the
 * gate SonarBindSignalToModelAction already applies on the intended promotion path.
 */
const CODE_APPROVAL_GATED_ACTION_TYPES = ["Generated", "Runtime"] as const;

/** Builds the single message every surface shows, so the gate reads consistently. */
export function promotionGateMessage(detail: string): string {
    return (
        "PromotionState cannot be set to Approved: the bound Action's code is not approved — " +
        detail
    );
}

/**
 * Pure decision: is this save a transition INTO PromotionState = 'Approved'? Covers both a new
 * row born Approved and an existing row whose PromotionState field is dirty and now Approved.
 * Extracted as a pure function (no entity / no DB) so the rule is unit-testable in isolation.
 */
export function isPromotionApprovalTransition(opts: {
    isSaved: boolean;
    promotionState: string | null;
    promotionStateDirty: boolean;
    previousPromotionState: string | null;
}): boolean {
    if (opts.promotionState !== "Approved") {
        return false;
    }
    if (!opts.isSaved) {
        return true; // new record created directly as Approved
    }
    return opts.promotionStateDirty && opts.previousPromotionState !== "Approved";
}

/** The minimal Action shape the gate reasons over (a projection of MJ: Actions). */
export interface BoundActionApprovalRow {
    Name: string | null;
    Type: string;
    CodeApprovalStatus: string | null;
    CodeApprovedByUserID: string | null;
}

/**
 * Three-valued gate state, mirroring publishLock's ModelLockState. `unknown` means the Action
 * query FAILED (couldn't read), distinct from a confirmed `blocked` (read it, and it fails the
 * rule). The hard Save path fails CLOSED on `unknown`; ValidateAsync's friendly message fails
 * OPEN — same query-error posture as publishLock.ts.
 */
export type BoundActionApprovalState =
    | { state: "approved" }
    | { state: "blocked"; message: string }
    | { state: "unknown" };

/**
 * Pure decision over a loaded Action row: may a factor bound to this Action be Approved?
 *  - Codebase ('Custom') actions pass — their code shipped through source review.
 *  - 'Generated'/'Runtime' actions require CodeApprovalStatus === 'Approved'.
 *  - Separation of duties (approver ≠ author): MJ: Actions carries CodeApprovedByUserID but NO
 *    author/owner user field (verified against the 6.1 generated entity shape), so the
 *    author-vs-approver comparison is not determinable here and is deliberately skipped rather
 *    than guessed. If MJ core ever adds an author field, compare it to CodeApprovedByUserID.
 */
export function evaluateBoundActionApproval(
    action: BoundActionApprovalRow,
): { state: "approved" } | { state: "blocked"; message: string } {
    const gated = (CODE_APPROVAL_GATED_ACTION_TYPES as readonly string[]).includes(action.Type);
    if (!gated) {
        return { state: "approved" };
    }
    if (action.CodeApprovalStatus !== "Approved") {
        const name = action.Name ?? "(unnamed)";
        return {
            state: "blocked",
            message: promotionGateMessage(
                `Action '${name}' (${action.Type}) has CodeApprovalStatus ` +
                    `'${action.CodeApprovalStatus ?? "none"}'. Review and approve its code ` +
                    "before promoting this factor.",
            ),
        };
    }
    return { state: "approved" };
}

/**
 * Resolve the bound Action's approval state via a lightweight projection query (no full hydrate),
 * using the caller's context user. A missing Action is `blocked` (we can confirm there is nothing
 * approvable to execute); a FAILED query is `unknown` — the caller decides the posture.
 */
export async function boundActionApprovalState(
    actionId: string,
    contextUser?: UserInfo,
): Promise<BoundActionApprovalState> {
    const rv = new RunView();
    const result = await rv.RunView<BoundActionApprovalRow>(
        {
            EntityName: ACTION_ENTITY,
            ExtraFilter: `ID='${actionId}'`,
            Fields: ["Name", "Type", "CodeApprovalStatus", "CodeApprovedByUserID"],
            MaxRows: 1,
            ResultType: "simple",
        },
        contextUser,
    );
    if (!result.Success) {
        return { state: "unknown" }; // query failed — caller decides how to treat the uncertainty
    }
    const action = result.Results?.[0];
    if (!action) {
        return {
            state: "blocked",
            message: promotionGateMessage(
                `the bound Action ('${actionId}') could not be found, so its code approval ` +
                    "cannot be verified.",
            ),
        };
    }
    return evaluateBoundActionApproval(action);
}

/**
 * Hard-block the save: log it, surface the gate message on the entity's result (so the caller
 * sees a reason, not a bare false), and return false. Used by the Save() OVERRIDE — unlike a
 * ValidateAsync-only check, this can't be bypassed with SkipAsyncValidation, which is exactly the
 * escape hatch a script/API/agent (the threat model) would use.
 */
export function failPromotionGate(entity: BaseEntity, message: string, op: "create" | "update"): false {
    LogError(`${entity.EntityInfo?.Name ?? "entity"}: blocked ${op} — ${message}`);
    entity.RegisterResultHistoryEntry(new BaseEntityResult(false, message, op));
    return false;
}

/** Mark a validation result failed with the promotion-gate error on PromotionState. */
export function appendPromotionGateFailure(result: ValidationResult, message: string): void {
    result.Success = false;
    result.Errors.push(
        new ValidationErrorInfo("PromotionState", message, null, ValidationErrorType.Failure),
    );
}
