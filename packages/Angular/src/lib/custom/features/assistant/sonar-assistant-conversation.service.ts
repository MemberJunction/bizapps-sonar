import { Injectable, inject, signal } from "@angular/core";
import { Metadata } from "@memberjunction/core";
import { MJConversationEntity, MJConversationDetailEntity } from "@memberjunction/core-entities";
import { AgentClientService } from "@memberjunction/ng-agent-client";

/** The seeded Sonar Authoring Agent (Loop). See scripts/seed-authoring-agent.mjs. */
const SONAR_AUTHORING_AGENT_ID = "CF1D58BA-451E-4515-89BD-AC3F16A19534";
/** MJ's single Default environment (this deployment has one). */
const DEFAULT_ENVIRONMENT_ID = "F51358F3-9447-4176-B313-BF8025FD8D09";
/** Remembers the active conversation across a full page reload (so the agent thread continues). */
const STORAGE_KEY = "sonar-assistant-conversation-id";

/** One step the agent took during a run (for the oversight feed). `isAction` = a real tool/action
 *  call (Build Model, etc.) vs. internal reasoning — actions get the prominent treatment. */
export interface AgentStep {
    label: string;
    isAction: boolean;
}

/** A selectable option in a choice question. */
export interface FormOption {
    value: string | number | boolean;
    label: string;
}
/** One question in a response form (a view-model subset of MJ's FormQuestion — the fields we render). */
export interface FormQuestion {
    id: string;
    label: string;
    type: { type: string; options?: FormOption[]; multiple?: boolean; placeholder?: string };
    required?: boolean;
    helpText?: string;
}
/** A structured form the agent attached to a turn to collect input (mirrors MJ's AgentResponseForm).
 *  The agent emits these to offer choices/confirmation — e.g. "pick which factors to add". */
export interface ResponseForm {
    title?: string;
    description?: string;
    submitLabel?: string;
    questions: FormQuestion[];
}

/** One turn in the panel transcript. Assistant turns carry the steps the agent took (oversight) and
 *  optionally a structured form to collect the user's next input. */
export interface ChatTurn {
    role: "user" | "assistant";
    text: string;
    steps?: AgentStep[];
    form?: ResponseForm;
}

/** The progress event RunAgentFromConversationDetail streams to OnProgress (PascalCase on this path).
 *  `CurrentStep` is an enum-like step name ('action_execution', 'prompt_execution', …); for action
 *  steps `Metadata.actionNames` holds the real action names — read those, never sniff the markdown. */
interface AgentProgressEvent {
    CurrentStep?: string;
    Message?: string;
    Metadata?: Record<string, unknown>;
}

/**
 * Holds the Sonar copilot conversation in an APP-SCOPED singleton so the transcript survives the panel
 * being destroyed — whether the user toggles it closed or the host surface re-renders and recreates the
 * launcher. The floating panel/launcher are throwaway views; the conversation lives here. Owns the whole
 * engine (send → save ConversationDetail → RunAgentFromConversationDetail → oversight steps) so an
 * in-flight run isn't lost if the panel closes mid-run. A full page reload does drop the in-memory
 * transcript, but the conversation id is persisted so the agent thread continues server-side. The agent
 * produces DRAFTS only. See plans/agentic-authoring.md §4c.
 */
@Injectable({ providedIn: "root" })
export class SonarAssistantConversationService {
    private readonly agentClient = inject(AgentClientService);

    /** Whether the floating panel is open — kept here so it survives a host-surface re-render. */
    public readonly open = signal(false);
    public readonly turns = signal<ChatTurn[]>([]);
    public readonly running = signal(false);
    /** The agent's actions/steps for the in-flight run (the live oversight feed). */
    public readonly liveSteps = signal<AgentStep[]>([]);
    public readonly errorMsg = signal<string | null>(null);
    /** Response-form state — kept HERE (not on the panel) so a panel re-render doesn't wipe an
     *  in-progress selection. Selections keyed `${turnIndex}:${questionId}` → chosen option values;
     *  submittedForms keyed by turn index. */
    public readonly formSelections = signal<Record<string, string[]>>({});
    public readonly submittedForms = signal<Record<number, boolean>>({});

    private conversationId: string | null = null;
    private firstSend = true;

