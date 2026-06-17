// Authors a demo ScoreModel in Sonar_Demo (anchor = membership Members) with 4 single-hop
// factors, banded by the seeded "Default Health Bands". Idempotent (clears its own rows first).
// Creds from env: set -a && . ./.env && set +a && node demo/author-demo-model.cjs
const path = require("path");
const sql = require(path.join(__dirname, "..", "node_modules", "mssql"));

const S = "__mj_BizAppsSonar";
const MODEL = "D3300000-0000-4000-8000-000000000001";
const BANDSET = "7E3B9C42-0A1D-4E58-9B6F-2C4D8A1F0B30"; // seeded "Default Health Bands"
// source entity name -> { mre, factor, modelFactor, agg, field, weight, factorName, slug }
const SOURCES = [
  { ent: "Event Registrations", mre: "...0010", factor: "...0020", mf: "...0030", agg: "Count", field: null,     weight: 0.30, name: "Events Attended",       slug: "demo-events-attended" },
  { ent: "Email Engagements",   mre: "...0011", factor: "...0021", mf: "...0031", agg: "Count", field: null,     weight: 0.25, name: "Newsletter Engagement", slug: "demo-newsletter-engagement" },
  { ent: "Certifications",      mre: "...0012", factor: "...0022", mf: "...0032", agg: "Count", field: null,     weight: 0.25, name: "Continuing Education",  slug: "demo-continuing-education" },
  { ent: "Payments",            mre: "...0013", factor: "...0023", mf: "...0033", agg: "Sum",   field: "Amount", weight: 0.20, name: "Giving",              slug: "demo-giving" },
].map((s) => ({ ...s, mre: s.mre.replace("...", "D3300000-0000-4000-8000-0000000"), factor: s.factor.replace("...", "D3300000-0000-4000-8000-0000000"), mf: s.mf.replace("...", "D3300000-0000-4000-8000-0000000") }));

const cfg = {
  user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST || "localhost", port: parseInt(process.env.DB_PORT || "1433", 10),
  database: process.env.DEMO_DB || "Sonar_Demo",
  options: { trustServerCertificate: true, encrypt: false },
};

(async () => {
  await sql.connect(cfg);
  const ents = await sql.query(`SELECT ID, Name FROM __mj.Entity WHERE SchemaName='membership'`);
  const idByName = new Map(ents.recordset.map((e) => [e.Name, e.ID]));
  const anchor = idByName.get("Members");
  if (!anchor) throw new Error("Members entity not registered in Sonar_Demo — run mj:codegen:demo first.");

  // Clean prior demo rows (child -> parent).
  await sql.query(`DELETE FROM ${S}.ModelFactor WHERE ScoreModelID='${MODEL}'`);
  await sql.query(`DELETE FROM ${S}.Factor WHERE ScoreModelID='${MODEL}'`);
  await sql.query(`DELETE FROM ${S}.ModelRelatedEntity WHERE ScoreModelID='${MODEL}'`);
  await sql.query(`DELETE FROM ${S}.ScoreModel WHERE ID='${MODEL}'`);

  await sql.query(`INSERT INTO ${S}.ScoreModel (ID, Name, Slug, AnchorEntityID, Status, ScoreScaleMin, ScoreScaleMax, CombineStrategy, BandSetID)
    VALUES ('${MODEL}', 'Demo Member Engagement', 'demo-member-engagement', '${anchor}', 'Active', 0, 100, 'WeightedSum', '${BANDSET}')`);

  for (const s of SOURCES) {
    const relEnt = idByName.get(s.ent);
    if (!relEnt) throw new Error(`source entity '${s.ent}' not registered`);
    await sql.query(`INSERT INTO ${S}.ModelRelatedEntity (ID, ScoreModelID, RelatedEntityID, Alias, RelationshipPath, JoinType)
      VALUES ('${s.mre}', '${MODEL}', '${relEnt}', '${s.ent.toLowerCase().replace(/[^a-z0-9]+/g, "_")}', '[]', 'Left')`);
    const fieldCol = s.field ? `'${s.field}'` : "NULL";
    await sql.query(`INSERT INTO ${S}.Factor (ID, Name, Slug, AnchorEntityID, ScoreModelID, FactorType, SourceRelatedEntityID, Aggregation, AggregateFieldName, NormalizationMethod, HigherIsBetter)
      VALUES ('${s.factor}', '${s.name}', '${s.slug}', '${anchor}', '${MODEL}', 'Declarative', '${s.mre}', '${s.agg}', ${fieldCol}, 'MinMax', 1)`);
    await sql.query(`INSERT INTO ${S}.ModelFactor (ID, ScoreModelID, FactorID, Weight, WeightMode)
      VALUES ('${s.mf}', '${MODEL}', '${s.factor}', ${s.weight}, 'Additive')`);
  }

  console.log(`authored model ${MODEL} (Demo Member Engagement) with ${SOURCES.length} factors, anchor=Members`);
  await sql.close();
})().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });
