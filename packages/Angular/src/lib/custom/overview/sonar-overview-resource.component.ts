import { Component } from "@angular/core";
import { RegisterClass } from "@memberjunction/global";
import { BaseResourceComponent } from "@memberjunction/ng-shared";
import { ResourceData } from "@memberjunction/core-entities";

/** The three headline metrics shown as tiles on the Overview. `null` = still loading. */
interface OverviewCounts {
    activeModels: number | null;
    totalScores: number | null;
    recomputeRuns: number | null;
}

/**
 * The Sonar app's landing surface — the product hero, three live headline counts, the
 * three persona entry points (Model Builder / Engagement Manager / Admin & Ops), and an
 * illustrative sample score that shows the explainability idea. Reached via the nav item
 * whose DriverClass = 'SonarOverviewResource'.
 */
@RegisterClass(BaseResourceComponent, "SonarOverviewResource")
@Component({
    standalone: false,
    selector: "sonar-overview-resource",
    templateUrl: "./sonar-overview-resource.component.html",
    styleUrls: ["../sonar-shell.css", "./sonar-overview-resource.component.css"],
})
export class SonarOverviewResourceComponent extends BaseResourceComponent {
    /** Headline counts; each stays null (renders "—") until its RunView resolves. */
    public counts: OverviewCounts = { activeModels: null, totalScores: null, recomputeRuns: null };

    public async GetResourceDisplayName(_data: ResourceData): Promise<string> {
        return "Sonar";
    }
    public async GetResourceIconClass(_data: ResourceData): Promise<string> {
        return "fa-solid fa-wave-square";
    }

    public override ngOnInit(): void {
        super.ngOnInit();
        this.loadCounts();
    }

    /**
     * Populate the headline counts. SIMULATED for now (the engine/entity work lands via
     * other PRs) — sample values present the surface as intended rather than live zeroes.
     *
     * TODO wire: replace with parallel count-only RunViews once data is on this branch:
     *   const [models, scores, runs] = await new RunView().RunViews([
     *     { EntityName: "MJ_BizApps_Sonar: Score Models", ExtraFilter: "Status='Active'", ResultType: "count_only" },
     *     { EntityName: "MJ_BizApps_Sonar: Scores", ResultType: "count_only" },
     *     { EntityName: "MJ_BizApps_Sonar: Score Recompute Runs", ResultType: "count_only" },
     *   ], new Metadata().CurrentUser);
     *   this.counts = { activeModels: models.TotalRowCount, totalScores: scores.TotalRowCount, recomputeRuns: runs.TotalRowCount };
     */
    private loadCounts(): void {
        this.counts = { activeModels: 3, totalScores: 38402, recomputeRuns: 12 };
        // Always notify — the Explorer loading screen waits on this or it hangs the app.
        this.NotifyLoadComplete();
    }
}
