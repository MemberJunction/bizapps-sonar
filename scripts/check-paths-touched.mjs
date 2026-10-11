#!/usr/bin/env node
/**
 * Answers one question for a workflow whose job is too expensive to run unconditionally (today only
 * build.yml's `scope` job; distribution-gate.yml's steps are all cheap, so it runs them always):
 * did this diff touch anything matching these patterns?
 *
 * ── WHY THIS IS A SCRIPT WITH A SPEC AND NOT A `grep -qE` IN YAML ────────────────────────────────
 * In bizapps-forms the gate jobs have been REQUIRED checks since #173, and Sonar's become required once
 * the planned required-checks rules land (docs/release.md, admin setup). For a required check the two
 * skip mechanisms are not symmetric:
 *
 *   - A workflow skipped by an `on: paths:` filter creates NO check run. The pull request sits on
 *     "Expected — Waiting for status" and can never be merged.
 *   - A job skipped by a job-level `if:` reports conclusion `skipped`, which a required status
 *     check treats as PASSING.
 *
 * So the filtering moved out of `on:` and into the job — and that makes a wrong answer here
 * dangerous in a way it never was before. Answer `false` when the diff really was relevant and the
 * expensive job is skipped, reports SUCCESS, and the pull request goes green having built nothing.
 * That is a silently-green gate, which is the failure this repository keeps re-fixing.
 *
 * Therefore: every uncertainty resolves to `true`. An unreadable diff, a missing or all-zeroes base
 * or head SHA (the all-zeroes case shows up on a brand-new branch's parent, or a still-forming ref
 * on the other side), an empty pattern list — all run the job. The cost of a wrong `true` is runner
 * minutes. The cost of a wrong `false` is a lie.
 *
 * ── NODE STDLIB ONLY ────────────────────────────────────────────────────────────────────────────
 * Like every other gate here: no dependencies, no marketplace action, so a dependency problem can
 * never be the reason nobody finds out the build did not run. `git` is the single external binary
 * and its absence is treated as an unreadable diff, i.e. fail open.
 *
 * ── PATTERN SYNTAX ──────────────────────────────────────────────────────────────────────────────
 * Deliberately two forms, not a glob engine. A trailing `/` means prefix ("packages/"); anything
 * else must match a changed path exactly ("turbo.json"). That is every shape a caller needs,
 * and a glob engine nobody needs is a second thing to get wrong.
 */
import { spawnSync } from 'node:child_process';

const ALL_ZEROES = /^0{40}$/;

/** Pure. Does any changed path match any pattern? */
export function pathsTouched({ changed, patterns }) {
    return changed.some((path) =>
        patterns.some((pattern) =>
            pattern.endsWith('/') ? path.startsWith(pattern) : path === pattern,
        ),
    );
}

/**
 * Pure. The whole fail-open policy lives here so the spec can pin it without a git repository.
 * `changedOrNull` is `null` when the diff could not be read at all.
 */
export function resolveDecision({ baseSha, headSha, changedOrNull, patterns }) {
    if (!baseSha || !headSha || ALL_ZEROES.test(baseSha) || ALL_ZEROES.test(headSha)) return true;
    if (changedOrNull === null) return true;
    if (patterns.length === 0) return true;
    return pathsTouched({ changed: changedOrNull, patterns });
}

/** The decision as a `GITHUB_OUTPUT` line, so a workflow can append the output as it is. */
export function formatOutput(relevant) {
    return `relevant=${relevant}\n`;
}

/**
 * Returns the changed paths, or `null` if git could not tell us. Fails open (see above), but never
 * silently: git's own refusal goes to stderr, so a job that ran "because the diff was unreadable"
 * says why, instead of looking exactly like a diff that was relevant.
 */
function readChangedPaths(baseSha, headSha) {
    const result = spawnSync('git', ['diff', '--name-only', baseSha, headSha], {
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
    });
    if (result.error || result.status !== 0) {
        const why = result.error?.message ?? (result.stderr.trim() || `exit ${result.status}`);
        process.stderr.write(
            `check-paths-touched: git diff --name-only ${baseSha} ${headSha} failed; treating the diff as ` +
                `relevant (fail open). git said: ${why}\n`,
        );
        return null;
    }
    return result.stdout.split('\n').map((line) => line.trim()).filter(Boolean);
}

// `import.meta.main` needs Node 24+. The workflows pin 24, but package.json's `engines` allows
// Node >=18 locally, so compare argv instead.
if (process.argv[1] && process.argv[1].endsWith('check-paths-touched.mjs')) {
    const [baseSha = '', headSha = '', ...patterns] = process.argv.slice(2);
    process.stdout.write(
        formatOutput(resolveDecision({ baseSha, headSha, changedOrNull: readChangedPaths(baseSha, headSha), patterns })),
    );
}
