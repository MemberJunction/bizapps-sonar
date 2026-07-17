import { Component } from '@angular/core';
import { mjBizAppsSonarFactorEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'MJ_BizApps_Sonar: Factors') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-mjbizappssonarfactor-form',
    templateUrl: './mjbizappssonarfactor.form.component.html'
})
export class mjBizAppsSonarFactorFormComponent extends BaseFormComponent {
    public record!: mjBizAppsSonarFactorEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'mJBizAppsSonarModelFactors', sectionName: 'Model Factors', isExpanded: false },
            { sectionKey: 'mJBizAppsSonarScoreFactorContributions', sectionName: 'Score Factor Contributions', isExpanded: false }
        ]);
    }
}

