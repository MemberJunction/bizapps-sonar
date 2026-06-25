/**********************************************************************************
* GENERATED FILE - This file is automatically managed by the MJ CodeGen tool, 
* 
* DO NOT MODIFY THIS FILE - any changes you make will be wiped out the next time the file is
* generated
* 
**********************************************************************************/
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// MemberJunction Imports
import { BaseFormsModule } from '@memberjunction/ng-base-forms';
import { EntityViewerModule } from '@memberjunction/ng-entity-viewer';
import { LinkDirectivesModule } from '@memberjunction/ng-link-directives';

// Import Generated Components
import { AssociationDemoAccreditingBodyFormComponent } from "./Entities/AssociationDemoAccreditingBody/associationdemoaccreditingbody.form.component";
import { AssociationDemoAdvocacyActionFormComponent } from "./Entities/AssociationDemoAdvocacyAction/associationdemoadvocacyaction.form.component";
import { AssociationDemoBoardMemberFormComponent } from "./Entities/AssociationDemoBoardMember/associationdemoboardmember.form.component";
import { AssociationDemoBoardPositionFormComponent } from "./Entities/AssociationDemoBoardPosition/associationdemoboardposition.form.component";
import { AssociationDemoCampaignMemberFormComponent } from "./Entities/AssociationDemoCampaignMember/associationdemocampaignmember.form.component";
import { AssociationDemoCampaignFormComponent } from "./Entities/AssociationDemoCampaign/associationdemocampaign.form.component";
import { AssociationDemoCertificateFormComponent } from "./Entities/AssociationDemoCertificate/associationdemocertificate.form.component";
import { AssociationDemoCertificationRenewalFormComponent } from "./Entities/AssociationDemoCertificationRenewal/associationdemocertificationrenewal.form.component";
import { AssociationDemoCertificationRequirementFormComponent } from "./Entities/AssociationDemoCertificationRequirement/associationdemocertificationrequirement.form.component";
import { AssociationDemoCertificationTypeFormComponent } from "./Entities/AssociationDemoCertificationType/associationdemocertificationtype.form.component";
import { membershipCertificationFormComponent } from "./Entities/membershipCertification/membershipcertification.form.component";
import { AssociationDemoCertification__AssociationDemoFormComponent } from "./Entities/AssociationDemoCertification__AssociationDemo/associationdemocertification__associationdemo.form.component";
import { AssociationDemoChapterMembershipFormComponent } from "./Entities/AssociationDemoChapterMembership/associationdemochaptermembership.form.component";
import { AssociationDemoChapterOfficerFormComponent } from "./Entities/AssociationDemoChapterOfficer/associationdemochapterofficer.form.component";
import { AssociationDemoChapterFormComponent } from "./Entities/AssociationDemoChapter/associationdemochapter.form.component";
import { AssociationDemoCommitteeMembershipFormComponent } from "./Entities/AssociationDemoCommitteeMembership/associationdemocommitteemembership.form.component";
import { AssociationDemoCommitteeFormComponent } from "./Entities/AssociationDemoCommittee/associationdemocommittee.form.component";
import { AssociationDemoCompetitionEntryFormComponent } from "./Entities/AssociationDemoCompetitionEntry/associationdemocompetitionentry.form.component";
import { AssociationDemoCompetitionJudgeFormComponent } from "./Entities/AssociationDemoCompetitionJudge/associationdemocompetitionjudge.form.component";
import { AssociationDemoCompetitionFormComponent } from "./Entities/AssociationDemoCompetition/associationdemocompetition.form.component";
import { AssociationDemoContinuingEducationFormComponent } from "./Entities/AssociationDemoContinuingEducation/associationdemocontinuingeducation.form.component";
import { AssociationDemoCourseFormComponent } from "./Entities/AssociationDemoCourse/associationdemocourse.form.component";
import { AssociationDemoEmailClickFormComponent } from "./Entities/AssociationDemoEmailClick/associationdemoemailclick.form.component";
import { membershipEmailEngagementFormComponent } from "./Entities/membershipEmailEngagement/membershipemailengagement.form.component";
import { AssociationDemoEmailSendFormComponent } from "./Entities/AssociationDemoEmailSend/associationdemoemailsend.form.component";
import { AssociationDemoEmailTemplateFormComponent } from "./Entities/AssociationDemoEmailTemplate/associationdemoemailtemplate.form.component";
import { AssociationDemoEnrollmentFormComponent } from "./Entities/AssociationDemoEnrollment/associationdemoenrollment.form.component";
import { membershipEventRegistrationFormComponent } from "./Entities/membershipEventRegistration/membershipeventregistration.form.component";
import { AssociationDemoEventRegistration__AssociationDemoFormComponent } from "./Entities/AssociationDemoEventRegistration__AssociationDemo/associationdemoeventregistration__associationdemo.form.component";
import { AssociationDemoEventSessionFormComponent } from "./Entities/AssociationDemoEventSession/associationdemoeventsession.form.component";
import { AssociationDemoEventFormComponent } from "./Entities/AssociationDemoEvent/associationdemoevent.form.component";
import { AssociationDemoForumCategoryFormComponent } from "./Entities/AssociationDemoForumCategory/associationdemoforumcategory.form.component";
import { AssociationDemoForumModerationFormComponent } from "./Entities/AssociationDemoForumModeration/associationdemoforummoderation.form.component";
import { AssociationDemoForumPostFormComponent } from "./Entities/AssociationDemoForumPost/associationdemoforumpost.form.component";
import { AssociationDemoForumThreadFormComponent } from "./Entities/AssociationDemoForumThread/associationdemoforumthread.form.component";
import { AssociationDemoGovernmentContactFormComponent } from "./Entities/AssociationDemoGovernmentContact/associationdemogovernmentcontact.form.component";
import { AssociationDemoInvoiceLineItemFormComponent } from "./Entities/AssociationDemoInvoiceLineItem/associationdemoinvoicelineitem.form.component";
import { AssociationDemoInvoiceFormComponent } from "./Entities/AssociationDemoInvoice/associationdemoinvoice.form.component";
import { AssociationDemoLegislativeBodyFormComponent } from "./Entities/AssociationDemoLegislativeBody/associationdemolegislativebody.form.component";
import { AssociationDemoLegislativeIssueFormComponent } from "./Entities/AssociationDemoLegislativeIssue/associationdemolegislativeissue.form.component";
import { AssociationDemoMemberFollowFormComponent } from "./Entities/AssociationDemoMemberFollow/associationdemomemberfollow.form.component";
import { membershipMemberFormComponent } from "./Entities/membershipMember/membershipmember.form.component";
import { AssociationDemoMember__AssociationDemoFormComponent } from "./Entities/AssociationDemoMember__AssociationDemo/associationdemomember__associationdemo.form.component";
import { AssociationDemoMembershipTypeFormComponent } from "./Entities/AssociationDemoMembershipType/associationdemomembershiptype.form.component";
import { AssociationDemoMembershipFormComponent } from "./Entities/AssociationDemoMembership/associationdemomembership.form.component";
import { mjBizAppsSonarFactorFormComponent } from "./Entities/mjBizAppsSonarFactor/mjbizappssonarfactor.form.component";
import { mjBizAppsSonarInterventionAssignmentFormComponent } from "./Entities/mjBizAppsSonarInterventionAssignment/mjbizappssonarinterventionassignment.form.component";
import { mjBizAppsSonarInterventionOutcomeFormComponent } from "./Entities/mjBizAppsSonarInterventionOutcome/mjbizappssonarinterventionoutcome.form.component";
import { mjBizAppsSonarInterventionFormComponent } from "./Entities/mjBizAppsSonarIntervention/mjbizappssonarintervention.form.component";
import { mjBizAppsSonarModelFactorFormComponent } from "./Entities/mjBizAppsSonarModelFactor/mjbizappssonarmodelfactor.form.component";
import { mjBizAppsSonarModelRelatedEntityFormComponent } from "./Entities/mjBizAppsSonarModelRelatedEntity/mjbizappssonarmodelrelatedentity.form.component";
import { mjBizAppsSonarScoreBandSetFormComponent } from "./Entities/mjBizAppsSonarScoreBandSet/mjbizappssonarscorebandset.form.component";
import { mjBizAppsSonarScoreBandTransitionFormComponent } from "./Entities/mjBizAppsSonarScoreBandTransition/mjbizappssonarscorebandtransition.form.component";
import { mjBizAppsSonarScoreBandFormComponent } from "./Entities/mjBizAppsSonarScoreBand/mjbizappssonarscoreband.form.component";
import { mjBizAppsSonarScoreFactorContributionFormComponent } from "./Entities/mjBizAppsSonarScoreFactorContribution/mjbizappssonarscorefactorcontribution.form.component";
import { mjBizAppsSonarScoreHistoryFormComponent } from "./Entities/mjBizAppsSonarScoreHistory/mjbizappssonarscorehistory.form.component";
import { mjBizAppsSonarScoreModelAuditEventFormComponent } from "./Entities/mjBizAppsSonarScoreModelAuditEvent/mjbizappssonarscoremodelauditevent.form.component";
import { mjBizAppsSonarScoreModelVersionFormComponent } from "./Entities/mjBizAppsSonarScoreModelVersion/mjbizappssonarscoremodelversion.form.component";
import { mjBizAppsSonarScoreModelFormComponent } from "./Entities/mjBizAppsSonarScoreModel/mjbizappssonarscoremodel.form.component";
import { mjBizAppsSonarScoreRecomputeRunFormComponent } from "./Entities/mjBizAppsSonarScoreRecomputeRun/mjbizappssonarscorerecomputerun.form.component";
import { mjBizAppsSonarScoreSegmentFormComponent } from "./Entities/mjBizAppsSonarScoreSegment/mjbizappssonarscoresegment.form.component";
import { mjBizAppsSonarScoreFormComponent } from "./Entities/mjBizAppsSonarScore/mjbizappssonarscore.form.component";
import { mjBizAppsSonarTimeWindowFormComponent } from "./Entities/mjBizAppsSonarTimeWindow/mjbizappssonartimewindow.form.component";
import { AssociationDemoOrganizationFormComponent } from "./Entities/AssociationDemoOrganization/associationdemoorganization.form.component";
import { membershipPaymentFormComponent } from "./Entities/membershipPayment/membershippayment.form.component";
import { AssociationDemoPayment__AssociationDemoFormComponent } from "./Entities/AssociationDemoPayment__AssociationDemo/associationdemopayment__associationdemo.form.component";
import { AssociationDemoPolicyPositionFormComponent } from "./Entities/AssociationDemoPolicyPosition/associationdemopolicyposition.form.component";
import { AssociationDemoPostAttachmentFormComponent } from "./Entities/AssociationDemoPostAttachment/associationdemopostattachment.form.component";
import { AssociationDemoPostReactionFormComponent } from "./Entities/AssociationDemoPostReaction/associationdemopostreaction.form.component";
import { AssociationDemoPostTagFormComponent } from "./Entities/AssociationDemoPostTag/associationdemoposttag.form.component";
import { AssociationDemoProductAwardFormComponent } from "./Entities/AssociationDemoProductAward/associationdemoproductaward.form.component";
import { AssociationDemoProductCategoryFormComponent } from "./Entities/AssociationDemoProductCategory/associationdemoproductcategory.form.component";
import { AssociationDemoProductFormComponent } from "./Entities/AssociationDemoProduct/associationdemoproduct.form.component";
import { AssociationDemoRegulatoryCommentFormComponent } from "./Entities/AssociationDemoRegulatoryComment/associationdemoregulatorycomment.form.component";
import { AssociationDemoResourceCategoryFormComponent } from "./Entities/AssociationDemoResourceCategory/associationdemoresourcecategory.form.component";
import { AssociationDemoResourceDownloadFormComponent } from "./Entities/AssociationDemoResourceDownload/associationdemoresourcedownload.form.component";
import { AssociationDemoResourceRatingFormComponent } from "./Entities/AssociationDemoResourceRating/associationdemoresourcerating.form.component";
import { AssociationDemoResourceTagFormComponent } from "./Entities/AssociationDemoResourceTag/associationdemoresourcetag.form.component";
import { AssociationDemoResourceVersionFormComponent } from "./Entities/AssociationDemoResourceVersion/associationdemoresourceversion.form.component";
import { AssociationDemoResourceFormComponent } from "./Entities/AssociationDemoResource/associationdemoresource.form.component";
import { AssociationDemoSegmentFormComponent } from "./Entities/AssociationDemoSegment/associationdemosegment.form.component";
   

