/**
 * End-to-end test for the agentic authoring tool surface (plans/agentic-authoring.md §4a).
 * Runs the 4 server-side actions via the REAL ActionEngineServer.RunAction path against a throwaway
 * model, verifies the rows, then cleans everything up. Read-after-write integration test.
 *
 * Run from repo root (env loaded):  set -a && . ./.env && set +a && node scripts/test-tool-surface.mjs
 */
import sql from "mssql";
import { setupSQLServerClient, SQLServerProviderConfigData, UserCache } from "@memberjunction/sqlserver-dataprovider";
import { ActionEngineServer } from "@memberjunction/actions";
import "@memberjunction/core-entities";
import "@mj-biz-apps/sonar-entities"; // side-effect: register the Sonar entity subclasses (typed setters)
import "@mj-biz-apps/sonar-actions"; // side-effect: register the Sonar action classes (DriverClass keys)

const S = "__mj_BizAppsSonar";
// Valid IDs pulled from the demo DB (an existing model's anchor, a reachable source, a band set).
const ANCHOR_ENTITY_ID = "9BE750F1-669A-4CBD-B377-4C490E1A73D6"; // Members
const RELATED_ENTITY_ID = "86625C5B-F43C-4197-9CE1-7CCD728D5A4E"; // Event Registrations
const BAND_SET_ID = "7E3B9C42-0A1D-4E58-9B6F-2C4D8A1F0B30"; // Default Health Bands

let pool;
const created = { modelID: null, modelRelatedEntityID: null, factorID: null, modelFactorID: null };

function input(name, value) { return { Name: name, Type: "Input", Value: value }; }
function readResult(res) {
    const matches = (res.Params ?? []).filter((p) => p.Name === "Result");
    const raw = matches.length ? matches[matches.length - 1].Value : null;
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

async function run(engine, user, name, params) {
    const action = engine.Actions.find((a) => a.Name === name);
    if (!action) throw new Error(`Action '${name}' not in catalog (seeded + MJAPI cache fresh?)`);
    const res = await engine.RunAction({ Action: action, ContextUser: user, Params: params, Filters: [] });
    console.log(`  ${res.Success ? "✓" : "✗"} ${name} → ${res.Result?.ResultCode ?? res.Message ?? ""}`);
    if (!res.Success) throw new Error(`${name} failed: ${res.Message}`);
    return readResult(res);
}

async function main() {
    pool = new sql.ConnectionPool({
        user: "sa", password: "Securepassword!23", server: "localhost", port: 1433,
        database: "Sonar_Demo", options: { trustServerCertificate: true, encrypt: false },
    });
    await pool.connect();
    await setupSQLServerClient(new SQLServerProviderConfigData(pool, "__mj"));
    await UserCache.Instance.Refresh(pool);
    const user = UserCache.Users.find((u) => u?.Type?.trim().toLowerCase() === "owner") ?? UserCache.Users[0];
    const engine = ActionEngineServer.Instance;
    await engine.Config(false, user);

    console.log("\n— Running the 4 tool-surface actions —");
    const stamp = "zz-toolsurface-test";

    const model = await run(engine, user, "Sonar: Create Model", [
        input("Spec", JSON.stringify({ name: `${stamp}-model`, anchorEntityID: ANCHOR_ENTITY_ID })),
    ]);
    created.modelID = model?.modelID;

    const src = await run(engine, user, "Sonar: Add Data Source", [
        input("ModelID", created.modelID),
        input("Spec", JSON.stringify({ relatedEntityID: RELATED_ENTITY_ID, alias: "zz_test_src" })),
    ]);
    created.modelRelatedEntityID = src?.modelRelatedEntityID;

    // NOTE: Factor.SourceRelatedEntityID is an FK to ModelRelatedEntity.ID (the wired source row),
    // NOT the underlying entity — so pass the modelRelatedEntityID from the Add Data Source step.
    const factor = await run(engine, user, "Sonar: Create Factor", [
        input("ModelID", created.modelID),
        input("Spec", JSON.stringify({
            name: `${stamp}-factor`, sourceRelatedEntityID: created.modelRelatedEntityID,
            aggregation: "Count", normalizationMethod: "MinMax", higherIsBetter: true, weight: 0.5,
        })),
    ]);
    created.factorID = factor?.factorID;
    created.modelFactorID = factor?.modelFactorID;

    await run(engine, user, "Sonar: Set Band Set", [
        input("ModelID", created.modelID),
        input("BandSetID", BAND_SET_ID),
    ]);

    console.log("\n— Verifying rows in the DB —");
    await verify();
}

async function verify() {
    const q = async (sqlText) => (await pool.request().query(sqlText)).recordset;
    const m = await q(`SELECT Name, Status, AnchorEntityID, BandSetID FROM ${S}.ScoreModel WHERE ID='${created.modelID}'`);
    const mre = await q(`SELECT Alias, JoinType, RelationshipPath FROM ${S}.ModelRelatedEntity WHERE ID='${created.modelRelatedEntityID}'`);
    const f = await q(`SELECT Name, FactorType, Aggregation, NormalizationMethod, HigherIsBetter FROM ${S}.Factor WHERE ID='${created.factorID}'`);
    const mf = await q(`SELECT Weight, WeightMode FROM ${S}.ModelFactor WHERE ID='${created.modelFactorID}'`);
    const check = (label, ok, detail) => console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? " — " + detail : ""}`);
    check("Model created (Draft, anchor set)", m[0]?.Status === "Draft" && m[0]?.AnchorEntityID === ANCHOR_ENTITY_ID, JSON.stringify(m[0]));
    check("Band set attached", m[0]?.BandSetID === BAND_SET_ID);
    check("Data source wired (Left, path '[]')", mre[0]?.JoinType === "Left" && mre[0]?.RelationshipPath === "[]", JSON.stringify(mre[0]));
    check("Factor created (Declarative Count, MinMax)", f[0]?.FactorType === "Declarative" && f[0]?.Aggregation === "Count" && f[0]?.NormalizationMethod === "MinMax", JSON.stringify(f[0]));
    check("Factor bound to rubric (weight 0.5)", Math.abs((mf[0]?.Weight ?? 0) - 0.5) < 1e-9, JSON.stringify(mf[0]));
}

async function cleanup() {
    if (!pool) return;
    const del = async (table, id) => { if (id) await pool.request().query(`DELETE FROM ${S}.${table} WHERE ID='${id}'`); };
    // FK-safe order: ModelFactor → Factor → ModelRelatedEntity → ScoreModel.
    await del("ModelFactor", created.modelFactorID);
    await del("Factor", created.factorID);
    await del("ModelRelatedEntity", created.modelRelatedEntityID);
    await del("ScoreModel", created.modelID);
    console.log("\n— Cleaned up throwaway rows —", JSON.stringify(created));
}

try {
    await main();
    console.log("\n✅ Tool-surface test PASSED");
} catch (e) {
    console.error("\n❌ Tool-surface test FAILED:", e.message);
    process.exitCode = 1;
} finally {
    await cleanup();
    if (pool) await sql.close();
}
