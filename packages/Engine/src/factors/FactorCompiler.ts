import { Metadata, UserInfo, EntityInfo } from "@memberjunction/core";
import {
    mjBizAppsSonarFactorEntity,
    mjBizAppsSonarModelRelatedEntityEntity,
    mjBizAppsSonarTimeWindowEntity,
} from "@mj-biz-apps/sonar-entities";
import { IFactorEvaluator } from "../contracts/IFactorEvaluator";
import { CompiledFactorEvaluator } from "./CompiledFactorEvaluator";
import { ActionFactorEvaluator, ActionFactorSpec, ActionRunner, DEFAULT_MAX_CONCURRENCY, parseActionParams } from "./ActionFactorEvaluator";
import { AnchorKeyColumn, CompiledFactorSpec, CompiledJoin, CompiledWindow, buildAggregateExpression, windowNeedsAnchorJoin } from "./factorSql";
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
/** One hop of a `ModelRelatedEntity.RelationshipPath`: the FK column to follow toward the anchor.
 *  `entity` (the join target's name) is optional/informational — the target is derived from FK metadata. */
export interface RelationshipHop {
    fk: string;
    entity?: string;
}

/**
 * Parse `ModelRelatedEntity.RelationshipPath` into ordered hops (leaf → anchor). Empty / "[]" /
 * null → no path (single-hop). Anything else must be a JSON array of `{ fk }` objects; malformed
 * config throws rather than silently degrading to single-hop. Pure + unit-testable.
 */
export function parseRelationshipPath(raw: string | null): RelationshipHop[] {
    if (!raw || raw.trim() === "" || raw.trim() === "[]") {
        return [];
    }
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        throw new Error("FactorCompiler: RelationshipPath is not valid JSON.");
    }
    if (!Array.isArray(parsed)) {
        throw new Error(
            "FactorCompiler: RelationshipPath must be a JSON array of hops, e.g. [{ \"fk\": \"EmailSendID\" }].",
        );
    }
    return parsed.map((hop, i) => {
        if (typeof hop !== "object" || hop === null) {
            throw new Error(`FactorCompiler: RelationshipPath hop ${i} must be an object.`);
        }
        const rec = hop as Record<string, unknown>;
        if (typeof rec.fk !== "string" || rec.fk.length === 0) {
            throw new Error(
                `FactorCompiler: RelationshipPath hop ${i} needs a non-empty string 'fk'.`,
            );
        }
        return {
            fk: rec.fk,
            entity: typeof rec.entity === "string" ? rec.entity : undefined,
        };
    });
}

/** Minimal entity shape the auto path-finder needs (EntityInfo satisfies it structurally). */
export interface FkGraphEntity {
    ID: string;
    Name: string;
    Fields: { Name: string; RelatedEntityID: string | null }[];
}

/** Max hops the auto-resolver searches before giving up (bounds pathological graphs). */
const MAX_AUTO_PATH_DEPTH = 5;

/**
 * Auto-resolve the FK path from a leaf entity back to the anchor by BFS *outward from the anchor*
 * over reverse-FK (parent→child, one-to-many) edges — "what data hangs off the anchor." Returns
 * the leaf→anchor hops the join-walker consumes (the final anchor-adjacent→anchor FK is left for
 * resolveAnchorKeyColumn). Because every edge followed is a single child→parent FK on the return
 * trip, each leaf row maps to exactly one anchor → no fan-out, no DISTINCT needed. Guards:
 *   - unreachable (no descendant FK chain within maxDepth) → throw, suggest explicit RelationshipPath;
 *   - ambiguous (≥2 shortest paths) → throw, require explicit RelationshipPath.
 * Pure over the entity list (no metadata I/O), so directly unit-testable.
 */
