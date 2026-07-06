/**
 * Live verification for the three time-window kinds that had no config rows (Calendar, SinceEvent,
 * RenewalRelative). For each kind: mint a throwaway TimeWindow, build a throwaway model + source +
 * windowed Count factor via the real tool-surface actions, then run RecomputeOrchestrator.computeScores
 * (READ-ONLY — no persistence) to prove the compiled SQL executes on live demo data without error.
 * Cleans up all throwaways. Moves these kinds from "unit-tested" → "verified on real data".
 *
 * Run from repo root:  set -a && . ./.env && set +a && node scripts/test-time-windows.mjs
 */
import sql from "mssql";
import { setupSQLServerClient, SQLServerProviderConfigData, UserCache } from "@memberjunction/sqlserver-dataprovider";
import { ActionEngineServer } from "@memberjunction/actions";
import { Metadata } from "@memberjunction/core";
import { RecomputeOrchestrator } from "@mj-biz-apps/sonar-engine";
import "@memberjunction/core-entities";
import "@mj-biz-apps/sonar-entities";
import "@mj-biz-apps/sonar-actions";

const S = "__mj_BizAppsSonar";
const ANCHOR_ENTITY_ID = "9BE750F1-669A-4CBD-B377-4C490E1A73D6"; // Members
const RELATED_ENTITY_ID = "86625C5B-F43C-4197-9CE1-7CCD728D5A4E"; // Event Registrations
const RELATED_DATE = "EventDate"; // activity-date column on Event Registrations (Factor.DateField)

// The three kinds + the throwaway TimeWindow fields each needs.
const KINDS = [
    { label: "Calendar (month)", fields: { WindowType: "Calendar", LengthMonths: 1 } },
    { label: "SinceEvent (since JoinDate)", fields: { WindowType: "SinceEvent", AnchorDateField: "JoinDate", OffsetDays: 0 } },
    { label: "RenewalRelative (RenewalDate −90d)", fields: { WindowType: "RenewalRelative", AnchorDateField: "RenewalDate", OffsetDays: -90 } },
];

let pool, engine, user;
const TIME_WINDOW = "MJ_BizApps_Sonar: Time Windows";

function input(name, value) { return { Name: name, Type: "Input", Value: value }; }
function readResult(res) {
    const m = (res.Params ?? []).filter((p) => p.Name === "Result");
    try { return m.length ? JSON.parse(m[m.length - 1].Value) : null; } catch { return null; }
}
async function run(name, params) {
    const action = engine.Actions.find((a) => a.Name === name);
    const res = await engine.RunAction({ Action: action, ContextUser: user, Params: params, Filters: [] });
    if (!res.Success) throw new Error(`${name}: ${res.Message}`);
    return readResult(res);
}

async function makeWindow(label, fields) {
    const md = new Metadata();
    const tw = await md.GetEntityObject(TIME_WINDOW, user);
    tw.NewRecord();
    tw.Name = `zz-tw-${fields.WindowType}`;
    for (const [k, v] of Object.entries(fields)) tw[k] = v;
    if (!(await tw.Save())) throw new Error(`window save failed: ${tw.LatestResult?.Message}`);
    return tw.ID;
}

/** Force the throwaway model to WeightedSum (computeScores only supports that). */
async function setWeightedSum(modelId) {
    const md = new Metadata();
    const m = await md.GetEntityObject("MJ_BizApps_Sonar: Score Models", user);
    await m.Load(modelId);
    m.CombineStrategy = "WeightedSum";
    await m.Save();
}

async function proveKind(kind) {
    const ids = { window: null, model: null, source: null, factor: null, modelFactor: null };
    try {
        ids.window = await makeWindow(kind.label, kind.fields);
        const model = await run("Sonar: Create Model", [input("Spec", JSON.stringify({ name: `zz-tw-${kind.fields.WindowType}-model`, anchorEntityID: ANCHOR_ENTITY_ID }))]);
        ids.model = model.modelID;
        await setWeightedSum(ids.model);
        const src = await run("Sonar: Add Data Source", [input("ModelID", ids.model), input("Spec", JSON.stringify({ relatedEntityID: RELATED_ENTITY_ID, alias: "zz_evt" }))]);
        ids.source = src.modelRelatedEntityID;
        const f = await run("Sonar: Create Factor", [input("ModelID", ids.model), input("Spec", JSON.stringify({
            name: `zz-tw-${kind.fields.WindowType}-factor`, sourceRelatedEntityID: ids.source,
            aggregation: "Count", timeWindowID: ids.window, dateField: RELATED_DATE,
            normalizationMethod: "MinMax", higherIsBetter: true, weight: 1,
        }))]);
        ids.factor = f.factorID; ids.modelFactor = f.modelFactorID;

        // The proof: compile + run the window SQL against the live population (read-only).
        // asOf sits inside the demo's event range (events run 2025-04 → 2026-05-28).
        const asOf = new Date("2026-05-28T23:59:59Z");
        const scores = await new RecomputeOrchestrator().computeScores(ids.model, asOf, user);
        let withData = 0, totalRecords = 0;
        for (const s of scores.values()) {
            const c = (s.contributions ?? []).find((x) => x.factorId === ids.factor);
            if (c?.hadData) withData++;
            totalRecords += c?.rawValue ?? 0;
        }
        console.log(`  ✓ ${kind.label.padEnd(36)} → SQL ran on ${scores.size} anchors; ${withData} had data; ${totalRecords} records counted in-window`);
        return true;
    } catch (e) {
        console.log(`  ✗ ${kind.label.padEnd(36)} → ${e.message}`);
        return false;
    } finally {
        const del = async (t, id) => { if (id) await pool.request().query(`DELETE FROM ${S}.${t} WHERE ID='${id}'`); };
        await del("ModelFactor", ids.modelFactor);
        await del("Factor", ids.factor);
        await del("ModelRelatedEntity", ids.source);
        await del("ScoreModel", ids.model);
        await del("TimeWindow", ids.window);
    }
}

try {
    pool = new sql.ConnectionPool({ user: "sa", password: "Securepassword!23", server: "localhost", port: 1433, database: "Sonar_Demo", options: { trustServerCertificate: true, encrypt: false } });
    await pool.connect();
    await setupSQLServerClient(new SQLServerProviderConfigData(pool, "__mj"));
    await UserCache.Instance.Refresh(pool);
    user = UserCache.Users.find((u) => u?.Type?.trim().toLowerCase() === "owner") ?? UserCache.Users[0];
    engine = ActionEngineServer.Instance;
    await engine.Config(false, user);

    console.log("\n— Live-verifying the 3 untested window kinds (read-only computeScores) —");
    const results = [];
    for (const k of KINDS) results.push(await proveKind(k));
    const passed = results.filter(Boolean).length;
    console.log(`\n${passed === KINDS.length ? "✅" : "⚠️"} ${passed}/${KINDS.length} window kinds verified on live data`);
    process.exitCode = passed === KINDS.length ? 0 : 1;
} catch (e) {
    console.error("\n❌ harness error:", e.message);
    process.exitCode = 1;
} finally {
    if (pool) await sql.close();
}
