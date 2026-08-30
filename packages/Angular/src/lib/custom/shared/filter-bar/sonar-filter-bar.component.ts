import { Component } from "@angular/core";

/**
 * SonarFilterBar — a thin layout shell for a row of filter atoms. It owns only the toolbar LOOK
 * (sunken panel, spacing, wrap) so filters sit consistently across every surface; the filters
 * themselves are independent components (SonarSearchField / SonarRangeFilter / SonarToggleFilter /
 * …) projected as children and wired individually by the consumer. No config, no logic.
 *
 *   <sonar-filter-bar>
 *     <sonar-search-field …></sonar-search-field>
 *     <sonar-range-filter …></sonar-range-filter>
 *   </sonar-filter-bar>
 */
@Component({
    standalone: false,
    selector: "sonar-filter-bar",
    template: `<div class="sonar-filters"><ng-content></ng-content></div>`,
    styleUrls: ["../styles/sonar-shell.css", "./sonar-filter-bar.component.css"],
})
export class SonarFilterBarComponent {}
