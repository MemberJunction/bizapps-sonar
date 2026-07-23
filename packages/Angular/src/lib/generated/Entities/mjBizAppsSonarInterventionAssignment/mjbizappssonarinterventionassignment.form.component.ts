import { Component } from '@angular/core';
import { mjBizAppsSonarInterventionAssignmentEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'MJ_BizApps_Sonar: Intervention Assignments') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-mjbizappssonarinterventionassignment-form',
    templateUrl: './mjbizappssonarinterventionassignment.form.component.html'
})
export class mjBizAppsSonarInterventionAssignmentFormComponent extends BaseFormComponent {
    public record!: mjBizAppsSonarInterventionAssignmentEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'interventionDetails', sectionName: 'Intervention Details', isExpanded: true },
            { sectionKey: 'targetingInformation', sectionName: 'Targeting Information', isExpanded: true },
            { sectionKey: 'assignmentDetails', sectionName: 'Assignment Details', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false },
            { sectionKey: 'mJBizAppsSonarInterventionOutcomes', sectionName: 'Intervention Outcomes', isExpanded: false }
        ]);
    }
}

