import { Component, signal } from "@angular/core";

/**
 * A floating copilot launcher — a fixed-position button (bottom-right, beside MJ's shell chat) that
 * pops the Sonar Authoring Agent panel as an overlay. Dropped into each Sonar surface so the agent is
 * available everywhere without a dedicated nav tab. Self-contained (owns its open/close state); hosts
 * the reusable <sonar-assistant-panel>. See plans/agentic-authoring.md §4c.
 */
@Component({
    standalone: false,
    selector: "sonar-copilot-launcher",
    templateUrl: "./sonar-copilot-launcher.component.html",
    styleUrls: ["./sonar-copilot-launcher.component.css"],
})
export class SonarCopilotLauncherComponent {
    public readonly open = signal(false);

    public toggle(): void {
        this.open.update((v) => !v);
    }

    public close(): void {
        this.open.set(false);
    }
}
