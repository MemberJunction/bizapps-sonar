import { Metadata } from "@memberjunction/core";
import { SQLServerDataProvider } from "@memberjunction/sqlserver-dataprovider";
import {
    FactorEvaluationContext,
    FactorResult,
    IFactorEvaluator,
} from "../contracts/IFactorEvaluator";
import {
    AggregateRow,
    CompiledFactorSpec,
    buildFactorSql,
    mapAggregateRows,
} from "./factorSql";

/**
 * Runs a CompiledFactorSpec as one set-based query and returns the per-anchor results.
 * The SQL-building and row-mapping live in factorSql.ts as pure functions (so they can be
 * unit-tested without a database); this class is only the thin I/O orchestration around them.
 */
export class CompiledFactorEvaluator implements IFactorEvaluator {
    constructor(private readonly spec: CompiledFactorSpec) {}

    public async evaluateBatch(
        anchorIds: string[],
        asOf: Date,
        ctx: FactorEvaluationContext,
    ): Promise<Map<string, FactorResult>> {
        if (anchorIds.length === 0) {
            return new Map();
        }

        const provider = (ctx.provider ??
            Metadata.Provider) as SQLServerDataProvider;
        const sql = buildFactorSql(this.spec, anchorIds);
        const rows = (await provider.ExecuteSQL(
            sql,
            { asOf, ...(this.spec.filterParams ?? {}) },
            undefined,
            ctx.contextUser,
        )) as AggregateRow[];

        return mapAggregateRows(this.spec, rows);
    }
}
