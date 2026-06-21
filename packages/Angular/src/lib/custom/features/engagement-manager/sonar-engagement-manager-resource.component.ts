import { Component, computed, inject, signal } from "@angular/core";
import { RegisterClass } from "@memberjunction/global";
import { BaseResourceComponent } from "@memberjunction/ng-shared";
import { ResourceData } from "@memberjunction/core-entities";
import { ScoreModelService } from "../../core/services/score-model.service";
import { FactorService } from "../../core/services/factor.service";
import { BandSlice, MemberSuggestion, ScoreContribution, ScoreReadService, ScoredMember } from "../../core/services/score-read.service";
import { CurrentModelService } from "../../core/services/current-model.service";

/**
 * Engagement Manager — the read surface for the people who act on scores. Scoped to the
 * current model (shared rail): a band summary, a triage list of the lowest-scoring members
 * (worst first), and a per-member explainability drawer driven by the persisted score's
 * factor contributions. DriverClass = 'SonarEngagementManagerResource'.
 *
 * Reads PERSISTED scores via {@link ScoreReadService} (written by Recompute). The action
 * buttons (Export / intervention) stay inert — the action/lift layer is Phase 2+.
 */
@RegisterClass(BaseResourceComponent, "SonarEngagementManagerResource")
@Component({
    standalone: false,
    selector: "sonar-engagement-manager-resource",
    templateUrl: "./sonar-engagement-manager-resource.component.html",
    styleUrls: ["../../shared/styles/sonar-shell.css", "./sonar-engagement-manager-resource.component.css"],
})
export class SonarEngagementManagerResourceComponent extends BaseResourceComponent {
    private readonly modelService = inject(ScoreModelService);
    private readonly factorService = inject(FactorService);
    private readonly scoreRead = inject(ScoreReadService);
    private readonly current = inject(CurrentModelService);

    public readonly modelName = signal("—");
    public readonly loaded = signal(false);
    public readonly hasModel = computed(() => !!this.current.modelId());

    public readonly tiles = signal<BandSlice[]>([]);
    public readonly members = signal<ScoredMember[]>([]);
    public readonly selected = signal<ScoredMember | null>(null);
    public readonly contributions = signal<ScoreContribution[]>([]);
    public readonly loadingDrawer = signal(false);
    /** All signal names in the model's rubric (to spot ones the member has no data for). */
    public readonly rubricNames = signal<string[]>([]);

    // --- triage pagination + band filter (server-side) ---
    private static readonly PAGE_SIZE = 50;
    public readonly page = signal(0);
    public readonly total = signal(0);
    /** Active band filter (a clicked tile), or null for "all bands". */
    public readonly selectedBand = signal<BandSlice | null>(null);

    public readonly pageStart = computed(() => this.total() === 0 ? 0 : this.page() * SonarEngagementManagerResourceComponent.PAGE_SIZE + 1);
    public readonly pageEnd = computed(() => Math.min((this.page() + 1) * SonarEngagementManagerResourceComponent.PAGE_SIZE, this.total()));
    public readonly hasPrev = computed(() => this.page() > 0);
    public readonly hasNext = computed(() => this.pageEnd() < this.total());

    // --- triage filters (server-side, compose with the band tile) ---
    public readonly nameQuery = signal("");
    public readonly minScore = signal<number | null>(null);
    public readonly maxScore = signal<number | null>(null);
    public readonly sortDir = signal<"asc" | "desc">("asc");
    private readonly anchorEntityId = signal<string | null>(null);
    /** When a suggestion is picked, pin to that exact anchor record (overrides the name substring). */
    private readonly pinnedAnchorId = signal<string | null>(null);
    private nameDebounce: ReturnType<typeof setTimeout> | null = null;

    // --- name-search autosuggest (typeahead) ---
    public readonly suggestions = signal<MemberSuggestion[]>([]);
    public readonly showSuggest = signal(false);
    public readonly activeSuggest = signal(-1);

    /** Rubric signals with NO contribution for the selected member — the engine scores these as
     *  0 but still counts their weight, which drags the score down (the hidden reason a score can
     *  be lower than the member's rank on the signals they do have). */
    public readonly missingSignals = computed(() => {
        const present = new Set(this.contributions().map((c) => c.label));
        return this.rubricNames().filter((n) => !present.has(n));
    });

    public async GetResourceDisplayName(_data: ResourceData): Promise<string> { return "Engagement Manager"; }
    public async GetResourceIconClass(_data: ResourceData): Promise<string> { return "fa-solid fa-chart-line"; }

    public override ngOnInit(): void {
        super.ngOnInit();
        void this.hydrate();
    }

    private async hydrate(): Promise<void> {
        try {
            const id = this.current.modelId();
            if (id) await this.loadModel(id);
        } finally {
            this.loaded.set(true);
            this.NotifyLoadComplete();
        }
    }

    /** The rail picked a model — load its triage view. */
    public async onSelect(id: string): Promise<void> {
        await this.loadModel(id);
    }

    /** Load the band summary + first page of the triage list (lowest scores first) for a model. */
    private async loadModel(id: string): Promise<void> {
        const model = await this.modelService.get(id);
        this.modelName.set(model?.Name ?? "—");
        this.page.set(0);
        this.selectedBand.set(null);
        this.nameQuery.set("");
        this.minScore.set(null);
        this.maxScore.set(null);
        this.sortDir.set("asc");
        this.suggestions.set([]);
        this.showSuggest.set(false);
        this.pinnedAnchorId.set(null);
        this.anchorEntityId.set(model?.AnchorEntityID ?? null);
        const [dist, rubric] = await Promise.all([
            this.scoreRead.distributionForModel(id),
            this.factorService.rubricForModel(id),
        ]);
        this.tiles.set(dist.slices);
        this.rubricNames.set(rubric.map((r) => r.name));
        await this.loadMembers();
    }

