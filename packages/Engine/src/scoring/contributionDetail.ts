/**
 * The typed shape persisted in ScoreFactorContribution.DetailJSON, with the single (de)serializer
 * for it. Previously the explanation was JSON.stringify'd inline in ScoreWriter and re-parsed by
 * free-hand code in the UI — a format drift between those two ends silently broke explainability.
 * Both ends should go through these so the on-disk contract has ONE definition.
 */
export interface ContributionDetail {
    /** The factor's human "why" for this anchor (LLM reason, or a declarative window/aggregation summary). */
    explanation?: string;
}

/** Encode a contribution's detail for DetailJSON. Returns null when there's nothing to store
 *  (so the column stays NULL rather than holding an empty `{}`). */
export function encodeContributionDetail(explanation: string | null | undefined): string | null {
    if (!explanation) return null;
    const detail: ContributionDetail = { explanation };
    return JSON.stringify(detail);
}

/** Decode DetailJSON back to the explanation string; null when absent or malformed. */
export function decodeContributionDetail(detailJSON: string | null | undefined): string | null {
    if (!detailJSON) return null;
    try {
        const parsed: ContributionDetail = JSON.parse(detailJSON);
        return typeof parsed?.explanation === "string" && parsed.explanation.length > 0 ? parsed.explanation : null;
    } catch {
        return null;
    }
}
