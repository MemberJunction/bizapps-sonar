/**
 * Rebuild the demo database's INTERVENTION LIFT story, end to end, in one command.
 *
 * Sonar's whole argument is "we measured it, we didn't assume it": treatment cohort versus a
 * randomised holdout. That argument was unfalsifiable in the demo data, because after the play fired
 * NOTHING about the members changed, so every outcome came back `NoChange` and lift computed as 0.0.
 * A viewer could not tell a working measurement pipeline from a broken one.
 *
 * This script gives the measurement something real to find, then runs it:
 *
 *   1. SEED     post-outreach purchases for part of each cohort (more of treatment than of control)
 *   2. CONFIG   set the model's outcome definition to a bar those purchases can actually clear
 *   3. RESET    drop the stale flat snapshots and the zero-delta outcome rows
 *   4. RECOMPUTE so Score/ScoreHistory reflect the new activity
 *   5. MEASURE  and print the lift the engine derives
 *
 * ## Why lift comes out non-zero, and why that is not rigged
 *
 * Each member gets a stable propensity `h` in 0..99 from a hash of their own id. The SAME ranking is
 * used in both arms; the intervention only moves the CUT-OFF:
 *
 *      treatment   h < 35 strong · h < 60 light · else nothing
 *      control     h < 10 strong · h < 20 light · else nothing
 *
 * So members with a very low `h` convert in BOTH arms (they were going to renew anyway; this is the
 * control group's baseline, and it is deliberately not zero), while members in the middle convert only
 * when contacted. That middle band IS the causal effect, and it is exactly what treatment-minus-control
 * is supposed to recover. If lift came back near zero, the measurement would be wrong.
 *
 * Two things keep it honest:
 *
 *   · The seeded counts never exceed the population's existing maximum (9 payments). Both scoring
 *     factors are MinMax-normalised against population min/max, so pushing anyone past the top of the
 *     scale would RESTRETCH it and drag every uninvolved member's score down: control would "decline"
 *     for a reason that has nothing to do with the intervention, and lift would be an artifact of the
 *     normaliser. Capped, control stays exactly flat and the difference is attributable.
 *   · Nothing writes to Score, ScoreHistory or InterventionOutcome by hand. Only domain purchases are
 *     seeded; the scoring engine and the OutcomeMeasurer produce every Sonar number from there.
 *
 * ## What a "response" is, concretely
 *
 * These 100 members are one-payment members: they joined, paid once, and went quiet. So the realistic
 * post-nudge behaviour is buying something. A `strong` responder makes three purchases over the five
 * days after the play fired (renewal, conference registration, publication); a `light` responder just
 * renews. Both are ordinary Invoice + Payment rows in `AssociationDemo`, indistinguishable in shape
 * from the 6,683 already there.
 *
 * ## Reversible
 *
 * Every seeded row is tagged (`INV-SONARDEMO-…` / `TXN-SONARDEMO-…`), so one predicate removes the lot.
 * See `--revert`. Re-running with `--apply` clears the previous seeding first, so it is idempotent
 * rather than cumulative.
 *
 * ## Two outcome definitions, and why both are worth having
 *
 * `--outcome=score` (the default) defines success as the member's Sonar score reaching a bar. It is the
 * simpler demo, but it is also a **thermometer**: Sonar grading its own homework.
 *
 * `--outcome=activity` defines success as a condition on the member's OWN domain record
 * (`Member.LastActivityDate` on or after the day the play fired). That is the honest business outcome,
 * decoupled from the score entirely, and it exercises the `AnchorField` definition. Prefer it when the
 * question is "did this actually work" rather than "did the number move".
 *
 * Usage:
 *   node demo-data/rebuild-lift-story.mjs                      # dry run: report the plan, touch nothing
 *   node demo-data/rebuild-lift-story.mjs --apply              # seed, recompute, measure (score bar)
 *   node demo-data/rebuild-lift-story.mjs --apply --outcome=activity   # ...against the domain outcome
 *   node demo-data/rebuild-lift-story.mjs --revert             # undo the seeding (leaves scores stale)
 */
import "dotenv/config";
import sqlPkg from "mssql";
import { randomUUID } from "node:crypto";
import { setupSQLServerClient, SQLServerProviderConfigData, UserCache } from "@memberjunction/sqlserver-dataprovider";
import "@mj-biz-apps/sonar-entities";
import "@mj-biz-apps/sonar-core-entities-server";
import { RecomputeOrchestrator, OutcomeMeasurer } from "@mj-biz-apps/sonar-engine";

// The demo's Engagement model and the intervention whose cohorts we are telling the story about.
const MODEL_ID = "0D4A1014-FCCC-4832-9F47-87E6445F75FE";
const INTERVENTION_ID = "E1F34547-3355-43FC-AF38-1DBFE8448E2D";

/** Success bar for the model's outcome definition. A `strong` responder lands ~22 and clears it; a
 *  `light` responder lands ~7 and does not. Band recovery (At Risk ends at 40) is deliberately NOT the
 *  bar here: nobody climbs 40 points in five days, and pretending otherwise would need fabricated
 *  purchase volumes. So `bandUpLiftPct` staying 0 is the truthful reading, not a defect. */
const SUCCESS_SCORE = 20;

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const OUTCOME = (process.argv.find((a) => a.startsWith("--outcome=")) ?? "--outcome=score").slice(10);
if (!["score", "activity"].includes(OUTCOME)) {
    throw new Error(`--outcome must be 'score' or 'activity', got '${OUTCOME}'.`);
}

const MARK = "SONARDEMO";
const TAG_INVOICE = `INV-${MARK}-`;
const TAG_TXN = `TXN-${MARK}-`;

/** The purchases a responder makes, in the days after the play fired. */
const PURCHASES = [
    { day: 1, amount: 588.6, method: "Credit Card", label: "Membership renewal" },
    { day: 3, amount: 425.0, method: "Stripe", label: "Annual conference registration" },
    { day: 5, amount: 95.0, method: "PayPal", label: "Publication order" },
];

const sql = sqlPkg.default ?? sqlPkg;

/** FNV-1a → 0..99. Same stable-hash trick the holdout split uses, so it is reproducible run to run. */
function hash100(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0) % 100;
}

/**
 * How many purchases this member makes.
 *
 * SALTED with its own prefix and it matters: the cohort split hashes the BARE anchor id, and the
 * planted score trajectories hash `archetype:<id>`. Reusing either would correlate response with
 * cohort (or with trajectory shape) and the "lift" would be measuring the hash, not the intervention.
 */
function tierFor(anchorId, cohort) {
    const h = hash100(`response:${anchorId}`);
    const strongCut = cohort === "Treatment" ? 35 : 10;
    const lightCut = cohort === "Treatment" ? 60 : 20;
    if (h < strongCut) return "strong";
    if (h < lightCut) return "light";
    return "none";
}

const purchaseCount = (tier) => (tier === "strong" ? 3 : tier === "light" ? 1 : 0);

function makePool() {
    return new sql.ConnectionPool({
        server: process.env.DB_HOST,
        port: +(process.env.DB_PORT || 1433),
        user: process.env.CODEGEN_DB_USERNAME ?? process.env.DB_USERNAME,
        password: process.env.CODEGEN_DB_PASSWORD ?? process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        options: { encrypt: false, trustServerCertificate: true },
        requestTimeout: 1800000,
        pool: { max: 10, min: 1 },
    });
}

/**
 * The cohort roster, with each member's payment count and their assigned response tier.
 *
 * The count deliberately EXCLUDES anything a previous run seeded, so the projected result below is
 * measured against the real baseline. Counting seeded rows would make the ceiling guard read a re-run's
 * own output as if it were pre-existing activity and refuse a plan that is actually fine.
 */
async function loadPlan(pool) {
    const res = await pool.request().query(`
        SELECT a.AnchorRecordID, a.Cohort, a.AssignedAt,
               (SELECT COUNT(p.ID)
                  FROM AssociationDemo.Invoice i
                  LEFT JOIN AssociationDemo.Payment p ON p.InvoiceID = i.ID
                 WHERE CAST(i.MemberID AS NVARCHAR(50)) = a.AnchorRecordID
                   AND i.InvoiceNumber NOT LIKE '${TAG_INVOICE}%') AS Payments
        FROM __mj_BizAppsSonar.InterventionAssignment a
        WHERE a.InterventionID = '${INTERVENTION_ID}'
        ORDER BY a.Cohort, a.AnchorRecordID`);
    return res.recordset.map((r) => ({ ...r, tier: tierFor(r.AnchorRecordID, r.Cohort) }));
}

/** The population ceiling both factors normalise against. Seeding must not raise it.
 *  Seeded rows are excluded for the same reason as in loadPlan, and one more: reading the ceiling off a
 *  previous run's output would ratchet it upward, so each run would permit a little more than the last. */
