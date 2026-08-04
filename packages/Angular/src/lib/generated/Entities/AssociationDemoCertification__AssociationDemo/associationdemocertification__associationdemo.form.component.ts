import { Component } from '@angular/core';
import { AssociationDemoCertification__AssociationDemoEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'Certifications__AssociationDemo') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-associationdemocertification__associationdemo-form',
    templateUrl: './associationdemocertification__associationdemo.form.component.html'
})
export class AssociationDemoCertification__AssociationDemoFormComponent extends BaseFormComponent {
    public record!: AssociationDemoCertification__AssociationDemoEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'certificationDetails', sectionName: 'Certification Details', isExpanded: true },
            { sectionKey: 'timelineAndStatus', sectionName: 'Timeline and Status', isExpanded: true },
            { sectionKey: 'performanceAndCredits', sectionName: 'Performance and Credits', isExpanded: true },
            { sectionKey: 'additionalInformation', sectionName: 'Additional Information', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false },
            { sectionKey: 'continuingEducations', sectionName: 'Continuing Educations', isExpanded: false },
            { sectionKey: 'certificationRenewals', sectionName: 'Certification Renewals', isExpanded: false }
        ]);
    }
}

