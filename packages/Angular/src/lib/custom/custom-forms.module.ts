import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Visual filter builder (the de-Kendo'd MJ component that replaces the deprecated Kendo
// expression UI). Provides <mj-filter-builder>; used by the Model Builder population filter
// and the Factor Builder. See plans/factor-filter-authoring.md.
import { FilterBuilderModule } from '@memberjunction/ng-filter-builder';
// Searchable single-select (filter-as-you-type). Standalone MJ UI component — used for the
// long entity pickers (anchor / data sources) where a native <select> would be unusable.
import { MJComboboxComponent } from '@memberjunction/ng-ui-components';

// Feature surfaces (each reachable via nav DriverClass).
import { SonarOverviewResourceComponent } from './features/overview/sonar-overview-resource.component';
import { SonarModelBuilderResourceComponent } from './features/model-builder/sonar-model-builder-resource.component';
import { SonarEngagementManagerResourceComponent } from './features/engagement-manager/sonar-engagement-manager-resource.component';
import { SonarAdminOpsResourceComponent } from './features/admin-ops/sonar-admin-ops-resource.component';

// Shared UI — reusable across features.
import { SonarMultiselectComponent } from './shared/multiselect/sonar-multiselect.component';
import { SonarModelSidebarComponent } from './shared/model-sidebar/sonar-model-sidebar.component';
import { SonarFilterBarComponent } from './shared/filter-bar/sonar-filter-bar.component';
import { SonarSearchFieldComponent } from './shared/filter-bar/sonar-search-field.component';
import { SonarRangeFilterComponent } from './shared/filter-bar/sonar-range-filter.component';
import { SonarToggleFilterComponent } from './shared/filter-bar/sonar-toggle-filter.component';

// Model Builder's hosted builders — opened via view switching inside the feature.
import { SonarModelSetupComponent } from './features/model-builder/builders/model-setup/sonar-model-setup.component';
import { SonarFactorBuilderComponent } from './features/model-builder/builders/factor-builder/sonar-factor-builder.component';
import { SonarScoreBandBuilderComponent } from './features/model-builder/builders/score-band-builder/sonar-score-band-builder.component';
import { SonarPublishSnapshotComponent } from './features/model-builder/builders/publish-snapshot/sonar-publish-snapshot.component';
import { SonarVersionHistoryComponent } from './features/model-builder/builders/version-history/sonar-version-history.component';
import { SonarPlaybookEnrollerComponent } from './features/engagement-manager/components/playbook-enroller/sonar-playbook-enroller.component';

/**
 * Custom (hand-written) Sonar Angular code, organized by the Core-Shared-Feature convention
 * (see custom/README.md):
 *   - core/services  — singleton, app-wide data services (injected providedIn:'root')
 *   - shared/        — reusable, business-agnostic UI (model rail, multiselect) + the shared stylesheet
 *   - features/      — self-contained surfaces: Overview, Model Builder (+ its hosted builders),
 *                      Engagement Manager, Admin & Ops. Each reachable via a nav DriverClass.
 *
 * This NgModule declares every component (the package follows a module-declared pattern, not
 * standalone). Imported after the generated forms module in public-api.ts so the custom
 * @RegisterClass surfaces win on priority.
 */
@NgModule({
    declarations: [
        SonarOverviewResourceComponent,
        SonarModelBuilderResourceComponent,
        SonarEngagementManagerResourceComponent,
        SonarAdminOpsResourceComponent,
        SonarMultiselectComponent,
        SonarModelSidebarComponent,
        SonarFilterBarComponent,
        SonarSearchFieldComponent,
        SonarRangeFilterComponent,
        SonarToggleFilterComponent,
        SonarModelSetupComponent,
        SonarFactorBuilderComponent,
        SonarScoreBandBuilderComponent,
        SonarPublishSnapshotComponent,
        SonarVersionHistoryComponent,
        SonarPlaybookEnrollerComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        FilterBuilderModule,
        MJComboboxComponent
    ],
    exports: [
        SonarOverviewResourceComponent,
        SonarModelBuilderResourceComponent,
        SonarEngagementManagerResourceComponent,
        SonarAdminOpsResourceComponent
    ]
})
export class CustomFormsModule { }
