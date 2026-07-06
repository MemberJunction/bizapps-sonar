import { Component } from '@angular/core';
import { mjBizAppsSonarScoreRecomputeRunEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'MJ_BizApps_Sonar: Score Recompute Runs') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-mjbizappssonarscorerecomputerun-form',
    templateUrl: './mjbizappssonarscorerecomputerun.form.component.html'
})
export class mjBizAppsSonarScoreRecomputeRunFormComponent extends BaseFormComponent {
    public record!: mjBizAppsSonarScoreRecomputeRunEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'mJBizAppsSonarScoreBandTransitions', sectionName: 'Score Band Transitions', isExpanded: false }
        ]);
    }
}

