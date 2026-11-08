// One-off: inspect dependents of the stray "Sonar" Application (ID 9A7C…) created
// before we reconciled onto the generated app, then delete it. Safe to delete because
// reconciliation moved our nav onto the generated app (ID 4F94…).
const sql = require('mssql');
const STRAY = '9A7C3E10-4B2D-4F6A-8C1E-5D0FAB12C3D4';

(async () => {
  // Connection settings come from the DB_* env vars (same names mj.config.cjs reads); the
  // password is never hardcoded. Load the repo .env first: set -a && . ./.env && set +a
  if (!process.env.DB_PASSWORD) {
    console.error('DB_PASSWORD is not set. Load the repo .env first (set -a && . ./.env && set +a) or export DB_PASSWORD.');
    process.exit(1);
  }
  await sql.connect({
    user: process.env.DB_USERNAME ?? 'sa',
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '1433', 10),
    database: process.env.DB_DATABASE ?? 'Sonar_Dev',
    options: { trustServerCertificate: true, encrypt: false },
  });

  // Count dependents across the tables that FK to Application.
  const dependentTables = ['ApplicationEntity', 'ApplicationUser', 'ApplicationSetting'];
  for (const t of dependentTables) {
    try {
      const r = await new sql.Request().input('id', sql.UniqueIdentifier, STRAY)
        .query(`SELECT COUNT(*) AS c FROM __mj.${t} WHERE ApplicationID = @id`);
      console.log(`${t}: ${r.recordset[0].c}`);
    } catch (e) {
      console.log(`${t}: (n/a — ${e.message.split('\n')[0]})`);
    }
  }

  const arg = process.argv[2];
  if (arg === '--delete') {
    // UserApplication FKs to Application, and UserApplicationEntity FKs to UserApplication.
    // Clear the grandchild → child → direct dependents → Application row, in that order.
    try {
      await new sql.Request().input('id', sql.UniqueIdentifier, STRAY).query(`
        DELETE uae FROM __mj.UserApplicationEntity uae
        JOIN __mj.UserApplication ua ON ua.ID = uae.UserApplicationID
        WHERE ua.ApplicationID = @id`);
      await new sql.Request().input('id', sql.UniqueIdentifier, STRAY)
        .query(`DELETE FROM __mj.UserApplication WHERE ApplicationID = @id`);
    } catch (e) { console.log(`UserApplication cleanup: ${e.message.split('\n')[0]}`); }

    for (const t of dependentTables) {
      try {
        await new sql.Request().input('id', sql.UniqueIdentifier, STRAY)
          .query(`DELETE FROM __mj.${t} WHERE ApplicationID = @id`);
      } catch (e) { /* table may not exist / not FK — ignore */ }
    }
    const del = await new sql.Request().input('id', sql.UniqueIdentifier, STRAY)
      .query(`DELETE FROM __mj.Application WHERE ID = @id`);
    console.log(`Deleted Application rows: ${del.rowsAffected[0]}`);
  } else {
    console.log('(dry inspect only — pass --delete to remove)');
  }

  await sql.close();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
