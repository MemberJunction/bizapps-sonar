import { Component, OnDestroy, computed, inject, signal } from "@angular/core";
import { RegisterClass } from "@memberjunction/global";
import { BaseResourceComponent } from "@memberjunction/ng-shared";
import { ResourceData } from "@memberjunction/core-entities";
import { SonarFactorSmithService, InFlightJob, TestModel, SignalSampleRow, JobStep, FailedJob, AnchorRecordOption, AnchorField } from "../../core/services/sonar-factor-smith.service";
import { ActionCatalogService, FactorAction } from "../../core/services/action-catalog.service";

/**
 * Signal Studio — the async workspace for authoring custom (code-backed) scoring signals (plans §5/§12).
 * Three rails: the pipeline (in-flight → review → library) on the left, the code workbench in the
 * centre, and the generator on the right. Commission a signal → ActionSmith writes + tests the code in
 * the BACKGROUND (fired detached, observed by polling its AIAgentRun) → review/edit the code, test it on
 * a sample record from a chosen model's anchor, and approve it into the catalog. Editing approved code
 * sends it back to Pending (the approval gate is never bypassed). DriverClass = 'SonarSignalStudioResource'.
 */
@RegisterClass(BaseResourceComponent, "SonarSignalStudioResource")
@Component({
    standalone: false,
    selector: "sonar-signal-studio-resource",
    templateUrl: "./sonar-signal-studio-resource.component.html",
    styleUrls: ["../../shared/styles/sonar-shell.css", "./sonar-signal-studio-resource.component.css"],
})
export class SonarSignalStudioResourceComponent extends BaseResourceComponent implements OnDestroy {
    private readonly smith = inject(SonarFactorSmithService);
    private readonly catalog = inject(ActionCatalogService);

    public description = "";
    public editCode = "";
    public refineFeedback = "";
    public selectedModelId: string | null = null;
    public sampleSize = 5;
    /** Richer testing: target a random sample OR one named record, optionally as of a past date. */
    public recordQuery = "";
    public asOfDate = "";

    public readonly inFlight = signal<InFlightJob[]>([]);
    public readonly failures = signal<FailedJob[]>([]);
    public readonly review = signal<FactorAction[]>([]);
    public readonly library = signal<FactorAction[]>([]);
    public readonly selected = signal<FactorAction | null>(null);
    public readonly code = signal<string>("");
    public readonly testRows = signal<SignalSampleRow[]>([]);
    public readonly models = signal<TestModel[]>([]);
    public readonly sampleAnchorIds = signal<string[]>([]);

    /** Richer-testing state: sample vs specific-record mode, the record search + pick, and the picked
     *  record's fields (the "what data is this signal looking at" view). */
    public readonly testMode = signal<"sample" | "record">("sample");
    public readonly recordOptions = signal<AnchorRecordOption[]>([]);
    public readonly selectedRecord = signal<AnchorRecordOption | null>(null);
    public readonly searchingRecords = signal(false);
    public readonly anchorFields = signal<AnchorField[]>([]);

    /** Sample-size options for the test run. */
    public readonly sampleSizes = [1, 5, 10, 25];

    /** Job-transparency view: which in-flight job is expanded + its loaded step timeline. */
    public readonly expandedJobId = signal<string | null>(null);
    public readonly expandedSteps = signal<JobStep[]>([]);
    public readonly loadingSteps = signal(false);
    public readonly cancellingIds = signal<string[]>([]);
    /** Failures the user has dismissed this session (local — they stay gone until the page reloads). */
    private readonly dismissedFailures = new Set<string>();

    public readonly commissioning = signal(false);
    public readonly testing = signal(false);
    public readonly approving = signal(false);
    public readonly editing = signal(false);
    public readonly saving = signal(false);
    public readonly refining = signal(false);
    public readonly notice = signal<string | null>(null);

    /** Only AI-authored Runtime signals can be edited/approved (compiled ones live in code). */
    public readonly isEditable = computed(() => this.selected()?.kind === "runtime");
    public readonly isApproved = computed(() => this.selected()?.approvalStatus === "Approved");
    /** A method (not a computed): selectedModelId is a plain [ngModel]-bound property, not a signal, so a
     *  computed would memoise at null and never invalidate. Re-evaluated each change-detection pass. */
    public selectedModel(): TestModel | null { return this.models().find((m) => m.id === this.selectedModelId) ?? null; }

