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


import { sonarFactorEntity, sonarModelFactorEntity, sonarModelRelatedEntityEntity, sonarScoreBandSetEntity, sonarScoreBandTransitionEntity, sonarScoreBandEntity, sonarScoreFactorContributionEntity, sonarScoreHistoryEntity, sonarScoreModelAuditEventEntity, sonarScoreModelVersionEntity, sonarScoreModelEntity, sonarScoreRecomputeRunEntity, sonarScoreEntity, sonarTimeWindowEntity } from '@mj-biz-apps/sonar-entities';
    

//****************************************************************************
// ENTITY CLASS for Sonar: Factors
//****************************************************************************
@ObjectType({ description: `A reusable signal definition that satisfies one uniform contract. Declarative factors compile to set-based SQL; ActionBacked factors wrap an MJ Action; DerivedFromScore factors consume another model\'s score.` })
export class sonarFactor_ {
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
        
    @Field(() => [sonarModelFactor_])
    sonarSonar_ModelFactors_FactorIDArray: sonarModelFactor_[]; // Link to sonarSonar_ModelFactors
    
    @Field(() => [sonarScoreFactorContribution_])
    sonarSonar_ScoreFactorContributions_FactorIDArray: sonarScoreFactorContribution_[]; // Link to sonarSonar_ScoreFactorContributions
    
}

