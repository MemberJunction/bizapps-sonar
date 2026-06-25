import { Component, ElementRef, HostListener, ViewChild, computed, inject, signal } from "@angular/core";
import { RegisterClass } from "@memberjunction/global";
import { BaseResourceComponent } from "@memberjunction/ng-shared";
import { ResourceData } from "@memberjunction/core-entities";
import { Metadata, RunView } from "@memberjunction/core";
import { CompositeFilterDescriptor, FilterFieldInfo, createEmptyFilter, isCompositeFilter } from "@memberjunction/ng-filter-builder";
import { mjBizAppsSonarScoreModelEntity, mjBizAppsSonarScoreModelVersionEntity, mjBizAppsSonarTimeWindowEntity } from "@mj-biz-apps/sonar-entities";
import { ScoreModelService } from "../../core/services/score-model.service";
import { FactorService, RubricRow, EditFactorVM } from "../../core/services/factor.service";
import { ScoreBandService } from "../../core/services/score-band.service";
import { SonarEngineService } from "../../core/services/sonar-engine.service";
import { CurrentModelService } from "../../core/services/current-model.service";
import { pathCountsFromAnchor } from "../../core/entity-graph";
import { ToastService } from "../../core/services/toast.service";
import { SonarModelSidebarComponent } from "../../shared/model-sidebar/sonar-model-sidebar.component";
import { FactorSource, FactorWindow } from "./builders/factor-builder/sonar-factor-builder.component";

/** SQL types treated as numeric when mapping anchor columns to filter fields. */
const NUMERIC_TYPES = new Set(["int", "bigint", "smallint", "tinyint", "decimal", "numeric", "money", "smallmoney", "float", "real"]);

/** Filter operators that need no value (so a condition using them is complete on its own). */
const NULL_FILTER_OPERATORS = new Set(["isnull", "isnotnull", "isempty", "isnotempty"]);


/** Band identity used for color coding across the surface. */
type BandKey = "healthy" | "watch" | "atrisk" | "critical";

/** A rendered wire connecting a data source to a factor input socket in the patch bay overlay. */
interface WireSegment {
    factorId: string;
    modelFactorId: string;
    sourceEntityId: string;
    x1: number; y1: number;
    x2: number; y2: number;
    midX: number; midY: number;
}

/** A related entity wired into the model (maps to Model Related Entities). `id` is the ModelRelatedEntity ID (for removal); `relatedEntityID` is the underlying entity (for factor lineage). */
interface RelatedEntity { id: string; relatedEntityID: string; alias: string; label: string; source: string; }
/** An entity option for the "map another entity" picker. `ambiguous` = reachable by ≥2 FK routes,
 *  so adding it prompts the user to choose a path (a tie). `isAnchor` = the anchor itself: a legit
 *  zero-hop source (factors on the anchor's own fields — tenure, last login), shown apart from the
 *  related entities so it never reads like just another hop. */
interface EntityOption { id: string; name: string; ambiguous: boolean; isAnchor: boolean; }
/** One bar in the live band distribution preview. */
interface BandSlice { label: string; pct: number; band: BandKey; }
/** One line in the sample member's "why this score" breakdown. */
interface Contribution { label: string; value: number; explanation: string | null; }
/** The previewed sample member (from the engine, not sample data). */
interface SampleMember { name: string; score: number; band: BandKey; bandLabel: string; }
/** An editable band row (the model's band set, loaded for in-context range editing). */
interface BandEditVM { id: string; label: string; min: number; max: number; key: BandKey; }

/**
 * Model Builder — the authoring surface: pick/active model, see the related entities wired
 * in, tune the rubric (factors + weights), and watch a live band distribution + sample
 * member preview. Reached via the nav item whose DriverClass = 'SonarModelBuilderResource'.
 *
 * Models, data sources, rubric, anchor + population are LIVE (read via the services / RunView).
 * The right-rail band distribution + sample-member preview are still indicative samples — they
 * need the server-side engine compute Action (RecomputeOrchestrator runs raw SQL and cannot run
 * in the browser); those seams are marked `TODO wire:`. Simulate is inert for the same reason;
 * Publish snapshots via the ScoreModelEntityServer hook (wired through the publish builder).
 */
@RegisterClass(BaseResourceComponent, "SonarModelBuilderResource")
@Component({
    standalone: false,
    selector: "sonar-model-builder-resource",
    templateUrl: "./sonar-model-builder-resource.component.html",
    styleUrls: ["../../shared/styles/sonar-shell.css", "./sonar-model-builder-resource.component.css"],
})
export class SonarModelBuilderResourceComponent extends BaseResourceComponent {
    /** Which view is showing: the rubric (default) or one of the hosted builders. The
     *  builders are opened by the model's own actions (+ Add factor / Edit bands / Publish)
     *  and emit `close` to return here — keeps the builders inside the model workflow. */
    public readonly activeView = signal<"rubric" | "factor" | "bands" | "publish" | "newModel" | "versions">("rubric");
    public readonly activeBottomTab = signal<"sources" | "population">("sources");
    /** The optional "who gets scored?" filter is collapsed by default to reduce friction —
     *  most models score everyone, so we don't make every author confront a rule builder. */
    public readonly scopeOpen = signal(false);
    /** Tracks whether the collapsible settings accordion at the bottom is expanded. */
    public readonly settingsOpen = signal(false);
    /** Tracks whether we score the entire population (no population filter applied). */
    public readonly scoreEveryone = signal(true);

    private readonly modelService = inject(ScoreModelService);
    private readonly factorService = inject(FactorService);
    private readonly bandService = inject(ScoreBandService);
    private readonly engine = inject(SonarEngineService);
    public readonly current = inject(CurrentModelService);
    private readonly toast = inject(ToastService);
    private readonly hostRef = inject(ElementRef);

    /** The shared model rail — refreshed after a model is created/published. */
    @ViewChild("sidebar") private sidebar?: SonarModelSidebarComponent;
    @ViewChild("deckRef") private deckRef?: ElementRef<HTMLElement>;

    // --- header context (resolved from the selected model) ---
    public readonly anchorName = signal("—");
    /** Real count of anchor records in scope, or null while loading / unknown. */
    public readonly population = signal<number | null>(null);
    public readonly versionLabel = signal("Draft — unpublished changes");

    // --- selection (the rail/sidebar drives this; mirrors the shared current model) ---
    public readonly selectedModelId = signal<string | null>(null);
    /** The full selected model entity (for BandSetID / AnchorEntityID the builders need). */
    public readonly selectedModel = signal<mjBizAppsSonarScoreModelEntity | null>(null);

