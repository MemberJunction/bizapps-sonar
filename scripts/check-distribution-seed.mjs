#!/usr/bin/env node
/**
 * Distribution gate — can a stranger install this app and get a working one?
 *
 * Ported from bizapps-sales (itself ported from bizapps-forms, where both failures below were
 * live and invisible from inside: everything built, every test passed, and the app worked on the
 * one machine that had run `mj sync push` by hand).
 *
 * CHECK 1 — METADATA IS DELIVERED BY MIGRATIONS AND THE MANIFEST IS CURRENT.
 *   `mj-app.json`'s `metadata.directory` is documentation: MJ's install engine NEVER reads it, and
 *   seeding happens exclusively through `migrations/`. Sonar's model is a FROZEN v0.1 seed
 *   (`V202607142340__v0.1.x_Seed_App_Metadata.sql`) plus forward migrations for every later
 *   metadata change (see migrations/README.md — the seed is never regenerated). The manifest of
 *   content hashes therefore means "metadata state as of the last DELIVERING migration": when a
 *   metadata file changes without a matching forward migration + `pnpm run seed:manifest`, the
 *   change ships nowhere and this gate fires.
 *
 *   A hash manifest answers the question that matters ("is the shipped state current with the
 *   metadata?") rather than a proxy ("did both change in the same PR?" — which changes.yml's
 *   tripwire also asks), and it works on any checkout including CI's shallow clones.
 *
 * CHECK 2 — NO UNRESOLVABLE PLACEHOLDERS IN SHIPPED SQL, BOTH DIALECTS.
 *   `mj migrate` builds Skyway's placeholder map from THIS repo's mj.config.cjs, but
 *   `mj app install` builds it from the HOST's. Only `${flyway:defaultSchema}` and `${mjSchema}`
 *   are supplied by the install engine itself. Skyway leaves an unknown `${...}` UNTOUCHED rather
 *   than failing, so a third placeholder ships as a literal string into whatever SQL contained it.
 *   Sonar ships two dialects (`migrations/` + `migrations-pg/`) and two teardown sets — all four
 *   are scanned; teardown scripts get the even smaller map (MJ substitutes ONLY ${mjSchema} there).
 *
 * Read-only. No --fix. Exits non-zero on any violation. Node stdlib only, so it runs in CI
 * without an install step.
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

/** The only placeholders `mj app install` resolves in versioned migrations. */
const INSTALL_SUPPLIED_PLACEHOLDERS = new Set(['flyway:defaultSchema', 'mjSchema']);

/** Migrations that deliver metadata: the frozen v0.1 seed, or any later forward sync migration. */
const SEED_PATTERN = /(Seed_App_Metadata|Metadata_Sync).*\.sql$/i;

/**
 * `metadata/sql_logging/` is raw generator output, `.backups/` is what `mj sync push` writes
 * before updating a record in place, and `schema-info/` is pulled entity-schema documentation —
 * none are record content an install delivers, and hashing them would make the gate fire on the
 * very push that delivered the change.
 */
const METADATA_IGNORED_DIRS = new Set(['sql_logging', '.backups', 'schema-info']);

/**
 * `README.md` is documentation for humans; `.mj-sync.json` is push CONFIGURATION (directory
 * order, file patterns, defaults baked into records at push time), which changes.yml's
 * metadata↔migration tripwire also excludes. Neither is record content.
 */
const METADATA_IGNORED_FILES = new Set(['README.md', '.mj-sync.json']);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Every file under `metadata/`, repo-relative and sorted, excluding generator output. */
function collectMetadataFiles(dir, acc = []) {
    for (const name of readdirSync(dir).sort()) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) {
            if (!METADATA_IGNORED_DIRS.has(name)) collectMetadataFiles(full, acc);
        } else if (!METADATA_IGNORED_FILES.has(name)) {
            acc.push(full);
        }
    }
    return acc;
}

/**
 * Hash of a metadata file's MEANING, not its bytes.
 *
 * `mj sync push` writes a `sync` block (lastModified + checksum) back into each record after a
 * push. Those are bookkeeping about the push, not content — hashing them would make the gate fire
 * on the very push that delivered the change. Stripped for JSON; other files hash whole.
 */
function contentHash(file) {
    const raw = readFileSync(file, 'utf-8');
    if (!file.endsWith('.json')) return createHash('sha256').update(raw).digest('hex');
    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch {
        // Unparseable JSON is a real problem, but not this gate's to diagnose — hash the bytes so
        // it still registers as a change rather than being silently skipped.
        return createHash('sha256').update(raw).digest('hex');
    }
    const strip = (node) => {
        if (Array.isArray(node)) return node.map(strip);
        if (node && typeof node === 'object') {
            return Object.fromEntries(
                Object.entries(node)
                    .filter(([k]) => k !== 'sync')
                    .map(([k, v]) => [k, strip(v)]),
            );
        }
        return node;
    };
    return createHash('sha256').update(JSON.stringify(strip(parsed))).digest('hex');
}

