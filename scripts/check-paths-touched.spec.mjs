import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync, execFileSync } from 'node:child_process';
import os from 'node:os';
import { pathsTouched, resolveDecision, formatOutput } from './check-paths-touched.mjs';

const ZERO = '0'.repeat(40);

test('a trailing slash matches by prefix', () => {
    assert.equal(pathsTouched({ changed: ['packages/Angular/src/a.ts'], patterns: ['packages/'] }), true);
});

test('a prefix pattern does not match a sibling with the same first letters', () => {
    assert.equal(pathsTouched({ changed: ['packages-old/a.ts'], patterns: ['packages/'] }), false);
});

test('a pattern without a trailing slash must match exactly', () => {
    assert.equal(pathsTouched({ changed: ['turbo.json'], patterns: ['turbo.json'] }), true);
    assert.equal(pathsTouched({ changed: ['a/turbo.json'], patterns: ['turbo.json'] }), false);
});

test('an exact pattern does not match a path that merely starts with it', () => {
    assert.equal(pathsTouched({ changed: ['package.json.bak'], patterns: ['package.json'] }), false);
});

test('any one matching path is enough', () => {
    assert.equal(pathsTouched({ changed: ['README.md', 'apps/MJAPI/x.mjs'], patterns: ['packages/', 'apps/'] }), true);
});

test('no changed paths means nothing was touched', () => {
    assert.equal(pathsTouched({ changed: [], patterns: ['packages/'] }), false);
});

// The asymmetry that matters: a wrong "false" skips the job, and a skipped job reports SUCCESS.
test('an unreadable diff fails open', () => {
    assert.equal(resolveDecision({ baseSha: 'a1', headSha: 'b2', changedOrNull: null, patterns: ['packages/'] }), true);
});

test('an all-zeroes base sha fails open', () => {
    assert.equal(resolveDecision({ baseSha: ZERO, headSha: 'b2', changedOrNull: [], patterns: ['packages/'] }), true);
});

test('a missing base sha fails open', () => {
    assert.equal(resolveDecision({ baseSha: '', headSha: 'b2', changedOrNull: [], patterns: ['packages/'] }), true);
});

test('a missing head sha fails open', () => {
    assert.equal(resolveDecision({ baseSha: 'a1', headSha: '', changedOrNull: [], patterns: ['packages/'] }), true);
});

test('an all-zeroes head sha fails open', () => {
    assert.equal(resolveDecision({ baseSha: 'a1', headSha: ZERO, changedOrNull: [], patterns: ['packages/'] }), true);
});

test('a readable diff that misses every pattern is the one case that returns false', () => {
    assert.equal(resolveDecision({ baseSha: 'a1', headSha: 'b2', changedOrNull: ['README.md'], patterns: ['packages/'] }), false);
});

test('a readable diff that hits a pattern returns true', () => {
    assert.equal(resolveDecision({ baseSha: 'a1', headSha: 'b2', changedOrNull: ['packages/x.ts'], patterns: ['packages/'] }), true);
});

test('no patterns at all fails open rather than skipping everything', () => {
    assert.equal(resolveDecision({ baseSha: 'a1', headSha: 'b2', changedOrNull: ['README.md'], patterns: [] }), true);
});

test('the CLI output is a GITHUB_OUTPUT line', () => {
    assert.equal(formatOutput(true), 'relevant=true\n');
    assert.equal(formatOutput(false), 'relevant=false\n');
});

// ── build.yml's scope list is only as good as what is IN it ─────────────────────────────────────
// Everything above pins the decider's logic. This pins the list it is asked to decide over, which
// is the half that actually skips the job. The two are not the same failure: a perfect decider fed
// a short list still answers "no" to a relevant diff, and `build-only` then reports `skipped`,
// which a required status check treats as PASSING — a green required check over a build that never
// ran (bizapps-forms #173). Ported from Forms' spec; the entries and their reasons are Sonar's own.
//
// Root-level build inputs are the ones a `packages/`-shaped prefix can never reach, so they have to
// be named. Each is here because changing it can change the outcome of the install, the build or a
// gate that build.yml runs.

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BUILD_YML = path.join(HERE, '..', '.github', 'workflows', 'build.yml');

/** The argument list build.yml actually passes to this script, read from the workflow itself. */
function scopeListFromWorkflow() {
    const yml = readFileSync(BUILD_YML, 'utf8');
    const start = yml.indexOf('check-paths-touched.mjs "$BASE_SHA" "$HEAD_SHA"');
    assert.notEqual(start, -1, 'build.yml no longer invokes check-paths-touched.mjs as expected');
    const end = yml.indexOf('>>', start);
    assert.notEqual(end, -1, 'could not find the end of the check-paths-touched.mjs invocation');
    return yml
        .slice(yml.indexOf('\\', start) + 1, end)
        .split('\n')
        .map((line) => line.replace(/\\\s*$/, '').trim())
        .filter(Boolean);
}

