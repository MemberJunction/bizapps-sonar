import { BaseAction } from "@memberjunction/actions";
import { RegisterClass } from "@memberjunction/global";
import { RunView, UserInfo } from "@memberjunction/core";
import {
    SonarFactorAction,
    FactorActionContract,
    FactorComputeContext,
    FactorValue,
    registerFactorAction,
} from "./SonarFactorAction";

/**
 * The activity source this signal reads — **baked in, not a config param**. Per the foot-down rule
 * (action-factors.md §11/§12): an action OWNS its data source; the author doesn't point it at a
 * table. The earlier version exposed ActivityEntity/MemberField/DateField as params — that made it a
 * configurable query, not a named signal. It now reads event registrations, full stop, and declares
 * so via `contract.reads`.
 */
const ACTIVITY_ENTITY = "Event Registrations__AssociationDemo";
const MEMBER_FIELD = "MemberID";
const DATE_FIELD = "RegistrationDate";

/**
 * Sonar: Member Activity Streak — the reference Action-backed factor (plans/action-factors.md §8,
 * tier 2: deterministic, DB-only, NOT expressible as a single declarative aggregate). For one anchor
 * record, returns the **current consecutive-month streak**: how many months in an unbroken run ending
 * at the AsOf month had ≥1 event registration. A gap resets it; no activity in the AsOf month → 0.
 * It's genuine gap analysis over a per-member time series — beyond COUNT/SUM/Recency.
 *
 * Now built on SonarFactorAction: it declares a `contract` (so the builder shows what it does) and
 * implements `computeValue`; the base handles all the I/O plumbing.
 */
@RegisterClass(BaseAction, "SonarMemberActivityStreak")
export class SonarMemberActivityStreakAction extends SonarFactorAction {
    public readonly contract: FactorActionContract = {
        measures:
            "Current consecutive-month activity streak — the unbroken run of months (ending at the " +
            "as-of month) in which the member had at least one event registration.",
        reads: ["Event Registrations"],
        output: { unit: "months", min: 0, higherIsBetter: true, sample: 3 },
        cost: { deterministic: true, externalCalls: false, expensive: false },
    };

    protected async computeValue(ctx: FactorComputeContext): Promise<FactorValue> {
        const dates = await this.loadActivityDates(ctx.anchorRecordID, ctx.asOf, ctx.contextUser);
        const streak = this.currentMonthStreak(dates, ctx.asOf);
        return {
            value: streak,
            explanation:
                streak === 0
                    ? `No event activity in ${this.monthKey(ctx.asOf)} — streak 0.`
                    : `${streak} consecutive month(s) of event activity through ${this.monthKey(ctx.asOf)}.`,
        };
    }

    /** Load the member's event-registration dates up to AsOf (read-only, via RunView — no raw SQL).
     *  Source entity/columns are the baked-in constants; anchorId is GUID-validated by the base. */
    private async loadActivityDates(
        anchorId: string,
        asOf: Date,
        contextUser?: UserInfo,
    ): Promise<Date[]> {
        const result = await new RunView().RunView<Record<string, string>>(
            {
                EntityName: ACTIVITY_ENTITY,
                ExtraFilter: `[${MEMBER_FIELD}]='${anchorId}' AND [${DATE_FIELD}] <= '${asOf.toISOString()}'`,
                Fields: [DATE_FIELD],
                ResultType: "simple",
            },
            contextUser,
        );
        if (!result.Success) {
            throw new Error(`activity query failed: ${result.ErrorMessage}`);
        }
        return (result.Results ?? [])
            .map((r) => new Date(r[DATE_FIELD]))
            .filter((d) => !Number.isNaN(d.getTime()));
    }

    /** Count consecutive months (ending at AsOf's month) that each had ≥1 activity date. */
    private currentMonthStreak(dates: Date[], asOf: Date): number {
        const months = new Set(dates.map((d) => this.monthKey(d)));
        let streak = 0;
        const cursor = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), 1));
        while (months.has(this.monthKey(cursor))) {
            streak++;
            cursor.setUTCMonth(cursor.getUTCMonth() - 1);
        }
        return streak;
    }

    /** "YYYY-MM" key for a date (UTC), used to bucket activity by month. */
    private monthKey(d: Date): string {
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    }
}

// Self-register so the describe-endpoint can list this factor-action + its contract. The key MUST
// match both the @RegisterClass key above and the MJ Action record's DriverClass.
registerFactorAction("SonarMemberActivityStreak", new SonarMemberActivityStreakAction().contract);
