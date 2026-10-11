import { RelatedExistsDescriptor, ResolvedRelatedSource } from "./filter";

/** The slice of entity metadata the resolver needs (EntityInfo satisfies it structurally). */
export interface RelatedExistsEntity {
    ID: string;
    Name: string;
    SchemaName: string;
    BaseTable: string;
    PrimaryKeys: { Name: string }[];
    Fields: { Name: string; RelatedEntityID: string | null; IsVirtual: boolean }[];
}

/**
 * Resolve a population filter's related-exists leaf against metadata: which table holds the related
 * rows, and which single foreign key ties them to the anchor.
 *
 * The FK rule is the one a factor's leaf follows (FactorCompiler.resolveFkPairs): the related entity
 * must reach the anchor through EXACTLY ONE foreign key, so "has a related record" can't silently
 * mean "is the BillTo OR the ShipTo person". `foreignKey` disambiguates when there are several; it
 * must name one of those FKs. Composite-key anchors are rejected (one key column is compared).
 *
 * Valid nested-filter columns are the related entity's NON-virtual fields — the subquery reads the
 * base table, where a view-only column does not exist.
 *
 * Pure (entities are passed in), so the rules are unit-testable without a database.
 */
export function resolveRelatedExistsSource(
    anchor: RelatedExistsEntity,
    related: RelatedExistsEntity | undefined,
    node: RelatedExistsDescriptor,
): ResolvedRelatedSource {
    if (!related) {
        throw new Error(`Population filter: related entity '${node.relatedEntity}' was not found in metadata.`);
    }
    if (anchor.PrimaryKeys.length !== 1) {
        throw new Error(
            `Population filter: related-record conditions need a single-column anchor key; '${anchor.Name}' has ${anchor.PrimaryKeys.length}.`,
        );
    }
    return {
        table: `[${related.SchemaName}].[${related.BaseTable}]`,
        fkColumn: pickForeignKey(anchor, related, node.foreignKey),
        anchorKeyColumn: anchor.PrimaryKeys[0].Name,
        validColumns: related.Fields.filter((f) => !f.IsVirtual).map((f) => f.Name),
    };
}

/** The one FK from `related` to `anchor` — the named one, or the only one. Throws otherwise. */
function pickForeignKey(anchor: RelatedExistsEntity, related: RelatedExistsEntity, named: string | undefined): string {
    const fks = related.Fields.filter((f) => f.RelatedEntityID === anchor.ID && !f.IsVirtual);
    if (named) {
        const match = fks.find((f) => f.Name.toLowerCase() === named.toLowerCase());
        if (!match) {
            throw new Error(
                `Population filter: '${named}' is not a foreign key from '${related.Name}' to '${anchor.Name}'` +
                    (fks.length ? ` (its foreign keys to it: ${fks.map((f) => f.Name).join(", ")}).` : " (it has none)."),
            );
        }
        return match.Name;
    }
    if (fks.length !== 1) {
        throw new Error(
            `Population filter: expected exactly one foreign key from '${related.Name}' to '${anchor.Name}', found ${fks.length}` +
                (fks.length > 1 ? ` (${fks.map((f) => f.Name).join(", ")}) — set 'foreignKey' to choose one.` : "."),
        );
    }
    return fks[0].Name;
}
