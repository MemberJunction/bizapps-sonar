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

echo "::notice::Seed agent tool-surface OK ($LINKS AIAgentAction seeding statement(s) found)."
