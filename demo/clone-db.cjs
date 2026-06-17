// Clones the dev database into the sandbox via BACKUP/RESTORE on the same SQL Server instance.
// Creds come from the environment (source the root .env first). Requires a login with backup/
// restore rights (sysadmin) — the dev `sa`-style login works.
//   set -a && . ./.env && set +a && node demo/clone-db.cjs
const path = require("path");
const sql = require(path.join(__dirname, "..", "node_modules", "mssql"));

const SRC = process.env.DEMO_SOURCE_DB || "Sonar_Dev";
const TGT = process.env.DEMO_DB || "Sonar_Demo";
const DATADIR = process.env.DEMO_DATADIR || "/var/opt/mssql/data";
const BAK = `${DATADIR}/${SRC}_clone.bak`;

const cfg = (db) => ({
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "1433", 10),
  database: db,
  options: { trustServerCertificate: true, encrypt: false },
  requestTimeout: 180000,
});
if (!process.env.DB_USERNAME || !process.env.DB_PASSWORD) { console.error("DB_USERNAME / DB_PASSWORD not set — source the root .env first."); process.exit(1); }

(async () => {
  await sql.connect(cfg("master"));

  const exists = await sql.query(`SELECT name FROM sys.databases WHERE name = '${TGT}'`);
  if (exists.recordset.length) {
    await sql.query(`ALTER DATABASE [${TGT}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [${TGT}];`);
    console.log(`dropped existing ${TGT}`);
  }

  console.log(`backing up ${SRC} (COPY_ONLY)...`);
  await sql.query(`BACKUP DATABASE [${SRC}] TO DISK = N'${BAK}' WITH COPY_ONLY, INIT, FORMAT, COMPRESSION`);

  const files = await sql.query(`RESTORE FILELISTONLY FROM DISK = N'${BAK}'`);
  const moves = files.recordset.map((f) => {
    const ext = f.Type === "L" ? "_log.ldf" : (f.Type === "D" ? ".mdf" : `_${f.LogicalName}.ndf`);
    return `MOVE N'${f.LogicalName}' TO N'${DATADIR}/${TGT}${ext}'`;
  });
  console.log(`restoring as ${TGT}...`);
  await sql.query(`RESTORE DATABASE [${TGT}] FROM DISK = N'${BAK}' WITH ${moves.join(", ")}, REPLACE`);

  await sql.close();
  await sql.connect(cfg(TGT));
  const s = await sql.query("SELECT SchemaName, COUNT(*) c FROM __mj.Entity GROUP BY SchemaName");
  console.log(`${TGT} ready. Entity catalog:`, JSON.stringify(s.recordset));
  await sql.close();
})().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });
