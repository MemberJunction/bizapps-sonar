import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Searchable single-select (filter-as-you-type). Standalone MJ UI component — the multiselect
// primitive builds its chips-over-a-picker on top of <mj-combobox>.
import { MJAlertComponent, MJButtonDirective, MJComboboxComponent, MJTabNavComponent } from '@memberjunction/ng-ui-components';
// Visual filter builder (the de-Kendo'd MJ component that replaces the deprecated Kendo expression
// UI). Provides <mj-filter-builder>; used by the Model Builder population filter + Factor Builder.
import { FilterBuilderModule } from '@memberjunction/ng-filter-builder';
// MJ's native conversation/chat UI. The floating Copilot launcher embeds <mj-conversation-chat-area>
// (overlay mode) instead of a bespoke panel — token streaming, message rendering, persistence, and
// multi-turn come for free. Its services are providedIn:'root', so importing the module for the
// component declaration is all the wiring needed.
import { ConversationsModule } from '@memberjunction/ng-conversations';

// Shared UI — reusable, business-agnostic primitives used across every feature surface
// (see custom/README.md). This module is the single coordination point; each UI PR adds only its
// own declarations + the MJ module imports those declarations need.
import { SonarMultiselectComponent } from './shared/multiselect/sonar-multiselect.component';
import { SonarModelSidebarComponent } from './shared/model-sidebar/sonar-model-sidebar.component';
import { SonarFilterBarComponent } from './shared/filter-bar/sonar-filter-bar.component';
import { SonarSearchFieldComponent } from './shared/filter-bar/sonar-search-field.component';
import { SonarRangeFilterComponent } from './shared/filter-bar/sonar-range-filter.component';
import { SonarToggleFilterComponent } from './shared/filter-bar/sonar-toggle-filter.component';

// Feature surfaces (each reachable via a nav DriverClass, except the floating Copilot launcher).
import { SonarOverviewResourceComponent } from './features/overview/sonar-overview-resource.component';
import { SonarModelBuilderResourceComponent } from './features/model-builder/sonar-model-builder-resource.component';
import { SonarEngagementManagerResourceComponent } from './features/engagement-manager/sonar-engagement-manager-resource.component';
import { SonarAdminOpsResourceComponent } from './features/admin-ops/sonar-admin-ops-resource.component';
import { SonarSignalStudioResourceComponent } from './features/signal-studio/sonar-signal-studio-resource.component';
// Floating assistant — embedded on every surface (its conversation state service is providedIn:'root').
import { SonarCopilotLauncherComponent } from './features/assistant/sonar-copilot-launcher.component';
// Model Builder's hosted builders — opened via view switching inside the feature (not nav-reachable).
import { SonarModelSetupComponent } from './features/model-builder/builders/model-setup/sonar-model-setup.component';
import { SonarFactorBuilderComponent } from './features/model-builder/builders/factor-builder/sonar-factor-builder.component';
import { SonarPromptEditorComponent } from './features/model-builder/builders/factor-builder/sonar-prompt-editor.component';
import { SonarScoreBandBuilderComponent } from './features/model-builder/builders/score-band-builder/sonar-score-band-builder.component';
import { SonarPublishSnapshotComponent } from './features/model-builder/builders/publish-snapshot/sonar-publish-snapshot.component';
import { SonarVersionHistoryComponent } from './features/model-builder/builders/version-history/sonar-version-history.component';

/**
 * Custom (hand-written) Sonar Angular code, organized by the Core-Shared-Feature convention
 * (see custom/README.md):
 *   - core/services  — singleton, app-wide data services (injected providedIn:'root'; no declarations)
 *   - shared/        — reusable, business-agnostic UI (model rail, multiselect, filter bar) + the
 *                      shared stylesheet (sonar-shell.css)
 *   - features/      — self-contained surfaces reachable via a nav DriverClass (Overview, Model
 *                      Builder, Signal Studio, Engagement, Admin), plus the floating Copilot launcher.
 *
 * The package follows a module-declared pattern (components are `standalone: false`). Imported after
 * the generated forms module in public-api.ts so custom `@RegisterClass` surfaces win on priority.
 */
@NgModule({
    declarations: [
        SonarMultiselectComponent,
        SonarModelSidebarComponent,
        SonarFilterBarComponent,
        SonarSearchFieldComponent,
        SonarRangeFilterComponent,
        SonarToggleFilterComponent,
        SonarOverviewResourceComponent,
        SonarModelBuilderResourceComponent,
        SonarModelSetupComponent,
        SonarFactorBuilderComponent,
        SonarPromptEditorComponent,
        SonarScoreBandBuilderComponent,
        SonarPublishSnapshotComponent,
        SonarVersionHistoryComponent,
        SonarEngagementManagerResourceComponent,
        SonarAdminOpsResourceComponent,
        SonarSignalStudioResourceComponent,
        SonarCopilotLauncherComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        MJComboboxComponent,
        MJButtonDirective,
        MJTabNavComponent,
        MJAlertComponent,
        FilterBuilderModule,
        ConversationsModule
    ],
    exports: [
        SonarMultiselectComponent,
        SonarModelSidebarComponent,
        SonarFilterBarComponent,
        SonarSearchFieldComponent,
        SonarRangeFilterComponent,
        SonarToggleFilterComponent,
        SonarOverviewResourceComponent,
        SonarModelBuilderResourceComponent,
        SonarEngagementManagerResourceComponent,
        SonarAdminOpsResourceComponent,
        SonarSignalStudioResourceComponent
    ]
})
export class CustomFormsModule { }
