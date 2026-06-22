import { Metadata, UserInfo, EntityInfo } from "@memberjunction/core";
import {
    mjBizAppsSonarFactorEntity,
    mjBizAppsSonarModelRelatedEntityEntity,
    mjBizAppsSonarTimeWindowEntity,
} from "@mj-biz-apps/sonar-entities";
import { IFactorEvaluator } from "../contracts/IFactorEvaluator";
import { CompiledFactorEvaluator } from "./CompiledFactorEvaluator";
import { CompiledFactorSpec, CompiledWindow, buildAggregateExpression, windowNeedsAnchorJoin } from "./factorSql";
import {
    CompiledFilter,
    CompositeFilterDescriptor,
    compileFilter,
} from "./filter";

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
        const validColumns = relatedEntity.Fields.map((f) => f.Name);
        const window = await this.resolveWindow(factor, validColumns, contextUser);
        const filter = this.resolveFilter(factor, validColumns);
        const anchorJoin = windowNeedsAnchorJoin(window)
            ? this.resolveAnchorTable(factor.AnchorEntityID)
            : { table: null, pkColumn: null };

        const spec: CompiledFactorSpec = {
            factorId: factor.ID,
            relatedTable: `[${relatedEntity.SchemaName}].[${relatedEntity.BaseTable}]`,
            anchorKeyColumn,
            window,
            anchorTable: anchorJoin.table,
            anchorPkColumn: anchorJoin.pkColumn,
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

    /** The anchor entity's table (bracket-quoted) + PK column, for per-anchor window joins. */
    private resolveAnchorTable(anchorEntityID: string): { table: string; pkColumn: string } {
        const anchor = new Metadata().EntityByID(anchorEntityID);
        if (!anchor) {
            throw new Error(`FactorCompiler: anchor entity ${anchorEntityID} not found in metadata.`);
        }
        const pk = anchor.PrimaryKeys[0]?.Name;
        if (!pk) {
            throw new Error(`FactorCompiler: anchor entity '${anchor.Name}' has no primary key.`);
        }
        return { table: `[${anchor.SchemaName}].[${anchor.BaseTable}]`, pkColumn: pk };
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
     * Resolve the factor's TimeWindow into a {@link CompiledWindow} (or null for AllTime / no
     * window). Rolling and Calendar are wired; SinceEvent and RenewalRelative are implemented in
     * the SQL layer but not yet wireable here — they need a SECOND date column (the related
     * activity date AND a distinct anchor boundary date), and the schema can't express both until
     * `Factor.DateField` lands (see roadmap). Until then the related date column is sourced from
     * `TimeWindow.AnchorDateField` as a temporary bridge.
     */
    private async resolveWindow(
        factor: mjBizAppsSonarFactorEntity,
        validColumns: string[],
        contextUser: UserInfo,
    ): Promise<CompiledWindow | null> {
        if (!factor.TimeWindowID) {
            return null;
        }
        const md = new Metadata();
        const tw = await md.GetEntityObject<mjBizAppsSonarTimeWindowEntity>(
            "MJ_BizApps_Sonar: Time Windows",
            contextUser,
        );
        if (!(await tw.Load(factor.TimeWindowID))) {
            throw new Error(`FactorCompiler: TimeWindow ${factor.TimeWindowID} not found.`);
        }
        // "All Time" means no time bound — aggregate over the entity's full history (no date filter).
        if (tw.WindowType === "AllTime") {
            return null;
        }
        // TEMPORARY BRIDGE: the related activity-date column belongs on Factor.DateField (pending
        // migration); until then it is read from AnchorDateField. A window with no date column set
        // degrades to "no time bound" rather than silently mis-filtering.
        const dateColumn = this.bridgeDateColumn(tw, validColumns);
        if (!dateColumn) {
            return null;
        }
        switch (tw.WindowType) {
            case "Rolling":
                if (tw.LengthDays == null && tw.LengthMonths == null) {
                    throw new Error(`FactorCompiler: Rolling window ${tw.ID} needs LengthDays or LengthMonths.`);
                }
                return { kind: "Rolling", dateColumn, lengthDays: tw.LengthDays, lengthMonths: tw.LengthMonths };
            case "Calendar":
                return { kind: "Calendar", dateColumn, period: this.calendarPeriod(tw) };
            case "SinceEvent":
            case "RenewalRelative":
                throw new Error(
                    `FactorCompiler: '${tw.WindowType}' windows are implemented in SQL but not yet configurable — ` +
                        `they need a distinct anchor boundary date, which requires Factor.DateField (roadmapped).`,
                );
            default:
                throw new Error(`FactorCompiler: unsupported window type '${tw.WindowType}'.`);
        }
    }

    /** Bridge source for the related activity-date column (TimeWindow.AnchorDateField), validated
     *  against the related entity's real columns (typo / injection guard). Null when unset. */
    private bridgeDateColumn(tw: mjBizAppsSonarTimeWindowEntity, validColumns: string[]): string | null {
        if (!tw.AnchorDateField) {
            return null;
        }
        const match = validColumns.find((c) => c.toLowerCase() === tw.AnchorDateField!.toLowerCase());
        if (!match) {
            throw new Error(
                `FactorCompiler: window date field '${tw.AnchorDateField}' is not a column on the related entity.`,
            );
        }
        return match;
    }

    /** Map a Calendar window's length to a named period: 1mo → month, 3mo → quarter, 12mo → year. */
    private calendarPeriod(tw: mjBizAppsSonarTimeWindowEntity): "month" | "quarter" | "year" {
        switch (tw.LengthMonths) {
            case 1: return "month";
            case 3: return "quarter";
            case 12: return "year";
            default:
                throw new Error(
                    `FactorCompiler: Calendar window ${tw.ID} supports LengthMonths of 1 (month), 3 (quarter), or 12 (year); ` +
                        `org-specific 'terms' are not supported yet (got ${tw.LengthMonths}).`,
                );
        }
    }
}
