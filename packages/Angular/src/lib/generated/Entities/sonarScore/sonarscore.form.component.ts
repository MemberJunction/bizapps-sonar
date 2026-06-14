import { Component } from '@angular/core';
import { sonarScoreEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'Sonar: Scores') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-sonarscore-form',
    templateUrl: './sonarscore.form.component.html'
})
export class sonarScoreFormComponent extends BaseFormComponent {
    public record!: sonarScoreEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'sonarScoreFactorContributions', sectionName: 'Score Factor Contributions', isExpanded: false }
        ]);
    }
}

