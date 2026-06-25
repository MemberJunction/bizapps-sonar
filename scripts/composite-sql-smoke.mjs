/** SQL smoke test: prove the COMPOSITE factor SQL actually executes in SQL Server (not just the
 *  string-asserted shape), with the real payload — no cross-key conflation, no fan-out. Uses temp
 *  tables in a single batch (ephemeral, no schema pollution). Run: node scripts/composite-sql-smoke.mjs */
import sql from "mssql";
import { buildFactorSql, buildAnchorKeysJson } from "@mj-biz-apps/sonar-engine";

const k = (id, values) => ({ id, json: "", values }); // minimal AnchorKey (buildAnchorKeysJson uses id+values)
const pool = await sql.connect({ user:"sa", password:"Securepassword!23", server:"localhost", port:1433, database:"Sonar_Demo", options:{ trustServerCertificate:true, encrypt:false } });
let failures = 0;
const check = (name, ok, detail) => { console.log(`${ok ? "✓ PASS" : "✗ FAIL"} — ${name}${detail ? " :: " + detail : ""}`); if (!ok) failures++; };

// ───────── Test A: composite ANCHOR (OPENJSON 2-col shred + 2-col key join) ─────────
// Anchor key = (TenantID, MemberID). Same MemberID across tenants MUST NOT conflate.
const specA = {
    factorId: "A", relatedTable: "#act",
    anchorKeyColumns: [{ fkColumn: "TenantID", sqlType: "int" }, { fkColumn: "MemberID", sqlType: "int" }],
    joins: [], window: null, aggregateSql: "COUNT(*)",
};
const popA = buildAnchorKeysJson([k("1|100", [1,100]), k("1|101", [1,101]), k("2|100", [2,100])]);
const batchA = `
CREATE TABLE #act (TenantID int, MemberID int, dt datetime);
INSERT INTO #act VALUES (1,100,'2026-01-01'),(1,100,'2026-02-01'),(1,100,'2026-03-01'),
  (1,101,'2026-01-01'),(2,100,'2026-01-01'),(2,100,'2026-02-01'),(2,101,'2026-01-01');
${buildFactorSql(specA)};`;
const rA = await pool.request().input("anchorKeys", sql.NVarChar(sql.MAX), popA).input("asOf", sql.DateTime, new Date()).query(batchA);
const mapA = Object.fromEntries(rA.recordset.map(r => [r.anchorId, r.rawValue]));
check("composite anchor: (1,100)=3", mapA["1|100"] === 3, `got ${mapA["1|100"]}`);
check("composite anchor: (1,101)=1", mapA["1|101"] === 1, `got ${mapA["1|101"]}`);
check("composite anchor: (2,100)=2 (NOT conflated with (1,100))", mapA["2|100"] === 2, `got ${mapA["2|100"]}`);
check("composite anchor: (2,101) excluded (not in population)", !("2|101" in mapA), `got ${mapA["2|101"]}`);

// ───────── Test B: composite INTERMEDIATE hop (#evt → #enr on 2 cols → anchor) ─────────
// Leaf #evt joins junction #enr on (TenantID,MemberID); junction carries AnchorID. A MemberID-only
// join would fan out a leaf row to BOTH same-member junction rows → inflated counts.
const specB = {
    factorId: "B", relatedTable: "#evt",
    joins: [{ table: "#enr", alias: "h1", on: [
        { leftRef: "#evt.[TenantID]", rightColumn: "TenantID" },
        { leftRef: "#evt.[MemberID]", rightColumn: "MemberID" },
    ] }],
    anchorKeyColumns: [{ fkColumn: "AnchorID", sqlType: "uniqueidentifier" }],
    window: null, aggregateSql: "COUNT(*)",
};
const G1 = "B1000000-0000-4000-8000-00000000000A", G2 = "B1000000-0000-4000-8000-00000000000B";
const popB = buildAnchorKeysJson([k(G1, [G1]), k(G2, [G2])]);
const batchB = `
CREATE TABLE #enr (TenantID int, MemberID int, AnchorID uniqueidentifier);
INSERT INTO #enr VALUES (1,100,'${G1}'),(2,100,'${G2}');
CREATE TABLE #evt (id int, TenantID int, MemberID int);
INSERT INTO #evt VALUES (1,1,100),(2,1,100),(3,1,100),(4,2,100),(5,2,100),(6,1,999);
${buildFactorSql(specB)};`;
const rB = await pool.request().input("anchorKeys", sql.NVarChar(sql.MAX), popB).input("asOf", sql.DateTime, new Date()).query(batchB);
const mapB = Object.fromEntries(rB.recordset.map(r => [r.anchorId, r.rawValue]));
check("composite hop: G1=3 (no fan-out to G2)", mapB[G1] === 3, `got ${mapB[G1]}`);
check("composite hop: G2=2 (no fan-out from same MemberID)", mapB[G2] === 2, `got ${mapB[G2]}`);

await pool.close();
console.log(failures === 0 ? "\n🎉 composite SQL smoke: ALL PASS" : `\n❌ ${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);
