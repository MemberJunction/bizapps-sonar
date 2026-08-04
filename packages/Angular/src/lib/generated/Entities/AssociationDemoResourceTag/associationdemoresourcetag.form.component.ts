import { Component } from '@angular/core';
import { AssociationDemoResourceTagEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'Resource Tags') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-associationdemoresourcetag-form',
    templateUrl: './associationdemoresourcetag.form.component.html'
})
export class AssociationDemoResourceTagFormComponent extends BaseFormComponent {
    public record!: AssociationDemoResourceTagEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'resourceInformation', sectionName: 'Resource Information', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false }
        ]);
    }
}