export function findAutoPathHops(
    entities: FkGraphEntity[],
    anchorEntityID: string,
    leafEntityID: string,
    maxDepth: number = MAX_AUTO_PATH_DEPTH,
): RelationshipHop[] {
    // Reverse-FK adjacency: parentID → [{ childID, fk }]. An FK on child C pointing to parent P
    // is the outward edge P → C (traversing it is one-to-many; the return C → P is many-to-one).
    const childrenOf = new Map<string, { childID: string; fk: string }[]>();
    for (const e of entities) {
        for (const f of e.Fields) {
            if (!f.RelatedEntityID) continue;
            const list = childrenOf.get(f.RelatedEntityID) ?? [];
            list.push({ childID: e.ID, fk: f.Name });
            childrenOf.set(f.RelatedEntityID, list);
        }
    }

    // Level-order BFS from the anchor; track distance, count of shortest paths (for ambiguity),
    // and one predecessor edge (valid to follow because the path is unique when pathCount === 1).
    const dist = new Map<string, number>([[anchorEntityID, 0]]);
    const pathCount = new Map<string, number>([[anchorEntityID, 1]]);
    const pred = new Map<string, { fromID: string; fk: string }>();
    const queue: string[] = [anchorEntityID];
    while (queue.length) {
        const cur = queue.shift() as string;
        const d = dist.get(cur) as number;
        if (d >= maxDepth) continue;
        for (const edge of childrenOf.get(cur) ?? []) {
            if (!dist.has(edge.childID)) {
                dist.set(edge.childID, d + 1);
                pathCount.set(edge.childID, pathCount.get(cur) as number);
                pred.set(edge.childID, { fromID: cur, fk: edge.fk });
                queue.push(edge.childID);
            } else if (dist.get(edge.childID) === d + 1) {
                // Another equally-short route into this node → accumulate (ambiguity signal).
                pathCount.set(
                    edge.childID,
                    (pathCount.get(edge.childID) as number) + (pathCount.get(cur) as number),
                );
            }
        }
    }

    const nameOf = (id: string) => entities.find((e) => e.ID === id)?.Name ?? id;
    if (!dist.has(leafEntityID)) {
        throw new Error(
            `FactorCompiler: no foreign-key path from the anchor to '${nameOf(leafEntityID)}' within ${maxDepth} hops — add a relationship or set an explicit RelationshipPath.`,
        );
    }
    if ((pathCount.get(leafEntityID) ?? 0) > 1) {
        throw new Error(
            `FactorCompiler: multiple foreign-key paths from the anchor to '${nameOf(leafEntityID)}' — set an explicit RelationshipPath to disambiguate.`,
        );
    }

    // Walk predecessors leaf → anchor, building the anchor→leaf FK list. The walker wants the
    // leaf-side hops only (it resolves the anchor-adjacent→anchor FK itself), so drop that first
    // FK and reverse into leaf→anchor order.
    const anchorToLeafFks: string[] = [];
    let node = leafEntityID;
    while (node !== anchorEntityID) {
        const step = pred.get(node) as { fromID: string; fk: string };
        anchorToLeafFks.unshift(step.fk);
        node = step.fromID;
    }
    return anchorToLeafFks
        .slice(1)
        .reverse()
        .map((fk) => ({ fk }));
}

export class FactorCompiler {
    /** The runner that executes Action-backed factors (injected so this module needn't import the
     *  heavy MJ Actions engine — the orchestrator supplies the real one). Absent → Action factors
     *  can't compile. */
    constructor(private readonly actionRunner?: ActionRunner) {}

