/**
 * Live end-to-end test of the Sonar Authoring Agent (Loop). Gives it a natural-language task (with
 * the entity/band IDs it needs) and lets the real agent loop plan + call the 4 tool-surface actions
 * via Gemini. Verifies a draft model with a source + factor + band set got built, then cleans up.
 *
 * Run from repo root:  set -a && . ./.env && set +a && node scripts/test-authoring-agent.mjs
 */
import sql from "mssql";
import { setupSQLServerClient, SQLServerProviderConfigData, UserCache } from "@memberjunction/sqlserver-dataprovider";
import { Metadata, RunView } from "@memberjunction/core";
import { AIEngine } from "@memberjunction/aiengine";
import { AgentRunner } from "@memberjunction/ai-agents";
import "@memberjunction/core-entities";
import "@mj-biz-apps/sonar-entities";
import "@mj-biz-apps/sonar-actions";
import "@memberjunction/core-actions";
import "@memberjunction/ai-gemini"; // register the GeminiLLM driver

const S = "__mj_BizAppsSonar";
const MODEL_NAME = "zz-agent-test-model";
const TASK = `Build a draft engagement model named "${MODEL_NAME}" for the Members anchor
(anchorEntityID 9BE750F1-669A-4CBD-B377-4C490E1A73D6).
Then add the Event Registrations data source (relatedEntityID 86625C5B-F43C-4197-9CE1-7CCD728D5A4E, alias "events").
Then add ONE declarative factor named "Event Count" that counts event registrations on that source
(aggregation Count, normalizationMethod MinMax, higherIsBetter true, weight 1).
Then attach band set 7E3B9C42-0A1D-4E58-9B6F-2C4D8A1F0B30.
Leave the model as a draft. Report what you built.`;

let pool;

async function main() {
    pool = new sql.ConnectionPool({ user: "sa", password: "Securepassword!23", server: "localhost", port: 1433, database: "Sonar_Demo", options: { trustServerCertificate: true, encrypt: false } });
    await pool.connect();
    await setupSQLServerClient(new SQLServerProviderConfigData(pool, "__mj"));
    await UserCache.Instance.Refresh(pool);
    const user = UserCache.Users.find((u) => u?.Type?.trim().toLowerCase() === "owner") ?? UserCache.Users[0];
    await AIEngine.Instance.Config(false, user);

    const agentRes = await new RunView().RunView({ EntityName: "MJ: AI Agents", ExtraFilter: `Name='Sonar Authoring Agent'`, ResultType: "entity_object" }, user);
    if (!agentRes.Success || !agentRes.Results.length) throw new Error("Sonar Authoring Agent not found — seed it first.");
    const agent = agentRes.Results[0];
    // Standalone script has no embedding model; note/example injection does semantic search and would
    // fail on EmbedText. Disable them IN-MEMORY for this run (not saved) — MJAPI keeps them on.
    agent.InjectNotes = false;
    agent.InjectExamples = false;

    console.log("\n— Running the Sonar Authoring Agent on a natural-language task —\n");
    const runner = new AgentRunner();
    const result = await runner.RunAgent({
        agent,
        conversationMessages: [{ role: "user", content: TASK }],
        contextUser: user,
        onProgress: (p) => { if (p?.message) console.log(`  · ${p.step ?? ""} ${p.message}`.trim()); },
    });

    console.log(`\nagent success: ${result?.success}`);
    const finalMsg = result?.agentRun?.Message ?? result?.payload?.message ?? result?.returnValue ?? "(no message)";
    console.log("agent says:", typeof finalMsg === "string" ? finalMsg.slice(0, 600) : JSON.stringify(finalMsg).slice(0, 600));
    await verify();
}

async function verify() {
    const q = async (s) => (await pool.request().query(s)).recordset;
    const m = await q(`SELECT ID, Status, AnchorEntityID, BandSetID FROM ${S}.ScoreModel WHERE Name='${MODEL_NAME}'`);
    if (!m.length) { console.log("\n✗ no model named", MODEL_NAME, "— agent did not build it"); process.exitCode = 1; return; }
    const id = m[0].ID;
    const src = await q(`SELECT COUNT(*) n FROM ${S}.ModelRelatedEntity WHERE ScoreModelID='${id}'`);
    const fac = await q(`SELECT f.Name, f.Aggregation, f.SourceRelatedEntityID, mf.Weight FROM ${S}.ModelFactor mf JOIN ${S}.Factor f ON f.ID=mf.FactorID WHERE mf.ScoreModelID='${id}'`);
    const srcRows = await q(`SELECT ID FROM ${S}.ModelRelatedEntity WHERE ScoreModelID='${id}'`);
    const srcIds = new Set(srcRows.map((r) => r.ID.toLowerCase()));
    const ck = (label, ok, d) => console.log(`  ${ok ? "✓" : "✗"} ${label}${d ? " — " + d : ""}`);
    console.log("\n— Verifying what the agent built —");
    ck("Draft model created with anchor", m[0].Status === "Draft" && !!m[0].AnchorEntityID);
    ck("Band set attached", m[0].BandSetID?.toLowerCase() === "7e3b9c42-0a1d-4e58-9b6f-2c4d8a1f0b30");
    ck("One data source wired", src[0].n === 1, `${src[0].n} source(s)`);
    ck("One factor (Count) created", fac.length === 1 && fac[0].Aggregation === "Count", JSON.stringify(fac[0] ?? {}));
    // The gotcha: did the agent thread the modelRelatedEntityID (not the entity id) into the factor?
    ck("Factor.SourceRelatedEntityID points at the wired source", fac.length === 1 && srcIds.has((fac[0].SourceRelatedEntityID ?? "").toLowerCase()), fac[0]?.SourceRelatedEntityID);
}

async function cleanup() {
    if (!pool) return;
    const q = async (s) => (await pool.request().query(s)).recordset;
    const m = await q(`SELECT ID FROM ${S}.ScoreModel WHERE Name='${MODEL_NAME}'`);
    for (const row of m) {
        const id = row.ID;
        await pool.request().query(`DELETE FROM ${S}.ModelFactor WHERE ScoreModelID='${id}'`);
        await pool.request().query(`DELETE FROM ${S}.Factor WHERE ScoreModelID='${id}'`);
        await pool.request().query(`DELETE FROM ${S}.ModelRelatedEntity WHERE ScoreModelID='${id}'`);
        await pool.request().query(`DELETE FROM ${S}.ScoreModel WHERE ID='${id}'`);
    }
    if (m.length) console.log("\n— Cleaned up throwaway model(s) —", m.length);
}

try {
    await main();
} catch (e) {
    console.error("\n❌ agent test error:", e.message);
    process.exitCode = 1;
} finally {
    await cleanup();
    if (pool) await sql.close();
}
