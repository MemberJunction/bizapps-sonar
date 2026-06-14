import { Component } from '@angular/core';
import { sonarScoreModelAuditEventEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'Sonar: Score Model Audit Events') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-sonarscoremodelauditevent-form',
    templateUrl: './sonarscoremodelauditevent.form.component.html'
})
export class sonarScoreModelAuditEventFormComponent extends BaseFormComponent {
    public record!: sonarScoreModelAuditEventEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true }
        ]);
    }
}

