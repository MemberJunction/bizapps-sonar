import { Component } from '@angular/core';
import { mjBizAppsSonarInterventionOutcomeEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'MJ_BizApps_Sonar: Intervention Outcomes') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-mjbizappssonarinterventionoutcome-form',
    templateUrl: './mjbizappssonarinterventionoutcome.form.component.html'
})
export class mjBizAppsSonarInterventionOutcomeFormComponent extends BaseFormComponent {
    public record!: mjBizAppsSonarInterventionOutcomeEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'interventionDetails', sectionName: 'Intervention Details', isExpanded: true },
            { sectionKey: 'interventionTimeline', sectionName: 'Intervention Timeline', isExpanded: true },
            { sectionKey: 'performanceMetrics', sectionName: 'Performance Metrics', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false }
        ]);
    }
}

