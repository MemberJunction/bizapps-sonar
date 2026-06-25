import { Component } from '@angular/core';
import { membershipCertificationEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'Certifications') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-membershipcertification-form',
    templateUrl: './membershipcertification.form.component.html'
})
export class membershipCertificationFormComponent extends BaseFormComponent {
    public record!: membershipCertificationEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true }
        ]);
    }
}

