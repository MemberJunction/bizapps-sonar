import { Component, Input, inject, signal } from "@angular/core";
import { Metadata } from "@memberjunction/core";
import { MJConversationEntity, MJConversationDetailEntity } from "@memberjunction/core-entities";
import { AgentClientService } from "@memberjunction/ng-agent-client";

/** The seeded Sonar Authoring Agent (Loop). See scripts/seed-authoring-agent.mjs. */
const SONAR_AUTHORING_AGENT_ID = "CF1D58BA-451E-4515-89BD-AC3F16A19534";
/** MJ's single Default environment (this deployment has one). */
const DEFAULT_ENVIRONMENT_ID = "F51358F3-9447-4176-B313-BF8025FD8D09";

/** One step the agent took during a run (for the oversight feed). `isAction` = an actual tool/action
 *  call (Create Model, etc.) vs. internal reasoning — actions get the prominent treatment. */
interface AgentStep {
    label: string;
    isAction: boolean;
}

/** One turn in the panel transcript. Assistant turns carry the steps the agent took (oversight). */
interface ChatTurn {
    role: "user" | "assistant";
    text: string;
    steps?: AgentStep[];
}

/**
 * Copilot panel for the Sonar Authoring Agent (MJ-native conversation path, MJ ≥5.43). Creates a
 * Conversation pinned to our agent + a ConversationDetail per message, then
 * `RunAgentFromConversationDetail` (multi-turn history, streamed progress, persistence). The agent
 * produces DRAFTS only — and every action it takes is surfaced as a visible **oversight feed** so the
 * operator sees exactly what it did (created a model, added a factor…). `contextNote` lets a host
 * inject what the user is viewing. See plans/agentic-authoring.md §4c.
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
    /** The agent's actions/steps for the in-flight run (the live oversight feed). */
    public readonly liveSteps = signal<AgentStep[]>([]);
    public readonly errorMsg = signal<string | null>(null);
    public prompt = "";

    private conversationId: string | null = null;
    private firstSend = true;

    public async send(): Promise<void> {
        const text = this.prompt.trim();
        if (!text || this.running()) return;
        this.prompt = "";
        this.errorMsg.set(null);
        this.liveSteps.set([]);
        this.turns.update((t) => [...t, { role: "user", text }]);
        this.running.set(true);

        try {
            const content = this.firstSend && this.contextNote ? `${this.contextNote}\n\n${text}` : text;
            this.firstSend = false;
            const detailId = await this.saveUserMessage(content);
            const result = await this.agentClient.RunAgentFromConversationDetail({
                ConversationDetailId: detailId,
                AgentId: SONAR_AUTHORING_AGENT_ID,
                MaxHistoryMessages: 20,
                OnProgress: (p) => this.recordStep(p),
            });
            const steps = this.liveSteps();
            if (result.Success) {
                this.turns.update((t) => [...t, { role: "assistant", text: this.renderResult(result.Result), steps }]);
            } else {
                this.errorMsg.set(result.ErrorMessage || "The agent couldn't complete that.");
            }
        } catch (e: unknown) {
            this.errorMsg.set(e instanceof Error ? e.message : String(e));
        } finally {
            this.running.set(false);
        }
    }

    /** Enter sends; Shift+Enter is a newline. */
    public onKeydown(e: KeyboardEvent): void {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void this.send();
        }
    }

    /** Turn a streamed progress event into an oversight step, de-duping consecutive repeats. */
    private recordStep(p: { Message?: string; CurrentStep?: string; StatusMessage?: string }): void {
        const raw = (p.Message ?? p.StatusMessage ?? p.CurrentStep ?? "").trim();
        if (!raw) return;
        // "Executing **Sonar: Create Model** action with parameters…" → action label "Create Model".
        const actionMatch = raw.match(/\*\*(?:Sonar:\s*)?(.+?)\*\*/);
        const step: AgentStep = actionMatch
            ? { label: actionMatch[1], isAction: true }
            : { label: this.firstLine(raw), isAction: false };
        this.liveSteps.update((s) => {
            const last = s[s.length - 1];
            if (last && last.label === step.label && last.isAction === step.isAction) return s;
            return [...s, step];
        });
    }

    private firstLine(s: string): string {
        const line = s.split("\n")[0].trim();
        return line.length > 90 ? line.slice(0, 88) + "…" : line;
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