async function populationMaxPayments(pool) {
    const res = await pool.request().query(`
        SELECT MAX(Payments) AS MaxPayments FROM (
            SELECT i.MemberID, COUNT(p.ID) AS Payments
            FROM AssociationDemo.Invoice i
            LEFT JOIN AssociationDemo.Payment p ON p.InvoiceID = i.ID
            WHERE i.InvoiceNumber NOT LIKE '${TAG_INVOICE}%'
            GROUP BY i.MemberID) z`);
    return res.recordset[0].MaxPayments;
}

function report(plan, popMax) {
    const byCohort = new Map();
    for (const row of plan) {
        const acc = byCohort.get(row.Cohort) ?? { n: 0, strong: 0, light: 0, none: 0, adds: 0, worst: 0 };
        acc.n++;
        acc[row.tier]++;
        acc.adds += purchaseCount(row.tier);
        acc.worst = Math.max(acc.worst, row.Payments + purchaseCount(row.tier));
        byCohort.set(row.Cohort, acc);
    }
    console.log(`\npopulation max payments : ${popMax}  (the MinMax ceiling; seeding must stay at or below it)`);
    for (const [cohort, a] of [...byCohort].sort()) {
        const pct = (k) => `${((a[k] / a.n) * 100).toFixed(0)}%`;
        console.log(
            `${cohort.padEnd(9)} n=${String(a.n).padStart(3)}  ` +
                `strong ${String(a.strong).padStart(2)} (${pct("strong")})  ` +
                `light ${String(a.light).padStart(2)} (${pct("light")})  ` +
                `none ${String(a.none).padStart(2)} (${pct("none")})  ` +
                `→ ${a.adds} purchases, highest resulting count ${a.worst}`,
        );
    }
    const over = plan.filter((r) => r.Payments + purchaseCount(r.tier) > popMax);
    if (over.length) {
        throw new Error(
            `${over.length} member(s) would exceed the population maximum of ${popMax} payments. That would ` +
                `restretch the MinMax scale and depress every uninvolved member's score, making the measured ` +
                `lift an artifact of the normaliser. Lower the purchase counts.`,
        );
    }
}

/**
 * Remove any previous seeding, so --apply is idempotent rather than cumulative.
 *
 * The LastActivityDate reset is deliberately narrow: only members on THIS intervention's roster, and only
 * where the value falls inside the window we seeded. Today every one of the 2,000 demo members has a NULL
 * there, so a blanket `SET NULL` would be equivalent. But the column is on the fix-me list, and the day
 * somebody populates it properly a blanket reset would quietly destroy their work.
 */
async function clearSeeded(pool) {
    const res = await pool.request().query(`
        DELETE FROM AssociationDemo.Payment WHERE TransactionID LIKE '${TAG_TXN}%';
        DELETE FROM AssociationDemo.Invoice WHERE InvoiceNumber LIKE '${TAG_INVOICE}%';
        SELECT @@ROWCOUNT AS Removed;

        UPDATE m SET m.LastActivityDate = NULL
        FROM AssociationDemo.Member m
        JOIN __mj_BizAppsSonar.InterventionAssignment a
          ON CAST(m.ID AS NVARCHAR(50)) = a.AnchorRecordID
         AND a.InterventionID = '${INTERVENTION_ID}'
        WHERE m.LastActivityDate >= a.AssignedAt`);
    return res.recordsets?.[0]?.[0]?.Removed ?? 0;
}

/** One Invoice + one Payment per purchase. Ordinary domain rows; only the tag marks them as seeded. */
async function seedPurchases(pool, plan) {
    const invoices = [];
    const payments = [];
    for (const row of plan) {
        const n = purchaseCount(row.tier);
        const assignedAt = new Date(row.AssignedAt);
        for (let i = 0; i < n; i++) {
            const p = PURCHASES[i];
            const when = new Date(assignedAt.getTime() + p.day * 86400000);
            const date = when.toISOString().slice(0, 10);
            const invoiceId = randomUUID();
            const seq = `${invoices.length + 1}`.padStart(5, "0");
            invoices.push(
                `('${invoiceId}','${TAG_INVOICE}${seq}',CAST('${row.AnchorRecordID}' AS UNIQUEIDENTIFIER),` +
                    `'${date}','${date}',${p.amount},0,0,${p.amount},${p.amount},0,'Paid',` +
                    `'${p.label} · seeded post-intervention activity for the Sonar lift demo.')`,
            );
            payments.push(
                `('${randomUUID()}','${invoiceId}','${date}',${p.amount},'${p.method}',` +
                    `'${TAG_TXN}${seq}','Completed','${date}',` +
                    `'${p.label} · seeded post-intervention activity for the Sonar lift demo.')`,
            );
        }
    }
    if (!invoices.length) return 0;
    // Chunked so a single statement never carries an unbounded VALUES list.
    for (const [table, cols, rows] of [
        [
            "AssociationDemo.Invoice",
            "(ID,InvoiceNumber,MemberID,InvoiceDate,DueDate,SubTotal,Tax,Discount,Total,AmountPaid,Balance,Status,Notes)",
            invoices,
        ],
        [
            "AssociationDemo.Payment",
            "(ID,InvoiceID,PaymentDate,Amount,PaymentMethod,TransactionID,Status,ProcessedDate,Notes)",
            payments,
        ],
    ]) {
        for (let i = 0; i < rows.length; i += 200) {
            const chunk = rows.slice(i, i + 200).join(",\n");
            await pool.request().query(`INSERT INTO ${table} ${cols} VALUES ${chunk}`);
        }
    }
    return payments.length;
}

