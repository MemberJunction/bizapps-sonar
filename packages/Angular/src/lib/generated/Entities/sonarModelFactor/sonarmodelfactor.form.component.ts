import { Component } from '@angular/core';
import { sonarModelFactorEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'Sonar: Model Factors') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-sonarmodelfactor-form',
    templateUrl: './sonarmodelfactor.form.component.html'
})
export class sonarModelFactorFormComponent extends BaseFormComponent {
    public record!: sonarModelFactorEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'sonarScoreFactorContributions', sectionName: 'Score Factor Contributions', isExpanded: false }
        ]);
    }
}

