import { Metadata, UserInfo, EntityInfo } from "@memberjunction/core";
import {
    mjBizAppsSonarFactorEntity,
    mjBizAppsSonarModelRelatedEntityEntity,
    mjBizAppsSonarTimeWindowEntity,
} from "@mj-biz-apps/sonar-entities";
import { IFactorEvaluator } from "../contracts/IFactorEvaluator";
import { CompiledFactorEvaluator } from "./CompiledFactorEvaluator";
import { CompiledFactorSpec, buildAggregateExpression } from "./factorSql";
import {
    CompiledFilter,
    CompositeFilterDescriptor,
    compileFilter,
} from "./filter";

/** The date pieces resolved from a factor's TimeWindow (both null when there is no window). */
interface WindowSpec {
    dateColumn: string | null;
    windowLengthDays: number | null;
}

/**
 * Factory. Turns a factor's stored configuration into a ready-to-run evaluator (config in →
 * IFactorEvaluator out). This is the only place that decides which kind of evaluator to
 * build; everything downstream stays blind to the choice.
 *
 * v1 scope: Declarative factors; Count/Sum/Avg/Min/Max/DistinctCount aggregations; a
 * single-hop related entity; and a Rolling time window (or none). Anything outside that
 * throws a clear error rather than silently emitting wrong SQL — we widen deliberately.
 */
export class FactorCompiler {
    public async compile(
        factor: mjBizAppsSonarFactorEntity,
        contextUser: UserInfo,
    ): Promise<IFactorEvaluator> {
        this.assertSupported(factor);

        const relatedEntity = await this.resolveRelatedEntity(
            factor,
            contextUser,
        );
        const anchorKeyColumn = this.resolveAnchorKeyColumn(
            relatedEntity,
            factor.AnchorEntityID,
        );
        const window = await this.resolveWindow(factor, contextUser);
        const validColumns = relatedEntity.Fields.map((f) => f.Name);
        const filter = this.resolveFilter(factor, validColumns);

        const spec: CompiledFactorSpec = {
            factorId: factor.ID,
            relatedTable: `[${relatedEntity.SchemaName}].[${relatedEntity.BaseTable}]`,
            anchorKeyColumn,
            dateColumn: window.dateColumn,
            windowLengthDays: window.windowLengthDays,
            // The aggregate expression validates AggregateFieldName against the related
            // entity's real columns, so it is built here (after the entity is resolved).
            aggregateSql: buildAggregateExpression(
                factor.Aggregation,
                factor.AggregateFieldName,
                validColumns,
            ),
            filterClause: filter.clause,
            filterParams: filter.params,
        };
        return new CompiledFactorEvaluator(spec);
    }

    /**
     * Parse the factor's FilterExpression (Kendo filter JSON) into a parameterized WHERE
     * fragment. No FilterExpression → no clause. Fields are validated against the related
     * entity's columns inside compileFilter.
     */
    private resolveFilter(
        factor: mjBizAppsSonarFactorEntity,
        validColumns: string[],
    ): CompiledFilter {
        if (!factor.FilterExpression) {
            return { clause: null, params: {} };
        }
        let parsed: CompositeFilterDescriptor;
        try {
            parsed = JSON.parse(
                factor.FilterExpression,
            ) as CompositeFilterDescriptor;
        } catch {
            throw new Error(
                `FactorCompiler: factor ${factor.ID} has invalid FilterExpression JSON.`,
            );
        }
        return compileFilter(parsed, validColumns);
    }

    /** Fail loud on factor kinds outside the v1 slice (aggregation support is enforced in buildAggregateExpression). */
    private assertSupported(factor: mjBizAppsSonarFactorEntity): void {
        if (factor.FactorType !== "Declarative") {
            throw new Error(
                `FactorCompiler: only Declarative factors are supported yet (got '${factor.FactorType}' for factor ${factor.ID}).`,
            );
        }
    }

    /**
     * Find the entity that holds the signal data. v1 uses the model-scoped related entity
     * (Factor.SourceRelatedEntityID → ModelRelatedEntity → RelatedEntityID); library
     * factors (SourceEntityID) are deferred.
     */
    private async resolveRelatedEntity(
        factor: mjBizAppsSonarFactorEntity,
        contextUser: UserInfo,
    ): Promise<EntityInfo> {
        if (!factor.SourceRelatedEntityID) {
            throw new Error(
                `FactorCompiler: factor ${factor.ID} has no SourceRelatedEntityID (library factors not supported yet).`,
            );
        }
        const md = new Metadata();
        const mre = await md.GetEntityObject<mjBizAppsSonarModelRelatedEntityEntity>(
            "MJ_BizApps_Sonar: Model Related Entities",
            contextUser,
        );
        if (!(await mre.Load(factor.SourceRelatedEntityID))) {
            throw new Error(
                `FactorCompiler: ModelRelatedEntity ${factor.SourceRelatedEntityID} not found.`,
            );
        }
        const entity = md.EntityByID(mre.RelatedEntityID);
        if (!entity) {
            throw new Error(
                `FactorCompiler: related entity ${mre.RelatedEntityID} not found in metadata.`,
            );
        }
        return entity;
    }

    /**
     * The column on the related table that points back to the anchor, found via MJ's
     * foreign-key metadata: the related entity's field whose RelatedEntityID is the anchor.
     * Exactly one is expected — zero or several is ambiguous and unsupported in v1.
     */
    private resolveAnchorKeyColumn(
        relatedEntity: EntityInfo,
        anchorEntityID: string,
    ): string {
        const foreignKeys = relatedEntity.Fields.filter(
            (f) => f.RelatedEntityID === anchorEntityID,
        );
        if (foreignKeys.length !== 1) {
            throw new Error(
                `FactorCompiler: expected exactly one foreign key from '${relatedEntity.Name}' to the anchor entity, found ${foreignKeys.length}.`,
            );
        }
        return foreignKeys[0].Name;
    }

    /**
     * Resolve the factor's TimeWindow into a date column + day count. v1 supports Rolling
     * windows and "All Time" (no time bound); "no window" (factor has none) is also fine.
     * Other window types (e.g. RenewalRelative) are deferred.
     */
    private async resolveWindow(
        factor: mjBizAppsSonarFactorEntity,
        contextUser: UserInfo,
    ): Promise<WindowSpec> {
        if (!factor.TimeWindowID) {
            return { dateColumn: null, windowLengthDays: null };
        }
        const md = new Metadata();
        const tw = await md.GetEntityObject<mjBizAppsSonarTimeWindowEntity>(
            "MJ_BizApps_Sonar: Time Windows",
            contextUser,
        );
        if (!(await tw.Load(factor.TimeWindowID))) {
            throw new Error(
                `FactorCompiler: TimeWindow ${factor.TimeWindowID} not found.`,
            );
        }
        // "All Time" means no time bound — aggregate over the entity's full history (no date filter).
        if (tw.WindowType === "AllTime") {
            return { dateColumn: null, windowLengthDays: null };
        }
        if (tw.WindowType !== "Rolling") {
            throw new Error(
                `FactorCompiler: only Rolling and All Time windows are supported yet (got '${tw.WindowType}').`,
            );
        }
        if (!tw.AnchorDateField || tw.LengthDays == null) {
            throw new Error(
                `FactorCompiler: Rolling window ${tw.ID} needs both AnchorDateField and LengthDays.`,
            );
        }
        return {
            dateColumn: tw.AnchorDateField,
            windowLengthDays: tw.LengthDays,
        };
    }
}
