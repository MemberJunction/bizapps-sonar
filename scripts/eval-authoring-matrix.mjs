/**
 * Breadth eval for the Sonar Authoring Agent — a SCENARIO MATRIX (vs eval-authoring-agent.mjs, which
 * repeats one task). Probes the gaps the single-shape eval can't see:
 *   1. new-single        — baseline: build a complete draft model.
 *   2. new-multi         — two sources + two factors in one build.
 *   3. edit-existing     — add a source + factor to an EXISTING draft (the chaining path, unproven).
 *   4. refuse-published  — asked to edit an Active model; must refuse gracefully (no edit, no crash).
 *   5. sum-probe         — Sum factor with NO column given; reveals if it can pick a field w/o a column tool.
 *
 * Each scenario sets up its own fixtures, runs the agent once, checks the DB, cleans up. Read-write but
 * self-cleaning. Run from repo root:  set -a && . ./.env && set +a && node scripts/eval-authoring-matrix.mjs
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

const S = "__mj_BizAppsSonar";
const SCORE_MODEL = "MJ_BizApps_Sonar: Score Models";
const MEMBERS = "9BE750F1-669A-4CBD-B377-4C490E1A73D6";
const EVENT_REG = "86625C5B-F43C-4197-9CE1-7CCD728D5A4E";
const CERTS = "108CC618-F646-4043-A074-286A77A7E726";
const PAYMENTS = "91CB4C46-FCA1-472A-AE86-5A7BCB89EC0D";
const BANDSET = "7E3B9C42-0A1D-4E58-9B6F-2C4D8A1F0B30";
const STAMP = Date.now().toString().slice(-5);

let pool, agent, user;
const q = async (s) => (await pool.request().query(s)).recordset;

// ---- DB helpers ----
const modelByName = async (name) => (await q(`SELECT ID, Status FROM ${S}.ScoreModel WHERE Name='${name}'`))[0] ?? null;
const sourceCount = async (id) => (await q(`SELECT COUNT(*) n FROM ${S}.ModelRelatedEntity WHERE ScoreModelID='${id}'`))[0].n;
const factorsOf = async (id) => q(`SELECT Name, Aggregation, AggregateFieldName FROM ${S}.Factor WHERE ScoreModelID='${id}'`);
const hasBandSet = async (id) => !!(await q(`SELECT BandSetID FROM ${S}.ScoreModel WHERE ID='${id}'`))[0]?.BandSetID;

async function cleanupByName(name) {
    for (const r of await q(`SELECT ID FROM ${S}.ScoreModel WHERE Name='${name}'`)) {
        await pool.request().query(`DELETE FROM ${S}.ModelFactor WHERE ScoreModelID='${r.ID}'`);
        await pool.request().query(`DELETE FROM ${S}.Factor WHERE ScoreModelID='${r.ID}'`);
        await pool.request().query(`DELETE FROM ${S}.ModelRelatedEntity WHERE ScoreModelID='${r.ID}'`);
        await pool.request().query(`DELETE FROM ${S}.ScoreModel WHERE ID='${r.ID}'`);
    }
}

/** Create a seed Draft model directly (no agent), so an edit/refuse scenario has something to act on. */
async function createSeed(name, { active = false } = {}) {
    const md = new Metadata();
    const m = await md.GetEntityObject(SCORE_MODEL, user);
    m.NewRecord();
    m.Name = name;
    m.Slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    m.Status = "Draft";
    m.AnchorEntityID = MEMBERS;
    if (!(await m.Save())) throw new Error(`seed '${name}' save failed: ${m.LatestResult?.Message}`);
    // Flip to Active via raw SQL to bypass the publish workflow — we just need a non-Draft fixture.
    if (active) await pool.request().query(`UPDATE ${S}.ScoreModel SET Status='Active' WHERE ID='${m.ID}'`);
    return m.ID;
}

async function runAgent(task) {
    try {
        return await new AgentRunner().RunAgent({ agent, conversationMessages: [{ role: "user", content: task }], contextUser: user });
    } catch (e) {
        return { success: false, _threw: e.message?.slice(0, 100) };
    }
}

// ---- Scenarios: each returns { ok, detail } ----
async function newSingle() {
    const name = `mtx-single-${STAMP}`;
    await cleanupByName(name);
    await runAgent(`Build a draft model named "${name}" for Members (anchorEntityID ${MEMBERS}). Add the Event Registrations source (relatedEntityID ${EVENT_REG}, alias events). Add a Count factor named "Event Count" on alias events. Attach band set ${BANDSET}. Leave it a draft.`);
    const m = await modelByName(name);
    const facs = m ? await factorsOf(m.ID) : [];
    const ok = !!m && (await sourceCount(m.ID)) >= 1 && facs.length >= 1 && (await hasBandSet(m.ID));
    const detail = m ? `sources=${await sourceCount(m.ID)} factors=${facs.length} band=${await hasBandSet(m.ID)}` : "no model";
    await cleanupByName(name);
    return { ok, detail };
}

