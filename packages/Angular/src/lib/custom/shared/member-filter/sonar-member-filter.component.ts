import { Component, computed, input, output, signal } from "@angular/core";

/** The kinds of field the operator list branches on. Mirrors the engine's AnchorFieldKind. */
export type MemberFieldKind = "text" | "number" | "date" | "boolean";

/** One selectable field on the model's anchor entity. */
export interface MemberField {
    /** The real field name, which is what the engine validates and compiles. */
    name: string;
    /** What to show a person ("Join Date" rather than "JoinDate"). */
    label: string;
    kind: MemberFieldKind;
}

/** One condition, matching the engine's AnchorCondition shape exactly. */
export interface MemberCondition {
    field: string;
    op: string;
    value?: string | number | string[] | null;
}

/** An operator offered for a field kind, with the words a person would actually use. */
interface OperatorChoice {
    op: string;
    label: string;
    /** How the value is entered: 'days' for the relative-date ops, 'none' for the null tests. */
    input: "text" | "number" | "days" | "list" | "none";
}

/**
 * Build conditions on the MEMBER RECORD, in plain language.
 *
 * The engine can select on any anchor field, but a raw field/operator/value form is the kind of thing
 * only its author enjoys. So this offers the fields the model's anchor entity actually has, groups the
 * operators by what the field IS, and renders each finished condition as a sentence you can read at a
 * glance ("Joined over 1 year ago") with an × to drop it.
 *
 * Deliberately compact when unused: a single "+ Member filter" chip, growing only as conditions are
 * added, because this sits inside an already-dense targeting panel.
 *
 * Unidirectional and signal-based, like {@link SonarMultiselectComponent}: the parent owns the
 * conditions array and listens for changes.
 */
@Component({
    standalone: false,
    selector: "sonar-member-filter",
    templateUrl: "./sonar-member-filter.component.html",
    styleUrls: ["../../shared/styles/sonar-shell.css", "./sonar-member-filter.component.css"],
})
export class SonarMemberFilterComponent {
    /** Fields of the model's anchor entity, already filtered to the ones worth targeting on. */
    public readonly fields = input<MemberField[]>([]);
    public readonly conditions = input<MemberCondition[]>([]);
    /** Narrow-column mode: stacks the row, drops the redundant label, widens the popover. An explicit
     *  input rather than the parent reaching in with CSS — emulated encapsulation blocks a parent
     *  styling a child's internals, so those rules silently did nothing. */
    public readonly dense = input(false);
    public readonly conditionsChange = output<MemberCondition[]>();

    /** Whether the add-condition popover is open. */
    public readonly adding = signal(false);
    /** The in-progress condition. */
    public readonly draftField = signal<string>("");
    public readonly draftOp = signal<string>("");
    public readonly draftValue = signal<string>("");

    /** Operators per field kind, phrased the way the question is asked out loud. */
    private static readonly OPERATORS: Record<MemberFieldKind, OperatorChoice[]> = {
        date: [
            { op: "olderThanDays", label: "is more than", input: "days" },
            { op: "withinLastDays", label: "is within the last", input: "days" },
            { op: "withinNextDays", label: "is within the next", input: "days" },
            { op: "isNull", label: "is empty", input: "none" },
            { op: "isNotNull", label: "is set", input: "none" },
        ],
        number: [
            { op: "gte", label: "is at least", input: "number" },
            { op: "lte", label: "is at most", input: "number" },
            { op: "eq", label: "is", input: "number" },
            { op: "neq", label: "is not", input: "number" },
            { op: "isNull", label: "is empty", input: "none" },
            { op: "isNotNull", label: "is set", input: "none" },
        ],
        text: [
            { op: "eq", label: "is", input: "text" },
            { op: "neq", label: "is not", input: "text" },
            { op: "in", label: "is any of", input: "list" },
            { op: "notIn", label: "is none of", input: "list" },
            { op: "isNull", label: "is empty", input: "none" },
            { op: "isNotNull", label: "is set", input: "none" },
        ],
        boolean: [
            { op: "eq", label: "is", input: "text" },
        ],
    };

    /** The field currently chosen in the popover. */
    public readonly draftFieldInfo = computed<MemberField | null>(
        () => this.fields().find((f) => f.name === this.draftField()) ?? null,
    );

