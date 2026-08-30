#!/bin/bash
# Self-test for the CI validator scripts. A validator nobody has seen fail is indistinguishable
# from one that exits 0 unconditionally, and these scripts gate every migration-bearing PR.
#
#   1. bash -n every script (syntax — catches a broken edit before it silently green-lights PRs)
#   2. validate-migration-filenames.sh accepts a known-good fixture and rejects a known-bad one
#      (it already takes the migrations dir as $1)
#   3. validate-seed-agent-tools.sh passes against the real repository (its dirs are fixed)
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

if "$HERE/validate-seed-agent-tools.sh" >/dev/null 2>&1; then
  echo "✓ seed-agent-tools validator passes on the repository"
else
  echo "✗ seed-agent-tools validator fails on the repository"; FAIL=1
fi

exit $FAIL
