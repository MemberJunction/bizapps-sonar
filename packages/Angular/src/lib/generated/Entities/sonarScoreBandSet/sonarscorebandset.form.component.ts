import { Component } from '@angular/core';
import { sonarScoreBandSetEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'Sonar: Score Band Sets') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-sonarscorebandset-form',
    templateUrl: './sonarscorebandset.form.component.html'
})
export class sonarScoreBandSetFormComponent extends BaseFormComponent {
    public record!: sonarScoreBandSetEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'sonarScoreBands', sectionName: 'Score Bands', isExpanded: false },
            { sectionKey: 'sonarScoreModels', sectionName: 'Score Models', isExpanded: false }
        ]);
    }
}

