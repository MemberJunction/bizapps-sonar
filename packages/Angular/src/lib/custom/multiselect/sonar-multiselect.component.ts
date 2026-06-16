import { Component, computed, input, output, signal } from "@angular/core";

/** An option the user can pick. */
export interface MultiselectOption { id: string; name: string; }

/**
 * Reusable multi-select with search + chips. Composes the MJ searchable combobox (to add)
 * with removable chips (the current selections) — the pattern MJ's UI kit doesn't ship as a
 * single component. Drop in anywhere a multi-select over a long list is needed.
 *
 * Unidirectional + signal-based: parent passes `[selected]` (an array of ids) and listens to
 * `(selectedChange)`. The combobox only ever offers options not already chosen, and clears
 * after each pick so you can keep adding.
 */
@Component({
    standalone: false,
    selector: "sonar-multiselect",
    templateUrl: "./sonar-multiselect.component.html",
    styleUrls: ["../sonar-shell.css", "./sonar-multiselect.component.css"],
})
export class SonarMultiselectComponent {
    public readonly data = input<MultiselectOption[]>([]);
    public readonly selected = input<string[]>([]);
    public readonly placeholder = input("Search…");
    public readonly selectedChange = output<string[]>();

    /** Transient combobox value. */
    public readonly pick = signal<string | null>(null);
    /** Bumped after each pick to recreate the combobox so its search box clears (the
     *  combobox re-sets its own display text on select, so resetting the value can't win). */
    public readonly epoch = signal(0);

    /** Options not already chosen — the combobox only offers these. */
    public readonly available = computed(() => {
        const chosen = new Set(this.selected());
        return this.data().filter((o) => !chosen.has(o.id));
    });

    /** Current selections resolved to {id, name} for the chips. */
    public readonly chips = computed(() => {
        const byId = new Map(this.data().map((o) => [o.id, o.name]));
        return this.selected().map((id) => ({ id, name: byId.get(id) ?? id }));
    });

    public onPick(value: unknown): void {
        const id = typeof value === "string" ? value : null;
        if (id && !this.selected().includes(id)) {
            this.selectedChange.emit([...this.selected(), id]);
        }
        this.pick.set(null);
        this.epoch.update((e) => e + 1); // recreate the combobox → fresh, empty search box
    }

    public remove(id: string): void {
        this.selectedChange.emit(this.selected().filter((x) => x !== id));
    }
}
