/**
 * Verify Sonar: Unpublish Model. Confirms the action class registers + runs:
 *  1. A Draft model → returns SUCCESS "already Draft" (idempotent, no mutation).
 *  2. (optional) An Active model → flips to Draft. Pass a model name as argv[2] to actually unpublish it.
 *
 * Run:  set -a && . ./.env && set +a && node scripts/test-unpublish-model.mjs ["Model Name"]
 */
import sql from "mssql";
import { setupSQLServerClient, SQLServerProviderConfigData, UserCache } from "@memberjunction/sqlserver-dataprovider";
import { ActionEngineServer } from "@memberjunction/actions";
import { RunView } from "@memberjunction/core";
import "@memberjunction/core-entities";
import "@mj-biz-apps/sonar-entities";
import "@mj-biz-apps/sonar-actions";

const SCORE_MODEL = "MJ_BizApps_Sonar: Score Models";
let engine, user;

function readResult(res) {
    const m = (res.Params ?? []).filter((p) => p.Name === "Result");
    try { return m.length ? JSON.parse(m[m.length - 1].Value) : null; } catch { return null; }
}
async function run(name, params) {
    const action = engine.Actions.find((a) => a.Name === name);
    if (!action) throw new Error(`action '${name}' not registered`);
    const res = await engine.RunAction({ Action: action, ContextUser: user, Params: params, Filters: [] });
    return { res, payload: readResult(res) };
}

async function main() {
    const pool = new sql.ConnectionPool({ user: "sa", password: "Securepassword!23", server: "localhost", port: 1433, database: "Sonar_Demo", options: { trustServerCertificate: true, encrypt: false } });
    await pool.connect();
    await setupSQLServerClient(new SQLServerProviderConfigData(pool, "__mj"));
    await UserCache.Instance.Refresh(pool);
    user = UserCache.Users.find((u) => u?.Type?.trim().toLowerCase() === "owner") ?? UserCache.Users[0];
    engine = ActionEngineServer.Instance;
    await engine.Config(false, user);

    const rv = await new RunView().RunView({ EntityName: SCORE_MODEL, Fields: ["ID", "Name", "Status"], ResultType: "simple" }, user);
    const models = rv.Results ?? [];
    console.log("Models:", models.map((m) => `${m.Name} [${m.Status}]`).join(", "));

    const target = process.argv[2];
    if (target) {
        console.log(`\n→ Unpublishing '${target}' by name...`);
        const { res, payload } = await run("Sonar: Unpublish Model", [{ Name: "ModelName", Type: "Input", Value: target }]);
        console.log(`  ${res.Success ? "✓" : "✖"} ${res.ResultCode}: ${res.Message}`);
        console.log("  payload:", JSON.stringify(payload));
    } else {
        const draft = models.find((m) => m.Status === "Draft");
        if (!draft) { console.log("\n(no Draft model to test the idempotent path)"); }
        else {
            console.log(`\n→ Idempotent check on Draft '${draft.Name}' (should say already Draft, no mutation)...`);
            const { res, payload } = await run("Sonar: Unpublish Model", [{ Name: "ModelID", Type: "Input", Value: draft.ID }]);
            console.log(`  ${res.Success ? "✓" : "✖"} ${res.ResultCode}: ${res.Message}`);
            console.log("  payload:", JSON.stringify(payload));
        }
    }
    await pool.close();
}
main().catch((e) => { console.error("TEST FAILED:", e.message); process.exit(1); });
