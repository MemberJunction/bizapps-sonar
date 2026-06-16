import { Component, inject, signal } from "@angular/core";
import { RegisterClass } from "@memberjunction/global";
import { BaseResourceComponent } from "@memberjunction/ng-shared";
import { ResourceData } from "@memberjunction/core-entities";
import { CompositeFilterDescriptor, FilterFieldInfo, createEmptyFilter } from "@memberjunction/ng-filter-builder";
import { ScoreModelService } from "../services/score-model.service";

/** A model in the left-rail list (loaded live from the DB). */
interface ModelRow { id: string; name: string; }
/** Band identity used for color coding across the surface. */
type BandKey = "healthy" | "watch" | "atrisk" | "critical";
/** How a factor's weight combines into the score (drives the chip color/label). */
type WeightMode = "additive" | "penalty";

/** A related entity wired into the model (maps to Model Related Entities). */
interface RelatedEntity { alias: string; label: string; source: string; }
/** A rubric row — a Factor bound into the model via a ModelFactor with a weight. */
interface RubricFactor { name: string; detail: string; weight: number; mode: WeightMode; renewalRelative?: boolean; }
/** One bar in the live band distribution preview. */
interface BandSlice { label: string; pct: number; band: BandKey; }
/** One line in the sample member's "why this score" breakdown. */
interface Contribution { label: string; value: number; }

/**
 * Model Builder — the authoring surface: pick/active model, see the related entities wired
 * in, tune the rubric (factors + weights), and watch a live band distribution + sample
 * member preview. Reached via the nav item whose DriverClass = 'SonarModelBuilderResource'.
 *
 * All data here is SIMULATED sample data (shaped like the real entities) until the engine
 * and entity PRs land on this branch. Wiring seams are marked `TODO wire:`. The header
 * actions (Simulate / Publish) are intentionally inert — Simulate needs a server-side
 * engine Action, and Publish needs the ScoreModelEntityServer snapshot hook, neither of
 * which exists on this branch yet.
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

    // --- header context ---
    public anchor = "Member";
    public population = 38402;
    public versionLabel = "Draft v3 — unpublished changes";

    // --- left rail: LIVE model list (real rows from the DB via ScoreModelService) ---
    public readonly liveModels = signal<ModelRow[]>([]);
    public readonly selectedModelId = signal<string | null>(null);

    // --- related entities (TODO wire: RunView "MJ_BizApps_Sonar: Model Related Entities") ---
    public relatedEntities: RelatedEntity[] = [
        { alias: "crm_activity", label: "Activities", source: "Salesforce" },
        { alias: "invoices", label: "Invoices", source: "Finance" },
        { alias: "lms_completions", label: "Course Completions", source: "LMS" },
        { alias: "event_regs", label: "Event Registrations", source: "Events" },
        { alias: "community", label: "Community Posts", source: "Higher Logic" },
    ];

    // --- rubric (TODO wire: RunView "MJ_BizApps_Sonar: Model Factors" joined to Factors) ---
    public rubric: RubricFactor[] = [
        { name: "Certification status", detail: "lms_completions · Exists(active cert) · gate/penalty", weight: 30, mode: "penalty" },
        { name: "Newsletter engagement", detail: "crm_activity · Count(Open,Click) · 90d · Percentile", weight: 20, mode: "additive" },
        { name: "Event attendance", detail: "event_regs · Count(Attended) · 12m · Percentile", weight: 20, mode: "additive" },
        { name: "Dues paid on time", detail: "invoices · Recency(paid) · current term · MinMax", weight: 15, mode: "additive" },
        { name: "Renewal-window silence", detail: "crm_activity · TrendSlope · window: RenewalDate −90d", weight: 15, mode: "penalty", renewalRelative: true },
    ];

    // --- right rail preview (TODO wire: engine computeScores on a sample population) ---
    public bandDist: BandSlice[] = [
        { label: "Healthy", pct: 61, band: "healthy" },
        { label: "Watch", pct: 22, band: "watch" },
        { label: "At-Risk", pct: 12, band: "atrisk" },
        { label: "Critical", pct: 5, band: "critical" },
    ];
    public sampleMember = { name: "Maria Chen", score: 73, band: "atrisk" as BandKey, delta: -12 };
    public contributions: Contribution[] = [
        { label: "Cert lapsed", value: -22 },
        { label: "Newsletter decay", value: -15 },
        { label: "Events", value: 8 },
        { label: "Dues on time", value: 5 },
    ];

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
        void this.loadModels();
    }

    /** Load the live model list, then release the Explorer loading screen. */
    private async loadModels(): Promise<void> {
        try {
            const models = await this.modelService.list();
            this.liveModels.set(models.map((m) => ({ id: m.ID, name: m.Name })));
            if (!this.selectedModelId() && models.length > 0) {
                this.selectedModelId.set(models[0].ID);
            }
        } finally {
            // Always notify — the Explorer loading screen waits on this or it hangs.
            this.NotifyLoadComplete();
        }
    }

    /** A model was just created in the setup modal — refresh, select it, close the modal. */
    public async onModelCreated(id: string): Promise<void> {
        await this.loadModels();
        this.selectedModelId.set(id);
        this.activeView.set("rubric");
    }

    /** Width (%) of a contribution bar, scaled to the largest absolute contribution. */
    public barWidth(value: number): number {
        const max = Math.max(...this.contributions.map((c) => Math.abs(c.value)), 1);
        return Math.round((Math.abs(value) / max) * 100);
    }

    /** Select a model in the left rail. */
    public selectModel(id: string): void {
        this.selectedModelId.set(id);
    }

    // TODO wire: preview compute — needs a server-side engine Action (RecomputeOrchestrator
    // .computeScores runs raw SQL and cannot run in the browser). Inert until that exists.
    public simulate(): void { /* no-op until the engine Action lands */ }

    // TODO wire: set model.Status='Active' and Save() — the server ScoreModelEntityServer
    // hook validates publishability and snapshots an immutable ScoreModelVersion. Inert
    // until the server hooks land on this branch.
    public publish(): void { /* no-op until the publish hook lands */ }
}
