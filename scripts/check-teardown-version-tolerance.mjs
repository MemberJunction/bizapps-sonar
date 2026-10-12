#!/usr/bin/env node
/**
 * Validates that Sonar's teardown scripts are version-tolerant.
 *
 * Checks:
 * 1. All column/table references in teardown scripts are guarded against
 *    missing columns (using COL_LENGTH in T-SQL or information_schema in PG)
 * 2. Known problematic columns from issue #56 are properly guarded
 *
 * Problematic columns (added after MJ 6.1.5):
 *   - [__mj].[AIPromptRun].[AgentRunID]
 *   - [__mj].[ContentSource].[ScheduledActionID]
 *   - [__mj].[ScheduledActionParam].[ScheduledActionID]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const PROBLEMATIC_COLUMNS = [
  { table: 'AIPromptRun', column: 'AgentRunID', issue: '#56' },
  { table: 'ContentSource', column: 'ScheduledActionID', issue: '#56' },
  { table: 'ScheduledActionParam', column: 'ScheduledActionID', issue: '#56' },
];

/**
 * Check if a column reference in T-SQL is guarded with COL_LENGTH
 */
function isTSQLGuarded(sql, table, column) {
  // Look for pattern: IF COL_LENGTH(...) IS NOT NULL ... BEGIN ... UPDATE/DELETE ... END
  const pattern = new RegExp(
    `IF\\s+COL_LENGTH\\s*\\(\\s*'[^']*'\\s*,\\s*'${column}'\\s*\\)\\s+IS\\s+NOT\\s+NULL`,
    'i'
  );
  return pattern.test(sql);
}

/**
 * Check if a column reference in PostgreSQL is guarded with information_schema
 */
function isPGGuarded(sql, table, column) {
  // Look for pattern: DO $$ BEGIN IF EXISTS (... information_schema.columns ...
  const pattern = new RegExp(
    `DO\\s+\\$\\$\\s+BEGIN\\s+IF\\s+EXISTS\\s*\\(\\s*SELECT\\s+1\\s+FROM\\s+information_schema\\.columns\\s+WHERE.*column_name\\s*=\\s*'${column}'`,
    'is'
  );
  return pattern.test(sql);
}

/**
 * Extract unguarded references to a column in SQL
 */
function findUnguardedReferences(sql, table, column) {
  const references = [];

  // Find all references like [schema].[table].[column] or "schema"."table"."column"
  const tsqlPattern = new RegExp(
    `\\[(?:__mj|\\$\\{mjSchema\\})\\]\\.\\[${table}\\]\\s+SET\\s+\\[${column}\\]|` +
    `"(?:__mj|\\$\\{mjSchema\\})"\\."${table}"\\s+SET\\s+"${column}"`,
    'gi'
  );

  // Look for DELETE FROM patterns too
  const tsqlDeletePattern = new RegExp(
    `DELETE\\s+FROM\\s+\\[(?:__mj|\\$\\{mjSchema\\})\\]\\.\\[${table}\\]\\s+WHERE\\s+\\[${column}\\]`,
    'gi'
  );

  const pgPattern = new RegExp(
    `"(?:__mj|\\$\\{mjSchema\\})"\\."${table}"\\s+SET\\s+"${column}"`,
    'gi'
  );

  const pgDeletePattern = new RegExp(
    `DELETE\\s+FROM\\s+"(?:__mj|\\$\\{mjSchema\\})"\\."${table}"\\s+WHERE\\s+"${column}"`,
    'gi'
  );

  const lines = sql.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(tsqlPattern) || line.match(tsqlDeletePattern) ||
        line.match(pgPattern) || line.match(pgDeletePattern)) {
      references.push({ line: i + 1, text: line.trim() });
    }
  }

  return references;
}

/**
 * Main validation
 */
