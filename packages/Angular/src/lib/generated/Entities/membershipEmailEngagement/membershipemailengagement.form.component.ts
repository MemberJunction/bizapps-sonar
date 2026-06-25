import { Component } from '@angular/core';
import { membershipEmailEngagementEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'Email Engagements') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-membershipemailengagement-form',
    templateUrl: './membershipemailengagement.form.component.html'
})
export class membershipEmailEngagementFormComponent extends BaseFormComponent {
    public record!: membershipEmailEngagementEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true }
        ]);
    }
}

