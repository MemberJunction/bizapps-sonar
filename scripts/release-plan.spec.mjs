import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { planRelease, publishablePackages, emitOutputs, tagExistsLocally } from './release-plan.mjs';

const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const PKGS = [
    { name: '@mj-biz-apps/sonar-entities', version: '0.11.0' },
    { name: '@mj-biz-apps/sonar-server', version: '0.11.0' },
];

// Sonar's real publishable set. sonar-engine and sonar-core-entities-server are not declared in
// mj-app.json's package list, but they are publishable packages/* and must still gate the release.
const SONAR_PKGS = [
    'sonar-entities',
    'sonar-core-entities-server',
    'sonar-engine',
    'sonar-actions',
    'sonar-server',
    'sonar-ng',
].map((short) => ({ name: `@mj-biz-apps/${short}`, version: '0.6.0' }));

// ── The state that made a re-run a silent green no-op ───────────────────────────────────────────
//
// bizapps-forms #187's review. `changeset publish` publishes the unpublished set concurrently, so one package
// landing on npm while a sibling fails is a state it produces by design and expects a retry to
// finish. The gate this replaces asked only whether the ENTITIES package was published, and both
// `Publish to npm` and `Tag the release` hung off that one answer — so the retry skipped everything
// and reported success, leaving packages unpublished and no `v<version>` tag at all.

test('a partially published release still has work to do', () => {
    const plan = planRelease({
        packages: PKGS,
        published: { '@mj-biz-apps/sonar-entities': ['0.11.0'] },
        tagExists: false,
    });
    assert.equal(plan.publish, true, 'sonar-server is not on npm — the retry must publish it');
    assert.deepEqual(plan.unpublished, ['@mj-biz-apps/sonar-server']);
    assert.equal(plan.tag, true);
    assert.equal(plan.work, true);
});

// The other half of the same defect: everything published, but the tag push is what failed. The
// version is fully released and nothing records it, and check-release-seed-cadence.mjs reads the
// newest v* tag to decide what has shipped — so a missing tag fails the NEXT release.
test('a fully published release with no tag still has work to do', () => {
    const plan = planRelease({
        packages: PKGS,
        published: { '@mj-biz-apps/sonar-entities': ['0.11.0'], '@mj-biz-apps/sonar-server': ['0.11.0'] },
        tagExists: false,
    });
    assert.equal(plan.publish, false, 'nothing left to publish');
    assert.equal(plan.tag, true, 'but the tag is still missing');
    assert.equal(plan.work, true);
});

test('a finished release is a no-op', () => {
    const plan = planRelease({
        packages: PKGS,
        published: { '@mj-biz-apps/sonar-entities': ['0.11.0'], '@mj-biz-apps/sonar-server': ['0.11.0'] },
        tagExists: true,
    });
    assert.equal(plan.publish, false);
    assert.equal(plan.tag, false);
    assert.equal(plan.work, false);
});

test('an untouched version publishes everything', () => {
    const plan = planRelease({ packages: PKGS, published: {}, tagExists: false });
    assert.equal(plan.publish, true);
    assert.deepEqual(plan.unpublished, PKGS.map((p) => p.name));
    assert.equal(plan.tag, true);
});

test('a package published at other versions but not this one still needs publishing', () => {
    const plan = planRelease({
        packages: [PKGS[0]],
        published: { '@mj-biz-apps/sonar-entities': ['0.9.0', '0.10.0'] },
        tagExists: false,
    });
    assert.equal(plan.publish, true);
});

test('the version reported is the one being released', () => {
    assert.equal(planRelease({ packages: PKGS, published: {}, tagExists: false }).version, '0.11.0');
});

// Review focus 3: a package outside mj-app.json still counts. Only sonar-engine is missing on npm.
test('one unpublished package among six publishable ones, sonar-engine, still forces a publish', () => {
    const published = Object.fromEntries(
        SONAR_PKGS.filter((p) => p.name !== '@mj-biz-apps/sonar-engine').map((p) => [p.name, ['0.6.0']]),
    );
    const plan = planRelease({ packages: SONAR_PKGS, published, tagExists: true });
    assert.equal(SONAR_PKGS.length, 6);
    assert.equal(plan.publish, true);
    assert.deepEqual(plan.unpublished, ['@mj-biz-apps/sonar-engine']);
    assert.equal(plan.work, true);
});

// ── Guard clauses ───────────────────────────────────────────────────────────────────────────────

