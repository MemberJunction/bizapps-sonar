import { Component, inject, signal } from "@angular/core";
import { RegisterClass } from "@memberjunction/global";
import { BaseResourceComponent } from "@memberjunction/ng-shared";
import { ResourceData } from "@memberjunction/core-entities";
import { Metadata, RunView } from "@memberjunction/core";
import { CompositeFilterDescriptor, FilterFieldInfo, createEmptyFilter } from "@memberjunction/ng-filter-builder";
import { mjBizAppsSonarScoreModelEntity, mjBizAppsSonarTimeWindowEntity } from "@mj-biz-apps/sonar-entities";
import { ScoreModelService } from "../services/score-model.service";
import { FactorService, RubricRow } from "../services/factor.service";
import { ScoreBandService } from "../services/score-band.service";
import { SonarEngineService } from "../services/sonar-engine.service";
import { FactorSource, FactorWindow } from "../factor-builder/sonar-factor-builder.component";

/** A model in the left-rail list (loaded live from the DB). */
interface ModelRow { id: string; name: string; }
/** Band identity used for color coding across the surface. */
type BandKey = "healthy" | "watch" | "atrisk" | "critical";

/** A related entity wired into the model (maps to Model Related Entities). */
interface RelatedEntity { alias: string; label: string; source: string; }
/** One bar in the live band distribution preview. */
interface BandSlice { label: string; pct: number; band: BandKey; }
/** One line in the sample member's "why this score" breakdown. */
interface Contribution { label: string; value: number; }
/** The previewed sample member (from the engine, not sample data). */
interface SampleMember { name: string; score: number; band: BandKey; }

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
    styleUrls: ["../sonar-shell.css", "./sonar-model-builder-resource.component.css"],
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

    // --- header context (resolved from the selected model) ---
    public readonly anchorName = signal("—");
    /** Real count of anchor records in scope, or null while loading / unknown. */
    public readonly population = signal<number | null>(null);
    public readonly versionLabel = signal("Draft — unpublished changes");

    // --- left rail: LIVE model list (real rows from the DB via ScoreModelService) ---
    public readonly liveModels = signal<ModelRow[]>([]);
    public readonly selectedModelId = signal<string | null>(null);
    /** The full selected model entity (for BandSetID / AnchorEntityID the builders need). */
    public readonly selectedModel = signal<mjBizAppsSonarScoreModelEntity | null>(null);

    // --- related entities wired into the model (real Model Related Entities) ---
    public readonly relatedEntities = signal<RelatedEntity[]>([]);
    /** Same data sources shaped for the factor builder's "records in …" picker. */
    public readonly factorSources = signal<FactorSource[]>([]);
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
    /** True once a preview has run; gates the "run a preview" hint vs. results. */
    public readonly previewed = signal(false);
    public readonly simulating = signal(false);
    public readonly previewError = signal("");

    // --- population filter spike (UI only) -----------------------------------------------
    // Demonstrates the de-Kendo'd <mj-filter-builder> as the replacement for the deprecated
    // Kendo expression UI. This authors ScoreModel.PopulationFilter — "which anchor records
    // are in scope" — as a CompositeFilterDescriptor (MJ's standard {logic, filters[]} JSON).
    //
    // TODO wire: `populationFilterFields` is hardcoded sample metadata. Real wiring builds it
    // from the anchor entity's MJ field metadata (md.EntityByName(anchor).Fields -> FilterFieldInfo).
    // TODO wire: persist `populationFilter` onto the ScoreModel entity once the schema + CodeGen land.

    /** Fields the user can filter the anchor population on (sample data shaped like a Member entity). */
    public populationFilterFields: FilterFieldInfo[] = [
        { name: "Status", displayName: "Membership status", type: "string",
          valueList: [
              { value: "Active", label: "Active" },
              { value: "Lapsed", label: "Lapsed" },
              { value: "Pending", label: "Pending" },
          ] },
        { name: "MembershipType", displayName: "Membership type", type: "string" },
        { name: "JoinDate", displayName: "Join date", type: "date" },
        { name: "RenewalDate", displayName: "Renewal date", type: "date" },
        { name: "AutoRenew", displayName: "Auto-renew enabled", type: "boolean" },
    ];

    /** The current population filter (the builder reads + emits this CompositeFilterDescriptor). */
    public populationFilter: CompositeFilterDescriptor = createEmptyFilter();

    /** Called whenever the user edits a rule in the filter builder. Spike: just store it. */
    public onPopulationFilterChange(filter: CompositeFilterDescriptor): void {
        this.populationFilter = filter;
        // TODO wire: mark the ScoreModel dirty / enable Publish once persistence exists.
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
        void this.loadModels();
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

    /** Load the live model list, then release the Explorer loading screen. */
    private async loadModels(): Promise<void> {
        try {
            const models = await this.modelService.list();
            this.liveModels.set(models.map((m) => ({ id: m.ID, name: m.Name })));
            if (!this.selectedModelId() && models.length > 0) {
                await this.selectModel(models[0].ID);
            }
        } finally {
            // Always notify — the Explorer loading screen waits on this or it hangs.
            this.NotifyLoadComplete();
        }
    }

    /** A model was just created in the setup modal — refresh, select it, close the modal. */
    public async onModelCreated(id: string): Promise<void> {
        await this.loadModels();
        await this.selectModel(id);
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

    /** A factor was created + bound — refresh the rubric and return to it. */
    public async onFactorSaved(): Promise<void> {
        const id = this.selectedModelId();
        if (id) this.rubric.set(await this.factorService.rubricForModel(id));
        this.activeView.set("rubric");
    }

    /** Select a model in the left rail and hydrate the full entity + its context. */
    public async selectModel(id: string): Promise<void> {
        this.selectedModelId.set(id);
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
            return;
        }
        this.versionLabel.set(model.Status === "Active" ? "Published" : "Draft — unpublished changes");

        const md = new Metadata();
        const anchor = md.Entities.find((e) => e.ID === model.AnchorEntityID);
        this.anchorName.set(anchor?.DisplayName || anchor?.Name || "—");

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
            return { alias: s.Alias, label: ent?.DisplayName || ent?.Name || s.Alias, source: s.SourceSystemTag || "—" };
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
            this.bandDist.set(res.bandDistribution.map((b) => ({ label: b.label, pct: b.pct, band: this.bandKey(b.label) })));
            const sample = res.sampleMember;
            if (sample) {
                this.sampleMember.set({ name: sample.anchorId, score: sample.score, band: this.bandKey(sample.band ?? "") });
                const nameByFactor = new Map(this.rubric().map((r) => [r.modelFactorId, r.name]));
                this.contributions.set(sample.contributions.map((c) => ({ label: nameByFactor.get(c.modelFactorId) ?? "Signal", value: c.value })));
            } else {
                this.sampleMember.set(null);
                this.contributions.set([]);
            }
            this.previewed.set(true);
        } finally {
            this.simulating.set(false);
        }
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
