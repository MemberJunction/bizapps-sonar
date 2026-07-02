import { Injectable } from "@angular/core";
import { Metadata, RunView } from "@memberjunction/core";
import { MJActionEntity } from "@memberjunction/core-entities";
import { ActionEngineBase } from "@memberjunction/actions-base";
import { GraphQLActionClient, GraphQLDataProvider } from "@memberjunction/graphql-dataprovider";
import { extractActionResult } from "./action-result.util";

/** ActionSmith — the agent every factor job runs as. */
const ACTIONSMITH_AGENT_ID = "AF804075-E543-46E5-8D8F-2A0B8094628C";
/** The async kickoff action (fires the run detached, returns its AgentRunID). */
const START_JOB_ACTION = "Sonar: Start Factor Job";
/** The async AI-refine action (improves an existing signal in place, returns its AgentRunID). */
const REFINE_ACTION = "Sonar: Refine Factor Action";
/** Sonar action that tests a signal over a sample (ephemeral run, gate-bypassed, per-record results in a
 *  Both Result so they round-trip to the browser). See SonarTestSignalAction. */
const TEST_SIGNAL_ACTION = "Sonar: Test Signal";
/** Stops an in-flight ActionSmith run (true abort if this process owns it, else flips the run row). */
const CANCEL_JOB_ACTION = "Sonar: Cancel Factor Job";
/** Binds an approved signal into a Draft model (ActionBacked Factor + Model Factor). */
const BIND_SIGNAL_ACTION = "Sonar: Bind Signal To Model";
/** How far back a terminal-failed run still counts as "recent" for the failures strip (ms). */
const RECENT_FAILURE_WINDOW_MS = 20 * 60 * 1000;
/** Local labels for in-flight jobs (the run row has no description column). Per-browser; fine for labels. */
const LABELS_KEY = "sonar-factor-job-labels";
/** Per-browser store of signal code versions (history/diff/rollback). v1 storage: when we add a server
 *  versions table this whole seam swaps backends; the component only talks to versions()/recordVersion(). */
const VERSIONS_KEY = "sonar-signal-versions";
/** Cap versions kept per signal so localStorage can't grow unbounded. */
const MAX_VERSIONS = 25;

/** A job ActionSmith is still working on, observed by polling its AIAgentRun. */
export interface InFlightJob {
    agentRunId: string;
    status: string;
    startedAt: string;
    label: string;
    latestStep: string | null;
}

/** One step in a job's timeline — what the agent did, in order, with how it ended. */
export interface JobStep {
    name: string;
    status: string;
    startedAt: string;
}

/** A job that finished badly (Failed/Cancelled) recently — surfaced so a dead run doesn't vanish silently. */
export interface FailedJob {
    agentRunId: string;
    status: string;
    label: string;
    finishedAt: string;
    error: string | null;
}

interface AgentRunRow { ID: string; Status: string; __mj_CreatedAt: string }
interface FailedRunRow { ID: string; Status: string; CompletedAt: string | null; __mj_CreatedAt: string; ErrorMessage: string | null }
interface StepRow { StepName: string }
interface StepTimelineRow { StepName: string; Status: string; __mj_CreatedAt: string }
interface ScoreModelRow { ID: string; Name: string; AnchorEntityID: string; Status: string }

/** A model the user can test a signal against — its anchor supplies the sample record. `status` drives
 *  which models a signal can be BOUND into (only Draft models are editable). */
export interface TestModel { id: string; name: string; anchorEntityID: string; anchorName: string | null; status: string }

/** Outcome of a sample test run (factor contract: numeric Value + Explanation). */
export interface SignalTestResult { value: number | null; explanation: string | null; error?: string | null }
/** One row of a multi-record sample test — the anchor record it ran on plus its outcome. */
export interface SignalSampleRow extends SignalTestResult { anchorRecordId: string }

/** One captured snapshot of a signal's code (history/diff/rollback). */
export interface SignalVersion { savedAt: string; code: string; note: string }

/** An anchor record the user can target by name in the record picker. */
export interface AnchorRecordOption { id: string; name: string }
/** One field of the record being scored — the "underlying data" view for a single-record test. */
export interface AnchorField { name: string; value: string }

/**
 * Signal Studio engine — the ASYNC factor-authoring backend (plans §5/§12). Commissions jobs (fires
 * ActionSmith detached via `Sonar: Start Factor Job`, which returns the AgentRunID immediately), then
 * OBSERVES them by polling `AIAgentRun` — no held connection, jobs batch freely. Review/Library lists
 * come from the factor-action catalog (the catalog merge surfaces authored Runtime actions). Code review
 * + approval go through MJ entities. Replaces the old in-builder synchronous harness.
 */
