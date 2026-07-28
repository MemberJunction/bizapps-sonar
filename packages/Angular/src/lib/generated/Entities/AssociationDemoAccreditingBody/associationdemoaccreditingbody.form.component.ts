import { Component } from '@angular/core';
import { AssociationDemoAccreditingBodyEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'Accrediting Bodies') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-associationdemoaccreditingbody-form',
    templateUrl: './associationdemoaccreditingbody.form.component.html'
})
export class AssociationDemoAccreditingBodyFormComponent extends BaseFormComponent {
    public record!: AssociationDemoAccreditingBodyEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'generalInformation', sectionName: 'General Information', isExpanded: true },
            { sectionKey: 'contactInformation', sectionName: 'Contact Information', isExpanded: true },
            { sectionKey: 'statusAndRecognition', sectionName: 'Status and Recognition', isExpanded: true },
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false },
            { sectionKey: 'certificationTypes', sectionName: 'Certification Types', isExpanded: false }
        ]);
    }
}

