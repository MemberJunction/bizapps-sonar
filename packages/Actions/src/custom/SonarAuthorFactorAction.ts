import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { RunView } from "@memberjunction/core";
import { AgentRunner } from "@memberjunction/ai-agents";
import { MJAIAgentEntityExtended } from "@memberjunction/ai-core-plus";

/** The agent that actually writes/tests/persists the code — reused AS-IS (its own ~40k prompt does the
 *  heavy lifting). We never clone or edit it; we only hand it a Sonar-specific brief. */
const ACTIONSMITH = "ActionSmith";

/**
 * The Sonar Factor-Action BRIEF — the ONLY Sonar-specific piece (§5 adapter, piece 1). Prepended to the
 * operator's plain-English signal so ActionSmith produces a valid *factor*-action (a per-anchor scoring
 * signal), not just any action. Constrains the I/O shape the engine runs, forces declarative-first, and
 * keeps the Runtime/Pending approval gate. Everything else (contract design, codegen, test loop,
 * persistence) is ActionSmith's stock behavior.
 */
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
source, STOP and reply that it should be a DECLARATIVE factor instead (cheaper, no code review needed).

Include a Sonar FactorActionContract describing the signal: measures (one sentence), reads (the entities
it reads), output { unit?, min?, max?, higherIsBetter }, cost { deterministic, externalCalls, expensive }.

The action persists as Type='Runtime' with CodeApprovalStatus='Pending' — a human reviews the generated
code before it scores anyone. Never assume it is approved.

The signal to build:
`;

/**
 * Sonar: Author Factor Action — the §5 escape hatch. When a signal can't be a declarative factor, this
 * hands a Sonar factor-action BRIEF + the operator's description to the stock ActionSmith agent (run
 * server-side via AgentRunner) and returns the Runtime action it authored (gated CodeApprovalStatus=
 * 'Pending'). ActionSmith is reused untouched — the brief is the only Sonar-specific part, so this never
 * forks ActionSmith's prompt. The Sonar Authoring Agent calls this as a tool for non-declarative signals.
 *
 * Input params:  Description (string — the signal in plain English), Context (optional string — anchor
 *                entity + available sources, to ground the code)
 * Output param:  Result (JSON: { actionId?, approvalStatus?, name?, message })
 */
@RegisterClass(BaseAction, "SonarAuthorFactorAction")
export class SonarAuthorFactorAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        const description = this.getInput(params, "Description");
        if (!description) {
            return this.fail(params, "VALIDATION_ERROR", "Description is required (the signal to build, in plain English).");
        }
        const context = this.getInput(params, "Context");

        try {
            const agent = await this.loadActionSmith(params);
            if (!agent) {
                return this.fail(params, "NOT_FOUND", `'${ACTIONSMITH}' agent not found in this environment.`);
            }
            const content = `${FACTOR_BRIEF}${description}${context ? `\n\nContext (anchor + available sources):\n${context}` : ""}`;
            const result = await new AgentRunner().RunAgent({
                agent,
                conversationMessages: [{ role: "user", content }],
                contextUser: params.ContextUser,
            });
            if (!result?.success) {
                return this.fail(params, "ERROR", this.errorOf(result) ?? "ActionSmith did not complete successfully.");
            }
            const out = this.resultOf(result);
            return this.ok(params, out.message, out);
        } catch (e: unknown) {
            return this.fail(params, "ERROR", e instanceof Error ? e.message : String(e));
        }
    }

    /** Load ActionSmith; disable note/example injection (embeddings may be unconfigured server-side). */
    private async loadActionSmith(params: RunActionParams): Promise<MJAIAgentEntityExtended | null> {
        const rv = await new RunView().RunView<MJAIAgentEntityExtended>(
            { EntityName: "MJ: AI Agents", ExtraFilter: `Name='${ACTIONSMITH}'`, ResultType: "entity_object" },
            params.ContextUser,
        );
        const agent = rv.Success ? rv.Results?.[0] : undefined;
        if (!agent) return null;
        agent.InjectNotes = false;
        agent.InjectExamples = false;
        return agent;
    }

    /** Pull the authored-action facts off ActionSmith's payload (its self-write paths include these). */
    private resultOf(result: unknown): { actionId: string | null; approvalStatus: string | null; name: string | null; message: string } {
        const r = result as { payload?: Record<string, unknown>; agentRun?: { Message?: unknown } };
        const p = r.payload ?? {};
        const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
        const actionId = str(p["actionId"]);
        const approvalStatus = str(p["approvalStatus"]);
        const name = str(p["name"]);
        const reply = str(p["message"]) ?? str(r.agentRun?.Message);
        const message = reply ?? (actionId
            ? `Authored factor-action '${name ?? actionId}' (${approvalStatus ?? "Pending"} — needs human approval before it scores).`
            : "ActionSmith finished but did not report a persisted action.");
        return { actionId, approvalStatus, name, message };
    }

    private errorOf(result: unknown): string | null {
        const r = result as { agentRun?: { ErrorMessage?: unknown } };
        const e = r?.agentRun?.ErrorMessage;
        return typeof e === "string" && e.trim() ? e : null;
    }
}