/**
 * Stamp `Member.LastActivityDate` with each responder's LAST purchase, so the domain outcome has
 * something to read. Non-responders stay NULL, which is the whole point: `compareOp` treats a missing
 * value as unanswerable and returns false for every operator, so "we know nothing about this member"
 * cannot be counted as a win.
 */
async function seedActivityDates(pool, plan) {
    const rows = plan
        .filter((r) => purchaseCount(r.tier) > 0)
        .map((r) => {
            const lastDay = PURCHASES[purchaseCount(r.tier) - 1].day;
            const when = new Date(new Date(r.AssignedAt).getTime() + lastDay * 86400000);
            return `('${r.AnchorRecordID}','${when.toISOString().slice(0, 10)}')`;
        });
    if (!rows.length) return 0;
    for (let i = 0; i < rows.length; i += 200) {
        await pool.request().query(`
            UPDATE m SET m.LastActivityDate = v.d
            FROM AssociationDemo.Member m
            JOIN (VALUES ${rows.slice(i, i + 200).join(",")}) AS v(id, d)
              ON m.ID = CAST(v.id AS UNIQUEIDENTIFIER)`);
    }
    return rows.length;
}

/** The success definition this run installs. See the header for why both exist. */
function outcomeDefinitionJson(plan) {
    if (OUTCOME === "score") return `{"type":"ReachScore","minScore":${SUCCESS_SCORE}}`;
    // The bar is the day AFTER the play fired, so "was active at some point since we contacted them".
    const earliest = plan.reduce((min, r) => Math.min(min, new Date(r.AssignedAt).getTime()), Infinity);
    const bar = new Date(earliest + 86400000).toISOString().slice(0, 10);
    return `{"type":"AnchorField","field":"LastActivityDate","op":">=","value":"${bar}"}`;
}

/**
 * Set the org's success definition, and clear the two things that would otherwise mask the new signal:
 *  · ScoreHistory rows that would stack on a single day. Two kinds: duplicates left by earlier probe
 *    recomputes, and the snapshot a previous run of THIS script wrote for the same as-of date. Both are
 *    byte-identical repeats, so they add flat steps to every member's trajectory, which is precisely
 *    what made "declining for 3+ cycles" match nobody. Clearing the target date as well as existing
 *    duplicates is what makes re-running this script land on the same state instead of accumulating.
 *  · the existing zero-delta outcome rows. The measurer skips assignments it has already measured, so
 *    stale rows would survive and keep reporting the old 0.0.
 *
 * @param asOfDay the date the recompute is about to stamp, as YYYY-MM-DD.
 * @param definitionJson the success definition to install on the model.
 */
async function resetDerived(pool, asOfDay, definitionJson) {
    const res = await pool.request().query(`
        UPDATE __mj_BizAppsSonar.ScoreModel
           SET OutcomeDefinitionJSON = '${definitionJson}'
         WHERE ID = '${MODEL_ID}';

        DECLARE @clearDays TABLE (AsOfDay DATE);
        INSERT INTO @clearDays
        SELECT CAST(AsOfDate AS DATE) FROM __mj_BizAppsSonar.ScoreHistory
        WHERE ScoreModelID = '${MODEL_ID}'
        GROUP BY CAST(AsOfDate AS DATE), AnchorRecordID
        HAVING COUNT(*) > 1;
        INSERT INTO @clearDays
        SELECT CAST('${asOfDay}' AS DATE)
        WHERE NOT EXISTS (SELECT 1 FROM @clearDays WHERE AsOfDay = CAST('${asOfDay}' AS DATE));

        DELETE h FROM __mj_BizAppsSonar.ScoreHistory h
        WHERE h.ScoreModelID = '${MODEL_ID}'
          AND CAST(h.AsOfDate AS DATE) IN (SELECT AsOfDay FROM @clearDays);
        SELECT @@ROWCOUNT AS HistoryRemoved;

        DELETE o FROM __mj_BizAppsSonar.InterventionOutcome o
        JOIN __mj_BizAppsSonar.InterventionAssignment a ON a.ID = o.AssignmentID
        WHERE a.InterventionID = '${INTERVENTION_ID}';
        SELECT @@ROWCOUNT AS OutcomesRemoved`);
    return {
        historyRemoved: res.recordsets[0]?.[0]?.HistoryRemoved ?? 0,
        outcomesRemoved: res.recordsets[1]?.[0]?.OutcomesRemoved ?? 0,
    };
}

