/**
 * Standalone live test for the Action-backed factor harness (no MJAPI / no UI).
 * Binds an Approved "Member Activity Streak" ActionBacked factor onto the cheese model,
 * runs RecomputeOrchestrator.computeScores (NO persist), and prints real streak numbers.
 *
 * Run from repo root:  node scripts/streak-livetest.mjs
 * Idempotent: reuses the streak factor if it's already bound.
 */
import sql from "mssql";
import { setupSQLServerClient, SQLServerProviderConfigData, UserCache } from "@memberjunction/sqlserver-dataprovider";
import { Metadata, RunView } from "@memberjunction/core";
import { RecomputeOrchestrator } from "@mj-biz-apps/sonar-engine";
import "@mj-biz-apps/sonar-entities"; // side-effect: @RegisterClass registers the Factor/ModelFactor subclasses
import "@mj-biz-apps/sonar-actions"; // side-effect: @RegisterClass registers SonarMemberActivityStreak

const CHEESE_MODEL = "C7265ABE-2607-4563-B999-514AE4127FC4";
const ANCHOR = "C24FBDDE-9936-4C66-9D6A-228E0612D174";
const STREAK_ACTION = "5044A100-0004-4000-8000-000000000004";
const FACTOR = "MJ_BizApps_Sonar: Factors";
const MODEL_FACTOR = "MJ_BizApps_Sonar: Model Factors";

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
    const factorId = await ensureStreakFactor(md, user);
    await ensureBound(md, user, factorId);

    console.log("computing scores (no persist)…");
    const t0 = Date.now();
    const scores = await new RecomputeOrchestrator().computeScores(CHEESE_MODEL, new Date(), user);
    console.log(`scored ${scores.size} members in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

    report(scores, factorId);
    await pool.close();
}

/** Create the ActionBacked streak factor on the cheese model, or reuse it if already there. */
async function ensureStreakFactor(md, user) {
    const rv = new RunView();
    const existing = await rv.RunView({
        EntityName: FACTOR,
        ExtraFilter: `ScoreModelID='${CHEESE_MODEL}' AND ActionID='${STREAK_ACTION}'`,
        ResultType: "entity_object",
    }, user);
    if (existing.Success && existing.Results.length) {
        console.log(`reusing factor ${existing.Results[0].ID}`);
        return existing.Results[0].ID;
    }
    const f = await md.GetEntityObject(FACTOR, user);
    f.NewRecord();
    f.Name = "Event Attendance Streak";
    f.Slug = "event-attendance-streak";
    f.FactorType = "ActionBacked";
    f.AnchorEntityID = ANCHOR;
    f.ScoreModelID = CHEESE_MODEL;
    f.ActionID = STREAK_ACTION;
    f.PromotionState = "Approved"; // else the recompute gate blocks it
    f.NormalizationMethod = "MinMax";
    f.HigherIsBetter = true;
    f.OutputMin = 0;
    f.OutputMax = 1;
    if (!(await f.Save())) {
        throw new Error(`factor save failed: ${f.LatestResult?.CompleteMessage}`);
    }
    console.log(`created factor ${f.ID}`);
    return f.ID;
}

async function ensureBound(md, user, factorId) {
    const rv = new RunView();
    const existing = await rv.RunView({
        EntityName: MODEL_FACTOR,
        ExtraFilter: `ScoreModelID='${CHEESE_MODEL}' AND FactorID='${factorId}'`,
        ResultType: "entity_object",
    }, user);
    if (existing.Success && existing.Results.length) {
        console.log("already bound to model");
        return;
    }
    const mf = await md.GetEntityObject(MODEL_FACTOR, user);
    mf.NewRecord();
    mf.ScoreModelID = CHEESE_MODEL;
    mf.FactorID = factorId;
    mf.Weight = 0.5;
    mf.WeightMode = "Additive";
    if (!(await mf.Save())) {
        throw new Error(`model-factor save failed: ${mf.LatestResult?.CompleteMessage}`);
    }
    console.log("bound to model");
}

/** Print the streak factor's contribution for the top members + a distribution. */
function report(scores, factorId) {
    const rows = [];
    for (const [anchorId, sr] of scores) {
        const c = sr.contributions.find((x) => x.factorId === factorId);
        if (c && c.rawValue !== null) rows.push({ anchorId, streak: c.rawValue, norm: c.normalizedContribution });
    }
    rows.sort((a, b) => b.streak - a.streak);
    console.log(`\nmembers with a streak value: ${rows.length}`);
    const dist = {};
    for (const r of rows) dist[r.streak] = (dist[r.streak] ?? 0) + 1;
    console.log("streak distribution (streak: #members):", JSON.stringify(dist));
    console.log("\ntop 10 by streak:");
    for (const r of rows.slice(0, 10)) {
        console.log(`  ${r.anchorId}  streak=${r.streak}  normalized=${r.norm?.toFixed(3)}`);
    }
}

main().catch((e) => { console.error("LIVE TEST FAILED:", e?.message ?? e); process.exit(1); });