    // --- related entities wired into the model (real Model Related Entities) ---
    public readonly relatedEntities = signal<RelatedEntity[]>([]);
    /** Same data sources shaped for the factor builder's "records in …" picker. */
    public readonly factorSources = signal<FactorSource[]>([]);
    /** "Map another entity" picker state: open flag + the entity being added. */
    public readonly addingSource = signal(false);
    public readonly newSourceId = signal<string | null>(null);
    /** Saving flag for add/remove data-source operations. */
    public readonly sourceBusy = signal(false);
    /** Entities the user can map in: business entities (not `__mj*`) the engine can actually score
     *  against this anchor — reachable by a single FK path (direct or auto-resolved multi-hop) — and
     *  not already wired. One BFS builds the reachable set; we membership-test the rest. */
    public readonly availableEntities = computed<EntityOption[]>(() => {
        const wired = new Set(this.factorSources().map((s) => s.relatedEntityID));
        const anchorId = this.selectedModel()?.AnchorEntityID ?? null;
        const business = new Metadata().Entities.filter(
            (e) => !e.SchemaName?.startsWith("__mj"),
        );
        // Include every entity the engine can reach by ≥1 FK route. count===1 → auto-resolves;
        // count>1 → ambiguous (flagged), so adding it opens the tie chooser instead of failing.
        // The anchor seeds the BFS at count 1, so it survives the filter — kept on purpose (zero-hop
        // factors on its own fields) but tagged isAnchor so it's never mistaken for a related hop.
        const counts = anchorId ? pathCountsFromAnchor(business, anchorId) : null;
        const opts = business
            .filter((e) => !wired.has(e.ID) && (!counts || (counts.get(e.ID) ?? 0) >= 1))
            .map((e) => ({
                id: e.ID,
                name: e.Name,
                ambiguous: e.ID !== anchorId && (counts?.get(e.ID) ?? 1) > 1,
                isAnchor: e.ID === anchorId,
            }))
            // Pin the anchor first; everything else alphabetical.
            .sort((a, b) => (a.isAnchor === b.isAnchor ? a.name.localeCompare(b.name) : a.isAnchor ? -1 : 1));
        return opts;
    });

    /** Seeded Time Windows for the factor builder's "over …" picker. */
    public readonly timeWindows = signal<FactorWindow[]>([]);

    /** Add-source search query (only the matches are shown — we never dump all reachable entities). */
    public readonly sourceQuery = signal("");
    /** Mappable entities matching the query, capped — drag a result onto the canvas (or click). */
    public readonly filteredAvailable = computed<EntityOption[]>(() => {
        const q = this.sourceQuery().trim().toLowerCase();
        const all = this.availableEntities();
        return (q ? all.filter((e) => e.name.toLowerCase().includes(q)) : all).slice(0, 10);
    });
    /** Open the add-source search (behind the "+ Add source" button — nothing exposed until asked). */
    public openAddSource(): void {
        if (this.isPublished()) return;
        this.sourceQuery.set("");
        this.addingSource.set(true);
        queueMicrotask(() => {
            const el = this.hostRef.nativeElement.querySelector?.(".sonar-srcsearch__input") as HTMLInputElement | null;
            el?.focus();
        });
    }
    public closeAddSource(): void { this.addingSource.set(false); }

    // --- rubric: the model's real Model Factors joined to their Factors ---
    public readonly rubric = signal<RubricRow[]>([]);
    /** Number of bands in the model's band set (for the publish gate). */
    public readonly bandCount = signal(0);

    // --- right rail preview (LIVE via "Sonar: Preview Model" Action on Simulate) ---
    public readonly bandDist = signal<BandSlice[]>([]);
    public readonly sampleMember = signal<SampleMember | null>(null);
    public readonly contributions = signal<Contribution[]>([]);
    /** Total anchors scored in the last preview (donut center). */
    public readonly previewTotal = signal(0);
    /** True once a preview has run; gates the "run a preview" hint vs. results. */
    public readonly previewed = signal(false);
    public readonly simulating = signal(false);
    public readonly previewError = signal("");

    // --- in-context band editing (click a band row → anchored popover with inline range) ---
    /** The model's band rows (loaded from its band set) for in-context range tweaking. */
    public readonly bands = signal<BandEditVM[]>([]);
    /** Which band's popover is open (by band key), or null. */
    public readonly editingBandKey = signal<BandKey | null>(null);
    /** Draft range bound to the popover inputs. */
    public readonly bandDraftLabel = signal("");
    public readonly bandDraftMin = signal(0);
    public readonly bandDraftMax = signal(100);
    public readonly bandSaving = signal(false);
    /** True while the "+ Add band" inline form is open. */
    public readonly addingBand = signal(false);

    // --- graph drag-to-map: drag an available entity onto the canvas to wire it as a source ---
    /** Highlights the graph drop zone while an entity chip is being dragged over it. */
    public readonly graphDropActive = signal(false);

    // --- optimistic sample scoring: each factor's normalized value (0–1) from the last server
    //     preview, so the sample score can recompute instantly client-side as weights change. ---
    private sampleNorms = new Map<string, number>();

    // --- drag-and-drop rubric reorder ---
    public readonly dragIndex = signal<number | null>(null);
    public readonly dragOverIndex = signal<number | null>(null);
    /** Debounce handle for silently persisting a reorder after the drag settles. */
    private reorderTimer: ReturnType<typeof setTimeout> | null = null;

    // --- recompute (persist scores) — only for a published model ---
    public readonly recomputing = signal(false);

    /** Band distribution as donut arc segments (SVG stroke-dasharray on a circumference-100 ring). */
    public readonly donutSegments = computed(() => {
        let acc = 0;
        return this.bandDist().map((b) => {
            const seg = { band: b.band, label: b.label, pct: b.pct, dash: `${b.pct} ${100 - b.pct}`, offset: -acc };
            acc += b.pct;
            return seg;
        });
    });

    /** Pixel height of one node row in the data-source graph (anchor ↔ entity wires align to this). */
    private static readonly GRAPH_ROW_H = 58;

