# Teardown scripts

Declared to MemberJunction via `migrations.teardownDirectory` in `mj-app.json`.
`@memberjunction/open-app-engine` runs everything in here on `mj app remove`, and
on the compensation path when an install fails partway.

`migrations-teardown-pg/` is the PostgreSQL twin. The engine prefers
`<teardownDirectory>-pg/` on PostgreSQL and silently falls back to this directory
if it is missing, so the twin is not optional: these scripts use SQL Server
`[bracket]` quoting and would abort a PostgreSQL uninstall on the first statement.

## What it removes, and why it is more than the seeds

Sonar's migrations seed ~225 rows into MemberJunction's shared `__mj` schema
(24 Actions, the authoring Agent with its Prompt and Template, 3 Overview
Queries). Those rows have no foreign-key path back to Sonar's own entities, so
the engine's FK-graph walk cannot reach them and they survive an uninstall.

Deleting only those 225 rows is **not enough**. The moment Sonar is actually
used, MemberJunction writes runtime rows that point at them:

| table | written when |
|---|---|
| `ActionExecutionLog` | every Action run |
| `AIAgentRun`, `AIAgentRunStep`, `AIAgentRunMedia` | every authoring-agent run |
| `AIPromptRun` | every prompt call |
| `AIResultCache`, `AIAgentSession`, `QuerySQL` | caching, chat sessions, CodeGen |

`ActionExecutionLog.ActionID` is `NOT NULL`, so a single Action run is enough to
make `DELETE FROM Action` fail with FK 547. The engine runs the whole teardown in
**one transaction**, so one 547 means nothing is cleaned up at all. An install
that was never exercised tears down fine, which is exactly why this class of bug
survives a naive install-then-remove test.

## The two phases

**`01__Detach_Optional_References.sql`** nulls every *NULL-able* reference into
Sonar's rows. Those referencing rows are valid without Sonar and are usually the
customer's own: a `Conversation` whose default agent was Sonar's, a `Task`
assigned to it, a `RecordProcess` that called an Action. Uninstall must not
delete them.

**`02__Delete_Sonar_Rows.sql`** deletes rows with a *NOT NULL* reference, meaning
they cannot exist without Sonar and therefore only exist because of it. Tables
are ordered by a topological sort of `__mj`'s real FK graph, children strictly
before parents.

That NULL-able / NOT NULL split is the whole safety argument: nothing that can
survive without Sonar is ever deleted.

## Scoping rules

- **Never match on name or prefix.** Every statement resolves to Sonar's
  hardcoded seed GUIDs, directly or through a subquery chain. A predicate like
  `WHERE Name LIKE 'Sonar:%'` in a shared schema is how you delete a customer's
  data.
- **Child tables are scoped by parent, not by literal ID.** `ActionParam` is
  deleted with `WHERE ActionID IN (<Sonar's Actions>)`, not by the 63 IDs the
  seed wrote. Otherwise a later migration that adds a param to an existing Action
  leaves a row behind and the parent DELETE dies on 547. Open PR #40 does exactly
  that, and it is why the verified run deletes 64 params rather than 63. It also
  makes the `Query` children immune to the SQL Server / PostgreSQL GUID
  divergence, since those child rows genuinely have different IDs per platform.
- **No existence guards.** A `DELETE` against an absent row is a no-op, so the
  scripts are already safe on a partially-seeded database and safe to re-run.

## Regenerating

These files are generated, not hand-written. After any migration that writes to
`__mj`:

```bash
# 1. re-extract the seeded IDs from the migrations
python3 ci/extract_ids.py    migrations
python3 ci/extract_ids_pg.py migrations-pg

# 2. regenerate both directories against a live MJ core schema
#    (the FK graph is read from sys.foreign_keys, so a database is required)
node ci/generate_teardown.mjs .
```

The generator reads the FK graph from a live SQL Server `__mj`, so the order it
produces reflects the MJ version you point it at. Sonar supports
`>=6.1.0-edge.4 <7.0.0`; regenerate against the low end of that range when in doubt.

## Verifying

Run the SQL Server scripts inside a transaction and roll back, then diff row
counts for **every** table in `__mj`, not just the ones you expect to move. The
"nothing else changed" check is what catches an over-broad predicate. Confirm
that `Conversation`, `Task` and `EntityDocument` counts are unchanged, since
those are the customer-owned tables phase 1 is meant to protect.
