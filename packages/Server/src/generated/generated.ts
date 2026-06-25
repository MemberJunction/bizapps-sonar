/********************************************************************************
* ALL ENTITIES - TypeGraphQL Type Class Definition - AUTO GENERATED FILE
* Generated Entities and Resolvers for Server
*
*   >>> DO NOT MODIFY THIS FILE!!!!!!!!!!!!
*   >>> YOUR CHANGES WILL BE OVERWRITTEN
*   >>> THE NEXT TIME THIS FILE IS GENERATED
*
**********************************************************************************/
import { Arg, Ctx, Int, Query, Resolver, Field, Float, ObjectType, FieldResolver, Root, InputType, Mutation,
            PubSub, PubSubEngine, ResolverBase, RunViewByIDInput, RunViewByNameInput, RunDynamicViewInput,
            AppContext, KeyValuePairInput, DeleteOptionsInput, GraphQLTimestamp as Timestamp,
            GetReadOnlyProvider, GetReadWriteProvider, RestoreContextInput } from '@memberjunction/server';
import { Metadata, EntityPermissionType, CompositeKey, UserInfo } from '@memberjunction/core'

import { MaxLength } from 'class-validator';
import * as mj_core_schema_server_object_types from '@memberjunction/server'


import { AssociationDemoAccreditingBodyEntity, AssociationDemoAdvocacyActionEntity, AssociationDemoBoardMemberEntity, AssociationDemoBoardPositionEntity, AssociationDemoCampaignMemberEntity, AssociationDemoCampaignEntity, AssociationDemoCertificateEntity, AssociationDemoCertificationRenewalEntity, AssociationDemoCertificationRequirementEntity, AssociationDemoCertificationTypeEntity, membershipCertificationEntity, AssociationDemoCertification__AssociationDemoEntity, AssociationDemoChapterMembershipEntity, AssociationDemoChapterOfficerEntity, AssociationDemoChapterEntity, AssociationDemoCommitteeMembershipEntity, AssociationDemoCommitteeEntity, AssociationDemoCompetitionEntryEntity, AssociationDemoCompetitionJudgeEntity, AssociationDemoCompetitionEntity, AssociationDemoContinuingEducationEntity, AssociationDemoCourseEntity, AssociationDemoEmailClickEntity, membershipEmailEngagementEntity, AssociationDemoEmailSendEntity, AssociationDemoEmailTemplateEntity, AssociationDemoEnrollmentEntity, membershipEventRegistrationEntity, AssociationDemoEventRegistration__AssociationDemoEntity, AssociationDemoEventSessionEntity, AssociationDemoEventEntity, AssociationDemoForumCategoryEntity, AssociationDemoForumModerationEntity, AssociationDemoForumPostEntity, AssociationDemoForumThreadEntity, AssociationDemoGovernmentContactEntity, AssociationDemoInvoiceLineItemEntity, AssociationDemoInvoiceEntity, AssociationDemoLegislativeBodyEntity, AssociationDemoLegislativeIssueEntity, AssociationDemoMemberFollowEntity, membershipMemberEntity, AssociationDemoMember__AssociationDemoEntity, AssociationDemoMembershipTypeEntity, AssociationDemoMembershipEntity, mjBizAppsSonarFactorEntity, mjBizAppsSonarInterventionAssignmentEntity, mjBizAppsSonarInterventionOutcomeEntity, mjBizAppsSonarInterventionEntity, mjBizAppsSonarModelFactorEntity, mjBizAppsSonarModelRelatedEntityEntity, mjBizAppsSonarScoreBandSetEntity, mjBizAppsSonarScoreBandTransitionEntity, mjBizAppsSonarScoreBandEntity, mjBizAppsSonarScoreFactorContributionEntity, mjBizAppsSonarScoreHistoryEntity, mjBizAppsSonarScoreModelAuditEventEntity, mjBizAppsSonarScoreModelVersionEntity, mjBizAppsSonarScoreModelEntity, mjBizAppsSonarScoreRecomputeRunEntity, mjBizAppsSonarScoreSegmentEntity, mjBizAppsSonarScoreEntity, mjBizAppsSonarTimeWindowEntity, AssociationDemoOrganizationEntity, membershipPaymentEntity, AssociationDemoPayment__AssociationDemoEntity, AssociationDemoPolicyPositionEntity, AssociationDemoPostAttachmentEntity, AssociationDemoPostReactionEntity, AssociationDemoPostTagEntity, AssociationDemoProductAwardEntity, AssociationDemoProductCategoryEntity, AssociationDemoProductEntity, AssociationDemoRegulatoryCommentEntity, AssociationDemoResourceCategoryEntity, AssociationDemoResourceDownloadEntity, AssociationDemoResourceRatingEntity, AssociationDemoResourceTagEntity, AssociationDemoResourceVersionEntity, AssociationDemoResourceEntity, AssociationDemoSegmentEntity } from '@mj-biz-apps/sonar-entities';
    

//****************************************************************************
// ENTITY CLASS for Accrediting Bodies
//****************************************************************************
@ObjectType()
export class AssociationDemoAccreditingBody_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(255)
    Name: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    Abbreviation?: string;
        
    @Field({nullable: true}) 
    Description?: string;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    Website?: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    ContactEmail?: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    ContactPhone?: string;
        
    @Field(() => Boolean, {nullable: true}) 
    IsActive?: boolean;
        
    @Field(() => Boolean, {nullable: true}) 
    IsRecognized?: boolean;
        
    @Field({nullable: true}) 
    EstablishedDate?: Date;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    Country?: string;
        
    @Field(() => Int, {nullable: true}) 
    CertificationCount?: number;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field(() => [AssociationDemoCertificationType_])
    AssociationDemoCertificationTypes_AccreditingBodyIDArray: AssociationDemoCertificationType_[]; // Link to AssociationDemoCertificationTypes
    
}

//****************************************************************************
// INPUT TYPE for Accrediting Bodies
//****************************************************************************
@InputType()
export class CreateAssociationDemoAccreditingBodyInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Abbreviation: string | null;

    @Field({ nullable: true })
    Description: string | null;

    @Field({ nullable: true })
    Website: string | null;

    @Field({ nullable: true })
    ContactEmail: string | null;

    @Field({ nullable: true })
    ContactPhone: string | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean | null;

    @Field(() => Boolean, { nullable: true })
    IsRecognized?: boolean | null;

    @Field({ nullable: true })
    EstablishedDate: Date | null;

    @Field({ nullable: true })
    Country: string | null;

    @Field(() => Int, { nullable: true })
    CertificationCount?: number | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Accrediting Bodies
//****************************************************************************
@InputType()
export class UpdateAssociationDemoAccreditingBodyInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Abbreviation?: string | null;

    @Field({ nullable: true })
    Description?: string | null;

    @Field({ nullable: true })
    Website?: string | null;

    @Field({ nullable: true })
    ContactEmail?: string | null;

    @Field({ nullable: true })
    ContactPhone?: string | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean | null;

    @Field(() => Boolean, { nullable: true })
    IsRecognized?: boolean | null;

    @Field({ nullable: true })
    EstablishedDate?: Date | null;

    @Field({ nullable: true })
    Country?: string | null;

    @Field(() => Int, { nullable: true })
    CertificationCount?: number | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Accrediting Bodies
//****************************************************************************
@ObjectType()
export class RunAssociationDemoAccreditingBodyViewResult {
    @Field(() => [AssociationDemoAccreditingBody_])
    Results: AssociationDemoAccreditingBody_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoAccreditingBody_)
export class AssociationDemoAccreditingBodyResolver extends ResolverBase {
    @Query(() => RunAssociationDemoAccreditingBodyViewResult)
    async RunAssociationDemoAccreditingBodyViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoAccreditingBodyViewResult)
    async RunAssociationDemoAccreditingBodyViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoAccreditingBodyViewResult)
    async RunAssociationDemoAccreditingBodyDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Accrediting Bodies';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoAccreditingBody_, { nullable: true })
    async AssociationDemoAccreditingBody(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoAccreditingBody_ | null> {
        this.CheckUserReadPermissions('Accrediting Bodies', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwAccreditingBodies')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Accrediting Bodies', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Accrediting Bodies', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoCertificationType_])
    async AssociationDemoCertificationTypes_AccreditingBodyIDArray(@Root() associationdemoaccreditingbody_: AssociationDemoAccreditingBody_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Certification Types', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCertificationTypes')} WHERE ${provider.QuoteIdentifier('AccreditingBodyID')}='${associationdemoaccreditingbody_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Certification Types', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Certification Types', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoAccreditingBody_)
    async CreateAssociationDemoAccreditingBody(
        @Arg('input', () => CreateAssociationDemoAccreditingBodyInput) input: CreateAssociationDemoAccreditingBodyInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Accrediting Bodies', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoAccreditingBody_)
    async UpdateAssociationDemoAccreditingBody(
        @Arg('input', () => UpdateAssociationDemoAccreditingBodyInput) input: UpdateAssociationDemoAccreditingBodyInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Accrediting Bodies', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoAccreditingBody_)
    async DeleteAssociationDemoAccreditingBody(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Accrediting Bodies', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Advocacy Actions
//****************************************************************************
@ObjectType()
export class AssociationDemoAdvocacyAction_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    LegislativeIssueID: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    MemberID?: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    GovernmentContactID?: string;
        
    @Field() 
    @MaxLength(50)
    ActionType: string;
        
    @Field() 
    ActionDate: Date;
        
    @Field({nullable: true}) 
    Description?: string;
        
    @Field({nullable: true}) 
    Outcome?: string;
        
    @Field(() => Boolean, {nullable: true}) 
    FollowUpRequired?: boolean;
        
    @Field({nullable: true}) 
    FollowUpDate?: Date;
        
    @Field({nullable: true}) 
    Notes?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
}

//****************************************************************************
// INPUT TYPE for Advocacy Actions
//****************************************************************************
@InputType()
export class CreateAssociationDemoAdvocacyActionInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    LegislativeIssueID?: string;

    @Field({ nullable: true })
    MemberID: string | null;

    @Field({ nullable: true })
    GovernmentContactID: string | null;

    @Field({ nullable: true })
    ActionType?: string;

    @Field({ nullable: true })
    ActionDate?: Date;

    @Field({ nullable: true })
    Description: string | null;

    @Field({ nullable: true })
    Outcome: string | null;

    @Field(() => Boolean, { nullable: true })
    FollowUpRequired?: boolean | null;

    @Field({ nullable: true })
    FollowUpDate: Date | null;

    @Field({ nullable: true })
    Notes: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Advocacy Actions
//****************************************************************************
@InputType()
export class UpdateAssociationDemoAdvocacyActionInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    LegislativeIssueID?: string;

    @Field({ nullable: true })
    MemberID?: string | null;

    @Field({ nullable: true })
    GovernmentContactID?: string | null;

    @Field({ nullable: true })
    ActionType?: string;

    @Field({ nullable: true })
    ActionDate?: Date;

    @Field({ nullable: true })
    Description?: string | null;

    @Field({ nullable: true })
    Outcome?: string | null;

    @Field(() => Boolean, { nullable: true })
    FollowUpRequired?: boolean | null;

    @Field({ nullable: true })
    FollowUpDate?: Date | null;

    @Field({ nullable: true })
    Notes?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Advocacy Actions
//****************************************************************************
@ObjectType()
export class RunAssociationDemoAdvocacyActionViewResult {
    @Field(() => [AssociationDemoAdvocacyAction_])
    Results: AssociationDemoAdvocacyAction_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoAdvocacyAction_)
export class AssociationDemoAdvocacyActionResolver extends ResolverBase {
    @Query(() => RunAssociationDemoAdvocacyActionViewResult)
    async RunAssociationDemoAdvocacyActionViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoAdvocacyActionViewResult)
    async RunAssociationDemoAdvocacyActionViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoAdvocacyActionViewResult)
    async RunAssociationDemoAdvocacyActionDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Advocacy Actions';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoAdvocacyAction_, { nullable: true })
    async AssociationDemoAdvocacyAction(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoAdvocacyAction_ | null> {
        this.CheckUserReadPermissions('Advocacy Actions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwAdvocacyActions')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Advocacy Actions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Advocacy Actions', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoAdvocacyAction_)
    async CreateAssociationDemoAdvocacyAction(
        @Arg('input', () => CreateAssociationDemoAdvocacyActionInput) input: CreateAssociationDemoAdvocacyActionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Advocacy Actions', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoAdvocacyAction_)
    async UpdateAssociationDemoAdvocacyAction(
        @Arg('input', () => UpdateAssociationDemoAdvocacyActionInput) input: UpdateAssociationDemoAdvocacyActionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Advocacy Actions', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoAdvocacyAction_)
    async DeleteAssociationDemoAdvocacyAction(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Advocacy Actions', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Board Members
//****************************************************************************
@ObjectType()
export class AssociationDemoBoardMember_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    BoardPositionID: string;
        
    @Field() 
    @MaxLength(36)
    MemberID: string;
        
    @Field() 
    StartDate: Date;
        
    @Field({nullable: true}) 
    EndDate?: Date;
        
    @Field(() => Boolean) 
    IsActive: boolean;
        
    @Field({nullable: true}) 
    ElectionDate?: Date;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
}

//****************************************************************************
// INPUT TYPE for Board Members
//****************************************************************************
@InputType()
export class CreateAssociationDemoBoardMemberInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    BoardPositionID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    StartDate?: Date;

    @Field({ nullable: true })
    EndDate: Date | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean;

    @Field({ nullable: true })
    ElectionDate: Date | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Board Members
//****************************************************************************
@InputType()
export class UpdateAssociationDemoBoardMemberInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    BoardPositionID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    StartDate?: Date;

    @Field({ nullable: true })
    EndDate?: Date | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean;

    @Field({ nullable: true })
    ElectionDate?: Date | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Board Members
//****************************************************************************
@ObjectType()
export class RunAssociationDemoBoardMemberViewResult {
    @Field(() => [AssociationDemoBoardMember_])
    Results: AssociationDemoBoardMember_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoBoardMember_)
export class AssociationDemoBoardMemberResolver extends ResolverBase {
    @Query(() => RunAssociationDemoBoardMemberViewResult)
    async RunAssociationDemoBoardMemberViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoBoardMemberViewResult)
    async RunAssociationDemoBoardMemberViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoBoardMemberViewResult)
    async RunAssociationDemoBoardMemberDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Board Members';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoBoardMember_, { nullable: true })
    async AssociationDemoBoardMember(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoBoardMember_ | null> {
        this.CheckUserReadPermissions('Board Members', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwBoardMembers')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Board Members', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Board Members', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoBoardMember_)
    async CreateAssociationDemoBoardMember(
        @Arg('input', () => CreateAssociationDemoBoardMemberInput) input: CreateAssociationDemoBoardMemberInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Board Members', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoBoardMember_)
    async UpdateAssociationDemoBoardMember(
        @Arg('input', () => UpdateAssociationDemoBoardMemberInput) input: UpdateAssociationDemoBoardMemberInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Board Members', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoBoardMember_)
    async DeleteAssociationDemoBoardMember(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Board Members', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Board Positions
//****************************************************************************
@ObjectType()
export class AssociationDemoBoardPosition_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(100)
    PositionTitle: string;
        
    @Field(() => Int) 
    PositionOrder: number;
        
    @Field({nullable: true}) 
    Description?: string;
        
    @Field(() => Int, {nullable: true}) 
    TermLengthYears?: number;
        
    @Field(() => Boolean) 
    IsOfficer: boolean;
        
    @Field(() => Boolean) 
    IsActive: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field(() => [AssociationDemoBoardMember_])
    AssociationDemoBoardMembers_BoardPositionIDArray: AssociationDemoBoardMember_[]; // Link to AssociationDemoBoardMembers
    
}

//****************************************************************************
// INPUT TYPE for Board Positions
//****************************************************************************
@InputType()
export class CreateAssociationDemoBoardPositionInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    PositionTitle?: string;

    @Field(() => Int, { nullable: true })
    PositionOrder?: number;

    @Field({ nullable: true })
    Description: string | null;

    @Field(() => Int, { nullable: true })
    TermLengthYears: number | null;

    @Field(() => Boolean, { nullable: true })
    IsOfficer?: boolean;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Board Positions
//****************************************************************************
@InputType()
export class UpdateAssociationDemoBoardPositionInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    PositionTitle?: string;

    @Field(() => Int, { nullable: true })
    PositionOrder?: number;

    @Field({ nullable: true })
    Description?: string | null;

    @Field(() => Int, { nullable: true })
    TermLengthYears?: number | null;

    @Field(() => Boolean, { nullable: true })
    IsOfficer?: boolean;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Board Positions
//****************************************************************************
@ObjectType()
export class RunAssociationDemoBoardPositionViewResult {
    @Field(() => [AssociationDemoBoardPosition_])
    Results: AssociationDemoBoardPosition_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoBoardPosition_)
export class AssociationDemoBoardPositionResolver extends ResolverBase {
    @Query(() => RunAssociationDemoBoardPositionViewResult)
    async RunAssociationDemoBoardPositionViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoBoardPositionViewResult)
    async RunAssociationDemoBoardPositionViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoBoardPositionViewResult)
    async RunAssociationDemoBoardPositionDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Board Positions';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoBoardPosition_, { nullable: true })
    async AssociationDemoBoardPosition(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoBoardPosition_ | null> {
        this.CheckUserReadPermissions('Board Positions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwBoardPositions')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Board Positions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Board Positions', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoBoardMember_])
    async AssociationDemoBoardMembers_BoardPositionIDArray(@Root() associationdemoboardposition_: AssociationDemoBoardPosition_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Board Members', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwBoardMembers')} WHERE ${provider.QuoteIdentifier('BoardPositionID')}='${associationdemoboardposition_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Board Members', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Board Members', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoBoardPosition_)
    async CreateAssociationDemoBoardPosition(
        @Arg('input', () => CreateAssociationDemoBoardPositionInput) input: CreateAssociationDemoBoardPositionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Board Positions', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoBoardPosition_)
    async UpdateAssociationDemoBoardPosition(
        @Arg('input', () => UpdateAssociationDemoBoardPositionInput) input: UpdateAssociationDemoBoardPositionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Board Positions', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoBoardPosition_)
    async DeleteAssociationDemoBoardPosition(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Board Positions', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Campaign Members
//****************************************************************************
@ObjectType()
export class AssociationDemoCampaignMember_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    CampaignID: string;
        
    @Field() 
    @MaxLength(36)
    MemberID: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    SegmentID?: string;
        
    @Field() 
    AddedDate: Date;
        
    @Field() 
    @MaxLength(20)
    Status: string;
        
    @Field({nullable: true}) 
    ResponseDate?: Date;
        
    @Field(() => Float, {nullable: true}) 
    ConversionValue?: number;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(255)
    Campaign: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    Segment?: string;
        
}

//****************************************************************************
// INPUT TYPE for Campaign Members
//****************************************************************************
@InputType()
export class CreateAssociationDemoCampaignMemberInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    CampaignID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    SegmentID: string | null;

    @Field({ nullable: true })
    AddedDate?: Date;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    ResponseDate: Date | null;

    @Field(() => Float, { nullable: true })
    ConversionValue: number | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Campaign Members
//****************************************************************************
@InputType()
export class UpdateAssociationDemoCampaignMemberInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    CampaignID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    SegmentID?: string | null;

    @Field({ nullable: true })
    AddedDate?: Date;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    ResponseDate?: Date | null;

    @Field(() => Float, { nullable: true })
    ConversionValue?: number | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Campaign Members
//****************************************************************************
@ObjectType()
export class RunAssociationDemoCampaignMemberViewResult {
    @Field(() => [AssociationDemoCampaignMember_])
    Results: AssociationDemoCampaignMember_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoCampaignMember_)
export class AssociationDemoCampaignMemberResolver extends ResolverBase {
    @Query(() => RunAssociationDemoCampaignMemberViewResult)
    async RunAssociationDemoCampaignMemberViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoCampaignMemberViewResult)
    async RunAssociationDemoCampaignMemberViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoCampaignMemberViewResult)
    async RunAssociationDemoCampaignMemberDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Campaign Members';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoCampaignMember_, { nullable: true })
    async AssociationDemoCampaignMember(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoCampaignMember_ | null> {
        this.CheckUserReadPermissions('Campaign Members', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCampaignMembers')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Campaign Members', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Campaign Members', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoCampaignMember_)
    async CreateAssociationDemoCampaignMember(
        @Arg('input', () => CreateAssociationDemoCampaignMemberInput) input: CreateAssociationDemoCampaignMemberInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Campaign Members', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoCampaignMember_)
    async UpdateAssociationDemoCampaignMember(
        @Arg('input', () => UpdateAssociationDemoCampaignMemberInput) input: UpdateAssociationDemoCampaignMemberInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Campaign Members', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoCampaignMember_)
    async DeleteAssociationDemoCampaignMember(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Campaign Members', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Campaigns
//****************************************************************************
@ObjectType()
export class AssociationDemoCampaign_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(255)
    Name: string;
        
    @Field() 
    @MaxLength(50)
    CampaignType: string;
        
    @Field() 
    @MaxLength(20)
    Status: string;
        
    @Field({nullable: true}) 
    StartDate?: Date;
        
    @Field({nullable: true}) 
    EndDate?: Date;
        
    @Field(() => Float, {nullable: true}) 
    Budget?: number;
        
    @Field(() => Float, {nullable: true}) 
    ActualCost?: number;
        
    @Field({nullable: true}) 
    TargetAudience?: string;
        
    @Field({nullable: true}) 
    Goals?: string;
        
    @Field({nullable: true}) 
    Description?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field(() => [AssociationDemoEmailSend_])
    AssociationDemoEmailSends_CampaignIDArray: AssociationDemoEmailSend_[]; // Link to AssociationDemoEmailSends
    
    @Field(() => [AssociationDemoCampaignMember_])
    AssociationDemoCampaignMembers_CampaignIDArray: AssociationDemoCampaignMember_[]; // Link to AssociationDemoCampaignMembers
    
}

//****************************************************************************
// INPUT TYPE for Campaigns
//****************************************************************************
@InputType()
export class CreateAssociationDemoCampaignInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    CampaignType?: string;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    StartDate: Date | null;

    @Field({ nullable: true })
    EndDate: Date | null;

    @Field(() => Float, { nullable: true })
    Budget: number | null;

    @Field(() => Float, { nullable: true })
    ActualCost: number | null;

    @Field({ nullable: true })
    TargetAudience: string | null;

    @Field({ nullable: true })
    Goals: string | null;

    @Field({ nullable: true })
    Description: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Campaigns
//****************************************************************************
@InputType()
export class UpdateAssociationDemoCampaignInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    CampaignType?: string;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    StartDate?: Date | null;

    @Field({ nullable: true })
    EndDate?: Date | null;

    @Field(() => Float, { nullable: true })
    Budget?: number | null;

    @Field(() => Float, { nullable: true })
    ActualCost?: number | null;

    @Field({ nullable: true })
    TargetAudience?: string | null;

    @Field({ nullable: true })
    Goals?: string | null;

    @Field({ nullable: true })
    Description?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Campaigns
//****************************************************************************
@ObjectType()
export class RunAssociationDemoCampaignViewResult {
    @Field(() => [AssociationDemoCampaign_])
    Results: AssociationDemoCampaign_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoCampaign_)
export class AssociationDemoCampaignResolver extends ResolverBase {
    @Query(() => RunAssociationDemoCampaignViewResult)
    async RunAssociationDemoCampaignViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoCampaignViewResult)
    async RunAssociationDemoCampaignViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoCampaignViewResult)
    async RunAssociationDemoCampaignDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Campaigns';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoCampaign_, { nullable: true })
    async AssociationDemoCampaign(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoCampaign_ | null> {
        this.CheckUserReadPermissions('Campaigns', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCampaigns')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Campaigns', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Campaigns', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoEmailSend_])
    async AssociationDemoEmailSends_CampaignIDArray(@Root() associationdemocampaign_: AssociationDemoCampaign_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Email Sends', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwEmailSends')} WHERE ${provider.QuoteIdentifier('CampaignID')}='${associationdemocampaign_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Email Sends', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Email Sends', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoCampaignMember_])
    async AssociationDemoCampaignMembers_CampaignIDArray(@Root() associationdemocampaign_: AssociationDemoCampaign_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Campaign Members', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCampaignMembers')} WHERE ${provider.QuoteIdentifier('CampaignID')}='${associationdemocampaign_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Campaign Members', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Campaign Members', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoCampaign_)
    async CreateAssociationDemoCampaign(
        @Arg('input', () => CreateAssociationDemoCampaignInput) input: CreateAssociationDemoCampaignInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Campaigns', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoCampaign_)
    async UpdateAssociationDemoCampaign(
        @Arg('input', () => UpdateAssociationDemoCampaignInput) input: UpdateAssociationDemoCampaignInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Campaigns', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoCampaign_)
    async DeleteAssociationDemoCampaign(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Campaigns', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Certificates
//****************************************************************************
@ObjectType()
export class AssociationDemoCertificate_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    EnrollmentID: string;
        
    @Field() 
    @MaxLength(50)
    CertificateNumber: string;
        
    @Field() 
    IssuedDate: Date;
        
    @Field({nullable: true}) 
    ExpirationDate?: Date;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    CertificatePDFURL?: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    VerificationCode?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
}

//****************************************************************************
// INPUT TYPE for Certificates
//****************************************************************************
@InputType()
export class CreateAssociationDemoCertificateInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    EnrollmentID?: string;

    @Field({ nullable: true })
    CertificateNumber?: string;

    @Field({ nullable: true })
    IssuedDate?: Date;

    @Field({ nullable: true })
    ExpirationDate: Date | null;

    @Field({ nullable: true })
    CertificatePDFURL: string | null;

    @Field({ nullable: true })
    VerificationCode: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Certificates
//****************************************************************************
@InputType()
export class UpdateAssociationDemoCertificateInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    EnrollmentID?: string;

    @Field({ nullable: true })
    CertificateNumber?: string;

    @Field({ nullable: true })
    IssuedDate?: Date;

    @Field({ nullable: true })
    ExpirationDate?: Date | null;

    @Field({ nullable: true })
    CertificatePDFURL?: string | null;

    @Field({ nullable: true })
    VerificationCode?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Certificates
//****************************************************************************
@ObjectType()
export class RunAssociationDemoCertificateViewResult {
    @Field(() => [AssociationDemoCertificate_])
    Results: AssociationDemoCertificate_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoCertificate_)
export class AssociationDemoCertificateResolver extends ResolverBase {
    @Query(() => RunAssociationDemoCertificateViewResult)
    async RunAssociationDemoCertificateViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoCertificateViewResult)
    async RunAssociationDemoCertificateViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoCertificateViewResult)
    async RunAssociationDemoCertificateDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Certificates';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoCertificate_, { nullable: true })
    async AssociationDemoCertificate(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoCertificate_ | null> {
        this.CheckUserReadPermissions('Certificates', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCertificates')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Certificates', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Certificates', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoCertificate_)
    async CreateAssociationDemoCertificate(
        @Arg('input', () => CreateAssociationDemoCertificateInput) input: CreateAssociationDemoCertificateInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Certificates', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoCertificate_)
    async UpdateAssociationDemoCertificate(
        @Arg('input', () => UpdateAssociationDemoCertificateInput) input: UpdateAssociationDemoCertificateInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Certificates', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoCertificate_)
    async DeleteAssociationDemoCertificate(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Certificates', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Certification Renewals
//****************************************************************************
@ObjectType()
export class AssociationDemoCertificationRenewal_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    CertificationID: string;
        
    @Field() 
    RenewalDate: Date;
        
    @Field() 
    ExpirationDate: Date;
        
    @Field(() => Int, {nullable: true}) 
    CECreditsApplied?: number;
        
    @Field(() => Float, {nullable: true}) 
    FeePaid?: number;
        
    @Field({nullable: true}) 
    PaymentDate?: Date;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    Status?: string;
        
    @Field({nullable: true}) 
    Notes?: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    ProcessedBy?: string;
        
    @Field({nullable: true}) 
    ProcessedDate?: Date;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
}

//****************************************************************************
// INPUT TYPE for Certification Renewals
//****************************************************************************
@InputType()
export class CreateAssociationDemoCertificationRenewalInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    CertificationID?: string;

    @Field({ nullable: true })
    RenewalDate?: Date;

    @Field({ nullable: true })
    ExpirationDate?: Date;

    @Field(() => Int, { nullable: true })
    CECreditsApplied?: number | null;

    @Field(() => Float, { nullable: true })
    FeePaid: number | null;

    @Field({ nullable: true })
    PaymentDate: Date | null;

    @Field({ nullable: true })
    Status?: string | null;

    @Field({ nullable: true })
    Notes: string | null;

    @Field({ nullable: true })
    ProcessedBy: string | null;

    @Field({ nullable: true })
    ProcessedDate: Date | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Certification Renewals
//****************************************************************************
@InputType()
export class UpdateAssociationDemoCertificationRenewalInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    CertificationID?: string;

    @Field({ nullable: true })
    RenewalDate?: Date;

    @Field({ nullable: true })
    ExpirationDate?: Date;

    @Field(() => Int, { nullable: true })
    CECreditsApplied?: number | null;

    @Field(() => Float, { nullable: true })
    FeePaid?: number | null;

    @Field({ nullable: true })
    PaymentDate?: Date | null;

    @Field({ nullable: true })
    Status?: string | null;

    @Field({ nullable: true })
    Notes?: string | null;

    @Field({ nullable: true })
    ProcessedBy?: string | null;

    @Field({ nullable: true })
    ProcessedDate?: Date | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Certification Renewals
//****************************************************************************
@ObjectType()
export class RunAssociationDemoCertificationRenewalViewResult {
    @Field(() => [AssociationDemoCertificationRenewal_])
    Results: AssociationDemoCertificationRenewal_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoCertificationRenewal_)
export class AssociationDemoCertificationRenewalResolver extends ResolverBase {
    @Query(() => RunAssociationDemoCertificationRenewalViewResult)
    async RunAssociationDemoCertificationRenewalViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoCertificationRenewalViewResult)
    async RunAssociationDemoCertificationRenewalViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoCertificationRenewalViewResult)
    async RunAssociationDemoCertificationRenewalDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Certification Renewals';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoCertificationRenewal_, { nullable: true })
    async AssociationDemoCertificationRenewal(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoCertificationRenewal_ | null> {
        this.CheckUserReadPermissions('Certification Renewals', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCertificationRenewals')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Certification Renewals', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Certification Renewals', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoCertificationRenewal_)
    async CreateAssociationDemoCertificationRenewal(
        @Arg('input', () => CreateAssociationDemoCertificationRenewalInput) input: CreateAssociationDemoCertificationRenewalInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Certification Renewals', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoCertificationRenewal_)
    async UpdateAssociationDemoCertificationRenewal(
        @Arg('input', () => UpdateAssociationDemoCertificationRenewalInput) input: UpdateAssociationDemoCertificationRenewalInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Certification Renewals', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoCertificationRenewal_)
    async DeleteAssociationDemoCertificationRenewal(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Certification Renewals', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Certification Requirements
//****************************************************************************
@ObjectType()
export class AssociationDemoCertificationRequirement_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    CertificationTypeID: string;
        
    @Field() 
    @MaxLength(100)
    RequirementType: string;
        
    @Field() 
    Description: string;
        
    @Field(() => Boolean, {nullable: true}) 
    IsRequired?: boolean;
        
    @Field(() => Int, {nullable: true}) 
    DisplayOrder?: number;
        
    @Field({nullable: true}) 
    Details?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(255)
    CertificationType: string;
        
}

//****************************************************************************
// INPUT TYPE for Certification Requirements
//****************************************************************************
@InputType()
export class CreateAssociationDemoCertificationRequirementInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    CertificationTypeID?: string;

    @Field({ nullable: true })
    RequirementType?: string;

    @Field({ nullable: true })
    Description?: string;

    @Field(() => Boolean, { nullable: true })
    IsRequired?: boolean | null;

    @Field(() => Int, { nullable: true })
    DisplayOrder?: number | null;

    @Field({ nullable: true })
    Details: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Certification Requirements
//****************************************************************************
@InputType()
export class UpdateAssociationDemoCertificationRequirementInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    CertificationTypeID?: string;

    @Field({ nullable: true })
    RequirementType?: string;

    @Field({ nullable: true })
    Description?: string;

    @Field(() => Boolean, { nullable: true })
    IsRequired?: boolean | null;

    @Field(() => Int, { nullable: true })
    DisplayOrder?: number | null;

    @Field({ nullable: true })
    Details?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Certification Requirements
//****************************************************************************
@ObjectType()
export class RunAssociationDemoCertificationRequirementViewResult {
    @Field(() => [AssociationDemoCertificationRequirement_])
    Results: AssociationDemoCertificationRequirement_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoCertificationRequirement_)
export class AssociationDemoCertificationRequirementResolver extends ResolverBase {
    @Query(() => RunAssociationDemoCertificationRequirementViewResult)
    async RunAssociationDemoCertificationRequirementViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoCertificationRequirementViewResult)
    async RunAssociationDemoCertificationRequirementViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoCertificationRequirementViewResult)
    async RunAssociationDemoCertificationRequirementDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Certification Requirements';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoCertificationRequirement_, { nullable: true })
    async AssociationDemoCertificationRequirement(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoCertificationRequirement_ | null> {
        this.CheckUserReadPermissions('Certification Requirements', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCertificationRequirements')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Certification Requirements', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Certification Requirements', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoCertificationRequirement_)
    async CreateAssociationDemoCertificationRequirement(
        @Arg('input', () => CreateAssociationDemoCertificationRequirementInput) input: CreateAssociationDemoCertificationRequirementInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Certification Requirements', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoCertificationRequirement_)
    async UpdateAssociationDemoCertificationRequirement(
        @Arg('input', () => UpdateAssociationDemoCertificationRequirementInput) input: UpdateAssociationDemoCertificationRequirementInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Certification Requirements', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoCertificationRequirement_)
    async DeleteAssociationDemoCertificationRequirement(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Certification Requirements', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Certification Types
//****************************************************************************
@ObjectType()
export class AssociationDemoCertificationType_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    AccreditingBodyID: string;
        
    @Field() 
    @MaxLength(255)
    Name: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    Abbreviation?: string;
        
    @Field({nullable: true}) 
    Description?: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    Level?: string;
        
    @Field(() => Int, {nullable: true}) 
    DurationMonths?: number;
        
    @Field(() => Int, {nullable: true}) 
    RenewalRequiredMonths?: number;
        
    @Field(() => Int, {nullable: true}) 
    CECreditsRequired?: number;
        
    @Field(() => Boolean, {nullable: true}) 
    ExamRequired?: boolean;
        
    @Field(() => Boolean, {nullable: true}) 
    PracticalRequired?: boolean;
        
    @Field(() => Float, {nullable: true}) 
    CostUSD?: number;
        
    @Field(() => Boolean, {nullable: true}) 
    IsActive?: boolean;
        
    @Field({nullable: true}) 
    Prerequisites?: string;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    TargetAudience?: string;
        
    @Field(() => Int, {nullable: true}) 
    CertificationCount?: number;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(255)
    AccreditingBody: string;
        
    @Field(() => [AssociationDemoCertificationRequirement_])
    AssociationDemoCertificationRequirements_CertificationTypeIDArray: AssociationDemoCertificationRequirement_[]; // Link to AssociationDemoCertificationRequirements
    
    @Field(() => [AssociationDemoCertification_])
    AssociationDemoCertifications__AssociationDemo_CertificationTypeIDArray: AssociationDemoCertification_[]; // Link to AssociationDemoCertifications__AssociationDemo
    
}

//****************************************************************************
// INPUT TYPE for Certification Types
//****************************************************************************
@InputType()
export class CreateAssociationDemoCertificationTypeInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    AccreditingBodyID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Abbreviation: string | null;

    @Field({ nullable: true })
    Description: string | null;

    @Field({ nullable: true })
    Level: string | null;

    @Field(() => Int, { nullable: true })
    DurationMonths: number | null;

    @Field(() => Int, { nullable: true })
    RenewalRequiredMonths: number | null;

    @Field(() => Int, { nullable: true })
    CECreditsRequired?: number | null;

    @Field(() => Boolean, { nullable: true })
    ExamRequired?: boolean | null;

    @Field(() => Boolean, { nullable: true })
    PracticalRequired?: boolean | null;

    @Field(() => Float, { nullable: true })
    CostUSD: number | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean | null;

    @Field({ nullable: true })
    Prerequisites: string | null;

    @Field({ nullable: true })
    TargetAudience: string | null;

    @Field(() => Int, { nullable: true })
    CertificationCount?: number | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Certification Types
//****************************************************************************
@InputType()
export class UpdateAssociationDemoCertificationTypeInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    AccreditingBodyID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Abbreviation?: string | null;

    @Field({ nullable: true })
    Description?: string | null;

    @Field({ nullable: true })
    Level?: string | null;

    @Field(() => Int, { nullable: true })
    DurationMonths?: number | null;

    @Field(() => Int, { nullable: true })
    RenewalRequiredMonths?: number | null;

    @Field(() => Int, { nullable: true })
    CECreditsRequired?: number | null;

    @Field(() => Boolean, { nullable: true })
    ExamRequired?: boolean | null;

    @Field(() => Boolean, { nullable: true })
    PracticalRequired?: boolean | null;

    @Field(() => Float, { nullable: true })
    CostUSD?: number | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean | null;

    @Field({ nullable: true })
    Prerequisites?: string | null;

    @Field({ nullable: true })
    TargetAudience?: string | null;

    @Field(() => Int, { nullable: true })
    CertificationCount?: number | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Certification Types
//****************************************************************************
@ObjectType()
export class RunAssociationDemoCertificationTypeViewResult {
    @Field(() => [AssociationDemoCertificationType_])
    Results: AssociationDemoCertificationType_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoCertificationType_)
export class AssociationDemoCertificationTypeResolver extends ResolverBase {
    @Query(() => RunAssociationDemoCertificationTypeViewResult)
    async RunAssociationDemoCertificationTypeViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoCertificationTypeViewResult)
    async RunAssociationDemoCertificationTypeViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoCertificationTypeViewResult)
    async RunAssociationDemoCertificationTypeDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Certification Types';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoCertificationType_, { nullable: true })
    async AssociationDemoCertificationType(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoCertificationType_ | null> {
        this.CheckUserReadPermissions('Certification Types', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCertificationTypes')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Certification Types', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Certification Types', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoCertificationRequirement_])
    async AssociationDemoCertificationRequirements_CertificationTypeIDArray(@Root() associationdemocertificationtype_: AssociationDemoCertificationType_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Certification Requirements', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCertificationRequirements')} WHERE ${provider.QuoteIdentifier('CertificationTypeID')}='${associationdemocertificationtype_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Certification Requirements', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Certification Requirements', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoCertification_])
    async AssociationDemoCertifications__AssociationDemo_CertificationTypeIDArray(@Root() associationdemocertificationtype_: AssociationDemoCertificationType_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Certifications__AssociationDemo', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCertifications__AssociationDemo')} WHERE ${provider.QuoteIdentifier('CertificationTypeID')}='${associationdemocertificationtype_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Certifications__AssociationDemo', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Certifications__AssociationDemo', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoCertificationType_)
    async CreateAssociationDemoCertificationType(
        @Arg('input', () => CreateAssociationDemoCertificationTypeInput) input: CreateAssociationDemoCertificationTypeInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Certification Types', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoCertificationType_)
    async UpdateAssociationDemoCertificationType(
        @Arg('input', () => UpdateAssociationDemoCertificationTypeInput) input: UpdateAssociationDemoCertificationTypeInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Certification Types', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoCertificationType_)
    async DeleteAssociationDemoCertificationType(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Certification Types', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Certifications
//****************************************************************************
@ObjectType()
export class membershipCertification_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    MemberID: string;
        
    @Field() 
    @MaxLength(200)
    CourseName: string;
        
    @Field() 
    CompletedOn: Date;
        
    @Field(() => Boolean) 
    IsActive: boolean;
        
    @Field(() => Float) 
    CreditHours: number;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
}

//****************************************************************************
// INPUT TYPE for Certifications
//****************************************************************************
@InputType()
export class CreatemembershipCertificationInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    CourseName?: string;

    @Field({ nullable: true })
    CompletedOn?: Date;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean;

    @Field(() => Float, { nullable: true })
    CreditHours?: number;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Certifications
//****************************************************************************
@InputType()
export class UpdatemembershipCertificationInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    CourseName?: string;

    @Field({ nullable: true })
    CompletedOn?: Date;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean;

    @Field(() => Float, { nullable: true })
    CreditHours?: number;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Certifications
//****************************************************************************
@ObjectType()
export class RunmembershipCertificationViewResult {
    @Field(() => [membershipCertification_])
    Results: membershipCertification_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(membershipCertification_)
export class membershipCertificationResolver extends ResolverBase {
    @Query(() => RunmembershipCertificationViewResult)
    async RunmembershipCertificationViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmembershipCertificationViewResult)
    async RunmembershipCertificationViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmembershipCertificationViewResult)
    async RunmembershipCertificationDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Certifications';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => membershipCertification_, { nullable: true })
    async membershipCertification(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<membershipCertification_ | null> {
        this.CheckUserReadPermissions('Certifications', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('membership', 'vwCertifications')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Certifications', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Certifications', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => membershipCertification_)
    async CreatemembershipCertification(
        @Arg('input', () => CreatemembershipCertificationInput) input: CreatemembershipCertificationInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Certifications', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => membershipCertification_)
    async UpdatemembershipCertification(
        @Arg('input', () => UpdatemembershipCertificationInput) input: UpdatemembershipCertificationInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Certifications', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => membershipCertification_)
    async DeletemembershipCertification(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Certifications', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Certifications__AssociationDemo
//****************************************************************************
@ObjectType()
export class AssociationDemoCertification_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    MemberID: string;
        
    @Field() 
    @MaxLength(36)
    CertificationTypeID: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    CertificationNumber?: string;
        
    @Field() 
    DateEarned: Date;
        
    @Field({nullable: true}) 
    DateExpires?: Date;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    Status?: string;
        
    @Field(() => Int, {nullable: true}) 
    Score?: number;
        
    @Field({nullable: true}) 
    Notes?: string;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    VerificationURL?: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    IssuedBy?: string;
        
    @Field({nullable: true}) 
    LastRenewalDate?: Date;
        
    @Field({nullable: true}) 
    NextRenewalDate?: Date;
        
    @Field(() => Int, {nullable: true}) 
    CECreditsEarned?: number;
        
    @Field(() => Int, {nullable: true}) 
    RenewalCount?: number;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(255)
    CertificationType: string;
        
    @Field(() => [AssociationDemoContinuingEducation_])
    AssociationDemoContinuingEducations_CertificationIDArray: AssociationDemoContinuingEducation_[]; // Link to AssociationDemoContinuingEducations
    
    @Field(() => [AssociationDemoCertificationRenewal_])
    AssociationDemoCertificationRenewals_CertificationIDArray: AssociationDemoCertificationRenewal_[]; // Link to AssociationDemoCertificationRenewals
    
}

//****************************************************************************
// INPUT TYPE for Certifications__AssociationDemo
//****************************************************************************
@InputType()
export class CreateAssociationDemoCertificationInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    CertificationTypeID?: string;

    @Field({ nullable: true })
    CertificationNumber: string | null;

    @Field({ nullable: true })
    DateEarned?: Date;

    @Field({ nullable: true })
    DateExpires: Date | null;

    @Field({ nullable: true })
    Status?: string | null;

    @Field(() => Int, { nullable: true })
    Score: number | null;

    @Field({ nullable: true })
    Notes: string | null;

    @Field({ nullable: true })
    VerificationURL: string | null;

    @Field({ nullable: true })
    IssuedBy: string | null;

    @Field({ nullable: true })
    LastRenewalDate: Date | null;

    @Field({ nullable: true })
    NextRenewalDate: Date | null;

    @Field(() => Int, { nullable: true })
    CECreditsEarned?: number | null;

    @Field(() => Int, { nullable: true })
    RenewalCount?: number | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Certifications__AssociationDemo
//****************************************************************************
@InputType()
export class UpdateAssociationDemoCertificationInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    CertificationTypeID?: string;

    @Field({ nullable: true })
    CertificationNumber?: string | null;

    @Field({ nullable: true })
    DateEarned?: Date;

    @Field({ nullable: true })
    DateExpires?: Date | null;

    @Field({ nullable: true })
    Status?: string | null;

    @Field(() => Int, { nullable: true })
    Score?: number | null;

    @Field({ nullable: true })
    Notes?: string | null;

    @Field({ nullable: true })
    VerificationURL?: string | null;

    @Field({ nullable: true })
    IssuedBy?: string | null;

    @Field({ nullable: true })
    LastRenewalDate?: Date | null;

    @Field({ nullable: true })
    NextRenewalDate?: Date | null;

    @Field(() => Int, { nullable: true })
    CECreditsEarned?: number | null;

    @Field(() => Int, { nullable: true })
    RenewalCount?: number | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Certifications__AssociationDemo
//****************************************************************************
@ObjectType()
export class RunAssociationDemoCertificationViewResult {
    @Field(() => [AssociationDemoCertification_])
    Results: AssociationDemoCertification_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoCertification_)
export class AssociationDemoCertificationResolver extends ResolverBase {
    @Query(() => RunAssociationDemoCertificationViewResult)
    async RunAssociationDemoCertificationViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoCertificationViewResult)
    async RunAssociationDemoCertificationViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoCertificationViewResult)
    async RunAssociationDemoCertificationDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Certifications__AssociationDemo';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoCertification_, { nullable: true })
    async AssociationDemoCertification(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoCertification_ | null> {
        this.CheckUserReadPermissions('Certifications__AssociationDemo', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCertifications__AssociationDemo')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Certifications__AssociationDemo', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Certifications__AssociationDemo', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoContinuingEducation_])
    async AssociationDemoContinuingEducations_CertificationIDArray(@Root() associationdemocertification_: AssociationDemoCertification_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Continuing Educations', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwContinuingEducations')} WHERE ${provider.QuoteIdentifier('CertificationID')}='${associationdemocertification_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Continuing Educations', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Continuing Educations', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoCertificationRenewal_])
    async AssociationDemoCertificationRenewals_CertificationIDArray(@Root() associationdemocertification_: AssociationDemoCertification_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Certification Renewals', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCertificationRenewals')} WHERE ${provider.QuoteIdentifier('CertificationID')}='${associationdemocertification_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Certification Renewals', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Certification Renewals', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoCertification_)
    async CreateAssociationDemoCertification(
        @Arg('input', () => CreateAssociationDemoCertificationInput) input: CreateAssociationDemoCertificationInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Certifications__AssociationDemo', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoCertification_)
    async UpdateAssociationDemoCertification(
        @Arg('input', () => UpdateAssociationDemoCertificationInput) input: UpdateAssociationDemoCertificationInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Certifications__AssociationDemo', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoCertification_)
    async DeleteAssociationDemoCertification(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Certifications__AssociationDemo', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Chapter Memberships
//****************************************************************************
@ObjectType()
export class AssociationDemoChapterMembership_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    ChapterID: string;
        
    @Field() 
    @MaxLength(36)
    MemberID: string;
        
    @Field() 
    JoinDate: Date;
        
    @Field() 
    @MaxLength(20)
    Status: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    Role?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(255)
    Chapter: string;
        
}

//****************************************************************************
// INPUT TYPE for Chapter Memberships
//****************************************************************************
@InputType()
export class CreateAssociationDemoChapterMembershipInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    ChapterID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    JoinDate?: Date;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    Role: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Chapter Memberships
//****************************************************************************
@InputType()
export class UpdateAssociationDemoChapterMembershipInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    ChapterID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    JoinDate?: Date;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    Role?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Chapter Memberships
//****************************************************************************
@ObjectType()
export class RunAssociationDemoChapterMembershipViewResult {
    @Field(() => [AssociationDemoChapterMembership_])
    Results: AssociationDemoChapterMembership_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoChapterMembership_)
export class AssociationDemoChapterMembershipResolver extends ResolverBase {
    @Query(() => RunAssociationDemoChapterMembershipViewResult)
    async RunAssociationDemoChapterMembershipViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoChapterMembershipViewResult)
    async RunAssociationDemoChapterMembershipViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoChapterMembershipViewResult)
    async RunAssociationDemoChapterMembershipDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Chapter Memberships';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoChapterMembership_, { nullable: true })
    async AssociationDemoChapterMembership(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoChapterMembership_ | null> {
        this.CheckUserReadPermissions('Chapter Memberships', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwChapterMemberships')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Chapter Memberships', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Chapter Memberships', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoChapterMembership_)
    async CreateAssociationDemoChapterMembership(
        @Arg('input', () => CreateAssociationDemoChapterMembershipInput) input: CreateAssociationDemoChapterMembershipInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Chapter Memberships', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoChapterMembership_)
    async UpdateAssociationDemoChapterMembership(
        @Arg('input', () => UpdateAssociationDemoChapterMembershipInput) input: UpdateAssociationDemoChapterMembershipInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Chapter Memberships', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoChapterMembership_)
    async DeleteAssociationDemoChapterMembership(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Chapter Memberships', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Chapter Officers
//****************************************************************************
@ObjectType()
export class AssociationDemoChapterOfficer_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    ChapterID: string;
        
    @Field() 
    @MaxLength(36)
    MemberID: string;
        
    @Field() 
    @MaxLength(100)
    Position: string;
        
    @Field() 
    StartDate: Date;
        
    @Field({nullable: true}) 
    EndDate?: Date;
        
    @Field(() => Boolean) 
    IsActive: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(255)
    Chapter: string;
        
}

//****************************************************************************
// INPUT TYPE for Chapter Officers
//****************************************************************************
@InputType()
export class CreateAssociationDemoChapterOfficerInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    ChapterID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    Position?: string;

    @Field({ nullable: true })
    StartDate?: Date;

    @Field({ nullable: true })
    EndDate: Date | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Chapter Officers
//****************************************************************************
@InputType()
export class UpdateAssociationDemoChapterOfficerInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    ChapterID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    Position?: string;

    @Field({ nullable: true })
    StartDate?: Date;

    @Field({ nullable: true })
    EndDate?: Date | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Chapter Officers
//****************************************************************************
@ObjectType()
export class RunAssociationDemoChapterOfficerViewResult {
    @Field(() => [AssociationDemoChapterOfficer_])
    Results: AssociationDemoChapterOfficer_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoChapterOfficer_)
export class AssociationDemoChapterOfficerResolver extends ResolverBase {
    @Query(() => RunAssociationDemoChapterOfficerViewResult)
    async RunAssociationDemoChapterOfficerViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoChapterOfficerViewResult)
    async RunAssociationDemoChapterOfficerViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoChapterOfficerViewResult)
    async RunAssociationDemoChapterOfficerDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Chapter Officers';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoChapterOfficer_, { nullable: true })
    async AssociationDemoChapterOfficer(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoChapterOfficer_ | null> {
        this.CheckUserReadPermissions('Chapter Officers', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwChapterOfficers')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Chapter Officers', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Chapter Officers', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoChapterOfficer_)
    async CreateAssociationDemoChapterOfficer(
        @Arg('input', () => CreateAssociationDemoChapterOfficerInput) input: CreateAssociationDemoChapterOfficerInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Chapter Officers', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoChapterOfficer_)
    async UpdateAssociationDemoChapterOfficer(
        @Arg('input', () => UpdateAssociationDemoChapterOfficerInput) input: UpdateAssociationDemoChapterOfficerInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Chapter Officers', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoChapterOfficer_)
    async DeleteAssociationDemoChapterOfficer(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Chapter Officers', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Chapters
//****************************************************************************
@ObjectType()
export class AssociationDemoChapter_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(255)
    Name: string;
        
    @Field() 
    @MaxLength(50)
    ChapterType: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    Region?: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    City?: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    State?: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    Country?: string;
        
    @Field({nullable: true}) 
    FoundedDate?: Date;
        
    @Field({nullable: true}) 
    Description?: string;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    Website?: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    Email?: string;
        
    @Field(() => Boolean) 
    IsActive: boolean;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    MeetingFrequency?: string;
        
    @Field(() => Int, {nullable: true}) 
    MemberCount?: number;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field(() => [AssociationDemoChapterMembership_])
    AssociationDemoChapterMemberships_ChapterIDArray: AssociationDemoChapterMembership_[]; // Link to AssociationDemoChapterMemberships
    
    @Field(() => [AssociationDemoChapterOfficer_])
    AssociationDemoChapterOfficers_ChapterIDArray: AssociationDemoChapterOfficer_[]; // Link to AssociationDemoChapterOfficers
    
}

//****************************************************************************
// INPUT TYPE for Chapters
//****************************************************************************
@InputType()
export class CreateAssociationDemoChapterInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    ChapterType?: string;

    @Field({ nullable: true })
    Region: string | null;

    @Field({ nullable: true })
    City: string | null;

    @Field({ nullable: true })
    State: string | null;

    @Field({ nullable: true })
    Country?: string | null;

    @Field({ nullable: true })
    FoundedDate: Date | null;

    @Field({ nullable: true })
    Description: string | null;

    @Field({ nullable: true })
    Website: string | null;

    @Field({ nullable: true })
    Email: string | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean;

    @Field({ nullable: true })
    MeetingFrequency: string | null;

    @Field(() => Int, { nullable: true })
    MemberCount: number | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Chapters
//****************************************************************************
@InputType()
export class UpdateAssociationDemoChapterInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    ChapterType?: string;

    @Field({ nullable: true })
    Region?: string | null;

    @Field({ nullable: true })
    City?: string | null;

    @Field({ nullable: true })
    State?: string | null;

    @Field({ nullable: true })
    Country?: string | null;

    @Field({ nullable: true })
    FoundedDate?: Date | null;

    @Field({ nullable: true })
    Description?: string | null;

    @Field({ nullable: true })
    Website?: string | null;

    @Field({ nullable: true })
    Email?: string | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean;

    @Field({ nullable: true })
    MeetingFrequency?: string | null;

    @Field(() => Int, { nullable: true })
    MemberCount?: number | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Chapters
//****************************************************************************
@ObjectType()
export class RunAssociationDemoChapterViewResult {
    @Field(() => [AssociationDemoChapter_])
    Results: AssociationDemoChapter_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoChapter_)
export class AssociationDemoChapterResolver extends ResolverBase {
    @Query(() => RunAssociationDemoChapterViewResult)
    async RunAssociationDemoChapterViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoChapterViewResult)
    async RunAssociationDemoChapterViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoChapterViewResult)
    async RunAssociationDemoChapterDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Chapters';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoChapter_, { nullable: true })
    async AssociationDemoChapter(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoChapter_ | null> {
        this.CheckUserReadPermissions('Chapters', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwChapters')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Chapters', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Chapters', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoChapterMembership_])
    async AssociationDemoChapterMemberships_ChapterIDArray(@Root() associationdemochapter_: AssociationDemoChapter_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Chapter Memberships', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwChapterMemberships')} WHERE ${provider.QuoteIdentifier('ChapterID')}='${associationdemochapter_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Chapter Memberships', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Chapter Memberships', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoChapterOfficer_])
    async AssociationDemoChapterOfficers_ChapterIDArray(@Root() associationdemochapter_: AssociationDemoChapter_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Chapter Officers', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwChapterOfficers')} WHERE ${provider.QuoteIdentifier('ChapterID')}='${associationdemochapter_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Chapter Officers', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Chapter Officers', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoChapter_)
    async CreateAssociationDemoChapter(
        @Arg('input', () => CreateAssociationDemoChapterInput) input: CreateAssociationDemoChapterInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Chapters', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoChapter_)
    async UpdateAssociationDemoChapter(
        @Arg('input', () => UpdateAssociationDemoChapterInput) input: UpdateAssociationDemoChapterInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Chapters', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoChapter_)
    async DeleteAssociationDemoChapter(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Chapters', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Committee Memberships
//****************************************************************************
@ObjectType()
export class AssociationDemoCommitteeMembership_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    CommitteeID: string;
        
    @Field() 
    @MaxLength(36)
    MemberID: string;
        
    @Field() 
    @MaxLength(100)
    Role: string;
        
    @Field() 
    StartDate: Date;
        
    @Field({nullable: true}) 
    EndDate?: Date;
        
    @Field(() => Boolean) 
    IsActive: boolean;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    AppointedBy?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(255)
    Committee: string;
        
}

//****************************************************************************
// INPUT TYPE for Committee Memberships
//****************************************************************************
@InputType()
export class CreateAssociationDemoCommitteeMembershipInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    CommitteeID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    Role?: string;

    @Field({ nullable: true })
    StartDate?: Date;

    @Field({ nullable: true })
    EndDate: Date | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean;

    @Field({ nullable: true })
    AppointedBy: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Committee Memberships
//****************************************************************************
@InputType()
export class UpdateAssociationDemoCommitteeMembershipInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    CommitteeID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    Role?: string;

    @Field({ nullable: true })
    StartDate?: Date;

    @Field({ nullable: true })
    EndDate?: Date | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean;

    @Field({ nullable: true })
    AppointedBy?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Committee Memberships
//****************************************************************************
@ObjectType()
export class RunAssociationDemoCommitteeMembershipViewResult {
    @Field(() => [AssociationDemoCommitteeMembership_])
    Results: AssociationDemoCommitteeMembership_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoCommitteeMembership_)
export class AssociationDemoCommitteeMembershipResolver extends ResolverBase {
    @Query(() => RunAssociationDemoCommitteeMembershipViewResult)
    async RunAssociationDemoCommitteeMembershipViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoCommitteeMembershipViewResult)
    async RunAssociationDemoCommitteeMembershipViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoCommitteeMembershipViewResult)
    async RunAssociationDemoCommitteeMembershipDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Committee Memberships';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoCommitteeMembership_, { nullable: true })
    async AssociationDemoCommitteeMembership(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoCommitteeMembership_ | null> {
        this.CheckUserReadPermissions('Committee Memberships', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCommitteeMemberships')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Committee Memberships', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Committee Memberships', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoCommitteeMembership_)
    async CreateAssociationDemoCommitteeMembership(
        @Arg('input', () => CreateAssociationDemoCommitteeMembershipInput) input: CreateAssociationDemoCommitteeMembershipInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Committee Memberships', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoCommitteeMembership_)
    async UpdateAssociationDemoCommitteeMembership(
        @Arg('input', () => UpdateAssociationDemoCommitteeMembershipInput) input: UpdateAssociationDemoCommitteeMembershipInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Committee Memberships', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoCommitteeMembership_)
    async DeleteAssociationDemoCommitteeMembership(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Committee Memberships', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Committees
//****************************************************************************
@ObjectType()
export class AssociationDemoCommittee_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(255)
    Name: string;
        
    @Field() 
    @MaxLength(50)
    CommitteeType: string;
        
    @Field({nullable: true}) 
    Purpose?: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    MeetingFrequency?: string;
        
    @Field(() => Boolean) 
    IsActive: boolean;
        
    @Field({nullable: true}) 
    FormedDate?: Date;
        
    @Field({nullable: true}) 
    DisbandedDate?: Date;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    ChairMemberID?: string;
        
    @Field(() => Int, {nullable: true}) 
    MaxMembers?: number;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field(() => [AssociationDemoCommitteeMembership_])
    AssociationDemoCommitteeMemberships_CommitteeIDArray: AssociationDemoCommitteeMembership_[]; // Link to AssociationDemoCommitteeMemberships
    
}

//****************************************************************************
// INPUT TYPE for Committees
//****************************************************************************
@InputType()
export class CreateAssociationDemoCommitteeInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    CommitteeType?: string;

    @Field({ nullable: true })
    Purpose: string | null;

    @Field({ nullable: true })
    MeetingFrequency: string | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean;

    @Field({ nullable: true })
    FormedDate: Date | null;

    @Field({ nullable: true })
    DisbandedDate: Date | null;

    @Field({ nullable: true })
    ChairMemberID: string | null;

    @Field(() => Int, { nullable: true })
    MaxMembers: number | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Committees
//****************************************************************************
@InputType()
export class UpdateAssociationDemoCommitteeInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    CommitteeType?: string;

    @Field({ nullable: true })
    Purpose?: string | null;

    @Field({ nullable: true })
    MeetingFrequency?: string | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean;

    @Field({ nullable: true })
    FormedDate?: Date | null;

    @Field({ nullable: true })
    DisbandedDate?: Date | null;

    @Field({ nullable: true })
    ChairMemberID?: string | null;

    @Field(() => Int, { nullable: true })
    MaxMembers?: number | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Committees
//****************************************************************************
@ObjectType()
export class RunAssociationDemoCommitteeViewResult {
    @Field(() => [AssociationDemoCommittee_])
    Results: AssociationDemoCommittee_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoCommittee_)
export class AssociationDemoCommitteeResolver extends ResolverBase {
    @Query(() => RunAssociationDemoCommitteeViewResult)
    async RunAssociationDemoCommitteeViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoCommitteeViewResult)
    async RunAssociationDemoCommitteeViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoCommitteeViewResult)
    async RunAssociationDemoCommitteeDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Committees';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoCommittee_, { nullable: true })
    async AssociationDemoCommittee(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoCommittee_ | null> {
        this.CheckUserReadPermissions('Committees', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCommittees')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Committees', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Committees', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoCommitteeMembership_])
    async AssociationDemoCommitteeMemberships_CommitteeIDArray(@Root() associationdemocommittee_: AssociationDemoCommittee_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Committee Memberships', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCommitteeMemberships')} WHERE ${provider.QuoteIdentifier('CommitteeID')}='${associationdemocommittee_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Committee Memberships', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Committee Memberships', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoCommittee_)
    async CreateAssociationDemoCommittee(
        @Arg('input', () => CreateAssociationDemoCommitteeInput) input: CreateAssociationDemoCommitteeInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Committees', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoCommittee_)
    async UpdateAssociationDemoCommittee(
        @Arg('input', () => UpdateAssociationDemoCommitteeInput) input: UpdateAssociationDemoCommitteeInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Committees', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoCommittee_)
    async DeleteAssociationDemoCommittee(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Committees', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Competition Entries
//****************************************************************************
@ObjectType()
export class AssociationDemoCompetitionEntry_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    CompetitionID: string;
        
    @Field() 
    @MaxLength(36)
    ProductID: string;
        
    @Field() 
    @MaxLength(36)
    CategoryID: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    EntryNumber?: string;
        
    @Field() 
    SubmittedDate: Date;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    Status?: string;
        
    @Field(() => Float, {nullable: true}) 
    Score?: number;
        
    @Field(() => Int, {nullable: true}) 
    Ranking?: number;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    AwardLevel?: string;
        
    @Field({nullable: true}) 
    JudgingNotes?: string;
        
    @Field(() => Boolean, {nullable: true}) 
    FeedbackProvided?: boolean;
        
    @Field(() => Float, {nullable: true}) 
    EntryFee?: number;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    PaymentStatus?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(255)
    Competition: string;
        
    @Field() 
    @MaxLength(255)
    Product: string;
        
    @Field() 
    @MaxLength(255)
    Category: string;
        
    @Field(() => [AssociationDemoProductAward_])
    AssociationDemoProductAwards_CompetitionEntryIDArray: AssociationDemoProductAward_[]; // Link to AssociationDemoProductAwards
    
}

//****************************************************************************
// INPUT TYPE for Competition Entries
//****************************************************************************
@InputType()
export class CreateAssociationDemoCompetitionEntryInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    CompetitionID?: string;

    @Field({ nullable: true })
    ProductID?: string;

    @Field({ nullable: true })
    CategoryID?: string;

    @Field({ nullable: true })
    EntryNumber: string | null;

    @Field({ nullable: true })
    SubmittedDate?: Date;

    @Field({ nullable: true })
    Status?: string | null;

    @Field(() => Float, { nullable: true })
    Score: number | null;

    @Field(() => Int, { nullable: true })
    Ranking: number | null;

    @Field({ nullable: true })
    AwardLevel: string | null;

    @Field({ nullable: true })
    JudgingNotes: string | null;

    @Field(() => Boolean, { nullable: true })
    FeedbackProvided?: boolean | null;

    @Field(() => Float, { nullable: true })
    EntryFee: number | null;

    @Field({ nullable: true })
    PaymentStatus?: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Competition Entries
//****************************************************************************
@InputType()
export class UpdateAssociationDemoCompetitionEntryInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    CompetitionID?: string;

    @Field({ nullable: true })
    ProductID?: string;

    @Field({ nullable: true })
    CategoryID?: string;

    @Field({ nullable: true })
    EntryNumber?: string | null;

    @Field({ nullable: true })
    SubmittedDate?: Date;

    @Field({ nullable: true })
    Status?: string | null;

    @Field(() => Float, { nullable: true })
    Score?: number | null;

    @Field(() => Int, { nullable: true })
    Ranking?: number | null;

    @Field({ nullable: true })
    AwardLevel?: string | null;

    @Field({ nullable: true })
    JudgingNotes?: string | null;

    @Field(() => Boolean, { nullable: true })
    FeedbackProvided?: boolean | null;

    @Field(() => Float, { nullable: true })
    EntryFee?: number | null;

    @Field({ nullable: true })
    PaymentStatus?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Competition Entries
//****************************************************************************
@ObjectType()
export class RunAssociationDemoCompetitionEntryViewResult {
    @Field(() => [AssociationDemoCompetitionEntry_])
    Results: AssociationDemoCompetitionEntry_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoCompetitionEntry_)
export class AssociationDemoCompetitionEntryResolver extends ResolverBase {
    @Query(() => RunAssociationDemoCompetitionEntryViewResult)
    async RunAssociationDemoCompetitionEntryViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoCompetitionEntryViewResult)
    async RunAssociationDemoCompetitionEntryViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoCompetitionEntryViewResult)
    async RunAssociationDemoCompetitionEntryDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Competition Entries';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoCompetitionEntry_, { nullable: true })
    async AssociationDemoCompetitionEntry(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoCompetitionEntry_ | null> {
        this.CheckUserReadPermissions('Competition Entries', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCompetitionEntries')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Competition Entries', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Competition Entries', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoProductAward_])
    async AssociationDemoProductAwards_CompetitionEntryIDArray(@Root() associationdemocompetitionentry_: AssociationDemoCompetitionEntry_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Product Awards', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwProductAwards')} WHERE ${provider.QuoteIdentifier('CompetitionEntryID')}='${associationdemocompetitionentry_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Product Awards', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Product Awards', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoCompetitionEntry_)
    async CreateAssociationDemoCompetitionEntry(
        @Arg('input', () => CreateAssociationDemoCompetitionEntryInput) input: CreateAssociationDemoCompetitionEntryInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Competition Entries', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoCompetitionEntry_)
    async UpdateAssociationDemoCompetitionEntry(
        @Arg('input', () => UpdateAssociationDemoCompetitionEntryInput) input: UpdateAssociationDemoCompetitionEntryInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Competition Entries', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoCompetitionEntry_)
    async DeleteAssociationDemoCompetitionEntry(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Competition Entries', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Competition Judges
//****************************************************************************
@ObjectType()
export class AssociationDemoCompetitionJudge_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    CompetitionID: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    MemberID?: string;
        
    @Field() 
    @MaxLength(100)
    FirstName: string;
        
    @Field() 
    @MaxLength(100)
    LastName: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    Email?: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    Organization?: string;
        
    @Field({nullable: true}) 
    Credentials?: string;
        
    @Field(() => Int, {nullable: true}) 
    YearsExperience?: number;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    Specialty?: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    Role?: string;
        
    @Field({nullable: true}) 
    AssignedCategories?: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    Status?: string;
        
    @Field({nullable: true}) 
    InvitedDate?: Date;
        
    @Field({nullable: true}) 
    ConfirmedDate?: Date;
        
    @Field(() => Float, {nullable: true}) 
    CompensationAmount?: number;
        
    @Field({nullable: true}) 
    Notes?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(255)
    Competition: string;
        
}

//****************************************************************************
// INPUT TYPE for Competition Judges
//****************************************************************************
@InputType()
export class CreateAssociationDemoCompetitionJudgeInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    CompetitionID?: string;

    @Field({ nullable: true })
    MemberID: string | null;

    @Field({ nullable: true })
    FirstName?: string;

    @Field({ nullable: true })
    LastName?: string;

    @Field({ nullable: true })
    Email: string | null;

    @Field({ nullable: true })
    Organization: string | null;

    @Field({ nullable: true })
    Credentials: string | null;

    @Field(() => Int, { nullable: true })
    YearsExperience: number | null;

    @Field({ nullable: true })
    Specialty: string | null;

    @Field({ nullable: true })
    Role: string | null;

    @Field({ nullable: true })
    AssignedCategories: string | null;

    @Field({ nullable: true })
    Status?: string | null;

    @Field({ nullable: true })
    InvitedDate: Date | null;

    @Field({ nullable: true })
    ConfirmedDate: Date | null;

    @Field(() => Float, { nullable: true })
    CompensationAmount: number | null;

    @Field({ nullable: true })
    Notes: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Competition Judges
//****************************************************************************
@InputType()
export class UpdateAssociationDemoCompetitionJudgeInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    CompetitionID?: string;

    @Field({ nullable: true })
    MemberID?: string | null;

    @Field({ nullable: true })
    FirstName?: string;

    @Field({ nullable: true })
    LastName?: string;

    @Field({ nullable: true })
    Email?: string | null;

    @Field({ nullable: true })
    Organization?: string | null;

    @Field({ nullable: true })
    Credentials?: string | null;

    @Field(() => Int, { nullable: true })
    YearsExperience?: number | null;

    @Field({ nullable: true })
    Specialty?: string | null;

    @Field({ nullable: true })
    Role?: string | null;

    @Field({ nullable: true })
    AssignedCategories?: string | null;

    @Field({ nullable: true })
    Status?: string | null;

    @Field({ nullable: true })
    InvitedDate?: Date | null;

    @Field({ nullable: true })
    ConfirmedDate?: Date | null;

    @Field(() => Float, { nullable: true })
    CompensationAmount?: number | null;

    @Field({ nullable: true })
    Notes?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Competition Judges
//****************************************************************************
@ObjectType()
export class RunAssociationDemoCompetitionJudgeViewResult {
    @Field(() => [AssociationDemoCompetitionJudge_])
    Results: AssociationDemoCompetitionJudge_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoCompetitionJudge_)
export class AssociationDemoCompetitionJudgeResolver extends ResolverBase {
    @Query(() => RunAssociationDemoCompetitionJudgeViewResult)
    async RunAssociationDemoCompetitionJudgeViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoCompetitionJudgeViewResult)
    async RunAssociationDemoCompetitionJudgeViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoCompetitionJudgeViewResult)
    async RunAssociationDemoCompetitionJudgeDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Competition Judges';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoCompetitionJudge_, { nullable: true })
    async AssociationDemoCompetitionJudge(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoCompetitionJudge_ | null> {
        this.CheckUserReadPermissions('Competition Judges', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCompetitionJudges')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Competition Judges', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Competition Judges', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoCompetitionJudge_)
    async CreateAssociationDemoCompetitionJudge(
        @Arg('input', () => CreateAssociationDemoCompetitionJudgeInput) input: CreateAssociationDemoCompetitionJudgeInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Competition Judges', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoCompetitionJudge_)
    async UpdateAssociationDemoCompetitionJudge(
        @Arg('input', () => UpdateAssociationDemoCompetitionJudgeInput) input: UpdateAssociationDemoCompetitionJudgeInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Competition Judges', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoCompetitionJudge_)
    async DeleteAssociationDemoCompetitionJudge(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Competition Judges', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Competitions
//****************************************************************************
@ObjectType()
export class AssociationDemoCompetition_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(255)
    Name: string;
        
    @Field(() => Int) 
    Year: number;
        
    @Field({nullable: true}) 
    Description?: string;
        
    @Field() 
    StartDate: Date;
        
    @Field() 
    EndDate: Date;
        
    @Field({nullable: true}) 
    JudgingDate?: Date;
        
    @Field({nullable: true}) 
    AwardsDate?: Date;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    Location?: string;
        
    @Field({nullable: true}) 
    EntryDeadline?: Date;
        
    @Field(() => Float, {nullable: true}) 
    EntryFee?: number;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    Status?: string;
        
    @Field(() => Int, {nullable: true}) 
    TotalEntries?: number;
        
    @Field(() => Int, {nullable: true}) 
    TotalCategories?: number;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    Website?: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    ContactEmail?: string;
        
    @Field(() => Boolean, {nullable: true}) 
    IsAnnual?: boolean;
        
    @Field(() => Boolean, {nullable: true}) 
    IsInternational?: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field(() => [AssociationDemoCompetitionJudge_])
    AssociationDemoCompetitionJudges_CompetitionIDArray: AssociationDemoCompetitionJudge_[]; // Link to AssociationDemoCompetitionJudges
    
    @Field(() => [AssociationDemoCompetitionEntry_])
    AssociationDemoCompetitionEntries_CompetitionIDArray: AssociationDemoCompetitionEntry_[]; // Link to AssociationDemoCompetitionEntries
    
    @Field(() => [AssociationDemoProductAward_])
    AssociationDemoProductAwards_CompetitionIDArray: AssociationDemoProductAward_[]; // Link to AssociationDemoProductAwards
    
}

//****************************************************************************
// INPUT TYPE for Competitions
//****************************************************************************
@InputType()
export class CreateAssociationDemoCompetitionInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field(() => Int, { nullable: true })
    Year?: number;

    @Field({ nullable: true })
    Description: string | null;

    @Field({ nullable: true })
    StartDate?: Date;

    @Field({ nullable: true })
    EndDate?: Date;

    @Field({ nullable: true })
    JudgingDate: Date | null;

    @Field({ nullable: true })
    AwardsDate: Date | null;

    @Field({ nullable: true })
    Location: string | null;

    @Field({ nullable: true })
    EntryDeadline: Date | null;

    @Field(() => Float, { nullable: true })
    EntryFee: number | null;

    @Field({ nullable: true })
    Status?: string | null;

    @Field(() => Int, { nullable: true })
    TotalEntries?: number | null;

    @Field(() => Int, { nullable: true })
    TotalCategories?: number | null;

    @Field({ nullable: true })
    Website: string | null;

    @Field({ nullable: true })
    ContactEmail: string | null;

    @Field(() => Boolean, { nullable: true })
    IsAnnual?: boolean | null;

    @Field(() => Boolean, { nullable: true })
    IsInternational?: boolean | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Competitions
//****************************************************************************
@InputType()
export class UpdateAssociationDemoCompetitionInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    Name?: string;

    @Field(() => Int, { nullable: true })
    Year?: number;

    @Field({ nullable: true })
    Description?: string | null;

    @Field({ nullable: true })
    StartDate?: Date;

    @Field({ nullable: true })
    EndDate?: Date;

    @Field({ nullable: true })
    JudgingDate?: Date | null;

    @Field({ nullable: true })
    AwardsDate?: Date | null;

    @Field({ nullable: true })
    Location?: string | null;

    @Field({ nullable: true })
    EntryDeadline?: Date | null;

    @Field(() => Float, { nullable: true })
    EntryFee?: number | null;

    @Field({ nullable: true })
    Status?: string | null;

    @Field(() => Int, { nullable: true })
    TotalEntries?: number | null;

    @Field(() => Int, { nullable: true })
    TotalCategories?: number | null;

    @Field({ nullable: true })
    Website?: string | null;

    @Field({ nullable: true })
    ContactEmail?: string | null;

    @Field(() => Boolean, { nullable: true })
    IsAnnual?: boolean | null;

    @Field(() => Boolean, { nullable: true })
    IsInternational?: boolean | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Competitions
//****************************************************************************
@ObjectType()
export class RunAssociationDemoCompetitionViewResult {
    @Field(() => [AssociationDemoCompetition_])
    Results: AssociationDemoCompetition_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoCompetition_)
export class AssociationDemoCompetitionResolver extends ResolverBase {
    @Query(() => RunAssociationDemoCompetitionViewResult)
    async RunAssociationDemoCompetitionViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoCompetitionViewResult)
    async RunAssociationDemoCompetitionViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoCompetitionViewResult)
    async RunAssociationDemoCompetitionDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Competitions';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoCompetition_, { nullable: true })
    async AssociationDemoCompetition(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoCompetition_ | null> {
        this.CheckUserReadPermissions('Competitions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCompetitions')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Competitions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Competitions', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoCompetitionJudge_])
    async AssociationDemoCompetitionJudges_CompetitionIDArray(@Root() associationdemocompetition_: AssociationDemoCompetition_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Competition Judges', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCompetitionJudges')} WHERE ${provider.QuoteIdentifier('CompetitionID')}='${associationdemocompetition_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Competition Judges', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Competition Judges', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoCompetitionEntry_])
    async AssociationDemoCompetitionEntries_CompetitionIDArray(@Root() associationdemocompetition_: AssociationDemoCompetition_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Competition Entries', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCompetitionEntries')} WHERE ${provider.QuoteIdentifier('CompetitionID')}='${associationdemocompetition_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Competition Entries', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Competition Entries', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoProductAward_])
    async AssociationDemoProductAwards_CompetitionIDArray(@Root() associationdemocompetition_: AssociationDemoCompetition_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Product Awards', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwProductAwards')} WHERE ${provider.QuoteIdentifier('CompetitionID')}='${associationdemocompetition_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Product Awards', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Product Awards', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoCompetition_)
    async CreateAssociationDemoCompetition(
        @Arg('input', () => CreateAssociationDemoCompetitionInput) input: CreateAssociationDemoCompetitionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Competitions', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoCompetition_)
    async UpdateAssociationDemoCompetition(
        @Arg('input', () => UpdateAssociationDemoCompetitionInput) input: UpdateAssociationDemoCompetitionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Competitions', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoCompetition_)
    async DeleteAssociationDemoCompetition(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Competitions', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Continuing Educations
//****************************************************************************
@ObjectType()
export class AssociationDemoContinuingEducation_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    MemberID: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    CertificationID?: string;
        
    @Field() 
    @MaxLength(500)
    ActivityTitle: string;
        
    @Field() 
    @MaxLength(100)
    ActivityType: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    Provider?: string;
        
    @Field() 
    CompletionDate: Date;
        
    @Field(() => Float) 
    CreditsEarned: number;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    CreditsType?: string;
        
    @Field(() => Float, {nullable: true}) 
    HoursSpent?: number;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    VerificationCode?: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    Status?: string;
        
    @Field({nullable: true}) 
    Notes?: string;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    DocumentURL?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
}

//****************************************************************************
// INPUT TYPE for Continuing Educations
//****************************************************************************
@InputType()
export class CreateAssociationDemoContinuingEducationInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    CertificationID: string | null;

    @Field({ nullable: true })
    ActivityTitle?: string;

    @Field({ nullable: true })
    ActivityType?: string;

    @Field({ nullable: true })
    Provider: string | null;

    @Field({ nullable: true })
    CompletionDate?: Date;

    @Field(() => Float, { nullable: true })
    CreditsEarned?: number;

    @Field({ nullable: true })
    CreditsType?: string | null;

    @Field(() => Float, { nullable: true })
    HoursSpent: number | null;

    @Field({ nullable: true })
    VerificationCode: string | null;

    @Field({ nullable: true })
    Status?: string | null;

    @Field({ nullable: true })
    Notes: string | null;

    @Field({ nullable: true })
    DocumentURL: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Continuing Educations
//****************************************************************************
@InputType()
export class UpdateAssociationDemoContinuingEducationInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    CertificationID?: string | null;

    @Field({ nullable: true })
    ActivityTitle?: string;

    @Field({ nullable: true })
    ActivityType?: string;

    @Field({ nullable: true })
    Provider?: string | null;

    @Field({ nullable: true })
    CompletionDate?: Date;

    @Field(() => Float, { nullable: true })
    CreditsEarned?: number;

    @Field({ nullable: true })
    CreditsType?: string | null;

    @Field(() => Float, { nullable: true })
    HoursSpent?: number | null;

    @Field({ nullable: true })
    VerificationCode?: string | null;

    @Field({ nullable: true })
    Status?: string | null;

    @Field({ nullable: true })
    Notes?: string | null;

    @Field({ nullable: true })
    DocumentURL?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Continuing Educations
//****************************************************************************
@ObjectType()
export class RunAssociationDemoContinuingEducationViewResult {
    @Field(() => [AssociationDemoContinuingEducation_])
    Results: AssociationDemoContinuingEducation_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoContinuingEducation_)
export class AssociationDemoContinuingEducationResolver extends ResolverBase {
    @Query(() => RunAssociationDemoContinuingEducationViewResult)
    async RunAssociationDemoContinuingEducationViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoContinuingEducationViewResult)
    async RunAssociationDemoContinuingEducationViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoContinuingEducationViewResult)
    async RunAssociationDemoContinuingEducationDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Continuing Educations';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoContinuingEducation_, { nullable: true })
    async AssociationDemoContinuingEducation(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoContinuingEducation_ | null> {
        this.CheckUserReadPermissions('Continuing Educations', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwContinuingEducations')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Continuing Educations', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Continuing Educations', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoContinuingEducation_)
    async CreateAssociationDemoContinuingEducation(
        @Arg('input', () => CreateAssociationDemoContinuingEducationInput) input: CreateAssociationDemoContinuingEducationInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Continuing Educations', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoContinuingEducation_)
    async UpdateAssociationDemoContinuingEducation(
        @Arg('input', () => UpdateAssociationDemoContinuingEducationInput) input: UpdateAssociationDemoContinuingEducationInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Continuing Educations', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoContinuingEducation_)
    async DeleteAssociationDemoContinuingEducation(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Continuing Educations', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Courses
//****************************************************************************
@ObjectType()
export class AssociationDemoCourse_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(50)
    Code: string;
        
    @Field() 
    @MaxLength(255)
    Title: string;
        
    @Field({nullable: true}) 
    Description?: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    Category?: string;
        
    @Field() 
    @MaxLength(20)
    Level: string;
        
    @Field(() => Float, {nullable: true}) 
    DurationHours?: number;
        
    @Field(() => Float, {nullable: true}) 
    CEUCredits?: number;
        
    @Field(() => Float, {nullable: true}) 
    Price?: number;
        
    @Field(() => Float, {nullable: true}) 
    MemberPrice?: number;
        
    @Field(() => Boolean) 
    IsActive: boolean;
        
    @Field({nullable: true}) 
    PublishedDate?: Date;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    InstructorName?: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    PrerequisiteCourseID?: string;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    ThumbnailURL?: string;
        
    @Field({nullable: true}) 
    LearningObjectives?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    RootPrerequisiteCourseID?: string;
        
    @Field(() => [AssociationDemoEnrollment_])
    AssociationDemoEnrollments_CourseIDArray: AssociationDemoEnrollment_[]; // Link to AssociationDemoEnrollments
    
    @Field(() => [AssociationDemoCourse_])
    AssociationDemoCourses_PrerequisiteCourseIDArray: AssociationDemoCourse_[]; // Link to AssociationDemoCourses
    
}

//****************************************************************************
// INPUT TYPE for Courses
//****************************************************************************
@InputType()
export class CreateAssociationDemoCourseInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    Code?: string;

    @Field({ nullable: true })
    Title?: string;

    @Field({ nullable: true })
    Description: string | null;

    @Field({ nullable: true })
    Category: string | null;

    @Field({ nullable: true })
    Level?: string;

    @Field(() => Float, { nullable: true })
    DurationHours: number | null;

    @Field(() => Float, { nullable: true })
    CEUCredits: number | null;

    @Field(() => Float, { nullable: true })
    Price: number | null;

    @Field(() => Float, { nullable: true })
    MemberPrice: number | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean;

    @Field({ nullable: true })
    PublishedDate: Date | null;

    @Field({ nullable: true })
    InstructorName: string | null;

    @Field({ nullable: true })
    PrerequisiteCourseID: string | null;

    @Field({ nullable: true })
    ThumbnailURL: string | null;

    @Field({ nullable: true })
    LearningObjectives: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Courses
//****************************************************************************
@InputType()
export class UpdateAssociationDemoCourseInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    Code?: string;

    @Field({ nullable: true })
    Title?: string;

    @Field({ nullable: true })
    Description?: string | null;

    @Field({ nullable: true })
    Category?: string | null;

    @Field({ nullable: true })
    Level?: string;

    @Field(() => Float, { nullable: true })
    DurationHours?: number | null;

    @Field(() => Float, { nullable: true })
    CEUCredits?: number | null;

    @Field(() => Float, { nullable: true })
    Price?: number | null;

    @Field(() => Float, { nullable: true })
    MemberPrice?: number | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean;

    @Field({ nullable: true })
    PublishedDate?: Date | null;

    @Field({ nullable: true })
    InstructorName?: string | null;

    @Field({ nullable: true })
    PrerequisiteCourseID?: string | null;

    @Field({ nullable: true })
    ThumbnailURL?: string | null;

    @Field({ nullable: true })
    LearningObjectives?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Courses
//****************************************************************************
@ObjectType()
export class RunAssociationDemoCourseViewResult {
    @Field(() => [AssociationDemoCourse_])
    Results: AssociationDemoCourse_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoCourse_)
export class AssociationDemoCourseResolver extends ResolverBase {
    @Query(() => RunAssociationDemoCourseViewResult)
    async RunAssociationDemoCourseViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoCourseViewResult)
    async RunAssociationDemoCourseViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoCourseViewResult)
    async RunAssociationDemoCourseDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Courses';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoCourse_, { nullable: true })
    async AssociationDemoCourse(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoCourse_ | null> {
        this.CheckUserReadPermissions('Courses', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCourses')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Courses', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Courses', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoEnrollment_])
    async AssociationDemoEnrollments_CourseIDArray(@Root() associationdemocourse_: AssociationDemoCourse_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Enrollments', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwEnrollments')} WHERE ${provider.QuoteIdentifier('CourseID')}='${associationdemocourse_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Enrollments', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Enrollments', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoCourse_])
    async AssociationDemoCourses_PrerequisiteCourseIDArray(@Root() associationdemocourse_: AssociationDemoCourse_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Courses', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCourses')} WHERE ${provider.QuoteIdentifier('PrerequisiteCourseID')}='${associationdemocourse_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Courses', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Courses', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoCourse_)
    async CreateAssociationDemoCourse(
        @Arg('input', () => CreateAssociationDemoCourseInput) input: CreateAssociationDemoCourseInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Courses', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoCourse_)
    async UpdateAssociationDemoCourse(
        @Arg('input', () => UpdateAssociationDemoCourseInput) input: UpdateAssociationDemoCourseInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Courses', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoCourse_)
    async DeleteAssociationDemoCourse(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Courses', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Email Clicks
//****************************************************************************
@ObjectType()
export class AssociationDemoEmailClick_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    EmailSendID: string;
        
    @Field() 
    ClickDate: Date;
        
    @Field() 
    @MaxLength(2000)
    URL: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    LinkName?: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    IPAddress?: string;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    UserAgent?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
}

//****************************************************************************
// INPUT TYPE for Email Clicks
//****************************************************************************
@InputType()
export class CreateAssociationDemoEmailClickInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    EmailSendID?: string;

    @Field({ nullable: true })
    ClickDate?: Date;

    @Field({ nullable: true })
    URL?: string;

    @Field({ nullable: true })
    LinkName: string | null;

    @Field({ nullable: true })
    IPAddress: string | null;

    @Field({ nullable: true })
    UserAgent: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Email Clicks
//****************************************************************************
@InputType()
export class UpdateAssociationDemoEmailClickInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    EmailSendID?: string;

    @Field({ nullable: true })
    ClickDate?: Date;

    @Field({ nullable: true })
    URL?: string;

    @Field({ nullable: true })
    LinkName?: string | null;

    @Field({ nullable: true })
    IPAddress?: string | null;

    @Field({ nullable: true })
    UserAgent?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Email Clicks
//****************************************************************************
@ObjectType()
export class RunAssociationDemoEmailClickViewResult {
    @Field(() => [AssociationDemoEmailClick_])
    Results: AssociationDemoEmailClick_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoEmailClick_)
export class AssociationDemoEmailClickResolver extends ResolverBase {
    @Query(() => RunAssociationDemoEmailClickViewResult)
    async RunAssociationDemoEmailClickViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoEmailClickViewResult)
    async RunAssociationDemoEmailClickViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoEmailClickViewResult)
    async RunAssociationDemoEmailClickDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Email Clicks';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoEmailClick_, { nullable: true })
    async AssociationDemoEmailClick(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoEmailClick_ | null> {
        this.CheckUserReadPermissions('Email Clicks', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwEmailClicks')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Email Clicks', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Email Clicks', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoEmailClick_)
    async CreateAssociationDemoEmailClick(
        @Arg('input', () => CreateAssociationDemoEmailClickInput) input: CreateAssociationDemoEmailClickInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Email Clicks', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoEmailClick_)
    async UpdateAssociationDemoEmailClick(
        @Arg('input', () => UpdateAssociationDemoEmailClickInput) input: UpdateAssociationDemoEmailClickInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Email Clicks', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoEmailClick_)
    async DeleteAssociationDemoEmailClick(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Email Clicks', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Email Engagements
//****************************************************************************
@ObjectType()
export class membershipEmailEngagement_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    MemberID: string;
        
    @Field() 
    @MaxLength(50)
    ActivityType: string;
        
    @Field() 
    OccurredOn: Date;
        
    @Field() 
    @MaxLength(200)
    CampaignName: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
}

//****************************************************************************
// INPUT TYPE for Email Engagements
//****************************************************************************
@InputType()
export class CreatemembershipEmailEngagementInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    ActivityType?: string;

    @Field({ nullable: true })
    OccurredOn?: Date;

    @Field({ nullable: true })
    CampaignName?: string;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Email Engagements
//****************************************************************************
@InputType()
export class UpdatemembershipEmailEngagementInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    ActivityType?: string;

    @Field({ nullable: true })
    OccurredOn?: Date;

    @Field({ nullable: true })
    CampaignName?: string;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Email Engagements
//****************************************************************************
@ObjectType()
export class RunmembershipEmailEngagementViewResult {
    @Field(() => [membershipEmailEngagement_])
    Results: membershipEmailEngagement_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(membershipEmailEngagement_)
export class membershipEmailEngagementResolver extends ResolverBase {
    @Query(() => RunmembershipEmailEngagementViewResult)
    async RunmembershipEmailEngagementViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmembershipEmailEngagementViewResult)
    async RunmembershipEmailEngagementViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmembershipEmailEngagementViewResult)
    async RunmembershipEmailEngagementDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Email Engagements';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => membershipEmailEngagement_, { nullable: true })
    async membershipEmailEngagement(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<membershipEmailEngagement_ | null> {
        this.CheckUserReadPermissions('Email Engagements', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('membership', 'vwEmailEngagements')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Email Engagements', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Email Engagements', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => membershipEmailEngagement_)
    async CreatemembershipEmailEngagement(
        @Arg('input', () => CreatemembershipEmailEngagementInput) input: CreatemembershipEmailEngagementInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Email Engagements', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => membershipEmailEngagement_)
    async UpdatemembershipEmailEngagement(
        @Arg('input', () => UpdatemembershipEmailEngagementInput) input: UpdatemembershipEmailEngagementInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Email Engagements', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => membershipEmailEngagement_)
    async DeletemembershipEmailEngagement(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Email Engagements', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Email Sends
//****************************************************************************
@ObjectType()
export class AssociationDemoEmailSend_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    TemplateID?: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    CampaignID?: string;
        
    @Field() 
    @MaxLength(36)
    MemberID: string;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    Subject?: string;
        
    @Field() 
    SentDate: Date;
        
    @Field({nullable: true}) 
    DeliveredDate?: Date;
        
    @Field({nullable: true}) 
    OpenedDate?: Date;
        
    @Field(() => Int, {nullable: true}) 
    OpenCount?: number;
        
    @Field({nullable: true}) 
    ClickedDate?: Date;
        
    @Field(() => Int, {nullable: true}) 
    ClickCount?: number;
        
    @Field({nullable: true}) 
    BouncedDate?: Date;
        
    @Field({nullable: true}) 
    @MaxLength(20)
    BounceType?: string;
        
    @Field({nullable: true}) 
    BounceReason?: string;
        
    @Field({nullable: true}) 
    UnsubscribedDate?: Date;
        
    @Field({nullable: true}) 
    SpamReportedDate?: Date;
        
    @Field() 
    @MaxLength(20)
    Status: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    ExternalMessageID?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    Template?: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    Campaign?: string;
        
    @Field(() => [AssociationDemoEmailClick_])
    AssociationDemoEmailClicks_EmailSendIDArray: AssociationDemoEmailClick_[]; // Link to AssociationDemoEmailClicks
    
}

//****************************************************************************
// INPUT TYPE for Email Sends
//****************************************************************************
@InputType()
export class CreateAssociationDemoEmailSendInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    TemplateID: string | null;

    @Field({ nullable: true })
    CampaignID: string | null;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    Subject: string | null;

    @Field({ nullable: true })
    SentDate?: Date;

    @Field({ nullable: true })
    DeliveredDate: Date | null;

    @Field({ nullable: true })
    OpenedDate: Date | null;

    @Field(() => Int, { nullable: true })
    OpenCount?: number | null;

    @Field({ nullable: true })
    ClickedDate: Date | null;

    @Field(() => Int, { nullable: true })
    ClickCount?: number | null;

    @Field({ nullable: true })
    BouncedDate: Date | null;

    @Field({ nullable: true })
    BounceType: string | null;

    @Field({ nullable: true })
    BounceReason: string | null;

    @Field({ nullable: true })
    UnsubscribedDate: Date | null;

    @Field({ nullable: true })
    SpamReportedDate: Date | null;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    ExternalMessageID: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Email Sends
//****************************************************************************
@InputType()
export class UpdateAssociationDemoEmailSendInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    TemplateID?: string | null;

    @Field({ nullable: true })
    CampaignID?: string | null;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    Subject?: string | null;

    @Field({ nullable: true })
    SentDate?: Date;

    @Field({ nullable: true })
    DeliveredDate?: Date | null;

    @Field({ nullable: true })
    OpenedDate?: Date | null;

    @Field(() => Int, { nullable: true })
    OpenCount?: number | null;

    @Field({ nullable: true })
    ClickedDate?: Date | null;

    @Field(() => Int, { nullable: true })
    ClickCount?: number | null;

    @Field({ nullable: true })
    BouncedDate?: Date | null;

    @Field({ nullable: true })
    BounceType?: string | null;

    @Field({ nullable: true })
    BounceReason?: string | null;

    @Field({ nullable: true })
    UnsubscribedDate?: Date | null;

    @Field({ nullable: true })
    SpamReportedDate?: Date | null;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    ExternalMessageID?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Email Sends
//****************************************************************************
@ObjectType()
export class RunAssociationDemoEmailSendViewResult {
    @Field(() => [AssociationDemoEmailSend_])
    Results: AssociationDemoEmailSend_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoEmailSend_)
export class AssociationDemoEmailSendResolver extends ResolverBase {
    @Query(() => RunAssociationDemoEmailSendViewResult)
    async RunAssociationDemoEmailSendViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoEmailSendViewResult)
    async RunAssociationDemoEmailSendViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoEmailSendViewResult)
    async RunAssociationDemoEmailSendDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Email Sends';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoEmailSend_, { nullable: true })
    async AssociationDemoEmailSend(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoEmailSend_ | null> {
        this.CheckUserReadPermissions('Email Sends', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwEmailSends')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Email Sends', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Email Sends', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoEmailClick_])
    async AssociationDemoEmailClicks_EmailSendIDArray(@Root() associationdemoemailsend_: AssociationDemoEmailSend_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Email Clicks', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwEmailClicks')} WHERE ${provider.QuoteIdentifier('EmailSendID')}='${associationdemoemailsend_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Email Clicks', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Email Clicks', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoEmailSend_)
    async CreateAssociationDemoEmailSend(
        @Arg('input', () => CreateAssociationDemoEmailSendInput) input: CreateAssociationDemoEmailSendInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Email Sends', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoEmailSend_)
    async UpdateAssociationDemoEmailSend(
        @Arg('input', () => UpdateAssociationDemoEmailSendInput) input: UpdateAssociationDemoEmailSendInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Email Sends', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoEmailSend_)
    async DeleteAssociationDemoEmailSend(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Email Sends', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Email Templates
//****************************************************************************
@ObjectType()
export class AssociationDemoEmailTemplate_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(255)
    Name: string;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    Subject?: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    FromName?: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    FromEmail?: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    ReplyToEmail?: string;
        
    @Field({nullable: true}) 
    HtmlBody?: string;
        
    @Field({nullable: true}) 
    TextBody?: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    Category?: string;
        
    @Field(() => Boolean) 
    IsActive: boolean;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    PreviewText?: string;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    Tags?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field(() => [AssociationDemoEmailSend_])
    AssociationDemoEmailSends_TemplateIDArray: AssociationDemoEmailSend_[]; // Link to AssociationDemoEmailSends
    
}

//****************************************************************************
// INPUT TYPE for Email Templates
//****************************************************************************
@InputType()
export class CreateAssociationDemoEmailTemplateInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Subject: string | null;

    @Field({ nullable: true })
    FromName: string | null;

    @Field({ nullable: true })
    FromEmail: string | null;

    @Field({ nullable: true })
    ReplyToEmail: string | null;

    @Field({ nullable: true })
    HtmlBody: string | null;

    @Field({ nullable: true })
    TextBody: string | null;

    @Field({ nullable: true })
    Category: string | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean;

    @Field({ nullable: true })
    PreviewText: string | null;

    @Field({ nullable: true })
    Tags: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Email Templates
//****************************************************************************
@InputType()
export class UpdateAssociationDemoEmailTemplateInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Subject?: string | null;

    @Field({ nullable: true })
    FromName?: string | null;

    @Field({ nullable: true })
    FromEmail?: string | null;

    @Field({ nullable: true })
    ReplyToEmail?: string | null;

    @Field({ nullable: true })
    HtmlBody?: string | null;

    @Field({ nullable: true })
    TextBody?: string | null;

    @Field({ nullable: true })
    Category?: string | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean;

    @Field({ nullable: true })
    PreviewText?: string | null;

    @Field({ nullable: true })
    Tags?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Email Templates
//****************************************************************************
@ObjectType()
export class RunAssociationDemoEmailTemplateViewResult {
    @Field(() => [AssociationDemoEmailTemplate_])
    Results: AssociationDemoEmailTemplate_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoEmailTemplate_)
export class AssociationDemoEmailTemplateResolver extends ResolverBase {
    @Query(() => RunAssociationDemoEmailTemplateViewResult)
    async RunAssociationDemoEmailTemplateViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoEmailTemplateViewResult)
    async RunAssociationDemoEmailTemplateViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoEmailTemplateViewResult)
    async RunAssociationDemoEmailTemplateDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Email Templates';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoEmailTemplate_, { nullable: true })
    async AssociationDemoEmailTemplate(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoEmailTemplate_ | null> {
        this.CheckUserReadPermissions('Email Templates', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwEmailTemplates')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Email Templates', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Email Templates', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoEmailSend_])
    async AssociationDemoEmailSends_TemplateIDArray(@Root() associationdemoemailtemplate_: AssociationDemoEmailTemplate_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Email Sends', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwEmailSends')} WHERE ${provider.QuoteIdentifier('TemplateID')}='${associationdemoemailtemplate_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Email Sends', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Email Sends', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoEmailTemplate_)
    async CreateAssociationDemoEmailTemplate(
        @Arg('input', () => CreateAssociationDemoEmailTemplateInput) input: CreateAssociationDemoEmailTemplateInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Email Templates', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoEmailTemplate_)
    async UpdateAssociationDemoEmailTemplate(
        @Arg('input', () => UpdateAssociationDemoEmailTemplateInput) input: UpdateAssociationDemoEmailTemplateInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Email Templates', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoEmailTemplate_)
    async DeleteAssociationDemoEmailTemplate(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Email Templates', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Enrollments
//****************************************************************************
@ObjectType()
export class AssociationDemoEnrollment_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    CourseID: string;
        
    @Field() 
    @MaxLength(36)
    MemberID: string;
        
    @Field() 
    EnrollmentDate: Date;
        
    @Field({nullable: true}) 
    StartDate?: Date;
        
    @Field({nullable: true}) 
    CompletionDate?: Date;
        
    @Field({nullable: true}) 
    ExpirationDate?: Date;
        
    @Field() 
    @MaxLength(20)
    Status: string;
        
    @Field(() => Int, {nullable: true}) 
    ProgressPercentage?: number;
        
    @Field({nullable: true}) 
    LastAccessedDate?: Date;
        
    @Field(() => Int, {nullable: true}) 
    TimeSpentMinutes?: number;
        
    @Field(() => Float, {nullable: true}) 
    FinalScore?: number;
        
    @Field(() => Float, {nullable: true}) 
    PassingScore?: number;
        
    @Field(() => Boolean, {nullable: true}) 
    Passed?: boolean;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    InvoiceID?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field(() => [AssociationDemoCertificate_])
    AssociationDemoCertificates_EnrollmentIDArray: AssociationDemoCertificate_[]; // Link to AssociationDemoCertificates
    
}

//****************************************************************************
// INPUT TYPE for Enrollments
//****************************************************************************
@InputType()
export class CreateAssociationDemoEnrollmentInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    CourseID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    EnrollmentDate?: Date;

    @Field({ nullable: true })
    StartDate: Date | null;

    @Field({ nullable: true })
    CompletionDate: Date | null;

    @Field({ nullable: true })
    ExpirationDate: Date | null;

    @Field({ nullable: true })
    Status?: string;

    @Field(() => Int, { nullable: true })
    ProgressPercentage?: number | null;

    @Field({ nullable: true })
    LastAccessedDate: Date | null;

    @Field(() => Int, { nullable: true })
    TimeSpentMinutes?: number | null;

    @Field(() => Float, { nullable: true })
    FinalScore: number | null;

    @Field(() => Float, { nullable: true })
    PassingScore?: number | null;

    @Field(() => Boolean, { nullable: true })
    Passed: boolean | null;

    @Field({ nullable: true })
    InvoiceID: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Enrollments
//****************************************************************************
@InputType()
export class UpdateAssociationDemoEnrollmentInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    CourseID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    EnrollmentDate?: Date;

    @Field({ nullable: true })
    StartDate?: Date | null;

    @Field({ nullable: true })
    CompletionDate?: Date | null;

    @Field({ nullable: true })
    ExpirationDate?: Date | null;

    @Field({ nullable: true })
    Status?: string;

    @Field(() => Int, { nullable: true })
    ProgressPercentage?: number | null;

    @Field({ nullable: true })
    LastAccessedDate?: Date | null;

    @Field(() => Int, { nullable: true })
    TimeSpentMinutes?: number | null;

    @Field(() => Float, { nullable: true })
    FinalScore?: number | null;

    @Field(() => Float, { nullable: true })
    PassingScore?: number | null;

    @Field(() => Boolean, { nullable: true })
    Passed?: boolean | null;

    @Field({ nullable: true })
    InvoiceID?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Enrollments
//****************************************************************************
@ObjectType()
export class RunAssociationDemoEnrollmentViewResult {
    @Field(() => [AssociationDemoEnrollment_])
    Results: AssociationDemoEnrollment_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoEnrollment_)
export class AssociationDemoEnrollmentResolver extends ResolverBase {
    @Query(() => RunAssociationDemoEnrollmentViewResult)
    async RunAssociationDemoEnrollmentViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoEnrollmentViewResult)
    async RunAssociationDemoEnrollmentViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoEnrollmentViewResult)
    async RunAssociationDemoEnrollmentDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Enrollments';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoEnrollment_, { nullable: true })
    async AssociationDemoEnrollment(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoEnrollment_ | null> {
        this.CheckUserReadPermissions('Enrollments', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwEnrollments')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Enrollments', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Enrollments', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoCertificate_])
    async AssociationDemoCertificates_EnrollmentIDArray(@Root() associationdemoenrollment_: AssociationDemoEnrollment_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Certificates', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCertificates')} WHERE ${provider.QuoteIdentifier('EnrollmentID')}='${associationdemoenrollment_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Certificates', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Certificates', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoEnrollment_)
    async CreateAssociationDemoEnrollment(
        @Arg('input', () => CreateAssociationDemoEnrollmentInput) input: CreateAssociationDemoEnrollmentInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Enrollments', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoEnrollment_)
    async UpdateAssociationDemoEnrollment(
        @Arg('input', () => UpdateAssociationDemoEnrollmentInput) input: UpdateAssociationDemoEnrollmentInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Enrollments', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoEnrollment_)
    async DeleteAssociationDemoEnrollment(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Enrollments', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Event Registrations
//****************************************************************************
@ObjectType()
export class membershipEventRegistration_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    MemberID: string;
        
    @Field() 
    @MaxLength(200)
    EventName: string;
        
    @Field() 
    EventDate: Date;
        
    @Field(() => Boolean) 
    Attended: boolean;
        
    @Field() 
    @MaxLength(50)
    RegistrationType: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
}

//****************************************************************************
// INPUT TYPE for Event Registrations
//****************************************************************************
@InputType()
export class CreatemembershipEventRegistrationInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    EventName?: string;

    @Field({ nullable: true })
    EventDate?: Date;

    @Field(() => Boolean, { nullable: true })
    Attended?: boolean;

    @Field({ nullable: true })
    RegistrationType?: string;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Event Registrations
//****************************************************************************
@InputType()
export class UpdatemembershipEventRegistrationInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    EventName?: string;

    @Field({ nullable: true })
    EventDate?: Date;

    @Field(() => Boolean, { nullable: true })
    Attended?: boolean;

    @Field({ nullable: true })
    RegistrationType?: string;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Event Registrations
//****************************************************************************
@ObjectType()
export class RunmembershipEventRegistrationViewResult {
    @Field(() => [membershipEventRegistration_])
    Results: membershipEventRegistration_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(membershipEventRegistration_)
export class membershipEventRegistrationResolver extends ResolverBase {
    @Query(() => RunmembershipEventRegistrationViewResult)
    async RunmembershipEventRegistrationViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmembershipEventRegistrationViewResult)
    async RunmembershipEventRegistrationViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmembershipEventRegistrationViewResult)
    async RunmembershipEventRegistrationDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Event Registrations';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => membershipEventRegistration_, { nullable: true })
    async membershipEventRegistration(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<membershipEventRegistration_ | null> {
        this.CheckUserReadPermissions('Event Registrations', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('membership', 'vwEventRegistrations')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Event Registrations', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Event Registrations', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => membershipEventRegistration_)
    async CreatemembershipEventRegistration(
        @Arg('input', () => CreatemembershipEventRegistrationInput) input: CreatemembershipEventRegistrationInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Event Registrations', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => membershipEventRegistration_)
    async UpdatemembershipEventRegistration(
        @Arg('input', () => UpdatemembershipEventRegistrationInput) input: UpdatemembershipEventRegistrationInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Event Registrations', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => membershipEventRegistration_)
    async DeletemembershipEventRegistration(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Event Registrations', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Event Registrations__AssociationDemo
//****************************************************************************
@ObjectType()
export class AssociationDemoEventRegistration_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    EventID: string;
        
    @Field() 
    @MaxLength(36)
    MemberID: string;
        
    @Field() 
    RegistrationDate: Date;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    RegistrationType?: string;
        
    @Field() 
    @MaxLength(20)
    Status: string;
        
    @Field({nullable: true}) 
    CheckInTime?: Date;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    InvoiceID?: string;
        
    @Field(() => Boolean) 
    CEUAwarded: boolean;
        
    @Field({nullable: true}) 
    CEUAwardedDate?: Date;
        
    @Field({nullable: true}) 
    CancellationDate?: Date;
        
    @Field({nullable: true}) 
    CancellationReason?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(255)
    Event: string;
        
}

//****************************************************************************
// INPUT TYPE for Event Registrations__AssociationDemo
//****************************************************************************
@InputType()
export class CreateAssociationDemoEventRegistrationInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    EventID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    RegistrationDate?: Date;

    @Field({ nullable: true })
    RegistrationType: string | null;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    CheckInTime: Date | null;

    @Field({ nullable: true })
    InvoiceID: string | null;

    @Field(() => Boolean, { nullable: true })
    CEUAwarded?: boolean;

    @Field({ nullable: true })
    CEUAwardedDate: Date | null;

    @Field({ nullable: true })
    CancellationDate: Date | null;

    @Field({ nullable: true })
    CancellationReason: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Event Registrations__AssociationDemo
//****************************************************************************
@InputType()
export class UpdateAssociationDemoEventRegistrationInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    EventID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    RegistrationDate?: Date;

    @Field({ nullable: true })
    RegistrationType?: string | null;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    CheckInTime?: Date | null;

    @Field({ nullable: true })
    InvoiceID?: string | null;

    @Field(() => Boolean, { nullable: true })
    CEUAwarded?: boolean;

    @Field({ nullable: true })
    CEUAwardedDate?: Date | null;

    @Field({ nullable: true })
    CancellationDate?: Date | null;

    @Field({ nullable: true })
    CancellationReason?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Event Registrations__AssociationDemo
//****************************************************************************
@ObjectType()
export class RunAssociationDemoEventRegistrationViewResult {
    @Field(() => [AssociationDemoEventRegistration_])
    Results: AssociationDemoEventRegistration_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoEventRegistration_)
export class AssociationDemoEventRegistrationResolver extends ResolverBase {
    @Query(() => RunAssociationDemoEventRegistrationViewResult)
    async RunAssociationDemoEventRegistrationViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoEventRegistrationViewResult)
    async RunAssociationDemoEventRegistrationViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoEventRegistrationViewResult)
    async RunAssociationDemoEventRegistrationDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Event Registrations__AssociationDemo';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoEventRegistration_, { nullable: true })
    async AssociationDemoEventRegistration(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoEventRegistration_ | null> {
        this.CheckUserReadPermissions('Event Registrations__AssociationDemo', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwEventRegistrations__AssociationDemo')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Event Registrations__AssociationDemo', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Event Registrations__AssociationDemo', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoEventRegistration_)
    async CreateAssociationDemoEventRegistration(
        @Arg('input', () => CreateAssociationDemoEventRegistrationInput) input: CreateAssociationDemoEventRegistrationInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Event Registrations__AssociationDemo', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoEventRegistration_)
    async UpdateAssociationDemoEventRegistration(
        @Arg('input', () => UpdateAssociationDemoEventRegistrationInput) input: UpdateAssociationDemoEventRegistrationInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Event Registrations__AssociationDemo', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoEventRegistration_)
    async DeleteAssociationDemoEventRegistration(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Event Registrations__AssociationDemo', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Event Sessions
//****************************************************************************
@ObjectType()
export class AssociationDemoEventSession_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    EventID: string;
        
    @Field() 
    @MaxLength(255)
    Name: string;
        
    @Field({nullable: true}) 
    Description?: string;
        
    @Field() 
    StartTime: Date;
        
    @Field() 
    EndTime: Date;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    Room?: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    SpeakerName?: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    SessionType?: string;
        
    @Field(() => Int, {nullable: true}) 
    Capacity?: number;
        
    @Field(() => Float, {nullable: true}) 
    CEUCredits?: number;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(255)
    Event: string;
        
}

//****************************************************************************
// INPUT TYPE for Event Sessions
//****************************************************************************
@InputType()
export class CreateAssociationDemoEventSessionInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    EventID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Description: string | null;

    @Field({ nullable: true })
    StartTime?: Date;

    @Field({ nullable: true })
    EndTime?: Date;

    @Field({ nullable: true })
    Room: string | null;

    @Field({ nullable: true })
    SpeakerName: string | null;

    @Field({ nullable: true })
    SessionType: string | null;

    @Field(() => Int, { nullable: true })
    Capacity: number | null;

    @Field(() => Float, { nullable: true })
    CEUCredits: number | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Event Sessions
//****************************************************************************
@InputType()
export class UpdateAssociationDemoEventSessionInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    EventID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Description?: string | null;

    @Field({ nullable: true })
    StartTime?: Date;

    @Field({ nullable: true })
    EndTime?: Date;

    @Field({ nullable: true })
    Room?: string | null;

    @Field({ nullable: true })
    SpeakerName?: string | null;

    @Field({ nullable: true })
    SessionType?: string | null;

    @Field(() => Int, { nullable: true })
    Capacity?: number | null;

    @Field(() => Float, { nullable: true })
    CEUCredits?: number | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Event Sessions
//****************************************************************************
@ObjectType()
export class RunAssociationDemoEventSessionViewResult {
    @Field(() => [AssociationDemoEventSession_])
    Results: AssociationDemoEventSession_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoEventSession_)
export class AssociationDemoEventSessionResolver extends ResolverBase {
    @Query(() => RunAssociationDemoEventSessionViewResult)
    async RunAssociationDemoEventSessionViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoEventSessionViewResult)
    async RunAssociationDemoEventSessionViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoEventSessionViewResult)
    async RunAssociationDemoEventSessionDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Event Sessions';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoEventSession_, { nullable: true })
    async AssociationDemoEventSession(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoEventSession_ | null> {
        this.CheckUserReadPermissions('Event Sessions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwEventSessions')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Event Sessions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Event Sessions', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoEventSession_)
    async CreateAssociationDemoEventSession(
        @Arg('input', () => CreateAssociationDemoEventSessionInput) input: CreateAssociationDemoEventSessionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Event Sessions', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoEventSession_)
    async UpdateAssociationDemoEventSession(
        @Arg('input', () => UpdateAssociationDemoEventSessionInput) input: UpdateAssociationDemoEventSessionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Event Sessions', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoEventSession_)
    async DeleteAssociationDemoEventSession(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Event Sessions', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Events
//****************************************************************************
@ObjectType()
export class AssociationDemoEvent_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(255)
    Name: string;
        
    @Field() 
    @MaxLength(50)
    EventType: string;
        
    @Field() 
    StartDate: Date;
        
    @Field() 
    EndDate: Date;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    Timezone?: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    Location?: string;
        
    @Field(() => Boolean) 
    IsVirtual: boolean;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    VirtualPlatform?: string;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    MeetingURL?: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    ChapterID?: string;
        
    @Field(() => Int, {nullable: true}) 
    Capacity?: number;
        
    @Field({nullable: true}) 
    RegistrationOpenDate?: Date;
        
    @Field({nullable: true}) 
    RegistrationCloseDate?: Date;
        
    @Field(() => Float, {nullable: true}) 
    RegistrationFee?: number;
        
    @Field(() => Float, {nullable: true}) 
    MemberPrice?: number;
        
    @Field(() => Float, {nullable: true}) 
    NonMemberPrice?: number;
        
    @Field(() => Float, {nullable: true}) 
    CEUCredits?: number;
        
    @Field({nullable: true}) 
    Description?: string;
        
    @Field() 
    @MaxLength(20)
    Status: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field(() => [AssociationDemoEventRegistration_])
    AssociationDemoEventRegistrations__AssociationDemo_EventIDArray: AssociationDemoEventRegistration_[]; // Link to AssociationDemoEventRegistrations__AssociationDemo
    
    @Field(() => [AssociationDemoEventSession_])
    AssociationDemoEventSessions_EventIDArray: AssociationDemoEventSession_[]; // Link to AssociationDemoEventSessions
    
}

//****************************************************************************
// INPUT TYPE for Events
//****************************************************************************
@InputType()
export class CreateAssociationDemoEventInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    EventType?: string;

    @Field({ nullable: true })
    StartDate?: Date;

    @Field({ nullable: true })
    EndDate?: Date;

    @Field({ nullable: true })
    Timezone: string | null;

    @Field({ nullable: true })
    Location: string | null;

    @Field(() => Boolean, { nullable: true })
    IsVirtual?: boolean;

    @Field({ nullable: true })
    VirtualPlatform: string | null;

    @Field({ nullable: true })
    MeetingURL: string | null;

    @Field({ nullable: true })
    ChapterID: string | null;

    @Field(() => Int, { nullable: true })
    Capacity: number | null;

    @Field({ nullable: true })
    RegistrationOpenDate: Date | null;

    @Field({ nullable: true })
    RegistrationCloseDate: Date | null;

    @Field(() => Float, { nullable: true })
    RegistrationFee: number | null;

    @Field(() => Float, { nullable: true })
    MemberPrice: number | null;

    @Field(() => Float, { nullable: true })
    NonMemberPrice: number | null;

    @Field(() => Float, { nullable: true })
    CEUCredits: number | null;

    @Field({ nullable: true })
    Description: string | null;

    @Field({ nullable: true })
    Status?: string;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Events
//****************************************************************************
@InputType()
export class UpdateAssociationDemoEventInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    EventType?: string;

    @Field({ nullable: true })
    StartDate?: Date;

    @Field({ nullable: true })
    EndDate?: Date;

    @Field({ nullable: true })
    Timezone?: string | null;

    @Field({ nullable: true })
    Location?: string | null;

    @Field(() => Boolean, { nullable: true })
    IsVirtual?: boolean;

    @Field({ nullable: true })
    VirtualPlatform?: string | null;

    @Field({ nullable: true })
    MeetingURL?: string | null;

    @Field({ nullable: true })
    ChapterID?: string | null;

    @Field(() => Int, { nullable: true })
    Capacity?: number | null;

    @Field({ nullable: true })
    RegistrationOpenDate?: Date | null;

    @Field({ nullable: true })
    RegistrationCloseDate?: Date | null;

    @Field(() => Float, { nullable: true })
    RegistrationFee?: number | null;

    @Field(() => Float, { nullable: true })
    MemberPrice?: number | null;

    @Field(() => Float, { nullable: true })
    NonMemberPrice?: number | null;

    @Field(() => Float, { nullable: true })
    CEUCredits?: number | null;

    @Field({ nullable: true })
    Description?: string | null;

    @Field({ nullable: true })
    Status?: string;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Events
//****************************************************************************
@ObjectType()
export class RunAssociationDemoEventViewResult {
    @Field(() => [AssociationDemoEvent_])
    Results: AssociationDemoEvent_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoEvent_)
export class AssociationDemoEventResolver extends ResolverBase {
    @Query(() => RunAssociationDemoEventViewResult)
    async RunAssociationDemoEventViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoEventViewResult)
    async RunAssociationDemoEventViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoEventViewResult)
    async RunAssociationDemoEventDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Events';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoEvent_, { nullable: true })
    async AssociationDemoEvent(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoEvent_ | null> {
        this.CheckUserReadPermissions('Events', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwEvents')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Events', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Events', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoEventRegistration_])
    async AssociationDemoEventRegistrations__AssociationDemo_EventIDArray(@Root() associationdemoevent_: AssociationDemoEvent_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Event Registrations__AssociationDemo', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwEventRegistrations__AssociationDemo')} WHERE ${provider.QuoteIdentifier('EventID')}='${associationdemoevent_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Event Registrations__AssociationDemo', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Event Registrations__AssociationDemo', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoEventSession_])
    async AssociationDemoEventSessions_EventIDArray(@Root() associationdemoevent_: AssociationDemoEvent_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Event Sessions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwEventSessions')} WHERE ${provider.QuoteIdentifier('EventID')}='${associationdemoevent_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Event Sessions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Event Sessions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoEvent_)
    async CreateAssociationDemoEvent(
        @Arg('input', () => CreateAssociationDemoEventInput) input: CreateAssociationDemoEventInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Events', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoEvent_)
    async UpdateAssociationDemoEvent(
        @Arg('input', () => UpdateAssociationDemoEventInput) input: UpdateAssociationDemoEventInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Events', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoEvent_)
    async DeleteAssociationDemoEvent(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Events', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Forum Categories
//****************************************************************************
@ObjectType()
export class AssociationDemoForumCategory_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(255)
    Name: string;
        
    @Field({nullable: true}) 
    Description?: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    ParentCategoryID?: string;
        
    @Field(() => Int, {nullable: true}) 
    DisplayOrder?: number;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    Icon?: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    Color?: string;
        
    @Field(() => Boolean, {nullable: true}) 
    IsActive?: boolean;
        
    @Field(() => Boolean, {nullable: true}) 
    RequiresMembership?: boolean;
        
    @Field(() => Int, {nullable: true}) 
    ThreadCount?: number;
        
    @Field(() => Int, {nullable: true}) 
    PostCount?: number;
        
    @Field({nullable: true}) 
    LastPostDate?: Date;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    LastPostAuthorID?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    ParentCategory?: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    RootParentCategoryID?: string;
        
    @Field(() => [AssociationDemoForumThread_])
    AssociationDemoForumThreads_CategoryIDArray: AssociationDemoForumThread_[]; // Link to AssociationDemoForumThreads
    
    @Field(() => [AssociationDemoForumCategory_])
    AssociationDemoForumCategories_ParentCategoryIDArray: AssociationDemoForumCategory_[]; // Link to AssociationDemoForumCategories
    
}

//****************************************************************************
// INPUT TYPE for Forum Categories
//****************************************************************************
@InputType()
export class CreateAssociationDemoForumCategoryInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Description: string | null;

    @Field({ nullable: true })
    ParentCategoryID: string | null;

    @Field(() => Int, { nullable: true })
    DisplayOrder?: number | null;

    @Field({ nullable: true })
    Icon: string | null;

    @Field({ nullable: true })
    Color: string | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean | null;

    @Field(() => Boolean, { nullable: true })
    RequiresMembership?: boolean | null;

    @Field(() => Int, { nullable: true })
    ThreadCount?: number | null;

    @Field(() => Int, { nullable: true })
    PostCount?: number | null;

    @Field({ nullable: true })
    LastPostDate: Date | null;

    @Field({ nullable: true })
    LastPostAuthorID: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Forum Categories
//****************************************************************************
@InputType()
export class UpdateAssociationDemoForumCategoryInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Description?: string | null;

    @Field({ nullable: true })
    ParentCategoryID?: string | null;

    @Field(() => Int, { nullable: true })
    DisplayOrder?: number | null;

    @Field({ nullable: true })
    Icon?: string | null;

    @Field({ nullable: true })
    Color?: string | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean | null;

    @Field(() => Boolean, { nullable: true })
    RequiresMembership?: boolean | null;

    @Field(() => Int, { nullable: true })
    ThreadCount?: number | null;

    @Field(() => Int, { nullable: true })
    PostCount?: number | null;

    @Field({ nullable: true })
    LastPostDate?: Date | null;

    @Field({ nullable: true })
    LastPostAuthorID?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Forum Categories
//****************************************************************************
@ObjectType()
export class RunAssociationDemoForumCategoryViewResult {
    @Field(() => [AssociationDemoForumCategory_])
    Results: AssociationDemoForumCategory_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoForumCategory_)
export class AssociationDemoForumCategoryResolver extends ResolverBase {
    @Query(() => RunAssociationDemoForumCategoryViewResult)
    async RunAssociationDemoForumCategoryViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoForumCategoryViewResult)
    async RunAssociationDemoForumCategoryViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoForumCategoryViewResult)
    async RunAssociationDemoForumCategoryDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Forum Categories';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoForumCategory_, { nullable: true })
    async AssociationDemoForumCategory(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoForumCategory_ | null> {
        this.CheckUserReadPermissions('Forum Categories', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwForumCategories')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Forum Categories', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Forum Categories', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoForumThread_])
    async AssociationDemoForumThreads_CategoryIDArray(@Root() associationdemoforumcategory_: AssociationDemoForumCategory_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Forum Threads', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwForumThreads')} WHERE ${provider.QuoteIdentifier('CategoryID')}='${associationdemoforumcategory_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Forum Threads', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Forum Threads', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoForumCategory_])
    async AssociationDemoForumCategories_ParentCategoryIDArray(@Root() associationdemoforumcategory_: AssociationDemoForumCategory_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Forum Categories', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwForumCategories')} WHERE ${provider.QuoteIdentifier('ParentCategoryID')}='${associationdemoforumcategory_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Forum Categories', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Forum Categories', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoForumCategory_)
    async CreateAssociationDemoForumCategory(
        @Arg('input', () => CreateAssociationDemoForumCategoryInput) input: CreateAssociationDemoForumCategoryInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Forum Categories', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoForumCategory_)
    async UpdateAssociationDemoForumCategory(
        @Arg('input', () => UpdateAssociationDemoForumCategoryInput) input: UpdateAssociationDemoForumCategoryInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Forum Categories', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoForumCategory_)
    async DeleteAssociationDemoForumCategory(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Forum Categories', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Forum Moderations
//****************************************************************************
@ObjectType()
export class AssociationDemoForumModeration_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    PostID: string;
        
    @Field() 
    @MaxLength(36)
    ReportedByID: string;
        
    @Field() 
    ReportedDate: Date;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    ReportReason?: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    ModerationStatus?: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    ModeratedByID?: string;
        
    @Field({nullable: true}) 
    ModeratedDate?: Date;
        
    @Field({nullable: true}) 
    ModeratorNotes?: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    Action?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
}

//****************************************************************************
// INPUT TYPE for Forum Moderations
//****************************************************************************
@InputType()
export class CreateAssociationDemoForumModerationInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    PostID?: string;

    @Field({ nullable: true })
    ReportedByID?: string;

    @Field({ nullable: true })
    ReportedDate?: Date;

    @Field({ nullable: true })
    ReportReason: string | null;

    @Field({ nullable: true })
    ModerationStatus?: string | null;

    @Field({ nullable: true })
    ModeratedByID: string | null;

    @Field({ nullable: true })
    ModeratedDate: Date | null;

    @Field({ nullable: true })
    ModeratorNotes: string | null;

    @Field({ nullable: true })
    Action: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Forum Moderations
//****************************************************************************
@InputType()
export class UpdateAssociationDemoForumModerationInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    PostID?: string;

    @Field({ nullable: true })
    ReportedByID?: string;

    @Field({ nullable: true })
    ReportedDate?: Date;

    @Field({ nullable: true })
    ReportReason?: string | null;

    @Field({ nullable: true })
    ModerationStatus?: string | null;

    @Field({ nullable: true })
    ModeratedByID?: string | null;

    @Field({ nullable: true })
    ModeratedDate?: Date | null;

    @Field({ nullable: true })
    ModeratorNotes?: string | null;

    @Field({ nullable: true })
    Action?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Forum Moderations
//****************************************************************************
@ObjectType()
export class RunAssociationDemoForumModerationViewResult {
    @Field(() => [AssociationDemoForumModeration_])
    Results: AssociationDemoForumModeration_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoForumModeration_)
export class AssociationDemoForumModerationResolver extends ResolverBase {
    @Query(() => RunAssociationDemoForumModerationViewResult)
    async RunAssociationDemoForumModerationViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoForumModerationViewResult)
    async RunAssociationDemoForumModerationViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoForumModerationViewResult)
    async RunAssociationDemoForumModerationDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Forum Moderations';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoForumModeration_, { nullable: true })
    async AssociationDemoForumModeration(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoForumModeration_ | null> {
        this.CheckUserReadPermissions('Forum Moderations', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwForumModerations')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Forum Moderations', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Forum Moderations', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoForumModeration_)
    async CreateAssociationDemoForumModeration(
        @Arg('input', () => CreateAssociationDemoForumModerationInput) input: CreateAssociationDemoForumModerationInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Forum Moderations', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoForumModeration_)
    async UpdateAssociationDemoForumModeration(
        @Arg('input', () => UpdateAssociationDemoForumModerationInput) input: UpdateAssociationDemoForumModerationInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Forum Moderations', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoForumModeration_)
    async DeleteAssociationDemoForumModeration(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Forum Moderations', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Forum Posts
//****************************************************************************
@ObjectType()
export class AssociationDemoForumPost_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    ThreadID: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    ParentPostID?: string;
        
    @Field() 
    @MaxLength(36)
    AuthorID: string;
        
    @Field() 
    Content: string;
        
    @Field() 
    PostedDate: Date;
        
    @Field({nullable: true}) 
    EditedDate?: Date;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    EditedByID?: string;
        
    @Field(() => Int, {nullable: true}) 
    LikeCount?: number;
        
    @Field(() => Int, {nullable: true}) 
    HelpfulCount?: number;
        
    @Field(() => Boolean, {nullable: true}) 
    IsAcceptedAnswer?: boolean;
        
    @Field(() => Boolean, {nullable: true}) 
    IsFlagged?: boolean;
        
    @Field({nullable: true}) 
    @MaxLength(20)
    Status?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    RootParentPostID?: string;
        
    @Field(() => [AssociationDemoPostTag_])
    AssociationDemoPostTags_PostIDArray: AssociationDemoPostTag_[]; // Link to AssociationDemoPostTags
    
    @Field(() => [AssociationDemoForumModeration_])
    AssociationDemoForumModerations_PostIDArray: AssociationDemoForumModeration_[]; // Link to AssociationDemoForumModerations
    
    @Field(() => [AssociationDemoForumPost_])
    AssociationDemoForumPosts_ParentPostIDArray: AssociationDemoForumPost_[]; // Link to AssociationDemoForumPosts
    
    @Field(() => [AssociationDemoPostAttachment_])
    AssociationDemoPostAttachments_PostIDArray: AssociationDemoPostAttachment_[]; // Link to AssociationDemoPostAttachments
    
    @Field(() => [AssociationDemoPostReaction_])
    AssociationDemoPostReactions_PostIDArray: AssociationDemoPostReaction_[]; // Link to AssociationDemoPostReactions
    
}

//****************************************************************************
// INPUT TYPE for Forum Posts
//****************************************************************************
@InputType()
export class CreateAssociationDemoForumPostInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    ThreadID?: string;

    @Field({ nullable: true })
    ParentPostID: string | null;

    @Field({ nullable: true })
    AuthorID?: string;

    @Field({ nullable: true })
    Content?: string;

    @Field({ nullable: true })
    PostedDate?: Date;

    @Field({ nullable: true })
    EditedDate: Date | null;

    @Field({ nullable: true })
    EditedByID: string | null;

    @Field(() => Int, { nullable: true })
    LikeCount?: number | null;

    @Field(() => Int, { nullable: true })
    HelpfulCount?: number | null;

    @Field(() => Boolean, { nullable: true })
    IsAcceptedAnswer?: boolean | null;

    @Field(() => Boolean, { nullable: true })
    IsFlagged?: boolean | null;

    @Field({ nullable: true })
    Status?: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Forum Posts
//****************************************************************************
@InputType()
export class UpdateAssociationDemoForumPostInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    ThreadID?: string;

    @Field({ nullable: true })
    ParentPostID?: string | null;

    @Field({ nullable: true })
    AuthorID?: string;

    @Field({ nullable: true })
    Content?: string;

    @Field({ nullable: true })
    PostedDate?: Date;

    @Field({ nullable: true })
    EditedDate?: Date | null;

    @Field({ nullable: true })
    EditedByID?: string | null;

    @Field(() => Int, { nullable: true })
    LikeCount?: number | null;

    @Field(() => Int, { nullable: true })
    HelpfulCount?: number | null;

    @Field(() => Boolean, { nullable: true })
    IsAcceptedAnswer?: boolean | null;

    @Field(() => Boolean, { nullable: true })
    IsFlagged?: boolean | null;

    @Field({ nullable: true })
    Status?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Forum Posts
//****************************************************************************
@ObjectType()
export class RunAssociationDemoForumPostViewResult {
    @Field(() => [AssociationDemoForumPost_])
    Results: AssociationDemoForumPost_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoForumPost_)
export class AssociationDemoForumPostResolver extends ResolverBase {
    @Query(() => RunAssociationDemoForumPostViewResult)
    async RunAssociationDemoForumPostViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoForumPostViewResult)
    async RunAssociationDemoForumPostViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoForumPostViewResult)
    async RunAssociationDemoForumPostDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Forum Posts';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoForumPost_, { nullable: true })
    async AssociationDemoForumPost(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoForumPost_ | null> {
        this.CheckUserReadPermissions('Forum Posts', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwForumPosts')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Forum Posts', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Forum Posts', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoPostTag_])
    async AssociationDemoPostTags_PostIDArray(@Root() associationdemoforumpost_: AssociationDemoForumPost_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Post Tags', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwPostTags')} WHERE ${provider.QuoteIdentifier('PostID')}='${associationdemoforumpost_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Post Tags', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Post Tags', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoForumModeration_])
    async AssociationDemoForumModerations_PostIDArray(@Root() associationdemoforumpost_: AssociationDemoForumPost_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Forum Moderations', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwForumModerations')} WHERE ${provider.QuoteIdentifier('PostID')}='${associationdemoforumpost_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Forum Moderations', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Forum Moderations', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoForumPost_])
    async AssociationDemoForumPosts_ParentPostIDArray(@Root() associationdemoforumpost_: AssociationDemoForumPost_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Forum Posts', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwForumPosts')} WHERE ${provider.QuoteIdentifier('ParentPostID')}='${associationdemoforumpost_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Forum Posts', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Forum Posts', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoPostAttachment_])
    async AssociationDemoPostAttachments_PostIDArray(@Root() associationdemoforumpost_: AssociationDemoForumPost_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Post Attachments', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwPostAttachments')} WHERE ${provider.QuoteIdentifier('PostID')}='${associationdemoforumpost_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Post Attachments', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Post Attachments', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoPostReaction_])
    async AssociationDemoPostReactions_PostIDArray(@Root() associationdemoforumpost_: AssociationDemoForumPost_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Post Reactions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwPostReactions')} WHERE ${provider.QuoteIdentifier('PostID')}='${associationdemoforumpost_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Post Reactions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Post Reactions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoForumPost_)
    async CreateAssociationDemoForumPost(
        @Arg('input', () => CreateAssociationDemoForumPostInput) input: CreateAssociationDemoForumPostInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Forum Posts', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoForumPost_)
    async UpdateAssociationDemoForumPost(
        @Arg('input', () => UpdateAssociationDemoForumPostInput) input: UpdateAssociationDemoForumPostInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Forum Posts', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoForumPost_)
    async DeleteAssociationDemoForumPost(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Forum Posts', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Forum Threads
//****************************************************************************
@ObjectType()
export class AssociationDemoForumThread_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    CategoryID: string;
        
    @Field() 
    @MaxLength(500)
    Title: string;
        
    @Field() 
    @MaxLength(36)
    AuthorID: string;
        
    @Field() 
    CreatedDate: Date;
        
    @Field(() => Int, {nullable: true}) 
    ViewCount?: number;
        
    @Field(() => Int, {nullable: true}) 
    ReplyCount?: number;
        
    @Field({nullable: true}) 
    LastActivityDate?: Date;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    LastReplyAuthorID?: string;
        
    @Field(() => Boolean, {nullable: true}) 
    IsPinned?: boolean;
        
    @Field(() => Boolean, {nullable: true}) 
    IsLocked?: boolean;
        
    @Field(() => Boolean, {nullable: true}) 
    IsFeatured?: boolean;
        
    @Field({nullable: true}) 
    @MaxLength(20)
    Status?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(255)
    Category: string;
        
    @Field(() => [AssociationDemoForumPost_])
    AssociationDemoForumPosts_ThreadIDArray: AssociationDemoForumPost_[]; // Link to AssociationDemoForumPosts
    
}

//****************************************************************************
// INPUT TYPE for Forum Threads
//****************************************************************************
@InputType()
export class CreateAssociationDemoForumThreadInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    CategoryID?: string;

    @Field({ nullable: true })
    Title?: string;

    @Field({ nullable: true })
    AuthorID?: string;

    @Field({ nullable: true })
    CreatedDate?: Date;

    @Field(() => Int, { nullable: true })
    ViewCount?: number | null;

    @Field(() => Int, { nullable: true })
    ReplyCount?: number | null;

    @Field({ nullable: true })
    LastActivityDate: Date | null;

    @Field({ nullable: true })
    LastReplyAuthorID: string | null;

    @Field(() => Boolean, { nullable: true })
    IsPinned?: boolean | null;

    @Field(() => Boolean, { nullable: true })
    IsLocked?: boolean | null;

    @Field(() => Boolean, { nullable: true })
    IsFeatured?: boolean | null;

    @Field({ nullable: true })
    Status?: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Forum Threads
//****************************************************************************
@InputType()
export class UpdateAssociationDemoForumThreadInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    CategoryID?: string;

    @Field({ nullable: true })
    Title?: string;

    @Field({ nullable: true })
    AuthorID?: string;

    @Field({ nullable: true })
    CreatedDate?: Date;

    @Field(() => Int, { nullable: true })
    ViewCount?: number | null;

    @Field(() => Int, { nullable: true })
    ReplyCount?: number | null;

    @Field({ nullable: true })
    LastActivityDate?: Date | null;

    @Field({ nullable: true })
    LastReplyAuthorID?: string | null;

    @Field(() => Boolean, { nullable: true })
    IsPinned?: boolean | null;

    @Field(() => Boolean, { nullable: true })
    IsLocked?: boolean | null;

    @Field(() => Boolean, { nullable: true })
    IsFeatured?: boolean | null;

    @Field({ nullable: true })
    Status?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Forum Threads
//****************************************************************************
@ObjectType()
export class RunAssociationDemoForumThreadViewResult {
    @Field(() => [AssociationDemoForumThread_])
    Results: AssociationDemoForumThread_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoForumThread_)
export class AssociationDemoForumThreadResolver extends ResolverBase {
    @Query(() => RunAssociationDemoForumThreadViewResult)
    async RunAssociationDemoForumThreadViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoForumThreadViewResult)
    async RunAssociationDemoForumThreadViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoForumThreadViewResult)
    async RunAssociationDemoForumThreadDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Forum Threads';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoForumThread_, { nullable: true })
    async AssociationDemoForumThread(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoForumThread_ | null> {
        this.CheckUserReadPermissions('Forum Threads', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwForumThreads')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Forum Threads', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Forum Threads', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoForumPost_])
    async AssociationDemoForumPosts_ThreadIDArray(@Root() associationdemoforumthread_: AssociationDemoForumThread_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Forum Posts', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwForumPosts')} WHERE ${provider.QuoteIdentifier('ThreadID')}='${associationdemoforumthread_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Forum Posts', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Forum Posts', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoForumThread_)
    async CreateAssociationDemoForumThread(
        @Arg('input', () => CreateAssociationDemoForumThreadInput) input: CreateAssociationDemoForumThreadInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Forum Threads', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoForumThread_)
    async UpdateAssociationDemoForumThread(
        @Arg('input', () => UpdateAssociationDemoForumThreadInput) input: UpdateAssociationDemoForumThreadInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Forum Threads', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoForumThread_)
    async DeleteAssociationDemoForumThread(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Forum Threads', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Government Contacts
//****************************************************************************
@ObjectType()
export class AssociationDemoGovernmentContact_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    LegislativeBodyID?: string;
        
    @Field() 
    @MaxLength(100)
    FirstName: string;
        
    @Field() 
    @MaxLength(100)
    LastName: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    Title?: string;
        
    @Field() 
    @MaxLength(50)
    ContactType: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    Party?: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    District?: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    Committee?: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    Email?: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    Phone?: string;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    OfficeAddress?: string;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    Website?: string;
        
    @Field({nullable: true}) 
    TermStart?: Date;
        
    @Field({nullable: true}) 
    TermEnd?: Date;
        
    @Field({nullable: true}) 
    Notes?: string;
        
    @Field(() => Boolean, {nullable: true}) 
    IsActive?: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    LegislativeBody?: string;
        
    @Field(() => [AssociationDemoAdvocacyAction_])
    AssociationDemoAdvocacyActions_GovernmentContactIDArray: AssociationDemoAdvocacyAction_[]; // Link to AssociationDemoAdvocacyActions
    
}

//****************************************************************************
// INPUT TYPE for Government Contacts
//****************************************************************************
@InputType()
export class CreateAssociationDemoGovernmentContactInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    LegislativeBodyID: string | null;

    @Field({ nullable: true })
    FirstName?: string;

    @Field({ nullable: true })
    LastName?: string;

    @Field({ nullable: true })
    Title: string | null;

    @Field({ nullable: true })
    ContactType?: string;

    @Field({ nullable: true })
    Party: string | null;

    @Field({ nullable: true })
    District: string | null;

    @Field({ nullable: true })
    Committee: string | null;

    @Field({ nullable: true })
    Email: string | null;

    @Field({ nullable: true })
    Phone: string | null;

    @Field({ nullable: true })
    OfficeAddress: string | null;

    @Field({ nullable: true })
    Website: string | null;

    @Field({ nullable: true })
    TermStart: Date | null;

    @Field({ nullable: true })
    TermEnd: Date | null;

    @Field({ nullable: true })
    Notes: string | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Government Contacts
//****************************************************************************
@InputType()
export class UpdateAssociationDemoGovernmentContactInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    LegislativeBodyID?: string | null;

    @Field({ nullable: true })
    FirstName?: string;

    @Field({ nullable: true })
    LastName?: string;

    @Field({ nullable: true })
    Title?: string | null;

    @Field({ nullable: true })
    ContactType?: string;

    @Field({ nullable: true })
    Party?: string | null;

    @Field({ nullable: true })
    District?: string | null;

    @Field({ nullable: true })
    Committee?: string | null;

    @Field({ nullable: true })
    Email?: string | null;

    @Field({ nullable: true })
    Phone?: string | null;

    @Field({ nullable: true })
    OfficeAddress?: string | null;

    @Field({ nullable: true })
    Website?: string | null;

    @Field({ nullable: true })
    TermStart?: Date | null;

    @Field({ nullable: true })
    TermEnd?: Date | null;

    @Field({ nullable: true })
    Notes?: string | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Government Contacts
//****************************************************************************
@ObjectType()
export class RunAssociationDemoGovernmentContactViewResult {
    @Field(() => [AssociationDemoGovernmentContact_])
    Results: AssociationDemoGovernmentContact_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoGovernmentContact_)
export class AssociationDemoGovernmentContactResolver extends ResolverBase {
    @Query(() => RunAssociationDemoGovernmentContactViewResult)
    async RunAssociationDemoGovernmentContactViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoGovernmentContactViewResult)
    async RunAssociationDemoGovernmentContactViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoGovernmentContactViewResult)
    async RunAssociationDemoGovernmentContactDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Government Contacts';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoGovernmentContact_, { nullable: true })
    async AssociationDemoGovernmentContact(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoGovernmentContact_ | null> {
        this.CheckUserReadPermissions('Government Contacts', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwGovernmentContacts')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Government Contacts', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Government Contacts', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoAdvocacyAction_])
    async AssociationDemoAdvocacyActions_GovernmentContactIDArray(@Root() associationdemogovernmentcontact_: AssociationDemoGovernmentContact_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Advocacy Actions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwAdvocacyActions')} WHERE ${provider.QuoteIdentifier('GovernmentContactID')}='${associationdemogovernmentcontact_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Advocacy Actions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Advocacy Actions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoGovernmentContact_)
    async CreateAssociationDemoGovernmentContact(
        @Arg('input', () => CreateAssociationDemoGovernmentContactInput) input: CreateAssociationDemoGovernmentContactInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Government Contacts', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoGovernmentContact_)
    async UpdateAssociationDemoGovernmentContact(
        @Arg('input', () => UpdateAssociationDemoGovernmentContactInput) input: UpdateAssociationDemoGovernmentContactInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Government Contacts', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoGovernmentContact_)
    async DeleteAssociationDemoGovernmentContact(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Government Contacts', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Invoice Line Items
//****************************************************************************
@ObjectType()
export class AssociationDemoInvoiceLineItem_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    InvoiceID: string;
        
    @Field() 
    @MaxLength(500)
    Description: string;
        
    @Field() 
    @MaxLength(50)
    ItemType: string;
        
    @Field(() => Int, {nullable: true}) 
    Quantity?: number;
        
    @Field(() => Float) 
    UnitPrice: number;
        
    @Field(() => Float) 
    Amount: number;
        
    @Field(() => Float, {nullable: true}) 
    TaxAmount?: number;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    RelatedEntityType?: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    RelatedEntityID?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
}

//****************************************************************************
// INPUT TYPE for Invoice Line Items
//****************************************************************************
@InputType()
export class CreateAssociationDemoInvoiceLineItemInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    InvoiceID?: string;

    @Field({ nullable: true })
    Description?: string;

    @Field({ nullable: true })
    ItemType?: string;

    @Field(() => Int, { nullable: true })
    Quantity?: number | null;

    @Field(() => Float, { nullable: true })
    UnitPrice?: number;

    @Field(() => Float, { nullable: true })
    Amount?: number;

    @Field(() => Float, { nullable: true })
    TaxAmount?: number | null;

    @Field({ nullable: true })
    RelatedEntityType: string | null;

    @Field({ nullable: true })
    RelatedEntityID: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Invoice Line Items
//****************************************************************************
@InputType()
export class UpdateAssociationDemoInvoiceLineItemInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    InvoiceID?: string;

    @Field({ nullable: true })
    Description?: string;

    @Field({ nullable: true })
    ItemType?: string;

    @Field(() => Int, { nullable: true })
    Quantity?: number | null;

    @Field(() => Float, { nullable: true })
    UnitPrice?: number;

    @Field(() => Float, { nullable: true })
    Amount?: number;

    @Field(() => Float, { nullable: true })
    TaxAmount?: number | null;

    @Field({ nullable: true })
    RelatedEntityType?: string | null;

    @Field({ nullable: true })
    RelatedEntityID?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Invoice Line Items
//****************************************************************************
@ObjectType()
export class RunAssociationDemoInvoiceLineItemViewResult {
    @Field(() => [AssociationDemoInvoiceLineItem_])
    Results: AssociationDemoInvoiceLineItem_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoInvoiceLineItem_)
export class AssociationDemoInvoiceLineItemResolver extends ResolverBase {
    @Query(() => RunAssociationDemoInvoiceLineItemViewResult)
    async RunAssociationDemoInvoiceLineItemViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoInvoiceLineItemViewResult)
    async RunAssociationDemoInvoiceLineItemViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoInvoiceLineItemViewResult)
    async RunAssociationDemoInvoiceLineItemDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Invoice Line Items';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoInvoiceLineItem_, { nullable: true })
    async AssociationDemoInvoiceLineItem(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoInvoiceLineItem_ | null> {
        this.CheckUserReadPermissions('Invoice Line Items', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwInvoiceLineItems')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Invoice Line Items', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Invoice Line Items', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoInvoiceLineItem_)
    async CreateAssociationDemoInvoiceLineItem(
        @Arg('input', () => CreateAssociationDemoInvoiceLineItemInput) input: CreateAssociationDemoInvoiceLineItemInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Invoice Line Items', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoInvoiceLineItem_)
    async UpdateAssociationDemoInvoiceLineItem(
        @Arg('input', () => UpdateAssociationDemoInvoiceLineItemInput) input: UpdateAssociationDemoInvoiceLineItemInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Invoice Line Items', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoInvoiceLineItem_)
    async DeleteAssociationDemoInvoiceLineItem(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Invoice Line Items', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Invoices
//****************************************************************************
@ObjectType()
export class AssociationDemoInvoice_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(50)
    InvoiceNumber: string;
        
    @Field() 
    @MaxLength(36)
    MemberID: string;
        
    @Field() 
    InvoiceDate: Date;
        
    @Field() 
    DueDate: Date;
        
    @Field(() => Float) 
    SubTotal: number;
        
    @Field(() => Float, {nullable: true}) 
    Tax?: number;
        
    @Field(() => Float, {nullable: true}) 
    Discount?: number;
        
    @Field(() => Float) 
    Total: number;
        
    @Field(() => Float, {nullable: true}) 
    AmountPaid?: number;
        
    @Field(() => Float) 
    Balance: number;
        
    @Field() 
    @MaxLength(20)
    Status: string;
        
    @Field({nullable: true}) 
    Notes?: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    PaymentTerms?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field(() => [AssociationDemoPayment_])
    AssociationDemoPayments__AssociationDemo_InvoiceIDArray: AssociationDemoPayment_[]; // Link to AssociationDemoPayments__AssociationDemo
    
    @Field(() => [AssociationDemoInvoiceLineItem_])
    AssociationDemoInvoiceLineItems_InvoiceIDArray: AssociationDemoInvoiceLineItem_[]; // Link to AssociationDemoInvoiceLineItems
    
}

//****************************************************************************
// INPUT TYPE for Invoices
//****************************************************************************
@InputType()
export class CreateAssociationDemoInvoiceInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    InvoiceNumber?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    InvoiceDate?: Date;

    @Field({ nullable: true })
    DueDate?: Date;

    @Field(() => Float, { nullable: true })
    SubTotal?: number;

    @Field(() => Float, { nullable: true })
    Tax?: number | null;

    @Field(() => Float, { nullable: true })
    Discount?: number | null;

    @Field(() => Float, { nullable: true })
    Total?: number;

    @Field(() => Float, { nullable: true })
    AmountPaid?: number | null;

    @Field(() => Float, { nullable: true })
    Balance?: number;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    Notes: string | null;

    @Field({ nullable: true })
    PaymentTerms: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Invoices
//****************************************************************************
@InputType()
export class UpdateAssociationDemoInvoiceInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    InvoiceNumber?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    InvoiceDate?: Date;

    @Field({ nullable: true })
    DueDate?: Date;

    @Field(() => Float, { nullable: true })
    SubTotal?: number;

    @Field(() => Float, { nullable: true })
    Tax?: number | null;

    @Field(() => Float, { nullable: true })
    Discount?: number | null;

    @Field(() => Float, { nullable: true })
    Total?: number;

    @Field(() => Float, { nullable: true })
    AmountPaid?: number | null;

    @Field(() => Float, { nullable: true })
    Balance?: number;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    Notes?: string | null;

    @Field({ nullable: true })
    PaymentTerms?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Invoices
//****************************************************************************
@ObjectType()
export class RunAssociationDemoInvoiceViewResult {
    @Field(() => [AssociationDemoInvoice_])
    Results: AssociationDemoInvoice_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoInvoice_)
export class AssociationDemoInvoiceResolver extends ResolverBase {
    @Query(() => RunAssociationDemoInvoiceViewResult)
    async RunAssociationDemoInvoiceViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoInvoiceViewResult)
    async RunAssociationDemoInvoiceViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoInvoiceViewResult)
    async RunAssociationDemoInvoiceDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Invoices';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoInvoice_, { nullable: true })
    async AssociationDemoInvoice(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoInvoice_ | null> {
        this.CheckUserReadPermissions('Invoices', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwInvoices')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Invoices', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Invoices', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoPayment_])
    async AssociationDemoPayments__AssociationDemo_InvoiceIDArray(@Root() associationdemoinvoice_: AssociationDemoInvoice_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Payments__AssociationDemo', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwPayments__AssociationDemo')} WHERE ${provider.QuoteIdentifier('InvoiceID')}='${associationdemoinvoice_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Payments__AssociationDemo', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Payments__AssociationDemo', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoInvoiceLineItem_])
    async AssociationDemoInvoiceLineItems_InvoiceIDArray(@Root() associationdemoinvoice_: AssociationDemoInvoice_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Invoice Line Items', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwInvoiceLineItems')} WHERE ${provider.QuoteIdentifier('InvoiceID')}='${associationdemoinvoice_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Invoice Line Items', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Invoice Line Items', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoInvoice_)
    async CreateAssociationDemoInvoice(
        @Arg('input', () => CreateAssociationDemoInvoiceInput) input: CreateAssociationDemoInvoiceInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Invoices', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoInvoice_)
    async UpdateAssociationDemoInvoice(
        @Arg('input', () => UpdateAssociationDemoInvoiceInput) input: UpdateAssociationDemoInvoiceInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Invoices', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoInvoice_)
    async DeleteAssociationDemoInvoice(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Invoices', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Legislative Bodies
//****************************************************************************
@ObjectType()
export class AssociationDemoLegislativeBody_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(255)
    Name: string;
        
    @Field() 
    @MaxLength(50)
    BodyType: string;
        
    @Field() 
    @MaxLength(20)
    Level: string;
        
    @Field({nullable: true}) 
    @MaxLength(2)
    State?: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    Country?: string;
        
    @Field({nullable: true}) 
    Description?: string;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    Website?: string;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    SessionSchedule?: string;
        
    @Field(() => Boolean, {nullable: true}) 
    IsActive?: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field(() => [AssociationDemoGovernmentContact_])
    AssociationDemoGovernmentContacts_LegislativeBodyIDArray: AssociationDemoGovernmentContact_[]; // Link to AssociationDemoGovernmentContacts
    
    @Field(() => [AssociationDemoLegislativeIssue_])
    AssociationDemoLegislativeIssues_LegislativeBodyIDArray: AssociationDemoLegislativeIssue_[]; // Link to AssociationDemoLegislativeIssues
    
}

//****************************************************************************
// INPUT TYPE for Legislative Bodies
//****************************************************************************
@InputType()
export class CreateAssociationDemoLegislativeBodyInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    BodyType?: string;

    @Field({ nullable: true })
    Level?: string;

    @Field({ nullable: true })
    State: string | null;

    @Field({ nullable: true })
    Country?: string | null;

    @Field({ nullable: true })
    Description: string | null;

    @Field({ nullable: true })
    Website: string | null;

    @Field({ nullable: true })
    SessionSchedule: string | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Legislative Bodies
//****************************************************************************
@InputType()
export class UpdateAssociationDemoLegislativeBodyInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    BodyType?: string;

    @Field({ nullable: true })
    Level?: string;

    @Field({ nullable: true })
    State?: string | null;

    @Field({ nullable: true })
    Country?: string | null;

    @Field({ nullable: true })
    Description?: string | null;

    @Field({ nullable: true })
    Website?: string | null;

    @Field({ nullable: true })
    SessionSchedule?: string | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Legislative Bodies
//****************************************************************************
@ObjectType()
export class RunAssociationDemoLegislativeBodyViewResult {
    @Field(() => [AssociationDemoLegislativeBody_])
    Results: AssociationDemoLegislativeBody_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoLegislativeBody_)
export class AssociationDemoLegislativeBodyResolver extends ResolverBase {
    @Query(() => RunAssociationDemoLegislativeBodyViewResult)
    async RunAssociationDemoLegislativeBodyViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoLegislativeBodyViewResult)
    async RunAssociationDemoLegislativeBodyViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoLegislativeBodyViewResult)
    async RunAssociationDemoLegislativeBodyDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Legislative Bodies';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoLegislativeBody_, { nullable: true })
    async AssociationDemoLegislativeBody(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoLegislativeBody_ | null> {
        this.CheckUserReadPermissions('Legislative Bodies', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwLegislativeBodies')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Legislative Bodies', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Legislative Bodies', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoGovernmentContact_])
    async AssociationDemoGovernmentContacts_LegislativeBodyIDArray(@Root() associationdemolegislativebody_: AssociationDemoLegislativeBody_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Government Contacts', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwGovernmentContacts')} WHERE ${provider.QuoteIdentifier('LegislativeBodyID')}='${associationdemolegislativebody_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Government Contacts', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Government Contacts', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoLegislativeIssue_])
    async AssociationDemoLegislativeIssues_LegislativeBodyIDArray(@Root() associationdemolegislativebody_: AssociationDemoLegislativeBody_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Legislative Issues', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwLegislativeIssues')} WHERE ${provider.QuoteIdentifier('LegislativeBodyID')}='${associationdemolegislativebody_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Legislative Issues', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Legislative Issues', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoLegislativeBody_)
    async CreateAssociationDemoLegislativeBody(
        @Arg('input', () => CreateAssociationDemoLegislativeBodyInput) input: CreateAssociationDemoLegislativeBodyInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Legislative Bodies', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoLegislativeBody_)
    async UpdateAssociationDemoLegislativeBody(
        @Arg('input', () => UpdateAssociationDemoLegislativeBodyInput) input: UpdateAssociationDemoLegislativeBodyInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Legislative Bodies', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoLegislativeBody_)
    async DeleteAssociationDemoLegislativeBody(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Legislative Bodies', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Legislative Issues
//****************************************************************************
@ObjectType()
export class AssociationDemoLegislativeIssue_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    LegislativeBodyID: string;
        
    @Field() 
    @MaxLength(500)
    Title: string;
        
    @Field() 
    @MaxLength(50)
    IssueType: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    BillNumber?: string;
        
    @Field() 
    @MaxLength(50)
    Status: string;
        
    @Field({nullable: true}) 
    IntroducedDate?: Date;
        
    @Field({nullable: true}) 
    LastActionDate?: Date;
        
    @Field({nullable: true}) 
    EffectiveDate?: Date;
        
    @Field({nullable: true}) 
    Summary?: string;
        
    @Field({nullable: true}) 
    @MaxLength(20)
    ImpactLevel?: string;
        
    @Field({nullable: true}) 
    ImpactDescription?: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    Category?: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    Sponsor?: string;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    TrackingURL?: string;
        
    @Field(() => Boolean, {nullable: true}) 
    IsActive?: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(255)
    LegislativeBody: string;
        
    @Field(() => [AssociationDemoPolicyPosition_])
    AssociationDemoPolicyPositions_LegislativeIssueIDArray: AssociationDemoPolicyPosition_[]; // Link to AssociationDemoPolicyPositions
    
    @Field(() => [AssociationDemoAdvocacyAction_])
    AssociationDemoAdvocacyActions_LegislativeIssueIDArray: AssociationDemoAdvocacyAction_[]; // Link to AssociationDemoAdvocacyActions
    
    @Field(() => [AssociationDemoRegulatoryComment_])
    AssociationDemoRegulatoryComments_LegislativeIssueIDArray: AssociationDemoRegulatoryComment_[]; // Link to AssociationDemoRegulatoryComments
    
}

//****************************************************************************
// INPUT TYPE for Legislative Issues
//****************************************************************************
@InputType()
export class CreateAssociationDemoLegislativeIssueInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    LegislativeBodyID?: string;

    @Field({ nullable: true })
    Title?: string;

    @Field({ nullable: true })
    IssueType?: string;

    @Field({ nullable: true })
    BillNumber: string | null;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    IntroducedDate: Date | null;

    @Field({ nullable: true })
    LastActionDate: Date | null;

    @Field({ nullable: true })
    EffectiveDate: Date | null;

    @Field({ nullable: true })
    Summary: string | null;

    @Field({ nullable: true })
    ImpactLevel: string | null;

    @Field({ nullable: true })
    ImpactDescription: string | null;

    @Field({ nullable: true })
    Category: string | null;

    @Field({ nullable: true })
    Sponsor: string | null;

    @Field({ nullable: true })
    TrackingURL: string | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Legislative Issues
//****************************************************************************
@InputType()
export class UpdateAssociationDemoLegislativeIssueInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    LegislativeBodyID?: string;

    @Field({ nullable: true })
    Title?: string;

    @Field({ nullable: true })
    IssueType?: string;

    @Field({ nullable: true })
    BillNumber?: string | null;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    IntroducedDate?: Date | null;

    @Field({ nullable: true })
    LastActionDate?: Date | null;

    @Field({ nullable: true })
    EffectiveDate?: Date | null;

    @Field({ nullable: true })
    Summary?: string | null;

    @Field({ nullable: true })
    ImpactLevel?: string | null;

    @Field({ nullable: true })
    ImpactDescription?: string | null;

    @Field({ nullable: true })
    Category?: string | null;

    @Field({ nullable: true })
    Sponsor?: string | null;

    @Field({ nullable: true })
    TrackingURL?: string | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Legislative Issues
//****************************************************************************
@ObjectType()
export class RunAssociationDemoLegislativeIssueViewResult {
    @Field(() => [AssociationDemoLegislativeIssue_])
    Results: AssociationDemoLegislativeIssue_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoLegislativeIssue_)
export class AssociationDemoLegislativeIssueResolver extends ResolverBase {
    @Query(() => RunAssociationDemoLegislativeIssueViewResult)
    async RunAssociationDemoLegislativeIssueViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoLegislativeIssueViewResult)
    async RunAssociationDemoLegislativeIssueViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoLegislativeIssueViewResult)
    async RunAssociationDemoLegislativeIssueDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Legislative Issues';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoLegislativeIssue_, { nullable: true })
    async AssociationDemoLegislativeIssue(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoLegislativeIssue_ | null> {
        this.CheckUserReadPermissions('Legislative Issues', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwLegislativeIssues')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Legislative Issues', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Legislative Issues', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoPolicyPosition_])
    async AssociationDemoPolicyPositions_LegislativeIssueIDArray(@Root() associationdemolegislativeissue_: AssociationDemoLegislativeIssue_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Policy Positions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwPolicyPositions')} WHERE ${provider.QuoteIdentifier('LegislativeIssueID')}='${associationdemolegislativeissue_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Policy Positions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Policy Positions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoAdvocacyAction_])
    async AssociationDemoAdvocacyActions_LegislativeIssueIDArray(@Root() associationdemolegislativeissue_: AssociationDemoLegislativeIssue_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Advocacy Actions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwAdvocacyActions')} WHERE ${provider.QuoteIdentifier('LegislativeIssueID')}='${associationdemolegislativeissue_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Advocacy Actions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Advocacy Actions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoRegulatoryComment_])
    async AssociationDemoRegulatoryComments_LegislativeIssueIDArray(@Root() associationdemolegislativeissue_: AssociationDemoLegislativeIssue_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Regulatory Comments', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwRegulatoryComments')} WHERE ${provider.QuoteIdentifier('LegislativeIssueID')}='${associationdemolegislativeissue_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Regulatory Comments', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Regulatory Comments', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoLegislativeIssue_)
    async CreateAssociationDemoLegislativeIssue(
        @Arg('input', () => CreateAssociationDemoLegislativeIssueInput) input: CreateAssociationDemoLegislativeIssueInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Legislative Issues', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoLegislativeIssue_)
    async UpdateAssociationDemoLegislativeIssue(
        @Arg('input', () => UpdateAssociationDemoLegislativeIssueInput) input: UpdateAssociationDemoLegislativeIssueInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Legislative Issues', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoLegislativeIssue_)
    async DeleteAssociationDemoLegislativeIssue(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Legislative Issues', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Member Follows
//****************************************************************************
@ObjectType()
export class AssociationDemoMemberFollow_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    FollowerID: string;
        
    @Field() 
    @MaxLength(50)
    FollowType: string;
        
    @Field() 
    @MaxLength(36)
    FollowedEntityID: string;
        
    @Field() 
    CreatedDate: Date;
        
    @Field(() => Boolean, {nullable: true}) 
    NotifyOnActivity?: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
}

//****************************************************************************
// INPUT TYPE for Member Follows
//****************************************************************************
@InputType()
export class CreateAssociationDemoMemberFollowInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    FollowerID?: string;

    @Field({ nullable: true })
    FollowType?: string;

    @Field({ nullable: true })
    FollowedEntityID?: string;

    @Field({ nullable: true })
    CreatedDate?: Date;

    @Field(() => Boolean, { nullable: true })
    NotifyOnActivity?: boolean | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Member Follows
//****************************************************************************
@InputType()
export class UpdateAssociationDemoMemberFollowInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    FollowerID?: string;

    @Field({ nullable: true })
    FollowType?: string;

    @Field({ nullable: true })
    FollowedEntityID?: string;

    @Field({ nullable: true })
    CreatedDate?: Date;

    @Field(() => Boolean, { nullable: true })
    NotifyOnActivity?: boolean | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Member Follows
//****************************************************************************
@ObjectType()
export class RunAssociationDemoMemberFollowViewResult {
    @Field(() => [AssociationDemoMemberFollow_])
    Results: AssociationDemoMemberFollow_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoMemberFollow_)
export class AssociationDemoMemberFollowResolver extends ResolverBase {
    @Query(() => RunAssociationDemoMemberFollowViewResult)
    async RunAssociationDemoMemberFollowViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoMemberFollowViewResult)
    async RunAssociationDemoMemberFollowViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoMemberFollowViewResult)
    async RunAssociationDemoMemberFollowDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Member Follows';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoMemberFollow_, { nullable: true })
    async AssociationDemoMemberFollow(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoMemberFollow_ | null> {
        this.CheckUserReadPermissions('Member Follows', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwMemberFollows')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Member Follows', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Member Follows', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoMemberFollow_)
    async CreateAssociationDemoMemberFollow(
        @Arg('input', () => CreateAssociationDemoMemberFollowInput) input: CreateAssociationDemoMemberFollowInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Member Follows', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoMemberFollow_)
    async UpdateAssociationDemoMemberFollow(
        @Arg('input', () => UpdateAssociationDemoMemberFollowInput) input: UpdateAssociationDemoMemberFollowInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Member Follows', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoMemberFollow_)
    async DeleteAssociationDemoMemberFollow(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Member Follows', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Members
//****************************************************************************
@ObjectType()
export class membershipMember_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(100)
    FirstName: string;
        
    @Field() 
    @MaxLength(100)
    LastName: string;
        
    @Field() 
    @MaxLength(255)
    Email: string;
        
    @Field() 
    @MaxLength(50)
    MembershipType: string;
        
    @Field() 
    @MaxLength(50)
    Status: string;
        
    @Field() 
    JoinDate: Date;
        
    @Field({nullable: true}) 
    RenewalDate?: Date;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    ChapterRegion?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field(() => [membershipEmailEngagement_])
    membershipEmailEngagements_MemberIDArray: membershipEmailEngagement_[]; // Link to membershipEmailEngagements
    
    @Field(() => [membershipPayment_])
    membershipPayments_MemberIDArray: membershipPayment_[]; // Link to membershipPayments
    
    @Field(() => [membershipEventRegistration_])
    membershipEventRegistrations_MemberIDArray: membershipEventRegistration_[]; // Link to membershipEventRegistrations
    
    @Field(() => [membershipCertification_])
    membershipCertifications_MemberIDArray: membershipCertification_[]; // Link to membershipCertifications
    
}

//****************************************************************************
// INPUT TYPE for Members
//****************************************************************************
@InputType()
export class CreatemembershipMemberInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    FirstName?: string;

    @Field({ nullable: true })
    LastName?: string;

    @Field({ nullable: true })
    Email?: string;

    @Field({ nullable: true })
    MembershipType?: string;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    JoinDate?: Date;

    @Field({ nullable: true })
    RenewalDate: Date | null;

    @Field({ nullable: true })
    ChapterRegion: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Members
//****************************************************************************
@InputType()
export class UpdatemembershipMemberInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    FirstName?: string;

    @Field({ nullable: true })
    LastName?: string;

    @Field({ nullable: true })
    Email?: string;

    @Field({ nullable: true })
    MembershipType?: string;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    JoinDate?: Date;

    @Field({ nullable: true })
    RenewalDate?: Date | null;

    @Field({ nullable: true })
    ChapterRegion?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Members
//****************************************************************************
@ObjectType()
export class RunmembershipMemberViewResult {
    @Field(() => [membershipMember_])
    Results: membershipMember_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(membershipMember_)
export class membershipMemberResolver extends ResolverBase {
    @Query(() => RunmembershipMemberViewResult)
    async RunmembershipMemberViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmembershipMemberViewResult)
    async RunmembershipMemberViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmembershipMemberViewResult)
    async RunmembershipMemberDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Members';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => membershipMember_, { nullable: true })
    async membershipMember(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<membershipMember_ | null> {
        this.CheckUserReadPermissions('Members', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('membership', 'vwMembers')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Members', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Members', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [membershipEmailEngagement_])
    async membershipEmailEngagements_MemberIDArray(@Root() membershipmember_: membershipMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Email Engagements', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('membership', 'vwEmailEngagements')} WHERE ${provider.QuoteIdentifier('MemberID')}='${membershipmember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Email Engagements', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Email Engagements', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [membershipPayment_])
    async membershipPayments_MemberIDArray(@Root() membershipmember_: membershipMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Payments', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('membership', 'vwPayments')} WHERE ${provider.QuoteIdentifier('MemberID')}='${membershipmember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Payments', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Payments', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [membershipEventRegistration_])
    async membershipEventRegistrations_MemberIDArray(@Root() membershipmember_: membershipMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Event Registrations', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('membership', 'vwEventRegistrations')} WHERE ${provider.QuoteIdentifier('MemberID')}='${membershipmember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Event Registrations', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Event Registrations', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [membershipCertification_])
    async membershipCertifications_MemberIDArray(@Root() membershipmember_: membershipMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Certifications', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('membership', 'vwCertifications')} WHERE ${provider.QuoteIdentifier('MemberID')}='${membershipmember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Certifications', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Certifications', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => membershipMember_)
    async CreatemembershipMember(
        @Arg('input', () => CreatemembershipMemberInput) input: CreatemembershipMemberInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Members', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => membershipMember_)
    async UpdatemembershipMember(
        @Arg('input', () => UpdatemembershipMemberInput) input: UpdatemembershipMemberInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Members', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => membershipMember_)
    async DeletemembershipMember(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Members', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Members__AssociationDemo
//****************************************************************************
@ObjectType()
export class AssociationDemoMember_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(255)
    Email: string;
        
    @Field() 
    @MaxLength(100)
    FirstName: string;
        
    @Field() 
    @MaxLength(100)
    LastName: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    Title?: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    OrganizationID?: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    Industry?: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    JobFunction?: string;
        
    @Field(() => Int, {nullable: true}) 
    YearsInProfession?: number;
        
    @Field() 
    JoinDate: Date;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    LinkedInURL?: string;
        
    @Field({nullable: true}) 
    Bio?: string;
        
    @Field({nullable: true}) 
    @MaxLength(10)
    PreferredLanguage?: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    Timezone?: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    Phone?: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    Mobile?: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    City?: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    State?: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    Country?: string;
        
    @Field({nullable: true}) 
    @MaxLength(20)
    PostalCode?: string;
        
    @Field(() => Int, {nullable: true}) 
    EngagementScore?: number;
        
    @Field({nullable: true}) 
    LastActivityDate?: Date;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    ProfilePhotoURL?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    Organization?: string;
        
    @Field(() => [AssociationDemoResourceDownload_])
    AssociationDemoResourceDownloads_MemberIDArray: AssociationDemoResourceDownload_[]; // Link to AssociationDemoResourceDownloads
    
    @Field(() => [AssociationDemoAdvocacyAction_])
    AssociationDemoAdvocacyActions_MemberIDArray: AssociationDemoAdvocacyAction_[]; // Link to AssociationDemoAdvocacyActions
    
    @Field(() => [AssociationDemoResourceVersion_])
    AssociationDemoResourceVersions_CreatedByIDArray: AssociationDemoResourceVersion_[]; // Link to AssociationDemoResourceVersions
    
    @Field(() => [AssociationDemoMemberFollow_])
    AssociationDemoMemberFollows_FollowerIDArray: AssociationDemoMemberFollow_[]; // Link to AssociationDemoMemberFollows
    
    @Field(() => [AssociationDemoInvoice_])
    AssociationDemoInvoices_MemberIDArray: AssociationDemoInvoice_[]; // Link to AssociationDemoInvoices
    
    @Field(() => [AssociationDemoChapterOfficer_])
    AssociationDemoChapterOfficers_MemberIDArray: AssociationDemoChapterOfficer_[]; // Link to AssociationDemoChapterOfficers
    
    @Field(() => [AssociationDemoCampaignMember_])
    AssociationDemoCampaignMembers_MemberIDArray: AssociationDemoCampaignMember_[]; // Link to AssociationDemoCampaignMembers
    
    @Field(() => [AssociationDemoMembership_])
    AssociationDemoMemberships_MemberIDArray: AssociationDemoMembership_[]; // Link to AssociationDemoMemberships
    
    @Field(() => [AssociationDemoForumThread_])
    AssociationDemoForumThreads_AuthorIDArray: AssociationDemoForumThread_[]; // Link to AssociationDemoForumThreads
    
    @Field(() => [AssociationDemoForumThread_])
    AssociationDemoForumThreads_LastReplyAuthorIDArray: AssociationDemoForumThread_[]; // Link to AssociationDemoForumThreads
    
    @Field(() => [AssociationDemoEventRegistration_])
    AssociationDemoEventRegistrations__AssociationDemo_MemberIDArray: AssociationDemoEventRegistration_[]; // Link to AssociationDemoEventRegistrations__AssociationDemo
    
    @Field(() => [AssociationDemoEnrollment_])
    AssociationDemoEnrollments_MemberIDArray: AssociationDemoEnrollment_[]; // Link to AssociationDemoEnrollments
    
    @Field(() => [AssociationDemoResource_])
    AssociationDemoResources_AuthorIDArray: AssociationDemoResource_[]; // Link to AssociationDemoResources
    
    @Field(() => [AssociationDemoChapterMembership_])
    AssociationDemoChapterMemberships_MemberIDArray: AssociationDemoChapterMembership_[]; // Link to AssociationDemoChapterMemberships
    
    @Field(() => [AssociationDemoResourceRating_])
    AssociationDemoResourceRatings_MemberIDArray: AssociationDemoResourceRating_[]; // Link to AssociationDemoResourceRatings
    
    @Field(() => [AssociationDemoContinuingEducation_])
    AssociationDemoContinuingEducations_MemberIDArray: AssociationDemoContinuingEducation_[]; // Link to AssociationDemoContinuingEducations
    
    @Field(() => [AssociationDemoCommittee_])
    AssociationDemoCommittees_ChairMemberIDArray: AssociationDemoCommittee_[]; // Link to AssociationDemoCommittees
    
    @Field(() => [AssociationDemoPostReaction_])
    AssociationDemoPostReactions_MemberIDArray: AssociationDemoPostReaction_[]; // Link to AssociationDemoPostReactions
    
    @Field(() => [AssociationDemoPostAttachment_])
    AssociationDemoPostAttachments_UploadedByIDArray: AssociationDemoPostAttachment_[]; // Link to AssociationDemoPostAttachments
    
    @Field(() => [AssociationDemoProduct_])
    AssociationDemoProducts_MemberIDArray: AssociationDemoProduct_[]; // Link to AssociationDemoProducts
    
    @Field(() => [AssociationDemoForumPost_])
    AssociationDemoForumPosts_EditedByIDArray: AssociationDemoForumPost_[]; // Link to AssociationDemoForumPosts
    
    @Field(() => [AssociationDemoForumPost_])
    AssociationDemoForumPosts_AuthorIDArray: AssociationDemoForumPost_[]; // Link to AssociationDemoForumPosts
    
    @Field(() => [AssociationDemoCertification_])
    AssociationDemoCertifications__AssociationDemo_MemberIDArray: AssociationDemoCertification_[]; // Link to AssociationDemoCertifications__AssociationDemo
    
    @Field(() => [AssociationDemoCompetitionJudge_])
    AssociationDemoCompetitionJudges_MemberIDArray: AssociationDemoCompetitionJudge_[]; // Link to AssociationDemoCompetitionJudges
    
    @Field(() => [AssociationDemoBoardMember_])
    AssociationDemoBoardMembers_MemberIDArray: AssociationDemoBoardMember_[]; // Link to AssociationDemoBoardMembers
    
    @Field(() => [AssociationDemoForumModeration_])
    AssociationDemoForumModerations_ModeratedByIDArray: AssociationDemoForumModeration_[]; // Link to AssociationDemoForumModerations
    
    @Field(() => [AssociationDemoForumModeration_])
    AssociationDemoForumModerations_ReportedByIDArray: AssociationDemoForumModeration_[]; // Link to AssociationDemoForumModerations
    
    @Field(() => [AssociationDemoCommitteeMembership_])
    AssociationDemoCommitteeMemberships_MemberIDArray: AssociationDemoCommitteeMembership_[]; // Link to AssociationDemoCommitteeMemberships
    
    @Field(() => [AssociationDemoForumCategory_])
    AssociationDemoForumCategories_LastPostAuthorIDArray: AssociationDemoForumCategory_[]; // Link to AssociationDemoForumCategories
    
    @Field(() => [AssociationDemoEmailSend_])
    AssociationDemoEmailSends_MemberIDArray: AssociationDemoEmailSend_[]; // Link to AssociationDemoEmailSends
    
}

//****************************************************************************
// INPUT TYPE for Members__AssociationDemo
//****************************************************************************
@InputType()
export class CreateAssociationDemoMemberInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    Email?: string;

    @Field({ nullable: true })
    FirstName?: string;

    @Field({ nullable: true })
    LastName?: string;

    @Field({ nullable: true })
    Title: string | null;

    @Field({ nullable: true })
    OrganizationID: string | null;

    @Field({ nullable: true })
    Industry: string | null;

    @Field({ nullable: true })
    JobFunction: string | null;

    @Field(() => Int, { nullable: true })
    YearsInProfession: number | null;

    @Field({ nullable: true })
    JoinDate?: Date;

    @Field({ nullable: true })
    LinkedInURL: string | null;

    @Field({ nullable: true })
    Bio: string | null;

    @Field({ nullable: true })
    PreferredLanguage?: string | null;

    @Field({ nullable: true })
    Timezone: string | null;

    @Field({ nullable: true })
    Phone: string | null;

    @Field({ nullable: true })
    Mobile: string | null;

    @Field({ nullable: true })
    City: string | null;

    @Field({ nullable: true })
    State: string | null;

    @Field({ nullable: true })
    Country?: string | null;

    @Field({ nullable: true })
    PostalCode: string | null;

    @Field(() => Int, { nullable: true })
    EngagementScore?: number | null;

    @Field({ nullable: true })
    LastActivityDate: Date | null;

    @Field({ nullable: true })
    ProfilePhotoURL: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Members__AssociationDemo
//****************************************************************************
@InputType()
export class UpdateAssociationDemoMemberInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    Email?: string;

    @Field({ nullable: true })
    FirstName?: string;

    @Field({ nullable: true })
    LastName?: string;

    @Field({ nullable: true })
    Title?: string | null;

    @Field({ nullable: true })
    OrganizationID?: string | null;

    @Field({ nullable: true })
    Industry?: string | null;

    @Field({ nullable: true })
    JobFunction?: string | null;

    @Field(() => Int, { nullable: true })
    YearsInProfession?: number | null;

    @Field({ nullable: true })
    JoinDate?: Date;

    @Field({ nullable: true })
    LinkedInURL?: string | null;

    @Field({ nullable: true })
    Bio?: string | null;

    @Field({ nullable: true })
    PreferredLanguage?: string | null;

    @Field({ nullable: true })
    Timezone?: string | null;

    @Field({ nullable: true })
    Phone?: string | null;

    @Field({ nullable: true })
    Mobile?: string | null;

    @Field({ nullable: true })
    City?: string | null;

    @Field({ nullable: true })
    State?: string | null;

    @Field({ nullable: true })
    Country?: string | null;

    @Field({ nullable: true })
    PostalCode?: string | null;

    @Field(() => Int, { nullable: true })
    EngagementScore?: number | null;

    @Field({ nullable: true })
    LastActivityDate?: Date | null;

    @Field({ nullable: true })
    ProfilePhotoURL?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Members__AssociationDemo
//****************************************************************************
@ObjectType()
export class RunAssociationDemoMemberViewResult {
    @Field(() => [AssociationDemoMember_])
    Results: AssociationDemoMember_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoMember_)
export class AssociationDemoMemberResolver extends ResolverBase {
    @Query(() => RunAssociationDemoMemberViewResult)
    async RunAssociationDemoMemberViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoMemberViewResult)
    async RunAssociationDemoMemberViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoMemberViewResult)
    async RunAssociationDemoMemberDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Members__AssociationDemo';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoMember_, { nullable: true })
    async AssociationDemoMember(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoMember_ | null> {
        this.CheckUserReadPermissions('Members__AssociationDemo', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwMembers__AssociationDemo')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Members__AssociationDemo', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Members__AssociationDemo', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoResourceDownload_])
    async AssociationDemoResourceDownloads_MemberIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Resource Downloads', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwResourceDownloads')} WHERE ${provider.QuoteIdentifier('MemberID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Resource Downloads', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Resource Downloads', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoAdvocacyAction_])
    async AssociationDemoAdvocacyActions_MemberIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Advocacy Actions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwAdvocacyActions')} WHERE ${provider.QuoteIdentifier('MemberID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Advocacy Actions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Advocacy Actions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoResourceVersion_])
    async AssociationDemoResourceVersions_CreatedByIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Resource Versions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwResourceVersions')} WHERE ${provider.QuoteIdentifier('CreatedByID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Resource Versions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Resource Versions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoMemberFollow_])
    async AssociationDemoMemberFollows_FollowerIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Member Follows', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwMemberFollows')} WHERE ${provider.QuoteIdentifier('FollowerID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Member Follows', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Member Follows', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoInvoice_])
    async AssociationDemoInvoices_MemberIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Invoices', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwInvoices')} WHERE ${provider.QuoteIdentifier('MemberID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Invoices', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Invoices', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoChapterOfficer_])
    async AssociationDemoChapterOfficers_MemberIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Chapter Officers', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwChapterOfficers')} WHERE ${provider.QuoteIdentifier('MemberID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Chapter Officers', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Chapter Officers', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoCampaignMember_])
    async AssociationDemoCampaignMembers_MemberIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Campaign Members', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCampaignMembers')} WHERE ${provider.QuoteIdentifier('MemberID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Campaign Members', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Campaign Members', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoMembership_])
    async AssociationDemoMemberships_MemberIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Memberships', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwMemberships')} WHERE ${provider.QuoteIdentifier('MemberID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Memberships', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Memberships', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoForumThread_])
    async AssociationDemoForumThreads_AuthorIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Forum Threads', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwForumThreads')} WHERE ${provider.QuoteIdentifier('AuthorID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Forum Threads', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Forum Threads', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoForumThread_])
    async AssociationDemoForumThreads_LastReplyAuthorIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Forum Threads', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwForumThreads')} WHERE ${provider.QuoteIdentifier('LastReplyAuthorID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Forum Threads', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Forum Threads', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoEventRegistration_])
    async AssociationDemoEventRegistrations__AssociationDemo_MemberIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Event Registrations__AssociationDemo', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwEventRegistrations__AssociationDemo')} WHERE ${provider.QuoteIdentifier('MemberID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Event Registrations__AssociationDemo', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Event Registrations__AssociationDemo', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoEnrollment_])
    async AssociationDemoEnrollments_MemberIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Enrollments', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwEnrollments')} WHERE ${provider.QuoteIdentifier('MemberID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Enrollments', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Enrollments', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoResource_])
    async AssociationDemoResources_AuthorIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Resources', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwResources')} WHERE ${provider.QuoteIdentifier('AuthorID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Resources', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Resources', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoChapterMembership_])
    async AssociationDemoChapterMemberships_MemberIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Chapter Memberships', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwChapterMemberships')} WHERE ${provider.QuoteIdentifier('MemberID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Chapter Memberships', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Chapter Memberships', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoResourceRating_])
    async AssociationDemoResourceRatings_MemberIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Resource Ratings', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwResourceRatings')} WHERE ${provider.QuoteIdentifier('MemberID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Resource Ratings', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Resource Ratings', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoContinuingEducation_])
    async AssociationDemoContinuingEducations_MemberIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Continuing Educations', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwContinuingEducations')} WHERE ${provider.QuoteIdentifier('MemberID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Continuing Educations', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Continuing Educations', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoCommittee_])
    async AssociationDemoCommittees_ChairMemberIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Committees', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCommittees')} WHERE ${provider.QuoteIdentifier('ChairMemberID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Committees', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Committees', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoPostReaction_])
    async AssociationDemoPostReactions_MemberIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Post Reactions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwPostReactions')} WHERE ${provider.QuoteIdentifier('MemberID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Post Reactions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Post Reactions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoPostAttachment_])
    async AssociationDemoPostAttachments_UploadedByIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Post Attachments', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwPostAttachments')} WHERE ${provider.QuoteIdentifier('UploadedByID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Post Attachments', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Post Attachments', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoProduct_])
    async AssociationDemoProducts_MemberIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Products', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwProducts')} WHERE ${provider.QuoteIdentifier('MemberID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Products', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Products', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoForumPost_])
    async AssociationDemoForumPosts_EditedByIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Forum Posts', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwForumPosts')} WHERE ${provider.QuoteIdentifier('EditedByID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Forum Posts', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Forum Posts', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoForumPost_])
    async AssociationDemoForumPosts_AuthorIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Forum Posts', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwForumPosts')} WHERE ${provider.QuoteIdentifier('AuthorID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Forum Posts', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Forum Posts', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoCertification_])
    async AssociationDemoCertifications__AssociationDemo_MemberIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Certifications__AssociationDemo', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCertifications__AssociationDemo')} WHERE ${provider.QuoteIdentifier('MemberID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Certifications__AssociationDemo', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Certifications__AssociationDemo', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoCompetitionJudge_])
    async AssociationDemoCompetitionJudges_MemberIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Competition Judges', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCompetitionJudges')} WHERE ${provider.QuoteIdentifier('MemberID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Competition Judges', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Competition Judges', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoBoardMember_])
    async AssociationDemoBoardMembers_MemberIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Board Members', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwBoardMembers')} WHERE ${provider.QuoteIdentifier('MemberID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Board Members', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Board Members', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoForumModeration_])
    async AssociationDemoForumModerations_ModeratedByIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Forum Moderations', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwForumModerations')} WHERE ${provider.QuoteIdentifier('ModeratedByID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Forum Moderations', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Forum Moderations', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoForumModeration_])
    async AssociationDemoForumModerations_ReportedByIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Forum Moderations', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwForumModerations')} WHERE ${provider.QuoteIdentifier('ReportedByID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Forum Moderations', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Forum Moderations', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoCommitteeMembership_])
    async AssociationDemoCommitteeMemberships_MemberIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Committee Memberships', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCommitteeMemberships')} WHERE ${provider.QuoteIdentifier('MemberID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Committee Memberships', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Committee Memberships', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoForumCategory_])
    async AssociationDemoForumCategories_LastPostAuthorIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Forum Categories', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwForumCategories')} WHERE ${provider.QuoteIdentifier('LastPostAuthorID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Forum Categories', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Forum Categories', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoEmailSend_])
    async AssociationDemoEmailSends_MemberIDArray(@Root() associationdemomember_: AssociationDemoMember_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Email Sends', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwEmailSends')} WHERE ${provider.QuoteIdentifier('MemberID')}='${associationdemomember_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Email Sends', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Email Sends', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoMember_)
    async CreateAssociationDemoMember(
        @Arg('input', () => CreateAssociationDemoMemberInput) input: CreateAssociationDemoMemberInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Members__AssociationDemo', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoMember_)
    async UpdateAssociationDemoMember(
        @Arg('input', () => UpdateAssociationDemoMemberInput) input: UpdateAssociationDemoMemberInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Members__AssociationDemo', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoMember_)
    async DeleteAssociationDemoMember(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Members__AssociationDemo', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Membership Types
//****************************************************************************
@ObjectType()
export class AssociationDemoMembershipType_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(100)
    Name: string;
        
    @Field({nullable: true}) 
    Description?: string;
        
    @Field(() => Float) 
    AnnualDues: number;
        
    @Field(() => Int) 
    RenewalPeriodMonths: number;
        
    @Field(() => Boolean) 
    IsActive: boolean;
        
    @Field(() => Boolean) 
    AllowAutoRenew: boolean;
        
    @Field(() => Boolean) 
    RequiresApproval: boolean;
        
    @Field({nullable: true}) 
    Benefits?: string;
        
    @Field(() => Int, {nullable: true}) 
    DisplayOrder?: number;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field(() => [AssociationDemoMembership_])
    AssociationDemoMemberships_MembershipTypeIDArray: AssociationDemoMembership_[]; // Link to AssociationDemoMemberships
    
}

//****************************************************************************
// INPUT TYPE for Membership Types
//****************************************************************************
@InputType()
export class CreateAssociationDemoMembershipTypeInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Description: string | null;

    @Field(() => Float, { nullable: true })
    AnnualDues?: number;

    @Field(() => Int, { nullable: true })
    RenewalPeriodMonths?: number;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean;

    @Field(() => Boolean, { nullable: true })
    AllowAutoRenew?: boolean;

    @Field(() => Boolean, { nullable: true })
    RequiresApproval?: boolean;

    @Field({ nullable: true })
    Benefits: string | null;

    @Field(() => Int, { nullable: true })
    DisplayOrder: number | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Membership Types
//****************************************************************************
@InputType()
export class UpdateAssociationDemoMembershipTypeInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Description?: string | null;

    @Field(() => Float, { nullable: true })
    AnnualDues?: number;

    @Field(() => Int, { nullable: true })
    RenewalPeriodMonths?: number;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean;

    @Field(() => Boolean, { nullable: true })
    AllowAutoRenew?: boolean;

    @Field(() => Boolean, { nullable: true })
    RequiresApproval?: boolean;

    @Field({ nullable: true })
    Benefits?: string | null;

    @Field(() => Int, { nullable: true })
    DisplayOrder?: number | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Membership Types
//****************************************************************************
@ObjectType()
export class RunAssociationDemoMembershipTypeViewResult {
    @Field(() => [AssociationDemoMembershipType_])
    Results: AssociationDemoMembershipType_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoMembershipType_)
export class AssociationDemoMembershipTypeResolver extends ResolverBase {
    @Query(() => RunAssociationDemoMembershipTypeViewResult)
    async RunAssociationDemoMembershipTypeViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoMembershipTypeViewResult)
    async RunAssociationDemoMembershipTypeViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoMembershipTypeViewResult)
    async RunAssociationDemoMembershipTypeDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Membership Types';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoMembershipType_, { nullable: true })
    async AssociationDemoMembershipType(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoMembershipType_ | null> {
        this.CheckUserReadPermissions('Membership Types', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwMembershipTypes')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Membership Types', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Membership Types', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoMembership_])
    async AssociationDemoMemberships_MembershipTypeIDArray(@Root() associationdemomembershiptype_: AssociationDemoMembershipType_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Memberships', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwMemberships')} WHERE ${provider.QuoteIdentifier('MembershipTypeID')}='${associationdemomembershiptype_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Memberships', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Memberships', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoMembershipType_)
    async CreateAssociationDemoMembershipType(
        @Arg('input', () => CreateAssociationDemoMembershipTypeInput) input: CreateAssociationDemoMembershipTypeInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Membership Types', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoMembershipType_)
    async UpdateAssociationDemoMembershipType(
        @Arg('input', () => UpdateAssociationDemoMembershipTypeInput) input: UpdateAssociationDemoMembershipTypeInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Membership Types', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoMembershipType_)
    async DeleteAssociationDemoMembershipType(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Membership Types', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Memberships
//****************************************************************************
@ObjectType()
export class AssociationDemoMembership_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    MemberID: string;
        
    @Field() 
    @MaxLength(36)
    MembershipTypeID: string;
        
    @Field() 
    @MaxLength(20)
    Status: string;
        
    @Field() 
    StartDate: Date;
        
    @Field() 
    EndDate: Date;
        
    @Field({nullable: true}) 
    RenewalDate?: Date;
        
    @Field(() => Boolean) 
    AutoRenew: boolean;
        
    @Field({nullable: true}) 
    CancellationDate?: Date;
        
    @Field({nullable: true}) 
    CancellationReason?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(100)
    MembershipType: string;
        
}

//****************************************************************************
// INPUT TYPE for Memberships
//****************************************************************************
@InputType()
export class CreateAssociationDemoMembershipInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    MembershipTypeID?: string;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    StartDate?: Date;

    @Field({ nullable: true })
    EndDate?: Date;

    @Field({ nullable: true })
    RenewalDate: Date | null;

    @Field(() => Boolean, { nullable: true })
    AutoRenew?: boolean;

    @Field({ nullable: true })
    CancellationDate: Date | null;

    @Field({ nullable: true })
    CancellationReason: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Memberships
//****************************************************************************
@InputType()
export class UpdateAssociationDemoMembershipInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    MembershipTypeID?: string;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    StartDate?: Date;

    @Field({ nullable: true })
    EndDate?: Date;

    @Field({ nullable: true })
    RenewalDate?: Date | null;

    @Field(() => Boolean, { nullable: true })
    AutoRenew?: boolean;

    @Field({ nullable: true })
    CancellationDate?: Date | null;

    @Field({ nullable: true })
    CancellationReason?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Memberships
//****************************************************************************
@ObjectType()
export class RunAssociationDemoMembershipViewResult {
    @Field(() => [AssociationDemoMembership_])
    Results: AssociationDemoMembership_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoMembership_)
export class AssociationDemoMembershipResolver extends ResolverBase {
    @Query(() => RunAssociationDemoMembershipViewResult)
    async RunAssociationDemoMembershipViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoMembershipViewResult)
    async RunAssociationDemoMembershipViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoMembershipViewResult)
    async RunAssociationDemoMembershipDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Memberships';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoMembership_, { nullable: true })
    async AssociationDemoMembership(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoMembership_ | null> {
        this.CheckUserReadPermissions('Memberships', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwMemberships')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Memberships', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Memberships', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoMembership_)
    async CreateAssociationDemoMembership(
        @Arg('input', () => CreateAssociationDemoMembershipInput) input: CreateAssociationDemoMembershipInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Memberships', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoMembership_)
    async UpdateAssociationDemoMembership(
        @Arg('input', () => UpdateAssociationDemoMembershipInput) input: UpdateAssociationDemoMembershipInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Memberships', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoMembership_)
    async DeleteAssociationDemoMembership(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Memberships', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MJ_BizApps_Sonar: Factors
//****************************************************************************
@ObjectType({ description: `A reusable signal definition that satisfies one uniform contract. Declarative factors compile to set-based SQL; ActionBacked factors wrap an MJ Action; DerivedFromScore factors consume another model\'s score.` })
export class mjBizAppsSonarFactor_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field({description: `Human-readable name of the factor.`}) 
    @MaxLength(200)
    Name: string;
        
    @Field({description: `Stable handle for the factor, referenced by the rubric and combine expressions.`}) 
    @MaxLength(100)
    Slug: string;
        
    @Field({nullable: true, description: `Optional description of the signal the factor measures.`}) 
    Description?: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    ScoreModelID?: string;
        
    @Field() 
    @MaxLength(36)
    AnchorEntityID: string;
        
    @Field({description: `Factor kind: Declarative, ActionBacked, DerivedFromScore, or Constant. The rubric engine never branches on this.`}) 
    @MaxLength(20)
    FactorType: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    SourceRelatedEntityID?: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    SourceEntityID?: string;
        
    @Field({nullable: true, description: `For declarative factors, the JSON/DSL filter applied to the source related entity (e.g. ActivityType IN (EmailOpen, EmailClick)).`}) 
    FilterExpression?: string;
        
    @Field({nullable: true, description: `Aggregation applied to the filtered source rows: Count, Sum, Avg, Min, Max, DistinctCount, Recency, RatePerPeriod, Exists, or TrendSlope.`}) 
    @MaxLength(20)
    Aggregation?: string;
        
    @Field({nullable: true, description: `Column on the source entity to sum or average; null for Count/Exists aggregations.`}) 
    @MaxLength(200)
    AggregateFieldName?: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    TimeWindowID?: string;
        
    @Field(() => Int, {nullable: true, description: `Optional half-life in days for recency-weighted aggregation.`}) 
    RecencyDecayHalfLifeDays?: number;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    ActionID?: string;
        
    @Field({nullable: true, description: `For ActionBacked factors, static parameters (JSON) bound to the Action at config time.`}) 
    ActionParamsJSON?: string;
        
    @Field({nullable: true, description: `Execution mode for ActionBacked factors: PerRecord or Batch.`}) 
    @MaxLength(12)
    ExecutionMode?: string;
        
    @Field(() => Boolean, {description: `Marks the factor as expensive to evaluate; surfaced in the builder and used for recompute budgeting.`}) 
    IsExpensive: boolean;
        
    @Field(() => Int, {nullable: true, description: `Optional maximum concurrency for evaluating an ActionBacked factor.`}) 
    MaxConcurrency?: number;
        
    @Field(() => Int, {nullable: true, description: `Optional rate limit per minute for external-API-backed Actions.`}) 
    RateLimitPerMinute?: number;
        
    @Field(() => Int, {nullable: true, description: `Result cache time-to-live in seconds, keyed by (anchor record, as-of date, params hash).`}) 
    CacheTTLSeconds?: number;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    SourceScoreModelID?: string;
        
    @Field({nullable: true, description: `Raw data type produced by the factor before normalization: Number, Date, Boolean, or Duration.`}) 
    @MaxLength(12)
    RawDataType?: string;
        
    @Field({nullable: true, description: `Normalization method mapping the raw value to a contribution: None, MinMax, Percentile, ZScore, Logistic, Banded, or Lookup.`}) 
    @MaxLength(20)
    NormalizationMethod?: string;
        
    @Field({nullable: true, description: `JSON parameters for the normalization method (clamps, percentile basis, logistic midpoint/steepness, banded thresholds, lookup table).`}) 
    NormalizationParamsJSON?: string;
        
    @Field(() => Float, {nullable: true, description: `Lower bound of the normalized contribution range (e.g. 0).`}) 
    OutputMin?: number;
        
    @Field(() => Float, {nullable: true, description: `Upper bound of the normalized contribution range (e.g. 1).`}) 
    OutputMax?: number;
        
    @Field(() => Boolean, {description: `Direction of the signal; when false, higher raw values are worse (e.g. days since last login).`}) 
    HigherIsBetter: boolean;
        
    @Field({nullable: true, description: `Governance state, enforced for ActionBacked factors before production use: Draft, InReview, Approved, or Deprecated.`}) 
    @MaxLength(20)
    PromotionState?: string;
        
    @Field({nullable: true, description: `UTC timestamp of the most recent validation of the factor.`}) 
    LastValidatedAt?: Date;
        
    @Field({nullable: true, description: `Name of the AI agent that created the factor, if any (e.g. ModelBuilderAgent, ActionBuilder).`}) 
    @MaxLength(60)
    CreatedByAgent?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field({nullable: true, description: `The date column on the factor's related (source) entity that a time window filters on — the "when did it happen" column (e.g. RegistrationDate). Used by Rolling/Calendar/SinceEvent windows; null = no date filter (count everything in scope).`}) 
    @MaxLength(200)
    DateField?: string;
        
    @Field({nullable: true}) 
    @MaxLength(200)
    ScoreModel?: string;
        
    @Field() 
    @MaxLength(255)
    AnchorEntity: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    SourceEntity?: string;
        
    @Field({nullable: true}) 
    @MaxLength(120)
    TimeWindow?: string;
        
    @Field({nullable: true}) 
    @MaxLength(425)
    Action?: string;
        
    @Field({nullable: true}) 
    @MaxLength(200)
    SourceScoreModel?: string;
        
    @Field(() => [mjBizAppsSonarModelFactor_])
    mjBizAppsSonarMJ_BizApps_Sonar_ModelFactors_FactorIDArray: mjBizAppsSonarModelFactor_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_ModelFactors
    
    @Field(() => [mjBizAppsSonarScoreFactorContribution_])
    mjBizAppsSonarMJ_BizApps_Sonar_ScoreFactorContributions_FactorIDArray: mjBizAppsSonarScoreFactorContribution_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_ScoreFactorContributions
    
}

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Factors
//****************************************************************************
@InputType()
export class CreatemjBizAppsSonarFactorInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Slug?: string;

    @Field({ nullable: true })
    Description: string | null;

    @Field({ nullable: true })
    ScoreModelID: string | null;

    @Field({ nullable: true })
    AnchorEntityID?: string;

    @Field({ nullable: true })
    FactorType?: string;

    @Field({ nullable: true })
    SourceRelatedEntityID: string | null;

    @Field({ nullable: true })
    SourceEntityID: string | null;

    @Field({ nullable: true })
    FilterExpression: string | null;

    @Field({ nullable: true })
    Aggregation: string | null;

    @Field({ nullable: true })
    AggregateFieldName: string | null;

    @Field({ nullable: true })
    TimeWindowID: string | null;

    @Field(() => Int, { nullable: true })
    RecencyDecayHalfLifeDays: number | null;

    @Field({ nullable: true })
    ActionID: string | null;

    @Field({ nullable: true })
    ActionParamsJSON: string | null;

    @Field({ nullable: true })
    ExecutionMode: string | null;

    @Field(() => Boolean, { nullable: true })
    IsExpensive?: boolean;

    @Field(() => Int, { nullable: true })
    MaxConcurrency: number | null;

    @Field(() => Int, { nullable: true })
    RateLimitPerMinute: number | null;

    @Field(() => Int, { nullable: true })
    CacheTTLSeconds: number | null;

    @Field({ nullable: true })
    SourceScoreModelID: string | null;

    @Field({ nullable: true })
    RawDataType: string | null;

    @Field({ nullable: true })
    NormalizationMethod: string | null;

    @Field({ nullable: true })
    NormalizationParamsJSON: string | null;

    @Field(() => Float, { nullable: true })
    OutputMin: number | null;

    @Field(() => Float, { nullable: true })
    OutputMax: number | null;

    @Field(() => Boolean, { nullable: true })
    HigherIsBetter?: boolean;

    @Field({ nullable: true })
    PromotionState: string | null;

    @Field({ nullable: true })
    LastValidatedAt: Date | null;

    @Field({ nullable: true })
    CreatedByAgent: string | null;

    @Field({ nullable: true })
    DateField: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Factors
//****************************************************************************
@InputType()
export class UpdatemjBizAppsSonarFactorInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Slug?: string;

    @Field({ nullable: true })
    Description?: string | null;

    @Field({ nullable: true })
    ScoreModelID?: string | null;

    @Field({ nullable: true })
    AnchorEntityID?: string;

    @Field({ nullable: true })
    FactorType?: string;

    @Field({ nullable: true })
    SourceRelatedEntityID?: string | null;

    @Field({ nullable: true })
    SourceEntityID?: string | null;

    @Field({ nullable: true })
    FilterExpression?: string | null;

    @Field({ nullable: true })
    Aggregation?: string | null;

    @Field({ nullable: true })
    AggregateFieldName?: string | null;

    @Field({ nullable: true })
    TimeWindowID?: string | null;

    @Field(() => Int, { nullable: true })
    RecencyDecayHalfLifeDays?: number | null;

    @Field({ nullable: true })
    ActionID?: string | null;

    @Field({ nullable: true })
    ActionParamsJSON?: string | null;

    @Field({ nullable: true })
    ExecutionMode?: string | null;

    @Field(() => Boolean, { nullable: true })
    IsExpensive?: boolean;

    @Field(() => Int, { nullable: true })
    MaxConcurrency?: number | null;

    @Field(() => Int, { nullable: true })
    RateLimitPerMinute?: number | null;

    @Field(() => Int, { nullable: true })
    CacheTTLSeconds?: number | null;

    @Field({ nullable: true })
    SourceScoreModelID?: string | null;

    @Field({ nullable: true })
    RawDataType?: string | null;

    @Field({ nullable: true })
    NormalizationMethod?: string | null;

    @Field({ nullable: true })
    NormalizationParamsJSON?: string | null;

    @Field(() => Float, { nullable: true })
    OutputMin?: number | null;

    @Field(() => Float, { nullable: true })
    OutputMax?: number | null;

    @Field(() => Boolean, { nullable: true })
    HigherIsBetter?: boolean;

    @Field({ nullable: true })
    PromotionState?: string | null;

    @Field({ nullable: true })
    LastValidatedAt?: Date | null;

    @Field({ nullable: true })
    CreatedByAgent?: string | null;

    @Field({ nullable: true })
    DateField?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MJ_BizApps_Sonar: Factors
//****************************************************************************
@ObjectType()
export class RunmjBizAppsSonarFactorViewResult {
    @Field(() => [mjBizAppsSonarFactor_])
    Results: mjBizAppsSonarFactor_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(mjBizAppsSonarFactor_)
export class mjBizAppsSonarFactorResolver extends ResolverBase {
    @Query(() => RunmjBizAppsSonarFactorViewResult)
    async RunmjBizAppsSonarFactorViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarFactorViewResult)
    async RunmjBizAppsSonarFactorViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarFactorViewResult)
    async RunmjBizAppsSonarFactorDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MJ_BizApps_Sonar: Factors';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => mjBizAppsSonarFactor_, { nullable: true })
    async mjBizAppsSonarFactor(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<mjBizAppsSonarFactor_ | null> {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Factors', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwFactors')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Factors', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Factors', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [mjBizAppsSonarModelFactor_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ModelFactors_FactorIDArray(@Root() mjbizappssonarfactor_: mjBizAppsSonarFactor_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Model Factors', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwModelFactors')} WHERE ${provider.QuoteIdentifier('FactorID')}='${mjbizappssonarfactor_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Model Factors', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Model Factors', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScoreFactorContribution_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreFactorContributions_FactorIDArray(@Root() mjbizappssonarfactor_: mjBizAppsSonarFactor_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Factor Contributions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreFactorContributions')} WHERE ${provider.QuoteIdentifier('FactorID')}='${mjbizappssonarfactor_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Factor Contributions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Factor Contributions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => mjBizAppsSonarFactor_)
    async CreatemjBizAppsSonarFactor(
        @Arg('input', () => CreatemjBizAppsSonarFactorInput) input: CreatemjBizAppsSonarFactorInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MJ_BizApps_Sonar: Factors', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => mjBizAppsSonarFactor_)
    async UpdatemjBizAppsSonarFactor(
        @Arg('input', () => UpdatemjBizAppsSonarFactorInput) input: UpdatemjBizAppsSonarFactorInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MJ_BizApps_Sonar: Factors', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => mjBizAppsSonarFactor_)
    async DeletemjBizAppsSonarFactor(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MJ_BizApps_Sonar: Factors', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MJ_BizApps_Sonar: Intervention Assignments
//****************************************************************************
@ObjectType({ description: `One member\'s enrollment in an intervention, split into treatment vs. control (the holdout) for lift measurement.` })
export class mjBizAppsSonarInterventionAssignment_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    InterventionID: string;
        
    @Field({description: `Canonical id of the assigned anchor record (matches Score.AnchorRecordID).`}) 
    @MaxLength(100)
    AnchorRecordID: string;
        
    @Field({nullable: true, description: `Optional JSON of a composite anchor key (matches Score.AnchorRecordKeyJSON) for multi-column-PK anchors.`}) 
    AnchorRecordKeyJSON?: string;
        
    @Field({description: `Whether this member is in the Treatment cohort (the Action fires) or the Control cohort (held out).`}) 
    @MaxLength(10)
    Cohort: string;
        
    @Field({description: `When the member was assigned to this intervention.`}) 
    AssignedAt: Date;
        
    @Field({nullable: true, description: `Delivery state of the fired Action for a Treatment member (e.g. Pending, Delivered, Failed, Skipped); null for Control.`}) 
    @MaxLength(20)
    ActionDeliveryStatus?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(200)
    Intervention: string;
        
    @Field(() => [mjBizAppsSonarInterventionOutcome_])
    mjBizAppsSonarMJ_BizApps_Sonar_InterventionOutcomes_AssignmentIDArray: mjBizAppsSonarInterventionOutcome_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_InterventionOutcomes
    
}

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Intervention Assignments
//****************************************************************************
@InputType()
export class CreatemjBizAppsSonarInterventionAssignmentInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    InterventionID?: string;

    @Field({ nullable: true })
    AnchorRecordID?: string;

    @Field({ nullable: true })
    AnchorRecordKeyJSON: string | null;

    @Field({ nullable: true })
    Cohort?: string;

    @Field({ nullable: true })
    AssignedAt?: Date;

    @Field({ nullable: true })
    ActionDeliveryStatus: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Intervention Assignments
//****************************************************************************
@InputType()
export class UpdatemjBizAppsSonarInterventionAssignmentInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    InterventionID?: string;

    @Field({ nullable: true })
    AnchorRecordID?: string;

    @Field({ nullable: true })
    AnchorRecordKeyJSON?: string | null;

    @Field({ nullable: true })
    Cohort?: string;

    @Field({ nullable: true })
    AssignedAt?: Date;

    @Field({ nullable: true })
    ActionDeliveryStatus?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MJ_BizApps_Sonar: Intervention Assignments
//****************************************************************************
@ObjectType()
export class RunmjBizAppsSonarInterventionAssignmentViewResult {
    @Field(() => [mjBizAppsSonarInterventionAssignment_])
    Results: mjBizAppsSonarInterventionAssignment_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(mjBizAppsSonarInterventionAssignment_)
export class mjBizAppsSonarInterventionAssignmentResolver extends ResolverBase {
    @Query(() => RunmjBizAppsSonarInterventionAssignmentViewResult)
    async RunmjBizAppsSonarInterventionAssignmentViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarInterventionAssignmentViewResult)
    async RunmjBizAppsSonarInterventionAssignmentViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarInterventionAssignmentViewResult)
    async RunmjBizAppsSonarInterventionAssignmentDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MJ_BizApps_Sonar: Intervention Assignments';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => mjBizAppsSonarInterventionAssignment_, { nullable: true })
    async mjBizAppsSonarInterventionAssignment(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<mjBizAppsSonarInterventionAssignment_ | null> {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Intervention Assignments', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwInterventionAssignments')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Intervention Assignments', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Intervention Assignments', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [mjBizAppsSonarInterventionOutcome_])
    async mjBizAppsSonarMJ_BizApps_Sonar_InterventionOutcomes_AssignmentIDArray(@Root() mjbizappssonarinterventionassignment_: mjBizAppsSonarInterventionAssignment_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Intervention Outcomes', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwInterventionOutcomes')} WHERE ${provider.QuoteIdentifier('AssignmentID')}='${mjbizappssonarinterventionassignment_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Intervention Outcomes', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Intervention Outcomes', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => mjBizAppsSonarInterventionAssignment_)
    async CreatemjBizAppsSonarInterventionAssignment(
        @Arg('input', () => CreatemjBizAppsSonarInterventionAssignmentInput) input: CreatemjBizAppsSonarInterventionAssignmentInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MJ_BizApps_Sonar: Intervention Assignments', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => mjBizAppsSonarInterventionAssignment_)
    async UpdatemjBizAppsSonarInterventionAssignment(
        @Arg('input', () => UpdatemjBizAppsSonarInterventionAssignmentInput) input: UpdatemjBizAppsSonarInterventionAssignmentInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MJ_BizApps_Sonar: Intervention Assignments', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => mjBizAppsSonarInterventionAssignment_)
    async DeletemjBizAppsSonarInterventionAssignment(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MJ_BizApps_Sonar: Intervention Assignments', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MJ_BizApps_Sonar: Intervention Outcomes
//****************************************************************************
@ObjectType({ description: `The measured result for one intervention assignment (business outcome + score change) — the basis for treatment-vs-control lift.` })
export class mjBizAppsSonarInterventionOutcome_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    AssignmentID: string;
        
    @Field({description: `The business outcome observed: Renewed, Reactivated, Churned, Upgraded, or NoChange.`}) 
    @MaxLength(16)
    OutcomeType: string;
        
    @Field({nullable: true, description: `When the business outcome occurred.`}) 
    OutcomeAt?: Date;
        
    @Field(() => Float, {nullable: true, description: `Change in the member's normalized score from assignment to measurement (engagement movement after the play).`}) 
    ScoreDeltaAfter?: number;
        
    @Field({nullable: true, description: `When the outcome was measured/recorded.`}) 
    MeasuredAt?: Date;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
}

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Intervention Outcomes
//****************************************************************************
@InputType()
export class CreatemjBizAppsSonarInterventionOutcomeInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    AssignmentID?: string;

    @Field({ nullable: true })
    OutcomeType?: string;

    @Field({ nullable: true })
    OutcomeAt: Date | null;

    @Field(() => Float, { nullable: true })
    ScoreDeltaAfter: number | null;

    @Field({ nullable: true })
    MeasuredAt: Date | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Intervention Outcomes
//****************************************************************************
@InputType()
export class UpdatemjBizAppsSonarInterventionOutcomeInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    AssignmentID?: string;

    @Field({ nullable: true })
    OutcomeType?: string;

    @Field({ nullable: true })
    OutcomeAt?: Date | null;

    @Field(() => Float, { nullable: true })
    ScoreDeltaAfter?: number | null;

    @Field({ nullable: true })
    MeasuredAt?: Date | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MJ_BizApps_Sonar: Intervention Outcomes
//****************************************************************************
@ObjectType()
export class RunmjBizAppsSonarInterventionOutcomeViewResult {
    @Field(() => [mjBizAppsSonarInterventionOutcome_])
    Results: mjBizAppsSonarInterventionOutcome_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(mjBizAppsSonarInterventionOutcome_)
export class mjBizAppsSonarInterventionOutcomeResolver extends ResolverBase {
    @Query(() => RunmjBizAppsSonarInterventionOutcomeViewResult)
    async RunmjBizAppsSonarInterventionOutcomeViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarInterventionOutcomeViewResult)
    async RunmjBizAppsSonarInterventionOutcomeViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarInterventionOutcomeViewResult)
    async RunmjBizAppsSonarInterventionOutcomeDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MJ_BizApps_Sonar: Intervention Outcomes';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => mjBizAppsSonarInterventionOutcome_, { nullable: true })
    async mjBizAppsSonarInterventionOutcome(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<mjBizAppsSonarInterventionOutcome_ | null> {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Intervention Outcomes', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwInterventionOutcomes')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Intervention Outcomes', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Intervention Outcomes', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => mjBizAppsSonarInterventionOutcome_)
    async CreatemjBizAppsSonarInterventionOutcome(
        @Arg('input', () => CreatemjBizAppsSonarInterventionOutcomeInput) input: CreatemjBizAppsSonarInterventionOutcomeInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MJ_BizApps_Sonar: Intervention Outcomes', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => mjBizAppsSonarInterventionOutcome_)
    async UpdatemjBizAppsSonarInterventionOutcome(
        @Arg('input', () => UpdatemjBizAppsSonarInterventionOutcomeInput) input: UpdatemjBizAppsSonarInterventionOutcomeInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MJ_BizApps_Sonar: Intervention Outcomes', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => mjBizAppsSonarInterventionOutcome_)
    async DeletemjBizAppsSonarInterventionOutcome(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MJ_BizApps_Sonar: Intervention Outcomes', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MJ_BizApps_Sonar: Interventions
//****************************************************************************
@ObjectType({ description: `What to do for a segment: fire an MJ Action against its members, with an automatic holdout for lift measurement.` })
export class mjBizAppsSonarIntervention_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    ScoreSegmentID: string;
        
    @Field({description: `Display name of the intervention.`}) 
    @MaxLength(200)
    Name: string;
        
    @Field({nullable: true, description: `Optional description of the play and its intent.`}) 
    Description?: string;
        
    @Field({description: `When the intervention fires: OnEnterSegment (member newly matches), Scheduled, or Manual.`}) 
    @MaxLength(20)
    TriggerType: string;
        
    @Field() 
    @MaxLength(36)
    ActionID: string;
        
    @Field(() => Float, {nullable: true, description: `Percent of matched members withheld as a control group (holdout) so treatment-vs-control lift can be measured; null = no holdout.`}) 
    ControlGroupPercent?: number;
        
    @Field({description: `Lifecycle state: Draft (not firing), Active (firing per its trigger), or Paused.`}) 
    @MaxLength(16)
    Status: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(200)
    ScoreSegment: string;
        
    @Field() 
    @MaxLength(425)
    Action: string;
        
    @Field(() => [mjBizAppsSonarInterventionAssignment_])
    mjBizAppsSonarMJ_BizApps_Sonar_InterventionAssignments_InterventionIDArray: mjBizAppsSonarInterventionAssignment_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_InterventionAssignments
    
}

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Interventions
//****************************************************************************
@InputType()
export class CreatemjBizAppsSonarInterventionInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    ScoreSegmentID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Description: string | null;

    @Field({ nullable: true })
    TriggerType?: string;

    @Field({ nullable: true })
    ActionID?: string;

    @Field(() => Float, { nullable: true })
    ControlGroupPercent: number | null;

    @Field({ nullable: true })
    Status?: string;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Interventions
//****************************************************************************
@InputType()
export class UpdatemjBizAppsSonarInterventionInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    ScoreSegmentID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Description?: string | null;

    @Field({ nullable: true })
    TriggerType?: string;

    @Field({ nullable: true })
    ActionID?: string;

    @Field(() => Float, { nullable: true })
    ControlGroupPercent?: number | null;

    @Field({ nullable: true })
    Status?: string;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MJ_BizApps_Sonar: Interventions
//****************************************************************************
@ObjectType()
export class RunmjBizAppsSonarInterventionViewResult {
    @Field(() => [mjBizAppsSonarIntervention_])
    Results: mjBizAppsSonarIntervention_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(mjBizAppsSonarIntervention_)
export class mjBizAppsSonarInterventionResolver extends ResolverBase {
    @Query(() => RunmjBizAppsSonarInterventionViewResult)
    async RunmjBizAppsSonarInterventionViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarInterventionViewResult)
    async RunmjBizAppsSonarInterventionViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarInterventionViewResult)
    async RunmjBizAppsSonarInterventionDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MJ_BizApps_Sonar: Interventions';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => mjBizAppsSonarIntervention_, { nullable: true })
    async mjBizAppsSonarIntervention(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<mjBizAppsSonarIntervention_ | null> {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Interventions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwInterventions')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Interventions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Interventions', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [mjBizAppsSonarInterventionAssignment_])
    async mjBizAppsSonarMJ_BizApps_Sonar_InterventionAssignments_InterventionIDArray(@Root() mjbizappssonarintervention_: mjBizAppsSonarIntervention_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Intervention Assignments', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwInterventionAssignments')} WHERE ${provider.QuoteIdentifier('InterventionID')}='${mjbizappssonarintervention_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Intervention Assignments', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Intervention Assignments', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => mjBizAppsSonarIntervention_)
    async CreatemjBizAppsSonarIntervention(
        @Arg('input', () => CreatemjBizAppsSonarInterventionInput) input: CreatemjBizAppsSonarInterventionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MJ_BizApps_Sonar: Interventions', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => mjBizAppsSonarIntervention_)
    async UpdatemjBizAppsSonarIntervention(
        @Arg('input', () => UpdatemjBizAppsSonarInterventionInput) input: UpdatemjBizAppsSonarInterventionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MJ_BizApps_Sonar: Interventions', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => mjBizAppsSonarIntervention_)
    async DeletemjBizAppsSonarIntervention(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MJ_BizApps_Sonar: Interventions', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MJ_BizApps_Sonar: Model Factors
//****************************************************************************
@ObjectType({ description: `Binds a Factor into a model with its weight and contribution rules. The rubric is the set of these rows.` })
export class mjBizAppsSonarModelFactor_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    ScoreModelID: string;
        
    @Field() 
    @MaxLength(36)
    FactorID: string;
        
    @Field(() => Float, {description: `Weight applied to this factor's normalized contribution.`}) 
    Weight: number;
        
    @Field({description: `How the weight is applied: Additive, Multiplier, Gate, Penalty, or Bonus.`}) 
    @MaxLength(12)
    WeightMode: string;
        
    @Field(() => Float, {nullable: true, description: `Optional upper clamp on this factor's contribution.`}) 
    ContributionCap?: number;
        
    @Field(() => Float, {nullable: true, description: `Optional lower clamp on this factor's contribution.`}) 
    ContributionFloor?: number;
        
    @Field(() => Float, {nullable: true, description: `Extra weight placed on the factor's delta versus its level (encodes "a falling 80 beats a steady 50").`}) 
    TrendWeight?: number;
        
    @Field({description: `Policy when the factor has no data: Zero, NeutralMidpoint, Exclude, or ModelDefault.`}) 
    @MaxLength(16)
    MissingDataPolicy: string;
        
    @Field(() => Boolean, {description: `When true and data is missing, the resulting score is flagged low-confidence.`}) 
    IsRequired: boolean;
        
    @Field({nullable: true, description: `Label shown for this factor in explainability views, e.g. "Newsletter engagement".`}) 
    @MaxLength(200)
    DisplayLabel?: string;
        
    @Field(() => Int, {nullable: true, description: `Sort order for displaying this factor in the rubric and explainability views.`}) 
    DisplayOrder?: number;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(200)
    ScoreModel: string;
        
    @Field() 
    @MaxLength(200)
    Factor: string;
        
    @Field(() => [mjBizAppsSonarScoreFactorContribution_])
    mjBizAppsSonarMJ_BizApps_Sonar_ScoreFactorContributions_ModelFactorIDArray: mjBizAppsSonarScoreFactorContribution_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_ScoreFactorContributions
    
}

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Model Factors
//****************************************************************************
@InputType()
export class CreatemjBizAppsSonarModelFactorInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    ScoreModelID?: string;

    @Field({ nullable: true })
    FactorID?: string;

    @Field(() => Float, { nullable: true })
    Weight?: number;

    @Field({ nullable: true })
    WeightMode?: string;

    @Field(() => Float, { nullable: true })
    ContributionCap: number | null;

    @Field(() => Float, { nullable: true })
    ContributionFloor: number | null;

    @Field(() => Float, { nullable: true })
    TrendWeight: number | null;

    @Field({ nullable: true })
    MissingDataPolicy?: string;

    @Field(() => Boolean, { nullable: true })
    IsRequired?: boolean;

    @Field({ nullable: true })
    DisplayLabel: string | null;

    @Field(() => Int, { nullable: true })
    DisplayOrder: number | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Model Factors
//****************************************************************************
@InputType()
export class UpdatemjBizAppsSonarModelFactorInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    ScoreModelID?: string;

    @Field({ nullable: true })
    FactorID?: string;

    @Field(() => Float, { nullable: true })
    Weight?: number;

    @Field({ nullable: true })
    WeightMode?: string;

    @Field(() => Float, { nullable: true })
    ContributionCap?: number | null;

    @Field(() => Float, { nullable: true })
    ContributionFloor?: number | null;

    @Field(() => Float, { nullable: true })
    TrendWeight?: number | null;

    @Field({ nullable: true })
    MissingDataPolicy?: string;

    @Field(() => Boolean, { nullable: true })
    IsRequired?: boolean;

    @Field({ nullable: true })
    DisplayLabel?: string | null;

    @Field(() => Int, { nullable: true })
    DisplayOrder?: number | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MJ_BizApps_Sonar: Model Factors
//****************************************************************************
@ObjectType()
export class RunmjBizAppsSonarModelFactorViewResult {
    @Field(() => [mjBizAppsSonarModelFactor_])
    Results: mjBizAppsSonarModelFactor_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(mjBizAppsSonarModelFactor_)
export class mjBizAppsSonarModelFactorResolver extends ResolverBase {
    @Query(() => RunmjBizAppsSonarModelFactorViewResult)
    async RunmjBizAppsSonarModelFactorViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarModelFactorViewResult)
    async RunmjBizAppsSonarModelFactorViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarModelFactorViewResult)
    async RunmjBizAppsSonarModelFactorDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MJ_BizApps_Sonar: Model Factors';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => mjBizAppsSonarModelFactor_, { nullable: true })
    async mjBizAppsSonarModelFactor(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<mjBizAppsSonarModelFactor_ | null> {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Model Factors', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwModelFactors')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Model Factors', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Model Factors', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [mjBizAppsSonarScoreFactorContribution_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreFactorContributions_ModelFactorIDArray(@Root() mjbizappssonarmodelfactor_: mjBizAppsSonarModelFactor_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Factor Contributions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreFactorContributions')} WHERE ${provider.QuoteIdentifier('ModelFactorID')}='${mjbizappssonarmodelfactor_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Factor Contributions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Factor Contributions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => mjBizAppsSonarModelFactor_)
    async CreatemjBizAppsSonarModelFactor(
        @Arg('input', () => CreatemjBizAppsSonarModelFactorInput) input: CreatemjBizAppsSonarModelFactorInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MJ_BizApps_Sonar: Model Factors', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => mjBizAppsSonarModelFactor_)
    async UpdatemjBizAppsSonarModelFactor(
        @Arg('input', () => UpdatemjBizAppsSonarModelFactorInput) input: UpdatemjBizAppsSonarModelFactorInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MJ_BizApps_Sonar: Model Factors', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => mjBizAppsSonarModelFactor_)
    async DeletemjBizAppsSonarModelFactor(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MJ_BizApps_Sonar: Model Factors', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MJ_BizApps_Sonar: Model Related Entities
//****************************************************************************
@ObjectType({ description: `Declares an MJ entity wired into a model and how to traverse from the anchor to it. Factors reference these by Alias.` })
export class mjBizAppsSonarModelRelatedEntity_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    ScoreModelID: string;
        
    @Field() 
    @MaxLength(36)
    RelatedEntityID: string;
        
    @Field({description: `Handle used by factors to reference this related entity, e.g. crm_activity, invoices, lms_completions.`}) 
    @MaxLength(100)
    Alias: string;
        
    @Field({description: `JSON describing the join path from the anchor to the related entity (direct FK or multi-hop), resolved against MJ relationship metadata.`}) 
    RelationshipPath: string;
        
    @Field({description: `Join type from anchor to related entity: Inner or Left (usually Left so absence of related data is itself scorable).`}) 
    @MaxLength(10)
    JoinType: string;
        
    @Field({nullable: true, description: `Informational provenance tag for the source system (e.g. Salesforce, Finance, LMS, Community, Email).`}) 
    @MaxLength(60)
    SourceSystemTag?: string;
        
    @Field({nullable: true, description: `Optional description of the related-entity mapping.`}) 
    Description?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(200)
    ScoreModel: string;
        
    @Field() 
    @MaxLength(255)
    RelatedEntity: string;
        
    @Field(() => [mjBizAppsSonarFactor_])
    mjBizAppsSonarMJ_BizApps_Sonar_Factors_SourceRelatedEntityIDArray: mjBizAppsSonarFactor_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_Factors
    
}

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Model Related Entities
//****************************************************************************
@InputType()
export class CreatemjBizAppsSonarModelRelatedEntityInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    ScoreModelID?: string;

    @Field({ nullable: true })
    RelatedEntityID?: string;

    @Field({ nullable: true })
    Alias?: string;

    @Field({ nullable: true })
    RelationshipPath?: string;

    @Field({ nullable: true })
    JoinType?: string;

    @Field({ nullable: true })
    SourceSystemTag: string | null;

    @Field({ nullable: true })
    Description: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Model Related Entities
//****************************************************************************
@InputType()
export class UpdatemjBizAppsSonarModelRelatedEntityInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    ScoreModelID?: string;

    @Field({ nullable: true })
    RelatedEntityID?: string;

    @Field({ nullable: true })
    Alias?: string;

    @Field({ nullable: true })
    RelationshipPath?: string;

    @Field({ nullable: true })
    JoinType?: string;

    @Field({ nullable: true })
    SourceSystemTag?: string | null;

    @Field({ nullable: true })
    Description?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MJ_BizApps_Sonar: Model Related Entities
//****************************************************************************
@ObjectType()
export class RunmjBizAppsSonarModelRelatedEntityViewResult {
    @Field(() => [mjBizAppsSonarModelRelatedEntity_])
    Results: mjBizAppsSonarModelRelatedEntity_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(mjBizAppsSonarModelRelatedEntity_)
export class mjBizAppsSonarModelRelatedEntityResolver extends ResolverBase {
    @Query(() => RunmjBizAppsSonarModelRelatedEntityViewResult)
    async RunmjBizAppsSonarModelRelatedEntityViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarModelRelatedEntityViewResult)
    async RunmjBizAppsSonarModelRelatedEntityViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarModelRelatedEntityViewResult)
    async RunmjBizAppsSonarModelRelatedEntityDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MJ_BizApps_Sonar: Model Related Entities';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => mjBizAppsSonarModelRelatedEntity_, { nullable: true })
    async mjBizAppsSonarModelRelatedEntity(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<mjBizAppsSonarModelRelatedEntity_ | null> {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Model Related Entities', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwModelRelatedEntities')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Model Related Entities', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Model Related Entities', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [mjBizAppsSonarFactor_])
    async mjBizAppsSonarMJ_BizApps_Sonar_Factors_SourceRelatedEntityIDArray(@Root() mjbizappssonarmodelrelatedentity_: mjBizAppsSonarModelRelatedEntity_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Factors', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwFactors')} WHERE ${provider.QuoteIdentifier('SourceRelatedEntityID')}='${mjbizappssonarmodelrelatedentity_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Factors', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Factors', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => mjBizAppsSonarModelRelatedEntity_)
    async CreatemjBizAppsSonarModelRelatedEntity(
        @Arg('input', () => CreatemjBizAppsSonarModelRelatedEntityInput) input: CreatemjBizAppsSonarModelRelatedEntityInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MJ_BizApps_Sonar: Model Related Entities', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => mjBizAppsSonarModelRelatedEntity_)
    async UpdatemjBizAppsSonarModelRelatedEntity(
        @Arg('input', () => UpdatemjBizAppsSonarModelRelatedEntityInput) input: UpdatemjBizAppsSonarModelRelatedEntityInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MJ_BizApps_Sonar: Model Related Entities', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => mjBizAppsSonarModelRelatedEntity_)
    async DeletemjBizAppsSonarModelRelatedEntity(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MJ_BizApps_Sonar: Model Related Entities', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MJ_BizApps_Sonar: Score Band Sets
//****************************************************************************
@ObjectType({ description: `A reusable, named set of qualitative score bands (e.g. Healthy / Watch / At-Risk / Critical) that can be shared across scoring models.` })
export class mjBizAppsSonarScoreBandSet_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field({description: `Display name of the band set.`}) 
    @MaxLength(200)
    Name: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    AnchorEntityID?: string;
        
    @Field({nullable: true, description: `Optional description of the band set and its intended use.`}) 
    Description?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    AnchorEntity?: string;
        
    @Field(() => [mjBizAppsSonarScoreBand_])
    mjBizAppsSonarMJ_BizApps_Sonar_ScoreBands_BandSetIDArray: mjBizAppsSonarScoreBand_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_ScoreBands
    
    @Field(() => [mjBizAppsSonarScoreModel_])
    mjBizAppsSonarMJ_BizApps_Sonar_ScoreModels_BandSetIDArray: mjBizAppsSonarScoreModel_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_ScoreModels
    
}

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Score Band Sets
//****************************************************************************
@InputType()
export class CreatemjBizAppsSonarScoreBandSetInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    AnchorEntityID: string | null;

    @Field({ nullable: true })
    Description: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Score Band Sets
//****************************************************************************
@InputType()
export class UpdatemjBizAppsSonarScoreBandSetInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    AnchorEntityID?: string | null;

    @Field({ nullable: true })
    Description?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MJ_BizApps_Sonar: Score Band Sets
//****************************************************************************
@ObjectType()
export class RunmjBizAppsSonarScoreBandSetViewResult {
    @Field(() => [mjBizAppsSonarScoreBandSet_])
    Results: mjBizAppsSonarScoreBandSet_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(mjBizAppsSonarScoreBandSet_)
export class mjBizAppsSonarScoreBandSetResolver extends ResolverBase {
    @Query(() => RunmjBizAppsSonarScoreBandSetViewResult)
    async RunmjBizAppsSonarScoreBandSetViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarScoreBandSetViewResult)
    async RunmjBizAppsSonarScoreBandSetViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarScoreBandSetViewResult)
    async RunmjBizAppsSonarScoreBandSetDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MJ_BizApps_Sonar: Score Band Sets';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => mjBizAppsSonarScoreBandSet_, { nullable: true })
    async mjBizAppsSonarScoreBandSet(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<mjBizAppsSonarScoreBandSet_ | null> {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Band Sets', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreBandSets')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Band Sets', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Band Sets', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [mjBizAppsSonarScoreBand_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreBands_BandSetIDArray(@Root() mjbizappssonarscorebandset_: mjBizAppsSonarScoreBandSet_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Bands', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreBands')} WHERE ${provider.QuoteIdentifier('BandSetID')}='${mjbizappssonarscorebandset_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Bands', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Bands', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScoreModel_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreModels_BandSetIDArray(@Root() mjbizappssonarscorebandset_: mjBizAppsSonarScoreBandSet_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Models', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreModels')} WHERE ${provider.QuoteIdentifier('BandSetID')}='${mjbizappssonarscorebandset_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Models', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Models', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => mjBizAppsSonarScoreBandSet_)
    async CreatemjBizAppsSonarScoreBandSet(
        @Arg('input', () => CreatemjBizAppsSonarScoreBandSetInput) input: CreatemjBizAppsSonarScoreBandSetInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MJ_BizApps_Sonar: Score Band Sets', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => mjBizAppsSonarScoreBandSet_)
    async UpdatemjBizAppsSonarScoreBandSet(
        @Arg('input', () => UpdatemjBizAppsSonarScoreBandSetInput) input: UpdatemjBizAppsSonarScoreBandSetInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MJ_BizApps_Sonar: Score Band Sets', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => mjBizAppsSonarScoreBandSet_)
    async DeletemjBizAppsSonarScoreBandSet(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MJ_BizApps_Sonar: Score Band Sets', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MJ_BizApps_Sonar: Score Band Transitions
//****************************************************************************
@ObjectType({ description: `First-class record of a band crossing; the event the action layer and write-back key off.` })
export class mjBizAppsSonarScoreBandTransition_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    ScoreModelID: string;
        
    @Field({description: `Primary-key value of the anchor record that crossed bands, stored as a string to stay entity-agnostic.`}) 
    @MaxLength(100)
    AnchorRecordID: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    FromBandID?: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    ToBandID?: string;
        
    @Field({nullable: true, description: `Direction of the crossing: Improving or Worsening.`}) 
    @MaxLength(12)
    Direction?: string;
        
    @Field({description: `UTC timestamp at which the band crossing occurred.`}) 
    OccurredAt: Date;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    RecomputeRunID?: string;
        
    @Field(() => Boolean, {description: `Indicates whether the transition has been picked up by write-back or an intervention.`}) 
    Handled: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(200)
    ScoreModel: string;
        
}

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Score Band Transitions
//****************************************************************************
@InputType()
export class CreatemjBizAppsSonarScoreBandTransitionInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    ScoreModelID?: string;

    @Field({ nullable: true })
    AnchorRecordID?: string;

    @Field({ nullable: true })
    FromBandID: string | null;

    @Field({ nullable: true })
    ToBandID: string | null;

    @Field({ nullable: true })
    Direction: string | null;

    @Field({ nullable: true })
    OccurredAt?: Date;

    @Field({ nullable: true })
    RecomputeRunID: string | null;

    @Field(() => Boolean, { nullable: true })
    Handled?: boolean;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Score Band Transitions
//****************************************************************************
@InputType()
export class UpdatemjBizAppsSonarScoreBandTransitionInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    ScoreModelID?: string;

    @Field({ nullable: true })
    AnchorRecordID?: string;

    @Field({ nullable: true })
    FromBandID?: string | null;

    @Field({ nullable: true })
    ToBandID?: string | null;

    @Field({ nullable: true })
    Direction?: string | null;

    @Field({ nullable: true })
    OccurredAt?: Date;

    @Field({ nullable: true })
    RecomputeRunID?: string | null;

    @Field(() => Boolean, { nullable: true })
    Handled?: boolean;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MJ_BizApps_Sonar: Score Band Transitions
//****************************************************************************
@ObjectType()
export class RunmjBizAppsSonarScoreBandTransitionViewResult {
    @Field(() => [mjBizAppsSonarScoreBandTransition_])
    Results: mjBizAppsSonarScoreBandTransition_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(mjBizAppsSonarScoreBandTransition_)
export class mjBizAppsSonarScoreBandTransitionResolver extends ResolverBase {
    @Query(() => RunmjBizAppsSonarScoreBandTransitionViewResult)
    async RunmjBizAppsSonarScoreBandTransitionViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarScoreBandTransitionViewResult)
    async RunmjBizAppsSonarScoreBandTransitionViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarScoreBandTransitionViewResult)
    async RunmjBizAppsSonarScoreBandTransitionDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MJ_BizApps_Sonar: Score Band Transitions';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => mjBizAppsSonarScoreBandTransition_, { nullable: true })
    async mjBizAppsSonarScoreBandTransition(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<mjBizAppsSonarScoreBandTransition_ | null> {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Band Transitions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreBandTransitions')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Band Transitions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Band Transitions', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => mjBizAppsSonarScoreBandTransition_)
    async CreatemjBizAppsSonarScoreBandTransition(
        @Arg('input', () => CreatemjBizAppsSonarScoreBandTransitionInput) input: CreatemjBizAppsSonarScoreBandTransitionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MJ_BizApps_Sonar: Score Band Transitions', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => mjBizAppsSonarScoreBandTransition_)
    async UpdatemjBizAppsSonarScoreBandTransition(
        @Arg('input', () => UpdatemjBizAppsSonarScoreBandTransitionInput) input: UpdatemjBizAppsSonarScoreBandTransitionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MJ_BizApps_Sonar: Score Band Transitions', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => mjBizAppsSonarScoreBandTransition_)
    async DeletemjBizAppsSonarScoreBandTransition(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MJ_BizApps_Sonar: Score Band Transitions', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MJ_BizApps_Sonar: Score Bands
//****************************************************************************
@ObjectType({ description: `One qualitative band within a band set, defined by a half-open score range with a severity and color for sorting and display.` })
export class mjBizAppsSonarScoreBand_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    BandSetID: string;
        
    @Field({description: `Display label for the band, e.g. Healthy, Watch, At-Risk, Critical.`}) 
    @MaxLength(60)
    Label: string;
        
    @Field(() => Float, {description: `Inclusive lower bound of the band score range.`}) 
    MinScore: number;
        
    @Field(() => Float, {description: `Exclusive upper bound of the band score range (half-open; ranges are contiguous and non-overlapping).`}) 
    MaxScore: number;
        
    @Field(() => Int, {description: `Severity rank where 0 is best and higher numbers are worse; drives sort order and color.`}) 
    Severity: number;
        
    @Field({nullable: true, description: `Hex color code (e.g. #2E7D32) used to render the band in the UI.`}) 
    @MaxLength(7)
    ColorHex?: string;
        
    @Field(() => Boolean, {description: `Indicates a terminal band (e.g. Lapsed) that represents an end state rather than a point on the continuum.`}) 
    IsTerminal: boolean;
        
    @Field({nullable: true, description: `Optional description of what this band means.`}) 
    Description?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(200)
    BandSet: string;
        
    @Field(() => [mjBizAppsSonarScore_])
    mjBizAppsSonarMJ_BizApps_Sonar_Scores_BandIDArray: mjBizAppsSonarScore_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_Scores
    
    @Field(() => [mjBizAppsSonarScore_])
    mjBizAppsSonarMJ_BizApps_Sonar_Scores_PreviousBandIDArray: mjBizAppsSonarScore_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_Scores
    
    @Field(() => [mjBizAppsSonarScoreHistory_])
    mjBizAppsSonarMJ_BizApps_Sonar_ScoreHistories_BandIDArray: mjBizAppsSonarScoreHistory_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_ScoreHistories
    
    @Field(() => [mjBizAppsSonarScoreBandTransition_])
    mjBizAppsSonarMJ_BizApps_Sonar_ScoreBandTransitions_FromBandIDArray: mjBizAppsSonarScoreBandTransition_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_ScoreBandTransitions
    
    @Field(() => [mjBizAppsSonarScoreBandTransition_])
    mjBizAppsSonarMJ_BizApps_Sonar_ScoreBandTransitions_ToBandIDArray: mjBizAppsSonarScoreBandTransition_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_ScoreBandTransitions
    
}

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Score Bands
//****************************************************************************
@InputType()
export class CreatemjBizAppsSonarScoreBandInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    BandSetID?: string;

    @Field({ nullable: true })
    Label?: string;

    @Field(() => Float, { nullable: true })
    MinScore?: number;

    @Field(() => Float, { nullable: true })
    MaxScore?: number;

    @Field(() => Int, { nullable: true })
    Severity?: number;

    @Field({ nullable: true })
    ColorHex: string | null;

    @Field(() => Boolean, { nullable: true })
    IsTerminal?: boolean;

    @Field({ nullable: true })
    Description: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Score Bands
//****************************************************************************
@InputType()
export class UpdatemjBizAppsSonarScoreBandInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    BandSetID?: string;

    @Field({ nullable: true })
    Label?: string;

    @Field(() => Float, { nullable: true })
    MinScore?: number;

    @Field(() => Float, { nullable: true })
    MaxScore?: number;

    @Field(() => Int, { nullable: true })
    Severity?: number;

    @Field({ nullable: true })
    ColorHex?: string | null;

    @Field(() => Boolean, { nullable: true })
    IsTerminal?: boolean;

    @Field({ nullable: true })
    Description?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MJ_BizApps_Sonar: Score Bands
//****************************************************************************
@ObjectType()
export class RunmjBizAppsSonarScoreBandViewResult {
    @Field(() => [mjBizAppsSonarScoreBand_])
    Results: mjBizAppsSonarScoreBand_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(mjBizAppsSonarScoreBand_)
export class mjBizAppsSonarScoreBandResolver extends ResolverBase {
    @Query(() => RunmjBizAppsSonarScoreBandViewResult)
    async RunmjBizAppsSonarScoreBandViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarScoreBandViewResult)
    async RunmjBizAppsSonarScoreBandViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarScoreBandViewResult)
    async RunmjBizAppsSonarScoreBandDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MJ_BizApps_Sonar: Score Bands';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => mjBizAppsSonarScoreBand_, { nullable: true })
    async mjBizAppsSonarScoreBand(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<mjBizAppsSonarScoreBand_ | null> {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Bands', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreBands')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Bands', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Bands', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [mjBizAppsSonarScore_])
    async mjBizAppsSonarMJ_BizApps_Sonar_Scores_BandIDArray(@Root() mjbizappssonarscoreband_: mjBizAppsSonarScoreBand_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Scores', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScores')} WHERE ${provider.QuoteIdentifier('BandID')}='${mjbizappssonarscoreband_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Scores', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Scores', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScore_])
    async mjBizAppsSonarMJ_BizApps_Sonar_Scores_PreviousBandIDArray(@Root() mjbizappssonarscoreband_: mjBizAppsSonarScoreBand_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Scores', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScores')} WHERE ${provider.QuoteIdentifier('PreviousBandID')}='${mjbizappssonarscoreband_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Scores', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Scores', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScoreHistory_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreHistories_BandIDArray(@Root() mjbizappssonarscoreband_: mjBizAppsSonarScoreBand_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Histories', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreHistories')} WHERE ${provider.QuoteIdentifier('BandID')}='${mjbizappssonarscoreband_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Histories', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Histories', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScoreBandTransition_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreBandTransitions_FromBandIDArray(@Root() mjbizappssonarscoreband_: mjBizAppsSonarScoreBand_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Band Transitions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreBandTransitions')} WHERE ${provider.QuoteIdentifier('FromBandID')}='${mjbizappssonarscoreband_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Band Transitions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Band Transitions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScoreBandTransition_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreBandTransitions_ToBandIDArray(@Root() mjbizappssonarscoreband_: mjBizAppsSonarScoreBand_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Band Transitions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreBandTransitions')} WHERE ${provider.QuoteIdentifier('ToBandID')}='${mjbizappssonarscoreband_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Band Transitions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Band Transitions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => mjBizAppsSonarScoreBand_)
    async CreatemjBizAppsSonarScoreBand(
        @Arg('input', () => CreatemjBizAppsSonarScoreBandInput) input: CreatemjBizAppsSonarScoreBandInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MJ_BizApps_Sonar: Score Bands', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => mjBizAppsSonarScoreBand_)
    async UpdatemjBizAppsSonarScoreBand(
        @Arg('input', () => UpdatemjBizAppsSonarScoreBandInput) input: UpdatemjBizAppsSonarScoreBandInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MJ_BizApps_Sonar: Score Bands', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => mjBizAppsSonarScoreBand_)
    async DeletemjBizAppsSonarScoreBand(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MJ_BizApps_Sonar: Score Bands', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MJ_BizApps_Sonar: Score Factor Contributions
//****************************************************************************
@ObjectType({ description: `Per-factor breakdown of a current score; the explainability spine that makes the score narrative free.` })
export class mjBizAppsSonarScoreFactorContribution_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    ScoreID: string;
        
    @Field() 
    @MaxLength(36)
    ModelFactorID: string;
        
    @Field() 
    @MaxLength(36)
    FactorID: string;
        
    @Field(() => Float, {nullable: true, description: `Raw value the factor produced before normalization.`}) 
    RawValue?: number;
        
    @Field(() => Float, {nullable: true, description: `The factor's normalized output (e.g. 0-1 or configured range).`}) 
    NormalizedValue?: number;
        
    @Field(() => Float, {nullable: true, description: `Amount this factor added to the score after weighting.`}) 
    WeightedContribution?: number;
        
    @Field(() => Float, {nullable: true, description: `Share of the total score attributable to this factor.`}) 
    PercentOfTotal?: number;
        
    @Field(() => Float, {nullable: true, description: `Change in this factor's contribution versus the previous score.`}) 
    ContributionDelta?: number;
        
    @Field(() => Boolean, {description: `Indicates whether the factor had data for this record.`}) 
    HadData: boolean;
        
    @Field(() => Boolean, {description: `Indicates whether a missing-data policy was applied for this factor.`}) 
    MissingDataApplied: boolean;
        
    @Field({nullable: true, description: `Optional JSON with sampled underlying record references for drill-through.`}) 
    DetailJSON?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(200)
    Factor: string;
        
}

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Score Factor Contributions
//****************************************************************************
@InputType()
export class CreatemjBizAppsSonarScoreFactorContributionInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    ScoreID?: string;

    @Field({ nullable: true })
    ModelFactorID?: string;

    @Field({ nullable: true })
    FactorID?: string;

    @Field(() => Float, { nullable: true })
    RawValue: number | null;

    @Field(() => Float, { nullable: true })
    NormalizedValue: number | null;

    @Field(() => Float, { nullable: true })
    WeightedContribution: number | null;

    @Field(() => Float, { nullable: true })
    PercentOfTotal: number | null;

    @Field(() => Float, { nullable: true })
    ContributionDelta: number | null;

    @Field(() => Boolean, { nullable: true })
    HadData?: boolean;

    @Field(() => Boolean, { nullable: true })
    MissingDataApplied?: boolean;

    @Field({ nullable: true })
    DetailJSON: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Score Factor Contributions
//****************************************************************************
@InputType()
export class UpdatemjBizAppsSonarScoreFactorContributionInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    ScoreID?: string;

    @Field({ nullable: true })
    ModelFactorID?: string;

    @Field({ nullable: true })
    FactorID?: string;

    @Field(() => Float, { nullable: true })
    RawValue?: number | null;

    @Field(() => Float, { nullable: true })
    NormalizedValue?: number | null;

    @Field(() => Float, { nullable: true })
    WeightedContribution?: number | null;

    @Field(() => Float, { nullable: true })
    PercentOfTotal?: number | null;

    @Field(() => Float, { nullable: true })
    ContributionDelta?: number | null;

    @Field(() => Boolean, { nullable: true })
    HadData?: boolean;

    @Field(() => Boolean, { nullable: true })
    MissingDataApplied?: boolean;

    @Field({ nullable: true })
    DetailJSON?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MJ_BizApps_Sonar: Score Factor Contributions
//****************************************************************************
@ObjectType()
export class RunmjBizAppsSonarScoreFactorContributionViewResult {
    @Field(() => [mjBizAppsSonarScoreFactorContribution_])
    Results: mjBizAppsSonarScoreFactorContribution_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(mjBizAppsSonarScoreFactorContribution_)
export class mjBizAppsSonarScoreFactorContributionResolver extends ResolverBase {
    @Query(() => RunmjBizAppsSonarScoreFactorContributionViewResult)
    async RunmjBizAppsSonarScoreFactorContributionViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarScoreFactorContributionViewResult)
    async RunmjBizAppsSonarScoreFactorContributionViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarScoreFactorContributionViewResult)
    async RunmjBizAppsSonarScoreFactorContributionDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MJ_BizApps_Sonar: Score Factor Contributions';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => mjBizAppsSonarScoreFactorContribution_, { nullable: true })
    async mjBizAppsSonarScoreFactorContribution(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<mjBizAppsSonarScoreFactorContribution_ | null> {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Factor Contributions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreFactorContributions')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Factor Contributions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Factor Contributions', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => mjBizAppsSonarScoreFactorContribution_)
    async CreatemjBizAppsSonarScoreFactorContribution(
        @Arg('input', () => CreatemjBizAppsSonarScoreFactorContributionInput) input: CreatemjBizAppsSonarScoreFactorContributionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MJ_BizApps_Sonar: Score Factor Contributions', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => mjBizAppsSonarScoreFactorContribution_)
    async UpdatemjBizAppsSonarScoreFactorContribution(
        @Arg('input', () => UpdatemjBizAppsSonarScoreFactorContributionInput) input: UpdatemjBizAppsSonarScoreFactorContributionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MJ_BizApps_Sonar: Score Factor Contributions', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => mjBizAppsSonarScoreFactorContribution_)
    async DeletemjBizAppsSonarScoreFactorContribution(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MJ_BizApps_Sonar: Score Factor Contributions', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MJ_BizApps_Sonar: Score Histories
//****************************************************************************
@ObjectType({ description: `Append-only time-series snapshots of scores; the trajectory is the asset. Snapshot on change plus periodic keyframes.` })
export class mjBizAppsSonarScoreHistory_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    ScoreModelID: string;
        
    @Field() 
    @MaxLength(36)
    ScoreModelVersionID: string;
        
    @Field() 
    @MaxLength(36)
    AnchorEntityID: string;
        
    @Field({description: `Primary-key value of the scored anchor record, stored as a string to stay entity-agnostic.`}) 
    @MaxLength(100)
    AnchorRecordID: string;
        
    @Field(() => Float, {nullable: true, description: `The headline normalized score at this point in time.`}) 
    NormalizedScore?: number;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    BandID?: string;
        
    @Field({nullable: true, description: `The "now" the time windows resolved against for this snapshot.`}) 
    AsOfDate?: Date;
        
    @Field({description: `UTC timestamp at which this snapshot was computed.`}) 
    ComputedAt: Date;
        
    @Field(() => Float, {nullable: true, description: `Fraction of factors that had data at this point in time (0-1).`}) 
    DataCompleteness?: number;
        
    @Field(() => Float, {nullable: true, description: `Confidence in the score at this point in time (0-1).`}) 
    Confidence?: number;
        
    @Field({nullable: true, description: `Compact per-factor snapshot (JSON) for point-in-time explainability without exploding row counts.`}) 
    ContributionsJSON?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(200)
    ScoreModel: string;
        
    @Field() 
    @MaxLength(255)
    AnchorEntity: string;
        
}

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Score Histories
//****************************************************************************
@InputType()
export class CreatemjBizAppsSonarScoreHistoryInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    ScoreModelID?: string;

    @Field({ nullable: true })
    ScoreModelVersionID?: string;

    @Field({ nullable: true })
    AnchorEntityID?: string;

    @Field({ nullable: true })
    AnchorRecordID?: string;

    @Field(() => Float, { nullable: true })
    NormalizedScore: number | null;

    @Field({ nullable: true })
    BandID: string | null;

    @Field({ nullable: true })
    AsOfDate: Date | null;

    @Field({ nullable: true })
    ComputedAt?: Date;

    @Field(() => Float, { nullable: true })
    DataCompleteness: number | null;

    @Field(() => Float, { nullable: true })
    Confidence: number | null;

    @Field({ nullable: true })
    ContributionsJSON: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Score Histories
//****************************************************************************
@InputType()
export class UpdatemjBizAppsSonarScoreHistoryInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    ScoreModelID?: string;

    @Field({ nullable: true })
    ScoreModelVersionID?: string;

    @Field({ nullable: true })
    AnchorEntityID?: string;

    @Field({ nullable: true })
    AnchorRecordID?: string;

    @Field(() => Float, { nullable: true })
    NormalizedScore?: number | null;

    @Field({ nullable: true })
    BandID?: string | null;

    @Field({ nullable: true })
    AsOfDate?: Date | null;

    @Field({ nullable: true })
    ComputedAt?: Date;

    @Field(() => Float, { nullable: true })
    DataCompleteness?: number | null;

    @Field(() => Float, { nullable: true })
    Confidence?: number | null;

    @Field({ nullable: true })
    ContributionsJSON?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MJ_BizApps_Sonar: Score Histories
//****************************************************************************
@ObjectType()
export class RunmjBizAppsSonarScoreHistoryViewResult {
    @Field(() => [mjBizAppsSonarScoreHistory_])
    Results: mjBizAppsSonarScoreHistory_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(mjBizAppsSonarScoreHistory_)
export class mjBizAppsSonarScoreHistoryResolver extends ResolverBase {
    @Query(() => RunmjBizAppsSonarScoreHistoryViewResult)
    async RunmjBizAppsSonarScoreHistoryViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarScoreHistoryViewResult)
    async RunmjBizAppsSonarScoreHistoryViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarScoreHistoryViewResult)
    async RunmjBizAppsSonarScoreHistoryDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MJ_BizApps_Sonar: Score Histories';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => mjBizAppsSonarScoreHistory_, { nullable: true })
    async mjBizAppsSonarScoreHistory(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<mjBizAppsSonarScoreHistory_ | null> {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Histories', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreHistories')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Histories', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Histories', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => mjBizAppsSonarScoreHistory_)
    async CreatemjBizAppsSonarScoreHistory(
        @Arg('input', () => CreatemjBizAppsSonarScoreHistoryInput) input: CreatemjBizAppsSonarScoreHistoryInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MJ_BizApps_Sonar: Score Histories', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => mjBizAppsSonarScoreHistory_)
    async UpdatemjBizAppsSonarScoreHistory(
        @Arg('input', () => UpdatemjBizAppsSonarScoreHistoryInput) input: UpdatemjBizAppsSonarScoreHistoryInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MJ_BizApps_Sonar: Score Histories', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => mjBizAppsSonarScoreHistory_)
    async DeletemjBizAppsSonarScoreHistory(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MJ_BizApps_Sonar: Score Histories', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MJ_BizApps_Sonar: Score Model Audit Events
//****************************************************************************
@ObjectType({ description: `Config-change audit: who changed which weight, factor, or window and when. Required for an explainable, governed scoring product.` })
export class mjBizAppsSonarScoreModelAuditEvent_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    ScoreModelID: string;
        
    @Field({description: `Name of the configuration entity that changed (e.g. ScoreModel, Factor, ModelFactor).`}) 
    @MaxLength(100)
    EntityChanged: string;
        
    @Field({nullable: true, description: `Identifier of the specific record that changed, stored as a string to stay entity-agnostic.`}) 
    @MaxLength(100)
    RecordID?: string;
        
    @Field({description: `Kind of change: Create, Update, Delete, or Publish.`}) 
    @MaxLength(20)
    ChangeType: string;
        
    @Field({nullable: true, description: `JSON snapshot of the record before the change.`}) 
    BeforeJSON?: string;
        
    @Field({nullable: true, description: `JSON snapshot of the record after the change.`}) 
    AfterJSON?: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    ChangedByUserID?: string;
        
    @Field({description: `UTC timestamp at which the change occurred.`}) 
    ChangedAt: Date;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(200)
    ScoreModel: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    ChangedByUser?: string;
        
}

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Score Model Audit Events
//****************************************************************************
@InputType()
export class CreatemjBizAppsSonarScoreModelAuditEventInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    ScoreModelID?: string;

    @Field({ nullable: true })
    EntityChanged?: string;

    @Field({ nullable: true })
    RecordID: string | null;

    @Field({ nullable: true })
    ChangeType?: string;

    @Field({ nullable: true })
    BeforeJSON: string | null;

    @Field({ nullable: true })
    AfterJSON: string | null;

    @Field({ nullable: true })
    ChangedByUserID: string | null;

    @Field({ nullable: true })
    ChangedAt?: Date;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Score Model Audit Events
//****************************************************************************
@InputType()
export class UpdatemjBizAppsSonarScoreModelAuditEventInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    ScoreModelID?: string;

    @Field({ nullable: true })
    EntityChanged?: string;

    @Field({ nullable: true })
    RecordID?: string | null;

    @Field({ nullable: true })
    ChangeType?: string;

    @Field({ nullable: true })
    BeforeJSON?: string | null;

    @Field({ nullable: true })
    AfterJSON?: string | null;

    @Field({ nullable: true })
    ChangedByUserID?: string | null;

    @Field({ nullable: true })
    ChangedAt?: Date;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MJ_BizApps_Sonar: Score Model Audit Events
//****************************************************************************
@ObjectType()
export class RunmjBizAppsSonarScoreModelAuditEventViewResult {
    @Field(() => [mjBizAppsSonarScoreModelAuditEvent_])
    Results: mjBizAppsSonarScoreModelAuditEvent_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(mjBizAppsSonarScoreModelAuditEvent_)
export class mjBizAppsSonarScoreModelAuditEventResolver extends ResolverBase {
    @Query(() => RunmjBizAppsSonarScoreModelAuditEventViewResult)
    async RunmjBizAppsSonarScoreModelAuditEventViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarScoreModelAuditEventViewResult)
    async RunmjBizAppsSonarScoreModelAuditEventViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarScoreModelAuditEventViewResult)
    async RunmjBizAppsSonarScoreModelAuditEventDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MJ_BizApps_Sonar: Score Model Audit Events';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => mjBizAppsSonarScoreModelAuditEvent_, { nullable: true })
    async mjBizAppsSonarScoreModelAuditEvent(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<mjBizAppsSonarScoreModelAuditEvent_ | null> {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Model Audit Events', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreModelAuditEvents')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Model Audit Events', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Model Audit Events', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => mjBizAppsSonarScoreModelAuditEvent_)
    async CreatemjBizAppsSonarScoreModelAuditEvent(
        @Arg('input', () => CreatemjBizAppsSonarScoreModelAuditEventInput) input: CreatemjBizAppsSonarScoreModelAuditEventInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MJ_BizApps_Sonar: Score Model Audit Events', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => mjBizAppsSonarScoreModelAuditEvent_)
    async UpdatemjBizAppsSonarScoreModelAuditEvent(
        @Arg('input', () => UpdatemjBizAppsSonarScoreModelAuditEventInput) input: UpdatemjBizAppsSonarScoreModelAuditEventInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MJ_BizApps_Sonar: Score Model Audit Events', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => mjBizAppsSonarScoreModelAuditEvent_)
    async DeletemjBizAppsSonarScoreModelAuditEvent(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MJ_BizApps_Sonar: Score Model Audit Events', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MJ_BizApps_Sonar: Score Model Versions
//****************************************************************************
@ObjectType({ description: `An immutable snapshot of a model\'s complete configuration at publish time. Every Score and ScoreHistory row references the version that produced it, making scores reproducible and auditable.` })
export class mjBizAppsSonarScoreModelVersion_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    ScoreModelID: string;
        
    @Field(() => Int, {description: `Monotonic version number within the model.`}) 
    VersionNumber: number;
        
    @Field({nullable: true, description: `Optional human-readable label for the version.`}) 
    @MaxLength(50)
    VersionLabel?: string;
        
    @Field({description: `Fully denormalized JSON snapshot (anchor, related-entity map, factors, weights, windows, bands, normalization) the engine can score from on its own.`}) 
    ConfigSnapshotJSON: string;
        
    @Field({nullable: true, description: `Summary of what changed versus the prior version.`}) 
    ChangeSummary?: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    PublishedByUserID?: string;
        
    @Field({description: `UTC timestamp at which this version was published.`}) 
    PublishedAt: Date;
        
    @Field(() => Boolean, {description: `Indicates the single current version that is actively scoring for the model.`}) 
    IsCurrent: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(200)
    ScoreModel: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    PublishedByUser?: string;
        
    @Field(() => [mjBizAppsSonarScoreRecomputeRun_])
    mjBizAppsSonarMJ_BizApps_Sonar_ScoreRecomputeRuns_ScoreModelVersionIDArray: mjBizAppsSonarScoreRecomputeRun_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_ScoreRecomputeRuns
    
    @Field(() => [mjBizAppsSonarScore_])
    mjBizAppsSonarMJ_BizApps_Sonar_Scores_ScoreModelVersionIDArray: mjBizAppsSonarScore_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_Scores
    
    @Field(() => [mjBizAppsSonarScoreHistory_])
    mjBizAppsSonarMJ_BizApps_Sonar_ScoreHistories_ScoreModelVersionIDArray: mjBizAppsSonarScoreHistory_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_ScoreHistories
    
    @Field(() => [mjBizAppsSonarScoreModel_])
    mjBizAppsSonarMJ_BizApps_Sonar_ScoreModels_CurrentVersionIDArray: mjBizAppsSonarScoreModel_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_ScoreModels
    
}

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Score Model Versions
//****************************************************************************
@InputType()
export class CreatemjBizAppsSonarScoreModelVersionInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    ScoreModelID?: string;

    @Field(() => Int, { nullable: true })
    VersionNumber?: number;

    @Field({ nullable: true })
    VersionLabel: string | null;

    @Field({ nullable: true })
    ConfigSnapshotJSON?: string;

    @Field({ nullable: true })
    ChangeSummary: string | null;

    @Field({ nullable: true })
    PublishedByUserID: string | null;

    @Field({ nullable: true })
    PublishedAt?: Date;

    @Field(() => Boolean, { nullable: true })
    IsCurrent?: boolean;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Score Model Versions
//****************************************************************************
@InputType()
export class UpdatemjBizAppsSonarScoreModelVersionInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    ScoreModelID?: string;

    @Field(() => Int, { nullable: true })
    VersionNumber?: number;

    @Field({ nullable: true })
    VersionLabel?: string | null;

    @Field({ nullable: true })
    ConfigSnapshotJSON?: string;

    @Field({ nullable: true })
    ChangeSummary?: string | null;

    @Field({ nullable: true })
    PublishedByUserID?: string | null;

    @Field({ nullable: true })
    PublishedAt?: Date;

    @Field(() => Boolean, { nullable: true })
    IsCurrent?: boolean;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MJ_BizApps_Sonar: Score Model Versions
//****************************************************************************
@ObjectType()
export class RunmjBizAppsSonarScoreModelVersionViewResult {
    @Field(() => [mjBizAppsSonarScoreModelVersion_])
    Results: mjBizAppsSonarScoreModelVersion_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(mjBizAppsSonarScoreModelVersion_)
export class mjBizAppsSonarScoreModelVersionResolver extends ResolverBase {
    @Query(() => RunmjBizAppsSonarScoreModelVersionViewResult)
    async RunmjBizAppsSonarScoreModelVersionViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarScoreModelVersionViewResult)
    async RunmjBizAppsSonarScoreModelVersionViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarScoreModelVersionViewResult)
    async RunmjBizAppsSonarScoreModelVersionDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MJ_BizApps_Sonar: Score Model Versions';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => mjBizAppsSonarScoreModelVersion_, { nullable: true })
    async mjBizAppsSonarScoreModelVersion(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<mjBizAppsSonarScoreModelVersion_ | null> {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Model Versions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreModelVersions')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Model Versions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Model Versions', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [mjBizAppsSonarScoreRecomputeRun_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreRecomputeRuns_ScoreModelVersionIDArray(@Root() mjbizappssonarscoremodelversion_: mjBizAppsSonarScoreModelVersion_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Recompute Runs', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreRecomputeRuns')} WHERE ${provider.QuoteIdentifier('ScoreModelVersionID')}='${mjbizappssonarscoremodelversion_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Recompute Runs', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Recompute Runs', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScore_])
    async mjBizAppsSonarMJ_BizApps_Sonar_Scores_ScoreModelVersionIDArray(@Root() mjbizappssonarscoremodelversion_: mjBizAppsSonarScoreModelVersion_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Scores', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScores')} WHERE ${provider.QuoteIdentifier('ScoreModelVersionID')}='${mjbizappssonarscoremodelversion_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Scores', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Scores', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScoreHistory_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreHistories_ScoreModelVersionIDArray(@Root() mjbizappssonarscoremodelversion_: mjBizAppsSonarScoreModelVersion_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Histories', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreHistories')} WHERE ${provider.QuoteIdentifier('ScoreModelVersionID')}='${mjbizappssonarscoremodelversion_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Histories', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Histories', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScoreModel_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreModels_CurrentVersionIDArray(@Root() mjbizappssonarscoremodelversion_: mjBizAppsSonarScoreModelVersion_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Models', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreModels')} WHERE ${provider.QuoteIdentifier('CurrentVersionID')}='${mjbizappssonarscoremodelversion_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Models', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Models', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => mjBizAppsSonarScoreModelVersion_)
    async CreatemjBizAppsSonarScoreModelVersion(
        @Arg('input', () => CreatemjBizAppsSonarScoreModelVersionInput) input: CreatemjBizAppsSonarScoreModelVersionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MJ_BizApps_Sonar: Score Model Versions', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => mjBizAppsSonarScoreModelVersion_)
    async UpdatemjBizAppsSonarScoreModelVersion(
        @Arg('input', () => UpdatemjBizAppsSonarScoreModelVersionInput) input: UpdatemjBizAppsSonarScoreModelVersionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MJ_BizApps_Sonar: Score Model Versions', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => mjBizAppsSonarScoreModelVersion_)
    async DeletemjBizAppsSonarScoreModelVersion(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MJ_BizApps_Sonar: Score Model Versions', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MJ_BizApps_Sonar: Score Models
//****************************************************************************
@ObjectType({ description: `The editable definition of one scoring model: anchor entity, scale, combine strategy, recompute policy, and bands. Many models can be active per tenant.` })
export class mjBizAppsSonarScoreModel_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field({description: `Human-readable name of the model, e.g. "2026 Renewal Risk".`}) 
    @MaxLength(200)
    Name: string;
        
    @Field({description: `Stable, unique handle for the model used in expressions and references.`}) 
    @MaxLength(100)
    Slug: string;
        
    @Field({nullable: true, description: `Optional description of what the model scores and why.`}) 
    Description?: string;
        
    @Field() 
    @MaxLength(36)
    AnchorEntityID: string;
        
    @Field({description: `Lifecycle status of the model: Draft, Active, Paused, or Archived.`}) 
    @MaxLength(20)
    Status: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    CurrentVersionID?: string;
        
    @Field(() => Float, {description: `Minimum value of the output score scale (default 0).`}) 
    ScoreScaleMin: number;
        
    @Field(() => Float, {description: `Maximum value of the output score scale (default 100).`}) 
    ScoreScaleMax: number;
        
    @Field({description: `How factor contributions combine into a score: WeightedSum, WeightedAvg, Banded, ZScoreComposite, or ExpressionDriven.`}) 
    @MaxLength(30)
    CombineStrategy: string;
        
    @Field({nullable: true, description: `For ExpressionDriven models, the formula over factor slugs used to combine contributions.`}) 
    CombineExpression?: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    BandSetID?: string;
        
    @Field({nullable: true, description: `JSON/DSL filter defining which anchor records are in scope for scoring (e.g. Status = Active).`}) 
    PopulationFilter?: string;
        
    @Field({description: `When scores recompute: Scheduled, EventDriven, OnDemand, or Hybrid.`}) 
    @MaxLength(20)
    RecomputeMode: string;
        
    @Field({nullable: true, description: `Cron expression controlling scheduled recompute, when RecomputeMode includes a schedule.`}) 
    @MaxLength(100)
    RecomputeCron?: string;
        
    @Field({description: `Defines what "now" means when resolving time windows: RunTime, EndOfPreviousDay, or Fixed.`}) 
    @MaxLength(20)
    AsOfStrategy: string;
        
    @Field(() => Boolean, {description: `When set, the model consumes cross-tenant benchmark distributions for normalization (calibration network).`}) 
    IsCalibrated: boolean;
        
    @Field(() => Int, {nullable: true, description: `Number of days used to compute the headline Delta and trend on each score.`}) 
    TrendWindowDays?: number;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    OwnerUserID?: string;
        
    @Field({nullable: true, description: `Start of the bounded time range during which the model is active (optional).`}) 
    EffectiveFrom?: Date;
        
    @Field({nullable: true, description: `End of the bounded time range during which the model is active (optional).`}) 
    EffectiveTo?: Date;
        
    @Field({nullable: true, description: `Freeform notes about the model.`}) 
    Notes?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(255)
    AnchorEntity: string;
        
    @Field({nullable: true}) 
    @MaxLength(200)
    BandSet?: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    OwnerUser?: string;
        
    @Field(() => [mjBizAppsSonarScoreHistory_])
    mjBizAppsSonarMJ_BizApps_Sonar_ScoreHistories_ScoreModelIDArray: mjBizAppsSonarScoreHistory_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_ScoreHistories
    
    @Field(() => [mjBizAppsSonarScoreBandTransition_])
    mjBizAppsSonarMJ_BizApps_Sonar_ScoreBandTransitions_ScoreModelIDArray: mjBizAppsSonarScoreBandTransition_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_ScoreBandTransitions
    
    @Field(() => [mjBizAppsSonarScoreRecomputeRun_])
    mjBizAppsSonarMJ_BizApps_Sonar_ScoreRecomputeRuns_ScoreModelIDArray: mjBizAppsSonarScoreRecomputeRun_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_ScoreRecomputeRuns
    
    @Field(() => [mjBizAppsSonarScore_])
    mjBizAppsSonarMJ_BizApps_Sonar_Scores_ScoreModelIDArray: mjBizAppsSonarScore_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_Scores
    
    @Field(() => [mjBizAppsSonarScoreModelAuditEvent_])
    mjBizAppsSonarMJ_BizApps_Sonar_ScoreModelAuditEvents_ScoreModelIDArray: mjBizAppsSonarScoreModelAuditEvent_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_ScoreModelAuditEvents
    
    @Field(() => [mjBizAppsSonarFactor_])
    mjBizAppsSonarMJ_BizApps_Sonar_Factors_ScoreModelIDArray: mjBizAppsSonarFactor_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_Factors
    
    @Field(() => [mjBizAppsSonarFactor_])
    mjBizAppsSonarMJ_BizApps_Sonar_Factors_SourceScoreModelIDArray: mjBizAppsSonarFactor_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_Factors
    
    @Field(() => [mjBizAppsSonarModelFactor_])
    mjBizAppsSonarMJ_BizApps_Sonar_ModelFactors_ScoreModelIDArray: mjBizAppsSonarModelFactor_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_ModelFactors
    
    @Field(() => [mjBizAppsSonarScoreModelVersion_])
    mjBizAppsSonarMJ_BizApps_Sonar_ScoreModelVersions_ScoreModelIDArray: mjBizAppsSonarScoreModelVersion_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_ScoreModelVersions
    
    @Field(() => [mjBizAppsSonarModelRelatedEntity_])
    mjBizAppsSonarMJ_BizApps_Sonar_ModelRelatedEntities_ScoreModelIDArray: mjBizAppsSonarModelRelatedEntity_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_ModelRelatedEntities
    
    @Field(() => [mjBizAppsSonarScoreSegment_])
    mjBizAppsSonarMJ_BizApps_Sonar_ScoreSegments_ScoreModelIDArray: mjBizAppsSonarScoreSegment_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_ScoreSegments
    
}

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Score Models
//****************************************************************************
@InputType()
export class CreatemjBizAppsSonarScoreModelInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Slug?: string;

    @Field({ nullable: true })
    Description: string | null;

    @Field({ nullable: true })
    AnchorEntityID?: string;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    CurrentVersionID: string | null;

    @Field(() => Float, { nullable: true })
    ScoreScaleMin?: number;

    @Field(() => Float, { nullable: true })
    ScoreScaleMax?: number;

    @Field({ nullable: true })
    CombineStrategy?: string;

    @Field({ nullable: true })
    CombineExpression: string | null;

    @Field({ nullable: true })
    BandSetID: string | null;

    @Field({ nullable: true })
    PopulationFilter: string | null;

    @Field({ nullable: true })
    RecomputeMode?: string;

    @Field({ nullable: true })
    RecomputeCron: string | null;

    @Field({ nullable: true })
    AsOfStrategy?: string;

    @Field(() => Boolean, { nullable: true })
    IsCalibrated?: boolean;

    @Field(() => Int, { nullable: true })
    TrendWindowDays: number | null;

    @Field({ nullable: true })
    OwnerUserID: string | null;

    @Field({ nullable: true })
    EffectiveFrom: Date | null;

    @Field({ nullable: true })
    EffectiveTo: Date | null;

    @Field({ nullable: true })
    Notes: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Score Models
//****************************************************************************
@InputType()
export class UpdatemjBizAppsSonarScoreModelInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Slug?: string;

    @Field({ nullable: true })
    Description?: string | null;

    @Field({ nullable: true })
    AnchorEntityID?: string;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    CurrentVersionID?: string | null;

    @Field(() => Float, { nullable: true })
    ScoreScaleMin?: number;

    @Field(() => Float, { nullable: true })
    ScoreScaleMax?: number;

    @Field({ nullable: true })
    CombineStrategy?: string;

    @Field({ nullable: true })
    CombineExpression?: string | null;

    @Field({ nullable: true })
    BandSetID?: string | null;

    @Field({ nullable: true })
    PopulationFilter?: string | null;

    @Field({ nullable: true })
    RecomputeMode?: string;

    @Field({ nullable: true })
    RecomputeCron?: string | null;

    @Field({ nullable: true })
    AsOfStrategy?: string;

    @Field(() => Boolean, { nullable: true })
    IsCalibrated?: boolean;

    @Field(() => Int, { nullable: true })
    TrendWindowDays?: number | null;

    @Field({ nullable: true })
    OwnerUserID?: string | null;

    @Field({ nullable: true })
    EffectiveFrom?: Date | null;

    @Field({ nullable: true })
    EffectiveTo?: Date | null;

    @Field({ nullable: true })
    Notes?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MJ_BizApps_Sonar: Score Models
//****************************************************************************
@ObjectType()
export class RunmjBizAppsSonarScoreModelViewResult {
    @Field(() => [mjBizAppsSonarScoreModel_])
    Results: mjBizAppsSonarScoreModel_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(mjBizAppsSonarScoreModel_)
export class mjBizAppsSonarScoreModelResolver extends ResolverBase {
    @Query(() => RunmjBizAppsSonarScoreModelViewResult)
    async RunmjBizAppsSonarScoreModelViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarScoreModelViewResult)
    async RunmjBizAppsSonarScoreModelViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarScoreModelViewResult)
    async RunmjBizAppsSonarScoreModelDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MJ_BizApps_Sonar: Score Models';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => mjBizAppsSonarScoreModel_, { nullable: true })
    async mjBizAppsSonarScoreModel(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<mjBizAppsSonarScoreModel_ | null> {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Models', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreModels')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Models', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Models', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [mjBizAppsSonarScoreHistory_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreHistories_ScoreModelIDArray(@Root() mjbizappssonarscoremodel_: mjBizAppsSonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Histories', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreHistories')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}='${mjbizappssonarscoremodel_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Histories', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Histories', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScoreBandTransition_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreBandTransitions_ScoreModelIDArray(@Root() mjbizappssonarscoremodel_: mjBizAppsSonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Band Transitions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreBandTransitions')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}='${mjbizappssonarscoremodel_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Band Transitions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Band Transitions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScoreRecomputeRun_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreRecomputeRuns_ScoreModelIDArray(@Root() mjbizappssonarscoremodel_: mjBizAppsSonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Recompute Runs', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreRecomputeRuns')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}='${mjbizappssonarscoremodel_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Recompute Runs', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Recompute Runs', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScore_])
    async mjBizAppsSonarMJ_BizApps_Sonar_Scores_ScoreModelIDArray(@Root() mjbizappssonarscoremodel_: mjBizAppsSonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Scores', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScores')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}='${mjbizappssonarscoremodel_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Scores', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Scores', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScoreModelAuditEvent_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreModelAuditEvents_ScoreModelIDArray(@Root() mjbizappssonarscoremodel_: mjBizAppsSonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Model Audit Events', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreModelAuditEvents')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}='${mjbizappssonarscoremodel_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Model Audit Events', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Model Audit Events', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarFactor_])
    async mjBizAppsSonarMJ_BizApps_Sonar_Factors_ScoreModelIDArray(@Root() mjbizappssonarscoremodel_: mjBizAppsSonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Factors', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwFactors')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}='${mjbizappssonarscoremodel_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Factors', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Factors', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarFactor_])
    async mjBizAppsSonarMJ_BizApps_Sonar_Factors_SourceScoreModelIDArray(@Root() mjbizappssonarscoremodel_: mjBizAppsSonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Factors', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwFactors')} WHERE ${provider.QuoteIdentifier('SourceScoreModelID')}='${mjbizappssonarscoremodel_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Factors', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Factors', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarModelFactor_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ModelFactors_ScoreModelIDArray(@Root() mjbizappssonarscoremodel_: mjBizAppsSonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Model Factors', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwModelFactors')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}='${mjbizappssonarscoremodel_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Model Factors', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Model Factors', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScoreModelVersion_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreModelVersions_ScoreModelIDArray(@Root() mjbizappssonarscoremodel_: mjBizAppsSonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Model Versions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreModelVersions')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}='${mjbizappssonarscoremodel_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Model Versions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Model Versions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarModelRelatedEntity_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ModelRelatedEntities_ScoreModelIDArray(@Root() mjbizappssonarscoremodel_: mjBizAppsSonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Model Related Entities', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwModelRelatedEntities')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}='${mjbizappssonarscoremodel_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Model Related Entities', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Model Related Entities', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScoreSegment_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreSegments_ScoreModelIDArray(@Root() mjbizappssonarscoremodel_: mjBizAppsSonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Segments', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreSegments')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}='${mjbizappssonarscoremodel_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Segments', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Segments', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => mjBizAppsSonarScoreModel_)
    async CreatemjBizAppsSonarScoreModel(
        @Arg('input', () => CreatemjBizAppsSonarScoreModelInput) input: CreatemjBizAppsSonarScoreModelInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MJ_BizApps_Sonar: Score Models', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => mjBizAppsSonarScoreModel_)
    async UpdatemjBizAppsSonarScoreModel(
        @Arg('input', () => UpdatemjBizAppsSonarScoreModelInput) input: UpdatemjBizAppsSonarScoreModelInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MJ_BizApps_Sonar: Score Models', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => mjBizAppsSonarScoreModel_)
    async DeletemjBizAppsSonarScoreModel(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MJ_BizApps_Sonar: Score Models', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MJ_BizApps_Sonar: Score Recompute Runs
//****************************************************************************
@ObjectType({ description: `One batch or event recompute pass; drives the admin health view and compute/cost metering.` })
export class mjBizAppsSonarScoreRecomputeRun_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    ScoreModelID: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    ScoreModelVersionID?: string;
        
    @Field({description: `What triggered the run: Scheduled, Event, Manual, or Backfill.`}) 
    @MaxLength(16)
    TriggerType: string;
        
    @Field({description: `Scope of the run: FullPopulation, Incremental, or SingleRecord.`}) 
    @MaxLength(16)
    Scope: string;
        
    @Field({description: `UTC timestamp when the run started.`}) 
    StartedAt: Date;
        
    @Field({nullable: true, description: `UTC timestamp when the run completed.`}) 
    CompletedAt?: Date;
        
    @Field({description: `Run status: Running, Succeeded, Failed, or PartialSuccess.`}) 
    @MaxLength(16)
    Status: string;
        
    @Field(() => Int, {nullable: true, description: `Number of records scored in the run.`}) 
    RecordsScored?: number;
        
    @Field(() => Int, {nullable: true, description: `Number of records whose score changed in the run.`}) 
    RecordsChanged?: number;
        
    @Field(() => Int, {nullable: true, description: `Number of band transitions recorded during the run.`}) 
    BandTransitions?: number;
        
    @Field(() => Int, {nullable: true, description: `Total run duration in milliseconds.`}) 
    DurationMs?: number;
        
    @Field(() => Float, {nullable: true, description: `Tokens/compute units consumed by ActionBacked factors; feeds metering and billing.`}) 
    CostUnitsConsumed?: number;
        
    @Field({nullable: true, description: `JSON capturing any errors encountered during the run.`}) 
    ErrorsJSON?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(200)
    ScoreModel: string;
        
    @Field(() => [mjBizAppsSonarScoreBandTransition_])
    mjBizAppsSonarMJ_BizApps_Sonar_ScoreBandTransitions_RecomputeRunIDArray: mjBizAppsSonarScoreBandTransition_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_ScoreBandTransitions
    
}

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Score Recompute Runs
//****************************************************************************
@InputType()
export class CreatemjBizAppsSonarScoreRecomputeRunInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    ScoreModelID?: string;

    @Field({ nullable: true })
    ScoreModelVersionID: string | null;

    @Field({ nullable: true })
    TriggerType?: string;

    @Field({ nullable: true })
    Scope?: string;

    @Field({ nullable: true })
    StartedAt?: Date;

    @Field({ nullable: true })
    CompletedAt: Date | null;

    @Field({ nullable: true })
    Status?: string;

    @Field(() => Int, { nullable: true })
    RecordsScored: number | null;

    @Field(() => Int, { nullable: true })
    RecordsChanged: number | null;

    @Field(() => Int, { nullable: true })
    BandTransitions: number | null;

    @Field(() => Int, { nullable: true })
    DurationMs: number | null;

    @Field(() => Float, { nullable: true })
    CostUnitsConsumed: number | null;

    @Field({ nullable: true })
    ErrorsJSON: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Score Recompute Runs
//****************************************************************************
@InputType()
export class UpdatemjBizAppsSonarScoreRecomputeRunInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    ScoreModelID?: string;

    @Field({ nullable: true })
    ScoreModelVersionID?: string | null;

    @Field({ nullable: true })
    TriggerType?: string;

    @Field({ nullable: true })
    Scope?: string;

    @Field({ nullable: true })
    StartedAt?: Date;

    @Field({ nullable: true })
    CompletedAt?: Date | null;

    @Field({ nullable: true })
    Status?: string;

    @Field(() => Int, { nullable: true })
    RecordsScored?: number | null;

    @Field(() => Int, { nullable: true })
    RecordsChanged?: number | null;

    @Field(() => Int, { nullable: true })
    BandTransitions?: number | null;

    @Field(() => Int, { nullable: true })
    DurationMs?: number | null;

    @Field(() => Float, { nullable: true })
    CostUnitsConsumed?: number | null;

    @Field({ nullable: true })
    ErrorsJSON?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MJ_BizApps_Sonar: Score Recompute Runs
//****************************************************************************
@ObjectType()
export class RunmjBizAppsSonarScoreRecomputeRunViewResult {
    @Field(() => [mjBizAppsSonarScoreRecomputeRun_])
    Results: mjBizAppsSonarScoreRecomputeRun_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(mjBizAppsSonarScoreRecomputeRun_)
export class mjBizAppsSonarScoreRecomputeRunResolver extends ResolverBase {
    @Query(() => RunmjBizAppsSonarScoreRecomputeRunViewResult)
    async RunmjBizAppsSonarScoreRecomputeRunViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarScoreRecomputeRunViewResult)
    async RunmjBizAppsSonarScoreRecomputeRunViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarScoreRecomputeRunViewResult)
    async RunmjBizAppsSonarScoreRecomputeRunDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MJ_BizApps_Sonar: Score Recompute Runs';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => mjBizAppsSonarScoreRecomputeRun_, { nullable: true })
    async mjBizAppsSonarScoreRecomputeRun(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<mjBizAppsSonarScoreRecomputeRun_ | null> {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Recompute Runs', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreRecomputeRuns')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Recompute Runs', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Recompute Runs', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [mjBizAppsSonarScoreBandTransition_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreBandTransitions_RecomputeRunIDArray(@Root() mjbizappssonarscorerecomputerun_: mjBizAppsSonarScoreRecomputeRun_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Band Transitions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreBandTransitions')} WHERE ${provider.QuoteIdentifier('RecomputeRunID')}='${mjbizappssonarscorerecomputerun_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Band Transitions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Band Transitions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => mjBizAppsSonarScoreRecomputeRun_)
    async CreatemjBizAppsSonarScoreRecomputeRun(
        @Arg('input', () => CreatemjBizAppsSonarScoreRecomputeRunInput) input: CreatemjBizAppsSonarScoreRecomputeRunInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MJ_BizApps_Sonar: Score Recompute Runs', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => mjBizAppsSonarScoreRecomputeRun_)
    async UpdatemjBizAppsSonarScoreRecomputeRun(
        @Arg('input', () => UpdatemjBizAppsSonarScoreRecomputeRunInput) input: UpdatemjBizAppsSonarScoreRecomputeRunInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MJ_BizApps_Sonar: Score Recompute Runs', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => mjBizAppsSonarScoreRecomputeRun_)
    async DeletemjBizAppsSonarScoreRecomputeRun(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MJ_BizApps_Sonar: Score Recompute Runs', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MJ_BizApps_Sonar: Score Segments
//****************************************************************************
@ObjectType({ description: `A saved cohort over a model\'s scored records (e.g. "At-Risk in the renewal window") that interventions key off.` })
export class mjBizAppsSonarScoreSegment_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    ScoreModelID: string;
        
    @Field({description: `Display name of the segment.`}) 
    @MaxLength(200)
    Name: string;
        
    @Field({nullable: true, description: `Optional description of who the segment captures and why.`}) 
    Description?: string;
        
    @Field({nullable: true, description: `JSON filter (Kendo-compatible) over band/score/delta/trend/window + any anchor field — defines membership.`}) 
    FilterExpression?: string;
        
    @Field(() => Boolean, {description: `When 1, membership is recomputed each run from the filter; when 0, the cohort is a fixed snapshot.`}) 
    IsDynamic: boolean;
        
    @Field(() => Int, {nullable: true, description: `Cached count of members in the segment as of LastEvaluatedAt (display/perf only).`}) 
    MemberCountCached?: number;
        
    @Field({nullable: true, description: `When the segment membership/count was last evaluated.`}) 
    LastEvaluatedAt?: Date;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(200)
    ScoreModel: string;
        
    @Field(() => [mjBizAppsSonarIntervention_])
    mjBizAppsSonarMJ_BizApps_Sonar_Interventions_ScoreSegmentIDArray: mjBizAppsSonarIntervention_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_Interventions
    
}

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Score Segments
//****************************************************************************
@InputType()
export class CreatemjBizAppsSonarScoreSegmentInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    ScoreModelID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Description: string | null;

    @Field({ nullable: true })
    FilterExpression: string | null;

    @Field(() => Boolean, { nullable: true })
    IsDynamic?: boolean;

    @Field(() => Int, { nullable: true })
    MemberCountCached: number | null;

    @Field({ nullable: true })
    LastEvaluatedAt: Date | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Score Segments
//****************************************************************************
@InputType()
export class UpdatemjBizAppsSonarScoreSegmentInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    ScoreModelID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Description?: string | null;

    @Field({ nullable: true })
    FilterExpression?: string | null;

    @Field(() => Boolean, { nullable: true })
    IsDynamic?: boolean;

    @Field(() => Int, { nullable: true })
    MemberCountCached?: number | null;

    @Field({ nullable: true })
    LastEvaluatedAt?: Date | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MJ_BizApps_Sonar: Score Segments
//****************************************************************************
@ObjectType()
export class RunmjBizAppsSonarScoreSegmentViewResult {
    @Field(() => [mjBizAppsSonarScoreSegment_])
    Results: mjBizAppsSonarScoreSegment_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(mjBizAppsSonarScoreSegment_)
export class mjBizAppsSonarScoreSegmentResolver extends ResolverBase {
    @Query(() => RunmjBizAppsSonarScoreSegmentViewResult)
    async RunmjBizAppsSonarScoreSegmentViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarScoreSegmentViewResult)
    async RunmjBizAppsSonarScoreSegmentViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarScoreSegmentViewResult)
    async RunmjBizAppsSonarScoreSegmentDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MJ_BizApps_Sonar: Score Segments';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => mjBizAppsSonarScoreSegment_, { nullable: true })
    async mjBizAppsSonarScoreSegment(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<mjBizAppsSonarScoreSegment_ | null> {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Segments', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreSegments')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Segments', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Segments', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [mjBizAppsSonarIntervention_])
    async mjBizAppsSonarMJ_BizApps_Sonar_Interventions_ScoreSegmentIDArray(@Root() mjbizappssonarscoresegment_: mjBizAppsSonarScoreSegment_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Interventions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwInterventions')} WHERE ${provider.QuoteIdentifier('ScoreSegmentID')}='${mjbizappssonarscoresegment_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Interventions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Interventions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => mjBizAppsSonarScoreSegment_)
    async CreatemjBizAppsSonarScoreSegment(
        @Arg('input', () => CreatemjBizAppsSonarScoreSegmentInput) input: CreatemjBizAppsSonarScoreSegmentInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MJ_BizApps_Sonar: Score Segments', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => mjBizAppsSonarScoreSegment_)
    async UpdatemjBizAppsSonarScoreSegment(
        @Arg('input', () => UpdatemjBizAppsSonarScoreSegmentInput) input: UpdatemjBizAppsSonarScoreSegmentInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MJ_BizApps_Sonar: Score Segments', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => mjBizAppsSonarScoreSegment_)
    async DeletemjBizAppsSonarScoreSegment(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MJ_BizApps_Sonar: Score Segments', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MJ_BizApps_Sonar: Scores
//****************************************************************************
@ObjectType({ description: `The current score for one anchor record under one model. Written back into MJ as a first-class entity.` })
export class mjBizAppsSonarScore_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    ScoreModelID: string;
        
    @Field() 
    @MaxLength(36)
    ScoreModelVersionID: string;
        
    @Field() 
    @MaxLength(36)
    AnchorEntityID: string;
        
    @Field({description: `Primary-key value of the scored anchor record, stored as a string to stay entity-agnostic.`}) 
    @MaxLength(100)
    AnchorRecordID: string;
        
    @Field({nullable: true, description: `Optional JSON representation of a composite anchor key.`}) 
    AnchorRecordKeyJSON?: string;
        
    @Field(() => Float, {nullable: true, description: `Pre-scale combined value before mapping to the output scale.`}) 
    RawScore?: number;
        
    @Field(() => Float, {nullable: true, description: `The headline score on the model's output scale (e.g. 0-100).`}) 
    NormalizedScore?: number;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    BandID?: string;
        
    @Field(() => Float, {nullable: true, description: `The normalized score from the previous computation, for delta/trend.`}) 
    PreviousNormalizedScore?: number;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    PreviousBandID?: string;
        
    @Field(() => Float, {nullable: true, description: `Change in normalized score versus the previous value over the trend window.`}) 
    Delta?: number;
        
    @Field({nullable: true, description: `Direction of recent movement: Up, Down, or Flat.`}) 
    @MaxLength(8)
    TrendDirection?: string;
        
    @Field(() => Float, {nullable: true, description: `Regression slope of the score over recent history.`}) 
    TrendSlope?: number;
        
    @Field(() => Float, {nullable: true, description: `Confidence in the score (0-1), derived from data completeness.`}) 
    Confidence?: number;
        
    @Field(() => Float, {nullable: true, description: `Fraction of factors that had data when the score was computed (0-1).`}) 
    DataCompleteness?: number;
        
    @Field({description: `UTC timestamp at which this score was computed.`}) 
    ComputedAt: Date;
        
    @Field({nullable: true, description: `The "now" the time windows resolved against for this score.`}) 
    AsOfDate?: Date;
        
    @Field({nullable: true, description: `Optional scheduled time for the next recompute of this score.`}) 
    NextRecomputeAt?: Date;
        
    @Field(() => Boolean, {description: `Indicates population statistics moved but this record has not yet been recomputed.`}) 
    IsStale: boolean;
        
    @Field({nullable: true, description: `Cached natural-language explanation of the score, refreshed on material change.`}) 
    ExplanationSummary?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(200)
    ScoreModel: string;
        
    @Field() 
    @MaxLength(255)
    AnchorEntity: string;
        
    @Field(() => [mjBizAppsSonarScoreFactorContribution_])
    mjBizAppsSonarMJ_BizApps_Sonar_ScoreFactorContributions_ScoreIDArray: mjBizAppsSonarScoreFactorContribution_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_ScoreFactorContributions
    
}

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Scores
//****************************************************************************
@InputType()
export class CreatemjBizAppsSonarScoreInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    ScoreModelID?: string;

    @Field({ nullable: true })
    ScoreModelVersionID?: string;

    @Field({ nullable: true })
    AnchorEntityID?: string;

    @Field({ nullable: true })
    AnchorRecordID?: string;

    @Field({ nullable: true })
    AnchorRecordKeyJSON: string | null;

    @Field(() => Float, { nullable: true })
    RawScore: number | null;

    @Field(() => Float, { nullable: true })
    NormalizedScore: number | null;

    @Field({ nullable: true })
    BandID: string | null;

    @Field(() => Float, { nullable: true })
    PreviousNormalizedScore: number | null;

    @Field({ nullable: true })
    PreviousBandID: string | null;

    @Field(() => Float, { nullable: true })
    Delta: number | null;

    @Field({ nullable: true })
    TrendDirection: string | null;

    @Field(() => Float, { nullable: true })
    TrendSlope: number | null;

    @Field(() => Float, { nullable: true })
    Confidence: number | null;

    @Field(() => Float, { nullable: true })
    DataCompleteness: number | null;

    @Field({ nullable: true })
    ComputedAt?: Date;

    @Field({ nullable: true })
    AsOfDate: Date | null;

    @Field({ nullable: true })
    NextRecomputeAt: Date | null;

    @Field(() => Boolean, { nullable: true })
    IsStale?: boolean;

    @Field({ nullable: true })
    ExplanationSummary: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Scores
//****************************************************************************
@InputType()
export class UpdatemjBizAppsSonarScoreInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    ScoreModelID?: string;

    @Field({ nullable: true })
    ScoreModelVersionID?: string;

    @Field({ nullable: true })
    AnchorEntityID?: string;

    @Field({ nullable: true })
    AnchorRecordID?: string;

    @Field({ nullable: true })
    AnchorRecordKeyJSON?: string | null;

    @Field(() => Float, { nullable: true })
    RawScore?: number | null;

    @Field(() => Float, { nullable: true })
    NormalizedScore?: number | null;

    @Field({ nullable: true })
    BandID?: string | null;

    @Field(() => Float, { nullable: true })
    PreviousNormalizedScore?: number | null;

    @Field({ nullable: true })
    PreviousBandID?: string | null;

    @Field(() => Float, { nullable: true })
    Delta?: number | null;

    @Field({ nullable: true })
    TrendDirection?: string | null;

    @Field(() => Float, { nullable: true })
    TrendSlope?: number | null;

    @Field(() => Float, { nullable: true })
    Confidence?: number | null;

    @Field(() => Float, { nullable: true })
    DataCompleteness?: number | null;

    @Field({ nullable: true })
    ComputedAt?: Date;

    @Field({ nullable: true })
    AsOfDate?: Date | null;

    @Field({ nullable: true })
    NextRecomputeAt?: Date | null;

    @Field(() => Boolean, { nullable: true })
    IsStale?: boolean;

    @Field({ nullable: true })
    ExplanationSummary?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MJ_BizApps_Sonar: Scores
//****************************************************************************
@ObjectType()
export class RunmjBizAppsSonarScoreViewResult {
    @Field(() => [mjBizAppsSonarScore_])
    Results: mjBizAppsSonarScore_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(mjBizAppsSonarScore_)
export class mjBizAppsSonarScoreResolver extends ResolverBase {
    @Query(() => RunmjBizAppsSonarScoreViewResult)
    async RunmjBizAppsSonarScoreViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarScoreViewResult)
    async RunmjBizAppsSonarScoreViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarScoreViewResult)
    async RunmjBizAppsSonarScoreDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MJ_BizApps_Sonar: Scores';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => mjBizAppsSonarScore_, { nullable: true })
    async mjBizAppsSonarScore(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<mjBizAppsSonarScore_ | null> {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Scores', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScores')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Scores', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Scores', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [mjBizAppsSonarScoreFactorContribution_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreFactorContributions_ScoreIDArray(@Root() mjbizappssonarscore_: mjBizAppsSonarScore_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Factor Contributions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreFactorContributions')} WHERE ${provider.QuoteIdentifier('ScoreID')}='${mjbizappssonarscore_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Factor Contributions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Factor Contributions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => mjBizAppsSonarScore_)
    async CreatemjBizAppsSonarScore(
        @Arg('input', () => CreatemjBizAppsSonarScoreInput) input: CreatemjBizAppsSonarScoreInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MJ_BizApps_Sonar: Scores', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => mjBizAppsSonarScore_)
    async UpdatemjBizAppsSonarScore(
        @Arg('input', () => UpdatemjBizAppsSonarScoreInput) input: UpdatemjBizAppsSonarScoreInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MJ_BizApps_Sonar: Scores', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => mjBizAppsSonarScore_)
    async DeletemjBizAppsSonarScore(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MJ_BizApps_Sonar: Scores', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MJ_BizApps_Sonar: Time Windows
//****************************************************************************
@ObjectType({ description: `A reusable, first-class time window used when evaluating factors (e.g. trailing 90 days, current term, renewal window -90d).` })
export class mjBizAppsSonarTimeWindow_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field({description: `Display name of the time window.`}) 
    @MaxLength(120)
    Name: string;
        
    @Field({description: `Window type: Rolling, Calendar, SinceEvent, RenewalRelative, or AllTime.`}) 
    @MaxLength(20)
    WindowType: string;
        
    @Field(() => Int, {nullable: true, description: `Window length in days, for Rolling/Calendar windows.`}) 
    LengthDays?: number;
        
    @Field(() => Int, {nullable: true, description: `Window length in months, for Rolling/Calendar windows.`}) 
    LengthMonths?: number;
        
    @Field({nullable: true, description: `For RenewalRelative/SinceEvent windows, the date field on the anchor record the window is measured from (e.g. RenewalDate).`}) 
    @MaxLength(200)
    AnchorDateField?: string;
        
    @Field(() => Int, {nullable: true, description: `Offset in days applied to the window start relative to the anchor date.`}) 
    OffsetDays?: number;
        
    @Field({nullable: true, description: `Optional description of the time window.`}) 
    Description?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field(() => [mjBizAppsSonarFactor_])
    mjBizAppsSonarMJ_BizApps_Sonar_Factors_TimeWindowIDArray: mjBizAppsSonarFactor_[]; // Link to mjBizAppsSonarMJ_BizApps_Sonar_Factors
    
}

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Time Windows
//****************************************************************************
@InputType()
export class CreatemjBizAppsSonarTimeWindowInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    WindowType?: string;

    @Field(() => Int, { nullable: true })
    LengthDays: number | null;

    @Field(() => Int, { nullable: true })
    LengthMonths: number | null;

    @Field({ nullable: true })
    AnchorDateField: string | null;

    @Field(() => Int, { nullable: true })
    OffsetDays: number | null;

    @Field({ nullable: true })
    Description: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MJ_BizApps_Sonar: Time Windows
//****************************************************************************
@InputType()
export class UpdatemjBizAppsSonarTimeWindowInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    WindowType?: string;

    @Field(() => Int, { nullable: true })
    LengthDays?: number | null;

    @Field(() => Int, { nullable: true })
    LengthMonths?: number | null;

    @Field({ nullable: true })
    AnchorDateField?: string | null;

    @Field(() => Int, { nullable: true })
    OffsetDays?: number | null;

    @Field({ nullable: true })
    Description?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MJ_BizApps_Sonar: Time Windows
//****************************************************************************
@ObjectType()
export class RunmjBizAppsSonarTimeWindowViewResult {
    @Field(() => [mjBizAppsSonarTimeWindow_])
    Results: mjBizAppsSonarTimeWindow_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(mjBizAppsSonarTimeWindow_)
export class mjBizAppsSonarTimeWindowResolver extends ResolverBase {
    @Query(() => RunmjBizAppsSonarTimeWindowViewResult)
    async RunmjBizAppsSonarTimeWindowViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarTimeWindowViewResult)
    async RunmjBizAppsSonarTimeWindowViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmjBizAppsSonarTimeWindowViewResult)
    async RunmjBizAppsSonarTimeWindowDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MJ_BizApps_Sonar: Time Windows';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => mjBizAppsSonarTimeWindow_, { nullable: true })
    async mjBizAppsSonarTimeWindow(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<mjBizAppsSonarTimeWindow_ | null> {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Time Windows', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwTimeWindows')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Time Windows', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Time Windows', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [mjBizAppsSonarFactor_])
    async mjBizAppsSonarMJ_BizApps_Sonar_Factors_TimeWindowIDArray(@Root() mjbizappssonartimewindow_: mjBizAppsSonarTimeWindow_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Factors', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwFactors')} WHERE ${provider.QuoteIdentifier('TimeWindowID')}='${mjbizappssonartimewindow_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Factors', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Factors', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => mjBizAppsSonarTimeWindow_)
    async CreatemjBizAppsSonarTimeWindow(
        @Arg('input', () => CreatemjBizAppsSonarTimeWindowInput) input: CreatemjBizAppsSonarTimeWindowInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MJ_BizApps_Sonar: Time Windows', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => mjBizAppsSonarTimeWindow_)
    async UpdatemjBizAppsSonarTimeWindow(
        @Arg('input', () => UpdatemjBizAppsSonarTimeWindowInput) input: UpdatemjBizAppsSonarTimeWindowInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MJ_BizApps_Sonar: Time Windows', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => mjBizAppsSonarTimeWindow_)
    async DeletemjBizAppsSonarTimeWindow(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MJ_BizApps_Sonar: Time Windows', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Organizations
//****************************************************************************
@ObjectType()
export class AssociationDemoOrganization_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(255)
    Name: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    Industry?: string;
        
    @Field(() => Int, {nullable: true}) 
    EmployeeCount?: number;
        
    @Field(() => Float, {nullable: true}) 
    AnnualRevenue?: number;
        
    @Field(() => Float, {nullable: true}) 
    MarketCapitalization?: number;
        
    @Field({nullable: true}) 
    @MaxLength(10)
    TickerSymbol?: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    Exchange?: string;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    Website?: string;
        
    @Field({nullable: true}) 
    Description?: string;
        
    @Field(() => Int, {nullable: true}) 
    YearFounded?: number;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    City?: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    State?: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    Country?: string;
        
    @Field({nullable: true}) 
    @MaxLength(20)
    PostalCode?: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    Phone?: string;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    LogoURL?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field(() => [AssociationDemoMember_])
    AssociationDemoMembers__AssociationDemo_OrganizationIDArray: AssociationDemoMember_[]; // Link to AssociationDemoMembers__AssociationDemo
    
}

//****************************************************************************
// INPUT TYPE for Organizations
//****************************************************************************
@InputType()
export class CreateAssociationDemoOrganizationInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Industry: string | null;

    @Field(() => Int, { nullable: true })
    EmployeeCount: number | null;

    @Field(() => Float, { nullable: true })
    AnnualRevenue: number | null;

    @Field(() => Float, { nullable: true })
    MarketCapitalization: number | null;

    @Field({ nullable: true })
    TickerSymbol: string | null;

    @Field({ nullable: true })
    Exchange: string | null;

    @Field({ nullable: true })
    Website: string | null;

    @Field({ nullable: true })
    Description: string | null;

    @Field(() => Int, { nullable: true })
    YearFounded: number | null;

    @Field({ nullable: true })
    City: string | null;

    @Field({ nullable: true })
    State: string | null;

    @Field({ nullable: true })
    Country?: string | null;

    @Field({ nullable: true })
    PostalCode: string | null;

    @Field({ nullable: true })
    Phone: string | null;

    @Field({ nullable: true })
    LogoURL: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Organizations
//****************************************************************************
@InputType()
export class UpdateAssociationDemoOrganizationInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Industry?: string | null;

    @Field(() => Int, { nullable: true })
    EmployeeCount?: number | null;

    @Field(() => Float, { nullable: true })
    AnnualRevenue?: number | null;

    @Field(() => Float, { nullable: true })
    MarketCapitalization?: number | null;

    @Field({ nullable: true })
    TickerSymbol?: string | null;

    @Field({ nullable: true })
    Exchange?: string | null;

    @Field({ nullable: true })
    Website?: string | null;

    @Field({ nullable: true })
    Description?: string | null;

    @Field(() => Int, { nullable: true })
    YearFounded?: number | null;

    @Field({ nullable: true })
    City?: string | null;

    @Field({ nullable: true })
    State?: string | null;

    @Field({ nullable: true })
    Country?: string | null;

    @Field({ nullable: true })
    PostalCode?: string | null;

    @Field({ nullable: true })
    Phone?: string | null;

    @Field({ nullable: true })
    LogoURL?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Organizations
//****************************************************************************
@ObjectType()
export class RunAssociationDemoOrganizationViewResult {
    @Field(() => [AssociationDemoOrganization_])
    Results: AssociationDemoOrganization_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoOrganization_)
export class AssociationDemoOrganizationResolver extends ResolverBase {
    @Query(() => RunAssociationDemoOrganizationViewResult)
    async RunAssociationDemoOrganizationViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoOrganizationViewResult)
    async RunAssociationDemoOrganizationViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoOrganizationViewResult)
    async RunAssociationDemoOrganizationDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Organizations';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoOrganization_, { nullable: true })
    async AssociationDemoOrganization(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoOrganization_ | null> {
        this.CheckUserReadPermissions('Organizations', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwOrganizations')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Organizations', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Organizations', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoMember_])
    async AssociationDemoMembers__AssociationDemo_OrganizationIDArray(@Root() associationdemoorganization_: AssociationDemoOrganization_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Members__AssociationDemo', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwMembers__AssociationDemo')} WHERE ${provider.QuoteIdentifier('OrganizationID')}='${associationdemoorganization_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Members__AssociationDemo', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Members__AssociationDemo', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoOrganization_)
    async CreateAssociationDemoOrganization(
        @Arg('input', () => CreateAssociationDemoOrganizationInput) input: CreateAssociationDemoOrganizationInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Organizations', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoOrganization_)
    async UpdateAssociationDemoOrganization(
        @Arg('input', () => UpdateAssociationDemoOrganizationInput) input: UpdateAssociationDemoOrganizationInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Organizations', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoOrganization_)
    async DeleteAssociationDemoOrganization(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Organizations', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Payments
//****************************************************************************
@ObjectType()
export class membershipPayment_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    MemberID: string;
        
    @Field(() => Float) 
    Amount: number;
        
    @Field() 
    PaidOn: Date;
        
    @Field() 
    @MaxLength(50)
    PaymentType: string;
        
    @Field(() => Int, {nullable: true}) 
    TermYear?: number;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
}

//****************************************************************************
// INPUT TYPE for Payments
//****************************************************************************
@InputType()
export class CreatemembershipPaymentInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field(() => Float, { nullable: true })
    Amount?: number;

    @Field({ nullable: true })
    PaidOn?: Date;

    @Field({ nullable: true })
    PaymentType?: string;

    @Field(() => Int, { nullable: true })
    TermYear: number | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Payments
//****************************************************************************
@InputType()
export class UpdatemembershipPaymentInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field(() => Float, { nullable: true })
    Amount?: number;

    @Field({ nullable: true })
    PaidOn?: Date;

    @Field({ nullable: true })
    PaymentType?: string;

    @Field(() => Int, { nullable: true })
    TermYear?: number | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Payments
//****************************************************************************
@ObjectType()
export class RunmembershipPaymentViewResult {
    @Field(() => [membershipPayment_])
    Results: membershipPayment_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(membershipPayment_)
export class membershipPaymentResolver extends ResolverBase {
    @Query(() => RunmembershipPaymentViewResult)
    async RunmembershipPaymentViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmembershipPaymentViewResult)
    async RunmembershipPaymentViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmembershipPaymentViewResult)
    async RunmembershipPaymentDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Payments';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => membershipPayment_, { nullable: true })
    async membershipPayment(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<membershipPayment_ | null> {
        this.CheckUserReadPermissions('Payments', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('membership', 'vwPayments')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Payments', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Payments', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => membershipPayment_)
    async CreatemembershipPayment(
        @Arg('input', () => CreatemembershipPaymentInput) input: CreatemembershipPaymentInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Payments', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => membershipPayment_)
    async UpdatemembershipPayment(
        @Arg('input', () => UpdatemembershipPaymentInput) input: UpdatemembershipPaymentInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Payments', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => membershipPayment_)
    async DeletemembershipPayment(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Payments', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Payments__AssociationDemo
//****************************************************************************
@ObjectType()
export class AssociationDemoPayment_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    InvoiceID: string;
        
    @Field() 
    PaymentDate: Date;
        
    @Field(() => Float) 
    Amount: number;
        
    @Field() 
    @MaxLength(50)
    PaymentMethod: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    TransactionID?: string;
        
    @Field() 
    @MaxLength(20)
    Status: string;
        
    @Field({nullable: true}) 
    ProcessedDate?: Date;
        
    @Field({nullable: true}) 
    FailureReason?: string;
        
    @Field({nullable: true}) 
    Notes?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
}

//****************************************************************************
// INPUT TYPE for Payments__AssociationDemo
//****************************************************************************
@InputType()
export class CreateAssociationDemoPaymentInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    InvoiceID?: string;

    @Field({ nullable: true })
    PaymentDate?: Date;

    @Field(() => Float, { nullable: true })
    Amount?: number;

    @Field({ nullable: true })
    PaymentMethod?: string;

    @Field({ nullable: true })
    TransactionID: string | null;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    ProcessedDate: Date | null;

    @Field({ nullable: true })
    FailureReason: string | null;

    @Field({ nullable: true })
    Notes: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Payments__AssociationDemo
//****************************************************************************
@InputType()
export class UpdateAssociationDemoPaymentInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    InvoiceID?: string;

    @Field({ nullable: true })
    PaymentDate?: Date;

    @Field(() => Float, { nullable: true })
    Amount?: number;

    @Field({ nullable: true })
    PaymentMethod?: string;

    @Field({ nullable: true })
    TransactionID?: string | null;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    ProcessedDate?: Date | null;

    @Field({ nullable: true })
    FailureReason?: string | null;

    @Field({ nullable: true })
    Notes?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Payments__AssociationDemo
//****************************************************************************
@ObjectType()
export class RunAssociationDemoPaymentViewResult {
    @Field(() => [AssociationDemoPayment_])
    Results: AssociationDemoPayment_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoPayment_)
export class AssociationDemoPaymentResolver extends ResolverBase {
    @Query(() => RunAssociationDemoPaymentViewResult)
    async RunAssociationDemoPaymentViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoPaymentViewResult)
    async RunAssociationDemoPaymentViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoPaymentViewResult)
    async RunAssociationDemoPaymentDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Payments__AssociationDemo';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoPayment_, { nullable: true })
    async AssociationDemoPayment(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoPayment_ | null> {
        this.CheckUserReadPermissions('Payments__AssociationDemo', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwPayments__AssociationDemo')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Payments__AssociationDemo', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Payments__AssociationDemo', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoPayment_)
    async CreateAssociationDemoPayment(
        @Arg('input', () => CreateAssociationDemoPaymentInput) input: CreateAssociationDemoPaymentInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Payments__AssociationDemo', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoPayment_)
    async UpdateAssociationDemoPayment(
        @Arg('input', () => UpdateAssociationDemoPaymentInput) input: UpdateAssociationDemoPaymentInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Payments__AssociationDemo', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoPayment_)
    async DeleteAssociationDemoPayment(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Payments__AssociationDemo', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Policy Positions
//****************************************************************************
@ObjectType()
export class AssociationDemoPolicyPosition_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    LegislativeIssueID: string;
        
    @Field() 
    @MaxLength(30)
    Position: string;
        
    @Field() 
    PositionStatement: string;
        
    @Field({nullable: true}) 
    Rationale?: string;
        
    @Field() 
    AdoptedDate: Date;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    AdoptedBy?: string;
        
    @Field({nullable: true}) 
    ExpirationDate?: Date;
        
    @Field({nullable: true}) 
    @MaxLength(20)
    Priority?: string;
        
    @Field(() => Boolean, {nullable: true}) 
    IsPublic?: boolean;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    DocumentURL?: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    ContactPerson?: string;
        
    @Field({nullable: true}) 
    LastReviewedDate?: Date;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
}

//****************************************************************************
// INPUT TYPE for Policy Positions
//****************************************************************************
@InputType()
export class CreateAssociationDemoPolicyPositionInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    LegislativeIssueID?: string;

    @Field({ nullable: true })
    Position?: string;

    @Field({ nullable: true })
    PositionStatement?: string;

    @Field({ nullable: true })
    Rationale: string | null;

    @Field({ nullable: true })
    AdoptedDate?: Date;

    @Field({ nullable: true })
    AdoptedBy: string | null;

    @Field({ nullable: true })
    ExpirationDate: Date | null;

    @Field({ nullable: true })
    Priority: string | null;

    @Field(() => Boolean, { nullable: true })
    IsPublic?: boolean | null;

    @Field({ nullable: true })
    DocumentURL: string | null;

    @Field({ nullable: true })
    ContactPerson: string | null;

    @Field({ nullable: true })
    LastReviewedDate: Date | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Policy Positions
//****************************************************************************
@InputType()
export class UpdateAssociationDemoPolicyPositionInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    LegislativeIssueID?: string;

    @Field({ nullable: true })
    Position?: string;

    @Field({ nullable: true })
    PositionStatement?: string;

    @Field({ nullable: true })
    Rationale?: string | null;

    @Field({ nullable: true })
    AdoptedDate?: Date;

    @Field({ nullable: true })
    AdoptedBy?: string | null;

    @Field({ nullable: true })
    ExpirationDate?: Date | null;

    @Field({ nullable: true })
    Priority?: string | null;

    @Field(() => Boolean, { nullable: true })
    IsPublic?: boolean | null;

    @Field({ nullable: true })
    DocumentURL?: string | null;

    @Field({ nullable: true })
    ContactPerson?: string | null;

    @Field({ nullable: true })
    LastReviewedDate?: Date | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Policy Positions
//****************************************************************************
@ObjectType()
export class RunAssociationDemoPolicyPositionViewResult {
    @Field(() => [AssociationDemoPolicyPosition_])
    Results: AssociationDemoPolicyPosition_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoPolicyPosition_)
export class AssociationDemoPolicyPositionResolver extends ResolverBase {
    @Query(() => RunAssociationDemoPolicyPositionViewResult)
    async RunAssociationDemoPolicyPositionViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoPolicyPositionViewResult)
    async RunAssociationDemoPolicyPositionViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoPolicyPositionViewResult)
    async RunAssociationDemoPolicyPositionDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Policy Positions';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoPolicyPosition_, { nullable: true })
    async AssociationDemoPolicyPosition(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoPolicyPosition_ | null> {
        this.CheckUserReadPermissions('Policy Positions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwPolicyPositions')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Policy Positions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Policy Positions', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoPolicyPosition_)
    async CreateAssociationDemoPolicyPosition(
        @Arg('input', () => CreateAssociationDemoPolicyPositionInput) input: CreateAssociationDemoPolicyPositionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Policy Positions', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoPolicyPosition_)
    async UpdateAssociationDemoPolicyPosition(
        @Arg('input', () => UpdateAssociationDemoPolicyPositionInput) input: UpdateAssociationDemoPolicyPositionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Policy Positions', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoPolicyPosition_)
    async DeleteAssociationDemoPolicyPosition(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Policy Positions', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Post Attachments
//****************************************************************************
@ObjectType()
export class AssociationDemoPostAttachment_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    PostID: string;
        
    @Field() 
    @MaxLength(255)
    FileName: string;
        
    @Field() 
    @MaxLength(1000)
    FileURL: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    FileType?: string;
        
    @Field(() => Int, {nullable: true}) 
    FileSizeBytes?: number;
        
    @Field() 
    UploadedDate: Date;
        
    @Field() 
    @MaxLength(36)
    UploadedByID: string;
        
    @Field(() => Int, {nullable: true}) 
    DownloadCount?: number;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
}

//****************************************************************************
// INPUT TYPE for Post Attachments
//****************************************************************************
@InputType()
export class CreateAssociationDemoPostAttachmentInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    PostID?: string;

    @Field({ nullable: true })
    FileName?: string;

    @Field({ nullable: true })
    FileURL?: string;

    @Field({ nullable: true })
    FileType: string | null;

    @Field(() => Int, { nullable: true })
    FileSizeBytes: number | null;

    @Field({ nullable: true })
    UploadedDate?: Date;

    @Field({ nullable: true })
    UploadedByID?: string;

    @Field(() => Int, { nullable: true })
    DownloadCount?: number | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Post Attachments
//****************************************************************************
@InputType()
export class UpdateAssociationDemoPostAttachmentInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    PostID?: string;

    @Field({ nullable: true })
    FileName?: string;

    @Field({ nullable: true })
    FileURL?: string;

    @Field({ nullable: true })
    FileType?: string | null;

    @Field(() => Int, { nullable: true })
    FileSizeBytes?: number | null;

    @Field({ nullable: true })
    UploadedDate?: Date;

    @Field({ nullable: true })
    UploadedByID?: string;

    @Field(() => Int, { nullable: true })
    DownloadCount?: number | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Post Attachments
//****************************************************************************
@ObjectType()
export class RunAssociationDemoPostAttachmentViewResult {
    @Field(() => [AssociationDemoPostAttachment_])
    Results: AssociationDemoPostAttachment_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoPostAttachment_)
export class AssociationDemoPostAttachmentResolver extends ResolverBase {
    @Query(() => RunAssociationDemoPostAttachmentViewResult)
    async RunAssociationDemoPostAttachmentViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoPostAttachmentViewResult)
    async RunAssociationDemoPostAttachmentViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoPostAttachmentViewResult)
    async RunAssociationDemoPostAttachmentDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Post Attachments';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoPostAttachment_, { nullable: true })
    async AssociationDemoPostAttachment(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoPostAttachment_ | null> {
        this.CheckUserReadPermissions('Post Attachments', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwPostAttachments')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Post Attachments', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Post Attachments', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoPostAttachment_)
    async CreateAssociationDemoPostAttachment(
        @Arg('input', () => CreateAssociationDemoPostAttachmentInput) input: CreateAssociationDemoPostAttachmentInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Post Attachments', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoPostAttachment_)
    async UpdateAssociationDemoPostAttachment(
        @Arg('input', () => UpdateAssociationDemoPostAttachmentInput) input: UpdateAssociationDemoPostAttachmentInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Post Attachments', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoPostAttachment_)
    async DeleteAssociationDemoPostAttachment(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Post Attachments', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Post Reactions
//****************************************************************************
@ObjectType()
export class AssociationDemoPostReaction_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    PostID: string;
        
    @Field() 
    @MaxLength(36)
    MemberID: string;
        
    @Field() 
    @MaxLength(50)
    ReactionType: string;
        
    @Field() 
    CreatedDate: Date;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
}

//****************************************************************************
// INPUT TYPE for Post Reactions
//****************************************************************************
@InputType()
export class CreateAssociationDemoPostReactionInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    PostID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    ReactionType?: string;

    @Field({ nullable: true })
    CreatedDate?: Date;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Post Reactions
//****************************************************************************
@InputType()
export class UpdateAssociationDemoPostReactionInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    PostID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    ReactionType?: string;

    @Field({ nullable: true })
    CreatedDate?: Date;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Post Reactions
//****************************************************************************
@ObjectType()
export class RunAssociationDemoPostReactionViewResult {
    @Field(() => [AssociationDemoPostReaction_])
    Results: AssociationDemoPostReaction_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoPostReaction_)
export class AssociationDemoPostReactionResolver extends ResolverBase {
    @Query(() => RunAssociationDemoPostReactionViewResult)
    async RunAssociationDemoPostReactionViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoPostReactionViewResult)
    async RunAssociationDemoPostReactionViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoPostReactionViewResult)
    async RunAssociationDemoPostReactionDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Post Reactions';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoPostReaction_, { nullable: true })
    async AssociationDemoPostReaction(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoPostReaction_ | null> {
        this.CheckUserReadPermissions('Post Reactions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwPostReactions')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Post Reactions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Post Reactions', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoPostReaction_)
    async CreateAssociationDemoPostReaction(
        @Arg('input', () => CreateAssociationDemoPostReactionInput) input: CreateAssociationDemoPostReactionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Post Reactions', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoPostReaction_)
    async UpdateAssociationDemoPostReaction(
        @Arg('input', () => UpdateAssociationDemoPostReactionInput) input: UpdateAssociationDemoPostReactionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Post Reactions', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoPostReaction_)
    async DeleteAssociationDemoPostReaction(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Post Reactions', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Post Tags
//****************************************************************************
@ObjectType()
export class AssociationDemoPostTag_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    PostID: string;
        
    @Field() 
    @MaxLength(100)
    TagName: string;
        
    @Field() 
    CreatedDate: Date;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
}

//****************************************************************************
// INPUT TYPE for Post Tags
//****************************************************************************
@InputType()
export class CreateAssociationDemoPostTagInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    PostID?: string;

    @Field({ nullable: true })
    TagName?: string;

    @Field({ nullable: true })
    CreatedDate?: Date;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Post Tags
//****************************************************************************
@InputType()
export class UpdateAssociationDemoPostTagInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    PostID?: string;

    @Field({ nullable: true })
    TagName?: string;

    @Field({ nullable: true })
    CreatedDate?: Date;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Post Tags
//****************************************************************************
@ObjectType()
export class RunAssociationDemoPostTagViewResult {
    @Field(() => [AssociationDemoPostTag_])
    Results: AssociationDemoPostTag_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoPostTag_)
export class AssociationDemoPostTagResolver extends ResolverBase {
    @Query(() => RunAssociationDemoPostTagViewResult)
    async RunAssociationDemoPostTagViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoPostTagViewResult)
    async RunAssociationDemoPostTagViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoPostTagViewResult)
    async RunAssociationDemoPostTagDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Post Tags';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoPostTag_, { nullable: true })
    async AssociationDemoPostTag(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoPostTag_ | null> {
        this.CheckUserReadPermissions('Post Tags', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwPostTags')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Post Tags', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Post Tags', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoPostTag_)
    async CreateAssociationDemoPostTag(
        @Arg('input', () => CreateAssociationDemoPostTagInput) input: CreateAssociationDemoPostTagInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Post Tags', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoPostTag_)
    async UpdateAssociationDemoPostTag(
        @Arg('input', () => UpdateAssociationDemoPostTagInput) input: UpdateAssociationDemoPostTagInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Post Tags', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoPostTag_)
    async DeleteAssociationDemoPostTag(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Post Tags', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Product Awards
//****************************************************************************
@ObjectType()
export class AssociationDemoProductAward_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    ProductID: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    CompetitionID?: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    CompetitionEntryID?: string;
        
    @Field() 
    @MaxLength(255)
    AwardName: string;
        
    @Field() 
    @MaxLength(100)
    AwardLevel: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    AwardingOrganization?: string;
        
    @Field() 
    AwardDate: Date;
        
    @Field(() => Int) 
    Year: number;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    Category?: string;
        
    @Field(() => Float, {nullable: true}) 
    Score?: number;
        
    @Field({nullable: true}) 
    Description?: string;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    CertificateURL?: string;
        
    @Field(() => Boolean, {nullable: true}) 
    IsDisplayed?: boolean;
        
    @Field(() => Int, {nullable: true}) 
    DisplayOrder?: number;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(255)
    Product: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    Competition?: string;
        
}

//****************************************************************************
// INPUT TYPE for Product Awards
//****************************************************************************
@InputType()
export class CreateAssociationDemoProductAwardInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    ProductID?: string;

    @Field({ nullable: true })
    CompetitionID: string | null;

    @Field({ nullable: true })
    CompetitionEntryID: string | null;

    @Field({ nullable: true })
    AwardName?: string;

    @Field({ nullable: true })
    AwardLevel?: string;

    @Field({ nullable: true })
    AwardingOrganization: string | null;

    @Field({ nullable: true })
    AwardDate?: Date;

    @Field(() => Int, { nullable: true })
    Year?: number;

    @Field({ nullable: true })
    Category: string | null;

    @Field(() => Float, { nullable: true })
    Score: number | null;

    @Field({ nullable: true })
    Description: string | null;

    @Field({ nullable: true })
    CertificateURL: string | null;

    @Field(() => Boolean, { nullable: true })
    IsDisplayed?: boolean | null;

    @Field(() => Int, { nullable: true })
    DisplayOrder?: number | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Product Awards
//****************************************************************************
@InputType()
export class UpdateAssociationDemoProductAwardInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    ProductID?: string;

    @Field({ nullable: true })
    CompetitionID?: string | null;

    @Field({ nullable: true })
    CompetitionEntryID?: string | null;

    @Field({ nullable: true })
    AwardName?: string;

    @Field({ nullable: true })
    AwardLevel?: string;

    @Field({ nullable: true })
    AwardingOrganization?: string | null;

    @Field({ nullable: true })
    AwardDate?: Date;

    @Field(() => Int, { nullable: true })
    Year?: number;

    @Field({ nullable: true })
    Category?: string | null;

    @Field(() => Float, { nullable: true })
    Score?: number | null;

    @Field({ nullable: true })
    Description?: string | null;

    @Field({ nullable: true })
    CertificateURL?: string | null;

    @Field(() => Boolean, { nullable: true })
    IsDisplayed?: boolean | null;

    @Field(() => Int, { nullable: true })
    DisplayOrder?: number | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Product Awards
//****************************************************************************
@ObjectType()
export class RunAssociationDemoProductAwardViewResult {
    @Field(() => [AssociationDemoProductAward_])
    Results: AssociationDemoProductAward_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoProductAward_)
export class AssociationDemoProductAwardResolver extends ResolverBase {
    @Query(() => RunAssociationDemoProductAwardViewResult)
    async RunAssociationDemoProductAwardViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoProductAwardViewResult)
    async RunAssociationDemoProductAwardViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoProductAwardViewResult)
    async RunAssociationDemoProductAwardDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Product Awards';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoProductAward_, { nullable: true })
    async AssociationDemoProductAward(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoProductAward_ | null> {
        this.CheckUserReadPermissions('Product Awards', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwProductAwards')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Product Awards', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Product Awards', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoProductAward_)
    async CreateAssociationDemoProductAward(
        @Arg('input', () => CreateAssociationDemoProductAwardInput) input: CreateAssociationDemoProductAwardInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Product Awards', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoProductAward_)
    async UpdateAssociationDemoProductAward(
        @Arg('input', () => UpdateAssociationDemoProductAwardInput) input: UpdateAssociationDemoProductAwardInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Product Awards', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoProductAward_)
    async DeleteAssociationDemoProductAward(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Product Awards', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Product Categories
//****************************************************************************
@ObjectType()
export class AssociationDemoProductCategory_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(255)
    Name: string;
        
    @Field({nullable: true}) 
    Description?: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    ParentCategoryID?: string;
        
    @Field(() => Int, {nullable: true}) 
    DisplayOrder?: number;
        
    @Field(() => Boolean, {nullable: true}) 
    IsActive?: boolean;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    ImageURL?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    ParentCategory?: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    RootParentCategoryID?: string;
        
    @Field(() => [AssociationDemoProductCategory_])
    AssociationDemoProductCategories_ParentCategoryIDArray: AssociationDemoProductCategory_[]; // Link to AssociationDemoProductCategories
    
    @Field(() => [AssociationDemoProduct_])
    AssociationDemoProducts_CategoryIDArray: AssociationDemoProduct_[]; // Link to AssociationDemoProducts
    
    @Field(() => [AssociationDemoCompetitionEntry_])
    AssociationDemoCompetitionEntries_CategoryIDArray: AssociationDemoCompetitionEntry_[]; // Link to AssociationDemoCompetitionEntries
    
}

//****************************************************************************
// INPUT TYPE for Product Categories
//****************************************************************************
@InputType()
export class CreateAssociationDemoProductCategoryInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Description: string | null;

    @Field({ nullable: true })
    ParentCategoryID: string | null;

    @Field(() => Int, { nullable: true })
    DisplayOrder?: number | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean | null;

    @Field({ nullable: true })
    ImageURL: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Product Categories
//****************************************************************************
@InputType()
export class UpdateAssociationDemoProductCategoryInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Description?: string | null;

    @Field({ nullable: true })
    ParentCategoryID?: string | null;

    @Field(() => Int, { nullable: true })
    DisplayOrder?: number | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean | null;

    @Field({ nullable: true })
    ImageURL?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Product Categories
//****************************************************************************
@ObjectType()
export class RunAssociationDemoProductCategoryViewResult {
    @Field(() => [AssociationDemoProductCategory_])
    Results: AssociationDemoProductCategory_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoProductCategory_)
export class AssociationDemoProductCategoryResolver extends ResolverBase {
    @Query(() => RunAssociationDemoProductCategoryViewResult)
    async RunAssociationDemoProductCategoryViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoProductCategoryViewResult)
    async RunAssociationDemoProductCategoryViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoProductCategoryViewResult)
    async RunAssociationDemoProductCategoryDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Product Categories';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoProductCategory_, { nullable: true })
    async AssociationDemoProductCategory(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoProductCategory_ | null> {
        this.CheckUserReadPermissions('Product Categories', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwProductCategories')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Product Categories', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Product Categories', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoProductCategory_])
    async AssociationDemoProductCategories_ParentCategoryIDArray(@Root() associationdemoproductcategory_: AssociationDemoProductCategory_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Product Categories', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwProductCategories')} WHERE ${provider.QuoteIdentifier('ParentCategoryID')}='${associationdemoproductcategory_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Product Categories', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Product Categories', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoProduct_])
    async AssociationDemoProducts_CategoryIDArray(@Root() associationdemoproductcategory_: AssociationDemoProductCategory_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Products', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwProducts')} WHERE ${provider.QuoteIdentifier('CategoryID')}='${associationdemoproductcategory_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Products', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Products', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoCompetitionEntry_])
    async AssociationDemoCompetitionEntries_CategoryIDArray(@Root() associationdemoproductcategory_: AssociationDemoProductCategory_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Competition Entries', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCompetitionEntries')} WHERE ${provider.QuoteIdentifier('CategoryID')}='${associationdemoproductcategory_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Competition Entries', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Competition Entries', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoProductCategory_)
    async CreateAssociationDemoProductCategory(
        @Arg('input', () => CreateAssociationDemoProductCategoryInput) input: CreateAssociationDemoProductCategoryInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Product Categories', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoProductCategory_)
    async UpdateAssociationDemoProductCategory(
        @Arg('input', () => UpdateAssociationDemoProductCategoryInput) input: UpdateAssociationDemoProductCategoryInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Product Categories', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoProductCategory_)
    async DeleteAssociationDemoProductCategory(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Product Categories', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Products
//****************************************************************************
@ObjectType()
export class AssociationDemoProduct_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    MemberID: string;
        
    @Field() 
    @MaxLength(36)
    CategoryID: string;
        
    @Field() 
    @MaxLength(255)
    Name: string;
        
    @Field({nullable: true}) 
    Description?: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    CheeseType?: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    MilkSource?: string;
        
    @Field(() => Int, {nullable: true}) 
    AgeMonths?: number;
        
    @Field(() => Float, {nullable: true}) 
    Weight?: number;
        
    @Field({nullable: true}) 
    @MaxLength(20)
    WeightUnit?: string;
        
    @Field(() => Float, {nullable: true}) 
    RetailPrice?: number;
        
    @Field(() => Boolean, {nullable: true}) 
    IsOrganic?: boolean;
        
    @Field(() => Boolean, {nullable: true}) 
    IsRawMilk?: boolean;
        
    @Field(() => Boolean, {nullable: true}) 
    IsAwardWinner?: boolean;
        
    @Field({nullable: true}) 
    DateIntroduced?: Date;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    Status?: string;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    ImageURL?: string;
        
    @Field({nullable: true}) 
    TastingNotes?: string;
        
    @Field({nullable: true}) 
    PairingNotes?: string;
        
    @Field({nullable: true}) 
    ProductionMethod?: string;
        
    @Field(() => Int, {nullable: true}) 
    AwardCount?: number;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(255)
    Category: string;
        
    @Field(() => [AssociationDemoProductAward_])
    AssociationDemoProductAwards_ProductIDArray: AssociationDemoProductAward_[]; // Link to AssociationDemoProductAwards
    
    @Field(() => [AssociationDemoCompetitionEntry_])
    AssociationDemoCompetitionEntries_ProductIDArray: AssociationDemoCompetitionEntry_[]; // Link to AssociationDemoCompetitionEntries
    
}

//****************************************************************************
// INPUT TYPE for Products
//****************************************************************************
@InputType()
export class CreateAssociationDemoProductInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    CategoryID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Description: string | null;

    @Field({ nullable: true })
    CheeseType: string | null;

    @Field({ nullable: true })
    MilkSource: string | null;

    @Field(() => Int, { nullable: true })
    AgeMonths: number | null;

    @Field(() => Float, { nullable: true })
    Weight: number | null;

    @Field({ nullable: true })
    WeightUnit?: string | null;

    @Field(() => Float, { nullable: true })
    RetailPrice: number | null;

    @Field(() => Boolean, { nullable: true })
    IsOrganic?: boolean | null;

    @Field(() => Boolean, { nullable: true })
    IsRawMilk?: boolean | null;

    @Field(() => Boolean, { nullable: true })
    IsAwardWinner?: boolean | null;

    @Field({ nullable: true })
    DateIntroduced: Date | null;

    @Field({ nullable: true })
    Status?: string | null;

    @Field({ nullable: true })
    ImageURL: string | null;

    @Field({ nullable: true })
    TastingNotes: string | null;

    @Field({ nullable: true })
    PairingNotes: string | null;

    @Field({ nullable: true })
    ProductionMethod: string | null;

    @Field(() => Int, { nullable: true })
    AwardCount?: number | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Products
//****************************************************************************
@InputType()
export class UpdateAssociationDemoProductInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    CategoryID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Description?: string | null;

    @Field({ nullable: true })
    CheeseType?: string | null;

    @Field({ nullable: true })
    MilkSource?: string | null;

    @Field(() => Int, { nullable: true })
    AgeMonths?: number | null;

    @Field(() => Float, { nullable: true })
    Weight?: number | null;

    @Field({ nullable: true })
    WeightUnit?: string | null;

    @Field(() => Float, { nullable: true })
    RetailPrice?: number | null;

    @Field(() => Boolean, { nullable: true })
    IsOrganic?: boolean | null;

    @Field(() => Boolean, { nullable: true })
    IsRawMilk?: boolean | null;

    @Field(() => Boolean, { nullable: true })
    IsAwardWinner?: boolean | null;

    @Field({ nullable: true })
    DateIntroduced?: Date | null;

    @Field({ nullable: true })
    Status?: string | null;

    @Field({ nullable: true })
    ImageURL?: string | null;

    @Field({ nullable: true })
    TastingNotes?: string | null;

    @Field({ nullable: true })
    PairingNotes?: string | null;

    @Field({ nullable: true })
    ProductionMethod?: string | null;

    @Field(() => Int, { nullable: true })
    AwardCount?: number | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Products
//****************************************************************************
@ObjectType()
export class RunAssociationDemoProductViewResult {
    @Field(() => [AssociationDemoProduct_])
    Results: AssociationDemoProduct_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoProduct_)
export class AssociationDemoProductResolver extends ResolverBase {
    @Query(() => RunAssociationDemoProductViewResult)
    async RunAssociationDemoProductViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoProductViewResult)
    async RunAssociationDemoProductViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoProductViewResult)
    async RunAssociationDemoProductDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Products';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoProduct_, { nullable: true })
    async AssociationDemoProduct(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoProduct_ | null> {
        this.CheckUserReadPermissions('Products', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwProducts')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Products', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Products', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoProductAward_])
    async AssociationDemoProductAwards_ProductIDArray(@Root() associationdemoproduct_: AssociationDemoProduct_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Product Awards', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwProductAwards')} WHERE ${provider.QuoteIdentifier('ProductID')}='${associationdemoproduct_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Product Awards', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Product Awards', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoCompetitionEntry_])
    async AssociationDemoCompetitionEntries_ProductIDArray(@Root() associationdemoproduct_: AssociationDemoProduct_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Competition Entries', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCompetitionEntries')} WHERE ${provider.QuoteIdentifier('ProductID')}='${associationdemoproduct_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Competition Entries', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Competition Entries', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoProduct_)
    async CreateAssociationDemoProduct(
        @Arg('input', () => CreateAssociationDemoProductInput) input: CreateAssociationDemoProductInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Products', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoProduct_)
    async UpdateAssociationDemoProduct(
        @Arg('input', () => UpdateAssociationDemoProductInput) input: UpdateAssociationDemoProductInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Products', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoProduct_)
    async DeleteAssociationDemoProduct(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Products', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Regulatory Comments
//****************************************************************************
@ObjectType()
export class AssociationDemoRegulatoryComment_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    LegislativeIssueID: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    DocketNumber?: string;
        
    @Field({nullable: true}) 
    CommentPeriodStart?: Date;
        
    @Field({nullable: true}) 
    CommentPeriodEnd?: Date;
        
    @Field() 
    SubmittedDate: Date;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    SubmittedBy?: string;
        
    @Field() 
    CommentText: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    CommentType?: string;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    AttachmentURL?: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    ConfirmationNumber?: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    Status?: string;
        
    @Field({nullable: true}) 
    Response?: string;
        
    @Field({nullable: true}) 
    Notes?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
}

//****************************************************************************
// INPUT TYPE for Regulatory Comments
//****************************************************************************
@InputType()
export class CreateAssociationDemoRegulatoryCommentInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    LegislativeIssueID?: string;

    @Field({ nullable: true })
    DocketNumber: string | null;

    @Field({ nullable: true })
    CommentPeriodStart: Date | null;

    @Field({ nullable: true })
    CommentPeriodEnd: Date | null;

    @Field({ nullable: true })
    SubmittedDate?: Date;

    @Field({ nullable: true })
    SubmittedBy: string | null;

    @Field({ nullable: true })
    CommentText?: string;

    @Field({ nullable: true })
    CommentType: string | null;

    @Field({ nullable: true })
    AttachmentURL: string | null;

    @Field({ nullable: true })
    ConfirmationNumber: string | null;

    @Field({ nullable: true })
    Status?: string | null;

    @Field({ nullable: true })
    Response: string | null;

    @Field({ nullable: true })
    Notes: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Regulatory Comments
//****************************************************************************
@InputType()
export class UpdateAssociationDemoRegulatoryCommentInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    LegislativeIssueID?: string;

    @Field({ nullable: true })
    DocketNumber?: string | null;

    @Field({ nullable: true })
    CommentPeriodStart?: Date | null;

    @Field({ nullable: true })
    CommentPeriodEnd?: Date | null;

    @Field({ nullable: true })
    SubmittedDate?: Date;

    @Field({ nullable: true })
    SubmittedBy?: string | null;

    @Field({ nullable: true })
    CommentText?: string;

    @Field({ nullable: true })
    CommentType?: string | null;

    @Field({ nullable: true })
    AttachmentURL?: string | null;

    @Field({ nullable: true })
    ConfirmationNumber?: string | null;

    @Field({ nullable: true })
    Status?: string | null;

    @Field({ nullable: true })
    Response?: string | null;

    @Field({ nullable: true })
    Notes?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Regulatory Comments
//****************************************************************************
@ObjectType()
export class RunAssociationDemoRegulatoryCommentViewResult {
    @Field(() => [AssociationDemoRegulatoryComment_])
    Results: AssociationDemoRegulatoryComment_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoRegulatoryComment_)
export class AssociationDemoRegulatoryCommentResolver extends ResolverBase {
    @Query(() => RunAssociationDemoRegulatoryCommentViewResult)
    async RunAssociationDemoRegulatoryCommentViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoRegulatoryCommentViewResult)
    async RunAssociationDemoRegulatoryCommentViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoRegulatoryCommentViewResult)
    async RunAssociationDemoRegulatoryCommentDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Regulatory Comments';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoRegulatoryComment_, { nullable: true })
    async AssociationDemoRegulatoryComment(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoRegulatoryComment_ | null> {
        this.CheckUserReadPermissions('Regulatory Comments', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwRegulatoryComments')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Regulatory Comments', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Regulatory Comments', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoRegulatoryComment_)
    async CreateAssociationDemoRegulatoryComment(
        @Arg('input', () => CreateAssociationDemoRegulatoryCommentInput) input: CreateAssociationDemoRegulatoryCommentInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Regulatory Comments', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoRegulatoryComment_)
    async UpdateAssociationDemoRegulatoryComment(
        @Arg('input', () => UpdateAssociationDemoRegulatoryCommentInput) input: UpdateAssociationDemoRegulatoryCommentInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Regulatory Comments', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoRegulatoryComment_)
    async DeleteAssociationDemoRegulatoryComment(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Regulatory Comments', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Resource Categories
//****************************************************************************
@ObjectType()
export class AssociationDemoResourceCategory_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(255)
    Name: string;
        
    @Field({nullable: true}) 
    Description?: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    ParentCategoryID?: string;
        
    @Field(() => Int, {nullable: true}) 
    DisplayOrder?: number;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    Icon?: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    Color?: string;
        
    @Field(() => Boolean, {nullable: true}) 
    IsActive?: boolean;
        
    @Field(() => Boolean, {nullable: true}) 
    RequiresMembership?: boolean;
        
    @Field(() => Int, {nullable: true}) 
    ResourceCount?: number;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    ParentCategory?: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    RootParentCategoryID?: string;
        
    @Field(() => [AssociationDemoResourceCategory_])
    AssociationDemoResourceCategories_ParentCategoryIDArray: AssociationDemoResourceCategory_[]; // Link to AssociationDemoResourceCategories
    
    @Field(() => [AssociationDemoResource_])
    AssociationDemoResources_CategoryIDArray: AssociationDemoResource_[]; // Link to AssociationDemoResources
    
}

//****************************************************************************
// INPUT TYPE for Resource Categories
//****************************************************************************
@InputType()
export class CreateAssociationDemoResourceCategoryInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Description: string | null;

    @Field({ nullable: true })
    ParentCategoryID: string | null;

    @Field(() => Int, { nullable: true })
    DisplayOrder?: number | null;

    @Field({ nullable: true })
    Icon: string | null;

    @Field({ nullable: true })
    Color: string | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean | null;

    @Field(() => Boolean, { nullable: true })
    RequiresMembership?: boolean | null;

    @Field(() => Int, { nullable: true })
    ResourceCount?: number | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Resource Categories
//****************************************************************************
@InputType()
export class UpdateAssociationDemoResourceCategoryInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Description?: string | null;

    @Field({ nullable: true })
    ParentCategoryID?: string | null;

    @Field(() => Int, { nullable: true })
    DisplayOrder?: number | null;

    @Field({ nullable: true })
    Icon?: string | null;

    @Field({ nullable: true })
    Color?: string | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean | null;

    @Field(() => Boolean, { nullable: true })
    RequiresMembership?: boolean | null;

    @Field(() => Int, { nullable: true })
    ResourceCount?: number | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Resource Categories
//****************************************************************************
@ObjectType()
export class RunAssociationDemoResourceCategoryViewResult {
    @Field(() => [AssociationDemoResourceCategory_])
    Results: AssociationDemoResourceCategory_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoResourceCategory_)
export class AssociationDemoResourceCategoryResolver extends ResolverBase {
    @Query(() => RunAssociationDemoResourceCategoryViewResult)
    async RunAssociationDemoResourceCategoryViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoResourceCategoryViewResult)
    async RunAssociationDemoResourceCategoryViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoResourceCategoryViewResult)
    async RunAssociationDemoResourceCategoryDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Resource Categories';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoResourceCategory_, { nullable: true })
    async AssociationDemoResourceCategory(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoResourceCategory_ | null> {
        this.CheckUserReadPermissions('Resource Categories', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwResourceCategories')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Resource Categories', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Resource Categories', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoResourceCategory_])
    async AssociationDemoResourceCategories_ParentCategoryIDArray(@Root() associationdemoresourcecategory_: AssociationDemoResourceCategory_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Resource Categories', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwResourceCategories')} WHERE ${provider.QuoteIdentifier('ParentCategoryID')}='${associationdemoresourcecategory_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Resource Categories', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Resource Categories', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoResource_])
    async AssociationDemoResources_CategoryIDArray(@Root() associationdemoresourcecategory_: AssociationDemoResourceCategory_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Resources', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwResources')} WHERE ${provider.QuoteIdentifier('CategoryID')}='${associationdemoresourcecategory_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Resources', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Resources', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoResourceCategory_)
    async CreateAssociationDemoResourceCategory(
        @Arg('input', () => CreateAssociationDemoResourceCategoryInput) input: CreateAssociationDemoResourceCategoryInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Resource Categories', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoResourceCategory_)
    async UpdateAssociationDemoResourceCategory(
        @Arg('input', () => UpdateAssociationDemoResourceCategoryInput) input: UpdateAssociationDemoResourceCategoryInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Resource Categories', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoResourceCategory_)
    async DeleteAssociationDemoResourceCategory(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Resource Categories', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Resource Downloads
//****************************************************************************
@ObjectType()
export class AssociationDemoResourceDownload_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    ResourceID: string;
        
    @Field() 
    @MaxLength(36)
    MemberID: string;
        
    @Field() 
    DownloadDate: Date;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    IPAddress?: string;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    UserAgent?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
}

//****************************************************************************
// INPUT TYPE for Resource Downloads
//****************************************************************************
@InputType()
export class CreateAssociationDemoResourceDownloadInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    ResourceID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    DownloadDate?: Date;

    @Field({ nullable: true })
    IPAddress: string | null;

    @Field({ nullable: true })
    UserAgent: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Resource Downloads
//****************************************************************************
@InputType()
export class UpdateAssociationDemoResourceDownloadInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    ResourceID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field({ nullable: true })
    DownloadDate?: Date;

    @Field({ nullable: true })
    IPAddress?: string | null;

    @Field({ nullable: true })
    UserAgent?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Resource Downloads
//****************************************************************************
@ObjectType()
export class RunAssociationDemoResourceDownloadViewResult {
    @Field(() => [AssociationDemoResourceDownload_])
    Results: AssociationDemoResourceDownload_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoResourceDownload_)
export class AssociationDemoResourceDownloadResolver extends ResolverBase {
    @Query(() => RunAssociationDemoResourceDownloadViewResult)
    async RunAssociationDemoResourceDownloadViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoResourceDownloadViewResult)
    async RunAssociationDemoResourceDownloadViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoResourceDownloadViewResult)
    async RunAssociationDemoResourceDownloadDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Resource Downloads';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoResourceDownload_, { nullable: true })
    async AssociationDemoResourceDownload(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoResourceDownload_ | null> {
        this.CheckUserReadPermissions('Resource Downloads', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwResourceDownloads')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Resource Downloads', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Resource Downloads', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoResourceDownload_)
    async CreateAssociationDemoResourceDownload(
        @Arg('input', () => CreateAssociationDemoResourceDownloadInput) input: CreateAssociationDemoResourceDownloadInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Resource Downloads', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoResourceDownload_)
    async UpdateAssociationDemoResourceDownload(
        @Arg('input', () => UpdateAssociationDemoResourceDownloadInput) input: UpdateAssociationDemoResourceDownloadInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Resource Downloads', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoResourceDownload_)
    async DeleteAssociationDemoResourceDownload(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Resource Downloads', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Resource Ratings
//****************************************************************************
@ObjectType()
export class AssociationDemoResourceRating_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    ResourceID: string;
        
    @Field() 
    @MaxLength(36)
    MemberID: string;
        
    @Field(() => Int) 
    Rating: number;
        
    @Field({nullable: true}) 
    Review?: string;
        
    @Field() 
    CreatedDate: Date;
        
    @Field(() => Boolean, {nullable: true}) 
    IsHelpful?: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
}

//****************************************************************************
// INPUT TYPE for Resource Ratings
//****************************************************************************
@InputType()
export class CreateAssociationDemoResourceRatingInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    ResourceID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field(() => Int, { nullable: true })
    Rating?: number;

    @Field({ nullable: true })
    Review: string | null;

    @Field({ nullable: true })
    CreatedDate?: Date;

    @Field(() => Boolean, { nullable: true })
    IsHelpful?: boolean | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Resource Ratings
//****************************************************************************
@InputType()
export class UpdateAssociationDemoResourceRatingInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    ResourceID?: string;

    @Field({ nullable: true })
    MemberID?: string;

    @Field(() => Int, { nullable: true })
    Rating?: number;

    @Field({ nullable: true })
    Review?: string | null;

    @Field({ nullable: true })
    CreatedDate?: Date;

    @Field(() => Boolean, { nullable: true })
    IsHelpful?: boolean | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Resource Ratings
//****************************************************************************
@ObjectType()
export class RunAssociationDemoResourceRatingViewResult {
    @Field(() => [AssociationDemoResourceRating_])
    Results: AssociationDemoResourceRating_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoResourceRating_)
export class AssociationDemoResourceRatingResolver extends ResolverBase {
    @Query(() => RunAssociationDemoResourceRatingViewResult)
    async RunAssociationDemoResourceRatingViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoResourceRatingViewResult)
    async RunAssociationDemoResourceRatingViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoResourceRatingViewResult)
    async RunAssociationDemoResourceRatingDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Resource Ratings';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoResourceRating_, { nullable: true })
    async AssociationDemoResourceRating(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoResourceRating_ | null> {
        this.CheckUserReadPermissions('Resource Ratings', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwResourceRatings')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Resource Ratings', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Resource Ratings', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoResourceRating_)
    async CreateAssociationDemoResourceRating(
        @Arg('input', () => CreateAssociationDemoResourceRatingInput) input: CreateAssociationDemoResourceRatingInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Resource Ratings', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoResourceRating_)
    async UpdateAssociationDemoResourceRating(
        @Arg('input', () => UpdateAssociationDemoResourceRatingInput) input: UpdateAssociationDemoResourceRatingInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Resource Ratings', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoResourceRating_)
    async DeleteAssociationDemoResourceRating(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Resource Ratings', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Resource Tags
//****************************************************************************
@ObjectType()
export class AssociationDemoResourceTag_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    ResourceID: string;
        
    @Field() 
    @MaxLength(100)
    TagName: string;
        
    @Field() 
    CreatedDate: Date;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
}

//****************************************************************************
// INPUT TYPE for Resource Tags
//****************************************************************************
@InputType()
export class CreateAssociationDemoResourceTagInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    ResourceID?: string;

    @Field({ nullable: true })
    TagName?: string;

    @Field({ nullable: true })
    CreatedDate?: Date;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Resource Tags
//****************************************************************************
@InputType()
export class UpdateAssociationDemoResourceTagInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    ResourceID?: string;

    @Field({ nullable: true })
    TagName?: string;

    @Field({ nullable: true })
    CreatedDate?: Date;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Resource Tags
//****************************************************************************
@ObjectType()
export class RunAssociationDemoResourceTagViewResult {
    @Field(() => [AssociationDemoResourceTag_])
    Results: AssociationDemoResourceTag_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoResourceTag_)
export class AssociationDemoResourceTagResolver extends ResolverBase {
    @Query(() => RunAssociationDemoResourceTagViewResult)
    async RunAssociationDemoResourceTagViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoResourceTagViewResult)
    async RunAssociationDemoResourceTagViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoResourceTagViewResult)
    async RunAssociationDemoResourceTagDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Resource Tags';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoResourceTag_, { nullable: true })
    async AssociationDemoResourceTag(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoResourceTag_ | null> {
        this.CheckUserReadPermissions('Resource Tags', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwResourceTags')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Resource Tags', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Resource Tags', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoResourceTag_)
    async CreateAssociationDemoResourceTag(
        @Arg('input', () => CreateAssociationDemoResourceTagInput) input: CreateAssociationDemoResourceTagInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Resource Tags', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoResourceTag_)
    async UpdateAssociationDemoResourceTag(
        @Arg('input', () => UpdateAssociationDemoResourceTagInput) input: UpdateAssociationDemoResourceTagInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Resource Tags', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoResourceTag_)
    async DeleteAssociationDemoResourceTag(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Resource Tags', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Resource Versions
//****************************************************************************
@ObjectType()
export class AssociationDemoResourceVersion_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    ResourceID: string;
        
    @Field() 
    @MaxLength(20)
    VersionNumber: string;
        
    @Field({nullable: true}) 
    VersionNotes?: string;
        
    @Field({nullable: true}) 
    @MaxLength(1000)
    FileURL?: string;
        
    @Field(() => Int, {nullable: true}) 
    FileSizeBytes?: number;
        
    @Field() 
    @MaxLength(36)
    CreatedByID: string;
        
    @Field() 
    CreatedDate: Date;
        
    @Field(() => Boolean, {nullable: true}) 
    IsCurrent?: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
}

//****************************************************************************
// INPUT TYPE for Resource Versions
//****************************************************************************
@InputType()
export class CreateAssociationDemoResourceVersionInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    ResourceID?: string;

    @Field({ nullable: true })
    VersionNumber?: string;

    @Field({ nullable: true })
    VersionNotes: string | null;

    @Field({ nullable: true })
    FileURL: string | null;

    @Field(() => Int, { nullable: true })
    FileSizeBytes: number | null;

    @Field({ nullable: true })
    CreatedByID?: string;

    @Field({ nullable: true })
    CreatedDate?: Date;

    @Field(() => Boolean, { nullable: true })
    IsCurrent?: boolean | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Resource Versions
//****************************************************************************
@InputType()
export class UpdateAssociationDemoResourceVersionInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    ResourceID?: string;

    @Field({ nullable: true })
    VersionNumber?: string;

    @Field({ nullable: true })
    VersionNotes?: string | null;

    @Field({ nullable: true })
    FileURL?: string | null;

    @Field(() => Int, { nullable: true })
    FileSizeBytes?: number | null;

    @Field({ nullable: true })
    CreatedByID?: string;

    @Field({ nullable: true })
    CreatedDate?: Date;

    @Field(() => Boolean, { nullable: true })
    IsCurrent?: boolean | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Resource Versions
//****************************************************************************
@ObjectType()
export class RunAssociationDemoResourceVersionViewResult {
    @Field(() => [AssociationDemoResourceVersion_])
    Results: AssociationDemoResourceVersion_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoResourceVersion_)
export class AssociationDemoResourceVersionResolver extends ResolverBase {
    @Query(() => RunAssociationDemoResourceVersionViewResult)
    async RunAssociationDemoResourceVersionViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoResourceVersionViewResult)
    async RunAssociationDemoResourceVersionViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoResourceVersionViewResult)
    async RunAssociationDemoResourceVersionDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Resource Versions';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoResourceVersion_, { nullable: true })
    async AssociationDemoResourceVersion(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoResourceVersion_ | null> {
        this.CheckUserReadPermissions('Resource Versions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwResourceVersions')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Resource Versions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Resource Versions', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => AssociationDemoResourceVersion_)
    async CreateAssociationDemoResourceVersion(
        @Arg('input', () => CreateAssociationDemoResourceVersionInput) input: CreateAssociationDemoResourceVersionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Resource Versions', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoResourceVersion_)
    async UpdateAssociationDemoResourceVersion(
        @Arg('input', () => UpdateAssociationDemoResourceVersionInput) input: UpdateAssociationDemoResourceVersionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Resource Versions', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoResourceVersion_)
    async DeleteAssociationDemoResourceVersion(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Resource Versions', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Resources
//****************************************************************************
@ObjectType()
export class AssociationDemoResource_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    CategoryID: string;
        
    @Field() 
    @MaxLength(500)
    Title: string;
        
    @Field({nullable: true}) 
    Description?: string;
        
    @Field() 
    @MaxLength(50)
    ResourceType: string;
        
    @Field({nullable: true}) 
    @MaxLength(1000)
    FileURL?: string;
        
    @Field(() => Int, {nullable: true}) 
    FileSizeBytes?: number;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    MimeType?: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    AuthorID?: string;
        
    @Field() 
    PublishedDate: Date;
        
    @Field({nullable: true}) 
    LastUpdatedDate?: Date;
        
    @Field(() => Int, {nullable: true}) 
    ViewCount?: number;
        
    @Field(() => Int, {nullable: true}) 
    DownloadCount?: number;
        
    @Field(() => Float, {nullable: true}) 
    AverageRating?: number;
        
    @Field(() => Int, {nullable: true}) 
    RatingCount?: number;
        
    @Field(() => Boolean, {nullable: true}) 
    IsFeatured?: boolean;
        
    @Field(() => Boolean, {nullable: true}) 
    RequiresMembership?: boolean;
        
    @Field({nullable: true}) 
    @MaxLength(20)
    Status?: string;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(255)
    Category: string;
        
    @Field(() => [AssociationDemoResourceVersion_])
    AssociationDemoResourceVersions_ResourceIDArray: AssociationDemoResourceVersion_[]; // Link to AssociationDemoResourceVersions
    
    @Field(() => [AssociationDemoResourceDownload_])
    AssociationDemoResourceDownloads_ResourceIDArray: AssociationDemoResourceDownload_[]; // Link to AssociationDemoResourceDownloads
    
    @Field(() => [AssociationDemoResourceRating_])
    AssociationDemoResourceRatings_ResourceIDArray: AssociationDemoResourceRating_[]; // Link to AssociationDemoResourceRatings
    
    @Field(() => [AssociationDemoResourceTag_])
    AssociationDemoResourceTags_ResourceIDArray: AssociationDemoResourceTag_[]; // Link to AssociationDemoResourceTags
    
}

//****************************************************************************
// INPUT TYPE for Resources
//****************************************************************************
@InputType()
export class CreateAssociationDemoResourceInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    CategoryID?: string;

    @Field({ nullable: true })
    Title?: string;

    @Field({ nullable: true })
    Description: string | null;

    @Field({ nullable: true })
    ResourceType?: string;

    @Field({ nullable: true })
    FileURL: string | null;

    @Field(() => Int, { nullable: true })
    FileSizeBytes: number | null;

    @Field({ nullable: true })
    MimeType: string | null;

    @Field({ nullable: true })
    AuthorID: string | null;

    @Field({ nullable: true })
    PublishedDate?: Date;

    @Field({ nullable: true })
    LastUpdatedDate: Date | null;

    @Field(() => Int, { nullable: true })
    ViewCount?: number | null;

    @Field(() => Int, { nullable: true })
    DownloadCount?: number | null;

    @Field(() => Float, { nullable: true })
    AverageRating?: number | null;

    @Field(() => Int, { nullable: true })
    RatingCount?: number | null;

    @Field(() => Boolean, { nullable: true })
    IsFeatured?: boolean | null;

    @Field(() => Boolean, { nullable: true })
    RequiresMembership?: boolean | null;

    @Field({ nullable: true })
    Status?: string | null;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Resources
//****************************************************************************
@InputType()
export class UpdateAssociationDemoResourceInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    CategoryID?: string;

    @Field({ nullable: true })
    Title?: string;

    @Field({ nullable: true })
    Description?: string | null;

    @Field({ nullable: true })
    ResourceType?: string;

    @Field({ nullable: true })
    FileURL?: string | null;

    @Field(() => Int, { nullable: true })
    FileSizeBytes?: number | null;

    @Field({ nullable: true })
    MimeType?: string | null;

    @Field({ nullable: true })
    AuthorID?: string | null;

    @Field({ nullable: true })
    PublishedDate?: Date;

    @Field({ nullable: true })
    LastUpdatedDate?: Date | null;

    @Field(() => Int, { nullable: true })
    ViewCount?: number | null;

    @Field(() => Int, { nullable: true })
    DownloadCount?: number | null;

    @Field(() => Float, { nullable: true })
    AverageRating?: number | null;

    @Field(() => Int, { nullable: true })
    RatingCount?: number | null;

    @Field(() => Boolean, { nullable: true })
    IsFeatured?: boolean | null;

    @Field(() => Boolean, { nullable: true })
    RequiresMembership?: boolean | null;

    @Field({ nullable: true })
    Status?: string | null;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Resources
//****************************************************************************
@ObjectType()
export class RunAssociationDemoResourceViewResult {
    @Field(() => [AssociationDemoResource_])
    Results: AssociationDemoResource_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoResource_)
export class AssociationDemoResourceResolver extends ResolverBase {
    @Query(() => RunAssociationDemoResourceViewResult)
    async RunAssociationDemoResourceViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoResourceViewResult)
    async RunAssociationDemoResourceViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoResourceViewResult)
    async RunAssociationDemoResourceDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Resources';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoResource_, { nullable: true })
    async AssociationDemoResource(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoResource_ | null> {
        this.CheckUserReadPermissions('Resources', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwResources')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Resources', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Resources', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoResourceVersion_])
    async AssociationDemoResourceVersions_ResourceIDArray(@Root() associationdemoresource_: AssociationDemoResource_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Resource Versions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwResourceVersions')} WHERE ${provider.QuoteIdentifier('ResourceID')}='${associationdemoresource_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Resource Versions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Resource Versions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoResourceDownload_])
    async AssociationDemoResourceDownloads_ResourceIDArray(@Root() associationdemoresource_: AssociationDemoResource_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Resource Downloads', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwResourceDownloads')} WHERE ${provider.QuoteIdentifier('ResourceID')}='${associationdemoresource_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Resource Downloads', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Resource Downloads', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoResourceRating_])
    async AssociationDemoResourceRatings_ResourceIDArray(@Root() associationdemoresource_: AssociationDemoResource_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Resource Ratings', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwResourceRatings')} WHERE ${provider.QuoteIdentifier('ResourceID')}='${associationdemoresource_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Resource Ratings', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Resource Ratings', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [AssociationDemoResourceTag_])
    async AssociationDemoResourceTags_ResourceIDArray(@Root() associationdemoresource_: AssociationDemoResource_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Resource Tags', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwResourceTags')} WHERE ${provider.QuoteIdentifier('ResourceID')}='${associationdemoresource_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Resource Tags', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Resource Tags', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoResource_)
    async CreateAssociationDemoResource(
        @Arg('input', () => CreateAssociationDemoResourceInput) input: CreateAssociationDemoResourceInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Resources', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoResource_)
    async UpdateAssociationDemoResource(
        @Arg('input', () => UpdateAssociationDemoResourceInput) input: UpdateAssociationDemoResourceInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Resources', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoResource_)
    async DeleteAssociationDemoResource(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Resources', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Segments
//****************************************************************************
@ObjectType()
export class AssociationDemoSegment_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(255)
    Name: string;
        
    @Field({nullable: true}) 
    Description?: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    SegmentType?: string;
        
    @Field({nullable: true}) 
    FilterCriteria?: string;
        
    @Field(() => Int, {nullable: true}) 
    MemberCount?: number;
        
    @Field({nullable: true}) 
    LastCalculatedDate?: Date;
        
    @Field(() => Boolean) 
    IsActive: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field(() => [AssociationDemoCampaignMember_])
    AssociationDemoCampaignMembers_SegmentIDArray: AssociationDemoCampaignMember_[]; // Link to AssociationDemoCampaignMembers
    
}

//****************************************************************************
// INPUT TYPE for Segments
//****************************************************************************
@InputType()
export class CreateAssociationDemoSegmentInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Description: string | null;

    @Field({ nullable: true })
    SegmentType: string | null;

    @Field({ nullable: true })
    FilterCriteria: string | null;

    @Field(() => Int, { nullable: true })
    MemberCount: number | null;

    @Field({ nullable: true })
    LastCalculatedDate: Date | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Segments
//****************************************************************************
@InputType()
export class UpdateAssociationDemoSegmentInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Description?: string | null;

    @Field({ nullable: true })
    SegmentType?: string | null;

    @Field({ nullable: true })
    FilterCriteria?: string | null;

    @Field(() => Int, { nullable: true })
    MemberCount?: number | null;

    @Field({ nullable: true })
    LastCalculatedDate?: Date | null;

    @Field(() => Boolean, { nullable: true })
    IsActive?: boolean;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Segments
//****************************************************************************
@ObjectType()
export class RunAssociationDemoSegmentViewResult {
    @Field(() => [AssociationDemoSegment_])
    Results: AssociationDemoSegment_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(AssociationDemoSegment_)
export class AssociationDemoSegmentResolver extends ResolverBase {
    @Query(() => RunAssociationDemoSegmentViewResult)
    async RunAssociationDemoSegmentViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoSegmentViewResult)
    async RunAssociationDemoSegmentViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunAssociationDemoSegmentViewResult)
    async RunAssociationDemoSegmentDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Segments';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => AssociationDemoSegment_, { nullable: true })
    async AssociationDemoSegment(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<AssociationDemoSegment_ | null> {
        this.CheckUserReadPermissions('Segments', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwSegments')} WHERE ${provider.QuoteIdentifier('ID')}='${ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Segments', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Segments', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [AssociationDemoCampaignMember_])
    async AssociationDemoCampaignMembers_SegmentIDArray(@Root() associationdemosegment_: AssociationDemoSegment_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Campaign Members', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('AssociationDemo', 'vwCampaignMembers')} WHERE ${provider.QuoteIdentifier('SegmentID')}='${associationdemosegment_.ID}' ` + this.getRowLevelSecurityWhereClause(provider, 'Campaign Members', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, undefined, undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Campaign Members', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => AssociationDemoSegment_)
    async CreateAssociationDemoSegment(
        @Arg('input', () => CreateAssociationDemoSegmentInput) input: CreateAssociationDemoSegmentInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Segments', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => AssociationDemoSegment_)
    async UpdateAssociationDemoSegment(
        @Arg('input', () => UpdateAssociationDemoSegmentInput) input: UpdateAssociationDemoSegmentInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Segments', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => AssociationDemoSegment_)
    async DeleteAssociationDemoSegment(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Segments', key, options, provider, userPayload, pubSub);
    }
    
}