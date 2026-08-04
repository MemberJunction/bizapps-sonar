import { Component } from '@angular/core';
import { AssociationDemoCompetitionJudgeEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'Competition Judges') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-associationdemocompetitionjudge-form',
    templateUrl: './associationdemocompetitionjudge.form.component.html'
})
export class AssociationDemoCompetitionJudgeFormComponent extends BaseFormComponent {
    public record!: AssociationDemoCompetitionJudgeEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'competitionAssignment', sectionName: 'Competition Assignment', isExpanded: true },
            { sectionKey: 'personalInformation', sectionName: 'Personal Information', isExpanded: true },
            { sectionKey: 'professionalProfile', sectionName: 'Professional Profile', isExpanded: true },
            { sectionKey: 'statusAndTimeline', sectionName: 'Status and Timeline', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false }
        ]);
    }
}

