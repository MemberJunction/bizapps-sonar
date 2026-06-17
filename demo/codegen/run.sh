#!/usr/bin/env bash
# Reproducible sandbox CodeGen — registers the `membership` demo tables as MJ entities in
# Sonar_Demo with NO repo churn. Run via `npm run mj:codegen:demo`.
#
# How it stays sandboxed:
#   - loads the root .env (DB creds) + demo/demo.env overlay (DB_DATABASE=Sonar_Demo)
#   - runs from demo/codegen so MJ's cosmiconfig picks up demo/codegen/mj.config.cjs
#     (commands disabled, SQLOutput disabled) instead of the root mj.config.cjs
#   - --skipfiles → DB-side registration only; never writes TS/Angular/GraphQL/manifest
set -eo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

set -a
. "$ROOT/.env"
. "$ROOT/demo/demo.env"   # overrides DB_DATABASE → Sonar_Demo
set +a

echo "CodeGen (--skipfiles) against DB_DATABASE=$DB_DATABASE using demo/codegen/mj.config.cjs"
cd "$SCRIPT_DIR"
npx mj codegen --skipfiles
