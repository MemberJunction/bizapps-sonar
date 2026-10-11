#!/usr/bin/env node
/**
 * Can a release be cut from this checkout — and, with `--apply`, the LOCAL half of cutting one.
 *
 * Ported from bizapps-forms, where #177 deleted the release automation rather than fix it: once #173
 * made seven checks required on both `main` and `next`, every push CI made to a protected branch
 * became unsatisfiable by construction (GH013, because required checks are evaluated against check
 * runs present on the SHA being introduced). bizapps-forms #225/#226 restored the flow without
 * weakening that rule, and Sonar uses the restored form: no protected branch is pushed, the work
 * moves to an UNPROTECTED `release/*` branch, and a pull request into `main` carries it the way a
 * human's does (docs/release.md).
 *
 * The split of labour is the load-bearing part of this file. This script decides and mutates the
 * WORKING TREE; it performs no push, no GitHub API call and no network write of any kind. The
 * workflow owns every remote identity. That is what keeps the decision rehearsable: `--plan` runs on
 * a developer's laptop and answers "is a release due?" without touching anything, and a decision
 * that only ever executed inside a release could never be proven by running a release — the same
 * reason sync-app-version.mjs and release-plan.mjs are scripts rather than inline workflow bash.
 *
 * Where the three release scripts divide:
 *   release-prep.mjs  (here)  before the bump — may we cut one, and what version is it?
 *   sync-app-version.mjs      during the bump — mj-app.json's derived fields.
 *   release-plan.mjs          after the merge — is there still publishing or tagging left to do?
 *
 * Plain Node, stdlib only: a gate that guards the release must run in CI without installing
 * anything.
 */
