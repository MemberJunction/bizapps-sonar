// Teardown generator, v3.
//
// Two files:
//   01  UPDATE ... SET <fk> = NULL  for every OPTIONAL reference into Sonar's rows.
//   02  DELETE everything Sonar owns, grouped by table in a TOPOLOGICAL order of
//       __mj's real FK graph (children strictly before parents).
//
// v2 ordered deletes by BFS depth, which is wrong: AIPrompt (depth 1 via Template)
// and AIPromptModel (depth 1 via AIPrompt) tie on depth, and alphabetical tiebreak
// put the parent first -> FK 547. Only a topological sort over the table graph is
// correct.
//
// Every predicate chains back to Sonar's literal seed GUIDs. Nothing matches on
// name or prefix.
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const SEED_TABLES = ['Action', 'ActionParam', 'ActionResultCode', 'AIAgent', 'AIAgentAction',
  'AIAgentPrompt', 'AIPrompt', 'Query', 'QueryField', 'QueryParameter', 'QueryEntity',
  'Template', 'TemplateContent'];
const MAX_DEPTH = 6;

(async () => {
  const idsMs = JSON.parse(fs.readFileSync(path.join(__dirname, 'seeded_ids.json'))).ids;
  const idsPg = JSON.parse(fs.readFileSync(path.join(__dirname, 'seeded_ids_pg.json'))).ids;

  const p = await sql.connect({
    server: process.env.DB_HOST, port: +(process.env.DB_PORT || 1433),
    database: process.env.DB_DATABASE, user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    options: { trustServerCertificate: true, encrypt: false }, requestTimeout: 120000,
  });
  const { recordset: fks } = await p.request().query(`
    SELECT pt.name AS parent, ct.name AS child, cc.name AS col, cc.is_nullable AS nullable
    FROM sys.foreign_keys fk
    JOIN sys.tables ct  ON ct.object_id = fk.parent_object_id
    JOIN sys.tables pt  ON pt.object_id = fk.referenced_object_id
    JOIN sys.schemas cs ON cs.schema_id = ct.schema_id
    JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
    JOIN sys.columns cc ON cc.object_id = ct.object_id AND cc.column_id = fkc.parent_column_id
    WHERE cs.name = '__mj'`);
  await p.close();

  const inbound = {};
  for (const f of fks) (inbound[f.parent] ||= []).push(f);

  // ---- BFS: find every row reachable from Sonar's seeds ---------------------
  const deleteNodes = [];   // {table, col, parent}   parent = seedNode | node
  const detaches = [];      // {table, col, target}
  const seen = new Set();
  const seedNode = t => ({ seed: t, table: t });

  for (const t of SEED_TABLES)
    for (const e of inbound[t] || [])
      if (e.child === e.parent && e.nullable)
        detaches.push({ table: t, col: e.col, target: seedNode(t) });

  let frontier = SEED_TABLES.map(t => ({ node: seedNode(t), depth: 0 }));
  while (frontier.length) {
    const next = [];
    for (const { node, depth } of frontier) {
      for (const e of inbound[node.table] || []) {
        if (e.child === e.parent) continue;
        const key = `${e.child}.${e.col}<-${node.table}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (e.nullable) { detaches.push({ table: e.child, col: e.col, target: node }); continue; }
        // Seed tables are intentionally included: a child like ActionParam must be
        // deleted by PARENT SCOPE, not only by the literal IDs the seed wrote, or a
        // later migration that adds a param to an existing Sonar Action leaves a row
        // behind and the parent DELETE dies on FK 547. Open PR #40 does exactly that.
        const child = { table: e.child, col: e.col, parent: node };
        deleteNodes.push(child);
        if (depth + 1 < MAX_DEPTH) {
          next.push({ node: child, depth: depth + 1 });
          for (const s of inbound[e.child] || [])
            if (s.child === s.parent && s.nullable) {
              const k2 = `self:${e.child}.${s.col}`;
              if (!seen.has(k2)) { seen.add(k2); detaches.push({ table: e.child, col: s.col, target: child }); }
            }
        }
      }
    }
    frontier = next;
  }

  // ---- topological order over the tables we delete from ---------------------
  const delTables = new Set([...deleteNodes.map(n => n.table), ...SEED_TABLES]);
  const edges = fks.filter(f => delTables.has(f.child) && delTables.has(f.parent) && f.child !== f.parent);

  const order = [];
  const remaining = new Set(delTables);
  while (remaining.size) {
    // a table is emittable when nothing still-remaining references it
    let free = [...remaining].filter(t =>
      ![...remaining].some(o => o !== t && edges.some(e => e.child === o && e.parent === t)));
    if (!free.length) {
      // cycle: break it on NULL-able edges, which phase 1 has already detached
      const hard = edges.filter(e => !e.nullable);
      free = [...remaining].filter(t =>
        ![...remaining].some(o => o !== t && hard.some(e => e.child === o && e.parent === t)));
      if (!free.length) { console.error('unbreakable cycle:', [...remaining]); process.exit(1); }
    }
    free.sort();
    for (const t of free) { order.push(t); remaining.delete(t); }
  }

  // ---- render ---------------------------------------------------------------
  const DIALECTS = {
    mssql: { ids: idsMs, dir: 'migrations-teardown',
             t: n => `[\${mjSchema}].[${n}]`, c: n => `[${n}]` },
    pg:    { ids: idsPg, dir: 'migrations-teardown-pg',
             t: n => `"\${mjSchema}"."${n}"`, c: n => `"${n}"` },
  };
  const lits = (d, t, pad) => (d.ids[t] || []).map(g => `${pad}'${g}'`).join(',\n');

  function pred(d, node, indent) {           // selects the node's OWN rows
    const pad = ' '.repeat(indent);
    if (node.seed) {
      if (!(d.ids[node.seed] || []).length) return null;
      return `${d.c('ID')} IN (\n${lits(d, node.seed, pad + '  ')}\n${pad})`;
    }
    const inner = pred(d, node.parent, indent + 2);
    return inner && `${d.c(node.col)} IN (\n${pad}  SELECT ${d.c('ID')} FROM ${d.t(node.parent.table)} WHERE ${inner}\n${pad})`;
  }
  function predTo(d, col, target, indent) {  // a column pointing AT target's rows
    const pad = ' '.repeat(indent);
    if (target.seed) {
      if (!(d.ids[target.seed] || []).length) return null;
      return `${d.c(col)} IN (\n${lits(d, target.seed, pad + '  ')}\n${pad})`;
    }
    const inner = pred(d, target, indent + 2);
    return inner && `${d.c(col)} IN (\n${pad}  SELECT ${d.c('ID')} FROM ${d.t(target.table)} WHERE ${inner}\n${pad})`;
  }

  const head = (f, b) => `-- =============================================================================
-- ${f}
-- =============================================================================
${b}
-- =============================================================================

`;

  for (const d of Object.values(DIALECTS)) {
    const outDir = path.join(process.argv[2], d.dir);
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir, { recursive: true });

    // 01 -- detach
    const dParts = []; let dn = 0;
    for (const e of detaches) {
      const w = predTo(d, e.col, e.target, 0);
      if (!w) continue;
      dParts.push(`-- ${e.table}.${e.col} -> ${e.target.seed || e.target.table}\nUPDATE ${d.t(e.table)} SET ${d.c(e.col)} = NULL WHERE ${w};\n`);
      dn++;
    }
    fs.writeFileSync(path.join(outDir, '01__Detach_Optional_References.sql'),
      head('01__Detach_Optional_References.sql',
`-- PHASE 1 of 2 -- release every OPTIONAL reference into Sonar's rows.
--
-- These FK columns are NULL-able, so the referencing row stays perfectly valid
-- without Sonar: a Conversation whose default agent happened to be Sonar's, a
-- Task assigned to it, a RecordProcess that called one of its Actions, an
-- AIPromptRun logged against a run being removed. Those rows belong to the
-- customer. Uninstall nulls the pointer and leaves the row standing.
--
-- Deleting them instead would be the most destructive thing this teardown could
-- do, which is exactly why phase 2 only ever deletes NOT NULL dependants.
--
-- ${dn} columns detached, every statement scoped to Sonar's seeded IDs.`) + dParts.join('\n'));

    // 02 -- deletes, grouped by table in topological order
    const byTable = {};
    for (const n of deleteNodes) (byTable[n.table] ||= []).push(n);
    const parts = []; let sn = 0;
    for (const t of order) {
      const block = [];
      for (const n of byTable[t] || []) {
        const w = pred(d, n, 0);
        if (!w) continue;
        block.push(`DELETE FROM ${d.t(t)} WHERE ${w};  -- via ${n.col} -> ${n.parent.table}\n`);
        sn++;
      }
      if (SEED_TABLES.includes(t) && (d.ids[t] || []).length) {
        block.push(`-- ...and the ${d.ids[t].length} row(s) the seed wrote directly.\nDELETE FROM ${d.t(t)} WHERE ${d.c('ID')} IN (\n${lits(d, t, '  ')}\n);\n`);
        sn++;
      }
      if (block.length) parts.push(`-- ---- ${t} ${'-'.repeat(Math.max(0, 66 - t.length))}\n` + block.join('\n'));
    }
    fs.writeFileSync(path.join(outDir, '02__Delete_Sonar_Rows.sql'),
      head('02__Delete_Sonar_Rows.sql',
`-- PHASE 2 of 2 -- delete everything Sonar owns in the shared core schema.
--
-- Three kinds of row, all of them Sonar's:
--   * the seeded metadata itself -- 24 Actions, the authoring Agent, its Prompt
--     and Template, the 3 Overview Queries and their fields/params;
--   * config layered on top -- ActionParam, ActionResultCode, AIAgentAction, and
--     anything an admin bound to them (EntityAction, ScheduledAction);
--   * RUNTIME rows MemberJunction writes whenever Sonar is actually used --
--     ActionExecutionLog, AIAgentRun and its steps/media, AIPromptRun,
--     AIResultCache, AIAgentSession, QuerySQL.
--
-- The runtime rows are why a seed-only teardown is not enough. An install that
-- was never exercised has none of them and tears down cleanly. A real one that
-- ran a single Action has an ActionExecutionLog row, and deleting that Action
-- then fails with FK 547 -- which, because the engine runs the whole teardown in
-- ONE transaction, means nothing gets cleaned up at all.
--
-- Table order is a topological sort of __mj's real foreign-key graph
-- (sys.foreign_keys), children strictly before parents. Two consequences worth
-- knowing: AIAgent goes before AIPrompt (AIAgent.ContextCompressionPromptID),
-- and ActionParam goes before Action.
--
-- Child tables are deleted by PARENT SCOPE (e.g. ActionID IN <Sonar's Actions>)
-- rather than only by the literal IDs the seeds wrote. That is still bounded by
-- Sonar's hardcoded parent GUIDs, and it survives a later migration adding a
-- param to an existing Action -- which open PR #40 does.
--
-- DELETEs against rows that were never inserted are no-ops, so this is safe on a
-- partially-seeded database (a failed install) and safe to re-run.
--
-- ${sn} statements across ${order.filter(t => (byTable[t] || []).length || (SEED_TABLES.includes(t) && (d.ids[t] || []).length)).length} tables.`) + parts.join('\n'));

    console.log(`${d.dir}:  01=${dn} updates   02=${sn} deletes`);
  }
  console.log('\ntopological table order:\n  ' + order.join(' -> '));
})().catch(e => { console.error('ERR', e.stack); process.exit(1); });