function validateTeardownTolerance() {
  const teardownDir = path.join(repoRoot, 'migrations-teardown');
  const teardownPgDir = path.join(repoRoot, 'migrations-teardown-pg');

  let hasErrors = false;
  const results = {
    tsql: { file: 'migrations-teardown/01__Detach_Optional_References.sql', guarded: {}, unguarded: {} },
    tsql2: { file: 'migrations-teardown/02__Delete_Sonar_Rows.sql', guarded: {}, unguarded: {} },
    pg: { file: 'migrations-teardown-pg/01__Detach_Optional_References.sql', guarded: {}, unguarded: {} },
    pg2: { file: 'migrations-teardown-pg/02__Delete_Sonar_Rows.sql', guarded: {}, unguarded: {} },
  };

  // Check T-SQL files
  const tsqlFile1 = path.join(teardownDir, '01__Detach_Optional_References.sql');
  const tsqlFile2 = path.join(teardownDir, '02__Delete_Sonar_Rows.sql');

  if (!fs.existsSync(tsqlFile1)) {
    console.error(`ERROR: ${tsqlFile1} not found`);
    hasErrors = true;
  } else {
    const sql = fs.readFileSync(tsqlFile1, 'utf-8');
    for (const col of PROBLEMATIC_COLUMNS) {
      if (isTSQLGuarded(sql, col.table, col.column)) {
        results.tsql.guarded[`${col.table}.${col.column}`] = true;
      } else {
        const refs = findUnguardedReferences(sql, col.table, col.column);
        if (refs.length > 0) {
          results.tsql.unguarded[`${col.table}.${col.column}`] = refs;
          hasErrors = true;
        }
      }
    }
  }

  if (!fs.existsSync(tsqlFile2)) {
    console.error(`ERROR: ${tsqlFile2} not found`);
    hasErrors = true;
  } else {
    const sql = fs.readFileSync(tsqlFile2, 'utf-8');
    for (const col of PROBLEMATIC_COLUMNS) {
      if (isTSQLGuarded(sql, col.table, col.column)) {
        results.tsql2.guarded[`${col.table}.${col.column}`] = true;
      } else {
        const refs = findUnguardedReferences(sql, col.table, col.column);
        if (refs.length > 0) {
          results.tsql2.unguarded[`${col.table}.${col.column}`] = refs;
          hasErrors = true;
        }
      }
    }
  }

  // Check PostgreSQL files
  const pgFile1 = path.join(teardownPgDir, '01__Detach_Optional_References.sql');
  const pgFile2 = path.join(teardownPgDir, '02__Delete_Sonar_Rows.sql');

  if (!fs.existsSync(pgFile1)) {
    console.error(`ERROR: ${pgFile1} not found`);
    hasErrors = true;
  } else {
    const sql = fs.readFileSync(pgFile1, 'utf-8');
    for (const col of PROBLEMATIC_COLUMNS) {
      if (isPGGuarded(sql, col.table, col.column)) {
        results.pg.guarded[`${col.table}.${col.column}`] = true;
      } else {
        const refs = findUnguardedReferences(sql, col.table, col.column);
        if (refs.length > 0) {
          results.pg.unguarded[`${col.table}.${col.column}`] = refs;
          hasErrors = true;
        }
      }
    }
  }

  if (!fs.existsSync(pgFile2)) {
    console.error(`ERROR: ${pgFile2} not found`);
    hasErrors = true;
  } else {
    const sql = fs.readFileSync(pgFile2, 'utf-8');
    for (const col of PROBLEMATIC_COLUMNS) {
      if (isPGGuarded(sql, col.table, col.column)) {
        results.pg2.guarded[`${col.table}.${col.column}`] = true;
      } else {
        const refs = findUnguardedReferences(sql, col.table, col.column);
        if (refs.length > 0) {
          results.pg2.unguarded[`${col.table}.${col.column}`] = refs;
          hasErrors = true;
        }
      }
    }
  }

  // Report results
  console.log('\n=== Teardown Version Tolerance Check ===\n');

  const allGuarded = Object.values(results).every(r => Object.keys(r.unguarded).length === 0);

  if (allGuarded) {
    console.log('✓ All problematic columns are properly guarded\n');

    for (const key of Object.keys(results)) {
      const r = results[key];
      const guarded = Object.keys(r.guarded);
      if (guarded.length > 0) {
        console.log(`${r.file}:`);
        guarded.forEach(col => console.log(`  ✓ ${col}`));
      }
    }
    return 0;
  } else {
    console.log('✗ ERRORS: Some problematic columns are not guarded:\n');

    for (const key of Object.keys(results)) {
      const r = results[key];
      if (Object.keys(r.unguarded).length > 0) {
        console.log(`${r.file}:`);
        for (const col of Object.keys(r.unguarded)) {
          console.log(`  ✗ ${col} - UNGUARDED`);
          r.unguarded[col].forEach(ref => {
            console.log(`    Line ${ref.line}: ${ref.text}`);
          });
        }
      }
    }
    return 1;
  }
}

process.exit(validateTeardownTolerance());
