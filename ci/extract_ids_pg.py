#!/usr/bin/env python3
"""Same job as extract_ids.py but for the PostgreSQL twins.

PG seeds use plain INSERT INTO __mj."Table" (...) VALUES (...) with literal
UUIDs, so we attribute the first UUID of each VALUES tuple / SELECT list to the
table named by the enclosing INSERT.
"""
import re, sys, json, glob, os, collections

MIG_DIR = sys.argv[1] if len(sys.argv) > 1 else "migrations-pg"

CORE_TABLES = {
    "Action", "ActionParam", "ActionResultCode", "AIAgent", "AIAgentAction",
    "AIAgentPrompt", "AIPrompt", "Query", "QueryField", "QueryParameter",
    "QueryEntity", "QueryCategory", "Template", "TemplateContent", "TemplateParam",
}
GUID = r"[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}"

found = collections.defaultdict(set)
provenance = collections.defaultdict(set)

for path in sorted(glob.glob(os.path.join(MIG_DIR, "*.sql"))):
    src = open(path, encoding="utf-8-sig", errors="replace").read()
    fname = os.path.basename(path)
    for m in re.finditer(r'INSERT\s+INTO\s+__mj\."?(\w+)"?', src, re.I):
        table = m.group(1)
        if table not in CORE_TABLES:
            continue
        start = m.end()
        nxt = re.search(r"\n\s*(INSERT\s+INTO|UPDATE\s|DELETE\s|CREATE\s|ALTER\s)", src[start:], re.I)
        block = src[start: start + (nxt.start() if nxt else len(src) - start)]
        for g in re.findall(r"\(\s*'(" + GUID + r")'", block):
            found[table].add(g.upper())
            provenance[(table, g.upper())].add(fname)
        for m2 in re.finditer(r"SELECT\s+'(" + GUID + r")'", block, re.I):
            found[table].add(m2.group(1).upper())
            provenance[(table, m2.group(1).upper())].add(fname)

for t in sorted(found):
    print(f"{t:20s} {len(found[t]):4d}")
print("-" * 26)
print(f"{'TOTAL':20s} {sum(len(v) for v in found.values()):4d}")

json.dump(
    {"ids": {t: sorted(v) for t, v in found.items()}},
    open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "seeded_ids_pg.json"), "w"),
    indent=2,
)
