import { Component, EventEmitter, Input, Output, computed, inject, signal } from "@angular/core";
import { ToastService } from "../../../../core/services/toast.service";
import {
    InterventionRunCounts,
    RunInterventionInput,
    SonarEngineService,
} from "../../../../core/services/sonar-engine.service";

/** A messaging action the demo can fire. All post to ONE destination the operator controls (a
 *  webhook URL), so a run can never reach members' real contacts — it lands in your channel. */
interface InterventionChannel {
    /** Registered MJ Action name. */
    name: string;
    label: string;
    /** The action's URL param + message param (Slack/Teams both use WebhookURL + Message). */
    urlParam: string;
    urlLabel: string;
    msgParam: string;
}

/**
 * Playbook enroller — fires a real action-layer intervention against the current cohort. Builds the
 * group + play on the fly (the EM's band/score filter → an ad-hoc segment; the chosen webhook action
 * → the play), splits treated/held-back, and fires per treated member. Guardrails: Preview (dry-run)
 * before Launch, a treated-count cap, and idempotent re-runs (the engine skips already-assigned).
 */
@Component({
    standalone: false,
    selector: "sonar-playbook-enroller",
    // Without the shared sheet, .sonar-modal/.sonar-input/.sonar-btn are unstyled here (Angular
    // emulated encapsulation scopes CSS per-component).
    styleUrls: ["../../../../shared/styles/sonar-shell.css"],
    templateUrl: "./sonar-playbook-enroller.component.html",
})
export class SonarPlaybookEnrollerComponent {
    private readonly engine = inject(SonarEngineService);
    private readonly toast = inject(ToastService);

    /** Cohort size shown in the split diagram (the EM's current filtered total). */
    @Input() public totalMembers = 0;
    /** The model + score-only filter that define the cohort (passed from the EM). */
    @Input() public modelId: string | null = null;
    @Input() public bandId: string | null = null;
    @Input() public minScore: number | null = null;
    @Input() public maxScore: number | null = null;
    @Input() public cohortLabel = "cohort";

    @Output() public readonly close = new EventEmitter<void>();

    /** Messaging actions that fire to a single webhook destination (zero-setup, can't spam members). */
    public readonly channels: InterventionChannel[] = [
        { name: "Slack Webhook", label: "Slack (webhook)", urlParam: "WebhookURL", urlLabel: "Slack webhook URL", msgParam: "Message" },
        { name: "Teams Webhook", label: "Teams (webhook)", urlParam: "WebhookURL", urlLabel: "Teams webhook URL", msgParam: "Message" },
    ];
    public readonly channel = signal<InterventionChannel>(this.channels[0]);
    public readonly webhookUrl = signal("");
    public readonly message = signal("Sonar re-engagement: member {{member}} is at risk.");
    public readonly holdoutPct = signal(10);
    /** Real-fire safety cap — how many members this run may assign (the rest wait for a later run). */
    public readonly cap = signal(10);

    public readonly previewing = signal(false);
    public readonly launching = signal(false);
    /** Set after a successful Preview — gates Launch (you must preview before you fire). */
    public readonly preview = signal<InterventionRunCounts | null>(null);
    public readonly error = signal("");

    public readonly canRun = computed(
        () => !!this.modelId && this.webhookUrl().trim().length > 0 && !this.previewing() && !this.launching(),
    );

    /** Switch channel — clears any stale preview (it was for the previous channel/config). */
    public onChannelChange(name: string): void {
        const c = this.channels.find((x) => x.name === name);
        if (c) {
            this.channel.set(c);
            this.preview.set(null);
        }
    }

    /** Any config edit invalidates a prior preview. */
    public onConfigChange(): void {
        this.preview.set(null);
    }

    /** Dry-run: resolve the cohort + split and show "will fire N", firing nothing. */
    public async runPreview(): Promise<void> {
        if (!this.canRun()) return;
        this.previewing.set(true);
        this.error.set("");
        const res = await this.engine.runIntervention(this.buildInput(), true);
        this.previewing.set(false);
        if (res.errors.length > 0) {
            this.error.set(res.errors[0]);
            return;
        }
        this.preview.set(res.counts);
    }

    /** Commit: write assignments + fire the action for treated members. Requires a prior preview. */
    public async launch(): Promise<void> {
        if (!this.canRun() || !this.preview()) return;
        this.launching.set(true);
        this.error.set("");
        const res = await this.engine.runIntervention(this.buildInput(), false);
        this.launching.set(false);
        if (res.errors.length > 0) {
            this.error.set(res.errors[0]);
            return;
        }
        const c = res.counts;
        const failedNote = c && c.failed > 0 ? `, ${c.failed} failed` : "";
        this.toast.success(
            `Fired ${c?.sent ?? 0} ${this.channel().label} message(s), held back ${c?.held ?? 0}${failedNote}.`,
        );
        this.close.emit();
    }

    private buildInput(): RunInterventionInput {
        const c = this.channel();
        return {
            modelId: this.modelId as string,
            segmentName: `Ad-hoc: ${this.cohortLabel}`,
            filter: { bandId: this.bandId, minScore: this.minScore, maxScore: this.maxScore },
            interventionName: `${c.label} — ${this.cohortLabel}`,
            holdoutPercent: this.holdoutPct(),
            actionName: c.name,
            actionParams: [
                { name: c.urlParam, value: this.webhookUrl().trim() },
                { name: c.msgParam, value: this.message() },
            ],
            cap: this.cap(),
        };
    }
}
