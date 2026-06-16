import { Component } from "@angular/core";
import { RegisterClass } from "@memberjunction/global";
import { BaseResourceComponent } from "@memberjunction/ng-shared";
import { ResourceData } from "@memberjunction/core-entities";

/**
 * Scores surface — the results view: explainable, banded scores produced when a model
 * runs against its population, tracked over time. Reached via the Sonar nav item whose
 * DriverClass = 'SonarScoresResource'. v1 is a designed page shell; the results grid
 * wires in next.
 */
@RegisterClass(BaseResourceComponent, "SonarScoresResource")
@Component({
    standalone: false,
    selector: "sonar-scores-resource",
    templateUrl: "./sonar-scores-resource.component.html",
    styleUrls: ["./sonar-shell.css", "./sonar-scores-resource.component.css"],
})
export class SonarScoresResourceComponent extends BaseResourceComponent {
    public async GetResourceDisplayName(_data: ResourceData): Promise<string> {
        return "Scores";
    }
    public async GetResourceIconClass(_data: ResourceData): Promise<string> {
        return "fa-solid fa-chart-line";
    }
}