//****************************************************************************
// INPUT TYPE for Sonar: Factors
//****************************************************************************
@InputType()
export class CreatesonarFactorInput {
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

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for Sonar: Factors
//****************************************************************************
@InputType()
export class UpdatesonarFactorInput {
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

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for Sonar: Factors
//****************************************************************************
@ObjectType()
export class RunsonarFactorViewResult {
    @Field(() => [sonarFactor_])
    Results: sonarFactor_[];

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

@Resolver(sonarFactor_)
export class sonarFactorResolver extends ResolverBase {
    @Query(() => RunsonarFactorViewResult)
    async RunsonarFactorViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarFactorViewResult)
    async RunsonarFactorViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarFactorViewResult)
    async RunsonarFactorDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Sonar: Factors';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => sonarFactor_, { nullable: true })
    async sonarFactor(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<sonarFactor_ | null> {
        this.CheckUserReadPermissions('Sonar: Factors', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwFactors')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Factors', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Sonar: Factors', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [sonarModelFactor_])
    async sonarSonar_ModelFactors_FactorIDArray(@Root() sonarfactor_: sonarFactor_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Model Factors', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwModelFactors')} WHERE ${provider.QuoteIdentifier('FactorID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Model Factors', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarfactor_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Model Factors', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [sonarScoreFactorContribution_])
    async sonarSonar_ScoreFactorContributions_FactorIDArray(@Root() sonarfactor_: sonarFactor_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Score Factor Contributions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScoreFactorContributions')} WHERE ${provider.QuoteIdentifier('FactorID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Score Factor Contributions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarfactor_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Score Factor Contributions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => sonarFactor_)
    async CreatesonarFactor(
        @Arg('input', () => CreatesonarFactorInput) input: CreatesonarFactorInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Sonar: Factors', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => sonarFactor_)
    async UpdatesonarFactor(
        @Arg('input', () => UpdatesonarFactorInput) input: UpdatesonarFactorInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Sonar: Factors', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => sonarFactor_)
    async DeletesonarFactor(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Sonar: Factors', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Sonar: Model Factors
//****************************************************************************
@ObjectType({ description: `Binds a Factor into a model with its weight and contribution rules. The rubric is the set of these rows.` })
export class sonarModelFactor_ {
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
        
    @Field(() => [sonarScoreFactorContribution_])
    sonarSonar_ScoreFactorContributions_ModelFactorIDArray: sonarScoreFactorContribution_[]; // Link to sonarSonar_ScoreFactorContributions
    
}

//****************************************************************************
// INPUT TYPE for Sonar: Model Factors
//****************************************************************************
@InputType()
export class CreatesonarModelFactorInput {
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
// INPUT TYPE for Sonar: Model Factors
//****************************************************************************
@InputType()
export class UpdatesonarModelFactorInput {
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
// RESOLVER for Sonar: Model Factors
//****************************************************************************
@ObjectType()
export class RunsonarModelFactorViewResult {
    @Field(() => [sonarModelFactor_])
    Results: sonarModelFactor_[];

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

@Resolver(sonarModelFactor_)
export class sonarModelFactorResolver extends ResolverBase {
    @Query(() => RunsonarModelFactorViewResult)
    async RunsonarModelFactorViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarModelFactorViewResult)
    async RunsonarModelFactorViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarModelFactorViewResult)
    async RunsonarModelFactorDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Sonar: Model Factors';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => sonarModelFactor_, { nullable: true })
    async sonarModelFactor(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<sonarModelFactor_ | null> {
        this.CheckUserReadPermissions('Sonar: Model Factors', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwModelFactors')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Model Factors', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Sonar: Model Factors', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [sonarScoreFactorContribution_])
    async sonarSonar_ScoreFactorContributions_ModelFactorIDArray(@Root() sonarmodelfactor_: sonarModelFactor_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Score Factor Contributions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScoreFactorContributions')} WHERE ${provider.QuoteIdentifier('ModelFactorID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Score Factor Contributions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarmodelfactor_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Score Factor Contributions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => sonarModelFactor_)
    async CreatesonarModelFactor(
        @Arg('input', () => CreatesonarModelFactorInput) input: CreatesonarModelFactorInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Sonar: Model Factors', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => sonarModelFactor_)
    async UpdatesonarModelFactor(
        @Arg('input', () => UpdatesonarModelFactorInput) input: UpdatesonarModelFactorInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Sonar: Model Factors', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => sonarModelFactor_)
    async DeletesonarModelFactor(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Sonar: Model Factors', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Sonar: Model Related Entities
//****************************************************************************
@ObjectType({ description: `Declares an MJ entity wired into a model and how to traverse from the anchor to it. Factors reference these by Alias.` })
export class sonarModelRelatedEntity_ {
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
        
    @Field(() => [sonarFactor_])
    sonarSonar_Factors_SourceRelatedEntityIDArray: sonarFactor_[]; // Link to sonarSonar_Factors
    
}

//****************************************************************************
// INPUT TYPE for Sonar: Model Related Entities
//****************************************************************************
@InputType()
export class CreatesonarModelRelatedEntityInput {
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
// INPUT TYPE for Sonar: Model Related Entities
//****************************************************************************
@InputType()
export class UpdatesonarModelRelatedEntityInput {
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
// RESOLVER for Sonar: Model Related Entities
//****************************************************************************
@ObjectType()
export class RunsonarModelRelatedEntityViewResult {
    @Field(() => [sonarModelRelatedEntity_])
    Results: sonarModelRelatedEntity_[];

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

@Resolver(sonarModelRelatedEntity_)
export class sonarModelRelatedEntityResolver extends ResolverBase {
    @Query(() => RunsonarModelRelatedEntityViewResult)
    async RunsonarModelRelatedEntityViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarModelRelatedEntityViewResult)
    async RunsonarModelRelatedEntityViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarModelRelatedEntityViewResult)
    async RunsonarModelRelatedEntityDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Sonar: Model Related Entities';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => sonarModelRelatedEntity_, { nullable: true })
    async sonarModelRelatedEntity(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<sonarModelRelatedEntity_ | null> {
        this.CheckUserReadPermissions('Sonar: Model Related Entities', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwModelRelatedEntities')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Model Related Entities', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Sonar: Model Related Entities', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [sonarFactor_])
    async sonarSonar_Factors_SourceRelatedEntityIDArray(@Root() sonarmodelrelatedentity_: sonarModelRelatedEntity_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Factors', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwFactors')} WHERE ${provider.QuoteIdentifier('SourceRelatedEntityID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Factors', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarmodelrelatedentity_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Factors', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => sonarModelRelatedEntity_)
    async CreatesonarModelRelatedEntity(
        @Arg('input', () => CreatesonarModelRelatedEntityInput) input: CreatesonarModelRelatedEntityInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Sonar: Model Related Entities', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => sonarModelRelatedEntity_)
    async UpdatesonarModelRelatedEntity(
        @Arg('input', () => UpdatesonarModelRelatedEntityInput) input: UpdatesonarModelRelatedEntityInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Sonar: Model Related Entities', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => sonarModelRelatedEntity_)
    async DeletesonarModelRelatedEntity(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Sonar: Model Related Entities', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Sonar: Score Band Sets
//****************************************************************************
@ObjectType({ description: `A reusable, named set of qualitative score bands (e.g. Healthy / Watch / At-Risk / Critical) that can be shared across scoring models.` })
export class sonarScoreBandSet_ {
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
        
    @Field(() => [sonarScoreBand_])
    sonarSonar_ScoreBands_BandSetIDArray: sonarScoreBand_[]; // Link to sonarSonar_ScoreBands
    
    @Field(() => [sonarScoreModel_])
    sonarSonar_ScoreModels_BandSetIDArray: sonarScoreModel_[]; // Link to sonarSonar_ScoreModels
    
}

//****************************************************************************
// INPUT TYPE for Sonar: Score Band Sets
//****************************************************************************
@InputType()
export class CreatesonarScoreBandSetInput {
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
// INPUT TYPE for Sonar: Score Band Sets
//****************************************************************************
@InputType()
export class UpdatesonarScoreBandSetInput {
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
// RESOLVER for Sonar: Score Band Sets
//****************************************************************************
@ObjectType()
export class RunsonarScoreBandSetViewResult {
    @Field(() => [sonarScoreBandSet_])
    Results: sonarScoreBandSet_[];

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

@Resolver(sonarScoreBandSet_)
export class sonarScoreBandSetResolver extends ResolverBase {
    @Query(() => RunsonarScoreBandSetViewResult)
    async RunsonarScoreBandSetViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarScoreBandSetViewResult)
    async RunsonarScoreBandSetViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarScoreBandSetViewResult)
    async RunsonarScoreBandSetDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Sonar: Score Band Sets';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => sonarScoreBandSet_, { nullable: true })
    async sonarScoreBandSet(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<sonarScoreBandSet_ | null> {
        this.CheckUserReadPermissions('Sonar: Score Band Sets', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScoreBandSets')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Score Band Sets', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Sonar: Score Band Sets', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [sonarScoreBand_])
    async sonarSonar_ScoreBands_BandSetIDArray(@Root() sonarscorebandset_: sonarScoreBandSet_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Score Bands', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScoreBands')} WHERE ${provider.QuoteIdentifier('BandSetID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Score Bands', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarscorebandset_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Score Bands', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [sonarScoreModel_])
    async sonarSonar_ScoreModels_BandSetIDArray(@Root() sonarscorebandset_: sonarScoreBandSet_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Score Models', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScoreModels')} WHERE ${provider.QuoteIdentifier('BandSetID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Score Models', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarscorebandset_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Score Models', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => sonarScoreBandSet_)
    async CreatesonarScoreBandSet(
        @Arg('input', () => CreatesonarScoreBandSetInput) input: CreatesonarScoreBandSetInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Sonar: Score Band Sets', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => sonarScoreBandSet_)
    async UpdatesonarScoreBandSet(
        @Arg('input', () => UpdatesonarScoreBandSetInput) input: UpdatesonarScoreBandSetInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Sonar: Score Band Sets', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => sonarScoreBandSet_)
    async DeletesonarScoreBandSet(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Sonar: Score Band Sets', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Sonar: Score Band Transitions
//****************************************************************************
@ObjectType({ description: `First-class record of a band crossing; the event the action layer and write-back key off.` })
export class sonarScoreBandTransition_ {
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
// INPUT TYPE for Sonar: Score Band Transitions
//****************************************************************************
@InputType()
export class CreatesonarScoreBandTransitionInput {
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
// INPUT TYPE for Sonar: Score Band Transitions
//****************************************************************************
@InputType()
export class UpdatesonarScoreBandTransitionInput {
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
// RESOLVER for Sonar: Score Band Transitions
//****************************************************************************
@ObjectType()
export class RunsonarScoreBandTransitionViewResult {
    @Field(() => [sonarScoreBandTransition_])
    Results: sonarScoreBandTransition_[];

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

@Resolver(sonarScoreBandTransition_)
export class sonarScoreBandTransitionResolver extends ResolverBase {
    @Query(() => RunsonarScoreBandTransitionViewResult)
    async RunsonarScoreBandTransitionViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarScoreBandTransitionViewResult)
    async RunsonarScoreBandTransitionViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarScoreBandTransitionViewResult)
    async RunsonarScoreBandTransitionDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Sonar: Score Band Transitions';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => sonarScoreBandTransition_, { nullable: true })
    async sonarScoreBandTransition(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<sonarScoreBandTransition_ | null> {
        this.CheckUserReadPermissions('Sonar: Score Band Transitions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScoreBandTransitions')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Score Band Transitions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Sonar: Score Band Transitions', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => sonarScoreBandTransition_)
    async CreatesonarScoreBandTransition(
        @Arg('input', () => CreatesonarScoreBandTransitionInput) input: CreatesonarScoreBandTransitionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Sonar: Score Band Transitions', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => sonarScoreBandTransition_)
    async UpdatesonarScoreBandTransition(
        @Arg('input', () => UpdatesonarScoreBandTransitionInput) input: UpdatesonarScoreBandTransitionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Sonar: Score Band Transitions', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => sonarScoreBandTransition_)
    async DeletesonarScoreBandTransition(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Sonar: Score Band Transitions', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Sonar: Score Bands
//****************************************************************************
@ObjectType({ description: `One qualitative band within a band set, defined by a half-open score range with a severity and color for sorting and display.` })
export class sonarScoreBand_ {
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
        
    @Field(() => [sonarScore_])
    sonarSonar_Scores_BandIDArray: sonarScore_[]; // Link to sonarSonar_Scores
    
    @Field(() => [sonarScore_])
    sonarSonar_Scores_PreviousBandIDArray: sonarScore_[]; // Link to sonarSonar_Scores
    
    @Field(() => [sonarScoreHistory_])
    sonarSonar_ScoreHistories_BandIDArray: sonarScoreHistory_[]; // Link to sonarSonar_ScoreHistories
    
    @Field(() => [sonarScoreBandTransition_])
    sonarSonar_ScoreBandTransitions_FromBandIDArray: sonarScoreBandTransition_[]; // Link to sonarSonar_ScoreBandTransitions
    
    @Field(() => [sonarScoreBandTransition_])
    sonarSonar_ScoreBandTransitions_ToBandIDArray: sonarScoreBandTransition_[]; // Link to sonarSonar_ScoreBandTransitions
    
}

//****************************************************************************
// INPUT TYPE for Sonar: Score Bands
//****************************************************************************
@InputType()
export class CreatesonarScoreBandInput {
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
// INPUT TYPE for Sonar: Score Bands
//****************************************************************************
@InputType()
export class UpdatesonarScoreBandInput {
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
// RESOLVER for Sonar: Score Bands
//****************************************************************************
@ObjectType()
export class RunsonarScoreBandViewResult {
    @Field(() => [sonarScoreBand_])
    Results: sonarScoreBand_[];

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

@Resolver(sonarScoreBand_)
export class sonarScoreBandResolver extends ResolverBase {
    @Query(() => RunsonarScoreBandViewResult)
    async RunsonarScoreBandViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarScoreBandViewResult)
    async RunsonarScoreBandViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarScoreBandViewResult)
    async RunsonarScoreBandDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Sonar: Score Bands';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => sonarScoreBand_, { nullable: true })
    async sonarScoreBand(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<sonarScoreBand_ | null> {
        this.CheckUserReadPermissions('Sonar: Score Bands', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScoreBands')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Score Bands', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Sonar: Score Bands', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [sonarScore_])
    async sonarSonar_Scores_BandIDArray(@Root() sonarscoreband_: sonarScoreBand_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Scores', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScores')} WHERE ${provider.QuoteIdentifier('BandID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Scores', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarscoreband_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Scores', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [sonarScore_])
    async sonarSonar_Scores_PreviousBandIDArray(@Root() sonarscoreband_: sonarScoreBand_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Scores', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScores')} WHERE ${provider.QuoteIdentifier('PreviousBandID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Scores', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarscoreband_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Scores', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [sonarScoreHistory_])
    async sonarSonar_ScoreHistories_BandIDArray(@Root() sonarscoreband_: sonarScoreBand_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Score Histories', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScoreHistories')} WHERE ${provider.QuoteIdentifier('BandID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Score Histories', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarscoreband_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Score Histories', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [sonarScoreBandTransition_])
    async sonarSonar_ScoreBandTransitions_FromBandIDArray(@Root() sonarscoreband_: sonarScoreBand_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Score Band Transitions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScoreBandTransitions')} WHERE ${provider.QuoteIdentifier('FromBandID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Score Band Transitions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarscoreband_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Score Band Transitions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [sonarScoreBandTransition_])
    async sonarSonar_ScoreBandTransitions_ToBandIDArray(@Root() sonarscoreband_: sonarScoreBand_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Score Band Transitions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScoreBandTransitions')} WHERE ${provider.QuoteIdentifier('ToBandID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Score Band Transitions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarscoreband_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Score Band Transitions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => sonarScoreBand_)
    async CreatesonarScoreBand(
        @Arg('input', () => CreatesonarScoreBandInput) input: CreatesonarScoreBandInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Sonar: Score Bands', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => sonarScoreBand_)
    async UpdatesonarScoreBand(
        @Arg('input', () => UpdatesonarScoreBandInput) input: UpdatesonarScoreBandInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Sonar: Score Bands', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => sonarScoreBand_)
    async DeletesonarScoreBand(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Sonar: Score Bands', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Sonar: Score Factor Contributions
//****************************************************************************
@ObjectType({ description: `Per-factor breakdown of a current score; the explainability spine that makes the score narrative free.` })
export class sonarScoreFactorContribution_ {
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
// INPUT TYPE for Sonar: Score Factor Contributions
//****************************************************************************
@InputType()
export class CreatesonarScoreFactorContributionInput {
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
// INPUT TYPE for Sonar: Score Factor Contributions
//****************************************************************************
@InputType()
export class UpdatesonarScoreFactorContributionInput {
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
// RESOLVER for Sonar: Score Factor Contributions
//****************************************************************************
@ObjectType()
export class RunsonarScoreFactorContributionViewResult {
    @Field(() => [sonarScoreFactorContribution_])
    Results: sonarScoreFactorContribution_[];

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

@Resolver(sonarScoreFactorContribution_)
export class sonarScoreFactorContributionResolver extends ResolverBase {
    @Query(() => RunsonarScoreFactorContributionViewResult)
    async RunsonarScoreFactorContributionViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarScoreFactorContributionViewResult)
    async RunsonarScoreFactorContributionViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarScoreFactorContributionViewResult)
    async RunsonarScoreFactorContributionDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Sonar: Score Factor Contributions';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => sonarScoreFactorContribution_, { nullable: true })
    async sonarScoreFactorContribution(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<sonarScoreFactorContribution_ | null> {
        this.CheckUserReadPermissions('Sonar: Score Factor Contributions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScoreFactorContributions')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Score Factor Contributions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Sonar: Score Factor Contributions', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => sonarScoreFactorContribution_)
    async CreatesonarScoreFactorContribution(
        @Arg('input', () => CreatesonarScoreFactorContributionInput) input: CreatesonarScoreFactorContributionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Sonar: Score Factor Contributions', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => sonarScoreFactorContribution_)
    async UpdatesonarScoreFactorContribution(
        @Arg('input', () => UpdatesonarScoreFactorContributionInput) input: UpdatesonarScoreFactorContributionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Sonar: Score Factor Contributions', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => sonarScoreFactorContribution_)
    async DeletesonarScoreFactorContribution(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Sonar: Score Factor Contributions', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Sonar: Score Histories
//****************************************************************************
@ObjectType({ description: `Append-only time-series snapshots of scores; the trajectory is the asset. Snapshot on change plus periodic keyframes.` })
export class sonarScoreHistory_ {
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
// INPUT TYPE for Sonar: Score Histories
//****************************************************************************
@InputType()
export class CreatesonarScoreHistoryInput {
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
// INPUT TYPE for Sonar: Score Histories
//****************************************************************************
@InputType()
export class UpdatesonarScoreHistoryInput {
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
// RESOLVER for Sonar: Score Histories
//****************************************************************************
@ObjectType()
export class RunsonarScoreHistoryViewResult {
    @Field(() => [sonarScoreHistory_])
    Results: sonarScoreHistory_[];

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

@Resolver(sonarScoreHistory_)
export class sonarScoreHistoryResolver extends ResolverBase {
    @Query(() => RunsonarScoreHistoryViewResult)
    async RunsonarScoreHistoryViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarScoreHistoryViewResult)
    async RunsonarScoreHistoryViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarScoreHistoryViewResult)
    async RunsonarScoreHistoryDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Sonar: Score Histories';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => sonarScoreHistory_, { nullable: true })
    async sonarScoreHistory(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<sonarScoreHistory_ | null> {
        this.CheckUserReadPermissions('Sonar: Score Histories', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScoreHistories')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Score Histories', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Sonar: Score Histories', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => sonarScoreHistory_)
    async CreatesonarScoreHistory(
        @Arg('input', () => CreatesonarScoreHistoryInput) input: CreatesonarScoreHistoryInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Sonar: Score Histories', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => sonarScoreHistory_)
    async UpdatesonarScoreHistory(
        @Arg('input', () => UpdatesonarScoreHistoryInput) input: UpdatesonarScoreHistoryInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Sonar: Score Histories', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => sonarScoreHistory_)
    async DeletesonarScoreHistory(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Sonar: Score Histories', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Sonar: Score Model Audit Events
//****************************************************************************
@ObjectType({ description: `Config-change audit: who changed which weight, factor, or window and when. Required for an explainable, governed scoring product.` })
export class sonarScoreModelAuditEvent_ {
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
// INPUT TYPE for Sonar: Score Model Audit Events
//****************************************************************************
@InputType()
export class CreatesonarScoreModelAuditEventInput {
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
// INPUT TYPE for Sonar: Score Model Audit Events
//****************************************************************************
@InputType()
export class UpdatesonarScoreModelAuditEventInput {
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
// RESOLVER for Sonar: Score Model Audit Events
//****************************************************************************
@ObjectType()
export class RunsonarScoreModelAuditEventViewResult {
    @Field(() => [sonarScoreModelAuditEvent_])
    Results: sonarScoreModelAuditEvent_[];

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

@Resolver(sonarScoreModelAuditEvent_)
export class sonarScoreModelAuditEventResolver extends ResolverBase {
    @Query(() => RunsonarScoreModelAuditEventViewResult)
    async RunsonarScoreModelAuditEventViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarScoreModelAuditEventViewResult)
    async RunsonarScoreModelAuditEventViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarScoreModelAuditEventViewResult)
    async RunsonarScoreModelAuditEventDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Sonar: Score Model Audit Events';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => sonarScoreModelAuditEvent_, { nullable: true })
    async sonarScoreModelAuditEvent(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<sonarScoreModelAuditEvent_ | null> {
        this.CheckUserReadPermissions('Sonar: Score Model Audit Events', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScoreModelAuditEvents')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Score Model Audit Events', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Sonar: Score Model Audit Events', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => sonarScoreModelAuditEvent_)
    async CreatesonarScoreModelAuditEvent(
        @Arg('input', () => CreatesonarScoreModelAuditEventInput) input: CreatesonarScoreModelAuditEventInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Sonar: Score Model Audit Events', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => sonarScoreModelAuditEvent_)
    async UpdatesonarScoreModelAuditEvent(
        @Arg('input', () => UpdatesonarScoreModelAuditEventInput) input: UpdatesonarScoreModelAuditEventInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Sonar: Score Model Audit Events', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => sonarScoreModelAuditEvent_)
    async DeletesonarScoreModelAuditEvent(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Sonar: Score Model Audit Events', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Sonar: Score Model Versions
//****************************************************************************
@ObjectType({ description: `An immutable snapshot of a model\'s complete configuration at publish time. Every Score and ScoreHistory row references the version that produced it, making scores reproducible and auditable.` })
export class sonarScoreModelVersion_ {
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
        
    @Field(() => [sonarScoreRecomputeRun_])
    sonarSonar_ScoreRecomputeRuns_ScoreModelVersionIDArray: sonarScoreRecomputeRun_[]; // Link to sonarSonar_ScoreRecomputeRuns
    
    @Field(() => [sonarScore_])
    sonarSonar_Scores_ScoreModelVersionIDArray: sonarScore_[]; // Link to sonarSonar_Scores
    
    @Field(() => [sonarScoreHistory_])
    sonarSonar_ScoreHistories_ScoreModelVersionIDArray: sonarScoreHistory_[]; // Link to sonarSonar_ScoreHistories
    
    @Field(() => [sonarScoreModel_])
    sonarSonar_ScoreModels_CurrentVersionIDArray: sonarScoreModel_[]; // Link to sonarSonar_ScoreModels
    
}

//****************************************************************************
// INPUT TYPE for Sonar: Score Model Versions
//****************************************************************************
@InputType()
export class CreatesonarScoreModelVersionInput {
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
// INPUT TYPE for Sonar: Score Model Versions
//****************************************************************************
@InputType()
export class UpdatesonarScoreModelVersionInput {
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
// RESOLVER for Sonar: Score Model Versions
//****************************************************************************
@ObjectType()
export class RunsonarScoreModelVersionViewResult {
    @Field(() => [sonarScoreModelVersion_])
    Results: sonarScoreModelVersion_[];

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

@Resolver(sonarScoreModelVersion_)
export class sonarScoreModelVersionResolver extends ResolverBase {
    @Query(() => RunsonarScoreModelVersionViewResult)
    async RunsonarScoreModelVersionViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarScoreModelVersionViewResult)
    async RunsonarScoreModelVersionViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarScoreModelVersionViewResult)
    async RunsonarScoreModelVersionDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Sonar: Score Model Versions';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => sonarScoreModelVersion_, { nullable: true })
    async sonarScoreModelVersion(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<sonarScoreModelVersion_ | null> {
        this.CheckUserReadPermissions('Sonar: Score Model Versions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScoreModelVersions')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Score Model Versions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Sonar: Score Model Versions', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [sonarScoreRecomputeRun_])
    async sonarSonar_ScoreRecomputeRuns_ScoreModelVersionIDArray(@Root() sonarscoremodelversion_: sonarScoreModelVersion_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Score Recompute Runs', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScoreRecomputeRuns')} WHERE ${provider.QuoteIdentifier('ScoreModelVersionID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Score Recompute Runs', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarscoremodelversion_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Score Recompute Runs', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [sonarScore_])
    async sonarSonar_Scores_ScoreModelVersionIDArray(@Root() sonarscoremodelversion_: sonarScoreModelVersion_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Scores', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScores')} WHERE ${provider.QuoteIdentifier('ScoreModelVersionID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Scores', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarscoremodelversion_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Scores', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [sonarScoreHistory_])
    async sonarSonar_ScoreHistories_ScoreModelVersionIDArray(@Root() sonarscoremodelversion_: sonarScoreModelVersion_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Score Histories', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScoreHistories')} WHERE ${provider.QuoteIdentifier('ScoreModelVersionID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Score Histories', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarscoremodelversion_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Score Histories', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [sonarScoreModel_])
    async sonarSonar_ScoreModels_CurrentVersionIDArray(@Root() sonarscoremodelversion_: sonarScoreModelVersion_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Score Models', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScoreModels')} WHERE ${provider.QuoteIdentifier('CurrentVersionID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Score Models', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarscoremodelversion_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Score Models', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => sonarScoreModelVersion_)
    async CreatesonarScoreModelVersion(
        @Arg('input', () => CreatesonarScoreModelVersionInput) input: CreatesonarScoreModelVersionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Sonar: Score Model Versions', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => sonarScoreModelVersion_)
    async UpdatesonarScoreModelVersion(
        @Arg('input', () => UpdatesonarScoreModelVersionInput) input: UpdatesonarScoreModelVersionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Sonar: Score Model Versions', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => sonarScoreModelVersion_)
    async DeletesonarScoreModelVersion(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Sonar: Score Model Versions', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Sonar: Score Models
//****************************************************************************
@ObjectType({ description: `The editable definition of one scoring model: anchor entity, scale, combine strategy, recompute policy, and bands. Many models can be active per tenant.` })
export class sonarScoreModel_ {
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
        
    @Field(() => [sonarScoreHistory_])
    sonarSonar_ScoreHistories_ScoreModelIDArray: sonarScoreHistory_[]; // Link to sonarSonar_ScoreHistories
    
    @Field(() => [sonarScoreBandTransition_])
    sonarSonar_ScoreBandTransitions_ScoreModelIDArray: sonarScoreBandTransition_[]; // Link to sonarSonar_ScoreBandTransitions
    
    @Field(() => [sonarScoreRecomputeRun_])
    sonarSonar_ScoreRecomputeRuns_ScoreModelIDArray: sonarScoreRecomputeRun_[]; // Link to sonarSonar_ScoreRecomputeRuns
    
    @Field(() => [sonarScore_])
    sonarSonar_Scores_ScoreModelIDArray: sonarScore_[]; // Link to sonarSonar_Scores
    
    @Field(() => [sonarScoreModelAuditEvent_])
    sonarSonar_ScoreModelAuditEvents_ScoreModelIDArray: sonarScoreModelAuditEvent_[]; // Link to sonarSonar_ScoreModelAuditEvents
    
    @Field(() => [sonarFactor_])
    sonarSonar_Factors_ScoreModelIDArray: sonarFactor_[]; // Link to sonarSonar_Factors
    
    @Field(() => [sonarFactor_])
    sonarSonar_Factors_SourceScoreModelIDArray: sonarFactor_[]; // Link to sonarSonar_Factors
    
    @Field(() => [sonarModelFactor_])
    sonarSonar_ModelFactors_ScoreModelIDArray: sonarModelFactor_[]; // Link to sonarSonar_ModelFactors
    
    @Field(() => [sonarScoreModelVersion_])
    sonarSonar_ScoreModelVersions_ScoreModelIDArray: sonarScoreModelVersion_[]; // Link to sonarSonar_ScoreModelVersions
    
    @Field(() => [sonarModelRelatedEntity_])
    sonarSonar_ModelRelatedEntities_ScoreModelIDArray: sonarModelRelatedEntity_[]; // Link to sonarSonar_ModelRelatedEntities
    
}

//****************************************************************************
// INPUT TYPE for Sonar: Score Models
//****************************************************************************
@InputType()
export class CreatesonarScoreModelInput {
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
// INPUT TYPE for Sonar: Score Models
//****************************************************************************
@InputType()
export class UpdatesonarScoreModelInput {
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
// RESOLVER for Sonar: Score Models
//****************************************************************************
@ObjectType()
export class RunsonarScoreModelViewResult {
    @Field(() => [sonarScoreModel_])
    Results: sonarScoreModel_[];

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

@Resolver(sonarScoreModel_)
export class sonarScoreModelResolver extends ResolverBase {
    @Query(() => RunsonarScoreModelViewResult)
    async RunsonarScoreModelViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarScoreModelViewResult)
    async RunsonarScoreModelViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarScoreModelViewResult)
    async RunsonarScoreModelDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Sonar: Score Models';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => sonarScoreModel_, { nullable: true })
    async sonarScoreModel(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<sonarScoreModel_ | null> {
        this.CheckUserReadPermissions('Sonar: Score Models', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScoreModels')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Score Models', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Sonar: Score Models', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [sonarScoreHistory_])
    async sonarSonar_ScoreHistories_ScoreModelIDArray(@Root() sonarscoremodel_: sonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Score Histories', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScoreHistories')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Score Histories', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarscoremodel_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Score Histories', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [sonarScoreBandTransition_])
    async sonarSonar_ScoreBandTransitions_ScoreModelIDArray(@Root() sonarscoremodel_: sonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Score Band Transitions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScoreBandTransitions')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Score Band Transitions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarscoremodel_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Score Band Transitions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [sonarScoreRecomputeRun_])
    async sonarSonar_ScoreRecomputeRuns_ScoreModelIDArray(@Root() sonarscoremodel_: sonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Score Recompute Runs', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScoreRecomputeRuns')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Score Recompute Runs', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarscoremodel_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Score Recompute Runs', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [sonarScore_])
    async sonarSonar_Scores_ScoreModelIDArray(@Root() sonarscoremodel_: sonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Scores', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScores')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Scores', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarscoremodel_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Scores', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [sonarScoreModelAuditEvent_])
    async sonarSonar_ScoreModelAuditEvents_ScoreModelIDArray(@Root() sonarscoremodel_: sonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Score Model Audit Events', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScoreModelAuditEvents')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Score Model Audit Events', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarscoremodel_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Score Model Audit Events', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [sonarFactor_])
    async sonarSonar_Factors_ScoreModelIDArray(@Root() sonarscoremodel_: sonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Factors', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwFactors')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Factors', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarscoremodel_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Factors', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [sonarFactor_])
    async sonarSonar_Factors_SourceScoreModelIDArray(@Root() sonarscoremodel_: sonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Factors', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwFactors')} WHERE ${provider.QuoteIdentifier('SourceScoreModelID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Factors', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarscoremodel_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Factors', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [sonarModelFactor_])
    async sonarSonar_ModelFactors_ScoreModelIDArray(@Root() sonarscoremodel_: sonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Model Factors', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwModelFactors')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Model Factors', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarscoremodel_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Model Factors', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [sonarScoreModelVersion_])
    async sonarSonar_ScoreModelVersions_ScoreModelIDArray(@Root() sonarscoremodel_: sonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Score Model Versions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScoreModelVersions')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Score Model Versions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarscoremodel_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Score Model Versions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [sonarModelRelatedEntity_])
    async sonarSonar_ModelRelatedEntities_ScoreModelIDArray(@Root() sonarscoremodel_: sonarScoreModel_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Model Related Entities', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwModelRelatedEntities')} WHERE ${provider.QuoteIdentifier('ScoreModelID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Model Related Entities', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarscoremodel_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Model Related Entities', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => sonarScoreModel_)
    async CreatesonarScoreModel(
        @Arg('input', () => CreatesonarScoreModelInput) input: CreatesonarScoreModelInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Sonar: Score Models', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => sonarScoreModel_)
    async UpdatesonarScoreModel(
        @Arg('input', () => UpdatesonarScoreModelInput) input: UpdatesonarScoreModelInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Sonar: Score Models', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => sonarScoreModel_)
    async DeletesonarScoreModel(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Sonar: Score Models', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Sonar: Score Recompute Runs
//****************************************************************************
@ObjectType({ description: `One batch or event recompute pass; drives the admin health view and compute/cost metering.` })
export class sonarScoreRecomputeRun_ {
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
        
    @Field(() => [sonarScoreBandTransition_])
    sonarSonar_ScoreBandTransitions_RecomputeRunIDArray: sonarScoreBandTransition_[]; // Link to sonarSonar_ScoreBandTransitions
    
}

//****************************************************************************
// INPUT TYPE for Sonar: Score Recompute Runs
//****************************************************************************
@InputType()
export class CreatesonarScoreRecomputeRunInput {
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
// INPUT TYPE for Sonar: Score Recompute Runs
//****************************************************************************
@InputType()
export class UpdatesonarScoreRecomputeRunInput {
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
// RESOLVER for Sonar: Score Recompute Runs
//****************************************************************************
@ObjectType()
export class RunsonarScoreRecomputeRunViewResult {
    @Field(() => [sonarScoreRecomputeRun_])
    Results: sonarScoreRecomputeRun_[];

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

@Resolver(sonarScoreRecomputeRun_)
export class sonarScoreRecomputeRunResolver extends ResolverBase {
    @Query(() => RunsonarScoreRecomputeRunViewResult)
    async RunsonarScoreRecomputeRunViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarScoreRecomputeRunViewResult)
    async RunsonarScoreRecomputeRunViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarScoreRecomputeRunViewResult)
    async RunsonarScoreRecomputeRunDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Sonar: Score Recompute Runs';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => sonarScoreRecomputeRun_, { nullable: true })
    async sonarScoreRecomputeRun(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<sonarScoreRecomputeRun_ | null> {
        this.CheckUserReadPermissions('Sonar: Score Recompute Runs', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScoreRecomputeRuns')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Score Recompute Runs', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Sonar: Score Recompute Runs', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [sonarScoreBandTransition_])
    async sonarSonar_ScoreBandTransitions_RecomputeRunIDArray(@Root() sonarscorerecomputerun_: sonarScoreRecomputeRun_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Score Band Transitions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScoreBandTransitions')} WHERE ${provider.QuoteIdentifier('RecomputeRunID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Score Band Transitions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarscorerecomputerun_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Score Band Transitions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => sonarScoreRecomputeRun_)
    async CreatesonarScoreRecomputeRun(
        @Arg('input', () => CreatesonarScoreRecomputeRunInput) input: CreatesonarScoreRecomputeRunInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Sonar: Score Recompute Runs', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => sonarScoreRecomputeRun_)
    async UpdatesonarScoreRecomputeRun(
        @Arg('input', () => UpdatesonarScoreRecomputeRunInput) input: UpdatesonarScoreRecomputeRunInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Sonar: Score Recompute Runs', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => sonarScoreRecomputeRun_)
    async DeletesonarScoreRecomputeRun(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Sonar: Score Recompute Runs', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Sonar: Scores
//****************************************************************************
@ObjectType({ description: `The current score for one anchor record under one model. Written back into MJ as a first-class entity.` })
export class sonarScore_ {
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
        
    @Field(() => [sonarScoreFactorContribution_])
    sonarSonar_ScoreFactorContributions_ScoreIDArray: sonarScoreFactorContribution_[]; // Link to sonarSonar_ScoreFactorContributions
    
}

//****************************************************************************
// INPUT TYPE for Sonar: Scores
//****************************************************************************
@InputType()
export class CreatesonarScoreInput {
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
// INPUT TYPE for Sonar: Scores
//****************************************************************************
@InputType()
export class UpdatesonarScoreInput {
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
// RESOLVER for Sonar: Scores
//****************************************************************************
@ObjectType()
export class RunsonarScoreViewResult {
    @Field(() => [sonarScore_])
    Results: sonarScore_[];

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

@Resolver(sonarScore_)
export class sonarScoreResolver extends ResolverBase {
    @Query(() => RunsonarScoreViewResult)
    async RunsonarScoreViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarScoreViewResult)
    async RunsonarScoreViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarScoreViewResult)
    async RunsonarScoreDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Sonar: Scores';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => sonarScore_, { nullable: true })
    async sonarScore(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<sonarScore_ | null> {
        this.CheckUserReadPermissions('Sonar: Scores', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScores')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Scores', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Sonar: Scores', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [sonarScoreFactorContribution_])
    async sonarSonar_ScoreFactorContributions_ScoreIDArray(@Root() sonarscore_: sonarScore_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Score Factor Contributions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwScoreFactorContributions')} WHERE ${provider.QuoteIdentifier('ScoreID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Score Factor Contributions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonarscore_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Score Factor Contributions', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => sonarScore_)
    async CreatesonarScore(
        @Arg('input', () => CreatesonarScoreInput) input: CreatesonarScoreInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Sonar: Scores', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => sonarScore_)
    async UpdatesonarScore(
        @Arg('input', () => UpdatesonarScoreInput) input: UpdatesonarScoreInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Sonar: Scores', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => sonarScore_)
    async DeletesonarScore(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Sonar: Scores', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for Sonar: Time Windows
//****************************************************************************
@ObjectType({ description: `A reusable, first-class time window used when evaluating factors (e.g. trailing 90 days, current term, renewal window -90d).` })
export class sonarTimeWindow_ {
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
        
    @Field(() => [sonarFactor_])
    sonarSonar_Factors_TimeWindowIDArray: sonarFactor_[]; // Link to sonarSonar_Factors
    
}

//****************************************************************************
// INPUT TYPE for Sonar: Time Windows
//****************************************************************************
@InputType()
export class CreatesonarTimeWindowInput {
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
// INPUT TYPE for Sonar: Time Windows
//****************************************************************************
@InputType()
export class UpdatesonarTimeWindowInput {
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
// RESOLVER for Sonar: Time Windows
//****************************************************************************
@ObjectType()
export class RunsonarTimeWindowViewResult {
    @Field(() => [sonarTimeWindow_])
    Results: sonarTimeWindow_[];

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

@Resolver(sonarTimeWindow_)
export class sonarTimeWindowResolver extends ResolverBase {
    @Query(() => RunsonarTimeWindowViewResult)
    async RunsonarTimeWindowViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarTimeWindowViewResult)
    async RunsonarTimeWindowViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunsonarTimeWindowViewResult)
    async RunsonarTimeWindowDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'Sonar: Time Windows';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => sonarTimeWindow_, { nullable: true })
    async sonarTimeWindow(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<sonarTimeWindow_ | null> {
        this.CheckUserReadPermissions('Sonar: Time Windows', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwTimeWindows')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Time Windows', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('Sonar: Time Windows', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [sonarFactor_])
    async sonarSonar_Factors_TimeWindowIDArray(@Root() sonartimewindow_: sonarTimeWindow_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('Sonar: Factors', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('__sonar', 'vwFactors')} WHERE ${provider.QuoteIdentifier('TimeWindowID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'Sonar: Factors', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [sonartimewindow_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('Sonar: Factors', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => sonarTimeWindow_)
    async CreatesonarTimeWindow(
        @Arg('input', () => CreatesonarTimeWindowInput) input: CreatesonarTimeWindowInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('Sonar: Time Windows', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => sonarTimeWindow_)
    async UpdatesonarTimeWindow(
        @Arg('input', () => UpdatesonarTimeWindowInput) input: UpdatesonarTimeWindowInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('Sonar: Time Windows', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => sonarTimeWindow_)
    async DeletesonarTimeWindow(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('Sonar: Time Windows', key, options, provider, userPayload, pubSub);
    }
    
}