    /** Geometry for the visual data-source mapper: the anchor node connects to each wired entity
     *  with a curved SVG wire. Node `y` (and the SVG height) are in the same px space as the node
     *  column, so the wires land on each node's vertical center. Drawn in a 0..100 × 0..H viewBox
     *  (preserveAspectRatio:none) — x is fixed (anchor edge → node edge), y carries the layout. */
    public readonly dataGraph = computed(() => {
        const sources = this.factorSources();
        const rowH = SonarModelBuilderResourceComponent.GRAPH_ROW_H;
        const height = Math.max(rowH, sources.length * rowH);
        const anchorY = height / 2;
        const wires = sources.map((s, i) => {
            const y = (i + 0.5) * rowH;
            return { id: s.id, d: `M0,${anchorY.toFixed(1)} C55,${anchorY.toFixed(1)} 45,${y.toFixed(1)} 100,${y.toFixed(1)}` };
        });
        return { height, wires, nodes: sources };
    });

    // --- population filter -----------------------------------------------------------------
    // The de-Kendo'd <mj-filter-builder> authors ScoreModel.PopulationFilter — "which anchor
    // records this model scores" — as a CompositeFilterDescriptor (MJ's standard {logic,
    // filters[]} JSON). Fields are the anchor entity's real columns (built on model load); the
    // filter is persisted to the model and applied by the engine when it resolves the population
    // (RecomputeOrchestrator.compilePopulationFilter).

    /** Fields the user can filter the anchor population on — the anchor entity's real columns
     *  (rebuilt in loadModelContext from the selected model's anchor). */
    public populationFilterFields: FilterFieldInfo[] = [];

    /** The current population filter (the builder reads + emits this CompositeFilterDescriptor). */
    public populationFilter: CompositeFilterDescriptor = createEmptyFilter();

    /** Persist the authored filter onto ScoreModel.PopulationFilter. Persists only a clear (no
     *  conditions → null, score the whole anchor entity) or a COMPLETE filter — never a half-typed
     *  condition, whose empty value would compile to a misleading WHERE at recompute time. */
    public async onPopulationFilterChange(filter: CompositeFilterDescriptor): Promise<void> {
        this.populationFilter = filter;
        const model = this.selectedModel();
        if (!model || this.isPublished()) return;
        if (filter.filters.length === 0) {
            await this.modelService.setPopulationFilter(model.ID, null);
        } else if (this.isFilterComplete(filter)) {
            await this.modelService.setPopulationFilter(model.ID, JSON.stringify(filter));
        }
        // otherwise: mid-edit (a condition without a value yet) — keep it local, don't persist.
    }

    /** Event handler for selecting a data source from the combobox to instantly map it. */
    public async onAddSourceSelect(entityId: string | null): Promise<void> {
        if (!entityId) return;
        this.newSourceId.set(entityId);
        await this.addSource();
    }

    /** Segmented population toggle: Everyone (clear filter) vs Filtered subset (build a filter). */
    public async setScoreEveryone(on: boolean): Promise<void> {
        if (this.isPublished()) return;
        this.scoreEveryone.set(on);
        this.populationFilter = createEmptyFilter();
        const model = this.selectedModel();
        if (on && model) await this.modelService.setPopulationFilter(model.ID, null);
    }

    /** Event handler for checking/unchecking the "Score all records" checkbox. */
    public async toggleScoreEveryone(event: Event): Promise<void> {
        if (this.isPublished()) return;
        const checked = (event.target as HTMLInputElement).checked;
        this.scoreEveryone.set(checked);
        const model = this.selectedModel();
        if (checked) {
            this.populationFilter = createEmptyFilter();
            if (model) {
                await this.modelService.setPopulationFilter(model.ID, null);
            }
        } else {
            this.populationFilter = createEmptyFilter();
            // Do not persist yet since it is empty/incomplete, but let the user build it
        }
    }

    /** True when every leaf is usable: a null-operator (needs no value), or a value-taking
     *  operator with a non-empty value. Guards against persisting a half-authored filter. */
    private isFilterComplete(node: CompositeFilterDescriptor): boolean {
        return node.filters.every((child) =>
            isCompositeFilter(child)
                ? this.isFilterComplete(child)
                : NULL_FILTER_OPERATORS.has(child.operator) ||
                  (child.value !== undefined && child.value !== null && child.value !== ""),
        );
    }

    /** SQL type → filter-builder field type (mirrors the factor builder's mapping). */
    private filterFieldType(sqlType: string | null): "string" | "number" | "date" | "boolean" {
        const t = (sqlType ?? "").toLowerCase();
        if (NUMERIC_TYPES.has(t)) return "number";
        if (t === "bit") return "boolean";
        if (t.includes("date") || t.includes("time")) return "date";
        return "string";
    }

    /** Parse a persisted PopulationFilter JSON back into a filter tree (empty when absent/invalid). */
    private parsePopulationFilter(raw: string | null): CompositeFilterDescriptor {
        if (!raw) return createEmptyFilter();
        try {
            const parsed = JSON.parse(raw) as CompositeFilterDescriptor;
            return parsed && Array.isArray(parsed.filters) ? parsed : createEmptyFilter();
        } catch {
            return createEmptyFilter();
        }
    }

    public async GetResourceDisplayName(_data: ResourceData): Promise<string> {
        return "Model Builder";
    }
    public async GetResourceIconClass(_data: ResourceData): Promise<string> {
        return "fa-solid fa-sliders";
    }

    public selectBottomTab(tab: "sources" | "population"): void {
        this.activeBottomTab.set(tab);
        if (tab === "sources") {
            queueMicrotask(() => this.recomputeWires());
        }
    }

    public override ngOnInit(): void {
        super.ngOnInit();
        void this.loadTimeWindows();
        void this.hydrate();
    }

    /** Hydrate from the shared current-model selection (if any). The sidebar drives further
     *  selection and, when nothing is selected yet, picks the first model (→ selectModel). */
    private async hydrate(): Promise<void> {
        try {
            const cur = this.current.modelId();
            if (cur) await this.selectModel(cur);
        } finally {
            this.NotifyLoadComplete();
        }
    }

    /** Load the seeded Time Windows once (for the factor builder's "over …" picker). */
    private async loadTimeWindows(): Promise<void> {
        const result = await new RunView().RunView<mjBizAppsSonarTimeWindowEntity>({
            EntityName: "MJ_BizApps_Sonar: Time Windows",
            OrderBy: "Name ASC",
            ResultType: "entity_object",
        });
        if (result.Success) this.timeWindows.set((result.Results ?? []).map((w) => ({ id: w.ID, name: w.Name })));
    }

    /** A model was just created in the setup modal — refresh the rail, select it, close the modal. */
    public async onModelCreated(id: string): Promise<void> {
        await this.selectModel(id);
        await this.sidebar?.refresh();
        this.activeView.set("rubric");
    }

    /** Bands were saved — point the model at the chosen set (covers both "had none" and "switched to
     *  a different set"), then refresh + close. */
    public async onBandsSaved(bandSetId: string): Promise<void> {
        const model = this.selectedModel();
        if (model && model.BandSetID !== bandSetId) {
            await this.modelService.setBandSet(model.ID, bandSetId);
            await this.selectModel(model.ID);
        }
        this.activeView.set("rubric");
    }

    /** Width (%) of a contribution bar, scaled to the largest absolute contribution. */
    public barWidth(value: number): number {
        const max = Math.max(...this.contributions().map((c) => Math.abs(c.value)), 1);
        return Math.round((Math.abs(value) / max) * 100);
    }

    /** The factor being edited (null = the builder is in create mode). */
    public readonly editFactor = signal<EditFactorVM | null>(null);

    /** Open the factor builder to ADD a new signal (clears any prior edit context). */
    public openFactorCreate(): void {
        if (this.isPublished()) return;
        this.editFactor.set(null);
        this.activeView.set("factor");
    }

    /** Open the factor builder to EDIT an existing rubric signal — pre-load its full config. */
    public async openFactorEdit(modelFactorId: string): Promise<void> {
        if (this.factorBusy() || this.isPublished()) return;
        const vm = await this.factorService.loadFactorForEdit(modelFactorId);
        if (!vm) { this.toast.error("Couldn't open that signal for editing."); return; }
        this.editFactor.set(vm);
        this.activeView.set("factor");
    }

    /** Leave the factor builder without saving — clear edit context. */
    public closeFactorBuilder(): void {
        this.editFactor.set(null);
        this.activeView.set("rubric");
    }

    /** A factor was created/edited — refresh the rubric + rail signal count, then return. */
    public async onFactorSaved(): Promise<void> {
        const id = this.selectedModelId();
        if (id) this.rubric.set(await this.factorService.rubricForModel(id));
        queueMicrotask(() => this.recomputeWires());
        await this.sidebar?.refresh();
        this.editFactor.set(null);
        this.activeView.set("rubric");
    }

    /** Busy flag for rubric factor removal. */
    public readonly factorBusy = signal(false);

    /** Live what-if tuning: pending weight edits (modelFactorId → 0–1) + debounce handle. */
    private readonly pendingWeights = new Map<string, number>();
    private tuneTimer: ReturnType<typeof setTimeout> | null = null;
    /** True the instant a weight changes until the re-preview lands — drives the "Recomputing…"
     *  state so tuning feels responsive even though the score itself is a (debounced) server call. */
    public readonly tuning = signal(false);
    /** True whenever the live preview is refreshing (first compute OR a tune) — gates the busy UI. */
    public readonly recomputingPreview = computed(() => this.tuning() || this.simulating());
    /** The data-source node the cursor is on — highlights its wire in the graph mapper. */
    public readonly hoveredSourceId = signal<string | null>(null);
    /** The underlying entity ID of the hovered source — lights up matching rubric rows (lineage). */
    public readonly hoveredSourceEntityId = signal<string | null>(null);
    /** The source entity ID currently being wired (null = not in wiring mode). */
    public readonly wiringSourceEntityId = signal<string | null>(null);
    /** The model-related-entity ID (r.id from relatedEntities) being wired. */
    public readonly wiringSourceId = signal<string | null>(null);
    /** Busy flag while a setFactorSource() call is in flight. */
    public readonly wiringBusy = signal(false);
    /** SVG wire coordinates, recomputed after layout changes. */
    public readonly wireGeometry = signal<WireSegment[]>([]);
    /** Which wire is hovered (by factor modelFactorId), for the disconnect 'x'. */
    public readonly hoveredWireFactorId = signal<string | null>(null);
    /** Mobile tab: 'deck' (default) or 'sandbox'. Used at ≤960px to switch between columns. */
    public readonly mobileTab = signal<'deck' | 'sandbox'>('deck');
    /** Compile-flash pulse on Column 3 the instant a weight changes (proves live execution). */
    public readonly flashing = signal(false);
    private flashTimer: ReturnType<typeof setTimeout> | null = null;

    /** Hover a data-source node → pin its wire + light the rubric rows that read from it (lineage). */
    public hoverSource(r: RelatedEntity): void {
        this.hoveredSourceId.set(r.id);
        this.hoveredSourceEntityId.set(r.relatedEntityID);
    }
    public clearHoverSource(): void {
        this.hoveredSourceId.set(null);
        this.hoveredSourceEntityId.set(null);
    }

    /** Enter wiring mode: user clicked a source socket. */
    public startWiring(sourceId: string, sourceEntityId: string, ev: MouseEvent): void {
        ev.stopPropagation();
        if (this.isPublished() || this.wiringBusy()) return;
        this.wiringSourceId.set(sourceId);
        this.wiringSourceEntityId.set(sourceEntityId);
    }

    /** Cancel wiring mode (clicked outside or Escape). */
    public cancelWiring(): void {
        this.wiringSourceId.set(null);
        this.wiringSourceEntityId.set(null);
    }

    /** A factor input socket was clicked while in wiring mode — connect or reconnect. */
    public async connectFactor(f: RubricRow, ev: MouseEvent): Promise<void> {
        ev.stopPropagation();
        const entityId = this.wiringSourceEntityId();
        if (!entityId || this.wiringBusy()) return;
        this.wiringBusy.set(true);
        try {
            const ok = await this.factorService.setFactorSource(f.factorId, entityId);
            if (ok) {
                this.rubric.set(this.rubric().map(r =>
                    r.modelFactorId === f.modelFactorId ? { ...r, sourceRelatedEntityID: entityId } : r
                ));
                this.cancelWiring();
                queueMicrotask(() => this.recomputeWires());
            } else {
                this.toast.error("Couldn't wire that source. Please try again.");
            }
        } finally {
            this.wiringBusy.set(false);
        }
    }

    /** Sever a factor's source connection. */
    public async disconnectFactor(f: RubricRow, ev: MouseEvent): Promise<void> {
        ev.stopPropagation();
        if (this.wiringBusy() || this.isPublished()) return;
        this.wiringBusy.set(true);
        try {
            const ok = await this.factorService.setFactorSource(f.factorId, null);
            if (ok) {
                this.rubric.set(this.rubric().map(r =>
                    r.modelFactorId === f.modelFactorId ? { ...r, sourceRelatedEntityID: null } : r
                ));
                this.hoveredWireFactorId.set(null);
                queueMicrotask(() => this.recomputeWires());
            } else {
                this.toast.error("Couldn't disconnect that source. Please try again.");
            }
        } finally {
            this.wiringBusy.set(false);
        }
    }

