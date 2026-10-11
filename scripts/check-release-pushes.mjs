#!/usr/bin/env node
/**
 * Refuse any push to a ruleset-protected branch from the release path.
 *
 * Sonar's release path reaches `main` and `next` only through pull requests. This lint keeps it
 * that way. Sonar's one ruleset today (`protect-release-branches`, covering `refs/heads/main` and
 * `refs/heads/next`) carries only the deletion and non_fast_forward rules, so a direct push would
 * still succeed right now; the lint exists so the release path is already PR-based when required
 * status checks and a PR rule are added (a planned admin follow-up).
 *
 * Why that matters, from bizapps-forms #173/#177: required status checks are evaluated against the
 * check runs present on the SHA being introduced. On a direct push that SHA does not exist on the
 * remote until the push lands, so no check run can exist for it — a direct push to a ref carrying
 * `required_status_checks` is unsatisfiable by construction (GH013), for any commit, with or
 * without `[skip ci]`. It is not a race that a retry wins. Forms' `ci/commit_push.mjs` pushed the
 * version-bump commit straight to `main` and `ci/merge_main_and_update_lock.mjs` pushed straight to
 * `next`; once Forms added required checks, every release stopped at the version-bump step. Sonar
 * had the same two scripts (`ci/commit_push.mjs`, `ci/merge_main_and_update_lock.mjs`) and they are
 * the pattern this gate prevents. Reintroducing such a push breaks nothing until the ruleset
 * tightens — then it breaks a release, months later, in someone else's pull request.
 *
 * Allowed on purpose: `release/*`, `chore/backmerge-*` and tags. The ruleset does not cover them,
 * and the release PRs they carry go through CI like anyone else's.
 *
 * Tag pushes are deliberately allowed: the ruleset is `target: branch`, scoped to
 * `refs/heads/main` and `refs/heads/next`, so `refs/tags/*` is untouched and the release still
 * tags itself.
 *
 * Plain Node, stdlib only, matching `check-distribution-seed.mjs`: a gate that guards the release
 * must be runnable in CI without installing anything.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The ruleset's two refs, `refs/heads/main` and `refs/heads/next`.
 * Pinned in the spec, because the gate is exactly as good as this list.
 */
export const PROTECTED_BRANCHES = Object.freeze(['main', 'next']);

/**
 * Where release automation lives. Deliberately whole directories rather than the files that happen
 * to be guilty today — the point is that a *new* file cannot reintroduce the push.
 *
 * `scripts/` earns its place from this change itself: Sonar's `ci/` push scripts are deleted and
 * the release derivation moves into `scripts/sync-app-version.mjs` and `scripts/release-prep.mjs`, which
 * `publish.yml` and `release-prep.yml` run. A list that omitted it would have
 * guarded the directory release automation just LEFT while ignoring the one it moved to.
 *
 * `ci/` stays scanned. The push scripts are gone; ci/ still holds the teardown generators
 * (generate_teardown.mjs, extract_ids*.py), so a push script reintroduced beside them must fail
 * this gate. `filesUnder` returns [] for ENOENT, so the entry stays inert if ci/ is ever removed.
 */
export const SCANNED_DIRS = Object.freeze(['.github/workflows', '.github/scripts', 'scripts', 'ci']);

/**
 * The one file allowed to contain protected-branch push strings: this gate's own spec, where they
 * are the fixtures that prove the recogniser works.
 *
 * Excluded BY NAME, not by a `*.spec.mjs` rule. A class rule would let a real push hide in any spec
 * file — precisely the bypass this gate exists to close — whereas a named file fails loudly if it is
 * ever renamed, which is the failure direction to prefer. It is deliberately a list of one; a second
 * entry should have to justify itself here.
 */
export const EXCLUDED_FILES = Object.freeze(['scripts/check-release-pushes.spec.mjs']);

const PROTECTED_ALTERNATION = PROTECTED_BRANCHES.join('|');