@NgModule({
declarations: [
    AssociationDemoAccreditingBodyFormComponent,
    AssociationDemoAdvocacyActionFormComponent,
    AssociationDemoBoardMemberFormComponent,
    AssociationDemoBoardPositionFormComponent,
    AssociationDemoCampaignMemberFormComponent,
    AssociationDemoCampaignFormComponent,
    AssociationDemoCertificateFormComponent,
    AssociationDemoCertificationRenewalFormComponent,
    AssociationDemoCertificationRequirementFormComponent,
    AssociationDemoCertificationTypeFormComponent,
    membershipCertificationFormComponent,
    AssociationDemoCertification__AssociationDemoFormComponent,
    AssociationDemoChapterMembershipFormComponent,
    AssociationDemoChapterOfficerFormComponent,
    AssociationDemoChapterFormComponent,
    AssociationDemoCommitteeMembershipFormComponent,
    AssociationDemoCommitteeFormComponent,
    AssociationDemoCompetitionEntryFormComponent,
    AssociationDemoCompetitionJudgeFormComponent,
    AssociationDemoCompetitionFormComponent],
imports: [
    CommonModule,
    FormsModule,
    BaseFormsModule,
    EntityViewerModule,
    LinkDirectivesModule
],
exports: [
]
})
export class GeneratedForms_SubModule_0 { }
    