    /** Roll the per-record test results into a verdict that drives the guardrails + summary banner. */
    public readonly testSummary = computed(() => {
        const rows = this.testRows();
        if (!rows.length) return null;
        const failed = rows.filter((r) => r.error).length;
        const withValue = rows.filter((r) => r.value != null).length;
        const firstError = rows.find((r) => r.error)?.error ?? null;
        const state: "ok" | "errored" | "empty" = failed > 0 ? "errored" : withValue === 0 ? "empty" : "ok";
        return { total: rows.length, failed, withValue, firstError, state };
    });

    /** Guardrail: a Pending signal can only be approved after a test that actually produced values for
     *  the sample with NO errors — you can't approve code you haven't seen run cleanly. */
    public readonly canApprove = computed(() => {
        const s = this.testSummary();
        return this.isEditable() && !this.isApproved() && !this.editing() && s !== null && s.state === "ok";
    });

    /** Plain-English commission starters — click to fill the box (prompting is the hardest part). */
    public readonly examples: ReadonlyArray<{ label: string; text: string }> = [
        { label: "Activity streak", text: "The longest streak of consecutive months a member registered for an event. Reads Event Registrations on the Members anchor; returns the streak length in months." },
        { label: "Recency decay", text: "A recency-weighted engagement score where more recent event registrations count for more, using an exponential decay with a 90-day half-life relative to AsOf. Reads Event Registrations." },
        { label: "Open→send ratio", text: "The ratio of email opens to email sends over the last 90 days (0 when there were no sends). Reads Email Engagements on the Members anchor." },
    ];
    public useExample(text: string): void { this.description = text; }

    private poll: ReturnType<typeof setInterval> | null = null;
    private refreshing = false;

    public async GetResourceDisplayName(_data: ResourceData): Promise<string> { return "Signal Studio"; }
    public async GetResourceIconClass(_data: ResourceData): Promise<string> { return "fa-solid fa-hammer"; }

    public override ngOnInit(): void {
        super.ngOnInit();
        void this.smith.listModels().then((m) => this.models.set(m));
        void this.refresh().finally(() => this.NotifyLoadComplete());
        this.poll = setInterval(() => void this.refresh(), 6000);
    }

    public ngOnDestroy(): void {
        if (this.poll) clearInterval(this.poll);
    }

    /** Pull in-flight jobs + the catalog, split into Review (authored, pending) vs Library. */
    public async refresh(): Promise<void> {
        if (this.refreshing) return;
        this.refreshing = true;
        try {
            const [jobs, fails, cat] = await Promise.all([
                this.smith.inFlight(),
                this.smith.recentFailures(),
                this.catalog.listFactorActions(true),
            ]);
            this.inFlight.set(jobs);
            this.failures.set(fails.filter((f) => !this.dismissedFailures.has(f.agentRunId)));
            this.review.set(cat.filter((a) => a.kind === "runtime" && a.approvalStatus !== "Approved"));
            this.library.set(cat.filter((a) => !(a.kind === "runtime" && a.approvalStatus !== "Approved")));
            // If the expanded job is still in flight, keep its step timeline fresh on each poll.
            const open = this.expandedJobId();
            if (open && jobs.some((j) => j.agentRunId === open)) this.expandedSteps.set(await this.smith.jobSteps(open));
            // Keep the open signal's metadata fresh (status may have flipped on a poll).
            const sel = this.selected();
            if (sel) this.selected.set(cat.find((a) => a.id === sel.id) ?? sel);
        } finally {
            this.refreshing = false;
        }
    }

    /** Expand/collapse a job's step timeline (the transparency view into a long-running run). */
    public async toggleJob(job: InFlightJob): Promise<void> {
        if (this.expandedJobId() === job.agentRunId) {
            this.expandedJobId.set(null);
            this.expandedSteps.set([]);
            return;
        }
        this.expandedJobId.set(job.agentRunId);
        this.expandedSteps.set([]);
        this.loadingSteps.set(true);
        try {
            this.expandedSteps.set(await this.smith.jobSteps(job.agentRunId));
        } finally {
            this.loadingSteps.set(false);
        }
    }

