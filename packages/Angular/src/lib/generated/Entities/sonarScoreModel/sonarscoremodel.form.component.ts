import { Component } from '@angular/core';
import { sonarScoreModelEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'Sonar: Score Models') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-sonarscoremodel-form',
    templateUrl: './sonarscoremodel.form.component.html'
})
export class sonarScoreModelFormComponent extends BaseFormComponent {
    public record!: sonarScoreModelEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'sonarScoreHistories', sectionName: 'Score Histories', isExpanded: false },
            { sectionKey: 'sonarScoreBandTransitions', sectionName: 'Score Band Transitions', isExpanded: false },
            { sectionKey: 'sonarScoreRecomputeRuns', sectionName: 'Score Recompute Runs', isExpanded: false },
            { sectionKey: 'sonarScores', sectionName: 'Scores', isExpanded: false },
            { sectionKey: 'sonarScoreModelAuditEvents', sectionName: 'Score Model Audit Events', isExpanded: false },
            { sectionKey: 'sonarFactorsScoreModelID', sectionName: 'Factors (Score Model ID)', isExpanded: false },
            { sectionKey: 'sonarFactorsSourceScoreModelID', sectionName: 'Factors (Source Score Model ID)', isExpanded: false },
            { sectionKey: 'sonarModelFactors', sectionName: 'Model Factors', isExpanded: false },
            { sectionKey: 'sonarScoreModelVersions', sectionName: 'Score Model Versions', isExpanded: false },
            { sectionKey: 'sonarModelRelatedEntities', sectionName: 'Model Related Entities', isExpanded: false }
        ]);
    }
}

