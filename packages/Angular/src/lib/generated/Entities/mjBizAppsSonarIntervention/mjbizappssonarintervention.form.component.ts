import { Component } from '@angular/core';
import { mjBizAppsSonarInterventionEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'MJ_BizApps_Sonar: Interventions') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-mjbizappssonarintervention-form',
    templateUrl: './mjbizappssonarintervention.form.component.html'
})
export class mjBizAppsSonarInterventionFormComponent extends BaseFormComponent {
    public record!: mjBizAppsSonarInterventionEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'configuration', sectionName: 'Configuration', isExpanded: true },
            { sectionKey: 'interventionDetails', sectionName: 'Intervention Details', isExpanded: true },
            { sectionKey: 'executionRules', sectionName: 'Execution Rules', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false },
            { sectionKey: 'mJBizAppsSonarInterventionAssignments', sectionName: 'Intervention Assignments', isExpanded: false }
        ]);
    }
}

