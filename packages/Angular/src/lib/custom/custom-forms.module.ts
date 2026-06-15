import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SonarOverviewResourceComponent } from './sonar-overview-resource.component';

/**
 * Custom (hand-written) Sonar Angular components: custom entity forms (override generated
 * ones via @RegisterClass priority) and resource components (app surfaces referenced by
 * nav DriverClass). Imported after the generated forms module in public-api.ts.
 */
@NgModule({
    declarations: [
        SonarOverviewResourceComponent
    ],
    imports: [
        CommonModule,
        FormsModule
    ],
    exports: [
        SonarOverviewResourceComponent
    ]
})
export class CustomFormsModule { }
