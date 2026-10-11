#!/bin/bash
# Validates that nothing the app manifest puts in the BROWSER can reach server-only code.
#
# This has bitten twice:
#
#   1. sonar-actions was listed under `shared`, so `mj app install` wired it into the client's
#      dynamicPackages. Bundled for the browser it pulled @memberjunction/ai-agents -> storage ->
#      Node built-ins, and the Explorer build died on `Could not resolve "stream"`.
#   2. sonar-ng was given a dependency on sonar-engine to share one pure function. sonar-engine is
#      server-only (it peer-depends on @memberjunction/sqlserver-dataprovider) and has NO client or
#      shared role in the manifest, so a fresh install had no instruction to place it on the client
#      at all. The monorepo build still passed, which is exactly what made it easy to miss.
#
# Both are the same mistake: the browser side of the manifest reaching something built for the
# server. Widening a server package's audience is never the fix. In order of preference:
#
#   1. Compute it on the server and send the ANSWER as data. This is what "Sonar: Explain Scores"
#      does for the reason a member is low — the browser gets a label, not the maths. Prefer this
#      whenever the logic is domain logic rather than presentation, because then there is exactly one
#      implementation and it is the one the engine already acts on.
#   2. If the browser genuinely must compute it, move the logic into a package with no dependencies
#      and no MJ peers, and declare that package `shared` in the manifest.
#
# Usage: validate-client-package-boundary.sh [repo-root]   (defaults to the git toplevel; the selftest
# points it at fixture roots).
#
# Two rules, checked against mj-app.json:
#   A. Every @mj-biz-apps/* dependency of a client or shared package must ITSELF be declared in the
#      manifest under client or shared. (Catches #2.)
#      A first-party package the manifest does not list at all (sonar-engine,
#      sonar-core-entities-server) is published but has no client role, so it counts as SERVER-ONLY.
#   B. No client or shared package may depend on — or peer-depend on — a server-only MJ package.
#      (Catches #1.)

# No `-e`: violations are counted and reported together rather than stopping at the first. That
# makes every jq call a place a failure could be read as an empty answer ("no dependencies", "no
# packages"), which is a green gate over a file it never read — so every jq goes through read_json,
# which stops the script and names the file.
set -uo pipefail

ROOT="${1:-$(git rev-parse --show-toplevel)}" || exit 1
if [ ! -d "$ROOT" ]; then
  echo "::error::repo root '$ROOT' is not a directory."
  exit 1
fi
cd "$ROOT" || exit 1
MANIFEST="mj-app.json"
ERRORS=0

# MJ packages that drag Node built-ins in behind them. Not exhaustive; it is the set that has
# actually broken a browser bundle here, plus the obvious data-access ones.
SERVER_ONLY=(
  "@memberjunction/sqlserver-dataprovider"
  "@memberjunction/actions"
  "@memberjunction/ai-agents"
  "@memberjunction/ai-prompts"
  "@memberjunction/aiengine"
  "@memberjunction/storage"
  "@memberjunction/server"
)

if [ ! -f "$MANIFEST" ]; then
  echo "::error::$MANIFEST not found — run this from the repo root."
  exit 1
fi

# jq FILE FILTER, or stop the whole gate naming FILE. Called inside $(...), where `exit` leaves only
# the subshell, so every caller adds `|| exit 1`.
read_json() {
  local file="$1" filter="$2" out
  if ! out=$(jq -r "$filter" "$file" 2>&1); then
    echo "::error file=$file::could not parse $file with jq ($out). A malformed manifest must fail this gate, not read as having no dependencies." >&2
    exit 1
  fi
  printf '%s\n' "$out"
}

# Package names the manifest exposes to the browser. `shared` counts: it is installed on both sides.
BROWSER_PKGS=$(read_json "$MANIFEST" '[.packages.client // [], .packages.shared // []] | flatten | .[].name') || exit 1
SERVER_PKGS=$(read_json "$MANIFEST" '(.packages.server // [])[].name') || exit 1

if [ -z "$BROWSER_PKGS" ]; then
  echo "::error::$MANIFEST declares no client or shared packages — nothing to check, which is itself suspicious."
  exit 1
