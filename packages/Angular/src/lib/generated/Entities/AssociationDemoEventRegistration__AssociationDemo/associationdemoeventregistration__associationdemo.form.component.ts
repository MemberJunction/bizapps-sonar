import { Component } from '@angular/core';
import { AssociationDemoEventRegistration__AssociationDemoEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'Event Registrations__AssociationDemo') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-associationdemoeventregistration__associationdemo-form',
    templateUrl: './associationdemoeventregistration__associationdemo.form.component.html'
})
export class AssociationDemoEventRegistration__AssociationDemoFormComponent extends BaseFormComponent {
    public record!: AssociationDemoEventRegistration__AssociationDemoEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true }
        ]);
    }
}

