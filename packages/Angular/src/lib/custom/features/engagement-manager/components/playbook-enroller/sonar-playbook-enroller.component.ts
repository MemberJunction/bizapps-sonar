import { Component, EventEmitter, Input, Output, signal } from "@angular/core";
import { ToastService } from "../../../../core/services/toast.service";

@Component({
    standalone: false,
    selector: "sonar-playbook-enroller",
    templateUrl: "./sonar-playbook-enroller.component.html",
    // Without the shared sheet, .sonar-modal/.sonar-input/.sonar-btn are unstyled in this
    // component (Angular emulated encapsulation scopes CSS per-component), so the dialog
    // rendered as plain inline divs instead of a fixed, centered overlay.
    styleUrls: ["../../../../shared/styles/sonar-shell.css"],
})
export class SonarPlaybookEnrollerComponent {
    /** Total number of members in the cohort. */
    @Input() public totalMembers = 0;

    /** Emitted when the modal closes (Cancel / Scrim / Confirm). */
    @Output() public readonly close = new EventEmitter<void>();

    public readonly selectedPlaybook = signal("At-Risk Winback Sequence (Email)");
    public readonly holdoutPct = signal(10);
    public readonly isEnrolling = signal(false);

    public readonly playbooks = [
        { id: "winback", name: "At-Risk Winback Sequence (Email)", channel: "Email Campaign" },
        { id: "call_list", name: "Critical Churn Prevention (Outbound Call)", channel: "Executive Phone Outbox" },
        { id: "special_offer", name: "Member Reactivation Offer (SMS)", channel: "SMS Broadcast" }
    ];

    constructor(private readonly toast: ToastService) {}

    public async launchPlaybook(): Promise<void> {
        this.isEnrolling.set(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        this.isEnrolling.set(false);
        this.toast.success(`Successfully enrolled cohort in "${this.selectedPlaybook()}" with a ${this.holdoutPct()}% control holdout group!`);
        this.close.emit();
    }
}
