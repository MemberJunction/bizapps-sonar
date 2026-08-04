import {
    Component, computed, DestroyRef, effect, ElementRef, inject, input, output, signal, viewChild,
} from "@angular/core";

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
 * One piece of a rendered condition sentence. Split rather than concatenated so the template can give
 * the VALUE its own emphasis without any HTML injection: `kind` picks the class, Angular escapes the text.
 */
export interface SentencePart {
    text: string;
    kind: "text" | "value" | "blank";
}

/** A field/operator pair a person could pick, with the sentence it would read as. */
interface Candidate {
    field: MemberField;
    choice: OperatorChoice;
    /** The lowercased words of the sentence's fixed part, for matching. */
    words: string[];
}

/**
 * One row of the list. Two kinds, because the list works in two stages:
 *
 * - a **field** row, offered while it is still ambiguous WHICH field you mean. Taking one does not add a
 *   condition; it narrows the query so the field's own tests appear.
 * - a **condition** row, a complete and committable condition.
 *
 * Named MemberFilterRow, not MemberSuggestion: `score-read.service.ts` already exports a `MemberSuggestion`
 * for member-name search, and the Engagement Manager imports that one.
 */
export type MemberFilterRow =
    | {
        kind: "field";
        field: MemberField;
        /** "date" / "number" / "text" — says which tests you are about to be offered. */
        typeLabel: string;
    }
    | {
        kind: "condition";
        condition: MemberCondition;
        parts: SentencePart[];
        /** True when the operator takes a value and the query has not supplied one yet. */
        needsValue: boolean;
        /** What to ask for when it does: "a number of days". Drives the list's caption. */
        valueWord: string;
    };

/** What a field's kind is called in the field list, so you can tell what tests are coming. */
const TYPE_LABEL: Record<MemberFieldKind, string> = {
    date: "date",
    number: "number",
    text: "text",
    boolean: "yes/no",
};

/** What each kind of value input is called when we have to ask for one out loud. */
const VALUE_WORD: Record<OperatorChoice["input"], string> = {
    days: "a number of days",
    number: "a number",
    text: "a value",
    list: "one or more values, comma separated",
    none: "",
};

/** What the empty slot is labelled with, so a blank reads as a blank to fill rather than an ellipsis. */
const SLOT_WORD: Record<OperatorChoice["input"], string> = {
    days: "days",
    number: "number",
    text: "value",
    list: "values",
    none: "",
};

/** Suggestion rows shown at once. Enough to see a field's whole operator set, short enough to scan. */
const MAX_SUGGESTIONS = 7;

/** Where the floating list sits, in viewport coordinates. */
interface PopPlacement {
    left: string;
    width: string;
    top?: string;
    bottom?: string;
    maxHeight: string;
}

/** Gap between the box and its list, and the margin kept off the viewport edge. Both in px. */
const POP_GAP = 6;
const VIEWPORT_MARGIN = 12;

