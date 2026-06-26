import { Component, inject, input, output, signal } from "@angular/core";
import { SonarFactorSmithService, AuthoredFactor } from "../../../../core/services/sonar-factor-smith.service";
import { SonarEngineService } from "../../../../core/services/sonar-engine.service";

/** Result of a sample test run (the value the engine would score + the explainability "why"). */
interface TestResult {
    value: number | null;
    explanation: string | null;
    error?: string;
}

/**
 * Codesmith harness — the factor builder's "Author with AI" tab (plans §5/§12). Describe a signal SQL
 * can't express, ActionSmith writes + tests the code, then REVIEW the generated code, TEST it on a sample
 * record, ITERATE in plain English, and APPROVE it (the governance gate). A thin VIEW over
 * {@link SonarFactorSmithService}: the run (live progress, code, result) lives in that app-scoped
 * singleton, so a host re-render destroying this component mid-run doesn't lose anything. On approval it
 * emits the authored action so the builder binds it.
 */
@Component({
    standalone: false,
    selector: "sonar-codesmith-harness",
    templateUrl: "./sonar-codesmith-harness.component.html",
    styleUrls: ["./sonar-codesmith-harness.component.css"],
})
export class SonarCodesmithHarnessComponent {
    /** Public so the template binds to the shared run state (phase/liveSteps/code/result/errorMsg). */
    public readonly smith = inject(SonarFactorSmithService);
    private readonly engine = inject(SonarEngineService);

    public readonly anchorName = input<string | null>(null);
    /** Anchor + wired sources summary, handed to ActionSmith so generated code targets real data. */
    public readonly context = input<string | null>(null);
    /** A representative anchor record id, so "Test on a sample" works without hunting for one. */
    public readonly sampleAnchorId = input<string | null>(null);

    /** Emitted once the authored action is Approved — the builder binds it as a factor. */
    public readonly authored = output<AuthoredFactor>();
    public readonly cancelled = output<void>();

    public description = "";
    public refinement = "";
    public anchorIdInput = "";
    public readonly testing = signal(false);
    public readonly testResult = signal<TestResult | null>(null);

    /** Author (or re-author with a refinement). State + live feed live in the service. */
    public generate(): void {
        const desc = this.composedDescription();
        if (!desc || this.smith.busy()) return;
        this.testResult.set(null);
        void this.smith.author(desc, this.context());
    }

    /** Run the (unapproved) action against a sample record — the engine allows preview before approval. */
    public async runTest(): Promise<void> {
        const actionId = this.smith.result()?.actionId;
        const anchorId = this.effectiveAnchorId();
        if (!actionId || !anchorId || this.testing()) return;
        this.testing.set(true);
        this.testResult.set(null);
        try {
            this.testResult.set(await this.engine.testFactorAction(actionId, anchorId));
        } catch (e: unknown) {
            this.testResult.set({ value: null, explanation: null, error: e instanceof Error ? e.message : String(e) });
        } finally {
            this.testing.set(false);
        }
    }

    /** Approve the generated code and hand the bound-ready action up to the builder. */
    public async approve(): Promise<void> {
        const res = await this.smith.approve();
        if (res.ok) {
            const authored = this.smith.result();
            if (authored) this.authored.emit(authored);
        }
    }

    /** Clear the run and back out of the lane. */
    public cancel(): void {
        this.smith.reset();
        this.description = "";
        this.refinement = "";
        this.testResult.set(null);
        this.cancelled.emit();
    }

    public effectiveAnchorId(): string {
        return (this.sampleAnchorId() || this.anchorIdInput || "").trim();
    }

    private composedDescription(): string {
        const base = this.description.trim();
        const refine = this.refinement.trim();
        if (!base) return "";
        return refine ? `${base}\n\nRefinement requested: ${refine}` : base;
    }
}
