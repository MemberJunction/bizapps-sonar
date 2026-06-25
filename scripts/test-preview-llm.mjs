/**
 * End-to-end PREVIEW test: runs the real RecomputeOrchestrator.computeScores (the same path
 * "Simulate" uses) on a membership model that has the LLM sentiment factor, proving the action
 * factor runs over the whole population through the engine — not just a standalone AIPrompt call.
 * Run:  set -a && . ./.env && set +a && node scripts/test-preview-llm.mjs
 */
import sql from "mssql";
import { setupSQLServerClient, SQLServerProviderConfigData, UserCache } from "@memberjunction/sqlserver-dataprovider";
import { AIEngine } from "@memberjunction/aiengine";
import { RecomputeOrchestrator } from "@mj-biz-apps/sonar-engine";
import "@memberjunction/core-entities";
import "@mj-biz-apps/sonar-entities"; // register Sonar entity subclasses (ScoreModel/Factor/…)
import "@mj-biz-apps/sonar-actions"; // register SonarReviewSentiment + friends
import "@memberjunction/core-actions";
import "@memberjunction/ai-gemini"; // GeminiLLM driver

const MODEL_ID = "A2708489-D1B1-45FA-BB27-F61C058C40CE"; // Context Test Model (membership, has the sentiment factor)

async function main() {
    const pool = new sql.ConnectionPool({
        user: "sa", password: "Securepassword!23", server: "localhost", port: 1433,
        database: "Sonar_Demo", options: { trustServerCertificate: true, encrypt: false },
    });
    await pool.connect();
    await setupSQLServerClient(new SQLServerProviderConfigData(pool, "__mj"));
    await UserCache.Instance.Refresh(pool);
    const user = UserCache.Users.find((u) => u?.Type?.trim().toLowerCase() === "owner") ?? UserCache.Users[0];
    await AIEngine.Instance.Config(false, user);

    console.log("Running computeScores (preview path) over the population…\n");
    const scores = await new RecomputeOrchestrator().computeScores(MODEL_ID, new Date(), user);

    const first = [...scores.values()][0];
    console.log("ScoreResult shape:", JSON.stringify(first, null, 1), "\n");

    // member names for readability
    const names = new Map();
    const mres = await new (await import("@memberjunction/core")).RunView().RunView(
        { EntityName: "Members", Fields: ["ID", "FirstName", "LastName", "Status"], ResultType: "simple" }, user);
    for (const m of mres.Results ?? []) names.set(m.ID, `${m.FirstName} ${m.LastName} [${m.Status}]`);

    for (const [anchorId, res] of scores) {
        console.log(`${(names.get(anchorId) ?? anchorId).padEnd(34)} ${JSON.stringify(res)}`);
    }
    console.log(`\n${scores.size} members scored.`);
    await pool.close();
}

main().catch((e) => { console.error("PREVIEW TEST FAILED:", e.message); process.exit(1); });
