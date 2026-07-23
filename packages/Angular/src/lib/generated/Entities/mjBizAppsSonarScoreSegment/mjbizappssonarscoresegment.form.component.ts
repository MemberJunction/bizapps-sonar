import { Component } from '@angular/core';
import { mjBizAppsSonarScoreSegmentEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'MJ_BizApps_Sonar: Score Segments') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-mjbizappssonarscoresegment-form',
    templateUrl: './mjbizappssonarscoresegment.form.component.html'
})
export class mjBizAppsSonarScoreSegmentFormComponent extends BaseFormComponent {
    public record!: mjBizAppsSonarScoreSegmentEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'segmentDefinition', sectionName: 'Segment Definition', isExpanded: true },
            { sectionKey: 'segmentLogic', sectionName: 'Segment Logic', isExpanded: true },
            { sectionKey: 'performanceMetrics', sectionName: 'Performance Metrics', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false },
            { sectionKey: 'mJBizAppsSonarInterventions', sectionName: 'Interventions', isExpanded: false }
        ]);
    }
}