    /** Stop an in-flight job (true abort if MJAPI owns it, else marked Cancelled). */
    public async cancel(job: InFlightJob): Promise<void> {
        if (this.cancellingIds().includes(job.agentRunId)) return;
        this.cancellingIds.update((ids) => [...ids, job.agentRunId]);
        try {
            const res = await this.smith.cancelJob(job.agentRunId);
            this.notice.set(res.ok ? `Cancelled “${job.label}”.` : res.error ?? "Couldn't cancel the job.");
            await this.refresh();
        } finally {
            this.cancellingIds.update((ids) => ids.filter((id) => id !== job.agentRunId));
        }
    }

    public isCancelling(agentRunId: string): boolean { return this.cancellingIds().includes(agentRunId); }

    /** Dismiss a surfaced failure (local — it won't reappear until the page reloads). */
    public dismissFailure(agentRunId: string): void {
        this.dismissedFailures.add(agentRunId);
        this.failures.update((f) => f.filter((x) => x.agentRunId !== agentRunId));
    }

    public async commission(): Promise<void> {
        const desc = this.description.trim();
        if (!desc || this.commissioning()) return;
        this.commissioning.set(true);
        this.notice.set(null);
        try {
            const res = await this.smith.startJob(desc);
            if (res.ok) {
                this.notice.set("Job started — ActionSmith is writing it in the background. It'll appear under “For review” when ready.");
                this.description = "";
                await this.refresh();
            } else {
                this.notice.set(res.error ?? "Couldn't start the job.");
            }
        } finally {
            this.commissioning.set(false);
        }
    }

    /** Open a signal (review OR library) into the centre workbench. */
    public async select(action: FactorAction): Promise<void> {
        this.selected.set(action);
        this.editing.set(false);
        this.testRows.set([]);
        this.anchorFields.set([]);
        this.code.set("");
        this.code.set(await this.smith.getCode(action.id));
    }

    /** Pick a test model → resolve a sample of anchor records, and clear any record-mode selection. */
    public async onModelChange(modelId: string): Promise<void> {
        this.selectedModelId = modelId;
        this.selectedRecord.set(null);
        this.recordOptions.set([]);
        this.recordQuery = "";
        this.anchorFields.set([]);
        await this.resolveSample();
    }

    /** Re-resolve the sample when the sample size changes. */
    public async onSampleSizeChange(size: number): Promise<void> {
        this.sampleSize = size;
        await this.resolveSample();
    }

    private async resolveSample(): Promise<void> {
        this.testRows.set([]);
        this.sampleAnchorIds.set([]);
        const model = this.models().find((m) => m.id === this.selectedModelId);
        if (model) this.sampleAnchorIds.set(await this.smith.sampleAnchorRecords(model.anchorEntityID, this.sampleSize));
    }

    /** Switch between testing a random sample and a single named record. */
    public setTestMode(mode: "sample" | "record"): void {
        this.testMode.set(mode);
        this.testRows.set([]);
        this.anchorFields.set([]);
    }

    /** Search the selected model's anchor entity by name for the record picker. */
    public async searchRecords(): Promise<void> {
        const model = this.models().find((m) => m.id === this.selectedModelId);
        if (!model) return;
        this.searchingRecords.set(true);
        try {
            this.recordOptions.set(await this.smith.searchAnchorRecords(model.anchorEntityID, this.recordQuery));
        } finally {
            this.searchingRecords.set(false);
        }
    }

    /** Pick a specific record to test against. */
    public pickRecord(opt: AnchorRecordOption): void {
        this.selectedRecord.set(opt);
        this.recordOptions.set([]);
        this.recordQuery = opt.name;
        this.testRows.set([]);
        this.anchorFields.set([]);
    }

