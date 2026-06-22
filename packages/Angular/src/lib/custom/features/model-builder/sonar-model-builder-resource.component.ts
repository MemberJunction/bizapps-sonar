import { Component, ViewChild, computed, inject, signal } from "@angular/core";
import { RegisterClass } from "@memberjunction/global";
import { BaseResourceComponent } from "@memberjunction/ng-shared";
import { ResourceData } from "@memberjunction/core-entities";
import { Metadata, RunView } from "@memberjunction/core";
import { CompositeFilterDescriptor, FilterFieldInfo, createEmptyFilter, isCompositeFilter } from "@memberjunction/ng-filter-builder";
import { mjBizAppsSonarScoreModelEntity, mjBizAppsSonarTimeWindowEntity } from "@mj-biz-apps/sonar-entities";
import { ScoreModelService } from "../../core/services/score-model.service";
import { FactorService, RubricRow, EditFactorVM } from "../../core/services/factor.service";
import { ScoreBandService } from "../../core/services/score-band.service";
import { SonarEngineService } from "../../core/services/sonar-engine.service";
import { CurrentModelService } from "../../core/services/current-model.service";
import { ToastService } from "../../core/services/toast.service";
import { SonarModelSidebarComponent } from "../../shared/model-sidebar/sonar-model-sidebar.component";
import { FactorSource, FactorWindow } from "./builders/factor-builder/sonar-factor-builder.component";

/** SQL types treated as numeric when mapping anchor columns to filter fields. */
const NUMERIC_TYPES = new Set(["int", "bigint", "smallint", "tinyint", "decimal", "numeric", "money", "smallmoney", "float", "real"]);

/** Filter operators that need no value (so a condition using them is complete on its own). */
const NULL_FILTER_OPERATORS = new Set(["isnull", "isnotnull", "isempty", "isnotempty"]);

/** Band identity used for color coding across the surface. */
type BandKey = "healthy" | "watch" | "atrisk" | "critical";

