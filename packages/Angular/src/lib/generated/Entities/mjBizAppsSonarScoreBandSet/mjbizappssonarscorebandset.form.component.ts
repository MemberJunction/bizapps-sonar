import { Component } from '@angular/core';
import { mjBizAppsSonarScoreBandSetEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'MJ_BizApps_Sonar: Score Band Sets') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-mjbizappssonarscorebandset-form',
    templateUrl: './mjbizappssonarscorebandset.form.component.html'
})
export class mjBizAppsSonarScoreBandSetFormComponent extends BaseFormComponent {
    public record!: mjBizAppsSonarScoreBandSetEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'mJBizAppsSonarScoreBands', sectionName: 'Score Bands', isExpanded: false },
            { sectionKey: 'mJBizAppsSonarScoreModels', sectionName: 'Score Models', isExpanded: false }
        ]);
    }
}