/**
 * Build conditions on the MEMBER RECORD, in plain language.
 *
 * A type-to-filter token bar: chips for the active conditions, one box to add another. Typing narrows a
 * list of complete, ready-to-commit conditions; Enter takes the highlighted one.
 *
 * ## Why it works by enumerating instead of parsing
 *
 * The obvious build is a parser: read what was typed and try to work out which condition was meant. That
 * is where typeaheads rot — malformed input, ambiguity, and a grammar nobody documented.
 *
 * So this goes the other way. {@link candidates} is the CROSS PRODUCT of the anchor entity's fields and
 * the operators valid for each one (~20 x ~6, small enough to filter on every keystroke), and each one is
 * rendered through {@link describeParts} — the same function that paints the chips. Matching happens on
 * those sentences. Two things fall out for free:
 *
 * - A suggestion row IS a `MemberCondition`, so committing is an array push. Nothing to parse, nothing to
 *   validate, no malformed-input state to design.
 * - Suggestion text and chip text cannot drift, because one function writes both.
 *
 * The one thing the cross product cannot enumerate is a VALUE (no way to pre-list every number). See
 * {@link rows} for how a trailing token becomes one, and note the guard: a row whose value slot is
 * still empty will not commit. Enter parks the cursor in the box instead, which is the same protection the
 * old popover's disabled Add button gave.
 *
 * Unidirectional and signal-based, like {@link SonarMultiselectComponent}: the parent owns the conditions
 * array and listens for changes.
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
    /** Narrow-column mode: stacks the row and drops the redundant label. An explicit input rather than the
     *  parent reaching in with CSS — emulated encapsulation blocks a parent styling a child's internals,
     *  so those rules silently did nothing. */
    public readonly dense = input(false);
    public readonly conditionsChange = output<MemberCondition[]>();

    private readonly box = viewChild<ElementRef<HTMLInputElement>>("box");

    /** What has been typed. The only draft state there is now. */
    public readonly query = signal("");
    /** Whether the box has focus, which is what opens the list. */
    public readonly open = signal(false);
    /** Arrow-key cursor into {@link rows}. */
    public readonly highlighted = signal(0);

    /** Operators per field kind, phrased the way the question is asked out loud. The FIRST entry for a kind
     *  is what an unqualified query offers, so it is the question people most often come to ask. */
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

    /** Every condition the current fields allow. Rebuilt only when the field list changes. */
    private readonly candidates = computed<Candidate[]>(() => {
        const out: Candidate[] = [];
        for (const field of this.fields()) {
            for (const choice of SonarMemberFilterComponent.OPERATORS[field.kind]) {
                out.push({ field, choice, words: `${field.label} ${choice.label}`.toLowerCase().split(/\s+/) });
            }
        }
        return out;
    });

    /**
     * The rows to show, resolved in two stages.
     *
     * ## Why two stages
     *
     * The list used to be the raw field x operator cross product capped at {@link MAX_SUGGESTIONS}. On a
     * 12-field entity that showed **two fields**: date fields carry five operators each, so `5 + 2 = 7`
     * filled the list with Join Date and Last Activity Date and buried the other ten with no scrollbar and
     * no "more" marker. Anyone opening the box concluded it only filtered on dates — which quietly wrecked
     * the whole reason this beats a typed syntax, namely that you can SEE what is askable.
     *
     * So while it is still ambiguous which field you mean, the rows are FIELDS, one each, uncapped and
     * scrollable. Once the query narrows to a single field, the rows become that field's conditions.
     *
     * The fast path costs nothing: "joined 90" resolves to one field immediately, so the conditions appear
     * on the first keystroke that disambiguates and Enter still commits in one interaction.
     *
     * ## The matching, unchanged
     *
     * Split the query at the last word and work backwards: leading words find a field, anything left over
     * is the value. Trying the longest field-part FIRST is what lets "join date is within the last 30"
     * resolve back to its own operator, which is what makes chip editing round-trip.
     */
    public readonly rows = computed<MemberFilterRow[]>(() => {
        const all = this.candidates();
        const raw = this.query().trim();
        // Nothing typed: the plain field list. This is the state that used to lie about what exists.
        if (!raw) return this.fields().map((f) => this.fieldRow(f));

        const typed = raw.toLowerCase().split(/\s+/);
        const rawWords = raw.split(/\s+/);
        for (let cut = typed.length; cut >= 1; cut--) {
            const fieldWords = typed.slice(0, cut);
            const hits = all.filter((c) => fieldWords.every((w) => wordHit(w, c.words)));
            if (hits.length === 0) continue;

            const value = rawWords.slice(cut).join(" ");
            const named = new Set(hits.map((h) => h.field.name));
            // Still more than one field in play, and no value committed to yet: pick the field first.
            // Once a value IS typed, showing fields would throw it away, so conditions win.
            if (named.size > 1 && !value) {
                return this.fields().filter((f) => named.has(f.name)).map((f) => this.fieldRow(f));
            }
            // A typed value is meaningless for the null tests, so they drop out once there is one.
            return hits
                .filter((c) => !value || c.choice.input !== "none")
                .slice(0, MAX_SUGGESTIONS)
                .map((c) => this.toSuggestion(c, value));
        }
        return [];
    });

    /** Each active condition as a readable sentence, for the chips. */
    public readonly chips = computed(() =>
        this.conditions().map((c, index) => ({ index, parts: this.describeParts(c), text: this.describe(c) })),
    );

    /**
     * The line above the list, which always names the NEXT thing to type.
     *
     * This exists because the old three-box popover taught you its grammar for free — Field, then Test,
     * then Value, each labelled. A bare text box teaches nothing: you cannot tell that a field name comes
     * first, and once you have typed one you cannot tell that the value goes after a space. So the list
     * says so, and it says it at the moment the answer is needed rather than as a wall of help text.
     */
    public readonly caption = computed<string>(() => {
        const rows = this.rows();
        if (rows.length === 0) return "";
        const row = rows[this.highlighted()] ?? rows[0];
        if (row.kind === "field") {
            return this.query().trim()
                ? "Enter picks the field · keep typing to narrow"
                : "Pick a field, or type to narrow";
        }
        if (row.needsValue) return `Now type ${row.valueWord}`;
        return rows.length > 1 ? "Enter adds it · ↓ for the other tests" : "Enter adds it";
    });

    /**
     * Viewport-fixed placement for the list.
     *
     * It has to be `fixed`, not `absolute`: the rule pane this control sits in is a scroll container with
     * `overflow-x: hidden`, so an absolutely-positioned list gets guillotined on BOTH axes — cut off at the
     * pane's bottom edge and again at its right edge. Fixed escapes the pane, at the cost of having to
     * re-place on scroll, which is what {@link place} is for.
     */
    public readonly popPlacement = signal<PopPlacement | null>(null);

    public constructor() {
        // Keep the cursor inside the list when the list shrinks under it.
        effect(() => {
            const max = this.rows().length - 1;
            if (this.highlighted() > max) this.highlighted.set(Math.max(0, max));
        });
        // Opening, or a query that changes the row count, changes where the list should sit.
        effect(() => {
            if (this.open() && this.rows().length >= 0) this.place();
        });

        // Scroll does not bubble, but it DOES fire on window in the capture phase, which is the only way
        // to hear the rule pane scrolling underneath us.
        const replace = (): void => {
            if (this.open()) this.place();
        };
        window.addEventListener("scroll", replace, true);
        window.addEventListener("resize", replace);
        inject(DestroyRef).onDestroy(() => {
            window.removeEventListener("scroll", replace, true);
            window.removeEventListener("resize", replace);
        });
    }

    /**
     * Put the list on whichever side of the box has more room, and cap its height to that room so a long
     * list scrolls itself instead of running off the screen. Measuring the available space rather than the
     * content means there is nothing to measure after render, so no second layout pass.
     */
    private place(): void {
        const el = this.box()?.nativeElement;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const bar = el.parentElement?.getBoundingClientRect() ?? r;
        const below = window.innerHeight - bar.bottom - POP_GAP - VIEWPORT_MARGIN;
        const above = bar.top - POP_GAP - VIEWPORT_MARGIN;
        const dropUp = below < above;
        const room = Math.max(dropUp ? above : below, 0);

        // Never wider than the viewport allows, and at least as wide as the box it hangs off.
        const width = Math.min(352, Math.max(bar.width, window.innerWidth - 2 * VIEWPORT_MARGIN));
        const left = Math.max(
            VIEWPORT_MARGIN,
            Math.min(bar.left, window.innerWidth - width - VIEWPORT_MARGIN),
        );

        this.popPlacement.set({
            left: `${Math.round(left)}px`,
            width: `${Math.round(width)}px`,
            maxHeight: `${Math.round(Math.min(room, 288))}px`,
            ...(dropUp
                ? { bottom: `${Math.round(window.innerHeight - bar.top + POP_GAP)}px` }
                : { top: `${Math.round(bar.bottom + POP_GAP)}px` }),
        });
    }

    // ── typing ──────────────────────────────────────────────────────────────────────────────────────

    public onInput(event: Event): void {
        this.query.set((event.target as HTMLInputElement).value);
        this.highlighted.set(0);
    }

    public onFocus(): void {
        this.open.set(true);
    }

    /** Closing on blur is deferred so a mousedown on a suggestion row still lands. */
    public onBlur(): void {
        setTimeout(() => this.open.set(false), 120);
    }

    public onKeydown(event: KeyboardEvent): void {
        const rows = this.rows();
        switch (event.key) {
            case "ArrowDown":
                this.open.set(true);
                this.highlighted.set(Math.min(this.highlighted() + 1, rows.length - 1));
                event.preventDefault();
                break;
            case "ArrowUp":
                this.highlighted.set(Math.max(this.highlighted() - 1, 0));
                event.preventDefault();
                break;
            case "Enter":
                this.commit(this.highlighted());
                event.preventDefault();
                break;
            case "Escape":
                // Clear the draft if there is one, otherwise get out of the way.
                if (this.query()) this.query.set("");
                else this.open.set(false);
                break;
            case "Backspace":
                // The token-bar convention: an empty box eats the last chip.
                if (!this.query() && this.conditions().length > 0) {
                    this.conditionsChange.emit(this.conditions().slice(0, -1));
                    event.preventDefault();
                }
                break;
            default:
                break;
        }
    }

    // ── committing ──────────────────────────────────────────────────────────────────────────────────

    /**
     * Take a row.
     *
     * A FIELD row narrows rather than commits: it rewrites the query as that field's label so the next pass
     * resolves to one field and offers its tests. A CONDITION row still missing its value does not commit
     * either — it puts the cursor back in the box with a trailing space so the next thing typed lands in the
     * slot. That is the same guard the old disabled Add button gave, without a button.
     */
    public commit(index: number): void {
        const row = this.rows()[index];
        if (!row) return;
        if (row.kind === "field") {
            this.query.set(`${row.field.label} `);
            this.highlighted.set(0);
            this.focusBox();
            return;
        }
        if (row.needsValue) {
            const raw = this.query().trim();
            this.query.set(raw ? `${raw} ` : raw);
            this.focusBox();
            return;
        }
        this.conditionsChange.emit([...this.conditions(), row.condition]);
        this.query.set("");
        this.highlighted.set(0);
        this.focusBox();
    }

    /**
     * Editing is retyping: load the chip's own sentence back into the box and drop the chip. The full
     * sentence goes back (not just field + value) so the OPERATOR survives the round trip — "Join Date is
     * within the last 30" re-resolves to withinLastDays, where a bare "Join Date 30" would silently fall
     * back to the field's default operator.
     */
    public edit(index: number): void {
        const condition = this.conditions()[index];
        if (!condition) return;
        this.conditionsChange.emit(this.conditions().filter((_, i) => i !== index));
        this.query.set(this.reconstructQuery(condition));
        this.highlighted.set(0);
        this.open.set(true);
        this.focusBox();
    }

    public remove(index: number): void {
        this.conditionsChange.emit(this.conditions().filter((_, i) => i !== index));
    }

    public clearAll(): void {
        if (this.conditions().length > 0) this.conditionsChange.emit([]);
    }

    public focusBox(): void {
        this.box()?.nativeElement.focus();
    }

    // ── rendering ───────────────────────────────────────────────────────────────────────────────────

    /**
     * Turn a condition into sentence parts. The single source of truth for how a condition reads: chips,
     * suggestion rows and the query reconstruction all come through here, so they cannot disagree.
     */
    public describeParts(c: MemberCondition): SentencePart[] {
        const field = this.fields().find((f) => f.name === c.field);
        const label = field?.label ?? c.field;
        const choice = field
            ? SonarMemberFilterComponent.OPERATORS[field.kind].find((o) => o.op === c.op)
            : undefined;
        // An unknown field or operator still has to render something honest rather than vanish.
        if (!choice) return [{ text: `${label} ${c.op} ${String(c.value ?? "")}`.trim(), kind: "text" }];
        return this.partsFor(label, choice, c.value);
    }

    /** The flattened sentence, for tooltips and aria labels. */
    public describe(c: MemberCondition): string {
        return this.describeParts(c).map((p) => p.text).join("");
    }

    private partsFor(
        label: string,
        choice: OperatorChoice,
        value: MemberCondition["value"],
    ): SentencePart[] {
        const head = `${label} ${choice.label}`;
        if (choice.input === "none") return [{ text: head, kind: "text" }];

        const present = value !== "" && value !== null && value !== undefined
            && !(Array.isArray(value) && value.length === 0);
        // A NAMED slot, not an ellipsis: "is more than [days]" says what is missing and that it is missing,
        // where "is more than …" only says something trails off.
        if (!present) return [{ text: `${head} `, kind: "text" }, { text: SLOT_WORD[choice.input], kind: "blank" }];

        if (choice.input === "days") {
            const span = humanizeDays(Number(value));
            const parts: SentencePart[] = [
                { text: `${head} `, kind: "text" },
                { text: span, kind: "value" },
            ];
            // "ago" belongs to olderThanDays alone. The window operators carry their own direction in the
            // words "last" and "next", so tacking it on gave "is within the last 3 months ago".
            if (choice.op === "olderThanDays") parts.push({ text: " ago", kind: "text" });
            return parts;
        }
        const shown = Array.isArray(value) ? value.join(", ") : String(value);
        return [{ text: `${head} `, kind: "text" }, { text: shown, kind: "value" }];
    }

    /** A candidate plus a typed value, as a committable row. */
    private toSuggestion(c: Candidate, value: string): MemberFilterRow {
        const needsValue = c.choice.input !== "none" && value.trim().length === 0;
        return {
            kind: "condition",
            condition: conditionFor(c.field.name, c.choice, value),
            parts: this.partsFor(c.field.label, c.choice, needsValue ? null : coerce(c.choice, value)),
            needsValue,
            valueWord: VALUE_WORD[c.choice.input],
        };
    }

    /** One field, offered before it is clear which one you mean. */
    private fieldRow(field: MemberField): MemberFilterRow {
        return { kind: "field", field, typeLabel: TYPE_LABEL[field.kind] };
    }

    /** The words that would re-suggest this exact condition. Inverse of the matching in {@link rows}. */
    private reconstructQuery(c: MemberCondition): string {
        const field = this.fields().find((f) => f.name === c.field);
        const choice = field
            ? SonarMemberFilterComponent.OPERATORS[field.kind].find((o) => o.op === c.op)
            : undefined;
        if (!field || !choice) return "";
        const head = `${field.label} ${choice.label}`;
        if (choice.input === "none") return head;
        const value = Array.isArray(c.value) ? c.value.join(", ") : String(c.value ?? "");
        return value ? `${head} ${value}` : `${head} `;
    }
}

/** The typed value in the shape the engine expects. */
function coerce(choice: OperatorChoice, raw: string): MemberCondition["value"] {
    const text = raw.trim();
    if (choice.input === "list") return text.split(",").map((s) => s.trim()).filter(Boolean);
    if (choice.input === "number" || choice.input === "days") return Number(text);
    return text;
}

function conditionFor(field: string, choice: OperatorChoice, raw: string): MemberCondition {
    if (choice.input === "none") return { field, op: choice.op };
    return { field, op: choice.op, value: coerce(choice, raw) };
}

/**
 * Does a typed word match any word of a candidate's sentence?
 *
 * Deliberately dumb: a prefix either way, no fuzzy scoring. `"ti"` finds "Tier" (typed is a prefix of the
 * word) and `"joined"` finds "Join Date" (the word is a prefix of typed — the 3-char floor stops "is" and
 * "of" from matching everything). Fuzzy ranking is where a typeahead starts guessing wrong, and a filter
 * that decides who gets contacted is the wrong place to guess.
 */
function wordHit(typed: string, words: string[]): boolean {
    return words.some((w) => w.startsWith(typed) || (w.length >= 3 && typed.startsWith(w)));
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