fi

echo "Manifest exposes these packages to the browser:"
echo "$BROWSER_PKGS" | sed 's/^/  /'
echo ""

# Map a package name to its package.json under packages/*. Parses every candidate, so a malformed
# one fails the gate here rather than silently failing to match any name.
pkg_json_for() {
  local want="$1" f name
  while IFS= read -r f; do
    name=$(read_json "$f" '.name // ""') || exit 1
    if [ "$name" = "$want" ]; then echo "$f"; fi
  done < <(find packages -maxdepth 2 -name package.json -not -path "*/node_modules/*" -not -path "*/dist/*")
}

is_browser_pkg() { echo "$BROWSER_PKGS" | grep -qxF "$1"; }
is_server_pkg()  { echo "$SERVER_PKGS"  | grep -qxF "$1"; }

check_pkg() {
  local pkg_name="$1"
  local pkg_json
  pkg_json=$(pkg_json_for "$pkg_name") || exit 1
  if [ -z "$pkg_json" ]; then
    # A package the manifest puts in the browser but this repo cannot find would be skipped silently,
    # which reads as "clean". Fail instead.
    echo "::error::$pkg_name is listed under client or shared in $MANIFEST but no package.json under packages/ declares that name, so its dependencies cannot be checked."
    ERRORS=$((ERRORS + 1))
    return 0
  fi

  # Rule B: no server-only MJ package in dependencies OR peerDependencies.
  local all_mj_deps
  all_mj_deps=$(read_json "$pkg_json" '((.dependencies // {}) + (.peerDependencies // {})) | keys[]') || exit 1
  for server_only in "${SERVER_ONLY[@]}"; do
    if echo "$all_mj_deps" | grep -qxF "$server_only"; then
      echo "::error file=$pkg_json::$pkg_name is exposed to the browser by $MANIFEST but depends on the server-only package $server_only. Bundling it will pull Node built-ins. Compute this on the server and send the result as data (see the Sonar: Explain Scores action), or move the shared logic into a dependency-free package declared shared in the manifest. Do not ship this package to the client."
      ERRORS=$((ERRORS + 1))
    fi
  done

  # Rule A: every first-party dependency must also be browser-side in the manifest.
  local own_deps
  own_deps=$(read_json "$pkg_json" '(.dependencies // {}) | keys[] | select(startswith("@mj-biz-apps/"))') || exit 1
  for dep in $own_deps; do
    if is_browser_pkg "$dep"; then
      continue
    fi
    if is_server_pkg "$dep"; then
      echo "::error file=$pkg_json::$pkg_name is exposed to the browser but depends on $dep, which $MANIFEST declares as a SERVER package. Server code cannot be reached from the client."
    else
      echo "::error file=$pkg_json::$pkg_name is exposed to the browser but depends on $dep, which $MANIFEST does not declare under client or shared. It is treated as server-only (e.g. sonar-engine, sonar-core-entities-server). A fresh 'mj app install' would have no instruction to place $dep on the client, so it would fail to resolve there even though the monorepo build passes."
    fi
    ERRORS=$((ERRORS + 1))
  done
}

# Walk the browser-exposed packages, plus their first-party deps (which Rule A forces to be
# browser-side too, so the walk stays inside the browser set).
CHECKED=""
QUEUE="$BROWSER_PKGS"
while [ -n "$QUEUE" ]; do
  NEXT=""
  for pkg in $QUEUE; do
    case " $CHECKED " in *" $pkg "*) continue ;; esac
    CHECKED="$CHECKED $pkg"
    check_pkg "$pkg"
    pkg_json=$(pkg_json_for "$pkg") || exit 1
    if [ -n "$pkg_json" ]; then
      deps=$(read_json "$pkg_json" '(.dependencies // {}) | keys[] | select(startswith("@mj-biz-apps/"))') || exit 1
      NEXT="$NEXT $(tr '\n' ' ' <<< "$deps")"
    fi
  done
  QUEUE="$NEXT"
done

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "Found $ERRORS client/server boundary violation(s)."
  exit 1
fi

echo "OK: nothing exposed to the browser reaches server-only code."
