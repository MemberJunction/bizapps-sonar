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
import { FireableAction, InterventionService, InterventionSummary, LaunchConfig, LaunchResult, LaunchSegmentFilter, MeasureResult, ProposalStatus, ProposalSummary } from "../../core/services/intervention.service";


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
    public readonly activeTab = signal<'triage' | 'movers' | 'interventions' | 'outreach'>('triage');

    // --- Outreach queue: proposals a play drafted, awaiting human review (approve → simulated send) ---
    public readonly proposals = signal<ProposalSummary[]>([]);
    public readonly loadingProposals = signal(false);
    /** Which slice of the queue is shown; 'Proposed' (to review) is the working view. */
    public readonly proposalFilter = signal<'Proposed' | 'Approved' | 'all'>('Proposed');
    public readonly selectedProposal = signal<ProposalSummary | null>(null);
    /** Operator edits to the selected draft (persisted on approve). */
    public readonly editSubject = signal("");
    public readonly editBody = signal("");
    /** The proposal id being saved, or 'bulk' during approve-all / send-approved. */
    public readonly proposalBusy = signal<string | null>(null);
    public readonly proposalError = signal<string | null>(null);
    public readonly visibleProposals = computed<ProposalSummary[]>(() => {
        const filter = this.proposalFilter();
        const all = this.proposals();
        return filter === 'all' ? all : all.filter((p) => p.status === filter);
    });
    public readonly proposedCount = computed(() => this.proposals().filter((p) => p.status === 'Proposed').length);
    public readonly approvedCount = computed(() => this.proposals().filter((p) => p.status === 'Approved').length);
    /** True when the play picked in the launch panel is the drafting play — drives the
     *  "review drafts in Outreach" link on the commit success line. */
    public readonly launchedDraftPlay = computed(() =>
        this.fireable().find((f) => f.id === this.launchActionId())?.name === 'Sonar: Draft Outreach');

    // --- action layer: launch panel (in-context, over the triage cohort) + interventions tab ---
    public readonly showLaunch = signal(false);
    /** Where the launch cohort comes from: the triage filter (band/score) or a mover segment
     *  (delta rule tuned in the Movers explorer). */
    public readonly launchMode = signal<"cohort" | "movers">("cohort");
    /** The segment filter a launch from Movers carries — set from the live explorer filter so the
     *  cohort launched is EXACTLY the list on screen. */
    private readonly launchMoverFilter = signal<LaunchSegmentFilter>({});
    private launchMoverLabel = "Movers";

    // --- Movers explorer: a live segment view (tune the filter → see the members → launch on them) ---
    public readonly moverDirection = signal<"drops" | "gains">("drops");
    /** Minimum absolute score move to qualify (points). */
    public readonly moverMagnitude = signal(5);
    /** Only members who changed band this run (the meaningful boundary crossing). */
    public readonly moverCrossedOnly = signal(false);
    public readonly moverSummary = signal<{ dropped: number; climbed: number; crossed: number }>({ dropped: 0, climbed: 0, crossed: 0 });
    public readonly moverList = signal<ScoredMember[]>([]);
    /** Movers pagination (0-based page + total rows matching the current mover filter). */
    public readonly moverPage = signal(0);
    public readonly moverTotal = signal(0);
    public readonly loadingMovers = signal(false);
    /** Dominant "why they're low" per listed member (scoreId → cause label), from contributions. */
    public readonly moverCauseById = signal<Map<string, string>>(new Map());

    public readonly directionDrops: SonarToggleOption = { value: "drops", label: "↓ Dropping", title: "Members whose score fell" };
    public readonly directionGains: SonarToggleOption = { value: "gains", label: "↑ Climbing", title: "Members whose score rose" };

    /** The mover filter as an engine SegmentFilter — the ONE definition that drives the list AND a
     *  launch, so what you see is exactly who you'd act on. Direction picks which delta bound. */
    public readonly moverFilter = computed<LaunchSegmentFilter>(() => {
        const mag = Math.abs(this.moverMagnitude());
        const crossedBandOnly = this.moverCrossedOnly() ? true : null;
        return this.moverDirection() === "drops"
            ? { maxDelta: -mag, crossedBandOnly }
            : { minDelta: mag, crossedBandOnly };
    });
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
    /** Per-intervention lift readouts (filled by Measure) + the row currently measuring. */
    public readonly liftById = signal<Map<string, MeasureResult>>(new Map());
    public readonly measuringId = signal<string | null>(null);
    public readonly measureError = signal<string | null>(null);
    /** Launch kind: fire a play per member, sync the treated cohort somewhere once (BulkSync),
     *  or just track a real-world treatment + measure. */
    public readonly launchKind = signal<"Action" | "TrackOnly" | "BulkSync">("Action");

    public readonly modelName = signal("—");
    /** All scoring models, for the header's model picker (the old models rail, condensed). */
    public readonly models = signal<{ id: string; name: string }[]>([]);
    public readonly loaded = signal(false);
    public readonly hasModel = computed(() => !!this.current.modelId());

    public readonly tiles = signal<BandSlice[]>([]);
    public readonly members = signal<ScoredMember[]>([]);
    public readonly selected = signal<ScoredMember | null>(null);
    public readonly contributions = signal<ScoreContribution[]>([]);
    /** Dominant "why they're low" per listed member (scoreId → cause label) — the row's Why line. */
    public readonly memberCauseById = signal<Map<string, string>>(new Map());
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

    // --- score history (sparkline) ---
    public readonly history = signal<ScoreHistoryPoint[]>([]);
    /** Any movement at all this run — gates the Movers nav item + drives its count chip. */
    public readonly hasMovers = computed(() => this.moverSummary().dropped + this.moverSummary().climbed > 0);

    /** SVG sparkline geometry from the selected member's history (null if < 2 points to draw). */
    public readonly spark = computed(() => this.buildSpark(this.history()));
    /** All signal names in the model's rubric (to spot ones the member has no data for). */
    public readonly rubricNames = signal<string[]>([]);

    // --- triage pagination + band filter (server-side) ---
    private static readonly PAGE_SIZE = 50;
    /** Exposed for the shared <sonar-pager> bindings. */
    public readonly pageSize = SonarEngagementManagerResourceComponent.PAGE_SIZE;
    public readonly page = signal(0);
    public readonly total = signal(0);
    /** Active band filter (a clicked tile), or null for "all bands". */
    public readonly selectedBand = signal<BandSlice | null>(null);

    // Page arithmetic (start/end/has-prev/has-next) lives in the shared <sonar-pager>.

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
            // The header picker owns model scope now (no models rail) — load the catalog and
            // fall back to the first model when nothing is remembered.
            const list = await this.modelService.list();
            this.models.set(list.map((m) => ({ id: m.ID, name: m.Name })));
            const id = this.current.modelId() ?? list[0]?.ID ?? null;
            if (id) {
                if (id !== this.current.modelId()) this.current.select(id);
                await this.loadModel(id);
            }
        } finally {
            this.loaded.set(true);
            this.NotifyLoadComplete();
        }
    }

    /** Header model picker: remember the choice and reload the page's data for it. */
    public pickModel(id: string): void {
        if (!id || id === this.current.modelId()) return;
        this.current.select(id);
        void this.loadModel(id);
    }

    /** The rail picked a model — load its triage view. */
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
        this.showLaunch.set(false);
        this.launchPreview.set(null);
        this.launchDone.set(null);
        this.interventions.set([]);
        this.moverList.set([]);
        if (this.activeTab() === "interventions" || this.activeTab() === "movers") this.activeTab.set("triage");
        const [dist, rubric, summary] = await Promise.all([
            this.scoreRead.distributionForModel(id),
            this.factorService.rubricForModel(id),
            this.scoreRead.moverSummary(id),
        ]);
        this.tiles.set(dist.slices);
        this.rubricNames.set(rubric.map((r) => r.name));
        this.moverSummary.set(summary);
        await this.loadMembers();
    }

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
            // Each row's "why": the factor dragging that member down most (batched, one query).
            this.memberCauseById.set(await this.scoreRead.dominantCauseForScores(members.map((m) => m.scoreId)));
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

    /** Open the launch panel scoped to the CURRENT Movers explorer filter — the exact cohort on
     *  screen. This is the unification: the segment you're viewing is the segment you act on. */
    public async openLaunchFromMovers(): Promise<void> {
        this.launchMode.set("movers");
        this.launchMoverFilter.set(this.moverFilter());
        const mag = Math.abs(this.moverMagnitude());
        const verb = this.moverDirection() === "drops" ? "dropped" : "climbed";
        this.launchMoverLabel = `${verb} ${mag}+${this.moverCrossedOnly() ? " (band cross)" : ""}`;
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

    /** Human scope label for a Movers-sourced launch (e.g. "dropped 5+ (band cross)"). */
    public launchMoverScopeLabel(): string { return this.launchMoverLabel; }

    /** A human name for the play, derived from what the operator is looking at. */
    private defaultLaunchName(): string {
        if (this.launchMode() === "movers") return `${this.launchMoverLabel} outreach`;
        const band = this.selectedBand();
        const range = this.minScore() != null || this.maxScore() != null
            ? ` ${this.minScore() ?? 0}-${this.maxScore() ?? 100}`
            : "";
        return `${band ? band.label : "All bands"}${range} outreach`;
    }

    /** Build the ConfigJSON payload from the active cohort source (triage filter or mover segment).
     *  Action and BulkSync need a play picked; TrackOnly fires nothing so needs no play. */
    private launchConfig(preview: boolean): LaunchConfig | null {
        const modelId = this.current.modelId();
        if (!modelId) return null;
        const kind = this.launchKind();
        const actionId = this.launchActionId();
        if (kind !== "TrackOnly" && !actionId) return null;
        const band = this.selectedBand();
        const filter = this.launchMode() === "movers"
            ? this.launchMoverFilter()
            : { bandId: band?.bandId ?? null, minScore: this.minScore(), maxScore: this.maxScore() };
        return {
            modelId,
            kind,
            segment: { name: this.launchName().trim() || this.defaultLaunchName(), filter },
            intervention: { name: this.launchName().trim() || this.defaultLaunchName(), holdoutPercent: this.launchHoldout() },
            action: kind !== "TrackOnly" && actionId ? { actionId, params: [] } : null,
            cap: this.launchCap(),
            preview,
        };
    }

    /** Kind toggle: TrackOnly clears any picked play (it fires nothing); resets the preview. */
    public setLaunchKind(kind: "Action" | "TrackOnly" | "BulkSync"): void {
        this.launchKind.set(kind);
        if (kind === "TrackOnly") this.launchActionId.set(null);
        this.launchPreview.set(null);
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

    // ---- Movers explorer: tune the segment, see the members, launch on exactly them ----

    /** Open the Movers tab and load its summary + list for the current filter. */
    public async showMoversTab(): Promise<void> {
        this.activeTab.set("movers");
        await this.loadMovers();
    }

    public async setMoverDirection(dir: string): Promise<void> {
        this.moverDirection.set(dir === "gains" ? "gains" : "drops");
        this.moverPage.set(0); // filter changed → back to the first page
        await this.loadMovers();
    }
    public async setMoverMagnitude(v: string): Promise<void> {
        const n = Number(v);
        this.moverMagnitude.set(Number.isFinite(n) && n > 0 ? n : 1);
        this.moverPage.set(0);
        await this.loadMovers();
    }
    public async toggleMoverCrossed(): Promise<void> {
        this.moverCrossedOnly.update((v) => !v);
        this.moverPage.set(0);
        await this.loadMovers();
    }

    /** Refresh the summary counts + the filtered member list from the current mover filter. */
    private async loadMovers(): Promise<void> {
        const id = this.current.modelId();
        if (!id) { this.moverList.set([]); this.moverTotal.set(0); this.moverSummary.set({ dropped: 0, climbed: 0, crossed: 0 }); return; }
        this.loadingMovers.set(true);
        try {
            const [summary, pageResult] = await Promise.all([
                this.scoreRead.moverSummary(id),
                this.scoreRead.moverMembers(id, this.moverFilter(), this.moverDirection(), this.moverPage(), this.pageSize),
            ]);
            this.moverSummary.set(summary);
            this.moverList.set(pageResult.members);
            this.moverTotal.set(pageResult.total);
            // Cause-awareness (Rung 1): show WHY each listed member is low, from their contributions.
            this.moverCauseById.set(await this.scoreRead.dominantCauseForScores(pageResult.members.map((m) => m.scoreId)));
        } finally {
            this.loadingMovers.set(false);
        }
    }

    /** Shared pager handlers — set the page, reload the corresponding list. */
    public async goToMemberPage(p: number): Promise<void> { this.page.set(p); await this.loadMembers(); }
    public async goToMoverPage(p: number): Promise<void> { this.moverPage.set(p); await this.loadMovers(); }

    /** The cause label for a listed member (from the dominant-drag factor), or "" if none. */
    public causeFor(scoreId: string): string { return this.moverCauseById().get(scoreId) ?? ""; }

    /** Top causes across the current cohort, most common first — the launch panel's "what's driving
     *  this group" line, so the operator picks a play that fits the actual problem. */
    public readonly moverCauseSummary = computed<{ cause: string; count: number }[]>(() => {
        const causes = this.moverCauseById();
        const tally = new Map<string, number>();
        for (const m of this.moverList()) {
            const c = causes.get(m.scoreId);
            if (c) tally.set(c, (tally.get(c) ?? 0) + 1);
        }
        return [...tally.entries()].map(([cause, count]) => ({ cause, count })).sort((a, b) => b.count - a.count).slice(0, 3);
    });

    /** Open the Interventions tab (loads the summaries lazily). */
    public async showInterventions(): Promise<void> {
        this.activeTab.set("interventions");
        // Proposals ride along: each play card's funnel shows its drafted/to-review/sent tallies.
        await Promise.all([this.loadInterventions(), this.loadProposals()]);
    }

    /** Per-play proposal tallies for the funnel (drafted / awaiting review / sent-simulated). */
    public proposalStatsFor(interventionId: string): { drafted: number; toReview: number; sent: number } {
        let drafted = 0;
        let toReview = 0;
        let sent = 0;
        for (const p of this.proposals()) {
            if (p.interventionId !== interventionId) continue;
            drafted++;
            if (p.status === "Proposed") toReview++;
            if (p.status === "Executed") sent++;
        }
        return { drafted, toReview, sent };
    }

    /** The funnel a play card renders — what actually happened, in order. The lift stage is
     *  appended by the template (it carries the Measure button / readout). */
    public funnelFor(iv: InterventionSummary): { label: string; value: string; tone?: "hot" | "neg" }[] {
        const stages: { label: string; value: string; tone?: "hot" | "neg" }[] = [
            { label: "treated", value: String(iv.treated) },
        ];
        const p = this.proposalStatsFor(iv.id);
        if (p.drafted > 0) {
            stages.push({ label: "drafted", value: String(p.drafted) });
            if (p.toReview > 0) stages.push({ label: "to review", value: String(p.toReview), tone: "hot" });
            stages.push({ label: "sent · simulated", value: String(p.sent) });
        } else if (iv.kind === "BulkSync") {
            stages.push({ label: "synced to list", value: String(iv.sent) });
        } else if (iv.kind === "TrackOnly") {
            stages.push({ label: "tracking", value: String(iv.treated) });
        } else {
            stages.push({ label: "fired", value: String(iv.sent) });
            if (iv.failed > 0) stages.push({ label: "failed", value: String(iv.failed), tone: "neg" });
        }
        return stages;
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

    /** Measure one intervention's outcomes (baseline vs now) and surface its lift readout. */
    public async measureIntervention(interventionId: string): Promise<void> {
        if (this.measuringId()) return;
        this.measuringId.set(interventionId);
        this.measureError.set(null);
        try {
            const res = await this.interventionService.measure(interventionId);
            if (res.ok && res.result) {
                this.liftById.update((m) => { const next = new Map(m); next.set(interventionId, res.result!); return next; });
            } else {
                this.measureError.set(res.error ?? "Measuring outcomes failed.");
            }
        } finally {
            this.measuringId.set(null);
        }
    }

    public liftFor(interventionId: string): MeasureResult | null { return this.liftById().get(interventionId) ?? null; }

    // ---- Outreach queue: review what the drafting play prepared, approve/reject, simulated send ----

    public async showOutreach(): Promise<void> {
        this.activeTab.set("outreach");
        await this.loadProposals();
    }

    private async loadProposals(): Promise<void> {
        const id = this.current.modelId();
        if (!id) return;
        this.loadingProposals.set(true);
        this.proposalError.set(null);
        try {
            const rows = await this.interventionService.proposalsForModel(id);
            this.proposals.set(rows);
            // Keep the selection stable across a reload; otherwise open the first visible draft.
            const selectedId = this.selectedProposal()?.id;
            const still = selectedId ? rows.find((p) => p.id === selectedId) : undefined;
            this.selectProposal(still ?? this.visibleProposals()[0] ?? null);
        } finally {
            this.loadingProposals.set(false);
        }
    }

    public selectProposal(p: ProposalSummary | null): void {
        this.selectedProposal.set(p);
        this.editSubject.set(p?.payload.subject ?? "");
        this.editBody.set(p?.payload.body ?? "");
    }

    public setProposalFilter(filter: 'Proposed' | 'Approved' | 'all'): void {
        this.proposalFilter.set(filter);
        const selected = this.selectedProposal();
        if (!selected || !this.visibleProposals().some((p) => p.id === selected.id)) {
            this.selectProposal(this.visibleProposals()[0] ?? null);
        }
    }

    /** Approve the selected draft, persisting any subject/body edits made in the editor. */
    public async approveSelected(): Promise<void> {
        const p = this.selectedProposal();
        if (!p || this.proposalBusy()) return;
        await this.reviewOne(p, "Approved", {
            ...p.payload,
            subject: this.editSubject().trim() || p.payload.subject,
            body: this.editBody(),
        });
    }

    public async rejectSelected(): Promise<void> {
        const p = this.selectedProposal();
        if (!p || this.proposalBusy()) return;
        await this.reviewOne(p, "Rejected");
    }

    private async reviewOne(p: ProposalSummary, status: ProposalStatus, payload?: ProposalSummary["payload"]): Promise<void> {
        this.proposalBusy.set(p.id);
        this.proposalError.set(null);
        try {
            const res = await this.interventionService.saveProposalReview(p.id, status, payload);
            if (!res.ok) {
                this.proposalError.set(res.error ?? "The review could not be saved.");
                return;
            }
            this.applyProposalChange(p.id, status, payload);
            // Move on to the next draft awaiting review so the queue flows.
            if (this.proposalFilter() === "Proposed") {
                this.selectProposal(this.visibleProposals()[0] ?? null);
            }
        } finally {
            this.proposalBusy.set(null);
        }
    }

    /** Approve every visible draft still awaiting review (as-drafted — no edits). */
    public async approveAll(): Promise<void> {
        if (this.proposalBusy()) return;
        this.proposalBusy.set("bulk");
        this.proposalError.set(null);
        try {
            for (const p of this.proposals().filter((x) => x.status === "Proposed")) {
                const res = await this.interventionService.saveProposalReview(p.id, "Approved");
                if (!res.ok) {
                    this.proposalError.set(res.error ?? "Approving drafts failed partway — the rest are untouched.");
                    return;
                }
                this.applyProposalChange(p.id, "Approved");
            }
            this.selectProposal(this.visibleProposals()[0] ?? null);
        } finally {
            this.proposalBusy.set(null);
        }
    }

    /** The PoC's send: flip every Approved draft to Executed with a timestamp. Nothing leaves the
     *  building — the UI labels this "simulated" everywhere it appears. */
    public async sendApproved(): Promise<void> {
        if (this.proposalBusy()) return;
        this.proposalBusy.set("bulk");
        this.proposalError.set(null);
        try {
            for (const p of this.proposals().filter((x) => x.status === "Approved")) {
                const res = await this.interventionService.saveProposalReview(p.id, "Executed");
                if (!res.ok) {
                    this.proposalError.set(res.error ?? "The send stopped partway — remaining drafts are still Approved.");
                    return;
                }
                this.applyProposalChange(p.id, "Executed");
            }
        } finally {
            this.proposalBusy.set(null);
        }
    }

    /** Mirror a saved change into the local list (no refetch — the save is the source of truth). */
    private applyProposalChange(id: string, status: ProposalStatus, payload?: ProposalSummary["payload"]): void {
        this.proposals.update((list) =>
            list.map((p) => (p.id === id ? { ...p, status, payload: payload ?? p.payload } : p)));
        const selected = this.selectedProposal();
        if (selected?.id === id) {
            this.selectedProposal.set({ ...selected, status, payload: payload ?? selected.payload });
        }
    }

    /** Chip tone per review status (band tones re-used deliberately: to-review = watch, approved =
     *  healthy, rejected = at-risk, executed = the neutral phase chip). */
    public proposalChipClass(status: ProposalStatus): string {
        switch (status) {
            case "Approved": return "sonar-chip--healthy";
            case "Rejected": return "sonar-chip--atrisk";
            case "Executed": return "sonar-chip--phase2";
            default: return "sonar-chip--watch";
        }
    }

    public proposalStatusLabel(status: ProposalStatus): string {
        return status === "Executed" ? "Sent · simulated" : status === "Proposed" ? "To review" : status;
    }

    /** Signed one-decimal label for lift numbers ("+3.2" / "-1.0"). */
    public liftLabel(v: number | null): string {
        if (v == null) return "n/a";
        return `${v >= 0 ? "+" : ""}${v.toFixed(1)}`;
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
