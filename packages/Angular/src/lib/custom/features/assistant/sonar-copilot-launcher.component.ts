import { Component, inject } from "@angular/core";
import { SonarAssistantConversationService } from "./sonar-assistant-conversation.service";

/**
 * A floating copilot launcher — a fixed-position button (bottom-right, beside MJ's shell chat) that
 * pops the Sonar Authoring Agent panel as an overlay. Dropped into each Sonar surface so the agent is
 * available everywhere without a dedicated nav tab. Open state + the conversation live in the shared
 * {@link SonarAssistantConversationService} singleton, so neither the panel nor its transcript is lost
 * when a host surface re-renders and recreates this launcher. See plans/agentic-authoring.md §4c.
 */
@Component({
    standalone: false,
    selector: "sonar-copilot-launcher",
    templateUrl: "./sonar-copilot-launcher.component.html",
    styleUrls: ["./sonar-copilot-launcher.component.css"],
})
export class SonarCopilotLauncherComponent {
    private readonly convo = inject(SonarAssistantConversationService);

    public readonly open = this.convo.open;

    public toggle(): void {
        this.convo.open.update((v) => !v);
    }

    public close(): void {
        this.convo.open.set(false);
    }
}