    /** Look up a rubric row by its modelFactorId (used by the SVG disconnect handler). */
    public getRubricRow(modelFactorId: string): RubricRow | undefined {
        return this.rubric().find(r => r.modelFactorId === modelFactorId);
    }

    /** Recompute SVG wire coordinates from current DOM layout. */
    public recomputeWires(): void {
        const container = this.deckRef?.nativeElement;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const segments: WireSegment[] = [];
        for (const factor of this.rubric()) {
            if (!factor.sourceRelatedEntityID) continue;
            const sourceEl = container.querySelector<HTMLElement>(
                `[data-source-entity="${factor.sourceRelatedEntityID}"] .pb-socket--source`
            );
            const factorEl = container.querySelector<HTMLElement>(
                `[data-factor-id="${factor.modelFactorId}"] .pb-socket--factor`
            );
            if (!sourceEl || !factorEl) continue;
            const sRect = sourceEl.getBoundingClientRect();
            const fRect = factorEl.getBoundingClientRect();
            const x1 = sRect.left + sRect.width / 2 - rect.left;
            const y1 = sRect.top + sRect.height / 2 - rect.top;
            const x2 = fRect.left + fRect.width / 2 - rect.left;
            const y2 = fRect.top + fRect.height / 2 - rect.top;
            segments.push({
                factorId: factor.factorId,
                modelFactorId: factor.modelFactorId,
                sourceEntityId: factor.sourceRelatedEntityID,
                x1, y1, x2, y2,
                midX: (x1 + x2) / 2,
                midY: (y1 + y2) / 2,
            });
        }
        this.wireGeometry.set(segments);
    }

    @HostListener('window:resize')
    public onResize(): void {
        this.recomputeWires();
    }

    /** Brief "compiling" flash on the sandbox column whenever the rubric changes. */
    private pulseCompile(): void {
        this.flashing.set(true);
        if (this.flashTimer) clearTimeout(this.flashTimer);
        this.flashTimer = setTimeout(() => this.flashing.set(false), 280);
    }

    /**
     * A rubric weight slider moved (pct 0–100). Update the row immediately for a live bar AND
     * flip the preview into a "recomputing" state right away (instant feedback), then debounce:
     * persist the changed weight(s) and re-run the preview so the distribution shifts as you tune.
     * (With a single factor the weight cancels out, so the visible effect needs ≥2 factors.)
     */
    public onWeightInput(modelFactorId: string, pct: number): void {
        if (this.isPublished()) return;
        this.rubric.set(this.rubric().map((r) => (r.modelFactorId === modelFactorId ? { ...r, weight: pct } : r)));
        this.recomputeSampleOptimistic();             // OPTIMISTIC: update the sample score instantly, client-side
        this.pulseCompile();                          // compile-flash on Column 3 (proves live execution)
        this.pendingWeights.set(modelFactorId, pct / 100);
        if (this.previewed()) this.tuning.set(true);  // subtle background-sync cue for the distribution
        if (this.tuneTimer) clearTimeout(this.tuneTimer);
        this.tuneTimer = setTimeout(() => void this.applyTuning(), 400);
    }

    /** Recompute the sample member's score + waterfall INSTANTLY from cached normalized values ×
     *  current weights (engine formula: Σwᵢ·normᵢ / Σwᵢ × 100). The debounced server preview
     *  silently corrects any drift. No-op until a server preview has seeded the norms. */
    private recomputeSampleOptimistic(): void {
        const sample = this.sampleMember();
        if (!sample || this.sampleNorms.size === 0) return;
        let num = 0, den = 0;
        const contribs: Contribution[] = [];
        // Keep each factor's "why" while weights move (optimistic re-score has no fresh server reason).
        const whyByLabel = new Map(this.contributions().map((c) => [c.label, c.explanation]));
        for (const r of this.rubric()) {
            const norm = this.sampleNorms.get(r.modelFactorId);
            if (norm == null) continue;
            const w = r.weight / 100;
            num += w * norm;
            den += w;
            contribs.push({ label: r.name, value: Math.round(w * norm * 100) / 100, explanation: whyByLabel.get(r.name) ?? null });
        }
        const score = den > 0 ? Math.round((num / den) * 100) : 0;
        const band = this.bands().find((b) => score >= b.min && score <= b.max) ?? null;
        this.sampleMember.set({ name: sample.name, score, band: band?.key ?? sample.band, bandLabel: band?.label ?? sample.bandLabel });
        this.contributions.set(contribs);
    }

    /** Flush pending weight edits to the DB, then re-preview. Clears the tuning flag when done. */
    private async applyTuning(): Promise<void> {
        try {
            const edits = [...this.pendingWeights.entries()];
            this.pendingWeights.clear();
            for (const [id, w] of edits) await this.factorService.updateWeight(id, w);
            if (this.previewed()) await this.simulate();
        } finally {
            this.tuning.set(false);
        }
    }

    // ── In-context band editing (anchored popover) ───────────────────────────────────────────
    /** Element to restore focus to when a popover closes (smart focus management). */
    private lastFocused: HTMLElement | null = null;

    /** The loaded band row for a band key (its min/max), for display in the legend row + popover. */
    public bandFor(key: BandKey): BandEditVM | null {
        return this.bands().find((b) => b.key === key) ?? null;
    }

    /** Open the inline range editor for a band — seed the draft, then autofocus + select the min
     *  input so the user can type immediately. Remembers the prior focus to restore on close. */
    public openBandEditor(key: BandKey): void {
        if (this.isPublished()) return;
        const b = this.bands().find((x) => x.key === key);
        if (!b) return;
        this.lastFocused = document.activeElement as HTMLElement | null;
        this.addingBand.set(false);
        this.bandDraftLabel.set(b.label);
        this.bandDraftMin.set(b.min);
        this.bandDraftMax.set(b.max);
        this.editingBandKey.set(key);
        queueMicrotask(() => {
            const el = this.hostRef.nativeElement.querySelector?.(".sonar-bandpop__input") as HTMLInputElement | null;
            el?.focus();
            el?.select();
        });
    }

    /** Close the band popover and return focus to where it was. */
    public closeBandEditor(): void {
        if (!this.editingBandKey()) return;
        this.editingBandKey.set(null);
        this.lastFocused?.focus?.();
        this.lastFocused = null;
    }

