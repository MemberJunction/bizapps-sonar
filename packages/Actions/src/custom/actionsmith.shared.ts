import { RunView, UserInfo } from "@memberjunction/core";
import { AgentRunner } from "@memberjunction/ai-agents";
import { MJAIAgentEntityExtended } from "@memberjunction/ai-core-plus";

/** The stock code-writing agent, reused untouched across the factor-authoring actions. */
export const ACTIONSMITH = "ActionSmith";

/** The Sonar Factor-Action BRIEF — the only Sonar-specific input. Constrains ActionSmith's output to the
 *  per-anchor factor shape so the engine can run it. Shared by the commission + refine kickoffs. */
export const FACTOR_BRIEF = `You are authoring a SONAR FACTOR-ACTION — a scoring signal evaluated ONCE PER ANCHOR
RECORD, not a generic action. The action you create MUST conform to this shape so the Sonar scoring
engine can run it:

INPUT params (exactly these two): AnchorRecordID (string GUID — the record being scored) and AsOf
(string ISO date/time — compute the signal as of this instant).
OUTPUT params (exactly these two): Value (number — the raw signal for that one record; null = no data)
and Explanation (string — a short human "why" for the score waterfall).

The code computes the signal for the given AnchorRecordID as of AsOf — per record, never population-wide.
DECLARATIVE-FIRST: only build custom code for signals plain SQL can't express (streaks, decay, sentiment,
cross-source ratios); a simple count/sum/avg should be a declarative factor instead.
Include a Sonar FactorActionContract: measures (one sentence), reads (entities), output { unit?, min?,
max?, higherIsBetter }, cost { deterministic, externalCalls, expensive }.
Persist as Type='Runtime', CodeApprovalStatus='Pending' — a human reviews the code before it scores.

SANDBOX API — the only data/AI access available to the code is the injected \`utilities\` object:
- utilities.entity.Load(entityName, id) and utilities.rv.RunView({ EntityName, ExtraFilter, ... }) for data.
- utilities.ai.ExecutePrompt({ PromptName | PromptID, Variables }) for LLM calls. It returns
  { Success, Response, ErrorMessage, ModelUsed, TokensUsed }. CRITICAL: \`Response\` is the prompt's
  PARSED result — an OBJECT when the prompt emits structured output, or a raw STRING otherwise. NEVER
  assume it's a string. Read the field you expect off the object, or coerce before any string op, e.g.
  \`const text = typeof Response === 'string' ? Response : JSON.stringify(Response ?? '')\`. (Calling
  \`.trim()\`/\`.match()\` directly on Response throws "trim is not a function" when it's an object.)
- Check \`.Success\`/\`.ErrorMessage\` before using a result; on failure, return Value=null with the reason.

The signal to build:
`;

/** Load ActionSmith; disable note/example injection (embeddings may be unconfigured server-side). */
export async function loadActionSmith(contextUser: UserInfo | undefined): Promise<MJAIAgentEntityExtended | null> {
    const rv = await new RunView().RunView<MJAIAgentEntityExtended>(
        { EntityName: "MJ: AI Agents", ExtraFilter: `Name='${ACTIONSMITH}'`, ResultType: "entity_object" },
        contextUser,
    );
    const agent = rv.Success ? rv.Results?.[0] : undefined;
    if (!agent) return null;
    agent.InjectNotes = false;
    agent.InjectExamples = false;
    return agent;
}

/**
 * Fire ActionSmith WITHOUT awaiting completion and resolve with its AgentRunID as soon as the run row
 * exists (the `onAgentRunCreated` hook). The run keeps executing server-side after we return. If
 * `onComplete` is supplied it runs AFTER the agent finishes (post-processing, e.g. the refine transplant)
 * — its errors are swallowed so they can't crash the host process. A 20s safety net unblocks the caller
 * if the hook never fires.
 */
export async function fireActionSmithDetached(opts: {
    agent: MJAIAgentEntityExtended;
    content: string;
    contextUser: UserInfo | undefined;
    onComplete?: () => Promise<void>;
}): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
        let settled = false;
        const done = (id: string | null) => { if (!settled) { settled = true; resolve(id); } };
        new AgentRunner()
            .RunAgent({
                agent: opts.agent,
                conversationMessages: [{ role: "user", content: opts.content }],
                contextUser: opts.contextUser,
                onAgentRunCreated: (id: string) => done(id),
            })
            .then(async () => { if (opts.onComplete) await opts.onComplete(); })
            .catch(() => { /* run failure surfaces via AIAgentRun.Status='Failed' (polled by the Studio) */ });
        setTimeout(() => done(null), 20000);
    });
}
