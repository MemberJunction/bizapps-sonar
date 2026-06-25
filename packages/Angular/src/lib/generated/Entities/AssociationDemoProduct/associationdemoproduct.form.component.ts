import { Component } from '@angular/core';
import { AssociationDemoProductEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'Products') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-associationdemoproduct-form',
    templateUrl: './associationdemoproduct.form.component.html'
})
export class AssociationDemoProductFormComponent extends BaseFormComponent {
    public record!: AssociationDemoProductEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'productAwards', sectionName: 'Product Awards', isExpanded: false },
            { sectionKey: 'competitionEntries', sectionName: 'Competition Entries', isExpanded: false }
        ]);
    }
}

