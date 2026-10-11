import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    assessRelease,
    checkPostconditions,
    incrementVersion,
    maxBumpLevel,
    parseChangesetLevels,
    GATE_SCRIPTS,
} from './release-prep.mjs';

// Every gate green. Named rather than repeated, because a gate added to the script without a
// thought here would otherwise make every case in this file silently untestable.
const GREEN_GATES = Object.fromEntries(GATE_SCRIPTS.map((gate) => [gate, 0]));

/** A checkout with nothing wrong with it: one minor changeset on top of v0.10.0. */
function readyFacts(overrides = {}) {
    return {
        changesetCount: 1,
        currentVersion: '0.10.0',
        bumpLevels: ['minor'],
        tags: ['v0.9.0', 'v0.10.0'],
        publishedVersions: ['0.9.0', '0.10.0'],
        mainIsAncestorOfNext: true,
        treeClean: true,
        gateResults: { ...GREEN_GATES },
        ...overrides,
    };
}

// ── The ready case ──────────────────────────────────────────────────────────────────────────────

test('a clean checkout with changesets is ready, and names the version and the branch', () => {
    const assessment = assessRelease(readyFacts());
    assert.equal(assessment.ready, true);
    assert.deepEqual(assessment.blockers, []);
    assert.equal(assessment.version, '0.11.0');
    assert.equal(assessment.branch, 'release/v0.11.0');
    assert.equal(assessment.bumpLevel, 'minor');
    assert.equal(assessment.changesetCount, 1);
    assert.equal(assessment.seedOwed, false);
});

// ── Each blocker fires on its own ───────────────────────────────────────────────────────────────

test('a dirty working tree blocks, because the release commit is `git add -A`', () => {
    const assessment = assessRelease(readyFacts({ treeClean: false }));
    assert.equal(assessment.ready, false);
    assert.equal(assessment.blockers.length, 1);
    assert.match(assessment.blockers[0], /working tree is not clean/);
});

test('no changesets blocks, and says the bump may already have run', () => {
    const assessment = assessRelease(readyFacts({ changesetCount: 0, bumpLevels: [] }));
    assert.equal(assessment.ready, false);
    assert.equal(assessment.version, null, 'there is no version to move to');
    assert.equal(assessment.branch, null);
    assert.equal(assessment.blockers.length, 1);
    assert.match(assessment.blockers[0], /nothing to release/);
    assert.match(assessment.blockers[0], /pnpm run version/);
});

// A changeset with empty frontmatter is how changesets records "this landed, it releases nothing".
// A directory of only those is not "no changesets" and not a release either — and the difference
// matters, because the first message tells you to write a changeset and this one tells you the ones
// you wrote say nothing.
test('changesets that declare no bump level block separately from having none at all', () => {
    const assessment = assessRelease(readyFacts({ changesetCount: 3, bumpLevels: [] }));
    assert.equal(assessment.ready, false);
    assert.equal(assessment.version, null);
    assert.equal(assessment.blockers.length, 1);
    assert.match(assessment.blockers[0], /none declares a bump level/);
});

test('the release gates are exactly the four Sonar ones, in order', () => {
    assert.deepEqual(GATE_SCRIPTS, ['lint:distribution', 'check:release-seed', 'check:seed-cadence', 'check:pg-parity']);
});

test('each failing gate blocks by name, and says what a failure of it means', () => {
    for (const gate of GATE_SCRIPTS) {
        const assessment = assessRelease(readyFacts({ gateResults: { ...GREEN_GATES, [gate]: 1 } }));
        assert.equal(assessment.ready, false, `${gate} failing must block`);
        assert.equal(assessment.blockers.length, 1);
        assert.ok(assessment.blockers[0].includes(gate), `blocker must name ${gate}`);
        assert.ok(assessment.blockers[0].length > gate.length + 40, `${gate}'s blocker must explain itself`);
    }
});

// The seed is the blocker a release meets most often and the one whose fix is release work rather
// than a code change, so it is surfaced as a named fact and not only as blocker prose.
test('a failing seed-cadence gate is reported as a seed being owed', () => {
    const assessment = assessRelease(readyFacts({ gateResults: { ...GREEN_GATES, 'check:seed-cadence': 1 } }));
    assert.equal(assessment.seedOwed, true);
    assert.equal(assessRelease(readyFacts()).seedOwed, false);
});

