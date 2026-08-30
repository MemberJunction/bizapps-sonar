/**
 * Update the Sonar Authoring Agent: (1) rewrite its prompt to prefer the one-shot `Sonar: Build Model`
 * tool and to finish-all-steps / never-claim-false-done, and (2) link `Sonar: Build Model` as a tool.
 * Idempotent. Run from repo root:  set -a && . ./.env && set +a && node scripts/update-authoring-agent.mjs
 */
import sql from "mssql";
import { setupSQLServerClient, SQLServerProviderConfigData, UserCache } from "@memberjunction/sqlserver-dataprovider";
import { Metadata, RunView } from "@memberjunction/core";
import "@memberjunction/core-entities";

const AGENT_NAME = "Sonar Authoring Agent";
// Tools to ensure are linked to the agent (idempotent). The write tools were linked by the seed script;
// these are the ones this updater (re)links — Build Model + the two READ tools that give the agent eyes.
const LINKED_ACTIONS = ["Sonar: Build Model", "Sonar: Describe Model", "Sonar: List Related Entities", "Sonar: Author Factor Action", "Sonar: Unpublish Model", "Sonar: Find Entities", "Sonar: Find Models"];
// Pin a capable model. Flash-Lite (the system default) is too weak for reliable multi-step tool-calling —
// it narrates "I built the model" without actually emitting the tool call ~2/3 of the time. Gemini 3.5
// Flash is much stronger at tool use, still fast/cheap. Pinning makes selection deterministic.
const PINNED_MODEL = "Gemini 3.5 Flash";

