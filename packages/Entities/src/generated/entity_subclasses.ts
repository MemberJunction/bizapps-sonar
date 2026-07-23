import { BaseEntity, EntitySaveOptions, EntityDeleteOptions, CompositeKey, ValidationResult, ValidationErrorInfo, ValidationErrorType, Metadata, ProviderType, DatabaseProviderBase } from "@memberjunction/core";
import { RegisterClass } from "@memberjunction/global";
import { z } from "zod";

export const loadModule = () => {
  // no-op, only used to ensure this file is a valid module and to allow easy loading
}

     
 
/**
 * zod schema definition for the entity MJ_BizApps_Sonar: Factors
 */
export const mjBizAppsSonarFactorSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    Name: z.string().describe(`
        * * Field Name: Name
        * * Display Name: Name
        * * SQL Data Type: nvarchar(200)
        * * Description: Human-readable name of the factor.`),
    Slug: z.string().describe(`
        * * Field Name: Slug
        * * Display Name: Slug
        * * SQL Data Type: nvarchar(100)
        * * Description: Stable handle for the factor, referenced by the rubric and combine expressions.`),
    Description: z.string().nullable().describe(`
        * * Field Name: Description
        * * Display Name: Description
        * * SQL Data Type: nvarchar(MAX)
        * * Description: Optional description of the signal the factor measures.`),
    ScoreModelID: z.string().nullable().describe(`
        * * Field Name: ScoreModelID
        * * Display Name: Score Model ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Models (vwScoreModels.ID)`),
    AnchorEntityID: z.string().describe(`
        * * Field Name: AnchorEntityID
        * * Display Name: Anchor Entity ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ: Entities (vwEntities.ID)`),
    FactorType: z.union([z.literal('ActionBacked'), z.literal('Constant'), z.literal('Declarative'), z.literal('DerivedFromScore')]).describe(`
        * * Field Name: FactorType
        * * Display Name: Factor Type
        * * SQL Data Type: nvarchar(20)
    * * Value List Type: List
    * * Possible Values 
    *   * ActionBacked
    *   * Constant
    *   * Declarative
    *   * DerivedFromScore
        * * Description: Factor kind: Declarative, ActionBacked, DerivedFromScore, or Constant. The rubric engine never branches on this.`),
    SourceRelatedEntityID: z.string().nullable().describe(`
        * * Field Name: SourceRelatedEntityID
        * * Display Name: Source Related Entity ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Model Related Entities (vwModelRelatedEntities.ID)`),
    SourceEntityID: z.string().nullable().describe(`
        * * Field Name: SourceEntityID
        * * Display Name: Source Entity ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ: Entities (vwEntities.ID)`),
    FilterExpression: z.string().nullable().describe(`
        * * Field Name: FilterExpression
        * * Display Name: Filter Expression
        * * SQL Data Type: nvarchar(MAX)
        * * Description: For declarative factors, the JSON/DSL filter applied to the source related entity (e.g. ActivityType IN (EmailOpen, EmailClick)).`),
    Aggregation: z.union([z.literal('Avg'), z.literal('Count'), z.literal('DistinctCount'), z.literal('Exists'), z.literal('Max'), z.literal('Min'), z.literal('RatePerPeriod'), z.literal('Recency'), z.literal('Sum'), z.literal('TrendSlope')]).nullable().describe(`
        * * Field Name: Aggregation
        * * Display Name: Aggregation
        * * SQL Data Type: nvarchar(20)
    * * Value List Type: List
    * * Possible Values 
    *   * Avg
    *   * Count
    *   * DistinctCount
    *   * Exists
    *   * Max
    *   * Min
    *   * RatePerPeriod
    *   * Recency
    *   * Sum
    *   * TrendSlope
        * * Description: Aggregation applied to the filtered source rows: Count, Sum, Avg, Min, Max, DistinctCount, Recency, RatePerPeriod, Exists, or TrendSlope.`),
    AggregateFieldName: z.string().nullable().describe(`
        * * Field Name: AggregateFieldName
        * * Display Name: Aggregate Field Name
        * * SQL Data Type: nvarchar(200)
        * * Description: Column on the source entity to sum or average; null for Count/Exists aggregations.`),
    TimeWindowID: z.string().nullable().describe(`
        * * Field Name: TimeWindowID
        * * Display Name: Time Window ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Time Windows (vwTimeWindows.ID)`),
    RecencyDecayHalfLifeDays: z.number().nullable().describe(`
        * * Field Name: RecencyDecayHalfLifeDays
        * * Display Name: Recency Decay Half Life Days
        * * SQL Data Type: int
        * * Description: Optional half-life in days for recency-weighted aggregation.`),
    ActionID: z.string().nullable().describe(`
        * * Field Name: ActionID
        * * Display Name: Action ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ: Actions (vwActions.ID)`),
    ActionParamsJSON: z.string().nullable().describe(`
        * * Field Name: ActionParamsJSON
        * * Display Name: Action Params JSON
        * * SQL Data Type: nvarchar(MAX)
        * * Description: For ActionBacked factors, static parameters (JSON) bound to the Action at config time.`),
    ExecutionMode: z.union([z.literal('Batch'), z.literal('PerRecord')]).nullable().describe(`
        * * Field Name: ExecutionMode
        * * Display Name: Execution Mode
        * * SQL Data Type: nvarchar(12)
    * * Value List Type: List
    * * Possible Values 
    *   * Batch
    *   * PerRecord
        * * Description: Execution mode for ActionBacked factors: PerRecord or Batch.`),
    IsExpensive: z.boolean().describe(`
        * * Field Name: IsExpensive
        * * Display Name: Is Expensive
        * * SQL Data Type: bit
        * * Default Value: 0
        * * Description: Marks the factor as expensive to evaluate; surfaced in the builder and used for recompute budgeting.`),
    MaxConcurrency: z.number().nullable().describe(`
        * * Field Name: MaxConcurrency
        * * Display Name: Max Concurrency
        * * SQL Data Type: int
        * * Description: Optional maximum concurrency for evaluating an ActionBacked factor.`),
    RateLimitPerMinute: z.number().nullable().describe(`
        * * Field Name: RateLimitPerMinute
        * * Display Name: Rate Limit Per Minute
        * * SQL Data Type: int
        * * Description: Optional rate limit per minute for external-API-backed Actions.`),
    CacheTTLSeconds: z.number().nullable().describe(`
        * * Field Name: CacheTTLSeconds
        * * Display Name: Cache TTL Seconds
        * * SQL Data Type: int
        * * Description: Result cache time-to-live in seconds, keyed by (anchor record, as-of date, params hash).`),
    SourceScoreModelID: z.string().nullable().describe(`
        * * Field Name: SourceScoreModelID
        * * Display Name: Source Score Model ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Models (vwScoreModels.ID)`),
    RawDataType: z.union([z.literal('Boolean'), z.literal('Date'), z.literal('Duration'), z.literal('Number')]).nullable().describe(`
        * * Field Name: RawDataType
        * * Display Name: Raw Data Type
        * * SQL Data Type: nvarchar(12)
    * * Value List Type: List
    * * Possible Values 
    *   * Boolean
    *   * Date
    *   * Duration
    *   * Number
        * * Description: Raw data type produced by the factor before normalization: Number, Date, Boolean, or Duration.`),
    NormalizationMethod: z.union([z.literal('Banded'), z.literal('Logistic'), z.literal('Lookup'), z.literal('MinMax'), z.literal('None'), z.literal('Percentile'), z.literal('ZScore')]).nullable().describe(`
        * * Field Name: NormalizationMethod
        * * Display Name: Normalization Method
        * * SQL Data Type: nvarchar(20)
    * * Value List Type: List
    * * Possible Values 
    *   * Banded
    *   * Logistic
    *   * Lookup
    *   * MinMax
    *   * None
    *   * Percentile
    *   * ZScore
        * * Description: Normalization method mapping the raw value to a contribution: None, MinMax, Percentile, ZScore, Logistic, Banded, or Lookup.`),
    NormalizationParamsJSON: z.string().nullable().describe(`
        * * Field Name: NormalizationParamsJSON
        * * Display Name: Normalization Params JSON
        * * SQL Data Type: nvarchar(MAX)
        * * Description: JSON parameters for the normalization method (clamps, percentile basis, logistic midpoint/steepness, banded thresholds, lookup table).`),
    OutputMin: z.number().nullable().describe(`
        * * Field Name: OutputMin
        * * Display Name: Output Min
        * * SQL Data Type: decimal(9, 4)
        * * Description: Lower bound of the normalized contribution range (e.g. 0).`),
    OutputMax: z.number().nullable().describe(`
        * * Field Name: OutputMax
        * * Display Name: Output Max
        * * SQL Data Type: decimal(9, 4)
        * * Description: Upper bound of the normalized contribution range (e.g. 1).`),
    HigherIsBetter: z.boolean().describe(`
        * * Field Name: HigherIsBetter
        * * Display Name: Higher Is Better
        * * SQL Data Type: bit
        * * Default Value: 1
        * * Description: Direction of the signal; when false, higher raw values are worse (e.g. days since last login).`),
    PromotionState: z.union([z.literal('Approved'), z.literal('Deprecated'), z.literal('Draft'), z.literal('InReview')]).nullable().describe(`
        * * Field Name: PromotionState
        * * Display Name: Promotion State
        * * SQL Data Type: nvarchar(20)
    * * Value List Type: List
    * * Possible Values 
    *   * Approved
    *   * Deprecated
    *   * Draft
    *   * InReview
        * * Description: Governance state, enforced for ActionBacked factors before production use: Draft, InReview, Approved, or Deprecated.`),
    LastValidatedAt: z.date().nullable().describe(`
        * * Field Name: LastValidatedAt
        * * Display Name: Last Validated At
        * * SQL Data Type: datetime2
        * * Description: UTC timestamp of the most recent validation of the factor.`),
    CreatedByAgent: z.string().nullable().describe(`
        * * Field Name: CreatedByAgent
        * * Display Name: Created By Agent
        * * SQL Data Type: nvarchar(60)
        * * Description: Name of the AI agent that created the factor, if any (e.g. ModelBuilderAgent, ActionBuilder).`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    DateField: z.string().nullable().describe(`
        * * Field Name: DateField
        * * Display Name: Date Field
        * * SQL Data Type: nvarchar(200)
        * * Description: The date column on the factor's related (source) entity that a time window filters on — the "when did it happen" column (e.g. RegistrationDate). Used by Rolling/Calendar/SinceEvent windows; null = no date filter (count everything in scope).`),
    ScoreModel: z.string().nullable().describe(`
        * * Field Name: ScoreModel
        * * Display Name: Score Model
        * * SQL Data Type: nvarchar(200)`),
    AnchorEntity: z.string().describe(`
        * * Field Name: AnchorEntity
        * * Display Name: Anchor Entity
        * * SQL Data Type: nvarchar(255)`),
    SourceEntity: z.string().nullable().describe(`
        * * Field Name: SourceEntity
        * * Display Name: Source Entity
        * * SQL Data Type: nvarchar(255)`),
    TimeWindow: z.string().nullable().describe(`
        * * Field Name: TimeWindow
        * * Display Name: Time Window
        * * SQL Data Type: nvarchar(120)`),
    Action: z.string().nullable().describe(`
        * * Field Name: Action
        * * Display Name: Action
        * * SQL Data Type: nvarchar(425)`),
    SourceScoreModel: z.string().nullable().describe(`
        * * Field Name: SourceScoreModel
        * * Display Name: Source Score Model
        * * SQL Data Type: nvarchar(200)`),
});

export type mjBizAppsSonarFactorEntityType = z.infer<typeof mjBizAppsSonarFactorSchema>;

/**
 * zod schema definition for the entity MJ_BizApps_Sonar: Intervention Assignments
 */
export const mjBizAppsSonarInterventionAssignmentSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    InterventionID: z.string().describe(`
        * * Field Name: InterventionID
        * * Display Name: Intervention ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Interventions (vwInterventions.ID)`),
    AnchorRecordID: z.string().describe(`
        * * Field Name: AnchorRecordID
        * * Display Name: Anchor Record ID
        * * SQL Data Type: nvarchar(450)
        * * Description: Canonical id of the assigned anchor record (matches Score.AnchorRecordID).`),
    AnchorRecordKeyJSON: z.string().nullable().describe(`
        * * Field Name: AnchorRecordKeyJSON
        * * Display Name: Anchor Record Key
        * * SQL Data Type: nvarchar(MAX)
        * * Description: Optional JSON of a composite anchor key (matches Score.AnchorRecordKeyJSON) for multi-column-PK anchors.`),
    Cohort: z.union([z.literal('Control'), z.literal('Treatment')]).describe(`
        * * Field Name: Cohort
        * * Display Name: Cohort
        * * SQL Data Type: nvarchar(10)
    * * Value List Type: List
    * * Possible Values 
    *   * Control
    *   * Treatment
        * * Description: Whether this member is in the Treatment cohort (the Action fires) or the Control cohort (held out).`),
    AssignedAt: z.date().describe(`
        * * Field Name: AssignedAt
        * * Display Name: Assigned At
        * * SQL Data Type: datetime2
        * * Default Value: getutcdate()
        * * Description: When the member was assigned to this intervention.`),
    ActionDeliveryStatus: z.string().nullable().describe(`
        * * Field Name: ActionDeliveryStatus
        * * Display Name: Action Delivery Status
        * * SQL Data Type: nvarchar(20)
        * * Description: Delivery state of the fired Action for a Treatment member (e.g. Pending, Delivered, Failed, Skipped); null for Control.`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    Intervention: z.string().describe(`
        * * Field Name: Intervention
        * * Display Name: Intervention
        * * SQL Data Type: nvarchar(200)`),
});

export type mjBizAppsSonarInterventionAssignmentEntityType = z.infer<typeof mjBizAppsSonarInterventionAssignmentSchema>;

/**
 * zod schema definition for the entity MJ_BizApps_Sonar: Intervention Outcomes
 */
export const mjBizAppsSonarInterventionOutcomeSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    AssignmentID: z.string().describe(`
        * * Field Name: AssignmentID
        * * Display Name: Assignment ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Intervention Assignments (vwInterventionAssignments.ID)`),
    OutcomeType: z.union([z.literal('Churned'), z.literal('NoChange'), z.literal('Reactivated'), z.literal('Renewed'), z.literal('Upgraded')]).describe(`
        * * Field Name: OutcomeType
        * * Display Name: Outcome Type
        * * SQL Data Type: nvarchar(16)
    * * Value List Type: List
    * * Possible Values 
    *   * Churned
    *   * NoChange
    *   * Reactivated
    *   * Renewed
    *   * Upgraded
        * * Description: The business outcome observed: Renewed, Reactivated, Churned, Upgraded, or NoChange.`),
    OutcomeAt: z.date().nullable().describe(`
        * * Field Name: OutcomeAt
        * * Display Name: Outcome At
        * * SQL Data Type: datetime2
        * * Description: When the business outcome occurred.`),
    ScoreDeltaAfter: z.number().nullable().describe(`
        * * Field Name: ScoreDeltaAfter
        * * Display Name: Score Delta After
        * * SQL Data Type: decimal(9, 4)
        * * Description: Change in the member's normalized score from assignment to measurement (engagement movement after the play).`),
    MeasuredAt: z.date().nullable().describe(`
        * * Field Name: MeasuredAt
        * * Display Name: Measured At
        * * SQL Data Type: datetime2
        * * Description: When the outcome was measured/recorded.`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    Assignment: z.string().describe(`
        * * Field Name: Assignment
        * * Display Name: Assignment
        * * SQL Data Type: nvarchar(450)`),
});

export type mjBizAppsSonarInterventionOutcomeEntityType = z.infer<typeof mjBizAppsSonarInterventionOutcomeSchema>;

/**
 * zod schema definition for the entity MJ_BizApps_Sonar: Interventions
 */
export const mjBizAppsSonarInterventionSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    ScoreSegmentID: z.string().describe(`
        * * Field Name: ScoreSegmentID
        * * Display Name: Score Segment ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Segments (vwScoreSegments.ID)`),
    Name: z.string().describe(`
        * * Field Name: Name
        * * Display Name: Name
        * * SQL Data Type: nvarchar(200)
        * * Description: Display name of the intervention.`),
    Description: z.string().nullable().describe(`
        * * Field Name: Description
        * * Display Name: Description
        * * SQL Data Type: nvarchar(MAX)
        * * Description: Optional description of the play and its intent.`),
    TriggerType: z.union([z.literal('Manual'), z.literal('OnEnterSegment'), z.literal('Scheduled')]).describe(`
        * * Field Name: TriggerType
        * * Display Name: Trigger Type
        * * SQL Data Type: nvarchar(20)
        * * Default Value: Manual
    * * Value List Type: List
    * * Possible Values 
    *   * Manual
    *   * OnEnterSegment
    *   * Scheduled
        * * Description: When the intervention fires: OnEnterSegment (member newly matches), Scheduled, or Manual.`),
    ActionID: z.string().describe(`
        * * Field Name: ActionID
        * * Display Name: Action ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ: Actions (vwActions.ID)`),
    ControlGroupPercent: z.number().nullable().describe(`
        * * Field Name: ControlGroupPercent
        * * Display Name: Control Group Percent
        * * SQL Data Type: decimal(5, 2)
        * * Description: Percent of matched members withheld as a control group (holdout) so treatment-vs-control lift can be measured; null = no holdout.`),
    Status: z.union([z.literal('Active'), z.literal('Draft'), z.literal('Paused')]).describe(`
        * * Field Name: Status
        * * Display Name: Status
        * * SQL Data Type: nvarchar(16)
        * * Default Value: Draft
    * * Value List Type: List
    * * Possible Values 
    *   * Active
    *   * Draft
    *   * Paused
        * * Description: Lifecycle state: Draft (not firing), Active (firing per its trigger), or Paused.`),
    ActionParamsJSON: z.string().nullable().describe(`
        * * Field Name: ActionParamsJSON
        * * Display Name: Action Parameters
        * * SQL Data Type: nvarchar(MAX)
        * * Description: JSON [{name,value}] params handed to the intervention's Action on every fire; a {{member}} token in a value is replaced with the member's anchor id. Null = fire with no params.`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    ScoreSegment: z.string().describe(`
        * * Field Name: ScoreSegment
        * * Display Name: Score Segment
        * * SQL Data Type: nvarchar(200)`),
    Action: z.string().describe(`
        * * Field Name: Action
        * * Display Name: Action
        * * SQL Data Type: nvarchar(425)`),
});

export type mjBizAppsSonarInterventionEntityType = z.infer<typeof mjBizAppsSonarInterventionSchema>;

/**
 * zod schema definition for the entity MJ_BizApps_Sonar: Model Factors
 */
export const mjBizAppsSonarModelFactorSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    ScoreModelID: z.string().describe(`
        * * Field Name: ScoreModelID
        * * Display Name: Score Model ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Models (vwScoreModels.ID)`),
    FactorID: z.string().describe(`
        * * Field Name: FactorID
        * * Display Name: Factor ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Factors (vwFactors.ID)`),
    Weight: z.number().describe(`
        * * Field Name: Weight
        * * Display Name: Weight
        * * SQL Data Type: decimal(9, 4)
        * * Default Value: 1
        * * Description: Weight applied to this factor's normalized contribution.`),
    WeightMode: z.union([z.literal('Additive'), z.literal('Bonus'), z.literal('Gate'), z.literal('Multiplier'), z.literal('Penalty')]).describe(`
        * * Field Name: WeightMode
        * * Display Name: Weight Mode
        * * SQL Data Type: nvarchar(12)
        * * Default Value: Additive
    * * Value List Type: List
    * * Possible Values 
    *   * Additive
    *   * Bonus
    *   * Gate
    *   * Multiplier
    *   * Penalty
        * * Description: How the weight is applied: Additive, Multiplier, Gate, Penalty, or Bonus.`),
    ContributionCap: z.number().nullable().describe(`
        * * Field Name: ContributionCap
        * * Display Name: Contribution Cap
        * * SQL Data Type: decimal(9, 4)
        * * Description: Optional upper clamp on this factor's contribution.`),
    ContributionFloor: z.number().nullable().describe(`
        * * Field Name: ContributionFloor
        * * Display Name: Contribution Floor
        * * SQL Data Type: decimal(9, 4)
        * * Description: Optional lower clamp on this factor's contribution.`),
    TrendWeight: z.number().nullable().describe(`
        * * Field Name: TrendWeight
        * * Display Name: Trend Weight
        * * SQL Data Type: decimal(9, 4)
        * * Description: Extra weight placed on the factor's delta versus its level (encodes "a falling 80 beats a steady 50").`),
    MissingDataPolicy: z.union([z.literal('Exclude'), z.literal('ModelDefault'), z.literal('NeutralMidpoint'), z.literal('Zero')]).describe(`
        * * Field Name: MissingDataPolicy
        * * Display Name: Missing Data Policy
        * * SQL Data Type: nvarchar(16)
        * * Default Value: ModelDefault
    * * Value List Type: List
    * * Possible Values 
    *   * Exclude
    *   * ModelDefault
    *   * NeutralMidpoint
    *   * Zero
        * * Description: Policy when the factor has no data: Zero, NeutralMidpoint, Exclude, or ModelDefault.`),
    IsRequired: z.boolean().describe(`
        * * Field Name: IsRequired
        * * Display Name: Is Required
        * * SQL Data Type: bit
        * * Default Value: 0
        * * Description: When true and data is missing, the resulting score is flagged low-confidence.`),
    DisplayLabel: z.string().nullable().describe(`
        * * Field Name: DisplayLabel
        * * Display Name: Display Label
        * * SQL Data Type: nvarchar(200)
        * * Description: Label shown for this factor in explainability views, e.g. "Newsletter engagement".`),
    DisplayOrder: z.number().nullable().describe(`
        * * Field Name: DisplayOrder
        * * Display Name: Display Order
        * * SQL Data Type: int
        * * Description: Sort order for displaying this factor in the rubric and explainability views.`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    ScoreModel: z.string().describe(`
        * * Field Name: ScoreModel
        * * Display Name: Score Model
        * * SQL Data Type: nvarchar(200)`),
    Factor: z.string().describe(`
        * * Field Name: Factor
        * * Display Name: Factor
        * * SQL Data Type: nvarchar(200)`),
});

export type mjBizAppsSonarModelFactorEntityType = z.infer<typeof mjBizAppsSonarModelFactorSchema>;

/**
 * zod schema definition for the entity MJ_BizApps_Sonar: Model Related Entities
 */
export const mjBizAppsSonarModelRelatedEntitySchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    ScoreModelID: z.string().describe(`
        * * Field Name: ScoreModelID
        * * Display Name: Score Model ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Models (vwScoreModels.ID)`),
    RelatedEntityID: z.string().describe(`
        * * Field Name: RelatedEntityID
        * * Display Name: Related Entity ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ: Entities (vwEntities.ID)`),
    Alias: z.string().describe(`
        * * Field Name: Alias
        * * Display Name: Alias
        * * SQL Data Type: nvarchar(100)
        * * Description: Handle used by factors to reference this related entity, e.g. crm_activity, invoices, lms_completions.`),
    RelationshipPath: z.string().describe(`
        * * Field Name: RelationshipPath
        * * Display Name: Relationship Path
        * * SQL Data Type: nvarchar(MAX)
        * * Description: JSON describing the join path from the anchor to the related entity (direct FK or multi-hop), resolved against MJ relationship metadata.`),
    JoinType: z.union([z.literal('Inner'), z.literal('Left')]).describe(`
        * * Field Name: JoinType
        * * Display Name: Join Type
        * * SQL Data Type: nvarchar(10)
        * * Default Value: Left
    * * Value List Type: List
    * * Possible Values 
    *   * Inner
    *   * Left
        * * Description: Join type from anchor to related entity: Inner or Left (usually Left so absence of related data is itself scorable).`),
    SourceSystemTag: z.string().nullable().describe(`
        * * Field Name: SourceSystemTag
        * * Display Name: Source System Tag
        * * SQL Data Type: nvarchar(60)
        * * Description: Informational provenance tag for the source system (e.g. Salesforce, Finance, LMS, Community, Email).`),
    Description: z.string().nullable().describe(`
        * * Field Name: Description
        * * Display Name: Description
        * * SQL Data Type: nvarchar(MAX)
        * * Description: Optional description of the related-entity mapping.`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    ScoreModel: z.string().describe(`
        * * Field Name: ScoreModel
        * * Display Name: Score Model
        * * SQL Data Type: nvarchar(200)`),
    RelatedEntity: z.string().describe(`
        * * Field Name: RelatedEntity
        * * Display Name: Related Entity
        * * SQL Data Type: nvarchar(255)`),
});

export type mjBizAppsSonarModelRelatedEntityEntityType = z.infer<typeof mjBizAppsSonarModelRelatedEntitySchema>;

/**
 * zod schema definition for the entity MJ_BizApps_Sonar: Score Band Sets
 */
export const mjBizAppsSonarScoreBandSetSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    Name: z.string().describe(`
        * * Field Name: Name
        * * Display Name: Name
        * * SQL Data Type: nvarchar(200)
        * * Description: Display name of the band set.`),
    AnchorEntityID: z.string().nullable().describe(`
        * * Field Name: AnchorEntityID
        * * Display Name: Anchor Entity ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ: Entities (vwEntities.ID)`),
    Description: z.string().nullable().describe(`
        * * Field Name: Description
        * * Display Name: Description
        * * SQL Data Type: nvarchar(MAX)
        * * Description: Optional description of the band set and its intended use.`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    AnchorEntity: z.string().nullable().describe(`
        * * Field Name: AnchorEntity
        * * Display Name: Anchor Entity
        * * SQL Data Type: nvarchar(255)`),
});

export type mjBizAppsSonarScoreBandSetEntityType = z.infer<typeof mjBizAppsSonarScoreBandSetSchema>;

/**
 * zod schema definition for the entity MJ_BizApps_Sonar: Score Band Transitions
 */
export const mjBizAppsSonarScoreBandTransitionSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    ScoreModelID: z.string().describe(`
        * * Field Name: ScoreModelID
        * * Display Name: Score Model ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Models (vwScoreModels.ID)`),
    AnchorRecordID: z.string().describe(`
        * * Field Name: AnchorRecordID
        * * Display Name: Anchor Record ID
        * * SQL Data Type: nvarchar(450)
        * * Description: Primary-key value of the anchor record that crossed bands, stored as a string to stay entity-agnostic.`),
    FromBandID: z.string().nullable().describe(`
        * * Field Name: FromBandID
        * * Display Name: From Band ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Bands (vwScoreBands.ID)`),
    ToBandID: z.string().nullable().describe(`
        * * Field Name: ToBandID
        * * Display Name: To Band ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Bands (vwScoreBands.ID)`),
    Direction: z.union([z.literal('Improving'), z.literal('Worsening')]).nullable().describe(`
        * * Field Name: Direction
        * * Display Name: Direction
        * * SQL Data Type: nvarchar(12)
    * * Value List Type: List
    * * Possible Values 
    *   * Improving
    *   * Worsening
        * * Description: Direction of the crossing: Improving or Worsening.`),
    OccurredAt: z.date().describe(`
        * * Field Name: OccurredAt
        * * Display Name: Occurred At
        * * SQL Data Type: datetime2
        * * Default Value: getutcdate()
        * * Description: UTC timestamp at which the band crossing occurred.`),
    RecomputeRunID: z.string().nullable().describe(`
        * * Field Name: RecomputeRunID
        * * Display Name: Recompute Run ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Recompute Runs (vwScoreRecomputeRuns.ID)`),
    Handled: z.boolean().describe(`
        * * Field Name: Handled
        * * Display Name: Handled
        * * SQL Data Type: bit
        * * Default Value: 0
        * * Description: Indicates whether the transition has been picked up by write-back or an intervention.`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    ScoreModel: z.string().describe(`
        * * Field Name: ScoreModel
        * * Display Name: Score Model
        * * SQL Data Type: nvarchar(200)`),
});

export type mjBizAppsSonarScoreBandTransitionEntityType = z.infer<typeof mjBizAppsSonarScoreBandTransitionSchema>;

/**
 * zod schema definition for the entity MJ_BizApps_Sonar: Score Bands
 */
export const mjBizAppsSonarScoreBandSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    BandSetID: z.string().describe(`
        * * Field Name: BandSetID
        * * Display Name: Band Set ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Band Sets (vwScoreBandSets.ID)`),
    Label: z.string().describe(`
        * * Field Name: Label
        * * Display Name: Label
        * * SQL Data Type: nvarchar(60)
        * * Description: Display label for the band, e.g. Healthy, Watch, At-Risk, Critical.`),
    MinScore: z.number().describe(`
        * * Field Name: MinScore
        * * Display Name: Min Score
        * * SQL Data Type: decimal(9, 4)
        * * Description: Inclusive lower bound of the band score range.`),
    MaxScore: z.number().describe(`
        * * Field Name: MaxScore
        * * Display Name: Max Score
        * * SQL Data Type: decimal(9, 4)
        * * Description: Exclusive upper bound of the band score range (half-open; ranges are contiguous and non-overlapping).`),
    Severity: z.number().describe(`
        * * Field Name: Severity
        * * Display Name: Severity
        * * SQL Data Type: int
        * * Default Value: 0
        * * Description: Severity rank where 0 is best and higher numbers are worse; drives sort order and color.`),
    ColorHex: z.string().nullable().describe(`
        * * Field Name: ColorHex
        * * Display Name: Color Hex
        * * SQL Data Type: nvarchar(7)
        * * Description: Hex color code (e.g. #2E7D32) used to render the band in the UI.`),
    IsTerminal: z.boolean().describe(`
        * * Field Name: IsTerminal
        * * Display Name: Is Terminal
        * * SQL Data Type: bit
        * * Default Value: 0
        * * Description: Indicates a terminal band (e.g. Lapsed) that represents an end state rather than a point on the continuum.`),
    Description: z.string().nullable().describe(`
        * * Field Name: Description
        * * Display Name: Description
        * * SQL Data Type: nvarchar(MAX)
        * * Description: Optional description of what this band means.`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    BandSet: z.string().describe(`
        * * Field Name: BandSet
        * * Display Name: Band Set
        * * SQL Data Type: nvarchar(200)`),
});

export type mjBizAppsSonarScoreBandEntityType = z.infer<typeof mjBizAppsSonarScoreBandSchema>;

/**
 * zod schema definition for the entity MJ_BizApps_Sonar: Score Factor Contributions
 */
export const mjBizAppsSonarScoreFactorContributionSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    ScoreID: z.string().describe(`
        * * Field Name: ScoreID
        * * Display Name: Score ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Scores (vwScores.ID)`),
    ModelFactorID: z.string().describe(`
        * * Field Name: ModelFactorID
        * * Display Name: Model Factor ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Model Factors (vwModelFactors.ID)`),
    FactorID: z.string().describe(`
        * * Field Name: FactorID
        * * Display Name: Factor ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Factors (vwFactors.ID)`),
    RawValue: z.number().nullable().describe(`
        * * Field Name: RawValue
        * * Display Name: Raw Value
        * * SQL Data Type: decimal(18, 6)
        * * Description: Raw value the factor produced before normalization.`),
    NormalizedValue: z.number().nullable().describe(`
        * * Field Name: NormalizedValue
        * * Display Name: Normalized Value
        * * SQL Data Type: decimal(9, 4)
        * * Description: The factor's normalized output (e.g. 0-1 or configured range).`),
    WeightedContribution: z.number().nullable().describe(`
        * * Field Name: WeightedContribution
        * * Display Name: Weighted Contribution
        * * SQL Data Type: decimal(12, 4)
        * * Description: Amount this factor added to the score after weighting.`),
    PercentOfTotal: z.number().nullable().describe(`
        * * Field Name: PercentOfTotal
        * * Display Name: Percent Of Total
        * * SQL Data Type: decimal(5, 4)
        * * Description: Share of the total score attributable to this factor.`),
    ContributionDelta: z.number().nullable().describe(`
        * * Field Name: ContributionDelta
        * * Display Name: Contribution Delta
        * * SQL Data Type: decimal(12, 4)
        * * Description: Change in this factor's contribution versus the previous score.`),
    HadData: z.boolean().describe(`
        * * Field Name: HadData
        * * Display Name: Had Data
        * * SQL Data Type: bit
        * * Default Value: 0
        * * Description: Indicates whether the factor had data for this record.`),
    MissingDataApplied: z.boolean().describe(`
        * * Field Name: MissingDataApplied
        * * Display Name: Missing Data Applied
        * * SQL Data Type: bit
        * * Default Value: 0
        * * Description: Indicates whether a missing-data policy was applied for this factor.`),
    DetailJSON: z.string().nullable().describe(`
        * * Field Name: DetailJSON
        * * Display Name: Detail JSON
        * * SQL Data Type: nvarchar(MAX)
        * * Description: Optional JSON with sampled underlying record references for drill-through.`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    Factor: z.string().describe(`
        * * Field Name: Factor
        * * Display Name: Factor
        * * SQL Data Type: nvarchar(200)`),
});

export type mjBizAppsSonarScoreFactorContributionEntityType = z.infer<typeof mjBizAppsSonarScoreFactorContributionSchema>;

/**
 * zod schema definition for the entity MJ_BizApps_Sonar: Score Histories
 */
export const mjBizAppsSonarScoreHistorySchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    ScoreModelID: z.string().describe(`
        * * Field Name: ScoreModelID
        * * Display Name: Score Model ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Models (vwScoreModels.ID)`),
    ScoreModelVersionID: z.string().describe(`
        * * Field Name: ScoreModelVersionID
        * * Display Name: Score Model Version ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Model Versions (vwScoreModelVersions.ID)`),
    AnchorEntityID: z.string().describe(`
        * * Field Name: AnchorEntityID
        * * Display Name: Anchor Entity ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ: Entities (vwEntities.ID)`),
    AnchorRecordID: z.string().describe(`
        * * Field Name: AnchorRecordID
        * * Display Name: Anchor Record ID
        * * SQL Data Type: nvarchar(450)
        * * Description: Primary-key value of the scored anchor record, stored as a string to stay entity-agnostic.`),
    NormalizedScore: z.number().nullable().describe(`
        * * Field Name: NormalizedScore
        * * Display Name: Normalized Score
        * * SQL Data Type: decimal(9, 4)
        * * Description: The headline normalized score at this point in time.`),
    BandID: z.string().nullable().describe(`
        * * Field Name: BandID
        * * Display Name: Band ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Bands (vwScoreBands.ID)`),
    AsOfDate: z.date().nullable().describe(`
        * * Field Name: AsOfDate
        * * Display Name: As Of Date
        * * SQL Data Type: datetime2
        * * Description: The "now" the time windows resolved against for this snapshot.`),
    ComputedAt: z.date().describe(`
        * * Field Name: ComputedAt
        * * Display Name: Computed At
        * * SQL Data Type: datetime2
        * * Default Value: getutcdate()
        * * Description: UTC timestamp at which this snapshot was computed.`),
    DataCompleteness: z.number().nullable().describe(`
        * * Field Name: DataCompleteness
        * * Display Name: Data Completeness
        * * SQL Data Type: decimal(5, 4)
        * * Description: Fraction of factors that had data at this point in time (0-1).`),
    Confidence: z.number().nullable().describe(`
        * * Field Name: Confidence
        * * Display Name: Confidence
        * * SQL Data Type: decimal(5, 4)
        * * Description: Confidence in the score at this point in time (0-1).`),
    ContributionsJSON: z.string().nullable().describe(`
        * * Field Name: ContributionsJSON
        * * Display Name: Contributions JSON
        * * SQL Data Type: nvarchar(MAX)
        * * Description: Compact per-factor snapshot (JSON) for point-in-time explainability without exploding row counts.`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    ScoreModel: z.string().describe(`
        * * Field Name: ScoreModel
        * * Display Name: Score Model
        * * SQL Data Type: nvarchar(200)`),
    AnchorEntity: z.string().describe(`
        * * Field Name: AnchorEntity
        * * Display Name: Anchor Entity
        * * SQL Data Type: nvarchar(255)`),
});

export type mjBizAppsSonarScoreHistoryEntityType = z.infer<typeof mjBizAppsSonarScoreHistorySchema>;

/**
 * zod schema definition for the entity MJ_BizApps_Sonar: Score Model Audit Events
 */
export const mjBizAppsSonarScoreModelAuditEventSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    ScoreModelID: z.string().describe(`
        * * Field Name: ScoreModelID
        * * Display Name: Score Model ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Models (vwScoreModels.ID)`),
    EntityChanged: z.string().describe(`
        * * Field Name: EntityChanged
        * * Display Name: Entity Changed
        * * SQL Data Type: nvarchar(100)
        * * Description: Name of the configuration entity that changed (e.g. ScoreModel, Factor, ModelFactor).`),
    RecordID: z.string().nullable().describe(`
        * * Field Name: RecordID
        * * Display Name: Record ID
        * * SQL Data Type: nvarchar(100)
        * * Description: Identifier of the specific record that changed, stored as a string to stay entity-agnostic.`),
    ChangeType: z.union([z.literal('Create'), z.literal('Delete'), z.literal('Publish'), z.literal('Update')]).describe(`
        * * Field Name: ChangeType
        * * Display Name: Change Type
        * * SQL Data Type: nvarchar(20)
    * * Value List Type: List
    * * Possible Values 
    *   * Create
    *   * Delete
    *   * Publish
    *   * Update
        * * Description: Kind of change: Create, Update, Delete, or Publish.`),
    BeforeJSON: z.string().nullable().describe(`
        * * Field Name: BeforeJSON
        * * Display Name: Before JSON
        * * SQL Data Type: nvarchar(MAX)
        * * Description: JSON snapshot of the record before the change.`),
    AfterJSON: z.string().nullable().describe(`
        * * Field Name: AfterJSON
        * * Display Name: After JSON
        * * SQL Data Type: nvarchar(MAX)
        * * Description: JSON snapshot of the record after the change.`),
    ChangedByUserID: z.string().nullable().describe(`
        * * Field Name: ChangedByUserID
        * * Display Name: Changed By User ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ: Users (vwUsers.ID)`),
    ChangedAt: z.date().describe(`
        * * Field Name: ChangedAt
        * * Display Name: Changed At
        * * SQL Data Type: datetime2
        * * Default Value: getutcdate()
        * * Description: UTC timestamp at which the change occurred.`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    ScoreModel: z.string().describe(`
        * * Field Name: ScoreModel
        * * Display Name: Score Model
        * * SQL Data Type: nvarchar(200)`),
    ChangedByUser: z.string().nullable().describe(`
        * * Field Name: ChangedByUser
        * * Display Name: Changed By User
        * * SQL Data Type: nvarchar(100)`),
});

export type mjBizAppsSonarScoreModelAuditEventEntityType = z.infer<typeof mjBizAppsSonarScoreModelAuditEventSchema>;

/**
 * zod schema definition for the entity MJ_BizApps_Sonar: Score Model Versions
 */
export const mjBizAppsSonarScoreModelVersionSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    ScoreModelID: z.string().describe(`
        * * Field Name: ScoreModelID
        * * Display Name: Score Model ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Models (vwScoreModels.ID)`),
    VersionNumber: z.number().describe(`
        * * Field Name: VersionNumber
        * * Display Name: Version Number
        * * SQL Data Type: int
        * * Description: Monotonic version number within the model.`),
    VersionLabel: z.string().nullable().describe(`
        * * Field Name: VersionLabel
        * * Display Name: Version Label
        * * SQL Data Type: nvarchar(50)
        * * Description: Optional human-readable label for the version.`),
    ConfigSnapshotJSON: z.string().describe(`
        * * Field Name: ConfigSnapshotJSON
        * * Display Name: Config Snapshot JSON
        * * SQL Data Type: nvarchar(MAX)
        * * Description: Fully denormalized JSON snapshot (anchor, related-entity map, factors, weights, windows, bands, normalization) the engine can score from on its own.`),
    ChangeSummary: z.string().nullable().describe(`
        * * Field Name: ChangeSummary
        * * Display Name: Change Summary
        * * SQL Data Type: nvarchar(MAX)
        * * Description: Summary of what changed versus the prior version.`),
    PublishedByUserID: z.string().nullable().describe(`
        * * Field Name: PublishedByUserID
        * * Display Name: Published By User ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ: Users (vwUsers.ID)`),
    PublishedAt: z.date().describe(`
        * * Field Name: PublishedAt
        * * Display Name: Published At
        * * SQL Data Type: datetime2
        * * Default Value: getutcdate()
        * * Description: UTC timestamp at which this version was published.`),
    IsCurrent: z.boolean().describe(`
        * * Field Name: IsCurrent
        * * Display Name: Is Current
        * * SQL Data Type: bit
        * * Default Value: 0
        * * Description: Indicates the single current version that is actively scoring for the model.`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    ScoreModel: z.string().describe(`
        * * Field Name: ScoreModel
        * * Display Name: Score Model
        * * SQL Data Type: nvarchar(200)`),
    PublishedByUser: z.string().nullable().describe(`
        * * Field Name: PublishedByUser
        * * Display Name: Published By User
        * * SQL Data Type: nvarchar(100)`),
});

export type mjBizAppsSonarScoreModelVersionEntityType = z.infer<typeof mjBizAppsSonarScoreModelVersionSchema>;

/**
 * zod schema definition for the entity MJ_BizApps_Sonar: Score Models
 */
export const mjBizAppsSonarScoreModelSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    Name: z.string().describe(`
        * * Field Name: Name
        * * Display Name: Name
        * * SQL Data Type: nvarchar(200)
        * * Description: Human-readable name of the model, e.g. "2026 Renewal Risk".`),
    Slug: z.string().describe(`
        * * Field Name: Slug
        * * Display Name: Slug
        * * SQL Data Type: nvarchar(100)
        * * Description: Stable, unique handle for the model used in expressions and references.`),
    Description: z.string().nullable().describe(`
        * * Field Name: Description
        * * Display Name: Description
        * * SQL Data Type: nvarchar(MAX)
        * * Description: Optional description of what the model scores and why.`),
    AnchorEntityID: z.string().describe(`
        * * Field Name: AnchorEntityID
        * * Display Name: Anchor Entity ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ: Entities (vwEntities.ID)`),
    Status: z.union([z.literal('Active'), z.literal('Archived'), z.literal('Draft'), z.literal('Paused')]).describe(`
        * * Field Name: Status
        * * Display Name: Status
        * * SQL Data Type: nvarchar(20)
        * * Default Value: Draft
    * * Value List Type: List
    * * Possible Values 
    *   * Active
    *   * Archived
    *   * Draft
    *   * Paused
        * * Description: Lifecycle status of the model: Draft, Active, Paused, or Archived.`),
    CurrentVersionID: z.string().nullable().describe(`
        * * Field Name: CurrentVersionID
        * * Display Name: Current Version ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Model Versions (vwScoreModelVersions.ID)`),
    ScoreScaleMin: z.number().describe(`
        * * Field Name: ScoreScaleMin
        * * Display Name: Score Scale Min
        * * SQL Data Type: decimal(9, 4)
        * * Default Value: 0
        * * Description: Minimum value of the output score scale (default 0).`),
    ScoreScaleMax: z.number().describe(`
        * * Field Name: ScoreScaleMax
        * * Display Name: Score Scale Max
        * * SQL Data Type: decimal(9, 4)
        * * Default Value: 100
        * * Description: Maximum value of the output score scale (default 100).`),
    CombineStrategy: z.union([z.literal('Banded'), z.literal('ExpressionDriven'), z.literal('WeightedAvg'), z.literal('WeightedSum'), z.literal('ZScoreComposite')]).describe(`
        * * Field Name: CombineStrategy
        * * Display Name: Combine Strategy
        * * SQL Data Type: nvarchar(30)
        * * Default Value: WeightedSum
    * * Value List Type: List
    * * Possible Values 
    *   * Banded
    *   * ExpressionDriven
    *   * WeightedAvg
    *   * WeightedSum
    *   * ZScoreComposite
        * * Description: How factor contributions combine into a score: WeightedSum, WeightedAvg, Banded, ZScoreComposite, or ExpressionDriven.`),
    CombineExpression: z.string().nullable().describe(`
        * * Field Name: CombineExpression
        * * Display Name: Combine Expression
        * * SQL Data Type: nvarchar(MAX)
        * * Description: For ExpressionDriven models, the formula over factor slugs used to combine contributions.`),
    BandSetID: z.string().nullable().describe(`
        * * Field Name: BandSetID
        * * Display Name: Band Set ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Band Sets (vwScoreBandSets.ID)`),
    PopulationFilter: z.string().nullable().describe(`
        * * Field Name: PopulationFilter
        * * Display Name: Population Filter
        * * SQL Data Type: nvarchar(MAX)
        * * Description: JSON/DSL filter defining which anchor records are in scope for scoring (e.g. Status = Active).`),
    RecomputeMode: z.union([z.literal('EventDriven'), z.literal('Hybrid'), z.literal('OnDemand'), z.literal('Scheduled')]).describe(`
        * * Field Name: RecomputeMode
        * * Display Name: Recompute Mode
        * * SQL Data Type: nvarchar(20)
        * * Default Value: Scheduled
    * * Value List Type: List
    * * Possible Values 
    *   * EventDriven
    *   * Hybrid
    *   * OnDemand
    *   * Scheduled
        * * Description: When scores recompute: Scheduled, EventDriven, OnDemand, or Hybrid.`),
    RecomputeCron: z.string().nullable().describe(`
        * * Field Name: RecomputeCron
        * * Display Name: Recompute Cron
        * * SQL Data Type: nvarchar(100)
        * * Description: Cron expression controlling scheduled recompute, when RecomputeMode includes a schedule.`),
    AsOfStrategy: z.union([z.literal('EndOfPreviousDay'), z.literal('Fixed'), z.literal('RunTime')]).describe(`
        * * Field Name: AsOfStrategy
        * * Display Name: As Of Strategy
        * * SQL Data Type: nvarchar(20)
        * * Default Value: RunTime
    * * Value List Type: List
    * * Possible Values 
    *   * EndOfPreviousDay
    *   * Fixed
    *   * RunTime
        * * Description: Defines what "now" means when resolving time windows: RunTime, EndOfPreviousDay, or Fixed.`),
    IsCalibrated: z.boolean().describe(`
        * * Field Name: IsCalibrated
        * * Display Name: Is Calibrated
        * * SQL Data Type: bit
        * * Default Value: 0
        * * Description: When set, the model consumes cross-tenant benchmark distributions for normalization (calibration network).`),
    TrendWindowDays: z.number().nullable().describe(`
        * * Field Name: TrendWindowDays
        * * Display Name: Trend Window Days
        * * SQL Data Type: int
        * * Description: Number of days used to compute the headline Delta and trend on each score.`),
    OwnerUserID: z.string().nullable().describe(`
        * * Field Name: OwnerUserID
        * * Display Name: Owner User ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ: Users (vwUsers.ID)`),
    EffectiveFrom: z.date().nullable().describe(`
        * * Field Name: EffectiveFrom
        * * Display Name: Effective From
        * * SQL Data Type: datetime2
        * * Description: Start of the bounded time range during which the model is active (optional).`),
    EffectiveTo: z.date().nullable().describe(`
        * * Field Name: EffectiveTo
        * * Display Name: Effective To
        * * SQL Data Type: datetime2
        * * Description: End of the bounded time range during which the model is active (optional).`),
    Notes: z.string().nullable().describe(`
        * * Field Name: Notes
        * * Display Name: Notes
        * * SQL Data Type: nvarchar(MAX)
        * * Description: Freeform notes about the model.`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    AnchorEntity: z.string().describe(`
        * * Field Name: AnchorEntity
        * * Display Name: Anchor Entity
        * * SQL Data Type: nvarchar(255)`),
    BandSet: z.string().nullable().describe(`
        * * Field Name: BandSet
        * * Display Name: Band Set
        * * SQL Data Type: nvarchar(200)`),
    OwnerUser: z.string().nullable().describe(`
        * * Field Name: OwnerUser
        * * Display Name: Owner User
        * * SQL Data Type: nvarchar(100)`),
});

export type mjBizAppsSonarScoreModelEntityType = z.infer<typeof mjBizAppsSonarScoreModelSchema>;

/**
 * zod schema definition for the entity MJ_BizApps_Sonar: Score Recompute Runs
 */
export const mjBizAppsSonarScoreRecomputeRunSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    ScoreModelID: z.string().describe(`
        * * Field Name: ScoreModelID
        * * Display Name: Score Model ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Models (vwScoreModels.ID)`),
    ScoreModelVersionID: z.string().nullable().describe(`
        * * Field Name: ScoreModelVersionID
        * * Display Name: Score Model Version ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Model Versions (vwScoreModelVersions.ID)`),
    TriggerType: z.union([z.literal('Backfill'), z.literal('Event'), z.literal('Manual'), z.literal('Scheduled')]).describe(`
        * * Field Name: TriggerType
        * * Display Name: Trigger Type
        * * SQL Data Type: nvarchar(16)
    * * Value List Type: List
    * * Possible Values 
    *   * Backfill
    *   * Event
    *   * Manual
    *   * Scheduled
        * * Description: What triggered the run: Scheduled, Event, Manual, or Backfill.`),
    Scope: z.union([z.literal('FullPopulation'), z.literal('Incremental'), z.literal('SingleRecord')]).describe(`
        * * Field Name: Scope
        * * Display Name: Scope
        * * SQL Data Type: nvarchar(16)
    * * Value List Type: List
    * * Possible Values 
    *   * FullPopulation
    *   * Incremental
    *   * SingleRecord
        * * Description: Scope of the run: FullPopulation, Incremental, or SingleRecord.`),
    StartedAt: z.date().describe(`
        * * Field Name: StartedAt
        * * Display Name: Started At
        * * SQL Data Type: datetime2
        * * Default Value: getutcdate()
        * * Description: UTC timestamp when the run started.`),
    CompletedAt: z.date().nullable().describe(`
        * * Field Name: CompletedAt
        * * Display Name: Completed At
        * * SQL Data Type: datetime2
        * * Description: UTC timestamp when the run completed.`),
    Status: z.union([z.literal('Failed'), z.literal('PartialSuccess'), z.literal('Running'), z.literal('Succeeded')]).describe(`
        * * Field Name: Status
        * * Display Name: Status
        * * SQL Data Type: nvarchar(16)
        * * Default Value: Running
    * * Value List Type: List
    * * Possible Values 
    *   * Failed
    *   * PartialSuccess
    *   * Running
    *   * Succeeded
        * * Description: Run status: Running, Succeeded, Failed, or PartialSuccess.`),
    RecordsScored: z.number().nullable().describe(`
        * * Field Name: RecordsScored
        * * Display Name: Records Scored
        * * SQL Data Type: int
        * * Description: Number of records scored in the run.`),
    RecordsChanged: z.number().nullable().describe(`
        * * Field Name: RecordsChanged
        * * Display Name: Records Changed
        * * SQL Data Type: int
        * * Description: Number of records whose score changed in the run.`),
    BandTransitions: z.number().nullable().describe(`
        * * Field Name: BandTransitions
        * * Display Name: Band Transitions
        * * SQL Data Type: int
        * * Description: Number of band transitions recorded during the run.`),
    DurationMs: z.number().nullable().describe(`
        * * Field Name: DurationMs
        * * Display Name: Duration Ms
        * * SQL Data Type: bigint
        * * Description: Total run duration in milliseconds.`),
    CostUnitsConsumed: z.number().nullable().describe(`
        * * Field Name: CostUnitsConsumed
        * * Display Name: Cost Units Consumed
        * * SQL Data Type: decimal(12, 4)
        * * Description: Tokens/compute units consumed by ActionBacked factors; feeds metering and billing.`),
    ErrorsJSON: z.string().nullable().describe(`
        * * Field Name: ErrorsJSON
        * * Display Name: Errors JSON
        * * SQL Data Type: nvarchar(MAX)
        * * Description: JSON capturing any errors encountered during the run.`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    ScoreModel: z.string().describe(`
        * * Field Name: ScoreModel
        * * Display Name: Score Model
        * * SQL Data Type: nvarchar(200)`),
});

export type mjBizAppsSonarScoreRecomputeRunEntityType = z.infer<typeof mjBizAppsSonarScoreRecomputeRunSchema>;

/**
 * zod schema definition for the entity MJ_BizApps_Sonar: Score Segments
 */
export const mjBizAppsSonarScoreSegmentSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    ScoreModelID: z.string().describe(`
        * * Field Name: ScoreModelID
        * * Display Name: Score Model ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Models (vwScoreModels.ID)`),
    Name: z.string().describe(`
        * * Field Name: Name
        * * Display Name: Name
        * * SQL Data Type: nvarchar(200)
        * * Description: Display name of the segment.`),
    Description: z.string().nullable().describe(`
        * * Field Name: Description
        * * Display Name: Description
        * * SQL Data Type: nvarchar(MAX)
        * * Description: Optional description of who the segment captures and why.`),
    FilterExpression: z.string().nullable().describe(`
        * * Field Name: FilterExpression
        * * Display Name: Filter Expression
        * * SQL Data Type: nvarchar(MAX)
        * * Description: JSON filter (Kendo-compatible) over band/score/delta/trend/window + any anchor field — defines membership.`),
    IsDynamic: z.boolean().describe(`
        * * Field Name: IsDynamic
        * * Display Name: Is Dynamic
        * * SQL Data Type: bit
        * * Default Value: 1
        * * Description: When 1, membership is recomputed each run from the filter; when 0, the cohort is a fixed snapshot.`),
    MemberCountCached: z.number().nullable().describe(`
        * * Field Name: MemberCountCached
        * * Display Name: Member Count
        * * SQL Data Type: int
        * * Description: Cached count of members in the segment as of LastEvaluatedAt (display/perf only).`),
    LastEvaluatedAt: z.date().nullable().describe(`
        * * Field Name: LastEvaluatedAt
        * * Display Name: Last Evaluated At
        * * SQL Data Type: datetime2
        * * Description: When the segment membership/count was last evaluated.`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    ScoreModel: z.string().describe(`
        * * Field Name: ScoreModel
        * * Display Name: Score Model
        * * SQL Data Type: nvarchar(200)`),
});

export type mjBizAppsSonarScoreSegmentEntityType = z.infer<typeof mjBizAppsSonarScoreSegmentSchema>;

/**
 * zod schema definition for the entity MJ_BizApps_Sonar: Scores
 */
export const mjBizAppsSonarScoreSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    ScoreModelID: z.string().describe(`
        * * Field Name: ScoreModelID
        * * Display Name: Score Model ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Models (vwScoreModels.ID)`),
    ScoreModelVersionID: z.string().describe(`
        * * Field Name: ScoreModelVersionID
        * * Display Name: Score Model Version ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Model Versions (vwScoreModelVersions.ID)`),
    AnchorEntityID: z.string().describe(`
        * * Field Name: AnchorEntityID
        * * Display Name: Anchor Entity ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ: Entities (vwEntities.ID)`),
    AnchorRecordID: z.string().describe(`
        * * Field Name: AnchorRecordID
        * * Display Name: Anchor Record ID
        * * SQL Data Type: nvarchar(450)
        * * Description: Primary-key value of the scored anchor record, stored as a string to stay entity-agnostic.`),
    AnchorRecordKeyJSON: z.string().nullable().describe(`
        * * Field Name: AnchorRecordKeyJSON
        * * Display Name: Anchor Record Key JSON
        * * SQL Data Type: nvarchar(MAX)
        * * Description: Optional JSON representation of a composite anchor key.`),
    RawScore: z.number().nullable().describe(`
        * * Field Name: RawScore
        * * Display Name: Raw Score
        * * SQL Data Type: decimal(12, 4)
        * * Description: Pre-scale combined value before mapping to the output scale.`),
    NormalizedScore: z.number().nullable().describe(`
        * * Field Name: NormalizedScore
        * * Display Name: Normalized Score
        * * SQL Data Type: decimal(9, 4)
        * * Description: The headline score on the model's output scale (e.g. 0-100).`),
    BandID: z.string().nullable().describe(`
        * * Field Name: BandID
        * * Display Name: Band ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Bands (vwScoreBands.ID)`),
    PreviousNormalizedScore: z.number().nullable().describe(`
        * * Field Name: PreviousNormalizedScore
        * * Display Name: Previous Normalized Score
        * * SQL Data Type: decimal(9, 4)
        * * Description: The normalized score from the previous computation, for delta/trend.`),
    PreviousBandID: z.string().nullable().describe(`
        * * Field Name: PreviousBandID
        * * Display Name: Previous Band ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Bands (vwScoreBands.ID)`),
    Delta: z.number().nullable().describe(`
        * * Field Name: Delta
        * * Display Name: Delta
        * * SQL Data Type: decimal(9, 4)
        * * Description: Change in normalized score versus the previous value over the trend window.`),
    TrendDirection: z.union([z.literal('Down'), z.literal('Flat'), z.literal('Up')]).nullable().describe(`
        * * Field Name: TrendDirection
        * * Display Name: Trend Direction
        * * SQL Data Type: nvarchar(8)
    * * Value List Type: List
    * * Possible Values 
    *   * Down
    *   * Flat
    *   * Up
        * * Description: Direction of recent movement: Up, Down, or Flat.`),
    TrendSlope: z.number().nullable().describe(`
        * * Field Name: TrendSlope
        * * Display Name: Trend Slope
        * * SQL Data Type: decimal(12, 6)
        * * Description: Regression slope of the score over recent history.`),
    Confidence: z.number().nullable().describe(`
        * * Field Name: Confidence
        * * Display Name: Confidence
        * * SQL Data Type: decimal(5, 4)
        * * Description: Confidence in the score (0-1), derived from data completeness.`),
    DataCompleteness: z.number().nullable().describe(`
        * * Field Name: DataCompleteness
        * * Display Name: Data Completeness
        * * SQL Data Type: decimal(5, 4)
        * * Description: Fraction of factors that had data when the score was computed (0-1).`),
    ComputedAt: z.date().describe(`
        * * Field Name: ComputedAt
        * * Display Name: Computed At
        * * SQL Data Type: datetime2
        * * Default Value: getutcdate()
        * * Description: UTC timestamp at which this score was computed.`),
    AsOfDate: z.date().nullable().describe(`
        * * Field Name: AsOfDate
        * * Display Name: As Of Date
        * * SQL Data Type: datetime2
        * * Description: The "now" the time windows resolved against for this score.`),
    NextRecomputeAt: z.date().nullable().describe(`
        * * Field Name: NextRecomputeAt
        * * Display Name: Next Recompute At
        * * SQL Data Type: datetime2
        * * Description: Optional scheduled time for the next recompute of this score.`),
    IsStale: z.boolean().describe(`
        * * Field Name: IsStale
        * * Display Name: Is Stale
        * * SQL Data Type: bit
        * * Default Value: 0
        * * Description: Indicates population statistics moved but this record has not yet been recomputed.`),
    ExplanationSummary: z.string().nullable().describe(`
        * * Field Name: ExplanationSummary
        * * Display Name: Explanation Summary
        * * SQL Data Type: nvarchar(MAX)
        * * Description: Cached natural-language explanation of the score, refreshed on material change.`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    ScoreModel: z.string().describe(`
        * * Field Name: ScoreModel
        * * Display Name: Score Model
        * * SQL Data Type: nvarchar(200)`),
    AnchorEntity: z.string().describe(`
        * * Field Name: AnchorEntity
        * * Display Name: Anchor Entity
        * * SQL Data Type: nvarchar(255)`),
});

export type mjBizAppsSonarScoreEntityType = z.infer<typeof mjBizAppsSonarScoreSchema>;

/**
 * zod schema definition for the entity MJ_BizApps_Sonar: Time Windows
 */
export const mjBizAppsSonarTimeWindowSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    Name: z.string().describe(`
        * * Field Name: Name
        * * Display Name: Name
        * * SQL Data Type: nvarchar(120)
        * * Description: Display name of the time window.`),
    WindowType: z.union([z.literal('AllTime'), z.literal('Calendar'), z.literal('RenewalRelative'), z.literal('Rolling'), z.literal('SinceEvent')]).describe(`
        * * Field Name: WindowType
        * * Display Name: Window Type
        * * SQL Data Type: nvarchar(20)
    * * Value List Type: List
    * * Possible Values 
    *   * AllTime
    *   * Calendar
    *   * RenewalRelative
    *   * Rolling
    *   * SinceEvent
        * * Description: Window type: Rolling, Calendar, SinceEvent, RenewalRelative, or AllTime.`),
    LengthDays: z.number().nullable().describe(`
        * * Field Name: LengthDays
        * * Display Name: Length Days
        * * SQL Data Type: int
        * * Description: Window length in days, for Rolling/Calendar windows.`),
    LengthMonths: z.number().nullable().describe(`
        * * Field Name: LengthMonths
        * * Display Name: Length Months
        * * SQL Data Type: int
        * * Description: Window length in months, for Rolling/Calendar windows.`),
    AnchorDateField: z.string().nullable().describe(`
        * * Field Name: AnchorDateField
        * * Display Name: Anchor Date Field
        * * SQL Data Type: nvarchar(200)
        * * Description: For RenewalRelative/SinceEvent windows, the date field on the anchor record the window is measured from (e.g. RenewalDate).`),
    OffsetDays: z.number().nullable().describe(`
        * * Field Name: OffsetDays
        * * Display Name: Offset Days
        * * SQL Data Type: int
        * * Description: Offset in days applied to the window start relative to the anchor date.`),
    Description: z.string().nullable().describe(`
        * * Field Name: Description
        * * Display Name: Description
        * * SQL Data Type: nvarchar(MAX)
        * * Description: Optional description of the time window.`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
});

export type mjBizAppsSonarTimeWindowEntityType = z.infer<typeof mjBizAppsSonarTimeWindowSchema>;
 
 

/**
 * MJ_BizApps_Sonar: Factors - strongly typed entity sub-class
 * * Schema: __mj_BizAppsSonar
 * * Base Table: Factor
 * * Base View: vwFactors
 * * @description A reusable signal definition that satisfies one uniform contract. Declarative factors compile to set-based SQL; ActionBacked factors wrap an MJ Action; DerivedFromScore factors consume another model's score.
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MJ_BizApps_Sonar: Factors')
export class mjBizAppsSonarFactorEntity extends BaseEntity<mjBizAppsSonarFactorEntityType> {
    /**
    * Loads the MJ_BizApps_Sonar: Factors record from the database
    * @param ID: string - primary key value to load the MJ_BizApps_Sonar: Factors record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof mjBizAppsSonarFactorEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: Name
    * * Display Name: Name
    * * SQL Data Type: nvarchar(200)
    * * Description: Human-readable name of the factor.
    */
    get Name(): string {
        return this.Get('Name');
    }
    set Name(value: string) {
        this.Set('Name', value);
    }

    /**
    * * Field Name: Slug
    * * Display Name: Slug
    * * SQL Data Type: nvarchar(100)
    * * Description: Stable handle for the factor, referenced by the rubric and combine expressions.
    */
    get Slug(): string {
        return this.Get('Slug');
    }
    set Slug(value: string) {
        this.Set('Slug', value);
    }

    /**
    * * Field Name: Description
    * * Display Name: Description
    * * SQL Data Type: nvarchar(MAX)
    * * Description: Optional description of the signal the factor measures.
    */
    get Description(): string | null {
        return this.Get('Description');
    }
    set Description(value: string | null) {
        this.Set('Description', value);
    }

    /**
    * * Field Name: ScoreModelID
    * * Display Name: Score Model ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Models (vwScoreModels.ID)
    */
    get ScoreModelID(): string | null {
        return this.Get('ScoreModelID');
    }
    set ScoreModelID(value: string | null) {
        this.Set('ScoreModelID', value);
    }

    /**
    * * Field Name: AnchorEntityID
    * * Display Name: Anchor Entity ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ: Entities (vwEntities.ID)
    */
    get AnchorEntityID(): string {
        return this.Get('AnchorEntityID');
    }
    set AnchorEntityID(value: string) {
        this.Set('AnchorEntityID', value);
    }

    /**
    * * Field Name: FactorType
    * * Display Name: Factor Type
    * * SQL Data Type: nvarchar(20)
    * * Value List Type: List
    * * Possible Values 
    *   * ActionBacked
    *   * Constant
    *   * Declarative
    *   * DerivedFromScore
    * * Description: Factor kind: Declarative, ActionBacked, DerivedFromScore, or Constant. The rubric engine never branches on this.
    */
    get FactorType(): 'ActionBacked' | 'Constant' | 'Declarative' | 'DerivedFromScore' {
        return this.Get('FactorType');
    }
    set FactorType(value: 'ActionBacked' | 'Constant' | 'Declarative' | 'DerivedFromScore') {
        this.Set('FactorType', value);
    }

    /**
    * * Field Name: SourceRelatedEntityID
    * * Display Name: Source Related Entity ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Model Related Entities (vwModelRelatedEntities.ID)
    */
    get SourceRelatedEntityID(): string | null {
        return this.Get('SourceRelatedEntityID');
    }
    set SourceRelatedEntityID(value: string | null) {
        this.Set('SourceRelatedEntityID', value);
    }

    /**
    * * Field Name: SourceEntityID
    * * Display Name: Source Entity ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ: Entities (vwEntities.ID)
    */
    get SourceEntityID(): string | null {
        return this.Get('SourceEntityID');
    }
    set SourceEntityID(value: string | null) {
        this.Set('SourceEntityID', value);
    }

    /**
    * * Field Name: FilterExpression
    * * Display Name: Filter Expression
    * * SQL Data Type: nvarchar(MAX)
    * * Description: For declarative factors, the JSON/DSL filter applied to the source related entity (e.g. ActivityType IN (EmailOpen, EmailClick)).
    */
    get FilterExpression(): string | null {
        return this.Get('FilterExpression');
    }
    set FilterExpression(value: string | null) {
        this.Set('FilterExpression', value);
    }

    /**
    * * Field Name: Aggregation
    * * Display Name: Aggregation
    * * SQL Data Type: nvarchar(20)
    * * Value List Type: List
    * * Possible Values 
    *   * Avg
    *   * Count
    *   * DistinctCount
    *   * Exists
    *   * Max
    *   * Min
    *   * RatePerPeriod
    *   * Recency
    *   * Sum
    *   * TrendSlope
    * * Description: Aggregation applied to the filtered source rows: Count, Sum, Avg, Min, Max, DistinctCount, Recency, RatePerPeriod, Exists, or TrendSlope.
    */
    get Aggregation(): 'Avg' | 'Count' | 'DistinctCount' | 'Exists' | 'Max' | 'Min' | 'RatePerPeriod' | 'Recency' | 'Sum' | 'TrendSlope' | null {
        return this.Get('Aggregation');
    }
    set Aggregation(value: 'Avg' | 'Count' | 'DistinctCount' | 'Exists' | 'Max' | 'Min' | 'RatePerPeriod' | 'Recency' | 'Sum' | 'TrendSlope' | null) {
        this.Set('Aggregation', value);
    }

    /**
    * * Field Name: AggregateFieldName
    * * Display Name: Aggregate Field Name
    * * SQL Data Type: nvarchar(200)
    * * Description: Column on the source entity to sum or average; null for Count/Exists aggregations.
    */
    get AggregateFieldName(): string | null {
        return this.Get('AggregateFieldName');
    }
    set AggregateFieldName(value: string | null) {
        this.Set('AggregateFieldName', value);
    }

    /**
    * * Field Name: TimeWindowID
    * * Display Name: Time Window ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Time Windows (vwTimeWindows.ID)
    */
    get TimeWindowID(): string | null {
        return this.Get('TimeWindowID');
    }
    set TimeWindowID(value: string | null) {
        this.Set('TimeWindowID', value);
    }

    /**
    * * Field Name: RecencyDecayHalfLifeDays
    * * Display Name: Recency Decay Half Life Days
    * * SQL Data Type: int
    * * Description: Optional half-life in days for recency-weighted aggregation.
    */
    get RecencyDecayHalfLifeDays(): number | null {
        return this.Get('RecencyDecayHalfLifeDays');
    }
    set RecencyDecayHalfLifeDays(value: number | null) {
        this.Set('RecencyDecayHalfLifeDays', value);
    }

    /**
    * * Field Name: ActionID
    * * Display Name: Action ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ: Actions (vwActions.ID)
    */
    get ActionID(): string | null {
        return this.Get('ActionID');
    }
    set ActionID(value: string | null) {
        this.Set('ActionID', value);
    }

    /**
    * * Field Name: ActionParamsJSON
    * * Display Name: Action Params JSON
    * * SQL Data Type: nvarchar(MAX)
    * * Description: For ActionBacked factors, static parameters (JSON) bound to the Action at config time.
    */
    get ActionParamsJSON(): string | null {
        return this.Get('ActionParamsJSON');
    }
    set ActionParamsJSON(value: string | null) {
        this.Set('ActionParamsJSON', value);
    }

    /**
    * * Field Name: ExecutionMode
    * * Display Name: Execution Mode
    * * SQL Data Type: nvarchar(12)
    * * Value List Type: List
    * * Possible Values 
    *   * Batch
    *   * PerRecord
    * * Description: Execution mode for ActionBacked factors: PerRecord or Batch.
    */
    get ExecutionMode(): 'Batch' | 'PerRecord' | null {
        return this.Get('ExecutionMode');
    }
    set ExecutionMode(value: 'Batch' | 'PerRecord' | null) {
        this.Set('ExecutionMode', value);
    }

    /**
    * * Field Name: IsExpensive
    * * Display Name: Is Expensive
    * * SQL Data Type: bit
    * * Default Value: 0
    * * Description: Marks the factor as expensive to evaluate; surfaced in the builder and used for recompute budgeting.
    */
    get IsExpensive(): boolean {
        return this.Get('IsExpensive');
    }
    set IsExpensive(value: boolean) {
        this.Set('IsExpensive', value);
    }

    /**
    * * Field Name: MaxConcurrency
    * * Display Name: Max Concurrency
    * * SQL Data Type: int
    * * Description: Optional maximum concurrency for evaluating an ActionBacked factor.
    */
    get MaxConcurrency(): number | null {
        return this.Get('MaxConcurrency');
    }
    set MaxConcurrency(value: number | null) {
        this.Set('MaxConcurrency', value);
    }

    /**
    * * Field Name: RateLimitPerMinute
    * * Display Name: Rate Limit Per Minute
    * * SQL Data Type: int
    * * Description: Optional rate limit per minute for external-API-backed Actions.
    */
    get RateLimitPerMinute(): number | null {
        return this.Get('RateLimitPerMinute');
    }
    set RateLimitPerMinute(value: number | null) {
        this.Set('RateLimitPerMinute', value);
    }

    /**
    * * Field Name: CacheTTLSeconds
    * * Display Name: Cache TTL Seconds
    * * SQL Data Type: int
    * * Description: Result cache time-to-live in seconds, keyed by (anchor record, as-of date, params hash).
    */
    get CacheTTLSeconds(): number | null {
        return this.Get('CacheTTLSeconds');
    }
    set CacheTTLSeconds(value: number | null) {
        this.Set('CacheTTLSeconds', value);
    }

    /**
    * * Field Name: SourceScoreModelID
    * * Display Name: Source Score Model ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Models (vwScoreModels.ID)
    */
    get SourceScoreModelID(): string | null {
        return this.Get('SourceScoreModelID');
    }
    set SourceScoreModelID(value: string | null) {
        this.Set('SourceScoreModelID', value);
    }

    /**
    * * Field Name: RawDataType
    * * Display Name: Raw Data Type
    * * SQL Data Type: nvarchar(12)
    * * Value List Type: List
    * * Possible Values 
    *   * Boolean
    *   * Date
    *   * Duration
    *   * Number
    * * Description: Raw data type produced by the factor before normalization: Number, Date, Boolean, or Duration.
    */
    get RawDataType(): 'Boolean' | 'Date' | 'Duration' | 'Number' | null {
        return this.Get('RawDataType');
    }
    set RawDataType(value: 'Boolean' | 'Date' | 'Duration' | 'Number' | null) {
        this.Set('RawDataType', value);
    }

    /**
    * * Field Name: NormalizationMethod
    * * Display Name: Normalization Method
    * * SQL Data Type: nvarchar(20)
    * * Value List Type: List
    * * Possible Values 
    *   * Banded
    *   * Logistic
    *   * Lookup
    *   * MinMax
    *   * None
    *   * Percentile
    *   * ZScore
    * * Description: Normalization method mapping the raw value to a contribution: None, MinMax, Percentile, ZScore, Logistic, Banded, or Lookup.
    */
    get NormalizationMethod(): 'Banded' | 'Logistic' | 'Lookup' | 'MinMax' | 'None' | 'Percentile' | 'ZScore' | null {
        return this.Get('NormalizationMethod');
    }
    set NormalizationMethod(value: 'Banded' | 'Logistic' | 'Lookup' | 'MinMax' | 'None' | 'Percentile' | 'ZScore' | null) {
        this.Set('NormalizationMethod', value);
    }

    /**
    * * Field Name: NormalizationParamsJSON
    * * Display Name: Normalization Params JSON
    * * SQL Data Type: nvarchar(MAX)
    * * Description: JSON parameters for the normalization method (clamps, percentile basis, logistic midpoint/steepness, banded thresholds, lookup table).
    */
    get NormalizationParamsJSON(): string | null {
        return this.Get('NormalizationParamsJSON');
    }
    set NormalizationParamsJSON(value: string | null) {
        this.Set('NormalizationParamsJSON', value);
    }

    /**
    * * Field Name: OutputMin
    * * Display Name: Output Min
    * * SQL Data Type: decimal(9, 4)
    * * Description: Lower bound of the normalized contribution range (e.g. 0).
    */
    get OutputMin(): number | null {
        return this.Get('OutputMin');
    }
    set OutputMin(value: number | null) {
        this.Set('OutputMin', value);
    }

    /**
    * * Field Name: OutputMax
    * * Display Name: Output Max
    * * SQL Data Type: decimal(9, 4)
    * * Description: Upper bound of the normalized contribution range (e.g. 1).
    */
    get OutputMax(): number | null {
        return this.Get('OutputMax');
    }
    set OutputMax(value: number | null) {
        this.Set('OutputMax', value);
    }

    /**
    * * Field Name: HigherIsBetter
    * * Display Name: Higher Is Better
    * * SQL Data Type: bit
    * * Default Value: 1
    * * Description: Direction of the signal; when false, higher raw values are worse (e.g. days since last login).
    */
    get HigherIsBetter(): boolean {
        return this.Get('HigherIsBetter');
    }
    set HigherIsBetter(value: boolean) {
        this.Set('HigherIsBetter', value);
    }

    /**
    * * Field Name: PromotionState
    * * Display Name: Promotion State
    * * SQL Data Type: nvarchar(20)
    * * Value List Type: List
    * * Possible Values 
    *   * Approved
    *   * Deprecated
    *   * Draft
    *   * InReview
    * * Description: Governance state, enforced for ActionBacked factors before production use: Draft, InReview, Approved, or Deprecated.
    */
    get PromotionState(): 'Approved' | 'Deprecated' | 'Draft' | 'InReview' | null {
        return this.Get('PromotionState');
    }
    set PromotionState(value: 'Approved' | 'Deprecated' | 'Draft' | 'InReview' | null) {
        this.Set('PromotionState', value);
    }

    /**
    * * Field Name: LastValidatedAt
    * * Display Name: Last Validated At
    * * SQL Data Type: datetime2
    * * Description: UTC timestamp of the most recent validation of the factor.
    */
    get LastValidatedAt(): Date | null {
        return this.Get('LastValidatedAt');
    }
    set LastValidatedAt(value: Date | null) {
        this.Set('LastValidatedAt', value);
    }

    /**
    * * Field Name: CreatedByAgent
    * * Display Name: Created By Agent
    * * SQL Data Type: nvarchar(60)
    * * Description: Name of the AI agent that created the factor, if any (e.g. ModelBuilderAgent, ActionBuilder).
    */
    get CreatedByAgent(): string | null {
        return this.Get('CreatedByAgent');
    }
    set CreatedByAgent(value: string | null) {
        this.Set('CreatedByAgent', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }

    /**
    * * Field Name: DateField
    * * Display Name: Date Field
    * * SQL Data Type: nvarchar(200)
    * * Description: The date column on the factor's related (source) entity that a time window filters on — the "when did it happen" column (e.g. RegistrationDate). Used by Rolling/Calendar/SinceEvent windows; null = no date filter (count everything in scope).
    */
    get DateField(): string | null {
        return this.Get('DateField');
    }
    set DateField(value: string | null) {
        this.Set('DateField', value);
    }

    /**
    * * Field Name: ScoreModel
    * * Display Name: Score Model
    * * SQL Data Type: nvarchar(200)
    */
    get ScoreModel(): string | null {
        return this.Get('ScoreModel');
    }

    /**
    * * Field Name: AnchorEntity
    * * Display Name: Anchor Entity
    * * SQL Data Type: nvarchar(255)
    */
    get AnchorEntity(): string {
        return this.Get('AnchorEntity');
    }

    /**
    * * Field Name: SourceEntity
    * * Display Name: Source Entity
    * * SQL Data Type: nvarchar(255)
    */
    get SourceEntity(): string | null {
        return this.Get('SourceEntity');
    }

    /**
    * * Field Name: TimeWindow
    * * Display Name: Time Window
    * * SQL Data Type: nvarchar(120)
    */
    get TimeWindow(): string | null {
        return this.Get('TimeWindow');
    }

    /**
    * * Field Name: Action
    * * Display Name: Action
    * * SQL Data Type: nvarchar(425)
    */
    get Action(): string | null {
        return this.Get('Action');
    }

    /**
    * * Field Name: SourceScoreModel
    * * Display Name: Source Score Model
    * * SQL Data Type: nvarchar(200)
    */
    get SourceScoreModel(): string | null {
        return this.Get('SourceScoreModel');
    }
}


/**
 * MJ_BizApps_Sonar: Intervention Assignments - strongly typed entity sub-class
 * * Schema: __mj_BizAppsSonar
 * * Base Table: InterventionAssignment
 * * Base View: vwInterventionAssignments
 * * @description One member's enrollment in an intervention, split into treatment vs. control (the holdout) for lift measurement.
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MJ_BizApps_Sonar: Intervention Assignments')
export class mjBizAppsSonarInterventionAssignmentEntity extends BaseEntity<mjBizAppsSonarInterventionAssignmentEntityType> {
    /**
    * Loads the MJ_BizApps_Sonar: Intervention Assignments record from the database
    * @param ID: string - primary key value to load the MJ_BizApps_Sonar: Intervention Assignments record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof mjBizAppsSonarInterventionAssignmentEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: InterventionID
    * * Display Name: Intervention ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Interventions (vwInterventions.ID)
    */
    get InterventionID(): string {
        return this.Get('InterventionID');
    }
    set InterventionID(value: string) {
        this.Set('InterventionID', value);
    }

    /**
    * * Field Name: AnchorRecordID
    * * Display Name: Anchor Record ID
    * * SQL Data Type: nvarchar(450)
    * * Description: Canonical id of the assigned anchor record (matches Score.AnchorRecordID).
    */
    get AnchorRecordID(): string {
        return this.Get('AnchorRecordID');
    }
    set AnchorRecordID(value: string) {
        this.Set('AnchorRecordID', value);
    }

    /**
    * * Field Name: AnchorRecordKeyJSON
    * * Display Name: Anchor Record Key
    * * SQL Data Type: nvarchar(MAX)
    * * Description: Optional JSON of a composite anchor key (matches Score.AnchorRecordKeyJSON) for multi-column-PK anchors.
    */
    get AnchorRecordKeyJSON(): string | null {
        return this.Get('AnchorRecordKeyJSON');
    }
    set AnchorRecordKeyJSON(value: string | null) {
        this.Set('AnchorRecordKeyJSON', value);
    }

    /**
    * * Field Name: Cohort
    * * Display Name: Cohort
    * * SQL Data Type: nvarchar(10)
    * * Value List Type: List
    * * Possible Values 
    *   * Control
    *   * Treatment
    * * Description: Whether this member is in the Treatment cohort (the Action fires) or the Control cohort (held out).
    */
    get Cohort(): 'Control' | 'Treatment' {
        return this.Get('Cohort');
    }
    set Cohort(value: 'Control' | 'Treatment') {
        this.Set('Cohort', value);
    }

    /**
    * * Field Name: AssignedAt
    * * Display Name: Assigned At
    * * SQL Data Type: datetime2
    * * Default Value: getutcdate()
    * * Description: When the member was assigned to this intervention.
    */
    get AssignedAt(): Date {
        return this.Get('AssignedAt');
    }
    set AssignedAt(value: Date) {
        this.Set('AssignedAt', value);
    }

    /**
    * * Field Name: ActionDeliveryStatus
    * * Display Name: Action Delivery Status
    * * SQL Data Type: nvarchar(20)
    * * Description: Delivery state of the fired Action for a Treatment member (e.g. Pending, Delivered, Failed, Skipped); null for Control.
    */
    get ActionDeliveryStatus(): string | null {
        return this.Get('ActionDeliveryStatus');
    }
    set ActionDeliveryStatus(value: string | null) {
        this.Set('ActionDeliveryStatus', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }

    /**
    * * Field Name: Intervention
    * * Display Name: Intervention
    * * SQL Data Type: nvarchar(200)
    */
    get Intervention(): string {
        return this.Get('Intervention');
    }
}


