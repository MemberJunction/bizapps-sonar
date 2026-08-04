import { Component, computed, effect, inject, signal } from "@angular/core";
import { Metadata } from "@memberjunction/core";
import { RegisterClass } from "@memberjunction/global";
import { BaseResourceComponent } from "@memberjunction/ng-shared";
import { ResourceData } from "@memberjunction/core-entities";
import { ScoreModelService } from "../../core/services/score-model.service";
import { FactorService } from "../../core/services/factor.service";
import { BandSlice, MemberSuggestion, ScoreContribution, ScoreHistoryPoint, ScoreReadService, ScoredMember, TrendDirection } from "../../core/services/score-read.service";
import { CurrentModelService } from "../../core/services/current-model.service";
import { SonarDataBusService } from "../../core/services/sonar-data-bus.service";
import { MemberCondition, MemberField, MemberFieldKind, humanizeDays } from "../../shared/member-filter/sonar-member-filter.component";
import { SonarToggleOption } from "../../shared/filter-bar/sonar-toggle-filter.component";
import { SonarRange } from "../../shared/filter-bar/sonar-range-filter.component";
import { toCsv, downloadCsv } from "../../core/services/csv.util";
import { AnchorNoun, anchorNounFor } from "../../core/anchor-noun";
import { FireableAction, InterventionService, PlayParam, InterventionSummary, LaunchConfig, LaunchResult, LaunchSegmentFilter, MeasureResult, MemberTrendShape, PreviewMember, ProposalStatus, ProposalSummary, ReasonSlice } from "../../core/services/intervention.service";


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
    private readonly bus = inject(SonarDataBusService);

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
    /** Set when the engine couldn't resolve the rule — distinct from "the rule matched nobody". */
    public readonly moverError = signal<string | null>(null);
    /** Dominant "why they're low" per listed member (scoreId → cause label), from contributions. */
    public readonly moverCauseById = signal<Map<string, string>>(new Map());
    /** The trend shape the engine used to qualify each listed member (scoreId → shape), for
     *  'Over time' rules. The list has to show the measure it selected on, not the last-run delta. */
    public readonly moverShapeById = signal<Map<string, MemberTrendShape>>(new Map());

    public readonly directionDrops: SonarToggleOption = { value: "drops", label: "↓ Dropping", title: "Members whose score fell" };
    public readonly directionGains: SonarToggleOption = { value: "gains", label: "↑ Climbing", title: "Members whose score rose" };

    /** Named rules, so finding a cohort is one click instead of four numeric decisions. The numbers
     *  stay visible and editable underneath — editing any of them flips to 'custom', so a preset
     *  never silently misdescribes what's actually being asked. */
    public readonly moverPresets: readonly { id: string; label: string; hint: string }[] = [
        { id: "slipping", label: "Slipping away", hint: "Quietly eroding for months — every single step too small to trip an alert" },
        { id: "cliff", label: "Sudden drop", hint: "Fell sharply on the last run: something happened" },
        { id: "crossed", label: "Fell into a worse band", hint: "Crossed a real boundary on the last run, not an in-band wiggle" },
        { id: "recovering", label: "Recovering", hint: "Climbing steadily — worth knowing what's working" },
    ];
    /** Starts on "Slipping away". Every signal below is initialised to THAT rule's values, so the
     *  highlighted chip always describes the rule actually being asked on first paint. */
    public readonly moverPreset = signal<string>("slipping");

    /** Which question the rule asks. 'lastRun' compares the score to the model's baseline (one step);
     *  'overTime' reads the member's history and describes the SHAPE of the path — the only way to
     *  catch someone whose every single step was too small to trip a threshold. */
    public readonly moverMode = signal<"lastRun" | "overTime">("overTime");
    /** The rule's own horizon in days for 'overTime' (independent of the model's trend window). */
    public readonly moverWindowDays = signal(90);
    /** Points per month the score must be moving, for 'overTime'. */
    public readonly moverRatePerMonth = signal(3);
    /** Consecutive cycles the member must still be sliding (drops only, 0 = don't require it). */
    public readonly moverSlideCycles = signal(3);
    /** Exclude erratic series, so a steady slide isn't confused with a member who bounces. */
    public readonly moverSteadyOnly = signal(true);

    /** Whether the rule pane is shown. Only consulted below the split's breakpoint: at full width the
     *  rule column is always visible, but on a narrow rail a permanent column plus the section rail
     *  leaves the member list too little width, so there it collapses behind a toggle. */
    public readonly rulePaneOpen = signal(false);

    /** Conditions on the MEMBER RECORD (tenure, region, activity), which the engine ANDs with the
     *  score rule. This is what makes a cohort specific rather than merely low-scoring. */
    public readonly memberConditions = signal<MemberCondition[]>([]);
    /** Which members to work FIRST. Part of the rule: the run cap truncates the resolved cohort, so
     *  this decides who actually gets treated when a team can only work some of them. */
    public readonly rankMode = signal<"worstScore" | "fastestDecline" | "biggestDrop" | "priority" | "highestValue">("worstScore");
    /** Anchor NUMBER field backing the value-led modes; "" = don't weigh value at all. */
    public readonly rankValueField = signal<string>("");

    /** How the current cohort splits by main problem, straight from the engine. Covers the WHOLE
     *  cohort, not the visible page. */
    public readonly moverBreakdown = signal<ReasonSlice[]>([]);
    /** The slice the operator has drilled into, or null for the whole cohort. Narrowing to one slice
     *  is the point of the breakdown: it turns a mixed group into one where a single action fits. */
    public readonly moverReason = signal<ReasonSlice | null>(null);
    /** Size of the cohort BEFORE any reason drill-down. Summed from the held full breakdown, so the
     *  "37 of 319" framing survives being inside a slice without keeping a second copy of the count. */
    public readonly moverCohortTotal = computed(() => {
        const whole = this.moverBreakdown().reduce((sum, s) => sum + s.count, 0);
        return whole > 0 ? whole : this.moverTotal();
    });

    /** The mover filter as an engine SegmentFilter — the ONE definition that drives the list AND a
     *  launch, so what you see is exactly who you'd act on. */
    public readonly moverFilter = computed<LaunchSegmentFilter>(() => {
        const dropping = this.moverDirection() === "drops";
        const reason = this.reasonCondition();
        const context = this.contextAndRank();
        if (this.moverMode() === "lastRun") {
            const mag = Math.abs(this.moverMagnitude());
            const crossedBandOnly = this.moverCrossedOnly() ? true : null;
            return dropping
                ? { maxDelta: -mag, crossedBandOnly, ...reason, ...context }
                : { minDelta: mag, crossedBandOnly, ...reason, ...context };
        }
        const rate = Math.abs(this.moverRatePerMonth());
        const cycles = Math.max(0, this.moverSlideCycles());
        return {
            windowDays: this.moverWindowDays(),
            // Rate is stated per month because that's how a person says it; the engine scales it.
            ...(dropping ? { maxSlopePer30Days: -rate } : { minSlopePer30Days: rate }),
            // "Still sliding" only means something downward; a rising member has no decline run.
            ...(dropping && cycles > 0 ? { minDeclineRun: cycles } : {}),
            ...(this.moverSteadyOnly() ? { maxVolatility: 2 } : {}),
            ...reason,
            ...context,
        };
    });

    /**
     * The selected slice as a reason condition, or `{}` when the whole cohort is in scope.
     *
     * `dominantFactorIds` (not `weakOnFactorId`) because a slice means "this is their MAIN problem",
     * which is exactly what makes the group homogeneous. `requireNoData` rides along for a data-gap
     * slice so it stays separate from genuine weakness on the same signal: those members need the
     * integration fixed, not an email.
     */
    /** The member conditions + ordering as engine filter fields. Both are omitted entirely when unset,
     *  so a rule that asks nothing extra is byte-identical to what it was before this existed. */
    private contextAndRank(): Partial<LaunchSegmentFilter> {
        const anchor = this.memberConditions();
        const mode = this.rankMode();
        const valueField = this.rankValueField();
        const needsValue = mode === "highestValue" || mode === "priority";
        return {
            ...(anchor.length > 0 ? { anchor } : {}),
            ...(mode !== "worstScore"
                ? { rank: { mode, ...(needsValue && valueField ? { valueField } : {}) } }
                : {}),
        };
    }

    private reasonCondition(): { reason?: LaunchSegmentFilter["reason"] } {
        const slice = this.moverReason();
        if (!slice || !slice.factorId) return {};
        return {
            reason: {
                dominantFactorIds: [slice.factorId],
                // Both gates are stated explicitly, never left to default: "Low X" and "No X" are two
                // slices sharing one dominant factor, so an unstated gate would make each slice return
                // the other's members too, and the list would disagree with the count on the chip.
                ...(slice.hadData ? { requireData: true } : { requireNoData: true }),
            },
        };
    }
    public readonly fireable = signal<FireableAction[]>([]);
    public readonly launchName = signal("");
    public readonly launchActionId = signal<string | null>(null);
    public readonly launchHoldout = signal(20);
    public readonly launchCap = signal(100);
    /** The params the chosen play needs a PERSON to fill (Subject/Body/From for the email play).
     *  Empty for plays that declare none, so nothing renders for the common case. */
    public readonly playParams = signal<PlayParam[]>([]);
    /** Operator-entered values, keyed by param name. */
    public readonly playParamValues = signal<Record<string, string>>({});
    /** Required params still blank — commit stays blocked while this is non-empty, mirroring how an
     *  unapproved play blocks it. Cheaper to catch here than as a VALIDATION_ERROR after a round trip. */
    public readonly missingPlayParams = computed(() => {
        const values = this.playParamValues();
        return this.playParams().filter((p) => p.isRequired && !(values[p.name] ?? "").trim()).map((p) => p.name);
    });
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
    /** A manual refresh is in flight (drives the Refresh button's spinner/disabled state). */
    public readonly refreshing = signal(false);
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
    /** Movement on the LAST RUN — drives the nav item's count chip. Deliberately not the gate: a
     *  model can have no last-run movement and still have members eroding over months, which is
     *  exactly what the 'Over time' rule exists to find. Gating on this hid that tab entirely. */
    public readonly hasMovers = computed(() => this.moverSummary().dropped + this.moverSummary().climbed > 0);
    /** The tab is reachable whenever the model has scores to read a trajectory from. */
    public readonly canOpenMovers = computed(() => this.tiles().length > 0);

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

    /**
     * What to call the thing this model scores, derived from the anchor entity rather than assumed.
     *
     * Every label on this surface used to say "member", which was only ever right because the demo models
     * anchor on Members. A model scored on Accounts read "Cohort: members who slid 3 cycles" over a list of
     * companies. Falls back to a generic noun before a model is chosen — see anchorNounFor.
     */
    public readonly noun = computed<AnchorNoun>(() => {
        const id = this.anchorEntityId();
        if (!id) return anchorNounFor(null);
        const entity = new Metadata().Entities.find((e) => e.ID === id);
        return anchorNounFor(entity?.DisplayName || entity?.Name);
    });
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

    // ── Cross-surface invalidation ─────────────────────────────────────────────
    /**
     * Bus revision this surface's contents already reflect, per model. A model absent from the map
     * has never been shown, so its first sighting is NOT a change — its own load path is handling it.
     */
    private readonly seenRevision = new Map<string, number>();

    /** Combined revision of everything that would change what this surface shows for a model. */
    private busRevision(modelId: string): number {
        return (
            this.bus.revision({ topic: "scores", modelId }) +
            this.bus.revision({ topic: "config", modelId })
        );
    }

    /**
     * Re-read when a recompute or config change lands for the model on screen. This is what makes
     * Recompute in Model Builder show up here with no manual step.
     *
     * Reading `busRevision` is what subscribes; the number's value is meaningless, only its changing.
     * The `undefined` guard suppresses the first sighting of a model so this never duplicates
     * `hydrate()` / `loadModel()`. Switching back to a model that changed while you were away DOES
     * refresh, which is the point — at worst that overlaps the rail's own `loadModel` and costs one
     * redundant set of read-only queries.
     */
    private readonly watchInvalidations = effect(() => {
        const id = this.current.modelId();
        if (!id) return;
        const revision = this.busRevision(id);
        const seen = this.seenRevision.get(id);
        this.seenRevision.set(id, revision);
        if (seen === undefined || seen === revision) return;
        void this.refresh();
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
        // A reason drill-down names a FACTOR and a member condition names an anchor FIELD; both belong
        // to the model being left. Carried across a switch they would filter on things the new model has
        // never heard of — and the engine rightly fails a rule naming a field its anchor lacks.
        this.moverReason.set(null);
        this.moverBreakdown.set([]);
        this.memberConditions.set([]);
        this.rankValueField.set("");
        void this.loadModel(id);
    }

    /** The rail picked a model — load its triage view. */
    /** Load the band summary + first page of the triage list (lowest scores first) for a model. */
    private async loadModel(id: string): Promise<void> {
        // Baseline the bus BEFORE any await, so the invalidation effect doesn't treat this load's own
        // model as a pending change and re-read on top of it.
        this.seenRevision.set(id, this.busRevision(id));
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

    /**
     * Re-read everything this surface shows for the current model, KEEPING the operator's place
     * (band tile, score range, name search, sort, page).
     *
     * Why this exists: a Recompute runs in Model Builder and writes new Scores behind this
     * surface's back. Resource tabs stay mounted, so ngOnInit never fires again and the triage
     * list happily shows pre-recompute numbers until the browser is reloaded. This is the
     * operator's pull. (`loadModel` is the wrong tool — it resets every filter, which throws
     * away the cohort they were working.)
     *
     * The selected band is RE-POINTED at the fresh slice with the same bandId rather than kept:
     * its member count just changed, and the tile renders from the held object.
     */
    public async refresh(): Promise<void> {
        const id = this.current.modelId();
        if (!id || this.refreshing()) return;
        this.refreshing.set(true);
        this.error.set(null);
        try {
            const model = await this.modelService.get(id);
            this.modelName.set(model?.Name ?? "—");
            this.anchorEntityId.set(model?.AnchorEntityID ?? null);
            this.currentVersionNumber.set(await this.scoreRead.versionNumberFor(model?.CurrentVersionID ?? null));

            const [dist, rubric, summary] = await Promise.all([
                this.scoreRead.distributionForModel(id),
                this.factorService.rubricForModel(id),
                this.scoreRead.moverSummary(id),
            ]);
            this.tiles.set(dist.slices);
            this.rubricNames.set(rubric.map((r) => r.name));
            this.moverSummary.set(summary);

            const band = this.selectedBand();
            if (band) this.selectedBand.set(dist.slices.find((s) => s.bandId === band.bandId) ?? null);

            await this.loadMembers();
            // Movers is its own tab now (was a collapsible panel) — re-read it only when it's showing.
            if (this.activeTab() === "movers") await this.loadMovers();
        } catch {
            this.error.set("Couldn't refresh. Please try again.");
        } finally {
            this.refreshing.set(false);
        }
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
            // Each row's "why": resolved SERVER-SIDE (`Sonar: Explain Scores`), not recomputed here.
            // The ranking depends on the rubric weight and is the same one a targeting rule selects
            // on, so a browser-side copy could disagree with who a launch would actually pick.
            const reasons = await this.interventionService.reasonsForScores(members.map((m) => m.scoreId));
            this.memberCauseById.set(new Map([...reasons].map(([scoreId, r]) => [scoreId, r.reasonLabel ?? ""])));
        } catch {
            this.error.set(`Couldn't load ${this.noun().many}. Please retry.`);
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
        // One description of the rule, so the launch panel can't describe a different cohort than
        // the list it was opened from.
        this.launchMoverLabel = this.moverRuleLabel();
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
            // Only non-empty values travel: an empty string would override a play's own default with
            // nothing, which is worse than not sending the param at all.
            action: kind !== "TrackOnly" && actionId
                ? { actionId, params: Object.entries(this.playParamValues())
                        .filter(([, v]) => v.trim().length > 0)
                        .map(([name, value]) => ({ name, value })) }
                : null,
            cap: this.launchCap(),
            preview,
        };
    }

    /** Kind toggle: TrackOnly fires nothing, and any other kind may not be able to service the play that
     *  was already picked. Either way the selection goes, along with the fields it was driving. */
    public setLaunchKind(kind: "Action" | "TrackOnly" | "BulkSync"): void {
        this.launchKind.set(kind);
        // A selection the new kind cannot service must not survive the switch — a batch play left over
        // from "Sync cohort" under "Fire a play" is a launch that fails once per member. TrackOnly clears
        // unconditionally: playsForKind is empty there, so the check below covers it too.
        if (!this.playsForKind().some((p) => p.id === this.launchActionId())) {
            this.clearPlaySelection();
        }
        this.launchPreview.set(null);
    }

    /** Drop the picked play AND the param fields it was driving. Clearing only the id left the previous
     *  play's inputs on screen under a "Pick the action to fire…" picker, which reads as a rendering bug
     *  and, worse, would submit values the next play never asked for. */
    private clearPlaySelection(): void {
        this.launchActionId.set(null);
        this.playParams.set([]);
        this.playParamValues.set({});
    }

    /**
     * The plays the CURRENT launch kind can actually fire.
     *
     * Per-member kinds want a play that takes AnchorRecordID; BulkSync wants one that takes CohortJSON.
     * Offering all of them regardless is what let a batch-only play be picked under "Fire a play" and fail
     * on every single member.
     */
    public readonly playsForKind = computed<FireableAction[]>(() => {
        const kind = this.launchKind();
        if (kind === "TrackOnly") return [];
        return this.fireable().filter((p) => (kind === "BulkSync" ? p.bulk : p.perMember));
    });

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
    public setLaunchAction(id: string): void {
        this.launchActionId.set(id || null);
        this.launchPreview.set(null);
        void this.loadPlayParams(id || null);
    }

    /** Read what the chosen play asks of the operator, seeding any declared defaults. Generic: the
     *  panel never names a specific play, so a new parameterised play works with no client change. */
    private async loadPlayParams(actionId: string | null): Promise<void> {
        if (!actionId) { this.playParams.set([]); this.playParamValues.set({}); return; }
        const params = await this.interventionService.editableParamsForAction(actionId);
        this.playParams.set(params);
        const seeded: Record<string, string> = {};
        for (const p of params) if (p.defaultValue) seeded[p.name] = p.defaultValue;
        this.playParamValues.set(seeded);
    }

    /** Update one param value (and drop the stale preview — the payload just changed). */
    public setPlayParam(name: string, value: string): void {
        this.playParamValues.update((v) => ({ ...v, [name]: value }));
        this.launchPreview.set(null);
    }
    public setLaunchName(v: string): void { this.launchName.set(v); }

    // ---- Movers explorer: tune the segment, see the members, launch on exactly them ----

    /** Open the Movers tab and load its summary + list for the current filter. */
    public async showMoversTab(): Promise<void> {
        this.activeTab.set("movers");
        await this.loadMovers();
    }

    public async setMoverDirection(dir: string): Promise<void> {
        this.moverDirection.set(dir === "gains" ? "gains" : "drops");
        this.markCustomRule();
        this.moverPage.set(0); // filter changed → back to the first page
        await this.loadMovers();
    }
    public async setMoverMagnitude(v: string): Promise<void> {
        const n = Number(v);
        this.moverMagnitude.set(Number.isFinite(n) && n > 0 ? n : 1);
        this.markCustomRule();
        this.moverPage.set(0);
        await this.loadMovers();
    }
    public async toggleMoverCrossed(): Promise<void> {
        this.moverCrossedOnly.update((v) => !v);
        this.markCustomRule();
        this.moverPage.set(0);
        await this.loadMovers();
    }

    /** Apply a named rule: sets every knob at once, so the common cases need no tuning. */
    public async applyPreset(id: string): Promise<void> {
        this.moverPreset.set(id);
        // A preset names a whole rule, so it can't quietly inherit a drill-down from the last one —
        // the chip would say "Slipping away" while the list showed one slice of it.
        this.moverReason.set(null);
        switch (id) {
            case "slipping": // the member no single-step threshold can see
                this.moverMode.set("overTime");
                this.moverDirection.set("drops");
                this.moverRatePerMonth.set(3);
                this.moverWindowDays.set(90);
                this.moverSlideCycles.set(3);
                this.moverSteadyOnly.set(true);
                break;
            case "cliff":
                this.moverMode.set("lastRun");
                this.moverDirection.set("drops");
                this.moverMagnitude.set(10);
                this.moverCrossedOnly.set(false);
                break;
            case "crossed":
                this.moverMode.set("lastRun");
                this.moverDirection.set("drops");
                this.moverMagnitude.set(1);
                this.moverCrossedOnly.set(true);
                break;
            case "recovering":
                this.moverMode.set("overTime");
                this.moverDirection.set("gains");
                this.moverRatePerMonth.set(3);
                this.moverWindowDays.set(90);
                this.moverSteadyOnly.set(false);
                break;
            default:
                break;
        }
        this.moverPage.set(0);
        await this.loadMovers();
    }

    /** Any hand edit means the rule is no longer the preset it started from. Called by every setter
     *  so the chips can never claim to describe a rule the operator has since changed. */
    private markCustomRule(): void {
        if (this.moverPreset() !== "custom") this.moverPreset.set("custom");
    }

    /** Switch between the one-step reading and the over-time (shape) reading. */
    public async setMoverMode(mode: "lastRun" | "overTime"): Promise<void> {
        if (this.moverMode() === mode) return;
        this.moverMode.set(mode);
        this.markCustomRule();
        this.moverPage.set(0);
        await this.loadMovers();
    }
    public async setMoverWindowDays(v: string): Promise<void> {
        const n = Number(v);
        this.moverWindowDays.set(Number.isFinite(n) && n > 0 ? Math.floor(n) : 90);
        this.markCustomRule();
        this.moverPage.set(0);
        await this.loadMovers();
    }
    public async setMoverRatePerMonth(v: string): Promise<void> {
        const n = Number(v);
        this.moverRatePerMonth.set(Number.isFinite(n) && n > 0 ? n : 1);
        this.markCustomRule();
        this.moverPage.set(0);
        await this.loadMovers();
    }
    public async setMoverSlideCycles(v: string): Promise<void> {
        const n = Number(v);
        this.moverSlideCycles.set(Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0);
        this.markCustomRule();
        this.moverPage.set(0);
        await this.loadMovers();
    }
    public async toggleMoverSteadyOnly(): Promise<void> {
        this.moverSteadyOnly.update((v) => !v);
        this.markCustomRule();
        this.moverPage.set(0);
        await this.loadMovers();
    }

    /** The trajectory the engine measured for a listed member, or null for a last-run rule. */
    public shapeFor(scoreId: string): MemberTrendShape | null { return this.moverShapeById().get(scoreId) ?? null; }

    /** How a trajectory reads in the list: total move over the window, the monthly rate, and how long
     *  they've been sliding. Written the way the rule is written, so the row explains its own selection.
     *
     *  Kept terse deliberately. The list column is ~300px narrower since the rule moved into its own
     *  pane, and the words carried no information the header and units didn't already: "pts" is implied
     *  by a score column, and "cycles down" by an arrow. Numbers never truncate — dropping the prose is
     *  what keeps all three of them visible. */
    public shapeLabel(shape: MemberTrendShape): string {
        const net = shape.netChange === null ? "—" : `${shape.netChange > 0 ? "+" : ""}${shape.netChange.toFixed(0)}`;
        const perMonth = shape.slopePerDay === null ? null : shape.slopePerDay * 30;
        const parts = [net];
        if (perMonth !== null) parts.push(`${perMonth > 0 ? "+" : ""}${perMonth.toFixed(1)}/mo`);
        if (shape.declineRun > 0) parts.push(`${shape.declineRun}↓`);
        return parts.join(" · ");
    }

    /** The words the cell drops, restored on hover — so the terse numbers stay explainable. */
    public shapeTooltip(shape: MemberTrendShape): string {
        const parts: string[] = [];
        if (shape.netChange !== null) parts.push(`${shape.netChange.toFixed(0)} points over the window`);
        if (shape.slopePerDay !== null) parts.push(`${(shape.slopePerDay * 30).toFixed(1)} points a month`);
        if (shape.declineRun > 0) parts.push(`still sliding ${shape.declineRun} score updates in a row`);
        parts.push(`${shape.points} snapshots in the window`);
        if (shape.volatility !== null) parts.push(`variability ${shape.volatility.toFixed(1)}`);
        return parts.join(" · ");
    }

    /** One sentence explaining what the rule asked and what came back, in the words a membership
     *  lead would use. This is the line that makes the numbers below it checkable. */
    public moverExplainer(): string {
        const n = this.moverTotal();
        const who = n === 1 ? `1 ${this.noun().one}` : `${n.toLocaleString()} ${this.noun().many}`;
        // The drill-down is part of the rule, so the sentence has to say so — otherwise it reads as a
        // count of the whole cohort while the list shows one slice of it.
        const slice = this.moverReason();
        if (slice) {
            const problem = slice.hadData
                ? `whose main problem is ${slice.label.replace(/^Low /, "").toLowerCase()}`
                : `who have no ${slice.label.replace(/^No /, "").toLowerCase()} on record at all`;
            return `${who} ${problem}, out of ${this.moverCohortTotal().toLocaleString()} matching this rule.`;
        }
        if (this.moverMode() === "lastRun") {
            const verb = this.moverDirection() === "drops" ? "fell" : "rose";
            const cross = this.moverCrossedOnly() ? " and crossed into a different band" : "";
            return `${who} ${verb} ${Math.abs(this.moverMagnitude())} points or more since the last score update${cross}.`;
        }
        const dir = this.moverDirection() === "drops" ? "losing" : "gaining";
        const bits = [`${who} have been ${dir} at least ${Math.abs(this.moverRatePerMonth())} points a month over the last ${this.moverWindowDays()} days`];
        if (this.moverDirection() === "drops" && this.moverSlideCycles() > 0) {
            bits.push(`and are still sliding ${this.moverSlideCycles()} score updates in a row`);
        }
        if (this.moverSteadyOnly()) bits.push("steadily rather than bouncing around");
        return `${bits.join(", ")}.${this.contextSentence()}`;
    }

    /** The member-condition and ordering half of the rule, as a trailing clause. Without this the
     *  count changes when a condition is added but the sentence still describes only the score rule,
     *  so the number looks arbitrary. */
    private contextSentence(): string {
        const parts: string[] = [];
        const conditions = this.memberConditions();
        if (conditions.length > 0) {
            parts.push(`Narrowed to ${this.noun().many} where ${conditions.map((c) => this.describeCondition(c)).join(", and ")}.`);
        }
        const mode = this.rankMode();
        if (mode !== "worstScore") {
            const label = RANK_LABELS[mode] ?? mode;
            const field = this.rankUsesValue() && this.rankValueField()
                ? ` (weighing ${this.memberFields().find((f) => f.name === this.rankValueField())?.label ?? this.rankValueField()})`
                : "";
            parts.push(`Worked ${label} first${field}.`);
        }
        return parts.length > 0 ? ` ${parts.join(" ")}` : "";
    }

    /** One member condition in the same words its chip uses. */
    private describeCondition(c: MemberCondition): string {
        const field = this.memberFields().find((f) => f.name === c.field);
        const label = (field?.label ?? c.field).toLowerCase();
        const value = Array.isArray(c.value) ? c.value.join(" or ") : String(c.value ?? "");
        switch (c.op) {
            case "olderThanDays": return `${label} is more than ${humanizeDays(Number(c.value))} ago`;
            case "withinLastDays": return `${label} is within the last ${humanizeDays(Number(c.value))}`;
            case "withinNextDays": return `${label} is within the next ${humanizeDays(Number(c.value))}`;
            case "isNull": return `${label} is empty`;
            case "isNotNull": return `${label} is set`;
            case "in": return `${label} is any of ${value}`;
            case "notIn": return `${label} is none of ${value}`;
            case "gte": return `${label} is at least ${value}`;
            case "lte": return `${label} is at most ${value}`;
            case "neq": return `${label} is not ${value}`;
            default: return `${label} is ${value}`;
        }
    }

    /** Plain-language summary of the active rule, for the scope line and the launch panel. */
    public moverRuleLabel(): string {
        const dropping = this.moverDirection() === "drops";
        if (this.moverMode() === "lastRun") {
            const verb = dropping ? "dropped" : "climbed";
            return `${verb} ${Math.abs(this.moverMagnitude())}+ pts since the last run${this.moverCrossedOnly() ? ", crossing a band" : ""}`;
        }
        const verb = dropping ? "losing" : "gaining";
        const parts = [`${verb} ${Math.abs(this.moverRatePerMonth())}+ pts a month over ${this.moverWindowDays()} days`];
        if (dropping && this.moverSlideCycles() > 0) parts.push(`still sliding ${this.moverSlideCycles()}+ cycles`);
        if (this.moverSteadyOnly()) parts.push("steadily");
        return parts.join(", ");
    }

    /** Refresh the summary counts + the filtered member list from the current mover filter. */
    private async loadMovers(): Promise<void> {
        const id = this.current.modelId();
        if (!id) { this.moverList.set([]); this.moverTotal.set(0); this.moverSummary.set({ dropped: 0, climbed: 0, crossed: 0 }); return; }
        this.loadingMovers.set(true);
        try {
            // The ENGINE resolves the rule (`Sonar: Preview Segment`), not a client-side score query.
            // This surface used to re-express the rule in its own SQL, which meant two definitions of
            // "who is in this cohort" that could disagree — and trajectory rules (slope, sustained
            // decline) can't be expressed that way at all, since they read each member's history.
            // Now the list shows exactly who a launch on the same rule would treat.
            const [summary, preview] = await Promise.all([
                this.scoreRead.moverSummary(id),
                this.interventionService.previewSegment(
                    id, this.moverFilter(), this.moverPage(), this.pageSize,
                    // This view is "who moved most", so ask for mover ordering explicitly.
                    this.moverDirection() === "drops" ? "BiggestDrop" : "BiggestGain",
                ),
            ]);
            this.moverSummary.set(summary);
            if (!preview.ok || !preview.result) {
                this.moverError.set(preview.error ?? "Couldn't resolve this rule.");
                this.moverList.set([]);
                this.moverTotal.set(0);
                return;
            }
            this.moverError.set(null);
            const rows = await this.hydrateMembers(preview.result.members);
            this.moverList.set(rows);
            this.moverTotal.set(preview.result.total);
            this.moverShapeById.set(new Map(
                preview.result.members.filter((m) => m.shape).map((m) => [m.scoreId, m.shape as MemberTrendShape]),
            ));
            // WHY each member is low now comes back with the member, resolved by the engine — the
            // client used to recompute the same drag ranking in a second round trip, which was both
            // slower and a second definition of "the reason" that could drift from the engine's.
            this.moverCauseById.set(new Map(
                preview.result.members.filter((m) => m.reasonLabel).map((m) => [m.scoreId, m.reasonLabel as string]),
            ));
            // Hold the FULL cohort's breakdown while a slice is selected: overwriting it with the
            // narrowed result would collapse it to the one slice and strand the operator inside it
            // with no way to see or switch to the others.
            if (!this.moverReason()) this.moverBreakdown.set(preview.result.breakdown ?? []);
        } finally {
            this.loadingMovers.set(false);
        }
    }

    /**
     * Turn engine-resolved members into the row shape this surface renders. The engine returns
     * identity + score facts (it deliberately knows nothing about display): names come from the
     * anchor entity, band label/key from the band slices already loaded for the distribution, and
     * trend direction from the sign of the delta. No extra score query.
     */
    private async hydrateMembers(members: PreviewMember[]): Promise<ScoredMember[]> {
        const anchorEntityId = this.anchorEntityId();
        const names = anchorEntityId
            ? await this.scoreRead.namesForAnchors(anchorEntityId, members.map((m) => m.anchorRecordId))
            : new Map<string, string>();
        const bandById = new Map(
            this.tiles().filter((t) => t.bandId).map((t) => [t.bandId as string, t]),
        );
        return members.map((m) => {
            const band = m.bandId ? bandById.get(m.bandId) : undefined;
            const delta = m.delta === null ? null : Math.round(m.delta);
            return {
                scoreId: m.scoreId,
                anchorRecordId: m.anchorRecordId,
                name: names.get(m.anchorRecordId) ?? m.anchorRecordId,
                normalizedScore: Math.round(m.normalizedScore ?? 0),
                bandLabel: band?.label ?? "Unbanded",
                bandKey: band?.key ?? "watch",
                computedAt: null,
                delta,
                trendDirection: delta === null || delta === 0 ? "Flat" : delta > 0 ? "Up" : "Down",
                // The preview carries no scoring version, so the drill-down's "scored by vN" badge
                // hides itself rather than showing a number we'd have to invent.
                versionNumber: null,
            } satisfies ScoredMember;
        });
    }

    /** Shared pager handlers — set the page, reload the corresponding list. */
    public async goToMemberPage(p: number): Promise<void> { this.page.set(p); await this.loadMembers(); }
    public async goToMoverPage(p: number): Promise<void> { this.moverPage.set(p); await this.loadMovers(); }

    /** The cause label for a listed member (from the dominant-drag factor), or "" if none. */
    public causeFor(scoreId: string): string { return this.moverCauseById().get(scoreId) ?? ""; }

    /** The cohort's problems, biggest first, capped at what fits on one line. Comes from the engine's
     *  breakdown over the WHOLE cohort — the old version tallied only the visible page, so it read
     *  "what's driving this group" while actually describing 50 of 319 rows. */
    public readonly moverCauseSummary = computed<ReasonSlice[]>(() => this.moverBreakdown().slice(0, 3));

    /** True when this slice is the one currently narrowed to. */
    public isReasonSelected(slice: ReasonSlice): boolean {
        const sel = this.moverReason();
        return !!sel && sel.factorId === slice.factorId && sel.hadData === slice.hadData;
    }

    /**
     * Drill into one problem, or back out of it (clicking the selected slice again clears it).
     *
     * This is the move the whole reason layer exists for: "319 members are sliding" is not something
     * you can act on, but "the 180 of them who stopped attending events" is — one message fits all of
     * them, and it can say something true.
     */
    public async selectReasonSlice(slice: ReasonSlice): Promise<void> {
        // A slice Sonar can't explain has no factor to filter on, so it isn't a target.
        if (!slice.factorId) return;
        this.moverReason.set(this.isReasonSelected(slice) ? null : slice);
        // Deliberately NOT markCustomRule(): a preset names the TREND question ("slipping away"), and
        // drilling into a problem narrows within that question rather than replacing it. Flipping to
        // "Custom" would claim the preset no longer applies when it still does, and it would put a
        // second accent on screen next to the selected slice.
        this.moverPage.set(0);
        await this.loadMovers();
    }

    public toggleRulePane(): void { this.rulePaneOpen.update((v) => !v); }

    /** Member conditions changed — reload from the first page (the cohort is different now). */
    public async setMemberConditions(conditions: MemberCondition[]): Promise<void> {
        this.memberConditions.set(conditions);
        this.markCustomRule();
        this.moverPage.set(0);
        await this.loadMovers();
    }

    /** Ordering changed. This is a RULE change, not a display preference: the run cap truncates the
     *  resolved cohort, so re-ordering changes who a capped launch would treat. */
    public async setRankMode(mode: string): Promise<void> {
        const allowed = ["worstScore", "fastestDecline", "biggestDrop", "priority", "highestValue"] as const;
        const next = (allowed as readonly string[]).includes(mode) ? mode as typeof allowed[number] : "worstScore";
        if (next === this.rankMode()) return;
        this.rankMode.set(next);
        this.moverPage.set(0);
        await this.loadMovers();
    }

    public async setRankValueField(field: string): Promise<void> {
        if (field === this.rankValueField()) return;
        this.rankValueField.set(field);
        this.moverPage.set(0);
        await this.loadMovers();
    }

    /**
     * Targetable fields on the model's anchor entity, read from MJ metadata (no query).
     *
     * Filtered to what a person would actually target on: keys, big text blobs and URLs are noise in a
     * field picker, and the engine would reject most of them anyway. The names are the REAL field names
     * because that is what the engine validates against; only the labels are prettified.
     */
    public readonly memberFields = computed<MemberField[]>(() => {
        const id = this.anchorEntityId();
        if (!id) return [];
        const entity = new Metadata().Entities.find((e) => e.ID === id);
        const out: MemberField[] = [];
        for (const f of entity?.Fields ?? []) {
            if (f.Name.startsWith("__mj")) continue;
            if (/(^ID$|ID$|URL$|Photo|Bio)/.test(f.Name)) continue;
            const kind = fieldKind(f.Type);
            if (!kind) continue;
            out.push({ name: f.Name, label: f.DisplayName || humanizeFieldName(f.Name), kind });
        }
        // Dates first, then numbers, then the rest — alphabetical inside each group. Purely
        // alphabetical put "Bio" and "City" at the top and buried JoinDate, when tenure and dormancy
        // are the questions people actually come here to ask.
        const rank: Record<MemberFieldKind, number> = { date: 0, number: 1, text: 2, boolean: 3 };
        return out.sort((a, b) => (rank[a.kind] - rank[b.kind]) || a.label.localeCompare(b.label));
    });

    /** The subset that can back a value-led ordering. */
    public readonly memberNumberFields = computed(() => this.memberFields().filter((f) => f.kind === "number"));

    /** True when the chosen ordering reads a number off the member record. */
    public readonly rankUsesValue = computed(() => this.rankMode() === "highestValue" || this.rankMode() === "priority");

    /** Back out to the whole cohort. */
    public async clearReasonSlice(): Promise<void> {
        if (!this.moverReason()) return;
        this.moverReason.set(null);
        this.moverPage.set(0);
        await this.loadMovers();
    }

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

/** MJ SQL type -> the kind the member-filter picker offers, or null when it isn't worth targeting on. */
function fieldKind(sqlType: string): MemberFieldKind | null {
    const t = (sqlType || "").toLowerCase();
    if (/^(date|datetime|datetime2|smalldatetime|datetimeoffset)/.test(t)) return "date";
    if (/^(int|bigint|smallint|tinyint|decimal|numeric|float|real|money|smallmoney)/.test(t)) return "number";
    if (/^(bit)/.test(t)) return "boolean";
    if (/(char|text)/.test(t)) return "text";
    return null; // uniqueidentifier, binary, xml and friends
}

/** "YearsInProfession" -> "Years In Profession", for a field with no DisplayName set. */
function humanizeFieldName(name: string): string {
    return name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ").trim();
}

/** Plain-language names for the ordering modes, used in the rule sentence. */
const RANK_LABELS: Record<string, string> = {
    fastestDecline: "fastest-falling",
    biggestDrop: "biggest-drop",
    priority: "highest-priority",
    highestValue: "highest-value",
};
