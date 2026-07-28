import { Component } from '@angular/core';
import { AssociationDemoCertificationRenewalEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'Certification Renewals') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-associationdemocertificationrenewal-form',
    templateUrl: './associationdemocertificationrenewal.form.component.html'
})
export class AssociationDemoCertificationRenewalFormComponent extends BaseFormComponent {
    public record!: AssociationDemoCertificationRenewalEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'certificationDetails', sectionName: 'Certification Details', isExpanded: true },
            { sectionKey: 'renewalTimeline', sectionName: 'Renewal Timeline', isExpanded: true },
            { sectionKey: 'renewalDetails', sectionName: 'Renewal Details', isExpanded: true },
            { sectionKey: 'financialDetails', sectionName: 'Financial Details', isExpanded: true },
            { sectionKey: 'processingInformation', sectionName: 'Processing Information', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false }
        ]);
    }
}