@NgModule({
declarations: [
    AssociationDemoContinuingEducationFormComponent,
    AssociationDemoCourseFormComponent,
    AssociationDemoEmailClickFormComponent,
    membershipEmailEngagementFormComponent,
    AssociationDemoEmailSendFormComponent,
    AssociationDemoEmailTemplateFormComponent,
    AssociationDemoEnrollmentFormComponent,
    membershipEventRegistrationFormComponent,
    AssociationDemoEventRegistration__AssociationDemoFormComponent,
    AssociationDemoEventSessionFormComponent,
    AssociationDemoEventFormComponent,
    AssociationDemoForumCategoryFormComponent,
    AssociationDemoForumModerationFormComponent,
    AssociationDemoForumPostFormComponent,
    AssociationDemoForumThreadFormComponent,
    AssociationDemoGovernmentContactFormComponent,
    AssociationDemoInvoiceLineItemFormComponent,
    AssociationDemoInvoiceFormComponent,
    AssociationDemoLegislativeBodyFormComponent,
    AssociationDemoLegislativeIssueFormComponent],
imports: [
    CommonModule,
    FormsModule,
    BaseFormsModule,
    EntityViewerModule,
    LinkDirectivesModule
],
exports: [
]
})
export class GeneratedForms_SubModule_1 { }
    


