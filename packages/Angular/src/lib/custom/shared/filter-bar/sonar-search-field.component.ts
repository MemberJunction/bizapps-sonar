import { Component, ContentChild, TemplateRef, computed, input, output, signal } from "@angular/core";

/**
 * SonarSearchField — a self-contained search input with an async typeahead menu. The host supplies
 * `suggestions` (fetched in response to the debounced `search` output) and projects a row template
 * (`<ng-template #suggestion let-item let-active="active">`); this owns the input, menu chrome,
 * keyboard nav (↑/↓/Enter/Esc), and open/close. A bite-sized filter unit — compose it wherever.
 */
@Component({
    standalone: false,
    selector: "sonar-search-field",
    templateUrl: "./sonar-search-field.component.html",
    styleUrls: ["../styles/sonar-shell.css", "./sonar-search-field.component.css"],
})
export class SonarSearchFieldComponent {
    public readonly value = input<string>("");
    public readonly placeholder = input<string>("Search…");
    /** Typeahead suggestions (the host fetches them when `search` fires). */
    public readonly suggestions = input<readonly unknown[]>([]);
    public readonly flex = input<boolean>(true);

    /** The text changed (every keystroke). */
    public readonly valueChange = output<string>();
    /** The query changed, debounced — the host fetches suggestions in response. */
    public readonly search = output<string>();
    /** A suggestion was chosen. */
    public readonly pick = output<unknown>();

    /** Host-projected row template (context: $implicit = item, active = boolean). */
    @ContentChild("suggestion") public suggestionTpl?: TemplateRef<unknown>;

    public readonly showSuggest = signal(false);
    public readonly activeIndex = signal(-1);
    public readonly hasSuggestions = computed(() => this.suggestions().length > 0);
    private debounce: ReturnType<typeof setTimeout> | null = null;
    private hideTimer: ReturnType<typeof setTimeout> | null = null;

    /** Emit the value immediately; debounce the query. Open the menu on intent (renders once
     *  suggestions arrive — the template also gates on hasSuggestions), so async results show. */
    public onInput(value: string): void {
        this.cancelHide();
        this.valueChange.emit(value);
        this.showSuggest.set(true);
        this.activeIndex.set(-1);
        if (this.debounce) clearTimeout(this.debounce);
        this.debounce = setTimeout(() => this.search.emit(value), 250);
    }

    public onKeydown(ev: KeyboardEvent): void {
        if (!this.showSuggest()) return;
        const n = this.suggestions().length;
        if (ev.key === "ArrowDown") { ev.preventDefault(); this.activeIndex.update((i) => Math.min(i + 1, n - 1)); }
        else if (ev.key === "ArrowUp") { ev.preventDefault(); this.activeIndex.update((i) => Math.max(i - 1, 0)); }
        else if (ev.key === "Enter") { const i = this.activeIndex(); if (i >= 0 && i < n) { ev.preventDefault(); this.choose(this.suggestions()[i]); } }
        else if (ev.key === "Escape") { this.showSuggest.set(false); }
    }

    /** Open the menu on focus (renders only once suggestions exist); cancel any pending hide so a
     *  blur→refocus doesn't close it out from under the user. */
    public onFocus(): void { this.cancelHide(); this.showSuggest.set(true); }
    /** Hide shortly after blur so a mousedown on a row still registers (cancellable on refocus). */
    public hideSoon(): void {
        this.cancelHide();
        this.hideTimer = setTimeout(() => this.showSuggest.set(false), 150);
    }
    private cancelHide(): void { if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; } }

    /** Choose a suggestion → notify host + close. */
    public choose(item: unknown): void {
        this.pick.emit(item);
        this.showSuggest.set(false);
        this.activeIndex.set(-1);
    }
}