    /** Operators valid for the chosen field. */
    public readonly draftOperators = computed<OperatorChoice[]>(() => {
        const kind = this.draftFieldInfo()?.kind;
        return kind ? SonarMemberFilterComponent.OPERATORS[kind] : [];
    });

    /** How the value should be entered for the chosen operator. */
    public readonly draftInput = computed<OperatorChoice["input"]>(
        () => this.draftOperators().find((o) => o.op === this.draftOp())?.input ?? "none",
    );

    /** Ready to add once a field, an operator, and (when needed) a value are present. */
    public readonly canAdd = computed(() => {
        if (!this.draftFieldInfo() || !this.draftOp()) return false;
        return this.draftInput() === "none" ? true : this.draftValue().trim().length > 0;
    });

    /** Each active condition as a readable sentence, for the chips. */
    public readonly chips = computed(() =>
        this.conditions().map((c, index) => ({ index, text: this.describe(c) })),
    );

    public openAdd(): void {
        this.adding.set(true);
        const first = this.fields()[0];
        this.draftField.set(first?.name ?? "");
        this.draftOp.set(first ? SonarMemberFilterComponent.OPERATORS[first.kind][0].op : "");
        this.draftValue.set("");
    }

    public cancelAdd(): void {
        this.adding.set(false);
    }

    /** Changing the field resets the operator, since the valid set depends on the field's kind. */
    public pickField(name: string): void {
        this.draftField.set(name);
        const kind = this.fields().find((f) => f.name === name)?.kind;
        this.draftOp.set(kind ? SonarMemberFilterComponent.OPERATORS[kind][0].op : "");
        this.draftValue.set("");
    }

    public pickOp(op: string): void {
        this.draftOp.set(op);
        this.draftValue.set("");
    }

    public commit(): void {
        if (!this.canAdd()) return;
        this.conditionsChange.emit([...this.conditions(), this.draftCondition()]);
        this.adding.set(false);
    }

    public remove(index: number): void {
        this.conditionsChange.emit(this.conditions().filter((_, i) => i !== index));
    }

    public clearAll(): void {
        if (this.conditions().length > 0) this.conditionsChange.emit([]);
    }

    /** The draft as the engine's condition shape. */
    private draftCondition(): MemberCondition {
        const op = this.draftOp();
        const raw = this.draftValue().trim();
        const input = this.draftInput();
        if (input === "none") return { field: this.draftField(), op };
        if (input === "list") {
            return { field: this.draftField(), op, value: raw.split(",").map((s) => s.trim()).filter(Boolean) };
        }
        if (input === "number" || input === "days") {
            return { field: this.draftField(), op, value: Number(raw) };
        }
        return { field: this.draftField(), op, value: raw };
    }

    /** Turn a condition into the sentence shown on its chip. */
    public describe(c: MemberCondition): string {
        const field = this.fields().find((f) => f.name === c.field);
        const label = field?.label ?? c.field;
        const choice = field ? SonarMemberFilterComponent.OPERATORS[field.kind].find((o) => o.op === c.op) : undefined;
        if (!choice) return `${label} ${c.op} ${String(c.value ?? "")}`.trim();

        if (choice.input === "none") return `${label} ${choice.label}`;
        if (choice.input === "days") {
            const span = humanizeDays(Number(c.value));
            // "Join Date is more than 1 year ago" reads better with the "ago" only on past-facing ops.
            return c.op === "withinNextDays"
                ? `${label} ${choice.label} ${span}`
                : `${label} ${choice.label} ${span} ago`;
        }
        if (choice.input === "list") {
            const list = Array.isArray(c.value) ? c.value : [String(c.value ?? "")];
            return `${label} ${choice.label} ${list.join(", ")}`;
        }
        return `${label} ${choice.label} ${String(c.value ?? "")}`;
    }
}

/** Days as the span a person would say: 365 -> "1 year", 90 -> "3 months", 45 -> "45 days". */
export function humanizeDays(days: number): string {
    if (!Number.isFinite(days) || days < 0) return "?";
    if (days > 0 && days % 365 === 0) {
        const y = days / 365;
        return y === 1 ? "1 year" : `${y} years`;
    }
    if (days > 0 && days % 30 === 0) {
        const m = days / 30;
        return m === 1 ? "1 month" : `${m} months`;
    }
    if (days > 0 && days % 7 === 0) {
        const w = days / 7;
        return w === 1 ? "1 week" : `${w} weeks`;
    }
    return days === 1 ? "1 day" : `${days} days`;
}