test('a version that is already tagged blocks', () => {
    const assessment = assessRelease(readyFacts({ tags: ['v0.10.0', 'v0.11.0'] }));
    assert.equal(assessment.ready, false);
    assert.equal(assessment.blockers.length, 1);
    assert.match(assessment.blockers[0], /v0\.11\.0 is already a git tag/);
});

// `changeset publish` publishes the group concurrently, so one package carrying a version its
// siblings do not is a state it produces by design and expects a re-run of publish.yml to finish.
// Cutting a second release over that state is the wrong move, so the blocker points at the first.
test('a version already on npm for any package in the group blocks', () => {
    const assessment = assessRelease(readyFacts({ publishedVersions: ['0.10.0', '0.11.0'] }));
    assert.equal(assessment.ready, false);
    assert.equal(assessment.blockers.length, 1);
    assert.match(assessment.blockers[0], /already on npm/);
    assert.match(assessment.blockers[0], /release-plan/);
});

// A release PR must not merge while main carries commits next lacks — which is the previous
// release's un-merged back-merge PR, billed to this release. Today only this precondition refuses
// it; `strict: true` is a PLANNED ruleset rule (docs/release.md, admin setup), so the message must
// say "once it lands" rather than claim GitHub refuses it now.
test('a main that next does not contain blocks, and explains whose fault it is', () => {
    const assessment = assessRelease(readyFacts({ mainIsAncestorOfNext: false }));
    assert.equal(assessment.ready, false);
    assert.equal(assessment.blockers.length, 1);
    assert.match(assessment.blockers[0], /once the planned required-checks\/strict rules land/);
    assert.doesNotMatch(assessment.blockers[0], /Both rulesets/);
    assert.match(assessment.blockers[0], /chore\/backmerge-v/);
    assert.doesNotMatch(assessment.blockers[0], /chore\/sync-main-into-next/);
    assert.match(assessment.blockers[0], /PREVIOUS release/);
});

// ── Facts that could not be gathered block; they never pass ─────────────────────────────────────

test('an unreachable registry blocks rather than assuming the version is free', () => {
    const assessment = assessRelease(readyFacts({ publishedVersions: null }));
    assert.equal(assessment.ready, false);
    assert.match(assessment.blockers[0], /npm registry could not be reached/);
});

test('unresolvable main/next refs block rather than assuming the branches are in sync', () => {
    const assessment = assessRelease(readyFacts({ mainIsAncestorOfNext: null }));
    assert.equal(assessment.ready, false);
    assert.match(assessment.blockers[0], /could not be determined/);
    assert.match(assessment.blockers[0], /git fetch origin/);
});

// A gate with no exit code did not run, and a gate that did not run must never read as one that
// passed — the failure mode that makes a green release meaningless.
test('a missing gate result throws instead of counting as a pass', () => {
    const { 'check:pg-parity': _dropped, ...partial } = GREEN_GATES;
    assert.throws(() => assessRelease(readyFacts({ gateResults: partial })), /check:pg-parity/);
});

test('blockers accumulate rather than short-circuiting', () => {
    const assessment = assessRelease(
        readyFacts({ treeClean: false, mainIsAncestorOfNext: false, gateResults: { ...GREEN_GATES, 'lint:distribution': 2 } }),
    );
    assert.equal(assessment.blockers.length, 3, 'one run should tell you everything that is wrong');
});

// ── Guard clauses on the inputs ─────────────────────────────────────────────────────────────────

test('a non-integer changeset count throws', () => {
    assert.throws(() => assessRelease(readyFacts({ changesetCount: '1' })), /changesetCount/);
});

test('a missing current version throws rather than incrementing nothing', () => {
    assert.throws(() => assessRelease(readyFacts({ currentVersion: undefined })), /currentVersion/);
});

test('a non-boolean tree state throws', () => {
    assert.throws(() => assessRelease(readyFacts({ treeClean: 'yes' })), /treeClean/);
});

