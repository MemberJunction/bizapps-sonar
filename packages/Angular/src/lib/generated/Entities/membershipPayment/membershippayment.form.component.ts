import { Component } from '@angular/core';
import { membershipPaymentEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'Payments') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-membershippayment-form',
    templateUrl: './membershippayment.form.component.html'
})
export class membershipPaymentFormComponent extends BaseFormComponent {
    public record!: membershipPaymentEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true }
        ]);
    }
}

