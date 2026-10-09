#!/usr/bin/env node
/**
 * RELEASE CADENCE: ONE consolidated `Metadata_Sync` per release — no more, and not zero when
 * `metadata/` moved.
 *
 * bizapps-forms (MemberJunction/bizapps-forms#105) moved metadata seeding to MJ's release-time
 * model: a PR carries declarative JSON, and the build engineer generates ONE consolidated seed per
 * release. `check-release-seed-coverage.mjs` asks whether the seed carries every declared record.
 * It cannot ask the question THIS file exists for, and the difference is the reason both are needed:
 *
 *   coverage — "is this ID named by some shipped migration?"   Blind to WHICH migration names it.
 *   cadence  — "did we ship one consolidated seed, or a pile of per-PR deltas?"
 *
 * A per-PR delta sitting in `migrations/` satisfies coverage perfectly — the ids ARE in a shipped
 * file — while being exactly the cadence release-time metadata sync abolished. Coverage would go
 * green over it forever.
 *
 * WHY "UNRELEASED" IS THE LINE, NOT "EXISTS". A seed that has been released is append-only history:
 * hosts ran it, and deleting it changes what an already-migrated database believes it ran. A seed
 * that exists only on `next` has reached nobody, so it is still editable — and it is the release's
 * job to fold it into the consolidated seed rather than ship the old cadence one more time.
 *
 * TWO RULES, because "exactly one" is only correct when something changed:
 *
 *   findUnconsolidatedSeedDeltas — at most one unreleased seed. Two or more = the per-PR loop
 *                                  came back.
 *   findUnshippedMetadataDrift   — `metadata/` moved since the last release tag, so a seed is
 *                                  OWED. Zero unreleased seeds is then a release that silently
 *                                  ships none of it.
 *   findStaleOrEmptySeeds        — the unreleased seed must CARRY something and be CURRENT: an
 *                                  empty file fails, and so does any metadata record changed after
 *                                  the seed's last commit. "A seed exists" is not "the seed has it".
 *
 * WHY THE SECOND RULE EARNS ITS KEEP, when coverage already reads `metadata/`. Coverage compares
 * declared **ids** against shipped SQL, so it is structurally blind to an EDITED record whose id
 * already ships. That is not hypothetical in bizapps-forms — it is what
 * MemberJunction/bizapps-forms#111 was about: a migration shipped the AI Designer prompt saying
 * `Signature`, `metadata/` had moved on to `Doodle` (MemberJunction/bizapps-forms#97 renamed the
 * type), the id was identical throughout, and coverage stayed green over it. The consolidated seed
 * that resolved MemberJunction/bizapps-forms#111 is what finally carried the correction to a host.
 * Drift and staleness are the checks that see that class of gap — and only by ORDER: they ask whether
 * a record moved after the last release and after the seed, never whether the seed's SQL actually
 * carries the change. A seed committed after an edit but generated without it still passes (the
 * spec pins that). Only replaying the chain on a clean database proves content
 * (migrations/README.md step 5).
 *
 * WHY IT IS NOT THE HASH MANIFEST MemberJunction/bizapps-forms#105 KILLED. The manifest stored
 * hashes IN THE REPO, so regenerating them was the way to make the gate quiet — and doing that
 * without regenerating the seed was the silent pass. This stores nothing. The answer is derived from
 * git history, and the only way to make it green is to actually ship a seed or actually revert the
 * metadata change.
 *
 * This needs git (tags are the only record of what shipped), which is why it is a SEPARATE command
 * from the coverage check — that one is deliberately pure-fs and runs on any checkout, and folding
 * git into it would break that. Both run at the release, in publish.yml, and nowhere else.
 *
 * WHY SONAR NEEDS IT. Sonar used to deliver every metadata change as a hand-written forward
 * migration, gated per PR by a content-hash manifest (`migrations/metadata-seed.manifest.json`,
 * retired). That kept metadata-only PRs red by design and produced exactly the per-PR delta cadence
 * this file exists to stop. The hand-written forward migrations already released stay as history;
 * none may be added.
 *
 * Ported from bizapps-common, itself ported from bizapps-forms (MemberJunction/bizapps-forms#105 and
 * MemberJunction/bizapps-forms#111).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { stripSqlComments } from '../.github/scripts/strip-sql-comments.mjs';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
/**
 * `Seed_App_Metadata` is Sonar's v0.1 seed name. That file is released, so it never counts as
 * unreleased — but a NEW file under that name would be a seed by another name, and must not slip
 * past the one-seed-per-release rule.
 */
