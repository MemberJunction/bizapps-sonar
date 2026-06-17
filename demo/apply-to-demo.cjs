// Applies one or more .sql files (GO-batched) to the sandbox database.
// Creds come from the environment (source the root .env first); target DB defaults to Sonar_Demo.
// Usage (via npm): npm run demo:db:load   — or directly:
//   set -a && . ./.env && set +a && node demo/apply-to-demo.cjs demo/membership-schema.sql [more.sql...]
const fs = require("fs");
const path = require("path");
const sql = require(path.join(__dirname, "..", "node_modules", "mssql"));

const files = process.argv.slice(2);
if (files.length === 0) { console.error("usage: node demo/apply-to-demo.cjs <file.sql> [file2.sql ...]"); process.exit(1); }

const cfg = {
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "1433", 10),
  // Always the sandbox — NOT process.env.DB_DATABASE (that's Sonar_Dev in the root .env).
  database: process.env.DEMO_DB || "Sonar_Demo",
  options: { trustServerCertificate: true, encrypt: false },
  requestTimeout: 120000,
};
if (!cfg.user || !cfg.password) { console.error("DB_USERNAME / DB_PASSWORD not set — source the root .env first."); process.exit(1); }

(async () => {
  await sql.connect(cfg);
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    const batches = text.split(/^\s*GO\s*$/im).map((b) => b.trim()).filter((b) => b.length > 0);
    let i = 0;
    for (const batch of batches) {
      i++;
      try { await new sql.Request().batch(batch); }
      catch (e) { console.error(`${path.basename(file)} batch ${i} FAILED: ${e.message.split("\n")[0]}`); process.exit(1); }
    }
    console.log(`applied ${i} batch(es) from ${path.basename(file)} to ${cfg.database}`);
  }
  await sql.close();
})().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });
