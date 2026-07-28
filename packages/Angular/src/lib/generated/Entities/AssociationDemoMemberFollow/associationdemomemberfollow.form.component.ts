import { Component } from '@angular/core';
import { AssociationDemoMemberFollowEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'Member Follows') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-associationdemomemberfollow-form',
    templateUrl: './associationdemomemberfollow.form.component.html'
})
export class AssociationDemoMemberFollowFormComponent extends BaseFormComponent {
    public record!: AssociationDemoMemberFollowEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'followerDetails', sectionName: 'Follower Details', isExpanded: true },
            { sectionKey: 'notificationSettings', sectionName: 'Notification Settings', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false }
        ]);
    }
}

