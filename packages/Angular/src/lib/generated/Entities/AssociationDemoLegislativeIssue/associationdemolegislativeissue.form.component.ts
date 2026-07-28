import { Component } from '@angular/core';
import { AssociationDemoLegislativeIssueEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'Legislative Issues') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-associationdemolegislativeissue-form',
    templateUrl: './associationdemolegislativeissue.form.component.html'
})
export class AssociationDemoLegislativeIssueFormComponent extends BaseFormComponent {
    public record!: AssociationDemoLegislativeIssueEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'legislativeDetails', sectionName: 'Legislative Details', isExpanded: true },
            { sectionKey: 'statusAndTimeline', sectionName: 'Status and Timeline', isExpanded: true },
            { sectionKey: 'impactAndAnalysis', sectionName: 'Impact and Analysis', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false },
            { sectionKey: 'policyPositions', sectionName: 'Policy Positions', isExpanded: false },
            { sectionKey: 'advocacyActions', sectionName: 'Advocacy Actions', isExpanded: false },
            { sectionKey: 'regulatoryComments', sectionName: 'Regulatory Comments', isExpanded: false }
        ]);
    }
}