@Injectable({ providedIn: "root" })
export class SonarFactorSmithService {
    private readonly actionIdCache = new Map<string, string>();

    /** Commission a signal: fire ActionSmith detached and return its AgentRunID to track. */
    public async startJob(description: string, context?: string | null): Promise<{ ok: boolean; agentRunId?: string; error?: string }> {
        const id = await this.resolveActionId(START_JOB_ACTION);
        if (!id) return { ok: false, error: "The factor-job action isn't available." };
        const params: { Name: string; Value: string; Type: "Input" }[] = [{ Name: "Description", Value: description, Type: "Input" }];
        if (context) params.push({ Name: "Context", Value: context, Type: "Input" });
        const res = await this.actionClient().RunAction(id, params);
        if (!res.Success) return { ok: false, error: res.Message || "Couldn't start the job." };
        const out = extractActionResult<{ agentRunId?: string }>(res) ?? {};
        if (!out.agentRunId) return { ok: false, error: "The job didn't return a run id." };
        this.rememberLabel(out.agentRunId, description);
        return { ok: true, agentRunId: out.agentRunId };
    }

    /** Reprompt ActionSmith to improve an existing signal IN PLACE: it rewrites + self-tests the code,
     *  then the server transplants it back onto this signal (→ Pending). Returns the run id to track. */
    public async refineSignal(actionId: string, feedback: string): Promise<{ ok: boolean; agentRunId?: string; error?: string }> {
        const id = await this.resolveActionId(REFINE_ACTION);
        if (!id) return { ok: false, error: "The refine action isn't available." };
        const params = [
            { Name: "TargetActionID", Value: actionId, Type: "Input" as const },
            { Name: "Feedback", Value: feedback, Type: "Input" as const },
        ];
        const res = await this.actionClient().RunAction(id, params);
        if (!res.Success) return { ok: false, error: res.Message || "Couldn't start the refine job." };
        const out = extractActionResult<{ agentRunId?: string }>(res) ?? {};
        if (!out.agentRunId) return { ok: false, error: "The refine job didn't return a run id." };
        this.rememberLabel(out.agentRunId, `Refining: ${feedback}`);
        return { ok: true, agentRunId: out.agentRunId };
    }

    /** Jobs ActionSmith is still working on — with their latest step, for a live-ish status. */
    public async inFlight(): Promise<InFlightJob[]> {
        const res = await new RunView().RunView<AgentRunRow>({
            EntityName: "MJ: AI Agent Runs",
            ExtraFilter: `AgentID='${ACTIONSMITH_AGENT_ID}' AND Status IN ('Running','AwaitingFeedback')`,
            OrderBy: "__mj_CreatedAt DESC",
            MaxRows: 25,
            Fields: ["ID", "Status", "__mj_CreatedAt"],
            ResultType: "simple",
        });
        const rows = res.Success ? res.Results ?? [] : [];
        const labels = this.labels();
        const jobs: InFlightJob[] = [];
        for (const r of rows) {
            jobs.push({
                agentRunId: r.ID,
                status: r.Status,
                startedAt: r.__mj_CreatedAt,
                label: labels[r.ID] ?? "Authoring a signal…",
                latestStep: await this.latestStep(r.ID),
            });
        }
        return jobs;
    }

    /** The newest run-step name, as a lightweight "what it's doing now" indicator. */
    private async latestStep(agentRunId: string): Promise<string | null> {
        const res = await new RunView().RunView<StepRow>({
            EntityName: "MJ: AI Agent Run Steps",
            ExtraFilter: `AgentRunID='${agentRunId}'`,
            OrderBy: "__mj_CreatedAt DESC",
            MaxRows: 1,
            Fields: ["StepName"],
            ResultType: "simple",
        });
        return res.Success && res.Results?.length ? res.Results[0].StepName : null;
    }

    /** The full step timeline for a job (oldest→newest) — the transparency view when a job is expanded. */
    public async jobSteps(agentRunId: string): Promise<JobStep[]> {
        const res = await new RunView().RunView<StepTimelineRow>({
            EntityName: "MJ: AI Agent Run Steps",
            ExtraFilter: `AgentRunID='${agentRunId}'`,
            OrderBy: "__mj_CreatedAt ASC",
            MaxRows: 50,
            Fields: ["StepName", "Status", "__mj_CreatedAt"],
            ResultType: "simple",
        });
        const rows = res.Success ? res.Results ?? [] : [];
        return rows.map((r) => ({ name: r.StepName, status: r.Status, startedAt: r.__mj_CreatedAt }));
    }

