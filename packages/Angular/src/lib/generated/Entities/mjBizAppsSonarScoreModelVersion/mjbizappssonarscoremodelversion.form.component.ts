import { Component } from '@angular/core';
import { mjBizAppsSonarScoreModelVersionEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'MJ_BizApps_Sonar: Score Model Versions') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-mjbizappssonarscoremodelversion-form',
    templateUrl: './mjbizappssonarscoremodelversion.form.component.html'
})
export class mjBizAppsSonarScoreModelVersionFormComponent extends BaseFormComponent {
    public record!: mjBizAppsSonarScoreModelVersionEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'mJBizAppsSonarScoreRecomputeRuns', sectionName: 'Score Recompute Runs', isExpanded: false },
            { sectionKey: 'mJBizAppsSonarScores', sectionName: 'Scores', isExpanded: false },
            { sectionKey: 'mJBizAppsSonarScoreHistories', sectionName: 'Score Histories', isExpanded: false },
            { sectionKey: 'mJBizAppsSonarScoreModels', sectionName: 'Score Models', isExpanded: false }
        ]);
    }
}

