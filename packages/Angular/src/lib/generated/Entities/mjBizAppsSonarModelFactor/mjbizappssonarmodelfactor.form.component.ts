import { Component } from '@angular/core';
import { mjBizAppsSonarModelFactorEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'MJ_BizApps_Sonar: Model Factors') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-mjbizappssonarmodelfactor-form',
    templateUrl: './mjbizappssonarmodelfactor.form.component.html'
})
export class mjBizAppsSonarModelFactorFormComponent extends BaseFormComponent {
    public record!: mjBizAppsSonarModelFactorEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'mJBizAppsSonarScoreFactorContributions', sectionName: 'Score Factor Contributions', isExpanded: false }
        ]);
    }
}

