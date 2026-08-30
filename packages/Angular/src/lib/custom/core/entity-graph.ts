/**
 * Client-side FK-graph reachability for the factor-source picker.
 *
 * Mirrors (at a boolean level) the scoring engine's `findAutoPathHops` so the builder offers
 * exactly the sources a recompute can actually score: an entity is selectable when the engine can
 * auto-resolve a join path from it back to the anchor. The engine package is server-only (its
 * barrel pulls in SQLServerDataProvider), so it can't be imported into the browser bundle — hence
 * this small, deliberate mirror. Keep the two in sync; a future shared pure-graph util could DRY it.
 */

/** Minimal entity shape needed for reachability (MJ's EntityInfo satisfies it structurally).
 *  `Fields[].Name` is only needed by candidatePaths (to record the FK columns of each hop). */
export interface FkNode {
    ID: string;
    Fields: { Name: string; RelatedEntityID: string | null }[];
}

/** Max hops considered — matches the engine's MAX_AUTO_PATH_DEPTH. */
const MAX_PATH_DEPTH = 5;

/**
 * Compute, in ONE BFS, the set of entity IDs the engine can auto-resolve a join path to from
 * `anchorId` — i.e. reachable over reverse-FK (parent→child) edges within `maxDepth` hops by a
 * SINGLE shortest path. Membership in this set is exactly the picker's "scoreable source" test, so
 * callers build it once per anchor and `.has(id)` each candidate (O(V+E) once, not per-candidate).
 *
 * Matches the engine's success condition: unreachable → not in the set; ambiguous (≥2 shortest
 * paths, e.g. two FKs to the anchor) → not in the set, since the engine refuses those and the UI
 * can't author an explicit RelationshipPath yet. The anchor itself is never included.
 */
export function reachableFromAnchor(
    entities: FkNode[],
    anchorId: string,
    maxDepth: number = MAX_PATH_DEPTH,
): Set<string> {
    const counts = pathCountsFromAnchor(entities, anchorId, maxDepth);
    const reachable = new Set<string>();
    for (const [id, count] of counts) {
        if (id !== anchorId && count === 1) {
            reachable.add(id);
        }
    }
    return reachable;
}

/**
 * id → number of shortest reverse-FK paths from the anchor (absent = unreachable, 1 = a unique
 * route, ≥2 = AMBIGUOUS). One level-order BFS over the BUNDLED reverse-FK graph (a composite FK is
 * a single edge, so it never inflates the count into a false tie). `reachableFromAnchor` is the
 * `count === 1` slice of this; the source picker uses the full map to also surface — and flag —
 * the ambiguous (≥2) entities the user can disambiguate.
 */
export function pathCountsFromAnchor(
    entities: FkNode[],
    anchorId: string,
    maxDepth: number = MAX_PATH_DEPTH,
): Map<string, number> {
    // Bundled reverse-FK adjacency: parentID → child entity IDs (FK fields on a child that point at
    // the same parent collapse to ONE edge, matching candidatePaths / the engine).
    const childrenOf = new Map<string, string[]>();
    for (const e of entities) {
        const parents = new Set<string>();
        for (const f of e.Fields) {
            if (f.RelatedEntityID) parents.add(f.RelatedEntityID);
        }
        for (const parentID of parents) {
            const list = childrenOf.get(parentID) ?? [];
            list.push(e.ID);
            childrenOf.set(parentID, list);
        }
    }

    const dist = new Map<string, number>([[anchorId, 0]]);
    const pathCount = new Map<string, number>([[anchorId, 1]]);
    const queue: string[] = [anchorId];
    while (queue.length) {
        const cur = queue.shift() as string;
        const d = dist.get(cur) as number;
        if (d >= maxDepth) {
            continue;
        }
        for (const child of childrenOf.get(cur) ?? []) {
            if (!dist.has(child)) {
                dist.set(child, d + 1);
                pathCount.set(child, pathCount.get(cur) as number);
                queue.push(child);
            } else if (dist.get(child) === d + 1) {
                pathCount.set(
                    child,
                    (pathCount.get(child) as number) + (pathCount.get(cur) as number),
                );
            }
        }
    }
    return pathCount;
}

