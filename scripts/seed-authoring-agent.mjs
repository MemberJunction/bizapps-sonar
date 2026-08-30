/**
 * Seed the "Sonar Authoring Agent" — a Loop agent (plans/agentic-authoring.md §4b) that builds
 * Sonar scoring config from natural language by calling the tool-surface actions. Mostly DATA:
 * a Template+prompt, an AIAgent (Loop type), the prompt link, and the 4 tools linked as its toolbox.
 * Idempotent: reuses/creates by name. Codesmith is intentionally NOT linked yet (its factor-action
 * adapter — doc §5 — isn't built; v1 does declarative authoring).
 *
 * Run from repo root:  node scripts/seed-authoring-agent.mjs
 */
import sql from "mssql";
import { setupSQLServerClient, SQLServerProviderConfigData, UserCache } from "@memberjunction/sqlserver-dataprovider";
import { Metadata, RunView } from "@memberjunction/core";
import "@memberjunction/core-entities";

const AGENT_NAME = "Sonar Authoring Agent";
const LOOP_TYPE_ID = "F7926101-5099-4FA5-836A-479D9707C818";
const TEXT_CONTENT_TYPE_ID = "E7AFCCEC-6A37-EF11-86D4-000D3A4E707E"; // MJ: Template Content Types → Text
const CHAT_PROMPT_TYPE_ID = "A6DA423E-F36B-1410-8DAC-00021F8B792E"; // MJ: AI Prompt Types → Chat
const TOOLS = ["Sonar: Create Model", "Sonar: Add Data Source", "Sonar: Create Factor", "Sonar: Set Band Set"];

const PROMPT_TEXT = `You are the Sonar Authoring Agent. You help an operator build engagement-scoring
configuration — score models, data sources, factors, band sets — by calling tools. You produce
DRAFTS for a human to review; you NEVER publish or activate anything.

## Concepts
A Sonar "model" scores an anchor entity (e.g. Members) using weighted "factors". Each factor measures
one thing about each anchor record (e.g. count of event registrations in the last 90 days).

## Your tools
1. Sonar: Create Model — Spec {name, anchorEntityID}. Creates a draft model. Returns {modelID}.
2. Sonar: Add Data Source — ModelID, Spec {relatedEntityID, alias, relationshipPath?}. Wires in a
   related entity that factors can measure. Returns {modelRelatedEntityID}.
3. Sonar: Create Factor — ModelID, Spec {name, sourceRelatedEntityID, aggregation, aggregateFieldName?,
   filterExpression?, timeWindowID?, dateField?, normalizationMethod, higherIsBetter, weight, weightMode?}.
   Creates a declarative factor and binds it to the rubric. Returns {factorID, modelFactorID}.
   • CRITICAL: sourceRelatedEntityID is the modelRelatedEntityID returned by Add Data Source (the wired
     source row) — NOT the underlying entity id.
   • aggregation ∈ Count|Sum|Avg|Min|Max|DistinctCount. Count needs no aggregateFieldName.
   • normalizationMethod ∈ MinMax|Percentile|ZScore|None|Logistic|Banded|Lookup. MinMax is a safe default.
   • weight is 0..1. dateField is the related-entity date column a time window filters on.
4. Sonar: Set Band Set — ModelID, BandSetID. Attaches an existing band set so the model is scoreable.

## Rules
- DECLARATIVE-FIRST: if a signal is expressible as an aggregation over a source (count/sum/avg over a
  window with a filter), build it with Create Factor. Signals SQL cannot express (streaks, decay,
  sentiment, external/AI) need custom code — that path is NOT available to you yet, so if a request
  needs it, say so and stop rather than approximating with a wrong aggregation.
- EXPLAIN your choices: in your reasoning, justify each factor and its weight (why it signals
  engagement, why that weight relative to the others).
- DRAFTS ONLY: never publish/activate. Leave the model Draft for a human to review.
- IDs: if you don't know an anchorEntityID, a relatedEntityID, or a BandSetID, ASK the user — do not
  guess UUIDs.

## Typical flow for "build a model"
Create Model → Add each Data Source → Create each Factor (using the modelRelatedEntityID from the
matching Add Data Source) → Set Band Set → summarize what you built and why, and note it's a draft.`;

async function save(e, label) {
    if (!(await e.Save())) throw new Error(`${label} save failed: ${e.LatestResult?.CompleteMessage ?? e.LatestResult?.Message ?? "unknown"}`);
}
async function findOne(entity, filter, user) {
    const r = await new RunView().RunView({ EntityName: entity, ExtraFilter: filter, ResultType: "entity_object" }, user);
    return r.Success && r.Results.length ? r.Results[0] : null;
}

