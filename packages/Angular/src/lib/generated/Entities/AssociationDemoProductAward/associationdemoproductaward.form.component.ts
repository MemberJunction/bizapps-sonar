import { Component } from '@angular/core';
import { AssociationDemoProductAwardEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'Product Awards') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-associationdemoproductaward-form',
    templateUrl: './associationdemoproductaward.form.component.html'
})
export class AssociationDemoProductAwardFormComponent extends BaseFormComponent {
    public record!: AssociationDemoProductAwardEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'relationship', sectionName: 'Relationship', isExpanded: true },
            { sectionKey: 'awardDetails', sectionName: 'Award Details', isExpanded: true },
            { sectionKey: 'timeline', sectionName: 'Timeline', isExpanded: true },
            { sectionKey: 'performanceMetrics', sectionName: 'Performance Metrics', isExpanded: true },
            { sectionKey: 'displaySettings', sectionName: 'Display Settings', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false }
        ]);
    }
}

