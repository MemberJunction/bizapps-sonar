import { Component } from '@angular/core';
import { AssociationDemoEventEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'Events') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-associationdemoevent-form',
    templateUrl: './associationdemoevent.form.component.html'
})
export class AssociationDemoEventFormComponent extends BaseFormComponent {
    public record!: AssociationDemoEventEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'eventInformation', sectionName: 'Event Information', isExpanded: true },
            { sectionKey: 'scheduleAndLocation', sectionName: 'Schedule and Location', isExpanded: true },
            { sectionKey: 'virtualEventDetails', sectionName: 'Virtual Event Details', isExpanded: true },
            { sectionKey: 'organizationAndCapacity', sectionName: 'Organization and Capacity', isExpanded: true },
            { sectionKey: 'registrationAndPricing', sectionName: 'Registration and Pricing', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false },
            { sectionKey: 'eventRegistrationsAssociationDemo', sectionName: 'Event Registrations__AssociationDemo', isExpanded: false },
            { sectionKey: 'eventSessions', sectionName: 'Event Sessions', isExpanded: false }
        ]);
    }
}

