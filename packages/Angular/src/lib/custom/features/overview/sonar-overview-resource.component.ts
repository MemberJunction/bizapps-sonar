import { Component, computed, inject, signal } from "@angular/core";
import { RegisterClass } from "@memberjunction/global";
import { BaseResourceComponent } from "@memberjunction/ng-shared";
import { ResourceData } from "@memberjunction/core-entities";
import { Metadata, RunView } from "@memberjunction/core";
import { mjBizAppsSonarScoreModelEntity } from "@mj-biz-apps/sonar-entities";
import { ScoreModelService } from "../../core/services/score-model.service";
import { FactorService } from "../../core/services/factor.service";
import { ScoreBandService } from "../../core/services/score-band.service";
import { BandSlice, ScoreReadService } from "../../core/services/score-read.service";
import { CurrentModelService } from "../../core/services/current-model.service";

/**
 * Sonar Overview — the at-a-glance dashboard for the CURRENT model (scores are per-model, so
 * the overview is strongest scoped to one). The shared model rail picks the model; this surface
 * shows its identity, config stats, persisted band distribution (donut), and a "needs attention"
 * nudge. Reached via the nav item whose DriverClass = 'SonarOverviewResource'.
 */
@RegisterClass(BaseResourceComponent, "SonarOverviewResource")
@Component({
    standalone: false,
    selector: "sonar-overview-resource",
    templateUrl: "./sonar-overview-resource.component.html",
    styleUrls: ["../../shared/styles/sonar-shell.css", "./sonar-overview-resource.component.css"],
})
export class SonarOverviewResourceComponent extends BaseResourceComponent {
    private readonly modelService = inject(ScoreModelService);
    private readonly factorService = inject(FactorService);
    private readonly bandService = inject(ScoreBandService);
    private readonly scoreRead = inject(ScoreReadService);
    private readonly current = inject(CurrentModelService);

    public readonly loaded = signal(false);
    /** The selected model (entity) + its derived context. */
    public readonly model = signal<mjBizAppsSonarScoreModelEntity | null>(null);
    public readonly anchorName = signal("—");
    public readonly population = signal<number | null>(null);
    public readonly signalCount = signal(0);
    public readonly bandCount = signal(0);
    public readonly scoredCount = signal(0);
    public readonly distribution = signal<BandSlice[]>([]);

    /** Band distribution as donut arc segments (circumference-100 ring). */
    public readonly donutSegments = computed(() => {
        let acc = 0;
        return this.distribution().map((b) => {
            const seg = { key: b.key, label: b.label, pct: b.pct, dash: `${b.pct} ${100 - b.pct}`, offset: -acc };
            acc += b.pct;
            return seg;
        });
    });

    /** Attention items for the current model (config gaps that block scoring). */
    public readonly attention = computed<string[]>(() => {
        const m = this.model();
        if (!m) return [];
        const items: string[] = [];
        if (this.signalCount() === 0) items.push("No signals yet — add factors to the rubric in Model Builder.");
        if (this.bandCount() === 0) items.push("No bands defined — add a band set so scores map to health bands.");
        if (m.Status === "Draft") items.push("Still a draft — publish a version to persist scores.");
        if (m.Status === "Active" && this.scoredCount() === 0) items.push("Published but never recomputed — run Recompute in Model Builder.");
        return items;
    });

    public async GetResourceDisplayName(_data: ResourceData): Promise<string> { return "Sonar"; }
    public async GetResourceIconClass(_data: ResourceData): Promise<string> { return "fa-solid fa-wave-square"; }

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

    /** The sidebar picked a model — load its dashboard. */
    public async onSelect(id: string): Promise<void> {
        await this.loadModel(id);
    }

    /** Load the selected model's identity, config counts, and persisted distribution. */
    private async loadModel(id: string): Promise<void> {
        const model = await this.modelService.get(id);
        this.model.set(model);
        if (!model) { this.resetContext(); return; }

        const anchor = new Metadata().Entities.find((e) => e.ID === model.AnchorEntityID);
        this.anchorName.set(anchor?.DisplayName || anchor?.Name || "—");

        const [rubric, dist] = await Promise.all([
            this.factorService.rubricForModel(model.ID),
            this.scoreRead.distributionForModel(model.ID),
        ]);
        this.signalCount.set(rubric.length);
        this.distribution.set(dist.slices);
        this.scoredCount.set(dist.total);
        this.bandCount.set(model.BandSetID ? (await this.bandService.getBands(model.BandSetID)).length : 0);

        this.population.set(null);
        if (anchor) {
            const countResult = await new RunView().RunView({ EntityName: anchor.Name, ResultType: "count_only" });
            this.population.set(countResult?.Success ? countResult.TotalRowCount : null);
        }
    }

    private resetContext(): void {
        this.anchorName.set("—");
        this.population.set(null);
        this.signalCount.set(0);
        this.bandCount.set(0);
        this.scoredCount.set(0);
        this.distribution.set([]);
    }

    /** Chip class for the model's status. */
    public statusClass(status: string): string {
        if (status === "Active") return "sonar-chip--healthy";
        if (status === "Draft") return "sonar-chip--watch";
        if (status === "Paused") return "sonar-chip--atrisk";
        return "";
    }
}
