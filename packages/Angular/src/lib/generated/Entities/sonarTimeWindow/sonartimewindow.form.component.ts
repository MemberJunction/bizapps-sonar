import { Component } from '@angular/core';
import { sonarTimeWindowEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'Sonar: Time Windows') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-sonartimewindow-form',
    templateUrl: './sonartimewindow.form.component.html'
})
export class sonarTimeWindowFormComponent extends BaseFormComponent {
    public record!: sonarTimeWindowEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'sonarFactors', sectionName: 'Factors', isExpanded: false }
        ]);
    }
}