/**
 * A refspec target naming a protected branch, and nothing else.
 *
 * The trailing boundary is load-bearing twice over: `mainline` and `next-steps` are ordinary
 * feature branches, and a name that merely begins with a protected one is not that branch.
 *
 * The quote class after `refs/heads/` is for the shell's other concatenation point: a refspec can
 * be quoted as a whole (`"refs/heads/main"`, handled by `REFSPEC_PREFIX`) or only in part
 * (`refs/heads/"main"`). Over-inclusiveness costs nothing here — a needless match is one line a
 * human reads — while under-inclusiveness is the entire bug this gate exists to prevent.
 */
const PROTECTED_TARGET = String.raw`(?:refs\/heads\/['"\`]*)?(${PROTECTED_ALTERNATION})(?![\w./-])`;

/**
 * Where a command can BEGIN. Line start, or any character that ends the command before it.
 *
 * This deliberately does not anchor to the start of the line. An earlier version did — allowing
 * only leading whitespace, a YAML list dash and a `run: ` prefix — which meant a push was invisible
 * unless it was the first token on its line, so `git checkout next && git push origin next`,
 * `git config user.name x; git push origin main` and `execSync('git push origin HEAD:main')` all
 * walked past. The last one matters most: BOTH of bizapps-forms #177's pushes lived in Node scripts, and the
 * deleted `ci/merge_main_and_update_lock.mjs` (Sonar had one too) already shelled out through `execSync`, so that is
 * the likeliest spelling a reintroduction would take.
 *
 * Keeping prose and commented-out history out — of which this repo has a great deal, on purpose —
 * was the anchor's stated job, but `isCommentary` already does it and is the only thing that needs
 * to. Quotes are command starts because a shelled-out command is a string literal.
 */
const COMMAND_START = String.raw`(?:^|[\s;&|(\`'"])\s*`;

/**
 * git's GLOBAL OPTIONS, between `git` and the subcommand. Without this segment they are a straight
 * bypass: `git -c user.email=x push origin main` is ordinary CI, and a release
 * workflow can easily run a separate `git config --global user.email` step that an author could fold
 * into the push exactly that way.
 *
 * Lifted in shape from bizapps-forms' `.claude/hooks/require-green-before-git.mjs`, which found and
 * fixed this same under-inclusiveness first; its docstring is the reasoning. Two arms, because `-C <dir>`
 * and friends put their value in a SEPARATE word and would otherwise break the chain, while the
 * general `-\S+\s+` arm means an unknown option can never cause a miss. The flat form is also
 * deliberate: the obvious `(?:-\S+(?:\s+\S+)?\s+)*` backtracks exponentially on non-matching input.
 */
const GIT_GLOBAL_OPTS =
    String.raw`(?:(?:-[Cc]|--(?:git-dir|work-tree|exec-path|namespace|config-env|attr-source))[=\s]\S+\s+|-\S+\s+)*`;

/**
 * `git push … <protected>` in shell, with or without a `HEAD:` / `<local>:` prefix and any flags.
 *
 * `\s+\S+\s+` between `push` and the target is the REMOTE, and requiring it is what keeps
 * `git push main` — which pushes to a remote *named* main — and a bare `git push` out. Neither
 * names a protected branch; a bare push's destination is its upstream, which no static reader can
 * know. Case-insensitive because macOS and Windows both mount case-insensitively, so `Git push`
 * really does invoke git here.
 *
 * `REFSPEC_PREFIX` is what a refspec may carry before the branch name. Quotes are the reason it
 * exists: `git push origin "HEAD:main"` used to match, but only by accident — the `(?:\S*:)?` group
 * exists to skip a `<local>:` prefix, and on its way to the colon it happened to swallow the
 * opening quote too. A BARE quoted branch has no colon, so that group matched empty and the quote
 * landed exactly where the branch name had to start. The colon form working is precisely what hid
 * the bare form failing, and quoting the refspec is the house style — the tag push in publish.yml is written `git push origin "refs/tags/v$VERSION"`. `\+` is the
 * ordinary force-push shorthand, `git push origin +main`.
 */
