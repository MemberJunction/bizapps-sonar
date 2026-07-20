#!/bin/bash
# Validates that any AI agent seeded by the metadata migration also gets at least
# one tool (AIAgentAction) link.
#
# Why: an MJ Loop agent's callable tools come from AIAgentAction rows. An agent
# with zero of them builds an empty toolbox and reports every action as
# "unavailable". That exact bug shipped once (the Sonar Authoring Agent, fixed in
# PR #24) because metadata/agents/.mj-sync.json dropped "MJ: AI Agent Actions"
# from pull.relatedEntities, so the capture — and the generated seed — silently
# lost the links. This static check turns that regression red at PR time.
#
# Static only: greps the seed SQL, no database.

SEED=$(find migrations -name 'V*Seed_App_Metadata*.sql' -type f 2>/dev/null | head -1)

if [ -z "$SEED" ]; then
  echo "::notice::No seed metadata migration found; nothing to check."
  exit 0
fi

# Does the seed create any AI agent at all?
if ! grep -qE 'spCreateAIAgent\b' "$SEED"; then
  echo "::notice::Seed creates no AI agent; skipping agent tool-surface check."
  exit 0
fi

# It seeds an agent -> require at least one agent tool link, in either form the
# generator can emit: a spCreateAIAgentAction call, or an AIAgentAction INSERT.
LINKS=$(grep -icE 'spCreateAIAgentAction\b|INSERT INTO \[?__mj\]?\.\[?AIAgentAction\]?' "$SEED")

if [ "$LINKS" -eq 0 ]; then
  echo "::error::$(basename "$SEED") seeds an AI agent but no AIAgentAction tool links. A Loop agent with zero tools reports every action as 'unavailable'. Likely cause: metadata/agents/.mj-sync.json dropped 'MJ: AI Agent Actions' from pull.relatedEntities — add it back, re-pull, and regenerate the seed. See PR #24."
  exit 1
fi

# Links must be emitted AFTER the Sonar Actions they FK-reference (AIAgentAction.ActionID
# -> Action). On a clean install the seed runs top-to-bottom; if a link block precedes the
# spCreateAction calls, the referenced Action rows don't exist yet and the seed aborts on a
# FK violation. Invisible on a populated dev DB (actions already present). See PR #27.
LAST_ACTION=$(grep -nE 'spCreateAction\b' "$SEED" | tail -1 | cut -d: -f1)
FIRST_LINK=$(grep -nE 'spCreateAIAgentAction\b|INSERT INTO \[?__mj\]?\.\[?AIAgentAction\]?' "$SEED" | head -1 | cut -d: -f1)
if [ -n "$LAST_ACTION" ] && [ -n "$FIRST_LINK" ] && [ "$FIRST_LINK" -lt "$LAST_ACTION" ]; then
  echo "::error::AIAgentAction links (first at line $FIRST_LINK) are emitted before the Actions they reference (last spCreateAction at line $LAST_ACTION). On a clean install the FK-referenced Action rows don't exist yet, so the seed aborts on a FK violation. Move the link block after all spCreateAction calls (end of the seed is safe). See PR #27."
  exit 1
fi

echo "::notice::Seed agent tool-surface OK ($LINKS link statement(s); ordering OK: first link line ${FIRST_LINK:-n/a} after last action line ${LAST_ACTION:-n/a})."
