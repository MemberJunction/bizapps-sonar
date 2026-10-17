import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { PROTECTED_BRANCHES, SCANNED_DIRS, EXCLUDED_FILES, findProtectedPushes, runCheck } from './check-release-pushes.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(HERE, '..');

// ── What the gate must catch ────────────────────────────────────────────────────────────────────

test('a shell push to main is a violation', () => {
    const found = findProtectedPushes('git push origin HEAD:main\n');
    assert.equal(found.length, 1);
    assert.equal(found[0].ref, 'main');
});

test('a shell push to next is a violation', () => {
    assert.equal(findProtectedPushes('git push origin HEAD:next\n').length, 1);
});

test('a bare branch push is a violation', () => {
    assert.equal(findProtectedPushes('git push origin main\n').length, 1);
});

test('a fully-qualified ref is a violation', () => {
    assert.equal(findProtectedPushes('git push origin HEAD:refs/heads/next\n').length, 1);
});

test('a force push is still a push', () => {
    assert.equal(findProtectedPushes('git push --force origin HEAD:main\n').length, 1);
});

// This is the exact shape of Sonar's former ci/commit_push.mjs, run from a workflow step.
test('a workflow step that pushes HEAD:main is rejected', () => {
    const workflow = [
        'jobs:',
        '  publish:',
        '    steps:',
        '      - name: Push the version bump',
        '        run: |',
        '          git commit -am "chore: bump"',
        '          git push origin HEAD:main',
        '',
    ].join('\n');
    const root = fixtureRoot({ '.github/workflows/publish.yml': workflow });
    const violations = runCheck(root);
    assert.equal(violations.length, 1);
    assert.match(violations[0], /publish\.yml:7/);
});

test('release branches, back-merge branches and the app-push remote are allowed', () => {
    assert.deepEqual(findProtectedPushes('git push app-push "HEAD:refs/heads/release/v1.2.3"\n'), []);
    assert.deepEqual(findProtectedPushes('git push app-push HEAD:chore/backmerge-v1.2.3\n'), []);
    assert.deepEqual(findProtectedPushes('git push origin "refs/tags/v$VERSION"\n'), []);
});

// simple-git spells the same operation as a method call, which is how both of bizapps-forms #177's
// pushes were written. A gate that only reads shell would have seen neither.
test('the simple-git form is a violation', () => {
    assert.equal(findProtectedPushes("await git.push('origin', 'HEAD:main');\n").length, 1);
});

test('the simple-git form with double quotes is a violation', () => {
    assert.equal(findProtectedPushes('await git.push("origin", "HEAD:next");\n').length, 1);
});

test('the reported line number is the offending line', () => {
    const found = findProtectedPushes('a\nb\ngit push origin HEAD:main\n');
    assert.equal(found[0].line, 3);
});

// ── Spellings a reintroduced push would plausibly take ──────────────────────────────────────────
//
// Each of these was a MISS until bizapps-forms #187's review. They are not hypotheticals: the sibling gate in
// bizapps-forms, .claude/hooks/require-green-before-git.mjs, records the same two under-inclusiveness
// bugs in its own docstring — git GLOBAL OPTIONS between `git` and the subcommand are "otherwise a
// straight bypass", and `&&`, `;`, `|` and newlines "all count as command starts". This gate was
// written after that lesson and had inherited neither.

test('a git global option between `git` and `push` does not hide the push', () => {
    // `git -c user.email=… push` is ordinary CI, and this very workflow already runs a separate
    // `git config --global user.email` step that an author could fold into the push.
    assert.equal(findProtectedPushes('git -c user.email=x@y push origin main\n').length, 1);
    assert.equal(findProtectedPushes('git -C . push origin main\n').length, 1);
    assert.equal(findProtectedPushes('git --git-dir=.git push origin HEAD:next\n').length, 1);
    assert.equal(findProtectedPushes('git --no-pager push origin HEAD:main\n').length, 1);
});