    constructor() {
        // Continue the prior thread after a full reload: restore the conversation id so the agent keeps
        // its server-side history. We don't rebuild the visual transcript from ConversationDetail — in
        // this MJ version the agent's own replies are persisted under Role='User' with no AgentID, so
        // there's no reliable speaker signal to reconstruct user-vs-assistant bubbles from.
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            this.conversationId = stored;
            this.firstSend = false;
        }
    }

    /** Send a user message and run the agent. `contextNote` (what the host surface shows) is prepended
     *  to the FIRST message only. Safe to call even if the view that triggered it is later destroyed. */
    public async send(text: string, contextNote: string | null): Promise<void> {
        const trimmed = text.trim();
        if (!trimmed || this.running()) return;
        this.errorMsg.set(null);
        this.liveSteps.set([]);
        this.turns.update((t) => [...t, { role: "user", text: trimmed }]);
        this.running.set(true);

        try {
            const content = this.firstSend && contextNote ? `${contextNote}\n\n${trimmed}` : trimmed;
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
                const form = this.extractForm(result.Result);
                this.turns.update((t) => [...t, { role: "assistant", text: this.extractReply(result.Result), steps, form }]);
            } else {
                this.errorMsg.set(result.ErrorMessage || "The agent couldn't complete that.");
            }
        } catch (e: unknown) {
            this.errorMsg.set(e instanceof Error ? e.message : String(e));
        } finally {
            this.running.set(false);
        }
    }

    /** Turn a streamed progress event into oversight step(s). Reads the engine's STRUCTURED fields:
     *  an `action_execution` step with `Metadata.actionNames` is a real tool call; everything else is
     *  reasoning narration. (No markdown-sniffing — that broke the day a progress message changed shape.) */
    private recordStep(p: AgentProgressEvent): void {
        const actionNames = this.actionNamesOf(p);
        if (p.CurrentStep === "action_execution" && actionNames.length) {
            for (const name of actionNames) this.pushStep({ label: this.toolLabel(name), isAction: true });
            return;
        }
        const text = (p.Message ?? p.CurrentStep ?? "").trim();
        if (text) this.pushStep({ label: this.cleanLabel(text), isAction: false });
    }

    /** The action names on an `action_execution` progress event (Metadata.actionNames), if any. */
    private actionNamesOf(p: AgentProgressEvent): string[] {
        const names = p.Metadata?.["actionNames"];
        return Array.isArray(names) ? names.filter((n): n is string => typeof n === "string") : [];
    }

    /** Append a step, de-duping a consecutive repeat. */
    private pushStep(step: AgentStep): void {
        this.liveSteps.update((s) => {
            const last = s[s.length - 1];
            if (last && last.label === step.label && last.isAction === step.isAction) return s;
            return [...s, step];
        });
    }

    /** "Sonar: Build Model" → "Build Model" for a tidy feed label. */
    private toolLabel(name: string): string {
        return name.replace(/^Sonar:\s*/i, "").trim() || name;
    }

    /** First line, markdown emphasis stripped, length-capped — for reasoning narration. */
    private cleanLabel(s: string): string {
        const line = s.split("\n")[0].replace(/\*\*/g, "").trim();
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
            localStorage.setItem(STORAGE_KEY, conv.ID); // continue this thread after a full reload
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

    /** Pull the agent's reply from the STRUCTURED result. The result is an ExecuteAgentResult whose
     *  canonical final message is `agentRun.Message` (the same field the eval reads). The old code
     *  guessed TOP-LEVEL keys (message/summary) that don't exist on that shape, so every chat reply
     *  silently fell through to the generic line below. */
    private extractReply(result: unknown): string {
        if (result && typeof result === "object") {
            const r = result as { agentRun?: { Message?: unknown }; payload?: unknown };
            if (typeof r.agentRun?.Message === "string" && r.agentRun.Message.trim()) return r.agentRun.Message;
            const fromPayload = this.payloadMessage(r.payload);
            if (fromPayload) return fromPayload;
        }
        if (typeof result === "string" && result.trim()) return result;
        return "Done — your draft is ready. Open the Model Builder to review it.";
    }

    /** Pull a structured response form off the result (the agent's choices/confirmation UI), if present. */
    private extractForm(result: unknown): ResponseForm | undefined {
        if (result && typeof result === "object") {
            const rf = (result as { responseForm?: unknown }).responseForm;
            if (rf && typeof rf === "object" && Array.isArray((rf as ResponseForm).questions)) {
                return rf as ResponseForm;
            }
        }
        return undefined;
    }

    /** A payload can be a bare string or an object carrying a `message`/`summary`. */
    private payloadMessage(payload: unknown): string | null {
        if (typeof payload === "string" && payload.trim()) return payload;
        if (payload && typeof payload === "object") {
            const p = payload as Record<string, unknown>;
            for (const key of ["message", "summary"]) {
                const v = p[key];
                if (typeof v === "string" && v.trim()) return v;
            }
        }
        return null;
    }
}
