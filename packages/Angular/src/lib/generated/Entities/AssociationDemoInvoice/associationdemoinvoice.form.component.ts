import { Component } from '@angular/core';
import { AssociationDemoInvoiceEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'Invoices') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-associationdemoinvoice-form',
    templateUrl: './associationdemoinvoice.form.component.html'
})
export class AssociationDemoInvoiceFormComponent extends BaseFormComponent {
    public record!: AssociationDemoInvoiceEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'invoiceInformation', sectionName: 'Invoice Information', isExpanded: true },
            { sectionKey: 'timelineAndTerms', sectionName: 'Timeline and Terms', isExpanded: true },
            { sectionKey: 'financialSummary', sectionName: 'Financial Summary', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false },
            { sectionKey: 'paymentsAssociationDemo', sectionName: 'Payments__AssociationDemo', isExpanded: false },
            { sectionKey: 'invoiceLineItems', sectionName: 'Invoice Line Items', isExpanded: false }
        ]);
    }
}

