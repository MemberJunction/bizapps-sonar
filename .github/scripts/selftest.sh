#!/bin/bash
# Self-test for the CI validator scripts. A validator nobody has seen fail is indistinguishable
# from one that exits 0 unconditionally, and these scripts gate every migration-bearing PR.
#
#   1. bash -n every script (syntax — catches a broken edit before it silently green-lights PRs)
#   2. validate-migration-filenames.sh accepts a known-good fixture and rejects a known-bad one,
#      for both the SQL Server (`.sql`) and PostgreSQL (`.pg.sql`) shapes (it takes the dir as $1)
#   3. validate-seed-agent-tools.sh passes against the real repository (its dirs are fixed)
#   4. validate-client-package-boundary.sh accepts a clean fixture, rejects each class of violation
#      (and a malformed package.json) with that violation's own message, and passes on the real
#      repository (it takes the repo root as $1)
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
FAIL=0

for f in "$HERE"/*.sh; do
  if ! bash -n "$f"; then echo "✗ syntax: $f"; FAIL=1; else echo "✓ syntax: $(basename "$f")"; fi
done

if "$HERE/validate-migration-filenames.sh" "$HERE/__fixtures__/ok" >/dev/null 2>&1; then
  echo "✓ filenames validator accepts the good fixture"
else
  echo "✗ filenames validator rejected the good fixture"; FAIL=1
fi
if "$HERE/validate-migration-filenames.sh" "$HERE/__fixtures__/bad-filename" >/dev/null 2>&1; then
  echo "✗ filenames validator ACCEPTED the bad fixture — the gate does not fire"; FAIL=1
else
  echo "✓ filenames validator rejects the bad fixture"
fi
# The same validator guards migrations-pg/ (changes.yml, publish.yml), whose files end in `.pg.sql`.
# A PG-only PR is a normal shape, so the suffix must neither trip the good case nor hide the bad one.
if "$HERE/validate-migration-filenames.sh" "$HERE/__fixtures__/pg-ok" >/dev/null 2>&1; then
  echo "✓ filenames validator accepts the good PostgreSQL fixture"
else
  echo "✗ filenames validator rejected the good PostgreSQL fixture"; FAIL=1
fi
if "$HERE/validate-migration-filenames.sh" "$HERE/__fixtures__/pg-bad" >/dev/null 2>&1; then
  echo "✗ filenames validator ACCEPTED the bad PostgreSQL fixture — the gate does not fire"; FAIL=1
else
  echo "✓ filenames validator rejects the bad PostgreSQL fixture"
fi
# A mistyped directory argument used to validate zero files and pass, which is a green gate that
# never looked at anything.
if "$HERE/validate-migration-filenames.sh" "$HERE/__fixtures__/does-not-exist" >/dev/null 2>&1; then
  echo "✗ filenames validator ACCEPTED a missing directory — a typo'd path passes silently"; FAIL=1
else
  echo "✓ filenames validator rejects a missing directory"
fi

if "$HERE/validate-seed-agent-tools.sh" >/dev/null 2>&1; then
  echo "✓ seed-agent-tools validator passes on the repository"
else
  echo "✗ seed-agent-tools validator fails on the repository"; FAIL=1
fi

BOUNDARY="$HERE/validate-client-package-boundary.sh"
if "$BOUNDARY" "$HERE/__fixtures__/boundary-ok" >/dev/null 2>&1; then
  echo "✓ boundary gate accepts the clean fixture"
else
  echo "✗ boundary gate rejected the clean fixture"; FAIL=1
fi
# Each fixture is a distinct way to break the browser/server split; all must fail, and each must
# fail FOR ITS OWN REASON. A bare non-zero exit would also be satisfied by a crash, or by an unrelated
# rule firing, and then the rule the fixture exists for could stop working unnoticed.
#   boundary-malformed: a package.json jq cannot parse must be named as such, not read as "no deps"
#   (or as "no package declares that name", which hides the real problem).
expect_boundary_reject() {
  local bad="$1" want="$2" out
  if out=$("$BOUNDARY" "$HERE/__fixtures__/$bad" 2>&1); then
    echo "✗ boundary gate ACCEPTED $bad — the gate does not fire"; FAIL=1
  elif ! grep -qF -- "$want" <<< "$out"; then
    echo "✗ boundary gate rejected $bad, but not with: $want"; FAIL=1
  else
    echo "✓ boundary gate rejects $bad ($want)"
  fi
}
expect_boundary_reject boundary-unlisted-engine 'depends on @mj-biz-apps/sonar-engine, which mj-app.json does not declare under client or shared'
expect_boundary_reject boundary-listed-server 'depends on @mj-biz-apps/sonar-server, which mj-app.json declares as a SERVER package'
expect_boundary_reject boundary-shared-server-mj 'depends on the server-only package @memberjunction/storage'
expect_boundary_reject boundary-malformed 'could not parse packages/ng/package.json'

if "$BOUNDARY" "$(cd "$HERE/../.." && pwd)" >/dev/null 2>&1; then
  echo "✓ boundary gate passes on the repository"
else
  echo "✗ boundary gate fails on the repository"; FAIL=1
fi

exit $FAIL
