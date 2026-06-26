import { Injectable, inject, signal } from "@angular/core";
import { Metadata } from "@memberjunction/core";
import { MJActionEntity, MJConversationEntity, MJConversationDetailEntity } from "@memberjunction/core-entities";
import { AgentClientService } from "@memberjunction/ng-agent-client";

/** The stock code-writing agent we drive with a Sonar brief — reused untouched. */
const ACTIONSMITH_AGENT_ID = "AF804075-E543-46E5-8D8F-2A0B8094628C";
/** MJ's single Default environment (this deployment has one). */
const DEFAULT_ENVIRONMENT_ID = "F51358F3-9447-4176-B313-BF8025FD8D09";

/** The Sonar Factor-Action BRIEF — the only Sonar-specific input. Constrains ActionSmith's output to the
 *  per-anchor factor shape (AnchorRecordID/AsOf in, Value/Explanation out) + a contract, declarative-first,
 *  Runtime/Pending. Everything else (contract design, codegen, test loop, persistence) is ActionSmith's. */
const FACTOR_BRIEF = `You are authoring a SONAR FACTOR-ACTION — a scoring signal evaluated ONCE PER ANCHOR
RECORD, not a generic action. The action you create MUST conform to this shape so the Sonar scoring
engine can run it:

INPUT params (exactly these two):
- AnchorRecordID (string) — a GUID; the single record being scored (e.g. a member).
- AsOf (string) — ISO date/time; compute the signal AS OF this instant (be time-aware).

OUTPUT params (exactly these two):
- Value (number) — the raw signal for that ONE anchor record; return null when there is no data.
- Explanation (string) — a short human "why" that feeds Sonar's score explainability.

The code computes the signal for the given AnchorRecordID as of AsOf — per record, never population-wide.

DECLARATIVE-FIRST: only build a custom action-factor for signals plain SQL CANNOT express — streaks,
decay/recency curves, sentiment, cross-source ratios. If the request is a simple count/sum/avg over one
source, STOP and reply that it should be a DECLARATIVE factor instead.

Include a Sonar FactorActionContract describing the signal: measures (one sentence), reads (the entities
it reads), output { unit?, min?, max?, higherIsBetter }, cost { deterministic, externalCalls, expensive }.

The action persists as Type='Runtime' with CodeApprovalStatus='Pending' — a human reviews the generated
code before it scores anyone. Never assume it is approved.

The signal to build:
`;

/** One step the agent took (the live oversight feed). `isAction` = a real tool/action call. */
export interface AgentStep {
    label: string;
    isAction: boolean;
}

/** Where the authoring run is. Held in the service so a host re-render can't reset it. */
export type FactorSmithPhase = "idle" | "authoring" | "review" | "approving" | "done" | "error";

/** What ActionSmith authored: the persisted Runtime factor-action (gated Pending until approved). */
export interface AuthoredFactor {
    actionId: string | null;
    approvalStatus: string | null;
    name: string | null;
    message: string;
}

/**
 * The Codesmith authoring engine — an APP-SCOPED singleton so the run (live progress, generated code,
 * result) SURVIVES the factor builder / surface re-rendering and destroying the harness component mid-run.
 * Runs the stock ActionSmith agent via the STREAMING agent path (RunAgentFromConversationDetail +
 * OnProgress) so the harness shows a live "what it's doing" feed instead of a blind multi-minute spinner.
 * The harness component is a thin view over these signals. Mirrors SonarAssistantConversationService.
 * See plans/agentic-authoring.md §5/§12.
 */
@Injectable({ providedIn: "root" })
export class SonarFactorSmithService {
    private readonly agentClient = inject(AgentClientService);

    public readonly phase = signal<FactorSmithPhase>("idle");
    /** Live oversight steps during the run (what ActionSmith is doing). */
    public readonly liveSteps = signal<AgentStep[]>([]);
    public readonly code = signal<string>("");
    public readonly errorMsg = signal<string | null>(null);
    public readonly result = signal<AuthoredFactor | null>(null);

    private conversationId: string | null = null;

    public busy(): boolean {
        return this.phase() === "authoring" || this.phase() === "approving";
    }

    /** Author (or re-author) a factor-action from a description. Streams progress into `liveSteps`;
     *  lands the result/code in the service so the view rehydrates even if it was destroyed mid-run. */
    public async author(description: string, context?: string | null): Promise<void> {
        if (this.busy()) return;
        this.errorMsg.set(null);
        this.liveSteps.set([]);
        this.result.set(null);
        this.code.set("");
        this.phase.set("authoring");
        try {
            const content = `${FACTOR_BRIEF}${description}${context ? `\n\nContext (anchor + available sources):\n${context}` : ""}`;
            const detailId = await this.saveMessage(content);
            const run = await this.agentClient.RunAgentFromConversationDetail({
                ConversationDetailId: detailId,
                AgentId: ACTIONSMITH_AGENT_ID,
                MaxHistoryMessages: 20,
                OnProgress: (p) => this.recordStep(p),
            });
            if (!run.Success) {
                this.fail(run.ErrorMessage || "ActionSmith didn't complete.");
                return;
            }
            const authored = this.extractAuthored(run.Result);
            if (!authored.actionId) {
                this.fail(authored.message || "ActionSmith finished without persisting an action.");
                return;
            }
            this.result.set(authored);
            this.code.set(await this.getCode(authored.actionId));
            this.phase.set("review");
        } catch (e: unknown) {
            this.fail(e instanceof Error ? e.message : String(e));
        }
    }