/** One hop of a resolved route: follow `fks` (the FK column bundle — ≥1 for a composite FK) on
 *  `fromEntityId` to `toEntityId` (one step toward the anchor). */
export interface PathHop {
    fromEntityId: string;
    toEntityId: string;
    fks: string[];
}

/** A full candidate route from a leaf entity to the anchor, ordered leaf → anchor. */
export interface CandidatePath {
    hops: PathHop[];
}

/** Cap on enumerated routes — guards a pathological graph from exploding the reconstruction. */
const MAX_CANDIDATE_PATHS = 12;

/**
 * Enumerate ALL shortest FK routes from `leafId` back to `anchorId` (leaf → anchor), over the same
 * bundled reverse-FK graph as {@link reachableFromAnchor} (a composite FK = one bundled hop). Returns:
 *   - `[]`        → unreachable;
 *   - one path    → the route is unique (no tie — auto-resolves, no UI needed);
 *   - ≥2 paths    → AMBIGUOUS: the routes the builder offers the user to pick from.
 * Where reachableFromAnchor only *counts* shortest paths, this keeps every shortest-distance
 * predecessor so it can reconstruct each actual route.
 */
export function candidatePaths(
    entities: FkNode[],
    anchorId: string,
    leafId: string,
    maxDepth: number = MAX_PATH_DEPTH,
): CandidatePath[] {
    // Bundled reverse-FK adjacency: parentID → [{ childID, fks }]. FK fields on a child that point at
    // the same parent are grouped into one bundled edge (so a composite FK is a single hop).
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

    // BFS from the anchor, recording ALL shortest-distance predecessors of each node.
    const dist = new Map<string, number>([[anchorId, 0]]);
    const preds = new Map<string, { parentID: string; fks: string[] }[]>();
    const queue: string[] = [anchorId];
    while (queue.length) {
        const cur = queue.shift() as string;
        const d = dist.get(cur) as number;
        if (d >= maxDepth) continue;
        for (const edge of childrenOf.get(cur) ?? []) {
            const nd = d + 1;
            if (!dist.has(edge.childID)) {
                dist.set(edge.childID, nd);
                preds.set(edge.childID, [{ parentID: cur, fks: edge.fks }]);
                queue.push(edge.childID);
            } else if (dist.get(edge.childID) === nd) {
                (preds.get(edge.childID) as { parentID: string; fks: string[] }[]).push({
                    parentID: cur,
                    fks: edge.fks,
                });
            }
        }
    }
    if (!dist.has(leafId)) return [];

    // Reconstruct every shortest route leaf → anchor, branching at each node with multiple predecessors.
    const paths: CandidatePath[] = [];
    const walk = (node: string, acc: PathHop[]): void => {
        if (paths.length >= MAX_CANDIDATE_PATHS) return;
        if (node === anchorId) {
            paths.push({ hops: acc.slice() });
            return;
        }
        for (const p of preds.get(node) ?? []) {
            acc.push({ fromEntityId: node, toEntityId: p.parentID, fks: p.fks });
            walk(p.parentID, acc);
            acc.pop();
        }
    };
    walk(leafId, []);
    return paths;
}

/**
 * Serialize a candidate route to the engine's `RelationshipPath` JSON (leaf → anchor hops, EXCLUDING
 * the final anchor-adjacent → anchor hop — the engine resolves that one itself via the anchor key).
 * Returns "" for a direct single-hop route (no path needed). Shape matches parseRelationshipPath:
 * `[{ "fks": ["A","B"] }, …]`.
 */
export function toRelationshipPath(path: CandidatePath): string {
    const leafHops = path.hops.slice(0, -1).map((h) => ({ fks: h.fks }));
    return leafHops.length ? JSON.stringify(leafHops) : "";
}

/** Render a candidate path as an anchor → … → leaf chain (e.g. "Members → Enrollments → Events"),
 *  using the supplied id→name mapper. Shared by the source tie-pickers (model builder + factor builder)
 *  so a route reads the same everywhere. */
export function describePath(path: CandidatePath, nameOf: (id: string) => string): string {
    if (path.hops.length === 0) return "";
    const leafToAnchor = [path.hops[0].fromEntityId, ...path.hops.map((h) => h.toEntityId)];
    return leafToAnchor.reverse().map(nameOf).join(" → ");
}