    public async compile(
        factor: mjBizAppsSonarFactorEntity,
        contextUser: UserInfo,
    ): Promise<IFactorEvaluator> {
        this.assertSupported(factor);

        // Action-backed factors run arbitrary code (an MJ Action), not SQL — a separate evaluator.
        if (factor.FactorType === "ActionBacked") {
            return this.compileActionFactor(factor);
        }

        const { leafEntity, relationshipPath } = await this.resolveSource(
            factor,
            contextUser,
        );
        // Resolve the path from the leaf (measure) entity to the anchor: single-hop (leaf has a
        // direct FK to the anchor) or multi-hop (follow RelationshipPath, emitting JOINs).
        const { joins, anchorKeyColumns } = this.resolveJoinPath(
            leafEntity,
            relationshipPath,
            factor.AnchorEntityID,
        );
        const validColumns = leafEntity.Fields.map((f) => f.Name);
        const window = await this.resolveWindow(factor, validColumns, contextUser);
        const filter = this.resolveFilter(factor, validColumns);
        const anchorJoin = windowNeedsAnchorJoin(window)
            ? this.resolveAnchorTable(factor.AnchorEntityID)
            : { table: null, pkColumn: null };

        const spec: CompiledFactorSpec = {
            factorId: factor.ID,
            relatedTable: `[${leafEntity.SchemaName}].[${leafEntity.BaseTable}]`,
            anchorKeyColumns,
            joins,
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
        if (factor.FactorType !== "Declarative" && factor.FactorType !== "ActionBacked") {
            throw new Error(
                `FactorCompiler: only Declarative and Action-backed factors are supported (got '${factor.FactorType}' for factor ${factor.ID}).`,
            );
        }
    }

    /** Build an Action-backed evaluator: bind the Action + its I/O contract from ActionParamsJSON,
     *  wire the real ActionEngineServer runner. PerRecord only (Batch deferred). */
    private compileActionFactor(factor: mjBizAppsSonarFactorEntity): IFactorEvaluator {
        if (!factor.ActionID) {
            throw new Error(
                `FactorCompiler: Action-backed factor ${factor.ID} has no ActionID.`,
            );
        }
        if (factor.ExecutionMode === "Batch") {
            throw new Error(
                `FactorCompiler: Batch execution mode is not supported yet (factor ${factor.ID}); use PerRecord.`,
            );
        }
        if (!this.actionRunner) {
            throw new Error(
                `FactorCompiler: no ActionRunner configured — cannot compile Action-backed factor ${factor.ID}.`,
            );
        }
        const { anchorParam, outputParam, staticParams } = parseActionParams(
            factor.ActionParamsJSON,
        );
        const spec: ActionFactorSpec = {
            factorId: factor.ID,
            actionId: factor.ActionID,
            anchorParam,
            outputParam,
            staticParams,
            maxConcurrency: factor.MaxConcurrency ?? DEFAULT_MAX_CONCURRENCY,
        };
        return new ActionFactorEvaluator(spec, this.actionRunner);
    }

    /**
     * Find the leaf (signal) entity and its anchor→leaf RelationshipPath. v1 uses the
     * model-scoped related entity (Factor.SourceRelatedEntityID → ModelRelatedEntity →
     * RelatedEntityID); library factors (SourceEntityID) are deferred. RelationshipPath
     * (also on ModelRelatedEntity) drives multi-hop resolution.
     */
    private async resolveSource(
        factor: mjBizAppsSonarFactorEntity,
        contextUser: UserInfo,
    ): Promise<{ leafEntity: EntityInfo; relationshipPath: string | null }> {
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
        const leafEntity = md.EntityByID(mre.RelatedEntityID);
        if (!leafEntity) {
            throw new Error(
                `FactorCompiler: related entity ${mre.RelatedEntityID} not found in metadata.`,
            );
        }
        return { leafEntity, relationshipPath: mre.RelationshipPath };
    }

    /**
     * Resolve how the leaf reaches the anchor, in priority order:
     *   1. explicit `RelationshipPath` (the disambiguation override) → walk it;
     *   2. else a single direct FK leaf→anchor → single-hop (unchanged);
     *   3. else **auto-resolve** by BFS from the anchor (findAutoPathHops) → multi-hop.
     * The walk emits a JOIN per hop until the last entity is anchor-adjacent. Every hop is
     * many-to-one toward the anchor, so the aggregate never fans out.
     */
    private resolveJoinPath(
        leafEntity: EntityInfo,
        relationshipPath: string | null,
        anchorEntityID: string,
    ): { joins: CompiledJoin[]; anchorKeyColumns: AnchorKeyColumn[] } {
        let hops = parseRelationshipPath(relationshipPath);
        // No explicit path + no direct FK to the anchor → try to discover the path automatically.
        if (
            hops.length === 0 &&
            leafEntity.Fields.filter((f) => f.RelatedEntityID === anchorEntityID).length === 0
        ) {
            hops = findAutoPathHops(
                new Metadata().Entities,
                anchorEntityID,
                leafEntity.ID,
            );
        }
        if (hops.length === 0) {
            return {
                joins: [],
                anchorKeyColumns: this.resolveAnchorKeyColumns(leafEntity, anchorEntityID),
            };
        }
        const md = new Metadata();
        const joins: CompiledJoin[] = [];
        let current = leafEntity;
        // Hop 1's FK lives on the leaf, referenced by its full table name; later hops reference
        // the previous join's alias.
        let leftQualifier = `[${leafEntity.SchemaName}].[${leafEntity.BaseTable}]`;

        hops.forEach((hop, i) => {
            const fkField = current.Fields.find(
                (f) => f.Name.toLowerCase() === hop.fk.toLowerCase() && f.RelatedEntityID,
            );
            if (!fkField?.RelatedEntityID) {
                throw new Error(
                    `FactorCompiler: RelationshipPath hop ${i} — '${hop.fk}' is not a foreign key on '${current.Name}'.`,
                );
            }
            const next = md.EntityByID(fkField.RelatedEntityID);
            if (!next) {
                throw new Error(
                    `FactorCompiler: RelationshipPath hop ${i} — target entity ${fkField.RelatedEntityID} not in metadata.`,
                );
            }
            const rightColumn = next.PrimaryKeys[0]?.Name;
            if (!rightColumn) {
                throw new Error(
                    `FactorCompiler: RelationshipPath hop ${i} — target '${next.Name}' has no primary key.`,
                );
            }
            const alias = `h${i + 1}`;
            joins.push({
                table: `[${next.SchemaName}].[${next.BaseTable}]`,
                alias,
                leftRef: `${leftQualifier}.[${fkField.Name}]`,
                rightColumn,
            });
            current = next;
            leftQualifier = alias;
        });

        // After the chain, `current` is the anchor-adjacent entity — it holds the FK to the anchor.
        return {
            joins,
            anchorKeyColumns: this.resolveAnchorKeyColumns(current, anchorEntityID),
        };
    }

    /**
     * The FK column(s) on the related table that point back to the anchor, resolved from MJ's
     * foreign-key metadata. Returns one entry per anchor primary-key column, ordered to match the
     * anchor PK (so it lines up with AnchorKey.values + the OPENJSON tuples):
     *   - single-column anchor → the one field whose RelatedEntityID is the anchor;
     *   - composite anchor → for each anchor PK column, the related field whose
     *     RelatedEntityFieldName references it (a multi-column FK).
     * Each column also carries its SQL type for the OPENJSON shred.
     */
    private resolveAnchorKeyColumns(
        relatedEntity: EntityInfo,
        anchorEntityID: string,
    ): AnchorKeyColumn[] {
        const anchor = new Metadata().EntityByID(anchorEntityID);
        if (!anchor) {
            throw new Error(`FactorCompiler: anchor entity ${anchorEntityID} not found in metadata.`);
        }
        const fksToAnchor = relatedEntity.Fields.filter(
            (f) => f.RelatedEntityID === anchorEntityID,
        );
        if (anchor.PrimaryKeys.length === 1) {
            if (fksToAnchor.length !== 1) {
                throw new Error(
                    `FactorCompiler: expected exactly one foreign key from '${relatedEntity.Name}' to the anchor entity, found ${fksToAnchor.length}.`,
                );
            }
            return [{ fkColumn: fksToAnchor[0].Name, sqlType: this.sqlTypeForField(fksToAnchor[0]) }];
        }
        // Composite anchor: match each anchor PK column to the related FK field that references it,
        // preserving anchor PK order so the JOIN tuple lines up with AnchorKey.values.
        return anchor.PrimaryKeys.map((pk) => {
            const fk = fksToAnchor.find(
                (f) => (f.RelatedEntityFieldName ?? "").toLowerCase() === pk.Name.toLowerCase(),
            );
            if (!fk) {
                throw new Error(
                    `FactorCompiler: '${relatedEntity.Name}' has no foreign-key column referencing anchor primary-key column '${pk.Name}' — a composite anchor needs a full multi-column FK.`,
                );
            }
            return { fkColumn: fk.Name, sqlType: this.sqlTypeForField(fk) };
        });
    }

    /**
     * SQL type for an FK column's OPENJSON WITH declaration. Keys are uniqueidentifier / int-family /
     * string in practice; fixed types pass through, variable-length string types use nvarchar(450)
     * (ample for any key, and the JOIN comparison is unaffected). Anything else → nvarchar(450).
     */
    private sqlTypeForField(field: { Type: string }): string {
        const t = (field.Type ?? "").toLowerCase();
        const passthrough = new Set([
            "uniqueidentifier", "int", "bigint", "smallint", "tinyint", "bit",
            "date", "datetime", "datetime2",
        ]);
        return passthrough.has(t) ? t : "nvarchar(450)";
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
