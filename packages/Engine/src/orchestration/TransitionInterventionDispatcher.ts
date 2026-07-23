import { LogError, LogStatus, Metadata, RunView, UserInfo } from "@memberjunction/core";
import { mjBizAppsSonarScoreBandTransitionEntity } from "@mj-biz-apps/sonar-entities";
import { SegmentFilter } from "./SegmentEvaluator";
import { InterventionRunner, InterventionRunResult } from "./InterventionRunner";
import { createInterventionInvoker } from "./interventionInvoker";

const TRANSITION_ENTITY = "MJ_BizApps_Sonar: Score Band Transitions";
const SEGMENT_ENTITY = "MJ_BizApps_Sonar: Score Segments";
const INTERVENTION_ENTITY = "MJ_BizApps_Sonar: Interventions";

/** Per-run safety bound on how many entrants one OnEnterSegment intervention may assign — a
 *  recompute that flips a huge cohort shouldn't silently fan out thousands of Action calls. */
const ON_ENTER_CAP = 200;

/** One Active OnEnterSegment intervention + the segment it watches (denormalized for the dispatch). */
interface WatchingIntervention {
    interventionId: string;
    name: string;
    holdoutPercent: number;
    actionId: string;
    /** The play's configured params (from Intervention.ActionParamsJSON) — `{{member}}` tokens are
     *  filled per fire by the runner. Empty = fire with no params. */
    actionParams: { name: string; value: string }[];
    segmentFilter: SegmentFilter;
    segmentBandId: string | null;
    /** True when the segment is a delta rule (dropped/gained N since the last run) — these fire on
     *  CURRENT membership each recompute (delta is per-run state), not on band transitions. */
    isDeltaRule: boolean;
}

/** What one dispatch did — surfaced to the run log, never thrown. */
export interface TransitionDispatchSummary {
    transitions: number;
    interventionsMatched: number;
    assigned: number;
    sent: number;
    failed: number;
}

/**
 * The post-recompute consumer of ScoreBandTransition (plan §5.6): after a persisted run writes its
 * transitions, this dispatcher fires every Active `OnEnterSegment` intervention whose segment the
 * transitioning member just ENTERED, then marks those transitions Handled.
 *
 * Trigger semantics:
 * - BAND segments: "entering" keys off this run's transitions — a transition matches when `ToBandID`
 *   equals the segment filter's `bandId`. Entrants still resolve THROUGH the segment
 *   (InterventionRunner.onlyAnchorIds), so a member whose score doesn't satisfy the full filter can
 *   never be fired. Transitions are marked Handled only when at least one band watcher exists — an
 *   unconfigured deployment keeps rows queued for later consumers (e.g. write-back).
 * - DELTA segments ("dropped N+ since the last run"): the delta IS per-run state, so these fire on
 *   the segment's CURRENT membership after every recompute — no transition row needed. Per-member
 *   idempotency keeps anyone from being fired twice by the same intervention across runs.
 * - Segments with neither a band nor a delta rule are skipped (logged) — a pure score range has no
 *   "entered" edge to key off.
 * - The fired Action gets the intervention's persisted params (ActionParamsJSON, `{{member}}` token
 *   filled per fire); null/malformed params → fire param-less.
 * - Failures NEVER propagate: the scoring run already succeeded; a broken intervention is logged and
 *   band transitions stay unhandled for a retry on the next run.
 */
export class TransitionInterventionDispatcher {
    public async dispatch(
        modelId: string,
        recomputeRunId: string,
        contextUser: UserInfo,
    ): Promise<TransitionDispatchSummary> {
        const summary: TransitionDispatchSummary = { transitions: 0, interventionsMatched: 0, assigned: 0, sent: 0, failed: 0 };
        try {
            const watchers = await this.loadWatchers(modelId, contextUser);
            if (watchers.length === 0) return summary; // nothing configured — leave transitions queued

            const bandWatchers = watchers.filter((w) => w.segmentBandId);
            const deltaWatchers = watchers.filter((w) => !w.segmentBandId && w.isDeltaRule);
            const runner = new InterventionRunner(createInterventionInvoker());

            // Band watchers key off this run's transitions (the crisp "entered the band" event).
            if (bandWatchers.length > 0) {
                const transitions = await this.loadUnhandledTransitions(modelId, recomputeRunId, contextUser);
                summary.transitions = transitions.length;
                for (const w of bandWatchers) {
                    const entrants = new Set(transitions.filter((t) => t.ToBandID === w.segmentBandId).map((t) => t.AnchorRecordID));
                    if (entrants.size === 0) continue;
                    summary.interventionsMatched++;
                    this.tally(summary, await this.fireForEntrants(runner, modelId, w, entrants, contextUser));
                }
                await this.markHandled(transitions, contextUser);
            }

            // Delta watchers fire on CURRENT membership each recompute — the delta IS this run's
            // state, so the segment filter itself selects the entrants. Per-member idempotency in
            // the runner keeps a member from being re-fired on later runs.
            for (const w of deltaWatchers) {
                summary.interventionsMatched++;
                this.tally(summary, await this.fireForEntrants(runner, modelId, w, null, contextUser));
            }

            const skipped = watchers.length - bandWatchers.length - deltaWatchers.length;
            if (skipped > 0) {
                LogStatus(`Sonar: ${skipped} OnEnterSegment intervention(s) watch segments with neither a band nor a delta rule — skipped.`);
            }
            if (summary.interventionsMatched > 0) {
                LogStatus(
                    `Sonar: OnEnterSegment dispatch — ${summary.transitions} transition(s), ` +
                        `${summary.interventionsMatched} intervention(s) matched, ${summary.assigned} assigned, ` +
                        `${summary.sent} fired, ${summary.failed} failed.`,
                );
            }
        } catch (e: unknown) {
            // The recompute already succeeded — a dispatch failure is logged, never rethrown.
            LogError(`Sonar: OnEnterSegment dispatch failed (transitions left unhandled for retry): ${e instanceof Error ? e.message : String(e)}`);
        }
        return summary;
    }

