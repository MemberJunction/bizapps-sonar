import { Component } from '@angular/core';
import { sonarFactorEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'Sonar: Factors') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-sonarfactor-form',
    templateUrl: './sonarfactor.form.component.html'
})
export class sonarFactorFormComponent extends BaseFormComponent {
    public record!: sonarFactorEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'sonarModelFactors', sectionName: 'Model Factors', isExpanded: false },
            { sectionKey: 'sonarScoreFactorContributions', sectionName: 'Score Factor Contributions', isExpanded: false }
        ]);
    }
}

