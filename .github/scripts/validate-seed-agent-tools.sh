#!/bin/bash
# Validates that any AI agent created by the migrations also gets at least one
# tool (AIAgentAction) link, AND that the links are seeded after the Actions they
# FK-reference.
#
# Why: an MJ Loop agent's callable tools come from AIAgentAction rows. Zero of them
# => empty toolbox => every action reports "unavailable" (the #24 bug). And an
# AIAgentAction row seeded before the Action it references (AIAgentAction.ActionID
# -> Action) aborts a clean install on a FK violation (the #27 bug).
#
# Checks the migrations as one execution-ordered stream (files concatenated in
# Flyway version order), so it holds whether the links live in the seed itself or
# in a later forward migration (V202607202300 moved them out of the released seed
# to preserve migration immutability — see that file's header).
#
# Static only: greps the migration SQL, no database.

# Migrations in execution (version) order. Filenames are V<timestamp>__..., which
# sort lexicographically the same as Flyway orders them.
FILES=$(ls migrations/V*.sql 2>/dev/null | sort)
if [ -z "$FILES" ]; then
  echo "::notice::No versioned migrations found; nothing to check."
  exit 0
fi

# Concatenate in order; grep -n then yields GLOBAL line numbers across the stream,
# so cross-file ordering (later file => later line) is handled for free.
STREAM=$(cat $FILES)

if ! printf '%s\n' "$STREAM" | grep -qE 'spCreateAIAgent\b'; then
  echo "::notice::Migrations create no AI agent; skipping agent tool-surface check."
  exit 0
fi

LINK_RE='spCreateAIAgentAction\b|INSERT INTO \[?__mj\]?\.\[?AIAgentAction\]?'
LINKS=$(printf '%s\n' "$STREAM" | grep -icE "$LINK_RE")

if [ "$LINKS" -eq 0 ]; then
  echo "::error::Migrations create an AI agent but seed no AIAgentAction tool links anywhere. A Loop agent with zero tools reports every action as 'unavailable'. Likely cause: metadata/agents/.mj-sync.json dropped 'MJ: AI Agent Actions' from pull.relatedEntities — add it back, re-pull, and regenerate the seed. See PR #24."
  exit 1
fi

LAST_ACTION=$(printf '%s\n' "$STREAM" | grep -nE 'spCreateAction\b' | tail -1 | cut -d: -f1)
FIRST_LINK=$(printf '%s\n' "$STREAM" | grep -nE "$LINK_RE" | head -1 | cut -d: -f1)
if [ -n "$LAST_ACTION" ] && [ -n "$FIRST_LINK" ] && [ "$FIRST_LINK" -lt "$LAST_ACTION" ]; then
  echo "::error::AIAgentAction links (stream line $FIRST_LINK) are seeded before the Actions they reference (last spCreateAction at stream line $LAST_ACTION). On a clean install the FK-referenced Action rows don't exist yet, so the seed aborts on a FK violation. Seed the links in the same migration after the actions, or in a later forward migration. See PR #27."
  exit 1
fi

echo "::notice::Agent tool-surface OK ($LINKS link statement(s); ordering OK: first link stream line ${FIRST_LINK:-n/a} after last action stream line ${LAST_ACTION:-n/a})."
