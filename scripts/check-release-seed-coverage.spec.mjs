#!/usr/bin/env node
/**
 * Proves the release-readiness check FIRES.
 *
 * The check it covers replaced one that passed while asserting something false
 * (MemberJunction/bizapps-forms#105), so "it went green" is not evidence of anything until something
 * has watched it go red. Six of the cases below assert a failure.
 *
 * In-process against `findSeedCoverageGaps(repoRoot)`, the same shape as
 * `check-distribution-seed.spec.mjs` next door — the check takes a repo root precisely so its tests
 * do not have to build a tree with a copy of the script in it and spawn a process per case. One
 * case at the end runs the real CLI, because exit codes and the report text are what CI reads and
 * nothing in-process exercises them.
 *
 * Plain Node rather than Vitest, matching the gate it sits beside: the check is stdlib-only so it
 * can run without `pnpm install`, and its test must not reintroduce the dependency it avoids.
 *
 * Runs at the release boundary, in `publish.yml`, immediately before the check itself — and not on
 * PRs, for the reason the check's own header gives.
 *
 * Ported from bizapps-common, itself ported from bizapps-forms (MemberJunction/bizapps-forms#105 and
 * MemberJunction/bizapps-forms#108).
 */
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { findSeedCoverageGaps } from './check-release-seed-coverage.mjs';

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(SCRIPTS_DIR, 'check-release-seed-coverage.mjs');

let failures = 0;
function check(name, condition, detail) {
    if (condition) {
        console.log(`  ✓ ${name}`);
    } else {
        console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
        failures++;
    }
}