/**
 * MJ_BizApps_Sonar: Intervention Outcomes - strongly typed entity sub-class
 * * Schema: __mj_BizAppsSonar
 * * Base Table: InterventionOutcome
 * * Base View: vwInterventionOutcomes
 * * @description The measured result for one intervention assignment (business outcome + score change) — the basis for treatment-vs-control lift.
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MJ_BizApps_Sonar: Intervention Outcomes')
export class mjBizAppsSonarInterventionOutcomeEntity extends BaseEntity<mjBizAppsSonarInterventionOutcomeEntityType> {
    /**
    * Loads the MJ_BizApps_Sonar: Intervention Outcomes record from the database
    * @param ID: string - primary key value to load the MJ_BizApps_Sonar: Intervention Outcomes record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof mjBizAppsSonarInterventionOutcomeEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: AssignmentID
    * * Display Name: Assignment ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Intervention Assignments (vwInterventionAssignments.ID)
    */
    get AssignmentID(): string {
        return this.Get('AssignmentID');
    }
    set AssignmentID(value: string) {
        this.Set('AssignmentID', value);
    }

    /**
    * * Field Name: OutcomeType
    * * Display Name: Outcome Type
    * * SQL Data Type: nvarchar(16)
    * * Value List Type: List
    * * Possible Values 
    *   * Churned
    *   * NoChange
    *   * Reactivated
    *   * Renewed
    *   * Upgraded
    * * Description: The business outcome observed: Renewed, Reactivated, Churned, Upgraded, or NoChange.
    */
    get OutcomeType(): 'Churned' | 'NoChange' | 'Reactivated' | 'Renewed' | 'Upgraded' {
        return this.Get('OutcomeType');
    }
    set OutcomeType(value: 'Churned' | 'NoChange' | 'Reactivated' | 'Renewed' | 'Upgraded') {
        this.Set('OutcomeType', value);
    }

    /**
    * * Field Name: OutcomeAt
    * * Display Name: Outcome At
    * * SQL Data Type: datetime2
    * * Description: When the business outcome occurred.
    */
    get OutcomeAt(): Date | null {
        return this.Get('OutcomeAt');
    }
    set OutcomeAt(value: Date | null) {
        this.Set('OutcomeAt', value);
    }

    /**
    * * Field Name: ScoreDeltaAfter
    * * Display Name: Score Delta After
    * * SQL Data Type: decimal(9, 4)
    * * Description: Change in the member's normalized score from assignment to measurement (engagement movement after the play).
    */
    get ScoreDeltaAfter(): number | null {
        return this.Get('ScoreDeltaAfter');
    }
    set ScoreDeltaAfter(value: number | null) {
        this.Set('ScoreDeltaAfter', value);
    }

    /**
    * * Field Name: MeasuredAt
    * * Display Name: Measured At
    * * SQL Data Type: datetime2
    * * Description: When the outcome was measured/recorded.
    */
    get MeasuredAt(): Date | null {
        return this.Get('MeasuredAt');
    }
    set MeasuredAt(value: Date | null) {
        this.Set('MeasuredAt', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }

    /**
    * * Field Name: Assignment
    * * Display Name: Assignment
    * * SQL Data Type: nvarchar(450)
    */
    get Assignment(): string {
        return this.Get('Assignment');
    }
}