// build.yml says "check-paths-touched.spec.mjs pins each of these". That has to be true of EVERY
// entry, not just the root files.
const EXPECTED_SCOPE = {
    'pnpm-lock.yaml': 'the resolved dependency graph',
    'pnpm-workspace.yaml': 'workspace members; pnpm install --frozen-lockfile reads it',
    '.npmrc': 'install-time settings and the registry; decides what installs at all',
    'turbo.json': 'the task graph and cache keys',
    'package.json': 'the scripts build-only runs',
    'tsconfig.angular.json': 'extends target of packages/Angular',
    'tsconfig.server.json': 'extends target of the five server-side packages',
    'packages/': 'the product code and every Vitest suite',
    'scripts/': 'the gate scripts and their specs, all run in build-only',
    'migrations/': 'check:pg-parity reads it to require a PostgreSQL twin for every migration',
    'migrations-pg/': 'check:pg-parity validates what a PostgreSQL host runs verbatim',
    'migrations-teardown/': 'check:teardown-tolerance checks SQL Server teardown against the MJ floor (issue #56)',
    'migrations-teardown-pg/': 'check:teardown-tolerance checks PostgreSQL teardown against the MJ floor (issue #56)',
    '.github/': 'the boundary gate, the validator self-test, and every workflow check-release-pushes reads',
    'ci/': 'the push scripts are gone (bizapps-forms #177); ci/ still holds the teardown generators and stays in scope, so a PR reintroducing a push script there must run the gate that forbids it',
    'mj-app.json': 'the client/server package boundary gate reads the manifest',
};

test('every entry build.yml relies on is pinned here, so shortening the list fails a required check', () => {
    assert.deepEqual(
        [...scopeListFromWorkflow()].sort(),
        Object.keys(EXPECTED_SCOPE).sort(),
        'build.yml\'s scope list and this spec have diverged — add the entry here with its reason, ' +
        'or explain the removal. A silently shortened list is a green required check over a skipped job.',
    );
});

// Each of these is a single changed path that must, on its own, run build-only.
const MUST_BUILD = {
    'tsconfig.angular.json': 'extends target of packages/Angular/tsconfig.json',
    'tsconfig.server.json': 'extends target of Actions, CoreEntitiesServer, Engine, Entities and Server',
    'pnpm-workspace.yaml': 'workspace members',
    '.npmrc': 'install settings',
    'pnpm-lock.yaml': 'the dependency graph',
    'package.json': 'the root scripts',
    'turbo.json': 'the task graph',
    'mj-app.json': 'the manifest the boundary gate reads',
    'migrations/V202610101200__v0.6.x_Example.sql': 'a SQL Server migration needs its PG twin checked',
    'migrations-pg/V202610101200__v0.6.x_Example.pg.sql': 'a PG-only PR (Review Focus 4) must run check:pg-parity',
    'migrations-teardown/02__Delete_Sonar_Rows.sql': 'a teardown-only PR must run check:teardown-tolerance',
    'migrations-teardown-pg/02__Delete_Sonar_Rows.sql': 'a PG teardown-only PR must run check:teardown-tolerance',
    '.github/workflows/publish.yml': 'check-release-pushes.mjs reads that very file (bizapps-forms #177)',
    '.github/scripts/validate-client-package-boundary.sh': 'a PR editing a gate must run the gate',
    'ci/commit_push.mjs': 'reintroducing a push script under ci/ must run the gate that forbids it',
};

for (const [file, why] of Object.entries(MUST_BUILD)) {
    test(`build-only runs when only ${file} changes (${why})`, () => {
        assert.equal(
            pathsTouched({ changed: [file], patterns: scopeListFromWorkflow() }),
            true,
            `${file} matters to build-only, but the scope list skips it — and a skipped job reports ` +
            'SUCCESS to a required status check.',
        );
    });
}

test('documentation-only root files still skip the job', () => {
    const scope = scopeListFromWorkflow();
    for (const doc of ['README.md', 'CLAUDE.md', 'INSTALL.md', 'LICENSE', 'plans/plan.md']) {
        assert.equal(pathsTouched({ changed: [doc], patterns: scope }), false, `${doc} should not force a build`);
    }
});

// The CLI against a throwaway local repository and two SHAs it has never seen: git refuses, the
// decision still fails open, and git's own refusal reaches stderr so a run that built "because the
// diff was unreadable" says WHY it was unreadable instead of looking like an ordinary relevant diff.
test('an unreadable diff fails open AND reports git\'s error on stderr', () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'paths-touched-'));
    try {
        execFileSync('git', ['init', '-q'], { cwd: dir });
        const script = fileURLToPath(new URL('./check-paths-touched.mjs', import.meta.url));
        const result = spawnSync(process.execPath, [script, 'a'.repeat(40), 'b'.repeat(40), 'packages/'], {
            cwd: dir,
            encoding: 'utf8',
        });
        assert.equal(result.status, 0, result.stderr);
        assert.equal(result.stdout, 'relevant=true\n');
        assert.match(result.stderr, /check-paths-touched/);
        assert.match(result.stderr, /git diff/);
        assert.match(result.stderr, /aaaaaaaa/, 'stderr names what was being diffed');
        assert.match(result.stderr, /fatal|bad|unknown/i, 'stderr carries git\'s own message');
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});
