import { ActionResultSimple, RunActionParams, ActionParam } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { RegisterClass } from "@memberjunction/global";
import { RunView } from "@memberjunction/core";

/**
 * Sonar: Member Activity Streak — the first reference Action-backed factor (plans/action-factors.md
 * tier 2: deterministic, DB-only, NOT expressible as a single declarative aggregate). For one anchor
 * record, returns the **current consecutive-month streak**: how many months in an unbroken run ending
 * at the AsOf month had ≥1 activity row. (A gap resets it; no activity in the AsOf month → 0.) This is
 * genuinely beyond the declarative engine — it's gap analysis over a per-member time series, not a
 * COUNT/SUM/Recency.
 *
 * I/O contract (matches the engine's ActionFactorEvaluator defaults — see action-factors.md §3):
 *   Inputs:  AnchorRecordID (the member id, injected by the engine), AsOf (ISO date, injected),
 *            and static config: ActivityEntity / MemberField / DateField (the activity source).
 *   Output:  Value (number) — the streak, read by the engine as the factor's raw value.
 *
 * Read-only. Per-record failures surface as a failed ActionResult (the engine treats that anchor as
 * no-data and continues).
 */
@RegisterClass(BaseAction, "SonarMemberActivityStreak")
export class SonarMemberActivityStreakAction extends BaseAction {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const anchorId = this.getInput(params, "AnchorRecordID");
        if (!anchorId || !this.isGuid(anchorId)) {
            return this.fail(params, "VALIDATION_ERROR", "AnchorRecordID is required and must be a GUID.");
        }
        const asOf = this.parseAsOf(this.getInput(params, "AsOf"));
        if (!asOf) {
            return this.fail(params, "VALIDATION_ERROR", "AsOf must be a valid date.");
        }
        // Static config (operator-set via the factor's ActionParamsJSON). Defaults target the cheese
        // demo's event registrations so the action runs out-of-the-box on AssociationDemo.
        const activityEntity = this.getInput(params, "ActivityEntity") ?? "Event Registrations__AssociationDemo";
        const memberField = this.getInput(params, "MemberField") ?? "MemberID";
        const dateField = this.getInput(params, "DateField") ?? "RegistrationDate";
        if (!this.isColumnIdentifier(memberField) || !this.isColumnIdentifier(dateField)) {
            return this.fail(params, "VALIDATION_ERROR", "MemberField / DateField must be simple column identifiers.");
        }

        try {
            const dates = await this.loadActivityDates(
                activityEntity,
                memberField,
                dateField,
                anchorId,
                asOf,
                params,
            );
            const streak = this.currentMonthStreak(dates, asOf);
            // UPDATE the existing output param in place — don't append a duplicate. The engine
            // pre-passes a "Value" output (null); appending a second one would leave the reader
            // finding the null first.
            this.setOutput(params, "Value", streak);
            return {
                Success: true,
                ResultCode: "SUCCESS",
                Message: `Current activity streak: ${streak} month(s).`,
                Params: params.Params,
            };
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    /** Load the member's activity dates up to AsOf (read-only, via RunView — no raw SQL). */
    private async loadActivityDates(
        activityEntity: string,
        memberField: string,
        dateField: string,
        anchorId: string,
        asOf: Date,
        params: RunActionParams,
    ): Promise<Date[]> {
        const rv = new RunView();
        const result = await rv.RunView<Record<string, string>>(
            {
                EntityName: activityEntity,
                ExtraFilter: `[${memberField}]='${anchorId}' AND [${dateField}] <= '${asOf.toISOString()}'`,
                Fields: [dateField],
                ResultType: "simple",
            },
            params.ContextUser,
        );
        if (!result.Success) {
            throw new Error(`activity query failed: ${result.ErrorMessage}`);
        }
        return (result.Results ?? [])
            .map((r) => new Date(r[dateField]))
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

    private parseAsOf(raw: string | null): Date | null {
        const d = raw ? new Date(raw) : new Date();
        return Number.isNaN(d.getTime()) ? null : d;
    }

    /** Set an output param's value in place (Type 'Both' so it round-trips), or add it if absent. */
    private setOutput(params: RunActionParams, name: string, value: number): void {
        const existing = params.Params.find((x: ActionParam) => x.Name === name);
        if (existing) {
            existing.Value = value;
            existing.Type = "Both";
        } else {
            params.Params.push({ Name: name, Value: value, Type: "Both" });
        }
    }

    /** Read a single input param's value as a string (null when absent/empty). */
    private getInput(params: RunActionParams, name: string): string | null {
        const p = params.Params.find((x: ActionParam) => x.Name === name);
        return p?.Value != null && p.Value !== "" ? String(p.Value) : null;
    }

    private fail(params: RunActionParams, code: string, message: string): ActionResultSimple {
        return { Success: false, ResultCode: code, Message: message, Params: params.Params };
    }

    private isGuid(v: string): boolean {
        return /^[0-9a-fA-F-]{32,36}$/.test(v);
    }

    /** A bare SQL column identifier (letters/digits/underscore) — guards the ExtraFilter interpolation. */
    private isColumnIdentifier(v: string): boolean {
        return /^[A-Za-z0-9_]+$/.test(v);
    }
}
