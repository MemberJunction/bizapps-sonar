import { Component } from '@angular/core';
import { AssociationDemoGovernmentContactEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'Government Contacts') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-associationdemogovernmentcontact-form',
    templateUrl: './associationdemogovernmentcontact.form.component.html'
})
export class AssociationDemoGovernmentContactFormComponent extends BaseFormComponent {
    public record!: AssociationDemoGovernmentContactEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'professionalDetails', sectionName: 'Professional Details', isExpanded: true },
            { sectionKey: 'personalInformation', sectionName: 'Personal Information', isExpanded: true },
            { sectionKey: 'contactInformation', sectionName: 'Contact Information', isExpanded: true },
            { sectionKey: 'termDetails', sectionName: 'Term Details', isExpanded: true },
            { sectionKey: 'additionalInformation', sectionName: 'Additional Information', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false },
            { sectionKey: 'advocacyActions', sectionName: 'Advocacy Actions', isExpanded: false }
        ]);
    }
}

