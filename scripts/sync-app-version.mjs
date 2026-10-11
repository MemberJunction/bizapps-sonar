#!/usr/bin/env node
/**
 * Keep `mj-app.json`'s `version` and `mjVersionRange` derived from `packages/Entities/package.json`.
 *
 * This lived as an inline bash block in publish.yml, where it ran *after* `changeset version` and
 * was committed by a push straight to `main`. bizapps-forms #177 removed that push, so the derivation has to
 * happen where the version bump now happens — on the release pull request — and CI's job changes
 * from performing it to checking it. `--check` is that half: a hand-edited mj-app.json, or a
 * release PR that forgot `pnpm run version`, fails before anything is published.
 *
 * Both halves are the same function on purpose. A separate checker is a second copy of the
 * derivation rule, and the two drift.
 *
 * Plain Node, stdlib only.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The MJ package whose pin decides the supported range. */
const MJ_ANCHOR = '@memberjunction/core';

/**
 * `mj-app.json`'s derived fields, from the entities package's own manifest.
 *
 * `mjVersionRange` is `>=<pin> <(major+1).0.0>`, the pinning model: an app
 * supports the MJ line it is built against, up to but not including the next major.
 */
export function deriveAppFields(entitiesPkg) {
    const version = entitiesPkg?.version;
    if (!version) {
        throw new Error('packages/Entities/package.json has no version — cannot derive mj-app.json');
    }
    const pin = entitiesPkg.dependencies?.[MJ_ANCHOR] ?? entitiesPkg.peerDependencies?.[MJ_ANCHOR];
    if (!pin) {
        throw new Error(
            `packages/Entities/package.json declares no ${MJ_ANCHOR} in dependencies or peerDependencies — ` +
                'mjVersionRange has no input to derive from',
        );
    }
    // Strips a range operator (`^`, `~`, `>=`) to reach the floor version. Anything that leaves no
    // `major.minor.patch` behind (`workspace:*`, `latest`, `*`) has no floor to derive from; without
    // this guard it became `NaN.0.0` (or `>= <1.0.0`, since Number('') is 0) in the mj-app.json a
    // host installs against.
    const min = pin.replace(/^[^0-9]*/, '');
    const floor = /^(\d+)\.\d+\.\d+/.exec(min);
    if (!floor) {
        throw new Error(
            `packages/Entities/package.json pins ${MJ_ANCHOR} to ${JSON.stringify(pin)}, which names no ` +
                'major.minor.patch version — mjVersionRange needs a concrete floor. Pin a real version (e.g. ^6.1.5).',
        );
    }
    const nextMajor = `${Number(floor[1]) + 1}.0.0`;
    return { version, mjVersionRange: `>=${min} <${nextMajor}` };
}

/**
 * Sync (or, with `check`, verify) `mj-app.json` against the entities package.
 *
 * Returns the mismatches found. Writing mode returns `[]` because it has just removed them.
 */
export function syncAppVersion({ root = REPO_ROOT, check = false } = {}) {
    const appPath = join(root, 'mj-app.json');
    const app = JSON.parse(readFileSync(appPath, 'utf8'));
    const derived = deriveAppFields(
        JSON.parse(readFileSync(join(root, 'packages', 'Entities', 'package.json'), 'utf8')),
    );

    const mismatches = Object.entries(derived)
        .filter(([field, expected]) => app[field] !== expected)
        .map(
            ([field, expected]) =>
                `mj-app.json ${field} is ${JSON.stringify(app[field])}, expected ${JSON.stringify(expected)}`,
        );

    if (check || mismatches.length === 0) {
        return mismatches;
    }
    writeFileSync(appPath, JSON.stringify({ ...app, ...derived }, null, 2) + '\n');
    return [];
}

/** CLI entry point. */
function main() {
    const check = process.argv.includes('--check');
    const mismatches = syncAppVersion({ check });
    if (mismatches.length > 0) {
        console.error('mj-app.json is out of sync with packages/Entities/package.json:\n');
        for (const m of mismatches) {
            console.error(`  ✗ ${m}`);
        }
        console.error('\nRun `pnpm run version` on the release branch and commit the result.');
        process.exit(1);
    }
    console.log(check ? 'mj-app.json is in sync.' : 'mj-app.json synced.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    // A derivation that cannot run (no version, an unusable MJ pin, an unreadable manifest) is a
    // failure with a message, not a stack trace: the release PR's author has to know which input to fix.
    try {
        main();
    } catch (error) {
        console.error(`sync-app-version: ${error.message}`);
        process.exit(1);
    }
}