const REFSPEC_PREFIX = String.raw`['"\`]*\+?(?:\S*:)?`;

const SHELL_PUSH = new RegExp(
    COMMAND_START + String.raw`git\s+` + GIT_GLOBAL_OPTS +
        String.raw`push\b(?:\s+-{1,2}[\w-]+)*\s+\S+\s+` + REFSPEC_PREFIX + PROTECTED_TARGET,
    'i',
);

/**
 * simple-git's spelling of the same operation: `git.push('origin', 'HEAD:main')`.
 *
 * The optional `[` covers simple-git's array form, `git.push(['origin', 'HEAD:main'])`, which it
 * accepts identically.
 */
const METHOD_PUSH = new RegExp(
    String.raw`\.push\(\s*\[?\s*['"\`][^'"\`]+['"\`]\s*,\s*['"\`]\+?(?:\S*:)?` + PROTECTED_TARGET + String.raw`['"\`]`,
);

/** True when the line is commented out — history and prose, not an instruction. */
function isCommentary(line) {
    return /^\s*(?:#|\/\/|\*|<!--)/.test(line);
}

/**
 * Every push to a protected branch in `text`, as `{ line, ref, snippet }`.
 *
 * Line-by-line rather than whole-file, so a violation can be reported at a line number a reader
 * can go to. Both patterns are single-line by nature — a refspec does not wrap.
 */
export function findProtectedPushes(text) {
    const found = [];
    text.split('\n').forEach((line, index) => {
        if (isCommentary(line)) {
            return;
        }
        const match = SHELL_PUSH.exec(line) ?? METHOD_PUSH.exec(line);
        if (match) {
            found.push({ line: index + 1, ref: match[1], snippet: line.trim() });
        }
    });
    return found;
}

/** Every file under `dir`, recursively. Returns [] for a directory that does not exist. */
function filesUnder(dir) {
    let entries;
    try {
        entries = readdirSync(dir, { withFileTypes: true });
    } catch (error) {
        // ENOENT is a correct answer for a scanned directory that does not exist (ci/, should it
        // ever be removed — today it holds the teardown generators). Anything else — a
        // permission error, a file where a directory was — is a gate that cannot see what it is
        // guarding, and must not pass silently.
        if (error.code === 'ENOENT') {
            return [];
        }
        throw new Error(`check-release-pushes cannot read ${dir}: ${error.message}`, { cause: error });
    }
    return entries.flatMap((entry) => {
        const full = join(dir, entry.name);
        return entry.isDirectory() ? filesUnder(full) : statSync(full).isFile() ? [full] : [];
    });
}

/** Violations across the whole release path, as printable strings. */
export function runCheck(root) {
    const violations = [];
    const exempt = new Set(EXCLUDED_FILES);
    for (const dir of SCANNED_DIRS) {
        for (const file of filesUnder(join(root, dir))) {
            if (exempt.has(relative(root, file).split(sep).join('/'))) {
                continue;
            }
            for (const hit of findProtectedPushes(readFileSync(file, 'utf8'))) {
                violations.push(
                    `${relative(root, file)}:${hit.line}: pushes to '${hit.ref}'. The release path ` +
                        `reaches main/next only via pull requests; once required status checks are added, a ` +
                        `direct push is also rejected (GH013), as in bizapps-forms #177. Route ` +
                        `the change through a pull request, or push a tag instead.\n      ${hit.snippet}`,
                );
            }
        }
    }
    return violations;
}

/** CLI entry point. */
function main() {
    const violations = runCheck(REPO_ROOT);
    if (violations.length > 0) {
        console.error('Release-push gate FAILED:\n');
        for (const v of violations) {
            console.error(`  ✗ ${v}\n`);
        }
        console.error(`${violations.length} violation(s).`);
        process.exit(1);
    }
    console.log(`Release-push gate passed (${SCANNED_DIRS.join(', ')}).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main();
}
