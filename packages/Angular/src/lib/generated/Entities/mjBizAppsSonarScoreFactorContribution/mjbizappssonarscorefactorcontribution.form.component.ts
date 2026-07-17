import { Component } from '@angular/core';
import { mjBizAppsSonarScoreFactorContributionEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'MJ_BizApps_Sonar: Score Factor Contributions') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-mjbizappssonarscorefactorcontribution-form',
    templateUrl: './mjbizappssonarscorefactorcontribution.form.component.html'
})
export class mjBizAppsSonarScoreFactorContributionFormComponent extends BaseFormComponent {
    public record!: mjBizAppsSonarScoreFactorContributionEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true }
        ]);
    }
}

