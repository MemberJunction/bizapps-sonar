import { Component } from '@angular/core';
import { AssociationDemoCommitteeMembershipEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'Committee Memberships') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-associationdemocommitteemembership-form',
    templateUrl: './associationdemocommitteemembership.form.component.html'
})
export class AssociationDemoCommitteeMembershipFormComponent extends BaseFormComponent {
    public record!: AssociationDemoCommitteeMembershipEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true }
        ]);
    }
}