    /** Recently-failed/cancelled jobs (with their error) so a dead run is surfaced, not silently dropped. */
    public async recentFailures(): Promise<FailedJob[]> {
        const since = new Date(Date.now() - RECENT_FAILURE_WINDOW_MS).toISOString();
        const res = await new RunView().RunView<FailedRunRow>({
            EntityName: "MJ: AI Agent Runs",
            ExtraFilter: `AgentID='${ACTIONSMITH_AGENT_ID}' AND Status IN ('Failed','Cancelled') AND __mj_CreatedAt>='${since}'`,
            OrderBy: "__mj_CreatedAt DESC",
            MaxRows: 10,
            Fields: ["ID", "Status", "CompletedAt", "__mj_CreatedAt", "ErrorMessage"],
            ResultType: "simple",
        });
        const rows = res.Success ? res.Results ?? [] : [];
        const labels = this.labels();
        return rows.map((r) => ({
            agentRunId: r.ID,
            status: r.Status,
            label: labels[r.ID] ?? "A signal job",
            finishedAt: r.CompletedAt ?? r.__mj_CreatedAt,
            error: r.ErrorMessage,
        }));
    }

    /** Cancel an in-flight job — true abort if MJAPI owns the run, else marks it Cancelled. */
    public async cancelJob(agentRunId: string): Promise<{ ok: boolean; error?: string }> {
        const id = await this.resolveActionId(CANCEL_JOB_ACTION);
        if (!id) return { ok: false, error: "The cancel action isn't available." };
        const res = await this.actionClient().RunAction(id, [{ Name: "AgentRunID", Value: agentRunId, Type: "Input" }]);
        return res.Success ? { ok: true } : { ok: false, error: res.Message || "Couldn't cancel the job." };
    }

    /** The generated JS for the read-only code review. */
    public async getCode(actionId: string): Promise<string> {
        const action = await this.loadAction(actionId);
        return action?.Code ?? "";
    }

    /** Save edited code. Edits invalidate the prior review → drop back to Pending (re-review), so the
     *  approval gate is never bypassed. */
    public async saveCode(actionId: string, code: string): Promise<{ ok: boolean; error?: string }> {
        const action = await this.loadAction(actionId);
        if (!action) return { ok: false, error: "Action not found." };
        action.Code = code;
        action.CodeApprovalStatus = "Pending";
        action.CodeApprovedByUserID = null;
        action.CodeApprovedAt = null;
        return (await action.Save()) ? { ok: true } : { ok: false, error: action.LatestResult?.Message || "Save failed." };
    }

    /** Sonar models the user can test a signal against (each carries an anchor entity). */
    public async listModels(): Promise<TestModel[]> {
        const res = await new RunView().RunView<ScoreModelRow>({
            EntityName: "MJ_BizApps_Sonar: Score Models",
            OrderBy: "Name ASC",
            Fields: ["ID", "Name", "AnchorEntityID", "Status"],
            ResultType: "simple",
        });
        const rows = res.Success ? res.Results ?? [] : [];
        const md = new Metadata();
        return rows.map((r) => ({
            id: r.ID,
            name: r.Name,
            anchorEntityID: r.AnchorEntityID,
            anchorName: md.Entities.find((e) => e.ID === r.AnchorEntityID)?.Name ?? null,
            status: r.Status,
        }));
    }

    /** Bind an approved signal into a Draft model's rubric (ActionBacked Factor + Model Factor). */
    public async bindSignal(actionId: string, modelId: string, weight?: number): Promise<{ ok: boolean; error?: string }> {
        const id = await this.resolveActionId(BIND_SIGNAL_ACTION);
        if (!id) return { ok: false, error: "The bind action isn't available." };
        const params: { Name: string; Value: string; Type: "Input" }[] = [
            { Name: "ActionID", Value: actionId, Type: "Input" },
            { Name: "ModelID", Value: modelId, Type: "Input" },
        ];
        if (weight != null) params.push({ Name: "Weight", Value: String(weight), Type: "Input" });
        const res = await this.actionClient().RunAction(id, params);
        return res.Success ? { ok: true } : { ok: false, error: res.Message || "Couldn't bind the signal." };
    }