@NgModule({
declarations: [
    AssociationDemoMemberFollowFormComponent,
    membershipMemberFormComponent,
    AssociationDemoMember__AssociationDemoFormComponent,
    AssociationDemoMembershipTypeFormComponent,
    AssociationDemoMembershipFormComponent,
    mjBizAppsSonarFactorFormComponent,
    mjBizAppsSonarInterventionAssignmentFormComponent,
    mjBizAppsSonarInterventionOutcomeFormComponent,
    mjBizAppsSonarInterventionFormComponent,
    mjBizAppsSonarModelFactorFormComponent,
    mjBizAppsSonarModelRelatedEntityFormComponent,
    mjBizAppsSonarScoreBandSetFormComponent,
    mjBizAppsSonarScoreBandTransitionFormComponent,
    mjBizAppsSonarScoreBandFormComponent,
    mjBizAppsSonarScoreFactorContributionFormComponent,
    mjBizAppsSonarScoreHistoryFormComponent,
    mjBizAppsSonarScoreModelAuditEventFormComponent,
    mjBizAppsSonarScoreModelVersionFormComponent,
    mjBizAppsSonarScoreModelFormComponent,
    mjBizAppsSonarScoreRecomputeRunFormComponent],
imports: [
    CommonModule,
    FormsModule,
    BaseFormsModule,
    EntityViewerModule,
    LinkDirectivesModule
],
exports: [
]
})
export class GeneratedForms_SubModule_2 { }
    


@NgModule({
declarations: [
    mjBizAppsSonarScoreSegmentFormComponent,
    mjBizAppsSonarScoreFormComponent,
    mjBizAppsSonarTimeWindowFormComponent,
    AssociationDemoOrganizationFormComponent,
    membershipPaymentFormComponent,
    AssociationDemoPayment__AssociationDemoFormComponent,
    AssociationDemoPolicyPositionFormComponent,
    AssociationDemoPostAttachmentFormComponent,
    AssociationDemoPostReactionFormComponent,
    AssociationDemoPostTagFormComponent,
    AssociationDemoProductAwardFormComponent,
    AssociationDemoProductCategoryFormComponent,
    AssociationDemoProductFormComponent,
    AssociationDemoRegulatoryCommentFormComponent,
    AssociationDemoResourceCategoryFormComponent,
    AssociationDemoResourceDownloadFormComponent,
    AssociationDemoResourceRatingFormComponent,
    AssociationDemoResourceTagFormComponent,
    AssociationDemoResourceVersionFormComponent,
    AssociationDemoResourceFormComponent],
imports: [
    CommonModule,
    FormsModule,
    BaseFormsModule,
    EntityViewerModule,
    LinkDirectivesModule
],
exports: [
]
})
export class GeneratedForms_SubModule_3 { }
    


@NgModule({
declarations: [
    AssociationDemoSegmentFormComponent],
imports: [
    CommonModule,
    FormsModule,
    BaseFormsModule,
    EntityViewerModule,
    LinkDirectivesModule
],
exports: [
]
})
export class GeneratedForms_SubModule_4 { }
    


@NgModule({
declarations: [
],
imports: [
    GeneratedForms_SubModule_0,
    GeneratedForms_SubModule_1,
    GeneratedForms_SubModule_2,
    GeneratedForms_SubModule_3,
    GeneratedForms_SubModule_4
]
})
export class GeneratedFormsModule { }
    
// Note: LoadXXXGeneratedForms() functions have been removed. Tree-shaking prevention
// is now handled by the pre-built class registration manifest system.
// See packages/CodeGenLib/CLASS_MANIFEST_GUIDE.md for details.
    