import { readdirSync, readFileSync, appendFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { join, dirname, delimiter } from 'node:path';
import { fileURLToPath } from 'node:url';
import { publishablePackages } from './release-plan.mjs';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The package whose version is the group's, matching sync-app-version.mjs's anchor. */
const VERSION_ANCHOR = join('packages', 'Entities', 'package.json');

/**
 * The release-readiness gates, and what a failure of each one MEANS. The text matters as much as
 * the exit code: these run at the one moment nobody wants to read a stack trace, and "exit 1" from
 * a script the reader has never opened is not an instruction.
 *
 * They are the two seed-cadence checks publish.yml also runs at release time, plus the shipped-SQL
 * and PostgreSQL-parity gates. Running them HERE moves every one of them before the release PR is
 * even opened, where the fix is a commit rather than a red publish run over a merged promotion.
 */
const GATE_MEANINGS = Object.freeze({
    'lint:distribution': 'shipped SQL uses only resolvable placeholders. The gate names the file and the rule; an unknown ${...} placeholder is left as a literal by Skyway and only fails on SOMEBODY ELSE\'S database.',
    'check:release-seed': 'every metadata primaryKey UUID ships in a migration. A record declaring a primaryKey that no shipped migration names would ship a record no host ever receives. migrations/README.md has the consolidated-seed recipe.',
    'check:seed-cadence': 'exactly one consolidated Metadata_Sync seed is owed or present for this release. metadata/ moving with no seed ships none of it; two unreleased seeds is the per-PR cadence the release-seed model abolished. migrations/README.md.',
    'check:pg-parity': 'every migration has a T-SQL-free PG twin in migrations-pg/. A migration with no twin (or a twin still carrying T-SQL) breaks every PostgreSQL host at upgrade.',
});

/** The gate names, in the order a reader should see them. */
export const GATE_SCRIPTS = Object.freeze(Object.keys(GATE_MEANINGS));

/** Changeset bump levels, weakest first. `major` wins a tie-break against everything. */
const BUMP_RANK = Object.freeze({ patch: 1, minor: 2, major: 3 });

/**
 * WHY A STALE `main` BLOCKS THE *NEXT* RELEASE AND NOT ITS OWN — the one precondition here that
 * nothing else in the repo can tell you about.
 *
 * A release PR merges `next` → `main` and leaves a merge commit on `main` that `next` does not
 * contain; the `chore/backmerge-v<tag>` PR the publish workflow opens, and merges once its checks
 * pass, carries it back (docs/release.md). If that merge does not happen (the publish run went red
 * at the back-merge and nobody finished it), that costs the release that skipped it NOTHING — it has
 * already merged, published and tagged. The bill arrives at the FOLLOWING release: once the planned
 * required-checks/strict rules land (docs/release.md, admin setup), GitHub's `strict: true`
 * ("branch must be up to date with base") refuses to merge its PR, mid-release, after the version
 * bump is committed and the branch is pushed. Until those rules land nothing server-side refuses
 * it, so this check is the only thing holding the line.
 *
 * Asking the question here turns that into a precondition, answered before a branch exists.
 */
const STALE_MAIN_BLOCKER =
    'main is not contained in next — main carries commit(s) next does not have, so a release PR cut ' +
    'from this next would not contain everything main has. This check refuses it now; once the ' +
    'planned required-checks/strict rules land (docs/release.md, admin setup), GitHub will refuse to ' +
    'merge such a PR too (`strict: true`, "branch must be up to date with base"). This is almost ' +
    'always the PREVIOUS release\'s back-merge PR never having merged: publish.yml merges it ' +
    'automatically once its checks pass, so its publish run went red at the back-merge (a failing check, a refused merge, or a PR that was never opened). ' +
    'That release shipped fine and the cost lands here, on this one. Land the outstanding ' +
    '`chore/backmerge-v<last tag>` PR (main into next; docs/release.md step 4): if nothing was pushed ' +
    'to its branch (a flaky or timed-out check), re-run the failed checks, then re-run publish.yml on ' +
    'main and it merges; if anything was pushed to it (a conflict resolution or a fix), a human ' +
    'reviews it and merges the PR with a merge commit by hand. Then re-run this.';

/**
 * The strongest bump the changesets ask for, or `null` when none of them asks for one.
 *
 * `null` is a real state, not an error: a changeset with empty frontmatter is how changesets records
 * "this landed, it releases nothing". A directory of only those releases nothing either.
 */
export function maxBumpLevel(levels) {
    if (!Array.isArray(levels)) {
        throw new Error(`release-prep: bumpLevels must be an array, got ${typeof levels}`);
    }
    let strongest = null;
    for (const level of levels) {
        if (typeof level !== 'string' || !Object.hasOwn(BUMP_RANK, level)) {
            throw new Error(
                `release-prep: ${JSON.stringify(level)} is not a changeset bump level (patch, minor, major). ` +
                    'A level this script cannot read must stop the release, never be skipped — skipping one ' +
                    'under-bumps the version that actually publishes.',
            );
        }
        if (strongest === null || BUMP_RANK[level] > BUMP_RANK[strongest]) {
            strongest = level;
        }
    }
    return strongest;
}

/**
 * `currentVersion` plus one `level`.
 *
 * Pre-1.0 is deliberately NOT special-cased: changesets applies plain semver below 1.0 (0.10.0 +
 * minor is 0.11.0, + major is 1.0.0), and this repo is pre-1.0 today. A second copy of changesets'
 * rules is a thing that drifts, so the prediction is checked AGAINST the real bump as a
 * postcondition (`checkPostconditions`) rather than defended by cleverness here.
 */
export function incrementVersion(currentVersion, level) {
    const parts = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(currentVersion ?? ''));
    if (!parts) {
        throw new Error(
            `release-prep cannot increment ${JSON.stringify(currentVersion)}: it is not a plain ` +
                'MAJOR.MINOR.PATCH version. changesets only produces prerelease versions in `pre` mode, ' +
                'which this repo does not use — so this is a hand edit that needs a human.',
        );
    }
    if (!Object.hasOwn(BUMP_RANK, level)) {
        throw new Error(`release-prep: ${JSON.stringify(level)} is not a bump level (patch, minor, major)`);
    }
    const [major, minor, patch] = parts.slice(1).map(Number);
    if (level === 'major') return `${major + 1}.0.0`;
    if (level === 'minor') return `${major}.${minor + 1}.0`;
    return `${major}.${minor}.${patch + 1}`;
}

