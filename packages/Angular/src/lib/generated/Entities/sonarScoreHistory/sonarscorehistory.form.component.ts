import { Component } from '@angular/core';
import { sonarScoreHistoryEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'Sonar: Score Histories') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-sonarscorehistory-form',
    templateUrl: './sonarscorehistory.form.component.html'
})
export class sonarScoreHistoryFormComponent extends BaseFormComponent {
    public record!: sonarScoreHistoryEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true }
        ]);
    }
}

