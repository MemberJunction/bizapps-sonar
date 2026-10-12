#!/usr/bin/env node
/**
 * Teardown version-tolerance gate (issue #56).
 *
 * The teardown scripts in migrations-teardown/ and migrations-teardown-pg/ are a snapshot of
 * MJ's FK graph: they name MJ core tables and columns directly. mj-app.json declares the oldest
 * MJ this release supports (the `>=` floor of mjVersionRange). Any table or column the scripts
 * name that the floor version does not have breaks uninstall on that version, so it must be
 * guarded:
 *
 *   SQL Server — `IF COL_LENGTH('[...].[Table]', 'Column') IS NOT NULL` (or `IF OBJECT_ID(...)`
 *                for a whole table) followed by `EXEC sp_executesql N'...'`. The statement must
 *                be dynamic: SQL Server resolves column names when it compiles the batch, so a
 *                static statement fails even inside a false IF.
 *   PostgreSQL — a `DO $$ ... IF EXISTS (SELECT 1 FROM information_schema.columns|tables ...)`
 *                block naming the table (and column).
 *
 * The floor's schema is scripts/mj-schema-floor/mj-core-columns.json. The gate fails if that
 * snapshot is for a different MJ version than the floor, so raising the floor forces a refresh.
 *
 * Usage: node scripts/check-teardown-version-tolerance.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = path.join(repoRoot, 'scripts/mj-schema-floor/mj-core-columns.json');

const DIALECTS = [
  { dir: 'migrations-teardown', name: 'SQL Server', ident: String.raw`\[([A-Za-z0-9_]+)\]` },
  { dir: 'migrations-teardown-pg', name: 'PostgreSQL', ident: String.raw`"([A-Za-z0-9_]+)"` },
];

/** The `>=x.y.z` floor of mj-app.json's mjVersionRange. */
function readFloorVersion() {
  const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, 'mj-app.json'), 'utf8'));
  const match = /^\s*>=\s*(\d+\.\d+\.\d+)/.exec(manifest.mjVersionRange ?? '');
  if (!match) throw new Error(`mj-app.json mjVersionRange "${manifest.mjVersionRange}" has no ">=x.y.z" floor`);
  return match[1];
}

/** Every MJ-schema table, and every (table, column) in a SET/WHERE clause, named in a chunk. */
function collectReferences(chunk, ident) {
  const schema = ident.replace('([A-Za-z0-9_]+)', String.raw`\$\{mjSchema\}`);
  const tables = new Set();
  const columns = [];
  const tableRe = new RegExp(`${schema}\\.${ident}`, 'g');
  for (const m of chunk.matchAll(tableRe)) tables.add(m[1]);
  // UPDATE t SET c = NULL WHERE c IN / DELETE FROM t WHERE c IN / SELECT x FROM t WHERE c IN
  const stmtRe = new RegExp(`${schema}\\.${ident}\\s+(?:SET\\s+${ident}\\s*=\\s*NULL\\s+)?WHERE\\s+${ident}`, 'g');
  for (const m of chunk.matchAll(stmtRe)) {
    const [, table, setColumn, whereColumn] = m;
    if (setColumn) columns.push({ table, column: setColumn });
    columns.push({ table, column: whereColumn });
  }
  return { tables, columns };
}

/** Whether the chunk carries a guard for this table (and column) in the dialect's form. */
function isGuarded(chunk, dialect, table, column) {
  if (dialect.name === 'SQL Server') {
    if (!/EXEC\s+sp_executesql\s+N'/i.test(chunk)) return false;
    return column
      ? new RegExp(`COL_LENGTH\\(\\s*'[^']*\\[${table}\\]'\\s*,\\s*'${column}'\\s*\\)\\s+IS\\s+NOT\\s+NULL`, 'i').test(chunk)
      : new RegExp(`(OBJECT_ID|COL_LENGTH)\\(\\s*'[^']*\\[${table}\\]'[^)]*\\)\\s+IS\\s+NOT\\s+NULL`, 'i').test(chunk);
  }
  if (!/DO\s+\$\$/.test(chunk)) return false;
  return column
    ? new RegExp(`information_schema\\.columns[\\s\\S]*?table_name\\s*=\\s*'${table}'\\s+AND\\s+column_name\\s*=\\s*'${column}'`, 'i').test(chunk)
    : new RegExp(`information_schema\\.(tables|columns)[\\s\\S]*?table_name\\s*=\\s*'${table}'`, 'i').test(chunk);
}

function main() {
  const floor = readFloorVersion();
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  if (snapshot.mjVersion !== floor) {
    console.error(`❌ mj-app.json supports MJ >=${floor}, but ${path.relative(repoRoot, SNAPSHOT_PATH)} describes MJ ${snapshot.mjVersion}.`);
    console.error(`   Regenerate the snapshot from a database installed with "mj install -t v${floor}" (see the file's "source").`);
    process.exit(1);
  }
  const known = new Map(Object.entries(snapshot.tables).map(([t, cols]) => [t, new Set(cols)]));

  const problems = [];
  let checked = 0;
  for (const dialect of DIALECTS) {
    const dir = path.join(repoRoot, dialect.dir);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
      const rel = `${dialect.dir}/${file}`;
      // Generated teardown scripts put one statement (plus its comment and guard) per
      // blank-line-separated chunk.
      for (const chunk of fs.readFileSync(path.join(dir, file), 'utf8').split(/\n\s*\n/)) {
        const { tables, columns } = collectReferences(chunk, dialect.ident);
        for (const table of tables) {
          checked++;
          if (!known.has(table) && !isGuarded(chunk, dialect, table)) {
            problems.push(`${rel}: table ${table} does not exist in MJ ${floor} and is not guarded`);
          }
        }
        for (const { table, column } of columns) {
          checked++;
          if (known.has(table) && !known.get(table).has(column) && !isGuarded(chunk, dialect, table, column)) {
            problems.push(`${rel}: column ${table}.${column} does not exist in MJ ${floor} and is not guarded`);
          }
        }
      }
    }
  }

  const unique = [...new Set(problems)];
  if (unique.length) {
    console.error(`❌ Teardown is not safe on MJ ${floor} (mj-app.json floor):\n`);
    for (const p of unique) console.error(`  • ${p}`);
    console.error(`\nGuard each statement as described at the top of ${path.relative(repoRoot, fileURLToPath(import.meta.url))}.`);
    process.exit(1);
  }
  console.log(`✅ Teardown version tolerance: ${checked} table/column references checked against MJ ${floor}; every one missing there is guarded.`);
}

main();
