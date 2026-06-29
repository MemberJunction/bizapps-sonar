import { Injectable, signal } from "@angular/core";
import { Metadata, UserInfo } from "@memberjunction/core";

/** The seeded Sonar Authoring Agent (Loop). See scripts/seed-authoring-agent.mjs. */
const SONAR_AUTHORING_AGENT_ID = "CF1D58BA-451E-4515-89BD-AC3F16A19534";
/** MJ's single Default environment (this deployment has one). */
const DEFAULT_ENVIRONMENT_ID = "F51358F3-9447-4176-B313-BF8025FD8D09";
/** Remembers the active conversation across a full page reload (so the thread resumes). */
const STORAGE_KEY = "sonar-assistant-conversation-id";
/** Remembers the docked panel width across reloads. */
const WIDTH_KEY = "sonar-assistant-panel-width";
/** Panel width bounds (px) — keep it usable but never more than ~half the viewport. */
const MIN_WIDTH = 320;
const MAX_WIDTH = 760;
const DEFAULT_WIDTH = 440;

/** Clamp a width to the allowed range (and discard NaN). */
function clampWidth(px: number): number {
    if (!Number.isFinite(px)) return DEFAULT_WIDTH;
    return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(px)));
}

/**
 * App-scoped state for the Sonar copilot. The floating launcher embeds MJ's native
 * <mj-conversation-chat-area>, which owns the transcript, streaming, persistence, and multi-turn — so
 * this service just holds the few bindings that must survive the launcher being recreated on a
 * host-surface re-render: the open/closed flag and the active conversation id (persisted to localStorage
 * so a reload resumes the same thread). The agent produces DRAFTS only. See plans/agentic-authoring.md §12.
 */
@Injectable({ providedIn: "root" })
export class SonarAssistantConversationService {
    /** Whether the docked panel is expanded — kept here so it survives a host-surface re-render.
     *  Collapsed (false) shows just the reopen tab. */
    public readonly open = signal(false);

    /** Docked-panel width (px), restored from localStorage and persisted on resize. */
    public readonly width = signal<number>(
        clampWidth(Number(localStorage.getItem(WIDTH_KEY) ?? DEFAULT_WIDTH)),
    );

    /** Set + persist the panel width (clamped to the usable range). */
    public setWidth(px: number): void {
        const w = clampWidth(px);
        this.width.set(w);
        try { localStorage.setItem(WIDTH_KEY, String(w)); } catch { /* best-effort */ }
    }

    /** The Sonar Authoring Agent the chat routes the first message to. */
    public readonly agentId = SONAR_AUTHORING_AGENT_ID;
    /** MJ Default environment for new conversations. */
    public readonly environmentId = DEFAULT_ENVIRONMENT_ID;
    /** Active conversation id — restored from localStorage so the thread continues across reloads;
     *  set when the chat creates a new conversation (conversationCreated). */
    public readonly chatConversationId = signal<string | null>(localStorage.getItem(STORAGE_KEY));

    /** Current user for the chat component (it needs the UserInfo, not just an id). */
    public get currentUser(): UserInfo { return new Metadata().CurrentUser; }

    /** Persist the conversation the chat just created so a reload resumes the same thread. */
    public rememberChatConversation(id: string): void {
        if (!id) return;
        this.chatConversationId.set(id);
        try { localStorage.setItem(STORAGE_KEY, id); } catch { /* best-effort */ }
    }
}
