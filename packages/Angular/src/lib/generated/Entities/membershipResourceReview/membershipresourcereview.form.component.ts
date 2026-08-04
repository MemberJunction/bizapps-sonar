import { Component } from '@angular/core';
import { membershipResourceReviewEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'Resource Reviews') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-membershipresourcereview-form',
    templateUrl: './membershipresourcereview.form.component.html'
})
export class membershipResourceReviewFormComponent extends BaseFormComponent {
    public record!: membershipResourceReviewEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'reviewDetails', sectionName: 'Review Details', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false }
        ]);
    }
}

