import { Component, EventEmitter, HostListener, Input, Output } from "@angular/core";

/**
 * Shared slide-over drawer: a right-edge panel that OVERLAYS the page instead of renting a
 * permanent column from it. The host projects the panel content and owns the open/closed state
 * (`[open]` in, `(closed)` out — unidirectional, like the other shared primitives). Scrim click,
 * the ✕ button, and Escape all request close; the host decides what closing means (usually
 * clearing its selection signal).
 *
 * First consumer: the Engagement Manager's member drill-down (which previously occupied a fixed
 * 380px split column even when nothing was selected). Plays' scoped draft review is next.
 */
@Component({
    standalone: false,
    selector: "sonar-drawer",
    template: `
        @if (open) {
            <div class="sonar-drawer__scrim" (click)="closed.emit()" aria-hidden="true"></div>
            <aside class="sonar-drawer__panel" role="dialog" aria-modal="true" [attr.aria-label]="label">
                <button type="button" class="sonar-btn sonar-btn--ghost sonar-drawer__close" (click)="closed.emit()" aria-label="Close panel">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <ng-content></ng-content>
            </aside>
        }
    `,
    styleUrls: ["../styles/sonar-shell.css", "./sonar-drawer.component.css"],
})
export class SonarDrawerComponent {
    @Input() open = false;
    /** Accessible name for the dialog (also what screen readers announce). */
    @Input() label = "Details";
    @Output() closed = new EventEmitter<void>();

    @HostListener("document:keydown.escape")
    public onEscape(): void {
        if (this.open) this.closed.emit();
    }
}
