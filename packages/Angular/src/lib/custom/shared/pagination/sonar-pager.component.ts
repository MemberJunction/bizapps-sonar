import { Component, EventEmitter, Input, Output } from "@angular/core";

/**
 * Shared pager: "start–end of total" + ‹ › controls for any server-paged list. Unidirectional
 * like the other shared primitives — `[page]`/`[pageSize]`/`[total]` in, `(pageChange)` out; the
 * host reloads its data with the emitted 0-based page. Derives start/end/has-prev/has-next itself
 * so no host re-implements the arithmetic (Triage and Movers both use it; anything paged should).
 */
@Component({
    standalone: false,
    selector: "sonar-pager",
    template: `
        <span class="sonar-mono sonar-pager__count">{{ start }}–{{ end }} of {{ total }}</span>
        <span class="sonar-pager__btns">
            <button type="button" class="sonar-btn sonar-btn--ghost sonar-pager__btn" [disabled]="!hasPrev" (click)="go(page - 1)" title="Previous page" aria-label="Previous page">‹</button>
            <button type="button" class="sonar-btn sonar-btn--ghost sonar-pager__btn" [disabled]="!hasNext" (click)="go(page + 1)" title="Next page" aria-label="Next page">›</button>
        </span>
    `,
    styleUrls: ["../styles/sonar-shell.css", "./sonar-pager.component.css"],
})
export class SonarPagerComponent {
    /** Current page, 0-based. */
    @Input() page = 0;
    @Input() pageSize = 50;
    /** Total matching rows across all pages. */
    @Input() total = 0;
    @Output() pageChange = new EventEmitter<number>();

    public get start(): number { return this.total === 0 ? 0 : this.page * this.pageSize + 1; }
    public get end(): number { return Math.min((this.page + 1) * this.pageSize, this.total); }
    public get hasPrev(): boolean { return this.page > 0; }
    public get hasNext(): boolean { return this.end < this.total; }

    public go(p: number): void {
        if (p >= 0 && p !== this.page && p * this.pageSize < Math.max(this.total, 1)) this.pageChange.emit(p);
    }
}
