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
    kind: "Action" | "TrackOnly" | "BulkSync";
    holdoutPercent: number;
    actionId: string | null;
    /** The play's configured params (from Intervention.ActionParamsJSON) — `{{member}}` tokens are
     *  filled per fire by the runner. Empty = fire with no params. */
    actionParams: { name: string; value: string }[];
    segmentFilter: SegmentFilter;
    segmentBandId: string | null;
    /** How this segment decides someone just "entered" it. See {@link triggerKindFor}. */
    trigger: SegmentTriggerKind;
}

/**
 * How a segment's "entered" edge is detected.
 *
 * - `band`     — keyed off this run's ScoreBandTransition rows (ToBandID matches the filter's band).
 * - `derived`  — the membership is RECOMPUTED from this run's scoring, so the filter itself selects the
 *                entrants and no transition row is needed. Fires on current membership each recompute;
 *                per-member idempotency in the runner stops anyone being fired twice.
 * - `none`     — nothing in the filter changes as a result of a run, so there is no entry event to fire on.
 */
export type SegmentTriggerKind = "band" | "derived" | "none";

/**
 * Classify a segment filter's trigger.
 *
 * ## Why this exists as a function
 *
 * It used to be an inline `isDeltaRule` boolean that tested ONLY `minDelta`/`maxDelta`. Every other
 * per-run rule therefore fell through to the "neither a band nor a delta rule" bucket and was skipped —
 * so a scheduled TRAJECTORY intervention ("losing 8 points a month", "sliding 3 cycles") matched nobody,
 * every run, and the log line called its segment unconfigured rather than unsupported. The rule was fine;
 * the dispatcher just had no branch for it.
 *
 * The distinction that actually matters is not delta-vs-trajectory, it is **whether a recompute can change
 * who is in the segment**. Delta, band-crossing, trajectory and reason are all recomputed from the run that
 * just finished, so "entering" is meaningful for all of them and they behave identically: resolve the
 * segment now, fire the newcomers, let idempotency handle the rest.
 *
 * A pure score range, a data-completeness gate or a member-attribute condition (`anchor`) is NOT recomputed
 * in that sense — a member's join date does not change because scoring ran — so those genuinely have no
 * entry edge and remain unsupported rather than silently mishandled.
 */
export function triggerKindFor(filter: SegmentFilter): SegmentTriggerKind {
    if (filter.bandId) return "band";

    // Per-run score state.
    if (filter.minDelta != null || filter.maxDelta != null) return "derived";
    if (filter.crossedBandOnly === true) return "derived";

    // Trajectory, read from ScoreHistory and re-fitted every run. `windowDays` and `minSnapshots` are
    // deliberately NOT here: a horizon and a minimum-data gate are qualifiers, not predicates — on their
    // own they select nobody in particular and would make every segment look like a trigger.
    if (
        filter.minSlopePer30Days != null ||
        filter.maxSlopePer30Days != null ||
        filter.minDeclineRun != null ||
        filter.minNetDrop != null ||
        filter.maxVolatility != null
    ) {
        return "derived";
    }

    // Why the member is low, re-derived from this run's factor contributions.
    if (filter.reason != null) return "derived";

    return "none";
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
 * - DERIVED segments — delta ("dropped N+ since the last run"), band-crossing, TRAJECTORY ("losing 8
 *   points a month", "sliding 3 cycles") and reason ("low on events"). All of these are recomputed from
 *   the run that just finished, so the filter itself selects the entrants and no transition row is
 *   needed; they fire on CURRENT membership after every recompute. Per-member idempotency keeps anyone
 *   from being fired twice by the same intervention across runs. See {@link triggerKindFor}.
 * - Segments whose membership a recompute cannot change — a pure score range, a completeness gate, or a
 *   member-attribute (`anchor`) condition — have no "entered" edge and are skipped, naming which ones.
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

            const bandWatchers = watchers.filter((w) => w.trigger === "band");
            const derivedWatchers = watchers.filter((w) => w.trigger === "derived");
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

            // Derived watchers (delta, band-crossing, trajectory, reason) fire on CURRENT membership each
            // recompute — the rule IS this run's state, so the segment filter itself selects the entrants.
            // Per-member idempotency in the runner keeps a member from being re-fired on later runs.
            for (const w of derivedWatchers) {
                summary.interventionsMatched++;
                this.tally(summary, await this.fireForEntrants(runner, modelId, w, null, contextUser));
            }

            // Name what was skipped and why. The old line reported only a count and described these as
            // segments with "neither a band nor a delta rule", which read as "you configured it wrong" —
            // and swept up every trajectory rule, whose configuration was perfectly good.
            const unsupported = watchers.filter((w) => w.trigger === "none");
            if (unsupported.length > 0) {
                LogStatus(
                    `Sonar: ${unsupported.length} OnEnterSegment intervention(s) skipped — a score range or ` +
                        `record-attribute rule has no "entered" edge to fire on, because a recompute does not ` +
                        `change who it matches: ${unsupported.map((w) => w.name).join(", ")}.`,
                );
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
        const ivs = await rv.RunView<{ ID: string; Name: string; ScoreSegmentID: string; Kind: string; ActionID: string | null; ControlGroupPercent: number | null; ActionParamsJSON: string | null }>(
            {
                EntityName: INTERVENTION_ENTITY,
                ExtraFilter: `ScoreSegmentID IN (${idList}) AND TriggerType='OnEnterSegment' AND Status='Active'`,
                Fields: ["ID", "Name", "ScoreSegmentID", "Kind", "ActionID", "ControlGroupPercent", "ActionParamsJSON"],
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
                kind: i.Kind === "TrackOnly" || i.Kind === "BulkSync" ? i.Kind : "Action",
                holdoutPercent: i.ControlGroupPercent ?? 0,
                actionId: i.ActionID,
                actionParams: this.parseParams(i.ActionParamsJSON),
                segmentFilter: filter,
                segmentBandId: filter.bandId ?? null,
                trigger: triggerKindFor(filter),
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
                kind: w.kind,
                // TrackOnly watchers auto-assign on entry but fire nothing; Action watchers fire the play.
                action: w.kind !== "TrackOnly" && w.actionId ? { actionId: w.actionId, params: w.actionParams } : undefined,
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
