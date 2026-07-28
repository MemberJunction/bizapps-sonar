import { Component } from '@angular/core';
import { AssociationDemoForumModerationEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'Forum Moderations') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-associationdemoforummoderation-form',
    templateUrl: './associationdemoforummoderation.form.component.html'
})
export class AssociationDemoForumModerationFormComponent extends BaseFormComponent {
    public record!: AssociationDemoForumModerationEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'reportInformation', sectionName: 'Report Information', isExpanded: true },
            { sectionKey: 'moderationAction', sectionName: 'Moderation Action', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false }
        ]);
    }
}

