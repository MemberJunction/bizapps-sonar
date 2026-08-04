import { Component } from '@angular/core';
import { AssociationDemoEmailClickEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'Email Clicks') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-associationdemoemailclick-form',
    templateUrl: './associationdemoemailclick.form.component.html'
})
export class AssociationDemoEmailClickFormComponent extends BaseFormComponent {
    public record!: AssociationDemoEmailClickEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'emailInteraction', sectionName: 'Email Interaction', isExpanded: true },
            { sectionKey: 'technicalMetadata', sectionName: 'Technical Metadata', isExpanded: false },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false }
        ]);
    }
}

