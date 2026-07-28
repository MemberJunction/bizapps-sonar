import { Component } from '@angular/core';
import { AssociationDemoAdvocacyActionEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'Advocacy Actions') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-associationdemoadvocacyaction-form',
    templateUrl: './associationdemoadvocacyaction.form.component.html'
})
export class AssociationDemoAdvocacyActionFormComponent extends BaseFormComponent {
    public record!: AssociationDemoAdvocacyActionEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'relationshipMapping', sectionName: 'Relationship Mapping', isExpanded: true },
            { sectionKey: 'actionDetails', sectionName: 'Action Details', isExpanded: true },
            { sectionKey: 'actionResults', sectionName: 'Action Results', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false }
        ]);
    }
}

