import { Component } from "@angular/core";
import { RegisterClass } from "@memberjunction/global";
import { BaseResourceComponent } from "@memberjunction/ng-shared";
import { ResourceData } from "@memberjunction/core-entities";

/**
 * The Sonar app's landing screen — a custom resource component referenced by the Sonar
 * Application's default nav item (DriverClass = 'SonarOverviewResource'). Minimal v1
 * branded overview; richer surfaces (Model Builder, Engagement Manager) land later.
 */
@RegisterClass(BaseResourceComponent, "SonarOverviewResource")
@Component({
    standalone: false,
    selector: "sonar-overview-resource",
    templateUrl: "./sonar-overview-resource.component.html",
    styleUrls: ["./sonar-overview-resource.component.css"],
})
export class SonarOverviewResourceComponent extends BaseResourceComponent {
    public async GetResourceDisplayName(_data: ResourceData): Promise<string> {
        return "Sonar";
    }
    public async GetResourceIconClass(_data: ResourceData): Promise<string> {
        return "fa-solid fa-wave-square";
    }
}
