import { Component } from '@angular/core';
import { mjBizAppsSonarScoreModelEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'MJ_BizApps_Sonar: Score Models') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-mjbizappssonarscoremodel-form',
    templateUrl: './mjbizappssonarscoremodel.form.component.html'
})
export class mjBizAppsSonarScoreModelFormComponent extends BaseFormComponent {
    public record!: mjBizAppsSonarScoreModelEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'mJBizAppsSonarScoreHistories', sectionName: 'Score Histories', isExpanded: false },
            { sectionKey: 'mJBizAppsSonarScoreBandTransitions', sectionName: 'Score Band Transitions', isExpanded: false },
            { sectionKey: 'mJBizAppsSonarScoreRecomputeRuns', sectionName: 'Score Recompute Runs', isExpanded: false },
            { sectionKey: 'mJBizAppsSonarScores', sectionName: 'Scores', isExpanded: false },
            { sectionKey: 'mJBizAppsSonarScoreModelAuditEvents', sectionName: 'Score Model Audit Events', isExpanded: false },
            { sectionKey: 'mJBizAppsSonarFactorsScoreModelID', sectionName: 'Factors (Score Model ID)', isExpanded: false },
            { sectionKey: 'mJBizAppsSonarFactorsSourceScoreModelID', sectionName: 'Factors (Source Score Model ID)', isExpanded: false },
            { sectionKey: 'mJBizAppsSonarModelFactors', sectionName: 'Model Factors', isExpanded: false },
            { sectionKey: 'mJBizAppsSonarScoreModelVersions', sectionName: 'Score Model Versions', isExpanded: false },
            { sectionKey: 'mJBizAppsSonarModelRelatedEntities', sectionName: 'Model Related Entities', isExpanded: false },
            { sectionKey: 'mJBizAppsSonarScoreSegments', sectionName: 'Score Segments', isExpanded: false }
        ]);
    }
}

