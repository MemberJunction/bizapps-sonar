import { Metadata, UserInfo, EntityInfo, EntityFieldInfo } from "@memberjunction/core";
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
 * Scope: Declarative + Action-backed factors; Count/Sum/Avg/Min/Max/DistinctCount/Exists/Recency
 * aggregations; single- AND multi-hop related entities (explicit RelationshipPath or auto-resolved
 * by reverse-FK BFS), including **composite (multi-column) foreign keys** at every hop and a
 * composite anchor key; Rolling/Calendar/SinceEvent/RenewalRelative windows (or none). Anything
 * outside that throws a clear error rather than silently emitting wrong SQL — we widen deliberately.
 */
/** One hop of a `ModelRelatedEntity.RelationshipPath`: the FK column(s) to follow toward the anchor.
 *  A single-column FK names one; a COMPOSITE FK names all its columns. `entity` (the join target's
 *  name) is optional/informational — the target + its full column bundle are derived from FK metadata. */
export interface RelationshipHop {
    fks: string[];
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
        // Accept single-column `fk: "X"` (back-compat) OR composite `fks: ["A","B"]`. The compiler
        // re-derives the full bundle from FK metadata, so only one column per hop is strictly needed
        // to identify the target — but a composite FK may name all of them.
        const fks = Array.isArray(rec.fks)
            ? rec.fks.filter((v): v is string => typeof v === "string" && v.length > 0)
            : typeof rec.fk === "string" && rec.fk.length > 0
              ? [rec.fk]
              : [];
        if (fks.length === 0) {
            throw new Error(
                `FactorCompiler: RelationshipPath hop ${i} needs a non-empty string 'fk' (or 'fks' array).`,
            );
        }
        return {
            fks,
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
    // Reverse-FK adjacency: parentID → [{ childID, fks }]. An FK on child C pointing to parent P is
    // the outward edge P → C (traversing it is one-to-many; the return C → P is many-to-one). A
    // COMPOSITE FK is several fields on C all pointing at P — we group them into ONE bundled edge so
    // it's a single arrow (not parallel arrows that read as a false fork / ambiguity).
    const childrenOf = new Map<string, { childID: string; fks: string[] }[]>();
    for (const e of entities) {
        const fksByParent = new Map<string, string[]>();
        for (const f of e.Fields) {
            if (!f.RelatedEntityID) continue;
            const list = fksByParent.get(f.RelatedEntityID) ?? [];
            list.push(f.Name);
            fksByParent.set(f.RelatedEntityID, list);
        }
        for (const [parentID, fks] of fksByParent) {
            const list = childrenOf.get(parentID) ?? [];
            list.push({ childID: e.ID, fks });
            childrenOf.set(parentID, list);
        }
    }

    // Level-order BFS from the anchor; track distance, count of shortest paths (for ambiguity),
    // and one predecessor edge (valid to follow because the path is unique when pathCount === 1).
    const dist = new Map<string, number>([[anchorEntityID, 0]]);
    const pathCount = new Map<string, number>([[anchorEntityID, 1]]);
    const pred = new Map<string, { fromID: string; fks: string[] }>();
    const queue: string[] = [anchorEntityID];
    while (queue.length) {
        const cur = queue.shift() as string;
        const d = dist.get(cur) as number;
        if (d >= maxDepth) continue;
        for (const edge of childrenOf.get(cur) ?? []) {
            if (!dist.has(edge.childID)) {
                dist.set(edge.childID, d + 1);
                pathCount.set(edge.childID, pathCount.get(cur) as number);
                pred.set(edge.childID, { fromID: cur, fks: edge.fks });
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
    const anchorToLeafFks: string[][] = [];
    let node = leafEntityID;
    while (node !== anchorEntityID) {
        const step = pred.get(node) as { fromID: string; fks: string[] };
        anchorToLeafFks.unshift(step.fks);
        node = step.fromID;
    }
    return anchorToLeafFks
        .slice(1)
        .reverse()
        .map((fks) => ({ fks }));
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
        // Per-anchor windows read a boundary date off the anchor row via a single-column anchor join;
        // a composite anchor would need a multi-column anchor join too. Not wired yet — fail loud
        // rather than emit a query that joins on only the first key column.
        if (windowNeedsAnchorJoin(window) && anchorKeyColumns.length > 1) {
            throw new Error(
                `FactorCompiler: per-anchor windows (SinceEvent/RenewalRelative) are not supported for ` +
                    `composite-key anchors yet (factor ${factor.ID}).`,
            );
        }

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
            // Identify the hop's target from the first named FK column; the FULL column bundle
            // (single or composite) is derived from FK metadata by resolveFkPairs.
            const fkField = current.Fields.find(
                (f) => f.Name.toLowerCase() === hop.fks[0].toLowerCase() && f.RelatedEntityID,
            );
            if (!fkField?.RelatedEntityID) {
                throw new Error(
                    `FactorCompiler: RelationshipPath hop ${i} — '${hop.fks[0]}' is not a foreign key on '${current.Name}'.`,
                );
            }
            const next = md.EntityByID(fkField.RelatedEntityID);
            if (!next) {
                throw new Error(
                    `FactorCompiler: RelationshipPath hop ${i} — target entity ${fkField.RelatedEntityID} not in metadata.`,
                );
            }
            const alias = `h${i + 1}`;
            const qualifier = leftQualifier;
            joins.push({
                table: `[${next.SchemaName}].[${next.BaseTable}]`,
                alias,
                on: this.resolveFkPairs(current, next).map((p) => ({
                    leftRef: `${qualifier}.[${p.fkColumn}]`,
                    rightColumn: p.pkColumn,
                })),
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
        // The anchor-adjacent → anchor FK bundle, surfaced as OPENJSON shred columns (with SQL types).
        return this.resolveFkPairs(relatedEntity, anchor).map((p) => ({
            fkColumn: p.fkColumn,
            sqlType: this.sqlTypeForField(p.field),
        }));
    }

    /**
     * The FK→PK column-pairs from `fromEntity` to `toEntity`, ordered by `toEntity`'s primary key —
     * the "bundle" on the child→parent arrow. Single-column FK → one pair; COMPOSITE → one per target
     * PK column, each matched to the FK field whose `RelatedEntityFieldName` references it. Throws if
     * the relationship is missing, or incomplete/ambiguous for a composite key (every PK column needs
     * exactly one referencing FK column). Shared by every hop AND the leaf→anchor resolution so the
     * matching rule is identical everywhere.
     */
    private resolveFkPairs(
        fromEntity: EntityInfo,
        toEntity: EntityInfo,
    ): { fkColumn: string; pkColumn: string; field: EntityFieldInfo }[] {
        const fks = fromEntity.Fields.filter((f) => f.RelatedEntityID === toEntity.ID);
        if (toEntity.PrimaryKeys.length === 1) {
            if (fks.length !== 1) {
                throw new Error(
                    `FactorCompiler: expected exactly one foreign key from '${fromEntity.Name}' to '${toEntity.Name}', found ${fks.length}.`,
                );
            }
            return [{ fkColumn: fks[0].Name, pkColumn: toEntity.PrimaryKeys[0].Name, field: fks[0] }];
        }
        return toEntity.PrimaryKeys.map((pk) => {
            const matches = fks.filter(
                (f) => (f.RelatedEntityFieldName ?? "").toLowerCase() === pk.Name.toLowerCase(),
            );
            if (matches.length !== 1) {
                throw new Error(
                    `FactorCompiler: '${fromEntity.Name}' must have exactly one foreign-key column referencing ` +
                        `'${toEntity.Name}' primary-key column '${pk.Name}' (found ${matches.length}) — a composite ` +
                        `relationship needs a complete, unambiguous multi-column foreign key.`,
                );
            }
            return { fkColumn: matches[0].Name, pkColumn: pk.Name, field: matches[0] };
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
        switch (tw.WindowType) {
            case "Rolling": {
                if (tw.LengthDays == null && tw.LengthMonths == null) {
                    throw new Error(`FactorCompiler: Rolling window ${tw.ID} needs LengthDays or LengthMonths.`);
                }
                const dateColumn = this.resolveRelatedDateColumn(factor, tw, validColumns);
                if (!dateColumn) return null; // no related date column → no time bound (don't mis-filter)
                return { kind: "Rolling", dateColumn, lengthDays: tw.LengthDays, lengthMonths: tw.LengthMonths };
            }
            case "Calendar": {
                const dateColumn = this.resolveRelatedDateColumn(factor, tw, validColumns);
                if (!dateColumn) return null;
                return { kind: "Calendar", dateColumn, period: this.calendarPeriod(tw) };
            }
            case "SinceEvent":
            case "RenewalRelative": {
                // Per-anchor windows need BOTH dates: the related activity date (Factor.DateField) and
                // the anchor boundary date (TimeWindow.AnchorDateField, its true §5.2 meaning).
                const dateColumn = this.requireFactorDateField(factor, validColumns);
                const anchorDateColumn = this.requireAnchorDateColumn(tw, factor.AnchorEntityID);
                return { kind: tw.WindowType, dateColumn, anchorDateColumn, offsetDays: tw.OffsetDays ?? 0 };
            }
            default:
                throw new Error(`FactorCompiler: unsupported window type '${tw.WindowType}'.`);
        }
    }

    /** The related activity-date column for Rolling/Calendar windows: Factor.DateField, falling back
     *  to TimeWindow.AnchorDateField for pre-DateField config (back-compat). Validated against the
     *  related entity's columns (typo / injection guard). Null when neither is set → no time bound. */
    private resolveRelatedDateColumn(
        factor: mjBizAppsSonarFactorEntity,
        tw: mjBizAppsSonarTimeWindowEntity,
        validColumns: string[],
    ): string | null {
        const field = factor.DateField ?? tw.AnchorDateField;
        return field ? this.requireColumn(field, validColumns, "related entity") : null;
    }

    /** Factor.DateField, required (per-anchor windows can't fall back to AnchorDateField — that names
     *  the anchor boundary here). Validated against the related entity's columns. */
    private requireFactorDateField(factor: mjBizAppsSonarFactorEntity, validColumns: string[]): string {
        if (!factor.DateField) {
            throw new Error(
                `FactorCompiler: factor ${factor.ID} uses a per-anchor window but has no DateField (the related activity-date column).`,
            );
        }
        return this.requireColumn(factor.DateField, validColumns, "related entity");
    }

    /** TimeWindow.AnchorDateField (the anchor boundary date for SinceEvent/RenewalRelative), required,
     *  validated against the ANCHOR entity's columns. */
    private requireAnchorDateColumn(tw: mjBizAppsSonarTimeWindowEntity, anchorEntityID: string): string {
        if (!tw.AnchorDateField) {
            throw new Error(
                `FactorCompiler: '${tw.WindowType}' window ${tw.ID} needs AnchorDateField (the anchor boundary date column).`,
            );
        }
        const anchor = new Metadata().EntityByID(anchorEntityID);
        if (!anchor) {
            throw new Error(`FactorCompiler: anchor entity ${anchorEntityID} not found in metadata.`);
        }
        return this.requireColumn(tw.AnchorDateField, anchor.Fields.map((f) => f.Name), "anchor entity");
    }

    /** Resolve a config-supplied column name against a real column set (case-insensitive), or throw. */
    private requireColumn(field: string, validColumns: string[], where: string): string {
        const match = validColumns.find((c) => c.toLowerCase() === field.toLowerCase());
        if (!match) {
            throw new Error(`FactorCompiler: date field '${field}' is not a column on the ${where}.`);
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
