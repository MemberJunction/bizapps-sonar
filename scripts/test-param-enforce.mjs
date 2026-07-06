/**
 * Proves the SonarFactorAction base now ENFORCES the param contract at run time (not just in the
 * builder). Temporarily sets an INVALID config on the sentiment factor (fields provided, but no
 * source) via SQL, runs computeScores, and confirms the factor is rejected → contributes no data for
 * everyone (instead of silently scoring on a default source). Then restores the original config and
 * confirms the un-parameterized fallback still works.
 * Run: set -a && . ./.env && set +a && node scripts/test-param-enforce.mjs
 */
import { bootstrap } from "./lib/bootstrap.mjs";
import { AIEngine } from "@memberjunction/aiengine";
import { RecomputeOrchestrator } from "@mj-biz-apps/sonar-engine";
import "@memberjunction/core-entities";
import "@mj-biz-apps/sonar-entities";
import "@mj-biz-apps/sonar-actions";
import "@memberjunction/core-actions";
import "@memberjunction/ai-gemini";

const MODEL_ID = "A2708489-D1B1-45FA-BB27-F61C058C40CE";
const S = "__mj_BizAppsSonar";
// "configured" (fields present) but missing the required source → must be rejected by validateParams.
const INVALID = JSON.stringify({ params: { fields: '["Review"]' } });

function sentimentRows(scores, factorId) {
    let present = 0;
    for (const [, r] of scores) if ((r.contributions ?? []).some((c) => c.factorId === factorId && c.hadData)) present++;
    return present;
}

async function main() {
    const { pool, user } = await bootstrap();
    await AIEngine.Instance.Config(false, user);
    const fr = await pool.request().query(`SELECT TOP 1 f.ID, f.ActionParamsJSON FROM ${S}.Factor f JOIN ${S}.ModelFactor mf ON mf.FactorID=f.ID WHERE mf.ScoreModelID='${MODEL_ID}' AND f.FactorType='ActionBacked'`);
    const factor = fr.recordset[0];
    const original = factor.ActionParamsJSON;
    console.log(`sentiment factor ${factor.ID}; original ActionParamsJSON: ${original ?? "NULL"}\n`);

    try {
        // 1. INVALID config → expect the whole run to FAIL LOUD (ActionConfigError), not degrade to no-data.
        await pool.request().input("j", INVALID).query(`UPDATE ${S}.Factor SET ActionParamsJSON=@j WHERE ID='${factor.ID}'`);
        let threw = false, msg = "";
        try {
            await new RecomputeOrchestrator().computeScores(MODEL_ID, new Date(), user);
        } catch (e) {
            threw = true;
            msg = e instanceof Error ? e.message : String(e);
        }
        console.log(`INVALID config (fields, no source): run ${threw ? "FAILED LOUD" : "did NOT fail"} — ${msg.slice(0, 90)}`);
        console.log(threw && /required|source/i.test(msg) ? "  ✓ ENFORCED — loud, run-stopping config error." : "  ✗ NOT enforced.");
    } finally {
        // 2. Restore original → fallback path → should work again.
        await pool.request().input("j", original).query(`UPDATE ${S}.Factor SET ActionParamsJSON=${original == null ? "NULL" : "@j"} WHERE ID='${factor.ID}'`);
    }
    const ok = await new RecomputeOrchestrator().computeScores(MODEL_ID, new Date(), user);
    console.log(`\nrestored (unconfigured → fallback): sentiment contributed for ${sentimentRows(ok, factor.ID)}/${ok.size} members`);
    await pool.close();
}
main().catch((e) => { console.error("ENFORCE TEST FAILED:", e.message); process.exit(1); });
