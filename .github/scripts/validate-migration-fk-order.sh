#!/usr/bin/env bash
#
# Flyway applies migrations in version order, so a migration may only reference a table an EARLIER
# migration created. Nothing else checks this.
#
# It matters because the failure is invisible until someone installs from empty. On a database that
# already has the tables, every migration succeeds and the ordering looks fine; on a fresh
# `mj app install` the FK points at a table that does not exist yet and the install dies.
#
# This is not hypothetical. Folding sonar_intervention_layer into sonar_draft_outreach produced exactly
# that: Intervention_Proposals (V202607281000) FK-references Intervention, which the renumbered
# Intervention_Layer did not create until V202608011000 — ten migrations later. The existing filename
# validator passed it, because the names were perfectly well-formed.
#
# Only tables created WITHIN this directory are checked; references to core MJ tables are skipped,
# since those are created by the platform's own migrations before ours run.
set -euo pipefail

DIR="${1:-migrations}"
echo "::notice::Validating migration FK ordering in ${DIR}/"

python3 - "$DIR" <<'PY'
import os, re, sys

directory = sys.argv[1]
# Flyway applies Baseline (B) before Versioned (V), so both count and B sorts first. Missing this
# skipped the baseline that creates 14 of the 19 tables, which is why an earlier run of this script
# reported 5 — every reference to a baseline table looked like a reference to a foreign table.
files = sorted(
    (f for f in os.listdir(directory) if re.match(r"^[BV]\d{12}__.*\.sql$", f)),
    key=lambda f: (f[0] != "B", f[1:13]),
)

# Schema-AGNOSTIC on purpose. An earlier version tried to enumerate each dialect's schema quoting
# and silently under-matched: PostgreSQL reported 5 tables when the directory has 19, so the check
# passed without checking anything. A vacuous guard is worse than no guard. Now: skip whatever
# qualifies the name and capture the last identifier, quoted however the dialect likes.
QUALIFIED = r'(?:[^\s(,;]*\.)?["\[`]?(\w+)["\]`]?'

# First pass: which version creates each table.
created: dict[str, str] = {}
for name in files:
    version = ("0" if name[0] == "B" else "1") + name[1:13]
    body = open(os.path.join(directory, name), encoding="utf-8", errors="replace").read()
    for m in re.finditer(rf"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?{QUALIFIED}\s*\(", body, re.I):
        created.setdefault(m.group(1), version)

# Second pass: every reference must resolve to a strictly earlier version.
problems = []
for name in files:
    version = ("0" if name[0] == "B" else "1") + name[1:13]
    body = open(os.path.join(directory, name), encoding="utf-8", errors="replace").read()
    for m in re.finditer(rf"REFERENCES\s+{QUALIFIED}\s*\(", body, re.I):
        table = m.group(1)
        creator = created.get(table)
        if creator is None:
            continue                     # not ours — a core MJ table
        if creator > version:
            problems.append(f"{name} references {table}, which is not created until V{creator[1:]}")

print(f"::notice::Scanned {len(files)} migrations; {len(created)} tables created in {directory}/")
if problems:
    print("::error::Migration FK ordering is wrong — a fresh install would fail:")
    for p in sorted(set(problems)):
        print(f"  - {p}")
    sys.exit(1)
print("::notice::FK ordering OK — every referenced table is created by an earlier migration")
PY
