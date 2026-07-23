#!/bin/bash
# Validates, for BOTH dialects (migrations/ = SQL Server, migrations-pg/ = PostgreSQL),
# that any AI agent the migrations create also gets at least one tool (AIAgentAction)
# link, AND that the links are seeded after the Actions they FK-reference.
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
# Static only: greps the migration SQL, no database. Not a substitute for a real
# clean-install smoke test on each dialect — it's a fast approximation of one.

# check_dir DIR LABEL AGENT_RE LINK_RE ACTION_RE  -> 0 ok / 1 fail
check_dir() {
  local dir="$1" label="$2" agent_re="$3" link_re="$4" action_re="$5"
  local files stream links last_action first_link
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
  last_action=$(printf '%s\n' "$stream" | grep -nE "$action_re" | tail -1 | cut -d: -f1)
  first_link=$(printf '%s\n' "$stream" | grep -nE "$link_re" | head -1 | cut -d: -f1)
  if [ -n "$last_action" ] && [ -n "$first_link" ] && [ "$first_link" -lt "$last_action" ]; then
    echo "::error::[$label] AIAgentAction links (stream line $first_link) are seeded before the Actions they reference (last action at stream line $last_action). On a clean install the FK-referenced Action rows don't exist yet => the seed aborts on a FK violation. Seed the links after the actions (same migration, later in the file) or in a later forward migration. See #27."
    return 1
  fi
  echo "::notice::[$label] agent tool-surface OK ($links link stmt(s); ordering OK: first link stream line ${first_link:-n/a} after last action stream line ${last_action:-n/a})."
  return 0
}

rc=0

# SQL Server (T-SQL): agent via spCreateAIAgent (\b excludes ...Action/...Prompt);
# links via spCreateAIAgentAction or INSERT INTO [__mj].[AIAgentAction]; actions via spCreateAction.
check_dir migrations "SQL Server" \
  'spCreateAIAgent\b' \
  'spCreateAIAgentAction\b|INSERT INTO \[?__mj\]?\.\[?AIAgentAction\]?' \
  'spCreateAction\b' || rc=1

# PostgreSQL: agent via INSERT INTO __mj."AIAgent" (closing quote excludes "AIAgentAction");
# links via INSERT INTO __mj."AIAgentAction"; actions via INSERT INTO __mj."Action" (excludes "ActionParam" etc.).
check_dir migrations-pg "PostgreSQL" \
  'INSERT INTO __mj\."AIAgent"' \
  'INSERT INTO __mj\."AIAgentAction"' \
  'INSERT INTO __mj\."Action"' || rc=1

exit $rc
