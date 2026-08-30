/**
 * Which anchors have LEFT a model's population this run?
 *
 * The retired set-based ScoreWriter handled this inside its MERGE
 * (`WHEN NOT MATCHED BY SOURCE AND t.ScoreModelID = @modelId THEN DELETE`, see dc7ce074): an anchor
 * with a Score row but absent from the freshly-resolved population — a member who no longer matches
 * a narrowed PopulationFilter, or genuinely departed — had its row deleted, or the triage list kept
 * serving it forever. The per-record RSP persister upserts only what the run scored, so without this
 * step those rows silently survive.
 *
 * Absence is a real exit, not an error artifact: resolvePopulation THROWS on a failed population
 * query rather than returning a subset, and the empty-population case never reaches here
 * (`ScorePersister.write` clears the model up front when `scores.size === 0`).
 *
 * Pure and separately tested, like `planContributions` — the persister supplies the key sets and
 * owns the FK-ordered deletes (contributions first; theirs is the only FK onto Score and it is
 * NO_ACTION).
 */
export function selectDepartedAnchors(existingAnchorIds: Iterable<string>, scoredAnchorIds: ReadonlySet<string>): string[] {
    const departed: string[] = [];
    for (const anchorId of existingAnchorIds) {
        if (!scoredAnchorIds.has(anchorId)) departed.push(anchorId);
    }
    return departed;
}