    /** (Re)load the current page of the triage list under the active band filter, then open the
     *  top row's drawer so the surface always lands on something useful. */
    private async loadMembers(): Promise<void> {
        const id = this.current.modelId();
        if (!id) { this.members.set([]); this.total.set(0); this.selected.set(null); this.contributions.set([]); return; }
        const band = this.selectedBand();
        const { members, total } = await this.scoreRead.membersForModel(id, {
            page: this.page(),
            pageSize: SonarEngagementManagerResourceComponent.PAGE_SIZE,
            bandId: band ? band.bandId : undefined,
            minScore: this.minScore(),
            maxScore: this.maxScore(),
            nameQuery: this.nameQuery(),
            anchorEntityId: this.anchorEntityId() ?? undefined,
            anchorRecordId: this.pinnedAnchorId() ?? undefined,
            sortDir: this.sortDir(),
        });
        this.members.set(members);
        this.total.set(total);
        if (members.length > 0) await this.select(members[0]);
        else { this.selected.set(null); this.contributions.set([]); }
    }

    /** Click a band tile to filter the triage list to it; click the active one again to clear. */
    public async filterByBand(slice: BandSlice): Promise<void> {
        const cur = this.selectedBand();
        this.selectedBand.set(cur && cur.bandId === slice.bandId ? null : slice);
        this.page.set(0);
        await this.loadMembers();
    }

    public async nextPage(): Promise<void> { if (this.hasNext()) { this.page.update((p) => p + 1); await this.loadMembers(); } }
    public async prevPage(): Promise<void> { if (this.hasPrev()) { this.page.update((p) => p - 1); await this.loadMembers(); } }

    /** Member-name search — typing un-pins any picked member (back to substring), debounced;
     *  filters the list AND refreshes the typeahead suggestions. */
    public onNameInput(value: string): void {
        this.nameQuery.set(value);
        this.pinnedAnchorId.set(null);
        if (this.nameDebounce) clearTimeout(this.nameDebounce);
        this.nameDebounce = setTimeout(async () => {
            this.page.set(0);
            await this.loadMembers();
            await this.refreshSuggestions(value);
        }, 250);
    }

    /** Fetch rich typeahead suggestions for the current query (needs ≥2 chars + a known anchor). */
    private async refreshSuggestions(value: string): Promise<void> {
        const id = this.anchorEntityId();
        const modelId = this.current.modelId();
        if (!id || !modelId || value.trim().length < 2) { this.suggestions.set([]); this.showSuggest.set(false); return; }
        const hits = await this.scoreRead.suggestMembers(modelId, id, value.trim());
        this.suggestions.set(hits);
        this.activeSuggest.set(-1);
        this.showSuggest.set(hits.length > 0);
    }

    /** Pick a suggestion — pin to that EXACT member (by ID) so same-named members don't all match. */
    public async pickSuggestion(s: MemberSuggestion): Promise<void> {
        this.nameQuery.set(s.name);
        this.pinnedAnchorId.set(s.anchorRecordId);
        this.suggestions.set([]);
        this.showSuggest.set(false);
        this.page.set(0);
        await this.loadMembers();
    }

    /** Keyboard nav within the suggestion list (↑/↓ move, Enter picks the highlighted, Esc closes). */
    public onNameKeydown(ev: KeyboardEvent): void {
        if (!this.showSuggest()) return;
        const n = this.suggestions().length;
        if (ev.key === "ArrowDown") { ev.preventDefault(); this.activeSuggest.update((i) => Math.min(i + 1, n - 1)); }
        else if (ev.key === "ArrowUp") { ev.preventDefault(); this.activeSuggest.update((i) => Math.max(i - 1, 0)); }
        else if (ev.key === "Enter") { const i = this.activeSuggest(); if (i >= 0 && i < n) { ev.preventDefault(); void this.pickSuggestion(this.suggestions()[i]); } }
        else if (ev.key === "Escape") { this.showSuggest.set(false); }
    }

    /** Hide the suggestion menu shortly after blur, so a mousedown on an option still registers. */
    public hideSuggestSoon(): void { setTimeout(() => this.showSuggest.set(false), 150); }

    /** Set a score bound (clamped 0–100; empty clears it), reset to page 0, reload. */
    public async setScoreBound(which: "min" | "max", value: string): Promise<void> {
        const raw = value.trim();
        const n = raw === "" ? null : Math.max(0, Math.min(100, Number(raw)));
        (which === "min" ? this.minScore : this.maxScore).set(n != null && Number.isNaN(n) ? null : n);
        this.page.set(0);
        await this.loadMembers();
    }

    /** Flip worst-first ↔ best-first ordering. */
    public async toggleSort(): Promise<void> {
        this.sortDir.update((d) => (d === "asc" ? "desc" : "asc"));
        this.page.set(0);
        await this.loadMembers();
    }

    /** Open a member in the explainability drawer — fetch the persisted contribution breakdown. */
    public async select(m: ScoredMember): Promise<void> {
        this.selected.set(m);
        this.loadingDrawer.set(true);
        try {
            this.contributions.set(await this.scoreRead.contributionsForScore(m.scoreId));
        } finally {
            this.loadingDrawer.set(false);
        }
    }

    /** Initials for a member's avatar. */
    public initials(name: string): string {
        return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "—";
    }
}
