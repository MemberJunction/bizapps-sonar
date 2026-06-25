import { Component } from '@angular/core';
import { AssociationDemoResourceEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'Resources') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-associationdemoresource-form',
    templateUrl: './associationdemoresource.form.component.html'
})
export class AssociationDemoResourceFormComponent extends BaseFormComponent {
    public record!: AssociationDemoResourceEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'resourceVersions', sectionName: 'Resource Versions', isExpanded: false },
            { sectionKey: 'resourceDownloads', sectionName: 'Resource Downloads', isExpanded: false },
            { sectionKey: 'resourceRatings', sectionName: 'Resource Ratings', isExpanded: false },
            { sectionKey: 'resourceTags', sectionName: 'Resource Tags', isExpanded: false }
        ]);
    }
}