    /** Rename a signal (and optionally its description) — library management. */
    public async renameSignal(actionId: string, name: string, description?: string): Promise<{ ok: boolean; error?: string }> {
        const action = await this.loadAction(actionId);
        if (!action) return { ok: false, error: "Action not found." };
        action.Name = name;
        if (description != null) action.Description = description;
        return (await action.Save()) ? { ok: true } : { ok: false, error: action.LatestResult?.Message || "Rename failed." };
    }

    /** Archive a signal (Status='Disabled') — it drops out of the catalog without being hard-deleted, so
     *  any models already bound to it keep their config and it can be revived later. */
    public async archiveSignal(actionId: string): Promise<{ ok: boolean; error?: string }> {
        const action = await this.loadAction(actionId);
        if (!action) return { ok: false, error: "Action not found." };
        action.Status = "Disabled";
        return (await action.Save()) ? { ok: true } : { ok: false, error: action.LatestResult?.Message || "Archive failed." };
    }

    /** Up to `count` representative anchor-record ids from the entity's population (for a sample test). */
    public async sampleAnchorRecords(anchorEntityID: string, count = 5): Promise<string[]> {
        const entity = new Metadata().Entities.find((e) => e.ID === anchorEntityID);
        if (!entity) return [];
        const pk = entity.FirstPrimaryKey?.Name ?? "ID";
        const res = await new RunView().RunView({ EntityName: entity.Name, MaxRows: count, Fields: [pk], ResultType: "simple" });
        const rows = res.Success ? res.Results ?? [] : [];
        return rows
            .map((r) => (r as Record<string, unknown>)[pk])
            .filter((v): v is string | number => v != null)
            .map((v) => String(v));
    }

