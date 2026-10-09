#!/usr/bin/env node
/**
 * Proves the distribution gate FIRES on what it guards (unresolvable placeholders, both dialects and
 * teardown) and does NOT fire on what it no longer guards (metadata ahead of the last seed — that is
 * the release gates' question, asked in publish.yml). A gate nobody has seen fail is
 * indistinguishable from a gate that returns "pass" unconditionally.
 *
 * Plain Node rather than Vitest on purpose: the gate is stdlib-only so it can run in CI without
 * a dependency install, and its test should not reintroduce the dependency it was designed to avoid.
 */
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { runChecks } from './check-distribution-seed.mjs';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
/** A real record file with `fields` + a `sync` block, used to plant a metadata-only edit in fixtures. */
const RECORD_FILE = join('metadata', 'score-band-sets', '.score-band-sets.json');

let failures = 0;
function check(name, condition, detail) {
    if (condition) {
        console.log(`  ✓ ${name}`);
    } else {
        console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
        failures++;
    }
}

/** A minimal repo-shaped fixture: real metadata, plus whatever migrations the case needs. */
function fixture(build) {
    const root = mkdtempSync(join(tmpdir(), 'dist-gate-'));
    cpSync(join(REPO_ROOT, 'metadata'), join(root, 'metadata'), {
        recursive: true,
        filter: (src) => !src.includes(`metadata/sql_logging`) && !src.includes('.backups'),
    });
    mkdirSync(join(root, 'migrations'), { recursive: true });
    build(root);
    return root;
}

function withFixture(build, assert) {
    const root = fixture(build);
    try {
        assert(runChecks(root), root);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
}

/** A shipped seed most cases start from, so each case differs from a valid repo by one thing. */
function seed(root) {
    writeFileSync(join(root, 'migrations', 'V1__v0.1.x_Seed_App_Metadata.sql'), '-- seed\n');
}

console.log('distribution gate:');

// 1. THE REASON THIS GATE WAS REWRITTEN. A metadata-only PR — a record edited, no migration — is the
//    normal shape of a PR under the release-time model, and the build engineer's release seed carries
//    it. The retired CHECK 1 failed exactly this, which kept every metadata-only PR red (#76, #84).
//    If this case goes red, the PR gate has started demanding hand-written metadata SQL again.
withFixture(
    (root) => {
        seed(root);
        const seedPath = join(root, RECORD_FILE);
        const records = JSON.parse(readFileSync(seedPath, 'utf-8'));
        records[0].fields.Description = 'edited in a metadata-only PR';
        writeFileSync(seedPath, JSON.stringify(records, null, 2));
        writeFileSync(join(root, 'metadata', 'score-band-sets', '.new-records.json'), JSON.stringify([
            { fields: { Name: 'Brand new in this PR' }, primaryKey: { ID: 'ABCDEF01-2345-4678-9ABC-DEF012345678' } },
        ], null, 2));
    },
    (violations) => {
        check(
            'a metadata-only change with no migration PASSES the PR gate (the release seed carries it)',
            violations.length === 0,
            JSON.stringify(violations),
        );
    },
);

// 2. …and the retired manifest is not resurrected: no manifest file, no complaint about one.
withFixture(
    (root) => seed(root),
    (violations) => {
        check(
            'does not demand the retired metadata-seed.manifest.json',
            !violations.some((v) => v.includes('manifest')),
            JSON.stringify(violations),
        );
    },
);

// 3. The placeholder leak, in the form it actually shipped in elsewhere in the family.
withFixture(
    (root) => {
        seed(root);
        writeFileSync(
            join(root, 'migrations', 'V2__Leak.sql'),
            "EXEC [${mjSchema}].[spUpdateExistingEntitiesFromSchema] @ExcludedSchemaNames='sys,${commonSchema}';\n",
        );
    },
    (violations) => {
        check(
            'flags a placeholder the install engine cannot resolve',
            violations.some((v) => v.includes('commonSchema')),
            JSON.stringify(violations),
        );
    },
);

// 4. The PostgreSQL migration set is scanned too — Sonar ships both dialects.
withFixture(
    (root) => {
        seed(root);
        mkdirSync(join(root, 'migrations-pg'), { recursive: true });
        writeFileSync(
            join(root, 'migrations-pg', 'V2__Leak.pg.sql'),
            'SELECT 1 FROM "${sonarSchema}"."Factor";\n',
        );
    },
    (violations) => {
        check(
            'flags an unresolvable placeholder in migrations-pg',
            violations.some((v) => v.includes('migrations-pg') && v.includes('sonarSchema')),
            JSON.stringify(violations),
        );
    },
);

// 5. Teardown scripts get a stricter map — only ${mjSchema} is substituted there (both dialects).
withFixture(
    (root) => {
        seed(root);
        mkdirSync(join(root, 'migrations-teardown-pg'), { recursive: true });
        writeFileSync(
            join(root, 'migrations-teardown-pg', '01__Teardown.sql'),
            'DELETE FROM "${flyway:defaultSchema}"."Thing";\n',
        );
    },
    (violations) => {
        check(
            'flags the app-schema placeholder in a teardown script, where MJ does not substitute it',
            violations.some((v) => v.includes('migrations-teardown-pg') && v.includes('flyway:defaultSchema')),
            JSON.stringify(violations),
        );
    },
);

// 6. The real repository must pass, or the gate is not describing this codebase.
check('the repository itself passes', runChecks(REPO_ROOT).length === 0, JSON.stringify(runChecks(REPO_ROOT)));

if (failures > 0) {
    console.error(`\n${failures} gate self-test(s) failed.`);
    process.exit(1);
}
console.log('\nAll distribution-gate self-tests passed.');
