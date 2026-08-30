import { Injectable, signal } from "@angular/core";
import { Metadata, RunView, UserInfo } from "@memberjunction/core";
import { MJEnvironmentEntity } from "@memberjunction/core-entities";

/** The seeded Sonar Authoring Agent (Loop). See scripts/seed-authoring-agent.mjs — it's created with
 *  this fixed GUID on every install (the seed-hardcoded-UUID convention), so it exists everywhere. */
const SONAR_AUTHORING_AGENT_ID = "CF1D58BA-451E-4515-89BD-AC3F16A19534";
const ENVIRONMENT_ENTITY = "MJ: Environments";
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

    constructor() {
        // Resolve the environment id at runtime rather than pinning a literal — see the field comment.
        void this.resolveDefaultEnvironment();
    }

    /** The Sonar Authoring Agent the chat routes the first message to. */
    public readonly agentId = SONAR_AUTHORING_AGENT_ID;
    /** MJ's Default environment for new conversations. Resolved at runtime (null until then) because
     *  MJ generates the environment id per install — a hardcoded GUID wouldn't exist on any other
     *  deployment, which is exactly what an installable Open App targets. */
    public readonly environmentId = signal<string | null>(null);
    /** Active conversation id — restored from localStorage so the thread continues across reloads;
     *  set when the chat creates a new conversation (conversationCreated). */
    public readonly chatConversationId = signal<string | null>(localStorage.getItem(STORAGE_KEY));

    /** Current user for the chat component (it needs the UserInfo, not just an id). */
    public get currentUser(): UserInfo { return new Metadata().CurrentUser; }

    /** Look up MJ's Default environment so the copilot targets a real environment on any install.
     *  Prefers the IsDefault flag (MJ marks exactly one), falling back to Name='Default'. Best-effort:
     *  leaves environmentId null on failure rather than throwing during service construction. */
    private async resolveDefaultEnvironment(): Promise<void> {
        const find = async (filter: string): Promise<string | null> => {
            const res = await new RunView().RunView<MJEnvironmentEntity>({
                EntityName: ENVIRONMENT_ENTITY,
                ExtraFilter: filter,
                MaxRows: 1,
                ResultType: "entity_object",
            });
            return res.Success ? res.Results?.[0]?.ID ?? null : null;
        };
        const id = (await find("IsDefault = 1")) ?? (await find("Name = 'Default'"));
        if (id) this.environmentId.set(id);
    }

    /** Persist the conversation the chat just created so a reload resumes the same thread. */
    public rememberChatConversation(id: string): void {
        if (!id) return;
        this.chatConversationId.set(id);
        try { localStorage.setItem(STORAGE_KEY, id); } catch { /* best-effort */ }
    }
}