test('a push that is not the first command on its line is still a push', () => {
    // The likeliest reintroduction shape of all: BOTH of bizapps-forms #177's pushes lived in Node scripts, and
    // Sonar's deleted ci/merge_main_and_update_lock.mjs already shelled out through execSync.
    assert.equal(findProtectedPushes("execSync('git push origin HEAD:main')\n").length, 1);
    assert.equal(findProtectedPushes('git checkout next && git push origin next\n').length, 1);
    assert.equal(findProtectedPushes('git config user.name x; git push origin main\n').length, 1);
    assert.equal(findProtectedPushes('if [ -n "$V" ]; then git push origin main; fi\n').length, 1);
});

test('a quoted refspec is a push, with or without a colon in it', () => {
    // `git push origin "HEAD:main"` already matched, but only by accident: the optional `(?:\S*:)?`
    // group absorbed the opening quote on its way to the colon. A BARE branch name has no colon, so
    // that group matches empty and the quote lands where the branch name has to start. The colon
    // form working is what hid the bare form failing.
    //
    // This is the house style in the very file the gate guards: the one surviving push is written
    // `git push origin "refs/tags/v$VERSION"` (.github/workflows/publish.yml), so a reintroduced
    // branch push copied from the line above it is quoted too.
    assert.equal(findProtectedPushes('git push origin "main"\n').length, 1);
    assert.equal(findProtectedPushes("git push -u origin 'next'\n").length, 1);
    assert.equal(findProtectedPushes('git push origin `next`\n').length, 1);
    assert.equal(findProtectedPushes('git push origin "refs/heads/main"\n').length, 1);
    assert.equal(findProtectedPushes('git push origin refs/heads/"main"\n').length, 1);
});

test('the force-push refspec shorthand is a push', () => {
    // `+main` is the ordinary spelling of a force push to a branch.
    assert.equal(findProtectedPushes('git push origin +main\n').length, 1);
    assert.equal(findProtectedPushes('git push origin "+next"\n').length, 1);
});

test("simple-git's array refspec form is a violation", () => {
    assert.equal(findProtectedPushes("await git.push(['origin', 'HEAD:main']);\n").length, 1);
});

test('a push spelled with a capital G still invokes git on a case-insensitive volume', () => {
    // Same bug class block-generated-edits.mjs's header records being bitten by. macOS and Windows
    // both mount case-insensitively, so `Git push` really does run git here.
    assert.equal(findProtectedPushes('Git push origin HEAD:main\n').length, 1);
});

// ── Allow-cases: what stops "deny everything" from passing as a fix ─────────────────────────────

test('pushing a tag is allowed — the ruleset is target: branch', () => {
    assert.deepEqual(findProtectedPushes('git push origin refs/tags/v1.2.3\n'), []);
    assert.deepEqual(findProtectedPushes("await git.push('origin', `refs/tags/${version}`);\n"), []);
});

test('pushing an unprotected branch is allowed', () => {
    assert.deepEqual(findProtectedPushes('git push origin HEAD:chore/backmerge-v1.2.3\n'), []);
});

test('a branch whose name merely starts with a protected name is allowed', () => {
    assert.deepEqual(findProtectedPushes('git push origin HEAD:mainline\n'), []);
    assert.deepEqual(findProtectedPushes('git push origin HEAD:next-steps\n'), []);
});

test('prose mentioning the push is not a violation', () => {
    assert.deepEqual(findProtectedPushes('# the pipeline used to git push origin HEAD:main here\n'), []);
    assert.deepEqual(findProtectedPushes('  // git push origin HEAD:next was removed in bizapps-forms #177\n'), []);
});

test('fetching or merging a protected branch is allowed', () => {
    assert.deepEqual(findProtectedPushes("await git.fetch('origin', 'main');\n"), []);
    assert.deepEqual(findProtectedPushes('git merge --ff-only origin/next\n'), []);
});

test('a remote positional is a remote, not a branch — `git push main` pushes to a remote named main', () => {
    // `git push [<repository> [<refspec>…]]`: the first positional is the REPOSITORY. Pinned so a
    // future widening cannot start flagging it, which would be a false positive on every repo that
    // happens to have a remote called `main`.
    assert.deepEqual(findProtectedPushes('git push main\n'), []);
    assert.deepEqual(findProtectedPushes('git push\n'), []);
});

