/**
 * End-to-end test of the action-factor OUTPUT CLAMP (plans/factor-param-schema.md §4.2).
 * Proves the FULL path the unit tests don't: FactorCompiler reads Factor.OutputMin/Max → spec →
 * ActionFactorEvaluator clamps the action's raw value + logs per-batch drift.
 *
 * Method: temporarily tighten the sentiment factor's bounds to [0.3, 0.7] via direct SQL (bypasses
 * the publish-lock entity hook), run computeScores, observe every sentiment rawValue land inside
 * [0.3,0.7] + the drift LogStatus line, then RESTORE the original bounds (finally). Read-only re: scores.
 * Run:  set -a && . ./.env && set +a && node scripts/test-clamp.mjs
 */
import { bootstrap } from "./lib/bootstrap.mjs";
import { AIEngine } from "@memberjunction/aiengine";
import { RecomputeOrchestrator } from "@mj-biz-apps/sonar-engine";
import "@memberjunction/core-entities";
import "@mj-biz-apps/sonar-entities";
import "@mj-biz-apps/sonar-actions";
import "@memberjunction/core-actions";
import "@memberjunction/ai-gemini";

const MODEL_ID = "A2708489-D1B1-45FA-BB27-F61C058C40CE"; // Context Test Model (has the sentiment factor)
const S = "__mj_BizAppsSonar";
const TEST_MIN = 0.3, TEST_MAX = 0.7;

async function main() {
    const { pool, user } = await bootstrap();
    await AIEngine.Instance.Config(false, user);

    // Find the ActionBacked (sentiment) factor on the model + capture its current bounds.
    const fr = await pool.request().query(`
        SELECT TOP 1 f.ID, f.Name, f.OutputMin, f.OutputMax
        FROM ${S}.Factor f JOIN ${S}.ModelFactor mf ON mf.FactorID=f.ID
        WHERE mf.ScoreModelID='${MODEL_ID}' AND f.FactorType='ActionBacked'`);
    if (!fr.recordset.length) throw new Error("no ActionBacked factor on the model");
    const factor = fr.recordset[0];
    console.log(`sentiment factor: ${factor.Name} (${factor.ID})`);
    console.log(`original bounds: [${factor.OutputMin}, ${factor.OutputMax}] → testing with [${TEST_MIN}, ${TEST_MAX}]\n`);

    try {
        await pool.request().query(`UPDATE ${S}.Factor SET OutputMin=${TEST_MIN}, OutputMax=${TEST_MAX} WHERE ID='${factor.ID}'`);

        console.log("Running computeScores — watch for the drift LogStatus line:\n");
        const scores = await new RecomputeOrchestrator().computeScores(MODEL_ID, new Date(), user);

        // Pull each member's sentiment contribution rawValue — every one must be within [TEST_MIN, TEST_MAX].
        let outOfRange = 0, n = 0;
        for (const [, res] of scores) {
            const c = (res.contributions ?? []).find((x) => x.factorId === factor.ID);
            if (!c || c.rawValue === null) continue;
            n++;
            if (c.rawValue < TEST_MIN - 1e-9 || c.rawValue > TEST_MAX + 1e-9) outOfRange++;
        }
        const sample = [...scores.values()].map((r) => (r.contributions ?? []).find((x) => x.factorId === factor.ID)?.rawValue).filter((v) => v != null);
        console.log(`\nsentiment rawValues after clamp: ${JSON.stringify(sample)}`);
        console.log(`${n} scored · ${outOfRange} outside [${TEST_MIN}, ${TEST_MAX}]`);
        console.log(outOfRange === 0 ? "✓ CLAMP WORKS — every value is within bounds." : "✗ CLAMP FAILED — values escaped the range.");
    } finally {
        const restore = (v) => (v == null ? "NULL" : v);
        await pool.request().query(`UPDATE ${S}.Factor SET OutputMin=${restore(factor.OutputMin)}, OutputMax=${restore(factor.OutputMax)} WHERE ID='${factor.ID}'`);
        console.log(`\nrestored bounds to [${factor.OutputMin}, ${factor.OutputMax}]`);
        await pool.close();
    }
}
main().catch((e) => { console.error("CLAMP TEST FAILED:", e.message); process.exit(1); });
