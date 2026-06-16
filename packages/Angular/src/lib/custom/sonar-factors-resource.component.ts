import { Component } from "@angular/core";
import { RegisterClass } from "@memberjunction/global";
import { BaseResourceComponent } from "@memberjunction/ng-shared";
import { ResourceData } from "@memberjunction/core-entities";

/**
 * Factors surface — the library of reusable measurements (compiled to set-based SQL)
 * that models draw on. Reached via the Sonar nav item whose DriverClass =
 * 'SonarFactorsResource'. v1 is a designed page shell; the factor list wires in next.
 */
@RegisterClass(BaseResourceComponent, "SonarFactorsResource")
@Component({
    standalone: false,
    selector: "sonar-factors-resource",
    templateUrl: "./sonar-factors-resource.component.html",
    styleUrls: ["./sonar-shell.css", "./sonar-factors-resource.component.css"],
})
export class SonarFactorsResourceComponent extends BaseResourceComponent {
    public async GetResourceDisplayName(_data: ResourceData): Promise<string> {
        return "Factors";
    }
    public async GetResourceIconClass(_data: ResourceData): Promise<string> {
        return "fa-solid fa-gauge-high";
    }
}