    /** Persist the edited band label + range, update locally + optimistically, then silently
     *  re-preview so the distribution reflects the new bands. */
    public async saveBandRange(): Promise<void> {
        const key = this.editingBandKey();
        const b = key ? this.bands().find((x) => x.key === key) : null;
        if (!b || this.bandSaving()) return;
        const label = this.bandDraftLabel().trim() || b.label;
        const min = Math.round(this.bandDraftMin());
        const max = Math.round(this.bandDraftMax());
        this.bandSaving.set(true);
        try {
            if (!(await this.bandService.updateBand(b.id, label, min, max))) {
                this.toast.error("Couldn't update that band. Please try again.");
                return;
            }
            this.bands.set(this.bands().map((x) => (x.id === b.id ? { ...x, label, min, max, key: this.bandKey(label) } : x)));
            this.recomputeSampleOptimistic();          // sample's band may change instantly
            this.closeBandEditor();
            if (this.previewed()) { this.tuning.set(true); void this.applyTuning(); } // silent distribution sync
        } finally {
            this.bandSaving.set(false);
        }
    }

    /** Delete the band currently open in the editor, then reload + re-preview. */
    public async deleteBand(): Promise<void> {
        const key = this.editingBandKey();
        const b = key ? this.bands().find((x) => x.key === key) : null;
        if (!b || this.bandSaving()) return;
        this.bandSaving.set(true);
        try {
            if (!(await this.bandService.deleteBand(b.id))) { this.toast.error("Couldn't delete that band."); return; }
            this.closeBandEditor();
            const m = this.selectedModel();
            if (m) await this.selectModel(m.ID);
        } finally {
            this.bandSaving.set(false);
        }
    }

    /** Open the inline "+ Add band" form, seeded to start where the last band ends. */
    public openAddBand(): void {
        if (this.isPublished()) return;
        this.editingBandKey.set(null);
        const last = this.bands()[this.bands().length - 1];
        this.bandDraftLabel.set("");
        this.bandDraftMin.set(last ? Math.min(100, last.max) : 0);
        this.bandDraftMax.set(100);
        this.addingBand.set(true);
        queueMicrotask(() => {
            const el = this.hostRef.nativeElement.querySelector?.(".sonar-bandadd__input") as HTMLInputElement | null;
            el?.focus();
            el?.select();
        });
    }
    public closeAddBand(): void { this.addingBand.set(false); }

    /** Create a new band (creating the model's band set first if it has none), then reload. */
    public async createBand(): Promise<void> {
        const model = this.selectedModel();
        if (!model || this.bandSaving()) return;
        this.bandSaving.set(true);
        try {
            let bandSetId = model.BandSetID;
            if (!bandSetId) {
                const set = await this.bandService.saveSet({ name: `${model.Name} bands` });
                if (!set) { this.toast.error("Couldn't create a band set."); return; }
                bandSetId = set.ID;
                await this.modelService.setBandSet(model.ID, bandSetId);
            }
            const saved = await this.bandService.saveBand({
                bandSetID: bandSetId,
                label: this.bandDraftLabel().trim() || "New band",
                minScore: Math.round(this.bandDraftMin()),
                maxScore: Math.round(this.bandDraftMax()),
                severity: this.bands().length,
                colorHex: "#8b5cf6",
                isTerminal: false,
            });
            if (!saved) { this.toast.error("Couldn't add that band."); return; }
            this.addingBand.set(false);
            await this.selectModel(model.ID);
        } finally {
            this.bandSaving.set(false);
        }
    }

    // ── Graph drag-to-map: drag an available entity chip onto the canvas to wire it ──────────
    /** Begin dragging an available-entity chip; carry its ID for the drop. */
    public onSourceDragStart(entityId: string, ev: DragEvent): void {
        ev.dataTransfer?.setData("text/plain", entityId);
        if (ev.dataTransfer) ev.dataTransfer.effectAllowed = "copy";
    }
    /** Canvas is a valid drop target while dragging an entity. */
    public onGraphDragOver(ev: DragEvent): void {
        if (this.isPublished()) return;
        ev.preventDefault();
        if (ev.dataTransfer) ev.dataTransfer.dropEffect = "copy";
        this.graphDropActive.set(true);
    }
    public onGraphDragLeave(): void { this.graphDropActive.set(false); }
    /** Drop an entity onto the canvas → wire it as a data source. */
    public async onGraphDrop(ev: DragEvent): Promise<void> {
        ev.preventDefault();
        this.graphDropActive.set(false);
        const entityId = ev.dataTransfer?.getData("text/plain");
        if (entityId) { this.newSourceId.set(entityId); await this.addSource(); }
    }

    // ── Drag-and-drop rubric reorder ─────────────────────────────────────────────────────────
    /** Begin dragging the factor at `index`. */
    public onFactorDragStart(index: number): void {
        if (this.isPublished()) return;
        this.dragIndex.set(index);
    }

    /** Hovering over `index` while dragging — reorder the list live (optimistic) for a smooth feel. */
    public onFactorDragOver(index: number, ev: DragEvent): void {
        ev.preventDefault();
        const from = this.dragIndex();
        this.dragOverIndex.set(index);
        if (from == null || from === index) return;
        const list = [...this.rubric()];
        const [moved] = list.splice(from, 1);
        list.splice(index, 0, moved);
        this.rubric.set(list);
        this.dragIndex.set(index);
    }

    /** Drop / end — clear drag state and silently persist the new DisplayOrder. */
    public onFactorDragEnd(): void {
        this.dragIndex.set(null);
        this.dragOverIndex.set(null);
        if (this.reorderTimer) clearTimeout(this.reorderTimer);
        const ids = this.rubric().map((r) => r.modelFactorId);
        this.reorderTimer = setTimeout(() => void this.factorService.reorder(ids), 300);
    }

    // ── Keyboard-first workflow ──────────────────────────────────────────────────────────────
    /** Global hotkeys: ⌘/Ctrl+S or 's' = Simulate · 'a' = Add factor · Esc = close popover/modal.
     *  Ignored while typing in a field (except Escape) so it doesn't hijack normal input. */
    @HostListener("document:keydown", ["$event"])
    public onHotkey(ev: KeyboardEvent): void {
        const el = ev.target as HTMLElement | null;
        const tag = el?.tagName?.toLowerCase();
        const typing = tag === "input" || tag === "textarea" || tag === "select" || !!el?.isContentEditable;
        if (ev.key === "Escape") {
            if (this.wiringSourceId()) { this.cancelWiring(); ev.preventDefault(); return; }
            if (this.editingBandKey()) { this.closeBandEditor(); ev.preventDefault(); }
            else if (this.addingSource()) { this.addingSource.set(false); }
            else if (this.activeView() !== "rubric") { this.activeView.set("rubric"); }
            return;
        }
        const meta = ev.metaKey || ev.ctrlKey;
        if (meta && ev.key.toLowerCase() === "s") {
            ev.preventDefault();
            if (this.selectedModelId() && !this.simulating()) void this.simulate();
            return;
        }
        if (typing || meta || ev.altKey) return;
        if (ev.key === "s") {
            if (this.selectedModelId() && !this.simulating()) void this.simulate();
        } else if (ev.key === "a") {
            ev.preventDefault();
            this.openFactorCreate();
        }
    }