const PROMPT_TEXT = `You are the Sonar Authoring Agent. You help an operator build engagement-scoring
configuration — score models, factors, band sets — by calling tools. You produce DRAFTS for a human to
review; you NEVER publish or activate anything.

## Building a NEW model — use ONE tool
To build a new model, call **Sonar: Build Model** ONCE with the whole spec. Do NOT chain Create Model /
Add Data Source / Create Factor for a new build — that single call wires everything up for you. Spec:
{
  "name": "...",
  "anchorEntityID": "<entity id>",
  "sources": [ { "relatedEntityID": "<entity id>", "alias": "events" } ],
  "factors": [ { "name": "Event Count", "sourceAlias": "events", "aggregation": "Count",
                 "normalizationMethod": "MinMax", "higherIsBetter": true, "weight": 1 } ],
  "bandSetId": "<band set id, optional>"
}
- Factors reference a source by its **alias** (never an ID).
- aggregation ∈ Count|Sum|Avg|Min|Max|DistinctCount. Count needs NO aggregateFieldName; EVERY other
  aggregation REQUIRES aggregateFieldName (a numeric/date column on the source).
- normalizationMethod ∈ MinMax|Percentile|ZScore|None|Logistic|Banded|Lookup (MinMax is a safe default).
- It returns { modelID, ... }; the model is a DRAFT.

## Editing an EXISTING model — granular tools
For incremental changes to a model that already exists: Sonar: Add Data Source, Sonar: Create Factor
(its sourceRelatedEntityID = the modelRelatedEntityID returned by Add Data Source), Sonar: Set Band Set.
- Add Data Source Spec = { relatedEntityID, alias }. Do NOT set relationshipPath — omit it and the engine
  auto-resolves the foreign key. (A dotted/SQL string there is invalid and will be ignored.)
- If a tool returns an error message, READ it and fix that specific thing; do NOT retry the same call
  unchanged or invent new variations of a field that already failed.

## PICK THE RIGHT MODEL — match the user's intent
When the user refers to a model loosely ("cheese", "the engagement one"), call **Sonar: Find Models**
(NameQuery="cheese") to fuzzy-match it by partial name — do NOT assume the current model or give up. Use
Find Models (no query) to enumerate what exists when asked "what models do I have?". Once resolved, edit
that model if it's EDITABLE (Draft). Do NOT grab an unrelated model (e.g. a "Test Model") just because it
shares an anchor entity — the name match is the signal. If several match, ask the user to pick by name.

## LOCKED models — unlock, don't loop
Only DRAFT models can be edited; Active/Paused models are LOCKED. When the target you should edit is
locked:
1. If a matching EDITABLE Draft already exists, just use it.
2. Otherwise, OFFER to unlock it: "This model is Active (locked). Want me to unpublish it to Draft so I
   can edit it, or create a new draft instead?" If the user says unlock it, call **Sonar: Unpublish
   Model** (ModelID or ModelName) yourself — it moves Active/Paused → Draft (it NEVER publishes), then
   proceed with the edit in the SAME turn.
- Never tell the user to go unpublish it manually, and never re-run the same status check hoping it
  changed — YOU have the unpublish tool; use it or pivot to a new draft. Do not loop.

## LOOK BEFORE YOU ASK — read tools
You can SEE existing state. Use these BEFORE asking the user to re-state things you can look up:
- **Sonar: Describe Model** (by Name or ModelID) → returns a model's anchor, sources (with aliases),
  factors, and band set. When asked to suggest changes to, or answer questions about, a NAMED model,
  Describe it FIRST — don't ask the user what its anchor or sources are.
- **Sonar: List Related Entities** (AnchorEntityID) → the business entities joinable to an anchor (the
  candidate data sources). Use this to ground factor/source suggestions in data that ACTUALLY exists —
  never invent generic factors ("login frequency") that have no backing source on this anchor.
- Suggesting factors = Describe the model → List Related Entities on its anchor → propose declarative
  factors over real sources, then ask the user to confirm before you build.

## RESOLVE ENTITY IDs YOURSELF — never ask the user for a UUID
To build a NEW model you need an anchorEntityID. When the user names the anchor in plain English
("Members", "Donors"), call **Sonar: Find Entities** (NameQuery="Members") to resolve it to its ID —
do NOT ask the user to paste a UUID. If several match, ask the user to pick by NAME. Use the resolved id
as anchorEntityID in Build Model. (Related sources on an existing anchor still come from List Related
Entities.)

## Rules
- DECLARATIVE-FIRST: build signals as declarative factors (count/sum/avg over a source, with a window/
  filter). For a signal SQL CAN'T express (streaks, decay/recency, sentiment, cross-source ratios), use
  **Sonar: Author Factor Action** — describe the signal plainly and it authors a custom code factor via
  ActionSmith. It returns a Runtime action at CodeApprovalStatus='Pending' (a human approves the code
  before it scores). Reach for it ONLY when declarative genuinely can't express the signal; never
  approximate a code-signal with a wrong aggregation.
- FINISH the whole request in one go. If you cannot complete every requested part, state exactly what is
  missing — NEVER claim you are done when you are not.
- VERIFY before claiming: only report a source/factor as added if its tool call returned success. If
  unsure what a model contains, call Sonar: Describe Model to check. Never report a step that errored.
- EXPLAIN your choices (why each factor and weight) in your reasoning.
- DRAFTS ONLY: never publish or activate. Leave the model Draft for human review.
- IDs: if you don't know an anchorEntityID or a bandSetId, first try the read tools; only ASK the user
  when you genuinely can't look it up — never guess UUIDs.`;

async function findOne(entity, filter, user) {
    const r = await new RunView().RunView({ EntityName: entity, ExtraFilter: filter, ResultType: "entity_object" }, user);
    return r.Success && r.Results.length ? r.Results[0] : null;
}
async function save(e, label) {
    if (!(await e.Save())) throw new Error(`${label} save failed: ${e.LatestResult?.Message ?? "unknown"}`);
}

/** Pin PINNED_MODEL to the agent's prompt and switch the prompt to "Specific" selection. Idempotent. */
async function pinModel(user, md) {
    const prompt = await findOne("MJ: AI Prompts", `Name='${AGENT_NAME}'`, user);
    if (!prompt) throw new Error(`prompt '${AGENT_NAME}' not found`);
    const model = await findOne("MJ: AI Models", `Name='${PINNED_MODEL}'`, user);
    if (!model) throw new Error(`model '${PINNED_MODEL}' not found`);

    const existing = await findOne("MJ: AI Prompt Models", `PromptID='${prompt.ID}'`, user);
    if (existing && existing.ModelID === model.ID) {
        console.log(`✓ model already pinned (${PINNED_MODEL})`);
    } else {
        const pm = existing ?? (await md.GetEntityObject("MJ: AI Prompt Models", user));
        if (!existing) pm.NewRecord();
        pm.PromptID = prompt.ID;
        pm.ModelID = model.ID;
        pm.Priority = 1;
        pm.ExecutionGroup = 0;
        pm.Status = "Active";
        pm.ParallelizationMode = "None";
        pm.ParallelCount = 1;
        await save(pm, "AIPromptModel");
        console.log(`✓ pinned model ${PINNED_MODEL}`);
    }

    if (prompt.SelectionStrategy !== "Specific") {
        prompt.SelectionStrategy = "Specific";
        await save(prompt, "AIPrompt");
        console.log("✓ prompt SelectionStrategy → Specific");
    } else {
        console.log("✓ SelectionStrategy already Specific");
    }
}

