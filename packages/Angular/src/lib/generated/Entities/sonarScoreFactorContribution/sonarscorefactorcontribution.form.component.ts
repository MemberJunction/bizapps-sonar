import { Component } from '@angular/core';
import { sonarScoreFactorContributionEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'Sonar: Score Factor Contributions') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-sonarscorefactorcontribution-form',
    templateUrl: './sonarscorefactorcontribution.form.component.html'
})
export class sonarScoreFactorContributionFormComponent extends BaseFormComponent {
    public record!: sonarScoreFactorContributionEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true }
        ]);
    }
}