test('prose is still excluded once the command no longer has to start the line', () => {
    assert.deepEqual(findProtectedPushes('  # we used to run: git checkout next && git push origin next\n'), []);
    assert.deepEqual(findProtectedPushes(' * history: execSync("git push origin HEAD:main") lived here\n'), []);
    assert.deepEqual(findProtectedPushes('<!-- git push origin main -->\n'), []);
});

test('quoting does not make a non-protected target protected', () => {
    assert.deepEqual(findProtectedPushes('git push origin "mainline"\n'), []);
    assert.deepEqual(findProtectedPushes("git push origin 'next-steps'\n"), []);
    assert.deepEqual(findProtectedPushes('git push origin "refs/tags/v1.2.3"\n'), []);
    assert.deepEqual(findProtectedPushes('git push origin "+refs/tags/v1.2.3"\n'), []);
});

// ── Where the gate looks ────────────────────────────────────────────────────────────────────────
//
// bizapps-forms #187's review: the list named `ci/`, whose push scripts that change deleted, and omitted `scripts/`, which
// this change is what moves release automation INTO — `scripts/sync-app-version.mjs` is invoked by
// publish.yml and by the root `version` script. The pattern recognised a push planted there; the
// file was simply never opened, so the gate printed "passed".

function fixtureRoot(files) {
    const root = mkdtempSync(path.join(tmpdir(), 'release-pushes-'));
    for (const [rel, body] of Object.entries(files)) {
        const full = path.join(root, rel);
        mkdirSync(path.dirname(full), { recursive: true });
        writeFileSync(full, body);
    }
    return root;
}

test('a push in scripts/ is found — that is where release automation lives now', () => {
    const root = fixtureRoot({ 'scripts/release-helper.mjs': "execSync('git push origin HEAD:main');\n" });
    const violations = runCheck(root);
    assert.equal(violations.length, 1, 'scripts/ must be scanned: publish.yml runs node scripts/*.mjs');
    assert.match(violations[0], /scripts\/release-helper\.mjs/);
});

test('the scanned list covers every directory the release path actually runs from', () => {
    assert.ok(SCANNED_DIRS.includes('scripts'), 'repo-checks.yml runs node scripts/*.mjs');
    assert.ok(SCANNED_DIRS.includes('.github/workflows'));
    assert.ok(SCANNED_DIRS.includes('.github/scripts'));
    assert.ok(SCANNED_DIRS.includes('ci'), 'kept as a tripwire for a directory that must not come back');
});

// The gate's own spec is the one file in the repository that must contain protected-branch push
// strings, because they are the fixtures that prove the recogniser works. It is excluded BY NAME
// rather than by a `*.spec.mjs` rule: a class rule would let a real push hide in any spec, which is
// exactly the bypass this gate exists to close, and a named file fails loudly if it is renamed.
test('the gate does not fail on its own fixtures, and that exemption is exactly one file', () => {
    assert.deepEqual([...EXCLUDED_FILES], ['scripts/check-release-pushes.spec.mjs']);
});

test('the exemption does not extend to other specs under scripts/', () => {
    const root = fixtureRoot({ 'scripts/something-else.spec.mjs': "git push origin HEAD:next\n" });
    assert.equal(runCheck(root).length, 1, 'only the gate\'s OWN spec is exempt');
});

// ── The list itself ─────────────────────────────────────────────────────────────────────────────

// Pinned because the gate is exactly as good as this list: Sonar's release path may only land on
// `main` and `next` through pull requests, so these are the two refs it must never push to.
test('the protected-branch list matches the two refs of the ruleset: refs/heads/main and refs/heads/next', () => {
    assert.deepEqual([...PROTECTED_BRANCHES].sort(), ['main', 'next']);
});

test('the repository has no protected-branch push in its release path', () => {
    const violations = runCheck(REPO_ROOT);
    assert.deepEqual(violations, [], violations.join('\n'));
});
