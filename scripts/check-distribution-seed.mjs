#!/usr/bin/env node
/**
 * Distribution gate — placeholders `mj app install` cannot resolve, in every SQL set Sonar ships.
 *
 * Sonar follows MJ's release-time metadata model (MJ/guides/RELEASE_METADATA_MIGRATIONS_GUIDE.md,
 * MJ/metadata/CLAUDE.md §1b), the same as bizapps-sales, bizapps-common and bizapps-forms.
 * `mj-app.json`'s `metadata.directory` is a dev-time pointer: the install engine NEVER reads it, and
 * seeding happens exclusively through `migrations/`. PRs contribute declarative JSON only; the build
 * engineer generates ONE consolidated `Metadata_Sync` per release from a clean database. So this
 * PR-time gate does NOT ask whether metadata is current with a seed — between releases it never is,
 * by design. That question is asked at the release, in publish.yml, by
 * `check-release-seed-coverage.mjs` and `check-release-seed-cadence.mjs`.
 *
 * What used to live here as CHECK 1 — a content-hash manifest (`migrations/metadata-seed.manifest.json`)
 * that failed every PR whose metadata had no hand-written forward migration — is retired. It made
 * every metadata-only PR red, it demanded hand-written metadata SQL, and it inferred "shipped" from a
 * hash file that could be regenerated without shipping anything (MemberJunction/bizapps-forms#105).
 *
 * What this file still checks, because MJ has no equivalent and the failure is silent:
 *
 *   `mj migrate` builds Skyway's placeholder map from THIS repo's mj.config.cjs, but
 *   `mj app install` builds it from the HOST's. Only `${flyway:defaultSchema}` and `${mjSchema}`
 *   are supplied by the install engine itself. Skyway leaves an unknown `${...}` UNTOUCHED rather
 *   than failing, so a third placeholder ships as a literal string into whatever SQL contained it.
 *   Sonar ships two dialects (`migrations/` + `migrations-pg/`) and two teardown sets — all four
 *   are scanned; teardown scripts get the even smaller map (MJ substitutes ONLY ${mjSchema} there).
 *
 * Ported from bizapps-sales (itself from bizapps-forms), extended to both dialects.
 *
 * Read-only. No --fix. Exits non-zero on any violation. Node stdlib only, so it runs in CI
 * without an install step.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

/** The only placeholders `mj app install` resolves in versioned migrations. */
const INSTALL_SUPPLIED_PLACEHOLDERS = new Set(['flyway:defaultSchema', 'mjSchema']);

// ---------------------------------------------------------------------------
// Shipped SQL uses only placeholders the install engine supplies (both dialects + teardown)
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
// Entry point. Skipped when imported (by the spec).
// ---------------------------------------------------------------------------

/** Runs the placeholder check against a repo root and returns the violations found. */
export function runChecks(repoRoot = REPO_ROOT) {
    const violations = [];
    checkPlaceholders(repoRoot, violations);
    return violations;
}

if (process.argv[1] && process.argv[1].endsWith('check-distribution-seed.mjs')) {
    const violations = runChecks();

    if (violations.length > 0) {
        console.error('\n❌ Distribution gate failed — shipped SQL uses a placeholder `mj app install` cannot resolve:\n');
        for (const v of violations) console.error(`  • ${v}`);
        console.error('');
        process.exit(1);
    }
    console.log('✅ Distribution gate passed — shipped SQL (both dialects + teardown) uses only install-supplied placeholders.');
}
