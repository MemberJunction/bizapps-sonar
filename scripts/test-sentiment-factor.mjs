/**
 * End-to-end smoke test for the Sonar: Resource Review Sentiment LLM factor.
 * Exercises the REAL path: load a member's review prose → seeded AIPrompt → live Gemini call → {score, reason}.
 * Run from repo root (env loaded):  set -a && . ./.env && set +a && node scripts/test-sentiment-factor.mjs
 */
import sql from "mssql";
import { setupSQLServerClient, SQLServerProviderConfigData, UserCache } from "@memberjunction/sqlserver-dataprovider";
import { RunView } from "@memberjunction/core";
import { AIEngine } from "@memberjunction/aiengine";
import { AIPromptRunner } from "@memberjunction/ai-prompts";
import "@memberjunction/core-entities";
import "@memberjunction/ai-gemini"; // side-effect: register the GeminiLLM driver class (provider)

const PROMPT_NAME = "Sonar: Resource Review Sentiment";
const REVIEW_ENTITY = "Resource Reviews";
// membership demo set — sentiment should corroborate each member's engagement Status.
const MEMBERS = [
    { id: "B1000000-0000-4000-8000-000000000014", expect: "Lapsed → very low (Benjamin Garcia)" },
    { id: "B1000000-0000-4000-8000-000000000004", expect: "Active but SOURING → low (Noah Williams, early warning)" },
    { id: "B1000000-0000-4000-8000-000000000009", expect: "Grace → cooling/mid (Emma Davis)" },
    { id: "B1000000-0000-4000-8000-000000000015", expect: "Prospect → tentative/mid (Amelia Johnson)" },
    { id: "B1000000-0000-4000-8000-000000000003", expect: "Active → high (Maria Gonzalez)" },
];

async function main() {
    const pool = new sql.ConnectionPool({
        user: "sa", password: "Securepassword!23", server: "localhost", port: 1433,
        database: "Sonar_Demo", options: { trustServerCertificate: true, encrypt: false },
    });
    await pool.connect();
    await setupSQLServerClient(new SQLServerProviderConfigData(pool, "__mj"));
    await UserCache.Instance.Refresh(pool);
    const user = UserCache.Users.find((u) => u?.Type?.trim().toLowerCase() === "owner") ?? UserCache.Users[0];
    await AIEngine.Instance.Config(false, user); // load AI models/vendors/prompts metadata

    const pr = await new RunView().RunView(
        { EntityName: "MJ: AI Prompts", ExtraFilter: `Name='${PROMPT_NAME}'`, MaxRows: 1, ResultType: "entity_object" },
        user,
    );
    if (!pr.Success || !pr.Results?.length) throw new Error(`prompt '${PROMPT_NAME}' not found`);
    const prompt = pr.Results[0];
    const runner = new AIPromptRunner();
    const asOf = new Date().toISOString();

    for (const m of MEMBERS) {
        const rv = await new RunView().RunView(
            {
                EntityName: REVIEW_ENTITY,
                ExtraFilter: `MemberID='${m.id}' AND Review IS NOT NULL AND LEN(Review) > 0 AND CreatedDate <= '${asOf}'`,
                Fields: ["Review", "CreatedDate"],
                OrderBy: "CreatedDate DESC",
                ResultType: "simple",
            },
            user,
        );
        const reviews = (rv.Results ?? [])
            .filter((r) => r.Review)
            .map((r) => ({ text: r.Review, date: new Date(r.CreatedDate).toISOString().slice(0, 10) }));
        const res = await runner.ExecutePrompt({
            prompt,
            data: { reviews: reviews.map((r) => `- (${r.date}) ${r.text}`).join("\n") },
            contextUser: user,
        });
        const out = res.success && res.result ? `score=${res.result.score}  reason="${res.result.reason}"`
            : `FAILED: ${res.errorMessage ?? "no result"}`;
        console.log(`\n[${m.expect}]  (${reviews.length} reviews)\n  → ${out}`);
    }
    await pool.close();
}

main().catch((e) => { console.error("TEST FAILED:", e.message); process.exit(1); });
