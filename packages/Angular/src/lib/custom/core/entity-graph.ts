/**
 * Client-side FK-graph reachability for the factor-source picker.
 *
 * Mirrors (at a boolean level) the scoring engine's `findAutoPathHops` so the builder offers
 * exactly the sources a recompute can actually score: an entity is selectable when the engine can
 * auto-resolve a join path from it back to the anchor. The engine package is server-only (its
 * barrel pulls in SQLServerDataProvider), so it can't be imported into the browser bundle — hence
 * this small, deliberate mirror. Keep the two in sync; a future shared pure-graph util could DRY it.
 */

/** Minimal entity shape needed for reachability (MJ's EntityInfo satisfies it structurally). */
export interface FkNode {
    ID: string;
    Fields: { RelatedEntityID: string | null }[];
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
    // Reverse-FK adjacency: parentID → child entity IDs (an FK on a child pointing to a parent
    // is the outward parent→child edge).
    const childrenOf = new Map<string, string[]>();
    for (const e of entities) {
        for (const f of e.Fields) {
            if (!f.RelatedEntityID) {
                continue;
            }
            const list = childrenOf.get(f.RelatedEntityID) ?? [];
            list.push(e.ID);
            childrenOf.set(f.RelatedEntityID, list);
        }
    }

    // Level-order BFS from the anchor, counting shortest paths (so we can reject ambiguity).
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

    const reachable = new Set<string>();
    for (const [id, count] of pathCount) {
        if (id !== anchorId && count === 1) {
            reachable.add(id);
        }
    }
    return reachable;
}