/**
 * Do these facts even describe a checkout? A separate question from what they mean, and answered
 * first: a blocker list derived from a malformed fact is worse than no answer, because it looks
 * exactly like an answer.
 *
 * Two inputs accept `null`, and it means "could not be determined" rather than "fine":
 * `publishedVersions` when the registry was unreachable, `mainIsAncestorOfNext` when neither branch
 * ref resolves. `assessRelease` blocks on both. Every other shape throws, here.
 */
function assertFactsAreWellFormed({
    changesetCount,
    currentVersion,
    tags,
    publishedVersions,
    mainIsAncestorOfNext,
    treeClean,
    gateResults,
}) {
    if (!Number.isInteger(changesetCount) || changesetCount < 0) {
        throw new Error(`release-prep: changesetCount must be a non-negative integer, got ${JSON.stringify(changesetCount)}`);
    }
    if (typeof currentVersion !== 'string' || currentVersion === '') {
        throw new Error(`release-prep: currentVersion must be a version string, got ${JSON.stringify(currentVersion)}`);
    }
    if (!Array.isArray(tags)) {
        throw new Error(`release-prep: tags must be an array, got ${typeof tags}`);
    }
    if (publishedVersions !== null && !Array.isArray(publishedVersions)) {
        throw new Error(`release-prep: publishedVersions must be an array or null (unreachable registry), got ${typeof publishedVersions}`);
    }
    if (typeof treeClean !== 'boolean') {
        throw new Error(`release-prep: treeClean must be a boolean, got ${typeof treeClean}`);
    }
    if (mainIsAncestorOfNext !== null && typeof mainIsAncestorOfNext !== 'boolean') {
        throw new Error(`release-prep: mainIsAncestorOfNext must be a boolean or null (refs unavailable), got ${typeof mainIsAncestorOfNext}`);
    }
    if (gateResults === null || typeof gateResults !== 'object') {
        throw new Error(`release-prep: gateResults must be an object of exit codes, got ${typeof gateResults}`);
    }
    for (const gate of GATE_SCRIPTS) {
        // A gate with no entry did not run, and a gate that did not run must never read as passing.
        if (!Number.isInteger(gateResults[gate])) {
            throw new Error(
                `release-prep: gateResults carries no exit code for \`${gate}\`. A gate that did not run ` +
                    'must not be read as a gate that passed.',
            );
        }
    }
}

/**
 * The whole decision, as a pure function of facts the caller gathered. No fs, no git, no network —
 * which is what lets every branch of it be tested without a repository to stand it up in.
 *
 * The blockers are collected rather than returned one at a time: cutting a release is a slow loop,
 * and finding the second problem only after fixing the first is how a release takes an afternoon.
 */
