/**
 * Seed the "Sonar: Resource Review Sentiment" AIPrompt (+ its Template/content + Gemini model pin)
 * that the SonarReviewSentimentAction loads by name. Idempotent: skips if the prompt already exists.
 * The prompt text lives in the Template → tunable in MJExplorer's UI afterward.
 *
 * Run from repo root:  node scripts/seed-sentiment-prompt.mjs
 */
import sql from "mssql";
import { setupSQLServerClient, SQLServerProviderConfigData, UserCache } from "@memberjunction/sqlserver-dataprovider";
import { Metadata, RunView } from "@memberjunction/core";
import "@memberjunction/core-entities"; // side-effect: register core entity subclasses (Template/AIPrompt/...)

const PROMPT_NAME = "Sonar: Resource Review Sentiment";
const CHAT_TYPE_ID = "A6DA423E-F36B-1410-8DAC-00021F8B792E"; // MJ: AI Prompt Types → Chat
const TEXT_CONTENT_TYPE_ID = "E7AFCCEC-6A37-EF11-86D4-000D3A4E707E"; // MJ: Template Content Types → Text
// Pin a CURRENT cheap/fast Gemini. gemini-1.5-flash is retired at Google's API (404 → failover thrash);
// gemini-2.5-flash-lite is the cheapest live model with a working GeminiLLM driver — ideal for a factor
// that scores a whole population.
const GEMINI_FLASH_MODEL_ID = "13297942-3AE2-4584-832C-551237847140"; // Gemini 2.5 Flash-Lite
const GOOGLE_VENDOR_ID = "E4A5CCEC-6A37-EF11-86D4-000D3A4E707E";

const PROMPT_TEXT = `You assess a member's engagement sentiment from the resource reviews they wrote.
Read the prose (ignore any star ratings) and return ONLY JSON:
{"score": <number between 0 and 1>, "reason": "<15 words or fewer>"}

- score 0 = frustrated / disengaged / negative; 1 = warm / enthusiastic / engaged.
- Judge tone, not length. If reviews conflict, weigh the most recent.

Reviews:
{{ reviews }}`;

async function save(entity, label) {
    if (!(await entity.Save())) {
        throw new Error(`${label} save failed: ${entity.LatestResult?.CompleteMessage ?? "unknown"}`);
    }
}

async function main() {
    const pool = new sql.ConnectionPool({
        user: "sa", password: "Securepassword!23", server: "localhost", port: 1433,
        database: "Sonar_Demo", options: { trustServerCertificate: true, encrypt: false },
    });
    await pool.connect();
    await setupSQLServerClient(new SQLServerProviderConfigData(pool, "__mj"));
    await UserCache.Instance.Refresh(pool);
    const user = UserCache.Users.find((u) => u?.Type?.trim().toLowerCase() === "owner") ?? UserCache.Users[0];
    console.log(`context user: ${user?.Name}`);

    const md = new Metadata();

    // Idempotency — skip if already seeded.
    const existing = await new RunView().RunView(
        { EntityName: "MJ: AI Prompts", ExtraFilter: `Name='${PROMPT_NAME}'`, ResultType: "entity_object" },
        user,
    );
    if (existing.Success && existing.Results.length) {
        console.log(`already seeded — AIPrompt ${existing.Results[0].ID}. Nothing to do.`);
        await pool.close();
        return;
    }

    // 1. Template (reuse by name so a re-run doesn't orphan a duplicate)
    const tplFound = await new RunView().RunView(
        { EntityName: "MJ: Templates", ExtraFilter: `Name='${PROMPT_NAME}'`, ResultType: "entity_object" },
        user,
    );
    let tpl;
    if (tplFound.Success && tplFound.Results.length) {
        tpl = tplFound.Results[0];
        console.log(`reusing Template ${tpl.ID}`);
    } else {
        tpl = await md.GetEntityObject("MJ: Templates", user);
        tpl.NewRecord();
        tpl.Name = PROMPT_NAME;
        tpl.Description = "Sonar LLM factor: rate a member's engagement sentiment from their resource reviews.";
        tpl.UserID = user.ID;
        tpl.IsActive = true;
        await save(tpl, "Template");
        console.log(`Template ${tpl.ID}`);
    }

    // 2. TemplateContent (the actual prompt text — UI-editable here); reuse if present
    const tcFound = await new RunView().RunView(
        { EntityName: "MJ: Template Contents", ExtraFilter: `TemplateID='${tpl.ID}'`, ResultType: "entity_object" },
        user,
    );
    if (tcFound.Success && tcFound.Results.length) {
        console.log(`reusing TemplateContent ${tcFound.Results[0].ID}`);
    } else {
        const tc = await md.GetEntityObject("MJ: Template Contents", user);
        tc.NewRecord();
        tc.TemplateID = tpl.ID;
        tc.TypeID = TEXT_CONTENT_TYPE_ID;
        tc.TemplateText = PROMPT_TEXT;
        tc.Priority = 1;
        tc.IsActive = true;
        await save(tc, "TemplateContent");
        console.log(`TemplateContent ${tc.ID}`);
    }

    // 3. AIPrompt — pin Gemini, JSON object output, caching on. NewRecord() fills the other NOT NULL
    //    config defaults (validation/retry/failover/etc.).
    const prompt = await md.GetEntityObject("MJ: AI Prompts", user);
    prompt.NewRecord();
    prompt.Name = PROMPT_NAME;
    prompt.Description = "Rates member engagement sentiment (0–1) from resource-review prose. Backs the SonarReviewSentiment factor.";
    prompt.TemplateID = tpl.ID;
    prompt.TypeID = CHAT_TYPE_ID;
    prompt.Status = "Active";
    prompt.ResponseFormat = "JSON";
    prompt.OutputType = "object";
    prompt.OutputExample = JSON.stringify({ score: 0.8, reason: "Warm, enthusiastic reviews praising the resources." });
    prompt.SelectionStrategy = "Specific";
    prompt.PromptRole = "System";
    prompt.PromptPosition = "First";
    prompt.Temperature = 0.1;
    prompt.EnableCaching = true;
    prompt.CacheTTLSeconds = 86400;
    await save(prompt, "AIPrompt");
    console.log(`AIPrompt ${prompt.ID}`);

    // 4. Pin Gemini 1.5 Flash (Specific strategy)
    const pm = await md.GetEntityObject("MJ: AI Prompt Models", user);
    pm.NewRecord();
    pm.PromptID = prompt.ID;
    pm.ModelID = GEMINI_FLASH_MODEL_ID;
    pm.VendorID = GOOGLE_VENDOR_ID;
    pm.Priority = 1;
    pm.Status = "Active";
    await save(pm, "AIPromptModel");
    console.log(`AIPromptModel ${pm.ID} → Gemini 1.5 Flash`);

    console.log("\n✓ seeded. Edit the prompt later in MJExplorer → MJ: Templates / Template Contents.");
    await pool.close();
}

main().catch((e) => { console.error("SEED FAILED:", e.message); process.exit(1); });
