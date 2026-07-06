import { Component, OnDestroy, computed, inject, signal } from "@angular/core";
import { RegisterClass } from "@memberjunction/global";
import { BaseResourceComponent } from "@memberjunction/ng-shared";
import { ResourceData } from "@memberjunction/core-entities";
import { SonarFactorSmithService, InFlightJob, TestModel, SignalSampleRow, JobStep, FailedJob, AnchorRecordOption, AnchorField, SignalVersion } from "../../core/services/sonar-factor-smith.service";

/** One line of a rendered diff between two code versions. */
interface DiffRow { type: "ctx" | "add" | "del"; text: string }
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
    /** Bind + manage: target model for binding, its weight, the library filter, inline-rename buffer. */
    public bindModelId: string | null = null;
    public bindWeight = 0.25;
    public librarySearch = "";
    public renameName = "";

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

    public readonly binding = signal(false);
    public readonly renamingId = signal<string | null>(null);
    public readonly archivingId = signal<string | null>(null);

    /**
     * Version history is HIDDEN for now. The UI (panel, LCS diff, rollback) is storage-agnostic and
     * complete; only the backend needs to move from per-browser localStorage to a DB table so a HOSTED,
     * multi-user MJ instance shares one history. Flip this to true once the server-side version store
     * lands (then swap SonarFactorSmithService.versions/recordVersion to hit the DB). Until then we neither
     * render the panel nor write any localStorage, so nothing half-baked ships.
     */
    public readonly historyEnabled = false;

    /** Version history snapshots of this signal's code + the one being diffed vs current. */
    public readonly history = signal<SignalVersion[]>([]);
    public readonly showHistory = signal(false);
    public readonly diffVersion = signal<SignalVersion | null>(null);

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

    /** Unified line diff between the version under inspection and the current code (added/removed/context). */
    public readonly diffRows = computed<DiffRow[]>(() => {
        const v = this.diffVersion();
        if (!v) return [];
        return this.computeDiff(v.code, this.code());
    });

    /** Only Draft models can take a new factor (published config is immutable) — the bind targets. */
    public readonly bindableModels = computed(() => this.models().filter((m) => m.status === "Draft"));
    /** Library filtered by the search box (name match) — keeps a long catalog navigable. A method, not a
     *  computed: librarySearch is a plain [(ngModel)] property, so a computed wouldn't invalidate on type. */
    public filteredLibrary(): FactorAction[] {
        const q = this.librarySearch.trim().toLowerCase();
        return q ? this.library().filter((a) => a.name.toLowerCase().includes(q)) : this.library();
    }

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
        this.showHistory.set(false);
        this.diffVersion.set(null);
        this.code.set("");
        const code = await this.smith.getCode(action.id);
        this.code.set(code);
        // Snapshot what we're seeing — captures commissions and AI refines (server-side) the first time
        // they're viewed; recordVersion dedups so re-opening unchanged code is a no-op. Gated off until the
        // DB-backed store lands (see historyEnabled) so we don't write per-browser history meanwhile.
        if (this.historyEnabled && action.kind === "runtime" && code) {
            const note = this.smith.versions(action.id).length ? "Updated (refine/edit)" : "Initial version";
            this.smith.recordVersion(action.id, code, note);
        }
        this.history.set(this.historyEnabled ? this.smith.versions(action.id) : []);
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
                if (this.historyEnabled) {
                    this.smith.recordVersion(action.id, this.editCode, "Manual edit");
                    this.history.set(this.smith.versions(action.id));
                }
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

    /** Bind the selected (approved) signal into the chosen Draft model's rubric. */
    public async bind(): Promise<void> {
        const action = this.selected();
        if (!action || !this.bindModelId || this.binding()) return;
        this.binding.set(true);
        try {
            const res = await this.smith.bindSignal(action.id, this.bindModelId, this.bindWeight);
            if (res.ok) {
                const model = this.models().find((m) => m.id === this.bindModelId);
                this.notice.set(`Added “${action.name}” to ${model?.name ?? "the model"} (weight ${this.bindWeight}). Tune it in the model builder.`);
                this.bindModelId = null;
            } else {
                this.notice.set(res.error ?? "Couldn't bind the signal.");
            }
        } finally {
            this.binding.set(false);
        }
    }

    /** Begin an inline rename of the selected signal. */
    public startRename(): void {
        const action = this.selected();
        if (!action) return;
        this.renameName = action.name;
        this.renamingId.set(action.id);
    }
    public cancelRename(): void { this.renamingId.set(null); }

    /** Save the inline rename. */
    public async saveRename(): Promise<void> {
        const action = this.selected();
        const name = this.renameName.trim();
        if (!action || !name || this.renamingId() !== action.id) return;
        const res = await this.smith.renameSignal(action.id, name);
        if (res.ok) {
            this.renamingId.set(null);
            this.notice.set(`Renamed to “${name}”.`);
            await this.refresh();
        } else {
            this.notice.set(res.error ?? "Rename failed.");
        }
    }

    /** Archive (Disabled) the selected signal — drops it from the catalog without hard-deleting. */
    public async archive(): Promise<void> {
        const action = this.selected();
        if (!action || this.archivingId()) return;
        this.archivingId.set(action.id);
        try {
            const res = await this.smith.archiveSignal(action.id);
            if (res.ok) {
                this.notice.set(`Archived “${action.name}”. Models already using it keep their config.`);
                this.selected.set(null);
                await this.refresh();
            } else {
                this.notice.set(res.error ?? "Archive failed.");
            }
        } finally {
            this.archivingId.set(null);
        }
    }

    /** Show/hide the version-history panel. */
    public toggleHistory(): void {
        this.showHistory.update((v) => !v);
        if (!this.showHistory()) this.diffVersion.set(null);
    }

    /** Diff a chosen version against the current code (toggle off if it's already open). */
    public viewDiff(version: SignalVersion): void {
        this.diffVersion.set(this.diffVersion() === version ? null : version);
    }

    /** Roll the signal back to a chosen version's code — saved like any edit, so it lands Pending. */
    public async rollback(version: SignalVersion): Promise<void> {
        const action = this.selected();
        if (!action || this.saving()) return;
        this.saving.set(true);
        try {
            const res = await this.smith.saveCode(action.id, version.code);
            if (res.ok) {
                this.code.set(version.code);
                this.smith.recordVersion(action.id, version.code, "Rolled back");
                this.history.set(this.smith.versions(action.id));
                this.diffVersion.set(null);
                this.testRows.set([]);
                this.notice.set(`Rolled “${action.name}” back to the ${this.relativeTime(version.savedAt)} version — back to Pending.`);
                await this.refresh();
            } else {
                this.notice.set(res.error ?? "Rollback failed.");
            }
        } finally {
            this.saving.set(false);
        }
    }

    /**
     * Unified line diff (LCS) between two code snapshots — context/added/removed rows. Small inputs
     * (a factor's code), so the O(n·m) table is fine; keeps us off a diff dependency.
     */
    private computeDiff(oldCode: string, newCode: string): DiffRow[] {
        const a = oldCode.split("\n");
        const b = newCode.split("\n");
        const lcs: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
        for (let i = a.length - 1; i >= 0; i--) {
            for (let j = b.length - 1; j >= 0; j--) {
                lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
            }
        }
        const rows: DiffRow[] = [];
        let i = 0, j = 0;
        while (i < a.length && j < b.length) {
            if (a[i] === b[j]) { rows.push({ type: "ctx", text: a[i] }); i++; j++; }
            else if (lcs[i + 1][j] >= lcs[i][j + 1]) { rows.push({ type: "del", text: a[i] }); i++; }
            else { rows.push({ type: "add", text: b[j] }); j++; }
        }
        while (i < a.length) rows.push({ type: "del", text: a[i++] });
        while (j < b.length) rows.push({ type: "add", text: b[j++] });
        return rows;
    }

    /** Coarse "x minutes/hours/days ago" for version labels. */
    public relativeTime(iso: string): string {
        const ms = Date.now() - new Date(iso).getTime();
        const m = Math.floor(ms / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
        if (d > 0) return `${d}d ago`;
        if (h > 0) return `${h}h ago`;
        if (m > 0) return `${m}m ago`;
        return "just now";
    }

    public elapsed(startedAt: string): string {
        const ms = Date.now() - new Date(startedAt).getTime();
        const m = Math.floor(ms / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    }
}