function printLift(r) {
    const pp = (v) => (v == null ? "n/a" : `${v >= 0 ? "+" : ""}${v.toFixed(1)}pp`);
    const num = (v) => (v == null ? "n/a" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}`);
    const rate = (v) => (v == null ? "n/a" : `${(v * 100).toFixed(1)}%`);
    const l = r.lift;
    console.log(`\nmeasured ${r.measured} · already ${r.alreadyMeasured} · unmeasurable ${r.unmeasurable} · write failures ${r.writeFailures}`);
    console.log(`outcome definition : ${l.outcomeLabel}`);
    console.log(`cohorts            : ${l.treatedMeasured} treated · ${l.controlMeasured} control`);
    console.log(`success rate       : ${rate(l.successRateTreatment)} treated vs ${rate(l.successRateControl)} control   → lift ${pp(l.successLiftPct)}`);
    console.log(`mean score delta   : ${num(l.avgScoreDeltaTreatment)} treated vs ${num(l.avgScoreDeltaControl)} control   → lift ${num(l.scoreLift)}`);
    console.log(`band-up rate       : ${rate(l.bandUpRateTreatment)} treated vs ${rate(l.bandUpRateControl)} control   → lift ${pp(l.bandUpLiftPct)}`);
    if (r.writeFailures > 0) {
        console.log(`\nWARNING: ${r.writeFailures} outcome row(s) failed to persist, so the lift above is incomplete.`);
    }
}

// ------------------------------------------------------------------------------------------- run

const pool = makePool();
await pool.connect();
console.log(`database : ${process.env.DB_DATABASE}`);

if (REVERT) {
    const removed = await clearSeeded(pool);
    console.log(`removed ${removed} seeded invoice(s) and their payments.`);
    console.log(`Scores are now STALE. Re-run a recompute, or re-run this script with --apply.`);
    await pool.close();
    process.exit(0);
}

const popMax = await populationMaxPayments(pool);
const plan = await loadPlan(pool);
if (!plan.length) throw new Error(`No assignments for intervention ${INTERVENTION_ID}.`);
report(plan, popMax);

if (!APPLY) {
    console.log(`\nDRY RUN · nothing written. Re-run with --apply to seed, recompute and measure.`);
    await pool.close();
    process.exit(0);
}

const cleared = await clearSeeded(pool);
if (cleared) console.log(`\ncleared ${cleared} row(s) from a previous seeding.`);
const seeded = await seedPurchases(pool, plan);
const stamped = await seedActivityDates(pool, plan);
console.log(`seeded ${seeded} purchase(s) as Invoice + Payment pairs; stamped LastActivityDate on ${stamped} responder(s).`);

// One instant, reused: the date resetDerived clears MUST be the date the recompute then stamps, or a
// re-run would clear one day and write another.
const asOf = new Date();
const definitionJson = outcomeDefinitionJson(plan);
const reset = await resetDerived(pool, asOf.toISOString().slice(0, 10), definitionJson);
console.log(
    `outcome definition set to ${definitionJson}; ` +
        `removed ${reset.historyRemoved} stacked history row(s) and ${reset.outcomesRemoved} stale outcome row(s).`,
);

// Everything Sonar reports from here is derived by the engine, not written by this script.
await setupSQLServerClient(new SQLServerProviderConfigData(pool, "__mj"));
const user = UserCache.Instance.GetSystemUser();

console.log(`\nrecomputing…`);
const run = await new RecomputeOrchestrator().recompute(MODEL_ID, asOf, user);
console.log(`recompute: ${run.recordsScored ?? "?"} member(s) scored, status ${run.status ?? "?"}`);

console.log(`measuring…`);
printLift(await new OutcomeMeasurer().measure(INTERVENTION_ID, user));

await pool.close();
process.exit(0);
