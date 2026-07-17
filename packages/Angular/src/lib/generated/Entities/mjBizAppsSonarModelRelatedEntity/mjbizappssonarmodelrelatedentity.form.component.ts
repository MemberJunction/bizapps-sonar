import { Component } from '@angular/core';
import { mjBizAppsSonarModelRelatedEntityEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'MJ_BizApps_Sonar: Model Related Entities') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-mjbizappssonarmodelrelatedentity-form',
    templateUrl: './mjbizappssonarmodelrelatedentity.form.component.html'
})
export class mjBizAppsSonarModelRelatedEntityFormComponent extends BaseFormComponent {
    public record!: mjBizAppsSonarModelRelatedEntityEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'mJBizAppsSonarFactors', sectionName: 'Factors', isExpanded: false }
        ]);
    }
}