    private tally(summary: TransitionDispatchSummary, result: InterventionRunResult): void {
        // An un-approved play fires nothing autonomously (the runner's gate). Surface it, don't fail.
        if (!result.playApproved) {
            LogStatus(`Sonar: an OnEnterSegment play is not Approved — autonomous fire skipped (nothing written/fired).`);
            return;
        }
        summary.assigned += result.treated + result.held;
        summary.sent += result.sent;
        summary.failed += result.failed;
    }

    /** Active OnEnterSegment interventions watching this model's segments. */
    private async loadWatchers(modelId: string, contextUser: UserInfo): Promise<WatchingIntervention[]> {
        const rv = new RunView();
        const segs = await rv.RunView<{ ID: string; FilterExpression: string | null }>(
            { EntityName: SEGMENT_ENTITY, ExtraFilter: `ScoreModelID='${modelId}'`, Fields: ["ID", "FilterExpression"], ResultType: "simple" },
            contextUser,
        );
        const segments = segs.Success ? (segs.Results ?? []) : [];
        if (segments.length === 0) return [];
        const idList = segments.map((s) => `'${s.ID}'`).join(",");
        const ivs = await rv.RunView<{ ID: string; Name: string; ScoreSegmentID: string; ActionID: string; ControlGroupPercent: number | null; ActionParamsJSON: string | null }>(
            {
                EntityName: INTERVENTION_ENTITY,
                ExtraFilter: `ScoreSegmentID IN (${idList}) AND TriggerType='OnEnterSegment' AND Status='Active'`,
                Fields: ["ID", "Name", "ScoreSegmentID", "ActionID", "ControlGroupPercent", "ActionParamsJSON"],
                ResultType: "simple",
            },
            contextUser,
        );
        const bySegment = new Map(segments.map((s) => [s.ID, this.parseFilter(s.FilterExpression)]));
        return (ivs.Success ? (ivs.Results ?? []) : []).map((i) => {
            const filter = bySegment.get(i.ScoreSegmentID) ?? {};
            return {
                interventionId: i.ID,
                name: i.Name,
                holdoutPercent: i.ControlGroupPercent ?? 0,
                actionId: i.ActionID,
                actionParams: this.parseParams(i.ActionParamsJSON),
                segmentFilter: filter,
                segmentBandId: filter.bandId ?? null,
                isDeltaRule: filter.minDelta != null || filter.maxDelta != null,
            };
        });
    }

    /** Parse the intervention's stored [{name,value}] param list; malformed → fire param-less. */
    private parseParams(raw: string | null): { name: string; value: string }[] {
        if (!raw) return [];
        try {
            const parsed: unknown = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            return parsed
                .filter((p): p is { name: string; value: string } => !!p && typeof p === "object" && typeof (p as { name?: unknown }).name === "string")
                .map((p) => ({ name: p.name, value: String(p.value ?? "") }));
        } catch {
            return [];
        }
    }

    /** A segment's stored FilterExpression is the JSON SegmentFilter; unparseable → empty filter. */
    private parseFilter(raw: string | null): SegmentFilter {
        if (!raw) return {};
        try {
            const parsed: unknown = JSON.parse(raw);
            return parsed && typeof parsed === "object" ? (parsed as SegmentFilter) : {};
        } catch {
            return {};
        }
    }

    /** This run's unhandled band transitions (entity objects — we flip Handled on them after). */
    private async loadUnhandledTransitions(
        modelId: string,
        recomputeRunId: string,
        contextUser: UserInfo,
    ): Promise<mjBizAppsSonarScoreBandTransitionEntity[]> {
        const res = await new RunView().RunView<mjBizAppsSonarScoreBandTransitionEntity>(
            {
                EntityName: TRANSITION_ENTITY,
                ExtraFilter: `ScoreModelID='${modelId}' AND RecomputeRunID='${recomputeRunId}' AND Handled=0`,
                IgnoreMaxRows: true,
                ResultType: "entity_object",
            },
            contextUser,
        );
        return res.Success ? (res.Results ?? []) : [];
    }

    /** Fire one intervention — commit mode, capped. `entrants` targets a transition subset (band
     *  watchers); null lets the segment filter itself select this run's members (delta watchers). */
    private async fireForEntrants(
        runner: InterventionRunner,
        modelId: string,
        w: WatchingIntervention,
        entrants: ReadonlySet<string> | null,
        contextUser: UserInfo,
    ): Promise<InterventionRunResult> {
        return runner.run(
            {
                interventionId: w.interventionId,
                modelId,
                segmentFilter: w.segmentFilter,
                holdoutPercent: w.holdoutPercent,
                action: { actionId: w.actionId, params: w.actionParams },
                cap: ON_ENTER_CAP,
                preview: false,
                onlyAnchorIds: entrants ?? undefined,
            },
            contextUser,
        );
    }

    /** Flip Handled on the processed transitions (row-by-row via entities — transition counts per
     *  run are band-crossings only, not the population, so this stays small). */
    private async markHandled(
        transitions: mjBizAppsSonarScoreBandTransitionEntity[],
        contextUser: UserInfo,
    ): Promise<void> {
        const md = new Metadata();
        for (const t of transitions) {
            const row = await md.GetEntityObject<mjBizAppsSonarScoreBandTransitionEntity>(TRANSITION_ENTITY, contextUser);
            if (!(await row.Load(t.ID))) continue;
            row.Handled = true;
            await row.Save();
        }
    }
}
