#!/bin/bash
# Validates, for BOTH dialects (migrations/ = SQL Server, migrations-pg/ = PostgreSQL),
# that any AI agent the migrations create also gets at least one tool (AIAgentAction)
# link, AND that no link is seeded before the Action it FK-references.
#
# Why: an MJ Loop agent's callable tools come from AIAgentAction rows. Zero of them
# => empty toolbox => every action reports "unavailable" (#24 on SQL Server, the same
# gap later found on PostgreSQL). And an AIAgentAction seeded before the Action it
# references (AIAgentAction.ActionID -> Action) aborts a clean install on a FK
# violation (#27). Both bugs were green on a populated/other-dialect proxy and only
# broke on a genuinely clean install — this checks each dialect's migration set as one
# execution-ordered stream (files concatenated in version order) so the links may live
# in the seed/baseline or in a later forward migration.
#
# ORDERING RULE — per ActionID, not stream-wide.
#   Each Action's own UUID is compared against the links that reference it: an Action must
#   be introduced EARLIER in the stream than any link pointing at it.
#
#   It deliberately does NOT compare "the first link anywhere" against "the last action
#   anywhere". That coarser form fails the moment a NEW Action is added by a later forward
#   migration — which is exactly how CLAUDE.md says to add installed config — even when
#   that migration seeds its own link correctly, after its own Action. It flagged clean
#   migrations for an FK hazard that did not exist, and there was no way to satisfy it
#   short of never adding another Action.
#
#   UUIDs seen only inside link statements (the link row's own primary key, the AgentID, or
#   an Action seeded outside these migrations) are skipped — there is nothing in this stream
#   to order them against.
#
# Static only: greps the migration SQL, no database. Not a substitute for a real
# clean-install smoke test on each dialect — it's a fast approximation of one.

# check_dir DIR LABEL AGENT_RE LINK_RE ACTION_RE  -> 0 ok / 1 fail
check_dir() {
  local dir="$1" label="$2" agent_re="$3" link_re="$4" action_re="$5"
  local files stream links
  files=$(ls "$dir"/[BV]*.sql 2>/dev/null | sort)
  if [ -z "$files" ]; then
    echo "::notice::[$label] no migrations in $dir/; skipping."
    return 0
  fi
  stream=$(cat $files)   # concatenated in version order = execution order
  if ! printf '%s\n' "$stream" | grep -qE "$agent_re"; then
    echo "::notice::[$label] no AI agent seeded; skipping."
    return 0
  fi
  links=$(printf '%s\n' "$stream" | grep -icE "$link_re")
  if [ "$links" -eq 0 ]; then
    echo "::error::[$label] an AI agent is seeded but NO AIAgentAction tool links exist anywhere in $dir/. A Loop agent with zero tools reports every action as 'unavailable'. Add a (forward) migration seeding the agent's tool links for this dialect. See #24 (SQL Server) and the PG parity fix."
    return 1
  fi

  # Statements are multi-line in both dialects (INSERT ... SELECT ... FROM (VALUES ...)) and
  # the UUID often sits several lines below the INSERT, so UUIDs are collected per STATEMENT
  # REGION (matching line through the next line that ends a statement), not per line.
  printf '%s\n' "$stream" | \
    VSAT_LABEL="$label" VSAT_LINKS="$links" VSAT_LINK_RE="$link_re" VSAT_ACTION_RE="$action_re" \
    python3 -c '
import os, re, sys

label = os.environ["VSAT_LABEL"]
link_count = os.environ["VSAT_LINKS"]
link_pat = re.compile(os.environ["VSAT_LINK_RE"], re.I)
action_pat = re.compile(os.environ["VSAT_ACTION_RE"], re.I)
lines = sys.stdin.read().splitlines()
uuid_re = re.compile(r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")

def collect(pattern):
    """First stream line (1-based) each UUID appears at, within a region opened by pattern."""
    first, inside = {}, False
    for n, line in enumerate(lines, 1):
        if not inside and pattern.search(line):
            inside = True
        if inside:
            for u in uuid_re.findall(line):
                first.setdefault(u.lower(), n)
            if ";" in line:
                inside = False
    return first

actions, links = collect(action_pat), collect(link_pat)

# Only UUIDs this stream both CREATES as an Action and REFERENCES from a link are orderable.
bad = sorted(
    ((u, actions[u], links[u]) for u in links if u in actions and links[u] < actions[u]),
    key=lambda t: t[2],
)
for u, a, l in bad:
    print(f"::error::[{label}] AIAgentAction link at stream line {l} references Action {u}, which "
          f"this stream does not create until line {a}. On a clean install the FK-referenced Action "
          f"row does not exist yet => the seed aborts on a FK violation. Seed the link after the "
          f"Action (same migration, later in the file) or in a later forward migration. See #27.")
if bad:
    sys.exit(1)

checked = sum(1 for u in links if u in actions)
print(f"::notice::[{label}] agent tool-surface OK ({link_count} link stmt(s); {checked} "
      f"link->Action reference(s) checked, each Action created before the link that references it).")
'
  return $?
}

rc=0

# SQL Server (T-SQL): agent via spCreateAIAgent (\b excludes ...Action/...Prompt);
# links via spCreateAIAgentAction or INSERT INTO [__mj].[AIAgentAction]; actions via
# spCreateAction OR a plain INSERT INTO [__mj].[Action] -- hand-written forward migrations
# use the latter, which a sproc-only pattern missed entirely (so a new Action registered
# that way was invisible to this check).
check_dir migrations "SQL Server" \
  'spCreateAIAgent\b' \
  'spCreateAIAgentAction\b|INSERT INTO \[?__mj\]?\.\[?AIAgentAction\]?' \
  'spCreateAction\b|INSERT INTO \[?__mj\]?\.\[?Action\]?\s*$|INSERT INTO \[?__mj\]?\.\[?Action\]?\s*\(' || rc=1

# PostgreSQL: agent via INSERT INTO __mj."AIAgent" (closing quote excludes "AIAgentAction");
# links via INSERT INTO __mj."AIAgentAction"; actions via INSERT INTO __mj."Action" (excludes "ActionParam" etc.).
check_dir migrations-pg "PostgreSQL" \
  'INSERT INTO __mj\."AIAgent"' \
  'INSERT INTO __mj\."AIAgentAction"' \
  'INSERT INTO __mj\."Action"' || rc=1

exit $rc