    /** Flip the governance gate (a human read the code + saw a green test). Marks Approved + stamps. */
    public async approve(): Promise<{ ok: boolean; error?: string }> {
        const actionId = this.result()?.actionId;
        if (!actionId || this.busy()) return { ok: false, error: "Nothing to approve." };
        this.phase.set("approving");
        const md = new Metadata();
        const action = await this.loadAction(actionId);
        if (!action) { this.phase.set("review"); return { ok: false, error: "Action not found." }; }
        action.CodeApprovalStatus = "Approved";
        action.CodeApprovedByUserID = md.CurrentUser.ID;
        action.CodeApprovedAt = new Date();
        if (!(await action.Save())) {
            this.phase.set("review");
            return { ok: false, error: action.LatestResult?.Message || "Approve failed." };
        }
        this.result.update((r) => (r ? { ...r, approvalStatus: "Approved" } : r));
        this.phase.set("done");
        return { ok: true };
    }

    /** Back to a clean slate (Author another / closed the lane). */
    public reset(): void {
        this.phase.set("idle");
        this.liveSteps.set([]);
        this.code.set("");
        this.errorMsg.set(null);
        this.result.set(null);
    }

    private fail(message: string): void {
        this.errorMsg.set(message);
        this.phase.set("error");
    }

    /** Ensure a Conversation exists (pinned to ActionSmith), save the user message, return its id. */
    private async saveMessage(content: string): Promise<string> {
        const md = new Metadata();
        if (!this.conversationId) {
            const conv = await md.GetEntityObject<MJConversationEntity>("MJ: Conversations");
            conv.NewRecord();
            conv.Name = "Sonar Factor Smith";
            conv.UserID = md.CurrentUser.ID;
            conv.EnvironmentID = DEFAULT_ENVIRONMENT_ID;
            conv.DefaultAgentID = ACTIONSMITH_AGENT_ID;
            if (!(await conv.Save())) throw new Error(conv.LatestResult?.Message || "Could not start a conversation.");
            this.conversationId = conv.ID;
        }
        const detail = await md.GetEntityObject<MJConversationDetailEntity>("MJ: Conversation Details");
        detail.NewRecord();
        detail.ConversationID = this.conversationId;
        detail.Role = "User";
        detail.Message = content;
        if (!(await detail.Save())) throw new Error(detail.LatestResult?.Message || "Could not save the request.");
        return detail.ID;
    }

    /** Stream a progress event into an oversight step (structured action_execution + actionNames; else
     *  the narration text). De-dupes consecutive repeats. */
    private recordStep(p: { CurrentStep?: string; Message?: string; Metadata?: Record<string, unknown> }): void {
        const names = p.Metadata?.["actionNames"];
        const actionNames = Array.isArray(names) ? names.filter((n): n is string => typeof n === "string") : [];
        if (p.CurrentStep === "action_execution" && actionNames.length) {
            for (const n of actionNames) this.pushStep({ label: n.replace(/^Sonar:\s*/i, "").trim() || n, isAction: true });
            return;
        }
        const text = (p.Message ?? p.CurrentStep ?? "").split("\n")[0].replace(/\*\*/g, "").trim();
        if (text) this.pushStep({ label: text.length > 90 ? text.slice(0, 88) + "…" : text, isAction: false });
    }

    private pushStep(step: AgentStep): void {
        this.liveSteps.update((s) => {
            const last = s[s.length - 1];
            if (last && last.label === step.label && last.isAction === step.isAction) return s;
            return [...s, step];
        });
    }

    /** Pull the authored-action facts off ActionSmith's payload. */
    private extractAuthored(result: unknown): AuthoredFactor {
        const r = result as { payload?: Record<string, unknown>; agentRun?: { Message?: unknown } };
        const p = r?.payload ?? {};
        const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
        const actionId = str(p["actionId"]);
        const name = str(p["name"]);
        const approvalStatus = str(p["approvalStatus"]);
        const reply = str(p["message"]) ?? str(r?.agentRun?.Message) ?? (actionId ? `Authored '${name ?? actionId}'.` : "No action was persisted.");
        return { actionId, name, approvalStatus, message: reply };
    }

    private async getCode(actionId: string): Promise<string> {
        const action = await this.loadAction(actionId);
        return action?.Code ?? "";
    }

    private async loadAction(actionId: string): Promise<MJActionEntity | null> {
        const action = await new Metadata().GetEntityObject<MJActionEntity>("Actions");
        await action.Load(actionId);
        return action.IsSaved ? action : null;
    }
}