    /** The record ids the next test run will cover, given the current mode. */
    private testTargetIds(): string[] {
        if (this.testMode() === "record") {
            const rec = this.selectedRecord();
            return rec ? [rec.id] : [];
        }
        return this.sampleAnchorIds();
    }
    public readonly canRunTest = computed(() => this.testTargetIds().length > 0 && !this.testing() && !this.editing());

    public async runTest(): Promise<void> {
        const action = this.selected();
        const ids = this.testTargetIds();
        if (!action || !ids.length || this.testing()) return;
        this.testing.set(true);
        this.testRows.set([]);
        this.anchorFields.set([]);
        const asOf = this.asOfDate ? new Date(this.asOfDate).toISOString() : null;
        try {
            this.testRows.set(await this.smith.testSignal(action.id, ids, asOf));
            // Single named record → also surface the record's fields (the underlying data being scored).
            const model = this.models().find((m) => m.id === this.selectedModelId);
            if (this.testMode() === "record" && model && ids.length === 1) {
                this.anchorFields.set(await this.smith.loadAnchorFields(model.anchorEntityID, ids[0]));
            }
        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : String(e);
            this.testRows.set(ids.map((anchorRecordId) => ({ anchorRecordId, value: null, explanation: null, error })));
        } finally {
            this.testing.set(false);
        }
    }

    public startEdit(): void {
        this.editCode = this.code();
        this.editing.set(true);
        this.showRefine.set(false);
    }
    public cancelEdit(): void { this.editing.set(false); }

    public readonly showRefine = signal(false);
    public toggleRefine(): void {
        this.refineFeedback = "";
        this.showRefine.update((v) => !v);
        this.editing.set(false);
    }

    /** Open the refine box pre-seeded with the test failure, so the agent fixes the exact problem. */
    public fixWithAI(): void {
        const s = this.testSummary();
        const seed = s?.firstError
            ? `The test failed with: "${s.firstError}". Fix the code so it runs and returns a numeric Value (and a short Explanation) for each member.`
            : s?.state === "empty"
              ? "The test produced no value for any member. Fix the code so it returns a numeric Value where data exists."
              : "";
        this.refineFeedback = seed;
        this.editing.set(false);
        this.showRefine.set(true);
    }

    /** Reprompt ActionSmith to improve the selected signal in place (rewrites + self-tests → Pending). */
    public async refine(): Promise<void> {
        const action = this.selected();
        const feedback = this.refineFeedback.trim();
        if (!action || !feedback || this.refining()) return;
        this.refining.set(true);
        try {
            const res = await this.smith.refineSignal(action.id, feedback);
            if (res.ok) {
                this.notice.set(`Refining “${action.name}” in the background — it'll update here and drop to Pending when ready.`);
                this.refineFeedback = "";
                this.showRefine.set(false);
                await this.refresh();
            } else {
                this.notice.set(res.error ?? "Couldn't start the refine.");
            }
        } finally {
            this.refining.set(false);
        }
    }

    /** Save edited code — re-review (back to Pending) so the approval gate holds. */
    public async saveEdit(): Promise<void> {
        const action = this.selected();
        if (!action || this.saving()) return;
        this.saving.set(true);
        try {
            const res = await this.smith.saveCode(action.id, this.editCode);
            if (res.ok) {
                this.code.set(this.editCode);
                this.editing.set(false);
                this.testRows.set([]);
                this.notice.set(`Saved “${action.name}” — back to Pending for re-review.`);
                await this.refresh();
            } else {
                this.notice.set(res.error ?? "Save failed.");
            }
        } finally {
            this.saving.set(false);
        }
    }

    public async approve(): Promise<void> {
        const action = this.selected();
        if (!action || this.approving()) return;
        this.approving.set(true);
        try {
            const res = await this.smith.approve(action.id);
            if (res.ok) {
                this.notice.set(`“${action.name}” approved — it's in the Library, ready to bind in any model.`);
                await this.refresh();
            } else {
                this.notice.set(res.error ?? "Approve failed.");
            }
        } finally {
            this.approving.set(false);
        }
    }

    public elapsed(startedAt: string): string {
        const ms = Date.now() - new Date(startedAt).getTime();
        const m = Math.floor(ms / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    }
}
