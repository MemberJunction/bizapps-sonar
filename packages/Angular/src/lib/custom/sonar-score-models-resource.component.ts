import { Component } from "@angular/core";
import { RegisterClass } from "@memberjunction/global";
import { BaseResourceComponent } from "@memberjunction/ng-shared";
import { ResourceData } from "@memberjunction/core-entities";

/**
 * Score Models surface — the app's authoring home for engagement-scoring models
 * (anchor + factors + rubric + bands). Reached via the Sonar nav item whose
 * DriverClass = 'SonarScoreModelsResource'. v1 is a designed page shell; the data
 * layer (model list + builder) wires into this frame next.
 */
@RegisterClass(BaseResourceComponent, "SonarScoreModelsResource")
@Component({
    standalone: false,
    selector: "sonar-score-models-resource",
    templateUrl: "./sonar-score-models-resource.component.html",
    styleUrls: ["./sonar-shell.css", "./sonar-score-models-resource.component.css"],
})
export class SonarScoreModelsResourceComponent extends BaseResourceComponent {
    public async GetResourceDisplayName(_data: ResourceData): Promise<string> {
        return "Score Models";
    }
    public async GetResourceIconClass(_data: ResourceData): Promise<string> {
        return "fa-solid fa-sliders";
    }
}
