import { Component } from '@angular/core';
import { AssociationDemoEmailSendEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'Email Sends') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-associationdemoemailsend-form',
    templateUrl: './associationdemoemailsend.form.component.html'
})
export class AssociationDemoEmailSendFormComponent extends BaseFormComponent {
    public record!: AssociationDemoEmailSendEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'emailContext', sectionName: 'Email Context', isExpanded: true },
            { sectionKey: 'emailContent', sectionName: 'Email Content', isExpanded: true },
            { sectionKey: 'timeline', sectionName: 'Timeline', isExpanded: true },
            { sectionKey: 'engagementMetrics', sectionName: 'Engagement Metrics', isExpanded: true },
            { sectionKey: 'deliveryIssues', sectionName: 'Delivery Issues', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false },
            { sectionKey: 'emailClicks', sectionName: 'Email Clicks', isExpanded: false }
        ]);
    }
}

