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


import { mjBizAppsSonarFactorEntity, mjBizAppsSonarInterventionAssignmentEntity, mjBizAppsSonarInterventionOutcomeEntity, mjBizAppsSonarInterventionEntity, mjBizAppsSonarModelFactorEntity, mjBizAppsSonarModelRelatedEntityEntity, mjBizAppsSonarScoreBandSetEntity, mjBizAppsSonarScoreBandTransitionEntity, mjBizAppsSonarScoreBandEntity, mjBizAppsSonarScoreFactorContributionEntity, mjBizAppsSonarScoreHistoryEntity, mjBizAppsSonarScoreModelAuditEventEntity, mjBizAppsSonarScoreModelVersionEntity, mjBizAppsSonarScoreModelEntity, mjBizAppsSonarScoreRecomputeRunEntity, mjBizAppsSonarScoreSegmentEntity, mjBizAppsSonarScoreEntity, mjBizAppsSonarTimeWindowEntity } from '@mj-biz-apps/sonar-entities';
    

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
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwFactors')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Factors', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Factors', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [mjBizAppsSonarModelFactor_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ModelFactors_FactorIDArray(@Root() mjbizappssonarfactor_: mjBizAppsSonarFactor_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Model Factors', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwModelFactors')} WHERE ${provider.QuoteIdentifier('FactorID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Model Factors', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarfactor_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Model Factors', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScoreFactorContribution_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreFactorContributions_FactorIDArray(@Root() mjbizappssonarfactor_: mjBizAppsSonarFactor_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Factor Contributions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreFactorContributions')} WHERE ${provider.QuoteIdentifier('FactorID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Factor Contributions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarfactor_.ID], undefined, this.GetUserFromPayload(userPayload));
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
    @MaxLength(450)
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
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwInterventionAssignments')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Intervention Assignments', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Intervention Assignments', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [mjBizAppsSonarInterventionOutcome_])
    async mjBizAppsSonarMJ_BizApps_Sonar_InterventionOutcomes_AssignmentIDArray(@Root() mjbizappssonarinterventionassignment_: mjBizAppsSonarInterventionAssignment_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Intervention Outcomes', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwInterventionOutcomes')} WHERE ${provider.QuoteIdentifier('AssignmentID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Intervention Outcomes', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarinterventionassignment_.ID], undefined, this.GetUserFromPayload(userPayload));
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
        
    @Field() 
    @MaxLength(450)
    Assignment: string;
        
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
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwInterventionOutcomes')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Intervention Outcomes', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
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
        
    @Field({nullable: true, description: `JSON [{name,value}] params handed to the intervention's Action on every fire; a {{member}} token in a value is replaced with the member's anchor id. Null = fire with no params.`}) 
    ActionParamsJSON?: string;
        
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

    @Field({ nullable: true })
    ActionParamsJSON: string | null;

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

    @Field({ nullable: true })
    ActionParamsJSON?: string | null;

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
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwInterventions')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Interventions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Interventions', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [mjBizAppsSonarInterventionAssignment_])
    async mjBizAppsSonarMJ_BizApps_Sonar_InterventionAssignments_InterventionIDArray(@Root() mjbizappssonarintervention_: mjBizAppsSonarIntervention_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Intervention Assignments', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwInterventionAssignments')} WHERE ${provider.QuoteIdentifier('InterventionID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Intervention Assignments', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarintervention_.ID], undefined, this.GetUserFromPayload(userPayload));
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
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwModelFactors')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Model Factors', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Model Factors', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [mjBizAppsSonarScoreFactorContribution_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreFactorContributions_ModelFactorIDArray(@Root() mjbizappssonarmodelfactor_: mjBizAppsSonarModelFactor_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Factor Contributions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreFactorContributions')} WHERE ${provider.QuoteIdentifier('ModelFactorID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Factor Contributions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarmodelfactor_.ID], undefined, this.GetUserFromPayload(userPayload));
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
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwModelRelatedEntities')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Model Related Entities', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Model Related Entities', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [mjBizAppsSonarFactor_])
    async mjBizAppsSonarMJ_BizApps_Sonar_Factors_SourceRelatedEntityIDArray(@Root() mjbizappssonarmodelrelatedentity_: mjBizAppsSonarModelRelatedEntity_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Factors', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwFactors')} WHERE ${provider.QuoteIdentifier('SourceRelatedEntityID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Factors', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarmodelrelatedentity_.ID], undefined, this.GetUserFromPayload(userPayload));
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
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreBandSets')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Band Sets', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Band Sets', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [mjBizAppsSonarScoreBand_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreBands_BandSetIDArray(@Root() mjbizappssonarscorebandset_: mjBizAppsSonarScoreBandSet_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Bands', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreBands')} WHERE ${provider.QuoteIdentifier('BandSetID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Bands', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarscorebandset_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Bands', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScoreModel_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreModels_BandSetIDArray(@Root() mjbizappssonarscorebandset_: mjBizAppsSonarScoreBandSet_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Models', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreModels')} WHERE ${provider.QuoteIdentifier('BandSetID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Models', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarscorebandset_.ID], undefined, this.GetUserFromPayload(userPayload));
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
    @MaxLength(450)
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
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreBandTransitions')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Band Transitions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
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
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreBands')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Bands', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Bands', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [mjBizAppsSonarScore_])
    async mjBizAppsSonarMJ_BizApps_Sonar_Scores_BandIDArray(@Root() mjbizappssonarscoreband_: mjBizAppsSonarScoreBand_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Scores', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScores')} WHERE ${provider.QuoteIdentifier('BandID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Scores', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarscoreband_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Scores', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScore_])
    async mjBizAppsSonarMJ_BizApps_Sonar_Scores_PreviousBandIDArray(@Root() mjbizappssonarscoreband_: mjBizAppsSonarScoreBand_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Scores', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScores')} WHERE ${provider.QuoteIdentifier('PreviousBandID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Scores', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarscoreband_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Scores', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScoreHistory_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreHistories_BandIDArray(@Root() mjbizappssonarscoreband_: mjBizAppsSonarScoreBand_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Histories', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreHistories')} WHERE ${provider.QuoteIdentifier('BandID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Histories', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarscoreband_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Histories', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScoreBandTransition_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreBandTransitions_FromBandIDArray(@Root() mjbizappssonarscoreband_: mjBizAppsSonarScoreBand_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Band Transitions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreBandTransitions')} WHERE ${provider.QuoteIdentifier('FromBandID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Band Transitions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarscoreband_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Band Transitions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScoreBandTransition_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreBandTransitions_ToBandIDArray(@Root() mjbizappssonarscoreband_: mjBizAppsSonarScoreBand_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Band Transitions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreBandTransitions')} WHERE ${provider.QuoteIdentifier('ToBandID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Band Transitions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarscoreband_.ID], undefined, this.GetUserFromPayload(userPayload));
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
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreFactorContributions')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Factor Contributions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
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
    @MaxLength(450)
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
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreHistories')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Histories', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
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
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreModelAuditEvents')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Model Audit Events', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
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
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreModelVersions')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Model Versions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Model Versions', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [mjBizAppsSonarScoreRecomputeRun_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreRecomputeRuns_ScoreModelVersionIDArray(@Root() mjbizappssonarscoremodelversion_: mjBizAppsSonarScoreModelVersion_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Recompute Runs', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreRecomputeRuns')} WHERE ${provider.QuoteIdentifier('ScoreModelVersionID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Recompute Runs', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarscoremodelversion_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Recompute Runs', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScore_])
    async mjBizAppsSonarMJ_BizApps_Sonar_Scores_ScoreModelVersionIDArray(@Root() mjbizappssonarscoremodelversion_: mjBizAppsSonarScoreModelVersion_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Scores', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScores')} WHERE ${provider.QuoteIdentifier('ScoreModelVersionID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Scores', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarscoremodelversion_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Scores', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScoreHistory_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreHistories_ScoreModelVersionIDArray(@Root() mjbizappssonarscoremodelversion_: mjBizAppsSonarScoreModelVersion_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Histories', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreHistories')} WHERE ${provider.QuoteIdentifier('ScoreModelVersionID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Histories', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarscoremodelversion_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Histories', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScoreModel_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreModels_CurrentVersionIDArray(@Root() mjbizappssonarscoremodelversion_: mjBizAppsSonarScoreModelVersion_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Models', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreModels')} WHERE ${provider.QuoteIdentifier('CurrentVersionID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Models', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarscoremodelversion_.ID], undefined, this.GetUserFromPayload(userPayload));
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
        
    @Field({nullable: true, description: `Declarative rule defining what "success" means when measuring an intervention's lift on this model's members (BandRecovery | ReachScore | AnchorField). NULL = default band recovery. Keeps outcomes org-defined, not hardcoded.`}) 
    OutcomeDefinitionJSON?: string;
        
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

    @Field({ nullable: true })
    OutcomeDefinitionJSON: string | null;

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

    @Field({ nullable: true })
    OutcomeDefinitionJSON?: string | null;

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
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreModels')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Models', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Models', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [mjBizAppsSonarScoreHistory_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreHistories_ScoreModelIDArray(@Root() mjbizappssonarscoremodel_: mjBizAppsSonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Histories', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreHistories')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Histories', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarscoremodel_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Histories', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScoreBandTransition_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreBandTransitions_ScoreModelIDArray(@Root() mjbizappssonarscoremodel_: mjBizAppsSonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Band Transitions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreBandTransitions')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Band Transitions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarscoremodel_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Band Transitions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScoreRecomputeRun_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreRecomputeRuns_ScoreModelIDArray(@Root() mjbizappssonarscoremodel_: mjBizAppsSonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Recompute Runs', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreRecomputeRuns')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Recompute Runs', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarscoremodel_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Recompute Runs', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScore_])
    async mjBizAppsSonarMJ_BizApps_Sonar_Scores_ScoreModelIDArray(@Root() mjbizappssonarscoremodel_: mjBizAppsSonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Scores', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScores')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Scores', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarscoremodel_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Scores', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScoreModelAuditEvent_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreModelAuditEvents_ScoreModelIDArray(@Root() mjbizappssonarscoremodel_: mjBizAppsSonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Model Audit Events', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreModelAuditEvents')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Model Audit Events', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarscoremodel_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Model Audit Events', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarFactor_])
    async mjBizAppsSonarMJ_BizApps_Sonar_Factors_ScoreModelIDArray(@Root() mjbizappssonarscoremodel_: mjBizAppsSonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Factors', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwFactors')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Factors', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarscoremodel_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Factors', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarFactor_])
    async mjBizAppsSonarMJ_BizApps_Sonar_Factors_SourceScoreModelIDArray(@Root() mjbizappssonarscoremodel_: mjBizAppsSonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Factors', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwFactors')} WHERE ${provider.QuoteIdentifier('SourceScoreModelID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Factors', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarscoremodel_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Factors', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarModelFactor_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ModelFactors_ScoreModelIDArray(@Root() mjbizappssonarscoremodel_: mjBizAppsSonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Model Factors', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwModelFactors')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Model Factors', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarscoremodel_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Model Factors', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScoreModelVersion_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreModelVersions_ScoreModelIDArray(@Root() mjbizappssonarscoremodel_: mjBizAppsSonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Model Versions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreModelVersions')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Model Versions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarscoremodel_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Model Versions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarModelRelatedEntity_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ModelRelatedEntities_ScoreModelIDArray(@Root() mjbizappssonarscoremodel_: mjBizAppsSonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Model Related Entities', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwModelRelatedEntities')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Model Related Entities', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarscoremodel_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MJ_BizApps_Sonar: Model Related Entities', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [mjBizAppsSonarScoreSegment_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreSegments_ScoreModelIDArray(@Root() mjbizappssonarscoremodel_: mjBizAppsSonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Segments', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreSegments')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Segments', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarscoremodel_.ID], undefined, this.GetUserFromPayload(userPayload));
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
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreRecomputeRuns')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Recompute Runs', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Recompute Runs', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [mjBizAppsSonarScoreBandTransition_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreBandTransitions_RecomputeRunIDArray(@Root() mjbizappssonarscorerecomputerun_: mjBizAppsSonarScoreRecomputeRun_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Band Transitions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreBandTransitions')} WHERE ${provider.QuoteIdentifier('RecomputeRunID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Band Transitions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarscorerecomputerun_.ID], undefined, this.GetUserFromPayload(userPayload));
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
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreSegments')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Segments', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Score Segments', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [mjBizAppsSonarIntervention_])
    async mjBizAppsSonarMJ_BizApps_Sonar_Interventions_ScoreSegmentIDArray(@Root() mjbizappssonarscoresegment_: mjBizAppsSonarScoreSegment_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Interventions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwInterventions')} WHERE ${provider.QuoteIdentifier('ScoreSegmentID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Interventions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarscoresegment_.ID], undefined, this.GetUserFromPayload(userPayload));
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
    @MaxLength(450)
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
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScores')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Scores', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Scores', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [mjBizAppsSonarScoreFactorContribution_])
    async mjBizAppsSonarMJ_BizApps_Sonar_ScoreFactorContributions_ScoreIDArray(@Root() mjbizappssonarscore_: mjBizAppsSonarScore_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Score Factor Contributions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwScoreFactorContributions')} WHERE ${provider.QuoteIdentifier('ScoreID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Score Factor Contributions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonarscore_.ID], undefined, this.GetUserFromPayload(userPayload));
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
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwTimeWindows')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Time Windows', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MJ_BizApps_Sonar: Time Windows', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [mjBizAppsSonarFactor_])
    async mjBizAppsSonarMJ_BizApps_Sonar_Factors_TimeWindowIDArray(@Root() mjbizappssonartimewindow_: mjBizAppsSonarTimeWindow_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MJ_BizApps_Sonar: Factors', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__mj_BizAppsSonar', 'vwFactors')} WHERE ${provider.QuoteIdentifier('TimeWindowID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MJ_BizApps_Sonar: Factors', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [mjbizappssonartimewindow_.ID], undefined, this.GetUserFromPayload(userPayload));
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