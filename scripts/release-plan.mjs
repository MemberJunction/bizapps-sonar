#!/usr/bin/env node
/**
 * What work does this release run still have to do?
 *
 * The step this replaces asked ONE question — is `packages/Entities`'s version on npm? — and hung
 * both remaining actions off the answer. That conflates two independent facts, and bizapps-forms #187's review
 * found the state where they disagree: `changeset publish` publishes the unpublished set with
 * `Promise.all`, so one package landing while a sibling fails is a state it produces BY DESIGN and
 * expects a retry to finish (it skips already-published packages). The old signal read that state
 * as "done", so the retry skipped publish AND tag and reported success — leaving packages
 * unpublished and no `v<version>` tag, which `check-release-seed-cadence.mjs` then reads as
 * "this release never shipped" at the NEXT release.
 *
 * So the two facts are answered separately, and each gates its own step:
 *
 *   publish — is ANY publishable package missing this version from npm?
 *   tag     — is the `v<version>` tag absent?
 *
 * A run is a no-op only when both are false. That makes a retry after ANY partial failure finish
 * the job, which is the property the design this replaced had for free (its signal was un-consumed
 * changesets on the remote, removed by a single write after publish and tag) and this one had lost.
 *
 * It is a script rather than inline bash for the reason `sync-app-version.mjs` is: a decision that
 * only ever runs inside a release cannot be proven by running a release. Plain Node, stdlib only.
 */
import { readdirSync, readFileSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The workspace packages a release actually publishes: everything under `packages/` that is not
 * `private`. Derived rather than listed, so a new package joins the release without a second edit.
 */
export function publishablePackages(root = REPO_ROOT) {
    const packagesDir = join(root, 'packages');
    return readdirSync(packagesDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(packagesDir, entry.name, 'package.json'))
        .flatMap((manifestPath) => {
            let manifest;
            try {
                manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
            } catch (error) {
                if (error.code === 'ENOENT') {
                    return [];
                }
                throw new Error(`release-plan cannot read ${manifestPath}: ${error.message}`, { cause: error });
            }
            return manifest.private === true ? [] : [{ name: manifest.name, version: manifest.version }];
        });
}

/**
 * The plan, as a pure function of facts the caller gathered.
 *
 * `published` maps a package name to the versions npm reports for it; a name absent from the map
 * has none. `tagExists` is whether `v<version>` is already a tag.
 */
export function planRelease({ packages, published, tagExists }) {
    if (!Array.isArray(packages) || packages.length === 0) {
        throw new Error('release-plan found no publishable packages — refusing to decide a release blind');
    }
    for (const pkg of packages) {
        if (!pkg?.name || !pkg?.version) {
            throw new Error(`release-plan: ${JSON.stringify(pkg)} has no name or no version`);
        }
    }

    // `fixed` in .changeset/config.json moves every @mj-biz-apps package together, so divergent
    // versions mean the bump did not happen as a unit — and there is no single version to tag.
    const versions = [...new Set(packages.map((p) => p.version))];
    if (versions.length > 1) {
        throw new Error(
            `release-plan: packages disagree about the version (${versions.join(', ')}). ` +
                "They are one `fixed` group — run `pnpm run version` on the release branch.",
        );
    }

    const version = versions[0];
    const unpublished = packages.filter((p) => !(published[p.name] ?? []).includes(p.version)).map((p) => p.name);
    const publish = unpublished.length > 0;
    const tag = !tagExists;
    return { version, unpublished, publish, tag, work: publish || tag };
}

/** Versions npm reports for `name`. Throws when the registry cannot be reached. */
function publishedVersions(name) {
    let raw;
    try {
        raw = execFileSync('npm', ['view', name, 'versions', '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
        // npm exits non-zero for a package that has never been published AND for a registry it
        // cannot reach. The two must not be conflated: reading an outage as "nothing is published"
        // would republish a released version. E404 is the only refusal that means "not there".
        const stderr = String(error.stderr ?? '');
        if (/E404|404 Not Found/.test(stderr)) {
            return [];
        }
        throw new Error(`release-plan could not reach the npm registry to ask about ${name}: ${stderr.trim() || error.message}`, {
            cause: error,
        });
    }
    const parsed = JSON.parse(raw);
    // npm returns a bare JSON string, not an array, for a package with exactly one version.
    return Array.isArray(parsed) ? parsed : [parsed];
}

/**
 * Whether `v<version>` is already a tag here. The job checks out with `fetch-tags: true`.
 *
 * `rev-parse -q --verify` answers "no such ref" with exit 1 and nothing else. Any other failure
 * (not a repository, a broken object store, no git at all) is "could not tell", and reading that as
 * "absent" would push a tag on a guess — so it throws, as `publishedVersions` does for npm.
 */
export function tagExistsLocally(version, cwd = REPO_ROOT) {
    const ref = `refs/tags/v${version}`;
    try {
        execFileSync('git', ['rev-parse', '-q', '--verify', ref], { cwd, stdio: ['ignore', 'ignore', 'pipe'] });
        return true;
    } catch (error) {
        if (error.status === 1) {
            return false;
        }
        const stderr = String(error.stderr ?? '').trim();
        throw new Error(`release-plan could not ask git whether ${ref} exists in ${cwd}: ${stderr || error.message}`, {
            cause: error,
        });
    }
}

/**
 * Where the plan's `key=value` lines go. In a workflow that is the step-output file; run locally
 * there is none, so they go to `write` (stdout) and the developer sees what a workflow would get.
 */
export function emitOutputs(outputs, env, write) {
    if (env.GITHUB_OUTPUT) {
        appendFileSync(env.GITHUB_OUTPUT, outputs);
    } else {
        write(outputs);
    }
}

/** CLI entry point: gather the facts, print the plan, write it to GITHUB_OUTPUT. */
function main() {
    const packages = publishablePackages();
    const published = Object.fromEntries(packages.map((p) => [p.name, publishedVersions(p.name)]));
    const plan = planRelease({ packages, published, tagExists: tagExistsLocally(packages[0].version) });

    console.log(`Releasing v${plan.version}`);
    console.log(plan.publish ? `  to publish: ${plan.unpublished.join(', ')}` : '  all packages are already on npm');
    console.log(plan.tag ? `  to tag: v${plan.version}` : `  v${plan.version} is already tagged`);
    if (!plan.work) {
        console.log(`Nothing to do — v${plan.version} is fully released.`);
    }

    emitOutputs(
        `VERSION=${plan.version}\npublish=${plan.publish}\ntag=${plan.tag}\nwork=${plan.work}\n`,
        process.env,
        (text) => process.stdout.write(text),
    );
    if (process.env.GITHUB_STEP_SUMMARY && !plan.work) {
        appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Nothing to release — v${plan.version} is already published and tagged\n`);
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main();
}
