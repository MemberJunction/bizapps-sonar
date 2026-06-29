import { Component, inject } from "@angular/core";
import { MJConversationEntity } from "@memberjunction/core-entities";
import { SonarAssistantConversationService } from "./sonar-assistant-conversation.service";

/**
 * The Sonar copilot — a DOCKED, resizable, collapsible right-side panel (not a popup), mirroring how
 * Component Studio's builders dock their side panels. Dropped into each Sonar surface so the agent is
 * available everywhere without a dedicated nav tab. When collapsed it shows a thin reopen tab on the
 * right edge. Open/collapsed state, width, and the conversation all live in the shared
 * {@link SonarAssistantConversationService} singleton, so none is lost when a host surface re-renders
 * and recreates this launcher. See plans/agentic-authoring.md §4c.
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
    public readonly width = this.convo.width;

    // Bindings for the embedded <mj-conversation-chat-area>.
    public readonly conversationId = this.convo.chatConversationId;
    public readonly agentId = this.convo.agentId;
    public readonly environmentId = this.convo.environmentId;
    public get currentUser() { return this.convo.currentUser; }

    public toggle(): void {
        this.convo.open.update((v) => !v);
    }

    public close(): void {
        this.convo.open.set(false);
    }

    /** The chat created a new conversation — remember it so a reload resumes the same thread. */
    public onConversationCreated(e: { conversation: MJConversationEntity }): void {
        if (e?.conversation?.ID) this.convo.rememberChatConversation(e.conversation.ID);
    }

    // ---- Resize (drag the panel's left edge) ----
    // The panel is docked to the right, so its width = viewport width − cursor X. Bound handlers are
    // stored so the same references can be removed on mouseup (no leaked document listeners).
    private readonly onResizeMove = (e: MouseEvent): void => {
        this.convo.width.set(window.innerWidth - e.clientX);
    };
    private readonly onResizeEnd = (): void => {
        document.removeEventListener("mousemove", this.onResizeMove);
        document.removeEventListener("mouseup", this.onResizeEnd);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        this.convo.setWidth(this.convo.width()); // clamp + persist the final width
    };

    public onResizeStart(e: MouseEvent): void {
        e.preventDefault();
        document.addEventListener("mousemove", this.onResizeMove);
        document.addEventListener("mouseup", this.onResizeEnd);
        document.body.style.userSelect = "none"; // don't select text while dragging
        document.body.style.cursor = "col-resize";
    }
}
