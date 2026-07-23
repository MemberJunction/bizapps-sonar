import { Component, computed, inject, signal } from "@angular/core";
import { RegisterClass } from "@memberjunction/global";
import { BaseResourceComponent } from "@memberjunction/ng-shared";
import { ResourceData } from "@memberjunction/core-entities";
import { ScoreModelService } from "../../core/services/score-model.service";
import { FactorService } from "../../core/services/factor.service";
import { BandSlice, MemberSuggestion, ScoreContribution, ScoreHistoryPoint, ScoreReadService, ScoredMember, TrendDirection } from "../../core/services/score-read.service";
import { CurrentModelService } from "../../core/services/current-model.service";
import { SonarToggleOption } from "../../shared/filter-bar/sonar-toggle-filter.component";
import { SonarRange } from "../../shared/filter-bar/sonar-range-filter.component";
import { toCsv, downloadCsv } from "../../core/services/csv.util";
import { FireableAction, InterventionService, InterventionSummary, LaunchConfig, LaunchResult } from "../../core/services/intervention.service";


/**
 * Engagement Manager — the read surface for the people who act on scores. Scoped to the
 * current model (shared rail): a band summary, a triage list of the lowest-scoring members
 * (worst first), and a per-member explainability drawer driven by the persisted score's
 * factor contributions. DriverClass = 'SonarEngagementManagerResource'.
 *
 * Reads PERSISTED scores via {@link ScoreReadService} (written by Recompute). Triage + the
 * explainability drawer + cohort CSV export, plus the action layer (plan §5.6): launch an
 * intervention on the filtered cohort (preview → commit with an automatic holdout via
 * `Sonar: Run Intervention`) and track launched plays in the Interventions tab.
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
    public readonly current = inject(CurrentModelService);
    private readonly interventionService = inject(InterventionService);

    // --- active view tab ---
    public readonly activeTab = signal<'triage' | 'movers' | 'interventions'>('triage');

    // --- action layer: launch panel (in-context, over the triage cohort) + interventions tab ---
    public readonly showLaunch = signal(false);
    /** Where the launch cohort comes from: the triage filter (band/score) or the droppers rule
     *  (score fell by ≥ N since the last recompute — the Movers view's actionable cohort). */
    public readonly launchMode = signal<"cohort" | "droppers">("cohort");
    /** Droppers threshold: members whose Delta ≤ -launchDrop qualify. */
    public readonly launchDrop = signal(5);
    public readonly fireable = signal<FireableAction[]>([]);
    public readonly launchName = signal("");
    public readonly launchActionId = signal<string | null>(null);
    public readonly launchHoldout = signal(20);
    public readonly launchCap = signal(100);
    public readonly launchPreview = signal<LaunchResult | null>(null);
    public readonly launchBusy = signal<"preview" | "commit" | null>(null);
    public readonly launchError = signal<string | null>(null);
    public readonly launchDone = signal<LaunchResult | null>(null);
    public readonly interventions = signal<InterventionSummary[]>([]);
    public readonly loadingInterventions = signal(false);

    public readonly modelName = signal("—");
    public readonly loaded = signal(false);
    public readonly hasModel = computed(() => !!this.current.modelId());

    public readonly tiles = signal<BandSlice[]>([]);
    public readonly members = signal<ScoredMember[]>([]);
    public readonly selected = signal<ScoredMember | null>(null);
    public readonly contributions = signal<ScoreContribution[]>([]);
    public readonly loadingDrawer = signal(false);
    /** Triage list is fetching (drives the skeleton that mirrors the rows). */
    public readonly loadingMembers = signal(false);
    /** A load failed (drives the error state); null when healthy. */
    public readonly error = signal<string | null>(null);
    /** The cohort CSV export is in flight (drives the Export button's spinner/disabled state). */
    public readonly exporting = signal(false);
    /** Fixed placeholder rows for the loading skeleton (mirrors the triage list). */
    public readonly skeletonRows = [0, 1, 2, 3, 4, 5, 6, 7];

    /** The model's current published version number — members scored under an older version are stale. */
    public readonly currentVersionNumber = signal<number | null>(null);
    /** The selected member's score came from an older version than the model's current one. */
    public readonly selectedStale = computed(() => {
        const m = this.selected();
        const cur = this.currentVersionNumber();
        return !!m && m.versionNumber != null && cur != null && m.versionNumber !== cur;
    });

    // --- score history (sparkline) + movers since last run ---
    public readonly history = signal<ScoreHistoryPoint[]>([]);
    public readonly movers = signal<{ risers: ScoredMember[]; fallers: ScoredMember[] }>({ risers: [], fallers: [] });
    public readonly showMovers = signal(false);
    public readonly hasMovers = computed(() => this.movers().risers.length > 0 || this.movers().fallers.length > 0);

    /** SVG sparkline geometry from the selected member's history (null if < 2 points to draw). */
    public readonly spark = computed(() => this.buildSpark(this.history()));
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

    // --- name-search typeahead suggestions (the shared FilterBar owns the menu + keyboard) ---
    public readonly suggestions = signal<MemberSuggestion[]>([]);

    /** Sort toggle options (worst-first ↔ best-first) for the shared SonarToggleFilter. */
    public readonly sortAsc: SonarToggleOption = { value: "asc", label: "↑ Worst first", title: "Worst first — click for best first" };
    public readonly sortDesc: SonarToggleOption = { value: "desc", label: "↓ Best first", title: "Best first — click for worst first" };

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
        this.pinnedAnchorId.set(null);
        this.anchorEntityId.set(model?.AnchorEntityID ?? null);
        this.currentVersionNumber.set(await this.scoreRead.versionNumberFor(model?.CurrentVersionID ?? null));
        this.showMovers.set(false);
        this.showLaunch.set(false);
        this.launchPreview.set(null);
        this.launchDone.set(null);
        this.interventions.set([]);
        if (this.activeTab() === "interventions") this.activeTab.set("triage");
        const [dist, rubric, movers] = await Promise.all([
            this.scoreRead.distributionForModel(id),
            this.factorService.rubricForModel(id),
            this.scoreRead.moversForModel(id),
        ]);
        this.tiles.set(dist.slices);
        this.rubricNames.set(rubric.map((r) => r.name));
        this.movers.set(movers);
        await this.loadMembers();
    }

    /** Show/hide the "movers since last run" panel. */
    public toggleMovers(): void { this.showMovers.update((v) => !v); }

    /** (Re)load the current page of the triage list under the active band filter, then open the
     *  top row's drawer so the surface always lands on something useful. */
    private async loadMembers(): Promise<void> {
        const id = this.current.modelId();
        if (!id) { this.members.set([]); this.total.set(0); this.selected.set(null); this.contributions.set([]); return; }
        const band = this.selectedBand();
        this.loadingMembers.set(true);
        this.error.set(null);
        try {
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
        } catch {
            this.error.set("Couldn't load members. Please retry.");
            this.members.set([]); this.total.set(0); this.selected.set(null); this.contributions.set([]);
        } finally {
            this.loadingMembers.set(false);
        }
    }

    /** Retry after an error — reload the current page. */
    public async retry(): Promise<void> { await this.loadMembers(); }

    /**
     * Export the current filtered cohort to CSV — ALL matching rows (every page, not just the visible
     * 50), respecting the active band tile / score range / name filters. One row per member with
     * score/band/delta/trend, one column per rubric signal (its 0–1 strength), plus a "why" column for
     * any signal that recorded an explanation (e.g. an LLM factor's reason). Reuses the loaded rubric;
     * batches the contribution lookup (no per-member query).
     */
    public async exportCohort(): Promise<void> {
        const id = this.current.modelId();
        if (!id || this.exporting()) return;
        this.exporting.set(true);
        this.error.set(null);
        try {
            const band = this.selectedBand();
            const members = await this.scoreRead.allMembersForModel(id, {
                bandId: band ? band.bandId : undefined,
                minScore: this.minScore(),
                maxScore: this.maxScore(),
                nameQuery: this.nameQuery(),
                anchorEntityId: this.anchorEntityId() ?? undefined,
                anchorRecordId: this.pinnedAnchorId() ?? undefined,
                sortDir: this.sortDir(),
            });
            if (members.length === 0) return;
            const byScore = await this.scoreRead.contributionsForScores(members.map((m) => m.scoreId));
            const csv = this.buildCohortCsv(members, byScore);
            downloadCsv(`${this.slug(this.modelName())}-cohort-${new Date().toISOString().slice(0, 10)}.csv`, csv);
        } catch {
            this.error.set("Couldn't export the cohort. Please retry.");
        } finally {
            this.exporting.set(false);
        }
    }

    // ---- action layer: launch an intervention on the filtered cohort (plan §5.6) ----

    /** Open the in-context launch panel for the CURRENT triage filter; loads the play catalog once. */
    public async openLaunch(): Promise<void> {
        this.launchMode.set("cohort");
        this.activeTab.set("triage");
        await this.prepareLaunch();
    }

    /** Open the panel scoped to the DROPPERS rule (Delta ≤ -N) — the Movers view's launch entry. */
    public async openLaunchDroppers(): Promise<void> {
        this.launchMode.set("droppers");
        await this.prepareLaunch();
    }

    private async prepareLaunch(): Promise<void> {
        this.launchError.set(null);
        this.launchPreview.set(null);
        this.launchDone.set(null);
        this.launchName.set(this.defaultLaunchName());
        this.showLaunch.set(true);
        if (this.fireable().length === 0) {
            this.fireable.set(await this.interventionService.fireableActions());
        }
    }

    public closeLaunch(): void { this.showLaunch.set(false); }

    /** A human name for the play, derived from what the operator is looking at. */
    private defaultLaunchName(): string {
        if (this.launchMode() === "droppers") return `Dropped ${this.launchDrop()}+ outreach`;
        const band = this.selectedBand();
        const range = this.minScore() != null || this.maxScore() != null
            ? ` ${this.minScore() ?? 0}-${this.maxScore() ?? 100}`
            : "";
        return `${band ? band.label : "All bands"}${range} outreach`;
    }

    /** Build the ConfigJSON payload from the active cohort source (triage filter or droppers rule). */
    private launchConfig(preview: boolean): LaunchConfig | null {
        const modelId = this.current.modelId();
        const actionId = this.launchActionId();
        if (!modelId || !actionId) return null;
        const band = this.selectedBand();
        const filter = this.launchMode() === "droppers"
            ? { maxDelta: -Math.abs(this.launchDrop()) }
            : { bandId: band?.bandId ?? null, minScore: this.minScore(), maxScore: this.maxScore() };
        return {
            modelId,
            segment: { name: this.launchName().trim() || this.defaultLaunchName(), filter },
            intervention: { name: this.launchName().trim() || this.defaultLaunchName(), holdoutPercent: this.launchHoldout() },
            action: { actionId, params: [] },
            cap: this.launchCap(),
            preview,
        };
    }

    /** Dry-run: resolve the cohort + treated/held split, write and fire NOTHING. */
    public async previewLaunch(): Promise<void> {
        const cfg = this.launchConfig(true);
        if (!cfg || this.launchBusy()) return;
        this.launchBusy.set("preview");
        this.launchError.set(null);
        this.launchDone.set(null);
        try {
            const res = await this.interventionService.run(cfg);
            if (res.ok && res.result) this.launchPreview.set(res.result);
            else this.launchError.set(res.error ?? "Preview failed.");
        } finally {
            this.launchBusy.set(null);
        }
    }

    /** Commit: write one assignment per member (treatment/control) and fire the play for treated. */
    public async commitLaunch(): Promise<void> {
        const cfg = this.launchConfig(false);
        if (!cfg || this.launchBusy() || !this.launchPreview()) return;
        this.launchBusy.set("commit");
        this.launchError.set(null);
        try {
            const res = await this.interventionService.run(cfg);
            if (res.ok && res.result) {
                this.launchDone.set(res.result);
                this.launchPreview.set(null);
                await this.loadInterventions();
            } else {
                this.launchError.set(res.error ?? "Launch failed.");
            }
        } finally {
            this.launchBusy.set(null);
        }
    }

    /** Numeric field setters ([value]+(input) style — this surface doesn't use ngModel). */
    public setLaunchHoldout(v: string): void { const n = Number(v); this.launchHoldout.set(Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 20); this.launchPreview.set(null); }
    public setLaunchCap(v: string): void { const n = Number(v); this.launchCap.set(Number.isFinite(n) && n > 0 ? Math.floor(n) : 100); this.launchPreview.set(null); }
    public setLaunchAction(id: string): void { this.launchActionId.set(id || null); this.launchPreview.set(null); }
    public setLaunchName(v: string): void { this.launchName.set(v); }
    public setLaunchDrop(v: string): void { const n = Number(v); this.launchDrop.set(Number.isFinite(n) && n > 0 ? n : 5); this.launchPreview.set(null); }

    /** Open the Interventions tab (loads the summaries lazily). */
    public async showInterventions(): Promise<void> {
        this.activeTab.set("interventions");
        await this.loadInterventions();
    }

    private async loadInterventions(): Promise<void> {
        const id = this.current.modelId();
        if (!id) { this.interventions.set([]); return; }
        this.loadingInterventions.set(true);
        try {
            this.interventions.set(await this.interventionService.summaries(id));
        } finally {
            this.loadingInterventions.set(false);
        }
    }

    /**
     * Pivot members + their contributions into the cohort CSV. Factor columns come from the model
     * rubric (stable order; a signal a member lacks shows blank). A "<signal> — why" column is added
     * only for signals that recorded at least one explanation across the cohort, so non-LLM factors
     * don't pad the file with empty columns.
     */
    private buildCohortCsv(members: ScoredMember[], byScore: Map<string, ScoreContribution[]>): string {
        const factors = this.rubricNames();
        const withWhy = new Set<string>();
        for (const list of byScore.values()) {
            for (const c of list) if (c.explanation) withWhy.add(c.label);
        }

        const headers = ["Member", "Member ID", "Score", "Band", "Delta", "Trend", "Scored At"];
        for (const f of factors) {
            headers.push(f);
            if (withWhy.has(f)) headers.push(`${f} — why`);
        }

        const rows = members.map((m) => {
            const byFactor = new Map((byScore.get(m.scoreId) ?? []).map((c) => [c.label, c]));
            const cells: (string | number | null)[] = [
                m.name,
                m.anchorRecordId,
                m.normalizedScore,
                m.bandLabel,
                m.delta ?? "",
                m.trendDirection ?? "",
                m.computedAt ? m.computedAt.toISOString().slice(0, 10) : "",
            ];
            for (const f of factors) {
                const c = byFactor.get(f);
                cells.push(c ? c.normalizedValue : "");
                if (withWhy.has(f)) cells.push(c?.explanation ?? "");
            }
            return cells;
        });
        return toCsv(headers, rows);
    }

    /** Filesystem-safe slug for the export filename (e.g. "Demo Engagement" → "demo-engagement"). */
    private slug(s: string): string {
        return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "model";
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

    /** Search text changed — update the query + un-pin any picked member (reload is deferred to the
     *  debounced `search` event from the field). */
    public onSearchValue(value: string): void {
        this.nameQuery.set(value);
        this.pinnedAnchorId.set(null);
    }

    /** Score range changed — apply both bounds, reset to page 0, reload. */
    public async onScoreRange(range: SonarRange): Promise<void> {
        this.minScore.set(range.min);
        this.maxScore.set(range.max);
        this.page.set(0);
        await this.loadMembers();
    }

    /** Sort direction toggled — reset to page 0, reload. */
    public async onSortChange(dir: string): Promise<void> {
        this.sortDir.set(dir === "desc" ? "desc" : "asc");
        this.page.set(0);
        await this.loadMembers();
    }

    /** Flip the score sort from the Score column header (replaces the standalone sort toggle,
     *  so the filter bar stays a single line). asc = worst (lowest) first. */
    public async toggleScoreSort(): Promise<void> {
        await this.onSortChange(this.sortDir() === "asc" ? "desc" : "asc");
    }

    /** Debounced search query from the FilterBar — reload the page and refresh typeahead suggestions. */
    public async onFilterSearch(query: string): Promise<void> {
        this.page.set(0);
        await this.loadMembers();
        await this.refreshSuggestions(query);
    }

    /** Fetch rich typeahead suggestions for the current query (needs ≥2 chars + a known anchor). */
    private async refreshSuggestions(value: string): Promise<void> {
        const id = this.anchorEntityId();
        const modelId = this.current.modelId();
        if (!id || !modelId || value.trim().length < 2) { this.suggestions.set([]); return; }
        this.suggestions.set(await this.scoreRead.suggestMembers(modelId, id, value.trim()));
    }

    /** A suggestion was picked in the FilterBar — pin to that EXACT member (by ID), then reload. */
    public async onFilterPick(item: unknown): Promise<void> {
        const s = item as MemberSuggestion;
        this.nameQuery.set(s.name);
        this.pinnedAnchorId.set(s.anchorRecordId);
        this.suggestions.set([]);
        this.page.set(0);
        await this.loadMembers();
    }

    /** Open a member in the explainability drawer — fetch the contribution breakdown + score history. */
    public async select(m: ScoredMember): Promise<void> {
        this.selected.set(m);
        this.loadingDrawer.set(true);
        this.history.set([]);
        const modelId = this.current.modelId();
        try {
            const [contributions, history] = await Promise.all([
                this.scoreRead.contributionsForScore(m.scoreId),
                modelId ? this.scoreRead.historyForMember(modelId, m.anchorRecordId) : Promise.resolve([]),
            ]);
            this.contributions.set(contributions);
            this.history.set(history);
        } finally {
            this.loadingDrawer.set(false);
        }
    }

    /** Initials for a member's avatar. */
    public initials(name: string): string {
        return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "—";
    }

    /** Arrow glyph for a trend direction (↑ rising score, ↓ falling, → flat). */
    public trendArrow(dir: TrendDirection | null): string {
        return dir === "Up" ? "↑" : dir === "Down" ? "↓" : "→";
    }

    /** Color tone for a trend: a rising engagement score is good (pos), a falling one bad (neg). */
    public trendTone(dir: TrendDirection | null): "pos" | "neg" | "flat" {
        return dir === "Up" ? "pos" : dir === "Down" ? "neg" : "flat";
    }

    /** Signed delta label, e.g. "+4" / "−6" (null delta → empty). */
    public deltaLabel(delta: number | null): string {
        if (delta == null || delta === 0) return "";
        return delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`;
    }

    /**
     * Build an SVG sparkline from a member's score history. Maps each snapshot to a point in a
     * 120×28 viewBox (newest on the right), scaling Y to the series' own min/max so small moves
     * are visible. Returns null when there's < 2 points (nothing to draw a line through yet).
     */
    private buildSpark(points: ScoreHistoryPoint[]): { line: string; area: string; lastX: number; lastY: number } | null {
        if (points.length < 2) return null;
        const W = 120, H = 28, pad = 3;
        const scores = points.map((p) => p.normalizedScore);
        const min = Math.min(...scores), max = Math.max(...scores);
        const span = max - min || 1;
        const x = (i: number): number => pad + (i / (points.length - 1)) * (W - 2 * pad);
        const y = (v: number): number => H - pad - ((v - min) / span) * (H - 2 * pad);
        const coords = points.map((p, i) => ({ x: x(i), y: y(p.normalizedScore) }));
        const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
        const last = coords[coords.length - 1];
        const area = `${line} L${last.x.toFixed(1)},${H - pad} L${coords[0].x.toFixed(1)},${H - pad} Z`;
        return { line, area, lastX: last.x, lastY: last.y };
    }
}