    /** Search an anchor entity by display name → pickable options, so a test can target a KNOWN record
     *  (e.g. a specific member) rather than a random sample. Falls back to recent records on a blank query. */
    public async searchAnchorRecords(anchorEntityID: string, query: string, limit = 15): Promise<AnchorRecordOption[]> {
        const entity = new Metadata().Entities.find((e) => e.ID === anchorEntityID);
        if (!entity) return [];
        const pk = entity.FirstPrimaryKey?.Name ?? "ID";
        const nameField = entity.NameField?.Name ?? pk;
        const q = query.trim().replace(/'/g, "''");
        const res = await new RunView().RunView({
            EntityName: entity.Name,
            ExtraFilter: q ? `${nameField} LIKE '%${q}%'` : "",
            OrderBy: `${nameField} ASC`,
            MaxRows: limit,
            Fields: nameField === pk ? [pk] : [pk, nameField],
            ResultType: "simple",
        });
        const rows = res.Success ? res.Results ?? [] : [];
        return rows.map((r) => {
            const rec = r as Record<string, unknown>;
            return { id: String(rec[pk]), name: rec[nameField] != null ? String(rec[nameField]) : String(rec[pk]) };
        });
    }

    /** The fields of the record being scored — the "what data is this signal looking at" view for a single
     *  record. Returns the record's columns as label/value pairs (the anchor-level underlying data). */
    public async loadAnchorFields(anchorEntityID: string, recordId: string): Promise<AnchorField[]> {
        const entity = new Metadata().Entities.find((e) => e.ID === anchorEntityID);
        if (!entity) return [];
        const pk = entity.FirstPrimaryKey?.Name ?? "ID";
        const res = await new RunView().RunView({
            EntityName: entity.Name,
            ExtraFilter: `${pk}='${recordId.replace(/'/g, "''")}'`,
            MaxRows: 1,
            ResultType: "simple",
        });
        const row = res.Success && res.Results?.length ? (res.Results[0] as Record<string, unknown>) : null;
        if (!row) return [];
        // Drop MJ housekeeping columns; keep meaningful, non-empty fields the signal might read.
        return Object.entries(row)
            .filter(([k, v]) => !k.startsWith("__mj_") && v != null && v !== "")
            .map(([name, value]) => ({ name, value: String(value).slice(0, 120) }));
    }

    /**
     * Test a signal across a SAMPLE of anchor records via `Sonar: Test Signal` — which runs the code on
     * an ephemeral Approved copy (so a still-Pending signal can be tested BEFORE approval) and returns the
     * per-record results in a Both `Result` that round-trips to the browser. One call covers all samples.
     * `asOf` (ISO date) tests the signal as of a historical instant; omit for "now".
     */
    public async testSignal(actionId: string, anchorRecordIds: string[], asOf?: string | null): Promise<SignalSampleRow[]> {
        if (!anchorRecordIds.length) return [];
        const id = await this.resolveActionId(TEST_SIGNAL_ACTION);
        const fail = (error: string): SignalSampleRow[] =>
            anchorRecordIds.map((anchorRecordId) => ({ anchorRecordId, value: null, explanation: null, error }));
        if (!id) return fail("The test action isn't available.");
        const params = [
            { Name: "TargetActionID", Value: actionId, Type: "Input" as const },
            { Name: "AnchorRecordIDs", Value: JSON.stringify(anchorRecordIds), Type: "Input" as const },
        ];
        if (asOf) params.push({ Name: "AsOf", Value: asOf, Type: "Input" as const });
        const res = await this.actionClient().RunAction(id, params);
        if (!res.Success) return fail(res.Message || "Test run failed.");
        const out = extractActionResult<{ rows?: SignalSampleRow[] }>(res) ?? {};
        const byId = new Map((out.rows ?? []).map((r) => [r.anchorRecordId, r]));
        return anchorRecordIds.map(
            (anchorRecordId) => byId.get(anchorRecordId) ?? { anchorRecordId, value: null, explanation: null, error: "No result returned." },
        );
    }

    /** Approve the code (governance gate) — the engine only scores Approved action-factors. */
    public async approve(actionId: string): Promise<{ ok: boolean; error?: string }> {
        const md = new Metadata();
        const action = await this.loadAction(actionId);
        if (!action) return { ok: false, error: "Action not found." };
        action.CodeApprovalStatus = "Approved";
        action.CodeApprovedByUserID = md.CurrentUser.ID;
        action.CodeApprovedAt = new Date();
        return (await action.Save()) ? { ok: true } : { ok: false, error: action.LatestResult?.Message || "Approve failed." };
    }

    private async loadAction(actionId: string): Promise<MJActionEntity | null> {
        const action = await new Metadata().GetEntityObject<MJActionEntity>("MJ: Actions");
        await action.Load(actionId);
        return action.IsSaved ? action : null;
    }

    // ---- signal code versions (history / diff / rollback) ----
    /** Captured versions for a signal, newest first. */
    public versions(actionId: string): SignalVersion[] {
        return this.versionStore()[actionId] ?? [];
    }

    /** Snapshot the code as a new version IF it differs from the latest one kept. Newest-first; capped. */
    public recordVersion(actionId: string, code: string, note: string): void {
        if (!code) return;
        const store = this.versionStore();
        const list = store[actionId] ?? [];
        if (list.length && list[0].code === code) return; // no change since the last snapshot
        list.unshift({ savedAt: new Date().toISOString(), code, note });
        store[actionId] = list.slice(0, MAX_VERSIONS);
        try { localStorage.setItem(VERSIONS_KEY, JSON.stringify(store)); } catch { /* quota — history is best-effort */ }
    }

    private versionStore(): Record<string, SignalVersion[]> {
        try { return JSON.parse(localStorage.getItem(VERSIONS_KEY) ?? "{}"); } catch { return {}; }
    }

    // ---- local job labels ----
    private labels(): Record<string, string> {
        try { return JSON.parse(localStorage.getItem(LABELS_KEY) ?? "{}"); } catch { return {}; }
    }
    private rememberLabel(agentRunId: string, description: string): void {
        const all = this.labels();
        all[agentRunId] = description.length > 70 ? description.slice(0, 68) + "…" : description;
        try { localStorage.setItem(LABELS_KEY, JSON.stringify(all)); } catch { /* quota — labels are best-effort */ }
    }

    private actionClient(): GraphQLActionClient {
        return new GraphQLActionClient(Metadata.Provider as GraphQLDataProvider);
    }

    private async resolveActionId(name: string): Promise<string | null> {
        const cached = this.actionIdCache.get(name);
        if (cached) return cached;
        const provider = Metadata.Provider as GraphQLDataProvider;
        await ActionEngineBase.Instance.Config(false, provider.CurrentUser, provider);
        let action = ActionEngineBase.Instance.Actions.find((a) => a.Name === name);
        if (!action) {
            await ActionEngineBase.Instance.Config(true, provider.CurrentUser, provider);
            action = ActionEngineBase.Instance.Actions.find((a) => a.Name === name);
        }
        if (action) this.actionIdCache.set(name, action.ID);
        return action?.ID ?? null;
    }
}
