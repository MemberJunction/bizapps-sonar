import { Component } from '@angular/core';
import { sonarScoreRecomputeRunEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'Sonar: Score Recompute Runs') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-sonarscorerecomputerun-form',
    templateUrl: './sonarscorerecomputerun.form.component.html'
})
export class sonarScoreRecomputeRunFormComponent extends BaseFormComponent {
    public record!: sonarScoreRecomputeRunEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'sonarScoreBandTransitions', sectionName: 'Score Band Transitions', isExpanded: false }
        ]);
    }
}

