/**
 * Test the agent's READ tools (plans/agentic-authoring.md §5): Sonar: Describe Model and
 * Sonar: List Related Entities. Runs them via the real ActionEngineServer.RunAction path against an
 * existing demo model — read-only, no cleanup needed.
 *
 * Run from repo root (env loaded):  set -a && . ./.env && set +a && node scripts/test-read-tools.mjs
 */
import sql from "mssql";
import { setupSQLServerClient, SQLServerProviderConfigData, UserCache } from "@memberjunction/sqlserver-dataprovider";
import { ActionEngineServer } from "@memberjunction/actions";
import "@memberjunction/core-entities";
import "@mj-biz-apps/sonar-entities";
import "@mj-biz-apps/sonar-actions";

const ANCHOR_MEMBERS = "9BE750F1-669A-4CBD-B377-4C490E1A73D6";

function input(name, value) { return { Name: name, Type: "Input", Value: value }; }
function readResult(res) {
    const matches = (res.Params ?? []).filter((p) => p.Name === "Result");
    const raw = matches.length ? matches[matches.length - 1].Value : null;
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}
async function run(engine, user, name, params) {
    const action = engine.Actions.find((a) => a.Name === name);
    if (!action) throw new Error(`Action '${name}' not in catalog (seeded + cache fresh?)`);
    const res = await engine.RunAction({ Action: action, ContextUser: user, Params: params, Filters: [] });
    console.log(`  ${res.Success ? "✓" : "✗"} ${name} → ${res.Result?.ResultCode ?? res.Message ?? ""}`);
    if (!res.Success) throw new Error(`${name} failed: ${res.Message}`);
    return readResult(res);
}

async function main() {
    const pool = new sql.ConnectionPool({ user: "sa", password: "Securepassword!23", server: "localhost", port: 1433, database: "Sonar_Demo", options: { trustServerCertificate: true, encrypt: false } });
    await pool.connect();
    await setupSQLServerClient(new SQLServerProviderConfigData(pool, "__mj"));
    await UserCache.Instance.Refresh(pool);
    const user = UserCache.Users.find((u) => u?.Type?.trim().toLowerCase() === "owner") ?? UserCache.Users[0];
    const engine = ActionEngineServer.Instance;
    await engine.Config(false, user);

    // Pick an existing model to describe (anchor = Members).
    const someModel = (await pool.request().query(`SELECT TOP 1 Name FROM __mj_BizAppsSonar.ScoreModel WHERE AnchorEntityID='${ANCHOR_MEMBERS}' ORDER BY __mj_CreatedAt DESC`)).recordset[0]?.Name;
    if (!someModel) throw new Error("no Members-anchored model to describe");

    console.log("\n— Describe Model —");
    const desc = await run(engine, user, "Sonar: Describe Model", [input("Name", someModel)]);
    console.log(`    model="${desc.name}" status=${desc.status} anchor=${desc.anchorEntityName}`);
    console.log(`    sources=${desc.sources.map((s) => `${s.alias}:${s.relatedEntityName}`).join(", ") || "(none)"}`);
    console.log(`    factors=${desc.factors.map((f) => `${f.name}(${f.aggregation}/${f.sourceAlias},w=${f.weight})`).join(", ") || "(none)"}`);
    console.log(`    bandSet=${desc.bandSet ? desc.bandSet.name : "(none)"}`);

    console.log("\n— List Related Entities (Members) —");
    const rel = await run(engine, user, "Sonar: List Related Entities", [input("AnchorEntityID", ANCHOR_MEMBERS)]);
    console.log(`    anchor=${rel.anchorEntityName}, ${rel.related.length} joinable business entities:`);
    for (const r of rel.related.slice(0, 12)) console.log(`      - ${r.entityName} (${r.schemaName}) via ${r.viaField}`);
    if (rel.related.length > 12) console.log(`      … +${rel.related.length - 12} more`);

    console.log("\n— NOT_FOUND path —");
    const action = engine.Actions.find((a) => a.Name === "Sonar: Describe Model");
    const miss = await engine.RunAction({ Action: action, ContextUser: user, Params: [input("Name", "does-not-exist-zzz")], Filters: [] });
    console.log(`  ${miss.Result?.ResultCode === "NOT_FOUND" ? "✓" : "✗"} missing model → ${miss.Result?.ResultCode}`);

    await pool.close();
    console.log("\nDone.");
}
main().catch((e) => { console.error("TEST FAILED:", e.message); process.exit(1); });
