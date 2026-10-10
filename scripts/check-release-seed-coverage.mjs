#!/usr/bin/env node
/**
 * Release readiness — is every record declared under `metadata/` named by the shipped chain?
 *
 * Collects every `primaryKey.ID` UUID under `metadata/` and checks each appears somewhere in
 * `migrations/*.sql`. No database, no dependencies, runs on any checkout.
 *
 * WHY THIS EXISTS, AND WHAT IT REPLACED. The gate here used to compare `metadata/` against a
 * checked-in hash manifest and infer "the seed ships this record" from the PRESENCE OF A MANIFEST
 * KEY. That inference is a silent pass in one direction: regenerate the manifest without
 * regenerating the seed and the gate goes green while the record ships nowhere. bizapps-sales hit
 * exactly that (MemberJunction/bizapps-forms#105). This checks the property the manifest was a
 * proxy for, and it needs nothing kept up to date — it reproduces the "what is still pending" list
 * from the repo itself.
 *
 * NOT A PR GATE, deliberately. PRs contribute declarative JSON only; the build engineer generates
 * ONE consolidated `Metadata_Sync` per release from a clean database (migrations/README.md). Wiring this into every PR would re-impose the per-PR
 * cadence that release-time metadata sync rules out. It runs at the release boundary —
 * `publish.yml`, before anything is published or tagged — and by hand when you cut the seed.
 * `lint:distribution` (scripts/check-distribution-seed.mjs) is the PR-time gate, and it checks only
 * placeholders; it does not invoke this.
 *
 *   pnpm run check:release-seed
 *
 * ITS SELF-TEST RUNS WHERE IT DOES, AND NOWHERE ELSE. `check-release-seed-coverage.spec.mjs` runs
 * immediately before this script in `publish.yml`, not on pull requests. That is not an oversight
 * to correct later: this check only ever runs at a release, so a PR that weakened its spec could
 * only matter at a release — which is precisely where the spec runs, as the baseline, before any
 * result here is believed. Adding a second run on PRs would buy one release of earlier warning for
 * a permanently duplicated step.
 *
 * WHAT A PASS DOES AND DOES NOT MEAN. A pass says every declared record id is named by the shipped
 * SQL — it does not say the seed CREATES it correctly, because a match counts wherever the id
 * appears, including inside a comment. That is deliberate: the id can ship as `'<guid>'`, `N'<guid>'`
 * or either case, and a second SQL parser to distinguish those shapes would be more to own than the
 * question is worth, while a false negative here costs a build engineer an hour chasing a record
 * that did ship. The proof that a seed installs correctly is a clean install from migrations, which
 * needs a database and is release work.
 *
 * IT CANNOT SEE AN EDITED RECORD, and that is the limit worth knowing before trusting a green. It
 * reads ids, not content: change the body of a record whose id already ships and this stays quiet.
 * The retired hash manifest saw the edit but not whether any seed carried it, which is the failure
 * that retired it, so this is not ground lost. What covers edits is the release push itself:
 * `mj sync push` against a clean database diffs the database and emits `spUpdate*` for every
 * changed record by construction. This is the pre-flight for the new-record case; the push is the
 * mechanism. `check-release-seed-cadence.mjs` narrows the edited-record gap by ORDER — it fails when a
 * record changed after the last release with no seed, or after the seed itself — but it does not read
 * seed content either; a clean-database replay of the chain is what proves the edit ships.
 *
 * `migrations/` only, NOT `migrations-pg/`. A record present only in the PostgreSQL twin has not
 * shipped on the chain every host runs; counting it would report coverage this app does not have.
 *
 * SONAR'S HISTORY. Sonar shipped its v0.1 metadata as `V202607142340__v0.1.x_Seed_App_Metadata.sql`
 * (released, FROZEN — never edit it) and then, for a while, as hand-written forward migrations
 * policed by a per-PR content-hash manifest. Both are append-only history now and both still
 * count here: an id is covered wherever the shipped chain names it. From here on the only new
 * metadata-delivering file is the release `Metadata_Sync`.
 *
 * Ported from bizapps-common, itself ported from bizapps-forms (MemberJunction/bizapps-forms#105 and
 * MemberJunction/bizapps-forms#108).
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Directories under `metadata/` that are generator output rather than source.
 *
 * `sql_logging/` is the raw `mj sync push` log that BECOMES a seed. `.backups/` is what a push
 * writes before updating a record in place — every `.mj-sync.json` here sets `backupBeforeUpdate`
 * with `backupDirectory: ".backups"`, so a local push creates them. Reading either would report ids
 * nobody declared, on the very push that regenerated the seed.
 *
 * Only `metadata/sql_logging` is gitignored (`.gitignore`); `.backups` is not, so it is excluded
 * here on the strength of what it IS, not on git's opinion of it.
 */
const IGNORED_DIRS = new Set(['sql_logging', '.backups']);

/** `.mj-sync.json` is directory configuration (entity name, order, pull filters) — never a record. */
const NOT_A_RECORD_FILE = '.mj-sync.json';

const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/** Every record file under `metadata/`, sorted, excluding generator output. */
function collectRecordFiles(dir, acc = []) {
    // `withFileTypes` answers "directory or not?" from the directory entry, with no stat syscall —
    // which is also what stops a DANGLING SYMLINK killing the walk. `statSync` follows the link and
    // throws ENOENT when the target is gone, so the run died with a node stack trace instead of a
    // verdict, naming nothing. A dangling entry now falls through to the reader below and is
    // reported like any other file that cannot be read.
    //
    // One deliberate consequence: a symlink POINTING AT a directory is no longer traversed, because
    // a Dirent reports it as a symlink rather than a directory. `metadata/` has none, following one
    // was never intended, and not following them also means this walk cannot be sent round a loop.
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            if (!IGNORED_DIRS.has(entry.name)) collectRecordFiles(full, acc);
        } else if (entry.name.endsWith('.json') && entry.name !== NOT_A_RECORD_FILE) {
            acc.push(full);
        }
    }
    return acc;
}