test('publishedVersions must be an array or the explicit null', () => {
    assert.throws(() => assessRelease(readyFacts({ publishedVersions: '0.11.0' })), /publishedVersions/);
});

// ── Version arithmetic ──────────────────────────────────────────────────────────────────────────

// Pre-1.0 is NOT special-cased: changesets applies plain semver below 1.0, so 0.10.0 + minor is
// 0.11.0 and 0.10.0 + major is 1.0.0. Getting this wrong is how a 0.x repo ships 0.11.0 as 1.0.0.
test('a minor bump below 1.0 moves the minor, not the major', () => {
    assert.equal(incrementVersion('0.10.0', 'minor'), '0.11.0');
});

test('a major bump below 1.0 reaches 1.0.0', () => {
    assert.equal(incrementVersion('0.10.3', 'major'), '1.0.0');
});

test('a patch bump below 1.0 moves the patch', () => {
    assert.equal(incrementVersion('0.10.0', 'patch'), '0.10.1');
});

test('a minor bump resets the patch', () => {
    assert.equal(incrementVersion('1.4.7', 'minor'), '1.5.0');
});

test('a major bump resets minor and patch', () => {
    assert.equal(incrementVersion('2.9.4', 'major'), '3.0.0');
});

test('a patch bump above 1.0 moves the patch', () => {
    assert.equal(incrementVersion('1.4.7', 'patch'), '1.4.8');
});

// changesets only produces prerelease versions in `pre` mode, which this repo does not use — so a
// prerelease here is a hand edit, and guessing at its successor would be worse than stopping.
test('a prerelease version throws rather than being guessed at', () => {
    assert.throws(() => incrementVersion('0.10.0-rc.1', 'minor'), /MAJOR\.MINOR\.PATCH/);
});

test('a non-version string throws', () => {
    assert.throws(() => incrementVersion('latest', 'patch'), /MAJOR\.MINOR\.PATCH/);
});

test('an unknown level throws', () => {
    assert.throws(() => incrementVersion('1.0.0', 'huge'), /bump level/);
});

// ── Choosing the level ──────────────────────────────────────────────────────────────────────────

test('the strongest level in the set wins', () => {
    assert.equal(maxBumpLevel(['patch', 'minor', 'patch']), 'minor');
    assert.equal(maxBumpLevel(['patch', 'major', 'minor']), 'major');
    assert.equal(maxBumpLevel(['patch', 'patch']), 'patch');
    assert.equal(maxBumpLevel(['minor', 'minor']), 'minor');
});

test('no levels at all is null, not a patch', () => {
    assert.equal(maxBumpLevel([]), null);
});

test('the whole release takes the strongest level of any changeset', () => {
    // 70 patch changesets and one minor is a minor release: the packages are one `fixed` group, so
    // the level is a release-wide decision (docs/release.md).
    const assessment = assessRelease(readyFacts({ changesetCount: 71, bumpLevels: [...Array(70).fill('patch'), 'minor'] }));
    assert.equal(assessment.version, '0.11.0');
});

// A level this script cannot read must stop the release: silently skipping one under-bumps the
// version that publishes, and `major` quietly becoming `patch` is invisible to every later gate.
test('an unreadable level throws rather than being ignored', () => {
    assert.throws(() => maxBumpLevel(['minor', 'none']), /not a changeset bump level/);
    assert.throws(() => maxBumpLevel(['minor', undefined]), /not a changeset bump level/);
});

test('a non-array of levels throws', () => {
    assert.throws(() => maxBumpLevel('minor'), /must be an array/);
});

// ── Reading a changeset ─────────────────────────────────────────────────────────────────────────

// Both quoting styles occur in this repo's .changeset/ — changesets writes double quotes, and
// hand-written ones have landed single-quoted.
test('both quoting styles of changeset frontmatter parse', () => {
    assert.deepEqual(parseChangesetLevels('---\n"@mj-biz-apps/sonar-ng": minor\n---\n\nBody.\n'), ['minor']);
    assert.deepEqual(parseChangesetLevels("---\n'@mj-biz-apps/sonar-ng': patch\n---\n\nBody.\n"), ['patch']);
});

