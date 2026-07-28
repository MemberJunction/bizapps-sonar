import { Component } from '@angular/core';
import { AssociationDemoForumThreadEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'Forum Threads') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-associationdemoforumthread-form',
    templateUrl: './associationdemoforumthread.form.component.html'
})
export class AssociationDemoForumThreadFormComponent extends BaseFormComponent {
    public record!: AssociationDemoForumThreadEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'threadDetails', sectionName: 'Thread Details', isExpanded: true },
            { sectionKey: 'engagementMetrics', sectionName: 'Engagement Metrics', isExpanded: true },
            { sectionKey: 'threadConfiguration', sectionName: 'Thread Configuration', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false },
            { sectionKey: 'forumPosts', sectionName: 'Forum Posts', isExpanded: false }
        ]);
    }
}

