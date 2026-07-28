import { Component } from '@angular/core';
import { AssociationDemoBoardMemberEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'Board Members') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-associationdemoboardmember-form',
    templateUrl: './associationdemoboardmember.form.component.html'
})
export class AssociationDemoBoardMemberFormComponent extends BaseFormComponent {
    public record!: AssociationDemoBoardMemberEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'boardMembership', sectionName: 'Board Membership', isExpanded: true },
            { sectionKey: 'membershipTimeline', sectionName: 'Membership Timeline', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false }
        ]);
    }
}