export function assessRelease(facts) {
    assertFactsAreWellFormed(facts);
    const { changesetCount, currentVersion, bumpLevels, tags, publishedVersions, mainIsAncestorOfNext, treeClean, gateResults } =
        facts;

    const bumpLevel = maxBumpLevel(bumpLevels);
    const version = bumpLevel === null ? null : incrementVersion(currentVersion, bumpLevel);
    const blockers = [];

    if (!treeClean) {
        blockers.push(
            'the working tree is not clean. The release commit is `git add -A`, so anything uncommitted ' +
                'here would ride along inside it — including files no reviewer of the release PR is ' +
                'expecting. Commit or stash first, then re-run.',
        );
    }

    if (changesetCount === 0) {
        blockers.push(
            `no changesets in .changeset/, so there is nothing to release. Either nothing has landed since ` +
                `v${currentVersion}, or \`pnpm run version\` has already consumed them on this branch — in ` +
                'which case the bump is already made and this step is done.',
        );
    } else if (bumpLevel === null) {
        blockers.push(
            `${changesetCount} changeset(s) are present but none declares a bump level, so there is no ` +
                'version to move to. A changeset with empty frontmatter releases nothing; add one that ' +
                'names a package and a level (`docs/release.md`).',
        );
    }

    for (const gate of GATE_SCRIPTS) {
        if (gateResults[gate] !== 0) {
            blockers.push(`\`npm run ${gate}\` failed (exit ${gateResults[gate]}): ${GATE_MEANINGS[gate]}`);
        }
    }

    if (version !== null) {
        if (tags.includes(`v${version}`)) {
            blockers.push(
                `v${version} is already a git tag, so the version this bump would produce has already been ` +
                    'released. Either a release was cut and its changesets were never removed, or the tag ' +
                    `belongs to a version this branch has not caught up with — \`git fetch origin\` and look ` +
                    `at what v${version} points at before cutting anything.`,
            );
        }
        if (publishedVersions === null) {
            blockers.push(
                `the npm registry could not be reached, so whether v${version} is already published is ` +
                    'unknown (the error is above). Publishing over a released version is not something to ' +
                    'guess at — re-run with the registry reachable.',
            );
        } else if (publishedVersions.includes(version)) {
            blockers.push(
                `v${version} is already on npm for at least one @mj-biz-apps package. A partially published ` +
                    'release is a state `changeset publish` produces by design and expects a RE-RUN of ' +
                    'publish.yml to finish (scripts/release-plan.mjs) — finish that one rather than cutting ' +
                    'a second release over it.',
            );
        }
    }

    if (mainIsAncestorOfNext === null) {
        blockers.push(
            'whether main is contained in next could not be determined — neither `origin/main`/`origin/next` ' +
                'nor local `main`/`next` resolve in this checkout. Run `git fetch origin main next`. This ' +
                'blocks rather than passes because the answer decides whether the release PR can merge at all.',
        );
    } else if (!mainIsAncestorOfNext) {
        blockers.push(STALE_MAIN_BLOCKER);
    }

    return {
        ready: blockers.length === 0,
        blockers,
        version,
        branch: version === null ? null : `release/v${version}`,
        currentVersion,
        bumpLevel,
        changesetCount,
        // Named separately because its fix — generate the ONE consolidated seed — is release work
        // rather than a code change, so a caller can route it without reading blocker prose.
        seedOwed: gateResults['check:seed-cadence'] !== 0,
    };
}

/**
 * The bump levels a single changeset file asks for.
 *
 * An unreadable frontmatter line throws rather than being skipped: a typo'd level that this parser
 * ignored would silently under-bump the version that publishes, and `major` quietly becoming `patch`
 * is the one mistake no downstream gate can see.
 */
export function parseChangesetLevels(text, label = '<changeset>') {
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n?---/.exec(String(text ?? ''));
    if (!frontmatter) {
        throw new Error(`release-prep: ${label} has no \`---\` frontmatter block — it is not a changeset`);
    }
    return frontmatter[1]
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            // `"@scope/pkg": minor` and `'@scope/pkg': minor` both occur in this repo's .changeset/.
            const entry = /^(['"]?)([^'"]+)\1\s*:\s*(\S+)$/.exec(line);
            if (!entry) {
                throw new Error(`release-prep: ${label} frontmatter line is not a \`"package": level\` entry: ${line}`);
            }
            return entry[3];
        });
}

/**
 * What must be true after `changeset version` has run, as a pure function so each one is testable.
 *
 * These exist because the version this script PREDICTS and the version changesets PRODUCES are
 * derived by two different pieces of code. They agree today; the postcondition is what notices the
 * day they stop, loudly and with both numbers, instead of pushing a branch named for one version
 * that contains another.
 */