async function main() {
    const pool = new sql.ConnectionPool({ user: "sa", password: "Securepassword!23", server: "localhost", port: 1433, database: "Sonar_Demo", options: { trustServerCertificate: true, encrypt: false } });
    await pool.connect();
    await setupSQLServerClient(new SQLServerProviderConfigData(pool, "__mj"));
    await UserCache.Instance.Refresh(pool);
    const user = UserCache.Users.find((u) => u?.Type?.trim().toLowerCase() === "owner") ?? UserCache.Users[0];
    const md = new Metadata();

    if (await findOne("MJ: AI Agents", `Name='${AGENT_NAME}'`, user)) {
        console.log(`already seeded — '${AGENT_NAME}'. Nothing to do.`);
        await pool.close();
        return;
    }

    // 1. Template + content (the agent's instruction prompt; UI-editable afterward)
    let tpl = await findOne("MJ: Templates", `Name='${AGENT_NAME}'`, user);
    if (!tpl) {
        tpl = await md.GetEntityObject("MJ: Templates", user);
        tpl.NewRecord(); tpl.Name = AGENT_NAME; tpl.Description = "Sonar Authoring Agent — system/instruction prompt."; tpl.UserID = user.ID; tpl.IsActive = true;
        await save(tpl, "Template");
    }
    if (!(await findOne("MJ: Template Contents", `TemplateID='${tpl.ID}'`, user))) {
        const tc = await md.GetEntityObject("MJ: Template Contents", user);
        tc.NewRecord(); tc.TemplateID = tpl.ID; tc.TypeID = TEXT_CONTENT_TYPE_ID; tc.TemplateText = PROMPT_TEXT; tc.Priority = 1; tc.IsActive = true;
        await save(tc, "TemplateContent");
    }

    // 2. AIPrompt for the agent's child prompt
    let prompt = await findOne("MJ: AI Prompts", `Name='${AGENT_NAME}'`, user);
    if (!prompt) {
        prompt = await md.GetEntityObject("MJ: AI Prompts", user);
        prompt.NewRecord();
        prompt.Name = AGENT_NAME;
        prompt.Description = "Instructions for the Sonar Authoring Agent (declarative-first, drafts-only).";
        prompt.TemplateID = tpl.ID;
        prompt.TypeID = CHAT_PROMPT_TYPE_ID;
        prompt.Status = "Active";
        prompt.PromptRole = "System";
        prompt.PromptPosition = "First";
        await save(prompt, "AIPrompt");
    }
    console.log(`AIPrompt ${prompt.ID}`);

    // 3. AIAgent (Loop type). NewRecord() fills the many NOT NULL config defaults.
    const agent = await md.GetEntityObject("MJ: AI Agents", user);
    agent.NewRecord();
    agent.Name = AGENT_NAME;
    agent.Description = "Builds Sonar scoring config (models/factors/bands) from natural language via the tool surface. Declarative-first; produces drafts for human review.";
    agent.TypeID = LOOP_TYPE_ID;
    agent.Status = "Active";
    agent.OwnerUserID = user.ID;
    agent.ExposeAsAction = false;
    agent.IconClass = "fa-solid fa-wand-magic-sparkles";
    await save(agent, "AIAgent");
    console.log(`AIAgent ${agent.ID}`);

    // 4. Link the prompt to the agent
    const ap = await md.GetEntityObject("MJ: AI Agent Prompts", user);
    ap.NewRecord(); ap.AgentID = agent.ID; ap.PromptID = prompt.ID; ap.ExecutionOrder = 1; ap.Status = "Active";
    await save(ap, "AIAgentPrompt");

    // 5. Link the 4 tool-surface actions as the agent's toolbox
    for (const toolName of TOOLS) {
        const action = await findOne("MJ: Actions", `Name='${toolName}'`, user);
        if (!action) throw new Error(`tool action '${toolName}' not found (seeded?)`);
        const aa = await md.GetEntityObject("MJ: AI Agent Actions", user);
        aa.NewRecord(); aa.AgentID = agent.ID; aa.ActionID = action.ID; aa.Status = "Active";
        await save(aa, `AIAgentAction(${toolName})`);
        console.log(`  linked tool: ${toolName}`);
    }

    console.log(`\n✓ seeded '${AGENT_NAME}' (Loop) with 4 tools. Edit the prompt in MJExplorer → Templates.`);
    await pool.close();
}

main().catch((e) => { console.error("SEED FAILED:", e.message); process.exit(1); });