/**
 * Every `primaryKey.ID` in a parsed record file, at any nesting depth.
 *
 * Recursive rather than array-of-records because `@parent` nesting puts child records inside a
 * `relatedEntities` block, and a child that ships nowhere is as invisible to a host as a root one.
 */
function collectIds(node, acc) {
    if (Array.isArray(node)) {
        for (const item of node) collectIds(item, acc);
        return;
    }
    if (!node || typeof node !== 'object') return;
    const pk = node.primaryKey;
    if (pk && typeof pk.ID === 'string' && UUID.test(pk.ID.trim())) acc.push(pk.ID.trim());
    for (const value of Object.values(node)) collectIds(value, acc);
}

/** The shipped SQL as one lower-cased haystack, or `null` when there is none to read. */
// Top level only, deliberately: `migrations/` is flat here and `migrations/codegen/` is gitignored
// intermediate output that ships nothing. If that layout ever changes, this fails LOUDLY — every id
// reports as uncovered — rather than quietly missing the subdirectory that holds the real seed.
function readShippedSql(migrationsDir) {
    if (!existsSync(migrationsDir)) return null;
    const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
    if (files.length === 0) return null;
    return files.map((f) => readFileSync(join(migrationsDir, f), 'utf8')).join('\n').toLowerCase();
}

/**
 * Reports every way this repo's `metadata/` is not covered by its `migrations/`.
 *
 * A pure read, and every failure is a `problem` string rather than a throw, so one reporting path
 * serves all of them — a missing directory, an unparseable record file, an uncovered id and a run
 * that measured nothing are all things a build engineer needs told in the same breath.
 */
export function findSeedCoverageGaps(repoRoot = REPO_ROOT) {
    const metadataDir = join(repoRoot, 'metadata');
    const problems = [];
    if (!existsSync(metadataDir)) {
        return { problems: [`No metadata/ directory at ${metadataDir} — this is not a repo root.`], filesRead: 0, idsChecked: 0 };
    }

    const sql = readShippedSql(join(repoRoot, 'migrations'));
    if (sql === null) {
        return {
            problems: ['migrations/ is missing or contains no .sql files, so nothing could be covered. This is a broken run, not a finding.'],
            filesRead: 0,
            idsChecked: 0,
        };
    }

    let filesRead = 0;
    let idsChecked = 0;
    for (const file of collectRecordFiles(metadataDir)) {
        const shown = relative(repoRoot, file).split(sep).join('/');
        let parsed;
        try {
            // A leading U+FEFF is stripped: JSON.parse rejects it, `mj sync` and every other
            // reader accept it, so failing here would fail a file that is not actually wrong.
            parsed = JSON.parse(readFileSync(file, 'utf8').replace(/^﻿/, ''));
        } catch (error) {
            // Never skipped, and never collapsed into the vacuity message below: a record file this
            // script cannot read is a record it cannot vouch for, and the parser's reason is the
            // only thing that tells anyone which it is.
            problems.push(`${shown} could not be read as JSON, so its records were not checked: ${error.message}`);
            continue;
        }
        filesRead++;
        const ids = [];
        collectIds(parsed, ids);
        const unique = [...new Set(ids)];
        idsChecked += unique.length;
        const unseen = unique.filter((id) => !sql.includes(id.toLowerCase()));
        if (unseen.length > 0) {
            // EVERY id, not a count and a sample. This output IS the pending list — the thing that
            // replaced a table someone had to remember to append to — and a file that owes twelve
            // records while naming one sends the build engineer back to the repo to derive the rest,
            // which is the hand-maintenance this check exists to end.
            problems.push(
                `${shown}: ${unseen.length} of ${unique.length} declared IDs appear in NO migration —\n` +
                    unseen.map((id) => `      ${id}`).join('\n'),
            );
        }
    }

    /**
     * A probe that measures nothing must not report success. CHECK 1 was retired for passing while
     * asserting something false; a run that collected no ids at all — a moved directory, a renamed
     * `primaryKey` shape, a walk that matched nothing — is the same defect wearing this script's
     * name. Appended rather than returned early, so any parse failures that explain it are reported
     * alongside instead of being thrown away.
     */
    if (idsChecked === 0) {
        problems.push(
            `measured NOTHING: ${filesRead} readable record file(s) under metadata/ declared no primaryKey UUID. ` +
                'Either the metadata layout changed under this script or the walk is broken. A check that examined ' +
                'nothing is not a check that passed.',
        );
    }

    return { problems, filesRead, idsChecked };
}

if (process.argv[1] && process.argv[1].endsWith('check-release-seed-coverage.mjs')) {
    const { problems, filesRead, idsChecked } = findSeedCoverageGaps();

    if (problems.length > 0) {
        console.error('\n❌ Release seed coverage failed — metadata declared here reaches no host:\n');
        for (const problem of problems) console.error(`  • ${problem}`);
        console.error(
            '\nGenerate the release `Metadata_Sync` migration (migrations/README.md) and re-run. This is the ' +
                'consolidated seed for the release, not a per-PR one.\n',
        );
        process.exit(1);
    }

    console.log(
        `✅ Release seed coverage passed — all ${idsChecked} primaryKey UUIDs across ${filesRead} metadata record ` +
            'file(s) appear in migrations/.',
    );
}
