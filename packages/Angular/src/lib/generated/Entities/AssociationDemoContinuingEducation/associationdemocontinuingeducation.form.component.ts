import { Component } from '@angular/core';
import { AssociationDemoContinuingEducationEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'Continuing Educations') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-associationdemocontinuingeducation-form',
    templateUrl: './associationdemocontinuingeducation.form.component.html'
})
export class AssociationDemoContinuingEducationFormComponent extends BaseFormComponent {
    public record!: AssociationDemoContinuingEducationEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'membershipAndAssociation', sectionName: 'Membership and Association', isExpanded: true },
            { sectionKey: 'educationDetails', sectionName: 'Education Details', isExpanded: true },
            { sectionKey: 'activityTimeline', sectionName: 'Activity Timeline', isExpanded: true },
            { sectionKey: 'creditsAndHours', sectionName: 'Credits and Hours', isExpanded: true },
            { sectionKey: 'verificationAndCompliance', sectionName: 'Verification and Compliance', isExpanded: true },
            { sectionKey: 'additionalInformation', sectionName: 'Additional Information', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false }
        ]);
    }
}

