import { Component } from '@angular/core';
import { AssociationDemoPayment__AssociationDemoEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'Payments__AssociationDemo') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-associationdemopayment__associationdemo-form',
    templateUrl: './associationdemopayment__associationdemo.form.component.html'
})
export class AssociationDemoPayment__AssociationDemoFormComponent extends BaseFormComponent {
    public record!: AssociationDemoPayment__AssociationDemoEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true }
        ]);
    }
}

