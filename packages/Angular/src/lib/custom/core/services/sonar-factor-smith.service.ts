import { Injectable } from "@angular/core";
import { Metadata, RunView } from "@memberjunction/core";
import { MJActionEntity } from "@memberjunction/core-entities";
import { ActionEngineBase } from "@memberjunction/actions-base";
import { GraphQLActionClient, GraphQLDataProvider } from "@memberjunction/graphql-dataprovider";
import { extractActionResult, extractActionParam } from "./action-result.util";

/** ActionSmith — the agent every factor job runs as. */
const ACTIONSMITH_AGENT_ID = "AF804075-E543-46E5-8D8F-2A0B8094628C";
/** The async kickoff action (fires the run detached, returns its AgentRunID). */
const START_JOB_ACTION = "Sonar: Start Factor Job";
/** The async AI-refine action (improves an existing signal in place, returns its AgentRunID). */
const REFINE_ACTION = "Sonar: Refine Factor Action";
/** MJ core action that runs a Runtime action ephemerally (Approved in-memory copy) — lets us test
 *  a Pending signal's code WITHOUT tripping the executor's approval gate. */
const TEST_RUNTIME_ACTION = "Test Runtime Action";
/** Local labels for in-flight jobs (the run row has no description column). Per-browser; fine for labels. */
const LABELS_KEY = "sonar-factor-job-labels";

/** A job ActionSmith is still working on, observed by polling its AIAgentRun. */
export interface InFlightJob {
    agentRunId: string;
    status: string;
    startedAt: string;
    label: string;
    latestStep: string | null;
}

interface AgentRunRow { ID: string; Status: string; __mj_CreatedAt: string }
interface StepRow { StepName: string }
interface ScoreModelRow { ID: string; Name: string; AnchorEntityID: string }

/** A model the user can test a signal against — its anchor supplies the sample record. */
export interface TestModel { id: string; name: string; anchorEntityID: string; anchorName: string | null }

/** Outcome of a sample test run (factor contract: numeric Value + Explanation). */
export interface SignalTestResult { value: number | null; explanation: string | null; error?: string }
/** One row of a multi-record sample test — the anchor record it ran on plus its outcome. */
export interface SignalSampleRow extends SignalTestResult { anchorRecordId: string }

/** One case fed to `Test Runtime Action`. */
interface RuntimeTestCase { name: string; input: Record<string, string> }
/** One per-case result it returns (keyed back to its case `name`). */
interface RuntimeTestCaseResult { name: string; success: boolean; message: string | null; output: Record<string, unknown> }

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
            Fields: ["ID", "Name", "AnchorEntityID"],
            ResultType: "simple",
        });
        const rows = res.Success ? res.Results ?? [] : [];
        const md = new Metadata();
        return rows.map((r) => ({
            id: r.ID,
            name: r.Name,
            anchorEntityID: r.AnchorEntityID,
            anchorName: md.Entities.find((e) => e.ID === r.AnchorEntityID)?.Name ?? null,
        }));
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

    /**
     * Test a signal across a SAMPLE of anchor records in one round-trip. Routes through `Test Runtime
     * Action` (which runs an ephemeral Approved copy of the code) so a reviewer can test BEFORE
     * approving — the normal RunAction path refuses Pending code, which is exactly the case under review.
     * `TestCases` is an array, so all sample records run in a single call. Cases are keyed by record id
     * so results map back even if order shifts.
     */
    public async testSignal(actionId: string, anchorRecordIds: string[]): Promise<SignalSampleRow[]> {
        if (!anchorRecordIds.length) return [];
        const testActionId = await this.resolveActionId(TEST_RUNTIME_ACTION);
        const fail = (error: string): SignalSampleRow[] =>
            anchorRecordIds.map((anchorRecordId) => ({ anchorRecordId, value: null, explanation: null, error }));
        if (!testActionId) return fail("Test Runtime Action isn't available.");
        const asOf = new Date().toISOString();
        const cases: RuntimeTestCase[] = anchorRecordIds.map((id) => ({ name: id, input: { AnchorRecordID: id, AsOf: asOf } }));
        const params = [
            { Name: "ActionID", Value: actionId, Type: "Input" as const },
            { Name: "TestCases", Value: JSON.stringify(cases), Type: "Input" as const },
        ];
        const res = await this.actionClient().RunAction(testActionId, params);
        if (!res.Success) return fail(res.Message || "Test run failed.");
        // Test Runtime Action sets a dedicated `TestResults` output param (not the aggregate `Result`).
        const rawResults = extractActionParam(res, "TestResults");
        const parsed: unknown = typeof rawResults === "string" ? JSON.parse(rawResults) : rawResults;
        const list: RuntimeTestCaseResult[] = Array.isArray(parsed) ? (parsed as RuntimeTestCaseResult[]) : [];
        const byId = new Map(list.map((r) => [r.name, r]));
        return anchorRecordIds.map((anchorRecordId) => this.toSampleRow(anchorRecordId, byId.get(anchorRecordId)));
    }

    /** Map one Test-Runtime case result onto the factor contract (Value/Explanation). */
    private toSampleRow(anchorRecordId: string, r: RuntimeTestCaseResult | undefined): SignalSampleRow {
        if (!r) return { anchorRecordId, value: null, explanation: null, error: "No result returned." };
        if (!r.success) return { anchorRecordId, value: null, explanation: null, error: r.message || "The signal's code threw." };
        const raw = r.output?.["Value"];
        const value = typeof raw === "number" ? raw : raw != null ? Number(raw) : null;
        const explanation = r.output?.["Explanation"];
        return {
            anchorRecordId,
            value: value != null && !Number.isNaN(value) ? value : null,
            explanation: typeof explanation === "string" ? explanation : null,
        };
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