// `fixed` in .changeset/config.json moves every @mj-biz-apps package together, so divergent
// versions mean the bump did not happen as a unit and there is no single version to tag.
test('divergent package versions throw rather than picking one', () => {
    assert.throws(
        () =>
            planRelease({
                packages: [
                    { name: '@mj-biz-apps/sonar-entities', version: '0.11.0' },
                    { name: '@mj-biz-apps/sonar-server', version: '0.10.0' },
                ],
                published: {},
                tagExists: false,
            }),
        /0\.11\.0.*0\.10\.0|version/s,
    );
});

test('an empty package list throws rather than reporting nothing to do', () => {
    assert.throws(() => planRelease({ packages: [], published: {}, tagExists: false }), /no publishable/i);
});

// ── Discovery ───────────────────────────────────────────────────────────────────────────────────

test('this repository discovers exactly its publishable packages', () => {
    const found = publishablePackages(REPO_ROOT);
    assert.ok(found.length >= 6, `expected the @mj-biz-apps packages, got ${found.length}`);
    for (const p of found) {
        assert.match(p.name, /^@mj-biz-apps\//, `${p.name} is not a publishable @mj-biz-apps package`);
        assert.ok(p.version, `${p.name} has no version`);
    }
});

function withFixture(manifests, run) {
    const root = mkdtempSync(path.join(os.tmpdir(), 'release-plan-'));
    try {
        for (const [dir, manifest] of Object.entries(manifests)) {
            mkdirSync(path.join(root, 'packages', dir), { recursive: true });
            if (manifest) writeFileSync(path.join(root, 'packages', dir, 'package.json'), JSON.stringify(manifest));
        }
        return run(root);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
}

test('a private package is not something to publish, and a directory without a manifest is skipped', () => {
    const found = withFixture(
        {
            Pub: { name: '@mj-biz-apps/pub', version: '1.0.0' },
            Priv: { name: 'priv', version: '1.0.0', private: true },
            NoManifest: null,
        },
        (root) => publishablePackages(root),
    );
    assert.deepEqual(found, [{ name: '@mj-biz-apps/pub', version: '1.0.0' }]);
});

test('an unreadable manifest throws with its path rather than being skipped', () => {
    withFixture({ Bad: null }, (root) => {
        writeFileSync(path.join(root, 'packages', 'Bad', 'package.json'), '{not json');
        assert.throws(() => publishablePackages(root), /Bad.package\.json/);
    });
});

// Where the outputs go is decided by emitOutputs, a pure function of its arguments, so both
// branches are proven without running the CLI (which would call `npm view`).
const OUTPUTS = 'VERSION=0.6.0\npublish=false\ntag=false\nwork=false\n';

test('emitOutputs appends to the GITHUB_OUTPUT file when it is set', () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'release-plan-out-'));
    try {
        const file = path.join(dir, 'out');
        const written = [];
        emitOutputs(OUTPUTS, { GITHUB_OUTPUT: file }, (text) => written.push(text));
        assert.equal(readFileSync(file, 'utf8'), OUTPUTS);
        assert.deepEqual(written, [], 'nothing goes to stdout when the file is used');
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});

test('emitOutputs writes to stdout when GITHUB_OUTPUT is unset', () => {
    const written = [];
    emitOutputs(OUTPUTS, {}, (text) => written.push(text));
    assert.deepEqual(written, [OUTPUTS]);
});

// tagExistsLocally against real, throwaway git repositories — local only, no network.
function withGitRepo(fn) {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'release-plan-git-'));
    try {
        const git = (...args) => execFileSync('git', args, { cwd: dir, stdio: 'ignore' });
        git('init', '-q');
        git('-c', 'user.email=t@example.com', '-c', 'user.name=t', 'commit', '-q', '--allow-empty', '-m', 'root');
        return fn(dir, git);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

test('tagExistsLocally is true for a tag that exists', () => {
    withGitRepo((dir, git) => {
        git('tag', 'v1.2.3');
        assert.equal(tagExistsLocally('1.2.3', dir), true);
    });
});

test('tagExistsLocally is false for a tag that does not exist', () => {
    withGitRepo((dir) => {
        assert.equal(tagExistsLocally('9.9.9', dir), false);
    });
});

// "Absent" is the answer that publishes and tags. A git that could not answer at all (not a
// repository, a broken checkout) must not be read as "absent" — it throws, naming what it asked.
test('tagExistsLocally throws, with context, when git cannot answer', () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'release-plan-nogit-'));
    try {
        assert.throws(
            () => tagExistsLocally('1.2.3', dir),
            (error) => /v1\.2\.3/.test(error.message) && /not a git repository/i.test(error.message),
        );
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});
