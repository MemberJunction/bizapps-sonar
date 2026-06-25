import { Component } from '@angular/core';
import { AssociationDemoMember__AssociationDemoEntity } from '@mj-biz-apps/sonar-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'Members__AssociationDemo') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-associationdemomember__associationdemo-form',
    templateUrl: './associationdemomember__associationdemo.form.component.html'
})
export class AssociationDemoMember__AssociationDemoFormComponent extends BaseFormComponent {
    public record!: AssociationDemoMember__AssociationDemoEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'resourceDownloads', sectionName: 'Resource Downloads', isExpanded: false },
            { sectionKey: 'advocacyActions', sectionName: 'Advocacy Actions', isExpanded: false },
            { sectionKey: 'resourceVersions', sectionName: 'Resource Versions', isExpanded: false },
            { sectionKey: 'memberFollows', sectionName: 'Member Follows', isExpanded: false },
            { sectionKey: 'invoices', sectionName: 'Invoices', isExpanded: false },
            { sectionKey: 'chapterOfficers', sectionName: 'Chapter Officers', isExpanded: false },
            { sectionKey: 'campaignMembers', sectionName: 'Campaign Members', isExpanded: false },
            { sectionKey: 'memberships', sectionName: 'Memberships', isExpanded: false },
            { sectionKey: 'forumThreadsAuthorID', sectionName: 'Forum Threads (Author ID)', isExpanded: false },
            { sectionKey: 'forumThreadsLastReplyAuthorID', sectionName: 'Forum Threads (Last Reply Author ID)', isExpanded: false },
            { sectionKey: 'eventRegistrationsAssociationDemo', sectionName: 'Event Registrations__AssociationDemo', isExpanded: false },
            { sectionKey: 'enrollments', sectionName: 'Enrollments', isExpanded: false },
            { sectionKey: 'resources', sectionName: 'Resources', isExpanded: false },
            { sectionKey: 'chapterMemberships', sectionName: 'Chapter Memberships', isExpanded: false },
            { sectionKey: 'resourceRatings', sectionName: 'Resource Ratings', isExpanded: false },
            { sectionKey: 'continuingEducations', sectionName: 'Continuing Educations', isExpanded: false },
            { sectionKey: 'committees', sectionName: 'Committees', isExpanded: false },
            { sectionKey: 'postReactions', sectionName: 'Post Reactions', isExpanded: false },
            { sectionKey: 'postAttachments', sectionName: 'Post Attachments', isExpanded: false },
            { sectionKey: 'products', sectionName: 'Products', isExpanded: false },
            { sectionKey: 'forumPostsEditedByID', sectionName: 'Forum Posts (Edited By ID)', isExpanded: false },
            { sectionKey: 'forumPostsAuthorID', sectionName: 'Forum Posts (Author ID)', isExpanded: false },
            { sectionKey: 'certificationsAssociationDemo', sectionName: 'Certifications__AssociationDemo', isExpanded: false },
            { sectionKey: 'competitionJudges', sectionName: 'Competition Judges', isExpanded: false },
            { sectionKey: 'boardMembers', sectionName: 'Board Members', isExpanded: false },
            { sectionKey: 'forumModerationsModeratedByID', sectionName: 'Forum Moderations (Moderated By ID)', isExpanded: false },
            { sectionKey: 'forumModerationsReportedByID', sectionName: 'Forum Moderations (Reported By ID)', isExpanded: false },
            { sectionKey: 'committeeMemberships', sectionName: 'Committee Memberships', isExpanded: false },
            { sectionKey: 'forumCategories', sectionName: 'Forum Categories', isExpanded: false },
            { sectionKey: 'emailSends', sectionName: 'Email Sends', isExpanded: false }
        ]);
    }
}

