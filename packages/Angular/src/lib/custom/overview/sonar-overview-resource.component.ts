import { Component, computed, inject, signal } from "@angular/core";
import { RegisterClass } from "@memberjunction/global";
import { BaseResourceComponent } from "@memberjunction/ng-shared";
import { ResourceData } from "@memberjunction/core-entities";
import { Metadata, RunView } from "@memberjunction/core";
import { ScoreModelService } from "../services/score-model.service";

/** A model row for the home list. */
interface ModelRow { id: string; name: string; status: string; }

/**
 * Sonar Home — the app's default landing. An operational at-a-glance surface (NOT a
 * marketing page): live status tiles, the user's actual models with their status, and a
 * "needs attention" nudge. Reached via the nav item whose DriverClass = 'SonarOverviewResource'.
 *
 * Reads real data via ScoreModelService + RunView; shows honest empty states when there's
 * nothing yet (e.g. before any model is created or any recompute has run).
 */
@RegisterClass(BaseResourceComponent, "SonarOverviewResource")
@Component({
    standalone: false,
    selector: "sonar-overview-resource",
    templateUrl: "./sonar-overview-resource.component.html",
    styleUrls: ["../sonar-shell.css", "./sonar-overview-resource.component.css"],
})
export class SonarOverviewResourceComponent extends BaseResourceComponent {
    private readonly modelService = inject(ScoreModelService);

    public readonly models = signal<ModelRow[]>([]);
    public readonly scoresCount = signal<number | null>(null);
    public readonly runsCount = signal<number | null>(null);
    public readonly loaded = signal(false);

    public readonly activeCount = computed(() => this.models().filter((m) => m.status === "Active").length);
    public readonly draftCount = computed(() => this.models().filter((m) => m.status === "Draft").length);

    public async GetResourceDisplayName(_data: ResourceData): Promise<string> {
        return "Sonar";
    }
    public async GetResourceIconClass(_data: ResourceData): Promise<string> {
        return "fa-solid fa-wave-square";
    }

    public override ngOnInit(): void {
        super.ngOnInit();
        void this.load();
    }

    /** Load the real model list + score/run counts, then release the loading screen. */
    private async load(): Promise<void> {
        try {
            const user = new Metadata().CurrentUser;
            const [models, scores, runs] = await Promise.all([
                this.modelService.list(),
                new RunView().RunView({ EntityName: "MJ_BizApps_Sonar: Scores", ResultType: "count_only" }, user),
                new RunView().RunView({ EntityName: "MJ_BizApps_Sonar: Score Recompute Runs", ResultType: "count_only" }, user),
            ]);
            this.models.set(models.map((m) => ({ id: m.ID, name: m.Name, status: m.Status })));
            this.scoresCount.set(scores?.Success ? scores.TotalRowCount : 0);
            this.runsCount.set(runs?.Success ? runs.TotalRowCount : 0);
        } catch {
            // Leave whatever loaded; the surface still renders with empty states.
        } finally {
            this.loaded.set(true);
            this.NotifyLoadComplete();
        }
    }

    /** Chip class for a model's status. */
    public statusClass(status: string): string {
        if (status === "Active") return "sonar-chip--healthy";
        if (status === "Draft") return "sonar-chip--watch";
        if (status === "Paused") return "sonar-chip--atrisk";
        return "";
    }
}