async function newMulti() {
    const name = `mtx-multi-${STAMP}`;
    await cleanupByName(name);
    await runAgent(`Build a draft model named "${name}" for Members (anchorEntityID ${MEMBERS}). Add two sources: Event Registrations (relatedEntityID ${EVENT_REG}, alias events) and Certifications (relatedEntityID ${CERTS}, alias certs). Add a Count factor "Event Count" on alias events and a Count factor "Cert Count" on alias certs. Attach band set ${BANDSET}.`);
    const m = await modelByName(name);
    const facs = m ? await factorsOf(m.ID) : [];
    const ok = !!m && (await sourceCount(m.ID)) >= 2 && facs.length >= 2;
    const detail = m ? `sources=${await sourceCount(m.ID)} factors=${facs.length} (${facs.map((f) => f.Name).join(", ")})` : "no model";
    await cleanupByName(name);
    return { ok, detail };
}

async function editExisting() {
    const name = `mtx-edit-${STAMP}`;
    await cleanupByName(name);
    await createSeed(name); // bare Draft, no sources
    await runAgent(`The draft model "${name}" already exists. Add the Event Registrations source (relatedEntityID ${EVENT_REG}, alias events) to it and create a Count factor named "Event Count" on that source.`);
    const m = await modelByName(name);
    const facs = m ? await factorsOf(m.ID) : [];
    const ok = !!m && (await sourceCount(m.ID)) >= 1 && facs.length >= 1;
    const detail = m ? `sources=${await sourceCount(m.ID)} factors=${facs.length}` : "no model (seed lost!)";
    await cleanupByName(name);
    return { ok, detail };
}

async function refusePublished() {
    const name = `mtx-pub-${STAMP}`;
    await cleanupByName(name);
    const id = await createSeed(name, { active: true });
    const res = await runAgent(`Add a Count factor named "Late Add" on the Event Registrations source (relatedEntityID ${EVENT_REG}) to the model "${name}".`);
    const facs = await factorsOf(id);
    // PASS = it did NOT add a factor (correctly blocked) and the run didn't throw.
    const ok = facs.length === 0 && !res._threw;
    const reply = (res?.agentRun?.Message ?? "").toString().replace(/\s+/g, " ").slice(0, 90);
    const detail = `factorsAdded=${facs.length} threw=${!!res._threw} reply="${reply}"`;
    await cleanupByName(name);
    return { ok, detail };
}

async function sumProbe() {
    const name = `mtx-sum-${STAMP}`;
    await cleanupByName(name);
    await runAgent(`Build a draft model named "${name}" for Members (anchorEntityID ${MEMBERS}). Add the Payments source (relatedEntityID ${PAYMENTS}, alias pay). Add a factor "Total Paid" that SUMS the payment amount on alias pay. Attach band set ${BANDSET}.`);
    const m = await modelByName(name);
    const facs = m ? await factorsOf(m.ID) : [];
    const sumFac = facs.find((f) => f.Aggregation === "Sum");
    // PASS = a Sum factor exists with SOME aggregateFieldName (did it find a column without a column tool?).
    const ok = !!sumFac && !!sumFac.AggregateFieldName;
    const detail = m ? `factors=${facs.length} sumField=${sumFac ? sumFac.AggregateFieldName ?? "(none)" : "no Sum factor"}` : "no model";
    await cleanupByName(name);
    return { ok, detail };
}

const SCENARIOS = [
    ["new-single", newSingle],
    ["new-multi", newMulti],
    ["edit-existing", editExisting],
    ["refuse-published", refusePublished],
    ["sum-probe", sumProbe],
];

async function main() {
    pool = new sql.ConnectionPool({ user: "sa", password: "Securepassword!23", server: "localhost", port: 1433, database: "Sonar_Demo", options: { trustServerCertificate: true, encrypt: false } });
    await pool.connect();
    await setupSQLServerClient(new SQLServerProviderConfigData(pool, "__mj"));
    await UserCache.Instance.Refresh(pool);
    user = UserCache.Users.find((u) => u?.Type?.trim().toLowerCase() === "owner") ?? UserCache.Users[0];
    await AIEngine.Instance.Config(false, user);
    const r = await new RunView().RunView({ EntityName: "MJ: AI Agents", ExtraFilter: `Name='Sonar Authoring Agent'`, ResultType: "entity_object" }, user);
    agent = r.Results?.[0];
    if (!agent) throw new Error("Sonar Authoring Agent not found");
    agent.InjectNotes = false;
    agent.InjectExamples = false;

    console.log(`\n— Authoring agent matrix (${SCENARIOS.length} scenarios) —`);
    let passed = 0;
    for (const [name, fn] of SCENARIOS) {
        let out;
        try { out = await fn(); } catch (e) { out = { ok: false, detail: `threw: ${e.message?.slice(0, 80)}` }; }
        console.log(`  ${out.ok ? "✓" : "✗"} ${name.padEnd(17)} ${out.detail}`);
        if (out.ok) passed++;
    }
    console.log(`\nPassed: ${passed}/${SCENARIOS.length}`);
    await sql.close();
}
main().catch((e) => { console.error("MATRIX FAILED:", e.message); process.exit(1); });