test('every package named in one changeset contributes its level', () => {
    const text = '---\n"@mj-biz-apps/sonar-entities": minor\n"@mj-biz-apps/sonar-ng": patch\n---\n\nBody.\n';
    assert.deepEqual(parseChangesetLevels(text), ['minor', 'patch']);
});

test('an empty frontmatter block declares no levels', () => {
    assert.deepEqual(parseChangesetLevels('---\n---\n\nNothing to release.\n'), []);
});

test('a file with no frontmatter throws rather than being read as empty', () => {
    assert.throws(() => parseChangesetLevels('# Just prose\n', 'README-ish.md'), /README-ish\.md/);
});

test('an unparseable frontmatter line throws and names the file', () => {
    assert.throws(
        () => parseChangesetLevels('---\nsonar-ng minor\n---\n', '.changeset/x.md'),
        /\.changeset\/x\.md/,
    );
});

// ── Postconditions on the real bump ─────────────────────────────────────────────────────────────

// Sonar's six publishable package dirs. sonar-engine and sonar-core-entities-server are absent from
// mj-app.json yet publish in lock-step with the rest (Review Focus 3).
const SONAR_PACKAGE_NAMES = [
    'sonar-actions',
    'sonar-ng',
    'sonar-core-entities-server',
    'sonar-engine',
    'sonar-entities',
    'sonar-server',
];
const BUMPED = SONAR_PACKAGE_NAMES.map((name) => ({ name: `@mj-biz-apps/${name}`, version: '0.11.0' }));
const NAMES = BUMPED.map((p) => p.name);

function postconditions(overrides = {}) {
    return checkPostconditions({
        packages: BUMPED,
        expectedNames: NAMES,
        predictedVersion: '0.11.0',
        remainingChangesets: [],
        appSyncExitCode: 0,
        ...overrides,
    });
}

test('a bump that did what was predicted has no postcondition problems', () => {
    assert.deepEqual(postconditions(), []);
});

// The prediction here and changesets' own arithmetic are two pieces of code. They agree today; this
// is what notices the day they stop, rather than pushing a branch named for a version it does not
// contain.
test('a version that differs from the prediction is reported with BOTH numbers', () => {
    const [problem] = postconditions({ predictedVersion: '0.10.1' });
    assert.match(problem, /0\.11\.0/);
    assert.match(problem, /0\.10\.1/);
    assert.match(problem, /Do not push/);
});

test('packages left at different versions are a problem, not a version to pick from', () => {
    const problems = postconditions({
        packages: [
            ...BUMPED.slice(0, -1),
            { name: '@mj-biz-apps/sonar-server', version: '0.10.0' },
        ],
    });
    assert.equal(problems.length, 1);
    assert.match(problems[0], /fixed/);
});

test('a package set that changed across the bump is a problem', () => {
    const problems = postconditions({ expectedNames: [...NAMES, '@mj-biz-apps/sonar-extra'] });
    assert.equal(problems.length, 1);
    assert.match(problems[0], /package set changed/);
});

test('no publishable packages at all is a problem rather than a trivially consistent release', () => {
    const problems = postconditions({ packages: [], expectedNames: [] });
    assert.ok(problems.some((p) => /nothing in it/.test(p)));
});

test('mj-app.json left out of sync is a problem', () => {
    const problems = postconditions({ appSyncExitCode: 1 });
    assert.equal(problems.length, 1);
    assert.match(problems[0], /mj-app\.json/);
});

// publish.yml refuses to publish while any changeset remains, because their presence means the
// version was never consumed — so finding them here, before the branch is pushed, is the cheap one.
test('surviving changesets are a problem and are named', () => {
    const problems = postconditions({ remainingChangesets: ['a-thing.md', 'another.md'] });
    assert.equal(problems.length, 1);
    assert.match(problems[0], /a-thing\.md/);
    assert.match(problems[0], /another\.md/);
});

test('several postcondition failures are all reported at once', () => {
    const problems = postconditions({ predictedVersion: '0.12.0', appSyncExitCode: 1, remainingChangesets: ['x.md'] });
    assert.equal(problems.length, 3);
});
