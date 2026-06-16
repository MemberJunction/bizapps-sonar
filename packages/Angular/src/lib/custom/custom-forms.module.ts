import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SonarOverviewResourceComponent } from './sonar-overview-resource.component';
import { SonarScoreModelsResourceComponent } from './sonar-score-models-resource.component';
import { SonarFactorsResourceComponent } from './sonar-factors-resource.component';
import { SonarScoresResourceComponent } from './sonar-scores-resource.component';

/**
 * Custom (hand-written) Sonar Angular components: custom entity forms (override generated
 * ones via @RegisterClass priority) and resource components (app surfaces referenced by
 * nav DriverClass). Imported after the generated forms module in public-api.ts.
 */
@NgModule({
    declarations: [
        SonarOverviewResourceComponent,
        SonarScoreModelsResourceComponent,
        SonarFactorsResourceComponent,
        SonarScoresResourceComponent
    ],
    imports: [
        CommonModule,
        FormsModule
    ],
    exports: [
        SonarOverviewResourceComponent,
        SonarScoreModelsResourceComponent,
        SonarFactorsResourceComponent,
        SonarScoresResourceComponent
    ]
})
export class CustomFormsModule { }
