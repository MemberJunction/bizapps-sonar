import { Component } from '@angular/core';
import { sonarScoreBandEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'Sonar: Score Bands') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-sonarscoreband-form',
    templateUrl: './sonarscoreband.form.component.html'
})
export class sonarScoreBandFormComponent extends BaseFormComponent {
    public record!: sonarScoreBandEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'sonarScoresBandID', sectionName: 'Scores (Band ID)', isExpanded: false },
            { sectionKey: 'sonarScoresPreviousBandID', sectionName: 'Scores (Previous Band ID)', isExpanded: false },
            { sectionKey: 'sonarScoreHistories', sectionName: 'Score Histories', isExpanded: false },
            { sectionKey: 'sonarScoreBandTransitionsFromBandID', sectionName: 'Score Band Transitions (From Band ID)', isExpanded: false },
            { sectionKey: 'sonarScoreBandTransitionsToBandID', sectionName: 'Score Band Transitions (To Band ID)', isExpanded: false }
        ]);
    }
}