    /** Remove a factor from the rubric (unbinds its Model Factor), then refresh. */
    public async removeFactor(modelFactorId: string): Promise<void> {
        const id = this.selectedModelId();
        if (!id || this.factorBusy() || this.isPublished()) return;
        this.factorBusy.set(true);
        try {
            if (await this.factorService.unbind(modelFactorId)) {
                this.rubric.set(await this.factorService.rubricForModel(id));
                await this.sidebar?.refresh();
            } else {
                this.toast.error("Couldn't remove that signal. Please try again.");
            }
        } finally {
            this.factorBusy.set(false);
        }
    }

    /** Map another entity into the model as a data source, then refresh context. Ambiguous sources
     *  (reachable several FK ways) ARE addable here; the path is chosen in-context in the factor
     *  builder when the source is first used for a signal (see sonar-factor-builder). */
    public async addSource(): Promise<void> {
        const model = this.selectedModel();
        const entityId = this.newSourceId();
        if (!model || !entityId || this.sourceBusy() || this.isPublished()) return;
        this.sourceBusy.set(true);
        try {
            const ent = new Metadata().Entities.find((e) => e.ID === entityId);
            const alias = (ent?.Name ?? entityId).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
            const added = await this.modelService.addDataSource({ modelId: model.ID, relatedEntityID: entityId, alias });
            if (!added) { this.toast.error("Couldn't add that data source. Please try again."); return; }
            this.newSourceId.set(null);
            this.addingSource.set(false);
            await this.loadModelContext(model);
            this.toast.success(`Added ${ent?.DisplayName || ent?.Name || "data source"} as a data source.`);
        } finally {
            this.sourceBusy.set(false);
        }
    }

    /** Remove a data source (deletes its Model Related Entity), then refresh context. */
    public async removeSource(modelRelatedEntityId: string): Promise<void> {
        const model = this.selectedModel();
        if (!model || this.sourceBusy() || this.isPublished()) return;
        this.sourceBusy.set(true);
        try {
            if (await this.modelService.removeDataSource(modelRelatedEntityId)) await this.loadModelContext(model);
            else this.toast.error("Couldn't remove that data source. Please try again.");
        } finally {
            this.sourceBusy.set(false);
        }
    }

    /** Select a model in the rail and hydrate the full entity + its context. Also publishes
     *  the choice to the shared current-model context so other surfaces stay in sync. */
    public async selectModel(id: string): Promise<void> {
        this.selectedModelId.set(id);
        this.current.select(id);
        const model = await this.modelService.get(id);
        this.selectedModel.set(model);
        await this.loadModelContext(model);
    }

    /** Load everything the surface shows for a model: anchor, population, sources, rubric. */
    private async loadModelContext(model: mjBizAppsSonarScoreModelEntity | null): Promise<void> {
        if (!model) {
            this.relatedEntities.set([]);
            this.factorSources.set([]);
            this.rubric.set([]);
            this.anchorName.set("—");
            this.population.set(null);
            this.populationFilterFields = [];
            this.populationFilter = createEmptyFilter();
            this.scoreEveryone.set(true);
            return;
        }
        await this.setVersionLabel(model);

        const md = new Metadata();
        const anchor = md.Entities.find((e) => e.ID === model.AnchorEntityID);
        this.anchorName.set(anchor?.DisplayName || anchor?.Name || "—");

        // Population filter: the anchor's real columns + the model's saved filter.
        this.populationFilterFields = anchor
            ? anchor.Fields
                  .filter((f) => !f.IsPrimaryKey && !f.Name.startsWith("__mj_"))
                  .map((f) => ({ name: f.Name, displayName: f.DisplayName || f.Name, type: this.filterFieldType(f.Type) }))
            : [];
        this.populationFilter = this.parsePopulationFilter(model.PopulationFilter);
        this.scoreEveryone.set(!model.PopulationFilter || this.parsePopulationFilter(model.PopulationFilter).filters.length === 0);

        // Real count of anchor records in scope.
        this.population.set(null);
        if (anchor) {
            const countResult = await new RunView().RunView({ EntityName: anchor.Name, ResultType: "count_only" });
            this.population.set(countResult?.Success ? countResult.TotalRowCount : null);
        }

        // Data sources wired into the model (shaped for both the info card and the factor picker).
        const sources = await this.modelService.dataSources(model.ID);
        this.factorSources.set(sources.map((s) => {
            const ent = md.Entities.find((e) => e.ID === s.RelatedEntityID);
            return { id: s.ID, alias: s.Alias, label: ent?.DisplayName || ent?.Name || s.Alias, relatedEntityID: s.RelatedEntityID, relationshipPath: s.RelationshipPath };
        }));
        this.relatedEntities.set(sources.map((s) => {
            const ent = md.Entities.find((e) => e.ID === s.RelatedEntityID);
            return { id: s.ID, relatedEntityID: s.RelatedEntityID, alias: s.Alias, label: ent?.DisplayName || ent?.Name || s.Alias, source: s.SourceSystemTag || "—" };
        }));

        // The model's rubric (Model Factors joined to Factors).
        this.rubric.set(await this.factorService.rubricForModel(model.ID));
        queueMicrotask(() => this.recomputeWires());

        // Band set (count for the publish gate + editable rows for in-context range tweaking).
        const bandRows = model.BandSetID ? await this.bandService.getBands(model.BandSetID) : [];
        this.bandCount.set(bandRows.length);
        this.bands.set(bandRows.map((b) => ({ id: b.ID, label: b.Label, min: b.MinScore ?? 0, max: b.MaxScore ?? 0, key: this.bandKey(b.Label) })));
        this.editingBandKey.set(null);

        // Auto-run the live preview so the sandbox populates without a manual "Simulate" click —
        // the right rail is a LIVE sandbox now. Reset first; only preview when there's a rubric to
        // score (and bands to map into). Fire-and-forget so model switching stays snappy.
        this.previewed.set(false);
        this.bandDist.set([]);
        this.sampleMember.set(null);
        this.contributions.set([]);
        if (this.rubric().length > 0 && this.bandCount() > 0) void this.simulate();
    }

