import { Component, computed, inject, signal } from "@angular/core";
import { RegisterClass } from "@memberjunction/global";
import { BaseResourceComponent } from "@memberjunction/ng-shared";
import { ResourceData } from "@memberjunction/core-entities";
import { ScoreModelService } from "../../core/services/score-model.service";
import { BandSlice, ScoreContribution, ScoreReadService, ScoredMember } from "../../core/services/score-read.service";
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

    /** Load the band summary + triage list (lowest scores first) for a model. */
    private async loadModel(id: string): Promise<void> {
        const model = await this.modelService.get(id);
        this.modelName.set(model?.Name ?? "—");
        const [dist, members] = await Promise.all([
            this.scoreRead.distributionForModel(id),
            this.scoreRead.membersForModel(id),
        ]);
        this.tiles.set(dist.slices);
        this.members.set(members);
        // Auto-open the worst-scoring member's drawer so the surface lands on something useful.
        if (members.length > 0) await this.select(members[0]);
        else { this.selected.set(null); this.contributions.set([]); }
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

    /** Width (%) of a contribution bar, scaled to the largest absolute contribution. */
    public barWidth(value: number): number {
        const max = Math.max(...this.contributions().map((c) => Math.abs(c.weightedValue)), 1);
        return Math.round((Math.abs(value) / max) * 100);
    }

    /** Initials for a member's avatar. */
    public initials(name: string): string {
        return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "—";
    }
}
