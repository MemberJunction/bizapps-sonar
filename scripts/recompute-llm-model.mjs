/**
 * Recompute (persist) a membership model so ScoreFactorContribution.DetailJSON is populated with
 * each factor's reason — which is what the triage "Why this score" panel reads. Real Gemini calls
 * for the sentiment factor (cached after the first run).
 * Run:  set -a && . ./.env && set +a && node scripts/recompute-llm-model.mjs
 */
import { bootstrap } from "./lib/bootstrap.mjs";
import { AIEngine } from "@memberjunction/aiengine";
import { RecomputeOrchestrator } from "@mj-biz-apps/sonar-engine";
import "@memberjunction/core-entities";
import "@mj-biz-apps/sonar-entities";
import "@mj-biz-apps/sonar-actions";
import "@memberjunction/core-actions";
import "@memberjunction/ai-gemini";

const MODEL_ID = "A2708489-D1B1-45FA-BB27-F61C058C40CE"; // Context Test Model (has the Approved sentiment factor)

async function main() {
    const { pool, user } = await bootstrap();
    await AIEngine.Instance.Config(false, user);

    console.log("Recomputing (persisting) — this writes DetailJSON reasons…");
    const res = await new RecomputeOrchestrator().recompute(MODEL_ID, new Date(), user);
    console.log(`run ${res.status}: ${res.recordsScored} records scored (runId ${res.runId})`);

    // Confirm DetailJSON landed.
    const chk = await pool.request().query(`
        SELECT SUM(CASE WHEN c.DetailJSON IS NOT NULL THEN 1 ELSE 0 END) withDetail, COUNT(*) total
        FROM __mj_BizAppsSonar.ScoreFactorContribution c
        JOIN __mj_BizAppsSonar.Score s ON s.ID=c.ScoreID
        WHERE s.ScoreModelID='${MODEL_ID}'`);
    console.log(`contributions with DetailJSON: ${chk.recordset[0].withDetail}/${chk.recordset[0].total}`);
    await pool.close();
}

main().catch((e) => { console.error("RECOMPUTE FAILED:", e.message); process.exit(1); });
