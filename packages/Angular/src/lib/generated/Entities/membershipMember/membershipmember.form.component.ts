import { Component } from '@angular/core';
import { membershipMemberEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'Members') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-membershipmember-form',
    templateUrl: './membershipmember.form.component.html'
})
export class membershipMemberFormComponent extends BaseFormComponent {
    public record!: membershipMemberEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'emailEngagements', sectionName: 'Email Engagements', isExpanded: false },
            { sectionKey: 'payments', sectionName: 'Payments', isExpanded: false },
            { sectionKey: 'eventRegistrations', sectionName: 'Event Registrations', isExpanded: false },
            { sectionKey: 'certifications', sectionName: 'Certifications', isExpanded: false }
        ]);
    }
}