export function checkPostconditions({ packages, expectedNames, predictedVersion, remainingChangesets, appSyncExitCode }) {
    const problems = [];
    const names = packages.map((p) => p.name).sort();
    const expected = [...expectedNames].sort();
    if (names.length === 0) {
        problems.push('no publishable packages are discoverable after the bump — the release has nothing in it');
    } else if (names.join(',') !== expected.join(',')) {
        problems.push(
            `the publishable package set changed across the bump: before [${expected.join(', ')}], ` +
                `after [${names.join(', ')}]`,
        );
    }

    const versions = [...new Set(packages.map((p) => p.version))];
    if (versions.length > 1) {
        problems.push(
            `the packages disagree about the version after the bump (${versions.join(', ')}). They are one ` +
                '`fixed` group in .changeset/config.json and must move together; there is no single version to tag.',
        );
    } else if (versions.length === 1 && versions[0] !== predictedVersion) {
        problems.push(
            `changeset version produced ${versions[0]}, but this run predicted ${predictedVersion} and the ` +
                'branch is named for the prediction. Do not push: work out which is right first (the ' +
                'prediction is maxBumpLevel + incrementVersion in this file).',
        );
    }

    if (appSyncExitCode !== 0) {
        problems.push(
            `\`node scripts/sync-app-version.mjs --check\` exits ${appSyncExitCode}: mj-app.json's version or ` +
                'mjVersionRange is not derived from packages/Entities. `pnpm run version` runs the sync, so a ' +
                'failure here means it did not run or its write was reverted.',
        );
    }

    if (remainingChangesets.length > 0) {
        problems.push(
            `${remainingChangesets.length} changeset file(s) survived the bump: ${remainingChangesets.join(', ')}. ` +
                'publish.yml refuses to publish while any remain, because their presence means the version was ' +
                'never consumed.',
        );
    }
    return problems;
}

// ── Fact gathering (impure; everything above is not) ────────────────────────────────────────────

/** git, with the failure turned into something a reader can act on. */
function git(root, args) {
    try {
        return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
        throw new Error(`release-prep: \`git ${args.join(' ')}\` failed: ${String(error.stderr ?? '').trim() || error.message}`, {
            cause: error,
        });
    }
}

/** `{ clean, paths }` for the working tree, including untracked files (`git add -A` takes those too). */
function readWorkingTree(root) {
    const paths = git(root, ['status', '--porcelain'])
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
    return { clean: paths.length === 0, paths };
}

/** The changeset files and the levels they ask for. `README.md` is documentation, not a changeset. */
function readChangesets(root) {
    const dir = join(root, '.changeset');
    let entries;
    try {
        entries = readdirSync(dir);
    } catch (error) {
        // Not "zero changesets": a checkout with no .changeset/ is not a checkout a release can be
        // cut from, and reporting "nothing to release" over it would be a lie with the same shape as
        // the truth.
        throw new Error(`release-prep cannot read ${dir}: ${error.message}`, { cause: error });
    }
    const files = entries.filter((name) => name.endsWith('.md') && name !== 'README.md').sort();
    const levels = files.flatMap((name) =>
        parseChangesetLevels(readFileSync(join(dir, name), 'utf8'), `.changeset/${name}`),
    );
    return { files, levels };
}

/** The version the group is at now. Same anchor sync-app-version.mjs derives mj-app.json from. */
function readCurrentVersion(root) {
    const path = join(root, VERSION_ANCHOR);
    const manifest = JSON.parse(readFileSync(path, 'utf8'));
    if (typeof manifest.version !== 'string' || manifest.version === '') {
        throw new Error(`release-prep: ${VERSION_ANCHOR} has no version — there is nothing to increment`);
    }
    return manifest.version;
}

/**
 * Every `v*` tag here.
 *
 * A checkout that fetched no tags reports none, which would quietly disarm the "already released"
 * blocker — except that `check:seed-cadence` fails outright when no `v*` tag exists ("no v* release
 * tag found"), so that checkout is blocked by a gate before it ever reaches this list.
 */
function readTags(root) {
    return git(root, ['tag', '--list', 'v*'])
        .split('\n')
        .map((tag) => tag.trim())
        .filter(Boolean);
}

/**
 * Versions npm already has for the group, as a union across every publishable package, or `null`
 * when the registry could not be answered.
 *
 * The union rather than the anchor alone: `changeset publish` publishes concurrently, so one package
 * carrying a version its siblings do not is a state it produces BY DESIGN (release-plan.mjs is about
 * exactly that), and in that state the anchor alone says the version is free when it is not.
 *
 * The E404 rule here is a second copy of release-plan.mjs's, which does not export its helper. It is
 * duplicated knowingly rather than by accident: npm exits non-zero both for a package that has never
 * been published and for a registry it cannot reach, and conflating those would republish a released
 * version. If a third caller ever needs it, lift it into a shared module then.
 */