const SEED_PATTERN = /(Metadata_Sync|Seed_App_Metadata).*\.sql$/i;

function git(repoRoot, args) {
    return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

/** `v0.10.0-rc.1` → core [0,10,0] plus the prerelease `rc.1`. A non-numeric core part scores -1 so
 *  junk tags (`v-latest`, `vNEXT`) sort below every real version rather than above them. */
function parseVersion(tag) {
    const raw = tag.replace(/^v/, '');
    const dash = raw.indexOf('-');
    const core = (dash === -1 ? raw : raw.slice(0, dash)).split('.').map((n) => (/^\d+$/.test(n) ? Number(n) : -1));
    return { core, pre: dash === -1 ? null : raw.slice(dash + 1) };
}

/**
 * Semver order, and the prerelease rule is the whole reason this is not a one-liner: `0.10.0-rc.1`
 * is LOWER than `0.10.0` (semver §11). Getting that backwards picks the rc as the release baseline,
 * so everything shipped in the final looks unreleased and the gate fails the release that did
 * everything right. A gate that cries wolf is one somebody switches off. The MJ family tags
 * prereleases (`6.1.0-edge.4`, this repo's own `@memberjunction/*` pin), so this is a shape this repo will
 * meet.
 */
function compareVersions(a, b) {
    const [x, y] = [parseVersion(a), parseVersion(b)];
    for (let i = 0; i < Math.max(x.core.length, y.core.length); i++) {
        const d = (x.core[i] ?? 0) - (y.core[i] ?? 0);
        if (d !== 0) return d;
    }
    if (x.pre === null || y.pre === null) return (x.pre === null ? 1 : 0) - (y.pre === null ? 1 : 0);

    const [xs, ys] = [x.pre.split('.'), y.pre.split('.')];
    for (let i = 0; i < Math.max(xs.length, ys.length); i++) {
        const [p, q] = [xs[i], ys[i]];
        if (p === undefined || q === undefined) return p === undefined ? -1 : 1;
        const bothNumeric = /^\d+$/.test(p) && /^\d+$/.test(q);
        if (bothNumeric) {
            const d = Number(p) - Number(q);
            if (d !== 0) return d;
        } else if (p !== q) {
            return p < q ? -1 : 1;
        }
    }
    return 0;
}

/**
 * The git boundary, and deliberately dumb: it reports which migration files exist at the newest
 * release tag and in the working tree, and which files under `metadata/` differ between the two.
 * It decides nothing. Which files count as a SEED, and which count as a RECORD, is domain
 * knowledge that lives in the rules below — a boundary that pre-filtered would make them
 * untestable without a git repository, and would let a stub disagree with production about the
 * definitions the checks turn on.
 */
export function readReleaseState(repoRoot) {
    const tags = git(repoRoot, ['tag', '--list', 'v*'])
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean)
        .sort(compareVersions);
    if (tags.length === 0) return { tag: null, released: [], current: [] };

    const tag = tags[tags.length - 1];
    const listMigrations = (ref) =>
        git(repoRoot, ['ls-tree', '--name-only', ref, 'migrations/'])
            .split('\n')
            .map((f) => f.trim().replace(/^migrations\//, ''))
            .filter(Boolean);

    // No `HEAD` argument: `git diff <tag> -- <path>` compares the tag against the WORKING TREE, so
    // an edit the engineer has not committed yet still counts. Untracked files are the one thing
    // this cannot see; a brand-new record with a brand-new id is caught by the coverage check.
    const metadataChanged = git(repoRoot, ['diff', '--name-only', tag, '--', 'metadata/'])
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

    const migrationsDir = join(repoRoot, 'migrations');
    const current = existsSync(migrationsDir) ? readdirSync(migrationsDir) : [];

    return { tag, released: listMigrations(tag), current, metadataChanged };
}

export function findUnconsolidatedSeedDeltas(repoRoot = REPO_ROOT, readState = readReleaseState) {
    let state;
    try {
        state = readState(repoRoot);
    } catch (error) {
        // Never a silent pass: if we cannot read what shipped, we do not know the answer.
        return { problems: [`could not read git history to determine what has been released: ${error.message}`], tag: null, unreleased: [] };
    }

    if (state.tag === null) {
        return {
            problems: ['no v* release tag found, so "what has already shipped" has no answer here. A shallow clone without tags cannot run this check — fetch tags, or run it where they exist.'],
            tag: null,
            unreleased: [],
        };
    }

    // SEED_PATTERN is applied HERE, not at the boundary. Ordinary DDL and CodeGen metadata backfills
    // (`…Element_Parity_Metadata_Backfill.sql`, `…Rename_Signature_Question_To_Doodle.sql`) ship per
    // feature by design and are none of this rule's business.
    const released = new Set(state.released.filter((f) => SEED_PATTERN.test(f)));
    const unreleased = state.current.filter((f) => SEED_PATTERN.test(f) && !released.has(f)).sort();
    const problems = [];
    if (unreleased.length > 1) {
        problems.push(
            `${unreleased.length} unreleased Metadata_Sync migrations, but a release ships ONE consolidated seed (MemberJunction/bizapps-forms#105).\n` +
                unreleased.map((f) => `      ${f}`).join('\n') +
                `\n\n  None of these is in ${state.tag}, so none has reached a host and none is append-only history yet.\n` +
                '  Fold them into ONE consolidated seed, delete these per-PR deltas, and re-run.\n' +
                '  Generate against the shipped chain at HEAD but WITHOUT the files listed above.\n' +
                '  They are already applied on a plain `mj app install`, and a record one of them\n' +
                '  created matches metadata/ exactly — so the push emits nothing for it, and deleting\n' +
                '  the delta then strands it with no migration naming it. migrations/README.md.',
        );
    }
    return { problems, tag: state.tag, unreleased };
}

/**
 * Records only. `metadata/README.md` is prose about the directory, not a record in it, and a
 * documentation edit owes no seed — gating on it would teach people that the way to quiet this
 * check is to not write documentation. `.backups/` and `sql_logging/` are push by-products, ignored
 * for the same reason `check-release-seed-coverage.mjs` ignores them.
 */
function isRecordPath(file) {
    if (/(^|\/)README\.md$/i.test(file)) return false;
    if (/(^|\/)\.mj-sync\.json$/.test(file)) return false;
    return !/(^|\/)(\.backups|sql_logging)(\/|$)/.test(file);
}

export function findUnshippedMetadataDrift(repoRoot = REPO_ROOT, readState = readReleaseState) {
    let state;
    try {
        state = readState(repoRoot);
    } catch (error) {
        return { problems: [`could not read git history to compare metadata/ against the last release: ${error.message}`], tag: null, changed: [] };
    }
    if (state.tag === null) {
        return {
            problems: ['no v* release tag found, so "has metadata/ moved since the last release?" has no answer here. Fetch tags, or run it where they exist.'],
            tag: null,
            changed: [],
        };
    }

    const changed = (state.metadataChanged ?? []).filter(isRecordPath).sort();
    const unreleasedSeeds = state.current.filter((f) => SEED_PATTERN.test(f) && !new Set(state.released).has(f));
    const problems = [];
    if (changed.length > 0 && unreleasedSeeds.length === 0) {
        problems.push(
            `${changed.length} metadata record file(s) changed since ${state.tag}, but this release ships NO new Metadata_Sync.\n` +
                changed.map((f) => `      ${f}`).join('\n') +
                '\n\n  Coverage cannot catch this: it compares declared ids against shipped SQL, and an EDITED\n' +
                '  record keeps its id. Generate the consolidated seed (migrations/README.md) — the push emits\n' +
                '  spUpdate* for edited records by construction, which is the half no id check can see.',
        );
    }
    return { problems, tag: state.tag, changed };
}

/**
 * The git and file facts about ONE unreleased seed: its text, the commit that last touched it (`null`
 * while the file is uncommitted or edited since), and every `metadata/` path whose content differs
 * between that commit and the working tree — i.e. changed AFTER the seed. A diff against the tree
 * rather than a log of later commits, so an uncommitted edit counts, and a record reverted to the
 * seed's content does not. Deliberately dumb, like readReleaseState: which paths are records is the
 * rule's business.
 */
export function readSeedFacts(repoRoot, file) {
    const rel = `migrations/${file}`;
    const text = readFileSync(join(repoRoot, rel), 'utf8');
    const dirty = git(repoRoot, ['status', '--porcelain', '--', rel]).trim() !== '';
    const lastCommit = dirty ? null : git(repoRoot, ['log', '-1', '--format=%H', '--', rel]).trim() || null;
    const changedSince = lastCommit === null
        ? []
        : git(repoRoot, ['diff', '--name-only', lastCommit, '--', 'metadata/']).split('\n').map((f) => f.trim()).filter(Boolean);
    return { text, lastCommit, changedSince };
}

/**
 * Is the release's unreleased seed EMPTY, or OLDER than a metadata record change? The two rules above
 * accept any file named `…Metadata_Sync…sql` as the seed, so an empty one passed, and so did one
 * generated before a later metadata PR merged — and coverage cannot back that up for records keyed
 * by `@lookup:` instead of a UUID, whose edit then ships in no migration with every gate green.
 *
 * An uncommitted seed is exempt from the staleness half: it is the one just generated from the tree
 * on disk, and there is no older commit for a record change to postdate. CI checks a committed tree.
 */
export function findStaleOrEmptySeeds(repoRoot = REPO_ROOT, readState = readReleaseState, readSeed = readSeedFacts) {
    let state;
    try {
        state = readState(repoRoot);
    } catch (error) {
        return { problems: [`could not read git history to find the release seed: ${error.message}`], seeds: [] };
    }
    if (state.tag === null) {
        return { problems: ['no v* release tag found, so which seed is unreleased has no answer here. Fetch tags, or run it where they exist.'], seeds: [] };
    }
    const released = new Set(state.released);
    const unreleased = state.current.filter((f) => SEED_PATTERN.test(f) && !released.has(f)).sort();
    const problems = [];
    for (const file of unreleased) {
        let facts;
        try {
            facts = readSeed(repoRoot, file);
        } catch (error) {
            problems.push(`could not read the release seed ${file}: ${error.message}`);
            continue;
        }
        if (stripSqlComments(facts.text).trim() === '') {
            problems.push(
                `${file} is the release's unreleased Metadata_Sync, but it holds no SQL — only whitespace or comments. ` +
                    'An empty seed ships nothing. Regenerate it (migrations/README.md).',
            );
        }
        const newer = facts.changedSince.filter((f) => f.startsWith('metadata/') && isRecordPath(f)).sort();
        if (newer.length > 0) {
            problems.push(
                `${newer.length} metadata record file(s) changed after ${file} was last committed (${facts.lastCommit.slice(0, 10)}):\n` +
                    newer.map((f) => `      ${f}`).join('\n') +
                    '\n\n  The seed predates them, so it cannot carry them — and a record keyed by @lookup: instead of a UUID has no id\n' +
                    '  for the coverage check to miss. Regenerate the consolidated seed from the tree as it is now (migrations/README.md).',
            );
        }
    }
    return { problems, seeds: unreleased };
}

// Compared through realpath, not as a `file://` string: that string is never equal under a path with
// spaces (percent-encoded in the URL) or a symlink, and the gate would then silently exit 0.
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
    const cadence = findUnconsolidatedSeedDeltas();
    const drift = findUnshippedMetadataDrift();
    const staleness = findStaleOrEmptySeeds();
    const problems = [...cadence.problems, ...drift.problems, ...staleness.problems];
    if (problems.length > 0) {
        console.error('\n❌ Release seed cadence failed:\n');
        for (const p of problems) console.error(`  • ${p}\n`);
        process.exit(1);
    }
    console.log(
        `✅ Release seed cadence passed — ${cadence.unreleased.length} unreleased Metadata_Sync migration(s) since ${cadence.tag}, ` +
            `and ${drift.changed.length} changed metadata record file(s): a release ships exactly one seed when metadata moved, and at most one always; ` +
            'the seed holds SQL and no record changed after it.',
    );
}
