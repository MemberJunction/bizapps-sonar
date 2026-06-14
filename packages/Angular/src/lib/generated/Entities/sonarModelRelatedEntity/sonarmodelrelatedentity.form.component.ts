import { Component } from '@angular/core';
import { sonarModelRelatedEntityEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'Sonar: Model Related Entities') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-sonarmodelrelatedentity-form',
    templateUrl: './sonarmodelrelatedentity.form.component.html'
})
export class sonarModelRelatedEntityFormComponent extends BaseFormComponent {
    public record!: sonarModelRelatedEntityEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'sonarFactors', sectionName: 'Factors', isExpanded: false }
        ]);
    }
}