function readPublishedVersions(packages) {
    const versions = new Set();
    for (const pkg of packages) {
        let raw;
        try {
            raw = execFileSync('npm', ['view', pkg.name, 'versions', '--json'], {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'pipe'],
            });
        } catch (error) {
            const stderr = String(error.stderr ?? '');
            if (/E404|404 Not Found/.test(stderr)) {
                continue;
            }
            return {
                versions: null,
                error: `could not ask the npm registry about ${pkg.name}: ${stderr.trim() || error.message}`,
            };
        }
        const parsed = JSON.parse(raw);
        // npm returns a bare string, not an array, for a package with exactly one version.
        for (const version of Array.isArray(parsed) ? parsed : [parsed]) {
            versions.add(version);
        }
    }
    return { versions: [...versions], error: null };
}

/** The first of `candidates` that resolves here, or `null`. */
function resolveRef(root, candidates) {
    for (const ref of candidates) {
        const run = spawnSync('git', ['rev-parse', '--verify', '--quiet', ref], { cwd: root, stdio: 'ignore' });
        if (run.status === 0) {
            return ref;
        }
    }
    return null;
}

/**
 * Is everything on `main` already on `next`? See STALE_MAIN_BLOCKER for why the answer matters.
 *
 * Remote-tracking refs first, because the merge that will refuse is the one GitHub performs against
 * the remote; the local branches are a fallback for a checkout that has them and nothing else.
 */
function readMainContainedInNext(root) {
    const main = resolveRef(root, ['origin/main', 'main']);
    const next = resolveRef(root, ['origin/next', 'next']);
    if (main === null || next === null) {
        return { value: null, detail: `unknown (main: ${main ?? 'unresolved'}, next: ${next ?? 'unresolved'})` };
    }
    const run = spawnSync('git', ['merge-base', '--is-ancestor', main, next], { cwd: root, encoding: 'utf8' });
    if (run.status === 0) return { value: true, detail: `${main} ⊆ ${next}` };
    if (run.status === 1) return { value: false, detail: `${main} has commits ${next} lacks` };
    throw new Error(
        `release-prep could not compare ${main} with ${next}: ${String(run.stderr ?? '').trim() || `exit ${run.status}`}`,
        { cause: run.error },
    );
}

/**
 * Run each gate and keep its exit code and output.
 *
 * The command comes from package.json rather than being re-typed here, so the gate this runs is the
 * gate CI runs by construction; a renamed script fails loudly below instead of silently dropping a
 * check. `node_modules/.bin` joins PATH because that is the one thing an npm script gets that a bare
 * shell does not, and a gate that grew a binary dependency would otherwise fail as "not found" and
 * read as a real gate failure.
 */
function runGates(root) {
    const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    const scripts = manifest.scripts ?? {};
    const env = { ...process.env, PATH: `${join(root, 'node_modules', '.bin')}${delimiter}${process.env.PATH ?? ''}` };
    const results = {};
    const output = {};
    for (const gate of GATE_SCRIPTS) {
        const command = scripts[gate];
        if (typeof command !== 'string') {
            throw new Error(
                `release-prep: package.json declares no \`${gate}\` script. This list and package.json have ` +
                    'drifted — one of them is wrong, and a release must not be judged with a gate missing.',
            );
        }
        const run = spawnSync(command, { cwd: root, shell: true, encoding: 'utf8', env });
        if (run.error) {
            throw new Error(`release-prep could not run the ${gate} gate (\`${command}\`): ${run.error.message}`, {
                cause: run.error,
            });
        }
        // A null status means a signal killed it, which is a failure and not a pass.
        results[gate] = run.status === null ? 1 : run.status;
        output[gate] = `${run.stdout ?? ''}${run.stderr ?? ''}`.trim();
    }
    return { results, output };
}