    /** Header version label: "Published · v3" when active (resolving the current version's number),
     *  else the draft notice. */
    private async setVersionLabel(model: mjBizAppsSonarScoreModelEntity): Promise<void> {
        if (model.Status !== "Active") {
            this.versionLabel.set("Draft — unpublished changes");
            return;
        }
        let label = "Published";
        if (model.CurrentVersionID) {
            const res = await new RunView().RunView<mjBizAppsSonarScoreModelVersionEntity>({
                EntityName: "MJ_BizApps_Sonar: Score Model Versions",
                ExtraFilter: `ID='${model.CurrentVersionID}'`,
                ResultType: "entity_object",
            });
            const v = res.Success ? res.Results?.[0] : null;
            if (v) label = `Published · v${v.VersionNumber}`;
        }
        this.versionLabel.set(label);
    }

    /** A rollback published a new version — reload the model context (rubric + status + version changed). */
    public async onVersionRestored(): Promise<void> {
        const id = this.selectedModelId();
        if (id) await this.selectModel(id);
        await this.sidebar?.refresh();
    }

    /** A version was published — refresh the model context (status flips) and return to the rubric. */
    public async onPublished(): Promise<void> {
        const id = this.selectedModelId();
        if (id) await this.selectModel(id);
        await this.sidebar?.refresh();
        this.activeView.set("rubric");
    }

    /**
     * Run a live preview via the "Sonar: Preview Model" Action (engine computeScores, no
     * persistence) and populate the right rail with the real band distribution + sample member.
     */
    public async simulate(): Promise<void> {
        const id = this.selectedModelId();
        if (!id || this.simulating()) return;
        this.simulating.set(true);
        this.previewError.set("");
        try {
            const res = await this.engine.previewModel(id);
            if (res.errors.length > 0) this.previewError.set(res.errors[0]);
            this.previewTotal.set(res.totalScored ?? 0);
            this.bandDist.set((res.bandDistribution ?? []).map((b) => ({ label: b.label, pct: b.pct, band: this.bandKey(b.label) })));
            const sample = res.sampleMember;
            if (sample) {
                const name = await this.resolveAnchorName(sample.anchorId);
                this.sampleMember.set({ name, score: sample.score, band: this.bandKey(sample.band ?? ""), bandLabel: sample.band ?? "Unscored" });
                const nameByFactor = new Map(this.rubric().map((r) => [r.modelFactorId, r.name]));
                this.contributions.set((sample.contributions ?? []).map((c) => ({ label: nameByFactor.get(c.modelFactorId) ?? "Signal", value: c.value, explanation: c.explanation })));
                // Cache each factor's normalized value (server value = weightᵢ·normᵢ) for optimistic re-scoring.
                this.sampleNorms = new Map();
                const wByFactor = new Map(this.rubric().map((r) => [r.modelFactorId, r.weight / 100]));
                for (const c of sample.contributions ?? []) {
                    const w = wByFactor.get(c.modelFactorId) ?? 0;
                    if (w > 0) this.sampleNorms.set(c.modelFactorId, c.value / w);
                }
            } else {
                this.sampleMember.set(null);
                this.contributions.set([]);
                this.sampleNorms = new Map();
            }
            this.previewed.set(true);
        } finally {
            this.simulating.set(false);
        }
    }

    /** True once the model is published (a recompute can persist scores against its version). */
    public readonly canRecompute = computed(() => this.selectedModel()?.Status === "Active");

    /** Published models are LOCKED for editing — scores stay reproducible against the current
     *  version. Rubric/factor/source/band/population edits are disabled until the model is
     *  unpublished to a draft (then re-published as a new version). */
    public readonly isPublished = computed(() => this.selectedModel()?.Status === "Active");
    public readonly unpublishing = signal(false);

    /** Drop a published model back to Draft so it can be edited, then refresh + return to the rubric. */
    public async unpublishToEdit(): Promise<void> {
        const id = this.selectedModelId();
        if (!id || this.unpublishing()) return;
        this.unpublishing.set(true);
        try {
            if (await this.modelService.unpublishToDraft(id)) {
                await this.selectModel(id);
                await this.sidebar?.refresh();
                this.toast.success("Unpublished to a draft — edit freely, then publish a new version.");
            } else {
                this.toast.error("Couldn't unpublish this model. Please try again.");
            }
        } finally {
            this.unpublishing.set(false);
        }
    }

    /**
     * Recompute the model: compute AND persist a full run via the "Sonar: Recompute Model"
     * Action (needs a published model). Surfaces the outcome inline, then re-runs the preview
     * so the right rail reflects the just-persisted distribution.
     */
    public async recompute(): Promise<void> {
        const id = this.selectedModelId();
        if (!id || this.recomputing()) return;
        this.recomputing.set(true);
        try {
            const res = await this.engine.recompute(id);
            if (res.errors.length > 0 || res.status === "Failed") {
                this.toast.error(res.errors[0] || "Recompute failed.");
            } else {
                this.toast.success(`Recompute ${res.status.toLowerCase()} — ${res.recordsScored} member${res.recordsScored === 1 ? "" : "s"} scored.`);
                await this.simulate();
            }
        } finally {
            this.recomputing.set(false);
        }
    }

    /** Resolve a friendly display name for a scored anchor record (the engine returns only its ID). */
    private async resolveAnchorName(anchorId: string): Promise<string> {
        const model = this.selectedModel();
        const ent = model ? new Metadata().Entities.find((e) => e.ID === model.AnchorEntityID) : null;
        if (!ent) return anchorId;
        const pk = ent.PrimaryKeys[0]?.Name ?? "ID";
        const res = await new RunView().RunView({ EntityName: ent.Name, ExtraFilter: `${pk}='${anchorId}'`, ResultType: "simple" });
        const row = (res.Success ? res.Results?.[0] : null) as Record<string, unknown> | null;
        if (!row) return anchorId;
        const pick = (k: string): string | null => { const v = row[k]; return v != null && v !== "" ? String(v) : null; };
        const nameField = ent.Fields.find((f) => f.IsNameField)?.Name;
        const composed = [pick("FirstName"), pick("LastName")].filter(Boolean).join(" ");
        return (nameField ? pick(nameField) : null) || composed || pick("Name") || pick("Email") || anchorId;
    }

    /** Map an arbitrary band label to a color key for the preview bars. */
    private bandKey(label: string): BandKey {
        const l = label.toLowerCase();
        if (l.includes("healthy")) return "healthy";
        if (l.includes("critical")) return "critical";
        if (l.includes("risk")) return "atrisk";
        return "watch";
    }
}
