import { Component } from '@angular/core';
import { mjBizAppsSonarScoreModelAuditEventEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'MJ_BizApps_Sonar: Score Model Audit Events') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-mjbizappssonarscoremodelauditevent-form',
    templateUrl: './mjbizappssonarscoremodelauditevent.form.component.html'
})
export class mjBizAppsSonarScoreModelAuditEventFormComponent extends BaseFormComponent {
    public record!: mjBizAppsSonarScoreModelAuditEventEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true }
        ]);
    }
}