/** Everything `assessRelease` needs, plus the detail only the report prints. */
function gatherFacts(root) {
    const tree = readWorkingTree(root);
    const changesets = readChangesets(root);
    const packages = publishablePackages(root);
    const npm = readPublishedVersions(packages);
    if (npm.error !== null) {
        // Loud at the moment it happens, because the blocker it produces can only say "unknown".
        console.error(`⚠ release-prep: ${npm.error}`);
    }
    const ancestry = readMainContainedInNext(root);
    const gates = runGates(root);
    return {
        inputs: {
            changesetCount: changesets.files.length,
            currentVersion: readCurrentVersion(root),
            bumpLevels: changesets.levels,
            tags: readTags(root),
            publishedVersions: npm.versions,
            mainIsAncestorOfNext: ancestry.value,
            treeClean: tree.clean,
            gateResults: gates.results,
        },
        detail: { dirtyPaths: tree.paths, packages, ancestry, gateOutput: gates.output },
    };
}

// ── The mutations (`--apply` only) ──────────────────────────────────────────────────────────────

/** Run a command, inheriting stdio, and turn a non-zero exit into a described failure. */
function runOrThrow(root, command, args) {
    try {
        execFileSync(command, args, { cwd: root, stdio: 'inherit' });
    } catch (error) {
        throw new Error(
            `release-prep: \`${command} ${args.join(' ')}\` failed (exit ${error.status ?? '?'}). ` +
                'The working tree is left as it is — inspect it before re-running.',
            { cause: error },
        );
    }
}

/**
 * The local half of cutting the release: bump, relock, verify, commit.
 *
 * It does not create the branch and it does not push. The workflow creates `release/v<version>`
 * before calling this and pushes afterwards, which is what keeps every remote identity — and every
 * credential — outside this file.
 *
 * The postconditions run BEFORE the commit deliberately: a failure then leaves the bump in the
 * working tree, uncommitted, where it can be read and fixed, rather than inside a commit someone
 * has to unpick.
 */
function applyRelease(root, assessment) {
    const expectedNames = publishablePackages(root).map((p) => p.name);

    runOrThrow(root, 'pnpm', ['run', 'version']);
    // The bumped internal pins have to reach the lockfile in the same commit; linkWorkspacePackages
    // resolves them locally, so this is a lockfile write and not an install.
    runOrThrow(root, 'pnpm', ['install', '--lockfile-only']);

    const appSync = spawnSync('node', [join(root, 'scripts', 'sync-app-version.mjs'), '--check'], {
        cwd: root,
        encoding: 'utf8',
    });
    if (appSync.error) {
        throw new Error(`release-prep could not run sync-app-version.mjs --check: ${appSync.error.message}`, {
            cause: appSync.error,
        });
    }
    const problems = checkPostconditions({
        packages: publishablePackages(root),
        expectedNames,
        predictedVersion: assessment.version,
        remainingChangesets: readChangesets(root).files,
        appSyncExitCode: appSync.status === null ? 1 : appSync.status,
    });
    if (problems.length > 0) {
        throw new Error(
            `release-prep: the bump ran but did not produce what was predicted.\n${problems.map((p) => `  ✗ ${p}`).join('\n')}\n\n` +
                'Nothing has been committed. The bump is in the working tree.',
        );
    }

    runOrThrow(root, 'git', ['add', '-A']);
    runOrThrow(root, 'git', ['commit', '-m', `Release v${assessment.version}`]);
    console.log(`\nCommitted Release v${assessment.version}. Nothing has been pushed — that is the workflow's job.`);
}

// ── Reporting ───────────────────────────────────────────────────────────────────────────────────

