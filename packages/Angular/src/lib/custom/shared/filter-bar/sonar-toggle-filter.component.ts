import { Component, computed, input, output } from "@angular/core";

/** One side of a two-state toggle. */
export interface SonarToggleOption { value: string; label: string; title?: string; }

/**
 * SonarToggleFilter — a two-state choice, rendered as a segmented control with BOTH sides visible.
 *
 * It used to be a single flip button showing only the current side, which had two problems: you could
 * not tell there was another option without clicking it, and a lone pill was the last control in the
 * Movers rule pane that didn't belong to the shared control language (one height, one radius, the
 * `.sonar-segmented` idiom the mode switch beside it already uses).
 *
 * The public API is unchanged — `[on]` / `[off]` / `[value]` / `(valueChange)` — so call sites need no
 * edits, and `current()` is kept for any consumer reading it.
 */
@Component({
    standalone: false,
    selector: "sonar-toggle-filter",
    template: `
        <div class="sonar-segmented sonar-toggle" role="radiogroup" [attr.aria-label]="ariaLabel()">
            @for (side of sides(); track side.value) {
                <button type="button" class="sonar-segmented__opt"
                        [class.sonar-segmented__opt--active]="side.value === value()"
                        role="radio" [attr.aria-checked]="side.value === value()"
                        [title]="side.title || ''"
                        (click)="pick(side.value)">{{ side.label }}</button>
            }
        </div>
    `,
    styles: [`
        .sonar-toggle { white-space: nowrap; }
        /* The option height is set HERE, not by the consuming pane: emulated encapsulation stops a
           parent stylesheet reaching a child component's internals, so a rule out there silently
           leaves these at their default 35px while every other control in the pane is 36px. */
        /* The CONTAINER owns the control height, and the options fill it. sonar-shell gives
           .sonar-segmented 0.25rem of padding, which left this control 46px tall beside an otherwise
           identical 36px one — and a consuming pane cannot correct it, because emulated encapsulation
           blocks a parent stylesheet from reaching in here. */
        .sonar-toggle { height: var(--sonar-ctl-h, 2.25rem); box-sizing: border-box; padding: 2px; gap: 2px; }
        .sonar-segmented__opt {
            height: 100%; box-sizing: border-box;
            flex: 1 1 0%; min-width: 0; justify-content: center; white-space: nowrap;
        }
        /* Fill the space it is given, so it matches any segmented control beside it rather than
           hugging its labels. */
        :host, .sonar-toggle { width: 100%; }
        /* sonar-shell.css puts height:100% on every component host; inside a filter row that stretches
           this control to the row's height and leaves it floating in dead space. */
        :host { height: auto; display: flex; }
    `],
    styleUrls: ["../styles/sonar-shell.css"],
})
export class SonarToggleFilterComponent {
    public readonly value = input<string>("");
    public readonly on = input.required<SonarToggleOption>();
    public readonly off = input.required<SonarToggleOption>();

    public readonly valueChange = output<string>();

    /** Both sides in a stable order, so the control never reorders itself as the value changes. */
    public readonly sides = computed<SonarToggleOption[]>(() => [this.on(), this.off()]);

    /** The side currently selected (on when its value matches, else off). */
    public readonly current = computed(() => (this.value() === this.on().value ? this.on() : this.off()));

    /** A group label built from the two sides, since callers don't pass one. */
    public readonly ariaLabel = computed(() => `${this.on().label} or ${this.off().label}`);

    /** Emit only on a real change, so re-clicking the active side isn't a needless reload. */
    public pick(next: string): void {
        if (next !== this.value()) this.valueChange.emit(next);
    }
}
