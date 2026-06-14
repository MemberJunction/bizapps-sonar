import { Component } from '@angular/core';
import { sonarScoreBandTransitionEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'Sonar: Score Band Transitions') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-sonarscorebandtransition-form',
    templateUrl: './sonarscorebandtransition.form.component.html'
})
export class sonarScoreBandTransitionFormComponent extends BaseFormComponent {
    public record!: sonarScoreBandTransitionEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true }
        ]);
    }
}