function printReport(assessment, gateResults, detail) {
    const gatesLine = GATE_SCRIPTS.map((gate) => `${gate} ${gateResults[gate] === 0 ? '✓' : '✗'}`).join('  ');
    console.log('\nRelease readiness\n');
    console.log(`  current version   v${assessment.currentVersion}`);
    console.log(
        `  changesets        ${assessment.changesetCount}` +
            (assessment.bumpLevel === null ? '' : ` (strongest bump: ${assessment.bumpLevel})`),
    );
    console.log(`  next version      ${assessment.version === null ? '—' : `v${assessment.version}`}`);
    console.log(`  release branch    ${assessment.branch ?? '—'}`);
    console.log(`  working tree      ${detail.dirtyPaths.length === 0 ? 'clean' : `${detail.dirtyPaths.length} uncommitted path(s)`}`);
    for (const entry of detail.dirtyPaths.slice(0, 10)) {
        console.log(`                      ${entry}`);
    }
    if (detail.dirtyPaths.length > 10) {
        console.log(`                      … and ${detail.dirtyPaths.length - 10} more`);
    }
    console.log(`  main ⊆ next       ${detail.ancestry.detail}`);
    console.log(`  gates             ${gatesLine}`);

    for (const gate of GATE_SCRIPTS) {
        if (gateResults[gate] !== 0 && detail.gateOutput[gate]) {
            console.log(`\n  ── ${gate} said ──\n${detail.gateOutput[gate].split('\n').map((l) => `  ${l}`).join('\n')}`);
        }
    }

    if (assessment.ready) {
        console.log(`\n✅ READY — v${assessment.version} can be cut on ${assessment.branch}.`);
        console.log('   `node scripts/release-prep.mjs --apply` performs the bump, the relock and the commit.');
        return;
    }
    console.log(`\n⛔ NOT READY — ${assessment.blockers.length} blocker(s):\n`);
    for (const blocker of assessment.blockers) {
        console.log(`  ✗ ${blocker}\n`);
    }
}

/** The three facts the workflow needs from this run. Empty rather than absent when unknown. */
function writeGithubOutput({ ready, version, branch }) {
    if (!process.env.GITHUB_OUTPUT) {
        return;
    }
    appendFileSync(process.env.GITHUB_OUTPUT, `ready=${ready}\nversion=${version ?? ''}\nbranch=${branch ?? ''}\n`);
}

// ── CLI ─────────────────────────────────────────────────────────────────────────────────────────

function parseMode(argv) {
    const known = new Set(['--plan', '--apply']);
    if (argv.some((arg) => !known.has(arg))) {
        throw new Error(`release-prep: unrecognised argument(s) ${argv.join(' ')}. Usage: release-prep.mjs [--plan | --apply]`);
    }
    // `--plan --apply` names both modes at once. Guessing which one was meant is guessing about a
    // command that mutates the repository, so it refuses instead.
    if (argv.includes('--plan') && argv.includes('--apply')) {
        throw new Error('release-prep: --plan and --apply are different modes; pass one');
    }
    return argv.includes('--apply') ? 'apply' : 'plan';
}

function main(argv) {
    const mode = parseMode(argv);
    let facts;
    let assessment;
    try {
        facts = gatherFacts(REPO_ROOT);
        assessment = assessRelease(facts.inputs);
    } catch (error) {
        console.error(`\n⛔ release-prep could not assess this checkout: ${error.message}`);
        if (error.cause) {
            console.error(`   cause: ${error.cause.message ?? error.cause}`);
        }
        writeGithubOutput({ ready: false, version: null, branch: null });
        // `--plan` is a signal, not a gate: it answers "is a release due?" — run by hand as
        // `pnpm run release:plan` and by release-prep.yml before it cuts anything — and a checkout it
        // cannot read is reported, not thrown. It has already said what went wrong, on stderr, and
        // reported `ready=false`, which release-prep.yml's guard step refuses to proceed on.
        return mode === 'plan' ? 0 : 1;
    }

    printReport(assessment, facts.inputs.gateResults, facts.detail);
    writeGithubOutput(assessment);

    if (mode === 'plan') {
        return 0;
    }
    if (!assessment.ready) {
        // Deliberately not a second derivation of the same decision: --apply asks assessRelease the
        // same question --plan does and refuses on the same answer.
        console.error('\nRefusing to cut a release with blockers outstanding.');
        return 1;
    }
    applyRelease(REPO_ROOT, assessment);
    return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    try {
        process.exitCode = main(process.argv.slice(2));
    } catch (error) {
        console.error(`\n⛔ ${error.message}`);
        if (error.cause) {
            console.error(`   cause: ${error.cause.message ?? error.cause}`);
        }
        process.exitCode = 1;
    }
}
