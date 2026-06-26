import { Component, Input, inject, signal } from "@angular/core";
import { Metadata } from "@memberjunction/core";
import { MJConversationEntity, MJConversationDetailEntity } from "@memberjunction/core-entities";
import { AgentClientService } from "@memberjunction/ng-agent-client";

/** The seeded Sonar Authoring Agent (Loop). See scripts/seed-authoring-agent.mjs. */
const SONAR_AUTHORING_AGENT_ID = "CF1D58BA-451E-4515-89BD-AC3F16A19534";
/** MJ's single Default environment (this deployment has one). */
const DEFAULT_ENVIRONMENT_ID = "F51358F3-9447-4176-B313-BF8025FD8D09";

/** One turn in the panel transcript. */
interface ChatTurn {
    role: "user" | "assistant";
    text: string;
}

/**
 * Copilot panel for the Sonar Authoring Agent, using the MJ-native conversation path: a Conversation
 * pinned to our agent (created lazily) + a ConversationDetail per user message, then
 * `RunAgentFromConversationDetail` — which runs the agent server-side, loads prior turns
 * (MaxHistoryMessages) for multi-turn memory, streams progress, and persists the exchange. (Requires
 * MJ ≥5.43, which exposes ConversationDetail.AgentSessionID — the 5.40.2 server lacked it.) The agent
 * produces DRAFTS only. `contextNote` lets a host inject what the user is viewing so "add a recency
 * factor" acts in context. See plans/agentic-authoring.md §4c.
 */
@Component({
    standalone: false,
    selector: "sonar-assistant-panel",
    templateUrl: "./sonar-assistant-panel.component.html",
    styleUrls: ["./sonar-assistant-panel.component.css"],
})
export class SonarAssistantPanelComponent {
    private readonly agentClient = inject(AgentClientService);

    /** Optional context the host injects, prepended to the first user message. */
    @Input() public contextNote: string | null = null;

    public readonly turns = signal<ChatTurn[]>([]);
    public readonly running = signal(false);
    /** Live status line during a run (streamed from the agent). */
    public readonly progress = signal<string | null>(null);
    public readonly errorMsg = signal<string | null>(null);
    public prompt = "";

    /** The conversation this panel writes into — created lazily, pinned to our agent. */
    private conversationId: string | null = null;
    private firstSend = true;

    public async send(): Promise<void> {
        const text = this.prompt.trim();
        if (!text || this.running()) return;
        this.prompt = "";
        this.errorMsg.set(null);
        this.turns.update((t) => [...t, { role: "user", text }]);
        this.running.set(true);
        this.progress.set("Thinking…");

        try {
            const content = this.firstSend && this.contextNote ? `${this.contextNote}\n\n${text}` : text;
            this.firstSend = false;
            const detailId = await this.saveUserMessage(content);
            const result = await this.agentClient.RunAgentFromConversationDetail({
                ConversationDetailId: detailId,
                AgentId: SONAR_AUTHORING_AGENT_ID,
                MaxHistoryMessages: 20,
                OnProgress: (p) => this.progress.set(this.formatProgress(p)),
            });
            if (result.Success) {
                this.turns.update((t) => [...t, { role: "assistant", text: this.renderResult(result.Result) }]);
            } else {
                this.errorMsg.set(result.ErrorMessage || "The agent couldn't complete that.");
            }
        } catch (e: unknown) {
            this.errorMsg.set(e instanceof Error ? e.message : String(e));
        } finally {
            this.running.set(false);
            this.progress.set(null);
        }
    }

    /** Enter sends; Shift+Enter is a newline. */
    public onKeydown(e: KeyboardEvent): void {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void this.send();
        }
    }

    /** Ensure a Conversation exists (pinned to our agent), then save the user message as a
     *  ConversationDetail and return its ID for the agent run. */
    private async saveUserMessage(content: string): Promise<string> {
        const md = new Metadata();
        if (!this.conversationId) {
            const conv = await md.GetEntityObject<MJConversationEntity>("MJ: Conversations");
            conv.NewRecord();
            conv.Name = "Sonar Authoring";
            conv.UserID = md.CurrentUser.ID;
            conv.EnvironmentID = DEFAULT_ENVIRONMENT_ID;
            conv.DefaultAgentID = SONAR_AUTHORING_AGENT_ID;
            if (!(await conv.Save())) {
                throw new Error(conv.LatestResult?.Message || "Could not start a conversation.");
            }
            this.conversationId = conv.ID;
        }
        const detail = await md.GetEntityObject<MJConversationDetailEntity>("MJ: Conversation Details");
        detail.NewRecord();
        detail.ConversationID = this.conversationId;
        detail.Role = "User";
        detail.Message = content;
        if (!(await detail.Save())) {
            throw new Error(detail.LatestResult?.Message || "Could not save your message.");
        }
        return detail.ID;
    }

    /** One readable status line from a streamed progress update. */
    private formatProgress(p: { Message?: string; CurrentStep?: string; StatusMessage?: string }): string {
        return p.Message ?? p.StatusMessage ?? p.CurrentStep ?? "Working…";
    }

    /** Coax a human-readable reply out of the agent's result payload. */
    private renderResult(result: unknown): string {
        if (typeof result === "string" && result.trim()) return result;
        if (result && typeof result === "object") {
            const r = result as Record<string, unknown>;
            for (const key of ["message", "Message", "summary", "Summary"]) {
                const v = r[key];
                if (typeof v === "string" && v.trim()) return v;
            }
            const payload = r["payload"] as { message?: unknown } | undefined;
            if (payload && typeof payload.message === "string" && payload.message.trim()) return payload.message;
        }
        return "Done — your draft is ready. Open the Model Builder to review it.";
    }
}
