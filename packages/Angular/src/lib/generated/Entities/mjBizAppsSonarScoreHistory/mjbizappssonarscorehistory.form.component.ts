import { Component } from '@angular/core';
import { mjBizAppsSonarScoreHistoryEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'MJ_BizApps_Sonar: Score Histories') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-mjbizappssonarscorehistory-form',
    templateUrl: './mjbizappssonarscorehistory.form.component.html'
})
export class mjBizAppsSonarScoreHistoryFormComponent extends BaseFormComponent {
    public record!: mjBizAppsSonarScoreHistoryEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true }
        ]);
    }
}