export function buildManifest(repoRoot = REPO_ROOT) {
    const files = {};
    for (const file of collectMetadataFiles(join(repoRoot, 'metadata'))) {
        files[relative(repoRoot, file)] = contentHash(file);
    }
    return { generatedFrom: 'metadata/', files };
}

// ---------------------------------------------------------------------------
// CHECK 1 — a delivering migration exists and the manifest matches the metadata
// ---------------------------------------------------------------------------

function checkSeedMigration(repoRoot, violations) {
    const MIGRATIONS_DIR = join(repoRoot, 'migrations');
    const MANIFEST_PATH = join(MIGRATIONS_DIR, 'metadata-seed.manifest.json');
    const seeds = readdirSync(MIGRATIONS_DIR).filter((f) => SEED_PATTERN.test(f));
    if (seeds.length === 0) {
        violations.push(
            'No metadata-delivering migration (`*Seed_App_Metadata*.sql` / `*Metadata_Sync*.sql`) in ' +
                'migrations/. Everything under metadata/ ships NOWHERE: MJ never reads mj-app.json\'s ' +
                'metadata.directory at install.',
        );
        return;
    }

    if (!existsSync(MANIFEST_PATH)) {
        violations.push(
            `Delivering migration(s) present (${seeds.join(', ')}) but ${relative(repoRoot, MANIFEST_PATH)} is ` +
                'missing, so nothing can tell whether the shipped state is current. Run `pnpm run seed:manifest`.',
        );
        return;
    }

    const recorded = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')).files ?? {};
    const current = buildManifest(repoRoot).files;

    const FIX =
        'Write a NEW forward migration for both dialects (the v0.1 seed is frozen — never regenerate it; ' +
        'see migrations/README.md), then `pnpm run seed:manifest`.';
    for (const [file, hash] of Object.entries(current)) {
        if (!(file in recorded)) {
            violations.push(`${file} is new metadata that no migration delivers. ${FIX}`);
        } else if (recorded[file] !== hash) {
            violations.push(`${file} changed since the last delivering migration, so the change ships nowhere. ${FIX}`);
        }
    }
    for (const file of Object.keys(recorded)) {
        if (!(file in current)) {
            violations.push(`${file} was deleted but shipped migrations still create its records. ${FIX}`);
        }
    }
}

// ---------------------------------------------------------------------------
// CHECK 2 — shipped SQL uses only placeholders the install engine supplies (both dialects)
// ---------------------------------------------------------------------------

function checkPlaceholders(repoRoot, violations) {
    const dirs = [
        join(repoRoot, 'migrations'),
        join(repoRoot, 'migrations-pg'),
        join(repoRoot, 'migrations-teardown'),
        join(repoRoot, 'migrations-teardown-pg'),
    ];
    for (const dir of dirs) {
        if (!existsSync(dir)) continue;
        // Teardown scripts get an even smaller map — MJ substitutes ONLY ${mjSchema} there, with a
        // literal string split, no Skyway involved.
        const allowed = /migrations-teardown(-pg)?$/.test(dir) ? new Set(['mjSchema']) : INSTALL_SUPPLIED_PLACEHOLDERS;
        for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql'))) {
            const sql = readFileSync(join(dir, file), 'utf-8');
            const seen = new Set();
            for (const match of sql.matchAll(/\$\{([^}]+)\}/g)) {
                const name = match[1];
                if (!allowed.has(name) && !seen.has(name)) {
                    seen.add(name);
                    violations.push(
                        `${relative(repoRoot, join(dir, file))} uses \${${name}}, which \`mj app install\` does not ` +
                            `supply (it resolves only ${[...allowed].map((p) => '${' + p + '}').join(' and ')}). Skyway leaves ` +
                            'unknown placeholders untouched, so this would ship as a literal string. Use a literal schema name instead.',
                    );
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Entry point. Skipped when imported (by seed:manifest, which reuses buildManifest).
// ---------------------------------------------------------------------------

/** Runs both checks against a repo root and returns the violations found. */
export function runChecks(repoRoot = REPO_ROOT) {
    const violations = [];
    checkSeedMigration(repoRoot, violations);
    checkPlaceholders(repoRoot, violations);
    return violations;
}

if (process.argv[1] && process.argv[1].endsWith('check-distribution-seed.mjs')) {
    const violations = runChecks();

    if (violations.length > 0) {
        console.error('\n❌ Distribution gate failed — this app would not install correctly on someone else\'s database:\n');
        for (const v of violations) console.error(`  • ${v}`);
        console.error('');
        process.exit(1);
    }
    console.log('✅ Distribution gate passed — metadata is delivered and current; shipped SQL (both dialects) uses only install-supplied placeholders.');
}
