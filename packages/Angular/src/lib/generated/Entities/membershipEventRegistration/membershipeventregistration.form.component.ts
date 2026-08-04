import { Component } from '@angular/core';
import { membershipEventRegistrationEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'Event Registrations') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-membershipeventregistration-form',
    templateUrl: './membershipeventregistration.form.component.html'
})
export class membershipEventRegistrationFormComponent extends BaseFormComponent {
    public record!: membershipEventRegistrationEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'registrationDetails', sectionName: 'Registration Details', isExpanded: true },
            { sectionKey: 'attendanceAndType', sectionName: 'Attendance and Type', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false }
        ]);
    }
}

