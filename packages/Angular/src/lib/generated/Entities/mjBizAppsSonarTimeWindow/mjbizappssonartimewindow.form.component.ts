import { Component } from '@angular/core';
import { mjBizAppsSonarTimeWindowEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'MJ_BizApps_Sonar: Time Windows') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-mjbizappssonartimewindow-form',
    templateUrl: './mjbizappssonartimewindow.form.component.html'
})
export class mjBizAppsSonarTimeWindowFormComponent extends BaseFormComponent {
    public record!: mjBizAppsSonarTimeWindowEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'mJBizAppsSonarFactors', sectionName: 'Factors', isExpanded: false }
        ]);
    }
}