/**
 * MJ_BizApps_Sonar: Interventions - strongly typed entity sub-class
 * * Schema: __mj_BizAppsSonar
 * * Base Table: Intervention
 * * Base View: vwInterventions
 * * @description What to do for a segment: fire an MJ Action against its members, with an automatic holdout for lift measurement.
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MJ_BizApps_Sonar: Interventions')
export class mjBizAppsSonarInterventionEntity extends BaseEntity<mjBizAppsSonarInterventionEntityType> {
    /**
    * Loads the MJ_BizApps_Sonar: Interventions record from the database
    * @param ID: string - primary key value to load the MJ_BizApps_Sonar: Interventions record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof mjBizAppsSonarInterventionEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * Validate() method override for MJ_BizApps_Sonar: Interventions entity. This is an auto-generated method that invokes the generated validators for this entity for the following fields:
    * * ControlGroupPercent: The control group percentage, if specified, must be a value between 0 and 100 percent.
    * @public
    * @method
    * @override
    */
    public override Validate(): ValidationResult {
        const result = super.Validate();
        this.ValidateControlGroupPercentRange(result);
        result.Success = result.Success && (result.Errors.length === 0);

        return result;
    }

    /**
    * The control group percentage, if specified, must be a value between 0 and 100 percent.
    * @param result - the ValidationResult object to add any errors or warnings to
    * @public
    * @method
    */
    public ValidateControlGroupPercentRange(result: ValidationResult) {
    	if (this.ControlGroupPercent != null && (this.ControlGroupPercent < 0 || this.ControlGroupPercent > 100)) {
    		result.Errors.push(new ValidationErrorInfo(
    			"ControlGroupPercent",
    			"Control Group Percent must be between 0 and 100.",
    			this.ControlGroupPercent,
    			ValidationErrorType.Failure
    		));
    	}
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: ScoreSegmentID
    * * Display Name: Score Segment ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Segments (vwScoreSegments.ID)
    */
    get ScoreSegmentID(): string {
        return this.Get('ScoreSegmentID');
    }
    set ScoreSegmentID(value: string) {
        this.Set('ScoreSegmentID', value);
    }

    /**
    * * Field Name: Name
    * * Display Name: Name
    * * SQL Data Type: nvarchar(200)
    * * Description: Display name of the intervention.
    */
    get Name(): string {
        return this.Get('Name');
    }
    set Name(value: string) {
        this.Set('Name', value);
    }

    /**
    * * Field Name: Description
    * * Display Name: Description
    * * SQL Data Type: nvarchar(MAX)
    * * Description: Optional description of the play and its intent.
    */
    get Description(): string | null {
        return this.Get('Description');
    }
    set Description(value: string | null) {
        this.Set('Description', value);
    }

    /**
    * * Field Name: TriggerType
    * * Display Name: Trigger Type
    * * SQL Data Type: nvarchar(20)
    * * Default Value: Manual
    * * Value List Type: List
    * * Possible Values 
    *   * Manual
    *   * OnEnterSegment
    *   * Scheduled
    * * Description: When the intervention fires: OnEnterSegment (member newly matches), Scheduled, or Manual.
    */
    get TriggerType(): 'Manual' | 'OnEnterSegment' | 'Scheduled' {
        return this.Get('TriggerType');
    }
    set TriggerType(value: 'Manual' | 'OnEnterSegment' | 'Scheduled') {
        this.Set('TriggerType', value);
    }

    /**
    * * Field Name: ActionID
    * * Display Name: Action ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ: Actions (vwActions.ID)
    */
    get ActionID(): string {
        return this.Get('ActionID');
    }
    set ActionID(value: string) {
        this.Set('ActionID', value);
    }

    /**
    * * Field Name: ControlGroupPercent
    * * Display Name: Control Group Percent
    * * SQL Data Type: decimal(5, 2)
    * * Description: Percent of matched members withheld as a control group (holdout) so treatment-vs-control lift can be measured; null = no holdout.
    */
    get ControlGroupPercent(): number | null {
        return this.Get('ControlGroupPercent');
    }
    set ControlGroupPercent(value: number | null) {
        this.Set('ControlGroupPercent', value);
    }

    /**
    * * Field Name: Status
    * * Display Name: Status
    * * SQL Data Type: nvarchar(16)
    * * Default Value: Draft
    * * Value List Type: List
    * * Possible Values 
    *   * Active
    *   * Draft
    *   * Paused
    * * Description: Lifecycle state: Draft (not firing), Active (firing per its trigger), or Paused.
    */
    get Status(): 'Active' | 'Draft' | 'Paused' {
        return this.Get('Status');
    }
    set Status(value: 'Active' | 'Draft' | 'Paused') {
        this.Set('Status', value);
    }

    /**
    * * Field Name: ActionParamsJSON
    * * Display Name: Action Parameters
    * * SQL Data Type: nvarchar(MAX)
    * * Description: JSON [{name,value}] params handed to the intervention's Action on every fire; a {{member}} token in a value is replaced with the member's anchor id. Null = fire with no params.
    */
    get ActionParamsJSON(): string | null {
        return this.Get('ActionParamsJSON');
    }
    set ActionParamsJSON(value: string | null) {
        this.Set('ActionParamsJSON', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }

    /**
    * * Field Name: ScoreSegment
    * * Display Name: Score Segment
    * * SQL Data Type: nvarchar(200)
    */
    get ScoreSegment(): string {
        return this.Get('ScoreSegment');
    }

    /**
    * * Field Name: Action
    * * Display Name: Action
    * * SQL Data Type: nvarchar(425)
    */
    get Action(): string {
        return this.Get('Action');
    }
}


/**
 * MJ_BizApps_Sonar: Model Factors - strongly typed entity sub-class
 * * Schema: __mj_BizAppsSonar
 * * Base Table: ModelFactor
 * * Base View: vwModelFactors
 * * @description Binds a Factor into a model with its weight and contribution rules. The rubric is the set of these rows.
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MJ_BizApps_Sonar: Model Factors')
export class mjBizAppsSonarModelFactorEntity extends BaseEntity<mjBizAppsSonarModelFactorEntityType> {
    /**
    * Loads the MJ_BizApps_Sonar: Model Factors record from the database
    * @param ID: string - primary key value to load the MJ_BizApps_Sonar: Model Factors record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof mjBizAppsSonarModelFactorEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: ScoreModelID
    * * Display Name: Score Model ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Models (vwScoreModels.ID)
    */
    get ScoreModelID(): string {
        return this.Get('ScoreModelID');
    }
    set ScoreModelID(value: string) {
        this.Set('ScoreModelID', value);
    }

    /**
    * * Field Name: FactorID
    * * Display Name: Factor ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Factors (vwFactors.ID)
    */
    get FactorID(): string {
        return this.Get('FactorID');
    }
    set FactorID(value: string) {
        this.Set('FactorID', value);
    }

    /**
    * * Field Name: Weight
    * * Display Name: Weight
    * * SQL Data Type: decimal(9, 4)
    * * Default Value: 1
    * * Description: Weight applied to this factor's normalized contribution.
    */
    get Weight(): number {
        return this.Get('Weight');
    }
    set Weight(value: number) {
        this.Set('Weight', value);
    }

    /**
    * * Field Name: WeightMode
    * * Display Name: Weight Mode
    * * SQL Data Type: nvarchar(12)
    * * Default Value: Additive
    * * Value List Type: List
    * * Possible Values 
    *   * Additive
    *   * Bonus
    *   * Gate
    *   * Multiplier
    *   * Penalty
    * * Description: How the weight is applied: Additive, Multiplier, Gate, Penalty, or Bonus.
    */
    get WeightMode(): 'Additive' | 'Bonus' | 'Gate' | 'Multiplier' | 'Penalty' {
        return this.Get('WeightMode');
    }
    set WeightMode(value: 'Additive' | 'Bonus' | 'Gate' | 'Multiplier' | 'Penalty') {
        this.Set('WeightMode', value);
    }

    /**
    * * Field Name: ContributionCap
    * * Display Name: Contribution Cap
    * * SQL Data Type: decimal(9, 4)
    * * Description: Optional upper clamp on this factor's contribution.
    */
    get ContributionCap(): number | null {
        return this.Get('ContributionCap');
    }
    set ContributionCap(value: number | null) {
        this.Set('ContributionCap', value);
    }

    /**
    * * Field Name: ContributionFloor
    * * Display Name: Contribution Floor
    * * SQL Data Type: decimal(9, 4)
    * * Description: Optional lower clamp on this factor's contribution.
    */
    get ContributionFloor(): number | null {
        return this.Get('ContributionFloor');
    }
    set ContributionFloor(value: number | null) {
        this.Set('ContributionFloor', value);
    }

    /**
    * * Field Name: TrendWeight
    * * Display Name: Trend Weight
    * * SQL Data Type: decimal(9, 4)
    * * Description: Extra weight placed on the factor's delta versus its level (encodes "a falling 80 beats a steady 50").
    */
    get TrendWeight(): number | null {
        return this.Get('TrendWeight');
    }
    set TrendWeight(value: number | null) {
        this.Set('TrendWeight', value);
    }

    /**
    * * Field Name: MissingDataPolicy
    * * Display Name: Missing Data Policy
    * * SQL Data Type: nvarchar(16)
    * * Default Value: ModelDefault
    * * Value List Type: List
    * * Possible Values 
    *   * Exclude
    *   * ModelDefault
    *   * NeutralMidpoint
    *   * Zero
    * * Description: Policy when the factor has no data: Zero, NeutralMidpoint, Exclude, or ModelDefault.
    */
    get MissingDataPolicy(): 'Exclude' | 'ModelDefault' | 'NeutralMidpoint' | 'Zero' {
        return this.Get('MissingDataPolicy');
    }
    set MissingDataPolicy(value: 'Exclude' | 'ModelDefault' | 'NeutralMidpoint' | 'Zero') {
        this.Set('MissingDataPolicy', value);
    }

    /**
    * * Field Name: IsRequired
    * * Display Name: Is Required
    * * SQL Data Type: bit
    * * Default Value: 0
    * * Description: When true and data is missing, the resulting score is flagged low-confidence.
    */
    get IsRequired(): boolean {
        return this.Get('IsRequired');
    }
    set IsRequired(value: boolean) {
        this.Set('IsRequired', value);
    }

    /**
    * * Field Name: DisplayLabel
    * * Display Name: Display Label
    * * SQL Data Type: nvarchar(200)
    * * Description: Label shown for this factor in explainability views, e.g. "Newsletter engagement".
    */
    get DisplayLabel(): string | null {
        return this.Get('DisplayLabel');
    }
    set DisplayLabel(value: string | null) {
        this.Set('DisplayLabel', value);
    }

    /**
    * * Field Name: DisplayOrder
    * * Display Name: Display Order
    * * SQL Data Type: int
    * * Description: Sort order for displaying this factor in the rubric and explainability views.
    */
    get DisplayOrder(): number | null {
        return this.Get('DisplayOrder');
    }
    set DisplayOrder(value: number | null) {
        this.Set('DisplayOrder', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }

    /**
    * * Field Name: ScoreModel
    * * Display Name: Score Model
    * * SQL Data Type: nvarchar(200)
    */
    get ScoreModel(): string {
        return this.Get('ScoreModel');
    }

    /**
    * * Field Name: Factor
    * * Display Name: Factor
    * * SQL Data Type: nvarchar(200)
    */
    get Factor(): string {
        return this.Get('Factor');
    }
}


/**
 * MJ_BizApps_Sonar: Model Related Entities - strongly typed entity sub-class
 * * Schema: __mj_BizAppsSonar
 * * Base Table: ModelRelatedEntity
 * * Base View: vwModelRelatedEntities
 * * @description Declares an MJ entity wired into a model and how to traverse from the anchor to it. Factors reference these by Alias.
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MJ_BizApps_Sonar: Model Related Entities')
export class mjBizAppsSonarModelRelatedEntityEntity extends BaseEntity<mjBizAppsSonarModelRelatedEntityEntityType> {
    /**
    * Loads the MJ_BizApps_Sonar: Model Related Entities record from the database
    * @param ID: string - primary key value to load the MJ_BizApps_Sonar: Model Related Entities record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof mjBizAppsSonarModelRelatedEntityEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: ScoreModelID
    * * Display Name: Score Model ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Models (vwScoreModels.ID)
    */
    get ScoreModelID(): string {
        return this.Get('ScoreModelID');
    }
    set ScoreModelID(value: string) {
        this.Set('ScoreModelID', value);
    }

    /**
    * * Field Name: RelatedEntityID
    * * Display Name: Related Entity ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ: Entities (vwEntities.ID)
    */
    get RelatedEntityID(): string {
        return this.Get('RelatedEntityID');
    }
    set RelatedEntityID(value: string) {
        this.Set('RelatedEntityID', value);
    }

    /**
    * * Field Name: Alias
    * * Display Name: Alias
    * * SQL Data Type: nvarchar(100)
    * * Description: Handle used by factors to reference this related entity, e.g. crm_activity, invoices, lms_completions.
    */
    get Alias(): string {
        return this.Get('Alias');
    }
    set Alias(value: string) {
        this.Set('Alias', value);
    }

    /**
    * * Field Name: RelationshipPath
    * * Display Name: Relationship Path
    * * SQL Data Type: nvarchar(MAX)
    * * Description: JSON describing the join path from the anchor to the related entity (direct FK or multi-hop), resolved against MJ relationship metadata.
    */
    get RelationshipPath(): string {
        return this.Get('RelationshipPath');
    }
    set RelationshipPath(value: string) {
        this.Set('RelationshipPath', value);
    }

    /**
    * * Field Name: JoinType
    * * Display Name: Join Type
    * * SQL Data Type: nvarchar(10)
    * * Default Value: Left
    * * Value List Type: List
    * * Possible Values 
    *   * Inner
    *   * Left
    * * Description: Join type from anchor to related entity: Inner or Left (usually Left so absence of related data is itself scorable).
    */
    get JoinType(): 'Inner' | 'Left' {
        return this.Get('JoinType');
    }
    set JoinType(value: 'Inner' | 'Left') {
        this.Set('JoinType', value);
    }

    /**
    * * Field Name: SourceSystemTag
    * * Display Name: Source System Tag
    * * SQL Data Type: nvarchar(60)
    * * Description: Informational provenance tag for the source system (e.g. Salesforce, Finance, LMS, Community, Email).
    */
    get SourceSystemTag(): string | null {
        return this.Get('SourceSystemTag');
    }
    set SourceSystemTag(value: string | null) {
        this.Set('SourceSystemTag', value);
    }

    /**
    * * Field Name: Description
    * * Display Name: Description
    * * SQL Data Type: nvarchar(MAX)
    * * Description: Optional description of the related-entity mapping.
    */
    get Description(): string | null {
        return this.Get('Description');
    }
    set Description(value: string | null) {
        this.Set('Description', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }

    /**
    * * Field Name: ScoreModel
    * * Display Name: Score Model
    * * SQL Data Type: nvarchar(200)
    */
    get ScoreModel(): string {
        return this.Get('ScoreModel');
    }

    /**
    * * Field Name: RelatedEntity
    * * Display Name: Related Entity
    * * SQL Data Type: nvarchar(255)
    */
    get RelatedEntity(): string {
        return this.Get('RelatedEntity');
    }
}


/**
 * MJ_BizApps_Sonar: Score Band Sets - strongly typed entity sub-class
 * * Schema: __mj_BizAppsSonar
 * * Base Table: ScoreBandSet
 * * Base View: vwScoreBandSets
 * * @description A reusable, named set of qualitative score bands (e.g. Healthy / Watch / At-Risk / Critical) that can be shared across scoring models.
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MJ_BizApps_Sonar: Score Band Sets')
export class mjBizAppsSonarScoreBandSetEntity extends BaseEntity<mjBizAppsSonarScoreBandSetEntityType> {
    /**
    * Loads the MJ_BizApps_Sonar: Score Band Sets record from the database
    * @param ID: string - primary key value to load the MJ_BizApps_Sonar: Score Band Sets record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof mjBizAppsSonarScoreBandSetEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: Name
    * * Display Name: Name
    * * SQL Data Type: nvarchar(200)
    * * Description: Display name of the band set.
    */
    get Name(): string {
        return this.Get('Name');
    }
    set Name(value: string) {
        this.Set('Name', value);
    }

    /**
    * * Field Name: AnchorEntityID
    * * Display Name: Anchor Entity ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ: Entities (vwEntities.ID)
    */
    get AnchorEntityID(): string | null {
        return this.Get('AnchorEntityID');
    }
    set AnchorEntityID(value: string | null) {
        this.Set('AnchorEntityID', value);
    }

    /**
    * * Field Name: Description
    * * Display Name: Description
    * * SQL Data Type: nvarchar(MAX)
    * * Description: Optional description of the band set and its intended use.
    */
    get Description(): string | null {
        return this.Get('Description');
    }
    set Description(value: string | null) {
        this.Set('Description', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }

    /**
    * * Field Name: AnchorEntity
    * * Display Name: Anchor Entity
    * * SQL Data Type: nvarchar(255)
    */
    get AnchorEntity(): string | null {
        return this.Get('AnchorEntity');
    }
}


/**
 * MJ_BizApps_Sonar: Score Band Transitions - strongly typed entity sub-class
 * * Schema: __mj_BizAppsSonar
 * * Base Table: ScoreBandTransition
 * * Base View: vwScoreBandTransitions
 * * @description First-class record of a band crossing; the event the action layer and write-back key off.
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MJ_BizApps_Sonar: Score Band Transitions')
export class mjBizAppsSonarScoreBandTransitionEntity extends BaseEntity<mjBizAppsSonarScoreBandTransitionEntityType> {
    /**
    * Loads the MJ_BizApps_Sonar: Score Band Transitions record from the database
    * @param ID: string - primary key value to load the MJ_BizApps_Sonar: Score Band Transitions record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof mjBizAppsSonarScoreBandTransitionEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: ScoreModelID
    * * Display Name: Score Model ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Models (vwScoreModels.ID)
    */
    get ScoreModelID(): string {
        return this.Get('ScoreModelID');
    }
    set ScoreModelID(value: string) {
        this.Set('ScoreModelID', value);
    }

    /**
    * * Field Name: AnchorRecordID
    * * Display Name: Anchor Record ID
    * * SQL Data Type: nvarchar(450)
    * * Description: Primary-key value of the anchor record that crossed bands, stored as a string to stay entity-agnostic.
    */
    get AnchorRecordID(): string {
        return this.Get('AnchorRecordID');
    }
    set AnchorRecordID(value: string) {
        this.Set('AnchorRecordID', value);
    }

    /**
    * * Field Name: FromBandID
    * * Display Name: From Band ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Bands (vwScoreBands.ID)
    */
    get FromBandID(): string | null {
        return this.Get('FromBandID');
    }
    set FromBandID(value: string | null) {
        this.Set('FromBandID', value);
    }

    /**
    * * Field Name: ToBandID
    * * Display Name: To Band ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Bands (vwScoreBands.ID)
    */
    get ToBandID(): string | null {
        return this.Get('ToBandID');
    }
    set ToBandID(value: string | null) {
        this.Set('ToBandID', value);
    }

    /**
    * * Field Name: Direction
    * * Display Name: Direction
    * * SQL Data Type: nvarchar(12)
    * * Value List Type: List
    * * Possible Values 
    *   * Improving
    *   * Worsening
    * * Description: Direction of the crossing: Improving or Worsening.
    */
    get Direction(): 'Improving' | 'Worsening' | null {
        return this.Get('Direction');
    }
    set Direction(value: 'Improving' | 'Worsening' | null) {
        this.Set('Direction', value);
    }

    /**
    * * Field Name: OccurredAt
    * * Display Name: Occurred At
    * * SQL Data Type: datetime2
    * * Default Value: getutcdate()
    * * Description: UTC timestamp at which the band crossing occurred.
    */
    get OccurredAt(): Date {
        return this.Get('OccurredAt');
    }
    set OccurredAt(value: Date) {
        this.Set('OccurredAt', value);
    }

    /**
    * * Field Name: RecomputeRunID
    * * Display Name: Recompute Run ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Recompute Runs (vwScoreRecomputeRuns.ID)
    */
    get RecomputeRunID(): string | null {
        return this.Get('RecomputeRunID');
    }
    set RecomputeRunID(value: string | null) {
        this.Set('RecomputeRunID', value);
    }

    /**
    * * Field Name: Handled
    * * Display Name: Handled
    * * SQL Data Type: bit
    * * Default Value: 0
    * * Description: Indicates whether the transition has been picked up by write-back or an intervention.
    */
    get Handled(): boolean {
        return this.Get('Handled');
    }
    set Handled(value: boolean) {
        this.Set('Handled', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }

    /**
    * * Field Name: ScoreModel
    * * Display Name: Score Model
    * * SQL Data Type: nvarchar(200)
    */
    get ScoreModel(): string {
        return this.Get('ScoreModel');
    }
}


/**
 * MJ_BizApps_Sonar: Score Bands - strongly typed entity sub-class
 * * Schema: __mj_BizAppsSonar
 * * Base Table: ScoreBand
 * * Base View: vwScoreBands
 * * @description One qualitative band within a band set, defined by a half-open score range with a severity and color for sorting and display.
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MJ_BizApps_Sonar: Score Bands')
export class mjBizAppsSonarScoreBandEntity extends BaseEntity<mjBizAppsSonarScoreBandEntityType> {
    /**
    * Loads the MJ_BizApps_Sonar: Score Bands record from the database
    * @param ID: string - primary key value to load the MJ_BizApps_Sonar: Score Bands record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof mjBizAppsSonarScoreBandEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: BandSetID
    * * Display Name: Band Set ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Band Sets (vwScoreBandSets.ID)
    */
    get BandSetID(): string {
        return this.Get('BandSetID');
    }
    set BandSetID(value: string) {
        this.Set('BandSetID', value);
    }

    /**
    * * Field Name: Label
    * * Display Name: Label
    * * SQL Data Type: nvarchar(60)
    * * Description: Display label for the band, e.g. Healthy, Watch, At-Risk, Critical.
    */
    get Label(): string {
        return this.Get('Label');
    }
    set Label(value: string) {
        this.Set('Label', value);
    }

    /**
    * * Field Name: MinScore
    * * Display Name: Min Score
    * * SQL Data Type: decimal(9, 4)
    * * Description: Inclusive lower bound of the band score range.
    */
    get MinScore(): number {
        return this.Get('MinScore');
    }
    set MinScore(value: number) {
        this.Set('MinScore', value);
    }

    /**
    * * Field Name: MaxScore
    * * Display Name: Max Score
    * * SQL Data Type: decimal(9, 4)
    * * Description: Exclusive upper bound of the band score range (half-open; ranges are contiguous and non-overlapping).
    */
    get MaxScore(): number {
        return this.Get('MaxScore');
    }
    set MaxScore(value: number) {
        this.Set('MaxScore', value);
    }

    /**
    * * Field Name: Severity
    * * Display Name: Severity
    * * SQL Data Type: int
    * * Default Value: 0
    * * Description: Severity rank where 0 is best and higher numbers are worse; drives sort order and color.
    */
    get Severity(): number {
        return this.Get('Severity');
    }
    set Severity(value: number) {
        this.Set('Severity', value);
    }

    /**
    * * Field Name: ColorHex
    * * Display Name: Color Hex
    * * SQL Data Type: nvarchar(7)
    * * Description: Hex color code (e.g. #2E7D32) used to render the band in the UI.
    */
    get ColorHex(): string | null {
        return this.Get('ColorHex');
    }
    set ColorHex(value: string | null) {
        this.Set('ColorHex', value);
    }

    /**
    * * Field Name: IsTerminal
    * * Display Name: Is Terminal
    * * SQL Data Type: bit
    * * Default Value: 0
    * * Description: Indicates a terminal band (e.g. Lapsed) that represents an end state rather than a point on the continuum.
    */
    get IsTerminal(): boolean {
        return this.Get('IsTerminal');
    }
    set IsTerminal(value: boolean) {
        this.Set('IsTerminal', value);
    }

    /**
    * * Field Name: Description
    * * Display Name: Description
    * * SQL Data Type: nvarchar(MAX)
    * * Description: Optional description of what this band means.
    */
    get Description(): string | null {
        return this.Get('Description');
    }
    set Description(value: string | null) {
        this.Set('Description', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }

    /**
    * * Field Name: BandSet
    * * Display Name: Band Set
    * * SQL Data Type: nvarchar(200)
    */
    get BandSet(): string {
        return this.Get('BandSet');
    }
}


/**
 * MJ_BizApps_Sonar: Score Factor Contributions - strongly typed entity sub-class
 * * Schema: __mj_BizAppsSonar
 * * Base Table: ScoreFactorContribution
 * * Base View: vwScoreFactorContributions
 * * @description Per-factor breakdown of a current score; the explainability spine that makes the score narrative free.
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MJ_BizApps_Sonar: Score Factor Contributions')
export class mjBizAppsSonarScoreFactorContributionEntity extends BaseEntity<mjBizAppsSonarScoreFactorContributionEntityType> {
    /**
    * Loads the MJ_BizApps_Sonar: Score Factor Contributions record from the database
    * @param ID: string - primary key value to load the MJ_BizApps_Sonar: Score Factor Contributions record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof mjBizAppsSonarScoreFactorContributionEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: ScoreID
    * * Display Name: Score ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Scores (vwScores.ID)
    */
    get ScoreID(): string {
        return this.Get('ScoreID');
    }
    set ScoreID(value: string) {
        this.Set('ScoreID', value);
    }

    /**
    * * Field Name: ModelFactorID
    * * Display Name: Model Factor ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Model Factors (vwModelFactors.ID)
    */
    get ModelFactorID(): string {
        return this.Get('ModelFactorID');
    }
    set ModelFactorID(value: string) {
        this.Set('ModelFactorID', value);
    }

    /**
    * * Field Name: FactorID
    * * Display Name: Factor ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Factors (vwFactors.ID)
    */
    get FactorID(): string {
        return this.Get('FactorID');
    }
    set FactorID(value: string) {
        this.Set('FactorID', value);
    }

    /**
    * * Field Name: RawValue
    * * Display Name: Raw Value
    * * SQL Data Type: decimal(18, 6)
    * * Description: Raw value the factor produced before normalization.
    */
    get RawValue(): number | null {
        return this.Get('RawValue');
    }
    set RawValue(value: number | null) {
        this.Set('RawValue', value);
    }

    /**
    * * Field Name: NormalizedValue
    * * Display Name: Normalized Value
    * * SQL Data Type: decimal(9, 4)
    * * Description: The factor's normalized output (e.g. 0-1 or configured range).
    */
    get NormalizedValue(): number | null {
        return this.Get('NormalizedValue');
    }
    set NormalizedValue(value: number | null) {
        this.Set('NormalizedValue', value);
    }

    /**
    * * Field Name: WeightedContribution
    * * Display Name: Weighted Contribution
    * * SQL Data Type: decimal(12, 4)
    * * Description: Amount this factor added to the score after weighting.
    */
    get WeightedContribution(): number | null {
        return this.Get('WeightedContribution');
    }
    set WeightedContribution(value: number | null) {
        this.Set('WeightedContribution', value);
    }

    /**
    * * Field Name: PercentOfTotal
    * * Display Name: Percent Of Total
    * * SQL Data Type: decimal(5, 4)
    * * Description: Share of the total score attributable to this factor.
    */
    get PercentOfTotal(): number | null {
        return this.Get('PercentOfTotal');
    }
    set PercentOfTotal(value: number | null) {
        this.Set('PercentOfTotal', value);
    }

    /**
    * * Field Name: ContributionDelta
    * * Display Name: Contribution Delta
    * * SQL Data Type: decimal(12, 4)
    * * Description: Change in this factor's contribution versus the previous score.
    */
    get ContributionDelta(): number | null {
        return this.Get('ContributionDelta');
    }
    set ContributionDelta(value: number | null) {
        this.Set('ContributionDelta', value);
    }

    /**
    * * Field Name: HadData
    * * Display Name: Had Data
    * * SQL Data Type: bit
    * * Default Value: 0
    * * Description: Indicates whether the factor had data for this record.
    */
    get HadData(): boolean {
        return this.Get('HadData');
    }
    set HadData(value: boolean) {
        this.Set('HadData', value);
    }

    /**
    * * Field Name: MissingDataApplied
    * * Display Name: Missing Data Applied
    * * SQL Data Type: bit
    * * Default Value: 0
    * * Description: Indicates whether a missing-data policy was applied for this factor.
    */
    get MissingDataApplied(): boolean {
        return this.Get('MissingDataApplied');
    }
    set MissingDataApplied(value: boolean) {
        this.Set('MissingDataApplied', value);
    }

    /**
    * * Field Name: DetailJSON
    * * Display Name: Detail JSON
    * * SQL Data Type: nvarchar(MAX)
    * * Description: Optional JSON with sampled underlying record references for drill-through.
    */
    get DetailJSON(): string | null {
        return this.Get('DetailJSON');
    }
    set DetailJSON(value: string | null) {
        this.Set('DetailJSON', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }

    /**
    * * Field Name: Factor
    * * Display Name: Factor
    * * SQL Data Type: nvarchar(200)
    */
    get Factor(): string {
        return this.Get('Factor');
    }
}


/**
 * MJ_BizApps_Sonar: Score Histories - strongly typed entity sub-class
 * * Schema: __mj_BizAppsSonar
 * * Base Table: ScoreHistory
 * * Base View: vwScoreHistories
 * * @description Append-only time-series snapshots of scores; the trajectory is the asset. Snapshot on change plus periodic keyframes.
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MJ_BizApps_Sonar: Score Histories')
export class mjBizAppsSonarScoreHistoryEntity extends BaseEntity<mjBizAppsSonarScoreHistoryEntityType> {
    /**
    * Loads the MJ_BizApps_Sonar: Score Histories record from the database
    * @param ID: string - primary key value to load the MJ_BizApps_Sonar: Score Histories record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof mjBizAppsSonarScoreHistoryEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: ScoreModelID
    * * Display Name: Score Model ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Models (vwScoreModels.ID)
    */
    get ScoreModelID(): string {
        return this.Get('ScoreModelID');
    }
    set ScoreModelID(value: string) {
        this.Set('ScoreModelID', value);
    }

    /**
    * * Field Name: ScoreModelVersionID
    * * Display Name: Score Model Version ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Model Versions (vwScoreModelVersions.ID)
    */
    get ScoreModelVersionID(): string {
        return this.Get('ScoreModelVersionID');
    }
    set ScoreModelVersionID(value: string) {
        this.Set('ScoreModelVersionID', value);
    }

    /**
    * * Field Name: AnchorEntityID
    * * Display Name: Anchor Entity ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ: Entities (vwEntities.ID)
    */
    get AnchorEntityID(): string {
        return this.Get('AnchorEntityID');
    }
    set AnchorEntityID(value: string) {
        this.Set('AnchorEntityID', value);
    }

    /**
    * * Field Name: AnchorRecordID
    * * Display Name: Anchor Record ID
    * * SQL Data Type: nvarchar(450)
    * * Description: Primary-key value of the scored anchor record, stored as a string to stay entity-agnostic.
    */
    get AnchorRecordID(): string {
        return this.Get('AnchorRecordID');
    }
    set AnchorRecordID(value: string) {
        this.Set('AnchorRecordID', value);
    }

    /**
    * * Field Name: NormalizedScore
    * * Display Name: Normalized Score
    * * SQL Data Type: decimal(9, 4)
    * * Description: The headline normalized score at this point in time.
    */
    get NormalizedScore(): number | null {
        return this.Get('NormalizedScore');
    }
    set NormalizedScore(value: number | null) {
        this.Set('NormalizedScore', value);
    }

    /**
    * * Field Name: BandID
    * * Display Name: Band ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Bands (vwScoreBands.ID)
    */
    get BandID(): string | null {
        return this.Get('BandID');
    }
    set BandID(value: string | null) {
        this.Set('BandID', value);
    }

    /**
    * * Field Name: AsOfDate
    * * Display Name: As Of Date
    * * SQL Data Type: datetime2
    * * Description: The "now" the time windows resolved against for this snapshot.
    */
    get AsOfDate(): Date | null {
        return this.Get('AsOfDate');
    }
    set AsOfDate(value: Date | null) {
        this.Set('AsOfDate', value);
    }

    /**
    * * Field Name: ComputedAt
    * * Display Name: Computed At
    * * SQL Data Type: datetime2
    * * Default Value: getutcdate()
    * * Description: UTC timestamp at which this snapshot was computed.
    */
    get ComputedAt(): Date {
        return this.Get('ComputedAt');
    }
    set ComputedAt(value: Date) {
        this.Set('ComputedAt', value);
    }

    /**
    * * Field Name: DataCompleteness
    * * Display Name: Data Completeness
    * * SQL Data Type: decimal(5, 4)
    * * Description: Fraction of factors that had data at this point in time (0-1).
    */
    get DataCompleteness(): number | null {
        return this.Get('DataCompleteness');
    }
    set DataCompleteness(value: number | null) {
        this.Set('DataCompleteness', value);
    }

    /**
    * * Field Name: Confidence
    * * Display Name: Confidence
    * * SQL Data Type: decimal(5, 4)
    * * Description: Confidence in the score at this point in time (0-1).
    */
    get Confidence(): number | null {
        return this.Get('Confidence');
    }
    set Confidence(value: number | null) {
        this.Set('Confidence', value);
    }

    /**
    * * Field Name: ContributionsJSON
    * * Display Name: Contributions JSON
    * * SQL Data Type: nvarchar(MAX)
    * * Description: Compact per-factor snapshot (JSON) for point-in-time explainability without exploding row counts.
    */
    get ContributionsJSON(): string | null {
        return this.Get('ContributionsJSON');
    }
    set ContributionsJSON(value: string | null) {
        this.Set('ContributionsJSON', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }

    /**
    * * Field Name: ScoreModel
    * * Display Name: Score Model
    * * SQL Data Type: nvarchar(200)
    */
    get ScoreModel(): string {
        return this.Get('ScoreModel');
    }

    /**
    * * Field Name: AnchorEntity
    * * Display Name: Anchor Entity
    * * SQL Data Type: nvarchar(255)
    */
    get AnchorEntity(): string {
        return this.Get('AnchorEntity');
    }
}


/**
 * MJ_BizApps_Sonar: Score Model Audit Events - strongly typed entity sub-class
 * * Schema: __mj_BizAppsSonar
 * * Base Table: ScoreModelAuditEvent
 * * Base View: vwScoreModelAuditEvents
 * * @description Config-change audit: who changed which weight, factor, or window and when. Required for an explainable, governed scoring product.
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MJ_BizApps_Sonar: Score Model Audit Events')
export class mjBizAppsSonarScoreModelAuditEventEntity extends BaseEntity<mjBizAppsSonarScoreModelAuditEventEntityType> {
    /**
    * Loads the MJ_BizApps_Sonar: Score Model Audit Events record from the database
    * @param ID: string - primary key value to load the MJ_BizApps_Sonar: Score Model Audit Events record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof mjBizAppsSonarScoreModelAuditEventEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: ScoreModelID
    * * Display Name: Score Model ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Models (vwScoreModels.ID)
    */
    get ScoreModelID(): string {
        return this.Get('ScoreModelID');
    }
    set ScoreModelID(value: string) {
        this.Set('ScoreModelID', value);
    }

    /**
    * * Field Name: EntityChanged
    * * Display Name: Entity Changed
    * * SQL Data Type: nvarchar(100)
    * * Description: Name of the configuration entity that changed (e.g. ScoreModel, Factor, ModelFactor).
    */
    get EntityChanged(): string {
        return this.Get('EntityChanged');
    }
    set EntityChanged(value: string) {
        this.Set('EntityChanged', value);
    }

    /**
    * * Field Name: RecordID
    * * Display Name: Record ID
    * * SQL Data Type: nvarchar(100)
    * * Description: Identifier of the specific record that changed, stored as a string to stay entity-agnostic.
    */
    get RecordID(): string | null {
        return this.Get('RecordID');
    }
    set RecordID(value: string | null) {
        this.Set('RecordID', value);
    }

    /**
    * * Field Name: ChangeType
    * * Display Name: Change Type
    * * SQL Data Type: nvarchar(20)
    * * Value List Type: List
    * * Possible Values 
    *   * Create
    *   * Delete
    *   * Publish
    *   * Update
    * * Description: Kind of change: Create, Update, Delete, or Publish.
    */
    get ChangeType(): 'Create' | 'Delete' | 'Publish' | 'Update' {
        return this.Get('ChangeType');
    }
    set ChangeType(value: 'Create' | 'Delete' | 'Publish' | 'Update') {
        this.Set('ChangeType', value);
    }

    /**
    * * Field Name: BeforeJSON
    * * Display Name: Before JSON
    * * SQL Data Type: nvarchar(MAX)
    * * Description: JSON snapshot of the record before the change.
    */
    get BeforeJSON(): string | null {
        return this.Get('BeforeJSON');
    }
    set BeforeJSON(value: string | null) {
        this.Set('BeforeJSON', value);
    }

    /**
    * * Field Name: AfterJSON
    * * Display Name: After JSON
    * * SQL Data Type: nvarchar(MAX)
    * * Description: JSON snapshot of the record after the change.
    */
    get AfterJSON(): string | null {
        return this.Get('AfterJSON');
    }
    set AfterJSON(value: string | null) {
        this.Set('AfterJSON', value);
    }

    /**
    * * Field Name: ChangedByUserID
    * * Display Name: Changed By User ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ: Users (vwUsers.ID)
    */
    get ChangedByUserID(): string | null {
        return this.Get('ChangedByUserID');
    }
    set ChangedByUserID(value: string | null) {
        this.Set('ChangedByUserID', value);
    }

    /**
    * * Field Name: ChangedAt
    * * Display Name: Changed At
    * * SQL Data Type: datetime2
    * * Default Value: getutcdate()
    * * Description: UTC timestamp at which the change occurred.
    */
    get ChangedAt(): Date {
        return this.Get('ChangedAt');
    }
    set ChangedAt(value: Date) {
        this.Set('ChangedAt', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }

    /**
    * * Field Name: ScoreModel
    * * Display Name: Score Model
    * * SQL Data Type: nvarchar(200)
    */
    get ScoreModel(): string {
        return this.Get('ScoreModel');
    }

    /**
    * * Field Name: ChangedByUser
    * * Display Name: Changed By User
    * * SQL Data Type: nvarchar(100)
    */
    get ChangedByUser(): string | null {
        return this.Get('ChangedByUser');
    }
}


/**
 * MJ_BizApps_Sonar: Score Model Versions - strongly typed entity sub-class
 * * Schema: __mj_BizAppsSonar
 * * Base Table: ScoreModelVersion
 * * Base View: vwScoreModelVersions
 * * @description An immutable snapshot of a model's complete configuration at publish time. Every Score and ScoreHistory row references the version that produced it, making scores reproducible and auditable.
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MJ_BizApps_Sonar: Score Model Versions')
export class mjBizAppsSonarScoreModelVersionEntity extends BaseEntity<mjBizAppsSonarScoreModelVersionEntityType> {
    /**
    * Loads the MJ_BizApps_Sonar: Score Model Versions record from the database
    * @param ID: string - primary key value to load the MJ_BizApps_Sonar: Score Model Versions record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof mjBizAppsSonarScoreModelVersionEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: ScoreModelID
    * * Display Name: Score Model ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Models (vwScoreModels.ID)
    */
    get ScoreModelID(): string {
        return this.Get('ScoreModelID');
    }
    set ScoreModelID(value: string) {
        this.Set('ScoreModelID', value);
    }

    /**
    * * Field Name: VersionNumber
    * * Display Name: Version Number
    * * SQL Data Type: int
    * * Description: Monotonic version number within the model.
    */
    get VersionNumber(): number {
        return this.Get('VersionNumber');
    }
    set VersionNumber(value: number) {
        this.Set('VersionNumber', value);
    }

    /**
    * * Field Name: VersionLabel
    * * Display Name: Version Label
    * * SQL Data Type: nvarchar(50)
    * * Description: Optional human-readable label for the version.
    */
    get VersionLabel(): string | null {
        return this.Get('VersionLabel');
    }
    set VersionLabel(value: string | null) {
        this.Set('VersionLabel', value);
    }

    /**
    * * Field Name: ConfigSnapshotJSON
    * * Display Name: Config Snapshot JSON
    * * SQL Data Type: nvarchar(MAX)
    * * Description: Fully denormalized JSON snapshot (anchor, related-entity map, factors, weights, windows, bands, normalization) the engine can score from on its own.
    */
    get ConfigSnapshotJSON(): string {
        return this.Get('ConfigSnapshotJSON');
    }
    set ConfigSnapshotJSON(value: string) {
        this.Set('ConfigSnapshotJSON', value);
    }

    /**
    * * Field Name: ChangeSummary
    * * Display Name: Change Summary
    * * SQL Data Type: nvarchar(MAX)
    * * Description: Summary of what changed versus the prior version.
    */
    get ChangeSummary(): string | null {
        return this.Get('ChangeSummary');
    }
    set ChangeSummary(value: string | null) {
        this.Set('ChangeSummary', value);
    }

    /**
    * * Field Name: PublishedByUserID
    * * Display Name: Published By User ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ: Users (vwUsers.ID)
    */
    get PublishedByUserID(): string | null {
        return this.Get('PublishedByUserID');
    }
    set PublishedByUserID(value: string | null) {
        this.Set('PublishedByUserID', value);
    }

    /**
    * * Field Name: PublishedAt
    * * Display Name: Published At
    * * SQL Data Type: datetime2
    * * Default Value: getutcdate()
    * * Description: UTC timestamp at which this version was published.
    */
    get PublishedAt(): Date {
        return this.Get('PublishedAt');
    }
    set PublishedAt(value: Date) {
        this.Set('PublishedAt', value);
    }

    /**
    * * Field Name: IsCurrent
    * * Display Name: Is Current
    * * SQL Data Type: bit
    * * Default Value: 0
    * * Description: Indicates the single current version that is actively scoring for the model.
    */
    get IsCurrent(): boolean {
        return this.Get('IsCurrent');
    }
    set IsCurrent(value: boolean) {
        this.Set('IsCurrent', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }

    /**
    * * Field Name: ScoreModel
    * * Display Name: Score Model
    * * SQL Data Type: nvarchar(200)
    */
    get ScoreModel(): string {
        return this.Get('ScoreModel');
    }

    /**
    * * Field Name: PublishedByUser
    * * Display Name: Published By User
    * * SQL Data Type: nvarchar(100)
    */
    get PublishedByUser(): string | null {
        return this.Get('PublishedByUser');
    }
}


/**
 * MJ_BizApps_Sonar: Score Models - strongly typed entity sub-class
 * * Schema: __mj_BizAppsSonar
 * * Base Table: ScoreModel
 * * Base View: vwScoreModels
 * * @description The editable definition of one scoring model: anchor entity, scale, combine strategy, recompute policy, and bands. Many models can be active per tenant.
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MJ_BizApps_Sonar: Score Models')
export class mjBizAppsSonarScoreModelEntity extends BaseEntity<mjBizAppsSonarScoreModelEntityType> {
    /**
    * Loads the MJ_BizApps_Sonar: Score Models record from the database
    * @param ID: string - primary key value to load the MJ_BizApps_Sonar: Score Models record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof mjBizAppsSonarScoreModelEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: Name
    * * Display Name: Name
    * * SQL Data Type: nvarchar(200)
    * * Description: Human-readable name of the model, e.g. "2026 Renewal Risk".
    */
    get Name(): string {
        return this.Get('Name');
    }
    set Name(value: string) {
        this.Set('Name', value);
    }

    /**
    * * Field Name: Slug
    * * Display Name: Slug
    * * SQL Data Type: nvarchar(100)
    * * Description: Stable, unique handle for the model used in expressions and references.
    */
    get Slug(): string {
        return this.Get('Slug');
    }
    set Slug(value: string) {
        this.Set('Slug', value);
    }

    /**
    * * Field Name: Description
    * * Display Name: Description
    * * SQL Data Type: nvarchar(MAX)
    * * Description: Optional description of what the model scores and why.
    */
    get Description(): string | null {
        return this.Get('Description');
    }
    set Description(value: string | null) {
        this.Set('Description', value);
    }

    /**
    * * Field Name: AnchorEntityID
    * * Display Name: Anchor Entity ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ: Entities (vwEntities.ID)
    */
    get AnchorEntityID(): string {
        return this.Get('AnchorEntityID');
    }
    set AnchorEntityID(value: string) {
        this.Set('AnchorEntityID', value);
    }

    /**
    * * Field Name: Status
    * * Display Name: Status
    * * SQL Data Type: nvarchar(20)
    * * Default Value: Draft
    * * Value List Type: List
    * * Possible Values 
    *   * Active
    *   * Archived
    *   * Draft
    *   * Paused
    * * Description: Lifecycle status of the model: Draft, Active, Paused, or Archived.
    */
    get Status(): 'Active' | 'Archived' | 'Draft' | 'Paused' {
        return this.Get('Status');
    }
    set Status(value: 'Active' | 'Archived' | 'Draft' | 'Paused') {
        this.Set('Status', value);
    }

    /**
    * * Field Name: CurrentVersionID
    * * Display Name: Current Version ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Model Versions (vwScoreModelVersions.ID)
    */
    get CurrentVersionID(): string | null {
        return this.Get('CurrentVersionID');
    }
    set CurrentVersionID(value: string | null) {
        this.Set('CurrentVersionID', value);
    }

    /**
    * * Field Name: ScoreScaleMin
    * * Display Name: Score Scale Min
    * * SQL Data Type: decimal(9, 4)
    * * Default Value: 0
    * * Description: Minimum value of the output score scale (default 0).
    */
    get ScoreScaleMin(): number {
        return this.Get('ScoreScaleMin');
    }
    set ScoreScaleMin(value: number) {
        this.Set('ScoreScaleMin', value);
    }

    /**
    * * Field Name: ScoreScaleMax
    * * Display Name: Score Scale Max
    * * SQL Data Type: decimal(9, 4)
    * * Default Value: 100
    * * Description: Maximum value of the output score scale (default 100).
    */
    get ScoreScaleMax(): number {
        return this.Get('ScoreScaleMax');
    }
    set ScoreScaleMax(value: number) {
        this.Set('ScoreScaleMax', value);
    }

    /**
    * * Field Name: CombineStrategy
    * * Display Name: Combine Strategy
    * * SQL Data Type: nvarchar(30)
    * * Default Value: WeightedSum
    * * Value List Type: List
    * * Possible Values 
    *   * Banded
    *   * ExpressionDriven
    *   * WeightedAvg
    *   * WeightedSum
    *   * ZScoreComposite
    * * Description: How factor contributions combine into a score: WeightedSum, WeightedAvg, Banded, ZScoreComposite, or ExpressionDriven.
    */
    get CombineStrategy(): 'Banded' | 'ExpressionDriven' | 'WeightedAvg' | 'WeightedSum' | 'ZScoreComposite' {
        return this.Get('CombineStrategy');
    }
    set CombineStrategy(value: 'Banded' | 'ExpressionDriven' | 'WeightedAvg' | 'WeightedSum' | 'ZScoreComposite') {
        this.Set('CombineStrategy', value);
    }

    /**
    * * Field Name: CombineExpression
    * * Display Name: Combine Expression
    * * SQL Data Type: nvarchar(MAX)
    * * Description: For ExpressionDriven models, the formula over factor slugs used to combine contributions.
    */
    get CombineExpression(): string | null {
        return this.Get('CombineExpression');
    }
    set CombineExpression(value: string | null) {
        this.Set('CombineExpression', value);
    }

    /**
    * * Field Name: BandSetID
    * * Display Name: Band Set ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Band Sets (vwScoreBandSets.ID)
    */
    get BandSetID(): string | null {
        return this.Get('BandSetID');
    }
    set BandSetID(value: string | null) {
        this.Set('BandSetID', value);
    }

    /**
    * * Field Name: PopulationFilter
    * * Display Name: Population Filter
    * * SQL Data Type: nvarchar(MAX)
    * * Description: JSON/DSL filter defining which anchor records are in scope for scoring (e.g. Status = Active).
    */
    get PopulationFilter(): string | null {
        return this.Get('PopulationFilter');
    }
    set PopulationFilter(value: string | null) {
        this.Set('PopulationFilter', value);
    }

    /**
    * * Field Name: RecomputeMode
    * * Display Name: Recompute Mode
    * * SQL Data Type: nvarchar(20)
    * * Default Value: Scheduled
    * * Value List Type: List
    * * Possible Values 
    *   * EventDriven
    *   * Hybrid
    *   * OnDemand
    *   * Scheduled
    * * Description: When scores recompute: Scheduled, EventDriven, OnDemand, or Hybrid.
    */
    get RecomputeMode(): 'EventDriven' | 'Hybrid' | 'OnDemand' | 'Scheduled' {
        return this.Get('RecomputeMode');
    }
    set RecomputeMode(value: 'EventDriven' | 'Hybrid' | 'OnDemand' | 'Scheduled') {
        this.Set('RecomputeMode', value);
    }

    /**
    * * Field Name: RecomputeCron
    * * Display Name: Recompute Cron
    * * SQL Data Type: nvarchar(100)
    * * Description: Cron expression controlling scheduled recompute, when RecomputeMode includes a schedule.
    */
    get RecomputeCron(): string | null {
        return this.Get('RecomputeCron');
    }
    set RecomputeCron(value: string | null) {
        this.Set('RecomputeCron', value);
    }

    /**
    * * Field Name: AsOfStrategy
    * * Display Name: As Of Strategy
    * * SQL Data Type: nvarchar(20)
    * * Default Value: RunTime
    * * Value List Type: List
    * * Possible Values 
    *   * EndOfPreviousDay
    *   * Fixed
    *   * RunTime
    * * Description: Defines what "now" means when resolving time windows: RunTime, EndOfPreviousDay, or Fixed.
    */
    get AsOfStrategy(): 'EndOfPreviousDay' | 'Fixed' | 'RunTime' {
        return this.Get('AsOfStrategy');
    }
    set AsOfStrategy(value: 'EndOfPreviousDay' | 'Fixed' | 'RunTime') {
        this.Set('AsOfStrategy', value);
    }

    /**
    * * Field Name: IsCalibrated
    * * Display Name: Is Calibrated
    * * SQL Data Type: bit
    * * Default Value: 0
    * * Description: When set, the model consumes cross-tenant benchmark distributions for normalization (calibration network).
    */
    get IsCalibrated(): boolean {
        return this.Get('IsCalibrated');
    }
    set IsCalibrated(value: boolean) {
        this.Set('IsCalibrated', value);
    }

    /**
    * * Field Name: TrendWindowDays
    * * Display Name: Trend Window Days
    * * SQL Data Type: int
    * * Description: Number of days used to compute the headline Delta and trend on each score.
    */
    get TrendWindowDays(): number | null {
        return this.Get('TrendWindowDays');
    }
    set TrendWindowDays(value: number | null) {
        this.Set('TrendWindowDays', value);
    }

    /**
    * * Field Name: OwnerUserID
    * * Display Name: Owner User ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ: Users (vwUsers.ID)
    */
    get OwnerUserID(): string | null {
        return this.Get('OwnerUserID');
    }
    set OwnerUserID(value: string | null) {
        this.Set('OwnerUserID', value);
    }

    /**
    * * Field Name: EffectiveFrom
    * * Display Name: Effective From
    * * SQL Data Type: datetime2
    * * Description: Start of the bounded time range during which the model is active (optional).
    */
    get EffectiveFrom(): Date | null {
        return this.Get('EffectiveFrom');
    }
    set EffectiveFrom(value: Date | null) {
        this.Set('EffectiveFrom', value);
    }

    /**
    * * Field Name: EffectiveTo
    * * Display Name: Effective To
    * * SQL Data Type: datetime2
    * * Description: End of the bounded time range during which the model is active (optional).
    */
    get EffectiveTo(): Date | null {
        return this.Get('EffectiveTo');
    }
    set EffectiveTo(value: Date | null) {
        this.Set('EffectiveTo', value);
    }

    /**
    * * Field Name: Notes
    * * Display Name: Notes
    * * SQL Data Type: nvarchar(MAX)
    * * Description: Freeform notes about the model.
    */
    get Notes(): string | null {
        return this.Get('Notes');
    }
    set Notes(value: string | null) {
        this.Set('Notes', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }

    /**
    * * Field Name: AnchorEntity
    * * Display Name: Anchor Entity
    * * SQL Data Type: nvarchar(255)
    */
    get AnchorEntity(): string {
        return this.Get('AnchorEntity');
    }

    /**
    * * Field Name: BandSet
    * * Display Name: Band Set
    * * SQL Data Type: nvarchar(200)
    */
    get BandSet(): string | null {
        return this.Get('BandSet');
    }

    /**
    * * Field Name: OwnerUser
    * * Display Name: Owner User
    * * SQL Data Type: nvarchar(100)
    */
    get OwnerUser(): string | null {
        return this.Get('OwnerUser');
    }
}


/**
 * MJ_BizApps_Sonar: Score Recompute Runs - strongly typed entity sub-class
 * * Schema: __mj_BizAppsSonar
 * * Base Table: ScoreRecomputeRun
 * * Base View: vwScoreRecomputeRuns
 * * @description One batch or event recompute pass; drives the admin health view and compute/cost metering.
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MJ_BizApps_Sonar: Score Recompute Runs')
export class mjBizAppsSonarScoreRecomputeRunEntity extends BaseEntity<mjBizAppsSonarScoreRecomputeRunEntityType> {
    /**
    * Loads the MJ_BizApps_Sonar: Score Recompute Runs record from the database
    * @param ID: string - primary key value to load the MJ_BizApps_Sonar: Score Recompute Runs record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof mjBizAppsSonarScoreRecomputeRunEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: ScoreModelID
    * * Display Name: Score Model ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Models (vwScoreModels.ID)
    */
    get ScoreModelID(): string {
        return this.Get('ScoreModelID');
    }
    set ScoreModelID(value: string) {
        this.Set('ScoreModelID', value);
    }

    /**
    * * Field Name: ScoreModelVersionID
    * * Display Name: Score Model Version ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Model Versions (vwScoreModelVersions.ID)
    */
    get ScoreModelVersionID(): string | null {
        return this.Get('ScoreModelVersionID');
    }
    set ScoreModelVersionID(value: string | null) {
        this.Set('ScoreModelVersionID', value);
    }

    /**
    * * Field Name: TriggerType
    * * Display Name: Trigger Type
    * * SQL Data Type: nvarchar(16)
    * * Value List Type: List
    * * Possible Values 
    *   * Backfill
    *   * Event
    *   * Manual
    *   * Scheduled
    * * Description: What triggered the run: Scheduled, Event, Manual, or Backfill.
    */
    get TriggerType(): 'Backfill' | 'Event' | 'Manual' | 'Scheduled' {
        return this.Get('TriggerType');
    }
    set TriggerType(value: 'Backfill' | 'Event' | 'Manual' | 'Scheduled') {
        this.Set('TriggerType', value);
    }

    /**
    * * Field Name: Scope
    * * Display Name: Scope
    * * SQL Data Type: nvarchar(16)
    * * Value List Type: List
    * * Possible Values 
    *   * FullPopulation
    *   * Incremental
    *   * SingleRecord
    * * Description: Scope of the run: FullPopulation, Incremental, or SingleRecord.
    */
    get Scope(): 'FullPopulation' | 'Incremental' | 'SingleRecord' {
        return this.Get('Scope');
    }
    set Scope(value: 'FullPopulation' | 'Incremental' | 'SingleRecord') {
        this.Set('Scope', value);
    }

    /**
    * * Field Name: StartedAt
    * * Display Name: Started At
    * * SQL Data Type: datetime2
    * * Default Value: getutcdate()
    * * Description: UTC timestamp when the run started.
    */
    get StartedAt(): Date {
        return this.Get('StartedAt');
    }
    set StartedAt(value: Date) {
        this.Set('StartedAt', value);
    }

    /**
    * * Field Name: CompletedAt
    * * Display Name: Completed At
    * * SQL Data Type: datetime2
    * * Description: UTC timestamp when the run completed.
    */
    get CompletedAt(): Date | null {
        return this.Get('CompletedAt');
    }
    set CompletedAt(value: Date | null) {
        this.Set('CompletedAt', value);
    }

    /**
    * * Field Name: Status
    * * Display Name: Status
    * * SQL Data Type: nvarchar(16)
    * * Default Value: Running
    * * Value List Type: List
    * * Possible Values 
    *   * Failed
    *   * PartialSuccess
    *   * Running
    *   * Succeeded
    * * Description: Run status: Running, Succeeded, Failed, or PartialSuccess.
    */
    get Status(): 'Failed' | 'PartialSuccess' | 'Running' | 'Succeeded' {
        return this.Get('Status');
    }
    set Status(value: 'Failed' | 'PartialSuccess' | 'Running' | 'Succeeded') {
        this.Set('Status', value);
    }

    /**
    * * Field Name: RecordsScored
    * * Display Name: Records Scored
    * * SQL Data Type: int
    * * Description: Number of records scored in the run.
    */
    get RecordsScored(): number | null {
        return this.Get('RecordsScored');
    }
    set RecordsScored(value: number | null) {
        this.Set('RecordsScored', value);
    }

    /**
    * * Field Name: RecordsChanged
    * * Display Name: Records Changed
    * * SQL Data Type: int
    * * Description: Number of records whose score changed in the run.
    */
    get RecordsChanged(): number | null {
        return this.Get('RecordsChanged');
    }
    set RecordsChanged(value: number | null) {
        this.Set('RecordsChanged', value);
    }

    /**
    * * Field Name: BandTransitions
    * * Display Name: Band Transitions
    * * SQL Data Type: int
    * * Description: Number of band transitions recorded during the run.
    */
    get BandTransitions(): number | null {
        return this.Get('BandTransitions');
    }
    set BandTransitions(value: number | null) {
        this.Set('BandTransitions', value);
    }

    /**
    * * Field Name: DurationMs
    * * Display Name: Duration Ms
    * * SQL Data Type: bigint
    * * Description: Total run duration in milliseconds.
    */
    get DurationMs(): number | null {
        return this.Get('DurationMs');
    }
    set DurationMs(value: number | null) {
        this.Set('DurationMs', value);
    }

    /**
    * * Field Name: CostUnitsConsumed
    * * Display Name: Cost Units Consumed
    * * SQL Data Type: decimal(12, 4)
    * * Description: Tokens/compute units consumed by ActionBacked factors; feeds metering and billing.
    */
    get CostUnitsConsumed(): number | null {
        return this.Get('CostUnitsConsumed');
    }
    set CostUnitsConsumed(value: number | null) {
        this.Set('CostUnitsConsumed', value);
    }

    /**
    * * Field Name: ErrorsJSON
    * * Display Name: Errors JSON
    * * SQL Data Type: nvarchar(MAX)
    * * Description: JSON capturing any errors encountered during the run.
    */
    get ErrorsJSON(): string | null {
        return this.Get('ErrorsJSON');
    }
    set ErrorsJSON(value: string | null) {
        this.Set('ErrorsJSON', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }

    /**
    * * Field Name: ScoreModel
    * * Display Name: Score Model
    * * SQL Data Type: nvarchar(200)
    */
    get ScoreModel(): string {
        return this.Get('ScoreModel');
    }
}


/**
 * MJ_BizApps_Sonar: Score Segments - strongly typed entity sub-class
 * * Schema: __mj_BizAppsSonar
 * * Base Table: ScoreSegment
 * * Base View: vwScoreSegments
 * * @description A saved cohort over a model's scored records (e.g. "At-Risk in the renewal window") that interventions key off.
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MJ_BizApps_Sonar: Score Segments')
export class mjBizAppsSonarScoreSegmentEntity extends BaseEntity<mjBizAppsSonarScoreSegmentEntityType> {
    /**
    * Loads the MJ_BizApps_Sonar: Score Segments record from the database
    * @param ID: string - primary key value to load the MJ_BizApps_Sonar: Score Segments record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof mjBizAppsSonarScoreSegmentEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: ScoreModelID
    * * Display Name: Score Model ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Models (vwScoreModels.ID)
    */
    get ScoreModelID(): string {
        return this.Get('ScoreModelID');
    }
    set ScoreModelID(value: string) {
        this.Set('ScoreModelID', value);
    }

    /**
    * * Field Name: Name
    * * Display Name: Name
    * * SQL Data Type: nvarchar(200)
    * * Description: Display name of the segment.
    */
    get Name(): string {
        return this.Get('Name');
    }
    set Name(value: string) {
        this.Set('Name', value);
    }

    /**
    * * Field Name: Description
    * * Display Name: Description
    * * SQL Data Type: nvarchar(MAX)
    * * Description: Optional description of who the segment captures and why.
    */
    get Description(): string | null {
        return this.Get('Description');
    }
    set Description(value: string | null) {
        this.Set('Description', value);
    }

    /**
    * * Field Name: FilterExpression
    * * Display Name: Filter Expression
    * * SQL Data Type: nvarchar(MAX)
    * * Description: JSON filter (Kendo-compatible) over band/score/delta/trend/window + any anchor field — defines membership.
    */
    get FilterExpression(): string | null {
        return this.Get('FilterExpression');
    }
    set FilterExpression(value: string | null) {
        this.Set('FilterExpression', value);
    }

    /**
    * * Field Name: IsDynamic
    * * Display Name: Is Dynamic
    * * SQL Data Type: bit
    * * Default Value: 1
    * * Description: When 1, membership is recomputed each run from the filter; when 0, the cohort is a fixed snapshot.
    */
    get IsDynamic(): boolean {
        return this.Get('IsDynamic');
    }
    set IsDynamic(value: boolean) {
        this.Set('IsDynamic', value);
    }

    /**
    * * Field Name: MemberCountCached
    * * Display Name: Member Count
    * * SQL Data Type: int
    * * Description: Cached count of members in the segment as of LastEvaluatedAt (display/perf only).
    */
    get MemberCountCached(): number | null {
        return this.Get('MemberCountCached');
    }
    set MemberCountCached(value: number | null) {
        this.Set('MemberCountCached', value);
    }

    /**
    * * Field Name: LastEvaluatedAt
    * * Display Name: Last Evaluated At
    * * SQL Data Type: datetime2
    * * Description: When the segment membership/count was last evaluated.
    */
    get LastEvaluatedAt(): Date | null {
        return this.Get('LastEvaluatedAt');
    }
    set LastEvaluatedAt(value: Date | null) {
        this.Set('LastEvaluatedAt', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }

    /**
    * * Field Name: ScoreModel
    * * Display Name: Score Model
    * * SQL Data Type: nvarchar(200)
    */
    get ScoreModel(): string {
        return this.Get('ScoreModel');
    }
}


/**
 * MJ_BizApps_Sonar: Scores - strongly typed entity sub-class
 * * Schema: __mj_BizAppsSonar
 * * Base Table: Score
 * * Base View: vwScores
 * * @description The current score for one anchor record under one model. Written back into MJ as a first-class entity.
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MJ_BizApps_Sonar: Scores')
export class mjBizAppsSonarScoreEntity extends BaseEntity<mjBizAppsSonarScoreEntityType> {
    /**
    * Loads the MJ_BizApps_Sonar: Scores record from the database
    * @param ID: string - primary key value to load the MJ_BizApps_Sonar: Scores record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof mjBizAppsSonarScoreEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: ScoreModelID
    * * Display Name: Score Model ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Models (vwScoreModels.ID)
    */
    get ScoreModelID(): string {
        return this.Get('ScoreModelID');
    }
    set ScoreModelID(value: string) {
        this.Set('ScoreModelID', value);
    }

    /**
    * * Field Name: ScoreModelVersionID
    * * Display Name: Score Model Version ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Model Versions (vwScoreModelVersions.ID)
    */
    get ScoreModelVersionID(): string {
        return this.Get('ScoreModelVersionID');
    }
    set ScoreModelVersionID(value: string) {
        this.Set('ScoreModelVersionID', value);
    }

    /**
    * * Field Name: AnchorEntityID
    * * Display Name: Anchor Entity ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ: Entities (vwEntities.ID)
    */
    get AnchorEntityID(): string {
        return this.Get('AnchorEntityID');
    }
    set AnchorEntityID(value: string) {
        this.Set('AnchorEntityID', value);
    }

    /**
    * * Field Name: AnchorRecordID
    * * Display Name: Anchor Record ID
    * * SQL Data Type: nvarchar(450)
    * * Description: Primary-key value of the scored anchor record, stored as a string to stay entity-agnostic.
    */
    get AnchorRecordID(): string {
        return this.Get('AnchorRecordID');
    }
    set AnchorRecordID(value: string) {
        this.Set('AnchorRecordID', value);
    }

    /**
    * * Field Name: AnchorRecordKeyJSON
    * * Display Name: Anchor Record Key JSON
    * * SQL Data Type: nvarchar(MAX)
    * * Description: Optional JSON representation of a composite anchor key.
    */
    get AnchorRecordKeyJSON(): string | null {
        return this.Get('AnchorRecordKeyJSON');
    }
    set AnchorRecordKeyJSON(value: string | null) {
        this.Set('AnchorRecordKeyJSON', value);
    }

    /**
    * * Field Name: RawScore
    * * Display Name: Raw Score
    * * SQL Data Type: decimal(12, 4)
    * * Description: Pre-scale combined value before mapping to the output scale.
    */
    get RawScore(): number | null {
        return this.Get('RawScore');
    }
    set RawScore(value: number | null) {
        this.Set('RawScore', value);
    }

    /**
    * * Field Name: NormalizedScore
    * * Display Name: Normalized Score
    * * SQL Data Type: decimal(9, 4)
    * * Description: The headline score on the model's output scale (e.g. 0-100).
    */
    get NormalizedScore(): number | null {
        return this.Get('NormalizedScore');
    }
    set NormalizedScore(value: number | null) {
        this.Set('NormalizedScore', value);
    }

    /**
    * * Field Name: BandID
    * * Display Name: Band ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Bands (vwScoreBands.ID)
    */
    get BandID(): string | null {
        return this.Get('BandID');
    }
    set BandID(value: string | null) {
        this.Set('BandID', value);
    }

    /**
    * * Field Name: PreviousNormalizedScore
    * * Display Name: Previous Normalized Score
    * * SQL Data Type: decimal(9, 4)
    * * Description: The normalized score from the previous computation, for delta/trend.
    */
    get PreviousNormalizedScore(): number | null {
        return this.Get('PreviousNormalizedScore');
    }
    set PreviousNormalizedScore(value: number | null) {
        this.Set('PreviousNormalizedScore', value);
    }

    /**
    * * Field Name: PreviousBandID
    * * Display Name: Previous Band ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Sonar: Score Bands (vwScoreBands.ID)
    */
    get PreviousBandID(): string | null {
        return this.Get('PreviousBandID');
    }
    set PreviousBandID(value: string | null) {
        this.Set('PreviousBandID', value);
    }

    /**
    * * Field Name: Delta
    * * Display Name: Delta
    * * SQL Data Type: decimal(9, 4)
    * * Description: Change in normalized score versus the previous value over the trend window.
    */
    get Delta(): number | null {
        return this.Get('Delta');
    }
    set Delta(value: number | null) {
        this.Set('Delta', value);
    }

    /**
    * * Field Name: TrendDirection
    * * Display Name: Trend Direction
    * * SQL Data Type: nvarchar(8)
    * * Value List Type: List
    * * Possible Values 
    *   * Down
    *   * Flat
    *   * Up
    * * Description: Direction of recent movement: Up, Down, or Flat.
    */
    get TrendDirection(): 'Down' | 'Flat' | 'Up' | null {
        return this.Get('TrendDirection');
    }
    set TrendDirection(value: 'Down' | 'Flat' | 'Up' | null) {
        this.Set('TrendDirection', value);
    }

    /**
    * * Field Name: TrendSlope
    * * Display Name: Trend Slope
    * * SQL Data Type: decimal(12, 6)
    * * Description: Regression slope of the score over recent history.
    */
    get TrendSlope(): number | null {
        return this.Get('TrendSlope');
    }
    set TrendSlope(value: number | null) {
        this.Set('TrendSlope', value);
    }

    /**
    * * Field Name: Confidence
    * * Display Name: Confidence
    * * SQL Data Type: decimal(5, 4)
    * * Description: Confidence in the score (0-1), derived from data completeness.
    */
    get Confidence(): number | null {
        return this.Get('Confidence');
    }
    set Confidence(value: number | null) {
        this.Set('Confidence', value);
    }

    /**
    * * Field Name: DataCompleteness
    * * Display Name: Data Completeness
    * * SQL Data Type: decimal(5, 4)
    * * Description: Fraction of factors that had data when the score was computed (0-1).
    */
    get DataCompleteness(): number | null {
        return this.Get('DataCompleteness');
    }
    set DataCompleteness(value: number | null) {
        this.Set('DataCompleteness', value);
    }

    /**
    * * Field Name: ComputedAt
    * * Display Name: Computed At
    * * SQL Data Type: datetime2
    * * Default Value: getutcdate()
    * * Description: UTC timestamp at which this score was computed.
    */
    get ComputedAt(): Date {
        return this.Get('ComputedAt');
    }
    set ComputedAt(value: Date) {
        this.Set('ComputedAt', value);
    }

    /**
    * * Field Name: AsOfDate
    * * Display Name: As Of Date
    * * SQL Data Type: datetime2
    * * Description: The "now" the time windows resolved against for this score.
    */
    get AsOfDate(): Date | null {
        return this.Get('AsOfDate');
    }
    set AsOfDate(value: Date | null) {
        this.Set('AsOfDate', value);
    }

    /**
    * * Field Name: NextRecomputeAt
    * * Display Name: Next Recompute At
    * * SQL Data Type: datetime2
    * * Description: Optional scheduled time for the next recompute of this score.
    */
    get NextRecomputeAt(): Date | null {
        return this.Get('NextRecomputeAt');
    }
    set NextRecomputeAt(value: Date | null) {
        this.Set('NextRecomputeAt', value);
    }

    /**
    * * Field Name: IsStale
    * * Display Name: Is Stale
    * * SQL Data Type: bit
    * * Default Value: 0
    * * Description: Indicates population statistics moved but this record has not yet been recomputed.
    */
    get IsStale(): boolean {
        return this.Get('IsStale');
    }
    set IsStale(value: boolean) {
        this.Set('IsStale', value);
    }

    /**
    * * Field Name: ExplanationSummary
    * * Display Name: Explanation Summary
    * * SQL Data Type: nvarchar(MAX)
    * * Description: Cached natural-language explanation of the score, refreshed on material change.
    */
    get ExplanationSummary(): string | null {
        return this.Get('ExplanationSummary');
    }
    set ExplanationSummary(value: string | null) {
        this.Set('ExplanationSummary', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }

    /**
    * * Field Name: ScoreModel
    * * Display Name: Score Model
    * * SQL Data Type: nvarchar(200)
    */
    get ScoreModel(): string {
        return this.Get('ScoreModel');
    }

    /**
    * * Field Name: AnchorEntity
    * * Display Name: Anchor Entity
    * * SQL Data Type: nvarchar(255)
    */
    get AnchorEntity(): string {
        return this.Get('AnchorEntity');
    }
}


/**
 * MJ_BizApps_Sonar: Time Windows - strongly typed entity sub-class
 * * Schema: __mj_BizAppsSonar
 * * Base Table: TimeWindow
 * * Base View: vwTimeWindows
 * * @description A reusable, first-class time window used when evaluating factors (e.g. trailing 90 days, current term, renewal window -90d).
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MJ_BizApps_Sonar: Time Windows')
export class mjBizAppsSonarTimeWindowEntity extends BaseEntity<mjBizAppsSonarTimeWindowEntityType> {
    /**
    * Loads the MJ_BizApps_Sonar: Time Windows record from the database
    * @param ID: string - primary key value to load the MJ_BizApps_Sonar: Time Windows record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof mjBizAppsSonarTimeWindowEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: Name
    * * Display Name: Name
    * * SQL Data Type: nvarchar(120)
    * * Description: Display name of the time window.
    */
    get Name(): string {
        return this.Get('Name');
    }
    set Name(value: string) {
        this.Set('Name', value);
    }

    /**
    * * Field Name: WindowType
    * * Display Name: Window Type
    * * SQL Data Type: nvarchar(20)
    * * Value List Type: List
    * * Possible Values 
    *   * AllTime
    *   * Calendar
    *   * RenewalRelative
    *   * Rolling
    *   * SinceEvent
    * * Description: Window type: Rolling, Calendar, SinceEvent, RenewalRelative, or AllTime.
    */
    get WindowType(): 'AllTime' | 'Calendar' | 'RenewalRelative' | 'Rolling' | 'SinceEvent' {
        return this.Get('WindowType');
    }
    set WindowType(value: 'AllTime' | 'Calendar' | 'RenewalRelative' | 'Rolling' | 'SinceEvent') {
        this.Set('WindowType', value);
    }

    /**
    * * Field Name: LengthDays
    * * Display Name: Length Days
    * * SQL Data Type: int
    * * Description: Window length in days, for Rolling/Calendar windows.
    */
    get LengthDays(): number | null {
        return this.Get('LengthDays');
    }
    set LengthDays(value: number | null) {
        this.Set('LengthDays', value);
    }

    /**
    * * Field Name: LengthMonths
    * * Display Name: Length Months
    * * SQL Data Type: int
    * * Description: Window length in months, for Rolling/Calendar windows.
    */
    get LengthMonths(): number | null {
        return this.Get('LengthMonths');
    }
    set LengthMonths(value: number | null) {
        this.Set('LengthMonths', value);
    }

    /**
    * * Field Name: AnchorDateField
    * * Display Name: Anchor Date Field
    * * SQL Data Type: nvarchar(200)
    * * Description: For RenewalRelative/SinceEvent windows, the date field on the anchor record the window is measured from (e.g. RenewalDate).
    */
    get AnchorDateField(): string | null {
        return this.Get('AnchorDateField');
    }
    set AnchorDateField(value: string | null) {
        this.Set('AnchorDateField', value);
    }

    /**
    * * Field Name: OffsetDays
    * * Display Name: Offset Days
    * * SQL Data Type: int
    * * Description: Offset in days applied to the window start relative to the anchor date.
    */
    get OffsetDays(): number | null {
        return this.Get('OffsetDays');
    }
    set OffsetDays(value: number | null) {
        this.Set('OffsetDays', value);
    }

    /**
    * * Field Name: Description
    * * Display Name: Description
    * * SQL Data Type: nvarchar(MAX)
    * * Description: Optional description of the time window.
    */
    get Description(): string | null {
        return this.Get('Description');
    }
    set Description(value: string | null) {
        this.Set('Description', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }
}
