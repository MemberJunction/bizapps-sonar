import { Component, Input, signal } from "@angular/core";
import { Metadata } from "@memberjunction/core";
import { ActionEngineBase } from "@memberjunction/actions-base";
import { GraphQLActionClient, GraphQLDataProvider } from "@memberjunction/graphql-dataprovider";
import { extractActionParam } from "../../core/services/action-result.util";

/** Registered Name of the server-side action that runs the agent (resolved to an ID at runtime). */
const ACTION_RUN_AUTHORING_AGENT = "Sonar: Run Authoring Agent";

/** One turn in the panel transcript. */
interface ChatTurn {
    role: "user" | "assistant";
    text: string;
}

/**
 * A thin copilot panel for the Sonar Authoring Agent. Runs the agent SERVER-SIDE via the
 * `Sonar: Run Authoring Agent` action (GraphQL RunAction) — the same seam the rest of the Sonar UI
 * uses for engine actions. We go server-side because the client-side MJ conversation/agent stack is
 * version-skewed in this deployment (RunAgent discards messages; the conversation-detail path queries
 * a field the server schema lacks). The agent runs in MJAPI where the model/LLM/tools live, and
 * produces DRAFTS only. `contextNote` lets a host inject what the user is viewing (e.g. the open
 * model) so "add a recency factor" acts in context. See plans/agentic-authoring.md §4c.
 */
@Component({
    standalone: false,
    selector: "sonar-assistant-panel",
    templateUrl: "./sonar-assistant-panel.component.html",
    styleUrls: ["./sonar-assistant-panel.component.css"],
})
export class SonarAssistantPanelComponent {
    /** Optional context the host injects, prepended to the first user message. */
    @Input() public contextNote: string | null = null;

    public readonly turns = signal<ChatTurn[]>([]);
    public readonly running = signal(false);
    /** Live status line during a run (RunAction is request/response, so just a steady "Working…"). */
    public readonly progress = signal<string | null>(null);
    public readonly errorMsg = signal<string | null>(null);
    public prompt = "";

    private actionId: string | null = null;
    private firstSend = true;

    public async send(): Promise<void> {
        const text = this.prompt.trim();
        if (!text || this.running()) return;
        this.prompt = "";
        this.errorMsg.set(null);
        this.turns.update((t) => [...t, { role: "user", text }]);
        this.running.set(true);
        this.progress.set("Working… the agent is drafting this for you.");

        try {
            const actionId = await this.resolveActionId();
            if (!actionId) {
                this.errorMsg.set(`Action '${ACTION_RUN_AUTHORING_AGENT}' not found (seeded? MJAPI restarted?).`);
                return;
            }
            const params = [{ Name: "Prompt", Value: text, Type: "Input" as const }];
            if (this.firstSend && this.contextNote) {
                params.push({ Name: "ContextNote", Value: this.contextNote, Type: "Input" as const });
            }
            this.firstSend = false;
            const result = await this.actionClient().RunAction(actionId, params);
            if (result.Success) {
                const reply = extractActionParam(result, "Reply");
                this.turns.update((t) => [...t, { role: "assistant", text: this.replyText(reply) }]);
            } else {
                this.errorMsg.set(result.Message || "The agent couldn't complete that.");
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

    private replyText(reply: unknown): string {
        return typeof reply === "string" && reply.trim()
            ? reply
            : "Done — your draft is ready. Open the Model Builder to review it.";
    }

    /** A GraphQLActionClient over the app's active data provider (mirrors the engine/catalog services). */
    private actionClient(): GraphQLActionClient {
        return new GraphQLActionClient(Metadata.Provider as GraphQLDataProvider);
    }

    /** Resolve (and cache) the action's ID from its registered Name. */
    private async resolveActionId(): Promise<string | null> {
        if (this.actionId) return this.actionId;
        const provider = Metadata.Provider as GraphQLDataProvider;
        await ActionEngineBase.Instance.Config(false, provider.CurrentUser, provider);
        let action = ActionEngineBase.Instance.Actions.find((a) => a.Name === ACTION_RUN_AUTHORING_AGENT);
        if (!action) {
            await ActionEngineBase.Instance.Config(true, provider.CurrentUser, provider);
            action = ActionEngineBase.Instance.Actions.find((a) => a.Name === ACTION_RUN_AUTHORING_AGENT);
        }
        this.actionId = action?.ID ?? null;
        return this.actionId;
    }
}
