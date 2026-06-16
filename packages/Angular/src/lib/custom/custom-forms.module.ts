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

// Persona resource surfaces (each reachable via nav DriverClass).
import { SonarOverviewResourceComponent } from './overview/sonar-overview-resource.component';
import { SonarModelBuilderResourceComponent } from './model-builder/sonar-model-builder-resource.component';
import { SonarEngagementManagerResourceComponent } from './engagement-manager/sonar-engagement-manager-resource.component';
import { SonarAdminOpsResourceComponent } from './admin-ops/sonar-admin-ops-resource.component';

// Reusable multi-select (combobox search + chips) — MJ has no drop-in for this.
import { SonarMultiselectComponent } from './multiselect/sonar-multiselect.component';
// Builders — hosted inside the Model Builder (not nav surfaces), opened via view switching.
import { SonarModelSetupComponent } from './model-setup/sonar-model-setup.component';
import { SonarFactorBuilderComponent } from './factor-builder/sonar-factor-builder.component';
import { SonarScoreBandBuilderComponent } from './score-band-builder/sonar-score-band-builder.component';
import { SonarPublishSnapshotComponent } from './publish-snapshot/sonar-publish-snapshot.component';

/**
 * Custom (hand-written) Sonar Angular components, one per folder. Four persona surfaces
 * (Overview, Model Builder, Engagement Manager, Admin & Ops) reachable via nav DriverClass,
 * plus three builders hosted inside the Model Builder (Factor, Score-Band, Publish/Snapshot).
 * Imported after the generated forms module in public-api.ts.
 */
@NgModule({
    declarations: [
        SonarOverviewResourceComponent,
        SonarModelBuilderResourceComponent,
        SonarEngagementManagerResourceComponent,
        SonarAdminOpsResourceComponent,
        SonarMultiselectComponent,
        SonarModelSetupComponent,
        SonarFactorBuilderComponent,
        SonarScoreBandBuilderComponent,
        SonarPublishSnapshotComponent
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
