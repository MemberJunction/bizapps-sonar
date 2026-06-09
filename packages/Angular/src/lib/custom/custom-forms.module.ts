import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Custom (hand-written) form components for Sonar entities.
 *
 * Custom forms override the generated ones via @RegisterClass priority —
 * they must extend the corresponding generated form component and be
 * imported AFTER the generated forms module in public-api.ts.
 *
 * No custom forms exist yet; declare them here as Sonar surfaces
 * (Model Builder, Engagement Manager, Admin/Ops) are built out.
 */
@NgModule({
    declarations: [
    ],
    imports: [
        CommonModule,
        FormsModule
    ],
    exports: [
    ]
})
export class CustomFormsModule { }
