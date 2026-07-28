import { Component } from '@angular/core';
import { AssociationDemoCommitteeEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'Committees') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-associationdemocommittee-form',
    templateUrl: './associationdemocommittee.form.component.html'
})
export class AssociationDemoCommitteeFormComponent extends BaseFormComponent {
    public record!: AssociationDemoCommitteeEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'committeeOverview', sectionName: 'Committee Overview', isExpanded: true },
            { sectionKey: 'operationalSettings', sectionName: 'Operational Settings', isExpanded: true },
            { sectionKey: 'timeline', sectionName: 'Timeline', isExpanded: true },
            { sectionKey: 'leadershipAndCapacity', sectionName: 'Leadership and Capacity', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false },
            { sectionKey: 'committeeMemberships', sectionName: 'Committee Memberships', isExpanded: false }
        ]);
    }
}