/** A related entity wired into the model (maps to Model Related Entities). `id` is the ModelRelatedEntity ID (for removal). */
interface RelatedEntity { id: string; alias: string; label: string; source: string; }
/** An entity option for the "map another entity" picker. */
interface EntityOption { id: string; name: string; }
/** One bar in the live band distribution preview. */
interface BandSlice { label: string; pct: number; band: BandKey; }
/** One line in the sample member's "why this score" breakdown. */
interface Contribution { label: string; value: number; }
/** The previewed sample member (from the engine, not sample data). */
interface SampleMember { name: string; score: number; band: BandKey; bandLabel: string; }

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
    public readonly activeView = signal<"rubric" | "factor" | "bands" | "publish" | "newModel">("rubric");
    /** The optional "who gets scored?" filter is collapsed by default to reduce friction —
     *  most models score everyone, so we don't make every author confront a rule builder. */
    public readonly scopeOpen = signal(false);

    private readonly modelService = inject(ScoreModelService);
    private readonly factorService = inject(FactorService);
    private readonly bandService = inject(ScoreBandService);
    private readonly engine = inject(SonarEngineService);
    private readonly current = inject(CurrentModelService);
    private readonly toast = inject(ToastService);

    /** The shared model rail — refreshed after a model is created/published. */
    @ViewChild("sidebar") private sidebar?: SonarModelSidebarComponent;

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
    /** Entities the user can map in — every MJ entity not already wired to this model. */
    public readonly availableEntities = computed<EntityOption[]>(() => {
        const wired = new Set(this.factorSources().map((s) => s.relatedEntityID));
        return new Metadata().Entities
            .filter((e) => !wired.has(e.ID))
            .map((e) => ({ id: e.ID, name: e.Name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    });
    /** Seeded Time Windows for the factor builder's "over …" picker. */
    public readonly timeWindows = signal<FactorWindow[]>([]);

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
        if (!model) return;
        if (filter.filters.length === 0) {
            await this.modelService.setPopulationFilter(model.ID, null);
        } else if (this.isFilterComplete(filter)) {
            await this.modelService.setPopulationFilter(model.ID, JSON.stringify(filter));
        }
        // otherwise: mid-edit (a condition without a value yet) — keep it local, don't persist.
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

    /** Bands were saved — attach the set to the model if it had none, then refresh + close. */
    public async onBandsSaved(bandSetId: string): Promise<void> {
        const model = this.selectedModel();
        if (model && !model.BandSetID) {
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
        this.editFactor.set(null);
        this.activeView.set("factor");
    }

    /** Open the factor builder to EDIT an existing rubric signal — pre-load its full config. */
    public async openFactorEdit(modelFactorId: string): Promise<void> {
        if (this.factorBusy()) return;
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
        await this.sidebar?.refresh();
        this.editFactor.set(null);
        this.activeView.set("rubric");
    }

    /** Busy flag for rubric factor removal. */
    public readonly factorBusy = signal(false);

    /** Live what-if tuning: pending weight edits (modelFactorId → 0–1) + debounce handle. */
    private readonly pendingWeights = new Map<string, number>();
    private tuneTimer: ReturnType<typeof setTimeout> | null = null;

    /**
     * A rubric weight slider moved (pct 0–100). Update the row immediately for a live bar,
     * then debounce: persist the changed weight(s) and re-run the preview so the distribution
     * shifts as you tune. (With a single factor the weight cancels out, so the visible effect
     * needs ≥2 factors — by design.)
     */
    public onWeightInput(modelFactorId: string, pct: number): void {
        this.rubric.set(this.rubric().map((r) => (r.modelFactorId === modelFactorId ? { ...r, weight: pct } : r)));
        this.pendingWeights.set(modelFactorId, pct / 100);
        if (this.tuneTimer) clearTimeout(this.tuneTimer);
        this.tuneTimer = setTimeout(() => void this.applyTuning(), 600);
    }

    /** Flush pending weight edits to the DB, then re-preview. */
    private async applyTuning(): Promise<void> {
        const edits = [...this.pendingWeights.entries()];
        this.pendingWeights.clear();
        for (const [id, w] of edits) await this.factorService.updateWeight(id, w);
        if (this.previewed()) await this.simulate();
    }

    /** Remove a factor from the rubric (unbinds its Model Factor), then refresh. */
    public async removeFactor(modelFactorId: string): Promise<void> {
        const id = this.selectedModelId();
        if (!id || this.factorBusy()) return;
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

    /** Map another entity into the model as a data source, then refresh context. */
    public async addSource(): Promise<void> {
        const model = this.selectedModel();
        const entityId = this.newSourceId();
        if (!model || !entityId || this.sourceBusy()) return;
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
        if (!model || this.sourceBusy()) return;
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
            return;
        }
        this.versionLabel.set(model.Status === "Active" ? "Published" : "Draft — unpublished changes");

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
            return { id: s.ID, alias: s.Alias, label: ent?.DisplayName || ent?.Name || s.Alias, relatedEntityID: s.RelatedEntityID };
        }));
        this.relatedEntities.set(sources.map((s) => {
            const ent = md.Entities.find((e) => e.ID === s.RelatedEntityID);
            return { id: s.ID, alias: s.Alias, label: ent?.DisplayName || ent?.Name || s.Alias, source: s.SourceSystemTag || "—" };
        }));

        // The model's rubric (Model Factors joined to Factors).
        this.rubric.set(await this.factorService.rubricForModel(model.ID));

        // Band count (for the publish gate).
        this.bandCount.set(model.BandSetID ? (await this.bandService.getBands(model.BandSetID)).length : 0);
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
                this.contributions.set((sample.contributions ?? []).map((c) => ({ label: nameByFactor.get(c.modelFactorId) ?? "Signal", value: c.value })));
            } else {
                this.sampleMember.set(null);
                this.contributions.set([]);
            }
            this.previewed.set(true);
        } finally {
            this.simulating.set(false);
        }
    }

    /** True once the model is published (a recompute can persist scores against its version). */
    public readonly canRecompute = computed(() => this.selectedModel()?.Status === "Active");

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
