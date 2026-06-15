import { Metadata, UserInfo, EntityInfo } from "@memberjunction/core";
import {
    sonarFactorEntity,
    sonarModelRelatedEntityEntity,
    sonarTimeWindowEntity,
} from "@mj-biz-apps/sonar-entities";
import { IFactorEvaluator } from "../contracts/IFactorEvaluator";
import { CompiledFactorEvaluator } from "./CompiledFactorEvaluator";
import { CompiledFactorSpec } from "./factorSql";

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
 * v1 scope: Declarative factors, Count aggregation, a single-hop related entity, and a
 * Rolling time window (or none). Anything outside that throws a clear error rather than
 * silently emitting wrong SQL — we widen the scope deliberately, one branch at a time.
 */
export class FactorCompiler {
    public async compile(
        factor: sonarFactorEntity,
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

        const spec: CompiledFactorSpec = {
            factorId: factor.ID,
            relatedTable: `[${relatedEntity.SchemaName}].[${relatedEntity.BaseTable}]`,
            anchorKeyColumn,
            dateColumn: window.dateColumn,
            windowLengthDays: window.windowLengthDays,
            aggregateSql: this.aggregateSql(),
        };
        return new CompiledFactorEvaluator(spec);
    }

    /** Fail loud on anything outside the v1 slice. */
    private assertSupported(factor: sonarFactorEntity): void {
        if (factor.FactorType !== "Declarative") {
            throw new Error(
                `FactorCompiler: only Declarative factors are supported yet (got '${factor.FactorType}' for factor ${factor.ID}).`,
            );
        }
        if (factor.Aggregation !== "Count") {
            throw new Error(
                `FactorCompiler: only the Count aggregation is supported yet (got '${factor.Aggregation}' for factor ${factor.ID}).`,
            );
        }
    }

    /**
     * Find the entity that holds the signal data. v1 uses the model-scoped related entity
     * (Factor.SourceRelatedEntityID → ModelRelatedEntity → RelatedEntityID); library
     * factors (SourceEntityID) are deferred.
     */
    private async resolveRelatedEntity(
        factor: sonarFactorEntity,
        contextUser: UserInfo,
    ): Promise<EntityInfo> {
        if (!factor.SourceRelatedEntityID) {
            throw new Error(
                `FactorCompiler: factor ${factor.ID} has no SourceRelatedEntityID (library factors not supported yet).`,
            );
        }
        const md = new Metadata();
        const mre = await md.GetEntityObject<sonarModelRelatedEntityEntity>(
            "Sonar: Model Related Entities",
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
     * windows (and "no window" when the factor has none); other window types are deferred.
     */
    private async resolveWindow(
        factor: sonarFactorEntity,
        contextUser: UserInfo,
    ): Promise<WindowSpec> {
        if (!factor.TimeWindowID) {
            return { dateColumn: null, windowLengthDays: null };
        }
        const md = new Metadata();
        const tw = await md.GetEntityObject<sonarTimeWindowEntity>(
            "Sonar: Time Windows",
            contextUser,
        );
        if (!(await tw.Load(factor.TimeWindowID))) {
            throw new Error(
                `FactorCompiler: TimeWindow ${factor.TimeWindowID} not found.`,
            );
        }
        if (tw.WindowType !== "Rolling") {
            throw new Error(
                `FactorCompiler: only Rolling time windows are supported yet (got '${tw.WindowType}').`,
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

    /** Map the aggregation to a SQL expression. v1 is Count-only; Sum/Avg/etc. land here later. */
    private aggregateSql(): string {
        return "COUNT(*)";
    }
}
