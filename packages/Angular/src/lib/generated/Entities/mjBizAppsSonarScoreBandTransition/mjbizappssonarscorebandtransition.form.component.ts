import { Component } from '@angular/core';
import { mjBizAppsSonarScoreBandTransitionEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'MJ_BizApps_Sonar: Score Band Transitions') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-mjbizappssonarscorebandtransition-form',
    templateUrl: './mjbizappssonarscorebandtransition.form.component.html'
})
export class mjBizAppsSonarScoreBandTransitionFormComponent extends BaseFormComponent {
    public record!: mjBizAppsSonarScoreBandTransitionEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true }
        ]);
    }
}

