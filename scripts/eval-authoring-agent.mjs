/**
 * Completion-rate eval for the Sonar Authoring Agent. Runs the same "build a full model" task N times
 * (server-side via AgentRunner) and checks whether each run produced a COMPLETE draft (model + source
 * + factor + band set). Cleans up each throwaway. Use it to measure agent reliability before/after
 * changes (it's nondeterministic, so we want a rate, not one run).
 *
 * Run from repo root:  set -a && . ./.env && set +a && node scripts/eval-authoring-agent.mjs [N]
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
import "@memberjunction/ai-gemini";

const N = parseInt(process.argv[2] ?? "3", 10);
const S = "__mj_BizAppsSonar";
const ANCHOR = "9BE750F1-669A-4CBD-B377-4C490E1A73D6"; // Members
const RELATED = "86625C5B-F43C-4197-9CE1-7CCD728D5A4E"; // Event Registrations
const BANDSET = "7E3B9C42-0A1D-4E58-9B6F-2C4D8A1F0B30";

const task = (name) => `Build a draft model named "${name}" for the Members anchor (anchorEntityID ${ANCHOR}). ` +
    `Add the Event Registrations source (relatedEntityID ${RELATED}, alias events). ` +
    `Add a Count factor named "Event Count" on that source (MinMax, higherIsBetter true, weight 1). ` +
    `Attach band set ${BANDSET}. Leave it a draft.`;

let pool;

async function completeness(name) {
    const q = async (s) => (await pool.request().query(s)).recordset;
    const m = await q(`SELECT ID, BandSetID FROM ${S}.ScoreModel WHERE Name='${name}'`);
    if (!m.length) return { ok: false, detail: "no model" };
    const id = m[0].ID;
    const src = (await q(`SELECT COUNT(*) n FROM ${S}.ModelRelatedEntity WHERE ScoreModelID='${id}'`))[0].n;
    const fac = (await q(`SELECT COUNT(*) n FROM ${S}.ModelFactor WHERE ScoreModelID='${id}'`))[0].n;
    const bands = !!m[0].BandSetID;
    const ok = src >= 1 && fac >= 1 && bands;
    return { ok, detail: `sources=${src} factors=${fac} bandSet=${bands}`, id };
}

async function cleanup(name) {
    const q = async (s) => (await pool.request().query(s)).recordset;
    for (const r of await q(`SELECT ID FROM ${S}.ScoreModel WHERE Name='${name}'`)) {
        await pool.request().query(`DELETE FROM ${S}.ModelFactor WHERE ScoreModelID='${r.ID}'`);
        await pool.request().query(`DELETE FROM ${S}.Factor WHERE ScoreModelID='${r.ID}'`);
        await pool.request().query(`DELETE FROM ${S}.ModelRelatedEntity WHERE ScoreModelID='${r.ID}'`);
        await pool.request().query(`DELETE FROM ${S}.ScoreModel WHERE ID='${r.ID}'`);
    }
}

async function main() {
    pool = new sql.ConnectionPool({ user: "sa", password: "Securepassword!23", server: "localhost", port: 1433, database: "Sonar_Demo", options: { trustServerCertificate: true, encrypt: false } });
    await pool.connect();
    await setupSQLServerClient(new SQLServerProviderConfigData(pool, "__mj"));
    await UserCache.Instance.Refresh(pool);
    const user = UserCache.Users.find((u) => u?.Type?.trim().toLowerCase() === "owner") ?? UserCache.Users[0];
    await AIEngine.Instance.Config(false, user);

    const agentRes = await new RunView().RunView({ EntityName: "MJ: AI Agents", ExtraFilter: `Name='Sonar Authoring Agent'`, ResultType: "entity_object" }, user);
    const agent = agentRes.Results?.[0];
    if (!agent) throw new Error("Sonar Authoring Agent not found");
    agent.InjectNotes = false;
    agent.InjectExamples = false;

    console.log(`\n— Completion-rate eval: ${N} run(s) —`);
    let passed = 0;
    for (let i = 1; i <= N; i++) {
        const name = `eval-model-${i}-${Date.now().toString().slice(-5)}`;
        await cleanup(name);
        const runner = new AgentRunner();
        let res;
        try {
            res = await runner.RunAgent({ agent, conversationMessages: [{ role: "user", content: task(name) }], contextUser: user });
        } catch (e) {
            console.log(`  ✗ run ${i}: threw — ${e.message?.slice(0, 80)}`);
            await cleanup(name);
            continue;
        }
        const c = await completeness(name);
        const reply = (res?.agentRun?.Message ?? res?.payload?.message ?? "").toString().replace(/\s+/g, " ").slice(0, 140);
        console.log(`  ${c.ok ? "✓" : "✗"} run ${i}: ${c.detail}${c.ok ? "" : ` | success=${res?.success} reply="${reply}"`}`);
        if (c.ok) passed++;
        await cleanup(name);
    }
    console.log(`\nCompletion rate: ${passed}/${N}`);
    await sql.close();
}
main().catch((e) => { console.error("EVAL FAILED:", e.message); process.exit(1); });
