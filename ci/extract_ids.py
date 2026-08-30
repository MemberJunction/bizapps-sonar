#!/usr/bin/env python3
"""Extract every __mj core-schema row ID that Sonar's migrations create.

Two seeding shapes are in play:
  1. EXEC [__mj].spCreate<Table> @ID = @ID_xxxx   (variables resolved from
     `@ID_xxxx = 'guid'` assignments earlier in the same file)
  2. INSERT INTO [__mj].[<Table>] ... with literal GUIDs in a VALUES/SELECT list

We resolve both, then print table -> sorted ID set so the teardown can be an
exact inverse rather than a pattern match.
"""
import re, sys, json, glob, os, collections

MIG_DIR = sys.argv[1] if len(sys.argv) > 1 else "migrations"

CORE_TABLES = {
    "Action", "ActionParam", "ActionResultCode", "AIAgent", "AIAgentAction",
    "AIAgentPrompt", "AIPrompt", "Query", "QueryField", "QueryParameter",
    "QueryEntity", "QueryCategory", "Template", "TemplateContent", "TemplateParam",
    "ActionCategory",
}

GUID = r"[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}"

found = collections.defaultdict(set)          # table -> {guid}
provenance = collections.defaultdict(set)     # (table,guid) -> {file}

for path in sorted(glob.glob(os.path.join(MIG_DIR, "*.sql"))):
    src = open(path, encoding="utf-8-sig", errors="replace").read()
    fname = os.path.basename(path)

    # ---- shape 1: variable assignments, then spCreate calls ------------------
    varmap = {}
    for m in re.finditer(r"@(ID_\w+)\s*=\s*'(" + GUID + r")'", src):
        varmap[m.group(1)] = m.group(2).upper()

    for m in re.finditer(
        r"EXEC\s+\[?__mj\]?\.\[?spCreate(\w+?)\]?\s+@ID\s*=\s*@(ID_\w+)", src, re.I
    ):
        table, var = m.group(1), m.group(2)
        if table in CORE_TABLES and var in varmap:
            found[table].add(varmap[var])
            provenance[(table, varmap[var])].add(fname)

    # spCreate with a literal ID instead of a variable
    for m in re.finditer(
        r"EXEC\s+\[?__mj\]?\.\[?spCreate(\w+?)\]?\s+@ID\s*=\s*'(" + GUID + r")'", src, re.I
    ):
        table, guid = m.group(1), m.group(2).upper()
        if table in CORE_TABLES:
            found[table].add(guid)
            provenance[(table, guid)].add(fname)

    # ---- shape 2: INSERT INTO [__mj].[Table] with literal GUIDs --------------
    # Split the file on INSERT statements so each block's GUIDs are attributed
    # to the right table. A block ends at the next INSERT/EXEC/GO.
    for m in re.finditer(r"INSERT\s+INTO\s+\[?__mj\]?\.\[?(\w+)\]?", src, re.I):
        table = m.group(1)
        if table not in CORE_TABLES:
            continue
        start = m.end()
        nxt = re.search(r"\n\s*(INSERT\s+INTO|EXEC\s|GO\b|UPDATE\s|DELETE\s)", src[start:], re.I)
        block = src[start: start + (nxt.start() if nxt else len(src) - start)]
        # The FIRST guid on each VALUES row is the PK. Rows look like
        #   ('<id>', '<fk>', ...)  or  SELECT '<id>', ...
        for row in re.finditer(r"[\(,]\s*'(" + GUID + r")'", block):
            pass  # handled below with row-aware logic
        # row-aware: each "(" ... ")" tuple, or a SELECT list
        tuples = re.findall(r"\(\s*'(" + GUID + r")'", block)
        for g in tuples:
            found[table].add(g.upper())
            provenance[(table, g.upper())].add(fname)
        for m2 in re.finditer(r"SELECT\s+'(" + GUID + r")'", block, re.I):
            found[table].add(m2.group(1).upper())
            provenance[(table, m2.group(1).upper())].add(fname)

out = {}
for t in sorted(found):
    out[t] = sorted(found[t])
    print(f"{t:20s} {len(found[t]):4d}")
print("-" * 26)
print(f"{'TOTAL':20s} {sum(len(v) for v in found.values()):4d}")

json.dump(
    {"ids": out, "provenance": {f"{k[0]}|{k[1]}": sorted(v) for k, v in provenance.items()}},
    open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "seeded_ids.json"), "w"),
    indent=2,
)