/** A repo-shaped fixture: a `metadata/` and a `migrations/`, plus whatever the case puts in them. */
function withFixture(build, assert) {
    const root = mkdtempSync(join(tmpdir(), 'release-seed-'));
    mkdirSync(join(root, 'metadata'), { recursive: true });
    mkdirSync(join(root, 'migrations'), { recursive: true });
    try {
        build(root);
        assert(findSeedCoverageGaps(root));
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
}

const COVERED = 'AAAA1111-2222-4333-8444-555566667777';
const UNCOVERED = 'BBBB1111-2222-4333-8444-555566667777';
const ALSO_UNCOVERED = 'CCCC1111-2222-4333-8444-555566667777';

/** One record file, in the shape `mj sync push` reads. */
function records(...ids) {
    return JSON.stringify(ids.map((id) => ({ fields: { Name: id }, primaryKey: { ID: id } })), null, 2);
}

/** A migration naming whichever ids the case wants covered. */
function seed(...ids) {
    return ids.map((id) => `EXEC spCreateThing @ID = '${id}';`).join('\n') + '\n';
}

console.log('release seed coverage:');

// 1. The defect this exists for, and the exact shape that reached bizapps-sales: a record declared
//    under metadata/ that no shipped migration names. CHECK 1 passed on this whenever the manifest
//    had been regenerated; here it must not.
withFixture(
    (root) => {
        writeFileSync(join(root, 'metadata', '.things.json'), records(UNCOVERED));
        writeFileSync(join(root, 'migrations', 'V1__Seed.sql'), seed(COVERED));
    },
    ({ problems }) => {
        check('flags a declared primaryKey that appears in no migration', problems.some((p) => p.includes(UNCOVERED)), JSON.stringify(problems));
    },
);

// 2. EVERY uncovered id, not a count and a sample. This output IS the pending list that replaced a
//    hand-maintained table, so a file owing two records must name both — otherwise the build
//    engineer goes back to the repo to derive the rest, which is the maintenance being retired.
withFixture(
    (root) => {
        writeFileSync(join(root, 'metadata', '.things.json'), records(UNCOVERED, ALSO_UNCOVERED));
        writeFileSync(join(root, 'migrations', 'V1__Seed.sql'), seed(COVERED));
    },
    ({ problems }) => {
        const report = problems.join('\n');
        check(
            'names every uncovered id, not just the first',
            report.includes(UNCOVERED) && report.includes(ALSO_UNCOVERED),
            report,
        );
    },
);

// 3. A MUST PASS, or the check is just always-red and nobody will believe the red one either.
withFixture(
    (root) => {
        writeFileSync(join(root, 'metadata', '.things.json'), records(COVERED));
        writeFileSync(join(root, 'migrations', 'V1__Seed.sql'), seed(COVERED));
    },
    ({ problems, idsChecked }) => {
        check('passes when every declared primaryKey is named by the shipped chain', problems.length === 0 && idsChecked === 1, JSON.stringify(problems));
    },
);

// 4. Case matters nowhere in T-SQL and must not matter here. `uuidgen` yields upper case, the
//    generator has shipped both, and a case-sensitive compare would report a record as missing
//    that is right there in the file.
withFixture(
    (root) => {
        writeFileSync(join(root, 'metadata', '.things.json'), records(COVERED));
        writeFileSync(join(root, 'migrations', 'V1__Seed.sql'), seed(COVERED.toLowerCase()));
    },
    ({ problems }) => {
        check('matches a UUID regardless of case', problems.length === 0, JSON.stringify(problems));
    },
);

// 5. `@parent` nesting puts child records inside the parent's file. A child that ships nowhere is as
//    invisible to a host as a root one, so the walk must reach it.
withFixture(
    (root) => {
        writeFileSync(
            join(root, 'metadata', '.things.json'),
            JSON.stringify(
                [
                    {
                        fields: { Name: 'parent' },
                        primaryKey: { ID: COVERED },
                        relatedEntities: { Children: [{ fields: {}, primaryKey: { ID: UNCOVERED } }] },
                    },
                ],
                null,
                2,
            ),
        );
        writeFileSync(join(root, 'migrations', 'V1__Seed.sql'), seed(COVERED));
    },
    ({ problems }) => {
        check('reaches a nested @parent child record', problems.some((p) => p.includes(UNCOVERED)), JSON.stringify(problems));
    },
);

// 6. `sql_logging/` is the raw push output that BECOMES a seed, and `.backups/` is what a push
//    writes before updating in place — every .mj-sync.json here configures one. Both are left on
//    disk by a local run, so reading either would report ids nobody declared, red on the very push
//    that fixed things.
withFixture(
    (root) => {
        writeFileSync(join(root, 'metadata', '.things.json'), records(COVERED));
        mkdirSync(join(root, 'metadata', 'sql_logging'));
        mkdirSync(join(root, 'metadata', '.backups'));
        writeFileSync(join(root, 'metadata', 'sql_logging', 'push.json'), records(UNCOVERED));
        writeFileSync(join(root, 'metadata', '.backups', 'old.json'), records(UNCOVERED));
        writeFileSync(join(root, 'migrations', 'V1__Seed.sql'), seed(COVERED));
    },
    ({ problems }) => {
        check('ignores generator output and push backups', problems.length === 0, JSON.stringify(problems));
    },
);

// 7. `.mj-sync.json` is directory configuration, never a record. It carries no primaryKey today, so
//    this pins the exclusion rather than an outcome that happens to hold.
withFixture(
    (root) => {
        writeFileSync(join(root, 'metadata', '.mj-sync.json'), records(UNCOVERED));
        writeFileSync(join(root, 'metadata', '.things.json'), records(COVERED));
        writeFileSync(join(root, 'migrations', 'V1__Seed.sql'), seed(COVERED));
    },
    ({ problems }) => {
        check('does not read .mj-sync.json as a record file', problems.length === 0, JSON.stringify(problems));
    },
);

// 8. Never swallowed. A record file the script cannot parse is a record it cannot vouch for, and
//    passing over it silently is the exact failure mode that retired CHECK 1.
withFixture(
    (root) => {
        writeFileSync(join(root, 'metadata', '.broken.json'), '{ not json');
        writeFileSync(join(root, 'metadata', '.things.json'), records(COVERED));
        writeFileSync(join(root, 'migrations', 'V1__Seed.sql'), seed(COVERED));
    },
    ({ problems }) => {
        check('reports an unparseable record file instead of skipping it', problems.some((p) => p.includes('.broken.json')), JSON.stringify(problems));
    },
);

// 9. …and the parse failure survives the vacuity guard. When EVERY record file is unreadable there
//    are no ids, so the "measured nothing" message fires too — and an early return there would have
//    thrown away the only line saying which file could not be read and why.
withFixture(
    (root) => {
        writeFileSync(join(root, 'metadata', '.broken.json'), '{ not json');
        writeFileSync(join(root, 'migrations', 'V1__Seed.sql'), seed(COVERED));
    },
    ({ problems }) => {
        check(
            'keeps the parse reason when nothing at all could be measured',
            problems.some((p) => p.includes('.broken.json')) && problems.some((p) => p.includes('measured NOTHING')),
            JSON.stringify(problems),
        );
    },
);

// 10. The vacuity guard, and the reason this file exists at all. A walk that finds nothing must not
//     report success — "I examined zero records" and "every record is fine" are the same green
//     otherwise, which is how CHECK 1 went green over a record that shipped nowhere.
withFixture(
    (root) => {
        writeFileSync(join(root, 'metadata', '.things.json'), '[]');
        writeFileSync(join(root, 'migrations', 'V1__Seed.sql'), '-- a seed\n');
    },
    ({ problems }) => {
        check('refuses to pass when it measured nothing', problems.some((p) => p.includes('measured NOTHING')), JSON.stringify(problems));
    },
);

// 11. An empty migrations/ would make every record look missing, which is a broken run dressed as a
//     finding. It must say so instead, in the same words for a missing directory and an empty one.
withFixture(
    (root) => {
        writeFileSync(join(root, 'metadata', '.things.json'), records(COVERED));
    },
    ({ problems }) => {
        check('calls an empty migrations/ a broken run, not a finding', problems.some((p) => p.includes('broken run')), JSON.stringify(problems));
    },
);

// -------------------------------------------------------------------------------------------
// Cases 13-14 were written RED, from probing the script with hostile trees.
// -------------------------------------------------------------------------------------------

// 13. A BYTE-ORDER MARK must not be reported as broken JSON. `﻿` at the head of a UTF-8 file
//     is what Windows editors and PowerShell redirection leave behind, and `JSON.parse` rejects it
//     while every other reader in the chain strips it. Failing here is loud rather than silent, so
//     it is not the dangerous direction — but it fails a file that is not actually wrong, at the
//     release boundary, with a message pointing at the parser rather than at the BOM.
withFixture(
    (root) => {
        mkdirSync(join(root, 'metadata', 'a'), { recursive: true });
        writeFileSync(join(root, 'metadata', 'a', '.r.json'), '﻿' + records(COVERED));
        writeFileSync(join(root, 'migrations', 'V1.sql'), COVERED);
    },
    ({ problems, idsChecked }) => {
        check('a BOM-prefixed record file parses', problems.length === 0 && idsChecked === 1, JSON.stringify(problems));
    },
);

// 14. A DANGLING ENTRY MUST NOT CRASH THE RUN. `statSync` throws ENOENT on a broken symlink — and
//     on any path that vanishes between the readdir and the stat — so the walk dies with a node
//     stack trace instead of a verdict. CI then shows a crash where it should show a finding, and
//     nothing in the output names the file responsible.
withFixture(
    (root) => {
        mkdirSync(join(root, 'metadata', 'a'), { recursive: true });
        writeFileSync(join(root, 'metadata', 'a', '.r.json'), records(COVERED));
        writeFileSync(join(root, 'migrations', 'V1.sql'), COVERED);
        symlinkSync(join(root, 'metadata', 'a', 'gone.json'), join(root, 'metadata', 'a', '.dangling.json'));
    },
    ({ problems, idsChecked }) => {
        check('a dangling symlink is a reported problem, not a crash', problems.length === 1 && idsChecked === 1, JSON.stringify(problems));
        check('  …and the problem names the file', problems[0]?.includes('.dangling.json'), JSON.stringify(problems));
    },
);

// 12. The CLI wiring — exit code and report text, which is all CI reads and the only thing the
//     in-process cases above cannot see.
//
//     NOT run against Sonar's own live tree. The script derives REPO_ROOT from `import.meta.url`, not
//     `cwd`, so exercising the real CLI means giving it a copy of itself inside an isolated fixture.
//     That matters because the live `metadata/` is legitimately ahead of its seed between releases
//     (a metadata-only PR adds a record no migration names until the release Metadata_Sync).
//     Asserting a pass against the live repo would make this self-test's result track the debt count
//     of `metadata/` instead of the script's own behavior, and it would need editing every time that
//     count changes — the exact coupling the rest of this file exists to catch in the release seed
//     itself. Spawning a copy of the script against a clean fixture proves the same wiring (exit
//     code, message text) without inheriting that coupling.
{
    const cliRoot = mkdtempSync(join(tmpdir(), 'release-seed-cli-'));
    try {
        mkdirSync(join(cliRoot, 'scripts'), { recursive: true });
        mkdirSync(join(cliRoot, 'metadata'), { recursive: true });
        mkdirSync(join(cliRoot, 'migrations'), { recursive: true });
        writeFileSync(join(cliRoot, 'scripts', 'check-release-seed-coverage.mjs'), readFileSync(SCRIPT));
        writeFileSync(join(cliRoot, 'metadata', '.things.json'), records(COVERED));
        writeFileSync(join(cliRoot, 'migrations', 'V1__Seed.sql'), seed(COVERED));
        const output = execFileSync(process.execPath, [join(cliRoot, 'scripts', 'check-release-seed-coverage.mjs')], {
            stdio: 'pipe',
            encoding: 'utf-8',
        });
        check('the CLI exits 0 and says so on a clean fixture', output.includes('Release seed coverage passed'), output);
    } catch (error) {
        check('the CLI exits 0 and says so on a clean fixture', false, `exited ${error.status}: ${error.stdout ?? ''}${error.stderr ?? ''}`);
    } finally {
        rmSync(cliRoot, { recursive: true, force: true });
    }
}

if (failures > 0) {
    console.error(`\n❌ ${failures} release-seed-coverage self-test(s) failed.\n`);
    process.exit(1);
}
console.log('\nAll release-seed-coverage self-tests passed.');
