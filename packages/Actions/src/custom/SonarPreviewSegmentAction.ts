import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { SegmentEvaluator, SegmentFilter, needsTrajectory } from "@mj-biz-apps/sonar-engine";

/** How many members one page of a preview returns (the UI pages; the count is always the full cohort). */
const DEFAULT_PAGE_SIZE = 50;
/** Hard ceiling so a caller can't ask for the whole population in one response. */
const MAX_PAGE_SIZE = 500;

/**
 * Sonar: Preview Segment — resolve a targeting rule through the REAL engine and return the cohort
 * count plus one page of members, without writing or firing anything.
 *
 * Why this exists: the Engagement Manager used to re-implement the segment rule in client-side SQL
 * (`score-read.service.moverMembers`, whose own comment promised it "mirrors the engine's
 * SegmentEvaluator conditions EXACTLY"). Two copies of a selection rule is a bug waiting to happen,
 * and it became impossible the moment rules grew TRAJECTORY bounds: slope, sustained-decline runs
 * and volatility are computed from ScoreHistory in the engine, not expressible as a single Score
 * query. Routing preview through here restores the property that matters — the list an operator
 * looks at is resolved by the same code that will pick who gets treated.
 *
 * Read-only: no Segment, Intervention, or Assignment rows are created (unlike
 * `Sonar: Run Intervention` with preview:true, which find-or-creates its segment as a side effect).
 *
 * Input params:  ModelID (req), FilterJSON (req — a SegmentFilter), Page?, PageSize?
 * Output param:  Result (JSON: { total, page, pageSize, usedTrajectory, members: [...] })
 */
@RegisterClass(BaseAction, "SonarPreviewSegment")
export class SonarPreviewSegmentAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const modelId = this.getInput(params, "ModelID");
        if (!modelId || !this.isGuid(modelId)) {
            return this.fail(params, "VALIDATION_ERROR", "ModelID is required and must be a GUID.");
        }
        const filter = this.parseJsonParam<SegmentFilter>(params, "FilterJSON");
        if (!filter || typeof filter !== "object" || Array.isArray(filter)) {
            return this.fail(params, "VALIDATION_ERROR", "FilterJSON is required and must be a JSON object (a SegmentFilter).");
        }

        const page = Math.max(0, this.intInput(params, "Page") ?? 0);
        const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, this.intInput(params, "PageSize") ?? DEFAULT_PAGE_SIZE));

        try {
            // resolve() returns the whole cohort (that's what an intervention acts on); we page the
            // response so a 2,000-member rule doesn't ship 2,000 rows to a preview panel.
            const cohort = await new SegmentEvaluator().resolve(modelId, filter, params.ContextUser);
            // Sorting happens HERE, not in the evaluator: the evaluator's worst-score-first order is
            // also the cap policy for a real run (which members get treated when a run is capped),
            // and a display preference must not quietly change who gets picked.
            this.sortCohort(cohort, this.getInput(params, "OrderBy"));
            const slice = cohort.slice(page * pageSize, page * pageSize + pageSize);
            const payload = {
                total: cohort.length,
                page,
                pageSize,
                usedTrajectory: needsTrajectory(filter),
                members: slice.map((m) => ({
                    scoreId: m.scoreId,
                    anchorRecordId: m.anchorRecordId,
                    anchorRecordKeyJSON: m.anchorRecordKeyJSON,
                    normalizedScore: m.normalizedScore,
                    bandId: m.bandId,
                    delta: m.delta,
                    // Present only for trajectory rules — the auditable "why this member".
                    shape: m.shape ?? null,
                })),
            };
            return this.ok(params, `${cohort.length} member(s) match this rule.`, payload);
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    /**
     * Order the resolved cohort for DISPLAY. 'BiggestDrop'/'BiggestGain' sort by the last-run delta
     * (a "Score Movers" reading, where the point is who moved most); anything else keeps the
     * evaluator's worst-score-first order. Members with no delta sort last either way — an unknown
     * move is not a big one.
     */
    private sortCohort(cohort: { normalizedScore: number | null; delta: number | null }[], orderBy: string | null): void {
        if (orderBy !== "BiggestDrop" && orderBy !== "BiggestGain") return;
        const dir = orderBy === "BiggestGain" ? -1 : 1;
        cohort.sort((a, b) => {
            if (a.delta === null && b.delta === null) return 0;
            if (a.delta === null) return 1;
            if (b.delta === null) return -1;
            return (a.delta - b.delta) * dir;
        });
    }

    /** Read an optional integer param; null when absent or not a finite number. */
    private intInput(params: RunActionParams, name: string): number | null {
        const raw = this.getInput(params, name);
        if (raw === null) return null;
        const n = Number(raw);
        return Number.isFinite(n) ? Math.floor(n) : null;
    }
}
