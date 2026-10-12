// Version guards for generated teardown statements (issue #56).
//
// generate_teardown.mjs reads the FK graph from whatever MJ database it is pointed at, which is
// usually newer than the oldest MJ this release supports (the ">=" floor of mj-app.json's
// mjVersionRange). Statements that name a table or column the floor does not have break
// uninstall there. GuardStatement wraps exactly those statements so they run only when
// everything they name exists:
//
//   SQL Server  IF OBJECT_ID(...) IS NOT NULL AND COL_LENGTH(...) IS NOT NULL
//                 EXEC sp_executesql N'...';
//               Dynamic SQL is required: SQL Server resolves column names when it compiles the
//               batch, so a static statement naming a missing column fails even inside a false IF.
//   PostgreSQL  DO $$ BEGIN IF EXISTS (information_schema ...) THEN ... END IF; END $$;
//
// The floor's schema lives in scripts/mj-schema-floor/mj-core-columns.json;
// scripts/check-teardown-version-tolerance.mjs verifies the committed output independently.
const fs = require('fs');
const path = require('path');

const SNAPSHOT_PATH = path.join(__dirname, '..', 'scripts', 'mj-schema-floor', 'mj-core-columns.json');

const DIALECTS = {
  mssql: { open: '[', close: ']' },
  pg: { open: '"', close: '"' },
};

/** Load the floor snapshot: { Version, Tables: Map<table, Set<column>> }. */
function LoadFloor(snapshotPath = SNAPSHOT_PATH) {
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  return {
    Version: snapshot.mjVersion,
    Tables: new Map(Object.entries(snapshot.tables).map(([t, cols]) => [t, new Set(cols)])),
  };
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Tables and (table, column) pairs a statement names that the floor does not have. */
function FindMissing(statement, dialect, floor) {
  const { open, close } = DIALECTS[dialect];
  const ident = `${esc(open)}([A-Za-z0-9_]+)${esc(close)}`;
  const schema = `${esc(open)}\\$\\{mjSchema\\}${esc(close)}`;
  const tables = [];
  const columns = [];
  for (const m of statement.matchAll(new RegExp(`${schema}\\.${ident}`, 'g'))) {
    if (!floor.Tables.has(m[1]) && !tables.includes(m[1])) tables.push(m[1]);
  }
  const stmtRe = new RegExp(`${schema}\\.${ident}\\s+(?:SET\\s+${ident}\\s*=\\s*NULL\\s+)?WHERE\\s+${ident}`, 'g');
  for (const m of statement.matchAll(stmtRe)) {
    const [, table, setColumn, whereColumn] = m;
    for (const column of [setColumn, whereColumn]) {
      if (!column || !floor.Tables.has(table) || floor.Tables.get(table).has(column)) continue;
      if (!columns.some((c) => c.table === table && c.column === column)) columns.push({ table, column });
    }
  }
  return { tables, columns };
}

/**
 * Wrap one statement (`...;` optionally followed by a `-- comment`) in a version guard when it
 * names anything the floor lacks; otherwise return it unchanged.
 */
function GuardStatement(statement, dialect, floor) {
  const { tables, columns } = FindMissing(statement, dialect, floor);
  if (!tables.length && !columns.length) return statement;

  const m = /;([ \t]*--[^\n]*)?\s*$/.exec(statement);
  if (!m) throw new Error(`teardown statement does not end with ';':\n${statement}`);
  const body = statement.slice(0, m.index);
  const trailing = m[1] ?? '';
  const needs = [...tables.map((t) => `table ${t}`), ...columns.map((c) => `column ${c.table}.${c.column}`)];
  const note = `-- NOTE: needs ${needs.join(', ')}, which MJ ${floor.Version} does not have; skipped where missing.`;

  if (dialect === 'mssql') {
    const conds = [
      ...tables.map((t) => `OBJECT_ID('[\${mjSchema}].[${t}]') IS NOT NULL`),
      ...columns.map((c) => `COL_LENGTH('[\${mjSchema}].[${c.table}]', '${c.column}') IS NOT NULL`),
    ];
    return `${note}
-- Dynamic SQL: SQL Server resolves names when it compiles the batch, so a static statement
-- naming a missing column fails even inside a false IF.
IF ${conds.join('\n   AND ')}
  EXEC sp_executesql N'${body.replace(/'/g, "''")}';${trailing}`;
  }

  const conds = [
    ...tables.map((t) => `EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '\${mjSchema}' AND table_name = '${t}')`),
    ...columns.map((c) => `EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = '\${mjSchema}' AND table_name = '${c.table}' AND column_name = '${c.column}')`),
  ];
  const indented = body.split('\n').map((l) => `    ${l}`).join('\n');
  return `${note}
DO $$
BEGIN
  IF ${conds.join('\n     AND ')} THEN
${indented};
  END IF;
END $$;${trailing}`;
}

module.exports = { LoadFloor, FindMissing, GuardStatement, SNAPSHOT_PATH };
