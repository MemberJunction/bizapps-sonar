import { Component, computed, input, output } from "@angular/core";

/** One side of a two-state toggle. */
export interface SonarToggleOption { value: string; label: string; title?: string; }

/**
 * SonarToggleFilter — a two-state toggle button (e.g. worst-first ↔ best-first). Shows the current
 * side's label; clicking flips to the other and emits its value. A bite-sized filter unit.
 */
@Component({
    standalone: false,
    selector: "sonar-toggle-filter",
    template: `<button type="button" class="sonar-btn sonar-toggle" [title]="current().title || ''" (click)="flip()">{{ current().label }}</button>`,
    styles: [`.sonar-toggle { white-space: nowrap; }`],
    styleUrls: ["../styles/sonar-shell.css"],
})
export class SonarToggleFilterComponent {
    public readonly value = input<string>("");
    public readonly on = input.required<SonarToggleOption>();
    public readonly off = input.required<SonarToggleOption>();

    public readonly valueChange = output<string>();

    /** The side currently shown (on when its value matches, else off). */
    public readonly current = computed(() => (this.value() === this.on().value ? this.on() : this.off()));

    /** Flip to the other side and emit its value. */
    public flip(): void {
        this.valueChange.emit(this.value() === this.on().value ? this.off().value : this.on().value);
    }
}