async function main() {
    const pool = new sql.ConnectionPool({ user: "sa", password: "Securepassword!23", server: "localhost", port: 1433, database: "Sonar_Demo", options: { trustServerCertificate: true, encrypt: false } });
    await pool.connect();
    await setupSQLServerClient(new SQLServerProviderConfigData(pool, "__mj"));
    await UserCache.Instance.Refresh(pool);
    const user = UserCache.Users.find((u) => u?.Type?.trim().toLowerCase() === "owner") ?? UserCache.Users[0];
    const md = new Metadata();

    const agent = await findOne("MJ: AI Agents", `Name='${AGENT_NAME}'`, user);
    if (!agent) throw new Error(`agent '${AGENT_NAME}' not found — seed it first`);

    // 1. Rewrite the prompt (Template Content text).
    const tpl = await findOne("MJ: Templates", `Name='${AGENT_NAME}'`, user);
    const tc = tpl ? await findOne("MJ: Template Contents", `TemplateID='${tpl.ID}'`, user) : null;
    if (!tc) throw new Error("agent prompt Template Content not found");
    tc.TemplateText = PROMPT_TEXT;
    await save(tc, "TemplateContent");
    console.log("✓ prompt updated");

    // 2. Link each tool to the agent (if not already).
    for (const actionName of LINKED_ACTIONS) {
        const action = await findOne("MJ: Actions", `Name='${actionName}'`, user);
        if (!action) throw new Error(`action '${actionName}' not found — seed + mj sync first`);
        const existing = await findOne("MJ: AI Agent Actions", `AgentID='${agent.ID}' AND ActionID='${action.ID}'`, user);
        if (existing) {
            console.log(`✓ ${actionName} already linked`);
        } else {
            const aa = await md.GetEntityObject("MJ: AI Agent Actions", user);
            aa.NewRecord();
            aa.AgentID = agent.ID;
            aa.ActionID = action.ID;
            aa.Status = "Active";
            await save(aa, "AIAgentAction");
            console.log(`✓ linked ${actionName}`);
        }
    }

    // 3. Pin a capable model to the agent's prompt (deterministic, strong tool-calling).
    await pinModel(user, md);

    // 4. Make the agent use ITS OWN prompt for model selection. Default ('Agent Type') selects via the
    // SHARED "Loop Agent Type: System Prompt" (pinned to Flash-Lite globally — can't repin without
    // affecting every loop agent). 'Agent' mode routes selection to our pinned model instead.
    if (agent.ModelSelectionMode !== "Agent") {
        agent.ModelSelectionMode = "Agent";
        await save(agent, "AIAgent");
        console.log("✓ ModelSelectionMode → Agent");
    } else {
        console.log("✓ ModelSelectionMode already Agent");
    }

    // 5. Cap the loop so a confused run can't spin forever (they were all null = unbounded). A clean
    // authoring task lands in 2-4 iterations; the brief tells the agent to stop after an error repeats
    // twice, so a healthy run never approaches these. Tightened for fail-fast — a stuck run now bails in
    // ~12 iterations instead of grinding to 20, the bulk of the "why is codesmith so slow" tail.
    const CAPS = { MaxIterationsPerRun: 12, MaxExecutionsPerRun: 18 };
    const capChanges = Object.entries(CAPS).filter(([k, v]) => agent[k] !== v);
    if (capChanges.length) {
        for (const [k, v] of capChanges) agent[k] = v;
        await save(agent, "AIAgent");
        console.log(`✓ loop caps set (${capChanges.map(([k, v]) => `${k}=${v}`).join(", ")})`);
    } else {
        console.log("✓ loop caps already set");
    }

    console.log("\nDone.");
    await pool.close();
}
main().catch((e) => { console.error("UPDATE FAILED:", e.message); process.exit(1); });
