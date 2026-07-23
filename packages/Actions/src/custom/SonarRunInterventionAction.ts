import { ActionResultSimple, RunActionParams, ActionParam } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { Metadata, RunView, UserInfo } from "@memberjunction/core";
import {
    mjBizAppsSonarScoreSegmentEntity,
    mjBizAppsSonarInterventionEntity,
} from "@mj-biz-apps/sonar-entities";
import {
    InterventionRunner,
    InterventionRunRequest,
    SegmentFilter,
    createInterventionInvoker,
} from "@mj-biz-apps/sonar-engine";

const SEGMENT_ENTITY = "MJ_BizApps_Sonar: Score Segments";
const INTERVENTION_ENTITY = "MJ_BizApps_Sonar: Interventions";

/** The on-the-fly run payload the Engagement Manager sends (one ConfigJSON input param). */
interface RunInterventionConfig {
    modelId: string;
    segment: { name: string; filter: SegmentFilter };
    intervention: { name: string; holdoutPercent: number };
    action: { actionId: string; params: { name: string; value: string }[] };
    cap: number;
    preview: boolean;
}

/**
 * Sonar: Run Intervention — the action layer's entry point. Builds the group + play "on the fly"
 * from what the operator is looking at: it find-or-creates an ad-hoc ScoreSegment (the current
 * band/score filter, deduped per model+filter) and an Intervention (segment + chosen MJ Action +
 * holdout), then runs it through the engine's InterventionRunner.
 *
 * `preview: true` resolves the cohort + treated/held split and returns counts WITHOUT writing
 * assignments or firing anything (the dry-run gate). `preview: false` commits: writes one assignment
 * per member and fires the chosen Action for each treated member (held-back members get a row, no
 * fire). Idempotent — a re-run never re-fires already-assigned members.
 *
 * Input param: ConfigJSON (JSON string, shape RunInterventionConfig).
 * Output param: Result    (JSON string of InterventionRunResult — the counts).
 */
@RegisterClass(BaseAction, "SonarRunIntervention")
export class SonarRunInterventionAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const raw = this.getInput(params, "ConfigJSON");
        if (!raw) {
            return this.fail(params, "VALIDATION_ERROR", "ConfigJSON is required.");
        }
        let cfg: RunInterventionConfig;
        try {
            cfg = this.parseConfig(raw);
        } catch (e: unknown) {
            return this.fail(params, "VALIDATION_ERROR", e instanceof Error ? e.message : String(e));
        }

        try {
            const segmentId = await this.findOrCreateSegment(cfg, params.ContextUser);
            const interventionId = await this.findOrCreateIntervention(cfg, segmentId, params.ContextUser);

            const request: InterventionRunRequest = {
                interventionId,
                modelId: cfg.modelId,
                segmentFilter: cfg.segment.filter,
                holdoutPercent: cfg.intervention.holdoutPercent,
                action: cfg.action,
                cap: cfg.cap,
                preview: cfg.preview,
            };
            const result = await new InterventionRunner(createInterventionInvoker()).run(
                request,
                params.ContextUser,
            );
            return {
                Success: true,
                ResultCode: "SUCCESS",
                Message: cfg.preview
                    ? `Preview: would fire ${result.treated} real message(s), hold back ${result.held}.`
                    : `Fired ${result.sent} message(s), held back ${result.held}, ${result.failed} failed.`,
                Params: [...params.Params, { Name: "Result", Value: JSON.stringify(result), Type: "Both" }],
            };
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    /** Parse + validate the ConfigJSON payload (fail loud on a malformed shape). */
    private parseConfig(raw: string): RunInterventionConfig {
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") {
            throw new Error("ConfigJSON must be a JSON object.");
        }
        const c = parsed as Partial<RunInterventionConfig>;
        if (!c.modelId || !c.segment || !c.intervention || !c.action?.actionId) {
            throw new Error("ConfigJSON requires modelId, segment, intervention, and action.actionId.");
        }
        return {
            modelId: c.modelId,
            segment: { name: c.segment.name ?? "Ad-hoc cohort", filter: c.segment.filter ?? {} },
            intervention: {
                name: c.intervention.name ?? "Ad-hoc intervention",
                holdoutPercent: this.clampPercent(c.intervention.holdoutPercent),
            },
            action: { actionId: c.action.actionId, params: c.action.params ?? [] },
            cap: Number.isFinite(c.cap) ? Math.max(0, Number(c.cap)) : 10,
            preview: c.preview === true,
        };
    }

    /** Reuse an ad-hoc segment with the same model + filter (dedup), else create one. */
    private async findOrCreateSegment(cfg: RunInterventionConfig, contextUser: UserInfo): Promise<string> {
        const filterJson = JSON.stringify(cfg.segment.filter);
        const existing = await new RunView().RunView<{ ID: string }>(
            {
                EntityName: SEGMENT_ENTITY,
                ExtraFilter: `ScoreModelID='${cfg.modelId}' AND FilterExpression='${filterJson.replace(/'/g, "''")}'`,
                Fields: ["ID"],
                MaxRows: 1,
                ResultType: "simple",
            },
            contextUser,
        );
        if (existing.Success && existing.Results?.[0]) {
            return existing.Results[0].ID;
        }
        const md = new Metadata();
        const seg = await md.GetEntityObject<mjBizAppsSonarScoreSegmentEntity>(SEGMENT_ENTITY, contextUser);
        seg.NewRecord();
        seg.ScoreModelID = cfg.modelId;
        seg.Name = cfg.segment.name;
        seg.FilterExpression = filterJson;
        seg.IsDynamic = true; // membership is re-resolved from the filter each run
        if (!(await seg.Save())) {
            throw new Error(`Failed to create segment: ${seg.LatestResult?.CompleteMessage ?? "unknown"}`);
        }
        return seg.ID;
    }

    /** Reuse an intervention for the same segment + action + holdout (so re-runs share assignment
     *  history → idempotency), else create one. */
    private async findOrCreateIntervention(
        cfg: RunInterventionConfig,
        segmentId: string,
        contextUser: UserInfo,
    ): Promise<string> {
        const pct = cfg.intervention.holdoutPercent;
        const existing = await new RunView().RunView<{ ID: string }>(
            {
                EntityName: INTERVENTION_ENTITY,
                ExtraFilter: `ScoreSegmentID='${segmentId}' AND ActionID='${cfg.action.actionId}' AND ControlGroupPercent=${pct}`,
                Fields: ["ID"],
                MaxRows: 1,
                ResultType: "simple",
            },
            contextUser,
        );
        if (existing.Success && existing.Results?.[0]) {
            return existing.Results[0].ID;
        }
        const md = new Metadata();
        const iv = await md.GetEntityObject<mjBizAppsSonarInterventionEntity>(INTERVENTION_ENTITY, contextUser);
        iv.NewRecord();
        iv.ScoreSegmentID = segmentId;
        iv.Name = cfg.intervention.name;
        iv.TriggerType = "Manual";
        iv.ActionID = cfg.action.actionId;
        iv.ControlGroupPercent = pct;
        iv.Status = "Active";
        // Persist the play's params so the intervention is self-contained: a later autonomous fire
        // (or a re-run from the record) uses the same params the operator launched with.
        if (cfg.action.params.length > 0) iv.ActionParamsJSON = JSON.stringify(cfg.action.params);
        if (!(await iv.Save())) {
            throw new Error(`Failed to create intervention: ${iv.LatestResult?.CompleteMessage ?? "unknown"}`);
        }
        return iv.ID;
    }

    private clampPercent(v: unknown): number {
        const n = Number(v);
        return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
    }

}
