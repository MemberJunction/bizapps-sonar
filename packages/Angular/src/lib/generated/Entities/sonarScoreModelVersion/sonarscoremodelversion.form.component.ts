import { Component } from '@angular/core';
import { sonarScoreModelVersionEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'Sonar: Score Model Versions') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-sonarscoremodelversion-form',
    templateUrl: './sonarscoremodelversion.form.component.html'
})
export class sonarScoreModelVersionFormComponent extends BaseFormComponent {
    public record!: sonarScoreModelVersionEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'sonarScoreRecomputeRuns', sectionName: 'Score Recompute Runs', isExpanded: false },
            { sectionKey: 'sonarScores', sectionName: 'Scores', isExpanded: false },
            { sectionKey: 'sonarScoreHistories', sectionName: 'Score Histories', isExpanded: false },
            { sectionKey: 'sonarScoreModels', sectionName: 'Score Models', isExpanded: false }
        ]);
    }
}

